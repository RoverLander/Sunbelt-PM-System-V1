-- ============================================================================
-- MASTER DEMO DATA V2
-- ============================================================================
-- Complete demo data script for Sunbelt PM System
-- Replaces the old MASTER_DEMO_DATA.sql with clean, compatible data
--
-- FEATURES:
-- - 12 demo users (PM, PC, Plant_GM, Sales, Director, VP)
-- - 16 projects (4 PM + 12 PC)
-- - 63 modules distributed across 12 production stations
-- - 60 workers with 8 leads
-- - 20 sales quotes
-- - Tasks, RFIs, Submittals per project
-- - Workflow status initialization
-- - Dynamic dates (relative to CURRENT_DATE)
--
-- DEPENDENCIES:
-- - Must run AFTER: 20260115_plant_manager_system.sql (creates PGM tables)
-- - Factories table must exist
-- - Workflow stations must exist
--
-- Created: January 15, 2026
-- ============================================================================

-- ############################################################################
-- STEP 0: SAFE TRUNCATE FUNCTION
-- ############################################################################

CREATE OR REPLACE FUNCTION safe_truncate(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not truncate %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

SELECT 'Step 0 complete: safe_truncate function created' AS status;

-- ############################################################################
-- STEP 1: CLEAR EXISTING DATA (preserves users, factories, departments)
-- ############################################################################

-- Clear PGM tables first (depend on modules)
SELECT safe_truncate('station_assignments');
SELECT safe_truncate('worker_shifts');
SELECT safe_truncate('qc_holds');
SELECT safe_truncate('module_notes');
SELECT safe_truncate('long_lead_items');

-- Clear project-related data
SELECT safe_truncate('project_workflow_status');
SELECT safe_truncate('modules');
SELECT safe_truncate('color_selections');
SELECT safe_truncate('cutsheet_submittals');
SELECT safe_truncate('drawing_versions');
SELECT safe_truncate('submittals');
SELECT safe_truncate('rfis');
SELECT safe_truncate('tasks');
SELECT safe_truncate('change_orders');
SELECT safe_truncate('milestones');

-- Clear sales data
SELECT safe_truncate('sales_quotes');
SELECT safe_truncate('sales_customers');

-- Clear projects last
SELECT safe_truncate('projects');

-- Clear workers (but not users)
SELECT safe_truncate('workers');

SELECT 'Step 1 complete: Data cleared' AS status;

-- ############################################################################
-- STEP 2: ENSURE FACTORIES EXIST
-- ############################################################################

-- Factories table schema uses: code, short_name, full_name, display_value, city, state, region
INSERT INTO factories (code, short_name, full_name, display_value, city, state, region, address_line1, zip_code, is_active)
VALUES
  ('NWBS', 'Northwest Building', 'Northwest Building Systems', 'NWBS - Northwest Building Systems', 'Boise', 'ID', 'Northwest', '1234 Industrial Way', '83702', true),
  ('PMI', 'Phoenix Modular', 'Phoenix Modular Industries', 'PMI - Phoenix Modular Industries', 'Phoenix', 'AZ', 'Southwest', '5678 Manufacturing Blvd', '85001', true),
  ('SSI', 'Sunbelt Idaho', 'Sunbelt Systems Idaho', 'SSI - Sunbelt Systems Idaho', 'Twin Falls', 'ID', 'Northwest', '9012 Factory Lane', '83301', true),
  ('SMM', 'Sunbelt Mobile', 'Sunbelt Mobile Manufacturing', 'SMM - Sunbelt Mobile Manufacturing', 'Salt Lake City', 'UT', 'West', '3456 Production Dr', '84101', true),
  ('SME', 'Sunbelt East', 'Sunbelt Modular East', 'SME - Sunbelt Modular East', 'Denver', 'CO', 'East', '7890 Industrial Park', '80201', true)
ON CONFLICT (code) DO UPDATE SET
  short_name = EXCLUDED.short_name,
  full_name = EXCLUDED.full_name,
  display_value = EXCLUDED.display_value,
  is_active = EXCLUDED.is_active;

SELECT 'Step 2 complete: Factories created/updated' AS status;

-- ############################################################################
-- STEP 3: UPDATE/CREATE USERS
-- ############################################################################

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_pmi_factory_id UUID;
BEGIN
  -- Get factory IDs
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';
  SELECT id INTO v_pmi_factory_id FROM factories WHERE code = 'PMI';

  -- UPSERT users - existing users keep their IDs

  -- Ross Parks - Plant_GM
  INSERT INTO users (id, email, name, role, factory, factory_id, created_at, updated_at)
  VALUES (
    'fcd8501a-fdbb-43d1-83c2-fcf049bb0c90',
    'ross.parks@nwbsinc.com',
    'Ross Parks',
    'Plant_GM',
    'NWBS',
    v_nwbs_factory_id,
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'Plant_GM',
    factory = 'NWBS',
    factory_id = v_nwbs_factory_id,
    updated_at = NOW();

  -- Dawn Hinkle - PC (Project Coordinator)
  INSERT INTO users (id, email, name, role, factory, factory_id, created_at, updated_at)
  VALUES (
    '679a1d92-7ea6-4797-a4c9-d13d156c215f',
    'dawn.hinkle@nwbsinc.com',
    'Dawn Hinkle',
    'PC',
    'NWBS',
    v_nwbs_factory_id,
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'PC',
    factory = 'NWBS',
    factory_id = v_nwbs_factory_id,
    updated_at = NOW();

  -- Justin Downing - Production_Manager
  INSERT INTO users (id, email, name, role, factory, factory_id, created_at, updated_at)
  VALUES (
    'bbed0851-f894-401a-9312-0ada815c7785',
    'justin.downing@nwbsinc.com',
    'Justin Downing',
    'Production_Manager',
    'NWBS',
    v_nwbs_factory_id,
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'Production_Manager',
    factory = 'NWBS',
    factory_id = v_nwbs_factory_id,
    updated_at = NOW();

  RAISE NOTICE 'Created/updated Plant_GM, PC, and Production_Manager users';

  -- Update existing users to ensure factory_id is set
  UPDATE users SET factory_id = v_nwbs_factory_id WHERE factory = 'NWBS' AND factory_id IS NULL;
  UPDATE users SET factory_id = v_pmi_factory_id WHERE factory = 'PMI' AND factory_id IS NULL;

END $$;

SELECT 'Step 3 complete: Users created/updated' AS status;

-- ############################################################################
-- STEP 4: ENSURE DEPARTMENTS EXIST
-- ############################################################################

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments_read_all" ON departments;
CREATE POLICY "departments_read_all" ON departments FOR SELECT TO authenticated USING (true);

INSERT INTO departments (code, name, description, sort_order) VALUES
  ('EXECUTIVE', 'Executive', 'CEO, CFO, CRO, VP, President', 1),
  ('ACCOUNTING', 'Accounting', 'Controller, Accounting Manager, AP, Staff Accountant', 2),
  ('HR', 'Human Resources', 'HR Manager, Payroll, Benefits', 3),
  ('MARKETING', 'Marketing', 'Marketing Director, Coordinator', 4),
  ('SALES', 'Sales', 'Sales Manager, Estimator, Business Development', 5),
  ('OPERATIONS', 'Operations', 'VP Operations, Plant General Manager, Project Manager', 6),
  ('PRODUCTION', 'Production', 'Production Manager, Supervisor, Foreman', 7),
  ('PURCHASING', 'Purchasing', 'Purchasing Manager, Purchasing Agent, Material Control', 8),
  ('ENGINEERING', 'Engineering', 'Engineer, Director of Engineering', 9),
  ('DRAFTING', 'Drafting', 'Drafting Manager, Drafter, Designer', 10),
  ('QUALITY', 'Quality', 'QA Manager, QC Inspector', 11),
  ('SAFETY', 'Safety', 'Safety Coordinator, Safety Manager', 12),
  ('IT', 'Information Technology', 'IT Manager, Programmer, Network Admin', 13),
  ('SERVICE', 'Service & Warranty', 'Service Manager, Service Technician', 14)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

SELECT 'Step 4 complete: Departments created' AS status;

-- ############################################################################
-- STEP 5: ENSURE WORKFLOW STATIONS EXIST (20 stations, 4 phases)
-- ############################################################################

-- Note: These are WORKFLOW stations for project phases, NOT production stations
-- Schema uses: station_key, name, description, phase, display_order, default_owner, is_required, is_active
INSERT INTO workflow_stations (station_key, name, description, phase, display_order, default_owner, is_required, is_active) VALUES
  -- PHASE 1: INITIATION (2 stations)
  ('sales_handoff', 'Sales Handoff', 'Transfer from Sales to PM team', 1, 1, 'pm', true, true),
  ('kickoff', 'Kickoff Meeting', 'Initial project kickoff', 1, 2, 'pm', true, true),

  -- PHASE 2: DEALER SIGN-OFFS (7 stations)
  ('drawings_20', '20% Drawings', 'Preliminary design drawings', 2, 1, 'drafting', true, true),
  ('drawings_65', '65% Drawings', 'Development drawings', 2, 2, 'drafting', true, true),
  ('drawings_100', '100% Drawings', 'Final construction documents', 2, 3, 'drafting', true, true),
  ('color_selections', 'Color Selections', 'Dealer color and finish selections', 2, 4, 'dealer', true, true),
  ('long_lead_items', 'Long Lead Items', 'Equipment with extended lead times', 2, 5, 'procurement', true, true),
  ('cutsheets', 'Cutsheet Submittals', 'Equipment cutsheet approvals', 2, 6, 'dealer', true, true),
  ('dealer_approval', 'Dealer Final Approval', 'Dealer signs off on all submittals', 2, 7, 'dealer', false, true),

  -- PHASE 3: INTERNAL APPROVALS (6 stations)
  ('engineering', 'Engineering Review', 'Structural and systems review', 3, 1, 'engineering', true, true),
  ('third_party', 'Third Party Review', 'External plan review', 3, 2, 'engineering', false, true),
  ('state_approval', 'State Approval', 'State agency approvals', 3, 3, 'pm', false, true),
  ('permits', 'Building Permits', 'Local permit applications', 3, 4, 'pm', true, true),
  ('change_orders', 'Change Orders', 'Process all change orders', 3, 5, 'pm', false, true),
  ('production_release', 'Production Release', 'Release to production queue', 3, 6, 'pm', true, true),

  -- PHASE 4: DELIVERY (5 stations)
  ('production', 'Production', 'Module fabrication', 4, 1, 'production', true, true),
  ('qc_inspection', 'QC Inspection', 'Quality control review', 4, 2, 'quality', true, true),
  ('staging', 'Staging', 'Prepared for transport', 4, 3, 'production', true, true),
  ('delivery', 'Delivery', 'Transport to site', 4, 4, 'pm', true, true),
  ('closeout', 'Project Closeout', 'Final documentation', 4, 5, 'pm', true, true)
ON CONFLICT (station_key) DO UPDATE SET
  name = EXCLUDED.name,
  phase = EXCLUDED.phase,
  display_order = EXCLUDED.display_order,
  is_active = true;

SELECT 'Step 5 complete: Workflow stations created (20 stations)' AS status;

-- ############################################################################
-- STEP 5B: ENSURE PROJECT_WORKFLOW_STATUS TABLE EXISTS
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

ALTER TABLE project_workflow_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_workflow_status_all" ON project_workflow_status;
CREATE POLICY "project_workflow_status_all" ON project_workflow_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

SELECT 'Step 5B complete: project_workflow_status table ensured' AS status;

-- ############################################################################
-- STEP 6: CREATE PLANT CONFIG FOR NWBS
-- ############################################################################

-- Schema uses JSONB columns: time_settings, efficiency_modules, line_sim_defaults, vp_settings, calendar_settings
INSERT INTO plant_config (factory_id, time_settings, efficiency_modules)
SELECT
  id,
  '{"shift_start": "06:00", "shift_end": "14:30", "break_minutes": 30, "lunch_minutes": 30, "ot_threshold_daily": 8, "ot_threshold_weekly": 40, "double_time_threshold": 12}'::jsonb,
  '{"takt_time_tracker": true, "queue_time_monitor": true, "kaizen_board": false, "defect_fix_timer": false, "material_flow_trace": false, "crew_utilization_heatmap": false, "line_balancing_sim": false, "visual_load_board": true, "five_s_audit": false, "oee_calculator": false, "cross_training_matrix": false, "safety_micro_check": false}'::jsonb
FROM factories WHERE code = 'NWBS'
ON CONFLICT (factory_id) DO UPDATE SET
  time_settings = EXCLUDED.time_settings,
  efficiency_modules = EXCLUDED.efficiency_modules;

SELECT 'Step 6 complete: Plant config created for NWBS' AS status;

-- ############################################################################
-- STEP 7: CREATE PROJECTS
-- ############################################################################

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_matt_id UUID;
  v_dawn_id UUID;
  v_candy_id UUID;
  v_mitch_id UUID;
  v_project_id UUID;
BEGIN
  -- Get factory ID
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Get user IDs (use email to find them reliably)
  -- Try multiple patterns for Matthew (PM user)
  SELECT id INTO v_matt_id FROM users
  WHERE LOWER(email) LIKE '%matt%' OR LOWER(name) LIKE '%matt%'
  ORDER BY CASE WHEN role = 'PM' THEN 0 ELSE 1 END
  LIMIT 1;

  SELECT id INTO v_dawn_id FROM users WHERE email = 'dawn.hinkle@nwbsinc.com' LIMIT 1;
  SELECT id INTO v_candy_id FROM users WHERE LOWER(email) LIKE '%candy%' LIMIT 1;
  SELECT id INTO v_mitch_id FROM users WHERE LOWER(email) LIKE '%mitch%' LIMIT 1;

  -- Fallback: if Matt not found, get first PM user (not PC)
  IF v_matt_id IS NULL THEN
    SELECT id INTO v_matt_id FROM users WHERE role = 'PM' LIMIT 1;
  END IF;

  -- Still not found? Try any user with PM-like role
  IF v_matt_id IS NULL THEN
    SELECT id INTO v_matt_id FROM users WHERE role IN ('PM', 'Director', 'VP') LIMIT 1;
  END IF;

  -- Fallback: if Dawn not found, use first PC
  IF v_dawn_id IS NULL THEN
    SELECT id INTO v_dawn_id FROM users WHERE role = 'PC' LIMIT 1;
  END IF;

  -- Log what we found
  RAISE NOTICE 'Found Matt ID: % (for PM projects)', v_matt_id;
  RAISE NOTICE 'Found Dawn ID: % (for PC projects)', v_dawn_id;

  -- ========================================================================
  -- MATTHEW'S PM PROJECTS (4 projects, 27 modules)
  -- ========================================================================

  -- Project 1: Boise School District Admin (8 modules, Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-001', 'Boise School District Admin', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'GOVERNMENT', 'In Progress', 'On Track', 3, 1850000.00,
    v_matt_id, v_matt_id, 8,
    CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE - INTERVAL '90 days', NOW()
  );

  -- Project 2: Idaho State University Labs (6 modules, Phase 2, At Risk)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-002', 'Idaho State University Labs', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'GOVERNMENT', 'In Progress', 'At Risk', 2, 1450000.00,
    v_matt_id, v_matt_id, 6,
    CURRENT_DATE + INTERVAL '90 days', CURRENT_DATE - INTERVAL '60 days', NOW()
  );

  -- Project 3: Boeing Everett Support (8 modules, Phase 4)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-003', 'Boeing Everett Support', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'CUSTOM', 'In Progress', 'On Track', 4, 2100000.00,
    v_matt_id, v_matt_id, 8,
    CURRENT_DATE + INTERVAL '21 days', CURRENT_DATE - INTERVAL '150 days', NOW()
  );

  -- Project 4: Microsoft Redmond Campus (5 modules, Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-004', 'Microsoft Redmond Campus', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'CUSTOM', 'In Progress', 'On Track', 2, 2100000.00,
    v_matt_id, v_matt_id, 5,
    CURRENT_DATE + INTERVAL '120 days', CURRENT_DATE - INTERVAL '30 days', NOW()
  );

  RAISE NOTICE 'Created 4 PM projects for Matthew';

  -- ========================================================================
  -- DAWN'S PC PROJECTS (12 projects, 36 modules)
  -- ========================================================================

  -- PC Project 1: United Rentals Fleet Order 1 (3 modules, Phase 4)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S01', 'United Rentals Fleet Order 1', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 4, 285000.00,
    v_dawn_id, v_dawn_id, 3,
    CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE - INTERVAL '60 days', NOW()
  );

  -- PC Project 2: United Rentals Fleet Order 2 (3 modules, Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S02', 'United Rentals Fleet Order 2', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 3, 285000.00,
    v_dawn_id, v_dawn_id, 3,
    CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE - INTERVAL '45 days', NOW()
  );

  -- PC Project 3: ModSpace Standard 24x60 (3 modules, Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S03', 'ModSpace Standard 24x60', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 3, 320000.00,
    v_dawn_id, v_dawn_id, 3,
    CURRENT_DATE + INTERVAL '35 days', CURRENT_DATE - INTERVAL '40 days', NOW()
  );

  -- PC Project 4: Pacific Mobile Standard (3 modules, Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S04', 'Pacific Mobile Standard', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 2, 295000.00,
    v_dawn_id, v_dawn_id, 3,
    CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE - INTERVAL '20 days', NOW()
  );

  -- PC Project 5: ATCO Site Office (2 modules, Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S05', 'ATCO Site Office', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 2, 180000.00,
    v_dawn_id, v_dawn_id, 2,
    CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE - INTERVAL '15 days', NOW()
  );

  -- PC Project 6: Williams Scotsman Classroom (4 modules, Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S06', 'Williams Scotsman Classroom', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 3, 380000.00,
    v_dawn_id, v_dawn_id, 4,
    CURRENT_DATE + INTERVAL '28 days', CURRENT_DATE - INTERVAL '50 days', NOW()
  );

  -- PC Project 7: Target Distribution Temp (3 modules, Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S07', 'Target Distribution Temp', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'At Risk', 2, 310000.00,
    v_dawn_id, v_dawn_id, 3,
    CURRENT_DATE + INTERVAL '50 days', CURRENT_DATE - INTERVAL '25 days', NOW()
  );

  -- PC Project 8: Amazon Warehouse Office (3 modules, Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S08', 'Amazon Warehouse Office', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 3, 295000.00,
    v_dawn_id, v_dawn_id, 3,
    CURRENT_DATE + INTERVAL '35 days', CURRENT_DATE - INTERVAL '35 days', NOW()
  );

  -- PC Project 9: Costco Break Room (2 modules, Phase 4)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S09', 'Costco Break Room', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 4, 195000.00,
    v_dawn_id, v_dawn_id, 2,
    CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE - INTERVAL '70 days', NOW()
  );

  -- PC Project 10: Starbucks Training (3 modules, Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S10', 'Starbucks Training', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 2, 275000.00,
    v_dawn_id, v_dawn_id, 3,
    CURRENT_DATE + INTERVAL '55 days', CURRENT_DATE - INTERVAL '18 days', NOW()
  );

  -- PC Project 11: Home Depot Site Office (2 modules, Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S11', 'Home Depot Site Office', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 3, 185000.00,
    v_dawn_id, v_dawn_id, 2,
    CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE - INTERVAL '42 days', NOW()
  );

  -- PC Project 12: Lowes District Office (3 modules, Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, module_count,
    target_online_date, start_date, created_at
  ) VALUES (
    'NWBS-26-S12', 'Lowes District Office', 'NWBS - Northwest Building Systems', v_nwbs_factory_id,
    'STOCK', 'In Progress', 'On Track', 2, 290000.00,
    v_dawn_id, v_dawn_id, 3,
    CURRENT_DATE + INTERVAL '65 days', CURRENT_DATE - INTERVAL '12 days', NOW()
  );

  RAISE NOTICE 'Created 12 PC projects for Dawn';

