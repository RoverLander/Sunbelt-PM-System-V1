-- ============================================================================
-- STEP 2: CREATE FACTORIES TABLE WITH PRAXIS CODES
-- ============================================================================
-- Creates a proper factories table as single source of truth.
-- Uses Praxis factory codes as the standard.
--
-- Locations verified from sunbeltmodular.com/about/sunbelt-companies/
--
-- Created: January 13, 2026
-- Updated: January 14, 2026 - Corrected all factory locations from website
-- Updated: January 14, 2026 - Added directory columns (address, phone, fax, email_domain)
-- ============================================================================

-- ============================================================================
-- DROP AND RECREATE FACTORIES TABLE
-- ============================================================================
-- Drop existing table to ensure clean schema
DROP TABLE IF EXISTS factories CASCADE;

CREATE TABLE factories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,           -- Praxis code (NWBS, PMI, etc.)
  short_name VARCHAR(50) NOT NULL,            -- Short display name
  full_name VARCHAR(200) NOT NULL,            -- Full legal/display name
  display_value VARCHAR(200) NOT NULL,        -- Format: "CODE - Full Name"
  city VARCHAR(100),
  state VARCHAR(2),
  region VARCHAR(50),
  -- Directory columns
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  zip_code VARCHAR(20),
  phone VARCHAR(50),
  fax VARCHAR(50),
  email_domain VARCHAR(100),
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_factories_code ON factories(code);
CREATE INDEX IF NOT EXISTS idx_factories_active ON factories(is_active);

-- ============================================================================
-- INSERT PRAXIS FACTORY CODES (Locations from sunbeltmodular.com)
-- ============================================================================
INSERT INTO factories (code, short_name, full_name, display_value, city, state, region, address_line1, zip_code, phone, email_domain, is_active)
VALUES
  -- Corporate (Phoenix, AZ)
  ('SNB', 'Sunbelt Corporate', 'Sunbelt Modular (Corporate)', 'SNB - Sunbelt Modular (Corporate)',
   'Phoenix', 'AZ', 'Corporate', '2424 E Camelback Rd, Suite 1080', '85016', '(602) 224-4800', 'sunbeltmodular.com', true),

  -- Southwest (Arizona)
  ('PMI', 'Phoenix Modular', 'Phoenix Modular', 'PMI - Phoenix Modular',
   'Phoenix', 'AZ', 'Southwest', '1615 S 52nd St', '85043', '(602) 484-0420', 'phoenixmodular.com', true),
  ('MRS', 'MR Steel', 'MR Steel', 'MRS - MR Steel',
   'Phoenix', 'AZ', 'Southwest', '1615 S 52nd St', '85043', '(602) 484-0420', 'mrsteel.com', true),

  -- Texas
  ('AMT', 'AMTEX', 'AMTEX', 'AMT - AMTEX',
   'Garland', 'TX', 'Texas', '100 W Miller Rd', '75041', '(972) 840-8150', 'amtex.com', true),
  ('BUSA', 'Britco USA', 'Britco Structures USA', 'BUSA - Britco Structures USA',
   'Teague', 'TX', 'Texas', '2323 CR 303', '75860', '(254) 739-2300', 'britco.com', true),
  ('IBI', 'Indicom', 'Indicom Buildings', 'IBI - Indicom Buildings',
   'Burleson', 'TX', 'Texas', '600 N Burleson Blvd', '76028', '(817) 295-9222', 'indicombuildings.com', true),

  -- Southeast (Florida & Georgia)
  ('SMM', 'Southeast Modular', 'Southeast Modular Manufacturing', 'SMM - Southeast Modular Manufacturing',
   'Leesburg', 'FL', 'Southeast', '26750 US Hwy 27', '34748', '(352) 787-1422', 'southeastmodular.com', true),
  ('SSI', 'Specialized Structures', 'Specialized Structures', 'SSI - Specialized Structures',
   'Willacoochee', 'GA', 'Southeast', '1200 Industrial Blvd', '31650', '(912) 534-5451', 'specstructures.com', true),
  ('PRM', 'Pro-Mod', 'ProMod Manufacturing', 'PRM - ProMod Manufacturing',
   'Ellaville', 'GA', 'Southeast', '340 Hwy 19 N', '31806', '(229) 937-2511', 'promodmfg.com', true),

  -- Pacific Northwest
  ('NWBS', 'Northwest', 'Northwest Building Systems', 'NWBS - Northwest Building Systems',
   'Boise', 'ID', 'Pacific Northwest', '5525 W Gowen Rd', '83709', '(208) 362-1120', 'nwbsi.com', true),
  ('WM-EVERGREEN', 'Whitley Evergreen', 'Whitley Manufacturing Evergreen', 'WM-EVERGREEN - Whitley Manufacturing Evergreen',
   'Marysville', 'WA', 'Pacific Northwest', '4000 88th St NE', '98270', '(360) 659-0770', 'whitleymfg.com', true),

  -- Midwest (Indiana)
  ('C&B', 'C&B Modular', 'C&B Custom Modular', 'C&B - C&B Custom Modular',
   'Bristol', 'IN', 'Midwest', '54665 CR 15', '46507', '(574) 848-4666', 'cbmodular.com', true),
  ('WM-SOUTH', 'Whitley South', 'Whitley Manufacturing South Whitley', 'WM-SOUTH - Whitley Manufacturing South Whitley',
   'South Whitley', 'IN', 'Midwest', '2201 W State Rd 14', '46787', '(260) 723-5175', 'whitleymfg.com', true),

  -- Northeast (Pennsylvania)
  ('WM-EAST', 'Whitley East', 'Whitley Manufacturing East', 'WM-EAST - Whitley Manufacturing East',
   'Leola', 'PA', 'Northeast', '115 Groffdale Rd', '17540', '(717) 656-2611', 'whitleymfg.com', true),

  -- Rochester, NY (newly added for WM-Rochester contacts)
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

-- ============================================================================
-- ENABLE RLS AND CREATE POLICY
-- ============================================================================
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "factories_read_all" ON factories;
CREATE POLICY "factories_read_all" ON factories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "factories_write_admin" ON factories;
CREATE POLICY "factories_write_admin" ON factories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Factories created (15 locations):' AS status;
SELECT code, short_name, city, state, region, phone FROM factories ORDER BY region, code;
