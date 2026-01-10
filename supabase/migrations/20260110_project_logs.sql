-- ============================================================================
-- SUNBELT PM - PROJECT LOGS MIGRATION
-- ============================================================================
-- Version: 1.0
-- Date: January 10, 2026
-- Description: Daily project log and notes system
--
-- This migration includes:
-- 1. project_logs table for manual notes and auto-activity tracking
-- 2. Indexes for performance
-- 3. RLS policies
-- 4. Trigger functions for auto-logging project activity
-- ============================================================================

-- ============================================================================
-- SECTION 1: PROJECT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Entry Type
  -- 'note' = Manual user note
  -- 'activity' = Auto-generated activity log
  -- 'status_change' = Project/task status change
  -- 'milestone' = Milestone update
  -- 'file_upload' = File was uploaded
  -- 'rfi_update' = RFI created/updated
  -- 'submittal_update' = Submittal created/updated
  -- 'task_update' = Task created/updated
  entry_type VARCHAR(50) NOT NULL DEFAULT 'note',

  -- Content
  title VARCHAR(255),
  content TEXT,

  -- Attachments (stored as JSONB array)
  -- Format: [{ file_name, file_size, file_type, storage_path, public_url }]
  attachments JSONB DEFAULT '[]',

  -- Metadata for activity logs
  -- Format: { entity_type, entity_id, old_value, new_value, action }
  metadata JSONB DEFAULT '{}',

  -- Features
  is_pinned BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,

  -- Timestamps
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_logs_project ON project_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_user ON project_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_type ON project_logs(entry_type);
CREATE INDEX IF NOT EXISTS idx_project_logs_date ON project_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_project_logs_pinned ON project_logs(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_project_logs_created ON project_logs(created_at DESC);

COMMENT ON TABLE project_logs IS 'Daily project log entries including manual notes and auto-activity tracking';
COMMENT ON COLUMN project_logs.entry_type IS 'Type of log entry: note, activity, status_change, milestone, file_upload, rfi_update, submittal_update, task_update';
COMMENT ON COLUMN project_logs.attachments IS 'JSONB array of attached files';
COMMENT ON COLUMN project_logs.metadata IS 'Additional context for activity logs (entity info, old/new values)';

-- ============================================================================
-- SECTION 2: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;

-- Select: Users with project access can view logs
CREATE POLICY "project_logs_select" ON project_logs
  FOR SELECT USING (user_has_project_access(project_id));

-- Insert: Users with project access can create logs
CREATE POLICY "project_logs_insert" ON project_logs
  FOR INSERT WITH CHECK (user_has_project_access(project_id));

-- Update: Users can update their own logs, or admins can update any
CREATE POLICY "project_logs_update" ON project_logs
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_has_elevated_role()
  );

-- Delete: Users can delete their own notes (not activity logs), or admins can delete any
CREATE POLICY "project_logs_delete" ON project_logs
  FOR DELETE USING (
    (user_id = auth.uid() AND entry_type = 'note')
    OR user_has_elevated_role()
  );

-- ============================================================================
-- SECTION 3: AUTO-LOGGING TRIGGER FUNCTIONS
-- ============================================================================

