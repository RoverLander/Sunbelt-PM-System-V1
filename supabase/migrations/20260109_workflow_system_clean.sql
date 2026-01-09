-- ============================================================================
-- SUNBELT PM WORKFLOW SYSTEM - CLEAN MIGRATION
-- ============================================================================
-- Run this script to set up the complete workflow system.
-- This version handles dependencies correctly and cleans up existing tables.
--
-- Created: January 9, 2026
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEAN UP EXISTING TABLES (if any partial migrations exist)
-- ============================================================================
DROP TABLE IF EXISTS change_order_items CASCADE;
DROP TABLE IF EXISTS change_orders CASCADE;
DROP TABLE IF EXISTS warning_emails_log CASCADE;
DROP TABLE IF EXISTS color_selections CASCADE;
DROP TABLE IF EXISTS cutsheet_submittals CASCADE;
DROP TABLE IF EXISTS long_lead_items CASCADE;
DROP TABLE IF EXISTS state_approvals CASCADE;
DROP TABLE IF EXISTS third_party_reviews CASCADE;
DROP TABLE IF EXISTS engineering_reviews CASCADE;
DROP TABLE IF EXISTS drawing_versions CASCADE;
DROP TABLE IF EXISTS project_workflow_status CASCADE;
DROP TABLE IF EXISTS workflow_stations CASCADE;
DROP TABLE IF EXISTS factory_milestone_templates CASCADE;

-- ============================================================================
-- STEP 2: CREATE WORKFLOW STATIONS TABLE
-- ============================================================================
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

CREATE INDEX idx_workflow_stations_phase ON workflow_stations(phase);
CREATE INDEX idx_workflow_stations_key ON workflow_stations(station_key);

COMMENT ON TABLE workflow_stations IS 'Defines the workflow stations for post-sales process';
COMMENT ON COLUMN workflow_stations.phase IS '1=Initiation, 2=Dealer Sign-Offs, 3=Internal Approvals, 4=Delivery';

-- ============================================================================
-- STEP 3: SEED WORKFLOW STATIONS
-- ============================================================================
INSERT INTO workflow_stations (station_key, name, description, phase, display_order, default_owner, is_required) VALUES
  -- Phase 1: Initiation
  ('sales_handoff', 'Sales Handoff', 'Initial project handoff from sales to PM', 1, 1, 'pm', true),
  ('kickoff_meeting', 'Kickoff Meeting', 'Internal kickoff and planning meeting', 1, 2, 'pm', true),
  ('site_survey', 'Site Survey', 'Site survey and documentation', 1, 3, 'pm', false),

  -- Phase 2: Dealer Sign-Offs
  ('drawings_20', '20% Drawings', 'Preliminary layout drawings for dealer review', 2, 1, 'drafting', true),
  ('drawings_65', '65% Drawings', 'Design development drawings', 2, 2, 'drafting', true),
  ('drawings_95', '95% Drawings', 'Construction documents - near final', 2, 3, 'drafting', true),
  ('drawings_100', '100% Drawings', 'Final construction documents', 2, 4, 'drafting', true),
  ('color_selections', 'Color Selections', 'Dealer color and finish selections', 2, 5, 'dealer', true),
  ('long_lead_items', 'Long Lead Items', 'Equipment and materials with extended lead times', 2, 6, 'procurement', true),
  ('cutsheets', 'Cutsheet Submittals', 'Equipment cutsheet approvals', 2, 7, 'dealer', true),

  -- Phase 3: Internal Approvals
  ('engineering_review', 'Engineering Review', 'Internal engineering review and stamp', 3, 1, 'engineering', true),
  ('third_party_review', 'Third Party Review', 'Third party plan review (if required)', 3, 2, 'third_party', false),
  ('state_approval', 'State Approval', 'State modular approval (if required)', 3, 3, 'state', false),
  ('permit_submission', 'Permit Submission', 'Building permit submission', 3, 4, 'pm', false),
  ('change_orders', 'Change Orders', 'Process any change orders', 3, 5, 'pm', false),

  -- Phase 4: Factory & Delivery
  ('production_start', 'Production Start', 'Factory production begins', 4, 1, 'factory', true),
  ('qc_inspection', 'QC Inspection', 'Quality control inspection at factory', 4, 2, 'factory', true),
  ('delivery_scheduled', 'Delivery Scheduled', 'Delivery date confirmed', 4, 3, 'pm', true),
  ('delivery_complete', 'Delivery Complete', 'Units delivered to site', 4, 4, 'pm', true),
  ('set_complete', 'Set Complete', 'Units set on foundation', 4, 5, 'pm', true),
  ('project_closeout', 'Project Closeout', 'Final documentation and closeout', 4, 6, 'pm', true);

