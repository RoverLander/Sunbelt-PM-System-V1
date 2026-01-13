-- ============================================================================
-- PRAXIS INTEGRATION SCHEMA MIGRATION
-- ============================================================================
-- Version: 1.0
-- Date: January 13, 2026
-- Description: Adds schema support for Praxis (Access-based estimating software)
--              integration with Sunbelt PM System.
--
-- This migration includes:
-- 1. New columns on projects table for Praxis data
-- 2. dealers table for Praxis dealer/customer tracking
-- 3. project_documents_checklist for order processing checklist
-- 4. Indexes and constraints
--
-- Reference: docs/PRAXIS_INTEGRATION_ANALYSIS.md
-- ============================================================================


-- ============================================================================
-- SECTION 1: DEALERS TABLE
-- ============================================================================
-- Dealers are the customers in Praxis (PMSI, MMG, United Rentals, etc.)
-- These are separate from sales_customers which is more general CRM data

CREATE TABLE IF NOT EXISTS dealers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification
  code VARCHAR(20) NOT NULL,                    -- Short code (PMSI, MMG, etc.)
  name VARCHAR(200) NOT NULL,                   -- Full name (Pacific Mobile Structures Inc)

  -- Branch information (dealers can have multiple branches)
  branch_code VARCHAR(50),                      -- Branch code (e.g., MOBMOD-BOISE)
  branch_name VARCHAR(200),                     -- Branch name

  -- Contact info
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),

  -- Primary contact
  contact_name VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),

  -- Relationship
  factory VARCHAR(10),                          -- Primary factory code (NW, ATL, etc.)
  is_active BOOLEAN DEFAULT true,

  -- Notes about dealer behavior
  notes TEXT,                                   -- e.g., "PO may diverge after change orders"

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint on code + branch
  UNIQUE(code, branch_code)
);

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_dealers_code ON dealers(code);
CREATE INDEX IF NOT EXISTS idx_dealers_factory ON dealers(factory);

COMMENT ON TABLE dealers IS 'Praxis dealers/customers - the companies that purchase modular buildings';
COMMENT ON COLUMN dealers.code IS 'Short code used in Praxis (PMSI, MMG, US MOD, United Rentals)';
COMMENT ON COLUMN dealers.branch_code IS 'Branch location code from Praxis (e.g., MOBMOD-BOISE)';


-- ============================================================================
-- SECTION 2: PROJECTS TABLE - PRAXIS INTEGRATION FIELDS
-- ============================================================================

-- Praxis Identification
ALTER TABLE projects ADD COLUMN IF NOT EXISTS praxis_quote_number VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS serial_number VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS praxis_source_factory VARCHAR(10);

-- Quote/Sales Tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS folder_number VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sold_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimator_id UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_po_number VARCHAR(50);

-- Building Classification
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_type VARCHAR(30);

-- Building Specifications
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_height INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_width INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_length INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS interior_wall_lf INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stories INTEGER DEFAULT 1;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS module_size VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS module_count INTEGER DEFAULT 1;

