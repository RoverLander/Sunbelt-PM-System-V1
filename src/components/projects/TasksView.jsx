// ============================================================================
// TasksView.jsx - Task List/Board Toggle View (POLISHED VERSION)
// ============================================================================
// Displays tasks in either list or kanban board view with filtering.
// Works with KanbanBoard.jsx for drag-and-drop status updates.
//
// PROPS:
// - tasks: Array of task objects
// - projectId: Current project ID
// - projectName: Project name for context
// - projectNumber: Project number for context
// - onTaskClick: Callback when task is clicked (opens edit modal)
// - onAddTask: Callback to open add task modal
// - onTasksChange: Callback to update tasks array in parent
// - showToast: Toast notification function
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { List, LayoutGrid, Plus, Filter, Search, X, AlertTriangle, User, Users } from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================

// Status options matching database values (Title Case)
// Updated Jan 9, 2026: 'On Hold' and 'Blocked' merged into 'Awaiting Response'
const STATUS_OPTIONS = [
  { value: 'Not Started', label: 'Not Started', color: 'var(--text-tertiary)' },
  { value: 'In Progress', label: 'In Progress', color: 'var(--sunbelt-orange)' },
  { value: 'Awaiting Response', label: 'Awaiting Response', color: 'var(--warning)' },
  { value: 'Completed', label: 'Completed', color: 'var(--success)' },
  { value: 'Cancelled', label: 'Cancelled', color: 'var(--text-tertiary)' }
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'Critical', label: 'Critical', color: '#dc2626' },
  { value: 'High', label: 'High', color: '#ef4444' },
  { value: 'Medium', label: 'Medium', color: '#f59e0b' },
  { value: 'Low', label: 'Low', color: '#22c55e' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get status color
 */
const getStatusColor = (status) => {
  const option = STATUS_OPTIONS.find(o => o.value === status);
  return option?.color || 'var(--text-secondary)';
};

/**
 * Get priority color
 */
const getPriorityColor = (priority) => {
  const option = PRIORITY_OPTIONS.find(o => o.value === priority);
  return option?.color || 'var(--text-secondary)';
};

/**
 * Check if date is overdue
 */
const isOverdue = (dateString, status) => {
  if (!dateString) return false;
  if (['Completed', 'Cancelled'].includes(status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateString) < today;
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Status Badge Component
 */
function StatusBadge({ status }) {
  const color = getStatusColor(status);

  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '600',
      background: `${color}15`,
      color: color
    }}>
      {status || 'Not Started'}
    </span>
  );
}

/**
 * Priority Badge Component
 */
function PriorityBadge({ priority }) {
  const color = getPriorityColor(priority);

  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.6875rem',
      fontWeight: '600',
      background: `${color}15`,
      color: color,
      textTransform: 'uppercase'
    }}>
      {priority || 'Normal'}
    </span>
  );
}

/**
 * View Toggle Button Group
 */
