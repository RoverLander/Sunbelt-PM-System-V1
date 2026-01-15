-- ============================================================================
-- Plant General Manager (PGM) System Migration
-- ============================================================================
-- Creates the database schema for the Plant General Manager dashboard feature
-- including modules, production stations, worker shifts, QC records, and more.
--
-- Based on: docs/PLANT_MANAGER_ROADMAP
-- Build Batch: 1 (Schemas + RLS + Basic Calendar + Sim Mode foundations)
--
-- Created: January 15, 2026
-- ============================================================================

-- ============================================================================
-- 0. CLEANUP: Drop tables for idempotent re-runs
-- ============================================================================
-- Drop in reverse dependency order to avoid FK conflicts
-- This ensures clean re-runs of the migration

-- Drop FK constraints first
ALTER TABLE IF EXISTS qc_records DROP CONSTRAINT IF EXISTS fk_qc_records_rework_task;
ALTER TABLE IF EXISTS long_lead_items DROP CONSTRAINT IF EXISTS fk_long_lead_items_task;
ALTER TABLE IF EXISTS modules DROP CONSTRAINT IF EXISTS fk_modules_current_station;

-- Drop all PGM tables
DROP TABLE IF EXISTS five_s_audits CASCADE;
DROP TABLE IF EXISTS safety_checks CASCADE;
DROP TABLE IF EXISTS cross_training CASCADE;
DROP TABLE IF EXISTS kaizen_suggestions CASCADE;
DROP TABLE IF EXISTS takt_events CASCADE;
DROP TABLE IF EXISTS calendar_audit CASCADE;
DROP TABLE IF EXISTS plant_config CASCADE;
DROP TABLE IF EXISTS long_lead_items CASCADE;
DROP TABLE IF EXISTS inspection_rules CASCADE;
DROP TABLE IF EXISTS qc_records CASCADE;
DROP TABLE IF EXISTS worker_shifts CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS station_assignments CASCADE;
DROP TABLE IF EXISTS station_templates CASCADE;
DROP TABLE IF EXISTS modules CASCADE;

-- ============================================================================
-- 1. ADD PLANT_GM ROLE TO USERS
-- ============================================================================
-- Note: The role column is VARCHAR(30), so we just need to ensure Plant_GM
-- is accepted. The app validates roles, so we add a comment for documentation.

COMMENT ON COLUMN users.role IS
  'Roles: VP, Director, PM, PC, IT, IT_Manager, Admin, Sales_Manager, Sales_Rep, Plant_GM, Production_Manager';

-- ============================================================================
-- 2. MODULES TABLE
-- ============================================================================
-- Each project consists of X modules that the factory builds.
-- This is the core tracking unit for production.

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,

  -- Identification
  serial_number VARCHAR(50) NOT NULL, -- e.g., 'MOD-001', 'NWBS-25250-M1'
  name VARCHAR(100), -- Optional friendly name
  sequence_number INTEGER NOT NULL DEFAULT 1, -- Module 1 of 4, etc.

  -- Status tracking
  status VARCHAR(30) NOT NULL DEFAULT 'Not Started',
  -- Statuses: Not Started, In Queue, In Progress, QC Hold, Rework, Completed, Staged, Shipped

  -- Current location
  current_station_id UUID, -- FK added after station_templates created

  -- Scheduling (for calendar)
  scheduled_start DATE,
  scheduled_end DATE,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,

  -- Building specs (can override project defaults)
  module_width INTEGER,
  module_length INTEGER,
  module_height INTEGER,
  square_footage INTEGER GENERATED ALWAYS AS (module_width * module_length) STORED,

  -- Special flags
  is_rush BOOLEAN DEFAULT false,
  special_requirements JSONB DEFAULT '[]', -- Array of requirement tags
  building_category VARCHAR(30), -- stock, fleet, government, custom (from project)

  -- Long-lead tracking
  long_leads JSONB DEFAULT '[]', -- Array of {part_name, lead_days, ordered, eta}

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Constraints
  UNIQUE(project_id, serial_number),
  UNIQUE(project_id, sequence_number)
);

-- Indexes
CREATE INDEX idx_modules_project ON modules(project_id);
CREATE INDEX idx_modules_factory ON modules(factory_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_scheduled_start ON modules(scheduled_start);
CREATE INDEX idx_modules_current_station ON modules(current_station_id);

-- ============================================================================
-- 3. STATION TEMPLATES TABLE
-- ============================================================================
-- The 12 production line stages. These are factory-configurable.

CREATE TABLE station_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,

  -- Station definition
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30) NOT NULL, -- e.g., 'FRAME', 'ROUGH_CARP', 'EXT_SIDING'
  description TEXT,
  order_num INTEGER NOT NULL, -- Sequence in production line (1-12+)

  -- Configuration
  is_active BOOLEAN DEFAULT true,
  requires_inspection BOOLEAN DEFAULT false,
  is_inspection_station BOOLEAN DEFAULT false, -- True for inspection-only stations

  -- Duration defaults (hours) by building category
  duration_defaults JSONB DEFAULT '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',

  -- QC checklist for this station
  checklist JSONB DEFAULT '[]', -- [{"q": "Square within tolerance?", "type": "bool"}, ...]

  -- Crew requirements
  min_crew_size INTEGER DEFAULT 1,
  max_crew_size INTEGER DEFAULT 10,
  recommended_crew_size INTEGER DEFAULT 3,

  -- Display
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color for UI
  icon VARCHAR(50), -- Icon name for display

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(factory_id, code)
);

