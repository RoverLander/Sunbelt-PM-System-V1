-- ============================================================================
-- FIX_SALES_DATA.sql - Fix sales quotes data for Robert Thaler
-- ============================================================================
-- Run this AFTER MASTER_DEMO_DATA.sql if Robert Thaler has no quotes
-- This adds quotes for Robert and fixes Mitch's user lookup
--
-- Issues fixed:
-- 1. Robert Thaler (Sales_Rep at NWBS) had no quotes assigned
-- 2. Mitch Quintana's sidebar stats showed $0 (factory filter issue - fixed in code)
-- 3. 'pending' status was missing from ACTIVE_STATUSES (fixed in code)
-- ============================================================================

-- First, let's verify the users exist
SELECT 'Checking users...' AS status;
SELECT id, name, role, factory FROM users WHERE name ILIKE '%mitch%' OR name ILIKE '%robert%thaler%';

-- ============================================================================
-- STEP 1: Add customers for Robert's quotes (if not exist)
-- ============================================================================
INSERT INTO sales_customers (company_name, company_type, contact_name, contact_email, contact_phone, address_line1, city, state, zip_code, factory, created_at)
VALUES
  ('AMAZON WEB SERVICES - SEATTLE', 'direct', 'Jennifer Park', 'jpark@aws.amazon.com', '(206) 555-1234', '410 Terry Ave N', 'Seattle', 'WA', '98109', 'NWBS', NOW()),
  ('BOEING COMMERCIAL AIRPLANES', 'direct', 'Mark Stevens', 'mark.stevens@boeing.com', '(425) 555-2345', '100 N Riverside', 'Everett', 'WA', '98201', 'NWBS', NOW()),
  ('PORT OF SEATTLE', 'government', 'Rachel Kim', 'rkim@portseattle.org', '(206) 555-3456', '2711 Alaskan Way', 'Seattle', 'WA', '98121', 'NWBS', NOW()),
  ('MICROSOFT CAMPUS SERVICES', 'direct', 'David Chen', 'dchen@microsoft.com', '(425) 555-4567', '1 Microsoft Way', 'Redmond', 'WA', '98052', 'NWBS', NOW()),
  ('STARBUCKS SUPPORT CENTER', 'direct', 'Maria Garcia', 'mgarcia@starbucks.com', '(206) 555-5678', '2401 Utah Ave S', 'Seattle', 'WA', '98134', 'NWBS', NOW())
ON CONFLICT (company_name) DO NOTHING;

SELECT 'Step 1 complete: Customers added' AS status;

-- ============================================================================
-- STEP 2: Add Robert's quotes
-- ============================================================================
DO $$
DECLARE
  v_robert_id UUID;
  v_customer_id UUID;
