// ============================================================================
// App.jsx
// ============================================================================
// Main application entry point for Sunbelt PM.
// Handles authentication, routing between views, and layout.
//
// VIEWS:
// - dashboard: PM Dashboard with overview
// - projects: Dedicated projects page
// - calendar: Calendar view (widened)
// - tasks: Dedicated tasks page
// - rfis: Dedicated RFIs page
// - submittals: Dedicated submittals page
// ============================================================================

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';

// ============================================================================
// PAGE IMPORTS
// ============================================================================
import PMDashboard from './components/dashboards/PMDashboard';
import CalendarPage from './components/calendar/CalendarPage';
import ProjectsPage from './components/pages/ProjectsPage';
import TasksPage from './components/pages/TasksPage';
import RFIsPage from './components/pages/RFIsPage';
import SubmittalsPage from './components/pages/SubmittalsPage';

import './App.css';

// ============================================================================
// MAIN APP CONTENT
// ============================================================================
function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

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
  // LOGIN SCREEN (Not authenticated)
  // ==========================================================================
  if (!user) {
    return <Login />;
  }

  // ==========================================================================
  // CONTENT RENDERER
  // ==========================================================================
  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'rfis':
        return <RFIsPage />;
      case 'submittals':
        return <SubmittalsPage />;
      case 'dashboard':
      default:
        return <PMDashboard />;
    }
  };

  // ==========================================================================
  // DETERMINE PADDING FOR DIFFERENT VIEWS
  // Calendar needs full width, other pages have standard padding
  // ==========================================================================
  const isCalendarView = currentView === 'calendar';

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)'
    }}>
      {/* Sidebar */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      {/* Main Content Area */}
      <main style={{
        flex: 1,
        marginLeft: '280px',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        overflow: 'auto'
      }}>
        {/* 
          Calendar view gets minimal padding for maximum width
          Other views get standard padding 
        */}
        <div style={{ 
          padding: isCalendarView ? 'var(--space-md)' : 'var(--space-xl)',
          height: isCalendarView ? 'calc(100vh - var(--space-md) * 2)' : 'auto'
        }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// APP WRAPPER WITH AUTH PROVIDER
// ============================================================================
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;