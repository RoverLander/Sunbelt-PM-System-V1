-- ============================================================================
-- Add missing 'is_external' column to tasks table
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add 'is_external' column if it doesn't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false;

-- Verify the column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'is_external';
