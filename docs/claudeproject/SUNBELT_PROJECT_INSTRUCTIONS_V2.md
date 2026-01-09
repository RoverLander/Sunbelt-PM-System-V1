# Sunbelt PM - Project Instructions
## Version 2.0 - Updated January 9, 2026

You are helping Matthew build a Project Management system for Sunbelt Modular using React and Supabase.

---

## Key Context
- Always use the existing CSS variables (--sunbelt-orange, --bg-primary, etc.)
- Follow the established component patterns in the knowledge base
- Use Supabase for all database operations
- External items (tasks, RFIs, submittals) use is_external flag + sent_to_email
- File attachments go to file_attachments table and project-files storage bucket

---

## Code Comment Nomenclature

### File Header Block (top of every component file)
```javascript
// ============================================================================
// ComponentName.jsx
// ============================================================================
// Brief description of what this component does.
//
// FEATURES:
// - Feature 1
// - Feature 2
//
// DEPENDENCIES:
// - supabaseClient: Database operations
// - AuthContext: User authentication
//
// PROPS:
// - propName: Description
//
// FIXES (Date):
// - Description of fix
// ============================================================================
```

### Major Sections (top-level divisions within component)
```javascript
// ============================================================================
// SECTION NAME
// ============================================================================
```

### Subsections (within major sections)
```javascript
// ==========================================================================
// SUBSECTION NAME
// ==========================================================================
```

### State Groupings
```javascript
// ==========================================================================
// STATE - DATA
// ==========================================================================
const [projects, setProjects] = useState([]);

// ==========================================================================
// STATE - UI
// ==========================================================================
const [loading, setLoading] = useState(true);

// ==========================================================================
// STATE - FILTERS
// ==========================================================================
const [filterStatus, setFilterStatus] = useState('active');
```

### Inline Comments for Fixes/Additions
```javascript
const [factories, setFactories] = useState([]); // ✅ ADDED: All factories from DB
owner_id: formData.owner_id || null,           // ✅ FIXED: Was missing
```

### Render Section Markers (JSX)
```jsx
{/* ================================================================== */}
{/* SECTION NAME                                                       */}
{/* ================================================================== */}
```

---

## Database Conventions

### Status Values (Always Title Case)

#### Tasks (5 statuses)
```javascript
const TASK_STATUSES = [
  'Not Started',        // Work hasn't begun
  'In Progress',        // Actively being worked on
  'Awaiting Response',  // Waiting on someone else (dealer, state, etc.)
  'Completed',          // Done
  'Cancelled'           // No longer needed
];

// For Kanban boards - 4 columns
const KANBAN_COLUMNS = ['Not Started', 'In Progress', 'Awaiting Response', 'Completed'];

// Open vs Closed logic
const CLOSED_TASK_STATUSES = ['Completed', 'Cancelled'];
const isTaskOpen = (status) => !CLOSED_TASK_STATUSES.includes(status);
```

#### RFIs (4 statuses)
```javascript
const RFI_STATUSES = ['Draft', 'Open', 'Answered', 'Closed'];
const CLOSED_RFI_STATUSES = ['Answered', 'Closed'];
```

#### Submittals (7 statuses)
```javascript
const SUBMITTAL_STATUSES = [
  'Draft', 
  'Submitted', 
  'Under Review', 
  'Approved', 
  'Approved as Noted', 
  'Rejected', 
  'Closed'
];
const CLOSED_SUBMITTAL_STATUSES = ['Approved', 'Approved as Noted', 'Rejected', 'Closed'];
```

#### Projects (8 statuses)
```javascript
const PROJECT_STATUSES = [
  'Planning', 
  'Pre-PM', 
  'PM Handoff', 
  'In Progress', 
  'On Hold', 
  'Completed', 
  'Cancelled', 
  'Warranty'
];
const ACTIVE_PROJECT_STATUSES = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
```

#### Workflow Stations
```javascript
const STATION_STATUSES = [
  'not_started',
  'in_progress',
  'awaiting_response',
  'completed',
  'skipped'
];
```

### Priority Values
```javascript
const PRIORITIES = ['Low', 'Normal', 'Medium', 'High', 'Critical'];
```

