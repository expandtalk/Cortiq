-- Finish the anon-INSERT sweep (audit P1-6).
--
-- 20260603000001 removed the permissive "Anyone can insert" policies on the
-- high-volume tracking tables, and 20260704000001 closed conversion_events. This
-- migration sweeps the remaining WITH CHECK (true) INSERT policies on tables that
-- are written EXCLUSIVELY by service-role Edge Functions (which bypass RLS), so the
-- public anon key can no longer inject rows directly via PostgREST.
--
-- Intentionally NOT touched (they need anon/public INSERT and are already validated):
--   cookie_consents, consent_validations (written by store-consent via the anon key),
--   data_requests, waitlist, leads, subscribers (public-facing forms),
--   ab_test_assignments/results (may be assigned client-side).

DROP POLICY IF EXISTS "Anyone can insert citations"            ON public.ai_citations;
DROP POLICY IF EXISTS "Anyone can insert AI search traffic"    ON public.ai_search_traffic;
DROP POLICY IF EXISTS "System can insert bot analysis"         ON public.ai_bot_analysis;
DROP POLICY IF EXISTS "Anyone can create navigation analytics" ON public.navigation_analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics summary"    ON public.analytics_summary;
DROP POLICY IF EXISTS "System can insert ecommerce events"     ON public.ecommerce_events;
DROP POLICY IF EXISTS "System can insert funnel analytics"     ON public.funnel_analytics;
DROP POLICY IF EXISTS "System can insert event debug logs"     ON public.event_debug_log;
DROP POLICY IF EXISTS "Anyone can create dashboard insights"   ON public.dashboard_insights;
DROP POLICY IF EXISTS "Anyone can create behavioral alerts"    ON public.behavioral_alerts;
DROP POLICY IF EXISTS "Anyone can create behavioral incidents" ON public.behavioral_incidents;
DROP POLICY IF EXISTS "System can insert agent activity"       ON public.agent_activity_log;

-- Service-role writes are unaffected (service_role bypasses RLS); authenticated users
-- keep their existing owner-scoped SELECT policies.
