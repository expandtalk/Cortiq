-- P2-3: server-side aggregation for dashboard hooks that previously pulled unbounded
-- raw rows over 7-30 days and reduced them in JS. All functions are SECURITY INVOKER,
-- so the existing owner-only RLS on conversion_events / ai_bot_traffic / ai_citations
-- still scopes every result to sites the caller owns — passing another site's id just
-- yields empty aggregates, never another tenant's data.

-- ── useAttributionGap ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_attribution_gap(p_site_id uuid, p_days int DEFAULT 30)
RETURNS TABLE (
  cortiq_conversions bigint,
  hubspot_mqls       bigint,
  pending_upload     bigint,
  uploaded           bigint,
  classified_count   bigint,
  unclassified_count bigint
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT
    count(*),
    count(*) FILTER (WHERE lead_quality IN ('Priority','Qualified')),
    count(*) FILTER (WHERE upload_status = 'pending'),
    count(*) FILTER (WHERE upload_status = 'uploaded'),
    count(*) FILTER (WHERE lead_quality IS NOT NULL),
    count(*) FILTER (WHERE lead_quality IS NULL)
  FROM conversion_events
  WHERE site_id = p_site_id
    AND created_at >= now() - (p_days || ' days')::interval;
$$;

-- ── useLeadQualityPipeline ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_lead_quality_pipeline(p_site_id uuid, p_days int DEFAULT 30)
RETURNS TABLE (
  total_classified   bigint,
  pending            bigint,
  uploaded           bigint,
  skipped_no_consent bigint,
  skipped_no_gclid   bigint,
  failed             bigint,
  last_upload_at     timestamptz,
  priority_count     bigint,
  qualified_count    bigint,
  challenge_count    bigint
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT
    count(*) FILTER (WHERE lead_quality IS NOT NULL),
    count(*) FILTER (WHERE upload_status = 'pending'),
    count(*) FILTER (WHERE upload_status = 'uploaded'),
    count(*) FILTER (WHERE upload_status = 'skipped_no_consent'),
    count(*) FILTER (WHERE upload_status = 'skipped_no_gclid'),
    count(*) FILTER (WHERE upload_status = 'failed'),
    max(uploaded_to_ads_at) FILTER (WHERE upload_status = 'uploaded'),
    count(*) FILTER (WHERE lead_quality = 'Priority'),
    count(*) FILTER (WHERE lead_quality = 'Qualified'),
    count(*) FILTER (WHERE lead_quality = 'Challenge')
  FROM conversion_events
  WHERE site_id = p_site_id
    AND created_at >= now() - (p_days || ' days')::interval;
$$;

-- ── useAIBotTracking ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_ai_bot_tracking(p_site_id uuid, p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  since             timestamptz := now() - (p_days || ' days')::interval;
  total             bigint;
  citation_requests bigint;
  citation_clicks   bigint;
  training          bigint;
  bot_breakdown     jsonb;
  daily             jsonb;
  top_urls          jsonb;
  -- mirrors ASSET_URL_RE in useAIBotTracking.tsx
  asset_re constant text := '(?i)\.(css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|otf|json|xml|txt|pdf|map)(\?|$)';
BEGIN
  SELECT count(*) INTO total
    FROM ai_bot_traffic WHERE site_id = p_site_id AND detected_at >= since;

  SELECT count(*), count(*) FILTER (WHERE clicked) INTO citation_requests, citation_clicks
    FROM ai_citations WHERE site_id = p_site_id AND created_at >= since;

  SELECT count(*) INTO training
    FROM ai_bot_traffic WHERE site_id = p_site_id AND detected_at >= since AND request_type = 'training';

  -- One row per bot name; category = most recent row's request_type (matches the JS,
  -- which takes the category of the first row seen in detected_at-desc order).
  SELECT coalesce(jsonb_agg(to_jsonb(b) ORDER BY b.count DESC), '[]'::jsonb) INTO bot_breakdown
  FROM (
    SELECT
      coalesce(bot_name, bot_type) AS name,
      count(*)                     AS count,
      (array_agg(request_type ORDER BY detected_at DESC))[1] AS category,
      CASE WHEN total > 0 THEN count(*)::float * 100 / total ELSE 0 END AS percentage
    FROM ai_bot_traffic
    WHERE site_id = p_site_id AND detected_at >= since
    GROUP BY coalesce(bot_name, bot_type)
  ) b;

  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.date), '[]'::jsonb) INTO daily
  FROM (
    SELECT to_char(detected_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date, count(*) AS traffic
    FROM ai_bot_traffic
    WHERE site_id = p_site_id AND detected_at >= since
    GROUP BY 1
  ) d;

  SELECT coalesce(jsonb_agg(to_jsonb(u) ORDER BY u.visits DESC), '[]'::jsonb) INTO top_urls
  FROM (
    SELECT url, count(*) AS visits
    FROM ai_bot_traffic
    WHERE site_id = p_site_id AND detected_at >= since
      AND url IS NOT NULL AND url !~ asset_re
    GROUP BY url
    ORDER BY count(*) DESC
    LIMIT 10
  ) u;

  RETURN jsonb_build_object(
    'totalTraffic',     total,
    'citationRequests', citation_requests,
    'trainingCrawlers', training,
    'citationCtr',      CASE WHEN citation_requests > 0 THEN citation_clicks::float * 100 / citation_requests ELSE 0 END,
    'botBreakdown',     bot_breakdown,
    'dailyTrend',       daily,
    'topUrls',          top_urls
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_attribution_gap(uuid, int)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lead_quality_pipeline(uuid, int)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_bot_tracking(uuid, int)        TO authenticated;
