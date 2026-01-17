-- ============================================================================
-- FIX_WORKFLOW_STATION_KEYS.sql
--
-- Fixes the mismatch between workflow_station_key values in tasks and the
-- actual station_key values in workflow_stations table.
--
-- THE PROBLEM:
-- workflow_stations has: 'kickoff', 'engineering', 'production', etc.
-- tasks have: 'kickoff_meeting', 'engineering_review', 'production_start', etc.
--
-- This script updates tasks to use the correct station_key values.
--
-- Run this AFTER COMPREHENSIVE_DEMO_DATA.sql and FIX_WORKFLOW_TASKS_AND_CLIENTS.sql
-- ============================================================================

-- Show current mismatches
SELECT 'Current workflow_station_key values in tasks (may not match workflow_stations):' AS info;
SELECT DISTINCT workflow_station_key FROM tasks WHERE workflow_station_key IS NOT NULL ORDER BY 1;

SELECT 'Actual station_key values in workflow_stations:' AS info;
SELECT station_key, name FROM workflow_stations ORDER BY phase, display_order;

-- ============================================================================
-- FIX THE STATION KEY MISMATCHES
-- ============================================================================

-- Phase 1 fixes
UPDATE tasks SET workflow_station_key = 'kickoff' WHERE workflow_station_key = 'kickoff_meeting';
-- 'sales_handoff' is correct
-- 'site_survey' doesn't exist in workflow_stations - map to kickoff or remove

-- Phase 2 fixes
-- drawings_20, drawings_65, drawings_95, drawings_100 are correct
-- color_selections is correct
-- long_lead_items is correct
-- cutsheets is correct (maps to cutsheet_submittals)
UPDATE tasks SET workflow_station_key = 'cutsheets' WHERE workflow_station_key = 'cutsheet_submittals';

-- Phase 3 fixes
UPDATE tasks SET workflow_station_key = 'engineering' WHERE workflow_station_key = 'engineering_review';
UPDATE tasks SET workflow_station_key = 'third_party' WHERE workflow_station_key = 'third_party_review';
-- state_approval is correct
UPDATE tasks SET workflow_station_key = 'production_release' WHERE workflow_station_key = 'permit_submission';
UPDATE tasks SET workflow_station_key = 'production_release' WHERE workflow_station_key = 'change_orders';

-- Phase 4 fixes
UPDATE tasks SET workflow_station_key = 'production' WHERE workflow_station_key = 'production_start';
-- qc_inspection is correct
UPDATE tasks SET workflow_station_key = 'staging' WHERE workflow_station_key = 'staging_yard';
UPDATE tasks SET workflow_station_key = 'delivery' WHERE workflow_station_key IN ('delivery_scheduled', 'delivery_complete');
UPDATE tasks SET workflow_station_key = 'closeout' WHERE workflow_station_key = 'project_closeout';

-- Remove invalid station keys (site_survey doesn't have a workflow station)
UPDATE tasks SET workflow_station_key = 'kickoff' WHERE workflow_station_key = 'site_survey';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'After fix - workflow_station_key values in tasks:' AS info;
SELECT DISTINCT workflow_station_key FROM tasks WHERE workflow_station_key IS NOT NULL ORDER BY 1;

-- Check for any remaining mismatches
SELECT 'Tasks with station keys NOT in workflow_stations (should be empty):' AS info;
SELECT DISTINCT t.workflow_station_key
FROM tasks t
WHERE t.workflow_station_key IS NOT NULL
  AND t.workflow_station_key NOT IN (SELECT station_key FROM workflow_stations);

-- Show task counts per station
SELECT 'Task counts by workflow station:' AS info;
SELECT
  ws.station_key,
  ws.name,
  ws.phase,
  ws.display_order,
  COUNT(t.id) as task_count,
  SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
  SUM(CASE WHEN t.status = 'Not Started' THEN 1 ELSE 0 END) as not_started
FROM workflow_stations ws
LEFT JOIN tasks t ON t.workflow_station_key = ws.station_key
GROUP BY ws.station_key, ws.name, ws.phase, ws.display_order
ORDER BY ws.phase, ws.display_order;

SELECT 'FIX_WORKFLOW_STATION_KEYS.sql COMPLETE - Refresh workflow canvas to see progress!' AS status;
