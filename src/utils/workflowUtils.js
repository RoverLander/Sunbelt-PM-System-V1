// ============================================================================
// workflowUtils.js - Workflow System Utilities
// ============================================================================
// Utility functions for the Sunbelt PM workflow tracking system.
//
// FEATURES:
// - Station status calculation from linked tasks
// - Station deadline calculation
// - Station color determination
// - Phase and station constants
// - Court (ball-in-whose-court) utilities
//
// Created: January 9, 2026
// ============================================================================

import { differenceInDays } from 'date-fns';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Task status values (Title Case - must match database)
 */
export const TASK_STATUSES = [
  'Not Started',
  'In Progress',
  'Awaiting Response',
  'Completed',
  'Cancelled'
];

/**
 * Kanban board columns (4 columns)
 */
export const KANBAN_COLUMNS = [
  { id: 'Not Started', label: 'To Do', color: 'var(--text-tertiary)' },
  { id: 'In Progress', label: 'In Progress', color: 'var(--sunbelt-orange)' },
  { id: 'Awaiting Response', label: 'Waiting', color: 'var(--warning)' },
  { id: 'Completed', label: 'Done', color: 'var(--success)' }
];

/**
 * Closed task statuses (tasks that are "done")
 */
export const CLOSED_TASK_STATUSES = ['Completed', 'Cancelled'];

/**
 * Station status values (lowercase - workflow-specific)
 */
export const STATION_STATUSES = [
  'not_started',
  'in_progress',
  'awaiting_response',
  'completed',
  'skipped'
];

/**
 * Workflow phases
 */
export const WORKFLOW_PHASES = [
  { phase: 1, name: 'Initiation', description: 'Project kickoff and PO receipt' },
  { phase: 2, name: 'Dealer Sign-Offs', description: 'Drawings, long lead items, colors' },
  { phase: 3, name: 'Internal Approvals', description: 'Engineering, third party, state' },
  { phase: 4, name: 'Delivery', description: 'Production and transport' }
];

/**
 * Court options (whose court is the ball in)
 */
export const COURT_OPTIONS = [
  { value: 'dealer', label: 'Dealer', color: 'var(--info)' },
  { value: 'drafting', label: 'Drafting', color: 'var(--sunbelt-orange)' },
  { value: 'pm', label: 'PM', color: 'var(--success)' },
  { value: 'engineering', label: 'Engineering', color: 'var(--warning)' },
  { value: 'third_party', label: 'Third Party', color: '#8b5cf6' },
  { value: 'state', label: 'State', color: '#3b82f6' },
  { value: 'factory', label: 'Factory', color: '#ec4899' },
  { value: 'procurement', label: 'Procurement', color: '#14b8a6' }
];

/**
 * Task status colors
 */
export const TASK_STATUS_COLORS = {
  'Not Started': 'var(--text-tertiary)',
  'In Progress': 'var(--sunbelt-orange)',
  'Awaiting Response': 'var(--warning)',
  'Completed': 'var(--success)',
  'Cancelled': 'var(--text-tertiary)'
};

/**
 * Priority values and colors
 */
export const PRIORITIES = ['Low', 'Normal', 'Medium', 'High', 'Critical'];

export const PRIORITY_COLORS = {
  'Low': 'var(--text-tertiary)',
  'Normal': 'var(--info)',
  'Medium': 'var(--warning)',
  'High': 'var(--sunbelt-orange)',
  'Critical': 'var(--danger)'
};

/**
 * Drawing percentage milestones
 */
export const DRAWING_PERCENTAGES = [20, 65, 95, 100];

/**
 * Dealer response options for drawings
 */
export const DEALER_RESPONSE_OPTIONS = [
  { value: 'Approve', label: 'Approve', color: 'var(--success)' },
  { value: 'Approve with Redlines', label: 'Approve with Redlines', color: 'var(--info)' },
  { value: 'Reject with Redlines', label: 'Reject with Redlines', color: 'var(--warning)' },
  { value: 'Reject', label: 'Reject', color: 'var(--danger)' }
];

/**
 * Change order types
 */
export const CHANGE_ORDER_TYPES = ['Redlines', 'General', 'Pricing'];

/**
 * Change order statuses
 */
export const CHANGE_ORDER_STATUSES = ['Draft', 'Sent', 'Signed', 'Implemented', 'Rejected'];

// ============================================================================
// STATION STATUS CALCULATION
// ============================================================================

