# Project Status

**Last Updated:** January 14, 2026
**Version:** 1.1.0
**Status:** Production Ready (Beta) + Praxis Integration In Progress

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

- Build size: ~1.5MB (uncompressed), ~375KB (gzip)
- Initial load: ~2-3 seconds
- Supabase queries optimized with proper indexes
- React state managed locally (no Redux/Zustand needed at current scale)

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
- [ ] Contact picker component for RFIs/Tasks/Submittals
- [ ] "Assigned To" field - single contact with FK + snapshot
- [ ] "Notify" field - multiple contacts (combines CC functionality)
- [ ] Factory context filtering (default to project's factory)
- [ ] Keyboard navigation support

**Contact Selection Schema Pattern:**
```sql
-- Example for tasks table
assigned_to_id UUID REFERENCES directory_contacts(id),
assigned_to_name VARCHAR(100),      -- Snapshot at assignment
assigned_to_email VARCHAR(255),     -- Snapshot at assignment
notify_contacts JSONB               -- Array of {id, name, email} snapshots
```

---

### Collapsible Sidebar (Planned)

**Status:** Planned

**Overview:** Make sidebar collapsible across all dashboards to maximize screen real estate.

**Features:**
- [ ] Collapse to icons only (like VS Code)
- [ ] Remember state per user (localStorage)
- [ ] Keyboard shortcut (Cmd/Ctrl + B)
- [ ] Smooth animation transition

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

### Department-Based Smart Defaults (Future)

**Status:** Planning

**Overview:** Auto-suggest contacts based on item type and department.

**Smart Suggestions:**
| Item Type | Suggested Departments |
|-----------|----------------------|
| RFI (Technical) | Engineering, Drafting |
| RFI (Drawing) | Drafting |
| RFI (Material) | Purchasing |
| Submittal | Engineering, QA |
| Task (Production) | Production, Operations |
| Task (QC) | Quality, Safety |

---

### IT Settings Page (Planned)

**Status:** Planning

**Overview:** Dedicated settings page for IT Manager role, accessible from sidebar navigation. Consolidates all system configuration options.

**Settings Categories to Consider:**
- **Authentication & Security**
  - Session timeout duration
  - Password requirements
  - Two-factor authentication toggle
  - Account lockout thresholds

- **System Defaults**
  - Default dashboard per role
  - Default factory assignments
  - Auto-assign rules for new projects

- **Notifications**
  - Email server configuration
  - Notification templates
  - Email frequency limits
  - Quiet hours settings

- **Data Management**
  - Data retention policies
  - Archive settings
  - Backup schedules

- **UI/UX Settings**
  - Default theme (light/dark)
  - Date/time format
  - Currency format
  - Items per page defaults

- **Integration Settings**
  - Praxis import configuration
  - API rate limits
  - Webhook endpoints

- **Feature Toggles** (link to Feature Flags page)

**Implementation:**
- [ ] Create `system_settings` table
- [ ] Create SettingsPage component (`src/components/it/SettingsPage.jsx`)
- [ ] Add "Settings" nav item for IT_Manager role
- [ ] Settings form with validation
- [ ] Settings change audit logging

---

### Executive Reports Enhancement (Planned)

**Status:** Planning

**Overview:** Upgrade executive reports with new report types, improved visualizations, and professional PDF export with branding.

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
