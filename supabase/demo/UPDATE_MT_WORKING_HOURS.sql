-- ============================================================================
-- UPDATE_MT_WORKING_HOURS.sql
-- Update plant_config to use Montana Time (7:00 AM - 3:30 PM)
-- ============================================================================
-- Run this before your demo to set correct MT working hours
-- ============================================================================

-- Update NWBS factory time settings to 7:00 AM - 3:30 PM MT
UPDATE plant_config
SET time_settings = jsonb_set(
  jsonb_set(time_settings, '{shift_start}', '"07:00"'),
  '{shift_end}', '"15:30"'
)
WHERE factory_id = (SELECT id FROM factories WHERE code = 'NWBS');

-- Verify the update
SELECT
  f.code AS factory,
  pc.time_settings->>'shift_start' AS shift_start,
  pc.time_settings->>'shift_end' AS shift_end,
  pc.time_settings->>'break_minutes' AS break_minutes,
  pc.time_settings->>'lunch_minutes' AS lunch_minutes
FROM plant_config pc
JOIN factories f ON pc.factory_id = f.id
WHERE f.code = 'NWBS';

-- Also update any worker shifts for today to reflect the new start time
-- This resets them to 7 AM instead of 6 AM
UPDATE worker_shifts
SET clock_in = DATE(clock_in) + INTERVAL '7 hours' + (random() * INTERVAL '15 minutes')
WHERE factory_id = (SELECT id FROM factories WHERE code = 'NWBS')
AND DATE(clock_in) = CURRENT_DATE
AND EXTRACT(HOUR FROM clock_in) < 7;

SELECT '=== WORKING HOURS UPDATED TO MT (7:00 AM - 3:30 PM) ===' AS status;

-- ============================================================================
-- FLOOR PWA TEST LOGINS (for reference)
-- ============================================================================
-- These should already be set up from SETUP_FLOOR_PWA_TEST_LOGINS.sql
--
-- SHIFT LEAD: Employee ID "EMP001", PIN "1234"
--   - Mike Johnson, Lead, has QC access
--
-- WORKER: Employee ID "EMP007", PIN "5678"
--   - Sarah Williams, Worker, no QC access
--
-- If logins don't work, run: SETUP_FLOOR_PWA_TEST_LOGINS.sql
-- ============================================================================

-- Check if test logins exist
SELECT
  'FLOOR PWA TEST LOGINS' AS section,
  employee_id,
  first_name || ' ' || last_name AS name,
  CASE WHEN is_lead THEN 'Shift Lead (QC access)' ELSE 'Worker' END AS role,
  CASE
    WHEN employee_id = 'EMP001' THEN '1234'
    WHEN employee_id = 'EMP007' THEN '5678'
    ELSE 'N/A'
  END AS test_pin,
  CASE WHEN pin_hash IS NOT NULL THEN '✓ SET' ELSE '✗ MISSING' END AS pin_status,
  is_active
FROM workers
WHERE employee_id IN ('EMP001', 'EMP007')
ORDER BY is_lead DESC;
