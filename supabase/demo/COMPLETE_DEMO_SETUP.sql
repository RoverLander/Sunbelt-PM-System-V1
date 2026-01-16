-- ============================================================================
-- COMPLETE DEMO SETUP - REBUILT FROM REQUIREMENTS
-- ============================================================================
-- Run this ONE file to set up all demo data for the Sunbelt PM System.
-- Based on DEMO_DATA_REQUIREMENTS.md - January 16, 2026
--
-- KEY REQUIREMENTS:
-- 1. 25+ projects distributed across ALL factories
-- 2. PM project clustering (e.g., Matthew: NWBS primary, WM-EVERGREEN secondary)
-- 3. Each PM gets 4+ projects with backup PM assigned
-- 4. PCs handle STOCK jobs at their specific factories
-- 5. Projects at ALL factories, not just NWBS
--
-- CONFIRMED USERS:
-- - Matthew McDaniel (PM, sunbeltmodular.com) - NWBS primary, WM-EVERGREEN secondary
-- - Crystal James (PM, sunbeltmodular.com)
-- - Michael (PM, sunbeltmodular.com)
-- - Hector (PM, sunbeltmodular.com)
-- - Candy Nelson (Director/PM, sunbeltmodular.com)
-- - Dawn (PC, nwbsinc.com) - NWBS factory
-- - Juanita (PC, phoenixmodular.com) - PMI factory
-- - Mitch, Justin, Robert, Ross (NWBS staff)
--
-- Created: January 16, 2026
-- ============================================================================

-- ############################################################################
-- STEP 0: HELPER FUNCTION
-- ############################################################################

CREATE OR REPLACE FUNCTION safe_truncate(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not truncate %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

SELECT 'Step 0: Helper function created' AS status;

-- ############################################################################
-- STEP 1: CLEAR EXISTING DEMO DATA
-- ############################################################################

-- Clear PGM tables first (depend on modules)
SELECT safe_truncate('station_assignments');
SELECT safe_truncate('worker_shifts');
SELECT safe_truncate('qc_holds');
SELECT safe_truncate('qc_records');
SELECT safe_truncate('module_notes');

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
SELECT safe_truncate('long_lead_items');

-- Clear sales data
SELECT safe_truncate('sales_quotes');
SELECT safe_truncate('sales_customers');

-- Clear projects
SELECT safe_truncate('projects');

-- Clear workers (but NOT users)
SELECT safe_truncate('workers');

SELECT 'Step 1: Demo data cleared' AS status;

-- ############################################################################
-- STEP 2: CREATE/UPDATE ALL FACTORIES
-- ############################################################################
-- Include ALL factories that should have projects

INSERT INTO factories (code, short_name, full_name, display_value, city, state, region, address_line1, zip_code, is_active)
VALUES
  -- Northwest Region
  ('NWBS', 'Northwest Building', 'Northwest Building Systems', 'NWBS - Northwest Building Systems', 'Boise', 'ID', 'Northwest', '1234 Industrial Way', '83702', true),
  ('SSI', 'Sunbelt Idaho', 'Sunbelt Systems Idaho', 'SSI - Sunbelt Systems Idaho', 'Twin Falls', 'ID', 'Northwest', '9012 Factory Lane', '83301', true),

  -- Southwest Region
  ('PMI', 'Phoenix Modular', 'Phoenix Modular Industries', 'PMI - Phoenix Modular Industries', 'Phoenix', 'AZ', 'Southwest', '5678 Manufacturing Blvd', '85001', true),
  ('AMT', 'Amtex Modular', 'Amtex Modular Manufacturing', 'AMT - Amtex Modular', 'Austin', 'TX', 'Southwest', '4567 Modular Dr', '78701', true),

  -- Whitley Division (WA, NC, TX, NY)
  ('WM-EVERGREEN', 'Whitley Evergreen', 'Whitley Manufacturing Evergreen', 'WM-EVERGREEN - Whitley Evergreen', 'Everett', 'WA', 'Northwest', '100 Whitley Way', '98201', true),
  ('WM-EAST', 'Whitley East', 'Whitley Manufacturing East', 'WM-EAST - Whitley East', 'Charlotte', 'NC', 'East', '200 Whitley Blvd', '28201', true),
  ('WM-SOUTH', 'Whitley South', 'Whitley Manufacturing South', 'WM-SOUTH - Whitley South', 'Houston', 'TX', 'South', '300 Whitley Park', '77001', true),
  ('WM-ROCHESTER', 'Whitley Rochester', 'Whitley Manufacturing Rochester', 'WM-ROCHESTER - Whitley Rochester', 'Rochester', 'NY', 'Northeast', '400 Whitley Lane', '14601', true),

  -- Other Factories
  ('SMM', 'Sunbelt Mobile', 'Sunbelt Mobile Manufacturing', 'SMM - Sunbelt Mobile Manufacturing', 'Mobile', 'AL', 'South', '3456 Production Dr', '36601', true),
  ('SNB', 'Sunbelt Corporate', 'Sunbelt National HQ', 'SNB - Corporate', 'Dallas', 'TX', 'Central', '100 Corporate Way', '75001', true)
ON CONFLICT (code) DO UPDATE SET
  short_name = EXCLUDED.short_name,
  full_name = EXCLUDED.full_name,
  display_value = EXCLUDED.display_value,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  region = EXCLUDED.region,
  is_active = EXCLUDED.is_active;

SELECT 'Step 2: All factories created/updated (10 factories)' AS status;

-- ############################################################################
-- STEP 3: UPDATE ALL USERS' FACTORY_ID AND VERIFY ROLES
-- ############################################################################

DO $$
DECLARE
  v_updated INTEGER := 0;
  v_user RECORD;
BEGIN
  -- Update factory_id for all users based on their factory code
  UPDATE users u
  SET factory_id = f.id
  FROM factories f
  WHERE u.factory = f.code
    AND (u.factory_id IS NULL OR u.factory_id != f.id);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Updated factory_id for % users', v_updated;

  -- Assign default factory (NWBS) to corporate users without factory
  UPDATE users
  SET factory = 'NWBS',
      factory_id = (SELECT id FROM factories WHERE code = 'NWBS')
  WHERE (factory IS NULL OR factory = '')
    AND is_active = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE NOTICE 'Assigned NWBS factory to % users without factory', v_updated;
  END IF;

  -- Log all active users for debugging
  RAISE NOTICE '=== ACTIVE USERS IN DATABASE ===';
  FOR v_user IN
    SELECT name, email, role, factory, factory_id IS NOT NULL AS has_factory_id
    FROM users
    WHERE is_active = true
    ORDER BY role, name
  LOOP
    RAISE NOTICE 'User: % | Email: % | Role: % | Factory: % | Has factory_id: %',
      v_user.name, v_user.email, v_user.role, v_user.factory, v_user.has_factory_id;
  END LOOP;
  RAISE NOTICE '=================================';

END $$;

SELECT 'Step 3: User factory_id values updated' AS status;

-- ############################################################################
-- STEP 4: CREATE WORKFLOW STATIONS (CLEANED - NO DUPLICATES)
-- ############################################################################

DELETE FROM project_workflow_status;
DELETE FROM workflow_stations;

INSERT INTO workflow_stations (station_key, name, description, phase, display_order, default_owner, is_required, is_active) VALUES
  -- PHASE 1: INITIATION (2 stations) - Sequential
  ('sales_handoff', 'Sales Handoff', 'Transfer from Sales to PM team', 1, 1, 'pm', true, true),
  ('kickoff', 'Kickoff Meeting', 'Initial project kickoff with dealer', 1, 2, 'pm', true, true),

  -- PHASE 2: PRECONSTRUCTION (8 stations) - Mixed parallel paths
  -- PATH A: Drawings (Sequential)
  ('drawings_20', '20% Drawings', 'Preliminary design drawings', 2, 1, 'drafting', true, true),
  ('drawings_65', '65% Drawings', 'Development drawings', 2, 2, 'drafting', true, true),
  ('drawings_95', '95% Drawings', 'Near-final drawings for review', 2, 3, 'drafting', true, true),
  ('drawings_100', '100% Drawings', 'Final construction documents', 2, 4, 'drafting', true, true),
  -- PATH B-D: Parallel to Drawings
  ('color_selections', 'Color Selections', 'Dealer color and finish selections (parallel)', 2, 5, 'dealer', true, true),
  ('long_lead_items', 'Long Lead Items', 'Equipment with extended lead times (parallel)', 2, 6, 'procurement', true, true),
  ('cutsheets', 'Cutsheet Submittals', 'Equipment cutsheet approvals (parallel)', 2, 7, 'dealer', true, true),

  -- PHASE 3: APPROVALS (4 stations) - Can kick back
  ('engineering', 'Engineering Review', 'Structural and systems review (can kick back)', 3, 1, 'engineering', true, true),
  ('third_party', 'Third Party Review', 'External plan review if required (can kick back)', 3, 2, 'engineering', false, true),
  ('state_approval', 'State Approval', 'State agency approval for Seals/Tags', 3, 3, 'pm', true, true),
  ('production_release', 'Production Release', 'Release to production - GATE STATION', 3, 4, 'pm', true, true),

  -- PHASE 4: PRODUCTION & CLOSEOUT (6 stations)
  ('production', 'Production', 'Module fabrication', 4, 1, 'production', true, true),
  ('qc_inspection', 'QC Inspection', 'Quality control review', 4, 2, 'quality', true, true),
  ('staging', 'Staging', 'Prepared for transport', 4, 3, 'production', true, true),
  ('delivery', 'Delivery', 'Transport to site', 4, 4, 'pm', true, true),
  ('set_complete', 'Set Complete', 'Installation complete on site (dealer tracks)', 4, 5, 'pm', true, true),
  ('closeout', 'Project Closeout', 'Final documentation and warranty', 4, 6, 'pm', true, true);

SELECT 'Step 4: Workflow stations created (19 stations - no duplicates)' AS status;

-- ############################################################################
-- STEP 4B: CREATE STATION TEMPLATES (12 PRODUCTION LINE STAGES)
-- ############################################################################
-- These are the FACTORY production line stations (different from PM workflow stations)
-- Required for Plant Manager Dashboard to show modules at stations

-- Create table if not exists
CREATE TABLE IF NOT EXISTS station_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30) NOT NULL,
  description TEXT,
  order_num INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  requires_inspection BOOLEAN DEFAULT false,
  is_inspection_station BOOLEAN DEFAULT false,
  duration_defaults JSONB DEFAULT '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',
  checklist JSONB DEFAULT '[]',
  min_crew_size INTEGER DEFAULT 1,
  max_crew_size INTEGER DEFAULT 10,
  recommended_crew_size INTEGER DEFAULT 3,
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear existing global templates and recreate
DELETE FROM station_templates WHERE factory_id IS NULL;

