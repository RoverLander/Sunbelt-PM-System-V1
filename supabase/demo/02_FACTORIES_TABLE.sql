-- ============================================================================
-- STEP 2: CREATE FACTORIES TABLE WITH PRAXIS CODES
-- ============================================================================
-- Creates a proper factories table as single source of truth.
-- Uses Praxis factory codes as the standard.
--
-- Created: January 13, 2026
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
-- INSERT PRAXIS FACTORY CODES
-- ============================================================================
INSERT INTO factories (code, short_name, full_name, display_value, city, state, region, is_active)
VALUES
  -- Pacific Northwest
  ('NWBS', 'Northwest', 'Northwest Building Systems', 'NWBS - Northwest Building Systems', 'Tacoma', 'WA', 'Pacific Northwest', true),
  ('BUSA', 'Britco USA', 'Britco USA', 'BUSA - Britco USA', 'Ferndale', 'WA', 'Pacific Northwest', true),

  -- California
  ('PMI', 'Phoenix Modular', 'Phoenix Modular', 'PMI - Phoenix Modular', 'San Marcos', 'CA', 'California', true),

  -- Texas
  ('SSI', 'Specialized Structures', 'Specialized Structures', 'SSI - Specialized Structures', 'Waco', 'TX', 'Texas', true),
  ('AMT', 'AMTEX', 'AMTEX', 'AMT - AMTEX', 'Dallas', 'TX', 'Texas', true),

  -- Southeast
  ('SMM', 'Southeast Modular', 'Southeast Modular', 'SMM - Southeast Modular', 'Atlanta', 'GA', 'Southeast', true),
  ('C&B', 'C&B Modular', 'C&B Modular', 'C&B - C&B Modular', 'Nashville', 'TN', 'Southeast', true),
  ('WM-EAST', 'Whitley East', 'Whitley Manufacturing East', 'WM-EAST - Whitley Manufacturing East', 'Statesville', 'NC', 'Southeast', true),
  ('WM-SOUTH', 'Whitley South', 'Whitley Manufacturing South', 'WM-SOUTH - Whitley Manufacturing South', 'Greenville', 'SC', 'Southeast', true),

  -- Midwest
  ('IBI', 'Indicom', 'Indicom Buildings', 'IBI - Indicom Buildings', 'Columbus', 'OH', 'Midwest', true),
  ('MRS', 'MR Steel', 'MR Steel', 'MRS - MR Steel', 'Springfield', 'MO', 'Midwest', true),

  -- Northeast
  ('PRM', 'Pro-Mod', 'Pro-Mod Manufacturing', 'PRM - Pro-Mod Manufacturing', 'Brooklyn', 'NY', 'Northeast', true),
  ('WM-EVERGREEN', 'Whitley Evergreen', 'Whitley Manufacturing Evergreen', 'WM-EVERGREEN - Whitley Manufacturing Evergreen', 'Rochester', 'NY', 'Northeast', true),

  -- Corporate
  ('SNB', 'Sunbelt Corporate', 'Sunbelt Modular (Corporate)', 'SNB - Sunbelt Modular (Corporate)', 'Dallas', 'TX', 'Corporate', true)

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
SELECT 'Factories created:' AS status;
SELECT code, short_name, city, state, region FROM factories ORDER BY region, code;
