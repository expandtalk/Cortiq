-- Advanced Geolocation with Map
-- Task #17: Avancerad Geolokalisering med Karta

-- Create geolocation aggregates table
CREATE TABLE IF NOT EXISTS geolocation_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  -- Geographic data
  country_code VARCHAR(2),
  country_name TEXT,
  region_code VARCHAR(3),
  region_name TEXT,
  city_name TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  date DATE NOT NULL,

  -- Metrics
  sessions INT DEFAULT 0,
  pageviews INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  avg_session_duration DECIMAL(10,2) DEFAULT 0,
  conversions INT DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, country_code, region_code, city_name, date)
);

-- Create geolocation hierarchy for drill-down analysis
CREATE TABLE IF NOT EXISTS geolocation_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Geographic hierarchy
  country_code VARCHAR(2) NOT NULL,
  country_name TEXT NOT NULL,
  region_code VARCHAR(3),
  region_name TEXT,
  city_name TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Hierarchy level: country, region, city
  level VARCHAR(20) NOT NULL,

  -- Parent reference for drill-down
  parent_id UUID REFERENCES geolocation_hierarchy(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(country_code, region_code, city_name, level)
);

-- Create geo-clustering for better map visualization
CREATE TABLE IF NOT EXISTS geolocation_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  -- Cluster bounds
  zoom_level INT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,

  -- Aggregated data for this cluster
  sessions INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  conversions INT DEFAULT 0,

  date DATE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, zoom_level, latitude, longitude, date)
);

-- Create heatmap density points for geographic heatmap visualization
CREATE TABLE IF NOT EXISTS geoheatmap_density (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  intensity INT DEFAULT 1, -- 0-100 scale

  date DATE NOT NULL,
  hour INT, -- 0-23 for hourly breakdown

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, latitude, longitude, date, hour)
);

-- Indexes for query performance
CREATE INDEX idx_geolocation_site_date ON geolocation_aggregates(site_id, date DESC);
CREATE INDEX idx_geolocation_country ON geolocation_aggregates(country_code);
CREATE INDEX idx_geolocation_region ON geolocation_aggregates(country_code, region_code);
CREATE INDEX idx_geolocation_city ON geolocation_aggregates(country_code, region_code, city_name);
CREATE INDEX idx_geolocation_coords ON geolocation_aggregates(latitude, longitude);

CREATE INDEX idx_geo_hierarchy_country ON geolocation_hierarchy(country_code);
CREATE INDEX idx_geo_hierarchy_region ON geolocation_hierarchy(country_code, region_code);
CREATE INDEX idx_geo_hierarchy_level ON geolocation_hierarchy(level);

CREATE INDEX idx_geo_clusters_site_date ON geolocation_clusters(site_id, date DESC);
CREATE INDEX idx_geo_clusters_zoom ON geolocation_clusters(zoom_level);

CREATE INDEX idx_geoheatmap_site_date ON geoheatmap_density(site_id, date DESC);
CREATE INDEX idx_geoheatmap_coords ON geoheatmap_density(latitude, longitude);

-- Enable RLS
ALTER TABLE geolocation_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE geolocation_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE geolocation_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE geoheatmap_density ENABLE ROW LEVEL SECURITY;

-- RLS Policies for geolocation_aggregates
CREATE POLICY "view_own_geolocation_data"
  ON geolocation_aggregates FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for geolocation_clusters
CREATE POLICY "view_own_geo_clusters"
  ON geolocation_clusters FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for geoheatmap_density
CREATE POLICY "view_own_geoheatmap"
  ON geoheatmap_density FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Public read access for geolocation_hierarchy (geographic reference data)
CREATE POLICY "public_read_geo_hierarchy"
  ON geolocation_hierarchy FOR SELECT
  USING (true);

