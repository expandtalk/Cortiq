-- Add agent configuration to sites table
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS agent_config JSONB DEFAULT '{
  "tracking_enabled": true,
  "agent_macros": [],
  "browser_profiles": []
}'::jsonb;

-- Create agent_macros table for reusable configurations
CREATE TABLE IF NOT EXISTS public.agent_macros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  macro_type TEXT NOT NULL CHECK (macro_type IN ('browser_profile', 'detection_rule', 'tracking_config')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(site_id, name)
);

-- Enable RLS on agent_macros
ALTER TABLE public.agent_macros ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see macros for their own sites
CREATE POLICY "Users can view their own site macros"
ON public.agent_macros
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = agent_macros.site_id
    AND sites.user_id = auth.uid()
  )
);

-- Policy: Users can insert macros for their own sites
CREATE POLICY "Users can create macros for their sites"
ON public.agent_macros
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = agent_macros.site_id
    AND sites.user_id = auth.uid()
  )
);

-- Policy: Users can update their own site macros
CREATE POLICY "Users can update their own site macros"
ON public.agent_macros
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = agent_macros.site_id
    AND sites.user_id = auth.uid()
  )
);

-- Policy: Users can delete their own site macros
CREATE POLICY "Users can delete their own site macros"
ON public.agent_macros
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = agent_macros.site_id
    AND sites.user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_agent_macros_site_id ON public.agent_macros(site_id);
CREATE INDEX IF NOT EXISTS idx_agent_macros_active ON public.agent_macros(site_id, is_active) WHERE is_active = true;

-- Add trigger for updated_at
CREATE TRIGGER update_agent_macros_updated_at
  BEFORE UPDATE ON public.agent_macros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();