-- Insert the 12 production line stages (global templates, factory_id = NULL)
INSERT INTO station_templates (name, code, description, order_num, requires_inspection, is_inspection_station, color, duration_defaults, checklist)
VALUES
  ('Metal Frame Welding', 'FRAME_WELD', 'Heavy steel frame welding in off-line bay', 1, false, false, '#ef4444',
   '{"stock": 6.0, "fleet": 6.0, "government": 8.0, "custom": 10.0}',
   '[{"q": "Welds inspected visually?", "type": "bool"}, {"q": "Frame square within tolerance?", "type": "bool"}]'),

  ('Rough Carpentry', 'ROUGH_CARP', 'Walls, roof framing, studs, joists', 2, false, false, '#f97316',
   '{"stock": 8.0, "fleet": 8.0, "government": 10.0, "custom": 12.0}',
   '[{"q": "Studs plumb?", "type": "bool"}, {"q": "Headers properly sized?", "type": "bool"}]'),

  ('Exterior Siding/Sheathing', 'EXT_SIDING', 'Seal outside - sheathing and siding', 3, false, false, '#eab308',
   '{"stock": 6.0, "fleet": 6.0, "government": 8.0, "custom": 10.0}',
   '[{"q": "Weather barrier installed?", "type": "bool"}, {"q": "Siding secured properly?", "type": "bool"}]'),

  ('Interior Rough-out', 'INT_ROUGH', 'Insulation, vapor barrier, windows', 4, false, false, '#84cc16',
   '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',
   '[{"q": "Insulation R-value correct?", "type": "bool"}, {"q": "Vapor barrier sealed?", "type": "bool"}]'),

  ('Electrical Rough-in', 'ELEC_ROUGH', 'Electrical wiring and boxes', 5, true, false, '#22c55e',
   '{"stock": 6.0, "fleet": 6.0, "government": 8.0, "custom": 10.0}',
   '[{"q": "Wire gauge correct?", "type": "bool"}, {"q": "Boxes secured?", "type": "bool"}, {"q": "Circuits labeled?", "type": "bool"}]'),

  ('Plumbing Rough-in', 'PLUMB_ROUGH', 'Plumbing lines and fixtures rough-in', 6, true, false, '#14b8a6',
   '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',
   '[{"q": "Pressure test passed?", "type": "bool"}, {"q": "Proper slope on drains?", "type": "bool"}]'),

  ('HVAC Install', 'HVAC', 'HVAC system installation', 7, true, false, '#06b6d4',
   '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',
   '[{"q": "Ductwork sealed?", "type": "bool"}, {"q": "Unit properly mounted?", "type": "bool"}]'),

  ('In-Wall Inspection', 'INWALL_INSP', 'Configurable inspection after rough-in', 8, false, true, '#0ea5e9',
   '{"stock": 2.0, "fleet": 2.0, "government": 4.0, "custom": 4.0}',
   '[{"q": "Electrical inspection passed?", "type": "bool"}, {"q": "Plumbing inspection passed?", "type": "bool"}, {"q": "HVAC inspection passed?", "type": "bool"}]'),

  ('Interior Finish', 'INT_FINISH', 'Tape, mud, paint, flooring, trim', 9, false, false, '#6366f1',
   '{"stock": 10.0, "fleet": 10.0, "government": 12.0, "custom": 16.0}',
   '[{"q": "Drywall finish level acceptable?", "type": "bool"}, {"q": "Paint coverage complete?", "type": "bool"}, {"q": "Flooring installed correctly?", "type": "bool"}]'),

  ('Final State Inspection', 'FINAL_INSP', 'End of line state inspection', 10, false, true, '#8b5cf6',
   '{"stock": 2.0, "fleet": 2.0, "government": 4.0, "custom": 4.0}',
   '[{"q": "All systems operational?", "type": "bool"}, {"q": "Safety devices installed?", "type": "bool"}, {"q": "Documentation complete?", "type": "bool"}]'),

  ('Staging', 'STAGING', 'Pre-pickup staging area', 11, false, false, '#a855f7',
   '{"stock": 1.0, "fleet": 1.0, "government": 2.0, "custom": 2.0}',
   '[{"q": "Final clean complete?", "type": "bool"}, {"q": "Paperwork ready?", "type": "bool"}]'),

  ('Dealer Pickup', 'PICKUP', 'Ready for dealer transport', 12, false, false, '#ec4899',
   '{"stock": 0.5, "fleet": 0.5, "government": 1.0, "custom": 1.0}',
   '[{"q": "Bill of lading signed?", "type": "bool"}, {"q": "Photos taken?", "type": "bool"}]');

SELECT 'Step 4B: Station templates created (12 production line stages)' AS status;

-- ############################################################################
-- STEP 5: ENSURE PROJECT_WORKFLOW_STATUS TABLE EXISTS
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

SELECT 'Step 5: project_workflow_status table ensured' AS status;

-- ############################################################################
-- STEP 5B: ENSURE PROJECTS TABLE HAS is_pm_job COLUMN
-- ############################################################################
-- This column distinguishes PM-managed projects from PC-managed STOCK jobs

ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_pm_job BOOLEAN DEFAULT true;

-- Update existing projects based on building_type
UPDATE projects SET is_pm_job = (building_type != 'STOCK') WHERE is_pm_job IS NULL;

SELECT 'Step 5B: is_pm_job column ensured on projects table' AS status;

-- ############################################################################
-- STEP 6: CREATE PROJECTS - DISTRIBUTED BY REQUIREMENTS
-- ############################################################################
-- 25+ projects across ALL factories
-- PM clustering: Matthew (NWBS primary, WM-EVERGREEN secondary, SMM tertiary)
-- Each PM gets 4+ projects with backup PM assigned
-- PCs handle STOCK jobs at their factories

DO $$
DECLARE
  -- Factory IDs
  v_nwbs_id UUID;
  v_pmi_id UUID;
  v_wm_evergreen_id UUID;
  v_wm_east_id UUID;
  v_wm_south_id UUID;
  v_wm_rochester_id UUID;
  v_amt_id UUID;
  v_smm_id UUID;
  v_ssi_id UUID;

  -- User IDs - PMs
  v_matthew_id UUID;
  v_crystal_id UUID;
  v_michael_id UUID;
  v_hector_id UUID;
  v_candy_id UUID;

  -- User IDs - PCs
  v_dawn_id UUID;
  v_juanita_id UUID;

  -- Counters
  v_pm_count INTEGER := 0;
  v_pc_count INTEGER := 0;
  v_total_projects INTEGER := 0;

  -- Fallback user
  v_fallback_id UUID;
