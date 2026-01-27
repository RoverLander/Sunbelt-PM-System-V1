-- ============================================================================
-- COMPREHENSIVE DEMO DATA FOR SUNBELT PM SYSTEM
-- ============================================================================
-- Created: January 20, 2026
-- Purpose: Populate the database with realistic demo data for all dashboards
-- Target Factory: NWBS (Northwest Building Systems)
--
-- This migration creates:
-- - Users (Sales Reps, Sales Manager, PMs, PCs, Directors, VP, IT)
-- - Sales Customers & Dealers
-- - Sales Quotes with full pipeline data
-- - Projects at various stages
-- - Tasks, RFIs, Submittals, Milestones
-- - Workers with departments
-- - Modules at various production stations
-- - QC Records
-- - Announcements & Feature Flags
--
-- IMPORTANT: After running this migration, also run:
--   supabase/demo/FIX_DIRECTORY_CONTACTS.sql
-- This will populate the directory_contacts table with all 311 Sunbelt employees
-- from the Sunbelt_Directory_Combined.csv source data.
-- ============================================================================

-- ============================================================================
-- SECTION 1: USERS
-- ============================================================================

DO $$
DECLARE
  v_factory_id UUID;
BEGIN
  -- Get NWBS factory ID
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  IF v_factory_id IS NULL THEN
    RAISE NOTICE 'NWBS factory not found - skipping user creation';
    RETURN;
  END IF;

  -- Skip if users already exist
  IF EXISTS (SELECT 1 FROM users WHERE email LIKE '%@sunbeltmodular.com' LIMIT 1) THEN
    RAISE NOTICE 'Demo users already exist - skipping';
    RETURN;
  END IF;

  -- Insert demo users
  INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active) VALUES
    -- IT Department
    (gen_random_uuid(), 'mike.chen@sunbeltmodular.com', 'Mike Chen', 'IT', 'NWBS', v_factory_id, '(503) 555-0101', true),
    (gen_random_uuid(), 'sarah.williams@sunbeltmodular.com', 'Sarah Williams', 'IT_Manager', 'NWBS', v_factory_id, '(503) 555-0102', true),

    -- Sales Team
    (gen_random_uuid(), 'john.martinez@sunbeltmodular.com', 'John Martinez', 'Sales_Rep', 'NWBS', v_factory_id, '(503) 555-0201', true),
    (gen_random_uuid(), 'emily.thompson@sunbeltmodular.com', 'Emily Thompson', 'Sales_Rep', 'NWBS', v_factory_id, '(503) 555-0202', true),
    (gen_random_uuid(), 'robert.kim@sunbeltmodular.com', 'Robert Kim', 'Sales_Manager', 'NWBS', v_factory_id, '(503) 555-0203', true),

    -- Project Management
    (gen_random_uuid(), 'lisa.anderson@sunbeltmodular.com', 'Lisa Anderson', 'PM', 'NWBS', v_factory_id, '(503) 555-0301', true),
    (gen_random_uuid(), 'david.wilson@sunbeltmodular.com', 'David Wilson', 'PM', 'NWBS', v_factory_id, '(503) 555-0302', true),
    (gen_random_uuid(), 'jennifer.brown@sunbeltmodular.com', 'Jennifer Brown', 'PC', 'NWBS', v_factory_id, '(503) 555-0303', true),
    (gen_random_uuid(), 'michael.davis@sunbeltmodular.com', 'Michael Davis', 'PC', 'NWBS', v_factory_id, '(503) 555-0304', true),

    -- Leadership
    (gen_random_uuid(), 'patricia.taylor@sunbeltmodular.com', 'Patricia Taylor', 'Director', 'NWBS', v_factory_id, '(503) 555-0401', true),
    (gen_random_uuid(), 'james.moore@sunbeltmodular.com', 'James Moore', 'VP', 'NWBS', v_factory_id, '(503) 555-0501', true),

    -- Plant Manager (Ross Parks - may already exist)
    (gen_random_uuid(), 'ross.parks@sunbeltmodular.com', 'Ross Parks', 'Plant_GM', 'NWBS', v_factory_id, '(503) 555-0601', true)
  ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE 'Created demo users';
END $$;

-- ============================================================================
-- SECTION 2: SALES CUSTOMERS
-- ============================================================================

