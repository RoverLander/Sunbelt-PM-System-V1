# Demo Presentation Plan - January 20, 2026

## Status: IN PROGRESS
## Audience: Lead IT Programmer, IT Director, VP of Operations
## Primary Factory Focus: NWBS (Northwest Building Systems)

---

## EXECUTIVE SUMMARY

This document captures all requirements, fixes, and data needs for the demo presentation. The goal is to showcase the full capabilities of the Sunbelt PM System across all dashboards and features.

---

## PART 1: ISSUES TO FIX (Code Changes)

### 1.1 Queue Time Monitor - UI Formatting
**File:** `src/components/production/QueueTimeMonitor.jsx`
**Issue:** Module cards are touching (no gap/spacing)
**Fix:** Add gap/margin between queue item cards

### 1.2 Queue Time Monitor - Business Hours Calculation
**File:** `src/components/production/QueueTimeMonitor.jsx`
**Issue:** Queue time counts non-working hours (nights, weekends, holidays)
**Fix:**
- Calculate wait time only during factory operating hours (7:00 AM - 3:30 PM)
- Exclude weekends (Saturday/Sunday)
- Exclude holidays (configurable per factory in plant_config)
- Read settings from `plant_config.time_settings` and `plant_config.calendar_settings`

### 1.3 Crew Tab - Sorting & Filtering
**File:** `src/components/production/CrewScheduleView.jsx` and `AttendanceDashboard.jsx`
**Issue:** No department grouping, leads not at top
**Fix:**
- Default grouping by DEPARTMENT (not station)
- Within each department, LEAD always appears first
- Departments based on station:
  - Framing (smallest after QC)
  - Rough Carpentry (biggest)
  - Electrical
  - Plumbing
  - HVAC
  - Interior Finish
  - Staging (typically 1 person, cross-trained)
  - QC (smallest)

### 1.4 Active Module Selection (Production Line)
**File:** `src/components/production/` (multiple files)
**Issue:** When PGM advances a module manually, can't control which becomes active
**Current Behavior:** Module goes to end of queue at next station
**Required Behavior:**
- If no modules at next station → auto-set as active (In Progress)
- If modules exist at next station → goes to queue (In Queue status)
- PGM should be able to manually set which module is "active" at a station
- Only ONE module can be "In Progress" at a station at a time
- Add "Set as Active" button/action for queued modules

**Edge Cases:**
- What if PGM sets a queued module as active when another is in progress?
  - Current active module should go back to "In Queue"
- Calendar scheduling should respect this
- PWA Floor App "Start Work" should respect this

### 1.5 Weekly/Monthly Reports
**File:** `src/components/production/DailyReportGenerator.jsx`
**Issue:** Only daily reports available
**Fix:**
- Add report type selector: Daily | Weekly | Monthly
- Weekly: Mon-Fri aggregated (include weekend work if any)
- Monthly: Full month aggregated
- Add section toggles to include/exclude:
  - [ ] Labor Details
  - [ ] Station Activity
  - [ ] Quality Control
  - [ ] Module Completions
  - [ ] Attendance Summary

### 1.6 Plant Config - Timezone Selection
**File:** `src/components/production/PlantConfigPanel.jsx`
**Issue:** No timezone setting for factories
**Fix:**
- Add timezone dropdown to Time & Pay Settings section
- Options: US timezones (Pacific, Mountain, Central, Eastern, Alaska, Hawaii)
- Store in `plant_config.time_settings.timezone`
- Use for all time displays and calculations in PGM dashboard

### 1.7 Efficiency Modules Toggle
**File:** `src/components/production/PlantConfigPanel.jsx` and related
**Issue:** Toggling efficiency modules doesn't show/hide them
**Fix:**
- Verify toggle state saves to database correctly
- Ensure Overview/Analytics tabs read from `plant_config.efficiency_modules`
- Conditionally render widgets based on enabled flags

---

## PART 2: DEMO DATA REQUIREMENTS

### 2.1 Factory Configuration - NWBS

