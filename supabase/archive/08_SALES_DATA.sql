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

-- Ensure unique constraint on code for ON CONFLICT handling
ALTER TABLE dealers DROP CONSTRAINT IF EXISTS dealers_code_key;
ALTER TABLE dealers ADD CONSTRAINT dealers_code_key UNIQUE (code);

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
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES users(id);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS imported_from VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS praxis_synced_at TIMESTAMPTZ;

-- Add project details columns used by QuoteForm
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS project_name VARCHAR(200);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS project_description TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS project_location VARCHAR(255);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS project_city VARCHAR(100);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS project_state VARCHAR(2);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS factory VARCHAR(20);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS product_type VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS product_config JSONB;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS base_price NUMERIC(12,2);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS options_price NUMERIC(12,2);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS deposit_required NUMERIC(12,2);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS requested_delivery_date DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS estimated_production_weeks INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS quote_valid_until DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS customer_notes TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES users(id);

-- Enable RLS
ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_quotes_all" ON sales_quotes;
CREATE POLICY "sales_quotes_all" ON sales_quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_quotes_customer ON sales_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_assigned ON sales_quotes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_dealer ON sales_quotes(dealer_id);

-- Ensure is_latest_version is set for all existing rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'sales_quotes' AND column_name = 'is_latest_version') THEN
    UPDATE sales_quotes SET is_latest_version = true WHERE is_latest_version IS NULL;
  END IF;
END $$;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_customers_company ON sales_customers(company_name);
CREATE INDEX IF NOT EXISTS idx_sales_customers_factory ON sales_customers(factory);

