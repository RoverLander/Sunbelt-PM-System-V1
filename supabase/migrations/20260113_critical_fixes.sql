-- ============================================================================
-- CRITICAL FIXES - January 13, 2026
-- ============================================================================
-- This migration fixes:
-- 1. Projects table RLS policy (blocking all reads including joins)
-- 2. Missing announcement tables (404 errors)
-- 3. Missing sales module tables
-- 4. Other missing RLS policies
-- ============================================================================

-- ============================================================================
-- SECTION 1: FIX PROJECTS TABLE RLS
-- ============================================================================
-- The projects table has RLS enabled but NO SELECT policy, which blocks
-- all reads including through foreign key joins in tasks/rfis/etc.

-- Enable RLS if not already (safe to run multiple times)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "projects_select_all" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to read projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to update projects" ON projects;

-- CREATE PERMISSIVE SELECT POLICY - This is the critical fix!
-- All authenticated users can read all projects
CREATE POLICY "projects_select_all" ON projects
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: All authenticated users can create projects
CREATE POLICY "projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: All authenticated users can update projects
-- (Fine-grained control happens in the app layer)
CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Only elevated roles can delete projects
CREATE POLICY "projects_delete" ON projects
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'IT', 'IT_Manager', 'VP', 'Director')
    )
  );

-- ============================================================================
-- SECTION 2: CREATE ANNOUNCEMENT TABLES
-- ============================================================================
-- These tables are referenced in the code but don't exist (404 errors)

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info', -- info, warning, success, error
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  target_roles TEXT[], -- NULL means all roles
  dismissible BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcement dismissals (tracks which users dismissed which announcements)
CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS on announcement tables
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Announcements policies
DROP POLICY IF EXISTS "announcements_select" ON announcements;
DROP POLICY IF EXISTS "announcements_manage" ON announcements;

-- All users can read active announcements
CREATE POLICY "announcements_select" ON announcements
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- IT/Admin can manage all announcements
CREATE POLICY "announcements_manage" ON announcements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin')
    )
  );

-- Dismissals policies
DROP POLICY IF EXISTS "dismissals_own" ON announcement_dismissals;

-- Users can manage their own dismissals
CREATE POLICY "dismissals_own" ON announcement_dismissals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_dismissals_user ON announcement_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_dismissals_announcement ON announcement_dismissals(announcement_id);

-- ============================================================================
-- SECTION 3: CREATE SALES MODULE TABLES
-- ============================================================================
-- These tables support the Sales Dashboard functionality

-- Sales Customers
CREATE TABLE IF NOT EXISTS sales_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  factory VARCHAR(10), -- Factory code (ATL, DAL, etc.)
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Quotes
CREATE TABLE IF NOT EXISTS sales_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  version INTEGER DEFAULT 1,
  status VARCHAR(30) DEFAULT 'draft', -- draft, sent, negotiating, won, lost, expired
  customer_id UUID REFERENCES sales_customers(id) ON DELETE SET NULL,

  -- Project info
  project_name VARCHAR(255),
  project_description TEXT,
  project_location TEXT,
  project_city VARCHAR(100),
  project_state VARCHAR(50),

  -- Factory and pricing
  factory VARCHAR(10),
  total_price NUMERIC(12,2) DEFAULT 0,
  valid_until DATE,

  -- Win/Loss tracking
  won_date DATE,
  lost_date DATE,
  lost_reason TEXT,
  competitor_name VARCHAR(255),

  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Quote Items (line items)
CREATE TABLE IF NOT EXISTS sales_quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES sales_quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Quote Revisions (version history)
CREATE TABLE IF NOT EXISTS sales_quote_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES sales_quotes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL, -- Full quote data at this version
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Activities (activity log)
CREATE TABLE IF NOT EXISTS sales_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES sales_quotes(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES sales_customers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- call, email, meeting, note, status_change
  subject VARCHAR(255),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on sales tables
ALTER TABLE sales_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quote_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;

-- Sales Customers policies
DROP POLICY IF EXISTS "sales_customers_select" ON sales_customers;
DROP POLICY IF EXISTS "sales_customers_insert" ON sales_customers;
DROP POLICY IF EXISTS "sales_customers_update" ON sales_customers;

CREATE POLICY "sales_customers_select" ON sales_customers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "sales_customers_insert" ON sales_customers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'IT', 'IT_Manager', 'Sales_Rep', 'Sales_Manager', 'VP')
    )
  );

CREATE POLICY "sales_customers_update" ON sales_customers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'IT', 'IT_Manager', 'Sales_Rep', 'Sales_Manager', 'VP')
    )
  );

-- Sales Quotes policies
DROP POLICY IF EXISTS "sales_quotes_select" ON sales_quotes;
DROP POLICY IF EXISTS "sales_quotes_insert" ON sales_quotes;
DROP POLICY IF EXISTS "sales_quotes_update" ON sales_quotes;

