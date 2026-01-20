-- ============================================================================
-- Migration: Add department column to workers table
-- Created: January 20, 2026
-- Purpose: Allow direct department assignment instead of deriving from station
-- ============================================================================

-- Add department column to workers table
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS department VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN workers.department IS 'Worker department - Framing, Rough Carpentry, Electrical, Plumbing, HVAC, Interior Rough, Interior Finish, Inspection, Staging, QC, Material Handling';

-- Create index for department filtering
CREATE INDEX IF NOT EXISTS idx_workers_department ON workers(department);

-- ============================================================================
-- DEPARTMENT DEFINITIONS
-- ============================================================================
-- Based on station to department mapping:
--   FRAME_WELD -> Framing
--   ROUGH_CARP, EXT_SIDING -> Rough Carpentry
--   ELEC_ROUGH -> Electrical
--   PLUMB_ROUGH -> Plumbing
--   HVAC -> HVAC
--   INT_ROUGH -> Interior Rough
--   INT_FINISH -> Interior Finish
--   INWALL_INSP, FINAL_INSP -> Inspection
--   STAGING, PICKUP -> Staging
--   NULL -> QC / Material Handling (floaters)

-- Update existing workers with department based on their primary_station_id
UPDATE workers w
SET department = CASE
    WHEN st.code = 'FRAME_WELD' THEN 'Framing'
    WHEN st.code IN ('ROUGH_CARP', 'EXT_SIDING') THEN 'Rough Carpentry'
    WHEN st.code = 'ELEC_ROUGH' THEN 'Electrical'
    WHEN st.code = 'PLUMB_ROUGH' THEN 'Plumbing'
    WHEN st.code = 'HVAC' THEN 'HVAC'
    WHEN st.code = 'INT_ROUGH' THEN 'Interior Rough'
    WHEN st.code = 'INT_FINISH' THEN 'Interior Finish'
    WHEN st.code IN ('INWALL_INSP', 'FINAL_INSP') THEN 'Inspection'
    WHEN st.code IN ('STAGING', 'PICKUP') THEN 'Staging'
    ELSE 'QC'
END
FROM station_templates st
WHERE w.primary_station_id = st.id
  AND w.department IS NULL;

-- For workers without a primary station, set department to QC or Material Handling
UPDATE workers
SET department = 'QC'
WHERE primary_station_id IS NULL
  AND department IS NULL;

-- ============================================================================
-- VALID DEPARTMENTS ENUM (for reference)
-- ============================================================================
-- Rather than a constraint, we'll use this list in the application:
-- 1. Framing (smallest after QC)
-- 2. Rough Carpentry (biggest)
-- 3. Electrical
-- 4. Plumbing
-- 5. HVAC
-- 6. Interior Rough
-- 7. Interior Finish
-- 8. Inspection
-- 9. Staging (typically 1 person, cross-trained)
-- 10. QC (smallest)
-- 11. Material Handling (support)

-- Create a helper function to get department sort order (for UI display)
CREATE OR REPLACE FUNCTION get_department_sort_order(dept TEXT)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE dept
    WHEN 'Framing' THEN 1
    WHEN 'Rough Carpentry' THEN 2
    WHEN 'Electrical' THEN 3
    WHEN 'Plumbing' THEN 4
    WHEN 'HVAC' THEN 5
    WHEN 'Interior Rough' THEN 6
    WHEN 'Interior Finish' THEN 7
    WHEN 'Inspection' THEN 8
    WHEN 'Staging' THEN 9
    WHEN 'QC' THEN 10
    WHEN 'Material Handling' THEN 11
    ELSE 99
  END;
$$;
