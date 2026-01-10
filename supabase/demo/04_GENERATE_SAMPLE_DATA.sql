-- ============================================================================
-- STEP 4: GENERATE SAMPLE TASKS, RFIs, SUBMITTALS, MILESTONES
-- ============================================================================
-- Creates realistic sample data for each project for demo purposes
-- Schema based on actual app code analysis (Jan 2026)
-- ============================================================================

DO $$
DECLARE
  v_project RECORD;
  v_pm_id UUID;
  v_rfi_num INTEGER;
  v_submittal_num INTEGER;
BEGIN
  -- Loop through all projects
  FOR v_project IN SELECT * FROM projects ORDER BY created_at LOOP
    v_pm_id := v_project.primary_pm_id;
    v_rfi_num := 1;
    v_submittal_num := 1;

    -- ======================================================================
    -- TASKS (5-8 per project with varied statuses)
    -- ======================================================================

    -- Task 1: Kickoff Meeting
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, created_at)
    VALUES (
      v_project.id,
      'Kickoff Meeting',
      'Schedule and conduct project kickoff meeting with dealer and internal team',
      CASE WHEN v_project.status IN ('In Progress', 'PM Handoff', 'Complete') THEN 'Completed' ELSE 'Not Started' END,
      'High',
      v_project.start_date + INTERVAL '7 days',
      v_pm_id,
      NOW()
    );

    -- Task 2: Site Survey
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, created_at)
    VALUES (
      v_project.id,
      'Complete Site Survey',
      'Conduct site visit and document conditions, measurements, and access requirements',
      CASE
        WHEN v_project.status IN ('In Progress', 'Complete') THEN 'Completed'
        WHEN v_project.status = 'PM Handoff' THEN 'In Progress'
        ELSE 'Not Started'
      END,
      'High',
      v_project.start_date + INTERVAL '14 days',
      v_pm_id,
      NOW()
    );

    -- Task 3: 20% Drawings Review
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, workflow_station_key, created_at)
    VALUES (
      v_project.id,
      'Review 20% Drawings',
      'Review preliminary layout drawings and provide feedback to drafting',
      CASE
        WHEN v_project.status = 'Complete' THEN 'Completed'
        WHEN v_project.status = 'In Progress' AND v_project.health_status != 'Critical' THEN 'Completed'
        WHEN v_project.status = 'In Progress' THEN 'In Progress'
        WHEN v_project.status = 'PM Handoff' THEN 'In Progress'
        ELSE 'Not Started'
      END,
      'Medium',
      v_project.start_date + INTERVAL '21 days',
      v_pm_id,
      'drawings_20',
      NOW()
    );

    -- Task 4: Color Selections Follow-up
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, workflow_station_key, created_at)
    VALUES (
      v_project.id,
      'Follow Up on Color Selections',
      'Contact dealer regarding outstanding color and finish selections',
      CASE
        WHEN v_project.status = 'Complete' THEN 'Completed'
        WHEN v_project.status = 'In Progress' THEN 'In Progress'
        ELSE 'Not Started'
      END,
      'Medium',
      v_project.start_date + INTERVAL '30 days',
      v_pm_id,
      'color_selections',
      NOW()
    );

    -- Task 5: Permit Submission (for In Progress and Complete projects)
    IF v_project.status IN ('In Progress', 'Complete') THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, workflow_station_key, created_at)
      VALUES (
        v_project.id,
        'Submit Building Permits',
        'Prepare and submit building permit application to local jurisdiction',
        CASE
          WHEN v_project.status = 'Complete' THEN 'Completed'
          WHEN v_project.health_status = 'Critical' THEN 'Awaiting Response'
          ELSE 'Not Started'
        END,
        'High',
        v_project.target_online_date - INTERVAL '90 days',
        v_pm_id,
        'permit_submission',
        NOW()
      );
    END IF;

    -- Task 6: Long Lead Items
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, workflow_station_key, created_at)
    VALUES (
      v_project.id,
      'Order Long Lead Items',
      'Identify and order equipment with extended lead times (HVAC, electrical panels, etc.)',
      CASE
        WHEN v_project.status = 'Complete' THEN 'Completed'
        WHEN v_project.status = 'In Progress' AND v_project.health_status = 'On Track' THEN 'Completed'
        WHEN v_project.status = 'In Progress' THEN 'In Progress'
        ELSE 'Not Started'
      END,
      'High',
      v_project.start_date + INTERVAL '45 days',
      v_pm_id,
      'long_lead_items',
      NOW()
    );

    -- Task 7: Overdue task for Critical projects
    IF v_project.health_status = 'Critical' THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, created_at)
      VALUES (
        v_project.id,
        'URGENT: Resolve Schedule Delays',
        'Address critical path delays and develop recovery plan',
        'In Progress',
        'Urgent',
        CURRENT_DATE - INTERVAL '5 days',
        v_pm_id,
        NOW()
      );
    END IF;

    -- Task 8: At Risk follow-up
    IF v_project.health_status = 'At Risk' THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, created_at)
      VALUES (
        v_project.id,
        'Schedule Recovery Meeting',
        'Meet with factory to discuss schedule recovery options',
        'Awaiting Response',
        'High',
        CURRENT_DATE + INTERVAL '3 days',
        v_pm_id,
        NOW()
      );
    END IF;

    -- ======================================================================
    -- RFIs (2-3 per project)
    -- Schema: project_id, rfi_number, number, subject, question, status,
    --         priority, due_date, date_sent, is_external, sent_to,
    --         sent_to_email, created_by
    -- ======================================================================

    -- RFI 1: Site Conditions
    INSERT INTO rfis (project_id, rfi_number, number, subject, question, status, priority, date_sent, due_date, is_external, sent_to, sent_to_email, created_by, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-RFI-' || LPAD(v_rfi_num::TEXT, 3, '0'),
      v_rfi_num,
      'Site Access Clarification',
      'Please clarify the site access route for delivery vehicles. The preliminary survey shows potential issues with overhead clearance on the main access road.',
      CASE
        WHEN v_project.status IN ('In Progress', 'Complete') THEN 'Closed'
        WHEN v_project.status = 'PM Handoff' THEN 'Open'
        ELSE 'Draft'
      END,
      'Medium',
      CASE WHEN v_project.status NOT IN ('Planning') THEN v_project.start_date + INTERVAL '10 days' ELSE NULL END,
      v_project.start_date + INTERVAL '17 days',
      true,
      COALESCE(v_project.client_name, 'Dealer Contact'),
      NULL,
      v_pm_id,
      NOW()
    );
    v_rfi_num := v_rfi_num + 1;

    -- RFI 2: Technical Question
    INSERT INTO rfis (project_id, rfi_number, number, subject, question, status, priority, date_sent, due_date, is_external, sent_to, sent_to_email, created_by, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-RFI-' || LPAD(v_rfi_num::TEXT, 3, '0'),
      v_rfi_num,
      'Electrical Panel Location',
      'Drawing sheet E-101 shows the main electrical panel in a location that conflicts with the mechanical room layout. Please advise on preferred location.',
      CASE
        WHEN v_project.status = 'Complete' THEN 'Closed'
        WHEN v_project.status = 'In Progress' AND v_project.health_status = 'On Track' THEN 'Closed'
        WHEN v_project.status = 'In Progress' THEN 'Open'
        ELSE 'Draft'
      END,
      'High',
      CASE WHEN v_project.status IN ('In Progress', 'Complete') THEN v_project.start_date + INTERVAL '25 days' ELSE NULL END,
      v_project.start_date + INTERVAL '32 days',
      true,
      'Engineering Department',
      NULL,
      v_pm_id,
      NOW()
    );
    v_rfi_num := v_rfi_num + 1;

    -- RFI 3: Open/Overdue for problem projects
    IF v_project.health_status IN ('At Risk', 'Critical') THEN
      INSERT INTO rfis (project_id, rfi_number, number, subject, question, status, priority, date_sent, due_date, is_external, sent_to, sent_to_email, created_by, created_at)
      VALUES (
        v_project.id,
        v_project.project_number || '-RFI-' || LPAD(v_rfi_num::TEXT, 3, '0'),
        v_rfi_num,
        'URGENT: Foundation Specification',
        'Foundation drawings do not match site survey elevation data. Need immediate clarification to proceed with module set.',
        'Open',
        'Critical',
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_DATE - INTERVAL '2 days',
        true,
        'Site Contractor',
        NULL,
        v_pm_id,
        NOW()
      );
      v_rfi_num := v_rfi_num + 1;
    END IF;

    -- ======================================================================
    -- SUBMITTALS (2-3 per project)
    -- Schema: project_id, submittal_number, title, description,
    --         submittal_type (REQUIRED), status, priority (REQUIRED),
    --         due_date, date_submitted, is_external, sent_to, sent_to_email,
    --         spec_section, manufacturer, model_number, revision_number,
    --         created_by
    -- NOTE: No 'number' column in submittals table
    -- ======================================================================

    -- Submittal 1: HVAC Equipment
    INSERT INTO submittals (project_id, submittal_number, title, description, submittal_type, status, priority, date_submitted, due_date, is_external, sent_to, sent_to_email, manufacturer, model_number, revision_number, created_by, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-SUB-' || LPAD(v_submittal_num::TEXT, 3, '0'),
      'HVAC Equipment Cutsheets',
      'Carrier 5-ton rooftop unit with economizer',
      'Product Data',
      CASE
        WHEN v_project.status = 'Complete' THEN 'Approved'
        WHEN v_project.status = 'In Progress' AND v_project.health_status = 'On Track' THEN 'Approved'
        WHEN v_project.status = 'In Progress' THEN 'Under Review'
        ELSE 'Pending'
      END,
      'High',
      CASE WHEN v_project.status NOT IN ('Planning') THEN v_project.start_date + INTERVAL '20 days' ELSE NULL END,
      v_project.start_date + INTERVAL '30 days',
      true,
      COALESCE(v_project.client_name, 'Dealer Contact'),
      NULL,
      'Carrier',
      '48TCDD06A2A5-0A0A0',
      0,
      v_pm_id,
      NOW()
    );
    v_submittal_num := v_submittal_num + 1;

    -- Submittal 2: Electrical Panel
    INSERT INTO submittals (project_id, submittal_number, title, description, submittal_type, status, priority, date_submitted, due_date, is_external, sent_to, sent_to_email, manufacturer, model_number, revision_number, created_by, created_at)
    VALUES (
      v_project.id,
      v_project.project_number || '-SUB-' || LPAD(v_submittal_num::TEXT, 3, '0'),
      'Main Electrical Panel',
      '200A main breaker panel with surge protection',
      'Product Data',
      CASE
        WHEN v_project.status = 'Complete' THEN 'Approved'
        WHEN v_project.status = 'In Progress' THEN 'Under Review'
        ELSE 'Pending'
      END,
      'Medium',
      CASE WHEN v_project.status IN ('In Progress', 'Complete') THEN v_project.start_date + INTERVAL '25 days' ELSE NULL END,
      v_project.start_date + INTERVAL '35 days',
      true,
      COALESCE(v_project.client_name, 'Dealer Contact'),
      NULL,
      'Square D',
      'HOM2200M200PCVP',
      0,
      v_pm_id,
      NOW()
    );
    v_submittal_num := v_submittal_num + 1;

    -- Submittal 3: Rejected for Critical projects
    IF v_project.health_status = 'Critical' THEN
      INSERT INTO submittals (project_id, submittal_number, title, description, submittal_type, status, priority, date_submitted, due_date, is_external, sent_to, sent_to_email, manufacturer, revision_number, created_by, created_at)
      VALUES (
        v_project.id,
        v_project.project_number || '-SUB-' || LPAD(v_submittal_num::TEXT, 3, '0'),
        'Exterior Finish Materials',
        'Fiber cement siding and trim package',
        'Samples',
        'Rejected',
        'High',
        CURRENT_DATE - INTERVAL '14 days',
        CURRENT_DATE - INTERVAL '7 days',
        true,
        COALESCE(v_project.client_name, 'Dealer Contact'),
        NULL,
        'James Hardie',
        1,
        v_pm_id,
        NOW()
      );
      v_submittal_num := v_submittal_num + 1;
    END IF;

    -- ======================================================================
    -- MILESTONES (4 per project)
    -- Schema: project_id, name, description, category (REQUIRED),
    --         due_date, is_critical_path, status, created_by
    -- Status values: 'Not Started', 'In Progress', 'Completed'
    -- ======================================================================

    -- Milestone 1: Sales Handoff
    INSERT INTO milestones (project_id, name, description, category, due_date, is_critical_path, status, created_by, created_at)
    VALUES (
      v_project.id,
      'Sales Handoff Complete',
      'All sales documentation received and project officially handed to PM',
      'Administrative',
      v_project.start_date,
      false,
      CASE WHEN v_project.status NOT IN ('Pre-PM', 'Planning') THEN 'Completed' ELSE 'Not Started' END,
      v_pm_id,
      NOW()
    );

    -- Milestone 2: Drawings Approved
    INSERT INTO milestones (project_id, name, description, category, due_date, is_critical_path, status, created_by, created_at)
    VALUES (
      v_project.id,
      '100% Drawings Approved',
      'Final construction drawings approved by dealer',
      'Submittal',
      v_project.start_date + INTERVAL '60 days',
      true,
      CASE
        WHEN v_project.status = 'Complete' THEN 'Completed'
        WHEN v_project.status = 'In Progress' AND v_project.health_status = 'On Track' THEN 'Completed'
        WHEN v_project.status = 'In Progress' THEN 'In Progress'
        ELSE 'Not Started'
      END,
      v_pm_id,
      NOW()
    );

    -- Milestone 3: Production Start
    INSERT INTO milestones (project_id, name, description, category, due_date, is_critical_path, status, created_by, created_at)
    VALUES (
      v_project.id,
      'Production Start',
      'Factory begins module production',
      'Production',
      v_project.target_online_date - INTERVAL '60 days',
      true,
      CASE
        WHEN v_project.status = 'Complete' THEN 'Completed'
        WHEN v_project.status = 'In Progress' AND v_project.health_status = 'On Track' THEN 'In Progress'
        ELSE 'Not Started'
      END,
      v_pm_id,
      NOW()
    );

    -- Milestone 4: Delivery
    INSERT INTO milestones (project_id, name, description, category, due_date, is_critical_path, status, created_by, created_at)
    VALUES (
      v_project.id,
      'Delivery to Site',
      'Modules delivered and set on foundation',
      'Delivery',
      v_project.target_online_date - INTERVAL '14 days',
      true,
      CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END,
      v_pm_id,
      NOW()
    );

  END LOOP;

  RAISE NOTICE 'Sample data generation complete!';
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 'Projects' AS entity, COUNT(*) AS count FROM projects
UNION ALL SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'RFIs', COUNT(*) FROM rfis
UNION ALL SELECT 'Submittals', COUNT(*) FROM submittals
UNION ALL SELECT 'Milestones', COUNT(*) FROM milestones;

-- Show task status distribution
SELECT status, COUNT(*) as count
FROM tasks
GROUP BY status
ORDER BY count DESC;

-- Show projects by status
SELECT status, health_status, COUNT(*) as count
FROM projects
GROUP BY status, health_status
ORDER BY status, health_status;