-- Cost Information
ALTER TABLE projects ADD COLUMN IF NOT EXISTS material_cost DECIMAL(12,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS markup_factor DECIMAL(5,3);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS engineering_cost DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approvals_cost DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(10,2);

-- Location & Compliance
ALTER TABLE projects ADD COLUMN IF NOT EXISTS state_tags TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS climate_zone INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS floor_load_psf INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS roof_load_psf INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_address TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_city VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_state VARCHAR(2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_zip VARCHAR(10);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS occupancy_type VARCHAR(10);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS set_type VARCHAR(30);

-- Special Requirements
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_ttp BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sprinkler_type VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS has_plumbing BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS wui_compliant BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_cut_sheets BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_om_manuals BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS foundation_plan_status VARCHAR(30);

-- Dealer Reference
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES dealers(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dealer_branch VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dealer_contact_name VARCHAR(100);

-- Schedule
ALTER TABLE projects ADD COLUMN IF NOT EXISTS promised_delivery_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS drawings_due_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS long_lead_notes TEXT;

-- Pipeline/Forecasting Fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS outlook_percentage INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS waiting_on TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_close_timeframe VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER;

-- Quoting Phase Fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qa_due_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quote_due_date DATE;

-- Pre-Customer Meeting Tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pre_customer_meeting_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pre_customer_meeting_notes TEXT;

-- Approval Tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_submittal_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_approval_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS state_submittal_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS state_approval_date DATE;

-- Import Tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS praxis_synced_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS imported_from VARCHAR(50);

-- Comments
COMMENT ON COLUMN projects.praxis_quote_number IS 'Praxis quote number format: {Factory}-{Seq}-{Year} (e.g., NW-0061-2025)';
COMMENT ON COLUMN projects.serial_number IS 'Praxis serial number - auto-generated when quote converts to sale';
COMMENT ON COLUMN projects.folder_number IS 'Bid folder reference number (e.g., 251201)';
COMMENT ON COLUMN projects.building_type IS 'CUSTOM, FLEET/STOCK, GOVERNMENT, Business';
COMMENT ON COLUMN projects.state_tags IS 'State(s) where building will be installed';
COMMENT ON COLUMN projects.occupancy_type IS 'Building occupancy type (A, B, E, etc.)';
COMMENT ON COLUMN projects.set_type IS 'PAD, PIERS, ABOVE GRADE SET';
COMMENT ON COLUMN projects.sprinkler_type IS 'N/A, Wet, Dry';
COMMENT ON COLUMN projects.wui_compliant IS 'Wildland Urban Interface compliant';
COMMENT ON COLUMN projects.requires_ttp IS 'Requires TT&P (Toilet, Tissue & Paper)';
COMMENT ON COLUMN projects.outlook_percentage IS 'Sales probability percentage (95%, 100%)';
COMMENT ON COLUMN projects.waiting_on IS 'What is blocking progress (PO, Sign Off, Colors)';
COMMENT ON COLUMN projects.difficulty_rating IS 'Complexity rating from estimator';
COMMENT ON COLUMN projects.imported_from IS 'Import source: manual_entry, csv_import, praxis_export';


-- ============================================================================
-- SECTION 3: PROJECT DOCUMENTS CHECKLIST
-- ============================================================================
-- Tracks the 11-item order processing checklist from Praxis SOP

CREATE TABLE IF NOT EXISTS project_documents_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Document identification
  document_type VARCHAR(50) NOT NULL,           -- Type from standard list
  custom_name VARCHAR(200),                     -- Custom name if "Other"
  display_order INTEGER DEFAULT 0,

  -- Status tracking
  is_required BOOLEAN DEFAULT true,
  is_received BOOLEAN DEFAULT false,
  received_date DATE,

  -- File reference (if uploaded to Supabase storage)
  file_path TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One entry per document type per project
  UNIQUE(project_id, document_type, custom_name)
);

-- Standard document types (from Sales Folder Order of Importance)
COMMENT ON TABLE project_documents_checklist IS 'Order processing document checklist per project';
COMMENT ON COLUMN project_documents_checklist.document_type IS
  'Standard types: sales_release, building_order, change_orders, dealer_po, sub_material_bids, bid_specs, floor_plan, bom, internal_calcs, correspondence, extension_sheet, color_selection, long_lead_form, handoff_doc';

CREATE INDEX IF NOT EXISTS idx_project_docs_project ON project_documents_checklist(project_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_type ON project_documents_checklist(document_type);


-- ============================================================================
-- SECTION 4: PRAXIS IMPORT LOG
-- ============================================================================
-- Track import history for auditing

CREATE TABLE IF NOT EXISTS praxis_import_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What was imported
  import_type VARCHAR(30) NOT NULL,             -- manual_entry, csv_import
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  praxis_quote_number VARCHAR(20),
  serial_number VARCHAR(20),

  -- Import details
  source_file_name VARCHAR(255),
  row_count INTEGER,
  success_count INTEGER,
  error_count INTEGER,
  errors JSONB,                                 -- Array of error messages

  -- Who/when
  imported_by UUID REFERENCES users(id),
  imported_at TIMESTAMPTZ DEFAULT NOW(),

  -- Factory
  factory VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_praxis_import_date ON praxis_import_log(imported_at);
CREATE INDEX IF NOT EXISTS idx_praxis_import_factory ON praxis_import_log(factory);

COMMENT ON TABLE praxis_import_log IS 'Audit log for Praxis data imports';


-- ============================================================================
-- SECTION 5: INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_praxis_quote ON projects(praxis_quote_number) WHERE praxis_quote_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_serial ON projects(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_dealer ON projects(dealer_id) WHERE dealer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_building_type ON projects(building_type) WHERE building_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_sold_date ON projects(sold_date) WHERE sold_date IS NOT NULL;


-- ============================================================================
-- SECTION 6: INSERT DEFAULT DEALERS
-- ============================================================================
-- Pre-populate with known dealers from training materials

INSERT INTO dealers (code, name, notes) VALUES
  ('PMSI', 'Pacific Mobile Structures Inc', 'PO often matches Building Order Sheet'),
  ('MMG', 'Mobile Modular Group', 'PO may diverge from BOS after change orders'),
  ('US MOD', 'US Modular', NULL),
  ('United Rentals', 'United Rentals', 'Primarily stock buildings')
ON CONFLICT (code, branch_code) DO NOTHING;


-- ============================================================================
-- SECTION 7: RLS POLICIES
-- ============================================================================

-- Dealers table - readable by all authenticated, writable by elevated roles
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dealers viewable by authenticated users" ON dealers;
CREATE POLICY "Dealers viewable by authenticated users"
  ON dealers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Dealers editable by elevated roles" ON dealers;
CREATE POLICY "Dealers editable by elevated roles"
  ON dealers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('director', 'vp', 'admin', 'it', 'Director', 'VP', 'Admin', 'IT', 'Sales_Manager')
    )
  );

-- Project documents checklist - same as projects
ALTER TABLE project_documents_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project docs viewable by authenticated users" ON project_documents_checklist;
CREATE POLICY "Project docs viewable by authenticated users"
  ON project_documents_checklist FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Project docs editable by project team" ON project_documents_checklist;
CREATE POLICY "Project docs editable by project team"
  ON project_documents_checklist FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
          AND u.role IN ('director', 'vp', 'admin', 'it', 'pm', 'pc',
                         'Director', 'VP', 'Admin', 'IT', 'PM', 'PC')
        )
      )
    )
  );

