-- ============================================================================
-- COMPREHENSIVE DEMO DATA - January 2026
-- ============================================================================
-- Complete demo data refresh for all features including:
-- - Projects, Tasks, RFIs, Submittals (Project Management)
-- - Modules, Workers, Shifts, QC Records (PGM System)
-- - Kaizen, Cross-Training, Safety Checks, Takt Events (Efficiency Tools)
--
-- PRESERVES: Users, Factories, Station Templates
-- DELETES: All other demo data for clean recreation
--
-- Run this file to completely refresh demo data with 90 days of history.
--
-- Created: January 16, 2026
-- ============================================================================

-- ============================================================================
-- PART 1: CLEAR EXISTING DATA (Preserving Users/Factories/Station Templates)
-- ============================================================================

BEGIN;

-- PGM Efficiency Tables (depends on modules/workers)
TRUNCATE TABLE five_s_audits CASCADE;
TRUNCATE TABLE safety_checks CASCADE;
TRUNCATE TABLE cross_training CASCADE;
TRUNCATE TABLE kaizen_suggestions CASCADE;
TRUNCATE TABLE takt_events CASCADE;
TRUNCATE TABLE calendar_audit CASCADE;

-- PGM Core Tables
TRUNCATE TABLE qc_records CASCADE;
TRUNCATE TABLE worker_shifts CASCADE;
TRUNCATE TABLE station_assignments CASCADE;
TRUNCATE TABLE long_lead_items CASCADE;
TRUNCATE TABLE inspection_rules CASCADE;

-- Delete modules (keeps station_templates and workers for now)
TRUNCATE TABLE modules CASCADE;

-- Workers (recreate fresh)
TRUNCATE TABLE workers CASCADE;

-- PM Tables
DELETE FROM file_attachments WHERE 1=1;
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE rfis CASCADE;
TRUNCATE TABLE submittals CASCADE;
TRUNCATE TABLE change_orders CASCADE;
TRUNCATE TABLE project_logs CASCADE;

-- Projects - keep structure but clear
DELETE FROM projects WHERE 1=1;

-- Directory contacts (recreate)
DELETE FROM directory_contacts WHERE 1=1;

-- Plant config (recreate per factory)
TRUNCATE TABLE plant_config CASCADE;

COMMIT;

