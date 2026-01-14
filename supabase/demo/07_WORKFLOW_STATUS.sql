-- ============================================================================
-- STEP 6: INITIALIZE WORKFLOW STATUS PER PROJECT
-- ============================================================================
-- Creates project_workflow_status records for each project.
-- Status is based on the project's current workflow phase:
-- - Stations before current phase: completed
-- - Current station: in_progress
-- - Future stations: not_started
--
-- Created: January 13, 2026
-- ============================================================================

-- ============================================================================
-- CREATE PROJECT WORKFLOW STATUS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_workflow_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  station_key VARCHAR(50) REFERENCES workflow_stations(station_key),
  status VARCHAR(20) DEFAULT 'not_started',
  started_date DATE,
  completed_date DATE,
  deadline DATE,
  notes TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, station_key)
);

CREATE INDEX IF NOT EXISTS idx_project_workflow_project ON project_workflow_status(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workflow_status ON project_workflow_status(status);

-- ============================================================================
-- GENERATE WORKFLOW STATUS FOR EACH PROJECT
-- ============================================================================
DO $$
DECLARE
  v_project RECORD;
  v_station RECORD;
  v_phase INTEGER;
  v_status VARCHAR(20);
  v_started_date DATE;
  v_completed_date DATE;
  v_days_offset INTEGER;
BEGIN
  -- Loop through all projects
  FOR v_project IN SELECT * FROM projects ORDER BY current_phase LOOP
    v_phase := COALESCE(v_project.current_phase, 1);
    v_days_offset := 0;

    -- Loop through all workflow stations
    FOR v_station IN SELECT * FROM workflow_stations ORDER BY phase, display_order LOOP

      -- Determine status based on project phase
      IF v_station.phase < v_phase THEN
        -- Previous phases are completed
        v_status := 'completed';
        v_started_date := v_project.start_date + (v_days_offset * INTERVAL '1 day');
        v_completed_date := v_project.start_date + ((v_days_offset + 7) * INTERVAL '1 day');
        v_days_offset := v_days_offset + 7;

      ELSIF v_station.phase = v_phase THEN
        -- Current phase - determine station status
        IF v_station.display_order = 1 THEN
          -- First station in current phase is in progress
          v_status := 'in_progress';
          v_started_date := v_project.start_date + (v_days_offset * INTERVAL '1 day');
          v_completed_date := NULL;
          v_days_offset := v_days_offset + 7;
        ELSE
          -- Other stations in current phase are not started
          v_status := 'not_started';
          v_started_date := NULL;
          v_completed_date := NULL;
        END IF;

        -- Special cases for specific projects
        IF v_project.project_number = 'SMM-21003' AND v_station.station_key = 'drawings_95' THEN
          v_status := 'blocked';
          v_started_date := v_project.start_date + INTERVAL '45 days';
        END IF;

        IF v_project.project_number IN ('SSI-7669', 'SSI-7670') AND v_station.station_key = 'drawings_95' THEN
          v_status := 'in_progress';
          v_started_date := v_project.start_date + INTERVAL '42 days';
        END IF;

        IF v_project.project_number = 'PMI-6781' AND v_station.station_key = 'drawings_65' THEN
          v_status := 'in_progress';
          v_started_date := v_project.start_date + INTERVAL '28 days';
        END IF;

        IF v_project.project_number IN ('SMM-21055', 'SME-23038') AND v_station.station_key = 'long_lead_items' THEN
          v_status := 'in_progress';
          v_started_date := v_project.start_date + INTERVAL '35 days';
        END IF;

        IF v_project.project_number IN ('SMM-21056', 'SMM-21057') AND v_station.station_key = 'color_selections' THEN
          v_status := 'awaiting_response';
          v_started_date := v_project.start_date + INTERVAL '38 days';
        END IF;

      ELSE
        -- Future phases are not started
        v_status := 'not_started';
        v_started_date := NULL;
        v_completed_date := NULL;
      END IF;

      -- Skip optional stations that aren't needed
      IF v_station.is_required = false AND v_status = 'not_started' THEN
        v_status := 'skipped';
      END IF;

      -- Insert workflow status record
      INSERT INTO project_workflow_status (
        project_id,
        station_key,
        status,
        started_date,
        completed_date,
        deadline,
        updated_by,
        created_at,
        updated_at
      ) VALUES (
        v_project.id,
        v_station.station_key,
        v_status,
        v_started_date,
        v_completed_date,
        CASE
          WHEN v_status IN ('in_progress', 'awaiting_response', 'blocked')
          THEN CURRENT_DATE + INTERVAL '14 days'
          ELSE NULL
        END,
        v_project.primary_pm_id,
        NOW(),
        NOW()
      )
      ON CONFLICT (project_id, station_key) DO UPDATE SET
        status = EXCLUDED.status,
        started_date = EXCLUDED.started_date,
        completed_date = EXCLUDED.completed_date,
        deadline = EXCLUDED.deadline,
        updated_at = NOW();

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Workflow status initialized for all projects';
END $$;

-- ============================================================================
-- FIX COMPLETE PROJECT (NWBS-25250 Hanford AMPS)
-- ============================================================================
UPDATE project_workflow_status
SET
  status = 'completed',
  started_date = (SELECT start_date FROM projects WHERE project_number = 'NWBS-25250'),
  completed_date = (SELECT target_online_date FROM projects WHERE project_number = 'NWBS-25250'),
  updated_at = NOW()
WHERE project_id = (SELECT id FROM projects WHERE project_number = 'NWBS-25250');

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Workflow status by phase:' AS status;

SELECT
  ws.phase,
  pws.status,
  COUNT(*) as count
FROM project_workflow_status pws
JOIN workflow_stations ws ON ws.station_key = pws.station_key
GROUP BY ws.phase, pws.status
ORDER BY ws.phase, pws.status;

SELECT 'Projects with blocked stations:' AS status;
SELECT
  p.project_number,
  p.name,
  pws.station_key,
  pws.status
FROM project_workflow_status pws
JOIN projects p ON p.id = pws.project_id
WHERE pws.status IN ('blocked', 'awaiting_response')
ORDER BY p.project_number;

SELECT 'Workflow status counts per project:' AS status;
SELECT
  p.project_number,
  p.current_phase,
  COUNT(*) FILTER (WHERE pws.status = 'completed') as completed,
  COUNT(*) FILTER (WHERE pws.status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE pws.status = 'not_started') as not_started,
  COUNT(*) FILTER (WHERE pws.status = 'blocked') as blocked,
  COUNT(*) FILTER (WHERE pws.status = 'skipped') as skipped
FROM projects p
JOIN project_workflow_status pws ON pws.project_id = p.id
GROUP BY p.project_number, p.current_phase
ORDER BY p.current_phase, p.project_number;
