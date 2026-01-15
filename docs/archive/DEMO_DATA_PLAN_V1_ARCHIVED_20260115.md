# Demo Data Reset Plan

## Overview

This document outlines the comprehensive plan to reset and populate demo data for the Sunbelt PM System, showcasing all features including:
- 4-Phase Workflow Canvas (React Flow visualization)
- Sales Team Dashboard & Pipeline
- Praxis Integration fields
- Calendar with role-based filtering
- Factory Map visualization
- All dashboard types (VP, Director, PM, PC, Sales Manager)

---

## Phase 1: Clear Existing Data

### Script: `01_CLEAR_DATA.sql`

**Purpose:** Remove all project-related data while preserving system configuration.

**Order of deletion (respecting foreign keys):**
```
1.  floor_plan_items
2.  floor_plan_pages
3.  floor_plans
4.  change_order_items
5.  change_orders
6.  color_selections
7.  long_lead_items
8.  cutsheet_submittals
9.  drawing_versions
10. engineering_reviews
11. state_approvals
12. third_party_reviews
13. warning_emails_log
14. project_workflow_status
15. project_logs
16. project_documents_checklist
17. praxis_import_log
18. milestones
19. submittals
20. rfis
21. tasks
22. attachments / file_attachments
23. projects

For Sales:
24. sales_quote_revisions
25. sales_activities
26. sales_quotes
27. sales_customers
```

**What to KEEP:**
- `users` (authenticated users)
- `factories` (master data)
- `factory_contacts` (can regenerate)
- `dealers` (Praxis master data)
- `workflow_stations` (21 stations - DO NOT DELETE)
- `feature_flags` (system config)
- `announcements` (system config)

---

## Phase 2: Verify/Seed Workflow Stations

### Script: `02_WORKFLOW_STATIONS.sql`

**Critical:** The Workflow Canvas requires 21 workflow stations to exist.

**21 Stations Across 4 Phases:**

| Phase | # | station_key | Name | Default Owner |
|-------|---|-------------|------|---------------|
| **1 - Initiation** | 1 | `sales_handoff` | Sales Handoff | pm |
| | 2 | `kickoff_meeting` | Kickoff Meeting | pm |
| | 3 | `site_survey` | Site Survey | pm |
| **2 - Dealer Sign-Offs** | 4 | `drawings_20` | 20% Drawings | drafting |
| | 5 | `drawings_65` | 65% Drawings | drafting |
| | 6 | `drawings_95` | 95% Drawings | drafting |
| | 7 | `drawings_100` | 100% Drawings | drafting |
| | 8 | `color_selections` | Color Selections | dealer |
| | 9 | `long_lead_items` | Long Lead Items | procurement |
| | 10 | `cutsheets` | Cutsheet Submittals | dealer |
| **3 - Internal Approvals** | 11 | `engineering_review` | Engineering Review | engineering |
| | 12 | `third_party_review` | Third Party Review | third_party |
| | 13 | `state_approval` | State Approval | state |
| | 14 | `permit_submission` | Permit Submission | pm |
| | 15 | `change_orders` | Change Orders | pm |
| **4 - Delivery** | 16 | `production_start` | Production Start | factory |
| | 17 | `qc_inspection` | QC Inspection | factory |
| | 18 | `delivery_scheduled` | Delivery Scheduled | pm |
| | 19 | `delivery_complete` | Delivery Complete | pm |
| | 20 | `set_complete` | Set Complete | pm |
| | 21 | `project_closeout` | Project Closeout | pm |

---

## Phase 3: Create Demo Users

### Script: `03_USERS.sql`

**Demo Users Required (10 users across roles):**

| Role | Name | Email | Factory | Notes |
|------|------|-------|---------|-------|
| VP | Executive User | vp@demo.sunbelt.com | All | Executive dashboard |
| Director | Regional Director | director@demo.sunbelt.com | Phoenix, Southeast | Multi-factory view |
| PM | Candy Juhnke | candy.juhnke@sunbeltmodular.com | Phoenix | Primary PM |
| PM | Crystal Meyers | crystal.meyers@sunbeltmodular.com | Southeast | Primary PM |
| PM | Matthew McDaniel | matthew.mcdaniel@sunbeltmodular.com | SSI | Primary PM |
| PC | Juanita Earnest | juanita.earnest@phoenixmodular.com | Phoenix | Plant Controller |
| Sales_Manager | Sales Manager | sales.manager@demo.sunbelt.com | All | Sales Team view |
| Sales_Rep | Sales Rep 1 | sales.rep1@demo.sunbelt.com | Phoenix | Quote entry |
| Sales_Rep | Sales Rep 2 | sales.rep2@demo.sunbelt.com | Southeast | Quote entry |
| IT | Admin User | admin@demo.sunbelt.com | All | System admin |

