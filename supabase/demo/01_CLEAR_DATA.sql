-- ============================================================================
-- STEP 1: CLEAR ALL PROJECT DATA (Run this first)
-- ============================================================================
-- This clears all project-related data while keeping users and system config
-- Deletes in correct order to respect foreign key constraints
-- ============================================================================

-- Clear child tables first (tables that reference projects)
TRUNCATE TABLE project_logs CASCADE;
TRUNCATE TABLE floor_plan_items CASCADE;
TRUNCATE TABLE floor_plan_pages CASCADE;
TRUNCATE TABLE floor_plans CASCADE;
TRUNCATE TABLE attachments CASCADE;
TRUNCATE TABLE change_order_items CASCADE;
TRUNCATE TABLE change_orders CASCADE;
TRUNCATE TABLE color_selections CASCADE;
TRUNCATE TABLE long_lead_items CASCADE;
TRUNCATE TABLE cutsheet_submittals CASCADE;
TRUNCATE TABLE drawing_versions CASCADE;
TRUNCATE TABLE engineering_reviews CASCADE;
TRUNCATE TABLE state_approvals CASCADE;
TRUNCATE TABLE third_party_reviews CASCADE;
TRUNCATE TABLE warning_emails_log CASCADE;
TRUNCATE TABLE project_workflow_status CASCADE;
TRUNCATE TABLE milestones CASCADE;
TRUNCATE TABLE submittals CASCADE;
TRUNCATE TABLE rfis CASCADE;
TRUNCATE TABLE tasks CASCADE;

-- Finally clear projects
TRUNCATE TABLE projects CASCADE;

-- Verify all cleared
SELECT 'projects' AS table_name, COUNT(*) AS count FROM projects
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'rfis', COUNT(*) FROM rfis
UNION ALL SELECT 'submittals', COUNT(*) FROM submittals
UNION ALL SELECT 'milestones', COUNT(*) FROM milestones;
