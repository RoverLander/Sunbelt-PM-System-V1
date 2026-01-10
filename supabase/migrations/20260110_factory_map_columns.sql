-- ============================================================================
-- FACTORY MAP - DATABASE MIGRATION
-- ============================================================================
-- Version: 1.0
-- Date: January 10, 2026
-- Description: Add delivery location columns for Factory Map feature
--
-- This migration adds:
-- 1. delivery_city - Delivery destination city
-- 2. delivery_state - Delivery destination state (2-letter code)
-- 3. Sample data population for existing projects
-- ============================================================================

-- ============================================================================
-- SECTION 1: ADD DELIVERY LOCATION COLUMNS TO PROJECTS TABLE
-- ============================================================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS delivery_state VARCHAR(2);

-- Create indexes for map queries
CREATE INDEX IF NOT EXISTS idx_projects_delivery_state ON projects(delivery_state);
CREATE INDEX IF NOT EXISTS idx_projects_delivery_city ON projects(delivery_city);
CREATE INDEX IF NOT EXISTS idx_projects_factory ON projects(factory);

COMMENT ON COLUMN projects.delivery_city IS 'Delivery destination city for Factory Map visualization';
COMMENT ON COLUMN projects.delivery_state IS 'Delivery destination state (2-letter abbreviation)';

-- ============================================================================
-- SECTION 2: POPULATE SAMPLE DELIVERY LOCATIONS FOR EXISTING PROJECTS
-- ============================================================================
-- Maps factory locations to realistic delivery destinations within their regions

-- PMI (California) factory projects -> Southwest deliveries
UPDATE projects
SET
  delivery_city = CASE (RANDOM() * 5)::INT
    WHEN 0 THEN 'Phoenix'
    WHEN 1 THEN 'Tucson'
    WHEN 2 THEN 'San Diego'
    WHEN 3 THEN 'Las Vegas'
    WHEN 4 THEN 'Albuquerque'
    ELSE 'Los Angeles'
  END,
  delivery_state = CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'AZ'
    WHEN 1 THEN 'CA'
    WHEN 2 THEN 'NV'
    ELSE 'NM'
  END
WHERE factory = 'PMI' AND delivery_state IS NULL;

-- Southeast factory projects (SEMO, WM-EAST, CB) -> Southeast US deliveries
UPDATE projects
SET
  delivery_city = CASE (RANDOM() * 7)::INT
    WHEN 0 THEN 'Orlando'
    WHEN 1 THEN 'Tampa'
    WHEN 2 THEN 'Jacksonville'
    WHEN 3 THEN 'Atlanta'
    WHEN 4 THEN 'Charlotte'
    WHEN 5 THEN 'Savannah'
    WHEN 6 THEN 'Nashville'
    ELSE 'Miami'
  END,
  delivery_state = CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'FL'
    WHEN 1 THEN 'GA'
    WHEN 2 THEN 'NC'
    WHEN 3 THEN 'TN'
    ELSE 'SC'
  END
WHERE factory IN ('SEMO', 'WM-EAST', 'CB') AND delivery_state IS NULL;

-- Texas factory projects (SSI, AMTEX) -> Texas/Southwest deliveries
UPDATE projects
SET
  delivery_city = CASE (RANDOM() * 6)::INT
    WHEN 0 THEN 'Dallas'
    WHEN 1 THEN 'Houston'
    WHEN 2 THEN 'San Antonio'
    WHEN 3 THEN 'Austin'
    WHEN 4 THEN 'Fort Worth'
    WHEN 5 THEN 'El Paso'
    ELSE 'Plano'
  END,
  delivery_state = 'TX'
WHERE factory IN ('SSI', 'AMTEX') AND delivery_state IS NULL;

-- California factory projects (WM-WEST, MM) -> West Coast deliveries
UPDATE projects
SET
  delivery_city = CASE (RANDOM() * 6)::INT
    WHEN 0 THEN 'Los Angeles'
    WHEN 1 THEN 'San Diego'
    WHEN 2 THEN 'San Francisco'
    WHEN 3 THEN 'Sacramento'
    WHEN 4 THEN 'San Jose'
    WHEN 5 THEN 'Fresno'
    ELSE 'Oakland'
  END,
  delivery_state = 'CA'
WHERE factory IN ('WM-WEST', 'MM') AND delivery_state IS NULL;

-- Pacific Northwest factory projects (NWBS, BRIT)
UPDATE projects
SET
  delivery_city = CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'Seattle'
    WHEN 1 THEN 'Portland'
    WHEN 2 THEN 'Tacoma'
    WHEN 3 THEN 'Spokane'
    ELSE 'Boise'
  END,
  delivery_state = CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'WA'
    WHEN 1 THEN 'OR'
    ELSE 'ID'
  END
WHERE factory IN ('NWBS', 'BRIT') AND delivery_state IS NULL;

-- Midwest factory projects (MRS, IND)
UPDATE projects
SET
  delivery_city = CASE (RANDOM() * 5)::INT
    WHEN 0 THEN 'Chicago'
    WHEN 1 THEN 'Columbus'
    WHEN 2 THEN 'Indianapolis'
    WHEN 3 THEN 'St. Louis'
    WHEN 4 THEN 'Kansas City'
    ELSE 'Cincinnati'
  END,
  delivery_state = CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'IL'
    WHEN 1 THEN 'OH'
    WHEN 2 THEN 'IN'
    WHEN 3 THEN 'MO'
    ELSE 'KS'
  END
WHERE factory IN ('MRS', 'IND') AND delivery_state IS NULL;

