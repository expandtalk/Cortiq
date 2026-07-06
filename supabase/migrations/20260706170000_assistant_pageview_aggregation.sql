-- P2-8 (remainder, scoped): move the ai-assistant tool queries that scan page_views
-- — the one high-cardinality table (one row per pageview) where the .limit(100000) cap
-- could truncate and the JS reduce could blow memory at scale — into SQL aggregation.
--
-- Scope: only the page_views-backed tools with straightforward group-by semantics
-- (top_pages, top_exit_pages, avg_engagement_time, web_vitals). tracking_sessions-based
-- tools (one row per session, far fewer) and JS-specific ones (top_sources hostname
-- parsing, top_entry_pages capped two-step join) are intentionally left in the function.
--
-- Called by ai-assistant with the service role (which already verified site ownership),
-- so these mirror that: SECURITY INVOKER, filtered by site_id, granted to service_role.

CREATE OR REPLACE FUNCTION public.assistant_top_pages(
  p_site_id uuid, p_since timestamptz, p_until timestamptz, p_limit int, p_url_prefix text DEFAULT NULL
)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.pageviews DESC), '[]'::jsonb)
  FROM (
    SELECT url,
           count(*)                    AS pageviews,
           count(DISTINCT session_id)  AS unique_sessions
    FROM page_views
    WHERE site_id = p_site_id AND viewed_at >= p_since AND viewed_at < p_until
      AND (p_url_prefix IS NULL OR url LIKE p_url_prefix || '%')
    GROUP BY url
    ORDER BY count(*) DESC
    LIMIT p_limit
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.assistant_top_exit_pages(
  p_site_id uuid, p_since timestamptz, p_until timestamptz, p_limit int
)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.exit_sessions DESC), '[]'::jsonb)
  FROM (
    SELECT url, count(*) AS exit_sessions
    FROM page_views
    WHERE site_id = p_site_id AND exit_page = true
      AND viewed_at >= p_since AND viewed_at < p_until
    GROUP BY url
    ORDER BY count(*) DESC
    LIMIT p_limit
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.assistant_avg_engagement(
  p_site_id uuid, p_since timestamptz, p_until timestamptz, p_limit int, p_url_prefix text DEFAULT NULL
)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.pageviews DESC), '[]'::jsonb)
  FROM (
    SELECT url,
           count(*)                                   AS pageviews,     -- rows with time_on_page
           round(avg(time_on_page))                   AS avg_time_on_page_ms,
           CASE WHEN count(scroll_depth) > 0 THEN round(avg(scroll_depth)) ELSE NULL END AS avg_scroll_depth_pct
    FROM page_views
    WHERE site_id = p_site_id AND viewed_at >= p_since AND viewed_at < p_until
      AND time_on_page IS NOT NULL AND time_on_page <> 0   -- JS used `if (time_on_page)` (0 is falsy)
      AND (p_url_prefix IS NULL OR url LIKE p_url_prefix || '%')
    GROUP BY url
    ORDER BY count(*) DESC
    LIMIT p_limit
  ) t;
$$;

-- NOTE: cortiq_web_vitals is intentionally NOT converted — page_views has no lcp/cls
-- columns, so that assistant tool is already broken (it selects non-existent columns
-- and returns empty). Web vitals live in a separate table; fixing that tool is a
-- distinct bug outside this aggregation change.

GRANT EXECUTE ON FUNCTION public.assistant_top_pages(uuid, timestamptz, timestamptz, int, text)      TO service_role;
GRANT EXECUTE ON FUNCTION public.assistant_top_exit_pages(uuid, timestamptz, timestamptz, int)        TO service_role;
GRANT EXECUTE ON FUNCTION public.assistant_avg_engagement(uuid, timestamptz, timestamptz, int, text)  TO service_role;