-- Function to log project status changes
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (
      project_id,
      user_id,
      entry_type,
      title,
      content,
      metadata
    ) VALUES (
      NEW.id,
      auth.uid(),
      'status_change',
      'Project status changed',
      format('Status changed from %s to %s', COALESCE(OLD.status, 'None'), NEW.status),
      jsonb_build_object(
        'entity_type', 'project',
        'entity_id', NEW.id,
        'old_value', OLD.status,
        'new_value', NEW.status,
        'action', 'status_change'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log task changes
CREATE OR REPLACE FUNCTION log_task_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log task creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_logs (
      project_id,
      user_id,
      entry_type,
      title,
      content,
      metadata
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      'task_update',
      'Task created',
      format('New task: %s', NEW.title),
      jsonb_build_object(
        'entity_type', 'task',
        'entity_id', NEW.id,
        'task_title', NEW.title,
        'action', 'created'
      )
    );
  -- Log task status change
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (
      project_id,
      user_id,
      entry_type,
      title,
      content,
      metadata
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      'task_update',
      'Task status changed',
      format('Task "%s" changed from %s to %s', NEW.title, COALESCE(OLD.status, 'None'), NEW.status),
      jsonb_build_object(
        'entity_type', 'task',
        'entity_id', NEW.id,
        'task_title', NEW.title,
        'old_value', OLD.status,
        'new_value', NEW.status,
        'action', 'status_change'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log RFI changes
CREATE OR REPLACE FUNCTION log_rfi_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log RFI creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_logs (
      project_id,
      user_id,
      entry_type,
      title,
      content,
      metadata
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      'rfi_update',
      'RFI created',
      format('New RFI: %s - %s', COALESCE(NEW.rfi_number, 'Draft'), NEW.subject),
      jsonb_build_object(
        'entity_type', 'rfi',
        'entity_id', NEW.id,
        'rfi_number', NEW.rfi_number,
        'subject', NEW.subject,
        'action', 'created'
      )
    );
  -- Log RFI status change
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (
      project_id,
      user_id,
      entry_type,
      title,
      content,
      metadata
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      'rfi_update',
      'RFI status changed',
      format('RFI %s changed from %s to %s', NEW.rfi_number, COALESCE(OLD.status, 'None'), NEW.status),
      jsonb_build_object(
        'entity_type', 'rfi',
        'entity_id', NEW.id,
        'rfi_number', NEW.rfi_number,
        'old_value', OLD.status,
        'new_value', NEW.status,
        'action', 'status_change'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log submittal changes
CREATE OR REPLACE FUNCTION log_submittal_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log submittal creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_logs (
      project_id,
      user_id,
      entry_type,
      title,
      content,
      metadata
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      'submittal_update',
      'Submittal created',
      format('New submittal: %s - %s', COALESCE(NEW.submittal_number, 'Draft'), NEW.title),
      jsonb_build_object(
        'entity_type', 'submittal',
        'entity_id', NEW.id,
        'submittal_number', NEW.submittal_number,
        'title', NEW.title,
        'action', 'created'
      )
    );
  -- Log submittal status change
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (
      project_id,
      user_id,
      entry_type,
      title,
      content,
      metadata
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      'submittal_update',
      'Submittal status changed',
      format('Submittal %s changed from %s to %s', NEW.submittal_number, COALESCE(OLD.status, 'None'), NEW.status),
      jsonb_build_object(
        'entity_type', 'submittal',
        'entity_id', NEW.id,
        'submittal_number', NEW.submittal_number,
        'old_value', OLD.status,
        'new_value', NEW.status,
        'action', 'status_change'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log milestone changes
CREATE OR REPLACE FUNCTION log_milestone_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log milestone creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_logs (
      project_id,
      user_id,
      entry_type,
      title,
      content,
      metadata
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      'milestone',
      'Milestone created',
      format('New milestone: %s (Due: %s)', NEW.name, COALESCE(NEW.due_date::text, 'Not set')),
      jsonb_build_object(
        'entity_type', 'milestone',
        'entity_id', NEW.id,
        'milestone_name', NEW.name,
        'due_date', NEW.due_date,
        'action', 'created'
      )
    );
  -- Log milestone completion
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Completed' THEN
    INSERT INTO project_logs (
      project_id,
      user_id,
      entry_type,
      title,
      content,
      metadata
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      'milestone',
      'Milestone completed',
      format('Milestone "%s" marked as completed', NEW.name),
      jsonb_build_object(
        'entity_type', 'milestone',
        'entity_id', NEW.id,
        'milestone_name', NEW.name,
        'action', 'completed'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: CREATE TRIGGERS
-- ============================================================================

-- Project status change trigger
DROP TRIGGER IF EXISTS trigger_log_project_status ON projects;
CREATE TRIGGER trigger_log_project_status
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION log_project_status_change();

-- Task change trigger
DROP TRIGGER IF EXISTS trigger_log_task_change ON tasks;
CREATE TRIGGER trigger_log_task_change
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_change();

-- RFI change trigger
DROP TRIGGER IF EXISTS trigger_log_rfi_change ON rfis;
CREATE TRIGGER trigger_log_rfi_change
  AFTER INSERT OR UPDATE ON rfis
  FOR EACH ROW
  EXECUTE FUNCTION log_rfi_change();

-- Submittal change trigger
DROP TRIGGER IF EXISTS trigger_log_submittal_change ON submittals;
CREATE TRIGGER trigger_log_submittal_change
  AFTER INSERT OR UPDATE ON submittals
  FOR EACH ROW
  EXECUTE FUNCTION log_submittal_change();

-- Milestone change trigger
DROP TRIGGER IF EXISTS trigger_log_milestone_change ON milestones;
CREATE TRIGGER trigger_log_milestone_change
  AFTER INSERT OR UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION log_milestone_change();

-- ============================================================================
-- SECTION 5: HELPER VIEW
-- ============================================================================

-- View for daily activity summary
CREATE OR REPLACE VIEW project_daily_activity AS
SELECT
  project_id,
  log_date,
  COUNT(*) FILTER (WHERE entry_type = 'note') AS notes_count,
  COUNT(*) FILTER (WHERE entry_type = 'task_update') AS task_updates,
  COUNT(*) FILTER (WHERE entry_type = 'rfi_update') AS rfi_updates,
  COUNT(*) FILTER (WHERE entry_type = 'submittal_update') AS submittal_updates,
  COUNT(*) FILTER (WHERE entry_type = 'milestone') AS milestone_updates,
  COUNT(*) FILTER (WHERE entry_type = 'status_change') AS status_changes,
  COUNT(*) AS total_entries
FROM project_logs
GROUP BY project_id, log_date
ORDER BY log_date DESC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PROJECT LOGS MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table created: project_logs';
  RAISE NOTICE 'Triggers created: 5 (projects, tasks, rfis, submittals, milestones)';
  RAISE NOTICE 'RLS policies: 4';
  RAISE NOTICE 'View created: project_daily_activity';
  RAISE NOTICE '========================================';
END $$;
