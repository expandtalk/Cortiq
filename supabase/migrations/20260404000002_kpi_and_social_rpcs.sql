-- ── KPI Monthly Aggregates ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_kpi_monthly(
  p_site_id   uuid,
  p_year      int
)
RETURNS TABLE (
  month          text,       -- '01'–'12'
  sessions       bigint,
  unique_users   bigint,
  page_views     bigint,
  avg_duration   numeric,    -- seconds
  -- channel breakdown (top 8 channels as jsonb array)
  channels       jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security: verify caller owns the site
  IF NOT EXISTS (
    SELECT 1 FROM sites WHERE id = p_site_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  SELECT
    to_char(date_trunc('month', started_at), 'MM')                       AS month,
    COUNT(*)                                                              AS sessions,
    COUNT(DISTINCT session_id)                                            AS unique_users,
    COALESCE(SUM(page_views), 0)                                          AS page_views,
    COALESCE(AVG(duration_seconds), 0)                                    AS avg_duration,
    jsonb_agg(DISTINCT jsonb_build_object(
      'referrer', COALESCE(referrer, '')
    )) FILTER (WHERE referrer IS NOT NULL)                                AS channels
  FROM tracking_sessions
  WHERE
    site_id   = p_site_id
    AND started_at >= (p_year || '-01-01')::timestamptz
    AND started_at <  ((p_year + 1) || '-01-01')::timestamptz
  GROUP BY date_trunc('month', started_at)
  ORDER BY date_trunc('month', started_at);
END;
$$;

-- ── Social Media Monthly Aggregates ───────────────────────────────────────
CREATE OR REPLACE FUNCTION get_social_monthly(
  p_site_id   uuid,
  p_year      int
)
RETURNS TABLE (
  month         text,         -- '01'–'12'
  referrer      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  sessions      bigint,
  unique_users  bigint,
  page_views    bigint,
  avg_duration  numeric,
  bounces       bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sites WHERE id = p_site_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  SELECT
    to_char(date_trunc('month', started_at), 'MM')   AS month,
    COALESCE(referrer, '')                            AS referrer,
    COALESCE(utm_source, '')                          AS utm_source,
    COALESCE(utm_medium, '')                          AS utm_medium,
    COALESCE(utm_campaign, '')                        AS utm_campaign,
    COUNT(*)                                          AS sessions,
    COUNT(DISTINCT session_id)                        AS unique_users,
    COALESCE(SUM(page_views), 0)                      AS page_views,
    COALESCE(AVG(duration_seconds), 0)                AS avg_duration,
    COUNT(*) FILTER (WHERE COALESCE(page_views, 0) <= 1) AS bounces
  FROM tracking_sessions
  WHERE
    site_id = p_site_id
    AND started_at >= (p_year || '-01-01')::timestamptz
    AND started_at <  ((p_year + 1) || '-01-01')::timestamptz
    AND (
      referrer   ILIKE '%facebook%'  OR referrer   ILIKE '%instagram%' OR
      referrer   ILIKE '%linkedin%'  OR referrer   ILIKE '%twitter%'   OR
      referrer   ILIKE '%tiktok%'    OR referrer   ILIKE '%youtube%'   OR
      referrer   ILIKE '%pinterest%' OR referrer   ILIKE '%reddit%'    OR
      utm_source ILIKE '%facebook%'  OR utm_source ILIKE '%instagram%' OR
      utm_source ILIKE '%linkedin%'  OR utm_source ILIKE '%twitter%'   OR
      utm_source ILIKE '%tiktok%'    OR utm_source ILIKE '%youtube%'   OR
      utm_source ILIKE '%pinterest%' OR utm_source ILIKE '%reddit%'    OR
      utm_source ILIKE '%fb'         OR utm_source ILIKE '%ig'         OR
      utm_source = 'x'
    )
  GROUP BY
    date_trunc('month', started_at),
    COALESCE(referrer, ''),
    COALESCE(utm_source, ''),
    COALESCE(utm_medium, ''),
    COALESCE(utm_campaign, '')
  ORDER BY date_trunc('month', started_at), sessions DESC;
END;
$$;

-- Grant execute to authenticated users (RLS is enforced inside function)
GRANT EXECUTE ON FUNCTION get_kpi_monthly(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_social_monthly(uuid, int) TO authenticated;
