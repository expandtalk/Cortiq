-- Create ai_bot_analysis table for storing AI-powered security analysis
CREATE TABLE IF NOT EXISTS public.ai_bot_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  analysis_period_days INTEGER NOT NULL DEFAULT 7,
  total_visits INTEGER NOT NULL DEFAULT 0,
  unique_bots INTEGER NOT NULL DEFAULT 0,
  threat_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  threat_indicators JSONB DEFAULT '{}'::jsonb,
  bot_breakdown JSONB DEFAULT '{}'::jsonb,
  ai_analysis TEXT,
  recommendations_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_bot_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own site bot analysis"
  ON public.ai_bot_analysis
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert bot analysis"
  ON public.ai_bot_analysis
  FOR INSERT
  WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_bot_analysis_site_id ON public.ai_bot_analysis(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_bot_analysis_created_at ON public.ai_bot_analysis(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_ai_bot_analysis_updated_at
  BEFORE UPDATE ON public.ai_bot_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();