END $$;

SELECT 'Step 7 complete: 16 projects created (4 PM + 12 PC)' AS status;

-- ############################################################################
-- STEP 8: CREATE WORKERS (60 at NWBS)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_frame_station_id UUID;
  v_walls_station_id UUID;
  v_insulation_station_id UUID;
  v_roof_station_id UUID;
  v_siding_station_id UUID;
  v_paint_station_id UUID;
  v_mep_station_id UUID;
  v_finish_station_id UUID;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Get station IDs (global templates have factory_id IS NULL)
  SELECT id INTO v_frame_station_id FROM station_templates WHERE code = 'FRAME' AND factory_id IS NULL;
  SELECT id INTO v_walls_station_id FROM station_templates WHERE code = 'WALLS' AND factory_id IS NULL;
  SELECT id INTO v_insulation_station_id FROM station_templates WHERE code = 'INSULATION' AND factory_id IS NULL;
  SELECT id INTO v_roof_station_id FROM station_templates WHERE code = 'ROOF' AND factory_id IS NULL;
  SELECT id INTO v_siding_station_id FROM station_templates WHERE code = 'SIDING' AND factory_id IS NULL;
  SELECT id INTO v_paint_station_id FROM station_templates WHERE code = 'PAINT' AND factory_id IS NULL;
  SELECT id INTO v_mep_station_id FROM station_templates WHERE code = 'MEP_ROUGHIN' AND factory_id IS NULL;
  SELECT id INTO v_finish_station_id FROM station_templates WHERE code = 'FINISH' AND factory_id IS NULL;

  -- Fallback to order_num if codes don't match
  IF v_frame_station_id IS NULL THEN
    SELECT id INTO v_frame_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 1;
  END IF;
  IF v_walls_station_id IS NULL THEN
    SELECT id INTO v_walls_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 3;
  END IF;
  IF v_mep_station_id IS NULL THEN
    SELECT id INTO v_mep_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 9;
  END IF;
  IF v_finish_station_id IS NULL THEN
    SELECT id INTO v_finish_station_id FROM station_templates WHERE factory_id IS NULL AND order_num = 11;
  END IF;

  -- ========================================================================
  -- 8 LEAD WORKERS
  -- ========================================================================

  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_nwbs_factory_id, 'NWBS-L001', 'Marcus', 'Johnson', 'Frame Lead', v_frame_station_id, true, 32.50, true, '2020-03-15'),
    (v_nwbs_factory_id, 'NWBS-L002', 'Tony', 'Martinez', 'Framing Lead', v_walls_station_id, true, 31.00, true, '2019-08-22'),
    (v_nwbs_factory_id, 'NWBS-L003', 'Robert', 'Chen', 'Insulation Lead', v_insulation_station_id, true, 29.50, true, '2021-01-10'),
    (v_nwbs_factory_id, 'NWBS-L004', 'James', 'Wilson', 'Roof Lead', v_roof_station_id, true, 30.00, true, '2020-06-05'),
    (v_nwbs_factory_id, 'NWBS-L005', 'David', 'Thompson', 'Exterior Lead', v_siding_station_id, true, 30.50, true, '2019-11-18'),
    (v_nwbs_factory_id, 'NWBS-L006', 'Carlos', 'Garcia', 'Paint Lead', v_paint_station_id, true, 28.50, true, '2021-04-12'),
    (v_nwbs_factory_id, 'NWBS-L007', 'Michael', 'Brown', 'MEP Lead', v_mep_station_id, true, 33.00, true, '2018-09-30'),
    (v_nwbs_factory_id, 'NWBS-L008', 'Kevin', 'Davis', 'Finish Lead', v_finish_station_id, true, 31.50, true, '2020-02-28');

  RAISE NOTICE 'Created 8 lead workers';

  -- ========================================================================
  -- 52 GENERAL CREW WORKERS
  -- ========================================================================

  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    -- Frame crew (6 workers)
    (v_nwbs_factory_id, 'NWBS-001', 'Alex', 'Rivera', 'Frame Welder', v_frame_station_id, false, 26.00, true, '2022-03-10'),
    (v_nwbs_factory_id, 'NWBS-002', 'Brian', 'Nguyen', 'Frame Helper', v_frame_station_id, false, 22.00, true, '2023-01-15'),
    (v_nwbs_factory_id, 'NWBS-003', 'Chris', 'Adams', 'Frame Welder', v_frame_station_id, false, 25.50, true, '2022-06-20'),
    (v_nwbs_factory_id, 'NWBS-004', 'Derek', 'Bell', 'Deck Builder', v_frame_station_id, false, 24.00, true, '2022-09-05'),
    (v_nwbs_factory_id, 'NWBS-005', 'Eric', 'Clark', 'Frame Helper', v_frame_station_id, false, 21.50, true, '2023-04-18'),
    (v_nwbs_factory_id, 'NWBS-006', 'Frank', 'Dean', 'Frame Welder', v_frame_station_id, false, 26.50, true, '2021-11-02'),

    -- Walls crew (7 workers)
    (v_nwbs_factory_id, 'NWBS-007', 'Gary', 'Evans', 'Wall Framer', v_walls_station_id, false, 25.00, true, '2022-02-14'),
    (v_nwbs_factory_id, 'NWBS-008', 'Henry', 'Foster', 'Wall Framer', v_walls_station_id, false, 24.50, true, '2022-05-08'),
    (v_nwbs_factory_id, 'NWBS-009', 'Ivan', 'Green', 'Carpenter', v_walls_station_id, false, 26.00, true, '2021-08-25'),
    (v_nwbs_factory_id, 'NWBS-010', 'Jack', 'Harris', 'Carpenter', v_walls_station_id, false, 25.50, true, '2022-01-30'),
    (v_nwbs_factory_id, 'NWBS-011', 'Kyle', 'Irwin', 'Wall Helper', v_walls_station_id, false, 21.00, true, '2023-06-12'),
    (v_nwbs_factory_id, 'NWBS-012', 'Leo', 'Jones', 'Wall Framer', v_walls_station_id, false, 24.00, true, '2022-10-18'),
    (v_nwbs_factory_id, 'NWBS-013', 'Mike', 'King', 'Carpenter', v_walls_station_id, false, 25.00, true, '2022-04-22'),

    -- Insulation crew (5 workers)
    (v_nwbs_factory_id, 'NWBS-014', 'Nick', 'Lopez', 'Insulation Tech', v_insulation_station_id, false, 23.50, true, '2022-07-14'),
    (v_nwbs_factory_id, 'NWBS-015', 'Oscar', 'Miller', 'Insulation Tech', v_insulation_station_id, false, 23.00, true, '2022-11-28'),
    (v_nwbs_factory_id, 'NWBS-016', 'Paul', 'Nelson', 'Insulation Helper', v_insulation_station_id, false, 20.50, true, '2023-03-05'),
    (v_nwbs_factory_id, 'NWBS-017', 'Quinn', 'Ortiz', 'Insulation Tech', v_insulation_station_id, false, 24.00, true, '2022-08-10'),
    (v_nwbs_factory_id, 'NWBS-018', 'Ray', 'Perez', 'Insulation Helper', v_insulation_station_id, false, 21.00, true, '2023-05-22'),

    -- Roof crew (5 workers)
    (v_nwbs_factory_id, 'NWBS-019', 'Sam', 'Quinn', 'Roofer', v_roof_station_id, false, 25.50, true, '2022-03-28'),
    (v_nwbs_factory_id, 'NWBS-020', 'Tom', 'Reed', 'Roofer', v_roof_station_id, false, 25.00, true, '2022-06-15'),
    (v_nwbs_factory_id, 'NWBS-021', 'Ulysses', 'Scott', 'Roof Helper', v_roof_station_id, false, 21.50, true, '2023-02-08'),
    (v_nwbs_factory_id, 'NWBS-022', 'Victor', 'Torres', 'Roofer', v_roof_station_id, false, 24.50, true, '2022-09-20'),
    (v_nwbs_factory_id, 'NWBS-023', 'William', 'Upton', 'Roof Helper', v_roof_station_id, false, 20.00, true, '2023-07-03'),

    -- Exterior crew (6 workers)
    (v_nwbs_factory_id, 'NWBS-024', 'Xavier', 'Valdez', 'Siding Installer', v_siding_station_id, false, 24.00, true, '2022-04-12'),
    (v_nwbs_factory_id, 'NWBS-025', 'Yuri', 'White', 'Siding Installer', v_siding_station_id, false, 23.50, true, '2022-08-05'),
    (v_nwbs_factory_id, 'NWBS-026', 'Zack', 'Young', 'Exterior Helper', v_siding_station_id, false, 20.50, true, '2023-01-22'),
    (v_nwbs_factory_id, 'NWBS-027', 'Adam', 'Zimmerman', 'Sheathing Tech', v_siding_station_id, false, 24.50, true, '2022-05-30'),
    (v_nwbs_factory_id, 'NWBS-028', 'Ben', 'Allen', 'Siding Installer', v_siding_station_id, false, 24.00, true, '2022-10-08'),
    (v_nwbs_factory_id, 'NWBS-029', 'Carl', 'Baker', 'Exterior Helper', v_siding_station_id, false, 21.00, true, '2023-04-05'),

    -- Paint crew (6 workers)
    (v_nwbs_factory_id, 'NWBS-030', 'Dan', 'Carter', 'Painter', v_paint_station_id, false, 24.00, true, '2022-02-18'),
    (v_nwbs_factory_id, 'NWBS-031', 'Ed', 'Dixon', 'Painter', v_paint_station_id, false, 23.50, true, '2022-07-22'),
    (v_nwbs_factory_id, 'NWBS-032', 'Fred', 'Ellis', 'Paint Helper', v_paint_station_id, false, 20.00, true, '2023-03-15'),
    (v_nwbs_factory_id, 'NWBS-033', 'Greg', 'Flynn', 'Painter', v_paint_station_id, false, 24.50, true, '2022-06-02'),
    (v_nwbs_factory_id, 'NWBS-034', 'Hank', 'Gibson', 'Paint Helper', v_paint_station_id, false, 19.50, true, '2023-06-28'),
    (v_nwbs_factory_id, 'NWBS-035', 'Ian', 'Hall', 'Painter', v_paint_station_id, false, 23.00, true, '2022-11-10'),

    -- MEP crew (8 workers)
    (v_nwbs_factory_id, 'NWBS-036', 'Jeff', 'Ingram', 'Electrician', v_mep_station_id, false, 28.00, true, '2021-09-15'),
    (v_nwbs_factory_id, 'NWBS-037', 'Kurt', 'James', 'Electrician', v_mep_station_id, false, 27.50, true, '2022-01-08'),
    (v_nwbs_factory_id, 'NWBS-038', 'Larry', 'Kelly', 'Plumber', v_mep_station_id, false, 27.00, true, '2021-11-22'),
    (v_nwbs_factory_id, 'NWBS-039', 'Mark', 'Lewis', 'Plumber', v_mep_station_id, false, 26.50, true, '2022-04-05'),
    (v_nwbs_factory_id, 'NWBS-040', 'Neil', 'Moore', 'HVAC Tech', v_mep_station_id, false, 28.50, true, '2021-07-18'),
    (v_nwbs_factory_id, 'NWBS-041', 'Owen', 'Nash', 'HVAC Helper', v_mep_station_id, false, 22.00, true, '2023-02-25'),
    (v_nwbs_factory_id, 'NWBS-042', 'Pete', 'Oliver', 'Electrician Helper', v_mep_station_id, false, 21.50, true, '2023-05-10'),
    (v_nwbs_factory_id, 'NWBS-043', 'Rick', 'Palmer', 'Plumber Helper', v_mep_station_id, false, 21.00, true, '2023-08-02'),

    -- Finish crew (9 workers)
    (v_nwbs_factory_id, 'NWBS-044', 'Steve', 'Quinn', 'Finish Carpenter', v_finish_station_id, false, 26.00, true, '2022-02-28'),
    (v_nwbs_factory_id, 'NWBS-045', 'Tim', 'Roberts', 'Finish Carpenter', v_finish_station_id, false, 25.50, true, '2022-06-12'),
    (v_nwbs_factory_id, 'NWBS-046', 'Uma', 'Santos', 'Flooring Installer', v_finish_station_id, false, 24.00, true, '2022-09-08'),
    (v_nwbs_factory_id, 'NWBS-047', 'Vince', 'Taylor', 'Cabinet Installer', v_finish_station_id, false, 25.00, true, '2022-03-18'),
    (v_nwbs_factory_id, 'NWBS-048', 'Walt', 'Underwood', 'Finish Helper', v_finish_station_id, false, 20.50, true, '2023-04-28'),
    (v_nwbs_factory_id, 'NWBS-049', 'Xander', 'Vega', 'Trim Carpenter', v_finish_station_id, false, 24.50, true, '2022-07-05'),
    (v_nwbs_factory_id, 'NWBS-050', 'Yale', 'Ward', 'QC Inspector', v_finish_station_id, false, 26.50, true, '2021-10-20'),
    (v_nwbs_factory_id, 'NWBS-051', 'Zane', 'Xavier', 'Finish Helper', v_finish_station_id, false, 19.50, true, '2023-07-15'),
    (v_nwbs_factory_id, 'NWBS-052', 'Aaron', 'York', 'Final Touch-up', v_finish_station_id, false, 23.00, true, '2022-12-01');

  RAISE NOTICE 'Created 52 general crew workers';

