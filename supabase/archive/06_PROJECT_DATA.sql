-- ============================================================================
-- STEP 6: GENERATE PROJECT DATA
-- ============================================================================
-- Creates phase-appropriate data for each project:
-- - Tasks (linked to workflow stations, prereqs completed)
-- - RFIs (3-4 per project)
-- - Submittals (3-4 per project)
-- - Change Orders (1-2 per project)
-- - Long Lead Items (all projects)
-- - Color Selections (all projects)
-- - Milestones (4-6 per project)
--
-- IMPORTANT: This script REQUIRES that projects exist first (run 05_IMPORT_PROJECTS.sql)
--
-- Created: January 13, 2026
-- Updated: January 14, 2026 - Fixed to work without user assignments
-- ============================================================================

-- First, verify we have projects
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM projects;
  IF v_count = 0 THEN
    RAISE EXCEPTION 'No projects found! Please run 05_IMPORT_PROJECTS.sql first.';
  END IF;
  RAISE NOTICE 'Found % projects to generate data for', v_count;
END $$;

-- ============================================================================
-- GENERATE DATA FOR EACH PROJECT
-- ============================================================================
DO $$
DECLARE
  v_project RECORD;
  v_pm_id UUID;
  v_phase INTEGER;
  v_project_count INTEGER := 0;
  v_start_date DATE;
  v_target_date DATE;
