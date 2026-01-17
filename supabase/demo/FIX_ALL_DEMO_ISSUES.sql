-- ============================================================================
-- FIX_ALL_DEMO_ISSUES.sql
-- COMPREHENSIVE FIX FILE - Run this single file to fix all demo issues
--
-- Fixes included:
-- 1. Announcements - dismissals table, type column, duplicates
-- 2. Sales quotes - FK constraint for assigned_to
-- 3. Directory contacts - populate from CSV data
-- 4. Crew members - 100 workers for NWBS
-- 5. Modules - realistic modules for NWBS projects
-- 6. PC-specific projects - stock/fleet projects for Project Coordinators
-- 7. Sales pipeline - quotes for PC-driven projects
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ############################################################################
-- SECTION 1: ANNOUNCEMENTS FIX
-- ############################################################################

-- Create announcement_dismissals table
CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL,
  user_id UUID NOT NULL,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Add FK constraints if table was created fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'announcement_dismissals_announcement_id_fkey'
  ) THEN
    ALTER TABLE announcement_dismissals
    ADD CONSTRAINT announcement_dismissals_announcement_id_fkey
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add announcement FK: %', SQLERRM;
END $$;

-- Enable RLS
ALTER TABLE announcement_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcement_dismissals_all" ON announcement_dismissals;
CREATE POLICY "announcement_dismissals_all" ON announcement_dismissals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add type column to announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS type VARCHAR(30);

-- Sync type from announcement_type
UPDATE announcements SET type = announcement_type WHERE type IS NULL AND announcement_type IS NOT NULL;
UPDATE announcements SET type = 'info' WHERE type IS NULL;

-- Remove duplicate announcements
DELETE FROM announcements
WHERE id NOT IN (
  SELECT DISTINCT ON (title) id
  FROM announcements
  ORDER BY title, created_at DESC
);

-- Make all announcements dismissible
UPDATE announcements SET is_dismissible = true WHERE is_dismissible = false;

SELECT 'Section 1: Announcements fixed' AS status;

-- ############################################################################
-- SECTION 2: SALES QUOTES FK FIX
-- ############################################################################

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
    RAISE NOTICE 'Added FK constraint for sales_quotes.assigned_to';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add sales_quotes FK: %', SQLERRM;
END $$;

-- Add dealer_id FK if missing
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_id UUID;

SELECT 'Section 2: Sales quotes FK fixed' AS status;

-- ############################################################################
-- SECTION 3: DIRECTORY CONTACTS
-- ############################################################################

-- Clear existing and repopulate
DELETE FROM directory_contacts;

