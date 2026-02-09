-- Tag Manager System
-- Task #31: Tag Manager

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  -- Tag identity
  name TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- event, custom_event, pixel, script, html
  description TEXT,

  -- Tag configuration
  config JSONB NOT NULL, -- Tag-specific settings
  is_enabled BOOLEAN DEFAULT TRUE,
  is_paused BOOLEAN DEFAULT FALSE,

  -- Versioning
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_published_at TIMESTAMPTZ,

  UNIQUE(site_id, name)
);

-- Create firing rules table
CREATE TABLE IF NOT EXISTS tag_firing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,

  -- Rule identity
  rule_name TEXT NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- page_view, event, click, form_submit, custom
  rule_order INT DEFAULT 0,

  -- Trigger configuration
  trigger_conditions JSONB, -- Array of conditions
  require_all_conditions BOOLEAN DEFAULT FALSE, -- AND vs OR logic

  -- Exceptions
  exception_conditions JSONB, -- Conditions to prevent firing

  is_enabled BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tag_id, rule_name)
);

-- Create data layer for custom dimensions
CREATE TABLE IF NOT EXISTS tag_data_layer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  -- Data variable
  variable_name TEXT NOT NULL,
  variable_type VARCHAR(50), -- string, number, boolean, array
  default_value JSONB,
  description TEXT,

  -- Scoping
  scope VARCHAR(20) DEFAULT 'page', -- page, session, visitor

  is_enabled BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, variable_name)
);

-- Create tag templates
CREATE TABLE IF NOT EXISTS tag_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identity
  name TEXT NOT NULL UNIQUE,
  provider_name TEXT, -- Google Analytics, Meta, Hotjar, etc.
  description TEXT,
  icon_url TEXT,

  -- Template configuration
  required_fields JSONB, -- Array of required config fields
  optional_fields JSONB, -- Array of optional fields
  default_config JSONB,

  category VARCHAR(50), -- analytics, advertising, cdp, optimization
  is_premium BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tag versions/history
CREATE TABLE IF NOT EXISTS tag_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,

  version INT NOT NULL,
  config JSONB NOT NULL,
  change_description TEXT,
  created_by UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tag_id, version)
);

-- Create tag publications (release history)
CREATE TABLE IF NOT EXISTS tag_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,

  version INT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  published_by UUID,
  status VARCHAR(20) DEFAULT 'active', -- active, archived, rollback

  published_to_production BOOLEAN DEFAULT FALSE,
  published_to_staging BOOLEAN DEFAULT FALSE,

  notes TEXT
);

-- Create tag audit log
CREATE TABLE IF NOT EXISTS tag_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,

  action VARCHAR(50) NOT NULL, -- created, updated, published, disabled, deleted
  performed_by UUID,
  changes JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tag testing results
CREATE TABLE IF NOT EXISTS tag_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,

  test_type VARCHAR(50), -- preview, qa, production
  test_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Test results
  fired BOOLEAN DEFAULT FALSE,
  fire_time_ms INT,
  payload JSONB,
  errors JSONB,

  tested_on_url TEXT,
  tested_by UUID
);

-- Create indexes
CREATE INDEX idx_tags_site ON tags(site_id);
CREATE INDEX idx_tags_enabled ON tags(site_id, is_enabled);
CREATE INDEX idx_tag_firing_rules_tag ON tag_firing_rules(tag_id);
CREATE INDEX idx_tag_data_layer_site ON tag_data_layer(site_id);
CREATE INDEX idx_tag_versions_tag ON tag_versions(tag_id);
CREATE INDEX idx_tag_publications_tag ON tag_publications(tag_id);
CREATE INDEX idx_tag_publications_status ON tag_publications(status);
CREATE INDEX idx_tag_audit_tag ON tag_audit_log(tag_id);
CREATE INDEX idx_tag_tests_tag ON tag_test_results(tag_id);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_firing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_data_layer ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "view_own_tags"
  ON tags FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "manage_own_tags"
  ON tags FOR INSERT, UPDATE, DELETE
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  );

CREATE POLICY "view_own_firing_rules"
  ON tag_firing_rules FOR SELECT
  USING (
    tag_id IN (
      SELECT id FROM tags
      WHERE site_id IN (
        SELECT id FROM sites
        WHERE company_id IN (
          SELECT company_id FROM organization_members
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "manage_own_firing_rules"
  ON tag_firing_rules FOR INSERT, UPDATE, DELETE
  USING (
    tag_id IN (
      SELECT id FROM tags
      WHERE site_id IN (
        SELECT id FROM sites
        WHERE company_id IN (
          SELECT company_id FROM organization_members
          WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
      )
    )
  );

CREATE POLICY "view_own_data_layer"
  ON tag_data_layer FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "manage_own_data_layer"
  ON tag_data_layer FOR INSERT, UPDATE, DELETE
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  );

CREATE POLICY "view_tag_templates"
  ON tag_templates FOR SELECT
  USING (true);

CREATE POLICY "view_own_versions"
  ON tag_versions FOR SELECT
  USING (
    tag_id IN (
      SELECT id FROM tags
      WHERE site_id IN (
        SELECT id FROM sites
        WHERE company_id IN (
          SELECT company_id FROM organization_members
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Grant permissions
GRANT SELECT ON tags TO authenticated;
GRANT SELECT ON tag_firing_rules TO authenticated;
GRANT SELECT ON tag_data_layer TO authenticated;
GRANT SELECT ON tag_templates TO authenticated;
GRANT SELECT ON tag_versions TO authenticated;
GRANT SELECT ON tag_publications TO authenticated;
GRANT SELECT ON tag_audit_log TO authenticated;
GRANT SELECT ON tag_test_results TO authenticated;

COMMENT ON TABLE tags IS 'Tracking tags managed through tag manager';
COMMENT ON TABLE tag_firing_rules IS 'Conditions that trigger tag firing';
COMMENT ON TABLE tag_data_layer IS 'Custom data variables for tags';
COMMENT ON TABLE tag_templates IS 'Pre-built tag templates for common vendors';
COMMENT ON TABLE tag_versions IS 'Version history of tag configurations';
COMMENT ON TABLE tag_publications IS 'Publication history and environments';
COMMENT ON TABLE tag_audit_log IS 'Audit trail of tag changes';
COMMENT ON TABLE tag_test_results IS 'Results of tag testing and QA';
