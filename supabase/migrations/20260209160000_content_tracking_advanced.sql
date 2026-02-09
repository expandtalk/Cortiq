-- Advanced Content Tracking
-- Task #24: Content Tracking Advanced

-- Create content elements table
CREATE TABLE IF NOT EXISTS content_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  -- Element identification
  element_id TEXT NOT NULL,
  element_type VARCHAR(50) NOT NULL, -- button, link, form, image, video, text, etc.
  element_selector TEXT, -- CSS selector for re-identifying
  element_text TEXT, -- Button/link text

  -- Content information
  page_url TEXT NOT NULL,
  page_title TEXT,
  section_name TEXT, -- Section of page (header, hero, cta, etc.)
  content_type VARCHAR(50), -- call-to-action, social-proof, testimonial, etc.

  -- Analytics metadata
  priority INT DEFAULT 0, -- 0=low, 1=medium, 2=high
  is_tracked BOOLEAN DEFAULT TRUE,
  tracking_started_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, element_id, page_url)
);

-- Create content interactions table
CREATE TABLE IF NOT EXISTS content_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  session_id UUID,

  element_id TEXT NOT NULL,
  page_url TEXT NOT NULL,

  -- Interaction types
  interaction_type VARCHAR(50) NOT NULL, -- view, click, hover, focus, scroll_into_view, form_interaction
  interaction_timestamp TIMESTAMPTZ NOT NULL,

  -- Interaction details
  mouse_x INT,
  mouse_y INT,
  view_duration INT, -- Time in view (ms)
  hover_duration INT, -- Time hovering (ms)
  click_count INT DEFAULT 1,

  -- Form specific
  form_field_name TEXT,
  form_field_type VARCHAR(50),
  form_field_value TEXT, -- Only if not sensitive
  form_submission_status VARCHAR(20), -- success, error, abandoned

  -- Device context
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  viewport_width INT,
  viewport_height INT,

  -- Attribution
  visitor_hash TEXT,
  referrer TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content performance aggregates
CREATE TABLE IF NOT EXISTS content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  element_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  date DATE NOT NULL,

  -- Metrics
  views INT DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  hover_count INT DEFAULT 0,
  focus_count INT DEFAULT 0,
  form_submissions INT DEFAULT 0,
  form_successes INT DEFAULT 0,
  form_errors INT DEFAULT 0,

  -- Rates
  ctr DECIMAL(5,2) DEFAULT 0, -- Click-through rate
  hover_rate DECIMAL(5,2) DEFAULT 0,
  form_success_rate DECIMAL(5,2) DEFAULT 0,

  -- Engagement
  avg_view_duration INT DEFAULT 0, -- milliseconds
  avg_hover_duration INT DEFAULT 0,
  engagement_score INT DEFAULT 0, -- 0-100

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, element_id, page_url, date)
);

-- Create form field analytics
CREATE TABLE IF NOT EXISTS form_field_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  form_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type VARCHAR(50),
  field_order INT,
  page_url TEXT,

  date DATE NOT NULL,

  -- Field metrics
  impressions INT DEFAULT 0,
  interactions INT DEFAULT 0,
  focus_count INT DEFAULT 0,
  blur_count INT DEFAULT 0,
  value_changes INT DEFAULT 0,
  validation_errors INT DEFAULT 0,

  -- Completion
  completed INT DEFAULT 0,
  abandoned INT DEFAULT 0,

  -- Performance
  avg_time_to_fill INT DEFAULT 0, -- milliseconds
  avg_time_to_error INT DEFAULT 0,

  -- Error tracking
  common_error_messages TEXT[], -- Array of error messages

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, form_name, field_name, page_url, date)
);

-- Create heatmap data points
CREATE TABLE IF NOT EXISTS content_heatmap_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  page_url TEXT NOT NULL,
  interaction_type VARCHAR(50) NOT NULL, -- click, hover, scroll

  date DATE NOT NULL,
  x_coordinate INT,
  y_coordinate INT,

  -- Intensity (0-100)
  intensity INT DEFAULT 1,

  -- Aggregation
  count INT DEFAULT 1,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, page_url, interaction_type, date, x_coordinate, y_coordinate)
);

