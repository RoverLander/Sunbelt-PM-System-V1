# Demo Data Requirements Document

## Status: REQUIREMENTS CONFIRMED - January 16, 2026
## Purpose: Reference document for demo data generation logic

---

## EXECUTIVE SUMMARY

This document captures all confirmed requirements for the Sunbelt PM System demo data generation, based on detailed discussions with the project owner (Matthew McDaniel). This serves as the single source of truth for rebuilding the COMPLETE_DEMO_SETUP.sql script.

### Confidence Assessment
| Component | Confidence | Reasoning |
|-----------|------------|-----------|
| User Roles & Factory Assignments | 0.95 | Confirmed via screenshot and discussion |
| Factory Codes | 0.90 | Cross-referenced with directory data |
| PM Project Distribution | 0.95 | Explicit requirements provided |
| Workflow Structure | 0.90 | Detailed phase breakdown confirmed |
| Overall | 0.92 | High confidence in requirements |

---

## PART 1: USER ROLES AND ASSIGNMENTS

### 1.1 Confirmed Users (from database screenshot)

| Name | Email Domain | Role | Factory | Notes |
|------|--------------|------|---------|-------|
| Candy Nelson | sunbeltmodular.com | Director | Corporate | Also wears PM hat, fewer projects |
| Crystal James | sunbeltmodular.com | PM | Corporate | 4+ projects |
| Matthew McDaniel | sunbeltmodular.com | PM | Corporate | Primary: NWBS, Secondary: WM-EVERGREEN |
| Michael | sunbeltmodular.com | PM | Corporate | 4+ projects |
| Hector | sunbeltmodular.com | PM | Corporate | 4+ projects |
| Mitch | nwbsinc.com | Sales_Manager | NWBS | Factory-specific |
| Justin | nwbsinc.com | Production_Manager | NWBS | Factory-specific |
| Robert | nwbsinc.com | Sales_Rep | NWBS | Factory-specific |
| Dawn | nwbsinc.com | PC | NWBS | Handles non-PM jobs at NWBS |
| Ross | nwbsinc.com | Plant_GM | NWBS | Factory-specific |
| Juanita | phoenixmodular.com | PC | PMI | Handles non-PM jobs at PMI |

### 1.2 Role Hierarchy

```
CORPORATE (Remote):
├── VP - Executive oversight
├── Director - Candy (also PM duties)
├── IT_Manager - System administration
├── IT - Technical support
└── PM Team (Corporate) - Crystal, Matthew, Michael, Hector
    └── PMs are NOT tied to specific factories
    └── PMs work across multiple factories

FACTORY-SPECIFIC:
├── Plant_GM - Factory general manager
├── Production_Manager - Production oversight
├── Sales_Manager - Sales team lead
├── Sales_Rep - Sales team member
└── PC - Project Coordinator (handles non-PM jobs)
```

### 1.3 Key Business Rules

1. **PM Team is Corporate/Remote** - Not tied to specific factories
2. **Sales/PC/PGMs are Factory-Specific** - Tied to their factory_id
3. **PMs own PM-flagged projects** - Based on contract value and complexity
4. **PCs handle all other jobs** - Non-PM (STOCK) jobs at their respective factories
5. **Director (Candy) wears PM hat** - But has fewer projects than dedicated PMs

---

## PART 2: FACTORY CODES AND LOCATIONS

### 2.1 Confirmed Factory Codes

| Code | Name | State | Notes |
|------|------|-------|-------|
| NWBS | Northwest Building Systems | WA | Primary factory for Matthew |
| PMI | Phoenix Modular Inc | AZ | Juanita is PC |
| WM-EAST | Whitley Manufacturing East | NC | Whitley division |
| WM-EVERGREEN | Whitley Manufacturing Evergreen | WA | Secondary for Matthew |
| WM-SOUTH | Whitley Manufacturing South | TX | Whitley division |
| WM-ROCHESTER | Whitley Manufacturing Rochester | NY | Whitley division |
| AMT / AMTEX | Amtex Modular | TX | Texas facility |
| BUSA | - | - | Needs verification |
| IBI | - | - | Needs verification |
| C&B / CB | - | - | Needs verification |
| MRS | - | - | Needs verification |
| PRM | - | - | Needs verification |
| SSI | - | - | Needs verification |
| SMM-FL / SMM | Sunbelt Modular Manufacturing | FL | Florida facility |
| SNB | - | - | Needs verification |

