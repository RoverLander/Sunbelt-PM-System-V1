// ============================================================================
// PWAHome.jsx - PWA Home/Dashboard Page
// ============================================================================
// Home page for the PWA showing quick actions and recent activity.
//
// Created: January 17, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useWorkerAuth } from '../contexts/WorkerAuthContext';
import {
  Search,
  ClipboardCheck,
  Package,
  ArrowRight,
  Box,
  Clock,
  CheckCircle2,
  AlertCircle,
  Factory,
  MoveRight
} from 'lucide-react';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xl)'
  },
  greeting: {
    marginBottom: 'var(--space-md)'
  },
  greetingText: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
  },
  greetingSubtext: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    margin: 'var(--space-xs) 0 0'
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-md)'
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-lg)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'center'
  },
  actionCardPrimary: {
    background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
    border: 'none',
    color: 'white'
  },
  actionIcon: {
    marginBottom: 'var(--space-sm)'
  },
  actionLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    margin: 0
  },
  actionDesc: {
    fontSize: '0.75rem',
    opacity: 0.8,
    margin: 'var(--space-xs) 0 0'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
  },
  sectionLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    fontSize: '0.75rem',
    color: 'var(--accent-primary)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0
  },
  statCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-sm)'
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)'
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  statLabel: {
    fontSize: '0.625rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginTop: 'var(--space-xs)'
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)',
    cursor: 'pointer'
  },
  recentIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-tertiary)'
  },
  recentContent: {
    flex: 1,
    minWidth: 0
  },
  recentTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  recentMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    margin: 'var(--space-xs) 0 0'
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-tertiary)'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PWAHome({ onNavigate }) {
  const { worker, factoryId, isLead } = useWorkerAuth();
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, issues: 0 });

  // ==========================================================================
  // GREETING
  // ==========================================================================
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = worker?.name?.split(' ')[0] || 'Worker';

  // ==========================================================================
  // QUICK ACTIONS
  // ==========================================================================
  const quickActions = [
    {
      id: 'modules',
      icon: Search,
      label: 'Find Module',
      desc: 'Lookup by serial',
      primary: true
    },
    ...(isLead ? [{
      id: 'stationmove',
      icon: MoveRight,
      label: 'Move Module',
      desc: 'To next station'
    }] : []),
    ...(isLead ? [{
      id: 'qc',
      icon: ClipboardCheck,
      label: 'QC Inspection',
      desc: 'Run checklist'
    }] : []),
    {
      id: 'inventory',
      icon: Package,
      label: 'Receive Inventory',
      desc: 'Scan delivery'
    }
  ];

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div style={styles.container}>
      {/* Greeting */}
      <div style={styles.greeting}>
        <h1 style={styles.greetingText}>{getGreeting()}, {firstName}</h1>
        <p style={styles.greetingSubtext}>
          <Factory size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {worker?.factory?.name || 'Factory Floor'}
        </p>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              onClick={() => onNavigate(action.id)}
              style={{
                ...styles.actionCard,
                ...(action.primary ? styles.actionCardPrimary : {})
              }}
            >
              <Icon
                size={32}
                style={styles.actionIcon}
                color={action.primary ? 'white' : 'var(--accent-primary)'}
              />
              <p style={styles.actionLabel}>{action.label}</p>
              <p style={{
                ...styles.actionDesc,
                color: action.primary ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)'
              }}>
                {action.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Today's Stats */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Today's Activity</h2>
        </div>
        <div style={styles.statCards}>
          <div style={styles.statCard}>
            <Clock size={20} color="var(--accent-primary)" />
            <span style={styles.statValue}>{stats.pending}</span>
            <span style={styles.statLabel}>Pending</span>
          </div>
          <div style={styles.statCard}>
            <CheckCircle2 size={20} color="#22c55e" />
            <span style={styles.statValue}>{stats.completed}</span>
            <span style={styles.statLabel}>Completed</span>
          </div>
          <div style={styles.statCard}>
            <AlertCircle size={20} color="#f59e0b" />
            <span style={styles.statValue}>{stats.issues}</span>
            <span style={styles.statLabel}>Issues</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <button style={styles.sectionLink}>
            View all <ArrowRight size={12} />
          </button>
        </div>

        <div style={styles.recentList}>
          {recentActivity.length > 0 ? (
            recentActivity.map((item, index) => (
              <div key={index} style={styles.recentItem}>
                <div style={styles.recentIcon}>
                  <Box size={20} color="var(--text-secondary)" />
                </div>
                <div style={styles.recentContent}>
                  <p style={styles.recentTitle}>{item.title}</p>
                  <p style={styles.recentMeta}>{item.time}</p>
                </div>
                <ArrowRight size={16} color="var(--text-tertiary)" />
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <Box size={32} style={{ marginBottom: 'var(--space-sm)', opacity: 0.5 }} />
              <p>No recent activity</p>
              <p style={{ fontSize: '0.75rem' }}>Start by finding a module</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
