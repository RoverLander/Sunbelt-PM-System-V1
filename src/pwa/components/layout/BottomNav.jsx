// ============================================================================
// BottomNav.jsx - Bottom Navigation for PWA
// ============================================================================
// Mobile-optimized bottom navigation bar for quick access to main PWA sections.
//
// Created: January 17, 2026
// ============================================================================

import React from 'react';
import { useWorkerAuth } from '../../contexts/WorkerAuthContext';
import {
  Home,
  Search,
  ClipboardCheck,
  Package,
  MoreHorizontal
} from 'lucide-react';

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'modules', label: 'Modules', icon: Search },
  { id: 'qc', label: 'QC', icon: ClipboardCheck, requiresLead: true },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'more', label: 'More', icon: MoreHorizontal }
];

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border-primary)',
    padding: 'var(--space-xs) 0',
    paddingBottom: 'max(var(--space-xs), env(safe-area-inset-bottom))'
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 'var(--space-sm) var(--space-xs)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-tertiary)',
    transition: 'color 0.15s ease'
  },
  navItemActive: {
    color: 'var(--accent-primary)'
  },
  navIcon: {
    marginBottom: '2px'
  },
  navLabel: {
    fontSize: '0.625rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  },
  badge: {
    position: 'absolute',
    top: '2px',
    right: '50%',
    transform: 'translateX(12px)',
    minWidth: '16px',
    height: '16px',
    padding: '0 4px',
    background: '#ef4444',
    borderRadius: '8px',
    fontSize: '0.625rem',
    fontWeight: '600',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function BottomNav({ currentView, onViewChange, badges = {} }) {
  const { isLead } = useWorkerAuth();

  // Filter nav items based on role
  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.requiresLead && !isLead) return false;
    return true;
  });

  return (
    <nav style={styles.nav}>
      {visibleItems.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        const badgeCount = badges[item.id];

        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            style={{
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
              position: 'relative'
            }}
          >
            <Icon
              size={24}
              style={styles.navIcon}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span style={styles.navLabel}>{item.label}</span>

            {/* Badge */}
            {badgeCount > 0 && (
              <span style={styles.badge}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
