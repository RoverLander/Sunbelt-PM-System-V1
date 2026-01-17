-- ============================================================================
-- Queue Position and Soft Set Configuration Migration
-- ============================================================================
-- Adds queue_position tracking to modules table and soft_set_enabled to
-- plant_config for production line queue management.
--
-- Production Flow Logic:
-- - Each station can only actively work on 1 module at a time
-- - 0-N modules can be "In Queue" waiting for their turn
-- - queue_position = 0 means "In Progress" (actively being worked)
-- - queue_position > 0 means waiting (1 = next up, 2 = after that, etc.)
-- - NULL queue_position means not at a station (completed, staged, etc.)
--
-- Soft Set (aka Rough Set):
-- - Factory-dependent workflow where modules are "soft set" together on a
--   step-up pad for final interior finish work
-- - Some factories skip this and do final finish on the main line
-- - When enabled, Final Finish station can handle multiple modules
--
-- Created: January 17, 2026
-- ============================================================================

-- ============================================================================
-- 1. ADD QUEUE_POSITION TO MODULES TABLE
-- ============================================================================

-- Add queue_position column to track module position in station queue
ALTER TABLE modules ADD COLUMN IF NOT EXISTS queue_position INTEGER;

-- Add comment explaining the column
COMMENT ON COLUMN modules.queue_position IS
  'Position in station queue. 0 = In Progress (actively worked), 1+ = In Queue (waiting). NULL = not at a station.';

-- Create index for efficient queue ordering queries
CREATE INDEX IF NOT EXISTS idx_modules_queue_position
  ON modules(current_station_id, queue_position)
  WHERE queue_position IS NOT NULL;

-- ============================================================================
-- 2. ADD SOFT_SET_ENABLED TO PLANT_CONFIG
-- ============================================================================

-- Update plant_config.line_sim_defaults to include soft_set_enabled
-- Using DO block to safely update JSONB without overwriting existing values
DO $$
BEGIN
  -- Add soft_set_enabled to line_sim_defaults if it doesn't exist
  UPDATE plant_config
  SET line_sim_defaults = line_sim_defaults || '{"soft_set_enabled": false}'::jsonb
  WHERE NOT (line_sim_defaults ? 'soft_set_enabled');

  -- Update the default for new configs
  ALTER TABLE plant_config
    ALTER COLUMN line_sim_defaults
    SET DEFAULT '{
      "target_throughput_per_day": 2,
      "max_wip_per_station": 3,
      "bottleneck_threshold_hours": 4,
      "soft_set_enabled": false,
      "soft_set_station_capacity": 4,
      "inspection_batching": true
    }'::jsonb;
END $$;

-- Add comment explaining line_sim_defaults
COMMENT ON COLUMN plant_config.line_sim_defaults IS
  'Line simulation defaults: target_throughput_per_day, max_wip_per_station, bottleneck_threshold_hours, soft_set_enabled (final finish on step-up pad), soft_set_station_capacity, inspection_batching (inspector visits daily for multiple modules)';

-- ============================================================================
-- 3. ADD STATION CAPACITY TO STATION_TEMPLATES
-- ============================================================================

-- Add max_concurrent_modules column (default 1, but inspection/soft-set can be higher)
ALTER TABLE station_templates ADD COLUMN IF NOT EXISTS max_concurrent_modules INTEGER DEFAULT 1;

-- Add comment explaining the column
COMMENT ON COLUMN station_templates.max_concurrent_modules IS
  'Maximum modules that can be worked on simultaneously at this station. Usually 1, but inspection stations and soft-set stations can handle multiple.';

-- ============================================================================
-- 4. ADD STATION_ENTERED_AT TO MODULES
-- ============================================================================

-- Track when a module entered its current station (for queue time analytics)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS station_entered_at TIMESTAMPTZ;

-- Add comment explaining the column
COMMENT ON COLUMN modules.station_entered_at IS
  'Timestamp when module entered current station. Used for queue time analytics.';

-- Create index for queue time calculations
CREATE INDEX IF NOT EXISTS idx_modules_station_entered_at
  ON modules(current_station_id, station_entered_at)
  WHERE station_entered_at IS NOT NULL;