END $$;

SELECT 'Step 8 complete: 60 workers created (8 leads + 52 crew)' AS status;

-- ############################################################################
-- STEP 9: CREATE WORKER SHIFTS (50 active today)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_factory_id UUID;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Create active shifts for 50 of 60 workers (83% attendance)
  INSERT INTO worker_shifts (worker_id, factory_id, clock_in, source, status)
  SELECT
    w.id,
    w.factory_id,
    CURRENT_DATE + INTERVAL '6 hours' + (random() * INTERVAL '30 minutes'),
    'kiosk',
    'active'
  FROM workers w
  WHERE w.factory_id = v_nwbs_factory_id
    AND w.is_active = true
  ORDER BY random()
  LIMIT 50;

  RAISE NOTICE 'Created 50 active worker shifts for today';

END $$;

SELECT 'Step 9 complete: 50 worker shifts created' AS status;

-- ############################################################################
-- STEP 10: CREATE MODULES (Waterfall: ONE module per station max)
-- ############################################################################
-- Production stations are a WATERFALL system:
-- - Each station can only hold ONE module at a time
-- - Modules progress: Station 1 → 2 → 3 → ... → 11 (Staging) → 12 (Shipping)
-- - A module can't advance until the next station is empty
--
-- We create 12 modules max in production (one per station), plus some in queue

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_stations UUID[];
  v_total_modules INTEGER := 0;
  v_projects UUID[];
  v_project_numbers TEXT[];
  v_module_num INTEGER := 1;
  i INTEGER;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Get all station IDs in order (12 stations)
  SELECT ARRAY_AGG(id ORDER BY order_num)
  INTO v_stations
  FROM station_templates
  WHERE factory_id IS NULL;

  RAISE NOTICE 'Found % stations for production line', array_length(v_stations, 1);

  -- Get all projects in deterministic order (no random - prevents duplicate serial numbers)
  SELECT ARRAY_AGG(id ORDER BY project_number), ARRAY_AGG(project_number ORDER BY project_number)
  INTO v_projects, v_project_numbers
  FROM projects
  WHERE factory_id = v_nwbs_factory_id;

  RAISE NOTICE 'Found % projects for modules', array_length(v_projects, 1);

  -- ============================================================================
  -- CREATE 12 ACTIVE MODULES (one per station - waterfall constraint)
  -- ============================================================================
  -- Use GLOBAL unique serial numbers to avoid duplicates: NWBS-MOD-001, NWBS-MOD-002, etc.
  -- Each module gets a unique serial regardless of project

  -- Station 12 (Shipping/Delivery): Module ready to ship - from phase 4 project (index 3 = Boeing)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[3], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Main Office Module', 1, 'Staged', v_stations[12],
          CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE + INTERVAL '2 days', 14, 60, 'government', false);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 11 (Staging): from phase 4 project (index 9 = Costco)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[9], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Conference Room A', 1, 'In Progress', v_stations[11],
          CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '4 days', 14, 56, 'custom', false);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 10 (Final QC): from phase 3 project (index 1 = Boise School)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[1], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Break Room Module', 2, 'In Progress', v_stations[10],
          CURRENT_DATE - INTERVAL '22 days', CURRENT_DATE + INTERVAL '5 days', 14, 48, 'stock', true);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 9 (Interior Finish): from phase 3 project (index 5 = United Rentals 1)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[5], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Restroom Module', 3, 'In Progress', v_stations[9],
          CURRENT_DATE - INTERVAL '19 days', CURRENT_DATE + INTERVAL '8 days', 12, 40, 'fleet', false);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 8 (Flooring): from phase 3 project (index 6 = United Rentals 2)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[6], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Storage Module A', 1, 'In Progress', v_stations[8],
          CURRENT_DATE - INTERVAL '16 days', CURRENT_DATE + INTERVAL '10 days', 14, 60, 'stock', false);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 7 (Paint/Texture): from phase 3 project (index 7 = ModSpace)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[7], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Entry Module', 2, 'In Progress', v_stations[7],
          CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE + INTERVAL '12 days', 14, 52, 'government', false);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 6 (Drywall): from phase 3 project (index 8 = Pacific Mobile)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[8], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Utility Module', 1, 'In Progress', v_stations[6],
          CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '14 days', 12, 44, 'custom', false);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 5 (Electrical/Plumbing): from phase 2 project (index 2 = Idaho State)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[2], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Lab Module B', 3, 'In Progress', v_stations[5],
          CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '17 days', 14, 60, 'government', true);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 4 (Insulation): from phase 2 project (index 4 = Microsoft)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[4], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Classroom Module', 2, 'In Progress', v_stations[4],
          CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '19 days', 14, 56, 'stock', false);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 3 (Roof/Exterior): from phase 3 project (index 10 = Williams Scotsman)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[10], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Admin Module', 1, 'In Progress', v_stations[3],
          CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '21 days', 14, 60, 'fleet', false);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 2 (Rough Carpentry): from phase 2 project (index 11 = Target)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[11], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Training Room', 4, 'In Progress', v_stations[2],
          CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '23 days', 14, 48, 'custom', false);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- Station 1 (Frame Welding): from phase 3 project (index 12 = Amazon)
  INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
  VALUES (v_projects[12], v_nwbs_factory_id, 'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'), 'Expansion Module', 5, 'In Progress', v_stations[1],
          CURRENT_DATE, CURRENT_DATE + INTERVAL '25 days', 14, 60, 'government', false);
  v_module_num := v_module_num + 1;
  v_total_modules := v_total_modules + 1;

  -- ============================================================================
  -- CREATE 6 MODULES IN QUEUE (waiting for station 1 to open)
  -- ============================================================================
  -- Use unique serial numbers continuing from above

  FOR i IN 1..6 LOOP
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
    VALUES (
      v_projects[((i - 1) % array_length(v_projects, 1)) + 1],
      v_nwbs_factory_id,
      'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'),
      'Queue Module ' || CHR(64 + i),
      i + 10,
      'In Queue',
      NULL, -- No station assigned yet
      CURRENT_DATE + INTERVAL '2 days' * i,
      CURRENT_DATE + INTERVAL '25 days' + INTERVAL '2 days' * i,
      14, 56,
      CASE WHEN i % 3 = 0 THEN 'government' WHEN i % 3 = 1 THEN 'custom' ELSE 'stock' END,
      i = 1
    );
    v_module_num := v_module_num + 1;
    v_total_modules := v_total_modules + 1;
  END LOOP;

  -- ============================================================================
  -- CREATE 4 COMPLETED MODULES (shipped in the past 2 weeks)
  -- ============================================================================
  FOR i IN 1..4 LOOP
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, module_width, module_length, building_category, is_rush)
    VALUES (
      v_projects[((i + 2) % array_length(v_projects, 1)) + 1],
      v_nwbs_factory_id,
      'NWBS-MOD-' || LPAD(v_module_num::TEXT, 3, '0'),
      'Completed Module ' || CHR(64 + i),
      i + 20,
      'Completed',
      v_stations[12], -- Shipped from station 12
      CURRENT_DATE - INTERVAL '35 days' + INTERVAL '3 days' * i,
      CURRENT_DATE - INTERVAL '7 days' - INTERVAL '2 days' * i,
      14, 60,
      CASE WHEN i % 2 = 0 THEN 'fleet' ELSE 'stock' END,
      false
    );
    v_module_num := v_module_num + 1;
    v_total_modules := v_total_modules + 1;
  END LOOP;

  RAISE NOTICE 'Created % modules total (12 in production, 6 in queue, 4 completed)', v_total_modules;

