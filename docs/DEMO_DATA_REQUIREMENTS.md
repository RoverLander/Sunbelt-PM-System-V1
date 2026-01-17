# Demo Data Requirements Document

## Status: UPDATED FOR COMPREHENSIVE DEMO - January 17, 2026
## Purpose: Complete reference for demo data covering ALL system features

---

## EXECUTIVE SUMMARY

This document defines ALL demo data requirements for the Sunbelt PM System, covering:
- **PM Dashboard** - Project management, workflow, tasks, RFIs, submittals
- **Sales Pipeline** - Quotes, customers, dealers, sales team
- **Plant Manager (PGM)** - Production line, modules, crews, QC
- **PWA Mobile Floor App** - Worker auth, inventory receiving
- **IT Administration** - Users, error tracking, feature flags, announcements
- **VP/Director Views** - Executive reports, cross-factory visibility
- **PC Dashboard** - Factory-specific STOCK job management
- **Directory System** - Contacts (internal and external)

---

## PART 1: USER ROLES AND FACTORY ASSIGNMENTS

### 1.1 Required Users by Role

| Role | Users Needed | Factory | Purpose |
|------|--------------|---------|---------|
| VP | 1 | Corporate | Executive dashboard, all-factory view |
| Director | 1-2 | Corporate | Team management, reports |
| PM | 4+ | Corporate | Project management across factories |
| PC | 2+ | Factory-specific | STOCK jobs at assigned factory |
| Sales_Manager | 1-2 | Factory-specific | Sales team management |
| Sales_Rep | 2-4 | Factory-specific | Quote creation, pipeline |
| Plant_GM | 2+ | Factory-specific | Plant Manager Dashboard access |
| IT_Manager | 1 | Corporate | IT admin tools |
| IT | 1-2 | Corporate | Error tracking, support |

### 1.2 PM Assignments (Cross-Factory)

```
Matthew McDaniel (PM):
├── Primary: NWBS (3-4 projects)
├── Secondary: WM-EVERGREEN (2 projects)
└── Tertiary: SMM (1 project)

Crystal James (PM):
├── Primary: PMI (3 projects)
├── Secondary: WM-SOUTH (2 projects)
└── Tertiary: AMT (1 project)

Michael (PM):
├── Primary: WM-EAST (3 projects)
└── Secondary: WM-ROCHESTER (2 projects)

Hector (PM):
├── Primary: WM-SOUTH (3 projects)
└── Secondary: AMT (2 projects)

Candy Nelson (Director/PM):
└── Various factories (2-3 projects) - Director also wears PM hat
```

### 1.3 PC Assignments (Factory-Specific)

| PC | Factory | Project Type | Count |
|----|---------|--------------|-------|
| Dawn | NWBS | STOCK jobs | 3-4 |
| Juanita | PMI | STOCK jobs | 3-4 |

---

## PART 2: FACTORY CONFIGURATION

### 2.1 Required Factories (9 minimum)

| Code | Name | Region | Required Data |
|------|------|--------|---------------|
| NWBS | Northwest Building Systems | Northwest | Full demo (projects, modules, workers, POs) |
| PMI | Phoenix Modular Industries | Southwest | Full demo |
| WM-EVERGREEN | Whitley Evergreen | Northwest | Projects + modules |
| WM-EAST | Whitley East | East | Projects + modules |
| WM-SOUTH | Whitley South | South | Projects + modules |
| WM-ROCHESTER | Whitley Rochester | Northeast | Projects only |
| AMT | Amtex Modular | Southwest | Projects + modules |
| SMM | Sunbelt Mobile Manufacturing | South | Projects only |
| SSI | Sunbelt Systems Idaho | Northwest | Projects only |

### 2.2 Primary Demo Factory: NWBS

NWBS should have the most complete data for live demos:
- 15+ workers (6+ leads with PWA access)
- 6+ active projects
- 20+ modules across all 12 stations
- 5+ purchase orders (various statuses)
- QC records, station assignments, shifts

---

## PART 3: PROJECT DISTRIBUTION

### 3.1 Total Projects: 25+ minimum

**By Phase:**
| Phase | Count | Description |
|-------|-------|-------------|
| Phase 1 | 2-3 | Just kicked off (Sales Handoff, Kickoff) |
| Phase 2 | 6-8 | Preconstruction (Drawings, Color, Long Lead) |
| Phase 3 | 5-7 | Approvals (Engineering, State, Production Release) |
| Phase 4 | 8-10 | Production & Closeout (modules on floor) |

**By Building Type:**
| Type | Count | Contract Value Range |
|------|-------|---------------------|
| GOVERNMENT | 8-10 | $1M - $4.5M |
| CUSTOM | 8-10 | $800K - $3.2M |
| FLEET | 3-4 | $400K - $1.6M |
| STOCK | 4-6 | $100K - $500K (PC jobs) |