BEGIN
  -- ============================================================================
  -- GET FACTORY IDs
  -- ============================================================================
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS';
  SELECT id INTO v_pmi_id FROM factories WHERE code = 'PMI';
  SELECT id INTO v_wm_evergreen_id FROM factories WHERE code = 'WM-EVERGREEN';
  SELECT id INTO v_wm_east_id FROM factories WHERE code = 'WM-EAST';
  SELECT id INTO v_wm_south_id FROM factories WHERE code = 'WM-SOUTH';
  SELECT id INTO v_wm_rochester_id FROM factories WHERE code = 'WM-ROCHESTER';
  SELECT id INTO v_amt_id FROM factories WHERE code = 'AMT';
  SELECT id INTO v_smm_id FROM factories WHERE code = 'SMM';
  SELECT id INTO v_ssi_id FROM factories WHERE code = 'SSI';

  IF v_nwbs_id IS NULL THEN
    RAISE EXCEPTION 'NWBS factory not found!';
  END IF;

  -- ============================================================================
  -- FIND USERS BY EMAIL PATTERN (More reliable than role matching)
  -- ============================================================================

  -- Find Matthew McDaniel
  SELECT id INTO v_matthew_id FROM users
  WHERE (LOWER(name) LIKE '%matthew%' AND LOWER(name) LIKE '%mcdaniel%')
     OR LOWER(email) LIKE '%matthew%mcdaniel%'
     OR LOWER(email) LIKE '%mmcdaniel%'
  LIMIT 1;

  -- Find Crystal James
  SELECT id INTO v_crystal_id FROM users
  WHERE (LOWER(name) LIKE '%crystal%' AND LOWER(name) LIKE '%james%')
     OR LOWER(email) LIKE '%crystal%'
  LIMIT 1;

  -- Find Michael (PM)
  SELECT id INTO v_michael_id FROM users
  WHERE LOWER(name) LIKE '%michael%'
    AND (role = 'PM' OR LOWER(email) LIKE '%sunbeltmodular%')
  LIMIT 1;

  -- Find Hector (PM)
  SELECT id INTO v_hector_id FROM users
  WHERE LOWER(name) LIKE '%hector%'
    AND (role = 'PM' OR LOWER(email) LIKE '%sunbeltmodular%')
  LIMIT 1;

  -- Find Candy Nelson (Director)
  SELECT id INTO v_candy_id FROM users
  WHERE (LOWER(name) LIKE '%candy%' AND LOWER(name) LIKE '%nelson%')
     OR LOWER(email) LIKE '%candy%'
  LIMIT 1;

  -- Find Dawn (PC at NWBS)
  SELECT id INTO v_dawn_id FROM users
  WHERE LOWER(name) LIKE '%dawn%'
     OR (LOWER(email) LIKE '%nwbsinc%' AND role = 'PC')
  LIMIT 1;

  -- Find Juanita (PC at PMI)
  SELECT id INTO v_juanita_id FROM users
  WHERE LOWER(name) LIKE '%juanita%'
     OR (LOWER(email) LIKE '%phoenixmodular%' AND role = 'PC')
  LIMIT 1;

  -- ============================================================================
  -- FALLBACK: If no specific users found, use any active user
  -- ============================================================================
  SELECT id INTO v_fallback_id FROM users WHERE is_active = true LIMIT 1;

  IF v_fallback_id IS NULL THEN
    RAISE EXCEPTION 'No active users found! Please log in at least once.';
  END IF;

  -- Apply fallbacks
  v_matthew_id := COALESCE(v_matthew_id, v_fallback_id);
  v_crystal_id := COALESCE(v_crystal_id, v_matthew_id);
  v_michael_id := COALESCE(v_michael_id, v_matthew_id);
  v_hector_id := COALESCE(v_hector_id, v_matthew_id);
  v_candy_id := COALESCE(v_candy_id, v_matthew_id);
  v_dawn_id := COALESCE(v_dawn_id, v_matthew_id);
  v_juanita_id := COALESCE(v_juanita_id, v_matthew_id);

  RAISE NOTICE '=== USER ASSIGNMENTS ===';
  RAISE NOTICE 'Matthew: %', v_matthew_id;
  RAISE NOTICE 'Crystal: %', v_crystal_id;
  RAISE NOTICE 'Michael: %', v_michael_id;
  RAISE NOTICE 'Hector: %', v_hector_id;
  RAISE NOTICE 'Candy: %', v_candy_id;
  RAISE NOTICE 'Dawn (PC): %', v_dawn_id;
  RAISE NOTICE 'Juanita (PC): %', v_juanita_id;
  RAISE NOTICE '========================';

  -- ============================================================================
  -- MATTHEW'S PROJECTS (6 total: 3 NWBS, 2 WM-EVERGREEN, 1 SMM)
  -- ============================================================================

  -- MATTHEW - NWBS Project 1 (Phase 4 - Production)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'NWBS-26-001', 'Boise School District Admin Building', 'NWBS', v_nwbs_id,
    'GOVERNMENT', 'In Progress', 'On Track', 4, 1850000.00,
    v_matthew_id, v_matthew_id, v_crystal_id, 8,
    CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE - INTERVAL '120 days',
    'Boise Independent School District', 'ID'
  );
  v_pm_count := v_pm_count + 1;

  -- MATTHEW - NWBS Project 2 (Phase 3 - Approvals)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'NWBS-26-002', 'Idaho State University Research Labs', 'NWBS', v_nwbs_id,
    'GOVERNMENT', 'In Progress', 'At Risk', 3, 2100000.00,
    v_matthew_id, v_matthew_id, v_michael_id, 10,
    CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE - INTERVAL '90 days',
    'Idaho State University', 'ID'
  );
  v_pm_count := v_pm_count + 1;

  -- MATTHEW - NWBS Project 3 (Phase 2 - Preconstruction)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'NWBS-26-003', 'Boeing Everett Support Facility', 'NWBS', v_nwbs_id,
    'CUSTOM', 'In Progress', 'On Track', 2, 1650000.00,
    v_matthew_id, v_matthew_id, v_hector_id, 6,
    CURRENT_DATE + INTERVAL '90 days', CURRENT_DATE - INTERVAL '45 days',
    'The Boeing Company', 'WA'
  );
  v_pm_count := v_pm_count + 1;

  -- MATTHEW - WM-EVERGREEN Project 1 (Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'WME-26-001', 'Microsoft Redmond Campus Expansion', 'WM-EVERGREEN', v_wm_evergreen_id,
    'CUSTOM', 'In Progress', 'On Track', 3, 2400000.00,
    v_matthew_id, v_matthew_id, v_candy_id, 12,
    CURRENT_DATE + INTERVAL '75 days', CURRENT_DATE - INTERVAL '100 days',
    'Microsoft Corporation', 'WA'
  );
  v_pm_count := v_pm_count + 1;

  -- MATTHEW - WM-EVERGREEN Project 2 (Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'WME-26-002', 'Amazon Tacoma Distribution Center', 'WM-EVERGREEN', v_wm_evergreen_id,
    'CUSTOM', 'In Progress', 'On Track', 2, 1800000.00,
    v_matthew_id, v_matthew_id, v_crystal_id, 8,
    CURRENT_DATE + INTERVAL '100 days', CURRENT_DATE - INTERVAL '30 days',
    'Amazon.com Services LLC', 'WA'
  );
  v_pm_count := v_pm_count + 1;

  -- MATTHEW - SMM Project (Phase 1)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'SMM-26-001', 'Gulf Coast Medical Clinic', 'SMM', v_smm_id,
    'CUSTOM', 'In Progress', 'On Track', 1, 980000.00,
    v_matthew_id, v_matthew_id, v_michael_id, 4,
    CURRENT_DATE + INTERVAL '150 days', CURRENT_DATE - INTERVAL '10 days',
    'Mobile Health Partners', 'AL'
  );
  v_pm_count := v_pm_count + 1;

  RAISE NOTICE 'Created 6 projects for Matthew (NWBS primary, WM-EVERGREEN secondary, SMM tertiary)';

  -- ============================================================================
  -- CRYSTAL'S PROJECTS (5 total: 3 PMI, 2 WM-SOUTH)
  -- ============================================================================

  -- CRYSTAL - PMI Project 1 (Phase 4)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'PMI-26-001', 'Phoenix VA Medical Center Expansion', 'PMI', v_pmi_id,
    'GOVERNMENT', 'In Progress', 'On Track', 4, 2800000.00,
    v_crystal_id, v_crystal_id, v_matthew_id, 14,
    CURRENT_DATE + INTERVAL '21 days', CURRENT_DATE - INTERVAL '150 days',
    'US Department of Veterans Affairs', 'AZ'
  );
  v_pm_count := v_pm_count + 1;

  -- CRYSTAL - PMI Project 2 (Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'PMI-26-002', 'Arizona State Prison Admin Complex', 'PMI', v_pmi_id,
    'GOVERNMENT', 'In Progress', 'At Risk', 3, 1950000.00,
    v_crystal_id, v_crystal_id, v_hector_id, 8,
    CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE - INTERVAL '85 days',
    'Arizona Department of Corrections', 'AZ'
  );
  v_pm_count := v_pm_count + 1;

  -- CRYSTAL - PMI Project 3 (Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'PMI-26-003', 'Intel Chandler Fab Support Building', 'PMI', v_pmi_id,
    'CUSTOM', 'In Progress', 'On Track', 2, 1400000.00,
    v_crystal_id, v_crystal_id, v_candy_id, 6,
    CURRENT_DATE + INTERVAL '110 days', CURRENT_DATE - INTERVAL '40 days',
    'Intel Corporation', 'AZ'
  );
  v_pm_count := v_pm_count + 1;

  -- CRYSTAL - WM-SOUTH Project 1 (Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'WMS-26-001', 'Houston ISD Portable Classrooms', 'WM-SOUTH', v_wm_south_id,
    'GOVERNMENT', 'In Progress', 'On Track', 3, 1200000.00,
    v_crystal_id, v_crystal_id, v_michael_id, 6,
    CURRENT_DATE + INTERVAL '55 days', CURRENT_DATE - INTERVAL '70 days',
    'Houston Independent School District', 'TX'
  );
  v_pm_count := v_pm_count + 1;

  -- CRYSTAL - WM-SOUTH Project 2 (Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'WMS-26-002', 'Dallas County Detention Annex', 'WM-SOUTH', v_wm_south_id,
    'GOVERNMENT', 'In Progress', 'On Track', 2, 1750000.00,
    v_crystal_id, v_crystal_id, v_hector_id, 8,
    CURRENT_DATE + INTERVAL '95 days', CURRENT_DATE - INTERVAL '35 days',
    'Dallas County', 'TX'
  );
  v_pm_count := v_pm_count + 1;

  RAISE NOTICE 'Created 5 projects for Crystal (PMI primary, WM-SOUTH secondary)';

  -- ============================================================================
  -- MICHAEL'S PROJECTS (5 total: 3 WM-EAST, 2 WM-ROCHESTER)
  -- ============================================================================

  -- MICHAEL - WM-EAST Project 1 (Phase 4)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'WME-26-003', 'Charlotte DOT Regional Office', 'WM-EAST', v_wm_east_id,
    'GOVERNMENT', 'In Progress', 'On Track', 4, 1600000.00,
    v_michael_id, v_michael_id, v_candy_id, 8,
    CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE - INTERVAL '130 days',
    'NC Department of Transportation', 'NC'
  );
  v_pm_count := v_pm_count + 1;

  -- MICHAEL - WM-EAST Project 2 (Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'WME-26-004', 'Duke Energy Field Operations', 'WM-EAST', v_wm_east_id,
    'CUSTOM', 'In Progress', 'At Risk', 3, 1350000.00,
    v_michael_id, v_michael_id, v_matthew_id, 6,
    CURRENT_DATE + INTERVAL '50 days', CURRENT_DATE - INTERVAL '80 days',
    'Duke Energy Corporation', 'NC'
  );
  v_pm_count := v_pm_count + 1;

  -- MICHAEL - WM-EAST Project 3 (Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'WME-26-005', 'Bank of America Data Center Support', 'WM-EAST', v_wm_east_id,
    'CUSTOM', 'In Progress', 'On Track', 2, 1100000.00,
    v_michael_id, v_michael_id, v_crystal_id, 5,
    CURRENT_DATE + INTERVAL '85 days', CURRENT_DATE - INTERVAL '25 days',
    'Bank of America', 'NC'
  );
  v_pm_count := v_pm_count + 1;

  -- MICHAEL - WM-ROCHESTER Project 1 (Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'WMR-26-001', 'Rochester City Schools Admin', 'WM-ROCHESTER', v_wm_rochester_id,
    'GOVERNMENT', 'In Progress', 'On Track', 3, 1450000.00,
    v_michael_id, v_michael_id, v_hector_id, 7,
    CURRENT_DATE + INTERVAL '65 days', CURRENT_DATE - INTERVAL '75 days',
    'Rochester City School District', 'NY'
  );
  v_pm_count := v_pm_count + 1;

  -- MICHAEL - WM-ROCHESTER Project 2 (Phase 1)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'WMR-26-002', 'Kodak Industrial Complex Support', 'WM-ROCHESTER', v_wm_rochester_id,
    'CUSTOM', 'In Progress', 'On Track', 1, 890000.00,
    v_michael_id, v_michael_id, v_candy_id, 4,
    CURRENT_DATE + INTERVAL '140 days', CURRENT_DATE - INTERVAL '5 days',
    'Eastman Kodak Company', 'NY'
  );
  v_pm_count := v_pm_count + 1;

  RAISE NOTICE 'Created 5 projects for Michael (WM-EAST primary, WM-ROCHESTER secondary)';

  -- ============================================================================
  -- HECTOR'S PROJECTS (5 total: 3 AMT, 2 SSI)
  -- ============================================================================

  -- HECTOR - AMT Project 1 (Phase 4)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'AMT-26-001', 'Austin ISD Temporary Classrooms', 'AMT', v_amt_id,
    'GOVERNMENT', 'In Progress', 'On Track', 4, 1550000.00,
    v_hector_id, v_hector_id, v_crystal_id, 8,
    CURRENT_DATE + INTERVAL '18 days', CURRENT_DATE - INTERVAL '140 days',
    'Austin Independent School District', 'TX'
  );
  v_pm_count := v_pm_count + 1;

  -- HECTOR - AMT Project 2 (Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'AMT-26-002', 'Tesla Gigafactory Support Building', 'AMT', v_amt_id,
    'CUSTOM', 'In Progress', 'At Risk', 3, 2200000.00,
    v_hector_id, v_hector_id, v_matthew_id, 10,
    CURRENT_DATE + INTERVAL '40 days', CURRENT_DATE - INTERVAL '95 days',
    'Tesla Inc', 'TX'
  );
  v_pm_count := v_pm_count + 1;

  -- HECTOR - AMT Project 3 (Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'AMT-26-003', 'Samsung Austin Semiconductor Office', 'AMT', v_amt_id,
    'CUSTOM', 'In Progress', 'On Track', 2, 1300000.00,
    v_hector_id, v_hector_id, v_michael_id, 6,
    CURRENT_DATE + INTERVAL '105 days', CURRENT_DATE - INTERVAL '30 days',
    'Samsung Austin Semiconductor', 'TX'
  );
  v_pm_count := v_pm_count + 1;

  -- HECTOR - SSI Project 1 (Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'SSI-26-001', 'Idaho National Lab Security Post', 'SSI', v_ssi_id,
    'GOVERNMENT', 'In Progress', 'On Track', 2, 1050000.00,
    v_hector_id, v_hector_id, v_candy_id, 5,
    CURRENT_DATE + INTERVAL '80 days', CURRENT_DATE - INTERVAL '50 days',
    'Idaho National Laboratory', 'ID'
  );
  v_pm_count := v_pm_count + 1;

  -- HECTOR - SSI Project 2 (Phase 1)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'SSI-26-002', 'Micron Technology Field Office', 'SSI', v_ssi_id,
    'CUSTOM', 'In Progress', 'On Track', 1, 750000.00,
    v_hector_id, v_hector_id, v_matthew_id, 3,
    CURRENT_DATE + INTERVAL '160 days', CURRENT_DATE - INTERVAL '7 days',
    'Micron Technology Inc', 'ID'
  );
  v_pm_count := v_pm_count + 1;

  RAISE NOTICE 'Created 5 projects for Hector (AMT primary, SSI secondary)';

  -- ============================================================================
  -- CANDY'S PROJECTS (3 total - Director also wears PM hat)
  -- ============================================================================

  -- CANDY - NWBS Project (Phase 4)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'NWBS-26-004', 'US Forest Service Regional HQ', 'NWBS', v_nwbs_id,
    'GOVERNMENT', 'In Progress', 'On Track', 4, 2050000.00,
    v_candy_id, v_candy_id, v_matthew_id, 10,
    CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE - INTERVAL '135 days',
    'US Forest Service', 'ID'
  );
  v_pm_count := v_pm_count + 1;

  -- CANDY - PMI Project (Phase 3)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'PMI-26-004', 'Grand Canyon NP Visitor Center', 'PMI', v_pmi_id,
    'GOVERNMENT', 'In Progress', 'On Track', 3, 1800000.00,
    v_candy_id, v_candy_id, v_crystal_id, 9,
    CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE - INTERVAL '90 days',
    'National Park Service', 'AZ'
  );
  v_pm_count := v_pm_count + 1;

  -- CANDY - WM-EVERGREEN Project (Phase 2)
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'WME-26-006', 'Starbucks Reserve Roastery Support', 'WM-EVERGREEN', v_wm_evergreen_id,
    'CUSTOM', 'In Progress', 'At Risk', 2, 1250000.00,
    v_candy_id, v_candy_id, v_hector_id, 5,
    CURRENT_DATE + INTERVAL '115 days', CURRENT_DATE - INTERVAL '20 days',
    'Starbucks Corporation', 'WA'
  );
  v_pm_count := v_pm_count + 1;

  RAISE NOTICE 'Created 3 projects for Candy (Director with PM duties)';

  -- ============================================================================
  -- PC STOCK PROJECTS (Dawn at NWBS, Juanita at PMI)
  -- ============================================================================

  -- DAWN - NWBS Stock Project 1
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'NWBS-26-S01', 'United Rentals Fleet Order - Boise', 'NWBS', v_nwbs_id,
    'STOCK', 'In Progress', 'On Track', 4, 285000.00,
    v_dawn_id, NULL, NULL, 3,
    CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE - INTERVAL '60 days',
    'United Rentals', 'ID'
  );
  v_pc_count := v_pc_count + 1;

  -- DAWN - NWBS Stock Project 2
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'NWBS-26-S02', 'ModSpace Standard Office Pack', 'NWBS', v_nwbs_id,
    'STOCK', 'In Progress', 'On Track', 3, 320000.00,
    v_dawn_id, NULL, NULL, 3,
    CURRENT_DATE + INTERVAL '35 days', CURRENT_DATE - INTERVAL '40 days',
    'ModSpace', 'ID'
  );
  v_pc_count := v_pc_count + 1;

  -- DAWN - NWBS Stock Project 3
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'NWBS-26-S03', 'Williams Scotsman Classroom Units', 'NWBS', v_nwbs_id,
    'STOCK', 'In Progress', 'At Risk', 2, 380000.00,
    v_dawn_id, NULL, NULL, 4,
    CURRENT_DATE + INTERVAL '50 days', CURRENT_DATE - INTERVAL '25 days',
    'Williams Scotsman', 'WA'
  );
  v_pc_count := v_pc_count + 1;

  RAISE NOTICE 'Created 3 STOCK projects for Dawn (PC at NWBS)';

  -- JUANITA - PMI Stock Project 1
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'PMI-26-S01', 'ATCO Site Office Pack - Phoenix', 'PMI', v_pmi_id,
    'STOCK', 'In Progress', 'On Track', 3, 295000.00,
    v_juanita_id, NULL, NULL, 3,
    CURRENT_DATE + INTERVAL '28 days', CURRENT_DATE - INTERVAL '50 days',
    'ATCO Structures', 'AZ'
  );
  v_pc_count := v_pc_count + 1;

  -- JUANITA - PMI Stock Project 2
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'PMI-26-S02', 'Mobile Mini Construction Trailer', 'PMI', v_pmi_id,
    'STOCK', 'In Progress', 'On Track', 2, 180000.00,
    v_juanita_id, NULL, NULL, 2,
    CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE - INTERVAL '20 days',
    'Mobile Mini', 'AZ'
  );
  v_pc_count := v_pc_count + 1;

  -- JUANITA - PMI Stock Project 3
  INSERT INTO projects (
    project_number, name, factory, factory_id, building_type, status, health_status,
    current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count,
    target_online_date, start_date, client_name, site_state
  ) VALUES (
    'PMI-26-S03', 'Target Distribution Temp Office', 'PMI', v_pmi_id,
    'STOCK', 'In Progress', 'On Track', 4, 310000.00,
    v_juanita_id, NULL, NULL, 3,
    CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE - INTERVAL '70 days',
    'Target Corporation', 'AZ'
  );
  v_pc_count := v_pc_count + 1;

  RAISE NOTICE 'Created 3 STOCK projects for Juanita (PC at PMI)';

  v_total_projects := v_pm_count + v_pc_count;
  RAISE NOTICE '=== PROJECT CREATION COMPLETE ===';
  RAISE NOTICE 'PM Projects: %', v_pm_count;
  RAISE NOTICE 'PC/Stock Projects: %', v_pc_count;
  RAISE NOTICE 'TOTAL PROJECTS: %', v_total_projects;
  RAISE NOTICE '=================================';

