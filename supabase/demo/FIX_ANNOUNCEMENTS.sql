-- ============================================================================
-- FIX_ANNOUNCEMENTS.sql
-- Fixes notification/announcement issues:
-- 1. Creates announcement_dismissals table (required for dismiss functionality)
-- 2. Adds 'type' column (component expects 'type', DB has 'announcement_type')
-- 3. Removes duplicate announcements
-- 4. Makes all announcements dismissible
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Create announcement_dismissals table
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own dismissals
DROP POLICY IF EXISTS "announcement_dismissals_select" ON announcement_dismissals;
CREATE POLICY "announcement_dismissals_select" ON announcement_dismissals
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "announcement_dismissals_insert" ON announcement_dismissals;
CREATE POLICY "announcement_dismissals_insert" ON announcement_dismissals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "announcement_dismissals_delete" ON announcement_dismissals;
CREATE POLICY "announcement_dismissals_delete" ON announcement_dismissals
  FOR DELETE TO authenticated USING (user_id = auth.uid());

SELECT 'Step 1: Created announcement_dismissals table' AS status;

-- ============================================================================
-- STEP 2: Add 'type' column to announcements (component expects this)
-- ============================================================================
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS type VARCHAR(30);

-- Sync type from announcement_type
UPDATE announcements
SET type = announcement_type
WHERE type IS NULL AND announcement_type IS NOT NULL;

-- Also sync announcement_type from type if it was set that way
UPDATE announcements
SET announcement_type = type
WHERE announcement_type IS NULL AND type IS NOT NULL;

-- Default to 'info' if both are null
UPDATE announcements
SET type = 'info', announcement_type = 'info'
WHERE type IS NULL AND announcement_type IS NULL;

SELECT 'Step 2: Added type column and synced values' AS status;

-- ============================================================================
-- STEP 3: Remove duplicate announcements (keep only one of each title)
-- ============================================================================
DELETE FROM announcements
WHERE id NOT IN (
  SELECT DISTINCT ON (title) id
  FROM announcements
  ORDER BY title, created_at DESC
);

SELECT 'Step 3: Removed duplicate announcements' AS status;

-- ============================================================================
-- STEP 4: Make all announcements dismissible
-- ============================================================================
UPDATE announcements SET is_dismissible = true WHERE is_dismissible = false;

SELECT 'Step 4: Made all announcements dismissible' AS status;

-- ============================================================================
-- STEP 5: Add 'message' column if missing (some schemas expect it)
-- ============================================================================
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message TEXT;

-- Sync message from content
UPDATE announcements
SET message = content
WHERE message IS NULL AND content IS NOT NULL;

-- Sync content from message
UPDATE announcements
SET content = message
WHERE content IS NULL AND message IS NOT NULL;

SELECT 'Step 5: Synced message/content columns' AS status;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT
  id,
  title,
  type,
  announcement_type,
  is_dismissible,
  is_active,
  starts_at,
  expires_at
FROM announcements
WHERE is_active = true
ORDER BY created_at DESC;

SELECT 'FIX_ANNOUNCEMENTS.sql completed successfully!' AS final_status;
