-- ============================================================================
-- 20260118_building_specs_demo_data.sql
-- ============================================================================
-- Updates existing demo quotes and projects with building specifications
-- and PM flag data to demonstrate the new features.
-- ============================================================================

-- ============================================================================
-- SECTION 1: UPDATE SALES_QUOTES WITH BUILDING SPECS
-- ============================================================================

-- Update a high-value Educational quote with building specs (PM flagged)
UPDATE sales_quotes SET
  building_width = 48,
  building_length = 120,
  mod_width = 12,
  occupancy = 'E',
  building_type = 'EDUCATION',
  special_materials = '{"tt_p": true, "sprinklers": true, "plumbing": true}'::jsonb,
  is_pm_flagged = true,
  pm_flagged_at = NOW() - INTERVAL '3 days',
  pm_flag_notes = 'Large educational facility, requires PM oversight'
WHERE id = (
  SELECT id FROM sales_quotes
  WHERE quote_number LIKE 'Q-%' AND building_type ILIKE '%Education%'
  ORDER BY total_price DESC NULLS LAST
  LIMIT 1
);

-- Update a Healthcare quote with building specs (PM flagged)
UPDATE sales_quotes SET
  building_width = 36,
  building_length = 72,
  mod_width = 12,
  occupancy = 'I',
  building_type = 'HEALTHCARE',
  special_materials = '{"tt_p": false, "sprinklers": true, "plumbing": true}'::jsonb,
  is_pm_flagged = true,
  pm_flagged_at = NOW() - INTERVAL '5 days',
  pm_flag_notes = 'Medical facility with strict code requirements'
WHERE id = (
  SELECT id FROM sales_quotes
  WHERE quote_number LIKE 'Q-%' AND building_type ILIKE '%Health%'
  ORDER BY total_price DESC NULLS LAST
  LIMIT 1
);

-- Update a high-value quote (by price) with building specs
UPDATE sales_quotes SET
  building_width = 56,
  building_length = 140,
  mod_width = 14,
  occupancy = 'B',
  special_materials = '{"tt_p": true, "sprinklers": true, "plumbing": true}'::jsonb,
  is_pm_flagged = false
WHERE id = (
  SELECT id FROM sales_quotes
  WHERE quote_number LIKE 'Q-%' AND total_price > 500000
  ORDER BY total_price DESC
  LIMIT 1
);

-- Update another quote with different building specs (PM flagged)
UPDATE sales_quotes SET
  building_width = 40,
  building_length = 80,
  mod_width = 10,
  occupancy = 'B',
  special_materials = '{"tt_p": false, "sprinklers": true, "plumbing": true}'::jsonb,
  is_pm_flagged = true,
  pm_flagged_at = NOW() - INTERVAL '1 day',
  pm_flag_notes = 'Complex multi-module project'
WHERE id = (
  SELECT id FROM sales_quotes
  WHERE quote_number LIKE 'Q-%'
    AND module_count >= 2
    AND is_pm_flagged IS NOT TRUE
  ORDER BY created_at DESC
  LIMIT 1
);

-- Update remaining quotes without building specs with random values
UPDATE sales_quotes SET
  building_type = COALESCE(building_type, 'CUSTOM'),
  building_width = CASE WHEN building_width IS NULL THEN (ARRAY[36, 40, 48, 56])[floor(random() * 4 + 1)::int] ELSE building_width END,
  building_length = CASE WHEN building_length IS NULL THEN (ARRAY[60, 72, 80, 100, 120])[floor(random() * 5 + 1)::int] ELSE building_length END,
  mod_width = CASE WHEN mod_width IS NULL THEN (ARRAY[10, 12, 14])[floor(random() * 3 + 1)::int] ELSE mod_width END,
  module_count = CASE
    WHEN module_count IS NULL AND random() > 0.3 THEN (ARRAY[2, 4, 6, 8])[floor(random() * 4 + 1)::int]
    ELSE module_count
  END,
  occupancy = COALESCE(occupancy, (ARRAY['A', 'B', 'E', 'M', 'S'])[floor(random() * 5 + 1)::int]),
  special_materials = COALESCE(special_materials,
    jsonb_build_object(
      'tt_p', random() > 0.5,
      'sprinklers', random() > 0.3,
      'plumbing', random() > 0.4
    )
  )
WHERE quote_number LIKE 'Q-%'
  AND is_latest_version = true
  AND building_width IS NULL;

-- ============================================================================
-- SECTION 2: UPDATE PROJECTS WITH BUILDING SPECS
-- ============================================================================

-- Update high-value PM projects with building specs
UPDATE projects SET
  building_width = 48,
  building_length = 120,
  mod_width = 12,
  occupancy = 'B',
  special_materials = '{"tt_p": true, "sprinklers": true, "plumbing": true}'::jsonb,
  is_pm_job = true,
  pm_flagged_from_quote = true
