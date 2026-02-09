-- Scheduled Reports
-- Task #13: Schemalagda e-postrapporter

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Schedule configuration
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday for weekly
  day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31), -- for monthly
  time_of_day TIME NOT NULL DEFAULT '09:00',

  -- Recipients
  recipients TEXT[] NOT NULL, -- email addresses
  include_chart BOOLEAN DEFAULT TRUE,
  include_table BOOLEAN DEFAULT TRUE,
  format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'html', 'png')),

  -- Branding
  include_logo BOOLEAN DEFAULT TRUE,
  custom_message TEXT,

  -- Scheduling
  is_active BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_weekly_schedule CHECK (
    (frequency != 'weekly' OR day_of_week IS NOT NULL)
  ),
  CONSTRAINT valid_monthly_schedule CHECK (
    (frequency != 'monthly' OR day_of_month IS NOT NULL)
  )
);

-- Index for scheduling
CREATE INDEX idx_scheduled_reports_next_send ON scheduled_reports(next_send_at) WHERE is_active = TRUE;
CREATE INDEX idx_scheduled_reports_company ON scheduled_reports(company_id);

-- RLS Policies
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_scheduled_reports"
  ON scheduled_reports FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "create_own_scheduled_reports"
  ON scheduled_reports FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "update_own_scheduled_reports"
  ON scheduled_reports FOR UPDATE
  USING (
    created_by = auth.uid()
  );

-- Function to calculate next send time
CREATE OR REPLACE FUNCTION calculate_next_send_time(
  p_frequency TEXT,
  p_day_of_week INT,
  p_day_of_month INT,
  p_time_of_day TIME
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_send TIMESTAMPTZ;
  v_today DATE := CURRENT_DATE;
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      v_next_send := (v_today + INTERVAL '1 day')::TIMESTAMP || ' ' || p_time_of_day;

    WHEN 'weekly' THEN
      -- Calculate next occurrence of the specified day of week
      v_next_send := v_today + ((p_day_of_week - EXTRACT(dow FROM v_today)::INT + 7) % 7)::INT * INTERVAL '1 day';
      IF v_next_send <= CURRENT_TIMESTAMP THEN
        v_next_send := v_next_send + INTERVAL '7 days';
      END IF;
      v_next_send := v_next_send::TIMESTAMP || ' ' || p_time_of_day;

    WHEN 'monthly' THEN
      -- Calculate next occurrence of the specified day of month
      v_next_send := DATE_TRUNC('month', v_today)::DATE + (p_day_of_month - 1)::INT * INTERVAL '1 day';
      IF v_next_send <= CURRENT_TIMESTAMP THEN
        v_next_send := DATE_TRUNC('month', v_next_send + INTERVAL '1 month')::DATE + (p_day_of_month - 1)::INT * INTERVAL '1 day';
      END IF;
      v_next_send := v_next_send::TIMESTAMP || ' ' || p_time_of_day;
  END CASE;

  RETURN v_next_send;
END;
$$ LANGUAGE plpgsql;

-- Function to update next_send_at on insert/update
CREATE OR REPLACE FUNCTION update_next_send_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_send_at := calculate_next_send_time(
    NEW.frequency,
    NEW.day_of_week,
    NEW.day_of_month,
    NEW.time_of_day
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scheduled_reports_next_send
  BEFORE INSERT OR UPDATE ON scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_next_send_time();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_reports TO authenticated;

COMMENT ON TABLE scheduled_reports IS 'Configuration for automated report emails';
