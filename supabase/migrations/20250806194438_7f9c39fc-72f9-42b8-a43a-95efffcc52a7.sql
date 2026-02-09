-- Security Enhancement: Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admin users can view audit logs" ON public.security_audit_log
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- System can insert audit logs (no user restriction)
CREATE POLICY "System can insert audit logs" ON public.security_audit_log
FOR INSERT TO authenticated
WITH CHECK (true);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_severity TEXT DEFAULT 'medium'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    INSERT INTO public.security_audit_log (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        severity
    ) VALUES (
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_details,
        p_severity
    );
END;
$$;

-- Enhance sites table with security settings
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{
    "rate_limit_requests_per_minute": 60,
    "require_csrf_token": true,
    "allow_cross_origin": false,
    "max_session_duration_hours": 24,
    "force_https": true
}'::jsonb;

-- Add trigger to log site modifications
CREATE OR REPLACE FUNCTION public.audit_site_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM public.log_security_event(
            'site_updated',
            'site',
            NEW.id::text,
            jsonb_build_object(
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW)
            ),
            'medium'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.log_security_event(
            'site_deleted',
            'site',
            OLD.id::text,
            to_jsonb(OLD),
            'high'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER audit_sites_changes
    AFTER UPDATE OR DELETE ON public.sites
    FOR EACH ROW EXECUTE FUNCTION public.audit_site_changes();

-- Enhance cookie_consents with better validation
ALTER TABLE public.cookie_consents ADD COLUMN IF NOT EXISTS client_fingerprint TEXT;
ALTER TABLE public.cookie_consents ADD COLUMN IF NOT EXISTS consent_method TEXT DEFAULT 'banner' CHECK (consent_method IN ('banner', 'api', 'settings'));

-- Add function to validate consent authenticity
CREATE OR REPLACE FUNCTION public.validate_consent_authenticity(
    p_session_id TEXT,
    p_site_id UUID,
    p_client_fingerprint TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    consent_count INTEGER;
    suspicious_activity BOOLEAN := false;
BEGIN
    -- Check for excessive consent requests from same session/fingerprint
    SELECT COUNT(*) INTO consent_count
    FROM public.cookie_consents
    WHERE session_id = p_session_id
    AND site_id = p_site_id
    AND created_at > now() - INTERVAL '1 hour';
    
    IF consent_count > 10 THEN
        suspicious_activity := true;
        PERFORM public.log_security_event(
            'suspicious_consent_activity',
            'consent',
            p_session_id,
            jsonb_build_object(
                'consent_count', consent_count,
                'site_id', p_site_id,
                'fingerprint', p_client_fingerprint
            ),
            'high'
        );
    END IF;
    
    RETURN NOT suspicious_activity;
END;
$$;

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP, user_id, or session_id
    resource TEXT NOT NULL,   -- endpoint or resource being accessed
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(identifier, resource, window_start)
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow system to manage rate limits
CREATE POLICY "System manages rate limits" ON public.rate_limits
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_resource TEXT,
    p_max_requests INTEGER DEFAULT 60,
    p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    current_count INTEGER := 0;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate current window start
    window_start := date_trunc('minute', now()) - (EXTRACT(minute FROM now())::INTEGER % p_window_minutes) * INTERVAL '1 minute';
    
    -- Get or create rate limit record
    INSERT INTO public.rate_limits (identifier, resource, request_count, window_start)
    VALUES (p_identifier, p_resource, 1, window_start)
    ON CONFLICT (identifier, resource, window_start)
    DO UPDATE SET 
        request_count = rate_limits.request_count + 1,
        created_at = now()
    RETURNING request_count INTO current_count;
    
    -- Clean up old rate limit records
    DELETE FROM public.rate_limits 
    WHERE window_start < now() - INTERVAL '1 hour';
    
    -- Check if rate limit exceeded
    IF current_count > p_max_requests THEN
        PERFORM public.log_security_event(
            'rate_limit_exceeded',
            'rate_limit',
            p_identifier,
            jsonb_build_object(
                'resource', p_resource,
                'current_count', current_count,
                'max_requests', p_max_requests
            ),
            'medium'
        );
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;