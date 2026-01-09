# Sunbelt PM - Workflow Implementation Changes
## Comprehensive System Update Document
### Generated: January 9, 2026

---

## 📋 Executive Summary

This document captures ALL changes required across the existing Sunbelt PM system to implement the new workflow features specified in `SUNBELT_WORKFLOW_SPEC.md`. Changes are organized by system area with priority ratings and dependency notes.

**Estimated Total Effort:** 80-120 hours
**Risk Level:** Medium-High (touches core systems)
**Recommended Approach:** Phased implementation with database changes first

---

## 🎯 Change Categories

| Category | Files Affected | Priority | Dependencies |
|----------|---------------|----------|--------------|
| Database Schema | 15+ new/modified tables | 🔴 Critical | None - Do First |
| Task System | 8+ components | 🔴 Critical | Database |
| User Roles | 5+ components | 🔴 Critical | Database |
| Kanban Boards | 3 components | 🟡 High | Task System |
| Dashboards | 6+ dashboards | 🟡 High | Task System, Roles |
| Project Details | 1 major component | 🟡 High | All above |
| Visual Workflow | New component | 🟡 High | All above |
| Filters & Search | 10+ components | 🟢 Medium | Task System |
| Reports | 3+ components | 🟢 Medium | All above |
| Notifications | New system | 🟢 Medium | Database |
| Calendar Integration | 4+ components | 🟢 Medium | Task System |
| Floor Plans | 1 component | 🟢 Low | Task System |

---

# 🗄️ SECTION 1: DATABASE CHANGES

## 1.1 New Tables Required

### `workflow_stations` (Reference Table)
```sql
CREATE TABLE workflow_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_key VARCHAR NOT NULL UNIQUE,
  station_name VARCHAR NOT NULL,
  phase INTEGER NOT NULL,
  phase_name VARCHAR NOT NULL,
  parent_station_key VARCHAR,
  display_order INTEGER NOT NULL,
  is_parallel BOOLEAN DEFAULT false,
  parallel_group VARCHAR,
  can_skip BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data required (see SUNBELT_WORKFLOW_SPEC.md)
```

### `project_workflow_status` (Per-Project Station Status)
```sql
CREATE TABLE project_workflow_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  station_key VARCHAR REFERENCES workflow_stations(station_key),
  status VARCHAR DEFAULT 'not_started',
  earliest_deadline DATE,
  is_skipped BOOLEAN DEFAULT false,
  skipped_reason VARCHAR,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, station_key)
);
```

### `factory_milestone_templates`
```sql
CREATE TABLE factory_milestone_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
  milestone_order INTEGER NOT NULL,
  milestone_name VARCHAR NOT NULL,
  milestone_key VARCHAR NOT NULL,
  default_days_from_po INTEGER,
  requires_signoff BOOLEAN DEFAULT false,
  signoff_type VARCHAR,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(factory_id, milestone_key)
);
```

### `project_milestones` (Enhanced from existing `milestones`)
```sql
-- Check if existing milestones table needs these columns added:
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS milestone_key VARCHAR;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS requires_signoff BOOLEAN DEFAULT false;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS signoff_document_url TEXT;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS signoff_document_name VARCHAR;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS signoff_date DATE;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS signoff_by VARCHAR;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS warning_email_sent_at TIMESTAMPTZ;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS warning_email_sent_to TEXT[];
```

### `drawing_versions`
```sql
CREATE TABLE drawing_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  drawing_percentage INTEGER,
  sent_date DATE,
  sent_by UUID REFERENCES users(id),
  dealer_response VARCHAR,
  response_date DATE,
  redline_document_url TEXT,
  redline_document_name VARCHAR,
  status VARCHAR DEFAULT 'Sent',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);
```

### `engineering_reviews`
```sql
CREATE TABLE engineering_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sent_date DATE,
  eta_date DATE,
  complete_date DATE,
  issues_found BOOLEAN DEFAULT false,
  dealer_approval_needed BOOLEAN DEFAULT false,
  co_triggered BOOLEAN DEFAULT false,
  change_order_id UUID REFERENCES change_orders(id),
  notes TEXT,
  reviewed_by VARCHAR,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `third_party_reviews`
```sql
CREATE TABLE third_party_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sent_date DATE,
  eta_date DATE,
  complete_date DATE,
  status VARCHAR DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `state_approvals`
