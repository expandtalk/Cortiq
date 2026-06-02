-- Bot Detection Infrastructure
-- Three-layer detection: UA pattern matching → IP range matching → behavioral (DB rate check).
--
-- GDPR design:
--   • eu_strict:        no raw IP, no raw UA stored — anonymized IP + coarse UA category only
--   • global_standard:  raw IP (hashed), raw UA allowed — EU visitors auto-upgraded
--   • permissive:       full raw data stored
--
-- Key tables:
--   bot_catalog        shared catalog of known bots/AI agents (pre-populated)
--   bot_detections     per-company detection log (GDPR-aware field suppression)
--   bot_hourly_stats   pre-aggregated counts (no PII — safe for dashboard)

-- ── Bot catalog ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bot_catalog (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT     NOT NULL UNIQUE,   -- slug: 'chatgpt-user'
  display_name  TEXT     NOT NULL,          -- label: 'ChatGPT Browser'
  category      TEXT     NOT NULL
    CONSTRAINT bot_catalog_category_check
    CHECK (category IN (
      'ai_agent',          -- AI browsing agents (ChatGPT, Claude, Perplexity…)
      'search_crawler',    -- Search engine spiders (Googlebot, Bingbot…)
      'seo_tool',          -- Commercial SEO crawlers (Ahrefs, SEMrush…)
      'monitoring',        -- Uptime / health monitoring (UptimeRobot, Pingdom…)
      'training_crawler',  -- LLM training data harvesters (CCBot, GPTBot…)
      'generic_bot'        -- Generic automation (curl, wget, Python-requests…)
    )),
  -- Case-insensitive substring patterns matched against User-Agent string
  ua_patterns   TEXT[]   NOT NULL DEFAULT '{}',
  -- Known IP CIDR ranges operated by this bot (for IP-reputation layer)
  ip_ranges     TEXT[]   NOT NULL DEFAULT '{}',
  description   TEXT,
  vendor        TEXT,
  is_active     BOOLEAN  NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bot_catalog_active_idx ON public.bot_catalog(is_active) WHERE is_active = true;

COMMENT ON TABLE public.bot_catalog IS
  'Global catalog of known bots and AI agents. Shared across all companies. '
  'ua_patterns: case-insensitive substrings matched against User-Agent. '
  'ip_ranges: CIDR ranges known to be operated by this bot.';

-- ── Detection events (per-company, GDPR-aware) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bot_detections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  detected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  bot_catalog_id   UUID        REFERENCES public.bot_catalog(id),
  bot_name         TEXT        NOT NULL,
  bot_category     TEXT        NOT NULL,
  detection_method TEXT        NOT NULL
    CONSTRAINT bot_detections_method_check
    CHECK (detection_method IN ('ua_match', 'ip_match', 'behavioral', 'combined')),
  confidence       NUMERIC(3,2) NOT NULL DEFAULT 1.0
    CONSTRAINT bot_detections_confidence_check
    CHECK (confidence BETWEEN 0 AND 1),
  page_url         TEXT,
  referrer         TEXT,
  country          TEXT,

  -- GDPR: anonymized IP (last octet zeroed for IPv4; /48 prefix for IPv6).
  -- Raw IP is NEVER stored in eu_strict mode.
  ip_anon          TEXT,

  -- GDPR: coarse category stored in all modes (e.g. "Desktop Chrome").
  -- Raw UA is NULL in eu_strict mode.
  ua_category      TEXT,
  raw_user_agent   TEXT,        -- NULL when pipeline_mode = 'eu_strict'

  pipeline_mode    TEXT         NOT NULL DEFAULT 'eu_strict'
);

CREATE INDEX bot_detections_company_time_idx
  ON public.bot_detections(company_id, detected_at DESC);

CREATE INDEX bot_detections_company_category_idx
  ON public.bot_detections(company_id, bot_category, detected_at DESC);

COMMENT ON TABLE public.bot_detections IS
  'Per-company bot detection log. Raw IP/UA suppressed in eu_strict mode. '
  'For aggregate dashboards use bot_hourly_stats (no PII).';

COMMENT ON COLUMN public.bot_detections.ip_anon IS
  'Anonymized IP: IPv4 last-octet zeroed (1.2.3.0), IPv6 first /48 kept. '
  'Never the raw IP in eu_strict pipeline mode.';

COMMENT ON COLUMN public.bot_detections.raw_user_agent IS
  'Full User-Agent string. NULL when pipeline_mode = eu_strict (GDPR). '
  'Stored in global_standard / permissive modes only.';

-- ── Hourly aggregates (no PII) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bot_hourly_stats (
  company_id     UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  hour           TIMESTAMPTZ NOT NULL,
  bot_name       TEXT        NOT NULL,
  bot_category   TEXT        NOT NULL,
  request_count  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (company_id, hour, bot_name)
);

