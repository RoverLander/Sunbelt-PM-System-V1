-- ============================================================================
-- SUNBELT PM - WORKFLOW SYSTEM MIGRATION
-- ============================================================================
-- Version: 1.0
-- Date: January 9, 2026
-- Description: Comprehensive migration for workflow tracking system
--
-- This migration includes:
-- 1. New tables for workflow tracking
-- 2. Modifications to existing tables
-- 3. Seed data for workflow stations
-- 4. RLS policies for all new tables
-- 5. Indexes for performance
-- 6. Data migration for task status changes
--
-- IMPORTANT: Run this migration in a transaction. Review before executing.
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENABLE REQUIRED EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: NEW TABLES - WORKFLOW CORE
-- ============================================================================

-- ==========================================================================
-- workflow_stations (Reference Table - All workflow stations)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS workflow_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Station Identity
  station_key VARCHAR NOT NULL UNIQUE,
  station_name VARCHAR NOT NULL,
  phase INTEGER NOT NULL,
  phase_name VARCHAR NOT NULL,

  -- Position in flow
  parent_station_key VARCHAR,
  display_order INTEGER NOT NULL,

  -- Behavior
  is_parallel BOOLEAN DEFAULT false,
  parallel_group VARCHAR,
  can_skip BOOLEAN DEFAULT false,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_stations_phase ON workflow_stations(phase);
CREATE INDEX IF NOT EXISTS idx_workflow_stations_parent ON workflow_stations(parent_station_key);

COMMENT ON TABLE workflow_stations IS 'Reference table defining all workflow stations in the project lifecycle';

-- ==========================================================================
-- project_workflow_status (Per-Project Station Status - Cached)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS project_workflow_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  station_key VARCHAR REFERENCES workflow_stations(station_key),

  -- Status (derived from linked tasks, cached for performance)
  status VARCHAR DEFAULT 'not_started',

  -- Deadline (earliest from linked tasks)
  earliest_deadline DATE,

  -- Skip handling
  is_skipped BOOLEAN DEFAULT false,
  skipped_reason VARCHAR,

  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, station_key)
);

CREATE INDEX IF NOT EXISTS idx_project_workflow_project ON project_workflow_status(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workflow_status ON project_workflow_status(status);

COMMENT ON TABLE project_workflow_status IS 'Cached workflow status per project per station';

-- ==========================================================================
-- factory_milestone_templates (Factory-Specific Milestone Defaults)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS factory_milestone_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,

  -- Template Info
  milestone_order INTEGER NOT NULL,
  milestone_name VARCHAR NOT NULL,
  milestone_key VARCHAR NOT NULL,

  -- Defaults
  default_days_from_po INTEGER,
  requires_signoff BOOLEAN DEFAULT false,
  signoff_type VARCHAR,

  -- Extensibility
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(factory_id, milestone_key)
);

CREATE INDEX IF NOT EXISTS idx_factory_milestones_factory ON factory_milestone_templates(factory_id);

COMMENT ON TABLE factory_milestone_templates IS 'Factory-specific milestone templates for auto-population';

-- ============================================================================
-- SECTION 3: NEW TABLES - DRAWING WORKFLOW
-- ============================================================================

-- ==========================================================================
-- drawing_versions (Drawing Review Loop)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS drawing_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Version Info
  version_number INTEGER NOT NULL,
  drawing_percentage INTEGER,

  -- Sent Info
  sent_date DATE,
  sent_by UUID REFERENCES users(id),

  -- Dealer Response
  dealer_response VARCHAR,
  response_date DATE,
  redline_document_url TEXT,
  redline_document_name VARCHAR,

  -- Status
  status VARCHAR DEFAULT 'Draft',

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_drawing_versions_project ON drawing_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_drawing_versions_status ON drawing_versions(status);

COMMENT ON TABLE drawing_versions IS 'Drawing version history with dealer review tracking';
COMMENT ON COLUMN drawing_versions.dealer_response IS 'Approve, Approve with Redlines, Reject with Redlines, Reject';
COMMENT ON COLUMN drawing_versions.drawing_percentage IS '20, 65, 95, or 100';

