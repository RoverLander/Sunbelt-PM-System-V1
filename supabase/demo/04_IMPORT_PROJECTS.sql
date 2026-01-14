-- ============================================================================
-- STEP 4: IMPORT 20 DEMO PROJECTS (Based on actual PM assignments)
-- ============================================================================
-- Imports 20 real projects with:
-- - Actual project numbers, names, clients, salespeople
-- - Actual PM assignments (primary and backup)
-- - Actual start dates and target delivery dates
-- - Factory assignments matching Praxis codes
--
-- Project Counts by Primary PM:
-- - Candy Juhnke: 1 project
-- - Crystal Myers: 12 projects
-- - Hector Vazquez: 1 project
-- - Matthew McDaniel: 3 projects
-- - Michael Caracciolo: 3 projects
--
-- Created: January 13, 2026
-- Updated: January 14, 2026 - Rebuilt with actual project data
-- ============================================================================

-- ============================================================================
-- ENSURE CONTRACT_VALUE COLUMN EXISTS
-- ============================================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_value NUMERIC(12,2);

-- ============================================================================
-- CLEAR EXISTING DEMO PROJECTS (allows re-running this script)
-- ============================================================================
DELETE FROM projects WHERE project_number IN (
  'PMI-6781', 'SMM-21003', 'SMM-21054', 'SMM-21055', 'SMM-21056', 'SMM-21057',
  'SSI-7669', 'SSI-7670', 'SSI-7671', 'SSI-7672', 'SMM-21103', 'SMM-21145',
  'SMM-21020', '25B579-584', 'NWBS-25250', 'PMI-6798', 'SSI-7547',
  'PMI-6881', 'SME-23038', 'PMI-6749-6763'
);

-- ============================================================================
-- GET PM USER IDS
-- ============================================================================
DO $$
DECLARE
  v_candy_id UUID;
  v_crystal_id UUID;
  v_matthew_id UUID;
  v_hector_id UUID;
  v_michael_id UUID;
