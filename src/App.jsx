// ============================================================================
// App.jsx - Main Application Component
// ============================================================================
// Root component that handles:
// - Authentication state
// - Dashboard type switching (Director/PM)
// - View routing
// - Layout structure
// ============================================================================

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';
import PMDashboard from './components/dashboards/PMDashboard';
import DirectorDashboard from './components/dashboards/DirectorDashboard';
import CalendarPage from './components/calendar/CalendarPage';
import './App.css';

// ============================================================================
// APP CONTENT COMPONENT
// ============================================================================
function AppContent() {
  const { user, loading } = useAuth();
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Dashboard type: 'pm' or 'director'
  const [dashboardType, setDashboardType] = useState(() => {
    const saved = localStorage.getItem('dashboardType');
    return saved || 'pm';
  });

  // ==========================================================================
  // AUTO-SET DASHBOARD TYPE BASED ON USER ROLE
  // ==========================================================================
  useEffect(() => {
    if (user) {
      // Check if user has a role that should default to director view
      const checkUserRole = async () => {
        try {
          const { supabase } = await import('./utils/supabaseClient');
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
            const role = userData.role?.toLowerCase() || '';
            const isDirector = role === 'director' || role === 'admin';
            
            console.log('App.jsx role check:', { role: userData.role, isDirector });
            
            // Auto-set to director view for directors (unless they have a saved preference)
            const savedType = localStorage.getItem('dashboardType');
            if (isDirector && !savedType) {
              console.log('Auto-setting to director dashboard');
              setDashboardType('director');
              localStorage.setItem('dashboardType', 'director');
            }
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      };

      checkUserRole();
    }
  }, [user]);

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
  // RENDER CONTENT BASED ON VIEW
  // ==========================================================================
  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarPage />;
      
      case 'projects':
        // Projects view uses PM Dashboard which has project selection
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
        // ===== DASHBOARD VIEW - SWITCH BASED ON TYPE =====
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
      {/* ===== SIDEBAR ===== */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        dashboardType={dashboardType}
        setDashboardType={setDashboardType}
      />
      
      {/* ===== MAIN CONTENT ===== */}
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
// ============================================================================
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;