BEGIN
  -- Find Robert Thaler
  SELECT id INTO v_robert_id FROM users
  WHERE (name ILIKE '%robert%thaler%' OR email ILIKE '%robert%thaler%')
  AND role = 'Sales_Rep'
  LIMIT 1;

  IF v_robert_id IS NULL THEN
    RAISE NOTICE 'WARNING: Robert Thaler not found! Looking for any Sales_Rep at NWBS...';
    SELECT id INTO v_robert_id FROM users
    WHERE role = 'Sales_Rep' AND factory = 'NWBS'
    LIMIT 1;
  END IF;

  IF v_robert_id IS NULL THEN
    RAISE NOTICE 'ERROR: No Sales_Rep found at NWBS factory!';
    RETURN;
  END IF;

  RAISE NOTICE 'Found Robert Thaler: %', v_robert_id;

  -- Robert's active pipeline quotes at NWBS
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'AMAZON WEB SERVICES - SEATTLE';
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, outlook_percentage, waiting_on, difficulty_rating, building_type, factory, created_at)
    VALUES ('Q-2026-NWBS-R01', v_customer_id, 'negotiating', 3200000.00, 6, 2400, 14400, v_robert_id, v_robert_id, true, 'AWS data center support facility - 6 module complex', CURRENT_DATE + INTERVAL '45 days', 75, 'Final pricing approval', 4, 'CUSTOM', 'NWBS', NOW() - INTERVAL '12 days')
    ON CONFLICT (quote_number) DO UPDATE SET assigned_to = v_robert_id, factory = 'NWBS';
  END IF;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'BOEING COMMERCIAL AIRPLANES';
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, outlook_percentage, waiting_on, difficulty_rating, building_type, factory, created_at)
    VALUES ('Q-2026-NWBS-R02', v_customer_id, 'sent', 1850000.00, 4, 1800, 7200, v_robert_id, v_robert_id, true, 'Boeing Everett temporary office expansion', CURRENT_DATE + INTERVAL '30 days', 60, 'Customer review', 3, 'CUSTOM', 'NWBS', NOW() - INTERVAL '8 days')
    ON CONFLICT (quote_number) DO UPDATE SET assigned_to = v_robert_id, factory = 'NWBS';
  END IF;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'PORT OF SEATTLE';
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, outlook_percentage, waiting_on, difficulty_rating, building_type, factory, created_at)
    VALUES ('Q-2026-NWBS-R03', v_customer_id, 'pending', 980000.00, 2, 1600, 3200, v_robert_id, v_robert_id, true, 'Port terminal security office - government spec', CURRENT_DATE + INTERVAL '60 days', 50, 'Budget approval', 3, 'GOVERNMENT', 'NWBS', NOW() - INTERVAL '15 days')
    ON CONFLICT (quote_number) DO UPDATE SET assigned_to = v_robert_id, factory = 'NWBS';
  END IF;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'MICROSOFT CAMPUS SERVICES';
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, outlook_percentage, waiting_on, difficulty_rating, building_type, pm_flagged, pm_flagged_at, pm_flagged_reason, factory, created_at)
    VALUES ('Q-2026-NWBS-R04', v_customer_id, 'draft', 2100000.00, 4, 2200, 8800, v_robert_id, v_robert_id, true, 'Microsoft Redmond campus temp workspace during renovation', CURRENT_DATE + INTERVAL '90 days', 40, 'Site visit scheduled', 4, 'CUSTOM', true, NOW() - INTERVAL '1 day', 'Complex HVAC requirements - need PM input', 'NWBS', NOW() - INTERVAL '5 days')
    ON CONFLICT (quote_number) DO UPDATE SET assigned_to = v_robert_id, factory = 'NWBS';
  END IF;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'STARBUCKS SUPPORT CENTER';
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, outlook_percentage, waiting_on, difficulty_rating, building_type, factory, created_at)
    VALUES ('Q-2026-NWBS-R05', v_customer_id, 'sent', 420000.00, 1, 1200, 1200, v_robert_id, v_robert_id, true, 'Starbucks training center addition', CURRENT_DATE + INTERVAL '21 days', 80, 'Contract review', 2, 'CUSTOM', 'NWBS', NOW() - INTERVAL '3 days')
    ON CONFLICT (quote_number) DO UPDATE SET assigned_to = v_robert_id, factory = 'NWBS';
  END IF;

  -- Robert's won quote (for conversion rate)
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, won_date, factory, created_at)
  VALUES ('Q-2025-NWBS-R10', v_customer_id, 'won', 650000.00, 2, 1000, 2000, v_robert_id, v_robert_id, true, 'Starbucks quality lab - Won Jan 2026', CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE - INTERVAL '10 days', 'NWBS', NOW() - INTERVAL '45 days')
  ON CONFLICT (quote_number) DO UPDATE SET assigned_to = v_robert_id, factory = 'NWBS', status = 'won', won_date = CURRENT_DATE - INTERVAL '10 days';

  -- Robert's lost quote (for conversion rate)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'PORT OF SEATTLE';
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, created_at)
    VALUES ('Q-2025-NWBS-R11', v_customer_id, 'lost', 1100000.00, 3, 1400, 4200, v_robert_id, v_robert_id, true, 'Lost to competitor - timing issues', CURRENT_DATE - INTERVAL '20 days', 'NWBS', NOW() - INTERVAL '60 days')
    ON CONFLICT (quote_number) DO UPDATE SET assigned_to = v_robert_id, factory = 'NWBS', status = 'lost';
  END IF;

  RAISE NOTICE 'SUCCESS: Robert Thaler quotes created/updated';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: % - %', SQLERRM, SQLSTATE;
END $$;

SELECT 'Step 2 complete: Robert quotes added' AS status;

-- ============================================================================
-- STEP 3: Verify the results
-- ============================================================================
SELECT 'Verifying quotes by user...' AS status;

SELECT
  u.name AS user_name,
  u.role,
  u.factory AS user_factory,
  COUNT(q.id) AS total_quotes,
  COUNT(CASE WHEN q.status IN ('draft', 'sent', 'negotiating', 'pending', 'awaiting_po', 'po_received') THEN 1 END) AS active_quotes,
  COALESCE(SUM(CASE WHEN q.status IN ('draft', 'sent', 'negotiating', 'pending', 'awaiting_po', 'po_received') THEN q.total_price END), 0) AS pipeline_value,
  COUNT(CASE WHEN q.status = 'won' THEN 1 END) AS won,
  COUNT(CASE WHEN q.status = 'lost' THEN 1 END) AS lost
FROM users u
LEFT JOIN sales_quotes q ON q.assigned_to = u.id
WHERE u.role IN ('Sales_Manager', 'Sales_Rep')
GROUP BY u.id, u.name, u.role, u.factory
ORDER BY u.factory, u.role;

-- Show all NWBS quotes
SELECT 'All NWBS factory quotes:' AS status;
SELECT
  q.quote_number,
  q.status,
  q.total_price,
  q.factory,
  u.name AS assigned_to
FROM sales_quotes q
LEFT JOIN users u ON q.assigned_to = u.id
WHERE q.factory = 'NWBS'
ORDER BY q.created_at DESC;

SELECT 'FIX_SALES_DATA.sql complete!' AS status;
