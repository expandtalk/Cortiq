-- Create database function for upserting user identity (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.upsert_user_identity(
  p_site_id UUID,
  p_user_hash TEXT,
  p_session_id TEXT,
  p_revenue NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  existing_identity RECORD;
BEGIN
  -- Get existing identity
  SELECT * INTO existing_identity
  FROM public.user_identities
  WHERE site_id = p_site_id AND user_hash = p_user_hash;
  
  IF existing_identity IS NOT NULL THEN
    -- Update existing identity
    UPDATE public.user_identities
    SET 
      session_ids = array_append(session_ids, p_session_id),
      total_sessions = total_sessions + 1,
      total_revenue = total_revenue + p_revenue,
      last_seen = now()
    WHERE site_id = p_site_id AND user_hash = p_user_hash;
  ELSE
    -- Insert new identity
    INSERT INTO public.user_identities (
      site_id, user_hash, session_ids, total_sessions, 
      total_revenue, consent_granted
    ) VALUES (
      p_site_id, p_user_hash, ARRAY[p_session_id], 1, 
      p_revenue, true
    );
  END IF;
END;
$$;

-- Add size constraints to prevent abuse
ALTER TABLE public.ecommerce_events 
  ADD CONSTRAINT check_product_name_length 
  CHECK (length(product_name) <= 500);

ALTER TABLE public.ecommerce_events 
  ADD CONSTRAINT check_price_range 
  CHECK (price IS NULL OR (price >= 0 AND price <= 1000000));

ALTER TABLE public.ecommerce_events 
  ADD CONSTRAINT check_revenue_range 
  CHECK (revenue IS NULL OR (revenue >= 0 AND revenue <= 10000000));

-- Add constraint to event_debug_log to limit param size
ALTER TABLE public.event_debug_log 
  ADD CONSTRAINT check_event_params_size 
  CHECK (pg_column_size(event_params) <= 102400);

-- Create index for cleanup (without WHERE clause to avoid immutable issue)
CREATE INDEX IF NOT EXISTS idx_event_debug_log_created_at_cleanup 
  ON public.event_debug_log(created_at DESC);