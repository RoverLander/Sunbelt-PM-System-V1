import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  FileText, 
  ClipboardList,
  LogOut,
  Building2,
  AlertCircle,
  Sun,
  Moon,
  Calendar
} from 'lucide-react';

function Sidebar({ currentView, setCurrentView }) {
  const { user, signOut } = useAuth();
  const [activeProjects, setActiveProjects] = useState(0);
  const [myTasks, setMyTasks] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      fetchStats(userId);
      fetchCurrentUser(userId);
    }
  }, [userId]);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const fetchCurrentUser = async (id) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchStats = async (id) => {
    try {
      // Count active projects
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("Completed","Cancelled","On Hold","Warranty")');
      
      setActiveProjects(projectCount || 0);

      // Fetch ALL tasks
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('*');

      if (allTasks) {
        // Filter tasks where user is assignee OR internal owner (and not completed/cancelled)
        const myTasksList = allTasks.filter(t => 
          (t.assignee_id === id || t.internal_owner_id === id) &&
          t.status !== 'Completed' && 
          t.status !== 'Cancelled'
        );
        
        setMyTasks(myTasksList.length);

        // Count overdue
        const today = new Date().toISOString().split('T')[0];
        const overdueCount = myTasksList.filter(t => t.due_date && t.due_date < today).length;
        setOverdueTasks(overdueCount);
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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

  const displayUser = currentUser || user;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'rfis', label: 'RFIs', icon: FileText },
    { id: 'submittals', label: 'Submittals', icon: ClipboardList },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
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

      {/* Stats Cards */}
      <div style={{ padding: '0 var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Active Projects */}
        <div style={{
          padding: 'var(--space-md)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <FolderKanban size={18} style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active Projects</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
            {activeProjects}
          </div>
        </div>

        {/* My Tasks */}
        <div style={{
          padding: 'var(--space-md)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <CheckSquare size={18} style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>My Tasks</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
            {myTasks}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div style={{
          padding: 'var(--space-md)',
          background: overdueTasks > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: overdueTasks > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <AlertCircle size={18} style={{ color: overdueTasks > 0 ? 'var(--danger)' : 'var(--sunbelt-orange)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: overdueTasks > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>Overdue Tasks</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: overdueTasks > 0 ? 'var(--danger)' : 'var(--text-primary)', marginTop: '4px' }}>
            {overdueTasks}
          </div>
        </div>
      </div>

      {/* Navigation */}
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
      <div style={{ flex: 1 }}></div>

      {/* Dark Mode Toggle */}
      <div style={{ padding: '0 var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <button
          onClick={toggleDarkMode}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.15s'
          }}
        >
          {darkMode ? (
            <>
              <Sun size={18} />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={18} />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* User Profile */}
      <div style={{ 
        padding: 'var(--space-md)', 
        borderTop: '1px solid var(--border-color)',
        marginTop: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
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
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
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
              borderRadius: '6px',
              transition: 'all 0.15s',
              flexShrink: 0
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;