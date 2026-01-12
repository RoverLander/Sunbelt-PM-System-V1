# Project Status

**Last Updated:** January 12, 2026
**Version:** 1.0.0
**Status:** Production Ready (Beta) + Factory Map In Development

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
- [x] **Director Dashboard** - Factory oversight
  - Factory-specific metrics
  - PM workload distribution
  - Project status breakdown
- [x] **PM Dashboard** - Project manager view
  - Personal task list
  - Project assignments
  - Upcoming deadlines
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

### January 12, 2026
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