**By Factory Distribution:**
- NWBS: 6 projects
- PMI: 4 projects
- WM-EVERGREEN: 3 projects
- WM-EAST: 3 projects
- WM-SOUTH: 3 projects
- WM-ROCHESTER: 2 projects
- AMT: 2 projects
- SMM: 2 projects

### 3.2 Project Health Status

Each phase should have a mix:
- **On Track:** 60%
- **At Risk:** 30%
- **Critical:** 10%

### 3.3 Backup PM Assignments

Every PM project MUST have a backup PM from another team member:
- Matthew's projects → Crystal or Michael as backup
- Crystal's projects → Hector or Matthew as backup
- Michael's projects → Matthew or Hector as backup
- Etc.

---

## PART 4: WORKFLOW & WORKFLOW STATUS

### 4.1 Workflow Stations (19 Stations, 4 Phases)

**Phase 1: Initiation (2)**
1. Sales Handoff
2. Kickoff Meeting

**Phase 2: Preconstruction (7)**
3. 20% Drawings
4. 65% Drawings
5. 95% Drawings
6. 100% Drawings
7. Color Selections (parallel)
8. Long Lead Items (parallel)
9. Cutsheet Submittals (parallel)

**Phase 3: Approvals (4)**
10. Engineering Review (can kick back)
11. Third Party Review (optional, can kick back)
12. State Approval
13. Production Release (GATE)

**Phase 4: Production & Closeout (6)**
14. Production
15. QC Inspection
16. Staging
17. Delivery
18. Set Complete
19. Project Closeout

### 4.2 Project Workflow Status

Each project needs `project_workflow_status` records:
- Phases before `current_phase` → status: 'complete'
- Current phase stations → mix of 'in_progress' and 'not_started'
- Future phases → status: 'not_started'

---

## PART 5: TASKS, RFIs, SUBMITTALS

### 5.1 Tasks Per Project

| Project Phase | Tasks Count | Status Mix |
|---------------|-------------|------------|
| Phase 1-2 | 5-10 | 20% complete, 50% in progress, 30% not started |
| Phase 3 | 10-15 | 30% complete, 40% in progress, 30% not started |
| Phase 4 | 8-12 | 50% complete, 30% in progress, 20% not started |

**Task Types:**
- Internal tasks (assigned to PM team)
- External tasks (assigned to directory contacts or external contacts)
- Milestone-linked tasks

### 5.2 RFIs Per Project

| Project Phase | RFI Count | Status Mix |
|---------------|-----------|------------|
| Phase 2-3 | 3-8 | 30% Open, 20% Pending, 40% Answered, 10% Closed |

### 5.3 Submittals Per Project

| Project Phase | Submittal Count | Status Mix |
|---------------|-----------------|------------|
| Phase 2-3 | 4-10 | 20% Pending, 30% Submitted, 30% Approved, 20% Under Review |

---

## PART 6: SALES PIPELINE

### 6.1 Sales Customers

| Type | Count | Description |
|------|-------|-------------|
| General | 10+ | Standard customers |
| Government | 5+ | Government entities |
| Dealer | 5+ | Dealer customers |
| Direct | 3+ | Direct purchasers |

### 6.2 Sales Quotes

| Status | Count | Description |
|--------|-------|-------------|
| draft | 3-5 | Not yet sent |
| pending | 2-3 | Awaiting response |
| sent | 3-5 | Sent to customer |
| negotiating | 4-6 | In active negotiation |
| awaiting_po | 2-4 | Customer accepted, awaiting PO |
| po_received | 2-3 | PO received, ready to convert |
| won | 5-8 | Converted to projects |
| lost | 3-5 | Lost deals (for reporting) |

### 6.3 Dealers

| Count | Factory Association |
|-------|---------------------|
| 8-10 | Distributed across factories |

---

## PART 7: PLANT MANAGER (PGM) SYSTEM

### 7.1 Station Templates (12 Production Stages)

| Order | Code | Name | Inspection? |
|-------|------|------|-------------|
| 1 | FRAME_WELD | Metal Frame Welding | No |
| 2 | ROUGH_CARP | Rough Carpentry | No |
| 3 | EXT_SIDING | Exterior Siding | No |
| 4 | INT_ROUGH | Interior Rough-out | No |
| 5 | ELEC_ROUGH | Electrical Rough-in | Requires |
| 6 | PLUMB_ROUGH | Plumbing Rough-in | Requires |
| 7 | HVAC | HVAC Install | Requires |
| 8 | INWALL_INSP | In-Wall Inspection | IS INSPECTION |
| 9 | INT_FINISH | Interior Finish | No |
| 10 | FINAL_INSP | Final State Inspection | IS INSPECTION |
| 11 | STAGING | Staging | No |
| 12 | PICKUP | Dealer Pickup | No |

