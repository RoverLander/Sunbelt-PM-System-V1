-- ============================================================================
-- STEP 3: CREATE WORKFLOW STATIONS (21 Stations)
-- ============================================================================
-- Defines the 4-phase workflow system for project management.
-- These stations are used by the React Flow Workflow Canvas.
--
-- Phase 1: Initiation (3 stations)
-- Phase 2: Dealer Sign-Offs (7 stations)
-- Phase 3: Internal Approvals (5 stations)
-- Phase 4: Delivery (6 stations)
--
-- Created: January 13, 2026
-- ============================================================================

-- ============================================================================
-- DROP AND RECREATE WORKFLOW STATIONS TABLE
-- ============================================================================
-- First drop dependent table, then workflow_stations
DROP TABLE IF EXISTS project_workflow_status CASCADE;
DROP TABLE IF EXISTS workflow_stations CASCADE;

CREATE TABLE workflow_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  phase INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 4),
  display_order INTEGER NOT NULL,
  default_owner VARCHAR(50),
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_stations_phase ON workflow_stations(phase);
CREATE INDEX IF NOT EXISTS idx_workflow_stations_key ON workflow_stations(station_key);

COMMENT ON TABLE workflow_stations IS 'Defines the workflow stations for post-sales process';
COMMENT ON COLUMN workflow_stations.phase IS '1=Initiation, 2=Dealer Sign-Offs, 3=Internal Approvals, 4=Delivery';

-- ============================================================================
-- INSERT 21 WORKFLOW STATIONS
-- ============================================================================
INSERT INTO workflow_stations (station_key, name, description, phase, display_order, default_owner, is_required)
VALUES
  -- ========================================================================
  -- PHASE 1: INITIATION (3 stations)
  -- ========================================================================
  ('sales_handoff', 'Sales Handoff', 'Initial project handoff from sales to PM', 1, 1, 'pm', true),
  ('kickoff_meeting', 'Kickoff Meeting', 'Internal kickoff and planning meeting', 1, 2, 'pm', true),
  ('site_survey', 'Site Survey', 'Site survey and documentation', 1, 3, 'pm', false),

  -- ========================================================================
  -- PHASE 2: DEALER SIGN-OFFS (7 stations)
  -- ========================================================================
  ('drawings_20', '20% Drawings', 'Preliminary layout drawings for dealer review', 2, 1, 'drafting', true),
  ('drawings_65', '65% Drawings', 'Design development drawings', 2, 2, 'drafting', true),
  ('drawings_95', '95% Drawings', 'Construction documents - near final', 2, 3, 'drafting', true),
  ('drawings_100', '100% Drawings', 'Final construction documents', 2, 4, 'drafting', true),
  ('color_selections', 'Color Selections', 'Dealer color and finish selections', 2, 5, 'dealer', true),
  ('long_lead_items', 'Long Lead Items', 'Equipment and materials with extended lead times', 2, 6, 'procurement', true),
  ('cutsheets', 'Cutsheet Submittals', 'Equipment cutsheet approvals', 2, 7, 'dealer', true),

  -- ========================================================================
  -- PHASE 3: INTERNAL APPROVALS (5 stations)
  -- ========================================================================
  ('engineering_review', 'Engineering Review', 'Internal engineering review and stamp', 3, 1, 'engineering', true),
  ('third_party_review', 'Third Party Review', 'Third party plan review (if required)', 3, 2, 'third_party', false),
  ('state_approval', 'State Approval', 'State modular approval (if required)', 3, 3, 'state', false),
  ('permit_submission', 'Permit Submission', 'Building permit submission', 3, 4, 'pm', false),
  ('change_orders', 'Change Orders', 'Process any change orders', 3, 5, 'pm', false),

  -- ========================================================================
  -- PHASE 4: DELIVERY (6 stations)
  -- ========================================================================
  ('production_start', 'Production Start', 'Factory production begins', 4, 1, 'factory', true),
  ('qc_inspection', 'QC Inspection', 'Quality control inspection at factory', 4, 2, 'factory', true),
  ('delivery_scheduled', 'Delivery Scheduled', 'Delivery date confirmed', 4, 3, 'pm', true),
  ('delivery_complete', 'Delivery Complete', 'Units delivered to site', 4, 4, 'pm', true),
  ('set_complete', 'Set Complete', 'Units set on foundation', 4, 5, 'pm', true),
  ('project_closeout', 'Project Closeout', 'Final documentation and closeout', 4, 6, 'pm', true)

ON CONFLICT (station_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  phase = EXCLUDED.phase,
  display_order = EXCLUDED.display_order,
  default_owner = EXCLUDED.default_owner,
  is_required = EXCLUDED.is_required;

-- ============================================================================
-- ENABLE RLS AND CREATE POLICY
-- ============================================================================
ALTER TABLE workflow_stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_stations_read" ON workflow_stations;
CREATE POLICY "workflow_stations_read" ON workflow_stations FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Workflow stations created:' AS status;

SELECT
  phase,
  COUNT(*) as station_count,
  STRING_AGG(station_key, ', ' ORDER BY display_order) as stations
FROM workflow_stations
GROUP BY phase
ORDER BY phase;

SELECT 'Total stations: ' || COUNT(*) AS total FROM workflow_stations;
