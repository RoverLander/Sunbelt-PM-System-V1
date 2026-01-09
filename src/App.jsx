// ============================================================================
// App.jsx - Main Application with PM/Director/VP/IT Routing
// ============================================================================
// Routes all sidebar navigation to appropriate pages based on view mode.
// Includes deep navigation from Tasks/RFIs/Submittals pages to ProjectDetails.
//
// FIXES (Jan 9, 2026):
// - ✅ FIXED: VP now has 'reports' route
// - ✅ FIXED: IT now has 'users' route for User Management
// - ✅ FIXED: Main content margin-left matches 260px sidebar width
// ============================================================================

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';

// Dashboards
import PMDashboard from './components/dashboards/PMDashboard';
import DirectorDashboard from './components/dashboards/DirectorDashboard';
import VPDashboard from './components/dashboards/VPDashboard';
import { ITDashboard } from './components/it';

// Pages
import CalendarPage from './components/calendar/CalendarPage';
import ProjectsPage from './components/pages/ProjectsPage';
import TasksPage from './components/pages/TasksPage';
import RFIsPage from './components/pages/RFIsPage';
import SubmittalsPage from './components/pages/SubmittalsPage';
import TeamPage from './components/pages/TeamPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import ClientsPage from './components/pages/ClientsPage';

// Project Details
import ProjectDetails from './components/projects/ProjectDetails';

import { supabase } from './utils/supabaseClient';
import './App.css';

// ============================================================================
// REPORTS PLACEHOLDER
// ============================================================================
function ReportsPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Reports
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Analytics and reporting
        </p>
      </div>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '60px 40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Reports Coming Soon</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          We're building comprehensive reporting features including project analytics, 
          team performance metrics, and exportable reports.
        </p>
      </div>
    </div>
  );
}

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
        } else {
          // Check for stale localStorage that doesn't match role
          const storedType = localStorage.getItem('dashboardType');
          
          // If PM user has director/vp stored, reset to pm
          if (role === 'pm' && storedType !== 'pm') {
            setDashboardType('pm');
            localStorage.setItem('dashboardType', 'pm');
          }
          // If Director/Admin with no stored preference, set to director
          else if ((role === 'director' || role === 'admin') && !storedType) {
            setDashboardType('director');
            localStorage.setItem('dashboardType', 'director');
          }
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
      'floorplan': 'floorplan'
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
    setCurrentView(view);
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
          return <ReportsPage />;
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
          return <ReportsPage />;
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
          // Render IT Dashboard with User Management tab active
          return <ITDashboard initialTab="users" />;
        case 'projects':
          return <ProjectsPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'tasks':
          return <TasksPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'rfis':
          return <RFIsPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        case 'submittals':
          return <SubmittalsPage isDirectorView={true} onNavigateToProject={handleNavigateToProject} />;
        default:
          return <ITDashboard />;
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
        return <TasksPage isDirectorView={false} onNavigateToProject={handleNavigateToProject} />;
      case 'rfis':
        return <RFIsPage isDirectorView={false} onNavigateToProject={handleNavigateToProject} />;
      case 'submittals':
        return <SubmittalsPage isDirectorView={false} onNavigateToProject={handleNavigateToProject} />;
      default:
        return <PMDashboard onNavigateToProject={handleNavigateToProject} />;
    }
  };

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
      />
      <main style={{
        flex: 1,
        marginLeft: '260px', // ✅ FIXED: Match 260px sidebar width
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        overflow: 'auto'
      }}>
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