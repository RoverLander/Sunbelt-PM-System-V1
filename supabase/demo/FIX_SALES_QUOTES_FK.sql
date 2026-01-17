-- ============================================================================
-- FIX_SALES_QUOTES_FK.sql
-- Add missing foreign key constraints to sales_quotes table
-- This fixes the "Could not find a relationship" errors in Supabase
-- Run this AFTER FIX_SALES_USERS.sql
-- ============================================================================

-- Check current state
SELECT 'Checking sales_quotes table structure...' AS info;

-- Show existing constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'sales_quotes' AND constraint_type = 'FOREIGN KEY';

-- ============================================================================
-- ADD DEALER_ID FK CONSTRAINT
-- ============================================================================
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sales_quotes_dealer_id_fkey'
    AND table_name = 'sales_quotes'
  ) THEN
    ALTER TABLE sales_quotes
    ADD CONSTRAINT sales_quotes_dealer_id_fkey
    FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint: sales_quotes_dealer_id_fkey';
  ELSE
    RAISE NOTICE 'FK constraint already exists: sales_quotes_dealer_id_fkey';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error adding dealer FK: %', SQLERRM;
END $$;

-- ============================================================================
-- ADD CUSTOMER_ID FK CONSTRAINT
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sales_quotes_customer_id_fkey'
    AND table_name = 'sales_quotes'
  ) THEN
    ALTER TABLE sales_quotes
    ADD CONSTRAINT sales_quotes_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES sales_customers(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint: sales_quotes_customer_id_fkey';
  ELSE
    RAISE NOTICE 'FK constraint already exists: sales_quotes_customer_id_fkey';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error adding customer FK: %', SQLERRM;
END $$;

-- ============================================================================
-- ADD ASSIGNED_TO FK CONSTRAINT
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sales_quotes_assigned_to_fkey'
    AND table_name = 'sales_quotes'
  ) THEN
    ALTER TABLE sales_quotes
    ADD CONSTRAINT sales_quotes_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint: sales_quotes_assigned_to_fkey';
  ELSE
    RAISE NOTICE 'FK constraint already exists: sales_quotes_assigned_to_fkey';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error adding assigned_to FK: %', SQLERRM;
END $$;

-- ============================================================================
-- ADD INDEXES FOR BETTER PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_sales_quotes_dealer ON sales_quotes(dealer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_customer ON sales_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_assigned_to ON sales_quotes(assigned_to);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'After fix - Foreign key constraints on sales_quotes:' AS info;
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'sales_quotes' AND constraint_type = 'FOREIGN KEY';

-- Verify data relationships
SELECT 'Sales quotes with valid relationships:' AS info;
SELECT
  sq.quote_number,
  sq.status,
  sq.factory,
  u.name AS assigned_to_name,
  d.name AS dealer_name,
  sc.name AS customer_name
FROM sales_quotes sq
LEFT JOIN users u ON sq.assigned_to = u.id
LEFT JOIN dealers d ON sq.dealer_id = d.id
LEFT JOIN sales_customers sc ON sq.customer_id = sc.id
WHERE sq.factory = 'NWBS'
LIMIT 10;

SELECT 'FIX_SALES_QUOTES_FK.sql COMPLETE' AS status;
SELECT 'Refresh the Sales Dashboard - it should now load data properly' AS next_step;
