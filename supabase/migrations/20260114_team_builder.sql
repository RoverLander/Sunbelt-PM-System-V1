-- ============================================================================
-- Team Builder Migration
-- ============================================================================
-- Creates tables for organizing PMs into teams for Director/VP management.
-- Supports many-to-many relationships (PM can be in multiple teams).
--
-- Created: January 14, 2026
-- ============================================================================

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================
-- Stores team definitions created by Directors/VPs

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',  -- Hex color for visual distinction
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by creator
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

-- ============================================================================
-- TEAM MEMBERS TABLE (Junction Table)
-- ============================================================================
-- Many-to-many relationship between teams and users (PMs/Directors)

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate assignments
  UNIQUE(team_id, user_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- ============================================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR TEAMS
-- ============================================================================

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "teams_select_policy" ON teams;
DROP POLICY IF EXISTS "teams_insert_policy" ON teams;
DROP POLICY IF EXISTS "teams_update_policy" ON teams;
DROP POLICY IF EXISTS "teams_delete_policy" ON teams;

-- Directors and VPs can view all teams
CREATE POLICY "teams_select_policy" ON teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Director', 'VP', 'Admin')
    )
  );

-- Directors and VPs can create teams
CREATE POLICY "teams_insert_policy" ON teams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Director', 'VP', 'Admin')
    )
  );

-- Directors and VPs can update teams
CREATE POLICY "teams_update_policy" ON teams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Director', 'VP', 'Admin')
    )
  );

-- Directors and VPs can delete teams
CREATE POLICY "teams_delete_policy" ON teams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Director', 'VP', 'Admin')
    )
  );

-- ============================================================================
-- RLS POLICIES FOR TEAM_MEMBERS
-- ============================================================================

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;

-- Directors and VPs can view all team memberships
CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Director', 'VP', 'Admin')
    )
  );

-- Directors and VPs can add members to teams
CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Director', 'VP', 'Admin')
    )
  );

-- Directors and VPs can remove members from teams
CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Director', 'VP', 'Admin')
    )
  );

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teams_updated_at_trigger ON teams;
CREATE TRIGGER teams_updated_at_trigger
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();

-- ============================================================================
-- SAMPLE TEAMS (Optional - can be removed for production)
-- ============================================================================

-- Insert sample teams if none exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM teams LIMIT 1) THEN
    INSERT INTO teams (name, description, color) VALUES
      ('Southeast Region', 'PMs handling Southeast factory projects', '#22c55e'),
      ('Northwest Region', 'PMs handling Northwest factory projects', '#3b82f6'),
      ('Large Projects', 'PMs assigned to high-value projects', '#f59e0b');
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
    RAISE NOTICE 'SUCCESS: teams table created';
  ELSE
    RAISE EXCEPTION 'FAILED: teams table not created';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    RAISE NOTICE 'SUCCESS: team_members table created';
  ELSE
    RAISE EXCEPTION 'FAILED: team_members table not created';
  END IF;
END $$;