```sql
CREATE TABLE state_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  state_code VARCHAR(2) NOT NULL,
  state_name VARCHAR,
  sent_date DATE,
  eta_date DATE,
  complete_date DATE,
  insignia_numbers TEXT,
  status VARCHAR DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `long_lead_items`
```sql
CREATE TABLE long_lead_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  item_name VARCHAR NOT NULL,
  manufacturer VARCHAR,
  model_number VARCHAR,
  lead_time_weeks INTEGER,
  has_cutsheet BOOLEAN DEFAULT false,
  cutsheet_url TEXT,
  status VARCHAR DEFAULT 'Pending',
  submitted_date DATE,
  signoff_date DATE,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `color_selections`
```sql
CREATE TABLE color_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category VARCHAR NOT NULL,
  item_name VARCHAR NOT NULL,
  color_code VARCHAR,
  color_name VARCHAR,
  manufacturer VARCHAR,
  status VARCHAR DEFAULT 'Pending',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `cutsheet_submittals`
```sql
CREATE TABLE cutsheet_submittals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  item_name VARCHAR NOT NULL,
  manufacturer VARCHAR,
  model_number VARCHAR,
  cutsheet_url TEXT,
  status VARCHAR DEFAULT 'Pending',
  submitted_date DATE,
  signoff_date DATE,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `warning_emails_log`
```sql
CREATE TABLE warning_emails_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id),
  email_type VARCHAR NOT NULL,
  sent_to_emails TEXT[] NOT NULL,
  sent_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_subject VARCHAR,
  email_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 1.2 Existing Table Modifications

### `tasks` Table - ADD COLUMNS
```sql
-- New columns for workflow integration
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_station_key VARCHAR 
  REFERENCES workflow_stations(station_key);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_court VARCHAR;

-- New index for station queries
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_station ON tasks(workflow_station_key);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_court ON tasks(assigned_court);
```

### `tasks` Table - STATUS VALUES CHANGE
**CRITICAL CHANGE**: Task statuses are changing from 6 values to 5 values.

| Current Status | New Status | Notes |
|----------------|------------|-------|
| Not Started | Not Started | ✅ Keep |
| In Progress | In Progress | ✅ Keep |
| On Hold | **REMOVE** | Merge to Awaiting Response |
| Blocked | **REMOVE** | Merge to Awaiting Response |
| Completed | Completed | ✅ Keep |
| Cancelled | Cancelled | ✅ Keep |
| *NEW* | **Awaiting Response** | 🆕 Add |

**Migration Required:**
```sql
-- Migrate existing On Hold and Blocked tasks
UPDATE tasks SET status = 'Awaiting Response' WHERE status IN ('On Hold', 'Blocked');
```

### `users` Table - ADD PC ROLE
```sql
-- Update role check constraint or enum to include 'PC'
-- Current roles: PM, Director, VP, Admin, IT
-- New roles: PM, Director, VP, Admin, IT, PC

-- Add factory assignment for PCs (already exists: factory_id)
-- PCs are factory-specific, so factory_id becomes required for PC role
```

### `projects` Table - ADD COLUMNS (if not exists)
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS po_received_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS po_document_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS po_number VARCHAR;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_generate_workflow_tasks BOOLEAN DEFAULT false;
```

---

## 1.3 RLS Policies Required

All new tables need RLS policies following the existing pattern:

```sql
-- Example for drawing_versions
ALTER TABLE drawing_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project drawing versions" ON drawing_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = drawing_versions.project_id
      AND (
        p.owner_id = auth.uid()
        OR p.primary_pm_id = auth.uid()
        OR p.secondary_pm_id = auth.uid()
        OR p.backup_pm_id = auth.uid()
        OR p.coordinator_id = auth.uid()
        OR public.user_has_elevated_role()
      )
    )
  );

-- Similar policies for INSERT, UPDATE, DELETE
```

