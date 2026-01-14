-- ============================================================================
-- STEP 7: CREATE SALES PIPELINE DATA
-- ============================================================================
-- Creates sales quotes for Mitch (Sales Manager) including:
-- - Quotes linked to active projects (converted)
-- - Standalone quotes in various stages
-- - Praxis quote numbers and building specs
--
-- Created: January 13, 2026
-- Updated: January 14, 2026 - Fixed sales_customers schema
-- Updated: January 14, 2026 - Added dealers table and FK constraints for Supabase joins
-- ============================================================================

-- ============================================================================
-- CREATE DEALERS TABLE (for dealer relationships in quotes)
-- ============================================================================
-- Dealers are modular building distributors who resell Sunbelt products
CREATE TABLE IF NOT EXISTS dealers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  branch_name VARCHAR(100),
  contact_name VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(20),
  factory VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on dealers
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dealers_all" ON dealers;
CREATE POLICY "dealers_all" ON dealers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_dealers_code ON dealers(code);
CREATE INDEX IF NOT EXISTS idx_dealers_factory ON dealers(factory);

-- ============================================================================
-- INSERT DEALER DATA
-- ============================================================================
INSERT INTO dealers (code, name, branch_name, contact_name, contact_email, contact_phone, city, state, factory)
VALUES
  ('PMSI', 'Pacific Mobile Structures Inc', 'Seattle Main', 'Lisa Chen', 'lchen@pmsi.com', '(206) 555-5005', 'Seattle', 'WA', 'NWBS'),
  ('PMSI-LA', 'Pacific Mobile Structures Inc', 'Los Angeles', 'Mark Torres', 'mtorres@pmsi.com', '(310) 555-5006', 'Los Angeles', 'CA', 'PMI'),
  ('MMG', 'Modular Management Group', 'Atlanta HQ', 'Sarah Johnson', 'sjohnson@mmg.com', '(404) 555-2002', 'Atlanta', 'GA', 'SMM'),
  ('MMG-FL', 'Modular Management Group', 'Florida', 'Carlos Martinez', 'cmartinez@mmg.com', '(305) 555-2003', 'Miami', 'FL', 'SMM'),
  ('URENT', 'United Rentals Modular', 'Corporate', 'Tom Anderson', 'tanderson@ur.com', '(203) 555-6006', 'Stamford', 'CT', 'SSI'),
  ('WESCO', 'Wesco Modular Solutions', 'Texas Region', 'David Wilson', 'dwilson@wesco.com', '(214) 555-7001', 'Dallas', 'TX', 'SSI'),
  ('MOBPRO', 'Mobile Pro Dealers', 'Phoenix', 'Jennifer Adams', 'jadams@mobpro.com', '(480) 555-8001', 'Phoenix', 'AZ', 'PMI')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  branch_name = EXCLUDED.branch_name,
  contact_name = EXCLUDED.contact_name,
  updated_at = NOW();

-- ============================================================================
-- CREATE SALES_QUOTES TABLE (if not exists)
-- ============================================================================
-- Base table for sales quotes - must exist before Praxis fields migration
CREATE TABLE IF NOT EXISTS sales_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number VARCHAR(50),
  customer_id UUID,
  status VARCHAR(30) DEFAULT 'draft',
  total_price NUMERIC(12,2),
  won_date DATE,
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  is_latest_version BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add total_price column if missing
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS total_price NUMERIC(12,2);

-- Add all the Praxis columns if they don't exist
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS praxis_quote_number VARCHAR(20);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS praxis_source_factory VARCHAR(10);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_id UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_branch VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_contact_name VARCHAR(100);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_type VARCHAR(30);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_width INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_length INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS square_footage INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS module_count INTEGER DEFAULT 1;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS stories INTEGER DEFAULT 1;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS state_tags TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS climate_zone INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS occupancy_type VARCHAR(10);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS set_type VARCHAR(30);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS sprinkler_type VARCHAR(20);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS has_plumbing BOOLEAN DEFAULT false;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS wui_compliant BOOLEAN DEFAULT false;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS outlook_percentage INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS waiting_on TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS expected_close_timeframe VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS qa_due_date DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS quote_due_date DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS promised_delivery_date DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged BOOLEAN DEFAULT false;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_at TIMESTAMPTZ;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_by UUID REFERENCES users(id);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_reason TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_to_project_id UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES users(id);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS imported_from VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS praxis_synced_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_quotes_all" ON sales_quotes;
CREATE POLICY "sales_quotes_all" ON sales_quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_quotes_customer ON sales_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_assigned ON sales_quotes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_dealer ON sales_quotes(dealer_id);