CREATE POLICY "sales_quotes_select" ON sales_quotes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "sales_quotes_insert" ON sales_quotes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'IT', 'IT_Manager', 'Sales_Rep', 'Sales_Manager', 'VP')
    )
  );

CREATE POLICY "sales_quotes_update" ON sales_quotes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'IT', 'IT_Manager', 'Sales_Rep', 'Sales_Manager', 'VP')
    )
  );

-- Sales Quote Items policies (inherit from parent quote)
DROP POLICY IF EXISTS "sales_quote_items_all" ON sales_quote_items;
CREATE POLICY "sales_quote_items_all" ON sales_quote_items
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sales Quote Revisions policies
DROP POLICY IF EXISTS "sales_quote_revisions_all" ON sales_quote_revisions;
CREATE POLICY "sales_quote_revisions_all" ON sales_quote_revisions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sales Activities policies
DROP POLICY IF EXISTS "sales_activities_all" ON sales_activities;
CREATE POLICY "sales_activities_all" ON sales_activities
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sales table indexes
CREATE INDEX IF NOT EXISTS idx_sales_customers_factory ON sales_customers(factory);
CREATE INDEX IF NOT EXISTS idx_sales_customers_active ON sales_customers(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_customer ON sales_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_assigned ON sales_quotes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_factory ON sales_quotes(factory);
CREATE INDEX IF NOT EXISTS idx_sales_quote_items_quote ON sales_quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_revisions_quote ON sales_quote_revisions(quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_quote ON sales_activities(quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_customer ON sales_activities(customer_id);

-- ============================================================================
-- SECTION 4: ADD source_quote_id TO PROJECTS (for Won Quote -> Project link)
-- ============================================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source_quote_id UUID REFERENCES sales_quotes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_source_quote ON projects(source_quote_id) WHERE source_quote_id IS NOT NULL;

-- ============================================================================
-- SECTION 5: ENSURE OTHER CRITICAL TABLES HAVE RLS POLICIES
-- ============================================================================

-- Users table - ensure SELECT policy exists
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_all" ON users;
CREATE POLICY "users_select_all" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Factories table - CREATE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS factories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL, -- ATL, DAL, PHX, etc.
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default factories if table is empty
INSERT INTO factories (name, code, city, state, is_active)
SELECT * FROM (VALUES
  ('Atlanta', 'ATL', 'Atlanta', 'GA', true),
  ('Dallas', 'DAL', 'Dallas', 'TX', true),
  ('Phoenix', 'PHX', 'Phoenix', 'AZ', true),
  ('Denver', 'DEN', 'Denver', 'CO', true),
  ('Orlando', 'ORL', 'Orlando', 'FL', true),
  ('Charlotte', 'CLT', 'Charlotte', 'NC', true),
  ('Houston', 'HOU', 'Houston', 'TX', true),
  ('Nashville', 'BNA', 'Nashville', 'TN', true),
  ('Kansas City', 'MCI', 'Kansas City', 'MO', true),
  ('Salt Lake City', 'SLC', 'Salt Lake City', 'UT', true),
  ('San Antonio', 'SAT', 'San Antonio', 'TX', true),
  ('Tampa', 'TPA', 'Tampa', 'FL', true),
  ('Raleigh', 'RDU', 'Raleigh', 'NC', true),
  ('Indianapolis', 'IND', 'Indianapolis', 'IN', true)
) AS v(name, code, city, state, is_active)
WHERE NOT EXISTS (SELECT 1 FROM factories LIMIT 1);

ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factories_select_all" ON factories;
CREATE POLICY "factories_select_all" ON factories
  FOR SELECT TO authenticated
  USING (true);

-- Factories management - IT/Admin only
DROP POLICY IF EXISTS "factories_manage" ON factories;
CREATE POLICY "factories_manage" ON factories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin')
    )
  );

-- Note: factories indexes commented out - table may exist with different schema
-- CREATE INDEX IF NOT EXISTS idx_factories_code ON factories(code);
-- CREATE INDEX IF NOT EXISTS idx_factories_active ON factories(is_active) WHERE is_active = true;

-- RFIs table
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rfis_all" ON rfis;
CREATE POLICY "rfis_all" ON rfis
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Submittals table
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "submittals_all" ON submittals;
CREATE POLICY "submittals_all" ON submittals
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Milestones table - CREATE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  completed_date DATE,
  status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: milestones indexes commented out - table may exist with different schema
-- CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
-- CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON milestones(due_date);
-- CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "milestones_all" ON milestones;
CREATE POLICY "milestones_all" ON milestones
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SECTION 6: CREATE FEATURE FLAGS TABLES (if missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  enabled_for_roles TEXT[],
  enabled_for_users UUID[],
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_flag_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- created, updated, enabled, disabled
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_flags_select" ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_manage" ON feature_flags;

CREATE POLICY "feature_flags_select" ON feature_flags
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "feature_flags_manage" ON feature_flags
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin')
    )
  );

