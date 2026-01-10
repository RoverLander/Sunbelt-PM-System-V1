-- ============================================================================
-- PART 2: CREATE PROJECT_LOGS TABLE (Run this second)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entry_type VARCHAR(50) NOT NULL DEFAULT 'note',
  title VARCHAR(255),
  content TEXT,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_logs_project ON project_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_user ON project_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_type ON project_logs(entry_type);
CREATE INDEX IF NOT EXISTS idx_project_logs_date ON project_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_project_logs_pinned ON project_logs(is_pinned) WHERE is_pinned = true;

-- Enable RLS
ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (allow all authenticated users for now)
DROP POLICY IF EXISTS "project_logs_all" ON project_logs;
CREATE POLICY "project_logs_all" ON project_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
