-- Google Search Console integration tables

CREATE TABLE IF NOT EXISTS site_google_credentials (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id               UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  property_url          TEXT NOT NULL,
  refresh_token         TEXT NOT NULL,
  access_token          TEXT,
  token_expires_at      TIMESTAMPTZ,
  last_sync_at          TIMESTAMPTZ,
  last_token_refresh_at TIMESTAMPTZ,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, property_url)
);

CREATE INDEX IF NOT EXISTS idx_gsc_creds_site ON site_google_credentials(site_id, is_active);

-- GSC search analytics data
-- query column is populated for query-dimension rows, page for page-dimension rows
CREATE TABLE IF NOT EXISTS gsc_data (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  synced_at   TIMESTAMPTZ DEFAULT now(),
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  dimension   TEXT NOT NULL CHECK (dimension IN ('query', 'page')),
  value       TEXT NOT NULL,
  clicks      INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr         NUMERIC(6,4) DEFAULT 0,
  position    NUMERIC(6,2) DEFAULT 0,
  UNIQUE(site_id, period_start, period_end, dimension, value)
);

CREATE INDEX IF NOT EXISTS idx_gsc_data_site ON gsc_data(site_id, period_start DESC);

-- RLS
ALTER TABLE site_google_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_site_google_credentials" ON site_google_credentials;
CREATE POLICY "owner_site_google_credentials" ON site_google_credentials
  USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "owner_gsc_data" ON gsc_data;
CREATE POLICY "owner_gsc_data" ON gsc_data
  USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));
