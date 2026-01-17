-- ============================================================================
-- PERFORMANCE_INDEXES.sql
-- Database indexes for performance optimization
-- Per DEBUG_TEST_GUIDE.md - Phase 3.1 recommendations
-- ============================================================================

-- ============================================================================
-- 1. AUDIT EXISTING INDEXES
-- ============================================================================
SELECT 'EXISTING INDEXES AUDIT' AS audit_section;

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 2. TABLES WITH HIGH-FREQUENCY QUERIES (Add composite indexes)
-- ============================================================================

-- Projects table - frequently filtered by status and factory
CREATE INDEX IF NOT EXISTS idx_projects_factory_status
ON projects(factory, status);

CREATE INDEX IF NOT EXISTS idx_projects_owner_status
ON projects(owner_id, status);

CREATE INDEX IF NOT EXISTS idx_projects_delivery_date
ON projects(delivery_date) WHERE delivery_date IS NOT NULL;

-- Tasks table - frequently filtered by project, status, workflow station
CREATE INDEX IF NOT EXISTS idx_tasks_project_status
ON tasks(project_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_workflow_station
ON tasks(workflow_station_key) WHERE workflow_station_key IS NOT NULL;

-- Note: tasks table uses assigned_by, not assigned_to
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by
ON tasks(assigned_by) WHERE assigned_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Modules table - frequently filtered by factory, station, status
CREATE INDEX IF NOT EXISTS idx_modules_factory_status
ON modules(factory_id, status);

CREATE INDEX IF NOT EXISTS idx_modules_station
ON modules(current_station_id) WHERE current_station_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_modules_queue_position
ON modules(current_station_id, queue_position) WHERE queue_position IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_modules_project
ON modules(project_id) WHERE project_id IS NOT NULL;

-- Workers table - frequently filtered by factory and active status
CREATE INDEX IF NOT EXISTS idx_workers_factory_active
ON workers(factory_id, is_active);

CREATE INDEX IF NOT EXISTS idx_workers_station
ON workers(primary_station_id) WHERE primary_station_id IS NOT NULL;

-- Worker shifts - frequently filtered by factory and date
CREATE INDEX IF NOT EXISTS idx_worker_shifts_factory_date
ON worker_shifts(factory_id, clock_in);

CREATE INDEX IF NOT EXISTS idx_worker_shifts_worker
ON worker_shifts(worker_id, clock_in);

-- RFIs - frequently filtered by project and status
CREATE INDEX IF NOT EXISTS idx_rfis_project_status
ON rfis(project_id, status);

-- Submittals - frequently filtered by project and status
CREATE INDEX IF NOT EXISTS idx_submittals_project_status
ON submittals(project_id, status);

-- Sales quotes - frequently filtered by factory and status
CREATE INDEX IF NOT EXISTS idx_sales_quotes_factory_status
ON sales_quotes(factory, status);

CREATE INDEX IF NOT EXISTS idx_sales_quotes_assigned
ON sales_quotes(assigned_to) WHERE assigned_to IS NOT NULL;

-- Station templates - frequently filtered by factory
CREATE INDEX IF NOT EXISTS idx_station_templates_factory
ON station_templates(factory_id) WHERE factory_id IS NOT NULL;

-- QC Records - frequently filtered by factory and date
CREATE INDEX IF NOT EXISTS idx_qc_records_factory_date
ON qc_records(factory_id, created_at);

CREATE INDEX IF NOT EXISTS idx_qc_records_module
ON qc_records(module_id) WHERE module_id IS NOT NULL;

-- ============================================================================
-- 3. FULL-TEXT SEARCH INDEXES (for search functionality)
-- ============================================================================

-- Projects search
CREATE INDEX IF NOT EXISTS idx_projects_search
ON projects USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(job_number, '')));

-- Tasks search
CREATE INDEX IF NOT EXISTS idx_tasks_search
ON tasks USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- RFIs search
CREATE INDEX IF NOT EXISTS idx_rfis_search
ON rfis USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(question, '')));

-- ============================================================================
-- 4. ANALYZE TABLES (update statistics for query planner)
-- ============================================================================
ANALYZE projects;
ANALYZE tasks;
ANALYZE modules;
ANALYZE workers;
ANALYZE worker_shifts;
ANALYZE rfis;
ANALYZE submittals;
ANALYZE sales_quotes;
ANALYZE station_templates;
ANALYZE qc_records;

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================
SELECT 'INDEX COUNT BY TABLE' AS audit_section;

SELECT
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY index_count DESC;

SELECT 'PERFORMANCE_INDEXES.sql COMPLETE' AS status;
SELECT 'Run EXPLAIN ANALYZE on slow queries to verify improvements' AS next_step;