-- ============================================================================
-- PART 2: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Random date within range
CREATE OR REPLACE FUNCTION random_date(start_date DATE, end_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN start_date + floor(random() * (end_date - start_date + 1))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Random timestamp within date range
CREATE OR REPLACE FUNCTION random_timestamp(start_date DATE, end_date DATE)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN (start_date + floor(random() * (end_date - start_date + 1))::INTEGER)::TIMESTAMP
         + (floor(random() * 8) + 6) * INTERVAL '1 hour'
         + floor(random() * 60) * INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 3: CONFIGURATION VARIABLES
-- ============================================================================

DO $$
DECLARE
  -- Date ranges (90 days of history)
  v_start_date DATE := CURRENT_DATE - INTERVAL '90 days';
  v_end_date DATE := CURRENT_DATE + INTERVAL '30 days';
  v_today DATE := CURRENT_DATE;

  -- Factory cursor
  v_factory RECORD;
  v_factory_count INTEGER := 0;

  -- Counters
  v_project_count INTEGER := 0;
  v_module_count INTEGER := 0;
  v_worker_count INTEGER := 0;

  -- IDs for relationships
  v_project_id UUID;
  v_module_id UUID;
  v_worker_id UUID;
  v_station_id UUID;
  v_user_id UUID;

  -- Worker names for variety
  v_first_names TEXT[] := ARRAY['Mike', 'Sarah', 'Carlos', 'James', 'Maria', 'Robert', 'Jennifer', 'David', 'Lisa', 'Kevin',
    'Emily', 'Michael', 'Jessica', 'Daniel', 'Ashley', 'Christopher', 'Amanda', 'Matthew', 'Stephanie', 'Andrew',
    'Nicole', 'Joshua', 'Elizabeth', 'Brandon', 'Megan', 'Ryan', 'Rachel', 'Justin', 'Samantha', 'William',
    'Jose', 'Juan', 'Miguel', 'Antonio', 'Luis', 'Pedro', 'Francisco', 'Diego', 'Ricardo', 'Jorge'];
  v_last_names TEXT[] := ARRAY['Johnson', 'Williams', 'Rodriguez', 'Chen', 'Garcia', 'Smith', 'Davis', 'Martinez', 'Anderson', 'Thompson',
    'Wilson', 'Moore', 'Taylor', 'Jackson', 'White', 'Harris', 'Martin', 'Lee', 'Perez', 'Clark',
    'Lewis', 'Robinson', 'Walker', 'Hall', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green',
    'Hernandez', 'Lopez', 'Gonzalez', 'Rivera', 'Ramirez', 'Torres', 'Flores', 'Sanchez', 'Morales', 'Reyes'];
  v_titles TEXT[] := ARRAY['Lead Welder', 'Electrician', 'Carpenter', 'Lead Carpenter', 'Plumber', 'HVAC Tech', 'QC Inspector',
    'Welder', 'Finish Carpenter', 'General Labor', 'Foreman', 'Helper', 'Painter', 'Insulation Tech', 'Roofer'];

  -- Project names
  v_client_names TEXT[] := ARRAY['Acme Corp', 'TechStart Inc', 'GlobalMed', 'EduFirst Schools', 'RetailMax', 'GovWorks',
    'Healthcare Plus', 'University Systems', 'Mining Solutions', 'Oil Field Services', 'Construction Co', 'Data Centers Inc',
    'Farm Fresh', 'Solar Power Ltd', 'Wind Energy Corp', 'Remote Sites LLC', 'Emergency Services', 'Fire Department'];
  v_project_types TEXT[] := ARRAY['Office Complex', 'Classroom Building', 'Medical Clinic', 'Break Room', 'Storage Facility',
    'Guard Shack', 'Restroom Building', 'Locker Room', 'Control Room', 'Lab Building', 'Administration', 'Dormitory',
    'Conference Center', 'Cafeteria', 'Maintenance Shop', 'Equipment Storage'];

  -- Module statuses with weights
  v_module_statuses TEXT[] := ARRAY['Not Started', 'In Queue', 'In Progress', 'In Progress', 'In Progress',
    'QC Hold', 'Completed', 'Completed', 'Staged', 'Shipped'];

  -- Status for random selection
  v_status TEXT;
  v_idx INTEGER;
  v_random_float FLOAT;

BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'COMPREHENSIVE DEMO DATA GENERATION';
  RAISE NOTICE 'Date Range: % to %', v_start_date, v_end_date;
  RAISE NOTICE '============================================================';

  -- ============================================================================
  -- PART 4: LOOP THROUGH ALL FACTORIES
  -- ============================================================================

  FOR v_factory IN SELECT id, code, full_name FROM factories WHERE is_active = true ORDER BY code
  LOOP
    v_factory_count := v_factory_count + 1;
    RAISE NOTICE '';
    RAISE NOTICE 'Processing Factory %: % (%)', v_factory_count, v_factory.code, v_factory.full_name;

    -- ==========================================================================
    -- 4.1: CREATE PLANT CONFIG
    -- ==========================================================================

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
      efficiency_modules = EXCLUDED.efficiency_modules;

    -- ==========================================================================
    -- 4.2: CREATE WORKERS (15-25 per factory)
    -- ==========================================================================

    FOR i IN 1..20 + floor(random() * 10)::INTEGER
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
      RETURNING id INTO v_worker_id;

      v_worker_count := v_worker_count + 1;

      -- Create cross-training records for some workers
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
    END LOOP;

    RAISE NOTICE '  Created % workers', v_worker_count - (v_factory_count - 1) * 25;

    -- ==========================================================================
    -- 4.3: CREATE PROJECTS (8-12 per factory)
    -- ==========================================================================

    FOR i IN 1..8 + floor(random() * 5)::INTEGER
    LOOP
      DECLARE
        v_project_start DATE;
        v_project_status TEXT;
        v_contract_value NUMERIC;
        v_module_quantity INTEGER;
      BEGIN
        -- Determine project status based on index (older projects more likely complete)
        IF i <= 2 THEN
          v_project_status := 'Completed';
          v_project_start := v_start_date + (random() * 30)::INTEGER;
        ELSIF i <= 5 THEN
          v_project_status := 'Active';
          v_project_start := v_today - (random() * 60)::INTEGER;
        ELSE
          v_project_status := CASE floor(random() * 3)::INTEGER
            WHEN 0 THEN 'Active'
            WHEN 1 THEN 'In Progress'
            ELSE 'Draft'
          END;
          v_project_start := v_today + (random() * 30)::INTEGER;
        END IF;

        v_module_quantity := 4 + floor(random() * 12)::INTEGER;  -- 4-15 modules
        v_contract_value := v_module_quantity * (150000 + random() * 350000);

        INSERT INTO projects (
          job_number, name, client_name, factory, status,
          contract_value, project_type, building_use, building_category,
          total_modules, start_date, target_completion,
          street_address, city, state, zip_code
        )
        VALUES (
          v_factory.code || '-' || to_char(v_project_start, 'YY') || LPAD((i + 100)::TEXT, 3, '0'),
          v_client_names[1 + floor(random() * array_length(v_client_names, 1))::INTEGER] || ' - ' ||
          v_project_types[1 + floor(random() * array_length(v_project_types, 1))::INTEGER],
          v_client_names[1 + floor(random() * array_length(v_client_names, 1))::INTEGER],
          v_factory.code || ' - ' || v_factory.full_name,
          v_project_status,
          v_contract_value,
          CASE floor(random() * 4)::INTEGER
            WHEN 0 THEN 'Commercial'
            WHEN 1 THEN 'Education'
            WHEN 2 THEN 'Healthcare'
            ELSE 'Industrial'
          END,
          v_project_types[1 + floor(random() * array_length(v_project_types, 1))::INTEGER],
          CASE floor(random() * 4)::INTEGER
            WHEN 0 THEN 'stock'
            WHEN 1 THEN 'fleet'
            WHEN 2 THEN 'government'
            ELSE 'custom'
          END,
          v_module_quantity,
          v_project_start,
          v_project_start + (v_module_quantity * 7 + 30),
          (1000 + floor(random() * 9000))::TEXT || ' Industrial Blvd',
          CASE floor(random() * 5)::INTEGER
            WHEN 0 THEN 'Phoenix'
            WHEN 1 THEN 'Denver'
            WHEN 2 THEN 'Salt Lake City'
            WHEN 3 THEN 'Boise'
            ELSE 'Las Vegas'
          END,
          CASE floor(random() * 5)::INTEGER
            WHEN 0 THEN 'AZ'
            WHEN 1 THEN 'CO'
            WHEN 2 THEN 'UT'
            WHEN 3 THEN 'ID'
            ELSE 'NV'
          END,
          LPAD((10000 + floor(random() * 90000))::TEXT, 5, '0')
        )
        RETURNING id INTO v_project_id;

        v_project_count := v_project_count + 1;

        -- ==========================================================================
        -- 4.4: CREATE MODULES FOR THIS PROJECT
        -- ==========================================================================

        FOR j IN 1..v_module_quantity
        LOOP
          DECLARE
            v_mod_status TEXT;
            v_mod_station_id UUID;
            v_scheduled_start DATE;
            v_scheduled_end DATE;
          BEGIN
            -- Determine module status based on project status and sequence
            IF v_project_status = 'Completed' THEN
              v_mod_status := CASE
                WHEN random() < 0.9 THEN 'Shipped'
                ELSE 'Staged'
              END;
            ELSIF v_project_status IN ('Active', 'In Progress') THEN
              v_random_float := random();
              IF j <= 2 THEN
                v_mod_status := CASE
                  WHEN v_random_float < 0.4 THEN 'Shipped'
                  WHEN v_random_float < 0.7 THEN 'Staged'
                  ELSE 'Completed'
                END;
              ELSIF j <= v_module_quantity / 2 THEN
                v_mod_status := CASE
                  WHEN v_random_float < 0.3 THEN 'Completed'
                  WHEN v_random_float < 0.7 THEN 'In Progress'
                  ELSE 'QC Hold'
                END;
              ELSE
                v_mod_status := CASE
                  WHEN v_random_float < 0.4 THEN 'In Progress'
                  WHEN v_random_float < 0.7 THEN 'In Queue'
                  ELSE 'Not Started'
                END;
              END IF;
            ELSE
              v_mod_status := 'Not Started';
            END IF;

            -- Get station based on status
            IF v_mod_status IN ('In Progress', 'QC Hold', 'In Queue') THEN
              -- Random station in production
              SELECT id INTO v_mod_station_id
              FROM station_templates
              WHERE (factory_id = v_factory.id OR factory_id IS NULL) AND is_active = true
              ORDER BY CASE
                WHEN v_mod_status = 'In Queue' THEN order_num
                ELSE random()
              END
              LIMIT 1;
            ELSIF v_mod_status IN ('Completed', 'Staged') THEN
              -- Final inspection or staging station
              SELECT id INTO v_mod_station_id
              FROM station_templates
              WHERE (factory_id = v_factory.id OR factory_id IS NULL) AND order_num >= 10
              ORDER BY order_num DESC
              LIMIT 1;
            ELSE
              v_mod_station_id := NULL;
            END IF;

            v_scheduled_start := v_project_start + ((j - 1) * 5);
            v_scheduled_end := v_scheduled_start + 14;

            INSERT INTO modules (
              project_id, factory_id, serial_number, name, sequence_number,
              status, current_station_id, scheduled_start, scheduled_end,
              building_category, is_rush, module_width, module_length
            )
            VALUES (
              v_project_id,
              v_factory.id,
              v_factory.code || '-' || to_char(v_project_start, 'YY') || '-M' || LPAD(j::TEXT, 2, '0'),
              'Module ' || chr(64 + j) || ' - ' ||
              CASE floor(random() * 6)::INTEGER
                WHEN 0 THEN 'Main Office'
                WHEN 1 THEN 'Conference Room'
                WHEN 2 THEN 'Break Room'
                WHEN 3 THEN 'Restroom'
                WHEN 4 THEN 'Storage'
                ELSE 'Utility'
              END,
              j,
              v_mod_status,
              v_mod_station_id,
              v_scheduled_start,
              v_scheduled_end,
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

            v_module_count := v_module_count + 1;

            -- Create QC records for completed modules
            IF v_mod_status IN ('Completed', 'Staged', 'Shipped') THEN
              DECLARE
                v_qc_station RECORD;
                v_inspector_id UUID;
              BEGIN
                -- Get a QC inspector
                SELECT id INTO v_inspector_id
                FROM workers
                WHERE factory_id = v_factory.id AND title LIKE '%QC%' AND is_active = true
                ORDER BY random()
                LIMIT 1;

                -- Create QC record for each inspection station passed
                FOR v_qc_station IN
                  SELECT id, name FROM station_templates
                  WHERE (factory_id = v_factory.id OR factory_id IS NULL)
                  AND requires_inspection = true
                  ORDER BY order_num
                LOOP
                  INSERT INTO qc_records (
                    module_id, station_id, factory_id, inspector_id,
                    status, passed, score, inspected_at
                  )
                  VALUES (
                    v_module_id,
                    v_qc_station.id,
                    v_factory.id,
                    v_inspector_id,
                    'Passed',
                    true,
                    85 + floor(random() * 16)::INTEGER,  -- 85-100
                    v_scheduled_end - (random() * 5)::INTEGER
                  );
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
                );
              END;
            END IF;

          END;  -- module block
        END LOOP;  -- modules

        -- ==========================================================================
        -- 4.5: CREATE TASKS FOR THIS PROJECT
        -- ==========================================================================

        FOR k IN 1..5 + floor(random() * 10)::INTEGER
        LOOP
          DECLARE
            v_task_status TEXT;
            v_due_date DATE;
          BEGIN
            v_random_float := random();
            v_task_status := CASE
              WHEN v_random_float < 0.3 THEN 'Completed'
              WHEN v_random_float < 0.5 THEN 'In Progress'
              WHEN v_random_float < 0.7 THEN 'Not Started'
              WHEN v_random_float < 0.85 THEN 'Awaiting Response'
              ELSE 'Cancelled'
            END;

            v_due_date := v_project_start + floor(random() * 60)::INTEGER;

            -- Get a user for assignment
            SELECT id INTO v_user_id
            FROM users
            WHERE role IN ('PM', 'Director', 'PC') AND is_active = true
            ORDER BY random()
            LIMIT 1;

            INSERT INTO tasks (
              project_id, title, description, status, priority,
              due_date, assigned_to, task_type
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
              v_user_id,
              'pm_task'
            );
          END;
        END LOOP;  -- tasks

        -- ==========================================================================
        -- 4.6: CREATE RFIs FOR THIS PROJECT
        -- ==========================================================================

        FOR k IN 1..2 + floor(random() * 5)::INTEGER
        LOOP
          DECLARE
            v_rfi_status TEXT;
          BEGIN
            v_random_float := random();
            v_rfi_status := CASE
              WHEN v_random_float < 0.4 THEN 'Closed'
              WHEN v_random_float < 0.7 THEN 'Answered'
              WHEN v_random_float < 0.85 THEN 'Open'
              ELSE 'Draft'
            END;

            INSERT INTO rfis (
              project_id, rfi_number, subject, question, status, priority,
              due_date, requested_by
            )
            VALUES (
              v_project_id,
              'RFI-' || LPAD(k::TEXT, 3, '0'),
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
              v_rfi_status,
              CASE floor(random() * 3)::INTEGER
                WHEN 0 THEN 'High'
                WHEN 1 THEN 'Medium'
                ELSE 'Low'
              END,
              v_project_start + floor(random() * 30)::INTEGER,
              'Engineering Team'
            );
          END;
        END LOOP;  -- rfis

        -- ==========================================================================
        -- 4.7: CREATE SUBMITTALS FOR THIS PROJECT
        -- ==========================================================================

        FOR k IN 1..3 + floor(random() * 6)::INTEGER
        LOOP
          DECLARE
            v_sub_status TEXT;
          BEGIN
            v_random_float := random();
            v_sub_status := CASE
              WHEN v_random_float < 0.35 THEN 'Approved'
              WHEN v_random_float < 0.55 THEN 'Approved as Noted'
              WHEN v_random_float < 0.75 THEN 'Under Review'
              WHEN v_random_float < 0.9 THEN 'Pending'
              ELSE 'Rejected'
            END;

            INSERT INTO submittals (
              project_id, submittal_number, title, spec_section, status,
              due_date, submitted_date
            )
            VALUES (
              v_project_id,
              'SUB-' || LPAD(k::TEXT, 3, '0'),
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
              CASE floor(random() * 5)::INTEGER
                WHEN 0 THEN '07400'
                WHEN 1 THEN '26000'
                WHEN 2 THEN '23000'
                WHEN 3 THEN '22000'
                ELSE '09000'
              END,
              v_sub_status,
              v_project_start + floor(random() * 21)::INTEGER,
              v_project_start + floor(random() * 14)::INTEGER
            );
          END;
        END LOOP;  -- submittals

      END;  -- project block
    END LOOP;  -- projects

    -- ==========================================================================
    -- 4.8: CREATE WORKER SHIFTS (90 days of history)
    -- ==========================================================================

    DECLARE
      v_shift_date DATE;
      v_worker RECORD;
      v_clock_in TIMESTAMPTZ;
      v_clock_out TIMESTAMPTZ;
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

          -- Most workers work 8-10 hours
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
          );
        END LOOP;
      END LOOP;
    END;

    -- ==========================================================================
    -- 4.9: CREATE KAIZEN SUGGESTIONS
    -- ==========================================================================

    FOR i IN 1..5 + floor(random() * 10)::INTEGER
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

        v_random_float := random();
        v_kaizen_status := CASE
          WHEN v_random_float < 0.2 THEN 'Implemented'
          WHEN v_random_float < 0.4 THEN 'Approved'
          WHEN v_random_float < 0.6 THEN 'Under Review'
          WHEN v_random_float < 0.9 THEN 'Submitted'
          ELSE 'Rejected'
        END;

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
        );
      END;
    END LOOP;

    -- ==========================================================================
    -- 4.10: CREATE SAFETY CHECKS (last 30 days)
    -- ==========================================================================

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

    -- ==========================================================================
    -- 4.11: CREATE TAKT EVENTS (for modules in progress)
    -- ==========================================================================

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
        );
      END LOOP;
    END;

  END LOOP;  -- factories

  -- ============================================================================
  -- PART 5: FINAL SUMMARY
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'DEMO DATA GENERATION COMPLETE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Factories processed: %', v_factory_count;
  RAISE NOTICE 'Total projects created: %', v_project_count;
  RAISE NOTICE 'Total modules created: %', v_module_count;
  RAISE NOTICE 'Total workers created: %', v_worker_count;
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================================
-- PART 6: VERIFICATION QUERIES
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'VERIFICATION COUNTS:';

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
END $$;

-- Cleanup helper functions
DROP FUNCTION IF EXISTS random_date(DATE, DATE);
DROP FUNCTION IF EXISTS random_timestamp(DATE, DATE);

-- ============================================================================
-- END OF DEMO DATA SCRIPT
-- ============================================================================
