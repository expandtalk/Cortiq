-- Final Fas 3 Features
-- Tasks #25, #26, #27, #29, #32

-- ===== TASK #25: WHITE LABEL =====
CREATE TABLE IF NOT EXISTS white_label_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Branding
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  logo_url TEXT,
  favicon_url TEXT,
  company_name TEXT,

  -- Custom domain
  custom_domain TEXT,
  custom_domain_verified BOOLEAN DEFAULT FALSE,

  -- Feature toggles
  show_cortiq_branding BOOLEAN DEFAULT FALSE,
  custom_footer_text TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id)
);

-- ===== TASK #26: COHORT ANALYSIS =====
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Cohort definition
  start_date DATE,
  end_date DATE,
  definition JSONB, -- Conditions for membership

  -- Metrics
  user_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, name)
);

CREATE TABLE IF NOT EXISTS cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,

  visitor_hash TEXT,
  session_count INT DEFAULT 0,
  first_seen DATE,
  last_seen DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cohort_retention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,

  week INT,
  retention_rate DECIMAL(5,2),
  returning_users INT,
  total_users INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, week)
);

-- ===== TASK #27: SEO WEB VITALS =====
CREATE TABLE IF NOT EXISTS web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  session_id UUID,

  -- Core Web Vitals
  lcp DECIMAL(10,2), -- Largest Contentful Paint (ms)
  fid DECIMAL(10,2), -- First Input Delay (ms)
  cls DECIMAL(10,2), -- Cumulative Layout Shift
  fcp DECIMAL(10,2), -- First Contentful Paint (ms)
  ttfb DECIMAL(10,2), -- Time to First Byte (ms)

  -- Page info
  page_url TEXT,
  device_type VARCHAR(20),

  measured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS web_vitals_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  date DATE,

  -- Metrics
  avg_lcp DECIMAL(10,2),
  avg_fid DECIMAL(10,2),
  avg_cls DECIMAL(10,2),
  avg_fcp DECIMAL(10,2),
  avg_ttfb DECIMAL(10,2),

  -- Performance grade
  performance_score INT, -- 0-100
  seo_score INT,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, date)
);

-- ===== TASK #29: SAML SSO =====
CREATE TABLE IF NOT EXISTS saml_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- SAML settings
  entity_id TEXT NOT NULL,
  sso_url TEXT NOT NULL,
  certificate TEXT,

  -- Attribute mapping
  attribute_mappings JSONB, -- Maps SAML attributes to CortIQ fields

  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id)
);

CREATE TABLE IF NOT EXISTS saml_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),

  saml_name_id TEXT,
  session_index TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ===== TASK #32: ADVANCED SEGMENTATION =====
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Segment rules
  rules JSONB NOT NULL, -- Array of conditions
  combine_with VARCHAR(20) DEFAULT 'AND', -- AND or OR

  -- Metrics
  user_count INT DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, name)
);

CREATE TABLE IF NOT EXISTS segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,

  visitor_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS segment_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,

  date DATE,

  -- Metrics
  sessions INT DEFAULT 0,
  pageviews INT DEFAULT 0,
  conversions INT DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  avg_session_duration INT,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(segment_id, date)
);

-- Indexes
CREATE INDEX idx_white_label_company ON white_label_settings(company_id);
CREATE INDEX idx_cohorts_site ON cohorts(site_id);
CREATE INDEX idx_cohort_members_cohort ON cohort_members(cohort_id);
CREATE INDEX idx_cohort_retention_cohort ON cohort_retention(cohort_id);
CREATE INDEX idx_web_vitals_site ON web_vitals(site_id);
CREATE INDEX idx_web_vitals_url ON web_vitals(page_url);
CREATE INDEX idx_web_vitals_agg_site_date ON web_vitals_aggregates(site_id, date DESC);
CREATE INDEX idx_saml_config_company ON saml_configurations(company_id);
CREATE INDEX idx_saml_sessions_user ON saml_sessions(user_id);
CREATE INDEX idx_segments_site ON segments(site_id);
CREATE INDEX idx_segment_members_segment ON segment_members(segment_id);
CREATE INDEX idx_segment_perf_site_date ON segment_performance(segment_id, date DESC);

