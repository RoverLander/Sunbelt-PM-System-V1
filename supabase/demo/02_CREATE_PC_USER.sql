-- ============================================================================
-- STEP 2: CREATE PC USER ACCOUNT
-- ============================================================================
-- Creates the Project Coordinator account for Juanita Earnest
-- Note: You'll need to also create this user in Supabase Auth
-- ============================================================================

-- First check if user already exists
SELECT id, email, name, role FROM users WHERE email = 'juanita.earnest@phoenixmodular.com';

-- Insert the PC user from auth.users (must exist in Supabase Auth first!)
INSERT INTO users (id, email, name, role, is_active, created_at)
SELECT id, 'juanita.earnest@phoenixmodular.com', 'Juanita Earnest', 'PC', true, NOW()
FROM auth.users WHERE email = 'juanita.earnest@phoenixmodular.com'
ON CONFLICT (id) DO UPDATE SET
  name = 'Juanita Earnest',
  role = 'PC',
  is_active = true;

-- Verify
SELECT id, email, name, role FROM users WHERE email = 'juanita.earnest@phoenixmodular.com';

-- ============================================================================
-- IMPORTANT: After running this, you need to:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User"
-- 3. Enter email: juanita.earnest@phoenixmodular.com
-- 4. Set a password
-- 5. The user can then log in
-- ============================================================================