BEGIN
  -- Loop through all projects
  FOR v_project IN SELECT * FROM projects ORDER BY current_phase, created_at LOOP
    v_project_count := v_project_count + 1;

    -- Try to get PM, but allow NULL if no users exist
    v_pm_id := v_project.primary_pm_id;
    IF v_pm_id IS NULL THEN
      SELECT id INTO v_pm_id FROM users LIMIT 1;
      -- v_pm_id can still be NULL if no users exist - that's OK
    END IF;

    v_phase := COALESCE(v_project.current_phase, 1);

    -- Default dates for date arithmetic (prevents NULL date errors)
    v_start_date := COALESCE(v_project.start_date, CURRENT_DATE - INTERVAL '30 days');
    v_target_date := COALESCE(v_project.target_online_date, CURRENT_DATE + INTERVAL '90 days');

    -- ======================================================================
    -- TASKS: Phase-appropriate with prereqs completed
    -- ======================================================================

    -- Phase 1 Tasks (Always created)
    -- Task: Sales Handoff
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
    VALUES (
      v_project.id,
      'Complete Sales Handoff',
      'Review sales documentation and complete handoff checklist',
      CASE WHEN v_phase >= 1 THEN 'Completed' ELSE 'Not Started' END,
      'High',
      v_start_date + INTERVAL '3 days',
      v_pm_id,
      v_pm_id,
      'pm',
      'sales_handoff',
      NOW()
    );

    -- Task: Kickoff Meeting
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
    VALUES (
      v_project.id,
      'Schedule Kickoff Meeting',
      'Coordinate internal kickoff meeting with all stakeholders',
      CASE
        WHEN v_phase > 1 THEN 'Completed'
        WHEN v_phase = 1 THEN 'In Progress'
        ELSE 'Not Started'
      END,
      'High',
      v_start_date + INTERVAL '7 days',
      v_pm_id,
      v_pm_id,
      'pm',
      'kickoff_meeting',
      NOW()
    );

    -- Task: Site Survey
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
    VALUES (
      v_project.id,
      'Complete Site Survey',
      'Conduct site visit and document conditions',
      CASE
        WHEN v_phase > 1 THEN 'Completed'
        WHEN v_phase = 1 THEN 'Not Started'
        ELSE 'Not Started'
      END,
      'Medium',
      v_start_date + INTERVAL '14 days',
      v_pm_id,
      v_pm_id,
      'pm',
      'site_survey',
      NOW()
    );

    -- Phase 2 Tasks (Created for phase 2+)
    IF v_phase >= 2 THEN
      -- 20% Drawings
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Review 20% Drawings',
        'Review preliminary layout drawings and provide feedback',
        CASE WHEN v_phase > 2 OR (v_phase = 2 AND v_project.health_status != 'Critical') THEN 'Completed' ELSE 'Completed' END,
        'High',
        v_start_date + INTERVAL '21 days',
        v_pm_id,
        v_pm_id,
        'drafting',
        'drawings_20',
        NOW()
      );

      -- 65% Drawings
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Review 65% Drawings',
        'Design development review with dealer',
        CASE
          WHEN v_phase > 2 THEN 'Completed'
          WHEN v_phase = 2 AND v_project.project_number IN ('SMM-21003', 'SSI-7669', 'SSI-7670') THEN 'Completed'
          WHEN v_phase = 2 THEN 'In Progress'
          ELSE 'Not Started'
        END,
        'High',
        v_start_date + INTERVAL '35 days',
        v_pm_id,
        v_pm_id,
        'drafting',
        'drawings_65',
        NOW()
      );

      -- 95% Drawings
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Review 95% Drawings',
        'Near-final construction documents review',
        CASE
          WHEN v_phase > 2 THEN 'Completed'
          WHEN v_phase = 2 AND v_project.project_number = 'SMM-21003' THEN 'Awaiting Response'
          WHEN v_phase = 2 AND v_project.project_number IN ('SSI-7669', 'SSI-7670') THEN 'In Progress'
          ELSE 'Not Started'
        END,
        'High',
        v_start_date + INTERVAL '49 days',
        v_pm_id,
        v_pm_id,
        'drafting',
        'drawings_95',
        NOW()
      );

      -- 100% Drawings
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Finalize 100% Drawings',
        'Final construction documents approval',
        CASE WHEN v_phase > 2 THEN 'Completed' ELSE 'Not Started' END,
        'High',
        v_start_date + INTERVAL '63 days',
        v_pm_id,
        v_pm_id,
        'drafting',
        'drawings_100',
        NOW()
      );

      -- Color Selections
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Confirm Color Selections',
        'Get dealer confirmation on all color and finish selections',
        CASE
          WHEN v_phase > 2 THEN 'Completed'
          WHEN v_phase = 2 AND v_project.project_number IN ('SMM-21056', 'SMM-21057') THEN 'Awaiting Response'
          ELSE 'Not Started'
        END,
        'Medium',
        v_start_date + INTERVAL '45 days',
        v_pm_id,
        v_pm_id,
        'dealer',
        'color_selections',
        NOW()
      );

      -- Long Lead Items
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Order Long Lead Items',
        'Identify and order equipment with extended lead times',
        CASE
          WHEN v_phase > 2 THEN 'Completed'
          WHEN v_phase = 2 AND v_project.project_number IN ('SMM-21055', 'SME-23038') THEN 'In Progress'
          ELSE 'Not Started'
        END,
        'High',
        v_start_date + INTERVAL '30 days',
        v_pm_id,
        v_pm_id,
        'procurement',
        'long_lead_items',
        NOW()
      );

      -- Cutsheets
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Submit Cutsheets for Approval',
        'Get dealer approval on equipment cutsheets',
        CASE
          WHEN v_phase > 2 THEN 'Completed'
          WHEN v_phase = 2 AND v_project.project_number = 'SMM-21057' THEN 'In Progress'
          ELSE 'Not Started'
        END,
        'Medium',
        v_start_date + INTERVAL '50 days',
        v_pm_id,
        v_pm_id,
        'dealer',
        'cutsheets',
        NOW()
      );
    END IF;

    -- Phase 3 Tasks (Created for phase 3+)
    IF v_phase >= 3 THEN
      -- Engineering Review
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Complete Engineering Review',
        'Internal engineering review and stamp',
        CASE
          WHEN v_phase > 3 THEN 'Completed'
          WHEN v_phase = 3 AND v_project.project_number = 'SSI-7671' THEN 'In Progress'
          ELSE 'Completed'
        END,
        'High',
        v_start_date + INTERVAL '70 days',
        v_pm_id,
        v_pm_id,
        'engineering',
        'engineering_review',
        NOW()
      );

      -- Third Party Review
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Third Party Plan Review',
        'Submit for third party review if required',
        CASE
          WHEN v_phase > 3 THEN 'Completed'
          WHEN v_phase = 3 AND v_project.project_number = 'SSI-7672' THEN 'In Progress'
          ELSE 'Completed'
        END,
        'Medium',
        v_start_date + INTERVAL '80 days',
        v_pm_id,
        v_pm_id,
        'third_party',
        'third_party_review',
        NOW()
      );

      -- State Approval
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Obtain State Approval',
        'State modular approval process',
        CASE
          WHEN v_phase > 3 THEN 'Completed'
          WHEN v_phase = 3 AND v_project.project_number = 'SMM-21020' THEN 'Awaiting Response'
          ELSE 'Completed'
        END,
        'High',
        v_start_date + INTERVAL '85 days',
        v_pm_id,
        v_pm_id,
        'state',
        'state_approval',
        NOW()
      );

      -- Permit Submission
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Submit Building Permits',
        'Prepare and submit building permit application',
        CASE
          WHEN v_phase > 3 THEN 'Completed'
          WHEN v_phase = 3 THEN 'In Progress'
          ELSE 'Not Started'
        END,
        'High',
        v_target_date - INTERVAL '90 days',
        v_pm_id,
        v_pm_id,
        'pm',
        'permit_submission',
        NOW()
      );

      -- Change Orders
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Process Change Orders',
        'Process any pending change orders',
        CASE
          WHEN v_phase > 3 THEN 'Completed'
          WHEN v_phase = 3 AND v_project.project_number = 'SSI-7547' THEN 'In Progress'
          ELSE 'Not Started'
        END,
        'Medium',
        v_start_date + INTERVAL '75 days',
        v_pm_id,
        v_pm_id,
        'pm',
        'change_orders',
        NOW()
      );
    END IF;

    -- Phase 4 Tasks (Created for phase 4)
    IF v_phase >= 4 THEN
      -- Production Start
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Begin Production',
        'Factory production kickoff',
        CASE
          WHEN v_project.status = 'Complete' THEN 'Completed'
          WHEN v_project.project_number = 'SMM-21054' THEN 'In Progress'
          ELSE 'Completed'
        END,
        'High',
        v_target_date - INTERVAL '60 days',
        v_pm_id,
        v_pm_id,
        'factory',
        'production_start',
        NOW()
      );

      -- QC Inspection
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Quality Control Inspection',
        'Factory QC inspection before shipping',
        CASE
          WHEN v_project.status = 'Complete' THEN 'Completed'
          WHEN v_project.project_number = '25B579-584' THEN 'In Progress'
          ELSE 'Completed'
        END,
        'High',
        v_target_date - INTERVAL '30 days',
        v_pm_id,
        v_pm_id,
        'factory',
        'qc_inspection',
        NOW()
      );

      -- Delivery Scheduled
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Schedule Delivery',
        'Confirm delivery date and logistics',
        CASE
          WHEN v_project.status = 'Complete' THEN 'Completed'
          WHEN v_project.project_number = 'PMI-6749-6763' THEN 'In Progress'
          ELSE 'Completed'
        END,
        'High',
        v_target_date - INTERVAL '21 days',
        v_pm_id,
        v_pm_id,
        'pm',
        'delivery_scheduled',
        NOW()
      );

      -- Delivery Complete
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Confirm Delivery Complete',
        'Units delivered to site',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END,
        'High',
        v_target_date - INTERVAL '14 days',
        v_pm_id,
        v_pm_id,
        'pm',
        'delivery_complete',
        NOW()
      );

      -- Set Complete
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Complete Set Installation',
        'Units set on foundation',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END,
        'High',
        v_target_date - INTERVAL '7 days',
        v_pm_id,
        v_pm_id,
        'pm',
        'set_complete',
        NOW()
      );

      -- Project Closeout
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Project Closeout',
        'Final documentation and project closeout',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END,
        'Medium',
        v_target_date,
        v_pm_id,
        v_pm_id,
        'pm',
        'project_closeout',
        NOW()
      );
    END IF;

    -- Critical project overdue task
    IF v_project.health_status = 'Critical' THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, created_at)
      VALUES (
        v_project.id,
        'URGENT: Resolve Schedule Delays',
        'Address critical path delays and develop recovery plan',
        'In Progress',
        'Critical',
        CURRENT_DATE - INTERVAL '5 days',
        v_pm_id,
        v_pm_id,
        'pm',
        NOW()
      );
    END IF;

    -- At Risk project task
    IF v_project.health_status = 'At Risk' THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, created_at)
      VALUES (
        v_project.id,
        'Schedule Recovery Meeting',
        'Meet with team to discuss schedule recovery options',
        'Awaiting Response',
        'High',
        CURRENT_DATE + INTERVAL '3 days',
        v_pm_id,
        v_pm_id,
        'pm',
        NOW()
      );
    END IF;

    -- ======================================================================
    -- RFIs: 3-4 per project
    -- ======================================================================

    -- RFI 1: Site Conditions
    INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-RFI-001',
      1,
      'Site Access Clarification',
      'Please clarify the site access route for delivery vehicles. The preliminary survey shows potential issues with overhead clearance on the main access road.',
      CASE WHEN v_phase >= 3 THEN 'Access from the north entrance via Industrial Blvd. Max height clearance is 14ft. Recommend escort vehicle for oversize loads.' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN 'Closed' WHEN v_phase = 2 THEN 'Open' ELSE 'Draft' END,
      'Medium',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '10 days' ELSE NULL END,
      v_start_date + INTERVAL '17 days',
      true,
      v_project.client_name,
      v_pm_id,
      NOW()
    );

    -- RFI 2: Technical Question
    INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-RFI-002',
      2,
      'Electrical Panel Location',
      'Drawing sheet E-101 shows the main electrical panel in a location that conflicts with the mechanical room layout. Please advise on preferred location.',
      CASE WHEN v_phase >= 2 AND v_project.health_status != 'Critical' THEN 'Relocate electrical panel to west wall of mechanical room. Updated drawings to follow.' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN 'Closed' WHEN v_phase = 2 AND v_project.health_status = 'Critical' THEN 'Open' WHEN v_phase = 2 THEN 'Answered' ELSE 'Draft' END,
      'High',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '25 days' ELSE NULL END,
      v_start_date + INTERVAL '32 days',
      true,
      v_project.client_name,
      v_pm_id,
      NOW()
    );

    -- RFI 3: Material Question
    INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-RFI-003',
      3,
      'Flooring Material Substitution',
      'Specified flooring material (Shaw Contract LVT) has 12-week lead time. Can we substitute with equivalent Armstrong product available in 4 weeks?',
      CASE WHEN v_phase >= 3 THEN 'Approved. Armstrong Imperial Texture in matching color is acceptable.' ELSE NULL END,
      CASE WHEN v_phase >= 4 THEN 'Closed' WHEN v_phase = 3 THEN 'Answered' WHEN v_phase = 2 THEN 'Pending' ELSE 'Draft' END,
      'Medium',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
      v_start_date + INTERVAL '47 days',
      true,
      v_project.client_name,
      v_pm_id,
      NOW()
    );

    -- RFI 4: Urgent RFI for critical projects
    IF v_project.health_status IN ('Critical', 'At Risk') THEN
      INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
      VALUES (
        v_project.id,
        v_project.project_number || '-RFI-004',
        4,
        'URGENT: Drawing Approval Required',
        'We need immediate approval on the 95% drawings to maintain the production schedule. Current delay is impacting delivery timeline.',
        NULL,
        'Open',
        'Critical',
        CURRENT_DATE - INTERVAL '3 days',
        CURRENT_DATE - INTERVAL '1 day',
        true,
        v_project.client_name,
        v_pm_id,
        NOW()
      );
    ELSE
      -- Regular RFI 4
      INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
      VALUES (
        v_project.id,
        v_project.project_number || '-RFI-004',
        4,
        'HVAC Ductwork Routing',
        'Please confirm the preferred routing for main HVAC ductwork in the ceiling plenum. Two options presented in Sketch SK-M01.',
        CASE WHEN v_phase >= 3 THEN 'Option A approved - route along north wall to avoid conflict with structural beams.' ELSE NULL END,
        CASE WHEN v_phase >= 4 THEN 'Closed' WHEN v_phase >= 3 THEN 'Answered' ELSE 'Draft' END,
        'Medium',
        CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '55 days' ELSE NULL END,
        v_start_date + INTERVAL '62 days',
        false,
        'Engineering Team',
        v_pm_id,
        NOW()
      );
    END IF;

    -- ======================================================================
    -- SUBMITTALS: 3-4 per project
    -- ======================================================================

    -- Submittal 1: HVAC Equipment
    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-SUB-001',
      'HVAC Package Unit',
      'Product Data',
      CASE WHEN v_phase >= 3 THEN 'Approved' WHEN v_phase = 2 THEN 'Under Review' ELSE 'Draft' END,
      'Carrier',
      '50XC-024',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '37 days' ELSE NULL END,
      NOW()
    );

    -- Submittal 2: Electrical Panel
    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-SUB-002',
      'Main Electrical Panel',
      'Shop Drawings',
      CASE WHEN v_phase >= 3 THEN 'Approved' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Draft' END,
      'Square D',
      'QO130L200PG',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '35 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '42 days' ELSE NULL END,
      NOW()
    );

    -- Submittal 3: Flooring
    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-SUB-003',
      'LVT Flooring',
      'Samples',
      CASE WHEN v_phase >= 4 THEN 'Approved' WHEN v_phase = 3 THEN 'Approved as Noted' WHEN v_phase = 2 THEN 'Under Review' ELSE 'Draft' END,
      'Shaw Contract',
      'Crete II',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '50 days' ELSE NULL END,
      NOW()
    );

    -- Submittal 4: Windows
    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-SUB-004',
      'Aluminum Windows',
      'Shop Drawings',
      CASE WHEN v_phase >= 4 THEN 'Approved' WHEN v_phase >= 3 THEN 'Approved' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Draft' END,
      'Milgard',
      'Style Line Series',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '45 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '55 days' ELSE NULL END,
      NOW()
    );

    -- ======================================================================
    -- MILESTONES: 4-6 per project
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

    -- ======================================================================
    -- CHANGE ORDERS: 1-2 per project (for phase 2+)
    -- ======================================================================

    IF v_phase >= 2 THEN
      -- Change Order 1
      INSERT INTO change_orders (project_id, co_number, change_order_number, status, total_amount, date, sent_date, signed_date, implemented_date, description, created_by, created_at)
      VALUES (
        v_project.id,
        1,
        v_project.project_number || '-CO-001',
        CASE WHEN v_phase >= 4 THEN 'Implemented' WHEN v_phase = 3 THEN 'Signed' WHEN v_phase = 2 THEN 'Sent' ELSE 'Draft' END,
        15000.00,
        v_start_date + INTERVAL '50 days',
        CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '52 days' ELSE NULL END,
        CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '58 days' ELSE NULL END,
        CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '65 days' ELSE NULL END,
        'Add additional electrical circuits for IT equipment',
        v_pm_id,
        NOW()
      );

      -- Add CO line items
      INSERT INTO change_order_items (change_order_id, description, quantity, unit_price, total_price, display_order)
      SELECT
        co.id,
        'Additional 20A circuits (6 total)',
        6,
        1500.00,
        9000.00,
        1
      FROM change_orders co WHERE co.project_id = v_project.id AND co.co_number = 1;

      INSERT INTO change_order_items (change_order_id, description, quantity, unit_price, total_price, display_order)
      SELECT
        co.id,
        'Conduit and wiring materials',
        1,
        4000.00,
        4000.00,
        2
      FROM change_orders co WHERE co.project_id = v_project.id AND co.co_number = 1;

      INSERT INTO change_order_items (change_order_id, description, quantity, unit_price, total_price, display_order)
      SELECT
        co.id,
        'Labor and installation',
        1,
        2000.00,
        2000.00,
        3
      FROM change_orders co WHERE co.project_id = v_project.id AND co.co_number = 1;
    END IF;

    IF v_phase >= 3 THEN
      -- Change Order 2
      INSERT INTO change_orders (project_id, co_number, change_order_number, status, total_amount, date, sent_date, signed_date, description, created_by, created_at)
      VALUES (
        v_project.id,
        2,
        v_project.project_number || '-CO-002',
        CASE WHEN v_phase >= 4 THEN 'Signed' WHEN v_phase = 3 THEN 'Sent' ELSE 'Draft' END,
        8500.00,
        v_start_date + INTERVAL '70 days',
        CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '72 days' ELSE NULL END,
        CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '78 days' ELSE NULL END,
        'Upgrade interior finishes per client request',
        v_pm_id,
        NOW()
      );

      -- Add CO line items
      INSERT INTO change_order_items (change_order_id, description, quantity, unit_price, total_price, display_order)
      SELECT
        co.id,
        'Premium LVT flooring upgrade',
        850,
        5.00,
        4250.00,
        1
      FROM change_orders co WHERE co.project_id = v_project.id AND co.co_number = 2;

      INSERT INTO change_order_items (change_order_id, description, quantity, unit_price, total_price, display_order)
      SELECT
        co.id,
        'Paint upgrade to low-VOC premium',
        1,
        2500.00,
        2500.00,
        2
      FROM change_orders co WHERE co.project_id = v_project.id AND co.co_number = 2;

      INSERT INTO change_order_items (change_order_id, description, quantity, unit_price, total_price, display_order)
      SELECT
        co.id,
        'Additional labor',
        1,
        1750.00,
        1750.00,
        3
      FROM change_orders co WHERE co.project_id = v_project.id AND co.co_number = 2;
    END IF;

    -- ======================================================================
    -- LONG LEAD ITEMS: All projects
    -- Table columns: item_name, description, manufacturer, model_number,
    -- supplier, lead_time_weeks, order_date, expected_delivery,
    -- actual_delivery, status, notes
    -- Statuses: Pending, Ordered, In Transit, Delivered, Delayed
    -- ======================================================================

    INSERT INTO long_lead_items (project_id, item_name, description, manufacturer, model_number, supplier, lead_time_weeks, order_date, expected_delivery, actual_delivery, status, notes, created_at)
    VALUES
      (v_project.id, 'HVAC Package Unit', 'Rooftop package unit for HVAC system', 'Carrier', '50XC-024', 'Ferguson', 8,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '86 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '82 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN 'Delivered' WHEN v_phase >= 3 THEN 'In Transit' WHEN v_phase >= 2 THEN 'Ordered' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN 'Cutsheet approved' ELSE NULL END, NOW()),

      (v_project.id, 'Custom Windows', 'Aluminum frame windows per spec (Qty: 12)', 'Milgard', 'Style Line 3000', 'Milgard Direct', 6,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '35 days' ELSE NULL END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '77 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '75 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN 'Delivered' WHEN v_phase >= 3 THEN 'In Transit' WHEN v_phase >= 2 THEN 'Ordered' ELSE 'Pending' END,
       NULL, NOW()),

      (v_project.id, 'Backup Generator', 'Emergency backup power system', 'Generac', 'RG02724ANAX', 'Power Systems Inc', 10,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '45 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '115 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 AND v_project.status = 'Complete' THEN v_start_date + INTERVAL '110 days' ELSE NULL END,
       CASE WHEN v_project.status = 'Complete' THEN 'Delivered' WHEN v_phase >= 4 THEN 'In Transit' WHEN v_phase >= 3 THEN 'Ordered' ELSE 'Pending' END,
       CASE WHEN v_phase >= 3 THEN 'AHJ requires specific model' ELSE NULL END, NOW()),

      (v_project.id, 'Fire Suppression System', 'Pre-engineered fire suppression', 'Victaulic', 'Vortex 500', 'Fire Safety Supply', 4,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '68 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '65 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN 'Delivered' WHEN v_phase >= 2 THEN 'Ordered' ELSE 'Pending' END,
       NULL, NOW());

    -- ======================================================================
    -- COLOR SELECTIONS: All projects
    -- Categories match ColorSelectionFormBuilder.jsx:
    -- exterior_siding, exterior_trim, roofing, interior_walls, interior_trim,
    -- flooring, cabinets, countertops, fixtures, hardware, doors, other
    -- ======================================================================

    INSERT INTO color_selections (project_id, category, item_name, color_name, color_code, manufacturer, is_non_stock, status, submitted_date, confirmed_date, created_at)
    VALUES
      (v_project.id, 'roofing', 'Metal Roof Panel', 'Charcoal Gray', 'CG-2850', 'MBCI', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '25 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '35 days' ELSE NULL END, NOW()),

      (v_project.id, 'exterior_siding', 'Exterior Siding Panel', 'Desert Tan', 'DT-4420', 'James Hardie', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '25 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '35 days' ELSE NULL END, NOW()),

      (v_project.id, 'exterior_trim', 'Window & Door Trim', 'Bright White', 'BW-100', 'Azek', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '26 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '36 days' ELSE NULL END, NOW()),

      (v_project.id, 'flooring', 'LVT Flooring', 'Warm Oak', 'WO-1122', 'Shaw Contract', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '40 days' ELSE NULL END, NOW()),

      (v_project.id, 'interior_walls', 'Wall Paint', 'Swiss Coffee', 'OC-45', 'Benjamin Moore', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '38 days' ELSE NULL END, NOW()),

      (v_project.id, 'interior_trim', 'Baseboards & Casings', 'Simply White', 'SW-7000', 'Sherwin-Williams', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Pending' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '38 days' ELSE NULL END, NOW()),

      (v_project.id, 'doors', 'Interior Doors', 'White Primer', 'WP-100', 'Masonite', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '28 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '36 days' ELSE NULL END, NOW()),

      (v_project.id, 'cabinets', 'Kitchen Cabinets', 'Shaker White', 'SW-CAB', 'KraftMaid', false,
       CASE WHEN v_phase >= 4 THEN 'Confirmed' WHEN v_phase >= 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '32 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '48 days' ELSE NULL END, NOW()),

      (v_project.id, 'countertops', 'Laminate Counter', 'Calcutta Marble', 'CM-990', 'Wilsonart', true,
       CASE WHEN v_phase >= 4 THEN 'Confirmed' WHEN v_phase >= 2 THEN 'Pending' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '32 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '50 days' ELSE NULL END, NOW()),

      (v_project.id, 'fixtures', 'Plumbing Fixtures', 'Brushed Nickel', 'BN-200', 'Moen', false,
       CASE WHEN v_phase >= 4 THEN 'Confirmed' WHEN v_phase >= 3 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '52 days' ELSE NULL END, NOW()),

      (v_project.id, 'hardware', 'Door & Cabinet Hardware', 'Satin Nickel', 'SN-HW', 'Schlage', false,
       CASE WHEN v_phase >= 4 THEN 'Confirmed' WHEN v_phase >= 3 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '52 days' ELSE NULL END, NOW());

  END LOOP;

  RAISE NOTICE 'Project data generated for % projects', v_project_count;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR in project data generation: % - %', SQLERRM, SQLSTATE;
  RAISE;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Project data generated:' AS status;

SELECT
  'Tasks' AS data_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'Completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress,
  COUNT(*) FILTER (WHERE status = 'Not Started') AS not_started
FROM tasks

UNION ALL

SELECT
  'RFIs',
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'Closed'),
  COUNT(*) FILTER (WHERE status = 'Open'),
  COUNT(*) FILTER (WHERE status = 'Draft')
FROM rfis

UNION ALL

SELECT
  'Submittals',
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'Approved'),
  COUNT(*) FILTER (WHERE status = 'Under Review'),
  COUNT(*) FILTER (WHERE status = 'Draft')
FROM submittals

UNION ALL

SELECT
  'Change Orders',
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'Implemented'),
  COUNT(*) FILTER (WHERE status = 'Sent'),
  COUNT(*) FILTER (WHERE status = 'Draft')
FROM change_orders;

SELECT
  'Long Lead Items' AS data_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'Delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'Ordered') AS ordered,
  COUNT(*) FILTER (WHERE status = 'Pending') AS pending
FROM long_lead_items;

SELECT
  'Color Selections' AS data_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'Confirmed') AS confirmed,
  COUNT(*) FILTER (WHERE status = 'Pending') AS pending
FROM color_selections;
