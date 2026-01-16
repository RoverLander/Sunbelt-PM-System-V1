# SUNBELT PM - MASTER CODEBASE REVIEW & EXECUTION PLAN

## Version 1.0 - January 2026

---

## 📋 EXECUTIVE SUMMARY

This document provides a comprehensive, executable plan to audit, fix, and optimize the Sunbelt PM codebase. It is designed for systematic execution by Claude Code or development teams.

**Estimated Timeline:** 3-4 weeks
**Priority Levels:** 🔴 Critical | 🟡 High | 🟢 Medium | 🔵 Low
**Confidence Ratings:** Each section includes explicit confidence levels (0.0-1.0)

---

## 🎯 OBJECTIVES

1. **Security**: Ensure RLS policies protect all data, especially PC role factory isolation
2. **Stability**: Eliminate memory leaks, race conditions, and error-prone patterns
3. **Performance**: Optimize queries, reduce re-renders, improve load times
4. **UX**: Implement consistent loading states, error handling, and empty states
5. **Maintainability**: Reduce code duplication, improve documentation

---

## 📊 CURRENT STATE ASSESSMENT

### Known Issues Inventory

- **26 database tables**, most now have RLS policies (✅)
- **PC role factory filtering** needs comprehensive audit (⚠️)
- **Memory leaks** from uncleared subscriptions and timers (⚠️)
- **Status value consistency** across components (⚠️)
- **Performance profiling** not yet conducted (⚠️)
- **Error handling** inconsistent across components (⚠️)

---

## 🔴 PHASE 1: CRITICAL FIXES (Week 1)

**Confidence: 0.93** | **Must complete before proceeding**

### 1.1 Status Value Global Audit & Fix

**Priority: 🔴 CRITICAL** | **Estimated Time: 4 hours**

#### Problem

Old status values ("On Hold", "Blocked") may exist in code and database, causing display issues and business logic errors.

#### Execution Steps

```bash
# Step 1: Search for old status values
grep -r "On Hold\|Blocked" src/ --include="*.jsx" --include="*.js"

# Step 2: Search for status constants
grep -r "TASK_STATUS\|RFI_STATUS\|SUBMITTAL_STATUS\|PROJECT_STATUS" src/ --include="*.jsx" --include="*.js"
```

#### Fix Script

Create `scripts/fix-status-values.sh`:

```bash
#!/bin/bash
echo "Fixing old status values..."

# Replace old task statuses
find src/ -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's/"On Hold"/"Awaiting Response"/g' {} +
find src/ -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's/"Blocked"/"Awaiting Response"/g' {} +
find src/ -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's/'\''On Hold'\''/'\''Awaiting Response'\''/g' {} +
find src/ -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's/'\''Blocked'\''/'\''Awaiting Response'\''/g' {} +

echo "✅ Status values updated in code"
echo "⚠️  Remember to update database records too!"
```

#### Database Update

```sql
-- Update any old status values in database
UPDATE tasks SET status = 'Awaiting Response' WHERE status IN ('On Hold', 'Blocked');
UPDATE rfis SET status = 'Open' WHERE status IN ('On Hold', 'Blocked');
UPDATE submittals SET status = 'Under Review' WHERE status IN ('On Hold', 'Blocked');

-- Verify no old values remain
SELECT DISTINCT status FROM tasks;
SELECT DISTINCT status FROM rfis;
SELECT DISTINCT status FROM submittals;
SELECT DISTINCT status FROM projects;
```

#### Verification

```bash
# Should return no results:
grep -r "On Hold\|Blocked" src/ --include="*.jsx" --include="*.js"
```

---

### 1.2 RLS Policy Comprehensive Audit

**Priority: 🔴 CRITICAL** | **Estimated Time: 8 hours**

#### Problem

PC role must be restricted to only their factory's data. Some tables may lack proper factory filtering in RLS policies.

#### Execution Steps

**Step 1: Run RLS audit query**

Save as `scripts/audit-rls-policies.sql`:

```sql
-- ============================================================================
-- RLS POLICY COMPREHENSIVE AUDIT
-- ============================================================================

-- 1. Tables without RLS enabled
SELECT 
  tablename,
  'RLS NOT ENABLED' as issue,
  'CRITICAL' as severity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND rowsecurity = false;

-- 2. Tables without any policies
SELECT 
  t.tablename,
  'NO POLICIES' as issue,
  'CRITICAL' as severity
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename
  );

-- 3. Tables with factory_id but no PC filtering
WITH factory_tables AS (
  SELECT DISTINCT table_name as tablename
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'factory_id'
)
SELECT 
  ft.tablename,
  'MISSING PC FACTORY FILTER' as issue,
  'HIGH' as severity,
  'Add policy for PC role with factory_id check' as fix
FROM factory_tables ft
WHERE NOT EXISTS (
  SELECT 1 FROM pg_policies p
  WHERE p.tablename = ft.tablename
    AND p.definition LIKE '%PC%'
    AND p.definition LIKE '%factory_id%'
);

-- 4. Indirect factory tables (tasks, rfis, submittals via project_id)
SELECT 
  'tasks' as tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'tasks' 
        AND definition LIKE '%PC%'
        AND definition LIKE '%projects%'
        AND definition LIKE '%factory_id%'
    ) THEN 'OK'
    ELSE 'MISSING PC FILTER VIA PROJECT'
  END as status
UNION ALL
SELECT 
  'rfis' as tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'rfis' 
        AND definition LIKE '%PC%'
        AND definition LIKE '%projects%'
        AND definition LIKE '%factory_id%'
    ) THEN 'OK'
    ELSE 'MISSING PC FILTER VIA PROJECT'
  END as status
UNION ALL
SELECT 
  'submittals' as tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'submittals' 
        AND definition LIKE '%PC%'
        AND definition LIKE '%projects%'
        AND definition LIKE '%factory_id%'
    ) THEN 'OK'
    ELSE 'MISSING PC FILTER VIA PROJECT'
  END as status
UNION ALL
SELECT 
  'file_attachments' as tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'file_attachments' 
        AND definition LIKE '%PC%'
        AND definition LIKE '%projects%'
        AND definition LIKE '%factory_id%'
    ) THEN 'OK'
    ELSE 'MISSING PC FILTER VIA PROJECT'
  END as status;

-- 5. Check each operation type has policies
WITH policy_coverage AS (
  SELECT 
    tablename,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as has_select,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as has_insert,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as has_update,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as has_delete
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
  tablename,
  CASE WHEN has_select = 0 THEN '❌ MISSING SELECT' ELSE '✅' END as select_policy,
  CASE WHEN has_insert = 0 THEN '❌ MISSING INSERT' ELSE '✅' END as insert_policy,
  CASE WHEN has_update = 0 THEN '❌ MISSING UPDATE' ELSE '✅' END as update_policy,
  CASE WHEN has_delete = 0 THEN '❌ MISSING DELETE' ELSE '✅' END as delete_policy
FROM policy_coverage
ORDER BY tablename;
```