-- Insert all contacts with correct column names
INSERT INTO directory_contacts (first_name, last_name, email, position, phone_main, phone_cell, phone_extension, factory_code, department_code, is_active)
VALUES
  -- SNB Corporate - Executive
  ('Ron', 'Procunier', NULL, 'Chief Executive Officer (CEO)', '6024476460', NULL, NULL, 'SNB', 'EXECUTIVE', true),
  ('Bob', 'Lahmann', 'bob.lahmann@sunbeltmodular.com', 'Chief Financial Officer (CFO)', NULL, '4103007926', NULL, 'SNB', 'EXECUTIVE', true),
  ('Gary', 'Davenport', 'gary.davenport@sunbeltmodular.com', 'Chief Revenue Officer (CRO)', NULL, '7046193665', NULL, 'SNB', 'EXECUTIVE', true),

  -- SNB - Finance/Accounting
  ('Mitch', 'Marois', 'mitch.marois@sunbeltmodular.com', 'Director of FP&A', '6024476460', '6025793316', '138', 'SNB', 'ACCOUNTING', true),
  ('Irina', 'Lee', 'irina.lee@sunbeltmodular.com', 'FP&A Analyst', NULL, '6236937203', NULL, 'SNB', 'ACCOUNTING', true),
  ('Dawn', 'Polk', 'dawn.polk@sunbeltmodular.com', 'Cost Acct Manager - East', NULL, '9123812106', NULL, 'SNB', 'ACCOUNTING', true),
  ('Wendy', 'Li', 'wendy.li@sunbeltmodular.com', 'Corporate Controller', '6024476460', '6029108008', '303', 'SNB', 'ACCOUNTING', true),

  -- SNB - HR
  ('Ibet', 'Murillo', 'ibet.murillo@sunbeltmodular.com', 'Vice President of HR & Integration', '6024476460', '6024668456', '112', 'SNB', 'HR', true),
  ('Argelia', 'Gonzalez', 'argelia.gonzalez@sunbeltmodular.com', 'Benefits/Payroll Supervisor', '6024476460', '6025411021', '124', 'SNB', 'HR', true),

  -- SNB - Marketing
  ('Toni', 'Jacoby', 'toni.jacoby@sunbeltmodular.com', 'Director of Marketing', NULL, '6027689265', NULL, 'SNB', 'MARKETING', true),

  -- SNB - Sales
  ('Frank', 'Monahan', 'frank.monahan@sunbeltmodular.com', 'Vice President of Business Development', NULL, '6027934869', NULL, 'SNB', 'SALES', true),
  ('Brent', 'Morgan', 'bmorgan@britcousa.com', 'Vice President of Sales (Central)', '2547416701', '2543138306', NULL, 'SNB', 'SALES', true),
  ('Casey', 'Tanner', 'casey.tanner@sunbeltmodular.com', 'Vice President of Sales (East)', NULL, '9123812757', NULL, 'SNB', 'SALES', true),
  ('Jay', 'Vanvlerah', 'jay.vanvlerah@sunbeltmodular.com', 'Vice President of Sales (West)', NULL, '2142074044', NULL, 'SNB', 'SALES', true),
  ('Jason', 'King', 'jason.king@sunbeltmodular.com', 'Sales Manager - Major Projects (Central)', '6024476460', '6027815134', '122', 'SNB', 'SALES', true),
  ('Casey', 'Knipp', 'casey.knipp@sunbeltmodular.com', 'Sales Manager - Major Projects (West)', '6024476460', '6027815208', '106', 'SNB', 'SALES', true),

  -- SNB - Operations
  ('Jay', 'Daniels', 'jay.daniels@sunbeltmodular.com', 'Vice President of Operations', '6024476460', '6023274768', '129', 'SNB', 'OPERATIONS', true),
  ('David', 'Mejia', 'david.mejia@sunbeltmodular.com', 'Vice President of Estimating & Inventory Systems', '6024476460', '6023274770', '104', 'SNB', 'OPERATIONS', true),

  -- SNB - Project Managers
  ('Candace', 'Juhnke', 'candy.juhnke@sunbeltmodular.com', 'Project Manager', NULL, '6028037224', NULL, 'SNB', 'OPERATIONS', true),
  ('Crystal', 'Myers', 'crystal.myers@sunbeltmodular.com', 'Project Manager', NULL, NULL, NULL, 'SNB', 'OPERATIONS', true),
  ('Michael', 'Caracciolo', 'michael.caracciolo@sunbeltmodular.com', 'Project Manager', NULL, '4808481076', NULL, 'SNB', 'OPERATIONS', true),
  ('Matthew', 'McDaniel', 'matthew.mcdaniel@sunbeltmodular.com', 'Project Manager', NULL, '4808484715', NULL, 'SNB', 'OPERATIONS', true),
  ('Hector', 'Vazquez', 'hector.vazquez@sunbeltmodular.com', 'Project Manager', NULL, '2545004038', NULL, 'SNB', 'OPERATIONS', true),

  -- SNB - IT
  ('David', 'Sousa', 'david.sousa@sunbeltmodular.com', 'IT Manager - West', '6024476460', '6024781531', '139', 'SNB', 'IT', true),
  ('Joy', 'Thomas', 'joy.thomas@sunbeltmodular.com', 'Lead Programmer', NULL, '4806888899', NULL, 'SNB', 'IT', true),

  -- SNB - Engineering
  ('Shaylon', 'Vaughn', 'shaylon.vaughn@sunbeltmodular.com', 'Director of Engineering', NULL, '6232023528', NULL, 'SNB', 'ENGINEERING', true),
  ('Lois', 'Plymale', 'lois.plymale@sunbeltmodular.com', 'Architect', '3527282930', '3527741679', NULL, 'SNB', 'ENGINEERING', true),

  -- SNB - Drafting
  ('Michael', 'Schneider', 'michael.schneider@sunbeltmodular.com', 'Director of Drafting', '6024476460', '2144356267', '115', 'SNB', 'DRAFTING', true),
  ('Russ', 'Kory', 'russ.kory@sunbeltmodular.com', 'Drafting Manager - West Region', '6024476460', '4808885037', '132', 'SNB', 'DRAFTING', true),

  -- SNB - Manufacturing
  ('Devin', 'Duvak', 'devin.duvak@sunbeltmodular.com', 'Vice President of Manufacturing', '8174471213', '8175593737', '5801', 'SNB', 'PRODUCTION', true),
  ('Joe', 'Hall', 'joe.hall@sunbeltmodular.com', 'Director of Manufacturing (East)', '2299375401', '2299384640', NULL, 'SNB', 'PRODUCTION', true),

  -- SNB - Purchasing
  ('Frank', 'Delucia', 'frank.delucia@sunbeltmodular.com', 'Director of Purchasing', '6024476460', '6025824368', '103', 'SNB', 'PURCHASING', true),

  -- SNB - Safety
  ('Marci', 'Mitchell', 'marci.mitchell@sunbeltmodular.com', 'Director of Safety & Warranty', '6024476460', '6028030507', '101', 'SNB', 'SAFETY', true),

  -- ============================================================================
  -- NWBS (Northwest Building Systems)
  -- ============================================================================
  ('Ross', 'Parks', 'ross.parks@nwbsinc.com', 'Plant General Manager', '2083443527', '2088663615', NULL, 'NWBS', 'EXECUTIVE', true),
  ('Jenn', 'Parks', 'jenn.parks@nwbsinc.com', 'Accounting Manager', '2083443527', '2088602719', NULL, 'NWBS', 'ACCOUNTING', true),
  ('Alondra', 'Vargas', 'alondra.vargas@nwbsinc.com', 'HR/Payroll Specialist', '2083443527', NULL, NULL, 'NWBS', 'HR', true),
  ('Jennifer', 'Lonergan', 'jennifer.lonergan@nwbsinc.com', 'Office Admin/AP', '2083443527', NULL, '0', 'NWBS', 'ACCOUNTING', true),
  ('Mitch', 'Quintana', 'mitch.quintana@nwbsinc.com', 'Sales Manager', '2083443527', '2088602582', NULL, 'NWBS', 'SALES', true),
  ('Robert', 'Thaler', 'robert.thaler@nwbsinc.com', 'Estimator', '2083443527', '2088602763', NULL, 'NWBS', 'SALES', true),
  ('Justin', 'Downing', 'justin.downing@nwbsinc.com', 'Production Manager', '2083443527', '2087139828', '9', 'NWBS', 'PRODUCTION', true),
  ('Steve', 'Cummings', 'steve.cummings@nwbsinc.com', 'Plant Manager 1', '2083443527', NULL, NULL, 'NWBS', 'PRODUCTION', true),
  ('Ronnie', 'Ludquist', 'ronald.lundquist@nwbsinc.com', 'Plant Manager 2', '2083443527', NULL, NULL, 'NWBS', 'PRODUCTION', true),
  ('Russ', 'Metzger', 'russ.metzger@nwbsinc.com', 'Purchasing Manager', '2083443527', '2088674781', '1', 'NWBS', 'PURCHASING', true),
  ('Justin', 'Weast', 'justin.weast@nwbsinc.com', 'Purchasing Assistant', '2083443527', '2086059974', '7', 'NWBS', 'PURCHASING', true),
  ('Kelly', 'Daniels', 'kelly.daniels@nwbsinc.com', 'Drafter', '2083443527', '2084841662', NULL, 'NWBS', 'DRAFTING', true),
  ('James', 'McLeod', 'james.mcleod@nwbsinc.com', 'Drafter', '2083443527', NULL, NULL, 'NWBS', 'DRAFTING', true),
  ('Trent', 'Thomson', 'trent.thomson@nwbsinc.com', 'Quality Assurance Manager', '2083443527', '2084051197', NULL, 'NWBS', 'QUALITY', true),
  ('Jeff', 'Murray', 'jeff.murray@nwbsinc.com', 'Safety Coordinator', '2083443527', '2085737322', NULL, 'NWBS', 'SAFETY', true),

  -- ============================================================================
  -- PMI (Phoenix Modular Industries)
  -- ============================================================================
  ('Monty', 'King', 'monty.king@phoenixmodular.com', 'Plant General Manager', '6024476460', '6023274771', '116', 'PMI', 'EXECUTIVE', true),
  ('Amber', 'Chase', 'amber.chase@phoenixmodular.com', 'Plant Accounting Manager', '6024476460', '6053765322', '306', 'PMI', 'ACCOUNTING', true),
  ('Brian', 'Shackleford', 'brian.shackleford@phoenixmodular.com', 'Sales Manager', '6024476460', '6023975474', '105', 'PMI', 'SALES', true),
  ('Rafael', 'Quiros', 'rafael.quiros@phoenixmodular.com', 'Production Manager', '6024476460', '6023206044', '135', 'PMI', 'PRODUCTION', true),
  ('Sam', 'Murillo', 'sam.murillo@phoenixmodular.com', 'Purchasing Manager', '6024476460', '6028030066', '113', 'PMI', 'PURCHASING', true),
  ('Rodrigo', 'Mejia', 'rodrigo.mejia@phoenixmodular.com', 'Drafting Manager', '6024476460', NULL, '107', 'PMI', 'DRAFTING', true),
  ('Shawn', 'Stroh', 'shawn.stroh@phoenixmodular.com', 'Quality Assurance Manager', '6024476460', '6023305439', '123', 'PMI', 'QUALITY', true),

  -- ============================================================================
  -- AMT (Amtex Modular)
  -- ============================================================================
  ('Noel', 'Lindsey', 'noel.lindsey@amtexcorp.com', 'Plant General Manager', '9722767626', '2144500546', '107', 'AMT', 'EXECUTIVE', true),
  ('Darian', 'Curry', 'darian.curry@amtexcorp.com', 'Accounting Manager', '9722767626', '4697240141', '110', 'AMT', 'ACCOUNTING', true),
  ('Kelly', 'Kellie', 'kelly.kellie@amtexcorp.com', 'Sales Manager', '9722767626', '4694169979', '103', 'AMT', 'SALES', true),
  ('Luis', 'Resendiz', 'luis.resendiz@amtexcorp.com', 'Production Manager', '9722767626', '2147344582', '117', 'AMT', 'PRODUCTION', true),
  ('Tommy', 'Garcia', 'tommy.garcia@amtexcorp.com', 'Purchasing Manager', '9722767626', '4696905288', '115', 'AMT', 'PURCHASING', true),
  ('Edward', 'Vrzalik', 'edward.vrzalik@amtexcorp.com', 'Drafting Manager', '9722767626', NULL, '108', 'AMT', 'DRAFTING', true),
  ('Roy', 'Thompson', 'roy.thompson@amtexcorp.com', 'Quality Assurance Manager', '9722767626', '2145511936', '106', 'AMT', 'QUALITY', true),

  -- ============================================================================
  -- SMM (Southeast Modular Manufacturing)
  -- ============================================================================
  ('Joe', 'Reid', 'joe.reid@southeastmodular.com', 'Plant General Manager', '3527282930', '2143368582', '301', 'SMM', 'EXECUTIVE', true),
  ('Nancy', 'Davis', 'nancy.davis@southeastmodular.com', 'Accounting Manager', '3527282930', '3524466978', '328', 'SMM', 'ACCOUNTING', true),
  ('Don', 'Eisman', 'don.eisman@southeastmodular.com', 'Sales Manager', '3527282930', '5743337089', '326', 'SMM', 'SALES', true),
  ('Mike', 'Stoica', 'mike.stoica@southeastmodular.com', 'Production Manager', '3527282930', '3524466482', '313', 'SMM', 'PRODUCTION', true),
  ('Steve', 'Dudley', 'steve.dudley@southeastmodular.com', 'Purchasing Manager', '3527282930', '3525160631', '310', 'SMM', 'PURCHASING', true),
  ('Chris', 'Smith', 'chris.smith@southeastmodular.com', 'Drafting Manager', '3527282930', NULL, '307', 'SMM', 'DRAFTING', true),
  ('Daniel', 'Lemusmora', 'daniel.lemusmora@southeastmodular.com', 'Quality Assurance Manager', '3527282930', '3529103963', '302', 'SMM', 'QUALITY', true),

  -- ============================================================================
  -- WM-EVERGREEN (Whitley Evergreen)
  -- ============================================================================
  ('Randy', 'Maddox', 'randymaddox@whitleyman.com', 'General Manager', '3606535790', NULL, '23', 'WM-EVERGREEN', 'EXECUTIVE', true),
  ('Hank', 'Kennedy', 'hankkennedy@whitleyman.com', 'Estimating', '3606535790', NULL, '18', 'WM-EVERGREEN', 'SALES', true),
  ('Clint', 'Williams', 'clintwilliams@whitleyman.com', 'Production Manager', '3606535790', NULL, '26', 'WM-EVERGREEN', 'PRODUCTION', true),
  ('Walt', 'Hylback', 'walthylback@whitleyman.com', 'Purchasing Manager', '3606535790', NULL, '24', 'WM-EVERGREEN', 'PURCHASING', true),
  ('Mike', 'Perry', 'mikeperry@whitleyman.com', 'Design Manager', '3606535790', NULL, '22', 'WM-EVERGREEN', 'DRAFTING', true),
  ('Mike', 'Soley', 'mikesoley@whitleyman.com', 'QA/QC Manager', '3606535790', NULL, '26', 'WM-EVERGREEN', 'QUALITY', true),

  -- ============================================================================
  -- WM-EAST (Whitley East)
  -- ============================================================================
  ('Joe', 'Dattoli', 'JoeDattoli@whitleyman.com', 'General Manager', '7176562081', '7178261711', '470', 'WM-EAST', 'EXECUTIVE', true),
  ('Christine', 'Kline', 'ChristineKline@whitleyman.com', 'Sales/Estimating', '7176562081', '6102230507', '450', 'WM-EAST', 'SALES', true),
  ('Dylan', 'Loper', 'DylanLoper@whitleyman.com', 'Operations Manager', '7176562081', '7178812728', '410', 'WM-EAST', 'OPERATIONS', true),
  ('Craig', 'Smith', 'CraigSmith@whitleyman.com', 'Purchaser Manager', '7176562081', '7175724596', '421', 'WM-EAST', 'PURCHASING', true),
  ('Ethan', 'Paul', 'EthanPaul@whitleyman.com', 'Engineering/Design/IT', '7176562081', '5704155358', '440', 'WM-EAST', 'ENGINEERING', true),
  ('Kevin', 'Stauffer', 'EastQA2@whitleyman.com', 'QA Manager', '7176562081', '6105852881', '412', 'WM-EAST', 'QUALITY', true),

  -- ============================================================================
  -- WM-SOUTH (Whitley South)
  -- ============================================================================
  ('Simon', 'Dragan', 'SimonDragan@whitleyman.com', 'CEO', '2607235131', '2604500264', '218', 'WM-SOUTH', 'EXECUTIVE', true),
  ('Drew', 'Welborn', 'DrewWelborn@whitleyman.com', 'President', '2607235131', '2604505904', '204', 'WM-SOUTH', 'EXECUTIVE', true),
  ('Don', 'Harlan', 'DonHarlan@whitleyman.com', 'Plant Manager', '2607235131', '5745270371', '222', 'WM-SOUTH', 'PRODUCTION', true),
  ('Dan', 'Lipinski', 'DanLipinski@whitleyman.com', 'Estimator', '2607235131', '2604099614', '212', 'WM-SOUTH', 'SALES', true),
  ('Gage', 'Benson', 'GageBenson@whitleyman.com', 'Purchasing', '2607235131', '2604095471', '209', 'WM-SOUTH', 'PURCHASING', true),
  ('Adam', 'Parker', 'AdamParker@whitleyman.com', 'Drafting', '2607235131', '2605031481', '229', 'WM-SOUTH', 'DRAFTING', true),

  -- ============================================================================
  -- WM-ROCHESTER (Whitley Rochester)
  -- ============================================================================
  ('Kole', 'Kroft', 'KoleKroft@whitleyman.com', 'General Manager', '5742234934', '2198633733', '109', 'WM-ROCHESTER', 'EXECUTIVE', true),
  ('Rob', 'Farris', 'RobFarris@whitleyman.com', 'Production Manager P1', '5742234934', '5742018691', '108', 'WM-ROCHESTER', 'PRODUCTION', true),
  ('Linda', 'Martin', 'LindaMartin@whitleyman.com', 'Purchasing Manager', '5742234934', '5747212592', '128', 'WM-ROCHESTER', 'PURCHASING', true),
  ('Whitney', 'Farris', 'WhitneyFarris@whitleyman.com', 'Quality Control Manager', '5742234934', '5742303891', '102', 'WM-ROCHESTER', 'QUALITY', true),

  -- ============================================================================
  -- SSI (Specialized Structures)
  -- ============================================================================
  ('Glenn', 'Gardner', 'glenn.gardner@specializedstructures.com', 'Plant General Manager', '9125346111', '9125346111', NULL, 'SSI', 'EXECUTIVE', true),
  ('Peggy', 'Forest', 'peggy.forest@specializedstructures.com', 'Accounting Manager', '9125346111', '9123100878', NULL, 'SSI', 'ACCOUNTING', true),
  ('Josh', 'Ellis', 'josh.ellis@specializedstructures.com', 'Sales Manager', '9125346111', '9123270256', NULL, 'SSI', 'SALES', true),
  ('Grant', 'Gardner', 'grant.gardner@specializedstructures.com', 'Production Manager', '9125346111', '9123099603', NULL, 'SSI', 'PRODUCTION', true),
  ('Charlie', 'Bennett', 'charlie.bennett@specializedstructures.com', 'Purchasing Manager', '9125346111', '9123812063', NULL, 'SSI', 'PURCHASING', true),

  -- ============================================================================
  -- IBI (Indicom Buildings)
  -- ============================================================================
  ('Beth', 'Berry', 'beth.berry@indicombuildings.com', 'Plant General Manager', '8174471213', '8179153844', '5814', 'IBI', 'EXECUTIVE', true),
  ('Patsy', 'Mejia', 'patsy.mejia@indicombuildings.com', 'Accounting Supervisor', '8174471213', '8173579214', '5835', 'IBI', 'ACCOUNTING', true),
  ('Levi', 'Porter', 'levi.porter@indicombuildings.com', 'Sales Manager', '8174471213', '6823478050', '5840', 'IBI', 'SALES', true),
  ('Frank', 'Saenz', 'frank.saenz@indicombuildings.com', 'Production Manager', '8174471213', NULL, '5842', 'IBI', 'PRODUCTION', true),
  ('Tichelle', 'Halford', 'tichelle.halford@indicombuildings.com', 'Purchasing Manager', '8174471213', NULL, '5824', 'IBI', 'PURCHASING', true),
  ('Matthew', 'Scott', 'matthew.scott@indicombuildings.com', 'Engineering Manager', '8174471213', '8177741206', '5831', 'IBI', 'ENGINEERING', true),
  ('Erik', 'Fabela', 'erik.fabela@indicombuildings.com', 'Warranty/QC Manager', '8174471213', '8176917954', '5841', 'IBI', 'QUALITY', true);

