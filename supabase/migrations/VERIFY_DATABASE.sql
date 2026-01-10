-- ============================================================================
-- DATABASE VERIFICATION SCRIPT
-- ============================================================================
-- Run this to verify all tables, columns, and configurations are correct.
-- Creates a verification_log table to store any issues found.
-- ============================================================================

-- Create verification log table
CREATE TABLE IF NOT EXISTS verification_log (
  id SERIAL PRIMARY KEY,
  check_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'PASS', 'FAIL', 'WARN'
  message TEXT,
  details JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear previous verification results
TRUNCATE verification_log;

-- ============================================================================
-- SECTION 1: CHECK REQUIRED TABLES EXIST
-- ============================================================================

DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'users', 'projects', 'tasks', 'rfis', 'submittals', 'milestones',
    'attachments', 'floor_plans', 'floor_plan_pages', 'floor_plan_items',
    'workflow_stations', 'project_workflow_status', 'change_orders',
    'change_order_items', 'long_lead_items', 'color_selections',
    'warning_emails_log', 'project_logs'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = v_table) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('Table: ' || v_table, 'PASS', 'Table exists');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('Table: ' || v_table, 'FAIL', 'Table does not exist - NEEDS CREATION');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 2: CHECK CHANGE_ORDERS COLUMNS
-- ============================================================================

DO $$
DECLARE
  v_col TEXT;
  v_required_cols TEXT[] := ARRAY[
    'id', 'project_id', 'co_number', 'co_type', 'status', 'date',
    'notes', 'sent_date', 'signed_date', 'implemented_date', 'total_amount'
  ];
BEGIN
  FOREACH v_col IN ARRAY v_required_cols
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'change_orders' AND column_name = v_col
    ) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('change_orders.' || v_col, 'PASS', 'Column exists');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('change_orders.' || v_col, 'FAIL', 'Missing column - component expects this');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 3: CHECK CHANGE_ORDER_ITEMS COLUMNS
-- ============================================================================

DO $$
DECLARE
  v_col TEXT;
  v_required_cols TEXT[] := ARRAY['id', 'change_order_id', 'description', 'price', 'sort_order'];
BEGIN
  FOREACH v_col IN ARRAY v_required_cols
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'change_order_items' AND column_name = v_col
    ) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('change_order_items.' || v_col, 'PASS', 'Column exists');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('change_order_items.' || v_col, 'FAIL', 'Missing column - component expects this');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 4: CHECK LONG_LEAD_ITEMS COLUMNS
-- ============================================================================

DO $$
DECLARE
  v_col TEXT;
  v_required_cols TEXT[] := ARRAY[
    'id', 'project_id', 'item_name', 'manufacturer', 'model_number',
    'quantity', 'lead_time_weeks', 'has_cutsheet', 'cutsheet_url',
    'cutsheet_name', 'status', 'submitted_date', 'signoff_date', 'notes'
  ];
BEGIN
  FOREACH v_col IN ARRAY v_required_cols
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'long_lead_items' AND column_name = v_col
    ) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('long_lead_items.' || v_col, 'PASS', 'Column exists');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('long_lead_items.' || v_col, 'FAIL', 'Missing column - component expects this');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 5: CHECK COLOR_SELECTIONS COLUMNS
-- ============================================================================

DO $$
DECLARE
  v_col TEXT;
  v_required_cols TEXT[] := ARRAY[
    'id', 'project_id', 'category', 'item_name', 'color_name', 'color_code',
    'manufacturer', 'cutsheet_url', 'cutsheet_name', 'is_non_stock',
    'non_stock_verified', 'non_stock_lead_time', 'status', 'notes'
  ];
BEGIN
  FOREACH v_col IN ARRAY v_required_cols
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'color_selections' AND column_name = v_col
    ) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('color_selections.' || v_col, 'PASS', 'Column exists');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('color_selections.' || v_col, 'FAIL', 'Missing column - component expects this');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 6: CHECK WARNING_EMAILS_LOG COLUMNS
-- ============================================================================

DO $$
DECLARE
  v_col TEXT;
  v_required_cols TEXT[] := ARRAY[
    'id', 'project_id', 'email_type', 'sent_to_emails', 'email_subject',
    'email_body', 'sent_by', 'status'
  ];
BEGIN
  FOREACH v_col IN ARRAY v_required_cols
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'warning_emails_log' AND column_name = v_col
    ) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('warning_emails_log.' || v_col, 'PASS', 'Column exists');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('warning_emails_log.' || v_col, 'FAIL', 'Missing column - component expects this');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 7: CHECK PROJECT_LOGS COLUMNS
-- ============================================================================

DO $$
DECLARE
  v_col TEXT;
  v_required_cols TEXT[] := ARRAY[
    'id', 'project_id', 'user_id', 'entry_type', 'title', 'content',
    'attachments', 'metadata', 'is_pinned', 'is_important', 'log_date',
    'created_at', 'updated_at'
  ];
BEGIN
  FOREACH v_col IN ARRAY v_required_cols
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'project_logs' AND column_name = v_col
    ) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('project_logs.' || v_col, 'PASS', 'Column exists');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('project_logs.' || v_col, 'FAIL', 'Missing column - component expects this');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 8: CHECK PROJECTS TABLE HAS REQUIRED COLUMNS
-- ============================================================================