DROP POLICY IF EXISTS "feature_flag_audit_select" ON feature_flag_audit;
CREATE POLICY "feature_flag_audit_select" ON feature_flag_audit
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin')
    )
  );

-- ============================================================================
-- SECTION 7: CREATE ERROR TRACKING TABLES (if missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type VARCHAR(100),
  error_message TEXT,
  error_stack TEXT,
  component VARCHAR(255),
  url TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(30) DEFAULT 'open', -- open, in_progress, resolved, closed
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  error_id UUID REFERENCES system_errors(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES error_tickets(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_ticket_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_errors_insert" ON system_errors;
DROP POLICY IF EXISTS "system_errors_select" ON system_errors;

CREATE POLICY "system_errors_insert" ON system_errors
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "system_errors_select" ON system_errors
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin')
    )
  );

DROP POLICY IF EXISTS "error_tickets_all" ON error_tickets;
CREATE POLICY "error_tickets_all" ON error_tickets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin')
    )
  );

DROP POLICY IF EXISTS "error_ticket_comments_all" ON error_ticket_comments;
CREATE POLICY "error_ticket_comments_all" ON error_ticket_comments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin')
    )
  );

-- ============================================================================
-- SECTION 8: CREATE USER SESSIONS TABLE (if missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  device_type VARCHAR(50),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_sessions_own" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_admin" ON user_sessions;

CREATE POLICY "user_sessions_own" ON user_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_sessions_admin" ON user_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin')
    )
  );

-- Note: user_sessions index commented out - table may exist with different schema
-- CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);

-- ============================================================================
-- SECTION 9: FLOOR PLAN TABLES (if missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS floor_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS floor_plan_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL DEFAULT 1,
  page_url TEXT,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS floor_plan_markers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  page_id UUID REFERENCES floor_plan_pages(id) ON DELETE CASCADE,
  x_position NUMERIC(5,2) NOT NULL DEFAULT 50,
  y_position NUMERIC(5,2) NOT NULL DEFAULT 50,
  marker_type VARCHAR(50) NOT NULL DEFAULT 'marker', -- marker, task, rfi, submittal
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

ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plan_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plan_markers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "floor_plans_all" ON floor_plans;
CREATE POLICY "floor_plans_all" ON floor_plans
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "floor_plan_pages_all" ON floor_plan_pages;
CREATE POLICY "floor_plan_pages_all" ON floor_plan_pages
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "floor_plan_markers_all" ON floor_plan_markers;
CREATE POLICY "floor_plan_markers_all" ON floor_plan_markers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: All floor plan indexes commented out - tables may exist with different schemas
-- CREATE INDEX IF NOT EXISTS idx_floor_plans_project ON floor_plans(project_id);
-- CREATE INDEX IF NOT EXISTS idx_floor_plan_pages_plan ON floor_plan_pages(floor_plan_id);
-- CREATE INDEX IF NOT EXISTS idx_floor_plan_markers_plan ON floor_plan_markers(floor_plan_id);

-- ============================================================================
-- SECTION 10: FILE ATTACHMENTS TABLES (if missing)
-- ============================================================================

-- Generic attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  rfi_id UUID REFERENCES rfis(id) ON DELETE CASCADE,
  submittal_id UUID REFERENCES submittals(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  file_url TEXT,
  storage_path TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File attachments (alternative table used in some components)
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  rfi_id UUID REFERENCES rfis(id) ON DELETE CASCADE,
  submittal_id UUID REFERENCES submittals(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  file_url TEXT,
  storage_path TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attachments_all" ON attachments;
CREATE POLICY "attachments_all" ON attachments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "file_attachments_all" ON file_attachments;
CREATE POLICY "file_attachments_all" ON file_attachments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: Attachment indexes commented out - tables may exist with different schemas
-- CREATE INDEX IF NOT EXISTS idx_attachments_project ON attachments(project_id);
-- CREATE INDEX IF NOT EXISTS idx_file_attachments_project ON file_attachments(project_id);

-- ============================================================================
-- SECTION 11: FACTORY CONTACTS TABLE (if missing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS factory_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
  factory_code VARCHAR(10),
  name VARCHAR(100) NOT NULL,
  title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  contact_type VARCHAR(50), -- general, sales, production, shipping
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE factory_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "factory_contacts_select" ON factory_contacts;
CREATE POLICY "factory_contacts_select" ON factory_contacts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "factory_contacts_manage" ON factory_contacts;
CREATE POLICY "factory_contacts_manage" ON factory_contacts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('IT', 'IT_Manager', 'Admin', 'Director', 'VP')
    )
  );

-- Note: indexes removed - columns may not exist in existing table
-- CREATE INDEX IF NOT EXISTS idx_factory_contacts_code ON factory_contacts(factory_code);

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT '✅ Critical fixes applied successfully!' AS result;