-- Schema has BOTH 'name' (NOT NULL) and 'company_name' columns
-- Must provide values for both based on actual table structure
INSERT INTO sales_customers (id, name, company_name, company_type, contact_name, contact_title, contact_email, contact_phone, city, state, factory, is_active) VALUES
  (gen_random_uuid(), 'Pacific School District', 'Pacific School District', 'government', 'Sandra Mitchell', 'Facilities Director', 'smitchell@pacificsd.edu', '(503) 555-1001', 'Portland', 'OR', 'NWBS', true),
  (gen_random_uuid(), 'Cascade Healthcare Group', 'Cascade Healthcare Group', 'direct', 'Dr. Robert Chen', 'Chief Administrator', 'rchen@cascadehealthcare.com', '(503) 555-1002', 'Salem', 'OR', 'NWBS', true),
  (gen_random_uuid(), 'Mountain View Construction', 'Mountain View Construction', 'general', 'Tom Bradley', 'Project Manager', 'tbradley@mountainviewconst.com', '(503) 555-1003', 'Eugene', 'OR', 'NWBS', true),
  (gen_random_uuid(), 'Oregon State Parks', 'Oregon State Parks', 'government', 'Karen Foster', 'Park Manager', 'kfoster@oregonparks.gov', '(503) 555-1004', 'Bend', 'OR', 'NWBS', true),
  (gen_random_uuid(), 'Columbia River Marina', 'Columbia River Marina', 'direct', 'Steve Reynolds', 'Owner', 'sreynolds@columbiarivermarina.com', '(503) 555-1005', 'Portland', 'OR', 'NWBS', true),
  (gen_random_uuid(), 'Northwest Tech Solutions', 'Northwest Tech Solutions', 'direct', 'Amanda Peters', 'Operations Director', 'apeters@nwtech.com', '(503) 555-1006', 'Beaverton', 'OR', 'NWBS', true),
  (gen_random_uuid(), 'Willamette Valley Farms', 'Willamette Valley Farms', 'general', 'Mike Thompson', 'Farm Manager', 'mthompson@wvfarms.com', '(503) 555-1007', 'McMinnville', 'OR', 'NWBS', true),
  (gen_random_uuid(), 'Portland Metro Transit', 'Portland Metro Transit', 'government', 'Linda Garcia', 'Infrastructure Manager', 'lgarcia@pdxmetro.gov', '(503) 555-1008', 'Portland', 'OR', 'NWBS', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 3: DEALERS
-- ============================================================================

INSERT INTO dealers (id, code, name, branch_code, branch_name, contact_name, contact_email, contact_phone, city, state, factory, is_active) VALUES
  (gen_random_uuid(), 'PMSI', 'Pacific Modular Sales Inc', 'PDX', 'Portland Branch', 'Chris Anderson', 'canderson@pmsi.com', '(503) 555-2001', 'Portland', 'OR', 'NWBS', true),
  (gen_random_uuid(), 'MMG', 'Mountain Modular Group', 'BEND', 'Central Oregon', 'Jeff Williams', 'jwilliams@mmg.com', '(541) 555-2002', 'Bend', 'OR', 'NWBS', true),
  (gen_random_uuid(), 'NWMD', 'Northwest Modular Distributors', 'SEA', 'Seattle Metro', 'Rachel Brown', 'rbrown@nwmd.com', '(206) 555-2003', 'Seattle', 'WA', 'NWBS', true),
  (gen_random_uuid(), 'ORMOD', 'Oregon Modular Solutions', 'EUG', 'Eugene Office', 'Dan Miller', 'dmiller@ormod.com', '(541) 555-2004', 'Eugene', 'OR', 'NWBS', true)
ON CONFLICT (code, branch_code) DO NOTHING;

-- ============================================================================
-- SECTION 4: SALES QUOTES
-- ============================================================================

DO $$
DECLARE
  v_factory_id UUID;
  v_customer_id UUID;
  v_dealer_id UUID;
  v_sales_rep_id UUID;
  v_sales_manager_id UUID;
  v_quote_count INTEGER := 0;
BEGIN
  -- Get factory
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  -- Get sales users
  SELECT id INTO v_sales_rep_id FROM users WHERE email = 'john.martinez@sunbeltmodular.com' LIMIT 1;
  SELECT id INTO v_sales_manager_id FROM users WHERE email = 'robert.kim@sunbeltmodular.com' LIMIT 1;

  IF v_sales_rep_id IS NULL THEN
    SELECT id INTO v_sales_rep_id FROM users WHERE role = 'Sales_Rep' LIMIT 1;
  END IF;

  IF v_sales_manager_id IS NULL THEN
    SELECT id INTO v_sales_manager_id FROM users WHERE role = 'Sales_Manager' LIMIT 1;
  END IF;

  -- Skip if quotes already exist
  SELECT COUNT(*) INTO v_quote_count FROM sales_quotes WHERE factory = 'NWBS';
  IF v_quote_count > 5 THEN
    RAISE NOTICE 'Sales quotes already exist - skipping';
    RETURN;
  END IF;

  -- Get customer IDs
  FOR v_customer_id IN SELECT id FROM sales_customers WHERE factory = 'NWBS' OR factory IS NULL LIMIT 8 LOOP
    -- Get a dealer
    SELECT id INTO v_dealer_id FROM dealers WHERE factory = 'NWBS' ORDER BY random() LIMIT 1;

    -- Insert quotes in various statuses
    INSERT INTO sales_quotes (
      id, quote_number, praxis_quote_number, customer_id, dealer_id, assigned_to,
      status, total_price, building_type, building_width, building_length, square_footage,
      module_count, stories, occupancy_type, set_type, sprinkler_type, has_plumbing,
      state_tags, climate_zone, outlook_percentage, waiting_on, difficulty_rating,
      factory, praxis_source_factory, notes, valid_until, created_at
    ) VALUES
      -- High-probability deals
      (gen_random_uuid(), 'Q-2026-001', 'NWBS-001-26', v_customer_id, v_dealer_id, v_sales_rep_id,
       'negotiating', 485000, 'CUSTOM', 48, 120, 5760, 4, 1, 'B', 'PAD', 'Wet', true,
       'OR', 4, 85, 'Final pricing review', 3, 'NWBS', 'NWBS', 'Large office complex for tech company', CURRENT_DATE + 30, NOW() - INTERVAL '15 days'),

      (gen_random_uuid(), 'Q-2026-002', 'NWBS-002-26', v_customer_id, v_dealer_id, v_sales_manager_id,
       'awaiting_po', 325000, 'FLEET/STOCK', 36, 72, 2592, 2, 1, 'E', 'PIERS', 'Wet', true,
       'OR', 4, 95, 'PO expected this week', 2, 'NWBS', 'NWBS', 'Portable classroom for school district', CURRENT_DATE + 14, NOW() - INTERVAL '25 days'),

      -- Medium probability
      (gen_random_uuid(), 'Q-2026-003', 'NWBS-003-26', v_customer_id, NULL, v_sales_rep_id,
       'sent', 275000, 'GOVERNMENT', 40, 80, 3200, 2, 1, 'B', 'PAD', 'N/A', false,
       'OR', 4, 60, 'Budget approval pending', 2, 'NWBS', 'NWBS', 'Visitor center for state park', CURRENT_DATE + 45, NOW() - INTERVAL '10 days'),

      (gen_random_uuid(), 'Q-2026-004', 'NWBS-004-26', v_customer_id, v_dealer_id, v_sales_rep_id,
       'negotiating', 620000, 'CUSTOM', 56, 140, 7840, 6, 2, 'I', 'PAD', 'Wet', true,
       'WA', 4, 70, 'Engineering review', 4, 'NWBS', 'NWBS', 'Medical clinic expansion', CURRENT_DATE + 30, NOW() - INTERVAL '20 days'),

      -- PM Flagged quotes
      (gen_random_uuid(), 'Q-2026-005', 'NWBS-005-26', v_customer_id, v_dealer_id, v_sales_manager_id,
       'pending', 890000, 'CUSTOM', 64, 180, 11520, 8, 2, 'B', 'PAD', 'Wet', true,
       'OR', 4, 75, 'Customer site review', 5, 'NWBS', 'NWBS', 'Corporate headquarters - PM Required', CURRENT_DATE + 60, NOW() - INTERVAL '5 days'),

      -- Won quotes (for project conversion)
      (gen_random_uuid(), 'Q-2026-006', 'NWBS-006-26', v_customer_id, v_dealer_id, v_sales_rep_id,
       'won', 345000, 'FLEET/STOCK', 36, 96, 3456, 3, 1, 'B', 'PIERS', 'Dry', true,
       'OR', 4, 100, NULL, 2, 'NWBS', 'NWBS', 'Sales office complex', NULL, NOW() - INTERVAL '45 days'),

      -- Draft and early stage
      (gen_random_uuid(), 'Q-2026-007', 'NWBS-007-26', v_customer_id, NULL, v_sales_rep_id,
       'draft', 215000, 'CUSTOM', 32, 64, 2048, 2, 1, 'B', 'PAD', 'N/A', false,
       'OR', 4, 30, 'Initial scoping', 2, 'NWBS', 'NWBS', 'Farm equipment storage', CURRENT_DATE + 90, NOW() - INTERVAL '2 days'),

      -- Lost quote
      (gen_random_uuid(), 'Q-2026-008', 'NWBS-008-26', v_customer_id, v_dealer_id, v_sales_rep_id,
       'lost', 410000, 'GOVERNMENT', 48, 100, 4800, 4, 1, 'A', 'PAD', 'Wet', true,
       'OR', 4, 0, 'Lost to competitor', 3, 'NWBS', 'NWBS', 'Public transit maintenance facility', NULL, NOW() - INTERVAL '60 days');

    EXIT; -- Only need one customer for these quotes
  END LOOP;

  -- Update PM flagged quotes
  -- Schema uses: pm_flagged (boolean), pm_flagged_at (timestamp), pm_flagged_reason (text)
  UPDATE sales_quotes SET
    pm_flagged = true,
    pm_flagged_at = NOW() - INTERVAL '3 days',
    pm_flagged_reason = 'Complex multi-story project requiring PM oversight'
  WHERE quote_number = 'Q-2026-005' AND factory = 'NWBS';

  UPDATE sales_quotes SET
    pm_flagged = true,
    pm_flagged_at = NOW() - INTERVAL '7 days',
    pm_flagged_reason = 'Healthcare facility with strict compliance requirements'
  WHERE quote_number = 'Q-2026-004' AND factory = 'NWBS';

  -- Set won date for won quotes
  UPDATE sales_quotes SET
    won_date = CURRENT_DATE - 30
  WHERE status = 'won' AND factory = 'NWBS' AND won_date IS NULL;

  RAISE NOTICE 'Created demo sales quotes';
END $$;

-- ============================================================================
-- SECTION 5: PROJECTS
-- ============================================================================

DO $$
DECLARE
  v_factory_id UUID;
  v_pm_id UUID;
  v_pc_id UUID;
  v_director_id UUID;
  v_won_quote RECORD;
  v_project_id UUID;
BEGIN
  -- Get factory
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  -- Get user IDs
  SELECT id INTO v_pm_id FROM users WHERE role = 'PM' AND factory = 'NWBS' LIMIT 1;
  SELECT id INTO v_pc_id FROM users WHERE role = 'PC' AND factory = 'NWBS' LIMIT 1;
  SELECT id INTO v_director_id FROM users WHERE role = 'Director' AND factory = 'NWBS' LIMIT 1;

  -- Skip if projects exist
  IF EXISTS (SELECT 1 FROM projects WHERE factory ILIKE '%NWBS%' AND project_number LIKE 'NWBS-2026%' LIMIT 1) THEN
    RAISE NOTICE 'Demo projects already exist - skipping';
    RETURN;
  END IF;

  -- Create projects from won quotes (skip if no won quotes or schema mismatch)
  -- Note: Some DBs may not have all fields on sales_quotes, so we create standalone projects instead
  -- FOR v_won_quote IN SELECT * FROM sales_quotes WHERE status = 'won' AND factory = 'NWBS' LIMIT 3 LOOP ... END LOOP;

  -- Create additional standalone projects at various stages
  INSERT INTO projects (
    id, project_number, name, client_name, factory, status, health_status, current_phase,
    contract_value, primary_pm_id, owner_id, start_date, delivery_date,
    building_type, building_width, building_length, module_count, stories,
    occupancy_type, set_type, is_pm_job, created_at
  ) VALUES
    -- Planning phase projects
    (gen_random_uuid(), 'NWBS-2026-101', 'Riverside Elementary Classrooms', 'Riverside School District',
     'NWBS - Northwest Building Systems', 'Planning', 'On Track', 1,
     520000, v_pm_id, v_director_id, CURRENT_DATE + 14, CURRENT_DATE + 120,
     'EDUCATION', 48, 96, 4, 1, 'E', 'PIERS', true, NOW() - INTERVAL '5 days'),

    (gen_random_uuid(), 'NWBS-2026-102', 'Mountain View Office Complex', 'Mountain View Construction',
     'NWBS - Northwest Building Systems', 'Planning', 'On Track', 1,
     680000, NULL, v_director_id, CURRENT_DATE + 30, CURRENT_DATE + 150,
     'CUSTOM', 56, 140, 6, 2, 'B', 'PAD', true, NOW() - INTERVAL '3 days'),

    -- Active projects
    (gen_random_uuid(), 'NWBS-2026-050', 'Oregon Parks Ranger Station', 'Oregon State Parks',
     'NWBS - Northwest Building Systems', 'In Progress', 'On Track', 2,
     285000, v_pm_id, v_director_id, CURRENT_DATE - 45, CURRENT_DATE + 45,
     'GOVERNMENT', 36, 72, 2, 1, 'B', 'PAD', false, NOW() - INTERVAL '50 days'),

    (gen_random_uuid(), 'NWBS-2026-051', 'Columbia Marina Office', 'Columbia River Marina',
     'NWBS - Northwest Building Systems', 'In Progress', 'At Risk', 3,
     195000, v_pm_id, v_director_id, CURRENT_DATE - 60, CURRENT_DATE + 15,
     'CUSTOM', 24, 48, 1, 1, 'B', 'PIERS', false, NOW() - INTERVAL '65 days'),

    -- Production phase
    (gen_random_uuid(), 'NWBS-2026-025', 'Valley Tech Solutions HQ', 'Northwest Tech Solutions',
     'NWBS - Northwest Building Systems', 'Production', 'On Track', 4,
     890000, v_pm_id, v_director_id, CURRENT_DATE - 90, CURRENT_DATE + 30,
     'CUSTOM', 64, 160, 8, 2, 'B', 'PAD', true, NOW() - INTERVAL '95 days'),

    -- PC/Stock jobs (non-PM)
    (gen_random_uuid(), 'NWBS-2026-S01', 'Standard Office 24x60', 'Stock Inventory',
     'NWBS - Northwest Building Systems', 'Production', 'On Track', 4,
     125000, NULL, v_pc_id, CURRENT_DATE - 30, CURRENT_DATE + 14,
     'FLEET/STOCK', 24, 60, 1, 1, 'B', 'PAD', false, NOW() - INTERVAL '35 days'),

    (gen_random_uuid(), 'NWBS-2026-S02', 'Standard Classroom 36x72', 'Stock Inventory',
     'NWBS - Northwest Building Systems', 'Production', 'On Track', 4,
     165000, NULL, v_pc_id, CURRENT_DATE - 20, CURRENT_DATE + 21,
     'FLEET/STOCK', 36, 72, 2, 1, 'E', 'PIERS', false, NOW() - INTERVAL '25 days');

  RAISE NOTICE 'Created demo projects';
END $$;

-- ============================================================================
-- SECTION 6: WORKERS WITH DEPARTMENTS
-- ============================================================================

DO $$
DECLARE
  v_factory_id UUID;
  v_station_id UUID;
BEGIN
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  IF v_factory_id IS NULL THEN
    RAISE NOTICE 'NWBS factory not found - skipping worker creation';
    RETURN;
  END IF;

  -- Skip if workers with departments exist
  IF EXISTS (SELECT 1 FROM workers WHERE factory_id = v_factory_id AND department IS NOT NULL LIMIT 1) THEN
    RAISE NOTICE 'Workers with departments already exist - skipping';
    RETURN;
  END IF;

  -- Get first station for default assignment
  SELECT id INTO v_station_id FROM station_templates WHERE factory_id IS NULL ORDER BY order_num LIMIT 1;

  -- Clear existing demo workers if they don't have departments
  DELETE FROM workers WHERE factory_id = v_factory_id AND department IS NULL;

  -- Insert workers organized by department
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, department, primary_station_id, is_lead, hourly_rate, is_active, hire_date) VALUES
    -- Framing Department
    (v_factory_id, 'FRM-001', 'Marcus', 'Johnson', 'Lead Welder', 'Framing', v_station_id, true, 32.50, true, '2020-03-15'),
    (v_factory_id, 'FRM-002', 'Alex', 'Rivera', 'Welder', 'Framing', v_station_id, false, 28.00, true, '2021-06-01'),
    (v_factory_id, 'FRM-003', 'Chris', 'Taylor', 'Welder', 'Framing', v_station_id, false, 27.50, true, '2022-01-15'),
    (v_factory_id, 'FRM-004', 'Jordan', 'Lee', 'Welder Apprentice', 'Framing', v_station_id, false, 22.00, true, '2024-06-01'),

    -- Rough Carpentry Department
    (v_factory_id, 'RCP-001', 'Miguel', 'Santos', 'Lead Carpenter', 'Rough Carpentry', v_station_id, true, 31.00, true, '2019-08-20'),
    (v_factory_id, 'RCP-002', 'David', 'Chen', 'Carpenter', 'Rough Carpentry', v_station_id, false, 26.50, true, '2021-03-10'),
    (v_factory_id, 'RCP-003', 'Ryan', 'Miller', 'Carpenter', 'Rough Carpentry', v_station_id, false, 26.00, true, '2022-05-22'),
    (v_factory_id, 'RCP-004', 'Tyler', 'Brown', 'Carpenter', 'Rough Carpentry', v_station_id, false, 25.50, true, '2023-02-14'),

    -- Electrical Department
    (v_factory_id, 'ELE-001', 'James', 'Wilson', 'Lead Electrician', 'Electrical', v_station_id, true, 34.00, true, '2018-11-05'),
    (v_factory_id, 'ELE-002', 'Sarah', 'Martinez', 'Electrician', 'Electrical', v_station_id, false, 29.50, true, '2020-07-18'),
    (v_factory_id, 'ELE-003', 'Kevin', 'Thompson', 'Electrician', 'Electrical', v_station_id, false, 28.50, true, '2022-09-01'),

    -- Plumbing Department
    (v_factory_id, 'PLB-001', 'Robert', 'Garcia', 'Lead Plumber', 'Plumbing', v_station_id, true, 33.00, true, '2019-04-12'),
    (v_factory_id, 'PLB-002', 'Michael', 'Davis', 'Plumber', 'Plumbing', v_station_id, false, 28.00, true, '2021-08-25'),
    (v_factory_id, 'PLB-003', 'Daniel', 'Anderson', 'Plumber', 'Plumbing', v_station_id, false, 27.00, true, '2023-01-09'),

    -- HVAC Department
    (v_factory_id, 'HVC-001', 'William', 'Thomas', 'Lead HVAC Tech', 'HVAC', v_station_id, true, 32.00, true, '2020-02-28'),
    (v_factory_id, 'HVC-002', 'Anthony', 'Jackson', 'HVAC Technician', 'HVAC', v_station_id, false, 27.50, true, '2022-04-15'),

    -- Interior Rough Department
    (v_factory_id, 'INT-001', 'Christopher', 'White', 'Lead Interior Framer', 'Interior Rough', v_station_id, true, 30.00, true, '2019-10-01'),
    (v_factory_id, 'INT-002', 'Matthew', 'Harris', 'Interior Framer', 'Interior Rough', v_station_id, false, 25.00, true, '2021-12-06'),
    (v_factory_id, 'INT-003', 'Andrew', 'Clark', 'Interior Framer', 'Interior Rough', v_station_id, false, 24.50, true, '2023-05-20'),

    -- Interior Finish Department
    (v_factory_id, 'FIN-001', 'Jennifer', 'Lopez', 'Lead Finish Carpenter', 'Interior Finish', v_station_id, true, 31.50, true, '2018-06-15'),
    (v_factory_id, 'FIN-002', 'Jessica', 'Lewis', 'Finish Carpenter', 'Interior Finish', v_station_id, false, 26.00, true, '2020-11-30'),
    (v_factory_id, 'FIN-003', 'Amanda', 'Walker', 'Finish Carpenter', 'Interior Finish', v_station_id, false, 25.50, true, '2022-08-10'),
    (v_factory_id, 'FIN-004', 'Nicole', 'Hall', 'Painter', 'Interior Finish', v_station_id, false, 23.00, true, '2024-01-15'),

    -- Exterior Siding Department
    (v_factory_id, 'EXT-001', 'Carlos', 'Mendez', 'Lead Siding Installer', 'Exterior Siding', v_station_id, true, 30.50, true, '2019-05-20'),
    (v_factory_id, 'EXT-002', 'Ramon', 'Gutierrez', 'Siding Installer', 'Exterior Siding', v_station_id, false, 26.00, true, '2021-09-15'),
    (v_factory_id, 'EXT-003', 'Luis', 'Ortega', 'Siding Installer', 'Exterior Siding', v_station_id, false, 25.00, true, '2023-03-01'),

    -- Inspection/QC Department
    (v_factory_id, 'QC-001', 'Patricia', 'Young', 'Lead QC Inspector', 'QC', v_station_id, true, 35.00, true, '2017-09-01'),
    (v_factory_id, 'QC-002', 'Elizabeth', 'King', 'QC Inspector', 'QC', v_station_id, false, 30.00, true, '2021-02-18'),

    -- Staging/Material Handling
    (v_factory_id, 'STG-001', 'Thomas', 'Wright', 'Staging Lead', 'Staging', v_station_id, true, 28.00, true, '2020-05-10'),
    (v_factory_id, 'STG-002', 'Brian', 'Scott', 'Forklift Operator', 'Material Handling', v_station_id, false, 24.00, true, '2022-03-25'),
    (v_factory_id, 'STG-003', 'Steven', 'Green', 'Material Handler', 'Material Handling', v_station_id, false, 22.00, true, '2023-07-01');

  RAISE NOTICE 'Created 31 demo workers with departments';