SELECT 'Section 3: Directory contacts populated (' || COUNT(*) || ' contacts)' AS status FROM directory_contacts;

-- ############################################################################
-- SECTION 4: CREW MEMBERS FOR NWBS (100 workers)
-- ############################################################################

DO $$
DECLARE
  v_factory_id UUID;
  v_station_ids UUID[];
BEGIN
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;

  IF v_factory_id IS NULL THEN
    RAISE NOTICE 'NWBS factory not found';
    RETURN;
  END IF;

  SELECT ARRAY_AGG(id ORDER BY order_num) INTO v_station_ids
  FROM station_templates
  WHERE factory_id IS NULL OR factory_id = v_factory_id
  LIMIT 12;

  -- Check if enough workers exist
  IF (SELECT COUNT(*) FROM workers WHERE factory_id = v_factory_id) >= 50 THEN
    RAISE NOTICE 'NWBS already has sufficient workers';
    RETURN;
  END IF;

  DELETE FROM workers WHERE factory_id = v_factory_id;

  -- Frame/Floor Station (15 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-001', 'Mike', 'Johnson', 'Lead Framer', v_station_ids[1], true, 28.50, true, '2022-03-15'),
    (v_factory_id, 'NWBS-002', 'Carlos', 'Rodriguez', 'Framer', v_station_ids[1], false, 24.00, true, '2022-08-22'),
    (v_factory_id, 'NWBS-003', 'David', 'Martinez', 'Framer', v_station_ids[1], false, 23.50, true, '2023-01-10'),
    (v_factory_id, 'NWBS-004', 'Jose', 'Garcia', 'Framer', v_station_ids[1], false, 23.00, true, '2023-04-18'),
    (v_factory_id, 'NWBS-005', 'Luis', 'Hernandez', 'Framer', v_station_ids[1], false, 22.50, true, '2023-07-12'),
    (v_factory_id, 'NWBS-006', 'Antonio', 'Lopez', 'Floor Installer', v_station_ids[1], false, 24.00, true, '2022-11-08'),
    (v_factory_id, 'NWBS-007', 'Miguel', 'Gonzalez', 'Floor Installer', v_station_ids[1], false, 23.50, true, '2023-02-28'),
    (v_factory_id, 'NWBS-008', 'Rafael', 'Sanchez', 'Apprentice Framer', v_station_ids[1], false, 18.00, true, '2024-01-08'),
    (v_factory_id, 'NWBS-009', 'Pedro', 'Ramirez', 'Apprentice Framer', v_station_ids[1], false, 18.00, true, '2024-03-15'),
    (v_factory_id, 'NWBS-010', 'Francisco', 'Torres', 'Helper', v_station_ids[1], false, 16.50, true, '2024-06-01');

  -- Walls/Exterior (12 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-011', 'James', 'Chen', 'Lead Carpenter', v_station_ids[2], true, 27.00, true, '2021-06-01'),
    (v_factory_id, 'NWBS-012', 'William', 'Brown', 'Carpenter', v_station_ids[2], false, 25.00, true, '2022-03-20'),
    (v_factory_id, 'NWBS-013', 'Robert', 'Davis', 'Carpenter', v_station_ids[2], false, 24.50, true, '2022-07-15'),
    (v_factory_id, 'NWBS-014', 'Thomas', 'Wilson', 'Carpenter', v_station_ids[2], false, 24.00, true, '2023-01-22'),
    (v_factory_id, 'NWBS-015', 'Daniel', 'Moore', 'Siding Installer', v_station_ids[2], false, 23.50, true, '2023-05-08'),
    (v_factory_id, 'NWBS-016', 'Richard', 'Taylor', 'Siding Installer', v_station_ids[2], false, 23.00, true, '2023-08-14'),
    (v_factory_id, 'NWBS-017', 'Joseph', 'Anderson', 'Window Installer', v_station_ids[2], false, 24.00, true, '2022-11-30'),
    (v_factory_id, 'NWBS-018', 'Charles', 'Thomas', 'Door Installer', v_station_ids[2], false, 23.50, true, '2023-02-14'),
    (v_factory_id, 'NWBS-019', 'Christopher', 'Jackson', 'Apprentice', v_station_ids[2], false, 17.50, true, '2024-04-01'),
    (v_factory_id, 'NWBS-020', 'Matthew', 'White', 'Helper', v_station_ids[2], false, 16.50, true, '2024-07-10');

  -- Electrical (10 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-021', 'Kevin', 'Brown', 'Lead Electrician', v_station_ids[3], true, 32.00, true, '2020-09-15'),
    (v_factory_id, 'NWBS-022', 'Brian', 'Taylor', 'Electrician', v_station_ids[3], false, 28.00, true, '2021-03-22'),
    (v_factory_id, 'NWBS-023', 'Steven', 'Harris', 'Electrician', v_station_ids[3], false, 27.50, true, '2022-01-10'),
    (v_factory_id, 'NWBS-024', 'Edward', 'Martin', 'Electrician', v_station_ids[3], false, 27.00, true, '2022-06-18'),
    (v_factory_id, 'NWBS-025', 'Ronald', 'Thompson', 'Journeyman Electrician', v_station_ids[3], false, 26.00, true, '2023-02-05'),
    (v_factory_id, 'NWBS-026', 'Timothy', 'Garcia', 'Journeyman Electrician', v_station_ids[3], false, 25.50, true, '2023-07-20'),
    (v_factory_id, 'NWBS-027', 'Jason', 'Martinez', 'Apprentice Electrician', v_station_ids[3], false, 20.00, true, '2024-01-15'),
    (v_factory_id, 'NWBS-028', 'Jeffrey', 'Robinson', 'Apprentice Electrician', v_station_ids[3], false, 19.50, true, '2024-05-01');

  -- Plumbing (8 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-029', 'Mark', 'Anderson', 'Lead Plumber', v_station_ids[4], true, 30.00, true, '2020-06-10'),
    (v_factory_id, 'NWBS-030', 'Donald', 'Clark', 'Plumber', v_station_ids[4], false, 26.50, true, '2021-09-22'),
    (v_factory_id, 'NWBS-031', 'Paul', 'Lewis', 'Plumber', v_station_ids[4], false, 26.00, true, '2022-04-15'),
    (v_factory_id, 'NWBS-032', 'Andrew', 'Walker', 'Plumber', v_station_ids[4], false, 25.50, true, '2023-01-08'),
    (v_factory_id, 'NWBS-033', 'Joshua', 'Hall', 'Journeyman Plumber', v_station_ids[4], false, 24.00, true, '2023-06-20'),
    (v_factory_id, 'NWBS-034', 'Kenneth', 'Allen', 'Apprentice Plumber', v_station_ids[4], false, 19.00, true, '2024-02-12');

  -- HVAC (8 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-035', 'Scott', 'Taylor', 'Lead HVAC Tech', v_station_ids[5], true, 31.00, true, '2019-11-05'),
    (v_factory_id, 'NWBS-036', 'George', 'Young', 'HVAC Tech', v_station_ids[5], false, 27.50, true, '2021-04-18'),
    (v_factory_id, 'NWBS-037', 'Larry', 'King', 'HVAC Tech', v_station_ids[5], false, 27.00, true, '2022-02-28'),
    (v_factory_id, 'NWBS-038', 'Dennis', 'Wright', 'HVAC Tech', v_station_ids[5], false, 26.50, true, '2022-09-10'),
    (v_factory_id, 'NWBS-039', 'Jerry', 'Scott', 'Duct Installer', v_station_ids[5], false, 24.00, true, '2023-03-25'),
    (v_factory_id, 'NWBS-040', 'Gary', 'Green', 'Apprentice HVAC', v_station_ids[5], false, 18.50, true, '2024-01-20');

  -- Insulation (6 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-041', 'Frank', 'Adams', 'Lead Insulation', v_station_ids[6], true, 25.00, true, '2021-08-15'),
    (v_factory_id, 'NWBS-042', 'Raymond', 'Nelson', 'Insulation Installer', v_station_ids[6], false, 22.00, true, '2022-05-10'),
    (v_factory_id, 'NWBS-043', 'Gregory', 'Hill', 'Insulation Installer', v_station_ids[6], false, 21.50, true, '2023-01-22'),
    (v_factory_id, 'NWBS-044', 'Harold', 'Campbell', 'Insulation Installer', v_station_ids[6], false, 21.00, true, '2023-08-05'),
    (v_factory_id, 'NWBS-045', 'Henry', 'Mitchell', 'Helper', v_station_ids[6], false, 17.00, true, '2024-03-01');

  -- Drywall (10 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-046', 'Carl', 'Roberts', 'Lead Drywall', v_station_ids[7], true, 26.50, true, '2020-10-20'),
    (v_factory_id, 'NWBS-047', 'Arthur', 'Turner', 'Drywall Hanger', v_station_ids[7], false, 23.50, true, '2021-06-15'),
    (v_factory_id, 'NWBS-048', 'Roger', 'Phillips', 'Drywall Hanger', v_station_ids[7], false, 23.00, true, '2022-03-08'),
    (v_factory_id, 'NWBS-049', 'Walter', 'Parker', 'Drywall Hanger', v_station_ids[7], false, 22.50, true, '2022-11-20'),
    (v_factory_id, 'NWBS-050', 'Joe', 'Evans', 'Drywall Taper', v_station_ids[7], false, 24.00, true, '2021-09-10'),
    (v_factory_id, 'NWBS-051', 'Albert', 'Edwards', 'Drywall Taper', v_station_ids[7], false, 23.50, true, '2022-07-05'),
    (v_factory_id, 'NWBS-052', 'Lawrence', 'Collins', 'Drywall Finisher', v_station_ids[7], false, 24.50, true, '2023-02-18'),
    (v_factory_id, 'NWBS-053', 'Eugene', 'Stewart', 'Apprentice', v_station_ids[7], false, 17.50, true, '2024-04-10');

  -- Paint (8 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-054', 'Russell', 'Sanchez', 'Lead Painter', v_station_ids[8], true, 26.00, true, '2020-05-12'),
    (v_factory_id, 'NWBS-055', 'Louis', 'Morris', 'Painter', v_station_ids[8], false, 23.00, true, '2021-11-08'),
    (v_factory_id, 'NWBS-056', 'Philip', 'Rogers', 'Painter', v_station_ids[8], false, 22.50, true, '2022-06-20'),
    (v_factory_id, 'NWBS-057', 'Roy', 'Reed', 'Painter', v_station_ids[8], false, 22.00, true, '2023-03-15'),
    (v_factory_id, 'NWBS-058', 'Ralph', 'Cook', 'Texture Tech', v_station_ids[8], false, 23.50, true, '2022-01-28'),
    (v_factory_id, 'NWBS-059', 'Johnny', 'Bailey', 'Apprentice Painter', v_station_ids[8], false, 17.00, true, '2024-02-05');

  -- Finish Electric (6 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-060', 'Alan', 'Rivera', 'Lead Finish Electric', v_station_ids[9], true, 30.00, true, '2019-08-22'),
    (v_factory_id, 'NWBS-061', 'Wayne', 'Cooper', 'Finish Electrician', v_station_ids[9], false, 27.00, true, '2021-05-15'),
    (v_factory_id, 'NWBS-062', 'Elmer', 'Richardson', 'Finish Electrician', v_station_ids[9], false, 26.50, true, '2022-09-30'),
    (v_factory_id, 'NWBS-063', 'Fred', 'Cox', 'Journeyman', v_station_ids[9], false, 25.00, true, '2023-04-12');

  -- Finish Plumbing (6 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-064', 'Howard', 'Howard', 'Lead Finish Plumber', v_station_ids[10], true, 29.00, true, '2020-02-18'),
    (v_factory_id, 'NWBS-065', 'Victor', 'Ward', 'Finish Plumber', v_station_ids[10], false, 26.00, true, '2021-10-05'),
    (v_factory_id, 'NWBS-066', 'Martin', 'Torres', 'Finish Plumber', v_station_ids[10], false, 25.50, true, '2022-07-22'),
    (v_factory_id, 'NWBS-067', 'Ernest', 'Peterson', 'Journeyman', v_station_ids[10], false, 24.00, true, '2023-05-08');

  -- Cabinets (8 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-068', 'Oscar', 'Gray', 'Lead Cabinet Installer', v_station_ids[11], true, 27.00, true, '2020-07-10'),
    (v_factory_id, 'NWBS-069', 'Jesse', 'Ramirez', 'Cabinet Installer', v_station_ids[11], false, 24.00, true, '2021-12-15'),
    (v_factory_id, 'NWBS-070', 'Keith', 'James', 'Cabinet Installer', v_station_ids[11], false, 23.50, true, '2022-08-28'),
    (v_factory_id, 'NWBS-071', 'Samuel', 'Watson', 'Countertop Installer', v_station_ids[11], false, 25.00, true, '2021-04-05'),
    (v_factory_id, 'NWBS-072', 'Patrick', 'Brooks', 'Countertop Installer', v_station_ids[11], false, 24.50, true, '2022-11-12'),
    (v_factory_id, 'NWBS-073', 'Terry', 'Kelly', 'Apprentice', v_station_ids[11], false, 17.50, true, '2024-01-08');

  -- QC/Final (8 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-074', 'Jennifer', 'Davis', 'QC Lead Inspector', v_station_ids[12], true, 28.00, true, '2019-06-20'),
    (v_factory_id, 'NWBS-075', 'Maria', 'Garcia', 'QC Inspector', v_station_ids[12], false, 25.00, true, '2021-03-10'),
    (v_factory_id, 'NWBS-076', 'Lisa', 'Martinez', 'QC Inspector', v_station_ids[12], false, 24.50, true, '2022-05-18'),
    (v_factory_id, 'NWBS-077', 'Sarah', 'Williams', 'Finish Carpenter', v_station_ids[12], false, 24.00, true, '2021-09-25'),
    (v_factory_id, 'NWBS-078', 'Karen', 'Johnson', 'Finish Carpenter', v_station_ids[12], false, 23.50, true, '2022-12-08'),
    (v_factory_id, 'NWBS-079', 'Nancy', 'Brown', 'Touch-up/Punch', v_station_ids[12], false, 22.00, true, '2023-06-15');

  -- Utility/General Labor (10 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-080', 'Amanda', 'Wilson', 'Material Handler', v_station_ids[1], false, 19.00, true, '2022-04-20'),
    (v_factory_id, 'NWBS-081', 'Stephanie', 'Moore', 'Material Handler', v_station_ids[1], false, 18.50, true, '2023-02-10'),
    (v_factory_id, 'NWBS-082', 'Angela', 'Taylor', 'Forklift Operator', v_station_ids[1], false, 21.00, true, '2021-08-05'),
    (v_factory_id, 'NWBS-083', 'Melissa', 'Anderson', 'Forklift Operator', v_station_ids[1], false, 20.50, true, '2022-10-15'),
    (v_factory_id, 'NWBS-084', 'Rebecca', 'Thomas', 'General Labor', v_station_ids[2], false, 17.00, true, '2023-09-01'),
    (v_factory_id, 'NWBS-085', 'Laura', 'Jackson', 'General Labor', v_station_ids[3], false, 16.50, true, '2024-01-15'),
    (v_factory_id, 'NWBS-086', 'Michelle', 'White', 'Cleanup Crew', v_station_ids[4], false, 16.00, true, '2023-07-22'),
    (v_factory_id, 'NWBS-087', 'Kimberly', 'Harris', 'Cleanup Crew', v_station_ids[5], false, 16.00, true, '2024-02-28'),
    (v_factory_id, 'NWBS-088', 'Dorothy', 'Martin', 'Utility', v_station_ids[6], false, 17.50, true, '2022-06-10'),
    (v_factory_id, 'NWBS-089', 'Carol', 'Thompson', 'Utility', v_station_ids[7], false, 17.50, true, '2023-04-05');

  -- Shipping/Maintenance (11 workers)
  INSERT INTO workers (factory_id, employee_id, first_name, last_name, title, primary_station_id, is_lead, hourly_rate, is_active, hire_date)
  VALUES
    (v_factory_id, 'NWBS-090', 'Tony', 'Mitchell', 'Shipping Lead', v_station_ids[1], true, 24.00, true, '2020-11-12'),
    (v_factory_id, 'NWBS-091', 'Bobby', 'Campbell', 'Shipping/Receiving', v_station_ids[1], false, 20.00, true, '2022-03-28'),
    (v_factory_id, 'NWBS-092', 'Johnny', 'Roberts', 'Shipping/Receiving', v_station_ids[1], false, 19.50, true, '2023-01-15'),
    (v_factory_id, 'NWBS-093', 'Billy', 'Carter', 'Inventory Control', v_station_ids[1], false, 21.00, true, '2021-07-08'),
    (v_factory_id, 'NWBS-094', 'Jimmy', 'Phillips', 'Yard Worker', v_station_ids[1], false, 18.00, true, '2023-09-20'),
    (v_factory_id, 'NWBS-095', 'Tommy', 'Evans', 'Yard Worker', v_station_ids[1], false, 17.50, true, '2024-04-01'),
    (v_factory_id, 'NWBS-096', 'Eddie', 'Collins', 'Maintenance Lead', v_station_ids[1], true, 28.00, true, '2019-03-15'),
    (v_factory_id, 'NWBS-097', 'Bruce', 'Stewart', 'Maintenance Tech', v_station_ids[1], false, 24.00, true, '2021-06-22'),
    (v_factory_id, 'NWBS-098', 'Willie', 'Sanchez', 'Maintenance Tech', v_station_ids[1], false, 23.50, true, '2022-09-08'),
    (v_factory_id, 'NWBS-099', 'Jack', 'Morris', 'Equipment Operator', v_station_ids[1], false, 22.00, true, '2023-03-01'),
    (v_factory_id, 'NWBS-100', 'Harry', 'Rogers', 'Equipment Operator', v_station_ids[1], false, 21.50, true, '2023-11-15');

  RAISE NOTICE 'Created 100 workers for NWBS factory';
END $$;

SELECT 'Section 4: Crew members created (' || COUNT(*) || ' workers)' AS status FROM workers WHERE factory_id = (SELECT id FROM factories WHERE code = 'NWBS');

-- ############################################################################
-- SECTION 5: MODULES FOR NWBS PROJECTS
-- ############################################################################

DO $$
DECLARE
  v_factory_id UUID;
  v_project RECORD;
  v_module_count INTEGER;
  v_station_ids UUID[];
  i INTEGER;
  v_serial_prefix VARCHAR(20);
BEGIN
  SELECT id INTO v_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;
  IF v_factory_id IS NULL THEN RETURN; END IF;

  SELECT ARRAY_AGG(id ORDER BY order_num) INTO v_station_ids
  FROM station_templates WHERE factory_id IS NULL OR factory_id = v_factory_id LIMIT 12;

  DELETE FROM modules WHERE factory_id = v_factory_id;

  FOR v_project IN
    SELECT id, project_number, name, status, module_count, square_footage
    FROM projects WHERE factory = 'NWBS' AND project_number LIKE 'NWBS-26-%'
  LOOP
    v_module_count := COALESCE(v_project.module_count,
      CASE
        WHEN v_project.square_footage > 50000 THEN 40
        WHEN v_project.square_footage > 30000 THEN 25
        WHEN v_project.square_footage > 15000 THEN 12
        WHEN v_project.square_footage > 5000 THEN 6
        ELSE 4
      END
    );
    v_module_count := GREATEST(v_module_count, 4);
    v_serial_prefix := v_project.project_number || '-M';

    FOR i IN 1..v_module_count LOOP
      INSERT INTO modules (factory_id, project_id, serial_number, name, sequence_number, status, current_station_id, module_width, module_length, is_rush, created_at)
      VALUES (
        v_factory_id, v_project.id, v_serial_prefix || LPAD(i::text, 3, '0'),
        'Module ' || i || ' - ' || v_project.name,
        i,  -- sequence_number
        CASE
          WHEN v_project.status = 'Completed' THEN 'Completed'
          WHEN v_project.status IN ('Production', 'In Progress') THEN
            CASE WHEN i <= v_module_count * 0.3 THEN 'Completed' WHEN i <= v_module_count * 0.6 THEN 'In Progress' ELSE 'Not Started' END
          ELSE 'Not Started'
        END,
        v_station_ids[LEAST(GREATEST((i % 12) + 1, 1), 12)],
        CASE WHEN i % 3 = 0 THEN 14 ELSE 12 END,  -- module_width (feet)
        CASE WHEN i % 4 = 0 THEN 72 WHEN i % 2 = 0 THEN 60 ELSE 48 END,  -- module_length (feet)
        i % 7 = 0,
        NOW() - (RANDOM() * INTERVAL '90 days')
      );
    END LOOP;
    UPDATE projects SET module_count = v_module_count WHERE id = v_project.id;
  END LOOP;
END $$;

SELECT 'Section 5: Modules created (' || COUNT(*) || ' total)' AS status FROM modules WHERE factory_id = (SELECT id FROM factories WHERE code = 'NWBS');

-- ############################################################################
-- SECTION 6: PC-SPECIFIC PROJECTS (Stock/Fleet)
-- ############################################################################
-- Project Coordinators manage stock/fleet projects which are simpler, lower-dollar jobs

DO $$
DECLARE
  v_pc_user_id UUID;
  v_nwbs_factory_id UUID;
  v_dealer_id UUID;
BEGIN
  -- Get PC user (Project Coordinator role or fallback)
  SELECT id INTO v_pc_user_id FROM users WHERE role = 'PC' AND is_active = true LIMIT 1;
  IF v_pc_user_id IS NULL THEN
    SELECT id INTO v_pc_user_id FROM users WHERE is_active = true LIMIT 1;
  END IF;

  SELECT id INTO v_nwbs_factory_id FROM factories WHERE code = 'NWBS' LIMIT 1;
  SELECT id INTO v_dealer_id FROM dealers WHERE is_active = true LIMIT 1;

  -- Create PC-managed stock/fleet projects
  INSERT INTO projects (
    project_number, name, client_name, status, factory, is_pm_job, owner_id, created_by,
    start_date, delivery_date, module_count, square_footage, contract_value
  ) VALUES
    -- Stock units - simple, standardized modules kept in inventory
    ('NWBS-26-S01', '12x60 Office Stock Unit', 'NWBS Stock Inventory', 'Production', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE - 30, CURRENT_DATE + 15, 1, 720, 45000),
    ('NWBS-26-S02', '12x60 Office Stock Unit', 'NWBS Stock Inventory', 'Production', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE - 25, CURRENT_DATE + 20, 1, 720, 45000),
    ('NWBS-26-S03', '12x44 Office Stock Unit', 'NWBS Stock Inventory', 'Scheduled', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE + 5, CURRENT_DATE + 35, 1, 528, 38000),
    ('NWBS-26-S04', '14x72 Office Stock Unit', 'NWBS Stock Inventory', 'Planning', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE + 15, CURRENT_DATE + 50, 1, 1008, 58000),

    -- Fleet units - rental/lease buildings
    ('NWBS-26-F01', 'Fleet 12x60 Classroom', 'Pacific Fleet Leasing', 'Production', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE - 20, CURRENT_DATE + 25, 2, 1440, 85000),
    ('NWBS-26-F02', 'Fleet 12x60 Office Combo', 'Pacific Fleet Leasing', 'In Progress', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE - 15, CURRENT_DATE + 30, 2, 1440, 92000),
    ('NWBS-26-F03', 'Fleet 24x60 Double-Wide Office', 'Northwest Modular Rentals', 'Scheduled', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE + 10, CURRENT_DATE + 45, 2, 2880, 145000),

    -- Simple dealer orders (not PM jobs)
    ('NWBS-26-D01', 'Standard 12x60 Sales Office', 'Mountain View Dealers', 'Production', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE - 18, CURRENT_DATE + 22, 1, 720, 52000),
    ('NWBS-26-D02', 'Basic 12x44 Job Trailer', 'Idaho Modular Sales', 'In Progress', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE - 12, CURRENT_DATE + 28, 1, 528, 42000),
    ('NWBS-26-D03', 'Standard Break Room', 'Boise Equipment Rentals', 'Scheduled', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE + 7, CURRENT_DATE + 37, 1, 480, 38000),

    -- Refurb/Rework projects
    ('NWBS-26-R01', 'Refurb - 12x60 Office Repaint', 'NWBS Refurb Inventory', 'Production', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE - 10, CURRENT_DATE + 5, 1, 720, 15000),
    ('NWBS-26-R02', 'Refurb - 24x60 Office Interior', 'NWBS Refurb Inventory', 'In Progress', 'NWBS', false, v_pc_user_id, v_pc_user_id,
     CURRENT_DATE - 8, CURRENT_DATE + 12, 1, 1440, 28000)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created PC-specific stock/fleet projects';
END $$;

SELECT 'Section 6: PC projects created (' || COUNT(*) || ' non-PM jobs)' AS status FROM projects WHERE is_pm_job = false AND factory = 'NWBS';

-- ############################################################################
-- SECTION 7: SALES PIPELINE FOR PC-DRIVEN PROJECTS
-- ############################################################################

DO $$
DECLARE
  v_sales_user_id UUID;
  v_pc_user_id UUID;
  v_customer_id UUID;
BEGIN
  -- Get sales user
  SELECT id INTO v_sales_user_id FROM users WHERE role = 'Sales' AND is_active = true LIMIT 1;
  IF v_sales_user_id IS NULL THEN
    SELECT id INTO v_sales_user_id FROM users WHERE is_active = true LIMIT 1;
  END IF;

  -- Get PC user
  SELECT id INTO v_pc_user_id FROM users WHERE role = 'PC' AND is_active = true LIMIT 1;

  -- Get or create a customer
  SELECT id INTO v_customer_id FROM sales_customers WHERE is_active = true LIMIT 1;

  -- Create sales quotes for various stages
  INSERT INTO sales_quotes (
    quote_number, customer_id, status, total_price, valid_until, assigned_to,
    building_type, module_count, factory, outlook_percentage, is_latest_version, created_at
  ) VALUES
    -- Stock/Fleet quotes (simpler, PC-driven)
    ('Q-NWBS-26-101', v_customer_id, 'sent', 48000, CURRENT_DATE + 30, v_sales_user_id,
     'Office', 1, 'NWBS', 70, true, NOW() - INTERVAL '5 days'),
    ('Q-NWBS-26-102', v_customer_id, 'sent', 52000, CURRENT_DATE + 30, v_sales_user_id,
     'Office', 1, 'NWBS', 65, true, NOW() - INTERVAL '8 days'),
    ('Q-NWBS-26-103', v_customer_id, 'negotiating', 89000, CURRENT_DATE + 45, v_sales_user_id,
     'Classroom', 2, 'NWBS', 80, true, NOW() - INTERVAL '12 days'),
    ('Q-NWBS-26-104', v_customer_id, 'awaiting_po', 145000, CURRENT_DATE + 60, v_sales_user_id,
     'Office', 2, 'NWBS', 95, true, NOW() - INTERVAL '20 days'),
    ('Q-NWBS-26-105', v_customer_id, 'po_received', 42000, CURRENT_DATE + 90, v_sales_user_id,
     'Break Room', 1, 'NWBS', 100, true, NOW() - INTERVAL '25 days'),

    -- PM-level quotes (larger, more complex)
    ('Q-NWBS-26-201', v_customer_id, 'draft', 1250000, CURRENT_DATE + 60, v_sales_user_id,
     'Educational', 12, 'NWBS', 40, true, NOW() - INTERVAL '3 days'),
    ('Q-NWBS-26-202', v_customer_id, 'sent', 850000, CURRENT_DATE + 45, v_sales_user_id,
     'Healthcare', 8, 'NWBS', 55, true, NOW() - INTERVAL '10 days'),
    ('Q-NWBS-26-203', v_customer_id, 'negotiating', 2100000, CURRENT_DATE + 90, v_sales_user_id,
     'Commercial', 18, 'NWBS', 75, true, NOW() - INTERVAL '18 days'),
    ('Q-NWBS-26-204', v_customer_id, 'awaiting_po', 680000, CURRENT_DATE + 45, v_sales_user_id,
     'Industrial', 6, 'NWBS', 90, true, NOW() - INTERVAL '22 days'),
    ('Q-NWBS-26-205', v_customer_id, 'converted', 920000, CURRENT_DATE + 30, v_sales_user_id,
     'Educational', 10, 'NWBS', 100, true, NOW() - INTERVAL '30 days')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created sales pipeline quotes';
END $$;

SELECT 'Section 7: Sales quotes created (' || COUNT(*) || ' quotes)' AS status FROM sales_quotes WHERE factory = 'NWBS';

-- ############################################################################
-- FINAL VERIFICATION
-- ############################################################################
SELECT '========================================' AS divider;
SELECT 'FIX_ALL_DEMO_ISSUES.sql COMPLETE' AS final_status;
SELECT '========================================' AS divider;

SELECT 'Announcements: ' || COUNT(*) AS count FROM announcements WHERE is_active = true;
SELECT 'Directory Contacts: ' || COUNT(*) AS count FROM directory_contacts WHERE is_active = true;
SELECT 'Workers (NWBS): ' || COUNT(*) AS count FROM workers WHERE factory_id = (SELECT id FROM factories WHERE code = 'NWBS');
SELECT 'Modules (NWBS): ' || COUNT(*) AS count FROM modules WHERE factory_id = (SELECT id FROM factories WHERE code = 'NWBS');
SELECT 'Projects (PM jobs): ' || COUNT(*) AS count FROM projects WHERE is_pm_job = true;
SELECT 'Projects (PC jobs): ' || COUNT(*) AS count FROM projects WHERE is_pm_job = false;
SELECT 'Sales Quotes: ' || COUNT(*) AS count FROM sales_quotes WHERE is_latest_version = true;
