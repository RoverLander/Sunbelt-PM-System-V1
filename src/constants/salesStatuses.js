// ============================================================================
// salesStatuses.js - Shared Sales Quote Status Configuration
// ============================================================================
// Single source of truth for all sales quote status definitions.
// Used by: SalesManagerDashboard, SalesRepDashboard, SalesDashboard,
//          SalesTeamPage, QuoteDetail, Sidebar
// ============================================================================

import {
  FileText,
  Clock,
  Send,
  Timer,
  CheckCircle,
  XCircle,
  Award,
  ArrowRight
} from 'lucide-react';

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================
// Complete status configuration with colors, icons, and display properties
export const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: '#64748b',
    icon: FileText,
    bgColor: 'rgba(100, 116, 139, 0.1)',
    order: 1
  },
  pending: {
    label: 'Pending',
    color: '#a855f7',
    icon: Clock,
    bgColor: 'rgba(168, 85, 247, 0.1)',
    order: 2
  },
  sent: {
    label: 'Sent',
    color: '#3b82f6',
    icon: Send,
    bgColor: 'rgba(59, 130, 246, 0.1)',
    order: 3
  },
  negotiating: {
    label: 'Negotiating',
    color: '#f59e0b',
    icon: Clock,
    bgColor: 'rgba(245, 158, 11, 0.1)',
    order: 4
  },
  awaiting_po: {
    label: 'Awaiting PO',
    color: '#8b5cf6',
    icon: Timer,
    bgColor: 'rgba(139, 92, 246, 0.1)',
    order: 5
  },
  po_received: {
    label: 'PO Received',
    color: '#06b6d4',
    icon: CheckCircle,
    bgColor: 'rgba(6, 182, 212, 0.1)',
    order: 6
  },
  won: {
    label: 'Won',
    color: '#22c55e',
    icon: Award,
    bgColor: 'rgba(34, 197, 94, 0.1)',
    order: 7
  },
  lost: {
    label: 'Lost',
    color: '#ef4444',
    icon: XCircle,
    bgColor: 'rgba(239, 68, 68, 0.1)',
    order: 8
  },
  expired: {
    label: 'Expired',
    color: '#6b7280',
    icon: Clock,
    bgColor: 'rgba(107, 114, 128, 0.1)',
    order: 9
  },
  converted: {
    label: 'Converted',
    color: '#10b981',
    icon: ArrowRight,
    bgColor: 'rgba(16, 185, 129, 0.1)',
    order: 10
  }
};

// ============================================================================
// STATUS ARRAYS
// ============================================================================

// Active pipeline statuses - quotes that count toward pipeline value
export const ACTIVE_STATUSES = [
  'draft',
  'pending',
  'sent',
  'negotiating',
  'awaiting_po',
  'po_received'
];

// Terminal statuses - quotes that have reached an end state
export const TERMINAL_STATUSES = ['won', 'lost', 'expired', 'converted'];

// All statuses in display order
export const ALL_STATUSES = Object.keys(STATUS_CONFIG).sort(
  (a, b) => STATUS_CONFIG[a].order - STATUS_CONFIG[b].order
);

// ============================================================================
// BUILDING TYPES (from Praxis)
// ============================================================================
export const BUILDING_TYPES = ['CUSTOM', 'FLEET/STOCK', 'GOVERNMENT', 'Business'];

export const BUILDING_TYPE_COLORS = {
  'CUSTOM': '#f59e0b',
  'FLEET/STOCK': '#3b82f6',
  'GOVERNMENT': '#22c55e',
  'Business': '#8b5cf6'
};

// ============================================================================
// LOST REASONS
// ============================================================================
export const LOST_REASONS = [
  { value: 'price', label: 'Price too high' },
  { value: 'timing', label: "Timeline didn't work" },
  { value: 'competitor', label: 'Lost to competitor' },
  { value: 'cancelled', label: 'Project cancelled' },
  { value: 'no_response', label: 'No response' },
  { value: 'scope_change', label: 'Scope changed' },
  { value: 'other', label: 'Other' }
];

// ============================================================================
// AGING THRESHOLDS (days)
// ============================================================================
export const AGING_THRESHOLDS = {
  fresh: 15,    // 0-15 days = fresh (green)
  aging: 25,    // 16-25 days = aging (yellow)
  stale: 30     // 30+ days = stale (red)
};

// ============================================================================
// FACTORY LIST
// ============================================================================
export const FACTORIES = [
  'NWBS', 'WM-EAST', 'WM-WEST', 'MM', 'SSI', 'MS', 'MG',
  'SEMO', 'PMI', 'AMTEX', 'BRIT', 'CB', 'IND', 'MRS'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get status configuration with fallback
 * @param {string} status - The status key
 * @returns {object} Status configuration object
 */
export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.draft;
};

/**
 * Check if a status is active (in pipeline)
 * @param {string} status - The status key
 * @returns {boolean}
 */
export const isActiveStatus = (status) => {
  return ACTIVE_STATUSES.includes(status);
};

/**
 * Check if a status is terminal (end state)
 * @param {string} status - The status key
 * @returns {boolean}
 */
export const isTerminalStatus = (status) => {
  return TERMINAL_STATUSES.includes(status);
};

/**
 * Format currency for display
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format currency in compact form (e.g., $1.5M, $500K)
 * @param {number} amount - The amount to format
 * @returns {string} Compact formatted currency string
 */
export const formatCompactCurrency = (amount) => {
  if (!amount && amount !== 0) return '-';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return formatCurrency(amount);
};

/**
 * Get days since a date
 * @param {string} dateString - ISO date string
 * @returns {number|null} Number of days or null if invalid
 */
export const getDaysAgo = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get aging color based on days old
 * @param {number} daysOld - Number of days old
 * @returns {string} Color hex code
 */
export const getAgingColor = (daysOld) => {
  if (daysOld === null) return 'var(--text-tertiary)';
  if (daysOld <= AGING_THRESHOLDS.fresh) return '#22c55e';
  if (daysOld <= AGING_THRESHOLDS.aging) return '#f59e0b';
  return '#ef4444';
};

/**
 * Get aging label for display
 * @param {number} daysOld - Number of days old
 * @returns {string} Display label
 */
export const getAgingLabel = (daysOld) => {
  if (daysOld === null) return '';
  if (daysOld === 0) return 'Today';
  if (daysOld <= AGING_THRESHOLDS.fresh) return `${daysOld}d`;
  if (daysOld <= AGING_THRESHOLDS.aging) return `${daysOld}d (aging)`;
  return `${daysOld}d (stale)`;
};