END $$;

-- Set is_pm_job based on building_type for all newly created projects
UPDATE projects SET is_pm_job = (building_type != 'STOCK');

SELECT 'Step 6: 30 projects created across all factories and users' AS status;

-- ############################################################################
-- STEP 7: CREATE PLANT CONFIG FOR FACTORIES WITH PRODUCTION
-- ############################################################################

INSERT INTO plant_config (factory_id, time_settings, efficiency_modules)
SELECT
  id,
  '{"shift_start": "06:00", "shift_end": "14:30", "break_minutes": 30, "lunch_minutes": 30}'::jsonb,
  '{"takt_time_tracker": true, "queue_time_monitor": true, "visual_load_board": true}'::jsonb
FROM factories WHERE code IN ('NWBS', 'PMI', 'WM-EVERGREEN', 'WM-EAST', 'WM-SOUTH', 'WM-ROCHESTER', 'AMT', 'SMM', 'SSI')
ON CONFLICT (factory_id) DO UPDATE SET
  time_settings = EXCLUDED.time_settings,
  efficiency_modules = EXCLUDED.efficiency_modules;

SELECT 'Step 7: Plant config created for all factories' AS status;

-- ############################################################################
-- STEP 8: CREATE WORKERS (~100 at NWBS - primary demo factory)
-- ############################################################################
-- Realistic distribution across 12 production stations

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_stations UUID[];
  v_station_names TEXT[] := ARRAY['Frame', 'Walls', 'Insulation', 'Roof', 'Siding', 'Exterior', 'Electrical', 'Plumbing', 'HVAC', 'Drywall', 'Paint', 'Finish'];
  v_first_names TEXT[] := ARRAY['Marcus', 'Tony', 'Robert', 'James', 'David', 'Carlos', 'Michael', 'Kevin', 'Alex', 'Brian', 'Chris', 'Daniel', 'Eric', 'Frank', 'Gary', 'Henry', 'Ivan', 'Jason', 'Kyle', 'Larry', 'Mike', 'Nick', 'Oscar', 'Paul', 'Quinn', 'Ryan', 'Steve', 'Tim', 'Victor', 'Will', 'Xavier', 'Yuri', 'Zach', 'Adam', 'Ben', 'Carl', 'Derek', 'Evan', 'Fred', 'Greg', 'Hank', 'Ian', 'Jake', 'Keith', 'Leo', 'Mark', 'Nate', 'Omar', 'Pete', 'Ray', 'Sam', 'Tom', 'Vince', 'Wade', 'Xander', 'Yosef', 'Zeke', 'Aaron', 'Blake', 'Chad', 'Drew', 'Eli', 'Felix', 'Glen', 'Hal', 'Ike', 'Joel', 'Kent', 'Luis', 'Matt', 'Ned', 'Owen', 'Phil', 'Ruben', 'Scott', 'Ted', 'Uri', 'Vern', 'Walt', 'Zane', 'Art', 'Bo', 'Curt', 'Don', 'Earl', 'Floyd', 'Gus', 'Hugh', 'Ira', 'Jim', 'Ken', 'Len', 'Moe', 'Norm', 'Otto', 'Pat', 'Rex', 'Sid', 'Troy'];
  v_last_names TEXT[] := ARRAY['Johnson', 'Martinez', 'Chen', 'Wilson', 'Thompson', 'Garcia', 'Brown', 'Davis', 'Rivera', 'Nguyen', 'Adams', 'Foster', 'Green', 'Harris', 'Ingram', 'James', 'Kelly', 'Lopez', 'Miller', 'Nelson', 'Owens', 'Patel', 'Quinn', 'Roberts', 'Smith', 'Turner', 'Valdez', 'White', 'Young', 'Zimmerman', 'Allen', 'Baker', 'Carter', 'Dixon', 'Edwards', 'Fisher', 'Gray', 'Hill', 'Jackson', 'King', 'Lee', 'Moore', 'Parker', 'Reed', 'Scott', 'Taylor', 'Walker', 'Anderson', 'Clark', 'Evans'];
  v_worker_count INTEGER := 0;
  v_station_id UUID;
  i INTEGER;
  j INTEGER;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Get all station IDs in order
  SELECT ARRAY_AGG(id ORDER BY order_num)
  INTO v_stations
  FROM station_templates
  WHERE factory_id IS NULL;

  IF v_stations IS NULL OR array_length(v_stations, 1) < 12 THEN
    RAISE WARNING 'Not enough station templates - creating workers without station assignment';
    v_stations := ARRAY[NULL::UUID];
  END IF;

  -- CREATE 12 LEAD WORKERS (1 per station)
  FOR i IN 1..LEAST(12, array_length(v_stations, 1)) LOOP
    v_station_id := v_stations[i];

    INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
    VALUES (
      v_nwbs_factory_id,
      'NWBS-L' || LPAD(i::TEXT, 3, '0'),
      v_first_names[i],
      v_last_names[i],
      v_station_names[i] || ' Lead',
      v_station_id,
      true,
      28.00 + (random() * 8),  -- $28-$36/hr for leads
      true,
      CURRENT_DATE - ((1000 + random() * 1500)::INTEGER || ' days')::INTERVAL
    )
    ON CONFLICT DO NOTHING;
    v_worker_count := v_worker_count + 1;
  END LOOP;

  RAISE NOTICE 'Created 12 lead workers';

  -- CREATE ~88 GENERAL WORKERS (7-8 per station)
  FOR i IN 1..LEAST(12, array_length(v_stations, 1)) LOOP
    v_station_id := v_stations[i];

    FOR j IN 1..7 LOOP  -- 7 workers per station = 84 workers
      INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
      VALUES (
        v_nwbs_factory_id,
        'NWBS-' || LPAD(((i-1)*10 + j + 100)::TEXT, 3, '0'),
        v_first_names[12 + ((i-1)*7 + j)],
        v_last_names[((i-1)*7 + j) % 50 + 1],
        CASE
          WHEN j <= 2 THEN v_station_names[i] || ' Technician'
          WHEN j <= 4 THEN v_station_names[i] || ' Installer'
          WHEN j <= 6 THEN v_station_names[i] || ' Helper'
          ELSE v_station_names[i] || ' Apprentice'
        END,
        v_station_id,
        false,
        18.00 + (random() * 10),  -- $18-$28/hr for crew
        CASE WHEN random() > 0.05 THEN true ELSE false END,  -- 95% active
        CURRENT_DATE - ((180 + random() * 1200)::INTEGER || ' days')::INTERVAL
      )
      ON CONFLICT DO NOTHING;
      v_worker_count := v_worker_count + 1;
    END LOOP;
  END LOOP;

  -- Add 4 QC Inspectors
  FOR i IN 1..4 LOOP
    INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
    VALUES (
      v_nwbs_factory_id,
      'NWBS-QC' || LPAD(i::TEXT, 2, '0'),
      v_first_names[90 + i],
      v_last_names[40 + i],
      CASE i
        WHEN 1 THEN 'QC Inspector - Structural'
        WHEN 2 THEN 'QC Inspector - MEP'
        WHEN 3 THEN 'QC Inspector - Final'
        ELSE 'QC Lead'
      END,
      v_stations[LEAST(12, array_length(v_stations, 1))],  -- Finish station
      i = 4,  -- QC Lead is a lead
      26.00 + (random() * 6),
      true,
      CURRENT_DATE - ((500 + random() * 1000)::INTEGER || ' days')::INTERVAL
    )
    ON CONFLICT DO NOTHING;
    v_worker_count := v_worker_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % total workers at NWBS', v_worker_count;