-- ==========================================================================
-- engineering_reviews (Internal Engineering Review)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS engineering_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Dates
  sent_date DATE,
  eta_date DATE,
  complete_date DATE,

  -- Issues
  issues_found BOOLEAN DEFAULT false,
  dealer_approval_needed BOOLEAN DEFAULT false,
  co_triggered BOOLEAN DEFAULT false,
  change_order_id UUID,

  -- Metadata
  notes TEXT,
  reviewed_by VARCHAR,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engineering_reviews_project ON engineering_reviews(project_id);

COMMENT ON TABLE engineering_reviews IS 'Internal engineering review tracking';

-- ==========================================================================
-- third_party_reviews (Third Party Stamp)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS third_party_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Dates
  sent_date DATE,
  eta_date DATE,
  complete_date DATE,

  -- Status
  status VARCHAR DEFAULT 'Pending',

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_third_party_reviews_project ON third_party_reviews(project_id);

COMMENT ON TABLE third_party_reviews IS 'Third party engineering stamp tracking';

-- ==========================================================================
-- state_approvals (Multi-State Approval Tracking)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS state_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- State Info
  state_code VARCHAR(2) NOT NULL,
  state_name VARCHAR,

  -- Dates
  sent_date DATE,
  eta_date DATE,
  complete_date DATE,

  -- Results
  insignia_numbers TEXT,

  -- Status
  status VARCHAR DEFAULT 'Pending',

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_state_approvals_project ON state_approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_state_approvals_state ON state_approvals(state_code);
CREATE INDEX IF NOT EXISTS idx_state_approvals_status ON state_approvals(status);

COMMENT ON TABLE state_approvals IS 'State agency approval tracking (supports multiple states per project)';

-- ============================================================================
-- SECTION 4: NEW TABLES - DEALER SIGN-OFF FORMS
-- ============================================================================

-- ==========================================================================
-- long_lead_items (Long Lead Item Tracking)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS long_lead_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Item Details
  item_name VARCHAR NOT NULL,
  manufacturer VARCHAR,
  model_number VARCHAR,
  quantity INTEGER DEFAULT 1,
  lead_time_weeks INTEGER,

  -- Cut Sheet
  has_cutsheet BOOLEAN DEFAULT false,
  cutsheet_url TEXT,
  cutsheet_name VARCHAR,

  -- Status
  status VARCHAR DEFAULT 'Pending',
  submitted_date DATE,
  signoff_date DATE,

  -- Metadata
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_long_lead_items_project ON long_lead_items(project_id);
CREATE INDEX IF NOT EXISTS idx_long_lead_items_status ON long_lead_items(status);

COMMENT ON TABLE long_lead_items IS 'Long lead item tracking for dealer sign-off';

-- ==========================================================================
-- color_selections (Color Selection Tracking)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS color_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Category & Item
  category VARCHAR NOT NULL,
  item_name VARCHAR NOT NULL,

  -- Selection Details
  color_code VARCHAR,
  color_name VARCHAR,
  manufacturer VARCHAR,

  -- Cut Sheet
  cutsheet_url TEXT,
  cutsheet_name VARCHAR,

  -- Non-Stock Tracking
  is_non_stock BOOLEAN DEFAULT false,
  non_stock_verified BOOLEAN DEFAULT false,
  non_stock_lead_time VARCHAR,
  non_stock_task_id UUID,

  -- Status
  status VARCHAR DEFAULT 'Pending',

  -- Metadata
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_color_selections_project ON color_selections(project_id);
CREATE INDEX IF NOT EXISTS idx_color_selections_non_stock ON color_selections(is_non_stock);

COMMENT ON TABLE color_selections IS 'Color selection tracking for dealer sign-off';

-- ==========================================================================
-- cutsheet_submittals (Cutsheet Approval Tracking)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS cutsheet_submittals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Item Details
  item_name VARCHAR NOT NULL,
  manufacturer VARCHAR,
  model_number VARCHAR,

  -- Document
  cutsheet_url TEXT,
  cutsheet_name VARCHAR,

  -- Status
  status VARCHAR DEFAULT 'Pending',
  submitted_date DATE,
  signoff_date DATE,

  -- Metadata
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cutsheet_submittals_project ON cutsheet_submittals(project_id);