END $$;

-- ============================================================================
-- SECTION 7: MODULES
-- ============================================================================

DO $$
DECLARE
  v_factory_id UUID;
  v_project RECORD;
  v_station_id UUID;
  v_module_seq INTEGER;
BEGIN
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  IF v_factory_id IS NULL THEN
    RAISE NOTICE 'NWBS factory not found - skipping module creation';
    RETURN;
  END IF;

  -- Skip if modules exist
  IF EXISTS (SELECT 1 FROM modules WHERE factory_id = v_factory_id LIMIT 1) THEN
    RAISE NOTICE 'Modules already exist - skipping';
    RETURN;
  END IF;

  -- Create modules for each active project
  FOR v_project IN
    SELECT * FROM projects
    WHERE factory ILIKE '%NWBS%'
    AND status IN ('In Progress', 'Production')
    AND module_count IS NOT NULL
  LOOP
    v_module_seq := 1;

    WHILE v_module_seq <= LEAST(v_project.module_count, 8) LOOP
      -- Determine station based on module sequence (simulate production flow)
      SELECT id INTO v_station_id FROM station_templates
      WHERE factory_id IS NULL
      AND order_num = LEAST(v_module_seq + 2, 12)
      LIMIT 1;

      INSERT INTO modules (
        project_id, factory_id, serial_number, name, sequence_number,
        status, current_station_id, scheduled_start, scheduled_end,
        building_category, is_rush, module_width, module_length
      ) VALUES (
        v_project.id,
        v_factory_id,
        v_project.project_number || '-M' || LPAD(v_module_seq::text, 2, '0'),
        'Module ' || chr(64 + v_module_seq), -- A, B, C, etc.
        v_module_seq,
        CASE
          WHEN v_module_seq <= 2 THEN 'In Progress'
          WHEN v_module_seq <= 4 THEN 'In Queue'
          ELSE 'Not Started'
        END,
        v_station_id,
        v_project.start_date + (v_module_seq - 1) * 7,
        v_project.start_date + (v_module_seq - 1) * 7 + 14,
        CASE v_project.building_type
          WHEN 'FLEET/STOCK' THEN 'stock'
          WHEN 'GOVERNMENT' THEN 'government'
          ELSE 'custom'
        END,
        CASE WHEN v_project.health_status = 'At Risk' AND v_module_seq = 1 THEN true ELSE false END,
        COALESCE(v_project.building_width / NULLIF(v_project.module_count, 0), 12),
        COALESCE(v_project.building_length, 60)
      );

      v_module_seq := v_module_seq + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created modules for active projects';
