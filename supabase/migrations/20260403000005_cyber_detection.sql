-- Cyber Detection additions
--
-- 1. Add missing Bing/Microsoft crawlers to bot_catalog
--    (Bingbot entry already covers BingPreview; these are distinct crawlers)
-- 2. Add seed_cyber_alerts() helper — call this for new sites to get
--    traffic_spike, scraping_activity, and honeypot_triggered alerts out of the box
--
-- GDPR note: all three new behavioral alert types use only aggregated counts
-- or ephemeral session IDs. No raw IPs, no user agents, no personal data.

-- ── 1. Missing Bing/Microsoft crawlers ────────────────────────────────────────
INSERT INTO public.bot_catalog (name, display_name, category, ua_patterns, description, vendor)
VALUES
  ('adidxbot',
   'AdIdxBot (Bing Ads)',
   'search_crawler',
   ARRAY['adidxbot'],
   'Bing Ads crawler — crawls ad landing pages for quality control. Desktop and mobile variants.',
   'Microsoft'),

  ('microsoft-preview',
   'MicrosoftPreview',
   'search_crawler',
   ARRAY['MicrosoftPreview'],
   'Generates page snapshots for Microsoft products (Teams link previews, Outlook, etc.).',
   'Microsoft'),

  ('bing-video-preview',
   'BingVideoPreview',
   'search_crawler',
   ARRAY['BingVideoPreview'],
   'Crawls and generates video previews for Bing search results.',
   'Microsoft')

ON CONFLICT (name) DO UPDATE SET
  display_name  = EXCLUDED.display_name,
  ua_patterns   = EXCLUDED.ua_patterns,
  description   = EXCLUDED.description,
  vendor        = EXCLUDED.vendor;

-- ── 2. Helper: seed default cyber alerts for a site ───────────────────────────
-- Usage: SELECT seed_cyber_alerts('your-site-uuid');
-- Idempotent — skips alert types that already exist for the site.
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
  -- Traffic spike: alert when sessions in a 5-min window are 3× the 7-day average
  INSERT INTO public.behavioral_alerts (
    site_id, alert_type, alert_name, alert_description,
    severity, threshold_config, is_active, notification_settings
  )
  SELECT
    p_site_id,
    'traffic_spike',
    'Traffic Spike Detected',
    'Session volume in the last 5 minutes exceeds 3× the 7-day baseline. '
    'May indicate a bot probe, DDoS attempt, or viral traffic burst.',
    'high',
    jsonb_build_object(
      'window_minutes',        5,
      'spike_multiplier',      3.0,
      'min_baseline_sessions', 3
    ),
    true,
    '{}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.behavioral_alerts
    WHERE site_id = p_site_id AND alert_type = 'traffic_spike'
  );
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Scraping activity: sessions with 15+ pages visited at <3 sec/page average
  INSERT INTO public.behavioral_alerts (
    site_id, alert_type, alert_name, alert_description,
    severity, threshold_config, is_active, notification_settings
  )
  SELECT
    p_site_id,
    'scraping_activity',
    'Scraping Activity Detected',
    'One or more sessions visited 15+ pages at a robot-speed pace (<3 sec/page). '
    'Consistent with automated content harvesting.',
    'high',
    jsonb_build_object(
      'min_page_views',          15,
      'max_seconds_per_page',     3,
      'min_suspicious_sessions',  1
    ),
    true,
    '{}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.behavioral_alerts
    WHERE site_id = p_site_id AND alert_type = 'scraping_activity'
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_inserted := v_inserted + v_count;

  -- Honeypot: any interaction with the hidden sentinel element = automated tool
  INSERT INTO public.behavioral_alerts (
    site_id, alert_type, alert_name, alert_description,
    severity, threshold_config, is_active, notification_settings
  )
  SELECT
    p_site_id,
    'honeypot_triggered',
    'Honeypot Triggered',
    'A hidden element invisible to real users was interacted with. '
    'This is a high-confidence signal of an automated browser or scraping tool.',
    'critical',
    '{}'::jsonb,
    true,
    '{}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.behavioral_alerts
    WHERE site_id = p_site_id AND alert_type = 'honeypot_triggered'
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_inserted := v_inserted + v_count;

  RETURN jsonb_build_object('alerts_created', v_inserted, 'site_id', p_site_id);
END;
$$;

COMMENT ON FUNCTION public.seed_cyber_alerts IS
  'Seeds default Cyber & Bot Intelligence alert rules for a site. '
  'Idempotent — safe to call multiple times. '
  'Alert types added: traffic_spike, scraping_activity, honeypot_triggered.';
