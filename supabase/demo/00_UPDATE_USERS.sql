-- ============================================================================
-- STEP 0: UPDATE USER ROLES AND FACTORIES
-- ============================================================================
-- Run this AFTER creating users in Supabase Auth.
-- Updates existing users and syncs new users from auth.users.
--
-- User Plan:
-- | Name              | Email                                | Role               | Factory |
-- |-------------------|--------------------------------------|--------------------|---------|
-- | Candy Juhnke      | candy.juhnke@sunbeltmodular.com      | Director           | SNB     |
-- | Crystal Myers     | crystal.myers@sunbeltmodular.com     | Project_Manager    | SNB     |
-- | Hector Vazquez    | hector.vazquez@sunbeltmodular.com    | Project_Manager    | SNB     |
-- | Matthew McDaniel  | matthew.mcdaniel@sunbeltmodular.com  | Project_Manager    | SNB     |
-- | Michael Caracciolo| michael.caracciolo@sunbeltmodular.com| Project_Manager    | SNB     |
-- | Mitch Quintana    | mitch.quintana@nwbsinc.com           | Sales_Manager      | NWBS    |
-- | Devin Duvak       | devin.duvak@sunbeltmodular.com       | VP                 | SNB     |
-- | Joy Thomas        | joy.thomas@sunbeltmodular.com        | IT_Manager         | SNB     |
-- | Juanita Earnest   | juanita.earnest@phoenixmodular.com   | Project_Coordinator| PMI     |
--
-- Created: January 14, 2026
-- ============================================================================

-- ============================================================================
-- UPDATE EXISTING USERS
-- ============================================================================

-- Update Candy to Director role with SNB factory
UPDATE users
SET role = 'Director', factory = 'SNB'
WHERE email ILIKE '%candy%' OR name ILIKE '%candy%juhnke%';

-- Update all PMs to SNB factory (corporate)
UPDATE users
SET factory = 'SNB'
WHERE role IN ('Project_Manager', 'PM')
  AND (email ILIKE '%crystal%' OR email ILIKE '%hector%' OR email ILIKE '%matthew%' OR email ILIKE '%michael%');

-- Mitch stays at NWBS (no change needed, but ensure it's set)
UPDATE users
SET factory = 'NWBS'
WHERE email ILIKE '%mitch%' AND role IN ('Sales_Manager', 'Sales');

-- ============================================================================
-- SYNC NEW USERS FROM AUTH (if they exist in auth.users)
-- ============================================================================
-- This upserts users from auth.users to public.users

-- Devin Duvak (VP)
INSERT INTO users (id, email, name, role, factory, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Devin Duvak'),
  'VP',
  'SNB',
  NOW()
FROM auth.users au
WHERE au.email ILIKE '%devin%duvak%' OR au.email ILIKE '%devin%'
ON CONFLICT (id) DO UPDATE SET
  role = 'VP',
  factory = 'SNB',
  name = COALESCE(EXCLUDED.name, users.name);

-- Joy Thomas (IT_Manager)
INSERT INTO users (id, email, name, role, factory, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Joy Thomas'),
  'IT_Manager',
  'SNB',
  NOW()
FROM auth.users au
WHERE au.email ILIKE '%joy%thomas%' OR au.email ILIKE '%joy%'
ON CONFLICT (id) DO UPDATE SET
  role = 'IT_Manager',
  factory = 'SNB',
  name = COALESCE(EXCLUDED.name, users.name);

-- Juanita Earnest (Project_Coordinator at PMI)
INSERT INTO users (id, email, name, role, factory, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Juanita Earnest'),
  'Project_Coordinator',
  'PMI',
  NOW()
FROM auth.users au
WHERE au.email ILIKE '%juanita%earnest%' OR au.email ILIKE '%juanita%'
ON CONFLICT (id) DO UPDATE SET
  role = 'Project_Coordinator',
  factory = 'PMI',
  name = COALESCE(EXCLUDED.name, users.name);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'User updates complete. Current users:' AS status;

SELECT
  name,
  email,
  role,
  factory,
  id
FROM users
ORDER BY
  CASE role
    WHEN 'VP' THEN 1
    WHEN 'Director' THEN 2
    WHEN 'Project_Manager' THEN 3
    WHEN 'Project_Coordinator' THEN 4
    WHEN 'Sales_Manager' THEN 5
    WHEN 'IT_Manager' THEN 6
    ELSE 7
  END,
  name;

SELECT 'Users by role:' AS status;
SELECT role, COUNT(*) as count, STRING_AGG(name, ', ') as names
FROM users
GROUP BY role
ORDER BY count DESC;

SELECT 'Users by factory:' AS status;
SELECT factory, COUNT(*) as count, STRING_AGG(name, ', ') as names
FROM users
GROUP BY factory
ORDER BY count DESC;
