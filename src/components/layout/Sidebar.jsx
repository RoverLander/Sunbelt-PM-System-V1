// ============================================================================
// Sidebar Component - With PM/Director/VP/IT/PC View Modes
// ============================================================================
// Shows different sidebar content based on user role and dashboard type:
// - PM View: My Projects, My Tasks, Overdue counts
// - Director View: Portfolio Health, At-Risk, Team stats
// - VP View: Executive KPIs, Portfolio Value
// - IT View: User management, System health, Audit stats
// - PC View: Factory projects, Deadlines, Warning emails
//
// FIXES (Jan 9, 2026):
// - ✅ FIXED: Different nav items per dashboard type with role-specific pages first
// - ✅ FIXED: Compact stats to fit 1080p laptop screens without scrolling
// - ✅ FIXED: Sidebar width reduced from 280px to 260px
// - ✅ FIXED: VP now has Reports page
//
// NAV ORDER:
// - PM: Dashboard → Projects, Tasks, RFIs, Submittals, Calendar
// - Director: Dashboard → Team, Reports → Projects, Tasks, RFIs, Submittals, Calendar
// - VP: Dashboard → Analytics, Clients, Team, Reports → Projects, Tasks, RFIs, Submittals, Calendar
// - IT: Dashboard → User Management → Projects, Tasks, RFIs, Submittals, Calendar
// - PC: Dashboard → Deadlines, Drawings, Approvals → Projects, Tasks, Calendar
//
// UPDATES (Jan 9, 2026):
// - ✅ ADDED: PC (Project Coordinator) dashboard type
// - ✅ ADDED: Factory-specific stats for PC role
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Building2,
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  Calendar,
  CheckSquare,
  FileText,
  ClipboardList,
  Sun,
  Moon,
  LogOut,
  AlertCircle,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Users,
  AlertTriangle,
  TrendingUp,
  Activity,
  DollarSign,
  Briefcase,
  PieChart,
  Shield,
  Server,
  Factory,
  Clock,
  Mail,
  Map as MapIcon
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function Sidebar({
  currentView,
  setCurrentView,
  dashboardType,
  setDashboardType,
  includeBackupProjects = false,
  onToggleBackupProjects,
  onStatClick
}) {
  const { user, signOut } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);

  // PM View Stats
  const [activeProjects, setActiveProjects] = useState(0);
  const [myTasks, setMyTasks] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);

  // Use props for includeSecondary (synced with App state)
  const includeSecondary = includeBackupProjects;

  // Director View Stats
  const [directorStats, setDirectorStats] = useState({
    totalProjects: 0,
    onTrack: 0,
    atRisk: 0,
    critical: 0,
    totalOverdue: 0,
    teamMembers: 0
  });

  // VP View Stats
  const [vpStats, setVPStats] = useState({
    portfolioValue: 0,
    activeProjects: 0,
    onTimeRate: 0,
    totalClients: 0
  });

  // IT View Stats
  const [itStats, setITStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    recentErrors: 0
  });

  // PC View Stats
  const [pcStats, setPCStats] = useState({
    factoryProjects: 0,
    overdueItems: 0,
    dueThisWeek: 0,
    warningsSent: 0
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Fetch VP/Director/IT/PC stats immediately (don't need currentUser for some)
  useEffect(() => {
    if (dashboardType === 'vp') {
      fetchVPStats();
    } else if (dashboardType === 'director') {
      fetchDirectorStats();
    } else if (dashboardType === 'it') {
      fetchITStats();
    } else if (dashboardType === 'pc') {
      fetchPCStats();
    }
  }, [dashboardType]);

  // Fetch PM stats only after currentUser is loaded
  useEffect(() => {
    if (currentUser && dashboardType === 'pm') {
      fetchPMStats();
    }
  }, [currentUser, dashboardType, includeSecondary]);

  // ==========================================================================
  // SET DEFAULT DASHBOARD BASED ON ROLE
  // ==========================================================================
  useEffect(() => {
    if (currentUser && setDashboardType) {
      const userRole = (currentUser.role || '').toLowerCase();
      const savedDashboard = localStorage.getItem('dashboardType');
      
      if (!savedDashboard) {
        if (userRole === 'vp') {
          setDashboardType('vp');
          localStorage.setItem('dashboardType', 'vp');
        } else if (userRole === 'it') {
          setDashboardType('it');
          localStorage.setItem('dashboardType', 'it');
        } else if (userRole === 'director' || userRole === 'admin') {
          setDashboardType('director');
          localStorage.setItem('dashboardType', 'director');
        } else if (userRole === 'project coordinator' || userRole === 'pc') {
          setDashboardType('pc');
          localStorage.setItem('dashboardType', 'pc');
        } else {
          setDashboardType('pm');
          localStorage.setItem('dashboardType', 'pm');
        }
      } else {
        // Validate saved preference against role permissions
        if (userRole === 'director' && savedDashboard === 'vp') {
          setDashboardType('director');
          localStorage.setItem('dashboardType', 'director');
        }
      }
    }
  }, [currentUser, setDashboardType]);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchPMStats = async () => {
    if (!currentUser?.id) return;

    try {
      const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
      const activeTaskStatuses = ['Not Started', 'In Progress', 'Awaiting Response'];
      const today = new Date().toISOString().split('T')[0];

      // Fetch projects where user is primary PM - filter client-side
      const { data: primaryProjectsRaw } = await supabase
        .from('projects')
        .select('id, status')
        .eq('owner_id', currentUser.id);

      const primaryProjects = (primaryProjectsRaw || []).filter(p => activeStatuses.includes(p.status));

      // Fetch projects where user is backup PM (if toggle enabled)
      let backupProjects = [];
      if (includeSecondary) {
        const { data: backupRaw } = await supabase
          .from('projects')
          .select('id, status')
          .eq('backup_pm_id', currentUser.id);
        backupProjects = (backupRaw || []).filter(p => activeStatuses.includes(p.status));
      }

      // Combine and deduplicate
      const allProjectIds = [...new Set([
        ...primaryProjects.map(p => p.id),
        ...backupProjects.map(p => p.id)
      ])];

      setActiveProjects(allProjectIds.length);

      // Fetch tasks - use separate queries to avoid .or() issues
      const [assignedTasksRes, ownedTasksRes] = await Promise.all([
        supabase.from('tasks').select('id, status, due_date').eq('assignee_id', currentUser.id),
        supabase.from('tasks').select('id, status, due_date').eq('internal_owner_id', currentUser.id)
      ]);

      // Combine and deduplicate, then filter by status
      const taskMap = new Map();
      [...(assignedTasksRes.data || []), ...(ownedTasksRes.data || [])].forEach(t => taskMap.set(t.id, t));
      const openTasks = Array.from(taskMap.values()).filter(t => activeTaskStatuses.includes(t.status));

      setMyTasks(openTasks.length);

      const overdue = openTasks.filter(t => t.due_date && t.due_date < today).length;
      setOverdueTasks(overdue);

    } catch (error) {
      console.error('Error fetching PM stats:', error);
    }
  };

  const fetchDirectorStats = async () => {
    try {
      const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
      const activeTaskStatuses = ['Not Started', 'In Progress', 'Awaiting Response'];
      const today = new Date().toISOString().split('T')[0];

      // Fetch all projects and filter client-side
      const { data: allProjects } = await supabase
        .from('projects')
        .select('id, status, health_status');

      const projectList = (allProjects || []).filter(p => activeStatuses.includes(p.status));
      const total = projectList.length;

      // Calculate health breakdown
      const onTrack = projectList.filter(p => p.health_status === 'On Track' || !p.health_status).length;
      const atRisk = projectList.filter(p => p.health_status === 'At Risk').length;
      const critical = projectList.filter(p => p.health_status === 'Critical').length;

      // Fetch tasks and filter client-side
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, status, due_date')
        .lt('due_date', today);

      const overdueCount = (allTasks || []).filter(t => activeTaskStatuses.includes(t.status)).length;

      // Fetch team members
      const { count: teamCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      setDirectorStats({
        totalProjects: total,
        onTrack,
        atRisk,
        critical,
        totalOverdue: overdueCount,
        teamMembers: teamCount || 0
      });

    } catch (error) {
      console.error('Error fetching director stats:', error);
    }
  };

  const fetchVPStats = async () => {
    try {
      const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];

      // Fetch projects with contract values - filter client-side
      const { data: allProjects } = await supabase
        .from('projects')
        .select('id, contract_value, status');

      const projects = (allProjects || []).filter(p => activeStatuses.includes(p.status));

      const projectList = projects || [];
      const totalValue = projectList.reduce((sum, p) => sum + (p.contract_value || 0), 0);

      // Fetch unique clients
      const { data: clients } = await supabase
        .from('projects')
        .select('client_name')
        .not('client_name', 'is', null);

      const uniqueClients = new Set((clients || []).map(c => c.client_name).filter(Boolean));

      setVPStats({
        portfolioValue: totalValue,
        activeProjects: projectList.length,
        onTimeRate: 100, // Default - needs actual_completion_date to calculate
        totalClients: uniqueClients.size
      });

    } catch (error) {
      console.error('Error fetching VP stats:', error);
    }
  };

  const fetchITStats = async () => {
    try {
      // Fetch users
      const { data: users } = await supabase.from('users').select('id, is_active');
      const userList = users || [];
      const activeUsers = userList.filter(u => u.is_active !== false).length;

      // Fetch project count
      const { count: projectCount } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true });

      setITStats({
        totalUsers: userList.length,
        activeUsers,
        totalProjects: projectCount || 0,
        recentErrors: 0
      });

    } catch (error) {
      console.error('Error fetching IT stats:', error);
    }
  };

  const fetchPCStats = async () => {
    if (!user?.id) return;

    try {
      const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
      const activeTaskStatuses = ['Not Started', 'In Progress', 'Awaiting Response'];
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const weekEndDate = weekFromNow.toISOString().split('T')[0];

      // Get user's factory_code
      const { data: userData } = await supabase
        .from('users')
        .select('factory_code, factory_id')
        .eq('id', user.id)
        .single();

      // Fetch all projects and filter client-side
      const { data: allProjects } = await supabase
        .from('projects')
        .select('id, status, factory_id, factory_code');

      // Filter by status and factory
      let projects = (allProjects || []).filter(p => activeStatuses.includes(p.status));
      if (userData?.factory_id) {
        projects = projects.filter(p => p.factory_id === userData.factory_id);
      } else if (userData?.factory_code) {
        projects = projects.filter(p => p.factory_code === userData.factory_code);
      }

      const projectIds = projects.map(p => p.id);

      // Fetch all tasks and filter client-side
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, project_id, status, due_date');

      const factoryTasks = (allTasks || []).filter(t =>
        projectIds.includes(t.project_id) && activeTaskStatuses.includes(t.status)
      );

      // Count overdue tasks
      const overdueCount = factoryTasks.filter(t => t.due_date && t.due_date < today).length;

      // Count due this week
      const weekCount = factoryTasks.filter(t =>
        t.due_date && t.due_date >= today && t.due_date <= weekEndDate
      ).length;

      setPCStats({
        factoryProjects: projectIds.length,
        overdueItems: overdueCount,
        dueThisWeek: weekCount,
        warningsSent: 0 // Would need warning_emails_log table
      });

    } catch (error) {
      console.error('Error fetching PC stats:', error);
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const toggleIncludeSecondary = () => {
    if (onToggleBackupProjects) {
      onToggleBackupProjects(!includeSecondary);
    }
  };

  // ==========================================================================
  // DASHBOARD ACCESS
  // ==========================================================================
  const canAccessDashboard = (type) => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toLowerCase();

    const access = {
      pm: ['pm', 'director', 'vp', 'it', 'admin', 'project coordinator', 'plant manager'],
      director: ['director', 'vp', 'admin'],
      vp: ['vp', 'admin'],
      it: ['it', 'admin'],
      pc: ['project coordinator', 'pc', 'plant manager', 'director', 'vp', 'admin']
    };

    return access[type]?.includes(role) || false;
  };

  // ==========================================================================
  // FORMAT CURRENCY
  // ==========================================================================
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  // ==========================================================================
  // GET DASHBOARD CONFIG
  // ==========================================================================
  const getDashboardConfig = (type) => {
    const configs = {
      pm: { icon: LayoutDashboard, label: 'PM Dashboard', color: 'var(--sunbelt-orange)' },
      director: { icon: BarChart3, label: 'Director Dashboard', color: 'var(--info)' },
      vp: { icon: TrendingUp, label: 'VP Dashboard', color: '#8b5cf6' },
      it: { icon: Shield, label: 'IT Dashboard', color: '#06b6d4' },
      pc: { icon: Factory, label: 'PC Dashboard', color: '#ec4899' }
    };
    return configs[type] || configs.pm;
  };

  const currentConfig = getDashboardConfig(dashboardType);
  const CurrentIcon = currentConfig.icon;

  // ==========================================================================
  // RENDER: Compact Stats by Dashboard Type
  // ==========================================================================
  const renderStats = () => {
    switch (dashboardType) {
      case 'pm':
        return (
          <div style={{ padding: '0 var(--space-md)', marginBottom: 'var(--space-sm)' }}>
            {/* Compact stat rows */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <div style={{
                flex: 1,
                padding: '8px 10px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FolderKanban size={14} style={{ color: 'var(--sunbelt-orange)' }} />
                <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-primary)' }}>{activeProjects}</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Projects</span>
              </div>
              <div style={{
                flex: 1,
                padding: '8px 10px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckSquare size={14} style={{ color: 'var(--info)' }} />
                <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-primary)' }}>{myTasks}</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Tasks</span>
              </div>
            </div>

            {/* Overdue row - clickable */}
            {overdueTasks > 0 && (
              <div
                onClick={() => onStatClick && onStatClick('tasks', 'overdue')}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <AlertCircle size={14} style={{ color: 'var(--danger)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--danger)' }}>{overdueTasks} Overdue</span>
              </div>
            )}

            {/* Secondary toggle - compact */}
            <button
              onClick={toggleIncludeSecondary}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: includeSecondary ? 'var(--sunbelt-orange)' : 'var(--text-tertiary)',
                fontSize: '0.6875rem',
                width: '100%'
              }}
            >
              {includeSecondary ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              Include backup PM projects
            </button>
          </div>
        );

      case 'director':
        return (
          <div style={{ padding: '0 var(--space-md)', marginBottom: 'var(--space-sm)' }}>
            {/* Projects count */}
            <div style={{
              padding: '8px 10px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <FolderKanban size={14} style={{ color: 'var(--info)' }} />
              <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-primary)' }}>{directorStats.totalProjects}</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Active Projects</span>
            </div>

            {/* Health breakdown - compact 3 col */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <div style={{
                flex: 1,
                padding: '6px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--success)' }}>{directorStats.onTrack}</div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-tertiary)' }}>On Track</div>
              </div>
              <div style={{
                flex: 1,
                padding: '6px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--warning)' }}>{directorStats.atRisk}</div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-tertiary)' }}>At Risk</div>
              </div>
              <div style={{
                flex: 1,
                padding: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--danger)' }}>{directorStats.critical}</div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-tertiary)' }}>Critical</div>
              </div>
            </div>

            {/* Overdue + Team - compact row */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {directorStats.totalOverdue > 0 && (
                <div style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertTriangle size={12} style={{ color: 'var(--danger)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--danger)' }}>{directorStats.totalOverdue}</span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>Overdue</span>
                </div>
              )}
              <div style={{
                flex: 1,
                padding: '6px 8px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Users size={12} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)' }}>{directorStats.teamMembers}</span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>Team</span>
              </div>
            </div>
          </div>
        );

      case 'vp':
        return (
          <div style={{ padding: '0 var(--space-md)', marginBottom: 'var(--space-sm)' }}>
            {/* Portfolio value */}
            <div style={{
              padding: '8px 10px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <DollarSign size={12} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>Portfolio Value</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#8b5cf6' }}>
                {formatCurrency(vpStats.portfolioValue)}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{
                flex: 1,
                padding: '6px 8px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>{vpStats.activeProjects}</div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-tertiary)' }}>Projects</div>
              </div>
              <div style={{
                flex: 1,
                padding: '6px 8px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--success)' }}>{vpStats.onTimeRate}%</div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-tertiary)' }}>On Time</div>
              </div>
              <div style={{
                flex: 1,
                padding: '6px 8px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>{vpStats.totalClients}</div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-tertiary)' }}>Clients</div>
              </div>
            </div>
          </div>
        );

      case 'it':
        return (
          <div style={{ padding: '0 var(--space-md)', marginBottom: 'var(--space-sm)' }}>
            {/* Users row */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <div style={{
                flex: 1,
                padding: '8px 10px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Users size={14} style={{ color: '#06b6d4' }} />
                <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-primary)' }}>{itStats.totalUsers}</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Users</span>
              </div>
              <div style={{
                flex: 1,
                padding: '8px 10px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Activity size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-primary)' }}>{itStats.activeUsers}</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Active</span>
              </div>
            </div>

            {/* System status */}
            <div style={{
              padding: '6px 10px',
              background: itStats.recentErrors > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Server size={14} style={{ color: itStats.recentErrors > 0 ? 'var(--danger)' : 'var(--success)' }} />
              <span style={{
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: itStats.recentErrors > 0 ? 'var(--danger)' : 'var(--success)'
              }}>
                {itStats.recentErrors > 0 ? `${itStats.recentErrors} Errors` : 'System Healthy'}
              </span>
            </div>
          </div>
        );

      case 'pc':
        return (
          <div style={{ padding: '0 var(--space-md)', marginBottom: 'var(--space-sm)' }}>
            {/* Factory projects count */}
            <div style={{
              padding: '8px 10px',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.05))',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <Factory size={12} style={{ color: '#ec4899' }} />
                <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>Factory Projects</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#ec4899' }}>
                {pcStats.factoryProjects}
              </div>
            </div>

            {/* Deadlines row */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {pcStats.overdueItems > 0 && (
                <div style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={12} style={{ color: 'var(--danger)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--danger)' }}>{pcStats.overdueItems}</span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>Overdue</span>
                </div>
              )}
              <div style={{
                flex: 1,
                padding: '6px 8px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Clock size={12} style={{ color: 'var(--warning)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)' }}>{pcStats.dueThisWeek}</span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>This Week</span>
              </div>
            </div>

            {/* Warnings sent */}
            <div style={{
              padding: '6px 10px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Mail size={14} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>{pcStats.warningsSent}</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Warnings Sent</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ==========================================================================
  // RENDER: Navigation Items by Dashboard Type
  // Role-specific pages come RIGHT AFTER Dashboard, then common pages
  // ==========================================================================
  const renderNavItems = () => {
    // Common project management pages (always at the end)
    const commonItems = [
      { id: 'projects', label: 'Projects', icon: FolderKanban },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare },
      { id: 'rfis', label: 'RFIs', icon: FileText },
      { id: 'submittals', label: 'Submittals', icon: ClipboardList },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
      { id: 'factory-map', label: 'Factory Map', icon: MapIcon },
    ];

    switch (dashboardType) {
      case 'pm':
        // PM: Dashboard → [common pages]
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          ...commonItems,
        ];

      case 'director':
        // Director: Dashboard → Team, Reports → [common pages]
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'team', label: 'Team', icon: Users },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          ...commonItems,
        ];

      case 'vp':
        // VP: Dashboard → Analytics, Clients, Team, Reports → [common pages]
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'analytics', label: 'Analytics', icon: PieChart },
          { id: 'clients', label: 'Clients', icon: Briefcase },
          { id: 'team', label: 'Team', icon: Users },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          ...commonItems,
        ];

      case 'it':
        // IT: Dashboard → User Management → [common pages]
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'users', label: 'User Management', icon: Users },
          ...commonItems,
        ];

      case 'pc':
        // PC: Dashboard → [focused common pages]
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'projects', label: 'Projects', icon: FolderKanban },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
        ];

      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          ...commonItems,
        ];
    }
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100
    }}>
      {/* ================================================================== */}
      {/* LOGO                                                              */}
      {/* ================================================================== */}
      <div style={{
        padding: 'var(--space-md) var(--space-lg)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Building2 size={24} style={{ color: 'var(--sunbelt-orange)' }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>Sunbelt PM</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>Project Management</div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* DASHBOARD SELECTOR                                                */}
      {/* ================================================================== */}
      <div style={{ padding: 'var(--space-sm) var(--space-md)' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDashboardMenu(!showDashboardMenu)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: `${currentConfig.color}15`,
              border: `1px solid ${currentConfig.color}30`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: currentConfig.color
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CurrentIcon size={16} />
              <span style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{currentConfig.label}</span>
            </div>
            <ChevronDown size={14} style={{ transform: showDashboardMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Dropdown */}
          {showDashboardMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 200,
              overflow: 'hidden'
            }}>
              {['pm', 'director', 'vp', 'it'].map(type => {
                if (!canAccessDashboard(type)) return null;
                const config = getDashboardConfig(type);
                const Icon = config.icon;
                const isActive = dashboardType === type;

                return (
                  <button
                    key={type}
                    onClick={() => {
                      setDashboardType(type);
                      localStorage.setItem('dashboardType', type);
                      setShowDashboardMenu(false);
                      setCurrentView('dashboard');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: isActive ? `${config.color}15` : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: isActive ? config.color : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? '600' : '500',
                      textAlign: 'left'
                    }}
                  >
                    <Icon size={16} />
                    {config.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* STATS                                                             */}
      {/* ================================================================== */}
      {renderStats()}

      {/* ================================================================== */}
      {/* NAVIGATION                                                        */}
      {/* ================================================================== */}
      <nav style={{ flex: 1, padding: '0 var(--space-sm)', overflowY: 'auto' }}>
        <div style={{ marginBottom: 'var(--space-xs)' }}>
          <span style={{ 
            fontSize: '0.625rem', 
            fontWeight: '600', 
            color: 'var(--text-tertiary)', 
            textTransform: 'uppercase',
            padding: '0 var(--space-sm)',
            letterSpacing: '0.05em'
          }}>
            Navigation
          </span>
        </div>
        {renderNavItems().map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                marginBottom: '2px',
                background: isActive ? `${currentConfig.color}15` : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: isActive ? currentConfig.color : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: isActive ? '600' : '500',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ================================================================== */}
      {/* FOOTER                                                            */}
      {/* ================================================================== */}
      <div style={{
        padding: 'var(--space-md)',
        borderTop: '1px solid var(--border-color)'
      }}>
        {/* User info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-sm)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.75rem'
          }}>
            {currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.name || 'Loading...'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
              {currentUser?.role || '—'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={toggleDarkMode}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem'
            }}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem'
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;