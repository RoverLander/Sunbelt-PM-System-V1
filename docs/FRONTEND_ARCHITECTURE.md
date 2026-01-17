# Frontend Architecture Reference

**Last Updated:** January 17, 2026
**Framework:** React 18 + Vite + PWA
**Version:** 1.4.3

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
11. [PWA Mobile Floor App](#pwa-mobile-floor-app)

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
│   ├── index.js         # Central hook exports
│   ├── useContacts.js   # Contact fetching hooks
│   ├── useFloorPlans.js # Floor plan hooks
│   ├── useProjects.js   # Project data hooks
│   ├── useInterval.js   # Safe interval with cleanup
│   ├── useDebounce.js   # Value debouncing
│   ├── useAsyncEffect.js # Async effects with cancellation
│   └── useEventListener.js # Event listeners with cleanup
│
├── pages/               # (Legacy - migrated to components/pages)
│
├── styles/              # Additional style files
│
├── utils/               # Utility functions
│   ├── supabaseClient.js # Supabase configuration
│   ├── pdfUtils.js      # PDF generation
│   ├── praxisImport.js  # Praxis CSV parsing
│   └── itAnalytics.js   # IT dashboard analytics
│
└── pwa/                 # PWA Mobile Floor App (separate from desktop)
    ├── index.js         # Module barrel exports
    ├── PWAApp.jsx       # Main PWA app component
    ├── contexts/
    │   └── WorkerAuthContext.jsx  # Worker PIN auth context
    ├── components/
    │   ├── auth/
    │   │   └── WorkerLogin.jsx    # PIN login screen
    │   ├── layout/
    │   │   ├── PWAShell.jsx       # App shell with header/nav
    │   │   └── BottomNav.jsx      # Bottom navigation (5 items)
    │   └── common/
    │       └── OfflineBanner.jsx  # Offline status indicator
    └── pages/
        ├── PWAHome.jsx            # Home dashboard page
        └── ModuleLookup.jsx       # Module search with autocomplete
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
- **PWA route detection** - Routes starting with `/pwa` render PWAApp instead of desktop app

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
| `/pwa/*` | PWAApp | Workers (PIN auth) |

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
│   ├── Skeleton.jsx         # Loading placeholders (shimmer effects)
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
│   ├── SystemConfiguration.jsx  # Global settings (9 sections: email, notifications,
│   │                             #   features, performance, cache, environment, status,
│   │                             #   security, projects, calendar, RFI/submittal, factory)
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

### Memory Leak Prevention Hooks (src/hooks/)

These hooks prevent common React memory leaks by handling cleanup automatically.

**Import all hooks from central barrel:**
```jsx
import { useInterval, useDebounce, useAsyncEffect, useEventListener } from '../hooks';
```

#### useInterval

Safe setInterval with automatic cleanup on unmount.

```jsx
import { useInterval } from '../hooks';

// Fetch data every 5 seconds
useInterval(() => fetchData(), 5000);

// Pause when inactive (pass null)
useInterval(() => fetchData(), isActive ? 5000 : null);
```

#### useDebounce

Debounces a value with automatic timeout cleanup.

```jsx
import { useDebounce } from '../hooks';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) performSearch(debouncedSearch);
}, [debouncedSearch]);
```

#### useAsyncEffect

Async effects with cancellation to prevent setState on unmounted components.

```jsx
import { useAsyncEffect } from '../hooks';

useAsyncEffect(async (isCancelled) => {
  const data = await fetchData();
  if (isCancelled()) return; // Check before setState
  setData(data);
}, [dependency]);
```

#### useEventListener

Event listeners with automatic cleanup.

```jsx
import { useEventListener } from '../hooks';

// Window resize
useEventListener('resize', () => setWidth(window.innerWidth));

// Keyboard shortcuts
useEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Custom element
useEventListener('scroll', handleScroll, containerRef.current);
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

- **Total Build Size:** ~2.5MB (optimized from 3.8MB - 34% reduction)
- **Code Splitting:** Vendor chunks separated via Vite manualChunks
  - `vendor-react`: react, react-dom (141KB)
  - `vendor-dates`: date-fns (77KB)
  - `vendor-supabase`: @supabase/supabase-js (68KB)
  - `vendor-icons`: lucide-react (294KB)
  - `vendor-flow`: @xyflow/react (230KB)
  - `vendor-excel`: exceljs (536KB)
- **Main Bundle:** ~620KB
- **Initial Load:** ~2-3 seconds

---

## Testing Notes

1. Test with different user roles to verify routing
2. Test factory-filtered views (PC, Sales)
3. Test contact picker in all modal forms
4. Test responsive layout at different widths
5. Verify PDF exports include correct factory logos

---

## PWA Mobile Floor App

### Overview

The PWA (Progressive Web App) is a mobile-optimized application for factory floor workers. It runs within the same codebase but has its own routing, authentication, and UI components.

**Key Characteristics:**
- **Separate auth system** - Workers use PIN-based authentication (not Supabase Auth)
- **Mobile-first UI** - Touch-friendly components, bottom navigation
- **Offline capable** - Workbox caching for API and static assets
- **Installable** - Can be added to home screen as an app

---

### PWA Routing

The PWA is detected and rendered in `App.jsx`:

```jsx
import { PWAApp } from './pwa';

function App() {
  // Detect PWA routes
  const isPWARoute = window.location.pathname.startsWith('/pwa');

  if (isPWARoute) {
    return <PWAApp />;
  }

  // Regular desktop app
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
```

---

### PWA Components

#### PWAApp.jsx

Root component that wraps the PWA with WorkerAuthProvider and handles view routing.

```jsx
export default function PWAApp() {
  return (
    <WorkerAuthProvider>
      <PWAContent />
    </WorkerAuthProvider>
  );
}
```

**Views:** home, modules, qc, inventory, more

---

#### WorkerAuthContext.jsx

Context provider for worker PIN authentication. Separate from the main AuthContext used by desktop app.

**Provides:**
- `worker` - Current authenticated worker object
- `factoryId` - Worker's factory
- `isLead` - Whether worker is a station lead
- `isAuthenticated` - Login state
- `login(employeeId, pin)` - PIN login function
- `logout()` - Terminate session
- `sessionTimeRemaining` - Minutes until session expires

---

#### WorkerLogin.jsx

Mobile-optimized PIN login screen.

**Features:**
- Employee ID input
- 4-6 digit PIN input (password mode)
- Lockout warning (after 3 failed attempts)
- Loading state during authentication

---

#### PWAShell.jsx

App shell layout with header, content area, and bottom navigation.

**Props:**
- `title` - Header title
- `currentView` - Active navigation item
- `onViewChange` - Navigation callback
- `children` - Page content

---

#### BottomNav.jsx

Mobile bottom navigation bar with 5 items.

**Navigation Items:**
| ID | Label | Icon | Access |
|----|-------|------|--------|
| home | Home | Home | All workers |
| modules | Modules | Search | All workers |
| qc | QC | ClipboardCheck | Leads only (`is_lead = true`) |
| inventory | Inventory | Package | All workers |
| more | More | MoreHorizontal | All workers |

---

#### OfflineBanner.jsx

Shows connection status and sync state.

**States:**
- **Offline (red)** - "Offline (duration) - Changes will sync when connected"
- **Syncing (yellow)** - "Syncing changes..."
- **Back online (green)** - "Back online" with refresh button

---

#### PWAHome.jsx

Home dashboard page with quick actions and activity stats.

**Sections:**
1. Greeting with worker name and factory
2. Quick Actions grid (Find Module, QC Inspection, Receive Inventory)
3. Today's Activity stats (Pending, Completed, Issues)
4. Recent Activity list

---

#### ModuleLookup.jsx

Module search page with autocomplete functionality.

**Features:**
- Debounced search (300ms) with minimum 2 characters
- Search by serial number or project name
- Module detail card with full information
- Recent searches persisted to localStorage (last 5)
- Status badge with color coding
- Station location display

**Components:**
- `ModuleLookup` - Main search page
- `ModuleDetailCard` - Full module information display

**Uses:** `searchModules()` and `getModuleById()` from modulesService.js

---

### PWA Services

The PWA uses dedicated services for worker-specific functionality:

| Service | File | Purpose |
|---------|------|---------|
| workerAuthService | `src/services/workerAuthService.js` | PIN login, session management |
| modulesService | `src/services/modulesService.js` | Module search, lookup, status |
| purchaseOrdersService | `src/services/purchaseOrdersService.js` | PO lookup for inventory receiving |
| inventoryReceiptsService | `src/services/inventoryReceiptsService.js` | Receipt tracking with photos |

---

### PWA Infrastructure

#### Vite PWA Plugin (vite.config.js)

```javascript
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
        handler: 'NetworkFirst',
        options: { cacheName: 'supabase-api', networkTimeoutSeconds: 10 }
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/,
        handler: 'CacheFirst',
        options: { cacheName: 'supabase-storage' }
      }
    ]
  },
  manifest: {
    name: 'Sunbelt Floor App',
    short_name: 'Floor App',
    start_url: '/pwa/',
    scope: '/pwa/',
    display: 'standalone',
    theme_color: '#0ea5e9',
    background_color: '#18181b'
  }
})
```

---

#### Supabase Edge Function (worker-auth)

Custom authentication for workers using PIN instead of email/password.

**Location:** `supabase/functions/worker-auth/index.ts`

**Endpoints:**
- `POST /worker-auth` - Login with employee_id + PIN
- Returns JWT token valid for 8 hours

**Security:**
- bcrypt password hashing
- 3-attempt lockout (15 minute cooldown)
- JWT signed with Supabase secret

---

### PWA Dependencies

```json
{
  "dependencies": {
    "idb": "^8.0.0"           // IndexedDB wrapper for offline storage
  },
  "devDependencies": {
    "vite-plugin-pwa": "^0.21.1"  // PWA manifest and service worker
  }
}
```

---

### Testing PWA

1. **Install as PWA:**
   - Open `/pwa` in Chrome/Safari
   - Use "Add to Home Screen" option

2. **Test PIN Login:**
   - Enter valid employee_id + PIN
   - Verify session persists on refresh
   - Test lockout after 3 failed attempts

3. **Test Offline:**
   - Disconnect network
   - Verify offline banner appears
   - Verify cached pages still load

4. **Test Navigation:**
   - Verify bottom nav switches views
   - Verify QC tab only visible for leads
