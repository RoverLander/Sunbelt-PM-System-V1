import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';
import PMDashboard from './components/dashboards/PMDashboard';
import CalendarPage from './components/calendar/CalendarPage';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

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

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarPage />;
      case 'projects':
        // For now, dashboard handles projects view
        return <PMDashboard />;
      case 'tasks':
        // Future: dedicated tasks page
        return <PMDashboard />;
      case 'rfis':
        // Future: dedicated RFIs page
        return <PMDashboard />;
      case 'submittals':
        // Future: dedicated submittals page
        return <PMDashboard />;
      case 'dashboard':
      default:
        return <PMDashboard />;
    }
  };

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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;