function ViewToggle({ viewMode, onChange }) {
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
          background: viewMode === 'list' ? 'var(--bg-primary)' : 'transparent',
          color: viewMode === 'list' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
          fontWeight: '600',
          fontSize: '0.875rem',
          cursor: 'pointer',
          boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
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
          background: viewMode === 'board' ? 'var(--bg-primary)' : 'transparent',
          color: viewMode === 'board' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
          fontWeight: '600',
          fontSize: '0.875rem',
          cursor: 'pointer',
          boxShadow: viewMode === 'board' ? 'var(--shadow-sm)' : 'none',
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
// MAIN COMPONENT
// ============================================================================
function TasksView({
  tasks,
  projectId,
  projectName,
  projectNumber,
  onTaskClick,
  onAddTask,
  onTasksChange,
  showToast
}) {
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  const { user } = useAuth();
  const currentUserId = user?.id;

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [viewMode, setViewMode] = useState('list');
  const [filterOwnership, setFilterOwnership] = useState('all'); // 'all' or 'mine'
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  // Get unique assignees for filter dropdown
  const assignees = useMemo(() => {
    const names = tasks.map(t =>
      t.external_assignee_name || t.assignee?.name
    ).filter(Boolean);
    return [...new Set(names)].sort();
  }, [tasks]);

  // Filter tasks based on all criteria
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Ownership filter (My Tasks vs All Tasks)
      if (filterOwnership === 'mine' && currentUserId) {
        const isAssignedToMe = task.assignee_id === currentUserId;
        const isOwnedByMe = task.internal_owner_id === currentUserId;
        const isCreatedByMe = task.created_by === currentUserId;
        if (!isAssignedToMe && !isOwnedByMe && !isCreatedByMe) return false;
      }

      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

      // Status filter
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;

      // Assignee filter
      if (filterAssignee !== 'all') {
        const taskAssignee = task.external_assignee_name || task.assignee?.name;
        if (taskAssignee !== filterAssignee) return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(search);
        const matchesDesc = task.description?.toLowerCase().includes(search);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [tasks, filterOwnership, currentUserId, filterPriority, filterStatus, filterAssignee, searchTerm]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterPriority !== 'all') count++;
    if (filterStatus !== 'all') count++;
    if (filterAssignee !== 'all') count++;
    if (searchTerm) count++;
    return count;
  }, [filterPriority, filterStatus, filterAssignee, searchTerm]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Handle task status update from Kanban board drag-and-drop
   */
  const handleStatusChange = useCallback(async (taskId, newStatus) => {
    if (isUpdating) return;

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          // If completing, set completed_at
          ...(newStatus === 'Completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state optimistically
      onTasksChange(tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ));

      showToast(`Task moved to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Failed to update task status', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [tasks, onTasksChange, showToast, isUpdating]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilterPriority('all');
    setFilterStatus('all');
    setFilterAssignee('all');
    setSearchTerm('');
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div>
      {/* ================================================================== */}
      {/* HEADER - View Toggle, Filters, Add Button                         */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        {/* Left side - View toggle and filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {/* View Toggle */}
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />

            {/* Search */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              minWidth: '200px'
            }}>
              <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  width: '100%'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filter dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {/* Ownership Toggle - My Tasks vs All Tasks */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                onClick={() => setFilterOwnership('all')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: filterOwnership === 'all' ? 'var(--bg-primary)' : 'transparent',
                  color: filterOwnership === 'all' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  boxShadow: filterOwnership === 'all' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <Users size={14} />
                All Tasks
              </button>
              <button
                onClick={() => setFilterOwnership('mine')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: filterOwnership === 'mine' ? 'var(--bg-primary)' : 'transparent',
                  color: filterOwnership === 'mine' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  boxShadow: filterOwnership === 'mine' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <User size={14} />
                My Tasks
              </button>
            </div>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

            <Filter size={16} style={{ color: 'var(--text-tertiary)' }} />

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Priority filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Priorities</option>
              {PRIORITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Assignee filter */}
            {assignees.length > 0 && (
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  maxWidth: '180px'
                }}
              >
                <option value="all">All Assignees</option>
                {assignees.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}

            {/* Clear filters button */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--sunbelt-orange)',
                  color: 'white',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                <X size={14} />
                Clear ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* Right side - Add Task Button */}
        <button
          onClick={onAddTask}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.875rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* ================================================================== */}
      {/* TASK COUNT                                                        */}
      {/* ================================================================== */}
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--space-md)'
      }}>
        Showing {filteredTasks.length} of {tasks.length} tasks
        {activeFilterCount > 0 && (
          <span style={{ color: 'var(--sunbelt-orange)' }}>
            {' '}(filtered)
          </span>
        )}
      </p>

      {/* ================================================================== */}
      {/* VIEW CONTENT - Board or List                                      */}
      {/* ================================================================== */}
      {viewMode === 'board' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onTaskClick={onTaskClick}
        />
      ) : (
        /* List View */
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {filteredTasks.length === 0 ? (
            <div style={{
              padding: 'var(--space-2xl)',
              textAlign: 'center',
              color: 'var(--text-tertiary)'
            }}>
              {tasks.length === 0 ? (
                <>
                  <p style={{ marginBottom: 'var(--space-sm)' }}>No tasks yet</p>
                  <p style={{ fontSize: '0.875rem' }}>Create your first task to get started</p>
                </>
              ) : (
                <>
                  <p style={{ marginBottom: 'var(--space-sm)' }}>No tasks match your filters</p>
                  <button
                    onClick={clearFilters}
                    style={{
                      color: 'var(--sunbelt-orange)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{
                      padding: 'var(--space-md)',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Task</th>
                    <th style={{
                      padding: 'var(--space-md)',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '120px'
                    }}>Status</th>
                    <th style={{
                      padding: 'var(--space-md)',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '100px'
                    }}>Priority</th>
                    <th style={{
                      padding: 'var(--space-md)',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '160px'
                    }}>Assignee</th>
                    <th style={{
                      padding: 'var(--space-md)',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '140px'
                    }}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task, index) => {
                    const taskOverdue = isOverdue(task.due_date, task.status);
                    const isExternal = !!task.external_assignee_email;
                    const assigneeName = isExternal
                      ? task.external_assignee_name
                      : task.assignee?.name;

                    return (
                      <tr
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        style={{
                          borderTop: index > 0 ? '1px solid var(--border-color)' : 'none',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          background: taskOverdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = taskOverdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}
                      >
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 'var(--space-sm)'
                          }}>
                            {taskOverdue && (
                              <AlertTriangle
                                size={16}
                                style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }}
                              />
                            )}
                            <div>
                              <div style={{
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                marginBottom: '2px'
                              }}>
                                {task.title}
                              </div>
                              {task.description && (
                                <div style={{
                                  fontSize: '0.8125rem',
                                  color: 'var(--text-tertiary)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '300px'
                                }}>
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <StatusBadge status={task.status} />
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          {assigneeName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                              <span style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-primary)',
                                maxWidth: '120px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {assigneeName}
                              </span>
                              {isExternal && (
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.625rem',
                                  fontWeight: '600',
                                  background: 'rgba(255, 107, 53, 0.1)',
                                  color: 'var(--sunbelt-orange)'
                                }}>
                                  Ext
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <span style={{
                            fontSize: '0.875rem',
                            color: taskOverdue ? 'var(--danger)' : 'var(--text-secondary)',
                            fontWeight: taskOverdue ? '600' : '400'
                          }}>
                            {formatDate(task.due_date)}
                            {taskOverdue && ' (Overdue)'}
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
    </div>
  );
}

export default TasksView;