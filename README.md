# Sunbelt PM System

A comprehensive Project Management System built for Sunbelt Modular and its subsidiary factories. This web application provides end-to-end project tracking, workflow management, and collaboration tools for modular construction projects.

## Features

### Project Management
- **Project Dashboard** - Overview of all projects with status, progress, and key metrics
- **Project Details** - Comprehensive project information including client, factory, dates, and contract values
- **Workflow Tracker** - Visual 6-phase workflow system tracking project lifecycle from Pre-Production to Closeout

### Task Management
- **Task Tracking** - Create, assign, and track tasks with priorities, due dates, and status
- **Kanban Board** - Drag-and-drop task management in board view
- **My Tasks / All Tasks** - Toggle between personal tasks and all project tasks
- **Internal & External Assignment** - Assign tasks to team members or external contacts

### RFI Management
- **RFI Log** - Track Requests for Information with full audit trail
- **Status Workflow** - Draft → Open → Pending → Answered → Closed
- **Excel Export** - Professional RFI log export with summary statistics

### Submittal Management
- **Submittal Tracking** - Manage shop drawings, product data, samples, and other submittals
- **Revision Control** - Track revision numbers and resubmissions
- **Excel Export** - Professional submittal log export with type breakdown

### Floor Plan System
- **Floor Plan Viewer** - Full-screen viewer with zoom and pan controls
- **Marker System** - Pin RFIs, Submittals, and Tasks to specific locations
- **PDF to PNG Conversion** - Automatic conversion for marker support

### Calendar & Scheduling
- **Project Calendar** - Month view of all project deadlines and milestones
- **Milestone Tracking** - Key project milestones with progress indicators

### File Management
- **Document Storage** - Upload and organize project files
- **File Attachments** - Attach files to tasks, RFIs, and submittals

### Role-Based Access
- **VP Dashboard** - Executive overview across all factories
- **Director Dashboard** - Factory-level metrics and oversight
- **PM Dashboard** - Project manager workload and tasks
- **PC Dashboard** - Project Coordinator factory-specific view (filtered to assigned factory)
- **Plant Manager** - Factory-specific view (filtered to assigned factory)

### Factory Map (In Development)
- **Interactive USA Map** - Visual overview of all factory locations
- **Factory Sprites** - Studio Ghibli-style factory buildings
- **Real-time Stats** - Project counts and status by factory
- **Zoom/Pan Controls** - Navigate the map with mouse wheel and drag

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: CSS Variables with custom design system
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: Supabase Storage for file uploads
- **Authentication**: Supabase Auth
- **Graphics**: PixiJS 8 for Factory Map rendering
- **Excel Export**: SheetJS (xlsx)
- **PDF Processing**: PDF.js
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/Sunbelt-PM-System-V1.git
cd Sunbelt-PM-System-V1
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Run database migrations (in Supabase SQL Editor):
- Run migrations in order from `supabase/migrations/`
- The `20260113_critical_fixes.sql` contains comprehensive RLS policies and creates all required tables

5. Start the development server:
```bash
npm run dev
```

### Demo Data

To populate with demo data for testing:
1. Navigate to `supabase/demo/`
2. Run SQL files in order (01 through 04)

## Project Structure

```
src/
├── components/
│   ├── auth/          # Login, authentication components
│   ├── calendar/      # Calendar views
│   ├── common/        # Shared UI components
│   ├── dashboards/    # Role-specific dashboards
│   ├── factoryMap/    # Interactive factory map (PixiJS)
│   │   ├── sprites/   # Factory sprite components
│   │   ├── systems/   # Viewport, rendering systems
│   │   └── layers/    # Map layers (USA, factories)
│   ├── floorplans/    # Floor plan viewer and markers
│   ├── it/            # IT admin tools (user management, feature flags)
│   ├── pages/         # Top-level pages
│   ├── projects/      # Project details, modals, forms
│   └── workflow/      # Workflow tracker components
├── context/           # React context providers
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
│   ├── emailUtils.js  # Email draft generation
│   ├── excelExport.js # Excel export for logs
│   ├── icsUtils.js    # Calendar export
│   ├── pdfUtils.js    # PDF generation
│   └── supabaseClient.js
└── App.jsx            # Main application component
```

## Factories

The system supports 14 Sunbelt factory locations:
- Atlanta (ATL), Dallas (DAL), Phoenix (PHX), Denver (DEN)
- Orlando (ORL), Charlotte (CLT), Houston (HOU), Nashville (BNA)
- Kansas City (MCI), Salt Lake City (SLC), San Antonio (SAT)
- Tampa (TPA), Raleigh (RDU), Indianapolis (IND)

Each factory can have assigned Project Coordinators (PC) and Plant Managers who see only their factory's projects.

## Key Workflows

### Project Lifecycle (6 Phases)
1. **Pre-Production** - Design, permitting, material ordering
2. **Production** - Factory manufacturing
3. **QC & Shipping** - Quality control and logistics
4. **Site Work** - Foundation and site preparation
5. **Installation** - Module setting and assembly
6. **Closeout** - Punch list, warranty, final documentation

### Task Status Flow
Not Started → In Progress → Awaiting Response → Completed/Cancelled

### RFI Status Flow
Draft → Open → Pending → Answered → Closed

### Submittal Status Flow
Pending → Submitted → Under Review → Approved/Rejected/Revise & Resubmit

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

Proprietary - Sunbelt Modular Inc.
