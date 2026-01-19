-- ============================================================================
-- IT Dashboard Enhancement Tables
-- Migration: 20260119_it_dashboard_tables.sql
-- ============================================================================
-- Adds tables for enhanced IT Dashboard functionality:
-- - system_alerts: Active system alerts and notifications
-- - config_audit: Configuration change tracking
-- - api_metrics: API performance metrics
-- - it_reports: Saved IT reports
-- ============================================================================

-- ============================================================================
-- 1. SYSTEM ALERTS TABLE
-- ============================================================================
-- Tracks active system alerts, warnings, and notifications for IT dashboard
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('error', 'warning', 'info', 'success')),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  source VARCHAR(100) DEFAULT 'system', -- 'system', 'user', 'automated', 'security'
  category VARCHAR(50), -- 'users', 'database', 'security', 'performance', 'storage'
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT
);

-- Indexes for system_alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_active ON system_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_priority ON system_alerts(priority) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);

-- ============================================================================
-- 2. CONFIG AUDIT TABLE
-- ============================================================================
-- Tracks configuration changes for audit trail and rollback capability
CREATE TABLE IF NOT EXISTS config_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(255) NOT NULL,
  config_section VARCHAR(100), -- 'email', 'security', 'features', 'notifications', etc.
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('pending', 'applied', 'rolled_back', 'failed')),
  notes TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Indexes for config_audit
CREATE INDEX IF NOT EXISTS idx_config_audit_section ON config_audit(config_section);
CREATE INDEX IF NOT EXISTS idx_config_audit_changed_at ON config_audit(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_config_audit_changed_by ON config_audit(changed_by);
CREATE INDEX IF NOT EXISTS idx_config_audit_key ON config_audit(config_key);

-- ============================================================================
-- 3. API METRICS TABLE
-- ============================================================================
-- Tracks API performance metrics for monitoring dashboard
CREATE TABLE IF NOT EXISTS api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  latency_ms INTEGER NOT NULL,
  status_code INTEGER,
  user_id UUID REFERENCES users(id),
  session_id UUID,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for api_metrics (time-series optimized)
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_metrics_recorded_at ON api_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status ON api_metrics(status_code) WHERE status_code >= 400;

-- Aggregate view for dashboard (hourly metrics)
CREATE OR REPLACE VIEW api_metrics_hourly AS
SELECT
  date_trunc('hour', recorded_at) AS hour,
  endpoint,
  method,
  COUNT(*) as request_count,
  ROUND(AVG(latency_ms)::numeric, 2) as avg_latency,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 2) as p95_latency,
  MIN(latency_ms) as min_latency,
  MAX(latency_ms) as max_latency,
  COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
  COUNT(DISTINCT user_id) as unique_users
FROM api_metrics
WHERE recorded_at > NOW() - INTERVAL '7 days'
GROUP BY 1, 2, 3;

-- Daily summary view
CREATE OR REPLACE VIEW api_metrics_daily AS
SELECT
  date_trunc('day', recorded_at) AS day,
  COUNT(*) as total_requests,
  ROUND(AVG(latency_ms)::numeric, 2) as avg_latency,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 2) as p95_latency,
  COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
  ROUND((COUNT(*) FILTER (WHERE status_code >= 400)::numeric / COUNT(*)::numeric) * 100, 2) as error_rate,
  COUNT(DISTINCT user_id) as unique_users
FROM api_metrics
WHERE recorded_at > NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;

-- ============================================================================
-- 4. IT REPORTS TABLE
-- ============================================================================
-- Stores generated IT reports for download and history
CREATE TABLE IF NOT EXISTS it_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'user_activity', 'system_health', 'security_audit',
    'database_growth', 'error_trends', 'compliance', 'custom'
  )),
  description TEXT,
  parameters JSONB DEFAULT '{}', -- date range, filters, options
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  file_path TEXT, -- path to stored report file in storage
  file_size_bytes INTEGER,
  format VARCHAR(10) DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'csv', 'json')),
  is_scheduled BOOLEAN DEFAULT false,
  schedule_cron VARCHAR(50), -- cron expression for scheduled reports
  last_scheduled_run TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT
);

-- Indexes for it_reports
CREATE INDEX IF NOT EXISTS idx_it_reports_type ON it_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_it_reports_generated_at ON it_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_it_reports_generated_by ON it_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_it_reports_scheduled ON it_reports(is_scheduled) WHERE is_scheduled = true;