-- ============================================================================
-- 5. CREATE QUEUE_HISTORY TABLE FOR ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_queue_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES station_templates(id) ON DELETE CASCADE,
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,

  -- Queue tracking
  entered_queue_at TIMESTAMPTZ NOT NULL,
  started_work_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Position tracking
  initial_queue_position INTEGER,

  -- Calculated durations (in minutes) - computed on completion only
  -- Note: Cannot use NOW() in generated columns (not immutable)
  -- These are calculated when started_work_at/completed_at are set
  queue_wait_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN started_work_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (started_work_at - entered_queue_at)) / 60
      ELSE NULL
    END
  ) STORED,
  work_duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN started_work_at IS NOT NULL AND completed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (completed_at - started_work_at)) / 60
      ELSE NULL
    END
  ) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_module_queue_history_module ON module_queue_history(module_id);
CREATE INDEX IF NOT EXISTS idx_module_queue_history_station ON module_queue_history(station_id);
CREATE INDEX IF NOT EXISTS idx_module_queue_history_factory ON module_queue_history(factory_id);
CREATE INDEX IF NOT EXISTS idx_module_queue_history_dates ON module_queue_history(entered_queue_at, completed_at);

-- ============================================================================
-- 6. ADD RLS POLICIES FOR NEW TABLE
-- ============================================================================

ALTER TABLE module_queue_history ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users in same factory
CREATE POLICY "Users can view queue history for their factory"
  ON module_queue_history FOR SELECT
  USING (
    factory_id IN (
      SELECT factory_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('VP', 'Admin', 'IT', 'IT_Manager')
    )
  );

-- Allow insert/update for plant managers and admins
CREATE POLICY "Plant managers can manage queue history"
  ON module_queue_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        (role IN ('Plant_GM', 'Production_Manager') AND factory_id = module_queue_history.factory_id)
        OR role IN ('VP', 'Admin', 'IT', 'IT_Manager')
      )
    )
  );

-- ============================================================================
-- 7. HELPER FUNCTION: GET NEXT QUEUE POSITION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_queue_position(p_station_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_position), -1) + 1 INTO next_pos
  FROM modules
  WHERE current_station_id = p_station_id
    AND queue_position IS NOT NULL;

  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. HELPER FUNCTION: ADVANCE QUEUE
-- ============================================================================

CREATE OR REPLACE FUNCTION advance_station_queue(p_station_id UUID)
RETURNS VOID AS $$
BEGIN
  -- When position 0 completes, shift all other modules down
  UPDATE modules
  SET queue_position = queue_position - 1,
      updated_at = NOW()
  WHERE current_station_id = p_station_id
    AND queue_position > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. TRIGGER: AUTO-RECORD QUEUE HISTORY
-- ============================================================================

CREATE OR REPLACE FUNCTION record_queue_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- When module enters a new station (queue_position set from NULL or station changes)
  IF (TG_OP = 'UPDATE' AND OLD.current_station_id IS DISTINCT FROM NEW.current_station_id AND NEW.current_station_id IS NOT NULL) THEN
    -- Complete the old queue history record
    UPDATE module_queue_history
    SET completed_at = NOW()
    WHERE module_id = NEW.id
      AND station_id = OLD.current_station_id
      AND completed_at IS NULL;

    -- Start new queue history record
    INSERT INTO module_queue_history (module_id, station_id, factory_id, entered_queue_at, initial_queue_position)
    VALUES (NEW.id, NEW.current_station_id, NEW.factory_id, NOW(), NEW.queue_position);
  END IF;

  -- When module starts being worked (queue_position changes from >0 to 0)
  IF (TG_OP = 'UPDATE' AND OLD.queue_position > 0 AND NEW.queue_position = 0) THEN
    UPDATE module_queue_history
    SET started_work_at = NOW()
    WHERE module_id = NEW.id
      AND station_id = NEW.current_station_id
      AND started_work_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_queue_transition ON modules;
CREATE TRIGGER trg_record_queue_transition
  AFTER UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION record_queue_transition();

-- ============================================================================
-- Done!
-- ============================================================================