-- ============================================================================
-- STEP 4: CREATE PROJECT WORKFLOW STATUS TABLE
-- ============================================================================
CREATE TABLE project_workflow_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  station_key VARCHAR(50) REFERENCES workflow_stations(station_key),
  status VARCHAR(20) DEFAULT 'not_started',
  started_date DATE,
  completed_date DATE,
  deadline DATE,
  notes TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, station_key)
);

CREATE INDEX idx_project_workflow_project ON project_workflow_status(project_id);
CREATE INDEX idx_project_workflow_status ON project_workflow_status(status);

COMMENT ON TABLE project_workflow_status IS 'Tracks workflow station status per project';
COMMENT ON COLUMN project_workflow_status.status IS 'not_started, in_progress, awaiting_response, completed, skipped';

-- ============================================================================
-- STEP 5: CREATE FACTORY MILESTONE TEMPLATES TABLE
-- ============================================================================
CREATE TABLE factory_milestone_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  default_days_offset INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_factory_milestones_factory ON factory_milestone_templates(factory_id);

COMMENT ON TABLE factory_milestone_templates IS 'Factory-specific milestone templates';

-- ============================================================================
-- STEP 6: CREATE DRAWING VERSIONS TABLE
-- ============================================================================
CREATE TABLE drawing_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  drawing_percentage INTEGER NOT NULL CHECK (drawing_percentage IN (20, 65, 95, 100)),
  version_number INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(30) DEFAULT 'Draft',
  submitted_date DATE,
  response_date DATE,
  dealer_response VARCHAR(30),
  redline_notes TEXT,
  internal_notes TEXT,
  document_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, drawing_percentage, version_number)
);

CREATE INDEX idx_drawing_versions_project ON drawing_versions(project_id);
CREATE INDEX idx_drawing_versions_percentage ON drawing_versions(drawing_percentage);

COMMENT ON TABLE drawing_versions IS 'Tracks drawing submissions and dealer responses';
COMMENT ON COLUMN drawing_versions.dealer_response IS 'Approve, Approve with Redlines, Reject with Redlines, Reject';

-- ============================================================================
-- STEP 7: CREATE CHANGE ORDERS TABLE
-- ============================================================================
CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  change_order_number VARCHAR(20) NOT NULL,
  change_type VARCHAR(30) DEFAULT 'General',
  status VARCHAR(20) DEFAULT 'Draft',
  description TEXT,
  reason TEXT,
  submitted_date DATE,
  signed_date DATE,
  implemented_date DATE,
  total_amount NUMERIC(12,2) DEFAULT 0,
  document_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, change_order_number)
);

CREATE INDEX idx_change_orders_project ON change_orders(project_id);
CREATE INDEX idx_change_orders_status ON change_orders(status);

COMMENT ON TABLE change_orders IS 'Change order tracking for post-signoff modifications';
COMMENT ON COLUMN change_orders.change_type IS 'Redlines, General, Pricing';
COMMENT ON COLUMN change_orders.status IS 'Draft, Sent, Signed, Implemented, Rejected';

-- ============================================================================
-- STEP 8: CREATE CHANGE ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE change_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_order_id UUID REFERENCES change_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_change_order_items_co ON change_order_items(change_order_id);

COMMENT ON TABLE change_order_items IS 'Line items for change orders';

