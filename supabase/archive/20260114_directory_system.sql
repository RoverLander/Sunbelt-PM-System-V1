-- ============================================================================
-- DIRECTORY SYSTEM MIGRATION
-- ============================================================================
-- Creates the company directory infrastructure:
-- 1. Enhanced factories table with address/contact info
-- 2. Departments lookup table
-- 3. Directory contacts table (internal Sunbelt employees)
-- 4. External contacts table (customers, vendors, etc.)
--
-- Created: January 14, 2026
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE FACTORIES TABLE
-- ============================================================================
-- Add address, phone, and email domain columns

ALTER TABLE factories ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE factories ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE factories ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE factories ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE factories ADD COLUMN IF NOT EXISTS fax VARCHAR(50);
ALTER TABLE factories ADD COLUMN IF NOT EXISTS email_domain VARCHAR(100);
ALTER TABLE factories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add WM-ROCHESTER (missing from original list)
INSERT INTO factories (code, short_name, full_name, display_value, city, state, region, is_active, address_line1, zip_code, phone, email_domain)
VALUES (
  'WM-ROCHESTER',
  'Whitley Rochester',
  'Whitley Manufacturing Rochester',
  'WM-ROCHESTER - Whitley Manufacturing Rochester',
  'Rochester',
  'IN',
  'Midwest',
  true,
  '3089 E. Fort Wayne Ave.',
  '46975',
  '(574) 223-4934',
  'whitleyman.com'
)
ON CONFLICT (code) DO UPDATE SET
  short_name = EXCLUDED.short_name,
  full_name = EXCLUDED.full_name,
  display_value = EXCLUDED.display_value,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  region = EXCLUDED.region,
  address_line1 = EXCLUDED.address_line1,
  zip_code = EXCLUDED.zip_code,
  phone = EXCLUDED.phone,
  email_domain = EXCLUDED.email_domain;

-- Update all factories with address/phone/email info from directory
UPDATE factories SET
  address_line1 = '5301 W. Madison St.',
  zip_code = '85043',
  phone = '(602) 447-6460',
  email_domain = 'sunbeltmodular.com'
WHERE code = 'SNB';

UPDATE factories SET
  address_line1 = '5301 W. Madison St.',
  zip_code = '85043',
  phone = '(602) 447-6460',
  email_domain = 'phoenixmodular.com'
WHERE code = 'PMI';

UPDATE factories SET
  address_line1 = '4100 W. Glenrosa Ave.',
  zip_code = '85019',
  phone = '(602) 278-3355',
  email_domain = 'mrsteel.com'
WHERE code = 'MRS';

UPDATE factories SET
  address_line1 = '832 E. Walnut St.',
  zip_code = '75040',
  phone = '(972) 276-7626',
  email_domain = 'amtexcorp.com'
WHERE code = 'AMT';

UPDATE factories SET
  address_line1 = '698 West Highway 179',
  zip_code = '75860',
  phone = '(254) 741-6701',
  email_domain = 'britcousa.com'
WHERE code = 'BUSA';

UPDATE factories SET
  address_line1 = '721 N. Burleson Blvd.',
  zip_code = '76028',
  phone = '(817) 447-1213',
  email_domain = 'indicombuildings.com'
WHERE code = 'IBI';

UPDATE factories SET
  address_line1 = '2500 Industrial Street',
  zip_code = '34748',
  phone = '(352) 728-2930',
  email_domain = 'southeastmodular.com'
WHERE code = 'SMM';

UPDATE factories SET
  address_line1 = '2400 Springhead Church Rd.',
  zip_code = '31650',
  phone = '(912) 534-6111',
  email_domain = 'specializedstructures.com'
WHERE code = 'SSI';

UPDATE factories SET
  address_line1 = '603 South Broad St.',
  address_line2 = 'P.O. Box 1310',
  zip_code = '31806',
  phone = '(229) 937-5401',
  email_domain = 'promodmfg.com'
WHERE code = 'PRM';

UPDATE factories SET
  address_line1 = '405 E. Boeing Lane',
  zip_code = '83716',
  phone = '(208) 344-3527',
  email_domain = 'nwbsinc.com'
WHERE code = 'NWBS';

UPDATE factories SET
  address_line1 = '14219 Smokey Point Blvd.',
  zip_code = '98271',
  phone = '(360) 653-5790',
  email_domain = 'whitleyman.com'
