// ============================================================================
// Dashboard Components Index
// ============================================================================
// Central export file for all dashboard-related components.
//
// USAGE:
// import { 
//   DirectorDashboard, 
//   GanttTimeline, 
//   TeamWorkloadView 
// } from './components/dashboards';
// ============================================================================

// Main Dashboards
export { default as DirectorDashboard } from './DirectorDashboard';
export { default as PMDashboard } from './PMDashboard';

// Shared Components
export { default as GanttTimeline } from './GanttTimeline';
export { default as ProjectGanttTimeline } from './ProjectGanttTimeline';
export { default as TeamWorkloadView } from './TeamWorkloadView';
export { default as RecentActivityFeed } from './RecentActivityFeed';
export { default as RiskSettingsModal } from './RiskSettingsModal';