COMMENT ON TABLE cutsheet_submittals IS 'Cutsheet submittal tracking for dealer sign-off';

-- ============================================================================
-- SECTION 5: NEW TABLES - CHANGE ORDERS
-- ============================================================================

-- ==========================================================================
-- change_orders (Change Order Tracking)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- CO Info
  co_number INTEGER NOT NULL,
  co_type VARCHAR DEFAULT 'General',
  date DATE NOT NULL,

  -- Parties
  to_name VARCHAR,
  from_name VARCHAR,

  -- Reference
  po_number VARCHAR,

  -- Status
  status VARCHAR DEFAULT 'Draft',

  -- Dates
  sent_date DATE,
  signed_date DATE,
  implemented_date DATE,

  -- Sign-Off
  signed_by VARCHAR,
  signature_date DATE,
  document_url TEXT,
  document_name VARCHAR,

  -- Totals
  total_amount NUMERIC DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, co_number)
);

CREATE INDEX IF NOT EXISTS idx_change_orders_project ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);

COMMENT ON TABLE change_orders IS 'Change order tracking for post-signoff modifications';
COMMENT ON COLUMN change_orders.co_type IS 'Redlines, General, Pricing';
COMMENT ON COLUMN change_orders.status IS 'Draft, Sent, Signed, Implemented, Rejected';

-- ==========================================================================
-- change_order_items (Change Order Line Items)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS change_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_order_id UUID REFERENCES change_orders(id) ON DELETE CASCADE,

  -- Item Details
  description TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_order_items_co ON change_order_items(change_order_id);

COMMENT ON TABLE change_order_items IS 'Line items within a change order';

-- ============================================================================
-- SECTION 6: NEW TABLES - EMAIL SYSTEM
-- ============================================================================

-- ==========================================================================
-- warning_emails_log (Email Audit Trail)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS warning_emails_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id),

  -- Email Details
  email_type VARCHAR NOT NULL,
  sent_to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],

  -- Content
  email_subject VARCHAR,
  email_body TEXT,

  -- Tracking
  sent_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  marked_sent_at TIMESTAMPTZ,

  -- Status
  status VARCHAR DEFAULT 'Draft',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warning_emails_project ON warning_emails_log(project_id);
CREATE INDEX IF NOT EXISTS idx_warning_emails_milestone ON warning_emails_log(milestone_id);
CREATE INDEX IF NOT EXISTS idx_warning_emails_status ON warning_emails_log(status);

COMMENT ON TABLE warning_emails_log IS 'Audit trail for warning emails sent to dealers';
COMMENT ON COLUMN warning_emails_log.email_type IS 'warning, overdue, confirmation';
COMMENT ON COLUMN warning_emails_log.status IS 'Draft, Sent, Failed';

-- ============================================================================
-- SECTION 7: MODIFY EXISTING TABLES
-- ============================================================================

-- ==========================================================================
-- tasks table - Add workflow columns
-- ==========================================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_station_key VARCHAR;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_court VARCHAR;

CREATE INDEX IF NOT EXISTS idx_tasks_workflow_station ON tasks(workflow_station_key);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_court ON tasks(assigned_court);

COMMENT ON COLUMN tasks.workflow_station_key IS 'Links task to workflow station';
COMMENT ON COLUMN tasks.assigned_court IS 'Who has the ball: dealer, drafting, pm, engineering, third_party, state, factory, procurement';

-- ==========================================================================
-- milestones table - Add workflow columns
-- ==========================================================================
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS milestone_key VARCHAR;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS requires_signoff BOOLEAN DEFAULT false;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS signoff_type VARCHAR;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS signoff_document_url TEXT;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS signoff_document_name VARCHAR;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS signoff_date DATE;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS signoff_by VARCHAR;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS warning_email_sent_at TIMESTAMPTZ;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS warning_email_sent_to TEXT[];
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS sent_date DATE;