WHERE code = 'WM-EVERGREEN';

UPDATE factories SET
  address_line1 = '2224 Bloomingdale Dr.',
  address_line2 = 'P.O. Box 369',
  zip_code = '46507',
  phone = '(574) 848-7300',
  fax = '(574) 848-0899',
  email_domain = 'candbmod.com'
WHERE code = 'C&B';

UPDATE factories SET
  address_line1 = '201 W. First St.',
  zip_code = '46787',
  phone = '(260) 723-5131',
  email_domain = 'whitleyman.com'
WHERE code = 'WM-SOUTH';

UPDATE factories SET
  address_line1 = '64 Hess Rd.',
  zip_code = '17540',
  phone = '(717) 656-2081',
  email_domain = 'whitleyman.com'
WHERE code = 'WM-EAST';

-- ============================================================================
-- 2. CREATE DEPARTMENTS LOOKUP TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_read_all" ON departments;
CREATE POLICY "departments_read_all" ON departments FOR SELECT TO authenticated USING (true);

-- Insert departments
INSERT INTO departments (code, name, description, sort_order) VALUES
  ('EXECUTIVE', 'Executive', 'CEO, CFO, CRO, VP, President', 1),
  ('ACCOUNTING', 'Accounting', 'Controller, Accounting Manager, AP, Staff Accountant', 2),
  ('HR', 'Human Resources', 'HR Manager, Payroll, Benefits', 3),
  ('MARKETING', 'Marketing', 'Marketing Director, Coordinator', 4),
  ('SALES', 'Sales', 'Sales Manager, Estimator, Business Development', 5),
  ('OPERATIONS', 'Operations', 'VP Operations, Plant General Manager, Project Manager, Project Coordinator', 6),
  ('PRODUCTION', 'Production', 'Production Manager, Supervisor, Foreman', 7),
  ('PURCHASING', 'Purchasing', 'Purchasing Manager, Purchasing Agent, Material Control', 8),
  ('ENGINEERING', 'Engineering', 'Engineer, Director of Engineering', 9),
  ('DRAFTING', 'Drafting', 'Drafting Manager, Drafter, Designer', 10),
  ('QUALITY', 'Quality', 'QA Manager, QC Inspector', 11),
  ('SAFETY', 'Safety', 'Safety Coordinator, Safety Manager', 12),
  ('IT', 'Information Technology', 'IT Manager, Programmer, Network Admin', 13),
  ('SERVICE', 'Service & Warranty', 'Service Manager, Service Technician, Warranty', 14)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_sort ON departments(sort_order);

-- ============================================================================
-- 3. CREATE DIRECTORY CONTACTS TABLE (Internal Employees)
-- ============================================================================

CREATE TABLE IF NOT EXISTS directory_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,

  -- Position
  position VARCHAR(200) NOT NULL,
  department_code VARCHAR(30) REFERENCES departments(code),

  -- Factory assignment
  factory_code VARCHAR(20) REFERENCES factories(code),

  -- Contact info
  email VARCHAR(255),
  phone_main VARCHAR(50),
  phone_extension VARCHAR(20),
  phone_direct VARCHAR(50),
  phone_cell VARCHAR(50),

  -- Status
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  deactivated_reason TEXT,

  -- Link to users table (if they have a login)
  user_id UUID REFERENCES users(id),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE directory_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "directory_contacts_read_all" ON directory_contacts;
