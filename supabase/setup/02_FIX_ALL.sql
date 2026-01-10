-- ============================================================================
-- MASTER FIX SCRIPT - Safe to run multiple times
-- ============================================================================
-- Run this AFTER 01_CHECK_STATUS.sql to fix any missing items.
-- Uses IF NOT EXISTS everywhere - won't break existing data.
-- ============================================================================


-- ============================================================================
-- SECTION 1: WORKFLOW TABLES
-- ============================================================================

-- Workflow Stations
CREATE TABLE IF NOT EXISTS workflow_stations (
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

-- Seed workflow stations if empty
INSERT INTO workflow_stations (station_key, name, description, phase, display_order, default_owner, is_required)
SELECT * FROM (VALUES
  ('sales_handoff', 'Sales Handoff', 'Initial project handoff from sales to PM', 1, 1, 'pm', true),
  ('kickoff_meeting', 'Kickoff Meeting', 'Internal kickoff and planning meeting', 1, 2, 'pm', true),
  ('site_survey', 'Site Survey', 'Site survey and documentation', 1, 3, 'pm', false),
  ('drawings_20', '20% Drawings', 'Preliminary layout drawings', 2, 1, 'drafting', true),
  ('drawings_65', '65% Drawings', 'Design development drawings', 2, 2, 'drafting', true),
  ('drawings_95', '95% Drawings', 'Construction documents - near final', 2, 3, 'drafting', true),
  ('drawings_100', '100% Drawings', 'Final construction documents', 2, 4, 'drafting', true),
  ('color_selections', 'Color Selections', 'Dealer color and finish selections', 2, 5, 'dealer', true),
  ('long_lead_items', 'Long Lead Items', 'Equipment with extended lead times', 2, 6, 'procurement', true),
  ('cutsheets', 'Cutsheet Submittals', 'Equipment cutsheet approvals', 2, 7, 'dealer', true),
  ('engineering_review', 'Engineering Review', 'Internal engineering review', 3, 1, 'engineering', true),
  ('third_party_review', 'Third Party Review', 'Third party plan review', 3, 2, 'third_party', false),
  ('state_approval', 'State Approval', 'State modular approval', 3, 3, 'state', false),
  ('permit_submission', 'Permit Submission', 'Building permit submission', 3, 4, 'pm', false),
  ('change_orders', 'Change Orders', 'Process any change orders', 3, 5, 'pm', false),
  ('production_start', 'Production Start', 'Factory production begins', 4, 1, 'factory', true),
  ('qc_inspection', 'QC Inspection', 'Quality control inspection', 4, 2, 'factory', true),
  ('delivery_scheduled', 'Delivery Scheduled', 'Delivery date confirmed', 4, 3, 'pm', true),
  ('delivery_complete', 'Delivery Complete', 'Units delivered to site', 4, 4, 'pm', true),
  ('set_complete', 'Set Complete', 'Units set on foundation', 4, 5, 'pm', true),
  ('project_closeout', 'Project Closeout', 'Final documentation', 4, 6, 'pm', true)
) AS v(station_key, name, description, phase, display_order, default_owner, is_required)
WHERE NOT EXISTS (SELECT 1 FROM workflow_stations LIMIT 1);

-- Project Workflow Status
CREATE TABLE IF NOT EXISTS project_workflow_status (
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

-- Change Orders
CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  change_order_number VARCHAR(20),
  co_number INTEGER,
  change_type VARCHAR(30) DEFAULT 'General',
  co_type VARCHAR(30),
  status VARCHAR(20) DEFAULT 'Draft',
  description TEXT,
  reason TEXT,
  notes TEXT,
  date DATE,
  submitted_date DATE,
  sent_date DATE,
  signed_date DATE,
  implemented_date DATE,
  total_amount NUMERIC(12,2) DEFAULT 0,
  document_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change Order Items
CREATE TABLE IF NOT EXISTS change_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_order_id UUID REFERENCES change_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) DEFAULT 0,
  price NUMERIC(12,2) DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Long Lead Items
CREATE TABLE IF NOT EXISTS long_lead_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  description TEXT,
  manufacturer VARCHAR(100),
  model_number VARCHAR(100),
  supplier VARCHAR(100),
  quantity INTEGER DEFAULT 1,
  lead_time_weeks INTEGER,
  has_cutsheet BOOLEAN DEFAULT false,
  cutsheet_url TEXT,
  cutsheet_name VARCHAR(255),
  order_date DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  submitted_date DATE,
  signoff_date DATE,
  status VARCHAR(30) DEFAULT 'Pending',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Color Selections
CREATE TABLE IF NOT EXISTS color_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  custom_category VARCHAR(100),
  item_name VARCHAR(200),
  color_name VARCHAR(100),
  color_code VARCHAR(50),
  manufacturer VARCHAR(100),
  product_line VARCHAR(100),
  cutsheet_url TEXT,
  cutsheet_name VARCHAR(255),
  is_non_stock BOOLEAN DEFAULT false,
  non_stock_verified BOOLEAN DEFAULT false,
  non_stock_lead_time VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Pending',
  submitted_date DATE,
  confirmed_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warning Emails Log
CREATE TABLE IF NOT EXISTS warning_emails_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(100),
  sent_to_emails TEXT[],
  email_subject VARCHAR(255),
  email_body TEXT,
  station_key VARCHAR(50),
  task_id UUID,
  sent_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(30) DEFAULT 'Sent',
  notes TEXT
);