END $$;

SELECT 'Step 10 complete: Modules created (waterfall constraint enforced)' AS status;

-- ############################################################################
-- STEP 11: CREATE TASKS, RFIs, AND SUBMITTALS
-- ############################################################################
-- Task distribution goal (relative to CURRENT_DATE = 1/15/2026):
-- - ~60% Completed (due dates in past, already done)
-- - ~30% In Progress or Not Started (due dates upcoming 1-21 days)
-- - ~10% Slightly Overdue (due 1-3 days ago, still in progress)
-- This creates realistic demo data where PMs have work to do but aren't drowning
--
-- IMPORTANT: Each task has a workflow_station_key linking it to a workflow station.
-- The workflow canvas derives station status from tasks, NOT from project_workflow_status.

-- Ensure workflow_station_key column exists on tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_station_key VARCHAR(50);

DO $$
DECLARE
  v_project RECORD;
  v_pm_id UUID;
  v_task_count INTEGER := 0;
  v_rfi_count INTEGER := 0;
  v_submittal_count INTEGER := 0;
  v_proj_num INTEGER := 0;
BEGIN
  -- Loop through each project
  FOR v_project IN
    SELECT p.id, p.project_number, p.name, p.current_phase, p.building_type,
           p.owner_id, p.start_date, COALESCE(p.client_name, p.dealer_name, 'Client') AS client_name
    FROM projects p
    ORDER BY p.project_number
  LOOP
    v_pm_id := v_project.owner_id;
    v_proj_num := v_proj_num + 1;

    -- ======================================================================
    -- TASKS with workflow_station_key for workflow canvas visualization
    -- Station keys: sales_handoff, kickoff, drawings_20, drawings_65, drawings_100,
    --   color_selections, long_lead_items, cutsheets, dealer_approval,
    --   engineering, third_party, state_approval, permits, change_orders, production_release,
    --   production, qc_inspection, staging, delivery, closeout
    -- ======================================================================

    -- Phase 1 tasks - sales_handoff and kickoff stations
    IF v_project.current_phase >= 1 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, workflow_station_key, created_at)
      VALUES
        (v_project.id, 'Complete Sales Handoff', 'Review contract and sales notes',
         CASE WHEN v_project.current_phase > 1 THEN 'Completed' ELSE 'In Progress' END,
         'High',
         CASE WHEN v_project.current_phase > 1 THEN CURRENT_DATE - INTERVAL '45 days' ELSE CURRENT_DATE + INTERVAL '3 days' END,
         v_pm_id, v_pm_id, 'sales_handoff', NOW()),
        (v_project.id, 'Schedule Kickoff Meeting', 'Coordinate with client and team',
         CASE WHEN v_project.current_phase > 1 THEN 'Completed' ELSE 'In Progress' END,
         'High',
         CASE WHEN v_project.current_phase > 1 THEN CURRENT_DATE - INTERVAL '40 days' ELSE CURRENT_DATE + INTERVAL '5 days' END,
         v_pm_id, v_pm_id, 'kickoff', NOW());
      v_task_count := v_task_count + 2;
    END IF;

    -- Phase 2 tasks - drawings, colors, long lead items stations
    IF v_project.current_phase >= 2 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, workflow_station_key, created_at)
      VALUES
        (v_project.id, 'Review 20% Drawings', 'Initial design review',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'In Progress' END,
         'High',
         CASE WHEN v_project.current_phase > 2 THEN CURRENT_DATE - INTERVAL '30 days' ELSE CURRENT_DATE + INTERVAL '7 days' END,
         v_pm_id, v_pm_id, 'drawings_20', NOW()),
        (v_project.id, 'Review 65% Drawings', 'Development drawings review',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'Not Started' END,
         'High',
         CASE WHEN v_project.current_phase > 2 THEN CURRENT_DATE - INTERVAL '25 days' ELSE CURRENT_DATE + INTERVAL '14 days' END,
         v_pm_id, v_pm_id, 'drawings_65', NOW()),
        (v_project.id, 'Review 100% Drawings', 'Final construction documents',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'Not Started' END,
         'High',
         CASE WHEN v_project.current_phase > 2 THEN CURRENT_DATE - INTERVAL '20 days' ELSE CURRENT_DATE + INTERVAL '21 days' END,
         v_pm_id, v_pm_id, 'drawings_100', NOW()),
        (v_project.id, 'Confirm Color Selections', 'Get dealer approval on colors',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'In Progress' END,
         'Medium',
         CASE WHEN v_project.current_phase > 2 THEN CURRENT_DATE - INTERVAL '22 days' ELSE CURRENT_DATE + INTERVAL '10 days' END,
         v_pm_id, v_pm_id, 'color_selections', NOW()),
        (v_project.id, 'Order Long Lead Items', 'Identify and order equipment',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'In Progress' END,
         'High',
         CASE WHEN v_project.current_phase > 2 THEN CURRENT_DATE - INTERVAL '18 days' ELSE CURRENT_DATE + INTERVAL '12 days' END,
         v_pm_id, v_pm_id, 'long_lead_items', NOW()),
        (v_project.id, 'Submit Cutsheets', 'Equipment cutsheet approvals',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'Not Started' END,
         'Medium',
         CASE WHEN v_project.current_phase > 2 THEN CURRENT_DATE - INTERVAL '15 days' ELSE CURRENT_DATE + INTERVAL '18 days' END,
         v_pm_id, v_pm_id, 'cutsheets', NOW()),
        (v_project.id, 'Obtain Dealer Final Approval', 'Dealer signs off on all submittals',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'Not Started' END,
         'High',
         CASE WHEN v_project.current_phase > 2 THEN CURRENT_DATE - INTERVAL '12 days' ELSE CURRENT_DATE + INTERVAL '25 days' END,
         v_pm_id, v_pm_id, 'dealer_approval', NOW());
      v_task_count := v_task_count + 7;
    END IF;

    -- Phase 3 tasks - engineering, permits, change orders, etc.
    IF v_project.current_phase >= 3 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, workflow_station_key, created_at)
      VALUES
        (v_project.id, 'Engineering Review', 'Complete structural review',
         CASE WHEN v_project.current_phase > 3 THEN 'Completed' ELSE 'In Progress' END,
         'High',
         CASE WHEN v_project.current_phase > 3 THEN CURRENT_DATE - INTERVAL '14 days' ELSE CURRENT_DATE + INTERVAL '5 days' END,
         v_pm_id, v_pm_id, 'engineering', NOW()),
        (v_project.id, 'Submit Building Permits', 'Local jurisdiction permits',
         CASE WHEN v_project.current_phase > 3 THEN 'Completed' ELSE 'In Progress' END,
         'High',
         CASE WHEN v_project.current_phase > 3 THEN CURRENT_DATE - INTERVAL '10 days' ELSE CURRENT_DATE + INTERVAL '8 days' END,
         v_pm_id, v_pm_id, 'permits', NOW()),
        (v_project.id, 'Process Change Orders', 'Handle any scope changes',
         CASE WHEN v_project.current_phase > 3 THEN 'Completed' ELSE 'Not Started' END,
         'Medium',
         CASE WHEN v_project.current_phase > 3 THEN CURRENT_DATE - INTERVAL '7 days' ELSE CURRENT_DATE + INTERVAL '21 days' END,
         v_pm_id, v_pm_id, 'change_orders', NOW()),
        (v_project.id, 'Release to Production', 'Release project to production queue',
         CASE WHEN v_project.current_phase > 3 THEN 'Completed' ELSE 'Not Started' END,
         'High',
         CASE WHEN v_project.current_phase > 3 THEN CURRENT_DATE - INTERVAL '5 days' ELSE CURRENT_DATE + INTERVAL '28 days' END,
         v_pm_id, v_pm_id, 'production_release', NOW());
      v_task_count := v_task_count + 4;

      -- Additional tasks for PM projects (GOVERNMENT/CUSTOM) - third_party and state_approval stations
      IF v_project.building_type IN ('GOVERNMENT', 'CUSTOM') THEN
        INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, workflow_station_key, created_at)
        VALUES
          (v_project.id, 'Third Party Plan Review', 'External review submission',
           CASE WHEN v_project.current_phase > 3 THEN 'Completed' ELSE 'In Progress' END,
           'High',
           CASE WHEN v_project.current_phase > 3 THEN CURRENT_DATE - INTERVAL '8 days'
                WHEN v_proj_num % 4 = 0 THEN CURRENT_DATE - INTERVAL '2 days' -- One overdue task
                ELSE CURRENT_DATE + INTERVAL '6 days' END,
           v_pm_id, v_pm_id, 'third_party', NOW()),
          (v_project.id, 'Obtain State Approval', 'State agency sign-off',
           CASE WHEN v_project.current_phase > 3 THEN 'Completed' ELSE 'In Progress' END,
           'Critical',
           CASE WHEN v_project.current_phase > 3 THEN CURRENT_DATE - INTERVAL '5 days' ELSE CURRENT_DATE + INTERVAL '12 days' END,
           v_pm_id, v_pm_id, 'state_approval', NOW());
        v_task_count := v_task_count + 2;
      END IF;
    END IF;

    -- Phase 4 tasks - production, qc, staging, delivery, closeout stations
    IF v_project.current_phase >= 4 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, workflow_station_key, created_at)
      VALUES
        (v_project.id, 'Production Build', 'Module fabrication and assembly',
         'In Progress', 'High', CURRENT_DATE + INTERVAL '3 days', v_pm_id, v_pm_id, 'production', NOW()),
        (v_project.id, 'QC Inspection', 'Quality control sign-off',
         'Not Started', 'High', CURRENT_DATE + INTERVAL '5 days', v_pm_id, v_pm_id, 'qc_inspection', NOW()),
        (v_project.id, 'Prepare for Staging', 'Stage module for transport',
         'Not Started', 'Medium', CURRENT_DATE + INTERVAL '7 days', v_pm_id, v_pm_id, 'staging', NOW()),
        (v_project.id, 'Schedule Delivery', 'Coordinate transport to site',
         'Not Started', 'High', CURRENT_DATE + INTERVAL '10 days', v_pm_id, v_pm_id, 'delivery', NOW()),
        (v_project.id, 'Project Closeout', 'Final documentation and handoff',
         'Not Started', 'Medium', CURRENT_DATE + INTERVAL '14 days', v_pm_id, v_pm_id, 'closeout', NOW());
      v_task_count := v_task_count + 5;
    END IF;

    -- ======================================================================
    -- RFIs (2-5 per PM project, 0-2 per PC project)
    -- ======================================================================

    IF v_project.building_type IN ('GOVERNMENT', 'CUSTOM') AND v_project.current_phase >= 2 THEN
      INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
      VALUES
        (v_project.id, v_project.project_number || '-RFI-001', 1,
         'Electrical Panel Location', 'Please confirm main panel location per drawing A-101',
         CASE WHEN v_project.current_phase > 2 THEN 'Per revised drawing E-101, main panel location confirmed at west wall.' ELSE NULL END,
         CASE WHEN v_project.current_phase > 2 THEN 'Closed' ELSE 'Open' END,
         'High', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '7 days', true, v_project.client_name, v_pm_id, NOW()),
        (v_project.id, v_project.project_number || '-RFI-002', 2,
         'HVAC Equipment Specs', 'Confirm BTU requirements for package unit',
         CASE WHEN v_project.current_phase > 3 THEN 'Confirmed 5-ton unit per mechanical schedule.' ELSE NULL END,
         CASE WHEN v_project.current_phase > 3 THEN 'Closed' ELSE 'Open' END,
         'Medium', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '10 days', true, v_project.client_name, v_pm_id, NOW());
      v_rfi_count := v_rfi_count + 2;

      IF v_project.current_phase >= 3 THEN
        INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
        VALUES
          (v_project.id, v_project.project_number || '-RFI-003', 3,
           'Structural Connection Detail', 'Clarify beam-to-column connection at grid B-3',
           CASE WHEN v_project.current_phase > 3 THEN 'Use moment connection per detail S-201.' ELSE NULL END,
           CASE WHEN v_project.current_phase > 3 THEN 'Closed' ELSE 'Open' END,
           'High', CURRENT_DATE, CURRENT_DATE + INTERVAL '5 days', true, v_project.client_name, v_pm_id, NOW());
        v_rfi_count := v_rfi_count + 1;
      END IF;
    END IF;

    -- PC projects get fewer RFIs
    IF v_project.building_type = 'STOCK' AND v_project.current_phase >= 3 THEN
      INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by, created_at)
      VALUES
        (v_project.id, v_project.project_number || '-RFI-001', 1,
         'Floor Plan Confirmation', 'Please confirm standard floor plan layout',
         CASE WHEN v_project.current_phase > 3 THEN 'Standard layout confirmed.' ELSE NULL END,
         CASE WHEN v_project.current_phase > 3 THEN 'Closed' ELSE 'Open' END,
         'Low', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '14 days', false, 'Engineering Team', v_pm_id, NOW());
      v_rfi_count := v_rfi_count + 1;
    END IF;

    -- ======================================================================
    -- SUBMITTALS (4-8 per PM project, 2-4 per PC project)
    -- ======================================================================

    IF v_project.current_phase >= 2 THEN
      INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
      VALUES
        (v_project.id, v_project.project_number || '-SUB-001',
         'HVAC Package Unit', 'Product Data',
         CASE WHEN v_project.current_phase > 2 THEN 'Approved' ELSE 'Submitted' END,
         'Carrier', '50XC-024',
         CASE WHEN v_project.current_phase >= 2 THEN v_project.start_date + INTERVAL '30 days' ELSE NULL END,
         CURRENT_DATE + INTERVAL '14 days', NOW()),
        (v_project.id, v_project.project_number || '-SUB-002',
         'Main Electrical Panel', 'Shop Drawings',
         CASE WHEN v_project.current_phase > 2 THEN 'Approved' ELSE 'Under Review' END,
         'Square D', 'QO130L200PG',
         CASE WHEN v_project.current_phase >= 2 THEN v_project.start_date + INTERVAL '35 days' ELSE NULL END,
         CURRENT_DATE + INTERVAL '10 days', NOW());
      v_submittal_count := v_submittal_count + 2;

      IF v_project.building_type IN ('GOVERNMENT', 'CUSTOM') THEN
        INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date, created_at)
        VALUES
          (v_project.id, v_project.project_number || '-SUB-003',
           'Aluminum Windows', 'Shop Drawings',
           CASE WHEN v_project.current_phase > 3 THEN 'Approved' ELSE 'Submitted' END,
           'Milgard', 'Style Line Series',
           CASE WHEN v_project.current_phase >= 2 THEN v_project.start_date + INTERVAL '45 days' ELSE NULL END,
           CURRENT_DATE + INTERVAL '12 days', NOW()),
          (v_project.id, v_project.project_number || '-SUB-004',
           'LVT Flooring', 'Samples',
           CASE WHEN v_project.current_phase > 3 THEN 'Approved' ELSE 'Under Review' END,
           'Shaw Contract', 'Crete II',
           CASE WHEN v_project.current_phase >= 2 THEN v_project.start_date + INTERVAL '40 days' ELSE NULL END,
           CURRENT_DATE + INTERVAL '8 days', NOW()),
          (v_project.id, v_project.project_number || '-SUB-005',
           'Interior Paint Colors', 'Samples',
           CASE WHEN v_project.current_phase > 2 THEN 'Approved' ELSE 'Submitted' END,
           'Benjamin Moore', 'OC-17 White Dove',
           CASE WHEN v_project.current_phase >= 2 THEN v_project.start_date + INTERVAL '25 days' ELSE NULL END,
           CURRENT_DATE + INTERVAL '7 days', NOW());
        v_submittal_count := v_submittal_count + 3;
      END IF;
    END IF;

  END LOOP;

  RAISE NOTICE 'Created % tasks, % RFIs, % submittals', v_task_count, v_rfi_count, v_submittal_count;

