-- Content Tracking tables
-- Task #10: Content Tracking

-- Table for tracking impressions and clicks on specific content
CREATE TABLE IF NOT EXISTS content_interactions (
  id BIGSERIAL PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  session_id UUID REFERENCES tracking_sessions(id) ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL,

  -- Content identification
  content_id TEXT NOT NULL, -- from data-cortiq-content attribute
  content_name TEXT,
  content_type TEXT, -- banner, cta, video, image, etc.
  content_url TEXT,

  -- Interaction details
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('impression', 'click', 'hover')),
  page_url TEXT NOT NULL,

  -- Position tracking
  position_x INT,
  position_y INT,
  viewport_width INT,
  viewport_height INT,

  -- Context
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_content_interactions_site_id ON content_interactions(site_id, created_at DESC);
CREATE INDEX idx_content_interactions_content_id ON content_interactions(content_id, created_at DESC);
CREATE INDEX idx_content_interactions_type ON content_interactions(interaction_type);

-- Aggregate table for content performance
CREATE TABLE IF NOT EXISTS content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_name TEXT,
  content_type TEXT,

  -- Metrics (aggregated daily)
  date DATE NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  hovers INT DEFAULT 0,
  ctr DECIMAL(5,2), -- Click-through rate (%)

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, content_id, date)
);

-- Index for performance queries
CREATE INDEX idx_content_performance_site_date ON content_performance(site_id, date DESC);
CREATE INDEX idx_content_performance_content_id ON content_performance(content_id, date DESC);

-- RLS Policies
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_site_content_interactions"
  ON content_interactions FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_site_content_performance"
  ON content_performance FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to calculate and update content performance
CREATE OR REPLACE FUNCTION update_content_performance()
RETURNS void AS $$
BEGIN
  INSERT INTO content_performance (site_id, content_id, content_name, content_type, date, impressions, clicks, hovers, ctr)
  SELECT
    site_id,
    content_id,
    MAX(content_name) as content_name,
    MAX(content_type) as content_type,
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE interaction_type = 'impression') as impressions,
    COUNT(*) FILTER (WHERE interaction_type = 'click') as clicks,
    COUNT(*) FILTER (WHERE interaction_type = 'hover') as hovers,
    CASE
      WHEN COUNT(*) FILTER (WHERE interaction_type = 'impression') > 0
      THEN (COUNT(*) FILTER (WHERE interaction_type = 'click')::DECIMAL /
            COUNT(*) FILTER (WHERE interaction_type = 'impression') * 100)
      ELSE 0
    END as ctr
  FROM content_interactions
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY site_id, content_id, DATE(created_at)
  ON CONFLICT (site_id, content_id, date)
  DO UPDATE SET
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    hovers = EXCLUDED.hovers,
    ctr = EXCLUDED.ctr,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON content_interactions TO authenticated;
GRANT SELECT ON content_performance TO authenticated;

COMMENT ON TABLE content_interactions IS 'Track impressions and clicks on specific content elements';
COMMENT ON TABLE content_performance IS 'Aggregated daily content performance metrics';
