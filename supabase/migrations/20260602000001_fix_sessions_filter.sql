-- Fix: remove `browser IS NOT NULL AND os IS NOT NULL` filter that excluded all sessions.
-- track-event never populates these columns → every session was filtered out, causing
-- totalSessions = 0 and engagementRate = 0% despite having real page_views.

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
      -- Cap at 7200s (2h) to exclude outliers from abandoned tabs
      AVG(LEAST(duration_seconds, 7200)) FILTER (
        WHERE duration_seconds > 0
      )                                                                              AS avg_duration,
      AVG(LEAST(duration_seconds, 7200)) FILTER (
        WHERE (duration_seconds > 10 OR page_views > 1)
          AND duration_seconds > 0
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

GRANT EXECUTE ON FUNCTION public.get_analytics_summary(uuid, timestamptz, timestamptz) TO authenticated, anon;