END $$;

SELECT 'Step 8: ~100 Workers created at NWBS' AS status;

-- ############################################################################
-- STEP 9: CREATE WORKER SHIFTS (Realistic attendance - ~80% of workforce)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_shift_count INTEGER := 0;
  v_worker RECORD;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Create active shifts for ~80% of active workers (realistic attendance)
  FOR v_worker IN
    SELECT w.id, w.factory_id, w.is_lead
    FROM workers w
    WHERE w.factory_id = v_nwbs_factory_id
      AND w.is_active = true
    ORDER BY random()
    LIMIT 80  -- ~80 workers clocked in
  LOOP
    INSERT INTO worker_shifts (worker_id, factory_id, clock_in, source, status)
    VALUES (
      v_worker.id,
      v_worker.factory_id,
      -- Leads arrive earlier, stagger arrivals between 5:45-6:30am
      CURRENT_DATE + INTERVAL '5 hours 45 minutes' +
        (CASE WHEN v_worker.is_lead THEN random() * INTERVAL '15 minutes'
              ELSE INTERVAL '15 minutes' + random() * INTERVAL '30 minutes' END),
      CASE WHEN random() > 0.7 THEN 'badge' ELSE 'kiosk' END,
      'active'
    )
    ON CONFLICT DO NOTHING;
    v_shift_count := v_shift_count + 1;
  END LOOP;

  -- Create some completed shifts from yesterday (for historical data)
  INSERT INTO worker_shifts (worker_id, factory_id, clock_in, clock_out, source, status, hours_regular, hours_ot)
  SELECT
    w.id,
    w.factory_id,
    (CURRENT_DATE - INTERVAL '1 day') + INTERVAL '6 hours' + (random() * INTERVAL '30 minutes'),
    (CURRENT_DATE - INTERVAL '1 day') + INTERVAL '14 hours 30 minutes' + (random() * INTERVAL '30 minutes'),
    'badge',
    'completed',
    8.0,
    CASE WHEN random() > 0.8 THEN 0.5 + (random() * 1.5) ELSE 0 END  -- 20% worked OT
  FROM workers w
  WHERE w.factory_id = v_nwbs_factory_id
    AND w.is_active = true
  ORDER BY random()
  LIMIT 75;

  RAISE NOTICE 'Created % active shifts today, plus 75 completed shifts from yesterday', v_shift_count;

END $$;

SELECT 'Step 9: Worker shifts created (~80 active today)' AS status;

-- ############################################################################
-- STEP 10: CREATE MODULES FOR PROJECTS IN PRODUCTION
-- ############################################################################
-- Module counts based on project complexity:
--   - $2M+ contract = 8-14 modules (large government/custom)
--   - $1M-$2M contract = 4-8 modules (medium projects)
--   - Under $1M = 2-4 modules (small/STOCK projects)
-- Module status based on project phase:
--   - Phase 4 = modules in various production stages
--   - Phase 3 = modules in queue or not started
--   - Phase 1-2 = no modules yet (still in preconstruction)

DO $$
DECLARE
  v_project RECORD;
  v_stations UUID[];
  v_num_stations INTEGER;
  v_module_count INTEGER := 0;
  v_modules_to_create INTEGER;
  v_module_status TEXT;
  v_station_idx INTEGER;
  i INTEGER;
BEGIN
  -- Get station templates
  SELECT ARRAY_AGG(id ORDER BY order_num)
  INTO v_stations
  FROM station_templates
  WHERE factory_id IS NULL;

  IF v_stations IS NULL THEN
    RAISE WARNING 'No station templates - skipping modules';
    RETURN;
  END IF;

  v_num_stations := array_length(v_stations, 1);
  RAISE NOTICE 'Found % production stations', v_num_stations;

  -- Create modules for Phase 3 and 4 projects only (modules exist once in production pipeline)
  FOR v_project IN
    SELECT p.id, p.project_number, p.name, p.factory_id, p.module_count AS target_modules,
           p.current_phase, p.contract_value, p.building_type
    FROM projects p
    WHERE p.current_phase >= 3
    ORDER BY p.project_number
  LOOP
    -- Determine how many modules to create based on contract value
    v_modules_to_create := CASE
      WHEN v_project.contract_value >= 2000000 THEN LEAST(v_project.target_modules, 10)
      WHEN v_project.contract_value >= 1000000 THEN LEAST(v_project.target_modules, 6)
      WHEN v_project.contract_value >= 500000 THEN LEAST(v_project.target_modules, 4)
      ELSE LEAST(v_project.target_modules, 3)
    END;

    -- Create modules with realistic status distribution
    FOR i IN 1..v_modules_to_create LOOP
      -- Determine module status based on project phase and module sequence
      IF v_project.current_phase = 4 THEN
        -- Phase 4: Mix of completed, in progress, and queued
        v_module_status := CASE
          WHEN i <= (v_modules_to_create * 0.2)::INTEGER THEN 'Shipped'     -- 20% shipped
          WHEN i <= (v_modules_to_create * 0.4)::INTEGER THEN 'Staged'      -- 20% staged
          WHEN i <= (v_modules_to_create * 0.7)::INTEGER THEN 'In Progress' -- 30% in progress
          ELSE 'In Queue'                                                    -- 30% queued
        END;
        -- Assign station based on status
        v_station_idx := CASE v_module_status
          WHEN 'Shipped' THEN v_num_stations      -- Last station
          WHEN 'Staged' THEN v_num_stations - 1   -- Staging
          WHEN 'In Progress' THEN GREATEST(1, v_num_stations - 2 - (i % 4))  -- Various mid stations
          ELSE 1                                   -- First station for queue
        END;
      ELSE
        -- Phase 3: All modules in queue (waiting for production release)
        v_module_status := 'In Queue';
        v_station_idx := NULL;  -- Not yet on production floor
      END IF;

      INSERT INTO modules (
        project_id, factory_id, serial_number, name, sequence_number,
        status, current_station_id, scheduled_start, scheduled_end,
        module_width, module_length, building_category, is_rush
      ) VALUES (
        v_project.id,
        v_project.factory_id,
        v_project.project_number || '-M' || LPAD(i::TEXT, 2, '0'),
        CASE i
          WHEN 1 THEN 'Main Office Module'
          WHEN 2 THEN 'Conference/Meeting Room'
          WHEN 3 THEN 'Restroom Module'
          WHEN 4 THEN 'Break Room/Kitchen'
          WHEN 5 THEN 'Storage Module'
          WHEN 6 THEN 'Entry/Reception'
          WHEN 7 THEN 'Utility/Mechanical'
          WHEN 8 THEN 'Extension Module A'
          WHEN 9 THEN 'Extension Module B'
          ELSE 'Additional Module ' || i
        END,
        i,
        v_module_status,
        CASE WHEN v_station_idx IS NOT NULL THEN v_stations[v_station_idx] ELSE NULL END,
        CURRENT_DATE - ((v_modules_to_create - i + 1) * INTERVAL '5 days'),
        CURRENT_DATE + ((i * 3) || ' days')::INTERVAL,
        CASE WHEN i % 2 = 0 THEN 14 ELSE 12 END,  -- 14' or 12' wide
        CASE WHEN v_project.contract_value >= 1500000 THEN 60 ELSE 48 END,  -- 60' or 48' long
        LOWER(v_project.building_type),
        i = 3 AND v_project.current_phase = 4  -- Mark one rush per Phase 4 project
      );
      v_module_count := v_module_count + 1;
    END LOOP;

  END LOOP;

  RAISE NOTICE 'Created % modules across all Phase 3-4 projects', v_module_count;

