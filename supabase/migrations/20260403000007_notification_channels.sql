-- Notification Channels
--
-- Stores per-site notification channel configurations.
-- Currently supported: telegram.
-- Designed to extend to email, slack, webhook.
--
-- GDPR: bot_token and chat_id are operational credentials, not personal data.
-- They are stored in Supabase encrypted-at-rest and never logged.

CREATE TABLE IF NOT EXISTS public.notification_channels (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID        NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  channel     TEXT        NOT NULL
    CONSTRAINT notification_channels_channel_check
      CHECK (channel IN ('telegram', 'email', 'slack', 'webhook')),
  -- Optional user-supplied label, e.g. "Team Alerts"
  label       TEXT,
  -- Channel-specific credentials:
  --   telegram: { "bot_token": "...", "chat_id": "..." }
  --   email:    { "address": "..." }
  --   webhook:  { "url": "...", "secret": "..." }
  config      JSONB       NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notification_channels_site_active_idx
  ON public.notification_channels(site_id)
  WHERE is_active = true;

COMMENT ON TABLE public.notification_channels IS
  'Per-site notification channel configs. config JSONB holds channel-specific '
  'credentials. Readable only by the site owner via RLS. '
  'Edge functions use the service role and bypass RLS.';

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

-- Site owner can read and write their own channels
CREATE POLICY "notification_channels_owner"
  ON public.notification_channels
  FOR ALL
  USING (site_id IN (
    SELECT id FROM public.sites WHERE user_id = auth.uid()
  ))
  WITH CHECK (site_id IN (
    SELECT id FROM public.sites WHERE user_id = auth.uid()
  ));