-- Indexes
CREATE INDEX idx_station_templates_factory ON station_templates(factory_id);
CREATE INDEX idx_station_templates_order ON station_templates(order_num);

-- Add FK constraint to modules now that station_templates exists
ALTER TABLE modules
  ADD CONSTRAINT fk_modules_current_station
  FOREIGN KEY (current_station_id) REFERENCES station_templates(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. STATION ASSIGNMENTS TABLE
-- ============================================================================
-- Tracks which modules are at which stations, with crew assignments.

CREATE TABLE station_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES station_templates(id) ON DELETE CASCADE,
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,

  -- Lead and crew
  lead_id UUID REFERENCES users(id) ON DELETE SET NULL,
  crew_ids UUID[] DEFAULT '{}', -- Array of user IDs

  -- Timing
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  estimated_hours NUMERIC(5,2),
  actual_hours NUMERIC(5,2),

  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  -- Statuses: Pending, In Progress, QC Pending, Passed, Failed, Rework, Completed

  -- QC results
  qc_passed BOOLEAN,
  qc_notes TEXT,
  qc_checked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  qc_checked_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate active assignments
  UNIQUE(module_id, station_id)
);

-- Indexes
CREATE INDEX idx_station_assignments_module ON station_assignments(module_id);
CREATE INDEX idx_station_assignments_station ON station_assignments(station_id);
CREATE INDEX idx_station_assignments_lead ON station_assignments(lead_id);
CREATE INDEX idx_station_assignments_status ON station_assignments(status);
CREATE INDEX idx_station_assignments_factory ON station_assignments(factory_id);

-- ============================================================================
-- 5. WORKERS TABLE
-- ============================================================================
-- Factory floor workers (not system users, but workforce tracking)

CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,

  -- Identity
  employee_id VARCHAR(30) NOT NULL, -- Badge number or employee ID
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  full_name VARCHAR(100) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,

  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),

  -- Role/Position
  title VARCHAR(50), -- e.g., 'Welder', 'Carpenter', 'Electrician'
  primary_station_id UUID REFERENCES station_templates(id) ON DELETE SET NULL,
  is_lead BOOLEAN DEFAULT false,
  reports_to UUID REFERENCES workers(id) ON DELETE SET NULL,

  -- Pay rates (for shift calculations)
  hourly_rate NUMERIC(8,2),
  ot_multiplier NUMERIC(4,2) DEFAULT 1.5,
  double_time_multiplier NUMERIC(4,2) DEFAULT 2.0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  hire_date DATE,
  termination_date DATE,

  -- Certifications (for cross-training matrix)
  certifications JSONB DEFAULT '[]', -- [{station_id, certified_at, expires_at}]

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(factory_id, employee_id)
);

-- Indexes
CREATE INDEX idx_workers_factory ON workers(factory_id);
CREATE INDEX idx_workers_station ON workers(primary_station_id);
CREATE INDEX idx_workers_active ON workers(is_active);
CREATE INDEX idx_workers_name ON workers(full_name);

-- ============================================================================
-- 6. WORKER SHIFTS TABLE
-- ============================================================================
-- Clock in/out tracking for factory workers

CREATE TABLE worker_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,

  -- Clock times
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,

  -- Source of clock action
  source VARCHAR(20) DEFAULT 'kiosk', -- kiosk, app, manual, import

  -- Calculated hours (computed on clock_out or daily)
  hours_regular NUMERIC(5,2),
  hours_ot NUMERIC(5,2),
  hours_double NUMERIC(5,2),
  total_hours NUMERIC(5,2),

  -- Pay calculation
  rate_applied NUMERIC(8,2),
  total_pay NUMERIC(10,2),

  -- Assignment during shift
  station_id UUID REFERENCES station_templates(id) ON DELETE SET NULL,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,

  -- Status/Flags
  status VARCHAR(20) DEFAULT 'active', -- active, completed, adjusted, voided
  flags JSONB DEFAULT '[]', -- [{type: 'late', time: '08:15', note: '...'}, ...]

  -- Notes
  notes TEXT,
  adjusted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  adjusted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_worker_shifts_worker ON worker_shifts(worker_id);
CREATE INDEX idx_worker_shifts_factory ON worker_shifts(factory_id);
CREATE INDEX idx_worker_shifts_clock_in ON worker_shifts(clock_in);
CREATE INDEX idx_worker_shifts_status ON worker_shifts(status);

-- ============================================================================
-- 7. QC RECORDS TABLE
-- ============================================================================
-- Quality control inspection records

