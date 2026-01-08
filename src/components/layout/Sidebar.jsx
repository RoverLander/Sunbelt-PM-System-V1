// ============================================================================
// Sidebar Component - With PM/Director/VP/IT View Modes
// ============================================================================
// Shows different sidebar content based on user role and dashboard type:
// - PM View: My Projects, My Tasks, Overdue counts
// - Director View: Portfolio Health, At-Risk, Team stats
// - VP View: Executive KPIs, Portfolio Value
// - IT View: User management, System health, Audit stats              ← IT ADDED
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
  Shield,        // ← IT ADDED
  Server,        // ← IT ADDED
  Database       // ← IT ADDED
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

  // ← IT ADDED: IT View Stats
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
        } else if (userRole === 'it') {                              // ← IT ADDED
          setDashboardType('it');                                    // ← IT ADDED
          localStorage.setItem('dashboardType', 'it');               // ← IT ADDED
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
        // PMs cannot access IT/VP/Director dashboards                // ← IT ADDED
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
  // FETCH PM STATS - Uses owner_id for primary PM
  // ==========================================================================
  const fetchPMStats = async () => {
    if (!currentUser) return;

    try {
      // Fetch projects where user is primary PM or backup PM
      let projectsData = [];
      
      if (includeSecondary) {
        // Include both primary and backup PM projects
        const [primaryRes, secondaryRes] = await Promise.all([
          supabase.from('projects').select('id').eq('owner_id', currentUser.id).in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress']),
          supabase.from('projects').select('id').eq('backup_pm_id', currentUser.id).in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'])
        ]);
        
        const allProjects = [...(primaryRes.data || []), ...(secondaryRes.data || [])];
        const uniqueProjects = allProjects.filter((project, index, self) =>
          index === self.findIndex(p => p.id === project.id)
        );
        projectsData = uniqueProjects;
      } else {
        // Only primary PM projects
        const { data } = await supabase
          .from('projects')
          .select('id')
          .eq('owner_id', currentUser.id)
          .in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress']);
        projectsData = data || [];
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
        supabase.from('users').select('id').in('role', ['PM', 'Project Manager', 'Director', 'Admin']).eq('is_active', true)
      ]);

      const tasks = tasksResult.data || [];
      const rfis = rfisResult.data || [];
      const submittals = submittalsResult.data || [];

      let onTrack = 0;
      let atRisk = 0;
      let critical = 0;
      let totalOverdue = 0;

      (projects || []).forEach(project => {
        const projectTasks = tasks.filter(t => t.project_id === project.id);
        const projectRFIs = rfis.filter(r => r.project_id === project.id);
        const projectSubmittals = submittals.filter(s => s.project_id === project.id);

        const overdueTasks = projectTasks.filter(t => 
          t.due_date && t.due_date < today && !['Completed', 'Cancelled'].includes(t.status)
        ).length;
        const overdueRFIs = projectRFIs.filter(r => 
          r.due_date && r.due_date < today && !['Answered', 'Closed'].includes(r.status)
        ).length;
        const overdueSubmittals = projectSubmittals.filter(s => 
          s.due_date && s.due_date < today && ['Pending', 'Submitted', 'Under Review'].includes(s.status)
        ).length;

        const projectOverdue = overdueTasks + overdueRFIs + overdueSubmittals;
        totalOverdue += projectOverdue;

        const daysToDelivery = project.delivery_date 
          ? Math.ceil((new Date(project.delivery_date) - new Date()) / (1000 * 60 * 60 * 24))
          : 999;

        if (projectOverdue >= 3 || daysToDelivery <= 3) {
          critical++;
        } else if (projectOverdue > 0 || daysToDelivery <= 7) {
          atRisk++;
        } else {
          onTrack++;
        }
      });

      setDirectorStats({
        totalProjects: (projects || []).length,
        onTrack,
        atRisk,
        critical,
        totalOverdue,
        teamMembers: (usersResult.data || []).length
      });

    } catch (error) {
      console.error('Error fetching director stats:', error);
    }
  };

  // ==========================================================================
  // FETCH VP STATS
  // ==========================================================================
  const fetchVPStats = async () => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status, contract_value, client_name, delivery_date, actual_completion_date');

      const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
      const activeProjects = (projects || []).filter(p => activeStatuses.includes(p.status));
      const completedProjects = (projects || []).filter(p => p.status === 'Completed');

      const portfolioValue = (projects || []).reduce((sum, p) => sum + (p.contract_value || 0), 0);
      const clients = [...new Set((projects || []).map(p => p.client_name).filter(Boolean))];

      // Calculate on-time rate
      const projectsWithDelivery = completedProjects.filter(p => p.delivery_date && p.actual_completion_date);
      const onTimeDeliveries = projectsWithDelivery.filter(p => 
        new Date(p.actual_completion_date) <= new Date(p.delivery_date)
      );
      const onTimeRate = projectsWithDelivery.length > 0 
        ? Math.round((onTimeDeliveries.length / projectsWithDelivery.length) * 100)
        : 100;

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
  // ← IT ADDED: FETCH IT STATS
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

  const handleDashboardSwitch = (type) => {
    if (setDashboardType) {
      setDashboardType(type);
      localStorage.setItem('dashboardType', type);
    }
    setShowDashboardMenu(false);
    if (setCurrentView) setCurrentView('dashboard');
  };

  // ==========================================================================
  // DERIVED VALUES - ROLE PERMISSIONS
  // ==========================================================================
  const displayUser = currentUser || user;
  const userRole = (currentUser?.role || '').toLowerCase();
  
  // Role checks
  const isVP = userRole === 'vp';
  const isDirector = userRole === 'director';
  const isAdmin = userRole === 'admin';
  const isIT = userRole === 'it';                                    // ← IT ADDED
  
  // Who can switch dashboards
  const canSwitchDashboard = isVP || isDirector || isAdmin || isIT;  // ← IT ADDED: isIT
  
  // Access permissions
  const canAccessVP = isVP || isAdmin;                               // ← UPDATED: Admin can access VP
  const canAccessIT = isIT || isAdmin;                               // ← IT ADDED

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // ==========================================================================
  // NAV ITEMS FOR EACH VIEW
  // ==========================================================================
  const pmNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'rfis', label: 'RFIs', icon: FileText },
    { id: 'submittals', label: 'Submittals', icon: ClipboardList },
  ];

  const directorNavItems = [
    { id: 'dashboard', label: 'Portfolio', icon: BarChart3 },
    { id: 'projects', label: 'All Projects', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'rfis', label: 'RFIs', icon: FileText },
    { id: 'submittals', label: 'Submittals', icon: ClipboardList },
    { id: 'team', label: 'Team', icon: Users },
  ];

  const vpNavItems = [
    { id: 'dashboard', label: 'Executive', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'clients', label: 'Clients', icon: Briefcase },
    { id: 'projects', label: 'All Projects', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  // ← IT ADDED: IT Nav Items
  const itNavItems = [
    { id: 'dashboard', label: 'IT Dashboard', icon: Shield },
    { id: 'projects', label: 'All Projects', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'rfis', label: 'RFIs', icon: FileText },
    { id: 'submittals', label: 'Submittals', icon: ClipboardList },
  ];

  // Select nav items based on dashboard type
  const navItems = dashboardType === 'vp' 
    ? vpNavItems 
    : dashboardType === 'director' 
      ? directorNavItems 
      : dashboardType === 'it'                                       // ← IT ADDED
        ? itNavItems                                                 // ← IT ADDED
        : pmNavItems;

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <aside className="sidebar">
      {/* ================================================================== */}
      {/* LOGO                                                              */}
      {/* ================================================================== */}
      <div className="sidebar-logo">
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          flexShrink: 0
        }}>
          <Building2 size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Sunbelt PM
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            Project Management
          </p>
        </div>
      </div>

      {/* ================================================================== */}
      {/* DASHBOARD SWITCHER - Role-based access                            */}
      {/* ================================================================== */}
      {canSwitchDashboard && (
        <div style={{ padding: '8px 16px', marginBottom: '8px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDashboardMenu(!showDashboardMenu)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: dashboardType === 'vp' 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))'
                  : dashboardType === 'it'                           // ← IT ADDED
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))'
                    : dashboardType === 'director' 
                      ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 107, 53, 0.05))'
                      : 'var(--bg-tertiary)',
                border: dashboardType === 'vp' 
                  ? '1px solid #8b5cf6' 
                  : dashboardType === 'it'                           // ← IT ADDED
                    ? '1px solid #06b6d4'                            // ← IT ADDED (cyan)
                    : dashboardType === 'director' 
                      ? '1px solid var(--sunbelt-orange)' 
                      : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {dashboardType === 'vp' ? (
                  <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
                ) : dashboardType === 'it' ? (                       // ← IT ADDED
                  <Shield size={18} style={{ color: '#06b6d4' }} />  // ← IT ADDED
                ) : dashboardType === 'director' ? (
                  <BarChart3 size={18} style={{ color: 'var(--sunbelt-orange)' }} />
                ) : (
                  <LayoutDashboard size={18} style={{ color: 'var(--text-secondary)' }} />
                )}
                <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {dashboardType === 'vp' ? 'VP View' 
                    : dashboardType === 'it' ? 'IT View'             // ← IT ADDED
                    : dashboardType === 'director' ? 'Director View' 
                    : 'PM View'}
                </span>
              </div>
              <ChevronDown 
                size={16} 
                style={{ 
                  color: 'var(--text-tertiary)',
                  transform: showDashboardMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </button>

            {/* ============================================================ */}
            {/* DASHBOARD DROPDOWN MENU                                      */}
            {/* ============================================================ */}
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
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 100,
                overflow: 'hidden'
              }}>
                {/* VP Option - Only shown if canAccessVP */}
                {canAccessVP && (
                  <button
                    onClick={() => handleDashboardSwitch('vp')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: dashboardType === 'vp' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: dashboardType === 'vp' ? '#8b5cf6' : 'var(--text-primary)',
                      fontSize: '0.875rem',
                      textAlign: 'left'
                    }}
                  >
                    <TrendingUp size={18} />
                    <div>
                      <div style={{ fontWeight: '600' }}>VP View</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Executive overview</div>
                    </div>
                  </button>
                )}

                {/* ← IT ADDED: IT Option - Only shown if canAccessIT */}
                {canAccessIT && (
                  <button
                    onClick={() => handleDashboardSwitch('it')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: dashboardType === 'it' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: dashboardType === 'it' ? '#06b6d4' : 'var(--text-primary)',
                      fontSize: '0.875rem',
                      textAlign: 'left'
                    }}
                  >
                    <Shield size={18} />
                    <div>
                      <div style={{ fontWeight: '600' }}>IT View</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>System administration</div>
                    </div>
                  </button>
                )}
                
                {/* Director Option - Shown to Directors, Admins, VPs, and IT */}
                <button
                  onClick={() => handleDashboardSwitch('director')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: dashboardType === 'director' ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: dashboardType === 'director' ? 'var(--sunbelt-orange)' : 'var(--text-primary)',
                    fontSize: '0.875rem',
                    textAlign: 'left'
                  }}
                >
                  <BarChart3 size={18} />
                  <div>
                    <div style={{ fontWeight: '600' }}>Director View</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Portfolio & team oversight</div>
                  </div>
                </button>
                
                {/* PM Option - Shown to all */}
                <button
                  onClick={() => handleDashboardSwitch('pm')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: dashboardType === 'pm' ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: dashboardType === 'pm' ? 'var(--sunbelt-orange)' : 'var(--text-primary)',
                    fontSize: '0.875rem',
                    textAlign: 'left'
                  }}
                >
                  <LayoutDashboard size={18} />
                  <div>
                    <div style={{ fontWeight: '600' }}>PM View</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>My projects & tasks</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* STATS - DIFFERENT FOR EACH VIEW                                   */}
      {/* ================================================================== */}
      <div style={{ padding: '0 16px', marginBottom: '12px' }}>
        
        {/* ===== VP VIEW STATS ===== */}
        {dashboardType === 'vp' ? (
          <>
            {/* Portfolio Value */}
            <div style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', opacity: 0.9 }}>
                <DollarSign size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Portfolio Value</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {formatCurrency(vpStats.portfolioValue)}
              </div>
            </div>

            {/* KPIs Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div style={{
                padding: '12px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>{vpStats.activeProjects}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active</div>
              </div>
              <div style={{
                padding: '12px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: vpStats.onTimeRate >= 90 ? '#22c55e' : '#f59e0b' }}>{vpStats.onTimeRate}%</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>On-Time</div>
              </div>
            </div>

            {/* Clients */}
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginTop: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Clients</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                {vpStats.totalClients}
              </div>
            </div>
          </>

        /* ===== IT VIEW STATS ===== */                              
        ) : dashboardType === 'it' ? (                               // ← IT ADDED: Entire block
          <>
            {/* System Status */}
            <div style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', opacity: 0.9 }}>
                <Server size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>System Status</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                All Systems Operational
              </div>
            </div>

            {/* Users Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div style={{
                padding: '12px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <Users size={16} style={{ color: '#06b6d4', marginBottom: '4px' }} />
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>{itStats.totalUsers}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Users</div>
              </div>
              <div style={{
                padding: '12px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <Database size={16} style={{ color: '#06b6d4', marginBottom: '4px' }} />
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>{itStats.totalProjects}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Projects</div>
              </div>
            </div>

            {/* Active Users */}
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginTop: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} style={{ color: '#22c55e' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Active Users</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22c55e', marginTop: '4px' }}>
                {itStats.activeUsers}
              </div>
            </div>
          </>

        ) : dashboardType === 'director' ? (
          /* ===== DIRECTOR VIEW STATS ===== */
          <>
            {/* Portfolio Health */}
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Activity size={16} style={{ color: 'var(--sunbelt-orange)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Portfolio Health</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22c55e' }}>{directorStats.onTrack}</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>On Track</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b' }}>{directorStats.atRisk}</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>At Risk</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444' }}>{directorStats.critical}</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Critical</div>
                </div>
              </div>
            </div>

            {/* Total Overdue */}
            <div style={{
              padding: '12px 14px',
              background: directorStats.totalOverdue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              border: directorStats.totalOverdue > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} style={{ color: directorStats.totalOverdue > 0 ? 'var(--danger)' : 'var(--text-tertiary)' }} />
                <span style={{ fontSize: '0.8125rem', color: directorStats.totalOverdue > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>Total Overdue Items</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: '700', color: directorStats.totalOverdue > 0 ? 'var(--danger)' : 'var(--text-primary)', marginTop: '4px' }}>
                {directorStats.totalOverdue}
              </div>
            </div>

            {/* Team & Projects */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                flex: 1,
                padding: '12px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <FolderKanban size={16} style={{ color: 'var(--sunbelt-orange)', marginBottom: '4px' }} />
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>{directorStats.totalProjects}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Projects</div>
              </div>
              <div style={{
                flex: 1,
                padding: '12px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <Users size={16} style={{ color: 'var(--sunbelt-orange)', marginBottom: '4px' }} />
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>{directorStats.teamMembers}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Team</div>
              </div>
            </div>
          </>
        ) : (
          /* ===== PM VIEW STATS ===== */
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
        )}
      </div>

      {/* ================================================================== */}
      {/* NAVIGATION                                                        */}
      {/* ================================================================== */}
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView && setCurrentView(item.id)}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              style={{
                width: '100%',
                textAlign: 'left',
                background: isActive ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* ================================================================== */}
      {/* DARK MODE TOGGLE                                                  */}
      {/* ================================================================== */}
      <div style={{ padding: '0 16px', marginBottom: '12px' }}>
        <button
          onClick={toggleDarkMode}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* ================================================================== */}
      {/* USER PROFILE                                                      */}
      {/* ================================================================== */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: dashboardType === 'vp' 
              ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
              : dashboardType === 'it'                               // ← IT ADDED
                ? 'linear-gradient(135deg, #06b6d4, #0891b2)'        // ← IT ADDED
                : 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.875rem',
            flexShrink: 0
          }}>
            {displayUser?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayUser?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {displayUser?.role || 'Team Member'}
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', display: 'flex', borderRadius: '6px' }} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDashboardMenu && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }} onClick={() => setShowDashboardMenu(false)} />
      )}
    </aside>
  );
}

export default Sidebar;