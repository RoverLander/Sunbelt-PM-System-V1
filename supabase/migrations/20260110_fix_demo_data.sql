-- ============================================================================
-- Fix Demo Data: Roles, Financial Figures, and Dates
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. UPDATE CANDY JUHNKE TO DIRECTOR ROLE
-- ============================================================================
UPDATE users
SET role = 'Director'
WHERE email = 'candy.juhnke@sunbeltmodular.com'
   OR name ILIKE '%Candy Juhnke%';

-- Verify Candy's role update
SELECT name, email, role FROM users WHERE name ILIKE '%Candy%';

-- ============================================================================
-- 2. ADD CONTRACT VALUES TO PROJECTS ($1M - $8M range)
-- ============================================================================
-- First, ensure the contract_value column exists
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_value DECIMAL(15,2);

-- Update projects with realistic contract values
UPDATE projects SET contract_value =
  CASE
    WHEN project_number LIKE '%PMI%' THEN 2450000.00
    WHEN project_number LIKE '%NWBS%' THEN 5750000.00
    WHEN project_number LIKE '%SMM%' THEN 3200000.00
    WHEN project_number LIKE '%AMT%' THEN 4100000.00
    WHEN project_number LIKE '%BRIT%' THEN 6800000.00
    WHEN project_number LIKE '%CB%' THEN 1850000.00
    WHEN project_number LIKE '%IND%' THEN 7200000.00
    WHEN project_number LIKE '%MRS%' THEN 2950000.00
    WHEN project_number LIKE '%SSI%' THEN 4500000.00
    WHEN project_number LIKE '%SEM%' THEN 3750000.00
    ELSE (RANDOM() * 7000000 + 1000000)::DECIMAL(15,2)
  END
WHERE contract_value IS NULL OR contract_value = 0;

-- ============================================================================
-- 3. UPDATE PROJECT DATES (Dec 2025 - May 2026 range)
-- ============================================================================
-- Today is Jan 10, 2026 - dates should span from ~Dec 2025 to May 2026

-- Update start_date for projects (ranging from 30-90 days ago)
UPDATE projects SET start_date =
  CASE
    WHEN id = (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET 0) THEN '2025-11-15'::date
    WHEN id = (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET 1) THEN '2025-12-01'::date
    WHEN id = (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET 2) THEN '2025-12-10'::date
    WHEN id = (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET 3) THEN '2025-12-20'::date
    WHEN id = (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET 4) THEN '2026-01-02'::date
    ELSE (CURRENT_DATE - (RANDOM() * 60 + 10)::int)
  END
WHERE start_date IS NULL OR start_date < '2025-01-01';

-- Update delivery_date for projects (ranging from Feb to May 2026)
UPDATE projects SET delivery_date =
  CASE
    WHEN id = (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET 0) THEN '2026-03-15'::date
    WHEN id = (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET 1) THEN '2026-04-10'::date
    WHEN id = (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET 2) THEN '2026-05-01'::date
    WHEN id = (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET 3) THEN '2026-02-28'::date
    WHEN id = (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET 4) THEN '2026-04-25'::date
    ELSE (CURRENT_DATE + (RANDOM() * 120 + 30)::int)
  END
WHERE delivery_date IS NULL OR delivery_date < '2025-01-01';

-- ============================================================================
-- 4. UPDATE TASK DUE DATES (mix of overdue, current, and future)
-- ============================================================================
-- Some overdue (past), some due soon, some in the future

-- Update tasks to have realistic due dates
UPDATE tasks SET due_date =
  CASE
    -- ~30% overdue (past dates for demo purposes)
    WHEN RANDOM() < 0.3 THEN (CURRENT_DATE - (RANDOM() * 45 + 5)::int)
    -- ~40% due within next 2 weeks
    WHEN RANDOM() < 0.7 THEN (CURRENT_DATE + (RANDOM() * 14)::int)
    -- ~30% due in 2-8 weeks
    ELSE (CURRENT_DATE + (RANDOM() * 42 + 14)::int)
  END
