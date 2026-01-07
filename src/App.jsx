// ============================================================================
// App.jsx - Main Application Component
// ============================================================================
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';
import PMDashboard from './components/dashboards/PMDashboard';
import DirectorDashboard from './components/dashboards/DirectorDashboard';
import CalendarPage from './components/calendar/CalendarPage';
import { supabase } from './utils/supabaseClient';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [currentView, setCurrentView] = useState('dashboard');
  const [dashboardType, setDashboardType] = useState(() => {
    return localStorage.getItem('dashboardType') || 'pm';
  });

  // ==========================================================================
  // AUTO-SET DASHBOARD TYPE FOR DIRECTORS
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
        const isDirector = role === 'director' || role === 'admin';
        
        console.log('App: User role =', userData.role, ', isDirector =', isDirector);
        
        // Auto-set to director view for directors (if no saved preference)
        const savedType = localStorage.getItem('dashboardType');
        if (isDirector && !savedType) {
          console.log('App: Auto-setting to director dashboard');
          setDashboardType('director');
          localStorage.setItem('dashboardType', 'director');
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

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
  // RENDER CONTENT
  // ==========================================================================
  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarPage />;
      case 'projects':
        return <PMDashboard />;
      case 'tasks':
        return <PMDashboard />;
      case 'rfis':
        return <PMDashboard />;
      case 'submittals':
        return <PMDashboard />;
      case 'dashboard':
      default:
        // Switch based on dashboard type
        if (dashboardType === 'director') {
          return <DirectorDashboard />;
        }
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;