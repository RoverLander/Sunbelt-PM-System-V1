# Sunbelt PM - Project Status
## Last Updated: January 9, 2026 (Evening Session)

---

## 📋 Project Overview

**Sunbelt PM** is a comprehensive construction project management system built for Sunbelt Modular. It provides role-based dashboards and tools for Project Managers, Directors, VPs, IT Personnel, Project Coordinators, and Plant Managers to manage modular construction projects from planning through delivery.

### Tech Stack
- **Frontend:** React 18 + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** CSS Variables with Dark/Light themes
- **Icons:** Lucide React

---

## ✅ Completed Features

### Authentication & Users
- [x] Supabase authentication
- [x] User roles (PM, Director, Admin, VP, IT)
- [x] Role-based access control
- [x] User profile display in sidebar
- [x] Logout functionality
- [x] Role-based dashboard defaults
- [x] Role-based dashboard access restrictions
- [x] IT role with dedicated dashboard

### Multi-Role Dashboard System
- [x] **PM Dashboard** - Personal projects, tasks, calendar preview, Gantt timeline
- [x] **Director Dashboard** - Portfolio health, risk metrics, team oversight
- [x] **VP Dashboard** - Executive KPIs, financials, client overview
- [x] **IT Dashboard** - User management, system health, audit log
- [x] View switcher for users with elevated permissions
- [x] Role auto-detection on login
- [x] Persistent view preference (localStorage)
- [x] Director restricted from VP dashboard access
- [x] IT users default to IT dashboard
- [x] Sidebar stats load correctly for all dashboard types ✅ FIXED Jan 8

### IT Dashboard Features
- [x] User Management (CRUD operations)
- [x] System Health monitoring
- [x] Audit Log viewer
- [x] Database statistics
- [x] Quick actions panel
- [x] Sidebar stats (Users, Projects, Active Users)

### Project Management
- [x] Project list with grid view
- [x] Project details page with tabbed interface
- [x] Create new projects
- [x] Edit project information
- [x] Project status tracking (Planning → Completed)
- [x] Primary PM assignment
- [x] Factory assignment
- [x] Key dates (Online, Offline, Delivery)
- [x] Contract value tracking
- [x] Client and dealer information
- [x] Project color coding

### Task Management
- [x] Task list within projects
- [x] Standalone Tasks page with filters
- [x] Create/Edit/Delete tasks
- [x] Task status (Not Started, In Progress, Blocked, Completed, Cancelled)
- [x] Priority levels (Low, Normal, Medium, High, Critical)
- [x] Due dates with overdue indicators
- [x] Internal vs External assignment
- [x] Task Kanban board view (in projects)
- [x] Drag-and-drop status updates
- [x] Deep navigation (click task → go to project)

### RFI Management
- [x] RFI list within projects
- [x] Standalone RFIs page with filters
- [x] Create/Edit/Delete RFIs
- [x] Auto-incrementing RFI numbers
- [x] RFI status tracking (Draft, Open, Answered, Closed)
- [x] Due dates with overdue indicators (mandatory)
- [x] Internal vs External recipients
- [x] Question and Answer fields
- [x] Spec section and drawing references

### Submittal Management
- [x] Submittal list within projects
- [x] Standalone Submittals page with filters
- [x] Create/Edit/Delete submittals
- [x] Auto-incrementing submittal numbers
- [x] Submittal types (Shop Drawings, Product Data, Samples, etc.)
- [x] Status workflow (Pending → Approved/Rejected)
- [x] Due dates with overdue indicators
- [x] Internal vs External tracking

### Calendar & Scheduling
- [x] Month view calendar
- [x] Week view calendar
- [x] Day view calendar
- [x] Color-coded event types
- [x] Project filtering
- [x] Click to view/edit items
- [x] Multiple item types (tasks, RFIs, submittals, milestones, deliveries)
- [x] **Fixed-width calendar cells** ✅ NEW Jan 9
- [x] **ICS Export button on calendar views** ✅ NEW Jan 9
- [x] **Project-specific calendar (month view)** ✅ NEW Jan 9
- [x] **Project overview week calendar** ✅ NEW Jan 9

### Export Functionality
- [x] ICS export for calendar items
- [x] ICS export for all project items
- [x] CSV export for RFI log
- [x] CSV export for Submittal log

