-- =====================================================
-- UNIFIED VISITOR PROFILE SYSTEM
-- =====================================================
-- Foundation fÃ¶r AI-first analytics med persistent visitor tracking
-- LÃ¤nkar ihop alla sessions (human + AI agent) till en unified profile
--
-- Created: 2026-02-10
-- Purpose: Enable visitor-level analytics, segmentation, and AI insights
-- =====================================================

-- =====================================================
-- 1. UNIFIED VISITORS TABLE
-- =====================================================
-- Central tabell fÃ¶r persistent visitor tracking
-- Skapar en "golden record" per unique visitor

CREATE TABLE IF NOT EXISTS public.unified_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,

  -- Identification
  visitor_fingerprint TEXT NOT NULL, -- Device fingerprint (cookieless)
  first_session_id TEXT, -- FÃ¶rsta session ID fÃ¶r tracking

  -- Classification
  visitor_type TEXT NOT NULL DEFAULT 'unknown', -- 'human', 'ai_agent', 'bot', 'unknown'
  ai_agent_type TEXT, -- 'chatgpt_browser', 'perplexity_comet', 'claude_browser', etc
  is_verified_human BOOLEAN DEFAULT false, -- Verified via interaction patterns
  confidence_score FLOAT DEFAULT 0.5, -- Confidence i classification (0-1)

  -- Temporal tracking
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Session aggregates
  total_sessions INTEGER DEFAULT 1,
  total_human_sessions INTEGER DEFAULT 0,
  total_ai_agent_sessions INTEGER DEFAULT 0,

  -- Behavioral metrics
  total_pageviews INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_time_on_site_seconds INTEGER DEFAULT 0,
  avg_session_duration_seconds FLOAT DEFAULT 0,
  avg_pages_per_session FLOAT DEFAULT 0,

  -- Engagement scoring
  engagement_score FLOAT DEFAULT 0, -- 0-100 score baserat pÃ¥ beteende
  recency_score FLOAT DEFAULT 0, -- 0-100 baserat pÃ¥ hur nyligen de besÃ¶kte
  frequency_score FLOAT DEFAULT 0, -- 0-100 baserat pÃ¥ besÃ¶ksfrekvens

  -- Business metrics
  total_conversions INTEGER DEFAULT 0,
  first_conversion_at TIMESTAMP WITH TIME ZONE,
  last_conversion_at TIMESTAMP WITH TIME ZONE,
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  conversion_probability FLOAT, -- Predicted (ML model) 0-1

  -- Segmentation
  segments TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['high_intent', 'technical', 'price_sensitive', etc]
  primary_segment TEXT, -- Huvudsegment fÃ¶r snabb filtrering
  rfm_segment TEXT, -- RFM segmentering: 'champion', 'loyal', 'at_risk', etc

  -- Device & browser (fÃ¶r humans)
  primary_device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  primary_browser TEXT,
  primary_os TEXT,

  -- Geographic (anonymized)
  country_code TEXT, -- ISO 3166-1 alpha-2
  region TEXT,

  -- Traffic attribution
  first_referrer TEXT,
  first_utm_source TEXT,
  first_utm_medium TEXT,
  first_utm_campaign TEXT,
  last_referrer TEXT,
  last_utm_source TEXT,
  last_utm_medium TEXT,

  -- AI Agent specific (om visitor_type = 'ai_agent')
  ai_agent_metadata JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "browser_type": "visual",
  --   "cookies_accepted": false,
  --   "structured_data_consumed": ["schema.org/Product", "schema.org/FAQPage"],
  --   "intent": "research",
  --   "lead_quality_score": 78
  -- }

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE(site_id, visitor_fingerprint)
);

-- =====================================================
-- 2. VISITOR SESSIONS LINK TABLE
-- =====================================================
-- LÃ¤nkar unified visitors till deras sessions
-- Supports bÃ¥de human sessions och AI agent sessions

