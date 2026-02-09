-- UTM Campaign Tracking
-- Task #14: UTM Campaign Tracking

ALTER TABLE tracking_sessions
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- Create campaign performance view
CREATE TABLE IF NOT EXISTS campaign_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  date DATE NOT NULL,

  -- Metrics
  sessions INT DEFAULT 0,
  pageviews INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  conversions INT DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, date)
);

-- Index for queries
CREATE INDEX idx_campaign_perf_site_date ON campaign_performance(site_id, date DESC);
CREATE INDEX idx_campaign_perf_source ON campaign_performance(utm_source, utm_medium);

-- RLS
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_campaign_data"
  ON campaign_performance FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to aggregate campaign stats
CREATE OR REPLACE FUNCTION aggregate_campaign_stats(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO campaign_performance (
    site_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    date, sessions, pageviews, unique_visitors, conversions, conversion_rate
  )
  SELECT
    s.site_id,
    s.utm_source,
    s.utm_medium,
    s.utm_campaign,
    s.utm_content,
    s.utm_term,
    DATE(s.started_at),
    COUNT(DISTINCT s.id) as sessions,
    SUM(s.page_views) as pageviews,
    COUNT(DISTINCT s.visitor_hash) as unique_visitors,
    COUNT(DISTINCT c.id) as conversions,
    CASE
      WHEN COUNT(DISTINCT s.id) > 0
      THEN (COUNT(DISTINCT c.id)::DECIMAL / COUNT(DISTINCT s.id) * 100)
      ELSE 0
    END as conversion_rate
  FROM tracking_sessions s
  LEFT JOIN conversion_events c ON c.session_id = s.id
  WHERE DATE(s.started_at) = p_date
    AND (s.utm_source IS NOT NULL OR s.utm_medium IS NOT NULL OR s.utm_campaign IS NOT NULL)
  GROUP BY s.site_id, s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content, s.utm_term, DATE(s.started_at)
  ON CONFLICT (site_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, date)
  DO UPDATE SET
    sessions = EXCLUDED.sessions,
    pageviews = EXCLUDED.pageviews,
    unique_visitors = EXCLUDED.unique_visitors,
    conversions = EXCLUDED.conversions,
    conversion_rate = EXCLUDED.conversion_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON campaign_performance TO authenticated;

COMMENT ON TABLE campaign_performance IS 'Aggregated UTM campaign performance metrics';
