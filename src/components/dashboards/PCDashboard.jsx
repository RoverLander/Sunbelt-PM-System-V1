// ============================================================================
// PCDashboard.jsx - Project Coordinator Command Center
// ============================================================================
// Factory-specific dashboard for Project Coordinators focused on:
// - Deadline tracking across all factory projects
// - Warning email management
// - Drawing status overview
// - State approval tracking
// - Milestone sign-off status
//
// FEATURES:
// - Factory-filtered project list
// - Upcoming deadlines (sorted by urgency)
// - Overdue items (RED highlighting)
// - Warning emails sent/pending
// - Drawing status overview
// - State approval status overview
// - Quick links to project workflow tabs
//
// Created: January 9, 2026
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Mail,
  FileText,
  Building,
  ChevronRight,
  RefreshCw,
  Flag,
  Send,
  ExternalLink,
  Filter,
  Search,
  Factory,
  MapPin,
  Users,
  TrendingUp,
  FolderKanban
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  formatDate,
  formatDateShort,
  getDaysUntilDeadline,
  getUrgencyLevel,
  TASK_STATUS_COLORS
} from '../../utils/workflowUtils';

// ============================================================================
// CONSTANTS
// ============================================================================
const ACTIVE_PROJECT_STATUSES = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];

const URGENCY_COLORS = {
  overdue: 'var(--danger)',
  critical: 'var(--warning)',
  warning: 'var(--sunbelt-orange)',
  normal: 'var(--text-secondary)',
  none: 'var(--text-tertiary)'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatCurrency = (amount) => {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

const getDaysText = (days) => {
  if (days === null) return 'No deadline';
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days} days left`;
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
function StatCard({ icon: Icon, label, value, subValue, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--border-color)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = color || 'var(--sunbelt-orange)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: `${color || 'var(--sunbelt-orange)'}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={20} style={{ color: color || 'var(--sunbelt-orange)' }} />
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
        {value}
      </div>
      {subValue && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          {subValue}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DEADLINE ITEM COMPONENT
// ============================================================================
function DeadlineItem({ item, onNavigate }) {
  const daysUntil = getDaysUntilDeadline(item.due_date);
  const urgency = getUrgencyLevel(daysUntil);
  const urgencyColor = URGENCY_COLORS[urgency];

  return (
    <div
      onClick={() => onNavigate(item.project_id, 'workflow')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: urgency === 'overdue' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        borderLeft: `3px solid ${urgencyColor}`,
        transition: 'background 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = urgency === 'overdue' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)'}
    >
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: `${urgencyColor}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {urgency === 'overdue' ? (
          <AlertCircle size={16} style={{ color: urgencyColor }} />
        ) : (
          <Clock size={16} style={{ color: urgencyColor }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: '600',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {item.title || item.name}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{item.project_name || item.project_number}</span>
          <span>•</span>
          <span>{item.type}</span>
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontWeight: '600',
          color: urgencyColor,
          fontSize: '0.75rem'
        }}>
          {getDaysText(daysUntil)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {formatDateShort(item.due_date)}
        </div>
      </div>

      <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
    </div>
  );
}

// ============================================================================
// PROJECT ROW COMPONENT
// ============================================================================
function ProjectRow({ project, onNavigate }) {
  const openTasks = project.tasks?.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length || 0;
  const overdueTasks = project.tasks?.filter(t => {
    if (!t.due_date || ['Completed', 'Cancelled'].includes(t.status)) return false;
    return new Date(t.due_date) < new Date();
  }).length || 0;

  return (
    <tr
      onClick={() => onNavigate(project.id, 'workflow')}
      style={{ cursor: 'pointer' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
          {project.project_number}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {project.name}
        </div>
      </td>
      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          background: project.status === 'In Progress' ? 'rgba(255, 107, 53, 0.2)' : 'var(--bg-tertiary)',
          color: project.status === 'In Progress' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
          fontSize: '0.75rem',
          fontWeight: '500'
        }}>
          {project.status}
        </span>
      </td>
      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
        {project.pm?.name || project.owner?.name || '—'}
      </td>
      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
        {formatDateShort(project.online_date)}
      </td>
      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-primary)' }}>{openTasks}</span>
          {overdueTasks > 0 && (
            <span style={{
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.2)',
              color: 'var(--danger)',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {overdueTasks} overdue
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
      </td>
    </tr>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function PCDashboard({ onNavigateToProject }) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE - DATA
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [factoryInfo, setFactoryInfo] = useState(null);
  const [warningEmailsCount, setWarningEmailsCount] = useState({ sent: 0, pending: 0 });

  // ==========================================================================
  // STATE - UI
  // ==========================================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's factory info (including factory code)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('factory_id, factory:factories(id, code, name)')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const factoryId = userData?.factory_id;
      const factoryCode = userData?.factory?.code;

      // If no factory assigned, show message
      if (!factoryId || !factoryCode) {
        setError('No factory assigned. Please contact an administrator.');
        setLoading(false);
        return;
      }

      // Set factory info from the joined data
      if (userData?.factory) {
        setFactoryInfo(userData.factory);
      }

      // Fetch projects for this factory
      // Projects table uses 'factory' column with code string (e.g., 'PMI'), not factory_id
      let projectsQuery = supabase
        .from('projects')
        .select(`
          *,
          owner:owner_id(id, name, email),
          pm:primary_pm_id(id, name, email),
          backup_pm:backup_pm_id(id, name, email),
          tasks(id, title, status, due_date, priority)
        `);

      // Filter by factory CODE (not factory_id - projects use code string)
      if (factoryCode) {
        projectsQuery = projectsQuery.eq('factory', factoryCode);
      }

      const { data: allProjectsData, error: projectsError } = await projectsQuery;
      if (projectsError) throw projectsError;

      // Client-side filter by active statuses
      const projectsData = (allProjectsData || []).filter(p =>
        ACTIVE_PROJECT_STATUSES.includes(p.status)
      );
      setProjects(projectsData);

      // Extract all tasks from projects
      const allTasks = (projectsData || []).flatMap(p =>
        (p.tasks || []).map(t => ({
          ...t,
          project_id: p.id,
          project_name: p.name,
          project_number: p.project_number,
          type: 'Task'
        }))
      );
      setTasks(allTasks);

      // Fetch milestones for these projects
      // FIX: Removed .in() filter - use client-side filtering to avoid 400 errors in web containers
      const projectIds = (projectsData || []).map(p => p.id);
      const projectIdsSet = new Set(projectIds);
      if (projectIds.length > 0) {
        const { data: allMilestonesData } = await supabase
          .from('milestones')
          .select('*, project:project_id(id, name, project_number)');

        // Client-side filter by project IDs and status
        const milestonesData = (allMilestonesData || []).filter(m =>
          projectIdsSet.has(m.project_id) && m.status !== 'Completed'
        );

        setMilestones(milestonesData.map(m => ({
          ...m,
          project_name: m.project?.name,
          project_number: m.project?.project_number,
          type: 'Milestone'
        })));
      }

      // Count warning emails (if table exists)
      // FIX: Removed .in() filter - use client-side filtering
      try {
        const { data: allWarningEmails } = await supabase
          .from('warning_emails_log')
          .select('id, project_id, sent_at');

        // Client-side filter and count
        const sentCount = (allWarningEmails || []).filter(e =>
          projectIdsSet.has(e.project_id) && e.sent_at !== null
        ).length;

        setWarningEmailsCount({
          sent: sentCount,
          pending: 0 // No draft tracking in current schema
        });
      } catch {
        // Table might not exist yet
        setWarningEmailsCount({ sent: 0, pending: 0 });
      }

    } catch (err) {
      console.error('Error fetching PC dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // ==========================================================================
  // COMPUTED DATA
  // ==========================================================================
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allItems = [...tasks, ...milestones];

    const overdueItems = allItems.filter(item => {
      if (!item.due_date) return false;
      if (['Completed', 'Cancelled'].includes(item.status)) return false;
      return new Date(item.due_date) < today;
    });

    const dueTodayItems = allItems.filter(item => {
      if (!item.due_date) return false;
      if (['Completed', 'Cancelled'].includes(item.status)) return false;
      const dueDate = new Date(item.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });

    const dueThisWeekItems = allItems.filter(item => {
      if (!item.due_date) return false;
      if (['Completed', 'Cancelled'].includes(item.status)) return false;
      const dueDate = new Date(item.due_date);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 7;
    });

    return {
      totalProjects: projects.length,
      overdueCount: overdueItems.length,
      dueTodayCount: dueTodayItems.length,
      dueThisWeekCount: dueThisWeekItems.length,
      overdueItems,
      dueTodayItems,
      dueThisWeekItems
    };
  }, [projects, tasks, milestones]);

  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allItems = [...tasks, ...milestones]
      .filter(item => {
        if (!item.due_date) return false;
        if (['Completed', 'Cancelled'].includes(item.status)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 15); // Show top 15

    return allItems;
  }, [tasks, milestones]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(p =>
      p.name?.toLowerCase().includes(query) ||
      p.project_number?.toLowerCase().includes(query) ||
      p.client_name?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: 'var(--text-secondary)'
      }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: '12px' }}>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: 'var(--danger)',
        gap: '12px'
      }}>
        <AlertCircle size={48} />
        <span>{error}</span>
        <button
          onClick={handleRefresh}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Factory size={28} style={{ color: 'var(--sunbelt-orange)' }} />
            Project Coordinator Dashboard
          </h1>
          {factoryInfo && (
            <p style={{
              color: 'var(--text-secondary)',
              margin: '4px 0 0 40px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <MapPin size={14} />
              {factoryInfo.name || factoryInfo.factory_code}
            </p>
          )}
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            opacity: refreshing ? 0.6 : 1
          }}
        >
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ================================================================== */}
      {/* STAT CARDS                                                         */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          icon={FolderKanban}
          label="Factory Projects"
          value={stats.totalProjects}
          subValue="Active projects"
          color="var(--sunbelt-orange)"
        />
        <StatCard
          icon={AlertCircle}
          label="Overdue"
          value={stats.overdueCount}
          subValue="Items past deadline"
          color="var(--danger)"
        />
        <StatCard
          icon={Clock}
          label="Due Today"
          value={stats.dueTodayCount}
          subValue="Deadlines today"
          color="var(--warning)"
        />
        <StatCard
          icon={Calendar}
          label="This Week"
          value={stats.dueThisWeekCount}
          subValue="Upcoming 7 days"
          color="var(--info)"
        />
        <StatCard
          icon={Mail}
          label="Warnings Sent"
          value={warningEmailsCount.sent}
          subValue={`${warningEmailsCount.pending} pending`}
          color="var(--success)"
        />
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT GRID                                                  */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* ============================================================== */}
        {/* UPCOMING DEADLINES                                              */}
        {/* ============================================================== */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              Upcoming Deadlines
            </h2>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)'
            }}>
              {upcomingDeadlines.length} items
            </span>
          </div>

          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '12px'
          }}>
            {upcomingDeadlines.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-tertiary)'
              }}>
                <CheckCircle2 size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p>No upcoming deadlines</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcomingDeadlines.map((item, index) => (
                  <DeadlineItem
                    key={`${item.type}-${item.id}-${index}`}
                    item={item}
                    onNavigate={onNavigateToProject}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* OVERDUE ITEMS                                                   */}
        {/* ============================================================== */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: stats.overdueCount > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: stats.overdueCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: stats.overdueCount > 0 ? 'var(--danger)' : 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
              Overdue Items
            </h2>
            {stats.overdueCount > 0 && (
              <span style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--danger)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {stats.overdueCount} OVERDUE
              </span>
            )}
          </div>

          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '12px'
          }}>
            {stats.overdueItems.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--success)'
              }}>
                <CheckCircle2 size={32} style={{ marginBottom: '8px' }} />
                <p>No overdue items!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.overdueItems.map((item, index) => (
                  <DeadlineItem
                    key={`overdue-${item.type}-${item.id}-${index}`}
                    item={item}
                    onNavigate={onNavigateToProject}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* PROJECTS TABLE                                                     */}
      {/* ================================================================== */}
      <div style={{
        marginTop: '24px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FolderKanban size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            Factory Projects
          </h2>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-tertiary)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)'
          }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                width: '200px'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600' }}>
                  PROJECT
                </th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600' }}>
                  STATUS
                </th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600' }}>
                  PM
                </th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600' }}>
                  ONLINE DATE
                </th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600' }}>
                  OPEN TASKS
                </th>
                <th style={{ padding: '12px', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    {searchQuery ? 'No projects match your search' : 'No active projects'}
                  </td>
                </tr>
              ) : (
                filteredProjects.map(project => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onNavigate={onNavigateToProject}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PCDashboard;
