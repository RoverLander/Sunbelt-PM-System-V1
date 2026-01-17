# Project Status

**Last Updated:** January 17, 2026
**Version:** 1.4.3
**Status:** Production Ready (Beta) + PGM Dashboard Batch 4 Complete + PWA Phase 1 Foundation Complete

---

## Related Documentation

- **[ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md)** - Full system topology, security analysis, dependency graph, and improvement recommendations (Jan 14, 2026)
- **[PRAXIS_INTEGRATION_ANALYSIS.md](./PRAXIS_INTEGRATION_ANALYSIS.md)** - Praxis field mappings and integration details
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Complete database schema reference (Jan 15, 2026)
- **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** - React component organization and data flow (Jan 14, 2026)
- **[PGM_IMPLEMENTATION_PLAN.md](./PGM_IMPLEMENTATION_PLAN.md)** - Plant GM Dashboard implementation tickets (Jan 15, 2026)
- **[Demo Data Strategy](#demo-data-strategy-january-15-2026)** - Comprehensive demo data plan (see below)

---

## Overview

The Sunbelt PM System is a comprehensive project management platform built for Sunbelt Modular and its subsidiary factories. The system is fully functional and deployed, supporting multiple user roles and factory locations.

---

## Implemented Features

### Core Project Management
- [x] Project creation with full details (client, factory, dates, contract value)
- [x] Project list with filtering, search, and sorting
- [x] Project detail view with tabbed interface
- [x] Project editing and status updates
- [x] Color-coded project identification
- [x] Contract value tracking ($1M - $8M+ projects)

### Workflow System (6-Phase)
- [x] Visual workflow tracker with phase progression
- [x] 29 workflow stations across 6 phases:
  - Pre-Production (Design, Permitting, Materials)
  - Production (Factory manufacturing)
  - QC & Shipping (Quality control, logistics)
  - Site Work (Foundation, utilities)
  - Installation (Module setting, assembly)
  - Closeout (Punch list, warranty)
- [x] Station status tracking (Not Started → In Progress → Complete)
- [x] Task linking to workflow stations
- [x] Court assignment (Factory/Field)

### Task Management
- [x] Task creation with title, description, priority, dates
- [x] Status workflow: Not Started → In Progress → Awaiting Response → Completed/Cancelled
- [x] Priority levels: Low, Medium, High, Critical
- [x] Internal team assignment with grouped dropdown
- [x] External contact assignment with email
- [x] Task ownership tracking (Internal Owner field)
- [x] "My Tasks" vs "All Tasks" filtering
- [x] Kanban board view with drag-and-drop
- [x] List view with sortable columns
- [x] Milestone linking
- [x] File attachments

### RFI Management
- [x] RFI creation and tracking
- [x] Auto-generated RFI numbers (PROJECT-RFI-001)
- [x] Status workflow: Draft → Open → Pending → Answered → Closed
- [x] Question and Answer fields
- [x] Spec section and drawing references
- [x] Due date tracking with overdue highlighting
- [x] Internal/External recipient support
- [x] Email draft generation
- [x] **Excel export with professional formatting**
- [x] **PDF export with factory logo branding**

### Submittal Management
- [x] Submittal creation and tracking
- [x] Auto-generated submittal numbers (PROJECT-SUB-001)
- [x] Submittal types: Shop Drawings, Product Data, Samples, etc.
- [x] Status workflow: Pending → Submitted → Under Review → Approved/Rejected
- [x] Revision number tracking with resubmit functionality
- [x] Manufacturer and model number fields
- [x] Reviewer comments
- [x] Due date tracking
- [x] **Excel export with professional formatting**

### Floor Plan System
- [x] Floor plan upload (PNG, JPG images)
- [x] PDF to PNG conversion on upload
- [x] Full-screen viewer modal
- [x] Zoom controls (25% - 200%)
- [x] **Pan/drag navigation at any zoom level**
- [x] Marker system for pinning items to locations
- [x] Marker types: RFI, Submittal, Task
- [x] Marker detail panel with item info
- [x] **Clickable marker links to navigate to item**
- [x] Marker filtering by type

### Calendar & Scheduling
- [x] Project calendar (month view)
- [x] Weekly calendar on overview tab
- [x] Task, RFI, Submittal due dates displayed
- [x] Milestone tracking
- [x] ICS export for calendar events

### File Management
- [x] File uploads to Supabase Storage
- [x] File attachments on Tasks, RFIs, Submittals
- [x] File type icons and previews
- [x] Download functionality

### Role-Based Dashboards
- [x] **VP Dashboard** - Executive view across all factories
  - Total projects, revenue, task metrics
  - Factory breakdown charts
  - Overdue items highlighting
  - **Praxis Enhanced:** Sales pipeline visibility, PM-flagged quotes, recently converted, weighted forecast
- [x] **Director Dashboard** - Factory oversight
  - Factory-specific metrics
  - PM workload distribution
  - Project status breakdown
  - **Praxis Enhanced:** Building type/specs in table, incoming projects (95%+ quotes), weighted workload toggle
- [x] **PM Dashboard** - Project manager view
  - Personal task list
  - Project assignments
  - Upcoming deadlines
  - **Praxis Enhanced:** Urgent delivery alerts, delivery timeline (30/60/90d), building type badges, difficulty ratings
- [x] **Sales Dashboard** - Sales manager view
  - Quote pipeline management
  - Customer/dealer tracking
  - **Praxis Enhanced:** Weighted pipeline, visual funnel, quote aging, PM flagging, building type analytics
- [x] **PC Dashboard** - Plant controller view
  - Factory-specific projects
  - Financial metrics
- [x] **Plant Manager Dashboard** - Factory GM view (NEW Jan 15, 2026)
  - Production Line Canvas with 12 stations
  - Module tracking at each station
  - Crew status and attendance
  - Drag-and-drop GM override (with audit logging)
  - Station and Module detail modals

### User Management
- [x] Supabase authentication
- [x] Role-based access (VP, Director, PM, PC, IT, Admin)
- [x] Factory assignment for users
- [x] Active/inactive user status
- [x] Demo user accounts

### Factory Contacts
- [x] Factory contact database
- [x] Contact roles (GM, Sales, Purchasing, Engineering, etc.)
- [x] Contact assignment to projects
- [x] **Smart dropdown grouping by factory**

### UI/UX Features
- [x] Dark theme with Sunbelt orange accents
- [x] Responsive sidebar navigation
- [x] Toast notifications
- [x] Loading states and spinners
- [x] Form validation with error messages
- [x] Sortable table columns
- [x] Search and filter on all list views

---

## Recent Updates (January 2026)

### January 17, 2026 (PWA Mobile Floor App - Phase 5 Inventory Receiving)

- **Phase 5: Inventory Receiving - Complete**
  - **InventoryReceiving Page Component:**
    - `src/pwa/pages/InventoryReceiving.jsx` - 4-step workflow (~920 lines)
    - Steps: Select PO → View Items → Receive Item → Complete
  - **Features:**
    - Pending PO list with status badges
    - PO search by number (300ms debounce)
    - Line items with remaining quantity display
    - Quantity input with +/- controls
    - Damage toggle with damaged qty and notes
    - Photo capture with preview grid
    - Receipt creation with status (Received/Partial/Damaged)
    - Continue receiving or start over options
  - **Sub-Components:**
    - `POListItem` - PO card with vendor and item count
    - `LineItemRow` - Line item with remaining/complete status
    - `StepHeader` - Navigation header with back button
  - **Integration:**
    - Uses `getPendingPurchaseOrders()` from purchaseOrdersService.js
    - Uses `searchPurchaseOrders()` for PO lookup
    - Uses `createReceipt()` from inventoryReceiptsService.js
    - Uses `uploadReceiptPhoto()` for photo storage
    - Auto-updates PO line item received quantity

- **Files Created:**
  - `src/pwa/pages/InventoryReceiving.jsx`

- **Files Modified:**
  - `src/pwa/PWAApp.jsx` - Replaced placeholder with InventoryReceiving
  - `src/pwa/index.js` - Added InventoryReceiving export

---

### January 17, 2026 (PWA Mobile Floor App - Phase 4 Station Movement)

- **Phase 4: Station Movement - Complete**
  - **StationMove Page Component:**
    - `src/pwa/pages/StationMove.jsx` - 3-step workflow (~820 lines)
    - Steps: Select Module → Select Crew → Confirm Move
  - **Features:**
    - Module search with current station display
    - Auto-calculate next station from production line order
    - Crew selection with checkbox interface
    - Lead auto-selected from current worker
    - QC gate warning if inspection required
    - Station flow visualization (From → To)
    - Confirmation summary before move
    - Success state with "Move Another" option
  - **Sub-Components:**
    - `ModuleListItem` - Module card with station badge
    - `StepHeader` - Step navigation header
    - `CrewItem` - Crew member checkbox item
  - **Integration:**
    - Uses `moveModuleToStation()` from modulesService.js
    - Uses `getStationTemplates()` from stationService.js
    - Uses `getWorkersByStation()` from workersService.js
    - Creates station_assignments record on move

- **Files Created:**
  - `src/pwa/pages/StationMove.jsx`

- **Files Modified:**
  - `src/pwa/PWAApp.jsx` - Added StationMove route
  - `src/pwa/pages/PWAHome.jsx` - Added "Move Module" quick action
  - `src/pwa/index.js` - Added StationMove export

---

### January 17, 2026 (PWA Mobile Floor App - Phase 3 QC Inspection)

- **Phase 3: QC Inspection Workflow - Complete**
  - **QCInspection Page Component:**
    - `src/pwa/pages/QCInspection.jsx` - Full 5-step workflow (~1145 lines)
    - Steps: Select Module → Checklist → Photos → Review → Complete
  - **Features:**
    - Module search with pending inspections list
    - Checklist loaded from `station_templates.checklist` (JSONB)
    - Pass/Fail buttons for each checklist item
    - Photo capture via camera API with file input
    - Photo preview grid with remove option
    - Notes field for additional observations
    - Pass/Fail result summary with counts
    - Auto-rework flagging on failure
    - QC record submission to Supabase
  - **Sub-Components:**
    - `ModuleListItem` - Module selection item
    - `StepHeader` - Step indicator with back navigation
    - `ChecklistItemComponent` - Pass/Fail response buttons
  - **Integration:**
    - Uses `qcService.js` for `createQCRecord`, `getPendingInspections`
    - Uses `modulesService.js` for `searchModules`, `getModuleById`
    - Uploads photos to `qc-photos` Supabase Storage bucket

- **Files Created:**
  - `src/pwa/pages/QCInspection.jsx`

- **Files Modified:**
  - `src/pwa/PWAApp.jsx` - Replaced placeholder with QCInspection
  - `src/pwa/index.js` - Added QCInspection export

---

### January 17, 2026 (PWA Mobile Floor App - Phase 2 Module Lookup)

- **Phase 2: Module Lookup - Complete**
  - **Service Layer:**
    - Added `searchModules()` function to `modulesService.js`
    - Debounced search with 300ms delay
    - Search by serial number or project name
    - Returns up to 10 results with module details
  - **PWA Components:**
    - `src/pwa/pages/ModuleLookup.jsx` - Full search page
    - `ModuleDetailCard` - Module information display
  - **Features:**
    - Autocomplete suggestions after 2 characters
    - Recent searches persisted to localStorage
    - Module detail with station, dimensions, status
    - Rush order indicator
    - Mobile-optimized touch interface

- **Files Created:**
  - `src/pwa/pages/ModuleLookup.jsx`

- **Files Modified:**
  - `src/services/modulesService.js` - Added searchModules()
  - `src/pwa/PWAApp.jsx` - Integrated ModuleLookup view
  - `src/pwa/index.js` - Added export

---

### January 17, 2026 (PWA Mobile Floor App - Phase 1 Foundation)

- **PWA Infrastructure Setup - Complete**
  - **Database Migration:** `20260116_pwa_schema_remediation_fix.sql` applied
    - Added worker auth columns: `pin_hash`, `pin_attempts`, `pin_locked_until`, `last_login`
    - Created `worker_sessions` table for JWT token tracking
    - Created `purchase_orders` table for inventory receiving (Phase 5)
    - Created `inventory_receipts` table for material receiving (Phase 5)
  - **Supabase Storage:** Created `inventory-receipts` bucket for receipt photos
  - **Edge Function:** Deployed `worker-auth` Edge Function for PIN authentication
    - bcrypt password hashing
    - JWT token generation (8-hour sessions)
    - PIN attempt lockout (3 attempts, 15-minute lockout)

- **PWA Foundation Files Created**
  - **Build Configuration:**
    - Updated `package.json` with `vite-plugin-pwa` and `idb` dependencies
    - Updated `vite.config.js` with PWA manifest and Workbox caching
  - **PWA Folder Structure (`src/pwa/`):**
    - `index.js` - Module barrel exports
    - `PWAApp.jsx` - Main PWA app with view routing
    - `contexts/WorkerAuthContext.jsx` - Worker PIN auth context
    - `components/auth/WorkerLogin.jsx` - Mobile PIN login screen
    - `components/layout/PWAShell.jsx` - App shell with header/footer
    - `components/layout/BottomNav.jsx` - Bottom navigation (5 items)
    - `components/common/OfflineBanner.jsx` - Offline status indicator
    - `pages/PWAHome.jsx` - Home dashboard page
  - **Service Layers:**
    - `src/services/workerAuthService.js` - Worker PIN auth functions
    - `src/services/purchaseOrdersService.js` - Purchase order CRUD
    - `src/services/inventoryReceiptsService.js` - Receipt tracking

- **PWA Routing Integrated**
  - Updated `src/App.jsx` to detect `/pwa/*` routes and render PWAApp
  - Separate from desktop app - mobile-optimized experience

- **PWA Features:**
  - Mobile-first UI with CSS variables
  - PIN-based authentication (separate from Supabase Auth)
  - 8-hour session tokens with auto-refresh
  - Offline indicator with sync status
  - Role-based navigation (QC tab for leads only)
  - Workbox caching for Supabase API/Storage

- **Files Created:**
  - `src/pwa/` folder (8 files)
  - `src/services/workerAuthService.js`
  - `src/services/purchaseOrdersService.js`
  - `src/services/inventoryReceiptsService.js`
  - `supabase/functions/worker-auth/index.ts`
  - `supabase/migrations/20260116_pwa_schema_remediation_fix.sql`

- **Files Modified:**
  - `package.json` - Added PWA dependencies
  - `vite.config.js` - Added PWA plugin configuration
  - `src/App.jsx` - Added PWA route detection

---

### January 16, 2026 (Demo Data System Fixes)

- **CRITICAL FIX: Station Templates Missing - Complete**
  - **Root Cause:** Plant Manager Dashboard showed 0 modules because `station_templates` table was empty
  - **Issue:** Demo SQL created `workflow_stations` (PM workflow) but not `station_templates` (production line)
  - **Fix:** Added Step 4B to COMPLETE_DEMO_SETUP.sql that creates the 12 production line stations:
    1. Metal Frame Welding
    2. Rough Carpentry
    3. Exterior Siding/Sheathing
    4. Interior Rough-out
    5. Electrical Rough-in
    6. Plumbing Rough-in
    7. HVAC Install
    8. In-Wall Inspection
    9. Interior Finish
    10. Final State Inspection
    11. Staging
    12. Dealer Pickup
  - These global templates (factory_id = NULL) are used by all factories

- **COMPLETE_DEMO_SETUP.sql Schema Fixes - Complete**
  - Fixed multiple table/column schema mismatches preventing demo data generation
  - **QC Records Column Fix:**
    - Changed `inspection_date` → `inspected_at` (TIMESTAMPTZ column)
    - Changed `inspection_type` → `status` (varchar column)
    - Fixed to match actual migration schema from `20260115_plant_manager_system.sql`
  - **Project Logs Column Fix:**
    - Changed `action` → `entry_type` (existing schema uses entry_type)
    - Changed `description` → `content` (existing schema uses content)
    - Changed `created_by` → `user_id` (existing schema uses user_id)
    - Entry types updated: 'status_change', 'document', 'task', 'approval', 'production'
  - **Sales Tables Fix:**
    - Added DROP TABLE IF EXISTS before CREATE TABLE for `sales_customers` and `sales_quotes`
    - Resolves schema conflicts when tables already exist with different schemas

- **qcService.js Supabase Query Fixes - Complete**
  - Fixed Supabase relationship syntax for foreign key joins
  - Changed `inspector_worker:workers(...)` → `inspector:workers!inspector_id(...)`
  - Changed `inspector_user:users(...)` → `inspector_user:users!inspector_user_id(...)`
  - Applied to: `getQCRecordById`, `getQCRecordsByModule`, `getQCRecordsByFactory`

- **Files Modified:**
  - `supabase/demo/COMPLETE_DEMO_SETUP.sql` - Added station_templates, QC records, project logs, sales tables fixes
  - `src/services/qcService.js` - Supabase relationship syntax corrections

---

### January 16, 2026 (DEBUG_TEST_GUIDE Execution & Performance Optimization)

- **DEBUG_TEST_GUIDE Execution - Phases 1-3 Complete**
  - Executed systematic debugging and optimization guide across all phases
  - Commit: `648ca39` (Phase 1), `5d38ee4` (Phases 2-3)

  - **Phase 1: Foundation Audit (Complete)**
    - **Phase 1.1 - Status Value Audit:** Verified task statuses (Not Started, In Progress, Awaiting Response, Completed, Cancelled) and project statuses (Draft, Active, On Hold, Completed, Archived)
    - **Phase 1.2 - RLS Policy Audit:** Confirmed all PGM tables (modules, station_templates, station_assignments, workers, worker_shifts, qc_records) have proper RLS policies
    - **Phase 1.3 - Memory Leak Check:** Verified cleanup patterns in existing hooks; identified areas for improvement
    - **Phase 1.4 - Lint Error Fixes:** Reduced ESLint errors from 217 to 191 (12% reduction)

  - **Phase 2: Loading States & Race Conditions (Complete)**
    - **Skeleton Loading Components Created:** `src/components/common/Skeleton.jsx`
      - `SkeletonCard` - Loading card placeholder with shimmer animation
      - `SkeletonTable` - Table loading state with configurable rows/columns
      - `SkeletonKanban` - Kanban board loading placeholder
      - `SkeletonStatsGrid` - Stats grid loading with shimmer
      - `SkeletonList` - List loading placeholder
      - `SkeletonText` - Text line loading placeholder
      - `LoadingSpinner` - Centered spinner with message
      - `FullPageLoader` - Full-page loading overlay
    - **Utility Hooks Created:** `src/hooks/` directory
      - `useInterval.js` - Safe setInterval with automatic cleanup on unmount
      - `useDebounce.js` - Value debouncing with timeout cleanup
      - `useAsyncEffect.js` - Async effects with cancellation to prevent setState on unmounted components
      - `useEventListener.js` - Event listeners with automatic cleanup
      - `index.js` - Central export barrel file

  - **Phase 3: Performance Optimization (Complete)**
    - **Vite Code Splitting:** Updated `vite.config.js` with `manualChunks` configuration
      - Split vendor chunks: react, date-fns, supabase, lucide-react, xyflow, exceljs
      - **Bundle size reduced from 3.8MB to 2.5MB (34% reduction)**
    - **Build Fixes:**
      - Removed `html2canvas` from config (not installed)
      - Removed `pixi.js` from config (empty chunk warning)

- **Files Created:**
  - `src/components/common/Skeleton.jsx` - Loading placeholder components
  - `src/hooks/useInterval.js` - Safe interval hook
  - `src/hooks/useDebounce.js` - Debounce hook
  - `src/hooks/useAsyncEffect.js` - Async effect with cancellation
  - `src/hooks/useEventListener.js` - Event listener hook
  - `src/hooks/index.js` - Hooks barrel export

- **Files Modified:**
  - `vite.config.js` - Added code splitting configuration
  - `docs/PGM_IMPLEMENTATION_PLAN.md` - Added execution summary

---

### January 15, 2026 (Plant Manager Dashboard - Batch 1)

- **Plant General Manager (PGM) Dashboard - Complete**
  - Implemented full Plant Manager Dashboard for factory-level operations management
  - **Database Migration:** `20260115_plant_manager_system.sql` with 15 new tables
  - **Implementation Plan:** `docs/PGM_IMPLEMENTATION_PLAN.md` with 30 tickets across 5 batches

  - **New Database Tables:**
    | Table | Purpose |
    |-------|---------|
    | `modules` | Individual building modules within projects (flow through 12 stations) |
    | `station_templates` | 12 production line stages with QC checklists |
    | `station_assignments` | Module-to-station tracking with crew assignments |
    | `workers` | Factory floor workforce (separate from system users) |
    | `worker_shifts` | Clock in/out tracking with pay calculations |
    | `qc_records` | Quality control inspection records |
    | `inspection_rules` | Configurable inspection requirements |
    | `long_lead_items` | Long-lead material tracking |
    | `plant_config` | Per-plant settings |
    | `calendar_audit` | Schedule change audit trail |
    | `takt_events` | Takt time tracking |
    | `kaizen_suggestions` | Improvement ideas |
    | `cross_training` | Worker certifications |
    | `safety_checks` | Daily safety checks |
    | `five_s_audits` | 5S audit records |

  - **12 Default Production Stations Seeded:**
    1. Metal Frame Welding
    2. Rough Electrical
    3. Rough Plumbing
    4. Rough Mechanical
    5. Insulation
    6. Drywall
    7. Interior Finishes
    8. Exterior Finishes
    9. Final Electrical
    10. Final Plumbing
    11. Final QC
    12. Dealer Pickup

  - **Service Layers Created:**
    - `src/services/stationService.js` - Station templates CRUD, checklist management
    - `src/services/modulesService.js` - Module tracking, scheduling, station movement
    - `src/services/workersService.js` - Workforce management, shifts, attendance
    - `src/services/qcService.js` - QC records, inspections, defect tracking

  - **Plant Manager Dashboard Features:**
    - **Overview Tab:** Key metrics (active modules, in progress, staged, completed, crew)
    - **Production Line Tab:** 12-station visualization with module counts
    - **Calendar Tab:** Placeholder for future production calendar
    - **Crew Tab:** Attendance summary, active shifts display

  - **Station Detail Modal:** (`src/components/production/StationDetailModal.jsx`)
    - Modules at station with time tracking
    - Assigned crew display with lead badges
    - QC checklist preview
    - "Start Next Module" action for Plant Managers

  - **Module Detail Modal:** (`src/components/production/ModuleDetailModal.jsx`)
    - Module specs (serial, dimensions, building type)
    - Station history timeline
    - Project link with navigation
    - GM Actions menu (Fast-track, QC Hold, Rework, Scrap)

  - **GM Override Features (Plant Manager only):**
    - Drag-and-drop module movement between stations
    - Visual indicators during drag operations
    - Automatic audit logging to `calendar_audit` table
    - "GM Mode" badge in production line view

  - **Routing & Navigation:**
    - Added `plant_manager` dashboard type detection in `App.jsx`
    - Added Plant Manager navigation items to `Sidebar.jsx`
    - Supports both "Plant Manager" and "plant_manager" role formats

- **Files Created:**
  - `supabase/migrations/20260115_plant_manager_system.sql` - PGM database schema
  - `src/services/stationService.js` - Station service layer
  - `src/services/modulesService.js` - Modules service layer
  - `src/services/workersService.js` - Workers service layer
  - `src/services/qcService.js` - QC service layer
  - `src/components/dashboards/PlantManagerDashboard.jsx` - Main dashboard component
  - `src/components/production/StationDetailModal.jsx` - Station detail view
  - `src/components/production/ModuleDetailModal.jsx` - Module detail view
  - `docs/PGM_IMPLEMENTATION_PLAN.md` - Implementation tickets

- **Files Modified:**
  - `src/App.jsx` - Added Plant Manager routing
  - `src/components/layout/Sidebar.jsx` - Added Plant Manager navigation
  - `docs/DATABASE_SCHEMA.md` - Added PGM tables documentation
  - `docs/PROJECT_STATUS.md` - This file

---

### January 14, 2026 (Smart Defaults Feature)

- **Department-Based Smart Defaults - Complete**
  - Created `src/utils/smartDefaults.js` with keyword-to-department mappings
  - **Smart Internal Owner Sorting:**
    - Analyzes RFI subject/question, Submittal title/description, Task title/description
    - Maps content keywords to suggested departments
    - Sorts user dropdown with best matches first (★ indicator)
    - "Smart sorted" sparkle icon shows when suggestions active
  - **Priority Auto-Suggestion:**
    - Detects urgent/critical keywords → suggests "Critical"
    - Detects important/deadline keywords → suggests "High"
    - Detects fyi/not urgent keywords → suggests "Low"
    - One-click button to accept suggestion
  - **Files Modified:**
    - `src/components/projects/AddRFIModal.jsx` - Added smart defaults
    - `src/components/projects/AddSubmittalModal.jsx` - Added smart defaults
    - `src/components/projects/AddTaskModal.jsx` - Added smart defaults
  - **Files Created:**
    - `src/utils/smartDefaults.js` - Core suggestion functions

### January 14, 2026 (Team Builder & Excel Export Enhancement)

- **Team Builder Feature - Complete**
  - New Kanban-style team management system for Directors and VPs
  - **Database Schema:**
    - `teams` table - Team definitions with name, description, color
    - `team_members` junction table - Many-to-many PM-to-team assignments
    - RLS policies restricting access to Director/VP/Admin roles
  - **TeamPage Redesign:**
    - Two tabs: "All Team Members" and "Team Builder"
    - "All Team Members" tab shows existing workload metrics
    - "Team Builder" tab with drag-and-drop interface
  - **Drag-and-Drop Team Assignment:**
    - PM Pool on left side (unassigned PMs)
    - Team columns on right (create multiple teams)
    - Native HTML5 drag-and-drop (no external library)
    - Visual feedback during drag operations
    - PMs can belong to multiple teams
  - **Team CRUD Operations:**
    - Create teams with name, description, color picker
    - Edit existing teams
    - Delete teams (with confirmation)
    - Team statistics auto-update (projects, tasks, capacity)
  - **PM Cards Display:**
    - Active projects count
    - Open tasks count
    - Pending RFIs count
    - Visual capacity indicator (overloaded, at capacity, available)
  - **Role-Based Visibility:**
    - Directors see: PMs only
    - VPs see: PMs, Directors, and Plant Managers
  - **Migration:** `supabase/migrations/20260114_team_builder.sql`
  - **Files Modified:** `src/components/pages/TeamPage.jsx` (complete rewrite)

- **Excel Export Beautification - Complete**
  - Upgraded from basic `xlsx` library to `exceljs` for professional styling
  - **RFI Log Export Styling:**
    - Dark blue header row with white bold text
    - Frozen header row
    - Auto-width columns
    - Status-based row coloring (Answered=green, Open=yellow, Pending=orange)
    - Overdue item highlighting (light red background)
    - Summary section at bottom (totals by status)
  - **Submittal Log Export Styling:**
    - Same professional header styling
    - Status-based row coloring (Approved=green, Rejected=red, Under Review=yellow)
    - Overdue highlighting
    - Summary section
  - **Files Modified:** `src/utils/excelExport.js` (complete rewrite)
  - **Package Added:** `exceljs` (npm install)

- **PM Workload Report Fix - Complete**
  - Fixed PM Workload Analysis showing all zeros
  - Root cause: Code was using non-existent `p.pm_id` field
  - Fixed to use `p.owner_id || p.primary_pm_id` (matches PMDashboard pattern)
  - **Files Fixed:**
    - `src/components/reports/ExecutiveReports.jsx`
    - `src/components/dashboards/TeamWorkloadView.jsx`
    - `src/components/pages/TeamPage.jsx`

- **VP Team View Fix - Complete**
  - VP's team now correctly shows all PMs, Directors, and Plant Managers
  - Previously was only showing Director role
  - Updated role filter array in TeamPage.jsx

- **Personnel Management Page (Future)**
  - Feature idea documented for future implementation
  - Will include employee management, onboarding, training tracking
  - Tabled for later planning phase

### January 14, 2026 (Late Night - Executive Reports Enhancement)

- **Executive Reports - Major Upgrade**
  - Added date range filtering with 6 preset options (30/60/90 days, Quarter, Year, All Time)
  - Added PDF export capability for branded executive reports
  - Added 4 new report sections to the dashboard

  - **Date Range Filtering (NEW):**
    - Dropdown selector with 6 presets
    - Last 30/60/90 Days options
    - This Quarter / This Year options
    - All Time option
    - Filter affects all report metrics

  - **PDF Export (NEW):**
    - Export current report as branded PDF
    - Professional Sunbelt branding header
    - Portfolio overview metrics
    - Workflow phase distribution table
    - Items requiring attention section
    - Footer with document control

  - **Delivery Pipeline Report (NEW):**
    - Upcoming deliveries by time horizon (30/60/90+ days)
    - Pipeline value by delivery window
    - Sortable table of upcoming deliveries
    - Days until delivery with urgency coloring

  - **PM Workload Report (NEW):**
    - Project manager capacity analysis
    - Projects/PM, Tasks/PM metrics
    - Utilization percentage with visual bars
    - Overdue task tracking by PM
    - Portfolio value per PM

  - **Factory Capacity Report (NEW):**
    - Factory utilization metrics
    - Active projects by factory
    - Month-to-date completions
    - Upcoming deliveries (30 days)
    - Portfolio value breakdown
    - Capacity utilization bars

  - **Risk Assessment Report (NEW):**
    - Critical and at-risk project counts
    - Project health distribution
    - Total overdue items breakdown
    - Risk-scored project ranking
    - High-risk projects table
    - Color-coded health status badges

- **Files Modified:**
  - `src/components/reports/ExecutiveReports.jsx` - Added 4 new reports, date filter, PDF export

### January 14, 2026 (Late Night - System Configuration Expansion)

- **SystemConfiguration Settings - Expanded**
  - Added 5 new configuration sections to IT Settings page
  - All settings persisted to localStorage with Save/Reset functionality

  - **Security Settings Section (NEW):**
    - Session timeout duration (15-1440 minutes)
    - Strong password requirements toggle
    - Minimum password length (6-32 chars)
    - 2FA requirement for admin accounts
    - Max login attempts before lockout (3-10)
    - Account lockout duration (5-120 minutes)
    - Auto logout on idle toggle
    - Idle timeout configuration (5-240 minutes)

  - **Project Defaults Section (NEW):**
    - Default phase count for new projects (1-10)
    - Auto-archive days after completion (30-365)
    - Require project number toggle
    - Project number prefix (e.g., "SBT")
    - Warning days before delivery (3-30)
    - Critical days before delivery (1-14)

  - **Calendar & Scheduling Section (NEW):**
    - Workday start/end times (time inputs)
    - Include Saturdays toggle
    - Default meeting duration (15-480 minutes)
    - Show weekends in calendar toggle

  - **RFI & Submittal Settings Section (NEW):**
    - Default RFI due days (1-30)
    - Default submittal due days (1-60)
    - Require approval to close toggle
    - Auto-notify on overdue toggle
    - Escalation days after overdue (1-14)

  - **Factory Settings Section (NEW):**
    - Default factory code (e.g., "ATX")
    - Require factory assignment toggle
    - Show all factories in reports toggle
    - Factory color coding toggle

- **Files Modified:**
  - `src/components/it/SystemConfiguration.jsx` - Added 5 new config sections with UI

### January 14, 2026 (Late Night - IT Dashboard Enhancements)

- **IT Sidebar Navigation - Enhanced**
  - Added 3 new navigation items: Security Center, Database Tools, Settings
  - Full IT nav: Dashboard → User Management → Error Tracking → Security → Database → Settings → Announcements → Feature Flags → Sessions → Factory Map
  - Each page accessible directly from sidebar (no longer just ITDashboard tabs)

- **IT Dashboard Visual Improvements - Complete**
  - Modern gradient stat cards with icon backgrounds
  - 6-column responsive grid layout
  - Hover effects with shadow elevation
  - Color-coded system status indicators

- **Error Tracking Dashboard - Enhanced**
  - **New Charts & Metrics:**
    - 7-day trend chart (created vs resolved tickets)
    - Resolution rate donut chart (percentage visualization)
    - Average resolution time metric (hours, color-coded by SLA)
    - Status distribution bar with legend
  - **Improved Stats:**
    - Grid layout for stat cards
    - Added "Closed" count to metrics
    - Critical ticket highlighting

- **Files Modified:**
  - `src/components/layout/Sidebar.jsx` - Added Security, Database, Settings nav items
  - `src/App.jsx` - Added routing for SecurityCenter, DatabaseTools, SystemConfiguration
  - `src/components/it/ITDashboard.jsx` - Modern stat cards with gradients
  - `src/components/it/ErrorTracking.jsx` - Charts, trends, resolution metrics

### January 14, 2026 (Late Night - Collapsible Sidebar)

- **Collapsible Sidebar - Complete**
  - Added ability to collapse sidebar to icon-only mode (64px width)
  - **Features:**
    - Toggle button in header (PanelLeftClose icon) when expanded
    - Expand button in footer (PanelLeft icon) when collapsed
    - Keyboard shortcut: Ctrl+B (Windows) / Cmd+B (Mac)
    - State persisted in localStorage (`sidebarCollapsed`)
    - Smooth CSS transition animations (0.2s ease-in-out)
  - **Collapsed Mode:**
    - Logo shows only Building2 icon (no text)
    - Dashboard selector shows only current icon (dropdown appears to the right)
    - Stats section hidden when collapsed
    - Navigation shows only icons with tooltips on hover
    - Footer shows avatar, expand/theme/logout buttons stacked vertically
  - **Main Content:**
    - App.jsx syncs with localStorage to adjust main content margin
    - Smooth transition when sidebar width changes

- **Files Modified:**
  - `src/components/layout/Sidebar.jsx` - Added collapse functionality
  - `src/App.jsx` - Added sidebar width state sync

### January 14, 2026 (Late Night - ContactPicker & Documentation)

- **ContactPicker Component - Complete**
  - Created `src/components/common/ContactPicker.jsx` - Reusable contact selection component
  - **Features:**
    - Type-ahead search across 311 directory contacts
    - Factory grouping with project factory prioritized first
    - Department color-coded badges (14 departments with unique colors)
    - Keyboard navigation (arrow keys, enter to select, escape to close)
    - External contact option toggle (for non-directory recipients)
    - Suggested department filtering
  - **Integration:**
    - `EditTaskModal.jsx` - Replaced grouped select dropdown with ContactPicker
    - `EditRFIModal.jsx` - Replaced select dropdown with ContactPicker (conditional on is_external)
    - `EditSubmittalModal.jsx` - Same pattern as EditRFIModal
  - **Database fields updated:**
    - New fields: `assigned_to_contact_id`, `assigned_to_name`, `assigned_to_email`
    - Snapshot approach for data integrity (stores name/email at time of assignment)
    - Backward compatible: Legacy `assignee_id` and `sent_to` fields retained

- **System Documentation - Complete**
  - Created `docs/DATABASE_SCHEMA.md` - Comprehensive database schema reference
    - All tables with columns, types, constraints, indexes
    - Key tables: users, projects, tasks, rfis, submittals, directory_contacts, sales_quotes, factories, departments
    - RLS policies and triggers documented
    - Entity relationships and dependencies
  - Created `docs/FRONTEND_ARCHITECTURE.md` - React component organization reference
    - Component hierarchy and feature domains
    - Role-based routing documentation
    - State management patterns (local state + Supabase)
    - CSS variables and styling approach
    - Data flow patterns

- **Files Created:**
  - `src/components/common/ContactPicker.jsx` - NEW: Reusable contact picker
  - `docs/DATABASE_SCHEMA.md` - NEW: Database schema documentation
  - `docs/FRONTEND_ARCHITECTURE.md` - NEW: Frontend architecture documentation

- **Files Modified:**
  - `src/components/projects/EditTaskModal.jsx` - Integrated ContactPicker
  - `src/components/projects/EditRFIModal.jsx` - Integrated ContactPicker
  - `src/components/projects/EditSubmittalModal.jsx` - Integrated ContactPicker
  - `docs/PROJECT_STATUS.md` - Added documentation links

### January 14, 2026 (Late Night - Code Refactoring)

- **Sales Status Configuration Refactoring - Complete**
  - Created `src/constants/salesStatuses.js` as single source of truth for all sales status definitions
  - Eliminated ~250 lines of duplicate STATUS_CONFIG code across 7 files
  - **Exports from shared constants file:**
    - `STATUS_CONFIG` - Full status configuration with labels, colors, icons, bgColors, order
    - `ACTIVE_STATUSES` - Pipeline statuses: draft, pending, sent, negotiating, awaiting_po, po_received
    - `TERMINAL_STATUSES` - End states: won, lost, expired, converted
    - `ALL_STATUSES` - Sorted by display order
    - `BUILDING_TYPES` - CUSTOM, FLEET/STOCK, GOVERNMENT, Business
    - `BUILDING_TYPE_COLORS` - Color mapping for building types
    - `FACTORIES` - All 14 factory codes
    - `AGING_THRESHOLDS` - Days for fresh (15), aging (25), stale (30)
    - `LOST_REASONS` - Dropdown options for lost quotes
    - Helper functions: `formatCurrency`, `formatCompactCurrency`, `getDaysAgo`, `getAgingColor`, `getAgingLabel`, `getStatusConfig`, `isActiveStatus`, `isTerminalStatus`
  - **Files updated to use shared constants:**
    - `src/components/sales/SalesManagerDashboard.jsx`
    - `src/components/sales/SalesRepDashboard.jsx`
    - `src/components/sales/SalesDashboard.jsx`
    - `src/components/sales/SalesTeamPage.jsx`
    - `src/components/sales/QuoteDetail.jsx`
    - `src/components/layout/Sidebar.jsx`
    - `src/components/calendar/CalendarPage.jsx`
  - **Bug fix:** Sidebar was using incomplete activeStatuses array (missing awaiting_po, po_received) - now uses shared ACTIVE_STATUSES
  - **Bug fix:** Fixed missing icon imports (Award, FileText, CheckCircle, ArrowRight) in dashboard components after refactoring

- **Debug Logging Cleanup - Complete**
  - Removed debug console.log statements from CalendarPage.jsx

- **Files Created:**
  - `src/constants/salesStatuses.js` - NEW: Shared sales status configuration

- **Commits:**
  - `5c7cefa` - Refactor: Extract shared STATUS_CONFIG to single source of truth
  - `51d8ace` - Fix: Add missing icon imports after refactoring

### January 14, 2026 (Night - Sales Data & Status Fixes)

- **Sales Quotes Data Fix - Complete**
  - Fixed Robert Thaler (Sales_Rep at NWBS) having no quotes assigned
  - Root cause: User query searched for `role IN ('Sales', 'Sales_Manager')` but missed `Sales_Rep`
  - Added 7 new quotes for Robert at NWBS factory:
    - Q-2026-NWBS-R01: AWS Seattle ($3.2M, negotiating)
    - Q-2026-NWBS-R02: Boeing Everett ($1.85M, sent)
    - Q-2026-NWBS-R03: Port of Seattle ($980K, pending)
    - Q-2026-NWBS-R04: Microsoft Redmond ($2.1M, draft, PM flagged)
    - Q-2026-NWBS-R05: Starbucks ($420K, sent)
    - Q-2025-NWBS-R10: Won quote ($650K)
    - Q-2025-NWBS-R11: Lost quote ($1.1M)
  - Added 5 new NWBS customers: AWS Seattle, Boeing, Port of Seattle, Microsoft Campus, Starbucks
  - Created `FIX_SALES_DATA.sql` standalone fix script

- **Sidebar Sales Stats Fix - Complete**
  - Fixed sidebar showing $0 pipeline value for Sales Manager
  - Root cause: Was fetching ALL quotes globally instead of filtering by user
  - Now filters quotes by `assigned_to = user.id` for personal stats
  - Added `pending` to active statuses array
  - Fixed dashboard type switching for sales_manager role
  - Added sales_manager to dashboard dropdown options

- **Sales Status Configuration Fix - Complete**
  - Added `pending` status to STATUS_CONFIG in all sales components
  - Added `pending` to ACTIVE_STATUSES in:
    - `Sidebar.jsx`
    - `SalesManagerDashboard.jsx`
    - `SalesRepDashboard.jsx`
    - `SalesDashboard.jsx`
    - `SalesTeamPage.jsx`
  - Status order updated: draft → pending → sent → negotiating → awaiting_po → po_received → won → lost → expired → converted

- **Quote Display Clarifications - Complete**
  - Fixed "Untitled Quote" display - now shows `quote.notes || customer.company_name`
  - Clarified "X of Y quotes" message to explain won/lost/expired are hidden
  - Message now shows: "Showing 7 active quotes (3 won/lost/expired not shown)"

- **Files Modified:**
  - `supabase/demo/MASTER_DEMO_DATA.sql` - Fixed user lookup, added Robert's quotes
  - `supabase/demo/FIX_SALES_DATA.sql` - NEW: Standalone fix script
  - `src/components/layout/Sidebar.jsx` - Personal quote filtering, dashboard switching
  - `src/components/sales/SalesManagerDashboard.jsx` - Added pending status, quote count clarification
  - `src/components/sales/SalesRepDashboard.jsx` - Added pending status, quote count clarification
  - `src/components/sales/SalesDashboard.jsx` - Added pending status, quote count clarification
  - `src/components/sales/SalesTeamPage.jsx` - Added pending status

- **Debug Logging Cleanup - Complete**
  - Removed debug console.log statements from PMDashboard.jsx
  - Removed debug console.log statements from ProjectDetails.jsx

### January 14, 2026 (Evening - ProjectsPage Redesign & Demo Data Completion)

- **ProjectsPage Complete Redesign - Complete**
  - Redesigned entire `ProjectsPage.jsx` with modern UI inspired by SalesManagerDashboard and OverviewTab
  - **Enhanced StatCard Component:**
    - Icon + metric boxes with colored backgrounds
    - 6 key metrics: Total, Active, This Week deliveries, At Risk, Critical, Completed
    - Clickable stat cards for quick filtering
  - **New ProjectCard Component:**
    - Left border color indicator based on health status (On Track=green, At Risk=yellow, Critical=red)
    - Phase badge with visual indicator (1-4: Initiation, Dealer Sign-Offs, Internal Approvals, Delivery)
    - Delivery countdown with urgency coloring (red ≤7d, yellow ≤14d, blue ≤30d)
    - Health status dot/indicator
    - Project info: number, name, client, PM, factory
  - **New Filters:**
    - Health filter dropdown (All, On Track, At Risk, Critical)
    - "Clear Filters" button
    - Results count display
  - **Visual Polish:**
    - Consistent use of CSS custom properties
    - Smooth hover effects with shadow elevation
    - Better empty states

- **MASTER_DEMO_DATA.sql Deep Review & Fixes - Complete**
  - Fixed NWBS-25250 project status inconsistency (was marking workflow as complete but project still 'In Progress')
  - Added all 311 directory contacts (was missing 122):
    - AMT - AMTEX (19 contacts)
    - BUSA - Britco USA (17 contacts)
    - C&B - C&B Custom Modular (11 contacts)
    - MRS - MR Steel (10 contacts)
    - WM-EAST - Whitley Manufacturing East (18 contacts)
    - WM-EVERGREEN - Whitley Manufacturing Evergreen (10 contacts)
    - WM-SOUTH - Whitley Manufacturing South Whitley (26 contacts)
    - WM-ROCHESTER - Whitley Manufacturing Rochester (11 contacts)
  - Script is now fully self-contained (no need to run 09_DIRECTORY_CONTACTS.sql separately)
  - Verified:
    - Mitch Quintana correctly setup as Sales_Manager at NWBS
    - Robert Thaler correctly setup as Sales_Rep at NWBS
    - sales_quotes table has factory column for calendar filtering
    - Quote-to-project linkage via converted_to_project_id working

### January 14, 2026 (Sales Role System & Project Overview Redesign)

- **Separate Sales Manager & Sales Rep Dashboards - Complete**
  - Created dedicated `SalesManagerDashboard.jsx` component
    - Factory-based filtering (sees all quotes in their factory)
    - Team overview section with individual rep performance metrics
    - Sales funnel visualization, building type charts
    - Stale quote alerts and PM flagging
  - Created dedicated `SalesRepDashboard.jsx` component
    - User-specific filtering (sees only their own quotes)
    - "Needs Attention" section for overdue and stale quotes
    - Personal monthly stats and pipeline progress
    - Simplified view focused on individual performance
  - Updated `App.jsx` with role-based routing:
    - `sales_manager` -> SalesManagerDashboard
    - `sales_rep` -> SalesRepDashboard
    - Legacy `sales` -> SalesDashboard
  - Updated `Sidebar.jsx` with role-specific navigation items
  - Files created:
    - `src/components/sales/SalesManagerDashboard.jsx`
    - `src/components/sales/SalesRepDashboard.jsx`

- **Sales Calendar Role Filtering - Complete**
  - Sales Managers now see only projects linked to quotes in their factory
  - Sales Reps see only projects linked to their personally assigned quotes
  - Fixed calendar to use both `project_id` and `converted_to_project_id` for quote-to-project linking
  - Updated `CalendarPage.jsx` with proper role detection and filtering

- **PM Projects View for Sales - Complete**
  - Sales users can now view PM Projects tab in read-only mode
  - "Create Project" and "Import from Praxis" buttons hidden for sales roles
  - Added `isSalesView` prop to `ProjectsPage.jsx`

- **Demo Data Updates - Complete**
  - Added Robert Thaler as Sales_Rep at NWBS factory
  - Created Mitch's quote linked to Hanford project (NWBS-25250) via `converted_to_project_id`
  - Robert has dedicated quotes for AWS, Boeing, Port of Seattle, Microsoft, etc.
  - Updated `00_UPDATE_USERS.sql` and `08_SALES_DATA.sql`

- **Project Details Overview Tab Redesign - Complete**
  - Created new `OverviewTab.jsx` component with modern UI inspired by Procore, BuilderTrend, Monday.com
  - **Project Health Score** - Visual gauge (0-100) with status factors
    - Calculates score based on overdue tasks, RFIs, submittals, milestones
    - Color-coded status: On Track (green), At Risk (yellow), Critical (red)
  - **Key Dates Timeline** - Progress bar showing milestone completion
    - Sales handoff, milestones, target online date
    - Visual indicators for completed, upcoming, and overdue dates
  - **Blockers & Needs Attention** - Clickable list of overdue items
    - Shows overdue tasks, RFIs, submittals with days overdue
    - Items due within 3 days marked as "info" level
    - Click to open edit modal for quick resolution
  - **Project Info Card** - Compact key details display
  - **Recent Activity Feed** - Last 6 updates to tasks, RFIs, submittals
  - **This Week Calendar Strip** - Mon-Fri view of upcoming items
  - Integrated into `ProjectDetails.jsx` (removed inline OverviewTab function)

### January 13, 2026 (Praxis Integration - In Progress)

- **Workflow Canvas Visualization - Complete**
  - Implemented React Flow (@xyflow/react) based workflow canvas
  - Created custom StationNode component with status animations (pulse, glow)
  - Created custom PulsingEdge component with animated connectors
  - Added useWorkflowGraph hook for Supabase data integration
  - WorkflowCanvas component with:
    - Subway/Metro map style visualization
    - Phase zones with color coding
    - Progress indicator with percentage
    - MiniMap and zoom controls
    - Fullscreen mode
    - Real-time updates (optional)
  - Integrated into ProjectDetails with Canvas/List view toggle
  - Files created:
    - `src/components/workflow/components/StationNode.jsx`
    - `src/components/workflow/components/PulsingEdge.jsx`
    - `src/components/workflow/hooks/useWorkflowGraph.js`
    - `src/components/workflow/visualizers/WorkflowCanvas.jsx`

- **Sales Team Page - Complete**
  - Created dedicated SalesTeamPage component for Sales Managers
  - Shows team performance metrics, pipeline distribution, win rates
  - Sortable by pipeline, active quotes, win rate, or stale quotes
  - Team member cards with capacity indicators
  - Updated App.jsx routing for /team -> SalesTeamPage
  - Added compact team overview to Sales Dashboard

- **Calendar & Dashboard Role Filtering - Complete**
  - Added PM-specific calendar filtering (only shows items from assigned projects)
  - PMs now see only projects where they are owner_id, primary_pm_id, or backup_pm_id
  - Sales Managers see only items from their factory's projects
  - Sales Reps see only items from projects where they have assigned quotes
  - Fixed Team section navigation for Sales Dashboard - now shows empty state when no team members exist

- **Praxis Integration - Phase 1 Complete**
  - Analyzed Sunbelt Sales & Praxis Training Materials folder
  - Created comprehensive analysis document: `docs/PRAXIS_INTEGRATION_ANALYSIS.md`
  - Designed database schema for Praxis data integration
  - Documented 8-phase project lifecycle from Praxis workflow

- **Database Schema Migration Applied**
  - Migration: `supabase/migrations/20260113_praxis_integration.sql`
  - **New Tables Created:**
    - `dealers` - Praxis dealer/customer tracking (PMSI, MMG, US MOD, United Rentals seeded)
    - `project_documents_checklist` - Order processing document tracking
    - `praxis_import_log` - Import audit trail
  - **Projects Table Extended (~40 new columns):**
    - Praxis identification (quote_number, serial_number)
    - Building specs (dimensions, stories, modules)
    - Cost breakdown (material, markup, engineering, approvals)
    - Compliance (climate_zone, loads, occupancy, WUI)
    - Dealer reference (dealer_id FK, branch, contact)
    - Schedule (promised_delivery, drawings_due)
    - Pipeline tracking (outlook_percentage, waiting_on)
    - Approval dates (customer, state)
  - RLS policies configured for all new tables

- **Import Functionality Created**
  - `src/utils/praxisImport.js` - CSV/Excel parsing, validation, field mapping
  - `src/components/projects/PraxisImportModal.jsx` - Dual-mode import UI
    - Manual Entry tab with collapsible form sections
    - CSV Import tab with drag-and-drop, validation preview
    - Template download (CSV and Excel formats)
  - "Import from Praxis" button added to Projects page

- **Field Consolidation Analysis (In Progress)**
  - Identified conflicts between existing schema and Praxis fields:
    - `delivery_date` vs `promised_delivery_date` → Standardize to Praxis naming
    - `dealer` (text) vs `dealer_id` (FK) → Migrate to FK
    - `client_name` vs `dealer_contact_name` → Standardize to Praxis naming
    - `building_type` taxonomy → Use Praxis values (CUSTOM, FLEET/STOCK, GOVERNMENT, Business)
    - `site_address` → Decompose to city/state/zip fields

- **Architecture Decision: Separate Sales Quotes Table**
  - Sales quotes will live in separate `sales_quotes` table (not projects)
  - Quote statuses: Open Quote → Awaiting PO → PO Received → Convert to Project
  - Sales can flag quotes for PM assistance (VP visibility)
  - PMs only see projects, not sales pipeline quotes
  - VP has full visibility across quotes and projects

- **Sales Quote Praxis Integration - Complete**
  - Migration: `supabase/migrations/20260113_sales_quotes_praxis_fields.sql`
  - **sales_quotes Table Extended with Praxis Fields:**
    - Praxis identification (praxis_quote_number, praxis_source_factory)
    - Dealer reference (dealer_id FK, branch, contact)
    - Building specs (type, dimensions, modules, stories)
    - Compliance (climate_zone, occupancy, set_type, WUI)
    - Pipeline tracking (outlook_percentage, waiting_on, difficulty_rating)
    - PM flagging (pm_flagged, pm_flagged_at, pm_flagged_by, pm_flagged_reason)
    - Conversion tracking (converted_to_project_id, converted_at, converted_by)
  - `src/components/sales/PraxisQuoteImportModal.jsx` - Sales-specific import UI
    - Manual Entry and CSV Import tabs
    - Imports to sales_quotes table (not projects)
    - PM flagging capability for sales assistance requests
  - "Import Quote from Praxis" button added to Sales Dashboard

- **Dashboard Enhancements - Complete**
  - All role-based dashboards enhanced to leverage new Praxis data fields
  - Reference: `docs/DASHBOARD_ENHANCEMENT_PLAN.md` for detailed specifications

  - **Sales Dashboard Enhancements:**
    - Updated STATUS_CONFIG with 9 Praxis-aligned statuses (draft, sent, negotiating, awaiting_po, po_received, won, lost, expired, converted)
    - Added weighted pipeline metric (value × outlook_percentage)
    - Added visual sales funnel (Open → Awaiting PO → PO Received → Converted)
    - Added building type breakdown chart with filter
    - Enhanced quote cards with Praxis fields (outlook%, waiting_on, difficulty_rating, sqft, modules, dealer)
    - Added quote aging indicators (30-day scale: green 0-15d, yellow 16-25d, red 26-30+)
    - Added PM flagging UI (badge, filter, dedicated section)
    - Compact metrics bar layout for better real estate usage

  - **VP Dashboard Enhancements:**
    - Added Sales Pipeline Overview section (read-only visibility)
    - Pipeline metrics: raw value, weighted value, won revenue, win rate
    - PM-flagged quotes section ("Needs PM Attention")
    - Recently Converted section (quotes → projects in last 30 days)
    - Weighted pipeline forecast (next 30/60/90 days)

  - **Director Dashboard Enhancements:**
    - Enhanced project table with Praxis fields (building type, sqft, modules, promised delivery)
    - Added "Incoming Projects" section (quotes at 95%+ outlook)
    - PM Workload with toggle (Simple vs Weighted by difficulty rating)
    - Workload bars with capacity indicators

  - **PM Dashboard Enhancements:**
    - Added Urgent Deliveries alert (projects with delivery in next 14 days)
    - Added Delivery Timeline view with 30/60/90 day toggle
    - Enhanced project table with building type column
    - Added dealer info and promised delivery date display
    - Timeline cards show difficulty rating (5-star visual)

- **Phase 1 Complete:**
  - [x] Add "Import from Praxis" button to PM, Director, VP dashboards ✅
  - [x] Add "Import Quote from Praxis" button to Sales dashboard ✅
  - [x] Create sales_quotes Praxis fields migration ✅
  - [x] Dashboard enhancements for all roles ✅
  - [ ] Update CreateProjectModal with Praxis field structure
  - [ ] Create field consolidation migration

- **PC/Plant Manager Factory Filtering - Complete Fix**
  - Fixed factory-based data filtering for Project Coordinator and Plant Manager roles
  - Issue: PC/Plant Manager users were seeing all projects instead of only their assigned factory's projects
  - Root cause: Code was filtering by `factory_id` (UUID) but projects table uses `factory` (code string like 'PMI', 'ATL', etc.)

  - **Files Fixed:**
    - `src/components/dashboards/PCDashboard.jsx` - Fixed project query to filter by factory code
    - `src/components/layout/Sidebar.jsx` - Fixed PC stats to filter by factory code
    - `src/components/calendar/CalendarPage.jsx` - Already had correct filtering (uses embedded project joins)

  - **Database Fix Applied:**
    - Updated PC user (Juanita Earnest) to have correct `factory_id` assignment to PMI factory
    - Added factory assignment dropdown to EditUserModal for IT admins

  - **How It Works Now:**
    1. User's `factory_id` links to `factories` table
    2. System fetches factory `code` via join (e.g., 'PMI')
    3. Projects filtered by `project.factory === factoryCode`
    4. All views (Dashboard, Sidebar, Calendar) now show consistent factory-filtered data

- **Calendar "Unknown Project" Bug - Fixed (Previous Session)**
  - Fixed RLS policy allowing PC users to read projects via embedded joins
  - Calendar items now show correct project names instead of "Unknown Project"

### January 12, 2026

- **IT Dashboard Enhancement (Phase 1 & 2)**
  - **Phase 1: IT-Specific Navigation**
    - Restricted IT users to IT-specific sidebar (Dashboard, User Management, Error Tracking, Factory Map)
    - Removed Projects, Tasks, RFIs, Submittals from IT view (not relevant to IT workflow)
    - IT users now only access IT Dashboard (not VP/Director/PC dashboards)

  - **Phase 2: Error Tracking System**
    - Created global `ErrorBoundary` component wrapping the entire app
    - Auto-captures JavaScript errors and reports to database
    - Shows friendly fallback UI with "Try Again", "Go Home", and "Report Issue" options
    - Users can add context when reporting errors
    - Built Error Tracking page with List and Kanban views
    - Stats dashboard showing Total, New, In Progress, Resolved, Critical counts
    - Ticket detail modal with assignment, status workflow, and comments
    - Status workflow: New → Investigating → In Progress → Resolved → Closed
    - Priority levels: Critical, High, Medium, Low
    - Auto-generated ticket numbers (ERR-0001, ERR-0002, etc.)
    - Database migration: `20260112_error_tracking_system.sql`
    - New tables: `system_errors`, `error_tickets`, `error_ticket_comments`
    - RLS policies restrict access to IT/Admin users only

  - Files created/modified:
    - `src/components/common/ErrorBoundary.jsx` (new)
    - `src/components/it/ErrorTracking.jsx` (new)
    - `src/components/layout/Sidebar.jsx` (modified)
    - `src/App.jsx` (modified)
    - `src/main.jsx` (modified)
    - `supabase/migrations/20260112_error_tracking_system.sql` (new)

  - **Phase 3: IT_Manager Role Distinction**
    - Added `IT_Manager` role separate from regular `IT` staff
    - IT_Manager can assign tickets to IT staff members
    - Regular IT staff can only change status on tickets assigned to them
    - Added "My Tickets / All Tickets" toggle filter
    - Regular IT defaults to "My Tickets" view
    - Updated role arrays in CreateUserModal, EditUserModal, UserManagement
    - Added IT_Manager role color (cyan/teal)
    - Updated App.jsx and Sidebar.jsx for IT_Manager routing
    - Updated itAnalytics.js security metrics to include IT_Manager

  - **Phase 4: IT Admin Tools**
    - **Announcement System**
      - System-wide announcements displayed at top of app
      - Types: info, warning, critical, maintenance
      - Target by role and/or factory
      - Schedule start/expiration dates
      - Users can dismiss non-critical announcements
      - Database: `announcements`, `announcement_dismissals`
      - Migration: `20260112_announcement_system.sql`
      - Components: `AnnouncementBanner.jsx`, `AnnouncementManager.jsx`

    - **Feature Flags System**
      - Runtime feature toggles without deploying code
      - Categories: feature, ui, experimental, maintenance
      - Target by role, factory, or specific users
      - Audit log of all flag changes
      - Real-time updates via Supabase subscriptions
      - Context/hook: `FeatureFlagContext.jsx`
      - Database: `feature_flags`, `feature_flag_audit`
      - Migration: `20260112_feature_flags_system.sql`
      - Component: `FeatureFlagManager.jsx`

    - **Session Management**
      - View all active user sessions
      - See user, device, location, IP info
      - Activity status (Active, Idle, Away, Inactive)
      - Force logout individual sessions
      - Auto-refresh every 30 seconds
      - Database: `user_sessions`
      - Migration: `20260112_session_management.sql`
      - Component: `SessionManager.jsx`

  - IT Sidebar now includes:
    - Dashboard, User Management, Error Tracking, Announcements, Feature Flags, Sessions, Factory Map

- **RFI PDF Export: Factory Logo Integration**
  - Added factory logos to RFI PDF exports
  - Logo appears in PDF header (left side, next to Sunbelt Modular branding)
  - Created factory-to-logo mapping supporting all factories (NWBS, BRIT, SSI, AMTEX, etc.)
  - Logo is automatically loaded based on project's assigned factory
  - Uses base64 encoding for reliable browser print embedding
  - Updated EditRFIModal, ProjectDetails, and CalendarPage to pass factory info
  - Files changed: `pdfUtils.js`, `EditRFIModal.jsx`, `ProjectDetails.jsx`, `CalendarPage.jsx`

- **Factory Map: Architecture Pivot**
  - Identified React + PIXI.js integration issues (event handling, StrictMode conflicts)
  - Decided to pivot to standalone vanilla JavaScript + PIXI.js implementation
  - Created comprehensive standalone implementation plan (8-12 hour estimate)
  - Updated Factory Map page to show "Under Construction" notice
  - Added Factory Map to project roadmap as P1 priority
  - Documented 90% code reusability (all layers/sprites already vanilla JS)
  - See: [FACTORY_MAP_STANDALONE_PLAN.md](FACTORY_MAP_STANDALONE_PLAN.md) for details

### January 10, 2026
- Added Excel export for RFI and Submittal logs
- Added "My Tasks" / "All Tasks" toggle
- Reorganized assignee dropdown with factory grouping
- Added roles to all assignee displays
- Fixed floor plan pan/drag at any zoom level
- Fixed Director dashboard defaulting
- Updated demo data with realistic dates and contract values
- Cleaned up repository documentation

### January 9, 2026
- Implemented 6-phase workflow system
- Added workflow tracker component
- Created station detail modal
- Added backup PM field to projects
- Fixed various UI bugs

---

## Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | System users with roles and factory assignments |
| `projects` | Project records with all details |
| `tasks` | Task items linked to projects |
| `rfis` | Request for Information records |
| `submittals` | Submittal tracking records |
| `milestones` | Project milestone dates |

### Supporting Tables
| Table | Purpose |
|-------|---------|
| `factory_contacts` | Non-login contacts at factories |
| `file_attachments` | Uploaded files linked to items |
| `floor_plans` | Floor plan images |
| `floor_plan_markers` | Markers pinned to floor plans |
| `workflow_stations` | Workflow station definitions |
| `project_station_status` | Project progress through stations |
| `project_logs` | Audit log of project changes |

### IT/Error Tracking Tables
| Table | Purpose |
|-------|---------|
| `system_errors` | Captures JavaScript errors from the application |
| `error_tickets` | IT ticket system for tracking and resolving errors |
| `error_ticket_comments` | Comments on error tickets for collaboration |

### IT Admin Tables
| Table | Purpose |
|-------|---------|
| `announcements` | System-wide announcements from IT |
| `announcement_dismissals` | Tracks dismissed announcements per user |
| `feature_flags` | Runtime feature toggles managed by IT |
| `feature_flag_audit` | Audit log of feature flag changes |
| `user_sessions` | Tracks user login sessions for security monitoring |

### Plant Manager (PGM) Tables
| Table | Purpose |
|-------|---------|
| `modules` | Individual building modules within projects |
| `station_templates` | 12 production line stages with QC checklists |
| `station_assignments` | Module-to-station tracking with crew |
| `workers` | Factory floor workforce (separate from users) |
| `worker_shifts` | Clock in/out with pay calculations |
| `qc_records` | Quality control inspection records |
| `inspection_rules` | Configurable inspection requirements |
| `long_lead_items` | Long-lead material tracking |
| `plant_config` | Per-plant settings |
| `calendar_audit` | Schedule change audit trail |
| `takt_events` | Takt time tracking |
| `kaizen_suggestions` | Improvement suggestions |
| `cross_training` | Worker station certifications |
| `safety_checks` | Daily safety checks |
| `five_s_audits` | 5S audit records |

---

## Supported Factories

| Code | Name |
|------|------|
| NWBS | Northwest Building Systems |
| WM-EAST | Whitley Manufacturing East |
| WM-WEST | Whitley Manufacturing West |
| MM | Mobile Modular |
| SSI | Sunbelt Structures Inc |
| MS | ModSpace |
| MG | Modular Genius |
| SEMO | Southeast Modular |
| PMI | Palomar Modular |
| AMTEX | AmTex Modular |
| BRIT | Britco |
| CB | C&B Modular |
| IND | Indicom |
| MRS | Mr. Steel |

---

## Known Limitations

1. **No real-time updates** - Changes require page refresh to see updates from other users
2. **No notification system** - No push notifications or email alerts yet
3. **Limited mobile optimization** - Best experienced on desktop/tablet
4. **No offline support** - Requires internet connection
5. **Single file upload** - Can only upload one file at a time
6. **Factory Map unavailable** - Under reconstruction as standalone app (see roadmap)

---

## Performance Notes

- **Build size (January 16, 2026):**
  - Total: ~2.5MB (optimized from 3.8MB - 34% reduction)
  - Vendor chunks split: react (141KB), date-fns (77KB), supabase (68KB), lucide-react (294KB), xyflow (230KB), exceljs (536KB)
  - Main chunk: ~620KB
- **Code Splitting:** Vite manualChunks configuration for lazy loading
- **Initial load:** ~2-3 seconds
- Supabase queries optimized with proper indexes
- React state managed locally (no Redux/Zustand needed at current scale)
- **Memory Leak Prevention:** Custom hooks library (`src/hooks/`) for safe intervals, debounce, async effects, and event listeners

---

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

---

## Environment

- **Frontend**: Vite + React 18
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Hosting**: [To be configured]

---

## Upcoming Features & Roadmap

### Directory System (In Progress - January 14, 2026)

**Status:** Database Complete, UI In Progress

**Overview:** Company-wide contact directory for all Sunbelt employees across 15 factories, with integration into forms (RFIs, Tasks, Submittals) for contact selection.

**Data Source:** `docs/Sunbelt Directory Q3-2025 Updated 07-25-25.xlsx` (15 sheets, 311 contacts)

**Database Changes:**
- [x] Update `factories` table - Add address, phone, email_domain columns
- [x] Add WM-ROCHESTER factory (missing from current list)
- [x] Create `departments` lookup table (14 departments)
- [x] Create `directory_contacts` table (internal Sunbelt employees)
- [x] Create `external_contacts` table (customers, vendors, external stakeholders)
- [x] Create `project_external_contacts` junction table
- [x] Add contact fields to tasks, rfis, submittals tables

**Migration:** `supabase/migrations/20260114_directory_system.sql`
**Demo Data:** `supabase/demo/08_DIRECTORY_CONTACTS.sql` (311 contacts imported)

**Departments (14 total):**
| Department | Example Positions |
|------------|-------------------|
| Executive | CEO, CFO, CRO, VP's, President |
| Accounting | Controller, Accounting Manager, AP, Staff Accountant |
| HR | HR Manager, Payroll, Benefits |
| Marketing | Marketing Director, Coordinator |
| Sales | Sales Manager, Estimator, Business Development |
| Operations | VP Operations, Plant General Manager, Project Manager, Project Coordinator |
| Production | Production Manager, Supervisor, Foreman |
| Purchasing | Purchasing Manager, Purchasing Agent, Material Control |
| Engineering | Engineer, Director of Engineering |
| Drafting | Drafting Manager, Drafter, Designer |
| Quality | QA Manager, QC Inspector |
| Safety | Safety Coordinator, Safety Manager |
| IT | IT Manager, Programmer, Network Admin |
| Service | Service Manager, Service Technician, Warranty |

**UI Components:**
- [x] Directory sidebar page (full page in nav) - `src/components/pages/DirectoryPage.jsx`
- [x] Contact card layout with department colors
- [x] Search with type-ahead
- [x] Filter by factory, department
- [x] Grouped by factory with expand/collapse
- [ ] Recent contacts section (future)

**Form Integration:**
- [x] Contact picker component for RFIs/Tasks/Submittals (`ContactPicker.jsx`)
- [x] "Assigned To" field - single contact with FK + snapshot
- [x] Factory context filtering (default to project's factory)
- [x] Keyboard navigation support
- [ ] "Notify" field - multiple contacts (combines CC functionality)

**Contact Selection Schema Pattern:**
```sql
-- Example for tasks table
assigned_to_id UUID REFERENCES directory_contacts(id),
assigned_to_name VARCHAR(100),      -- Snapshot at assignment
assigned_to_email VARCHAR(255),     -- Snapshot at assignment
notify_contacts JSONB               -- Array of {id, name, email} snapshots
```

---

### Collapsible Sidebar (Complete)

**Status:** Complete (January 14, 2026)

**Overview:** Make sidebar collapsible across all dashboards to maximize screen real estate.

**Features:**
- [x] Collapse to icons only (like VS Code)
- [x] Remember state per user (localStorage)
- [x] Keyboard shortcut (Cmd/Ctrl + B)
- [x] Smooth animation transition

---

### External Contacts & Portal (Future)

**Status:** Planning

**Overview:** Separate system for external contacts (customers, architects, inspectors, vendors) with a sanitized external portal for project collaboration.

**External Contacts Table:**
- Company, contact name, email, phone
- Contact type (Customer, Architect, Inspector, Vendor, Other)
- Associated projects (many-to-many)
- Access level for portal

**External Portal (Procore-style):**
- Sanitized view of specific projects
- View RFIs, Submittals, Tasks assigned to them
- Respond to RFIs directly
- Upload submittal documents
- Limited project info (no financials, internal notes)
- Authentication separate from internal users

**Use Cases:**
- Customer can view project status and respond to RFIs
- Architect can review and approve submittals
- Inspector can view inspection-related tasks
- Dealer can track order status

---

### Notification System Foundation (Future)

**Status:** Planning

**Overview:** Foundation for email and in-app notifications triggered by contact assignments.

**Components:**
- [ ] Notification preferences table (per user)
- [ ] Notification queue table
- [ ] Email templates for RFI, Task, Submittal notifications
- [ ] In-app notification bell with unread count
- [ ] Real-time updates via Supabase subscriptions

**Triggers:**
- Assigned to a task/RFI/submittal
- Added to notify list
- RFI answered (notify requester)
- Submittal approved/rejected
- Due date approaching (24h, same day)

---

### Department-Based Smart Defaults (Complete)

**Status:** Complete (January 14, 2026)

**Overview:** Auto-suggest contacts and priority based on item type, content keywords, and department mappings.

**Implementation:**
- Created `src/utils/smartDefaults.js` - Core utility with all suggestion logic
- Integrated into AddRFIModal, AddSubmittalModal, and AddTaskModal

**Features:**
- **Smart Internal Owner Sorting** - Users sorted by relevance to item content
  - Analyzes title/subject/description text for keywords
  - Maps keywords to suggested departments (14 departments supported)
  - Users in suggested departments appear first with ★ indicator
  - "Smart sorted" indicator shows when suggestions are active
- **Priority Auto-Suggestion** - Button appears when keywords suggest different priority
  - Detects urgent/critical keywords → suggests "Critical" priority
  - Detects important/deadline keywords → suggests "High" priority
  - Detects fyi/not urgent keywords → suggests "Low" priority
  - One-click to accept suggestion

**Department Suggestion Mappings:**
| Item Type | Keywords | Suggested Departments |
|-----------|----------|----------------------|
| RFI | technical, structural, electrical | Engineering |
| RFI | drawing, blueprint, layout | Drafting, Engineering |
| RFI | material, procurement, vendor | Purchasing |
| RFI | quality, inspection, spec | Quality, Engineering |
| Submittal | engineering, structural | Engineering |
| Submittal | drawing, shop drawing | Drafting |
| Submittal | material, product data | Purchasing, Quality |
| Task | production, manufacturing | Production, Operations |
| Task | qc, quality, inspection | Quality |
| Task | drafting, cad | Drafting |

**Priority Suggestion Keywords:**
| Priority | Keywords |
|----------|----------|
| Critical | urgent, asap, emergency, critical, immediately, blocking |
| High | important, priority, deadline, time-sensitive, expedite |
| Low | fyi, when possible, not urgent, low priority, informational |

**Files Created:**
- `src/utils/smartDefaults.js` - Core suggestion functions

**Files Modified:**
- `src/components/projects/AddRFIModal.jsx` - Smart sorting + priority suggestion
- `src/components/projects/AddSubmittalModal.jsx` - Smart sorting + priority suggestion
- `src/components/projects/AddTaskModal.jsx` - Smart sorting + priority suggestion

---

### IT Settings Page (Complete)

**Status:** Complete (January 14, 2026)

**Overview:** Comprehensive system configuration page for IT administrators, accessible from sidebar navigation. Uses `SystemConfiguration` component with 9 configuration sections.

**Implemented Settings Categories:**
- **Email Settings** - Warning emails, daily digest, SMTP configuration
- **Notifications** - Browser notifications, task/RFI/submittal/workflow alerts
- **Feature Toggles** - Dark mode, auto-save, compact view, animations, debug mode, maintenance mode
- **Performance** - Caching, pagination, lazy loading, file size limits
- **Cache Management** - Clear application cache
- **Environment** - System info, Supabase URL, build version, timezone
- **System Status** - Database, Auth, Storage, Realtime connectivity status
- **Security Settings** - Session timeout, password rules, 2FA, lockout policies
- **Project Defaults** - Phase count, archive settings, delivery warning thresholds
- **Calendar & Scheduling** - Work hours, meeting duration, weekend settings
- **RFI & Submittal Settings** - Due day defaults, approval requirements, escalation
- **Factory Settings** - Default factory, assignment requirements, color coding

**Implementation:**
- [x] SystemConfiguration component with all settings sections
- [x] Settings persisted to localStorage
- [x] Save/Reset functionality
- [x] "Settings" nav item in IT sidebar
- [x] Settings form with validation (min/max values)
- [ ] Create `system_settings` database table (future - for server-side persistence)
- [ ] Settings change audit logging (future)

---

### Executive Reports Enhancement (Complete)

**Status:** Complete (January 14, 2026)

**Overview:** Upgraded executive reports with new report types, date filtering, and professional PDF export with branding.

**Current Reports:**
- Portfolio Summary
- Project Status Overview
- Factory Performance
- Financial Summary

**New Report Ideas:**
- **Delivery Pipeline Report** - Projects by promised delivery date (30/60/90 day windows)
- **PM Workload Report** - Project distribution, task counts, overdue items per PM
- **Factory Capacity Report** - Projects per factory with timeline, capacity utilization
- **Client Revenue Report** - Revenue by client/dealer with trends
- **RFI/Submittal Aging Report** - Open items by age, response time metrics
- **Risk Assessment Report** - At-risk and critical projects with reasons
- **Weekly Progress Report** - Tasks completed, RFIs answered, submittals approved
- **Building Type Analysis** - Revenue and project count by building type

**PDF Export Enhancement:**
- [ ] Professional PDF generator library (react-pdf or pdfmake)
- [ ] Sunbelt corporate branding (logo, colors, fonts)
- [ ] Factory-specific logos where applicable
- [ ] Cover page with report title, date range, generated by
- [ ] Table of contents for multi-section reports
- [ ] Page headers/footers with page numbers
- [ ] Charts and graphs embedded in PDF
- [ ] Configurable sections (include/exclude)
- [ ] Print-optimized styling

**UI Improvements:**
- [ ] Report builder interface (select metrics, date range, filters)
- [ ] Preview before export
- [ ] Scheduled report generation (email)
- [ ] Report templates (save configurations)

---

---

## Demo Data Strategy (January 15, 2026)

### Overview

This section documents the comprehensive demo data plan that ties together all system features: PM workflows, PC workflows, Plant GM production, and Sales pipelines. All dates are **dynamic** (relative to `CURRENT_DATE`), making the demo data evergreen.

**Master Demo File:** `supabase/demo/MASTER_DEMO_DATA_V2.sql`

---

### User Accounts

**Principle:** Do NOT delete existing users. Add new users and update existing ones as needed.

| User | Email | Role | Factory | UID | Notes |
|------|-------|------|---------|-----|-------|
| Matt Jordan | matt.jordan@nwbsinc.com | PM | NWBS | (existing) | 4 complex PM projects |
| Candy Echols | candy.echols@sunbeltmodular.com | Director | All | (existing) | 2 personal + oversight |
| Crystal Trevino | crystal.trevino@sunbeltmodular.com | PM | SSI/SMM | (existing) | Factory-clustered projects |
| Ross Parks | ross.parks@nwbsinc.com | Plant_GM | NWBS | fcd8501a-fdbb-43d1-83c2-fcf049bb0c90 | Production line oversight |
| Dawn Hinkle | dawn.hinkle@nwbsinc.com | PC | NWBS | 679a1d92-7ea6-4797-a4c9-d13d156c215f | 10-12 stock/fleet projects |
| Justin Downing | justin.downing@nwbsinc.com | Production_Manager | NWBS | bbed0851-f894-401a-9312-0ada815c7785 | Factory floor manager |
| Devin Duvak | devin.duvak@sunbeltmodular.com | VP | All | (existing) | Executive oversight |
| Mitch Quintana | mitch.quintana@nwbsinc.com | Sales_Manager | NWBS | (existing) | 10 quotes |
| Robert Thaler | robert.thaler@nwbsinc.com | Sales_Rep | NWBS | (existing) | 10 quotes |
| Juanita Earnest | juanita.earnest@palomar.com | PC | PMI | (existing) | PMI plant controller |
| IT Admin | admin@sunbeltmodular.com | IT | All | (existing) | System admin |
| Support | support@sunbeltmodular.com | IT_Manager | All | (existing) | IT manager |

---

### Project Assignments Strategy

**Factory Clustering:** PMs have projects clustered by factories for realistic workload distribution.

| PM | Primary Factories | Project Count | Project Types |
|----|-------------------|---------------|---------------|
| Matt Jordan | NWBS, Whitley | 4-6 | CUSTOM, GOVERNMENT (complex) |
| Crystal Trevino | SSI, SMM | 4-6 | Mixed |
| Candy Echols (Director) | All | 2 personal | Oversight + personal projects |

**PC Projects (NEW - Dawn Hinkle at NWBS):**

| PC | Factory | Project Count | Project Types | Notes |
|----|---------|---------------|---------------|-------|
| Dawn Hinkle | NWBS | 10-12 | STOCK, CUSTOM (simple) | High volume, minimal PM attention |

**PC Role Definition:**
- "Mini project manager" for high-volume stock/fleet projects
- Tracks: Long lead items, color selections, engineering approvals (if new design), third-party/state approvals
- Rarely has RFIs (simple/repeat builds)
- Does NOT require PM involvement
- Reports to Plant GM on production scheduling
- Higher project count than PMs, simpler projects

---

### Project Types (Standardized)

| Type | Description | Typical PM Involvement | RFI Frequency |
|------|-------------|------------------------|---------------|
| STOCK | Fleet/stock builds, repeat designs | PC handles (minimal PM) | Rare |
| CUSTOM | Custom designed buildings | PM required | Moderate |
| GOVERNMENT | State/federal contracts, compliance heavy | PM required | High |

**Note:** "FLEET" is merged into "STOCK" for simplification.

---

### Workflow System

**Workflow Phases (4 phases, ~20 stations):**

| Phase | Name | Description |
|-------|------|-------------|
| 1 | Initiation | Contract setup, initial coordination |
| 2 | Dealer Sign-Offs | Customer/dealer approvals |
| 3 | Internal Approvals | Engineering, production prep |
| 4 | Delivery | Transportation, site work, installation |

**Site Survey Station:** REMOVED from Phase 1 (dealers handle site work, not Sunbelt)

---

### Production Line Workflow (Plant GM View)

**12 Production Stations (realistic flow):**

| Order | Station Name | Lead Type | Notes |
|-------|--------------|-----------|-------|
| 1 | Frame | Frame Lead | Metal frame welding |
| 2 | Floor/Deck | Frame Lead | Floor deck assembly |
| 3 | Walls | Framing Lead | Wall framing |
| 4 | Insulation | Insulation Lead | Thermal insulation |
| 5 | Roof | Roof Lead | Roof assembly |
| 6 | Sheathing | Exterior Lead | Exterior sheathing |
| 7 | Siding | Exterior Lead | Siding installation |
| 8 | Paint | Paint Lead | Interior/exterior paint |
| 9 | Rough-in (E/P/HVAC) | MEP Lead | Electrical, plumbing, HVAC |
| 10 | Wall Coverings | Finish Lead | Drywall, panels |
| 11 | Finish | Finish Lead | Trim, fixtures, final touches |
| 12 | Inspections/Staging | QC Lead | Final QC, dealer pickup |

**Lead Coverage:** One lead can manage multiple stations (e.g., Frame Lead covers Frame + Floor/Deck)

---

### Production Prerequisites

**Before a module enters production line, the following must be complete:**

| Prerequisite | Description | Responsible |
|--------------|-------------|-------------|
| 100% Drawings | All drawings approved and released | Engineering/Drafting |
| Long Lead Items | All long-lead materials ordered/received | Purchasing |
| Color Selections | Customer color choices confirmed | PC/PM |
| Cutsheet Submittals | All cutsheet submittals approved | PM |
| Engineering Review | Engineering sign-off complete | Engineering |

---

### Workers & Crew (NWBS Factory)

**Worker Count:** 50-70 workers per factory

**Worker Distribution:**
- 8 Station Leads (covering 12 stations)
- 50-60 Crew members (General workers)
- Mix of male/female (realistic ratio for manufacturing)
- Realistic fictional names

**Lead Assignments:**

| Lead Name | Stations Covered | Badge |
|-----------|------------------|-------|
| Lead 1 | Frame, Floor/Deck | Frame Lead |
| Lead 2 | Walls | Framing Lead |
| Lead 3 | Insulation | Insulation Lead |
| Lead 4 | Roof | Roof Lead |
| Lead 5 | Sheathing, Siding | Exterior Lead |
| Lead 6 | Paint | Paint Lead |
| Lead 7 | Rough-in | MEP Lead |
| Lead 8 | Wall Coverings, Finish, Inspections | Finish/QC Lead |

---

### Module Distribution (NWBS Factory)

**Target:** 55-70 modules for Ross Parks (Plant_GM) to see across production line

| Source | Project Count | Module Count | Project Type |
|--------|---------------|--------------|--------------|
| Matthew (PM) | 4 | 25-30 | CUSTOM, GOVERNMENT |
| Dawn (PC) | 10-12 | 30-40 | STOCK, simple CUSTOM |
| **Total** | 14-16 | 55-70 | Mixed |

**Module Complexity:**
- PM projects: More modules per project (5-8 modules for complex government/custom)
- PC projects: Fewer modules per project (2-4 modules for stock/fleet)

---

### Sales Quotes (NWBS Factory)

**Total Quotes:** 20 quotes at NWBS

| Sales Rep | Quote Count | Status Mix |
|-----------|-------------|------------|
| Mitch Quintana (Manager) | 10 | 6 active, 2 won, 2 lost |
| Robert Thaler (Rep) | 10 | 7 active, 2 won, 1 lost |

**Quote Requirements:**
- Minimum contract value: $600K
- Realistic Pacific Northwest customers (Boise School District, Idaho State University, etc.)
- Some quotes flagged for PM attention
- Won quotes link to Matthew's NWBS projects via `converted_to_project_id`

**Customer Examples:**
- Boise School District
- Idaho State University
- Boeing Everett
- Amazon Web Services
- Microsoft Campus
- Port of Seattle
- Washington State DOT
- Oregon Health Sciences

---

### Tasks, RFIs, and Submittals

**Per-Project Targets:**

| Item Type | PM Projects | PC Projects | Notes |
|-----------|-------------|-------------|-------|
| Tasks | 5-15 | 3-8 | Match project stage logic |
| RFIs | 2-5 | 0-2 | PC projects rarely have RFIs |
| Submittals | 3-8 | 2-4 | Standard types |

**Date Distribution:**
- Some items overdue (create urgency)
- Some due today
- Some due this week
- Some due in next 2 weeks
- Some future (30-60 days out)

---

### Date Strategy (Dynamic)

**All dates calculated relative to `CURRENT_DATE`:**

| Date Range | Usage |
|------------|-------|
| -9 months | Project creation dates (oldest projects) |
| -6 months | Mid-range project starts |
| -3 months | Recent project starts |
| -2 weeks to -1 day | Overdue items |
| Today | Items due today |
| +1 to +7 days | Due this week |
| +7 to +14 days | Due next week |
| +14 to +30 days | Due this month |
| +30 to +90 days | Future deliveries |
| +90 to +180 days | Long-term deliveries |

---

### PC Dashboard Requirements

**When PC Dashboard is created, it must automatically pull:**

1. Projects where user is `owner_id` with PC role filtering
2. Long lead items for their projects
3. Color selection approvals pending
4. Engineering review status
5. Third-party/state approval tracking
6. Production scheduling coordination with Plant GM
7. Simplified task/RFI views (lower volume than PM)

**Key Difference from PM Dashboard:**
- Higher project count display (10-15 vs 4-6)
- Less RFI focus
- More approval tracking focus
- Production schedule integration

---

### Implementation Order

1. **Create users** - Ross Parks (Plant_GM), Dawn Hinkle (PC), Justin Downing (Production_Manager)
2. **Create workers** - 60 workers at NWBS with 8 leads
3. **Create PC projects** - Dawn's 10-12 STOCK projects at NWBS
4. **Create modules** - 55-70 modules across production line
5. **Create sales quotes** - 20 quotes for Mitch/Robert
6. **Create tasks/RFIs/submittals** - Per-project items with realistic dates
7. **Link data** - Won quotes → projects, modules → stations, workers → stations

---

### RFI/Submittal/Task Export Polish (Planned)

**Status:** Planning

**Overview:** Enhance Excel and PDF exports for RFI logs, Submittal logs, and Task logs with professional branding and polish.

**Excel Export Improvements:**
- [ ] Professional header row with Sunbelt branding
- [ ] Factory logo in header (where applicable)
- [ ] Column auto-width for readability
- [ ] Alternating row colors
- [ ] Frozen header row
- [ ] Data validation and formatting
- [ ] Sheet name based on project/date
- [ ] Summary row at bottom (counts, totals)

**PDF Export Additions:**
- [ ] Add PDF export button alongside Excel export
- [ ] Professional cover page with:
  - Sunbelt Modular logo
  - Factory logo (if applicable)
  - Report title (e.g., "RFI Log - Project Name")
  - Generated date and by whom
- [ ] Table formatting with:
  - Column headers with background color
  - Alternating row shading
  - Status color coding
  - Clean borders
- [ ] Page footer with page numbers
- [ ] Portrait/landscape toggle based on column count

**Files to Update:**
- `src/components/rfis/EditRFIModal.jsx` - PDF export button
- `src/components/submittals/EditSubmittalModal.jsx` - PDF export button
- `src/components/tasks/EditTaskModal.jsx` - PDF export button
- `src/utils/pdfUtils.js` - Export utilities
- `src/utils/excelUtils.js` - Excel styling utilities (new)

---
