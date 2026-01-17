-- ============================================================================
-- FIX_WORKFLOW_TASKS_AND_CLIENTS.sql
-- Comprehensive fix for:
-- 1. Client names changed to DEALERS (not end users)
-- 2. Tasks created with workflow_station_key for workflow canvas display
--
-- Run this in Supabase SQL Editor after COMPREHENSIVE_DEMO_DATA.sql
-- ============================================================================

-- ============================================================================
-- PART 1: FIX CLIENT NAMES TO BE DEALERS
-- In modular building, the CLIENT is always the DEALER, not the end user.
-- The project NAME can reflect the end user, but client_name = dealer.
-- ============================================================================

-- NWBS Factory Dealers
UPDATE projects SET client_name = 'Pacific Northwest Modulars' WHERE project_number = 'NWBS-26-001';
UPDATE projects SET client_name = 'Idaho Building Solutions' WHERE project_number = 'NWBS-26-002';
UPDATE projects SET client_name = 'Cascade Modular Systems' WHERE project_number = 'NWBS-26-003';
UPDATE projects SET client_name = 'Mountain West Structures' WHERE project_number = 'NWBS-26-004';
UPDATE projects SET client_name = 'Gem State Modulars' WHERE project_number = 'NWBS-26-005';
UPDATE projects SET client_name = 'Snake River Construction' WHERE project_number = 'NWBS-26-006';

-- PMI Factory Dealers
UPDATE projects SET client_name = 'Southwest Modular Partners' WHERE project_number = 'PMI-26-001';
UPDATE projects SET client_name = 'Arizona Building Group' WHERE project_number = 'PMI-26-002';
UPDATE projects SET client_name = 'Desert Construction Alliance' WHERE project_number = 'PMI-26-003';
UPDATE projects SET client_name = 'Sonoran Structures LLC' WHERE project_number = 'PMI-26-004';

-- WM-EVERGREEN Factory Dealers
UPDATE projects SET client_name = 'Puget Sound Modulars' WHERE project_number = 'WMEV-26-001';
UPDATE projects SET client_name = 'Northwest Building Partners' WHERE project_number = 'WMEV-26-002';
UPDATE projects SET client_name = 'Evergreen State Structures' WHERE project_number = 'WMEV-26-003';

-- WM-EAST Factory Dealers
UPDATE projects SET client_name = 'Carolina Modular Solutions' WHERE project_number = 'WMEA-26-001';
UPDATE projects SET client_name = 'Piedmont Building Group' WHERE project_number = 'WMEA-26-002';
UPDATE projects SET client_name = 'Triangle Construction Partners' WHERE project_number = 'WMEA-26-003';

-- WM-SOUTH Factory Dealers
UPDATE projects SET client_name = 'Gulf Coast Building Systems' WHERE project_number = 'WMSO-26-001';
UPDATE projects SET client_name = 'Lone Star Modulars' WHERE project_number = 'WMSO-26-002';
UPDATE projects SET client_name = 'Texas Modular Alliance' WHERE project_number = 'WMSO-26-003';

-- AMT Factory Dealers
UPDATE projects SET client_name = 'DFW Modular Partners' WHERE project_number = 'AMT-26-001';
UPDATE projects SET client_name = 'North Texas Structures' WHERE project_number = 'AMT-26-002';

-- SMM Factory Dealers
UPDATE projects SET client_name = 'Gulf States Modulars' WHERE project_number = 'SMM-26-001';
UPDATE projects SET client_name = 'Alabama Building Partners' WHERE project_number = 'SMM-26-002';

SELECT 'Part 1 Complete: Client names updated to dealers' AS status;

-- ============================================================================
-- PART 2: DELETE EXISTING TASKS AND CREATE WORKFLOW-LINKED TASKS
-- Tasks with workflow_station_key are what the workflow canvas uses for status
-- ============================================================================

-- Clear existing tasks for demo projects
DELETE FROM tasks WHERE project_id IN (
  SELECT id FROM projects WHERE project_number LIKE '%-26-%'
);

-- ============================================================================
-- Create tasks with workflow_station_key for each project based on its phase
-- ============================================================================

DO $$
DECLARE
  v_project RECORD;
  v_user_id UUID;
  v_pm_id UUID;
