// ============================================================================
// Sidebar Component - Fixed Version
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
  ToggleRight
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
  const [activeProjects, setActiveProjects] = useState(0);
  const [myTasks, setMyTasks] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);
  
  const [includeSecondary, setIncludeSecondary] = useState(() => {
    const saved = localStorage.getItem('includeSecondaryInCounts');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser, includeSecondary]);

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

      if (error) {
        console.error('Error fetching user:', error);
        return;
      }

      if (userData) {
        console.log('Sidebar: User loaded -', userData.name, 'Role:', userData.role);
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // ==========================================================================
  // FETCH STATS
  // ==========================================================================
  const fetchStats = async () => {
    if (!currentUser) return;

    try {
      // Get user's projects
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'])
        .or(`pm_id.eq.${currentUser.id},secondary_pm_id.eq.${currentUser.id}`);

      if (projectError) {
        console.error('Error fetching projects:', projectError);
        return;
      }

      // Filter based on toggle
      let filteredProjects = projects || [];
      if (!includeSecondary) {
        // Re-fetch only primary projects
        const { data: primaryOnly } = await supabase
          .from('projects')
          .select('id')
          .in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'])
          .eq('pm_id', currentUser.id);
        filteredProjects = primaryOnly || [];
      }

      const projectIds = filteredProjects.map(p => p.id);
      setActiveProjects(projectIds.length);

      if (projectIds.length === 0) {
        setMyTasks(0);
        setOverdueTasks(0);
        return;
      }

      // Get tasks for user's projects
      const { data: tasksList } = await supabase
        .from('tasks')
        .select('id, status, due_date, assignee_id, internal_owner_id, project_id')
        .in('project_id', projectIds)
        .in('status', ['Not Started', 'In Progress', 'Blocked']);

      const myTasksList = (tasksList || []).filter(t => 
        t.assignee_id === currentUser.id || t.internal_owner_id === currentUser.id
      );

      setMyTasks(myTasksList.length);

      const today = new Date().toISOString().split('T')[0];
      const overdueCount = myTasksList.filter(t => t.due_date && t.due_date < today).length;
      setOverdueTasks(overdueCount);

    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

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
    if (setCurrentView) {
      setCurrentView('dashboard');
    }
  };

  // ==========================================================================
  // DERIVED VALUES
  // ==========================================================================
  const displayUser = currentUser || user;
  
  // Check if user can switch dashboards (Director or Admin)
  const userRole = (currentUser?.role || '').toLowerCase();
  const canSwitchDashboard = currentUser && (userRole === 'director' || userRole === 'admin');

  console.log('Sidebar: canSwitchDashboard =', canSwitchDashboard, 'role =', currentUser?.role);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (dashboardType === 'director') ? BarChart3 : LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'rfis', label: 'RFIs', icon: FileText },
    { id: 'submittals', label: 'Submittals', icon: ClipboardList },
  ];

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

      {/* DASHBOARD SWITCHER - Only for Directors/Admins */}
      {canSwitchDashboard && (
        <div style={{ padding: 'var(--space-sm) var(--space-md)', marginBottom: 'var(--space-sm)' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDashboardMenu(!showDashboardMenu)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: dashboardType === 'director' 
                  ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 107, 53, 0.05))'
                  : 'var(--bg-tertiary)',
                border: dashboardType === 'director' ? '1px solid var(--sunbelt-orange)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {dashboardType === 'director' ? (
                  <BarChart3 size={18} style={{ color: 'var(--sunbelt-orange)' }} />
                ) : (
                  <LayoutDashboard size={18} style={{ color: 'var(--text-secondary)' }} />
                )}
                <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {dashboardType === 'director' ? 'Director View' : 'PM View'}
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
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 100,
                overflow: 'hidden'
              }}>
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      Portfolio overview
                    </div>
                  </div>
                </button>
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      My projects
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATS CARDS */}
      <div style={{ padding: '0 var(--space-md)', marginBottom: 'var(--space-md)' }}>
        {/* Active Projects */}
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={16} style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>My Projects</span>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
            {activeProjects}
          </div>
        </div>

        {/* My Tasks */}
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={16} style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>My Tasks</span>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
            {myTasks}
          </div>
        </div>

        {/* Overdue */}
        <div style={{
          padding: '12px 14px',
          background: overdueTasks > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '8px',
          border: overdueTasks > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ color: overdueTasks > 0 ? 'var(--danger)' : 'var(--sunbelt-orange)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', color: overdueTasks > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>Overdue</span>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: '700', color: overdueTasks > 0 ? 'var(--danger)' : 'var(--text-primary)', marginTop: '4px' }}>
            {overdueTasks}
          </div>
        </div>

        {/* Secondary Toggle */}
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

      {/* DARK MODE TOGGLE */}
      <div style={{ padding: '0 var(--space-md)', marginBottom: 'var(--space-md)' }}>
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
      <div style={{ 
        padding: 'var(--space-md)', 
        borderTop: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
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
            <div style={{ 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {displayUser?.name || 'User'}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)'
            }}>
              {displayUser?.role || 'Team Member'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              borderRadius: '6px'
            }}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDashboardMenu && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50
          }}
          onClick={() => setShowDashboardMenu(false)}
        />
      )}
    </aside>
  );
}

export default Sidebar;