-- Add freshness scoring and page last-modified date to geo_audits.
-- freshness_score: 0-100 based on how recently the page was updated.
-- page_last_modified: the date extracted from the page (meta/JSON-LD/HTTP header).

ALTER TABLE public.geo_audits
  ADD COLUMN freshness_score   integer     NOT NULL DEFAULT 0 CHECK (freshness_score BETWEEN 0 AND 100),
  ADD COLUMN page_last_modified timestamptz;

COMMENT ON COLUMN public.geo_audits.freshness_score IS 'Content freshness score (0-100): based on dateModified, article:modified_time, or HTTP Last-Modified.';
COMMENT ON COLUMN public.geo_audits.page_last_modified IS 'Date the page content was last updated, extracted from JSON-LD dateModified, meta tags, or HTTP Last-Modified header.';
