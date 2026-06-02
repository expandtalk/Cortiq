-- Analytics aggregate RPCs — replaces row-fetching in useAnalytics and useRealTimeAnalytics.
-- All counting happens server-side; no rows are returned to the client.

CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  p_site_id  uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_page_views',       pv.total,
    'total_sessions',         s.total,
    'engaged_sessions',       s.engaged,
    'avg_session_duration',   COALESCE(s.avg_duration, 0),
    'avg_engagement_time',    COALESCE(s.avg_engaged_duration, 0),
    'top_pages',              pv.top_pages,
    'device_breakdown',       s.device_breakdown
  )
  INTO v_result
  FROM (
    SELECT
      COUNT(*)                                                         AS total,
      jsonb_agg(
        jsonb_build_object('url', url, 'views', cnt) ORDER BY cnt DESC
      ) FILTER (WHERE rn <= 10)                                        AS top_pages
    FROM (
      SELECT
        url,
        COUNT(*) AS cnt,
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rn
      FROM public.page_views
      WHERE site_id = p_site_id
        AND viewed_at BETWEEN p_from AND p_to
        AND url NOT LIKE '%wp-admin%'
        AND url NOT LIKE '%wp-login%'
        AND url NOT LIKE '%elementor-preview%'
        AND url NOT LIKE '%elementor=%'
        AND url NOT LIKE '%preview=true%'
      GROUP BY url
    ) sub
  ) pv,
  (
    SELECT
      COUNT(*)                                                                       AS total,
      COUNT(*) FILTER (
        WHERE duration_seconds > 10 OR page_views > 1
      )                                                                              AS engaged,
      AVG(duration_seconds)                                                          AS avg_duration,
      AVG(duration_seconds) FILTER (
        WHERE duration_seconds > 10 OR page_views > 1
      )                                                                              AS avg_engaged_duration,
      jsonb_object_agg(
        COALESCE(device_type, 'unknown'),
        cnt
      )                                                                              AS device_breakdown
    FROM (
      SELECT device_type, duration_seconds, page_views,
             COUNT(*) OVER (PARTITION BY COALESCE(device_type, 'unknown')) AS cnt
      FROM public.tracking_sessions
      WHERE site_id = p_site_id
        AND started_at BETWEEN p_from AND p_to
    ) sub
  ) s;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_realtime_stats(
  p_site_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today_start  timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC');
  v_active_since timestamptz := now() - interval '5 minutes';
  v_result       jsonb;
BEGIN
  SELECT jsonb_build_object(
    'active_visitors',   act.cnt,
    'page_views_today',  pv.cnt,
    'top_page',          pv.top_page,
    'device_breakdown',  s.device_breakdown
  )
  INTO v_result
  FROM (
    SELECT COUNT(*) AS cnt
    FROM public.tracking_sessions
    WHERE site_id = p_site_id
      AND last_activity >= v_active_since
  ) act,
  (
    SELECT
      COUNT(*)                                                       AS cnt,
      (SELECT jsonb_build_object('url', url, 'views', COUNT(*))
       FROM public.page_views
       WHERE site_id = p_site_id AND viewed_at >= v_today_start
       GROUP BY url ORDER BY COUNT(*) DESC LIMIT 1)                 AS top_page
    FROM public.page_views
    WHERE site_id = p_site_id
      AND viewed_at >= v_today_start
  ) pv,
  (
    SELECT jsonb_object_agg(device, cnt) AS device_breakdown
    FROM (
      SELECT COALESCE(lower(device_type), 'desktop') AS device, COUNT(*) AS cnt
      FROM public.tracking_sessions
      WHERE site_id = p_site_id
        AND started_at >= v_today_start
      GROUP BY COALESCE(lower(device_type), 'desktop')
    ) sub
  ) s;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Top pages for heatmap selector — all-time, server-side GROUP BY
CREATE OR REPLACE FUNCTION public.get_top_pages(
  p_site_id uuid,
  p_limit   int DEFAULT 20
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('url', url, 'pageViews', cnt)
      ORDER BY cnt DESC
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT url, COUNT(*) AS cnt
    FROM public.page_views
    WHERE site_id = p_site_id
      AND url NOT LIKE '%wp-admin%'
      AND url NOT LIKE '%wp-login%'
      AND url NOT LIKE '%elementor-preview%'
      AND url NOT LIKE '%preview=true%'
    GROUP BY url
    ORDER BY cnt DESC
    LIMIT p_limit
  ) sub;
$$;

-- Aggregated GSC rows — GROUP BY value so each keyword/page appears exactly once
CREATE OR REPLACE FUNCTION public.get_gsc_aggregated(
  p_site_id   uuid,
  p_dimension text,     -- 'query' or 'page'
  p_limit     int DEFAULT 200
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'value',       value,
        'clicks',      total_clicks,
        'impressions', total_impressions,
        'ctr',         CASE WHEN total_impressions > 0 THEN total_clicks::float / total_impressions ELSE 0 END,
        'position',    avg_position
      )
      ORDER BY total_clicks DESC
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT
      value,
      SUM(clicks)::int                                                  AS total_clicks,
      SUM(impressions)::int                                             AS total_impressions,
      ROUND((SUM(position * clicks) / NULLIF(SUM(clicks), 0))::numeric, 1)::float AS avg_position
    FROM public.gsc_data
    WHERE site_id = p_site_id
      AND dimension = p_dimension
    GROUP BY value
    ORDER BY SUM(clicks) DESC
    LIMIT p_limit
  ) sub;
$$;

-- GSC monthly aggregation for KPI dashboard
CREATE OR REPLACE FUNCTION public.get_gsc_monthly(
  p_site_id uuid,
  p_year    int
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'month',       to_char(month_start, 'MM'),
        'clicks',      total_clicks,
        'impressions', total_impressions,
        'avg_position', avg_position
      )
      ORDER BY month_start
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT
      date_trunc('month', period_start)                                   AS month_start,
      SUM(clicks)::int                                                    AS total_clicks,
      SUM(impressions)::int                                               AS total_impressions,
      ROUND((SUM(position * clicks) / NULLIF(SUM(clicks), 0))::numeric, 1)::float AS avg_position
    FROM public.gsc_data
    WHERE site_id = p_site_id
      AND dimension = 'query'
      AND EXTRACT(YEAR FROM period_start) = p_year
    GROUP BY date_trunc('month', period_start)
  ) sub;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_summary(uuid, timestamptz, timestamptz) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_realtime_stats(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_top_pages(uuid, int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_gsc_aggregated(uuid, text, int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_gsc_monthly(uuid, int) TO authenticated, anon;