CREATE TABLE qc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES station_templates(id) ON DELETE CASCADE,
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,

  -- Inspector
  inspector_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  inspector_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- If done by system user

  -- Results
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  -- Statuses: Pending, Passed, Failed, Rework Required, Re-inspected

  passed BOOLEAN,
  score INTEGER, -- Optional numerical score (0-100)

  -- Checklist results
  checklist_results JSONB DEFAULT '[]', -- [{q: '...', passed: true, note: '...'}]

  -- Evidence
  photo_urls TEXT[] DEFAULT '{}', -- Array of storage URLs

  -- Notes
  notes TEXT,
  defects_found JSONB DEFAULT '[]', -- [{type: 'crack', location: 'corner', severity: 'minor'}]

  -- Follow-up
  rework_required BOOLEAN DEFAULT false,
  rework_task_id UUID, -- FK to tasks added below if table exists
  re_inspection_date DATE,

  -- Timestamps
  inspected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK to tasks if tasks table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    ALTER TABLE qc_records
      ADD CONSTRAINT fk_qc_records_rework_task
      FOREIGN KEY (rework_task_id) REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists, ignore
  NULL;
END $$;

-- Indexes
CREATE INDEX idx_qc_records_module ON qc_records(module_id);
CREATE INDEX idx_qc_records_station ON qc_records(station_id);
CREATE INDEX idx_qc_records_factory ON qc_records(factory_id);
CREATE INDEX idx_qc_records_status ON qc_records(status);
CREATE INDEX idx_qc_records_inspected_at ON qc_records(inspected_at);

-- ============================================================================
-- 8. INSPECTION RULES TABLE
-- ============================================================================
-- Configurable inspection requirements per project/station

CREATE TABLE inspection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- Optional, for project-specific
  station_id UUID REFERENCES station_templates(id) ON DELETE CASCADE,

  -- Rule definition
  inspection_type VARCHAR(50) NOT NULL, -- 'in-wall', 'final', 'state', 'third-party'
  inspector_type VARCHAR(50), -- 'internal', 'state', 'third-party'
  inspector_name VARCHAR(100), -- Default inspector name

  -- Timing
  due_offset_days INTEGER DEFAULT 0, -- Days after station completion
  is_required BOOLEAN DEFAULT true,

  -- Building category filter
  applies_to_categories JSONB DEFAULT '["stock", "fleet", "government", "custom"]',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inspection_rules_factory ON inspection_rules(factory_id);
CREATE INDEX idx_inspection_rules_station ON inspection_rules(station_id);

-- ============================================================================
-- 9. LONG LEAD ITEMS TABLE
-- ============================================================================
-- Tracking for long-lead material items

CREATE TABLE long_lead_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,

  -- Item details
  part_name VARCHAR(100) NOT NULL,
  part_number VARCHAR(50),
  vendor VARCHAR(100),
  lead_days INTEGER NOT NULL, -- Expected lead time in days

  -- Status tracking
  status VARCHAR(30) DEFAULT 'Identified',
  -- Statuses: Identified, Approval Pending, Approved, Ordered, Shipped, Received, Verified

  ordered BOOLEAN DEFAULT false,
  ordered_at TIMESTAMPTZ,
  ordered_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Dates
  expected_date DATE,
  verified_eta DATE, -- Confirmed with supplier
  received_date DATE,

  -- Related task
  task_id UUID, -- FK to tasks added below if table exists

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK to tasks if tasks table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    ALTER TABLE long_lead_items
      ADD CONSTRAINT fk_long_lead_items_task
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists, ignore
  NULL;
END $$;

-- Indexes
CREATE INDEX idx_long_lead_items_module ON long_lead_items(module_id);
CREATE INDEX idx_long_lead_items_project ON long_lead_items(project_id);
CREATE INDEX idx_long_lead_items_status ON long_lead_items(status);
CREATE INDEX idx_long_lead_items_factory ON long_lead_items(factory_id);

-- ============================================================================
-- 10. PLANT CONFIG TABLE
-- ============================================================================
-- Per-plant configuration settings

CREATE TABLE plant_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,

  -- Time/Pay settings
  time_settings JSONB DEFAULT '{
    "shift_start": "06:00",
    "shift_end": "14:30",
    "break_minutes": 30,
    "lunch_minutes": 30,
    "ot_threshold_daily": 8,
    "ot_threshold_weekly": 40,
    "double_time_threshold": 12
  }',

  -- Efficiency modules toggles
  efficiency_modules JSONB DEFAULT '{
    "takt_time_tracker": false,
    "queue_time_monitor": false,
    "kaizen_board": false,
    "defect_fix_timer": false,
    "material_flow_trace": false,
    "crew_utilization_heatmap": false,
    "line_balancing_sim": false,
    "visual_load_board": false,
    "five_s_audit": false,
    "oee_calculator": false,
    "cross_training_matrix": false,
    "safety_micro_check": false
  }',

  -- Line simulation defaults
  line_sim_defaults JSONB DEFAULT '{
    "target_throughput_per_day": 2,
    "max_wip_per_station": 3,
    "bottleneck_threshold_hours": 4
  }',

  -- VP/reporting settings
  vp_settings JSONB DEFAULT '{
    "weight_in_aggregate": 1.0,
    "target_oee": 0.75,
    "target_on_time_delivery": 0.90
  }',

  -- Calendar settings
  calendar_settings JSONB DEFAULT '{
    "work_days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "holidays": [],
    "auto_schedule_enabled": false
  }',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One config per factory
  UNIQUE(factory_id)
);

