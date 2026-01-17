// ============================================================================
// ManagerShell.jsx - Main Layout Shell for Manager PWA
// ============================================================================
// Provides the main layout structure for the manager PWA including header,
// content area, and bottom navigation.
//
// Created: January 17, 2026
// ============================================================================

import React from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import ManagerNav from './ManagerNav';
import OfflineBanner from '../../components/common/OfflineBanner';
import { LogOut, User, Building2, RefreshCw } from 'lucide-react';

// ============================================================================
// SUNBELT DARK MODE COLORS
// ============================================================================

const SUNBELT = {
  orange: '#FF6B35',
  orangeLight: '#F2A541',
  darkBg: '#0a1628',
  cardBg: '#0f172a',
  headerGradient: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
  borderColor: '#1e3a5f',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b'
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    width: '100%',
    maxWidth: '100vw',
    background: SUNBELT.darkBg
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
    background: SUNBELT.headerGradient,
    minHeight: '56px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: SUNBELT.textPrimary,
    margin: 0
  },
  headerSubtitle: {
    fontSize: '0.75rem',
    color: SUNBELT.textSecondary,
    marginTop: '2px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    background: 'rgba(255,107,53,0.15)',
    border: 'none',
    borderRadius: '10px',
    color: SUNBELT.orange,
    cursor: 'pointer',
    transition: 'background 0.15s ease'
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '10px',
    color: SUNBELT.textPrimary,
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    borderRadius: '10px',
    color: SUNBELT.textSecondary,
    cursor: 'pointer',
    transition: 'background 0.15s ease'
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    padding: '16px',
    // Extra padding at bottom for larger nav bar + safe area
    paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 8px))',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    boxSizing: 'border-box'
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

export default function ManagerShell({
  children,
  title = 'Manager',
  subtitle,
  currentView,
  onViewChange,
  onRefresh,
  isRefreshing = false,
  showHeader = true,
  showBottomNav = true,
  badges = {}
}) {
  const { user, logout, userName, userRole } = useManagerAuth();

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh();
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
            <div>
              <h1 style={styles.headerTitle}>{title}</h1>
              {subtitle && (
                <div style={styles.headerSubtitle}>{subtitle}</div>
              )}
            </div>
          </div>

          <div style={styles.headerRight}>
            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={handleRefresh}
                style={{
                  ...styles.refreshButton,
                  opacity: isRefreshing ? 0.5 : 1
                }}
                disabled={isRefreshing}
                title="Refresh data"
              >
                <RefreshCw
                  size={18}
                  style={{
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                  }}
                />
              </button>
            )}

            {/* User Info */}
            {user && (
              <div style={styles.userButton}>
                <User size={16} />
                <span>{userName?.split(' ')[0] || 'User'}</span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={styles.logoutButton}
              title="Sign out"
            >
              <LogOut size={18} />
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
          <ManagerNav
            currentView={currentView}
            onViewChange={onViewChange}
            badges={badges}
          />
        </div>
      )}

      {/* Keyframe animation for refresh spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
