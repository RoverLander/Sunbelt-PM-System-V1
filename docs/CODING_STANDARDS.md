
# Coding Standards

**Last Updated:** January 17, 2026
**Version:** 1.0
**Status:** Living Document

---

## Table of Contents

1. [File Organization](#file-organization)
2. [Naming Conventions](#naming-conventions)
3. [Component Standards](#component-standards)
4. [State Management](#state-management)
5. [Error Handling](#error-handling)
6. [Comments &amp; Documentation](#comments-documentation)
7. [Performance Guidelines](#performance-guidelines)
8. [Testing Standards](#testing-standards)
9. [Git Workflow](#git-workflow)
10. [Code Review Checklist](#code-review-checklist)

---

## File Organization

### Directory Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication
│   ├── common/         # Reusable components
│   ├── dashboards/     # Role dashboards
│   ├── layout/         # Layout components
│   ├── modals/         # Modal dialogs
│   ├── pages/          # Full pages
│   └── production/     # Plant GM features
├── contexts/           # React Context providers
├── hooks/              # Custom hooks
├── services/           # API/business logic
├── utils/              # Pure utility functions
├── styles/             # CSS files
└── pwa/                # PWA-specific code
```

### File Naming

**CRITICAL: Use kebab-case for ALL files**

```
✅ CORRECT:
- task-card.jsx
- edit-task-modal.jsx
- project-details.jsx
- use-projects.js
- supabase-client.js
- error-handling.js

❌ WRONG:
- TaskCard.jsx
- EditTaskModal.jsx
- useProjects.js
```

**Component Files:**

- Components: `component-name.jsx`
- Services: `service-name.js`
- Hooks: `use-hook-name.js`
- Utils: `utility-name.js`
- Styles: `style-name.css`

---

## Naming Conventions

### Components (PascalCase in code, kebab-case files)

```javascript
// File: task-card.jsx
export default function TaskCard({ task }) {
  return <div>{task.title}</div>;
}
```

### Functions (camelCase)

```javascript
// ✅ Verb-first for actions
function handleSubmit() { }
function fetchProjects() { }
function calculateTotal() { }

// ✅ Boolean checks: is/has/can prefix
function isTaskOverdue(task) { }
function hasPermission(user, action) { }
function canEditProject(user, project) { }

// ✅ Event handlers: handle prefix
function handleClick() { }
function handleTaskUpdate() { }
```

### Variables (camelCase)

```javascript
// ✅ Descriptive names
const projectList = [];
const isLoading = true;
const hasError = false;
const userPermissions = {};

// ❌ Avoid generic names
const data = [];
const flag = true;
const temp = {};
```

### Constants (SCREAMING_SNAKE_CASE)

```javascript
// File: constants.js
export const TASK_STATUSES = ['Not Started', 'In Progress', 'Completed'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const API_BASE_URL = 'https://api.example.com';
```

### Database Fields (snake_case)

```sql
-- Match database conventions
SELECT 
  project_id,
  owner_id,
  created_at,
  updated_at
FROM projects;
```

---

## Component Standards

### File Header Block

**REQUIRED for all components:**

```javascript
// ============================================================================
// task-card.jsx
// ============================================================================
// Displays a task card with status badge, priority, and assignee info.
//
// FEATURES:
// - Click to open task detail modal
// - Drag-and-drop support for Kanban boards
// - Color-coded status and priority indicators
//
// DEPENDENCIES:
// - lucide-react: Icons
// - date-fns: Date formatting
//
// PROPS:
// - task: Task object with id, title, status, priority, due_date
// - onClick: Optional callback when card is clicked
// - draggable: Boolean to enable drag-and-drop
//
// FIXES (2026-01-17):
// - Added keyboard navigation support
// - Fixed status color not updating on drag
// ============================================================================

import React from 'react';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
```

### Component Structure Template

```javascript
// ============================================================================
// STATE - DATA
// ============================================================================
const [tasks, setTasks] = useState([]);
const [projects, setProjects] = useState([]);

// ============================================================================
// STATE - UI
// ============================================================================
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);

// ============================================================================
// STATE - FILTERS
// ============================================================================
const [filterStatus, setFilterStatus] = useState('all');
const [searchTerm, setSearchTerm] = useState('');

// ============================================================================
// CONTEXTS & HOOKS
// ============================================================================
const { user } = useAuth();
const navigate = useNavigate();

// ============================================================================
// EFFECTS
// ============================================================================
useEffect(() => {
  if (user) fetchData();
}, [user]);

// ============================================================================
// HANDLERS
// ============================================================================
const handleSubmit = async (e) => {
  e.preventDefault();
  // ...
};

// ============================================================================
// RENDER HELPERS
// ============================================================================
const renderTaskCard = (task) => {
  return <TaskCard key={task.id} task={task} />;
};

// ============================================================================
// RENDER
// ============================================================================
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;

return (
  <div>
    {/* Component JSX */}
  </div>
);
```

### Component Organization by Size

**Small Components (< 100 lines):** Single file

**Medium Components (100-300 lines):**

- Single file
- Extract complex logic to hooks/utils
- Consider helper components in same file

**Large Components (> 300 lines):**

- Split into sub-components
- Extract to separate files
- Use composition

```javascript
// Large component example: project-details.jsx
import OverviewTab from './overview-tab.jsx';
import TasksTab from './tasks-tab.jsx';
import FilesTab from './files-tab.jsx';

export default function ProjectDetails() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div>
      <Tabs value={activeTab} onChange={setActiveTab} />
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'tasks' && <TasksTab />}
      {activeTab === 'files' && <FilesTab />}
    </div>
  );
}
```

---

## State Management

### useState Organization

**Group by purpose, not alphabetically:**

```javascript
// ✅ GOOD: Grouped by purpose
// Data
const [projects, setProjects] = useState([]);
const [tasks, setTasks] = useState([]);

// UI
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Filters
const [searchTerm, setSearchTerm] = useState('');
const [filterStatus, setFilterStatus] = useState('all');

// ❌ BAD: Alphabetical or random
const [error, setError] = useState(null);
const [filterStatus, setFilterStatus] = useState('all');
const [loading, setLoading] = useState(true);
const [projects, setProjects] = useState([]);
```

### When to Use Different State Patterns

**Individual useState (default):**

```javascript
const [name, setName] = useState('');
const [email, setEmail] = useState('');
```

**State object (related fields):**

```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: ''
});
```

**useReducer (complex state logic):**

```javascript
const [state, dispatch] = useReducer(reducer, {
  data: [],
  loading: true,
  error: null,
  filters: { status: 'all', search: '' }
});
```

### Context Pattern

**Create focused contexts, not one giant context:**

```javascript
// ✅ GOOD: Separate contexts
const AuthContext = createContext();
const ThemeContext = createContext();
const NotificationContext = createContext();

// ❌ BAD: Everything in one
const AppContext = createContext();
// value={{ user, theme, notifications, settings, ... }}
```

---

## Error Handling

### Standard Error Utilities

**Use centralized error handling:**

```javascript
import { handleSupabaseError } from '../utils/error-handling.js';

// In component
const handleSave = async () => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(formData)
      .select()
      .single();
  
    if (error) {
      const message = handleSupabaseError(error, 'create task');
      showToast(message, 'error');
      return;
    }
  
    showToast('Task created successfully', 'success');
    onSuccess(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    showToast('An unexpected error occurred', 'error');
  }
};
```

### Console Logging Policy

**Development:**

```javascript
// ✅ Use console.group for debugging
console.group('🔍 Task Form Submit');
console.log('Form Data:', formData);
console.log('User:', user);
console.log('Validation:', isValid);
console.groupEnd();

// ✅ Use console.warn for warnings
console.warn('Task has no due date');

// ✅ Use console.error for errors
console.error('Failed to save task:', error);
```

**Production:**

```javascript
// ✅ Keep console.error and console.warn
console.error('Database error:', error);
console.warn('Feature flag disabled');

// ❌ Remove console.log
// console.log('Debug info'); // Remove before commit
```

**Use ESLint rule:**

```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Error Reporting

**Log to system_errors table:**

```javascript
import { logError } from '../utils/error-tracking.js';

try {
  await dangerousOperation();
} catch (error) {
  // Log to database
  await logError({
    error_message: error.message,
    error_stack: error.stack,
    component_stack: 'ProjectDetails',
    url: window.location.href,
    user_id: user?.id
  });
  
  // Show user-friendly message
  showToast('Something went wrong. Our team has been notified.', 'error');
}
```

---

## Comments & Documentation

### JSDoc for Functions

**Use comprehensive JSDoc:**

```javascript
/**
 * Fetches all projects for a given factory with optional filtering
 * 
 * @param {string} factoryId - UUID of the factory
 * @param {object} [filters] - Optional filter object
 * @param {string} [filters.status] - Filter by project status
 * @param {string} [filters.pmId] - Filter by project manager ID
 * @returns {Promise<Array>} Array of project objects with PM and factory details
 * @throws {Error} If database query fails
 * 
 * @example
 * const projects = await fetchProjects('factory-uuid', { status: 'Active' });
 */
export async function fetchProjects(factoryId, filters = {}) {
  // Implementation
}
```

### Section Comments

**Use established format:**

```javascript
// ============================================================================
// MAJOR SECTION
// ============================================================================

// ==========================================================================
// SUBSECTION
// ==========================================================================

// Standard comment for explanation
const something = value;

// ✅ ADDED: Inline comment for new code
const newFeature = true;

// ✅ FIXED: Inline comment for bug fix
const bugFix = correctValue;
```

### When to Comment

**DO comment:**

- Complex business logic
- Non-obvious workarounds
- Magic numbers
- Regex patterns
- Performance optimizations
- Security considerations

**DON'T comment:**

- Obvious code
- Function/variable names (use descriptive names instead)
- TODO items (use GitHub Issues instead)

```javascript
// ✅ GOOD: Explains WHY
// Subtract 1 because Supabase counts are inclusive
const pageCount = Math.ceil((totalCount - 1) / pageSize);

// ❌ BAD: Explains WHAT (obvious from code)
// Set loading to true
setLoading(true);
```

---

## Performance Guidelines

### React Performance

**1. Memoization:**

```javascript
// Memoize expensive calculations
const sortedTasks = useMemo(() => {
  return tasks
    .filter(t => t.status !== 'Completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
}, [tasks]);

// Memoize callbacks passed to children
const handleTaskClick = useCallback((taskId) => {
  navigate(`/tasks/${taskId}`);
}, [navigate]);
```

**2. Component Optimization:**

```javascript
// Prevent unnecessary re-renders
const TaskCard = React.memo(({ task, onUpdate }) => {
  return <div>{task.title}</div>;
}, (prevProps, nextProps) => {
  // Only re-render if task actually changed
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.version === nextProps.task.version;
});
```

**3. Code Splitting:**

```javascript
// Lazy load heavy components
const WorkflowTracker = lazy(() => import('./workflow-tracker.jsx'));

// Usage
<Suspense fallback={<LoadingSpinner />}>
  <WorkflowTracker />
</Suspense>
```

### Database Queries

**Select only needed columns:**

```javascript
// ✅ GOOD
const { data } = await supabase
  .from('projects')
  .select('id, name, status, owner_id');

// ❌ BAD
const { data } = await supabase
  .from('projects')
  .select('*');
```

**Use pagination:**

```javascript
const PAGE_SIZE = 50;
const { data, count } = await supabase
  .from('tasks')
  .select('*', { count: 'exact' })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  .order('created_at', { ascending: false });
```

### Image Optimization

**Automatic compression on upload:**

```javascript
import Compressor from 'compressorjs';

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      success: resolve,
      error: reject
    });
  });
}
```

**Lazy loading images:**

```javascript
<img 
  src={imageUrl} 
  loading="lazy"  // Native lazy loading
  alt={description}
/>
```

---

## Testing Standards

### Testing Levels (Future Implementation)

**Level 1: Critical Paths Only**

- Authentication flow
- Data integrity operations (create/update/delete)
- Payment processing (if applicable)
- RLS policy enforcement

**Level 2: Business Logic + Critical Paths**

- Level 1 +
- All service layer functions
- Complex utility functions
- State management logic

**Level 3: 80% Coverage**

- Level 2 +
- Component rendering
- User interactions
- Edge cases

**Level 4: 100% Coverage**

- Everything
- Error boundaries
- Loading states
- Empty states

### Test File Structure

```
src/
├── components/
│   ├── task-card.jsx
│   └── task-card.test.jsx  ✅ Adjacent to component
├── services/
│   ├── project-service.js
│   └── project-service.test.js
└── utils/
    ├── date-utils.js
    └── date-utils.test.js
```

### Test Naming Convention

```javascript
// File: task-card.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TaskCard from './task-card.jsx';

describe('TaskCard', () => {
  it('renders task title', () => {
    const task = { id: '1', title: 'Test Task' };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
  
  it('shows overdue badge when task is past due date', () => {
    const task = { 
      id: '1', 
      title: 'Test', 
      due_date: '2020-01-01' 
    };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });
});
```

---

## Git Workflow

### Commit Message Format

**Use Conventional Commits:**

```
feat: Add worker PIN authentication
fix: Resolve PC role factory filtering bug
docs: Update coding standards
style: Format task-card component
refactor: Extract validation logic to utility
test: Add tests for project service
chore: Update dependencies
```

**Message Structure:**

```
<type>: <subject>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code change (no feat/fix)
- `test`: Add/update tests
- `chore`: Build process, dependencies

**Examples:**

```bash
# Simple
git commit -m "feat: Add export to Excel for RFI log"

# With body
git commit -m "fix: Resolve memory leak in task subscription

The Supabase subscription was not being cleaned up on component
unmount. Added proper cleanup in useEffect return function."

# With ticket reference
git commit -m "feat: Add Plant GM dashboard (PGM-008)

Implements overview grid with production metrics, integrates
production line canvas and calendar components."
```

### Branch Naming

```bash
# Features
feature/worker-auth
feature/pgm-dashboard
feature/inventory-receiving

# Bugs
fix/pc-factory-filtering
fix/memory-leak-subscriptions

# Documentation
docs/coding-standards
docs/architecture-update
```

---

## Code Review Checklist

### Pre-Commit Checklist

- [ ] Code follows file naming convention (kebab-case)
- [ ] File header block present with description
- [ ] No `console.log` in production code (only `warn`/`error`)
- [ ] All functions have JSDoc comments
- [ ] Status values match constants (check `constants.js`)
- [ ] Loading states implemented for async operations
- [ ] Error handling present with user-friendly messages
- [ ] No memory leaks (useEffect cleanup functions)
- [ ] Components under 300 lines (or split into sub-components)

### Pull Request Checklist

- [ ] Follows architecture (correct directory structure)
- [ ] RLS policies added if touching database
- [ ] Database migration file created (if schema changes)
- [ ] No breaking changes to existing APIs
- [ ] Code is self-documenting (descriptive names)
- [ ] Performance considered (memoization, pagination)
- [ ] Accessibility considered (keyboard navigation, ARIA labels)
- [ ] Mobile-responsive (if UI component)
- [ ] Tests added (when testing framework available)

### Code Review Focus Areas

**Security:**

- Are user inputs sanitized?
- Are RLS policies correct?
- Are API keys/secrets in environment variables?

**Performance:**

- Are queries optimized?
- Are images compressed?
- Are components memoized appropriately?

**Maintainability:**

- Is code DRY (Don't Repeat Yourself)?
- Are utilities extracted from components?
- Is state management logical?

---

## Exceptions & Special Cases

### When to Break Rules

**Rule exceptions require comment:**

```javascript
// ✅ EXCEPTION: Using console.log for production monitoring
// This is intentionally left in to track API latency
console.log('[PERF]', endpoint, duration);

// ✅ EXCEPTION: Component > 300 lines
// This component is intentionally large due to complex state machine
// that would be harder to understand if split across files
export default function ComplexWorkflow() {
  // 400 lines
}
```

---

## Appendix: Quick Reference

### Naming Quick Reference

| Type                  | Convention           | Example           |
| --------------------- | -------------------- | ----------------- |
| **Files**       | kebab-case           | `task-card.jsx` |
| **Components**  | PascalCase (in code) | `TaskCard`      |
| **Functions**   | camelCase            | `handleSubmit`  |
| **Variables**   | camelCase            | `isLoading`     |
| **Constants**   | SCREAMING_SNAKE      | `MAX_FILE_SIZE` |
| **CSS Classes** | kebab-case           | `task-card`     |
| **Database**    | snake_case           | `project_id`    |

### Import Order

```javascript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. External libraries
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

// 3. Internal - Contexts
import { useAuth } from '../contexts/auth-context.jsx';

// 4. Internal - Components
import TaskCard from './task-card.jsx';
import LoadingSpinner from '../common/loading-spinner.jsx';

// 5. Internal - Services/Utils
import { fetchProjects } from '../services/project-service.js';
import { formatDate } from '../utils/date-utils.js';

// 6. Styles (if any)
import './project-list.css';
```

---

**This is a living document. Propose changes via pull request.**

**Last Updated:** January 17, 2026 by Matthew McDaniel
