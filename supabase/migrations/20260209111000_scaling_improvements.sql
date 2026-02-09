-- Scaling Improvements
-- Task #12: Skalning - Höj rate limits

-- Update rate limits in existing tables
ALTER TABLE rate_limit_config
ALTER COLUMN max_events_per_hour SET DEFAULT 100000;

-- Partitioning for tracking_events (by month)
-- This improves query performance for large datasets

-- Drop existing table constraints if needed
-- ALTER TABLE tracking_events DROP CONSTRAINT IF EXISTS tracking_events_pkey CASCADE;

-- Create partitioned table structure (if not already partitioned)
DO $$
BEGIN
  -- Check if table is already partitioned
  IF NOT EXISTS (
    SELECT 1 FROM pg_partman.part_config WHERE parent_table = 'public.tracking_events'
  ) THEN
    -- Convert to partitioned table (requires manual migration in production)
    -- This is a template for the partitioning strategy
    RAISE NOTICE 'Table partitioning should be done during maintenance window';
  END IF;
END $$;

-- Create event queue table for async processing
CREATE TABLE IF NOT EXISTS event_queue (
  id BIGSERIAL PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  event_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for queue processing
CREATE INDEX idx_event_queue_status ON event_queue(status, created_at)
WHERE status IN ('pending', 'failed');

-- Create aggregation tables for faster queries
CREATE TABLE IF NOT EXISTS daily_site_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Aggregated metrics
  total_sessions INT DEFAULT 0,
  total_pageviews INT DEFAULT 0,
  total_events INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  avg_session_duration DECIMAL(10,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,

  -- AI agent metrics
  ai_agent_sessions INT DEFAULT 0,
  ai_agent_pageviews INT DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(site_id, date)
);

-- Index for fast lookups
CREATE INDEX idx_daily_stats_site_date ON daily_site_stats(site_id, date DESC);

-- Function to aggregate daily stats
CREATE OR REPLACE FUNCTION aggregate_daily_stats(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO daily_site_stats (
    site_id, date, total_sessions, total_pageviews, total_events,
    unique_visitors, avg_session_duration, bounce_rate,
    ai_agent_sessions, ai_agent_pageviews
  )
  SELECT
    s.site_id,
    DATE(s.started_at) as date,
    COUNT(DISTINCT s.id) as total_sessions,
    SUM(s.page_views) as total_pageviews,
    COUNT(e.id) as total_events,
    COUNT(DISTINCT s.visitor_hash) as unique_visitors,
    AVG(s.duration_seconds) as avg_session_duration,
    (COUNT(*) FILTER (WHERE s.page_views = 1)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as bounce_rate,
    COUNT(*) FILTER (WHERE s.is_ai_agent = TRUE) as ai_agent_sessions,
    SUM(s.page_views) FILTER (WHERE s.is_ai_agent = TRUE) as ai_agent_pageviews
  FROM tracking_sessions s
  LEFT JOIN tracking_events e ON e.session_id = s.id
  WHERE DATE(s.started_at) = p_date
  GROUP BY s.site_id, DATE(s.started_at)
  ON CONFLICT (site_id, date)
  DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    total_pageviews = EXCLUDED.total_pageviews,
    total_events = EXCLUDED.total_events,
    unique_visitors = EXCLUDED.unique_visitors,
    avg_session_duration = EXCLUDED.avg_session_duration,
    bounce_rate = EXCLUDED.bounce_rate,
    ai_agent_sessions = EXCLUDED.ai_agent_sessions,
    ai_agent_pageviews = EXCLUDED.ai_agent_pageviews,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create materialized view for top pages (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_pages AS
SELECT
  site_id,
  page_url,
  page_title,
  COUNT(*) as views,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(time_on_page_seconds) as avg_time_on_page
FROM page_views
WHERE viewed_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY site_id, page_url, page_title
ORDER BY views DESC;

-- Index for materialized view
CREATE UNIQUE INDEX idx_mv_top_pages ON mv_top_pages(site_id, page_url);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_pages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Connection pooling settings (to be set in Supabase dashboard)
-- ALTER SYSTEM SET max_connections = 200;
-- ALTER SYSTEM SET shared_buffers = '4GB';
-- ALTER SYSTEM SET effective_cache_size = '12GB';
-- ALTER SYSTEM SET work_mem = '64MB';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON event_queue TO authenticated;
GRANT SELECT ON daily_site_stats TO authenticated;
GRANT SELECT ON mv_top_pages TO authenticated;

-- Add comments
COMMENT ON TABLE event_queue IS 'Queue for async event processing to handle high traffic';
COMMENT ON TABLE daily_site_stats IS 'Pre-aggregated daily statistics for faster dashboard queries';
COMMENT ON MATERIALIZED VIEW mv_top_pages IS 'Top pages view - refreshed periodically';
