-- Fix + aggregate the cortiq_web_vitals assistant tool. It previously selected lcp/cls
-- from page_views, which has no such columns, so the tool was broken and returned empty.
-- Core Web Vitals live in the web_vitals table (page_url, lcp, measured_at, ...). This
-- RPC aggregates there: urls with >=3 LCP samples, avg + p75 LCP, and a status band.

CREATE OR REPLACE FUNCTION public.assistant_web_vitals(
  p_site_id uuid, p_since timestamptz, p_until timestamptz, p_limit int
)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(
           jsonb_build_object('url', page_url, 'avg_lcp_ms', avg_lcp_ms, 'p75_lcp_ms', p75_lcp_ms, 'lcp_status', lcp_status)
           ORDER BY n DESC), '[]'::jsonb)
  FROM (
    SELECT page_url,
           count(*) AS n,
           round(avg(lcp)) AS avg_lcp_ms,
           (array_agg(lcp ORDER BY lcp))[floor(count(*) * 0.75)::int + 1] AS p75_lcp_ms,
           CASE
             WHEN (array_agg(lcp ORDER BY lcp))[floor(count(*) * 0.75)::int + 1] < 2500 THEN 'good'
             WHEN (array_agg(lcp ORDER BY lcp))[floor(count(*) * 0.75)::int + 1] < 4000 THEN 'needs_improvement'
             ELSE 'poor'
           END AS lcp_status
    FROM web_vitals
    WHERE site_id = p_site_id AND lcp IS NOT NULL
      AND measured_at >= p_since AND measured_at < p_until
    GROUP BY page_url
    HAVING count(*) >= 3
    ORDER BY count(*) DESC
    LIMIT p_limit
  ) t;
$$;

GRANT EXECUTE ON FUNCTION public.assistant_web_vitals(uuid, timestamptz, timestamptz, int) TO service_role;
