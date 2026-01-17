-- ============================================================================
-- AUDIT_STATUS_VALUES.sql
-- Comprehensive audit of status values across all tables
-- Run this to identify any old/invalid status values
-- ============================================================================

-- ============================================================================
-- TASK STATUS AUDIT
-- Valid values: 'Not Started', 'In Progress', 'Awaiting Response', 'Completed', 'Cancelled'
-- Invalid: 'On Hold', 'Blocked'
-- ============================================================================
SELECT 'TASK STATUS AUDIT' AS audit_section;
SELECT 'Tasks with potentially invalid status values:' AS info;
SELECT DISTINCT status, COUNT(*) as count
FROM tasks
GROUP BY status
ORDER BY count DESC;

-- Check for old status values
SELECT 'Tasks with OLD status values (On Hold/Blocked):' AS info;
SELECT id, title, status, project_id
FROM tasks
WHERE status IN ('On Hold', 'Blocked')
LIMIT 20;

-- ============================================================================
-- MODULE STATUS AUDIT
-- Valid values: 'Not Started', 'In Queue', 'In Progress', 'QC Hold', 'Rework', 'Completed', 'Staged', 'Shipped'
-- Invalid: 'On Hold', 'Scheduled'
-- ============================================================================
SELECT 'MODULE STATUS AUDIT' AS audit_section;
SELECT 'Modules with potentially invalid status values:' AS info;
SELECT DISTINCT status, COUNT(*) as count
FROM modules
GROUP BY status
ORDER BY count DESC;

-- Check for old status values
SELECT 'Modules with OLD status values (On Hold/Scheduled):' AS info;
SELECT id, serial_number, status, factory_id
FROM modules
WHERE status IN ('On Hold', 'Scheduled', 'Blocked')
LIMIT 20;

-- ============================================================================
-- PROJECT STATUS AUDIT
-- Valid values: 'Pre-PM', 'Planning', 'PM Handoff', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Warranty'
-- Note: 'On Hold' IS valid for projects
-- ============================================================================
SELECT 'PROJECT STATUS AUDIT' AS audit_section;
SELECT 'Projects by status:' AS info;
SELECT DISTINCT status, COUNT(*) as count
FROM projects
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- RFI STATUS AUDIT
-- Valid values: 'Draft', 'Open', 'Pending', 'Answered', 'Closed'
-- ============================================================================
SELECT 'RFI STATUS AUDIT' AS audit_section;
SELECT 'RFIs by status:' AS info;
SELECT DISTINCT status, COUNT(*) as count
FROM rfis
GROUP BY status
ORDER BY count DESC;

-- Check for invalid status values
SELECT 'RFIs with potentially invalid status values:' AS info;
SELECT id, title, status
FROM rfis
WHERE status NOT IN ('Draft', 'Open', 'Pending', 'Answered', 'Closed')
LIMIT 20;

-- ============================================================================
-- SUBMITTAL STATUS AUDIT
-- Valid values: 'Pending', 'Submitted', 'Under Review', 'Approved', 'Approved as Noted', 'Revise and Resubmit', 'Rejected'
-- ============================================================================
SELECT 'SUBMITTAL STATUS AUDIT' AS audit_section;
SELECT 'Submittals by status:' AS info;
SELECT DISTINCT status, COUNT(*) as count
FROM submittals
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- FIX INVALID STATUS VALUES
-- Uncomment to run fixes
-- ============================================================================

-- Fix old task statuses
-- UPDATE tasks SET status = 'Awaiting Response' WHERE status IN ('On Hold', 'Blocked');

-- Fix old module statuses
-- UPDATE modules SET status = 'In Queue' WHERE status = 'Scheduled';
-- UPDATE modules SET status = 'QC Hold' WHERE status = 'On Hold';

SELECT 'AUDIT_STATUS_VALUES.sql COMPLETE' AS status;
SELECT 'Review results above and uncomment FIX statements if needed' AS next_step;
