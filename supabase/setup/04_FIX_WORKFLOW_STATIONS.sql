-- ============================================================================
-- FIX: workflow_stations column mismatch
-- ============================================================================
-- Frontend uses: station.name
-- Database has:  station_name
--
-- Solution: Add 'name' column and copy values from station_name
-- ============================================================================

-- Add the 'name' column
ALTER TABLE workflow_stations ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- Copy values from station_name to name
UPDATE workflow_stations SET name = station_name WHERE name IS NULL;

-- Add other columns the frontend might need (won't hurt if they exist)
ALTER TABLE workflow_stations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE workflow_stations ADD COLUMN IF NOT EXISTS default_owner VARCHAR(50);
ALTER TABLE workflow_stations ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true;

-- Verify the fix
SELECT station_key, station_name, name, phase FROM workflow_stations ORDER BY phase, display_order;
