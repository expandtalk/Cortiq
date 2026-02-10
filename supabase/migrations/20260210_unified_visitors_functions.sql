-- =====================================================
-- UNIFIED VISITOR PROFILE - DATABASE FUNCTIONS
-- =====================================================
-- Functions för visitor identification, scoring och segmentation
--
-- Created: 2026-02-10
-- =====================================================

-- =====================================================
-- 1. VISITOR IDENTIFICATION & UPSERT
-- =====================================================

CREATE OR REPLACE FUNCTION public.upsert_unified_visitor(
  p_site_id UUID,
  p_visitor_fingerprint TEXT,
  p_session_id TEXT,
  p_visitor_type TEXT DEFAULT 'unknown',
  p_ai_agent_type TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visitor_id UUID;
  v_is_new_visitor BOOLEAN;
BEGIN
  -- Try to find existing visitor
  SELECT id INTO v_visitor_id
  FROM public.unified_visitors
  WHERE site_id = p_site_id
    AND visitor_fingerprint = p_visitor_fingerprint;

  v_is_new_visitor := (v_visitor_id IS NULL);

  IF v_is_new_visitor THEN
    -- Create new visitor
    INSERT INTO public.unified_visitors (
      site_id,
      visitor_fingerprint,
      first_session_id,
      visitor_type,
      ai_agent_type,
      primary_device_type,
      primary_browser,
      primary_os,
      first_referrer,
      first_utm_source,
      first_utm_medium,
      first_utm_campaign,
      last_referrer,
      last_utm_source,
      last_utm_medium,
      country_code,
      total_sessions,
      total_human_sessions,
      total_ai_agent_sessions
    ) VALUES (
      p_site_id,
      p_visitor_fingerprint,
      p_session_id,
      p_visitor_type,
      p_ai_agent_type,
      p_device_type,
      p_browser,
      p_os,
      p_referrer,
      p_utm_source,
      p_utm_medium,
      p_utm_campaign,
      p_referrer,
      p_utm_source,
      p_utm_medium,
      p_country_code,
      1,
      CASE WHEN p_visitor_type = 'human' THEN 1 ELSE 0 END,
      CASE WHEN p_visitor_type = 'ai_agent' THEN 1 ELSE 0 END
    )
    RETURNING id INTO v_visitor_id;
  ELSE
    -- Update existing visitor
    UPDATE public.unified_visitors
    SET
      last_seen_at = now(),
      total_sessions = total_sessions + 1,
      total_human_sessions = CASE WHEN p_visitor_type = 'human' THEN total_human_sessions + 1 ELSE total_human_sessions END,
      total_ai_agent_sessions = CASE WHEN p_visitor_type = 'ai_agent' THEN total_ai_agent_sessions + 1 ELSE total_ai_agent_sessions END,

      -- Update visitor type if more certain now
      visitor_type = CASE
        WHEN p_visitor_type != 'unknown' THEN p_visitor_type
        ELSE visitor_type
      END,
      ai_agent_type = COALESCE(p_ai_agent_type, ai_agent_type),

      -- Update last referrer/UTM
      last_referrer = COALESCE(p_referrer, last_referrer),
      last_utm_source = COALESCE(p_utm_source, last_utm_source),
      last_utm_medium = COALESCE(p_utm_medium, last_utm_medium),

      -- Update device info if provided (take most recent)
      primary_device_type = COALESCE(p_device_type, primary_device_type),
      primary_browser = COALESCE(p_browser, primary_browser),
      primary_os = COALESCE(p_os, primary_os),

      updated_at = now()
    WHERE id = v_visitor_id;
  END IF;

  RETURN v_visitor_id;
END;
$$;

-- =====================================================
-- 2. ENGAGEMENT SCORE CALCULATION
-- =====================================================
-- Beräknar engagement score 0-100 baserat på beteende

CREATE OR REPLACE FUNCTION public.calculate_engagement_score(
  p_visitor_id UUID
)
RETURNS FLOAT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score FLOAT := 0;
  v_visitor RECORD;
  v_weight_pageviews FLOAT := 0.25;
  v_weight_time FLOAT := 0.30;
  v_weight_sessions FLOAT := 0.20;
  v_weight_conversions FLOAT := 0.25;
BEGIN
  -- Get visitor data
  SELECT * INTO v_visitor
  FROM public.unified_visitors
  WHERE id = p_visitor_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Pageviews score (normalized to 0-100)
  -- 50+ pageviews = max score
  v_score := v_score + (LEAST(v_visitor.total_pageviews, 50)::FLOAT / 50 * 100 * v_weight_pageviews);

  -- Time on site score (normalized to 0-100)
  -- 30+ minutes = max score
  v_score := v_score + (LEAST(v_visitor.total_time_on_site_seconds, 1800)::FLOAT / 1800 * 100 * v_weight_time);

  -- Sessions score (normalized to 0-100)
  -- 10+ sessions = max score
  v_score := v_score + (LEAST(v_visitor.total_sessions, 10)::FLOAT / 10 * 100 * v_weight_sessions);

  -- Conversions score (normalized to 0-100)
  -- 5+ conversions = max score
  v_score := v_score + (LEAST(v_visitor.total_conversions, 5)::FLOAT / 5 * 100 * v_weight_conversions);

  RETURN ROUND(v_score::NUMERIC, 2);
END;
$$;

-- =====================================================
-- 3. RFM SCORING
-- =====================================================
-- Recency, Frequency, Monetary scoring

CREATE OR REPLACE FUNCTION public.calculate_rfm_scores(
  p_visitor_id UUID
)
RETURNS TABLE (
  recency_score FLOAT,
  frequency_score FLOAT,
  monetary_score FLOAT,
  rfm_segment TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visitor RECORD;
  v_recency_days INTEGER;
  v_r_score FLOAT;
  v_f_score FLOAT;
  v_m_score FLOAT;
  v_rfm_segment TEXT;
BEGIN
  -- Get visitor data
  SELECT * INTO v_visitor
  FROM public.unified_visitors
  WHERE id = p_visitor_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::FLOAT, 0::FLOAT, 0::FLOAT, 'unknown'::TEXT;
    RETURN;
  END IF;

  -- Calculate recency (days since last visit)
  v_recency_days := EXTRACT(DAY FROM (now() - v_visitor.last_seen_at));

  -- Recency Score (0-100, higher = more recent)
  -- 0 days = 100, 30+ days = 0
  v_r_score := GREATEST(0, 100 - (v_recency_days::FLOAT / 30 * 100));

  -- Frequency Score (0-100)
  -- 20+ sessions = 100
  v_f_score := LEAST(100, v_visitor.total_sessions::FLOAT / 20 * 100);

  -- Monetary Score (0-100)
  -- Based on lifetime value
  -- $1000+ = 100
  v_m_score := LEAST(100, v_visitor.lifetime_value::FLOAT / 1000 * 100);

  -- Determine RFM Segment
  IF v_r_score >= 80 AND v_f_score >= 80 AND v_m_score >= 80 THEN
    v_rfm_segment := 'champion';
  ELSIF v_r_score >= 60 AND v_f_score >= 60 THEN
    v_rfm_segment := 'loyal';
  ELSIF v_r_score >= 80 AND v_f_score < 40 THEN
    v_rfm_segment := 'new';
  ELSIF v_r_score < 40 AND v_f_score >= 60 THEN
    v_rfm_segment := 'at_risk';
  ELSIF v_r_score < 40 AND v_f_score < 40 THEN
    v_rfm_segment := 'lost';
  ELSIF v_r_score >= 60 AND v_m_score >= 60 THEN
    v_rfm_segment := 'potential_loyalist';
  ELSE
    v_rfm_segment := 'promising';
  END IF;

  RETURN QUERY SELECT v_r_score, v_f_score, v_m_score, v_rfm_segment;
END;
$$;

-- =====================================================
-- 4. SEGMENT CLASSIFICATION
-- =====================================================
-- Klassificerar visitor i segments baserat på rules

CREATE OR REPLACE FUNCTION public.classify_visitor_segments(
  p_visitor_id UUID
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visitor RECORD;
  v_segments TEXT[] := ARRAY[]::TEXT[];
  v_segment_def RECORD;
  v_rule RECORD;
  v_condition JSONB;
  v_matches BOOLEAN;
  v_match_all BOOLEAN;
BEGIN
  -- Get visitor data
  SELECT * INTO v_visitor
  FROM public.unified_visitors
  WHERE id = p_visitor_id;

  IF NOT FOUND THEN
    RETURN v_segments;
  END IF;

  -- Loop through all active segment definitions
  FOR v_segment_def IN
    SELECT *
    FROM public.visitor_segment_definitions
    WHERE is_active = true
      AND (site_id IS NULL OR site_id = v_visitor.site_id)
    ORDER BY priority DESC
  LOOP
    -- Check if visitor matches segment rules
    v_matches := true;
    v_match_all := (v_segment_def.rules->>'match' = 'all');

    -- Iterate through conditions
    FOR v_condition IN SELECT * FROM jsonb_array_elements(v_segment_def.rules->'conditions')
    LOOP
      DECLARE
        v_field TEXT := v_condition->>'field';
        v_operator TEXT := v_condition->>'operator';
        v_value TEXT := v_condition->>'value';
        v_field_value TEXT;
        v_condition_matches BOOLEAN := false;
      BEGIN
        -- Get field value from visitor
        EXECUTE format('SELECT ($1).%I::TEXT', v_field)
        INTO v_field_value
        USING v_visitor;

        -- Evaluate condition based on operator
        CASE v_operator
          WHEN '=' THEN
            v_condition_matches := (v_field_value = v_value);
          WHEN '!=' THEN
            v_condition_matches := (v_field_value != v_value);
          WHEN '>' THEN
            v_condition_matches := (v_field_value::FLOAT > v_value::FLOAT);
          WHEN '<' THEN
            v_condition_matches := (v_field_value::FLOAT < v_value::FLOAT);
          WHEN '>=' THEN
            v_condition_matches := (v_field_value::FLOAT >= v_value::FLOAT);
          WHEN '<=' THEN
            v_condition_matches := (v_field_value::FLOAT <= v_value::FLOAT);
          WHEN 'contains' THEN
            v_condition_matches := (v_field_value ILIKE '%' || v_value || '%');
          ELSE
            v_condition_matches := false;
        END CASE;

        -- Update matches based on match mode
        IF v_match_all THEN
          v_matches := v_matches AND v_condition_matches;
        ELSE
          v_matches := v_matches OR v_condition_matches;
        END IF;
      END;
    END LOOP;

    -- Add segment if matches
    IF v_matches THEN
      v_segments := array_append(v_segments, v_segment_def.segment_key);
    END IF;
  END LOOP;

  RETURN v_segments;
END;
$$;

-- =====================================================
-- 5. UPDATE VISITOR METRICS
-- =====================================================
-- Aggregate metrics from sessions and events

CREATE OR REPLACE FUNCTION public.update_visitor_metrics(
  p_visitor_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metrics RECORD;
  v_engagement_score FLOAT;
  v_rfm RECORD;
  v_segments TEXT[];
  v_primary_segment TEXT;
BEGIN
  -- Aggregate metrics from visitor_session_links
  SELECT
    COUNT(*) as total_sessions,
    COALESCE(SUM(pageviews), 0) as total_pageviews,
    COALESCE(SUM(events), 0) as total_events,
    COALESCE(SUM(duration_seconds), 0) as total_time_seconds,
    COALESCE(AVG(duration_seconds), 0) as avg_duration,
    COALESCE(AVG(pageviews), 0) as avg_pages_per_session,
    COUNT(*) FILTER (WHERE had_conversion = true) as total_conversions
  INTO v_metrics
  FROM public.visitor_session_links
  WHERE visitor_id = p_visitor_id;

  -- Update visitor metrics
  UPDATE public.unified_visitors
  SET
    total_pageviews = v_metrics.total_pageviews,
    total_events = v_metrics.total_events,
    total_time_on_site_seconds = v_metrics.total_time_seconds,
    avg_session_duration_seconds = v_metrics.avg_duration,
    avg_pages_per_session = v_metrics.avg_pages_per_session,
    total_conversions = v_metrics.total_conversions,
    updated_at = now()
  WHERE id = p_visitor_id;

  -- Calculate engagement score
  v_engagement_score := public.calculate_engagement_score(p_visitor_id);

  -- Calculate RFM scores
  SELECT * INTO v_rfm FROM public.calculate_rfm_scores(p_visitor_id);

  -- Classify segments
  v_segments := public.classify_visitor_segments(p_visitor_id);

  -- Determine primary segment (first in priority order)
  v_primary_segment := CASE
    WHEN array_length(v_segments, 1) > 0 THEN v_segments[1]
    ELSE NULL
  END;

  -- Update scores and segments
  UPDATE public.unified_visitors
  SET
    engagement_score = v_engagement_score,
    recency_score = v_rfm.recency_score,
    frequency_score = v_rfm.frequency_score,
    rfm_segment = v_rfm.rfm_segment,
    segments = v_segments,
    primary_segment = v_primary_segment,
    updated_at = now()
  WHERE id = p_visitor_id;
END;
$$;

-- =====================================================
-- 6. LINK SESSION TO VISITOR
-- =====================================================
-- Links a session (human or AI agent) to a unified visitor

CREATE OR REPLACE FUNCTION public.link_session_to_visitor(
  p_visitor_id UUID,
  p_site_id UUID,
  p_session_type TEXT,
  p_session_id UUID,
  p_pageviews INTEGER DEFAULT 0,
  p_events INTEGER DEFAULT 0,
  p_duration_seconds INTEGER DEFAULT 0,
  p_had_conversion BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id UUID;
  v_started_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get session start time
  IF p_session_type = 'human' THEN
    SELECT started_at INTO v_started_at
    FROM public.tracking_sessions
    WHERE id = p_session_id;
  ELSE
    SELECT started_at INTO v_started_at
    FROM public.ai_agent_sessions
    WHERE id = p_session_id;
  END IF;

  -- Insert or update link
  INSERT INTO public.visitor_session_links (
    visitor_id,
    site_id,
    session_type,
    human_session_id,
    ai_agent_session_id,
    started_at,
    duration_seconds,
    pageviews,
    events,
    had_conversion
  ) VALUES (
    p_visitor_id,
    p_site_id,
    p_session_type,
    CASE WHEN p_session_type = 'human' THEN p_session_id ELSE NULL END,
    CASE WHEN p_session_type = 'ai_agent' THEN p_session_id ELSE NULL END,
    COALESCE(v_started_at, now()),
    p_duration_seconds,
    p_pageviews,
    p_events,
    p_had_conversion
  )
  ON CONFLICT (visitor_id, COALESCE(human_session_id, '00000000-0000-0000-0000-000000000000'::UUID), COALESCE(ai_agent_session_id, '00000000-0000-0000-0000-000000000000'::UUID))
  DO UPDATE SET
    duration_seconds = EXCLUDED.duration_seconds,
    pageviews = EXCLUDED.pageviews,
    events = EXCLUDED.events,
    had_conversion = EXCLUDED.had_conversion
  RETURNING id INTO v_link_id;

  -- Update visitor metrics
  PERFORM public.update_visitor_metrics(p_visitor_id);

  RETURN v_link_id;
END;
$$;

-- =====================================================
-- 7. GET VISITOR PROFILE
-- =====================================================
-- Retrieves complete visitor profile with all metadata

CREATE OR REPLACE FUNCTION public.get_visitor_profile(
  p_visitor_id UUID
)
RETURNS TABLE (
  visitor_id UUID,
  site_id UUID,
  visitor_fingerprint TEXT,
  visitor_type TEXT,
  ai_agent_type TEXT,

  -- Metrics
  total_sessions INTEGER,
  total_pageviews INTEGER,
  total_conversions INTEGER,
  engagement_score FLOAT,
  recency_score FLOAT,
  frequency_score FLOAT,

  -- Segmentation
  segments TEXT[],
  primary_segment TEXT,
  rfm_segment TEXT,

  -- Temporal
  first_seen_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,

  -- Attribution
  first_referrer TEXT,
  first_utm_source TEXT,
  last_referrer TEXT,

  -- Device
  primary_device_type TEXT,
  primary_browser TEXT,
  country_code TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id as visitor_id,
    site_id,
    visitor_fingerprint,
    visitor_type,
    ai_agent_type,

    total_sessions,
    total_pageviews,
    total_conversions,
    engagement_score,
    recency_score,
    frequency_score,

    segments,
    primary_segment,
    rfm_segment,

    first_seen_at,
    last_seen_at,

    first_referrer,
    first_utm_source,
    last_referrer,

    primary_device_type,
    primary_browser,
    country_code
  FROM public.unified_visitors
  WHERE id = p_visitor_id;
$$;

-- =====================================================
-- 8. GET SEGMENT VISITORS
-- =====================================================
-- Get all visitors in a specific segment

CREATE OR REPLACE FUNCTION public.get_segment_visitors(
  p_site_id UUID,
  p_segment_key TEXT,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  visitor_id UUID,
  visitor_type TEXT,
  engagement_score FLOAT,
  total_sessions INTEGER,
  total_conversions INTEGER,
  last_seen_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id as visitor_id,
    visitor_type,
    engagement_score,
    total_sessions,
    total_conversions,
    last_seen_at
  FROM public.unified_visitors
  WHERE site_id = p_site_id
    AND (
      primary_segment = p_segment_key
      OR p_segment_key = ANY(segments)
    )
  ORDER BY engagement_score DESC, last_seen_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Create unique index instead of constraint (supports expressions)
CREATE UNIQUE INDEX unique_visitor_session_link
ON public.visitor_session_links (
  visitor_id,
  COALESCE(human_session_id, '00000000-0000-0000-0000-000000000000'::UUID),
  COALESCE(ai_agent_session_id, '00000000-0000-0000-0000-000000000000'::UUID)
);

-- =====================================================
-- FUNCTIONS COMPLETE
-- =====================================================
