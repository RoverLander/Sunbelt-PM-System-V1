-- ============================================================================
-- FIX_PM_ASSIGNMENTS.sql
-- Quick fix to assign PMs to existing demo projects
-- Run this in Supabase SQL Editor to fix PM assignments
-- ============================================================================

DO $$
DECLARE
  v_matthew_id UUID;
  v_crystal_id UUID;
  v_candy_id UUID;
  v_michael_id UUID;
  v_hector_id UUID;
  v_fallback_pm_id UUID;
  v_owner_id UUID;
BEGIN
  -- Get PM user IDs by name (flexible matching)
  -- Matthew McDaniel
  SELECT id INTO v_matthew_id FROM users
  WHERE (LOWER(name) LIKE '%matthew%' AND LOWER(name) LIKE '%mcdaniel%')
     OR LOWER(email) LIKE '%matthew%mcdaniel%'
     OR LOWER(email) LIKE '%mmcdaniel%'
  LIMIT 1;

  -- Crystal (James/Meyers)
  SELECT id INTO v_crystal_id FROM users
  WHERE LOWER(name) LIKE '%crystal%'
     OR LOWER(email) LIKE '%crystal%'
  LIMIT 1;

  -- Candy (Juhnke/Nelson)
  SELECT id INTO v_candy_id FROM users
  WHERE LOWER(name) LIKE '%candy%'
     OR LOWER(email) LIKE '%candy%'
  LIMIT 1;

  -- Michael (Caracciolo)
  SELECT id INTO v_michael_id FROM users
  WHERE (LOWER(name) LIKE '%michael%' AND role = 'PM')
     OR (LOWER(email) LIKE '%michael%' AND role = 'PM')
  LIMIT 1;

  -- Hector (Vazquez)
  SELECT id INTO v_hector_id FROM users
  WHERE LOWER(name) LIKE '%hector%'
     OR LOWER(email) LIKE '%hector%'
  LIMIT 1;

  -- Fallback: any PM user
  SELECT id INTO v_fallback_pm_id FROM users
  WHERE role = 'PM' AND is_active = true
  LIMIT 1;

  -- Final fallback: any active user
  SELECT id INTO v_owner_id FROM users WHERE is_active = true LIMIT 1;

  -- Use fallbacks if specific PMs not found
  v_matthew_id := COALESCE(v_matthew_id, v_fallback_pm_id, v_owner_id);
  v_crystal_id := COALESCE(v_crystal_id, v_fallback_pm_id, v_owner_id);
  v_candy_id := COALESCE(v_candy_id, v_fallback_pm_id, v_owner_id);
  v_michael_id := COALESCE(v_michael_id, v_fallback_pm_id, v_owner_id);
  v_hector_id := COALESCE(v_hector_id, v_fallback_pm_id, v_owner_id);

  RAISE NOTICE 'PM IDs found: Matthew=%, Crystal=%, Candy=%, Michael=%, Hector=%',
    v_matthew_id, v_crystal_id, v_candy_id, v_michael_id, v_hector_id;

  -- ============================================================================
  -- UPDATE ALL PROJECTS WITH PM ASSIGNMENTS
  -- ============================================================================

  -- NWBS projects -> Matthew (4 PM jobs)
  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'NWBS-26-001';

  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_candy_id
  WHERE project_number = 'NWBS-26-002';

  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'NWBS-26-003';

  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_michael_id
  WHERE project_number = 'NWBS-26-004';

  -- PMI projects -> Crystal (3 PM jobs)
  UPDATE projects SET owner_id = v_crystal_id, primary_pm_id = v_crystal_id, backup_pm_id = v_matthew_id
  WHERE project_number = 'PMI-26-001';

  UPDATE projects SET owner_id = v_crystal_id, primary_pm_id = v_crystal_id, backup_pm_id = v_hector_id
  WHERE project_number = 'PMI-26-002';

  UPDATE projects SET owner_id = v_crystal_id, primary_pm_id = v_crystal_id, backup_pm_id = v_candy_id
  WHERE project_number = 'PMI-26-003';

  -- WM-EVERGREEN projects -> Matthew/Candy (3 PM jobs)
  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_candy_id
  WHERE project_number = 'WMEV-26-001';

  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'WMEV-26-002';

  UPDATE projects SET owner_id = v_candy_id, primary_pm_id = v_candy_id, backup_pm_id = v_matthew_id
  WHERE project_number = 'WMEV-26-003';

  -- WM-EAST projects -> Michael (2 PM jobs)
  UPDATE projects SET owner_id = v_michael_id, primary_pm_id = v_michael_id, backup_pm_id = v_candy_id
  WHERE project_number = 'WMEA-26-001';

  UPDATE projects SET owner_id = v_michael_id, primary_pm_id = v_michael_id, backup_pm_id = v_hector_id
  WHERE project_number = 'WMEA-26-003';

  -- WM-SOUTH projects -> Hector/Candy (3 PM jobs)
  UPDATE projects SET owner_id = v_hector_id, primary_pm_id = v_hector_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'WMSO-26-001';

  UPDATE projects SET owner_id = v_hector_id, primary_pm_id = v_hector_id, backup_pm_id = v_candy_id
  WHERE project_number = 'WMSO-26-002';

  UPDATE projects SET owner_id = v_candy_id, primary_pm_id = v_candy_id, backup_pm_id = v_hector_id
  WHERE project_number = 'WMSO-26-003';

  -- AMT projects -> Crystal/Hector (2 PM jobs)
  UPDATE projects SET owner_id = v_crystal_id, primary_pm_id = v_crystal_id, backup_pm_id = v_hector_id
  WHERE project_number = 'AMT-26-001';

  UPDATE projects SET owner_id = v_hector_id, primary_pm_id = v_hector_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'AMT-26-002';

  -- SMM projects -> Candy (2 PM jobs)
  UPDATE projects SET owner_id = v_candy_id, primary_pm_id = v_candy_id, backup_pm_id = v_michael_id
  WHERE project_number = 'SMM-26-001';

  UPDATE projects SET owner_id = v_candy_id, primary_pm_id = v_candy_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'SMM-26-002';

  RAISE NOTICE 'PM assignments updated!';
  RAISE NOTICE 'Matthew: NWBS-26-001 to 004, WMEV-26-001, WMEV-26-002 (6 projects)';
  RAISE NOTICE 'Crystal: PMI-26-001 to 003, AMT-26-001 (4 projects)';
  RAISE NOTICE 'Candy: WMEV-26-003, WMSO-26-003, SMM-26-001, SMM-26-002 (4 projects)';
  RAISE NOTICE 'Michael: WMEA-26-001, WMEA-26-003 (2 projects)';
  RAISE NOTICE 'Hector: WMSO-26-001, WMSO-26-002, AMT-26-002 (3 projects)';
END $$;

-- Verify the assignments
SELECT
  p.project_number,
  p.name,
  p.factory,
  p.is_pm_job,
  u1.name as owner_name,
  u2.name as primary_pm_name,
  u3.name as backup_pm_name
FROM projects p
LEFT JOIN users u1 ON p.owner_id = u1.id
LEFT JOIN users u2 ON p.primary_pm_id = u2.id
LEFT JOIN users u3 ON p.backup_pm_id = u3.id
WHERE p.project_number LIKE '%26-%'
ORDER BY p.factory, p.project_number;