-- ============================================================================
-- CREATE SALES_QUOTE_REVISIONS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_quote_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES sales_quotes(id) ON DELETE CASCADE,
  revision_number INTEGER DEFAULT 1,
  changes_description TEXT,
  value NUMERIC(12,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sales_quote_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_quote_revisions_all" ON sales_quote_revisions;
CREATE POLICY "sales_quote_revisions_all" ON sales_quote_revisions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- CREATE/UPDATE SALES_CUSTOMERS TABLE
-- ============================================================================
-- Ensure the table has the correct schema to match CustomerForm.jsx
CREATE TABLE IF NOT EXISTS sales_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(200) NOT NULL,
  company_type VARCHAR(50) DEFAULT 'general',
  contact_name VARCHAR(100),
  contact_title VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  secondary_contact_name VARCHAR(100),
  secondary_contact_email VARCHAR(255),
  secondary_contact_phone VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(20),
  source VARCHAR(50),
  notes TEXT,
  factory VARCHAR(20),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add any missing columns to existing table
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS company_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS contact_title VARCHAR(100);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS secondary_contact_name VARCHAR(100);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS secondary_contact_email VARCHAR(255);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS secondary_contact_phone VARCHAR(50);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS source VARCHAR(50);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS factory VARCHAR(20);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Enable RLS
ALTER TABLE sales_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_customers_all" ON sales_customers;
CREATE POLICY "sales_customers_all" ON sales_customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sales_customers_company ON sales_customers(company_name);
CREATE INDEX IF NOT EXISTS idx_sales_customers_factory ON sales_customers(factory);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS FOR SUPABASE JOINS
-- ============================================================================
-- Supabase join syntax requires actual FK constraints to work
-- e.g., customer:customer_id(id, company_name) needs FK from customer_id to sales_customers.id

-- Drop constraints if they exist (for re-running script)
DO $$
BEGIN
  -- Customer FK
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'sales_quotes_customer_id_fkey' AND table_name = 'sales_quotes') THEN
    ALTER TABLE sales_quotes DROP CONSTRAINT sales_quotes_customer_id_fkey;
  END IF;

  -- Dealer FK
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'sales_quotes_dealer_id_fkey' AND table_name = 'sales_quotes') THEN
    ALTER TABLE sales_quotes DROP CONSTRAINT sales_quotes_dealer_id_fkey;
  END IF;
END $$;

-- Add FK from sales_quotes.customer_id to sales_customers.id
ALTER TABLE sales_quotes
ADD CONSTRAINT sales_quotes_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES sales_customers(id) ON DELETE SET NULL;

-- Add FK from sales_quotes.dealer_id to dealers.id
ALTER TABLE sales_quotes
ADD CONSTRAINT sales_quotes_dealer_id_fkey
FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL;

-- ============================================================================
-- GET SALES USER IDs
-- ============================================================================
DO $$
DECLARE
  v_mitch_id UUID;
  v_sales_rep1_id UUID;
  v_sales_rep2_id UUID;
  v_customer_id UUID;
  v_dealer_id UUID;
  v_project RECORD;
  v_quote_id UUID;
