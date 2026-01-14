-- ============================================================================
-- DEBUG_TASKS.sql - Diagnose why tasks aren't being created
-- ============================================================================
-- Run this AFTER running MASTER_DEMO_DATA.sql to diagnose task issues

-- Step 1: Check if projects exist
SELECT 'Projects count:' AS check_type, COUNT(*)::TEXT AS result FROM projects
UNION ALL
SELECT 'Tasks count:', COUNT(*)::TEXT FROM tasks
UNION ALL
SELECT 'RFIs count:', COUNT(*)::TEXT FROM rfis
UNION ALL
SELECT 'Submittals count:', COUNT(*)::TEXT FROM submittals
UNION ALL
SELECT 'Milestones count:', COUNT(*)::TEXT FROM milestones
UNION ALL
SELECT 'Workflow stations:', COUNT(*)::TEXT FROM workflow_stations;

-- Step 2: Check a sample project
SELECT 'Sample project' AS info, id, project_number, primary_pm_id, current_phase
FROM projects
LIMIT 3;

-- Step 3: Check if workflow_stations exist with expected keys
SELECT station_key, name, phase
FROM workflow_stations
WHERE station_key IN ('sales_handoff', 'kickoff_meeting', 'site_survey')
ORDER BY phase, display_order;

-- Step 4: Try to manually insert ONE task to see if it works
DO $$
DECLARE
  v_project_id UUID;
  v_pm_id UUID;
BEGIN
  -- Get first project
  SELECT id, primary_pm_id INTO v_project_id, v_pm_id
  FROM projects
  LIMIT 1;

  IF v_project_id IS NULL THEN
    RAISE NOTICE 'ERROR: No projects found!';
    RETURN;
  END IF;

  RAISE NOTICE 'Found project: %, PM: %', v_project_id, v_pm_id;

  -- If PM is null, get any user
  IF v_pm_id IS NULL THEN
    SELECT id INTO v_pm_id FROM users LIMIT 1;
    RAISE NOTICE 'Using fallback PM: %', v_pm_id;
  END IF;

  -- Try inserting a test task
  INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, created_at)
  VALUES (v_project_id, 'DEBUG TEST TASK', 'This is a test task to verify insertion works', 'Not Started', 'High', CURRENT_DATE + INTERVAL '7 days', v_pm_id, NOW());

  RAISE NOTICE 'SUCCESS: Test task inserted!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR inserting task: %', SQLERRM;
END $$;

-- Step 5: Check if test task was created
SELECT 'Test task created?' AS check_type,
       CASE WHEN EXISTS (SELECT 1 FROM tasks WHERE title = 'DEBUG TEST TASK')
            THEN 'YES' ELSE 'NO' END AS result;

-- Step 6: Show any tasks that exist
SELECT id, project_id, title, status, created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;
