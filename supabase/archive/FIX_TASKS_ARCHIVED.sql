-- ============================================================================
-- FIX_TASKS.sql - Regenerate tasks, RFIs, submittals for existing projects
-- ============================================================================
-- Run this AFTER MASTER_DEMO_DATA.sql if tasks are missing
-- This is a standalone fix that only generates the project data

-- First, show current counts
SELECT 'BEFORE - Projects:' AS status, COUNT(*)::TEXT AS count FROM projects
UNION ALL SELECT 'BEFORE - Tasks:', COUNT(*)::TEXT FROM tasks
UNION ALL SELECT 'BEFORE - RFIs:', COUNT(*)::TEXT FROM rfis
UNION ALL SELECT 'BEFORE - Submittals:', COUNT(*)::TEXT FROM submittals;

-- Clear existing data (in case of partial inserts)
TRUNCATE tasks CASCADE;
TRUNCATE rfis CASCADE;
TRUNCATE submittals CASCADE;
TRUNCATE milestones CASCADE;

-- Generate tasks for each project
DO $$
DECLARE
  v_project RECORD;
  v_pm_id UUID;
  v_phase INTEGER;
  v_project_count INTEGER := 0;
  v_task_count INTEGER := 0;
  v_start_date DATE;
  v_target_date DATE;