### Court Values (for Awaiting Response tasks)
```javascript
const COURT_OPTIONS = [
  { value: 'dealer', label: 'Dealer' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'pm', label: 'PM' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'third_party', label: 'Third Party' },
  { value: 'state', label: 'State' },
  { value: 'factory', label: 'Factory' },
  { value: 'procurement', label: 'Procurement' }
];
```

### PM Field Mapping
```javascript
// Projects table PM fields
owner_id        = Primary PM (legacy, still used)
primary_pm_id   = Primary PM (preferred)
secondary_pm_id = Secondary PM
backup_pm_id    = Backup PM

// Users who can be assigned as PM
const PM_CAPABLE_ROLES = ['PM', 'Project Manager', 'Director', 'Admin', 'VP'];
```

### Update Pattern (always include timestamp)
```javascript
const updateData = {
  ...fields,
  updated_at: new Date().toISOString()
};
```

### Supabase Select with Joins
```javascript
// Projects with PM info
.select(`*, pm:owner_id(id, name), backup_pm:backup_pm_id(id, name)`)

// Tasks with assignee and project
.select(`*, assignee:assignee_id(id, name), project:project_id(id, name, project_number)`)

// Tasks with workflow station
.select(`*, workflow_station:workflow_station_key(station_key, station_name, phase_name)`)
```

---

## User Roles

### Role Definitions

| Role | Description | Factory-Specific |
|------|-------------|------------------|
| **PM** | Project Manager - manages assigned projects | No |
| **Director** | Oversees multiple PMs and projects | No |
| **VP** | Executive overview across all factories | No |
| **Admin** | Full system access | No |
| **IT** | Technical administration | No |
| **PC** | Project Coordinator - factory-specific deadline tracking | **Yes** |

### Dashboard Access Rules

| Role | PM | Director | VP | IT | PC |
|------|:--:|:--------:|:--:|:--:|:--:|
| PM | ✅ | ❌ | ❌ | ❌ | ❌ |
| Director | ✅ | ✅ | ❌ | ❌ | ❌ |
| VP | ✅ | ✅ | ✅ | ❌ | ❌ |
| IT | ✅ | ✅ | ❌ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PC** | ❌ | ❌ | ❌ | ❌ | ✅ |

### Role Capability Checks
```javascript
// Check for elevated roles (can see all projects)
const hasElevatedRole = (role) => ['Director', 'VP', 'Admin', 'IT'].includes(role);

// Check if user can edit projects
const canEditProjects = (role) => ['PM', 'Director', 'Admin'].includes(role);

// PC-specific: can only view/manage their factory's projects
const isPCRole = (role) => role === 'PC';
```

---

## Workflow System

### Workflow Phases
```javascript
const WORKFLOW_PHASES = [
  { phase: 1, name: 'Initiation' },
  { phase: 2, name: 'Dealer Sign-Offs' },
  { phase: 3, name: 'Internal Approvals' },
  { phase: 4, name: 'Delivery' }
];
```

### Station-Task Relationship
- **1:Many** - Each station can have multiple tasks linked
- Tasks link to stations via `workflow_station_key`
- Station status is **derived** from linked tasks (not stored separately)

### Station Status Calculation (Worst Status Wins)
```javascript
const calculateStationStatus = (tasks) => {
  if (!tasks || tasks.length === 0) return 'not_started';
  
  const statuses = tasks.map(t => t.status);
  
  // Priority order (worst to best)
  if (statuses.every(s => s === 'Cancelled')) return 'skipped';
  if (statuses.some(s => s === 'Not Started')) return 'not_started';
  if (statuses.some(s => s === 'In Progress')) return 'in_progress';
  if (statuses.some(s => s === 'Awaiting Response')) return 'awaiting_response';
  if (statuses.every(s => ['Completed', 'Cancelled'].includes(s))) return 'completed';
  
  return 'in_progress';
};
```

### Station Deadline Calculation
```javascript
// Uses earliest deadline among linked tasks
const getStationDeadline = (tasks) => {
  const deadlines = tasks
    .filter(t => t.due_date && !['Completed', 'Cancelled'].includes(t.status))
    .map(t => new Date(t.due_date));
  
  if (deadlines.length === 0) return null;
  return new Date(Math.min(...deadlines));
};
```