**Tables requiring RLS:**
- [ ] workflow_stations (read-only for all, admin modify)
- [ ] project_workflow_status
- [ ] factory_milestone_templates
- [ ] drawing_versions
- [ ] engineering_reviews
- [ ] third_party_reviews
- [ ] state_approvals
- [ ] long_lead_items
- [ ] color_selections
- [ ] cutsheet_submittals
- [ ] warning_emails_log

---

# 👥 SECTION 2: USER ROLE CHANGES

## 2.1 New Role: Project Coordinator (PC)

### Database Changes
```sql
-- If using enum for roles, alter it:
-- ALTER TYPE user_role ADD VALUE 'PC';

-- Or if using check constraint, update it
```

### Files to Modify

| File | Change Required |
|------|-----------------|
| `src/context/AuthContext.jsx` | Add PC to role checks |
| `src/components/layout/Sidebar.jsx` | Add PC navigation items |
| `src/App.jsx` | Add PC dashboard routing |
| `src/components/modals/CreateUserModal.jsx` | Add PC to role dropdown |
| `src/components/modals/EditUserModal.jsx` | Add PC to role dropdown |
| `src/components/it/UserManagement.jsx` | Add PC role filter |

### PC-Specific Logic

```javascript
// In AuthContext or roleUtils.js
const PC_CAPABILITIES = {
  canViewAllFactoryProjects: true,  // All projects at their factory
  canEditProjects: false,           // Read-only for projects
  canManageTasks: true,             // Can update task statuses
  canSendWarningEmails: true,       // Primary function
  canViewDrawingStatus: true,
  canViewStateApprovals: true,
  dashboardType: 'pc'
};

// PC factory filter
const getPCProjects = (userId, factoryId) => {
  return projects.filter(p => p.factory_id === factoryId);
};
```

---

## 2.2 Role Access Matrix Update

### Current Matrix
| Role | PM | Director | VP | IT |
|------|:--:|:--------:|:--:|:--:|
| PM | ✅ | ❌ | ❌ | ❌ |
| Director | ✅ | ✅ | ❌ | ❌ |
| VP | ✅ | ✅ | ✅ | ❌ |
| IT | ✅ | ✅ | ❌ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |

### New Matrix (with PC)
| Role | PM | Director | VP | IT | PC |
|------|:--:|:--------:|:--:|:--:|:--:|
| PM | ✅ | ❌ | ❌ | ❌ | ❌ |
| Director | ✅ | ✅ | ❌ | ❌ | ❌ |
| VP | ✅ | ✅ | ✅ | ❌ | ❌ |
| IT | ✅ | ✅ | ❌ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PC** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

# ✅ SECTION 3: TASK SYSTEM CHANGES

## 3.1 Status Value Changes

### Files Requiring Status Updates

| File | Location | Current Values | New Values |
|------|----------|----------------|------------|
| `TasksPage.jsx` | `KANBAN_STATUSES` | 4 statuses | 4 statuses (different) |
| `TasksPage.jsx` | `ALL_STATUSES` | 6 statuses | 5 statuses |
| `TasksView.jsx` | `STATUS_OPTIONS` | 6 statuses | 5 statuses |
| `KanbanBoard.jsx` | `STATUS_COLUMNS` | 4 columns | 4 columns (relabel) |
| `ProjectDetails.jsx` | Task status colors | 6 statuses | 5 statuses |
| `calendarUtils.js` | `STATUS_CONFIG` | Multiple | Update |
| `FloorPlanViewer.jsx` | `getMarkerColor` | Task statuses | Update |
| `RecentActivityFeed.jsx` | Status checks | Multiple | Update |
| `TeamWorkloadView.jsx` | Status filters | Multiple | Update |
| `PMDashboard.jsx` | Status calculations | Multiple | Update |
| `DirectorDashboard.jsx` | Status calculations | Multiple | Update |

### Old → New Status Mapping