**Note:** Users must exist in Supabase Auth first, then sync to users table.

---

## Phase 4: Import Demo Projects

### Script: `04_PROJECTS.sql`

**5 Demo Projects (one per workflow phase + variety):**

### Project 1: Phase 1 - Just Started
```
Project Number: DEMO-2026-001
Name: Phoenix Medical Office - Phase 1
Factory: Phoenix
Client: SPECIALIZED TESTING & CONSTRUCTION
Contract Value: $450,000
Status: In Progress
Health: On Track
Workflow Phase: 1 (Initiation - kickoff_meeting in progress)
Primary PM: Candy Juhnke
```

### Project 2: Phase 2 - Dealer Sign-Offs (Mid-workflow)
```
Project Number: DEMO-2026-002
Name: Southeast Distribution Center
Factory: Southeast
Client: MOBILE MODULAR GROUP (MMG)
Contract Value: $1,200,000
Status: In Progress
Health: On Track
Workflow Phase: 2 (drawings_65 in progress)
Primary PM: Crystal Meyers
Backup PM: Candy Juhnke
Features: Long lead items, color selections pending
```

### Project 3: Phase 3 - Internal Approvals
```
Project Number: DEMO-2026-003
Name: VA Modular Kitchen Complex
Factory: Southeast
Client: KITCHENS TO GO
Contract Value: $2,500,000
Status: In Progress
Health: At Risk (engineering delay)
Workflow Phase: 3 (engineering_review in progress)
Primary PM: Crystal Meyers
Features: 2 change orders, drawing versions complete
```

### Project 4: Phase 4 - Near Completion
```
Project Number: DEMO-2025-098
Name: SSI Warehouse Expansion
Factory: SSI
Client: UNITED RENTALS
Contract Value: $875,000
Status: In Progress
Health: On Track
Workflow Phase: 4 (qc_inspection complete, delivery_scheduled in progress)
Primary PM: Matthew McDaniel
Features: Most tasks complete, floor plans with markers
```

### Project 5: Critical/Overdue Project
```
Project Number: DEMO-2024-050
Name: Disney Conference Building (CRITICAL)
Factory: Southeast
Client: MOBILE MODULAR - AUBURNDALE
Contract Value: $680,000
Status: In Progress
Health: Critical (past due)
Workflow Phase: 2 (stuck at drawings_95)
Primary PM: Crystal Meyers
Features: Overdue tasks, blocked RFIs, urgent items
```

---

## Phase 5: Generate Project Data

### Script: `05_PROJECT_DATA.sql`

**Per-Project Data Generation:**

### 5.1 Project Workflow Status
Initialize `project_workflow_status` for each project based on current phase:
- Completed stations → status: 'completed', completed_date set
- Current station → status: 'in_progress', started_date set
- Future stations → status: 'not_started'

### 5.2 Tasks (60-80 total)
Per project based on phase:
- Phase 1 project: 5-6 tasks (1-2 completed, 3-4 not started)
- Phase 2 project: 8-10 tasks (4-5 completed, 2-3 in progress, 2 not started)
- Phase 3 project: 12-15 tasks (8-10 completed, 3-4 in progress, 1-2 awaiting response)
- Phase 4 project: 18-20 tasks (16-18 completed, 2 in progress)
- Critical project: 10 tasks (4 completed, 2 blocked, 4 overdue)

**Task Fields:**
```sql
- project_id (FK)
- title
- description
- status: 'Not Started' | 'In Progress' | 'Awaiting Response' | 'Blocked' | 'Completed' | 'Cancelled'
- priority: 'Low' | 'Medium' | 'High' | 'Urgent'
- due_date
- assigned_to (user_id)
- assigned_court: 'dealer' | 'factory' | 'pm' | 'engineering' | 'drafting' | 'procurement'
- workflow_station_key (FK)
- is_external (boolean)
```

### 5.3 RFIs (25-30 total)
Per project:
- Phase 1: 1-2 RFIs (drafts)
- Phase 2: 4-5 RFIs (mix of open, pending, answered)
- Phase 3: 6-8 RFIs (mostly answered)
- Phase 4: 10-12 RFIs (all closed)
- Critical: 5-6 RFIs (2 urgent/overdue)

