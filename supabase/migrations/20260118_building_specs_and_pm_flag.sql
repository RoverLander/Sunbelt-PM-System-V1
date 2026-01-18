-- ============================================================================
-- 20260118_building_specs_and_pm_flag.sql
-- ============================================================================
-- Adds building specification fields to sales_quotes and projects tables
-- for capturing module count, building dimensions, and PM flagging capability.
-- ============================================================================

-- ============================================================================
-- SECTION 1: ADD BUILDING SPECS TO SALES_QUOTES TABLE
-- ============================================================================

-- Building dimensions (in feet)
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_width NUMERIC(10,2);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_length NUMERIC(10,2);

-- Module specifications
-- Module width dropdown: 10', 12', 14' are standard options
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS mod_width NUMERIC(10,2);
-- Module count can be TBD initially (NULL means TBD)
-- module_count already exists in some schemas, add if missing
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS module_count INTEGER;

-- Building type and occupancy (matches Praxis Building Order Sheet)
-- building_type already exists in some schemas
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS occupancy VARCHAR(20);
-- Special materials checkboxes stored as JSONB
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS special_materials JSONB DEFAULT '{}';

-- PM Flag - VP can flag quotes as PM projects
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS is_pm_flagged BOOLEAN DEFAULT false;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_at TIMESTAMPTZ;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_by UUID REFERENCES users(id);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flag_notes TEXT;

-- ============================================================================
-- SECTION 2: ADD BUILDING SPECS TO PROJECTS TABLE
-- ============================================================================

-- Building dimensions (in feet)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_width NUMERIC(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_length NUMERIC(10,2);

-- Module specifications
ALTER TABLE projects ADD COLUMN IF NOT EXISTS mod_width NUMERIC(10,2);
-- module_count already exists

-- Building occupancy and special materials
ALTER TABLE projects ADD COLUMN IF NOT EXISTS occupancy VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS special_materials JSONB DEFAULT '{}';

-- PM assignment tracking
-- is_pm_job already exists from previous migration
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pm_flagged_from_quote BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_pm_id UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pm_assigned_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pm_assigned_by UUID REFERENCES users(id);

-- ============================================================================
-- SECTION 3: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN sales_quotes.building_width IS 'Building footprint width in feet (e.g., 36 for 36'' wide building)';
COMMENT ON COLUMN sales_quotes.building_length IS 'Building footprint length in feet (e.g., 120 for 120'' long building)';
COMMENT ON COLUMN sales_quotes.mod_width IS 'Standard module width in feet (10, 12, or 14)';
COMMENT ON COLUMN sales_quotes.module_count IS 'Number of modules in the building (can be NULL for TBD)';
COMMENT ON COLUMN sales_quotes.occupancy IS 'Building occupancy classification (A, B, E, etc.)';
COMMENT ON COLUMN sales_quotes.special_materials IS 'Special materials flags: {tt_p: bool, sprinklers: bool, plumbing: bool}';
COMMENT ON COLUMN sales_quotes.is_pm_flagged IS 'VP flagged this quote as a PM project';
COMMENT ON COLUMN sales_quotes.pm_flagged_at IS 'When the quote was flagged as PM project';
COMMENT ON COLUMN sales_quotes.pm_flagged_by IS 'User who flagged the quote as PM project';

COMMENT ON COLUMN projects.building_width IS 'Building footprint width in feet';
COMMENT ON COLUMN projects.building_length IS 'Building footprint length in feet';
COMMENT ON COLUMN projects.mod_width IS 'Standard module width in feet';
COMMENT ON COLUMN projects.assigned_pm_id IS 'Director-assigned PM for the project';
COMMENT ON COLUMN projects.pm_assigned_at IS 'When PM was assigned by Director';
COMMENT ON COLUMN projects.pm_assigned_by IS 'Director who assigned the PM';

-- ============================================================================
-- SECTION 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sales_quotes_pm_flagged ON sales_quotes(is_pm_flagged) WHERE is_pm_flagged = true;
CREATE INDEX IF NOT EXISTS idx_projects_assigned_pm ON projects(assigned_pm_id) WHERE assigned_pm_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_unassigned_pm ON projects(id) WHERE assigned_pm_id IS NULL AND is_pm_job = true;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Building Specs & PM Flag Migration Complete ===';
  RAISE NOTICE 'sales_quotes columns added: building_width, building_length, mod_width, module_count, occupancy, special_materials, is_pm_flagged, pm_flagged_at, pm_flagged_by, pm_flag_notes';
  RAISE NOTICE 'projects columns added: building_width, building_length, mod_width, occupancy, special_materials, pm_flagged_from_quote, assigned_pm_id, pm_assigned_at, pm_assigned_by';
END $$;