BEGIN
  -- Get Mitch (Sales Manager) or first sales user
  SELECT id INTO v_mitch_id FROM users
  WHERE role IN ('Sales_Manager', 'Sales Manager', 'Sales')
  OR name ILIKE '%mitch%'
  ORDER BY role LIMIT 1;

  -- Fallback to any user if no sales user found
  IF v_mitch_id IS NULL THEN
    SELECT id INTO v_mitch_id FROM users LIMIT 1;
  END IF;

  -- Get or create sales reps
  SELECT id INTO v_sales_rep1_id FROM users WHERE role ILIKE '%sales%rep%' ORDER BY name LIMIT 1;
  SELECT id INTO v_sales_rep2_id FROM users WHERE role ILIKE '%sales%rep%' ORDER BY name OFFSET 1 LIMIT 1;

  IF v_sales_rep1_id IS NULL THEN v_sales_rep1_id := v_mitch_id; END IF;
  IF v_sales_rep2_id IS NULL THEN v_sales_rep2_id := v_mitch_id; END IF;

  -- ========================================================================
  -- CREATE SALES CUSTOMERS
  -- ========================================================================

  INSERT INTO sales_customers (id, company_name, company_type, contact_name, contact_email, contact_phone, address_line1, city, state, zip_code, factory, created_at)
  VALUES
    (uuid_generate_v4(), 'SPECIALIZED TESTING & CONSTRUCTION', 'contractor', 'John Smith', 'jsmith@spectest.com', '(480) 555-1001', '1234 Industrial Blvd', 'Phoenix', 'AZ', '85001', 'PMI', NOW()),
    (uuid_generate_v4(), 'MODULAR MANAGEMENT GROUP', 'dealer', 'Sarah Johnson', 'sjohnson@mmg.com', '(404) 555-2002', '5678 Corporate Dr', 'Atlanta', 'GA', '30301', 'SMM', NOW()),
    (uuid_generate_v4(), 'KITCHENS TO GO', 'direct', 'Mike Williams', 'mwilliams@ktg.com', '(305) 555-3003', '9012 Culinary Way', 'Miami', 'FL', '33101', 'SMM', NOW()),
    (uuid_generate_v4(), 'DOVER INDUSTRIES', 'direct', 'Robert Dover', 'rdover@doverindustries.com', '(512) 555-4004', '3456 Manufacturing Pkwy', 'Austin', 'TX', '78701', 'SSI', NOW()),
    (uuid_generate_v4(), 'PACIFIC MOBILE STRUCTURES', 'dealer', 'Lisa Chen', 'lchen@pmsi.com', '(206) 555-5005', '7890 Harbor View Rd', 'Seattle', 'WA', '98101', 'NWBS', NOW()),
    (uuid_generate_v4(), 'UNITED RENTALS', 'dealer', 'Tom Anderson', 'tanderson@ur.com', '(203) 555-6006', '2468 Equipment Lane', 'Stamford', 'CT', '06901', 'SSI', NOW()),
    (uuid_generate_v4(), 'GOOGLE FACILITIES', 'direct', 'Amy Park', 'apark@google.com', '(650) 555-7007', '1600 Amphitheatre Pkwy', 'Mountain View', 'CA', '94043', 'PMI', NOW()),
    (uuid_generate_v4(), 'US SPACE FORCE', 'government', 'Col. Marcus Reed', 'marcus.reed@spaceforce.mil', '(321) 555-8008', 'Patrick SFB', 'Cocoa Beach', 'FL', '32931', 'SMM', NOW())
  ON CONFLICT DO NOTHING;

  -- ========================================================================
  -- CREATE QUOTES LINKED TO PROJECTS (WON/CONVERTED)
  -- ========================================================================

  -- Quote for Florence AZ Medical (PMI-6781)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'SPECIALIZED TESTING & CONSTRUCTION';
  SELECT id INTO v_dealer_id FROM dealers WHERE code = 'PMSI' LIMIT 1;

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, dealer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, converted_to_project_id
  )
  SELECT
    uuid_generate_v4(),
    'SQ-2025-001',
    v_customer_id,
    v_dealer_id,
    'won',
    450000.00,
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '90 days',
    'PMI-0781-2025',
    'PMI',
    100,
    'CUSTOM',
    68,
    140,
    9520,
    4,
    v_sales_rep1_id,
    p.id
  FROM projects p WHERE p.project_number = 'PMI-6781';

  -- Quote for Kitchens To Go VA modules
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'KITCHENS TO GO';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, converted_to_project_id
  )
  SELECT
    uuid_generate_v4(),
    'SQ-2025-002',
    v_customer_id,
    'won',
    1850000.00,
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '150 days',
    'SMM-1055-2025',
    'SMM',
    100,
    'GOVERNMENT',
    56,
    168,
    9408,
    3,
    v_sales_rep1_id,
    p.id
  FROM projects p WHERE p.project_number = 'SMM-21055';

  -- Quote for Dover Industries
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'DOVER INDUSTRIES';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, converted_to_project_id
  )
  SELECT
    uuid_generate_v4(),
    'SQ-2025-003',
    v_customer_id,
    'won',
    2200000.00,
    NOW() - INTERVAL '200 days',
    NOW() - INTERVAL '180 days',
    'SSI-7669-2025',
    'SSI',
    100,
    'CUSTOM',
    68,
    280,
    19040,
    8,
    v_sales_rep2_id,
    p.id
  FROM projects p WHERE p.project_number = 'SSI-7669';

  -- ========================================================================
  -- CREATE STANDALONE QUOTES (Various stages for Mitch)
  -- ========================================================================

  -- Quote: High probability (95%) - Awaiting PO
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'PACIFIC MOBILE STRUCTURES';
  SELECT id INTO v_dealer_id FROM dealers WHERE code = 'PMSI' LIMIT 1;

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, dealer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, pm_flagged, pm_flagged_at
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-001',
    v_customer_id,
    v_dealer_id,
    'awaiting_po',
    1450000.00,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '2 days',
    'NW-0098-2026',
    'NWBS',
    95,
    'Customer finalizing budget approval',
    'CUSTOM',
    66,
    168,
    11088,
    6,
    v_mitch_id,
    true,
    NOW() - INTERVAL '5 days'
  );

  -- Quote: Negotiating (75%)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'UNITED RENTALS';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-002',
    v_customer_id,
    'negotiating',
    875000.00,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '3 days',
    'SSI-0156-2026',
    'SSI',
    75,
    'Price negotiation in progress',
    'FLEET/STOCK',
    60,
    120,
    7200,
    4,
    v_sales_rep1_id
  );

  -- Quote: Sent (40%)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'GOOGLE FACILITIES';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-003',
    v_customer_id,
    'sent',
    2100000.00,
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days',
    40,
    'Initial review by customer',
    'CUSTOM',
    72,
    200,
    14400,
    8,
    v_mitch_id
  );

  -- Quote: Draft (20%)
  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-004',
    v_customer_id,
    'draft',
    680000.00,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day',
    20,
    'CUSTOM',
    56,
    84,
    4704,
    2,
    v_sales_rep2_id
  );

  -- Quote: PO Received - ready for PM handoff
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'US SPACE FORCE';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, pm_flagged, pm_flagged_at
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-005',
    v_customer_id,
    'po_received',
    3200000.00,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '1 day',
    'SMM-0234-2026',
    'SMM',
    100,
    'GOVERNMENT',
    72,
    240,
    17280,
    10,
    v_mitch_id,
    true,
    NOW()
  );

  -- Quote: Negotiating - large project
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'MODULAR MANAGEMENT GROUP';
  SELECT id INTO v_dealer_id FROM dealers WHERE code = 'MMG' LIMIT 1;

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, dealer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-006',
    v_customer_id,
    v_dealer_id,
    'negotiating',
    4500000.00,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '7 days',
    'SMM-0345-2026',
    'SMM',
    60,
    'Engineering review of custom requirements',
    'CUSTOM',
    80,
    320,
    25600,
    12,
    v_mitch_id
  );

  -- Quote: Lost (for reporting)
  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to
  )
  SELECT
    uuid_generate_v4(),
    'SQ-2025-010',
    id,
    'lost',
    550000.00,
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '60 days',
    0,
    'CUSTOM',
    60,
    100,
    6000,
    3,
    v_sales_rep1_id
  FROM sales_customers WHERE company_name = 'UNITED RENTALS';

  -- Quote: Expired
  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to
  )
  SELECT
    uuid_generate_v4(),
    'SQ-2025-008',
    id,
    'expired',
    420000.00,
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '90 days',
    0,
    'FLEET/STOCK',
    56,
    72,
    4032,
    2,
    v_sales_rep2_id
  FROM sales_customers WHERE company_name = 'PACIFIC MOBILE STRUCTURES';

  RAISE NOTICE 'Sales data created successfully';