-- Drawing Versions
CREATE TABLE IF NOT EXISTS drawing_versions (
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

-- Engineering Reviews
CREATE TABLE IF NOT EXISTS engineering_reviews (
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

-- Cutsheet Submittals
CREATE TABLE IF NOT EXISTS cutsheet_submittals (
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


-- ============================================================================
-- SECTION 2: PROJECT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entry_type VARCHAR(50) NOT NULL DEFAULT 'note',
  title VARCHAR(255),
  content TEXT,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- SECTION 3: FLOOR PLAN ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS floor_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  page_id UUID REFERENCES floor_plan_pages(id) ON DELETE CASCADE,
  x_position NUMERIC(5,2) NOT NULL DEFAULT 50,
  y_position NUMERIC(5,2) NOT NULL DEFAULT 50,
  item_type VARCHAR(50) NOT NULL DEFAULT 'marker',
  label VARCHAR(100),
  description TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  rfi_id UUID REFERENCES rfis(id) ON DELETE SET NULL,
  submittal_id UUID REFERENCES submittals(id) ON DELETE SET NULL,
  color VARCHAR(20) DEFAULT '#3b82f6',
  icon VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- SECTION 4: ADD MISSING COLUMNS (Safe - uses IF NOT EXISTS pattern)
-- ============================================================================

-- Projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_status VARCHAR(30) DEFAULT 'On Track';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workflow_started_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dealer_email VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dealer_name VARCHAR(100);

-- Change Orders - add new columns
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS co_number INTEGER;
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS co_type VARCHAR(30);
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS sent_date DATE;
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Change Order Items - add new columns
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE change_order_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Long Lead Items - add new columns
ALTER TABLE long_lead_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE long_lead_items ADD COLUMN IF NOT EXISTS has_cutsheet BOOLEAN DEFAULT false;
ALTER TABLE long_lead_items ADD COLUMN IF NOT EXISTS cutsheet_url TEXT;
ALTER TABLE long_lead_items ADD COLUMN IF NOT EXISTS cutsheet_name VARCHAR(255);
ALTER TABLE long_lead_items ADD COLUMN IF NOT EXISTS submitted_date DATE;
ALTER TABLE long_lead_items ADD COLUMN IF NOT EXISTS signoff_date DATE;

-- Color Selections - add new columns
ALTER TABLE color_selections ADD COLUMN IF NOT EXISTS item_name VARCHAR(200);
ALTER TABLE color_selections ADD COLUMN IF NOT EXISTS cutsheet_url TEXT;
ALTER TABLE color_selections ADD COLUMN IF NOT EXISTS cutsheet_name VARCHAR(255);
ALTER TABLE color_selections ADD COLUMN IF NOT EXISTS is_non_stock BOOLEAN DEFAULT false;
ALTER TABLE color_selections ADD COLUMN IF NOT EXISTS non_stock_verified BOOLEAN DEFAULT false;
ALTER TABLE color_selections ADD COLUMN IF NOT EXISTS non_stock_lead_time VARCHAR(50);

-- Warning Emails Log - add new columns
ALTER TABLE warning_emails_log ADD COLUMN IF NOT EXISTS sent_to_emails TEXT[];
ALTER TABLE warning_emails_log ADD COLUMN IF NOT EXISTS email_subject VARCHAR(255);
ALTER TABLE warning_emails_log ADD COLUMN IF NOT EXISTS email_body TEXT;
ALTER TABLE warning_emails_log ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Sent';

-- Tasks table - workflow columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_station_key VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_court VARCHAR(30);


-- ============================================================================
-- SECTION 5: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_project_logs_project ON project_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_date ON project_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_project_logs_type ON project_logs(entry_type);
CREATE INDEX IF NOT EXISTS idx_floor_plan_items_plan ON floor_plan_items(floor_plan_id);
CREATE INDEX IF NOT EXISTS idx_floor_plan_items_status ON floor_plan_items(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_project ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_co_number ON change_orders(co_number);
CREATE INDEX IF NOT EXISTS idx_long_lead_items_project ON long_lead_items(project_id);
CREATE INDEX IF NOT EXISTS idx_color_selections_project ON color_selections(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stations_phase ON workflow_stations(phase);


-- ============================================================================
-- SECTION 6: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE workflow_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_lead_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE warning_emails_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cutsheet_submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- SECTION 7: RLS POLICIES (Drop and recreate to avoid conflicts)
-- ============================================================================

-- Workflow stations - read only for all
DROP POLICY IF EXISTS "workflow_stations_read" ON workflow_stations;
CREATE POLICY "workflow_stations_read" ON workflow_stations FOR SELECT TO authenticated USING (true);

-- Project workflow status
DROP POLICY IF EXISTS "project_workflow_status_all" ON project_workflow_status;
CREATE POLICY "project_workflow_status_all" ON project_workflow_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Change orders
DROP POLICY IF EXISTS "change_orders_all" ON change_orders;
CREATE POLICY "change_orders_all" ON change_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Change order items
DROP POLICY IF EXISTS "change_order_items_all" ON change_order_items;
CREATE POLICY "change_order_items_all" ON change_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Long lead items
DROP POLICY IF EXISTS "long_lead_items_all" ON long_lead_items;
CREATE POLICY "long_lead_items_all" ON long_lead_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Color selections
DROP POLICY IF EXISTS "color_selections_all" ON color_selections;
CREATE POLICY "color_selections_all" ON color_selections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Warning emails log
DROP POLICY IF EXISTS "warning_emails_log_all" ON warning_emails_log;
CREATE POLICY "warning_emails_log_all" ON warning_emails_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Drawing versions
DROP POLICY IF EXISTS "drawing_versions_all" ON drawing_versions;
CREATE POLICY "drawing_versions_all" ON drawing_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Engineering reviews
DROP POLICY IF EXISTS "engineering_reviews_all" ON engineering_reviews;
CREATE POLICY "engineering_reviews_all" ON engineering_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Cutsheet submittals
DROP POLICY IF EXISTS "cutsheet_submittals_all" ON cutsheet_submittals;
CREATE POLICY "cutsheet_submittals_all" ON cutsheet_submittals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Project logs
DROP POLICY IF EXISTS "project_logs_all" ON project_logs;
CREATE POLICY "project_logs_all" ON project_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Floor plan items
DROP POLICY IF EXISTS "floor_plan_items_all" ON floor_plan_items;
CREATE POLICY "floor_plan_items_all" ON floor_plan_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks
DROP POLICY IF EXISTS "tasks_all" ON tasks;
CREATE POLICY "tasks_all" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================================
-- SECTION 8: AUTO-LOGGING TRIGGERS (Optional but recommended)
-- ============================================================================

-- Project status change trigger
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (project_id, user_id, entry_type, title, content)
    VALUES (NEW.id, auth.uid(), 'status_change', 'Project status changed',
      format('Status changed from %s to %s', COALESCE(OLD.status, 'None'), NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Task change trigger
CREATE OR REPLACE FUNCTION log_task_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_logs (project_id, user_id, entry_type, title, content)
    VALUES (NEW.project_id, auth.uid(), 'task_update', 'Task created', format('New task: %s', NEW.title));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (project_id, user_id, entry_type, title, content)
    VALUES (NEW.project_id, auth.uid(), 'task_update', 'Task status changed',
      format('Task "%s": %s → %s', NEW.title, COALESCE(OLD.status, 'None'), NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_log_project_status ON projects;
CREATE TRIGGER trigger_log_project_status
  AFTER UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION log_project_status_change();

DROP TRIGGER IF EXISTS trigger_log_task_change ON tasks;
CREATE TRIGGER trigger_log_task_change
  AFTER INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION log_task_change();


-- ============================================================================
-- SECTION 9: FIX DATA ISSUES
-- ============================================================================

-- Set owner_id to primary_pm_id where missing
UPDATE projects SET owner_id = primary_pm_id
WHERE owner_id IS NULL AND primary_pm_id IS NOT NULL;


-- ============================================================================
-- DONE!
-- ============================================================================

SELECT '✓ ALL FIXES APPLIED' AS result, 'Run 01_CHECK_STATUS.sql again to verify' AS next_step;
