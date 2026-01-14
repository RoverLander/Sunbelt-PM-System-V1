// ============================================================================
// TasksPage.jsx - Tasks Landing Page with List/Kanban Toggle
// ============================================================================
// Standalone page showing all tasks across projects.
// For Directors: Shows all tasks across all projects
// For PMs: Shows tasks from their assigned projects
//
// FEATURES:
// - List view (table) and Kanban board view toggle
// - Drag-and-drop status updates in Kanban view
// - Drag-to-trash deletion
// - Click card to edit task inline
// - "Go to Project" navigation from modal
// - Filters: status, project, priority, search
// - Wider layout (maxWidth: 1600px)
//
// FIXES (Jan 9, 2026):
// - ✅ ADDED: Kanban board view with 4 columns
// - ✅ ADDED: List/Board view toggle
// - ✅ ADDED: Drag-to-delete trash zone
// - ✅ ADDED: Edit task modal with Go to Project link
// - ✅ FIXED: Wider layout to use more screen space
//
// DEPENDENCIES:
// - supabaseClient: Database operations
// - AuthContext: User authentication
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Search,
  AlertCircle,
  Calendar,
  User,
  FolderKanban,
  List,
  LayoutGrid,
  Trash2,
  X,
  Save,
  ExternalLink,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { exportAllTasks } from '../../utils/excelExport';

// ============================================================================
// CONSTANTS
// ============================================================================

const KANBAN_STATUSES = ['Not Started', 'In Progress', 'Awaiting Response', 'Completed'];

const STATUS_COLORS = {
  'Not Started': 'var(--text-tertiary)',
  'In Progress': 'var(--sunbelt-orange)',
  'Awaiting Response': 'var(--warning)',
  'Completed': 'var(--success)',
  'Cancelled': 'var(--text-tertiary)'
};

const PRIORITY_COLORS = {
  'Low': 'var(--text-tertiary)',
  'Normal': 'var(--info)',
  'Medium': 'var(--warning)',
  'High': 'var(--sunbelt-orange)',
  'Critical': 'var(--danger)'
};

const ALL_STATUSES = ['Not Started', 'In Progress', 'Awaiting Response', 'Completed', 'Cancelled'];
const PRIORITIES = ['Low', 'Normal', 'Medium', 'High', 'Critical'];

// Priority order for sorting (higher number = higher priority)
const PRIORITY_ORDER = { 'Critical': 5, 'High': 4, 'Medium': 3, 'Normal': 2, 'Low': 1 };
const STATUS_ORDER = { 'Not Started': 1, 'In Progress': 2, 'Awaiting Response': 3, 'Completed': 4, 'Cancelled': 5 };

// ============================================================================
// SORTABLE TABLE HEADER COMPONENT
// ============================================================================
function SortableHeader({ label, column, currentSort, onSort, width }) {
  const isActive = currentSort.column === column;
  const direction = isActive ? currentSort.direction : null;

  return (
    <th
      onClick={() => onSort(column)}
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: isActive ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
        textTransform: 'uppercase',
        cursor: 'pointer',
        userSelect: 'none',
        width: width,
        transition: 'color 0.15s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sunbelt-orange)'}
      onMouseLeave={(e) => e.currentTarget.style.color = isActive ? 'var(--sunbelt-orange)' : 'var(--text-secondary)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {direction === 'asc' ? (
          <ChevronUp size={14} />
        ) : direction === 'desc' ? (
          <ChevronDown size={14} />
        ) : (
          <ChevronsUpDown size={14} style={{ opacity: 0.4 }} />
        )}
      </div>
    </th>
  );
}

