-- ============================================================================
-- FIX_MODULE_DATES.sql - Fix Module Scheduled Dates for Calendar and Pipeline
-- ============================================================================
-- This script:
-- 1. Updates all module scheduled_start dates to be relative to CURRENT_DATE
-- 2. Creates some unscheduled modules for the pipeline auto-scheduler
-- 3. Ensures user factory_id values are correctly set
--
-- Run this AFTER COMPLETE_DEMO_SETUP.sql
-- Created: January 19, 2026
-- ============================================================================

-- ############################################################################
-- STEP 1: UPDATE USER FACTORY_ID VALUES
-- ############################################################################

DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  -- Update factory_id for all users based on their factory code
  UPDATE users u
  SET factory_id = f.id
  FROM factories f
  WHERE u.factory = f.code
    AND (u.factory_id IS NULL OR u.factory_id != f.id);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Step 1: Updated factory_id for % users', v_updated;

  -- Ensure Ross Parks specifically has NWBS factory set
  UPDATE users
  SET factory = 'NWBS',
      factory_id = (SELECT id FROM factories WHERE code = 'NWBS')
  WHERE email ILIKE '%ross%' AND email ILIKE '%nwbs%'
    AND factory_id IS NULL;

END $$;

SELECT 'Step 1: User factory_id values verified' AS status;

-- ############################################################################
-- STEP 2: UPDATE MODULE DATES TO BE RELATIVE TO CURRENT_DATE
-- ############################################################################

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_module RECORD;
  v_idx INTEGER := 1;
  v_total INTEGER := 0;
BEGIN
  -- Get NWBS factory ID
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  IF v_nwbs_factory_id IS NULL THEN
    RAISE NOTICE 'NWBS factory not found!';
    RETURN;
  END IF;

  -- Update all modules with scheduled_start dates
  -- Distribute them across past 2 weeks and next 4 weeks
  FOR v_module IN
    SELECT id, status, sequence_number
    FROM modules
    WHERE factory_id = v_nwbs_factory_id
    ORDER BY created_at, sequence_number
  LOOP
    -- Calculate date offset based on status and sequence
    -- Shipped/Staged/Completed: Past dates
    -- In Progress: Around today
    -- In Queue/Not Started: Future dates

    UPDATE modules
    SET scheduled_start = CASE
      WHEN status IN ('Shipped', 'Completed') THEN CURRENT_DATE - (14 - (v_idx % 10)) -- Past 2 weeks
      WHEN status = 'Staged' THEN CURRENT_DATE - (v_idx % 7) -- Past week
      WHEN status = 'In Progress' THEN CURRENT_DATE - (v_idx % 3) -- Recent days to today
      WHEN status = 'In Queue' THEN CURRENT_DATE + (v_idx % 14) -- Next 2 weeks
      ELSE CURRENT_DATE + ((v_idx % 21) + 7) -- 1-4 weeks out
    END,
    scheduled_end = CASE
      WHEN status IN ('Shipped', 'Completed') THEN CURRENT_DATE - (14 - (v_idx % 10) - 3)
      WHEN status = 'Staged' THEN CURRENT_DATE - (v_idx % 7) + 2
      WHEN status = 'In Progress' THEN CURRENT_DATE + 5
      WHEN status = 'In Queue' THEN CURRENT_DATE + (v_idx % 14) + 5
      ELSE CURRENT_DATE + ((v_idx % 21) + 7) + 7
    END
    WHERE id = v_module.id;

    v_idx := v_idx + 1;
    v_total := v_total + 1;
  END LOOP;

  RAISE NOTICE 'Step 2: Updated scheduled dates for % NWBS modules', v_total;

  -- Also update modules for other factories
  v_total := 0;
  v_idx := 1;
  FOR v_module IN
    SELECT id, status
    FROM modules
    WHERE factory_id != v_nwbs_factory_id
    ORDER BY created_at
  LOOP
    UPDATE modules
    SET scheduled_start = CASE
      WHEN status IN ('Shipped', 'Completed') THEN CURRENT_DATE - (14 - (v_idx % 10))
      WHEN status = 'Staged' THEN CURRENT_DATE - (v_idx % 7)
      WHEN status = 'In Progress' THEN CURRENT_DATE - (v_idx % 3)
      WHEN status = 'In Queue' THEN CURRENT_DATE + (v_idx % 14)
      ELSE CURRENT_DATE + ((v_idx % 21) + 7)
    END,
    scheduled_end = CASE
      WHEN status IN ('Shipped', 'Completed') THEN CURRENT_DATE - (14 - (v_idx % 10) - 3)
      WHEN status = 'Staged' THEN CURRENT_DATE - (v_idx % 7) + 2
      WHEN status = 'In Progress' THEN CURRENT_DATE + 5
      WHEN status = 'In Queue' THEN CURRENT_DATE + (v_idx % 14) + 5
      ELSE CURRENT_DATE + ((v_idx % 21) + 7) + 7
    END
    WHERE id = v_module.id;

    v_idx := v_idx + 1;
    v_total := v_total + 1;
  END LOOP;

  RAISE NOTICE 'Step 2: Updated scheduled dates for % other factory modules', v_total;

