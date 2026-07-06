-- Feature 4: CRM Lead Quality Feedback Loop
-- Extends conversion_events with fields needed for Google Ads Enhanced Conversions upload
-- GDPR: hashed_email is SHA-256 only — raw email is never stored in CortIQ

ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS gclid text;
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS hashed_email text;  -- SHA-256 hash, never raw PII
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS lead_quality text;  -- Priority | Qualified | Challenge
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS quality_value numeric; -- 300 | 100 | 0
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS quality_classified_at timestamptz;
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS uploaded_to_ads_at timestamptz;
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS upload_status text DEFAULT 'not_applicable';
  -- not_applicable | pending | uploaded | skipped_no_consent | skipped_no_gclid | failed

COMMENT ON COLUMN conversion_events.hashed_email IS 'SHA-256 hash of visitor email — used for Google Ads Enhanced Conversions matching. Raw email never stored.';
COMMENT ON COLUMN conversion_events.lead_quality IS 'CRM-assigned quality: Priority (300 pts), Qualified (100 pts), Challenge (0 pts)';
COMMENT ON COLUMN conversion_events.upload_status IS 'pending = ready to upload to Google Ads; skipped_no_consent = blocked by GDPR; skipped_no_gclid = no paid session found';

CREATE INDEX IF NOT EXISTS conversion_events_upload_status_idx ON conversion_events(upload_status);
CREATE INDEX IF NOT EXISTS conversion_events_gclid_idx ON conversion_events(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS conversion_events_hashed_email_idx ON conversion_events(hashed_email) WHERE hashed_email IS NOT NULL;
