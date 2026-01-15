# Demo Data Plan V2

**Created:** January 15, 2026
**Status:** Active
**Master File:** `supabase/demo/MASTER_DEMO_DATA_V2.sql`
**Previous Version:** Archived to `docs/archive/DEMO_DATA_PLAN_V1_ARCHIVED_20260115.md`

---

## Overview

This document defines the comprehensive demo data strategy that ties together all system features:
- PM Dashboard & Project Management
- PC Dashboard & Stock/Fleet Projects
- Plant GM Dashboard & Production Line
- Sales Pipeline & Quote Management
- Calendar with Role-Based Filtering

**Key Principle:** All dates are **dynamic** (relative to `CURRENT_DATE`) making the demo data evergreen.

---

## Table of Contents

1. [User Accounts](#1-user-accounts)
2. [Factories & Configuration](#2-factories--configuration)
3. [PM Projects](#3-pm-projects)
4. [PC Projects](#4-pc-projects)
5. [Production Line Data](#5-production-line-data)
6. [Workers & Crew](#6-workers--crew)
7. [Sales Quotes](#7-sales-quotes)
8. [Tasks, RFIs, Submittals](#8-tasks-rfis-submittals)
9. [Workflow Status](#9-workflow-status)
10. [Date Strategy](#10-date-strategy)
11. [Execution Order](#11-execution-order)
12. [Verification Queries](#12-verification-queries)
13. [Known Compatibility Requirements](#13-known-compatibility-requirements)

---

## 1. User Accounts

**Principle:** Do NOT delete existing users. Use UPSERT pattern to update existing and add new users.

### Required Users (12 total)

| User | Email | Role | Factory | UID | Purpose |
|------|-------|------|---------|-----|---------|
| Matt Jordan | matt.jordan@nwbsinc.com | PM | NWBS | (existing) | Primary PM demo - 4 complex projects |
| Candy Echols | candy.echols@sunbeltmodular.com | Director | All | (existing) | Director demo - oversight + 2 personal |
| Crystal Trevino | crystal.trevino@sunbeltmodular.com | PM | SSI/SMM | (existing) | PM demo - factory-clustered projects |
| **Ross Parks** | ross.parks@nwbsinc.com | **Plant_GM** | NWBS | `fcd8501a-fdbb-43d1-83c2-fcf049bb0c90` | **NEW** - Plant GM demo |
| **Dawn Hinkle** | dawn.hinkle@nwbsinc.com | **PC** | NWBS | `679a1d92-7ea6-4797-a4c9-d13d156c215f` | **NEW** - PC demo - 10-12 projects |
| **Justin Downing** | justin.downing@nwbsinc.com | **Production_Manager** | NWBS | `bbed0851-f894-401a-9312-0ada815c7785` | **NEW** - Factory floor manager |
| Devin Duvak | devin.duvak@sunbeltmodular.com | VP | All | (existing) | Executive demo |
| Mitch Quintana | mitch.quintana@nwbsinc.com | Sales_Manager | NWBS | (existing) | Sales Manager demo - 10 quotes |
| Robert Thaler | robert.thaler@nwbsinc.com | Sales_Rep | NWBS | (existing) | Sales Rep demo - 10 quotes |
| Juanita Earnest | juanita.earnest@palomar.com | PC | PMI | (existing) | PMI PC demo |
| IT Admin | admin@sunbeltmodular.com | IT | All | (existing) | System admin |
| Support | support@sunbeltmodular.com | IT_Manager | All | (existing) | IT manager |

### User Creation SQL Pattern

```sql
-- UPSERT pattern for users
INSERT INTO users (id, email, name, role, factory, factory_id, created_at, updated_at)
VALUES (
  'fcd8501a-fdbb-43d1-83c2-fcf049bb0c90',
  'ross.parks@nwbsinc.com',
  'Ross Parks',
  'Plant_GM',
  'NWBS',
  (SELECT id FROM factories WHERE code = 'NWBS'),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  factory = EXCLUDED.factory,
  factory_id = EXCLUDED.factory_id,
  updated_at = NOW();
```

---

## 2. Factories & Configuration

### Primary Demo Factory: NWBS

All new demo data focuses on **NWBS (Northwest Building Systems)** for consistency:
- Ross Parks (Plant_GM) assigned to NWBS
- Dawn Hinkle (PC) assigned to NWBS
- Matthew (PM) has NWBS projects
- Sales quotes from Mitch/Robert at NWBS
- 60 workers at NWBS factory

### Factory Configuration

The `plant_config` table uses JSONB columns for configuration. Entry for NWBS:

```sql
INSERT INTO plant_config (factory_id, time_settings, efficiency_modules)
SELECT
  id,
  '{"shift_start": "06:00", "shift_end": "14:30", "break_minutes": 30, "lunch_minutes": 30, "ot_threshold_daily": 8, "ot_threshold_weekly": 40, "double_time_threshold": 12}'::jsonb,
  '{"takt_time_tracker": true, "queue_time_monitor": true, "kaizen_board": false}'::jsonb
FROM factories WHERE code = 'NWBS'
ON CONFLICT (factory_id) DO UPDATE SET time_settings = EXCLUDED.time_settings;
```

---

## 3. PM Projects

### Project Distribution

| PM | Factory | Count | Types | Modules |
|----|---------|-------|-------|---------|
| Matt Jordan | NWBS | 4 | CUSTOM, GOVERNMENT | 25-30 total |
| Crystal Trevino | SSI, SMM | 4-6 | Mixed | (existing) |
| Candy Echols | Various | 2 | Mixed (personal) | (existing) |

### Matthew's NWBS PM Projects (4 projects, ~27 modules)

| Project # | Name | Type | Modules | Phase | Health | Notes |
|-----------|------|------|---------|-------|--------|-------|
| NWBS-26-001 | Boise School District Admin | GOVERNMENT | 8 | 3 | On Track | Complex, state approvals needed |
| NWBS-26-002 | Idaho State University Labs | GOVERNMENT | 6 | 2 | At Risk | Engineering delays |
| NWBS-26-003 | Boeing Everett Support | CUSTOM | 8 | 4 | On Track | Near completion |
| NWBS-26-004 | Microsoft Redmond Campus | CUSTOM | 5 | 2 | On Track | Recently started |

### PM Project Fields Required

```sql
-- Required fields for PM projects
- project_number (VARCHAR) - e.g., 'NWBS-26-001'
- name (VARCHAR)
- factory (VARCHAR) - 'NWBS'
- factory_id (UUID) - FK to factories
- building_type (VARCHAR) - 'GOVERNMENT' | 'CUSTOM' | 'STOCK'
- status (VARCHAR) - 'In Progress'
- health_status (VARCHAR) - 'On Track' | 'At Risk' | 'Critical'
- current_phase (INTEGER) - 1-4
- contract_value (NUMERIC) - minimum $600,000
- owner_id (UUID) - Matthew's user ID
- primary_pm_id (UUID) - Matthew's user ID
- module_count (INTEGER) - matches modules created
- target_online_date (DATE) - delivery target
- start_date (DATE) - project start
```

---

## 4. PC Projects

### PC Role Definition

The PC (Project Coordinator) is a "mini project manager" for high-volume stock/fleet projects:
- Higher project count than PMs (10-12 vs 4-6)
- Simpler projects (STOCK type, repeat builds)
- Rarely has RFIs (simple/repeat designs)
- Tracks: Long lead items, color selections, engineering approvals, third-party approvals
- Reports to Plant GM on production scheduling
- Does NOT require PM involvement for day-to-day

### Dawn Hinkle's NWBS PC Projects (12 projects, ~36 modules)

| Project # | Name | Type | Modules | Phase | Notes |
|-----------|------|------|---------|-------|-------|
| NWBS-26-S01 | United Rentals Fleet Order 1 | STOCK | 3 | 4 | Standard fleet, near completion |
| NWBS-26-S02 | United Rentals Fleet Order 2 | STOCK | 3 | 3 | In production |
| NWBS-26-S03 | ModSpace Standard 24x60 | STOCK | 3 | 3 | Standard build |
| NWBS-26-S04 | Pacific Mobile Standard | STOCK | 3 | 2 | Drawings phase |
| NWBS-26-S05 | ATCO Site Office | STOCK | 2 | 2 | Simple office |
| NWBS-26-S06 | Williams Scotsman Classroom | STOCK | 4 | 3 | School portable |
| NWBS-26-S07 | Target Distribution Temp | STOCK | 3 | 2 | Temp facility |
| NWBS-26-S08 | Amazon Warehouse Office | STOCK | 3 | 3 | In production |
| NWBS-26-S09 | Costco Break Room | STOCK | 2 | 4 | Near completion |
| NWBS-26-S10 | Starbucks Training | STOCK | 3 | 2 | Training facility |
| NWBS-26-S11 | Home Depot Site Office | STOCK | 2 | 3 | Construction office |
| NWBS-26-S12 | Lowes District Office | STOCK | 3 | 2 | District facility |

**Total PC Modules:** 36 modules

### PC Project Fields

Same as PM projects but with:
- `building_type = 'STOCK'`
- `owner_id` = Dawn Hinkle's user ID
- Lower contract values ($150K - $400K typical)
- Simpler/shorter timelines

---

## 5. Production Line Data

### Station Templates (12 stations)

The production line has 12 stations (already seeded in `20260115_plant_manager_system.sql`):

| Order | Code | Name | Lead Type | Duration (Stock) | Duration (Custom) |
|-------|------|------|-----------|------------------|-------------------|
| 1 | FRAME | Frame | Frame Lead | 4h | 8h |
| 2 | FLOOR_DECK | Floor/Deck | Frame Lead | 4h | 6h |
| 3 | WALLS | Walls | Framing Lead | 4h | 8h |
| 4 | INSULATION | Insulation | Insulation Lead | 3h | 4h |
| 5 | ROOF | Roof | Roof Lead | 4h | 6h |
| 6 | SHEATHING | Sheathing | Exterior Lead | 3h | 4h |
| 7 | SIDING | Siding | Exterior Lead | 4h | 6h |
| 8 | PAINT | Paint | Paint Lead | 4h | 6h |
| 9 | MEP_ROUGHIN | Rough-in (E/P/HVAC) | MEP Lead | 6h | 10h |
| 10 | WALL_COVER | Wall Coverings | Finish Lead | 4h | 6h |
| 11 | FINISH | Finish | Finish Lead | 4h | 8h |
| 12 | INSPECTION | Inspections/Staging | QC Lead | 2h | 4h |

### Modules Distribution (~63 total at NWBS)

| Source | Project Count | Module Count | Current Status Distribution |
|--------|---------------|--------------|------------------------------|
| PM Projects | 4 | 27 | Various stations |
| PC Projects | 12 | 36 | Various stations |
| **Total** | 16 | 63 | Spread across 12 stations |

### Module Status Distribution

For a realistic production line view:

| Station | PM Modules | PC Modules | Total |
|---------|------------|------------|-------|
| Frame (1) | 2 | 3 | 5 |
| Floor/Deck (2) | 2 | 3 | 5 |
| Walls (3) | 3 | 4 | 7 |
| Insulation (4) | 2 | 3 | 5 |
| Roof (5) | 2 | 3 | 5 |
| Sheathing (6) | 2 | 3 | 5 |
| Siding (7) | 2 | 3 | 5 |
| Paint (8) | 3 | 3 | 6 |
| Rough-in (9) | 3 | 4 | 7 |
| Wall Covers (10) | 2 | 3 | 5 |
| Finish (11) | 2 | 2 | 4 |
| Staging (12) | 2 | 2 | 4 |

### Module Creation SQL Pattern

```sql
-- Create modules for a project
INSERT INTO modules (
  project_id, factory_id, serial_number, sequence_number,
  status, current_station_id, scheduled_start,
  module_width, module_length, building_category
)
VALUES (
  v_project_id,
  v_factory_id,
  'NWBS-26-001-M1',  -- Serial number
  1,                  -- Sequence
  'In Progress',      -- Status
  v_station_id,       -- Current station
  CURRENT_DATE + INTERVAL '5 days',
  14,                 -- Width in feet
  60,                 -- Length in feet
  'government'        -- Building category
);
```

### Station Assignments

Each module at a station needs a `station_assignments` record:

```sql
INSERT INTO station_assignments (
  module_id, station_id, factory_id,
  lead_id, crew_ids, start_time, status
)
VALUES (
  v_module_id,
  v_station_id,
  v_factory_id,
  v_lead_worker_id,     -- From workers table
  ARRAY[w1_id, w2_id],  -- Crew worker IDs
  NOW(),
  'In Progress'
);
```

---

## 6. Workers & Crew

### Worker Distribution (60 workers at NWBS)

| Category | Count | Details |
|----------|-------|---------|
| Station Leads | 8 | Cover all 12 stations |
| General Crew | 52 | Distributed across stations |
| **Total** | 60 | |

### Lead Assignments

| Lead # | Name | Stations Covered | Badge |
|--------|------|------------------|-------|
| 1 | Marcus Johnson | Frame, Floor/Deck | Frame Lead |
| 2 | Tony Martinez | Walls | Framing Lead |
| 3 | Robert Chen | Insulation | Insulation Lead |
| 4 | James Wilson | Roof | Roof Lead |
| 5 | David Thompson | Sheathing, Siding | Exterior Lead |
| 6 | Carlos Garcia | Paint | Paint Lead |
| 7 | Michael Brown | Rough-in | MEP Lead |
| 8 | Kevin Davis | Wall Covers, Finish, Staging | Finish/QC Lead |

### Worker Creation SQL Pattern

```sql
-- Create a lead worker
INSERT INTO workers (
  factory_id, employee_id, first_name, last_name, title,
  primary_station_id, is_lead, hourly_rate, is_active, hire_date
)
VALUES (
  v_factory_id,
  'NWBS-L001',
  'Marcus',
  'Johnson',
  'Frame Lead',
  v_frame_station_id,
  true,           -- is_lead
  32.50,          -- hourly rate
  true,
  '2020-03-15'
);
```

### Worker Shifts (Demo Day)

Create active shifts for most workers to show attendance:

```sql
-- Clock in 50 of 60 workers (83% attendance)
INSERT INTO worker_shifts (worker_id, factory_id, clock_in, source, status)
SELECT
  id,
  factory_id,
  CURRENT_DATE + INTERVAL '6 hours' + (random() * INTERVAL '30 minutes'),
  'kiosk',
  'active'
FROM workers
WHERE factory_id = v_factory_id AND is_active = true
LIMIT 50;
```

---

## 7. Sales Quotes

### Quote Distribution (20 quotes at NWBS)

| Sales Rep | Quote Count | Active | Won | Lost |
|-----------|-------------|--------|-----|------|
| Mitch Quintana | 10 | 6 | 2 | 2 |
| Robert Thaler | 10 | 7 | 2 | 1 |
| **Total** | 20 | 13 | 4 | 3 |

### Quote Details

**Mitch Quintana's Quotes:**

| Quote # | Customer | Status | Value | Outlook % | PM Flagged |
|---------|----------|--------|-------|-----------|------------|
| Q-2026-M01 | Boise School District | Won | $1,850,000 | 100% | No |
| Q-2026-M02 | Idaho DOT | Negotiating | $920,000 | 75% | Yes |
| Q-2026-M03 | Portland Metro | Sent | $680,000 | 40% | No |
| Q-2026-M04 | Oregon Health Sciences | Awaiting PO | $2,100,000 | 95% | Yes |
| Q-2026-M05 | City of Tacoma | Draft | $750,000 | 20% | No |
| Q-2026-M06 | King County | Negotiating | $1,200,000 | 60% | No |
| Q-2026-M07 | Seattle Parks | Sent | $620,000 | 35% | No |
| Q-2026-M08 | Spokane Schools | Lost | $890,000 | 0% | No |
| Q-2026-M09 | Tri-Cities | Lost | $650,000 | 0% | No |
| Q-2026-M10 | Yakima Valley | PO Received | $1,100,000 | 100% | No |

**Robert Thaler's Quotes:**

| Quote # | Customer | Status | Value | Outlook % | PM Flagged |
|---------|----------|--------|-------|-----------|------------|
| Q-2026-R01 | AWS Seattle | Negotiating | $3,200,000 | 75% | Yes |
| Q-2026-R02 | Boeing Everett | Sent | $1,850,000 | 50% | No |
| Q-2026-R03 | Port of Seattle | PO Received | $980,000 | 100% | No |
| Q-2026-R04 | Microsoft Redmond | Won | $2,100,000 | 100% | No |
| Q-2026-R05 | Starbucks HQ | Sent | $620,000 | 30% | No |
| Q-2026-R06 | Costco Regional | Negotiating | $1,450,000 | 65% | No |
| Q-2026-R07 | Amazon Fulfillment | Awaiting PO | $2,800,000 | 90% | Yes |
| Q-2026-R08 | T-Mobile Campus | Draft | $780,000 | 15% | No |
| Q-2026-R09 | Alaska Airlines | Sent | $920,000 | 40% | No |
| Q-2026-R10 | Nordstrom | Lost | $1,100,000 | 0% | No |

### Won Quote Linkage

Won quotes should link to projects via `converted_to_project_id`:

| Quote | Links To Project |
|-------|------------------|
| Q-2026-M01 (Boise School) | NWBS-26-001 |
| Q-2026-R04 (Microsoft) | NWBS-26-004 |

---

## 8. Tasks, RFIs, Submittals

### Per-Project Targets

| Item Type | PM Projects | PC Projects | Notes |
|-----------|-------------|-------------|-------|
| Tasks | 8-15 per project | 4-8 per project | Phase-appropriate |
| RFIs | 2-5 per project | 0-2 per project | PC rarely has RFIs |
| Submittals | 4-8 per project | 2-4 per project | Standard types |

### Task Types by Project Phase

**Phase 1 Tasks:**
- Complete Sales Handoff
- Schedule Kickoff Meeting
- Initial Client Contact

**Phase 2 Tasks:**
- Review 20% Drawings
- Review 65% Drawings
- Confirm Color Selections
- Order Long Lead Items
- Review Cutsheet Submittals

**Phase 3 Tasks:**
- Complete Engineering Review
- Third Party Plan Review
- Obtain State Approval
- Submit Building Permits
- Process Change Orders

**Phase 4 Tasks:**
- Begin Production
- Quality Control Inspection
- Schedule Delivery
- Coordinate Site Prep
- Project Closeout

### RFI Types

Standard RFI subjects:
- Site Access Clarification
- Electrical Panel Location
- Flooring Material Substitution
- HVAC Equipment Specs
- Structural Connection Detail
- Window Schedule Clarification
- Plumbing Fixture Confirmation

### Submittal Types

Standard submittals:
- HVAC Package Unit (Product Data)
- Main Electrical Panel (Shop Drawings)
- LVT Flooring (Samples)
- Aluminum Windows (Shop Drawings)
- Roofing Material (Product Data)
- Interior Paint (Samples)
- Plumbing Fixtures (Product Data)

---

## 9. Workflow Status

### Workflow Phases (4 phases, ~20 stations)

| Phase | Name | Stations |
|-------|------|----------|
| 1 | Initiation | Sales Handoff, Kickoff Meeting |
| 2 | Dealer Sign-Offs | 20% Drawings through Cutsheets |
| 3 | Internal Approvals | Engineering through Permits |
| 4 | Delivery | Production through Closeout |

**Note:** Site Survey was REMOVED from Phase 1 (dealers handle site work).

### Initialize Workflow Status

Each project needs `project_workflow_status` records for all 20 workflow stations:

```sql
-- Initialize workflow status for a project
-- Note: Uses station_key (VARCHAR FK), not workflow_station_id
-- Date columns are started_date/completed_date (DATE type), not started_at/completed_at
INSERT INTO project_workflow_status (project_id, station_key, status, started_date, completed_date)
SELECT
  v_project_id,
  ws.station_key,
  CASE
    WHEN ws.phase < v_current_phase THEN 'completed'
    WHEN ws.phase = v_current_phase AND ws.display_order <= v_current_station THEN 'in_progress'
    ELSE 'not_started'
  END,
  CASE WHEN ws.phase < v_current_phase THEN (v_start_date + (ws.display_order * INTERVAL '7 days'))::DATE END,
  CASE WHEN ws.phase < v_current_phase THEN (v_start_date + ((ws.display_order + 1) * INTERVAL '7 days'))::DATE END
FROM workflow_stations ws
WHERE ws.is_active = true
ORDER BY ws.phase, ws.display_order;
```

---

## 10. Date Strategy

### Dynamic Date Calculations

All dates relative to `CURRENT_DATE`:

| Date Expression | Usage |
|-----------------|-------|
| `CURRENT_DATE - INTERVAL '9 months'` | Oldest project creation |
| `CURRENT_DATE - INTERVAL '6 months'` | Mid-range project starts |
| `CURRENT_DATE - INTERVAL '3 months'` | Recent project starts |
| `CURRENT_DATE - INTERVAL '14 days'` | Overdue items (2 weeks) |
| `CURRENT_DATE - INTERVAL '7 days'` | Overdue items (1 week) |
| `CURRENT_DATE - INTERVAL '1 day'` | Yesterday (overdue) |
| `CURRENT_DATE` | Due today |
| `CURRENT_DATE + INTERVAL '3 days'` | Due this week |
| `CURRENT_DATE + INTERVAL '7 days'` | Due next week |
| `CURRENT_DATE + INTERVAL '14 days'` | Due in 2 weeks |
| `CURRENT_DATE + INTERVAL '30 days'` | Due next month |
| `CURRENT_DATE + INTERVAL '60 days'` | Delivery window |
| `CURRENT_DATE + INTERVAL '90 days'` | Future delivery |
| `CURRENT_DATE + INTERVAL '180 days'` | Long-term delivery |

### Item Due Date Distribution

For urgency variety in calendars/dashboards:

| Category | Count | Date Range |
|----------|-------|------------|
| Overdue | 15% | -14 to -1 days |
| Due Today | 5% | Today |
| Due This Week | 20% | +1 to +7 days |
| Due Next Week | 20% | +8 to +14 days |
| Due This Month | 25% | +15 to +30 days |
| Future | 15% | +31 to +90 days |

---

## 11. Execution Order

### SQL Script Execution Sequence

```
1. 00_UPDATE_USERS.sql          -- UPSERT users (Ross, Dawn, Justin)
2. 01_CLEAR_DATA.sql            -- Truncate project data (NOT users/factories/directory)
3. 02_FACTORIES_TABLE.sql       -- Ensure factories exist
4. 03_DEPARTMENTS.sql           -- Ensure departments exist
5. 04_WORKFLOW_STATIONS.sql     -- Ensure 20 workflow stations exist
6. 05_IMPORT_PROJECTS.sql       -- Create PM + PC projects
7. 06_PROJECT_DATA.sql          -- Tasks, RFIs, Submittals, Milestones
8. 07_WORKFLOW_STATUS.sql       -- Initialize workflow status
9. 08_SALES_DATA.sql            -- Customers, Quotes
10. 09_DIRECTORY_CONTACTS.sql   -- 311 directory contacts
11. 10_PRODUCTION_LINE.sql      -- NEW: Modules, Workers, Shifts, Station Assignments
```

### Or Run Single Master Script

```sql
\i supabase/demo/MASTER_DEMO_DATA_V2.sql
```

---

## 12. Verification Queries

### Count Verification

```sql
SELECT 'users' AS table_name, COUNT(*) AS count FROM users WHERE role IS NOT NULL
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'rfis', COUNT(*) FROM rfis
UNION ALL SELECT 'submittals', COUNT(*) FROM submittals
UNION ALL SELECT 'milestones', COUNT(*) FROM milestones
UNION ALL SELECT 'workflow_stations', COUNT(*) FROM workflow_stations
UNION ALL SELECT 'sales_quotes', COUNT(*) FROM sales_quotes
UNION ALL SELECT 'modules', COUNT(*) FROM modules
UNION ALL SELECT 'workers', COUNT(*) FROM workers
UNION ALL SELECT 'station_templates', COUNT(*) FROM station_templates
UNION ALL SELECT 'worker_shifts', COUNT(*) FROM worker_shifts
ORDER BY table_name;
```

### Expected Counts

| Table | Expected Count |
|-------|----------------|
| users | 12+ |
| projects | 16+ (4 PM + 12 PC) |
| tasks | 120-180 |
| rfis | 30-50 |
| submittals | 50-80 |
| milestones | 80-100 |
| workflow_stations | 20-21 |
| sales_quotes | 20 |
| modules | 63 |
| workers | 60 |
| station_templates | 12 |
| worker_shifts | 50 (active) |

### Role Verification

```sql
-- Verify Plant_GM can see NWBS data
SELECT u.name, u.role, u.factory, f.name AS factory_name
FROM users u
LEFT JOIN factories f ON u.factory_id = f.id
WHERE u.role IN ('Plant_GM', 'PC', 'Production_Manager');

-- Verify modules exist at factory
SELECT f.code, COUNT(m.id) AS module_count
FROM factories f
LEFT JOIN modules m ON m.factory_id = f.id
GROUP BY f.code
ORDER BY module_count DESC;
```

---

## 13. Known Compatibility Requirements

### PGM Dashboard Requirements

For the Plant GM Dashboard to work correctly:

1. **Station Templates** - Must have 12 stations seeded (already in `20260115_plant_manager_system.sql`)
2. **Modules** - Must have `factory_id`, `current_station_id`, `scheduled_start` populated
3. **Workers** - Must have `factory_id`, `is_lead`, `primary_station_id` set
4. **Worker Shifts** - Must have today's shifts with `status = 'active'`
5. **Station Assignments** - Link modules to stations with lead/crew

### PC Dashboard Requirements (Future)

When PC Dashboard is built, it needs:

1. Projects where `owner_id` = PC user ID
2. `building_type = 'STOCK'` for most projects
3. Long lead items table populated
4. Color selections tracking
5. Engineering review status per project

### Calendar Filtering Requirements

The calendar filters by role:

| Role | Sees Projects Where |
|------|---------------------|
| PM | `owner_id = user.id` OR `primary_pm_id = user.id` OR `backup_pm_id = user.id` |
| PC | `owner_id = user.id` AND `user.factory` matches project factory |
| Plant_GM | `factory` matches user's factory |
| Sales_Manager | Quotes `factory` matches user's factory |
| Sales_Rep | Quotes `assigned_to` = user.id |
| Director | All projects |
| VP | All projects |

### Schema Field Requirements

**Projects table must have:**
- `owner_id` (UUID) - Project owner
- `primary_pm_id` (UUID) - Primary PM
- `backup_pm_id` (UUID) - Backup PM
- `factory` (VARCHAR) - Factory code
- `factory_id` (UUID) - FK to factories
- `building_type` (VARCHAR) - STOCK | CUSTOM | GOVERNMENT
- `module_count` (INTEGER) - Number of modules
- `current_phase` (INTEGER) - 1-4

**Modules table must have:**
- `project_id` (UUID) - FK to projects
- `factory_id` (UUID) - FK to factories
- `current_station_id` (UUID) - FK to station_templates
- `scheduled_start` (DATE) - For calendar view
- `status` (VARCHAR) - Module status
- `building_category` (VARCHAR) - From project type

---

## Potential Issues & Mitigations

### Issue 1: Module serial number uniqueness

**Problem:** Serial numbers must be unique per project.
**Mitigation:** Use project number prefix: `{PROJECT_NUMBER}-M{SEQUENCE}`

### Issue 2: Station assignment conflicts

**Problem:** A module can only be at one station at a time.
**Mitigation:** Use UNIQUE constraint `(module_id, station_id)` and clear old assignments.

### Issue 3: Worker shift date boundaries

**Problem:** Shifts span midnight could cause issues.
**Mitigation:** Create shifts starting at `CURRENT_DATE + INTERVAL '6 hours'` (6 AM).

### Issue 4: FK ordering in inserts

**Problem:** Inserting modules before station_templates causes FK errors.
**Mitigation:** Station templates are seeded in migration, not demo data.

### Issue 5: Calendar date filtering

**Problem:** PMs seeing projects they're not assigned to.
**Mitigation:** Ensure `owner_id` OR `primary_pm_id` OR `backup_pm_id` matches user.

---

*Document created: January 15, 2026*
*Last updated: January 15, 2026*