END $$;

SELECT 'Step 11 complete: Tasks, RFIs, Submittals created' AS status;

-- ############################################################################
-- STEP 12: CREATE LONG LEAD ITEMS
-- ############################################################################

DO $$
DECLARE
  v_project RECORD;
BEGIN
  -- Add long lead items for projects in phase 2+
  FOR v_project IN
    SELECT p.id, p.project_number, p.current_phase, p.start_date
    FROM projects p
    WHERE p.current_phase >= 2
    ORDER BY p.project_number
  LOOP
    INSERT INTO long_lead_items (project_id, part_name, part_number, vendor, lead_days, status, ordered, ordered_at, expected_date, received_date, notes)
    VALUES
      (v_project.id, 'HVAC Package Unit (Carrier)', '50XC-024', 'Ferguson', 56,
       CASE WHEN v_project.current_phase >= 4 THEN 'Received' WHEN v_project.current_phase >= 3 THEN 'Shipped' ELSE 'Ordered' END,
       true, v_project.start_date + INTERVAL '30 days',
       v_project.start_date + INTERVAL '86 days',
       CASE WHEN v_project.current_phase >= 4 THEN v_project.start_date + INTERVAL '82 days' ELSE NULL END,
       'Cutsheet approved'),
      (v_project.id, 'Custom Windows (Milgard)', 'Style Line 3000', 'Milgard Direct', 42,
       CASE WHEN v_project.current_phase >= 4 THEN 'Received' WHEN v_project.current_phase >= 3 THEN 'Shipped' ELSE 'Ordered' END,
       true, v_project.start_date + INTERVAL '35 days',
       v_project.start_date + INTERVAL '77 days',
       CASE WHEN v_project.current_phase >= 4 THEN v_project.start_date + INTERVAL '75 days' ELSE NULL END,
       NULL),
      (v_project.id, 'Fire Suppression System', 'Vortex 500', 'Fire Safety Supply', 28,
       CASE WHEN v_project.current_phase >= 3 THEN 'Received' ELSE 'Ordered' END,
       v_project.current_phase >= 2,
       CASE WHEN v_project.current_phase >= 2 THEN v_project.start_date + INTERVAL '40 days' ELSE NULL END,
       CASE WHEN v_project.current_phase >= 2 THEN v_project.start_date + INTERVAL '68 days' ELSE NULL END,
       CASE WHEN v_project.current_phase >= 3 THEN v_project.start_date + INTERVAL '65 days' ELSE NULL END,
       NULL);
  END LOOP;

  RAISE NOTICE 'Created long lead items for phase 2+ projects';

