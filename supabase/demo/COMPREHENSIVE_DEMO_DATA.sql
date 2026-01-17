-- ============================================================================
-- COMPREHENSIVE DEMO DATA - PM SOFTWARE + PWA INTEGRATION
-- ============================================================================
-- Complete demo data for demonstrating ALL features of:
-- 1. Sunbelt PM System (Project Management, Workflow, Sales, Directory)
-- 2. Plant Manager Dashboard (Stations, Modules, Crews, QC)
-- 3. PWA Mobile Floor App (Worker Auth, Module Lookup, QC, Station Moves, Inventory)
--
-- USAGE: Run this in Supabase SQL Editor after schema migrations are complete
--
-- Created: January 17, 2026
-- Based on: DEMO_DATA_REQUIREMENTS.md, PWA_MOBILE_FLOOR_APP_GAMEPLAN.md
-- ============================================================================

-- ############################################################################
-- SECTION 0: PREREQUISITES - DROP CONSTRAINTS FOR DEMO DATA
-- ############################################################################
-- The users table has a FK to auth.users which prevents direct inserts.
-- For demo environments, we drop this constraint to allow creating test users.
-- WARNING: Only use this in development/demo environments!

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- ############################################################################
-- SECTION 0.1: HELPER FUNCTIONS
-- ############################################################################

CREATE OR REPLACE FUNCTION safe_truncate(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not truncate %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ############################################################################
-- SECTION 1: CLEAR EXISTING DEMO DATA (Preserve Users)
-- ############################################################################

SELECT 'Starting comprehensive demo data setup...' AS status;

-- PWA Tables
SELECT safe_truncate('inventory_receipts');
SELECT safe_truncate('purchase_orders');
SELECT safe_truncate('worker_sessions');

-- PGM Tables
SELECT safe_truncate('qc_records');
SELECT safe_truncate('station_assignments');
SELECT safe_truncate('worker_shifts');
SELECT safe_truncate('modules');
SELECT safe_truncate('workers');
SELECT safe_truncate('plant_config');

-- PM Tables
SELECT safe_truncate('project_workflow_status');
SELECT safe_truncate('color_selections');
SELECT safe_truncate('long_lead_items');
SELECT safe_truncate('change_orders');
SELECT safe_truncate('submittals');
SELECT safe_truncate('rfis');
SELECT safe_truncate('tasks');
SELECT safe_truncate('milestones');
SELECT safe_truncate('project_logs');
SELECT safe_truncate('projects');

-- Sales Tables
SELECT safe_truncate('sales_quotes');
SELECT safe_truncate('sales_customers');

SELECT 'Section 1: Existing demo data cleared' AS status;

-- ############################################################################
-- SECTION 2: ENSURE ALL FACTORIES EXIST
-- ############################################################################

INSERT INTO factories (code, short_name, full_name, display_value, city, state, region, is_active)
VALUES
  ('NWBS', 'Northwest Building', 'Northwest Building Systems', 'NWBS - Northwest Building Systems', 'Boise', 'ID', 'Northwest', true),
  ('PMI', 'Phoenix Modular', 'Phoenix Modular Industries', 'PMI - Phoenix Modular Industries', 'Phoenix', 'AZ', 'Southwest', true),
  ('WM-EVERGREEN', 'Whitley Evergreen', 'Whitley Manufacturing Evergreen', 'WM-EVERGREEN - Whitley Evergreen', 'Everett', 'WA', 'Northwest', true),
  ('WM-EAST', 'Whitley East', 'Whitley Manufacturing East', 'WM-EAST - Whitley East', 'Charlotte', 'NC', 'East', true),
  ('WM-SOUTH', 'Whitley South', 'Whitley Manufacturing South', 'WM-SOUTH - Whitley South', 'Houston', 'TX', 'South', true),
  ('WM-ROCHESTER', 'Whitley Rochester', 'Whitley Manufacturing Rochester', 'WM-ROCHESTER - Whitley Rochester', 'Rochester', 'NY', 'Northeast', true),
  ('AMT', 'Amtex Modular', 'Amtex Modular Manufacturing', 'AMT - Amtex Modular', 'Austin', 'TX', 'Southwest', true),
  ('SMM', 'Sunbelt Mobile', 'Sunbelt Mobile Manufacturing', 'SMM - Sunbelt Mobile Manufacturing', 'Mobile', 'AL', 'South', true),
  ('SSI', 'Sunbelt Idaho', 'Sunbelt Systems Idaho', 'SSI - Sunbelt Systems Idaho', 'Twin Falls', 'ID', 'Northwest', true)
ON CONFLICT (code) DO UPDATE SET
  short_name = EXCLUDED.short_name,
  full_name = EXCLUDED.full_name,
  display_value = EXCLUDED.display_value,
  is_active = EXCLUDED.is_active;

SELECT 'Section 2: Factories created/updated' AS status;

-- ############################################################################
-- SECTION 2.5: ENSURE ALL REQUIRED USERS EXIST (From Sunbelt Directory)
-- ############################################################################
-- Add factory-specific users needed for demo data (PGM, Production Manager, PC, Sales Manager)
-- These users are required for project ownership and station assignments
-- Source: Sunbelt Directory Q3-2025

DO $$
DECLARE
  v_pmi_id UUID;
  v_amt_id UUID;
  v_wm_evergreen_id UUID;
  v_wm_east_id UUID;
  v_wm_south_id UUID;
  v_wm_rochester_id UUID;
  v_smm_id UUID;
  v_ssi_id UUID;
  v_busa_id UUID;
  v_cb_id UUID;
  v_ibi_id UUID;
  v_mrs_id UUID;
  v_prm_id UUID;
BEGIN
  -- Get factory IDs
  SELECT id INTO v_pmi_id FROM factories WHERE code = 'PMI';
  SELECT id INTO v_amt_id FROM factories WHERE code = 'AMT';
  SELECT id INTO v_wm_evergreen_id FROM factories WHERE code = 'WM-EVERGREEN';
  SELECT id INTO v_wm_east_id FROM factories WHERE code = 'WM-EAST';
  SELECT id INTO v_wm_south_id FROM factories WHERE code = 'WM-SOUTH';
  SELECT id INTO v_wm_rochester_id FROM factories WHERE code = 'WM-ROCHESTER';
  SELECT id INTO v_smm_id FROM factories WHERE code = 'SMM';
  SELECT id INTO v_ssi_id FROM factories WHERE code = 'SSI';

  -- ========================================
  -- PMI (Phoenix Modular) - 3 users needed
  -- ========================================
  INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active)
  VALUES
    (gen_random_uuid(), 'monty.king@phoenixmodular.com', 'Monty King', 'Plant_GM', 'PMI', v_pmi_id, '602-327-4771', true),
    (gen_random_uuid(), 'rafael.quiros@phoenixmodular.com', 'Rafael Quiros', 'Production_Manager', 'PMI', v_pmi_id, '602-320-6044', true),
    (gen_random_uuid(), 'brian.shackleford@phoenixmodular.com', 'Brian Shackleford', 'Sales_Manager', 'PMI', v_pmi_id, '602-397-5474', true)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    factory = EXCLUDED.factory,
    factory_id = EXCLUDED.factory_id,
    is_active = true;

  -- ========================================
  -- AMT (Amtex Modular) - 4 users needed
  -- ========================================
  INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active)
  VALUES
    (gen_random_uuid(), 'noel.lindsey@amtexcorp.com', 'Noel Lindsey', 'Plant_GM', 'AMT', v_amt_id, '214-450-0546', true),
    (gen_random_uuid(), 'luis.resendiz@amtexcorp.com', 'Luis Resendiz', 'Production_Manager', 'AMT', v_amt_id, '214-734-4582', true),
    (gen_random_uuid(), 'kelly.kellie@amtexcorp.com', 'Kelly Kellie', 'Sales_Manager', 'AMT', v_amt_id, '469-416-9979', true),
    (gen_random_uuid(), 'alex.fontenarosa@amtexcorp.com', 'Alex Fontenarosa', 'PC', 'AMT', v_amt_id, NULL, true)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    factory = EXCLUDED.factory,
    factory_id = EXCLUDED.factory_id,
    is_active = true;

  -- ========================================
  -- WM-EVERGREEN (Whitley Evergreen) - 4 users needed
  -- ========================================
  INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active)
  VALUES
    (gen_random_uuid(), 'randymaddox@whitleyman.com', 'Randy Maddox', 'Plant_GM', 'WM-EVERGREEN', v_wm_evergreen_id, NULL, true),
    (gen_random_uuid(), 'clintwilliams@whitleyman.com', 'Clint Williams', 'Production_Manager', 'WM-EVERGREEN', v_wm_evergreen_id, NULL, true),
    (gen_random_uuid(), 'hankkennedy@whitleyman.com', 'Hank Kennedy', 'Sales_Manager', 'WM-EVERGREEN', v_wm_evergreen_id, NULL, true),
    (gen_random_uuid(), 'nicolegruendl@whitleyman.com', 'Nicole Gruendl', 'PC', 'WM-EVERGREEN', v_wm_evergreen_id, NULL, true)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    factory = EXCLUDED.factory,
    factory_id = EXCLUDED.factory_id,
    is_active = true;

  -- ========================================
  -- WM-EAST (Whitley East) - 4 users needed
  -- ========================================
  INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active)
  VALUES
    (gen_random_uuid(), 'JoeDattoli@whitleyman.com', 'Joe Dattoli', 'Plant_GM', 'WM-EAST', v_wm_east_id, '717-826-1711', true),
    (gen_random_uuid(), 'DylanLoper@whitleyman.com', 'Dylan Loper', 'Production_Manager', 'WM-EAST', v_wm_east_id, '717-881-2728', true),
    (gen_random_uuid(), 'ChristineKline@whitleyman.com', 'Christine Kline', 'Sales_Manager', 'WM-EAST', v_wm_east_id, '610-223-0507', true),
    (gen_random_uuid(), 'JCRedmond@whitleyman.com', 'JC Redmond', 'PC', 'WM-EAST', v_wm_east_id, '717-875-3732', true)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    factory = EXCLUDED.factory,
    factory_id = EXCLUDED.factory_id,
    is_active = true;

  -- ========================================
  -- WM-SOUTH (Whitley South) - 4 users needed
  -- ========================================
  INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active)
  VALUES
    (gen_random_uuid(), 'DonHarlan@whitleyman.com', 'Don Harlan', 'Plant_GM', 'WM-SOUTH', v_wm_south_id, '574-527-0371', true),
    (gen_random_uuid(), 'KevinHenning@whitleyman.com', 'Kevin Henning', 'Production_Manager', 'WM-SOUTH', v_wm_south_id, '260-312-1171', true),
    (gen_random_uuid(), 'DanLipinski@whitleyman.com', 'Dan Lipinski', 'Sales_Manager', 'WM-SOUTH', v_wm_south_id, '260-409-9614', true),
    (gen_random_uuid(), 'GarettSimmons@whitleyman.com', 'Garett Simmons', 'PC', 'WM-SOUTH', v_wm_south_id, '260-229-6131', true)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    factory = EXCLUDED.factory,
    factory_id = EXCLUDED.factory_id,
    is_active = true;

  -- ========================================
  -- WM-ROCHESTER - 4 users needed
  -- ========================================
  INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active)
  VALUES
    (gen_random_uuid(), 'KoleKroft@whitleyman.com', 'Kole Kroft', 'Plant_GM', 'WM-ROCHESTER', v_wm_rochester_id, '219-863-3733', true),
    (gen_random_uuid(), 'RobFarris@whitleyman.com', 'Rob Farris', 'Production_Manager', 'WM-ROCHESTER', v_wm_rochester_id, '574-201-8691', true),
    (gen_random_uuid(), 'LindaMartin@whitleyman.com', 'Linda Martin', 'Sales_Manager', 'WM-ROCHESTER', v_wm_rochester_id, '574-721-2592', true),
    (gen_random_uuid(), 'LisaWeissert@whitleyman.com', 'Lisa Weissert', 'PC', 'WM-ROCHESTER', v_wm_rochester_id, '574-707-5844', true)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    factory = EXCLUDED.factory,
    factory_id = EXCLUDED.factory_id,
    is_active = true;

  -- ========================================
  -- SMM (Southeast Modular Manufacturing) - 4 users needed
  -- ========================================
  INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active)
  VALUES
    (gen_random_uuid(), 'joe.reid@southeastmodular.com', 'Joe Reid', 'Plant_GM', 'SMM', v_smm_id, '214-336-8582', true),
    (gen_random_uuid(), 'mike.stoica@southeastmodular.com', 'Mike Stoica', 'Production_Manager', 'SMM', v_smm_id, '352-446-6482', true),
    (gen_random_uuid(), 'don.eisman@southeastmodular.com', 'Don Eisman', 'Sales_Manager', 'SMM', v_smm_id, '574-333-7089', true),
    (gen_random_uuid(), 'katie.myers@southeastmodular.com', 'Katie Myers', 'PC', 'SMM', v_smm_id, '352-626-3577', true)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    factory = EXCLUDED.factory,
    factory_id = EXCLUDED.factory_id,
    is_active = true;

  -- ========================================
  -- SSI (Specialized Structures Idaho) - 4 users needed
  -- ========================================
  INSERT INTO users (id, email, name, role, factory, factory_id, phone, is_active)
  VALUES
    (gen_random_uuid(), 'glenn.gardner@specializedstructures.com', 'Glenn Gardner', 'Plant_GM', 'SSI', v_ssi_id, '912-534-6111', true),
    (gen_random_uuid(), 'grant.gardner@specializedstructures.com', 'Grant Gardner', 'Production_Manager', 'SSI', v_ssi_id, '912-309-9603', true),
    (gen_random_uuid(), 'josh.ellis@specializedstructures.com', 'Josh Ellis', 'Sales_Manager', 'SSI', v_ssi_id, '912-327-0256', true),
    (gen_random_uuid(), 'silvanna.corona@specializedstructures.com', 'Silvanna Corona', 'PC', 'SSI', v_ssi_id, NULL, true)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    factory = EXCLUDED.factory,
    factory_id = EXCLUDED.factory_id,
    is_active = true;

  RAISE NOTICE 'Added/updated factory users for PMI, AMT, WM-EVERGREEN, WM-EAST, WM-SOUTH, WM-ROCHESTER, SMM, SSI';
END $$;

SELECT 'Section 2.5: Factory users created/updated' AS status;