END $$;

SELECT 'Step 2: Module dates updated to be relative to current date' AS status;

-- ############################################################################
-- STEP 3: CREATE UNSCHEDULED MODULES FOR PIPELINE AUTO-SCHEDULER
-- ############################################################################
-- The pipeline auto-scheduler shows modules where scheduled_start IS NULL
-- We need some "Not Started" modules without dates for the tool to suggest dates

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_project RECORD;
  v_new_module_count INTEGER := 0;
  v_serial_num TEXT;
  v_existing_max_seq INTEGER;
BEGIN
  -- Get NWBS factory ID
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  IF v_nwbs_factory_id IS NULL THEN
    RAISE NOTICE 'NWBS factory not found!';
    RETURN;
  END IF;

  -- Find Phase 3 projects at NWBS that could have more modules added
  FOR v_project IN
    SELECT p.id, p.project_number, p.name, p.module_count, p.factory_id
    FROM projects p
    WHERE p.factory_id = v_nwbs_factory_id
      AND p.current_phase = 3
      AND p.status IN ('Active', 'In Progress', 'Production')
    ORDER BY p.project_number
    LIMIT 3 -- Add modules to 3 projects
  LOOP
    -- Get current max sequence number for this project
    SELECT COALESCE(MAX(sequence_number), 0) INTO v_existing_max_seq
    FROM modules
    WHERE project_id = v_project.id;

    -- Add 2 unscheduled modules to each project
    FOR i IN 1..2 LOOP
      v_serial_num := v_project.project_number || '-M' || LPAD((v_existing_max_seq + i)::TEXT, 2, '0');

      -- Check if this serial number already exists
      IF NOT EXISTS (SELECT 1 FROM modules WHERE serial_number = v_serial_num) THEN
        INSERT INTO modules (
          project_id, factory_id, serial_number, name, sequence_number,
          status, current_station_id, scheduled_start, scheduled_end,
          module_width, module_length, building_category, is_rush
        ) VALUES (
          v_project.id,
          v_nwbs_factory_id,
          v_serial_num,
          CASE i
            WHEN 1 THEN 'New Unscheduled Module A'
            WHEN 2 THEN 'New Unscheduled Module B'
          END,
          v_existing_max_seq + i,
          'Not Started', -- Status that shows in pipeline
          NULL, -- Not at any station yet
          NULL, -- NO scheduled_start - this is key for pipeline
          NULL, -- NO scheduled_end
          12,
          48,
          'office',
          i = 1 -- First one is rush
        );

        v_new_module_count := v_new_module_count + 1;
        RAISE NOTICE 'Created unscheduled module: % for project %', v_serial_num, v_project.name;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Step 3: Created % new unscheduled modules for pipeline', v_new_module_count;

END $$;