END $$;

SELECT 'Step 10: Modules created (proportional to project size)' AS status;

-- ############################################################################
-- STEP 10B: CREATE STATION ASSIGNMENTS FOR PLANT MANAGER DASHBOARD
-- ############################################################################
-- Links workers to modules at stations - critical for PGM dashboards

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_module RECORD;
  v_worker RECORD;
  v_assignment_count INTEGER := 0;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- For each module at NWBS that's In Progress, create station assignments
  FOR v_module IN
    SELECT m.id, m.current_station_id, m.serial_number
    FROM modules m
    WHERE m.factory_id = v_nwbs_factory_id
      AND m.status = 'In Progress'
      AND m.current_station_id IS NOT NULL
  LOOP
    -- Get a lead worker for this station
    SELECT id INTO v_worker
    FROM workers
    WHERE factory_id = v_nwbs_factory_id
      AND is_lead = true
      AND is_active = true
    ORDER BY random()
    LIMIT 1;

    IF v_worker IS NOT NULL THEN
      INSERT INTO station_assignments (
        module_id, station_id, factory_id, lead_id, crew_ids,
        status, start_time, estimated_hours, actual_hours
      ) VALUES (
        v_module.id,
        v_module.current_station_id,
        v_nwbs_factory_id,
        v_worker.id,
        ARRAY[v_worker.id],
        'In Progress',
        NOW() - INTERVAL '2 hours',
        4.0,
        2.0
      )
      ON CONFLICT DO NOTHING;
      v_assignment_count := v_assignment_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Created % station assignments for NWBS modules', v_assignment_count;

END $$;

SELECT 'Step 10B: Station assignments created' AS status;

-- ############################################################################
-- STEP 10C: CREATE QC RECORDS FOR PLANT MANAGER DASHBOARD
-- ############################################################################

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_module RECORD;
  v_inspector_id UUID;
  v_qc_count INTEGER := 0;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Get QC inspector
  SELECT id INTO v_inspector_id
  FROM workers
  WHERE factory_id = v_nwbs_factory_id
    AND LOWER(title) LIKE '%qc%'
    AND is_active = true
  LIMIT 1;

  -- Create QC records for staged modules (they passed QC)
  FOR v_module IN
    SELECT m.id, m.current_station_id, m.serial_number
    FROM modules m
    WHERE m.factory_id = v_nwbs_factory_id
      AND m.status = 'Staged'
  LOOP
    INSERT INTO qc_records (
      module_id, station_id, factory_id, inspector_id,
      status, passed, inspected_at, notes
    ) VALUES (
      v_module.id,
      v_module.current_station_id,
      v_nwbs_factory_id,
      v_inspector_id,
      'Passed',
      true,
      NOW() - INTERVAL '1 day',
      'All items passed inspection'
    )
    ON CONFLICT DO NOTHING;
    v_qc_count := v_qc_count + 1;
  END LOOP;

  -- Create some pending QC records for in-progress modules
  FOR v_module IN
    SELECT m.id, m.current_station_id, m.serial_number
    FROM modules m
    WHERE m.factory_id = v_nwbs_factory_id
      AND m.status = 'In Progress'
    LIMIT 2
  LOOP
    INSERT INTO qc_records (
      module_id, station_id, factory_id, inspector_id,
      status, passed, inspected_at, notes
    ) VALUES (
      v_module.id,
      v_module.current_station_id,
      v_nwbs_factory_id,
      v_inspector_id,
      'Pending',
      NULL,  -- Pending
      NOW(),
      'Inspection scheduled'
    )
    ON CONFLICT DO NOTHING;
    v_qc_count := v_qc_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % QC records for NWBS modules', v_qc_count;

END $$;

SELECT 'Step 10C: QC records created' AS status;

-- ############################################################################
-- STEP 10D: CREATE HISTORICAL STATION ASSIGNMENTS (For Takt Time Analytics)
-- ############################################################################
-- Create 2 weeks of historical station data for trends/forecasting demo

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_stations UUID[];
  v_station_names TEXT[];
  v_module RECORD;
  v_day INTEGER;
  v_station_idx INTEGER;
  v_lead_id UUID;
  v_crew_ids UUID[];
  v_target_hours NUMERIC;
  v_actual_hours NUMERIC;
  v_variance NUMERIC;
  v_history_count INTEGER := 0;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Get station templates
  SELECT ARRAY_AGG(id ORDER BY order_num), ARRAY_AGG(name ORDER BY order_num)
  INTO v_stations, v_station_names
  FROM station_templates WHERE factory_id IS NULL;

  IF v_stations IS NULL THEN RETURN; END IF;

  -- For completed and staged modules, create historical station progression
  FOR v_module IN
    SELECT m.id, m.serial_number, m.sequence_number, m.factory_id
    FROM modules m
    WHERE m.factory_id = v_nwbs_factory_id
      AND m.status IN ('Staged', 'Shipped')
    LIMIT 10  -- Historical data for 10 completed modules
  LOOP
    -- Each module progressed through multiple stations over 2 weeks
    FOR v_station_idx IN 1..8 LOOP  -- First 8 stations completed
      -- Randomly select a lead for this assignment
      SELECT id INTO v_lead_id
      FROM workers
      WHERE factory_id = v_nwbs_factory_id AND is_lead = true
      ORDER BY random() LIMIT 1;

      -- Calculate timing (target vs actual with realistic variance)
      v_target_hours := 3.5 + (random() * 2.0);  -- 3.5-5.5 hours target
      v_variance := (random() * 0.6) - 0.2;  -- -20% to +40% variance
      v_actual_hours := v_target_hours * (1 + v_variance);

      -- Calculate day (earlier stations = more days ago)
      v_day := (10 - v_station_idx) + v_module.sequence_number;

      INSERT INTO station_assignments (
        module_id, station_id, factory_id, lead_id, crew_ids,
        status, start_time, end_time, estimated_hours, actual_hours
      ) VALUES (
        v_module.id,
        v_stations[v_station_idx],
        v_nwbs_factory_id,
        v_lead_id,
        ARRAY[v_lead_id],
        'Completed',
        (CURRENT_DATE - (v_day || ' days')::INTERVAL) + INTERVAL '6 hours',
        (CURRENT_DATE - (v_day || ' days')::INTERVAL) + INTERVAL '6 hours' + (v_actual_hours || ' hours')::INTERVAL,
        ROUND(v_target_hours::NUMERIC, 1),
        ROUND(v_actual_hours::NUMERIC, 1)
      )
      ON CONFLICT DO NOTHING;
      v_history_count := v_history_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created % historical station assignments for takt time analytics', v_history_count;

END $$;

SELECT 'Step 10D: Historical takt time data created' AS status;

-- ############################################################################
-- STEP 10E: CREATE HISTORICAL WORKER SHIFTS (For Efficiency Trends)
-- ############################################################################
-- 2 weeks of shift history for personnel metrics and attendance trends

DO $$
DECLARE
  v_nwbs_factory_id UUID;
  v_day_offset INTEGER;
  v_workers_for_day INTEGER;
  v_shift_count INTEGER := 0;
BEGIN
  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS';

  -- Create shifts for past 14 days (excluding weekends)
  FOR v_day_offset IN 2..15 LOOP
    -- Skip weekends (rough approximation)
    CONTINUE WHEN EXTRACT(DOW FROM CURRENT_DATE - (v_day_offset || ' days')::INTERVAL) IN (0, 6);

    -- Vary attendance 75-90% each day
    v_workers_for_day := 70 + (random() * 20)::INTEGER;

    INSERT INTO worker_shifts (worker_id, factory_id, clock_in, clock_out, source, status, hours_regular, hours_ot)
    SELECT
      w.id,
      w.factory_id,
      (CURRENT_DATE - (v_day_offset || ' days')::INTERVAL) + INTERVAL '6 hours' + (random() * INTERVAL '30 minutes'),
      (CURRENT_DATE - (v_day_offset || ' days')::INTERVAL) + INTERVAL '14 hours 30 minutes' + (random() * INTERVAL '30 minutes'),
      CASE WHEN random() > 0.3 THEN 'badge' ELSE 'kiosk' END,
      'completed',
      8.0,
      CASE WHEN random() > 0.85 THEN ROUND((random() * 2)::NUMERIC, 1) ELSE 0 END
    FROM workers w
    WHERE w.factory_id = v_nwbs_factory_id
      AND w.is_active = true
    ORDER BY random()
    LIMIT v_workers_for_day;

    GET DIAGNOSTICS v_shift_count = ROW_COUNT;
  END LOOP;

  RAISE NOTICE 'Created 2 weeks of historical shift data for efficiency trends';

