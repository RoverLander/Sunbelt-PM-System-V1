-- ============================================================================
-- SUNBELT PM - MASTER MIGRATION FILE
-- ============================================================================
-- Date: January 10, 2026
-- Run this file to apply all pending migrations
--
-- MIGRATIONS INCLUDED:
-- 1. 20260110_schema_updates.sql - Column updates for workflow components
-- 2. 20260110_project_logs.sql - Project log/notes feature
--
-- INSTRUCTIONS:
-- Run this entire file in Supabase SQL Editor (Dashboard > SQL Editor)
-- Or run each migration file individually in order
-- ============================================================================

-- ============================================================================
-- PRE-CHECK: Show current table counts
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STARTING MIGRATION - Current State:';
  RAISE NOTICE '========================================';

  -- Check if project_logs exists
  SELECT COUNT(*) INTO v_count FROM information_schema.tables
  WHERE table_name = 'project_logs';
  IF v_count > 0 THEN
    RAISE NOTICE 'project_logs table: EXISTS';
  ELSE
    RAISE NOTICE 'project_logs table: WILL BE CREATED';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION 1: SCHEMA UPDATES
-- ============================================================================
-- Updates change_orders, change_order_items, long_lead_items,
-- color_selections, and warning_emails_log tables

-- CHANGE ORDERS TABLE
ALTER TABLE change_orders
ADD COLUMN IF NOT EXISTS co_number INTEGER,
ADD COLUMN IF NOT EXISTS co_type VARCHAR(30),
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS sent_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrate old data
UPDATE change_orders
SET
  co_number = COALESCE(NULLIF(REGEXP_REPLACE(change_order_number, '[^0-9]', '', 'g'), '')::INTEGER, 1),
  co_type = change_type,
  sent_date = submitted_date,
  notes = CONCAT_WS(E'\n\n', description, reason)
WHERE co_number IS NULL;

-- CHANGE ORDER ITEMS TABLE
ALTER TABLE change_order_items
ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

UPDATE change_order_items
SET
  price = COALESCE(total_price, 0),
  sort_order = COALESCE(display_order, 0)
WHERE price IS NULL OR price = 0;

-- LONG LEAD ITEMS TABLE
ALTER TABLE long_lead_items
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS has_cutsheet BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cutsheet_url TEXT,
ADD COLUMN IF NOT EXISTS cutsheet_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS submitted_date DATE,
ADD COLUMN IF NOT EXISTS signoff_date DATE;

-- COLOR SELECTIONS TABLE
ALTER TABLE color_selections
ADD COLUMN IF NOT EXISTS item_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS cutsheet_url TEXT,
ADD COLUMN IF NOT EXISTS cutsheet_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_non_stock BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS non_stock_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS non_stock_lead_time VARCHAR(50);

-- WARNING EMAILS LOG TABLE
ALTER TABLE warning_emails_log
ADD COLUMN IF NOT EXISTS sent_to_emails TEXT[],
ADD COLUMN IF NOT EXISTS email_subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_body TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Sent';

UPDATE warning_emails_log
SET
  sent_to_emails = ARRAY[recipient_email],
  email_body = notes,
  email_subject = CONCAT('Warning: ', REPLACE(email_type, '_', ' '))
WHERE sent_to_emails IS NULL AND recipient_email IS NOT NULL;

-- PROJECTS TABLE - Add health_status if missing
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS health_status VARCHAR(30) DEFAULT 'On Track';

-- ============================================================================
-- MIGRATION 2: PROJECT LOGS TABLE
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_logs_project ON project_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_user ON project_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_type ON project_logs(entry_type);
CREATE INDEX IF NOT EXISTS idx_project_logs_date ON project_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_project_logs_pinned ON project_logs(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_project_logs_created ON project_logs(created_at DESC);

-- Other indexes for new columns
CREATE INDEX IF NOT EXISTS idx_change_orders_co_number ON change_orders(co_number);
CREATE INDEX IF NOT EXISTS idx_long_lead_items_submitted ON long_lead_items(submitted_date);
CREATE INDEX IF NOT EXISTS idx_color_selections_non_stock ON color_selections(is_non_stock) WHERE is_non_stock = true;
CREATE INDEX IF NOT EXISTS idx_warning_emails_status ON warning_emails_log(status);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has access to a project
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
      OR user_has_elevated_role()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has elevated role
CREATE OR REPLACE FUNCTION user_has_elevated_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND LOWER(u.role) IN ('director', 'vp', 'admin', 'it')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS FOR PROJECT LOGS
-- ============================================================================

ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "project_logs_select" ON project_logs;
DROP POLICY IF EXISTS "project_logs_insert" ON project_logs;
DROP POLICY IF EXISTS "project_logs_update" ON project_logs;
DROP POLICY IF EXISTS "project_logs_delete" ON project_logs;

-- Create policies
CREATE POLICY "project_logs_select" ON project_logs
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY "project_logs_insert" ON project_logs
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "project_logs_update" ON project_logs
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_has_elevated_role()
  );

CREATE POLICY "project_logs_delete" ON project_logs
  FOR DELETE USING (
    (user_id = auth.uid() AND entry_type = 'note')
    OR user_has_elevated_role()
  );

-- ============================================================================
-- AUTO-LOGGING TRIGGERS
-- ============================================================================

