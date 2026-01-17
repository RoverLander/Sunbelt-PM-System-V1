// ============================================================================
// ManagerDashboard.jsx - Manager Dashboard Page
// ============================================================================
// At-a-glance metrics and quick actions for management roles.
// Role-aware: PMs see their projects, Directors/VPs see all.
//
// Created: January 17, 2026
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import { supabase } from '../../../utils/supabaseClient';
import {
  FolderKanban,
  CheckSquare,
  MessageSquare,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box'
  },
  greeting: {
    marginBottom: '4px'
  },
  greetingText: {
    fontSize: '1.375rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0
  },
  greetingSubtext: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    marginTop: '4px'
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'var(--bg-secondary)',
    borderRadius: '10px',
    border: '1px solid var(--border-primary)'
  },
  toggleLabel: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  toggle: {
    position: 'relative',
    width: '44px',
    height: '24px',
    background: 'var(--border-primary)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    border: 'none',
    padding: 0
  },
  toggleActive: {
    background: '#FF6B35'
  },
  toggleKnob: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '20px',
    height: '20px',
    background: 'white',
    borderRadius: '50%',
    transition: 'transform 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
  },
  toggleKnobActive: {
    transform: 'translateX(20px)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box'
  },
  statCard: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid var(--border-primary)',
    cursor: 'pointer',
    minWidth: 0
  },
  statCardUrgent: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.05) 100%)',
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  statLabel: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0,
    marginBottom: 'var(--space-md)'
  },
  listCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-md) var(--space-lg)',
    borderBottom: '1px solid var(--border-primary)',
    cursor: 'pointer'
  },
  listItemLast: {
    borderBottom: 'none'
  },
  listItemContent: {
    flex: 1,
    minWidth: 0
  },
  listItemTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  listItemSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  badge: {
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.625rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  badgeOverdue: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444'
  },
  badgeDueSoon: {
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b'
  },
  emptyState: {
    padding: 'var(--space-xl)',
    textAlign: 'center',
    color: 'var(--text-tertiary)',
    fontSize: '0.875rem'
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

export default function ManagerDashboard({ onNavigate }) {
  const { user, userId, userName, canViewAllProjects, userRole } = useManagerAuth();

  const [loading, setLoading] = useState(true);
  const [includeBackups, setIncludeBackups] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    overdueTasks: 0,
    openRFIs: 0,
    upcomingDeliveries: 0
  });
  const [recentItems, setRecentItems] = useState({
    overdueTasks: [],
    upcomingDeliveries: []
  });

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      // Build project filter based on role and backup toggle
      const pmFilter = includeBackups
        ? `owner_id.eq.${userId},primary_pm_id.eq.${userId},backup_pm_id.eq.${userId}`
        : `owner_id.eq.${userId},primary_pm_id.eq.${userId}`;

      let projectQuery = supabase.from('projects').select('id');

      if (!canViewAllProjects) {
        projectQuery = projectQuery.or(pmFilter);
      }

      const { data: projects } = await projectQuery;
      const projectIds = projects?.map(p => p.id) || [];

      // Fetch stats in parallel
      const [
        { count: activeProjects },
        { data: overdueTasks },
        { count: openRFIs },
        { data: upcomingDeliveries }
      ] = await Promise.all([
        // Active projects count
        canViewAllProjects
          ? supabase.from('projects').select('*', { count: 'exact', head: true })
              .in('status', ['Planning', 'In Progress', 'Production'])
          : supabase.from('projects').select('*', { count: 'exact', head: true })
              .in('status', ['Planning', 'In Progress', 'Production'])
              .or(pmFilter),

        // Overdue tasks
        projectIds.length > 0
          ? supabase.from('tasks')
              .select('id, title, due_date, project:projects(project_number, name)')
              .in('project_id', projectIds)
              .in('status', ['Not Started', 'In Progress', 'Awaiting Response'])
              .lt('due_date', new Date().toISOString().split('T')[0])
              .order('due_date', { ascending: true })
              .limit(5)
          : { data: [] },

        // Open RFIs count
        projectIds.length > 0
          ? supabase.from('rfis').select('*', { count: 'exact', head: true })
              .in('project_id', projectIds)
              .in('status', ['Open', 'Pending'])
          : { count: 0 },

        // Upcoming deliveries (next 14 days)
        canViewAllProjects
          ? supabase.from('projects')
              .select('id, project_number, name, delivery_date, status')
              .gte('delivery_date', new Date().toISOString().split('T')[0])
              .lte('delivery_date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              .order('delivery_date', { ascending: true })
              .limit(5)
          : supabase.from('projects')
              .select('id, project_number, name, delivery_date, status')
              .or(pmFilter)
              .gte('delivery_date', new Date().toISOString().split('T')[0])
              .lte('delivery_date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
              .order('delivery_date', { ascending: true })
              .limit(5)
      ]);

      setStats({
        activeProjects: activeProjects || 0,
        overdueTasks: overdueTasks?.length || 0,
        openRFIs: openRFIs || 0,
        upcomingDeliveries: upcomingDeliveries?.length || 0
      });

      setRecentItems({
        overdueTasks: overdueTasks || [],
        upcomingDeliveries: upcomingDeliveries || []
      });
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, canViewAllProjects, includeBackups]);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId, fetchDashboardData]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Greeting */}
      <div style={styles.greeting}>
        <h1 style={styles.greetingText}>
          {getGreeting()}, {userName?.split(' ')[0] || 'Manager'}
        </h1>
        <p style={styles.greetingSubtext}>
          {canViewAllProjects ? 'All projects overview' : 'Your projects overview'}
        </p>
      </div>

      {/* Backup Jobs Toggle - only show for non-admin users */}
      {!canViewAllProjects && (
        <div style={styles.toggleRow}>
          <span style={styles.toggleLabel}>Include backup jobs</span>
          <button
            style={{
              ...styles.toggle,
              ...(includeBackups ? styles.toggleActive : {})
            }}
            onClick={() => setIncludeBackups(!includeBackups)}
          >
            <span
              style={{
                ...styles.toggleKnob,
                ...(includeBackups ? styles.toggleKnobActive : {})
              }}
            />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {/* Active Projects */}
        <div
          style={styles.statCard}
          onClick={() => onNavigate?.('projects')}
        >
          <div style={styles.statHeader}>
            <div style={{ ...styles.statIcon, background: 'rgba(59, 130, 246, 0.15)' }}>
              <FolderKanban size={20} color="#3b82f6" />
            </div>
          </div>
          <div style={styles.statValue}>{stats.activeProjects}</div>
          <div style={styles.statLabel}>Active Projects</div>
        </div>

        {/* Overdue Tasks */}
        <div
          style={{
            ...styles.statCard,
            ...(stats.overdueTasks > 0 ? styles.statCardUrgent : {})
          }}
          onClick={() => onNavigate?.('tasks')}
        >
          <div style={styles.statHeader}>
            <div style={{ ...styles.statIcon, background: stats.overdueTasks > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)' }}>
              <CheckSquare size={20} color={stats.overdueTasks > 0 ? '#ef4444' : '#22c55e'} />
            </div>
          </div>
          <div style={{ ...styles.statValue, color: stats.overdueTasks > 0 ? '#ef4444' : 'var(--text-primary)' }}>
            {stats.overdueTasks}
          </div>
          <div style={styles.statLabel}>Overdue Tasks</div>
        </div>

        {/* Open RFIs */}
        <div
          style={styles.statCard}
          onClick={() => onNavigate?.('rfis')}
        >
          <div style={styles.statHeader}>
            <div style={{ ...styles.statIcon, background: 'rgba(168, 85, 247, 0.15)' }}>
              <MessageSquare size={20} color="#a855f7" />
            </div>
          </div>
          <div style={styles.statValue}>{stats.openRFIs}</div>
          <div style={styles.statLabel}>Open RFIs</div>
        </div>

        {/* Upcoming Deliveries */}
        <div
          style={styles.statCard}
          onClick={() => onNavigate?.('projects')}
        >
          <div style={styles.statHeader}>
            <div style={{ ...styles.statIcon, background: 'rgba(245, 158, 11, 0.15)' }}>
              <Calendar size={20} color="#f59e0b" />
            </div>
          </div>
          <div style={styles.statValue}>{stats.upcomingDeliveries}</div>
          <div style={styles.statLabel}>Deliveries (14d)</div>
        </div>
      </div>

      {/* Overdue Tasks List */}
      {recentItems.overdueTasks.length > 0 && (
        <div>
          <h2 style={styles.sectionTitle}>
            <AlertTriangle size={16} color="#ef4444" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Overdue Tasks
          </h2>
          <div style={styles.listCard}>
            {recentItems.overdueTasks.map((task, index) => (
              <div
                key={task.id}
                style={{
                  ...styles.listItem,
                  ...(index === recentItems.overdueTasks.length - 1 ? styles.listItemLast : {})
                }}
                onClick={() => onNavigate?.('tasks')}
              >
                <div style={styles.listItemContent}>
                  <div style={styles.listItemTitle}>{task.title}</div>
                  <div style={styles.listItemSubtitle}>
                    {task.project?.project_number} • Due {formatDate(task.due_date)}
                  </div>
                </div>
                <span style={{ ...styles.badge, ...styles.badgeOverdue }}>
                  {Math.abs(getDaysUntil(task.due_date))}d late
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deliveries List */}
      {recentItems.upcomingDeliveries.length > 0 && (
        <div>
          <h2 style={styles.sectionTitle}>
            <Calendar size={16} color="#f59e0b" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Upcoming Deliveries
          </h2>
          <div style={styles.listCard}>
            {recentItems.upcomingDeliveries.map((project, index) => {
              const daysUntil = getDaysUntil(project.delivery_date);
              return (
                <div
                  key={project.id}
                  style={{
                    ...styles.listItem,
                    ...(index === recentItems.upcomingDeliveries.length - 1 ? styles.listItemLast : {})
                  }}
                  onClick={() => onNavigate?.('projects')}
                >
                  <div style={styles.listItemContent}>
                    <div style={styles.listItemTitle}>{project.name}</div>
                    <div style={styles.listItemSubtitle}>
                      {project.project_number} • {formatDate(project.delivery_date)}
                    </div>
                  </div>
                  <span style={{
                    ...styles.badge,
                    ...(daysUntil <= 7 ? styles.badgeDueSoon : { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' })
                  }}>
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
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