```javascript
// BEFORE
const TASK_STATUSES = [
  'Not Started',
  'In Progress', 
  'On Hold',      // REMOVE
  'Blocked',      // REMOVE
  'Completed',
  'Cancelled'
];

// AFTER
const TASK_STATUSES = [
  'Not Started',
  'In Progress',
  'Awaiting Response',  // NEW - replaces On Hold & Blocked
  'Completed',
  'Cancelled'
];
```

### Kanban Column Changes

```javascript
// BEFORE (TasksPage.jsx)
const KANBAN_STATUSES = ['Not Started', 'In Progress', 'On Hold', 'Completed'];

// AFTER
const KANBAN_STATUSES = ['Not Started', 'In Progress', 'Awaiting Response', 'Completed'];
```

```javascript
// BEFORE (KanbanBoard.jsx)
const STATUS_COLUMNS = [
  { id: 'Not Started', label: 'To Do', color: '...' },
  { id: 'In Progress', label: 'In Progress', color: '...' },
  { id: 'On Hold', label: 'On Hold', color: '...' },
  { id: 'Completed', label: 'Done', color: '...' }
];

// AFTER
const STATUS_COLUMNS = [
  { id: 'Not Started', label: 'To Do', color: 'var(--text-tertiary)' },
  { id: 'In Progress', label: 'In Progress', color: 'var(--sunbelt-orange)' },
  { id: 'Awaiting Response', label: 'Waiting', color: 'var(--warning)' },
  { id: 'Completed', label: 'Done', color: 'var(--success)' }
];
```

---

## 3.2 New Task Fields

### UI Changes for Task Forms

| Field | Type | Location | Notes |
|-------|------|----------|-------|
| `workflow_station_key` | Dropdown | Create/Edit Task Modal | Link to workflow station |
| `assigned_court` | Dropdown | Create/Edit Task Modal | Who has the ball |

### Court Options
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

### Files to Modify for Task Fields

| File | Change |
|------|--------|
| `CreateTaskModal.jsx` | Add station dropdown, court dropdown |
| `EditTaskModal.jsx` | Add station dropdown, court dropdown |
| `TasksPage.jsx` | Add court filter option |
| `TasksView.jsx` | Display court badge on cards |
| `KanbanBoard.jsx` | Display court badge on cards |

---

## 3.3 Station-Task Auto-Sync Logic

When task status changes, station status must recalculate:

```javascript
// utils/workflowUtils.js (NEW FILE)

/**
 * Calculate station status based on linked tasks
 * Uses "worst status wins" logic
 */
export const calculateStationStatus = (tasks) => {
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

/**
 * Get earliest deadline from linked tasks
 */
export const getStationDeadline = (tasks) => {
  const deadlines = tasks
    .filter(t => t.due_date && !['Completed', 'Cancelled'].includes(t.status))
    .map(t => new Date(t.due_date));
  
  if (deadlines.length === 0) return null;
  return new Date(Math.min(...deadlines));
};
```

---

# 📊 SECTION 4: DASHBOARD CHANGES

## 4.1 New PC Dashboard

### File: `src/components/dashboards/PCDashboard.jsx` (NEW)

**Features:**
- Factory-filtered project list
- Upcoming deadlines (sorted by urgency)
- Overdue items (RED highlighting)
- Warning emails sent/pending
- Drawing status overview
- State approval status overview
- Quick links to project workflow tabs

**Key Components:**
```jsx
// PCDashboard.jsx structure
- Header with factory name
- Stats cards (Projects, Deadlines Today, Overdue, Warnings Pending)
- Deadline Timeline (next 7 days)
- Projects at My Factory (table)
- Drawing Status Overview (cards per project)
- State Approvals Tracker (table)
- Warning Email Queue (pending sends)
```

---

## 4.2 PM Dashboard Updates

### File: `src/components/dashboards/PMDashboard.jsx`

**Changes Required:**

| Section | Change |
|---------|--------|
| Stats Cards | Update task count logic for new statuses |
| Overdue Items | Update status filter logic |
| Task List | Add "Awaiting Response" handling |
| Quick Actions | Add "View Workflow" link per project |

