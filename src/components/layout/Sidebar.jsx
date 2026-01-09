// ============================================================================
// Sidebar Component - With PM/Director/VP/IT View Modes
// ============================================================================
// Shows different sidebar content based on user role and dashboard type:
// - PM View: My Projects, My Tasks, Overdue counts
// - Director View: Portfolio Health, At-Risk, Team stats
// - VP View: Executive KPIs, Portfolio Value
// - IT View: User management, System health, Audit stats
//
// FIXES (Jan 9, 2026):
// - ✅ FIXED: fetchPMStats now checks owner_id, primary_pm_id, AND backup_pm_id
// - ✅ FIXED: Proper deduplication of projects from multiple queries
//
// UPDATES (Jan 8, 2026):
// - Added IT Dashboard support for IT role
// - IT users can access IT Dashboard (system admin features)
// - Added Shield icon for IT branding
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
  Target,
  DollarSign,
  Briefcase,
  PieChart,
  Shield,
  Server,
  Database
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function Sidebar({ currentView, setCurrentView, dashboardType, setDashboardType }) {
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
  const [includeSecondary, setIncludeSecondary] = useState(() => {
    const saved = localStorage.getItem('includeSecondaryInCounts');
    return saved !== null ? JSON.parse(saved) : false;
  });

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

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // ==========================================================================
  // SET DEFAULT DASHBOARD BASED ON ROLE (runs once when user data loads)
  // ==========================================================================
  useEffect(() => {
    if (currentUser && setDashboardType) {
      const userRole = (currentUser.role || '').toLowerCase();
      const savedDashboard = localStorage.getItem('dashboardType');
      
      // Only set default if no saved preference OR saved preference is invalid for role
      if (!savedDashboard) {
        // Set default based on role
        if (userRole === 'vp') {
          setDashboardType('vp');
          localStorage.setItem('dashboardType', 'vp');
        } else if (userRole === 'it') {
          setDashboardType('it');
          localStorage.setItem('dashboardType', 'it');
        } else if (userRole === 'director' || userRole === 'admin') {
          setDashboardType('director');
          localStorage.setItem('dashboardType', 'director');
        } else {
          setDashboardType('pm');
          localStorage.setItem('dashboardType', 'pm');
        }
      } else {
        // Validate saved preference against role permissions
        // Directors cannot access VP dashboard
        if (userRole === 'director' && savedDashboard === 'vp') {
          setDashboardType('director');
          localStorage.setItem('dashboardType', 'director');
        }
        // PMs cannot access IT/VP/Director dashboards
        if (userRole === 'pm' && ['vp', 'it', 'director'].includes(savedDashboard)) {
          setDashboardType('pm');
          localStorage.setItem('dashboardType', 'pm');
        }
      }
    }
  }, [currentUser, setDashboardType]);

  // VP/Director/IT stats - fetch immediately (don't need currentUser)
  useEffect(() => {
    if (dashboardType === 'vp') {
      fetchVPStats();
    } else if (dashboardType === 'director') {
      fetchDirectorStats();
    } else if (dashboardType === 'it') {
      fetchITStats();
    }
  }, [dashboardType]);

  // PM stats - need currentUser for filtering by user's projects
  useEffect(() => {
    if (currentUser && dashboardType === 'pm') {
      fetchPMStats();
    }
  }, [currentUser, dashboardType, includeSecondary]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // ==========================================================================
  // FETCH USER DATA
  // ==========================================================================
  const fetchUserData = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && userData) {
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // ==========================================================================
  // FETCH PM STATS - ✅ FIXED: Now checks owner_id, primary_pm_id, AND backup_pm_id
  // ==========================================================================
  const fetchPMStats = async () => {
    if (!currentUser) return;

    try {
      // Fetch projects where user is primary PM or backup PM
      let projectsData = [];
      
      if (includeSecondary) {
        // ✅ FIXED: Include owner_id, primary_pm_id, AND backup_pm_id
        const [ownerRes, primaryPmRes, backupRes] = await Promise.all([
          supabase.from('projects').select('id').eq('owner_id', currentUser.id).in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress']),
          supabase.from('projects').select('id').eq('primary_pm_id', currentUser.id).in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress']),
          supabase.from('projects').select('id').eq('backup_pm_id', currentUser.id).in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'])
        ]);
        
        const allProjects = [...(ownerRes.data || []), ...(primaryPmRes.data || []), ...(backupRes.data || [])];
        const uniqueProjects = allProjects.filter((project, index, self) =>
          index === self.findIndex(p => p.id === project.id)
        );
        projectsData = uniqueProjects;
      } else {
        // ✅ FIXED: Only primary PM projects (check both owner_id AND primary_pm_id)
        const [ownerRes, primaryPmRes] = await Promise.all([
          supabase.from('projects').select('id').eq('owner_id', currentUser.id).in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress']),
          supabase.from('projects').select('id').eq('primary_pm_id', currentUser.id).in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'])
        ]);
        
        // Combine and deduplicate
        const allProjects = [...(ownerRes.data || []), ...(primaryPmRes.data || [])];
        const uniqueProjects = allProjects.filter((project, index, self) =>
          index === self.findIndex(p => p.id === project.id)
        );
        projectsData = uniqueProjects;
      }

      const projectIds = projectsData.map(p => p.id);
      setActiveProjects(projectIds.length);

      if (projectIds.length === 0) {
        setMyTasks(0);
        setOverdueTasks(0);
        return;
      }

      const { data: tasksList } = await supabase
        .from('tasks')
        .select('id, status, due_date, assignee_id, internal_owner_id')
        .in('project_id', projectIds)
        .in('status', ['Not Started', 'In Progress', 'Blocked']);

      const myTasksList = (tasksList || []).filter(t => 
        t.assignee_id === currentUser.id || t.internal_owner_id === currentUser.id
      );

      setMyTasks(myTasksList.length);

      const today = new Date().toISOString().split('T')[0];
      setOverdueTasks(myTasksList.filter(t => t.due_date && t.due_date < today).length);

    } catch (error) {
      console.error('Error fetching PM stats:', error);
    }
  };

  // ==========================================================================
  // FETCH DIRECTOR STATS
  // ==========================================================================
  const fetchDirectorStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: projects } = await supabase
        .from('projects')
        .select('id, status, delivery_date')
        .in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress']);

      const projectIds = (projects || []).map(p => p.id);

      const [tasksResult, rfisResult, submittalsResult, usersResult] = await Promise.all([
        projectIds.length > 0 
          ? supabase.from('tasks').select('id, project_id, due_date, status').in('project_id', projectIds)
          : { data: [] },
        projectIds.length > 0
          ? supabase.from('rfis').select('id, project_id, due_date, status').in('project_id', projectIds)
          : { data: [] },
        projectIds.length > 0
          ? supabase.from('submittals').select('id, project_id, due_date, status').in('project_id', projectIds)
          : { data: [] },
        supabase.from('users').select('id').eq('is_active', true)
      ]);

      const tasks = tasksResult.data || [];
      const rfis = rfisResult.data || [];
      
      // Count overdue items
      const overdueTasks = tasks.filter(t => 
        t.due_date && t.due_date < today && !['Completed', 'Cancelled'].includes(t.status)
      ).length;
      
      const overdueRFIs = rfis.filter(r => 
        r.due_date && r.due_date < today && !['Closed', 'Answered'].includes(r.status)
      ).length;

      // Calculate project health
      const projectHealth = (projects || []).map(p => {
        const projectTasks = tasks.filter(t => t.project_id === p.id);
        const projectOverdue = projectTasks.filter(t => 
          t.due_date && t.due_date < today && !['Completed', 'Cancelled'].includes(t.status)
        ).length;
        
        if (projectOverdue > 3) return 'critical';
        if (projectOverdue > 0) return 'at-risk';
        return 'on-track';
      });

      setDirectorStats({
        totalProjects: projects?.length || 0,
        onTrack: projectHealth.filter(h => h === 'on-track').length,
        atRisk: projectHealth.filter(h => h === 'at-risk').length,
        critical: projectHealth.filter(h => h === 'critical').length,
        totalOverdue: overdueTasks + overdueRFIs,
        teamMembers: usersResult.data?.length || 0
      });

    } catch (error) {
      console.error('Error fetching Director stats:', error);
    }
  };

  // ==========================================================================
  // FETCH VP STATS
  // ==========================================================================
  const fetchVPStats = async () => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status, contract_value, client_name, target_online_date, actual_completion_date')
        .in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress', 'Completed']);

      const activeProjects = (projects || []).filter(p => 
        !['Completed', 'Cancelled', 'On Hold'].includes(p.status)
      );

      const completedProjects = (projects || []).filter(p => p.status === 'Completed');

      // Calculate portfolio value
      const portfolioValue = activeProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);

      // Calculate on-time rate
      let onTimeRate = 100;
      if (completedProjects.length > 0) {
        const onTime = completedProjects.filter(p => {
          if (!p.target_online_date || !p.actual_completion_date) return true;
          return new Date(p.actual_completion_date) <= new Date(p.target_online_date);
        }).length;
        onTimeRate = Math.round((onTime / completedProjects.length) * 100);
      }

      // Count unique clients
      const clients = [...new Set((projects || []).map(p => p.client_name).filter(Boolean))];

      setVPStats({
        portfolioValue,
        activeProjects: activeProjects.length,
        onTimeRate,
        totalClients: clients.length
      });

    } catch (error) {
      console.error('Error fetching VP stats:', error);
    }
  };

  // ==========================================================================
  // FETCH IT STATS
  // ==========================================================================
  const fetchITStats = async () => {
    try {
      const [usersResult, projectsResult] = await Promise.all([
        supabase.from('users').select('id, is_active'),
        supabase.from('projects').select('id', { count: 'exact', head: true })
      ]);

      const users = usersResult.data || [];
      const activeUsers = users.filter(u => u.is_active !== false).length;

      setITStats({
        totalUsers: users.length,
        activeUsers,
        totalProjects: projectsResult.count || 0,
        recentErrors: 0 // Would need error_log table
      });

    } catch (error) {
      console.error('Error fetching IT stats:', error);
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
    const newValue = !includeSecondary;
    setIncludeSecondary(newValue);
    localStorage.setItem('includeSecondaryInCounts', JSON.stringify(newValue));
  };

  // ==========================================================================
  // DASHBOARD ACCESS - Who can access what
  // ==========================================================================
  const canAccessDashboard = (type) => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toLowerCase();
    
    // Dashboard access matrix
    const access = {
      pm: ['pm', 'director', 'vp', 'it', 'admin'],
      director: ['director', 'vp', 'admin'],
      vp: ['vp', 'admin'],
      it: ['it', 'admin']
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
  // GET DASHBOARD ICON & LABEL
  // ==========================================================================
  const getDashboardConfig = (type) => {
    const configs = {
      pm: { icon: LayoutDashboard, label: 'PM Dashboard', color: 'var(--sunbelt-orange)' },
      director: { icon: BarChart3, label: 'Director Dashboard', color: 'var(--info)' },
      vp: { icon: TrendingUp, label: 'VP Dashboard', color: '#8b5cf6' },
      it: { icon: Shield, label: 'IT Dashboard', color: '#06b6d4' }
    };
    return configs[type] || configs.pm;
  };

  const currentConfig = getDashboardConfig(dashboardType);
  const CurrentIcon = currentConfig.icon;

  // ==========================================================================
  // RENDER: Stats by Dashboard Type
  // ==========================================================================
  const renderStats = () => {
    switch (dashboardType) {
      case 'pm':
        return (
          <>
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderKanban size={16} style={{ color: 'var(--sunbelt-orange)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>My Projects</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {activeProjects}
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={16} style={{ color: 'var(--sunbelt-orange)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>My Tasks</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {myTasks}
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: overdueTasks > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: overdueTasks > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} style={{ color: overdueTasks > 0 ? 'var(--danger)' : 'var(--sunbelt-orange)' }} />
                <span style={{ fontSize: '0.8125rem', color: overdueTasks > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>Overdue</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: overdueTasks > 0 ? 'var(--danger)' : 'var(--text-primary)', marginTop: '4px' }}>
                {overdueTasks}
              </div>
            </div>

            <button
              onClick={toggleIncludeSecondary}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'transparent',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                fontSize: '0.75rem'
              }}
            >
              <span>Include backup projects</span>
              {includeSecondary ? (
                <ToggleRight size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              ) : (
                <ToggleLeft size={18} />
              )}
            </button>
          </>
        );

      case 'director':
        return (
          <>
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderKanban size={16} style={{ color: 'var(--info)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Active Projects</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {directorStats.totalProjects}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                padding: '8px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--success)' }}>{directorStats.onTrack}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>On Track</div>
              </div>
              <div style={{
                padding: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--warning)' }}>{directorStats.atRisk}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>At Risk</div>
              </div>
              <div style={{
                padding: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--danger)' }}>{directorStats.critical}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>Critical</div>
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: directorStats.totalOverdue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: directorStats.totalOverdue > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} style={{ color: directorStats.totalOverdue > 0 ? 'var(--danger)' : 'var(--text-tertiary)' }} />
                <span style={{ fontSize: '0.8125rem', color: directorStats.totalOverdue > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>Total Overdue</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: directorStats.totalOverdue > 0 ? 'var(--danger)' : 'var(--text-primary)', marginTop: '4px' }}>
                {directorStats.totalOverdue}
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} style={{ color: 'var(--info)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Team Members</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {directorStats.teamMembers}
              </div>
            </div>
          </>
        );

      case 'vp':
        return (
          <>
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={16} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Portfolio Value</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {formatCurrency(vpStats.portfolioValue)}
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderKanban size={16} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Active Projects</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {vpStats.activeProjects}
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={16} style={{ color: vpStats.onTimeRate >= 90 ? 'var(--success)' : 'var(--warning)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>On-Time Rate</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: vpStats.onTimeRate >= 90 ? 'var(--success)' : 'var(--warning)', marginTop: '4px' }}>
                {vpStats.onTimeRate}%
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Clients</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {vpStats.totalClients}
              </div>
            </div>
          </>
        );

      case 'it':
        return (
          <>
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} style={{ color: '#06b6d4' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Users</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {itStats.totalUsers}
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Active Users</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--success)', marginTop: '4px' }}>
                {itStats.activeUsers}
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} style={{ color: '#06b6d4' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Projects</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {itStats.totalProjects}
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: itStats.recentErrors > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: itStats.recentErrors > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={16} style={{ color: itStats.recentErrors > 0 ? 'var(--danger)' : 'var(--success)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>System Status</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: itStats.recentErrors > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '4px' }}>
                {itStats.recentErrors > 0 ? `${itStats.recentErrors} Errors` : 'Healthy'}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // ==========================================================================
  // RENDER: Navigation Items by Dashboard Type
  // ==========================================================================
  const renderNavItems = () => {
    const commonItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'projects', label: 'Projects', icon: FolderKanban },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare },
      { id: 'rfis', label: 'RFIs', icon: FileText },
      { id: 'submittals', label: 'Submittals', icon: ClipboardList }
    ];

    // VP gets additional nav items
    if (dashboardType === 'vp') {
      return [
        ...commonItems,
        { id: 'analytics', label: 'Analytics', icon: PieChart },
        { id: 'clients', label: 'Clients', icon: Briefcase }
      ];
    }

    return commonItems;
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
      width: '280px',
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
        padding: 'var(--space-lg)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Building2 size={28} style={{ color: 'var(--sunbelt-orange)' }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.125rem', color: 'var(--text-primary)' }}>Sunbelt PM</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Project Management</div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* DASHBOARD SELECTOR                                                */}
      {/* ================================================================== */}
      <div style={{ padding: 'var(--space-md) var(--space-lg)' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDashboardMenu(!showDashboardMenu)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: `${currentConfig.color}15`,
              border: `1px solid ${currentConfig.color}40`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: currentConfig.color,
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CurrentIcon size={18} />
              {currentConfig.label}
            </div>
            <ChevronDown size={16} style={{ 
              transform: showDashboardMenu ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 0.2s' 
            }} />
          </button>

          {showDashboardMenu && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 98 }} 
                onClick={() => setShowDashboardMenu(false)} 
              />
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
                zIndex: 99,
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
                        setCurrentView('dashboard');
                        setShowDashboardMenu(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        border: 'none',
                        background: isActive ? `${config.color}15` : 'transparent',
                        color: isActive ? config.color : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => !isActive && (e.target.style.background = 'var(--bg-tertiary)')}
                      onMouseLeave={(e) => !isActive && (e.target.style.background = 'transparent')}
                    >
                      <Icon size={16} style={{ color: config.color }} />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* STATS SECTION                                                     */}
      {/* ================================================================== */}
      <div style={{ padding: '0 var(--space-lg) var(--space-md)' }}>
        {renderStats()}
      </div>

      {/* ================================================================== */}
      {/* NAVIGATION                                                        */}
      {/* ================================================================== */}
      <nav style={{ flex: 1, padding: '0 var(--space-md)', overflowY: 'auto' }}>
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
                gap: 'var(--space-sm)',
                padding: '10px 14px',
                marginBottom: '2px',
                background: isActive ? 'var(--sunbelt-orange)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: isActive ? '600' : '400',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => !isActive && (e.target.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={(e) => !isActive && (e.target.style.background = 'transparent')}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ================================================================== */}
      {/* FOOTER                                                            */}
      {/* ================================================================== */}
      <div style={{
        padding: 'var(--space-md) var(--space-lg)',
        borderTop: '1px solid var(--border-color)'
      }}>
        {/* User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-md)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--sunbelt-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}>
            {currentUser?.name?.charAt(0) || 'U'}
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
              {currentUser?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {currentUser?.role || 'PM'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
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
            {darkMode ? 'Light' : 'Dark'}
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
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;