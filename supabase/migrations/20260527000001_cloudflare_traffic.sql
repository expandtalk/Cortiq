-- Cloudflare server-side traffic log.
-- Populated by the Cloudflare Worker (public/cloudflare-worker.js) via the
-- cloudflare-ingest edge function. Captures ALL requests including bots that
-- never execute JavaScript and therefore never appear in the JS-based tracking.

CREATE TABLE public.cloudflare_traffic (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id      uuid        NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now() NOT NULL,

  url_path     text        NOT NULL DEFAULT '/',
  method       text        NOT NULL DEFAULT 'GET',
  status_code  integer,
  country      text,
  referrer     text,
  user_agent   text,

  -- Classified visitor bucket
  visitor_type text        NOT NULL DEFAULT 'unknown'
    CHECK (visitor_type IN ('human','search_crawler','ai_bot','scraper','monitoring','unknown')),
  bot_name     text,         -- e.g. 'Googlebot', 'GPTBot', 'python-requests'

  -- Asset requests (CSS/JS/images) tracked but separated in UI
  is_asset     boolean     NOT NULL DEFAULT false,
  asset_type   text,

  -- Anonymised network info (GDPR: /24 subnet only, no full IP)
  ip_subnet    text,
  ray_id       text          -- Cloudflare Ray-ID for debugging
);

CREATE INDEX cloudflare_traffic_site_created_idx ON public.cloudflare_traffic(site_id, created_at DESC);
CREATE INDEX cloudflare_traffic_visitor_type_idx ON public.cloudflare_traffic(site_id, visitor_type);

ALTER TABLE public.cloudflare_traffic ENABLE ROW LEVEL SECURITY;

-- Service role (used by edge functions) can insert and read everything
CREATE POLICY "service_role_all_cloudflare_traffic"
  ON public.cloudflare_traffic FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Authenticated users may read traffic for their own sites
CREATE POLICY "authenticated_read_own_cloudflare_traffic"
  ON public.cloudflare_traffic FOR SELECT
  TO authenticated
  USING (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

-- Aggregate summary used by the dashboard widget
CREATE OR REPLACE FUNCTION public.get_cloudflare_traffic_summary(
  p_site_id uuid,
  p_days    integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH counts AS (
    SELECT
      visitor_type,
      COUNT(*) AS n
    FROM public.cloudflare_traffic
    WHERE site_id    = p_site_id
      AND is_asset   = false
      AND created_at > now() - (p_days || ' days')::interval
    GROUP BY visitor_type
  ),
  top_bots AS (
    SELECT bot_name, COUNT(*) AS n
    FROM public.cloudflare_traffic
    WHERE site_id    = p_site_id
      AND is_asset   = false
      AND bot_name   IS NOT NULL
      AND created_at > now() - (p_days || ' days')::interval
    GROUP BY bot_name
    ORDER BY n DESC
    LIMIT 10
  ),
  top_countries AS (
    SELECT country, COUNT(*) AS n
    FROM public.cloudflare_traffic
    WHERE site_id    = p_site_id
      AND is_asset   = false
      AND country    IS NOT NULL
      AND created_at > now() - (p_days || ' days')::interval
    GROUP BY country
    ORDER BY n DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'total',         (SELECT COALESCE(SUM(n),0) FROM counts),
    'by_type',       COALESCE((SELECT jsonb_object_agg(visitor_type, n) FROM counts), '{}'),
    'top_bots',      COALESCE((SELECT jsonb_agg(jsonb_build_object('name', bot_name, 'count', n)) FROM top_bots), '[]'),
    'top_countries', COALESCE((SELECT jsonb_agg(jsonb_build_object('country', country, 'count', n)) FROM top_countries), '[]')
  );
$$;
