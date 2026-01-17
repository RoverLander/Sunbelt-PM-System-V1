// ============================================================================
// MorePage.jsx - More/Settings Page for Manager PWA
// ============================================================================
// Settings, profile info, and additional options.
//
// Created: January 17, 2026
// ============================================================================

import React from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import {
  User,
  Building2,
  Shield,
  Bell,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  ExternalLink,
  Smartphone,
  ClipboardCheck
} from 'lucide-react';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)',
    width: '100%',
    maxWidth: '100%'
  },
  profileCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    padding: 'var(--space-xl)',
    textAlign: 'center'
  },
  avatar: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto var(--space-md)',
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: '600'
  },
  profileName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
  },
  profileRole: {
    fontSize: '0.875rem',
    color: 'var(--accent-primary)',
    marginTop: 'var(--space-xs)',
    textTransform: 'capitalize'
  },
  profileEmail: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: 'var(--space-xs)'
  },
  section: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    overflow: 'hidden'
  },
  sectionTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: 'var(--space-md) var(--space-lg)',
    background: 'var(--bg-tertiary)',
    margin: 0
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-md) var(--space-lg)',
    borderBottom: '1px solid var(--border-primary)',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'background 0.15s ease'
  },
  menuItemLast: {
    borderBottom: 'none'
  },
  menuItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  menuIcon: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuLabel: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  menuDescription: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  menuItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    color: 'var(--text-tertiary)'
  },
  badge: {
    padding: '2px 8px',
    background: 'var(--accent-primary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.625rem',
    fontWeight: '600',
    color: 'white'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    width: '100%',
    padding: 'var(--space-md)',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 'var(--radius-lg)',
    color: '#ef4444',
    fontSize: '0.9375rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.15s ease'
  },
  version: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginTop: 'var(--space-md)'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function MorePage({ onNavigate }) {
  const { user, userName, userEmail, userRole, logout } = useManagerAuth();

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  const getInitials = () => {
    if (!userName) return '?';
    return userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRoleDisplay = () => {
    const roleMap = {
      'pm': 'Project Manager',
      'pc': 'Project Coordinator',
      'vp': 'Vice President',
      'director': 'Director',
      'admin': 'Administrator',
      'it': 'IT',
      'it_manager': 'IT Manager'
    };
    return roleMap[userRole] || userRole;
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div style={styles.container}>
      {/* Profile Card */}
      <div style={styles.profileCard}>
        <div style={styles.avatar}>
          {getInitials()}
        </div>
        <h2 style={styles.profileName}>{userName || 'User'}</h2>
        <div style={styles.profileRole}>{getRoleDisplay()}</div>
        <div style={styles.profileEmail}>{userEmail}</div>
      </div>

      {/* Tools Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Tools</h3>

        <button
          style={{ ...styles.menuItem, ...styles.menuItemLast }}
          onClick={() => onNavigate && onNavigate('qc')}
        >
          <div style={styles.menuItemLeft}>
            <div style={{ ...styles.menuIcon, background: 'rgba(34, 197, 94, 0.15)' }}>
              <ClipboardCheck size={20} color="#22c55e" />
            </div>
            <div>
              <div style={styles.menuLabel}>QC Summary</div>
              <div style={styles.menuDescription}>Quality control overview</div>
            </div>
          </div>
          <div style={styles.menuItemRight}>
            <ChevronRight size={20} />
          </div>
        </button>
      </div>

      {/* Account Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Account</h3>

        <button style={styles.menuItem}>
          <div style={styles.menuItemLeft}>
            <div style={{ ...styles.menuIcon, background: 'rgba(59, 130, 246, 0.15)' }}>
              <User size={20} color="#3b82f6" />
            </div>
            <div>
              <div style={styles.menuLabel}>Profile Settings</div>
              <div style={styles.menuDescription}>Update your information</div>
            </div>
          </div>
          <div style={styles.menuItemRight}>
            <ChevronRight size={20} />
          </div>
        </button>

        <button style={{ ...styles.menuItem, ...styles.menuItemLast }}>
          <div style={styles.menuItemLeft}>
            <div style={{ ...styles.menuIcon, background: 'rgba(168, 85, 247, 0.15)' }}>
              <Bell size={20} color="#a855f7" />
            </div>
            <div>
              <div style={styles.menuLabel}>Notifications</div>
              <div style={styles.menuDescription}>Manage push notifications</div>
            </div>
          </div>
          <div style={styles.menuItemRight}>
            <span style={styles.badge}>Coming Soon</span>
          </div>
        </button>
      </div>

      {/* Support Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Support</h3>

        <button style={styles.menuItem}>
          <div style={styles.menuItemLeft}>
            <div style={{ ...styles.menuIcon, background: 'rgba(34, 197, 94, 0.15)' }}>
              <HelpCircle size={20} color="#22c55e" />
            </div>
            <div>
              <div style={styles.menuLabel}>Help & Support</div>
              <div style={styles.menuDescription}>Get help with the app</div>
            </div>
          </div>
          <div style={styles.menuItemRight}>
            <ChevronRight size={20} />
          </div>
        </button>

        <button style={{ ...styles.menuItem, ...styles.menuItemLast }}>
          <div style={styles.menuItemLeft}>
            <div style={{ ...styles.menuIcon, background: 'rgba(245, 158, 11, 0.15)' }}>
              <ExternalLink size={20} color="#f59e0b" />
            </div>
            <div>
              <div style={styles.menuLabel}>Open Desktop App</div>
              <div style={styles.menuDescription}>Full features on desktop</div>
            </div>
          </div>
          <div style={styles.menuItemRight}>
            <ChevronRight size={20} />
          </div>
        </button>
      </div>

      {/* About Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>About</h3>

        <div style={{ ...styles.menuItem, ...styles.menuItemLast, cursor: 'default' }}>
          <div style={styles.menuItemLeft}>
            <div style={{ ...styles.menuIcon, background: 'rgba(107, 114, 128, 0.15)' }}>
              <Smartphone size={20} color="#6b7280" />
            </div>
            <div>
              <div style={styles.menuLabel}>Sunbelt PM Manager</div>
              <div style={styles.menuDescription}>Mobile App for Management</div>
            </div>
          </div>
          <div style={styles.menuItemRight}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>v1.0.0</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button style={styles.logoutButton} onClick={handleLogout}>
        <LogOut size={20} />
        Sign Out
      </button>

      {/* Version */}
      <div style={styles.version}>
        Sunbelt Modular Inc. &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