### Workflow Color Logic
```javascript
const getStationColor = (status, deadline) => {
  if (status === 'completed') return 'var(--success)';        // Green
  if (status === 'skipped') return 'var(--text-tertiary)';    // Gray crossed
  
  if (deadline) {
    const daysUntil = differenceInDays(deadline, new Date());
    if (daysUntil < 0) return 'var(--danger)';                // Red - overdue
    if (daysUntil <= 2) return 'var(--warning)';              // Orange - nearing
  }
  
  if (status === 'in_progress' || status === 'awaiting_response') {
    return 'var(--sunbelt-orange)';                           // Yellow - active
  }
  
  return 'var(--text-tertiary)';                              // Gray - not started
};
```

---

## Constants (Use These Exact Values)

### Factory Options (for modals)
```javascript
const FACTORY_OPTIONS = [
  'AMT - AMTEX',
  'BUSA - Britco USA',
  'C&B - C&B Modular',
  'IBI - Indicom Buildings',
  'MRS - MR Steel',
  'NWBS - Northwest Building Systems',
  'PMI - Phoenix Modular',
  'PRM - Pro-Mod Manufacturing',
  'SMM - Southeast Modular',
  'SNB - Sunbelt Modular (Corporate)',
  'SSI - Specialized Structures',
  'WM-EAST - Whitley Manufacturing East',
  'WM-EVERGREEN - Whitley Manufacturing Evergreen',
  'WM-ROCHESTER - Whitley Manufacturing Rochester',
  'WM-SOUTH - Whitley Manufacturing South',
];

// For filter dropdowns, fetch from factories table instead of using constants
```

### Status Colors
```javascript
const TASK_STATUS_COLORS = {
  'Not Started': 'var(--text-tertiary)',
  'In Progress': 'var(--sunbelt-orange)',
  'Awaiting Response': 'var(--warning)',
  'Completed': 'var(--success)',
  'Cancelled': 'var(--text-tertiary)'
};

const RFI_STATUS_COLORS = {
  'Draft': 'var(--text-tertiary)',
  'Open': 'var(--warning)',
  'Answered': 'var(--success)',
  'Closed': 'var(--text-tertiary)'
};

const SUBMITTAL_STATUS_COLORS = {
  'Draft': 'var(--text-tertiary)',
  'Submitted': 'var(--info)',
  'Under Review': 'var(--warning)',
  'Approved': 'var(--success)',
  'Approved as Noted': 'var(--success)',
  'Rejected': 'var(--danger)',
  'Closed': 'var(--text-tertiary)'
};

const PRIORITY_COLORS = {
  'Low': 'var(--text-tertiary)',
  'Normal': 'var(--info)',
  'Medium': 'var(--warning)',
  'High': 'var(--sunbelt-orange)',
  'Critical': 'var(--danger)'
};
```

---

## Component Patterns

### Modal Props Pattern
```javascript
function MyModal({ isOpen, onClose, onSuccess, existingData }) {
  // ...
  if (!isOpen) return null;
  // ...
}
```

### Toast Notification Pattern
```javascript
const showToast = (message, type = 'success') => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
};
```

### Fetch on Mount Pattern
```javascript
useEffect(() => {
  if (user) fetchData();
}, [user]);

useEffect(() => {
  if (isOpen) {
    fetchUsers();
    fetchFactories();
  }
}, [isOpen]);
```

### Form Data Population (Edit Modals)
```javascript
useEffect(() => {
  if (existingData && isOpen) {
    setFormData({
      field1: existingData.field1 || '',
      field2: existingData.field2 || '',
    });
  }
}, [existingData, isOpen]);
```

### Task Form with Workflow Fields
```javascript
const [formData, setFormData] = useState({
  title: '',
  description: '',
  status: 'Not Started',
  priority: 'Medium',
  due_date: '',
  assignee_id: '',
  workflow_station_key: '',  // Link to workflow station
  assigned_court: ''          // Whose court is the ball in
});
```

---

## Button Styling

```javascript
// Cancel Button
style={{
  padding: '10px 20px',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
}}

// Primary Action Button (Orange)
style={{
  padding: '10px 20px',
  background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontWeight: '600'
}}

// Email Action Button (Blue)
style={{
  padding: '10px 20px',
  background: 'var(--info)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
}}
```

