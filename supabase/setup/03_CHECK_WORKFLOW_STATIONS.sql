-- ============================================================================
-- QUICK FIX: Add missing columns to workflow_stations
-- ============================================================================

-- Check current structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workflow_stations'
ORDER BY ordinal_position;
