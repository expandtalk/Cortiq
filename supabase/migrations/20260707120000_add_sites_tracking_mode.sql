-- Cookieless / consent-exempt tracking mode per site.
-- cookieless = audience-measurement exemption (no device fingerprint, no cross-visit
--   identity, no client-side storage) — CortIQ's own analytics run without consent.
-- full = fingerprint + returning-visitor profiling (requires analytics consent).
-- Default 'full' preserves existing behaviour for all current sites.

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS tracking_mode text NOT NULL DEFAULT 'full';

ALTER TABLE public.sites DROP CONSTRAINT IF EXISTS sites_tracking_mode_check;
ALTER TABLE public.sites
  ADD CONSTRAINT sites_tracking_mode_check CHECK (tracking_mode IN ('cookieless','full'));

COMMENT ON COLUMN public.sites.tracking_mode IS
  'cookieless = consent-exempt audience measurement (no device fingerprint, no cross-visit identity, no client-side storage); full = fingerprint + returning-visitor profiling (requires consent). Default full preserves existing behaviour.';