-- ############################################################################
-- SECTION 3: STATION TEMPLATES (12 Production Line Stages)
-- ############################################################################
-- Required for Plant Manager Dashboard module tracking

DELETE FROM station_templates WHERE factory_id IS NULL;

INSERT INTO station_templates (name, code, description, order_num, requires_inspection, is_inspection_station, color, duration_defaults, checklist)
VALUES
  ('Metal Frame Welding', 'FRAME_WELD', 'Heavy steel frame welding', 1, false, false, '#ef4444',
   '{"stock": 6.0, "fleet": 6.0, "government": 8.0, "custom": 10.0}',
   '[{"q": "All welds visually inspected?", "type": "bool"}, {"q": "Frame square within 1/8 inch tolerance?", "type": "bool"}, {"q": "Weld slag removed?", "type": "bool"}]'),

  ('Rough Carpentry', 'ROUGH_CARP', 'Walls, roof framing, studs, joists', 2, false, false, '#f97316',
   '{"stock": 8.0, "fleet": 8.0, "government": 10.0, "custom": 12.0}',
   '[{"q": "Studs plumb within tolerance?", "type": "bool"}, {"q": "Headers properly sized per plan?", "type": "bool"}, {"q": "Blocking installed at fixtures?", "type": "bool"}]'),

  ('Exterior Siding', 'EXT_SIDING', 'Sheathing, weather barrier, siding', 3, false, false, '#eab308',
   '{"stock": 6.0, "fleet": 6.0, "government": 8.0, "custom": 10.0}',
   '[{"q": "Weather barrier complete with 4in overlaps?", "type": "bool"}, {"q": "Siding fasteners per spec?", "type": "bool"}, {"q": "Window/door flashing complete?", "type": "bool"}]'),

  ('Interior Rough-out', 'INT_ROUGH', 'Insulation, vapor barrier, windows', 4, false, false, '#84cc16',
   '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',
   '[{"q": "Insulation R-value matches spec?", "type": "bool"}, {"q": "Vapor barrier sealed at penetrations?", "type": "bool"}, {"q": "Windows level and square?", "type": "bool"}]'),

  ('Electrical Rough-in', 'ELEC_ROUGH', 'Wiring, boxes, panels', 5, true, false, '#22c55e',
   '{"stock": 6.0, "fleet": 6.0, "government": 8.0, "custom": 10.0}',
   '[{"q": "Wire gauge correct per circuit?", "type": "bool"}, {"q": "Junction boxes secured?", "type": "bool"}, {"q": "Circuits labeled correctly?", "type": "bool"}, {"q": "Ground wires connected?", "type": "bool"}]'),

  ('Plumbing Rough-in', 'PLUMB_ROUGH', 'Supply, drain, and vent lines', 6, true, false, '#14b8a6',
   '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',
   '[{"q": "Pressure test passed (50 PSI 15 min)?", "type": "bool"}, {"q": "Drain slope 1/4 in per foot?", "type": "bool"}, {"q": "Vents extend through roof?", "type": "bool"}]'),

  ('HVAC Install', 'HVAC', 'Ductwork, units, controls', 7, true, false, '#06b6d4',
   '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',
   '[{"q": "Ductwork joints sealed?", "type": "bool"}, {"q": "Unit securely mounted?", "type": "bool"}, {"q": "Thermostat location per plan?", "type": "bool"}, {"q": "Refrigerant lines insulated?", "type": "bool"}]'),

  ('In-Wall Inspection', 'INWALL_INSP', 'MEP inspection before close-up', 8, false, true, '#0ea5e9',
   '{"stock": 2.0, "fleet": 2.0, "government": 4.0, "custom": 4.0}',
   '[{"q": "Electrical inspection passed?", "type": "bool"}, {"q": "Plumbing inspection passed?", "type": "bool"}, {"q": "HVAC inspection passed?", "type": "bool"}, {"q": "Fire stopping complete?", "type": "bool"}, {"q": "Insulation inspection passed?", "type": "bool"}]'),

  ('Interior Finish', 'INT_FINISH', 'Drywall, paint, flooring, trim', 9, false, false, '#6366f1',
   '{"stock": 10.0, "fleet": 10.0, "government": 12.0, "custom": 16.0}',
   '[{"q": "Drywall finish level 4 achieved?", "type": "bool"}, {"q": "Paint coverage complete (2 coats)?", "type": "bool"}, {"q": "Flooring transitions smooth?", "type": "bool"}, {"q": "Trim caulked and painted?", "type": "bool"}]'),

  ('Final State Inspection', 'FINAL_INSP', 'State inspector sign-off', 10, false, true, '#8b5cf6',
   '{"stock": 2.0, "fleet": 2.0, "government": 4.0, "custom": 4.0}',
   '[{"q": "All systems operational?", "type": "bool"}, {"q": "Smoke detectors tested?", "type": "bool"}, {"q": "GFCI outlets verified?", "type": "bool"}, {"q": "Egress windows functional?", "type": "bool"}, {"q": "Documentation complete?", "type": "bool"}]'),

  ('Staging', 'STAGING', 'Pre-pickup staging area', 11, false, false, '#a855f7',
   '{"stock": 1.0, "fleet": 1.0, "government": 2.0, "custom": 2.0}',
   '[{"q": "Final cleaning complete?", "type": "bool"}, {"q": "Warranty paperwork ready?", "type": "bool"}, {"q": "Keys and manuals packaged?", "type": "bool"}]'),

  ('Dealer Pickup', 'PICKUP', 'Ready for transport', 12, false, false, '#ec4899',
   '{"stock": 0.5, "fleet": 0.5, "government": 1.0, "custom": 1.0}',
   '[{"q": "Bill of lading signed?", "type": "bool"}, {"q": "Pre-transport photos taken?", "type": "bool"}, {"q": "Transport damage waiver signed?", "type": "bool"}]');

SELECT 'Section 3: Station templates created (12 stations)' AS status;

-- ############################################################################
-- SECTION 4: WORKFLOW STATIONS (PM Workflow - 19 Stations)
-- ############################################################################

DELETE FROM workflow_stations;

INSERT INTO workflow_stations (station_key, name, description, phase, display_order, default_owner, is_required, is_active) VALUES
  -- PHASE 1: INITIATION
  ('sales_handoff', 'Sales Handoff', 'Transfer from Sales to PM team', 1, 1, 'pm', true, true),
  ('kickoff', 'Kickoff Meeting', 'Initial project kickoff with dealer', 1, 2, 'pm', true, true),
  -- PHASE 2: PRECONSTRUCTION
  ('drawings_20', '20% Drawings', 'Preliminary design drawings', 2, 1, 'drafting', true, true),
  ('drawings_65', '65% Drawings', 'Development drawings', 2, 2, 'drafting', true, true),
  ('drawings_95', '95% Drawings', 'Near-final drawings for review', 2, 3, 'drafting', true, true),
  ('drawings_100', '100% Drawings', 'Final construction documents', 2, 4, 'drafting', true, true),
  ('color_selections', 'Color Selections', 'Finish and color selections', 2, 5, 'dealer', true, true),
  ('long_lead_items', 'Long Lead Items', 'Long lead equipment orders', 2, 6, 'procurement', true, true),
  ('cutsheets', 'Cutsheet Submittals', 'Equipment submittals', 2, 7, 'dealer', true, true),
  -- PHASE 3: APPROVALS
  ('engineering', 'Engineering Review', 'Structural and systems review', 3, 1, 'engineering', true, true),
  ('third_party', 'Third Party Review', 'External plan review', 3, 2, 'engineering', false, true),
  ('state_approval', 'State Approval', 'State agency approval', 3, 3, 'pm', true, true),
  ('production_release', 'Production Release', 'Release to factory', 3, 4, 'pm', true, true),
  -- PHASE 4: PRODUCTION & CLOSEOUT
  ('production', 'Production', 'Factory fabrication', 4, 1, 'production', true, true),
  ('qc_inspection', 'QC Inspection', 'Quality control', 4, 2, 'quality', true, true),
  ('staging', 'Staging', 'Pre-transport staging', 4, 3, 'production', true, true),
  ('delivery', 'Delivery', 'Transport to site', 4, 4, 'pm', true, true),
  ('set_complete', 'Set Complete', 'Installation complete', 4, 5, 'pm', true, true),
  ('closeout', 'Project Closeout', 'Final documentation', 4, 6, 'pm', true, true);

SELECT 'Section 4: Workflow stations created (19 stations)' AS status;

-- ############################################################################
-- SECTION 5: DEMO PROJECTS (25+ distributed across factories)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_id UUID;
  v_pmi_id UUID;
  v_wm_evergreen_id UUID;
  v_wm_east_id UUID;
  v_wm_south_id UUID;
  v_amt_id UUID;
  v_smm_id UUID;
  v_owner_id UUID;
  -- PM user IDs for proper assignment
  v_matthew_id UUID;
  v_crystal_id UUID;
  v_candy_id UUID;
  v_michael_id UUID;
  v_hector_id UUID;
  v_fallback_pm_id UUID;