-- Function to aggregate geolocation statistics
CREATE OR REPLACE FUNCTION aggregate_geolocation_stats(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO geolocation_aggregates (
    site_id, country_code, country_name, region_code, region_name, city_name,
    latitude, longitude, date, sessions, pageviews, unique_visitors,
    bounce_rate, avg_session_duration, conversions, conversion_rate
  )
  SELECT
    s.site_id,
    s.country_code,
    s.country_name,
    s.region_code,
    s.region_name,
    s.city_name,
    s.latitude,
    s.longitude,
    DATE(s.started_at),
    COUNT(DISTINCT s.id) as sessions,
    SUM(s.page_views) as pageviews,
    COUNT(DISTINCT s.visitor_hash) as unique_visitors,
    CASE
      WHEN COUNT(DISTINCT s.id) > 0
      THEN (SELECT COUNT(*) FILTER(WHERE s.bounced) / COUNT(DISTINCT s.id)::DECIMAL * 100)
      ELSE 0
    END as bounce_rate,
    CASE
      WHEN COUNT(DISTINCT s.id) > 0
      THEN AVG(EXTRACT(EPOCH FROM (s.ended_at - s.started_at)))
      ELSE 0
    END as avg_session_duration,
    COUNT(DISTINCT c.id) as conversions,
    CASE
      WHEN COUNT(DISTINCT s.id) > 0
      THEN (COUNT(DISTINCT c.id)::DECIMAL / COUNT(DISTINCT s.id) * 100)
      ELSE 0
    END as conversion_rate
  FROM tracking_sessions s
  LEFT JOIN conversion_events c ON c.session_id = s.id
  WHERE DATE(s.started_at) = p_date
    AND s.country_code IS NOT NULL
  GROUP BY s.site_id, s.country_code, s.country_name, s.region_code, s.region_name,
           s.city_name, s.latitude, s.longitude, DATE(s.started_at)
  ON CONFLICT (site_id, country_code, region_code, city_name, date)
  DO UPDATE SET
    sessions = EXCLUDED.sessions,
    pageviews = EXCLUDED.pageviews,
    unique_visitors = EXCLUDED.unique_visitors,
    bounce_rate = EXCLUDED.bounce_rate,
    avg_session_duration = EXCLUDED.avg_session_duration,
    conversions = EXCLUDED.conversions,
    conversion_rate = EXCLUDED.conversion_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate geo clusters for map visualization
CREATE OR REPLACE FUNCTION aggregate_geo_clusters(p_site_id UUID, p_date DATE, p_zoom INT)
RETURNS void AS $$
DECLARE
  v_cluster_size DECIMAL;
BEGIN
  -- Cluster size decreases with zoom level (finer granularity at higher zoom)
  v_cluster_size := 360.0 / POWER(2, p_zoom)::DECIMAL;

  INSERT INTO geolocation_clusters (site_id, zoom_level, latitude, longitude, sessions, unique_visitors, conversions, date)
  SELECT
    p_site_id,
    p_zoom,
    ROUND((latitude / v_cluster_size)::NUMERIC, 6) * v_cluster_size,
    ROUND((longitude / v_cluster_size)::NUMERIC, 6) * v_cluster_size,
    SUM(sessions),
    SUM(unique_visitors),
    SUM(conversions),
    p_date
  FROM geolocation_aggregates
  WHERE site_id = p_site_id
    AND date = p_date
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
  GROUP BY ROUND((latitude / v_cluster_size)::NUMERIC, 6), ROUND((longitude / v_cluster_size)::NUMERIC, 6)
  ON CONFLICT (site_id, zoom_level, latitude, longitude, date)
  DO UPDATE SET
    sessions = EXCLUDED.sessions,
    unique_visitors = EXCLUDED.unique_visitors,
    conversions = EXCLUDED.conversions,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate geoheatmap density points
CREATE OR REPLACE FUNCTION generate_geoheatmap_density(p_site_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO geoheatmap_density (site_id, latitude, longitude, intensity, date, hour)
  SELECT
    p_site_id,
    latitude,
    longitude,
    LEAST(100, GREATEST(1, ROUND((unique_visitors / NULLIF(
      (SELECT MAX(unique_visitors) FROM geolocation_aggregates
       WHERE site_id = p_site_id AND date = p_date), 0)) * 100)::INT)),
    p_date,
    NULL
  FROM geolocation_aggregates
  WHERE site_id = p_site_id
    AND date = p_date
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
  ON CONFLICT (site_id, latitude, longitude, date, hour)
  DO UPDATE SET
    intensity = EXCLUDED.intensity,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON geolocation_aggregates TO authenticated;
GRANT SELECT ON geolocation_hierarchy TO authenticated;
GRANT SELECT ON geolocation_clusters TO authenticated;
GRANT SELECT ON geoheatmap_density TO authenticated;

COMMENT ON TABLE geolocation_aggregates IS 'Aggregated visitor statistics by geographic location';
COMMENT ON TABLE geolocation_hierarchy IS 'Geographic reference hierarchy for drill-down analysis';
COMMENT ON TABLE geolocation_clusters IS 'Clustered geolocation data for map visualization at different zoom levels';
COMMENT ON TABLE geoheatmap_density IS 'Density heatmap points for geographic distribution visualization';
