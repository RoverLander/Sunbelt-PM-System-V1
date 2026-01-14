// ============================================================================
// App.jsx - Main Application with PM/Director/VP/IT/PC Routing
// ============================================================================
// Routes all sidebar navigation to appropriate pages based on view mode.
// Includes deep navigation from Tasks/RFIs/Submittals pages to ProjectDetails.
//
// FIXES (Jan 9, 2026):
// - ✅ FIXED: VP now has 'reports' route
// - ✅ FIXED: IT now has 'users' route for User Management
// - ✅ FIXED: Main content margin-left matches 260px sidebar width
// - ✅ ADDED: PC (Project Coordinator) dashboard routing
// - ✅ ADDED: Workflow tab navigation support
// ============================================================================

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';

// Dashboards
import PMDashboard from './components/dashboards/PMDashboard';
import DirectorDashboard from './components/dashboards/DirectorDashboard';
import VPDashboard from './components/dashboards/VPDashboard';
import PCDashboard from './components/dashboards/PCDashboard';
import { ITDashboard, UserManagement, ErrorTracking, AnnouncementManager, FeatureFlagManager, SessionManager, SecurityCenter, DatabaseTools, SystemConfiguration } from './components/it';
import AnnouncementBanner from './components/common/AnnouncementBanner';

// Pages
import CalendarPage from './components/calendar/CalendarPage';
import ProjectsPage from './components/pages/ProjectsPage';
import TasksPage from './components/pages/TasksPage';
import RFIsPage from './components/pages/RFIsPage';
import SubmittalsPage from './components/pages/SubmittalsPage';
import TeamPage from './components/pages/TeamPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import ClientsPage from './components/pages/ClientsPage';
import DirectoryPage from './components/pages/DirectoryPage';
import FactoryMapPage from './pages/FactoryMapPage';
import FactoryMapFullscreen from './pages/FactoryMapFullscreen';

// Project Details
import ProjectDetails from './components/projects/ProjectDetails';

// Reports
import { ExecutiveReports } from './components/reports';

// Sales
import { SalesDashboard, SalesManagerDashboard, SalesRepDashboard, SalesTeamPage } from './components/sales';

import { supabase } from './utils/supabaseClient';
import './App.css';

// ExecutiveReports is now imported from ./components/reports