CREATE INDEX IF NOT EXISTS idx_milestones_key ON milestones(milestone_key);
CREATE INDEX IF NOT EXISTS idx_milestones_signoff ON milestones(requires_signoff);

-- ==========================================================================
-- projects table - Add workflow columns
-- ==========================================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS po_received_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS po_document_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS po_number VARCHAR;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_generate_workflow_tasks BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS plant_manager_id UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sales_manager_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_projects_coordinator ON projects(coordinator_id);

-- ==========================================================================
-- Add foreign key for engineering_reviews -> change_orders (after both exist)
-- ==========================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'engineering_reviews_change_order_fk'
  ) THEN
    ALTER TABLE engineering_reviews
    ADD CONSTRAINT engineering_reviews_change_order_fk
    FOREIGN KEY (change_order_id) REFERENCES change_orders(id);
  END IF;
END $$;

-- ============================================================================
-- SECTION 8: SEED DATA - WORKFLOW STATIONS
-- ============================================================================

INSERT INTO workflow_stations (station_key, station_name, phase, phase_name, parent_station_key, display_order, is_parallel, parallel_group, can_skip) VALUES
-- Phase 1: Initiation
('po_received', 'PO Received', 1, 'Initiation', NULL, 1, false, NULL, false),

-- Phase 2: Dealer Sign-Offs
('drawings', 'Drawings', 2, 'Dealer Sign-Offs', NULL, 10, true, 'dealer_signoffs', false),
('drawings_20', '20%', 2, 'Dealer Sign-Offs', 'drawings', 11, false, NULL, false),
('drawings_65', '65%', 2, 'Dealer Sign-Offs', 'drawings', 12, false, NULL, false),
('drawings_95', '95%', 2, 'Dealer Sign-Offs', 'drawings', 13, false, NULL, false),
('drawings_100', '100%', 2, 'Dealer Sign-Offs', 'drawings', 14, false, NULL, false),

('long_lead', 'Long Lead', 2, 'Dealer Sign-Offs', NULL, 20, true, 'dealer_signoffs', true),
('long_lead_submitted', 'Submitted', 2, 'Dealer Sign-Offs', 'long_lead', 21, false, NULL, true),
('long_lead_signed', 'Signed Off', 2, 'Dealer Sign-Offs', 'long_lead', 22, false, NULL, true),

('cutsheets', 'Cutsheets', 2, 'Dealer Sign-Offs', NULL, 30, true, 'dealer_signoffs', true),
('cutsheets_submitted', 'Submitted', 2, 'Dealer Sign-Offs', 'cutsheets', 31, false, NULL, true),
('cutsheets_signed', 'Signed Off', 2, 'Dealer Sign-Offs', 'cutsheets', 32, false, NULL, true),

('colors', 'Colors', 2, 'Dealer Sign-Offs', NULL, 40, true, 'dealer_signoffs', true),
('colors_submitted', 'Submitted', 2, 'Dealer Sign-Offs', 'colors', 41, false, NULL, true),
('colors_signed', 'Signed Off', 2, 'Dealer Sign-Offs', 'colors', 42, false, NULL, true),

('procurement', 'Procurement', 2, 'Dealer Sign-Offs', NULL, 50, false, NULL, false),

-- Phase 3: Internal Approvals
('engineering', 'Engineering', 3, 'Internal Approvals', NULL, 60, false, NULL, false),
('third_party', 'Third Party', 3, 'Internal Approvals', NULL, 70, true, 'internal_parallel', true),
('state_approval', 'State Approval', 3, 'Internal Approvals', NULL, 71, true, 'internal_parallel', true),
('production', 'Production', 3, 'Internal Approvals', NULL, 72, true, 'internal_parallel', false),

-- Phase 4: Delivery
('transport', 'Transport', 4, 'Delivery', NULL, 80, false, NULL, false)

ON CONFLICT (station_key) DO NOTHING;

-- ============================================================================
-- SECTION 9: DATA MIGRATION - TASK STATUSES
-- ============================================================================

