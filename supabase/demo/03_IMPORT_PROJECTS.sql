-- ============================================================================
-- STEP 3: IMPORT PROJECTS AND GENERATE SAMPLE DATA
-- ============================================================================
-- Imports 20 real projects from Excel and generates realistic sample data
-- ============================================================================

-- First, let's ensure we have PM users (get existing or create from auth.users)
-- Check existing users
SELECT id, name, email, role FROM users WHERE role IN ('PM', 'Director', 'VP', 'IT', 'PC', 'Admin');

-- ============================================================================
-- Create PM users from auth.users (they must exist in Supabase Auth first!)
-- ============================================================================

-- Candy Juhnke
INSERT INTO users (id, email, name, role, is_active, created_at)
SELECT id, 'candy.juhnke@sunbeltmodular.com', 'Candy Juhnke', 'PM', true, NOW()
FROM auth.users WHERE email = 'candy.juhnke@sunbeltmodular.com'
ON CONFLICT (id) DO UPDATE SET name = 'Candy Juhnke', role = 'PM', is_active = true;

-- Crystal Meyers (note: auth user may be crystal.meyers)
INSERT INTO users (id, email, name, role, is_active, created_at)
SELECT id, email, 'Crystal Meyers', 'PM', true, NOW()
FROM auth.users WHERE email LIKE 'crystal.me%@sunbeltmodular.com'
ON CONFLICT (id) DO UPDATE SET name = 'Crystal Meyers', role = 'PM', is_active = true;

-- Matthew McDaniel
INSERT INTO users (id, email, name, role, is_active, created_at)
SELECT id, 'matthew.mcdaniel@sunbeltmodular.com', 'Matthew McDaniel', 'PM', true, NOW()
FROM auth.users WHERE email = 'matthew.mcdaniel@sunbeltmodular.com'
ON CONFLICT (id) DO UPDATE SET name = 'Matthew McDaniel', role = 'PM', is_active = true;

-- Hector Vazquez
INSERT INTO users (id, email, name, role, is_active, created_at)
SELECT id, 'hector.vazquez@sunbeltmodular.com', 'Hector Vazquez', 'PM', true, NOW()
FROM auth.users WHERE email = 'hector.vazquez@sunbeltmodular.com'
ON CONFLICT (id) DO UPDATE SET name = 'Hector Vazquez', role = 'PM', is_active = true;

-- Michael Caracciolo
INSERT INTO users (id, email, name, role, is_active, created_at)
SELECT id, 'michael.caracciolo@sunbeltmodular.com', 'Michael Caracciolo', 'PM', true, NOW()
FROM auth.users WHERE email = 'michael.caracciolo@sunbeltmodular.com'
ON CONFLICT (id) DO UPDATE SET name = 'Michael Caracciolo', role = 'PM', is_active = true;

-- ============================================================================
-- Import the 20 Projects
-- ============================================================================

-- Get PM user IDs for reference
DO $$
DECLARE
  v_candy_id UUID;
  v_crystal_id UUID;
  v_matthew_id UUID;
  v_hector_id UUID;
  v_michael_id UUID;
  v_project_id UUID;