END $$;

SELECT 'Step 12 complete: Long lead items created' AS status;

-- ############################################################################
-- STEP 13: INITIALIZE WORKFLOW STATUS
-- ############################################################################
-- Creates project_workflow_status records for each project/station combination.
-- Status logic based on project's current_phase:
-- - Stations in phases BEFORE current_phase: completed
-- - First station in current phase: in_progress
-- - Other stations in current phase: not_started or awaiting_response
-- - Stations in FUTURE phases: not_started

DO $$
DECLARE
  v_project RECORD;
  v_station RECORD;
  v_status VARCHAR(30);
  v_started DATE;
  v_completed DATE;
  v_station_count INTEGER := 0;
  v_project_count INTEGER := 0;
  v_inserted INTEGER := 0;
  v_current_phase_station_num INTEGER;
BEGIN
  -- First verify workflow_stations has data
  SELECT COUNT(*) INTO v_station_count FROM workflow_stations WHERE is_active = true;
  SELECT COUNT(*) INTO v_project_count FROM projects;

  RAISE NOTICE 'Found % active workflow stations and % projects', v_station_count, v_project_count;

  IF v_station_count = 0 THEN
    RAISE WARNING 'No workflow stations found - cannot populate workflow status';
    RETURN;
  END IF;

  -- For each project, create workflow status for all stations
  FOR v_project IN
    SELECT p.id, p.project_number, p.current_phase, p.start_date, p.owner_id
    FROM projects p
    ORDER BY p.project_number
  LOOP
    v_current_phase_station_num := 0;

    FOR v_station IN
      SELECT ws.station_key, ws.phase, ws.display_order, ws.is_required
      FROM workflow_stations ws
      WHERE ws.is_active = true
      ORDER BY ws.phase, ws.display_order
    LOOP
      -- Reset counter for each phase
      IF v_station.display_order = 1 THEN
        v_current_phase_station_num := 0;
      END IF;

      -- Determine status, started_date, completed_date
      IF v_station.phase < v_project.current_phase THEN
        -- COMPLETED: All stations in previous phases
        v_status := 'completed';
        v_started := CURRENT_DATE - INTERVAL '90 days' + (v_station.phase * INTERVAL '14 days') + (v_station.display_order * INTERVAL '3 days');
        v_completed := v_started + INTERVAL '5 days';

      ELSIF v_station.phase = v_project.current_phase THEN
        v_current_phase_station_num := v_current_phase_station_num + 1;

        IF v_current_phase_station_num = 1 THEN
          -- First station in current phase: IN_PROGRESS
          v_status := 'in_progress';
          v_started := CURRENT_DATE - INTERVAL '3 days';
          v_completed := NULL;
        ELSIF v_current_phase_station_num = 2 AND v_project.current_phase = 2 THEN
          -- Second station in phase 2: might be awaiting response
          v_status := 'awaiting_response';
          v_started := CURRENT_DATE - INTERVAL '1 day';
          v_completed := NULL;
        ELSE
          -- Other stations in current phase: NOT_STARTED
          v_status := 'not_started';
          v_started := NULL;
          v_completed := NULL;
        END IF;

      ELSE
        -- FUTURE: Stations in later phases
        v_status := 'not_started';
        v_started := NULL;
        v_completed := NULL;
      END IF;

      -- Insert the record (use UPSERT to handle re-runs)
      INSERT INTO project_workflow_status (
        project_id, station_key, status, started_date, completed_date, updated_by
      ) VALUES (
        v_project.id,
        v_station.station_key,
        v_status,
        v_started,
        v_completed,
        v_project.owner_id
      )
      ON CONFLICT (project_id, station_key) DO UPDATE SET
        status = EXCLUDED.status,
        started_date = EXCLUDED.started_date,
        completed_date = EXCLUDED.completed_date,
        updated_at = NOW();

      v_inserted := v_inserted + 1;

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Inserted/updated % workflow status records for % projects', v_inserted, v_project_count;