### 2.2 Factory Distribution for Demo Data

**Required:** Projects at ALL factories
**Minimum:** 20+ demo projects total
**Distribution:** Ensure each factory has at least 1-2 projects

---

## PART 3: PROJECT DISTRIBUTION REQUIREMENTS

### 3.1 PM Project Assignments

Each PM should have **at least 4 projects**, clustered around primary factories:

| PM | Primary Factory | Secondary Factory | Tertiary | Total Min |
|----|-----------------|-------------------|----------|-----------|
| Matthew McDaniel | NWBS (3 projects) | WM-EVERGREEN (2) | SMM (1) | 6 |
| Crystal James | PMI (3 projects) | WM-SOUTH (2) | AMT (1) | 6 |
| Michael | WM-EAST (3 projects) | WM-ROCHESTER (2) | - | 5 |
| Hector | WM-SOUTH (3 projects) | AMT (2) | - | 5 |
| Candy Nelson | Various (2-3 projects) | - | - | 3 |

### 3.2 PM Backup Assignments

- **Every PM project should have a backup PM**
- Backup should be another PM from the team
- Backup rotation to ensure coverage

### 3.3 PC Project Assignments (Non-PM/STOCK Jobs)

| PC | Factory | Project Count |
|----|---------|---------------|
| Dawn | NWBS | 3-4 STOCK jobs |
| Juanita | PMI | 3-4 STOCK jobs |

### 3.4 Project Types

```sql
-- Project types for demo data
PM_JOB:    is_pm_job = true, higher contract values ($500k+)
STOCK_JOB: is_pm_job = false, handled by PCs, lower values
```

---

## PART 4: WORKFLOW STRUCTURE

### 4.1 Phase Overview

```
PHASE 1: SALES HANDOFF
├── Station 1: Sales Handoff (sequential)
└── Station 2: Kickoff Meeting (sequential)

PHASE 2: PRECONSTRUCTION (Parallel Paths)
├── PATH A: Drawings (Sequential within path)
│   ├── Station 3: 20% Drawings
│   ├── Station 4: 65% Drawings
│   ├── Station 5: 95% Drawings
│   └── Station 6: 100% Drawings
│
├── PATH B: Color Selections (Parallel to drawings)
│   └── Station 7: Color Selection Sign-off
│
├── PATH C: Long Lead Items (Parallel to drawings)
│   └── Station 8: Long Lead Items Sign-off
│
└── PATH D: Cutsheets (Parallel to drawings)
    └── Station 9: Cutsheet Submittal Sign-off

    * Note: Cutsheets can be sent in packages:
      - Electrical
      - Fixtures
      - HVAC
      - Cabinets

PHASE 3: APPROVALS
├── Station 10: Engineering Review (can kick back to drawings)
├── Station 11: Third Party Approval (can kick back)
├── Station 12: State Approval(s) (parallel if multi-state)
└── Station 13: Production Release Gate
    * REQUIRES ALL:
      - 100% Drawings signed off
      - Engineering approved
      - All Change Orders approved + POs received
      - Cutsheet submittals approved
      - Long lead items approved
      - Color selections approved
    * Third Party + State approvals are PARALLEL to production

PHASE 4: PRODUCTION & CLOSEOUT
├── Station 14: Production
├── Station 15: QC Inspection
├── Station 16: Staging
├── Station 17: Delivery
├── Station 18: Set Complete (tracking - dealer responsibility)
└── Station 19: Project Closeout
```

### 4.2 Multi-State Approvals

Two models supported:

