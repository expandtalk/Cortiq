-- Web Vitals: Add INP (replaces FID since March 2024), connection_type,
-- and a partial unique index on session_id to support per-metric upsert
-- from the WordPress plugin and spa-tracking.js.

-- INP = Interaction to Next Paint (Google's replacement for FID)
ALTER TABLE web_vitals ADD COLUMN IF NOT EXISTS inp DECIMAL(10,2);

-- Connection type (4g, 3g, wifi, etc.) — enriches per-device analysis
ALTER TABLE web_vitals ADD COLUMN IF NOT EXISTS connection_type VARCHAR(20);

-- Partial unique index: one row per session_id, NULLs are excluded.
-- Enables INSERT ... ON CONFLICT (session_id) DO UPDATE for upserts.
CREATE UNIQUE INDEX IF NOT EXISTS web_vitals_session_id_uq
    ON web_vitals (session_id)
    WHERE session_id IS NOT NULL;

-- Add INP to aggregates table as well
ALTER TABLE web_vitals_aggregates ADD COLUMN IF NOT EXISTS avg_inp DECIMAL(10,2);
ALTER TABLE web_vitals_aggregates ADD COLUMN IF NOT EXISTS p75_inp DECIMAL(10,2);

-- Note: RLS is already enabled on web_vitals from the initial migration.
-- track-web-vitals edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses
-- RLS entirely, so no additional policies are required for inserts.
