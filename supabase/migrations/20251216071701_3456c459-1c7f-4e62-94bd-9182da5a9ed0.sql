-- Create secure table for storing integration credentials
CREATE TABLE public.site_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  encrypted_credentials TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, integration_type)
);

-- Enable RLS
ALTER TABLE public.site_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access integrations for sites they own via organization membership
CREATE POLICY "Users can view their site integrations" 
ON public.site_integrations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    JOIN public.organization_members om ON s.organization_id = om.organization_id
    WHERE s.id = site_integrations.site_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their site integrations" 
ON public.site_integrations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sites s
    JOIN public.organization_members om ON s.organization_id = om.organization_id
    WHERE s.id = site_integrations.site_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their site integrations" 
ON public.site_integrations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    JOIN public.organization_members om ON s.organization_id = om.organization_id
    WHERE s.id = site_integrations.site_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their site integrations" 
ON public.site_integrations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    JOIN public.organization_members om ON s.organization_id = om.organization_id
    WHERE s.id = site_integrations.site_id
    AND om.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_site_integrations_updated_at
  BEFORE UPDATE ON public.site_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_site_integrations_site_id ON public.site_integrations(site_id);
CREATE INDEX idx_site_integrations_type ON public.site_integrations(site_id, integration_type);