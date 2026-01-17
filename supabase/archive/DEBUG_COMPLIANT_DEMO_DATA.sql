-- ============================================================================
-- DEBUG_COMPLIANT_DEMO_DATA - January 2026
-- ============================================================================
-- Comprehensive demo data following DEBUG_TEST_GUIDE principles:
--   - Status Value Consistency (Phase 1.1 compliant)
--   - Idempotent Operations (safe to re-run)
--   - Error Handling with transaction safety
--   - Verification Queries for data integrity
--   - RLS-compatible data patterns
--
-- PRESERVES: Users, Factories, Station Templates
-- RECREATES: All project management and PGM demo data
--
-- Run this file to completely refresh demo data with 90 days of history.
--
-- Created: January 16, 2026
-- Updated: Aligned with DEBUG_TEST_GUIDE principles
-- ============================================================================

-- ============================================================================
-- OFFICIAL STATUS VALUES (from DEBUG_TEST_GUIDE Phase 1.1)
-- ============================================================================
-- Tasks:      'Not Started', 'In Progress', 'Awaiting Response', 'Completed', 'Cancelled'
-- Projects:   'Draft', 'Active', 'On Hold', 'Completed', 'Archived'
-- RFIs:       'Draft', 'Open', 'Answered', 'Closed'
-- Submittals: 'Pending', 'Under Review', 'Approved', 'Approved as Noted', 'Rejected', 'Resubmit'
-- Modules:    'Not Started', 'In Queue', 'In Progress', 'QC Hold', 'Completed', 'Staged', 'Shipped'
-- QC Records: 'Pending', 'Passed', 'Failed', 'Conditional'
-- Kaizen:     'Submitted', 'Under Review', 'Approved', 'Implemented', 'Rejected'
-- ============================================================================

-- ============================================================================
-- PART 1: CLEAR EXISTING DATA (Preserving Users/Factories/Station Templates)
-- ============================================================================
-- Using a DO block with exception handling for tables that may not exist
-- IMPORTANT: Tables must be cleared in dependency order to avoid FK violations
-- Tables with CASCADE will auto-delete children, but non-CASCADE FKs need explicit handling

DO $$
BEGIN
  RAISE NOTICE 'Starting data cleanup...';

  -- ==========================================================================
  -- 1.1: SALES TABLES (have non-CASCADE FK to projects - MUST be cleared first)
  -- ==========================================================================
  -- sales_quotes.converted_to_project_id -> projects (no CASCADE)
  -- sales_quotes.project_id -> projects (no CASCADE)
  BEGIN
    UPDATE sales_quotes SET converted_to_project_id = NULL WHERE converted_to_project_id IS NOT NULL;
    UPDATE sales_quotes SET project_id = NULL WHERE project_id IS NOT NULL;
    RAISE NOTICE '  [OK] Sales quotes project references cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] sales_quotes table does not exist';
  END;

  -- ==========================================================================
  -- 1.2: PROJECT-RELATED TABLES (explicit delete for safety)
  -- ==========================================================================
  -- These have CASCADE but we clear them explicitly for clarity

  -- Project junction/log tables
  BEGIN
    DELETE FROM project_external_contacts WHERE TRUE;
    RAISE NOTICE '  [OK] project_external_contacts cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] project_external_contacts does not exist';
  END;

  BEGIN
    DELETE FROM project_documents_checklist WHERE TRUE;
    RAISE NOTICE '  [OK] project_documents_checklist cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] project_documents_checklist does not exist';
  END;

  BEGIN
    UPDATE praxis_import_log SET project_id = NULL WHERE project_id IS NOT NULL;
    RAISE NOTICE '  [OK] praxis_import_log project references cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] praxis_import_log does not exist';
  END;

  BEGIN
    DELETE FROM project_workflow_status WHERE TRUE;
    RAISE NOTICE '  [OK] project_workflow_status cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] project_workflow_status does not exist';
  END;

  BEGIN
    DELETE FROM warning_emails_log WHERE TRUE;
    RAISE NOTICE '  [OK] warning_emails_log cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] warning_emails_log does not exist';
  END;

  -- Engineering/Drawing tables
  BEGIN
    DELETE FROM drawing_versions WHERE TRUE;
    RAISE NOTICE '  [OK] drawing_versions cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] drawing_versions does not exist';
  END;

  BEGIN
    DELETE FROM engineering_reviews WHERE TRUE;
    RAISE NOTICE '  [OK] engineering_reviews cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] engineering_reviews does not exist';
  END;

  BEGIN
    DELETE FROM cutsheet_submittals WHERE TRUE;
    RAISE NOTICE '  [OK] cutsheet_submittals cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] cutsheet_submittals does not exist';
  END;

  BEGIN
    DELETE FROM color_selections WHERE TRUE;
    RAISE NOTICE '  [OK] color_selections cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] color_selections does not exist';
  END;

  -- ==========================================================================
  -- 1.3: PGM EFFICIENCY TABLES (depends on modules/workers)
  -- ==========================================================================
  BEGIN
    TRUNCATE TABLE five_s_audits CASCADE;
    RAISE NOTICE '  [OK] five_s_audits truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] five_s_audits does not exist';
  END;

  BEGIN
    TRUNCATE TABLE safety_checks CASCADE;
    RAISE NOTICE '  [OK] safety_checks truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] safety_checks does not exist';
  END;

  BEGIN
    TRUNCATE TABLE cross_training CASCADE;
    RAISE NOTICE '  [OK] cross_training truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] cross_training does not exist';
  END;

  BEGIN
    TRUNCATE TABLE kaizen_suggestions CASCADE;
    RAISE NOTICE '  [OK] kaizen_suggestions truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] kaizen_suggestions does not exist';
  END;

  BEGIN
    TRUNCATE TABLE takt_events CASCADE;
    RAISE NOTICE '  [OK] takt_events truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] takt_events does not exist';
  END;

  BEGIN
    TRUNCATE TABLE calendar_audit CASCADE;
    RAISE NOTICE '  [OK] calendar_audit truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] calendar_audit does not exist';
  END;

  -- ==========================================================================
  -- 1.4: PGM CORE TABLES
  -- ==========================================================================
  BEGIN
    TRUNCATE TABLE qc_records CASCADE;
    RAISE NOTICE '  [OK] qc_records truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] qc_records does not exist';
  END;

  BEGIN
    TRUNCATE TABLE worker_shifts CASCADE;
    RAISE NOTICE '  [OK] worker_shifts truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] worker_shifts does not exist';
  END;

  BEGIN
    TRUNCATE TABLE station_assignments CASCADE;
    RAISE NOTICE '  [OK] station_assignments truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] station_assignments does not exist';
  END;

  BEGIN
    TRUNCATE TABLE long_lead_items CASCADE;
    RAISE NOTICE '  [OK] long_lead_items truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] long_lead_items does not exist';
  END;

  BEGIN
    TRUNCATE TABLE inspection_rules CASCADE;
    RAISE NOTICE '  [OK] inspection_rules truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] inspection_rules does not exist';
  END;

  -- Delete modules
  BEGIN
    TRUNCATE TABLE modules CASCADE;
    RAISE NOTICE '  [OK] modules truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] modules does not exist';
  END;

  -- Workers
  BEGIN
    TRUNCATE TABLE workers CASCADE;
    RAISE NOTICE '  [OK] workers truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] workers does not exist';
  END;

  -- ==========================================================================
  -- 1.5: PM TABLES (must come before projects due to FK relationships)
  -- ==========================================================================
  BEGIN
    DELETE FROM file_attachments WHERE TRUE;
    RAISE NOTICE '  [OK] file_attachments cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] file_attachments does not exist';
  END;

  BEGIN
    TRUNCATE TABLE tasks CASCADE;
    RAISE NOTICE '  [OK] tasks truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] tasks does not exist';
  END;

  BEGIN
    TRUNCATE TABLE rfis CASCADE;
    RAISE NOTICE '  [OK] rfis truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] rfis does not exist';
  END;

  BEGIN
    TRUNCATE TABLE submittals CASCADE;
    RAISE NOTICE '  [OK] submittals truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] submittals does not exist';
  END;

  -- Change orders and their items
  BEGIN
    DELETE FROM change_order_items WHERE TRUE;
    RAISE NOTICE '  [OK] change_order_items cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] change_order_items does not exist';
  END;

  BEGIN
    TRUNCATE TABLE change_orders CASCADE;
    RAISE NOTICE '  [OK] change_orders truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] change_orders does not exist';
  END;

  BEGIN
    TRUNCATE TABLE project_logs CASCADE;
    RAISE NOTICE '  [OK] project_logs truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] project_logs does not exist';
  END;

  -- ==========================================================================
  -- 1.6: PROJECTS (now safe to delete - all dependencies cleared)
  -- ==========================================================================
  BEGIN
    DELETE FROM projects WHERE TRUE;
    RAISE NOTICE '  [OK] projects cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] projects does not exist';
  END;

  -- ==========================================================================
  -- 1.7: OTHER TABLES
  -- ==========================================================================
  BEGIN
    DELETE FROM directory_contacts WHERE TRUE;
    RAISE NOTICE '  [OK] directory_contacts cleared';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] directory_contacts does not exist';
  END;

  BEGIN
    TRUNCATE TABLE plant_config CASCADE;
    RAISE NOTICE '  [OK] plant_config truncated';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  [SKIP] plant_config does not exist';
  END;

  RAISE NOTICE 'Data cleanup complete!';
END $$;

-- ============================================================================
-- PART 2: CREATE HELPER FUNCTIONS (Idempotent with OR REPLACE)
-- ============================================================================

