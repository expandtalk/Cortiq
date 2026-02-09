-- Agent Registry table for custom bot patterns and agent endpoints
CREATE TABLE public.agent_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL DEFAULT 'custom_bot', -- 'custom_bot', 'outbound_agent', 'third_party'
  description TEXT,
  
  -- For custom bot detection
  user_agent_pattern TEXT, -- Regex pattern for user-agent matching
  ip_range TEXT, -- Optional IP range for detection
  
  -- For outbound agents (your own agents)
  endpoint_url TEXT,
  api_key_hint TEXT, -- Last 4 chars of API key for reference
  
  -- Tracking stats (updated periodically)
  total_requests INTEGER DEFAULT 0,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own agent registry"
  ON public.agent_registry FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sites WHERE sites.id = agent_registry.site_id AND sites.user_id = auth.uid()
  ));

CREATE POLICY "Users can create agents for their sites"
  ON public.agent_registry FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sites WHERE sites.id = agent_registry.site_id AND sites.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own agents"
  ON public.agent_registry FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM sites WHERE sites.id = agent_registry.site_id AND sites.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own agents"
  ON public.agent_registry FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM sites WHERE sites.id = agent_registry.site_id AND sites.user_id = auth.uid()
  ));

-- Agent activity log for tracking registered agents
CREATE TABLE public.agent_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agent_registry(id) ON DELETE SET NULL,
  
  activity_type TEXT NOT NULL, -- 'inbound_visit', 'outbound_call', 'api_request'
  url TEXT,
  request_method TEXT,
  response_status INTEGER,
  response_time_ms INTEGER,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their agent activity"
  ON public.agent_activity_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sites WHERE sites.id = agent_activity_log.site_id AND sites.user_id = auth.uid()
  ));

CREATE POLICY "System can insert agent activity"
  ON public.agent_activity_log FOR INSERT
  WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_agent_registry_site_id ON public.agent_registry(site_id);
CREATE INDEX idx_agent_activity_log_site_id ON public.agent_activity_log(site_id);
CREATE INDEX idx_agent_activity_log_agent_id ON public.agent_activity_log(agent_id);
CREATE INDEX idx_agent_activity_log_created_at ON public.agent_activity_log(created_at DESC);