END $$;

SELECT 'Step 10E: Historical shift data created' AS status;

-- ############################################################################
-- STEP 10F: CREATE SALES DATA (For Sales-PM Integration Demo)
-- ############################################################################
-- Mission Statement: "complementing Praxis as the anchor for sales estimates"

-- Drop and recreate sales tables to ensure correct schema
DROP TABLE IF EXISTS sales_quotes CASCADE;
DROP TABLE IF EXISTS sales_customers CASCADE;

CREATE TABLE sales_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES sales_customers(id) ON DELETE SET NULL,
  factory_id UUID REFERENCES factories(id),
  quote_number VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'Draft',
  building_type VARCHAR(50),
  module_count INTEGER,
  estimated_value NUMERIC(15,2),
  margin_percent NUMERIC(5,2),
  valid_until DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  awarded_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure project_logs table exists
CREATE TABLE IF NOT EXISTS project_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
DECLARE
  v_project RECORD;
  v_factory RECORD;
  v_customer_id UUID;
  v_sales_rep_id UUID;
  v_sales_count INTEGER := 0;
BEGIN
  -- Get a sales rep from NWBS
  SELECT id INTO v_sales_rep_id
  FROM users
  WHERE (role = 'Sales_Rep' OR LOWER(name) LIKE '%robert%')
    AND is_active = true
  LIMIT 1;

  -- Create customers and quotes for each project
  FOR v_project IN
    SELECT p.id, p.project_number, p.name, p.client_name, p.factory, p.factory_id,
           p.contract_value, p.building_type, p.module_count, p.start_date,
           p.owner_id, p.is_pm_job
    FROM projects p
    WHERE p.factory IN ('NWBS', 'PMI', 'WM-EVERGREEN')  -- Primary demo factories
    ORDER BY p.project_number
    LIMIT 15
  LOOP
    -- Create customer
    INSERT INTO sales_customers (
      name, company, email, phone, address, city, state, zip, notes, created_by
    ) VALUES (
      COALESCE(v_project.client_name, 'Customer Contact'),
      v_project.client_name,
      LOWER(REPLACE(COALESCE(v_project.client_name, 'contact'), ' ', '.')) || '@example.com',
      '(555) ' || LPAD((random() * 999)::INTEGER::TEXT, 3, '0') || '-' || LPAD((random() * 9999)::INTEGER::TEXT, 4, '0'),
      '123 Business Park Dr',
      CASE v_project.factory
        WHEN 'NWBS' THEN 'Boise'
        WHEN 'PMI' THEN 'Phoenix'
        WHEN 'WM-EVERGREEN' THEN 'Everett'
        ELSE 'Dallas'
      END,
      CASE v_project.factory
        WHEN 'NWBS' THEN 'ID'
        WHEN 'PMI' THEN 'AZ'
        WHEN 'WM-EVERGREEN' THEN 'WA'
        ELSE 'TX'
      END,
      '00000',
      'Customer for ' || v_project.name,
      COALESCE(v_sales_rep_id, v_project.owner_id)
    )
    RETURNING id INTO v_customer_id;

    -- Create quote linked to project
    INSERT INTO sales_quotes (
      project_id, customer_id, factory_id, quote_number, status,
      building_type, module_count, estimated_value, margin_percent,
      valid_until, notes, created_by, updated_by, awarded_date
    ) VALUES (
      v_project.id,
      v_customer_id,
      v_project.factory_id,
      'Q-' || v_project.project_number,
      CASE
        WHEN v_project.is_pm_job THEN 'Won'
        ELSE 'Pending'
      END,
      LOWER(v_project.building_type),
      v_project.module_count,
      v_project.contract_value,
      CASE v_project.building_type
        WHEN 'GOVERNMENT' THEN 12.5 + (random() * 5)  -- 12.5-17.5%
        WHEN 'CUSTOM' THEN 18.0 + (random() * 8)       -- 18-26%
        ELSE 15.0 + (random() * 5)                     -- 15-20%
      END,
      CURRENT_DATE + INTERVAL '30 days',
      'Sales quote for ' || v_project.name,
      COALESCE(v_sales_rep_id, v_project.owner_id),
      v_project.owner_id,
      CASE WHEN v_project.is_pm_job THEN v_project.start_date - INTERVAL '10 days' ELSE NULL END
    );

    v_sales_count := v_sales_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % sales customers and quotes', v_sales_count;

END $$;

SELECT 'Step 10F: Sales data created for sales-PM integration' AS status;

-- ############################################################################
-- STEP 10G: CREATE PROJECT LOGS (For Audit Trail/Activity Demo)
-- ############################################################################
-- Shows project activity timeline for PM dashboard

DO $$
DECLARE
  v_project RECORD;
  v_log_count INTEGER := 0;
BEGIN
  FOR v_project IN
    SELECT p.id, p.project_number, p.name, p.current_phase, p.start_date, p.owner_id
    FROM projects p
    WHERE p.current_phase >= 2
    ORDER BY p.project_number
  LOOP
    -- Phase transition logs (uses existing schema: entry_type, content, user_id)
    INSERT INTO project_logs (project_id, entry_type, content, user_id, created_at)
    VALUES
      (v_project.id, 'status_change', 'Project created - Phase 1: Initiation', v_project.owner_id, v_project.start_date),
      (v_project.id, 'status_change', 'Advanced to Phase 2: Preconstruction', v_project.owner_id, v_project.start_date + INTERVAL '15 days'),
      (v_project.id, 'document', 'Sales handoff package uploaded', v_project.owner_id, v_project.start_date + INTERVAL '2 days'),
      (v_project.id, 'task', 'Kickoff meeting completed', v_project.owner_id, v_project.start_date + INTERVAL '10 days');

    IF v_project.current_phase >= 3 THEN
      INSERT INTO project_logs (project_id, entry_type, content, user_id, created_at)
      VALUES
        (v_project.id, 'status_change', 'Advanced to Phase 3: Approvals', v_project.owner_id, v_project.start_date + INTERVAL '60 days'),
        (v_project.id, 'approval', '100% Drawings approved', v_project.owner_id, v_project.start_date + INTERVAL '55 days');
    END IF;

    IF v_project.current_phase >= 4 THEN
      INSERT INTO project_logs (project_id, entry_type, content, user_id, created_at)
      VALUES
        (v_project.id, 'status_change', 'Advanced to Phase 4: Production', v_project.owner_id, v_project.start_date + INTERVAL '90 days'),
        (v_project.id, 'production', 'Production released - modules in fabrication', v_project.owner_id, v_project.start_date + INTERVAL '92 days');
    END IF;

    v_log_count := v_log_count + 8;
  END LOOP;

  RAISE NOTICE 'Created project activity logs';

END $$;

SELECT 'Step 10G: Project logs created' AS status;

-- ############################################################################
-- STEP 11: CREATE TASKS WITH WORKFLOW_STATION_KEY
-- ############################################################################

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_station_key VARCHAR(50);

DO $$
DECLARE
  v_project RECORD;
  v_task_count INTEGER := 0;
BEGIN
  FOR v_project IN
    SELECT id, project_number, name, current_phase, building_type, owner_id, start_date
    FROM projects ORDER BY project_number
  LOOP
    -- Phase 1 tasks
    IF v_project.current_phase >= 1 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, workflow_station_key)
      VALUES
        (v_project.id, 'Complete Sales Handoff', 'Review contract and sales notes',
         CASE WHEN v_project.current_phase > 1 THEN 'Completed' ELSE 'In Progress' END,
         'High',
         CASE WHEN v_project.current_phase > 1 THEN v_project.start_date + INTERVAL '5 days' ELSE CURRENT_DATE + INTERVAL '3 days' END,
         v_project.owner_id, v_project.owner_id, 'sales_handoff'),
        (v_project.id, 'Schedule Kickoff Meeting', 'Coordinate kickoff with dealer',
         CASE WHEN v_project.current_phase > 1 THEN 'Completed' ELSE 'In Progress' END,
         'High',
         CASE WHEN v_project.current_phase > 1 THEN v_project.start_date + INTERVAL '10 days' ELSE CURRENT_DATE + INTERVAL '5 days' END,
         v_project.owner_id, v_project.owner_id, 'kickoff');
      v_task_count := v_task_count + 2;
    END IF;

    -- Phase 2 tasks
    IF v_project.current_phase >= 2 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, workflow_station_key)
      VALUES
        (v_project.id, 'Review 20% Drawings', 'Initial design review',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'In Progress' END,
         'High', CURRENT_DATE + INTERVAL '7 days', v_project.owner_id, v_project.owner_id, 'drawings_20'),
        (v_project.id, 'Review 65% Drawings', 'Development drawings',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'Not Started' END,
         'High', CURRENT_DATE + INTERVAL '14 days', v_project.owner_id, v_project.owner_id, 'drawings_65'),
        (v_project.id, 'Confirm Color Selections', 'Get dealer approval on colors',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'In Progress' END,
         'Medium', CURRENT_DATE + INTERVAL '10 days', v_project.owner_id, v_project.owner_id, 'color_selections'),
        (v_project.id, 'Order Long Lead Items', 'Order equipment with lead times',
         CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'In Progress' END,
         'High', CURRENT_DATE + INTERVAL '12 days', v_project.owner_id, v_project.owner_id, 'long_lead_items');
      v_task_count := v_task_count + 4;
    END IF;

    -- Phase 3 tasks
    IF v_project.current_phase >= 3 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, workflow_station_key)
      VALUES
        (v_project.id, 'Engineering Review', 'Complete structural review',
         CASE WHEN v_project.current_phase > 3 THEN 'Completed' ELSE 'In Progress' END,
         'High', CURRENT_DATE + INTERVAL '5 days', v_project.owner_id, v_project.owner_id, 'engineering'),
        (v_project.id, 'Obtain State Approval', 'State agency approval for Seals/Tags',
         CASE WHEN v_project.current_phase > 3 THEN 'Completed' ELSE 'In Progress' END,
         'Critical', CURRENT_DATE + INTERVAL '15 days', v_project.owner_id, v_project.owner_id, 'state_approval');
      v_task_count := v_task_count + 2;
    END IF;

    -- Phase 4 tasks
    IF v_project.current_phase >= 4 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, internal_owner_id, workflow_station_key)
      VALUES
        (v_project.id, 'Production Build', 'Module fabrication',
         'In Progress', 'High', CURRENT_DATE + INTERVAL '3 days', v_project.owner_id, v_project.owner_id, 'production'),
        (v_project.id, 'QC Inspection', 'Quality control sign-off',
         'Not Started', 'High', CURRENT_DATE + INTERVAL '5 days', v_project.owner_id, v_project.owner_id, 'qc_inspection'),
        (v_project.id, 'Schedule Delivery', 'Coordinate transport',
         'Not Started', 'High', CURRENT_DATE + INTERVAL '10 days', v_project.owner_id, v_project.owner_id, 'delivery');
      v_task_count := v_task_count + 3;
    END IF;

  END LOOP;

  RAISE NOTICE 'Created % tasks', v_task_count;

