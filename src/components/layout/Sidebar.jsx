// ============================================================================
// Sidebar Component - With PM/Director/VP View Modes
// ============================================================================
// Shows different sidebar content based on user role and dashboard type:
// - PM View: My Projects, My Tasks, Overdue counts
// - Director View: Portfolio Health, At-Risk, Team stats
// - VP View: Executive KPIs, Portfolio Value (LOCKED - no switching)
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
  Crown,
  Shield
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

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // ===== FORCE VP USERS TO VP DASHBOARD =====
  useEffect(() => {
    if (currentUser) {
      const role = (currentUser.role || '').toLowerCase();
      
      // VP users are LOCKED to VP dashboard - force it if not set
      if (role === 'vp' && dashboardType !== 'vp') {
        if (setDashboardType) {
          setDashboardType('vp');
          localStorage.setItem('dashboardType', 'vp');
        }
      }
    }
  }, [currentUser, dashboardType, setDashboardType]);

  useEffect(() => {
    if (currentUser) {
      if (dashboardType === 'vp') {
        fetchVPStats();
      } else if (dashboardType === 'director') {
        fetchDirectorStats();
      } else {
        fetchPMStats();
      }
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
        
        // ===== SET DEFAULT DASHBOARD BASED ON ROLE =====
        const role = (userData.role || '').toLowerCase();
        const savedDashboard = localStorage.getItem('dashboardType');
        
        if (role === 'vp') {
          // VP is ALWAYS locked to VP dashboard
          if (setDashboardType) {
            setDashboardType('vp');
            localStorage.setItem('dashboardType', 'vp');
          }
        } else if (role === 'director' || role === 'admin') {
          // Directors/Admins default to director view but can switch
          if (!savedDashboard && setDashboardType) {
            setDashboardType('director');
            localStorage.setItem('dashboardType', 'director');
          }
        }
        // PMs stay on PM dashboard (default)
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // ==========================================================================
  // FETCH PM STATS
  // ==========================================================================
  const fetchPMStats = async () => {
    if (!currentUser) return;

    try {
      // Include projects where user is: PM, Secondary PM, or Creator
      let projectQuery = supabase
        .from('projects')
        .select('id')
        .in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress']);

      if (includeSecondary) {
        projectQuery = projectQuery.or(`pm_id.eq.${currentUser.id},secondary_pm_id.eq.${currentUser.id},created_by.eq.${currentUser.id}`);
      } else {
        projectQuery = projectQuery.or(`pm_id.eq.${currentUser.id},created_by.eq.${currentUser.id}`);
      }

      const { data: projects } = await projectQuery;
      const projectIds = (projects || []).map(p => p.id);
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
        supabase.from('users').select('id').in('role', ['Project Manager', 'PM', 'Director', 'Admin']).eq('is_active', true)
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
  // DERIVED VALUES
  // ==========================================================================
  const displayUser = currentUser || user;
  const userRole = (currentUser?.role || '').toLowerCase();
  
  // ===== KEY FIX: VP CANNOT SWITCH DASHBOARDS =====
  // Only Director and Admin can switch views - VP is locked to VP dashboard
  const canSwitchDashboard = currentUser && (userRole === 'director' || userRole === 'admin');
  const isVP = userRole === 'vp';

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // Different nav items for different views
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
    { id: 'team', label: 'Team', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'rfis', label: 'RFIs', icon: FileText },
    { id: 'submittals', label: 'Submittals', icon: ClipboardList },
  ];

  const vpNavItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'clients', label: 'Client Accounts', icon: Briefcase },
    { id: 'team', label: 'Team Overview', icon: Users },
    { id: 'projects', label: 'All Projects', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  const navItems = dashboardType === 'vp' 
    ? vpNavItems 
    : dashboardType === 'director' 
      ? directorNavItems 
      : pmNavItems;

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-logo">
        <div style={{
          width: '40px',
          height: '40px',
          background: isVP 
            ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
            : 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          flexShrink: 0,
          boxShadow: isVP 
            ? '0 2px 8px rgba(139, 92, 246, 0.3)'
            : '0 2px 8px rgba(255, 107, 53, 0.3)'
        }}>
          <Building2 size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Sunbelt PM
          </h1>
          <p style={{ fontSize: '0.75rem', color: isVP ? '#8b5cf6' : 'var(--text-secondary)', margin: 0, fontWeight: isVP ? '600' : '400' }}>
            {isVP ? 'Executive Portal' : 'Project Management'}
          </p>
        </div>
      </div>

      {/* ===== VP ROLE BADGE (shown instead of switcher for VP) ===== */}
      {isVP && (
        <div style={{ padding: '8px 16px', marginBottom: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Crown size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#8b5cf6' }}>
                Vice President
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                Executive Access
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD SWITCHER - Only for Director/Admin (NOT VP) */}
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
                  : dashboardType === 'director' 
                    ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 107, 53, 0.05))'
                    : 'var(--bg-tertiary)',
                border: dashboardType === 'vp' 
                  ? '1px solid #8b5cf6' 
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
                ) : dashboardType === 'director' ? (
                  <BarChart3 size={18} style={{ color: 'var(--sunbelt-orange)' }} />
                ) : (
                  <LayoutDashboard size={18} style={{ color: 'var(--text-secondary)' }} />
                )}
                <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {dashboardType === 'vp' ? 'VP View' : dashboardType === 'director' ? 'Director View' : 'PM View'}
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
                {/* VP Option - only for Admin */}
                {userRole === 'admin' && (
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
                {/* Director Option */}
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
                {/* PM Option */}
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
            {/* Portfolio Value - Enhanced for VP */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '10px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.9 }}>
                <DollarSign size={18} />
                <span style={{ fontSize: '0.8125rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Portfolio Value</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                {formatCurrency(vpStats.portfolioValue)}
              </div>
            </div>

            {/* KPIs Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                padding: '14px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)' }}>{vpStats.activeProjects}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Projects</div>
              </div>
              <div style={{
                padding: '14px 12px',
                background: vpStats.onTimeRate >= 90 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${vpStats.onTimeRate >= 90 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.375rem', fontWeight: '700', color: vpStats.onTimeRate >= 90 ? '#22c55e' : '#f59e0b' }}>{vpStats.onTimeRate}%</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>On-Time Rate</div>
              </div>
            </div>

            {/* Clients */}
            <div style={{
              padding: '14px 16px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Briefcase size={18} style={{ color: '#8b5cf6' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active Clients</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {vpStats.totalClients}
                </div>
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

      {/* NAVIGATION */}
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
                background: isActive 
                  ? isVP 
                    ? 'rgba(139, 92, 246, 0.1)' 
                    : 'rgba(255, 107, 53, 0.1)' 
                  : 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderLeft: isActive 
                  ? `3px solid ${isVP ? '#8b5cf6' : 'var(--sunbelt-orange)'}` 
                  : '3px solid transparent'
              }}
            >
              <Icon size={20} style={{ color: isActive && isVP ? '#8b5cf6' : undefined }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* DARK MODE TOGGLE */}
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

      {/* USER PROFILE */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: isVP 
              ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
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
            <div style={{ fontSize: '0.75rem', color: isVP ? '#8b5cf6' : 'var(--text-secondary)', fontWeight: isVP ? '600' : '400' }}>
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