END $$;

-- ============================================================================
-- SECTION 8: WORKER SHIFTS (Today's Attendance)
-- ============================================================================

DO $$
DECLARE
  v_factory_id UUID;
  v_worker RECORD;
  v_shift_count INTEGER := 0;
BEGIN
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  IF v_factory_id IS NULL THEN
    RETURN;
  END IF;

  -- Skip if shifts exist for today
  IF EXISTS (SELECT 1 FROM worker_shifts WHERE factory_id = v_factory_id AND DATE(clock_in) = CURRENT_DATE LIMIT 1) THEN
    RAISE NOTICE 'Today shifts already exist - skipping';
    RETURN;
  END IF;

  -- Create shifts for most workers (85% present)
  FOR v_worker IN
    SELECT * FROM workers
    WHERE factory_id = v_factory_id AND is_active = true
    ORDER BY random()
  LOOP
    IF random() < 0.85 THEN -- 85% attendance rate
      INSERT INTO worker_shifts (worker_id, factory_id, clock_in, source, status)
      VALUES (
        v_worker.id,
        v_factory_id,
        CURRENT_DATE + INTERVAL '6 hours' + (random() * INTERVAL '30 minutes'),
        'kiosk',
        'active'
      );
      v_shift_count := v_shift_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Created % shifts for today', v_shift_count;
END $$;

-- ============================================================================
-- SECTION 9: QC RECORDS
-- ============================================================================

DO $$
DECLARE
  v_factory_id UUID;
  v_module RECORD;
  v_station_id UUID;
  v_inspector_id UUID;
BEGIN
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  IF v_factory_id IS NULL THEN
    RETURN;
  END IF;

  -- Get QC inspector
  SELECT id INTO v_inspector_id FROM workers
  WHERE factory_id = v_factory_id AND department = 'QC' AND is_lead = true LIMIT 1;

  -- Skip if QC records exist
  IF EXISTS (SELECT 1 FROM qc_records WHERE factory_id = v_factory_id LIMIT 1) THEN
    RAISE NOTICE 'QC records already exist - skipping';
    RETURN;
  END IF;

  -- Create QC records for modules in progress
  FOR v_module IN
    SELECT m.*, s.id as station_id
    FROM modules m
    JOIN station_templates s ON m.current_station_id = s.id
    WHERE m.factory_id = v_factory_id
    AND m.status = 'In Progress'
    LIMIT 10
  LOOP
    INSERT INTO qc_records (
      module_id, station_id, factory_id, inspector_id, status, passed, score,
      checklist_results, notes, inspected_at
    ) VALUES (
      v_module.id,
      v_module.station_id,
      v_factory_id,
      v_inspector_id,
      CASE WHEN random() > 0.2 THEN 'Passed' ELSE 'Failed' END,
      random() > 0.2,
      floor(random() * 20 + 80)::integer,
      '[{"q": "Frame alignment", "passed": true}, {"q": "Weld quality", "passed": true}, {"q": "Measurements", "passed": true}]'::jsonb,
      CASE WHEN random() > 0.7 THEN 'Minor corrections needed' ELSE 'Inspection passed' END,
      NOW() - (random() * INTERVAL '7 days')
    );
  END LOOP;

  RAISE NOTICE 'Created QC records for modules';
END $$;

-- ============================================================================
-- SECTION 10: TASKS, RFIs, SUBMITTALS
-- ============================================================================

DO $$
DECLARE
  v_project RECORD;
  v_pm_id UUID;
  v_task_count INTEGER := 0;
  v_existing_count INTEGER := 0;
BEGIN
  SELECT id INTO v_pm_id FROM users WHERE role = 'PM' AND factory = 'NWBS' LIMIT 1;

  -- Skip if tasks/RFIs/submittals already exist for NWBS projects
  SELECT COUNT(*) INTO v_existing_count
  FROM submittals s
  JOIN projects p ON s.project_id = p.id
  WHERE p.factory ILIKE '%NWBS%';

  IF v_existing_count > 0 THEN
    RAISE NOTICE 'Tasks/RFIs/Submittals already exist for NWBS projects (% submittals found) - skipping', v_existing_count;
    RETURN;
  END IF;

  FOR v_project IN
    SELECT * FROM projects
    WHERE factory ILIKE '%NWBS%'
    AND status IN ('In Progress', 'Production', 'Planning')
    LIMIT 5
  LOOP
    -- Create tasks (no unique constraint, but check anyway)
    IF NOT EXISTS (SELECT 1 FROM tasks WHERE project_id = v_project.id LIMIT 1) THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, internal_owner_id)
      VALUES
        (v_project.id, 'Review engineering drawings', 'Complete review of structural drawings',
         'In Progress', 'High', CURRENT_DATE + 7, v_pm_id),
        (v_project.id, 'Coordinate with electrical subcontractor', 'Finalize electrical rough-in schedule',
         'Not Started', 'Medium', CURRENT_DATE + 14, v_pm_id),
        (v_project.id, 'Submit permit documents', 'Prepare and submit building permit application',
         'Completed', 'High', CURRENT_DATE - 7, v_pm_id);
      v_task_count := v_task_count + 3;
    END IF;

    -- Create RFIs (has unique constraint on project_id + rfi_number)
    IF NOT EXISTS (SELECT 1 FROM rfis WHERE project_id = v_project.id AND rfi_number = v_project.project_number || '-RFI-001' LIMIT 1) THEN
      INSERT INTO rfis (project_id, rfi_number, subject, question, status, priority, due_date, internal_owner_id)
      VALUES
        (v_project.id, v_project.project_number || '-RFI-001', 'Foundation detail clarification',
         'Please clarify the foundation bolt pattern per sheet S-2.1', 'Open', 'High', CURRENT_DATE + 5, v_pm_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rfis WHERE project_id = v_project.id AND rfi_number = v_project.project_number || '-RFI-002' LIMIT 1) THEN
      INSERT INTO rfis (project_id, rfi_number, subject, question, status, priority, due_date, internal_owner_id)
      VALUES
        (v_project.id, v_project.project_number || '-RFI-002', 'Exterior finish specification',
         'Confirm exterior siding color and material', 'Pending', 'Medium', CURRENT_DATE + 10, v_pm_id);
    END IF;

    -- Create submittals (has unique constraint on project_id + submittal_number)
    IF NOT EXISTS (SELECT 1 FROM submittals WHERE project_id = v_project.id AND submittal_number = v_project.project_number || '-SUB-001' LIMIT 1) THEN
      INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, due_date, internal_owner_id)
      VALUES
        (v_project.id, v_project.project_number || '-SUB-001', 'HVAC Equipment',
         'Product Data', 'Under Review', CURRENT_DATE + 7, v_pm_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM submittals WHERE project_id = v_project.id AND submittal_number = v_project.project_number || '-SUB-002' LIMIT 1) THEN
      INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, due_date, internal_owner_id)
      VALUES
        (v_project.id, v_project.project_number || '-SUB-002', 'Electrical Panel Schedule',
         'Shop Drawings', 'Approved', CURRENT_DATE - 3, v_pm_id);
    END IF;
  END LOOP;

  RAISE NOTICE 'Created % tasks plus RFIs and submittals', v_task_count;
