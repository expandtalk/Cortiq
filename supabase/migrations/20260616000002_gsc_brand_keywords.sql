-- Add brand_keywords to site_google_credentials.
-- Used to split branded vs. non-branded clicks in GSC analytics.
-- Value: comma-separated terms, e.g. "cortiq, expandtalk, sentrisk"

ALTER TABLE public.site_google_credentials
  ADD COLUMN brand_keywords TEXT;

COMMENT ON COLUMN public.site_google_credentials.brand_keywords IS 'Comma-separated brand terms used to classify queries as branded vs. non-branded.';