```
Factory: NWBS (Northwest Building Systems)
Timezone: America/Los_Angeles (Pacific)
Location: Tacoma, WA

Operating Hours:
- Shift Start: 7:00 AM
- Shift End: 3:30 PM
- Lunch: 11:30 AM - 12:00 PM (30 min)
- Break: 30 min (configurable)
- Work Days: Mon-Fri
- Weekend Work: Only with PGM approval (rush jobs)

Holidays (2026):
- New Year's Day: Jan 1
- Presidents Day: Feb 16
- Memorial Day: May 25
- Independence Day: Jul 3 (observed)
- Labor Day: Sep 7
- Thanksgiving: Nov 26-27
- Christmas Eve: Dec 24
- Christmas Day: Dec 25
```

### 2.2 Departments & Workers (NWBS) - 100 Workers

| Department | Station(s) | Lead Count | Worker Count | Total |
|------------|-----------|------------|--------------|-------|
| Framing | Metal Frame Welding | 1 | 6 | 7 |
| Rough Carpentry | Rough Carpentry, Exterior Siding | 2 | 18 | 20 |
| Electrical | Electrical Rough-in | 1 | 8 | 9 |
| Plumbing | Plumbing Rough-in | 1 | 7 | 8 |
| HVAC | HVAC Install | 1 | 6 | 7 |
| Interior Rough | Interior Rough-out | 1 | 8 | 9 |
| Interior Finish | Interior Finish | 2 | 18 | 20 |
| Inspection | In-Wall Inspection, Final Inspection | 2 | 4 | 6 |
| Staging | Staging, Dealer Pickup | 1 | 2 | 3 |
| QC | (Floaters) | 1 | 3 | 4 |
| Material Handling | (Support) | 1 | 6 | 7 |
| **TOTAL** | | **14** | **86** | **100** |

### 2.3 Projects Distribution

**NWBS Projects (6 PM Jobs + 4 PC Jobs = 10 total):**

| Project # | Name | Phase | Modules | Status | Assigned To |
|-----------|------|-------|---------|--------|-------------|
| NWBS-26-001 | Boeing Everett Support Facility | 4 | 8 | In Progress | Matthew McDaniel |
| NWBS-26-002 | Boise School District Admin | 4 | 6 | In Progress | Matthew McDaniel |
| NWBS-26-003 | Hanford AMPS Phase 2 | 3 | 10 | In Progress | Matthew McDaniel |
| NWBS-26-004 | Nampa Medical Clinic | 3 | 4 | At Risk | Matthew McDaniel |
| NWBS-26-005 | Seattle Metro Housing | 2 | 12 | On Track | Crystal Meyers |
| NWBS-26-006 | Portland VA Expansion | 2 | 6 | On Track | Michael |
| NWBS-26-S01 | Stock Unit A - 12x60 Office | 4 | 1 | Staged | Dawn (PC) |
| NWBS-26-S02 | Stock Unit B - 24x60 Classroom | 4 | 2 | In Progress | Dawn (PC) |
| NWBS-26-S03 | Fleet - WA State Parks | 3 | 3 | In Progress | Dawn (PC) |
| NWBS-26-S04 | Stock Unit C - 12x40 Office | 1 | 1 | Not Started | Dawn (PC) |

**Building Dimensions & Module Configs:**

| Footprint | Modules | Module Size | Typical Use |
|-----------|---------|-------------|-------------|
| 12x60 | 1 | 12x60 | Small office |
| 24x60 | 2 | 12x60 each | Classroom |
| 36x60 | 3 | 12x60 each | Medium office |
| 48x60 | 4 | 12x60 each | Large office |
| 60x60 | 5 | 12x60 each | Medical clinic |
| 60x120 | 10 | 12x60 each | Large facility |
| 72x120 | 12 | 12x60 each | School/Government |

### 2.4 Modules on Production Line (NWBS)

**Target: 25-30 modules distributed across stations**