END $$;

-- ============================================================================
-- CREATE SALES ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES sales_customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES sales_quotes(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  notes TEXT,
  activity_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_activities_all" ON sales_activities;
CREATE POLICY "sales_activities_all" ON sales_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sales_activities_customer ON sales_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_quote ON sales_activities(quote_id);

-- ============================================================================
-- CREATE SALES ACTIVITIES DATA
-- ============================================================================
INSERT INTO sales_activities (customer_id, activity_type, notes, created_at)
SELECT
  c.id,
  CASE (ROW_NUMBER() OVER ()) % 4
    WHEN 0 THEN 'call'
    WHEN 1 THEN 'email'
    WHEN 2 THEN 'meeting'
    ELSE 'note'
  END,
  CASE (ROW_NUMBER() OVER ()) % 4
    WHEN 0 THEN 'Follow-up call regarding quote status'
    WHEN 1 THEN 'Sent updated pricing per customer request'
    WHEN 2 THEN 'On-site meeting to review project requirements'
    ELSE 'Customer interested in additional modules'
  END,
  NOW() - (((ROW_NUMBER() OVER ()) * 7) || ' days')::INTERVAL
FROM sales_customers c
CROSS JOIN generate_series(1, 3);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Sales data created:' AS status;

SELECT
  'Customers' AS data_type,
  COUNT(*) AS count
FROM sales_customers

UNION ALL

SELECT
  'Quotes',
  COUNT(*)
FROM sales_quotes

UNION ALL

SELECT
  'Activities',
  COUNT(*)
FROM sales_activities;

SELECT 'Quotes by status:' AS status;
SELECT
  status,
  COUNT(*) as count,
  SUM(total_price) as total_value
FROM sales_quotes
GROUP BY status
ORDER BY
  CASE status
    WHEN 'po_received' THEN 1
    WHEN 'awaiting_po' THEN 2
    WHEN 'negotiating' THEN 3
    WHEN 'sent' THEN 4
    WHEN 'draft' THEN 5
    WHEN 'won' THEN 6
    WHEN 'lost' THEN 7
    WHEN 'expired' THEN 8
  END;

SELECT 'Quotes flagged for PM:' AS status;
SELECT
  quote_number,
  status,
  total_price,
  pm_flagged_at
FROM sales_quotes
WHERE pm_flagged = true
ORDER BY pm_flagged_at DESC;
