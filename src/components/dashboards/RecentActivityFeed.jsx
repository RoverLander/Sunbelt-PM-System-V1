// ============================================================================
// RecentActivityFeed Component
// ============================================================================
// Displays recent activity across all projects in a feed format.
// Shows created/updated items with timestamps.
//
// FEATURES:
// - Activity cards by type (Task, RFI, Submittal, Project)
// - Relative timestamps
// - User attribution
// - Click to navigate to item
// - Filter by activity type
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Activity,
  CheckSquare,
  FileText,
  ClipboardList,
  FolderKanban,
  Flag,
  User,
  Clock,
  Plus,
  Edit,
  ArrowRight,
  Filter
} from 'lucide-react';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getActivityIcon = (type) => {
  switch (type) {
    case 'task': return CheckSquare;
    case 'rfi': return FileText;
    case 'submittal': return ClipboardList;
    case 'project': return FolderKanban;
    case 'milestone': return Flag;
    default: return Activity;
  }
};

const getActivityColor = (type) => {
  switch (type) {
    case 'task': return '#22c55e';
    case 'rfi': return '#3b82f6';
    case 'submittal': return '#8b5cf6';
    case 'project': return 'var(--sunbelt-orange)';
    case 'milestone': return '#f59e0b';
    default: return 'var(--text-secondary)';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function RecentActivityFeed({
  tasks = [],
  rfis = [],
  submittals = [],
  milestones = [],
  projects = [],
  users = [],
  onItemClick,
  maxItems = 20
}) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [filter, setFilter] = useState('all');

  // ==========================================================================
  // BUILD ACTIVITY FEED
  // ==========================================================================
  const activityItems = useMemo(() => {
    const items = [];

    // Get user name by ID
    const getUserName = (userId) => {
      const user = users.find(u => u.id === userId);
      return user?.name || 'Unknown';
    };

    // Get project info by ID
    const getProjectInfo = (projectId) => {
      const project = projects.find(p => p.id === projectId);
      return project ? { number: project.project_number, name: project.name } : null;
    };

    // ===== TASKS =====
    if (filter === 'all' || filter === 'tasks') {
      tasks.forEach(task => {
        const project = getProjectInfo(task.project_id);
        if (!project) return;

        // Created activity
        if (task.created_at) {
          items.push({
            id: `task-created-${task.id}`,
            type: 'task',
            action: 'created',
            title: task.title,
            projectNumber: project.number,
            projectName: project.name,
            timestamp: task.created_at,
            status: task.status,
            data: task
          });
        }

        // Status change (if updated differently than created)
        if (task.updated_at && task.updated_at !== task.created_at) {
          const updatedDate = new Date(task.updated_at);
          const createdDate = new Date(task.created_at);
          if (updatedDate - createdDate > 60000) { // More than 1 minute difference
            items.push({
              id: `task-updated-${task.id}`,
              type: 'task',
              action: 'updated',
              title: task.title,
              projectNumber: project.number,
              projectName: project.name,
              timestamp: task.updated_at,
              status: task.status,
              data: task
            });
          }
        }
      });
    }

    // ===== RFIS =====
    if (filter === 'all' || filter === 'rfis') {
      rfis.forEach(rfi => {
        const project = getProjectInfo(rfi.project_id);
        if (!project) return;

        if (rfi.created_at) {
          items.push({
            id: `rfi-created-${rfi.id}`,
            type: 'rfi',
            action: 'created',
            title: `RFI-${String(rfi.number || '').padStart(3, '0')}: ${rfi.subject}`,
            projectNumber: project.number,
            projectName: project.name,
            timestamp: rfi.created_at,
            status: rfi.status,
            data: rfi
          });
        }

        if (rfi.updated_at && rfi.updated_at !== rfi.created_at) {
          const updatedDate = new Date(rfi.updated_at);
          const createdDate = new Date(rfi.created_at);
          if (updatedDate - createdDate > 60000) {
            items.push({
              id: `rfi-updated-${rfi.id}`,
              type: 'rfi',
              action: rfi.status === 'Answered' ? 'answered' : 'updated',
              title: `RFI-${String(rfi.number || '').padStart(3, '0')}: ${rfi.subject}`,
              projectNumber: project.number,
              projectName: project.name,
              timestamp: rfi.updated_at,
              status: rfi.status,
              data: rfi
            });
          }
        }
      });
    }

    // ===== SUBMITTALS =====
    if (filter === 'all' || filter === 'submittals') {
      submittals.forEach(submittal => {
        const project = getProjectInfo(submittal.project_id);
        if (!project) return;

        if (submittal.created_at) {
          items.push({
            id: `submittal-created-${submittal.id}`,
            type: 'submittal',
            action: 'created',
            title: `${submittal.spec_section || ''} - ${submittal.title}`,
            projectNumber: project.number,
            projectName: project.name,
            timestamp: submittal.created_at,
            status: submittal.status,
            data: submittal
          });
        }

        if (submittal.updated_at && submittal.updated_at !== submittal.created_at) {
          const updatedDate = new Date(submittal.updated_at);
          const createdDate = new Date(submittal.created_at);
          if (updatedDate - createdDate > 60000) {
            items.push({
              id: `submittal-updated-${submittal.id}`,
              type: 'submittal',
              action: ['Approved', 'Approved as Noted', 'Rejected'].includes(submittal.status) ? 'reviewed' : 'updated',
              title: `${submittal.spec_section || ''} - ${submittal.title}`,
              projectNumber: project.number,
              projectName: project.name,
              timestamp: submittal.updated_at,
              status: submittal.status,
              data: submittal
            });
          }
        }
      });
    }

    // ===== MILESTONES =====
    if (filter === 'all' || filter === 'milestones') {
      milestones.forEach(milestone => {
        const project = getProjectInfo(milestone.project_id);
        if (!project) return;

        if (milestone.created_at) {
          items.push({
            id: `milestone-created-${milestone.id}`,
            type: 'milestone',
            action: 'created',
            title: milestone.name,
            projectNumber: project.number,
            projectName: project.name,
            timestamp: milestone.created_at,
            status: milestone.status,
            data: milestone
          });
        }

        if (milestone.status === 'Completed' && milestone.updated_at) {
          items.push({
            id: `milestone-completed-${milestone.id}`,
            type: 'milestone',
            action: 'completed',
            title: milestone.name,
            projectNumber: project.number,
            projectName: project.name,
            timestamp: milestone.updated_at,
            status: milestone.status,
            data: milestone
          });
        }
      });
    }

    // ===== PROJECTS =====
    if (filter === 'all' || filter === 'projects') {
      projects.forEach(project => {
        if (project.created_at) {
          items.push({
            id: `project-created-${project.id}`,
            type: 'project',
            action: 'created',
            title: project.name,
            projectNumber: project.project_number,
            timestamp: project.created_at,
            status: project.status,
            data: project
          });
        }
      });
    }

    // Sort by timestamp (newest first)
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return items.slice(0, maxItems);
  }, [tasks, rfis, submittals, milestones, projects, users, filter, maxItems]);

  // ==========================================================================
  // GET ACTION LABEL
  // ==========================================================================
  const getActionLabel = (action) => {
    switch (action) {
      case 'created': return 'New';
      case 'updated': return 'Updated';
      case 'completed': return 'Completed';
      case 'answered': return 'Answered';
      case 'reviewed': return 'Reviewed';
      default: return action;
    }
  };

  const getActionBadgeStyle = (action) => {
    const baseStyle = {
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.625rem',
      fontWeight: '600',
      textTransform: 'uppercase'
    };

    switch (action) {
      case 'created':
        return { ...baseStyle, background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' };
      case 'completed':
        return { ...baseStyle, background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' };
      case 'answered':
        return { ...baseStyle, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      case 'reviewed':
        return { ...baseStyle, background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' };
      default:
        return { ...baseStyle, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-md)'
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
          <Activity size={20} style={{ color: 'var(--sunbelt-orange)' }} />
          Recent Activity
        </h3>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {['all', 'tasks', 'rfis', 'submittals'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 8px',
                background: filter === f ? 'var(--sunbelt-orange)' : 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: filter === f ? 'white' : 'var(--text-secondary)',
                fontSize: '0.6875rem',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* ACTIVITY LIST                                                     */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)'
      }}>
        {activityItems.map(item => {
          const Icon = getActivityIcon(item.type);
          const color = getActivityColor(item.type);

          return (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item.type, item.data)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-sm)',
                padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = color}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              {/* Icon */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={14} style={{ color }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  marginBottom: '2px'
                }}>
                  <span style={getActionBadgeStyle(item.action)}>
                    {getActionLabel(item.action)}
                  </span>
                  <span style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    fontWeight: '600'
                  }}>
                    {item.type}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-primary)',
                  fontWeight: '500',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.title}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)'
                }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {item.projectNumber}
                  </span>
                  {item.projectName && (
                    <>
                      <span>•</span>
                      <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.projectName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.6875rem',
                color: 'var(--text-tertiary)',
                flexShrink: 0
              }}>
                <Clock size={12} />
                {getRelativeTime(item.timestamp)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* EMPTY STATE                                                       */}
      {/* ================================================================== */}
      {activityItems.length === 0 && (
        <div style={{
          padding: 'var(--space-2xl)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <Activity size={40} style={{ opacity: 0.3, marginBottom: 'var(--space-sm)' }} />
          <p style={{ margin: 0 }}>No recent activity</p>
        </div>
      )}
    </div>
  );
}

export default RecentActivityFeed;