| Station | Module Count | Status Distribution |
|---------|--------------|---------------------|
| 1. Metal Frame Welding | 2 | 1 In Progress, 1 In Queue |
| 2. Rough Carpentry | 3 | 1 In Progress, 2 In Queue |
| 3. Exterior Siding | 3 | 2 In Progress, 1 In Queue |
| 4. Interior Rough-out | 2 | 1 In Progress, 1 In Queue |
| 5. Electrical Rough-in | 2 | 1 In Progress, 1 In Queue |
| 6. Plumbing Rough-in | 2 | 1 In Progress, 1 In Queue |
| 7. HVAC Install | 2 | 1 In Progress, 1 In Queue |
| 8. In-Wall Inspection | 2 | 1 In Progress, 1 QC Hold |
| 9. Interior Finish | 4 | 2 In Progress, 2 In Queue |
| 10. Final Inspection | 2 | 1 In Progress, 1 In Queue |
| 11. Staging | 3 | 3 Staged |
| 12. Dealer Pickup | 0 | (Shipped modules removed) |
| **TOTAL** | **27** | |

### 2.5 PM Assignments (All PMs)

| PM | Primary Factory | Projects | Secondary Factory | Projects |
|----|----------------|----------|-------------------|----------|
| Matthew McDaniel | NWBS | 4 | WM-EVERGREEN | 2 |
| Crystal Meyers | PMI | 3 | WM-SOUTH | 2, NWBS | 1 |
| Michael | WM-EAST | 3 | WM-ROCHESTER | 2 |
| Hector | WM-SOUTH | 3 | AMT | 2 |
| Candy (Director) | Various | 2-3 | | |

### 2.6 Sales Pipeline

| Status | Count | Total Value | Notes |
|--------|-------|-------------|-------|
| Draft | 2 | $1.2M | New quotes being prepared |
| Sent | 3 | $4.5M | Awaiting dealer response |
| Negotiating | 4 | $8.2M | Active discussions |
| Awaiting PO | 2 | $3.8M | Verbal yes, waiting paperwork |
| PO Received | 2 | $2.9M | Ready to convert |
| Won/Converted | 5 | $12.5M | Already projects |
| Lost | 2 | $1.8M | Historical data |
| Expired | 1 | $0.6M | Past valid_until |

### 2.7 Dealer Names (Mix of Real & Fictional)

| Dealer Name | Region | Primary Factory |
|-------------|--------|-----------------|
| ModSpace | National | All |
| Mobile Mini | National | All |
| WillScot | National | All |
| Pacific Mobile Structures | Northwest | NWBS |
| Acton Mobile | Southwest | PMI |
| Satellite Industries | Midwest | WM-SOUTH |
| Target Logistics | National | All |
| Vanguard Modular | East | WM-EAST |
| Southwest Mobile Systems | Southwest | PMI, AMT |
| Cascade Modular Solutions | Northwest | NWBS, WM-EVERGREEN |

### 2.8 User Accounts Required

| Role | Name | Email | Factory |
|------|------|-------|---------|
| VP | Gary Davenport | gary.davenport@sunbeltmodular.com | Corporate |
| Director | Candy Juhnke | candy.juhnke@sunbeltmodular.com | Corporate |
| PM | Matthew McDaniel | matthew.mcdaniel@sunbeltmodular.com | Corporate |
| PM | Crystal Meyers | crystal.meyers@sunbeltmodular.com | Corporate |
| PM | Michael Caracciolo | michael.caracciolo@sunbeltmodular.com | Corporate |
| PM | Hector Vazquez | hector.vazquez@sunbeltmodular.com | Corporate |
| PC | Dawn Parker | dawn.parker@sunbeltmodular.com | NWBS |
| Plant_GM | Ross Parks | ross.parks@nwbs.sunbeltmodular.com | NWBS |
| Sales_Manager | Casey Knipp | casey.knipp@nwbs.sunbeltmodular.com | NWBS |
| Sales_Rep | George Avila | george.avila@nwbs.sunbeltmodular.com | NWBS |
| IT_Manager | Devin Duvak | devin.duvak@sunbeltmodular.com | Corporate |

---

## PART 3: DEMO FLOW

### 3.1 Demo Order (as requested)

1. **PM Dashboard** (Matthew McDaniel login)
   - Show personal command center
   - 4-6 projects at NWBS
   - Tasks, RFIs, calendar
   - Click into project → Workflow Canvas
   - Show Production station with module progress (new feature!)

2. **Director Dashboard** (Candy login)
   - Portfolio health across all PMs
   - PM workload analysis
   - Gantt timeline view
   - Incoming quotes needing attention

