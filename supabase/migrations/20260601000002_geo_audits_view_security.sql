-- geo_latest_audits: enforce RLS by running the view as the calling user.
-- Without this, the view uses SECURITY DEFINER (the creator's rights) and
-- would bypass the RLS policies on geo_audits.
ALTER VIEW public.geo_latest_audits SET (security_invoker = true);

-- Replace the two single-column indexes with one composite index that matches
-- the DISTINCT ON (site_id) ORDER BY site_id, created_at DESC query plan.
DROP INDEX IF EXISTS public.idx_geo_audits_site_id;
DROP INDEX IF EXISTS public.idx_geo_audits_created_at;

CREATE INDEX IF NOT EXISTS idx_geo_audits_site_created
  ON public.geo_audits (site_id, created_at DESC);
