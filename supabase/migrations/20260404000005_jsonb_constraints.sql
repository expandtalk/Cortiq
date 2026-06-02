-- Add CHECK constraints to JSONB columns to enforce basic schema validity.
-- This prevents silent corruption from frontend bugs writing bad structures.

-- utm_segments.filters must be a JSON array
ALTER TABLE utm_segments
  ADD CONSTRAINT filters_must_be_array
  CHECK (jsonb_typeof(filters) = 'array');

-- kpi_ai_insights.insights_json must be a JSON array
ALTER TABLE kpi_ai_insights
  ADD CONSTRAINT insights_must_be_array
  CHECK (insights_json IS NULL OR jsonb_typeof(insights_json) = 'array');

-- Verify tag_manager tags column if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tags' AND column_name = 'config'
    AND data_type = 'jsonb'
  ) THEN
    -- Tags config must be an object
    EXECUTE 'ALTER TABLE tags ADD CONSTRAINT tag_config_must_be_object CHECK (config IS NULL OR jsonb_typeof(config) = ''object'')';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
