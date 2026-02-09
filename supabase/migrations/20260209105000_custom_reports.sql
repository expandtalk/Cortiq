-- Custom Reports tables
-- Task #8: Custom Reports (rapportbyggare)

CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Report configuration (JSON)
  config JSONB NOT NULL,
  -- config structure:
  -- {
  --   "dimensions": ["page", "device", "country"],
  --   "metrics": ["visits", "pageviews", "bounce_rate"],
  --   "filters": {...},
  --   "visualization": "table" | "line" | "bar" | "pie",
  --   "sort": {"field": "visits", "order": "desc"},
  --   "limit": 100
  -- }

  -- Scheduling (cron expression or null)
  schedule TEXT,
  recipients TEXT[], -- email addresses
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,

  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  shared_with UUID[], -- user IDs who can view this report
  is_public BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT custom_reports_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100)
);

-- Create indexes
CREATE INDEX idx_custom_reports_site_id ON custom_reports(site_id);
CREATE INDEX idx_custom_reports_company_id ON custom_reports(company_id);
CREATE INDEX idx_custom_reports_created_by ON custom_reports(created_by);
CREATE INDEX idx_custom_reports_schedule ON custom_reports(schedule) WHERE schedule IS NOT NULL;

-- RLS Policies
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

-- Users can view reports they created or reports shared with them
CREATE POLICY "view_own_or_shared_reports"
  ON custom_reports FOR SELECT
  USING (
    created_by = auth.uid() OR
    auth.uid() = ANY(shared_with) OR
    (is_public AND company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Users can create reports for their sites
CREATE POLICY "create_own_reports"
  ON custom_reports FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update reports they created
CREATE POLICY "update_own_reports"
  ON custom_reports FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete reports they created
CREATE POLICY "delete_own_reports"
  ON custom_reports FOR DELETE
  USING (created_by = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_report_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_reports_updated_at
  BEFORE UPDATE ON custom_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_report_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_reports TO authenticated;

-- Add comment
COMMENT ON TABLE custom_reports IS 'Custom report configurations created by users';
