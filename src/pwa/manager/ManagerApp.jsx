// ============================================================================
// ManagerApp.jsx - Main Manager PWA Application Component
// ============================================================================
// Root component for the Manager PWA that handles routing between views.
// Uses Supabase Auth (email/password) unlike the floor PWA which uses PIN auth.
//
// Created: January 17, 2026
// Updated: January 17, 2026 - Phase 2 Integration
// ============================================================================

import React, { useState, useCallback } from 'react';
import { ManagerAuthProvider, useManagerAuth } from '../contexts/ManagerAuthContext';
import ManagerLogin from './pages/ManagerLogin';
import ManagerShell from './components/ManagerShell';
import ManagerDashboard from './pages/ManagerDashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import TasksView from './pages/TasksView';
import RFIsView from './pages/RFIsView';
import MorePage from './pages/MorePage';
import QCSummary from './pages/QCSummary';
import CreateTaskSheet from './components/CreateTaskSheet';
import CreateRFISheet from './components/CreateRFISheet';

// ============================================================================
// PAGE TITLES
// ============================================================================

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  projectDetail: 'Project',
  tasks: 'Tasks',
  rfis: 'RFIs',
  qc: 'QC Summary',
  more: 'More'
};

const PAGE_SUBTITLES = {
  dashboard: null,
  projects: 'All your projects',
  projectDetail: null,
  tasks: 'Track & manage tasks',
  rfis: 'Requests for Information',
  qc: 'Quality Control Overview',
  more: 'Settings & Support'
};

// ============================================================================
// MANAGER CONTENT (Authenticated)
// ============================================================================

function ManagerContent() {
  const { isAuthenticated, loading, canViewAllProjects } = useManagerAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sheet states
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateRFIOpen, setIsCreateRFIOpen] = useState(false);
  const [createSheetProjectId, setCreateSheetProjectId] = useState(null);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    // Simulate minimum refresh time for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  }, []);

  const handleNavigate = useCallback((view) => {
    setCurrentView(view);
    setSelectedProject(null);
  }, []);

  const handleSelectProject = useCallback((project) => {
    setSelectedProject(project);
    setCurrentView('projectDetail');
    console.log('[ManagerApp] Selected project:', project);
  }, []);

  const handleBackFromProject = useCallback(() => {
    setSelectedProject(null);
    setCurrentView('projects');
  }, []);

  const handleCreateTask = useCallback((projectId = null) => {
    setCreateSheetProjectId(projectId || selectedProject?.id || null);
    setIsCreateTaskOpen(true);
    console.log('[ManagerApp] Create task requested for project:', projectId || selectedProject?.id);
  }, [selectedProject]);

  const handleCreateRFI = useCallback((projectId = null) => {
    setCreateSheetProjectId(projectId || selectedProject?.id || null);
    setIsCreateRFIOpen(true);
    console.log('[ManagerApp] Create RFI requested for project:', projectId || selectedProject?.id);
  }, [selectedProject]);

  const handleTaskCreated = useCallback((task) => {
    console.log('[ManagerApp] Task created:', task);
    // Trigger refresh to show new task
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleRFICreated = useCallback((rfi) => {
    console.log('[ManagerApp] RFI created:', rfi);
    // Trigger refresh to show new RFI
    setRefreshKey(prev => prev + 1);
  }, []);

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-primary)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ==========================================================================
  // LOGIN STATE
  // ==========================================================================

  if (!isAuthenticated) {
    return <ManagerLogin />;
  }

  // ==========================================================================
  // RENDER CURRENT VIEW
  // ==========================================================================

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ManagerDashboard
            key={`dashboard-${refreshKey}`}
            onNavigate={handleNavigate}
          />
        );
      case 'projects':
        return (
          <ProjectsList
            key={`projects-${refreshKey}`}
            onSelectProject={handleSelectProject}
          />
        );
      case 'projectDetail':
        return (
          <ProjectDetail
            key={`project-${selectedProject?.id}-${refreshKey}`}
            project={selectedProject}
            onBack={handleBackFromProject}
            onCreateTask={handleCreateTask}
            onCreateRFI={handleCreateRFI}
          />
        );
      case 'tasks':
        return (
          <TasksView
            key={`tasks-${refreshKey}`}
            onCreateTask={handleCreateTask}
          />
        );
      case 'rfis':
        return (
          <RFIsView
            key={`rfis-${refreshKey}`}
            onCreateRFI={handleCreateRFI}
          />
        );
      case 'qc':
        return (
          <QCSummary
            key={`qc-${refreshKey}`}
          />
        );
      case 'more':
        return <MorePage onNavigate={handleNavigate} />;
      default:
        return (
          <ManagerDashboard
            key={`dashboard-${refreshKey}`}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // Hide header/nav for project detail view (has its own back button)
  const showShell = currentView !== 'projectDetail';

  // Render sheets (always available)
  const renderSheets = () => (
    <>
      <CreateTaskSheet
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        projectId={createSheetProjectId}
        onTaskCreated={handleTaskCreated}
      />
      <CreateRFISheet
        isOpen={isCreateRFIOpen}
        onClose={() => setIsCreateRFIOpen(false)}
        projectId={createSheetProjectId}
        onRFICreated={handleRFICreated}
      />
    </>
  );

  if (!showShell) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'var(--bg-primary)',
        padding: 'var(--space-lg)'
      }}>
        {renderView()}
        {renderSheets()}
      </div>
    );
  }

  return (
    <>
      <ManagerShell
        title={PAGE_TITLES[currentView] || 'Manager'}
        subtitle={PAGE_SUBTITLES[currentView]}
        currentView={currentView}
        onViewChange={handleNavigate}
        onRefresh={currentView !== 'more' ? handleRefresh : undefined}
        isRefreshing={isRefreshing}
      >
        {renderView()}
      </ManagerShell>
      {renderSheets()}
    </>
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

    /* Dark Mode Overrides for Manager PWA */
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
  }

  /* Root container - disable zoom and ensure full width */
  .manager-pwa-root {
    width: 100%;
    max-width: 100vw;
    min-height: 100dvh;
    overflow-x: hidden;
    touch-action: pan-x pan-y;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }

  /* Force dark backgrounds and box-sizing for manager PWA */
  .manager-pwa-root,
  .manager-pwa-root * {
    color-scheme: dark;
    box-sizing: border-box;
  }

  /* Prevent pinch zoom */
  .manager-pwa-root {
    touch-action: manipulation;
  }

  /* Scrollbar styling for dark mode */
  .manager-pwa-root ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .manager-pwa-root ::-webkit-scrollbar-track {
    background: transparent;
  }

  .manager-pwa-root ::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
  }

  .manager-pwa-root ::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }

  /* Input styling for dark mode - 16px prevents iOS zoom on focus */
  .manager-pwa-root input,
  .manager-pwa-root textarea,
  .manager-pwa-root select {
    color-scheme: dark;
    font-size: 16px !important;
  }
`;

// ============================================================================
// MANAGER APP (with Provider)
// ============================================================================

export default function ManagerApp() {
  return (
    <ManagerAuthProvider>
      <style>{DARK_MODE_STYLES}</style>
      <div className="manager-pwa-root">
        <ManagerContent />
      </div>
    </ManagerAuthProvider>
  );
}
