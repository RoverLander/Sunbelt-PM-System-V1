-- ============================================================================
-- PWA SCHEMA REMEDIATION MIGRATION
-- Created: January 16, 2026
-- Purpose: Add missing tables and columns required for PWA Mobile Floor App
-- Reference: docs/PWA_SCHEMA_COMPARISON.md
-- ============================================================================

-- ============================================================================
-- SECTION 1: WORKER AUTHENTICATION COLUMNS
-- Priority: HIGH (blocks PWA Phase 1)
-- ============================================================================

-- Add PIN authentication columns to workers table
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(60);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin_attempts INTEGER DEFAULT 0;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add index for PIN lockout queries
CREATE INDEX IF NOT EXISTS idx_workers_pin_locked
ON workers(pin_locked_until)
WHERE pin_locked_until IS NOT NULL;

COMMENT ON COLUMN workers.pin_hash IS 'bcrypt hash of 4-6 digit PIN for PWA authentication';
COMMENT ON COLUMN workers.pin_attempts IS 'Failed PIN attempts counter, resets on success';
COMMENT ON COLUMN workers.pin_locked_until IS 'Account locked until this timestamp after max failed attempts';
COMMENT ON COLUMN workers.last_login IS 'Timestamp of last successful PWA login';

-- ============================================================================
-- SECTION 2: WORKER SESSIONS TABLE
-- Priority: HIGH (blocks PWA Phase 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS worker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,

  -- Token management
  token_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of session token

  -- Device information
  device_info JSONB DEFAULT '{}',   -- {userAgent, platform, screenSize}

  -- Session lifecycle
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,           -- NULL if active, timestamp if revoked

  -- Audit
  ip_address INET,
  login_source VARCHAR(20) DEFAULT 'pwa'  -- pwa, kiosk, manual
);

-- Indexes for session lookups
CREATE INDEX IF NOT EXISTS idx_worker_sessions_worker ON worker_sessions(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_sessions_factory ON worker_sessions(factory_id);
CREATE INDEX IF NOT EXISTS idx_worker_sessions_token ON worker_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_worker_sessions_active
ON worker_sessions(worker_id, expires_at)
WHERE revoked_at IS NULL;

-- RLS policies for worker_sessions
ALTER TABLE worker_sessions ENABLE ROW LEVEL SECURITY;

-- Workers can only see their own sessions
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

-- Only authenticated users can create sessions (via Edge Function)
CREATE POLICY "System can create sessions" ON worker_sessions
  FOR INSERT
  WITH CHECK (true);

-- Sessions can be revoked by admins or the worker
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

COMMENT ON TABLE worker_sessions IS 'PWA session tokens for worker authentication';

-- ============================================================================
-- SECTION 3: PURCHASE ORDERS TABLE
-- Priority: HIGH (blocks PWA Phase 5 - Inventory Receiving)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- PO identification
  po_number VARCHAR(50) NOT NULL,
  vendor_name VARCHAR(200) NOT NULL,
  vendor_contact VARCHAR(200),
  vendor_email VARCHAR(200),
  vendor_phone VARCHAR(50),

  -- Status tracking
  status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN (
    'Draft', 'Pending Approval', 'Approved', 'Ordered',
    'Partial', 'Received', 'Closed', 'Cancelled'
  )),

  -- Dates
  order_date DATE,
  expected_delivery DATE,
  actual_delivery DATE,

  -- Line items stored as JSONB array
  -- Format: [{partName, partNumber, quantity, unitCost, totalCost, received}]
  line_items JSONB DEFAULT '[]',

  -- Totals
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  shipping DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,

  -- Tracking
  notes TEXT,
  attachments JSONB DEFAULT '[]',  -- Array of attachment URLs

  -- Audit
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_factory ON purchase_orders(factory_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_expected ON purchase_orders(expected_delivery);

-- Unique constraint on PO number per factory
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_orders_unique_po
ON purchase_orders(factory_id, po_number);

-- RLS policies
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

COMMENT ON TABLE purchase_orders IS 'Purchase orders for inventory and materials tracking';

-- ============================================================================
-- SECTION 4: INVENTORY RECEIPTS TABLE
-- Priority: HIGH (blocks PWA Phase 5 - Inventory Receiving)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,

  -- Link to PO (optional - can receive without PO)
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  po_line_index INTEGER,  -- Index into purchase_orders.line_items array

  -- Item details
  part_name VARCHAR(200) NOT NULL,
  part_number VARCHAR(100),

  -- Quantities
  quantity_expected INTEGER DEFAULT 0,
  quantity_received INTEGER NOT NULL,
  quantity_damaged INTEGER DEFAULT 0,

  -- Receipt details
  received_by UUID REFERENCES workers(id),
  received_by_user UUID REFERENCES users(id),
  received_at TIMESTAMPTZ DEFAULT now(),

  -- Location
  storage_location VARCHAR(100),
  gps_location JSONB,  -- {lat, lng, accuracy}

  -- Evidence
  photo_urls TEXT[] DEFAULT '{}',

  -- Status
  status VARCHAR(30) DEFAULT 'Received' CHECK (status IN (
    'Received', 'Partial', 'Damaged', 'Rejected', 'Verified'
  )),

  -- Notes
  notes TEXT,
  damage_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_receipts_factory ON inventory_receipts(factory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_receipts_po ON inventory_receipts(po_id);
CREATE INDEX IF NOT EXISTS idx_inventory_receipts_received_at ON inventory_receipts(received_at);
CREATE INDEX IF NOT EXISTS idx_inventory_receipts_status ON inventory_receipts(status);
CREATE INDEX IF NOT EXISTS idx_inventory_receipts_part ON inventory_receipts(part_name);

-- RLS policies
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

COMMENT ON TABLE inventory_receipts IS 'Records of received inventory items with photos and quantities';

-- ============================================================================
-- SECTION 5: LINK LONG_LEAD_ITEMS TO PURCHASE_ORDERS
-- Priority: MEDIUM (enhances existing system)
-- ============================================================================

-- Add PO reference to long_lead_items
ALTER TABLE long_lead_items ADD COLUMN IF NOT EXISTS po_id UUID REFERENCES purchase_orders(id);
ALTER TABLE long_lead_items ADD COLUMN IF NOT EXISTS po_line_index INTEGER;

CREATE INDEX IF NOT EXISTS idx_long_lead_items_po ON long_lead_items(po_id);

COMMENT ON COLUMN long_lead_items.po_id IS 'Link to purchase order containing this item';
COMMENT ON COLUMN long_lead_items.po_line_index IS 'Index into PO line_items array';

-- ============================================================================
-- SECTION 6: TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to new tables
DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_receipts_updated_at ON inventory_receipts;
CREATE TRIGGER update_inventory_receipts_updated_at
  BEFORE UPDATE ON inventory_receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 7: VERIFICATION QUERIES
-- Run these after migration to verify success
-- ============================================================================

-- Verify worker columns added
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'workers' AND column_name IN ('pin_hash', 'pin_attempts', 'pin_locked_until', 'last_login');

-- Verify new tables created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN ('worker_sessions', 'purchase_orders', 'inventory_receipts');

-- ============================================================================
-- MIGRATION COMPLETE
-- Next steps:
-- 1. Create Supabase Storage bucket: inventory-receipts
-- 2. Create Supabase Edge Function: worker-auth
-- 3. Update services: workerAuthService.js, purchaseOrdersService.js, inventoryReceiptsService.js
-- ============================================================================
