-- Webhook delivery log
--
-- Tracks each attempted dispatch for a webhook channel so the UI can
-- show success/failure history and support manual retries.
--
-- notification_channels already stores webhook endpoints
-- (channel = 'webhook', config = { "url": "...", "secret": "..." }).
-- This table only logs delivery attempts.

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id      UUID        NOT NULL REFERENCES public.notification_channels(id) ON DELETE CASCADE,
  site_id         UUID        NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL,
  payload         JSONB       NOT NULL DEFAULT '{}',
  status          TEXT        NOT NULL DEFAULT 'pending'
    CONSTRAINT webhook_deliveries_status_check
      CHECK (status IN ('pending', 'success', 'failed')),
  http_status     INT,
  attempt_count   INT         NOT NULL DEFAULT 1,
  response_body   TEXT,
  delivered_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX webhook_deliveries_channel_idx  ON public.webhook_deliveries(channel_id);
CREATE INDEX webhook_deliveries_site_idx     ON public.webhook_deliveries(site_id);
CREATE INDEX webhook_deliveries_status_idx   ON public.webhook_deliveries(status);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_owner"
  ON public.webhook_deliveries
  FOR ALL
  USING (site_id IN (
    SELECT id FROM public.sites WHERE user_id = auth.uid()
  ))
  WITH CHECK (site_id IN (
    SELECT id FROM public.sites WHERE user_id = auth.uid()
  ));
