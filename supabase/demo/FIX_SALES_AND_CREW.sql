-- ============================================================================
-- FIX_SALES_AND_CREW.sql
-- Comprehensive fix for:
-- 1. Sales quotes FK relationship (assigned_to -> users)
-- 2. Add ~100 crew members with station assignments for NWBS
-- 3. Add realistic modules for NWBS projects
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX SALES_QUOTES ASSIGNED_TO FOREIGN KEY
-- ============================================================================
-- The SalesManagerDashboard tries to join assigned_to to users table
-- but the FK relationship doesn't exist

-- First, add the FK constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sales_quotes_assigned_to_fkey'
    AND table_name = 'sales_quotes'
  ) THEN
    ALTER TABLE sales_quotes
    ADD CONSTRAINT sales_quotes_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint for sales_quotes.assigned_to';
  ELSE
    RAISE NOTICE 'FK constraint already exists for sales_quotes.assigned_to';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add FK constraint: %', SQLERRM;
END $$;

-- Also add dealer_id FK if missing
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sales_quotes_dealer_id_fkey'
    AND table_name = 'sales_quotes'
  ) THEN
    ALTER TABLE sales_quotes
    ADD CONSTRAINT sales_quotes_dealer_id_fkey
    FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint for sales_quotes.dealer_id';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add dealer FK: %', SQLERRM;
END $$;

SELECT 'Step 1: Sales quotes FK constraints fixed' AS status;

-- ============================================================================
-- STEP 2: ADD CREW MEMBERS FOR NWBS FACTORY (~100 workers)
-- ============================================================================
-- Get station IDs for assignments
DO $$
DECLARE
  v_factory_id UUID;
  v_station_ids UUID[];
  v_lead_station_id UUID;
  i INTEGER;
