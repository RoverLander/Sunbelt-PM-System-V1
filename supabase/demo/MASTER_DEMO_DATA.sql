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

-- Mitch stays at NWBS (no change needed, but ensure it's set)
UPDATE users
SET factory = 'NWBS'
WHERE email ILIKE '%mitch%' AND role IN ('Sales_Manager', 'Sales');

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
    INSERT INTO long_lead_items (project_id, item_name, description, manufacturer, model_number, supplier, lead_time_weeks, order_date, expected_delivery, actual_delivery, status, notes, created_at)
    VALUES
      (v_project.id, 'HVAC Package Unit', 'Rooftop package unit for HVAC system', 'Carrier', '50XC-024', 'Ferguson', 8,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '30 days' ELSE NULL END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '86 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '82 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN 'Delivered' WHEN v_phase >= 3 THEN 'In Transit' WHEN v_phase >= 2 THEN 'Ordered' ELSE 'Pending' END,
       CASE WHEN v_phase >= 2 THEN 'Cutsheet approved' ELSE NULL END, NOW()),
      (v_project.id, 'Custom Windows', 'Aluminum frame windows per spec (Qty: 12)', 'Milgard', 'Style Line 3000', 'Milgard Direct', 6,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '35 days' ELSE NULL END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '77 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN v_start_date + INTERVAL '75 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 THEN 'Delivered' WHEN v_phase >= 3 THEN 'In Transit' WHEN v_phase >= 2 THEN 'Ordered' ELSE 'Pending' END,
       NULL, NOW()),
      (v_project.id, 'Backup Generator', 'Emergency backup power system', 'Generac', 'RG02724ANAX', 'Power Systems Inc', 10,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '45 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '115 days' ELSE NULL END,
       CASE WHEN v_phase >= 4 AND v_project.status = 'Complete' THEN v_start_date + INTERVAL '110 days' ELSE NULL END,
       CASE WHEN v_project.status = 'Complete' THEN 'Delivered' WHEN v_phase >= 4 THEN 'In Transit' WHEN v_phase >= 3 THEN 'Ordered' ELSE 'Pending' END,
       CASE WHEN v_phase >= 3 THEN 'AHJ requires specific model' ELSE NULL END, NOW()),
      (v_project.id, 'Fire Suppression System', 'Pre-engineered fire suppression', 'Victaulic', 'Vortex 500', 'Fire Safety Supply', 4,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '40 days' ELSE NULL END,
       CASE WHEN v_phase >= 2 THEN v_start_date + INTERVAL '68 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN v_start_date + INTERVAL '65 days' ELSE NULL END,
       CASE WHEN v_phase >= 3 THEN 'Delivered' WHEN v_phase >= 2 THEN 'Ordered' ELSE 'Pending' END,
       NULL, NOW());

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

-- Fix complete project (NWBS-25250 Hanford AMPS)
UPDATE project_workflow_status
SET status = 'completed',
    started_date = (SELECT start_date FROM projects WHERE project_number = 'NWBS-25250'),
    completed_date = (SELECT target_online_date FROM projects WHERE project_number = 'NWBS-25250'),
    updated_at = NOW()
WHERE project_id = (SELECT id FROM projects WHERE project_number = 'NWBS-25250');

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

ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_quotes_all" ON sales_quotes;
CREATE POLICY "sales_quotes_all" ON sales_quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sales_quotes_customer ON sales_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_assigned ON sales_quotes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_dealer ON sales_quotes(dealer_id);

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
  v_sales_rep1_id UUID;
  v_sales_rep2_id UUID;
  v_customer_id UUID;
  v_project_id UUID;
BEGIN
  -- Find sales users
  SELECT id INTO v_mitch_id FROM users WHERE email ILIKE '%mitch%' OR name ILIKE '%mitch%' LIMIT 1;
  SELECT id INTO v_sales_rep1_id FROM users WHERE role IN ('Sales', 'Sales_Manager') AND id != COALESCE(v_mitch_id, '00000000-0000-0000-0000-000000000000') LIMIT 1;
  SELECT id INTO v_sales_rep2_id FROM users WHERE role IN ('Sales', 'Sales_Manager') AND id NOT IN (COALESCE(v_mitch_id, '00000000-0000-0000-0000-000000000000'), COALESCE(v_sales_rep1_id, '00000000-0000-0000-0000-000000000000')) LIMIT 1;

  -- Fallback to any user
  IF v_mitch_id IS NULL THEN
    SELECT id INTO v_mitch_id FROM users LIMIT 1;
  END IF;
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
  -- ========================================================================
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'SPECIALIZED TESTING & CONSTRUCTION';
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'PMI-6781';
  INSERT INTO sales_quotes (quote_number, customer_id, project_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, created_at)
  VALUES ('Q-2025-001', v_customer_id, v_project_id, 'converted', 1850000.00, 2, 3500, 7000, v_sales_rep1_id, v_sales_rep1_id, true, 'Florence AZ Medical - 2 story medical facility', CURRENT_DATE + INTERVAL '90 days', NOW() - INTERVAL '60 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'MODULAR MANAGEMENT GROUP';
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'SMM-21003';
  INSERT INTO sales_quotes (quote_number, customer_id, project_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, created_at)
  VALUES ('Q-2024-042', v_customer_id, v_project_id, 'converted', 1650000.00, 1, 5760, 5760, v_sales_rep1_id, v_sales_rep1_id, true, 'Disney Conference Building - 160MPH wind rating', CURRENT_DATE - INTERVAL '30 days', NOW() - INTERVAL '180 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'KITCHENS TO GO';
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'SMM-21054';
  INSERT INTO sales_quotes (quote_number, customer_id, project_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, created_at)
  VALUES ('Q-2025-008', v_customer_id, v_project_id, 'converted', 195000.00, 1, 672, 672, v_mitch_id, v_mitch_id, true, 'VA-WASH Module for Google Summerville', CURRENT_DATE + INTERVAL '30 days', NOW() - INTERVAL '90 days')
  ON CONFLICT (quote_number) DO NOTHING;

  -- ========================================================================
  -- CREATE ACTIVE PIPELINE QUOTES
  -- ========================================================================
  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'DOVER INDUSTRIES';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, pm_flagged, pm_flagged_at, notes, valid_until, created_at)
  VALUES ('Q-2026-001', v_customer_id, 'pending', 2400000.00, 4, 2500, 10000, v_sales_rep1_id, v_sales_rep1_id, true, true, NOW() - INTERVAL '2 days', 'New office complex - 4 buildings', CURRENT_DATE + INTERVAL '45 days', NOW() - INTERVAL '5 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'UNITED RENTALS';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, created_at)
  VALUES ('Q-2026-002', v_customer_id, 'sent', 850000.00, 2, 1800, 3600, v_sales_rep2_id, v_sales_rep2_id, true, 'Equipment storage and office combo', CURRENT_DATE + INTERVAL '30 days', NOW() - INTERVAL '10 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'GOOGLE FACILITIES';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, pm_flagged, pm_flagged_at, notes, valid_until, created_at)
  VALUES ('Q-2026-003', v_customer_id, 'negotiating', 4200000.00, 6, 3000, 18000, v_mitch_id, v_mitch_id, true, true, NOW() - INTERVAL '1 day', 'Data center support buildings - Mountain View', CURRENT_DATE + INTERVAL '60 days', NOW() - INTERVAL '15 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'US SPACE FORCE';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, created_at)
  VALUES ('Q-2026-004', v_customer_id, 'draft', 5800000.00, 8, 2800, 22400, v_sales_rep1_id, v_sales_rep1_id, true, 'Command center expansion - Cape Canaveral', CURRENT_DATE + INTERVAL '90 days', NOW() - INTERVAL '3 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'UNITED RENTALS';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, created_at)
  VALUES ('Q-2025-089', v_customer_id, 'lost', 1200000.00, 3, 1500, 4500, v_sales_rep2_id, v_sales_rep2_id, true, 'Lost to competitor - price difference', CURRENT_DATE - INTERVAL '30 days', NOW() - INTERVAL '45 days')
  ON CONFLICT (quote_number) DO NOTHING;

  SELECT id INTO v_customer_id FROM sales_customers WHERE company_name = 'PACIFIC MOBILE STRUCTURES';
  INSERT INTO sales_quotes (quote_number, customer_id, status, total_price, unit_count, square_footage, total_square_footage, assigned_to, created_by, is_latest_version, notes, valid_until, created_at)
  VALUES ('Q-2026-005', v_customer_id, 'pending', 1800000.00, 4, 2000, 8000, v_mitch_id, v_mitch_id, true, 'Healthcare facility expansion - Seattle market', CURRENT_DATE + INTERVAL '45 days', NOW() - INTERVAL '7 days')
  ON CONFLICT (quote_number) DO NOTHING;

  RAISE NOTICE 'Sales data created successfully';

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

INSERT INTO directory_contacts (first_name, last_name, position, department_code, factory_code, email, phone_main, phone_extension, phone_direct, phone_cell)
VALUES
  -- SNB - SUNBELT CORPORATE (sample - full list would be 311 contacts)
  ('Ron', 'Procunier', 'Chief Executive Officer (CEO)', 'EXECUTIVE', 'SNB', NULL, '(602) 447-6460', NULL, NULL, NULL),
  ('Bob', 'Lahmann', 'Chief Financial Officer (CFO)', 'EXECUTIVE', 'SNB', 'bob.lahmann@sunbeltmodular.com', NULL, NULL, NULL, '(410) 300-7926'),
  ('Gary', 'Davenport', 'Chief Revenue Office (CRO)', 'EXECUTIVE', 'SNB', 'gary.davenport@sunbeltmodular.com', NULL, NULL, NULL, '(704) 619-3665'),
  ('Mitch', 'Marois', 'Director of FP&A', 'ACCOUNTING', 'SNB', 'mitch.marois@sunbeltmodular.com', '(602) 447-6460', '138', NULL, '(602) 579-3316'),
  ('Wendy', 'Li', 'Corporate Controller', 'ACCOUNTING', 'SNB', 'wendy.li@sunbeltmodular.com', '(602) 447-6460', '303', NULL, '(602) 910-8008'),
  ('Ibet', 'Murillo', 'Vice President of HR & Integration', 'EXECUTIVE', 'SNB', 'ibet.murillo@sunbeltmodular.com', '(602) 447-6460', '112', NULL, '(602) 466-8456'),
  ('Toni', 'Jacoby', 'Director of Marketing', 'MARKETING', 'SNB', 'toni.jacoby@sunbeltmodular.com', NULL, NULL, NULL, '(602) 768-9265'),
  ('Frank', 'Monahan', 'Vice President of Business Development', 'EXECUTIVE', 'SNB', 'frank.monahan@sunbeltmodular.com', NULL, NULL, NULL, '(602) 793-4869'),
  ('Jay', 'Daniels', 'Vice President of Operations', 'EXECUTIVE', 'SNB', 'jay.daniels@sunbeltmodular.com', '(602) 447-6460', '129', NULL, '(602) 327-4768'),
  ('Candace', 'Juhnke', 'Project Manager', 'OPERATIONS', 'SNB', 'candy.juhnke@sunbeltmodular.com', NULL, NULL, NULL, '(602) 803-7224'),
  ('Crystal', 'Myers', 'Project Manager', 'OPERATIONS', 'SNB', 'crystal.myers@sunbeltmodular.com', NULL, NULL, NULL, NULL),
  ('Michael', 'Caracciolo', 'Project Manager', 'OPERATIONS', 'SNB', 'michael.caracciolo@sunbeltmodular.com', NULL, NULL, NULL, '(480) 848-1076'),
  ('Matthew', 'McDaniel', 'Project Manager', 'OPERATIONS', 'SNB', 'matthew.mcdaniel@sunbeltmodular.com', NULL, NULL, NULL, '(480) 848-4715'),
  ('Hector', 'Vazquez', 'Project Manager', 'OPERATIONS', 'SNB', 'hector.vazquez@sunbeltmodular.com', NULL, NULL, NULL, '(254) 500-4038'),
  ('Joy', 'Thomas', 'Lead Programmer', 'IT', 'SNB', 'joy.thomas@sunbeltmodular.com', NULL, NULL, NULL, '(480) 688-8899'),
  ('David', 'Sousa', 'IT Manager - West', 'IT', 'SNB', 'david.sousa@sunbeltmodular.com', '(602) 447-6460', '139', NULL, '(602) 478-1531'),
  ('Devin', 'Duvak', 'Vice President of Manufacturing', 'EXECUTIVE', 'SNB', 'devin.duvak@sunbeltmodular.com', '(817) 447-1213', '5801', NULL, '(817) 559-3737'),
  ('Shaylon', 'Vaughn', 'Director of Engineering', 'ENGINEERING', 'SNB', 'shaylon.vaughn@sunbeltmodular.com', NULL, NULL, NULL, '(623) 202-3528'),
  ('Michael', 'Schneider', 'Director of Drafting', 'DRAFTING', 'SNB', 'michael.schneider@sunbeltmodular.com', '(602) 447-6460', '115', NULL, '(214) 435-6267'),
  ('Frank', 'Delucia', 'Director of Purchasing', 'PURCHASING', 'SNB', 'frank.delucia@sunbeltmodular.com', '(602) 447-6460', '103', NULL, '(602) 582-4368'),
  -- NWBS - NORTHWEST BUILDING SYSTEMS
  ('Ross', 'Parks', 'Plant General Manager', 'OPERATIONS', 'NWBS', 'ross.parks@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7008', '(208) 866-3615'),
  ('Mitch', 'Quintana', 'Sales Manager', 'SALES', 'NWBS', 'mitch.quintana@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7005', '(208) 860-2582'),
  -- PMI - PHOENIX MODULAR
  ('Monty', 'King', 'Plant General Manager', 'OPERATIONS', 'PMI', 'monty.king@phoenixmodular.com', '(602) 447-6460', '116', NULL, '(602) 327-4771'),
  ('Brian', 'Shackleford', 'Sales Manager', 'SALES', 'PMI', 'brian.shackleford@phoenixmodular.com', '(602) 447-6460', '105', NULL, '(602) 397-5474'),
  ('Juanita', 'Earnest', 'Project Coordinator Supervisor', 'OPERATIONS', 'PMI', 'juanita.earnest@phoenixmodular.com', '(602) 447-6460', '121', NULL, NULL),
  -- SMM - SOUTHEAST MODULAR
  ('Joe', 'Reid', 'Plant General Manager', 'OPERATIONS', 'SMM', 'joe.reid@southeastmodular.com', '(352) 728-2930', '301', NULL, '(214) 336-8582'),
  ('Don', 'Eisman', 'Sales Manager', 'SALES', 'SMM', 'don.eisman@southeastmodular.com', '(352) 728-2930', '326', NULL, '(574) 333-7089'),
  -- SSI - SPECIALIZED STRUCTURES
  ('Glenn', 'Gardner', 'Plant General Manager', 'OPERATIONS', 'SSI', 'glenn.gardner@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 534-6111'),
  ('Josh', 'Ellis', 'Sales Manager', 'SALES', 'SSI', 'josh.ellis@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 327-0256'),
  -- IBI - INDICOM
  ('Beth', 'Berry', 'Plant General Manager', 'OPERATIONS', 'IBI', 'beth.berry@indicombuildings.com', '(817) 447-1213', '5814', NULL, '(817) 915-3844'),
  -- PRM - PROMOD
  ('CJ', 'Yarbrough', 'Plant General Manager', 'OPERATIONS', 'PRM', 'cj.yarbrough@promodmfg.com', '(229) 937-5401', '104', NULL, '(229) 942-3495')
ON CONFLICT DO NOTHING;

SELECT 'Step 9 complete: Directory contacts imported' AS status;

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