CREATE INDEX bot_hourly_stats_company_hour_idx
  ON public.bot_hourly_stats(company_id, hour DESC);

COMMENT ON TABLE public.bot_hourly_stats IS
  'Pre-aggregated bot request counts by hour. No PII — safe for dashboard queries.';

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- bot_catalog: globally readable (no PII)
ALTER TABLE public.bot_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bot_catalog_read" ON public.bot_catalog FOR SELECT USING (true);

-- bot_detections: company members only
ALTER TABLE public.bot_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bot_detections_select"
  ON public.bot_detections FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

-- Service role inserts (Edge Function uses service_role key)
CREATE POLICY "bot_detections_service_insert"
  ON public.bot_detections FOR INSERT
  WITH CHECK (true);

-- bot_hourly_stats: company members only
ALTER TABLE public.bot_hourly_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bot_hourly_stats_select"
  ON public.bot_hourly_stats FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "bot_hourly_stats_service_insert"
  ON public.bot_hourly_stats FOR INSERT WITH CHECK (true);

CREATE POLICY "bot_hourly_stats_service_update"
  ON public.bot_hourly_stats FOR UPDATE USING (true);

-- ── DB function: match_bot ─────────────────────────────────────────────────────
-- Two-layer detection: UA patterns (confidence 1.0) then IP ranges (0.85).
-- Called by Edge Function; returns empty if no match or invalid inputs.
CREATE OR REPLACE FUNCTION public.match_bot(
  p_user_agent TEXT DEFAULT NULL,
  p_ip         TEXT DEFAULT NULL
)
RETURNS TABLE(
  bot_catalog_id   UUID,
  bot_name         TEXT,
  bot_display_name TEXT,
  bot_category     TEXT,
  detection_method TEXT,
  confidence       NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ip inet;
BEGIN
  -- Layer 1: UA pattern matching (highest confidence, cheapest)
  IF p_user_agent IS NOT NULL AND trim(p_user_agent) <> '' THEN
    RETURN QUERY
    SELECT
      bc.id,
      bc.name,
      bc.display_name,
      bc.category,
      'ua_match'::TEXT,
      1.0::NUMERIC
    FROM public.bot_catalog bc
    WHERE bc.is_active = true
      AND array_length(bc.ua_patterns, 1) > 0
      AND EXISTS (
        SELECT 1 FROM unnest(bc.ua_patterns) AS pat
        WHERE lower(p_user_agent) LIKE '%' || lower(pat) || '%'
      )
    ORDER BY bc.created_at
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;
  END IF;

  -- Layer 2: IP range / reputation matching
  IF p_ip IS NOT NULL AND trim(p_ip) <> '' THEN
    BEGIN
      v_ip := split_part(trim(p_ip), ',', 1)::inet;
    EXCEPTION WHEN OTHERS THEN
      -- Invalid IP — skip silently
      RETURN;
    END;

    RETURN QUERY
    SELECT
      bc.id,
      bc.name,
      bc.display_name,
      bc.category,
      'ip_match'::TEXT,
      0.85::NUMERIC
    FROM public.bot_catalog bc
    WHERE bc.is_active = true
      AND array_length(bc.ip_ranges, 1) > 0
      AND EXISTS (
        SELECT 1 FROM unnest(bc.ip_ranges) AS rng
        WHERE v_ip <<= rng::cidr
      )
    ORDER BY bc.created_at
    LIMIT 1;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.match_bot IS
  'Matches a request against the bot catalog using UA patterns (confidence 1.0) '
  'then IP ranges (0.85). Returns empty if no match. Called from Edge Functions.';

-- ── DB function: upsert_bot_hourly_stats ──────────────────────────────────────
-- Called after each detection to maintain pre-aggregated counts.
-- Uses INSERT ... ON CONFLICT to avoid race conditions.
CREATE OR REPLACE FUNCTION public.upsert_bot_hourly_stats(
  p_company_id   UUID,
  p_bot_name     TEXT,
  p_bot_category TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.bot_hourly_stats (company_id, hour, bot_name, bot_category, request_count)
  VALUES (p_company_id, date_trunc('hour', now()), p_bot_name, p_bot_category, 1)
  ON CONFLICT (company_id, hour, bot_name)
  DO UPDATE SET
    request_count = bot_hourly_stats.request_count + 1,
    bot_category  = EXCLUDED.bot_category;
$$;

-- ── DB function: get_bot_overview ─────────────────────────────────────────────
-- Aggregates detection events by bot for the dashboard.
-- Reads from bot_detections — no raw IPs or UAs returned.
CREATE OR REPLACE FUNCTION public.get_bot_overview(
  p_company_id UUID,
  p_from       TIMESTAMPTZ DEFAULT now() - interval '30 days',
  p_to         TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
  bot_name       TEXT,
  bot_category   TEXT,
  total_requests BIGINT,
  last_seen      TIMESTAMPTZ,
  top_countries  JSONB,
  top_pages      JSONB,
  avg_confidence NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.bot_name,
    MAX(d.bot_category),
    COUNT(*)::BIGINT                                           AS total_requests,
    MAX(d.detected_at)                                        AS last_seen,
    -- top_countries: [{country, count}] ordered by count desc
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object('country', d.country, 'count', country_counts.cnt)
        ORDER BY jsonb_build_object('country', d.country, 'count', country_counts.cnt) DESC
      ) FILTER (WHERE d.country IS NOT NULL),
      '[]'::jsonb
    )                                                          AS top_countries,
    -- top_pages: [{url, count}] ordered by count desc, top 5
    COALESCE(
      (SELECT jsonb_agg(r)
       FROM (
         SELECT jsonb_build_object('url', page_url, 'count', COUNT(*)) AS r
         FROM public.bot_detections bd2
         WHERE bd2.company_id = p_company_id
           AND bd2.bot_name   = d.bot_name
           AND bd2.detected_at BETWEEN p_from AND p_to
           AND bd2.page_url IS NOT NULL
         GROUP BY page_url
         ORDER BY COUNT(*) DESC
         LIMIT 5
       ) sub),
      '[]'::jsonb
    )                                                          AS top_pages,
    ROUND(AVG(d.confidence)::NUMERIC, 2)                      AS avg_confidence
  FROM public.bot_detections d
  -- join for country counts to build the JSONB correctly
  LEFT JOIN (
    SELECT bot_name AS bn, country, COUNT(*) AS cnt
    FROM public.bot_detections
    WHERE company_id = p_company_id
      AND detected_at BETWEEN p_from AND p_to
      AND country IS NOT NULL
    GROUP BY bot_name, country
  ) country_counts ON country_counts.bn = d.bot_name
                   AND country_counts.country = d.country
  WHERE d.company_id = p_company_id
    AND d.detected_at BETWEEN p_from AND p_to
  GROUP BY d.bot_name
  ORDER BY total_requests DESC;
END;
$$;

COMMENT ON FUNCTION public.get_bot_overview IS
  'Aggregated bot overview for the dashboard. Reads from bot_detections — '
  'returns no raw IPs or User-Agents.';

-- ── Data retention ────────────────────────────────────────────────────────────
-- Extend the existing daily retention job to clean bot_detections (730-day default).
-- bot_hourly_stats are kept for 1 year (365 days) — they contain no PII.
CREATE OR REPLACE FUNCTION public.run_bot_detection_retention()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_detections BIGINT;
  deleted_stats      BIGINT;
BEGIN
  -- bot_detections: 730-day retention (GDPR eu_strict default)
  DELETE FROM public.bot_detections WHERE detected_at < now() - interval '730 days';
  GET DIAGNOSTICS deleted_detections = ROW_COUNT;

  -- bot_hourly_stats: 365-day retention (aggregate, no PII, kept longer for trends)
  DELETE FROM public.bot_hourly_stats WHERE hour < now() - interval '365 days';
  GET DIAGNOSTICS deleted_stats = ROW_COUNT;

  RETURN jsonb_build_object(
    'bot_detections_deleted', deleted_detections,
    'bot_hourly_stats_deleted', deleted_stats
  );
END;
$$;

-- Schedule daily cleanup at 03:30 UTC (30 min after main retention job)
SELECT cron.unschedule('daily-bot-detection-retention')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-bot-detection-retention');

SELECT cron.schedule(
  'daily-bot-detection-retention',
  '30 3 * * *',
  'SELECT run_bot_detection_retention()'
);

-- ── Seed: pre-populate bot_catalog ───────────────────────────────────────────
-- AI Agents — CortIQ's core value proposition
INSERT INTO public.bot_catalog (name, display_name, category, ua_patterns, description, vendor) VALUES
  ('chatgpt-user',
   'ChatGPT Browser',
   'ai_agent',
   ARRAY['ChatGPT-User', 'OAI-SearchBot'],
   'OpenAI ChatGPT browsing agent — visits pages to answer user queries in real time.',
   'OpenAI'),

  ('gptbot',
   'GPTBot (OpenAI Crawler)',
   'training_crawler',
   ARRAY['GPTBot'],
   'OpenAI training data crawler. Respects robots.txt GPTBot directive.',
   'OpenAI'),

  ('perplexitybot',
   'Perplexity AI',
   'ai_agent',
   ARRAY['PerplexityBot', 'petalbot'],
   'Perplexity AI search and browsing agent.',
   'Perplexity AI'),

  ('claudebot',
   'Claude (Anthropic)',
   'ai_agent',
   ARRAY['ClaudeBot', 'Claude-Web', 'anthropic-ai'],
   'Anthropic Claude AI agent and web crawler.',
   'Anthropic'),

  ('google-extended',
   'Google Gemini / Bard',
   'ai_agent',
   ARRAY['Google-Extended'],
   'Google extended access for Gemini/Bard AI products. Separate from Googlebot.',
   'Google'),

  ('googlebot',
   'Googlebot',
   'search_crawler',
   ARRAY['Googlebot'],
   'Google search engine crawler.',
   'Google'),

  ('google-inspectiontool',
   'Google Search Console',
   'search_crawler',
   ARRAY['Google-InspectionTool'],
   'Google Search Console URL inspection tool.',
   'Google'),

  ('bingbot',
   'Bingbot / Copilot',
   'search_crawler',
   ARRAY['bingbot', 'BingPreview', 'msnbot'],
   'Microsoft Bing search crawler and Copilot AI browsing agent.',
   'Microsoft'),

  ('meta-external-agent',
   'Meta AI',
   'ai_agent',
   ARRAY['meta-externalagent', 'FacebookBot/1.1'],
   'Meta AI browsing agent and Facebook link crawler.',
   'Meta'),

  ('applebot',
   'Applebot (Siri/Spotlight)',
   'ai_agent',
   ARRAY['Applebot'],
   'Apple web crawler powering Siri, Spotlight, and Apple AI features.',
   'Apple'),

  ('youbot',
   'You.com AI',
   'ai_agent',
   ARRAY['YouBot'],
   'You.com AI search crawler.',
   'You.com'),

  ('cohere-ai',
   'Cohere AI',
   'ai_agent',
   ARRAY['cohere-ai'],
   'Cohere AI crawler.',
   'Cohere'),

  ('bytespider',
   'ByteSpider (TikTok/ByteDance)',
   'training_crawler',
   ARRAY['Bytespider'],
   'ByteDance crawler used for TikTok and Douyin AI features.',
   'ByteDance'),

  ('amazonbot',
   'Amazonbot (Alexa/Rufus)',
   'ai_agent',
   ARRAY['Amazonbot'],
   'Amazon AI crawler powering Alexa and Rufus product search.',
   'Amazon'),

  ('duckduckbot',
   'DuckDuckBot',
   'search_crawler',
   ARRAY['DuckDuckBot'],
   'DuckDuckGo search crawler.',
   'DuckDuckGo'),

  ('yandexbot',
   'YandexBot',
   'search_crawler',
   ARRAY['YandexBot'],
   'Yandex search engine crawler.',
   'Yandex'),

  ('baiduspider',
   'Baiduspider',
   'search_crawler',
   ARRAY['Baiduspider'],
   'Baidu search engine crawler (China).',
   'Baidu'),

  ('ccbot',
   'CommonCrawl',
   'training_crawler',
   ARRAY['CCBot'],
   'Common Crawl foundation crawler — primary training data source for many LLMs.',
   'Common Crawl'),

  ('ia-archiver',
   'Internet Archive (Wayback)',
   'training_crawler',
   ARRAY['ia_archiver', 'archive.org_bot'],
   'Internet Archive crawler for the Wayback Machine.',
   'Internet Archive'),

  ('ahrefsbot',
   'AhrefsBot',
   'seo_tool',
   ARRAY['AhrefsBot'],
   'Ahrefs commercial SEO crawler for backlink analysis.',
   'Ahrefs'),

  ('semrushbot',
   'SemrushBot',
   'seo_tool',
   ARRAY['SemrushBot'],
   'Semrush commercial SEO crawler.',
   'Semrush'),

  ('mj12bot',
   'MajesticBot',
   'seo_tool',
   ARRAY['MJ12bot'],
   'Majestic SEO crawler for backlink data.',
   'Majestic'),

  ('uptimerobot',
   'UptimeRobot',
   'monitoring',
   ARRAY['UptimeRobot'],
   'UptimeRobot uptime monitoring service.',
   'UptimeRobot'),

  ('pingdom',
   'Pingdom',
   'monitoring',
   ARRAY['Pingdom'],
   'Pingdom website monitoring service.',
   'Pingdom'),

  ('python-requests',
   'Python Bot',
   'generic_bot',
   ARRAY['python-requests', 'Python-urllib', 'python/'],
   'Automated Python HTTP clients (requests, urllib). Likely scripted access.',
   NULL),

  ('curl-wget',
   'CLI Tools (curl/wget)',
   'generic_bot',
   ARRAY['curl/', 'Wget/'],
   'curl and wget command-line HTTP clients. Typically developer/scripted access.',
   NULL)

ON CONFLICT (name) DO UPDATE SET
  display_name  = EXCLUDED.display_name,
  ua_patterns   = EXCLUDED.ua_patterns,
  description   = EXCLUDED.description,
  vendor        = EXCLUDED.vendor;
