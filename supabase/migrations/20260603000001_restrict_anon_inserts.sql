-- Drop permissive "anyone can insert" policies on tracking tables.
-- All inserts are handled by Edge Functions using service_role, which bypasses RLS.
-- Direct anonymous inserts from the browser are no longer allowed.

DROP POLICY IF EXISTS "Anyone can create tracking sessions"     ON public.tracking_sessions;
DROP POLICY IF EXISTS "Anyone can create page views"           ON public.page_views;
DROP POLICY IF EXISTS "Anyone can create user interactions"    ON public.user_interactions;
DROP POLICY IF EXISTS "Anyone can create heatmap data"         ON public.heatmap_data;
DROP POLICY IF EXISTS "Anyone can insert tracking events"      ON public.tracking_events;
DROP POLICY IF EXISTS "Anyone can insert AI bot traffic"       ON public.ai_bot_traffic;
DROP POLICY IF EXISTS "Anyone can insert probe signals"        ON public.ai_bot_probe_signals;
DROP POLICY IF EXISTS "Anyone can create form analytics"       ON public.form_analytics;
DROP POLICY IF EXISTS "Anyone can create form field analytics" ON public.form_field_analytics;
DROP POLICY IF EXISTS "Anyone can create form sessions"        ON public.form_sessions;
DROP POLICY IF EXISTS "Anyone can create form field interactions" ON public.form_field_interactions;
DROP POLICY IF EXISTS "Anyone can insert detected cookies"     ON public.detected_cookies;
DROP POLICY IF EXISTS "Anyone can insert detected scripts"     ON public.detected_scripts;

-- Verify service_role still has full access (it bypasses RLS by default — no action needed).
-- Authenticated users retain SELECT on their own sites' data via existing SELECT policies.
