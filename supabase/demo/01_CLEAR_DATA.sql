-- ============================================================================
-- STEP 1: CLEAR ALL PROJECT DATA
-- ============================================================================
-- Clears all project-related data while keeping:
-- - Users (authenticated users)
-- - System config (feature_flags, announcements)
--
-- Run this FIRST before any other demo scripts.
-- Created: January 13, 2026
-- Updated: January 14, 2026 - Handle non-existent tables gracefully
-- Updated: January 14, 2026 - Added directory_contacts, external_contacts, departments
-- ============================================================================

-- ============================================================================
-- SAFE TRUNCATE FUNCTION
-- ============================================================================
-- Creates a function that truncates only if table exists
CREATE OR REPLACE FUNCTION safe_truncate(table_name TEXT) RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND information_schema.tables.table_name = safe_truncate.table_name) THEN
    EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLEAR DIRECTORY CONTACT DATA
-- ============================================================================
SELECT safe_truncate('project_external_contacts');
SELECT safe_truncate('external_contacts');
SELECT safe_truncate('directory_contacts');
SELECT safe_truncate('departments');

-- ============================================================================
-- CLEAR FLOOR PLAN DATA
-- ============================================================================
SELECT safe_truncate('floor_plan_items');
SELECT safe_truncate('floor_plan_pages');
SELECT safe_truncate('floor_plans');

-- ============================================================================
-- CLEAR CHANGE ORDER DATA
-- ============================================================================
SELECT safe_truncate('change_order_items');
SELECT safe_truncate('change_orders');

-- ============================================================================
-- CLEAR WORKFLOW-RELATED PROJECT DATA
-- ============================================================================
SELECT safe_truncate('color_selections');
SELECT safe_truncate('long_lead_items');
SELECT safe_truncate('cutsheet_submittals');
SELECT safe_truncate('drawing_versions');
SELECT safe_truncate('engineering_reviews');
SELECT safe_truncate('warning_emails_log');
SELECT safe_truncate('project_workflow_status');

-- ============================================================================
-- CLEAR PROJECT LOGS & DOCUMENTS
-- ============================================================================
SELECT safe_truncate('project_logs');
SELECT safe_truncate('project_documents_checklist');
SELECT safe_truncate('praxis_import_log');
SELECT safe_truncate('attachments');

-- ============================================================================
-- CLEAR CORE PROJECT DATA
-- ============================================================================
SELECT safe_truncate('milestones');
SELECT safe_truncate('submittals');
SELECT safe_truncate('rfis');
SELECT safe_truncate('tasks');

-- ============================================================================
-- CLEAR SALES DATA
-- ============================================================================
SELECT safe_truncate('sales_quote_revisions');
SELECT safe_truncate('sales_activities');
SELECT safe_truncate('sales_quotes');
SELECT safe_truncate('sales_customers');
SELECT safe_truncate('dealers');

-- ============================================================================
-- CLEAR PROJECTS (MAIN TABLE)
-- ============================================================================
SELECT safe_truncate('projects');

-- ============================================================================
-- CLEAR WORKFLOW STATIONS (Will be recreated)
-- ============================================================================
SELECT safe_truncate('workflow_stations');

-- ============================================================================
-- CLEAR FACTORIES (Will be recreated with Praxis codes)
-- ============================================================================
SELECT safe_truncate('factories');

-- ============================================================================
-- DROP HELPER FUNCTION
-- ============================================================================
DROP FUNCTION IF EXISTS safe_truncate(TEXT);

-- ============================================================================
-- VERIFICATION (with safe counts)
-- ============================================================================
SELECT 'Data cleared successfully!' AS status;

DO $$
DECLARE
  v_count BIGINT;
BEGIN
  -- Check projects count if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    SELECT COUNT(*) INTO v_count FROM projects;
    RAISE NOTICE 'projects: % rows', v_count;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    SELECT COUNT(*) INTO v_count FROM tasks;
    RAISE NOTICE 'tasks: % rows', v_count;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_quotes') THEN
    SELECT COUNT(*) INTO v_count FROM sales_quotes;
    RAISE NOTICE 'sales_quotes: % rows', v_count;
  END IF;
END $$;