// ============================================================================
// VIEW TOGGLE COMPONENT
// ============================================================================
function ViewToggle({ view, onChange }) {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      padding: '4px',
      border: '1px solid var(--border-color)'
    }}>
      <button
        onClick={() => onChange('list')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          background: view === 'list' ? 'var(--bg-primary)' : 'transparent',
          color: view === 'list' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
          fontWeight: '600',
          fontSize: '0.875rem',
          cursor: 'pointer',
          boxShadow: view === 'list' ? 'var(--shadow-sm)' : 'none',
          transition: 'all 0.15s'
        }}
      >
        <List size={16} />
        List
      </button>
      <button
        onClick={() => onChange('board')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          background: view === 'board' ? 'var(--bg-primary)' : 'transparent',
          color: view === 'board' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
          fontWeight: '600',
          fontSize: '0.875rem',
          cursor: 'pointer',
          boxShadow: view === 'board' ? 'var(--shadow-sm)' : 'none',
          transition: 'all 0.15s'
        }}
      >
        <LayoutGrid size={16} />
        Board
      </button>
    </div>
  );
}

// ============================================================================
// TASK CARD COMPONENT (for Kanban)
// ============================================================================
function TaskCard({ task, onEdit, onDragStart }) {
  const isOverdue = task.due_date && 
    new Date(task.due_date) < new Date() && 
    !['Completed', 'Cancelled'].includes(task.status);

  const projectColor = task.project?.color || 'var(--sunbelt-orange)';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onEdit(task)}
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border-color)'}`,
        cursor: 'grab',
        transition: 'all 0.15s',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isOverdue ? 'var(--danger)' : 'var(--border-color)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Drag Handle */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        color: 'var(--text-tertiary)',
        opacity: 0.5
      }}>
        <GripVertical size={14} />
      </div>

      {/* Project Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: projectColor
        }} />
        <span style={{
          fontSize: '0.6875rem',
          color: 'var(--text-tertiary)',
          fontWeight: '500'
        }}>
          {task.project?.project_number || 'No Project'}
        </span>
      </div>

      {/* Task Title */}
      <div style={{
        fontWeight: '600',
        fontSize: '0.875rem',
        color: 'var(--text-primary)',
        marginBottom: '8px',
        lineHeight: '1.3',
        paddingRight: '16px'
      }}>
        {task.title}
      </div>

      {/* Priority & Due Date Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Priority Badge */}
        {task.priority && task.priority !== 'Normal' && (
          <span style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.6875rem',
            fontWeight: '600',
            background: `${PRIORITY_COLORS[task.priority]}20`,
            color: PRIORITY_COLORS[task.priority]
          }}>
            {task.priority}
          </span>
        )}

        {/* Due Date */}
        {task.due_date && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.6875rem',
            color: isOverdue ? 'var(--danger)' : 'var(--text-tertiary)',
            fontWeight: isOverdue ? '600' : '500'
          }}>
            <Calendar size={10} />
            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Assignee */}
      {(task.assignee?.name || task.external_assignee_name) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.6875rem',
          color: 'var(--text-tertiary)'
        }}>
          <User size={10} />
          {task.external_assignee_name || task.assignee?.name}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// KANBAN COLUMN COMPONENT
// ============================================================================
function KanbanColumn({ status, tasks, onDragOver, onDrop, onEdit, onDragStart }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const columnTasks = tasks.filter(t => t.status === status);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver(e);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, status);
      }}
      style={{
        flex: 1,
        minWidth: '280px',
        maxWidth: '350px',
        background: isDragOver ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-lg)',
        border: isDragOver ? '2px dashed var(--sunbelt-orange)' : '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s'
      }}
    >
      {/* Column Header */}
      <div style={{
        padding: 'var(--space-md)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: STATUS_COLORS[status]
          }} />
          <span style={{
            fontWeight: '600',
            fontSize: '0.875rem',
            color: 'var(--text-primary)'
          }}>
            {status}
          </span>
        </div>
        <span style={{
          background: 'var(--bg-primary)',
          padding: '2px 10px',
          borderRadius: '10px',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          {columnTasks.length}
        </span>
      </div>

      {/* Cards Container */}
      <div style={{
        padding: 'var(--space-sm)',
        flex: 1,
        minHeight: '300px',
        maxHeight: '60vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)'
      }}>
        {columnTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDragStart={onDragStart}
          />
        ))}
        {columnTasks.length === 0 && (
          <div style={{
            padding: 'var(--space-xl)',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: '0.8125rem'
          }}>
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TRASH DROP ZONE COMPONENT
// ============================================================================
function TrashZone({ isDragActive, onDrop }) {
  const [isOver, setIsOver] = useState(false);

  if (!isDragActive) return null;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        onDrop(e);
      }}
      style={{
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: isOver ? 'translateX(-50%) scale(1.1)' : 'translateX(-50%) scale(1)',
        padding: '16px 32px',
        background: isOver ? 'var(--danger)' : 'rgba(239, 68, 68, 0.9)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'white',
        fontWeight: '600',
        fontSize: '0.9375rem',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 1000,
        transition: 'all 0.2s'
      }}
    >
      <Trash2 size={20} />
      {isOver ? 'Release to Delete' : 'Drop here to delete'}
    </div>
  );
}

