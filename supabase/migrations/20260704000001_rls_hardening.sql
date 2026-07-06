-- P0 RLS hardening
-- Closes three cross-tenant holes found in the six-lens audit (2026-07-04):
--   (a) visitor_session_links / visitor_events used FOR ALL USING(true) WITH CHECK(true)
--       — any anon/authenticated role could read+write every tenant's data.
--   (b) conversion_events kept an "Anyone can create conversion events" INSERT WITH CHECK(true).
--   (c) mv_top_pages granted SELECT to authenticated (materialized views bypass RLS) → cross-tenant.
-- Migrations are append-only; this supersedes the offending policies from
-- 20260210000000_unified_visitors.sql and 20250719041946-*.sql.

-- ---------------------------------------------------------------------------
-- (a) visitor_session_links: service-role writes + owner-scoped reads only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access to visitor session links" ON public.visitor_session_links;
CREATE POLICY "Service role full access to visitor session links"
ON public.visitor_session_links FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Site owners can view visitor session links" ON public.visitor_session_links;
CREATE POLICY "Site owners can view visitor session links"
ON public.visitor_session_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = visitor_session_links.site_id
      AND s.user_id = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- (a) visitor_events: service-role writes + owner-scoped reads only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access to visitor events" ON public.visitor_events;
CREATE POLICY "Service role full access to visitor events"
ON public.visitor_events FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Site owners can view visitor events" ON public.visitor_events;
CREATE POLICY "Site owners can view visitor events"
ON public.visitor_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = visitor_events.site_id
      AND s.user_id = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- (b) conversion_events: remove the anonymous-insert hole.
-- Legit writers (ga4-import, ga4-conversion-sync, and the new first-party
-- conversion ingest) all use the service-role key, which bypasses RLS — so this
-- drop does not affect ingestion. No browser/anon INSERT path exists.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create conversion events" ON public.conversion_events;

-- ---------------------------------------------------------------------------
-- (c) mv_top_pages: revoke browser access to the cross-tenant materialized view.
-- Verified no frontend code reads mv_top_pages, so this is not a regression.
-- If a per-site top-pages view is needed later, expose it via a SECURITY DEFINER
-- RPC filtered by site ownership rather than a blanket grant.
-- ---------------------------------------------------------------------------
REVOKE SELECT ON public.mv_top_pages FROM authenticated;
REVOKE SELECT ON public.mv_top_pages FROM anon;
