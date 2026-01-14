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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_factories_code ON factories(code);
CREATE INDEX IF NOT EXISTS idx_factories_active ON factories(is_active);

-- ============================================================================
-- INSERT PRAXIS FACTORY CODES (Locations from sunbeltmodular.com)
-- ============================================================================
INSERT INTO factories (code, short_name, full_name, display_value, city, state, region, is_active)
VALUES
  -- Corporate
  ('SNB', 'Sunbelt Corporate', 'Sunbelt Modular (Corporate)', 'SNB - Sunbelt Modular (Corporate)', 'Phoenix', 'AZ', 'Corporate', true),

  -- Southwest (Arizona)
  ('PMI', 'Phoenix Modular', 'Phoenix Modular', 'PMI - Phoenix Modular', 'Phoenix', 'AZ', 'Southwest', true),
  ('MRS', 'MR Steel', 'MR Steel', 'MRS - MR Steel', 'Phoenix', 'AZ', 'Southwest', true),

  -- Texas
  ('AMT', 'AMTEX', 'AMTEX', 'AMT - AMTEX', 'Garland', 'TX', 'Texas', true),
  ('BUSA', 'Britco USA', 'Britco Structures USA', 'BUSA - Britco Structures USA', 'Teague', 'TX', 'Texas', true),
  ('IBI', 'Indicom', 'Indicom Buildings', 'IBI - Indicom Buildings', 'Burleson', 'TX', 'Texas', true),

  -- Southeast (Florida & Georgia)
  ('SMM', 'Southeast Modular', 'Southeast Modular Manufacturing', 'SMM - Southeast Modular Manufacturing', 'Leesburg', 'FL', 'Southeast', true),
  ('SSI', 'Specialized Structures', 'Specialized Structures', 'SSI - Specialized Structures', 'Willacoochee', 'GA', 'Southeast', true),
  ('PRM', 'Pro-Mod', 'ProMod Manufacturing', 'PRM - ProMod Manufacturing', 'Ellaville', 'GA', 'Southeast', true),

  -- Pacific Northwest
  ('NWBS', 'Northwest', 'Northwest Building Systems', 'NWBS - Northwest Building Systems', 'Boise', 'ID', 'Pacific Northwest', true),
  ('WM-EVERGREEN', 'Whitley Evergreen', 'Whitley Manufacturing Evergreen', 'WM-EVERGREEN - Whitley Manufacturing Evergreen', 'Marysville', 'WA', 'Pacific Northwest', true),

  -- Midwest (Indiana)
  ('C&B', 'C&B Modular', 'C&B Custom Modular', 'C&B - C&B Custom Modular', 'Bristol', 'IN', 'Midwest', true),
  ('WM-SOUTH', 'Whitley South', 'Whitley Manufacturing South Whitley', 'WM-SOUTH - Whitley Manufacturing South Whitley', 'South Whitley', 'IN', 'Midwest', true),

  -- Northeast (Pennsylvania)
  ('WM-EAST', 'Whitley East', 'Whitley Manufacturing East', 'WM-EAST - Whitley Manufacturing East', 'Leola', 'PA', 'Northeast', true)

ON CONFLICT (code) DO UPDATE SET
  short_name = EXCLUDED.short_name,
  full_name = EXCLUDED.full_name,
  display_value = EXCLUDED.display_value,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  region = EXCLUDED.region,
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
SELECT 'Factories created (14 locations):' AS status;
SELECT code, short_name, city, state, region FROM factories ORDER BY region, code;
