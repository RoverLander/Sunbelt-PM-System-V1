-- ============================================================================
-- MASTER DEMO DATA SCRIPT
-- ============================================================================
-- This script combines all demo data scripts in the correct execution order.
-- Run this single script to populate all demo data.
--
-- Execution Order:
--   0. Update Users (set roles and factories)
--   1. Clear Data (truncate all project-related tables)
--   2. Create Factories (15 factory locations)
--   3. Create Departments (14 department codes)
--   4. Create Workflow Stations (21 stations in 4 phases)
--   5. Import Projects (20 demo projects)
--   6. Generate Project Data (tasks, RFIs, submittals, etc.)
--   7. Initialize Workflow Status (per-project workflow tracking)
--   8. Create Sales Data (customers, quotes, activities)
--   9. Import Directory Contacts (311 employee contacts)
--
-- Created: January 14, 2026
-- ============================================================================

-- ############################################################################
-- STEP 0: UPDATE USER ROLES AND FACTORIES
-- ############################################################################
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
-- | Robert Thaler     | robert.thaler@nwbsinc.com            | Sales_Rep          | NWBS    |
-- | Devin Duvak       | devin.duvak@sunbeltmodular.com       | VP                 | SNB     |
-- | Joy Thomas        | joy.thomas@sunbeltmodular.com        | IT_Manager         | SNB     |
-- | Juanita Earnest   | juanita.earnest@phoenixmodular.com   | Project_Coordinator| PMI     |

-- Update Candy to Director role with SNB factory
UPDATE users
SET role = 'Director', factory = 'SNB'
WHERE email ILIKE '%candy%' OR name ILIKE '%candy%juhnke%';

-- Update all PMs to SNB factory (corporate)
UPDATE users
SET factory = 'SNB'
WHERE role IN ('Project_Manager', 'PM')
  AND (email ILIKE '%crystal%' OR email ILIKE '%hector%' OR email ILIKE '%matthew%' OR email ILIKE '%michael%');

-- Mitch Quintana (Sales_Manager at NWBS)
-- First try to update existing user, then insert if not exists
UPDATE users
SET role = 'Sales_Manager', factory = 'NWBS'
WHERE email ILIKE '%mitch%quintana%' OR email ILIKE '%mitch%';

-- Also try INSERT/UPSERT from auth.users
INSERT INTO users (id, email, name, role, factory, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Mitch Quintana'),
  'Sales_Manager',
  'NWBS',
  NOW()
FROM auth.users au
WHERE au.email ILIKE '%mitch%quintana%' OR au.email ILIKE '%mitch%'
ON CONFLICT (id) DO UPDATE SET
  role = 'Sales_Manager',
  factory = 'NWBS',
  name = COALESCE(EXCLUDED.name, users.name);

-- Sync new users from auth.users (if they exist)
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

-- Robert Thaler (Sales_Rep at NWBS - Estimator is a sales position)
INSERT INTO users (id, email, name, role, factory, created_at)
VALUES (
  'aa90ef56-5f69-4531-a24a-5b3d1db608f2',
  'robert.thaler@nwbsinc.com',
  'Robert Thaler',
  'Sales_Rep',
  'NWBS',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'Sales_Rep',
  factory = 'NWBS',
  name = 'Robert Thaler',
  email = 'robert.thaler@nwbsinc.com';

SELECT 'Step 0 complete: User roles updated' AS status;

-- ############################################################################
-- STEP 1: CLEAR ALL PROJECT DATA
-- ############################################################################
-- Clears all project-related data while keeping:
-- - Users (authenticated users)
-- - System config (feature_flags, announcements)
-- - Departments (lookup data - repopulated in step 3)

-- Safe truncate function
CREATE OR REPLACE FUNCTION safe_truncate(table_name TEXT) RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND information_schema.tables.table_name = safe_truncate.table_name) THEN
    EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Clear directory contact data
SELECT safe_truncate('project_external_contacts');
SELECT safe_truncate('external_contacts');
SELECT safe_truncate('directory_contacts');

-- Clear floor plan data
SELECT safe_truncate('floor_plan_items');
SELECT safe_truncate('floor_plan_pages');
SELECT safe_truncate('floor_plans');

-- Clear change order data
SELECT safe_truncate('change_order_items');
SELECT safe_truncate('change_orders');

-- Clear workflow-related project data
SELECT safe_truncate('color_selections');
SELECT safe_truncate('long_lead_items');
SELECT safe_truncate('cutsheet_submittals');
SELECT safe_truncate('drawing_versions');
SELECT safe_truncate('engineering_reviews');
SELECT safe_truncate('warning_emails_log');
SELECT safe_truncate('project_workflow_status');

-- Clear project logs & documents
SELECT safe_truncate('project_logs');
SELECT safe_truncate('project_documents_checklist');
SELECT safe_truncate('praxis_import_log');
SELECT safe_truncate('attachments');

-- Clear core project data
SELECT safe_truncate('milestones');
SELECT safe_truncate('submittals');
SELECT safe_truncate('rfis');
SELECT safe_truncate('tasks');

-- Clear sales data
SELECT safe_truncate('sales_quote_revisions');
SELECT safe_truncate('sales_activities');
SELECT safe_truncate('sales_quotes');
SELECT safe_truncate('sales_customers');
SELECT safe_truncate('dealers');

-- Clear projects (main table)
SELECT safe_truncate('projects');

-- Clear workflow stations (will be recreated)
SELECT safe_truncate('workflow_stations');

-- Clear factories (will be recreated with Praxis codes)
SELECT safe_truncate('factories');

-- Drop helper function
DROP FUNCTION IF EXISTS safe_truncate(TEXT);

SELECT 'Step 1 complete: Data cleared' AS status;

-- ############################################################################
-- STEP 2: CREATE FACTORIES TABLE WITH PRAXIS CODES
-- ############################################################################
-- Creates a proper factories table as single source of truth.
-- Uses Praxis factory codes as the standard.

DROP TABLE IF EXISTS factories CASCADE;

CREATE TABLE factories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  short_name VARCHAR(50) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  display_value VARCHAR(200) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  region VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  zip_code VARCHAR(20),
  phone VARCHAR(50),
  fax VARCHAR(50),
  email_domain VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factories_code ON factories(code);
CREATE INDEX IF NOT EXISTS idx_factories_active ON factories(is_active);

INSERT INTO factories (code, short_name, full_name, display_value, city, state, region, address_line1, zip_code, phone, email_domain, is_active)
VALUES
  ('SNB', 'Sunbelt Corporate', 'Sunbelt Modular (Corporate)', 'SNB - Sunbelt Modular (Corporate)',
   'Phoenix', 'AZ', 'Corporate', '2424 E Camelback Rd, Suite 1080', '85016', '(602) 224-4800', 'sunbeltmodular.com', true),
  ('PMI', 'Phoenix Modular', 'Phoenix Modular', 'PMI - Phoenix Modular',
   'Phoenix', 'AZ', 'Southwest', '1615 S 52nd St', '85043', '(602) 484-0420', 'phoenixmodular.com', true),
  ('MRS', 'MR Steel', 'MR Steel', 'MRS - MR Steel',
   'Phoenix', 'AZ', 'Southwest', '1615 S 52nd St', '85043', '(602) 484-0420', 'mrsteel.com', true),
  ('AMT', 'AMTEX', 'AMTEX', 'AMT - AMTEX',
   'Garland', 'TX', 'Texas', '100 W Miller Rd', '75041', '(972) 840-8150', 'amtex.com', true),
  ('BUSA', 'Britco USA', 'Britco Structures USA', 'BUSA - Britco Structures USA',
   'Teague', 'TX', 'Texas', '2323 CR 303', '75860', '(254) 739-2300', 'britco.com', true),
  ('IBI', 'Indicom', 'Indicom Buildings', 'IBI - Indicom Buildings',
   'Burleson', 'TX', 'Texas', '600 N Burleson Blvd', '76028', '(817) 295-9222', 'indicombuildings.com', true),
  ('SMM', 'Southeast Modular', 'Southeast Modular Manufacturing', 'SMM - Southeast Modular Manufacturing',
   'Leesburg', 'FL', 'Southeast', '26750 US Hwy 27', '34748', '(352) 787-1422', 'southeastmodular.com', true),
  ('SSI', 'Specialized Structures', 'Specialized Structures', 'SSI - Specialized Structures',
   'Willacoochee', 'GA', 'Southeast', '1200 Industrial Blvd', '31650', '(912) 534-5451', 'specstructures.com', true),
  ('PRM', 'Pro-Mod', 'ProMod Manufacturing', 'PRM - ProMod Manufacturing',
   'Ellaville', 'GA', 'Southeast', '340 Hwy 19 N', '31806', '(229) 937-2511', 'promodmfg.com', true),
  ('NWBS', 'Northwest', 'Northwest Building Systems', 'NWBS - Northwest Building Systems',
   'Boise', 'ID', 'Pacific Northwest', '5525 W Gowen Rd', '83709', '(208) 362-1120', 'nwbsi.com', true),
  ('WM-EVERGREEN', 'Whitley Evergreen', 'Whitley Manufacturing Evergreen', 'WM-EVERGREEN - Whitley Manufacturing Evergreen',
   'Marysville', 'WA', 'Pacific Northwest', '4000 88th St NE', '98270', '(360) 659-0770', 'whitleymfg.com', true),
  ('C&B', 'C&B Modular', 'C&B Custom Modular', 'C&B - C&B Custom Modular',
   'Bristol', 'IN', 'Midwest', '54665 CR 15', '46507', '(574) 848-4666', 'cbmodular.com', true),
  ('WM-SOUTH', 'Whitley South', 'Whitley Manufacturing South Whitley', 'WM-SOUTH - Whitley Manufacturing South Whitley',
   'South Whitley', 'IN', 'Midwest', '2201 W State Rd 14', '46787', '(260) 723-5175', 'whitleymfg.com', true),
  ('WM-EAST', 'Whitley East', 'Whitley Manufacturing East', 'WM-EAST - Whitley Manufacturing East',
   'Leola', 'PA', 'Northeast', '115 Groffdale Rd', '17540', '(717) 656-2611', 'whitleymfg.com', true),
  ('WM-ROCHESTER', 'Whitley Rochester', 'Whitley Manufacturing Rochester', 'WM-ROCHESTER - Whitley Manufacturing Rochester',
   'Rochester', 'NY', 'Northeast', '100 Industrial Park Dr', '14624', '(585) 555-0100', 'whitleymfg.com', true)
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
  email_domain = EXCLUDED.email_domain,
  is_active = EXCLUDED.is_active;

ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factories_read_all" ON factories;
CREATE POLICY "factories_read_all" ON factories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "factories_write_admin" ON factories;
CREATE POLICY "factories_write_admin" ON factories FOR ALL TO authenticated USING (true) WITH CHECK (true);

SELECT 'Step 2 complete: 15 factories created' AS status;

-- ############################################################################
-- STEP 3: CREATE DEPARTMENTS LOOKUP TABLE
-- ############################################################################
-- Creates the departments lookup table for directory contacts.
-- This matches the 14 departments from the Sunbelt directory.

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

SELECT 'Step 3 complete: 14 departments created' AS status;

-- ############################################################################
-- STEP 4: CREATE WORKFLOW STATIONS (21 Stations)
-- ############################################################################
-- Defines the 4-phase workflow system for project management.
-- These stations are used by the React Flow Workflow Canvas.

DROP TABLE IF EXISTS project_workflow_status CASCADE;
DROP TABLE IF EXISTS workflow_stations CASCADE;

CREATE TABLE workflow_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  phase INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 4),
  display_order INTEGER NOT NULL,
  default_owner VARCHAR(50),
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_stations_phase ON workflow_stations(phase);
CREATE INDEX IF NOT EXISTS idx_workflow_stations_key ON workflow_stations(station_key);

COMMENT ON TABLE workflow_stations IS 'Defines the workflow stations for post-sales process';
COMMENT ON COLUMN workflow_stations.phase IS '1=Initiation, 2=Dealer Sign-Offs, 3=Internal Approvals, 4=Delivery';

INSERT INTO workflow_stations (station_key, name, description, phase, display_order, default_owner, is_required)
VALUES
  -- PHASE 1: INITIATION (3 stations)
  ('sales_handoff', 'Sales Handoff', 'Initial project handoff from sales to PM', 1, 1, 'pm', true),
  ('kickoff_meeting', 'Kickoff Meeting', 'Internal kickoff and planning meeting', 1, 2, 'pm', true),
  ('site_survey', 'Site Survey', 'Site survey and documentation', 1, 3, 'pm', false),
  -- PHASE 2: DEALER SIGN-OFFS (7 stations)
  ('drawings_20', '20% Drawings', 'Preliminary layout drawings for dealer review', 2, 1, 'drafting', true),
  ('drawings_65', '65% Drawings', 'Design development drawings', 2, 2, 'drafting', true),
  ('drawings_95', '95% Drawings', 'Construction documents - near final', 2, 3, 'drafting', true),
  ('drawings_100', '100% Drawings', 'Final construction documents', 2, 4, 'drafting', true),
  ('color_selections', 'Color Selections', 'Dealer color and finish selections', 2, 5, 'dealer', true),
  ('long_lead_items', 'Long Lead Items', 'Equipment and materials with extended lead times', 2, 6, 'procurement', true),
  ('cutsheets', 'Cutsheet Submittals', 'Equipment cutsheet approvals', 2, 7, 'dealer', true),
  -- PHASE 3: INTERNAL APPROVALS (5 stations)
  ('engineering_review', 'Engineering Review', 'Internal engineering review and stamp', 3, 1, 'engineering', true),
  ('third_party_review', 'Third Party Review', 'Third party plan review (if required)', 3, 2, 'third_party', false),
  ('state_approval', 'State Approval', 'State modular approval (if required)', 3, 3, 'state', false),
  ('permit_submission', 'Permit Submission', 'Building permit submission', 3, 4, 'pm', false),
  ('change_orders', 'Change Orders', 'Process any change orders', 3, 5, 'pm', false),
  -- PHASE 4: DELIVERY (6 stations)
  ('production_start', 'Production Start', 'Factory production begins', 4, 1, 'factory', true),
  ('qc_inspection', 'QC Inspection', 'Quality control inspection at factory', 4, 2, 'factory', true),
  ('delivery_scheduled', 'Delivery Scheduled', 'Delivery date confirmed', 4, 3, 'pm', true),
  ('delivery_complete', 'Delivery Complete', 'Units delivered to site', 4, 4, 'pm', true),
  ('set_complete', 'Set Complete', 'Units set on foundation', 4, 5, 'pm', true),
  ('project_closeout', 'Project Closeout', 'Final documentation and closeout', 4, 6, 'pm', true)