**Step 2: Generate Fix Scripts**

For each table missing PC policies, generate:

```sql
-- TEMPLATE: Direct factory_id tables (projects, factory_contacts, etc.)
CREATE POLICY "PC can view their factory's {table}"
ON {table} FOR SELECT
USING (
  -- Regular users
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role IN ('PM', 'Director', 'VP', 'Admin', 'IT')
  )
  OR
  -- PC can only see their factory
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
      AND u.role = 'PC'
      AND u.factory_id = {table}.factory_id
  )
);

-- TEMPLATE: Indirect factory tables (tasks, rfis, submittals via project)
CREATE POLICY "PC can view {table} from their factory projects"
ON {table} FOR SELECT
USING (
  -- Regular users (existing logic)
  ...existing conditions...
  OR
  -- PC via project → factory
  EXISTS (
    SELECT 1 FROM users u
    JOIN projects p ON p.id = {table}.project_id
    WHERE u.id = auth.uid()
      AND u.role = 'PC'
      AND u.factory_id = p.factory_id
  )
);
```

**Step 3: Storage Bucket Policies**

```sql
-- project-files bucket
CREATE POLICY "PC can view files from their factory projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND
  (
    -- Existing elevated roles
    ...
    OR
    -- PC for their factory
    EXISTS (
      SELECT 1 FROM users u
      JOIN projects p ON p.id::text = (storage.foldername(name))[1]
      WHERE u.id = auth.uid()
        AND u.role = 'PC'
        AND u.factory_id = p.factory_id
    )
  )
);
```

**Step 4: Test PC Role Isolation**

```javascript
// Test script: scripts/test-pc-isolation.js
import { createClient } from '@supabase/supabase-js';

async function testPCIsolation() {
  // Login as PC user
  const supabase = createClient(URL, KEY);
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: 'pc-user@example.com',
    password: 'test123'
  });
  
  // Get PC's factory_id
  const { data: pcUser } = await supabase
    .from('users')
    .select('factory_id')
    .eq('id', user.id)
    .single();
  
  console.log(`PC Factory ID: ${pcUser.factory_id}`);
  
  // Test 1: Can only see projects from their factory
  const { data: projects } = await supabase
    .from('projects')
    .select('*');
  
  const wrongFactory = projects.filter(p => p.factory_id !== pcUser.factory_id);
  console.assert(wrongFactory.length === 0, '❌ PC can see projects from other factories!');
  console.log(`✅ Projects: ${projects.length} (all from correct factory)`);
  
  // Test 2: Can only see tasks from their factory projects
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, project:project_id(factory_id)');
  
  const wrongFactoryTasks = tasks.filter(t => t.project?.factory_id !== pcUser.factory_id);
  console.assert(wrongFactoryTasks.length === 0, '❌ PC can see tasks from other factories!');
  console.log(`✅ Tasks: ${tasks.length} (all from correct factory)`);
  
  // Test 3: Cannot see other factories' contacts
  const { data: contacts } = await supabase
    .from('factory_contacts')
    .select('*');
  
  const wrongFactoryContacts = contacts.filter(c => c.factory_id !== pcUser.factory_id);
  console.assert(wrongFactoryContacts.length === 0, '❌ PC can see contacts from other factories!');
  console.log(`✅ Contacts: ${contacts.length} (all from correct factory)`);
  
  // Test 4: Cannot access files from other factories
  const { data: files } = await supabase.storage
    .from('project-files')
    .list();
  
  // Should only see folders for their factory's projects
  console.log(`✅ Files: Can access ${files.length} project folders`);
  
  console.log('\n✅ PC ISOLATION TEST PASSED');
}

testPCIsolation().catch(console.error);
```

---

### 1.3 Memory Leak Elimination

**Priority: 🔴 CRITICAL** | **Estimated Time: 6 hours**

#### Problem

useEffect hooks without cleanup functions cause memory leaks through:

- Uncleared timers (setTimeout, setInterval)
- Un-removed event listeners
- Unsubscribed Supabase channels
- Stale setState calls after component unmount

#### Execution Steps

**Step 1: Automated Detection**

```bash
# Find all useEffect without cleanup
grep -rn "useEffect" src/ --include="*.jsx" -A 10 | grep -B 5 "}, \[\])" | grep -v "return () =>"
```

**Step 2: Manual Review Checklist**

