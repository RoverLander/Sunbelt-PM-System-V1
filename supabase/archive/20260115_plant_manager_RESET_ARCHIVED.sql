-- ============================================================================
-- Plant General Manager (PGM) System RESET Migration
-- ============================================================================
-- RUN THIS FIRST if you have a partially created PGM schema that needs cleanup.
-- This drops all PGM tables in the correct order (reverse dependency order).
--
-- WARNING: This will DELETE ALL DATA in these tables!
--
-- Created: January 15, 2026
-- ============================================================================

-- Drop FK constraints first to avoid dependency issues
ALTER TABLE IF EXISTS qc_records DROP CONSTRAINT IF EXISTS fk_qc_records_rework_task;
ALTER TABLE IF EXISTS long_lead_items DROP CONSTRAINT IF EXISTS fk_long_lead_items_task;
ALTER TABLE IF EXISTS modules DROP CONSTRAINT IF EXISTS fk_modules_current_station;

-- Drop in reverse dependency order to avoid FK conflicts
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

-- Clean up any orphaned indexes (should be handled by CASCADE but just in case)
DROP INDEX IF EXISTS idx_modules_project;
DROP INDEX IF EXISTS idx_modules_factory;
DROP INDEX IF EXISTS idx_modules_status;
DROP INDEX IF EXISTS idx_modules_scheduled_start;
DROP INDEX IF EXISTS idx_modules_current_station;
DROP INDEX IF EXISTS idx_station_templates_factory;
DROP INDEX IF EXISTS idx_station_templates_order;
DROP INDEX IF EXISTS idx_station_assignments_module;
DROP INDEX IF EXISTS idx_station_assignments_station;
DROP INDEX IF EXISTS idx_station_assignments_lead;
DROP INDEX IF EXISTS idx_station_assignments_status;
DROP INDEX IF EXISTS idx_station_assignments_factory;
DROP INDEX IF EXISTS idx_workers_factory;
DROP INDEX IF EXISTS idx_workers_station;
DROP INDEX IF EXISTS idx_workers_active;
DROP INDEX IF EXISTS idx_workers_name;
DROP INDEX IF EXISTS idx_worker_shifts_worker;
DROP INDEX IF EXISTS idx_worker_shifts_factory;
DROP INDEX IF EXISTS idx_worker_shifts_clock_in;
DROP INDEX IF EXISTS idx_worker_shifts_status;
DROP INDEX IF EXISTS idx_qc_records_module;
DROP INDEX IF EXISTS idx_qc_records_station;
DROP INDEX IF EXISTS idx_qc_records_factory;
DROP INDEX IF EXISTS idx_qc_records_status;
DROP INDEX IF EXISTS idx_qc_records_inspected_at;
DROP INDEX IF EXISTS idx_inspection_rules_factory;
DROP INDEX IF EXISTS idx_inspection_rules_station;
DROP INDEX IF EXISTS idx_long_lead_items_module;
DROP INDEX IF EXISTS idx_long_lead_items_project;
DROP INDEX IF EXISTS idx_long_lead_items_status;
DROP INDEX IF EXISTS idx_long_lead_items_factory;
DROP INDEX IF EXISTS idx_plant_config_factory;
DROP INDEX IF EXISTS idx_calendar_audit_factory;
DROP INDEX IF EXISTS idx_calendar_audit_action;
DROP INDEX IF EXISTS idx_calendar_audit_created;
DROP INDEX IF EXISTS idx_takt_events_module;
DROP INDEX IF EXISTS idx_takt_events_station;
DROP INDEX IF EXISTS idx_takt_events_factory;
DROP INDEX IF EXISTS idx_takt_events_flagged;
DROP INDEX IF EXISTS idx_kaizen_factory;
DROP INDEX IF EXISTS idx_kaizen_status;
DROP INDEX IF EXISTS idx_kaizen_category;
DROP INDEX IF EXISTS idx_cross_training_worker;
DROP INDEX IF EXISTS idx_cross_training_station;
DROP INDEX IF EXISTS idx_cross_training_factory;
DROP INDEX IF EXISTS idx_safety_checks_factory;
DROP INDEX IF EXISTS idx_safety_checks_station;
DROP INDEX IF EXISTS idx_safety_checks_date;
DROP INDEX IF EXISTS idx_five_s_factory;
DROP INDEX IF EXISTS idx_five_s_station;
DROP INDEX IF EXISTS idx_five_s_date;

-- Remove task_type column if it was added
ALTER TABLE IF EXISTS tasks DROP COLUMN IF EXISTS task_type;
ALTER TABLE IF EXISTS tasks DROP COLUMN IF EXISTS trigger_next;

RAISE NOTICE 'PGM tables dropped successfully. Now run 20260115_plant_manager_system.sql';
