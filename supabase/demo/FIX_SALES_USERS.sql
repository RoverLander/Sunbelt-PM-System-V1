-- ============================================================================
-- FIX_SALES_USERS.sql
-- Fix NWBS Sales users in the users table
-- ============================================================================
--
-- THE PROBLEM:
-- Mitch Quintana and Robert Thaler are only in directory_contacts, not in users table.
-- The Sales Dashboard queries the users table for role IN ('Sales_Rep', 'Sales_Manager')
-- but these users don't exist there, causing 400 errors and empty data.
--
-- Run this AFTER all other demo data scripts.
-- ============================================================================

-- First, let's see what we have
SELECT '=== Current Sales Users in users table ===' AS info;
SELECT id, name, email, role, factory, is_active
FROM users
WHERE role IN ('Sales', 'Sales_Rep', 'Sales_Manager')
ORDER BY factory, role, name;

-- Check if Mitch exists in users table
SELECT '=== Checking for Mitch in users table ===' AS info;
SELECT id, name, email, role, factory
FROM users
WHERE LOWER(name) LIKE '%mitch%' OR LOWER(email) LIKE '%mitch%';

-- Check if Robert Thaler exists in users table
SELECT '=== Checking for Robert Thaler in users table ===' AS info;
SELECT id, name, email, role, factory
FROM users
WHERE (LOWER(name) LIKE '%robert%thaler%' OR LOWER(email) LIKE '%robert%thaler%');

-- ============================================================================
-- UPDATE MITCH QUINTANA
-- ============================================================================
-- If Mitch exists with a different role, update him to Sales_Manager
-- If he doesn't exist, insert him

DO $$
DECLARE
  v_mitch_id UUID;
  v_nwbs_id UUID;
BEGIN
  -- Get NWBS factory ID
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  IF v_nwbs_id IS NULL THEN
    RAISE EXCEPTION 'NWBS factory not found!';
  END IF;

  -- Check if Mitch exists
  SELECT id INTO v_mitch_id FROM users
  WHERE LOWER(email) = 'mitch.quintana@nwbsinc.com'
     OR (LOWER(name) LIKE '%mitch%quintana%');

  IF v_mitch_id IS NOT NULL THEN
    -- Update existing user
    UPDATE users SET
      role = 'Sales_Manager',
      factory = 'NWBS',
      factory_id = v_nwbs_id,
      is_active = true,
      phone = '208-860-2582'
    WHERE id = v_mitch_id;

    RAISE NOTICE 'Updated Mitch Quintana to Sales_Manager (ID: %)', v_mitch_id;
  ELSE
    -- Insert new user
    INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active)
    VALUES (
      gen_random_uuid(),
      'mitch.quintana@nwbsinc.com',
      'Mitch Quintana',
      'Sales_Manager',
      'NWBS',
      v_nwbs_id,
      '208-860-2582',
      true
    )
    RETURNING id INTO v_mitch_id;

    RAISE NOTICE 'Created Mitch Quintana as Sales_Manager (ID: %)', v_mitch_id;
  END IF;
END $$;

-- ============================================================================
-- UPDATE/CREATE ROBERT THALER AS SALES REP
-- ============================================================================

DO $$
DECLARE
  v_robert_id UUID;
  v_nwbs_id UUID;
BEGIN
  -- Get NWBS factory ID
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  -- Check if Robert Thaler exists
  SELECT id INTO v_robert_id FROM users
  WHERE LOWER(email) = 'robert.thaler@nwbsinc.com'
     OR (LOWER(name) LIKE '%robert%thaler%');

  IF v_robert_id IS NOT NULL THEN
    -- Update existing user
    UPDATE users SET
      role = 'Sales_Rep',
      factory = 'NWBS',
      factory_id = v_nwbs_id,
      is_active = true,
      phone = '208-860-2763'
    WHERE id = v_robert_id;

    RAISE NOTICE 'Updated Robert Thaler to Sales_Rep (ID: %)', v_robert_id;
  ELSE
    -- Insert new user
    INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active)
    VALUES (
      gen_random_uuid(),
      'robert.thaler@nwbsinc.com',
      'Robert Thaler',
      'Sales_Rep',
      'NWBS',
      v_nwbs_id,
      '208-860-2763',
      true
    )
    RETURNING id INTO v_robert_id;

    RAISE NOTICE 'Created Robert Thaler as Sales_Rep (ID: %)', v_robert_id;
  END IF;
END $$;

-- ============================================================================
-- FIX ANY USERS WITH role = 'Sales' (should be Sales_Manager or Sales_Rep)
-- ============================================================================

UPDATE users SET role = 'Sales_Manager'
WHERE role = 'Sales'
  AND (LOWER(name) LIKE '%manager%' OR LOWER(email) LIKE '%mitch%');

UPDATE users SET role = 'Sales_Rep'
WHERE role = 'Sales'
  AND role != 'Sales_Manager';

-- ============================================================================
-- CREATE SALES QUOTES FOR NWBS SALES TEAM
-- ============================================================================

DO $$
DECLARE
  v_mitch_id UUID;
  v_robert_id UUID;
  v_nwbs_id UUID;
  v_customer_id UUID;
  v_dealer_id UUID;
  v_quote_count INTEGER := 0;