-- ============================================================================
-- STEP 9: CREATE ENGINEERING REVIEWS TABLE
-- ============================================================================
CREATE TABLE engineering_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  review_type VARCHAR(30) DEFAULT 'Internal',
  status VARCHAR(30) DEFAULT 'Pending',
  submitted_date DATE,
  completed_date DATE,
  reviewer_name VARCHAR(100),
  stamp_number VARCHAR(50),
  notes TEXT,
  document_url TEXT,
  change_order_id UUID REFERENCES change_orders(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engineering_reviews_project ON engineering_reviews(project_id);
CREATE INDEX idx_engineering_reviews_status ON engineering_reviews(status);

COMMENT ON TABLE engineering_reviews IS 'Engineering review tracking';

-- ============================================================================
-- STEP 10: CREATE THIRD PARTY REVIEWS TABLE
-- ============================================================================
CREATE TABLE third_party_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_company VARCHAR(100),
  reviewer_name VARCHAR(100),
  status VARCHAR(30) DEFAULT 'Pending',
  submitted_date DATE,
  completed_date DATE,
  review_comments TEXT,
  document_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_third_party_reviews_project ON third_party_reviews(project_id);
CREATE INDEX idx_third_party_reviews_status ON third_party_reviews(status);

COMMENT ON TABLE third_party_reviews IS 'Third party plan review tracking';

-- ============================================================================
-- STEP 11: CREATE STATE APPROVALS TABLE
-- ============================================================================
CREATE TABLE state_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  state_code VARCHAR(2) NOT NULL,
  approval_type VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Pending',
  submitted_date DATE,
  approved_date DATE,
  approval_number VARCHAR(50),
  notes TEXT,
  document_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_state_approvals_project ON state_approvals(project_id);
CREATE INDEX idx_state_approvals_status ON state_approvals(status);

COMMENT ON TABLE state_approvals IS 'State modular approval tracking';

-- ============================================================================
-- STEP 12: CREATE LONG LEAD ITEMS TABLE
-- ============================================================================
CREATE TABLE long_lead_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  description TEXT,
  manufacturer VARCHAR(100),
  model_number VARCHAR(100),
  supplier VARCHAR(100),
  lead_time_weeks INTEGER,
  order_date DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  status VARCHAR(30) DEFAULT 'Pending',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_long_lead_items_project ON long_lead_items(project_id);
CREATE INDEX idx_long_lead_items_status ON long_lead_items(status);

COMMENT ON TABLE long_lead_items IS 'Long lead item tracking';
COMMENT ON COLUMN long_lead_items.status IS 'Pending, Ordered, In Transit, Delivered, Delayed';

-- ============================================================================
-- STEP 13: CREATE COLOR SELECTIONS TABLE
-- ============================================================================
CREATE TABLE color_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  custom_category VARCHAR(100),
  color_name VARCHAR(100),
  color_code VARCHAR(50),
  manufacturer VARCHAR(100),
  product_line VARCHAR(100),
  status VARCHAR(30) DEFAULT 'Pending',
  submitted_date DATE,
  confirmed_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, category)
);

CREATE INDEX idx_color_selections_project ON color_selections(project_id);
CREATE INDEX idx_color_selections_status ON color_selections(status);

COMMENT ON TABLE color_selections IS 'Color and finish selections tracking';
COMMENT ON COLUMN color_selections.status IS 'Pending, Submitted, Confirmed';

-- ============================================================================
-- STEP 14: CREATE CUTSHEET SUBMITTALS TABLE
-- ============================================================================
CREATE TABLE cutsheet_submittals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  equipment_name VARCHAR(200) NOT NULL,
  manufacturer VARCHAR(100),
  model_number VARCHAR(100),
  status VARCHAR(30) DEFAULT 'Pending',
  submitted_date DATE,
  response_date DATE,
  dealer_response VARCHAR(30),
  notes TEXT,
  document_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cutsheet_submittals_project ON cutsheet_submittals(project_id);
CREATE INDEX idx_cutsheet_submittals_status ON cutsheet_submittals(status);

COMMENT ON TABLE cutsheet_submittals IS 'Equipment cutsheet submittal tracking';

-- ============================================================================
-- STEP 15: CREATE WARNING EMAILS LOG TABLE
-- ============================================================================
CREATE TABLE warning_emails_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(100),
  station_key VARCHAR(50) REFERENCES workflow_stations(station_key) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_warning_emails_project ON warning_emails_log(project_id);
CREATE INDEX idx_warning_emails_type ON warning_emails_log(email_type);

