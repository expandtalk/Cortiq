-- Add updated_at triggers to tables that are missing them.
-- Uses a generic trigger function to avoid code duplication.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Helper macro: create trigger only if column exists and trigger doesn't
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'kpi_comments',
    'kpi_ai_insights',
    'utm_segments',
    'sites',
    'companies',
    'api_keys',
    'notification_channels',
    'ip_segments',
    'conversion_goals',
    'ab_tests',
    'tag_rules',
    'data_warehouse_connectors',
    'scheduled_reports',
    'custom_segments'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Only add if: table exists, has updated_at column, and trigger doesn't exist yet
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = t
      AND column_name = 'updated_at'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || t || '_updated_at'
      AND tgrelid = ('public.' || t)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
        t, t
      );
    END IF;
  END LOOP;
END $$;