SELECT 'Step 3: Unscheduled modules created for pipeline auto-scheduler' AS status;

-- ############################################################################
-- STEP 4: SET SOME "IN QUEUE" MODULES AS UNSCHEDULED FOR TESTING
-- ############################################################################
-- Also set some existing "In Queue" modules to have NULL scheduled_start
-- so they appear in the unscheduled list on the calendar page

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_updated INTEGER := 0;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Set ~20% of "In Queue" modules to have NULL scheduled dates
  UPDATE modules
  SET scheduled_start = NULL,
      scheduled_end = NULL
  WHERE factory_id = v_nwbs_factory_id
    AND status = 'In Queue'
    AND id IN (
      SELECT id FROM modules
      WHERE factory_id = v_nwbs_factory_id
        AND status = 'In Queue'
      ORDER BY RANDOM()
      LIMIT 3
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Step 4: Set % "In Queue" modules as unscheduled', v_updated;

END $$;

SELECT 'Step 4: Some In Queue modules set as unscheduled' AS status;

-- ############################################################################
-- STEP 5: VERIFY DATA
-- ############################################################################

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_total_modules INTEGER;
  v_scheduled_modules INTEGER;
  v_unscheduled_modules INTEGER;
  v_today_modules INTEGER;
  v_this_week_modules INTEGER;
  v_this_month_modules INTEGER;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Count modules
  SELECT COUNT(*) INTO v_total_modules
  FROM modules WHERE factory_id = v_nwbs_factory_id;

  SELECT COUNT(*) INTO v_scheduled_modules
  FROM modules WHERE factory_id = v_nwbs_factory_id AND scheduled_start IS NOT NULL;

  SELECT COUNT(*) INTO v_unscheduled_modules
  FROM modules WHERE factory_id = v_nwbs_factory_id AND scheduled_start IS NULL;

  SELECT COUNT(*) INTO v_today_modules
  FROM modules
  WHERE factory_id = v_nwbs_factory_id
    AND scheduled_start = CURRENT_DATE;

  SELECT COUNT(*) INTO v_this_week_modules
  FROM modules
  WHERE factory_id = v_nwbs_factory_id
    AND scheduled_start >= CURRENT_DATE - 3
    AND scheduled_start <= CURRENT_DATE + 7;

  SELECT COUNT(*) INTO v_this_month_modules
  FROM modules
  WHERE factory_id = v_nwbs_factory_id
    AND scheduled_start >= DATE_TRUNC('month', CURRENT_DATE)
    AND scheduled_start < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

  RAISE NOTICE '';
  RAISE NOTICE '=== NWBS MODULE SUMMARY ===';
  RAISE NOTICE 'Total modules: %', v_total_modules;
  RAISE NOTICE 'Scheduled modules: %', v_scheduled_modules;
  RAISE NOTICE 'Unscheduled modules (for pipeline): %', v_unscheduled_modules;
  RAISE NOTICE 'Modules scheduled today: %', v_today_modules;
  RAISE NOTICE 'Modules scheduled this week (-3 to +7 days): %', v_this_week_modules;
  RAISE NOTICE 'Modules scheduled this month: %', v_this_month_modules;
  RAISE NOTICE '===========================';

END $$;

-- Show module date distribution
SELECT
  CASE
    WHEN scheduled_start IS NULL THEN 'Unscheduled'
    WHEN scheduled_start < CURRENT_DATE THEN 'Past'
    WHEN scheduled_start = CURRENT_DATE THEN 'Today'
    WHEN scheduled_start <= CURRENT_DATE + 7 THEN 'This Week'
    WHEN scheduled_start <= CURRENT_DATE + 30 THEN 'This Month'
    ELSE 'Future'
  END AS date_range,
  COUNT(*) as module_count
FROM modules m
JOIN factories f ON m.factory_id = f.id
WHERE f.code = 'NWBS'
GROUP BY 1
ORDER BY 1;

SELECT 'FIX_MODULE_DATES.sql completed successfully!' AS status;
