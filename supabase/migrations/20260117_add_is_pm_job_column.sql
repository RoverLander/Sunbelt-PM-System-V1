-- ============================================================================
-- Migration: Add is_pm_job column to projects table
-- ============================================================================
-- Created: January 17, 2026
-- Purpose: Distinguish PM-managed projects from PC/STOCK jobs
--
-- Business Rule:
-- - PM Jobs (is_pm_job = true): Managed by Corporate PM team, tracked in PM Dashboard
-- - PC Jobs (is_pm_job = false): Managed by factory PCs and Plant GMs, NOT visible to PMs
-- ============================================================================

-- Add the is_pm_job column
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS is_pm_job BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering PM vs PC jobs
CREATE INDEX IF NOT EXISTS idx_projects_is_pm_job ON projects(is_pm_job);

-- Add comment for documentation
COMMENT ON COLUMN projects.is_pm_job IS 'TRUE = PM-managed project (tracked in PM Dashboard), FALSE = PC/STOCK job (factory-managed)';

-- Backfill existing projects based on business rules:
-- GOVERNMENT and CUSTOM projects with contract_value >= 500000 are likely PM jobs
-- FLEET/STOCK are PC jobs
UPDATE projects
SET is_pm_job = true
WHERE building_type IN ('GOVERNMENT', 'CUSTOM')
  AND (contract_value >= 500000 OR primary_pm_id IS NOT NULL);

UPDATE projects
SET is_pm_job = false
WHERE building_type IN ('FLEET', 'STOCK', 'FLEET/STOCK')
  OR primary_pm_id IS NULL;

-- Verify
SELECT
  is_pm_job,
  COUNT(*) as project_count,
  AVG(contract_value)::numeric(12,2) as avg_contract_value
FROM projects
GROUP BY is_pm_job;