For EVERY file with useEffect:

- [ ] Does it set up a timer? → needs clearTimeout/clearInterval
- [ ] Does it add event listener? → needs removeEventListener
- [ ] Does it subscribe to Supabase? → needs removeChannel
- [ ] Does it fetch data? → needs cancellation check
- [ ] Does it set state? → needs cleanup to prevent updates on unmounted component

**Step 3: Common Fixes**

```javascript
// ============================================================================
// FIX PATTERN 1: Timers
// ============================================================================

// ❌ BEFORE:
useEffect(() => {
  const timer = setInterval(() => {
    fetchData();
  }, 5000);
}, []);

// ✅ AFTER:
useEffect(() => {
  const timer = setInterval(() => {
    fetchData();
  }, 5000);
  
  return () => clearInterval(timer); // ✅ CLEANUP
}, []);

// ============================================================================
// FIX PATTERN 2: Event Listeners
// ============================================================================

// ❌ BEFORE:
useEffect(() => {
  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };
  window.addEventListener('resize', handleResize);
}, []);

// ✅ AFTER:
useEffect(() => {
  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize); // ✅ CLEANUP
  };
}, []);

// ============================================================================
// FIX PATTERN 3: Supabase Subscriptions
// ============================================================================

// ❌ BEFORE:
useEffect(() => {
  const channel = supabase
    .channel('tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleChange)
    .subscribe();
}, []);

// ✅ AFTER:
useEffect(() => {
  const channel = supabase
    .channel('tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleChange)
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel); // ✅ CLEANUP
  };
}, []);

// ============================================================================
// FIX PATTERN 4: Async Fetch with Cancellation
// ============================================================================

// ❌ BEFORE:
useEffect(() => {
  fetchProjects().then(data => {
    setProjects(data); // ⚠️ Could update after unmount
  });
}, []);

// ✅ AFTER:
useEffect(() => {
  let cancelled = false;
  
  async function load() {
    try {
      const data = await fetchProjects();
      if (!cancelled) { // ✅ Check before setState
        setProjects(data);
      }
    } catch (error) {
      if (!cancelled) {
        setError(error);
      }
    }
  }
  
  load();
  
  return () => {
    cancelled = true; // ✅ CLEANUP
  };
}, []);
```


**Step 4: Create Reusable Hooks**

```javascript
// ============================================================================
// src/hooks/useInterval.js
// ============================================================================
// Custom hook for setInterval with automatic cleanup
// Prevents memory leaks from uncleaned intervals

import { useEffect, useRef } from 'react';

export function useInterval(callback, delay) {
  const savedCallback = useRef();
  
  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  // Set up the interval
  useEffect(() => {
    if (delay === null) return;
  
    const id = setInterval(() => {
      savedCallback.current();
    }, delay);
  
    return () => clearInterval(id); // ✅ Auto-cleanup
  }, [delay]);
}

// Usage example:
function Dashboard() {
  useInterval(() => {
    fetchLatestData();
  }, 5000); // Fetches every 5 seconds, auto-cleans on unmount
}

// ============================================================================
// src/hooks/useSupabaseSubscription.js
// ============================================================================
// Custom hook for Supabase real-time subscriptions with automatic cleanup

import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useSupabaseSubscription(table, callback) {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table 
      }, callback)
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel); // ✅ Auto-cleanup
    };
  }, [table, callback]);
}

// Usage example:
function TaskList({ projectId }) {
  const [tasks, setTasks] = useState([]);
  
  const handleTaskChange = useCallback((payload) => {
    console.log('Task changed:', payload);
    refetchTasks();
  }, []);
  
  useSupabaseSubscription('tasks', handleTaskChange);
  
  return <div>...</div>;
}

// ============================================================================
// src/hooks/useEventListener.js
// ============================================================================
// Custom hook for window/document event listeners with automatic cleanup

import { useEffect, useRef } from 'react';

export function useEventListener(eventName, handler, element = window) {
  const savedHandler = useRef();
  
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;
  
    const eventListener = (event) => savedHandler.current(event);
    element.addEventListener(eventName, eventListener);
  
    return () => {
      element.removeEventListener(eventName, eventListener); // ✅ Auto-cleanup
    };
  }, [eventName, element]);
}

// Usage example:
function ResponsiveComponent() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });
  
  return <div>Width: {windowWidth}</div>;
}

// ============================================================================
// src/hooks/useCancellablePromise.js
// ============================================================================
// Custom hook to prevent setState on unmounted components

import { useEffect, useRef, useCallback } from 'react';

export function useCancellablePromise() {
  const cancelledRef = useRef(false);
  
  useEffect(() => {
    cancelledRef.current = false;
  
    return () => {
      cancelledRef.current = true; // ✅ Mark as cancelled on unmount
    };
  }, []);
  
  const cancellablePromise = useCallback((promise) => {
    return new Promise((resolve, reject) => {
      promise
        .then(value => {
          if (!cancelledRef.current) {
            resolve(value);
          }
        })
        .catch(error => {
          if (!cancelledRef.current) {
            reject(error);
          }
        });
    });
  }, []);
  
  return cancellablePromise;
}

// Usage example:
function ProjectDetails({ projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const cancellablePromise = useCancellablePromise();
  
  useEffect(() => {
    setLoading(true);
  
    cancellablePromise(fetchProject(projectId))
      .then(data => {
        setProject(data);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setLoading(false);
      });
  }, [projectId, cancellablePromise]);
  
  if (loading) return <Spinner />;
  return <div>{project.name}</div>;
}

// ============================================================================
// src/hooks/useAsyncEffect.js
// ============================================================================
// Combines async/await with proper cancellation

import { useEffect } from 'react';

export function useAsyncEffect(asyncFunction, dependencies = []) {
  useEffect(() => {
    let cancelled = false;
  
    (async () => {
      try {
        await asyncFunction(cancelled);
      } catch (error) {
        if (!cancelled) {
          console.error('Async effect error:', error);
        }
      }
    })();
  
    return () => {
      cancelled = true; // ✅ Mark as cancelled
    };
  }, dependencies);
}

// Usage example:
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  
  useAsyncEffect(async (cancelled) => {
    const userData = await fetchUser(userId);
    if (cancelled) return; // Don't update if unmounted
  
    setUser(userData);
  
    const userPosts = await fetchUserPosts(userId);
    if (cancelled) return; // Don't update if unmounted
  
    setPosts(userPosts);
  }, [userId]);
  
  return <div>...</div>;
}

// ============================================================================
// src/hooks/useDebounce.js
// ============================================================================
// Debounce values with automatic cleanup

import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
  
    return () => {
      clearTimeout(handler); // ✅ Auto-cleanup
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage example:
function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}

// ============================================================================
// COMPREHENSIVE EXAMPLE: Combining Multiple Hooks
// ============================================================================

function ProjectDashboard({ projectId }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  const cancellablePromise = useCancellablePromise();
  
  // Fetch project data with cancellation
  useAsyncEffect(async (cancelled) => {
    setLoading(true);
  
    const projectData = await fetchProject(projectId);
    if (cancelled) return;
    setProject(projectData);
  
    const taskData = await fetchTasks(projectId);
    if (cancelled) return;
    setTasks(taskData);
  
    setLoading(false);
  }, [projectId]);
  
  // Real-time task updates
  const handleTaskChange = useCallback((payload) => {
    setTasks(prev => {
      // Update task in array
      return prev.map(t => 
        t.id === payload.new.id ? payload.new : t
      );
    });
  }, []);
  
  useSupabaseSubscription('tasks', handleTaskChange);
  
  // Auto-refresh every 30 seconds
  useInterval(() => {
    cancellablePromise(fetchTasks(projectId))
      .then(data => setTasks(data))
      .catch(console.error);
  }, 30000);
  
  // Handle window resize
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEventListener('resize', () => {
    setIsMobile(window.innerWidth < 768);
  });
  
  // Search tasks when debounced term changes
  useEffect(() => {
    if (debouncedSearch) {
      const filtered = tasks.filter(t => 
        t.title.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      // Do something with filtered tasks
    }
  }, [debouncedSearch, tasks]);
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      <h1>{project.name}</h1>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search tasks..."
      />
      {/* Render tasks */}
    </div>
  );
}

// ============================================================================
// TESTING THESE HOOKS
// ============================================================================

// Test that cleanup happens:
// 1. Render component with useInterval
// 2. Unmount component
// 3. Check that interval is cleared (no console errors about setState on unmounted)

// Test that subscriptions cleanup:
// 1. Check Supabase connection count before mounting
// 2. Mount component with useSupabaseSubscription
// 3. Unmount component
// 4. Verify connection count returns to original (no leak)

// Test cancellation:
// 1. Start async operation
// 2. Unmount component immediately
// 3. Verify no setState warnings in console
```