-- Indexes
CREATE INDEX idx_plant_config_factory ON plant_config(factory_id);

-- ============================================================================
-- 11. CALENDAR AUDIT LOG TABLE
-- ============================================================================
-- Audit trail for calendar/schedule changes

CREATE TABLE calendar_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,

  -- Action details
  action VARCHAR(50) NOT NULL, -- 'schedule_update', 'sim_publish', 'module_move', etc.
  entity_type VARCHAR(30), -- 'module', 'station', 'assignment'
  entity_id UUID,

  -- Change data
  old_data JSONB,
  new_data JSONB,

  -- Who/When
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  notes TEXT,
  from_simulation BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_calendar_audit_factory ON calendar_audit(factory_id);
CREATE INDEX idx_calendar_audit_action ON calendar_audit(action);
CREATE INDEX idx_calendar_audit_created ON calendar_audit(created_at);

-- ============================================================================
-- 12. TAKT EVENTS TABLE (Efficiency Toolkit)
-- ============================================================================
-- Tracks actual vs expected takt time per station

CREATE TABLE takt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES station_templates(id) ON DELETE CASCADE,
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,

  -- Timing
  expected_hours NUMERIC(5,2) NOT NULL,
  actual_hours NUMERIC(5,2),
  gap_percent NUMERIC(5,2), -- (actual - expected) / expected * 100

  -- Flags
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason VARCHAR(100), -- 'over_threshold', 'major_delay', etc.

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_takt_events_module ON takt_events(module_id);
CREATE INDEX idx_takt_events_station ON takt_events(station_id);
CREATE INDEX idx_takt_events_factory ON takt_events(factory_id);
CREATE INDEX idx_takt_events_flagged ON takt_events(is_flagged);

-- ============================================================================
-- 13. KAIZEN SUGGESTIONS TABLE (Efficiency Toolkit)
-- ============================================================================
-- Employee improvement suggestions

CREATE TABLE kaizen_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,

  -- Submitter (can be anonymous)
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,

  -- Suggestion content
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'safety', 'efficiency', 'quality', 'cost', 'other'
  station_id UUID REFERENCES station_templates(id) ON DELETE SET NULL,

  -- Evidence
  photo_urls TEXT[] DEFAULT '{}',

  -- Review status
  status VARCHAR(30) DEFAULT 'Submitted',
  -- Statuses: Submitted, Under Review, Approved, Implemented, Rejected

  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Rewards
  bonus_amount NUMERIC(8,2),
  estimated_savings NUMERIC(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kaizen_factory ON kaizen_suggestions(factory_id);
CREATE INDEX idx_kaizen_status ON kaizen_suggestions(status);
CREATE INDEX idx_kaizen_category ON kaizen_suggestions(category);

-- ============================================================================
-- 14. CROSS TRAINING MATRIX TABLE (Efficiency Toolkit)
-- ============================================================================
-- Worker certifications for cross-training

CREATE TABLE cross_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES station_templates(id) ON DELETE CASCADE,
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,

  -- Certification
  certified_at DATE NOT NULL,
  expires_at DATE,
  certified_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Proficiency level
  proficiency_level VARCHAR(20) DEFAULT 'Basic', -- Basic, Intermediate, Expert

  -- Performance metrics at this station
  avg_completion_hours NUMERIC(5,2),
  rework_rate NUMERIC(5,2), -- Percentage

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One certification per worker per station
  UNIQUE(worker_id, station_id)
);

-- Indexes
CREATE INDEX idx_cross_training_worker ON cross_training(worker_id);
CREATE INDEX idx_cross_training_station ON cross_training(station_id);
CREATE INDEX idx_cross_training_factory ON cross_training(factory_id);

-- ============================================================================
-- 15. SAFETY CHECKS TABLE (Efficiency Toolkit)
-- ============================================================================
-- Daily safety micro-checks

CREATE TABLE safety_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES station_templates(id) ON DELETE CASCADE,

  -- Who checked
  lead_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  lead_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Check result
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_clear BOOLEAN NOT NULL,

  -- If not clear
  delay_minutes INTEGER,
  issue_reason VARCHAR(200),
  photo_url TEXT,

  -- Timestamps
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One check per station per day
  UNIQUE(station_id, check_date)
);

-- Indexes
CREATE INDEX idx_safety_checks_factory ON safety_checks(factory_id);
CREATE INDEX idx_safety_checks_station ON safety_checks(station_id);
CREATE INDEX idx_safety_checks_date ON safety_checks(check_date);

-- ============================================================================
-- 16. FIVE S AUDITS TABLE (Efficiency Toolkit)
-- ============================================================================
-- 5S workplace organization audits

