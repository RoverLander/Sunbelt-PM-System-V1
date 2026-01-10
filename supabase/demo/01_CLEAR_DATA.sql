-- ============================================================================
-- STEP 1: CLEAR ALL PROJECT DATA (Run this first)
-- ============================================================================
-- This clears all project-related data while keeping users and system config
-- ============================================================================

-- Disable triggers temporarily to avoid cascade issues
ALTER TABLE projects DISABLE TRIGGER ALL;
ALTER TABLE tasks DISABLE TRIGGER ALL;

-- Clear in dependency order (children first)
DELETE FROM project_logs;
DELETE FROM floor_plan_items;
DELETE FROM floor_plan_pages;
DELETE FROM floor_plans;
DELETE FROM attachments;
DELETE FROM change_order_items;
DELETE FROM change_orders;
DELETE FROM color_selections;
DELETE FROM long_lead_items;
DELETE FROM cutsheet_submittals;
DELETE FROM drawing_versions;
DELETE FROM engineering_reviews;
DELETE FROM state_approvals;
DELETE FROM third_party_reviews;
DELETE FROM warning_emails_log;
DELETE FROM project_workflow_status;
DELETE FROM milestones;
DELETE FROM submittals;
DELETE FROM rfis;
DELETE FROM tasks;
DELETE FROM projects;

-- Re-enable triggers
ALTER TABLE projects ENABLE TRIGGER ALL;
ALTER TABLE tasks ENABLE TRIGGER ALL;

-- Verify
SELECT 'projects' AS table_name, COUNT(*) AS count FROM projects
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'rfis', COUNT(*) FROM rfis
UNION ALL SELECT 'submittals', COUNT(*) FROM submittals;
