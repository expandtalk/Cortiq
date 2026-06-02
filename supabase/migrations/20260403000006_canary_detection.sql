-- Canary Detection Infrastructure
--
-- Canary links and pixels are injected by spa-tracking.js into every page.
-- They are invisible to real users but get fetched by scrapers that:
--   • fetch all <img> src attributes server-side (canary pixel)
--   • follow all <a href> links programmatically (canary link)
--
-- When a canary URL is requested the canary-tracker Edge Function logs the hit
-- and immediately creates a behavioral_incident for the site.
--
-- GDPR design:
--   • raw IP is NEVER stored — always anonymized (last octet zeroed for IPv4)
--   • raw User-Agent is NOT stored — only coarse category ('Python', 'Headless Browser', etc.)
--   • canary tokens are random/ephemeral — not linked to any individual user
--   • legal basis: legitimate interest (fraud/bot detection)

-- ── Canary hits log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.canary_hits (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       UUID        NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  token         TEXT        NOT NULL,
  canary_type   TEXT        NOT NULL DEFAULT 'pixel'
    CONSTRAINT canary_hits_type_check CHECK (canary_type IN ('pixel', 'link')),
  -- GDPR: always anonymized. IPv4 last octet zeroed; IPv6 /48 prefix only.
  ip_anon       TEXT,
  -- Coarse UA category only ('Headless Browser', 'Python', 'curl', etc.)
  ua_category   TEXT,
  country       TEXT,
  referrer      TEXT,
  detected_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX canary_hits_site_time_idx ON public.canary_hits(site_id, detected_at DESC);
CREATE INDEX canary_hits_token_idx     ON public.canary_hits(token);

COMMENT ON TABLE public.canary_hits IS
  'Log of canary pixel/link requests. Raw IP and UA are never stored. '
  'Records are created by the canary-tracker Edge Function.';

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.canary_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "canary_hits_select"
  ON public.canary_hits FOR SELECT
  USING (site_id IN (
    SELECT id FROM public.sites WHERE user_id = auth.uid()
  ));

CREATE POLICY "canary_hits_service_insert"
  ON public.canary_hits FOR INSERT WITH CHECK (true);

-- ── Update seed_cyber_alerts to include canary_hit ────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_cyber_alerts(p_site_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INT := 0;
  v_count    INT;
BEGIN
  -- Traffic spike
  INSERT INTO public.behavioral_alerts (
    site_id, alert_type, alert_name, alert_description,
    severity, threshold_config, is_active, notification_settings
  )
  SELECT p_site_id, 'traffic_spike', 'Traffic Spike Detected',
    'Session volume in the last 5 minutes exceeds 3× the 7-day baseline.',
    'high',
    jsonb_build_object('window_minutes', 5, 'spike_multiplier', 3.0, 'min_baseline_sessions', 3),
    true, '{}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.behavioral_alerts WHERE site_id = p_site_id AND alert_type = 'traffic_spike'
  );
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Scraping activity
  INSERT INTO public.behavioral_alerts (
    site_id, alert_type, alert_name, alert_description,
    severity, threshold_config, is_active, notification_settings
  )
  SELECT p_site_id, 'scraping_activity', 'Scraping Activity Detected',
    'Sessions visiting 15+ pages at robot-speed pace (<3 sec/page average).',
    'high',
    jsonb_build_object('min_page_views', 15, 'max_seconds_per_page', 3, 'min_suspicious_sessions', 1),
    true, '{}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.behavioral_alerts WHERE site_id = p_site_id AND alert_type = 'scraping_activity'
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_inserted := v_inserted + v_count;

  -- Honeypot
  INSERT INTO public.behavioral_alerts (
    site_id, alert_type, alert_name, alert_description,
    severity, threshold_config, is_active, notification_settings
  )
  SELECT p_site_id, 'honeypot_triggered', 'Honeypot Triggered',
    'A hidden element invisible to real users was interacted with. High-confidence bot signal.',
    'critical', '{}'::jsonb, true, '{}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.behavioral_alerts WHERE site_id = p_site_id AND alert_type = 'honeypot_triggered'
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_inserted := v_inserted + v_count;

  -- Canary hit
  INSERT INTO public.behavioral_alerts (
    site_id, alert_type, alert_name, alert_description,
    severity, threshold_config, is_active, notification_settings
  )
  SELECT p_site_id, 'canary_hit', 'Canary Detected',
    'A hidden tracking URL invisible to real users was requested. '
    'Canary pixel = server-side image fetcher; canary link = automated link traversal.',
    'critical', '{}'::jsonb, true, '{}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.behavioral_alerts WHERE site_id = p_site_id AND alert_type = 'canary_hit'
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_inserted := v_inserted + v_count;

  RETURN jsonb_build_object('alerts_created', v_inserted, 'site_id', p_site_id);
END;
$$;

-- ── Data retention ────────────────────────────────────────────────────────────
-- canary_hits are forensic evidence — keep for 730 days (same as bot_detections).
CREATE OR REPLACE FUNCTION public.run_canary_retention()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted BIGINT;
BEGIN
  DELETE FROM public.canary_hits WHERE detected_at < now() - interval '730 days';
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN jsonb_build_object('canary_hits_deleted', deleted);
END;
$$;

SELECT cron.unschedule('daily-canary-retention')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-canary-retention');

SELECT cron.schedule(
  'daily-canary-retention',
  '45 3 * * *',
  'SELECT run_canary_retention()'
);
