// ===== TASKS VIEW COMPONENT =====
// Provides list/board toggle view for tasks within a project
// Includes filtering, status updates, and integrates KanbanBoard
// IMPORTANT: Maintains consistent layout/size between view modes

import React, { useState } from 'react';
import { 
  List, 
  LayoutGrid, 
  Plus, 
  Filter,
  Calendar,
  User,
  ChevronRight,
  ExternalLink,
  CheckSquare
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import KanbanBoard from './KanbanBoard';

// ============================================================================
// TASKS VIEW COMPONENT
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
  // ===== VIEW STATE =====
  const [viewMode, setViewMode] = useState('board'); // Default to board view
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // ===== FILTER TASKS =====
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  // ===== STATUS UPDATE HANDLER =====
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      onTasksChange(updatedTasks);
      
      showToast(`Task moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Failed to update task status', 'error');
    }
  };

  // ===== FORMATTING HELPERS =====
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'var(--text-muted)',
      'In Progress': 'var(--sunbelt-orange)',
      'On Hold': '#f59e0b',
      'Completed': 'var(--success)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': '#8b0000',
      'High': '#ef4444',
      'Medium': '#f59e0b',
      'Low': '#22c55e'
    };
    return colors[priority] || 'var(--text-secondary)';
  };

  // ===== RENDER =====
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '600px' // Consistent minimum height
    }}>
      {/* ================================================================== */}
      {/* HEADER WITH CONTROLS - Fixed position                             */}
      {/* ================================================================== */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 'var(--space-lg)',
        borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <CheckSquare size={20} style={{ color: 'var(--sunbelt-orange)' }} />
          Tasks ({filteredTasks.length})
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Filter size={16} color="var(--text-secondary)" />
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Status</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* View Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-primary)',
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
                padding: '6px 12px',
                background: viewMode === 'list' ? 'var(--sunbelt-orange)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.8125rem',
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
                padding: '6px 12px',
                background: viewMode === 'board' ? 'var(--sunbelt-orange)' : 'transparent',
                color: viewMode === 'board' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.8125rem',
                transition: 'all 0.15s'
              }}
            >
              <LayoutGrid size={16} />
              Board
            </button>
          </div>

          {/* Add Task Button */}
          <button
            onClick={onAddTask}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* CONTENT AREA - Fixed height container for consistent layout       */}
      {/* ================================================================== */}
      <div style={{ 
        flex: 1,
        padding: 'var(--space-lg)',
        minHeight: '500px', // Consistent content area height
        overflow: 'auto'
      }}>
        {/* Empty State */}
        {tasks.length === 0 ? (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '400px',
            color: 'var(--text-tertiary)' 
          }}>
            <CheckSquare size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
              No tasks yet
            </h4>
            <p>Create your first task to get started</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '400px',
            color: 'var(--text-tertiary)' 
          }}>
            <Filter size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
              No tasks match filters
            </h4>
            <p>Try adjusting your filters</p>
          </div>
        ) : viewMode === 'board' ? (
          /* ================================================================== */
          /* KANBAN BOARD VIEW                                                  */
          /* ================================================================== */
          <KanbanBoard
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onTaskClick={onTaskClick}
            showProject={false}
          />
        ) : (
          /* ================================================================== */
          /* LIST VIEW - Same container height as board                         */
          /* ================================================================== */
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--space-sm)',
            minHeight: '400px' // Match board minimum height
          }}>
            {filteredTasks.map(task => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';
              
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    borderLeft: isOverdue ? '3px solid #ef4444' : '3px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-sm)', 
                      marginBottom: '4px',
                      flexWrap: 'wrap'
                    }}>
                      {/* External indicator */}
                      {(task.external_assignee_email || task.external_assignee_name) && (
                        <ExternalLink size={14} color="var(--sunbelt-orange)" title="External Task" />
                      )}
                      
                      {/* Title */}
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {task.title}
                      </span>
                      
                      {/* Status Badge */}
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        background: `${getStatusColor(task.status)}20`,
                        color: getStatusColor(task.status)
                      }}>
                        {task.status}
                      </span>
                      
                      {/* Priority Badge */}
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        background: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority)
                      }}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <div style={{ 
                      fontSize: '0.8125rem', 
                      color: 'var(--text-secondary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-md)' 
                    }}>
                      {/* Assignee */}
                      {(task.assignee?.name || task.external_assignee_name) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          {task.assignee?.name || task.external_assignee_name}
                        </span>
                      )}
                      
                      {/* Due Date */}
                      {task.due_date && (
                        <>
                          <span>•</span>
                          <span style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            color: isOverdue ? '#ef4444' : 'var(--text-secondary)'
                          }}>
                            <Calendar size={12} />
                            Due: {formatDate(task.due_date)}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TasksView;