ON CONFLICT (station_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  phase = EXCLUDED.phase,
  display_order = EXCLUDED.display_order,
  default_owner = EXCLUDED.default_owner,
  is_required = EXCLUDED.is_required;

ALTER TABLE workflow_stations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workflow_stations_read" ON workflow_stations;
CREATE POLICY "workflow_stations_read" ON workflow_stations FOR SELECT TO authenticated USING (true);

SELECT 'Step 4 complete: 21 workflow stations created' AS status;

-- ############################################################################
-- STEP 5: IMPORT 20 DEMO PROJECTS
-- ############################################################################
-- Imports 20 real projects with actual PM assignments

ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_value NUMERIC(12,2);

DELETE FROM projects WHERE project_number IN (
  'PMI-6781', 'SMM-21003', 'SMM-21054', 'SMM-21055', 'SMM-21056', 'SMM-21057',
  'SSI-7669', 'SSI-7670', 'SSI-7671', 'SSI-7672', 'SMM-21103', 'SMM-21145',
  'SMM-21020', '25B579-584', 'NWBS-25250', 'PMI-6798', 'SSI-7547',
  'PMI-6881', 'SME-23038', 'PMI-6749-6763'
);

DO $$
DECLARE
  v_candy_id UUID;
  v_crystal_id UUID;
  v_matthew_id UUID;
  v_hector_id UUID;
  v_michael_id UUID;
BEGIN
  SELECT id INTO v_candy_id FROM users WHERE email ILIKE '%candy.juhnke%' OR name ILIKE '%candy%juhnke%' LIMIT 1;
  SELECT id INTO v_crystal_id FROM users WHERE email ILIKE '%crystal.me%' OR name ILIKE '%crystal%me%' LIMIT 1;
  SELECT id INTO v_matthew_id FROM users WHERE email ILIKE '%matthew.mcdaniel%' OR name ILIKE '%matthew%mcdaniel%' LIMIT 1;
  SELECT id INTO v_hector_id FROM users WHERE email ILIKE '%hector.vazquez%' OR name ILIKE '%hector%vazquez%' LIMIT 1;
  SELECT id INTO v_michael_id FROM users WHERE email ILIKE '%michael.caracciolo%' OR name ILIKE '%michael%caracciolo%' LIMIT 1;

  IF v_candy_id IS NULL THEN
    SELECT id INTO v_candy_id FROM users WHERE role IN ('PM', 'Project_Manager', 'Director', 'VP') LIMIT 1;
  END IF;
  IF v_crystal_id IS NULL THEN v_crystal_id := v_candy_id; END IF;
  IF v_matthew_id IS NULL THEN v_matthew_id := v_candy_id; END IF;
  IF v_hector_id IS NULL THEN v_hector_id := v_candy_id; END IF;
  IF v_michael_id IS NULL THEN v_michael_id := v_candy_id; END IF;

  -- CANDY JUHNKE PROJECTS (1)
  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('PMI-6781', 'I-3 - Florence AZ Medical Intake/X-Ray Ctr 2-Story', 'PMI - Phoenix Modular', 'SPECIALIZED TESTING & CONSTRUCTION', 'George Avila', '2025-09-25', '2026-08-25', 'In Progress', 'On Track', v_candy_id, v_candy_id, v_candy_id, 2, 1850000.00, NOW());

  -- CRYSTAL MYERS PROJECTS (12)
  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SMM-21003', '96X60 DISNEY CONFERENCE BUILDING 160MPH', 'SMM - Southeast Modular', 'MOBILE MODULAR- AUBURNDALE', 'Shawn Durante', '2024-07-16', '2025-02-04', 'In Progress', 'Critical', v_crystal_id, v_candy_id, v_crystal_id, 3, 1650000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SMM-21054', '12''X56'' VA-WASH MODULE (GOOGLE SUMMERVILLE)', 'SMM - Southeast Modular', 'KITCHENS TO GO', 'Jason King', '2025-02-24', '2025-05-22', 'Complete', 'On Track', v_crystal_id, v_candy_id, v_crystal_id, 4, 195000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SMM-21055', '12''X56'' VA-PREP MODULE (FL,TX,SC)', 'SMM - Southeast Modular', 'KITCHENS TO GO', 'Jason King', '2025-02-24', '2025-07-12', 'Complete', 'On Track', v_crystal_id, v_candy_id, v_crystal_id, 4, 185000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SMM-21056', '12''X56'' VA-WASH MODULE (FL,TX,SC)', 'SMM - Southeast Modular', 'KITCHENS TO GO', 'Jason King', '2025-02-24', '2025-07-19', 'Complete', 'On Track', v_crystal_id, v_candy_id, v_crystal_id, 4, 185000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SMM-21057', '12''X56'' VA-COOK MODULE (FL,TX,SC)', 'SMM - Southeast Modular', 'KITCHENS TO GO', 'Jason King', '2025-02-24', '2025-07-26', 'Complete', 'On Track', v_crystal_id, v_candy_id, v_crystal_id, 4, 185000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SSI-7669', '140''X68'' MIKE DOVER A-B 8-CR 120MPH 57#SN/LD', 'SSI - Specialized Structures', 'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis', '2025-12-11', '2026-02-04', 'In Progress', 'On Track', v_crystal_id, v_candy_id, v_crystal_id, 2, 2200000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SSI-7670', 'CUSTOM COMPLEX MIKE DOVER 8-CR C-D 120MPH 57#SN/LD', 'SSI - Specialized Structures', 'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis', '2025-12-11', '2025-12-29', 'In Progress', 'At Risk', v_crystal_id, v_candy_id, v_crystal_id, 3, 2400000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SSI-7671', '84''X55'' MIKE DOVER MULTI PURPOSE 120MPH 57#SN/LD', 'SSI - Specialized Structures', 'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis', '2025-12-11', '2026-01-21', 'In Progress', 'On Track', v_crystal_id, v_candy_id, v_crystal_id, 2, 950000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SSI-7672', '14''X55'' MIKE FOOD SERVICE 120MPH 57#SN/LD', 'SSI - Specialized Structures', 'MOBILEASE MODULAR SPACE, INC.', 'Josh Ellis', '2025-12-11', '2026-01-26', 'In Progress', 'On Track', v_crystal_id, v_candy_id, v_crystal_id, 2, 380000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SMM-21103', '2B 24x50 SCIF WA State PE Certification 160mph', 'SMM - Southeast Modular', 'AFFORDABLE STRUCTURES - TAVARES', 'Roger Diamond', '2025-06-24', '2026-02-19', 'In Progress', 'On Track', v_crystal_id, v_crystal_id, v_crystal_id, 2, 1850000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SMM-21145', 'ACIC GERMANY- II-B', 'SMM - Southeast Modular', 'MODULAR MANAGEMENT GROUP', 'Jason King', '2025-11-19', NULL, 'Planning', 'On Track', v_crystal_id, v_hector_id, v_crystal_id, 1, 850000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SMM-21020', 'Patrick Space Force Base Building 1, 160MPH', 'SMM - Southeast Modular', 'MODULAR MANAGEMENT GROUP', 'Don Eisman', '2024-09-30', '2025-04-07', 'In Progress', 'At Risk', v_crystal_id, v_matthew_id, v_crystal_id, 3, 3200000.00, NOW());

  -- HECTOR VAZQUEZ PROJECTS (1)
  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('25B579-584', 'POINT MAGU NAVAL BASE (REACT) CA', 'IBI - Indicom Buildings', 'MODULAR MANAGEMENT GROUP', 'Jason King', '2025-07-15', '2026-02-26', 'In Progress', 'On Track', v_hector_id, v_michael_id, v_hector_id, 2, 4800000.00, NOW());

  -- MATTHEW MCDANIEL PROJECTS (3)
  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('NWBS-25250', '168x66 Hanford AMPS Project MMG', 'NWBS - Northwest Building Systems', 'Mobile Modular Management Corporation', 'Mitch Quintana', '2025-07-21', '2026-05-12', 'In Progress', 'On Track', v_matthew_id, v_candy_id, v_matthew_id, 2, 2850000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('PMI-6798', 'M/B - 52x68 & 36x72 Aambe Health Facility', 'PMI - Phoenix Modular', 'MOBILE MODULAR MANAGEMENT', 'George Avila', '2025-11-04', '2026-01-30', 'In Progress', 'On Track', v_matthew_id, v_candy_id, v_matthew_id, 2, 1250000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SSI-7547', 'BASF Georgia 2 Story 120 MPH', 'SSI - Specialized Structures', 'MODULAR GENIUS, INC.', 'Barbara Hicks', '2025-10-20', '2026-02-09', 'In Progress', 'On Track', v_matthew_id, v_michael_id, v_matthew_id, 3, 2750000.00, NOW());

  -- MICHAEL CARACCIOLO PROJECTS (3)
  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('PMI-6881', 'B- LASD Div 4 Facility', 'PMI - Phoenix Modular', 'WILLIAMS SCOTSMAN', 'Casey Knipp', '2026-01-07', '2026-08-24', 'Planning', 'On Track', v_michael_id, v_candy_id, v_michael_id, 1, 2100000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('SME-23038', 'DSNY - Brooklyn Lot Cleaning Garage Facility', 'PRM - Pro-Mod Manufacturing', 'CASSONE LEASING, INC.', 'Dean Long', '2025-09-15', '2026-02-16', 'In Progress', 'On Track', v_michael_id, v_candy_id, v_michael_id, 2, 3200000.00, NOW());

  INSERT INTO projects (project_number, name, factory, client_name, salesperson, start_date, target_online_date, status, health_status, primary_pm_id, backup_pm_id, owner_id, current_phase, contract_value, created_at)
  VALUES ('PMI-6749-6763', 'R-OCC Homeless Units - CD 15 E 116th Place', 'PMI - Phoenix Modular', 'MOBILE MODULAR MANAGEMENT CORP.', 'Casey Knipp', '2025-07-28', '2026-09-18', 'In Progress', 'On Track', v_michael_id, v_candy_id, v_michael_id, 2, 6200000.00, NOW());

  RAISE NOTICE 'Imported 20 projects successfully';
END $$;

SELECT 'Step 5 complete: 20 projects imported' AS status;

-- ############################################################################
-- STEP 6: GENERATE PROJECT DATA
-- ############################################################################
-- Creates tasks, RFIs, submittals, milestones, change orders, long lead items,
-- and color selections for each project based on their phase.

-- First verify we have projects
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM projects;
  IF v_count = 0 THEN
    RAISE EXCEPTION 'No projects found! Step 5 may have failed.';
  END IF;
  RAISE NOTICE 'Found % projects to generate data for', v_count;
END $$;

DO $$
DECLARE
  v_project RECORD;
  v_pm_id UUID;
  v_phase INTEGER;
  v_project_count INTEGER := 0;
  v_start_date DATE;
  v_target_date DATE;
BEGIN
  FOR v_project IN SELECT * FROM projects ORDER BY current_phase, created_at LOOP
    v_project_count := v_project_count + 1;

    v_pm_id := v_project.primary_pm_id;
    IF v_pm_id IS NULL THEN
      SELECT id INTO v_pm_id FROM users LIMIT 1;
    END IF;

    v_phase := COALESCE(v_project.current_phase, 1);
    v_start_date := COALESCE(v_project.start_date, CURRENT_DATE - INTERVAL '30 days');
    v_target_date := COALESCE(v_project.target_online_date, CURRENT_DATE + INTERVAL '90 days');

    -- ======================================================================
    -- TASKS: Phase-appropriate with prereqs completed
    -- ======================================================================

    -- Phase 1 Tasks (Always created)
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
    VALUES (v_project.id, 'Complete Sales Handoff', 'Review sales documentation and complete handoff checklist',
      CASE WHEN v_phase >= 1 THEN 'Completed' ELSE 'Not Started' END, 'High',
      v_start_date + INTERVAL '3 days', v_pm_id, v_pm_id, 'pm', 'sales_handoff', NOW());

    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
    VALUES (v_project.id, 'Schedule Kickoff Meeting', 'Coordinate internal kickoff meeting with all stakeholders',
      CASE WHEN v_phase > 1 THEN 'Completed' WHEN v_phase = 1 THEN 'In Progress' ELSE 'Not Started' END, 'High',
      v_start_date + INTERVAL '7 days', v_pm_id, v_pm_id, 'pm', 'kickoff_meeting', NOW());

    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
    VALUES (v_project.id, 'Complete Site Survey', 'Conduct site visit and document conditions',
      CASE WHEN v_phase > 1 THEN 'Completed' WHEN v_phase = 1 THEN 'Not Started' ELSE 'Not Started' END, 'Medium',
      v_start_date + INTERVAL '14 days', v_pm_id, v_pm_id, 'pm', 'site_survey', NOW());

    -- Phase 2 Tasks
    IF v_phase >= 2 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Review 20% Drawings', 'Review preliminary layout drawings and provide feedback',
        CASE WHEN v_phase > 2 OR (v_phase = 2 AND v_project.health_status != 'Critical') THEN 'Completed' ELSE 'Completed' END, 'High',
        v_start_date + INTERVAL '21 days', v_pm_id, v_pm_id, 'drafting', 'drawings_20', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Review 65% Drawings', 'Design development review with dealer',
        CASE WHEN v_phase > 2 THEN 'Completed' WHEN v_phase = 2 AND v_project.project_number IN ('SMM-21003', 'SSI-7669', 'SSI-7670') THEN 'Completed' WHEN v_phase = 2 THEN 'In Progress' ELSE 'Not Started' END, 'High',
        v_start_date + INTERVAL '35 days', v_pm_id, v_pm_id, 'drafting', 'drawings_65', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Review 95% Drawings', 'Near-final construction documents review',
        CASE WHEN v_phase > 2 THEN 'Completed' WHEN v_phase = 2 AND v_project.project_number = 'SMM-21003' THEN 'Awaiting Response' WHEN v_phase = 2 AND v_project.project_number IN ('SSI-7669', 'SSI-7670') THEN 'In Progress' ELSE 'Not Started' END, 'High',
        v_start_date + INTERVAL '49 days', v_pm_id, v_pm_id, 'drafting', 'drawings_95', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Finalize 100% Drawings', 'Final construction documents approval',
        CASE WHEN v_phase > 2 THEN 'Completed' ELSE 'Not Started' END, 'High',
        v_start_date + INTERVAL '63 days', v_pm_id, v_pm_id, 'drafting', 'drawings_100', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Confirm Color Selections', 'Get dealer confirmation on all color and finish selections',
        CASE WHEN v_phase > 2 THEN 'Completed' WHEN v_phase = 2 AND v_project.project_number IN ('SMM-21056', 'SMM-21057') THEN 'Awaiting Response' ELSE 'Not Started' END, 'Medium',
        v_start_date + INTERVAL '45 days', v_pm_id, v_pm_id, 'dealer', 'color_selections', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Order Long Lead Items', 'Identify and order equipment with extended lead times',
        CASE WHEN v_phase > 2 THEN 'Completed' WHEN v_phase = 2 AND v_project.project_number IN ('SMM-21055', 'SME-23038') THEN 'In Progress' ELSE 'Not Started' END, 'High',
        v_start_date + INTERVAL '30 days', v_pm_id, v_pm_id, 'procurement', 'long_lead_items', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Submit Cutsheets for Approval', 'Get dealer approval on equipment cutsheets',
        CASE WHEN v_phase > 2 THEN 'Completed' WHEN v_phase = 2 AND v_project.project_number = 'SMM-21057' THEN 'In Progress' ELSE 'Not Started' END, 'Medium',
        v_start_date + INTERVAL '50 days', v_pm_id, v_pm_id, 'dealer', 'cutsheets', NOW());
    END IF;

    -- Phase 3 Tasks
    IF v_phase >= 3 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Complete Engineering Review', 'Internal engineering review and stamp',
        CASE WHEN v_phase > 3 THEN 'Completed' WHEN v_phase = 3 AND v_project.project_number = 'SSI-7671' THEN 'In Progress' ELSE 'Completed' END, 'High',
        v_start_date + INTERVAL '70 days', v_pm_id, v_pm_id, 'engineering', 'engineering_review', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Third Party Plan Review', 'Submit for third party review if required',
        CASE WHEN v_phase > 3 THEN 'Completed' WHEN v_phase = 3 AND v_project.project_number = 'SSI-7672' THEN 'In Progress' ELSE 'Completed' END, 'Medium',
        v_start_date + INTERVAL '80 days', v_pm_id, v_pm_id, 'third_party', 'third_party_review', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Obtain State Approval', 'State modular approval process',
        CASE WHEN v_phase > 3 THEN 'Completed' WHEN v_phase = 3 AND v_project.project_number = 'SMM-21020' THEN 'Awaiting Response' ELSE 'Completed' END, 'High',
        v_start_date + INTERVAL '85 days', v_pm_id, v_pm_id, 'state', 'state_approval', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Submit Building Permits', 'Prepare and submit building permit application',
        CASE WHEN v_phase > 3 THEN 'Completed' WHEN v_phase = 3 THEN 'In Progress' ELSE 'Not Started' END, 'High',
        v_target_date - INTERVAL '90 days', v_pm_id, v_pm_id, 'pm', 'permit_submission', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Process Change Orders', 'Process any pending change orders',
        CASE WHEN v_phase > 3 THEN 'Completed' WHEN v_phase = 3 AND v_project.project_number = 'SSI-7547' THEN 'In Progress' ELSE 'Not Started' END, 'Medium',
        v_start_date + INTERVAL '75 days', v_pm_id, v_pm_id, 'pm', 'change_orders', NOW());
    END IF;

    -- Phase 4 Tasks
    IF v_phase >= 4 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Begin Production', 'Factory production kickoff',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' WHEN v_project.project_number = 'SMM-21054' THEN 'In Progress' ELSE 'Completed' END, 'High',
        v_target_date - INTERVAL '60 days', v_pm_id, v_pm_id, 'factory', 'production_start', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Quality Control Inspection', 'Factory QC inspection before shipping',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' WHEN v_project.project_number = '25B579-584' THEN 'In Progress' ELSE 'Completed' END, 'High',
        v_target_date - INTERVAL '30 days', v_pm_id, v_pm_id, 'factory', 'qc_inspection', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Schedule Delivery', 'Confirm delivery date and logistics',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' WHEN v_project.project_number = 'PMI-6749-6763' THEN 'In Progress' ELSE 'Completed' END, 'High',
        v_target_date - INTERVAL '21 days', v_pm_id, v_pm_id, 'pm', 'delivery_scheduled', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Confirm Delivery Complete', 'Units delivered to site',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, 'High',
        v_target_date - INTERVAL '14 days', v_pm_id, v_pm_id, 'pm', 'delivery_complete', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Complete Set Installation', 'Units set on foundation',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, 'High',
        v_target_date - INTERVAL '7 days', v_pm_id, v_pm_id, 'pm', 'set_complete', NOW());

      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, assigned_court, workflow_station_key, created_at)
      VALUES (v_project.id, 'Project Closeout', 'Final documentation and project closeout',
        CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, 'Medium',
        v_target_date, v_pm_id, v_pm_id, 'pm', 'project_closeout', NOW());
    END IF;

    -- ======================================================================
    -- RFIs: 3-4 per project
    -- ======================================================================
    INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
    VALUES (v_project.id, v_project.project_number || '-RFI-001', 1, 'Site Access Clarification',
      'Please clarify the site access route for delivery vehicles. The preliminary survey shows potential issues with overhead clearance on the main access road.',
      CASE WHEN v_phase >= 3 THEN 'Access from the north entrance via Industrial Blvd. Max height clearance is 14ft. Recommend escort vehicle for oversize loads.' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN 'Closed' WHEN v_phase = 2 THEN 'Open' ELSE 'Draft' END, 'Medium',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '10 days' ELSE NULL END,
      v_start_date + INTERVAL '17 days', true, v_project.client_name, v_pm_id, NOW());

    INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
    VALUES (v_project.id, v_project.project_number || '-RFI-002', 2, 'Electrical Panel Location',
      'Drawing sheet E-101 shows the main electrical panel in a location that conflicts with the mechanical room layout. Please advise on preferred location.',
      CASE WHEN v_phase >= 2 AND v_project.health_status != 'Critical' THEN 'Relocate electrical panel to west wall of mechanical room. Updated drawings to follow.' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN 'Closed' WHEN v_phase = 2 AND v_project.health_status = 'Critical' THEN 'Open' WHEN v_phase = 2 THEN 'Answered' ELSE 'Draft' END, 'High',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '25 days' ELSE NULL END,
      v_start_date + INTERVAL '32 days', true, v_project.client_name, v_pm_id, NOW());

    INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
    VALUES (v_project.id, v_project.project_number || '-RFI-003', 3, 'Flooring Material Substitution',
      'Specified flooring material (Shaw Contract LVT) has 12-week lead time. Can we substitute with equivalent Armstrong product available in 4 weeks?',
      CASE WHEN v_phase >= 3 THEN 'Approved. Armstrong Imperial Texture in matching color is acceptable.' ELSE NULL END,
      CASE WHEN v_phase >= 4 THEN 'Closed' WHEN v_phase = 3 THEN 'Answered' WHEN v_phase = 2 THEN 'Pending' ELSE 'Draft' END, 'Medium',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
      v_start_date + INTERVAL '47 days', true, v_project.client_name, v_pm_id, NOW());

    -- RFI 4: Urgent for critical projects or standard for others
    IF v_project.health_status IN ('Critical', 'At Risk') THEN
      INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
      VALUES (v_project.id, v_project.project_number || '-RFI-004', 4, 'URGENT: Foundation Specifications',
        'Foundation contractor reports soil conditions differ from geotechnical report. Requesting immediate review of foundation design. Site work is on hold pending response.',
        NULL, 'Open', 'Critical',
        CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '2 days',
        true, v_project.client_name, v_pm_id, NOW());
    ELSE
      INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
      VALUES (v_project.id, v_project.project_number || '-RFI-004', 4, 'HVAC Ductwork Routing',
        'Please confirm the preferred routing for main HVAC ductwork in the ceiling plenum. Two options presented in Sketch SK-M01.',
        CASE WHEN v_phase >= 3 THEN 'Option A approved - route along north wall to avoid conflict with structural beams.' ELSE NULL END,
        CASE WHEN v_phase >= 4 THEN 'Closed' WHEN v_phase >= 3 THEN 'Answered' ELSE 'Draft' END, 'Medium',
        CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '55 days' ELSE NULL END,
        v_start_date + INTERVAL '62 days', false, 'Engineering Team', v_pm_id, NOW());
    END IF;

    -- ======================================================================
    -- SUBMITTALS: 4 per project
    -- ======================================================================
    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (v_project.id, v_project.project_number || '-SUB-001', 'HVAC Package Unit', 'Product Data',
      CASE WHEN v_phase >= 3 THEN 'Approved' WHEN v_phase = 2 THEN 'Under Review' ELSE 'Draft' END,
      'Carrier', '50XC-024',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '37 days' ELSE NULL END, NOW());

    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (v_project.id, v_project.project_number || '-SUB-002', 'Main Electrical Panel', 'Shop Drawings',
      CASE WHEN v_phase >= 3 THEN 'Approved' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Draft' END,
      'Square D', 'QO130L200PG',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '35 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '42 days' ELSE NULL END, NOW());

    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (v_project.id, v_project.project_number || '-SUB-003', 'LVT Flooring', 'Samples',
      CASE WHEN v_phase >= 4 THEN 'Approved' WHEN v_phase = 3 THEN 'Approved as Noted' WHEN v_phase = 2 THEN 'Under Review' ELSE 'Draft' END,
      'Shaw Contract', 'Crete II',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '50 days' ELSE NULL END, NOW());

    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
    VALUES (v_project.id, v_project.project_number || '-SUB-004', 'Aluminum Windows', 'Shop Drawings',
      CASE WHEN v_phase >= 4 THEN 'Approved' WHEN v_phase >= 3 THEN 'Approved' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Draft' END,
      'Milgard', 'Style Line Series',
      CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '45 days' ELSE NULL END,
      CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '55 days' ELSE NULL END, NOW());

    -- ======================================================================
    -- MILESTONES: 6 per project
    -- ======================================================================
    INSERT INTO milestones (project_id, name, due_date, status, created_at) VALUES
      (v_project.id, 'Sales Handoff Complete', v_start_date + INTERVAL '7 days',
       CASE WHEN v_phase >= 1 THEN 'Completed' ELSE 'Not Started' END, NOW()),
      (v_project.id, '65% Drawings Approved', v_start_date + INTERVAL '45 days',
       CASE WHEN v_phase >= 3 THEN 'Completed' WHEN v_phase = 2 THEN 'In Progress' ELSE 'Not Started' END, NOW()),
      (v_project.id, 'Engineering Stamp Received', v_start_date + INTERVAL '75 days',
       CASE WHEN v_phase >= 4 THEN 'Completed' WHEN v_phase = 3 THEN 'In Progress' ELSE 'Not Started' END, NOW()),
      (v_project.id, 'Production Start', v_target_date - INTERVAL '60 days',
       CASE WHEN v_phase = 4 AND v_project.status != 'Complete' THEN 'In Progress' WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, NOW()),
      (v_project.id, 'Delivery Complete', v_target_date - INTERVAL '14 days',
       CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, NOW()),
      (v_project.id, 'Project Closeout', v_target_date,
       CASE WHEN v_project.status = 'Complete' THEN 'Completed' ELSE 'Not Started' END, NOW());

    -- ======================================================================
    -- CHANGE ORDERS: 2 per project (for phase 2+)
    -- ======================================================================
    IF v_phase >= 2 THEN
      INSERT INTO change_orders (project_id, co_number, change_order_number, status, total_amount, date, sent_date, signed_date, implemented_date, description, created_by, created_at)
      VALUES (v_project.id, 1, v_project.project_number || '-CO-001',
        CASE WHEN v_phase >= 4 THEN 'Implemented' WHEN v_phase = 3 THEN 'Signed' WHEN v_phase = 2 THEN 'Sent' ELSE 'Draft' END,
        15000.00, v_start_date + INTERVAL '50 days',
        CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '52 days' ELSE NULL END,
        CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '58 days' ELSE NULL END,
        CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '65 days' ELSE NULL END,
        'Add additional electrical circuits for IT equipment', v_pm_id, NOW());

      INSERT INTO change_order_items (change_order_id, description, quantity, unit_price, total_price, display_order)
      SELECT co.id, 'Additional 20A circuit installation', 4, 2500.00, 10000.00, 1
      FROM change_orders co WHERE co.change_order_number = v_project.project_number || '-CO-001';

      INSERT INTO change_order_items (change_order_id, description, quantity, unit_price, total_price, display_order)
      SELECT co.id, 'Panel upgrade to accommodate circuits', 1, 5000.00, 5000.00, 2
      FROM change_orders co WHERE co.change_order_number = v_project.project_number || '-CO-001';

      INSERT INTO change_orders (project_id, co_number, change_order_number, status, total_amount, date, sent_date, signed_date, description, created_by, created_at)
      VALUES (v_project.id, 2, v_project.project_number || '-CO-002',
        CASE WHEN v_phase >= 4 THEN 'Signed' WHEN v_phase = 3 THEN 'Sent' ELSE 'Draft' END,
        8500.00, v_start_date + INTERVAL '70 days',
        CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '72 days' ELSE NULL END,
        CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '78 days' ELSE NULL END,
        'Upgrade interior finishes per client request', v_pm_id, NOW());

      INSERT INTO change_order_items (change_order_id, description, quantity, unit_price, total_price, display_order)
      SELECT co.id, 'Premium LVT flooring upgrade', 500, 12.00, 6000.00, 1
      FROM change_orders co WHERE co.change_order_number = v_project.project_number || '-CO-002';

      INSERT INTO change_order_items (change_order_id, description, quantity, unit_price, total_price, display_order)
      SELECT co.id, 'Premium paint finish', 1, 2500.00, 2500.00, 2
      FROM change_orders co WHERE co.change_order_number = v_project.project_number || '-CO-002';
    END IF;

    -- ======================================================================
    -- LONG LEAD ITEMS: 4 per project
    -- ======================================================================
    -- Schema matches 20260115_plant_manager_system.sql:
    -- part_name, part_number, vendor, lead_days, status, ordered, ordered_at, expected_date, received_date, notes
    INSERT INTO long_lead_items (project_id, part_name, part_number, vendor, lead_days, status, ordered, ordered_at, expected_date, received_date, notes)
    VALUES
      (v_project.id, 'HVAC Package Unit (Carrier)', '50XC-024', 'Ferguson', 56,
       CASE WHEN v_phase >= 4 THEN 'Received' WHEN v_phase >= 3 THEN 'Shipped' WHEN v_phase >= 2 THEN 'Ordered' ELSE 'Identified' END,
       CASE WHEN v_phase >= 2 THEN true ELSE false END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '86 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '82 days' ELSE NULL END,
       CASE WHEN v_phase >= 2 THEN 'Cutsheet approved' ELSE NULL END),
      (v_project.id, 'Custom Windows (Milgard)', 'Style Line 3000', 'Milgard Direct', 42,
       CASE WHEN v_phase >= 4 THEN 'Received' WHEN v_phase >= 3 THEN 'Shipped' WHEN v_phase >= 2 THEN 'Ordered' ELSE 'Identified' END,
       CASE WHEN v_phase >= 2 THEN true ELSE false END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '35 days' ELSE NULL END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '77 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '75 days' ELSE NULL END,
       NULL),
      (v_project.id, 'Backup Generator (Generac)', 'RG02724ANAX', 'Power Systems Inc', 70,
       CASE WHEN v_project.status = 'Complete' THEN 'Received' WHEN v_phase >= 4 THEN 'Shipped' WHEN v_phase >= 3 THEN 'Ordered' ELSE 'Identified' END,
       CASE WHEN v_phase >= 3 THEN true ELSE false END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '45 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '115 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 AND v_project.status = 'Complete' THEN v_start_date + INTERVAL '110 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN 'AHJ requires specific model' ELSE NULL END),
      (v_project.id, 'Fire Suppression System (Victaulic)', 'Vortex 500', 'Fire Safety Supply', 28,
       CASE WHEN v_phase >= 3 THEN 'Received' WHEN v_phase >= 2 THEN 'Ordered' ELSE 'Identified' END,
       CASE WHEN v_phase >= 2 THEN true ELSE false END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '68 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '65 days' ELSE NULL END,
       NULL);

    -- ======================================================================
    -- COLOR SELECTIONS: 12 per project
    -- ======================================================================
    INSERT INTO color_selections (project_id, category, item_name, color_name, color_code, manufacturer, is_non_stock, status, submitted_date, confirmed_date, created_at)
    VALUES
      (v_project.id, 'roofing', 'Metal Roof Panel', 'Charcoal Gray', 'CG-2850', 'MBCI', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '25 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '35 days' ELSE NULL END, NOW()),
      (v_project.id, 'exterior_siding', 'Exterior Siding Panel', 'Desert Tan', 'DT-4420', 'James Hardie', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '25 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '35 days' ELSE NULL END, NOW()),
      (v_project.id, 'exterior_trim', 'Window & Door Trim', 'Bright White', 'BW-100', 'Azek', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '26 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '36 days' ELSE NULL END, NOW()),
      (v_project.id, 'flooring', 'LVT Flooring', 'Warm Oak', 'WO-1122', 'Shaw Contract', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '40 days' ELSE NULL END, NOW()),
      (v_project.id, 'interior_walls', 'Wall Paint', 'Swiss Coffee', 'OC-45', 'Benjamin Moore', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '38 days' ELSE NULL END, NOW()),
      (v_project.id, 'interior_trim', 'Baseboards & Casings', 'Simply White', 'SW-7000', 'Sherwin-Williams', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' WHEN v_phase = 2 THEN 'Pending' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '38 days' ELSE NULL END, NOW()),
      (v_project.id, 'doors', 'Interior Doors', 'White Primer', 'WP-100', 'Masonite', false,
       CASE WHEN v_phase >= 3 THEN 'Confirmed' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '28 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '36 days' ELSE NULL END, NOW()),
      (v_project.id, 'cabinets', 'Kitchen Cabinets', 'Shaker White', 'SW-CAB', 'KraftMaid', false,
       CASE WHEN v_phase >= 4 THEN 'Confirmed' WHEN v_phase >= 2 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '32 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '48 days' ELSE NULL END, NOW()),
      (v_project.id, 'countertops', 'Laminate Counter', 'Calcutta Marble', 'CM-990', 'Wilsonart', true,
       CASE WHEN v_phase >= 4 THEN 'Confirmed' WHEN v_phase >= 2 THEN 'Pending' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '32 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '50 days' ELSE NULL END, NOW()),
      (v_project.id, 'fixtures', 'Plumbing Fixtures', 'Brushed Nickel', 'BN-200', 'Moen', false,
       CASE WHEN v_phase >= 4 THEN 'Confirmed' WHEN v_phase >= 3 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '52 days' ELSE NULL END, NOW()),
      (v_project.id, 'hardware', 'Door & Cabinet Hardware', 'Satin Nickel', 'SN-HW', 'Schlage', false,
       CASE WHEN v_phase >= 4 THEN 'Confirmed' WHEN v_phase >= 3 THEN 'Submitted' ELSE 'Pending' END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '52 days' ELSE NULL END, NOW());

  END LOOP;

  RAISE NOTICE 'Project data generated for % projects', v_project_count;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR in project data generation: % - %', SQLERRM, SQLSTATE;
  RAISE;
END $$;

SELECT 'Step 6 complete: Project data generated (tasks, RFIs, submittals, etc.)' AS status;

-- ############################################################################
-- STEP 7: INITIALIZE WORKFLOW STATUS PER PROJECT
-- ############################################################################

CREATE TABLE IF NOT EXISTS project_workflow_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  station_key VARCHAR(50) REFERENCES workflow_stations(station_key),
  status VARCHAR(20) DEFAULT 'not_started',
  started_date DATE,
  completed_date DATE,
  deadline DATE,
  notes TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, station_key)
);

CREATE INDEX IF NOT EXISTS idx_project_workflow_project ON project_workflow_status(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workflow_status ON project_workflow_status(status);

DO $$
DECLARE
  v_project RECORD;
  v_station RECORD;
  v_phase INTEGER;
  v_status VARCHAR(20);
  v_started_date DATE;
  v_completed_date DATE;
  v_days_offset INTEGER;
BEGIN
  FOR v_project IN SELECT * FROM projects ORDER BY current_phase LOOP
    v_phase := COALESCE(v_project.current_phase, 1);
    v_days_offset := 0;

    FOR v_station IN SELECT * FROM workflow_stations ORDER BY phase, display_order LOOP
      IF v_station.phase < v_phase THEN
        v_status := 'completed';
        v_started_date := v_project.start_date + (v_days_offset * INTERVAL '1 day');
        v_completed_date := v_project.start_date + ((v_days_offset + 7) * INTERVAL '1 day');
        v_days_offset := v_days_offset + 7;
      ELSIF v_station.phase = v_phase THEN
        IF v_station.display_order = 1 THEN
          v_status := 'in_progress';
          v_started_date := v_project.start_date + (v_days_offset * INTERVAL '1 day');
          v_completed_date := NULL;
          v_days_offset := v_days_offset + 7;
        ELSE
          v_status := 'not_started';
          v_started_date := NULL;
          v_completed_date := NULL;
        END IF;

        -- Special cases
        IF v_project.project_number = 'SMM-21003' AND v_station.station_key = 'drawings_95' THEN
          v_status := 'blocked';
          v_started_date := v_project.start_date + INTERVAL '45 days';
        END IF;

        IF v_project.project_number IN ('SSI-7669', 'SSI-7670') AND v_station.station_key = 'drawings_95' THEN
          v_status := 'in_progress';
          v_started_date := v_project.start_date + INTERVAL '42 days';
        END IF;

        IF v_project.project_number = 'PMI-6781' AND v_station.station_key = 'drawings_65' THEN
          v_status := 'in_progress';
          v_started_date := v_project.start_date + INTERVAL '28 days';
        END IF;

        IF v_project.project_number IN ('SMM-21055', 'SME-23038') AND v_station.station_key = 'long_lead_items' THEN
          v_status := 'in_progress';
          v_started_date := v_project.start_date + INTERVAL '35 days';
        END IF;

        IF v_project.project_number IN ('SMM-21056', 'SMM-21057') AND v_station.station_key = 'color_selections' THEN
          v_status := 'awaiting_response';
          v_started_date := v_project.start_date + INTERVAL '38 days';
        END IF;
      ELSE
        v_status := 'not_started';
        v_started_date := NULL;
        v_completed_date := NULL;
      END IF;

      IF v_station.is_required = false AND v_status = 'not_started' THEN
        v_status := 'skipped';
      END IF;

      INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date, deadline, updated_by, created_at, updated_at)
      VALUES (
        v_project.id, v_station.station_key, v_status, v_started_date, v_completed_date,
        CASE WHEN v_status IN ('in_progress', 'awaiting_response', 'blocked') THEN CURRENT_DATE + INTERVAL '14 days' ELSE NULL END,
        v_project.primary_pm_id, NOW(), NOW()
      )
      ON CONFLICT (project_id, station_key) DO UPDATE SET
        status = EXCLUDED.status,
        started_date = EXCLUDED.started_date,
        completed_date = EXCLUDED.completed_date,
        deadline = EXCLUDED.deadline,
        updated_at = NOW();
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Workflow status initialized for all projects';
END $$;

-- Note: NWBS-25250 Hanford AMPS Project is 'In Progress' at phase 2
-- It was sold by Mitch Quintana (Sales Manager at NWBS) and is managed by Matthew McDaniel
-- Keep workflow status consistent with project phase (not marking complete)

SELECT 'Step 7 complete: Workflow status initialized' AS status;

-- ############################################################################
-- STEP 8: CREATE SALES DATA
-- ############################################################################

-- Create sales_customers table if not exists
CREATE TABLE IF NOT EXISTS sales_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(200) NOT NULL,
  company_type VARCHAR(50) DEFAULT 'direct',
  contact_name VARCHAR(200),
  contact_email VARCHAR(200),
  contact_phone VARCHAR(50),
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  factory VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if missing
ALTER TABLE sales_customers DROP CONSTRAINT IF EXISTS sales_customers_company_name_key;
ALTER TABLE sales_customers ADD CONSTRAINT sales_customers_company_name_key UNIQUE (company_name);

ALTER TABLE sales_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_customers_all" ON sales_customers;
CREATE POLICY "sales_customers_all" ON sales_customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create sales_quotes base table if not exists (minimal columns)
CREATE TABLE IF NOT EXISTS sales_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number VARCHAR(50),
  customer_id UUID,
  status VARCHAR(30) DEFAULT 'draft',
  total_price NUMERIC(12,2),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint on quote_number if missing
ALTER TABLE sales_quotes DROP CONSTRAINT IF EXISTS sales_quotes_quote_number_key;
ALTER TABLE sales_quotes ADD CONSTRAINT sales_quotes_quote_number_key UNIQUE (quote_number);

-- ============================================================================
-- ADD ALL COLUMNS TO sales_quotes (ensures existing tables get updated)
-- ============================================================================
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_id UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS total_price NUMERIC(12,2);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS unit_count INTEGER DEFAULT 1;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS square_footage INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS total_square_footage INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged BOOLEAN DEFAULT false;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_at TIMESTAMPTZ;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_by UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_reason TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS won_date DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS praxis_quote_number VARCHAR(20);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS praxis_source_factory VARCHAR(10);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_branch VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_contact_name VARCHAR(100);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_type VARCHAR(30);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_width INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_length INTEGER;
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
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_to_project_id UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_by UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS imported_from VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS praxis_synced_at TIMESTAMPTZ;
-- CRITICAL: Add factory column for Sales Manager calendar filtering
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS factory VARCHAR(20);

ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_quotes_all" ON sales_quotes;
CREATE POLICY "sales_quotes_all" ON sales_quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sales_quotes_customer ON sales_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_assigned ON sales_quotes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_dealer ON sales_quotes(dealer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_factory ON sales_quotes(factory);

-- Ensure is_latest_version is set for all existing rows
UPDATE sales_quotes SET is_latest_version = true WHERE is_latest_version IS NULL;

-- Create sales_quote_revisions table if not exists
CREATE TABLE IF NOT EXISTS sales_quote_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES sales_quotes(id) ON DELETE CASCADE,
  revision_number INTEGER DEFAULT 1,
  changes_description TEXT,
  total_price NUMERIC(12,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_quote_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_quote_revisions_all" ON sales_quote_revisions;
CREATE POLICY "sales_quote_revisions_all" ON sales_quote_revisions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- GENERATE SALES DATA
-- ============================================================================
DO $$
DECLARE
  v_mitch_id UUID;
  v_robert_id UUID;
  v_sales_rep1_id UUID;
  v_sales_rep2_id UUID;
  v_customer_id UUID;
  v_project_id UUID;
BEGIN
  -- Find Mitch Quintana (Sales Manager at NWBS)
  SELECT id INTO v_mitch_id FROM users WHERE email ILIKE '%mitch%' OR name ILIKE '%mitch%' LIMIT 1;

  -- Find Robert Thaler (Sales Rep at NWBS) - uses Sales_Rep role
  SELECT id INTO v_robert_id FROM users WHERE (email ILIKE '%robert%thaler%' OR name ILIKE '%robert%thaler%') AND role = 'Sales_Rep' LIMIT 1;

  -- Find other sales users (include Sales_Rep in the search)
  SELECT id INTO v_sales_rep1_id FROM users
    WHERE role IN ('Sales', 'Sales_Manager', 'Sales_Rep')
    AND id NOT IN (COALESCE(v_mitch_id, '00000000-0000-0000-0000-000000000000'), COALESCE(v_robert_id, '00000000-0000-0000-0000-000000000000'))
    LIMIT 1;
  SELECT id INTO v_sales_rep2_id FROM users
    WHERE role IN ('Sales', 'Sales_Manager', 'Sales_Rep')
    AND id NOT IN (COALESCE(v_mitch_id, '00000000-0000-0000-0000-000000000000'), COALESCE(v_robert_id, '00000000-0000-0000-0000-000000000000'), COALESCE(v_sales_rep1_id, '00000000-0000-0000-0000-000000000000'))
    LIMIT 1;

  -- Fallback to any user
  IF v_mitch_id IS NULL THEN
    SELECT id INTO v_mitch_id FROM users LIMIT 1;
  END IF;
  IF v_robert_id IS NULL THEN v_robert_id := v_mitch_id; END IF;
  IF v_sales_rep1_id IS NULL THEN v_sales_rep1_id := v_mitch_id; END IF;
  IF v_sales_rep2_id IS NULL THEN v_sales_rep2_id := v_mitch_id; END IF;

  -- Create sales customers
  INSERT INTO sales_customers (id, company_name, company_type, contact_name, contact_email, contact_phone, address_line1, city, state, zip_code, factory, created_at)
  VALUES
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
    (uuid_generate_v4(), 'DOVER INDUSTRIES', 'direct', 'Mike Dover', 'mdover@doverindustries.com', '(404) 555-4001', '100 Dover Way', 'Atlanta', 'GA', '30301', 'SSI', NOW()),
    (uuid_generate_v4(), 'PACIFIC MOBILE STRUCTURES', 'dealer', 'Lisa Chen', 'lchen@pacificmobile.com', '(206) 555-5001', '200 Pacific Ave', 'Seattle', 'WA', '98101', 'NWBS', NOW()),
    (uuid_generate_v4(), 'UNITED RENTALS', 'dealer', 'Tom Anderson', 'tanderson@unitedrentals.com', '(203) 555-6001', '300 Rental Blvd', 'Stamford', 'CT', '06901', 'SSI', NOW()),
    (uuid_generate_v4(), 'GOOGLE FACILITIES', 'direct', 'Karen Mitchell', 'kmitchell@google.com', '(650) 555-7001', '1600 Amphitheatre Pkwy', 'Mountain View', 'CA', '94043', 'PMI', NOW()),
    (uuid_generate_v4(), 'US SPACE FORCE', 'government', 'Col. James Wright', 'james.wright@spaceforce.mil', '(321) 555-8001', '1 Space Force Way', 'Cape Canaveral', 'FL', '32920', 'SMM', NOW())
  ON CONFLICT (company_name) DO NOTHING;

  -- ========================================================================
  -- CREATE QUOTES LINKED TO PROJECTS (WON/CONVERTED)
  -- Factory field is CRITICAL for Sales Manager calendar filtering
  -- ========================================================================
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'SPECIALIZED TESTING & CONSTRUCTION';
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'PMI-6781';
  INSERT INTO sales_quotes (quote_number, customer_id, project_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, created_at)
  VALUES ('Q-2025-001', v_customer_id, v_project_id, 'converted', 1850000.00, 2, 3500, 7000, v_sales_rep1_id, v_sales_rep1_id, true, 'Florence AZ Medical - 2 story medical facility', CURRENT_DATE + INTERVAL '90 days', 'PMI', NOW() - INTERVAL '60 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'MODULAR MANAGEMENT GROUP';
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'SMM-21003';
  INSERT INTO sales_quotes (quote_number, customer_id, project_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, created_at)
  VALUES ('Q-2024-042', v_customer_id, v_project_id, 'converted', 1650000.00, 1, 5760, 5760, v_sales_rep1_id, v_sales_rep1_id, true, 'Disney Conference Building - 160MPH wind rating', CURRENT_DATE - INTERVAL '30 days', 'SMM', NOW() - INTERVAL '180 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'KITCHENS TO GO';
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'SMM-21054';
  INSERT INTO sales_quotes (quote_number, customer_id, project_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, created_at)
  VALUES ('Q-2025-008', v_customer_id, v_project_id, 'converted', 195000.00, 1, 672, 672, v_mitch_id, v_mitch_id, true, 'VA-WASH Module for Google Summerville', CURRENT_DATE + INTERVAL '30 days', 'SMM', NOW() - INTERVAL '90 days')
  ON CONFLICT (quote_number) DO NOTHING;

  -- CRITICAL: Mitch's quote linked to NWBS-25250 Hanford project via converted_to_project_id
  -- This is the key quote that allows Mitch (Sales Manager at NWBS) to see the Hanford project in his calendar
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'Mobile Modular Management Corporation';
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'NWBS-25250';
  INSERT INTO sales_quotes (quote_number, customer_id, converted_to_project_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, won_date, created_at)
  VALUES ('Q-2025-NWBS-001', v_customer_id, v_project_id, 'won', 2850000.00, 4, 2772, 11088, v_mitch_id, v_mitch_id, true, 'Hanford AMPS Project - 168x66 multi-building complex', CURRENT_DATE + INTERVAL '180 days', 'NWBS', CURRENT_DATE - INTERVAL '30 days', NOW() - INTERVAL '45 days')
  ON CONFLICT (quote_number) DO NOTHING;

  -- ========================================================================
  -- CREATE ACTIVE PIPELINE QUOTES (with factory for calendar filtering)
  -- ========================================================================
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'DOVER INDUSTRIES';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, pm_flagged, pm_flagged_at, notes, valid_until, factory, created_at)
  VALUES ('Q-2026-001', v_customer_id, 'pending', 2400000.00, 4, 2500, 10000, v_sales_rep1_id, v_sales_rep1_id, true, true, NOW() - INTERVAL '2 days', 'New office complex - 4 buildings', CURRENT_DATE + INTERVAL '45 days', 'SSI', NOW() - INTERVAL '5 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'UNITED RENTALS';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, created_at)
  VALUES ('Q-2026-002', v_customer_id, 'sent', 850000.00, 2, 1800, 3600, v_sales_rep2_id, v_sales_rep2_id, true, 'Equipment storage and office combo', CURRENT_DATE + INTERVAL '30 days', 'SSI', NOW() - INTERVAL '10 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'GOOGLE FACILITIES';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, pm_flagged, pm_flagged_at, notes, valid_until, factory, created_at)
  VALUES ('Q-2026-003', v_customer_id, 'negotiating', 4200000.00, 6, 3000, 18000, v_mitch_id, v_mitch_id, true, true, NOW() - INTERVAL '1 day', 'Data center support buildings - Mountain View', CURRENT_DATE + INTERVAL '60 days', 'PMI', NOW() - INTERVAL '15 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'US SPACE FORCE';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, created_at)
  VALUES ('Q-2026-004', v_customer_id, 'draft', 5800000.00, 8, 2800, 22400, v_sales_rep1_id, v_sales_rep1_id, true, 'Command center expansion - Cape Canaveral', CURRENT_DATE + INTERVAL '90 days', 'SMM', NOW() - INTERVAL '3 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'UNITED RENTALS';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, created_at)
  VALUES ('Q-2025-089', v_customer_id, 'lost', 1200000.00, 3, 1500, 4500, v_sales_rep2_id, v_sales_rep2_id, true, 'Lost to competitor - price difference', CURRENT_DATE - INTERVAL '30 days', 'SSI', NOW() - INTERVAL '45 days')
  ON CONFLICT (quote_number) DO NOTHING;

  -- NWBS factory quotes for Mitch (Sales Manager at NWBS)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'PACIFIC MOBILE STRUCTURES';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, created_at)
  VALUES ('Q-2026-005', v_customer_id, 'pending', 1800000.00, 4, 2000, 8000, v_mitch_id, v_mitch_id, true, 'Healthcare facility expansion - Seattle market', CURRENT_DATE + INTERVAL '45 days', 'NWBS', NOW() - INTERVAL '7 days')
  ON CONFLICT (quote_number) DO NOTHING;

  -- Additional NWBS quotes for Mitch to see more projects in calendar
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, created_at)
  VALUES ('Q-2026-NWBS-002', v_customer_id, 'sent', 950000.00, 2, 1600, 3200, v_mitch_id, v_mitch_id, true, 'Warehouse office combo - Boise', CURRENT_DATE + INTERVAL '60 days', 'NWBS', NOW() - INTERVAL '14 days')
  ON CONFLICT (quote_number) DO NOTHING;

  -- ========================================================================
  -- ROBERT THALER QUOTES (Sales Rep at NWBS)
  -- These are quotes assigned specifically to Robert at the NWBS factory
  -- ========================================================================

  -- Add NWBS customers for Robert's quotes
  INSERT INTO sales_customers (id, company_name, company_type, contact_name, contact_email, contact_phone, address_line1, city, state, zip_code, factory, created_at)
  VALUES
    (uuid_generate_v4(), 'AMAZON WEB SERVICES - SEATTLE', 'direct', 'Jennifer Park', 'jpark@aws.amazon.com', '(206) 555-1234', '410 Terry Ave N', 'Seattle', 'WA', '98109', 'NWBS', NOW()),
    (uuid_generate_v4(), 'BOEING COMMERCIAL AIRPLANES', 'direct', 'Mark Stevens', 'mark.stevens@boeing.com', '(425) 555-2345', '100 N Riverside', 'Everett', 'WA', '98201', 'NWBS', NOW()),
    (uuid_generate_v4(), 'PORT OF SEATTLE', 'government', 'Rachel Kim', 'rkim@portseattle.org', '(206) 555-3456', '2711 Alaskan Way', 'Seattle', 'WA', '98121', 'NWBS', NOW()),
    (uuid_generate_v4(), 'MICROSOFT CAMPUS SERVICES', 'direct', 'David Chen', 'dchen@microsoft.com', '(425) 555-4567', '1 Microsoft Way', 'Redmond', 'WA', '98052', 'NWBS', NOW()),
    (uuid_generate_v4(), 'STARBUCKS SUPPORT CENTER', 'direct', 'Maria Garcia', 'mgarcia@starbucks.com', '(206) 555-5678', '2401 Utah Ave S', 'Seattle', 'WA', '98134', 'NWBS', NOW())
  ON CONFLICT (company_name) DO NOTHING;

  -- Robert's active pipeline quotes at NWBS
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'AMAZON WEB SERVICES - SEATTLE';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, outlook_percentage, waiting_on, difficulty_rating, building_type, factory, created_at)
  VALUES ('Q-2026-NWBS-R01', v_customer_id, 'negotiating', 3200000.00, 6, 2400, 14400, v_robert_id, v_robert_id, true, 'AWS data center support facility - 6 module complex', CURRENT_DATE + INTERVAL '45 days', 75, 'Final pricing approval', 4, 'CUSTOM', 'NWBS', NOW() - INTERVAL '12 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'BOEING COMMERCIAL AIRPLANES';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, outlook_percentage, waiting_on, difficulty_rating, building_type, factory, created_at)
  VALUES ('Q-2026-NWBS-R02', v_customer_id, 'sent', 1850000.00, 4, 1800, 7200, v_robert_id, v_robert_id, true, 'Boeing Everett temporary office expansion', CURRENT_DATE + INTERVAL '30 days', 60, 'Customer review', 3, 'CUSTOM', 'NWBS', NOW() - INTERVAL '8 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'PORT OF SEATTLE';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, outlook_percentage, waiting_on, difficulty_rating, building_type, factory, created_at)
  VALUES ('Q-2026-NWBS-R03', v_customer_id, 'pending', 980000.00, 2, 1600, 3200, v_robert_id, v_robert_id, true, 'Port terminal security office - government spec', CURRENT_DATE + INTERVAL '60 days', 50, 'Budget approval', 3, 'GOVERNMENT', 'NWBS', NOW() - INTERVAL '15 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'MICROSOFT CAMPUS SERVICES';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, outlook_percentage, waiting_on, difficulty_rating, building_type, pm_flagged, pm_flagged_at, pm_flagged_reason, factory, created_at)
  VALUES ('Q-2026-NWBS-R04', v_customer_id, 'draft', 2100000.00, 4, 2200, 8800, v_robert_id, v_robert_id, true, 'Microsoft Redmond campus temp workspace during renovation', CURRENT_DATE + INTERVAL '90 days', 40, 'Site visit scheduled', 4, 'CUSTOM', true, NOW() - INTERVAL '1 day', 'Complex HVAC requirements - need PM input', 'NWBS', NOW() - INTERVAL '5 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'STARBUCKS SUPPORT CENTER';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, outlook_percentage, waiting_on, difficulty_rating, building_type, factory, created_at)
  VALUES ('Q-2026-NWBS-R05', v_customer_id, 'sent', 420000.00, 1, 1200, 1200, v_robert_id, v_robert_id, true, 'Starbucks training center addition', CURRENT_DATE + INTERVAL '21 days', 80, 'Contract review', 2, 'CUSTOM', 'NWBS', NOW() - INTERVAL '3 days')
  ON CONFLICT (quote_number) DO NOTHING;

  -- Robert's won quote (for conversion rate)
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, won_date, factory, created_at)
  VALUES ('Q-2025-NWBS-R10', v_customer_id, 'won', 650000.00, 2, 1000, 2000, v_robert_id, v_robert_id, true, 'Starbucks quality lab - Won Jan 2026', CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE - INTERVAL '10 days', 'NWBS', NOW() - INTERVAL '45 days')
  ON CONFLICT (quote_number) DO NOTHING;

  -- Robert's lost quote (for conversion rate)
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'PORT OF SEATTLE';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, factory, created_at)
  VALUES ('Q-2025-NWBS-R11', v_customer_id, 'lost', 1100000.00, 3, 1400, 4200, v_robert_id, v_robert_id, true, 'Lost to competitor - timing issues', CURRENT_DATE - INTERVAL '20 days', 'NWBS', NOW() - INTERVAL '60 days')
  ON CONFLICT (quote_number) DO NOTHING;

  RAISE NOTICE 'Sales data created successfully - Mitch: NWBS Sales Manager, Robert: NWBS Sales Rep';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR in sales data generation: % - %', SQLERRM, SQLSTATE;
  RAISE;
END $$;

-- Create sales_activities table
CREATE TABLE IF NOT EXISTS sales_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES sales_customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES sales_quotes(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  description TEXT,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_activities_all" ON sales_activities;
CREATE POLICY "sales_activities_all" ON sales_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

SELECT 'Step 8 complete: Sales data created' AS status;

-- ############################################################################
-- STEP 9: IMPORT DIRECTORY CONTACTS
-- ############################################################################

TRUNCATE TABLE directory_contacts CASCADE;

-- Import full directory contacts from 09_DIRECTORY_CONTACTS.sql
-- Run 09_DIRECTORY_CONTACTS.sql separately for full 311 contacts
-- This is a placeholder that imports a smaller set
-- To get all 311 contacts, run: \i 09_DIRECTORY_CONTACTS.sql
-- OR copy the full INSERT from 09_DIRECTORY_CONTACTS.sql here

INSERT INTO directory_contacts (first_name, last_name, position, department_code, factory_code, email, phone_main, phone_extension, phone_direct, phone_cell)
VALUES
  -- ========================================================================
  -- SNB - SUNBELT CORPORATE (72 contacts)
  -- ========================================================================
  ('Ron', 'Procunier', 'Chief Executive Officer (CEO)', 'EXECUTIVE', 'SNB', NULL, '(602) 447-6460', NULL, NULL, NULL),
  ('Bob', 'Lahmann', 'Chief Financial Officer (CFO)', 'EXECUTIVE', 'SNB', 'bob.lahmann@sunbeltmodular.com', NULL, NULL, NULL, '(410) 300-7926'),
  ('Gary', 'Davenport', 'Chief Revenue Office (CRO)', 'EXECUTIVE', 'SNB', 'gary.davenport@sunbeltmodular.com', NULL, NULL, NULL, '(704) 619-3665'),
  ('Mitch', 'Marois', 'Director of FP&A', 'ACCOUNTING', 'SNB', 'mitch.marois@sunbeltmodular.com', '(602) 447-6460', '138', NULL, '(602) 579-3316'),
  ('Irina', 'Lee', 'FP&A Analyst', 'ACCOUNTING', 'SNB', 'irina.lee@sunbeltmodular.com', NULL, NULL, NULL, '(623) 693-7203'),
  ('Dawn', 'Polk', 'Cost Acct Manager - East', 'ACCOUNTING', 'SNB', 'dawn.polk@sunbeltmodular.com', NULL, NULL, NULL, '(912) 381-2106'),
  ('Wendy', 'Li', 'Corporate Controller', 'ACCOUNTING', 'SNB', 'wendy.li@sunbeltmodular.com', '(602) 447-6460', '303', NULL, '(602) 910-8008'),
  ('Demi', 'Nguyen', 'Senior GL Analyst', 'ACCOUNTING', 'SNB', 'demi.nguyen@sunbeltmodular.com', '(602) 447-6460', '302', NULL, '(602) 717-0801'),
  ('Aina', 'Padasdao', 'Staff Accountant', 'ACCOUNTING', 'SNB', 'aina.padasdao@sunbeltmodular.com', '(602) 447-6460', '301', NULL, NULL),
  ('Ibet', 'Murillo', 'Vice President of HR & Integration', 'EXECUTIVE', 'SNB', 'ibet.murillo@sunbeltmodular.com', '(602) 447-6460', '112', NULL, '(602) 466-8456'),
  ('Argelia', 'Gonzalez', 'Benefits/Payroll Supervisor', 'HR', 'SNB', 'argelia.gonzalez@sunbeltmodular.com', '(602) 447-6460', '124', NULL, '(602) 541-1021'),
  ('Kaitlyn', 'Pogue', 'HR Compliance Specialist', 'HR', 'SNB', 'kaitlyn.pogue@sunbeltmodular.com', '(208) 781-7012', NULL, NULL, '(208) 869-4297'),
  ('Toni', 'Jacoby', 'Director of Marketing', 'MARKETING', 'SNB', 'toni.jacoby@sunbeltmodular.com', NULL, NULL, NULL, '(602) 768-9265'),
  ('Ashley', 'Camp', 'Marketing Coordinator & Event Planner', 'MARKETING', 'SNB', 'ashley.camp@sunbeltmodular.com', '(352) 728-2930', '336', NULL, '(928) 920-9171'),
  ('Frank', 'Monahan', 'Vice President of Business Development', 'EXECUTIVE', 'SNB', 'frank.monahan@sunbeltmodular.com', NULL, NULL, NULL, '(602) 793-4869'),
  ('Andreas', 'Klinckwort', 'Sales Manager - Energy', 'SALES', 'SNB', 'aklinckwort@britcousa.com', '(254) 741-6701', NULL, NULL, '(281) 384-6072'),
  ('Thomas', 'Cassity', 'Business Development - Healthcare', 'SALES', 'SNB', 'tom.cassity@sunbeltmodular.com', '(352) 728-2930', '321', NULL, '(352) 626-3313'),
  ('Desiree', 'Galan', 'Business Development', 'SALES', 'SNB', 'desiree.galan@sunbeltmodular.com', '(602) 447-6460', '102', NULL, '(602) 397-5465'),
  ('Edwin', 'Villegas', 'Designer', 'DRAFTING', 'SNB', 'edwin.villegas@sunbeltmodular.com', '(352) 728-2930', NULL, NULL, NULL),
  ('Brent', 'Morgan', 'Vice President of Sales (Central)', 'EXECUTIVE', 'SNB', 'bmorgan@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 313-8306'),
  ('Jason', 'King', 'Sales Manager - Major Projects (Central)', 'SALES', 'SNB', 'jason.king@sunbeltmodular.com', '(602) 447-6460', '122', NULL, '(602) 781-5134'),
  ('Casey', 'Tanner', 'Vice President of Sales (East)', 'EXECUTIVE', 'SNB', 'casey.tanner@sunbeltmodular.com', NULL, NULL, NULL, '(912) 381-2757'),
  ('Barbara', 'Hicks', 'Sales Manager - Major Projects (East)', 'SALES', 'SNB', 'barbara.hicks@sunbeltmodular.com', NULL, NULL, NULL, '(229) 815-8960'),
  ('Roger', 'Suggs', 'Sales & Estimating', 'SALES', 'SNB', 'roger.suggs@sunbeltmodular.com', NULL, NULL, NULL, '(706) 681-6819'),
  ('Johnny', 'Haskins', 'Sales & Estimating', 'SALES', 'SNB', 'johnny.haskins@sunbeltmodular.com', NULL, NULL, NULL, '(912) 393-5804'),
  ('Jay', 'Vanvlerah', 'Vice President of Sales (West)', 'EXECUTIVE', 'SNB', 'jay.vanvlerah@sunbeltmodular.com', NULL, NULL, NULL, '(214) 207-4044'),
  ('Casey', 'Knipp', 'Sales Manager - Major Projects (West)', 'SALES', 'SNB', 'casey.knipp@sunbeltmodular.com', '(602) 447-6460', '106', NULL, '(602) 781-5208'),
  ('George', 'Avila', 'Sales Estimator - Major Projects (West)', 'SALES', 'SNB', 'george.avila@sunbeltmodular.com', NULL, NULL, NULL, '(480) 617-8727'),
  ('Leah', 'Curtis', 'Sales & Estimating', 'SALES', 'SNB', 'leah.curtis@sunbeltmodular.com', '(602) 447-6460', '117', NULL, '(602) 781-6563'),
  ('Michael', 'Schmid', 'Sales & Estimating', 'SALES', 'SNB', 'michael.schmid@sunbeltmodular.com', NULL, NULL, NULL, '(720) 766-5759'),
  ('Nydia', 'Mora', 'Sales & Estimating', 'SALES', 'SNB', 'nydia.mora@phoenixmodular.com', '(602) 447-6460', '141', NULL, NULL),
  ('Jay', 'Daniels', 'Vice President of Operations', 'EXECUTIVE', 'SNB', 'jay.daniels@sunbeltmodular.com', '(602) 447-6460', '129', NULL, '(602) 327-4768'),
  ('Kim', 'Souvannarath', 'Estimating & Inventory Systems Manager', 'SALES', 'SNB', 'kim.souvannarath@sunbeltmodular.com', '(602) 447-6460', '304', NULL, '(623) 261-0129'),
  ('Monica', 'Mora', 'Purchasing Assistant', 'PURCHASING', 'SNB', 'monica.mora@sunbeltmodular.com', '(602) 447-6460', '134', NULL, NULL),
  ('David', 'Mejia', 'Vice President of Estimating & Inventory Systems', 'EXECUTIVE', 'SNB', 'david.mejia@sunbeltmodular.com', '(602) 447-6460', '104', NULL, '(602) 327-4770'),
  ('David', 'Sousa', 'IT Manager - West', 'IT', 'SNB', 'david.sousa@sunbeltmodular.com', '(602) 447-6460', '139', NULL, '(602) 478-1531'),
  ('Roy', 'Ray', 'IT Manager - East', 'IT', 'SNB', 'ron.ray@sunbeltmodular.com', NULL, NULL, NULL, NULL),
  ('Joy', 'Thomas', 'Lead Programmer', 'IT', 'SNB', 'joy.thomas@sunbeltmodular.com', NULL, NULL, NULL, '(480) 688-8899'),
  ('Aaron', 'Olheiser', 'Network Administrator', 'IT', 'SNB', 'aaron.olheiser@sunbeltmodular.com', NULL, NULL, NULL, '(480) 599-6918'),
  ('Mark', 'Mirgon', 'System Administrator', 'IT', 'SNB', 'mark.mirgon@sunbeltmodular.com', '(602) 447-6460', '305', NULL, NULL),
  ('Frank', 'Delucia', 'Director of Purchasing', 'PURCHASING', 'SNB', 'frank.delucia@sunbeltmodular.com', '(602) 447-6460', '103', NULL, '(602) 582-4368'),
  ('Crystal', 'Diaz', 'Commodity Specialist', 'PURCHASING', 'SNB', 'crystal.diaz@sunbeltmodular.com', '(602) 447-6460', '111', NULL, '(623) 432-2447'),
  ('Ryan', 'Mercado', 'Purchasing Assistant', 'PURCHASING', 'SNB', 'ryan.mercado@sunbeltmodular.com', '(602) 447-6460', '108', NULL, NULL),
  ('Devin', 'Duvak', 'Vice President of Manufacturing', 'EXECUTIVE', 'SNB', 'devin.duvak@sunbeltmodular.com', '(817) 447-1213', '5801', NULL, '(817) 559-3737'),
  ('Joe', 'Hall', 'Director of Manufacturing (East)', 'OPERATIONS', 'SNB', 'joe.hall@sunbeltmodular.com', '(229) 937-5401', NULL, NULL, '(229) 938-4640'),
  ('Candace', 'Juhnke', 'Project Manager', 'OPERATIONS', 'SNB', 'candy.juhnke@sunbeltmodular.com', NULL, NULL, NULL, '(602) 803-7224'),
  ('Crystal', 'Myers', 'Project Manager', 'OPERATIONS', 'SNB', 'crystal.myers@sunbeltmodular.com', NULL, NULL, NULL, NULL),
  ('Michael', 'Caracciolo', 'Project Manager', 'OPERATIONS', 'SNB', 'michael.caracciolo@sunbeltmodular.com', NULL, NULL, NULL, '(480) 848-1076'),
  ('Matthew', 'McDaniel', 'Project Manager', 'OPERATIONS', 'SNB', 'matthew.mcdaniel@sunbeltmodular.com', NULL, NULL, NULL, '(480) 848-4715'),
  ('Hector', 'Vazquez', 'Project Manager', 'OPERATIONS', 'SNB', 'hector.vazquez@sunbeltmodular.com', NULL, NULL, NULL, '(254) 500-4038'),
  ('Lois', 'Plymale', 'Architect', 'DRAFTING', 'SNB', 'lois.plymale@sunbeltmodular.com', '(352) 728-2930', NULL, NULL, '(352) 774-1679'),
  ('Michael', 'Grimes', 'Lead Drafter', 'DRAFTING', 'SNB', 'michael.grimes@sunbeltmodular.com', NULL, NULL, NULL, '(352) 910-3963'),
  ('Shaylon', 'Vaughn', 'Director of Engineering', 'ENGINEERING', 'SNB', 'shaylon.vaughn@sunbeltmodular.com', NULL, NULL, NULL, '(623) 202-3528'),
  ('Jasmin', 'Vicente', 'Engineer', 'ENGINEERING', 'SNB', 'jasmin.vicente@sunbeltmodular.com', NULL, NULL, NULL, '(425) 501-1234'),
  ('Valerie', 'Eskelsen', 'Engineer', 'ENGINEERING', 'SNB', 'valerie.eskelsen@sunbeltmodular.com', NULL, NULL, NULL, NULL),
  ('Louis', 'Cribb', 'Engineer', 'ENGINEERING', 'SNB', 'louis.cribb@sunbeltmodular.com', NULL, NULL, NULL, '(574) 903-3610'),
  ('Robert', 'Berry', 'Engineer', 'ENGINEERING', 'SNB', 'robert.berry@sunbeltmodular.com', NULL, NULL, NULL, '(602) 826-7014'),
  ('Roger', 'DeChavez', 'Engineer', 'ENGINEERING', 'SNB', 'roger.dechavez@sunbeltmodular.com', NULL, NULL, NULL, '(480) 647-9242'),
  ('Mark', 'Lindsay', 'Plan Examiner', 'DRAFTING', 'SNB', 'mark.lindsay@sunbeltmodular.com', NULL, NULL, NULL, '(480) 407-9519'),
  ('Michael', 'Schneider', 'Director of Drafting', 'DRAFTING', 'SNB', 'michael.schneider@sunbeltmodular.com', '(602) 447-6460', '115', NULL, '(214) 435-6267'),
  ('Valerie', 'Edmond', 'Drafting Manager - Eastern Region', 'DRAFTING', 'SNB', 'valerie.edmond@sunbeltmodular.com', '(602) 447-6460', NULL, NULL, '(480) 427-5330'),
  ('Russ', 'Kory', 'Drafting Manager - West Region', 'DRAFTING', 'SNB', 'russ.kory@sunbeltmodular.com', '(602) 447-6460', '132', NULL, '(480) 888-5037'),
  ('Kyle', 'Nissen', 'Drafter', 'DRAFTING', 'SNB', 'kyle.nissen@sunbeltmodular.com', '(602) 447-6460', '131', NULL, NULL),
  ('Rafael', 'Quiros', 'Drafter', 'DRAFTING', 'SNB', 'rafael.quiros@sunbeltmodular.com', '(602) 447-6460', '107', NULL, NULL),
  ('Christopher', 'Burgos', 'Drafter', 'DRAFTING', 'SNB', 'chris.burgos@sunbeltmodular.com', '(817) 447-1213', '5807', NULL, NULL),
  ('Lemon', 'Henry', 'Drafter', 'DRAFTING', 'SNB', 'lemon.henry@sunbeltmodular.com', '(602) 447-6460', '133', NULL, NULL),
  ('Marci', 'Mitchell', 'Director of Safety & Warranty', 'SAFETY', 'SNB', 'marci.mitchell@sunbeltmodular.com', '(602) 447-6460', '101', NULL, '(602) 803-0507'),
  ('Greg', 'Berry', 'Technical Support Manager', 'SERVICE', 'SNB', 'greg.berry@sunbeltmodular.com', NULL, NULL, NULL, '(817) 557-7870'),
  -- ========================================================================
  -- NWBS - NORTHWEST BUILDING SYSTEMS (20 contacts)
  -- ========================================================================
  ('Ross', 'Parks', 'Plant General Manager', 'OPERATIONS', 'NWBS', 'ross.parks@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7008', '(208) 866-3615'),
  ('Jenn', 'Parks', 'Accounting Manager', 'ACCOUNTING', 'NWBS', 'jenn.parks@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7006', '(208) 860-2719'),
  ('Alondra', 'Vargas', 'HR/Payroll Specialist', 'HR', 'NWBS', 'alondra.vargas@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7031', NULL),
  ('Jennifer', 'Lonergan', 'Office Admin/AP', 'OPERATIONS', 'NWBS', 'jennifer.lonergan@nwbsinc.com', '(208) 344-3527', '0', '(208) 781-7014', NULL),
  ('Mitch', 'Quintana', 'Sales Manager', 'SALES', 'NWBS', 'mitch.quintana@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7005', '(208) 860-2582'),
  ('Robert', 'Thaler', 'Estimator', 'SALES', 'NWBS', 'robert.thaler@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7011', '(208) 860-2763'),
  ('Justin', 'Downing', 'Production Manager', 'PRODUCTION', 'NWBS', 'justin.downing@nwbsinc.com', '(208) 344-3527', '9', '(208) 781-7025', '(208) 713-9828'),
  ('Steve', 'Cummings', 'Plant Manager 1', 'OPERATIONS', 'NWBS', 'steve.cummings@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7026', NULL),
  ('Ronnie', 'Ludquist', 'Plant Manager 2', 'OPERATIONS', 'NWBS', 'ronald.lundquist@nwbsinc.com', '(208) 344-3527', NULL, NULL, NULL),
  ('Russ', 'Metzger', 'Purchasing Manager', 'PURCHASING', 'NWBS', 'russ.metzger@nwbsinc.com', '(208) 344-3527', '1', '(208) 781-7009', '(208) 867-4781'),
  ('Justin', 'Weast', 'Purchasing Assistant', 'PURCHASING', 'NWBS', 'justin.weast@nwbsinc.com', '(208) 344-3527', '7', '(208) 781-7023', '(208) 605-9974'),
  ('Cassey', 'Brandon', 'Material Control', 'PURCHASING', 'NWBS', 'cassey.brandon@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7016', '(208) 576-5325'),
  ('Kelly', 'Daniels', 'Drafter', 'DRAFTING', 'NWBS', 'kelly.daniels@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7018', '(208) 484-1662'),
  ('James', 'McLeod', 'Drafter', 'DRAFTING', 'NWBS', 'james.mcleod@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7010', NULL),
  ('Trent', 'Thomson', 'Quality Assurance Manager', 'QUALITY', 'NWBS', 'trent.thomson@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7028', '(208) 405-1197'),
  ('Jeff', 'Murray', 'Safety Coordinator', 'SAFETY', 'NWBS', 'jeff.murray@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7022', '(208) 573-7322'),
  ('Steve', 'Jackman', 'QC/Transport Supervisor', 'SERVICE', 'NWBS', 'steven.jackman@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7021', NULL),
  ('Sepp', 'Braun', 'Service Technician', 'SERVICE', 'NWBS', 'sepp.braun@nwbsinc.com', '(208) 344-3527', '8', '(208) 781-7017', '(208) 968-8710'),
  ('Jerad', 'Martindale', 'Maintenance', 'SERVICE', 'NWBS', 'jerad.martindale@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7024', '(208) 841-3865'),
  -- ========================================================================
  -- PMI - PHOENIX MODULAR (22 contacts)
  -- ========================================================================
  ('Monty', 'King', 'Plant General Manager', 'OPERATIONS', 'PMI', 'monty.king@phoenixmodular.com', '(602) 447-6460', '116', NULL, '(602) 327-4771'),
  ('Amber', 'Chase', 'Plant Accounting Manager', 'ACCOUNTING', 'PMI', 'amber.chase@phoenixmodular.com', '(602) 447-6460', '306', NULL, '(605) 376-5322'),
  ('Susie', 'Ayala', 'HR/Payroll Specialist', 'HR', 'PMI', 'susie.ayala@phoenixmodular.com', '(602) 447-6460', '120', NULL, NULL),
  ('Melanie', 'Kenyon', 'A/P Specialist', 'ACCOUNTING', 'PMI', 'melanie.kenyon@phoenixmodular.com', '(602) 447-6460', '128', NULL, NULL),
  ('Sonia', 'Quezada', 'Administrative Assistant', 'OPERATIONS', 'PMI', 'sonia.quezada@phoenixmodular.com', '(602) 447-6460', '100', NULL, NULL),
  ('Brian', 'Shackleford', 'Sales Manager', 'SALES', 'PMI', 'brian.shackleford@phoenixmodular.com', '(602) 447-6460', '105', NULL, '(602) 397-5474'),
  ('Angela', 'Perillo', 'Sales & Estimating', 'SALES', 'PMI', 'angela.perillo@phoenixmodular.com', '(602) 447-6460', '127', NULL, NULL),
  ('Chris', 'Thomas', 'Sales & Estimating', 'SALES', 'PMI', 'chris.thomas@sunbeltmodular.com', '(602) 447-6460', '136', NULL, NULL),
  ('Dominic', 'Delucia', 'Sales & Estimating', 'SALES', 'PMI', 'dominic.delucia@phoenixmodular.com', '(602) 447-6460', NULL, NULL, NULL),
  ('Rafael', 'Quiros', 'Production Manager', 'PRODUCTION', 'PMI', 'rafael.quiros@phoenixmodular.com', '(602) 447-6460', '135', NULL, '(602) 320-6044'),
  ('Sam', 'Murillo', 'Purchasing Manager', 'PURCHASING', 'PMI', 'sam.murillo@phoenixmodular.com', '(602) 447-6460', '113', NULL, '(602) 803-0066'),
  ('Mariana', 'Martinez', 'Purchasing Assistant', 'PURCHASING', 'PMI', 'mariana.martinez@phoenixmodular.com', '(602) 447-6460', '126', NULL, NULL),
  ('Ramon', 'Armenta', 'Purchasing Assistant', 'PURCHASING', 'PMI', 'ramon.armenta@phoenixmodular.com', '(602) 447-6460', '137', NULL, NULL),
  ('Dawn', 'Lesser', 'Material Control Foreman', 'PRODUCTION', 'PMI', 'dawn.lesser@phoenixmodular.com', '(602) 447-6460', '118', NULL, '(602) 600-2544'),
  ('Jessica', 'Flores', 'Receiving Data Entry Clerk', 'PURCHASING', 'PMI', 'jessica.flores@phoenixmodular.com', '(602) 447-6460', '110', NULL, NULL),
  ('Juanita', 'Earnest', 'Project Coordinator Supervisor', 'OPERATIONS', 'PMI', 'juanita.earnest@phoenixmodular.com', '(602) 447-6460', '121', NULL, NULL),
  ('Rodrigo', 'Mejia', 'Drafting Manager', 'DRAFTING', 'PMI', 'rodrigo.mejia@phoenixmodular.com', '(602) 447-6460', '107', NULL, NULL),
  ('Cody', 'King', 'Drafter', 'DRAFTING', 'PMI', 'cody.king@phoenixmodular.com', '(602) 447-6460', '125', NULL, NULL),
  ('Cristobal', 'Lizarraga', 'Drafter', 'DRAFTING', 'PMI', 'cristobal.lizarraga@phoenixmodular.com', '(602) 447-6460', '125', NULL, NULL),
  ('Shawn', 'Stroh', '(Interim) Quality Assurance Manager', 'QUALITY', 'PMI', 'shawn.stroh@phoenixmodular.com', '(602) 447-6460', '123', NULL, '(602) 330-5439'),
  ('Alex', 'Alvarado Moreno', 'QC/Transport Supervisor', 'SERVICE', 'PMI', 'alexis.alvarado@phoenixmodular.com', '(602) 447-6460', '109', NULL, '(480) 720-8795'),
  ('Donald', 'Hull', 'Safety Coordinator', 'SAFETY', 'PMI', 'don.hull@phoenixmodular.com', '(602) 447-6460', '130', NULL, NULL),
  -- ========================================================================
  -- SMM - SOUTHEAST MODULAR (17 contacts)
  -- ========================================================================
  ('Joe', 'Reid', 'Plant General Manager', 'OPERATIONS', 'SMM', 'joe.reid@southeastmodular.com', '(352) 728-2930', '301', NULL, '(214) 336-8582'),
  ('Nancy', 'Davis', 'Accounting Manager', 'ACCOUNTING', 'SMM', 'nancy.davis@southeastmodular.com', '(352) 728-2930', '328', NULL, '(352) 446-6978'),
  ('Suzie', 'Nelson', 'HR Specialist', 'HR', 'SMM', 'suzie.nelson@southeastmodular.com', '(352) 728-2930', '314', NULL, '(352) 250-7820'),
  ('Patti', 'Friberg', 'Accounts Payable', 'ACCOUNTING', 'SMM', 'patti.friberg@southeastmodular.com', '(352) 728-2930', '300', NULL, NULL),
  ('Don', 'Eisman', 'Sales Manager', 'SALES', 'SMM', 'don.eisman@southeastmodular.com', '(352) 728-2930', '326', NULL, '(574) 333-7089'),
  ('Roger', 'Diamond', 'Estimating', 'SALES', 'SMM', 'roger.diamond@southeastmodular.com', '(352) 728-2930', '335', NULL, NULL),
  ('Shawn', 'Durante', 'Estimating', 'SALES', 'SMM', 'shawn.durante@southeastmodular.com', '(352) 728-2930', '324', NULL, NULL),
  ('Mike', 'Stoica', 'Production Manager', 'PRODUCTION', 'SMM', 'mike.stoica@southeastmodular.com', '(352) 728-2930', '313', NULL, '(352) 446-6482'),
  ('Cindy', 'Barnes', 'Assist. Production Manager', 'PRODUCTION', 'SMM', 'cindy.barnes@southeastmodular.com', '(352) 728-2930', '305', NULL, '(352) 809-2558'),
  ('Steve', 'Dudley', 'Purchasing Manager', 'PURCHASING', 'SMM', 'steve.dudley@southeastmodular.com', '(352) 728-2930', '310', NULL, '(352) 516-0631'),
  ('Corey', 'Abbott', 'Purchasing Agent', 'PURCHASING', 'SMM', 'corey.abbott@southeastmodular.com', '(352) 728-2930', '334', NULL, '(352) 348-7590'),
  ('Dave', 'McEwen', 'Material Control', 'PURCHASING', 'SMM', 'dave.mcewen@southeastmodular.com', '(352) 728-2930', '315', NULL, '(352) 603-2011'),
  ('Katie', 'Myers', 'Project Coordinator', 'OPERATIONS', 'SMM', 'katie.myers@southeastmodular.com', '(352) 728-2930', '312', NULL, '(352) 626-3577'),
  ('Chris', 'Smith', 'Drafting Manager', 'DRAFTING', 'SMM', 'chris.smith@southeastmodular.com', '(352) 728-2930', '307', NULL, NULL),
  ('Otha', 'Matthews', 'Drafter', 'DRAFTING', 'SMM', 'tommy.matthews@southeastmodular.com', '(352) 728-2930', '307', NULL, NULL),
  ('Zachary', 'Esguerra', 'Drafter', 'DRAFTING', 'SMM', 'zachary.esguerra@southeastmodular.com', '(352) 728-2930', '307', NULL, NULL),
  ('Daniel', 'Lemusmora', 'Quality Assurance Manager', 'QUALITY', 'SMM', 'daniel.lemusmora@southeastmodular.com', '(352) 728-2930', '302', NULL, '(352) 910-3963'),
  -- ========================================================================
  -- SSI - SPECIALIZED STRUCTURES (17 contacts)
  -- ========================================================================
  ('Glenn', 'Gardner', 'Plant General Manager', 'OPERATIONS', 'SSI', 'glenn.gardner@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 534-6111'),
  ('Peggy', 'Forest', 'Accounting Manager', 'ACCOUNTING', 'SSI', 'peggy.forest@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 310-0878'),
  ('Vaneza', 'Aguilar', 'Accounts Payable', 'ACCOUNTING', 'SSI', 'vaneza.aguilar@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Fatima', 'Corona', 'HR/Payroll Specialist', 'HR', 'SSI', 'fatima.corona@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Josh', 'Ellis', 'Sales Manager', 'SALES', 'SSI', 'josh.ellis@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 327-0256'),
  ('Derek', 'Little', 'Estimator', 'SALES', 'SSI', 'derek.little@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 309-8056'),
  ('Josh', 'Polk', 'Estimator', 'SALES', 'SSI', 'josh.polk@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 592-3882'),
  ('Grant', 'Gardner', 'Production Manager', 'PRODUCTION', 'SSI', 'grant.gardner@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 309-9603'),
  ('Charlie', 'Bennett', 'Purchasing Manager', 'PURCHASING', 'SSI', 'charlie.bennett@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 381-2063'),
  ('Kenneth', 'Haskins', 'Purchasing Assistant', 'PURCHASING', 'SSI', 'kenneth.haskins@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('William', 'Peacock', 'Material Control', 'PURCHASING', 'SSI', 'william.peacock@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Silvanna', 'Corona', 'Project Coordinator', 'OPERATIONS', 'SSI', 'silvanna.corona@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Tyler', 'Ellis', 'Drafter', 'DRAFTING', 'SSI', 'tyler.ellis@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Gavin', 'Grantham', 'Drafter', 'DRAFTING', 'SSI', 'gavin.grantham@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Kevin', 'Gillespie', 'Service Manager', 'SERVICE', 'SSI', 'kevin.gillespie@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Dudley', 'Vickers', 'Quality Control', 'QUALITY', 'SSI', 'dudley.vickers@specializedstructures.com', NULL, NULL, NULL, NULL),
  ('Jim', 'Harrell', 'Quality Control', 'QUALITY', 'SSI', 'jim.harrell@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  -- ========================================================================
  -- IBI - INDICOM (22 contacts)
  -- ========================================================================
  ('Beth', 'Berry', 'Plant General Manager', 'OPERATIONS', 'IBI', 'beth.berry@indicombuildings.com', '(817) 447-1213', '5814', NULL, '(817) 915-3844'),
  ('Patsy', 'Mejia', 'Accounting Supervisor', 'ACCOUNTING', 'IBI', 'patsy.mejia@indicombuildings.com', '(817) 447-1213', '5835', NULL, '(817) 357-9214'),
  ('Ashley', 'Fabela', 'HR/Payroll Assistant', 'HR', 'IBI', 'ashley.fabela@indicombuildings.com', '(817) 447-1213', '5802', NULL, NULL),
  ('Amy', 'Davila', 'Admin. Assistant/A/P', 'ACCOUNTING', 'IBI', 'amy.davila@indicombuildings.com', '(817) 447-1213', '5800', NULL, NULL),
  ('Levi', 'Porter', 'Sales Manager', 'SALES', 'IBI', 'levi.porter@indicombuildings.com', '(817) 447-1213', '5840', NULL, '(682) 347-8050'),
  ('Jose', 'Ramirez', 'Sales & Estimating', 'SALES', 'IBI', 'jose.ramirez@indicombuildings.com', '(817) 447-1213', '5847', NULL, '(817) 774-1181'),
  ('Alex', 'Fabela', 'Sales & Estimating', 'SALES', 'IBI', 'alex.fabela@indicombuildings.com', '(817) 447-1213', '5815', NULL, NULL),
  ('Tiffany', 'Stephens', 'Sales & Estimating', 'SALES', 'IBI', 'tiffany.stephens@indicombuildings.com', '(817) 447-1213', '5806', NULL, NULL),
  ('Frank', 'Saenz', 'Production Manager', 'PRODUCTION', 'IBI', 'frank.saenz@indicombuildings.com', '(817) 447-1213', '5842', NULL, NULL),
  ('Tichelle', 'Halford', 'Purchasing Manager', 'PURCHASING', 'IBI', 'tichelle.halford@indicombuildings.com', '(817) 447-1213', '5824', NULL, NULL),
  ('Andy', 'Love', 'Purchasing Agent', 'PURCHASING', 'IBI', 'andy.love@indicombuildings.com', '(817) 447-1213', '5821', NULL, NULL),
  ('Anne', 'Perez', 'Material Control', 'PURCHASING', 'IBI', 'anne.perez@indicombuildings.com', '(817) 447-1213', '5803', NULL, NULL),
  ('Lisa', 'Linn', 'Project Coordinator', 'OPERATIONS', 'IBI', 'lisa.linn@indicombuildings.com', '(817) 447-1213', '5813', NULL, NULL),
  ('Matthew', 'Scott', 'Engineering Manager', 'ENGINEERING', 'IBI', 'matthew.scott@indicombuildings.com', '(817) 447-1213', '5831', NULL, '(817) 774-1206'),
  ('David', 'Walker', 'Architectural Designer', 'DRAFTING', 'IBI', 'david.walker@indicombuildings.com', '(817) 447-1213', '5833', NULL, NULL),
  ('Randy', 'Walker', 'Design Drafter', 'DRAFTING', 'IBI', 'randy.walker@indicombuildings.com', NULL, NULL, NULL, '(608) 572-3867'),
  ('Eliud', 'Saenz', 'Design Drafter', 'DRAFTING', 'IBI', 'eliud.saenz@indicombuildings.com', '(817) 447-1213', '5804', NULL, NULL),
  ('Gabriel', 'Moreno', 'Design Drafter', 'DRAFTING', 'IBI', 'gabriel.moreno@indicombuildings.com', '(817) 447-1213', '5832', NULL, NULL),
  ('Erik', 'Fabela', 'Warranty/QC Manager', 'QUALITY', 'IBI', 'erik.fabela@indicombuildings.com', '(817) 447-1213', '5841', NULL, '(817) 691-7954'),
  ('Nataly', 'Chaidez', 'Safety Coordinator', 'SAFETY', 'IBI', 'nataly.chaidez@indicombuildings.com', '(817) 447-1213', '5808', NULL, NULL),
  ('Jay', 'Stratton', 'QC/Transportation Supervisor', 'SERVICE', 'IBI', 'jay.stratton@indicombuildings.com', '(817) 447-1213', '5822', NULL, NULL),
  ('Marvin', 'McGahan', 'Warranty Service', 'SERVICE', 'IBI', 'marvin.mcgahan@indicombuildings.com', NULL, NULL, NULL, '(682) 318-5599'),
  -- ========================================================================
  -- PRM - PROMOD (24 contacts)
  -- ========================================================================
  ('CJ', 'Yarbrough', 'Plant General Manager', 'OPERATIONS', 'PRM', 'cj.yarbrough@promodmfg.com', '(229) 937-5401', '104', NULL, '(229) 942-3495'),
  ('Tina', 'Powell', 'Accounting Manager', 'ACCOUNTING', 'PRM', 'tina.powell@promodmfg.com', '(229) 937-5401', '126', NULL, '(229) 575-8738'),
  ('Lisa', 'James', 'A/P/Receptionist', 'ACCOUNTING', 'PRM', 'lisa.james@promodmfg.com', '(229) 937-5401', '100', NULL, '(229) 938-0023'),
  ('Denise', 'Brown', 'HR/Payroll', 'HR', 'PRM', 'denise.brown@promodmfg.com', '(229) 937-5401', '118', NULL, '(229) 591-8818'),
  ('Dean', 'Long', 'Sales Manager', 'SALES', 'PRM', 'dean.long@promodmfg.com', '(229) 937-5401', '106', NULL, '(229) 314-9326'),
  ('Carmetrick', 'Ross', 'Sales & Estimation', 'SALES', 'PRM', 'carmetrick.ross@promodmfg.com', '(229) 937-5401', '103', NULL, '(229) 942-9688'),
  ('Josh', 'Mattson', 'Sales & Estimation', 'SALES', 'PRM', 'josh.mattson@promodmfg.com', '(229) 937-5401', '114', NULL, '(229) 575-8747'),
  ('Jarrett', 'Long', 'Sales & Estimation', 'SALES', 'PRM', 'jarrett.long@promodmfg.com', '(229) 937-5401', NULL, NULL, '(229) 938-2119'),
  ('Donald', 'Berry', 'Production Manager (ProMod)', 'PRODUCTION', 'PRM', 'duane.berry@promodmfg.com', '(229) 937-5401', '109', NULL, '(229) 942-1482'),
  ('Justin', 'Renfroe', 'Production Manager (ProBox)', 'PRODUCTION', 'PRM', 'justin.renfroe@promodmfg.com', '(229) 937-5401', '116', NULL, '(229) 942-4469'),
  ('Michael', 'Hernandez', 'Purchasing Manager', 'PURCHASING', 'PRM', 'michael.hernandez@promodmfg.com', '(229) 937-5401', '120', NULL, '(229) 314-5290'),
  ('Rufus', 'Yarbrough', 'Purchasing Agent', 'PURCHASING', 'PRM', 'rufus.yarbrough@promodmfg.com', '(229) 937-5401', '122', NULL, '(229) 314-1542'),
  ('Brooke', 'Albritton', 'Material Control', 'PURCHASING', 'PRM', 'brooke.albritton@promodmfg.com', '(229) 937-5401', NULL, NULL, '(229) 815-2929'),
  ('Toby', 'Sexton', 'Project Coordinator', 'OPERATIONS', 'PRM', 'toby.sexton@promodmfg.com', '(229) 937-5401', '110', NULL, '(478) 283-3581'),
  ('Matthew', 'Murphy', 'Drafting Manager', 'DRAFTING', 'PRM', 'matt.murphy@promodmfg.com', '(229) 937-5401', '117', NULL, '(229) 314-1837'),
  ('Jackson', 'Benjamin', 'Drafter', 'DRAFTING', 'PRM', 'jackson.benjamin@promodmfg.com', '(229) 937-5401', '112', NULL, '(229) 942-8353'),
  ('Marvin', 'Horne', 'Drafter', 'DRAFTING', 'PRM', 'marvin.horne@promodmfg.com', '(229) 937-5401', '131', NULL, '(229) 314-9975'),
  ('Pete', 'Yarbrough', 'Service Manager', 'SERVICE', 'PRM', 'pete.yarbrough@promodmfg.com', '(229) 937-5401', '119', NULL, '(352) 267-5431'),
  ('Steve', 'Cleghorn', 'Quality Control', 'QUALITY', 'PRM', 'steve.cleghorn@promodmfg.com', '(229) 937-5401', '102', NULL, '(205) 522-6757'),
  ('Matthew', 'Burns', 'Quality Control', 'QUALITY', 'PRM', 'matt.burns@promodmfg.com', '(229) 937-5401', '123', NULL, '(229) 938-4202'),
  ('Tyler', 'Lynn', 'Quality Control', 'QUALITY', 'PRM', 'tyler.lynn@promodmfg.com', '(229) 937-5401', '130', NULL, '(229) 314-1961'),
  ('Earl', 'Godwin', 'Quality Control', 'QUALITY', 'PRM', 'earl.godwin@promodmfg.com', '(229) 937-5401', NULL, NULL, '(229) 942-3665'),
  ('Donnie', 'Dew', 'Quality Control (ProBox)', 'QUALITY', 'PRM', 'donnie.dew@promodmfg.com', '(229) 937-5401', '128', NULL, '(229) 938-2524'),
  ('Chris', 'Schwarzer', 'Safety', 'SAFETY', 'PRM', 'chris.schwarzer@promodmfg.com', '(229) 937-5401', '124', NULL, '(229) 591-4330'),
  -- ========================================================================
  -- AMT - AMTEX (19 contacts)
  -- ========================================================================
  ('Noel', 'Lindsey', 'Plant General Manager', 'OPERATIONS', 'AMT', 'noel.lindsey@amtexcorp.com', '(972) 276-7626', '107', NULL, '(214) 450-0546'),
  ('Darian', 'Curry', 'Accounting Manager', 'ACCOUNTING', 'AMT', 'darian.curry@amtexcorp.com', '(972) 276-7626', '110', NULL, '(469) 724-0141'),
  ('Lucero', 'Martinez', 'Accounts Payable', 'ACCOUNTING', 'AMT', 'lucero.martinez@amtexcorp.com', '(972) 276-7626', '102', NULL, NULL),
  ('Michelle', 'Ponce', 'Administrative Assistant', 'OPERATIONS', 'AMT', 'michelle.ponce@amtexcorp.com', '(972) 276-7626', '100', NULL, NULL),
  ('Kelly', 'Kellie', 'Sales Manager', 'SALES', 'AMT', 'kelly.kellie@amtexcorp.com', '(972) 276-7626', '103', NULL, '(469) 416-9979'),
  ('Liz', 'Ramirez', 'Estimator', 'SALES', 'AMT', 'liz.ramirez@amtexcorp.com', '(972) 276-7626', '105', NULL, NULL),
  ('Dyonatan', 'Cysz', 'Estimator', 'SALES', 'AMT', 'dyonatan.cysz@amtexcorp.com', '(972) 276-7626', '112', NULL, NULL),
  ('Luis', 'Resendiz', 'Production Manager', 'PRODUCTION', 'AMT', 'luis.resendiz@amtexcorp.com', '(972) 276-7626', '117', NULL, '(214) 734-4582'),
  ('Humberto', 'Mendez', 'Production Supervisor', 'PRODUCTION', 'AMT', 'humberto.mendez@amtexcorp.com', '(972) 276-7626', '109', NULL, '(214) 551-9754'),
  ('Tommy', 'Garcia', 'Purchasing Manager', 'PURCHASING', 'AMT', 'tommy.garcia@amtexcorp.com', '(972) 276-7626', '115', NULL, '(469) 690-5288'),
  ('David', 'Flores', 'Purchasing Assistant', 'PURCHASING', 'AMT', 'david.flores@amtexcorp.com', '(972) 276-7626', '104', NULL, '(972) 768-0062'),
  ('Walter', 'Portillo', 'Material Control Supervisor', 'PURCHASING', 'AMT', 'walter.portillo@amtexcorp.com', '(972) 276-7626', '104', NULL, NULL),
  ('Alexander', 'Fontenarosa', 'Project Coordinator', 'OPERATIONS', 'AMT', 'alex.fontenarosa@amtexcorp.com', '(972) 276-7626', '113', NULL, NULL),
  ('Edward', 'Vrzalik', 'Drafting Manager', 'DRAFTING', 'AMT', 'edward.vrzalik@amtexcorp.com', '(972) 276-7626', '108', NULL, NULL),
  ('Rochelle', 'Da Costa', 'Drafter', 'DRAFTING', 'AMT', 'rochelle.costa@amtexcorp.com', '(972) 276-7626', '108', NULL, NULL),
  ('Roy', 'Thompson', 'Quality Assurance Manager', 'QUALITY', 'AMT', 'roy.thompson@amtexcorp.com', '(972) 276-7626', '106', NULL, '(214) 551-1936'),
  ('John', 'Mellet', 'Safety Coordinator', 'SAFETY', 'AMT', 'john.mellett@amtexcorp.com', '(972) 276-7626', NULL, NULL, '(214) 930-0127'),
  ('Jose', 'Contreras', 'AMP Coordinator', 'PRODUCTION', 'AMT', 'jose.contreras@amtexcorp.com', '(972) 276-7626', NULL, NULL, '(972) 955-0371'),
  ('Gabriel', 'Sanchez', 'Weld Shop Manager', 'PRODUCTION', 'AMT', 'gabriel.sanchez@amtexcorp.com', NULL, NULL, NULL, '(214) 551-0964'),
  -- ========================================================================
  -- BUSA - BRITCO USA (17 contacts)
  -- ========================================================================
  ('Jeremy', 'Jensen', 'Plant General Manager', 'OPERATIONS', 'BUSA', 'jeremy.jensen@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 633-7766'),
  ('Steve', 'Hall', 'Accounting Manager', 'ACCOUNTING', 'BUSA', 'steve.hall@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 744-5948'),
  ('Marily', 'Hernandez', 'Accounts Payable; HR/Payroll Specialist', 'ACCOUNTING', 'BUSA', 'marily.palacios@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 495-3492'),
  ('Eduardo', 'Tabora', 'Estimating Manager/Sales', 'SALES', 'BUSA', 'edward.tabora@britcousa.com', '(254) 741-6701', NULL, NULL, '(832) 876-2047'),
  ('Craven', 'Powers', 'Estimator', 'SALES', 'BUSA', 'craven.powers@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 231-9077'),
  ('William', 'Luna', 'Estimator', 'SALES', 'BUSA', 'william.luna@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 878-4708'),
  ('Ricardo', 'Montalvo', 'Production Manager', 'PRODUCTION', 'BUSA', 'ricardo.montalvo@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 722-1517'),
  ('Kimberly', 'Webb', 'Purchasing Manager', 'PURCHASING', 'BUSA', 'kimberly.webb@britcousa.com', '(254) 741-6701', NULL, NULL, '(817) 706-3149'),
  ('Heriberto', 'Montalvo', 'Purchasing Assistant', 'PURCHASING', 'BUSA', 'eddie.montalvo@britcousa.com', '(254) 741-6701', NULL, NULL, '(936) 676-0718'),
  ('Terry', 'Davis', 'Material Control/Receiving', 'PURCHASING', 'BUSA', 'terry.davis@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 716-6020'),
  ('Jaime', 'Moreno', 'Project Coordinator', 'OPERATIONS', 'BUSA', 'jaime.moreno@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 230-7441'),
  ('Scott', 'Rees', 'Engineering/Contracts Manager', 'ENGINEERING', 'BUSA', 'scott.rees@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 315-4073'),
  ('Mark', 'Jackson', 'Drafter', 'DRAFTING', 'BUSA', 'mark.jackson@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 447-2496'),
  ('Javier', 'Rodriguez', 'Drafter', 'DRAFTING', 'BUSA', 'javier.rodriguez@britcousa.com', '(254) 741-6701', NULL, NULL, '(956) 563-7444'),
  ('Angel', 'Diaz', 'Quality Control/Service Manager', 'QUALITY', 'BUSA', 'angel.diaz@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 313-8350'),
  ('Juan', 'Ontiveros', 'Quality Control', 'QUALITY', 'BUSA', 'juan.ontiveros@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 313-8359'),
  ('Patty', 'Mosley', 'Safety Coordinator', 'SAFETY', 'BUSA', 'patty.mosley@britcousa.com', '(254) 741-6701', NULL, NULL, '(903) 467-6898'),
  -- ========================================================================
  -- C&B - C&B CUSTOM MODULAR (11 contacts)
  -- ========================================================================
  ('Chris', 'Chadwick', 'Plant General Manager', 'OPERATIONS', 'C&B', 'chris.chadwick@candbmod.com', '(574) 848-7300', '127', NULL, '(574) 596-4468'),
  ('Pam', 'Chadwick', 'Accounting Manager', 'ACCOUNTING', 'C&B', 'pam.chadwick@candbmod.com', '(574) 848-7300', '112', NULL, '(574) 596-5505'),
  ('Candace', 'Kafka', 'Human Resources/Safety', 'HR', 'C&B', 'candace.kafka@candbmod.com', '(574) 848-7300', '124', NULL, NULL),
  ('Lewis', 'Chadwick', 'Sales Manager', 'SALES', 'C&B', 'lewis.chadwick@candbmod.com', '(574) 848-7300', '106', NULL, NULL),
  ('Shannon', 'Robinson', 'Sales', 'SALES', 'C&B', 'shannon.robinson@candbmod.com', '(574) 848-7300', '113', NULL, NULL),
  ('Shawn', 'Collins', 'Purchasing Manager', 'PURCHASING', 'C&B', 'shawn.collins@candbmod.com', '(574) 848-7300', '128', NULL, NULL),
  ('Dawn', 'Hout', 'Purchasing', 'PURCHASING', 'C&B', 'dawn.hout@candbmod.com', '(574) 848-7300', '130', NULL, NULL),
  ('Steve', 'Reynolds', 'Project Coordinator', 'OPERATIONS', 'C&B', 'steve.reynolds@candbmod.com', '(574) 848-7300', '108', NULL, NULL),
  ('Becky', 'Bradbury', 'Drafting Manager', 'DRAFTING', 'C&B', 'becky.bradbury@candbmod.com', '(574) 848-7300', '104', NULL, NULL),
  ('Guy', 'Vaughn', 'Drafter', 'DRAFTING', 'C&B', 'guy.vaughn@candbmod.com', '(574) 848-7300', '107', NULL, NULL),
  ('Brandon', 'Kafka', 'Safety/QC/Dispatch', 'QUALITY', 'C&B', 'brandon.kafka@candbmod.com', '(574) 848-7300', NULL, NULL, NULL),
  -- ========================================================================
  -- MRS - MR STEEL (10 contacts)
  -- ========================================================================
  ('Dan', 'King', 'Plant General Manager', 'OPERATIONS', 'MRS', 'dan.king@mrsteel.com', '(602) 278-3355', '105', NULL, '(602) 327-4772'),
  ('Nick', 'Tran', 'Accounting Manager', 'ACCOUNTING', 'MRS', 'nick.tran@mrsteel.com', '(602) 278-3355', '111', NULL, '(602) 762-0501'),
  ('Dawn', 'Vollmer', 'Administrative Assistant', 'OPERATIONS', 'MRS', 'dawn.vollmer@mrsteel.com', '(602) 278-3355', '100', NULL, NULL),
  ('Juan', 'Figueroa', 'Sales Manager', 'SALES', 'MRS', 'juan.figueroa@mrsteel.com', '(602) 278-3355', '101', NULL, '(602) 677-3964'),
  ('Dylan', 'King', 'Sales Coordinator', 'SALES', 'MRS', 'dylan.king@mrsteel.com', '(602) 278-3355', '112', NULL, '(602) 291-0665'),
  ('Gary', 'Allen', 'Production Manager', 'PRODUCTION', 'MRS', 'gary.allen@mrsteel.com', '(602) 278-3355', '107', NULL, '(602) 214-5983'),
  ('Tim', 'Woods', 'Foreman', 'PRODUCTION', 'MRS', 'tim.woods@mrsteel.com', '(602) 278-3355', '106', NULL, '(602) 762-4629'),
  ('LaQuana', 'Allen', 'Purchasing Assistant', 'PURCHASING', 'MRS', 'laquana.yazzie@mrsteel.com', '(602) 278-3355', '114', NULL, '(928) 920-5564'),
  ('Willie', 'Shackleford', 'Estimating/Purchasing/Machine Shop Manager', 'SALES', 'MRS', 'willie.shackleford@mrsteel.com', '(602) 278-3355', '103', NULL, '(602) 370-5921'),
  ('Robert', 'Elizondo', 'Safety Coordinator', 'SAFETY', 'MRS', 'robert.elizondo@mrsteel.com', '(602) 278-3355', '110', NULL, NULL),
  -- ========================================================================
  -- WM-EAST - WHITLEY MANUFACTURING EAST (18 contacts)
  -- ========================================================================
  ('Joe', 'Dattoli', 'Plant General Manager', 'OPERATIONS', 'WM-EAST', 'joedattoli@whitleyman.com', '(717) 656-2081', '470', NULL, '(717) 826-1711'),
  ('Don', 'Engle', '(assisting new GM)', 'OPERATIONS', 'WM-EAST', 'donengle@whitleyman.com', '(717) 656-2081', NULL, NULL, '(717) 587-5252'),
  ('Tracy', 'Lagaza', 'Office Manager, QA Admin.', 'QUALITY', 'WM-EAST', 'tracylagaza@whitleyman.com', '(717) 656-2081', '400', NULL, '(717) 669-8422'),
  ('Kristin', 'Garber', 'HR', 'HR', 'WM-EAST', 'kristingarber@whitleyman.com', '(717) 656-2081', '430', NULL, '(610) 679-4548'),
  ('Christine', 'Kline', 'Sales/Estimating', 'SALES', 'WM-EAST', 'christinekline@whitleyman.com', '(717) 656-2081', '450', NULL, '(610) 223-0507'),
  ('Steve', 'Adams', 'Supervisor (plant 1)', 'PRODUCTION', 'WM-EAST', 'eastsupv@whitleyman.com', '(717) 656-2081', '481', NULL, '(717) 606-6753'),
  ('Mike', 'Greiner', 'Supervisor (plant 1)', 'PRODUCTION', 'WM-EAST', 'eastsupv@whitleyman.com', '(717) 656-2081', '481', NULL, '(717) 472-5150'),
  ('Sammy', 'Reyes-Ramos', 'Supervisor (plant 2)', 'PRODUCTION', 'WM-EAST', 'sammyramos@whitleyman.com', '(717) 656-2081', '487', NULL, '(717) 826-1528'),
  ('Ethan', 'Paul', 'Engineering/Design/IT', 'ENGINEERING', 'WM-EAST', 'ethanpaul@whitleyman.com', '(717) 656-2081', '440', NULL, '(570) 415-5358'),
  ('Blaine', 'Brillhart', 'Drafter', 'DRAFTING', 'WM-EAST', 'blainebrillhart@whitleyman.com', '(717) 656-2081', '441', NULL, '(717) 804-9100'),
  ('JC', 'Redmond', 'Project Manager', 'OPERATIONS', 'WM-EAST', 'jcredmond@whitleyman.com', '(717) 656-2081', '460', NULL, '(717) 875-3732'),
  ('Craig', 'Smith', 'Purchaser Manager', 'PURCHASING', 'WM-EAST', 'craigsmith@whitleyman.com', '(717) 656-2081', '421', NULL, '(717) 572-4596'),
  ('Robert', 'Frankfort', 'Purchaser', 'PURCHASING', 'WM-EAST', 'robertfrankfort@whitleyman.com', '(717) 656-2081', '420', NULL, '(223) 797-0202'),
  ('Bill', 'Stover', 'Receiving Manager', 'PURCHASING', 'WM-EAST', 'eastreceiving@whitleyman.com', '(717) 656-2081', '422', NULL, '(717) 209-1795'),
  ('Randy', 'Gibson', 'Maintenance Manager', 'SERVICE', 'WM-EAST', 'eastmaintenance@whitleyman.com', '(717) 656-2081', '482', NULL, '(717) 947-0316'),
  ('Kevin', 'Stauffer', 'QA Manager', 'QUALITY', 'WM-EAST', 'eastqa2@whitleyman.com', '(717) 656-2081', '412', NULL, '(610) 585-2881'),
  ('Dylan', 'Loper', 'Operations Manager', 'OPERATIONS', 'WM-EAST', 'dylanloper@whitleyman.com', '(717) 656-2081', '410', NULL, '(717) 881-2728'),
  ('Jose', 'Nogueras', 'Operations Manager', 'OPERATIONS', 'WM-EAST', 'josenogueras@whitleyman.com', '(717) 656-2081', '480', NULL, '(717) 327-7785'),
  -- ========================================================================
  -- WM-EVERGREEN - WHITLEY MANUFACTURING EVERGREEN (10 contacts)
  -- ========================================================================
  ('Randy', 'Maddox', 'Plant General Manager', 'OPERATIONS', 'WM-EVERGREEN', 'randymaddox@whitleyman.com', '(360) 653-5790', '23', NULL, NULL),
  ('Kali', 'Partridge', 'HR/Admin', 'HR', 'WM-EVERGREEN', 'kalipartridge@whitleyman.com', '(360) 653-5790', '10', NULL, NULL),
  ('Hank', 'Kennedy', 'Estimating', 'SALES', 'WM-EVERGREEN', 'hankkennedy@whitleyman.com', '(360) 653-5790', '18', NULL, NULL),
  ('Clint', 'Williams', 'Production Manager', 'PRODUCTION', 'WM-EVERGREEN', 'clintwilliams@whitleyman.com', '(360) 653-5790', '26', NULL, NULL),
  ('Walt', 'Hylback', 'Purchasing Manager', 'PURCHASING', 'WM-EVERGREEN', 'walthylback@whitleyman.com', '(360) 653-5790', '24', NULL, NULL),
  ('Alysha', 'Lantz', 'Accts Receivable/Purchasing', 'PURCHASING', 'WM-EVERGREEN', 'alyshalantz@whitleyman.com', '(360) 653-5790', '21', NULL, NULL),
  ('Mike', 'Perry', 'Design Manager', 'DRAFTING', 'WM-EVERGREEN', 'mikeperry@whitleyman.com', '(360) 653-5790', '22', NULL, NULL),
  ('Tina', 'Bach', 'Drafting Assistant', 'DRAFTING', 'WM-EVERGREEN', 'tinabach@whitleyman.com', '(360) 653-5790', '14', NULL, NULL),
  ('Nicole', 'Gruendl', 'Assistant Project Manager', 'OPERATIONS', 'WM-EVERGREEN', 'nicolegruendl@whitleyman.com', '(360) 653-5790', '19', NULL, NULL),
  ('Mike', 'Soley', 'QA/QC Manager', 'QUALITY', 'WM-EVERGREEN', 'mikesoley@whitleyman.com', '(360) 653-5790', '26', NULL, NULL),
  -- ========================================================================
  -- WM-SOUTH - WHITLEY MANUFACTURING SOUTH WHITLEY (26 contacts)
  -- ========================================================================
  ('Simon', 'Dragan', 'CEO', 'EXECUTIVE', 'WM-SOUTH', 'simondragan@whitleyman.com', '(260) 723-5131', '218', NULL, '(260) 450-0264'),
  ('Drew', 'Welborn', 'President', 'EXECUTIVE', 'WM-SOUTH', 'drewwelborn@whitleyman.com', '(260) 723-5131', '204', NULL, '(260) 450-5904'),
  ('Jeff', 'Zukowski', 'Continuous Improvement', 'OPERATIONS', 'WM-SOUTH', 'jeffzukowski@whitleyman.com', '(260) 723-5131', '221', NULL, '(331) 444-9513'),
  ('Bob', 'Jones', 'VP Finance', 'EXECUTIVE', 'WM-SOUTH', 'bobjones@whitleyman.com', '(260) 723-5131', '219', NULL, '(260) 750-2948'),
  ('Laurie', 'England', 'HR/Payroll', 'HR', 'WM-SOUTH', 'laurieengland@whitleyman.com', '(260) 723-5131', '203', NULL, '(260) 377-8292'),
  ('Stacey', 'Blain', 'Accounts Payable', 'ACCOUNTING', 'WM-SOUTH', 'staceyblain@whitleyman.com', '(260) 723-5131', '208', NULL, '(260) 213-9910'),
  ('Anne', 'Scarano', 'Receptionist/Accounts Payable', 'ACCOUNTING', 'WM-SOUTH', 'annescarano@whitleyman.com', '(260) 723-5131', '200', NULL, '(217) 779-8956'),
  ('William', 'Mann', 'VP Vertical Marketing', 'EXECUTIVE', 'WM-SOUTH', 'willmann@whitleyman.com', '(260) 723-5131', NULL, NULL, '(704) 719-0509'),
  ('Dan', 'Lipinski', 'Estimator', 'SALES', 'WM-SOUTH', 'danlipinski@whitleyman.com', '(260) 723-5131', '212', NULL, '(260) 409-9614'),
  ('Larry', 'High', 'Estimator', 'SALES', 'WM-SOUTH', 'larryhigh@whitleyman.com', '(260) 723-5131', '213', NULL, '(260) 602-0504'),
  ('Garett', 'Simmons', 'Estimator Project Mgr', 'SALES', 'WM-SOUTH', 'garettsimmons@whitleyman.com', '(260) 723-5131', '228', NULL, '(260) 229-6131'),
  ('Dan', 'Schuhler', 'Project Mgr/Estimator', 'SALES', 'WM-SOUTH', 'danschuhler@whitleyman.com', '(260) 723-5131', '283', NULL, '(260) 413-8950'),
  ('Don', 'Harlan', 'Plant Manager', 'OPERATIONS', 'WM-SOUTH', 'donharlan@whitleyman.com', '(260) 723-5131', '222', NULL, '(574) 527-0371'),
  ('Kevin', 'Henning', 'Supervisor A & B', 'PRODUCTION', 'WM-SOUTH', 'kevinhenning@whitleyman.com', '(260) 723-5131', '262', NULL, '(260) 312-1171'),
  ('Bryce', 'Bender', 'Supervisor C', 'PRODUCTION', 'WM-SOUTH', 'brycebender@whitleyman.com', '(260) 723-5131', '230', NULL, '(260) 530-6728'),
  ('Gage', 'Benson', 'Purchasing', 'PURCHASING', 'WM-SOUTH', 'gagebenson@whitleyman.com', '(260) 723-5131', '209', NULL, '(260) 409-5471'),
  ('Tim', 'Kelsey', 'Purchasing', 'PURCHASING', 'WM-SOUTH', 'timkelsey@whitleyman.com', '(260) 723-5131', '202', NULL, '(574) 930-6150'),
  ('Elena', 'Harris', 'QC/Purchasing', 'PURCHASING', 'WM-SOUTH', 'elenaharris@whitleyman.com', '(260) 723-5131', '227', NULL, '(260) 418-3262'),
  ('Adam', 'Parker', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'adamparker@whitleyman.com', '(260) 723-5131', '229', NULL, '(260) 503-1481'),
  ('Richard', 'Harlan', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'richardharlan@whitleyman.com', '(260) 723-5131', '225', NULL, '(260) 568-3214'),
  ('Anthony', 'Hedglen', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'anthonyhedglen@whitleyman.com', '(260) 723-5131', '281', NULL, '(574) 350-9096'),
  ('Rebecca', 'Martin', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'rebeccamartin@whitleyman.com', '(260) 723-5131', '282', NULL, '(260) 273-6132'),
  ('Kalah', 'Siler', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'kalahsiler@whitleyman.com', '(260) 723-5131', '224', NULL, '(360) 708-8667'),
  ('Taylor', 'Tullis', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'taylortullis@whitleyman.com', '(260) 723-5131', NULL, NULL, '(513) 293-0541'),
  ('Crystal', 'Lee', 'Systems Coordinator', 'IT', 'WM-SOUTH', 'crystallee@whitleyman.com', '(260) 723-5131', '210', NULL, '(518) 419-8276'),
  ('Joshua', 'Rhodes', 'QC', 'QUALITY', 'WM-SOUTH', 'joshuarhodes@whitleyman.com', '(260) 723-5131', NULL, NULL, '(574) 248-9602'),
  -- ========================================================================
  -- WM-ROCHESTER - WHITLEY MANUFACTURING ROCHESTER (11 contacts)
  -- ========================================================================
  ('Kole', 'Kroft', 'Plant General Manager', 'OPERATIONS', 'WM-ROCHESTER', 'kolekroft@whitleyman.com', '(574) 223-4934', '109', NULL, '(219) 863-3733'),
  ('Kerry', 'Nelson', 'HR/Recruiting', 'HR', 'WM-ROCHESTER', 'kerrynelson@whitleyman.com', '(574) 223-4934', '106', NULL, '(574) 835-0602'),
  ('Beth', 'Balser', 'Receptionist/Admin.Asst.', 'OPERATIONS', 'WM-ROCHESTER', 'bethbalser@whitleyman.com', '(574) 223-4934', '101', NULL, '(574) 847-1352'),
  ('Rob', 'Farris', 'Production Manager P1', 'PRODUCTION', 'WM-ROCHESTER', 'robfarris@whitleyman.com', '(574) 223-4934', '108', NULL, '(574) 201-8691'),
  ('Jose', 'Jimenez', 'Production Manager P2', 'PRODUCTION', 'WM-ROCHESTER', 'josejimenez@whitleyman.com', '(574) 223-4934', '111', NULL, '(630) 915-0858'),
  ('Linda', 'Martin', 'Purchasing Manager', 'PURCHASING', 'WM-ROCHESTER', 'lindamartin@whitleyman.com', '(574) 223-4934', '128', NULL, '(574) 721-2592'),
  ('Ruth', 'Music', 'Purchasing Agent', 'PURCHASING', 'WM-ROCHESTER', 'ruthmusic@whitleyman.com', '(574) 223-4934', '105', NULL, '(260) 227-2295'),
  ('Lisa', 'Weissert', 'Systems Coordinator', 'IT', 'WM-ROCHESTER', 'lisaweissert@whitleyman.com', '(574) 223-4934', '107', NULL, '(574) 707-5844'),
  ('Benjamin', 'Wilson', 'Draftsman', 'DRAFTING', 'WM-ROCHESTER', 'benjaminwilson@whitleyman.com', '(574) 223-4934', '110', NULL, '(912) 492-8425'),
  ('Whitney', 'Farris', 'Quality Control Manager', 'QUALITY', 'WM-ROCHESTER', 'whitneyfarris@whitleyman.com', '(574) 223-4934', '102', NULL, '(574) 230-3891'),
  ('Vince', 'Mettler', 'Quality Control P2', 'QUALITY', 'WM-ROCHESTER', 'mbi.qc.plant2@whitleyman.com', '(574) 223-4934', '113', NULL, '(765) 469-2240')
ON CONFLICT DO NOTHING;

-- Full directory: 311 contacts across all 15 factories

SELECT 'Step 9 complete: Directory contacts imported (311 total)' AS status;

-- ############################################################################
-- STEP 10: SCHEMA FIXES FOR FRONTEND COMPATIBILITY
-- ############################################################################
-- Add columns that the React frontend expects

-- Add factory_id to users (for foreign key joins)
ALTER TABLE users ADD COLUMN IF NOT EXISTS factory_id UUID REFERENCES factories(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update factory_id based on existing factory code
UPDATE users u
SET factory_id = f.id
FROM factories f
WHERE u.factory = f.code
  AND u.factory_id IS NULL;

-- Set all users to active
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Add is_active to directory_contacts
ALTER TABLE directory_contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
UPDATE directory_contacts SET is_active = true WHERE is_active IS NULL;

SELECT 'Step 10 complete: Schema fixes applied' AS status;

-- ############################################################################
-- FINAL VERIFICATION
-- ############################################################################
SELECT '============================================' AS divider;
SELECT 'MASTER DEMO DATA SCRIPT COMPLETE' AS status;
SELECT '============================================' AS divider;

SELECT 'Summary:' AS info;
SELECT 'Factories:' AS data_type, COUNT(*) AS count FROM factories;
SELECT 'Departments:' AS data_type, COUNT(*) AS count FROM departments;
SELECT 'Workflow Stations:' AS data_type, COUNT(*) AS count FROM workflow_stations;
SELECT 'Projects:' AS data_type, COUNT(*) AS count FROM projects;
SELECT 'Tasks:' AS data_type, COUNT(*) AS count FROM tasks;
SELECT 'RFIs:' AS data_type, COUNT(*) AS count FROM rfis;
SELECT 'Submittals:' AS data_type, COUNT(*) AS count FROM submittals;
SELECT 'Milestones:' AS data_type, COUNT(*) AS count FROM milestones;
SELECT 'Change Orders:' AS data_type, COUNT(*) AS count FROM change_orders;
SELECT 'Long Lead Items:' AS data_type, COUNT(*) AS count FROM long_lead_items;
SELECT 'Color Selections:' AS data_type, COUNT(*) AS count FROM color_selections;
SELECT 'Sales Customers:' AS data_type, COUNT(*) AS count FROM sales_customers;
SELECT 'Sales Quotes:' AS data_type, COUNT(*) AS count FROM sales_quotes;
SELECT 'Directory Contacts:' AS data_type, COUNT(*) AS count FROM directory_contacts;

SELECT '============================================' AS divider;
SELECT 'All demo data has been successfully loaded!' AS status;
SELECT '============================================' AS divider;
