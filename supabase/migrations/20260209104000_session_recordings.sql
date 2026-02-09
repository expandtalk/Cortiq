-- Session Recording tables
-- Task #7: Session Recording

-- Create session_recordings table
CREATE TABLE IF NOT EXISTS session_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  session_id UUID REFERENCES tracking_sessions(id) ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL,

  -- Recording metadata
  recording_url TEXT, -- URL to recording file in storage
  duration_ms INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,

  -- Session context
  page_url TEXT NOT NULL,
  page_title TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  viewport_width INT,
  viewport_height INT,

  -- AI agent detection
  is_ai_agent BOOLEAN DEFAULT FALSE,
  agent_type TEXT, -- chatgpt_browser, perplexity_comet, claude_browser, etc.

  -- Privacy and sampling
  has_masked_data BOOLEAN DEFAULT TRUE,
  sampling_rate DECIMAL(3,2), -- e.g., 0.10 for 10%

  -- Storage and processing
  file_size_bytes BIGINT,
  compressed BOOLEAN DEFAULT TRUE,
  processed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '730 days',

  CONSTRAINT session_recordings_duration_positive CHECK (duration_ms > 0),
  CONSTRAINT session_recordings_duration_max CHECK (duration_ms <= 1800000) -- 30 min max
);

-- Create indexes for faster queries
CREATE INDEX idx_session_recordings_site_id ON session_recordings(site_id, started_at DESC);
CREATE INDEX idx_session_recordings_session_id ON session_recordings(session_id);
CREATE INDEX idx_session_recordings_visitor_hash ON session_recordings(visitor_hash);
CREATE INDEX idx_session_recordings_page_url ON session_recordings(page_url);
CREATE INDEX idx_session_recordings_ai_agent ON session_recordings(is_ai_agent, started_at DESC);
CREATE INDEX idx_session_recordings_expires ON session_recordings(expires_at) WHERE processed = TRUE;

-- Create table for recording events (rrweb events)
CREATE TABLE IF NOT EXISTS session_recording_events (
  id BIGSERIAL PRIMARY KEY,
  recording_id UUID REFERENCES session_recordings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- rrweb event types: 0-5
  timestamp_ms BIGINT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for event retrieval
CREATE INDEX idx_recording_events_recording_id ON session_recording_events(recording_id, timestamp_ms);

-- Create table for recording settings per site
CREATE TABLE IF NOT EXISTS session_recording_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID UNIQUE REFERENCES sites(id) ON DELETE CASCADE,

  -- Enable/disable recording
  enabled BOOLEAN DEFAULT FALSE,

  -- Sampling configuration
  sampling_rate DECIMAL(3,2) DEFAULT 0.10, -- 10% by default
  sample_ai_agents BOOLEAN DEFAULT TRUE, -- Always sample AI agents

  -- Privacy settings
  mask_all_inputs BOOLEAN DEFAULT TRUE,
  mask_all_text BOOLEAN DEFAULT FALSE,
  ignored_elements TEXT[] DEFAULT ARRAY['.sensitive', '[data-private]'],

  -- Recording limits
  max_duration_ms INT DEFAULT 1800000, -- 30 minutes
  max_file_size_mb INT DEFAULT 10,

  -- Retention
  retention_days INT DEFAULT 730,

  -- Filters
  record_only_paths TEXT[], -- e.g., ['/checkout', '/account']
  exclude_paths TEXT[], -- e.g., ['/admin', '/api']

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT sampling_rate_valid CHECK (sampling_rate >= 0 AND sampling_rate <= 1),
  CONSTRAINT retention_days_positive CHECK (retention_days > 0)
);

-- Create index for settings lookup
CREATE INDEX idx_recording_settings_site_id ON session_recording_settings(site_id);

-- RLS Policies
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recording_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recording_settings ENABLE ROW LEVEL SECURITY;

-- Users can view recordings for their sites
CREATE POLICY "view_own_site_recordings"
  ON session_recordings FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can insert recordings for their sites (from tracking script)
CREATE POLICY "insert_site_recordings"
  ON session_recordings FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can delete recordings for their sites
CREATE POLICY "delete_own_site_recordings"
  ON session_recordings FOR DELETE
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Recording events policies
CREATE POLICY "view_own_recording_events"
  ON session_recording_events FOR SELECT
  USING (
    recording_id IN (
      SELECT id FROM session_recordings
      WHERE site_id IN (
        SELECT id FROM sites
        WHERE company_id IN (
          SELECT company_id FROM organization_members
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Recording settings policies
CREATE POLICY "view_own_recording_settings"
  ON session_recording_settings FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "update_own_recording_settings"
  ON session_recording_settings FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "insert_own_recording_settings"
  ON session_recording_settings FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to clean up expired recordings
CREATE OR REPLACE FUNCTION cleanup_expired_recordings()
RETURNS void AS $$
BEGIN
  -- Delete expired recordings
  DELETE FROM session_recordings
  WHERE expires_at < NOW() AND processed = TRUE;

  -- Delete orphaned events (shouldn't happen due to CASCADE, but just in case)
  DELETE FROM session_recording_events
  WHERE recording_id NOT IN (SELECT id FROM session_recordings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (run daily via pg_cron)
-- SELECT cron.schedule('cleanup-recordings', '0 2 * * *', 'SELECT cleanup_expired_recordings()');

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON session_recordings TO authenticated;
GRANT SELECT ON session_recording_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON session_recording_settings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE session_recording_events_id_seq TO authenticated;

-- Add comments
COMMENT ON TABLE session_recordings IS 'Session recording metadata for rrweb playback';
COMMENT ON TABLE session_recording_events IS 'rrweb events for session recordings (stored as JSONB)';
COMMENT ON TABLE session_recording_settings IS 'Per-site configuration for session recording';