BEGIN
  -- Get existing PM IDs from users table
  -- Use specific patterns to avoid matching wrong users
  SELECT id INTO v_candy_id FROM users WHERE email ILIKE '%candy.juhnke%' OR name ILIKE '%candy%juhnke%' LIMIT 1;
  SELECT id INTO v_crystal_id FROM users WHERE email ILIKE '%crystal.me%' OR name ILIKE '%crystal%me%' LIMIT 1;
  SELECT id INTO v_matthew_id FROM users WHERE email ILIKE '%matthew.mcdaniel%' OR name ILIKE '%matthew%mcdaniel%' LIMIT 1;
  SELECT id INTO v_hector_id FROM users WHERE email ILIKE '%hector.vazquez%' OR name ILIKE '%hector%vazquez%' LIMIT 1;
  SELECT id INTO v_michael_id FROM users WHERE email ILIKE '%michael.caracciolo%' OR name ILIKE '%michael%caracciolo%' LIMIT 1;

  -- Fallback: If no PMs found, use the first available user
  IF v_candy_id IS NULL THEN
    SELECT id INTO v_candy_id FROM users WHERE role IN ('PM', 'Project_Manager', 'Director', 'VP') LIMIT 1;
  END IF;
  IF v_crystal_id IS NULL THEN v_crystal_id := v_candy_id; END IF;
  IF v_matthew_id IS NULL THEN v_matthew_id := v_candy_id; END IF;
  IF v_hector_id IS NULL THEN v_hector_id := v_candy_id; END IF;
  IF v_michael_id IS NULL THEN v_michael_id := v_candy_id; END IF;

  -- Debug: Log which users we found
  RAISE NOTICE 'PM IDs found - Candy: %, Crystal: %, Matthew: %, Hector: %, Michael: %',
    v_candy_id, v_crystal_id, v_matthew_id, v_hector_id, v_michael_id;

  -- ========================================================================
  -- CANDY JUHNKE PROJECTS (1 project as Primary PM)
  -- ========================================================================

  -- PMI-6781: Florence AZ Medical (Candy primary, Candy backup - self)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'PMI-6781', 'I-3 - Florence AZ Medical Intake/X-Ray Ctr 2-Story', 'PMI - Phoenix Modular',
    'SPECIALIZED TESTING & CONSTRUCTION', 'George Avila',
    '2025-09-25', '2026-08-25', 'In Progress', 'On Track',
    v_candy_id, v_candy_id, v_candy_id, 2, 1850000.00, NOW()
  );

  -- ========================================================================
  -- CRYSTAL MYERS PROJECTS (12 projects as Primary PM)
  -- ========================================================================

  -- SMM-21003: Disney Conference (Crystal primary, Candy backup) - PAST DUE
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21003', '96X60 DISNEY CONFERENCE BUILDING 160MPH', 'SMM - Southeast Modular',
    'MOBILE MODULAR- AUBURNDALE', 'Shawn Durante',
    '2024-07-16', '2025-02-04', 'In Progress', 'Critical',
    v_crystal_id, v_candy_id, v_crystal_id, 3, 1650000.00, NOW()
  );

  -- SMM-21054: VA-WASH Google Summerville (Crystal primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21054', '12''X56'' VA-WASH MODULE (GOOGLE SUMMERVILLE)', 'SMM - Southeast Modular',
    'KITCHENS TO GO', 'Jason King',
    '2025-02-24', '2025-05-22', 'Complete', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 4, 195000.00, NOW()
  );

  -- SMM-21055: VA-PREP Module (Crystal primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21055', '12''X56'' VA-PREP MODULE (FL,TX,SC)', 'SMM - Southeast Modular',
    'KITCHENS TO GO', 'Jason King',
    '2025-02-24', '2025-07-12', 'Complete', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 4, 185000.00, NOW()
  );

  -- SMM-21056: VA-WASH Module (Crystal primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21056', '12''X56'' VA-WASH MODULE (FL,TX,SC)', 'SMM - Southeast Modular',
    'KITCHENS TO GO', 'Jason King',
    '2025-02-24', '2025-07-19', 'Complete', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 4, 185000.00, NOW()
  );

  -- SMM-21057: VA-COOK Module (Crystal primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21057', '12''X56'' VA-COOK MODULE (FL,TX,SC)', 'SMM - Southeast Modular',
    'KITCHENS TO GO', 'Jason King',
    '2025-02-24', '2025-07-26', 'Complete', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 4, 185000.00, NOW()
  );

  -- SSI-7669: Mike Dover A-B (Crystal primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SSI-7669', '140''X68'' MIKE DOVER A-B 8-CR 120MPH 57#SN/LD', 'SSI - Specialized Structures',
    'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis',
    '2025-12-11', '2026-02-04', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 2, 2200000.00, NOW()
  );

  -- SSI-7670: Mike Dover C-D (Crystal primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SSI-7670', 'CUSTOM COMPLEX MIKE DOVER 8-CR C-D 120MPH 57#SN/LD', 'SSI - Specialized Structures',
    'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis',
    '2025-12-11', '2025-12-29', 'In Progress', 'At Risk',
    v_crystal_id, v_candy_id, v_crystal_id, 3, 2400000.00, NOW()
  );

  -- SSI-7671: Mike Dover Multi Purpose (Crystal primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SSI-7671', '84''X55'' MIKE DOVER MULTI PURPOSE 120MPH 57#SN/LD', 'SSI - Specialized Structures',
    'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis',
    '2025-12-11', '2026-01-21', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 2, 950000.00, NOW()
  );

  -- SSI-7672: Mike Food Service (Crystal primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SSI-7672', '14''X55'' MIKE FOOD SERVICE 120MPH 57#SN/LD', 'SSI - Specialized Structures',
    'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis',
    '2025-12-11', '2026-01-26', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 2, 380000.00, NOW()
  );

  -- SMM-21103: SCIF WA State (Crystal primary, Crystal backup - self)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21103', '2B 24x50 SCIF WA State PE Certification 160mph', 'SMM - Southeast Modular',
    'AFFORDABLE STRUCTURES - TAVARES', 'Roger Diamond',
    '2025-06-24', '2026-02-19', 'In Progress', 'On Track',
    v_crystal_id, v_crystal_id, v_crystal_id, 2, 1850000.00, NOW()
  );

  -- SMM-21145: ACIC Germany (Crystal primary, Hector backup) - No target date
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21145', 'ACIC GERMANY- II-B', 'SMM - Southeast Modular',
    'MODULAR MANAGEMENT GROUP', 'Jason King',
    '2025-11-19', NULL, 'Planning', 'On Track',
    v_crystal_id, v_hector_id, v_crystal_id, 1, 850000.00, NOW()
  );

  -- SMM-21020: Patrick Space Force Base (Crystal primary, Matthew backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21020', 'Patrick Space Force Base Building 1, 160MPH', 'SMM - Southeast Modular',
    'MODULAR MANAGEMENT GROUP', 'Don Eisman',
    '2024-09-30', '2025-04-07', 'In Progress', 'At Risk',
    v_crystal_id, v_matthew_id, v_crystal_id, 3, 3200000.00, NOW()
  );

  -- ========================================================================
  -- HECTOR VAZQUEZ PROJECTS (1 project as Primary PM)
  -- ========================================================================

  -- 25B579-584: Point Magu Naval Base (Hector primary, Michael backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    '25B579-584', 'POINT MAGU NAVAL BASE (REACT) CA', 'IBI - Indicom Buildings',
    'MODULAR MANAGEMENT GROUP', 'Jason King',
    '2025-07-15', '2026-02-26', 'In Progress', 'On Track',
    v_hector_id, v_michael_id, v_hector_id, 2, 4800000.00, NOW()
  );

  -- ========================================================================
  -- MATTHEW MCDANIEL PROJECTS (3 projects as Primary PM)
  -- ========================================================================

  -- NWBS-25250: Hanford AMPS (Matthew primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'NWBS-25250', '168x66 Hanford AMPS Project MMG', 'NWBS - Northwest Building Systems',
    'Mobile Modular Management Corporation', 'Mitch Quintana',
    '2025-07-21', '2026-05-12', 'In Progress', 'On Track',
    v_matthew_id, v_candy_id, v_matthew_id, 2, 2850000.00, NOW()
  );

  -- PMI-6798: Aambe Health Facility (Matthew primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'PMI-6798', 'M/B - 52x68 & 36x72 Aambe Health Facility', 'PMI - Phoenix Modular',
    'MOBILE MODULAR MANAGEMENT', 'George Avila',
    '2025-11-04', '2026-01-30', 'In Progress', 'On Track',
    v_matthew_id, v_candy_id, v_matthew_id, 2, 1250000.00, NOW()
  );

  -- SSI-7547: BASF Georgia 2 Story (Matthew primary, Michael backup) - Offline, delivery 2/9/26
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SSI-7547', 'BASF Georgia 2 Story 120 MPH', 'SSI - Specialized Structures',
    'MODULAR GENIUS, INC.', 'Barbara Hicks',
    '2025-10-20', '2026-02-09', 'In Progress', 'On Track',
    v_matthew_id, v_michael_id, v_matthew_id, 3, 2750000.00, NOW()
  );

  -- ========================================================================
  -- MICHAEL CARACCIOLO PROJECTS (3 projects as Primary PM)
  -- ========================================================================

  -- PMI-6881: LASD Div 4 Facility (Michael primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'PMI-6881', 'B- LASD Div 4 Facility', 'PMI - Phoenix Modular',
    'WILLIAMS SCOTSMAN', 'Casey Knipp',
    '2026-01-07', '2026-08-24', 'Planning', 'On Track',
    v_michael_id, v_candy_id, v_michael_id, 1, 2100000.00, NOW()
  );

  -- SME-23038: Brooklyn Lot Cleaning (Michael primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SME-23038', 'DSNY - Brooklyn Lot Cleaning Garage Facility', 'PRM - Pro-Mod Manufacturing',
    'CASSONE LEASING, INC.', 'Dean Long',
    '2025-09-15', '2026-02-16', 'In Progress', 'On Track',
    v_michael_id, v_candy_id, v_michael_id, 2, 3200000.00, NOW()
  );

  -- PMI-6749-6763: R-OCC Homeless Units (Michael primary, Candy backup)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'PMI-6749-6763', 'R-OCC Homeless Units - CD 15 E 116th Place', 'PMI - Phoenix Modular',
    'MOBILE MODULAR MANAGEMENT CORP.', 'Casey Knipp',
    '2025-07-28', '2026-09-18', 'In Progress', 'On Track',
    v_michael_id, v_candy_id, v_michael_id, 2, 6200000.00, NOW()
  );

  RAISE NOTICE 'Imported 20 projects successfully with actual PM assignments';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Projects imported by phase:' AS status;

