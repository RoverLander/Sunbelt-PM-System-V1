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
import InventoryReceiving from './pages/InventoryReceiving';

// Placeholder pages (to be implemented in Phase 6+)

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
        return <InventoryReceiving />;
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
// SUNBELT DARK MODE STYLES
// ============================================================================

const DARK_MODE_STYLES = `
  :root {
    /* Sunbelt Dark Mode Color Palette */
    --sunbelt-orange: #FF6B35;
    --sunbelt-orange-light: #F2A541;
    --sunbelt-dark-blue: #0f172a;
    --sunbelt-medium-blue: #1e3a5f;

    /* Dark Mode Overrides for Floor PWA */
    --bg-primary: #0a1628;
    --bg-secondary: #0f172a;
    --bg-tertiary: #1e293b;
    --bg-card: #0f172a;

    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-tertiary: #64748b;

    --border-primary: #1e3a5f;
    --border-secondary: #334155;

    --accent-primary: #FF6B35;
    --accent-secondary: #F2A541;

    /* Spacing */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 12px;
    --space-lg: 16px;
    --space-xl: 24px;

    /* Radius */
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-xl: 20px;
    --radius-full: 9999px;
  }

  /* Root container - disable zoom and ensure full width */
  .floor-pwa-root {
    width: 100%;
    max-width: 100vw;
    min-height: 100dvh;
    overflow-x: hidden;
    touch-action: pan-x pan-y;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }

  /* Force dark backgrounds and box-sizing for floor PWA */
  .floor-pwa-root,
  .floor-pwa-root * {
    color-scheme: dark;
    box-sizing: border-box;
  }

  /* Prevent pinch zoom */
  .floor-pwa-root {
    touch-action: manipulation;
  }

  /* Scrollbar styling for dark mode */
  .floor-pwa-root ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .floor-pwa-root ::-webkit-scrollbar-track {
    background: transparent;
  }

  .floor-pwa-root ::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
  }

  .floor-pwa-root ::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }

  /* Input styling for dark mode - 16px prevents iOS zoom on focus */
  .floor-pwa-root input,
  .floor-pwa-root textarea,
  .floor-pwa-root select {
    color-scheme: dark;
    font-size: 16px !important;
  }

  /* Loading spinner */
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-primary);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ============================================================================
// PWA APP (with Provider)
// ============================================================================

export default function PWAApp() {
  return (
    <WorkerAuthProvider>
      <style>{DARK_MODE_STYLES}</style>
      <div className="floor-pwa-root">
        <PWAContent />
      </div>
    </WorkerAuthProvider>
  );
}