Each station needs:
- Duration defaults by building category
- QC checklist items (JSONB array)

### 7.2 Workers (Factory Floor)

**Per Factory (NWBS minimum):**

| Type | Count | PWA Access |
|------|-------|------------|
| Station Leads | 6+ | Yes (PIN enabled) |
| Regular Workers | 10+ | No |
| QC Inspectors | 2+ | Yes (PIN enabled) |

**Worker Attributes:**
- employee_id (badge number)
- PIN hash (for leads/QC)
- primary_station_id
- hourly_rate
- certifications (JSONB)

### 7.3 Modules (Production Units)

**Distribution Across Stations:**

| Station Range | Module Count | Status |
|---------------|--------------|--------|
| 1-3 (Early) | 3-4 | In Progress, In Queue |
| 4-7 (Middle) | 4-6 | In Progress |
| 8-10 (Inspection/Finish) | 4-6 | In Progress, QC Hold |
| 11-12 (Staging/Pickup) | 2-4 | Staged, Shipped |

**Module Attributes:**
- serial_number (factory-project-sequence)
- building_category (stock, fleet, government, custom)
- is_rush flag (10% should be rush)
- scheduled_start/end dates
- special_requirements (JSONB array)

### 7.4 Worker Shifts (Today's Attendance)

- 70-80% of workers should have active shifts
- Clock-in times staggered (5:30 AM - 7:00 AM)
- Source: 'kiosk' or 'app'

### 7.5 Station Assignments (Crews at Work)

For each module "In Progress":
- Assign a lead
- Assign 2-4 crew members
- Set start_time (within today)
- estimated_hours based on building_category

### 7.6 QC Records

For modules at inspection stations:
- 80% passed, 20% failed
- Scores: 85-100 for passed, 50-80 for failed
- checklist_results (JSONB with pass/fail per item)
- Some with notes for defects

### 7.7 Plant Config

Each factory needs:
- time_settings (shift times, OT thresholds)
- efficiency_modules (which PGM features enabled)
- calendar_settings (work days, holidays)

---

## PART 8: PWA MOBILE FLOOR APP

### 8.1 Worker Authentication

Leads need:
- pin_hash (bcrypt hash of 4-6 digit PIN)
- For demo: all leads can use PIN 1234

**DEV BYPASS:**
- Employee ID: TEST
- PIN: 1234
- Associates with NWBS factory

### 8.2 Purchase Orders (Inventory Receiving)

| Status | Count | Description |
|--------|-------|-------------|
| ordered | 3-4 | Awaiting delivery |
| partial | 2-3 | Some items received |
| received | 2-3 | Fully received (history) |
| pending | 1-2 | Not yet ordered |

**PO Attributes:**
- po_number (PO-{FACTORY}-{YEAR}-{SEQ})
- vendor name and contact
- line_items (JSONB array with parts, quantities, received_qty)
- expected_delivery date
- total cost

### 8.3 Inventory Receipts

For partially received POs:
- Receipt records for each line item received
- received_by (worker_id)
- condition (good, damaged, partial)
- notes for discrepancies

---

## PART 9: DIRECTORY SYSTEM

### 9.1 Directory Contacts (Internal)

| Department | Count | Factory Distribution |
|------------|-------|---------------------|
| Executive | 5-10 | Corporate |
| Sales | 10-15 | All factories |
| Operations | 20-30 | All factories |
| Engineering | 10-15 | All factories |
| Drafting | 10-15 | All factories |
| Production | 20-30 | Factory-specific |
| Purchasing | 5-10 | All factories |

### 9.2 External Contacts

| Type | Count | Description |
|------|-------|-------------|
| Customer | 15-20 | End customers |
| Architect | 5-10 | Design firms |
| Inspector | 5-8 | Third-party inspectors |
| Vendor | 10-15 | Material suppliers |
| Dealer | 8-10 | Distribution partners |

---

## PART 10: IT ADMINISTRATION

### 10.1 Announcements

| Type | Count | Targeting |
|------|-------|-----------|
| info | 2-3 | All users |
| warning | 1-2 | Specific roles |
| maintenance | 1 | All users (future date) |

### 10.2 Feature Flags

| Category | Count | State |
|----------|-------|-------|
| feature | 3-5 | Mix of enabled/disabled |
| ui | 2-3 | Enabled |
| experimental | 1-2 | Disabled, role-restricted |

### 10.3 System Errors (Optional)

