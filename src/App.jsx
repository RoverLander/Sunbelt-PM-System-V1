// ============================================================================
// App.jsx - Main Application with PM/Director/VP Routing
// ============================================================================
// Routes all sidebar navigation to appropriate pages based on view mode.
//
// PM VIEW ROUTES:
// - dashboard → PMDashboard
// - projects → ProjectsPage (filtered to user's projects)
// - calendar → CalendarPage
// - tasks → TasksPage (filtered)
// - rfis → RFIsPage (filtered)
// - submittals → SubmittalsPage (filtered)
//
// DIRECTOR VIEW ROUTES:
// - dashboard → DirectorDashboard
// - projects → ProjectsPage (all projects)
// - calendar → CalendarPage
// - team → TeamPage
// - reports → ReportsPage
//
// VP VIEW ROUTES:
// - dashboard → VPDashboard
// - analytics → AnalyticsPage
// - clients → ClientsPage
// - projects → ProjectsPage (all projects, read-only view)
// - calendar → CalendarPage
// ============================================================================

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';

// Dashboards
import PMDashboard from './components/dashboards/PMDashboard';
import DirectorDashboard from './components/dashboards/DirectorDashboard';
import VPDashboard from './components/dashboards/VPDashboard';

// Pages
import CalendarPage from './components/calendar/CalendarPage';
import ProjectsPage from './components/pages/ProjectsPage';
import TasksPage from './components/pages/TasksPage';
import RFIsPage from './components/pages/RFIsPage';
import SubmittalsPage from './components/pages/SubmittalsPage';
import TeamPage from './components/pages/TeamPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import ClientsPage from './components/pages/ClientsPage';

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

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      if (userData) {
        const role = (userData.role || '').toLowerCase();
        setUserRole(role);
        
        // Auto-set to appropriate view based on role (if no saved preference)
        const savedType = localStorage.getItem('dashboardType');
        if (!savedType) {
          if (role === 'vp') {
            setDashboardType('vp');
            localStorage.setItem('dashboardType', 'vp');
          } else if (role === 'director' || role === 'admin') {
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
  // LOADING STATE
  // ==========================================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div className="loading-spinner"></div>
        <div style={{ 
          marginTop: 'var(--space-md)', 
          color: 'var(--text-secondary)',
          fontSize: '0.9375rem'
        }}>
          Loading Sunbelt PM...
        </div>
      </div>
    );
  }

  // ==========================================================================
  // LOGIN STATE
  // ==========================================================================
  if (!user) {
    return <Login />;
  }

  // ==========================================================================
  // RENDER CONTENT BASED ON VIEW AND DASHBOARD TYPE
  // ==========================================================================
  const renderContent = () => {
    // Common pages (same for all views)
    if (currentView === 'calendar') {
      return <CalendarPage />;
    }

    // VP-specific views
    if (dashboardType === 'vp') {
      switch (currentView) {
        case 'dashboard':
          return <VPDashboard />;
        case 'analytics':
          return <AnalyticsPage />;
        case 'clients':
          return <ClientsPage />;
        case 'projects':
          return <ProjectsPage isDirectorView={true} />;
        default:
          return <VPDashboard />;
      }
    }

    // Director-specific views
    if (dashboardType === 'director') {
      switch (currentView) {
        case 'dashboard':
          return <DirectorDashboard />;
        case 'projects':
          return <ProjectsPage isDirectorView={true} />;
        case 'team':
          return <TeamPage />;
        case 'reports':
          return <ReportsPage />;
        default:
          return <DirectorDashboard />;
      }
    }

    // PM-specific views
    switch (currentView) {
      case 'dashboard':
        return <PMDashboard />;
      case 'projects':
        return <ProjectsPage isDirectorView={false} />;
      case 'tasks':
        return <TasksPage isDirectorView={false} />;
      case 'rfis':
        return <RFIsPage isDirectorView={false} />;
      case 'submittals':
        return <SubmittalsPage isDirectorView={false} />;
      default:
        return <PMDashboard />;
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
        setCurrentView={setCurrentView}
        dashboardType={dashboardType}
        setDashboardType={setDashboardType}
      />
      <main style={{
        flex: 1,
        marginLeft: '280px',
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