-- Migrate 'On Hold' and 'Blocked' to 'Awaiting Response'
UPDATE tasks
SET status = 'Awaiting Response',
    updated_at = NOW()
WHERE status IN ('On Hold', 'Blocked');

-- Log the migration
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM tasks
  WHERE status = 'Awaiting Response'
    AND updated_at > NOW() - INTERVAL '1 minute';

  RAISE NOTICE 'Migrated % tasks to Awaiting Response status', migrated_count;
END $$;

-- ============================================================================
-- SECTION 10: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ==========================================================================
-- Enable RLS on all new tables
-- ==========================================================================
ALTER TABLE workflow_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_milestone_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_lead_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cutsheet_submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warning_emails_log ENABLE ROW LEVEL SECURITY;

-- ==========================================================================
-- workflow_stations - Read-only for all authenticated users
-- ==========================================================================
CREATE POLICY "workflow_stations_select" ON workflow_stations
  FOR SELECT USING (auth.role() = 'authenticated');

-- ==========================================================================
-- Project-linked tables - Use project access pattern
-- ==========================================================================

-- Helper function to check project access (if not already exists)
CREATE OR REPLACE FUNCTION user_has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = p_project_id
    AND (
      p.owner_id = auth.uid()
      OR p.primary_pm_id = auth.uid()
      OR p.backup_pm_id = auth.uid()
      OR p.coordinator_id = auth.uid()
      OR p.created_by = auth.uid()
      OR public.user_has_elevated_role()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check elevated role (if not already exists)
CREATE OR REPLACE FUNCTION user_has_elevated_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = auth.uid();
  RETURN user_role IN ('Director', 'VP', 'Admin', 'IT', 'Plant Manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- project_workflow_status policies
CREATE POLICY "project_workflow_status_select" ON project_workflow_status
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "project_workflow_status_insert" ON project_workflow_status
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "project_workflow_status_update" ON project_workflow_status
  FOR UPDATE USING (user_has_project_access(project_id));

CREATE POLICY "project_workflow_status_delete" ON project_workflow_status
  FOR DELETE USING (user_has_project_access(project_id));

-- drawing_versions policies
CREATE POLICY "drawing_versions_select" ON drawing_versions
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "drawing_versions_insert" ON drawing_versions
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "drawing_versions_update" ON drawing_versions
  FOR UPDATE USING (user_has_project_access(project_id));

CREATE POLICY "drawing_versions_delete" ON drawing_versions
  FOR DELETE USING (user_has_project_access(project_id));

-- engineering_reviews policies
CREATE POLICY "engineering_reviews_select" ON engineering_reviews
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "engineering_reviews_insert" ON engineering_reviews
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "engineering_reviews_update" ON engineering_reviews
  FOR UPDATE USING (user_has_project_access(project_id));

CREATE POLICY "engineering_reviews_delete" ON engineering_reviews
  FOR DELETE USING (user_has_project_access(project_id));

-- third_party_reviews policies
CREATE POLICY "third_party_reviews_select" ON third_party_reviews
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "third_party_reviews_insert" ON third_party_reviews
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "third_party_reviews_update" ON third_party_reviews
  FOR UPDATE USING (user_has_project_access(project_id));

CREATE POLICY "third_party_reviews_delete" ON third_party_reviews
  FOR DELETE USING (user_has_project_access(project_id));

-- state_approvals policies
CREATE POLICY "state_approvals_select" ON state_approvals
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "state_approvals_insert" ON state_approvals
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "state_approvals_update" ON state_approvals
  FOR UPDATE USING (user_has_project_access(project_id));

CREATE POLICY "state_approvals_delete" ON state_approvals
  FOR DELETE USING (user_has_project_access(project_id));

-- long_lead_items policies
CREATE POLICY "long_lead_items_select" ON long_lead_items
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "long_lead_items_insert" ON long_lead_items
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "long_lead_items_update" ON long_lead_items
  FOR UPDATE USING (user_has_project_access(project_id));

CREATE POLICY "long_lead_items_delete" ON long_lead_items
  FOR DELETE USING (user_has_project_access(project_id));

-- color_selections policies
CREATE POLICY "color_selections_select" ON color_selections
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "color_selections_insert" ON color_selections
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "color_selections_update" ON color_selections
  FOR UPDATE USING (user_has_project_access(project_id));

CREATE POLICY "color_selections_delete" ON color_selections
  FOR DELETE USING (user_has_project_access(project_id));

-- cutsheet_submittals policies
CREATE POLICY "cutsheet_submittals_select" ON cutsheet_submittals
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "cutsheet_submittals_insert" ON cutsheet_submittals
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "cutsheet_submittals_update" ON cutsheet_submittals
  FOR UPDATE USING (user_has_project_access(project_id));

CREATE POLICY "cutsheet_submittals_delete" ON cutsheet_submittals
  FOR DELETE USING (user_has_project_access(project_id));

-- change_orders policies
CREATE POLICY "change_orders_select" ON change_orders
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "change_orders_insert" ON change_orders
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "change_orders_update" ON change_orders
  FOR UPDATE USING (user_has_project_access(project_id));

CREATE POLICY "change_orders_delete" ON change_orders
  FOR DELETE USING (user_has_project_access(project_id));

-- change_order_items policies (through change_order)
CREATE POLICY "change_order_items_select" ON change_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM change_orders co
      WHERE co.id = change_order_items.change_order_id
      AND user_has_project_access(co.project_id)
    )
  );