DO $$
DECLARE
  v_col TEXT;
  v_required_cols TEXT[] := ARRAY[
    'id', 'project_number', 'name', 'status', 'health_status',
    'owner_id', 'primary_pm_id', 'backup_pm_id', 'target_online_date'
  ];
BEGIN
  FOREACH v_col IN ARRAY v_required_cols
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'projects' AND column_name = v_col
    ) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('projects.' || v_col, 'PASS', 'Column exists');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('projects.' || v_col, 'FAIL', 'Missing column - component expects this');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 9: CHECK TRIGGERS EXIST
-- ============================================================================

DO $$
DECLARE
  v_trigger TEXT;
  v_triggers TEXT[] := ARRAY[
    'trigger_log_project_status',
    'trigger_log_task_change'
  ];
BEGIN
  FOREACH v_trigger IN ARRAY v_triggers
  LOOP
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = v_trigger) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('Trigger: ' || v_trigger, 'PASS', 'Trigger exists');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('Trigger: ' || v_trigger, 'WARN', 'Trigger not found - auto-logging disabled');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 10: CHECK RLS IS ENABLED
-- ============================================================================

DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'projects', 'tasks', 'rfis', 'submittals', 'project_logs',
    'change_orders', 'long_lead_items', 'color_selections'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE tablename = v_table AND rowsecurity = true
    ) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('RLS: ' || v_table, 'PASS', 'Row Level Security enabled');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('RLS: ' || v_table, 'WARN', 'RLS not enabled - data may be exposed');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 11: CHECK INDEXES EXIST
-- ============================================================================

DO $$
DECLARE
  v_index TEXT;
  v_indexes TEXT[] := ARRAY[
    'idx_project_logs_project',
    'idx_project_logs_date',
    'idx_change_orders_co_number',
    'idx_long_lead_items_submitted'
  ];
BEGIN
  FOREACH v_index IN ARRAY v_indexes
  LOOP
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = v_index) THEN
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('Index: ' || v_index, 'PASS', 'Index exists');
    ELSE
      INSERT INTO verification_log (check_name, status, message)
      VALUES ('Index: ' || v_index, 'WARN', 'Index not found - may impact performance');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 12: DATA INTEGRITY CHECKS
-- ============================================================================

-- Check for orphaned tasks (tasks without valid project)
INSERT INTO verification_log (check_name, status, message, details)
SELECT
  'Data: Orphaned Tasks',
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
  CASE WHEN COUNT(*) = 0 THEN 'No orphaned tasks'
       ELSE COUNT(*) || ' tasks have invalid project_id' END,
  CASE WHEN COUNT(*) > 0 THEN jsonb_build_object('count', COUNT(*)) ELSE NULL END
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
WHERE p.id IS NULL;

-- Check for projects without owner
INSERT INTO verification_log (check_name, status, message, details)
SELECT
  'Data: Projects Without Owner',
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
  CASE WHEN COUNT(*) = 0 THEN 'All projects have owners'
       ELSE COUNT(*) || ' projects have no owner_id' END,
  CASE WHEN COUNT(*) > 0 THEN jsonb_build_object('count', COUNT(*)) ELSE NULL END
FROM projects
WHERE owner_id IS NULL;

-- Check for users without role
INSERT INTO verification_log (check_name, status, message, details)
SELECT
  'Data: Users Without Role',
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
  CASE WHEN COUNT(*) = 0 THEN 'All users have roles'
       ELSE COUNT(*) || ' users have no role assigned' END,
  CASE WHEN COUNT(*) > 0 THEN jsonb_build_object('count', COUNT(*)) ELSE NULL END
FROM users
WHERE role IS NULL OR role = '';

-- ============================================================================
-- SECTION 13: COUNT RECORDS IN KEY TABLES
-- ============================================================================

INSERT INTO verification_log (check_name, status, message, details)
SELECT 'Stats: projects', 'INFO', COUNT(*) || ' total projects',
  jsonb_build_object('count', COUNT(*)) FROM projects;

INSERT INTO verification_log (check_name, status, message, details)
SELECT 'Stats: tasks', 'INFO', COUNT(*) || ' total tasks',
  jsonb_build_object('count', COUNT(*)) FROM tasks;

INSERT INTO verification_log (check_name, status, message, details)
SELECT 'Stats: users', 'INFO', COUNT(*) || ' total users',
  jsonb_build_object('count', COUNT(*)) FROM users;

INSERT INTO verification_log (check_name, status, message, details)
SELECT 'Stats: project_logs', 'INFO', COUNT(*) || ' log entries',
  jsonb_build_object('count', COUNT(*)) FROM project_logs;

-- ============================================================================
-- FINAL REPORT
-- ============================================================================

-- Show summary
SELECT
  status,
  COUNT(*) as count
FROM verification_log
GROUP BY status
ORDER BY
  CASE status
    WHEN 'FAIL' THEN 1
    WHEN 'WARN' THEN 2
    WHEN 'PASS' THEN 3
    WHEN 'INFO' THEN 4
  END;

-- Show all failures and warnings
SELECT check_name, status, message, details
FROM verification_log
WHERE status IN ('FAIL', 'WARN')
ORDER BY status, check_name;

-- ============================================================================
-- TO VIEW FULL RESULTS LATER:
-- SELECT * FROM verification_log ORDER BY status, check_name;
-- ============================================================================
