import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';
import PMDashboard from './components/dashboards/PMDashboard';
import CalendarPage from './components/calendar/CalendarPage';
import './App.css';

// ============================================================================
// APP CONTENT COMPONENT
// Main authenticated app layout with sidebar navigation
// ============================================================================

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

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
  // RENDER CONTENT BASED ON CURRENT VIEW
  // Using key prop to reset component state when switching views
  // This ensures clicking "Dashboard" resets back to main view even if
  // you were inside a ProjectDetails view
  // =========================================================================
  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarPage />;
      case 'projects':
        // Projects view - shows PMDashboard with projects focus
        // Key ensures state resets when switching between views
        return <PMDashboard key="projects" />;
      case 'tasks':
        // Future: dedicated tasks page
        return <PMDashboard key="tasks" />;
      case 'rfis':
        // Future: dedicated RFIs page
        return <PMDashboard key="rfis" />;
      case 'submittals':
        // Future: dedicated submittals page
        return <PMDashboard key="submittals" />;
      case 'dashboard':
      default:
        // Dashboard view - key="dashboard" ensures clicking Dashboard
        // from sidebar resets PMDashboard's internal state (selectedProject)
        return <PMDashboard key="dashboard" />;
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