**RFI Fields:**
```sql
- project_id
- rfi_number (e.g., 'DEMO-2026-001-RFI-001')
- number (sequence)
- subject
- question
- answer (for answered RFIs)
- status: 'Draft' | 'Open' | 'Pending' | 'Answered' | 'Closed'
- priority: 'Low' | 'Medium' | 'High' | 'Urgent'
- due_date
- date_sent
- is_external
- sent_to
- workflow_station_key (optional)
```

### 5.4 Submittals (20-25 total)
```sql
- project_id
- submittal_number
- title
- submittal_type: 'Shop Drawings' | 'Product Data' | 'Samples' | 'Manufacturer Data'
- status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Approved with Comments' | 'Rejected' | 'Revise and Resubmit'
- manufacturer
- model_number
- submitted_date
- response_date
```

### 5.5 Milestones (4-6 per project)
Standard milestones:
1. Sales Handoff
2. 65% Drawings Approved
3. Production Start
4. Delivery
5. Set Complete
6. Project Closeout

### 5.6 Drawing Versions (for Phase 2+ projects)
```sql
- project_id
- drawing_percentage: 20 | 65 | 95 | 100
- version_number
- status: 'Pending' | 'Submitted' | 'Under Review' | 'Approved' | 'Approved with Redlines' | 'Rejected'
- submitted_date
- response_date
- dealer_response
- document_url (placeholder)
```

### 5.7 Long Lead Items (for Phase 2+ projects)
```sql
- project_id
- item_name: 'HVAC Unit' | 'Electrical Panel' | 'Generator' | 'Custom Windows'
- manufacturer
- supplier
- lead_time_weeks
- order_date
- expected_delivery
- status: 'Pending' | 'Ordered' | 'In Transit' | 'Delivered'
- has_cutsheet
```

### 5.8 Color Selections (for Phase 2+ projects)
```sql
- project_id
- category: 'Roof' | 'Siding' | 'Trim' | 'Flooring' | 'Interior Walls' | 'Doors' | 'Countertops'
- item_name
- color_name
- color_code
- manufacturer
- is_non_stock
- status: 'Pending' | 'Confirmed'
```

### 5.9 Change Orders (for Phase 3+ projects)
```sql
- project_id
- co_number / change_order_number
- status: 'Draft' | 'Sent' | 'Signed' | 'Implemented'
- total_amount
- date
- sent_date, signed_date, implemented_date
+ change_order_items (line items)
```

### 5.10 Engineering Reviews (for Phase 3+ projects)
```sql
- project_id
- review_type: 'Internal' | 'External' | 'Third Party'
- status: 'Pending' | 'In Review' | 'Approved' | 'Revisions Required'
- reviewer_name
- stamp_number (for approved)
```

---

## Phase 6: Sales Pipeline Data

### Script: `06_SALES_DATA.sql`

**Sales Customers (5-6):**
```sql
- SPECIALIZED TESTING & CONSTRUCTION
- MOBILE MODULAR GROUP
- KITCHENS TO GO
- UNITED RENTALS
- PACIFIC MOBILE STRUCTURES
```

**Sales Quotes (8-10):**

| Quote # | Customer | Status | Value | Outlook % | Praxis # | Factory |
|---------|----------|--------|-------|-----------|----------|---------|
| SQ-2026-001 | Specialized Testing | Won | $450,000 | 100% | PX-12345 | Phoenix |
| SQ-2026-002 | MMG | Negotiating | $1,200,000 | 75% | PX-12346 | Southeast |
| SQ-2026-003 | Kitchens To Go | Awaiting PO | $2,500,000 | 95% | - | Southeast |
| SQ-2026-004 | United Rentals | PO Received | $875,000 | 100% | PX-12347 | SSI |
| SQ-2026-005 | New Client A | Sent | $650,000 | 40% | - | Phoenix |
| SQ-2026-006 | New Client B | Draft | $380,000 | 20% | - | Phoenix |
| SQ-2026-007 | PMSI | Negotiating | $920,000 | 60% | PX-12348 | NWBS |
| SQ-2026-008 | New Client C | Lost | $550,000 | 0% | - | Southeast |

**Fields for Praxis Integration:**
- praxis_quote_number
- praxis_source_factory
- dealer_id (FK to dealers)
- building_type
- building_width, building_length
- square_footage
- module_count
- pm_flagged (boolean for "needs PM attention")

---

## Phase 7: Floor Plans & Markers

### Script: `07_FLOOR_PLANS.sql` (Optional - requires image files)