CREATE TABLE IF NOT EXISTS public.visitor_session_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES public.unified_visitors(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,

  -- Session reference (either human or AI agent)
  session_type TEXT NOT NULL, -- 'human' or 'ai_agent'
  human_session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE CASCADE,
  ai_agent_session_id UUID REFERENCES public.ai_agent_sessions(id) ON DELETE CASCADE,

  -- Session metadata
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  events INTEGER DEFAULT 0,
  had_conversion BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Constraints
  CHECK (
    (session_type = 'human' AND human_session_id IS NOT NULL AND ai_agent_session_id IS NULL) OR
    (session_type = 'ai_agent' AND ai_agent_session_id IS NOT NULL AND human_session_id IS NULL)
  )
);

-- =====================================================
-- 3. VISITOR EVENTS TABLE
-- =====================================================
-- Aggregerad event history per visitor
-- AnvÃ¤nds fÃ¶r snabb behavioral analysis

CREATE TABLE IF NOT EXISTS public.visitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES public.unified_visitors(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL, -- 'pageview', 'click', 'conversion', 'form_submit', etc
  event_category TEXT, -- 'engagement', 'conversion', 'navigation', etc
  page_url TEXT,
  element_selector TEXT, -- FÃ¶r clicks

  -- Context
  session_type TEXT NOT NULL, -- 'human' or 'ai_agent'
  session_id UUID, -- Reference till session

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 4. VISITOR SEGMENTS DEFINITIONS
-- =====================================================
-- Definiera olika segment fÃ¶r automatisk klassificering

CREATE TABLE IF NOT EXISTS public.visitor_segment_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE, -- NULL = global segment

  -- Segment details
  segment_name TEXT NOT NULL,
  segment_key TEXT NOT NULL, -- Machine-readable key: 'high_intent', 'technical_audience'
  description TEXT,

  -- Segment rules (JSON logic)
  rules JSONB NOT NULL,
  -- Example: {
  --   "conditions": [
  --     {"field": "total_pageviews", "operator": ">", "value": 10},
  --     {"field": "engagement_score", "operator": ">", "value": 70},
  --     {"field": "visitor_type", "operator": "=", "value": "human"}
  --   ],
  --   "match": "all" // or "any"
  -- }

  -- Priority (higher = applied first)
  priority INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  UNIQUE(site_id, segment_key)
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Unified visitors indexes
CREATE INDEX IF NOT EXISTS idx_unified_visitors_site_id ON public.unified_visitors(site_id);
CREATE INDEX IF NOT EXISTS idx_unified_visitors_fingerprint ON public.unified_visitors(visitor_fingerprint);
CREATE INDEX IF NOT EXISTS idx_unified_visitors_site_fingerprint ON public.unified_visitors(site_id, visitor_fingerprint);
CREATE INDEX IF NOT EXISTS idx_unified_visitors_type ON public.unified_visitors(visitor_type);
CREATE INDEX IF NOT EXISTS idx_unified_visitors_last_seen ON public.unified_visitors(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_visitors_engagement ON public.unified_visitors(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_unified_visitors_segments ON public.unified_visitors USING GIN(segments);
CREATE INDEX IF NOT EXISTS idx_unified_visitors_primary_segment ON public.unified_visitors(primary_segment);

-- Visitor session links indexes
CREATE INDEX IF NOT EXISTS idx_visitor_session_links_visitor ON public.visitor_session_links(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_session_links_human_session ON public.visitor_session_links(human_session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_session_links_ai_session ON public.visitor_session_links(ai_agent_session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_session_links_type ON public.visitor_session_links(session_type);

-- Visitor events indexes
CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor ON public.visitor_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_occurred_at ON public.visitor_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_events_type ON public.visitor_events(event_type);
CREATE INDEX IF NOT EXISTS idx_visitor_events_site_type ON public.visitor_events(site_id, event_type);

-- Segment definitions indexes
CREATE INDEX IF NOT EXISTS idx_segment_definitions_site ON public.visitor_segment_definitions(site_id);
CREATE INDEX IF NOT EXISTS idx_segment_definitions_active ON public.visitor_segment_definitions(is_active);

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.unified_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_session_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_segment_definitions ENABLE ROW LEVEL SECURITY;

-- Site owners can view their visitors
DROP POLICY IF EXISTS "Site owners can view unified visitors" ON public.unified_visitors;
CREATE POLICY "Site owners can view unified visitors"
ON public.unified_visitors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = unified_visitors.site_id
    AND sites.user_id = auth.uid()
  )
);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access to unified visitors" ON public.unified_visitors;
CREATE POLICY "Service role full access to unified visitors"
ON public.unified_visitors FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Visitor session links policies
DROP POLICY IF EXISTS "Service role full access to visitor session links" ON public.visitor_session_links;
CREATE POLICY "Service role full access to visitor session links"
ON public.visitor_session_links FOR ALL
USING (true)
WITH CHECK (true);

-- Visitor events policies
DROP POLICY IF EXISTS "Service role full access to visitor events" ON public.visitor_events;
CREATE POLICY "Service role full access to visitor events"
ON public.visitor_events FOR ALL
USING (true)
WITH CHECK (true);

-- Segment definitions policies
DROP POLICY IF EXISTS "Site owners can manage segment definitions" ON public.visitor_segment_definitions;
CREATE POLICY "Site owners can manage segment definitions"
ON public.visitor_segment_definitions FOR ALL
USING (
  site_id IS NULL OR EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = visitor_segment_definitions.site_id
    AND sites.user_id = auth.uid()
  )
);

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_unified_visitors_updated_at ON public.unified_visitors;
CREATE TRIGGER update_unified_visitors_updated_at
  BEFORE UPDATE ON public.unified_visitors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_segment_definitions_updated_at ON public.visitor_segment_definitions;
CREATE TRIGGER update_segment_definitions_updated_at
  BEFORE UPDATE ON public.visitor_segment_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. DEFAULT SEGMENT DEFINITIONS
-- =====================================================

-- Insert default global segments
INSERT INTO public.visitor_segment_definitions (segment_name, segment_key, description, rules, priority) VALUES
  -- Human segments
  ('High Intent Visitors', 'high_intent', 'Human visitors showing strong purchase intent',
   '{"conditions": [{"field": "visitor_type", "operator": "=", "value": "human"}, {"field": "engagement_score", "operator": ">", "value": 70}, {"field": "total_pageviews", "operator": ">", "value": 5}], "match": "all"}'::jsonb,
   90),

  ('Repeat Visitors', 'repeat_visitor', 'Visitors who have returned multiple times',
   '{"conditions": [{"field": "total_sessions", "operator": ">", "value": 3}], "match": "all"}'::jsonb,
   80),

  ('First Time Visitors', 'first_time', 'Brand new visitors on their first session',
   '{"conditions": [{"field": "total_sessions", "operator": "=", "value": 1}], "match": "all"}'::jsonb,
   70),

  ('Converted Visitors', 'converted', 'Visitors who have completed a conversion',
   '{"conditions": [{"field": "total_conversions", "operator": ">", "value": 0}], "match": "all"}'::jsonb,
   100),

  -- AI Agent segments
  ('AI Research Agents', 'ai_research', 'AI agents conducting research (high-intent)',
   '{"conditions": [{"field": "visitor_type", "operator": "=", "value": "ai_agent"}, {"field": "total_pageviews", "operator": ">", "value": 3}], "match": "all"}'::jsonb,
   85),

  ('ChatGPT Browser', 'chatgpt_browser', 'ChatGPT Browser visits',
   '{"conditions": [{"field": "ai_agent_type", "operator": "=", "value": "chatgpt_browser"}], "match": "all"}'::jsonb,
   75),

  ('Perplexity Agent', 'perplexity', 'Perplexity Comet visits',
   '{"conditions": [{"field": "ai_agent_type", "operator": "=", "value": "perplexity_comet"}], "match": "all"}'::jsonb,
   75),

  -- Behavioral segments
  ('Price Sensitive', 'price_sensitive', 'Visitors spending time on pricing pages',
   '{"conditions": [{"field": "visitor_type", "operator": "=", "value": "human"}, {"field": "engagement_score", "operator": ">", "value": 50}], "match": "all"}'::jsonb,
   60),

  ('At Risk', 'at_risk', 'Previously active visitors who haven''t returned recently',
   '{"conditions": [{"field": "recency_score", "operator": "<", "value": 30}, {"field": "total_sessions", "operator": ">", "value": 5}], "match": "all"}'::jsonb,
   65);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Create database functions for visitor profiling
-- 2. Create Edge Function for visitor identification
-- 3. Update tracking script to include visitor_fingerprint
-- =====================================================
