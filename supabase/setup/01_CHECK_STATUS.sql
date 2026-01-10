-- ============================================================================
-- DATABASE STATUS CHECK
-- ============================================================================
-- Run this FIRST to see what's been applied and what's missing.
-- This will NOT make any changes - read only.
-- ============================================================================

-- Results will show: EXISTS = already applied, MISSING = needs to be run
-- ============================================================================

SELECT '=== CORE TABLES ===' AS section, '' AS status, '' AS notes;

SELECT 'users' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'projects' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'tasks' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'rfis' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rfis')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'submittals' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submittals')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'milestones' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'attachments' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attachments')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

-- ============================================================================
SELECT '=== FLOOR PLAN TABLES ===' AS section, '' AS status, '' AS notes;

SELECT 'floor_plans' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'floor_plans')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'floor_plan_pages' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'floor_plan_pages')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'floor_plan_items' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'floor_plan_items')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  'Markers/pins on floor plans' AS notes;

-- ============================================================================
SELECT '=== WORKFLOW TABLES ===' AS section, '' AS status, '' AS notes;

SELECT 'workflow_stations' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_stations')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '21 workflow stations' AS notes;

SELECT 'project_workflow_status' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_workflow_status')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'change_orders' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'change_orders')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'change_order_items' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'change_order_items')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'long_lead_items' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'long_lead_items')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'color_selections' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'color_selections')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'warning_emails_log' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warning_emails_log')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'drawing_versions' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drawing_versions')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'engineering_reviews' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engineering_reviews')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'cutsheet_submittals' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cutsheet_submittals')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

-- ============================================================================
SELECT '=== PROJECT LOG TABLE ===' AS section, '' AS status, '' AS notes;

SELECT 'project_logs' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_logs')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  'Daily notes & activity tracking' AS notes;

-- ============================================================================
SELECT '=== NEW COLUMNS (Jan 10 Updates) ===' AS section, '' AS status, '' AS notes;

SELECT 'change_orders.co_number' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'change_orders' AND column_name = 'co_number')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  'INTEGER co number' AS notes;

SELECT 'change_orders.co_type' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'change_orders' AND column_name = 'co_type')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'change_orders.sent_date' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'change_orders' AND column_name = 'sent_date')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'change_orders.notes' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'change_orders' AND column_name = 'notes')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'change_order_items.price' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'change_order_items' AND column_name = 'price')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  'Simplified pricing' AS notes;

SELECT 'change_order_items.sort_order' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'change_order_items' AND column_name = 'sort_order')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'long_lead_items.quantity' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'long_lead_items' AND column_name = 'quantity')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'long_lead_items.has_cutsheet' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'long_lead_items' AND column_name = 'has_cutsheet')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'long_lead_items.cutsheet_url' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'long_lead_items' AND column_name = 'cutsheet_url')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'long_lead_items.submitted_date' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'long_lead_items' AND column_name = 'submitted_date')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'long_lead_items.signoff_date' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'long_lead_items' AND column_name = 'signoff_date')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'color_selections.item_name' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'color_selections' AND column_name = 'item_name')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'color_selections.cutsheet_url' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'color_selections' AND column_name = 'cutsheet_url')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'color_selections.is_non_stock' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'color_selections' AND column_name = 'is_non_stock')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'warning_emails_log.sent_to_emails' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warning_emails_log' AND column_name = 'sent_to_emails')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  'TEXT[] array' AS notes;

SELECT 'warning_emails_log.email_subject' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warning_emails_log' AND column_name = 'email_subject')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'warning_emails_log.email_body' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warning_emails_log' AND column_name = 'email_body')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'warning_emails_log.status' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warning_emails_log' AND column_name = 'status')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

SELECT 'projects.health_status' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'health_status')
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status,
  '' AS notes;

-- ============================================================================
SELECT '=== TRIGGERS ===' AS section, '' AS status, '' AS notes;

SELECT 'trigger_log_project_status' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_log_project_status')
    THEN '✓ EXISTS' ELSE '○ NOT SET' END AS status,
  'Auto-logs project status changes' AS notes;

SELECT 'trigger_log_task_change' AS item,
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_log_task_change')
    THEN '✓ EXISTS' ELSE '○ NOT SET' END AS status,
  'Auto-logs task changes' AS notes;

-- ============================================================================
SELECT '=== RLS STATUS ===' AS section, '' AS status, '' AS notes;

SELECT 'RLS: projects' AS item,
  CASE WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'projects') = true
    THEN '✓ ENABLED' ELSE '⚠ DISABLED' END AS status,
  '' AS notes;

SELECT 'RLS: tasks' AS item,
  CASE WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'tasks') = true
    THEN '✓ ENABLED' ELSE '⚠ DISABLED' END AS status,
  '' AS notes;

SELECT 'RLS: project_logs' AS item,
  CASE WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'project_logs') = true
    THEN '✓ ENABLED' ELSE '⚠ DISABLED' END AS status,
  '' AS notes;

SELECT 'RLS: floor_plan_items' AS item,
  CASE WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'floor_plan_items') = true
    THEN '✓ ENABLED' ELSE '⚠ DISABLED' END AS status,
  '' AS notes;

-- ============================================================================
SELECT '=== RECORD COUNTS ===' AS section, '' AS status, '' AS notes;

SELECT 'projects' AS item, COUNT(*)::TEXT AS status, 'records' AS notes FROM projects;
SELECT 'tasks' AS item, COUNT(*)::TEXT AS status, 'records' AS notes FROM tasks;
SELECT 'users' AS item, COUNT(*)::TEXT AS status, 'records' AS notes FROM users;
SELECT 'workflow_stations' AS item, COUNT(*)::TEXT AS status, 'should be 21' AS notes FROM workflow_stations;

-- ============================================================================
SELECT '=== DATA ISSUES ===' AS section, '' AS status, '' AS notes;

SELECT 'Projects without owner' AS item,
  COUNT(*)::TEXT AS status,
  CASE WHEN COUNT(*) > 0 THEN '⚠ Need assignment' ELSE '✓ All good' END AS notes
FROM projects WHERE owner_id IS NULL;