**Code Changes:**
```javascript
// BEFORE
const openTasks = tasks.filter(t => !['Completed', 'Cancelled'].includes(t.status));

// AFTER (same, but status values changed)
const openTasks = tasks.filter(t => !['Completed', 'Cancelled'].includes(t.status));

// BEFORE
const blockedTasks = tasks.filter(t => t.status === 'Blocked');

// AFTER
const awaitingTasks = tasks.filter(t => t.status === 'Awaiting Response');
```

---

## 4.3 Director Dashboard Updates

### File: `src/components/dashboards/DirectorDashboard.jsx`

**Changes Required:**

| Section | Change |
|---------|--------|
| Team Workload | Update status calculations |
| Portfolio Overview | Add workflow status summary |
| Stats | Update for new task statuses |

---

## 4.4 VP Dashboard Updates

### File: `src/components/dashboards/VPDashboard.jsx`

**Changes Required:**

| Section | Change |
|---------|--------|
| Factory Overview | Add workflow completion % |
| Metrics | Update task status counts |
| Drill-down | Link to workflow views |

---

## 4.5 Sidebar Updates

### File: `src/components/layout/Sidebar.jsx`

**Changes Required:**

```javascript
// Add PC navigation
case 'pc':
  return [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deadlines', label: 'Deadlines', icon: Clock },
    { id: 'drawings', label: 'Drawings', icon: FileText },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle },
    ...commonItems,
  ];
```

**Stats for PC:**
```javascript
// PC-specific stats
case 'pc':
  return (
    <div>
      <span>Factory Projects: {factoryProjectCount}</span>
      <span>Deadlines Today: {todayDeadlines}</span>
      <span>Overdue: {overdueCount}</span>
    </div>
  );
```

---

# 📁 SECTION 5: PROJECT DETAILS CHANGES

## 5.1 New Workflow Tab

### File: `src/components/projects/ProjectDetails.jsx`

**Add to tabs array:**
```javascript
const TABS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'workflow', label: 'Workflow', icon: GitBranch },  // NEW
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  // ... rest of tabs
];
```

**New Component Required:**
- `src/components/projects/WorkflowTracker.jsx` (NEW)

---

## 5.2 WorkflowTracker Component (NEW)

### File: `src/components/projects/WorkflowTracker.jsx`

**Major New Component** - The visual workflow diagram

**Props:**
```typescript
interface WorkflowTrackerProps {
  projectId: string;
  orientation: 'portrait' | 'landscape';
  onStationClick: (stationKey: string) => void;
}
```

**Sub-components needed:**
- `WorkflowNode.jsx` - Individual station node
- `WorkflowConnection.jsx` - Animated connection lines
- `WorkflowPhaseHeader.jsx` - Phase dividers
- `StationDetailModal.jsx` - Click modal

**State management:**
```javascript
// Fetch workflow status for project
const [stationStatuses, setStationStatuses] = useState({});
const [linkedTasks, setLinkedTasks] = useState({});

// Calculate colors based on deadlines
const getStationColor = (station) => {
  const status = stationStatuses[station.station_key];
  const deadline = getStationDeadline(linkedTasks[station.station_key]);
  
  if (status === 'completed') return 'var(--success)';
  if (status === 'skipped') return 'var(--text-tertiary)';
  
  if (deadline) {
    const daysUntil = differenceInDays(deadline, new Date());
    if (daysUntil < 0) return 'var(--danger)';      // Overdue
    if (daysUntil <= 2) return 'var(--warning)';    // Nearing
  }
  
  if (status === 'in_progress' || status === 'awaiting_response') {
    return 'var(--sunbelt-orange)';
  }
  
  return 'var(--text-tertiary)';  // Not started
};
```

---

## 5.3 Tasks Tab Updates

### File: `src/components/projects/TasksView.jsx`

**Changes:**
1. Update status options
2. Add station filter dropdown
3. Add court filter dropdown
4. Display station badge on task cards

```javascript
// Add to filters
const [filterStation, setFilterStation] = useState('all');
const [filterCourt, setFilterCourt] = useState('all');

// Filter logic
const filteredTasks = tasks.filter(task => {
  // ... existing filters
  if (filterStation !== 'all' && task.workflow_station_key !== filterStation) return false;
  if (filterCourt !== 'all' && task.assigned_court !== filterCourt) return false;
  return true;
});
```