3. **Plant Manager Dashboard** (Ross Parks login)
   - Production Line with 12 stations
   - Modules distributed realistically
   - Crew attendance (80% clocked in)
   - QC records and inspection queues
   - Queue Time Monitor (with bottleneck alert)
   - Daily/Weekly Reports
   - Config panel with efficiency modules

4. **PC Dashboard** (Dawn login)
   - Stock/Fleet jobs at NWBS
   - Simpler project view
   - Deadline tracking

5. **Manager PWA** (Mobile demo)
   - Quick stats
   - Project list and details
   - Tasks and RFIs

6. **Sales Pipeline** (Casey or George login)
   - Quotes in various stages
   - PM-flagged quotes
   - Dealer information
   - Pipeline value metrics

7. **IT Dashboard** (Devin login)
   - User management
   - System health
   - Feature flags
   - Announcements

---

## PART 4: EXECUTION PLAN

### Phase 1: Code Fixes (Priority Order)

1. [ ] Queue Time Monitor - spacing fix (quick CSS)
2. [ ] Queue Time Monitor - business hours calculation
3. [ ] Crew sorting by department with leads first
4. [ ] Active module selection for PGM
5. [ ] Weekly/Monthly reports with section toggles
6. [ ] Timezone selection in plant config
7. [ ] Efficiency modules toggle verification

### Phase 2: Demo Data SQL Script

Create `DEMO_PRESENTATION_DATA.sql` that:
1. Updates NWBS plant_config with correct settings
2. Creates/updates 100 workers with departments
3. Creates 10 NWBS projects (6 PM, 4 PC)
4. Creates 27 modules distributed across stations
5. Creates realistic tasks, RFIs, submittals per project
6. Creates sales quotes with dealers
7. Creates worker shifts for today (80% attendance)
8. Creates station assignments for in-progress modules
9. Creates QC records
10. Sets up all required user accounts

### Phase 3: Verification Checklist

- [ ] PM Dashboard shows Matthew's projects
- [ ] Workflow Canvas shows production progress
- [ ] PGM Dashboard shows 12 stations with modules
- [ ] Crew tab groups by department
- [ ] Queue Time Monitor excludes non-working hours
- [ ] Reports generate for daily/weekly/monthly
- [ ] Sales pipeline shows quotes with dealers
- [ ] PWA login works (TEST:1234)
- [ ] All dashboards load without errors

---

## PART 5: TECHNICAL NOTES

### Database Tables Affected

- `plant_config` - Factory settings, efficiency modules, calendar
- `workers` - 100 workers with departments, leads flagged
- `projects` - 25+ projects across factories
- `modules` - 27 modules at NWBS on production line
- `tasks` - 5-15 per project
- `rfis` - 3-8 per project
- `submittals` - 4-10 per project
- `sales_quotes` - 15-20 quotes in pipeline
- `sales_customers` - Dealers and customers
- `worker_shifts` - Today's attendance
- `station_assignments` - Crew assignments
- `qc_records` - Inspection results

### Key Foreign Key Relationships

- `modules.project_id` → `projects.id`
- `modules.factory_id` → `factories.id`
- `modules.current_station_id` → `station_templates.id`
- `station_assignments.lead_id` → `users.id` (NOT workers!)
- `workers.primary_station_id` → `station_templates.id`
- `sales_quotes.dealer_id` → `sales_customers.id`
- `sales_quotes.assigned_to` → `users.id`

### Workers Department Mapping

Workers don't have a `department` column directly. Instead:
- Department is derived from `primary_station_id`
- Map stations to departments:
  - FRAME_WELD → Framing
  - ROUGH_CARP, EXT_SIDING → Rough Carpentry
  - ELEC_ROUGH → Electrical
  - PLUMB_ROUGH → Plumbing
  - HVAC → HVAC
  - INT_ROUGH → Interior Rough
  - INT_FINISH → Interior Finish
  - INWALL_INSP, FINAL_INSP → Inspection
  - STAGING, PICKUP → Staging
  - NULL → QC / Material Handling (floaters)

---

## CHANGELOG

| Date | Time | Changes |
|------|------|---------|
| 2026-01-20 | 10:45 AM | Initial plan created |

