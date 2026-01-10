# Supabase Setup Scripts

Run these in order to verify and fix your database.

## Files

| File | Purpose |
|------|---------|
| `01_CHECK_STATUS.sql` | **Run first** - Shows what's applied vs missing |
| `02_FIX_ALL.sql` | **Run second** - Fixes any missing items |

## Usage

### Step 1: Check Status
```
Run 01_CHECK_STATUS.sql in Supabase SQL Editor
```

Look for:
- `✓ EXISTS` = Good, already applied
- `✗ MISSING` = Needs to be fixed
- `⚠ DISABLED` = Warning, should be enabled

### Step 2: Fix Issues
```
Run 02_FIX_ALL.sql in Supabase SQL Editor
```

This script is **safe to run multiple times** - it uses `IF NOT EXISTS` everywhere.

### Step 3: Verify
```
Run 01_CHECK_STATUS.sql again to confirm all green
```

## What Gets Fixed

- **Workflow tables**: workflow_stations, project_workflow_status, change_orders, etc.
- **Project Logs**: Daily notes and auto-activity tracking
- **Floor Plan Items**: Markers/pins on floor plans
- **New columns**: All Jan 10 schema updates
- **RLS policies**: Row Level Security on all tables
- **Triggers**: Auto-logging for project/task changes
- **Data issues**: Projects without owners