END $$;

-- ============================================================================
-- SECTION 11: ANNOUNCEMENTS & FEATURE FLAGS
-- ============================================================================

-- Drop NOT NULL on legacy columns if they exist
DO $$
BEGIN
  ALTER TABLE announcements ALTER COLUMN message DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE feature_flags ALTER COLUMN key DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Announcements (check by title to avoid duplicates on re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'System Maintenance Scheduled' LIMIT 1) THEN
    INSERT INTO announcements (id, title, content, message, announcement_type, is_active, is_dismissible, starts_at, expires_at)
    VALUES (gen_random_uuid(), 'System Maintenance Scheduled',
     'The system will undergo scheduled maintenance this Saturday from 10 PM to 2 AM PST. Please save your work before this time.',
     'The system will undergo scheduled maintenance this Saturday from 10 PM to 2 AM PST. Please save your work before this time.',
     'maintenance', true, true, NOW(), NOW() + INTERVAL '7 days');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'New Feature: Weekly Reports' LIMIT 1) THEN
    INSERT INTO announcements (id, title, content, message, announcement_type, is_active, is_dismissible, starts_at, expires_at)
    VALUES (gen_random_uuid(), 'New Feature: Weekly Reports',
     'You can now generate weekly and monthly reports in the Plant Manager Dashboard! Check out the new Report Generator.',
     'You can now generate weekly and monthly reports in the Plant Manager Dashboard! Check out the new Report Generator.',
     'info', true, true, NOW(), NOW() + INTERVAL '30 days');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'Safety Reminder' LIMIT 1) THEN
    INSERT INTO announcements (id, title, content, message, announcement_type, is_active, is_dismissible, starts_at, expires_at)
    VALUES (gen_random_uuid(), 'Safety Reminder',
     'Please remember to wear appropriate PPE in all production areas. Safety glasses and steel-toed boots are mandatory.',
     'Please remember to wear appropriate PPE in all production areas. Safety glasses and steel-toed boots are mandatory.',
     'warning', true, false, NOW(), NOW() + INTERVAL '90 days');
  END IF;

  RAISE NOTICE 'Created demo announcements';
