-- Media Analytics Tracking
-- Task #22: Media Analytics (Video, Audio, Documents)

-- Create media metadata table
CREATE TABLE IF NOT EXISTS media_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  -- Media identification
  media_id TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL, -- video, audio, document, image
  media_url TEXT NOT NULL,
  media_title TEXT,
  media_duration INT, -- Duration in seconds (for video/audio)
  file_size INT, -- Size in bytes

  -- Media properties
  format VARCHAR(20), -- mp4, webm, pdf, jpg, etc.
  dimensions TEXT, -- JSON: {width, height} for videos
  bitrate INT, -- Bitrate in kbps

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, media_id)
);

-- Create media events table
CREATE TABLE IF NOT EXISTS media_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  session_id UUID,

  media_id TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL,

  -- Event types: play, pause, resume, seek, complete, progress, error
  event_type VARCHAR(20) NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,

  -- Event-specific data
  current_time INT, -- Current playback time in seconds
  target_time INT, -- Target time for seek events
  duration INT, -- Total duration
  playback_rate DECIMAL(4,2), -- Playback speed (0.5, 1, 1.5, 2.0, etc.)
  volume INT, -- Volume level 0-100
  is_fullscreen BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,

  -- Quality tracking
  quality VARCHAR(20), -- 360p, 480p, 720p, 1080p, etc.
  buffering_duration INT, -- Buffering time in ms
  dropped_frames INT,

  -- Device context
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),

  -- Error tracking
  error_code VARCHAR(50),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create media engagement aggregates
CREATE TABLE IF NOT EXISTS media_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  media_id TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL,
  media_title TEXT,

  date DATE NOT NULL,

  -- Metrics
  total_plays INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  unique_viewers INT DEFAULT 0,
  average_watch_time INT DEFAULT 0, -- In seconds
  total_watch_time INT DEFAULT 0, -- In seconds
  completion_rate DECIMAL(5,2) DEFAULT 0, -- 0-100
  average_completion_time INT DEFAULT 0,
  drop_off_rate DECIMAL(5,2) DEFAULT 0,

  -- Engagement metrics
  average_playback_rate DECIMAL(4,2) DEFAULT 1.0,
  pause_count INT DEFAULT 0,
  seek_count INT DEFAULT 0,
  error_count INT DEFAULT 0,

  -- Quality metrics
  average_quality VARCHAR(20),
  quality_switches INT DEFAULT 0,
  buffering_events INT DEFAULT 0,
  average_buffering_duration INT DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, media_id, date)
);

-- Create media performance by time
CREATE TABLE IF NOT EXISTS media_performance_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  media_id TEXT NOT NULL,
  date DATE NOT NULL,
  hour INT NOT NULL, -- 0-23

  -- Hourly metrics
  plays INT DEFAULT 0,
  sessions INT DEFAULT 0,
  viewers INT DEFAULT 0,
  total_watch_time INT DEFAULT 0,
  average_watch_time INT DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, media_id, date, hour)
);

-- Create video progress tracking
CREATE TABLE IF NOT EXISTS media_progress_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  session_id UUID,

  media_id TEXT NOT NULL,
  visitor_hash TEXT,

  -- Progress tracking at key points
  progress_percentage INT, -- 0, 25, 50, 75, 100
  actual_time INT, -- Actual playback time
  duration INT,

  reached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create media quality distribution
CREATE TABLE IF NOT EXISTS media_quality_distribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,

  media_id TEXT NOT NULL,
  quality VARCHAR(20),
  date DATE NOT NULL,

  views INT DEFAULT 0,
  total_watch_time INT DEFAULT 0,
  average_watch_time INT DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, media_id, quality, date)
);

-- Indexes for performance
CREATE INDEX idx_media_metadata_site ON media_metadata(site_id);
CREATE INDEX idx_media_events_site_time ON media_events(site_id, event_timestamp DESC);
CREATE INDEX idx_media_events_media_id ON media_events(media_id);
CREATE INDEX idx_media_events_type ON media_events(event_type);
CREATE INDEX idx_media_engagement_site_date ON media_engagement(site_id, date DESC);
CREATE INDEX idx_media_engagement_media ON media_engagement(media_id);
CREATE INDEX idx_media_performance_site_date ON media_performance_timeline(site_id, date DESC);
CREATE INDEX idx_media_progress_session ON media_progress_points(session_id);
CREATE INDEX idx_media_quality_site_date ON media_quality_distribution(site_id, date DESC);

-- Enable RLS
ALTER TABLE media_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_performance_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_progress_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_quality_distribution ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "view_own_media_metadata"
  ON media_metadata FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_media_events"
  ON media_events FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_media_engagement"
  ON media_engagement FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_media_performance"
  ON media_performance_timeline FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_media_progress"
  ON media_progress_points FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "view_own_media_quality"
  ON media_quality_distribution FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to aggregate media engagement statistics