WHERE id IN (
  SELECT id FROM projects
  WHERE project_number LIKE 'PRJ-%'
    AND is_pm_job = true
    AND contract_value > 500000
  ORDER BY contract_value DESC
  LIMIT 2
);

-- Update educational/classroom projects with building specs
UPDATE projects SET
  building_width = 36,
  building_length = 72,
  mod_width = 12,
  occupancy = 'E',
  building_type = 'EDUCATION',
  special_materials = '{"tt_p": false, "sprinklers": true, "plumbing": true}'::jsonb,
  is_pm_job = true,
  pm_flagged_from_quote = true
WHERE id IN (
  SELECT id FROM projects
  WHERE project_number LIKE 'PRJ-%'
    AND (building_type ILIKE '%education%' OR building_type ILIKE '%school%' OR building_type ILIKE '%classroom%')
  LIMIT 2
);

-- Update remaining projects with random building specs
UPDATE projects SET
  building_width = CASE WHEN building_width IS NULL THEN (ARRAY[36, 40, 48, 56])[floor(random() * 4 + 1)::int] ELSE building_width END,
  building_length = CASE WHEN building_length IS NULL THEN (ARRAY[60, 72, 80, 100, 120])[floor(random() * 5 + 1)::int] ELSE building_length END,
  mod_width = CASE WHEN mod_width IS NULL THEN (ARRAY[10, 12, 14])[floor(random() * 3 + 1)::int] ELSE mod_width END,
  occupancy = COALESCE(occupancy, (ARRAY['A', 'B', 'E', 'M', 'S'])[floor(random() * 5 + 1)::int]),
  special_materials = COALESCE(special_materials,
    jsonb_build_object(
      'tt_p', random() > 0.5,
      'sprinklers', random() > 0.3,
      'plumbing', random() > 0.4
    )
  )
WHERE project_number LIKE 'PRJ-%'
  AND building_width IS NULL
  AND status IN ('Planning', 'Pre-PM', 'PM Handoff', 'In Progress');

-- ============================================================================
-- SECTION 3: CREATE UNASSIGNED PM PROJECTS FOR DIRECTOR QUEUE
-- ============================================================================

-- Update some high-value Planning projects to be unassigned PM jobs
UPDATE projects SET
  is_pm_job = true,
  pm_flagged_from_quote = true,
  assigned_pm_id = NULL
WHERE id IN (
  SELECT id FROM projects
  WHERE project_number LIKE 'PRJ-%'
    AND status IN ('Planning', 'Pre-PM')
    AND contract_value > 500000
  ORDER BY random()
  LIMIT 5
);

-- Ensure we have at least 3 unassigned PM projects by adding more if needed
UPDATE projects SET
  is_pm_job = true,
  pm_flagged_from_quote = false,
  assigned_pm_id = NULL
WHERE id IN (
  SELECT p.id FROM projects p
  WHERE p.project_number LIKE 'PRJ-%'
    AND p.status = 'Planning'
    AND NOT EXISTS (
      SELECT 1 FROM projects p2
      WHERE p2.is_pm_job = true
        AND p2.assigned_pm_id IS NULL
        AND p2.status NOT IN ('Completed', 'Cancelled')
        AND p2.id = p.id
    )
  ORDER BY p.created_at DESC
  LIMIT GREATEST(0, 3 - (
    SELECT COUNT(*) FROM projects
    WHERE is_pm_job = true AND assigned_pm_id IS NULL AND status NOT IN ('Completed', 'Cancelled')
  ))
);

-- ============================================================================
-- SECTION 4: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  quote_with_specs INTEGER;
  quote_pm_flagged INTEGER;
  project_with_specs INTEGER;
  project_unassigned INTEGER;
BEGIN
  SELECT COUNT(*) INTO quote_with_specs FROM sales_quotes WHERE building_width IS NOT NULL;
  SELECT COUNT(*) INTO quote_pm_flagged FROM sales_quotes WHERE is_pm_flagged = true;
  SELECT COUNT(*) INTO project_with_specs FROM projects WHERE building_width IS NOT NULL;
  SELECT COUNT(*) INTO project_unassigned FROM projects WHERE is_pm_job = true AND assigned_pm_id IS NULL AND status NOT IN ('Completed', 'Cancelled', 'Archived');

  RAISE NOTICE '=== Building Specs & PM Flag Demo Data ===';
  RAISE NOTICE 'Quotes with building specs: %', quote_with_specs;
  RAISE NOTICE 'Quotes PM-flagged: %', quote_pm_flagged;
  RAISE NOTICE 'Projects with building specs: %', project_with_specs;
  RAISE NOTICE 'Unassigned PM projects (Director queue): %', project_unassigned;
END $$;
