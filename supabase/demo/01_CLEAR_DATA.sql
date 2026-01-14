-- ============================================================================
-- STEP 1: CLEAR ALL PROJECT DATA
-- ============================================================================
-- Clears all project-related data while keeping:
-- - Users (authenticated users)
-- - Factories (will be recreated in next script)
-- - Workflow stations (will be recreated in next script)
-- - System config (feature_flags, announcements)
--
-- Run this FIRST before any other demo scripts.
-- Created: January 13, 2026
-- ============================================================================

-- ============================================================================
-- CLEAR FLOOR PLAN DATA
-- ============================================================================
TRUNCATE TABLE floor_plan_items CASCADE;
TRUNCATE TABLE floor_plan_pages CASCADE;
TRUNCATE TABLE floor_plans CASCADE;

-- ============================================================================
-- CLEAR CHANGE ORDER DATA
-- ============================================================================
TRUNCATE TABLE change_order_items CASCADE;
TRUNCATE TABLE change_orders CASCADE;

-- ============================================================================
-- CLEAR WORKFLOW-RELATED PROJECT DATA
-- ============================================================================
TRUNCATE TABLE color_selections CASCADE;
TRUNCATE TABLE long_lead_items CASCADE;
TRUNCATE TABLE cutsheet_submittals CASCADE;
TRUNCATE TABLE drawing_versions CASCADE;
TRUNCATE TABLE engineering_reviews CASCADE;
TRUNCATE TABLE warning_emails_log CASCADE;
TRUNCATE TABLE project_workflow_status CASCADE;

-- ============================================================================
-- CLEAR PROJECT LOGS & DOCUMENTS
-- ============================================================================
TRUNCATE TABLE project_logs CASCADE;
TRUNCATE TABLE project_documents_checklist CASCADE;
TRUNCATE TABLE praxis_import_log CASCADE;
TRUNCATE TABLE attachments CASCADE;

-- ============================================================================
-- CLEAR CORE PROJECT DATA
-- ============================================================================
TRUNCATE TABLE milestones CASCADE;
TRUNCATE TABLE submittals CASCADE;
TRUNCATE TABLE rfis CASCADE;
TRUNCATE TABLE tasks CASCADE;

-- ============================================================================
-- CLEAR SALES DATA
-- ============================================================================
TRUNCATE TABLE sales_quote_revisions CASCADE;
TRUNCATE TABLE sales_activities CASCADE;
TRUNCATE TABLE sales_quotes CASCADE;
TRUNCATE TABLE sales_customers CASCADE;

-- ============================================================================
-- CLEAR PROJECTS (MAIN TABLE)
-- ============================================================================
TRUNCATE TABLE projects CASCADE;

-- ============================================================================
-- CLEAR WORKFLOW STATIONS (Will be recreated)
-- ============================================================================
TRUNCATE TABLE workflow_stations CASCADE;

-- ============================================================================
-- CLEAR FACTORIES (Will be recreated with Praxis codes)
-- ============================================================================
-- Note: factories table may not exist yet, so we use IF EXISTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'factories') THEN
    TRUNCATE TABLE factories CASCADE;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Data cleared. Verification counts:' AS status;

SELECT 'projects' AS table_name, COUNT(*) AS count FROM projects
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'rfis', COUNT(*) FROM rfis
UNION ALL SELECT 'submittals', COUNT(*) FROM submittals
UNION ALL SELECT 'milestones', COUNT(*) FROM milestones
UNION ALL SELECT 'change_orders', COUNT(*) FROM change_orders
UNION ALL SELECT 'workflow_stations', COUNT(*) FROM workflow_stations
UNION ALL SELECT 'sales_quotes', COUNT(*) FROM sales_quotes
ORDER BY table_name;
