-- Register cortiq.se as its own tracked site.
-- site_id matches the siteId in index.html window.wfaConfig.
-- tracking_id matches the apiKey so track-event can authenticate via Bearer token.
INSERT INTO public.sites (
  id,
  user_id,
  domain,
  site_name,
  tracking_id,
  is_active
)
VALUES (
  '1174dce9-ca03-4660-b6b2-41c3d3632954',
  '6dbde02d-2a21-4beb-9bd5-1a6b6d1ed387',
  'cortiq.se',
  'CortIQ',
  '7wUAo/uexTyQBjK82GtlUC4NfiqqC2pYfEjzAuOpkHo=',
  true
)
ON CONFLICT (id) DO UPDATE
  SET is_active   = true,
      domain      = EXCLUDED.domain,
      site_name   = EXCLUDED.site_name,
      updated_at  = now();
