-- Fix function search_path issue for security
-- Update existing functions to have immutable search_path
ALTER FUNCTION public.update_dashboard_insights_updated_at() SET search_path = '';
ALTER FUNCTION public.generate_tracking_id() SET search_path = '';
ALTER FUNCTION public.cleanup_old_tracking_data() SET search_path = '';
ALTER FUNCTION public.increment_navigation_clicks(uuid, integer, text, text, text, date) SET search_path = '';
ALTER FUNCTION public.get_site_cookie_summary(uuid) SET search_path = '';
ALTER FUNCTION public.increment_heatmap_grid_intensity(uuid, text, text, integer, integer, text, date, integer, integer) SET search_path = '';
ALTER FUNCTION public.should_rotate_session(text, uuid) SET search_path = '';
ALTER FUNCTION public.validate_email(text) SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.anonymize_ip(text) SET search_path = '';
ALTER FUNCTION public.validate_consent_for_tracking(uuid, text, text) SET search_path = '';
ALTER FUNCTION public.set_tracking_id() SET search_path = '';
ALTER FUNCTION public.increment_heatmap_intensity(uuid, text, text, integer, integer, text, date) SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';