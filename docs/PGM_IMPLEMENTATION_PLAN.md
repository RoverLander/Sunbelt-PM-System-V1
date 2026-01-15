# Plant General Manager (PGM) Dashboard - Implementation Plan

**Created:** January 15, 2026
**Updated:** January 15, 2026
**Based on:** PLANT_MANAGER_ROADMAP spec
**Database Migration:** `20260115_plant_manager_system.sql`

---

## Overview

This document breaks down the PGM Dashboard feature into implementable tickets organized by build batch. Each ticket includes scope, files to create/modify, dependencies, and acceptance criteria.

---

## Build Batches Summary

| Batch | Focus | Tickets | Priority | Status |
|-------|-------|---------|----------|--------|
| 1 | Schemas + RLS + Basic Calendar + Sim Mode | 8 | **DONE** | COMPLETE |
| 2 | QC Flow + Takt/Queue + Material Trace + Metrics | 7 | **DONE** | COMPLETE |
| 3 | Efficiency Tools + OEE + Boards | 6 | **DONE** | COMPLETE |
| 4 | VP Views + Config Panels + Pipeline | 5 | **DONE** | COMPLETE |
| 5 | Mobile App + Safety + Training | 4 | Future | Future |

---

## Batch 1: Foundation (Schemas + RLS + Basic Calendar + Sim Mode) - COMPLETE

### PGM-001: Add Plant_GM Role to System
**Status:** COMPLETE
**Effort:** Small
**Dependencies:** None

**Scope:**
- Add `Plant_GM` and `Production_Manager` to role validation
- Update role-based UI components to recognize new roles
- Add PGM to route access control

**Files to Modify:**
- `src/lib/constants.js` - Add to ROLES constant
- `src/contexts/AuthContext.jsx` - Update role checks
- `src/components/layout/Sidebar.jsx` - Add PGM menu items
- `src/lib/rbac.js` (if exists) - Add role permissions

**Acceptance Criteria:**
- [ ] Plant_GM can log in and see appropriate sidebar
- [ ] RLS policies recognize Plant_GM role
- [ ] Route guards allow PGM access to plant routes

---

### PGM-002: Create Modules Service Layer
**Status:** COMPLETE
**Effort:** Medium
**Dependencies:** PGM-001

**Scope:**
- Create service functions for CRUD operations on modules
- Auto-generate module serial numbers
- Link modules to projects and stations

**Files to Create:**
- `src/services/modulesService.js`

**Functions:**
```javascript
// Core CRUD
createModule(projectId, moduleData)
getModuleById(moduleId)
getModulesByProject(projectId)
getModulesByFactory(factoryId)
updateModule(moduleId, updates)
deleteModule(moduleId)

// Status management
updateModuleStatus(moduleId, newStatus, stationId)
moveModuleToStation(moduleId, stationId, leadId, crewIds)

// Scheduling
scheduleModule(moduleId, startDate, endDate)
getScheduledModules(factoryId, dateRange)
```

**Acceptance Criteria:**
- [ ] Can create modules for a project
- [ ] Serial numbers auto-generated correctly
- [ ] Modules linked to current station
- [ ] Status updates trigger station assignment records

---

### PGM-003: Create Station Templates Service
**Status:** COMPLETE
**Effort:** Small
**Dependencies:** None

**Scope:**
- Service layer for station template management
- Support factory-specific customization of default stations

**Files to Create:**
- `src/services/stationService.js`

**Functions:**
```javascript
getStationTemplates(factoryId)  // Falls back to global if none
createCustomStation(factoryId, stationData)
updateStationTemplate(stationId, updates)
reorderStations(factoryId, newOrder)
getStationChecklist(stationId)
```

**Acceptance Criteria:**
- [ ] Returns 12 default stations when no factory-specific exist
- [ ] Factory can customize station names/order
- [ ] Checklist items retrieved for QC flow

---

### PGM-004: Create Workers Service Layer
**Status:** COMPLETE
**Effort:** Medium
**Dependencies:** PGM-001

**Scope:**
- Manage factory workforce (separate from system users)
- Support lead assignments and crew tracking

**Files to Create:**
- `src/services/workersService.js`