END $$;

SELECT 'Step 11: Tasks created' AS status;

-- ############################################################################
-- STEP 12: CREATE RFIs
-- ############################################################################

DO $$
DECLARE
  v_project RECORD;
  v_rfi_count INTEGER := 0;
BEGIN
  FOR v_project IN
    SELECT id, project_number, current_phase, owner_id,
           COALESCE(client_name, 'Client') AS client_name
    FROM projects
    WHERE current_phase >= 2 AND building_type IN ('GOVERNMENT', 'CUSTOM')
    ORDER BY project_number
  LOOP
    INSERT INTO rfis (project_id, rfi_number, number, subject, question, answer, status, priority, date_sent, due_date, is_external, sent_to, created_by)
    VALUES
      (v_project.id, v_project.project_number || '-RFI-001', 1,
       'Electrical Panel Location', 'Please confirm main panel location per drawing A-101',
       CASE WHEN v_project.current_phase > 2 THEN 'Per revised drawing E-101, main panel location confirmed.' ELSE NULL END,
       CASE WHEN v_project.current_phase > 2 THEN 'Closed' ELSE 'Open' END,
       'High', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '7 days', true, v_project.client_name, v_project.owner_id);
    v_rfi_count := v_rfi_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % RFIs', v_rfi_count;

END $$;

SELECT 'Step 12: RFIs created' AS status;

-- ############################################################################
-- STEP 13: CREATE SUBMITTALS
-- ############################################################################

DO $$
DECLARE
  v_project RECORD;
  v_submittal_count INTEGER := 0;
BEGIN
  FOR v_project IN
    SELECT id, project_number, current_phase, start_date
    FROM projects
    WHERE current_phase >= 2
    ORDER BY project_number
  LOOP
    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, manufacturer, model_number, date_submitted, due_date)
    VALUES
      (v_project.id, v_project.project_number || '-SUB-001',
       'HVAC Package Unit', 'Product Data',
       CASE WHEN v_project.current_phase > 2 THEN 'Approved' ELSE 'Submitted' END,
       'Carrier', '50XC-024',
       v_project.start_date + INTERVAL '30 days',
       CURRENT_DATE + INTERVAL '14 days');
    v_submittal_count := v_submittal_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % submittals', v_submittal_count;

END $$;

SELECT 'Step 13: Submittals created' AS status;

-- ############################################################################
-- STEP 14: INITIALIZE WORKFLOW STATUS FOR ALL PROJECTS
-- ############################################################################

DO $$
DECLARE
  v_project RECORD;
  v_station RECORD;
  v_status VARCHAR(30);
  v_started DATE;
  v_completed DATE;
  v_inserted INTEGER := 0;
BEGIN
  FOR v_project IN SELECT id, current_phase, start_date FROM projects LOOP
    FOR v_station IN
      SELECT station_key, phase, display_order
      FROM workflow_stations
      WHERE is_active = true
      ORDER BY phase, display_order
    LOOP
      IF v_station.phase < v_project.current_phase THEN
        v_status := 'completed';
        v_started := v_project.start_date + (v_station.phase * INTERVAL '20 days');
        v_completed := v_started + INTERVAL '10 days';
      ELSIF v_station.phase = v_project.current_phase AND v_station.display_order = 1 THEN
        v_status := 'in_progress';
        v_started := CURRENT_DATE - INTERVAL '5 days';
        v_completed := NULL;
      ELSIF v_station.phase = v_project.current_phase THEN
        v_status := 'not_started';
        v_started := NULL;
        v_completed := NULL;
      ELSE
        v_status := 'not_started';
        v_started := NULL;
        v_completed := NULL;
      END IF;

      INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date)
      VALUES (v_project.id, v_station.station_key, v_status, v_started, v_completed)
      ON CONFLICT (project_id, station_key) DO UPDATE SET
        status = EXCLUDED.status,
        started_date = EXCLUDED.started_date,
        completed_date = EXCLUDED.completed_date,
        updated_at = NOW();

      v_inserted := v_inserted + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created/updated % project_workflow_status records', v_inserted;

END $$;

SELECT 'Step 14: Workflow status initialized' AS status;

-- ############################################################################
-- STEP 15: CREATE LONG LEAD ITEMS
-- ############################################################################

DO $$
DECLARE
  v_project RECORD;
BEGIN
  FOR v_project IN
    SELECT id, project_number, current_phase, start_date
    FROM projects
    WHERE current_phase >= 2
    ORDER BY project_number
  LOOP
    INSERT INTO long_lead_items (project_id, part_name, part_number, vendor, lead_days, status, ordered, ordered_at, expected_date, received_date)
    VALUES
      (v_project.id, 'HVAC Package Unit', '50XC-024', 'Ferguson', 56,
       CASE WHEN v_project.current_phase >= 4 THEN 'Received' WHEN v_project.current_phase >= 3 THEN 'Shipped' ELSE 'Ordered' END,
       true, v_project.start_date + INTERVAL '30 days',
       v_project.start_date + INTERVAL '86 days',
       CASE WHEN v_project.current_phase >= 4 THEN v_project.start_date + INTERVAL '82 days' ELSE NULL END),
      (v_project.id, 'Custom Windows', 'Style Line 3000', 'Milgard', 42,
       CASE WHEN v_project.current_phase >= 4 THEN 'Received' WHEN v_project.current_phase >= 3 THEN 'Shipped' ELSE 'Ordered' END,
       true, v_project.start_date + INTERVAL '35 days',
       v_project.start_date + INTERVAL '77 days',
       CASE WHEN v_project.current_phase >= 4 THEN v_project.start_date + INTERVAL '75 days' ELSE NULL END);
  END LOOP;

  RAISE NOTICE 'Created long lead items for all phase 2+ projects';

END $$;

SELECT 'Step 15: Long lead items created' AS status;

-- ############################################################################
-- FINAL VERIFICATION
-- ############################################################################

DO $$
DECLARE
  v_user_count INTEGER;
  v_factory_count INTEGER;
  v_project_count INTEGER;
  v_task_count INTEGER;
  v_module_count INTEGER;
  v_worker_count INTEGER;
  v_station_count INTEGER;
  v_production_station_count INTEGER;
  v_workflow_count INTEGER;
  v_shift_count INTEGER;
  v_assignment_count INTEGER;
  v_qc_count INTEGER;
  v_sales_count INTEGER;
  v_log_count INTEGER;
  v_user RECORD;
  v_factory RECORD;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM users WHERE factory_id IS NOT NULL;
  SELECT COUNT(*) INTO v_factory_count FROM factories WHERE is_active = true;
  SELECT COUNT(*) INTO v_project_count FROM projects;
  SELECT COUNT(*) INTO v_task_count FROM tasks;
  SELECT COUNT(*) INTO v_module_count FROM modules;
  SELECT COUNT(*) INTO v_worker_count FROM workers WHERE is_active = true;
  SELECT COUNT(*) INTO v_station_count FROM workflow_stations WHERE is_active = true;
  SELECT COUNT(*) INTO v_production_station_count FROM station_templates WHERE is_active = true;
  SELECT COUNT(*) INTO v_workflow_count FROM project_workflow_status;
  SELECT COUNT(*) INTO v_shift_count FROM worker_shifts;
  SELECT COUNT(*) INTO v_assignment_count FROM station_assignments;
  SELECT COUNT(*) INTO v_qc_count FROM qc_records;
  SELECT COUNT(*) INTO v_sales_count FROM sales_quotes;
  SELECT COUNT(*) INTO v_log_count FROM project_logs;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DEMO DATA SETUP COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '=== CORE DATA ===';
  RAISE NOTICE 'Users with factory_id: %', v_user_count;
  RAISE NOTICE 'Active factories: %', v_factory_count;
  RAISE NOTICE 'Projects: %', v_project_count;
  RAISE NOTICE 'Tasks: %', v_task_count;
  RAISE NOTICE 'Modules: %', v_module_count;
  RAISE NOTICE 'PM Workflow stations: %', v_station_count;
  RAISE NOTICE 'Production line stations: %', v_production_station_count;
  RAISE NOTICE 'Workflow status records: %', v_workflow_count;
  RAISE NOTICE '';
  RAISE NOTICE '=== PLANT MANAGER DATA (Mission Critical) ===';
  RAISE NOTICE 'Active workers: %', v_worker_count;
  RAISE NOTICE 'Worker shifts (historical + today): %', v_shift_count;
  RAISE NOTICE 'Station assignments (takt time): %', v_assignment_count;
  RAISE NOTICE 'QC records: %', v_qc_count;
  RAISE NOTICE '';
  RAISE NOTICE '=== SALES-PM INTEGRATION ===';
  RAISE NOTICE 'Sales quotes: %', v_sales_count;
  RAISE NOTICE 'Project activity logs: %', v_log_count;
  RAISE NOTICE '';
  RAISE NOTICE 'PROJECT DISTRIBUTION BY USER:';

  FOR v_user IN
    SELECT u.name, u.role, COUNT(p.id) AS project_count
    FROM users u
    LEFT JOIN projects p ON p.owner_id = u.id
    WHERE u.is_active = true
    GROUP BY u.id, u.name, u.role
    HAVING COUNT(p.id) > 0
    ORDER BY project_count DESC, u.name
  LOOP
    RAISE NOTICE '  % (%): % projects', v_user.name, v_user.role, v_user.project_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'PROJECTS BY FACTORY:';

  FOR v_factory IN
    SELECT f.code, COUNT(p.id) AS project_count
    FROM factories f
    LEFT JOIN projects p ON p.factory_id = f.id
    WHERE f.is_active = true
    GROUP BY f.id, f.code
    ORDER BY f.code
  LOOP
    RAISE NOTICE '  %: % projects', v_factory.code, v_factory.project_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Refresh your browser to see the changes.';
  RAISE NOTICE '============================================';

END $$;

SELECT 'COMPLETE: Demo data setup finished successfully!' AS final_status;
