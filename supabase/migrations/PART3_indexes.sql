-- ============================================================================
-- PART 3: INDEXES (Run this third)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_change_orders_co_number ON change_orders(co_number);
CREATE INDEX IF NOT EXISTS idx_long_lead_items_submitted ON long_lead_items(submitted_date);
CREATE INDEX IF NOT EXISTS idx_color_selections_non_stock ON color_selections(is_non_stock) WHERE is_non_stock = true;
CREATE INDEX IF NOT EXISTS idx_warning_emails_status ON warning_emails_log(status);
