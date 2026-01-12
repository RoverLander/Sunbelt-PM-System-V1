# Supabase Database Management

## Folder Structure

```
supabase/
├── demo/           - Sample data scripts for development
├── migrations/     - Database schema changes (timestamped)
└── setup/          - Health check and fix scripts
```

## Quick Start

### Setup Scripts (Run Once)
Located in `setup/` - Use these to verify and fix your database:

1. **01_CHECK_STATUS.sql** - Shows what's applied vs missing
2. **02_FIX_ALL.sql** - Fixes any missing tables/columns/policies
3. **03_CHECK_WORKFLOW_STATIONS.sql** - Verifies workflow configuration
4. **04_FIX_WORKFLOW_STATIONS.sql** - Fixes workflow station issues

**When to use:** Initial setup or when troubleshooting missing features.

### Migrations (Applied Incrementally)
Located in `migrations/` - Schema changes applied over time:

- `20260109_workflow_system_clean.sql` - Workflow refactor
- `20260110_add_rfi_answer_column.sql` - RFI improvements
- `20260110_add_tasks_is_external.sql` - External task tracking
- `20260110_factory_map_columns.sql` - Factory map data fields
- `20260110_fix_demo_data.sql` - Demo data corrections
- `20260110_project_logs.sql` - Auto-logging system
- `20260110_schema_updates.sql` - Multiple schema updates

**When to use:** Track schema changes for version control and rollback.

### Demo Data (Development Only)
Located in `demo/` - Populate database with sample data:

1. **01_CLEAR_DATA.sql** - Clears existing data (DESTRUCTIVE!)
2. **02_CREATE_PC_USER.sql** - Creates test user (Matthew McDaniel)
3. **03_IMPORT_PROJECTS.sql** - Loads sample projects
4. **04_GENERATE_SAMPLE_DATA.sql** - Generates tasks, RFIs, change orders

**When to use:** Local development, testing, demos. ⚠️ NEVER run on production!

## Common Tasks

### Check Database Health
```sql
-- Run in Supabase SQL Editor
\i setup/01_CHECK_STATUS.sql
```

### Fix Missing Items
```sql
\i setup/02_FIX_ALL.sql
```

### Reset Demo Data (Development Only)
```sql
\i demo/01_CLEAR_DATA.sql
\i demo/02_CREATE_PC_USER.sql
\i demo/03_IMPORT_PROJECTS.sql
\i demo/04_GENERATE_SAMPLE_DATA.sql
```

## Safety Notes

- ✅ **setup/** scripts are SAFE - use `IF NOT EXISTS` checks
- ✅ **migrations/** are SAFE - designed to be additive
- ⚠️ **demo/01_CLEAR_DATA.sql** is DESTRUCTIVE - clears all data!

## Schema Management

All schema changes should:
1. Be added as a new migration file with timestamp
2. Include both UP (apply) and DOWN (rollback) logic
3. Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
4. Be tested on a copy of production data

## Backup Strategy

Before major changes:
```sql
-- Export current schema
pg_dump --schema-only > backup_schema_YYYYMMDD.sql

-- Export data
pg_dump --data-only > backup_data_YYYYMMDD.sql
```

## Maintenance

### Regular Tasks
- Review and archive old migrations (keep last 6 months)
- Update demo data to match production schema
- Document new columns/tables in migration files

### Cleanup
No cleanup needed - all files are organized and current.

---

*Last Updated: January 2026*
*Maintained by: Development Team*
