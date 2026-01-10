-- ============================================================================
-- FIX 1: Create floor_plan_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS floor_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  page_id UUID REFERENCES floor_plan_pages(id) ON DELETE CASCADE,

  -- Position on floor plan (percentage-based for responsiveness)
  x_position NUMERIC(5,2) NOT NULL DEFAULT 50,
  y_position NUMERIC(5,2) NOT NULL DEFAULT 50,

  -- Item details
  item_type VARCHAR(50) NOT NULL DEFAULT 'marker',
  label VARCHAR(100),
  description TEXT,
  status VARCHAR(30) DEFAULT 'pending',

  -- Linked entities (optional)
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  rfi_id UUID REFERENCES rfis(id) ON DELETE SET NULL,
  submittal_id UUID REFERENCES submittals(id) ON DELETE SET NULL,

  -- Metadata
  color VARCHAR(20) DEFAULT '#3b82f6',
  icon VARCHAR(50),
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_floor_plan_items_plan ON floor_plan_items(floor_plan_id);
CREATE INDEX IF NOT EXISTS idx_floor_plan_items_page ON floor_plan_items(page_id);
CREATE INDEX IF NOT EXISTS idx_floor_plan_items_task ON floor_plan_items(task_id);
CREATE INDEX IF NOT EXISTS idx_floor_plan_items_status ON floor_plan_items(status);

-- Enable RLS
ALTER TABLE floor_plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "floor_plan_items_all" ON floor_plan_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- FIX 2: Enable RLS on tasks table
-- ============================================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_all'
  ) THEN
    CREATE POLICY "tasks_all" ON tasks
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- FIX 3: Update projects without owner (set to first admin user)
-- Optional: You may want to manually assign these
-- ============================================================================

-- First, let's see which projects are affected:
-- SELECT id, project_number, name FROM projects WHERE owner_id IS NULL;

-- Option A: Set a default owner (uncomment and replace UUID)
-- UPDATE projects SET owner_id = 'YOUR-ADMIN-USER-UUID' WHERE owner_id IS NULL;

-- Option B: Set owner to primary_pm if available
UPDATE projects
SET owner_id = primary_pm_id
WHERE owner_id IS NULL AND primary_pm_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'floor_plan_items created' AS fix,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'floor_plan_items') AS success;

SELECT 'tasks RLS enabled' AS fix,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'tasks') AS success;

SELECT 'Projects still without owner' AS check,
  COUNT(*) AS count FROM projects WHERE owner_id IS NULL;