-- Log project status changes
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (
      project_id, user_id, entry_type, title, content, metadata
    ) VALUES (
      NEW.id, auth.uid(), 'status_change', 'Project status changed',
      format('Status changed from %s to %s', COALESCE(OLD.status, 'None'), NEW.status),
      jsonb_build_object(
        'entity_type', 'project', 'entity_id', NEW.id,
        'old_value', OLD.status, 'new_value', NEW.status, 'action', 'status_change'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log task changes
CREATE OR REPLACE FUNCTION log_task_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_logs (
      project_id, user_id, entry_type, title, content, metadata
    ) VALUES (
      NEW.project_id, auth.uid(), 'task_update', 'Task created',
      format('New task: %s', NEW.title),
      jsonb_build_object(
        'entity_type', 'task', 'entity_id', NEW.id, 'task_title', NEW.title, 'action', 'created'
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (
      project_id, user_id, entry_type, title, content, metadata
    ) VALUES (
      NEW.project_id, auth.uid(), 'task_update', 'Task status changed',
      format('Task "%s" changed from %s to %s', NEW.title, COALESCE(OLD.status, 'None'), NEW.status),
      jsonb_build_object(
        'entity_type', 'task', 'entity_id', NEW.id, 'task_title', NEW.title,
        'old_value', OLD.status, 'new_value', NEW.status, 'action', 'status_change'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log RFI changes
CREATE OR REPLACE FUNCTION log_rfi_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_logs (
      project_id, user_id, entry_type, title, content, metadata
    ) VALUES (
      NEW.project_id, auth.uid(), 'rfi_update', 'RFI created',
      format('New RFI: %s - %s', COALESCE(NEW.rfi_number, 'Draft'), NEW.subject),
      jsonb_build_object(
        'entity_type', 'rfi', 'entity_id', NEW.id, 'rfi_number', NEW.rfi_number,
        'subject', NEW.subject, 'action', 'created'
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (
      project_id, user_id, entry_type, title, content, metadata
    ) VALUES (
      NEW.project_id, auth.uid(), 'rfi_update', 'RFI status changed',
      format('RFI %s changed from %s to %s', NEW.rfi_number, COALESCE(OLD.status, 'None'), NEW.status),
      jsonb_build_object(
        'entity_type', 'rfi', 'entity_id', NEW.id, 'rfi_number', NEW.rfi_number,
        'old_value', OLD.status, 'new_value', NEW.status, 'action', 'status_change'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log submittal changes
CREATE OR REPLACE FUNCTION log_submittal_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_logs (
      project_id, user_id, entry_type, title, content, metadata
    ) VALUES (
      NEW.project_id, auth.uid(), 'submittal_update', 'Submittal created',
      format('New submittal: %s - %s', COALESCE(NEW.submittal_number, 'Draft'), NEW.title),
      jsonb_build_object(
        'entity_type', 'submittal', 'entity_id', NEW.id, 'submittal_number', NEW.submittal_number,
        'title', NEW.title, 'action', 'created'
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (
      project_id, user_id, entry_type, title, content, metadata
    ) VALUES (
      NEW.project_id, auth.uid(), 'submittal_update', 'Submittal status changed',
      format('Submittal %s changed from %s to %s', NEW.submittal_number, COALESCE(OLD.status, 'None'), NEW.status),
      jsonb_build_object(
        'entity_type', 'submittal', 'entity_id', NEW.id, 'submittal_number', NEW.submittal_number,
        'old_value', OLD.status, 'new_value', NEW.status, 'action', 'status_change'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_log_project_status ON projects;
DROP TRIGGER IF EXISTS trigger_log_task_change ON tasks;
DROP TRIGGER IF EXISTS trigger_log_rfi_change ON rfis;
DROP TRIGGER IF EXISTS trigger_log_submittal_change ON submittals;

CREATE TRIGGER trigger_log_project_status
  AFTER UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION log_project_status_change();

CREATE TRIGGER trigger_log_task_change
  AFTER INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION log_task_change();

CREATE TRIGGER trigger_log_rfi_change
  AFTER INSERT OR UPDATE ON rfis FOR EACH ROW EXECUTE FUNCTION log_rfi_change();

CREATE TRIGGER trigger_log_submittal_change
  AFTER INSERT OR UPDATE ON submittals FOR EACH ROW EXECUTE FUNCTION log_submittal_change();

-- ============================================================================
-- COMPLETION NOTICE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL MIGRATIONS COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  - change_orders (added: co_number, co_type, date, sent_date, notes)';
  RAISE NOTICE '  - change_order_items (added: price, sort_order)';
  RAISE NOTICE '  - long_lead_items (added: quantity, cutsheet fields, dates)';
  RAISE NOTICE '  - color_selections (added: item_name, cutsheet fields, non_stock fields)';
  RAISE NOTICE '  - warning_emails_log (added: sent_to_emails[], subject, body, status)';
  RAISE NOTICE '  - projects (ensured: health_status)';
  RAISE NOTICE '';
  RAISE NOTICE 'New table created:';
  RAISE NOTICE '  - project_logs (for daily notes and auto-activity tracking)';
  RAISE NOTICE '';
  RAISE NOTICE 'Auto-logging triggers active for:';
  RAISE NOTICE '  - Project status changes';
  RAISE NOTICE '  - Task creation and status changes';
  RAISE NOTICE '  - RFI creation and status changes';
  RAISE NOTICE '  - Submittal creation and status changes';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