/**
 * Calculate station status based on linked tasks
 * Uses "worst status wins" logic
 *
 * @param {Array} tasks - Array of task objects linked to this station
 * @returns {string} Station status (lowercase)
 */
export const calculateStationStatus = (tasks) => {
  if (!tasks || tasks.length === 0) return 'not_started';

  const statuses = tasks.map(t => t.status);

  // If ALL tasks are cancelled, station is skipped
  if (statuses.every(s => s === 'Cancelled')) return 'skipped';

  // Filter out cancelled tasks for remaining logic
  const activeStatuses = statuses.filter(s => s !== 'Cancelled');
  if (activeStatuses.length === 0) return 'skipped';

  // Priority order (worst to best)
  // 1. Any "Not Started" = station is not_started
  if (activeStatuses.some(s => s === 'Not Started')) return 'not_started';

  // 2. Any "In Progress" = station is in_progress
  if (activeStatuses.some(s => s === 'In Progress')) return 'in_progress';

  // 3. Any "Awaiting Response" = station is awaiting_response
  if (activeStatuses.some(s => s === 'Awaiting Response')) return 'awaiting_response';

  // 4. All remaining must be "Completed" = station is completed
  if (activeStatuses.every(s => s === 'Completed')) return 'completed';

  // Default fallback
  return 'in_progress';
};

/**
 * Get earliest deadline from linked tasks
 * Only considers tasks that are not completed or cancelled
 *
 * @param {Array} tasks - Array of task objects
 * @returns {Date|null} Earliest deadline date or null
 */
export const getStationDeadline = (tasks) => {
  if (!tasks || tasks.length === 0) return null;

  const deadlines = tasks
    .filter(t => t.due_date && !CLOSED_TASK_STATUSES.includes(t.status))
    .map(t => new Date(t.due_date));

  if (deadlines.length === 0) return null;
  return new Date(Math.min(...deadlines));
};

/**
 * Get station color based on status and deadline
 *
 * @param {string} status - Station status (lowercase)
 * @param {Date|string|null} deadline - Station deadline
 * @returns {string} CSS color variable
 */
export const getStationColor = (status, deadline) => {
  // Completed = green
  if (status === 'completed') return 'var(--success)';

  // Skipped = gray with strikethrough styling
  if (status === 'skipped') return 'var(--text-tertiary)';

  // Check deadline proximity
  if (deadline) {
    const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
    const daysUntil = differenceInDays(deadlineDate, new Date());

    // Overdue = red
    if (daysUntil < 0) return 'var(--danger)';

    // Nearing deadline (2 days or less) = orange warning
    if (daysUntil <= 2) return 'var(--warning)';
  }

  // In progress or awaiting response = sunbelt orange (active)
  if (status === 'in_progress' || status === 'awaiting_response') {
    return 'var(--sunbelt-orange)';
  }

  // Not started = gray
  return 'var(--text-tertiary)';
};

/**
 * Get station status display label
 *
 * @param {string} status - Station status (lowercase)
 * @returns {string} Human-readable label
 */
export const getStationStatusLabel = (status) => {
  const labels = {
    'not_started': 'Not Started',
    'in_progress': 'In Progress',
    'awaiting_response': 'Awaiting Response',
    'completed': 'Completed',
    'skipped': 'Skipped'
  };
  return labels[status] || 'Unknown';
};

// ============================================================================
// TASK HELPERS
// ============================================================================

/**
 * Check if a task is open (not closed)
 *
 * @param {string} status - Task status
 * @returns {boolean}
 */
export const isTaskOpen = (status) => !CLOSED_TASK_STATUSES.includes(status);

/**
 * Check if a task is overdue
 *
 * @param {string} dueDate - Due date string
 * @param {string} status - Task status
 * @returns {boolean}
 */