1. **Pack Model**: Single approval covers multiple states (agreement pack)
   - One station, approval gets seals/tags for all states in pack

2. **Parallel Model**: Independent state approvals required
   - Multiple parallel stations, one per state
   - Each state approval is independent

### 4.3 Workflow Editability

**User can customize per project:**
- Add stations
- Delete stations
- Reorder stations
- Modify parallel paths

---

## PART 5: SQL GENERATION RULES

### 5.1 User Lookup Logic

```sql
-- Find users by email domain and role
-- DO NOT assume role values - verify from actual data
SELECT id, email, name, role, factory, factory_id
FROM users
WHERE email LIKE '%sunbeltmodular.com'  -- Corporate/PM team
   OR email LIKE '%nwbsinc.com'          -- NWBS factory
   OR email LIKE '%phoenixmodular.com';  -- PMI factory
```

### 5.2 Factory Assignment Logic

```sql
-- Match factory code from users.factory to factories.code
-- Use factory_id for foreign key relationships
-- factory field is TEXT code, factory_id is UUID reference
```

### 5.3 Project Creation Logic

```sql
-- PM Jobs
INSERT INTO projects (
  name,
  owner_id,           -- The PM who owns the project
  primary_pm_id,      -- Same as owner_id for PM jobs
  backup_pm_id,       -- Another PM from the team
  factory,            -- Factory code (TEXT)
  factory_id,         -- Factory UUID
  is_pm_job,          -- TRUE for PM jobs
  contract_value,     -- $500k+ for PM jobs
  status,
  ...
)

-- STOCK Jobs (PC)
INSERT INTO projects (
  name,
  owner_id,           -- The PC who owns the project
  primary_pm_id,      -- NULL for STOCK jobs
  backup_pm_id,       -- NULL for STOCK jobs
  factory,            -- Factory code
  factory_id,         -- Factory UUID
  is_pm_job,          -- FALSE for STOCK jobs
  contract_value,     -- Lower values for STOCK
  status,
  ...
)
```

### 5.4 Workflow Station Generation

```sql
-- Create workflow_templates for each phase
-- Create workflow_stations linked to templates
-- Set parallel_group_id for parallel paths
-- Set requires_all_previous for gates
-- Set can_kickback for review stations
```

---

## PART 6: VERIFICATION CHECKLIST

After running the SQL:

1. [ ] All PMs can log in and see their projects
2. [ ] Matthew McDaniel sees 6+ projects (NWBS, WM-EVERGREEN, SMM)
3. [ ] Each PM has 4+ projects with proper clustering
4. [ ] Dawn (PC) sees STOCK jobs at NWBS
5. [ ] Juanita (PC) sees STOCK jobs at PMI
6. [ ] All factories have at least 1-2 projects
7. [ ] Total project count is 20+
8. [ ] Workflow stations show correctly (no duplicates)
9. [ ] Parallel paths render properly in workflow canvas
10. [ ] Project cards show correct PM/PC assignments

---

## PART 7: KEY CAVEATS

1. **Email Domain Matching**: Users are identified by email domain, not role alone
2. **Factory Code Format**: Must match exactly (e.g., "NWBS" not "nwbs")
3. **Null Handling**: PC projects have NULL for primary_pm_id and backup_pm_id
4. **Dynamic Dates**: All dates should be relative to CURRENT_DATE for longevity
5. **Contract Values**: PM jobs $500k+, STOCK jobs $100k-$300k range

---

## PART 8: REFERENCE DOCUMENTS

- [MISSION_STATEMENT_&_GOAL.md](./MISSION_STATEMENT_&_GOAL.md) - Overall system goals
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete schema reference
- [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) - Component structure
- [REACT_BEST_PRACTICES.md](./REACT_BEST_PRACTICES.md) - Performance patterns
- [COMPLETE_DATA_CONSISTENCY_FIX.md](./COMPLETE_DATA_CONSISTENCY_FIX.md) - Validation rules

---

## CHANGELOG

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-16 | 1.0 | Initial document created from discussion |

