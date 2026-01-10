-- ============================================================================
-- SUNBELT PM - SCHEMA UPDATES MIGRATION
-- ============================================================================
-- Version: 1.0
-- Date: January 10, 2026
-- Description: Updates to align database schema with frontend components
--
-- This migration includes:
-- 1. change_orders table updates (column renames/changes)
-- 2. change_order_items table simplification
-- 3. long_lead_items table new columns
-- 4. color_selections table new columns
-- 5. warning_emails_log table new columns
-- 6. RLS helper functions
-- ============================================================================

-- ============================================================================
-- SECTION 1: CHANGE ORDERS TABLE UPDATES
-- ============================================================================
-- Component expects: co_number (INTEGER), co_type, date, notes, sent_date
-- Current schema has: change_order_number (VARCHAR), change_type, description, reason, submitted_date

-- First, add the new columns
ALTER TABLE change_orders
ADD COLUMN IF NOT EXISTS co_number INTEGER,
ADD COLUMN IF NOT EXISTS co_type VARCHAR(30),
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS sent_date DATE;

-- Migrate data from old columns to new columns
UPDATE change_orders
SET
  co_number = CAST(REGEXP_REPLACE(change_order_number, '[^0-9]', '', 'g') AS INTEGER),
  co_type = change_type,
  sent_date = submitted_date
WHERE co_number IS NULL;

-- Add default co_number sequence for new records
DO $$
BEGIN
  -- Set co_number = 1 for any records where migration couldn't parse a number
  UPDATE change_orders SET co_number = 1 WHERE co_number IS NULL;
END $$;

-- Create notes column (will combine description + reason)
ALTER TABLE change_orders
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrate description/reason to notes
UPDATE change_orders
SET notes = CONCAT_WS(E'\n\n', description, reason)
WHERE notes IS NULL AND (description IS NOT NULL OR reason IS NOT NULL);

COMMENT ON TABLE change_orders IS 'Change order tracking for post-signoff modifications';
COMMENT ON COLUMN change_orders.co_number IS 'Sequential change order number (integer)';
COMMENT ON COLUMN change_orders.co_type IS 'Type: Redlines, General, Pricing';
COMMENT ON COLUMN change_orders.sent_date IS 'Date CO was sent to dealer';

-- ============================================================================
-- SECTION 2: CHANGE ORDER ITEMS TABLE UPDATES
-- ============================================================================
-- Component expects: description, price, sort_order
-- Current schema has: description, quantity, unit_price, total_price, display_order

-- Add new columns
ALTER TABLE change_order_items
ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Migrate data: use total_price as the new price
UPDATE change_order_items
SET
  price = COALESCE(total_price, 0),
  sort_order = COALESCE(display_order, 0)
WHERE price IS NULL OR price = 0;

COMMENT ON COLUMN change_order_items.price IS 'Line item price (simplified from qty * unit_price)';
COMMENT ON COLUMN change_order_items.sort_order IS 'Display order for line items';

-- ============================================================================
-- SECTION 3: LONG LEAD ITEMS TABLE UPDATES
-- ============================================================================
-- Component expects additional: quantity, has_cutsheet, cutsheet_url, cutsheet_name,
--                               submitted_date, signoff_date
-- Note: item_name already exists as the PK column

ALTER TABLE long_lead_items
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS has_cutsheet BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cutsheet_url TEXT,
ADD COLUMN IF NOT EXISTS cutsheet_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS submitted_date DATE,
ADD COLUMN IF NOT EXISTS signoff_date DATE;

-- Set has_cutsheet = true for items that have a cutsheet URL
UPDATE long_lead_items
SET has_cutsheet = true
WHERE cutsheet_url IS NOT NULL AND cutsheet_url != '';

COMMENT ON TABLE long_lead_items IS 'Long lead item tracking with cutsheet support';
COMMENT ON COLUMN long_lead_items.quantity IS 'Number of items ordered';
COMMENT ON COLUMN long_lead_items.has_cutsheet IS 'Whether item has an associated cutsheet';
COMMENT ON COLUMN long_lead_items.cutsheet_url IS 'URL to cutsheet document';
COMMENT ON COLUMN long_lead_items.cutsheet_name IS 'Display name of cutsheet file';
COMMENT ON COLUMN long_lead_items.submitted_date IS 'Date item was submitted for approval';
COMMENT ON COLUMN long_lead_items.signoff_date IS 'Date dealer signed off on item';

-- ============================================================================
-- SECTION 4: COLOR SELECTIONS TABLE UPDATES
-- ============================================================================
-- Component expects additional: item_name, cutsheet_url, cutsheet_name,
--                               is_non_stock, non_stock_verified, non_stock_lead_time
-- Note: category already exists

ALTER TABLE color_selections
ADD COLUMN IF NOT EXISTS item_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS cutsheet_url TEXT,
ADD COLUMN IF NOT EXISTS cutsheet_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_non_stock BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS non_stock_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS non_stock_lead_time VARCHAR(50);

