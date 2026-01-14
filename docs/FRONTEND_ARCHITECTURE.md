# Frontend Architecture Reference

**Last Updated:** January 14, 2026 (Late Night)
**Framework:** React 18 + Vite
**Version:** 1.2.0

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Core Application](#core-application)
3. [Component Organization](#component-organization)
4. [Role-Based Routing](#role-based-routing)
5. [State Management](#state-management)
6. [Styling Architecture](#styling-architecture)
7. [Key Components Reference](#key-components-reference)
8. [Hooks Reference](#hooks-reference)
9. [Utilities Reference](#utilities-reference)
10. [Data Flow Patterns](#data-flow-patterns)

---

## Project Structure

```
src/
├── App.jsx              # Main application component with routing
├── App.css              # Global application styles
├── main.jsx             # React entry point
├── index.css            # Base CSS reset and variables
│
├── assets/              # Static assets (images, logos)
│
├── components/          # React components (organized by feature)
│   ├── auth/            # Authentication components
│   ├── calendar/        # Calendar views
│   ├── common/          # Shared/reusable components
│   ├── dashboards/      # Role-specific dashboard components
│   ├── factoryMap/      # Factory map visualization (PIXI.js)
│   ├── floorplans/      # Floor plan viewer and markers
│   ├── it/              # IT admin tools
│   ├── layout/          # Layout components (Sidebar)
│   ├── pages/           # Full-page components
│   ├── projects/        # Project-related components
│   ├── reports/         # Executive reports
│   ├── sales/           # Sales pipeline components
│   └── workflow/        # Workflow tracking components
│
├── constants/           # Shared constants and configurations
│   └── salesStatuses.js # Sales status definitions
│
├── context/             # React Context providers
│   ├── AuthContext.jsx  # Authentication state
│   └── FeatureFlagContext.jsx # Feature flags
│
├── hooks/               # Custom React hooks
│   ├── useContacts.js   # Contact fetching hooks
│   ├── useFloorPlans.js # Floor plan hooks
│   └── useProjects.js   # Project data hooks
│
├── pages/               # (Legacy - migrated to components/pages)
│
├── styles/              # Additional style files
│
└── utils/               # Utility functions
    ├── supabaseClient.js # Supabase configuration
    ├── pdfUtils.js      # PDF generation
    ├── praxisImport.js  # Praxis CSV parsing
    └── itAnalytics.js   # IT dashboard analytics
```

---

## Core Application

### main.jsx

Entry point that wraps the app with error boundary:

```jsx
import { ErrorBoundary } from './components/common/ErrorBoundary';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

### App.jsx

Main application component handling:
- Supabase authentication state
- Role-based routing
- Layout structure (Sidebar + Content)
- Announcement banner
- Feature flag context

**Key Routes:**

| Path | Component | Access |
|------|-----------|--------|
| `/` | Dashboard (role-based) | All authenticated |
| `/dashboard` | Dashboard (role-based) | All authenticated |
| `/projects` | ProjectsPage | PM, Director, VP, PC |
| `/projects/:id` | ProjectDetails | PM, Director, VP, PC |
| `/calendar` | CalendarPage | All |
| `/tasks` | TasksPage | All |
| `/rfis` | RFIsPage | All |
| `/submittals` | SubmittalsPage | All |
| `/team` | TeamPage or SalesTeamPage | Director, VP, Sales_Manager |
| `/reports` | ExecutiveReports | Director, VP |
| `/directory` | DirectoryPage | All |
| `/users` | UserManagement | IT, IT_Manager, Admin |
| `/error-tracking` | ErrorTracking | IT, IT_Manager |
| `/security` | SecurityCenter | IT, IT_Manager |
| `/database` | DatabaseTools | IT, IT_Manager |
| `/settings` | SystemConfiguration | IT, IT_Manager |
| `/announcements` | AnnouncementManager | IT_Manager |
| `/feature-flags` | FeatureFlagManager | IT_Manager |
| `/sessions` | SessionManager | IT_Manager |

---

## Component Organization

### By Feature Domain

```
components/
├── auth/                    # Authentication
│   ├── Login.jsx            # Main login form
│   ├── Login_Option4.jsx    # Alternative login design
│   └── Login_Option5.jsx    # Alternative login design
│
├── calendar/                # Calendar System
│   ├── CalendarPage.jsx     # Main calendar container
│   ├── CalendarMonthView.jsx
│   ├── CalendarWeekView.jsx
│   └── CalendarDayView.jsx
│
├── common/                  # Shared Components
│   ├── AnnouncementBanner.jsx  # System announcements
│   ├── ContactPicker.jsx    # Directory contact selection
│   ├── ErrorBoundary.jsx    # Error handling
│   ├── FileAttachments.jsx  # File upload/display
│   └── Toast.jsx            # Toast notifications
│
├── dashboards/              # Role Dashboards
│   ├── VPDashboard.jsx      # VP view
│   ├── DirectorDashboard.jsx # Director view
│   ├── PMDashboard.jsx      # PM view
│   ├── PCDashboard.jsx      # Plant Controller view
│   ├── GanttTimeline.jsx    # Gantt chart component
│   ├── TeamWorkloadView.jsx # Workload visualization
│   └── RecentActivityFeed.jsx
│
├── floorplans/              # Floor Plan System
│   ├── FloorPlansTab.jsx    # Main tab component
│   ├── FloorPlanViewer.jsx  # Image viewer with zoom/pan
│   ├── FloorPlanMarker.jsx  # Marker component
│   ├── FloorPlanUploadModal.jsx
│   ├── AddMarkerModal.jsx
│   └── ItemDetailPanel.jsx
│
├── it/                      # IT Administration (13 components)
│   ├── ITDashboard.jsx      # IT home dashboard with modern stat cards
│   ├── UserManagement.jsx   # User CRUD with search, filter, role assignment
│   ├── CreateUserModal.jsx  # New user creation modal
│   ├── EditUserModal.jsx    # Edit user details modal
│   ├── ErrorTracking.jsx    # Error tickets with charts, trends, Kanban
│   ├── AnnouncementManager.jsx  # System announcements with targeting
│   ├── FeatureFlagManager.jsx   # Feature toggle management
│   ├── SessionManager.jsx       # Active session monitoring
│   ├── SecurityCenter.jsx       # Security metrics and alerts
│   ├── DatabaseTools.jsx        # Database diagnostics and stats
│   ├── SystemHealth.jsx         # System health monitoring
│   ├── SystemConfiguration.jsx  # Global settings management
│   ├── AuditLogViewer.jsx       # Activity audit trail
│   └── index.js             # Barrel exports
│
├── layout/                  # Application Layout
│   └── Sidebar.jsx          # Navigation sidebar with role-based items
│
├── pages/                   # Full Page Components
│   ├── ProjectsPage.jsx     # Projects list with filters
│   ├── TasksPage.jsx        # Global tasks view
│   ├── RFIsPage.jsx         # Global RFIs view
│   ├── SubmittalsPage.jsx   # Global submittals view
│   ├── DirectoryPage.jsx    # Company directory
│   ├── TeamPage.jsx         # Team management
│   ├── ClientsPage.jsx      # Clients/customers
│   └── AnalyticsPage.jsx    # Analytics dashboard
│
├── projects/                # Project Management
│   ├── ProjectDetails.jsx   # Main project detail view
│   ├── OverviewTab.jsx      # Project overview tab
│   ├── CreateProjectModal.jsx
│   ├── EditProjectModal.jsx
│   ├── PraxisImportModal.jsx # Praxis data import
│   ├── TasksView.jsx        # Tasks tab
│   ├── AddTaskModal.jsx
│   ├── EditTaskModal.jsx
│   ├── KanbanBoard.jsx      # Kanban view
│   ├── EditRFIModal.jsx
│   ├── AddRFIModal.jsx
│   ├── RFILogExport.jsx
│   ├── EditSubmittalModal.jsx
│   ├── AddSubmittalModal.jsx
│   ├── SubmittalLogExport.jsx
│   ├── AddMilestoneModal.jsx
│   ├── ProjectLog.jsx       # Activity log
│   ├── ProjectFiles.jsx     # Files tab
│   ├── ProjectCalendarMonth.jsx
│   ├── ProjectCalendarWeek.jsx
│   └── WorkflowTracker.jsx  # Phase progression
│
├── reports/                 # Executive Reports
│   └── ExecutiveReports.jsx # Report generation
│
├── sales/                   # Sales Pipeline
│   ├── SalesManagerDashboard.jsx  # Sales Manager view
│   ├── SalesRepDashboard.jsx      # Sales Rep view
│   ├── SalesDashboard.jsx   # Legacy sales dashboard
│   ├── SalesTeamPage.jsx    # Team performance
│   ├── QuoteForm.jsx        # Quote creation/edit
│   ├── QuoteDetail.jsx      # Quote detail view
│   ├── CustomerForm.jsx     # Customer management
│   └── PraxisQuoteImportModal.jsx
│
└── workflow/                # Workflow System
    ├── WorkflowTracker.jsx  # (duplicate of projects/)
    ├── StationDetailModal.jsx
    ├── ChangeOrderModal.jsx
    ├── DrawingVersionModal.jsx
    ├── WarningEmailModal.jsx
    ├── LongLeadFormBuilder.jsx
    ├── ColorSelectionFormBuilder.jsx
    ├── components/
    │   ├── StationNode.jsx  # React Flow node
    │   └── PulsingEdge.jsx  # React Flow edge
    ├── hooks/
    │   └── useWorkflowGraph.js
    └── visualizers/
        └── WorkflowCanvas.jsx # React Flow canvas
```

---

## Role-Based Routing

### User Roles

| Role | Code | Dashboard | Description |
|------|------|-----------|-------------|
| VP | `VP` | VPDashboard | Executive view, all factories |
| Director | `Director` | DirectorDashboard | Factory oversight |
| PM | `PM` | PMDashboard | Project manager |
| PC | `PC` | PCDashboard | Plant controller |
| Sales Manager | `Sales_Manager` | SalesManagerDashboard | Sales team lead |
| Sales Rep | `Sales_Rep` | SalesRepDashboard | Individual sales |
| IT Manager | `IT_Manager` | ITDashboard | IT administration |
| IT | `IT` | ITDashboard | IT staff |
| Admin | `Admin` | VPDashboard | System admin |

### Dashboard Routing Logic (App.jsx)

```jsx
const renderDashboard = () => {
  switch (user?.role) {
    case 'VP':
    case 'vp':
      return <VPDashboard />;
    case 'Director':
    case 'director':
      return <DirectorDashboard user={user} />;
    case 'PM':
    case 'pm':
      return <PMDashboard user={user} />;
    case 'PC':
    case 'pc':
      return <PCDashboard user={user} />;
    case 'IT':
    case 'it':
    case 'IT_Manager':
      return <ITDashboard user={user} />;
    case 'Sales_Manager':
    case 'sales_manager':
      return <SalesManagerDashboard user={user} />;
    case 'Sales_Rep':
    case 'sales_rep':
      return <SalesRepDashboard user={user} />;
    default:
      return <PMDashboard user={user} />;
  }
};
```

### Sidebar Navigation (role-based)

| Role | Navigation Items |
|------|------------------|
| VP, Director | Dashboard, Projects, Calendar, Tasks, Reports, Team, Directory |
| PM | Dashboard, Projects, Calendar, Tasks, Directory |
| PC | Dashboard, Projects, Calendar, Tasks, Directory |
| Sales_Manager | Dashboard, Pipeline, Customers, Calendar, Team, Projects (read-only), Directory |
| Sales_Rep | Dashboard, Pipeline, Customers, Calendar, Projects (read-only), Directory |
| IT, IT_Manager | Dashboard, User Management, Error Tracking, Security Center, Database Tools, Settings, Announcements, Feature Flags, Sessions, Factory Map |

---

## State Management

### Approach

The application uses **local React state** + **Supabase real-time** rather than global state management (Redux/Zustand).

### Patterns Used

1. **Component-Level State**
   ```jsx
   const [projects, setProjects] = useState([]);
   const [loading, setLoading] = useState(true);
   ```

2. **Context Providers**
   - `AuthContext` - User authentication state
   - `FeatureFlagContext` - Feature flag state

3. **Custom Hooks for Data Fetching**
   ```jsx
   const { contacts, loading, error, refetch } = useContacts();
   ```

4. **Prop Drilling** - Parent-to-child data flow
5. **Callback Props** - Child-to-parent communication

### AuthContext

```jsx
// context/AuthContext.jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Supabase auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch user profile from users table
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### FeatureFlagContext

```jsx
// context/FeatureFlagContext.jsx
const FeatureFlagContext = createContext();

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState({});

  useEffect(() => {
    // Fetch flags from Supabase
    // Set up real-time subscription
  }, []);

  const isEnabled = (flagKey) => {
    const flag = flags[flagKey];
    if (!flag?.is_enabled) return false;
    // Check role/factory/user targeting
    return true;
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}
```

---

## Styling Architecture

### Approach: CSS Variables + Inline Styles

The application primarily uses **CSS custom properties** (variables) defined in `index.css` and `App.css`, with component-specific styles written inline.

### CSS Variables (index.css)

```css
:root {
  /* Colors */
  --sunbelt-orange: #F7931E;
  --sunbelt-orange-dark: #E07900;

  /* Text */
  --text-primary: #e4e4e7;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;

  /* Backgrounds */
  --bg-primary: #18181b;
  --bg-secondary: #27272a;
  --bg-tertiary: #3f3f46;

  /* Borders */
  --border-color: #3f3f46;

  /* Status Colors */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.3);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.4);
}
```

### Inline Style Pattern

Components use inline styles with CSS variables:

```jsx
<div style={{
  padding: 'var(--space-md)',
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)'
}}>
  <h2 style={{
    color: 'var(--text-primary)',
    fontSize: '1.25rem',
    fontWeight: '600'
  }}>
    Title
  </h2>
</div>
```

### Component-Specific Classes (App.css)

Some reusable patterns are defined as classes:

```css
/* Buttons */
.btn-primary {
  background: var(--sunbelt-orange);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* Cards */
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

/* Loading spinner */
.loading-spinner {
  border: 3px solid var(--border-color);
  border-top-color: var(--sunbelt-orange);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}
```

---

## Key Components Reference

### Sidebar.jsx

Main navigation component. Features:
- Role-based navigation items
- Collapsible sections
- User profile display
- Dashboard type switcher (for Directors)
- Sales stats sidebar (for Sales roles)

**Props:** `user`, `currentPage`, `onNavigate`

---

### ProjectDetails.jsx

Main project detail view with tabbed interface.

**Tabs:**
1. Overview - Project health, timeline, blockers
2. Tasks - Task list/Kanban
3. RFIs - RFI log
4. Submittals - Submittal log
5. Floor Plans - Floor plan viewer
6. Files - File attachments
7. Calendar - Project calendar
8. Workflow - Workflow tracker
9. Activity - Project log

**Props:** `projectId` (from URL params)

---

### EditTaskModal.jsx

Task creation and editing modal.

**Features:**
- Title, description, priority, dates
- Internal/External assignment toggle
- Contact picker (directory contacts)
- External contact fields
- Milestone linking
- Workflow station linking
- File attachments

**Props:** `isOpen`, `onClose`, `task`, `projectId`, `onSave`

---

### EditRFIModal.jsx

RFI creation and editing modal.

**Features:**
- RFI number auto-generation
- Subject, question, answer fields
- Internal/External recipient toggle
- Due date tracking
- Spec section, drawing reference
- PDF export with factory logo
- Email draft generation

**Props:** `isOpen`, `onClose`, `rfi`, `projectId`, `onSave`

---

### ContactPicker.jsx

Reusable contact selection component.

**Features:**
- Type-ahead search (name, email, position)
- Factory grouping (project factory first)
- Department color coding
- Keyboard navigation
- External contact option
- Selected contact display with avatar

**Props:**
```jsx
<ContactPicker
  value={contactId}
  onChange={(contact) => setContact(contact)}
  projectFactory="NWBS"
  placeholder="Select assignee..."
  suggestedDepartments={['ENGINEERING', 'DRAFTING']}
  showExternal={true}
  onExternalSelect={() => setIsExternal(true)}
/>
```

---

### CalendarPage.jsx

Global calendar with role-based filtering.

**Features:**
- Month, Week, Day views
- Tasks, RFIs, Submittals, Milestones display
- Factory/project filtering
- ICS export
- Role-specific filtering:
  - PM: Only assigned projects
  - Sales: Only quote-linked projects
  - PC: Only factory projects

---

### SalesManagerDashboard.jsx

Sales manager's main view.

**Features:**
- Pipeline metrics (raw, weighted, win rate)
- Sales funnel visualization
- Quote aging indicators
- Building type breakdown
- Team performance overview
- PM-flagged quotes section
- Quote cards with Praxis fields

**Imports from salesStatuses.js:**
```jsx
import {
  STATUS_CONFIG, ACTIVE_STATUSES, BUILDING_TYPES,
  FACTORIES, formatCurrency, getDaysAgo, getAgingColor
} from '../../constants/salesStatuses';
```

---

### DirectoryPage.jsx

Company-wide contact directory.

**Features:**
- Search by name, email, position
- Filter by factory, department
- Grouped by factory (expandable)
- Contact cards with department color coding
- Detail modal with all contact info
- Quick contact actions (email, phone)

---

## Hooks Reference

### useContacts.js

Fetches contacts from `users` and `factory_contacts` tables.

```jsx
import { useContacts, useFactoryContacts, useContactsByRole } from '../hooks/useContacts';

// All contacts
const { contacts, users, factoryContacts, loading, error, refetch } = useContacts();

// Filter by factory
const { contacts, loading } = useFactoryContacts('NWBS');

// Filter by role/department
const { contacts, loading } = useContactsByRole('SALES');
```

**Note:** This hook uses `factory_contacts` table. For `directory_contacts`, use the Supabase client directly.

---

### useFloorPlans.js

Fetches floor plans for a project.

```jsx
const { floorPlans, loading, refetch } = useFloorPlans(projectId);
```

---

### useProjects.js

Fetches projects with optional filtering.

```jsx
const { projects, loading, error, refetch } = useProjects({ factory: 'NWBS' });
```

---

### useWorkflowGraph.js (workflow/hooks/)

Transforms workflow data for React Flow visualization.

```jsx
import { useWorkflowGraph } from '../hooks/useWorkflowGraph';

const { nodes, edges, progress, loading } = useWorkflowGraph(projectId);
```

---

## Utilities Reference

### supabaseClient.js

Supabase configuration and client instance.

```jsx
import { supabase } from '../utils/supabaseClient';

// Query example
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('factory', 'NWBS');
```

---

### pdfUtils.js

PDF generation utilities.

```jsx
import { generateRFIPDF, getFactoryLogoBase64 } from '../utils/pdfUtils';

// Generate RFI PDF
const pdfContent = generateRFIPDF(rfi, project, factoryLogo);
```

---

### praxisImport.js

Praxis CSV parsing and validation.

```jsx
import { parseCSV, validatePraxisData, mapPraxisFields } from '../utils/praxisImport';

const parsed = await parseCSV(file);
const validated = validatePraxisData(parsed);
const mapped = mapPraxisFields(validated);
```

---

### itAnalytics.js

IT dashboard analytics calculations.

```jsx
import { calculateSecurityMetrics, calculateSystemHealth } from '../utils/itAnalytics';
```

---

## Data Flow Patterns

### 1. List → Detail → Modal Pattern

```
ProjectsPage (list)
    ↓ click project
ProjectDetails (detail view)
    ↓ click task
EditTaskModal (modal)
    ↓ save
Supabase → Refetch → Update UI
```

### 2. Parent-Child Data Flow

```jsx
// Parent component fetches data
function ProjectDetails({ projectId }) {
  const [tasks, setTasks] = useState([]);

  const handleTaskUpdate = async (updatedTask) => {
    await supabase.from('tasks').update(updatedTask).eq('id', updatedTask.id);
    refetchTasks();
  };

  return (
    <TasksView
      tasks={tasks}
      onTaskClick={(task) => setSelectedTask(task)}
    />
    <EditTaskModal
      task={selectedTask}
      onSave={handleTaskUpdate}
    />
  );
}
```

### 3. Supabase Query Pattern

```jsx
// Standard fetch pattern
const fetchData = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*, related_table(*)')
      .eq('filter_field', filterValue)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setData(data);
  } catch (err) {
    console.error('Error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, [filterValue]);
```

### 4. Modal Save Pattern

```jsx
const handleSave = async () => {
  setIsSaving(true);
  try {
    const payload = {
      ...formData,
      updated_at: new Date().toISOString()
    };

    const { error } = isNew
      ? await supabase.from('table').insert(payload)
      : await supabase.from('table').update(payload).eq('id', item.id);

    if (error) throw error;

    toast.success('Saved successfully');
    onSave?.();
    onClose();
  } catch (err) {
    toast.error(`Error: ${err.message}`);
  } finally {
    setIsSaving(false);
  }
};
```

---

## Icon Library

The application uses **Lucide React** for icons.

```jsx
import {
  Search, Plus, Edit2, Trash2, X,
  ChevronDown, ChevronRight, ChevronLeft,
  Building2, User, Users, Mail, Phone,
  FileText, Clock, CheckCircle, AlertTriangle,
  Calendar, Folder, Settings, Bell
} from 'lucide-react';

// Usage
<Search size={16} style={{ color: 'var(--text-tertiary)' }} />
```

---

## Build & Development

### Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Build Output

- **Build Size:** ~1.5MB (uncompressed), ~375KB (gzip)
- **Initial Load:** ~2-3 seconds

---

## Testing Notes

1. Test with different user roles to verify routing
2. Test factory-filtered views (PC, Sales)
3. Test contact picker in all modal forms
4. Test responsive layout at different widths
5. Verify PDF exports include correct factory logos