END $$;

SELECT 'Step 13 complete: Workflow status initialized' AS status;

-- Verify workflow status was created
DO $$
DECLARE
  v_count INTEGER;
  v_completed INTEGER;
  v_in_progress INTEGER;
  v_not_started INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM project_workflow_status;
  SELECT COUNT(*) INTO v_completed FROM project_workflow_status WHERE status = 'completed';
  SELECT COUNT(*) INTO v_in_progress FROM project_workflow_status WHERE status = 'in_progress';
  SELECT COUNT(*) INTO v_not_started FROM project_workflow_status WHERE status = 'not_started';

  RAISE NOTICE 'Workflow Status Summary: % total (% completed, % in_progress, % not_started)',
    v_count, v_completed, v_in_progress, v_not_started;
END $$;

-- ############################################################################
-- STEP 14: CREATE SALES DATA
-- ############################################################################

-- Ensure sales_customers table exists
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

ALTER TABLE sales_customers DROP CONSTRAINT IF EXISTS sales_customers_company_name_key;
ALTER TABLE sales_customers ADD CONSTRAINT sales_customers_company_name_key UNIQUE (company_name);
ALTER TABLE sales_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_customers_all" ON sales_customers;
CREATE POLICY "sales_customers_all" ON sales_customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure sales_quotes table exists
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

