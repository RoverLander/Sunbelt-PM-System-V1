-- ============================================================================
-- AUDIT_RLS_POLICIES.sql
-- Comprehensive RLS Policy Audit for Sunbelt PM System
-- Per DEBUG_TEST_GUIDE.md - Phase 1.2
-- ============================================================================

-- ============================================================================
-- 1. TABLES WITHOUT RLS ENABLED
-- ============================================================================
SELECT 'AUDIT: Tables without RLS enabled' AS audit_section;

SELECT
  schemaname,
  tablename,
  'RLS NOT ENABLED' as issue,
  'CRITICAL' as severity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT IN ('schema_migrations') -- Exclude migration tracking
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = pg_tables.tablename
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
  );

-- ============================================================================
-- 2. TABLES WITHOUT ANY POLICIES
-- ============================================================================
SELECT 'AUDIT: Tables without any policies' AS audit_section;

SELECT
  t.tablename,
  'NO POLICIES' as issue,
  'CRITICAL' as severity
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT IN ('schema_migrations')
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = 'public'
  );

-- ============================================================================
-- 3. TABLES WITH factory_id BUT MISSING PC ROLE FILTER
-- ============================================================================
SELECT 'AUDIT: Tables with factory_id missing PC filtering' AS audit_section;

WITH factory_tables AS (
  SELECT DISTINCT table_name as tablename
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'factory_id'
)
SELECT
  ft.tablename,
  'POTENTIAL MISSING PC FACTORY FILTER' as issue,
  'HIGH' as severity,
  'Verify PC role can only see their factory data' as recommendation
FROM factory_tables ft;

-- ============================================================================
-- 4. LIST ALL EXISTING POLICIES
-- ============================================================================
SELECT 'EXISTING POLICIES BY TABLE' AS audit_section;

SELECT
  tablename,
  policyname,
  cmd as operation,
  permissive,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- ============================================================================
-- 5. POLICY OPERATION COVERAGE CHECK
-- ============================================================================
SELECT 'POLICY OPERATION COVERAGE' AS audit_section;

WITH policy_coverage AS (
  SELECT
    tablename,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as has_select,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as has_insert,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as has_update,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as has_delete,
    COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) as has_all
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT
  tablename,
  CASE WHEN has_select = 0 AND has_all = 0 THEN '❌ MISSING' ELSE '✅' END as select_policy,
  CASE WHEN has_insert = 0 AND has_all = 0 THEN '❌ MISSING' ELSE '✅' END as insert_policy,
  CASE WHEN has_update = 0 AND has_all = 0 THEN '❌ MISSING' ELSE '✅' END as update_policy,
  CASE WHEN has_delete = 0 AND has_all = 0 THEN '⚠️ MISSING (may be OK)' ELSE '✅' END as delete_policy
FROM policy_coverage
ORDER BY tablename;

-- ============================================================================
-- 6. CRITICAL TABLES CHECK
-- ============================================================================
SELECT 'CRITICAL TABLES RLS STATUS' AS audit_section;

-- Check critical tables for the application
SELECT
  'projects' as table_name,
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public') as has_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public') as policy_count
UNION ALL
SELECT
  'tasks',
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public')
UNION ALL
SELECT
  'modules',
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'modules' AND schemaname = 'public')
UNION ALL
SELECT
  'users',
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public')
UNION ALL
SELECT
  'rfis',
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'rfis' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'rfis' AND schemaname = 'public')
UNION ALL
SELECT
  'submittals',
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'submittals' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'submittals' AND schemaname = 'public')
UNION ALL
SELECT
  'workers',
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'workers' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'workers' AND schemaname = 'public')
UNION ALL
SELECT
  'factories',
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'factories' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'factories' AND schemaname = 'public')
UNION ALL
SELECT
  'sales_quotes',
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'sales_quotes' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'sales_quotes' AND schemaname = 'public')
UNION ALL
SELECT
  'file_attachments',
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'file_attachments' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'file_attachments' AND schemaname = 'public');

-- ============================================================================
-- 7. STORAGE BUCKET POLICIES CHECK
-- ============================================================================
SELECT 'STORAGE BUCKET POLICIES' AS audit_section;

SELECT
  name as bucket_name,
  public as is_public,
  CASE
    WHEN public THEN '⚠️ PUBLIC - Review if intended'
    ELSE '✅ Private'
  END as status
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 'RLS AUDIT SUMMARY' AS audit_section;
SELECT
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') as tables_with_policies,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%') as total_public_tables;

SELECT 'AUDIT_RLS_POLICIES.sql COMPLETE' AS status;
SELECT 'Review results and add policies for any tables marked CRITICAL or MISSING' AS next_step;