BEGIN
  -- First ensure we have at least one user
  SELECT id INTO v_pm_id FROM users LIMIT 1;
  IF v_pm_id IS NULL THEN
    RAISE EXCEPTION 'No users found! Cannot create tasks without a user.';
  END IF;
  RAISE NOTICE 'Using default PM ID: %', v_pm_id;

  FOR v_project IN SELECT * FROM projects ORDER BY current_phase, created_at LOOP
    v_project_count := v_project_count + 1;

    -- Use project's PM or fallback
    IF v_project.primary_pm_id IS NOT NULL THEN
      v_pm_id := v_project.primary_pm_id;
    END IF;

    v_phase := COALESCE(v_project.current_phase, 1);
    v_start_date := COALESCE(v_project.start_date, CURRENT_DATE - INTERVAL '30 days');
    v_target_date := COALESCE(v_project.target_online_date, CURRENT_DATE + INTERVAL '90 days');

    RAISE NOTICE 'Processing project %: % (Phase %, PM: %)', v_project_count, v_project.project_number, v_phase, v_pm_id;

    -- ======================================================================
    -- TASKS: Phase-appropriate with prereqs completed
    -- ======================================================================

    -- Phase 1 Tasks (Always created)
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
    VALUES (v_project.id, 'Complete Sales Handoff', 'Review sales documentation and complete handoff checklist',
      CASE WHEN v_phase >= 1 THEN 'Completed' ELSE 'Not Started' END, 'High',
      v_start_date + INTERVAL '3 days', v_pm_id, v_pm_id, 'pm', 'sales_handoff', NOW());
    v_task_count := v_task_count + 1;

    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
    VALUES (v_project.id, 'Schedule Kickoff Meeting', 'Coordinate internal kickoff meeting with all stakeholders',
      CASE WHEN v_phase > 1 THEN 'Completed' WHEN v_phase = 1 THEN 'In Progress' ELSE 'Not Started' END, 'High',
      v_start_date + INTERVAL '7 days', v_pm_id, v_pm_id, 'pm', 'kickoff_meeting', NOW());
    v_task_count := v_task_count + 1;

    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
    VALUES (v_project.id, 'Complete Site Survey', 'Conduct site visit and document conditions',
      CASE WHEN v_phase > 1 THEN 'Completed' WHEN v_phase = 1 THEN 'Not Started' ELSE 'Not Started' END, 'Medium',
      v_start_date + INTERVAL '14 days', v_pm_id, v_pm_id, 'pm', 'site_survey', NOW());
    v_task_count := v_task_count + 1;

    -- Phase 2 Tasks
    IF v_phase >= 2 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Review 20% Drawings', 'Review preliminary layout drawings and provide feedback',
        'Completed', 'High',
        v_start_date + INTERVAL '21 days', v_pm_id, v_pm_id, 'drafting', 'drawings_20', NOW());
      v_task_count := v_task_count + 1;

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Review 65% Drawings', 'Design development review with dealer',
        CASE WHEN v_phase > 2 THEN 'Completed' ELSE 'In Progress' END, 'High',
        v_start_date + INTERVAL '35 days', v_pm_id, v_pm_id, 'drafting', 'drawings_65', NOW());
      v_task_count := v_task_count + 1;

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Review 95% Drawings', 'Near-final construction documents review',
        CASE WHEN v_phase > 2 THEN 'Completed' ELSE 'Not Started' END, 'High',
        v_start_date + INTERVAL '49 days', v_pm_id, v_pm_id, 'drafting', 'drawings_95', NOW());
      v_task_count := v_task_count + 1;

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Confirm Color Selections', 'Get dealer confirmation on all color and finish selections',
        CASE WHEN v_phase > 2 THEN 'Completed' ELSE 'Awaiting Response' END, 'Medium',
        v_start_date + INTERVAL '45 days', v_pm_id, v_pm_id, 'dealer', 'color_selections', NOW());
      v_task_count := v_task_count + 1;

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Order Long Lead Items', 'Identify and order equipment with extended lead times',
        CASE WHEN v_phase > 2 THEN 'Completed' ELSE 'In Progress' END, 'High',
        v_start_date + INTERVAL '30 days', v_pm_id, v_pm_id, 'procurement', 'long_lead_items', NOW());
      v_task_count := v_task_count + 1;
    END IF;

    -- Phase 3 Tasks
    IF v_phase >= 3 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Complete Engineering Review', 'Internal engineering review and stamp',
        CASE WHEN v_phase > 3 THEN 'Completed' ELSE 'In Progress' END, 'High',
        v_start_date + INTERVAL '70 days', v_pm_id, v_pm_id, 'engineering', 'engineering_review', NOW());
      v_task_count := v_task_count + 1;

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Third Party Plan Review', 'Submit for third party review if required',
        CASE WHEN v_phase > 3 THEN 'Completed' ELSE 'In Progress' END, 'Medium',
        v_start_date + INTERVAL '80 days', v_pm_id, v_pm_id, 'third_party', 'third_party_review', NOW());
      v_task_count := v_task_count + 1;

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Obtain State Approval', 'State modular approval process',
        CASE WHEN v_phase > 3 THEN 'Completed' ELSE 'Awaiting Response' END, 'High',
        v_start_date + INTERVAL '85 days', v_pm_id, v_pm_id, 'state', 'state_approval', NOW());
      v_task_count := v_task_count + 1;

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Submit Building Permits', 'Prepare and submit building permit application',
        CASE WHEN v_phase > 3 THEN 'Completed' ELSE 'In Progress' END, 'High',
        v_target_date - INTERVAL '90 days', v_pm_id, v_pm_id, 'pm', 'permit_submission', NOW());
      v_task_count := v_task_count + 1;
    END IF;

    -- Phase 4 Tasks
    IF v_phase >= 4 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Begin Production', 'Factory production kickoff',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'In Progress' END, 'High',
        v_target_date - INTERVAL '60 days', v_pm_id, v_pm_id, 'factory', 'production_start', NOW());
      v_task_count := v_task_count + 1;

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Quality Control Inspection', 'Factory QC inspection before shipping',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, 'High',
        v_target_date - INTERVAL '30 days', v_pm_id, v_pm_id, 'factory', 'qc_inspection', NOW());
      v_task_count := v_task_count + 1;

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Schedule Delivery', 'Confirm delivery date and logistics',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'In Progress' END, 'High',
        v_target_date - INTERVAL '21 days', v_pm_id, v_pm_id, 'pm', 'delivery_scheduled', NOW());
      v_task_count := v_task_count + 1;

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Project Closeout', 'Final documentation and project closeout',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, 'Medium',
        v_target_date, v_pm_id, v_pm_id, 'pm', 'project_closeout', NOW());
      v_task_count := v_task_count + 1;
    END IF;

    -- ======================================================================
    -- RFIs: Correct schema with all required fields
    -- Required: rfi_number, number, subject, question, status, priority, sent_to, is_external, created_by
    -- ======================================================================
    INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
    VALUES (v_project.id, v_project.project_number || '-RFI-001', 1, 'Site Access Clarification',
      'Please clarify the site access route for delivery vehicles. The preliminary survey shows potential issues with overhead clearance.',
      CASE WHEN v_phase >= 3 THEN 'Access from the north entrance via Industrial Blvd. Max height clearance is 14ft.' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN 'Closed' WHEN v_phase = 2 THEN 'Open' ELSE 'Draft' END, 'Medium',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '10 days' ELSE NULL END,
      v_start_date + INTERVAL '17 days', true, COALESCE(v_project.client_name, 'Client'), v_pm_id, NOW());

    INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
    VALUES (v_project.id, v_project.project_number || '-RFI-002', 2, 'Electrical Panel Location',
      'Drawing sheet E-101 shows the main electrical panel in a location that conflicts with the mechanical room layout. Please advise.',
      CASE WHEN v_phase >= 2 AND v_project.health_status != 'Critical' THEN 'Relocate electrical panel to west wall of mechanical room.' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN 'Closed' WHEN v_phase = 2 AND v_project.health_status = 'Critical' THEN 'Open' WHEN v_phase = 2 THEN 'Answered' ELSE 'Draft' END, 'High',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '25 days' ELSE NULL END,
      v_start_date + INTERVAL '32 days', true, COALESCE(v_project.client_name, 'Client'), v_pm_id, NOW());

    INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
    VALUES (v_project.id, v_project.project_number || '-RFI-003', 3, 'Flooring Material Substitution',
      'Specified flooring material has 12-week lead time. Can we substitute with equivalent product available in 4 weeks?',
      CASE WHEN v_phase >= 3 THEN 'Approved. Armstrong Imperial Texture in matching color is acceptable.' ELSE NULL END,
      CASE WHEN v_phase >= 4 THEN 'Closed' WHEN v_phase = 3 THEN 'Answered' WHEN v_phase = 2 THEN 'Open' ELSE 'Draft' END, 'Medium',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
      v_start_date + INTERVAL '47 days', true, COALESCE(v_project.client_name, 'Client'), v_pm_id, NOW());

    -- ======================================================================
    -- SUBMITTALS: Correct schema with all required fields
    -- Required: submittal_number, title, submittal_type, status, manufacturer, model_number
    -- ======================================================================
    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (v_project.id, v_project.project_number || '-SUB-001', 'HVAC Package Unit', 'Product Data',
      CASE WHEN v_phase >= 3 THEN 'Approved' WHEN v_phase = 2 THEN 'Under Review' ELSE 'Draft' END,
      'Carrier', '50XC-024',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '37 days' ELSE NULL END, NOW());

    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (v_project.id, v_project.project_number || '-SUB-002', 'Main Electrical Panel', 'Shop Drawings',
      CASE WHEN v_phase >= 3 THEN 'Approved' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Draft' END,
      'Square D', 'QO130L200PG',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '35 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '42 days' ELSE NULL END, NOW());

    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (v_project.id, v_project.project_number || '-SUB-003', 'LVT Flooring', 'Samples',
      CASE WHEN v_phase >= 4 THEN 'Approved' WHEN v_phase = 3 THEN 'Approved as Noted' WHEN v_phase = 2 THEN 'Under Review' ELSE 'Draft' END,
      'Shaw Contract', 'Crete II',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '50 days' ELSE NULL END, NOW());

    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (v_project.id, v_project.project_number || '-SUB-004', 'Aluminum Windows', 'Shop Drawings',
      CASE WHEN v_phase >= 4 THEN 'Approved' WHEN v_phase >= 3 THEN 'Approved' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Draft' END,
      'Milgard', 'Style Line Series',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '45 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '55 days' ELSE NULL END, NOW());

    -- ======================================================================
    -- MILESTONES (uses 'name' column, not 'title')
    -- ======================================================================
    INSERT INTO milestones (project_id, name, due_date, status, created_at)
    VALUES
      (v_project.id, 'Sales Handoff Complete', v_start_date + INTERVAL '7 days',
       CASE WHEN v_phase >= 1 THEN 'Completed' ELSE 'Not Started' END, NOW()),
      (v_project.id, '65% Drawings Approved', v_start_date + INTERVAL '45 days',
       CASE WHEN v_phase >= 3 THEN 'Completed' WHEN v_phase = 2 THEN 'In Progress' ELSE 'Not Started' END, NOW()),
      (v_project.id, 'Engineering Stamp Received', v_start_date + INTERVAL '75 days',
       CASE WHEN v_phase >= 4 THEN 'Completed' WHEN v_phase = 3 THEN 'In Progress' ELSE 'Not Started' END, NOW()),
      (v_project.id, 'Production Start', v_target_date - INTERVAL '60 days',
       CASE WHEN v_phase = 4 AND v_project.status != 'Complete' THEN 'In Progress' WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, NOW()),
      (v_project.id, 'Delivery Complete', v_target_date - INTERVAL '14 days',
       CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, NOW()),
      (v_project.id, 'Project Closeout', v_target_date,
       CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, NOW());

  END LOOP;

  RAISE NOTICE 'SUCCESS: Generated data for % projects, % tasks created', v_project_count, v_task_count;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: % - %', SQLERRM, SQLSTATE;
  RAISE;
END $$;

-- Show final counts
SELECT 'AFTER - Projects:' AS status, COUNT(*)::TEXT AS count FROM projects
UNION ALL SELECT 'AFTER - Tasks:', COUNT(*)::TEXT FROM tasks
UNION ALL SELECT 'AFTER - RFIs:', COUNT(*)::TEXT FROM rfis
UNION ALL SELECT 'AFTER - Submittals:', COUNT(*)::TEXT FROM submittals
UNION ALL SELECT 'AFTER - Milestones:', COUNT(*)::TEXT FROM milestones;

-- Show sample data
SELECT 'Sample tasks created:' AS info;
SELECT id, project_id, title, status FROM tasks LIMIT 5;
