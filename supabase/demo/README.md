# Demo Data Setup

Run these SQL scripts **in order** to reset and populate demo data.

## Quick Start (NEW - Comprehensive Demo)

For the full demo experience including Plant Manager Dashboard and PWA features:

### Step 1: Verify Migrations Applied

Before running demo data, ensure these migrations have been applied in Supabase:

| Migration | Creates | Required For |
|-----------|---------|--------------|
| `20260115_plant_manager_system.sql` | modules, station_templates, workers, worker_shifts, qc_records, station_assignments | Plant Manager Dashboard |
| `20260115_ross_parks_plant_gm.sql` | Plant_GM user for NWBS | PGM demo |
| `20260115_pgm_demo_data.sql` | Initial PGM demo data | Basic PGM testing |
| `20260116_pwa_schema_remediation.sql` | worker_sessions, purchase_orders, inventory_receipts | PWA Mobile Floor App |
| `20260116_pwa_schema_remediation_fix.sql` | Fixes partial migration issues | PWA (run if first failed) |
| `20260117_add_is_pm_job_column.sql` | projects.is_pm_job column | PM vs PC job filtering |

**Verification Query:**
```sql
-- Check all required tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('modules', 'station_templates', 'workers', 'worker_shifts',
                   'qc_records', 'station_assignments', 'worker_sessions',
                   'purchase_orders', 'inventory_receipts')
ORDER BY table_name;
```

### Step 2: Run Comprehensive Demo SQL

```
COMPREHENSIVE_DEMO_DATA.sql  → Complete demo for PM System + PGM + PWA
```

This single file creates all demo data for demonstrating:
- PM Software (Projects, Workflow, Sales, Directory)
- Plant Manager Dashboard (Stations, Modules, Crews, QC)
- PWA Mobile Floor App (Worker Auth, Module Lookup, QC, Inventory)

### Step 3: Run Master Fix Script (RECOMMENDED)

After running COMPREHENSIVE_DEMO_DATA.sql, run this single file to fix all known issues:

```
FIX_ALL_DEMO_ISSUES.sql  → MASTER FIX FILE - Includes all fixes in one file:
  1. Announcements - dismissals table, type column, removes duplicates
  2. Sales quotes FK constraint for assigned_to → users
  3. Directory contacts - 100+ contacts with correct schema
  4. Crew members - 100 workers for NWBS with station assignments
  5. Modules - realistic modules for all NWBS projects
  6. PC-specific projects - stock/fleet projects (non-PM jobs)
  7. Sales pipeline - quotes for both PM and PC-driven projects
```

### Alternative: Individual Fix Scripts

If you prefer granular control, run these individual scripts instead:

```
FIX_ANNOUNCEMENTS.sql               → Announcements dismissals, type column, duplicates
FIX_SALES_AND_CREW.sql              → Sales FK, 100 workers, modules, PC projects
FIX_WORKFLOW_TASKS_AND_CLIENTS.sql  → Client names to DEALERS, workflow tasks
FIX_DIRECTORY_CONTACTS.sql          → Populates 200+ contacts from CSV (DEPRECATED - use FIX_ALL)
FIX_PM_ASSIGNMENTS.sql              → Assigns projects to specific PMs by name
```

**Important Notes:**
- The workflow canvas derives station status from tasks with `workflow_station_key`,
  not from the `project_workflow_status` table
- PC (Project Coordinators) manage stock/fleet projects which are simpler, lower-dollar jobs
- PMs manage larger, more complex "PM jobs" (is_pm_job = true)
- Client names should always be DEALERS, not end users

---

## Legacy Scripts (Individual Files)

For granular control, run these in order:

```
01_CLEAR_DATA.sql          → Clears existing project data
02_FACTORIES_TABLE.sql     → Creates 15 factories with addresses & contact info
03_DEPARTMENTS.sql         → Creates 14 department lookup codes
04_WORKFLOW_STATIONS.sql   → Creates 21 workflow stations
05_IMPORT_PROJECTS.sql     → Imports 20 demo projects
06_PROJECT_DATA.sql        → Generates tasks, RFIs, submittals, etc.
07_WORKFLOW_STATUS.sql     → Initializes workflow status per project
08_SALES_DATA.sql          → Creates sales pipeline for Mitch
09_DIRECTORY_CONTACTS.sql  → Imports 311 employee contacts from directory
```

## What Gets Created

### 20 Projects by Workflow Phase