ALTER TABLE sales_quotes DROP CONSTRAINT IF EXISTS sales_quotes_quote_number_key;
ALTER TABLE sales_quotes ADD CONSTRAINT sales_quotes_quote_number_key UNIQUE (quote_number);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS outlook_percentage INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged BOOLEAN DEFAULT false;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS factory VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_to_project_id UUID;
ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_quotes_all" ON sales_quotes;
CREATE POLICY "sales_quotes_all" ON sales_quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DO $$
DECLARE
  v_mitch_id UUID;
  v_robert_id UUID;
  v_nwbs_factory_id UUID;
  v_boise_project_id UUID;
  v_microsoft_project_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO v_mitch_id FROM users WHERE LOWER(email) LIKE '%mitch%' LIMIT 1;
  SELECT id INTO v_robert_id FROM users WHERE LOWER(email) LIKE '%robert%thaler%' OR LOWER(name) LIKE '%robert%thaler%' LIMIT 1;
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Get project IDs for linking won quotes
  SELECT id INTO v_boise_project_id FROM projects WHERE project_number = 'NWBS-26-001';
  SELECT id INTO v_microsoft_project_id FROM projects WHERE project_number = 'NWBS-26-004';

  -- Fallback for Robert if not found
  IF v_robert_id IS NULL THEN
    v_robert_id := v_mitch_id;
  END IF;

  -- Create sales customers
  -- Schema: company_name, company_type, contact_name, contact_email, contact_phone, address_line1, city, state, zip_code, factory
  INSERT INTO sales_customers (company_name, company_type, contact_name, contact_email, contact_phone, address_line1, city, state, zip_code, factory, created_at) VALUES
    ('Boise School District', 'government', 'Sarah Johnson', 'purchasing@boiseschools.org', '208-555-0101', '1234 Capitol Blvd', 'Boise', 'ID', '83702', 'NWBS', NOW()),
    ('Idaho State University', 'government', 'Dr. Michael Chen', 'facilities@isu.edu', '208-555-0102', '921 S 8th Ave', 'Pocatello', 'ID', '83209', 'NWBS', NOW()),
    ('Boeing Company', 'direct', 'Robert Martinez', 'modular@boeing.com', '425-555-0201', '3003 W Casino Rd', 'Everett', 'WA', '98204', 'NWBS', NOW()),
    ('Microsoft Corporation', 'direct', 'Jennifer Lee', 'realestate@microsoft.com', '425-555-0301', '1 Microsoft Way', 'Redmond', 'WA', '98052', 'NWBS', NOW()),
    ('Amazon Fulfillment', 'direct', 'David Thompson', 'facilities@amazon.com', '206-555-0401', '410 Terry Ave N', 'Seattle', 'WA', '98109', 'NWBS', NOW()),
    ('Costco Wholesale', 'direct', 'Mike Wilson', 'construction@costco.com', '425-555-0501', '999 Lake Dr', 'Issaquah', 'WA', '98027', 'NWBS', NOW()),
    ('Starbucks Coffee', 'direct', 'Lisa Anderson', 'realestate@starbucks.com', '206-555-0601', '2401 Utah Ave S', 'Seattle', 'WA', '98134', 'NWBS', NOW()),
    ('Port of Seattle', 'government', 'Tom Harris', 'facilities@portseattle.org', '206-555-0701', '2711 Alaskan Way', 'Seattle', 'WA', '98121', 'NWBS', NOW()),
    ('Oregon Health Sciences', 'government', 'Dr. Patricia Moore', 'facilities@ohsu.edu', '503-555-0801', '3181 SW Sam Jackson Park Rd', 'Portland', 'OR', '97239', 'NWBS', NOW()),
    ('City of Tacoma', 'government', 'James Clark', 'purchasing@cityoftacoma.org', '253-555-0901', '747 Market St', 'Tacoma', 'WA', '98402', 'NWBS', NOW())
  ON CONFLICT (company_name) DO NOTHING;

  -- Create sales quotes - Mitch's quotes
  -- Schema: quote_number, total_price (not total_value), status, outlook_percentage, pm_flagged, assigned_to, notes, factory
  INSERT INTO sales_quotes (quote_number, total_price, status, outlook_percentage, pm_flagged,
                           assigned_to, notes, factory, created_at, converted_to_project_id) VALUES
    ('Q-2026-M01', 1850000.00, 'converted', 100, false,
     v_mitch_id, 'Boise School District - Won, converted to project NWBS-26-001', 'NWBS', NOW() - INTERVAL '120 days', v_boise_project_id),
    ('Q-2026-M02', 920000.00, 'negotiating', 75, true,
     v_mitch_id, 'Idaho State University - PM involvement needed for complex requirements', 'NWBS', NOW() - INTERVAL '30 days', NULL),
    ('Q-2026-M03', 680000.00, 'sent', 40, false,
     v_mitch_id, 'City of Portland Metro - Initial proposal sent', 'NWBS', NOW() - INTERVAL '14 days', NULL),
    ('Q-2026-M04', 2100000.00, 'awaiting_po', 95, true,
     v_mitch_id, 'Oregon Health Sciences - Healthcare requirements, PM review needed', 'NWBS', NOW() - INTERVAL '45 days', NULL),
    ('Q-2026-M05', 750000.00, 'draft', 20, false,
     v_mitch_id, 'City of Tacoma - Early stage, gathering requirements', 'NWBS', NOW() - INTERVAL '7 days', NULL),
    ('Q-2026-M06', 1200000.00, 'negotiating', 60, false,
     v_mitch_id, 'King County - Government procurement process', 'NWBS', NOW() - INTERVAL '25 days', NULL),
    ('Q-2026-M07', 620000.00, 'sent', 35, false,
     v_mitch_id, 'Seattle Parks Dept - Park facility buildings', 'NWBS', NOW() - INTERVAL '18 days', NULL),
    ('Q-2026-M08', 890000.00, 'lost', 0, false,
     v_mitch_id, 'Spokane Schools - Lost to competitor on price', 'NWBS', NOW() - INTERVAL '60 days', NULL),
    ('Q-2026-M09', 650000.00, 'lost', 0, false,
     v_mitch_id, 'Tri-Cities Transit - Project cancelled by client', 'NWBS', NOW() - INTERVAL '90 days', NULL),
    ('Q-2026-M10', 1100000.00, 'converted', 100, false,
     v_mitch_id, 'Yakima Valley College - Education facility', 'NWBS', NOW() - INTERVAL '35 days', NULL);

  -- Create sales quotes - Robert's quotes
  INSERT INTO sales_quotes (quote_number, total_price, status, outlook_percentage, pm_flagged,
                           assigned_to, notes, factory, created_at, converted_to_project_id) VALUES
    ('Q-2026-R01', 3200000.00, 'negotiating', 75, true,
     v_robert_id, 'AWS Seattle - Large data center support buildings', 'NWBS', NOW() - INTERVAL '28 days', NULL),
    ('Q-2026-R02', 1850000.00, 'sent', 50, false,
     v_robert_id, 'Boeing Everett - Additional support facilities', 'NWBS', NOW() - INTERVAL '21 days', NULL),
    ('Q-2026-R03', 980000.00, 'converted', 100, false,
     v_robert_id, 'Port of Seattle - Terminal support building', 'NWBS', NOW() - INTERVAL '55 days', NULL),
    ('Q-2026-R04', 2100000.00, 'converted', 100, false,
     v_robert_id, 'Microsoft Redmond - Won, converted to project NWBS-26-004', 'NWBS', NOW() - INTERVAL '45 days', v_microsoft_project_id),
    ('Q-2026-R05', 620000.00, 'sent', 30, false,
     v_robert_id, 'Starbucks HQ - Training facility proposal', 'NWBS', NOW() - INTERVAL '12 days', NULL),
    ('Q-2026-R06', 1450000.00, 'negotiating', 65, false,
     v_robert_id, 'Costco Regional - Multiple site offices', 'NWBS', NOW() - INTERVAL '32 days', NULL),
    ('Q-2026-R07', 2800000.00, 'awaiting_po', 90, true,
     v_robert_id, 'Amazon Fulfillment - Large order, PM coordination needed', 'NWBS', NOW() - INTERVAL '40 days', NULL),
    ('Q-2026-R08', 780000.00, 'draft', 15, false,
     v_robert_id, 'T-Mobile Campus - Initial discussions', 'NWBS', NOW() - INTERVAL '5 days', NULL),
    ('Q-2026-R09', 920000.00, 'sent', 40, false,
     v_robert_id, 'Alaska Airlines - Airport support facilities', 'NWBS', NOW() - INTERVAL '16 days', NULL),
    ('Q-2026-R10', 1100000.00, 'lost', 0, false,
     v_robert_id, 'Nordstrom - Project scope reduced', 'NWBS', NOW() - INTERVAL '75 days', NULL);

  RAISE NOTICE 'Created 10 sales customers and 20 sales quotes';

END $$;

SELECT 'Step 14 complete: Sales data created' AS status;

-- ############################################################################
-- STEP 15: VERIFICATION
-- ############################################################################

SELECT 'MASTER DEMO DATA V2 - VERIFICATION' AS status;

SELECT 'Users:' AS data_type, COUNT(*) AS count FROM users WHERE role IS NOT NULL
UNION ALL SELECT 'Factories', COUNT(*) FROM factories
UNION ALL SELECT 'Departments', COUNT(*) FROM departments
UNION ALL SELECT 'Workflow Stations', COUNT(*) FROM workflow_stations
UNION ALL SELECT 'Projects', COUNT(*) FROM projects
UNION ALL SELECT 'Modules', COUNT(*) FROM modules
UNION ALL SELECT 'Workers', COUNT(*) FROM workers
UNION ALL SELECT 'Worker Shifts', COUNT(*) FROM worker_shifts
UNION ALL SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'RFIs', COUNT(*) FROM rfis
UNION ALL SELECT 'Submittals', COUNT(*) FROM submittals
UNION ALL SELECT 'Long Lead Items', COUNT(*) FROM long_lead_items
UNION ALL SELECT 'Workflow Status', COUNT(*) FROM project_workflow_status
UNION ALL SELECT 'Sales Quotes', COUNT(*) FROM sales_quotes
UNION ALL SELECT 'Sales Customers', COUNT(*) FROM sales_customers
ORDER BY data_type;

-- Verify Plant_GM can see NWBS data
SELECT 'Plant GM / PC Users:' AS info;
SELECT name, role, factory FROM users WHERE role IN ('Plant_GM', 'PC', 'Production_Manager');

-- Verify modules at NWBS
SELECT 'Modules by Factory:' AS info;
SELECT f.code, COUNT(m.id) AS module_count
FROM factories f
LEFT JOIN modules m ON m.factory_id = f.id
GROUP BY f.code
ORDER BY module_count DESC;

-- Verify workers at NWBS
SELECT 'Workers by Factory:' AS info;
SELECT f.code, COUNT(w.id) AS worker_count, SUM(CASE WHEN w.is_lead THEN 1 ELSE 0 END) AS lead_count
FROM factories f
LEFT JOIN workers w ON w.factory_id = f.id
GROUP BY f.code
ORDER BY worker_count DESC;

SELECT 'MASTER DEMO DATA V2 COMPLETE!' AS status;
