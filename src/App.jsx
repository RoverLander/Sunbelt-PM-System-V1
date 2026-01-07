import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';
import PMDashboard from './components/dashboards/PMDashboard';
import CalendarPage from './components/calendar/CalendarPage';
import TasksPage from './components/dashboards/TasksPage';
import './App.css';

// ============================================================================
// APP CONTENT COMPONENT
// Main authenticated app layout with sidebar navigation
// Handles navigation between views and deep-linking to project tabs
// ============================================================================

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  
  // =========================================================================
  // NAVIGATION STATE
  // Used to navigate to a specific project and tab from other pages
  // e.g., clicking a task in TasksPage navigates to that project's Tasks tab
  // =========================================================================
  const [navigationTarget, setNavigationTarget] = useState(null);

  // =========================================================================
  // LOADING STATE
  // =========================================================================
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

  // =========================================================================
  // UNAUTHENTICATED - SHOW LOGIN
  // =========================================================================
  if (!user) {
    return <Login />;
  }

  // =========================================================================
  // HANDLE NAVIGATION TO PROJECT
  // Called from TasksPage (and future RFIsPage, SubmittalsPage) when
  // user clicks an item to navigate to its project
  // =========================================================================
  const handleNavigateToProject = (projectId, tab = 'Overview') => {
    setNavigationTarget({ projectId, tab });
    setCurrentView('dashboard');
  };

  // =========================================================================
  // CLEAR NAVIGATION TARGET
  // Called by PMDashboard after it has processed the navigation
  // =========================================================================
  const clearNavigationTarget = () => {
    setNavigationTarget(null);
  };

  // =========================================================================
  // RENDER CONTENT BASED ON CURRENT VIEW
  // Using key prop to reset component state when switching views
  // =========================================================================
  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarPage />;
      
      case 'tasks':
        return (
          <TasksPage 
            key="tasks-page"
            onNavigateToProject={handleNavigateToProject} 
          />
        );
      
      case 'projects':
        return (
          <PMDashboard 
            key="projects" 
            navigationTarget={navigationTarget}
            onNavigationComplete={clearNavigationTarget}
          />
        );
      
      case 'rfis':
        // Future: RFIsPage
        return (
          <PMDashboard 
            key="rfis"
            navigationTarget={navigationTarget}
            onNavigationComplete={clearNavigationTarget}
          />
        );
      
      case 'submittals':
        // Future: SubmittalsPage
        return (
          <PMDashboard 
            key="submittals"
            navigationTarget={navigationTarget}
            onNavigationComplete={clearNavigationTarget}
          />
        );
      
      case 'dashboard':
      default:
        return (
          <PMDashboard 
            key="dashboard"
            navigationTarget={navigationTarget}
            onNavigationComplete={clearNavigationTarget}
          />
        );
    }
  };

  // =========================================================================
  // RENDER - MAIN LAYOUT
  // =========================================================================
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)'
    }}>
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
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
// APP ROOT COMPONENT
// Wraps everything in AuthProvider for authentication context
// ============================================================================

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;