**Functions:**
```javascript
// CRUD
createWorker(factoryId, workerData)
getWorkersByFactory(factoryId, filters)
getWorkerById(workerId)
updateWorker(workerId, updates)
deactivateWorker(workerId)

// Assignments
getAvailableWorkers(factoryId, date)
getWorkersByStation(stationId)
getStationLeads(factoryId)
```

**Acceptance Criteria:**
- [ ] Workers scoped to factory
- [ ] Can mark workers as leads
- [ ] Full_name auto-generated

---

### PGM-005: Production Line Canvas Component
**Status:** COMPLETE
**Effort:** Large
**Dependencies:** PGM-002, PGM-003

**Scope:**
- Horizontal timeline showing 12 production stations
- Module cards at each station with status badges
- Drag-and-drop for GM override (with audit log)
- Click station for modal with details

**Files to Create:**
- `src/components/production/ProductionLineCanvas.jsx`
- `src/components/production/StationBox.jsx`
- `src/components/production/ModuleCard.jsx`
- `src/components/production/StationDetailModal.jsx`

**Key Features:**
- Station boxes with counter badges
- Color coding: green (clear), yellow (waiting), orange (backlog), red (jammed)
- Module cards show serial, status, time at station
- Right-click menu: Scrap, Rework, Fast-track, Hold
- Lightning bolt icon for GM overrides (logged)

**Acceptance Criteria:**
- [ ] All 12 stations rendered in order
- [ ] Modules display at correct stations
- [ ] Drag-drop only enabled for Plant_GM role
- [ ] Audit log created on manual moves
- [ ] Real-time updates via Supabase subscription

---

### PGM-006: Basic Production Calendar Component
**Status:** COMPLETE
**Effort:** Large
**Dependencies:** PGM-002

**Scope:**
- Day/Week/Month/Quarter views
- Show scheduled modules with status colors
- Basic scheduling (click-to-schedule)

**Files to Create:**
- `src/components/production/ProductionCalendar.jsx`
- `src/components/production/CalendarDayView.jsx`
- `src/components/production/CalendarWeekView.jsx`
- `src/components/production/CalendarMonthView.jsx`
- `src/components/production/ScheduleModuleModal.jsx`

**Key Features:**
- View toggle (Day/Week/Month/Quarter)
- Module blocks showing project name, module #, status
- Color coding by status/health
- Click module to open detail modal
- Drag to reschedule (GM only)

**Acceptance Criteria:**
- [ ] All view modes work
- [ ] Modules display on scheduled dates
- [ ] Can open module detail from calendar
- [ ] Date navigation works

---

### PGM-007: Simulation Mode (In-Memory Calendar)
**Status:** COMPLETE
**Effort:** Medium
**Dependencies:** PGM-006

**Scope:**
- "What-if" mode that doesn't write to DB
- Edit schedule in memory, preview throughput
- "Publish" button commits changes atomically

**Files to Modify:**
- `src/components/production/ProductionCalendar.jsx` - Add sim toggle
- `src/stores/calendarStore.js` (create) - Zustand store for sim state

**Files to Create:**
- `src/components/production/SimModeToolbar.jsx`
- `src/components/production/SimPublishModal.jsx`

**Key Features:**
- Toggle: "Live" / "Simulation" mode indicator
- Yellow border in sim mode
- Edits stored in local state, not DB
- Preview panel showing impact metrics
- Publish = atomic transaction + audit log
- Discard = clear local state

**Acceptance Criteria:**
- [ ] Visual indicator when in sim mode
- [ ] Changes in sim mode don't affect DB
- [ ] Publish writes all changes atomically
- [ ] Audit log records "sim_publish" action
- [ ] Discard clears all sim changes

---

### PGM-008: PGM Dashboard Page
**Status:** COMPLETE
**Effort:** Medium
**Dependencies:** PGM-005, PGM-006

**Scope:**
- Main dashboard page for Plant GM role
- Overview grid with key metrics
- Integrate Production Line and Calendar components

**Files to Create:**
- `src/components/pages/PlantManagerDashboard.jsx`
- `src/components/production/DashboardOverviewGrid.jsx`