BEGIN
  -- Get factory IDs
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS';
  SELECT id INTO v_pmi_id FROM factories WHERE code = 'PMI';
  SELECT id INTO v_wm_evergreen_id FROM factories WHERE code = 'WM-EVERGREEN';
  SELECT id INTO v_wm_east_id FROM factories WHERE code = 'WM-EAST';
  SELECT id INTO v_wm_south_id FROM factories WHERE code = 'WM-SOUTH';
  SELECT id INTO v_amt_id FROM factories WHERE code = 'AMT';
  SELECT id INTO v_smm_id FROM factories WHERE code = 'SMM';

  -- Get PM user IDs by name (flexible matching)
  -- Matthew McDaniel
  SELECT id INTO v_matthew_id FROM users
  WHERE (LOWER(name) LIKE '%matthew%' AND LOWER(name) LIKE '%mcdaniel%')
     OR LOWER(email) LIKE '%matthew%mcdaniel%'
     OR LOWER(email) LIKE '%mmcdaniel%'
  LIMIT 1;

  -- Crystal (James/Meyers)
  SELECT id INTO v_crystal_id FROM users
  WHERE LOWER(name) LIKE '%crystal%'
     OR LOWER(email) LIKE '%crystal%'
  LIMIT 1;

  -- Candy (Juhnke/Nelson)
  SELECT id INTO v_candy_id FROM users
  WHERE LOWER(name) LIKE '%candy%'
     OR LOWER(email) LIKE '%candy%'
  LIMIT 1;

  -- Michael (Caracciolo)
  SELECT id INTO v_michael_id FROM users
  WHERE LOWER(name) LIKE '%michael%' AND role = 'PM'
     OR (LOWER(email) LIKE '%michael%' AND role = 'PM')
  LIMIT 1;

  -- Hector (Vazquez)
  SELECT id INTO v_hector_id FROM users
  WHERE LOWER(name) LIKE '%hector%'
     OR LOWER(email) LIKE '%hector%'
  LIMIT 1;

  -- Fallback: any PM user
  SELECT id INTO v_fallback_pm_id FROM users
  WHERE role = 'PM' AND is_active = true
  LIMIT 1;

  -- Final fallback: any active user
  SELECT id INTO v_owner_id FROM users WHERE is_active = true LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'No active users found!';
  END IF;

  -- Use fallbacks if specific PMs not found
  v_matthew_id := COALESCE(v_matthew_id, v_fallback_pm_id, v_owner_id);
  v_crystal_id := COALESCE(v_crystal_id, v_fallback_pm_id, v_owner_id);
  v_candy_id := COALESCE(v_candy_id, v_fallback_pm_id, v_owner_id);
  v_michael_id := COALESCE(v_michael_id, v_fallback_pm_id, v_owner_id);
  v_hector_id := COALESCE(v_hector_id, v_fallback_pm_id, v_owner_id);

  RAISE NOTICE 'PM assignments: Matthew=%, Crystal=%, Candy=%, Michael=%, Hector=%',
    v_matthew_id, v_crystal_id, v_candy_id, v_michael_id, v_hector_id;

  -- ============================================================================
  -- NWBS PROJECTS (6 projects in various phases) - Assigned to MATTHEW
  -- ============================================================================

  -- Phase 4 - In Production (modules on floor, perfect for PWA demo)
  -- is_pm_job: true = PM-managed (tracked in PM Dashboard), false = PC/STOCK job (factory-managed by PC and PGM)
  -- owner_id AND primary_pm_id both set for dashboard visibility
  INSERT INTO projects (project_number, name, factory, factory_id, building_type, status, health_status, current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count, target_online_date, start_date, client_name, site_state, is_pm_job)
  VALUES
    ('NWBS-26-001', 'Boise School District Admin Building', 'NWBS', v_nwbs_id, 'GOVERNMENT', 'In Progress', 'On Track', 4, 1850000, v_matthew_id, v_matthew_id, v_crystal_id, 8, CURRENT_DATE + 30, CURRENT_DATE - 120, 'Boise ISD', 'ID', true),
    ('NWBS-26-002', 'Idaho State University Research Lab', 'NWBS', v_nwbs_id, 'GOVERNMENT', 'In Progress', 'At Risk', 4, 2100000, v_matthew_id, v_matthew_id, v_candy_id, 10, CURRENT_DATE + 45, CURRENT_DATE - 90, 'Idaho State University', 'ID', true),
    ('NWBS-26-003', 'Boeing Everett Support Facility', 'NWBS', v_nwbs_id, 'CUSTOM', 'In Progress', 'On Track', 3, 1650000, v_matthew_id, v_matthew_id, v_crystal_id, 6, CURRENT_DATE + 60, CURRENT_DATE - 60, 'Boeing Company', 'WA', true),
    ('NWBS-26-004', 'Nampa Medical Clinic', 'NWBS', v_nwbs_id, 'CUSTOM', 'In Progress', 'On Track', 2, 980000, v_matthew_id, v_matthew_id, v_michael_id, 4, CURRENT_DATE + 90, CURRENT_DATE - 30, 'St. Luke Health', 'ID', true),
    ('NWBS-26-005', 'Meridian Office Park Unit A', 'NWBS', v_nwbs_id, 'STOCK', 'Active', 'On Track', 2, 450000, v_owner_id, NULL, NULL, 2, CURRENT_DATE + 75, CURRENT_DATE - 15, 'Meridian Commerce', 'ID', false),
    ('NWBS-26-006', 'Twin Falls Retail Expansion', 'NWBS', v_nwbs_id, 'FLEET', 'In Progress', 'On Track', 4, 620000, v_owner_id, NULL, NULL, 3, CURRENT_DATE + 20, CURRENT_DATE - 100, 'Magic Valley Retail', 'ID', false);

  -- ============================================================================
  -- PMI PROJECTS (4 projects) - Assigned to CRYSTAL
  -- ============================================================================
  INSERT INTO projects (project_number, name, factory, factory_id, building_type, status, health_status, current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count, target_online_date, start_date, client_name, site_state, is_pm_job)
  VALUES
    ('PMI-26-001', 'Phoenix VA Outpatient Clinic', 'PMI', v_pmi_id, 'GOVERNMENT', 'In Progress', 'On Track', 4, 2400000, v_crystal_id, v_crystal_id, v_matthew_id, 12, CURRENT_DATE + 25, CURRENT_DATE - 150, 'US Dept of Veterans Affairs', 'AZ', true),
    ('PMI-26-002', 'Scottsdale Charter School', 'PMI', v_pmi_id, 'GOVERNMENT', 'In Progress', 'At Risk', 3, 1200000, v_crystal_id, v_crystal_id, v_hector_id, 6, CURRENT_DATE + 50, CURRENT_DATE - 80, 'Scottsdale USD', 'AZ', true),
    ('PMI-26-003', 'Tempe Tech Campus B', 'PMI', v_pmi_id, 'CUSTOM', 'In Progress', 'On Track', 2, 890000, v_crystal_id, v_crystal_id, v_candy_id, 4, CURRENT_DATE + 90, CURRENT_DATE - 40, 'Arizona Tech Partners', 'AZ', true),
    ('PMI-26-004', 'Mesa Fleet Storage', 'PMI', v_pmi_id, 'FLEET', 'Active', 'On Track', 1, 380000, v_owner_id, NULL, NULL, 2, CURRENT_DATE + 120, CURRENT_DATE - 10, 'Desert Fleet Services', 'AZ', false);

  -- ============================================================================
  -- WM-EVERGREEN PROJECTS (3 projects) - All PM jobs - Assigned to MATTHEW (secondary region)
  -- ============================================================================
  INSERT INTO projects (project_number, name, factory, factory_id, building_type, status, health_status, current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count, target_online_date, start_date, client_name, site_state, is_pm_job)
  VALUES
    ('WMEV-26-001', 'Seattle Metro Fire Station 12', 'WM-EVERGREEN', v_wm_evergreen_id, 'GOVERNMENT', 'In Progress', 'On Track', 4, 1980000, v_matthew_id, v_matthew_id, v_candy_id, 8, CURRENT_DATE + 35, CURRENT_DATE - 110, 'Seattle Fire Dept', 'WA', true),
    ('WMEV-26-002', 'Tacoma Port Authority Office', 'WM-EVERGREEN', v_wm_evergreen_id, 'GOVERNMENT', 'In Progress', 'On Track', 3, 1450000, v_matthew_id, v_matthew_id, v_crystal_id, 6, CURRENT_DATE + 65, CURRENT_DATE - 70, 'Port of Tacoma', 'WA', true),
    ('WMEV-26-003', 'Olympia State Complex Annex', 'WM-EVERGREEN', v_wm_evergreen_id, 'GOVERNMENT', 'In Progress', 'Critical', 2, 2200000, v_candy_id, v_candy_id, v_matthew_id, 10, CURRENT_DATE + 100, CURRENT_DATE - 25, 'Washington State', 'WA', true);

  -- ============================================================================
  -- WM-EAST PROJECTS (3 projects) - Mix of PM and PC jobs - Assigned to MICHAEL
  -- ============================================================================
  INSERT INTO projects (project_number, name, factory, factory_id, building_type, status, health_status, current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count, target_online_date, start_date, client_name, site_state, is_pm_job)
  VALUES
    ('WMEA-26-001', 'Charlotte Regional Hospital Wing', 'WM-EAST', v_wm_east_id, 'CUSTOM', 'In Progress', 'On Track', 4, 3200000, v_michael_id, v_michael_id, v_candy_id, 14, CURRENT_DATE + 40, CURRENT_DATE - 140, 'Atrium Health', 'NC', true),
    ('WMEA-26-002', 'Raleigh School District Portables', 'WM-EAST', v_wm_east_id, 'FLEET', 'In Progress', 'On Track', 3, 960000, v_owner_id, NULL, NULL, 8, CURRENT_DATE + 55, CURRENT_DATE - 60, 'Wake County Schools', 'NC', false),
    ('WMEA-26-003', 'Durham Tech Incubator', 'WM-EAST', v_wm_east_id, 'CUSTOM', 'Active', 'On Track', 1, 780000, v_michael_id, v_michael_id, v_hector_id, 4, CURRENT_DATE + 150, CURRENT_DATE - 5, 'Durham Innovation', 'NC', true);

  -- ============================================================================
  -- WM-SOUTH PROJECTS (3 projects) - All PM jobs - Assigned to HECTOR
  -- ============================================================================
  INSERT INTO projects (project_number, name, factory, factory_id, building_type, status, health_status, current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count, target_online_date, start_date, client_name, site_state, is_pm_job)
  VALUES
    ('WMSO-26-001', 'Houston Energy Sector Office', 'WM-SOUTH', v_wm_south_id, 'CUSTOM', 'In Progress', 'On Track', 4, 2800000, v_hector_id, v_hector_id, v_crystal_id, 12, CURRENT_DATE + 30, CURRENT_DATE - 130, 'Gulf Coast Energy', 'TX', true),
    ('WMSO-26-002', 'San Antonio Military Housing', 'WM-SOUTH', v_wm_south_id, 'GOVERNMENT', 'In Progress', 'At Risk', 3, 4500000, v_hector_id, v_hector_id, v_candy_id, 20, CURRENT_DATE + 80, CURRENT_DATE - 90, 'US Army', 'TX', true),
    ('WMSO-26-003', 'Austin Startup Campus Phase 2', 'WM-SOUTH', v_wm_south_id, 'CUSTOM', 'Active', 'On Track', 2, 1100000, v_candy_id, v_candy_id, v_hector_id, 5, CURRENT_DATE + 110, CURRENT_DATE - 20, 'Capital Factory', 'TX', true);

  -- ============================================================================
  -- AMT PROJECTS (2 projects) - All PM jobs - Assigned to CRYSTAL (secondary region)
  -- ============================================================================
  INSERT INTO projects (project_number, name, factory, factory_id, building_type, status, health_status, current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count, target_online_date, start_date, client_name, site_state, is_pm_job)
  VALUES
    ('AMT-26-001', 'Dallas ISD Temporary Classrooms', 'AMT', v_amt_id, 'FLEET', 'In Progress', 'On Track', 4, 1600000, v_crystal_id, v_crystal_id, v_hector_id, 12, CURRENT_DATE + 15, CURRENT_DATE - 120, 'Dallas ISD', 'TX', true),
    ('AMT-26-002', 'Fort Worth Convention Annex', 'AMT', v_amt_id, 'CUSTOM', 'In Progress', 'On Track', 3, 2100000, v_hector_id, v_hector_id, v_crystal_id, 8, CURRENT_DATE + 70, CURRENT_DATE - 50, 'City of Fort Worth', 'TX', true);

  -- ============================================================================
  -- SMM PROJECTS (2 projects) - All PM jobs - Assigned to CANDY
  -- ============================================================================
  INSERT INTO projects (project_number, name, factory, factory_id, building_type, status, health_status, current_phase, contract_value, owner_id, primary_pm_id, backup_pm_id, module_count, target_online_date, start_date, client_name, site_state, is_pm_job)
  VALUES
    ('SMM-26-001', 'Mobile Port Facilities', 'SMM', v_smm_id, 'GOVERNMENT', 'In Progress', 'On Track', 4, 1400000, v_candy_id, v_candy_id, v_michael_id, 6, CURRENT_DATE + 25, CURRENT_DATE - 100, 'Alabama Port Authority', 'AL', true),
    ('SMM-26-002', 'Birmingham Medical Campus', 'SMM', v_smm_id, 'CUSTOM', 'In Progress', 'On Track', 2, 1850000, v_candy_id, v_candy_id, v_crystal_id, 8, CURRENT_DATE + 95, CURRENT_DATE - 35, 'UAB Health System', 'AL', true);

  RAISE NOTICE 'Created 25 demo projects with PM assignments: Matthew (6), Crystal (5), Candy (4), Michael (2), Hector (3)';

  -- ============================================================================
  -- UPDATE existing projects if they were inserted without PM assignments
  -- (handles re-running demo data without clearing first)
  -- ============================================================================

  -- NWBS projects -> Matthew
  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'NWBS-26-001' AND (owner_id != v_matthew_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_candy_id
  WHERE project_number = 'NWBS-26-002' AND (owner_id != v_matthew_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'NWBS-26-003' AND (owner_id != v_matthew_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_michael_id
  WHERE project_number = 'NWBS-26-004' AND (owner_id != v_matthew_id OR primary_pm_id IS NULL);

  -- PMI projects -> Crystal
  UPDATE projects SET owner_id = v_crystal_id, primary_pm_id = v_crystal_id, backup_pm_id = v_matthew_id
  WHERE project_number = 'PMI-26-001' AND (owner_id != v_crystal_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_crystal_id, primary_pm_id = v_crystal_id, backup_pm_id = v_hector_id
  WHERE project_number = 'PMI-26-002' AND (owner_id != v_crystal_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_crystal_id, primary_pm_id = v_crystal_id, backup_pm_id = v_candy_id
  WHERE project_number = 'PMI-26-003' AND (owner_id != v_crystal_id OR primary_pm_id IS NULL);

  -- WM-EVERGREEN projects -> Matthew/Candy
  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_candy_id
  WHERE project_number = 'WMEV-26-001' AND (owner_id != v_matthew_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_matthew_id, primary_pm_id = v_matthew_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'WMEV-26-002' AND (owner_id != v_matthew_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_candy_id, primary_pm_id = v_candy_id, backup_pm_id = v_matthew_id
  WHERE project_number = 'WMEV-26-003' AND (owner_id != v_candy_id OR primary_pm_id IS NULL);

  -- WM-EAST projects -> Michael
  UPDATE projects SET owner_id = v_michael_id, primary_pm_id = v_michael_id, backup_pm_id = v_candy_id
  WHERE project_number = 'WMEA-26-001' AND (owner_id != v_michael_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_michael_id, primary_pm_id = v_michael_id, backup_pm_id = v_hector_id
  WHERE project_number = 'WMEA-26-003' AND (owner_id != v_michael_id OR primary_pm_id IS NULL);

  -- WM-SOUTH projects -> Hector/Candy
  UPDATE projects SET owner_id = v_hector_id, primary_pm_id = v_hector_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'WMSO-26-001' AND (owner_id != v_hector_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_hector_id, primary_pm_id = v_hector_id, backup_pm_id = v_candy_id
  WHERE project_number = 'WMSO-26-002' AND (owner_id != v_hector_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_candy_id, primary_pm_id = v_candy_id, backup_pm_id = v_hector_id
  WHERE project_number = 'WMSO-26-003' AND (owner_id != v_candy_id OR primary_pm_id IS NULL);

  -- AMT projects -> Crystal/Hector
  UPDATE projects SET owner_id = v_crystal_id, primary_pm_id = v_crystal_id, backup_pm_id = v_hector_id
  WHERE project_number = 'AMT-26-001' AND (owner_id != v_crystal_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_hector_id, primary_pm_id = v_hector_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'AMT-26-002' AND (owner_id != v_hector_id OR primary_pm_id IS NULL);

  -- SMM projects -> Candy
  UPDATE projects SET owner_id = v_candy_id, primary_pm_id = v_candy_id, backup_pm_id = v_michael_id
  WHERE project_number = 'SMM-26-001' AND (owner_id != v_candy_id OR primary_pm_id IS NULL);

  UPDATE projects SET owner_id = v_candy_id, primary_pm_id = v_candy_id, backup_pm_id = v_crystal_id
  WHERE project_number = 'SMM-26-002' AND (owner_id != v_candy_id OR primary_pm_id IS NULL);

  RAISE NOTICE 'Updated existing project PM assignments';
END $$;

SELECT 'Section 5: Demo projects created/updated (25 projects with PM assignments)' AS status;

-- ############################################################################
-- SECTION 6: WORKERS WITH PWA AUTH (PIN-enabled for PWA login)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_id UUID;
  v_pmi_id UUID;
  v_station_1_id UUID;
  v_station_5_id UUID;
  v_station_8_id UUID;
  v_station_10_id UUID;
BEGIN
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS';
  SELECT id INTO v_pmi_id FROM factories WHERE code = 'PMI';

  -- Get station IDs for primary assignments
  SELECT id INTO v_station_1_id FROM station_templates WHERE code = 'FRAME_WELD' AND factory_id IS NULL;
  SELECT id INTO v_station_5_id FROM station_templates WHERE code = 'ELEC_ROUGH' AND factory_id IS NULL;
  SELECT id INTO v_station_8_id FROM station_templates WHERE code = 'INWALL_INSP' AND factory_id IS NULL;
  SELECT id INTO v_station_10_id FROM station_templates WHERE code = 'FINAL_INSP' AND factory_id IS NULL;

  -- ============================================================================
  -- NWBS WORKERS (15 workers with varied roles)
  -- ============================================================================

  -- Leads with PIN hashes (PIN = 1234 for all, bcrypt hash)
  -- Note: Real hash for '1234' - use Edge Function to set properly
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date, pin_hash)
  VALUES
    -- Station Leads (can login to PWA)
    (v_nwbs_id, 'EMP001', 'Mike', 'Johnson', 'Lead Welder', v_station_1_id, true, 32.50, true, '2020-03-15', '$2a$10$rQKJmXqZmXqZmXqZmXqZmO6YVoLHKQxXcYXcYXcYXcYXcYXcYXc'),
    (v_nwbs_id, 'EMP002', 'James', 'Chen', 'Lead Carpenter', v_station_1_id, true, 30.00, true, '2019-06-01', '$2a$10$rQKJmXqZmXqZmXqZmXqZmO6YVoLHKQxXcYXcYXcYXcYXcYXcYXc'),
    (v_nwbs_id, 'EMP003', 'Sarah', 'Williams', 'Lead Electrician', v_station_5_id, true, 31.00, true, '2021-01-10', '$2a$10$rQKJmXqZmXqZmXqZmXqZmO6YVoLHKQxXcYXcYXcYXcYXcYXcYXc'),
    (v_nwbs_id, 'EMP004', 'Maria', 'Garcia', 'Lead Plumber', v_station_5_id, true, 29.50, true, '2021-04-18', '$2a$10$rQKJmXqZmXqZmXqZmXqZmO6YVoLHKQxXcYXcYXcYXcYXcYXcYXc'),
    (v_nwbs_id, 'EMP005', 'Jennifer', 'Davis', 'QC Lead Inspector', v_station_8_id, true, 28.50, true, '2020-02-28', '$2a$10$rQKJmXqZmXqZmXqZmXqZmO6YVoLHKQxXcYXcYXcYXcYXcYXcYXc'),
    (v_nwbs_id, 'EMP006', 'Robert', 'Martinez', 'QC Inspector', v_station_10_id, true, 27.00, true, '2021-09-15', '$2a$10$rQKJmXqZmXqZmXqZmXqZmO6YVoLHKQxXcYXcYXcYXcYXcYXcYXc'),

    -- Regular workers (no PIN - cannot login to PWA directly)
    (v_nwbs_id, 'EMP007', 'Carlos', 'Rodriguez', 'Carpenter', v_station_1_id, false, 24.50, true, '2022-08-22', NULL),
    (v_nwbs_id, 'EMP008', 'David', 'Thompson', 'Welder', v_station_1_id, false, 24.00, true, '2022-07-12', NULL),
    (v_nwbs_id, 'EMP009', 'Lisa', 'Anderson', 'Finish Carpenter', v_station_1_id, false, 25.00, true, '2022-09-30', NULL),
    (v_nwbs_id, 'EMP010', 'Kevin', 'Brown', 'Electrician', v_station_5_id, false, 26.00, true, '2023-01-15', NULL),
    (v_nwbs_id, 'EMP011', 'Amanda', 'Wilson', 'Plumber', v_station_5_id, false, 25.50, true, '2023-03-20', NULL),
    (v_nwbs_id, 'EMP012', 'Brian', 'Taylor', 'HVAC Tech', v_station_5_id, false, 27.50, true, '2022-11-08', NULL),
    (v_nwbs_id, 'EMP013', 'Michelle', 'Lee', 'Interior Finisher', v_station_8_id, false, 23.00, true, '2023-05-10', NULL),
    (v_nwbs_id, 'EMP014', 'Daniel', 'Harris', 'Laborer', v_station_1_id, false, 18.50, true, '2024-01-08', NULL),
    (v_nwbs_id, 'EMP015', 'Jessica', 'Clark', 'Laborer', v_station_1_id, false, 18.50, true, '2024-02-15', NULL);

  -- ============================================================================
  -- PMI WORKERS (10 workers)
  -- ============================================================================
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date, pin_hash)
  VALUES
    (v_pmi_id, 'PMI001', 'Anthony', 'Rivera', 'Lead Welder', v_station_1_id, true, 31.00, true, '2020-05-20', '$2a$10$rQKJmXqZmXqZmXqZmXqZmO6YVoLHKQxXcYXcYXcYXcYXcYXcYXc'),
    (v_pmi_id, 'PMI002', 'Patricia', 'Moore', 'Lead Electrician', v_station_5_id, true, 30.50, true, '2019-11-12', '$2a$10$rQKJmXqZmXqZmXqZmXqZmO6YVoLHKQxXcYXcYXcYXcYXcYXcYXc'),
    (v_pmi_id, 'PMI003', 'Thomas', 'Jackson', 'QC Lead', v_station_10_id, true, 28.00, true, '2021-02-08', '$2a$10$rQKJmXqZmXqZmXqZmXqZmO6YVoLHKQxXcYXcYXcYXcYXcYXcYXc'),
    (v_pmi_id, 'PMI004', 'Sandra', 'White', 'Carpenter', v_station_1_id, false, 24.00, true, '2022-04-15', NULL),
    (v_pmi_id, 'PMI005', 'Christopher', 'Lewis', 'Electrician', v_station_5_id, false, 25.50, true, '2022-06-20', NULL),
    (v_pmi_id, 'PMI006', 'Nancy', 'Walker', 'Plumber', v_station_5_id, false, 25.00, true, '2022-08-10', NULL),
    (v_pmi_id, 'PMI007', 'Steven', 'Hall', 'HVAC Tech', v_station_5_id, false, 26.50, true, '2023-01-25', NULL),
    (v_pmi_id, 'PMI008', 'Betty', 'Allen', 'Finisher', v_station_8_id, false, 22.50, true, '2023-04-05', NULL),
    (v_pmi_id, 'PMI009', 'Kenneth', 'Young', 'Laborer', v_station_1_id, false, 18.00, true, '2024-01-20', NULL),
    (v_pmi_id, 'PMI010', 'Dorothy', 'King', 'Laborer', v_station_1_id, false, 18.00, true, '2024-03-01', NULL);

  RAISE NOTICE 'Created 25 demo workers with PWA-enabled leads';
END $$;

SELECT 'Section 6: Demo workers created (25 workers, 9 PWA-enabled leads)' AS status;

-- ############################################################################
-- SECTION 7: MODULES AT VARIOUS STATIONS (For PWA Demo)
-- ############################################################################

DO $$
DECLARE
  v_project_id UUID;
  v_nwbs_id UUID;
  v_pmi_id UUID;
  v_station_ids UUID[];
  v_module_id UUID;
  i INTEGER;
BEGIN
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS';
  SELECT id INTO v_pmi_id FROM factories WHERE code = 'PMI';

  -- Get all station IDs in order
  SELECT ARRAY_AGG(id ORDER BY order_num) INTO v_station_ids
  FROM station_templates WHERE factory_id IS NULL;

  -- ============================================================================
  -- NWBS-26-001: Boise School District (8 modules across production line)
  -- Perfect for demonstrating module flow through all stations
  -- ============================================================================
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'NWBS-26-001';

  IF v_project_id IS NOT NULL THEN
    -- Module at Frame Welding (station 1) - just started
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_nwbs_id, 'NWBS-26-001-M1', 'Admin Wing A', 1, 'In Progress', v_station_ids[1], CURRENT_DATE, CURRENT_DATE + 14, 'government', false);

    -- Module at Rough Carpentry (station 2)
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_nwbs_id, 'NWBS-26-001-M2', 'Admin Wing B', 2, 'In Progress', v_station_ids[2], CURRENT_DATE - 2, CURRENT_DATE + 12, 'government', false);

    -- Module at Electrical (station 5) - RUSH
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush, special_requirements)
    VALUES (v_project_id, v_nwbs_id, 'NWBS-26-001-M3', 'Conference Center', 3, 'In Progress', v_station_ids[5], CURRENT_DATE - 5, CURRENT_DATE + 7, 'government', true, '["ADA Compliant", "Sound Proofing"]');

    -- Module at In-Wall Inspection (station 8) - QC checkpoint
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_nwbs_id, 'NWBS-26-001-M4', 'Restroom Block', 4, 'QC Hold', v_station_ids[8], CURRENT_DATE - 8, CURRENT_DATE + 5, 'government', false);

    -- Module at Interior Finish (station 9)
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_nwbs_id, 'NWBS-26-001-M5', 'Teacher Lounge', 5, 'In Progress', v_station_ids[9], CURRENT_DATE - 10, CURRENT_DATE + 3, 'government', false);

    -- Module at Final Inspection (station 10)
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_nwbs_id, 'NWBS-26-001-M6', 'Entry Foyer', 6, 'In Progress', v_station_ids[10], CURRENT_DATE - 12, CURRENT_DATE + 1, 'government', false);

    -- Module at Staging (station 11)
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
    VALUES (v_project_id, v_nwbs_id, 'NWBS-26-001-M7', 'Storage Unit', 7, 'Staged', v_station_ids[11], CURRENT_DATE - 14, CURRENT_DATE, 'government', false);

    -- Module completed/shipped
    INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, actual_start, actual_end, building_category, is_rush)
    VALUES (v_project_id, v_nwbs_id, 'NWBS-26-001-M8', 'Utility Room', 8, 'Shipped', v_station_ids[12], CURRENT_DATE - 20, CURRENT_DATE - 5, CURRENT_DATE - 20, CURRENT_DATE - 3, 'government', false);
  END IF;

  -- ============================================================================
  -- NWBS-26-002: Idaho State University (10 modules for larger project demo)
  -- ============================================================================
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'NWBS-26-002';

  IF v_project_id IS NOT NULL THEN
    FOR i IN 1..10 LOOP
      INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
      VALUES (
        v_project_id,
        v_nwbs_id,
        'NWBS-26-002-M' || i,
        'Lab Unit ' || CHR(64 + i),
        i,
        CASE
          WHEN i <= 2 THEN 'Shipped'
          WHEN i <= 5 THEN 'In Progress'
          WHEN i <= 7 THEN 'In Queue'
          ELSE 'Not Started'
        END,
        CASE
          WHEN i <= 2 THEN v_station_ids[12]
          WHEN i = 3 THEN v_station_ids[9]
          WHEN i = 4 THEN v_station_ids[7]
          WHEN i = 5 THEN v_station_ids[5]
          WHEN i = 6 THEN v_station_ids[3]
          WHEN i = 7 THEN v_station_ids[1]
          ELSE NULL
        END,
        CURRENT_DATE - (20 - i * 2),
        CURRENT_DATE + (i * 3),
        CASE WHEN i <= 3 THEN 'government' ELSE 'custom' END,
        CASE WHEN i = 4 THEN true ELSE false END
      );
    END LOOP;
  END IF;

  -- ============================================================================
  -- PMI-26-001: Phoenix VA Clinic (12 modules)
  -- ============================================================================
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'PMI-26-001';

  IF v_project_id IS NOT NULL THEN
    FOR i IN 1..12 LOOP
      INSERT INTO modules (project_id, factory_id, serial_number, name, sequence_number, status, current_station_id, scheduled_start, scheduled_end, building_category, is_rush)
      VALUES (
        v_project_id,
        v_pmi_id,
        'PMI-26-001-M' || i,
        'Clinic Section ' || i,
        i,
        CASE
          WHEN i <= 3 THEN 'Shipped'
          WHEN i <= 7 THEN 'In Progress'
          WHEN i <= 9 THEN 'In Queue'
          ELSE 'Not Started'
        END,
        CASE
          WHEN i <= 3 THEN v_station_ids[12]
          WHEN i = 4 THEN v_station_ids[10]
          WHEN i = 5 THEN v_station_ids[8]
          WHEN i = 6 THEN v_station_ids[6]
          WHEN i = 7 THEN v_station_ids[4]
          WHEN i = 8 THEN v_station_ids[2]
          WHEN i = 9 THEN v_station_ids[1]
          ELSE NULL
        END,
        CURRENT_DATE - (25 - i * 2),
        CURRENT_DATE + (i * 2),
        'government',
        false
      );
    END LOOP;
  END IF;

  RAISE NOTICE 'Created 30+ demo modules across projects';
END $$;

SELECT 'Section 7: Demo modules created (30+ modules at various stations)' AS status;

-- ############################################################################
-- SECTION 8: ACTIVE WORKER SHIFTS (Today's Attendance)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_id UUID;
  v_worker RECORD;
  v_shift_count INTEGER := 0;
BEGIN
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS';

  -- Clear today's shifts for fresh demo
  DELETE FROM worker_shifts
  WHERE factory_id = v_nwbs_id
  AND DATE(clock_in) = CURRENT_DATE;

  -- Create shifts for workers (randomized clock-in times)
  FOR v_worker IN
    SELECT id, employee_id, is_lead
    FROM workers
    WHERE factory_id = v_nwbs_id
    AND is_active = true
    LIMIT 12  -- 12 workers present today
  LOOP
    INSERT INTO worker_shifts (worker_id, factory_id, clock_in, source, status)
    VALUES (
      v_worker.id,
      v_nwbs_id,
      -- Stagger clock-in times between 5:30 AM and 7:00 AM
      CURRENT_DATE + INTERVAL '5 hours 30 minutes' + (random() * INTERVAL '90 minutes'),
      CASE WHEN v_worker.is_lead THEN 'app' ELSE 'kiosk' END,
      'active'
    );
    v_shift_count := v_shift_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % active shifts for today', v_shift_count;
END $$;

SELECT 'Section 8: Worker shifts created for today' AS status;

-- ############################################################################
-- SECTION 9: STATION ASSIGNMENTS (Crews at Stations)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_id UUID;
  v_module RECORD;
  v_lead_user_id UUID;
BEGIN
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS';

  -- Get a user who can be a lead (Plant_GM or Production_Manager at NWBS)
  -- lead_id is FK to users.id, NOT workers.id
  SELECT id INTO v_lead_user_id
  FROM users
  WHERE factory = 'NWBS'
  AND role IN ('Plant_GM', 'Production_Manager', 'PC')
  AND is_active = true
  LIMIT 1;

  -- Fallback to any active user if no factory-specific user found
  IF v_lead_user_id IS NULL THEN
    SELECT id INTO v_lead_user_id FROM users WHERE is_active = true LIMIT 1;
  END IF;

  -- Assign crews to modules currently in progress
  FOR v_module IN
    SELECT m.id AS module_id, m.serial_number, m.current_station_id, st.code AS station_code
    FROM modules m
    JOIN station_templates st ON st.id = m.current_station_id
    WHERE m.factory_id = v_nwbs_id
    AND m.status = 'In Progress'
    AND m.current_station_id IS NOT NULL
  LOOP
    -- Create station assignment
    -- Note: lead_id FK to users.id, crew_ids is array of user IDs (not worker IDs)
    INSERT INTO station_assignments (
      module_id, station_id, factory_id, lead_id, crew_ids,
      start_time, status, estimated_hours
    )
    VALUES (
      v_module.module_id,
      v_module.current_station_id,
      v_nwbs_id,
      v_lead_user_id,  -- FK to users.id
      '{}',            -- Empty array - crew_ids are user IDs, not worker IDs
      CURRENT_TIMESTAMP - INTERVAL '2 hours' + (random() * INTERVAL '4 hours'),
      'In Progress',
      6.0
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Created station assignments for active modules';
END $$;

SELECT 'Section 9: Station assignments created' AS status;

-- ############################################################################
-- SECTION 10: QC RECORDS (Sample Inspections)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_id UUID;
  v_module RECORD;
  v_inspector_id UUID;
BEGIN
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS';

  -- Get a QC inspector
  SELECT id INTO v_inspector_id
  FROM workers
  WHERE factory_id = v_nwbs_id
  AND title ILIKE '%QC%'
  AND is_active = true
  LIMIT 1;

  IF v_inspector_id IS NULL THEN
    SELECT id INTO v_inspector_id FROM workers WHERE factory_id = v_nwbs_id AND is_lead = true LIMIT 1;
  END IF;

  -- Create QC records for modules that passed through inspection stations
  FOR v_module IN
    SELECT m.id AS module_id, m.serial_number, st.id AS station_id
    FROM modules m
    JOIN station_templates st ON st.id = m.current_station_id
    WHERE m.factory_id = v_nwbs_id
    AND st.is_inspection_station = true
  LOOP
    INSERT INTO qc_records (
      module_id, station_id, factory_id, inspector_id,
      status, passed, score,
      checklist_results, notes, inspected_at
    )
    VALUES (
      v_module.module_id,
      v_module.station_id,
      v_nwbs_id,
      v_inspector_id,
      CASE WHEN random() > 0.2 THEN 'Passed' ELSE 'Failed' END,
      random() > 0.2,
      CASE WHEN random() > 0.2 THEN 85 + (random() * 15)::int ELSE 50 + (random() * 30)::int END,
      '[{"q": "Electrical inspection passed?", "passed": true, "note": ""}, {"q": "Plumbing inspection passed?", "passed": true, "note": ""}]'::jsonb,
      CASE WHEN random() > 0.8 THEN 'Minor touch-up required on finish' ELSE NULL END,
      CURRENT_TIMESTAMP - INTERVAL '1 hour' * (random() * 48)::int
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Created QC records for inspection stations';
END $$;

SELECT 'Section 10: QC records created' AS status;

-- ############################################################################
-- SECTION 11: PURCHASE ORDERS (For Inventory Receiving Demo)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_id UUID;
  v_pmi_id UUID;
  v_project_id UUID;
BEGIN
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS';
  SELECT id INTO v_pmi_id FROM factories WHERE code = 'PMI';
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'NWBS-26-001';

  -- Create sample purchase orders for NWBS
  INSERT INTO purchase_orders (factory_id, project_id, po_number, vendor_name, vendor_contact, status, order_date, expected_delivery, line_items, subtotal, tax, shipping, total)
  VALUES
    -- PO awaiting delivery today
    (v_nwbs_id, v_project_id, 'PO-NWBS-2026-001', 'BuildPro Supply', 'John Peterson', 'Ordered',
     CURRENT_DATE - 7, CURRENT_DATE,
     '[
       {"part_name": "2x4x8 Studs (Bundle 50)", "part_number": "LBR-2x4-8", "qty": 10, "unit_cost": 125.00, "received_qty": 0},
       {"part_name": "1/2\" OSB Sheathing 4x8", "part_number": "PLY-OSB-12", "qty": 50, "unit_cost": 32.50, "received_qty": 0},
       {"part_name": "30lb Felt Paper Roll", "part_number": "WB-FELT-30", "qty": 20, "unit_cost": 45.00, "received_qty": 0}
     ]'::jsonb,
     2975.00, 238.00, 150.00, 3363.00),

    -- PO partially received
    (v_nwbs_id, v_project_id, 'PO-NWBS-2026-002', 'Electrical Wholesale', 'Maria Santos', 'Partial',
     CURRENT_DATE - 14, CURRENT_DATE - 3,
     '[
       {"part_name": "12/2 Romex 250ft", "part_number": "EL-ROM-12-2", "qty": 20, "unit_cost": 89.00, "received_qty": 15},
       {"part_name": "14/2 Romex 250ft", "part_number": "EL-ROM-14-2", "qty": 15, "unit_cost": 72.00, "received_qty": 15},
       {"part_name": "20A Breakers (10pk)", "part_number": "EL-BRK-20A", "qty": 5, "unit_cost": 85.00, "received_qty": 3},
       {"part_name": "100A Main Panel", "part_number": "EL-PNL-100", "qty": 3, "unit_cost": 245.00, "received_qty": 3}
     ]'::jsonb,
     3540.00, 283.20, 0.00, 3823.20),

    -- PO pending (future delivery)
    (v_nwbs_id, v_project_id, 'PO-NWBS-2026-003', 'HVAC Direct', 'Tom Williams', 'Ordered',
     CURRENT_DATE - 3, CURRENT_DATE + 5,
     '[
       {"part_name": "3-Ton Package Unit", "part_number": "HVAC-PKG-3T", "qty": 2, "unit_cost": 4500.00, "received_qty": 0},
       {"part_name": "Flex Duct 6\" 25ft", "part_number": "HVAC-FLX-6", "qty": 10, "unit_cost": 35.00, "received_qty": 0},
       {"part_name": "Return Grille 20x20", "part_number": "HVAC-GRL-20", "qty": 8, "unit_cost": 28.00, "received_qty": 0}
     ]'::jsonb,
     9574.00, 765.92, 350.00, 10689.92),

    -- PO fully received (for history)
    (v_nwbs_id, v_project_id, 'PO-NWBS-2026-004', 'Plumbing Pro', 'Sarah Chen', 'Received',
     CURRENT_DATE - 21, CURRENT_DATE - 14,
     '[
       {"part_name": "PEX 3/4\" Red 100ft", "part_number": "PLM-PEX-34R", "qty": 5, "unit_cost": 68.00, "received_qty": 5},
       {"part_name": "PEX 3/4\" Blue 100ft", "part_number": "PLM-PEX-34B", "qty": 5, "unit_cost": 68.00, "received_qty": 5},
       {"part_name": "SharkBite Fittings Kit", "part_number": "PLM-SB-KIT", "qty": 3, "unit_cost": 125.00, "received_qty": 3}
     ]'::jsonb,
     1055.00, 84.40, 0.00, 1139.40);

  -- PMI purchase orders
  SELECT id INTO v_project_id FROM projects WHERE project_number = 'PMI-26-001';

  INSERT INTO purchase_orders (factory_id, project_id, po_number, vendor_name, vendor_contact, status, order_date, expected_delivery, line_items, subtotal, tax, shipping, total)
  VALUES
    (v_pmi_id, v_project_id, 'PO-PMI-2026-001', 'Southwest Building Supply', 'Mike Rodriguez', 'Ordered',
     CURRENT_DATE - 5, CURRENT_DATE + 2,
     '[
       {"part_name": "Metal Studs 3-5/8\" x 10ft", "part_number": "MS-358-10", "qty": 200, "unit_cost": 8.50, "received_qty": 0},
       {"part_name": "Track 3-5/8\" x 10ft", "part_number": "MT-358-10", "qty": 50, "unit_cost": 7.25, "received_qty": 0},
       {"part_name": "Drywall Screws #6 (5000)", "part_number": "HW-DWS-6", "qty": 10, "unit_cost": 45.00, "received_qty": 0}
     ]'::jsonb,
     2512.50, 175.88, 125.00, 2813.38);

  RAISE NOTICE 'Created 5 demo purchase orders';
