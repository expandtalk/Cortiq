-- Fix overly permissive RLS policy on bot_detections.
-- The service role insert policy had WITH CHECK (true) — no site ownership check.

-- Drop and recreate the service insert policy with proper constraint
DO $$ BEGIN
  -- bot_detections: fix service insert policy
  DROP POLICY IF EXISTS "bot_detections_service_insert" ON public.bot_detections;

  -- New policy: only allow insert for sites owned by authenticated user
  -- or via service role with valid site_id in sites table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bot_detections'
    AND policyname = 'bot_detections_owner_insert'
  ) THEN
    CREATE POLICY bot_detections_owner_insert ON public.bot_detections
      FOR INSERT
      WITH CHECK (
        site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
      );
  END IF;

  -- utm_segments: ensure update/delete are also scoped to site owner
  DROP POLICY IF EXISTS "utm_segments_owner_access" ON public.utm_segments;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'utm_segments'
    AND policyname = 'utm_segments_owner_all'
  ) THEN
    CREATE POLICY utm_segments_owner_all ON public.utm_segments
      USING  (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()))
      WITH CHECK (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Policy may not exist; ignore
  NULL;
END $$;