-- Add unique constraint on company_name for ON CONFLICT handling
ALTER TABLE sales_customers DROP CONSTRAINT IF EXISTS sales_customers_company_name_key;
ALTER TABLE sales_customers ADD CONSTRAINT sales_customers_company_name_key UNIQUE (company_name);

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
  v_robert_id UUID;
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

  -- Get Rover Thaler (Sales Rep at NWBS)
  SELECT id INTO v_robert_id FROM users
  WHERE id = 'aa90ef56-5f69-4531-a24a-5b3d1db608f2'
     OR name ILIKE '%robert%thaler%'
     OR email ILIKE '%robert.thaler%';

  -- Fallback to Mitch if Rover not found
  IF v_robert_id IS NULL THEN v_robert_id := v_mitch_id; END IF;

  -- Get or create sales reps
  SELECT id INTO v_sales_rep1_id FROM users WHERE role ILIKE '%sales%rep%' ORDER BY name LIMIT 1;
  SELECT id INTO v_sales_rep2_id FROM users WHERE role ILIKE '%sales%rep%' ORDER BY name OFFSET 1 LIMIT 1;

  IF v_sales_rep1_id IS NULL THEN v_sales_rep1_id := v_mitch_id; END IF;
  IF v_sales_rep2_id IS NULL THEN v_sales_rep2_id := v_mitch_id; END IF;

  -- ========================================================================
  -- CREATE SALES CUSTOMERS
  -- ========================================================================

  -- Actual clients from project list + additional prospects for pipeline
  INSERT INTO sales_customers (id, company_name, company_type, contact_name, contact_email, contact_phone, address_line1, city, state, zip_code, factory, created_at)
  VALUES
    -- Project clients
    (uuid_generate_v4(), 'SPECIALIZED TESTING & CONSTRUCTION', 'contractor', 'John Smith', 'jsmith@spectest.com', '(480) 555-1001', '1234 Industrial Blvd', 'Phoenix', 'AZ', '85001', 'PMI', NOW()),
    (uuid_generate_v4(), 'MODULAR MANAGEMENT GROUP', 'dealer', 'Sarah Johnson', 'sjohnson@mmg.com', '(404) 555-2002', '5678 Corporate Dr', 'Atlanta', 'GA', '30301', 'SMM', NOW()),
    (uuid_generate_v4(), 'KITCHENS TO GO', 'direct', 'Mike Williams', 'mwilliams@ktg.com', '(305) 555-3003', '9012 Culinary Way', 'Miami', 'FL', '33101', 'SMM', NOW()),
    (uuid_generate_v4(), 'MOBILE MODULAR- AUBURNDALE', 'dealer', 'Tony Deluca', 'tdeluca@mobilmod.com', '(863) 555-1001', '456 Modular Way', 'Auburndale', 'FL', '33823', 'SMM', NOW()),
    (uuid_generate_v4(), 'MOBILEASE MODULAR SPACE, INC.', 'dealer', 'Josh Ellis', 'jellis@mobilease.com', '(770) 555-2001', '789 Lease Dr', 'Atlanta', 'GA', '30301', 'SSI', NOW()),
    (uuid_generate_v4(), 'AFFORDABLE STRUCTURES - TAVARES', 'dealer', 'Roger Diamond', 'rdiamond@affordable.com', '(352) 555-3001', '123 Budget Blvd', 'Tavares', 'FL', '32778', 'SMM', NOW()),
    (uuid_generate_v4(), 'Mobile Modular Management Corporation', 'dealer', 'Mitch Quintana', 'mquintana@mmmc.com', '(509) 555-4001', '456 Hanford Rd', 'Richland', 'WA', '99352', 'NWBS', NOW()),
    (uuid_generate_v4(), 'MOBILE MODULAR MANAGEMENT', 'dealer', 'George Avila', 'gavila@mmm.com', '(480) 555-5001', '789 Phoenix Dr', 'Phoenix', 'AZ', '85001', 'PMI', NOW()),
    (uuid_generate_v4(), 'MODULAR GENIUS, INC.', 'dealer', 'Barbara Hicks', 'bhicks@modgenius.com', '(404) 555-6001', '321 Genius Way', 'Atlanta', 'GA', '30301', 'SSI', NOW()),
    (uuid_generate_v4(), 'WILLIAMS SCOTSMAN', 'dealer', 'Casey Knipp', 'cknipp@willscot.com', '(602) 555-7001', '654 Scotsman Blvd', 'Phoenix', 'AZ', '85001', 'PMI', NOW()),
    (uuid_generate_v4(), 'CASSONE LEASING, INC.', 'dealer', 'Dean Long', 'dlong@cassone.com', '(718) 555-8001', '987 Brooklyn Ave', 'Brooklyn', 'NY', '11201', 'PRM', NOW()),
    (uuid_generate_v4(), 'MOBILE MODULAR MANAGEMENT CORP.', 'dealer', 'Casey Knipp', 'cknipp@mmmc.com', '(213) 555-9001', '159 LA St', 'Los Angeles', 'CA', '90001', 'PMI', NOW()),
    -- Additional prospects for sales pipeline
    (uuid_generate_v4(), 'DOVER INDUSTRIES', 'direct', 'Mike Dover', 'mdover@doverindustries.com', '(404) 555-4001', '100 Dover Way', 'Atlanta', 'GA', '30301', 'SSI', NOW()),
    (uuid_generate_v4(), 'PACIFIC MOBILE STRUCTURES', 'dealer', 'Lisa Chen', 'lchen@pacificmobile.com', '(206) 555-5001', '200 Pacific Ave', 'Seattle', 'WA', '98101', 'NWBS', NOW()),
    (uuid_generate_v4(), 'UNITED RENTALS', 'dealer', 'Tom Anderson', 'tanderson@unitedrentals.com', '(203) 555-6001', '300 Rental Blvd', 'Stamford', 'CT', '06901', 'SSI', NOW()),
    (uuid_generate_v4(), 'GOOGLE FACILITIES', 'direct', 'Karen Mitchell', 'kmitchell@google.com', '(650) 555-7001', '1600 Amphitheatre Pkwy', 'Mountain View', 'CA', '94043', 'PMI', NOW()),
    (uuid_generate_v4(), 'US SPACE FORCE', 'government', 'Col. James Wright', 'james.wright@spaceforce.mil', '(321) 555-8001', '1 Space Force Way', 'Cape Canaveral', 'FL', '32920', 'SMM', NOW()),
    -- NWBS region prospects (Pacific Northwest)
    (uuid_generate_v4(), 'AMAZON WEB SERVICES', 'direct', 'Jennifer Collins', 'jcollins@amazon.com', '(206) 555-9001', '410 Terry Ave N', 'Seattle', 'WA', '98109', 'NWBS', NOW()),
    (uuid_generate_v4(), 'BOEING COMMERCIAL', 'direct', 'Robert Chen', 'rchen@boeing.com', '(425) 555-9002', '100 N Riverside', 'Renton', 'WA', '98055', 'NWBS', NOW()),
    (uuid_generate_v4(), 'PORT OF SEATTLE', 'government', 'Maria Santos', 'msantos@portseattle.org', '(206) 555-9003', '2711 Alaskan Way', 'Seattle', 'WA', '98121', 'NWBS', NOW()),
    (uuid_generate_v4(), 'MICROSOFT CAMPUS SERVICES', 'direct', 'David Park', 'dpark@microsoft.com', '(425) 555-9004', '1 Microsoft Way', 'Redmond', 'WA', '98052', 'NWBS', NOW()),
    (uuid_generate_v4(), 'OREGON HEALTH AUTHORITY', 'government', 'Dr. Sarah Kim', 'sarah.kim@dhsoha.state.or.us', '(503) 555-9005', '500 Summer St NE', 'Salem', 'OR', '97301', 'NWBS', NOW()),
    (uuid_generate_v4(), 'IDAHO NATIONAL LABORATORY', 'government', 'James Wilson', 'james.wilson@inl.gov', '(208) 555-9006', '1955 Fremont Ave', 'Idaho Falls', 'ID', '83415', 'NWBS', NOW())
  ON CONFLICT (company_name) DO NOTHING;

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
    assigned_to, converted_to_project_id, project_name, factory
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
    p.id,
    'Florence AZ Medical Complex',
    'PMI'
  FROM projects p WHERE p.project_number = 'PMI-6781';

  -- Quote for Kitchens To Go VA modules
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'KITCHENS TO GO';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, converted_to_project_id, project_name, factory
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
    p.id,
    'VA Kitchen Modules - Marietta',
    'SMM'
  FROM projects p WHERE p.project_number = 'SMM-21055';

  -- Quote for Dover Industries
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'DOVER INDUSTRIES';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, converted_to_project_id, project_name, factory
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
    p.id,
    'Dover Industries Office Complex',
    'SSI'
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
    assigned_to, pm_flagged, pm_flagged_at, project_name, factory
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
    NOW() - INTERVAL '5 days',
    'Seattle Distribution Center Expansion',
    'NWBS'
  );

  -- Quote: Negotiating (75%)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'UNITED RENTALS';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-002',
    v_customer_id,
    'negotiating',
    850000.00,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '3 days',
    'SSI-0156-2026',
    'SSI',
    75,
    'Price negotiation in progress',
    'FLEET/STOCK',
    60,
    120,
    1800,
    4,
    v_mitch_id,
    'United Rentals Fleet Expansion',
    'SSI'
  );

  -- Quote: Sent (40%)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'GOOGLE FACILITIES';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory, pm_flagged
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-003',
    v_customer_id,
    'negotiating',
    4200000.00,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '14 days',
    40,
    'Initial review by customer',
    'CUSTOM',
    72,
    200,
    3000,
    8,
    v_mitch_id,
    'Google Campus Temporary Offices',
    'PMI',
    true
  );

  -- Quote: Draft (20%) - US Space Force
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'US SPACE FORCE';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-004',
    v_customer_id,
    'draft',
    5800000.00,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day',
    20,
    'GOVERNMENT',
    56,
    84,
    2800,
    2,
    v_mitch_id,
    'Space Force Launch Command Center',
    'SMM'
  );

  -- Quote: PO Received - ready for PM handoff - different customer
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'MODULAR GENIUS, INC.';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, pm_flagged, pm_flagged_at, project_name, factory
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
    NOW(),
    'Atlanta Metro School District Portables',
    'SSI'
  );

  -- Quote: Negotiating - large project
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'MODULAR MANAGEMENT GROUP';
  SELECT id INTO v_dealer_id FROM dealers WHERE code = 'MMG' LIMIT 1;

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, dealer_id, status, total_price, created_at, updated_at,
    praxis_quote_number, praxis_source_factory, outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory
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
    v_mitch_id,
    'MMG Healthcare Campus Buildings',
    'SMM'
  );

  -- Quote: Lost (for reporting)
  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory
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
    v_mitch_id,
    'UR Midwest Expansion - Lost to Competitor',
    'SSI'
  FROM sales_customers WHERE company_name = 'UNITED RENTALS';

  -- Quote: Expired
  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory
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
    v_mitch_id,
    'PMSI Stock Order - Expired',
    'NWBS'
  FROM sales_customers WHERE company_name = 'PACIFIC MOBILE STRUCTURES';

  -- ========================================================================
  -- ROVER THALER'S QUOTES (Sales Rep at NWBS)
  -- ========================================================================

  -- Quote: AWS Data Center Security Building - Negotiating
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'AMAZON WEB SERVICES';
  SELECT id INTO v_dealer_id FROM dealers WHERE code = 'PMSI' LIMIT 1;

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, dealer_id, status, total_price, created_at, updated_at,
    outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-101',
    v_customer_id,
    v_dealer_id,
    'negotiating',
    2800000.00,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '2 days',
    70,
    'Security review and facility clearance',
    'CUSTOM',
    72,
    240,
    17280,
    8,
    v_robert_id,
    'AWS Quincy Data Center Security Facility',
    'NWBS'
  );

  -- Quote: Boeing Renton Assembly Support - Sent
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'BOEING COMMERCIAL';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-102',
    v_customer_id,
    'sent',
    1650000.00,
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days',
    45,
    'Customer engineering review',
    'CUSTOM',
    60,
    180,
    10800,
    6,
    v_robert_id,
    'Boeing 737 MAX Assembly Support Offices',
    'NWBS'
  );

  -- Quote: Port of Seattle - Awaiting PO (high probability)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'PORT OF SEATTLE';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory, pm_flagged, pm_flagged_at
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-103',
    v_customer_id,
    'awaiting_po',
    920000.00,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '3 days',
    90,
    'Final budget approval from Port Commission',
    'GOVERNMENT',
    56,
    120,
    6720,
    4,
    v_robert_id,
    'SeaTac Airport Terminal Expansion - Temp Offices',
    'NWBS',
    true,
    NOW() - INTERVAL '3 days'
  );

  -- Quote: Microsoft - Draft (new opportunity)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'MICROSOFT CAMPUS SERVICES';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-104',
    v_customer_id,
    'draft',
    3500000.00,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days',
    25,
    'CUSTOM',
    80,
    280,
    22400,
    10,
    v_robert_id,
    'Microsoft Redmond Campus Construction HQ',
    'NWBS'
  );

  -- Quote: Oregon Health Authority - Negotiating (medical)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'OREGON HEALTH AUTHORITY';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage, waiting_on,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory
  ) VALUES (
    uuid_generate_v4(),
    'SQ-2026-105',
    v_customer_id,
    'negotiating',
    1250000.00,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '5 days',
    55,
    'State procurement process',
    'GOVERNMENT',
    60,
    144,
    8640,
    5,
    v_robert_id,
    'Salem Mobile Health Clinic Complex',
    'NWBS'
  );

  -- Quote: Hanford AMPS Project - Won and converted (MITCH's quote)
  -- This links Mitch to the Hanford project via the quote relationship
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'Mobile Modular Management Corporation';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory, converted_to_project_id
  )
  SELECT
    uuid_generate_v4(),
    'SQ-2025-200',
    v_customer_id,
    'converted',
    2850000.00,
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '30 days',
    100,
    'GOVERNMENT',
    168,
    66,
    11088,
    6,
    v_mitch_id,  -- Mitch's quote!
    '168x66 Hanford AMPS Project MMG',
    'NWBS',
    p.id
  FROM projects p WHERE p.project_number = 'NWBS-25250';

  -- Quote: Idaho National Lab - Won (Robert's quote)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'IDAHO NATIONAL LABORATORY';

  INSERT INTO sales_quotes (
    id, quote_number, customer_id, status, total_price, created_at, updated_at,
    outlook_percentage,
    building_type, building_width, building_length, square_footage, module_count,
    assigned_to, project_name, factory
  )
  VALUES (
    uuid_generate_v4(),
    'SQ-2025-201',
    v_customer_id,
    'won',
    1800000.00,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '60 days',
    100,
    'GOVERNMENT',
    68,
    168,
    11424,
    6,
    v_robert_id,
    'INL Research Support Facility',
    'NWBS'
  );

  RAISE NOTICE 'Sales data created successfully';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR in sales data generation: % - %', SQLERRM, SQLSTATE;
  RAISE;
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