CREATE POLICY "change_order_items_insert" ON change_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM change_orders co
      WHERE co.id = change_order_items.change_order_id
      AND user_has_project_access(co.project_id)
    )
  );

CREATE POLICY "change_order_items_update" ON change_order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM change_orders co
      WHERE co.id = change_order_items.change_order_id
      AND user_has_project_access(co.project_id)
    )
  );

CREATE POLICY "change_order_items_delete" ON change_order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM change_orders co
      WHERE co.id = change_order_items.change_order_id
      AND user_has_project_access(co.project_id)
    )
  );

-- warning_emails_log policies
CREATE POLICY "warning_emails_log_select" ON warning_emails_log
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "warning_emails_log_insert" ON warning_emails_log
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "warning_emails_log_update" ON warning_emails_log
  FOR UPDATE USING (user_has_project_access(project_id));

-- factory_milestone_templates policies (read for all, write for admin)
CREATE POLICY "factory_milestone_templates_select" ON factory_milestone_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "factory_milestone_templates_insert" ON factory_milestone_templates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'IT'))
  );

CREATE POLICY "factory_milestone_templates_update" ON factory_milestone_templates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'IT'))
  );

-- ============================================================================
-- SECTION 11: HELPFUL VIEWS (OPTIONAL)
-- ============================================================================

-- View for project workflow summary
CREATE OR REPLACE VIEW project_workflow_summary AS
SELECT
  p.id AS project_id,
  p.project_number,
  p.name AS project_name,
  COUNT(DISTINCT pws.station_key) AS total_stations,
  COUNT(DISTINCT CASE WHEN pws.status = 'completed' THEN pws.station_key END) AS completed_stations,
  COUNT(DISTINCT CASE WHEN pws.status = 'in_progress' THEN pws.station_key END) AS in_progress_stations,
  COUNT(DISTINCT CASE WHEN pws.status = 'awaiting_response' THEN pws.station_key END) AS awaiting_stations,
  MIN(CASE WHEN pws.status NOT IN ('completed', 'skipped') THEN pws.earliest_deadline END) AS next_deadline
FROM projects p
LEFT JOIN project_workflow_status pws ON p.id = pws.project_id
GROUP BY p.id, p.project_number, p.name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Final summary
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WORKFLOW SYSTEM MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'New tables created: 13';
  RAISE NOTICE 'Existing tables modified: 3 (tasks, milestones, projects)';
  RAISE NOTICE 'Workflow stations seeded: 21';
  RAISE NOTICE 'RLS policies created: 50+';
  RAISE NOTICE '========================================';
END $$;
