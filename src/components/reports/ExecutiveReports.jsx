// ============================================================================
// ExecutiveReports.jsx - Comprehensive Executive Analytics Dashboard
// ============================================================================
// Full-featured reporting dashboard for VP and Director level insights.
// Provides workflow analytics, performance metrics, and trend analysis.
//
// Created: January 10, 2026
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Package,
  Users,
  Building2,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  ArrowRight,
  Activity,
  Target,
  Layers,
  GitBranch,
  AlertCircle,
  ChevronRight,
  PieChart
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  WORKFLOW_PHASES,
  COURT_LABELS,
  calculatePhaseDistribution,
  calculateStationPerformance,
  identifyBottlenecks,
  calculateDrawingMetrics,
  calculateChangeOrderMetrics,
  calculateLongLeadMetrics,
  calculateCourtMetrics,
  calculateDeliveryMetrics,
  calculateMonthlyTrends,
  generateExecutiveSummary
} from '../../utils/workflowAnalytics';

// ============================================================================
// CONSTANTS
// ============================================================================
const REPORT_SECTIONS = [
  { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
  { id: 'workflow', label: 'Workflow Analytics', icon: GitBranch },
  { id: 'drawings', label: 'Drawing Cycles', icon: FileText },
  { id: 'changes', label: 'Change Orders', icon: Layers },
  { id: 'supply', label: 'Supply Chain', icon: Package },
  { id: 'delivery', label: 'Delivery Performance', icon: Target },
  { id: 'trends', label: 'Trends', icon: TrendingUp }
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function MetricCard({ icon: Icon, label, value, subValue, trend, color = 'var(--sunbelt-orange)', large = false }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      padding: large ? '24px' : '20px',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: large ? '48px' : '40px',
          height: large ? '48px' : '40px',
          borderRadius: 'var(--radius-md)',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={large ? 24 : 20} style={{ color }} />
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: large ? '2.5rem' : '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {value}
        </span>
        {trend !== undefined && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '0.875rem',
            color: trend >= 0 ? 'var(--success)' : 'var(--danger)'
          }}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subValue && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          {subValue}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ label, value, max, color = 'var(--sunbelt-orange)', showPercentage = true }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          {showPercentage ? `${percentage}%` : value}
        </span>
      </div>
      <div style={{
        height: '8px',
        background: 'var(--bg-tertiary)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
        <Icon size={24} style={{ color: 'var(--sunbelt-orange)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '36px' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function DataTable({ columns, data, emptyMessage = 'No data available' }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding: '12px 16px',
                textAlign: col.align || 'left',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)'
              }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ borderBottom: '1px solid var(--border-color)' }}>
              {columns.map((col, colIndex) => (
                <td key={colIndex} style={{
                  padding: '12px 16px',
                  textAlign: col.align || 'left',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)'
                }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ExecutiveReports() {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [dateRange, setDateRange] = useState('quarter'); // month, quarter, year, all

  // Data state
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [workflowStations, setWorkflowStations] = useState([]);
  const [workflowStatuses, setWorkflowStatuses] = useState([]);
  const [drawingVersions, setDrawingVersions] = useState([]);
  const [changeOrders, setChangeOrders] = useState([]);
  const [longLeadItems, setLongLeadItems] = useState([]);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        projectsRes,
        tasksRes,
        rfisRes,
        submittalsRes,
        stationsRes,
        statusesRes,
        drawingsRes,
        changeOrdersRes,
        longLeadRes
      ] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('rfis').select('*'),
        supabase.from('submittals').select('*'),
        supabase.from('workflow_stations').select('*').order('phase').order('display_order'),
        supabase.from('project_workflow_status').select('*'),
        supabase.from('drawing_versions').select('*'),
        supabase.from('change_orders').select('*'),
        supabase.from('long_lead_items').select('*')
      ]);

      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
      setWorkflowStations(stationsRes.data || []);
      setWorkflowStatuses(statusesRes.data || []);
      setDrawingVersions(drawingsRes.data || []);
      setChangeOrders(changeOrdersRes.data || []);
      setLongLeadItems(longLeadRes.data || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate all metrics
  const metrics = useMemo(() => {
    if (loading) return null;

    return generateExecutiveSummary({
      projects,
      tasks,
      rfis,
      submittals,
      workflowStatuses,
      stations: workflowStations,
      drawingVersions,
      changeOrders,
      longLeadItems
    });
  }, [loading, projects, tasks, rfis, submittals, workflowStatuses, workflowStations, drawingVersions, changeOrders, longLeadItems]);

  const stationPerformance = useMemo(() => {
    if (loading) return [];
    return calculateStationPerformance(workflowStatuses, workflowStations);
  }, [loading, workflowStatuses, workflowStations]);

  const bottlenecks = useMemo(() => {
    return identifyBottlenecks(stationPerformance);
  }, [stationPerformance]);

  const monthlyTrends = useMemo(() => {
    if (loading) return null;
    return calculateMonthlyTrends(projects, tasks, changeOrders, 6);
  }, [loading, projects, tasks, changeOrders]);

  // Format helpers
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: 'var(--text-secondary)'
      }}>
        <RefreshCw size={24} className="spin" style={{ marginRight: '12px' }} />
        Loading executive reports...
      </div>
    );
  }

  // ============================================================================
  // RENDER SECTIONS
  // ============================================================================

  const renderOverview = () => (
    <div>
      <SectionHeader
        icon={BarChart3}
        title="Executive Overview"
        subtitle="High-level portfolio health and key performance indicators"
      />

      {/* Top KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <MetricCard
          icon={Building2}
          label="Active Projects"
          value={metrics.portfolio.activeProjects}
          subValue={`${metrics.portfolio.totalProjects} total`}
          color="var(--sunbelt-orange)"
          large
        />
        <MetricCard
          icon={DollarSign}
          label="Active Pipeline"
          value={formatCurrency(metrics.portfolio.activeContractValue)}
          subValue={`${formatCurrency(metrics.portfolio.totalContractValue)} total`}
          color="var(--success)"
          large
        />
        <MetricCard
          icon={Target}
          label="On-Time Delivery"
          value={`${metrics.performance.onTimeDeliveryRate || 0}%`}
          subValue="Completed projects"
          color={metrics.performance.onTimeDeliveryRate >= 90 ? 'var(--success)' : 'var(--warning)'}
          large
        />
        <MetricCard
          icon={AlertTriangle}
          label="Total Overdue"
          value={metrics.health.totalOverdue}
          subValue={`${metrics.health.overdueTasks} tasks, ${metrics.health.overdueRFIs} RFIs`}
          color={metrics.health.totalOverdue > 10 ? 'var(--danger)' : 'var(--warning)'}
          large
        />
      </div>

      {/* Workflow Phase Distribution */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        border: '1px solid var(--border-color)',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
          Projects by Workflow Phase
        </h3>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {metrics.workflow.breakdown.map(phase => (
            <div key={phase.phase} style={{ flex: '1', minWidth: '150px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {phase.phaseName}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: phase.color }}>
                  {phase.count}
                </span>
              </div>
              <div style={{
                height: '32px',
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${phase.percentage}%`,
                  background: phase.color,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: phase.percentage > 0 ? '40px' : '0'
                }}>
                  {phase.percentage > 10 && (
                    <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '600' }}>
                      {phase.percentage}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Concerns */}
      {metrics.topConcerns.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          border: '1px solid var(--border-color)',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Items Requiring Attention
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metrics.topConcerns.map((concern, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: concern.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${concern.severity === 'high' ? 'var(--danger)' : 'var(--warning)'}40`
              }}>
                <AlertCircle size={20} style={{
                  color: concern.severity === 'high' ? 'var(--danger)' : 'var(--warning)'
                }} />
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{concern.type}</span>
                <span style={{
                  fontWeight: '600',
                  color: concern.severity === 'high' ? 'var(--danger)' : 'var(--warning)'
                }}>
                  {concern.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        <MetricCard
          icon={FileText}
          label="Drawing Approval Rate"
          value={`${metrics.performance.drawingApprovalRate || 0}%`}
          color="var(--info)"
        />
        <MetricCard
          icon={Clock}
          label="Avg Drawing Cycle"
          value={metrics.performance.avgDrawingCycleTime ? `${metrics.performance.avgDrawingCycleTime}d` : 'N/A'}
          color="var(--info)"
        />
        <MetricCard
          icon={Layers}
          label="Pending Change Orders"
          value={metrics.health.pendingChangeOrders}
          subValue={formatCurrency(metrics.financial.pendingChangeOrderValue)}
          color="var(--warning)"
        />
        <MetricCard
          icon={Package}
          label="Delayed Long Lead"
          value={metrics.health.delayedLongLeadItems}
          color={metrics.health.delayedLongLeadItems > 0 ? 'var(--danger)' : 'var(--success)'}
        />
      </div>
    </div>
  );

  const renderWorkflow = () => (
    <div>
      <SectionHeader
        icon={GitBranch}
        title="Workflow Analytics"
        subtitle="Station performance, bottlenecks, and process efficiency"
      />

      {/* Bottlenecks Alert */}
      {bottlenecks.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--danger)',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--danger)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={20} />
            Top Bottlenecks Identified
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {bottlenecks.map((station, i) => (
              <div key={i} style={{
                background: 'var(--bg-primary)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {station.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {station.inProgress} in progress, {station.awaiting} awaiting, {station.overdueCount} overdue
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Station Performance Table */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Station Performance
          </h3>
        </div>
        <DataTable
          columns={[
            { key: 'name', header: 'Station' },
            { key: 'phase', header: 'Phase', render: (v) => WORKFLOW_PHASES[v]?.name || `Phase ${v}` },
            { key: 'completed', header: 'Completed', align: 'center' },
            { key: 'inProgress', header: 'In Progress', align: 'center' },
            { key: 'awaiting', header: 'Awaiting', align: 'center' },
            { key: 'overdueCount', header: 'Overdue', align: 'center', render: (v) => (
              <span style={{ color: v > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>{v}</span>
            )},
            { key: 'avgDays', header: 'Avg Days', align: 'center', render: (v) => v || '-' }
          ]}
          data={stationPerformance.filter(s => s.completed > 0 || s.inProgress > 0 || s.awaiting > 0)}
          emptyMessage="No workflow data available"
        />
      </div>
    </div>
  );

  const renderDrawings = () => {
    const dm = metrics.details.drawingMetrics;
    return (
      <div>
        <SectionHeader
          icon={FileText}
          title="Drawing Cycle Analytics"
          subtitle="Approval rates, cycle times, and revision patterns"
        />

        {/* Key Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            icon={CheckCircle2}
            label="Approval Rate"
            value={`${dm.approvalRate || 0}%`}
            color="var(--success)"
          />
          <MetricCard
            icon={Clock}
            label="Avg Cycle Time"
            value={dm.avgCycleTimeDays ? `${dm.avgCycleTimeDays} days` : 'N/A'}
            color="var(--info)"
          />
          <MetricCard
            icon={FileText}
            label="Redline Rate"
            value={`${dm.redlineRate || 0}%`}
            color="var(--warning)"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Rejection Rate"
            value={`${dm.rejectionRate || 0}%`}
            color="var(--danger)"
          />
        </div>

        {/* Response Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              Dealer Response Distribution
            </h3>
            {dm.responseBreakdown.map(resp => (
              <ProgressBar
                key={resp.type}
                label={resp.type}
                value={resp.count}
                max={dm.totalSubmissions}
                color={
                  resp.type === 'Approve' ? 'var(--success)' :
                  resp.type.includes('Redlines') ? 'var(--warning)' : 'var(--danger)'
                }
              />
            ))}
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              Performance by Drawing Stage
            </h3>
            {dm.byPercentage.map(stage => (
              <div key={stage.percentage} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {stage.percentage}% Drawings
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {stage.submissions} submitted • {stage.approvalRate || 0}% approval • {stage.avgRevisions} avg revisions
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderChangeOrders = () => {
    const co = metrics.details.changeOrderMetrics;
    return (
      <div>
        <SectionHeader
          icon={Layers}
          title="Change Order Analysis"
          subtitle="Volume, value, and processing efficiency"
        />

        {/* Key Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            icon={Layers}
            label="Total Change Orders"
            value={co.totalCount}
            subValue={`${co.avgPerActiveProject} per active project`}
            color="var(--sunbelt-orange)"
          />
          <MetricCard
            icon={DollarSign}
            label="Total Value"
            value={formatCurrency(co.totalValue)}
            subValue={`${formatCurrency(co.avgValue)} average`}
            color="var(--success)"
          />
          <MetricCard
            icon={Clock}
            label="Avg Processing"
            value={co.avgProcessingDays ? `${co.avgProcessingDays} days` : 'N/A'}
            color="var(--info)"
          />
          <MetricCard
            icon={AlertCircle}
            label="Pending"
            value={co.pendingCount}
            subValue={formatCurrency(co.pendingValue)}
            color="var(--warning)"
          />
        </div>

        {/* Breakdowns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              By Status
            </h3>
            {co.statusBreakdown.map(status => (
              <ProgressBar
                key={status.status}
                label={`${status.status} (${status.count})`}
                value={status.count}
                max={co.totalCount}
                color={
                  status.status === 'Implemented' ? 'var(--success)' :
                  status.status === 'Signed' ? 'var(--info)' :
                  status.status === 'Rejected' ? 'var(--danger)' : 'var(--text-secondary)'
                }
              />
            ))}
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              By Type
            </h3>
            {co.typeBreakdown.map(type => (
              <div key={type.type} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {type.type}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {type.count} orders • {formatCurrency(type.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSupplyChain = () => {
    const ll = metrics.details.longLeadMetrics;
    return (
      <div>
        <SectionHeader
          icon={Package}
          title="Supply Chain Performance"
          subtitle="Long lead item tracking and supplier performance"
        />

        {/* Key Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            icon={Package}
            label="Total Items"
            value={ll.totalItems}
            color="var(--sunbelt-orange)"
          />
          <MetricCard
            icon={Target}
            label="On-Time Rate"
            value={ll.onTimeRate !== null ? `${ll.onTimeRate}%` : 'N/A'}
            color={ll.onTimeRate >= 90 ? 'var(--success)' : 'var(--warning)'}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Delayed Items"
            value={ll.delayedCount}
            color={ll.delayedCount > 0 ? 'var(--danger)' : 'var(--success)'}
          />
          <MetricCard
            icon={Clock}
            label="Avg Variance"
            value={ll.avgVarianceDays !== null ? `${ll.avgVarianceDays} days` : 'N/A'}
            color="var(--info)"
          />
        </div>

        {/* Status and Suppliers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              Item Status Distribution
            </h3>
            {ll.statusBreakdown.map(status => (
              <ProgressBar
                key={status.status}
                label={`${status.status} (${status.count})`}
                value={status.count}
                max={ll.totalItems}
                color={
                  status.status === 'Delivered' ? 'var(--success)' :
                  status.status === 'In Transit' ? 'var(--info)' :
                  status.status === 'Delayed' ? 'var(--danger)' :
                  status.status === 'Ordered' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)'
                }
              />
            ))}
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              Top Suppliers
            </h3>
            {ll.supplierPerformance.length > 0 ? ll.supplierPerformance.slice(0, 5).map(supplier => (
              <div key={supplier.name} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  {supplier.name}
                </span>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{supplier.total} items</span>
                  <span style={{ color: supplier.delayRate > 20 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    {supplier.delayRate}% delayed
                  </span>
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-tertiary)' }}>No supplier data available</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDelivery = () => {
    const del = metrics.details.deliveryMetrics;
    return (
      <div>
        <SectionHeader
          icon={Target}
          title="Delivery Performance"
          subtitle="On-time delivery rates and factory comparison"
        />

        {/* Key Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            icon={CheckCircle2}
            label="On-Time Rate"
            value={`${del.onTimeRate}%`}
            color={del.onTimeRate >= 90 ? 'var(--success)' : del.onTimeRate >= 75 ? 'var(--warning)' : 'var(--danger)'}
            large
          />
          <MetricCard
            icon={Target}
            label="Total Delivered"
            value={del.totalDelivered}
            color="var(--sunbelt-orange)"
            large
          />
          <MetricCard
            icon={Clock}
            label="Avg Variance"
            value={`${del.avgVarianceDays} days`}
            color={del.avgVarianceDays <= 0 ? 'var(--success)' : 'var(--warning)'}
            large
          />
        </div>

        {/* Breakdown and Factory Performance */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '24px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              Delivery Breakdown
            </h3>
            {del.breakdown.map(item => (
              <div key={item.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: item.color
                  }} />
                  <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                </div>
                <span style={{ fontWeight: '600', color: item.color }}>{item.count}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                Factory Performance
              </h3>
            </div>
            <DataTable
              columns={[
                { key: 'factory', header: 'Factory' },
                { key: 'total', header: 'Delivered', align: 'center' },
                { key: 'onTimeRate', header: 'On-Time %', align: 'center', render: (v) => (
                  <span style={{ color: v >= 90 ? 'var(--success)' : v >= 75 ? 'var(--warning)' : 'var(--danger)' }}>
                    {v}%
                  </span>
                )},
                { key: 'avgVariance', header: 'Avg Variance', align: 'center', render: (v) => (
                  <span style={{ color: v <= 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {v > 0 ? '+' : ''}{v} days
                  </span>
                )}
              ]}
              data={del.factoryPerformance}
              emptyMessage="No factory delivery data"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTrends = () => {
    if (!monthlyTrends) return null;

    return (
      <div>
        <SectionHeader
          icon={TrendingUp}
          title="Trends & History"
          subtitle="6-month performance trends and patterns"
        />

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            icon={Building2}
            label="Avg Projects Started"
            value={monthlyTrends.summary.avgProjectsStarted}
            subValue="per month"
            color="var(--info)"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Avg Projects Completed"
            value={monthlyTrends.summary.avgProjectsCompleted}
            subValue="per month"
            color="var(--success)"
          />
          <MetricCard
            icon={Activity}
            label="Avg Tasks Completed"
            value={monthlyTrends.summary.avgTasksCompleted}
            subValue="per month"
            color="var(--sunbelt-orange)"
          />
          <MetricCard
            icon={DollarSign}
            label="Total CO Value"
            value={formatCurrency(monthlyTrends.summary.totalChangeOrderValue)}
            subValue="6-month period"
            color="var(--warning)"
          />
        </div>

        {/* Monthly Breakdown */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Monthly Activity
            </h3>
          </div>
          <DataTable
            columns={[
              { key: 'month', header: 'Month' },
              { key: 'projectsStarted', header: 'Started', align: 'center' },
              { key: 'projectsCompleted', header: 'Completed', align: 'center' },
              { key: 'tasksCompleted', header: 'Tasks Done', align: 'center' },
              { key: 'changeOrderCount', header: 'Change Orders', align: 'center' },
              { key: 'changeOrderValue', header: 'CO Value', align: 'right', render: (v) => formatCurrency(v) }
            ]}
            data={monthlyTrends.months}
          />
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Executive Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Comprehensive analytics and performance metrics
          </p>
        </div>
        <button
          onClick={fetchAllData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>

      {/* Section Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {REPORT_SECTIONS.map(section => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: isActive ? 'var(--sunbelt-orange)' : 'var(--bg-secondary)',
                border: isActive ? 'none' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={16} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        border: '1px solid var(--border-color)',
        minHeight: '600px'
      }}>
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'workflow' && renderWorkflow()}
        {activeSection === 'drawings' && renderDrawings()}
        {activeSection === 'changes' && renderChangeOrders()}
        {activeSection === 'supply' && renderSupplyChain()}
        {activeSection === 'delivery' && renderDelivery()}
        {activeSection === 'trends' && renderTrends()}
      </div>
    </div>
  );
}

export default ExecutiveReports;
