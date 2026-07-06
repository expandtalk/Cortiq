-- Feature 1: First-Party Click ID Capture
-- Stores ad click IDs for conversion attribution and Enhanced Conversions
-- GDPR: only populated when marketing consent = true (enforced at application layer)

ALTER TABLE unified_visitors ADD COLUMN IF NOT EXISTS gclid text;
ALTER TABLE unified_visitors ADD COLUMN IF NOT EXISTS fbclid text;
ALTER TABLE unified_visitors ADD COLUMN IF NOT EXISTS msclkid text;
ALTER TABLE unified_visitors ADD COLUMN IF NOT EXISTS ttclid text;
ALTER TABLE unified_visitors ADD COLUMN IF NOT EXISTS li_fat_id text;
ALTER TABLE unified_visitors ADD COLUMN IF NOT EXISTS click_id_consent_given boolean DEFAULT false;

COMMENT ON COLUMN unified_visitors.gclid IS 'Google Ads click ID — only stored with marketing consent';
COMMENT ON COLUMN unified_visitors.fbclid IS 'Facebook click ID — only stored with marketing consent';
COMMENT ON COLUMN unified_visitors.msclkid IS 'Microsoft Ads click ID — only stored with marketing consent';
COMMENT ON COLUMN unified_visitors.ttclid IS 'TikTok click ID — only stored with marketing consent';
COMMENT ON COLUMN unified_visitors.li_fat_id IS 'LinkedIn click ID — only stored with marketing consent';
COMMENT ON COLUMN unified_visitors.click_id_consent_given IS 'True only when visitor explicitly consented to marketing tracking at the time the click ID was captured';
