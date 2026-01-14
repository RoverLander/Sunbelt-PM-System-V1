// ============================================================================
// ExecutiveReports.jsx - Comprehensive Executive Analytics Dashboard
// ============================================================================
// Full-featured reporting dashboard for VP and Director level insights.
// Provides workflow analytics, performance metrics, and trend analysis.
//
// Created: January 10, 2026
// Updated: January 14, 2026 - Added date filtering, PDF export, new report types
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
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
  PieChart,
  Printer,
  Truck,
  UserCheck,
  Factory,
  ShieldAlert,
  CalendarDays,
  ChevronDown
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
  { id: 'pipeline', label: 'Delivery Pipeline', icon: Truck },
  { id: 'workload', label: 'PM Workload', icon: UserCheck },
  { id: 'capacity', label: 'Factory Capacity', icon: Factory },
  { id: 'risk', label: 'Risk Assessment', icon: ShieldAlert },
  { id: 'trends', label: 'Trends', icon: TrendingUp }
];

const DATE_RANGE_OPTIONS = [
  { id: '30', label: 'Last 30 Days', days: 30 },
  { id: '60', label: 'Last 60 Days', days: 60 },
  { id: '90', label: 'Last 90 Days', days: 90 },
  { id: 'quarter', label: 'This Quarter', days: null },
  { id: 'year', label: 'This Year', days: null },
  { id: 'all', label: 'All Time', days: null }
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

function DateRangeSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = DATE_RANGE_OPTIONS.find(opt => opt.id === value) || DATE_RANGE_OPTIONS[3];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '0.875rem',
          minWidth: '160px',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={16} style={{ color: 'var(--sunbelt-orange)' }} />
          {selected.label}
        </div>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            minWidth: '180px',
            overflow: 'hidden'
          }}>
            {DATE_RANGE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  background: value === opt.id ? 'var(--sunbelt-orange)15' : 'transparent',
                  border: 'none',
                  color: value === opt.id ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: value === opt.id ? '600' : '500',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// PDF EXPORT FUNCTION
// ============================================================================
const generateReportPDF = (metrics, activeSection, dateRangeLabel, projects, tasks) => {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const sectionTitle = REPORT_SECTIONS.find(s => s.id === activeSection)?.label || 'Executive Report';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sunbelt Executive Report - ${sectionTitle}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1e293b;
          line-height: 1.5;
          padding: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #FF6B35;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo { font-size: 24px; font-weight: 700; color: #FF6B35; }
        .logo-sub { font-size: 12px; color: #64748b; }
        .report-title { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
        .report-subtitle { font-size: 14px; color: #64748b; }
        .meta { text-align: right; font-size: 12px; color: #64748b; }
        .section { margin-bottom: 30px; }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .metric-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }
        .metric-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
        .metric-value { font-size: 24px; font-weight: 700; color: #1e293b; }
        .metric-sub { font-size: 11px; color: #94a3b8; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th {
          background: #f8fafc;
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #64748b;
          border-bottom: 2px solid #e2e8f0;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }
        .status-good { color: #22c55e; }
        .status-warning { color: #f59e0b; }
        .status-danger { color: #ef4444; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
        @page { margin: 0.5in; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">SUNBELT MODULAR</div>
          <div class="logo-sub">Project Management System</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <div class="report-title">${sectionTitle}</div>
          <div class="report-subtitle">Executive Dashboard Report</div>
        </div>
        <div class="meta">
          <div>Generated: ${today}</div>
          <div>Period: ${dateRangeLabel}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Portfolio Overview</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Active Projects</div>
            <div class="metric-value">${metrics?.portfolio?.activeProjects || 0}</div>
            <div class="metric-sub">${metrics?.portfolio?.totalProjects || 0} total</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Active Pipeline</div>
            <div class="metric-value">${formatCurrency(metrics?.portfolio?.activeContractValue)}</div>
            <div class="metric-sub">${formatCurrency(metrics?.portfolio?.totalContractValue)} total</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">On-Time Delivery</div>
            <div class="metric-value">${metrics?.performance?.onTimeDeliveryRate || 0}%</div>
            <div class="metric-sub">Completed projects</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Overdue</div>
            <div class="metric-value">${metrics?.health?.totalOverdue || 0}</div>
            <div class="metric-sub">${metrics?.health?.overdueTasks || 0} tasks, ${metrics?.health?.overdueRFIs || 0} RFIs</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Performance Metrics</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Drawing Approval Rate</div>
            <div class="metric-value">${metrics?.performance?.drawingApprovalRate || 0}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Avg Drawing Cycle</div>
            <div class="metric-value">${metrics?.performance?.avgDrawingCycleTime || 'N/A'}${metrics?.performance?.avgDrawingCycleTime ? 'd' : ''}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Pending Change Orders</div>
            <div class="metric-value">${metrics?.health?.pendingChangeOrders || 0}</div>
            <div class="metric-sub">${formatCurrency(metrics?.financial?.pendingChangeOrderValue)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Delayed Long Lead</div>
            <div class="metric-value">${metrics?.health?.delayedLongLeadItems || 0}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Workflow Phase Distribution</div>
        <table>
          <thead>
            <tr>
              <th>Phase</th>
              <th>Projects</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${(metrics?.workflow?.breakdown || []).map(phase => `
              <tr>
                <td>${phase.phaseName}</td>
                <td>${phase.count}</td>
                <td>${phase.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${(metrics?.topConcerns || []).length > 0 ? `
      <div class="section">
        <div class="section-title">Items Requiring Attention</div>
        <table>
          <thead>
            <tr>
              <th>Issue Type</th>
              <th>Count</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            ${metrics.topConcerns.map(concern => `
              <tr>
                <td>${concern.type}</td>
                <td>${concern.count}</td>
                <td class="${concern.severity === 'high' ? 'status-danger' : 'status-warning'}">${concern.severity.toUpperCase()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="footer">
        <div>Sunbelt Modular - Confidential</div>
        <div>Page 1 of 1</div>
        <div>Report ID: RPT-${Date.now()}</div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow popups to generate PDF. Check your browser settings.');
    return;
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.onload = () => setTimeout(() => printWindow.print(), 300);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ExecutiveReports() {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [dateRange, setDateRange] = useState('90'); // Default to 90 days
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data state
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [workflowStations, setWorkflowStations] = useState([]);
  const [workflowStatuses, setWorkflowStatuses] = useState([]);
  const [drawingVersions, setDrawingVersions] = useState([]);
  const [changeOrders, setChangeOrders] = useState([]);
  const [longLeadItems, setLongLeadItems] = useState([]);
  const [factories, setFactories] = useState([]);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        projectsRes,
        usersRes,
        tasksRes,
        rfisRes,
        submittalsRes,
        stationsRes,
        statusesRes,
        drawingsRes,
        changeOrdersRes,
        longLeadRes,
        factoriesRes
      ] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('users').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('rfis').select('*'),
        supabase.from('submittals').select('*'),
        supabase.from('workflow_stations').select('*').order('phase').order('display_order'),
        supabase.from('project_workflow_status').select('*'),
        supabase.from('drawing_versions').select('*'),
        supabase.from('change_orders').select('*'),
        supabase.from('long_lead_items').select('*'),
        supabase.from('factories').select('*')
      ]);

      setProjects(projectsRes.data || []);
      setUsers(usersRes.data || []);
      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
      setWorkflowStations(stationsRes.data || []);
      setWorkflowStatuses(statusesRes.data || []);
      setDrawingVersions(drawingsRes.data || []);
      setChangeOrders(changeOrdersRes.data || []);
      setLongLeadItems(longLeadRes.data || []);
      setFactories(factoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get date range label
  const dateRangeLabel = useMemo(() => {
    const option = DATE_RANGE_OPTIONS.find(opt => opt.id === dateRange);
    return option?.label || 'All Time';
  }, [dateRange]);

  // Filter data by date range
  const getDateFilter = useCallback(() => {
    const option = DATE_RANGE_OPTIONS.find(opt => opt.id === dateRange);
    if (!option) return null;

    const now = new Date();
    let startDate = null;

    if (option.days) {
      startDate = new Date(now.getTime() - option.days * 24 * 60 * 60 * 1000);
    } else if (option.id === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else if (option.id === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    return startDate;
  }, [dateRange]);

  // Handle PDF export
  const handleExportPDF = useCallback(() => {
    generateReportPDF(metrics, activeSection, dateRangeLabel, projects, tasks);
  }, [metrics, activeSection, dateRangeLabel, projects, tasks]);

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
  // NEW REPORT SECTIONS
  // ============================================================================

  const renderPipeline = () => {
    // Calculate delivery pipeline data
    const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'In Progress');
    const now = new Date();
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const next60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const next90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const deliveriesNext30 = activeProjects.filter(p => {
      const delivery = p.delivery_date ? new Date(p.delivery_date) : null;
      return delivery && delivery <= next30;
    });
    const deliveriesNext60 = activeProjects.filter(p => {
      const delivery = p.delivery_date ? new Date(p.delivery_date) : null;
      return delivery && delivery > next30 && delivery <= next60;
    });
    const deliveriesNext90 = activeProjects.filter(p => {
      const delivery = p.delivery_date ? new Date(p.delivery_date) : null;
      return delivery && delivery > next60 && delivery <= next90;
    });
    const deliveriesBeyond = activeProjects.filter(p => {
      const delivery = p.delivery_date ? new Date(p.delivery_date) : null;
      return delivery && delivery > next90;
    });

    const pipelineValue30 = deliveriesNext30.reduce((sum, p) => sum + (p.contract_value || 0), 0);
    const pipelineValue60 = deliveriesNext60.reduce((sum, p) => sum + (p.contract_value || 0), 0);
    const pipelineValue90 = deliveriesNext90.reduce((sum, p) => sum + (p.contract_value || 0), 0);

    return (
      <div>
        <SectionHeader
          icon={Truck}
          title="Delivery Pipeline"
          subtitle="Upcoming deliveries and scheduling overview"
        />

        {/* Pipeline Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            icon={Truck}
            label="Next 30 Days"
            value={deliveriesNext30.length}
            subValue={formatCurrency(pipelineValue30)}
            color="#ef4444"
            large
          />
          <MetricCard
            icon={Truck}
            label="31-60 Days"
            value={deliveriesNext60.length}
            subValue={formatCurrency(pipelineValue60)}
            color="#f59e0b"
          />
          <MetricCard
            icon={Truck}
            label="61-90 Days"
            value={deliveriesNext90.length}
            subValue={formatCurrency(pipelineValue90)}
            color="#22c55e"
          />
          <MetricCard
            icon={Calendar}
            label="Beyond 90 Days"
            value={deliveriesBeyond.length}
            color="var(--info)"
          />
        </div>

        {/* Upcoming Deliveries Table */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Upcoming Deliveries (Next 90 Days)
            </h3>
          </div>
          <DataTable
            columns={[
              { key: 'project_number', header: 'Project #' },
              { key: 'name', header: 'Project Name' },
              { key: 'factory', header: 'Factory' },
              { key: 'delivery_date', header: 'Delivery Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
              { key: 'daysUntil', header: 'Days Until', align: 'center', render: (_, row) => {
                const delivery = row.delivery_date ? new Date(row.delivery_date) : null;
                if (!delivery) return '—';
                const days = Math.ceil((delivery - now) / (1000 * 60 * 60 * 24));
                return (
                  <span style={{ color: days <= 14 ? 'var(--danger)' : days <= 30 ? 'var(--warning)' : 'var(--text-primary)' }}>
                    {days}d
                  </span>
                );
              }},
              { key: 'contract_value', header: 'Value', align: 'right', render: (v) => formatCurrency(v) }
            ]}
            data={[...deliveriesNext30, ...deliveriesNext60, ...deliveriesNext90].sort((a, b) =>
              new Date(a.delivery_date) - new Date(b.delivery_date)
            ).slice(0, 15)}
            emptyMessage="No upcoming deliveries"
          />
        </div>
      </div>
    );
  };

  const renderWorkload = () => {
    // Calculate PM workload
    const pms = users.filter(u => u.role === 'PM' || u.role === 'Project_Manager');
    const pmWorkload = pms.map(pm => {
      const pmProjects = projects.filter(p => p.pm_id === pm.id && (p.status === 'Active' || p.status === 'In Progress'));
      const pmTasks = tasks.filter(t => t.assigned_to === pm.id && t.status !== 'Completed');
      const pmOverdueTasks = pmTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
      const pmRFIs = rfis.filter(r => r.internal_owner === pm.id && r.status !== 'Answered');
      const totalValue = pmProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);

      return {
        name: pm.name,
        projectCount: pmProjects.length,
        taskCount: pmTasks.length,
        overdueTasks: pmOverdueTasks.length,
        openRFIs: pmRFIs.length,
        totalValue,
        utilization: Math.min(100, Math.round((pmProjects.length / 8) * 100)) // Assume 8 projects is 100% capacity
      };
    }).sort((a, b) => b.projectCount - a.projectCount);

    const avgProjects = pmWorkload.length > 0 ? (pmWorkload.reduce((sum, pm) => sum + pm.projectCount, 0) / pmWorkload.length).toFixed(1) : 0;
    const avgTasks = pmWorkload.length > 0 ? (pmWorkload.reduce((sum, pm) => sum + pm.taskCount, 0) / pmWorkload.length).toFixed(1) : 0;
    const totalOverdue = pmWorkload.reduce((sum, pm) => sum + pm.overdueTasks, 0);

    return (
      <div>
        <SectionHeader
          icon={UserCheck}
          title="PM Workload Analysis"
          subtitle="Project manager capacity and task distribution"
        />

        {/* Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            icon={Users}
            label="Active PMs"
            value={pms.length}
            color="var(--sunbelt-orange)"
            large
          />
          <MetricCard
            icon={Building2}
            label="Avg Projects/PM"
            value={avgProjects}
            color="var(--info)"
          />
          <MetricCard
            icon={CheckSquare}
            label="Avg Tasks/PM"
            value={avgTasks}
            color="var(--success)"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Total Overdue Tasks"
            value={totalOverdue}
            color={totalOverdue > 10 ? 'var(--danger)' : 'var(--warning)'}
          />
        </div>

        {/* PM Table */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Project Manager Workload
            </h3>
          </div>
          <DataTable
            columns={[
              { key: 'name', header: 'Project Manager' },
              { key: 'projectCount', header: 'Projects', align: 'center' },
              { key: 'taskCount', header: 'Open Tasks', align: 'center' },
              { key: 'overdueTasks', header: 'Overdue', align: 'center', render: (v) => (
                <span style={{ color: v > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>{v}</span>
              )},
              { key: 'openRFIs', header: 'Open RFIs', align: 'center' },
              { key: 'totalValue', header: 'Portfolio Value', align: 'right', render: (v) => formatCurrency(v) },
              { key: 'utilization', header: 'Utilization', align: 'center', render: (v) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '60px',
                    height: '8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${v}%`,
                      background: v >= 90 ? 'var(--danger)' : v >= 70 ? 'var(--warning)' : 'var(--success)',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}%</span>
                </div>
              )}
            ]}
            data={pmWorkload}
            emptyMessage="No project managers found"
          />
        </div>
      </div>
    );
  };

  const renderCapacity = () => {
    // Calculate factory capacity
    const factoryData = factories.map(factory => {
      const factoryProjects = projects.filter(p => p.factory === factory.code && (p.status === 'Active' || p.status === 'In Progress'));
      const completedThisMonth = projects.filter(p => {
        if (p.factory !== factory.code || p.status !== 'Completed') return false;
        const completed = p.actual_delivery ? new Date(p.actual_delivery) : null;
        if (!completed) return false;
        const now = new Date();
        return completed.getMonth() === now.getMonth() && completed.getFullYear() === now.getFullYear();
      }).length;

      const upcoming30 = factoryProjects.filter(p => {
        const delivery = p.delivery_date ? new Date(p.delivery_date) : null;
        if (!delivery) return false;
        const now = new Date();
        const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return delivery <= next30;
      }).length;

      const totalValue = factoryProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);

      return {
        factory: factory.code,
        name: factory.name,
        activeProjects: factoryProjects.length,
        completedThisMonth,
        upcoming30,
        totalValue,
        capacity: factory.capacity || 10,
        utilization: Math.round((factoryProjects.length / (factory.capacity || 10)) * 100)
      };
    }).filter(f => f.activeProjects > 0 || f.completedThisMonth > 0);

    const totalActive = factoryData.reduce((sum, f) => sum + f.activeProjects, 0);
    const totalCapacity = factoryData.reduce((sum, f) => sum + f.capacity, 0);
    const avgUtilization = totalCapacity > 0 ? Math.round((totalActive / totalCapacity) * 100) : 0;

    return (
      <div>
        <SectionHeader
          icon={Factory}
          title="Factory Capacity"
          subtitle="Production capacity and factory utilization"
        />

        {/* Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            icon={Factory}
            label="Active Factories"
            value={factoryData.length}
            color="var(--sunbelt-orange)"
            large
          />
          <MetricCard
            icon={Building2}
            label="Total Active Projects"
            value={totalActive}
            color="var(--info)"
          />
          <MetricCard
            icon={Activity}
            label="Avg Utilization"
            value={`${avgUtilization}%`}
            color={avgUtilization >= 90 ? 'var(--danger)' : avgUtilization >= 70 ? 'var(--warning)' : 'var(--success)'}
          />
          <MetricCard
            icon={Truck}
            label="Upcoming (30d)"
            value={factoryData.reduce((sum, f) => sum + f.upcoming30, 0)}
            color="var(--warning)"
          />
        </div>

        {/* Factory Table */}
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
              { key: 'factory', header: 'Code' },
              { key: 'name', header: 'Factory Name' },
              { key: 'activeProjects', header: 'Active', align: 'center' },
              { key: 'completedThisMonth', header: 'Completed (MTD)', align: 'center' },
              { key: 'upcoming30', header: 'Due (30d)', align: 'center' },
              { key: 'totalValue', header: 'Portfolio Value', align: 'right', render: (v) => formatCurrency(v) },
              { key: 'utilization', header: 'Utilization', align: 'center', render: (v) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '60px',
                    height: '8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, v)}%`,
                      background: v >= 100 ? 'var(--danger)' : v >= 80 ? 'var(--warning)' : 'var(--success)',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}%</span>
                </div>
              )}
            ]}
            data={factoryData.sort((a, b) => b.utilization - a.utilization)}
            emptyMessage="No factory data available"
          />
        </div>
      </div>
    );
  };

  const renderRisk = () => {
    // Calculate risk metrics
    const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'In Progress');
    const now = new Date();

    // Project health distribution
    const healthCounts = { 'On Track': 0, 'At Risk': 0, 'Behind': 0, 'Critical': 0 };
    activeProjects.forEach(p => {
      const health = p.health_status || 'On Track';
      if (healthCounts[health] !== undefined) healthCounts[health]++;
    });

    // Overdue items
    const overdueTasks = tasks.filter(t => t.status !== 'Completed' && t.due_date && new Date(t.due_date) < now);
    const overdueRFIs = rfis.filter(r => r.status !== 'Answered' && r.due_date && new Date(r.due_date) < now);
    const overdueSubmittals = submittals.filter(s => s.status !== 'Approved' && s.due_date && new Date(s.due_date) < now);

    // Projects with multiple issues
    const projectRisks = activeProjects.map(p => {
      const pTasks = tasks.filter(t => t.project_id === p.id && t.status !== 'Completed' && t.due_date && new Date(t.due_date) < now);
      const pRFIs = rfis.filter(r => r.project_id === p.id && r.status !== 'Answered' && r.due_date && new Date(r.due_date) < now);
      const pSubmittals = submittals.filter(s => s.project_id === p.id && s.status !== 'Approved' && s.due_date && new Date(s.due_date) < now);
      const deliveryDays = p.delivery_date ? Math.ceil((new Date(p.delivery_date) - now) / (1000 * 60 * 60 * 24)) : null;

      const riskScore = pTasks.length * 1 + pRFIs.length * 2 + pSubmittals.length * 1.5 +
        (p.health_status === 'Critical' ? 10 : p.health_status === 'Behind' ? 5 : p.health_status === 'At Risk' ? 3 : 0) +
        (deliveryDays !== null && deliveryDays <= 14 && deliveryDays > 0 ? 3 : 0);

      return {
        ...p,
        overdueTasks: pTasks.length,
        overdueRFIs: pRFIs.length,
        overdueSubmittals: pSubmittals.length,
        deliveryDays,
        riskScore
      };
    }).filter(p => p.riskScore > 0).sort((a, b) => b.riskScore - a.riskScore);

    const criticalProjects = projectRisks.filter(p => p.riskScore >= 10);
    const atRiskProjects = projectRisks.filter(p => p.riskScore >= 5 && p.riskScore < 10);

    return (
      <div>
        <SectionHeader
          icon={ShieldAlert}
          title="Risk Assessment"
          subtitle="Portfolio risk analysis and project health overview"
        />

        {/* Risk Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            icon={AlertCircle}
            label="Critical Projects"
            value={criticalProjects.length}
            color="var(--danger)"
            large
          />
          <MetricCard
            icon={AlertTriangle}
            label="At Risk Projects"
            value={atRiskProjects.length}
            color="var(--warning)"
          />
          <MetricCard
            icon={Clock}
            label="Overdue Items"
            value={overdueTasks.length + overdueRFIs.length + overdueSubmittals.length}
            subValue={`${overdueTasks.length} tasks, ${overdueRFIs.length} RFIs`}
            color="var(--danger)"
          />
          <MetricCard
            icon={CheckCircle2}
            label="On Track"
            value={healthCounts['On Track']}
            color="var(--success)"
          />
        </div>

        {/* Health Distribution */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
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
              Project Health Distribution
            </h3>
            {Object.entries(healthCounts).map(([status, count]) => (
              <div key={status} style={{
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
                    background: status === 'On Track' ? 'var(--success)' :
                               status === 'At Risk' ? 'var(--warning)' :
                               status === 'Behind' ? 'var(--sunbelt-orange)' : 'var(--danger)'
                  }} />
                  <span style={{ color: 'var(--text-primary)' }}>{status}</span>
                </div>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{count}</span>
              </div>
            ))}
          </div>

          {/* High Risk Projects */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--danger)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                High Risk Projects
              </h3>
            </div>
            <DataTable
              columns={[
                { key: 'project_number', header: 'Project #' },
                { key: 'name', header: 'Name' },
                { key: 'health_status', header: 'Health', render: (v) => (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: v === 'Critical' ? 'rgba(239, 68, 68, 0.2)' :
                               v === 'Behind' ? 'rgba(245, 158, 11, 0.2)' :
                               v === 'At Risk' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    color: v === 'Critical' ? 'var(--danger)' :
                           v === 'Behind' ? 'var(--warning)' :
                           v === 'At Risk' ? '#b45309' : 'var(--success)'
                  }}>{v || 'On Track'}</span>
                )},
                { key: 'overdueTasks', header: 'Overdue Tasks', align: 'center' },
                { key: 'overdueRFIs', header: 'Overdue RFIs', align: 'center' },
                { key: 'deliveryDays', header: 'Days to Delivery', align: 'center', render: (v) => (
                  v !== null ? (
                    <span style={{ color: v <= 14 ? 'var(--danger)' : v <= 30 ? 'var(--warning)' : 'var(--text-primary)' }}>
                      {v}d
                    </span>
                  ) : '—'
                )}
              ]}
              data={projectRisks.slice(0, 10)}
              emptyMessage="No high-risk projects identified"
            />
          </div>
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
        alignItems: 'flex-start',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={28} style={{ color: 'var(--sunbelt-orange)' }} />
            Executive Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Comprehensive analytics and performance metrics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <button
            onClick={handleExportPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--sunbelt-orange)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            <Printer size={16} />
            Export PDF
          </button>
          <button
            onClick={fetchAllData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
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
        {activeSection === 'pipeline' && renderPipeline()}
        {activeSection === 'workload' && renderWorkload()}
        {activeSection === 'capacity' && renderCapacity()}
        {activeSection === 'risk' && renderRisk()}
        {activeSection === 'trends' && renderTrends()}
      </div>
    </div>
  );
}

export default ExecutiveReports;
