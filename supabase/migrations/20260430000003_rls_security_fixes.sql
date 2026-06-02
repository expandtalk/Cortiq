-- Security fixes: enable RLS on event_queue + daily_site_stats,
-- drop stray trading views that don't belong to this project.

-- ── event_queue ───────────────────────────────────────────────────────────────
-- Written by Edge Functions via service_role (bypasses RLS).
-- Authenticated users may only see events for sites they own.

ALTER TABLE public.event_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_queue_select_own_sites" ON public.event_queue;
CREATE POLICY "event_queue_select_own_sites"
  ON public.event_queue FOR SELECT
  TO authenticated
  USING (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

-- Edge Functions insert/update via service_role — no authenticated write policy needed.

-- ── daily_site_stats ─────────────────────────────────────────────────────────
-- Populated by aggregate_daily_stats() (SECURITY DEFINER, runs as owner).
-- Authenticated users may only read stats for their own sites.

ALTER TABLE public.daily_site_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_site_stats_select_own_sites" ON public.daily_site_stats;
CREATE POLICY "daily_site_stats_select_own_sites"
  ON public.daily_site_stats FOR SELECT
  TO authenticated
  USING (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

-- ── Stray trading views ───────────────────────────────────────────────────────
-- These views are not part of CortIQ and were never created by any migration.
-- Drop them to remove the SECURITY DEFINER warnings.

DROP VIEW IF EXISTS public.v_recent_trades;
DROP VIEW IF EXISTS public.v_active_signals;