-- Create scroll depth tracking
CREATE TABLE IF NOT EXISTS scroll_depth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  session_id UUID,

  page_url TEXT NOT NULL,
  visitor_hash TEXT,

  -- Scroll metrics
  max_scroll_depth INT DEFAULT 0, -- percentage
  scroll_events INT DEFAULT 0,
  total_scroll_distance INT DEFAULT 0, -- pixels

  session_date DATE NOT NULL,
  time_on_page INT DEFAULT 0, -- seconds

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content recommendation tracking
CREATE TABLE IF NOT EXISTS content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  recommendation_id TEXT,
  recommendation_type VARCHAR(50), -- related_content, upsell, social_proof, etc.
  source_page TEXT,
  target_page TEXT,

  date DATE NOT NULL,

  -- Metrics
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, recommendation_id, date)
);

-- Indexes for performance
CREATE INDEX idx_content_elements_site ON content_elements(site_id);
CREATE INDEX idx_content_elements_page ON content_elements(page_url);
CREATE INDEX idx_content_interactions_site_time ON content_interactions(site_id, interaction_timestamp DESC);
CREATE INDEX idx_content_interactions_element ON content_interactions(element_id);
CREATE INDEX idx_content_interactions_type ON content_interactions(interaction_type);
CREATE INDEX idx_content_performance_site_date ON content_performance(site_id, date DESC);
CREATE INDEX idx_content_performance_page ON content_performance(page_url);
CREATE INDEX idx_form_field_analytics_site_date ON form_field_analytics(site_id, date DESC);
CREATE INDEX idx_form_field_analytics_form ON form_field_analytics(form_name);
CREATE INDEX idx_heatmap_site_page_date ON content_heatmap_points(site_id, page_url, date DESC);
CREATE INDEX idx_scroll_depth_site_date ON scroll_depth(site_id, session_date DESC);
CREATE INDEX idx_recommendations_site_date ON content_recommendations(site_id, date DESC);

-- Enable RLS
ALTER TABLE content_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_field_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_heatmap_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE scroll_depth ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "view_own_content_elements"
  ON content_elements FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_content_interactions"
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

CREATE POLICY "view_own_content_performance"
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

CREATE POLICY "view_own_form_analytics"
  ON form_field_analytics FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_heatmaps"
  ON content_heatmap_points FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_scroll_depth"
  ON scroll_depth FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_recommendations"
  ON content_recommendations FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to aggregate content performance
