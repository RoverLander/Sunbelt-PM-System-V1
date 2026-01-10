# Contributing Guide & Project Instructions

**Last Updated:** January 10, 2026

This document provides guidelines for developing and contributing to the Sunbelt PM System.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Architecture](#project-architecture)
3. [Code Style Guide](#code-style-guide)
4. [Component Patterns](#component-patterns)
5. [State Management](#state-management)
6. [Database Guidelines](#database-guidelines)
7. [Adding New Features](#adding-new-features)
8. [Testing](#testing)
9. [Git Workflow](#git-workflow)

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Git
- Supabase account (for database)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/Sunbelt-PM-System-V1.git
cd Sunbelt-PM-System-V1

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# VITE_SUPABASE_URL=your-url
# VITE_SUPABASE_ANON_KEY=your-key

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Project Architecture

### Directory Structure

```
src/
├── components/
│   ├── auth/              # Authentication (Login, etc.)
│   ├── calendar/          # Calendar views
│   ├── common/            # Shared components (buttons, inputs)
│   ├── dashboards/        # Role-specific dashboard components
│   │   ├── VPDashboard.jsx
│   │   ├── DirectorDashboard.jsx
│   │   ├── PMDashboard.jsx
│   │   └── PCDashboard.jsx
│   ├── floorplans/        # Floor plan viewer and markers
│   ├── pages/             # Top-level page components
│   │   ├── ProjectsPage.jsx
│   │   ├── TasksPage.jsx
│   │   ├── RFIsPage.jsx
│   │   └── SubmittalsPage.jsx
│   ├── projects/          # Project-related components
│   │   ├── ProjectDetails.jsx
│   │   ├── AddTaskModal.jsx
│   │   ├── EditTaskModal.jsx
│   │   ├── AddRFIModal.jsx
│   │   └── ...
│   └── workflow/          # Workflow tracker components
├── context/
│   └── AuthContext.jsx    # Authentication context
├── hooks/
│   ├── useContacts.js     # Fetch users + factory contacts
│   └── ...
├── utils/
│   ├── supabaseClient.js  # Supabase configuration
│   ├── emailUtils.js      # Email draft generation
│   ├── excelExport.js     # Excel file generation
│   ├── pdfUtils.js        # PDF generation
│   └── icsUtils.js        # Calendar export
├── App.jsx                # Main app with routing
├── App.css                # Global styles
└── main.jsx               # Entry point
```

### Key Files

| File | Purpose |
|------|---------|
| `App.jsx` | Main component, routing, dashboard selection |
| `AuthContext.jsx` | Authentication state, user data |
| `supabaseClient.js` | Supabase client initialization |
| `App.css` | CSS variables, global styles |

---

## Code Style Guide

### General Principles

1. **Readability over cleverness** - Write code that's easy to understand
2. **Consistency** - Follow existing patterns in the codebase
3. **Self-documenting** - Use clear variable/function names
4. **DRY** - Don't repeat yourself, but don't over-abstract

### JavaScript/React

```javascript
// Use functional components with hooks
function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);

  // Group hooks at the top
  const { user } = useAuth();
  const { data } = useContacts();

  // Event handlers with "handle" prefix
  const handleClick = () => { ... };
  const handleSubmit = async (e) => { ... };

  // Helper functions
  const formatValue = (val) => { ... };

  // Early returns for loading/error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {/* JSX content */}
    </div>
  );
}
```

### Naming Conventions

```javascript
// Components: PascalCase
function ProjectDetails() { }
function AddTaskModal() { }

// Files: PascalCase for components
ProjectDetails.jsx
AddTaskModal.jsx

// Hooks: camelCase with "use" prefix
useContacts.js
useProjects.js

// Utilities: camelCase
emailUtils.js
formatDate.js

// Constants: UPPER_SNAKE_CASE
const STATUS_OPTIONS = ['Open', 'Closed'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Event handlers: handle + Action
const handleClick = () => {};
const handleFormSubmit = () => {};

// Boolean props/state: is/has/can prefix
const [isLoading, setIsLoading] = useState(false);
const [hasError, setHasError] = useState(false);
```

### Imports Order

```javascript
// 1. React and framework imports
import React, { useState, useEffect, useCallback } from 'react';

// 2. Third-party libraries
import { Search, Plus, X } from 'lucide-react';
import * as XLSX from 'xlsx';

// 3. Internal utilities and context
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// 4. Components
import EditTaskModal from './EditTaskModal';
import DataTable from '../common/DataTable';

// 5. Styles (if separate)
import './ProjectDetails.css';
```

---

## Component Patterns

### Modal Components

```javascript
function ExampleModal({ isOpen, onClose, item, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        field1: item.field1 || '',
        field2: item.field2 || '',
      });
      setError('');
    }
  }, [isOpen, item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!formData.field1.trim()) {
        throw new Error('Field 1 is required');
      }

      // Save to database
      const { error: saveError } = await supabase
        .from('table_name')
        .update({ ... })
        .eq('id', item.id);

      if (saveError) throw saveError;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header>
          <h2>Modal Title</h2>
          <button onClick={onClose}><X /></button>
        </header>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### List/Table Components

```javascript
function ItemList({ items, onItemClick, onAdd }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Memoize filtered results
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [items, filter, search]);

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
        </select>
        <button onClick={onAdd}>+ Add Item</button>
      </div>

      {/* Results */}
      {filteredItems.length === 0 ? (
        <EmptyState message="No items found" />
      ) : (
        <table>
          {/* Table content */}
        </table>
      )}
    </div>
  );
}
```

---

## State Management

### Local State (useState)
Use for component-specific state that doesn't need to be shared.

```javascript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({});
```

### Context (useContext)
Use for global state that many components need (auth, theme).

```javascript
// AuthContext provides:
const { user, login, logout, loading } = useAuth();
```

### Custom Hooks
Use to encapsulate reusable stateful logic.

```javascript
// useContacts hook provides:
const { contacts, users, factoryContacts, loading, refetch } = useContacts();
```

### Data Fetching Pattern

```javascript
function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Return loading/error states, then render data
}
```

---

## Database Guidelines

### Supabase Queries

```javascript
// SELECT with relationships
const { data, error } = await supabase
  .from('tasks')
  .select(`
    *,
    assignee:assignee_id(id, name, email),
    project:project_id(id, name, project_number)
  `)
  .eq('project_id', projectId)
  .order('due_date', { ascending: true });

// INSERT
const { data, error } = await supabase
  .from('tasks')
  .insert([{ title, description, project_id }])
  .select()
  .single();

// UPDATE
const { error } = await supabase
  .from('tasks')
  .update({ status: 'Completed', updated_at: new Date().toISOString() })
  .eq('id', taskId);

// DELETE
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId);
```

### Migration Files

Place migrations in `supabase/migrations/` with naming convention:
```
YYYYMMDD_description.sql
```

Example:
```sql
-- 20260110_add_new_column.sql

-- Add column
ALTER TABLE tasks ADD COLUMN new_field TEXT;

-- Add index if needed
CREATE INDEX idx_tasks_new_field ON tasks(new_field);
```

---

## Adding New Features

### Checklist

1. **Plan the feature**
   - Define the data model changes
   - Plan the UI components needed
   - Consider edge cases

2. **Database first**
   - Create migration file
   - Test in Supabase SQL editor
   - Update schema if needed

3. **Build components**
   - Start with the data fetching
   - Build UI components
   - Add form validation

4. **Test thoroughly**
   - Test happy path
   - Test error cases
   - Test edge cases

5. **Document**
   - Update relevant docs
   - Add comments for complex logic

### Example: Adding a New Entity Type

```javascript
// 1. Create migration
// supabase/migrations/20260115_create_new_entity.sql

// 2. Create Add modal
// src/components/projects/AddNewEntityModal.jsx

// 3. Create Edit modal
// src/components/projects/EditNewEntityModal.jsx

// 4. Add to ProjectDetails tabs
// Update TABS constant and add tab content

// 5. Add to relevant pages/dashboards
```

---

## Testing

### Manual Testing Checklist

Before submitting changes, verify:

- [ ] Feature works as expected
- [ ] Form validation shows proper errors
- [ ] Loading states display correctly
- [ ] Error handling works
- [ ] Data persists after page refresh
- [ ] Works in different browsers
- [ ] No console errors

### Future: Automated Testing

```javascript
// Component test example (future)
import { render, screen, fireEvent } from '@testing-library/react';
import AddTaskModal from './AddTaskModal';

test('validates required fields', async () => {
  render(<AddTaskModal isOpen={true} />);

  fireEvent.click(screen.getByText('Save'));

  expect(screen.getByText('Title is required')).toBeInTheDocument();
});
```

---

## Git Workflow

### Branch Naming

```
feature/add-notifications
fix/task-status-bug
refactor/modal-components
docs/update-readme
```

### Commit Messages

Follow conventional commits:

```
feat: Add email notifications for task assignments
fix: Correct date formatting in RFI export
refactor: Extract common modal styles
docs: Update installation instructions
chore: Update dependencies
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Test thoroughly
4. Create PR with description
5. Address review feedback
6. Squash and merge

---

## Styling Guide

### CSS Variables

Use existing CSS variables from `App.css`:

```css
/* Colors */
var(--sunbelt-orange)      /* Primary brand color */
var(--sunbelt-orange-dark) /* Darker orange for hover */
var(--bg-primary)          /* Main background */
var(--bg-secondary)        /* Card backgrounds */
var(--bg-tertiary)         /* Subtle backgrounds */
var(--text-primary)        /* Main text */
var(--text-secondary)      /* Secondary text */
var(--text-tertiary)       /* Muted text */
var(--border-color)        /* Borders */
var(--success)             /* Green for success */
var(--warning)             /* Yellow for warnings */
var(--danger)              /* Red for errors */
var(--info)                /* Blue for info */

/* Spacing */
var(--space-xs)   /* 4px */
var(--space-sm)   /* 8px */
var(--space-md)   /* 16px */
var(--space-lg)   /* 24px */
var(--space-xl)   /* 32px */
var(--space-2xl)  /* 48px */

/* Border Radius */
var(--radius-sm)  /* 4px */
var(--radius-md)  /* 8px */
var(--radius-lg)  /* 12px */
var(--radius-xl)  /* 16px */

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
var(--shadow-xl)
```

### Inline Styles vs CSS Classes

- **Inline styles**: For dynamic values, one-off styles
- **CSS classes**: For reusable patterns, complex selectors

---

## Support

For questions or issues:
- Check existing documentation
- Search GitHub issues
- Contact the development team