### Email Integration
- [x] Draft task assignment emails (mailto:)
- [x] Draft RFI emails
- [x] Draft submittal transmittal emails
- [x] Pre-populated subject and body
- [x] "Create & Email" combined action
- [x] Follow-up reminder templates
- [x] Professional construction industry formatting

### Team Management (Director/VP)
- [x] Team workload page
- [x] Capacity indicators per PM
- [x] Project counts per team member
- [x] Overdue item tracking
- [x] Visual capacity bars
- [x] Sort by projects/tasks/overdue/capacity

### Analytics (VP)
- [x] Task completion rate
- [x] Average project duration
- [x] Status distribution charts
- [x] Value by status breakdown
- [x] Monthly project trends (12 months)
- [x] PM performance table

### Client Management (VP)
- [x] Client account list
- [x] Expandable project history
- [x] Client value tracking
- [x] Search and sort
- [x] Top client identification

### UI/UX Features
- [x] Dark mode (default)
- [x] Light mode
- [x] Theme toggle in sidebar
- [x] Theme persistence
- [x] Toast notifications
- [x] Loading spinners
- [x] Empty state messages
- [x] Hover effects and transitions
- [x] Responsive layouts
- [x] Modal patterns
- [x] Form validation
- [x] Error handling
- [x] Styled modal buttons (Cancel gray, Email blue, Primary orange)

---

## 🔧 Fixed Today (Jan 9, 2026 - Evening Session)

### Calendar Fixed-Width Cells ✅
- **Issue:** Calendar cells changed width based on content, causing layout shifts
- **Fix:** Added `minWidth` and consistent cell sizing across all calendar views
- **Files:** `CalendarWeekView.jsx`, `ProjectCalendarMonth.jsx`, `ProjectCalendarWeek.jsx`

### Calendar Export Button ✅
- **Issue:** No way to export calendar items from the calendar views
- **Fix:** Added "Export Week" / "Export Month" ICS download buttons
- **Files:** All calendar view components

### Project Details Calendar Tab ✅
- **Issue:** Duplicate Calendar tab, Calendar tab showed placeholder
- **Fix:** Removed duplicate, Calendar tab now shows ProjectCalendarMonth component
- **File:** `ProjectDetails.jsx`

### Project Overview Week Calendar ✅
- **Issue:** No quick calendar view on project overview
- **Fix:** Added ProjectCalendarWeek component to Overview tab (like PMDashboard)
- **File:** `ProjectDetails.jsx`

### Sidebar Navigation Per Role ✅
- **Issue:** Wrong/missing pages for Director, VP, IT dashboards
- **Cause:** `renderNavItems()` only had special handling for VP
- **Fix:** Each dashboard type now has correct nav order with role-specific pages first
- **File:** `Sidebar.jsx`

### Sidebar Nav Order ✅
- **New Order:**
  - PM: Dashboard → Projects, Tasks, RFIs, Submittals, Calendar
  - Director: Dashboard → Team, Reports → Projects, Tasks, RFIs, Submittals, Calendar
  - VP: Dashboard → Analytics, Clients, Team, Reports → Projects, Tasks, RFIs, Submittals, Calendar
  - IT: Dashboard → User Management → Projects, Tasks, RFIs, Submittals, Calendar

### Sidebar Stats Too Large ✅
- **Issue:** Stats took too much vertical space, nav items required scrolling on 1080p
- **Fix:** Compact inline stats, reduced padding/font sizes
- **File:** `Sidebar.jsx`

### Sidebar Width ✅
- **Change:** Reduced from 280px to 260px for more content space
- **Files:** `Sidebar.jsx`, `App.jsx`

### VP Reports Route ✅
- **Issue:** VP clicking "Reports" in nav did nothing
- **Fix:** Added `case 'reports'` to VP switch in `renderContent()`
- **File:** `App.jsx`

### IT Users Route ✅
- **Issue:** IT clicking "User Management" in nav did nothing
- **Fix:** Added `case 'users'` to IT switch in `renderContent()`
- **File:** `App.jsx`

---

## 🛠 Known Bugs (Remaining)

### Critical Bugs (Demo Blockers)
- [ ] **#7** Secondary PM field missing in Edit Project modal
- [ ] **#13** Status squares on Projects page showing wrong counts