BEGIN
  -- Get IDs
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS' LIMIT 1;
  SELECT id INTO v_mitch_id FROM users WHERE role = 'Sales_Manager' AND factory = 'NWBS' LIMIT 1;
  SELECT id INTO v_robert_id FROM users WHERE role = 'Sales_Rep' AND factory = 'NWBS' LIMIT 1;

  RAISE NOTICE 'NWBS Factory ID: %', v_nwbs_id;
  RAISE NOTICE 'Mitch ID: %', v_mitch_id;
  RAISE NOTICE 'Robert ID: %', v_robert_id;

  IF v_mitch_id IS NULL THEN
    RAISE NOTICE 'WARNING: No Sales_Manager found for NWBS';
    RETURN;
  END IF;

  -- Get or create a dealer (dealers table uses 'factory' column, not 'factory_code')
  SELECT id INTO v_dealer_id FROM dealers WHERE factory = 'NWBS' AND is_active = true LIMIT 1;

  IF v_dealer_id IS NULL THEN
    INSERT INTO dealers (code, name, factory, is_active)
    VALUES ('NWBS-D001', 'Mountain West Modular', 'NWBS', true)
    RETURNING id INTO v_dealer_id;
  END IF;

  -- Create or get a customer
  -- Note: sales_customers table uses 'name' and 'company' columns (not 'company_name')
  SELECT id INTO v_customer_id FROM sales_customers WHERE name ILIKE '%Idaho%' OR name ILIKE '%Mountain%' OR company ILIKE '%Mountain%' LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO sales_customers (name, company, email, phone)
    VALUES ('John Smith', 'Mountain View Developments', 'jsmith@mountainview.com', '208-555-1234')
    RETURNING id INTO v_customer_id;
  END IF;

  -- Check if NWBS already has quotes
  SELECT COUNT(*) INTO v_quote_count FROM sales_quotes WHERE factory = 'NWBS';

  IF v_quote_count > 0 THEN
    -- Update existing NWBS quotes to be assigned to Mitch or Robert
    UPDATE sales_quotes
    SET assigned_to = CASE
      WHEN random() > 0.3 THEN v_mitch_id  -- 70% to Mitch (manager)
      ELSE COALESCE(v_robert_id, v_mitch_id)  -- 30% to Robert (if exists)
    END
    WHERE factory = 'NWBS' AND (assigned_to IS NULL OR assigned_to NOT IN (v_mitch_id, COALESCE(v_robert_id, v_mitch_id)));

    RAISE NOTICE 'Updated existing NWBS quotes to be assigned to sales team';
  ELSE
    -- Create new quotes for Mitch (Sales Manager)
    INSERT INTO sales_quotes (
      quote_number, customer_id, dealer_id, factory, status, total_price,
      valid_until, assigned_to, notes, building_type, module_count,
      outlook_percentage, is_latest_version
    ) VALUES
      ('Q-NWBS-001', v_customer_id, v_dealer_id, 'NWBS', 'draft', 185000, CURRENT_DATE + 30, v_mitch_id, 'Site office for Idaho School District', 'Education', 2, 40, true),
      ('Q-NWBS-002', v_customer_id, v_dealer_id, 'NWBS', 'sent', 320000, CURRENT_DATE + 45, v_mitch_id, 'Medical clinic modular expansion', 'Healthcare', 4, 55, true),
      ('Q-NWBS-003', v_customer_id, v_dealer_id, 'NWBS', 'negotiating', 475000, CURRENT_DATE + 60, v_mitch_id, 'Government field office complex', 'Government', 6, 75, true),
      ('Q-NWBS-004', v_customer_id, v_dealer_id, 'NWBS', 'awaiting_po', 890000, CURRENT_DATE + 45, v_mitch_id, 'Multi-classroom education building', 'Education', 8, 90, true),
      ('Q-NWBS-005', v_customer_id, v_dealer_id, 'NWBS', 'po_received', 245000, CURRENT_DATE + 90, v_mitch_id, 'Retail sales center', 'Commercial', 3, 95, true);

    v_quote_count := 5;

    -- Create quotes for Robert (Sales Rep) if he exists
    IF v_robert_id IS NOT NULL THEN
      INSERT INTO sales_quotes (
        quote_number, customer_id, dealer_id, factory, status, total_price,
        valid_until, assigned_to, notes, building_type, module_count,
        outlook_percentage, is_latest_version
      ) VALUES
        ('Q-NWBS-006', v_customer_id, v_dealer_id, 'NWBS', 'draft', 125000, CURRENT_DATE + 30, v_robert_id, 'Small office addition', 'Commercial', 1, 30, true),
        ('Q-NWBS-007', v_customer_id, v_dealer_id, 'NWBS', 'sent', 210000, CURRENT_DATE + 45, v_robert_id, 'Portable classroom', 'Education', 2, 50, true),
        ('Q-NWBS-008', v_customer_id, v_dealer_id, 'NWBS', 'negotiating', 385000, CURRENT_DATE + 60, v_robert_id, 'Healthcare clinic module', 'Healthcare', 3, 65, true);

      v_quote_count := v_quote_count + 3;
    END IF;

    RAISE NOTICE 'Created % new sales quotes for NWBS team', v_quote_count;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '=== VERIFICATION: Sales Users at NWBS ===' AS info;
SELECT id, name, email, role, factory, is_active
FROM users
WHERE factory = 'NWBS' AND role IN ('Sales_Manager', 'Sales_Rep', 'Sales')
ORDER BY role, name;

SELECT '=== VERIFICATION: Sales Quotes at NWBS ===' AS info;
SELECT
  sq.quote_number,
  sq.status,
  sq.total_price,
  u.name AS assigned_to,
  u.role AS assignee_role,
  sq.building_type,
  sq.outlook_percentage
FROM sales_quotes sq
LEFT JOIN users u ON sq.assigned_to = u.id
WHERE sq.factory = 'NWBS'
ORDER BY sq.created_at DESC
LIMIT 15;

SELECT '=== FIX_SALES_USERS.sql COMPLETE ===' AS status;
SELECT 'Refresh the Sales Dashboard to see Mitch and Roberts quotes' AS next_step;