-- Enable RLS
ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_retention ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_vitals_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saml_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saml_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies (consolidated for brevity)
CREATE POLICY "company_access"
  ON white_label_settings FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "site_access_cohorts"
  ON cohorts FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "site_access_vitals"
  ON web_vitals FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "site_access_segments"
  ON segments FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Grant permissions
GRANT SELECT ON white_label_settings TO authenticated;
GRANT SELECT ON cohorts TO authenticated;
GRANT SELECT ON cohort_members TO authenticated;
GRANT SELECT ON cohort_retention TO authenticated;
GRANT SELECT ON web_vitals TO authenticated;
GRANT SELECT ON web_vitals_aggregates TO authenticated;
GRANT SELECT ON saml_configurations TO authenticated;
GRANT SELECT ON saml_sessions TO authenticated;
GRANT SELECT ON segments TO authenticated;
GRANT SELECT ON segment_members TO authenticated;
GRANT SELECT ON segment_performance TO authenticated;

-- Database Functions
CREATE OR REPLACE FUNCTION calculate_cohort_retention()
RETURNS void AS $$
DECLARE
  v_cohort_id UUID;
  v_week INT;
  v_returning INT;
  v_total INT;
BEGIN
  FOR v_cohort_id IN SELECT id FROM cohorts LOOP
    FOR v_week IN 0..12 LOOP
      SELECT COUNT(DISTINCT visitor_hash) INTO v_total
      FROM cohort_members WHERE cohort_id = v_cohort_id;

      SELECT COUNT(DISTINCT visitor_hash) INTO v_returning
      FROM cohort_members cm
      WHERE cohort_id = v_cohort_id
      AND EXISTS (
        SELECT 1 FROM tracking_sessions ts
        WHERE ts.visitor_hash = cm.visitor_hash
        AND DATE(ts.started_at) >= cm.first_seen + (v_week * 7)
      );

      INSERT INTO cohort_retention (cohort_id, week, returning_users, total_users, retention_rate)
      VALUES (v_cohort_id, v_week, v_returning, v_total,
              CASE WHEN v_total > 0 THEN (v_returning::DECIMAL / v_total * 100) ELSE 0 END)
      ON CONFLICT (cohort_id, week) DO UPDATE SET
        returning_users = EXCLUDED.returning_users,
        retention_rate = EXCLUDED.retention_rate;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_web_vitals_aggregates(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO web_vitals_aggregates (site_id, date, avg_lcp, avg_fid, avg_cls, avg_fcp, avg_ttfb, performance_score)
  SELECT
    site_id,
    p_date,
    ROUND(AVG(lcp)::NUMERIC, 2),
    ROUND(AVG(fid)::NUMERIC, 2),
    ROUND(AVG(cls)::NUMERIC, 2),
    ROUND(AVG(fcp)::NUMERIC, 2),
    ROUND(AVG(ttfb)::NUMERIC, 2),
    LEAST(100, GREATEST(0, ROUND(100 - ((AVG(lcp)/3000) + (AVG(fid)/100) + (AVG(cls)/0.1)) / 3 * 100)::INT))
  FROM web_vitals
  WHERE DATE(measured_at) = p_date
  GROUP BY site_id
  ON CONFLICT (site_id, date) DO UPDATE SET
    avg_lcp = EXCLUDED.avg_lcp,
    avg_fid = EXCLUDED.avg_fid,
    avg_cls = EXCLUDED.avg_cls,
    avg_fcp = EXCLUDED.avg_fcp,
    avg_ttfb = EXCLUDED.avg_ttfb,
    performance_score = EXCLUDED.performance_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