For error tracking demo:
- 5-10 captured errors
- Various components/pages
- Mix of resolved/unresolved

---

## PART 11: ADDITIONAL ITEMS

### 11.1 Change Orders

Projects in Phase 3-4 should have:
- 2-5 change orders per project
- Mix of Draft, Pending, Approved status
- Various amounts ($5K - $50K)

### 11.2 Long Lead Items

Projects in Phase 2 should have:
- 3-8 long lead items
- Status: Pending, Ordered, Delivered
- Lead times: 4-12 weeks

### 11.3 Color Selections

Projects in Phase 2-3 should have:
- 5-15 color selections per project
- Categories: Wall, Floor, Trim, Exterior, Cabinet, etc.
- Status: Pending, Submitted, Confirmed

### 11.4 Milestones

Each project should have:
- 5-8 milestones
- Key dates: Drawings complete, Approval, Production start, Delivery

### 11.5 Project Logs

Recent activity for each project:
- Status changes
- Task updates
- Important notes

---

## PART 12: DEMO SCENARIOS

### Scenario A: PM Daily Work

**As Matthew McDaniel (PM):**
1. See dashboard with 6 projects
2. View project NWBS-26-001 in Phase 4
3. Check workflow status
4. Review tasks, RFIs, submittals
5. View production status (modules at stations)

### Scenario B: Plant Manager Dashboard

**As Plant_GM at NWBS:**
1. See production line with 12 stations
2. View modules at each station
3. Check attendance (workers clocked in)
4. Review QC records and holds
5. Takt time and queue monitoring

### Scenario C: PWA Mobile Demo

**As Lead Worker (EMP001 or TEST):**
1. Login with PIN on mobile device
2. Look up module NWBS-26-001-M3
3. Complete QC inspection checklist
4. Move module to next station
5. Receive inventory from PO

### Scenario D: Sales Pipeline

**As Sales_Manager:**
1. View pipeline by status
2. See quote conversion funnel
3. Check PM-flagged quotes
4. Review sales rep performance
5. Convert won quote to project

### Scenario E: VP Executive View

**As VP:**
1. See all factories on dashboard
2. Compare project counts/values
3. View team workload
4. Check cross-factory metrics
5. Generate executive report

### Scenario F: IT Administration

**As IT_Manager:**
1. View user list by role
2. Check active sessions
3. Review error tickets
4. Toggle feature flags
5. Create announcement

---

## PART 13: SQL GENERATION RULES

### 13.1 Date Calculations

All dates relative to CURRENT_DATE:
```sql
-- Project dates
start_date: CURRENT_DATE - (project_age_days)
target_online_date: CURRENT_DATE + (remaining_days)

-- Module dates
scheduled_start: CURRENT_DATE - (days_in_production)
scheduled_end: scheduled_start + duration_days
```

### 13.2 UUID Generation

Use PostgreSQL functions:
```sql
gen_random_uuid()  -- For new records
uuid_generate_v4() -- Alternative
```

### 13.3 Factory Matching

Match factory by code, not name:
```sql
SELECT id FROM factories WHERE code = 'NWBS'
```

### 13.4 User Lookup

Find users by email pattern and role:
```sql
SELECT id FROM users
WHERE LOWER(name) LIKE '%matthew%'
   OR LOWER(email) LIKE '%mmcdaniel%'
```

---

## PART 14: VERIFICATION CHECKLIST

After running demo data SQL:

### User Access
- [ ] All users can log in
- [ ] Each role sees correct dashboard
- [ ] Factory assignments working

### Project Management
- [ ] 25+ projects visible
- [ ] Projects distributed across factories
- [ ] Workflow status shows correctly
- [ ] Tasks, RFIs, Submittals linked

### Plant Manager
- [ ] 12 stations visible
- [ ] Modules at various stations
- [ ] Workers clocked in today
- [ ] QC records showing
- [ ] Station assignments created

### PWA Mobile
- [ ] TEST/1234 login works
- [ ] Modules searchable
- [ ] QC inspection completable
- [ ] Station moves working
- [ ] Purchase orders visible

### Sales Pipeline
- [ ] Quotes in all statuses
- [ ] Customers linked
- [ ] Dealers configured
- [ ] Sales team visible

### IT Admin
- [ ] User management accessible
- [ ] Feature flags listed
- [ ] Announcements showing

---

## CHANGELOG

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-16 | 1.0 | Initial document |
| 2026-01-17 | 2.0 | Complete rewrite for all features (PM, PGM, PWA, Sales, IT, VP/Director) |
| 2026-01-17 | 2.1 | COMPREHENSIVE_DEMO_DATA.sql verified working; schema compatibility fixes documented |