END $$;

SELECT 'Section 11: Purchase orders created' AS status;

-- ############################################################################
-- SECTION 12: INVENTORY RECEIPTS (Sample Receipts)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_id UUID;
  v_po_id UUID;
  v_worker_id UUID;
BEGIN
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS';

  -- Get a lead worker for receiving
  SELECT id INTO v_worker_id
  FROM workers
  WHERE factory_id = v_nwbs_id
  AND is_lead = true
  LIMIT 1;

  -- Get the partially received PO
  SELECT id INTO v_po_id FROM purchase_orders WHERE po_number = 'PO-NWBS-2026-002';

  IF v_po_id IS NOT NULL AND v_worker_id IS NOT NULL THEN
    -- Create receipt records for the partial delivery
    -- Schema: status CHECK IN ('Received', 'Partial', 'Damaged', 'Rejected', 'Verified')
    INSERT INTO inventory_receipts (factory_id, po_id, po_line_index, part_name, part_number, quantity_expected, quantity_received, received_by, received_at, status, notes)
    VALUES
      (v_nwbs_id, v_po_id, 0, '12/2 Romex 250ft', 'EL-ROM-12-2', 20, 15, v_worker_id, CURRENT_TIMESTAMP - INTERVAL '3 days', 'Partial', 'Partial shipment - remaining 5 on backorder'),
      (v_nwbs_id, v_po_id, 1, '14/2 Romex 250ft', 'EL-ROM-14-2', 15, 15, v_worker_id, CURRENT_TIMESTAMP - INTERVAL '3 days', 'Received', NULL),
      (v_nwbs_id, v_po_id, 2, '20A Breakers (10pk)', 'EL-BRK-20A', 5, 3, v_worker_id, CURRENT_TIMESTAMP - INTERVAL '3 days', 'Partial', 'Vendor short-shipped - 2 more next week'),
      (v_nwbs_id, v_po_id, 3, '100A Main Panel', 'EL-PNL-100', 3, 3, v_worker_id, CURRENT_TIMESTAMP - INTERVAL '3 days', 'Received', NULL);
  END IF;

  RAISE NOTICE 'Created sample inventory receipts';
