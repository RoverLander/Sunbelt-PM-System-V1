-- ============================================================================
-- STEP 4: IMPORT 20 DEMO PROJECTS
-- ============================================================================
-- Imports 20 demo projects with:
-- - Praxis factory codes
-- - DYNAMIC DATES relative to CURRENT_DATE (today)
-- - PM assignments distributed across team
-- - Distributed across 4 workflow phases
--
-- Date Strategy (relative to today):
-- - Phase 1: Started 1-3 weeks ago, target 4-6 months out
-- - Phase 2: Started 4-8 weeks ago, target 3-5 months out
-- - Phase 3: Started 8-12 weeks ago, target 2-3 months out
-- - Phase 4: Started 12-16 weeks ago, target 2-6 weeks out
-- - Complete: Finished last week
--
-- Created: January 13, 2026
-- Updated: January 14, 2026 - Dynamic dates
-- ============================================================================

-- ============================================================================
-- ENSURE CONTRACT_VALUE COLUMN EXISTS
-- ============================================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_value NUMERIC(12,2);

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
  v_project_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get existing PM IDs from users table
  SELECT id INTO v_candy_id FROM users WHERE email ILIKE '%candy%' OR name ILIKE '%candy%juhnke%' LIMIT 1;
  SELECT id INTO v_crystal_id FROM users WHERE email ILIKE '%crystal%' OR name ILIKE '%crystal%me%' LIMIT 1;
  SELECT id INTO v_matthew_id FROM users WHERE email ILIKE '%matthew%' OR name ILIKE '%matthew%' LIMIT 1;
  SELECT id INTO v_hector_id FROM users WHERE email ILIKE '%hector%' OR name ILIKE '%hector%vazquez%' LIMIT 1;
  SELECT id INTO v_michael_id FROM users WHERE email ILIKE '%michael%caracciolo%' OR name ILIKE '%michael%caracciolo%' LIMIT 1;

  -- Fallback: If no PMs found, use the first available user
  IF v_candy_id IS NULL THEN
    SELECT id INTO v_candy_id FROM users WHERE role IN ('PM', 'Project_Manager', 'Director', 'VP') LIMIT 1;
  END IF;
  IF v_crystal_id IS NULL THEN v_crystal_id := v_candy_id; END IF;
  IF v_matthew_id IS NULL THEN v_matthew_id := v_candy_id; END IF;
  IF v_hector_id IS NULL THEN v_hector_id := v_candy_id; END IF;
  IF v_michael_id IS NULL THEN v_michael_id := v_candy_id; END IF;

  -- ========================================================================
  -- PHASE 1 PROJECTS: INITIATION (4 projects - newest/planning stage)
  -- Started 1-3 weeks ago, target 4-6 months out
  -- ========================================================================

  -- Project 1: ACIC GERMANY (Phase 1 - Kickoff in progress)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21145', 'ACIC GERMANY- II-B', 'SMM - Southeast Modular',
    'MODULAR MANAGEMENT GROUP', 'Jason King',
    v_today - INTERVAL '5 days', v_today + INTERVAL '5 months', 'Planning', 'On Track',
    v_candy_id, v_candy_id, v_candy_id, 1, 850000.00, NOW()
  );

  -- Project 2: Aambe Health Facility (Phase 1 - Sales handoff)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'PMI-6798', 'M/B - 52x68 & 36x72 Aambe Health Facility', 'PMI - Phoenix Modular',
    'HEALTHCARE PARTNERS', 'George Avila',
    v_today - INTERVAL '10 days', v_today + INTERVAL '6 months', 'Planning', 'On Track',
    v_candy_id, v_candy_id, v_candy_id, 1, 1250000.00, NOW()
  );

  -- Project 3: LASD Div 4 Facility (Phase 1 - Site survey pending)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'DO-0521-1-25', 'B- LASD Div 4 Facility', 'PMI - Phoenix Modular',
    'LA COUNTY SHERIFF', 'George Avila',
    v_today - INTERVAL '14 days', v_today + INTERVAL '5 months', 'Planning', 'On Track',
    v_michael_id, v_candy_id, v_michael_id, 1, 2100000.00, NOW()
  );

  -- Project 4: SCIF WA State (Phase 1 - Just started)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21103', '2B 24x50 SCIF WA State PE Certification 160mph', 'SMM - Southeast Modular',
    'DEPARTMENT OF DEFENSE', 'Jason King',
    v_today - INTERVAL '21 days', v_today + INTERVAL '4 months', 'Planning', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 1, 1850000.00, NOW()
  );

  -- ========================================================================
  -- PHASE 2 PROJECTS: DEALER SIGN-OFFS (8 projects - mid-progress)
  -- Started 4-8 weeks ago, target 3-5 months out
  -- ========================================================================

  -- Project 5: Florence AZ Medical (Phase 2 - 65% drawings)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'PMI-6781', 'I-3 - Florence AZ Medical Intake/X-Ray Ctr 2-Story', 'PMI - Phoenix Modular',
    'SPECIALIZED TESTING & CONSTRUCTION', 'George Avila',
    v_today - INTERVAL '35 days', v_today + INTERVAL '4 months', 'In Progress', 'On Track',
    v_candy_id, v_candy_id, v_candy_id, 2, 450000.00, NOW()
  );

  -- Project 6: VA-PREP MODULE (Phase 2 - Long lead items)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21055', '12''X56'' VA-PREP MODULE (FL,TX,SC)', 'SMM - Southeast Modular',
    'KITCHENS TO GO', 'Jason King',
    v_today - INTERVAL '42 days', v_today + INTERVAL '3 months', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 2, 185000.00, NOW()
  );

  -- Project 7: VA-WASH MODULE (Phase 2 - Color selections)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21056', '12''X56'' VA-WASH MODULE (FL,TX,SC)', 'SMM - Southeast Modular',
    'KITCHENS TO GO', 'Jason King',
    v_today - INTERVAL '42 days', v_today + INTERVAL '3 months' + INTERVAL '7 days', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 2, 185000.00, NOW()
  );

  -- Project 8: VA-COOK MODULE (Phase 2 - Cutsheets)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21057', '12''X56'' VA-COOK MODULE (FL,TX,SC)', 'SMM - Southeast Modular',
    'KITCHENS TO GO', 'Jason King',
    v_today - INTERVAL '42 days', v_today + INTERVAL '3 months' + INTERVAL '14 days', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 2, 185000.00, NOW()
  );

  -- Project 9: Disney Conference Building (Phase 2 - STUCK at 95% - CRITICAL)
  -- This one is intentionally behind schedule
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21003', '96X60 DISNEY CONFERENCE BUILDING 160MPH', 'SMM - Southeast Modular',
    'MOBILE MODULAR- AUBURNDALE', 'Shawn Durante',
    v_today - INTERVAL '60 days', v_today + INTERVAL '14 days', 'In Progress', 'Critical',
    v_crystal_id, v_candy_id, v_crystal_id, 2, 1650000.00, NOW()
  );

  -- Project 10: Mike Dover A-B (Phase 2 - 95% drawings)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SSI-7669', '140''X68'' MIKE DOVER A-B 8-CR 120MPH 57#SN/LD', 'SSI - Specialized Structures',
    'DOVER INDUSTRIES', 'Mike Rodriguez',
    v_today - INTERVAL '45 days', v_today + INTERVAL '4 months', 'In Progress', 'On Track',
    v_matthew_id, v_candy_id, v_matthew_id, 2, 2200000.00, NOW()
  );

  -- Project 11: Mike Dover C-D Custom (Phase 2 - 100% drawings pending - AT RISK)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SSI-7670', 'CUSTOM COMPLEX MIKE DOVER 8-CR C-D 120MPH 57#SN/LD', 'SSI - Specialized Structures',
    'DOVER INDUSTRIES', 'Mike Rodriguez',
    v_today - INTERVAL '50 days', v_today + INTERVAL '3 months', 'In Progress', 'At Risk',
    v_matthew_id, v_candy_id, v_matthew_id, 2, 2400000.00, NOW()
  );

  -- Project 12: Brooklyn Lot Cleaning (Phase 2 - Awaiting long lead)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SME-23038', 'DSNY - Brooklyn Lot Cleaning Garage Facility', 'PRM - Pro-Mod Manufacturing',
    'NYC SANITATION', 'Tony Deluca',
    v_today - INTERVAL '38 days', v_today + INTERVAL '5 months', 'In Progress', 'On Track',
    v_hector_id, v_candy_id, v_hector_id, 2, 3200000.00, NOW()
  );

  -- ========================================================================
  -- PHASE 3 PROJECTS: INTERNAL APPROVALS (4 projects - advanced)
  -- Started 8-12 weeks ago, target 2-3 months out
  -- ========================================================================

  -- Project 13: Mike Dover Multi Purpose (Phase 3 - Engineering review)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SSI-7671', '84''X55'' MIKE DOVER MULTI PURPOSE 120MPH 57#SN/LD', 'SSI - Specialized Structures',
    'DOVER INDUSTRIES', 'Mike Rodriguez',
    v_today - INTERVAL '70 days', v_today + INTERVAL '2 months', 'In Progress', 'On Track',
    v_matthew_id, v_candy_id, v_matthew_id, 3, 950000.00, NOW()
  );

  -- Project 14: Mike Food Service (Phase 3 - Third party review)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SSI-7672', '14''X55'' MIKE FOOD SERVICE 120MPH 57#SN/LD', 'SSI - Specialized Structures',
    'DOVER INDUSTRIES', 'Mike Rodriguez',
    v_today - INTERVAL '75 days', v_today + INTERVAL '2 months' + INTERVAL '14 days', 'In Progress', 'On Track',
    v_matthew_id, v_candy_id, v_matthew_id, 3, 380000.00, NOW()
  );

  -- Project 15: Patrick Space Force Base (Phase 3 - State approval - AT RISK)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21020', 'Patrick Space Force Base Building 1, 160MPH', 'SMM - Southeast Modular',
    'US SPACE FORCE', 'Shawn Durante',
    v_today - INTERVAL '84 days', v_today + INTERVAL '45 days', 'In Progress', 'At Risk',
    v_crystal_id, v_candy_id, v_crystal_id, 3, 3200000.00, NOW()
  );

  -- Project 16: BASF Georgia 2 Story (Phase 3 - Change orders - AT RISK)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SSI-7547', 'BASF Georgia 2 Story 120 MPH', 'SSI - Specialized Structures',
    'BASF CORPORATION', 'Mike Rodriguez',
    v_today - INTERVAL '80 days', v_today + INTERVAL '60 days', 'In Progress', 'At Risk',
    v_michael_id, v_candy_id, v_michael_id, 3, 2750000.00, NOW()
  );

  -- ========================================================================
  -- PHASE 4 PROJECTS: DELIVERY (4 projects - near complete)
  -- Started 12-16 weeks ago, target 2-6 weeks out
  -- ========================================================================

  -- Project 17: Google Summerville VA-WASH (Phase 4 - Production started)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'SMM-21054', '12''X56'' VA-WASH MODULE (GOOGLE SUMMERVILLE)', 'SMM - Southeast Modular',
    'GOOGLE INC', 'Jason King',
    v_today - INTERVAL '100 days', v_today + INTERVAL '6 weeks', 'In Progress', 'On Track',
    v_crystal_id, v_candy_id, v_crystal_id, 4, 195000.00, NOW()
  );

  -- Project 18: Point Magu Naval Base (Phase 4 - QC Inspection)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    '25B579-584', 'POINT MAGU NAVAL BASE (REACT) CA', 'IBI - Indicom Buildings',
    'US NAVY', 'Robert Chen',
    v_today - INTERVAL '110 days', v_today + INTERVAL '4 weeks', 'In Progress', 'On Track',
    v_michael_id, v_candy_id, v_michael_id, 4, 4800000.00, NOW()
  );

  -- Project 19: R-OCC Homeless Units (Phase 4 - Delivery scheduled)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'PMI-6749-6763', 'R-OCC Homeless Units - CD 15 E 116th Place', 'PMI - Phoenix Modular',
    'LA COUNTY HOUSING', 'George Avila',
    v_today - INTERVAL '105 days', v_today + INTERVAL '3 weeks', 'In Progress', 'On Track',
    v_candy_id, v_candy_id, v_candy_id, 4, 6200000.00, NOW()
  );

  -- Project 20: Hanford AMPS (Phase 4 - COMPLETE - Showcase project)
  INSERT INTO projects (
    project_number, name, factory, client_name, salesperson,
    start_date, target_online_date, status, health_status,
    primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at
  ) VALUES (
    'NWBS-25250', '168x66 Hanford AMPS Project MMG', 'NWBS - Northwest Building Systems',
    'MOBILE MODULAR GROUP', 'Sarah Johnson',
    v_today - INTERVAL '120 days', v_today - INTERVAL '7 days', 'Complete', 'On Track',
    v_candy_id, v_candy_id, v_candy_id, 4, 2850000.00, NOW()
  );

  RAISE NOTICE 'Imported 20 projects successfully with dynamic dates';
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