BEGIN
  -- Get a default user for task assignment
  SELECT id INTO v_user_id FROM users WHERE is_active = true LIMIT 1;

  -- =========================================================================
  -- PHASE 4 PROJECTS (Production) - Most stations complete
  -- =========================================================================

  FOR v_project IN
    SELECT p.id, p.project_number, p.name, p.current_phase, p.health_status, p.primary_pm_id
    FROM projects p
    WHERE p.project_number IN ('NWBS-26-001', 'NWBS-26-002', 'PMI-26-001', 'WMEV-26-001',
                               'WMEA-26-001', 'WMSO-26-001', 'AMT-26-001', 'SMM-26-001')
  LOOP
    v_pm_id := COALESCE(v_project.primary_pm_id, v_user_id);

    -- Phase 1 tasks - ALL COMPLETE
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Sales package handoff complete', 'Received complete sales package from sales team', 'Completed', 'High', 'sales_handoff', v_pm_id, CURRENT_DATE - 90, v_pm_id),
      (v_project.id, 'Review contract documents', 'Verify contract terms and scope', 'Completed', 'High', 'sales_handoff', v_pm_id, CURRENT_DATE - 88, v_pm_id),
      (v_project.id, 'Kickoff meeting held', 'Internal kickoff meeting completed', 'Completed', 'High', 'kickoff_meeting', v_pm_id, CURRENT_DATE - 85, v_pm_id),
      (v_project.id, 'Project schedule created', 'Master schedule distributed to team', 'Completed', 'Medium', 'kickoff_meeting', v_pm_id, CURRENT_DATE - 83, v_pm_id),
      (v_project.id, 'Site survey completed', 'Site conditions documented', 'Completed', 'Medium', 'site_survey', v_pm_id, CURRENT_DATE - 80, v_pm_id);

    -- Phase 2 tasks - ALL COMPLETE
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, '20% drawings approved', 'Preliminary drawings signed off by dealer', 'Completed', 'High', 'drawings_20', v_pm_id, CURRENT_DATE - 75, v_pm_id),
      (v_project.id, '65% drawings approved', 'Design development complete', 'Completed', 'High', 'drawings_65', v_pm_id, CURRENT_DATE - 60, v_pm_id),
      (v_project.id, 'Color selections finalized', 'All finishes confirmed by dealer', 'Completed', 'High', 'color_selections', v_pm_id, CURRENT_DATE - 55, v_pm_id),
      (v_project.id, 'Long lead items ordered', 'All long lead equipment on order', 'Completed', 'High', 'long_lead_items', v_pm_id, CURRENT_DATE - 55, v_pm_id),
      (v_project.id, 'Cutsheets approved', 'All equipment submittals approved', 'Completed', 'High', 'cutsheets', v_pm_id, CURRENT_DATE - 50, v_pm_id),
      (v_project.id, '95% drawings approved', 'Construction documents reviewed', 'Completed', 'High', 'drawings_95', v_pm_id, CURRENT_DATE - 45, v_pm_id),
      (v_project.id, '100% drawings issued', 'Final construction documents released', 'Completed', 'High', 'drawings_100', v_pm_id, CURRENT_DATE - 40, v_pm_id);

    -- Phase 3 tasks - ALL COMPLETE
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Engineering review complete', 'Structural and MEP review passed', 'Completed', 'High', 'engineering_review', v_pm_id, CURRENT_DATE - 35, v_pm_id),
      (v_project.id, 'Third party stamp received', 'Plan review completed by third party', 'Completed', 'High', 'third_party_review', v_pm_id, CURRENT_DATE - 30, v_pm_id),
      (v_project.id, 'State modular approval received', 'State insignia/approval obtained', 'Completed', 'High', 'state_approval', v_pm_id, CURRENT_DATE - 25, v_pm_id),
      (v_project.id, 'Permit submitted', 'Building permit application submitted', 'Completed', 'Medium', 'permit_submission', v_pm_id, CURRENT_DATE - 23, v_pm_id),
      (v_project.id, 'Change orders processed', 'All COs signed with PO', 'Completed', 'High', 'change_orders', v_pm_id, CURRENT_DATE - 20, v_pm_id);

    -- Phase 4 tasks - IN PROGRESS
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Production in progress', 'Modules under construction at factory', 'In Progress', 'High', 'production_start', v_pm_id, CURRENT_DATE + 14, v_pm_id),
      (v_project.id, 'Track module progress', 'Daily production tracking', 'In Progress', 'Medium', 'production_start', v_pm_id, CURRENT_DATE + 14, v_pm_id),
      (v_project.id, 'QC inspections ongoing', 'Quality checkpoints at factory', 'In Progress', 'High', 'qc_inspection', v_pm_id, CURRENT_DATE + 20, v_pm_id),
      (v_project.id, 'Schedule delivery logistics', 'Coordinate transport and site prep', 'Not Started', 'High', 'delivery_scheduled', v_pm_id, CURRENT_DATE + 25, v_pm_id),
      (v_project.id, 'Final delivery coordination', 'Confirm delivery date with site', 'Not Started', 'High', 'delivery_complete', v_pm_id, CURRENT_DATE + 30, v_pm_id),
      (v_project.id, 'Set and stitch crew scheduled', 'Field crew assignment', 'Not Started', 'Medium', 'set_complete', v_pm_id, CURRENT_DATE + 35, v_pm_id),
      (v_project.id, 'Closeout documentation', 'Warranty and as-builts prep', 'Not Started', 'Low', 'project_closeout', v_pm_id, CURRENT_DATE + 45, v_pm_id);
  END LOOP;

  -- =========================================================================
  -- PHASE 3 PROJECTS (Approvals) - Through Phase 2, in Phase 3
  -- =========================================================================

  FOR v_project IN
    SELECT p.id, p.project_number, p.name, p.current_phase, p.health_status, p.primary_pm_id
    FROM projects p
    WHERE p.project_number IN ('NWBS-26-003', 'PMI-26-002', 'WMEV-26-002', 'WMEA-26-002',
                               'WMSO-26-002', 'AMT-26-002')
  LOOP
    v_pm_id := COALESCE(v_project.primary_pm_id, v_user_id);

    -- Phase 1 tasks - COMPLETE
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Sales handoff complete', 'Project transferred from sales', 'Completed', 'High', 'sales_handoff', v_pm_id, CURRENT_DATE - 60, v_pm_id),
      (v_project.id, 'Kickoff meeting held', 'Project kickoff completed', 'Completed', 'High', 'kickoff_meeting', v_pm_id, CURRENT_DATE - 55, v_pm_id),
      (v_project.id, 'Site survey done', 'Site conditions assessed', 'Completed', 'Medium', 'site_survey', v_pm_id, CURRENT_DATE - 50, v_pm_id);

    -- Phase 2 tasks - COMPLETE
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, '20% drawings approved', 'Preliminary design approved', 'Completed', 'High', 'drawings_20', v_pm_id, CURRENT_DATE - 45, v_pm_id),
      (v_project.id, '65% drawings approved', 'DD drawings signed off', 'Completed', 'High', 'drawings_65', v_pm_id, CURRENT_DATE - 35, v_pm_id),
      (v_project.id, 'Colors selected', 'Finish selections confirmed', 'Completed', 'High', 'color_selections', v_pm_id, CURRENT_DATE - 30, v_pm_id),
      (v_project.id, 'Long lead items ordered', 'Equipment procurement started', 'Completed', 'High', 'long_lead_items', v_pm_id, CURRENT_DATE - 30, v_pm_id),
      (v_project.id, 'Cutsheets reviewed', 'Equipment submittals approved', 'Completed', 'High', 'cutsheets', v_pm_id, CURRENT_DATE - 25, v_pm_id),
      (v_project.id, '95% drawings complete', 'Near-final drawings issued', 'Completed', 'High', 'drawings_95', v_pm_id, CURRENT_DATE - 20, v_pm_id),
      (v_project.id, '100% drawings issued', 'Final CDs released', 'Completed', 'High', 'drawings_100', v_pm_id, CURRENT_DATE - 15, v_pm_id);

    -- Phase 3 tasks - IN PROGRESS (mixed based on health_status)
    IF v_project.health_status = 'At Risk' THEN
      INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
      VALUES
        (v_project.id, 'Engineering review in progress', 'Structural review feedback pending', 'In Progress', 'High', 'engineering_review', v_pm_id, CURRENT_DATE - 5, v_pm_id),
        (v_project.id, 'Resolve engineering comments', 'Address structural RFIs', 'In Progress', 'High', 'engineering_review', v_pm_id, CURRENT_DATE + 3, v_pm_id),
        (v_project.id, 'Third party review pending', 'Awaiting third party assignment', 'Not Started', 'High', 'third_party_review', v_pm_id, CURRENT_DATE + 10, v_pm_id),
        (v_project.id, 'State approval pending', 'Submit after third party', 'Not Started', 'High', 'state_approval', v_pm_id, CURRENT_DATE + 20, v_pm_id),
        (v_project.id, 'Permit submission TBD', 'After state approval', 'Not Started', 'Medium', 'permit_submission', v_pm_id, CURRENT_DATE + 25, v_pm_id),
        (v_project.id, 'Process change orders', 'COs pending approval', 'In Progress', 'High', 'change_orders', v_pm_id, CURRENT_DATE + 5, v_pm_id);
    ELSE
      INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
      VALUES
        (v_project.id, 'Engineering review complete', 'Passed structural review', 'Completed', 'High', 'engineering_review', v_pm_id, CURRENT_DATE - 10, v_pm_id),
        (v_project.id, 'Third party in progress', 'Plan review underway', 'In Progress', 'High', 'third_party_review', v_pm_id, CURRENT_DATE + 5, v_pm_id),
        (v_project.id, 'Coordinate third party comments', 'Address any review items', 'In Progress', 'Medium', 'third_party_review', v_pm_id, CURRENT_DATE + 7, v_pm_id),
        (v_project.id, 'State approval pending', 'Submit after third party', 'Not Started', 'High', 'state_approval', v_pm_id, CURRENT_DATE + 15, v_pm_id),
        (v_project.id, 'Permit submission scheduled', 'Ready to submit after state', 'Not Started', 'Medium', 'permit_submission', v_pm_id, CURRENT_DATE + 20, v_pm_id),
        (v_project.id, 'Change order tracking', 'COs on track', 'In Progress', 'Medium', 'change_orders', v_pm_id, CURRENT_DATE + 10, v_pm_id);
    END IF;

    -- Phase 4 tasks - NOT STARTED
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Production release pending', 'Awaiting approvals completion', 'Not Started', 'High', 'production_start', v_pm_id, CURRENT_DATE + 30, v_pm_id),
      (v_project.id, 'QC plan development', 'Define inspection requirements', 'Not Started', 'Medium', 'qc_inspection', v_pm_id, CURRENT_DATE + 40, v_pm_id),
      (v_project.id, 'Delivery planning', 'Logistics coordination', 'Not Started', 'Medium', 'delivery_scheduled', v_pm_id, CURRENT_DATE + 50, v_pm_id);
  END LOOP;

  -- =========================================================================
  -- PHASE 2 PROJECTS (Preconstruction) - Mixed progress in Phase 2
  -- =========================================================================

  FOR v_project IN
    SELECT p.id, p.project_number, p.name, p.current_phase, p.health_status, p.primary_pm_id
    FROM projects p
    WHERE p.project_number IN ('NWBS-26-004', 'PMI-26-003', 'WMEV-26-003', 'WMSO-26-003',
                               'SMM-26-002')
  LOOP
    v_pm_id := COALESCE(v_project.primary_pm_id, v_user_id);

    -- Phase 1 tasks - COMPLETE
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Sales handoff received', 'Project kick started', 'Completed', 'High', 'sales_handoff', v_pm_id, CURRENT_DATE - 30, v_pm_id),
      (v_project.id, 'Kickoff completed', 'Team aligned on scope', 'Completed', 'High', 'kickoff_meeting', v_pm_id, CURRENT_DATE - 25, v_pm_id),
      (v_project.id, 'Site survey complete', 'Site documented', 'Completed', 'Medium', 'site_survey', v_pm_id, CURRENT_DATE - 20, v_pm_id);

    -- Phase 2 tasks - MIXED PROGRESS (based on health status)
    IF v_project.health_status = 'Critical' THEN
      -- WMEV-26-003 style - blocked at 65% drawings
      INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
      VALUES
        (v_project.id, '20% drawings approved', 'Layout approved', 'Completed', 'High', 'drawings_20', v_pm_id, CURRENT_DATE - 15, v_pm_id),
        (v_project.id, '65% drawings BLOCKED', 'Dealer unresponsive - escalation needed', 'In Progress', 'High', 'drawings_65', v_pm_id, CURRENT_DATE - 5, v_pm_id),
        (v_project.id, 'Follow up with dealer on drawings', 'Multiple attempts to get feedback', 'In Progress', 'High', 'drawings_65', v_pm_id, CURRENT_DATE, v_pm_id),
        (v_project.id, 'Request color selections', 'Waiting on 65% approval first', 'Not Started', 'High', 'color_selections', v_pm_id, CURRENT_DATE + 10, v_pm_id),
        (v_project.id, 'Long lead items identification', 'Cannot order until 65% approved', 'Not Started', 'High', 'long_lead_items', v_pm_id, CURRENT_DATE + 15, v_pm_id),
        (v_project.id, 'Cutsheet submittals', 'Blocked by drawing approval', 'Not Started', 'Medium', 'cutsheets', v_pm_id, CURRENT_DATE + 20, v_pm_id),
        (v_project.id, '95% drawings', 'Pending 65% completion', 'Not Started', 'High', 'drawings_95', v_pm_id, CURRENT_DATE + 30, v_pm_id),
        (v_project.id, '100% drawings', 'Pending earlier phases', 'Not Started', 'High', 'drawings_100', v_pm_id, CURRENT_DATE + 40, v_pm_id);
    ELSE
      -- Normal Phase 2 progress - past 65%, working on parallel items
      INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
      VALUES
        (v_project.id, '20% drawings approved', 'Layout confirmed', 'Completed', 'High', 'drawings_20', v_pm_id, CURRENT_DATE - 15, v_pm_id),
        (v_project.id, '65% drawings in progress', 'DD drawings under review', 'In Progress', 'High', 'drawings_65', v_pm_id, CURRENT_DATE + 5, v_pm_id),
        (v_project.id, 'Address 65% review comments', 'Incorporate dealer feedback', 'In Progress', 'High', 'drawings_65', v_pm_id, CURRENT_DATE + 7, v_pm_id),
        (v_project.id, 'Color selections in progress', 'Dealer selecting finishes', 'In Progress', 'High', 'color_selections', v_pm_id, CURRENT_DATE + 10, v_pm_id),
        (v_project.id, 'Long lead items quoted', 'Getting vendor quotes', 'In Progress', 'High', 'long_lead_items', v_pm_id, CURRENT_DATE + 12, v_pm_id),
        (v_project.id, 'Cutsheet submittals started', 'Equipment data gathering', 'In Progress', 'Medium', 'cutsheets', v_pm_id, CURRENT_DATE + 15, v_pm_id),
        (v_project.id, '95% drawings not started', 'After 65% approval', 'Not Started', 'High', 'drawings_95', v_pm_id, CURRENT_DATE + 25, v_pm_id),
        (v_project.id, '100% drawings pending', 'Final phase of drawings', 'Not Started', 'High', 'drawings_100', v_pm_id, CURRENT_DATE + 35, v_pm_id);
    END IF;

    -- Phase 3 & 4 tasks - NOT STARTED
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Engineering review TBD', 'After 100% drawings', 'Not Started', 'High', 'engineering_review', v_pm_id, CURRENT_DATE + 45, v_pm_id),
      (v_project.id, 'Third party review TBD', 'After engineering', 'Not Started', 'High', 'third_party_review', v_pm_id, CURRENT_DATE + 55, v_pm_id),
      (v_project.id, 'State approval TBD', 'After third party', 'Not Started', 'High', 'state_approval', v_pm_id, CURRENT_DATE + 65, v_pm_id),
      (v_project.id, 'Production TBD', 'After all approvals', 'Not Started', 'High', 'production_start', v_pm_id, CURRENT_DATE + 80, v_pm_id);
  END LOOP;

  -- =========================================================================
  -- PHASE 1 PROJECTS (Initiation) - Just started
  -- =========================================================================

  FOR v_project IN
    SELECT p.id, p.project_number, p.name, p.current_phase, p.health_status, p.primary_pm_id
    FROM projects p
    WHERE p.project_number IN ('WMEA-26-003', 'PMI-26-004')
  LOOP
    v_pm_id := COALESCE(v_project.primary_pm_id, v_user_id);

    -- Phase 1 tasks - IN PROGRESS
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Sales handoff in progress', 'Receiving project from sales team', 'In Progress', 'High', 'sales_handoff', v_pm_id, CURRENT_DATE + 3, v_pm_id),
      (v_project.id, 'Review sales package', 'Verify scope and pricing', 'In Progress', 'High', 'sales_handoff', v_pm_id, CURRENT_DATE + 5, v_pm_id),
      (v_project.id, 'Schedule kickoff meeting', 'Coordinate with all stakeholders', 'Not Started', 'High', 'kickoff_meeting', v_pm_id, CURRENT_DATE + 10, v_pm_id),
      (v_project.id, 'Prepare kickoff materials', 'Agenda and scope review docs', 'Not Started', 'Medium', 'kickoff_meeting', v_pm_id, CURRENT_DATE + 8, v_pm_id),
      (v_project.id, 'Site survey needed', 'Schedule site visit', 'Not Started', 'Medium', 'site_survey', v_pm_id, CURRENT_DATE + 15, v_pm_id);

    -- Phase 2 tasks - NOT STARTED
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, '20% drawings TBD', 'After kickoff complete', 'Not Started', 'High', 'drawings_20', v_pm_id, CURRENT_DATE + 25, v_pm_id),
      (v_project.id, '65% drawings TBD', 'After 20% approval', 'Not Started', 'High', 'drawings_65', v_pm_id, CURRENT_DATE + 45, v_pm_id),
      (v_project.id, 'Color selections TBD', 'After 65% approval', 'Not Started', 'Medium', 'color_selections', v_pm_id, CURRENT_DATE + 50, v_pm_id),
      (v_project.id, 'Long lead items TBD', 'After 65% approval', 'Not Started', 'High', 'long_lead_items', v_pm_id, CURRENT_DATE + 50, v_pm_id);

    -- Phase 3 & 4 tasks - NOT STARTED (just one placeholder each)
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Engineering TBD', 'Future phase', 'Not Started', 'High', 'engineering_review', v_pm_id, CURRENT_DATE + 90, v_pm_id),
      (v_project.id, 'Production TBD', 'Future phase', 'Not Started', 'High', 'production_start', v_pm_id, CURRENT_DATE + 120, v_pm_id);
  END LOOP;

  -- =========================================================================
  -- NON-PM (PC/STOCK) PROJECTS - Minimal tasks
  -- =========================================================================

  FOR v_project IN
    SELECT p.id, p.project_number, p.name, p.current_phase, p.primary_pm_id
    FROM projects p
    WHERE p.project_number IN ('NWBS-26-005', 'NWBS-26-006')
  LOOP
    -- Stock jobs have simpler workflow, fewer tasks
    INSERT INTO tasks (project_id, title, description, status, priority, workflow_station_key, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Stock unit assigned', 'Unit allocated to dealer', 'Completed', 'Medium', 'sales_handoff', v_user_id, CURRENT_DATE - 10, v_user_id),
      (v_project.id, 'Production tracking', 'Monitor build progress', 'In Progress', 'Medium', 'production_start', v_user_id, CURRENT_DATE + 10, v_user_id),
      (v_project.id, 'QC inspection scheduled', 'Final inspection before release', 'Not Started', 'High', 'qc_inspection', v_user_id, CURRENT_DATE + 15, v_user_id),
      (v_project.id, 'Delivery coordination', 'Arrange transport', 'Not Started', 'Medium', 'delivery_scheduled', v_user_id, CURRENT_DATE + 20, v_user_id);
  END LOOP;

  RAISE NOTICE 'Part 2 Complete: Created workflow-linked tasks for all demo projects';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check client names are dealers
SELECT 'Dealer/Client Names:' AS check_type;
SELECT project_number, name AS project_name, client_name AS dealer
FROM projects
WHERE project_number LIKE '%-26-%'
ORDER BY factory, project_number;

-- Check task distribution by workflow station
SELECT 'Tasks by Workflow Station:' AS check_type;
SELECT
  workflow_station_key,
  COUNT(*) as task_count,
  SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
  SUM(CASE WHEN status = 'Not Started' THEN 1 ELSE 0 END) as not_started
FROM tasks
WHERE project_id IN (SELECT id FROM projects WHERE project_number LIKE '%-26-%')
  AND workflow_station_key IS NOT NULL
GROUP BY workflow_station_key
ORDER BY workflow_station_key;

-- Check tasks per project
SELECT 'Tasks per Project:' AS check_type;
SELECT
  p.project_number,
  p.current_phase,
  COUNT(t.id) as total_tasks,
  SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
  SUM(CASE WHEN t.status = 'Not Started' THEN 1 ELSE 0 END) as not_started
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id AND t.workflow_station_key IS NOT NULL
WHERE p.project_number LIKE '%-26-%'
GROUP BY p.project_number, p.current_phase
ORDER BY p.current_phase DESC, p.project_number;

SELECT 'Fix complete! Refresh the workflow canvas to see station progress.' AS status;