END $$;

SELECT 'Section 12: Inventory receipts created' AS status;

-- ############################################################################
-- SECTION 13: PLANT CONFIG (Factory Settings)
-- ############################################################################

DO $$
DECLARE
  v_nwbs_id UUID;
  v_pmi_id UUID;
BEGIN
  SELECT id INTO v_nwbs_id FROM factories WHERE code = 'NWBS';
  SELECT id INTO v_pmi_id FROM factories WHERE code = 'PMI';

  -- NWBS plant config
  INSERT INTO plant_config (factory_id, time_settings, efficiency_modules, calendar_settings)
  VALUES (
    v_nwbs_id,
    '{
      "shift_start": "06:00",
      "shift_end": "14:30",
      "ot_threshold": 8,
      "double_time_threshold": 12,
      "break_duration_minutes": 30,
      "lunch_duration_minutes": 30
    }'::jsonb,
    '{
      "takt_time_tracker": true,
      "queue_time_monitor": true,
      "qc_inspection": true,
      "crew_schedule": true,
      "attendance_dashboard": true,
      "kaizen_board": false,
      "defect_timer": false,
      "utilization_heatmap": false,
      "oee_calculator": false,
      "cross_training": false,
      "load_board": false,
      "line_simulator": false
    }'::jsonb,
    '{
      "work_days": [1, 2, 3, 4, 5],
      "holidays": ["2026-01-01", "2026-05-25", "2026-07-04", "2026-09-07", "2026-11-26", "2026-12-25"]
    }'::jsonb
  )
  ON CONFLICT (factory_id) DO UPDATE SET
    time_settings = EXCLUDED.time_settings,
    efficiency_modules = EXCLUDED.efficiency_modules,
    calendar_settings = EXCLUDED.calendar_settings;

  -- PMI plant config
  INSERT INTO plant_config (factory_id, time_settings, efficiency_modules, calendar_settings)
  VALUES (
    v_pmi_id,
    '{
      "shift_start": "05:00",
      "shift_end": "13:30",
      "ot_threshold": 8,
      "double_time_threshold": 12,
      "break_duration_minutes": 30,
      "lunch_duration_minutes": 30
    }'::jsonb,
    '{
      "takt_time_tracker": true,
      "queue_time_monitor": true,
      "qc_inspection": true,
      "crew_schedule": true,
      "attendance_dashboard": true
    }'::jsonb,
    '{
      "work_days": [1, 2, 3, 4, 5],
      "holidays": ["2026-01-01", "2026-05-25", "2026-07-04", "2026-09-07", "2026-11-26", "2026-12-25"]
    }'::jsonb
  )
  ON CONFLICT (factory_id) DO UPDATE SET
    time_settings = EXCLUDED.time_settings,
    efficiency_modules = EXCLUDED.efficiency_modules;

  RAISE NOTICE 'Created plant configurations';
END $$;

SELECT 'Section 13: Plant configurations created' AS status;

-- ############################################################################
-- SECTION 14: PROJECT WORKFLOW STATUS (PM Dashboard)
-- ############################################################################

DO $$
DECLARE
  v_project RECORD;
  v_station RECORD;
BEGIN
  -- Create workflow status for each project based on current_phase
  FOR v_project IN
    SELECT id, project_number, current_phase
    FROM projects
    WHERE status IN ('Active', 'In Progress')
  LOOP
    FOR v_station IN
      SELECT station_key, phase, display_order
      FROM workflow_stations
      WHERE is_active = true
      ORDER BY phase, display_order
    LOOP
      INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date)
      VALUES (
        v_project.id,
        v_station.station_key,
        CASE
          WHEN v_station.phase < v_project.current_phase THEN 'complete'
          WHEN v_station.phase = v_project.current_phase AND v_station.display_order <= 2 THEN 'in_progress'
          WHEN v_station.phase = v_project.current_phase THEN 'not_started'
          ELSE 'not_started'
        END,
        CASE WHEN v_station.phase <= v_project.current_phase THEN CURRENT_DATE - (30 - v_station.display_order) ELSE NULL END,
        CASE WHEN v_station.phase < v_project.current_phase THEN CURRENT_DATE - (20 - v_station.display_order) ELSE NULL END
      )
      ON CONFLICT (project_id, station_key) DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created project workflow statuses';
END $$;

SELECT 'Section 14: Project workflow status created' AS status;

-- ############################################################################
-- SECTION 15: VERIFICATION SUMMARY
-- ############################################################################

