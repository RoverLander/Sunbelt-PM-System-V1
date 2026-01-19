-- ============================================================================
-- FIX_ASSIGNED_PM_IDS.sql
-- Sets assigned_pm_id for all PM jobs that have an owner but no assigned PM
-- This fixes the PM Assignment Queue showing all projects as "unassigned"
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, let's see the current state
SELECT
  'Before Fix - PM Jobs Status:' AS status,
  COUNT(*) FILTER (WHERE is_pm_job = true AND assigned_pm_id IS NULL) AS unassigned,
  COUNT(*) FILTER (WHERE is_pm_job = true AND assigned_pm_id IS NOT NULL) AS assigned,
  COUNT(*) FILTER (WHERE is_pm_job = true) AS total_pm_jobs
FROM projects
WHERE status NOT IN ('Completed', 'Cancelled', 'Archived');

-- Set assigned_pm_id to owner_id for all PM jobs that have an owner but no assigned PM
UPDATE projects
SET
  assigned_pm_id = COALESCE(primary_pm_id, owner_id),
  pm_assigned_at = COALESCE(pm_assigned_at, NOW()),
  pm_assigned_by = COALESCE(pm_assigned_by, owner_id)
WHERE
  is_pm_job = true
  AND assigned_pm_id IS NULL
  AND (primary_pm_id IS NOT NULL OR owner_id IS NOT NULL)
  AND status NOT IN ('Completed', 'Cancelled', 'Archived');

-- Verify the fix
SELECT
  'After Fix - PM Jobs Status:' AS status,
  COUNT(*) FILTER (WHERE is_pm_job = true AND assigned_pm_id IS NULL) AS unassigned,
  COUNT(*) FILTER (WHERE is_pm_job = true AND assigned_pm_id IS NOT NULL) AS assigned,
  COUNT(*) FILTER (WHERE is_pm_job = true) AS total_pm_jobs
FROM projects
WHERE status NOT IN ('Completed', 'Cancelled', 'Archived');

-- Show the assignments
SELECT
  p.project_number,
  p.name,
  p.factory,
  p.status,
  u_owner.name AS owner,
  u_pm.name AS primary_pm,
  u_assigned.name AS assigned_pm,
  p.pm_assigned_at::DATE AS assigned_date
FROM projects p
LEFT JOIN users u_owner ON p.owner_id = u_owner.id
LEFT JOIN users u_pm ON p.primary_pm_id = u_pm.id
LEFT JOIN users u_assigned ON p.assigned_pm_id = u_assigned.id
WHERE p.is_pm_job = true
  AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
ORDER BY p.factory, p.project_number;

-- ============================================================================
-- VERIFY EACH PM'S ASSIGNMENTS
-- ============================================================================
SELECT
  u.name AS pm_name,
  u.email,
  u.role,
  COUNT(p.id) AS assigned_projects
FROM users u
LEFT JOIN projects p ON p.assigned_pm_id = u.id
  AND p.is_pm_job = true
  AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
WHERE u.role IN ('PM', 'Project_Manager', 'Project Manager', 'Director')
GROUP BY u.id, u.name, u.email, u.role
ORDER BY u.name;

-- Specifically check for Michael
SELECT
  'Michael check:' AS check_type,
  u.id AS michael_id,
  u.name,
  u.email,
  u.role,
  (SELECT COUNT(*) FROM projects p WHERE p.owner_id = u.id AND p.is_pm_job = true) AS owned_projects,
  (SELECT COUNT(*) FROM projects p WHERE p.primary_pm_id = u.id AND p.is_pm_job = true) AS primary_pm_projects,
  (SELECT COUNT(*) FROM projects p WHERE p.assigned_pm_id = u.id AND p.is_pm_job = true) AS assigned_projects
FROM users u
WHERE LOWER(u.name) LIKE '%michael%'
   OR LOWER(u.email) LIKE '%michael%';

SELECT 'Done! PM Assignment Queue should now show projects in their assigned PM columns.' AS result;
