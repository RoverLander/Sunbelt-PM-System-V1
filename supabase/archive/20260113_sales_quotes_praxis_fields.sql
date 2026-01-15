-- ============================================================================
-- SALES QUOTES PRAXIS INTEGRATION MIGRATION
-- ============================================================================
-- Version: 1.0
-- Date: January 13, 2026
-- Description: Adds Praxis-specific fields to sales_quotes table for
--              importing quotes directly from Praxis estimating software.
--
-- This extends the existing sales_quotes table with:
-- 1. Praxis identification fields
-- 2. Building specifications from Praxis
-- 3. Pipeline/forecasting fields
-- 4. PM flagging capability
-- ============================================================================


-- ============================================================================
-- SECTION 1: PRAXIS IDENTIFICATION FIELDS
-- ============================================================================

-- Praxis quote reference
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS praxis_quote_number VARCHAR(20);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS praxis_source_factory VARCHAR(10);

-- Dealer reference (links to dealers table from praxis_integration migration)
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES dealers(id);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_branch VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS dealer_contact_name VARCHAR(100);

COMMENT ON COLUMN sales_quotes.praxis_quote_number IS 'Praxis quote number format: {Factory}-{Seq}-{Year}';
COMMENT ON COLUMN sales_quotes.praxis_source_factory IS 'Factory code from Praxis (NW, ATL, etc.)';


-- ============================================================================
-- SECTION 2: BUILDING SPECIFICATIONS
-- ============================================================================

-- Building type (using Praxis taxonomy)
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_type VARCHAR(30);

-- Dimensions
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_width INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS building_length INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS square_footage INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS module_count INTEGER DEFAULT 1;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS stories INTEGER DEFAULT 1;

-- Compliance/Location
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS state_tags TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS climate_zone INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS occupancy_type VARCHAR(10);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS set_type VARCHAR(30);

-- Special requirements
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS sprinkler_type VARCHAR(20);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS has_plumbing BOOLEAN DEFAULT false;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS wui_compliant BOOLEAN DEFAULT false;

COMMENT ON COLUMN sales_quotes.building_type IS 'CUSTOM, FLEET/STOCK, GOVERNMENT, Business';
COMMENT ON COLUMN sales_quotes.state_tags IS 'State(s) where building will be installed';
COMMENT ON COLUMN sales_quotes.occupancy_type IS 'Building occupancy type (A, B, E, etc.)';
COMMENT ON COLUMN sales_quotes.set_type IS 'PAD, PIERS, ABOVE GRADE SET';


-- ============================================================================
-- SECTION 3: PIPELINE/FORECASTING FIELDS
-- ============================================================================

-- Pipeline tracking (from Praxis Pipeline Report)
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS outlook_percentage INTEGER;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS waiting_on TEXT;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS expected_close_timeframe VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER;

-- Dates
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS qa_due_date DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS quote_due_date DATE;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS promised_delivery_date DATE;

COMMENT ON COLUMN sales_quotes.outlook_percentage IS 'Sales probability percentage (95%, 100%)';
COMMENT ON COLUMN sales_quotes.waiting_on IS 'What is blocking progress (PO, Sign Off, Colors)';
COMMENT ON COLUMN sales_quotes.difficulty_rating IS 'Complexity rating from estimator (1-5)';


-- ============================================================================
-- SECTION 4: PM FLAGGING AND CONVERSION
-- ============================================================================

-- PM involvement flag
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged BOOLEAN DEFAULT false;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_at TIMESTAMPTZ;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_by UUID REFERENCES users(id);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS pm_flagged_reason TEXT;

-- Conversion tracking
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_to_project_id UUID REFERENCES projects(id);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES users(id);

-- Import tracking
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS imported_from VARCHAR(50);
ALTER TABLE sales_quotes ADD COLUMN IF NOT EXISTS praxis_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN sales_quotes.pm_flagged IS 'True if sales has flagged this quote for PM assistance';
COMMENT ON COLUMN sales_quotes.converted_to_project_id IS 'Project ID when quote is converted to PM project';
COMMENT ON COLUMN sales_quotes.imported_from IS 'Import source: manual_entry, csv_import, praxis_export';


-- ============================================================================
-- SECTION 5: UPDATE STATUS OPTIONS
-- ============================================================================
-- Add new Praxis-aligned statuses to the check constraint (if one exists)
-- Status options: draft, sent, negotiating, awaiting_po, po_received, won, lost, expired, converted

-- Note: PostgreSQL doesn't allow easy ALTER of CHECK constraints
-- The application will handle status validation


-- ============================================================================
-- SECTION 6: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sales_quotes_praxis_quote ON sales_quotes(praxis_quote_number) WHERE praxis_quote_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_quotes_dealer ON sales_quotes(dealer_id) WHERE dealer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_quotes_pm_flagged ON sales_quotes(pm_flagged) WHERE pm_flagged = true;
CREATE INDEX IF NOT EXISTS idx_sales_quotes_outlook ON sales_quotes(outlook_percentage) WHERE outlook_percentage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_quotes_building_type ON sales_quotes(building_type) WHERE building_type IS NOT NULL;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SALES QUOTES PRAXIS FIELDS MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'sales_quotes table extended with:';
  RAISE NOTICE '  - Praxis identification (praxis_quote_number, source_factory)';
  RAISE NOTICE '  - Dealer reference (dealer_id, branch, contact)';
  RAISE NOTICE '  - Building specs (type, dimensions, modules, stories)';
  RAISE NOTICE '  - Compliance (climate_zone, occupancy, set_type)';
  RAISE NOTICE '  - Pipeline tracking (outlook_pct, waiting_on, difficulty)';
  RAISE NOTICE '  - PM flagging capability';
  RAISE NOTICE '  - Conversion tracking (to project)';
  RAISE NOTICE '========================================';
END $$;
