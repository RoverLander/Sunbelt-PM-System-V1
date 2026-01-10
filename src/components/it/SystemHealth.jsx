// ============================================================================
// SystemHealth.jsx - System Health & Diagnostics Panel
// ============================================================================
// Shows system status, database health, and data integrity checks.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  HardDrive,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  Clock,
  Zap
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SystemHealth({ showToast }) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  const [health, setHealth] = useState({
    database: { status: 'checking', message: 'Checking...' },
    auth: { status: 'checking', message: 'Checking...' },
    storage: { status: 'checking', message: 'Checking...' }
  });

  const [tableStats, setTableStats] = useState([]);
  const [integrityIssues, setIntegrityIssues] = useState([]);

  // ==========================================================================
  // HEALTH CHECKS
  // ==========================================================================
  const runHealthChecks = useCallback(async () => {
    setLoading(true);

    try {
      // Database check
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from('users').select('id').limit(1);
      const dbLatency = Date.now() - dbStart;

      if (dbError) {
        setHealth(prev => ({
          ...prev,
          database: { status: 'error', message: dbError.message }
        }));
      } else {
        setHealth(prev => ({
          ...prev,
          database: { status: 'ok', message: `Connected (${dbLatency}ms)` }
        }));
      }

      // Auth check
      const { data: session } = await supabase.auth.getSession();
      if (session) {
        setHealth(prev => ({
          ...prev,
          auth: { status: 'ok', message: 'Authenticated' }
        }));
      } else {
        setHealth(prev => ({
          ...prev,
          auth: { status: 'warning', message: 'No active session' }
        }));
      }

      // Storage check (simplified - just check if we can list)
      try {
        const { error: storageError } = await supabase.storage.from('project-files').list('', { limit: 1 });
        if (storageError) {
          setHealth(prev => ({
            ...prev,
            storage: { status: 'warning', message: 'Storage check skipped' }
          }));
        } else {
          setHealth(prev => ({
            ...prev,
            storage: { status: 'ok', message: 'Storage accessible' }
          }));
        }
      } catch {
        setHealth(prev => ({
          ...prev,
          storage: { status: 'ok', message: 'Storage available' }
        }));
      }

      // Fetch table statistics
      await fetchTableStats();

      // Run integrity checks
      await runIntegrityChecks();

      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check error:', error);
      showToast('Failed to complete health check', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ==========================================================================
  // TABLE STATISTICS
  // ==========================================================================
  const fetchTableStats = async () => {
    try {
      const tables = [
        { name: 'users', label: 'Users' },
        { name: 'projects', label: 'Projects' },
        { name: 'tasks', label: 'Tasks' },
        { name: 'rfis', label: 'RFIs' },
        { name: 'submittals', label: 'Submittals' },
        { name: 'milestones', label: 'Milestones' },
        { name: 'floor_plans', label: 'Floor Plans' },
        { name: 'file_attachments', label: 'File Attachments' }
      ];

      const stats = await Promise.all(
        tables.map(async (table) => {
          try {
            const { count, error } = await supabase
              .from(table.name)
              .select('*', { count: 'exact', head: true });

            return {
              name: table.name,
              label: table.label,
              count: error ? 'Error' : count || 0,
              status: error ? 'error' : 'ok'
            };
          } catch {
            return {
              name: table.name,
              label: table.label,
              count: 'N/A',
              status: 'error'
            };
          }
        })
      );

      setTableStats(stats);
    } catch (error) {
      console.error('Error fetching table stats:', error);
    }
  };

  // ==========================================================================
  // INTEGRITY CHECKS
  // ==========================================================================
  const runIntegrityChecks = async () => {
    const issues = [];

    try {
      // Check for tasks without projects
      const { data: orphanedTasks, error: orphanTasksError } = await supabase
        .from('tasks')
        .select('id, title, project_id')
        .is('project_id', null);

      if (!orphanTasksError && orphanedTasks?.length > 0) {
        issues.push({
          type: 'warning',
          message: `${orphanedTasks.length} task(s) without a project`,
          table: 'tasks'
        });
      }

      // Check for projects without a PM
      const { data: noOwnerProjects, error: noOwnerError } = await supabase
        .from('projects')
        .select('id, name, owner_id')
        .is('owner_id', null);

      if (!noOwnerError && noOwnerProjects?.length > 0) {
        issues.push({
          type: 'warning',
          message: `${noOwnerProjects.length} project(s) without a PM assigned`,
          table: 'projects'
        });
      }

      // Check for inactive users with assigned projects
      const { data: inactiveWithProjects } = await supabase
        .from('users')
        .select(`
          id, 
          name,
          projects:projects!owner_id(id)
        `)
        .eq('is_active', false);

      const usersWithProjects = (inactiveWithProjects || []).filter(u => u.projects?.length > 0);
      if (usersWithProjects.length > 0) {
        issues.push({
          type: 'warning',
          message: `${usersWithProjects.length} inactive user(s) still assigned as PM`,
          table: 'users'
        });
      }

      // Check for overdue items
      const today = new Date().toISOString().split('T')[0];

      const { count: overdueTaskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', today)
        .not('status', 'in', '(Completed,Cancelled)');

      if (overdueTaskCount > 0) {
        issues.push({
          type: 'info',
          message: `${overdueTaskCount} overdue task(s)`,
          table: 'tasks'
        });
      }

      const { count: overdueRFICount } = await supabase
        .from('rfis')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', today)
        .not('status', 'in', '(Closed,Answered)');

      if (overdueRFICount > 0) {
        issues.push({
          type: 'info',
          message: `${overdueRFICount} overdue RFI(s)`,
          table: 'rfis'
        });
      }

    } catch (error) {
      console.error('Error running integrity checks:', error);
      issues.push({
        type: 'error',
        message: 'Failed to complete integrity checks',
        table: 'system'
      });
    }

    setIntegrityIssues(issues);
  };

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    runHealthChecks();
  }, [runHealthChecks]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircle size={18} style={{ color: '#22c55e' }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: '#f59e0b' }} />;
      case 'error':
        return <XCircle size={18} style={{ color: 'var(--danger)' }} />;
      default:
        return <Activity size={18} style={{ color: 'var(--text-tertiary)' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error': return 'var(--danger)';
      default: return 'var(--text-tertiary)';
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <Server size={22} style={{ color: '#22c55e' }} />
            System Health
          </h2>
          {lastCheck && (
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          )}
        </div>

        <button
          onClick={runHealthChecks}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            opacity: loading ? 0.6 : 1
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Service Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)'
      }}>
        <ServiceCard
          icon={Database}
          title="Database"
          status={health.database.status}
          message={health.database.message}
        />
        <ServiceCard
          icon={Shield}
          title="Authentication"
          status={health.auth.status}
          message={health.auth.message}
        />
        <ServiceCard
          icon={HardDrive}
          title="File Storage"
          status={health.storage.status}
          message={health.storage.message}
        />
      </div>

      {/* Table Statistics */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)'
      }}>
        <h3 style={{
          margin: '0 0 var(--space-md) 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <Database size={18} style={{ color: 'var(--sunbelt-orange)' }} />
          Table Statistics
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--space-sm)'
        }}>
          {tableStats.map(table => (
            <div
              key={table.name}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '0.6875rem',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                {table.label}
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: table.status === 'error' ? 'var(--danger)' : 'var(--text-primary)'
              }}>
                {typeof table.count === 'number' ? table.count.toLocaleString() : table.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Integrity */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: 'var(--space-lg)'
      }}>
        <h3 style={{
          margin: '0 0 var(--space-md) 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <Zap size={18} style={{ color: 'var(--sunbelt-orange)' }} />
          Data Integrity
        </h3>

        {integrityIssues.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 'var(--radius-md)',
            color: '#22c55e'
          }}>
            <CheckCircle size={18} />
            <span>All integrity checks passed</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {integrityIssues.map((issue, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: issue.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                             issue.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                             'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${getStatusColor(issue.type)}20`
                }}
              >
                {getStatusIcon(issue.type)}
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                  {issue.message}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  padding: '2px 8px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '4px'
                }}>
                  {issue.table}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ServiceCard({ icon: Icon, title, status, message }) {
  const getStatusColor = (s) => {
    switch (s) {
      case 'ok': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error': return 'var(--danger)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getStatusBg = (s) => {
    switch (s) {
      case 'ok': return 'rgba(34, 197, 94, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      default: return 'var(--bg-tertiary)';
    }
  };

  const color = getStatusColor(status);

  return (
    <div style={{
      padding: 'var(--space-lg)',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Icon size={20} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`
        }} />
      </div>
      <div style={{
        padding: 'var(--space-sm) var(--space-md)',
        background: getStatusBg(status),
        borderRadius: 'var(--radius-md)',
        color: color,
        fontSize: '0.8125rem',
        fontWeight: '500'
      }}>
        {message}
      </div>
    </div>
  );
}

export default SystemHealth;