---

## 5.4 New Sub-tabs for Workflow

May need new tabs or sections:
- **Drawings** - Drawing version history
- **Sign-offs** - Long lead, colors, cutsheets
- **Approvals** - Engineering, third party, state

---

# 🔍 SECTION 6: FILTER & SEARCH UPDATES

## 6.1 Global Status Filter Updates

Every component with task status filters needs updating:

| Component | File | Filter Variable |
|-----------|------|-----------------|
| TasksPage | `TasksPage.jsx` | `filterStatus` |
| TasksView | `TasksView.jsx` | `statusFilter` |
| PMDashboard | `PMDashboard.jsx` | Inline filters |
| DirectorDashboard | `DirectorDashboard.jsx` | Inline filters |
| Calendar views | Multiple | Status checks |
| Reports | Multiple | Status grouping |

**Standard Filter Options:**
```javascript
const TASK_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },  // Not Started + In Progress + Awaiting
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Awaiting Response', label: 'Awaiting Response' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'overdue', label: 'Overdue' }
];
```

---

## 6.2 "Open" vs "Closed" Logic Updates

**BEFORE:**
```javascript
const isOpen = !['Completed', 'Cancelled'].includes(status);
const isClosed = ['Completed', 'Cancelled'].includes(status);
```

**AFTER:** (Same logic, but be aware of new status)
```javascript
const CLOSED_STATUSES = ['Completed', 'Cancelled'];
const isOpen = !CLOSED_STATUSES.includes(status);
const isClosed = CLOSED_STATUSES.includes(status);
```

---

# 📈 SECTION 7: REPORTS & ANALYTICS

## 7.1 Files Requiring Updates

| File | Change |
|------|--------|
| `src/components/reports/ProjectReport.jsx` | Add workflow progress section |
| `src/components/reports/TaskReport.jsx` | Update status breakdown |
| `TeamWorkloadView.jsx` | Update status calculations |
| `RecentActivityFeed.jsx` | Add workflow activity types |

## 7.2 New Report Metrics

**Workflow Progress Report:**
- % of stations complete per project
- Average time per station
- Bottleneck identification (stations with most delays)
- Deadline compliance rate

**Station Analytics:**
- Tasks per station
- Average completion time per station
- Court distribution (where do things get stuck?)

---

# 🔔 SECTION 8: NOTIFICATION SYSTEM

## 8.1 Warning Email System (NEW)

### Files to Create

| File | Purpose |
|------|---------|
| `src/utils/emailUtils.js` | Email composition utilities |
| `src/components/modals/WarningEmailModal.jsx` | Preview/send modal |
| `src/services/emailService.js` | Supabase edge function calls |

### Warning Email Triggers

```javascript
// Check for milestones due in 2 days
const checkUpcomingDeadlines = async (factoryId) => {
  const twoDaysFromNow = addDays(new Date(), 2);
  
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*, project:projects(*)')
    .eq('projects.factory_id', factoryId)
    .eq('status', 'Not Started')
    .lte('due_date', twoDaysFromNow.toISOString())
    .is('warning_email_sent_at', null);
  
  return milestones;
};
```

### Email Recipients Logic

```javascript
const getWarningEmailRecipients = async (project) => {
  return {
    to: [project.dealer_email],
    cc: [
      project.secondary_pm?.email,
      project.director?.email,
      project.factory_pc?.email,
      project.factory_gm?.email,
      project.sales_rep?.email
    ].filter(Boolean)
  };
};
```

---

# 📅 SECTION 9: CALENDAR INTEGRATION

## 9.1 Calendar Utils Updates

### File: `src/utils/calendarUtils.js`

**Add workflow item types:**
```javascript
export const ITEM_TYPE_CONFIG = {
  // ... existing types
  drawing_deadline: {
    label: 'Drawing',
    shortLabel: 'DRW',
    icon: 'FileText',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    priority: 5,
  },
  signoff_deadline: {
    label: 'Sign-off',
    shortLabel: 'SGN',
    icon: 'CheckSquare',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    priority: 6,
  },
  state_approval: {
    label: 'State',
    shortLabel: 'ST',
    icon: 'Building',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    priority: 7,
  }
};
```

