-- Enhanced E-commerce tracking (GDPR-compliant)
CREATE TABLE IF NOT EXISTS public.ecommerce_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- view_item, add_to_cart, begin_checkout, purchase
  product_id TEXT,
  product_name TEXT,
  product_category TEXT,
  product_brand TEXT,
  product_variant TEXT,
  quantity INTEGER DEFAULT 1,
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'SEK',
  transaction_id TEXT,
  revenue NUMERIC(10,2),
  tax NUMERIC(10,2),
  shipping NUMERIC(10,2),
  consent_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cross-device user identity (hashed for GDPR)
CREATE TABLE IF NOT EXISTS public.user_identities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_hash TEXT NOT NULL, -- hashed email/ID for privacy
  session_ids TEXT[] DEFAULT '{}',
  device_ids TEXT[] DEFAULT '{}',
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_sessions INTEGER DEFAULT 1,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  consent_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(site_id, user_hash)
);

-- Funnel definitions
CREATE TABLE IF NOT EXISTS public.funnels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  funnel_name TEXT NOT NULL,
  steps JSONB NOT NULL, -- [{"name": "Step 1", "url": "/page1", "event": "page_view"}]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Funnel analytics
CREATE TABLE IF NOT EXISTS public.funnel_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  sessions_entered INTEGER DEFAULT 0,
  sessions_completed INTEGER DEFAULT 0,
  drop_off_rate NUMERIC(5,2) DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(funnel_id, step_index, date)
);

-- Event debug log (GDPR-safe, 24h retention)
CREATE TABLE IF NOT EXISTS public.event_debug_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_params JSONB,
  session_id TEXT,
  device_type TEXT,
  ip_address TEXT, -- anonymized
  user_agent TEXT,
  consent_status JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ecommerce_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_debug_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their site ecommerce events"
  ON public.ecommerce_events FOR SELECT
  USING (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()));

CREATE POLICY "System can insert ecommerce events"
  ON public.ecommerce_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their site user identities"
  ON public.user_identities FOR SELECT
  USING (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()));

CREATE POLICY "System can manage user identities"
  ON public.user_identities FOR ALL
  USING (true);

CREATE POLICY "Users can manage their site funnels"
  ON public.funnels FOR ALL
  USING (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their funnel analytics"
  ON public.funnel_analytics FOR SELECT
  USING (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()));

CREATE POLICY "System can insert funnel analytics"
  ON public.funnel_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their event debug logs"
  ON public.event_debug_log FOR SELECT
  USING (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()));

CREATE POLICY "System can insert event debug logs"
  ON public.event_debug_log FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_ecommerce_events_site_id ON public.ecommerce_events(site_id);
CREATE INDEX idx_ecommerce_events_session_id ON public.ecommerce_events(session_id);
CREATE INDEX idx_ecommerce_events_type ON public.ecommerce_events(event_type);
CREATE INDEX idx_ecommerce_events_created_at ON public.ecommerce_events(created_at DESC);

CREATE INDEX idx_user_identities_site_id ON public.user_identities(site_id);
CREATE INDEX idx_user_identities_hash ON public.user_identities(user_hash);

CREATE INDEX idx_funnels_site_id ON public.funnels(site_id);
CREATE INDEX idx_funnel_analytics_funnel_id ON public.funnel_analytics(funnel_id);
CREATE INDEX idx_funnel_analytics_date ON public.funnel_analytics(date DESC);

CREATE INDEX idx_event_debug_log_site_id ON public.event_debug_log(site_id);
CREATE INDEX idx_event_debug_log_created_at ON public.event_debug_log(created_at DESC);

-- Auto-delete debug logs older than 24 hours (GDPR retention)
CREATE OR REPLACE FUNCTION cleanup_debug_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.event_debug_log 
  WHERE created_at < now() - interval '24 hours';
END;
$$;

-- Triggers
CREATE TRIGGER update_funnels_updated_at
  BEFORE UPDATE ON public.funnels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();