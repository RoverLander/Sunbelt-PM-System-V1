-- ============================================================================
-- PWA SCHEMA REMEDIATION FIX
-- Created: January 16, 2026
-- Purpose: Fix for partial migration - drops existing policies before recreating
-- ============================================================================

-- Drop existing policies if they exist (from partial migration)
DROP POLICY IF EXISTS "Workers can view own sessions" ON worker_sessions;
DROP POLICY IF EXISTS "System can create sessions" ON worker_sessions;
DROP POLICY IF EXISTS "Sessions can be revoked" ON worker_sessions;

DROP POLICY IF EXISTS "Users can view factory POs" ON purchase_orders;
DROP POLICY IF EXISTS "PMs and above can create POs" ON purchase_orders;
DROP POLICY IF EXISTS "PMs and above can update POs" ON purchase_orders;

DROP POLICY IF EXISTS "Users can view factory receipts" ON inventory_receipts;
DROP POLICY IF EXISTS "Floor workers can create receipts" ON inventory_receipts;
DROP POLICY IF EXISTS "PMs can update receipts" ON inventory_receipts;

-- ============================================================================
-- SECTION 1: WORKER AUTHENTICATION COLUMNS (if not already added)
-- ============================================================================

ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(60);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin_attempts INTEGER DEFAULT 0;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workers_pin_locked
ON workers(pin_locked_until)
WHERE pin_locked_until IS NOT NULL;

-- ============================================================================
-- SECTION 2: WORKER SESSIONS TABLE (if not already created)
-- ============================================================================

CREATE TABLE IF NOT EXISTS worker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  login_source VARCHAR(20) DEFAULT 'pwa'
);

CREATE INDEX IF NOT EXISTS idx_worker_sessions_worker ON worker_sessions(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_sessions_factory ON worker_sessions(factory_id);
CREATE INDEX IF NOT EXISTS idx_worker_sessions_token ON worker_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_worker_sessions_active
ON worker_sessions(worker_id, expires_at)
WHERE revoked_at IS NULL;

ALTER TABLE worker_sessions ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Workers can view own sessions" ON worker_sessions
  FOR SELECT
  USING (
    worker_id IN (
      SELECT id FROM workers
      WHERE factory_id IN (
        SELECT factory_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can create sessions" ON worker_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sessions can be revoked" ON worker_sessions
  FOR UPDATE
  USING (
    worker_id IN (
      SELECT id FROM workers
      WHERE factory_id IN (
        SELECT factory_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- SECTION 3: PURCHASE ORDERS TABLE (if not already created)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  po_number VARCHAR(50) NOT NULL,
  vendor_name VARCHAR(200) NOT NULL,
  vendor_contact VARCHAR(200),
  vendor_email VARCHAR(200),
  vendor_phone VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN (
    'Draft', 'Pending Approval', 'Approved', 'Ordered',
    'Partial', 'Received', 'Closed', 'Cancelled'
  )),
  order_date DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  line_items JSONB DEFAULT '[]',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  shipping DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_factory ON purchase_orders(factory_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_expected ON purchase_orders(expected_delivery);

-- Only create unique index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_purchase_orders_unique_po') THEN
    CREATE UNIQUE INDEX idx_purchase_orders_unique_po ON purchase_orders(factory_id, po_number);
  END IF;
END $$;

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view factory POs" ON purchase_orders
  FOR SELECT
  USING (
    factory_id IN (SELECT factory_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('VP', 'Director', 'Admin')
    )
  );

CREATE POLICY "PMs and above can create POs" ON purchase_orders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('VP', 'Director', 'Admin', 'Plant_GM', 'Production_Manager', 'Project_Manager')
    )
  );

CREATE POLICY "PMs and above can update POs" ON purchase_orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('VP', 'Director', 'Admin', 'Plant_GM', 'Production_Manager', 'Project_Manager')
    )
  );

-- ============================================================================
-- SECTION 4: INVENTORY RECEIPTS TABLE (if not already created)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  po_line_index INTEGER,
  part_name VARCHAR(200) NOT NULL,
  part_number VARCHAR(100),
  quantity_expected INTEGER DEFAULT 0,
  quantity_received INTEGER NOT NULL,
  quantity_damaged INTEGER DEFAULT 0,
  received_by UUID REFERENCES workers(id),
  received_by_user UUID REFERENCES users(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  storage_location VARCHAR(100),
  gps_location JSONB,
  photo_urls TEXT[] DEFAULT '{}',
  status VARCHAR(30) DEFAULT 'Received' CHECK (status IN (
    'Received', 'Partial', 'Damaged', 'Rejected', 'Verified'
  )),
  notes TEXT,
  damage_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inventory_receipts_factory ON inventory_receipts(factory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_receipts_po ON inventory_receipts(po_id);
CREATE INDEX IF NOT EXISTS idx_inventory_receipts_received_at ON inventory_receipts(received_at);
CREATE INDEX IF NOT EXISTS idx_inventory_receipts_status ON inventory_receipts(status);
CREATE INDEX IF NOT EXISTS idx_inventory_receipts_part ON inventory_receipts(part_name);

ALTER TABLE inventory_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view factory receipts" ON inventory_receipts
  FOR SELECT
  USING (
    factory_id IN (SELECT factory_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('VP', 'Director', 'Admin')
    )
  );

CREATE POLICY "Floor workers can create receipts" ON inventory_receipts
  FOR INSERT
  WITH CHECK (
    factory_id IN (SELECT factory_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('VP', 'Director', 'Admin', 'Plant_GM', 'Production_Manager', 'Project_Manager', 'QC')
    )
  );

CREATE POLICY "PMs can update receipts" ON inventory_receipts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('VP', 'Director', 'Admin', 'Plant_GM', 'Production_Manager', 'Project_Manager', 'QC')
    )
  );

-- ============================================================================
-- SECTION 5: LINK LONG_LEAD_ITEMS TO PURCHASE_ORDERS
-- ============================================================================

ALTER TABLE long_lead_items ADD COLUMN IF NOT EXISTS po_id UUID REFERENCES purchase_orders(id);
ALTER TABLE long_lead_items ADD COLUMN IF NOT EXISTS po_line_index INTEGER;

CREATE INDEX IF NOT EXISTS idx_long_lead_items_po ON long_lead_items(po_id);

-- ============================================================================
-- SECTION 6: TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_receipts_updated_at ON inventory_receipts;
CREATE TRIGGER update_inventory_receipts_updated_at
  BEFORE UPDATE ON inventory_receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check tables exist
DO $$
BEGIN
  RAISE NOTICE 'Migration complete. Verifying...';

  -- Check worker columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workers' AND column_name = 'pin_hash') THEN
    RAISE NOTICE '✓ workers.pin_hash column exists';
  END IF;

  -- Check tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worker_sessions') THEN
    RAISE NOTICE '✓ worker_sessions table exists';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN
    RAISE NOTICE '✓ purchase_orders table exists';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_receipts') THEN
    RAISE NOTICE '✓ inventory_receipts table exists';
  END IF;
END $$;