CREATE TABLE five_s_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES station_templates(id) ON DELETE CASCADE,

  -- Auditor
  auditor_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  auditor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Audit date
  audit_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Scores (1-5 each)
  sort_score INTEGER CHECK (sort_score >= 1 AND sort_score <= 5),
  set_in_order_score INTEGER CHECK (set_in_order_score >= 1 AND set_in_order_score <= 5),
  shine_score INTEGER CHECK (shine_score >= 1 AND shine_score <= 5),
  standardize_score INTEGER CHECK (standardize_score >= 1 AND standardize_score <= 5),
  sustain_score INTEGER CHECK (sustain_score >= 1 AND sustain_score <= 5),
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(sort_score, 0) + COALESCE(set_in_order_score, 0) +
    COALESCE(shine_score, 0) + COALESCE(standardize_score, 0) + COALESCE(sustain_score, 0)
  ) STORED,

  -- Evidence
  photo_urls TEXT[] DEFAULT '{}',
  notes TEXT,

  -- Follow-up
  next_audit_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_five_s_factory ON five_s_audits(factory_id);
CREATE INDEX idx_five_s_station ON five_s_audits(station_id);
CREATE INDEX idx_five_s_date ON five_s_audits(audit_date);

-- ============================================================================
-- 17. ADD TASK_TYPE TO TASKS TABLE
-- ============================================================================
-- Extend tasks table with production-specific task types

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS task_type VARCHAR(30) DEFAULT 'pm_task';
-- Types: pm_task, production, rework, long_lead_approval, long_lead_order, qc_followup, inspection

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS trigger_next VARCHAR(100);
-- For workflow automation: what to trigger when task completes

COMMENT ON COLUMN tasks.task_type IS
  'Task types: pm_task, production, rework, long_lead_approval, long_lead_order, qc_followup, inspection';

-- Index for filtering (use IF NOT EXISTS since tasks table persists)
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_lead_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE takt_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaizen_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE five_s_audits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - MODULES
-- ============================================================================

DROP POLICY IF EXISTS "modules_select_policy" ON modules;
DROP POLICY IF EXISTS "modules_insert_policy" ON modules;
DROP POLICY IF EXISTS "modules_update_policy" ON modules;
DROP POLICY IF EXISTS "modules_delete_policy" ON modules;

-- Anyone in the factory can view modules
CREATE POLICY "modules_select_policy" ON modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR u.factory_id = modules.factory_id
      )
    )
  );

-- Plant GM, Production Manager, and PM can insert
CREATE POLICY "modules_insert_policy" ON modules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('VP', 'Director', 'Plant_GM', 'Production_Manager', 'PM', 'Admin')
    )
  );

-- Plant GM and Production Manager can update
CREATE POLICY "modules_update_policy" ON modules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR (u.role IN ('Plant_GM', 'Production_Manager', 'PM') AND u.factory_id = modules.factory_id)
      )
    )
  );

-- Only Plant GM can delete
CREATE POLICY "modules_delete_policy" ON modules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR (u.role = 'Plant_GM' AND u.factory_id = modules.factory_id)
      )
    )
  );

-- ============================================================================
-- RLS POLICIES - STATION TEMPLATES
-- ============================================================================

DROP POLICY IF EXISTS "station_templates_select_policy" ON station_templates;
DROP POLICY IF EXISTS "station_templates_insert_policy" ON station_templates;
DROP POLICY IF EXISTS "station_templates_update_policy" ON station_templates;
DROP POLICY IF EXISTS "station_templates_delete_policy" ON station_templates;

-- Anyone can view station templates
CREATE POLICY "station_templates_select_policy" ON station_templates
  FOR SELECT
  USING (true);

-- Only Plant GM can modify station templates
CREATE POLICY "station_templates_insert_policy" ON station_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('VP', 'Director', 'Plant_GM', 'Admin')
    )
  );

CREATE POLICY "station_templates_update_policy" ON station_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR (u.role = 'Plant_GM' AND u.factory_id = station_templates.factory_id)
      )
    )
  );

CREATE POLICY "station_templates_delete_policy" ON station_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('VP', 'Director', 'Admin')
    )
  );

-- ============================================================================
-- RLS POLICIES - STATION ASSIGNMENTS
-- ============================================================================

DROP POLICY IF EXISTS "station_assignments_select_policy" ON station_assignments;
DROP POLICY IF EXISTS "station_assignments_insert_policy" ON station_assignments;
DROP POLICY IF EXISTS "station_assignments_update_policy" ON station_assignments;
DROP POLICY IF EXISTS "station_assignments_delete_policy" ON station_assignments;

CREATE POLICY "station_assignments_select_policy" ON station_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR u.factory_id = station_assignments.factory_id
      )
    )
  );

CREATE POLICY "station_assignments_insert_policy" ON station_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('VP', 'Director', 'Plant_GM', 'Production_Manager', 'Admin')
    )
  );

CREATE POLICY "station_assignments_update_policy" ON station_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR (u.role IN ('Plant_GM', 'Production_Manager') AND u.factory_id = station_assignments.factory_id)
      )
    )
  );

CREATE POLICY "station_assignments_delete_policy" ON station_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR (u.role IN ('Plant_GM', 'Production_Manager') AND u.factory_id = station_assignments.factory_id)
      )
    )
  );

