// ============================================================================
// AuditLogViewer.jsx - Audit Log Viewer Panel
// ============================================================================
// Shows recent activity and changes across the system.
// Note: Full audit logging requires the audit_log table to be created.
// Currently simulates by pulling recent records from existing tables.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Database,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  RefreshCw,
  ChevronDown,
  Clock
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// CONSTANTS
// ============================================================================
const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Activity' },
  { value: 'project', label: 'Projects' },
  { value: 'task', label: 'Tasks' },
  { value: 'rfi', label: 'RFIs' },
  { value: 'submittal', label: 'Submittals' },
  { value: 'user', label: 'Users' }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AuditLogViewer({ showToast }) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7'); // days
  const [searchQuery, setSearchQuery] = useState('');

  // ==========================================================================
  // FETCH ACTIVITY
  // ==========================================================================
  const fetchActivity = useCallback(async () => {
    setLoading(true);

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateFilter));
      const cutoffISO = cutoffDate.toISOString();

      const activityList = [];

      // Fetch based on filter
      const fetchPromises = [];

      if (typeFilter === 'all' || typeFilter === 'project') {
        fetchPromises.push(
          supabase
            .from('projects')
            .select('id, name, created_at, updated_at, status')
            .gte('updated_at', cutoffISO)
            .order('updated_at', { ascending: false })
            .limit(50)
            .then(({ data }) => {
              (data || []).forEach(item => {
                activityList.push({
                  id: `project-${item.id}`,
                  type: 'project',
                  name: item.name,
                  action: new Date(item.created_at) === new Date(item.updated_at) ? 'created' : 'updated',
                  timestamp: item.updated_at || item.created_at,
                  details: `Status: ${item.status}`
                });
              });
            })
        );
      }

      if (typeFilter === 'all' || typeFilter === 'task') {
        fetchPromises.push(
          supabase
            .from('tasks')
            .select('id, title, created_at, updated_at, status, project:project_id(name)')
            .gte('updated_at', cutoffISO)
            .order('updated_at', { ascending: false })
            .limit(50)
            .then(({ data }) => {
              (data || []).forEach(item => {
                activityList.push({
                  id: `task-${item.id}`,
                  type: 'task',
                  name: item.title,
                  action: new Date(item.created_at) === new Date(item.updated_at) ? 'created' : 'updated',
                  timestamp: item.updated_at || item.created_at,
                  details: `${item.project?.name || 'No Project'} • ${item.status}`
                });
              });
            })
        );
      }

      if (typeFilter === 'all' || typeFilter === 'rfi') {
        fetchPromises.push(
          supabase
            .from('rfis')
            .select('id, rfi_number, subject, created_at, updated_at, status, project:project_id(name)')
            .gte('updated_at', cutoffISO)
            .order('updated_at', { ascending: false })
            .limit(50)
            .then(({ data }) => {
              (data || []).forEach(item => {
                activityList.push({
                  id: `rfi-${item.id}`,
                  type: 'rfi',
                  name: `${item.rfi_number}: ${item.subject}`,
                  action: new Date(item.created_at) === new Date(item.updated_at) ? 'created' : 'updated',
                  timestamp: item.updated_at || item.created_at,
                  details: `${item.project?.name || 'No Project'} • ${item.status}`
                });
              });
            })
        );
      }

      if (typeFilter === 'all' || typeFilter === 'submittal') {
        fetchPromises.push(
          supabase
            .from('submittals')
            .select('id, submittal_number, title, created_at, updated_at, status, project:project_id(name)')
            .gte('updated_at', cutoffISO)
            .order('updated_at', { ascending: false })
            .limit(50)
            .then(({ data }) => {
              (data || []).forEach(item => {
                activityList.push({
                  id: `submittal-${item.id}`,
                  type: 'submittal',
                  name: `${item.submittal_number}: ${item.title}`,
                  action: new Date(item.created_at) === new Date(item.updated_at) ? 'created' : 'updated',
                  timestamp: item.updated_at || item.created_at,
                  details: `${item.project?.name || 'No Project'} • ${item.status}`
                });
              });
            })
        );
      }

      if (typeFilter === 'all' || typeFilter === 'user') {
        fetchPromises.push(
          supabase
            .from('users')
            .select('id, name, email, created_at, role')
            .gte('created_at', cutoffISO)
            .order('created_at', { ascending: false })
            .limit(20)
            .then(({ data }) => {
              (data || []).forEach(item => {
                activityList.push({
                  id: `user-${item.id}`,
                  type: 'user',
                  name: item.name,
                  action: 'created',
                  timestamp: item.created_at,
                  details: `${item.role} • ${item.email}`
                });
              });
            })
        );
      }

      await Promise.all(fetchPromises);

      // Sort by timestamp
      activityList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply search filter
      const filtered = searchQuery
        ? activityList.filter(a =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.details?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : activityList;

      setActivities(filtered.slice(0, 100));

    } catch (error) {
      console.error('Error fetching activity:', error);
      showToast('Failed to load activity log', 'error');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, dateFilter, searchQuery, showToast]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // ==========================================================================
  // EXPORT
  // ==========================================================================
  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Type', 'Action', 'Name', 'Details'].join(','),
      ...activities.map(a => [
        new Date(a.timestamp).toISOString(),
        a.type,
        a.action,
        `"${a.name}"`,
        `"${a.details || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Audit log exported successfully');
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getTypeIcon = (type) => {
    switch (type) {
      case 'project': return Database;
      case 'task': return CheckSquare;
      case 'rfi': return MessageSquare;
      case 'submittal': return ClipboardList;
      case 'user': return User;
      default: return FileText;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'project': return 'var(--sunbelt-orange)';
      case 'task': return '#3b82f6';
      case 'rfi': return '#f59e0b';
      case 'submittal': return '#22c55e';
      case 'user': return '#8b5cf6';
      default: return 'var(--text-secondary)';
    }
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <FileText size={22} style={{ color: '#3b82f6' }} />
            Activity Log
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {activities.length} activities in last {dateFilter} days
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={fetchActivity}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: loading ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-md)',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1',
          minWidth: '200px',
          maxWidth: '300px'
        }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)'
          }} />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-sm) var(--space-md) var(--space-sm) 36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          {ACTIVITY_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Activity List */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--space-2xl)'
          }}>
            <div className="loading-spinner" />
          </div>
        ) : activities.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-2xl)',
            color: 'var(--text-tertiary)'
          }}>
            <Clock size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
            <p>No activity found for the selected filters</p>
          </div>
        ) : (
          <div>
            {activities.map((activity, index) => {
              const Icon = getTypeIcon(activity.type);
              const color = getTypeColor(activity.type);

              return (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md)',
                    borderTop: index > 0 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Icon */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={18} style={{ color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-xs)',
                      marginBottom: '2px'
                    }}>
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        color,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `${color}15`
                      }}>
                        {activity.type}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)'
                      }}>
                        {activity.action}
                      </span>
                    </div>
                    <div style={{
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      fontSize: '0.9375rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {activity.name}
                    </div>
                    {activity.details && (
                      <div style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-tertiary)',
                        marginTop: '2px'
                      }}>
                        {activity.details}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-tertiary)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div style={{
        marginTop: 'var(--space-md)',
        padding: 'var(--space-sm) var(--space-md)',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.8125rem',
        color: '#3b82f6'
      }}>
        💡 Note: Full audit logging with user attribution requires the audit_log table.
        Currently showing recent record changes.
      </div>
    </div>
  );
}

export default AuditLogViewer;