CREATE OR REPLACE FUNCTION aggregate_media_engagement(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO media_engagement (
    site_id, media_id, media_type, media_title, date,
    total_plays, total_sessions, unique_viewers, average_watch_time, total_watch_time,
    completion_rate, pause_count, seek_count, error_count
  )
  SELECT
    e.site_id,
    e.media_id,
    e.media_type,
    m.media_title,
    DATE(e.event_timestamp),
    COUNT(CASE WHEN e.event_type = 'play' THEN 1 END) as total_plays,
    COUNT(DISTINCT e.session_id) as total_sessions,
    COUNT(DISTINCT COALESCE(e.session_id, e.id)) as unique_viewers,
    ROUND(AVG(CASE WHEN e.event_type = 'progress' THEN e.current_time ELSE NULL END))::INT as average_watch_time,
    ROUND(SUM(CASE WHEN e.event_type = 'progress' THEN e.current_time ELSE 0 END))::INT as total_watch_time,
    CASE
      WHEN e.media_type = 'video' OR e.media_type = 'audio'
      THEN ROUND((COUNT(CASE WHEN e.event_type = 'complete' THEN 1 END)::DECIMAL /
                  NULLIF(COUNT(CASE WHEN e.event_type = 'play' THEN 1 END), 0)) * 100)::DECIMAL(5,2)
      ELSE 0
    END as completion_rate,
    COUNT(CASE WHEN e.event_type = 'pause' THEN 1 END) as pause_count,
    COUNT(CASE WHEN e.event_type = 'seek' THEN 1 END) as seek_count,
    COUNT(CASE WHEN e.event_type = 'error' THEN 1 END) as error_count
  FROM media_events e
  LEFT JOIN media_metadata m ON m.media_id = e.media_id AND m.site_id = e.site_id
  WHERE DATE(e.event_timestamp) = p_date
  GROUP BY e.site_id, e.media_id, e.media_type, m.media_title, DATE(e.event_timestamp)
  ON CONFLICT (site_id, media_id, date)
  DO UPDATE SET
    total_plays = EXCLUDED.total_plays,
    total_sessions = EXCLUDED.total_sessions,
    unique_viewers = EXCLUDED.unique_viewers,
    average_watch_time = EXCLUDED.average_watch_time,
    total_watch_time = EXCLUDED.total_watch_time,
    completion_rate = EXCLUDED.completion_rate,
    pause_count = EXCLUDED.pause_count,
    seek_count = EXCLUDED.seek_count,
    error_count = EXCLUDED.error_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate hourly media performance
CREATE OR REPLACE FUNCTION aggregate_media_hourly(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO media_performance_timeline (site_id, media_id, date, hour, plays, sessions, viewers, total_watch_time, average_watch_time)
  SELECT
    e.site_id,
    e.media_id,
    DATE(e.event_timestamp),
    EXTRACT(HOUR FROM e.event_timestamp)::INT,
    COUNT(CASE WHEN e.event_type = 'play' THEN 1 END) as plays,
    COUNT(DISTINCT e.session_id) as sessions,
    COUNT(DISTINCT COALESCE(e.session_id, e.id)) as viewers,
    ROUND(SUM(CASE WHEN e.event_type = 'progress' THEN e.current_time ELSE 0 END))::INT as total_watch_time,
    ROUND(AVG(CASE WHEN e.event_type = 'progress' THEN e.current_time ELSE NULL END))::INT as average_watch_time
  FROM media_events e
  WHERE DATE(e.event_timestamp) = p_date
  GROUP BY e.site_id, e.media_id, DATE(e.event_timestamp), EXTRACT(HOUR FROM e.event_timestamp)
  ON CONFLICT (site_id, media_id, date, hour)
  DO UPDATE SET
    plays = EXCLUDED.plays,
    sessions = EXCLUDED.sessions,
    viewers = EXCLUDED.viewers,
    total_watch_time = EXCLUDED.total_watch_time,
    average_watch_time = EXCLUDED.average_watch_time,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate quality distribution
CREATE OR REPLACE FUNCTION aggregate_media_quality(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO media_quality_distribution (site_id, media_id, quality, date, views, total_watch_time, average_watch_time, completion_rate)
  SELECT
    e.site_id,
    e.media_id,
    COALESCE(e.quality, 'unknown'),
    DATE(e.event_timestamp),
    COUNT(CASE WHEN e.event_type = 'play' THEN 1 END) as views,
    ROUND(SUM(CASE WHEN e.event_type = 'progress' THEN e.current_time ELSE 0 END))::INT as total_watch_time,
    ROUND(AVG(CASE WHEN e.event_type = 'progress' THEN e.current_time ELSE NULL END))::INT as average_watch_time,
    CASE
      WHEN COUNT(CASE WHEN e.event_type = 'play' THEN 1 END) > 0
      THEN ROUND((COUNT(CASE WHEN e.event_type = 'complete' THEN 1 END)::DECIMAL /
                  COUNT(CASE WHEN e.event_type = 'play' THEN 1 END)) * 100)::DECIMAL(5,2)
      ELSE 0
    END as completion_rate
  FROM media_events e
  WHERE DATE(e.event_timestamp) = p_date
  GROUP BY e.site_id, e.media_id, COALESCE(e.quality, 'unknown'), DATE(e.event_timestamp)
  ON CONFLICT (site_id, media_id, quality, date)
  DO UPDATE SET
    views = EXCLUDED.views,
    total_watch_time = EXCLUDED.total_watch_time,
    average_watch_time = EXCLUDED.average_watch_time,
    completion_rate = EXCLUDED.completion_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON media_metadata TO authenticated;
GRANT SELECT ON media_events TO authenticated;
GRANT SELECT ON media_engagement TO authenticated;
GRANT SELECT ON media_performance_timeline TO authenticated;
GRANT SELECT ON media_progress_points TO authenticated;
GRANT SELECT ON media_quality_distribution TO authenticated;

COMMENT ON TABLE media_metadata IS 'Media file metadata and properties';
COMMENT ON TABLE media_events IS 'User media interaction events (play, pause, seek, etc.)';
COMMENT ON TABLE media_engagement IS 'Aggregated media engagement metrics by date';
COMMENT ON TABLE media_performance_timeline IS 'Hourly media performance metrics';
COMMENT ON TABLE media_progress_points IS 'User progress tracking at key points';
COMMENT ON TABLE media_quality_distribution IS 'Media viewing statistics by quality level';