SELECT
  current_phase,
  COUNT(*) as project_count,
  STRING_AGG(project_number, ', ' ORDER BY project_number) as projects
FROM projects
GROUP BY current_phase
ORDER BY current_phase;

SELECT 'Projects by factory:' AS status;
SELECT
  factory,
  COUNT(*) as count
FROM projects
GROUP BY factory
ORDER BY count DESC;

SELECT 'Projects by health status:' AS status;
SELECT
  health_status,
  COUNT(*) as count
FROM projects
GROUP BY health_status;

SELECT 'Date ranges check:' AS status;
SELECT
  current_phase,
  MIN(start_date) as earliest_start,
  MAX(start_date) as latest_start,
  MIN(target_online_date) as earliest_target,
  MAX(target_online_date) as latest_target
FROM projects
WHERE target_online_date IS NOT NULL
GROUP BY current_phase
ORDER BY current_phase;

SELECT 'Projects by Primary PM (verify assignments):' AS status;
SELECT
  u.name as pm_name,
  u.email as pm_email,
  COUNT(*) as project_count,
  STRING_AGG(p.project_number, ', ' ORDER BY p.project_number) as projects
FROM projects p
LEFT JOIN users u ON u.id = p.primary_pm_id
GROUP BY u.id, u.name, u.email
ORDER BY u.name;

SELECT 'Projects with Backup PM:' AS status;
SELECT
  p.project_number,
  pm.name as primary_pm,
  backup.name as backup_pm
FROM projects p
LEFT JOIN users pm ON pm.id = p.primary_pm_id
LEFT JOIN users backup ON backup.id = p.backup_pm_id
WHERE p.backup_pm_id IS NOT NULL
ORDER BY pm.name, p.project_number;

SELECT 'Portfolio Summary:' AS status;
SELECT
  COUNT(*) as total_projects,
  SUM(contract_value) as total_portfolio_value,
  COUNT(*) FILTER (WHERE status = 'Complete') as completed,
  COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'Planning') as planning,
  COUNT(*) FILTER (WHERE health_status = 'Critical') as critical,
  COUNT(*) FILTER (WHERE health_status = 'At Risk') as at_risk
FROM projects;
