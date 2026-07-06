-- HubSpot Integration Wizard — site-level config columns
-- Stores webhook secret (encrypted at rest by Postgres), property mapping, and activation flag

ALTER TABLE sites ADD COLUMN IF NOT EXISTS hubspot_webhook_secret text;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS hubspot_quality_property text DEFAULT 'lead_quality';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS hubspot_lead_webhook_enabled boolean DEFAULT false;

-- Google Ads Enhanced Conversions — customer ID needed for upload API
ALTER TABLE sites ADD COLUMN IF NOT EXISTS google_ads_customer_id text;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS google_ads_access_token text;

COMMENT ON COLUMN sites.hubspot_webhook_secret IS 'HubSpot client secret for HMAC webhook signature validation — never expose to frontend';
COMMENT ON COLUMN sites.google_ads_customer_id IS 'Google Ads customer ID (without hyphens) — required for Conversion Adjustments API';