For Project 4 (Phase 4 - near completion):
- 2 floor plan records
- 8-10 markers linked to tasks/RFIs

**Marker Types:**
- Task markers (linked to specific tasks)
- RFI markers (linked to RFIs)
- General markers (notes)

---

## Phase 8: Project Logs

### Script: `08_PROJECT_LOGS.sql`

Generate realistic log entries:
- Status change logs
- Task update logs (auto-generated style)
- PM notes (manual entries)
- Important/pinned entries

**Per Project:**
- Phase 1: 3-5 logs
- Phase 2: 8-10 logs
- Phase 3: 12-15 logs
- Phase 4: 20-25 logs
- Critical: 15-20 logs (with urgent flags)

---

## Execution Order

1. **Run `01_CLEAR_DATA.sql`** - Wipe existing data
2. **Run `02_WORKFLOW_STATIONS.sql`** - Ensure 21 stations exist
3. **Run `03_USERS.sql`** - Create demo users (after Auth setup)
4. **Run `04_PROJECTS.sql`** - Create 5 demo projects
5. **Run `05_PROJECT_DATA.sql`** - Generate tasks, RFIs, submittals, etc.
6. **Run `06_SALES_DATA.sql`** - Create sales pipeline data
7. **Run `07_FLOOR_PLANS.sql`** - (Optional) Add floor plan markers
8. **Run `08_PROJECT_LOGS.sql`** - Generate project logs

---

## Verification Queries

After running all scripts:

```sql
-- Count verification
SELECT 'projects' AS table_name, COUNT(*) FROM projects
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'rfis', COUNT(*) FROM rfis
UNION ALL SELECT 'submittals', COUNT(*) FROM submittals
UNION ALL SELECT 'workflow_stations', COUNT(*) FROM workflow_stations
UNION ALL SELECT 'project_workflow_status', COUNT(*) FROM project_workflow_status
UNION ALL SELECT 'sales_quotes', COUNT(*) FROM sales_quotes
UNION ALL SELECT 'change_orders', COUNT(*) FROM change_orders
UNION ALL SELECT 'long_lead_items', COUNT(*) FROM long_lead_items
UNION ALL SELECT 'color_selections', COUNT(*) FROM color_selections
UNION ALL SELECT 'drawing_versions', COUNT(*) FROM drawing_versions
UNION ALL SELECT 'milestones', COUNT(*) FROM milestones;

-- Expected counts:
-- projects: 5
-- tasks: 60-80
-- rfis: 25-30
-- submittals: 20-25
-- workflow_stations: 21
-- project_workflow_status: ~100 (21 per project)
-- sales_quotes: 8-10
-- change_orders: 3-5
-- long_lead_items: 10-15
-- color_selections: 15-20
-- drawing_versions: 12-16
-- milestones: 20-30
```

---

## Demo Highlights

### Key Scenarios to Show:

1. **Workflow Canvas** (React Flow)
   - Open Project 2 → Workflow tab → Canvas view
   - Show stations with different statuses (completed, in progress, not started)
   - Show animated edges and progress indicator

2. **VP Dashboard**
   - Login as VP user
   - See all 5 projects across factories
   - Factory health breakdown

3. **PM Dashboard**
   - Login as Crystal Meyers
   - See assigned projects (3-4)
   - Calendar with upcoming deadlines

4. **Sales Team Page**
   - Login as Sales Manager
   - See pipeline distribution
   - Team member performance cards

5. **Critical Project Alert**
   - Project 5 shows as Critical
   - Overdue tasks highlighted
   - Blocked RFIs visible

6. **Calendar Filtering**
   - PM sees only their tasks/RFIs
   - Sales Manager sees quote deadlines
   - Role-based date filtering

---

## Questions to Resolve Before Implementation

1. **User Authentication:**
   - Should demo users be created in Supabase Auth manually first?
   - Or use a seed script with predefined UUIDs?

2. **Factory Data:**
   - What factories should exist? Current list:
     - Phoenix, Southeast, SSI, NWBS, Promod, Indicom
   - Confirm factory codes match existing data.

3. **Date Ranges:**
   - Should all dates be relative to `CURRENT_DATE`?
   - Or use fixed dates for reproducibility?

4. **Floor Plan Images:**
   - Do we have placeholder images to upload?
   - Or skip floor plan demo data?

5. **Praxis Integration:**
   - Include sample Praxis import log entries?
   - Demonstrate the import flow?

---

*Document created: January 13, 2026*
*Last updated: January 13, 2026*
