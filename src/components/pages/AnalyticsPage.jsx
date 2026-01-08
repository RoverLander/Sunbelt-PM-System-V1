// ============================================================================
// AnalyticsPage Component
// ============================================================================
// VP-level analytics page with:
// - Performance metrics over time
// - Project status distribution
// - Delivery performance breakdown
// - Resource utilization trends
// - Financial summaries
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  DollarSign,
  Clock,
  Target,
  Users,
  CheckCircle2,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatCurrency = (amount) => {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeRange, setTimeRange] = useState('year');

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('id, project_id, status, due_date, created_at, completed_at'),
        supabase.from('users').select('*').eq('is_active', true)
      ]);

      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // ANALYTICS CALCULATIONS
  // ==========================================================================
  const analytics = useMemo(() => {
    const now = new Date();
    const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];

    // ===== STATUS DISTRIBUTION =====
    const statusDistribution = {
      'Planning': projects.filter(p => p.status === 'Planning').length,
      'Pre-PM': projects.filter(p => p.status === 'Pre-PM').length,
      'PM Handoff': projects.filter(p => p.status === 'PM Handoff').length,
      'In Progress': projects.filter(p => p.status === 'In Progress').length,
      'On Hold': projects.filter(p => p.status === 'On Hold').length,
      'Completed': projects.filter(p => p.status === 'Completed').length,
      'Warranty': projects.filter(p => p.status === 'Warranty').length
    };

    // ===== MONTHLY TRENDS (last 12 months) =====
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const created = projects.filter(p => {
        const createdDate = new Date(p.created_at);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;

      const completed = projects.filter(p => {
        if (p.status !== 'Completed') return false;
        const completedDate = new Date(p.actual_completion_date || p.updated_at);
        return completedDate >= monthStart && completedDate <= monthEnd;
      }).length;

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        created,
        completed
      });
    }

    // ===== VALUE BY STATUS =====
    const valueByStatus = {
      active: projects.filter(p => activeStatuses.includes(p.status)).reduce((sum, p) => sum + (p.contract_value || 0), 0),
      completed: projects.filter(p => p.status === 'Completed').reduce((sum, p) => sum + (p.contract_value || 0), 0),
      onHold: projects.filter(p => p.status === 'On Hold').reduce((sum, p) => sum + (p.contract_value || 0), 0)
    };

    // ===== PM PERFORMANCE =====
    const pms = users.filter(u => ['Project Manager', 'Director', 'Admin'].includes(u.role));
    const pmPerformance = pms.map(pm => {
      const pmProjects = projects.filter(p => p.pm_id === pm.id);
      const activeProjects = pmProjects.filter(p => activeStatuses.includes(p.status));
      const completedProjects = pmProjects.filter(p => p.status === 'Completed');
      const totalValue = pmProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);

      return {
        id: pm.id,
        name: pm.name,
        total: pmProjects.length,
        active: activeProjects.length,
        completed: completedProjects.length,
        value: totalValue
      };
    }).sort((a, b) => b.total - a.total);

    // ===== TASK COMPLETION RATE =====
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // ===== AVERAGE PROJECT DURATION =====
    const completedWithDates = projects.filter(p => 
      p.status === 'Completed' && p.created_at && (p.actual_completion_date || p.updated_at)
    );
    const avgDurationDays = completedWithDates.length > 0
      ? Math.round(completedWithDates.reduce((sum, p) => {
          const start = new Date(p.created_at);
          const end = new Date(p.actual_completion_date || p.updated_at);
          return sum + ((end - start) / (1000 * 60 * 60 * 24));
        }, 0) / completedWithDates.length)
      : 0;

    return {
      statusDistribution,
      monthlyTrends,
      valueByStatus,
      pmPerformance,
      taskCompletionRate,
      avgDurationDays,
      totalProjects: projects.length,
      totalValue: projects.reduce((sum, p) => sum + (p.contract_value || 0), 0)
    };
  }, [projects, tasks, users]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={28} style={{ color: 'var(--sunbelt-orange)' }} />
          Portfolio Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Deep-dive into performance metrics and trends
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: 'var(--space-lg)' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Target size={18} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Task Completion</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{analytics.taskCompletionRate}%</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Clock size={18} style={{ color: 'var(--info)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Avg Duration</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{analytics.avgDurationDays} days</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Value</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(analytics.totalValue)}</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Activity size={18} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Projects</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{analytics.totalProjects}</div>
        </div>
      </div>

      {/* Status Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 'var(--space-lg)' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Status Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(analytics.statusDistribution).map(([status, count]) => {
              const total = analytics.totalProjects || 1;
              const percentage = Math.round((count / total) * 100);
              const colors = {
                'Planning': '#3b82f6',
                'Pre-PM': '#f59e0b',
                'PM Handoff': '#f59e0b',
                'In Progress': 'var(--sunbelt-orange)',
                'On Hold': '#6b7280',
                'Completed': '#22c55e',
                'Warranty': '#8b5cf6'
              };

              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{status}</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{count} ({percentage}%)</span>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percentage}%`, background: colors[status] || 'var(--text-tertiary)', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Value by Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--sunbelt-orange)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active Projects</span>
              </div>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.125rem' }}>{formatCurrency(analytics.valueByStatus.active)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#22c55e' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Completed</span>
              </div>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.125rem' }}>{formatCurrency(analytics.valueByStatus.completed)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#6b7280' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>On Hold</span>
              </div>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.125rem' }}>{formatCurrency(analytics.valueByStatus.onHold)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)', marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Monthly Project Trends (12 months)</h3>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--sunbelt-orange)' }} />
            Created
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#22c55e' }} />
            Completed
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '150px' }}>
          {analytics.monthlyTrends.map((month, idx) => {
            const maxVal = Math.max(...analytics.monthlyTrends.flatMap(m => [m.created, m.completed]), 1);
            const createdHeight = (month.created / maxVal) * 100;
            const completedHeight = (month.completed / maxVal) * 100;

            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '120px' }}>
                  <div style={{
                    width: '12px',
                    height: `${createdHeight}%`,
                    minHeight: month.created > 0 ? '8px' : '2px',
                    background: 'var(--sunbelt-orange)',
                    borderRadius: '2px 2px 0 0'
                  }} />
                  <div style={{
                    width: '12px',
                    height: `${completedHeight}%`,
                    minHeight: month.completed > 0 ? '8px' : '2px',
                    background: '#22c55e',
                    borderRadius: '2px 2px 0 0'
                  }} />
                </div>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{month.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PM Performance */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Team Performance</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Project Manager</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Active</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Completed</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {analytics.pmPerformance.map(pm => (
                <tr key={pm.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.75rem'
                      }}>
                        {pm.name?.charAt(0) || '?'}
                      </div>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pm.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-primary)' }}>{pm.total}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--sunbelt-orange)', fontWeight: '600' }}>{pm.active}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#22c55e', fontWeight: '600' }}>{pm.completed}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(pm.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;