---

## 9.2 ICS Export Updates

### File: `src/utils/icsUtils.js`

**Add workflow event exports:**
```javascript
export const exportMilestoneToICS = (milestone, projectName, projectNumber) => {
  // Similar pattern to existing task/RFI exports
};

export const exportDrawingDeadlineToICS = (drawing, projectName, projectNumber) => {
  // New function
};
```

---

# 🗺️ SECTION 10: FLOOR PLAN INTEGRATION

## 10.1 Marker Color Updates

### File: `src/components/floorplans/FloorPlanViewer.jsx`

**Update `getMarkerColor` function:**
```javascript
// TASK COLORS - Update for new statuses
else if (marker.item_type === 'task') {
  const colors = {
    'Not Started': '#64748b',
    'In Progress': '#f59e0b',
    'Awaiting Response': '#8b5cf6',  // NEW - purple for waiting
    'Completed': '#22c55e',
    'Cancelled': '#64748b'
  };
  return colors[status] || '#64748b';
}
```

**Update status filter logic:**
```javascript
// Open status check
if (filterStatus === 'open') {
  if (marker.item_type === 'task') {
    return ['Not Started', 'In Progress', 'Awaiting Response'].includes(item.status);
  }
}
```

---

# 🔄 SECTION 11: MIGRATION STRATEGY

## 11.1 Recommended Order

### Phase 1: Database (Day 1-2)
1. Create all new tables
2. Add columns to existing tables
3. Run data migration for task statuses
4. Add RLS policies
5. Seed workflow_stations data
6. Seed factory_milestone_templates

### Phase 2: Core Logic (Day 3-4)
1. Create `workflowUtils.js`
2. Update task status constants across ALL files
3. Update Kanban board columns
4. Test task CRUD operations

### Phase 3: User Roles (Day 5)
1. Add PC role to database
2. Update AuthContext
3. Update role checks in UI
4. Create PC Dashboard (basic)

### Phase 4: Project Details (Day 6-7)
1. Add Workflow tab
2. Create WorkflowTracker component (basic)
3. Add station linking to task forms
4. Test station-task sync

### Phase 5: Polish (Day 8-10)
1. Add animations to WorkflowTracker
2. Add orientation toggle
3. Complete PC Dashboard
4. Add warning email system
5. Update reports

---

## 11.2 Rollback Plan