// ============================================================================
// EDIT TASK MODAL COMPONENT
// ============================================================================
function EditTaskModal({ task, isOpen, onClose, onSave, onNavigateToProject, users }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Not Started',
    priority: 'Normal',
    due_date: '',
    assignee_id: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Not Started',
        priority: task.priority || 'Normal',
        due_date: task.due_date || '',
        assignee_id: task.assignee_id || ''
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(task.id, formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !task) return null;

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    marginBottom: '6px'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Edit Task
            </h2>
            {/* Project Link */}
            <button
              onClick={() => onNavigateToProject(task.project_id, 'tasks')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--sunbelt-orange)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <FolderKanban size={14} />
              {task.project?.project_number} - {task.project?.name}
              <ExternalLink size={12} />
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-lg)' }}>
          {/* Title */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          {/* Status & Priority Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                style={inputStyle}
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                style={inputStyle}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Assignee Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Assignee</label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, assignee_id: e.target.value }))}
                style={inputStyle}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function TasksPage({
  isDirectorView = false,
  onNavigateToProject,
  includeBackupProjects = false,
  onToggleBackupProjects,
  initialFilter = null
}) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE - DATA
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // ==========================================================================
  // STATE - UI
  // ==========================================================================
  const [view, setView] = useState('list');
  const [toast, setToast] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

  // ==========================================================================
  // STATE - FILTERS
  // ==========================================================================
  const [filterStatus, setFilterStatus] = useState(initialFilter || 'open');
  const [filterProject, setFilterProject] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ==========================================================================
  // STATE - SORTING
  // ==========================================================================
  const [sort, setSort] = useState({ column: 'due_date', direction: 'asc' });

  // Update filter when initialFilter prop changes (from sidebar click)
  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
    }
  }, [initialFilter]);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    if (user) fetchData();
  }, [user, isDirectorView, includeBackupProjects]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setCurrentUser(userData);

      // Get all users for assignee dropdown
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('is_active', true)
        .order('name');

      setUsers(usersData || []);

      // Get projects based on view type
      // FIX: Removed .or() filter - use client-side filtering to avoid 400 errors in web containers
      const { data: allProjectsData } = await supabase
        .from('projects')
        .select('id, project_number, name, color, owner_id, primary_pm_id, backup_pm_id, created_by');

      // Client-side filter for user's projects
      let projectsData = allProjectsData || [];
      if (!isDirectorView && userData) {
        projectsData = projectsData.filter(p => {
          if (includeBackupProjects) {
            return p.owner_id === userData.id ||
                   p.primary_pm_id === userData.id ||
                   p.backup_pm_id === userData.id ||
                   p.created_by === userData.id;
          } else {
            return p.owner_id === userData.id ||
                   p.primary_pm_id === userData.id ||
                   p.created_by === userData.id;
          }
        });
      }
      setProjects(projectsData);

      const projectIds = projectsData.map(p => p.id);
      const projectIdsSet = new Set(projectIds);

      // FIX: Removed .in() filter - use client-side filtering
      const { data: allTasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(id, project_number, name, color),
          assignee:assignee_id(name),
          internal_owner:internal_owner_id(name)
        `);

      // Debug logging
      console.log('[TasksPage] isDirectorView:', isDirectorView);
      console.log('[TasksPage] Projects found:', projectsData?.length || 0);
      console.log('[TasksPage] All tasks fetched:', allTasksData?.length || 0);

      // Client-side filter and sort
      const tasksData = (allTasksData || [])
        .filter(t => projectIdsSet.has(t.project_id))
        .sort((a, b) => new Date(a.due_date || '9999') - new Date(b.due_date || '9999'));

      console.log('[TasksPage] Tasks after filter:', tasksData.length);
      setTasks(tasksData);
    } catch (error) {
      console.error('[TasksPage] Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FILTER TASKS
  // ==========================================================================
  // Handle sort column click
  const handleSort = (column) => {
    setSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort comparator function
  const sortTasks = (a, b) => {
    const { column, direction } = sort;
    const multiplier = direction === 'asc' ? 1 : -1;

    switch (column) {
      case 'title':
        return multiplier * (a.title || '').localeCompare(b.title || '');
      case 'project':
        return multiplier * (a.project?.project_number || '').localeCompare(b.project?.project_number || '');
      case 'priority':
        return multiplier * ((PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0));
      case 'status':
        return multiplier * ((STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0));
      case 'due_date':
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return multiplier * 1;
        if (!b.due_date) return multiplier * -1;
        return multiplier * new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      case 'assignee':
        const aName = a.external_assignee_name || a.assignee?.name || '';
        const bName = b.external_assignee_name || b.assignee?.name || '';
        return multiplier * aName.localeCompare(bName);
      default:
        return 0;
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filterStatus === 'open' && ['Completed', 'Cancelled'].includes(task.status)) return false;
    if (filterStatus === 'completed' && task.status !== 'Completed') return false;
    if (filterStatus === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      if (!task.due_date || task.due_date >= today || ['Completed', 'Cancelled'].includes(task.status)) return false;
    }

    // Project filter
    if (filterProject !== 'all' && task.project_id !== filterProject) return false;

    // Priority filter
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !task.title?.toLowerCase().includes(term) &&
        !task.project?.project_number?.toLowerCase().includes(term) &&
        !task.project?.name?.toLowerCase().includes(term)
      ) {
        return false;
      }
    }

    return true;
  }).sort(sortTasks);

  // ==========================================================================
  // STATS
  // ==========================================================================
  const today = new Date().toISOString().split('T')[0];
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const stats = {
    total: tasks.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length,
    overdue: tasks.filter(t =>
      t.due_date && t.due_date < today && !['Completed', 'Cancelled'].includes(t.status)
    ).length,
    dueThisWeek: tasks.filter(t =>
      t.due_date && t.due_date >= today && t.due_date <= weekFromNow && !['Completed', 'Cancelled'].includes(t.status)
    ).length
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'Completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', draggedTask.id);

      if (error) throw error;

      setTasks(prev => prev.map(t =>
        t.id === draggedTask.id ? { ...t, status: newStatus } : t
      ));

      showToast(`Task moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task', 'error');
    } finally {
      setDraggedTask(null);
    }
  };

  const handleTrashDrop = async (e) => {
    e.preventDefault();
    if (!draggedTask) return;

    if (!window.confirm(`Are you sure you want to delete "${draggedTask.title}"? This cannot be undone.`)) {
      setDraggedTask(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', draggedTask.id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== draggedTask.id));
      showToast('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task', 'error');
    } finally {
      setDraggedTask(null);
    }
  };

  const handleSaveTask = async (taskId, formData) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...formData,
          assignee_id: formData.assignee_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Refresh tasks
      await fetchData();
      showToast('Task updated');
    } catch (error) {
      console.error('Error saving task:', error);
      showToast('Failed to save task', 'error');
    }
  };

  const handleRowClick = (task) => {
    if (view === 'list') {
      // In list view, navigate to project
      onNavigateToProject(task.project_id, 'tasks');
    }
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || ['Completed', 'Cancelled'].includes(status)) return false;
    return new Date(dueDate) < new Date();
  };

  // ==========================================================================
  // RENDER - LOADING
  // ==========================================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Loading tasks...</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - MAIN
  // ==========================================================================
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1001,
          fontWeight: '500'
        }}>
          {toast.message}
        </div>
      )}

      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckSquare size={28} style={{ color: 'var(--sunbelt-orange)' }} />
              {isDirectorView ? 'All Tasks' : 'My Tasks'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {isDirectorView ? 'Tasks across all projects' : 'Tasks from your assigned projects'}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Export to Excel */}
            <button
              onClick={() => exportAllTasks(tasks)}
              disabled={tasks.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: tasks.length === 0 ? 'not-allowed' : 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: '500',
                opacity: tasks.length === 0 ? 0.5 : 1,
                transition: 'all 0.15s'
              }}
              title="Export to Excel"
            >
              <Download size={16} />
              Export
            </button>

            {/* Include Backup Projects Toggle - only show for PM view */}
            {!isDirectorView && onToggleBackupProjects && (
              <button
                onClick={() => onToggleBackupProjects(!includeBackupProjects)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  background: includeBackupProjects ? 'rgba(249, 115, 22, 0.1)' : 'var(--bg-secondary)',
                  border: `1px solid ${includeBackupProjects ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  color: includeBackupProjects ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  transition: 'all 0.15s'
                }}
              >
                {includeBackupProjects ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                Include backup PM projects
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* STATS                                                             */}
      {/* ================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: 'var(--space-lg)', maxWidth: '600px' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Open Tasks</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.total}</div>
        </div>
        <div style={{
          background: stats.overdue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          border: stats.overdue > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-secondary)', marginBottom: '4px' }}>Overdue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{stats.overdue}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Due This Week</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.dueThisWeek}</div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* FILTERS & VIEW TOGGLE                                             */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap'
      }}>
        {/* Left: Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem'
            }}
          >
            <option value="open">Open Tasks</option>
            <option value="all">All Tasks</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem'
            }}
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.project_number} - {p.name}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem'
            }}
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                outline: 'none',
                width: '150px'
              }}
            />
          </div>
        </div>

        {/* Right: View Toggle */}
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* ================================================================== */}
      {/* CONTENT - LIST VIEW                                               */}
      {/* ================================================================== */}
      {view === 'list' && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {filteredTasks.length === 0 ? (
            <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <AlertCircle size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
              <p>No tasks found</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)' }}>
                    <SortableHeader label="Task" column="title" currentSort={sort} onSort={handleSort} />
                    <SortableHeader label="Project" column="project" currentSort={sort} onSort={handleSort} width="180px" />
                    <SortableHeader label="Priority" column="priority" currentSort={sort} onSort={handleSort} width="100px" />
                    <SortableHeader label="Status" column="status" currentSort={sort} onSort={handleSort} width="120px" />
                    <SortableHeader label="Due Date" column="due_date" currentSort={sort} onSort={handleSort} width="120px" />
                    <SortableHeader label="Assignee" column="assignee" currentSort={sort} onSort={handleSort} width="150px" />
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task, idx) => {
                    const overdue = isOverdue(task.due_date, task.status);
                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleRowClick(task)}
                        style={{
                          borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none',
                          cursor: 'pointer',
                          background: overdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = overdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{task.title}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.project?.color || 'var(--sunbelt-orange)' }} />
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{task.project?.project_number}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: `${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS['Normal']}20`,
                            color: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS['Normal']
                          }}>
                            {task.priority || 'Normal'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: `${STATUS_COLORS[task.status]}20`,
                            color: STATUS_COLORS[task.status]
                          }}>
                            {task.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: overdue ? 'var(--danger)' : 'var(--text-secondary)',
                            fontWeight: overdue ? '600' : '400',
                            fontSize: '0.8125rem'
                          }}>
                            <Calendar size={14} />
                            {formatDate(task.due_date)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {task.external_assignee_name || task.assignee?.name || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* CONTENT - KANBAN VIEW                                             */}
      {/* ================================================================== */}
      {view === 'board' && (
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-md)'
        }}>
          {KANBAN_STATUSES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={filteredTasks}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onEdit={setEditingTask}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      )}

      {/* Trash Zone (only visible when dragging in board view) */}
      {view === 'board' && (
        <TrashZone
          isDragActive={!!draggedTask}
          onDrop={handleTrashDrop}
        />
      )}

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
        onNavigateToProject={onNavigateToProject}
        users={users}
      />
    </div>
  );
}

export default TasksPage;