DO $$
DECLARE
  v_factory_count INTEGER;
  v_project_count INTEGER;
  v_module_count INTEGER;
  v_worker_count INTEGER;
  v_lead_count INTEGER;
  v_shift_count INTEGER;
  v_po_count INTEGER;
  v_receipt_count INTEGER;
  v_qc_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_factory_count FROM factories WHERE is_active = true;
  SELECT COUNT(*) INTO v_project_count FROM projects;
  SELECT COUNT(*) INTO v_module_count FROM modules;
  SELECT COUNT(*) INTO v_worker_count FROM workers WHERE is_active = true;
  SELECT COUNT(*) INTO v_lead_count FROM workers WHERE is_lead = true AND is_active = true;
  SELECT COUNT(*) INTO v_shift_count FROM worker_shifts WHERE DATE(clock_in) = CURRENT_DATE;
  SELECT COUNT(*) INTO v_po_count FROM purchase_orders;
  SELECT COUNT(*) INTO v_receipt_count FROM inventory_receipts;
  SELECT COUNT(*) INTO v_qc_count FROM qc_records;

  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║            COMPREHENSIVE DEMO DATA SUMMARY                        ║';
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  Factories:           % (all regions)', LPAD(v_factory_count::text, 3);
  RAISE NOTICE '║  Projects:            % (across all factories)', LPAD(v_project_count::text, 3);
  RAISE NOTICE '║  Modules:             % (at various stations)', LPAD(v_module_count::text, 3);
  RAISE NOTICE '║  Workers:             % total (% leads with PWA access)', LPAD(v_worker_count::text, 3), v_lead_count;
  RAISE NOTICE '║  Active Shifts Today: %', LPAD(v_shift_count::text, 3);
  RAISE NOTICE '║  Purchase Orders:     %', LPAD(v_po_count::text, 3);
  RAISE NOTICE '║  Inventory Receipts:  %', LPAD(v_receipt_count::text, 3);
  RAISE NOTICE '║  QC Records:          %', LPAD(v_qc_count::text, 3);
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  PWA LOGIN: Use any lead employee ID (EMP001-EMP006) with PIN    ║';
  RAISE NOTICE '║  DEV BYPASS: Use TEST/1234 for quick testing                     ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- ############################################################################
-- SECTION 15.5: CREATE MISSING TABLES (sales_customers, announcements, feature_flags)
-- ############################################################################
-- These tables may not exist if only PWA/PGM migrations were run.
-- Create them if they don't exist to ensure demo data can be inserted.

-- Sales Customers Table
CREATE TABLE IF NOT EXISTS sales_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing sales_customers table (in case table exists with different schema)
-- The existing sales_customers table may have a 'name' column (NOT NULL) instead of 'company_name'
-- We need to handle both schemas
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS name VARCHAR(200);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS company_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS contact_title VARCHAR(100);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
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
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE sales_customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add UNIQUE constraint on company_name (may already exist)
ALTER TABLE sales_customers DROP CONSTRAINT IF EXISTS sales_customers_company_name_key;
ALTER TABLE sales_customers ADD CONSTRAINT sales_customers_company_name_key UNIQUE (company_name);

