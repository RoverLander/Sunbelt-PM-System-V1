// ============================================================================
// ManagerNav.jsx - Bottom Navigation for Manager PWA
// ============================================================================
// Mobile-optimized bottom navigation for management app with role-aware items.
//
// Created: January 17, 2026
// ============================================================================

import React from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  ClipboardCheck,
  MoreHorizontal
} from 'lucide-react';

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================
// Note: Mobile nav is limited to 5 items for best UX. QC is accessible via
// dashboard quick actions or from project detail views.

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'rfis', label: 'RFIs', icon: MessageSquare },
  { id: 'more', label: 'More', icon: MoreHorizontal }
];

// ============================================================================
// STYLES
// ============================================================================

// Sunbelt dark mode colors
const SUNBELT_COLORS = {
  orange: '#FF6B35',
  orangeLight: '#F2A541',
  darkBlue: '#0f172a',
  mediumBlue: '#1e3a5f',
  navBg: '#0a1628',
  navBorder: '#1e3a5f',
  textMuted: '#64748b',
  textActive: '#FF6B35'
};

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    background: SUNBELT_COLORS.navBg,
    borderTop: `1px solid ${SUNBELT_COLORS.navBorder}`,
    // More padding at top and generous bottom padding for phones
    padding: '12px 0',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 8px))'
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    // Larger tap targets
    padding: '10px 8px',
    minHeight: '56px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: SUNBELT_COLORS.textMuted,
    transition: 'color 0.15s ease, transform 0.1s ease'
  },
  navItemActive: {
    color: SUNBELT_COLORS.textActive
  },
  navIcon: {
    marginBottom: '4px'
  },
  navLabel: {
    fontSize: '0.7rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginTop: '2px'
  },
  badge: {
    position: 'absolute',
    top: '4px',
    right: '50%',
    transform: 'translateX(16px)',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    background: SUNBELT_COLORS.orange,
    borderRadius: '10px',
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ManagerNav({ currentView, onViewChange, badges = {} }) {
  return (
    <nav style={styles.nav}>
      {NAV_ITEMS.map(item => {
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