-- ============================================================================
-- RLS POLICIES - WORKERS
-- ============================================================================

DROP POLICY IF EXISTS "workers_select_policy" ON workers;
DROP POLICY IF EXISTS "workers_insert_policy" ON workers;
DROP POLICY IF EXISTS "workers_update_policy" ON workers;
DROP POLICY IF EXISTS "workers_delete_policy" ON workers;

CREATE POLICY "workers_select_policy" ON workers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR u.factory_id = workers.factory_id
      )
    )
  );

-- HR, Plant GM can manage workers
CREATE POLICY "workers_insert_policy" ON workers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('VP', 'Director', 'Plant_GM', 'Admin')
    )
  );

CREATE POLICY "workers_update_policy" ON workers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR (u.role = 'Plant_GM' AND u.factory_id = workers.factory_id)
      )
    )
  );

CREATE POLICY "workers_delete_policy" ON workers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('VP', 'Director', 'Admin')
    )
  );

-- ============================================================================
-- RLS POLICIES - WORKER SHIFTS
-- ============================================================================

DROP POLICY IF EXISTS "worker_shifts_select_policy" ON worker_shifts;
DROP POLICY IF EXISTS "worker_shifts_insert_policy" ON worker_shifts;
DROP POLICY IF EXISTS "worker_shifts_update_policy" ON worker_shifts;
DROP POLICY IF EXISTS "worker_shifts_delete_policy" ON worker_shifts;

CREATE POLICY "worker_shifts_select_policy" ON worker_shifts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR u.factory_id = worker_shifts.factory_id
      )
    )
  );

CREATE POLICY "worker_shifts_insert_policy" ON worker_shifts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Plant_GM', 'Production_Manager', 'Admin')
        OR u.factory_id = worker_shifts.factory_id
      )
    )
  );

CREATE POLICY "worker_shifts_update_policy" ON worker_shifts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR (u.role IN ('Plant_GM', 'Production_Manager') AND u.factory_id = worker_shifts.factory_id)
      )
    )
  );

CREATE POLICY "worker_shifts_delete_policy" ON worker_shifts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('VP', 'Director', 'Admin')
    )
  );

-- ============================================================================
-- RLS POLICIES - QC RECORDS
-- ============================================================================

DROP POLICY IF EXISTS "qc_records_select_policy" ON qc_records;
DROP POLICY IF EXISTS "qc_records_insert_policy" ON qc_records;
DROP POLICY IF EXISTS "qc_records_update_policy" ON qc_records;

CREATE POLICY "qc_records_select_policy" ON qc_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR u.factory_id = qc_records.factory_id
      )
    )
  );

CREATE POLICY "qc_records_insert_policy" ON qc_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "qc_records_update_policy" ON qc_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Plant_GM', 'Production_Manager', 'Admin')
        OR u.factory_id = qc_records.factory_id
      )
    )
  );

-- ============================================================================
-- RLS POLICIES - PLANT CONFIG
-- ============================================================================

DROP POLICY IF EXISTS "plant_config_select_policy" ON plant_config;
DROP POLICY IF EXISTS "plant_config_insert_policy" ON plant_config;
DROP POLICY IF EXISTS "plant_config_update_policy" ON plant_config;

CREATE POLICY "plant_config_select_policy" ON plant_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR u.factory_id = plant_config.factory_id
      )
    )
  );

-- Only VP, Director, Plant GM can modify config
CREATE POLICY "plant_config_insert_policy" ON plant_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('VP', 'Director', 'Plant_GM', 'Admin')
    )
  );

CREATE POLICY "plant_config_update_policy" ON plant_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role IN ('VP', 'Director', 'Admin')
        OR (u.role = 'Plant_GM' AND u.factory_id = plant_config.factory_id)
      )
    )
  );

-- ============================================================================
-- RLS POLICIES - REMAINING TABLES (Simplified)
-- ============================================================================

-- Calendar Audit - Read only for factory, write for GM+
DROP POLICY IF EXISTS "calendar_audit_select_policy" ON calendar_audit;
CREATE POLICY "calendar_audit_select_policy" ON calendar_audit
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (
      u.role IN ('VP', 'Director', 'Admin') OR u.factory_id = calendar_audit.factory_id
    ))
  );

DROP POLICY IF EXISTS "calendar_audit_insert_policy" ON calendar_audit;
CREATE POLICY "calendar_audit_insert_policy" ON calendar_audit
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid())
  );

-- Inspection Rules
DROP POLICY IF EXISTS "inspection_rules_select_policy" ON inspection_rules;
CREATE POLICY "inspection_rules_select_policy" ON inspection_rules
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "inspection_rules_modify_policy" ON inspection_rules;
CREATE POLICY "inspection_rules_modify_policy" ON inspection_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('VP', 'Director', 'Plant_GM', 'Admin'))
  );

-- Long Lead Items
DROP POLICY IF EXISTS "long_lead_items_select_policy" ON long_lead_items;
CREATE POLICY "long_lead_items_select_policy" ON long_lead_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (
      u.role IN ('VP', 'Director', 'Admin') OR u.factory_id = long_lead_items.factory_id
    ))
  );

