-- Agent Journey Tracking för AI-agenter
-- Spårar hela resan från första request till konvertering

-- Tabell för agent-sessioner (grupperar requests som tillhör samma agent)
CREATE TABLE public.ai_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  bot_type TEXT NOT NULL,
  bot_name TEXT,
  browser_type TEXT DEFAULT 'unknown', -- 'headless', 'visual', 'text-based'
  is_visual_browser BOOLEAN DEFAULT false,
  cookies_accepted BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_requests INTEGER DEFAULT 1,
  total_pages_viewed INTEGER DEFAULT 0,
  total_assets_loaded INTEGER DEFAULT 0,
  reached_conversion BOOLEAN DEFAULT false,
  conversion_page TEXT,
  conversion_at TIMESTAMP WITH TIME ZONE,
  exit_page TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabell för varje steg i agentens resa
CREATE TABLE public.ai_agent_journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_agent_sessions(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  url TEXT NOT NULL,
  page_type TEXT, -- 'landing', 'product', 'category', 'checkout', 'conversion', 'other'
  request_type TEXT, -- 'page', 'asset', 'api', 'form'
  asset_type TEXT, -- 'html', 'css', 'js', 'image', 'font', 'other'
  time_on_page_ms INTEGER,
  previous_url TEXT,
  referrer TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabell för konverteringspunkter (definiera vilka sidor som är "mål")
CREATE TABLE public.ai_conversion_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  goal_name TEXT NOT NULL,
  goal_type TEXT NOT NULL, -- 'page_view', 'form_submit', 'purchase', 'custom'
  url_pattern TEXT NOT NULL, -- Regex eller exakt URL
  is_regex BOOLEAN DEFAULT false,
  value DECIMAL(10,2), -- Värde per konvertering
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index för prestanda
CREATE INDEX idx_ai_agent_sessions_site_id ON public.ai_agent_sessions(site_id);
CREATE INDEX idx_ai_agent_sessions_started_at ON public.ai_agent_sessions(started_at);
CREATE INDEX idx_ai_agent_sessions_bot_type ON public.ai_agent_sessions(bot_type);
CREATE INDEX idx_ai_agent_sessions_reached_conversion ON public.ai_agent_sessions(reached_conversion);
CREATE INDEX idx_ai_agent_journey_steps_session_id ON public.ai_agent_journey_steps(session_id);
CREATE INDEX idx_ai_agent_journey_steps_site_id ON public.ai_agent_journey_steps(site_id);
CREATE INDEX idx_ai_agent_journey_steps_page_type ON public.ai_agent_journey_steps(page_type);
CREATE INDEX idx_ai_conversion_goals_site_id ON public.ai_conversion_goals(site_id);

-- RLS Policies
ALTER TABLE public.ai_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversion_goals ENABLE ROW LEVEL SECURITY;

-- Service role har full access
CREATE POLICY "Service role full access to ai_agent_sessions" 
ON public.ai_agent_sessions FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to ai_agent_journey_steps" 
ON public.ai_agent_journey_steps FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to ai_conversion_goals" 
ON public.ai_conversion_goals FOR ALL 
USING (true) WITH CHECK (true);

-- Funktion för att uppdatera agent session
CREATE OR REPLACE FUNCTION public.upsert_ai_agent_session(
  p_site_id UUID,
  p_session_id TEXT,
  p_bot_type TEXT,
  p_bot_name TEXT,
  p_url TEXT,
  p_is_visual_browser BOOLEAN DEFAULT false,
  p_is_asset BOOLEAN DEFAULT false,
  p_asset_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_session_uuid UUID;
  v_step_number INTEGER;
  v_page_type TEXT;
BEGIN
  -- Försök hitta befintlig session
  SELECT id INTO v_session_uuid
  FROM public.ai_agent_sessions
  WHERE site_id = p_site_id AND session_id = p_session_id;
  
  IF v_session_uuid IS NULL THEN
    -- Skapa ny session
    INSERT INTO public.ai_agent_sessions (
      site_id, session_id, bot_type, bot_name, 
      is_visual_browser, browser_type
    ) VALUES (
      p_site_id, p_session_id, p_bot_type, p_bot_name,
      p_is_visual_browser,
      CASE 
        WHEN p_is_visual_browser THEN 'visual'
        ELSE 'headless'
      END
    )
    RETURNING id INTO v_session_uuid;
    
    v_step_number := 1;
  ELSE
    -- Uppdatera befintlig session
    UPDATE public.ai_agent_sessions
    SET 
      last_activity_at = now(),
      total_requests = total_requests + 1,
      total_pages_viewed = CASE WHEN NOT p_is_asset THEN total_pages_viewed + 1 ELSE total_pages_viewed END,
      total_assets_loaded = CASE WHEN p_is_asset THEN total_assets_loaded + 1 ELSE total_assets_loaded END,
      is_visual_browser = CASE WHEN p_is_visual_browser THEN true ELSE is_visual_browser END
    WHERE id = v_session_uuid;
    
    SELECT COALESCE(MAX(step_number), 0) + 1 INTO v_step_number
    FROM public.ai_agent_journey_steps
    WHERE session_id = v_session_uuid;
  END IF;
  
  -- Bestäm page type baserat på URL
  v_page_type := CASE
    WHEN p_url ~* '(checkout|cart|payment|order)' THEN 'checkout'
    WHEN p_url ~* '(thank|success|confirmation|complete)' THEN 'conversion'
    WHEN p_url ~* '(product|item|sku)' THEN 'product'
    WHEN p_url ~* '(category|collection|shop)' THEN 'category'
    WHEN v_step_number = 1 THEN 'landing'
    ELSE 'other'
  END;
  
  -- Lägg till journey step
  INSERT INTO public.ai_agent_journey_steps (
    session_id, site_id, step_number, url, page_type,
    request_type, asset_type
  ) VALUES (
    v_session_uuid, p_site_id, v_step_number, p_url, v_page_type,
    CASE WHEN p_is_asset THEN 'asset' ELSE 'page' END,
    p_asset_type
  );
  
  -- Kolla om det är en konvertering
  IF v_page_type = 'conversion' THEN
    UPDATE public.ai_agent_sessions
    SET reached_conversion = true,
        conversion_page = p_url,
        conversion_at = now()
    WHERE id = v_session_uuid;
  END IF;
  
  RETURN v_session_uuid;
END;
$$;

-- Funktion för att hämta agent funnel data
CREATE OR REPLACE FUNCTION public.get_ai_agent_funnel(
  p_site_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  page_type TEXT,
  sessions_count BIGINT,
  drop_off_rate NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH page_type_stats AS (
    SELECT 
      js.page_type,
      COUNT(DISTINCT js.session_id) as sessions_count,
      ROW_NUMBER() OVER (ORDER BY 
        CASE js.page_type
          WHEN 'landing' THEN 1
          WHEN 'category' THEN 2
          WHEN 'product' THEN 3
          WHEN 'checkout' THEN 4
          WHEN 'conversion' THEN 5
          ELSE 6
        END
      ) as step_order
    FROM public.ai_agent_journey_steps js
    JOIN public.ai_agent_sessions s ON js.session_id = s.id
    WHERE s.site_id = p_site_id
      AND s.started_at >= p_start_date
      AND s.started_at <= p_end_date
    GROUP BY js.page_type
  )
  SELECT 
    page_type,
    sessions_count,
    ROUND(
      CASE 
        WHEN LAG(sessions_count) OVER (ORDER BY step_order) IS NULL THEN 0
        ELSE (1 - sessions_count::NUMERIC / LAG(sessions_count) OVER (ORDER BY step_order)) * 100
      END,
      1
    ) as drop_off_rate
  FROM page_type_stats
  ORDER BY step_order;
$$;