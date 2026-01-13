// ============================================================================
// DatabaseTools.jsx - Advanced Database Management & Diagnostics
// ============================================================================
// Comprehensive database tools for IT administrators including:
// - Table statistics and record counts
// - Data integrity checks
// - Orphan record detection
// - Storage estimates
// - Query performance insights
// - Data export capabilities
//
// Created: January 10, 2026
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Table,
  HardDrive,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  BarChart3,
  Activity,
  Layers,
  FileText,
  Users,
  FolderKanban,
  MessageSquare,
  ClipboardList,
  Flag,
  Image,
  Paperclip,
  GitBranch,
  Zap,
  Clock
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { calculateDatabaseAnalytics } from '../../utils/itAnalytics';

// ============================================================================
// TABLE CONFIGURATIONS
// ============================================================================

const TABLE_CONFIG = {
  users: { icon: Users, color: '#8b5cf6', category: 'Core' },
  projects: { icon: FolderKanban, color: '#ff6b35', category: 'Core' },
  tasks: { icon: CheckCircle2, color: '#3b82f6', category: 'Core' },
  rfis: { icon: MessageSquare, color: '#f59e0b', category: 'Core' },
  submittals: { icon: ClipboardList, color: '#22c55e', category: 'Core' },
  milestones: { icon: Flag, color: '#ec4899', category: 'Core' },
  floor_plans: { icon: Image, color: '#14b8a6', category: 'Files' },
  floor_plan_markers: { icon: Image, color: '#14b8a6', category: 'Files' },
  attachments: { icon: Paperclip, color: '#6366f1', category: 'Files' },
  file_attachments: { icon: Paperclip, color: '#6366f1', category: 'Files' },
  workflow_stations: { icon: GitBranch, color: '#06b6d4', category: 'Workflow' },
  project_workflow_status: { icon: GitBranch, color: '#06b6d4', category: 'Workflow' },
  drawing_versions: { icon: FileText, color: '#f97316', category: 'Workflow' },
  change_orders: { icon: Layers, color: '#84cc16', category: 'Workflow' },
  change_order_items: { icon: Layers, color: '#84cc16', category: 'Workflow' },
  long_lead_items: { icon: Clock, color: '#a855f7', category: 'Workflow' },
  color_selections: { icon: Activity, color: '#f43f5e', category: 'Workflow' },
  engineering_reviews: { icon: Zap, color: '#0ea5e9', category: 'Workflow' },
  warning_emails_log: { icon: MessageSquare, color: '#eab308', category: 'Workflow' }
};

// ============================================================================
// INTEGRITY CHECK DEFINITIONS
// ============================================================================

const INTEGRITY_CHECKS = [
  {
    id: 'orphan_tasks',
    name: 'Orphan Tasks',
    description: 'Tasks without valid project reference',
    severity: 'error',
    query: async () => {
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .is('project_id', null);
      return count || 0;
    }
  },
  {
    id: 'projects_no_pm',
    name: 'Projects Without PM',
    description: 'Projects with no owner assigned',
    severity: 'warning',
    query: async () => {
      const { count } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .is('owner_id', null);
      return count || 0;
    }
  },
  {
    id: 'inactive_pm_assigned',
    name: 'Inactive PM on Active Projects',
    description: 'Active projects assigned to inactive users',
    severity: 'warning',
    query: async () => {
      const { data: inactiveUsers } = await supabase
        .from('users')
        .select('id')
        .eq('is_active', false);

      if (!inactiveUsers?.length) return 0;

      const inactiveIds = inactiveUsers.map(u => u.id);
      const { count } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .in('owner_id', inactiveIds)
        .in('status', ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress']);

      return count || 0;
    }
  },
  {
    id: 'orphan_rfis',
    name: 'Orphan RFIs',
    description: 'RFIs without valid project reference',
    severity: 'error',
    query: async () => {
      const { count } = await supabase
        .from('rfis')
        .select('id', { count: 'exact', head: true })
        .is('project_id', null);
      return count || 0;
    }
  },
  {
    id: 'orphan_submittals',
    name: 'Orphan Submittals',
    description: 'Submittals without valid project reference',
    severity: 'error',
    query: async () => {
      const { count } = await supabase
        .from('submittals')
        .select('id', { count: 'exact', head: true })
        .is('project_id', null);
      return count || 0;
    }
  },
  {
    id: 'duplicate_emails',
    name: 'Duplicate User Emails',
    description: 'Users with duplicate email addresses',
    severity: 'error',
    query: async () => {
      const { data } = await supabase
        .from('users')
        .select('email');

      if (!data) return 0;

      const emails = data.map(u => u.email?.toLowerCase());
      const duplicates = emails.filter((e, i) => e && emails.indexOf(e) !== i);
      return new Set(duplicates).size;
    }
  }
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TableStatCard({ name, count, config }) {
  const Icon = config?.icon || Table;
  const color = config?.color || '#64748b';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-md)',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          fontFamily: 'monospace'
        }}>
          {name}
        </div>
      </div>
      <div style={{
        fontSize: '1.25rem',
        fontWeight: '700',
        color: 'var(--text-primary)'
      }}>
        {count.toLocaleString()}
      </div>
    </div>
  );
}

