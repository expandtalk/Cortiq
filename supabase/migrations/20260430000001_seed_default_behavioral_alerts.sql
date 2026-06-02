-- Seed default behavioral alert rules for all existing sites that have none.
-- Future sites get rules via AddSiteForm.tsx on creation.
INSERT INTO behavioral_alerts (site_id, alert_type, alert_name, severity, threshold_config, is_active)
SELECT
  s.id,
  rule.alert_type,
  rule.alert_name,
  rule.severity,
  rule.threshold_config::jsonb,
  true
FROM sites s
CROSS JOIN (VALUES
  ('high_bounce_rate',  'High Bounce Rate',      'medium', '{"bounce_rate_threshold":80,"page_views_minimum":10}'),
  ('rage_clicks',       'Rage Clicks Detected',  'high',   '{"clicks_threshold":5,"time_window_seconds":3}'),
  ('form_abandonment',  'High Form Abandonment', 'medium', '{"abandonment_rate_threshold":60,"min_form_sessions":5}'),
  ('traffic_spike',     'Unusual Traffic Spike', 'low',    '{"spike_multiplier":3,"baseline_hours":24}')
) AS rule(alert_type, alert_name, severity, threshold_config)
WHERE NOT EXISTS (
  SELECT 1 FROM behavioral_alerts ba WHERE ba.site_id = s.id
);
