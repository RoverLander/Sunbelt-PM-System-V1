// ============================================================================
// QCSummary.jsx - QC Summary Page for Manager PWA
// ============================================================================
// Displays QC inspection overview - pass rates, recent inspections, failures.
// Links to desktop app for full QC management.
//
// Created: January 17, 2026
// Phase 5 Implementation
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import { supabase } from '../../../utils/supabaseClient';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Calendar,
  Box,
  ExternalLink
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-md)'
  },
  statCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    padding: 'var(--space-lg)'
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--space-sm)'
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: 1
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '4px'
  },
  section: {
    marginTop: 'var(--space-md)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-md)'
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    margin: 0
  },
  viewAllButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent-primary)',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  listCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    overflow: 'hidden'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--space-md) var(--space-lg)',
    borderBottom: '1px solid var(--border-primary)'
  },
  listItemLast: {
    borderBottom: 'none'
  },
  listItemIcon: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 'var(--space-md)',
    flexShrink: 0
  },
  listItemContent: {
    flex: 1,
    minWidth: 0
  },
  listItemTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  listItemSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.625rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    flexShrink: 0
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-tertiary)'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  },
  desktopLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    textDecoration: 'none',
    marginTop: 'var(--space-md)'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function QCSummary() {
  const { userId, canViewAllProjects } = useManagerAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    passRate: 0
  });
  const [recentInspections, setRecentInspections] = useState([]);
  const [failedInspections, setFailedInspections] = useState([]);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================

  const fetchQCData = useCallback(async () => {
    setLoading(true);

    try {
      // Get project IDs the user has access to
      let projectQuery = supabase.from('projects').select('id');

      if (!canViewAllProjects) {
        projectQuery = projectQuery.or(
          `owner_id.eq.${userId},primary_pm_id.eq.${userId},backup_pm_id.eq.${userId}`
        );
      }

      const { data: projects } = await projectQuery;
      const projectIds = projects?.map(p => p.id) || [];

      if (projectIds.length === 0) {
        setStats({ total: 0, passed: 0, failed: 0, pending: 0, passRate: 0 });
        setRecentInspections([]);
        setFailedInspections([]);
        setLoading(false);
        return;
      }

      // Get modules for these projects
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .in('project_id', projectIds);

      const moduleIds = modules?.map(m => m.id) || [];

      if (moduleIds.length === 0) {
        setStats({ total: 0, passed: 0, failed: 0, pending: 0, passRate: 0 });
        setRecentInspections([]);
        setFailedInspections([]);
        setLoading(false);
        return;
      }

      // Fetch QC records
      const { data: qcRecords, error } = await supabase
        .from('qc_records')
        .select(`
          id,
          status,
          passed,
          score,
          notes,
          inspected_at,
          module:modules(
            id,
            serial_number,
            project:projects(project_number, name)
          ),
          station:station_templates(name)
        `)
        .in('module_id', moduleIds)
        .order('inspected_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Calculate stats
      const total = qcRecords?.length || 0;
      const passed = qcRecords?.filter(r => r.passed === true || r.status === 'Passed').length || 0;
      const failed = qcRecords?.filter(r => r.passed === false || r.status === 'Failed' || r.status === 'Rework Required').length || 0;
      const pending = qcRecords?.filter(r => r.status === 'Pending').length || 0;
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

      setStats({ total, passed, failed, pending, passRate });

      // Get recent inspections (last 10)
      setRecentInspections(qcRecords?.slice(0, 10) || []);

      // Get failed inspections
      setFailedInspections(
        qcRecords?.filter(r => r.passed === false || r.status === 'Failed' || r.status === 'Rework Required').slice(0, 10) || []
      );

    } catch (err) {
      console.error('[QCSummary] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, canViewAllProjects]);

  useEffect(() => {
    if (userId) {
      fetchQCData();
    }
  }, [userId, fetchQCData]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status, passed) => {
    if (passed === true || status === 'Passed') return '#22c55e';
    if (passed === false || status === 'Failed' || status === 'Rework Required') return '#ef4444';
    if (status === 'Pending') return '#f59e0b';
    return '#6b7280';
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {/* Pass Rate */}
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'rgba(34, 197, 94, 0.15)' }}>
            <TrendingUp size={22} color="#22c55e" />
          </div>
          <div style={{ ...styles.statValue, color: '#22c55e' }}>
            {stats.passRate}%
          </div>
          <div style={styles.statLabel}>Pass Rate</div>
        </div>

        {/* Total Inspections */}
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'rgba(59, 130, 246, 0.15)' }}>
            <ClipboardCheck size={22} color="#3b82f6" />
          </div>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Inspections</div>
        </div>

        {/* Passed */}
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'rgba(34, 197, 94, 0.15)' }}>
            <CheckCircle size={22} color="#22c55e" />
          </div>
          <div style={{ ...styles.statValue, color: '#22c55e' }}>
            {stats.passed}
          </div>
          <div style={styles.statLabel}>Passed</div>
        </div>

        {/* Failed */}
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'rgba(239, 68, 68, 0.15)' }}>
            <XCircle size={22} color="#ef4444" />
          </div>
          <div style={{ ...styles.statValue, color: '#ef4444' }}>
            {stats.failed}
          </div>
          <div style={styles.statLabel}>Failed</div>
        </div>
      </div>

      {/* Failed Inspections */}
      {failedInspections.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Needs Attention</h3>
          </div>
          <div style={styles.listCard}>
            {failedInspections.map((inspection, index) => (
              <div
                key={inspection.id}
                style={{
                  ...styles.listItem,
                  ...(index === failedInspections.length - 1 ? styles.listItemLast : {})
                }}
              >
                <div style={{ ...styles.listItemIcon, background: 'rgba(239, 68, 68, 0.15)' }}>
                  <AlertTriangle size={18} color="#ef4444" />
                </div>
                <div style={styles.listItemContent}>
                  <div style={styles.listItemTitle}>
                    {inspection.module?.serial_number || 'Unknown Module'}
                  </div>
                  <div style={styles.listItemSubtitle}>
                    {inspection.station?.name || 'QC'} • {inspection.module?.project?.project_number || ''}
                  </div>
                </div>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444'
                  }}
                >
                  {inspection.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Inspections */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Recent Inspections</h3>
        </div>
        {recentInspections.length === 0 ? (
          <div style={styles.emptyState}>
            <ClipboardCheck size={40} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
            <p>No inspections recorded yet</p>
          </div>
        ) : (
          <div style={styles.listCard}>
            {recentInspections.map((inspection, index) => (
              <div
                key={inspection.id}
                style={{
                  ...styles.listItem,
                  ...(index === recentInspections.length - 1 ? styles.listItemLast : {})
                }}
              >
                <div
                  style={{
                    ...styles.listItemIcon,
                    background: `${getStatusColor(inspection.status, inspection.passed)}15`
                  }}
                >
                  {inspection.passed || inspection.status === 'Passed' ? (
                    <CheckCircle size={18} color="#22c55e" />
                  ) : inspection.passed === false || inspection.status === 'Failed' ? (
                    <XCircle size={18} color="#ef4444" />
                  ) : (
                    <ClipboardCheck size={18} color="#f59e0b" />
                  )}
                </div>
                <div style={styles.listItemContent}>
                  <div style={styles.listItemTitle}>
                    {inspection.module?.serial_number || 'Unknown Module'}
                  </div>
                  <div style={styles.listItemSubtitle}>
                    {inspection.station?.name || 'QC'} • {formatDate(inspection.inspected_at)}
                  </div>
                </div>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: `${getStatusColor(inspection.status, inspection.passed)}15`,
                    color: getStatusColor(inspection.status, inspection.passed)
                  }}
                >
                  {inspection.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Link */}
      <div style={styles.desktopLink}>
        <ExternalLink size={18} />
        Full QC Management on Desktop
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