DROP POLICY IF EXISTS "long_lead_items_modify_policy" ON long_lead_items;
CREATE POLICY "long_lead_items_modify_policy" ON long_lead_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('VP', 'Director', 'Plant_GM', 'Production_Manager', 'PM', 'Admin'))
  );

-- Takt Events
DROP POLICY IF EXISTS "takt_events_select_policy" ON takt_events;
CREATE POLICY "takt_events_select_policy" ON takt_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (
      u.role IN ('VP', 'Director', 'Admin') OR u.factory_id = takt_events.factory_id
    ))
  );

DROP POLICY IF EXISTS "takt_events_insert_policy" ON takt_events;
CREATE POLICY "takt_events_insert_policy" ON takt_events
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()));

-- Kaizen Suggestions
DROP POLICY IF EXISTS "kaizen_select_policy" ON kaizen_suggestions;
CREATE POLICY "kaizen_select_policy" ON kaizen_suggestions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (
      u.role IN ('VP', 'Director', 'Admin') OR u.factory_id = kaizen_suggestions.factory_id
    ))
  );

DROP POLICY IF EXISTS "kaizen_insert_policy" ON kaizen_suggestions;
CREATE POLICY "kaizen_insert_policy" ON kaizen_suggestions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()));

DROP POLICY IF EXISTS "kaizen_update_policy" ON kaizen_suggestions;
CREATE POLICY "kaizen_update_policy" ON kaizen_suggestions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('VP', 'Director', 'Plant_GM', 'Production_Manager', 'Admin'))
  );

-- Cross Training
DROP POLICY IF EXISTS "cross_training_select_policy" ON cross_training;
CREATE POLICY "cross_training_select_policy" ON cross_training
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (
      u.role IN ('VP', 'Director', 'Admin') OR u.factory_id = cross_training.factory_id
    ))
  );

DROP POLICY IF EXISTS "cross_training_modify_policy" ON cross_training;
CREATE POLICY "cross_training_modify_policy" ON cross_training
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('VP', 'Director', 'Plant_GM', 'Production_Manager', 'Admin'))
  );

-- Safety Checks
DROP POLICY IF EXISTS "safety_checks_select_policy" ON safety_checks;
CREATE POLICY "safety_checks_select_policy" ON safety_checks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (
      u.role IN ('VP', 'Director', 'Admin') OR u.factory_id = safety_checks.factory_id
    ))
  );

DROP POLICY IF EXISTS "safety_checks_insert_policy" ON safety_checks;
CREATE POLICY "safety_checks_insert_policy" ON safety_checks
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()));

-- Five S Audits
DROP POLICY IF EXISTS "five_s_select_policy" ON five_s_audits;
CREATE POLICY "five_s_select_policy" ON five_s_audits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND (
      u.role IN ('VP', 'Director', 'Admin') OR u.factory_id = five_s_audits.factory_id
    ))
  );

DROP POLICY IF EXISTS "five_s_modify_policy" ON five_s_audits;
CREATE POLICY "five_s_modify_policy" ON five_s_audits
  FOR ALL USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()));

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all new tables
DROP TRIGGER IF EXISTS modules_updated_at ON modules;
CREATE TRIGGER modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS station_templates_updated_at ON station_templates;
CREATE TRIGGER station_templates_updated_at BEFORE UPDATE ON station_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS station_assignments_updated_at ON station_assignments;
CREATE TRIGGER station_assignments_updated_at BEFORE UPDATE ON station_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS workers_updated_at ON workers;
CREATE TRIGGER workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS worker_shifts_updated_at ON worker_shifts;
CREATE TRIGGER worker_shifts_updated_at BEFORE UPDATE ON worker_shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS qc_records_updated_at ON qc_records;
CREATE TRIGGER qc_records_updated_at BEFORE UPDATE ON qc_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS inspection_rules_updated_at ON inspection_rules;
CREATE TRIGGER inspection_rules_updated_at BEFORE UPDATE ON inspection_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS long_lead_items_updated_at ON long_lead_items;
CREATE TRIGGER long_lead_items_updated_at BEFORE UPDATE ON long_lead_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS plant_config_updated_at ON plant_config;
CREATE TRIGGER plant_config_updated_at BEFORE UPDATE ON plant_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS kaizen_updated_at ON kaizen_suggestions;
CREATE TRIGGER kaizen_updated_at BEFORE UPDATE ON kaizen_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS cross_training_updated_at ON cross_training;
CREATE TRIGGER cross_training_updated_at BEFORE UPDATE ON cross_training
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS five_s_updated_at ON five_s_audits;
CREATE TRIGGER five_s_updated_at BEFORE UPDATE ON five_s_audits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: DEFAULT STATION TEMPLATES
-- ============================================================================
-- Insert default 12 production stages (without factory_id for global template)

