-- Performance indexes (audit P2-1).
-- page_views is the highest-volume table and every dashboard/analytics/retention
-- query filters on (site_id, viewed_at). A Postgres FK does NOT create an index,
-- so this was a full seq-scan. Composite index with viewed_at DESC matches the
-- common "recent activity for a site" access pattern.

CREATE INDEX IF NOT EXISTS idx_page_views_site_viewed
  ON public.page_views (site_id, viewed_at DESC);
