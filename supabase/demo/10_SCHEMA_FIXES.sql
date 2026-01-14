-- ============================================================================
-- SCHEMA FIXES FOR MISSING COLUMNS
-- ============================================================================
-- This script adds columns that the React frontend expects but are missing
-- from the database schema.
--
-- Run this AFTER MASTER_DEMO_DATA.sql if you encounter 400 errors
--
-- Created: January 14, 2026
-- ============================================================================

-- ============================================================================
-- FIX 1: Add is_active to workflow_stations
-- ============================================================================
-- The ProjectDetails.jsx component queries with .eq('is_active', true)
ALTER TABLE workflow_stations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set all existing stations to active
UPDATE workflow_stations SET is_active = true WHERE is_active IS NULL;

-- ============================================================================
-- FIX 2: Add factory_id to users table
-- ============================================================================
-- Multiple components (CalendarPage, PCDashboard, Sidebar) query:
-- .select('factory_id, factory:factories(code)')
ALTER TABLE users ADD COLUMN IF NOT EXISTS factory_id UUID REFERENCES factories(id);

-- Update factory_id based on existing factory code
UPDATE users u
SET factory_id = f.id
FROM factories f
WHERE u.factory = f.code
  AND u.factory_id IS NULL;

-- ============================================================================
-- FIX 3: Add is_active to users table (if missing)
-- ============================================================================
-- VPDashboard, TeamPage, DirectorDashboard query with .eq('is_active', true)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set all existing users to active
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- ============================================================================
-- FIX 4: Add is_active to directory_contacts (if missing)
-- ============================================================================
-- DirectoryPage queries with .eq('is_active', true)
ALTER TABLE directory_contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set all existing contacts to active
UPDATE directory_contacts SET is_active = true WHERE is_active IS NULL;

-- ============================================================================
-- FIX 5: Add is_active to external_contacts (if missing)
-- ============================================================================
-- useContacts hook queries with .eq('is_active', true)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'external_contacts') THEN
    EXECUTE 'ALTER TABLE external_contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true';
    EXECUTE 'UPDATE external_contacts SET is_active = true WHERE is_active IS NULL';
  END IF;
END $$;

-- ============================================================================
-- FIX 6: Add is_active to floor_plans (if missing)
-- ============================================================================
-- useFloorPlans hook queries with .eq('is_active', true)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'floor_plans') THEN
    EXECUTE 'ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true';
    EXECUTE 'UPDATE floor_plans SET is_active = true WHERE is_active IS NULL';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Schema fixes applied:' AS status;

SELECT 'workflow_stations.is_active' AS column_name,
       EXISTS(SELECT 1 FROM information_schema.columns
              WHERE table_name = 'workflow_stations' AND column_name = 'is_active') AS exists;

SELECT 'users.factory_id' AS column_name,
       EXISTS(SELECT 1 FROM information_schema.columns
              WHERE table_name = 'users' AND column_name = 'factory_id') AS exists;

SELECT 'users.is_active' AS column_name,
       EXISTS(SELECT 1 FROM information_schema.columns
              WHERE table_name = 'users' AND column_name = 'is_active') AS exists;

SELECT 'directory_contacts.is_active' AS column_name,
       EXISTS(SELECT 1 FROM information_schema.columns
              WHERE table_name = 'directory_contacts' AND column_name = 'is_active') AS exists;

-- Show users with their factory assignments
SELECT 'Users with factory assignments:' AS info;
SELECT u.name, u.factory, u.factory_id, f.code as factory_code
FROM users u
LEFT JOIN factories f ON f.id = u.factory_id
ORDER BY u.name;