-- Random date within range (idempotent)
CREATE OR REPLACE FUNCTION demo_random_date(start_date DATE, end_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN start_date + floor(random() * (end_date - start_date + 1))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Random timestamp within date range (idempotent)
CREATE OR REPLACE FUNCTION demo_random_timestamp(start_date DATE, end_date DATE)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN (start_date + floor(random() * (end_date - start_date + 1))::INTEGER)::TIMESTAMP
         + (floor(random() * 8) + 6) * INTERVAL '1 hour'
         + floor(random() * 60) * INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 3: MAIN DATA GENERATION
-- ============================================================================

DO $$
DECLARE
  -- ========================================================================
  -- CONFIGURATION VARIABLES
  -- ========================================================================

  -- Date ranges (90 days of history)
  v_start_date DATE := CURRENT_DATE - INTERVAL '90 days';
  v_end_date DATE := CURRENT_DATE + INTERVAL '30 days';
  v_today DATE := CURRENT_DATE;

  -- Factory cursor
  v_factory RECORD;
  v_factory_count INTEGER := 0;

  -- Counters for verification
  v_total_projects INTEGER := 0;
  v_total_modules INTEGER := 0;
  v_total_workers INTEGER := 0;
  v_total_tasks INTEGER := 0;
  v_total_rfis INTEGER := 0;
  v_total_submittals INTEGER := 0;
  v_total_shifts INTEGER := 0;

  -- IDs for relationships
  v_project_id UUID;
  v_module_id UUID;
  v_worker_id UUID;
  v_station_id UUID;
  v_user_id UUID;

  -- ========================================================================
  -- OFFICIAL STATUS VALUES (DEBUG_TEST_GUIDE Phase 1.1)
  -- ========================================================================

  -- Task statuses with distribution weights
  v_task_statuses TEXT[] := ARRAY[
    'Completed', 'Completed', 'Completed',           -- 30% completed
    'In Progress', 'In Progress',                     -- 20% in progress
    'Not Started', 'Not Started',                     -- 20% not started
    'Awaiting Response',                              -- 10% awaiting response
    'Cancelled'                                       -- 10% cancelled (implicit)
  ];

  -- Project statuses (Active weighted heavily for realistic demo)
  v_project_statuses TEXT[] := ARRAY[
    'Active', 'Active', 'Active', 'Active',          -- 40% active
    'Completed', 'Completed',                         -- 20% completed
    'Draft',                                          -- 10% draft
    'On Hold',                                        -- 10% on hold
    'Archived'                                        -- 10% archived (implicit)
  ];

  -- RFI statuses
  v_rfi_statuses TEXT[] := ARRAY[
    'Closed', 'Closed', 'Closed',                    -- 30% closed
    'Answered', 'Answered',                           -- 20% answered
    'Open', 'Open', 'Open',                          -- 30% open
    'Draft'                                           -- 10% draft (implicit)
  ];

  -- Submittal statuses
  v_submittal_statuses TEXT[] := ARRAY[
    'Approved', 'Approved', 'Approved',              -- 30% approved
    'Approved as Noted', 'Approved as Noted',        -- 20% approved as noted
    'Under Review', 'Under Review',                  -- 20% under review
    'Pending',                                        -- 10% pending
    'Rejected', 'Resubmit'                           -- 10% each rejected/resubmit
  ];

  -- Module statuses
  v_module_statuses TEXT[] := ARRAY[
    'In Progress', 'In Progress', 'In Progress',     -- 30% in progress
    'Completed', 'Completed',                         -- 20% completed
    'Staged',                                         -- 10% staged
    'Shipped',                                        -- 10% shipped
    'In Queue',                                       -- 10% in queue
    'QC Hold',                                        -- 5% qc hold
    'Not Started'                                     -- 5% not started (implicit)
  ];

  -- QC statuses
  v_qc_statuses TEXT[] := ARRAY[
    'Passed', 'Passed', 'Passed', 'Passed',          -- 80% passed
    'Conditional',                                    -- 10% conditional
    'Failed'                                          -- 10% failed (implicit)
  ];

  -- Kaizen statuses
  v_kaizen_statuses TEXT[] := ARRAY[
    'Submitted', 'Submitted', 'Submitted',           -- 30% submitted
    'Under Review', 'Under Review',                  -- 20% under review
    'Approved',                                       -- 10% approved
    'Implemented', 'Implemented',                    -- 20% implemented
    'Rejected'                                        -- 10% rejected (implicit)
  ];

  -- ========================================================================
  -- WORKER NAMES AND TITLES
  -- ========================================================================

  v_first_names TEXT[] := ARRAY[
    'Mike', 'Sarah', 'Carlos', 'James', 'Maria', 'Robert', 'Jennifer', 'David', 'Lisa', 'Kevin',
    'Emily', 'Michael', 'Jessica', 'Daniel', 'Ashley', 'Christopher', 'Amanda', 'Matthew', 'Stephanie', 'Andrew',
    'Nicole', 'Joshua', 'Elizabeth', 'Brandon', 'Megan', 'Ryan', 'Rachel', 'Justin', 'Samantha', 'William',
    'Jose', 'Juan', 'Miguel', 'Antonio', 'Luis', 'Pedro', 'Francisco', 'Diego', 'Ricardo', 'Jorge'
  ];

  v_last_names TEXT[] := ARRAY[
    'Johnson', 'Williams', 'Rodriguez', 'Chen', 'Garcia', 'Smith', 'Davis', 'Martinez', 'Anderson', 'Thompson',
    'Wilson', 'Moore', 'Taylor', 'Jackson', 'White', 'Harris', 'Martin', 'Lee', 'Perez', 'Clark',
    'Lewis', 'Robinson', 'Walker', 'Hall', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green',
    'Hernandez', 'Lopez', 'Gonzalez', 'Rivera', 'Ramirez', 'Torres', 'Flores', 'Sanchez', 'Morales', 'Reyes'
  ];

  v_titles TEXT[] := ARRAY[
    'Lead Welder', 'Electrician', 'Carpenter', 'Lead Carpenter', 'Plumber', 'HVAC Tech', 'QC Inspector',
    'Welder', 'Finish Carpenter', 'General Labor', 'Foreman', 'Helper', 'Painter', 'Insulation Tech', 'Roofer'
  ];

  -- ========================================================================
  -- PROJECT AND MODULE NAMES
  -- ========================================================================

  v_client_names TEXT[] := ARRAY[
    'Acme Corp', 'TechStart Inc', 'GlobalMed', 'EduFirst Schools', 'RetailMax', 'GovWorks',
    'Healthcare Plus', 'University Systems', 'Mining Solutions', 'Oil Field Services', 'Construction Co', 'Data Centers Inc',
    'Farm Fresh', 'Solar Power Ltd', 'Wind Energy Corp', 'Remote Sites LLC', 'Emergency Services', 'Fire Department'
  ];

  v_project_types TEXT[] := ARRAY[
    'Office Complex', 'Classroom Building', 'Medical Clinic', 'Break Room', 'Storage Facility',
    'Guard Shack', 'Restroom Building', 'Locker Room', 'Control Room', 'Lab Building', 'Administration', 'Dormitory',
    'Conference Center', 'Cafeteria', 'Maintenance Shop', 'Equipment Storage'
  ];

  v_module_names TEXT[] := ARRAY[
    'Main Office', 'Conference Room', 'Break Room', 'Restroom', 'Storage',
    'Utility', 'Entry', 'Reception', 'Kitchen', 'Server Room', 'Locker Room'
  ];

  -- Local variables for loops
  v_random_float FLOAT;
  v_status TEXT;
  i INTEGER;
  j INTEGER;
  k INTEGER;

BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'DEBUG_COMPLIANT DEMO DATA GENERATION';
  RAISE NOTICE 'Date Range: % to %', v_start_date, v_end_date;
  RAISE NOTICE '============================================================';

  -- ========================================================================
  -- VALIDATE PREREQUISITES
  -- ========================================================================

  -- Check that we have factories to work with
  IF NOT EXISTS (SELECT 1 FROM factories WHERE is_active = true) THEN
    RAISE EXCEPTION 'No active factories found. Cannot generate demo data.';
  END IF;

  -- Check that we have users to assign tasks to
  IF NOT EXISTS (SELECT 1 FROM users WHERE is_active = true) THEN
    RAISE EXCEPTION 'No active users found. Cannot generate demo data.';
  END IF;

  -- Check that we have station templates
  IF NOT EXISTS (SELECT 1 FROM station_templates WHERE is_active = true) THEN
    RAISE WARNING 'No active station templates found. Module station assignments will be limited.';
  END IF;

  RAISE NOTICE 'Prerequisites validated successfully';

  -- ========================================================================
  -- FIND TARGET PM USER (for guaranteed project assignments)
  -- ========================================================================
  -- This ensures the logged-in user has projects assigned to them.
  -- Uses same pattern as MASTER_DEMO_DATA_V2.sql for consistency.
  -- ========================================================================

  -- Try to find user by name pattern (Matthew/Matt)
  SELECT id INTO v_user_id
  FROM users
  WHERE (LOWER(email) LIKE '%matt%' OR LOWER(name) LIKE '%matt%')
    AND is_active = true
    AND role IN ('PM', 'Director', 'VP')
  LIMIT 1;

  -- Fallback: if not found, get first PM user
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM users
    WHERE role = 'PM' AND is_active = true
    LIMIT 1;
  END IF;

  -- Final fallback: any user who can manage projects
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM users
    WHERE role IN ('PM', 'Director', 'VP') AND is_active = true
    LIMIT 1;
  END IF;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Target PM User ID: % (will be assigned to first projects in each factory)', v_user_id;
  ELSE
    RAISE WARNING 'No suitable PM user found - projects will be assigned to random PMs';
  END IF;

  -- ========================================================================
  -- LOOP THROUGH ALL FACTORIES
  -- ========================================================================

  FOR v_factory IN
    SELECT id, code, full_name
    FROM factories
    WHERE is_active = true
    ORDER BY code
  LOOP
    v_factory_count := v_factory_count + 1;
    RAISE NOTICE '';
    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'Processing Factory %: % (%)', v_factory_count, v_factory.code, v_factory.full_name;
    RAISE NOTICE '------------------------------------------------------------';

    -- ======================================================================
    -- 3.1: CREATE PLANT CONFIG (Idempotent with ON CONFLICT)
    -- ======================================================================

    INSERT INTO plant_config (factory_id, efficiency_modules)
    VALUES (
      v_factory.id,
      '{
        "takt_time_tracker": true,
        "queue_time_monitor": true,
        "kaizen_board": true,
        "defect_fix_timer": true,
        "material_flow_trace": false,
        "crew_utilization_heatmap": true,
        "line_balancing_sim": true,
        "visual_load_board": true,
        "five_s_audit": true,
        "oee_calculator": true,
        "cross_training_matrix": true,
        "safety_micro_check": true
      }'::JSONB
    )
    ON CONFLICT (factory_id) DO UPDATE SET
      efficiency_modules = EXCLUDED.efficiency_modules,
      updated_at = NOW();

    RAISE NOTICE '  [OK] Plant config created/updated';

    -- ======================================================================
    -- 3.2: CREATE WORKERS (20-30 per factory)
    -- ======================================================================

    FOR i IN 1..(20 + floor(random() * 10)::INTEGER)
    LOOP
      -- Get a random station for primary assignment
      SELECT id INTO v_station_id
      FROM station_templates
      WHERE (factory_id = v_factory.id OR factory_id IS NULL) AND is_active = true
      ORDER BY random()
      LIMIT 1;

      INSERT INTO workers (
        factory_id, employee_id, first_name, last_name, title,
        primary_station_id, is_lead, hourly_rate, is_active, hire_date
      )
      VALUES (
        v_factory.id,
        v_factory.code || '-' || LPAD(i::TEXT, 3, '0'),
        v_first_names[1 + floor(random() * array_length(v_first_names, 1))::INTEGER],
        v_last_names[1 + floor(random() * array_length(v_last_names, 1))::INTEGER],
        v_titles[1 + floor(random() * array_length(v_titles, 1))::INTEGER],
        v_station_id,
        i <= 3,  -- First 3 workers are leads
        18.50 + random() * 15,  -- $18.50 - $33.50
        true,
        v_start_date - INTERVAL '1 year' + (random() * INTERVAL '2 years')
      )
      ON CONFLICT (factory_id, employee_id) DO NOTHING
      RETURNING id INTO v_worker_id;

      -- Only count if actually inserted
      IF v_worker_id IS NOT NULL THEN
        v_total_workers := v_total_workers + 1;

        -- Create cross-training records for ~60% of workers
        IF random() < 0.6 THEN
          FOR j IN 1..floor(random() * 4 + 1)::INTEGER
          LOOP
            SELECT id INTO v_station_id
            FROM station_templates
            WHERE (factory_id = v_factory.id OR factory_id IS NULL) AND is_active = true
            ORDER BY random()
            LIMIT 1;

            IF v_station_id IS NOT NULL THEN
              INSERT INTO cross_training (worker_id, station_id, factory_id, certified_at, proficiency_level)
              VALUES (
                v_worker_id,
                v_station_id,
                v_factory.id,
                v_today - (random() * 365)::INTEGER,
                CASE floor(random() * 3)::INTEGER
                  WHEN 0 THEN 'Basic'
                  WHEN 1 THEN 'Intermediate'
                  ELSE 'Expert'
                END
              )
              ON CONFLICT (worker_id, station_id) DO NOTHING;
            END IF;
          END LOOP;
        END IF;
      END IF;
    END LOOP;

    RAISE NOTICE '  [OK] Workers created';

    -- ======================================================================
    -- 3.3: CREATE PROJECTS (8-12 per factory)
    -- ======================================================================

    FOR i IN 1..(8 + floor(random() * 5)::INTEGER)
    LOOP
      DECLARE
        v_project_start DATE;
        v_project_status TEXT;
        v_contract_value NUMERIC;
        v_module_quantity INTEGER;
        v_pm_id UUID;
      BEGIN
        -- Get a PM user for this project
        -- FIRST 4 PROJECTS per factory: Assign to target PM (v_user_id) for guaranteed dashboard data
        -- REMAINING PROJECTS: Assign to random PMs
        IF i <= 4 AND v_user_id IS NOT NULL THEN
          v_pm_id := v_user_id;  -- Target PM gets first 4 projects in each factory
        ELSE
          SELECT id INTO v_pm_id
          FROM users
          WHERE role IN ('PM', 'Director') AND is_active = true
          ORDER BY random()
          LIMIT 1;
        END IF;

        -- Determine project status based on index (older projects more likely complete)
        IF i <= 2 THEN
          v_project_status := 'Completed';
          v_project_start := v_start_date + (random() * 30)::INTEGER;
        ELSIF i <= 5 THEN
          v_project_status := 'Active';
          v_project_start := v_today - (random() * 60)::INTEGER;
        ELSE
          -- Use weighted random from official statuses
          v_project_status := v_project_statuses[1 + floor(random() * array_length(v_project_statuses, 1))::INTEGER];
          v_project_start := v_today - (random() * 30)::INTEGER + (random() * 30)::INTEGER;
        END IF;

        v_module_quantity := 4 + floor(random() * 12)::INTEGER;  -- 4-15 modules
        v_contract_value := v_module_quantity * (150000 + random() * 350000);

        INSERT INTO projects (
          project_number, name, factory, factory_id, building_type, status, health_status,
          current_phase, contract_value, owner_id, primary_pm_id, module_count,
          target_online_date, start_date, created_at
        )
        VALUES (
          v_factory.code || '-' || to_char(v_project_start, 'YY') || '-' || LPAD((i + 100)::TEXT, 3, '0'),
          v_client_names[1 + floor(random() * array_length(v_client_names, 1))::INTEGER] || ' - ' ||
          v_project_types[1 + floor(random() * array_length(v_project_types, 1))::INTEGER],
          v_factory.code,  -- Store just the code (e.g., 'NWBS') to match user.factory filter
          v_factory.id,
          CASE floor(random() * 4)::INTEGER
            WHEN 0 THEN 'COMMERCIAL'
            WHEN 1 THEN 'GOVERNMENT'
            WHEN 2 THEN 'STOCK'
            ELSE 'CUSTOM'
          END,
          v_project_status,
          CASE v_project_status
            WHEN 'Completed' THEN 'On Track'
            WHEN 'Active' THEN CASE floor(random() * 3)::INTEGER
              WHEN 0 THEN 'On Track'
              WHEN 1 THEN 'At Risk'
              ELSE 'On Track'
            END
            ELSE 'On Track'
          END,
          CASE v_project_status
            WHEN 'Completed' THEN 4
            WHEN 'Active' THEN 1 + floor(random() * 4)::INTEGER
            WHEN 'Draft' THEN 1
            ELSE 2
          END,
          v_contract_value,
          v_pm_id,
          v_pm_id,
          v_module_quantity,
          v_project_start + (v_module_quantity * 7 + 30),
          v_project_start,
          NOW()
        )
        RETURNING id INTO v_project_id;

        v_total_projects := v_total_projects + 1;

        -- ==================================================================
        -- 3.4: CREATE MODULES FOR THIS PROJECT
        -- ==================================================================
        -- STATUS ASSIGNMENT LOGIC:
        -- Module status is derived from scheduled_start/end relative to TODAY
        -- NOT from sequence position. This ensures calendar shows consistent data.
        -- ==================================================================

        FOR j IN 1..v_module_quantity
        LOOP
          DECLARE
            v_mod_status TEXT;
            v_mod_station_id UUID;
            v_scheduled_start DATE;
            v_scheduled_end DATE;
            v_actual_start TIMESTAMPTZ;
            v_actual_end TIMESTAMPTZ;
            v_days_until_start INTEGER;
            v_days_since_end INTEGER;
            v_progress_pct FLOAT;
            v_target_station INTEGER;
          BEGIN
            -- Calculate scheduled dates based on project start and module sequence
            v_scheduled_start := v_project_start + ((j - 1) * 5);
            v_scheduled_end := v_scheduled_start + 14;

            -- Calculate date relationships
            v_days_until_start := v_scheduled_start - v_today;
            v_days_since_end := v_today - v_scheduled_end;

            -- ================================================================
            -- DATE-BASED STATUS ASSIGNMENT
            -- The key principle: status MUST be consistent with dates shown
            -- ================================================================

            IF v_project_status = 'Draft' THEN
              -- Draft projects: all modules not started
              v_mod_status := 'Not Started';
              v_mod_station_id := NULL;
              v_actual_start := NULL;
              v_actual_end := NULL;

            ELSIF v_project_status = 'Completed' THEN
              -- Completed projects: all modules shipped or staged
              v_mod_status := CASE WHEN random() < 0.9 THEN 'Shipped' ELSE 'Staged' END;
              v_actual_start := v_scheduled_start::TIMESTAMPTZ;
              v_actual_end := (v_scheduled_end + floor(random() * 3)::INTEGER)::TIMESTAMPTZ;
              -- Assign to final/staging station
              SELECT id INTO v_mod_station_id
              FROM station_templates
              WHERE (factory_id = v_factory.id OR factory_id IS NULL) AND order_num >= 11
              ORDER BY order_num DESC
              LIMIT 1;

            ELSIF v_days_until_start > 7 THEN
              -- FUTURE: More than a week away - Not Started
              v_mod_status := 'Not Started';
              v_mod_station_id := NULL;
              v_actual_start := NULL;
              v_actual_end := NULL;

            ELSIF v_days_until_start > 0 THEN
              -- UPCOMING: Within the next week - In Queue (preparing)
              v_mod_status := 'In Queue';
              v_actual_start := NULL;
              v_actual_end := NULL;
              -- Queue at early stations (1-3)
              SELECT id INTO v_mod_station_id
              FROM station_templates
              WHERE (factory_id = v_factory.id OR factory_id IS NULL)
                AND order_num BETWEEN 1 AND 3
                AND is_active = true
              ORDER BY random()
              LIMIT 1;

            ELSIF v_days_since_end > 14 THEN
              -- OVERDUE by 2+ weeks - Should be Shipped
              v_mod_status := 'Shipped';
              v_actual_start := v_scheduled_start::TIMESTAMPTZ;
              v_actual_end := (v_scheduled_end + floor(random() * 7)::INTEGER)::TIMESTAMPTZ;
              SELECT id INTO v_mod_station_id
              FROM station_templates
              WHERE (factory_id = v_factory.id OR factory_id IS NULL) AND order_num = 12
              LIMIT 1;

            ELSIF v_days_since_end > 0 THEN
              -- PAST END DATE but within 2 weeks - Completed or Staged
              v_random_float := random();
              IF v_random_float < 0.6 THEN
                v_mod_status := 'Staged';
              ELSE
                v_mod_status := 'Completed';
              END IF;
              v_actual_start := v_scheduled_start::TIMESTAMPTZ;
              v_actual_end := (v_scheduled_end + floor(random() * 3)::INTEGER)::TIMESTAMPTZ;
              SELECT id INTO v_mod_station_id
              FROM station_templates
              WHERE (factory_id = v_factory.id OR factory_id IS NULL)
                AND order_num BETWEEN 10 AND 11
              ORDER BY order_num DESC
              LIMIT 1;

            ELSE
              -- ACTIVE PERIOD: Between scheduled start and end date
              -- This is where modules should be In Progress, In Queue, or QC Hold
              v_random_float := random();

              IF v_random_float < 0.65 THEN
                v_mod_status := 'In Progress';
              ELSIF v_random_float < 0.85 THEN
                v_mod_status := 'In Queue';
              ELSE
                v_mod_status := 'QC Hold';
              END IF;

              -- Set actual_start (started on or slightly before scheduled)
              v_actual_start := (v_scheduled_start - floor(random() * 2)::INTEGER)::TIMESTAMPTZ;
              v_actual_end := NULL;  -- Still in progress

              -- Calculate station based on progress through scheduled period
              v_progress_pct := LEAST(1.0, GREATEST(0.0,
                (v_today - v_scheduled_start)::FLOAT /
                GREATEST(1, (v_scheduled_end - v_scheduled_start)::FLOAT)
              ));

              -- Map progress to stations 1-10
              v_target_station := 1 + floor(v_progress_pct * 9)::INTEGER;

              -- For QC Hold, prefer inspection stations (5 or 10)
              IF v_mod_status = 'QC Hold' THEN
                SELECT id INTO v_mod_station_id
                FROM station_templates
                WHERE (factory_id = v_factory.id OR factory_id IS NULL)
                  AND requires_inspection = true
                  AND is_active = true
                ORDER BY random()
                LIMIT 1;
              ELSE
                -- In Progress or In Queue - use calculated station
                SELECT id INTO v_mod_station_id
                FROM station_templates
                WHERE (factory_id = v_factory.id OR factory_id IS NULL)
                  AND order_num = v_target_station
                  AND is_active = true
                LIMIT 1;

                -- Fallback if exact station not found
                IF v_mod_station_id IS NULL THEN
                  SELECT id INTO v_mod_station_id
                  FROM station_templates
                  WHERE (factory_id = v_factory.id OR factory_id IS NULL)
                    AND is_active = true
                  ORDER BY ABS(order_num - v_target_station)
                  LIMIT 1;
                END IF;
              END IF;
            END IF;

            INSERT INTO modules (
              project_id, factory_id, serial_number, name, sequence_number,
              status, current_station_id, scheduled_start, scheduled_end,
              actual_start, actual_end,
              building_category, is_rush, module_width, module_length
            )
            VALUES (
              v_project_id,
              v_factory.id,
              v_factory.code || '-' || to_char(v_project_start, 'YY') || '-M' || LPAD(j::TEXT, 2, '0'),
              'Module ' || chr(64 + j) || ' - ' || v_module_names[1 + floor(random() * array_length(v_module_names, 1))::INTEGER],
              j,
              v_mod_status,
              v_mod_station_id,
              v_scheduled_start,
              v_scheduled_end,
              v_actual_start,
              v_actual_end,
              CASE floor(random() * 4)::INTEGER
                WHEN 0 THEN 'stock'
                WHEN 1 THEN 'fleet'
                WHEN 2 THEN 'government'
                ELSE 'custom'
              END,
              random() < 0.1,  -- 10% rush
              12 + floor(random() * 4)::INTEGER,  -- 12-15 ft width
              40 + floor(random() * 32)::INTEGER  -- 40-72 ft length
            )
            RETURNING id INTO v_module_id;

            v_total_modules := v_total_modules + 1;

            -- Create QC records for completed modules using OFFICIAL statuses
            IF v_mod_status IN ('Completed', 'Staged', 'Shipped') THEN
              DECLARE
                v_qc_station RECORD;
                v_inspector_id UUID;
                v_qc_status TEXT;
              BEGIN
                SELECT id INTO v_inspector_id
                FROM workers
                WHERE factory_id = v_factory.id AND title LIKE '%QC%' AND is_active = true
                ORDER BY random()
                LIMIT 1;

                FOR v_qc_station IN
                  SELECT id, name FROM station_templates
                  WHERE (factory_id = v_factory.id OR factory_id IS NULL)
                  AND requires_inspection = true
                  ORDER BY order_num
                LOOP
                  -- Use official QC statuses with weighted distribution
                  v_qc_status := v_qc_statuses[1 + floor(random() * array_length(v_qc_statuses, 1))::INTEGER];

                  INSERT INTO qc_records (
                    module_id, station_id, factory_id, inspector_id,
                    status, passed, score, inspected_at
                  )
                  VALUES (
                    v_module_id,
                    v_qc_station.id,
                    v_factory.id,
                    v_inspector_id,
                    v_qc_status,
                    v_qc_status IN ('Passed', 'Conditional'),
                    CASE
                      WHEN v_qc_status = 'Passed' THEN 85 + floor(random() * 16)::INTEGER
                      WHEN v_qc_status = 'Conditional' THEN 70 + floor(random() * 15)::INTEGER
                      ELSE 40 + floor(random() * 30)::INTEGER
                    END,
                    v_scheduled_end - (random() * 5)::INTEGER
                  )
                  ON CONFLICT DO NOTHING;
                END LOOP;
              END;
            END IF;

            -- Create station assignment if in progress
            IF v_mod_status = 'In Progress' AND v_mod_station_id IS NOT NULL THEN
              DECLARE
                v_lead_worker_id UUID;
              BEGIN
                SELECT id INTO v_lead_worker_id
                FROM workers
                WHERE factory_id = v_factory.id AND is_lead = true AND is_active = true
                ORDER BY random()
                LIMIT 1;

                INSERT INTO station_assignments (
                  module_id, station_id, factory_id, lead_id,
                  start_time, status, estimated_hours
                )
                VALUES (
                  v_module_id,
                  v_mod_station_id,
                  v_factory.id,
                  v_lead_worker_id,
                  NOW() - (random() * INTERVAL '4 hours'),
                  'In Progress',
                  4 + random() * 8
                )
                ON CONFLICT DO NOTHING;
              END;
            END IF;

          END;  -- module block
        END LOOP;  -- modules

        -- ==================================================================
        -- 3.5: CREATE TASKS FOR THIS PROJECT (OFFICIAL STATUSES)
        -- ==================================================================

        FOR k IN 1..(5 + floor(random() * 10)::INTEGER)
        LOOP
          DECLARE
            v_task_status TEXT;
            v_due_date DATE;
            v_assignee_id UUID;
          BEGIN
            -- Use official task statuses with weighted distribution
            v_task_status := v_task_statuses[1 + floor(random() * array_length(v_task_statuses, 1))::INTEGER];
            v_due_date := v_project_start + floor(random() * 60)::INTEGER;

            SELECT id INTO v_assignee_id
            FROM users
            WHERE role IN ('PM', 'Director', 'PC') AND is_active = true
            ORDER BY random()
            LIMIT 1;

            INSERT INTO tasks (
              project_id, title, description, status, priority,
              due_date, assignee_id, internal_owner_id, task_type
            )
            VALUES (
              v_project_id,
              CASE floor(random() * 10)::INTEGER
                WHEN 0 THEN 'Review floor plan revisions'
                WHEN 1 THEN 'Coordinate MEP installation'
                WHEN 2 THEN 'Schedule state inspection'
                WHEN 3 THEN 'Order long-lead items'
                WHEN 4 THEN 'Client design approval'
                WHEN 5 THEN 'Update delivery schedule'
                WHEN 6 THEN 'Verify permit status'
                WHEN 7 THEN 'Review change order'
                WHEN 8 THEN 'Final walkthrough prep'
                ELSE 'Quality check documentation'
              END,
              'Task created for project management tracking.',
              v_task_status,
              CASE floor(random() * 4)::INTEGER
                WHEN 0 THEN 'Critical'
                WHEN 1 THEN 'High'
                WHEN 2 THEN 'Medium'
                ELSE 'Low'
              END,
              v_due_date,
              v_assignee_id,
              v_pm_id,
              'pm_task'
            );

            v_total_tasks := v_total_tasks + 1;
          END;
        END LOOP;  -- tasks

        -- ==================================================================
        -- 3.6: CREATE RFIs FOR THIS PROJECT (OFFICIAL STATUSES)
        -- ==================================================================

        FOR k IN 1..(2 + floor(random() * 5)::INTEGER)
        LOOP
          DECLARE
            v_rfi_status TEXT;
          BEGIN
            -- Use official RFI statuses
            v_rfi_status := v_rfi_statuses[1 + floor(random() * array_length(v_rfi_statuses, 1))::INTEGER];

            INSERT INTO rfis (
              project_id, rfi_number, number, subject, question, answer, status, priority,
              date_sent, due_date, is_external, sent_to, created_by
            )
            VALUES (
              v_project_id,
              v_factory.code || '-' || to_char(v_project_start, 'YY') || '-RFI-' || LPAD(k::TEXT, 3, '0'),
              k,
              CASE floor(random() * 8)::INTEGER
                WHEN 0 THEN 'Electrical panel location clarification'
                WHEN 1 THEN 'HVAC duct routing confirmation'
                WHEN 2 THEN 'Window specifications verification'
                WHEN 3 THEN 'Foundation detail question'
                WHEN 4 THEN 'Fire sprinkler layout'
                WHEN 5 THEN 'ADA compliance verification'
                WHEN 6 THEN 'Structural connection detail'
                ELSE 'Material substitution approval'
              END,
              'Please clarify the design intent for this item. Need response before proceeding with fabrication.',
              CASE WHEN v_rfi_status IN ('Answered', 'Closed') THEN 'Per engineering review, proceed as detailed in the updated drawings.' ELSE NULL END,
              v_rfi_status,
              CASE floor(random() * 3)::INTEGER
                WHEN 0 THEN 'High'
                WHEN 1 THEN 'Medium'
                ELSE 'Low'
              END,
              v_project_start - floor(random() * 7)::INTEGER,
              v_project_start + floor(random() * 30)::INTEGER,
              random() < 0.5,
              CASE WHEN random() < 0.5 THEN 'Engineering Team' ELSE 'Client' END,
              v_pm_id
            );

            v_total_rfis := v_total_rfis + 1;
          END;
        END LOOP;  -- rfis

        -- ==================================================================
        -- 3.7: CREATE SUBMITTALS FOR THIS PROJECT (OFFICIAL STATUSES)
        -- ==================================================================

        FOR k IN 1..(3 + floor(random() * 6)::INTEGER)
        LOOP
          DECLARE
            v_sub_status TEXT;
          BEGIN
            -- Use official submittal statuses
            v_sub_status := v_submittal_statuses[1 + floor(random() * array_length(v_submittal_statuses, 1))::INTEGER];

            INSERT INTO submittals (
              project_id, submittal_number, title, submittal_type, status,
              manufacturer, model_number, date_submitted, due_date
            )
            VALUES (
              v_project_id,
              v_factory.code || '-' || to_char(v_project_start, 'YY') || '-SUB-' || LPAD(k::TEXT, 3, '0'),
              CASE floor(random() * 10)::INTEGER
                WHEN 0 THEN 'Exterior Siding Samples'
                WHEN 1 THEN 'Electrical Fixtures'
                WHEN 2 THEN 'HVAC Equipment'
                WHEN 3 THEN 'Plumbing Fixtures'
                WHEN 4 THEN 'Flooring Materials'
                WHEN 5 THEN 'Door Hardware'
                WHEN 6 THEN 'Window Schedule'
                WHEN 7 THEN 'Paint Colors'
                WHEN 8 THEN 'Roofing Materials'
                ELSE 'Cabinet Specifications'
              END,
              CASE floor(random() * 3)::INTEGER
                WHEN 0 THEN 'Product Data'
                WHEN 1 THEN 'Shop Drawings'
                ELSE 'Samples'
              END,
              v_sub_status,
              CASE floor(random() * 5)::INTEGER
                WHEN 0 THEN 'Carrier'
                WHEN 1 THEN 'Milgard'
                WHEN 2 THEN 'Shaw'
                WHEN 3 THEN 'Armstrong'
                ELSE 'Kohler'
              END,
              'Model-' || floor(random() * 9000 + 1000)::TEXT,
              v_project_start + floor(random() * 14)::INTEGER,
              v_project_start + floor(random() * 21)::INTEGER
            );

            v_total_submittals := v_total_submittals + 1;
          END;
        END LOOP;  -- submittals

      END;  -- project block
    END LOOP;  -- projects

    RAISE NOTICE '  [OK] Projects, modules, tasks, RFIs, submittals created';

    -- ======================================================================
    -- 3.8: CREATE WORKER SHIFTS (90 days of history)
    -- ======================================================================

    DECLARE
      v_shift_date DATE;
      v_worker RECORD;
      v_clock_in TIMESTAMPTZ;
      v_clock_out TIMESTAMPTZ;
      v_shifts_created INTEGER := 0;
    BEGIN
      FOR v_shift_date IN SELECT generate_series(v_start_date, v_today, '1 day'::INTERVAL)::DATE
      LOOP
        -- Skip weekends
        IF EXTRACT(DOW FROM v_shift_date) IN (0, 6) THEN
          CONTINUE;
        END IF;

        -- Create shifts for 70-90% of workers
        FOR v_worker IN
          SELECT id, hourly_rate
          FROM workers
          WHERE factory_id = v_factory.id AND is_active = true
          ORDER BY random()
          LIMIT floor(random() * 5 + 15)::INTEGER  -- 15-20 workers per day
        LOOP
          v_clock_in := v_shift_date + INTERVAL '6 hours' + (random() * INTERVAL '30 minutes');

          IF v_shift_date < v_today THEN
            v_clock_out := v_clock_in + INTERVAL '8 hours' + (random() * INTERVAL '2 hours');
          ELSE
            v_clock_out := NULL;  -- Today's shifts may still be active
          END IF;

          INSERT INTO worker_shifts (
            worker_id, factory_id, clock_in, clock_out, source, status,
            hours_regular, hours_ot, total_hours, rate_applied
          )
          VALUES (
            v_worker.id,
            v_factory.id,
            v_clock_in,
            v_clock_out,
            CASE floor(random() * 3)::INTEGER
              WHEN 0 THEN 'kiosk'
              WHEN 1 THEN 'app'
              ELSE 'manual'
            END,
            CASE WHEN v_clock_out IS NULL THEN 'active' ELSE 'completed' END,
            CASE WHEN v_clock_out IS NULL THEN NULL ELSE LEAST(8, EXTRACT(EPOCH FROM (v_clock_out - v_clock_in))/3600) END,
            CASE WHEN v_clock_out IS NULL THEN NULL ELSE GREATEST(0, EXTRACT(EPOCH FROM (v_clock_out - v_clock_in))/3600 - 8) END,
            CASE WHEN v_clock_out IS NULL THEN NULL ELSE EXTRACT(EPOCH FROM (v_clock_out - v_clock_in))/3600 END,
            v_worker.hourly_rate
          )
          ON CONFLICT DO NOTHING;

          v_shifts_created := v_shifts_created + 1;
        END LOOP;
      END LOOP;

      v_total_shifts := v_total_shifts + v_shifts_created;
    END;

    RAISE NOTICE '  [OK] Worker shifts created';

    -- ======================================================================
    -- 3.9: CREATE KAIZEN SUGGESTIONS (OFFICIAL STATUSES)
    -- ======================================================================

    FOR i IN 1..(5 + floor(random() * 10)::INTEGER)
    LOOP
      DECLARE
        v_kaizen_worker_id UUID;
        v_kaizen_status TEXT;
      BEGIN
        SELECT id INTO v_kaizen_worker_id
        FROM workers
        WHERE factory_id = v_factory.id AND is_active = true
        ORDER BY random()
        LIMIT 1;

        -- Use official kaizen statuses
        v_kaizen_status := v_kaizen_statuses[1 + floor(random() * array_length(v_kaizen_statuses, 1))::INTEGER];

        INSERT INTO kaizen_suggestions (
          factory_id, worker_id, title, description, category, status,
          is_anonymous, estimated_savings, created_at
        )
        VALUES (
          v_factory.id,
          v_kaizen_worker_id,
          CASE floor(random() * 8)::INTEGER
            WHEN 0 THEN 'Improved tool storage layout'
            WHEN 1 THEN 'Better material staging area'
            WHEN 2 THEN 'Reduce wire waste in electrical'
            WHEN 3 THEN 'Safety guard improvement'
            WHEN 4 THEN 'Streamline QC checklist'
            WHEN 5 THEN 'Color-coded inventory bins'
            WHEN 6 THEN 'Mobile workstation design'
            ELSE 'Pre-cut lumber optimization'
          END,
          'This improvement would help increase efficiency and reduce waste in our production process.',
          CASE floor(random() * 5)::INTEGER
            WHEN 0 THEN 'efficiency'
            WHEN 1 THEN 'safety'
            WHEN 2 THEN 'quality'
            WHEN 3 THEN 'cost'
            ELSE 'other'
          END,
          v_kaizen_status,
          random() < 0.2,  -- 20% anonymous
          CASE WHEN random() < 0.5 THEN floor(random() * 5000 + 500)::NUMERIC ELSE NULL END,
          v_today - (random() * 60)::INTEGER
        )
        ON CONFLICT DO NOTHING;
      END;
    END LOOP;

    RAISE NOTICE '  [OK] Kaizen suggestions created';

    -- ======================================================================
    -- 3.10: CREATE SAFETY CHECKS (last 30 days)
    -- ======================================================================

    DECLARE
      v_check_date DATE;
      v_station RECORD;
      v_lead_id UUID;
    BEGIN
      FOR v_check_date IN SELECT generate_series(v_today - 30, v_today, '1 day'::INTERVAL)::DATE
      LOOP
        IF EXTRACT(DOW FROM v_check_date) IN (0, 6) THEN
          CONTINUE;
        END IF;

        FOR v_station IN
          SELECT id FROM station_templates
          WHERE (factory_id = v_factory.id OR factory_id IS NULL) AND is_active = true
          LIMIT 12
        LOOP
          SELECT id INTO v_lead_id
          FROM workers
          WHERE factory_id = v_factory.id AND is_lead = true AND is_active = true
          ORDER BY random()
          LIMIT 1;

          INSERT INTO safety_checks (
            factory_id, station_id, lead_worker_id, check_date,
            is_clear, delay_minutes, issue_reason, checked_at
          )
          VALUES (
            v_factory.id,
            v_station.id,
            v_lead_id,
            v_check_date,
            random() > 0.05,  -- 95% pass
            CASE WHEN random() < 0.05 THEN floor(random() * 30 + 5)::INTEGER ELSE NULL END,
            CASE WHEN random() < 0.05 THEN 'Minor safety concern addressed' ELSE NULL END,
            v_check_date + INTERVAL '6 hours 15 minutes'
          )
          ON CONFLICT (station_id, check_date) DO NOTHING;
        END LOOP;
      END LOOP;
    END;

    RAISE NOTICE '  [OK] Safety checks created';

    -- ======================================================================
    -- 3.11: CREATE TAKT EVENTS (for modules in progress)
    -- ======================================================================

    DECLARE
      v_module RECORD;
      v_expected_hours NUMERIC;
      v_actual_hours NUMERIC;
    BEGIN
      FOR v_module IN
        SELECT m.id, m.current_station_id, m.factory_id, m.scheduled_start
        FROM modules m
        WHERE m.factory_id = v_factory.id
        AND m.status IN ('In Progress', 'Completed', 'Staged', 'Shipped')
        AND m.current_station_id IS NOT NULL
        LIMIT 40
      LOOP
        v_expected_hours := 4 + random() * 8;
        v_actual_hours := v_expected_hours * (0.8 + random() * 0.6);  -- 80-140% of expected

        INSERT INTO takt_events (
          module_id, station_id, factory_id,
          expected_hours, actual_hours, gap_percent,
          is_flagged, flagged_reason,
          started_at, completed_at
        )
        VALUES (
          v_module.id,
          v_module.current_station_id,
          v_module.factory_id,
          v_expected_hours,
          v_actual_hours,
          ((v_actual_hours - v_expected_hours) / v_expected_hours * 100)::NUMERIC(5,2),
          v_actual_hours > v_expected_hours * 1.2,
          CASE WHEN v_actual_hours > v_expected_hours * 1.2 THEN 'over_threshold' ELSE NULL END,
          v_module.scheduled_start + (random() * INTERVAL '3 days'),
          v_module.scheduled_start + (random() * INTERVAL '5 days')
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END;

    RAISE NOTICE '  [OK] Takt events created';
    RAISE NOTICE '  Factory % complete', v_factory.code;

  END LOOP;  -- factories

  -- ========================================================================
  -- PART 4: FINAL SUMMARY
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'DEMO DATA GENERATION COMPLETE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Factories processed: %', v_factory_count;
  RAISE NOTICE 'Total projects created: %', v_total_projects;
  RAISE NOTICE 'Total modules created: %', v_total_modules;
  RAISE NOTICE 'Total workers created: %', v_total_workers;
  RAISE NOTICE 'Total tasks created: %', v_total_tasks;
  RAISE NOTICE 'Total RFIs created: %', v_total_rfis;
  RAISE NOTICE 'Total submittals created: %', v_total_submittals;
  RAISE NOTICE 'Total shifts created: %', v_total_shifts;
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================================
-- PART 4.5: CONSISTENCY FIXES - Applied After Main Data Generation
-- ============================================================================
-- These fixes ensure cross-entity consistency:
-- 1. Project status derived from module completion percentage
-- 2. Station assignments created for all modules at stations
-- 3. QC records exist for all modules past inspection stations
-- 4. Cross-training records for all workers in station_assignments
-- 5. Single active shift per worker validation
-- ============================================================================

DO $$
DECLARE
  v_project RECORD;
  v_module RECORD;
  v_station RECORD;
  v_worker RECORD;
  v_assignment RECORD;
  v_total_modules INTEGER;
  v_completed_modules INTEGER;
  v_staged_shipped INTEGER;
  v_new_status TEXT;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'APPLYING CONSISTENCY FIXES';
  RAISE NOTICE '============================================================';

  -- ========================================================================
  -- FIX 1: PROJECT STATUS DERIVED FROM MODULE COMPLETION
  -- ========================================================================
  -- Rule: Project is 'Completed' only when ALL modules are Staged or Shipped
  -- Rule: Project is 'Active' if any module is In Progress/In Queue/QC Hold
  -- ========================================================================

  FOR v_project IN
    SELECT id, status, module_count
    FROM projects
    WHERE status NOT IN ('Draft', 'Archived')
  LOOP
    -- Count modules by status category
    SELECT
      COUNT(*) FILTER (WHERE status IN ('Staged', 'Shipped')) AS staged_shipped,
      COUNT(*) FILTER (WHERE status = 'Completed') AS completed_only,
      COUNT(*) FILTER (WHERE status IN ('In Progress', 'In Queue', 'QC Hold', 'Rework')) AS active,
      COUNT(*) FILTER (WHERE status = 'Not Started') AS not_started,
      COUNT(*) AS total
    INTO v_staged_shipped, v_completed_modules, v_count, v_total_modules
    FROM modules
    WHERE project_id = v_project.id;

    -- Determine correct project status
    IF v_staged_shipped = v_total_modules AND v_total_modules > 0 THEN
      v_new_status := 'Completed';
    ELSIF v_count > 0 OR v_completed_modules > 0 THEN
      v_new_status := 'Active';
    ELSIF v_total_modules = 0 OR v_total_modules = (SELECT COUNT(*) FROM modules WHERE project_id = v_project.id AND status = 'Not Started') THEN
      v_new_status := 'Draft';
    ELSE
      v_new_status := 'Active';
    END IF;

    -- Update if different
    IF v_new_status <> v_project.status THEN
      UPDATE projects SET status = v_new_status, updated_at = NOW()
      WHERE id = v_project.id;
    END IF;
  END LOOP;

  RAISE NOTICE '  [OK] Project statuses aligned with module completion';

  -- ========================================================================
  -- FIX 2: STATION ASSIGNMENTS FOR ALL IN-PROGRESS MODULES
  -- ========================================================================
  -- Rule: Every module with status 'In Progress' at a station must have
  --       a corresponding station_assignment record with matching status
  -- ========================================================================

  FOR v_module IN
    SELECT m.id, m.status, m.current_station_id, m.factory_id, m.actual_start
    FROM modules m
    WHERE m.status IN ('In Progress', 'In Queue', 'QC Hold')
      AND m.current_station_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM station_assignments sa
        WHERE sa.module_id = m.id
          AND sa.station_id = m.current_station_id
          AND sa.status IN ('In Progress', 'Pending', 'QC Pending')
      )
  LOOP
    -- Get a lead worker from this factory
    DECLARE
      v_lead_id UUID;
      v_assign_status TEXT;
    BEGIN
      SELECT id INTO v_lead_id
      FROM workers
      WHERE factory_id = v_module.factory_id AND is_lead = true AND is_active = true
      ORDER BY random()
      LIMIT 1;

      -- Map module status to assignment status
      v_assign_status := CASE v_module.status
        WHEN 'In Progress' THEN 'In Progress'
        WHEN 'In Queue' THEN 'Pending'
        WHEN 'QC Hold' THEN 'QC Pending'
        ELSE 'Pending'
      END;

      INSERT INTO station_assignments (
        module_id, station_id, factory_id, lead_id,
        start_time, status, estimated_hours
      )
      VALUES (
        v_module.id,
        v_module.current_station_id,
        v_module.factory_id,
        v_lead_id,
        COALESCE(v_module.actual_start, NOW() - INTERVAL '2 hours'),
        v_assign_status,
        6 + random() * 6
      )
      ON CONFLICT (module_id, station_id) DO UPDATE
      SET status = EXCLUDED.status;
    END;
  END LOOP;

  RAISE NOTICE '  [OK] Station assignments synced with module current_station';

  -- ========================================================================
  -- FIX 3: QC RECORDS FOR MODULES PAST INSPECTION STATIONS
  -- ========================================================================
  -- Rule: If module.current_station.order_num > inspection_station.order_num,
  --       then a passing QC record must exist for that inspection station
  -- Inspection stations: 5, 6, 7 (requires_inspection), 8, 10 (is_inspection_station)
  -- ========================================================================

  FOR v_module IN
    SELECT
      m.id AS module_id,
      m.factory_id,
      m.scheduled_end,
      st.order_num AS current_order
    FROM modules m
    JOIN station_templates st ON m.current_station_id = st.id
    WHERE m.status NOT IN ('Not Started', 'In Queue')
  LOOP
    -- For each inspection station with order_num < module's current station
    FOR v_station IN
      SELECT st.id, st.order_num, st.name
      FROM station_templates st
      WHERE (st.factory_id = v_module.factory_id OR st.factory_id IS NULL)
        AND (st.requires_inspection = true OR st.is_inspection_station = true)
        AND st.order_num < v_module.current_order
        AND st.is_active = true
    LOOP
      -- Check if QC record exists
      IF NOT EXISTS (
        SELECT 1 FROM qc_records qc
        WHERE qc.module_id = v_module.module_id
          AND qc.station_id = v_station.id
          AND qc.passed = true
      ) THEN
        -- Create passing QC record
        DECLARE
          v_inspector_id UUID;
        BEGIN
          SELECT id INTO v_inspector_id
          FROM workers
          WHERE factory_id = v_module.factory_id
            AND (title LIKE '%QC%' OR title LIKE '%Inspector%' OR is_lead = true)
            AND is_active = true
          ORDER BY random()
          LIMIT 1;

          INSERT INTO qc_records (
            module_id, station_id, factory_id, inspector_id,
            status, passed, score, inspected_at
          )
          VALUES (
            v_module.module_id,
            v_station.id,
            v_module.factory_id,
            v_inspector_id,
            'Passed',
            true,
            85 + floor(random() * 16)::INTEGER,
            v_module.scheduled_end - (random() * 5)::INTEGER
          )
          ON CONFLICT DO NOTHING;
        END;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  [OK] QC records created for modules past inspection stations';

  -- ========================================================================
  -- FIX 4: CROSS-TRAINING FOR WORKERS IN STATION ASSIGNMENTS
  -- ========================================================================
  -- Rule: Every worker assigned to a station_assignment (lead_id or crew_ids)
  --       must have cross_training or primary_station_id for that station
  -- ========================================================================

  -- For lead workers in assignments
  FOR v_assignment IN
    SELECT DISTINCT sa.lead_id AS worker_id, sa.station_id, sa.factory_id
    FROM station_assignments sa
    WHERE sa.lead_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM cross_training ct
        WHERE ct.worker_id = sa.lead_id
          AND ct.station_id = sa.station_id
          AND ct.is_active = true
      )
      AND NOT EXISTS (
        SELECT 1 FROM workers w
        WHERE w.id = sa.lead_id
          AND w.primary_station_id = sa.station_id
      )
  LOOP
    INSERT INTO cross_training (
      worker_id, station_id, factory_id,
      certified_at, proficiency_level, is_active
    )
    VALUES (
      v_assignment.worker_id,
      v_assignment.station_id,
      v_assignment.factory_id,
      CURRENT_DATE - floor(random() * 180)::INTEGER,
      CASE floor(random() * 2)::INTEGER
        WHEN 0 THEN 'Intermediate'
        ELSE 'Expert'
      END,
      true
    )
    ON CONFLICT (worker_id, station_id) DO UPDATE
    SET is_active = true;
  END LOOP;

  RAISE NOTICE '  [OK] Cross-training records created for assigned workers';

  -- ========================================================================
  -- FIX 5: SINGLE ACTIVE SHIFT PER WORKER
  -- ========================================================================
  -- Rule: Each worker can only have ONE active shift (clock_out IS NULL)
  -- Fix: Complete any duplicate active shifts keeping the most recent
  -- ========================================================================

  WITH ranked_active_shifts AS (
    SELECT
      id,
      worker_id,
      clock_in,
      ROW_NUMBER() OVER (PARTITION BY worker_id ORDER BY clock_in DESC) AS rn
    FROM worker_shifts
    WHERE clock_out IS NULL AND status = 'active'
  )
  UPDATE worker_shifts ws
  SET
    clock_out = ws.clock_in + INTERVAL '8 hours',
    status = 'completed',
    hours_regular = 8,
    hours_ot = 0,
    total_hours = 8
  FROM ranked_active_shifts ras
  WHERE ws.id = ras.id AND ras.rn > 1;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RAISE NOTICE '  [OK] Fixed % duplicate active shifts', v_count;
  ELSE
    RAISE NOTICE '  [OK] No duplicate active shifts found';
  END IF;

  -- ========================================================================
  -- FIX 6: HISTORICAL STATION ASSIGNMENTS FOR COMPLETED MODULES
  -- ========================================================================
  -- Rule: Completed/Staged/Shipped modules should have station_assignment
  --       records showing their path through the production line
  -- ========================================================================

  FOR v_module IN
    SELECT m.id, m.factory_id, m.current_station_id, m.actual_start, m.actual_end
    FROM modules m
    WHERE m.status IN ('Completed', 'Staged', 'Shipped')
      AND m.current_station_id IS NOT NULL
    LIMIT 100  -- Limit to prevent excessive processing
  LOOP
    -- Create completed station assignments for stations 1 through current
    FOR v_station IN
      SELECT st.id, st.order_num
      FROM station_templates st
      WHERE (st.factory_id = v_module.factory_id OR st.factory_id IS NULL)
        AND st.is_active = true
        AND st.order_num <= COALESCE(
          (SELECT order_num FROM station_templates WHERE id = v_module.current_station_id),
          12
        )
      ORDER BY st.order_num
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM station_assignments
        WHERE module_id = v_module.id AND station_id = v_station.id
      ) THEN
        DECLARE
          v_lead_id UUID;
        BEGIN
          SELECT id INTO v_lead_id
          FROM workers
          WHERE factory_id = v_module.factory_id AND is_lead = true AND is_active = true
          ORDER BY random()
          LIMIT 1;

          INSERT INTO station_assignments (
            module_id, station_id, factory_id, lead_id,
            start_time, end_time, status, estimated_hours, actual_hours, qc_passed
          )
          VALUES (
            v_module.id,
            v_station.id,
            v_module.factory_id,
            v_lead_id,
            COALESCE(v_module.actual_start, NOW() - INTERVAL '7 days') + (v_station.order_num - 1) * INTERVAL '8 hours',
            COALESCE(v_module.actual_start, NOW() - INTERVAL '7 days') + v_station.order_num * INTERVAL '8 hours',
            'Completed',
            6 + random() * 4,
            5 + random() * 5,
            true
          )
          ON CONFLICT (module_id, station_id) DO NOTHING;
        END;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '  [OK] Historical station assignments created for completed modules';

  RAISE NOTICE '';
  RAISE NOTICE 'CONSISTENCY FIXES COMPLETE';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- PART 5: COMPREHENSIVE VERIFICATION (DEBUG_TEST_GUIDE Compliant)
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
  v_errors INTEGER := 0;
  v_invalid_statuses TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'DATA VERIFICATION (DEBUG_TEST_GUIDE Phase 1.1 Compliance)';
  RAISE NOTICE '============================================================';

  -- ========================================================================
  -- 5.1: VERIFY STATUS VALUES ARE OFFICIAL
  -- ========================================================================

  -- Check Task statuses
  SELECT string_agg(DISTINCT status, ', ') INTO v_invalid_statuses
  FROM tasks
  WHERE status NOT IN ('Not Started', 'In Progress', 'Awaiting Response', 'Completed', 'Cancelled');

  IF v_invalid_statuses IS NOT NULL THEN
    RAISE WARNING 'INVALID TASK STATUSES FOUND: %', v_invalid_statuses;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '[OK] All task statuses are valid';
  END IF;

  -- Check Project statuses
  SELECT string_agg(DISTINCT status, ', ') INTO v_invalid_statuses
  FROM projects
  WHERE status NOT IN ('Draft', 'Active', 'On Hold', 'Completed', 'Archived');

  IF v_invalid_statuses IS NOT NULL THEN
    RAISE WARNING 'INVALID PROJECT STATUSES FOUND: %', v_invalid_statuses;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '[OK] All project statuses are valid';
  END IF;

  -- Check RFI statuses
  SELECT string_agg(DISTINCT status, ', ') INTO v_invalid_statuses
  FROM rfis
  WHERE status NOT IN ('Draft', 'Open', 'Answered', 'Closed');

  IF v_invalid_statuses IS NOT NULL THEN
    RAISE WARNING 'INVALID RFI STATUSES FOUND: %', v_invalid_statuses;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '[OK] All RFI statuses are valid';
  END IF;

  -- Check Submittal statuses
  SELECT string_agg(DISTINCT status, ', ') INTO v_invalid_statuses
  FROM submittals
  WHERE status NOT IN ('Pending', 'Under Review', 'Approved', 'Approved as Noted', 'Rejected', 'Resubmit');

  IF v_invalid_statuses IS NOT NULL THEN
    RAISE WARNING 'INVALID SUBMITTAL STATUSES FOUND: %', v_invalid_statuses;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '[OK] All submittal statuses are valid';
  END IF;

  -- Check Module statuses
  SELECT string_agg(DISTINCT status, ', ') INTO v_invalid_statuses
  FROM modules
  WHERE status NOT IN ('Not Started', 'In Queue', 'In Progress', 'QC Hold', 'Completed', 'Staged', 'Shipped');

  IF v_invalid_statuses IS NOT NULL THEN
    RAISE WARNING 'INVALID MODULE STATUSES FOUND: %', v_invalid_statuses;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '[OK] All module statuses are valid';
  END IF;

  -- Check QC Record statuses
  SELECT string_agg(DISTINCT status, ', ') INTO v_invalid_statuses
  FROM qc_records
  WHERE status NOT IN ('Pending', 'Passed', 'Failed', 'Conditional');

  IF v_invalid_statuses IS NOT NULL THEN
    RAISE WARNING 'INVALID QC RECORD STATUSES FOUND: %', v_invalid_statuses;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '[OK] All QC record statuses are valid';
  END IF;

  -- Check Kaizen statuses
  SELECT string_agg(DISTINCT status, ', ') INTO v_invalid_statuses
  FROM kaizen_suggestions
  WHERE status NOT IN ('Submitted', 'Under Review', 'Approved', 'Implemented', 'Rejected');

  IF v_invalid_statuses IS NOT NULL THEN
    RAISE WARNING 'INVALID KAIZEN STATUSES FOUND: %', v_invalid_statuses;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '[OK] All kaizen statuses are valid';
  END IF;

  -- ========================================================================
  -- 5.2: VERIFY FOREIGN KEY INTEGRITY
  -- ========================================================================

  -- Check tasks have valid projects
  SELECT COUNT(*) INTO v_count
  FROM tasks t
  WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = t.project_id);

  IF v_count > 0 THEN
    RAISE WARNING 'ORPHAN TASKS FOUND: % tasks without valid project', v_count;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '[OK] All tasks have valid projects';
  END IF;

  -- Check modules have valid projects
  SELECT COUNT(*) INTO v_count
  FROM modules m
  WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = m.project_id);

  IF v_count > 0 THEN
    RAISE WARNING 'ORPHAN MODULES FOUND: % modules without valid project', v_count;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '[OK] All modules have valid projects';
  END IF;

  -- Check workers have valid factories
  SELECT COUNT(*) INTO v_count
  FROM workers w
  WHERE NOT EXISTS (SELECT 1 FROM factories f WHERE f.id = w.factory_id);

  IF v_count > 0 THEN
    RAISE WARNING 'ORPHAN WORKERS FOUND: % workers without valid factory', v_count;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '[OK] All workers have valid factories';
  END IF;

  -- ========================================================================
  -- 5.3: VERIFY DATA DISTRIBUTION
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'DATA COUNTS:';

  SELECT COUNT(*) INTO v_count FROM projects;
  RAISE NOTICE '  Projects: %', v_count;

  SELECT COUNT(*) INTO v_count FROM modules;
  RAISE NOTICE '  Modules: %', v_count;

  SELECT COUNT(*) INTO v_count FROM workers;
  RAISE NOTICE '  Workers: %', v_count;

  SELECT COUNT(*) INTO v_count FROM worker_shifts;
  RAISE NOTICE '  Worker Shifts: %', v_count;

  SELECT COUNT(*) INTO v_count FROM tasks;
  RAISE NOTICE '  Tasks: %', v_count;

  SELECT COUNT(*) INTO v_count FROM rfis;
  RAISE NOTICE '  RFIs: %', v_count;

  SELECT COUNT(*) INTO v_count FROM submittals;
  RAISE NOTICE '  Submittals: %', v_count;

  SELECT COUNT(*) INTO v_count FROM qc_records;
  RAISE NOTICE '  QC Records: %', v_count;

  SELECT COUNT(*) INTO v_count FROM kaizen_suggestions;
  RAISE NOTICE '  Kaizen Suggestions: %', v_count;

  SELECT COUNT(*) INTO v_count FROM safety_checks;
  RAISE NOTICE '  Safety Checks: %', v_count;

  SELECT COUNT(*) INTO v_count FROM cross_training;
  RAISE NOTICE '  Cross Training Records: %', v_count;

  SELECT COUNT(*) INTO v_count FROM takt_events;
  RAISE NOTICE '  Takt Events: %', v_count;

  -- ========================================================================
  -- 5.4: VERIFY STATUS DISTRIBUTION
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'STATUS DISTRIBUTION:';

  RAISE NOTICE '  Tasks:';
  FOR v_invalid_statuses, v_count IN
    SELECT status, COUNT(*) FROM tasks GROUP BY status ORDER BY status
  LOOP
    RAISE NOTICE '    - %: %', v_invalid_statuses, v_count;
  END LOOP;

  RAISE NOTICE '  Projects:';
  FOR v_invalid_statuses, v_count IN
    SELECT status, COUNT(*) FROM projects GROUP BY status ORDER BY status
  LOOP
    RAISE NOTICE '    - %: %', v_invalid_statuses, v_count;
  END LOOP;

  RAISE NOTICE '  Modules:';
  FOR v_invalid_statuses, v_count IN
    SELECT status, COUNT(*) FROM modules GROUP BY status ORDER BY status
  LOOP
    RAISE NOTICE '    - %: %', v_invalid_statuses, v_count;
  END LOOP;

  -- ========================================================================
  -- 5.5: VERIFY CROSS-ENTITY CONSISTENCY RULES
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'CONSISTENCY RULE VERIFICATION:';

  -- RULE 1: No modules "In Progress" with future scheduled_start
  SELECT COUNT(*) INTO v_count
  FROM modules
  WHERE status IN ('In Progress', 'QC Hold', 'Rework')
    AND scheduled_start > CURRENT_DATE;

  IF v_count > 0 THEN
    RAISE WARNING '  [FAIL] % modules have In Progress status with future scheduled_start', v_count;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '  [OK] No In Progress modules with future dates';
  END IF;

  -- RULE 2: No modules "Not Started" with past scheduled_end (by > 7 days)
  SELECT COUNT(*) INTO v_count
  FROM modules
  WHERE status = 'Not Started'
    AND scheduled_end < CURRENT_DATE - 7;

  IF v_count > 0 THEN
    RAISE WARNING '  [FAIL] % modules are Not Started but past due by >7 days', v_count;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '  [OK] No overdue Not Started modules';
  END IF;

  -- RULE 3: Projects marked Completed should have all modules Staged/Shipped
  SELECT COUNT(*) INTO v_count
  FROM projects p
  WHERE p.status = 'Completed'
    AND EXISTS (
      SELECT 1 FROM modules m
      WHERE m.project_id = p.id
        AND m.status NOT IN ('Staged', 'Shipped')
    );

  IF v_count > 0 THEN
    RAISE WARNING '  [FAIL] % Completed projects have non-shipped modules', v_count;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '  [OK] All Completed projects have shipped/staged modules';
  END IF;

  -- RULE 4: In Progress modules should have station_assignments
  SELECT COUNT(*) INTO v_count
  FROM modules m
  WHERE m.status = 'In Progress'
    AND m.current_station_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM station_assignments sa
      WHERE sa.module_id = m.id AND sa.station_id = m.current_station_id
    );

  IF v_count > 0 THEN
    RAISE WARNING '  [FAIL] % In Progress modules missing station_assignments', v_count;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '  [OK] All In Progress modules have station_assignments';
  END IF;

  -- RULE 5: Workers should only have ONE active shift
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT worker_id, COUNT(*) as active_count
    FROM worker_shifts
    WHERE clock_out IS NULL AND status = 'active'
    GROUP BY worker_id
    HAVING COUNT(*) > 1
  ) dups;

  IF v_count > 0 THEN
    RAISE WARNING '  [FAIL] % workers have multiple active shifts', v_count;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '  [OK] No workers with multiple active shifts';
  END IF;

  -- RULE 6: Shifts should not be on weekends (check that we're not generating weekend shifts)
  SELECT COUNT(*) INTO v_count
  FROM worker_shifts
  WHERE EXTRACT(DOW FROM clock_in::DATE) IN (0, 6);

  IF v_count > 0 THEN
    RAISE WARNING '  [WARN] % shifts on weekends (may be intentional overtime)', v_count;
    -- Not incrementing errors as weekend overtime might be valid
  ELSE
    RAISE NOTICE '  [OK] No shifts on weekends';
  END IF;

  -- RULE 7: Modules past inspection stations should have QC records
  SELECT COUNT(*) INTO v_count
  FROM modules m
  JOIN station_templates st ON m.current_station_id = st.id
  WHERE m.status IN ('Completed', 'Staged', 'Shipped')
    AND st.order_num > 8  -- Past in-wall inspection
    AND NOT EXISTS (
      SELECT 1 FROM qc_records qc
      WHERE qc.module_id = m.id AND qc.passed = true
    );

  IF v_count > 0 THEN
    RAISE WARNING '  [FAIL] % completed modules missing QC records', v_count;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '  [OK] All completed modules have QC records';
  END IF;

  -- RULE 8: Workers in station_assignments should have certification
  SELECT COUNT(*) INTO v_count
  FROM station_assignments sa
  WHERE sa.lead_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM cross_training ct
      WHERE ct.worker_id = sa.lead_id
        AND ct.station_id = sa.station_id
        AND ct.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM workers w
      WHERE w.id = sa.lead_id
        AND w.primary_station_id = sa.station_id
    );

  IF v_count > 0 THEN
    RAISE WARNING '  [FAIL] % station assignments have uncertified lead workers', v_count;
    v_errors := v_errors + 1;
  ELSE
    RAISE NOTICE '  [OK] All assigned workers have certifications';
  END IF;

  -- ========================================================================
  -- 5.6: FINAL RESULT
  -- ========================================================================

  RAISE NOTICE '';
  IF v_errors = 0 THEN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'VERIFICATION PASSED - All data is valid and consistent';
    RAISE NOTICE '============================================================';
  ELSE
    RAISE WARNING '============================================================';
    RAISE WARNING 'VERIFICATION FAILED - % errors found', v_errors;
    RAISE WARNING '============================================================';
  END IF;

END $$;

-- ============================================================================
-- PART 6: CLEANUP HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS demo_random_date(DATE, DATE);
DROP FUNCTION IF EXISTS demo_random_timestamp(DATE, DATE);

-- ============================================================================
-- END OF DEBUG_COMPLIANT DEMO DATA SCRIPT
-- ============================================================================