-- Enable RLS
ALTER TABLE sales_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_customers_all" ON sales_customers;
CREATE POLICY "sales_customers_all" ON sales_customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales Quotes Table (base version - archived 08_SALES_DATA.sql has full schema)
CREATE TABLE IF NOT EXISTS sales_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number VARCHAR(50),
  customer_id UUID REFERENCES sales_customers(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'draft',
  total_price NUMERIC(12,2),
  valid_until DATE,
  won_date DATE,
  assigned_to UUID,
  notes TEXT,
  building_type VARCHAR(30),
  module_count INTEGER DEFAULT 1,
  factory VARCHAR(20),
  pm_flagged BOOLEAN DEFAULT false,
  outlook_percentage INTEGER,
  waiting_on TEXT,
  difficulty_rating INTEGER,
  is_latest_version BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing sales_quotes table (in case table exists with different schema)
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS quote_number VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'draft';
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS total_price NUMERIC(12,2);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS won_date DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_type VARCHAR(30);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS module_count INTEGER DEFAULT 1;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS factory VARCHAR(20);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged BOOLEAN DEFAULT false;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS outlook_percentage INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS waiting_on TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_quotes_all" ON sales_quotes;
CREATE POLICY "sales_quotes_all" ON sales_quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  announcement_type VARCHAR(30) DEFAULT 'info',
  target_roles TEXT[],
  target_factories TEXT[],
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_dismissible BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing announcements table (in case table exists with different schema)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS announcement_type VARCHAR(30) DEFAULT 'info';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_roles TEXT[];
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_factories TEXT[];
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_dismissible BOOLEAN DEFAULT true;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_all" ON announcements;
CREATE POLICY "announcements_all" ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(100) NOT NULL,
  name VARCHAR(200),
  description TEXT,
  category VARCHAR(50) DEFAULT 'feature',
  is_enabled BOOLEAN DEFAULT false,
  target_roles TEXT[],
  target_factories TEXT[],
  target_users UUID[],
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing feature_flags table (in case table exists with different schema)
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS flag_key VARCHAR(100);
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS name VARCHAR(200);
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'feature';
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT false;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS target_roles TEXT[];
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS target_factories TEXT[];
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS target_users UUID[];
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add UNIQUE constraint on flag_key (may already exist)
ALTER TABLE feature_flags DROP CONSTRAINT IF EXISTS feature_flags_flag_key_key;
ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_flag_key_key UNIQUE (flag_key);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_flags_all" ON feature_flags;
CREATE POLICY "feature_flags_all" ON feature_flags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Milestones Table (if not exists)
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  title VARCHAR(255) NOT NULL,
  due_date DATE,
  completed_date DATE,
  status VARCHAR(30) DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing milestones table (in case table exists with different schema)
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS completed_date DATE;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Pending';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "milestones_all" ON milestones;
CREATE POLICY "milestones_all" ON milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES (Safe to re-run)
-- ============================================================================
-- These columns may be missing if only base migrations were run

-- Tasks: Add internal_owner_id for internal assignment
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS internal_owner_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by UUID;

-- RFIs: Add internal_owner_id for internal assignment
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS internal_owner_id UUID;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS created_by UUID;

-- Submittals: Add internal_owner_id for internal assignment
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS internal_owner_id UUID;
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS created_by UUID;

SELECT 'Section 15.5: Created missing tables and added columns (sales_customers, sales_quotes, announcements, feature_flags, milestones, internal_owner_id columns)' AS status;

-- ############################################################################
-- SECTION 16: SALES CUSTOMERS (MODULAR DEALERS)
-- ############################################################################
-- NOTE: Sunbelt sells TO modular dealers, NOT to end users. These are our B2B customers.
-- Dealers then resell/lease our buildings to their end-user clients.
-- SCHEMA: name (legacy NOT NULL), company_name (new UNIQUE), company_type (dealer/national/regional),
-- contact_name, contact_title, contact_email, contact_phone, address_line1,
-- city, state, zip_code, factory (VARCHAR code), is_active

DO $$
BEGIN
  -- Include both 'name' (legacy NOT NULL column) and 'company_name' (new schema) to satisfy both schemas
  INSERT INTO sales_customers (name, company_name, company_type, contact_name, contact_title, contact_email, contact_phone, address_line1, city, state, zip_code, factory, is_active)
  VALUES
    -- National Dealer Accounts (Multi-Region)
    ('Mobile Modular Management Corporation', 'Mobile Modular Management Corporation', 'national', 'George Avila', 'VP Procurement', 'gavila@mobilemodular.com', '480-555-1001', '2400 N Central Ave', 'Phoenix', 'AZ', '85004', 'PMI', true),
    ('Williams Scotsman', 'Williams Scotsman', 'national', 'Casey Knipp', 'Regional Manager', 'cknipp@willscot.com', '602-555-1002', '1850 N Central Ave', 'Phoenix', 'AZ', '85004', 'PMI', true),
    ('ATCO Structures', 'ATCO Structures', 'national', 'Mark Thompson', 'Purchasing Director', 'mthompson@atco.com', '403-555-1003', '5302 Forand St SW', 'Calgary', 'AB', 'T3E', 'NWBS', true),
    ('ModSpace', 'ModSpace', 'national', 'Jennifer Walsh', 'Account Executive', 'jwalsh@modspace.com', '610-555-1004', '500 E Swedesford Rd', 'Wayne', 'PA', '19087', 'WM-EAST', true),
    ('Target Logistics', 'Target Logistics', 'national', 'Robert Chen', 'VP Operations', 'rchen@targetlogistics.com', '713-555-1005', '9811 Katy Freeway', 'Houston', 'TX', '77024', 'WM-SOUTH', true),

    -- Regional Dealer Accounts (Pacific Northwest - NWBS)
    ('Pacific Mobile Structures Inc', 'Pacific Mobile Structures Inc', 'regional', 'Lisa Chen', 'Sales Director', 'lchen@pacificmobile.com', '206-555-2001', '1420 5th Ave', 'Seattle', 'WA', '98101', 'NWBS', true),
    ('Northwest Modular Inc', 'Northwest Modular Inc', 'regional', 'Tom Anderson', 'Owner', 'tanderson@nwmodular.com', '208-555-2002', '4521 W State St', 'Boise', 'ID', '83703', 'NWBS', true),
    ('Modular Leasing Inc - Portland', 'Modular Leasing Inc - Portland', 'regional', 'Sarah Martinez', 'Branch Manager', 'smartinez@modularleasing.com', '503-555-2003', '1000 SW Broadway', 'Portland', 'OR', '97205', 'NWBS', true),

    -- Regional Dealer Accounts (Southwest - PMI)
    ('Arizona Modular Solutions', 'Arizona Modular Solutions', 'regional', 'Mike Rodriguez', 'Sales Manager', 'mrodriguez@azmodular.com', '480-555-3001', '7301 E Shea Blvd', 'Scottsdale', 'AZ', '85260', 'PMI', true),
    ('Desert Building Partners', 'Desert Building Partners', 'regional', 'David Wilson', 'Account Manager', 'dwilson@desertbp.com', '602-555-3002', '2121 E Camelback Rd', 'Phoenix', 'AZ', '85016', 'PMI', true),
    ('Southwest Portable Structures', 'Southwest Portable Structures', 'regional', 'Patricia Gomez', 'VP Sales', 'pgomez@swportable.com', '505-555-3003', '500 Marquette Ave NW', 'Albuquerque', 'NM', '87102', 'PMI', true),

    -- Regional Dealer Accounts (Southeast - SMM/WM-EAST)
    ('Modular Management Group', 'Modular Management Group', 'regional', 'Sarah Johnson', 'Regional Director', 'sjohnson@mmg-se.com', '404-555-4001', '5678 Corporate Dr', 'Atlanta', 'GA', '30301', 'SMM', true),
    ('Carolina Modular Group', 'Carolina Modular Group', 'regional', 'James Patterson', 'VP Sales', 'jpatterson@cmg-nc.com', '704-555-4002', '227 W Trade St', 'Charlotte', 'NC', '28202', 'WM-EAST', true),
    ('Southeastern Portable Buildings', 'Southeastern Portable Buildings', 'regional', 'Michelle Davis', 'Sales Director', 'mdavis@sepb.com', '205-555-4003', '2100 1st Ave N', 'Birmingham', 'AL', '35203', 'SMM', true),

    -- Regional Dealer Accounts (Texas/South - WM-SOUTH/AMT)
    ('Texas Building Solutions', 'Texas Building Solutions', 'regional', 'Carlos Hernandez', 'President', 'chernandez@texasbs.com', '512-555-5001', '501 Congress Ave', 'Austin', 'TX', '78701', 'AMT', true),
    ('Gulf States Modular', 'Gulf States Modular', 'regional', 'Amanda Foster', 'Sales Manager', 'afoster@gulfstatesmod.com', '713-555-5002', '1200 Smith St', 'Houston', 'TX', '77002', 'WM-SOUTH', true),
    ('Lone Star Portable Buildings', 'Lone Star Portable Buildings', 'regional', 'Kevin Brown', 'VP Operations', 'kbrown@lonestarportable.com', '214-555-5003', '2001 Ross Ave', 'Dallas', 'TX', '75201', 'AMT', true),

    -- Specialty Dealers (Government/Education Focus)
    ('Mobilease Modular Space Inc', 'Mobilease Modular Space Inc', 'dealer', 'Josh Ellis', 'Government Contracts', 'jellis@mobilease.com', '770-555-6001', '789 Lease Dr', 'Atlanta', 'GA', '30301', 'SSI', true)
  ON CONFLICT (company_name) DO UPDATE SET
    name = EXCLUDED.name,
    contact_name = EXCLUDED.contact_name,
    contact_email = EXCLUDED.contact_email,
    is_active = EXCLUDED.is_active;

  RAISE NOTICE 'Created 18 demo modular dealers (sales customers)';
END $$;

SELECT 'Section 16: Sales customers created' AS status;

-- ############################################################################
-- SECTION 17: SALES QUOTES
-- ############################################################################
-- SCHEMA: quote_number, customer_id, status, total_price, valid_until, won_date,
-- assigned_to, notes, building_type, module_count, factory, pm_flagged,
-- outlook_percentage, waiting_on, difficulty_rating
-- STATUS VALUES: draft, pending, sent, negotiating, awaiting_po, po_received, won, lost, expired, converted

DO $$
DECLARE
  v_customer_id UUID;
  v_sales_rep_id UUID;
  v_quote_count INTEGER := 0;
BEGIN
  -- Get a sales rep or any user
  SELECT id INTO v_sales_rep_id FROM users WHERE role IN ('Sales_Rep', 'Sales_Manager', 'PM') AND is_active = true LIMIT 1;

  IF v_sales_rep_id IS NULL THEN
    SELECT id INTO v_sales_rep_id FROM users WHERE is_active = true LIMIT 1;
  END IF;

  -- Draft Quotes (3)
  FOR v_customer_id IN SELECT id FROM sales_customers LIMIT 3 LOOP
    INSERT INTO sales_quotes (customer_id, quote_number, status, valid_until, building_type, module_count, total_price, assigned_to, factory, notes, outlook_percentage, difficulty_rating)
    VALUES (
      v_customer_id,
      'Q-2026-' || LPAD((v_quote_count + 1)::text, 4, '0'),
      'draft',
      CURRENT_DATE + 30 - (v_quote_count * 2),
      CASE WHEN v_quote_count = 0 THEN 'CUSTOM' WHEN v_quote_count = 1 THEN 'GOVERNMENT' ELSE 'FLEET/STOCK' END,
      4 + v_quote_count,
      (500000 + v_quote_count * 150000)::numeric,
      v_sales_rep_id,
      CASE WHEN v_quote_count = 0 THEN 'NWBS' ELSE 'PMI' END,
      'Initial quote - needs finalization',
      25,
      2
    );
    v_quote_count := v_quote_count + 1;
  END LOOP;

  -- Sent Quotes (4)
  FOR v_customer_id IN SELECT id FROM sales_customers OFFSET 3 LIMIT 4 LOOP
    INSERT INTO sales_quotes (customer_id, quote_number, status, valid_until, building_type, module_count, total_price, assigned_to, factory, pm_flagged, notes, outlook_percentage, difficulty_rating)
    VALUES (
      v_customer_id,
      'Q-2026-' || LPAD((v_quote_count + 1)::text, 4, '0'),
      'sent',
      CURRENT_DATE + 20,
      CASE v_quote_count % 3 WHEN 0 THEN 'GOVERNMENT' WHEN 1 THEN 'CUSTOM' ELSE 'FLEET/STOCK' END,
      3 + (v_quote_count % 4),
      (400000 + v_quote_count * 100000)::numeric,
      v_sales_rep_id,
      CASE v_quote_count % 2 WHEN 0 THEN 'NWBS' ELSE 'WM-EVERGREEN' END,
      v_quote_count % 2 = 0,
      'Sent to customer, awaiting response',
      50,
      3
    );
    v_quote_count := v_quote_count + 1;
  END LOOP;

  -- Negotiating Quotes (5)
  FOR v_customer_id IN SELECT id FROM sales_customers OFFSET 7 LIMIT 5 LOOP
    INSERT INTO sales_quotes (customer_id, quote_number, status, valid_until, building_type, module_count, total_price, assigned_to, factory, pm_flagged, notes, outlook_percentage, waiting_on, difficulty_rating)
    VALUES (
      v_customer_id,
      'Q-2026-' || LPAD((v_quote_count + 1)::text, 4, '0'),
      'negotiating',
      CURRENT_DATE + 15,
      CASE v_quote_count % 4 WHEN 0 THEN 'GOVERNMENT' WHEN 1 THEN 'CUSTOM' WHEN 2 THEN 'FLEET/STOCK' ELSE 'Business' END,
      5 + (v_quote_count % 5),
      (600000 + v_quote_count * 200000)::numeric,
      v_sales_rep_id,
      CASE v_quote_count % 3 WHEN 0 THEN 'PMI' WHEN 1 THEN 'WM-SOUTH' ELSE 'NWBS' END,
      true,
      'In active negotiation with customer',
      65,
      CASE v_quote_count % 3 WHEN 0 THEN 'Budget approval' WHEN 1 THEN 'Board meeting' ELSE 'Final specs' END,
      4
    );
    v_quote_count := v_quote_count + 1;
  END LOOP;

  -- Awaiting PO (3)
  FOR v_customer_id IN SELECT id FROM sales_customers OFFSET 12 LIMIT 3 LOOP
    INSERT INTO sales_quotes (customer_id, quote_number, status, valid_until, building_type, module_count, total_price, assigned_to, factory, pm_flagged, notes, outlook_percentage, waiting_on, difficulty_rating)
    VALUES (
      v_customer_id,
      'Q-2026-' || LPAD((v_quote_count + 1)::text, 4, '0'),
      'awaiting_po',
      CURRENT_DATE + 5,
      CASE v_quote_count % 2 WHEN 0 THEN 'CUSTOM' ELSE 'GOVERNMENT' END,
      6 + (v_quote_count % 3),
      (800000 + v_quote_count * 250000)::numeric,
      v_sales_rep_id,
      'NWBS',
      true,
      'Customer accepted - waiting on PO',
      90,
      'PO from customer',
      3
    );
    v_quote_count := v_quote_count + 1;
  END LOOP;

  -- Won (converted to projects) - 3
  FOR v_customer_id IN SELECT id FROM sales_customers OFFSET 15 LIMIT 3 LOOP
    INSERT INTO sales_quotes (customer_id, quote_number, status, valid_until, building_type, module_count, total_price, assigned_to, factory, notes, won_date, outlook_percentage)
    VALUES (
      v_customer_id,
      'Q-2025-' || LPAD((100 + v_quote_count)::text, 4, '0'),
      'won',
      CURRENT_DATE - (60 + v_quote_count * 5),
      'GOVERNMENT',
      8 + (v_quote_count % 4),
      (1000000 + v_quote_count * 300000)::numeric,
      v_sales_rep_id,
      'NWBS',
      'Converted to project',
      CURRENT_DATE - (55 + v_quote_count * 5),
      100
    );
    v_quote_count := v_quote_count + 1;
  END LOOP;

  -- Lost (3) - note: no lost_reason column, use notes field instead
  INSERT INTO sales_quotes (customer_id, quote_number, status, valid_until, building_type, module_count, total_price, assigned_to, factory, notes, outlook_percentage)
  SELECT
    id,
    'Q-2025-' || LPAD((200 + ROW_NUMBER() OVER())::text, 4, '0'),
    'lost',
    CURRENT_DATE - 30,
    'CUSTOM',
    4,
    450000,
    v_sales_rep_id,
    'PMI',
    'Lost to competitor - ' || CASE (ROW_NUMBER() OVER())::int % 3 WHEN 0 THEN 'Price issue' WHEN 1 THEN 'Timing conflict' ELSE 'Competitor won' END,
    0
  FROM sales_customers
  LIMIT 3;

  RAISE NOTICE 'Created % demo sales quotes', v_quote_count + 3;
END $$;

SELECT 'Section 17: Sales quotes created' AS status;

-- ############################################################################
-- SECTION 18: TASKS
-- ############################################################################
-- SCHEMA: project_id, title, description, status, priority, due_date, start_date,
-- assignee_id (old), internal_owner_id (internal owner), assigned_to_contact_id (directory),
-- assigned_to_name, assigned_to_email, notify_contacts (JSONB), created_by
-- STATUS: Not Started, In Progress, Awaiting Response, Completed, Cancelled

DO $$
DECLARE
  v_project RECORD;
  v_user_id UUID;
  v_task_count INTEGER := 0;
BEGIN
  -- Get a user for task assignments
  SELECT id INTO v_user_id FROM users WHERE is_active = true LIMIT 1;

  FOR v_project IN SELECT id, project_number, current_phase FROM projects WHERE status = 'In Progress' LOOP
    -- Create 5-10 tasks per project
    INSERT INTO tasks (project_id, title, description, status, priority, internal_owner_id, due_date, created_by)
    VALUES
      (v_project.id, 'Review drawings package', 'Complete review of latest drawing set',
       CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'In Progress' END,
       'High', v_user_id, CURRENT_DATE + 7, v_user_id),

      (v_project.id, 'Coordinate with engineering', 'Schedule engineering review meeting',
       CASE WHEN v_project.current_phase > 3 THEN 'Completed' ELSE 'In Progress' END,
       'High', v_user_id, CURRENT_DATE + 14, v_user_id),

      (v_project.id, 'Submit color selections', 'Get dealer color selections confirmed',
       CASE WHEN v_project.current_phase > 2 THEN 'Completed' WHEN v_project.current_phase = 2 THEN 'In Progress' ELSE 'Not Started' END,
       'Medium', v_user_id, CURRENT_DATE + 10, v_user_id),

      (v_project.id, 'Order long lead items', 'Place POs for equipment with long lead times',
       CASE WHEN v_project.current_phase > 2 THEN 'Completed' ELSE 'Not Started' END,
       'High', v_user_id, CURRENT_DATE + 21, v_user_id),

      (v_project.id, 'State approval submission', 'Prepare and submit state approval package',
       CASE WHEN v_project.current_phase > 3 THEN 'Completed' WHEN v_project.current_phase = 3 THEN 'In Progress' ELSE 'Not Started' END,
       'Critical', v_user_id, CURRENT_DATE + 30, v_user_id);

    -- Additional tasks for Phase 4 projects
    IF v_project.current_phase >= 4 THEN
      INSERT INTO tasks (project_id, title, description, status, priority, internal_owner_id, due_date, created_by)
      VALUES
        (v_project.id, 'Production schedule review', 'Review module production sequence', 'In Progress', 'High', v_user_id, CURRENT_DATE + 5, v_user_id),
        (v_project.id, 'QC checklist preparation', 'Prepare QC inspection checklists', 'Completed', 'Medium', v_user_id, CURRENT_DATE - 5, v_user_id),
        (v_project.id, 'Delivery coordination', 'Coordinate transport and delivery dates', 'Not Started', 'High', v_user_id, CURRENT_DATE + 25, v_user_id);
    END IF;

    v_task_count := v_task_count + 1;
  END LOOP;

  RAISE NOTICE 'Created tasks for % projects', v_task_count;
END $$;

SELECT 'Section 18: Tasks created' AS status;

-- ############################################################################
-- SECTION 19: RFIs
-- ############################################################################
-- SCHEMA: project_id, rfi_number, subject, question, answer, status, priority, due_date,
-- sent_to, sent_to_email, internal_owner_id, is_external,
-- assigned_to_contact_id, assigned_to_name, assigned_to_email, notify_contacts,
-- spec_section, drawing_reference, created_by
-- STATUS: Draft, Open, Pending, Answered, Closed

-- Fix: Drop NOT NULL constraint on sent_to if it exists (existing schema may have this as NOT NULL)
ALTER TABLE rfis ALTER COLUMN sent_to DROP NOT NULL;

DO $$
DECLARE
  v_project RECORD;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE is_active = true LIMIT 1;

  FOR v_project IN SELECT id, project_number FROM projects WHERE current_phase IN (2, 3) LIMIT 10 LOOP
    INSERT INTO rfis (project_id, rfi_number, subject, question, status, priority, internal_owner_id, due_date, created_by, sent_to)
    VALUES
      (v_project.id, v_project.project_number || '-RFI-001', 'Wall section clarification',
       'Please clarify the wall section detail at the connection to the existing structure.',
       'Open', 'High', v_user_id, CURRENT_DATE + 7, v_user_id, 'Dealer'),

      (v_project.id, v_project.project_number || '-RFI-002', 'Electrical panel location',
       'Confirm electrical panel location per updated site constraints.',
       'Answered', 'Medium', v_user_id, CURRENT_DATE - 3, v_user_id, 'Dealer'),

      (v_project.id, v_project.project_number || '-RFI-003', 'HVAC unit specifications',
       'Need confirmation on HVAC tonnage for the main office area.',
       'Pending', 'High', v_user_id, CURRENT_DATE + 14, v_user_id, 'Architect');
  END LOOP;

  RAISE NOTICE 'Created RFIs for projects';
END $$;

SELECT 'Section 19: RFIs created' AS status;

-- ############################################################################
-- SECTION 20: SUBMITTALS
-- ############################################################################
-- SCHEMA: project_id, submittal_number, title, submittal_type, status, revision_number,
-- spec_section, manufacturer, model_number, reviewer_comments, due_date, submitted_date,
-- sent_to, sent_to_email, internal_owner_id, is_external,
-- assigned_to_contact_id, assigned_to_name, assigned_to_email, notify_contacts, created_by
-- STATUS: Pending, Submitted, Under Review, Approved, Rejected

-- Fix: Drop NOT NULL constraint on sent_to if it exists (existing schema may have this as NOT NULL)
ALTER TABLE submittals ALTER COLUMN sent_to DROP NOT NULL;

DO $$
DECLARE
  v_project RECORD;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE is_active = true LIMIT 1;

  FOR v_project IN SELECT id, project_number FROM projects WHERE current_phase >= 2 LIMIT 12 LOOP
    INSERT INTO submittals (project_id, submittal_number, title, submittal_type, status, internal_owner_id, due_date, created_by, sent_to)
    VALUES
      (v_project.id, v_project.project_number || '-SUB-001', 'Window specifications',
       'Product Data',
       CASE WHEN random() > 0.5 THEN 'Approved' ELSE 'Under Review' END,
       v_user_id, CURRENT_DATE + 10, v_user_id, 'Dealer'),

      (v_project.id, v_project.project_number || '-SUB-002', 'Roofing material',
       'Product Data',
       CASE WHEN random() > 0.3 THEN 'Approved' ELSE 'Pending' END,
       v_user_id, CURRENT_DATE + 14, v_user_id, 'Dealer'),

      (v_project.id, v_project.project_number || '-SUB-003', 'Flooring samples',
       'Samples',
       CASE WHEN random() > 0.6 THEN 'Approved' ELSE 'Submitted' END,
       v_user_id, CURRENT_DATE + 7, v_user_id, 'Architect'),

      (v_project.id, v_project.project_number || '-SUB-004', 'Electrical fixtures',
       'Shop Drawings',
       'Pending',
       v_user_id, CURRENT_DATE + 21, v_user_id, 'Engineer');
  END LOOP;

  RAISE NOTICE 'Created submittals for projects';
END $$;

SELECT 'Section 20: Submittals created' AS status;

-- ############################################################################
-- SECTION 21: MILESTONES
-- ############################################################################
-- SCHEMA: project_id, name (legacy NOT NULL), title, due_date, completed_date, status, notes
-- STATUS: Pending, Completed

-- Fix: Drop NOT NULL constraint on name if it exists (existing schema may have this as NOT NULL)
-- Also add title column if it doesn't exist
ALTER TABLE milestones ALTER COLUMN name DROP NOT NULL;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS title VARCHAR(255);

DO $$
DECLARE
  v_project RECORD;
BEGIN
  FOR v_project IN SELECT id, project_number, start_date, target_online_date FROM projects LOOP
    -- Include both 'name' (legacy) and 'title' (new) to satisfy both schemas
    INSERT INTO milestones (project_id, name, title, due_date, status, notes)
    VALUES
      (v_project.id, 'Project Kickoff', 'Project Kickoff', v_project.start_date, 'Completed', 'Initial project kickoff meeting'),
      (v_project.id, 'Drawings 100% Complete', 'Drawings 100% Complete', v_project.start_date + 30,
       CASE WHEN CURRENT_DATE > v_project.start_date + 30 THEN 'Completed' ELSE 'Pending' END,
       'Final construction drawings approved'),
      (v_project.id, 'Engineering Approval', 'Engineering Approval', v_project.start_date + 45,
       CASE WHEN CURRENT_DATE > v_project.start_date + 45 THEN 'Completed' ELSE 'Pending' END,
       'Engineering review complete'),
      (v_project.id, 'Production Start', 'Production Start', v_project.start_date + 60,
       CASE WHEN CURRENT_DATE > v_project.start_date + 60 THEN 'Completed' ELSE 'Pending' END,
       'First module enters production'),
      (v_project.id, 'Delivery Complete', 'Delivery Complete', v_project.target_online_date - 7, 'Pending', 'All modules delivered to site'),
      (v_project.id, 'Project Closeout', 'Project Closeout', v_project.target_online_date, 'Pending', 'Final documentation and warranty');
  END LOOP;

  RAISE NOTICE 'Created milestones for all projects';
END $$;

SELECT 'Section 21: Milestones created' AS status;

-- ############################################################################
-- SECTION 22: CHANGE ORDERS
-- ############################################################################
-- SCHEMA: project_id, change_order_number, co_number, change_type, co_type, status,
-- description, reason, notes, date, submitted_date, sent_date, signed_date, implemented_date,
-- total_amount, document_url, created_by
-- STATUS: Draft, Pending, Approved, Rejected

DO $$
DECLARE
  v_project RECORD;
  v_user_id UUID;
  v_co_num INTEGER := 1;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE is_active = true LIMIT 1;

  FOR v_project IN SELECT id, project_number FROM projects WHERE current_phase >= 3 LIMIT 8 LOOP
    INSERT INTO change_orders (project_id, change_order_number, co_number, change_type, description, reason, total_amount, status, date, created_by)
    VALUES
      (v_project.id, v_project.project_number || '-CO-001', v_co_num, 'General',
       'Additional electrical outlets - Customer requested 12 additional outlets in office areas',
       'Customer request',
       8500.00, 'Approved', CURRENT_DATE - 20, v_user_id),

      (v_project.id, v_project.project_number || '-CO-002', v_co_num + 1, 'General',
       'Upgraded HVAC controls - Smart thermostat upgrade for all zones',
       'Value engineering',
       12000.00, CASE WHEN random() > 0.5 THEN 'Approved' ELSE 'Pending' END,
       CURRENT_DATE - 10, v_user_id);

    v_co_num := v_co_num + 2;
  END LOOP;

  RAISE NOTICE 'Created change orders';
END $$;

SELECT 'Section 22: Change orders created' AS status;

-- ############################################################################
-- SECTION 23: LONG LEAD ITEMS
-- ############################################################################
-- ACTUAL SCHEMA (from 20260115_plant_manager_system.sql migration):
-- project_id, module_id, factory_id, part_name (NOT NULL), part_number, vendor,
-- lead_days (NOT NULL), status, ordered, ordered_at, ordered_by, expected_date, received_date
-- STATUS: Identified, Approval Pending, Approved, Ordered, Shipped, Received, Verified

DO $$
DECLARE
  v_project RECORD;
  v_user_id UUID;
  v_factory_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE is_active = true LIMIT 1;

  FOR v_project IN SELECT p.id, p.project_number, p.factory_id FROM projects p WHERE p.current_phase = 2 LIMIT 6 LOOP
    INSERT INTO long_lead_items (project_id, factory_id, part_name, part_number, vendor, lead_days, status, ordered, ordered_at, expected_date)
    VALUES
      (v_project.id, v_project.factory_id, 'HVAC Package Unit - 5 Ton', 'HVAC-5T-001', 'Carrier HVAC Supply', 56, 'Ordered', true, CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_DATE + 42),
      (v_project.id, v_project.factory_id, 'Commercial Windows - Custom Size', 'WIN-CUST-001', 'Pella Commercial', 70, 'Identified', false, NULL, CURRENT_DATE + 70),
      (v_project.id, v_project.factory_id, 'Fire Suppression Panel', 'FIRE-PNL-001', 'SimpliSafe Commercial', 42, 'Ordered', true, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_DATE + 35),
      (v_project.id, v_project.factory_id, 'Generator - 30kW', 'GEN-30KW-001', 'Generac Power Systems', 84,
       CASE WHEN random() > 0.5 THEN 'Received' ELSE 'Ordered' END,
       true, CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_DATE + 24);
  END LOOP;

  RAISE NOTICE 'Created long lead items';
END $$;

SELECT 'Section 23: Long lead items created' AS status;

-- ############################################################################
-- SECTION 24: COLOR SELECTIONS
-- ############################################################################
-- SCHEMA: project_id, category, custom_category, item_name, color_name, color_code,
-- manufacturer, product_line, cutsheet_url, cutsheet_name,
-- is_non_stock, non_stock_verified, non_stock_lead_time,
-- status, submitted_date, confirmed_date, notes, created_by

DO $$
DECLARE
  v_project RECORD;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE is_active = true LIMIT 1;

  FOR v_project IN SELECT id, project_number FROM projects WHERE current_phase >= 2 LIMIT 10 LOOP
    INSERT INTO color_selections (project_id, category, item_name, color_name, color_code, manufacturer, status, notes, created_by)
    VALUES
      (v_project.id, 'Wall', 'Wall Paint', 'Agreeable Gray', 'SW 7029', 'Sherwin Williams',
       CASE WHEN random() > 0.3 THEN 'Confirmed' ELSE 'Pending' END, 'Main interior walls', v_user_id),
      (v_project.id, 'Trim', 'Trim Paint', 'Extra White', 'SW 7006', 'Sherwin Williams', 'Confirmed', 'All interior trim', v_user_id),
      (v_project.id, 'Floor', 'VCT Flooring', 'Coastal Gray', 'CG-2847', 'Armstrong',
       CASE WHEN random() > 0.4 THEN 'Confirmed' ELSE 'Submitted' END, 'Main traffic areas', v_user_id),
      (v_project.id, 'Carpet', 'Carpet Tile', 'Steel Blue', 'SB-1122', 'Interface', 'Pending', 'Private offices', v_user_id),
      (v_project.id, 'Exterior', 'Exterior Siding', 'Sandstone', 'JH-4521', 'James Hardie', 'Confirmed', 'Primary exterior color', v_user_id),
      (v_project.id, 'Cabinet', 'Kitchen Cabinets', 'Maple Natural', 'MN-100', 'Kraftmaid', 'Confirmed', 'Kitchen and break room', v_user_id);
  END LOOP;

  RAISE NOTICE 'Created color selections';
END $$;

SELECT 'Section 24: Color selections created' AS status;

-- ############################################################################
-- SECTION 25: ANNOUNCEMENTS
-- ############################################################################
-- SCHEMA: title, message (legacy NOT NULL), content (new), announcement_type (info, warning, critical, maintenance),
-- target_roles (TEXT[]), target_factories (TEXT[]),
-- starts_at (TIMESTAMPTZ), expires_at (TIMESTAMPTZ),
-- is_dismissible, is_active, created_by

-- Fix: Existing schema has 'message' as NOT NULL, new schema uses 'content'
-- Handle both by including both columns
ALTER TABLE announcements ALTER COLUMN message DROP NOT NULL;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS content TEXT;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE is_active = true LIMIT 1;

  -- Include both 'message' (legacy NOT NULL) and 'content' (new) to satisfy both schemas
  INSERT INTO announcements (title, message, content, announcement_type, starts_at, expires_at, target_roles, is_dismissible, is_active, created_by)
  VALUES
    ('System Maintenance Scheduled',
     'The system will undergo scheduled maintenance on Sunday from 2 AM to 6 AM PST. Please save your work beforehand.',
     'The system will undergo scheduled maintenance on Sunday from 2 AM to 6 AM PST. Please save your work beforehand.',
     'maintenance', (CURRENT_DATE + 3)::timestamptz, (CURRENT_DATE + 4)::timestamptz, NULL, true, true, v_user_id),

    ('New PWA Mobile App Available',
     'The new mobile floor app is now available for leads and QC inspectors. Login with your employee ID and PIN.',
     'The new mobile floor app is now available for leads and QC inspectors. Login with your employee ID and PIN.',
     'info', (CURRENT_DATE - 7)::timestamptz, (CURRENT_DATE + 30)::timestamptz, ARRAY['Plant_GM', 'PM', 'Director'], true, true, v_user_id),

    ('Q1 Production Goals Update',
     'Congratulations! We exceeded Q1 production targets by 12%. Keep up the great work!',
     'Congratulations! We exceeded Q1 production targets by 12%. Keep up the great work!',
     'info', (CURRENT_DATE - 14)::timestamptz, (CURRENT_DATE + 14)::timestamptz, NULL, true, true, v_user_id),

    ('Safety Reminder: PPE Required',
     'All personnel must wear appropriate PPE when on the production floor. This includes hard hats, safety glasses, and steel-toed boots.',
     'All personnel must wear appropriate PPE when on the production floor. This includes hard hats, safety glasses, and steel-toed boots.',
     'warning', CURRENT_TIMESTAMP, (CURRENT_DATE + 90)::timestamptz, ARRAY['Plant_GM', 'PC'], false, true, v_user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created announcements';
END $$;

SELECT 'Section 25: Announcements created' AS status;

-- ############################################################################
-- SECTION 26: FEATURE FLAGS
-- ############################################################################
-- SCHEMA: key (legacy NOT NULL), flag_key (new UNIQUE), name, description,
-- category (feature, ui, experimental, maintenance),
-- is_enabled, target_roles (TEXT[]), target_factories (TEXT[]), target_users (UUID[]),
-- metadata (JSONB), created_by

-- Fix: Existing schema has 'key' as NOT NULL, new schema uses 'flag_key'
-- Handle both by including both columns
ALTER TABLE feature_flags ALTER COLUMN key DROP NOT NULL;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS flag_key VARCHAR(100);

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE is_active = true LIMIT 1;

  -- Include both 'key' (legacy NOT NULL) and 'flag_key' (new) to satisfy both schemas
  INSERT INTO feature_flags (key, flag_key, name, description, is_enabled, category, target_roles, created_by)
  VALUES
    ('pwa_enabled', 'pwa_enabled', 'PWA Mobile App', 'Enable the PWA mobile floor app for workers', true, 'feature', ARRAY['Plant_GM', 'PM', 'Director', 'IT_Manager'], v_user_id),
    ('dark_mode', 'dark_mode', 'Dark Mode', 'Enable dark mode UI option', true, 'ui', NULL, v_user_id),
    ('real_time_updates', 'real_time_updates', 'Real-Time Updates', 'Enable real-time Supabase subscriptions', true, 'feature', NULL, v_user_id),
    ('advanced_analytics', 'advanced_analytics', 'Advanced Analytics', 'Enable advanced analytics dashboard', true, 'feature', ARRAY['VP', 'Director', 'IT_Manager'], v_user_id),
    ('export_pdf', 'export_pdf', 'PDF Export', 'Enable PDF export for reports', true, 'feature', NULL, v_user_id),
    ('batch_import', 'batch_import', 'Praxis Batch Import', 'Enable bulk import from Praxis', true, 'feature', ARRAY['PM', 'Sales_Manager', 'IT_Manager'], v_user_id),
    ('ai_suggestions', 'ai_suggestions', 'AI Suggestions', 'Enable AI-powered suggestions (experimental)', false, 'experimental', ARRAY['IT_Manager'], v_user_id),
    ('offline_mode', 'offline_mode', 'Offline Mode', 'Enable offline capabilities in PWA', true, 'feature', NULL, v_user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created feature flags';
END $$;

SELECT 'Section 26: Feature flags created' AS status;

-- ############################################################################
-- SECTION 27: FINAL VERIFICATION
-- ############################################################################

DO $$
DECLARE
  v_factory_count INTEGER;
  v_project_count INTEGER;
  v_module_count INTEGER;
  v_worker_count INTEGER;
  v_lead_count INTEGER;
  v_shift_count INTEGER;
  v_po_count INTEGER;
  v_receipt_count INTEGER;
  v_qc_count INTEGER;
  v_customer_count INTEGER;
  v_quote_count INTEGER;
  v_task_count INTEGER;
  v_rfi_count INTEGER;
  v_submittal_count INTEGER;
  v_milestone_count INTEGER;
  v_announcement_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_factory_count FROM factories WHERE is_active = true;
  SELECT COUNT(*) INTO v_project_count FROM projects;
  SELECT COUNT(*) INTO v_module_count FROM modules;
  SELECT COUNT(*) INTO v_worker_count FROM workers WHERE is_active = true;
  SELECT COUNT(*) INTO v_lead_count FROM workers WHERE is_lead = true AND is_active = true;
  SELECT COUNT(*) INTO v_shift_count FROM worker_shifts WHERE DATE(clock_in) = CURRENT_DATE;
  SELECT COUNT(*) INTO v_po_count FROM purchase_orders;
  SELECT COUNT(*) INTO v_receipt_count FROM inventory_receipts;
  SELECT COUNT(*) INTO v_qc_count FROM qc_records;
  SELECT COUNT(*) INTO v_customer_count FROM sales_customers;
  SELECT COUNT(*) INTO v_quote_count FROM sales_quotes;
  SELECT COUNT(*) INTO v_task_count FROM tasks;
  SELECT COUNT(*) INTO v_rfi_count FROM rfis;
  SELECT COUNT(*) INTO v_submittal_count FROM submittals;
  SELECT COUNT(*) INTO v_milestone_count FROM milestones;
  SELECT COUNT(*) INTO v_announcement_count FROM announcements WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║            COMPREHENSIVE DEMO DATA - FINAL SUMMARY                    ║';
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  CORE SYSTEM:                                                         ║';
  RAISE NOTICE '║    Factories:           %', LPAD(v_factory_count::text, 4);
  RAISE NOTICE '║    Projects:            %', LPAD(v_project_count::text, 4);
  RAISE NOTICE '║    Tasks:               %', LPAD(v_task_count::text, 4);
  RAISE NOTICE '║    RFIs:                %', LPAD(v_rfi_count::text, 4);
  RAISE NOTICE '║    Submittals:          %', LPAD(v_submittal_count::text, 4);
  RAISE NOTICE '║    Milestones:          %', LPAD(v_milestone_count::text, 4);
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  SALES PIPELINE:                                                      ║';
  RAISE NOTICE '║    Customers:           %', LPAD(v_customer_count::text, 4);
  RAISE NOTICE '║    Quotes:              %', LPAD(v_quote_count::text, 4);
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  PLANT MANAGER (PGM):                                                 ║';
  RAISE NOTICE '║    Modules:             %', LPAD(v_module_count::text, 4);
  RAISE NOTICE '║    Workers:             % (% leads)', LPAD(v_worker_count::text, 4), v_lead_count;
  RAISE NOTICE '║    Active Shifts:       %', LPAD(v_shift_count::text, 4);
  RAISE NOTICE '║    QC Records:          %', LPAD(v_qc_count::text, 4);
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  PWA / INVENTORY:                                                     ║';
  RAISE NOTICE '║    Purchase Orders:     %', LPAD(v_po_count::text, 4);
  RAISE NOTICE '║    Inventory Receipts:  %', LPAD(v_receipt_count::text, 4);
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  IT ADMIN:                                                            ║';
  RAISE NOTICE '║    Announcements:       %', LPAD(v_announcement_count::text, 4);
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  PWA LOGIN: EMP001-EMP006 / PIN 1234  |  DEV: TEST / 1234            ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- Final status
SELECT 'COMPREHENSIVE DEMO DATA SETUP COMPLETE!' AS status;
