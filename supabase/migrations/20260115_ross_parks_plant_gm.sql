-- ============================================================================
-- Set Ross Parks as Plant_GM for NWBS Factory
-- ============================================================================
-- Updates Ross Parks user to Plant_GM role with NWBS factory assignment
--
-- Created: January 15, 2026
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID := 'fcd8501a-fdbb-43d1-83c2-fcf049bb0c90';
  v_factory_id UUID;
  v_user_email TEXT := 'ross.parks@nwbsinc.com';
  v_user_name TEXT := 'Ross Parks';
BEGIN
  -- Get NWBS factory ID
  SELECT id INTO v_factory_id
  FROM factories
  WHERE code = 'NWBS';

  IF v_factory_id IS NULL THEN
    RAISE EXCEPTION 'Factory NWBS not found in the database';
  END IF;

  -- Insert or update the user
  INSERT INTO users (id, email, name, role, factory, factory_id, created_at, updated_at)
  VALUES (
    v_user_id,
    v_user_email,
    v_user_name,
    'Plant_GM',
    'NWBS',
    v_factory_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'Plant_GM',
    factory = 'NWBS',
    factory_id = v_factory_id,
    updated_at = NOW();

  RAISE NOTICE 'Successfully set % as Plant_GM for NWBS factory', v_user_name;
END $$;

-- Verification
SELECT
  name,
  email,
  role,
  factory,
  factory_id
FROM users
WHERE LOWER(name) LIKE '%ross%parks%'
   OR LOWER(name) LIKE '%parks%ross%';
