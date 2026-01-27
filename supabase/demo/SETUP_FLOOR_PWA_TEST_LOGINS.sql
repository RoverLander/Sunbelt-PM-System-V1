-- ============================================================================
-- SETUP_FLOOR_PWA_TEST_LOGINS.sql
-- Create test logins for Floor PWA with known PIN codes
-- ============================================================================
--
-- This script sets up test workers with known PINs for testing the Floor PWA.
--
-- TEST CREDENTIALS:
--   Framing Lead: Marcus Johnson (FRM-001) - PIN: 1234
--   Framing Worker: Alex Rivera (FRM-002) - PIN: 5678
--   Interior Finish Lead: Jennifer Lopez (FIN-001) - PIN: 1111
--   Interior Finish Worker: Jessica Lewis (FIN-002) - PIN: 2222
--   Exterior Siding Lead: Carlos Mendez (EXT-001) - PIN: 3333
--   Exterior Siding Worker: Ramon Gutierrez (EXT-002) - PIN: 4444
--   QC Lead: Patricia Young (QC-001) - PIN: 9999
--
-- The PINs are hashed using bcrypt via PostgreSQL's pgcrypto extension.
-- This is compatible with Deno's bcrypt library used in the Edge Function.
--
-- Run this AFTER 20260120_comprehensive_demo_data.sql
-- ============================================================================

-- Enable pgcrypto extension (available in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- FRAMING DEPARTMENT
-- ============================================================================

-- Lead: Marcus Johnson (FRM-001) - PIN: 1234
UPDATE workers
SET
  pin_hash = crypt('1234', gen_salt('bf', 10)),
  pin_attempts = 0,
  pin_locked_until = NULL,
  is_active = true
WHERE employee_id = 'FRM-001';

-- Worker: Alex Rivera (FRM-002) - PIN: 5678
UPDATE workers
SET
  pin_hash = crypt('5678', gen_salt('bf', 10)),
  pin_attempts = 0,
  pin_locked_until = NULL,
  is_active = true
WHERE employee_id = 'FRM-002';

-- ============================================================================
-- INTERIOR FINISH DEPARTMENT
-- ============================================================================

-- Lead: Jennifer Lopez (FIN-001) - PIN: 1111
UPDATE workers
SET
  pin_hash = crypt('1111', gen_salt('bf', 10)),
  pin_attempts = 0,
  pin_locked_until = NULL,
  is_active = true
WHERE employee_id = 'FIN-001';

-- Worker: Jessica Lewis (FIN-002) - PIN: 2222
UPDATE workers
SET
  pin_hash = crypt('2222', gen_salt('bf', 10)),
  pin_attempts = 0,
  pin_locked_until = NULL,
  is_active = true
WHERE employee_id = 'FIN-002';

-- ============================================================================
-- EXTERIOR SIDING DEPARTMENT
-- ============================================================================

-- Lead: Carlos Mendez (EXT-001) - PIN: 3333
UPDATE workers
SET
  pin_hash = crypt('3333', gen_salt('bf', 10)),
  pin_attempts = 0,
  pin_locked_until = NULL,
  is_active = true
WHERE employee_id = 'EXT-001';

-- Worker: Ramon Gutierrez (EXT-002) - PIN: 4444
UPDATE workers
SET
  pin_hash = crypt('4444', gen_salt('bf', 10)),
  pin_attempts = 0,
  pin_locked_until = NULL,
  is_active = true
WHERE employee_id = 'EXT-002';

-- ============================================================================
-- QC DEPARTMENT
-- ============================================================================

-- Lead: Patricia Young (QC-001) - PIN: 9999
UPDATE workers
SET
  pin_hash = crypt('9999', gen_salt('bf', 10)),
  pin_attempts = 0,
  pin_locked_until = NULL,
  is_active = true
WHERE employee_id = 'QC-001';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT '=== FLOOR PWA TEST LOGINS ===' AS info;

SELECT
  w.employee_id,
  w.first_name || ' ' || w.last_name AS full_name,
  w.department,
  w.title,
  CASE WHEN w.is_lead THEN 'Lead' ELSE 'Worker' END AS role,
  CASE
    WHEN w.employee_id = 'FRM-001' THEN '1234'
    WHEN w.employee_id = 'FRM-002' THEN '5678'
    WHEN w.employee_id = 'FIN-001' THEN '1111'
    WHEN w.employee_id = 'FIN-002' THEN '2222'
    WHEN w.employee_id = 'EXT-001' THEN '3333'
    WHEN w.employee_id = 'EXT-002' THEN '4444'
    WHEN w.employee_id = 'QC-001' THEN '9999'
    ELSE 'unknown'
  END AS test_pin,
  CASE WHEN w.pin_hash IS NOT NULL THEN '✓ SET' ELSE '✗ MISSING' END AS pin_status
FROM workers w
WHERE w.employee_id IN ('FRM-001', 'FRM-002', 'FIN-001', 'FIN-002', 'EXT-001', 'EXT-002', 'QC-001')
ORDER BY w.department, w.is_lead DESC;

SELECT '=== TEST INSTRUCTIONS ===' AS info;
SELECT '--------------------------------------------------------------' AS divider;
SELECT 'FRAMING DEPARTMENT:' AS dept;
SELECT '  Lead Login: Employee ID "FRM-001", PIN "1234" (Marcus Johnson)' AS login_1;
SELECT '  Worker Login: Employee ID "FRM-002", PIN "5678" (Alex Rivera)' AS login_2;
SELECT '--------------------------------------------------------------' AS divider;
SELECT 'INTERIOR FINISH DEPARTMENT:' AS dept;
SELECT '  Lead Login: Employee ID "FIN-001", PIN "1111" (Jennifer Lopez)' AS login_1;
SELECT '  Worker Login: Employee ID "FIN-002", PIN "2222" (Jessica Lewis)' AS login_2;
SELECT '--------------------------------------------------------------' AS divider;
SELECT 'EXTERIOR SIDING DEPARTMENT:' AS dept;
SELECT '  Lead Login: Employee ID "EXT-001", PIN "3333" (Carlos Mendez)' AS login_1;
SELECT '  Worker Login: Employee ID "EXT-002", PIN "4444" (Ramon Gutierrez)' AS login_2;
SELECT '--------------------------------------------------------------' AS divider;
SELECT 'QC DEPARTMENT:' AS dept;
SELECT '  Lead Login: Employee ID "QC-001", PIN "9999" (Patricia Young)' AS login_1;
SELECT '--------------------------------------------------------------' AS divider;
SELECT 'PERMISSIONS:' AS permissions;
SELECT '  • Shift Leads can: Advance modules, access QC tab, full features' AS perm_1;
SELECT '  • Regular Workers can: View modules, lookup info only' AS perm_2;

-- ============================================================================
-- SETUP_FLOOR_PWA_TEST_LOGINS.sql COMPLETE
-- ============================================================================