**Overview Grid Widgets:**
- Project Card (active projects, modules, due dates)
- Production Pulse (modules at each station)
- Crew Status (attendance, late, absent)
- Inspections (next due, pending, overdue)
- Materials (low stock alerts)
- Sales Pipeline (today's quotes, pending POs)

**Acceptance Criteria:**
- [ ] Dashboard loads for Plant_GM role
- [ ] Overview metrics display correctly
- [ ] Production Line canvas integrated
- [ ] Calendar accessible from dashboard
- [ ] Factory-filtered data only

---

## Batch 2: QC Flow + Metrics - COMPLETE

### PGM-009: QC Records Service
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- Service layer for quality control inspections
- Checklist submission and photo uploads
- Rework workflow integration

**Files Created:**
- `src/services/qcService.js`

---

### PGM-010: QC Inspection Modal
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- Mobile-friendly QC checklist interface
- Photo capture/upload
- Pass/Fail with notes
- Auto-create rework task on fail

**Files Created:**
- `src/components/production/QCInspectionModal.jsx`

---

### PGM-011: Takt Time Tracker Widget
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- Compare actual vs expected time per station
- Flag when over threshold (default 20%)
- Line chart visualization

**Files Created:**
- `src/components/production/TaktTimeTracker.jsx`

---

### PGM-012: Queue Time Monitor Widget
**Status:** COMPLETE
**Effort:** Small

**Scope:**
- Track time between stations
- Flag delays >30 min
- Cause dropdown for attribution

**Files Created:**
- `src/components/production/QueueTimeMonitor.jsx`

---

### PGM-013: Worker Shifts Service
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- Clock in/out tracking
- Calculate regular/OT/double-time hours
- Pay calculation based on rates

**Files Modified:**
- `src/services/workersService.js` - Added shift functions

---

### PGM-014: Crew Schedule View
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- Weekly crew schedule grid
- PTO tracking
- Shift assignments

**Files Created:**
- `src/components/production/CrewScheduleView.jsx`

---

### PGM-015: Attendance Dashboard Widget
**Status:** COMPLETE
**Effort:** Small

**Scope:**
- Real-time attendance status
- Late/absent indicators
- Quick clock-in for leads

**Files Created:**
- `src/components/production/AttendanceDashboard.jsx`

---

## Batch 3: Efficiency Tools - COMPLETE

### PGM-016: Kaizen Suggestion Board
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- Employee improvement suggestion submission
- Categories: Safety, Efficiency, Quality, Cost, Other
- Leaderboard with point tracking
- Anonymous submission option

**Files Created:**
- `src/components/production/KaizenBoard.jsx`
- `src/services/efficiencyService.js` (shared)

---

### PGM-017: Defect-to-Fix Cycle Timer
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- Track defect detection to resolution time
- Time bands: Good (<2hrs), Warning (2-4hrs), Critical (>4hrs)
- Station breakdown analysis

**Files Created:**
- `src/components/production/DefectCycleTimer.jsx`

---

### PGM-018: Crew Utilization Heatmap
**Status:** COMPLETE
**Effort:** Large

**Scope:**
- Visual grid: Worker rows × Station columns
- Color-coded by minutes worked
- Date navigation
- Utilization percentage calculations

**Files Created:**
- `src/components/production/CrewUtilizationHeatmap.jsx`

---

### PGM-019: OEE Live Calculator
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- OEE = Availability × Performance × Quality
- SVG gauge visualization
- Time range selector (Today/Week/Month/30d)
- World class benchmarks comparison

**Files Created:**
- `src/components/production/OEECalculator.jsx`

---

### PGM-020: Cross-Training Matrix
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- Worker × Station certification grid
- Proficiency levels: Basic ★, Intermediate ★★, Expert ★★★
- Station flexibility percentages
- Training gap identification

**Files Created:**
- `src/components/production/CrossTrainingMatrix.jsx`

---

### PGM-021: Visual Load Board
**Status:** COMPLETE
**Effort:** Small

**Scope:**
- Daily goal, pace, and queue visualization
- Auto-refresh (30 seconds)
- Print support
- Pace indicators (on-track/behind/at-risk)

**Files Created:**
- `src/components/production/VisualLoadBoard.jsx`

---

## Batch 4: VP Views + Config - COMPLETE

### PGM-022: VP Multi-Plant Dashboard
**Status:** COMPLETE
**Effort:** Large

**Scope:**
- Executive view for VP/Director level showing all factories
- Grid, table, and comparison view modes
- Aggregate metrics with weighted calculations
- Factory cards with OEE, modules, workers, QC rate
- Drill-down navigation to factory details

**Files Created:**
- `src/components/dashboards/VPProductionDashboard.jsx`
- `src/services/vpService.js` (shared service layer)

---

### PGM-023: Plant Config Panel
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- Plant GM configuration interface
- Collapsible sections: Time & Pay, Efficiency Modules, Line Sim, Calendar
- Toggle switches for 12 efficiency modules
- Work day selection
- Auto-schedule enable/disable
- Takt time defaults configuration

**Files Created:**
- `src/components/production/PlantConfigPanel.jsx`

---

### PGM-024: VP Config Panel (Weights/Baselines)
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- VP-level weights and baseline configuration
- Per-factory weight sliders for aggregate calculations
- Target OEE and on-time delivery settings
- Presets: Conservative, Standard, Aggressive, World Class
- Bulk save with recalculation

**Files Created:**
- `src/components/production/VPConfigPanel.jsx`

---

### PGM-025: Pipeline Auto-Schedule
**Status:** COMPLETE
**Effort:** Large

**Scope:**
- Auto-scheduling tool for unscheduled modules
- Suggestions view with checkbox selection
- Pipeline view showing all projects in queue
- Capacity-based date suggestions
- Bulk apply with confirmation
- Priority indicators based on deadlines

**Files Created:**
- `src/components/production/PipelineAutoSchedule.jsx`

---

### PGM-026: Daily Report Auto-Generation
**Status:** COMPLETE
**Effort:** Medium

**Scope:**
- Daily production report generator
- Date navigation (prev/next/today)
- Summary cards: workers, hours, modules, QC rate, labor cost
- Detailed tables: Labor, Station activity, QC records
- Export to CSV and print/PDF functionality

**Files Created:**
- `src/components/production/DailyReportGenerator.jsx`

---

## Batch 5: Mobile + Safety

### PGM-027: Mobile Floor App (PWA)
**Status:** Future - Separate Project Decision
**Effort:** Very Large

---

### PGM-028: Safety Micro-Check
**Status:** Future
**Effort:** Small

---

### PGM-029: 5S Digital Audit
**Status:** Future
**Effort:** Medium

---

### PGM-030: Training Export (EN/ES)
**Status:** Future
**Effort:** Medium

---

## Implementation Order (Batch 1)

Recommended build sequence for Batch 1:

1. **PGM-001** - Add Plant_GM role (foundation)
2. **PGM-003** - Station Templates service (needed for modules)
3. **PGM-002** - Modules service (core data)
4. **PGM-004** - Workers service (for assignments)
5. **PGM-005** - Production Line Canvas (main visual)
6. **PGM-006** - Production Calendar (scheduling)
7. **PGM-007** - Simulation Mode (calendar enhancement)
8. **PGM-008** - PGM Dashboard Page (puts it all together)

---

## Notes

### RLS Considerations
- All PGM data uses `factory_id` for row-level security
- Plant_GM sees only their factory's data
- VP/Director see aggregate or all factories
- Production_Manager has edit rights within their factory

### State Management
- Using React Context + local state for now (per user's preference)
- Can migrate to Zustand if complexity increases
- Simulation mode uses isolated local state

### Mobile Considerations
- All components should be tablet-friendly
- Mobile app is a future separate decision
- Calendar and Production Line should work at 768px+

### Integration Points
- Projects table has `module_count` - modules are created based on this
- Long-lead items can auto-create tasks via `trigger_next` field
- QC failures can auto-create rework tasks

---

## Quick Reference: New Database Tables

| Table | Purpose |
|-------|---------|
| `modules` | Individual modules within projects |
| `station_templates` | 12 production line stages |
| `station_assignments` | Module-to-station tracking with crew |
| `workers` | Factory floor workforce |
| `worker_shifts` | Clock in/out and pay |
| `qc_records` | Quality control inspections |
| `inspection_rules` | Configurable inspection requirements |
| `long_lead_items` | Long-lead material tracking |
| `plant_config` | Per-plant settings |
| `calendar_audit` | Schedule change audit trail |
| `takt_events` | Takt time tracking |
| `kaizen_suggestions` | Improvement ideas |
| `cross_training` | Worker certifications |
| `safety_checks` | Daily safety checks |
| `five_s_audits` | 5S audits |