export const isTaskOverdue = (dueDate, status) => {
  if (!dueDate || CLOSED_TASK_STATUSES.includes(status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
};

/**
 * Get days until deadline (negative if overdue)
 *
 * @param {string|Date} deadline - Deadline date
 * @returns {number|null} Days until deadline or null if no deadline
 */
export const getDaysUntilDeadline = (deadline) => {
  if (!deadline) return null;
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  return differenceInDays(deadlineDate, new Date());
};

/**
 * Get urgency level based on days until deadline
 *
 * @param {number|null} daysUntil - Days until deadline
 * @returns {string} 'overdue' | 'critical' | 'warning' | 'normal' | 'none'
 */
export const getUrgencyLevel = (daysUntil) => {
  if (daysUntil === null) return 'none';
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 2) return 'critical';
  if (daysUntil <= 7) return 'warning';
  return 'normal';
};

/**
 * Get court option by value
 *
 * @param {string} courtValue - Court value (e.g., 'dealer')
 * @returns {Object|null} Court option object or null
 */
export const getCourtOption = (courtValue) => {
  return COURT_OPTIONS.find(c => c.value === courtValue) || null;
};

/**
 * Get court color
 *
 * @param {string} courtValue - Court value
 * @returns {string} CSS color
 */
export const getCourtColor = (courtValue) => {
  const option = getCourtOption(courtValue);
  return option?.color || 'var(--text-secondary)';
};

// ============================================================================
// WORKFLOW STATION HELPERS
// ============================================================================

/**
 * Group stations by phase
 *
 * @param {Array} stations - Array of station objects
 * @returns {Object} Object keyed by phase number with array of stations
 */
export const groupStationsByPhase = (stations) => {
  return stations.reduce((acc, station) => {
    const phase = station.phase;
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(station);
    return acc;
  }, {});
};

/**
 * Get parent-child station relationship
 *
 * @param {Array} stations - Array of station objects
 * @returns {Object} Object keyed by parent station key with array of child stations
 */
export const getStationHierarchy = (stations) => {
  const roots = stations.filter(s => !s.parent_station_key);
  const children = stations.filter(s => s.parent_station_key);

  return roots.map(root => ({
    ...root,
    children: children
      .filter(c => c.parent_station_key === root.station_key)
      .sort((a, b) => a.display_order - b.display_order)
  }));
};

/**
 * Calculate overall project workflow progress
 *
 * @param {Object} stationStatuses - Object keyed by station_key with status values
 * @param {Array} stations - Array of all station objects
 * @returns {Object} { completed: number, total: number, percentage: number }
 */
export const calculateWorkflowProgress = (stationStatuses, stations) => {
  // Only count leaf stations (no children) for progress
  const leafStations = stations.filter(s =>
    !stations.some(other => other.parent_station_key === s.station_key)
  );

  const total = leafStations.length;
  const completed = leafStations.filter(s => {
    const status = stationStatuses[s.station_key];
    return status === 'completed' || status === 'skipped';
  }).length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date for display
 *
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date or '—'
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format date short (no year)
 *
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date or '—'
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format relative date (e.g., "2 days ago", "in 3 days")
 *
 * @param {string|Date} dateString - Date to format
 * @returns {string} Relative date string
 */
export const formatRelativeDate = (dateString) => {
  if (!dateString) return '—';

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = differenceInDays(date, today);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1) return `In ${diffDays} days`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

  return formatDateShort(dateString);
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate task status value
 *
 * @param {string} status - Status to validate
 * @returns {boolean}
 */
export const isValidTaskStatus = (status) => TASK_STATUSES.includes(status);

/**
 * Validate station status value
 *
 * @param {string} status - Status to validate
 * @returns {boolean}
 */
export const isValidStationStatus = (status) => STATION_STATUSES.includes(status);

/**
 * Validate court value
 *
 * @param {string} court - Court value to validate
 * @returns {boolean}
 */
export const isValidCourt = (court) => COURT_OPTIONS.some(c => c.value === court);

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Constants
  TASK_STATUSES,
  KANBAN_COLUMNS,
  CLOSED_TASK_STATUSES,
  STATION_STATUSES,
  WORKFLOW_PHASES,
  COURT_OPTIONS,
  TASK_STATUS_COLORS,
  PRIORITIES,
  PRIORITY_COLORS,
  DRAWING_PERCENTAGES,
  DEALER_RESPONSE_OPTIONS,
  CHANGE_ORDER_TYPES,
  CHANGE_ORDER_STATUSES,

  // Station calculations
  calculateStationStatus,
  getStationDeadline,
  getStationColor,
  getStationStatusLabel,

  // Task helpers
  isTaskOpen,
  isTaskOverdue,
  getDaysUntilDeadline,
  getUrgencyLevel,
  getCourtOption,
  getCourtColor,

  // Workflow helpers
  groupStationsByPhase,
  getStationHierarchy,
  calculateWorkflowProgress,

  // Date formatting
  formatDate,
  formatDateShort,
  formatRelativeDate,

  // Validation
  isValidTaskStatus,
  isValidStationStatus,
  isValidCourt
};