---

## Sidebar Stats Pattern

```javascript
// VP/Director/IT stats: Fetch immediately (don't need currentUser)
useEffect(() => {
  if (['vp', 'director', 'it'].includes(dashboardType)) {
    fetchGlobalStats();
  }
}, [dashboardType]);

// PM stats: Wait for currentUser before fetching
useEffect(() => {
  if (dashboardType === 'pm' && currentUser?.id) {
    fetchPMStats(currentUser.id);
  }
}, [dashboardType, currentUser]);

// PC stats: Filter by factory
useEffect(() => {
  if (dashboardType === 'pc' && currentUser?.factory_id) {
    fetchFactoryStats(currentUser.factory_id);
  }
}, [dashboardType, currentUser]);
```

---

## Database Tables Reference

### Core Tables
| Table | Description |
|-------|-------------|
| `users` | User accounts and roles |
| `projects` | Project information |
| `tasks` | Task items (with workflow linking) |
| `rfis` | Requests for Information |
| `submittals` | Submittal packages |
| `milestones` | Project milestones |
| `change_orders` | Change order tracking |

### Workflow Tables (NEW)
| Table | Description |
|-------|-------------|
| `workflow_stations` | Reference table for all stations |
| `project_workflow_status` | Per-project station status (cached) |
| `factory_milestone_templates` | Factory-specific defaults |
| `drawing_versions` | Drawing review version history |
| `engineering_reviews` | Internal engineering tracking |
| `third_party_reviews` | Third party stamp tracking |
| `state_approvals` | Multi-state approval tracking |
| `long_lead_items` | Long lead item tracking |
| `color_selections` | Color selection tracking |
| `cutsheet_submittals` | Cutsheet approval tracking |
| `warning_emails_log` | Email audit trail |

### Supporting Tables
| Table | Description |
|-------|-------------|
| `project_team` | Many-to-many project assignments |
| `factories` | Factory reference data |
| `factory_contacts` | Factory personnel directory |
| `file_attachments` | File attachment system |
| `comments` | Polymorphic comments |
| `notifications` | User notifications |

---

## Test Accounts

| Name | Role | Default Dashboard |
|------|------|-------------------|
| Matthew McDaniel | Admin | Director |
| Candy Schrader | Director | Director |
| Devin Duvak | VP | VP |
| Joy | IT | IT |

---

## When Writing Components

1. ✅ Match the existing styling patterns
2. ✅ Include proper error handling
3. ✅ Use the showToast pattern for notifications
4. ✅ Follow the modal open/close patterns
5. ✅ Group state variables by purpose (DATA, UI, FILTERS)
6. ✅ Include comprehensive file header comments
7. ✅ Use correct status values (check this document!)
8. ✅ Include workflow fields where applicable
9. ✅ Check role permissions before showing features

**Always ask clarifying questions if requirements are unclear.**

---

## Quick Reference: Status Migration

If you encounter old status values, here's the mapping:

| Old Status | New Status |
|------------|------------|
| On Hold | → Awaiting Response |
| Blocked | → Awaiting Response |

All other statuses remain the same.

---

## Kanban Board Columns

```javascript
// Standard 4-column Kanban
const KANBAN_COLUMNS = [
  { id: 'Not Started', label: 'To Do', color: 'var(--text-tertiary)' },
  { id: 'In Progress', label: 'In Progress', color: 'var(--sunbelt-orange)' },
  { id: 'Awaiting Response', label: 'Waiting', color: 'var(--warning)' },
  { id: 'Completed', label: 'Done', color: 'var(--success)' }
];
```

---

## Project Details Tabs

```javascript
const PROJECT_TABS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'workflow', label: 'Workflow', icon: GitBranch },  // NEW
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'rfis', label: 'RFIs', icon: MessageSquare },
  { id: 'submittals', label: 'Submittals', icon: ClipboardList },
  { id: 'change-orders', label: 'Change Orders', icon: FileText },
  { id: 'files', label: 'Files', icon: Folder },
  { id: 'floor-plans', label: 'Floor Plans', icon: Map },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays }
];
```
