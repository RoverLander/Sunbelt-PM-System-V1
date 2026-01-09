// ============================================================================
// KanbanBoard.jsx - Drag-and-Drop Task Board (POLISHED VERSION)
// ============================================================================
// Visual kanban board for task management with drag-and-drop status updates.
// Used by TasksView.jsx for board view mode.
//
// CRITICAL FIX: Status values now use Title Case to match database:
// - "Not Started" (not "not_started")
// - "In Progress" (not "in_progress")
// - "On Hold" (not "on_hold")
// - "Completed" (not "completed")
// ============================================================================

import React, { useState, useCallback, memo } from 'react';
import {
  GripVertical,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  ExternalLink,
  Ban
} from 'lucide-react';

// ============================================================================
// CONSTANTS - Status columns with CORRECT Title Case values
// Updated Jan 9, 2026: 'On Hold' changed to 'Awaiting Response'
// ============================================================================
const STATUS_COLUMNS = [
  {
    id: 'Not Started',  // Must match database value exactly
    label: 'To Do',
    color: 'var(--text-tertiary)',
    icon: Circle
  },
  {
    id: 'In Progress',  // Must match database value exactly
    label: 'In Progress',
    color: 'var(--sunbelt-orange)',
    icon: Clock
  },
  {
    id: 'Awaiting Response',  // Must match database value exactly
    label: 'Waiting',
    color: 'var(--warning)',
    icon: AlertCircle
  },
  {
    id: 'Completed',    // Must match database value exactly
    label: 'Done',
    color: 'var(--success)',
    icon: CheckCircle2
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Check if a date is overdue
 */
const isDateOverdue = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateString) < today;
};

/**
 * Get priority styling
 */
const getPriorityStyle = (priority) => {
  const styles = {
    'Critical': { backgroundColor: 'rgba(220, 38, 38, 0.2)', color: '#dc2626' },
    'High': { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
    'Medium': { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
    'Low': { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' },
    'Normal': { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }
  };
  return styles[priority] || styles['Normal'];
};

// ============================================================================
// PRIORITY BADGE COMPONENT
// ============================================================================
const PriorityBadge = memo(function PriorityBadge({ priority }) {
  const style = getPriorityStyle(priority);

  return (
    <span
      style={{
        ...style,
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '500',
        textTransform: 'capitalize'
      }}
    >
      {priority || 'Normal'}
    </span>
  );
});

// ============================================================================
// TASK CARD COMPONENT
// ============================================================================
const TaskCard = memo(function TaskCard({ task, onDragStart, onDragEnd, onClick }) {
  const [isDragging, setIsDragging] = useState(false);

  // Check if task is overdue (not applicable if completed)
  const isOverdue = isDateOverdue(task.due_date) && task.status !== 'Completed';

  // Get assignee display name
  const getAssigneeName = () => {
    if (task.external_assignee_name) return task.external_assignee_name;
    if (task.assignee?.name) return task.assignee.name;
    if (task.assigned_to) {
      // Handle email format
      return task.assigned_to.includes('@')
        ? task.assigned_to.split('@')[0]
        : task.assigned_to;
    }
    return null;
  };

  const assigneeName = getAssigneeName();
  const isExternal = !!task.external_assignee_email || task.is_external;

  const handleDragStart = (e) => {
    setIsDragging(true);
    onDragStart(e, task);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    onDragEnd(e);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick(task)}
      className="kanban-card"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border-color)'}`,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 0.2s ease',
        borderLeft: isOverdue ? '3px solid var(--danger)' : '3px solid transparent',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(2deg)' : 'none'
      }}
    >
      {/* Card Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '8px',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
          <GripVertical
            size={14}
            style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: '2px' }}
          />
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            lineHeight: '1.3',
            wordBreak: 'break-word'
          }}>
            {task.title}
          </span>
        </div>
        {isExternal && (
          <ExternalLink
            size={14}
            style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }}
            title="External Task"
          />
        )}
      </div>

      {/* Task Description (truncated) */}
      {task.description && (
        <p style={{
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          marginBottom: '10px',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {task.description}
        </p>
      )}

      {/* Card Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <PriorityBadge priority={task.priority} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Due Date */}
          {task.due_date && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: isOverdue ? 'var(--danger)' : 'var(--text-tertiary)',
              fontWeight: isOverdue ? '600' : '400'
            }}>
              <Calendar size={12} />
              {formatDate(task.due_date)}
            </div>
          )}

          {/* Assignee */}
          {assigneeName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--text-tertiary)'
            }}>
              <User size={12} />
              <span style={{
                maxWidth: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {assigneeName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// KANBAN COLUMN COMPONENT
// ============================================================================
const KanbanColumn = memo(function KanbanColumn({
  column,
  tasks,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onTaskClick
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const IconComponent = column.icon;

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    onDragOver(e);
  }, [onDragOver]);

  const handleDragLeave = useCallback((e) => {
    // Only set false if we're actually leaving the column, not entering a child
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, column.id);
  }, [onDrop, column.id]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flex: '1 1 280px',
        minWidth: '280px',
        maxWidth: '350px',
        backgroundColor: isDragOver ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        borderRadius: '12px',
        padding: '16px',
        border: isDragOver
          ? '2px dashed var(--sunbelt-orange)'
          : '2px solid transparent',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Column Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: `2px solid ${column.color}30`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconComponent size={18} style={{ color: column.color }} />
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {column.label}
          </h3>
        </div>
        <span style={{
          backgroundColor: column.color,
          color: '#fff',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          minWidth: '24px',
          textAlign: 'center'
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Tasks Container */}
      <div style={{
        minHeight: '200px',
        maxHeight: 'calc(100vh - 400px)',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {tasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-tertiary)',
            fontSize: '13px',
            border: isDragOver ? 'none' : '2px dashed var(--border-color)',
            borderRadius: '8px',
            background: isDragOver ? 'transparent' : 'var(--bg-secondary)'
          }}>
            {isDragOver ? 'Drop here' : 'No tasks'}
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN KANBAN BOARD COMPONENT
// ============================================================================
function KanbanBoard({ tasks, onStatusChange, onTaskClick }) {
  const [draggedTask, setDraggedTask] = useState(null);

  // ===== DRAG HANDLERS =====
  const handleDragStart = useCallback((e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Set drag data for accessibility
    e.dataTransfer.setData('text/plain', task.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, newStatus) => {
    e.preventDefault();

    if (draggedTask && draggedTask.status !== newStatus) {
      // Call onStatusChange with the task ID and new status
      onStatusChange(draggedTask.id, newStatus);
    }

    setDraggedTask(null);
  }, [draggedTask, onStatusChange]);

  // ===== GROUP TASKS BY STATUS =====
  const getTasksByStatus = useCallback((status) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      overflowX: 'auto',
      padding: '4px',
      minHeight: '500px'
    }}>
      {STATUS_COLUMNS.map(column => (
        <KanbanColumn
          key={column.id}
          column={column}
          tasks={getTasksByStatus(column.id)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onTaskClick={onTaskClick}
        />
      ))}

      {/* Hover effect styles */}
      <style>{`
        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: var(--sunbelt-orange) !important;
        }

        .kanban-card:active {
          cursor: grabbing;
        }

        /* Custom scrollbar for task containers */
        .kanban-column-tasks::-webkit-scrollbar {
          width: 6px;
        }

        .kanban-column-tasks::-webkit-scrollbar-track {
          background: transparent;
        }

        .kanban-column-tasks::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 3px;
        }

        .kanban-column-tasks::-webkit-scrollbar-thumb:hover {
          background: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
}

export default KanbanBoard;