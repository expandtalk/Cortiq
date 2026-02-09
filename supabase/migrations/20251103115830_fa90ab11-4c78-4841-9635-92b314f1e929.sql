-- Auto-anonymize IP addresses on insert using existing anonymize_ip function
-- This ensures GDPR/ePrivacy compliance by preventing storage of personal IP data

-- Create trigger function that anonymizes IP before insert
CREATE OR REPLACE FUNCTION auto_anonymize_ip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.ip_address IS NOT NULL AND NEW.ip_address != '' THEN
    NEW.ip_address = public.anonymize_ip(NEW.ip_address);
  END IF;
  RETURN NEW;
END;
$$;

-- Apply trigger to ai_bot_traffic
DROP TRIGGER IF EXISTS trigger_anonymize_ip_ai_bot_traffic ON public.ai_bot_traffic;
CREATE TRIGGER trigger_anonymize_ip_ai_bot_traffic
  BEFORE INSERT ON public.ai_bot_traffic
  FOR EACH ROW
  EXECUTE FUNCTION auto_anonymize_ip();

-- Apply trigger to cookie_consents
DROP TRIGGER IF EXISTS trigger_anonymize_ip_cookie_consents ON public.cookie_consents;
CREATE TRIGGER trigger_anonymize_ip_cookie_consents
  BEFORE INSERT ON public.cookie_consents
  FOR EACH ROW
  EXECUTE FUNCTION auto_anonymize_ip();

-- Apply trigger to consent_validations
DROP TRIGGER IF EXISTS trigger_anonymize_ip_consent_validations ON public.consent_validations;
CREATE TRIGGER trigger_anonymize_ip_consent_validations
  BEFORE INSERT ON public.consent_validations
  FOR EACH ROW
  EXECUTE FUNCTION auto_anonymize_ip();

-- Apply trigger to event_debug_log
DROP TRIGGER IF EXISTS trigger_anonymize_ip_event_debug_log ON public.event_debug_log;
CREATE TRIGGER trigger_anonymize_ip_event_debug_log
  BEFORE INSERT ON public.event_debug_log
  FOR EACH ROW
  EXECUTE FUNCTION auto_anonymize_ip();

-- Apply trigger to form_sessions
DROP TRIGGER IF EXISTS trigger_anonymize_ip_form_sessions ON public.form_sessions;
CREATE TRIGGER trigger_anonymize_ip_form_sessions
  BEFORE INSERT ON public.form_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_anonymize_ip();

-- Add comment explaining compliance
COMMENT ON FUNCTION auto_anonymize_ip() IS 
'Automatically anonymizes IP addresses before storage to ensure GDPR/ePrivacy compliance. 
IP addresses are masked (last octet for IPv4, last 80 bits for IPv6) to prevent personal identification 
while maintaining geographical and analytical value.';