### UI Polish Needed
- [ ] **#5** Tasks page needs Kanban board + list view toggle
- [ ] **#6** RFI/Submittals pages should be wider
- [ ] **#12** Projects page should be wider, default filter to "My Projects"
- [ ] **#9** Ensure email buttons on all create/edit modals

---

## 🗄️ Database Schema

### Current Tables (26 Total)

| Table | Description | RLS |
|-------|-------------|-----|
| `users` | User accounts and roles | ✅ |
| `projects` | Project information (52 columns) | ✅ |
| `tasks` | Task items | ✅ |
| `rfis` | Requests for Information | ✅ |
| `submittals` | Submittal packages | ✅ |
| `milestones` | Project milestones | ✅ |
| `change_orders` | Change order tracking | ✅ |
| `project_team` | Many-to-many project assignments | ✅ |
| `factories` | Factory reference data | ✅ |
| `factory_contacts` | Factory personnel directory | ✅ |
| `floor_plans` | Uploaded floor plans | ✅ |
| `floor_plan_pages` | Multi-page PDF pages | ✅ |
| `floor_plan_markers` | Markers linking items to floor plans | ✅ |
| `files` | Full file management with versioning | ✅ |
| `file_attachments` | Simpler attachment system | ✅ |
| `attachments` | Legacy attachments (deprecated) | ✅ |
| `comments` | Polymorphic comments | ✅ |
| `notifications` | User notifications | ✅ |
| `activity_log` | User activity tracking | ✅ |
| `audit_log` | IT audit trail | ✅ |
| `error_log` | Frontend/backend errors | ✅ |
| `system_settings` | Key-value configuration | ✅ |
| `feature_flags` | Feature toggles | ✅ |
| `user_sessions` | Active session tracking | ✅ |
| `all_contacts` | View combining users + factory_contacts | - |

---

## 👥 User Roles

| Role | Dashboard | Description |
|------|-----------|-------------|
| PM | PM Dashboard | Manage assigned projects |
| Director | Director Dashboard | Portfolio oversight, team management |
| VP | VP Dashboard | Executive view, analytics, clients |
| IT | IT Dashboard | System administration, user management |
| Admin | All Dashboards | Full system access |

### Dashboard Access Matrix

| Role | PM | Director | VP | IT |
|------|:--:|:--------:|:--:|:--:|
| PM | ✅ | ❌ | ❌ | ❌ |
| Director | ✅ | ✅ | ❌ | ❌ |
| VP | ✅ | ✅ | ✅ | ❌ |
| IT | ✅ | ✅ | ❌ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |

---

## 📁 Files Modified Today (Jan 9)

| File | Changes |
|------|---------|
| `Sidebar.jsx` | Compact stats, role-specific nav order, 260px width |
| `App.jsx` | VP reports route, IT users route, 260px margin |
| `ProjectDetails.jsx` | Fixed Calendar tab, added week view to Overview |
| `ProjectCalendarMonth.jsx` | NEW - Month calendar for project details |
| `ProjectCalendarWeek.jsx` | NEW - Week calendar for project overview |
| `CalendarWeekView.jsx` | Fixed-width cells, export button |

---

## 🧪 Test Accounts

| Name | Role | Dashboard Default |
|------|------|-------------------|
| Matthew McDaniel | Admin | Director |
| Candy Schrader | Director | Director |
| Devin Duvak | VP | VP |
| Joy (IT User) | IT | IT |

---

## 📝 Notes

- IT Dashboard fully functional with User Management, System Health, Audit Log
- Sidebar stats now load reliably for all dashboard types
- ProjectsPage filters work correctly for PM and Factory dropdowns
- On-time delivery rate defaults to 100% (needs `actual_completion_date` column to calculate properly)
- Calendar views now have consistent cell widths and export buttons
- Project details has working Calendar tab and week view on Overview

---

## 🚀 In Progress (Claude Code)

### Login Screen Enhancement
- [ ] Center login form on screen
- [ ] Sunbelt logo large and centered
- [ ] Factory logo ring (15 factories) slowly rotating around Sunbelt logo
- [ ] Random animation on login: "Convergence" (50%) or "Launch" (50%)
- [ ] Convergence: Logos spiral inward, merge at center with flash
- [ ] Launch: Logos streak outward, Sunbelt zooms toward camera
- [ ] Smooth transitions (~1.2s total animation)

**Assets needed:** Factory PNG logos (to be provided)