CREATE OR REPLACE FUNCTION aggregate_content_performance(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO content_performance (
    site_id, element_id, page_url, date,
    views, impressions, clicks, hover_count, form_submissions, form_successes,
    ctr, hover_rate, form_success_rate, avg_view_duration, engagement_score
  )
  SELECT
    i.site_id,
    i.element_id,
    i.page_url,
    DATE(i.interaction_timestamp),
    COUNT(CASE WHEN i.interaction_type = 'view' THEN 1 END) as views,
    COUNT(DISTINCT i.session_id) as impressions,
    COUNT(CASE WHEN i.interaction_type = 'click' THEN 1 END) as clicks,
    COUNT(CASE WHEN i.interaction_type = 'hover' THEN 1 END) as hover_count,
    COUNT(CASE WHEN i.interaction_type = 'form_interaction' AND i.form_submission_status IS NOT NULL THEN 1 END) as form_submissions,
    COUNT(CASE WHEN i.interaction_type = 'form_interaction' AND i.form_submission_status = 'success' THEN 1 END) as form_successes,
    CASE
      WHEN COUNT(CASE WHEN i.interaction_type = 'view' THEN 1 END) > 0
      THEN ROUND((COUNT(CASE WHEN i.interaction_type = 'click' THEN 1 END)::DECIMAL /
                  COUNT(CASE WHEN i.interaction_type = 'view' THEN 1 END)) * 100, 2)
      ELSE 0
    END as ctr,
    CASE
      WHEN COUNT(CASE WHEN i.interaction_type = 'view' THEN 1 END) > 0
      THEN ROUND((COUNT(CASE WHEN i.interaction_type = 'hover' THEN 1 END)::DECIMAL /
                  COUNT(CASE WHEN i.interaction_type = 'view' THEN 1 END)) * 100, 2)
      ELSE 0
    END as hover_rate,
    CASE
      WHEN COUNT(CASE WHEN i.interaction_type = 'form_interaction' AND i.form_submission_status IS NOT NULL THEN 1 END) > 0
      THEN ROUND((COUNT(CASE WHEN i.interaction_type = 'form_interaction' AND i.form_submission_status = 'success' THEN 1 END)::DECIMAL /
                  COUNT(CASE WHEN i.interaction_type = 'form_interaction' AND i.form_submission_status IS NOT NULL THEN 1 END)) * 100, 2)
      ELSE 0
    END as form_success_rate,
    ROUND(AVG(CASE WHEN i.view_duration > 0 THEN i.view_duration ELSE NULL END))::INT as avg_view_duration,
    LEAST(100, GREATEST(0, ROUND(
      (COUNT(CASE WHEN i.interaction_type = 'click' THEN 1 END) * 0.4 +
       COUNT(CASE WHEN i.interaction_type = 'hover' THEN 1 END) * 0.3 +
       COALESCE(AVG(i.view_duration), 0) / 100 * 0.3)::NUMERIC, 0)))::INT as engagement_score
  FROM content_interactions i
  WHERE DATE(i.interaction_timestamp) = p_date
  GROUP BY i.site_id, i.element_id, i.page_url, DATE(i.interaction_timestamp)
  ON CONFLICT (site_id, element_id, page_url, date)
  DO UPDATE SET
    views = EXCLUDED.views,
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    hover_count = EXCLUDED.hover_count,
    form_submissions = EXCLUDED.form_submissions,
    form_successes = EXCLUDED.form_successes,
    ctr = EXCLUDED.ctr,
    hover_rate = EXCLUDED.hover_rate,
    form_success_rate = EXCLUDED.form_success_rate,
    avg_view_duration = EXCLUDED.avg_view_duration,
    engagement_score = EXCLUDED.engagement_score,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate form field analytics
CREATE OR REPLACE FUNCTION aggregate_form_field_analytics(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO form_field_analytics (
    site_id, form_name, field_name, field_type, page_url, date,
    impressions, interactions, focus_count, validation_errors,
    completed, abandoned, avg_time_to_fill
  )
  SELECT
    i.site_id,
    i.form_field_name || '_form',
    i.form_field_name,
    i.form_field_type,
    i.page_url,
    DATE(i.interaction_timestamp),
    COUNT(DISTINCT i.session_id) as impressions,
    COUNT(*) as interactions,
    COUNT(CASE WHEN i.interaction_type = 'focus' THEN 1 END) as focus_count,
    COUNT(CASE WHEN i.form_field_value IS NULL THEN 1 END) as validation_errors,
    COUNT(CASE WHEN i.form_submission_status = 'success' THEN 1 END) as completed,
    COUNT(CASE WHEN i.form_submission_status = 'abandoned' THEN 1 END) as abandoned,
    ROUND(AVG(CASE WHEN i.view_duration > 0 THEN i.view_duration ELSE NULL END))::INT as avg_time_to_fill
  FROM content_interactions i
  WHERE DATE(i.interaction_timestamp) = p_date AND i.form_field_name IS NOT NULL
  GROUP BY i.site_id, i.form_field_name, i.form_field_type, i.page_url, DATE(i.interaction_timestamp)
  ON CONFLICT (site_id, form_name, field_name, page_url, date)
  DO UPDATE SET
    impressions = EXCLUDED.impressions,
    interactions = EXCLUDED.interactions,
    focus_count = EXCLUDED.focus_count,
    validation_errors = EXCLUDED.validation_errors,
    completed = EXCLUDED.completed,
    abandoned = EXCLUDED.abandoned,
    avg_time_to_fill = EXCLUDED.avg_time_to_fill,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON content_elements TO authenticated;
GRANT SELECT ON content_interactions TO authenticated;
GRANT SELECT ON content_performance TO authenticated;
GRANT SELECT ON form_field_analytics TO authenticated;
GRANT SELECT ON content_heatmap_points TO authenticated;
GRANT SELECT ON scroll_depth TO authenticated;
GRANT SELECT ON content_recommendations TO authenticated;

COMMENT ON TABLE content_elements IS 'Tracked content elements on pages';
COMMENT ON TABLE content_interactions IS 'User interactions with content elements';
COMMENT ON TABLE content_performance IS 'Aggregated content performance metrics';
COMMENT ON TABLE form_field_analytics IS 'Form field interaction and completion analytics';
COMMENT ON TABLE content_heatmap_points IS 'Heatmap data for click/hover/scroll visualization';
COMMENT ON TABLE scroll_depth IS 'Scroll depth and time-on-page analytics';
COMMENT ON TABLE content_recommendations IS 'Content recommendation performance tracking';
