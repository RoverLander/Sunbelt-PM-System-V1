// ============================================================================
// PMDashboard Component - Polished Version
// ============================================================================
// A focused, laptop-optimized dashboard for Project Managers showing:
// 1. Alert bar (overdue items - the "fires")
// 2. Today's Focus (due today + needs attention)
// 3. Quick Actions (New Project, Jump to Project)
// 4. My Projects Health (compact project cards)
// 5. Week Calendar (minimizable)
// 6. Gantt Timeline (minimizable)
//
// Design: Vertical stack layout, information-dense, persistent collapse state
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  ClipboardList,
  FolderPlus,
  ExternalLink,
  Target,
  Flame,
  CalendarDays,
  GanttChart,
  Building2,
  ChevronUp,
  Search,
  ArrowRight,
  Bell,
  Zap
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const formatFullDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const getDaysUntil = (dateString) => {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

const getRelativeDay = (dateString) => {
  const days = getDaysUntil(dateString);
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d`;
};

// ============================================================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================================================
function CollapsibleSection({ 
  title, 
  icon: Icon, 
  badge, 
  badgeColor = 'var(--text-tertiary)',
  storageKey,
  defaultExpanded = true,
  children 
}) {
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem(`pm-dash-${storageKey}`);
    return saved !== null ? JSON.parse(saved) : defaultExpanded;
  });

  const toggle = () => {
    const newState = !expanded;
    setExpanded(newState);
    localStorage.setItem(`pm-dash-${storageKey}`, JSON.stringify(newState));
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {/* Header - Always visible */}
      <button
        onClick={toggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: expanded ? 'transparent' : 'var(--bg-secondary)',
          border: 'none',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border-color)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon size={18} style={{ color: 'var(--sunbelt-orange)' }} />
          <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
            {title}
          </span>
          {badge !== undefined && (
            <span style={{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: `${badgeColor}20`,
              color: badgeColor
            }}>
              {badge}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} />
        ) : (
          <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />
        )}
      </button>

      {/* Content - Collapsible */}
      {expanded && (
        <div style={{ padding: '16px 18px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function PMDashboard({ onNavigateToProject }) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [jumpToProject, setJumpToProject] = useState('');
  const [includeSecondary, setIncludeSecondary] = useState(() => {
    const saved = localStorage.getItem('includeSecondaryInCounts');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, includeSecondary]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setCurrentUser(userData);

      if (!userData) return;

      // Fetch user's projects
      // Include projects where user is: PM, Secondary PM, or Creator
      let projectQuery = supabase
        .from('projects')
        .select('*')
        .in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress']);

      if (includeSecondary) {
        // All three: PM, Secondary PM, or Created by user
        projectQuery = projectQuery.or(`pm_id.eq.${userData.id},secondary_pm_id.eq.${userData.id},created_by.eq.${userData.id}`);
      } else {
        // PM or Created by user (exclude secondary)
        projectQuery = projectQuery.or(`pm_id.eq.${userData.id},created_by.eq.${userData.id}`);
      }

      const { data: projectsData } = await projectQuery.order('delivery_date', { ascending: true });
      setProjects(projectsData || []);

      const projectIds = (projectsData || []).map(p => p.id);

      if (projectIds.length === 0) {
        setTasks([]);
        setRFIs([]);
        setSubmittals([]);
        setLoading(false);
        return;
      }

      // Fetch items for these projects
      const [tasksRes, rfisRes, submittalsRes] = await Promise.all([
        supabase.from('tasks').select('*, project:project_id(id, project_number, name)').in('project_id', projectIds),
        supabase.from('rfis').select('*, project:project_id(id, project_number, name)').in('project_id', projectIds),
        supabase.from('submittals').select('*, project:project_id(id, project_number, name)').in('project_id', projectIds)
      ]);

      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // COMPUTED DATA
  // ==========================================================================
  const dashboardData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // ===== OVERDUE ITEMS =====
    const overdueTasks = tasks.filter(t => 
      t.due_date && t.due_date < today && !['Completed', 'Cancelled'].includes(t.status)
    );
    const overdueRFIs = rfis.filter(r => 
      r.due_date && r.due_date < today && !['Answered', 'Closed'].includes(r.status)
    );
    const overdueSubmittals = submittals.filter(s => 
      s.due_date && s.due_date < today && ['Pending', 'Submitted', 'Under Review'].includes(s.status)
    );
    const allOverdue = [
      ...overdueTasks.map(t => ({ ...t, type: 'task', typeLabel: 'Task' })),
      ...overdueRFIs.map(r => ({ ...r, type: 'rfi', typeLabel: 'RFI' })),
      ...overdueSubmittals.map(s => ({ ...s, type: 'submittal', typeLabel: 'Submittal' }))
    ].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    // ===== DUE TODAY =====
    const dueTodayTasks = tasks.filter(t => 
      t.due_date === today && !['Completed', 'Cancelled'].includes(t.status)
    );
    const dueTodayRFIs = rfis.filter(r => 
      r.due_date === today && !['Answered', 'Closed'].includes(r.status)
    );
    const dueTodaySubmittals = submittals.filter(s => 
      s.due_date === today && ['Pending', 'Submitted', 'Under Review'].includes(s.status)
    );
    const allDueToday = [
      ...dueTodayTasks.map(t => ({ ...t, type: 'task', typeLabel: 'Task' })),
      ...dueTodayRFIs.map(r => ({ ...r, type: 'rfi', typeLabel: 'RFI' })),
      ...dueTodaySubmittals.map(s => ({ ...s, type: 'submittal', typeLabel: 'Submittal' }))
    ];

    // ===== DUE THIS WEEK (excluding today and overdue) =====
    const dueThisWeekTasks = tasks.filter(t => 
      t.due_date && t.due_date > today && t.due_date <= weekEndStr && !['Completed', 'Cancelled'].includes(t.status)
    );
    const dueThisWeekRFIs = rfis.filter(r => 
      r.due_date && r.due_date > today && r.due_date <= weekEndStr && !['Answered', 'Closed'].includes(r.status)
    );
    const dueThisWeekSubmittals = submittals.filter(s => 
      s.due_date && s.due_date > today && s.due_date <= weekEndStr && ['Pending', 'Submitted', 'Under Review'].includes(s.status)
    );
    const allDueThisWeek = [
      ...dueThisWeekTasks.map(t => ({ ...t, type: 'task', typeLabel: 'Task' })),
      ...dueThisWeekRFIs.map(r => ({ ...r, type: 'rfi', typeLabel: 'RFI' })),
      ...dueThisWeekSubmittals.map(s => ({ ...s, type: 'submittal', typeLabel: 'Submittal' }))
    ].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    // ===== PROJECT HEALTH =====
    const projectHealth = projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const projectRFIs = rfis.filter(r => r.project_id === project.id);
      const projectSubmittals = submittals.filter(s => s.project_id === project.id);

      const overdueCount = 
        projectTasks.filter(t => t.due_date && t.due_date < today && !['Completed', 'Cancelled'].includes(t.status)).length +
        projectRFIs.filter(r => r.due_date && r.due_date < today && !['Answered', 'Closed'].includes(r.status)).length +
        projectSubmittals.filter(s => s.due_date && s.due_date < today && ['Pending', 'Submitted', 'Under Review'].includes(s.status)).length;

      const openTasks = projectTasks.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length;
      const openRFIs = projectRFIs.filter(r => !['Answered', 'Closed'].includes(r.status)).length;
      const openSubmittals = projectSubmittals.filter(s => ['Pending', 'Submitted', 'Under Review'].includes(s.status)).length;

      const deliveryDays = getDaysUntil(project.delivery_date);

      let health = 'on-track';
      if (overdueCount >= 3 || (deliveryDays !== null && deliveryDays <= 3 && deliveryDays >= 0)) {
        health = 'critical';
      } else if (overdueCount > 0 || (deliveryDays !== null && deliveryDays <= 7 && deliveryDays >= 0)) {
        health = 'at-risk';
      }

      return {
        ...project,
        health,
        overdueCount,
        openTasks,
        openRFIs,
        openSubmittals,
        deliveryDays
      };
    });

    // ===== WEEK CALENDAR DATA =====
    const weekDays = [];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      const dayStr = day.toISOString().split('T')[0];
      
      const dayItems = [
        ...tasks.filter(t => t.due_date === dayStr && !['Completed', 'Cancelled'].includes(t.status))
          .map(t => ({ ...t, type: 'task', color: t.project?.color || '#ff6b35' })),
        ...rfis.filter(r => r.due_date === dayStr && !['Answered', 'Closed'].includes(r.status))
          .map(r => ({ ...r, type: 'rfi', color: r.project?.color || '#ff6b35' })),
        ...submittals.filter(s => s.due_date === dayStr && ['Pending', 'Submitted', 'Under Review'].includes(s.status))
          .map(s => ({ ...s, type: 'submittal', color: s.project?.color || '#ff6b35' }))
      ];

      // Add project key dates
      projects.forEach(p => {
        if (p.delivery_date === dayStr) {
          dayItems.push({ id: `delivery-${p.id}`, title: `${p.project_number} Delivery`, type: 'delivery', color: p.color || '#ff6b35', project: p });
        }
        if (p.target_online_date === dayStr) {
          dayItems.push({ id: `online-${p.id}`, title: `${p.project_number} Online`, type: 'milestone', color: p.color || '#ff6b35', project: p });
        }
        if (p.target_offline_date === dayStr) {
          dayItems.push({ id: `offline-${p.id}`, title: `${p.project_number} Offline`, type: 'milestone', color: p.color || '#ff6b35', project: p });
        }
      });

      weekDays.push({
        date: day,
        dateStr: dayStr,
        isToday: dayStr === today,
        items: dayItems
      });
    }

    return {
      overdue: allOverdue,
      dueToday: allDueToday,
      dueThisWeek: allDueThisWeek,
      projectHealth,
      weekDays,
      stats: {
        totalOverdue: allOverdue.length,
        totalDueToday: allDueToday.length,
        totalDueThisWeek: allDueThisWeek.length,
        totalProjects: projects.length,
        totalOpenItems: 
          tasks.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length +
          rfis.filter(r => !['Answered', 'Closed'].includes(r.status)).length +
          submittals.filter(s => ['Pending', 'Submitted', 'Under Review'].includes(s.status)).length
      }
    };
  }, [projects, tasks, rfis, submittals]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleJumpToProject = (projectId) => {
    if (projectId && onNavigateToProject) {
      onNavigateToProject(projectId);
    }
  };

  // ==========================================================================
  // RENDER - LOADING
  // ==========================================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - MAIN
  // ==========================================================================
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {greeting}, {currentUser?.name?.split(' ')[0] || 'there'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* ================================================================== */}
      {/* ALERT BAR - OVERDUE ITEMS                                         */}
      {/* ================================================================== */}
      {dashboardData.stats.totalOverdue > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-md)'
        }}>
          <Flame size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: '600', color: '#ef4444' }}>
              {dashboardData.stats.totalOverdue} overdue item{dashboardData.stats.totalOverdue !== 1 ? 's' : ''} need attention
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '8px' }}>
              ({dashboardData.overdue.filter(i => i.type === 'task').length} tasks, {dashboardData.overdue.filter(i => i.type === 'rfi').length} RFIs, {dashboardData.overdue.filter(i => i.type === 'submittal').length} submittals)
            </span>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* STATS ROW                                                         */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Overdue */}
        <div style={{
          padding: '16px',
          background: dashboardData.stats.totalOverdue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: dashboardData.stats.totalOverdue > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: dashboardData.stats.totalOverdue > 0 ? '#ef4444' : 'var(--text-primary)' }}>
            {dashboardData.stats.totalOverdue}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Overdue</div>
        </div>

        {/* Due Today */}
        <div style={{
          padding: '16px',
          background: dashboardData.stats.totalDueToday > 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: dashboardData.stats.totalDueToday > 0 ? '1px solid #f59e0b' : '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: dashboardData.stats.totalDueToday > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
            {dashboardData.stats.totalDueToday}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Due Today</div>
        </div>

        {/* Due This Week */}
        <div style={{
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {dashboardData.stats.totalDueThisWeek}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>This Week</div>
        </div>

        {/* Active Projects */}
        <div style={{
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--sunbelt-orange)' }}>
            {dashboardData.stats.totalProjects}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Projects</div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* QUICK ACTIONS ROW                                                 */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap'
      }}>
        {/* New Project Button */}
        <button
          onClick={() => {/* TODO: Open create project modal */}}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <FolderPlus size={18} />
          New Project
        </button>

        {/* Jump to Project */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '300px' }}>
          <select
            value={jumpToProject}
            onChange={(e) => {
              setJumpToProject(e.target.value);
              if (e.target.value) handleJumpToProject(e.target.value);
            }}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="">Jump to project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.project_number} - {p.name}</option>
            ))}
          </select>
        </div>

        {/* Include Secondary Toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)'
        }}>
          <input
            type="checkbox"
            checked={includeSecondary}
            onChange={(e) => {
              setIncludeSecondary(e.target.checked);
              localStorage.setItem('includeSecondaryInCounts', JSON.stringify(e.target.checked));
            }}
            style={{ accentColor: 'var(--sunbelt-orange)' }}
          />
          Include backup projects
        </label>
      </div>

      {/* ================================================================== */}
      {/* TODAY'S FOCUS - DUE TODAY + OVERDUE                               */}
      {/* ================================================================== */}
      {(dashboardData.dueToday.length > 0 || dashboardData.overdue.length > 0) && (
        <CollapsibleSection
          title="Today's Focus"
          icon={Target}
          badge={dashboardData.dueToday.length + dashboardData.overdue.length}
          badgeColor={dashboardData.overdue.length > 0 ? '#ef4444' : '#f59e0b'}
          storageKey="todays-focus"
          defaultExpanded={true}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Overdue items first */}
            {dashboardData.overdue.slice(0, 5).map(item => (
              <div
                key={`${item.type}-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.625rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    background: '#ef4444',
                    color: 'white'
                  }}>
                    {item.typeLabel}
                  </span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title || item.subject}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {item.project?.project_number}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ef4444', flexShrink: 0 }}>
                  {getRelativeDay(item.due_date)}
                </span>
              </div>
            ))}

            {/* Due today */}
            {dashboardData.dueToday.map(item => (
              <div
                key={`${item.type}-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.625rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    background: '#f59e0b',
                    color: 'white'
                  }}>
                    {item.typeLabel}
                  </span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title || item.subject}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {item.project?.project_number}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f59e0b', flexShrink: 0 }}>
                  Today
                </span>
              </div>
            ))}

            {dashboardData.overdue.length > 5 && (
              <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                +{dashboardData.overdue.length - 5} more overdue items
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Spacer */}
      <div style={{ height: 'var(--space-md)' }} />

      {/* ================================================================== */}
      {/* MY PROJECTS                                                       */}
      {/* ================================================================== */}
      <CollapsibleSection
        title="My Projects"
        icon={Building2}
        badge={dashboardData.projectHealth.length}
        badgeColor="var(--sunbelt-orange)"
        storageKey="my-projects"
        defaultExpanded={true}
      >
        {dashboardData.projectHealth.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>
            No active projects assigned
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {dashboardData.projectHealth.map(project => (
              <div
                key={project.id}
                onClick={() => handleJumpToProject(project.id)}
                style={{
                  padding: '14px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  borderLeft: `4px solid ${
                    project.health === 'critical' ? '#ef4444' :
                    project.health === 'at-risk' ? '#f59e0b' : '#22c55e'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                      {project.project_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {project.name}
                    </div>
                  </div>
                  {project.deliveryDays !== null && project.deliveryDays <= 14 && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.6875rem',
                      fontWeight: '600',
                      background: project.deliveryDays <= 3 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: project.deliveryDays <= 3 ? '#ef4444' : '#f59e0b'
                    }}>
                      {project.deliveryDays === 0 ? 'Delivery Today' : 
                       project.deliveryDays === 1 ? 'Delivery Tomorrow' :
                       `${project.deliveryDays}d to delivery`}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                  <span style={{ color: project.overdueCount > 0 ? '#ef4444' : 'var(--text-tertiary)' }}>
                    {project.overdueCount > 0 ? `${project.overdueCount} overdue` : '✓ On track'}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {project.openTasks}T / {project.openRFIs}R / {project.openSubmittals}S
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Spacer */}
      <div style={{ height: 'var(--space-md)' }} />

      {/* ================================================================== */}
      {/* WEEK CALENDAR                                                     */}
      {/* ================================================================== */}
      <CollapsibleSection
        title="Week Calendar"
        icon={CalendarDays}
        badge={dashboardData.weekDays.reduce((sum, d) => sum + d.items.length, 0)}
        badgeColor="var(--info)"
        storageKey="week-calendar"
        defaultExpanded={true}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {dashboardData.weekDays.map(day => (
            <div
              key={day.dateStr}
              style={{
                padding: '8px',
                background: day.isToday ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: day.isToday ? '2px solid var(--sunbelt-orange)' : '1px solid var(--border-color)',
                minHeight: '100px'
              }}
            >
              <div style={{ 
                fontSize: '0.6875rem', 
                fontWeight: '600', 
                color: day.isToday ? 'var(--sunbelt-orange)' : 'var(--text-tertiary)',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: day.isToday ? '700' : '600', 
                color: day.isToday ? 'var(--sunbelt-orange)' : 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                {day.date.getDate()}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {day.items.slice(0, 3).map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '3px 5px',
                      borderRadius: '3px',
                      fontSize: '0.625rem',
                      fontWeight: '500',
                      background: `${item.color || 'var(--sunbelt-orange)'}20`,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      borderLeft: `2px solid ${item.color || 'var(--sunbelt-orange)'}`
                    }}
                    title={item.title || item.subject}
                  >
                    {item.title || item.subject}
                  </div>
                ))}
                {day.items.length > 3 && (
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    +{day.items.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Spacer */}
      <div style={{ height: 'var(--space-md)' }} />

      {/* ================================================================== */}
      {/* GANTT TIMELINE                                                    */}
      {/* ================================================================== */}
      <CollapsibleSection
        title="Project Timeline"
        icon={GanttChart}
        badge={`${projects.length} projects`}
        badgeColor="var(--text-tertiary)"
        storageKey="gantt-timeline"
        defaultExpanded={false}
      >
        {dashboardData.projectHealth.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>
            No projects to display
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {/* Timeline header */}
            <div style={{ display: 'flex', marginBottom: '8px', paddingLeft: '140px' }}>
              {Array.from({ length: 12 }).map((_, i) => {
                const month = new Date();
                month.setDate(1);
                month.setMonth(month.getMonth() + i - 1);
                return (
                  <div
                    key={i}
                    style={{
                      flex: '0 0 60px',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {month.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                );
              })}
            </div>

            {/* Project bars */}
            {dashboardData.projectHealth.map(project => {
              const today = new Date();
              const startOfRange = new Date();
              startOfRange.setDate(1);
              startOfRange.setMonth(startOfRange.getMonth() - 1);
              
              const endOfRange = new Date();
              endOfRange.setMonth(endOfRange.getMonth() + 11);
              
              const totalDays = (endOfRange - startOfRange) / (1000 * 60 * 60 * 24);
              const totalWidth = 720; // 12 months * 60px

              // Calculate bar position based on dates
              const onlineDate = project.target_online_date ? new Date(project.target_online_date) : null;
              const deliveryDate = project.delivery_date ? new Date(project.delivery_date) : null;
              
              let barStart = 0;
              let barWidth = 60;
              
              if (onlineDate && deliveryDate) {
                const startDays = Math.max(0, (onlineDate - startOfRange) / (1000 * 60 * 60 * 24));
                const endDays = Math.min(totalDays, (deliveryDate - startOfRange) / (1000 * 60 * 60 * 24));
                barStart = (startDays / totalDays) * totalWidth;
                barWidth = Math.max(20, ((endDays - startDays) / totalDays) * totalWidth);
              } else if (deliveryDate) {
                const endDays = (deliveryDate - startOfRange) / (1000 * 60 * 60 * 24);
                barStart = Math.max(0, ((endDays - 30) / totalDays) * totalWidth);
                barWidth = 60;
              }

              return (
                <div
                  key={project.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '6px'
                  }}
                >
                  <div style={{
                    width: '140px',
                    flexShrink: 0,
                    paddingRight: '12px'
                  }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {project.project_number}
                    </div>
                  </div>
                  
                  <div style={{ 
                    position: 'relative', 
                    width: `${totalWidth}px`, 
                    height: '24px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px'
                  }}>
                    {/* Today marker */}
                    <div style={{
                      position: 'absolute',
                      left: `${((today - startOfRange) / (1000 * 60 * 60 * 24) / totalDays) * totalWidth}px`,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      background: 'var(--sunbelt-orange)',
                      zIndex: 1
                    }} />
                    
                    {/* Project bar */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${barStart}px`,
                        width: `${barWidth}px`,
                        top: '4px',
                        height: '16px',
                        background: project.health === 'critical' ? '#ef4444' :
                                   project.health === 'at-risk' ? '#f59e0b' : '#22c55e',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleJumpToProject(project.id)}
                      title={`${project.project_number}: ${project.name}`}
                    />
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingLeft: '140px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#22c55e' }} />
                On Track
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#f59e0b' }} />
                At Risk
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ef4444' }} />
                Critical
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                <div style={{ width: '2px', height: '12px', background: 'var(--sunbelt-orange)' }} />
                Today
              </div>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Spacer */}
      <div style={{ height: 'var(--space-md)' }} />

      {/* ================================================================== */}
      {/* COMING UP THIS WEEK                                               */}
      {/* ================================================================== */}
      {dashboardData.dueThisWeek.length > 0 && (
        <CollapsibleSection
          title="Coming Up This Week"
          icon={Clock}
          badge={dashboardData.dueThisWeek.length}
          badgeColor="var(--text-secondary)"
          storageKey="this-week"
          defaultExpanded={false}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {dashboardData.dueThisWeek.map(item => (
              <div
                key={`${item.type}-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.625rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)'
                  }}>
                    {item.typeLabel}
                  </span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title || item.subject}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {item.project?.project_number}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {formatFullDate(item.due_date)}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

export default PMDashboard;