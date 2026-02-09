-- Create AI bot traffic tracking table
CREATE TABLE IF NOT EXISTS public.ai_bot_traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  
  -- Bot identification
  bot_type TEXT NOT NULL, -- 'chatgpt', 'perplexity', 'claude', 'gemini', 'grok', 'other'
  bot_name TEXT,
  user_agent TEXT,
  
  -- Traffic details
  url TEXT NOT NULL,
  referrer TEXT,
  
  -- Detection signals
  js_executed BOOLEAN DEFAULT false,
  probe_triggered BOOLEAN DEFAULT false,
  
  -- Session info
  session_id TEXT,
  ip_address TEXT,
  
  -- Metadata
  request_type TEXT, -- 'citation', 'training', 'scraping', 'unknown'
  device_type TEXT DEFAULT 'bot',
  
  -- Timestamps
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI bot probe signals table (tracks JS execution)
CREATE TABLE IF NOT EXISTS public.ai_bot_probe_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  traffic_id UUID REFERENCES public.ai_bot_traffic(id) ON DELETE CASCADE,
  
  -- Probe data
  probe_version TEXT DEFAULT 'v1',
  execution_time_ms INTEGER,
  
  -- Detection signals
  webdriver_detected BOOLEAN DEFAULT false,
  headless_detected BOOLEAN DEFAULT false,
  automation_signals JSONB DEFAULT '{}'::jsonb,
  
  -- Browser fingerprint
  browser_signals JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI citations table
CREATE TABLE IF NOT EXISTS public.ai_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  traffic_id UUID REFERENCES public.ai_bot_traffic(id) ON DELETE CASCADE,
  
  -- Citation details
  cited_url TEXT NOT NULL,
  citation_context TEXT,
  
  -- UTM tracking for citation clicks
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Click tracking
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_bot_traffic_site_id ON public.ai_bot_traffic(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_bot_traffic_bot_type ON public.ai_bot_traffic(bot_type);
CREATE INDEX IF NOT EXISTS idx_ai_bot_traffic_detected_at ON public.ai_bot_traffic(detected_at);
CREATE INDEX IF NOT EXISTS idx_ai_bot_probe_signals_site_id ON public.ai_bot_probe_signals(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_citations_site_id ON public.ai_citations(site_id);

-- Enable Row Level Security
ALTER TABLE public.ai_bot_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_bot_probe_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_citations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_bot_traffic
CREATE POLICY "Anyone can insert AI bot traffic"
  ON public.ai_bot_traffic
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Site owners can view AI bot traffic"
  ON public.ai_bot_traffic
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = ai_bot_traffic.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- RLS Policies for ai_bot_probe_signals
CREATE POLICY "Anyone can insert probe signals"
  ON public.ai_bot_probe_signals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Site owners can view probe signals"
  ON public.ai_bot_probe_signals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = ai_bot_probe_signals.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- RLS Policies for ai_citations
CREATE POLICY "Anyone can insert citations"
  ON public.ai_citations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Site owners can view citations"
  ON public.ai_citations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = ai_citations.site_id
      AND sites.user_id = auth.uid()
    )
  );