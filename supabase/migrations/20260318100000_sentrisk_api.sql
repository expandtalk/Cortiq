-- Sentrisk API integration
-- Dashboard aggregation function for /v1/dashboard endpoint

CREATE OR REPLACE FUNCTION get_sentrisk_dashboard(
  p_site_id UUID,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pageviews  BIGINT;
  v_sessions   BIGINT;
  v_visitors   BIGINT;
  v_bounced    BIGINT;
  v_avg_dur    FLOAT;
  v_trend      JSONB;
  v_pages      JSONB;
  v_devices    JSONB;
  v_sources    JSONB;
BEGIN
  -- Total pageviews
  SELECT COUNT(*)
  INTO v_pageviews
  FROM page_views
  WHERE site_id = p_site_id
    AND viewed_at BETWEEN p_from AND p_to;

  -- Sessions / unique visitors / bounced / avg duration
  SELECT
    COUNT(*),
    COUNT(DISTINCT session_id),
    COUNT(*) FILTER (WHERE COALESCE(page_views, 1) <= 1),
    COALESCE(AVG(duration_seconds), 0)
  INTO v_sessions, v_visitors, v_bounced, v_avg_dur
  FROM tracking_sessions
  WHERE site_id = p_site_id
    AND started_at BETWEEN p_from AND p_to;

  -- Daily trend (merge page_views + sessions by date)
  WITH daily_pv AS (
    SELECT DATE(viewed_at) AS d, COUNT(*) AS pv
    FROM page_views
    WHERE site_id = p_site_id AND viewed_at BETWEEN p_from AND p_to
    GROUP BY DATE(viewed_at)
  ),
  daily_sess AS (
    SELECT DATE(started_at) AS d, COUNT(*) AS sess
    FROM tracking_sessions
    WHERE site_id = p_site_id AND started_at BETWEEN p_from AND p_to
    GROUP BY DATE(started_at)
  ),
  all_dates AS (
    SELECT d FROM daily_pv
    UNION
    SELECT d FROM daily_sess
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date',      TO_CHAR(ad.d, 'YYYY-MM-DD'),
        'pageviews', COALESCE(dpv.pv, 0),
        'sessions',  COALESCE(ds.sess, 0)
      ) ORDER BY ad.d
    ),
    '[]'::jsonb
  )
  INTO v_trend
  FROM all_dates ad
  LEFT JOIN daily_pv   dpv ON dpv.d = ad.d
  LEFT JOIN daily_sess ds  ON ds.d  = ad.d;

  -- Top pages (up to 20)
  WITH page_stats AS (
    SELECT
      url,
      COALESCE(title, '') AS title,
      COUNT(*)                AS pv,
      COUNT(DISTINCT session_id) AS sess
    FROM page_views
    WHERE site_id = p_site_id AND viewed_at BETWEEN p_from AND p_to
    GROUP BY url, title
    ORDER BY pv DESC
    LIMIT 20
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'path',      url,
        'title',     title,
        'pageviews', pv,
        'sessions',  sess
      )
    ),
    '[]'::jsonb
  )
  INTO v_pages
  FROM page_stats;

  -- Device split
  WITH dc AS (
    SELECT
      LOWER(COALESCE(device_type, 'desktop')) AS dtype,
      COUNT(*) AS cnt
    FROM tracking_sessions
    WHERE site_id = p_site_id AND started_at BETWEEN p_from AND p_to
    GROUP BY LOWER(COALESCE(device_type, 'desktop'))
  ),
  total AS (SELECT NULLIF(SUM(cnt), 0) AS t FROM dc)
  SELECT jsonb_build_object(
    'desktop', ROUND(COALESCE((SELECT cnt FROM dc WHERE dtype = 'desktop'), 0)::NUMERIC
                     / (SELECT t FROM total), 2),
    'mobile',  ROUND(COALESCE((SELECT cnt FROM dc WHERE dtype = 'mobile'),  0)::NUMERIC
                     / (SELECT t FROM total), 2),
    'tablet',  ROUND(COALESCE((SELECT cnt FROM dc WHERE dtype = 'tablet'),  0)::NUMERIC
                     / (SELECT t FROM total), 2)
  )
  INTO v_devices;

  -- Traffic sources (classify by referrer URL)
  WITH src AS (
    SELECT
      CASE
        WHEN referrer IS NULL OR TRIM(referrer) = ''
          THEN 'Direct'
        WHEN referrer ~* '(google\.|bing\.|yahoo\.|duckduckgo\.|baidu\.|yandex\.|ecosia\.)'
          THEN 'Organic Search'
        WHEN referrer ~* '(facebook\.|instagram\.|twitter\.|x\.com|linkedin\.|tiktok\.|youtube\.|pinterest\.|reddit\.|snapchat\.)'
          THEN 'Social'
        ELSE 'Referral'
      END AS source
    FROM tracking_sessions
    WHERE site_id = p_site_id AND started_at BETWEEN p_from AND p_to
  ),
  sc AS (
    SELECT source, COUNT(*) AS cnt
    FROM src
    GROUP BY source
  ),
  total AS (SELECT NULLIF(SUM(cnt), 0) AS t FROM sc)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name',     source,
        'sessions', cnt,
        'share',    ROUND(cnt::NUMERIC / (SELECT t FROM total), 2)
      ) ORDER BY cnt DESC
    ),
    '[]'::jsonb
  )
  INTO v_sources
  FROM sc;

  RETURN jsonb_build_object(
    'pageviews',            COALESCE(v_pageviews, 0),
    'sessions',             COALESCE(v_sessions, 0),
    'visitors',             COALESCE(v_visitors, 0),
    'bounce_rate',          CASE
                              WHEN COALESCE(v_sessions, 0) > 0
                              THEN ROUND(v_bounced::NUMERIC / v_sessions, 2)
                              ELSE 0
                            END,
    'avg_duration_seconds', ROUND(COALESCE(v_avg_dur, 0)),
    'trend',                COALESCE(v_trend,   '[]'::jsonb),
    'pages',                COALESCE(v_pages,   '[]'::jsonb),
    'devices',              COALESCE(v_devices, '{"desktop":0,"mobile":0,"tablet":0}'::jsonb),
    'sources',              COALESCE(v_sources, '[]'::jsonb)
  );
END;
$$;

COMMENT ON FUNCTION get_sentrisk_dashboard IS
  'Returns aggregated analytics for the Sentrisk /v1/dashboard endpoint';
