// ===== KANBAN BOARD COMPONENT =====
// Drag-and-drop task board with status columns
// Used by TasksView.jsx for board view mode and PMDashboard for cross-project view

import React, { useState } from 'react';
import { 
  GripVertical, 
  Calendar, 
  User, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  ExternalLink,
  FolderKanban
} from 'lucide-react';

// ===== STATUS COLUMN CONFIGURATION =====
// IMPORTANT: These must match the exact values stored in the database
const STATUS_COLUMNS = [
  { 
    id: 'Not Started', 
    label: 'Not Started', 
    color: 'var(--text-muted)',
    icon: Circle
  },
  { 
    id: 'In Progress', 
    label: 'In Progress', 
    color: 'var(--sunbelt-orange)',
    icon: Clock
  },
  { 
    id: 'On Hold', 
    label: 'On Hold', 
    color: '#f59e0b',
    icon: AlertCircle
  },
  { 
    id: 'Completed', 
    label: 'Completed', 
    color: 'var(--success)',
    icon: CheckCircle2
  }
];

// ===== PRIORITY BADGE COMPONENT =====
function PriorityBadge({ priority }) {
  const getPriorityStyle = () => {
    switch (priority) {
      case 'Critical':
        return { backgroundColor: 'rgba(139, 0, 0, 0.2)', color: '#8b0000' };
      case 'High':
        return { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
      case 'Medium':
        return { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
      case 'Low':
        return { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' };
      default:
        return { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
    }
  };

  return (
    <span 
      style={{
        ...getPriorityStyle(),
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '500'
      }}
    >
      {priority || 'None'}
    </span>
  );
}

// ===== TASK CARD COMPONENT =====
function TaskCard({ task, onDragStart, onDragEnd, onClick, showProject = false }) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Check if task is overdue
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';

  // Get assignee display name
  const getAssigneeName = () => {
    if (task.assignee?.name) return task.assignee.name.split(' ')[0];
    if (task.external_assignee_name) return task.external_assignee_name.split(' ')[0];
    if (task.internal_owner?.name) return task.internal_owner.name.split(' ')[0];
    return null;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task)}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        borderLeft: isOverdue ? '3px solid #ef4444' : `3px solid ${task.project?.color || 'transparent'}`
      }}
      className="kanban-card"
    >
      {/* Project Name (for cross-project view) */}
      {showProject && task.project && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <FolderKanban size={12} color={task.project.color || 'var(--sunbelt-orange)'} />
          <span style={{ 
            fontSize: '11px', 
            color: 'var(--text-secondary)',
            fontWeight: '500'
          }}>
            {task.project.project_number || task.project.name}
          </span>
        </div>
      )}

      {/* Card Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <GripVertical size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ 
            fontSize: '13px', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            lineHeight: '1.3'
          }}>
            {task.title}
          </span>
        </div>
        {(task.external_assignee_email || task.external_assignee_name) && (
          <ExternalLink size={14} color="var(--sunbelt-orange)" title="External Task" style={{ flexShrink: 0, marginLeft: '8px' }} />
        )}
      </div>

      {/* Task Description (truncated) */}
      {task.description && (
        <p style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
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
              color: isOverdue ? '#ef4444' : 'var(--text-muted)'
            }}>
              <Calendar size={12} />
              {formatDate(task.due_date)}
            </div>
          )}
          
          {/* Assignee */}
          {getAssigneeName() && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              <User size={12} />
              {getAssigneeName()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== KANBAN COLUMN COMPONENT =====
function KanbanColumn({ column, tasks, onDragStart, onDragEnd, onDrop, onDragOver, onTaskClick, showProject }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const IconComponent = column.icon;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    setIsDragOver(false);
    onDrop(e, column.id);
  };

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
        border: isDragOver ? '2px dashed var(--sunbelt-orange)' : '2px solid transparent',
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
        borderBottom: '2px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconComponent size={18} color={column.color} />
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
          fontWeight: '600'
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Tasks Container */}
      <div style={{
        minHeight: '200px',
        maxHeight: 'calc(100vh - 400px)',
        overflowY: 'auto'
      }}>
        {tasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-muted)',
            fontSize: '13px'
          }}>
            No tasks
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onTaskClick}
              showProject={showProject}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ===== MAIN KANBAN BOARD COMPONENT =====
function KanbanBoard({ tasks, onStatusChange, onTaskClick, showProject = false }) {
  const [draggedTask, setDraggedTask] = useState(null);

  // ===== DRAG HANDLERS =====
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay to show the drag effect
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== newStatus) {
      onStatusChange(draggedTask.id, newStatus);
    }
    
    setDraggedTask(null);
  };

  // ===== GROUP TASKS BY STATUS =====
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      overflowX: 'auto',
      padding: '4px',
      minHeight: '400px'
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
          showProject={showProject}
        />
      ))}

      {/* Styles for hover effects */}
      <style>{`
        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: var(--sunbelt-orange) !important;
        }
        
        .kanban-card:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
}

export default KanbanBoard;