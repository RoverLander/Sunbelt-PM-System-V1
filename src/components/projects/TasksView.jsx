import React, { useState } from 'react';
import { List, LayoutGrid, Plus, Filter } from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import { supabase } from '../../utils/supabaseClient';

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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  // Get unique assignees for filter
  const assignees = [...new Set(tasks.map(t => 
    t.external_assignee_name || t.assignee?.name
  ).filter(Boolean))];

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    
    if (filterAssignee !== 'all') {
      const taskAssignee = task.external_assignee_name || task.assignee?.name;
      if (taskAssignee !== filterAssignee) return false;
    }
    
    return true;
  });

  // Handle task status update from Kanban board
  const handleTaskUpdate = async (updatedTask) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: updatedTask.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedTask.id);

      if (error) throw error;

      // Update local state
      onTasksChange(tasks.map(t => 
        t.id === updatedTask.id ? { ...t, status: updatedTask.status } : t
      ));

      showToast(`Task moved to ${updatedTask.status}`, 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task', 'error');
    }
  };

  // Status badge component for list view
  const StatusBadge = ({ status }) => {
    const colors = {
      'Not Started': { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b' },
      'In Progress': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
      'Blocked': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
      'Completed': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
      'Cancelled': { bg: 'rgba(100, 116, 139, 0.1)', color: '#94a3b8' }
    };
    const style = colors[status] || colors['Not Started'];
    
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      }}>
        {status}
      </span>
    );
  };

  // Priority badge component for list view
  const PriorityBadge = ({ priority }) => {
    const colors = {
      'Low': '#64748b',
      'Medium': '#f59e0b',
      'High': '#ef4444',
      'Critical': '#dc2626'
    };
    
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.6875rem',
        fontWeight: '600',
        background: `${colors[priority]}15`,
        color: colors[priority],
        textTransform: 'uppercase'
      }}>
        {priority}
      </span>
    );
  };

  return (
    <div>
      {/* Header with View Toggle and Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {/* View Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setViewMode('list')}
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
              onClick={() => setViewMode('board')}
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

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Filter size={16} style={{ color: 'var(--text-tertiary)' }} />
            
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
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

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
          </div>
        </div>

        {/* Add Task Button */}
        <button
          onClick={onAddTask}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* Task Count */}
      <p style={{ 
        fontSize: '0.875rem', 
        color: 'var(--text-secondary)', 
        marginBottom: 'var(--space-md)' 
      }}>
        Showing {filteredTasks.length} of {tasks.length} tasks
      </p>

      {/* View Content */}
      {viewMode === 'board' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskUpdate={handleTaskUpdate}
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
              padding: 'var(--space-xl)',
              textAlign: 'center',
              color: 'var(--text-tertiary)'
            }}>
              <p>No tasks found</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Task</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Priority</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Assignee</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, index) => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';
                  const isExternal = task.external_assignee_email;
                  const assigneeName = isExternal ? task.external_assignee_name : task.assignee?.name;
                  
                  return (
                    <tr 
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      style={{ 
                        borderTop: index > 0 ? '1px solid var(--border-color)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: 'var(--space-md)' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
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
                              color: 'var(--text-primary)' 
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
                                External
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
                        {task.due_date ? (
                          <span style={{ 
                            fontSize: '0.875rem',
                            color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)',
                            fontWeight: isOverdue ? '600' : '400'
                          }}>
                            {new Date(task.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default TasksView;