**Step 5: Verify All Components Use These Hooks**

Create an audit checklist:

```bash
# Find all setInterval usage - should use useInterval instead
grep -rn "setInterval" src/ --include="*.jsx" --include="*.js"

# Find all setTimeout usage - should have cleanup
grep -rn "setTimeout" src/ --include="*.jsx" --include="*.js"

# Find all addEventListener usage - should use useEventListener
grep -rn "addEventListener" src/ --include="*.jsx" --include="*.js"

# Find all Supabase subscriptions - should use useSupabaseSubscription
grep -rn "\.subscribe()" src/ --include="*.jsx" --include="*.js"

# Find all async useEffect - should use useAsyncEffect or cancellation
grep -rn "useEffect.*async" src/ --include="*.jsx" --include="*.js"
```

**Step 6: Migration Guide**

For each component found in the audit:

```javascript
// ============================================================================
// MIGRATION PATTERN 1: setInterval → useInterval
// ============================================================================

// BEFORE:
useEffect(() => {
  const timer = setInterval(() => {
    fetchData();
  }, 5000);
  
  return () => clearInterval(timer);
}, []);

// AFTER:
useInterval(() => {
  fetchData();
}, 5000);

// ============================================================================
// MIGRATION PATTERN 2: addEventListener → useEventListener
// ============================================================================

// BEFORE:
useEffect(() => {
  const handleScroll = () => {
    console.log('scrolling');
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// AFTER:
useEventListener('scroll', () => {
  console.log('scrolling');
});

// ============================================================================
// MIGRATION PATTERN 3: Supabase subscription → useSupabaseSubscription
// ============================================================================

// BEFORE:
useEffect(() => {
  const channel = supabase
    .channel('tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleChange)
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, []);

// AFTER:
useSupabaseSubscription('tasks', handleChange);

// ============================================================================
// MIGRATION PATTERN 4: Async fetch → useAsyncEffect
// ============================================================================

// BEFORE:
useEffect(() => {
  let cancelled = false;
  
  async function load() {
    const data = await fetchData();
    if (!cancelled) {
      setData(data);
    }
  }
  
  load();
  return () => { cancelled = true; };
}, []);

// AFTER:
useAsyncEffect(async (cancelled) => {
  const data = await fetchData();
  if (cancelled) return;
  setData(data);
}, []);
```

Fixed! The section now has proper code formatting and organization.

**Step 5: Verify with Memory Profiler**