WHERE due_date IS NULL OR due_date < '2025-01-01' OR due_date > '2027-01-01';

-- ============================================================================
-- 5. UPDATE RFI DUE DATES
-- ============================================================================
UPDATE rfis SET due_date =
  CASE
    -- ~25% overdue
    WHEN RANDOM() < 0.25 THEN (CURRENT_DATE - (RANDOM() * 30 + 3)::int)
    -- ~50% due within next 3 weeks
    WHEN RANDOM() < 0.75 THEN (CURRENT_DATE + (RANDOM() * 21)::int)
    -- ~25% due in 3-6 weeks
    ELSE (CURRENT_DATE + (RANDOM() * 21 + 21)::int)
  END
WHERE due_date IS NULL OR due_date < '2025-01-01' OR due_date > '2027-01-01';

-- Update RFI date_sent to be before due_date
UPDATE rfis SET date_sent = due_date - (RANDOM() * 14 + 7)::int
WHERE date_sent IS NULL OR date_sent > due_date;

-- ============================================================================
-- 6. UPDATE SUBMITTAL DUE DATES
-- ============================================================================
UPDATE submittals SET due_date =
  CASE
    -- ~20% overdue
    WHEN RANDOM() < 0.20 THEN (CURRENT_DATE - (RANDOM() * 20 + 5)::int)
    -- ~50% due within next 4 weeks
    WHEN RANDOM() < 0.70 THEN (CURRENT_DATE + (RANDOM() * 28)::int)
    -- ~30% due in 4-10 weeks
    ELSE (CURRENT_DATE + (RANDOM() * 42 + 28)::int)
  END
WHERE due_date IS NULL OR due_date < '2025-01-01' OR due_date > '2027-01-01';

-- Update submittal date_submitted to be before due_date (for submitted items)
UPDATE submittals SET date_submitted = due_date - (RANDOM() * 10 + 5)::int
WHERE status IN ('Submitted', 'Under Review', 'Approved', 'Approved as Noted', 'Rejected')
  AND (date_submitted IS NULL OR date_submitted > due_date);

-- ============================================================================
-- 7. UPDATE MILESTONE DUE DATES
-- ============================================================================
UPDATE milestones SET due_date =
  CASE
    -- Spread milestones from Jan to May 2026
    WHEN RANDOM() < 0.2 THEN '2026-01-20'::date
    WHEN RANDOM() < 0.4 THEN '2026-02-15'::date
    WHEN RANDOM() < 0.6 THEN '2026-03-10'::date
    WHEN RANDOM() < 0.8 THEN '2026-04-05'::date
    ELSE '2026-05-01'::date
  END
WHERE due_date IS NULL OR due_date < '2025-01-01' OR due_date > '2027-01-01';

-- ============================================================================
-- 8. UPDATE CREATED_AT / UPDATED_AT TIMESTAMPS
-- ============================================================================
-- Make sure created_at timestamps are realistic (within last 2-3 months)
UPDATE projects SET created_at = start_date::timestamp + interval '1 day'
WHERE created_at < '2025-01-01';

UPDATE projects SET updated_at = CURRENT_TIMESTAMP - (RANDOM() * 7)::int * interval '1 day';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check Candy's role
SELECT 'Candy Role Check:' as check_type, name, email, role FROM users WHERE name ILIKE '%Candy%';

-- Check contract values
SELECT 'Contract Values:' as check_type, project_number, name, contract_value
FROM projects ORDER BY contract_value DESC LIMIT 5;

-- Check date ranges
SELECT 'Date Ranges:' as check_type,
  MIN(due_date) as earliest_due,
  MAX(due_date) as latest_due,
  COUNT(*) as total_tasks
FROM tasks;

SELECT 'Project Dates:' as check_type,
  project_number,
  start_date,
  delivery_date,
  contract_value
FROM projects
ORDER BY start_date;