INSERT INTO station_templates (name, code, description, order_num, requires_inspection, is_inspection_station, color, duration_defaults, checklist)
VALUES
  ('Metal Frame Welding', 'FRAME_WELD', 'Heavy steel frame welding in off-line bay', 1, false, false, '#ef4444',
   '{"stock": 6.0, "fleet": 6.0, "government": 8.0, "custom": 10.0}',
   '[{"q": "Welds inspected visually?", "type": "bool"}, {"q": "Frame square within tolerance?", "type": "bool"}]'),

  ('Rough Carpentry', 'ROUGH_CARP', 'Walls, roof framing, studs, joists', 2, false, false, '#f97316',
   '{"stock": 8.0, "fleet": 8.0, "government": 10.0, "custom": 12.0}',
   '[{"q": "Studs plumb?", "type": "bool"}, {"q": "Headers properly sized?", "type": "bool"}]'),

  ('Exterior Siding/Sheathing', 'EXT_SIDING', 'Seal outside - sheathing and siding', 3, false, false, '#eab308',
   '{"stock": 6.0, "fleet": 6.0, "government": 8.0, "custom": 10.0}',
   '[{"q": "Weather barrier installed?", "type": "bool"}, {"q": "Siding secured properly?", "type": "bool"}]'),

  ('Interior Rough-out', 'INT_ROUGH', 'Insulation, vapor barrier, windows', 4, false, false, '#84cc16',
   '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',
   '[{"q": "Insulation R-value correct?", "type": "bool"}, {"q": "Vapor barrier sealed?", "type": "bool"}]'),

  ('Electrical Rough-in', 'ELEC_ROUGH', 'Electrical wiring and boxes', 5, true, false, '#22c55e',
   '{"stock": 6.0, "fleet": 6.0, "government": 8.0, "custom": 10.0}',
   '[{"q": "Wire gauge correct?", "type": "bool"}, {"q": "Boxes secured?", "type": "bool"}, {"q": "Circuits labeled?", "type": "bool"}]'),

  ('Plumbing Rough-in', 'PLUMB_ROUGH', 'Plumbing lines and fixtures rough-in', 6, true, false, '#14b8a6',
   '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',
   '[{"q": "Pressure test passed?", "type": "bool"}, {"q": "Proper slope on drains?", "type": "bool"}]'),

  ('HVAC Install', 'HVAC', 'HVAC system installation', 7, true, false, '#06b6d4',
   '{"stock": 4.0, "fleet": 4.0, "government": 6.0, "custom": 8.0}',
   '[{"q": "Ductwork sealed?", "type": "bool"}, {"q": "Unit properly mounted?", "type": "bool"}]'),

  ('In-Wall Inspection', 'INWALL_INSP', 'Configurable inspection after rough-in', 8, false, true, '#0ea5e9',
   '{"stock": 2.0, "fleet": 2.0, "government": 4.0, "custom": 4.0}',
   '[{"q": "Electrical inspection passed?", "type": "bool"}, {"q": "Plumbing inspection passed?", "type": "bool"}, {"q": "HVAC inspection passed?", "type": "bool"}]'),

  ('Interior Finish', 'INT_FINISH', 'Tape, mud, paint, flooring, trim', 9, false, false, '#6366f1',
   '{"stock": 10.0, "fleet": 10.0, "government": 12.0, "custom": 16.0}',
   '[{"q": "Drywall finish level acceptable?", "type": "bool"}, {"q": "Paint coverage complete?", "type": "bool"}, {"q": "Flooring installed correctly?", "type": "bool"}]'),

  ('Final State Inspection', 'FINAL_INSP', 'End of line state inspection', 10, false, true, '#8b5cf6',
   '{"stock": 2.0, "fleet": 2.0, "government": 4.0, "custom": 4.0}',
   '[{"q": "All systems operational?", "type": "bool"}, {"q": "Safety devices installed?", "type": "bool"}, {"q": "Documentation complete?", "type": "bool"}]'),

  ('Staging', 'STAGING', 'Pre-pickup staging area', 11, false, false, '#a855f7',
   '{"stock": 1.0, "fleet": 1.0, "government": 2.0, "custom": 2.0}',
   '[{"q": "Final clean complete?", "type": "bool"}, {"q": "Paperwork ready?", "type": "bool"}]'),

  ('Dealer Pickup', 'PICKUP', 'Ready for dealer transport', 12, false, false, '#ec4899',
   '{"stock": 0.5, "fleet": 0.5, "government": 1.0, "custom": 1.0}',
   '[{"q": "Bill of lading signed?", "type": "bool"}, {"q": "Photos taken?", "type": "bool"}]');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'modules', 'station_templates', 'station_assignments', 'workers',
    'worker_shifts', 'qc_records', 'inspection_rules', 'long_lead_items',
    'plant_config', 'calendar_audit', 'takt_events', 'kaizen_suggestions',
    'cross_training', 'safety_checks', 'five_s_audits'
  );

  IF table_count = 15 THEN
    RAISE NOTICE 'SUCCESS: All 15 PGM tables created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: Only % of 15 tables created', table_count;
  END IF;

  -- Verify station templates seeded
  IF EXISTS (SELECT 1 FROM station_templates WHERE code = 'FRAME_WELD') THEN
    RAISE NOTICE 'SUCCESS: Station templates seeded';
  ELSE
    RAISE NOTICE 'WARNING: Station templates not seeded';
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
