-- Add UTM tracking fields to tracking_sessions table for paid advertising analytics
ALTER TABLE public.tracking_sessions 
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS referrer_url TEXT;

-- Create index for efficient UTM queries
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_utm_campaign 
ON public.tracking_sessions(site_id, utm_campaign) 
WHERE utm_campaign IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracking_sessions_utm_source_medium 
ON public.tracking_sessions(site_id, utm_source, utm_medium) 
WHERE utm_source IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.tracking_sessions.utm_source IS 'Traffic source (e.g., google, facebook, newsletter)';
COMMENT ON COLUMN public.tracking_sessions.utm_medium IS 'Marketing medium (e.g., cpc, email, social)';
COMMENT ON COLUMN public.tracking_sessions.utm_campaign IS 'Campaign name';
COMMENT ON COLUMN public.tracking_sessions.utm_term IS 'Paid keywords';
COMMENT ON COLUMN public.tracking_sessions.utm_content IS 'Ad content identifier';
COMMENT ON COLUMN public.tracking_sessions.referrer_url IS 'HTTP referrer URL';