// ============================================================================
// APP CONTENT
// ============================================================================
function AppContent() {
  const { user, loading } = useAuth();
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [currentView, setCurrentView] = useState('dashboard');
  const [dashboardType, setDashboardType] = useState(() => {
    return localStorage.getItem('dashboardType') || 'pm';
  });
  const [userRole, setUserRole] = useState(null);

  // Project navigation state
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectTab, setSelectedProjectTab] = useState('overview');
  const [loadingProject, setLoadingProject] = useState(false);

  // Global filter state (synced with sidebar toggle)
  const [includeBackupProjects, setIncludeBackupProjects] = useState(() => {
    const saved = localStorage.getItem('includeSecondaryInCounts');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [initialPageFilter, setInitialPageFilter] = useState(null); // 'overdue', 'open', etc.

  // Sidebar collapsed state (synced with sidebar via localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Listen for sidebar collapse changes via storage event
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'sidebarCollapsed') {
        setSidebarCollapsed(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also poll localStorage for changes within same tab
    const interval = setInterval(() => {
      const saved = localStorage.getItem('sidebarCollapsed');
      const current = saved !== null ? JSON.parse(saved) : false;
      if (current !== sidebarCollapsed) {
        setSidebarCollapsed(current);
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [sidebarCollapsed]);

  // ==========================================================================
  // CHECK USER ROLE ON LOAD
  // ==========================================================================
  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

  const checkUserRole = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!error && userData) {
        const role = userData.role?.toLowerCase();
        setUserRole(role);

        // Force VP to VP dashboard
        if (role === 'vp') {
          setDashboardType('vp');
          localStorage.setItem('dashboardType', 'vp');
        }
        // Force Director/Admin to director dashboard by default
        else if (role === 'director' || role === 'admin') {
          const storedType = localStorage.getItem('dashboardType');
          // Directors can switch between director/pm, but default to director
          if (!storedType || storedType === 'vp' || storedType === 'it') {
            setDashboardType('director');
            localStorage.setItem('dashboardType', 'director');
          }
        }
        // Force IT and IT_Manager to IT dashboard
        else if (role === 'it' || role === 'it_manager') {
          setDashboardType('it');
          localStorage.setItem('dashboardType', 'it');
        }
        // PM users default to pm dashboard
        else if (role === 'pm' || role === 'project manager' || role === 'project_manager') {
          const storedType = localStorage.getItem('dashboardType');
          // PMs can only access pm dashboard
          if (storedType !== 'pm') {
            setDashboardType('pm');
            localStorage.setItem('dashboardType', 'pm');
          }
        }
        // PC (Project Coordinator) users
        else if (role === 'pc' || role === 'project coordinator') {
          setDashboardType('pc');
          localStorage.setItem('dashboardType', 'pc');
        }
        // Sales Manager users
        else if (role === 'sales_manager') {
          setDashboardType('sales_manager');
          localStorage.setItem('dashboardType', 'sales_manager');
        }
        // Sales Rep users
        else if (role === 'sales_rep') {
          setDashboardType('sales_rep');
          localStorage.setItem('dashboardType', 'sales_rep');
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  // ==========================================================================
  // SAVE DASHBOARD TYPE CHANGES
  // ==========================================================================
  useEffect(() => {
    localStorage.setItem('dashboardType', dashboardType);
  }, [dashboardType]);

  // ==========================================================================
  // FETCH PROJECT WHEN ID CHANGES
  // ==========================================================================
  useEffect(() => {
    if (selectedProjectId) {
      fetchProject(selectedProjectId);
    } else {
      setSelectedProject(null);
    }
  }, [selectedProjectId]);

  const fetchProject = async (projectId) => {
    setLoadingProject(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setSelectedProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      setSelectedProject(null);
    } finally {
      setLoadingProject(false);
    }
  };

  // ==========================================================================
  // NAVIGATION HANDLERS
  // ==========================================================================
  
  // Navigate to a specific project (optionally with a specific tab)
  // Tab names: 'Overview', 'Tasks', 'RFIs', 'Submittals', 'Calendar', 'Files'
  const handleNavigateToProject = (projectId, tab = 'Overview') => {
    // Map lowercase tab names to proper case for ProjectDetails
    const tabMap = {
      'overview': 'overview',
      'tasks': 'tasks',
      'rfis': 'rfis',
      'submittals': 'submittals',
      'calendar': 'calendar',
      'files': 'files',
      'floorplan': 'floorplan',
      'workflow': 'workflow',
      'log': 'log'
    };
    
    setSelectedProjectId(projectId);
    setSelectedProjectTab(tabMap[tab.toLowerCase()] || 'overview');
    setCurrentView('project-detail');
  };

  // Go back to the appropriate projects view
  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setSelectedProject(null);
    setSelectedProjectTab('overview');
    setCurrentView('projects');
  };

  // Update project in state after edit
  const handleProjectUpdate = (updatedProject) => {
    setSelectedProject(updatedProject);
  };

  // Handle view changes from sidebar - reset project selection
  const handleSetCurrentView = (view) => {
    if (view !== 'project-detail') {
      setSelectedProjectId(null);
      setSelectedProject(null);
    }
    setInitialPageFilter(null); // Reset filter when manually navigating
    setCurrentView(view);
  };

  // Handle toggling backup projects (synced between sidebar and pages)
  const handleToggleBackupProjects = (value) => {
    setIncludeBackupProjects(value);
    localStorage.setItem('includeSecondaryInCounts', JSON.stringify(value));
  };

  // Handle sidebar stat clicks - navigate to page with filter
  const handleSidebarStatClick = (page, filter) => {
    setInitialPageFilter(filter);
    setSelectedProjectId(null);
    setSelectedProject(null);
    setCurrentView(page);
  };

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // ==========================================================================
  // LOGIN SCREEN
  // ==========================================================================
  if (!user) {
    return <Login />;
  }

  // ==========================================================================
  // RENDER CONTENT BASED ON VIEW AND DASHBOARD TYPE
  // ==========================================================================
  const renderContent = () => {
    // Project Detail View (accessible from any dashboard type)
    if (currentView === 'project-detail' && selectedProjectId) {
      // Show loading while fetching project
      if (loadingProject || !selectedProject) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Loading project...</p>
          </div>
        );
      }
      
      return (
        <ProjectDetails 
          project={selectedProject}
          initialTab={selectedProjectTab}
          onBack={handleBackToProjects}
          onUpdate={handleProjectUpdate}
        />
      );
    }

    // Common pages (same for all views)
    if (currentView === 'calendar') {
      return <CalendarPage onNavigateToProject={handleNavigateToProject} />;
    }

    if (currentView === 'directory') {
      return <DirectoryPage />;
    }

    if (currentView === 'factory-map') {
      return (
        <FactoryMapPage
          onNavigateToProject={handleNavigateToProject}
          onOpenFullscreen={() => setCurrentView('factory-map-fullscreen')}
        />
      );
    }

    // ========================================================================
    // VP-specific views
    // ========================================================================
    if (dashboardType === 'vp') {
      switch (currentView) {
        case 'dashboard':
          return <VPDashboard onNavigateToProject={handleNavigateToProject} />;
        case 'analytics':
          return <AnalyticsPage />;
        case 'clients':
          return <ClientsPage onNavigateToProject={handleNavigateToProject} />;
        case 'team':
          return <TeamPage onNavigateToProject={handleNavigateToProject} />;
        case 'reports':
          return <ExecutiveReports />;
        case 'projects':
          return <ProjectsPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'tasks':
          return <TasksPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'rfis':
          return <RFIsPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'submittals':
          return <SubmittalsPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        default:
          return <VPDashboard onNavigateToProject={handleNavigateToProject} />;
      }
    }

    // ========================================================================
    // Director-specific views
    // ========================================================================
    if (dashboardType === 'director') {
      switch (currentView) {
        case 'dashboard':
          return <DirectorDashboard onNavigateToProject={handleNavigateToProject} />;
        case 'team':
          return <TeamPage onNavigateToProject={handleNavigateToProject} />;
        case 'reports':
          return <ExecutiveReports />;
        case 'projects':
          return <ProjectsPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'tasks':
          return <TasksPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'rfis':
          return <RFIsPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'submittals':
          return <SubmittalsPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        default:
          return <DirectorDashboard onNavigateToProject={handleNavigateToProject} />;
      }
    }

    // ========================================================================
    // IT-specific views
    // ========================================================================
    if (dashboardType === 'it') {
      switch (currentView) {
        case 'dashboard':
          return <ITDashboard />;
        case 'users':
          return <UserManagement />;
        case 'error-tracking':
          return <ErrorTracking />;
        case 'security':
          return <SecurityCenter />;
        case 'database':
          return <DatabaseTools />;
        case 'settings':
          return <SystemConfiguration />;
        case 'announcements':
          return <AnnouncementManager />;
        case 'feature-flags':
          return <FeatureFlagManager />;
        case 'sessions':
          return <SessionManager />;
        // Note: IT users don't have access to Projects, Tasks, RFIs, Submittals
        // They manage the system, not construction projects
        default:
          return <ITDashboard />;
      }
    }

    // ========================================================================
    // PC-specific views (Project Coordinator)
    // ========================================================================
    if (dashboardType === 'pc') {
      switch (currentView) {
        case 'dashboard':
          return <PCDashboard onNavigateToProject={handleNavigateToProject} />;
        case 'projects':
          return <ProjectsPage isDirectorView={false} onNavigateToProject={handleNavigateToProject} />;
        case 'tasks':
          return <TasksPage isDirectorView={false} onNavigateToProject={handleNavigateToProject} />;
        default:
          return <PCDashboard onNavigateToProject={handleNavigateToProject} />;
      }
    }

    // ========================================================================
    // Sales Manager-specific views
    // ========================================================================
    if (dashboardType === 'sales_manager') {
      switch (currentView) {
        case 'dashboard':
          return <SalesManagerDashboard onNavigateToProject={handleNavigateToProject} />;
        case 'team':
          return <SalesTeamPage onNavigateToProject={handleNavigateToProject} />;
        case 'projects':
          return <ProjectsPage isDirectorView={false} isSalesView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'calendar':
          return <CalendarPage onNavigateToProject={handleNavigateToProject} />;
        default:
          return <SalesManagerDashboard onNavigateToProject={handleNavigateToProject} />;
      }
    }

    // ========================================================================
    // Sales Rep-specific views
    // ========================================================================
    if (dashboardType === 'sales_rep') {
      switch (currentView) {
        case 'dashboard':
          return <SalesRepDashboard onNavigateToProject={handleNavigateToProject} />;
        case 'projects':
          return <ProjectsPage isDirectorView={false} isSalesView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'calendar':
          return <CalendarPage onNavigateToProject={handleNavigateToProject} />;
        default:
          return <SalesRepDashboard onNavigateToProject={handleNavigateToProject} />;
      }
    }

    // ========================================================================
    // Legacy sales dashboard (fallback)
    // ========================================================================
    if (dashboardType === 'sales') {
      switch (currentView) {
        case 'dashboard':
          return <SalesDashboard onNavigateToProject={handleNavigateToProject} />;
        case 'team':
          return <SalesTeamPage onNavigateToProject={handleNavigateToProject} />;
        case 'projects':
          return <ProjectsPage isDirectorView={false} isSalesView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'calendar':
          return <CalendarPage onNavigateToProject={handleNavigateToProject} />;
        default:
          return <SalesDashboard onNavigateToProject={handleNavigateToProject} />;
      }
    }

    // ========================================================================
    // PM-specific views (default)
    // ========================================================================
    switch (currentView) {
      case 'dashboard':
        return <PMDashboard onNavigateToProject={handleNavigateToProject} />;
      case 'projects':
        return <ProjectsPage isDirectorView={false} onNavigateToProject={handleNavigateToProject} />;
      case 'tasks':
        return (
          <TasksPage
            isDirectorView={false}
            onNavigateToProject={handleNavigateToProject}
            includeBackupProjects={includeBackupProjects}
            onToggleBackupProjects={handleToggleBackupProjects}
            initialFilter={initialPageFilter}
          />
        );
      case 'rfis':
        return (
          <RFIsPage
            isDirectorView={false}
            onNavigateToProject={handleNavigateToProject}
            includeBackupProjects={includeBackupProjects}
            onToggleBackupProjects={handleToggleBackupProjects}
            initialFilter={initialPageFilter}
          />
        );
      case 'submittals':
        return (
          <SubmittalsPage
            isDirectorView={false}
            onNavigateToProject={handleNavigateToProject}
            includeBackupProjects={includeBackupProjects}
            onToggleBackupProjects={handleToggleBackupProjects}
            initialFilter={initialPageFilter}
          />
        );
      default:
        return <PMDashboard onNavigateToProject={handleNavigateToProject} />;
    }
  };

  // ==========================================================================
  // FULLSCREEN FACTORY MAP (no sidebar)
  // ==========================================================================
  if (currentView === 'factory-map-fullscreen') {
    return (
      <FactoryMapFullscreen
        onBack={() => setCurrentView('factory-map')}
        onNavigateToProject={handleNavigateToProject}
      />
    );
  }

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)'
    }}>
      <Sidebar
        currentView={currentView}
        setCurrentView={handleSetCurrentView}
        dashboardType={dashboardType}
        setDashboardType={setDashboardType}
        includeBackupProjects={includeBackupProjects}
        onToggleBackupProjects={handleToggleBackupProjects}
        onStatClick={handleSidebarStatClick}
      />
      <main style={{
        flex: 1,
        marginLeft: sidebarCollapsed ? '64px' : '260px',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        overflow: 'auto',
        transition: 'margin-left 0.2s ease-in-out'
      }}>
        {/* System-wide announcements */}
        <div style={{ padding: 'var(--space-md) var(--space-xl) 0' }}>
          <AnnouncementBanner />
        </div>
        <div style={{ padding: 'var(--space-xl)' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// APP WRAPPER
// ============================================================================
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;