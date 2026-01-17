// ============================================================================
// PWAApp.jsx - Main PWA Application Component
// ============================================================================
// Root component for the PWA that handles routing between PWA views.
// Separate from the main desktop app for mobile-optimized experience.
//
// Created: January 17, 2026
// ============================================================================

import React, { useState } from 'react';
import { WorkerAuthProvider, useWorkerAuth } from './contexts/WorkerAuthContext';
import WorkerLogin from './components/auth/WorkerLogin';
import PWAShell from './components/layout/PWAShell';
import PWAHome from './pages/PWAHome';
import ModuleLookup from './pages/ModuleLookup';
import QCInspection from './pages/QCInspection';
import StationMove from './pages/StationMove';

// Placeholder pages (to be implemented in Phase 5+)

const InventoryPage = () => (
  <div style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
    <h2>Inventory Receiving</h2>
    <p style={{ color: 'var(--text-secondary)' }}>Coming in Phase 5</p>
  </div>
);

const MorePage = () => (
  <div style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
    <h2>More Options</h2>
    <p style={{ color: 'var(--text-secondary)' }}>Settings & Help</p>
  </div>
);

// ============================================================================
// PAGE TITLES
// ============================================================================

const PAGE_TITLES = {
  home: 'Floor App',
  modules: 'Find Module',
  stationmove: 'Move Module',
  qc: 'QC Inspection',
  inventory: 'Inventory',
  more: 'More'
};

// ============================================================================
// PWA CONTENT (Authenticated)
// ============================================================================

function PWAContent() {
  const { isAuthenticated, loading } = useWorkerAuth();
  const [currentView, setCurrentView] = useState('home');

  // Show loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <WorkerLogin />;
  }

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <PWAHome onNavigate={setCurrentView} />;
      case 'modules':
        return <ModuleLookup />;
      case 'stationmove':
        return <StationMove />;
      case 'qc':
        return <QCInspection />;
      case 'inventory':
        return <InventoryPage />;
      case 'more':
        return <MorePage />;
      default:
        return <PWAHome onNavigate={setCurrentView} />;
    }
  };

  return (
    <PWAShell
      title={PAGE_TITLES[currentView] || 'Floor App'}
      currentView={currentView}
      onViewChange={setCurrentView}
    >
      {renderView()}
    </PWAShell>
  );
}

// ============================================================================
// PWA APP (with Provider)
// ============================================================================

export default function PWAApp() {
  return (
    <WorkerAuthProvider>
      <PWAContent />
    </WorkerAuthProvider>
  );
}