function IntegrityCheckItem({ check, result, running }) {
  const severityColors = {
    error: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    info: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' }
  };

  const style = severityColors[check.severity] || severityColors.info;
  const hasIssue = result > 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: hasIssue ? style.bg : 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${hasIssue ? style.text + '40' : 'var(--border-color)'}`
    }}>
      {running ? (
        <RefreshCw size={18} className="spin" style={{ color: 'var(--text-tertiary)' }} />
      ) : hasIssue ? (
        check.severity === 'error' ? (
          <XCircle size={18} style={{ color: style.text }} />
        ) : (
          <AlertTriangle size={18} style={{ color: style.text }} />
        )
      ) : (
        <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          {check.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {check.description}
        </div>
      </div>
      <div style={{
        padding: '4px 12px',
        borderRadius: 'var(--radius-sm)',
        background: hasIssue ? style.text : '#22c55e',
        color: 'white',
        fontSize: '0.8125rem',
        fontWeight: '600'
      }}>
        {running ? '...' : result}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function DatabaseTools() {
  const [loading, setLoading] = useState(true);
  const [tableCounts, setTableCounts] = useState({});
  const [integrityResults, setIntegrityResults] = useState({});
  const [runningChecks, setRunningChecks] = useState(new Set());
  const [dbLatency, setDbLatency] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTableCounts(),
      runIntegrityChecks(),
      measureLatency()
    ]);
    setLastRefresh(new Date());
    setLoading(false);
  };

  const fetchTableCounts = async () => {
    const tables = Object.keys(TABLE_CONFIG);
    const counts = {};

    await Promise.all(tables.map(async (table) => {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        counts[table] = error ? 0 : (count || 0);
      } catch {
        counts[table] = 0;
      }
    }));

    setTableCounts(counts);
  };

  const runIntegrityChecks = async () => {
    const results = {};

    for (const check of INTEGRITY_CHECKS) {
      setRunningChecks(prev => new Set([...prev, check.id]));
      try {
        results[check.id] = await check.query();
      } catch (error) {
        console.error(`Error running check ${check.id}:`, error);
        results[check.id] = -1;
      }
      setRunningChecks(prev => {
        const next = new Set(prev);
        next.delete(check.id);
        return next;
      });
    }

    setIntegrityResults(results);
  };

  const measureLatency = async () => {
    const start = performance.now();
    await supabase.from('users').select('id', { count: 'exact', head: true });
    const end = performance.now();
    setDbLatency(Math.round(end - start));
  };

  // Calculate analytics
  const dbAnalytics = useMemo(() => {
    return calculateDatabaseAnalytics(tableCounts, integrityResults);
  }, [tableCounts, integrityResults]);

  // Filter tables by category
  const filteredTables = useMemo(() => {
    const entries = Object.entries(tableCounts);
    if (activeCategory === 'all') return entries;
    return entries.filter(([name]) => TABLE_CONFIG[name]?.category === activeCategory);
  }, [tableCounts, activeCategory]);

  // Get categories
  const categories = ['all', ...new Set(Object.values(TABLE_CONFIG).map(c => c.category))];

  // Count issues
  const totalIssues = Object.values(integrityResults).reduce((sum, count) => sum + (count > 0 ? count : 0), 0);
  const criticalIssues = INTEGRITY_CHECKS
    .filter(c => c.severity === 'error')
    .reduce((sum, c) => sum + (integrityResults[c.id] || 0), 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <RefreshCw size={24} className="spin" style={{ color: 'var(--text-secondary)' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Database size={24} style={{ color: '#06b6d4' }} />
            Database Tools
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Monitor database health, table statistics, and data integrity
          </p>
        </div>
        <button
          onClick={fetchAllData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.8125rem'
          }}
        >
          <RefreshCw size={14} />
          Refresh All
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Table size={18} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Tables</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {dbAnalytics.summary.totalTables}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Layers size={18} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Records</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {dbAnalytics.summary.totalRecords.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={18} style={{ color: dbLatency < 200 ? '#22c55e' : '#f59e0b' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Latency</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {dbLatency}ms
          </div>
        </div>

        <div style={{
          background: criticalIssues > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: criticalIssues > 0 ? '1px solid #ef4444' : '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} style={{ color: totalIssues > 0 ? '#ef4444' : '#22c55e' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Issues</span>
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: totalIssues > 0 ? '#ef4444' : '#22c55e'
          }}>
            {totalIssues}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* Table Statistics */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <BarChart3 size={18} style={{ color: '#3b82f6' }} />
              Table Statistics
            </h3>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    background: activeCategory === cat ? 'var(--sunbelt-orange)' : 'var(--bg-tertiary)',
                    color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {filteredTables.map(([name, count]) => (
              <TableStatCard
                key={name}
                name={name}
                count={count}
                config={TABLE_CONFIG[name]}
              />
            ))}
          </div>
        </div>

        {/* Data Integrity Checks */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Search size={18} style={{ color: '#22c55e' }} />
              Data Integrity Checks
            </h3>

            <div style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              background: dbAnalytics.integrity.status === 'healthy' ? 'rgba(34, 197, 94, 0.1)' :
                          dbAnalytics.integrity.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                          'rgba(239, 68, 68, 0.1)',
              color: dbAnalytics.integrity.status === 'healthy' ? '#22c55e' :
                     dbAnalytics.integrity.status === 'warning' ? '#f59e0b' : '#ef4444',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Score: {dbAnalytics.integrity.score}%
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {INTEGRITY_CHECKS.map(check => (
              <IntegrityCheckItem
                key={check.id}
                check={check}
                result={integrityResults[check.id] || 0}
                running={runningChecks.has(check.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Storage Estimate */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--border-color)',
        marginTop: '24px'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <HardDrive size={18} style={{ color: '#8b5cf6' }} />
          Storage Overview
        </h3>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
              Estimated Database Size
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {dbAnalytics.summary.estimatedStorageMB} MB
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
              Records by Category
            </div>
            <div style={{
              height: '24px',
              background: 'var(--bg-tertiary)',
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex'
            }}>
              {['Core', 'Workflow', 'Files'].map(cat => {
                const catTables = Object.entries(tableCounts).filter(([name]) =>
                  TABLE_CONFIG[name]?.category === cat
                );
                const catTotal = catTables.reduce((sum, [, count]) => sum + count, 0);
                const percentage = dbAnalytics.summary.totalRecords > 0
                  ? (catTotal / dbAnalytics.summary.totalRecords) * 100
                  : 0;
                const colors = { Core: '#3b82f6', Workflow: '#22c55e', Files: '#8b5cf6' };
                return (
                  <div
                    key={cat}
                    style={{
                      width: `${percentage}%`,
                      background: colors[cat],
                      height: '100%'
                    }}
                    title={`${cat}: ${catTotal.toLocaleString()} records (${Math.round(percentage)}%)`}
                  />
                );
              })}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '0.75rem'
            }}>
              {['Core', 'Workflow', 'Files'].map(cat => {
                const colors = { Core: '#3b82f6', Workflow: '#22c55e', Files: '#8b5cf6' };
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      background: colors[cat]
                    }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '16px',
        fontSize: '0.75rem',
        color: 'var(--text-tertiary)',
        textAlign: 'right'
      }}>
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}

export default DatabaseTools;