| Phase | Projects | Status |
|-------|----------|--------|
| **Phase 1: Initiation** | SMM-21145, PMI-6798, DO-0521-1-25, SMM-21103 | Planning |
| **Phase 2: Dealer Sign-Offs** | PMI-6781, SMM-21055, SMM-21056, SMM-21057, SMM-21003 (Critical), SSI-7669, SSI-7670, SME-23038 | In Progress |
| **Phase 3: Internal Approvals** | SSI-7671, SSI-7672, SMM-21020, SSI-7547 | In Progress |
| **Phase 4: Delivery** | SMM-21054, 25B579-584, PMI-6749-6763, NWBS-25250 | In Progress / Complete |

### Projects by Factory (Praxis Codes)

| Factory | Count | Projects |
|---------|-------|----------|
| SMM - Southeast Modular | 8 | VA modules, Disney, Google, SCIF, Patrick |
| PMI - Phoenix Modular | 4 | Florence Medical, Aambe, LASD, R-OCC Homeless |
| SSI - Specialized Structures | 5 | Mike Dover (4), BASF |
| IBI - Indicom Buildings | 1 | Point Magu Naval Base |
| NWBS - Northwest Building | 1 | Hanford AMPS |
| PRM - Pro-Mod | 1 | Brooklyn Lot Cleaning |

### Data Per Project

- **Tasks**: 3-20 per project (phase-appropriate)
- **RFIs**: 3-4 per project
- **Submittals**: 4 per project
- **Change Orders**: 1-2 per project (phase 2+)
- **Long Lead Items**: 4 per project
- **Color Selections**: 6 per project
- **Milestones**: 6 per project

### Sales Pipeline

| Status | Count | Total Value |
|--------|-------|-------------|
| PO Received | 1 | $3,200,000 |
| Awaiting PO | 1 | $1,450,000 |
| Negotiating | 2 | $5,375,000 |
| Sent | 1 | $2,100,000 |
| Draft | 1 | $680,000 |
| Won (Converted) | 3 | $4,500,000 |
| Lost | 1 | $550,000 |
| Expired | 1 | $420,000 |

### PM Assignments

| PM | Primary | Backup |
|----|---------|--------|
| Candy Juhnke | 4 | All others |
| Crystal Meyers | 7 | - |
| Matthew McDaniel | 5 | - |
| Michael Caracciolo | 2 | - |
| Hector Vazquez | 1 | - |

## Demo Highlights

### 1. Workflow Canvas (React Flow)
- Open any project → Workflow tab → Canvas view
- **Best projects to demo:**
  - PMI-6781 (Phase 2 - 65% drawings in progress)
  - SSI-7671 (Phase 3 - Engineering review)
  - SMM-21054 (Phase 4 - Production started)

### 2. Critical Project Alert
- SMM-21003 (Disney) - Past due, blocked at 95% drawings
- Overdue tasks and urgent RFIs

### 3. Sales Pipeline
- Login as Sales Manager
- View quotes in various stages
- 2 quotes flagged for PM attention

### 4. Factory Distribution
- Projects across 6 different factories
- Test factory filtering in dashboards

## Health Status Distribution

| Status | Count |
|--------|-------|
| On Track | 15 |
| At Risk | 4 |
| Critical | 1 |

## Troubleshooting

### No PM users found
If PMs aren't assigned, ensure these users exist in Supabase Auth:
- candy.juhnke@sunbeltmodular.com
- crystal.meyers@sunbeltmodular.com
- matthew.mcdaniel@sunbeltmodular.com

### Workflow Canvas shows empty
1. Check `workflow_stations` table has 21 records
2. Check `project_workflow_status` has records for the project
3. Verify project has `current_phase` set (1-4)

### Sales quotes not showing
Ensure `sales_quotes` table exists and has the Praxis fields from migration.

### Schema Mismatch Errors

If you see errors like `null value in column "X" violates not-null constraint`:

1. The database has legacy columns with NOT NULL constraints
2. COMPREHENSIVE_DEMO_DATA.sql handles these automatically by:
   - Dropping NOT NULL constraints on legacy columns
   - Including both legacy and new column names in INSERTs

**Known legacy columns handled:**
- `announcements.message` → now uses `content` (both included)
- `feature_flags.key` → now uses `flag_key` (both included)

### Duplicate Key Errors

If you see `duplicate key value violates unique constraint`:

1. Data already exists from a previous run
2. Solutions:
   - Run 01_CLEAR_DATA.sql first (for legacy scripts)
   - COMPREHENSIVE_DEMO_DATA.sql uses `ON CONFLICT DO NOTHING`

---

## PWA Demo Credentials

| Employee ID | PIN | Role | Factory |
|-------------|-----|------|---------|
| TEST | 1234 | Dev Bypass | NWBS |
| EMP001 | 1234 | Station Lead | NWBS |
| EMP002-006 | 1234 | Leads/Workers | NWBS |

---

*Created: January 13, 2026*
*Updated: January 17, 2026 - Added COMPREHENSIVE_DEMO_DATA.sql reference and troubleshooting*
