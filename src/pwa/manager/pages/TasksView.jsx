// ============================================================================
// TasksView.jsx - Tasks View Page for Manager PWA
// ============================================================================
// List and manage tasks with status filtering and quick actions.
//
// Created: January 17, 2026
// Phase 3 Implementation
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import { supabase } from '../../../utils/supabaseClient';
import {
  Search,
  Plus,
  CheckSquare,
  Clock,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Filter
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_FILTERS = [
  { id: 'all', label: 'All', color: '#6b7280' },
  { id: 'overdue', label: 'Overdue', color: '#ef4444' },
  { id: 'Not Started', label: 'Not Started', color: '#6b7280' },
  { id: 'In Progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'Awaiting Response', label: 'Awaiting', color: '#f59e0b' },
  { id: 'Completed', label: 'Completed', color: '#22c55e' }
];

const PRIORITY_COLORS = {
  'Low': '#6b7280',
  'Medium': '#3b82f6',
  'High': '#f59e0b',
  'Critical': '#ef4444'
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
    width: '100%',
    maxWidth: '100%'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)'
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '1rem',
    color: 'var(--text-primary)'
  },
  filterRow: {
    display: 'flex',
    gap: 'var(--space-sm)',
    overflowX: 'auto',
    paddingBottom: 'var(--space-xs)',
    WebkitOverflowScrolling: 'touch'
  },
  filterChip: {
    padding: 'var(--space-xs) var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.8rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  filterChipActive: {
    background: 'var(--accent-primary)',
    borderColor: 'var(--accent-primary)',
    color: 'white'
  },
  filterCount: {
    padding: '2px 6px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '10px',
    fontSize: '0.7rem'
  },
  taskCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    padding: 'var(--space-md) var(--space-lg)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease'
  },
  taskCardOverdue: {
    borderLeftWidth: '3px',
    borderLeftColor: '#ef4444'
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-sm)'
  },
  taskTitle: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    flex: 1,
    paddingRight: 'var(--space-sm)'
  },
  priorityBadge: {
    padding: '3px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.625rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    flexShrink: 0
  },
  taskMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-md)',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  projectTag: {
    padding: '2px 8px',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  dueDateOverdue: {
    color: '#ef4444',
    fontWeight: '500'
  },
  dueDateSoon: {
    color: '#f59e0b',
    fontWeight: '500'
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-tertiary)'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function TasksView({ onCreateTask }) {
  const { userId, canViewAllProjects } = useManagerAuth();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [counts, setCounts] = useState({});

  // ==========================================================================
  // FETCH TASKS
  // ==========================================================================

  const fetchTasks = useCallback(async () => {
    setLoading(true);

    try {
      // First get project IDs the user has access to
      let projectQuery = supabase.from('projects').select('id');

      if (!canViewAllProjects) {
        projectQuery = projectQuery.or(
          `owner_id.eq.${userId},primary_pm_id.eq.${userId},backup_pm_id.eq.${userId}`
        );
      }

      const { data: projects } = await projectQuery;
      const projectIds = projects?.map(p => p.id) || [];

      if (projectIds.length === 0) {
        setTasks([]);
        setCounts({});
        setLoading(false);
        return;
      }

      // Fetch tasks
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, project:projects(id, project_number, name)')
        .in('project_id', projectIds)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      // Calculate counts
      const today = new Date().toISOString().split('T')[0];
      const newCounts = {
        all: tasksData?.length || 0,
        overdue: 0,
        'Not Started': 0,
        'In Progress': 0,
        'Awaiting Response': 0,
        'Completed': 0
      };

      tasksData?.forEach(task => {
        if (task.status) {
          newCounts[task.status] = (newCounts[task.status] || 0) + 1;
        }
        if (task.due_date && task.due_date < today && task.status !== 'Completed') {
          newCounts.overdue++;
        }
      });

      setCounts(newCounts);
      setTasks(tasksData || []);
    } catch (err) {
      console.error('[TasksView] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, canViewAllProjects]);

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId, fetchTasks]);

  // ==========================================================================
  // FILTER TASKS
  // ==========================================================================

  const filteredTasks = tasks.filter(task => {
    // Status filter
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.due_date && task.due_date < today && task.status !== 'Completed';

    if (statusFilter === 'overdue' && !isOverdue) return false;
    if (statusFilter !== 'all' && statusFilter !== 'overdue' && task.status !== statusFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title?.toLowerCase().includes(query) ||
        task.project?.project_number?.toLowerCase().includes(query) ||
        task.project?.name?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDueDateStyle = (dateStr, status) => {
    if (!dateStr || status === 'Completed') return {};
    const today = new Date().toISOString().split('T')[0];
    const dueDate = dateStr;

    if (dueDate < today) return styles.dueDateOverdue;

    const daysUntil = Math.ceil((new Date(dueDate) - new Date(today)) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 3) return styles.dueDateSoon;

    return {};
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'Completed') return false;
    return task.due_date < new Date().toISOString().split('T')[0];
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Tasks</h1>
        <button style={styles.addButton} onClick={onCreateTask}>
          <Plus size={18} />
          New Task
        </button>
      </div>

      {/* Search Bar */}
      <div style={styles.searchBar}>
        <Search size={20} color="var(--text-tertiary)" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Filter Chips */}
      <div style={styles.filterRow}>
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id)}
            style={{
              ...styles.filterChip,
              ...(statusFilter === filter.id ? styles.filterChipActive : {})
            }}
          >
            {filter.label}
            {counts[filter.id] > 0 && (
              <span style={styles.filterCount}>{counts[filter.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={styles.emptyState}>
          <CheckSquare size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
          <p>No tasks found</p>
        </div>
      ) : (
        filteredTasks.map(task => (
          <div
            key={task.id}
            style={{
              ...styles.taskCard,
              ...(isOverdue(task) ? styles.taskCardOverdue : {})
            }}
          >
            <div style={styles.taskHeader}>
              <div style={styles.taskTitle}>{task.title}</div>
              <span
                style={{
                  ...styles.priorityBadge,
                  background: `${PRIORITY_COLORS[task.priority] || '#6b7280'}20`,
                  color: PRIORITY_COLORS[task.priority] || '#6b7280'
                }}
              >
                {task.priority}
              </span>
            </div>

            <div style={styles.taskMeta}>
              {/* Project */}
              {task.project && (
                <span style={styles.projectTag}>
                  {task.project.project_number}
                </span>
              )}

              {/* Status */}
              <div style={styles.metaItem}>
                <CheckSquare size={14} />
                {task.status}
              </div>

              {/* Due Date */}
              <div style={{ ...styles.metaItem, ...getDueDateStyle(task.due_date, task.status) }}>
                <Clock size={14} />
                {isOverdue(task) && <AlertTriangle size={12} />}
                {formatDate(task.due_date)}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