-- Northeast factory projects (MS, MG)
UPDATE projects
SET
  delivery_city = CASE (RANDOM() * 5)::INT
    WHEN 0 THEN 'New York'
    WHEN 1 THEN 'Philadelphia'
    WHEN 2 THEN 'Baltimore'
    WHEN 3 THEN 'Boston'
    WHEN 4 THEN 'Pittsburgh'
    ELSE 'Washington'
  END,
  delivery_state = CASE (RANDOM() * 5)::INT
    WHEN 0 THEN 'NY'
    WHEN 1 THEN 'PA'
    WHEN 2 THEN 'MD'
    WHEN 3 THEN 'MA'
    WHEN 4 THEN 'VA'
    ELSE 'DC'
  END
WHERE factory IN ('MS', 'MG') AND delivery_state IS NULL;

-- Any remaining projects without delivery locations -> assign based on project name hints
UPDATE projects
SET
  delivery_city = CASE
    WHEN name ILIKE '%AZ%' OR name ILIKE '%Arizona%' THEN 'Phoenix'
    WHEN name ILIKE '%FL%' OR name ILIKE '%Florida%' OR name ILIKE '%Disney%' OR name ILIKE '%Orlando%' THEN 'Orlando'
    WHEN name ILIKE '%TX%' OR name ILIKE '%Texas%' THEN 'Dallas'
    WHEN name ILIKE '%CA%' OR name ILIKE '%California%' THEN 'Los Angeles'
    WHEN name ILIKE '%GA%' OR name ILIKE '%Georgia%' OR name ILIKE '%Atlanta%' THEN 'Atlanta'
    WHEN name ILIKE '%NC%' OR name ILIKE '%North Carolina%' THEN 'Charlotte'
    ELSE 'Dallas'
  END,
  delivery_state = CASE
    WHEN name ILIKE '%AZ%' OR name ILIKE '%Arizona%' THEN 'AZ'
    WHEN name ILIKE '%FL%' OR name ILIKE '%Florida%' OR name ILIKE '%Disney%' OR name ILIKE '%Orlando%' THEN 'FL'
    WHEN name ILIKE '%TX%' OR name ILIKE '%Texas%' THEN 'TX'
    WHEN name ILIKE '%CA%' OR name ILIKE '%California%' THEN 'CA'
    WHEN name ILIKE '%GA%' OR name ILIKE '%Georgia%' OR name ILIKE '%Atlanta%' THEN 'GA'
    WHEN name ILIKE '%NC%' OR name ILIKE '%North Carolina%' THEN 'NC'
    ELSE 'TX'
  END
WHERE delivery_state IS NULL;

-- ============================================================================
-- SECTION 3: NORMALIZE FACTORY CODES TO MATCH FACTORY_LOCATIONS KEYS
-- ============================================================================
-- Factory codes in frontend: NWBS, BRIT, WM-WEST, MM, PMI, SSI, AMTEX, MRS, CB, IND, SEMO, WM-EAST, MS, MG

-- First, try to extract factory code from project_number prefix (e.g., 'PMI-6781' -> 'PMI')
UPDATE projects
SET factory = UPPER(SPLIT_PART(project_number, '-', 1))
WHERE project_number IS NOT NULL
  AND UPPER(SPLIT_PART(project_number, '-', 1)) IN (
    'NWBS', 'BRIT', 'WM', 'MM', 'PMI', 'SSI', 'AMTEX', 'MRS', 'CB', 'IND', 'SEMO', 'MS', 'MG'
  );

-- Handle 'SMM' prefix -> map to SEMO (Southeast Modular)
UPDATE projects SET factory = 'SEMO' WHERE UPPER(SPLIT_PART(project_number, '-', 1)) = 'SMM';

-- Map text-based factory names to codes
UPDATE projects SET factory = 'PMI' WHERE factory ILIKE '%Phoenix%' OR factory ILIKE '%Palomar%';
UPDATE projects SET factory = 'SEMO' WHERE factory ILIKE '%Southeast%';
UPDATE projects SET factory = 'SSI' WHERE factory ILIKE '%Texas%' OR factory ILIKE '%Waco%' OR factory ILIKE '%Sunbelt%';
UPDATE projects SET factory = 'AMTEX' WHERE factory ILIKE '%Dallas%' OR factory ILIKE '%AmTex%';
UPDATE projects SET factory = 'WM-WEST' WHERE factory ILIKE '%California%' OR factory ILIKE '%Stockton%';
UPDATE projects SET factory = 'NWBS' WHERE factory ILIKE '%Pacific%' OR factory ILIKE '%Northwest%' OR factory ILIKE '%Tacoma%';
UPDATE projects SET factory = 'CB' WHERE factory ILIKE '%Nashville%';
UPDATE projects SET factory = 'MRS' WHERE factory ILIKE '%Missouri%' OR factory ILIKE '%Springfield%';
UPDATE projects SET factory = 'WM-EAST' WHERE factory ILIKE '%Statesville%' OR factory ILIKE '%North Carolina%';

-- Set default factory for any remaining NULL values
UPDATE projects SET factory = 'SEMO' WHERE factory IS NULL OR factory = '';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FACTORY MAP MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Columns added to projects table:';
  RAISE NOTICE '  - delivery_city: Destination city for deliveries';
  RAISE NOTICE '  - delivery_state: Destination state (2-letter code)';
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes created:';
  RAISE NOTICE '  - idx_projects_delivery_state';
  RAISE NOTICE '  - idx_projects_delivery_city';
  RAISE NOTICE '  - idx_projects_factory';
  RAISE NOTICE '';
  RAISE NOTICE 'Sample data populated for existing projects';
  RAISE NOTICE '========================================';
END $$;