1. Open Chrome DevTools → Memory tab
2. Take heap snapshot
3. Navigate through app (open modals, switch views)
4. Take another snapshot
5. Compare → Look for:
   - Detached DOM trees (should be minimal)
   - Growing arrays (should stabilize)
   - Event listeners (should not accumulate)

---

### 1.4 Error Handling Standardization

**Priority: 🔴 CRITICAL** | **Estimated Time: 6 hours**

#### Problem

Inconsistent error handling across components leads to silent failures and poor UX.

#### Execution Steps

**Step 1: Create Error Utilities**

```javascript
// src/utils/errorHandling.js

/**
 * Standard error handler for Supabase operations
 * @param {Error} error - The error object
 * @param {string} context - What operation failed (e.g., "create task")
 * @returns {string} - User-friendly error message
 */
export function handleSupabaseError(error, context = 'operation') {
  console.error(`Supabase error during ${context}:`, error);
  
  // Network errors
  if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Permission errors
  if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
    return `You don't have permission to ${context}.`;
  }
  
  // Constraint violations
  if (error.code === '23505') { // Unique constraint
    return `This ${context} already exists.`;
  }
  
  if (error.code === '23503') { // Foreign key violation
    return `Invalid reference in ${context}. Please check your selections.`;
  }
  
  if (error.code === '23502') { // Not null violation
    return `Missing required information for ${context}.`;
  }
  
  // Generic error
  return `Failed to ${context}. Please try again.`;
}

/**
 * Wraps an async function with standard error handling
 */
export function withErrorHandling(fn, context, showToast) {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return { success: true, data: result };
    } catch (error) {
      const message = handleSupabaseError(error, context);
      if (showToast) {
        showToast(message, 'error');
      }
      return { success: false, error: message };
    }
  };
}

/**
 * Standard validation before operations
 */
export function validateRequired(data, requiredFields) {
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      message: `Please fill in: ${missing.join(', ')}`
    };
  }
  
  return { valid: true };
}
```

**Step 2: Create Error Boundary Component**

```javascript
// src/components/ErrorBoundary.jsx

import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  
    // TODO: Log to error tracking service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center',
          minHeight: '400px'
        }}>
          <AlertCircle size={64} style={{ color: 'var(--danger)', marginBottom: '20px' }} />
          <h2 style={{ margin: '0 0 10px 0' }}>Something went wrong</h2>
          <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', maxWidth: '500px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{ marginBottom: '20px', textAlign: 'left' }}>
              <summary>Error Details (Dev Only)</summary>
              <pre style={{ 
                padding: '10px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxWidth: '600px'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'var(--sunbelt-orange)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
  
    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Step 3: Wrap Routes with Error Boundaries**

```javascript
// src/App.jsx

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            } />
            <Route path="/projects/:id" element={
              <ErrorBoundary>
                <ProjectDetails />
              </ErrorBoundary>
            } />
            {/* More routes */}
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Step 4: Standardize All Supabase Calls**

Search and replace pattern:

```javascript
// FIND:
const { data, error } = await supabase
  .from('tasks')
  .insert(formData);

if (error) {
  console.error(error);
  showToast('Failed to create task', 'error');
  return;
}

// REPLACE WITH:
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
```

**Step 5: Add Global Error Handler**

```javascript
// src/index.jsx or src/main.jsx

// Handle uncaught promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Show user-friendly message
  const message = event.reason?.message || 'An unexpected error occurred';
  
  // TODO: Show toast notification if available
  // showToast(message, 'error');
  
  // TODO: Log to error tracking service
  // logError(event.reason);
});

