-- P2-2: wrap auth.uid() as (select auth.uid()) on the two high-volume SELECT
-- policies missed by the 2026-07-04 hardening. Postgres evaluates a bare auth.uid()
-- once per row; wrapping it in a scalar subquery lets the planner hoist it to an
-- InitPlan evaluated once per query — a large win on unified_visitors /
-- conversion_events which accumulate many rows per site. Semantics are identical.

DROP POLICY IF EXISTS "Site owners can view unified visitors" ON public.unified_visitors;
CREATE POLICY "Site owners can view unified visitors"
ON public.unified_visitors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = unified_visitors.site_id
      AND sites.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Site owners can view conversion events" ON public.conversion_events;
CREATE POLICY "Site owners can view conversion events"
ON public.conversion_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = conversion_events.site_id
      AND sites.user_id = (select auth.uid())
  )
);
