-- ============================================================================
-- PART 4: AUTO-LOGGING TRIGGERS (Optional - run last)
-- ============================================================================

-- Log project status changes
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

-- Log task changes
CREATE OR REPLACE FUNCTION log_task_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_logs (project_id, user_id, entry_type, title, content)
    VALUES (NEW.project_id, auth.uid(), 'task_update', 'Task created', format('New task: %s', NEW.title));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_logs (project_id, user_id, entry_type, title, content)
    VALUES (NEW.project_id, auth.uid(), 'task_update', 'Task status changed',
      format('Task "%s" changed from %s to %s', NEW.title, COALESCE(OLD.status, 'None'), NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_log_project_status ON projects;
DROP TRIGGER IF EXISTS trigger_log_task_change ON tasks;

CREATE TRIGGER trigger_log_project_status
  AFTER UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION log_project_status_change();

CREATE TRIGGER trigger_log_task_change
  AFTER INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION log_task_change();