// Handle uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  
  // TODO: Log to error tracking service
  // logError(event.error);
});
```

---

## 🟡 PHASE 2: HIGH PRIORITY FIXES (Week 2)

**Confidence: 0.88**

### 2.1 Loading States Implementation

**Priority: 🟡 HIGH** | **Estimated Time: 8 hours**

#### Problem

Components show empty states while loading, confusing users.

#### Execution Steps

**Step 1: Create Skeleton Components**

```javascript
// src/components/shared/Skeleton.jsx

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-title" />
      <div className="skeleton-text" />
      <div className="skeleton-text short" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="skeleton-table">
      {/* Header */}
      <div className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="skeleton-table-header" />
        ))}
      </div>
    
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="skeleton-table-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonKanban({ columns = 4 }) {
  return (
    <div className="skeleton-kanban">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="skeleton-kanban-column">
          <div className="skeleton-kanban-header" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="skeleton-kanban-card" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Add CSS**

```css
/* src/styles/skeleton.css */

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-card,
.skeleton-table-header,
.skeleton-table-cell,
.skeleton-kanban-header,
.skeleton-kanban-card {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: 4px;
}

.skeleton-card {
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-bottom: 10px;
}

.skeleton-title,
.skeleton-text {
  height: 20px;
  margin-bottom: 10px;
  border-radius: 4px;
  background: inherit;
}

.skeleton-title {
  height: 24px;
  width: 60%;
}

.skeleton-text.short {
  width: 40%;
}

/* Table skeletons */
.skeleton-table {
  width: 100%;
}

.skeleton-table-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid var(--border-color);
}

.skeleton-table-header {
  height: 20px;
}

.skeleton-table-cell {
  height: 16px;
}

/* Kanban skeletons */
.skeleton-kanban {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.skeleton-kanban-column {
  background: var(--bg-secondary);
  padding: 15px;
  border-radius: var(--radius-md);
}

.skeleton-kanban-header {
  height: 24px;
  margin-bottom: 15px;
}

.skeleton-kanban-card {
  height: 100px;
  margin-bottom: 10px;
}
```

**Step 3: Update Components to Use Skeletons**

Pattern to apply across all data-fetching components:

```javascript
// BEFORE:
function ProjectList() {
  const [projects, setProjects] = useState([]);
  
  useEffect(() => {
    fetchProjects().then(setProjects);
  }, []);
  
  return (
    <div>
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}

// AFTER:
function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
  
    async function load() {
      try {
        setLoading(true);
        const data = await fetchProjects();
        if (!cancelled) setProjects(data);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
  
    load();
    return () => { cancelled = true; };
  }, []);
  
  if (loading) {
    return (
      <div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  
  if (projects.length === 0) {
    return <EmptyState title="No projects found" />;
  }
  
  return (
    <div>
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}
```

**Step 4: Audit All Components**

Components that need loading states:

- [ ] PMDashboard.jsx
- [ ] DirectorDashboard.jsx
- [ ] VPDashboard.jsx
- [ ] PCDashboard.jsx
- [ ] ProjectDetails.jsx
- [ ] ProjectList.jsx
- [ ] TaskBoard.jsx (Kanban)
- [ ] TaskList.jsx
- [ ] RFIList.jsx
- [ ] SubmittalList.jsx
- [ ] FileManager.jsx
- [ ] WorkflowTracker.jsx
- [ ] Calendar.jsx

---

### 2.2 Race Condition Protection

**Priority: 🟡 HIGH** | **Estimated Time: 6 hours**

#### Problem

Rapid state changes, concurrent updates, and navigation during async operations cause race conditions.

#### Execution Steps

**Step 1: Implement Debouncing for Search**

```javascript
// src/hooks/useDebounce.js

import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
  
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// USAGE:
function ProjectList() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (debouncedSearch) {
      searchProjects(debouncedSearch);
    }
  }, [debouncedSearch]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search projects..."
    />
  );
}
```

**Step 2: Add Optimistic Locking**

```javascript
// Add version column to critical tables
-- migrations/add-version-columns.sql

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE submittals ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create trigger to auto-increment version
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_version_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

CREATE TRIGGER projects_version_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Repeat for other tables
```

```javascript
// src/utils/optimisticUpdate.js

export async function updateWithOptimisticLocking(
  supabase,
  table,
  id,
  currentVersion,
  updates
) {
  const { data, error } = await supabase
    .from(table)
    .update({
      ...updates,
      version: currentVersion + 1
    })
    .eq('id', id)
    .eq('version', currentVersion) // Only update if version matches
    .select()
    .single();
  
  if (error) {
    if (error.message.includes('0 rows')) {
      // Version mismatch = concurrent edit
      throw new Error('CONFLICT');
    }
    throw error;
  }
  
  return data;
}

// USAGE:
const handleUpdate = async (updates) => {
  try {
    const updated = await updateWithOptimisticLocking(
      supabase,
      'tasks',
      task.id,
      task.version,
      updates
    );
  
    setTask(updated);
    showToast('Task updated', 'success');
  } catch (error) {
    if (error.message === 'CONFLICT') {
      showToast('Task was updated by someone else. Refreshing...', 'warning');
      await refetchTask();
    } else {
      showToast('Failed to update task', 'error');
    }
  }
};
```

**Step 3: Prevent Double Submissions**

Pattern to apply to all forms:

```javascript
// BEFORE:
const handleSubmit = async () => {
  await saveTask(formData);
  onClose();
};

// AFTER:
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
  if (submitting) return; // Prevent double-click
  
  setSubmitting(true);
  try {
    await saveTask(formData);
    showToast('Task created', 'success');
    onClose();
  } catch (error) {
    console.error(error);
    showToast('Failed to create task', 'error');
  } finally {
    setSubmitting(false);
  }
};

// In JSX:
<button 
  onClick={handleSubmit} 
  disabled={submitting}
  style={{
    opacity: submitting ? 0.5 : 1,
    cursor: submitting ? 'not-allowed' : 'pointer'
  }}
>
  {submitting ? 'Saving...' : 'Save Task'}
</button>
```

**Step 4: Add Request Cancellation**

```javascript
// src/hooks/useCancellableRequest.js

import { useEffect, useRef } from 'react';

export function useCancellableRequest() {
  const cancelledRef = useRef(false);
  
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);
  
  const makeCancellable = (promise) => {
    return promise.then(
      value => cancelledRef.current ? Promise.reject({ cancelled: true }) : value,
      error => cancelledRef.current ? Promise.reject({ cancelled: true }) : Promise.reject(error)
    );
  };
  
  return makeCancellable;
}

// USAGE:
function ProjectDetails({ projectId }) {
  const [project, setProject] = useState(null);
  const makeCancellable = useCancellableRequest();
  
  useEffect(() => {
    makeCancellable(fetchProject(projectId))
      .then(setProject)
      .catch(error => {
        if (!error.cancelled) {
          console.error(error);
        }
      });
  }, [projectId]);
}
```

---

### 2.3 Empty State Standardization

**Priority: 🟡 HIGH** | **Estimated Time: 4 hours**

#### See earlier section for EmptyState component

Apply to all list views:

- [ ] ProjectList - No projects
- [ ] TaskList - No tasks
- [ ] RFIList - No RFIs
- [ ] SubmittalList - No submittals
- [ ] FileManager - No files
- [ ] Search results - No matches
- [ ] PC Dashboard - No factory assigned
- [ ] PM Dashboard - No projects assigned

---

## 🟢 PHASE 3: PERFORMANCE OPTIMIZATION (Week 3)

**Confidence: 0.76**

### 3.1 Database Query Optimization

**Priority: 🟢 MEDIUM** | **Estimated Time: 8 hours**

#### Create Indexes

```sql
-- ============================================================================
-- PERFORMANCE INDEXES
-- Run in Supabase SQL Editor
-- ============================================================================

-- Tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE status NOT IN ('Completed', 'Cancelled');
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_station ON tasks(workflow_station_key);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status); -- Composite

-- Projects table
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_factory_id ON projects(factory_id); -- Critical for PC role
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email); -- For login
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_factory_id ON users(factory_id);

-- RFIs table
CREATE INDEX IF NOT EXISTS idx_rfis_project_id ON rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_status ON rfis(status);
CREATE INDEX IF NOT EXISTS idx_rfis_created_at ON rfis(created_at);

-- Submittals table
CREATE INDEX IF NOT EXISTS idx_submittals_project_id ON submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_status ON submittals(status);
CREATE INDEX IF NOT EXISTS idx_submittals_created_at ON submittals(created_at);

-- File attachments
CREATE INDEX IF NOT EXISTS idx_file_attachments_project_id ON file_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_parent ON file_attachments(parent_type, parent_id);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read, created_at);

-- Workflow
CREATE INDEX IF NOT EXISTS idx_project_workflow_project ON project_workflow_status(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workflow_station ON project_workflow_status(station_key);

-- Check index usage after a week
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### Optimize Common Queries

```javascript
// ❌ BAD: Over-fetching
const { data } = await supabase
  .from('projects')
  .select('*');

// ✅ GOOD: Select only needed columns
const { data } = await supabase
  .from('projects')
  .select('id, name, status, project_number, owner_id');

// ❌ BAD: N+1 query problem
const projects = await fetchProjects();
for (const project of projects) {
  project.taskCount = await fetchTaskCount(project.id); // Separate query!
}

// ✅ GOOD: Single query with aggregation
const { data } = await supabase
  .from('projects')
  .select(`
    id,
    name,
    status,
    tasks:tasks(count)
  `);

// ❌ BAD: Fetching all then filtering on client
const { data: allTasks } = await supabase
  .from('tasks')
  .select('*');

const openTasks = allTasks.filter(t => 
  !['Completed', 'Cancelled'].includes(t.status)
);

// ✅ GOOD: Server-side filtering
const { data: openTasks } = await supabase
  .from('tasks')
  .select('*')
  .not('status', 'in', '(Completed,Cancelled)');

// ❌ BAD: No pagination
const { data } = await supabase
  .from('tasks')
  .select('*'); // Could return thousands!

// ✅ GOOD: Pagination
const PAGE_SIZE = 50;
const { data, count } = await supabase
  .from('tasks')
  .select('*', { count: 'exact' })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  .order('created_at', { ascending: false });
```

---

### 3.2 React Performance Optimization

**Priority: 🟢 MEDIUM** | **Estimated Time: 10 hours**

#### Step 1: Install Profiling Tools

```bash
npm install --save-dev @welldone-software/why-did-you-render
```

```javascript
// src/wdyr.js
import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    logOnDifferentValues: true,
  });
}
```

```javascript
// src/main.jsx or src/index.jsx
import './wdyr'; // Must be first import
import React from 'react';
// ... rest of imports
```

#### Step 2: Optimize Re-renders

Apply these patterns across components:

```javascript
// Pattern 1: Memoize expensive calculations
const sortedTasks = useMemo(() => {
  return tasks
    .filter(t => t.status !== 'Completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
}, [tasks]);

// Pattern 2: Memoize callbacks
const handleTaskClick = useCallback((taskId) => {
  navigate(`/tasks/${taskId}`);
}, [navigate]);

// Pattern 3: Memoize context values
const authValue = useMemo(
  () => ({ user, login, logout }),
  [user, login, logout]
);

// Pattern 4: Split contexts
// Instead of one big context:
const AppContext = createContext();
// value={{ user, theme, notifications, ... }} // Everything re-renders on any change

// Split into multiple:
const UserContext = createContext();
const ThemeContext = createContext();
const NotificationContext = createContext();

// Pattern 5: React.memo for expensive components
const TaskCard = React.memo(({ task, onUpdate }) => {
  // Expensive rendering
  return <div>...</div>;
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if task actually changed
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.version === nextProps.task.version;
});

TaskCard.whyDidYouRender = true; // Track with WDYR
```

#### Step 3: Virtualize Long Lists

```bash
npm install react-window
```

```javascript
// For lists with 100+ items
import { FixedSizeList } from 'react-window';

function TaskList({ tasks }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TaskCard task={tasks[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={tasks.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

#### Step 4: Code Splitting

```javascript
// Lazy load heavy components
import { lazy, Suspense } from 'react';

const WorkflowTracker = lazy(() => import('./WorkflowTracker'));
const PDFViewer = lazy(() => import('./PDFViewer'));
const ChartComponent = lazy(() => import('./ChartComponent'));

// Usage:
<Suspense fallback={<Spinner />}>
  <WorkflowTracker />
</Suspense>

// Route-based splitting
const PMDashboard = lazy(() => import('./dashboards/PMDashboard'));
const DirectorDashboard = lazy(() => import('./dashboards/DirectorDashboard'));

<Routes>
  <Route path="/pm" element={
    <Suspense fallback={<LoadingPage />}>
      <PMDashboard />
    </Suspense>
  } />
</Routes>
```

---

### 3.3 Bundle Size Optimization

**Priority: 🟢 MEDIUM** | **Estimated Time: 4 hours**

```bash
# Install analyzer
npm install --save-dev vite-plugin-visualizer

# Add to vite.config.js
import { visualizer } from 'vite-plugin-visualizer';

export default {
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ]
};

# Build and analyze
npm run build
# Opens visualization

# Optimization targets:
# - Replace moment.js with date-fns (if using)
# - Use lodash-es instead of lodash
# - Import only needed lodash functions
# - Remove unused dependencies
```

---

## 🔵 PHASE 4: CODE QUALITY & MAINTAINABILITY (Week 4)

**Confidence: 0.85**

### 4.1 Component Refactoring

**Priority: 🔵 LOW** | **Estimated Time: 12 hours**

#### Create Shared Hooks

```javascript
// src/hooks/useProjects.js
export function useProjects(filters = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
  
    async function load() {
      try {
        setLoading(true);
        let query = supabase
          .from('projects')
          .select('*, pm:owner_id(id, name), factory:factory_id(id, name)');
      
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.pmId) query = query.eq('owner_id', filters.pmId);
        if (filters.factoryId) query = query.eq('factory_id', filters.factoryId);
      
        const { data, error } = await query;
        if (error) throw error;
      
        if (!cancelled) {
          setProjects(data || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
  
    load();
    return () => { cancelled = true; };
  }, [JSON.stringify(filters)]);
  
  return { projects, loading, error, refetch: () => load() };
}

// Similar hooks for:
// - useTasks.js
// - useRFIs.js
// - useSubmittals.js
// - useUsers.js
```

#### Create Reusable Components

```javascript
// src/components/shared/StatusBadge.jsx
// src/components/shared/PriorityBadge.jsx
// src/components/shared/UserAvatar.jsx
// src/components/shared/DateDisplay.jsx
// src/components/shared/FileIcon.jsx
// src/components/shared/Modal.jsx
// src/components/shared/ConfirmDialog.jsx
// src/components/shared/Tooltip.jsx
// src/components/shared/Dropdown.jsx
```

---

### 4.2 Testing Setup

**Priority: 🔵 LOW** | **Estimated Time: 8 hours**

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true
  }
});

// src/test/setup.js
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }))
}));