COMMENT ON TABLE warning_emails_log IS 'Log of warning emails sent for workflow delays';

-- ============================================================================
-- STEP 16: ADD WORKFLOW COLUMNS TO TASKS TABLE
-- ============================================================================
DO $$
BEGIN
  -- Add workflow_station_key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'workflow_station_key'
  ) THEN
    ALTER TABLE tasks ADD COLUMN workflow_station_key VARCHAR(50);
  END IF;

  -- Add assigned_court if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_court'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_court VARCHAR(30);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_workflow_station ON tasks(workflow_station_key);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_court ON tasks(assigned_court);

COMMENT ON COLUMN tasks.workflow_station_key IS 'Links task to a workflow station';
COMMENT ON COLUMN tasks.assigned_court IS 'Ball in court: dealer, drafting, pm, engineering, etc.';

-- ============================================================================
-- STEP 17: ADD WORKFLOW COLUMNS TO MILESTONES TABLE
-- ============================================================================
DO $$
BEGIN
  -- Add station_key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'milestones' AND column_name = 'station_key'
  ) THEN
    ALTER TABLE milestones ADD COLUMN station_key VARCHAR(50);
  END IF;

  -- Add is_factory_milestone if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'milestones' AND column_name = 'is_factory_milestone'
  ) THEN
    ALTER TABLE milestones ADD COLUMN is_factory_milestone BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- STEP 18: ADD WORKFLOW COLUMNS TO PROJECTS TABLE
-- ============================================================================
DO $$
BEGIN
  -- Add current_phase if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'current_phase'
  ) THEN
    ALTER TABLE projects ADD COLUMN current_phase INTEGER DEFAULT 1;
  END IF;

  -- Add workflow_started_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'workflow_started_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN workflow_started_at TIMESTAMPTZ;
  END IF;

  -- Add dealer_email if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'dealer_email'
  ) THEN
    ALTER TABLE projects ADD COLUMN dealer_email VARCHAR(255);
  END IF;

  -- Add dealer_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'dealer_name'
  ) THEN
    ALTER TABLE projects ADD COLUMN dealer_name VARCHAR(100);
  END IF;
END $$;

-- ============================================================================
-- STEP 19: MIGRATE TASK STATUSES
-- ============================================================================
-- Change 'On Hold' and 'Blocked' to 'Awaiting Response'
UPDATE tasks
SET status = 'Awaiting Response'
WHERE status IN ('On Hold', 'Blocked');

-- ============================================================================
-- STEP 20: ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE workflow_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_milestone_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_lead_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cutsheet_submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE warning_emails_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 21: CREATE RLS POLICIES
-- ============================================================================

-- Workflow stations - readable by all authenticated users
CREATE POLICY "workflow_stations_read_policy" ON workflow_stations
  FOR SELECT TO authenticated USING (true);

-- Project workflow status - users can see their project's workflow
CREATE POLICY "project_workflow_status_policy" ON project_workflow_status
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Factory milestone templates - readable by all authenticated
CREATE POLICY "factory_milestone_templates_policy" ON factory_milestone_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Drawing versions
CREATE POLICY "drawing_versions_policy" ON drawing_versions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Change orders
CREATE POLICY "change_orders_policy" ON change_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Change order items
CREATE POLICY "change_order_items_policy" ON change_order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Engineering reviews
CREATE POLICY "engineering_reviews_policy" ON engineering_reviews
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Third party reviews
CREATE POLICY "third_party_reviews_policy" ON third_party_reviews
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- State approvals
CREATE POLICY "state_approvals_policy" ON state_approvals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Long lead items
CREATE POLICY "long_lead_items_policy" ON long_lead_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Color selections
CREATE POLICY "color_selections_policy" ON color_selections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Cutsheet submittals
CREATE POLICY "cutsheet_submittals_policy" ON cutsheet_submittals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Warning emails log
CREATE POLICY "warning_emails_log_policy" ON warning_emails_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - 13 new tables created
-- - 21 workflow stations seeded
-- - Task statuses migrated (On Hold/Blocked → Awaiting Response)
-- - RLS enabled on all new tables
-- - Indexes created for performance
-- ============================================================================