-- Import log - viewable by all, writable by importers
ALTER TABLE praxis_import_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Import log viewable by authenticated users" ON praxis_import_log;
CREATE POLICY "Import log viewable by authenticated users"
  ON praxis_import_log FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Import log writable by authenticated users" ON praxis_import_log;
CREATE POLICY "Import log writable by authenticated users"
  ON praxis_import_log FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRAXIS INTEGRATION MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'New tables created:';
  RAISE NOTICE '  - dealers: Praxis dealer/customer tracking';
  RAISE NOTICE '  - project_documents_checklist: Order processing checklist';
  RAISE NOTICE '  - praxis_import_log: Import audit trail';
  RAISE NOTICE '';
  RAISE NOTICE 'Projects table extended with:';
  RAISE NOTICE '  - Praxis identification (quote_number, serial_number)';
  RAISE NOTICE '  - Building specs (dimensions, stories, modules)';
  RAISE NOTICE '  - Cost breakdown (material, markup, engineering)';
  RAISE NOTICE '  - Compliance (climate_zone, loads, occupancy, WUI)';
  RAISE NOTICE '  - Dealer reference (dealer_id, branch, contact)';
  RAISE NOTICE '  - Schedule (promised_delivery, drawings_due)';
  RAISE NOTICE '  - Pipeline tracking (outlook_pct, waiting_on)';
  RAISE NOTICE '  - Approval dates (customer, state)';
  RAISE NOTICE '';
  RAISE NOTICE 'Default dealers seeded: PMSI, MMG, US MOD, United Rentals';
  RAISE NOTICE '========================================';
END $$;