-- ============================================================================
-- 5. LOGIN ACTIVITY TABLE (if not exists)
-- ============================================================================
-- Tracks user login/logout events for activity heatmap
CREATE TABLE IF NOT EXISTS login_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('login', 'logout', 'failed_login', 'session_timeout')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  location JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for login_activity
CREATE INDEX IF NOT EXISTS idx_login_activity_user ON login_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_created_at ON login_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_activity_action ON login_activity(action);

-- ============================================================================
-- 6. INITIAL DEMO DATA
-- ============================================================================

-- Insert sample system alerts
INSERT INTO system_alerts (type, title, message, source, category, priority, is_active)
SELECT * FROM (
  VALUES
    ('warning', '3 Open Error Tickets', 'There are 3 unresolved error tickets requiring attention.', 'automated', 'errors', 3, true),
    ('warning', '2 Inactive Users', 'Users with no login activity in over 90 days detected.', 'automated', 'users', 5, true),
    ('info', 'System Backup Completed', 'Daily backup completed successfully at 3:00 AM.', 'system', 'database', 8, true),
    ('success', 'Security Scan Clear', 'No vulnerabilities detected in latest security scan.', 'automated', 'security', 7, true)
) AS v(type, title, message, source, category, priority, is_active)
WHERE NOT EXISTS (SELECT 1 FROM system_alerts LIMIT 1);

-- Insert sample config audit entries
INSERT INTO config_audit (config_key, config_section, old_value, new_value, status, notes)
SELECT * FROM (
  VALUES
    ('email.notifications_enabled', 'email', '"false"'::jsonb, '"true"'::jsonb, 'applied', 'Enabled email notifications'),
    ('security.session_timeout', 'security', '"30"'::jsonb, '"60"'::jsonb, 'applied', 'Extended session timeout to 60 minutes'),
    ('features.dark_mode', 'features', '"disabled"'::jsonb, '"enabled"'::jsonb, 'applied', 'Enabled dark mode by default')
) AS v(config_key, config_section, old_value, new_value, status, notes)
WHERE NOT EXISTS (SELECT 1 FROM config_audit LIMIT 1);

-- Insert sample API metrics (simulated data for last 7 days)
INSERT INTO api_metrics (endpoint, method, latency_ms, status_code, recorded_at)
SELECT
  endpoint,
  method,
  (random() * 150 + 20)::integer as latency_ms,
  CASE WHEN random() > 0.98 THEN 500 WHEN random() > 0.95 THEN 400 ELSE 200 END as status_code,
  NOW() - (random() * interval '7 days') as recorded_at
FROM (
  SELECT unnest(ARRAY['/api/projects', '/api/tasks', '/api/users', '/api/rfis', '/api/submittals']) as endpoint,
         unnest(ARRAY['GET', 'GET', 'GET', 'GET', 'GET']) as method
) endpoints
CROSS JOIN generate_series(1, 100) -- 100 samples per endpoint
WHERE NOT EXISTS (SELECT 1 FROM api_metrics LIMIT 1);

-- Insert sample IT reports
INSERT INTO it_reports (name, report_type, description, format, status)
SELECT * FROM (
  VALUES
    ('User Activity Summary - January 2026', 'user_activity', 'Monthly user activity report', 'pdf', 'completed'),
    ('System Health Weekly - Week 3', 'system_health', 'Weekly system health check', 'excel', 'completed'),
    ('Security Audit Q4 2025', 'security_audit', 'Quarterly security audit report', 'pdf', 'completed')
) AS v(name, report_type, description, format, status)
WHERE NOT EXISTS (SELECT 1 FROM it_reports LIMIT 1);

-- ============================================================================
-- 7. CLEANUP FUNCTION FOR OLD METRICS
-- ============================================================================
-- Function to clean up old API metrics (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM api_metrics WHERE recorded_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old login activity (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_activity()
RETURNS void AS $$
BEGIN
  DELETE FROM login_activity WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== IT Dashboard Tables Migration Complete ===';
  RAISE NOTICE 'Tables created: system_alerts, config_audit, api_metrics, it_reports, login_activity';
  RAISE NOTICE 'Views created: api_metrics_hourly, api_metrics_daily';
  RAISE NOTICE 'Cleanup functions: cleanup_old_api_metrics(), cleanup_old_login_activity()';
END $$;