END $$;

-- Feature Flags (flag_key is unique, so use ON CONFLICT)
INSERT INTO feature_flags (id, flag_key, key, name, description, category, is_enabled)
VALUES
  (gen_random_uuid(), 'pwa_inventory_receiving', 'pwa_inventory_receiving', 'PWA Inventory Receiving',
   'Enable inventory receiving feature in the PWA mobile app', 'feature', true),

  (gen_random_uuid(), 'weekly_monthly_reports', 'weekly_monthly_reports', 'Weekly/Monthly Reports',
   'Enable aggregated weekly and monthly report generation', 'feature', true),

  (gen_random_uuid(), 'ai_schedule_optimization', 'ai_schedule_optimization', 'AI Schedule Optimization',
   'Experimental AI-powered production schedule optimization', 'experimental', false),

  (gen_random_uuid(), 'dark_mode', 'dark_mode', 'Dark Mode',
   'Enable dark mode UI theme option', 'ui', true)
ON CONFLICT (flag_key) DO NOTHING;

-- ============================================================================
-- SECTION 12: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_users INTEGER;
  v_customers INTEGER;
  v_dealers INTEGER;
  v_quotes INTEGER;
  v_projects INTEGER;
  v_workers INTEGER;
  v_modules INTEGER;
  v_shifts INTEGER;
  v_qc_records INTEGER;
  v_tasks INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_users FROM users WHERE factory = 'NWBS';
  SELECT COUNT(*) INTO v_customers FROM sales_customers WHERE factory = 'NWBS' OR factory IS NULL;
  SELECT COUNT(*) INTO v_dealers FROM dealers WHERE factory = 'NWBS';
  SELECT COUNT(*) INTO v_quotes FROM sales_quotes WHERE factory = 'NWBS';
  SELECT COUNT(*) INTO v_projects FROM projects WHERE factory ILIKE '%NWBS%';
  SELECT COUNT(*) INTO v_workers FROM workers w JOIN factories f ON w.factory_id = f.id WHERE f.code = 'NWBS';
  SELECT COUNT(*) INTO v_modules FROM modules m JOIN factories f ON m.factory_id = f.id WHERE f.code = 'NWBS';
  SELECT COUNT(*) INTO v_shifts FROM worker_shifts ws JOIN factories f ON ws.factory_id = f.id WHERE f.code = 'NWBS' AND DATE(ws.clock_in) = CURRENT_DATE;
  SELECT COUNT(*) INTO v_qc_records FROM qc_records qc JOIN factories f ON qc.factory_id = f.id WHERE f.code = 'NWBS';
  SELECT COUNT(*) INTO v_tasks FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.factory ILIKE '%NWBS%';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPREHENSIVE DEMO DATA SUMMARY (NWBS)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users: %', v_users;
  RAISE NOTICE 'Customers: %', v_customers;
  RAISE NOTICE 'Dealers: %', v_dealers;
  RAISE NOTICE 'Sales Quotes: %', v_quotes;
  RAISE NOTICE 'Projects: %', v_projects;
  RAISE NOTICE 'Workers: %', v_workers;
  RAISE NOTICE 'Modules: %', v_modules;
  RAISE NOTICE 'Today Shifts: %', v_shifts;
  RAISE NOTICE 'QC Records: %', v_qc_records;
  RAISE NOTICE 'Tasks: %', v_tasks;
  RAISE NOTICE '========================================';
END $$;
