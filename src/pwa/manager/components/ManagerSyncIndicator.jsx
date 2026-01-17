// ============================================================================
// ManagerSyncIndicator.jsx - Sync Status Indicator for Manager PWA
// ============================================================================
// Displays current sync status and last sync time.
// Shows warnings when data is stale or device is offline.
//
// Created: January 17, 2026
// Phase 6 Implementation
// ============================================================================

import React from 'react';
import { useManagerOffline } from '../hooks/useManagerOffline';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  online: {
    background: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e'
  },
  offline: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444'
  },
  stale: {
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b'
  },
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'rgba(239, 68, 68, 0.9)',
    color: 'white',
    fontSize: '0.8125rem',
    fontWeight: '500'
  }
};

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Compact sync indicator showing online/offline status
 */
export function SyncStatusBadge() {
  const { isOnline, isStale, minutesSinceSync } = useManagerOffline();

  if (!isOnline) {
    return (
      <div style={{ ...styles.container, ...styles.offline }}>
        <WifiOff size={14} />
        <span>Offline</span>
      </div>
    );
  }

  if (isStale) {
    return (
      <div style={{ ...styles.container, ...styles.stale }}>
        <AlertTriangle size={14} />
        <span>Sync needed</span>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, ...styles.online }}>
      <CheckCircle size={14} />
      <span>
        {minutesSinceSync !== null
          ? minutesSinceSync < 1
            ? 'Just synced'
            : `${minutesSinceSync}m ago`
          : 'Synced'}
      </span>
    </div>
  );
}

/**
 * Full-width offline banner
 */
export function OfflineBanner() {
  const { isOffline } = useManagerOffline();

  if (!isOffline) return null;

  return (
    <div style={styles.banner}>
      <WifiOff size={16} />
      <span>You're offline - Viewing cached data</span>
    </div>
  );
}

/**
 * Sync time display
 */
export function LastSyncTime({ style = {} }) {
  const { lastSync, minutesSinceSync, isOnline } = useManagerOffline();

  if (!lastSync) {
    return (
      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', ...style }}>
        Never synced
      </span>
    );
  }

  const formatTime = () => {
    if (minutesSinceSync < 1) return 'Just now';
    if (minutesSinceSync < 60) return `${minutesSinceSync} min ago`;
    const hours = Math.floor(minutesSinceSync / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(lastSync).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <span style={{
      fontSize: '0.75rem',
      color: 'var(--text-tertiary)',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      ...style
    }}>
      {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
      Last sync: {formatTime()}
    </span>
  );
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default function ManagerSyncIndicator({ variant = 'badge' }) {
  switch (variant) {
    case 'banner':
      return <OfflineBanner />;
    case 'time':
      return <LastSyncTime />;
    case 'badge':
    default:
      return <SyncStatusBadge />;
  }
}
