# Demo Data Setup

Run these SQL scripts **in order** to reset and populate demo data.

## Quick Start

Run all scripts in Supabase SQL Editor in this order:

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

---

*Created: January 13, 2026*