-- Drop the unique constraint on (project_id, category) if it exists
-- because we now allow multiple items per category
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'color_selections_project_id_category_key'
  ) THEN
    ALTER TABLE color_selections DROP CONSTRAINT color_selections_project_id_category_key;
  END IF;
END $$;

-- Add a new unique constraint on (project_id, category, item_name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'color_selections_project_category_item_key'
  ) THEN
    ALTER TABLE color_selections
    ADD CONSTRAINT color_selections_project_category_item_key
    UNIQUE (project_id, category, item_name);
  END IF;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

COMMENT ON TABLE color_selections IS 'Color and finish selections with non-stock tracking';
COMMENT ON COLUMN color_selections.item_name IS 'Name of the item for this color selection';
COMMENT ON COLUMN color_selections.cutsheet_url IS 'URL to product cutsheet';
COMMENT ON COLUMN color_selections.cutsheet_name IS 'Display name of cutsheet file';
COMMENT ON COLUMN color_selections.is_non_stock IS 'Whether this is a non-stock item';
COMMENT ON COLUMN color_selections.non_stock_verified IS 'Whether non-stock status has been verified';
COMMENT ON COLUMN color_selections.non_stock_lead_time IS 'Lead time for non-stock items (e.g., "4-6 weeks")';

-- ============================================================================
-- SECTION 5: WARNING EMAILS LOG TABLE UPDATES
-- ============================================================================
-- Component expects: email_type, sent_to_emails (TEXT[]), email_subject,
--                    email_body, sent_by, status
-- Current schema has: email_type, recipient_email, recipient_name, station_key,
--                     task_id, sent_by, sent_at, notes

ALTER TABLE warning_emails_log
ADD COLUMN IF NOT EXISTS sent_to_emails TEXT[],
ADD COLUMN IF NOT EXISTS email_subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_body TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Sent';

-- Migrate old recipient_email to new array format
UPDATE warning_emails_log
SET sent_to_emails = ARRAY[recipient_email]
WHERE sent_to_emails IS NULL AND recipient_email IS NOT NULL;

-- Migrate notes to email_body
UPDATE warning_emails_log
SET email_body = notes
WHERE email_body IS NULL AND notes IS NOT NULL;

-- Set default email_subject based on email_type
UPDATE warning_emails_log
SET email_subject = CONCAT('Warning: ', REPLACE(email_type, '_', ' '))
WHERE email_subject IS NULL;

CREATE INDEX IF NOT EXISTS idx_warning_emails_status ON warning_emails_log(status);

COMMENT ON COLUMN warning_emails_log.sent_to_emails IS 'Array of recipient email addresses';
COMMENT ON COLUMN warning_emails_log.email_subject IS 'Subject line of the warning email';
COMMENT ON COLUMN warning_emails_log.email_body IS 'Body content of the email';
COMMENT ON COLUMN warning_emails_log.status IS 'Status: Sent, Delivered, Failed';

-- ============================================================================
-- SECTION 6: RLS HELPER FUNCTIONS (if not already created)
-- ============================================================================

-- Function to check if user has access to a project
CREATE OR REPLACE FUNCTION user_has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is project owner, primary PM, backup PM, or has elevated role
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = p_project_id
    AND (
      p.owner_id = auth.uid()
      OR p.primary_pm_id = auth.uid()
      OR p.backup_pm_id = auth.uid()
      OR user_has_elevated_role()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has elevated role (director, vp, admin, it)
CREATE OR REPLACE FUNCTION user_has_elevated_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('director', 'vp', 'admin', 'it', 'Director', 'VP', 'Admin', 'IT')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 7: PROJECTS TABLE - ENSURE HEALTH_STATUS EXISTS
-- ============================================================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS health_status VARCHAR(30) DEFAULT 'On Track';

COMMENT ON COLUMN projects.health_status IS 'Project health: On Track, At Risk, Critical';

-- ============================================================================
-- SECTION 8: CREATE INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_change_orders_co_number ON change_orders(co_number);
CREATE INDEX IF NOT EXISTS idx_long_lead_items_submitted ON long_lead_items(submitted_date);
CREATE INDEX IF NOT EXISTS idx_long_lead_items_signoff ON long_lead_items(signoff_date);
CREATE INDEX IF NOT EXISTS idx_color_selections_non_stock ON color_selections(is_non_stock) WHERE is_non_stock = true;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SCHEMA UPDATES MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  - change_orders: added co_number, co_type, date, sent_date, notes';
  RAISE NOTICE '  - change_order_items: added price, sort_order';
  RAISE NOTICE '  - long_lead_items: added quantity, cutsheet fields, dates';
  RAISE NOTICE '  - color_selections: added item_name, cutsheet fields, non_stock fields';
  RAISE NOTICE '  - warning_emails_log: added sent_to_emails[], email_subject, email_body, status';
  RAISE NOTICE '  - projects: ensured health_status exists';
  RAISE NOTICE 'Helper functions created: user_has_project_access, user_has_elevated_role';
  RAISE NOTICE '========================================';
END $$;
