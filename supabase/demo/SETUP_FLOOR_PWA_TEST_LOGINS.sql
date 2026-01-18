-- ============================================================================
-- SETUP_FLOOR_PWA_TEST_LOGINS.sql
-- Create test logins for Floor PWA with known PIN codes
-- ============================================================================
--
-- This script sets up test workers with known PINs for testing the Floor PWA.
--
-- TEST CREDENTIALS:
--   Shift Lead: Mike Johnson (EMP001) - PIN: 1234
--   Worker: Sarah Williams (EMP007) - PIN: 5678
--
-- The PINs are hashed using bcrypt via PostgreSQL's pgcrypto extension.
-- This is compatible with Deno's bcrypt library used in the Edge Function.
--
-- Run this AFTER COMPREHENSIVE_DEMO_DATA.sql
-- ============================================================================

-- Enable pgcrypto extension (available in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- UPDATE SHIFT LEAD: Mike Johnson (EMP001) - PIN: 1234
-- ============================================================================

UPDATE workers
SET
  -- bcrypt hash for PIN "1234" using pgcrypto
  pin_hash = crypt('1234', gen_salt('bf', 10)),
  pin_attempts = 0,
  pin_locked_until = NULL,
  is_active = true
WHERE employee_id = 'EMP001';

-- Verify the update
SELECT
  'SHIFT LEAD TEST LOGIN' AS type,
  w.employee_id,
  w.first_name || ' ' || w.last_name AS name,
  f.code AS factory,
  w.title,
  w.is_lead,
  '1234' AS test_pin,
  CASE WHEN w.pin_hash IS NOT NULL THEN 'SET' ELSE 'MISSING' END AS pin_status
FROM workers w
LEFT JOIN factories f ON w.factory_id = f.id
WHERE w.employee_id = 'EMP001';

-- ============================================================================
-- UPDATE REGULAR WORKER: Sarah Williams (EMP007) - PIN: 5678
-- ============================================================================

UPDATE workers
SET
  -- bcrypt hash for PIN "5678" using pgcrypto
  pin_hash = crypt('5678', gen_salt('bf', 10)),
  pin_attempts = 0,
  pin_locked_until = NULL,
  is_active = true
WHERE employee_id = 'EMP007';

-- Verify the update
SELECT
  'WORKER TEST LOGIN' AS type,
  w.employee_id,
  w.first_name || ' ' || w.last_name AS name,
  f.code AS factory,
  w.title,
  w.is_lead,
  '5678' AS test_pin,
  CASE WHEN w.pin_hash IS NOT NULL THEN 'SET' ELSE 'MISSING' END AS pin_status
FROM workers w
LEFT JOIN factories f ON w.factory_id = f.id
WHERE w.employee_id = 'EMP007';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT '=== FLOOR PWA TEST LOGINS ===' AS info;

SELECT
  w.employee_id,
  w.first_name || ' ' || w.last_name AS full_name,
  f.code AS factory,
  w.title,
  CASE WHEN w.is_lead THEN 'Shift Lead' ELSE 'Worker' END AS role,
  CASE
    WHEN w.employee_id = 'EMP001' THEN '1234'
    WHEN w.employee_id = 'EMP007' THEN '5678'
    ELSE 'unknown'
  END AS test_pin,
  w.is_active,
  w.pin_attempts,
  w.pin_locked_until
FROM workers w
LEFT JOIN factories f ON w.factory_id = f.id
WHERE w.employee_id IN ('EMP001', 'EMP007')
ORDER BY w.is_lead DESC, w.employee_id;

SELECT '=== TEST INSTRUCTIONS ===' AS info;
SELECT 'Go to /pwa on your mobile device or browser' AS step_1;
SELECT 'Shift Lead Login: Employee ID "EMP001", PIN "1234"' AS step_2;
SELECT 'Worker Login: Employee ID "EMP007", PIN "5678"' AS step_3;
SELECT 'Shift Leads can see the QC tab; regular workers cannot' AS note;

-- ============================================================================
-- SETUP_FLOOR_PWA_TEST_LOGINS.sql COMPLETE
-- ============================================================================
