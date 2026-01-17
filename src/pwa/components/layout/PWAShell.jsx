// ============================================================================
// PWAShell.jsx - Main Layout Shell for PWA
// ============================================================================
// Provides the main layout structure for the PWA including header, content
// area, and bottom navigation. Handles offline indicator and session status.
//
// Created: January 17, 2026
// ============================================================================

import React from 'react';
import { useWorkerAuth } from '../../contexts/WorkerAuthContext';
import BottomNav from './BottomNav';
import OfflineBanner from '../common/OfflineBanner';
import SyncIndicator from '../common/SyncIndicator';
import { Wifi, WifiOff, Clock, LogOut, User } from 'lucide-react';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'var(--bg-primary)'
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-md) var(--space-lg)',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-primary)',
    minHeight: '56px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  headerTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-xs) var(--space-sm)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },
  sessionTime: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)'
  },
  sessionTimeWarning: {
    color: '#f59e0b'
  },
  sessionTimeCritical: {
    color: '#ef4444'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-sm)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'background 0.15s ease'
  },
  content: {
    flex: 1,
    padding: 'var(--space-lg)',
    paddingBottom: 'calc(var(--space-lg) + 70px)', // Account for bottom nav
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch'
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PWAShell({
  children,
  title = 'Floor App',
  currentView,
  onViewChange,
  showHeader = true,
  showBottomNav = true
}) {
  const { worker, logout, sessionTimeRemaining } = useWorkerAuth();

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getSessionTimeStyle = () => {
    if (!sessionTimeRemaining?.valid) return {};

    const { minutesRemaining } = sessionTimeRemaining;

    if (minutesRemaining <= 15) {
      return styles.sessionTimeCritical;
    } else if (minutesRemaining <= 60) {
      return styles.sessionTimeWarning;
    }
    return {};
  };

  const formatSessionTime = () => {
    if (!sessionTimeRemaining?.valid) return null;

    const { hoursRemaining, minutesRemaining } = sessionTimeRemaining;

    if (hoursRemaining >= 1) {
      return `${hoursRemaining}h ${minutesRemaining % 60}m`;
    }
    return `${minutesRemaining}m`;
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div style={styles.shell}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      {showHeader && (
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.headerTitle}>{title}</h1>
          </div>

          <div style={styles.headerRight}>
            {/* Sync Indicator */}
            <SyncIndicator />

            {/* Session Time */}
            {sessionTimeRemaining?.valid && (
              <div style={{ ...styles.sessionTime, ...getSessionTimeStyle() }}>
                <Clock size={14} />
                {formatSessionTime()}
              </div>
            )}

            {/* User Info */}
            {worker && (
              <div style={styles.userInfo}>
                <User size={16} />
                <span>{worker.name?.split(' ')[0] || worker.employee_id}</span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={styles.logoutButton}
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main style={styles.content}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <div style={styles.bottomNav}>
          <BottomNav
            currentView={currentView}
            onViewChange={onViewChange}
          />
        </div>
      )}
    </div>
  );
}