BEGIN
  -- Get PM IDs
  SELECT id INTO v_candy_id FROM users WHERE name = 'Candy Juhnke' LIMIT 1;
  SELECT id INTO v_crystal_id FROM users WHERE name = 'Crystal Meyers' LIMIT 1;
  SELECT id INTO v_matthew_id FROM users WHERE name = 'Matthew McDaniel' LIMIT 1;
  SELECT id INTO v_hector_id FROM users WHERE name = 'Hector Vazquez' LIMIT 1;
  SELECT id INTO v_michael_id FROM users WHERE name = 'Michael Caracciolo' LIMIT 1;

  -- ========================================================================
  -- PROJECT 1: Florence AZ Medical (Phoenix - In Progress)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, owner_id, created_at
  ) VALUES (
    'PMI-6781', 'I-3 - Florence AZ Medical Intake/X-Ray Ctr 2-Story', 'Phoenix',
    'SPECIALIZED TESTING & CONSTRUCTION', 'George Avila',
    '2025-09-25', '2026-08-25', 'In Progress', 'On Track',
    v_candy_id, v_candy_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 2: ACIC GERMANY (Southeast - Planning)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SMM-21145', 'ACIC GERMANY- II-B', 'Southeast',
    'MODULAR MANAGEMENT GROUP', 'Jason King',
    '2025-11-19', NULL, 'Planning', 'On Track',
    v_candy_id, v_crystal_id, v_candy_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 3: Disney Conference Building (Southeast - Past Due!)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, owner_id, created_at
  ) VALUES (
    'SMM-21003', '96X60 DISNEY CONFERENCE BUILDING 160MPH', 'Southeast',
    'MOBILE MODULAR- AUBURNDALE', 'Shawn Durante',
    '2024-07-16', '2025-02-04', 'In Progress', 'Critical',
    v_crystal_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 4: VA-PREP MODULE (Southeast - In Progress)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SMM-21055', '12''X56'' VA-PREP MODULE (FL,TX,SC)', 'Southeast',
    'KITCHENS TO GO', 'Jason King',
    '2025-02-24', '2025-07-12', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 5: VA-WASH MODULE (Southeast - In Progress)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SMM-21056', '12''X56'' VA-WASH MODULE (FL,TX,SC)', 'Southeast',
    'KITCHENS TO GO', 'Jason King',
    '2025-02-24', '2025-07-19', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 6: VA-COOK MODULE (Southeast - In Progress)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SMM-21057', '12''X56'' VA-COOK MODULE (FL,TX,SC)', 'Southeast',
    'KITCHENS TO GO', 'Jason King',
    '2025-02-24', '2025-07-26', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 7: Mike Dover A-B 8-CR (SSI - Planning)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SSI-7669', '140''X68'' MIKE DOVER A-B 8-CR 120MPH 57#SN/LD', 'SSI',
    'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis',
    '2025-12-11', '2026-02-04', 'Planning', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 8: Mike Dover C-D Custom (SSI - Planning)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SSI-7670', 'CUSTOM COMPLEX MIKE DOVER 8-CR C-D 120MPH 57#SN/LD', 'SSI',
    'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis',
    '2025-12-11', '2025-12-29', 'Planning', 'At Risk',
    v_crystal_id, v_candy_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 9: Mike Dover Multi Purpose (SSI - Planning)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SSI-7671', '84''X55'' MIKE DOVER MULTI PURPOSE 120MPH 57#SN/LD', 'SSI',
    'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis',
    '2025-12-11', '2026-01-21', 'Planning', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 10: Mike Food Service (SSI - Planning)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SSI-7672', '14''X55'' MIKE FOOD SERVICE 120MPH 57#SN/LD', 'SSI',
    'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis',
    '2025-12-11', '2026-01-26', 'Planning', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 11: Google Summerville VA-WASH (Southeast - In Progress)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SMM-21054', '12''X56'' VA-WASH MODULE (GOOGLE SUMMERVILLE)', 'Southeast',
    'KITCHENS TO GO', 'Jason King',
    '2025-02-24', '2026-05-02', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 12: SCIF WA State (Southeast - Planning)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, owner_id, created_at
  ) VALUES (
    'SMM-21103', '2B 24x50 SCIF WA State PE Certification 160mph', 'Southeast',
    'AFFORDABLE STRUCTURES - TAVARES', 'Roger Diamond',
    '2025-06-24', '2026-02-19', 'Planning', 'On Track',
    v_crystal_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 13: Patrick Space Force Base (Southeast - In Progress)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SMM-21020', 'Patrick Space Force Base Building 1, 160MPH', 'Southeast',
    'MODULAR MANAGEMENT GROUP', 'Don Eisman',
    '2024-09-30', '2025-04-07', 'In Progress', 'At Risk',
    v_crystal_id, v_matthew_id, v_crystal_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 14: Point Magu Naval Base (Indicom - Awaiting Customer Signoff)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    '25B579-584', 'POINT MAGU NAVAL BASE (REACT) CA', 'Indicom',
    'MODULAR MANAGEMENT GROUP', 'Jason King',
    '2025-07-15', '2026-02-26', 'PM Handoff', 'On Track',
    v_hector_id, v_michael_id, v_hector_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 15: Hanford AMPS (NWBS - Complete) - SHOWCASE PROJECT
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, owner_id, created_at
  ) VALUES (
    'NWBS-25250', '168x66 Hanford AMPS Project MMG', 'NWBS',
    'Mobile Modular Management Corporation', 'Mitch Quintana',
    '2025-07-21', '2026-01-10', 'Complete', 'On Track',
    v_matthew_id, v_matthew_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 16: Aambe Health Facility (Phoenix - Planning)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'PMI-6798', 'M/B - 52x68 & 36x72 Aambe Health Facility', 'Phoenix',
    'MOBILE MODULAR MANAGEMENT', 'George Avila',
    '2025-11-04', '2026-01-30', 'Planning', 'On Track',
    v_matthew_id, v_candy_id, v_matthew_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 17: BASF Georgia 2 Story (SSI - In Progress)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'SSI-7547', 'BASF Georgia 2 Story 120 MPH', 'SSI',
    'MODULAR GENIUS, INC.', 'Barbara Hicks',
    '2025-10-20', '2025-11-20', 'In Progress', 'At Risk',
    v_matthew_id, v_michael_id, v_matthew_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 18: LASD Div 4 Facility (Phoenix - Planning)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, owner_id, created_at
  ) VALUES (
    'DO-0521-1-25', 'B- LASD Div 4 Facility', 'Phoenix',
    'WILLIAMS SCOTSMAN', 'Casey Knipp',
    '2025-10-02', '2026-08-24', 'Planning', 'On Track',
    v_michael_id, v_michael_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 19: Brooklyn Lot Cleaning (Promod - Awaiting Long Lead)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, owner_id, created_at
  ) VALUES (
    'SME-23038', 'DSNY - Brooklyn Lot Cleaning Garage Facility', 'Promod',
    'CASSONE LEASING, INC.', 'Dean Long',
    '2025-09-15', '2026-02-16', 'PM Handoff', 'On Track',
    v_michael_id, v_michael_id, NOW()
  ) RETURNING id INTO v_project_id;

  -- ========================================================================
  -- PROJECT 20: R-OCC Homeless Units (Phoenix - In Progress)
  -- ========================================================================
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, created_at
  ) VALUES (
    'PMI-6749-6763', 'R-OCC Homeless Units - CD 15 E 116th Place', 'Phoenix',
    'MOBILE MODULAR MANAGEMENT CORP.', 'Casey Knipp',
    '2025-07-28', '2026-09-18', 'In Progress', 'On Track',
    v_michael_id, v_candy_id, v_michael_id, NOW()
  ) RETURNING id INTO v_project_id;

  RAISE NOTICE 'All 20 projects imported successfully!';
END $$;

-- Verify projects were created
SELECT project_number, name, factory, status, health_status, target_online_date
FROM projects
ORDER BY factory, project_number;