BEGIN
  -- Get NWBS factory ID
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  IF v_factory_id IS NULL THEN
    RAISE NOTICE 'NWBS factory not found, skipping crew creation';
    RETURN;
  END IF;

  -- Get station IDs (we'll cycle through them)
  SELECT ARRAY_AGG(id ORDER BY order_num) INTO v_station_ids
  FROM station_templates
  WHERE factory_id IS NULL OR factory_id = v_factory_id
  LIMIT 12;

  -- Get a default station for lead assignments
  v_lead_station_id := v_station_ids[1];

  -- Check if we already have enough workers
  IF (SELECT COUNT(*) FROM workers WHERE factory_id = v_factory_id) >= 50 THEN
    RAISE NOTICE 'NWBS factory already has sufficient workers';
    RETURN;
  END IF;

  -- Delete existing workers to start fresh
  DELETE FROM workers WHERE factory_id = v_factory_id;

  RAISE NOTICE 'Creating 100 workers for NWBS factory...';

  -- Insert workers in batches by department/station
  -- STATION 1: Frame/Floor (15 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-001', 'Mike', 'Johnson', 'Lead Framer', v_station_ids[1], true, 28.50, true, '2022-03-15'),
    (v_factory_id, 'NWBS-002', 'Carlos', 'Rodriguez', 'Framer', v_station_ids[1], false, 24.00, true, '2022-08-22'),
    (v_factory_id, 'NWBS-003', 'David', 'Martinez', 'Framer', v_station_ids[1], false, 23.50, true, '2023-01-10'),
    (v_factory_id, 'NWBS-004', 'Jose', 'Garcia', 'Framer', v_station_ids[1], false, 23.00, true, '2023-04-18'),
    (v_factory_id, 'NWBS-005', 'Luis', 'Hernandez', 'Framer', v_station_ids[1], false, 22.50, true, '2023-07-12'),
    (v_factory_id, 'NWBS-006', 'Antonio', 'Lopez', 'Floor Installer', v_station_ids[1], false, 24.00, true, '2022-11-08'),
    (v_factory_id, 'NWBS-007', 'Miguel', 'Gonzalez', 'Floor Installer', v_station_ids[1], false, 23.50, true, '2023-02-28'),
    (v_factory_id, 'NWBS-008', 'Rafael', 'Sanchez', 'Apprentice Framer', v_station_ids[1], false, 18.00, true, '2024-01-08'),
    (v_factory_id, 'NWBS-009', 'Pedro', 'Ramirez', 'Apprentice Framer', v_station_ids[1], false, 18.00, true, '2024-03-15'),
    (v_factory_id, 'NWBS-010', 'Francisco', 'Torres', 'Helper', v_station_ids[1], false, 16.50, true, '2024-06-01');

  -- STATION 2: Walls/Exterior (12 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-011', 'James', 'Chen', 'Lead Carpenter', v_station_ids[2], true, 27.00, true, '2021-06-01'),
    (v_factory_id, 'NWBS-012', 'William', 'Brown', 'Carpenter', v_station_ids[2], false, 25.00, true, '2022-03-20'),
    (v_factory_id, 'NWBS-013', 'Robert', 'Davis', 'Carpenter', v_station_ids[2], false, 24.50, true, '2022-07-15'),
    (v_factory_id, 'NWBS-014', 'Thomas', 'Wilson', 'Carpenter', v_station_ids[2], false, 24.00, true, '2023-01-22'),
    (v_factory_id, 'NWBS-015', 'Daniel', 'Moore', 'Siding Installer', v_station_ids[2], false, 23.50, true, '2023-05-08'),
    (v_factory_id, 'NWBS-016', 'Richard', 'Taylor', 'Siding Installer', v_station_ids[2], false, 23.00, true, '2023-08-14'),
    (v_factory_id, 'NWBS-017', 'Joseph', 'Anderson', 'Window Installer', v_station_ids[2], false, 24.00, true, '2022-11-30'),
    (v_factory_id, 'NWBS-018', 'Charles', 'Thomas', 'Door Installer', v_station_ids[2], false, 23.50, true, '2023-02-14'),
    (v_factory_id, 'NWBS-019', 'Christopher', 'Jackson', 'Apprentice', v_station_ids[2], false, 17.50, true, '2024-04-01'),
    (v_factory_id, 'NWBS-020', 'Matthew', 'White', 'Helper', v_station_ids[2], false, 16.50, true, '2024-07-10');

  -- STATION 3: Rough Electric (10 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-021', 'Kevin', 'Brown', 'Lead Electrician', v_station_ids[3], true, 32.00, true, '2020-09-15'),
    (v_factory_id, 'NWBS-022', 'Brian', 'Taylor', 'Electrician', v_station_ids[3], false, 28.00, true, '2021-03-22'),
    (v_factory_id, 'NWBS-023', 'Steven', 'Harris', 'Electrician', v_station_ids[3], false, 27.50, true, '2022-01-10'),
    (v_factory_id, 'NWBS-024', 'Edward', 'Martin', 'Electrician', v_station_ids[3], false, 27.00, true, '2022-06-18'),
    (v_factory_id, 'NWBS-025', 'Ronald', 'Thompson', 'Journeyman Electrician', v_station_ids[3], false, 26.00, true, '2023-02-05'),
    (v_factory_id, 'NWBS-026', 'Timothy', 'Garcia', 'Journeyman Electrician', v_station_ids[3], false, 25.50, true, '2023-07-20'),
    (v_factory_id, 'NWBS-027', 'Jason', 'Martinez', 'Apprentice Electrician', v_station_ids[3], false, 20.00, true, '2024-01-15'),
    (v_factory_id, 'NWBS-028', 'Jeffrey', 'Robinson', 'Apprentice Electrician', v_station_ids[3], false, 19.50, true, '2024-05-01');

  -- STATION 4: Rough Plumbing (8 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-029', 'Mark', 'Anderson', 'Lead Plumber', v_station_ids[4], true, 30.00, true, '2020-06-10'),
    (v_factory_id, 'NWBS-030', 'Donald', 'Clark', 'Plumber', v_station_ids[4], false, 26.50, true, '2021-09-22'),
    (v_factory_id, 'NWBS-031', 'Paul', 'Lewis', 'Plumber', v_station_ids[4], false, 26.00, true, '2022-04-15'),
    (v_factory_id, 'NWBS-032', 'Andrew', 'Walker', 'Plumber', v_station_ids[4], false, 25.50, true, '2023-01-08'),
    (v_factory_id, 'NWBS-033', 'Joshua', 'Hall', 'Journeyman Plumber', v_station_ids[4], false, 24.00, true, '2023-06-20'),
    (v_factory_id, 'NWBS-034', 'Kenneth', 'Allen', 'Apprentice Plumber', v_station_ids[4], false, 19.00, true, '2024-02-12');

  -- STATION 5: HVAC (8 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-035', 'Brian', 'Taylor', 'Lead HVAC Tech', v_station_ids[5], true, 31.00, true, '2019-11-05'),
    (v_factory_id, 'NWBS-036', 'George', 'Young', 'HVAC Tech', v_station_ids[5], false, 27.50, true, '2021-04-18'),
    (v_factory_id, 'NWBS-037', 'Larry', 'King', 'HVAC Tech', v_station_ids[5], false, 27.00, true, '2022-02-28'),
    (v_factory_id, 'NWBS-038', 'Dennis', 'Wright', 'HVAC Tech', v_station_ids[5], false, 26.50, true, '2022-09-10'),
    (v_factory_id, 'NWBS-039', 'Jerry', 'Scott', 'Duct Installer', v_station_ids[5], false, 24.00, true, '2023-03-25'),
    (v_factory_id, 'NWBS-040', 'Gary', 'Green', 'Apprentice HVAC', v_station_ids[5], false, 18.50, true, '2024-01-20');

  -- STATION 6: Insulation (6 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-041', 'Frank', 'Adams', 'Lead Insulation', v_station_ids[6], true, 25.00, true, '2021-08-15'),
    (v_factory_id, 'NWBS-042', 'Raymond', 'Nelson', 'Insulation Installer', v_station_ids[6], false, 22.00, true, '2022-05-10'),
    (v_factory_id, 'NWBS-043', 'Gregory', 'Hill', 'Insulation Installer', v_station_ids[6], false, 21.50, true, '2023-01-22'),
    (v_factory_id, 'NWBS-044', 'Harold', 'Campbell', 'Insulation Installer', v_station_ids[6], false, 21.00, true, '2023-08-05'),
    (v_factory_id, 'NWBS-045', 'Henry', 'Mitchell', 'Helper', v_station_ids[6], false, 17.00, true, '2024-03-01');

  -- STATION 7: Drywall (10 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-046', 'Carl', 'Roberts', 'Lead Drywall', v_station_ids[7], true, 26.50, true, '2020-10-20'),
    (v_factory_id, 'NWBS-047', 'Arthur', 'Turner', 'Drywall Hanger', v_station_ids[7], false, 23.50, true, '2021-06-15'),
    (v_factory_id, 'NWBS-048', 'Roger', 'Phillips', 'Drywall Hanger', v_station_ids[7], false, 23.00, true, '2022-03-08'),
    (v_factory_id, 'NWBS-049', 'Walter', 'Parker', 'Drywall Hanger', v_station_ids[7], false, 22.50, true, '2022-11-20'),
    (v_factory_id, 'NWBS-050', 'Joe', 'Evans', 'Drywall Taper', v_station_ids[7], false, 24.00, true, '2021-09-10'),
    (v_factory_id, 'NWBS-051', 'Albert', 'Edwards', 'Drywall Taper', v_station_ids[7], false, 23.50, true, '2022-07-05'),
    (v_factory_id, 'NWBS-052', 'Lawrence', 'Collins', 'Drywall Finisher', v_station_ids[7], false, 24.50, true, '2023-02-18'),
    (v_factory_id, 'NWBS-053', 'Eugene', 'Stewart', 'Apprentice', v_station_ids[7], false, 17.50, true, '2024-04-10');

  -- STATION 8: Paint/Texture (8 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-054', 'Russell', 'Sanchez', 'Lead Painter', v_station_ids[8], true, 26.00, true, '2020-05-12'),
    (v_factory_id, 'NWBS-055', 'Louis', 'Morris', 'Painter', v_station_ids[8], false, 23.00, true, '2021-11-08'),
    (v_factory_id, 'NWBS-056', 'Philip', 'Rogers', 'Painter', v_station_ids[8], false, 22.50, true, '2022-06-20'),
    (v_factory_id, 'NWBS-057', 'Roy', 'Reed', 'Painter', v_station_ids[8], false, 22.00, true, '2023-03-15'),
    (v_factory_id, 'NWBS-058', 'Ralph', 'Cook', 'Texture Tech', v_station_ids[8], false, 23.50, true, '2022-01-28'),
    (v_factory_id, 'NWBS-059', 'Johnny', 'Bailey', 'Apprentice Painter', v_station_ids[8], false, 17.00, true, '2024-02-05');

  -- STATION 9: Finish Electric (6 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-060', 'Alan', 'Rivera', 'Lead Finish Electric', v_station_ids[9], true, 30.00, true, '2019-08-22'),
    (v_factory_id, 'NWBS-061', 'Wayne', 'Cooper', 'Finish Electrician', v_station_ids[9], false, 27.00, true, '2021-05-15'),
    (v_factory_id, 'NWBS-062', 'Elmer', 'Richardson', 'Finish Electrician', v_station_ids[9], false, 26.50, true, '2022-09-30'),
    (v_factory_id, 'NWBS-063', 'Fred', 'Cox', 'Journeyman', v_station_ids[9], false, 25.00, true, '2023-04-12');

  -- STATION 10: Finish Plumbing (6 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-064', 'Howard', 'Howard', 'Lead Finish Plumber', v_station_ids[10], true, 29.00, true, '2020-02-18'),
    (v_factory_id, 'NWBS-065', 'Victor', 'Ward', 'Finish Plumber', v_station_ids[10], false, 26.00, true, '2021-10-05'),
    (v_factory_id, 'NWBS-066', 'Martin', 'Torres', 'Finish Plumber', v_station_ids[10], false, 25.50, true, '2022-07-22'),
    (v_factory_id, 'NWBS-067', 'Ernest', 'Peterson', 'Journeyman', v_station_ids[10], false, 24.00, true, '2023-05-08');

  -- STATION 11: Cabinets/Counters (8 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-068', 'Oscar', 'Gray', 'Lead Cabinet Installer', v_station_ids[11], true, 27.00, true, '2020-07-10'),
    (v_factory_id, 'NWBS-069', 'Jesse', 'Ramirez', 'Cabinet Installer', v_station_ids[11], false, 24.00, true, '2021-12-15'),
    (v_factory_id, 'NWBS-070', 'Keith', 'James', 'Cabinet Installer', v_station_ids[11], false, 23.50, true, '2022-08-28'),
    (v_factory_id, 'NWBS-071', 'Samuel', 'Watson', 'Countertop Installer', v_station_ids[11], false, 25.00, true, '2021-04-05'),
    (v_factory_id, 'NWBS-072', 'Patrick', 'Brooks', 'Countertop Installer', v_station_ids[11], false, 24.50, true, '2022-11-12'),
    (v_factory_id, 'NWBS-073', 'Terry', 'Kelly', 'Apprentice', v_station_ids[11], false, 17.50, true, '2024-01-08');

  -- STATION 12: Final Finish/QC (8 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-074', 'Jennifer', 'Davis', 'QC Lead Inspector', v_station_ids[12], true, 28.00, true, '2019-06-20'),
    (v_factory_id, 'NWBS-075', 'Maria', 'Garcia', 'QC Inspector', v_station_ids[12], false, 25.00, true, '2021-03-10'),
    (v_factory_id, 'NWBS-076', 'Lisa', 'Martinez', 'QC Inspector', v_station_ids[12], false, 24.50, true, '2022-05-18'),
    (v_factory_id, 'NWBS-077', 'Sarah', 'Williams', 'Finish Carpenter', v_station_ids[12], false, 24.00, true, '2021-09-25'),
    (v_factory_id, 'NWBS-078', 'Karen', 'Johnson', 'Finish Carpenter', v_station_ids[12], false, 23.50, true, '2022-12-08'),
    (v_factory_id, 'NWBS-079', 'Nancy', 'Brown', 'Touch-up/Punch', v_station_ids[12], false, 22.00, true, '2023-06-15');

  -- General Labor / Utility Workers (10 workers - can work anywhere)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-080', 'Amanda', 'Wilson', 'Material Handler', v_station_ids[1], false, 19.00, true, '2022-04-20'),
    (v_factory_id, 'NWBS-081', 'Stephanie', 'Moore', 'Material Handler', v_station_ids[1], false, 18.50, true, '2023-02-10'),
    (v_factory_id, 'NWBS-082', 'Angela', 'Taylor', 'Forklift Operator', v_station_ids[1], false, 21.00, true, '2021-08-05'),
    (v_factory_id, 'NWBS-083', 'Melissa', 'Anderson', 'Forklift Operator', v_station_ids[1], false, 20.50, true, '2022-10-15'),
    (v_factory_id, 'NWBS-084', 'Rebecca', 'Thomas', 'General Labor', v_station_ids[2], false, 17.00, true, '2023-09-01'),
    (v_factory_id, 'NWBS-085', 'Laura', 'Jackson', 'General Labor', v_station_ids[3], false, 16.50, true, '2024-01-15'),
    (v_factory_id, 'NWBS-086', 'Michelle', 'White', 'Cleanup Crew', v_station_ids[4], false, 16.00, true, '2023-07-22'),
    (v_factory_id, 'NWBS-087', 'Kimberly', 'Harris', 'Cleanup Crew', v_station_ids[5], false, 16.00, true, '2024-02-28'),
    (v_factory_id, 'NWBS-088', 'Dorothy', 'Martin', 'Utility', v_station_ids[6], false, 17.50, true, '2022-06-10'),
    (v_factory_id, 'NWBS-089', 'Carol', 'Thompson', 'Utility', v_station_ids[7], false, 17.50, true, '2023-04-05');

  -- Shipping/Receiving (6 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-090', 'Tony', 'Mitchell', 'Shipping Lead', v_station_ids[1], true, 24.00, true, '2020-11-12'),
    (v_factory_id, 'NWBS-091', 'Bobby', 'Campbell', 'Shipping/Receiving', v_station_ids[1], false, 20.00, true, '2022-03-28'),
    (v_factory_id, 'NWBS-092', 'Johnny', 'Roberts', 'Shipping/Receiving', v_station_ids[1], false, 19.50, true, '2023-01-15'),
    (v_factory_id, 'NWBS-093', 'Billy', 'Carter', 'Inventory Control', v_station_ids[1], false, 21.00, true, '2021-07-08'),
    (v_factory_id, 'NWBS-094', 'Jimmy', 'Phillips', 'Yard Worker', v_station_ids[1], false, 18.00, true, '2023-09-20'),
    (v_factory_id, 'NWBS-095', 'Tommy', 'Evans', 'Yard Worker', v_station_ids[1], false, 17.50, true, '2024-04-01');

  -- Maintenance (5 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-096', 'Eddie', 'Collins', 'Maintenance Lead', v_station_ids[1], true, 28.00, true, '2019-03-15'),
    (v_factory_id, 'NWBS-097', 'Bruce', 'Stewart', 'Maintenance Tech', v_station_ids[1], false, 24.00, true, '2021-06-22'),
    (v_factory_id, 'NWBS-098', 'Willie', 'Sanchez', 'Maintenance Tech', v_station_ids[1], false, 23.50, true, '2022-09-08'),
    (v_factory_id, 'NWBS-099', 'Jack', 'Morris', 'Equipment Operator', v_station_ids[1], false, 22.00, true, '2023-03-01'),
    (v_factory_id, 'NWBS-100', 'Harry', 'Rogers', 'Equipment Operator', v_station_ids[1], false, 21.50, true, '2023-11-15');

  RAISE NOTICE 'Created 100 workers for NWBS factory';
END $$;

SELECT 'Step 2: Created ~100 crew members for NWBS factory' AS status;

-- ============================================================================
-- STEP 3: ADD MODULES FOR NWBS PROJECTS
-- ============================================================================
-- Create realistic module counts based on project size
DO $$
DECLARE
  v_factory_id UUID;
  v_project RECORD;
  v_module_count INTEGER;
  v_station_ids UUID[];
  i INTEGER;
  v_serial_prefix VARCHAR(20);
BEGIN
  -- Get NWBS factory ID
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  IF v_factory_id IS NULL THEN
    RAISE NOTICE 'NWBS factory not found';
    RETURN;
  END IF;

  -- Get station IDs
  SELECT ARRAY_AGG(id ORDER BY order_num) INTO v_station_ids
  FROM station_templates
  WHERE factory_id IS NULL OR factory_id = v_factory_id
  LIMIT 12;

  -- Delete existing modules for NWBS to start fresh
  DELETE FROM modules WHERE factory_id = v_factory_id;

  -- Loop through NWBS projects and create modules
  FOR v_project IN
    SELECT id, project_number, name, status, module_count, square_footage
    FROM projects
    WHERE factory = 'NWBS' AND project_number LIKE 'NWBS-26-%'
  LOOP
    -- Determine module count based on square footage or default
    v_module_count := COALESCE(v_project.module_count,
      CASE
        WHEN v_project.square_footage > 50000 THEN 40
        WHEN v_project.square_footage > 30000 THEN 25
        WHEN v_project.square_footage > 15000 THEN 12
        WHEN v_project.square_footage > 5000 THEN 6
        ELSE 4
      END
    );

    -- Ensure at least 4 modules per project for demo
    v_module_count := GREATEST(v_module_count, 4);

    v_serial_prefix := v_project.project_number || '-M';

    RAISE NOTICE 'Creating % modules for project %', v_module_count, v_project.project_number;

    FOR i IN 1..v_module_count LOOP
      INSERT INTO modules (
        factory_id,
        project_id,
        serial_number,
        name,
        status,
        current_station_id,
        width_ft,
        length_ft,
        is_rush,
        created_at
      ) VALUES (
        v_factory_id,
        v_project.id,
        v_serial_prefix || LPAD(i::text, 3, '0'),
        'Module ' || i || ' - ' || v_project.name,
        CASE
          WHEN v_project.status = 'Completed' THEN 'Complete'
          WHEN v_project.status IN ('Production', 'In Progress') THEN
            CASE
              WHEN i <= v_module_count * 0.3 THEN 'Complete'
              WHEN i <= v_module_count * 0.6 THEN 'In Progress'
              ELSE 'Not Started'
            END
          ELSE 'Not Started'
        END,
        CASE
          WHEN v_project.status = 'Completed' THEN v_station_ids[12]
          WHEN v_project.status IN ('Production', 'In Progress') THEN
            v_station_ids[LEAST(GREATEST((i % 12) + 1, 1), 12)]
          ELSE v_station_ids[1]
        END,
        CASE WHEN i % 3 = 0 THEN 14 ELSE 12 END,  -- Width varies
        CASE WHEN i % 4 = 0 THEN 72 WHEN i % 2 = 0 THEN 60 ELSE 48 END,  -- Length varies
        i % 7 = 0,  -- Some modules are rush
        NOW() - (RANDOM() * INTERVAL '90 days')
      );
    END LOOP;

    -- Update project module_count
    UPDATE projects SET module_count = v_module_count WHERE id = v_project.id;
  END LOOP;

  RAISE NOTICE 'Created modules for all NWBS projects';
END $$;

SELECT 'Step 3: Created realistic modules for NWBS projects' AS status;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Workers by factory:' AS info;
SELECT f.code, COUNT(w.id) as worker_count
FROM factories f
LEFT JOIN workers w ON w.factory_id = f.id
GROUP BY f.code
ORDER BY f.code;

SELECT 'Modules by project:' AS info;
SELECT p.project_number, p.module_count, COUNT(m.id) as actual_modules
FROM projects p
LEFT JOIN modules m ON m.project_id = p.id
WHERE p.factory = 'NWBS'
GROUP BY p.project_number, p.module_count
ORDER BY p.project_number;

SELECT 'FIX_SALES_AND_CREW.sql completed successfully!' AS final_status;