CREATE POLICY "directory_contacts_read_all" ON directory_contacts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "directory_contacts_write_admin" ON directory_contacts;
CREATE POLICY "directory_contacts_write_admin" ON directory_contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_directory_contacts_factory ON directory_contacts(factory_code);
CREATE INDEX IF NOT EXISTS idx_directory_contacts_department ON directory_contacts(department_code);
CREATE INDEX IF NOT EXISTS idx_directory_contacts_active ON directory_contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_directory_contacts_name ON directory_contacts(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_directory_contacts_email ON directory_contacts(email);
CREATE INDEX IF NOT EXISTS idx_directory_contacts_full_name ON directory_contacts(full_name);

-- ============================================================================
-- 4. CREATE EXTERNAL CONTACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Company
  company_name VARCHAR(200) NOT NULL,
  company_type VARCHAR(50) DEFAULT 'Other', -- Customer, Architect, Inspector, Vendor, Dealer, Other

  -- Contact person
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200) GENERATED ALWAYS AS (
    COALESCE(first_name || ' ' || last_name, first_name, last_name, company_name)
  ) STORED,
  position VARCHAR(200),

  -- Contact info
  email VARCHAR(255),
  phone VARCHAR(50),
  phone_cell VARCHAR(50),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(20),

  -- Association (which factory typically works with them)
  primary_factory_code VARCHAR(20) REFERENCES factories(code),

  -- Portal access (future)
  has_portal_access BOOLEAN DEFAULT false,
  portal_access_level VARCHAR(30), -- view_only, respond, full

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE external_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "external_contacts_read_all" ON external_contacts;
CREATE POLICY "external_contacts_read_all" ON external_contacts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "external_contacts_write_all" ON external_contacts;
CREATE POLICY "external_contacts_write_all" ON external_contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_external_contacts_company ON external_contacts(company_name);
CREATE INDEX IF NOT EXISTS idx_external_contacts_type ON external_contacts(company_type);
CREATE INDEX IF NOT EXISTS idx_external_contacts_factory ON external_contacts(primary_factory_code);
CREATE INDEX IF NOT EXISTS idx_external_contacts_active ON external_contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_external_contacts_email ON external_contacts(email);

-- ============================================================================
-- 5. CREATE PROJECT-EXTERNAL CONTACT JUNCTION TABLE
-- ============================================================================
-- Links external contacts to projects they're involved with

CREATE TABLE IF NOT EXISTS project_external_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  external_contact_id UUID REFERENCES external_contacts(id) ON DELETE CASCADE,
  role VARCHAR(100), -- Customer Rep, Architect, Inspector, etc.
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, external_contact_id)
);

-- Enable RLS
ALTER TABLE project_external_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_external_contacts_all" ON project_external_contacts;
CREATE POLICY "project_external_contacts_all" ON project_external_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_project_ext_contacts_project ON project_external_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_ext_contacts_contact ON project_external_contacts(external_contact_id);

-- ============================================================================
-- 6. ADD CONTACT FIELDS TO TASKS TABLE
-- ============================================================================
-- For assignment and notification tracking

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_contact_id UUID REFERENCES directory_contacts(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(200);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_email VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notify_contacts JSONB DEFAULT '[]'::jsonb;

-- External contact assignment
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_external_id UUID REFERENCES external_contacts(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_external_name VARCHAR(200);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_external_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_contact ON tasks(assigned_to_contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_external ON tasks(assigned_to_external_id);

-- ============================================================================
-- 7. ADD CONTACT FIELDS TO RFIS TABLE
-- ============================================================================

ALTER TABLE rfis ADD COLUMN IF NOT EXISTS assigned_to_contact_id UUID REFERENCES directory_contacts(id);
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(200);
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS assigned_to_email VARCHAR(255);
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS notify_contacts JSONB DEFAULT '[]'::jsonb;

-- External contact assignment
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS assigned_to_external_id UUID REFERENCES external_contacts(id);
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS assigned_external_name VARCHAR(200);
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS assigned_external_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_rfis_assigned_contact ON rfis(assigned_to_contact_id);
CREATE INDEX IF NOT EXISTS idx_rfis_assigned_external ON rfis(assigned_to_external_id);

-- ============================================================================
-- 8. ADD CONTACT FIELDS TO SUBMITTALS TABLE
-- ============================================================================

ALTER TABLE submittals ADD COLUMN IF NOT EXISTS assigned_to_contact_id UUID REFERENCES directory_contacts(id);
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(200);
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS assigned_to_email VARCHAR(255);
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS notify_contacts JSONB DEFAULT '[]'::jsonb;

-- External contact assignment
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS assigned_to_external_id UUID REFERENCES external_contacts(id);
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS assigned_external_name VARCHAR(200);
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS assigned_external_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_submittals_assigned_contact ON submittals(assigned_to_contact_id);
CREATE INDEX IF NOT EXISTS idx_submittals_assigned_external ON submittals(assigned_to_external_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Directory system migration complete' AS status;
SELECT 'Factories: ' || COUNT(*) AS factories FROM factories;
SELECT 'Departments: ' || COUNT(*) AS departments FROM departments;
