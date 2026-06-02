-- AI Agent Detection Improvements
-- Adds markdown header detection and bot category classification

ALTER TABLE public.ai_bot_traffic
  ADD COLUMN IF NOT EXISTS requests_markdown_format BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_category TEXT DEFAULT 'other';
-- bot_category values: 'known_bot' | 'unknown_ai_behavior' | 'other'

CREATE INDEX IF NOT EXISTS idx_ai_bot_traffic_bot_category
  ON public.ai_bot_traffic(site_id, bot_category);

CREATE INDEX IF NOT EXISTS idx_ai_bot_traffic_markdown
  ON public.ai_bot_traffic(site_id, requests_markdown_format)
  WHERE requests_markdown_format = true;