**If issues arise:**
1. Keep old status values in database (don't delete)
2. Feature flag for new workflow features
3. Dual-write during transition (update both old and new fields)

```javascript
// Feature flag check
const WORKFLOW_ENABLED = await getFeatureFlag('workflow_v2');

if (WORKFLOW_ENABLED) {
  // New logic
} else {
  // Old logic
}
```

---

# ✅ SECTION 12: TESTING CHECKLIST

## 12.1 Database Tests
- [ ] New tables created successfully
- [ ] Foreign keys work correctly
- [ ] RLS policies block unauthorized access
- [ ] RLS policies allow authorized access
- [ ] Task status migration completes
- [ ] Existing data not corrupted

## 12.2 UI Tests
- [ ] Task creation with new statuses works
- [ ] Task editing with new statuses works
- [ ] Kanban drag-drop works with new columns
- [ ] Filters work with new status values
- [ ] Search works with new fields
- [ ] Calendar shows correct item types

## 12.3 Role Tests
- [ ] PC can only see factory projects
- [ ] PC can update task statuses
- [ ] PC cannot edit project details
- [ ] PC dashboard loads correctly
- [ ] Existing roles unaffected

## 12.4 Workflow Tests
- [ ] WorkflowTracker renders correctly
- [ ] Station colors update on task changes
- [ ] Station click opens modal
- [ ] Orientation toggle works
- [ ] Animation performs smoothly

## 12.5 Integration Tests
- [ ] Task → Station sync works
- [ ] Multiple tasks per station works
- [ ] Warning emails trigger correctly
- [ ] Reports show correct data
- [ ] Activity feed captures workflow events

---

# 📋 SECTION 13: FILES INDEX

## 13.1 New Files to Create

| File | Type | Priority |
|------|------|----------|
| `src/components/dashboards/PCDashboard.jsx` | Component | 🔴 High |
| `src/components/projects/WorkflowTracker.jsx` | Component | 🔴 High |
| `src/components/projects/WorkflowNode.jsx` | Component | 🔴 High |
| `src/components/projects/WorkflowConnection.jsx` | Component | 🟡 Medium |
| `src/components/projects/StationDetailModal.jsx` | Component | 🟡 Medium |
| `src/utils/workflowUtils.js` | Utility | 🔴 High |
| `src/utils/emailUtils.js` | Utility | 🟢 Low |
| `src/components/modals/WarningEmailModal.jsx` | Component | 🟢 Low |
| `supabase/migrations/YYYYMMDD_workflow_tables.sql` | Migration | 🔴 High |

## 13.2 Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `TasksPage.jsx` | Status values, filters | 🔴 High |
| `TasksView.jsx` | Status values, filters, court field | 🔴 High |
| `KanbanBoard.jsx` | Column labels | 🔴 High |
| `ProjectDetails.jsx` | Add Workflow tab | 🔴 High |
| `CreateTaskModal.jsx` | Add station, court fields | 🟡 Medium |
| `EditTaskModal.jsx` | Add station, court fields | 🟡 Medium |
| `Sidebar.jsx` | Add PC navigation | 🟡 Medium |
| `App.jsx` | Add PC routing | 🟡 Medium |
| `AuthContext.jsx` | Add PC role logic | 🟡 Medium |
| `PMDashboard.jsx` | Update status logic | 🟡 Medium |
| `DirectorDashboard.jsx` | Update status logic | 🟡 Medium |
| `VPDashboard.jsx` | Update status logic | 🟡 Medium |
| `calendarUtils.js` | Add workflow items | 🟢 Low |
| `icsUtils.js` | Add workflow exports | 🟢 Low |
| `FloorPlanViewer.jsx` | Update status colors | 🟢 Low |
| `RecentActivityFeed.jsx` | Update status handling | 🟢 Low |
| `TeamWorkloadView.jsx` | Update status calcs | 🟢 Low |

---

# 🚨 SECTION 14: RISK ASSESSMENT

## 14.1 High Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| Task Status Migration | Data loss | Backup first, test on staging |
| Kanban Board | Breaking existing workflows | Feature flag, gradual rollout |
| RLS Policies | Security holes | Thorough testing, security review |
| Performance | Slow workflow queries | Add indexes, optimize queries |

## 14.2 Breaking Changes

| Change | Impact | Users Affected |
|--------|--------|----------------|
| Task statuses | Existing tasks change | All users |
| Kanban columns | Visual change | All PM users |
| New required fields | Form changes | Task creators |

---

# 📝 SECTION 15: DOCUMENTATION UPDATES

## 15.1 Files to Update

| Document | Changes |
|----------|---------|
| `DATABASE_SCHEMA.md` | Add new tables, modified columns |
| `PROJECT_STATUS.md` | Add workflow implementation notes |
| `README.md` | Add workflow feature description |
| Project Instructions | Add workflow conventions |

## 15.2 New Documentation Needed

| Document | Purpose |
|----------|---------|
| `WORKFLOW_USER_GUIDE.md` | End-user documentation |
| `PC_DASHBOARD_GUIDE.md` | PC role-specific guide |
| `WORKFLOW_API.md` | API documentation for workflow |

---

## 📌 SUMMARY

**Total New Files:** 10+
**Total Modified Files:** 20+
**Database Tables Added:** 12
**Database Columns Added:** 15+
**Estimated LOC:** 5,000-8,000

**Critical Path:**
1. Database migration
2. Task status update
3. WorkflowTracker component
4. PC Dashboard

**Success Criteria:**
- All existing tests pass
- New workflow features functional
- No regression in existing features
- PC role works as specified
- Visual workflow tracker animates smoothly
