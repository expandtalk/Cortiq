-- P0 #2/#3: give conversion_events the consent flag the upload path must gate on,
-- and constrain the upload_status state machine so bad values can't be written
-- (service-role writes bypass RLS, so DB-level CHECKs are the only guard).

ALTER TABLE public.conversion_events
  ADD COLUMN IF NOT EXISTS click_id_consent_given boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.conversion_events.click_id_consent_given IS
  'Copied from unified_visitors at conversion ingest. Google Ads upload only proceeds when true.';

-- upload_status allowed values (matches the ingest + upload state machine).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversion_events_upload_status_check'
  ) THEN
    ALTER TABLE public.conversion_events
      ADD CONSTRAINT conversion_events_upload_status_check
      CHECK (upload_status IN (
        'not_applicable','pending','uploading','uploaded',
        'skipped_no_consent','skipped_no_gclid','failed'
      ));
  END IF;
END $$;

-- Composite index for the upload query (site_id + upload_status).
CREATE INDEX IF NOT EXISTS conversion_events_site_upload_idx
  ON public.conversion_events (site_id, upload_status)
  WHERE upload_status IN ('pending','uploading','failed');