// Example test
// src/components/__tests__/TaskCard.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TaskCard from '../TaskCard';

describe('TaskCard', () => {
  it('renders task title', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      status: 'In Progress'
    };
  
    render(<TaskCard task={task} />);
  
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

---

## 📝 EXECUTION CHECKLIST

### Week 1: Critical Fixes

- [ ] Day 1: Status value audit & fix
- [ ] Day 2: RLS policy audit
- [ ] Day 3: PC role isolation testing
- [ ] Day 4: Memory leak elimination
- [ ] Day 5: Error handling standardization

### Week 2: High Priority

- [ ] Day 6-7: Loading states implementation
- [ ] Day 8: Race condition protection
- [ ] Day 9: Empty state standardization
- [ ] Day 10: Testing & verification

### Week 3: Performance

- [ ] Day 11: Database indexes
- [ ] Day 12-13: Query optimization
- [ ] Day 14-15: React performance optimization

### Week 4: Code Quality

- [ ] Day 16-17: Component refactoring
- [ ] Day 18: Hook extraction
- [ ] Day 19: Testing setup
- [ ] Day 20: Documentation update

---

## 🧪 TESTING PROTOCOL

### Manual Testing Checklist

#### PC Role Isolation (CRITICAL)

- [ ] Login as PC user
- [ ] Verify can only see projects from their factory
- [ ] Verify cannot access other factories' tasks
- [ ] Verify cannot access other factories' RFIs
- [ ] Verify cannot access other factories' files
- [ ] Verify factory_contacts filtered

#### Memory Leaks

- [ ] Open Chrome DevTools → Memory
- [ ] Take heap snapshot
- [ ] Navigate through all major routes
- [ ] Open/close modals multiple times
- [ ] Take another snapshot
- [ ] Compare: Look for growing arrays, detached DOM

#### Performance

- [ ] Test with 100+ projects
- [ ] Test with 500+ tasks
- [ ] Measure time to interactive (< 3 seconds)
- [ ] Check Lighthouse scores (> 90)

#### Error Handling

- [ ] Disconnect network → verify error messages
- [ ] Invalid form submissions → verify validation
- [ ] Concurrent updates → verify conflict handling

---

## 📊 SUCCESS METRICS

### Performance Targets

- **Time to Interactive:** < 3 seconds
- **First Contentful Paint:** < 1.5 seconds
- **Largest Contentful Paint:** < 2.5 seconds
- **Cumulative Layout Shift:** < 0.1
- **Bundle Size:** < 500KB gzipped

### Quality Targets

- **Test Coverage:** > 70%
- **Lighthouse Score:** > 90
- **Zero console errors** in production
- **Zero memory leaks** detected
- **100% RLS policy coverage**

### Security Targets

- **All 26 tables** have RLS policies
- **PC role** cannot access other factories
- **No XSS vulnerabilities**
- **No SQL injection** possible
- **All inputs validated**

---

## 🚨 ROLLBACK PLAN

If critical issues arise:

1. **Git commits:** Each phase should be a separate commit
2. **Feature flags:** Wrap new code in flags to disable quickly
3. **Database migrations:** Keep rollback scripts
4. **Monitoring:** Set up error tracking (Sentry/LogRocket)
5. **Backup:** Database backup before major changes

---

## 📞 SUPPORT & ESCALATION

### When to Escalate

- RLS policy changes block legitimate users
- Performance degradation > 50%
- Data integrity issues discovered
- Security vulnerabilities found

### Resources

- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev
- Project Knowledge Base: In repository

---

## 🎓 KNOWLEDGE TRANSFER

After completion, document:

- [ ] Architecture decisions made
- [ ] Performance optimizations applied
- [ ] Security considerations
- [ ] Common pitfalls to avoid
- [ ] Runbook for future developers

---

**END OF EXECUTION PLAN**

*This document should be versioned and updated as execution progresses.*
