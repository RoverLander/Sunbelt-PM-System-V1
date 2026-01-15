-- ============================================================================
-- PGM Demo Data Migration
-- ============================================================================
-- Seeds sample modules, workers, and shifts for testing the Plant Manager
-- dashboard features.
--
-- RUN AFTER: 20260115_plant_manager_system.sql
--
-- Created: January 15, 2026
-- ============================================================================

-- Get factory ID for NWBS (or first factory if NWBS doesn't exist)
DO $$
DECLARE
  v_factory_id UUID;
  v_factory_code VARCHAR(20);
  v_project_id UUID;
  v_station_id UUID;
  v_worker_id UUID;
  v_module_id UUID;
BEGIN
  -- Get a factory to use for demo data
  SELECT id, code INTO v_factory_id, v_factory_code
  FROM factories
  WHERE code = 'NWBS'
  LIMIT 1;

  -- If NWBS doesn't exist, get any factory
  IF v_factory_id IS NULL THEN
    SELECT id, code INTO v_factory_id, v_factory_code
    FROM factories
    LIMIT 1;
  END IF;

  IF v_factory_id IS NULL THEN
    RAISE NOTICE 'No factories found - skipping demo data';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating PGM demo data for factory: %', v_factory_code;

  -- ============================================================================
  -- CREATE DEMO WORKERS
  -- ============================================================================

  -- Skip if workers already exist for this factory
  IF EXISTS (SELECT 1 FROM workers WHERE factory_id = v_factory_id) THEN
    RAISE NOTICE 'Workers already exist for factory % - skipping worker creation', v_factory_code;
  ELSE
    -- Get first station for primary assignment
    SELECT id INTO v_station_id FROM station_templates WHERE factory_id IS NULL ORDER BY order_num LIMIT 1;

    -- Insert demo workers
    INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
    VALUES
      (v_factory_id, 'EMP001', 'Mike', 'Johnson', 'Lead Welder', v_station_id, true, 28.50, true, '2022-03-15'),
      (v_factory_id, 'EMP002', 'Sarah', 'Williams', 'Electrician', v_station_id, false, 26.00, true, '2023-01-10'),
      (v_factory_id, 'EMP003', 'Carlos', 'Rodriguez', 'Carpenter', v_station_id, false, 24.50, true, '2022-08-22'),
      (v_factory_id, 'EMP004', 'James', 'Chen', 'Lead Carpenter', v_station_id, true, 27.00, true, '2021-06-01'),
      (v_factory_id, 'EMP005', 'Maria', 'Garcia', 'Plumber', v_station_id, false, 25.50, true, '2023-04-18'),
      (v_factory_id, 'EMP006', 'Robert', 'Smith', 'HVAC Tech', v_station_id, false, 27.50, true, '2022-11-08'),
      (v_factory_id, 'EMP007', 'Jennifer', 'Davis', 'QC Inspector', v_station_id, false, 26.50, true, '2023-02-28'),
      (v_factory_id, 'EMP008', 'David', 'Martinez', 'Welder', v_station_id, false, 24.00, true, '2023-07-12'),
      (v_factory_id, 'EMP009', 'Lisa', 'Anderson', 'Finish Carpenter', v_station_id, false, 25.00, true, '2022-09-30'),
      (v_factory_id, 'EMP010', 'Kevin', 'Thompson', 'General Labor', v_station_id, false, 18.50, true, '2024-01-08');

    RAISE NOTICE 'Created 10 demo workers';
  END IF;

  -- ============================================================================
  -- CREATE DEMO SHIFTS (Today's Active Workers)
  -- ============================================================================

  -- Skip if shifts already exist for today
  IF EXISTS (
    SELECT 1 FROM worker_shifts
    WHERE factory_id = v_factory_id
    AND DATE(clock_in) = CURRENT_DATE
  ) THEN
    RAISE NOTICE 'Shifts already exist for today - skipping shift creation';
  ELSE
    -- Create shifts for 7 workers (some present, some not)
    FOR v_worker_id IN
      SELECT id FROM workers WHERE factory_id = v_factory_id AND is_active = true LIMIT 7
    LOOP
      INSERT INTO worker_shifts (worker_id, factory_id, clock_in, source, status)
      VALUES (
        v_worker_id,
        v_factory_id,
        CURRENT_DATE + INTERVAL '6 hours' + (random() * INTERVAL '30 minutes'),
        'kiosk',
        'active'
      );
    END LOOP;

    RAISE NOTICE 'Created demo shifts for 7 workers';
  END IF;

  -- ============================================================================
  -- CREATE DEMO MODULES
  -- ============================================================================

  -- Get an active project for this factory
  -- Note: projects.factory uses full names like 'NWBS - Northwest Building Systems'
  -- while factories.code is just 'NWBS', so we use ILIKE pattern matching
  SELECT id INTO v_project_id
  FROM projects
  WHERE factory ILIKE '%' || v_factory_code || '%'
  AND status IN ('Active', 'In Progress', 'Production')
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no project exists, try to find any project for this factory
  IF v_project_id IS NULL THEN
    SELECT id INTO v_project_id
    FROM projects
    WHERE factory ILIKE '%' || v_factory_code || '%'
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_project_id IS NULL THEN
    RAISE NOTICE 'No projects found - skipping module creation';
    RETURN;
  END IF;

  -- Skip if modules already exist for this project
  IF EXISTS (SELECT 1 FROM modules WHERE project_id = v_project_id) THEN
    RAISE NOTICE 'Modules already exist for project - skipping module creation';
  ELSE
    -- Get station IDs for assigning modules to different stations
    -- Create 8 modules at various stations

    -- Module 1: At Frame Welding (station 1)
    SELECT id INTO v_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 1;
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_factory_id, v_factory_code || '-M001', 'Module A - Main Office', 1, 'In Progress', v_station_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 'stock', false)
    RETURNING id INTO v_module_id;

    -- Module 2: At Rough Carpentry (station 2)
    SELECT id INTO v_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 2;
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_factory_id, v_factory_code || '-M002', 'Module B - Conference Room', 2, 'In Progress', v_station_id, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '12 days', 'stock', false);

    -- Module 3: At Electrical (station 5) - RUSH
    SELECT id INTO v_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 5;
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_factory_id, v_factory_code || '-M003', 'Module C - Break Room', 3, 'In Progress', v_station_id, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', 'fleet', true);

    -- Module 4: At Interior Finish (station 9)
    SELECT id INTO v_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 9;
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_factory_id, v_factory_code || '-M004', 'Module D - Restrooms', 4, 'In Progress', v_station_id, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '3 days', 'stock', false);

    -- Module 5: At Final Inspection (station 10)
    SELECT id INTO v_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 10;
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_factory_id, v_factory_code || '-M005', 'Module E - Storage', 5, 'In Progress', v_station_id, CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '1 day', 'stock', false);

    -- Module 6: Staged (station 11)
    SELECT id INTO v_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 11;
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_factory_id, v_factory_code || '-M006', 'Module F - Entry', 6, 'Staged', v_station_id, CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE, 'stock', false);

    -- Module 7: In Queue (at station 1) - scheduled for next week
    SELECT id INTO v_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 1;
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_factory_id, v_factory_code || '-M007', 'Module G - Utility', 7, 'In Queue', v_station_id, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '17 days', 'government', false);

    -- Module 8: Not Started yet - scheduled for later
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_factory_id, v_factory_code || '-M008', 'Module H - Extension', 8, 'Not Started', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '24 days', 'custom', false);

    RAISE NOTICE 'Created 8 demo modules';
  END IF;

  -- ============================================================================
  -- CREATE PLANT CONFIG IF NOT EXISTS
  -- ============================================================================

  IF NOT EXISTS (SELECT 1 FROM plant_config WHERE factory_id = v_factory_id) THEN
    INSERT INTO plant_config (factory_id)
    VALUES (v_factory_id);
    RAISE NOTICE 'Created plant config for factory %', v_factory_code;
  END IF;

  RAISE NOTICE 'PGM demo data creation complete for factory %', v_factory_code;

END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  worker_count INTEGER;
  module_count INTEGER;
  shift_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO worker_count FROM workers;
  SELECT COUNT(*) INTO module_count FROM modules;
  SELECT COUNT(*) INTO shift_count FROM worker_shifts WHERE DATE(clock_in) = CURRENT_DATE;

  RAISE NOTICE 'PGM Demo Data Summary:';
  RAISE NOTICE '  Workers: %', worker_count;
  RAISE NOTICE '  Modules: %', module_count;
  RAISE NOTICE '  Active Shifts Today: %', shift_count;
END $$;
