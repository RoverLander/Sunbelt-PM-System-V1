// ============================================================================
// SyncIndicator.jsx - Sync Status Indicator Component
// ============================================================================
// Displays sync status in the PWA header. Shows pending actions count,
// sync progress, and last sync time.
//
// Created: January 17, 2026
// ============================================================================

import React, { useState } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  HardDrive
} from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    position: 'relative'
  },

  indicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-xs) var(--space-sm)',
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-tertiary)',
    cursor: 'pointer',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.75rem',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },

  indicatorOnline: {
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e'
  },

  indicatorOffline: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444'
  },

  indicatorSyncing: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6'
  },

  indicatorPending: {
    background: 'rgba(249, 115, 22, 0.15)',
    color: '#f97316'
  },

  badge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    borderRadius: 'var(--radius-full)',
    background: 'currentColor',
    color: 'var(--bg-primary)',
    fontSize: '0.625rem',
    fontWeight: '600'
  },

  spinning: {
    animation: 'spin 1s linear infinite'
  },

  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 'var(--space-xs)',
    minWidth: '240px',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-primary)',
    overflow: 'hidden',
    zIndex: 100
  },

  dropdownHeader: {
    padding: 'var(--space-md)',
    borderBottom: '1px solid var(--border-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },

  dropdownTitle: {
    flex: 1,
    fontWeight: '600',
    fontSize: '0.875rem'
  },

  dropdownContent: {
    padding: 'var(--space-md)'
  },

  statRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-sm) 0',
    borderBottom: '1px solid var(--border-secondary)'
  },

  statLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    color: 'var(--text-secondary)',
    fontSize: '0.8125rem'
  },

  statValue: {
    fontWeight: '600',
    fontSize: '0.8125rem'
  },

  actions: {
    padding: 'var(--space-md)',
    borderTop: '1px solid var(--border-primary)',
    display: 'flex',
    gap: 'var(--space-sm)'
  },

  actionButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-sm)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  primaryButton: {
    background: 'var(--accent-primary)',
    color: 'white'
  },

  secondaryButton: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)'
  },

  storageBar: {
    height: '4px',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    marginTop: 'var(--space-xs)'
  },

  storageProgress: {
    height: '100%',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.3s ease'
  },

  lastSync: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-tertiary)',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textAlign: 'center'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function SyncIndicator({ compact = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    isOnline,
    isOffline,
    syncStatus,
    pendingCounts,
    lastSyncMinutes,
    hasPendingActions,
    hasFailedActions,
    storageInfo,
    isStorageWarning,
    triggerSync,
    retryFailedActions
  } = useOfflineSync({ autoSync: true });

  // Determine indicator state
  const getIndicatorStyle = () => {
    if (isOffline) return styles.indicatorOffline;
    if (syncStatus === 'syncing') return styles.indicatorSyncing;
    if (hasFailedActions) return styles.indicatorPending;
    if (hasPendingActions) return styles.indicatorPending;
    return styles.indicatorOnline;
  };

  // Get icon based on state
  const getIcon = () => {
    if (isOffline) return <CloudOff size={14} />;
    if (syncStatus === 'syncing') return <RefreshCw size={14} style={styles.spinning} />;
    if (hasFailedActions) return <AlertCircle size={14} />;
    return <Cloud size={14} />;
  };

  // Format last sync time
  const formatLastSync = () => {
    if (lastSyncMinutes === null) return 'Never';
    if (lastSyncMinutes < 1) return 'Just now';
    if (lastSyncMinutes === 1) return '1 min ago';
    if (lastSyncMinutes < 60) return `${lastSyncMinutes} mins ago`;
    const hours = Math.floor(lastSyncMinutes / 60);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  };

  // Storage bar color
  const getStorageColor = () => {
    if (storageInfo.percent > 90) return '#ef4444';
    if (storageInfo.percent > 80) return '#f97316';
    return '#22c55e';
  };

  // Format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Handle sync button click
  const handleSync = async () => {
    if (hasFailedActions) {
      await retryFailedActions();
    } else {
      await triggerSync();
    }
  };

  // Compact mode - just show icon and badge
  if (compact) {
    return (
      <div style={{ ...styles.indicator, ...getIndicatorStyle() }}>
        {getIcon()}
        {pendingCounts.total > 0 && (
          <span style={styles.badge}>{pendingCounts.total}</span>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Main indicator button */}
      <button
        style={{ ...styles.indicator, ...getIndicatorStyle() }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Sync status"
      >
        {getIcon()}
        <span>
          {isOffline ? 'Offline' :
           syncStatus === 'syncing' ? 'Syncing...' :
           hasPendingActions ? `${pendingCounts.total} pending` :
           'Synced'}
        </span>
        {pendingCounts.total > 0 && (
          <span style={styles.badge}>{pendingCounts.total}</span>
        )}
        <ChevronDown size={12} style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s ease'
        }} />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div style={styles.dropdown}>
          {/* Header */}
          <div style={styles.dropdownHeader}>
            {isOnline ? (
              <Cloud size={18} color="#22c55e" />
            ) : (
              <CloudOff size={18} color="#ef4444" />
            )}
            <span style={styles.dropdownTitle}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {syncStatus === 'syncing' && (
              <RefreshCw size={14} style={styles.spinning} color="#3b82f6" />
            )}
          </div>

          {/* Stats */}
          <div style={styles.dropdownContent}>
            {/* Pending actions */}
            <div style={styles.statRow}>
              <span style={styles.statLabel}>
                <Clock size={14} />
                Pending
              </span>
              <span style={{
                ...styles.statValue,
                color: pendingCounts.pending > 0 ? '#f97316' : 'var(--text-primary)'
              }}>
                {pendingCounts.pending}
              </span>
            </div>

            {/* Failed actions */}
            {pendingCounts.failed > 0 && (
              <div style={styles.statRow}>
                <span style={styles.statLabel}>
                  <AlertCircle size={14} color="#ef4444" />
                  Failed
                </span>
                <span style={{ ...styles.statValue, color: '#ef4444' }}>
                  {pendingCounts.failed}
                </span>
              </div>
            )}

            {/* Storage */}
            <div style={{ ...styles.statRow, flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={styles.statLabel}>
                  <HardDrive size={14} />
                  Storage
                </span>
                <span style={{
                  ...styles.statValue,
                  color: isStorageWarning ? '#f97316' : 'var(--text-primary)'
                }}>
                  {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                </span>
              </div>
              <div style={styles.storageBar}>
                <div style={{
                  ...styles.storageProgress,
                  width: `${storageInfo.percent}%`,
                  background: getStorageColor()
                }} />
              </div>
            </div>
          </div>

          {/* Last sync time */}
          <div style={styles.lastSync}>
            <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Last synced: {formatLastSync()}
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              style={{ ...styles.actionButton, ...styles.primaryButton }}
              onClick={handleSync}
              disabled={syncStatus === 'syncing' || isOffline}
            >
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw size={12} style={styles.spinning} />
                  Syncing...
                </>
              ) : hasFailedActions ? (
                <>
                  <RefreshCw size={12} />
                  Retry Failed
                </>
              ) : (
                <>
                  <RefreshCw size={12} />
                  Sync Now
                </>
              )}
            </button>
            <button
              style={{ ...styles.actionButton, ...styles.secondaryButton }}
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add keyframes for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
