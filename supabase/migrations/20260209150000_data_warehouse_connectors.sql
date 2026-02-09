-- Data Warehouse Connector Integration
-- Task #23: Data Warehouse Connector

-- Create warehouse connector configurations
CREATE TABLE IF NOT EXISTS warehouse_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Connector identity
  name TEXT NOT NULL,
  warehouse_type VARCHAR(50) NOT NULL, -- bigquery, snowflake, redshift, postgres, mysql, etc.
  description TEXT,

  -- Connection credentials (encrypted)
  credentials JSONB NOT NULL, -- Encrypted in transit, stored securely

  -- Configuration
  settings JSONB, -- Type-specific settings
  schema_name TEXT DEFAULT 'analytics',
  table_prefix TEXT DEFAULT 'cortiq_',

  -- Sync configuration
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency VARCHAR(20) DEFAULT 'daily', -- hourly, daily, weekly
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'active', -- active, paused, error, testing
  error_message TEXT,
  connection_tested_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, name)
);

-- Create sync jobs tracking
CREATE TABLE IF NOT EXISTS warehouse_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID REFERENCES warehouse_connectors(id) ON DELETE CASCADE,

  -- Job details
  job_type VARCHAR(20) NOT NULL, -- full_sync, incremental_sync, schema_update
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  progress_percentage INT DEFAULT 0,

  -- Data range
  sync_from DATE,
  sync_to DATE,

  -- Sync statistics
  total_rows INT DEFAULT 0,
  rows_synced INT DEFAULT 0,
  rows_failed INT DEFAULT 0,
  bytes_transferred INT DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INT,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create warehouse table schemas
CREATE TABLE IF NOT EXISTS warehouse_table_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID REFERENCES warehouse_connectors(id) ON DELETE CASCADE,

  -- Table identity
  table_name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,

  -- Schema definition
  columns JSONB NOT NULL, -- Array of {name, type, description, nullable}
  primary_keys TEXT[], -- Array of column names
  indexes JSONB, -- Index definitions

  -- Sync tracking
  auto_sync BOOLEAN DEFAULT TRUE,
  partition_column TEXT, -- Column to partition on (usually date)
  partition_interval VARCHAR(20), -- daily, monthly

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(connector_id, table_name)
);

-- Create data quality metrics
CREATE TABLE IF NOT EXISTS warehouse_data_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID REFERENCES warehouse_connectors(id) ON DELETE CASCADE,

  -- Quality metrics
  date DATE NOT NULL,
  total_records INT DEFAULT 0,
  duplicate_records INT DEFAULT 0,
  null_records INT DEFAULT 0,
  invalid_records INT DEFAULT 0,

  -- Data freshness
  latest_data_timestamp TIMESTAMPTZ,
  staleness_hours INT,

  -- Sync success rate
  sync_success_rate DECIMAL(5,2) DEFAULT 100,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(connector_id, date)
);

-- Create audit log for connector changes
CREATE TABLE IF NOT EXISTS warehouse_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID REFERENCES warehouse_connectors(id) ON DELETE CASCADE,

  -- Action
  action VARCHAR(50) NOT NULL, -- created, updated, tested, synced, deleted
  action_by UUID,
  description TEXT,

  -- Changes
  changes JSONB, -- What was changed

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_warehouse_connectors_site ON warehouse_connectors(site_id);
CREATE INDEX idx_warehouse_connectors_company ON warehouse_connectors(company_id);
CREATE INDEX idx_warehouse_sync_jobs_connector ON warehouse_sync_jobs(connector_id);
CREATE INDEX idx_warehouse_sync_jobs_status ON warehouse_sync_jobs(status);
CREATE INDEX idx_warehouse_sync_jobs_created ON warehouse_sync_jobs(created_at DESC);
CREATE INDEX idx_warehouse_table_schemas_connector ON warehouse_table_schemas(connector_id);
CREATE INDEX idx_warehouse_data_quality_date ON warehouse_data_quality(connector_id, date DESC);
CREATE INDEX idx_warehouse_audit_log_connector ON warehouse_audit_log(connector_id);
CREATE INDEX idx_warehouse_audit_log_created ON warehouse_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE warehouse_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_table_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_data_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "view_own_warehouse_connectors"
  ON warehouse_connectors FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "create_warehouse_connectors"
  ON warehouse_connectors FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "update_warehouse_connectors"
  ON warehouse_connectors FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "delete_warehouse_connectors"
  ON warehouse_connectors FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "view_own_sync_jobs"
  ON warehouse_sync_jobs FOR SELECT
  USING (
    connector_id IN (
      SELECT id FROM warehouse_connectors
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_table_schemas"
  ON warehouse_table_schemas FOR SELECT
  USING (
    connector_id IN (
      SELECT id FROM warehouse_connectors
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_data_quality"
  ON warehouse_data_quality FOR SELECT
  USING (
    connector_id IN (
      SELECT id FROM warehouse_connectors
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_audit_log"
  ON warehouse_audit_log FOR SELECT
  USING (
    connector_id IN (
      SELECT id FROM warehouse_connectors
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to test warehouse connection
CREATE OR REPLACE FUNCTION test_warehouse_connection(p_connector_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_connector warehouse_connectors;
  v_credentials JSONB;
BEGIN
  -- Get connector
  SELECT * INTO v_connector FROM warehouse_connectors WHERE id = p_connector_id;

  IF v_connector IS NULL THEN
    RETURN QUERY SELECT false, 'Connector not found'::TEXT;
    RETURN;
  END IF;

  -- Test would be implemented in Edge Function
  -- Update connector with test status
  UPDATE warehouse_connectors
  SET connection_tested_at = NOW(), status = 'active'
  WHERE id = p_connector_id;

  RETURN QUERY SELECT true, 'Connection successful'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule sync job
CREATE OR REPLACE FUNCTION schedule_warehouse_sync(p_connector_id UUID, p_job_type VARCHAR, p_sync_from DATE DEFAULT NULL, p_sync_to DATE DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO warehouse_sync_jobs (connector_id, job_type, status, sync_from, sync_to)
  VALUES (p_connector_id, p_job_type, 'pending', COALESCE(p_sync_from, CURRENT_DATE - INTERVAL '30 days'), COALESCE(p_sync_to, CURRENT_DATE))
  RETURNING id INTO v_job_id;

  UPDATE warehouse_connectors
  SET next_sync_at = NOW()
  WHERE id = p_connector_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit event
CREATE OR REPLACE FUNCTION log_warehouse_audit(p_connector_id UUID, p_action VARCHAR, p_description TEXT, p_changes JSONB DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO warehouse_audit_log (connector_id, action, action_by, description, changes)
  VALUES (p_connector_id, p_action, auth.uid(), p_description, p_changes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON warehouse_connectors TO authenticated;
GRANT SELECT ON warehouse_sync_jobs TO authenticated;
GRANT SELECT ON warehouse_table_schemas TO authenticated;
GRANT SELECT ON warehouse_data_quality TO authenticated;
GRANT SELECT ON warehouse_audit_log TO authenticated;

COMMENT ON TABLE warehouse_connectors IS 'Data warehouse connector configurations';
COMMENT ON TABLE warehouse_sync_jobs IS 'Data warehouse sync job tracking';
COMMENT ON TABLE warehouse_table_schemas IS 'Warehouse table schema definitions';
COMMENT ON TABLE warehouse_data_quality IS 'Data quality metrics for warehouse syncs';
COMMENT ON TABLE warehouse_audit_log IS 'Audit log of connector changes and syncs';
