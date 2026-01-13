// ============================================================================
// VPDashboard Component (Praxis Enhanced)
// ============================================================================
// Executive-level dashboard for VP showing:
// - High-level KPIs (on-time %, budget health, total value)
// - Portfolio summary by status
// - Factory/department performance comparison
// - Client account overview
// - Delivery timeline (upcoming milestones)
// - Team utilization summary
// - Trend charts (projects completed over time)
//
// PRAXIS ENHANCEMENTS:
// - Sales Pipeline Summary (read-only view of quotes)
// - PM-Flagged Quotes Section (quotes needing PM attention)
// - Recently Converted Projects (quotes → projects)
// - Weighted Pipeline Forecast (by expected close date)
// - Building Type Breakdown by Factory
//
// This is a READ-ONLY strategic view - no project editing capabilities
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart,
  BarChart3,
  Briefcase,
  MapPin,
  RefreshCw,
  ChevronRight,
  Award,
  Activity,
  Layers,
  Factory,
  FileUp,
  Plus,
  ChevronDown,
  Flag,
  FileText,
  Percent,
  ArrowRight,
  Package
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../projects/CreateProjectModal';
import PraxisImportModal from '../projects/PraxisImportModal';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatCurrency = (amount) => {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const formatFullDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getDaysUntil = (dateString) => {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function VPDashboard() {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [users, setUsers] = useState([]);
  const [quotes, setQuotes] = useState([]); // Sales quotes for pipeline visibility
  const [timeRange, setTimeRange] = useState('quarter'); // month, quarter, year
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showPraxisImport, setShowPraxisImport] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes, rfisRes, submittalsRes, milestonesRes, usersRes, quotesRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('id, project_id, status, due_date, created_at, completed_at'),
        supabase.from('rfis').select('id, project_id, status, due_date, created_at'),
        supabase.from('submittals').select('id, project_id, status, due_date, created_at'),
        supabase.from('milestones').select('*, project:project_id(id, project_number, name)'),
        supabase.from('users').select('*').eq('is_active', true),
        // Fetch sales quotes for pipeline visibility
        supabase.from('sales_quotes').select(`
          *,
          customer:customer_id(id, company_name, contact_name),
          dealer:dealer_id(id, code, name, branch_name)
        `).eq('is_latest_version', true).order('created_at', { ascending: false })
      ]);

      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
      setMilestones(milestonesRes.data || []);
      setUsers(usersRes.data || []);
      setQuotes(quotesRes.data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching VP data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // CALCULATE EXECUTIVE METRICS
  // ==========================================================================
  const executiveMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];

    // ===== PROJECT COUNTS =====
    const activeProjects = projects.filter(p => activeStatuses.includes(p.status));
    const completedProjects = projects.filter(p => p.status === 'Completed');
    const onHoldProjects = projects.filter(p => p.status === 'On Hold');

    // ===== PORTFOLIO VALUE =====
    const totalContractValue = projects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
    const activeContractValue = activeProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);

    // ===== ON-TIME DELIVERY RATE =====
    // Check completed projects that had a delivery date
    const projectsWithDelivery = completedProjects.filter(p => p.delivery_date && p.actual_completion_date);
    const onTimeDeliveries = projectsWithDelivery.filter(p => 
      new Date(p.actual_completion_date) <= new Date(p.delivery_date)
    );
    const onTimeRate = projectsWithDelivery.length > 0 
      ? Math.round((onTimeDeliveries.length / projectsWithDelivery.length) * 100)
      : 100;

    // ===== HEALTH DISTRIBUTION =====
    const projectHealth = activeProjects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const projectRFIs = rfis.filter(r => r.project_id === project.id);
      const projectSubmittals = submittals.filter(s => s.project_id === project.id);

      const overdueTasks = projectTasks.filter(t =>
        t.due_date && t.due_date < today && !['Completed', 'Cancelled'].includes(t.status)
      ).length;
      const overdueRFIs = projectRFIs.filter(r =>
        r.due_date && r.due_date < today && !['Answered', 'Closed'].includes(r.status)
      ).length;
      const overdueSubmittals = projectSubmittals.filter(s =>
        s.due_date && s.due_date < today && ['Pending', 'Submitted', 'Under Review'].includes(s.status)
      ).length;

      const totalOverdue = overdueTasks + overdueRFIs + overdueSubmittals;
      const deliveryDays = getDaysUntil(project.delivery_date);

      let health = 'on-track';
      if (totalOverdue >= 3 || (deliveryDays !== null && deliveryDays <= 3 && deliveryDays >= 0)) {
        health = 'critical';
      } else if (totalOverdue > 0 || (deliveryDays !== null && deliveryDays <= 7 && deliveryDays >= 0)) {
        health = 'at-risk';
      }

      return { ...project, health, totalOverdue, deliveryDays };
    });

    const healthCounts = {
      onTrack: projectHealth.filter(p => p.health === 'on-track').length,
      atRisk: projectHealth.filter(p => p.health === 'at-risk').length,
      critical: projectHealth.filter(p => p.health === 'critical').length
    };

    // ===== OVERDUE ITEMS TOTAL =====
    const totalOverdueItems = projectHealth.reduce((sum, p) => sum + p.totalOverdue, 0);

    // ===== FACTORY BREAKDOWN =====
    const factories = [...new Set(projects.map(p => p.factory).filter(Boolean))];
    const factoryStats = factories.map(factory => {
      const factoryProjects = activeProjects.filter(p => p.factory === factory);
      const factoryCompleted = completedProjects.filter(p => p.factory === factory);
      const factoryValue = factoryProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
      const factoryHealth = projectHealth.filter(p => p.factory === factory);
      
      return {
        name: factory,
        active: factoryProjects.length,
        completed: factoryCompleted.length,
        value: factoryValue,
        atRisk: factoryHealth.filter(p => p.health !== 'on-track').length
      };
    }).sort((a, b) => b.active - a.active);

    // ===== CLIENT BREAKDOWN =====
    const clients = [...new Set(projects.map(p => p.client_name).filter(Boolean))];
    const clientStats = clients.map(client => {
      const clientProjects = projects.filter(p => p.client_name === client);
      const clientActive = clientProjects.filter(p => activeStatuses.includes(p.status));
      const clientValue = clientProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
      
      return {
        name: client,
        total: clientProjects.length,
        active: clientActive.length,
        value: clientValue
      };
    }).sort((a, b) => b.value - a.value).slice(0, 8);

    // ===== UPCOMING DELIVERIES =====
    const upcomingDeliveries = activeProjects
      .filter(p => p.delivery_date)
      .map(p => ({
        ...p,
        daysUntil: getDaysUntil(p.delivery_date)
      }))
      .filter(p => p.daysUntil !== null && p.daysUntil >= 0 && p.daysUntil <= 60)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 8);

    // ===== TEAM STATS =====
    // Roles: 'PM', 'Director' (not 'Project Manager')
    const pms = users.filter(u => ['PM', 'Director'].includes(u.role));
    const avgProjectsPerPM = pms.length > 0
      ? (activeProjects.length / pms.length).toFixed(1)
      : 0;

    // ===== COMPLETION TREND (last 6 months) =====
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const completionTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const monthCompleted = completedProjects.filter(p => {
        const completedDate = new Date(p.actual_completion_date || p.updated_at);
        return completedDate >= monthStart && completedDate < monthEnd;
      }).length;

      completionTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        count: monthCompleted
      });
    }

    return {
      // Summary
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      onHoldProjects: onHoldProjects.length,
      
      // Financial
      totalContractValue,
      activeContractValue,
      
      // Performance
      onTimeRate,
      totalOverdueItems,
      
      // Health
      healthCounts,
      projectHealth,
      
      // Breakdowns
      factoryStats,
      clientStats,
      upcomingDeliveries,
      
      // Team
      teamSize: pms.length,
      avgProjectsPerPM,
      
      // Trends
      completionTrend
    };
  }, [projects, tasks, rfis, submittals, users]);

  // ==========================================================================
  // CALCULATE SALES PIPELINE METRICS
  // ==========================================================================
  const salesPipelineMetrics = useMemo(() => {
    const ACTIVE_STATUSES = ['draft', 'sent', 'negotiating', 'awaiting_po', 'po_received'];

    const activeQuotes = quotes.filter(q => ACTIVE_STATUSES.includes(q.status));
    const wonQuotes = quotes.filter(q => q.status === 'won');
    const lostQuotes = quotes.filter(q => q.status === 'lost');
    const pmFlaggedQuotes = quotes.filter(q => q.pm_flagged && ACTIVE_STATUSES.includes(q.status));

    // Raw pipeline value
    const pipelineValue = activeQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);

    // Weighted pipeline (value × outlook_percentage)
    const weightedPipelineValue = activeQuotes.reduce((sum, q) => {
      const outlook = q.outlook_percentage || 50; // Default to 50% if not set
      return sum + ((q.total_price || 0) * (outlook / 100));
    }, 0);

    const wonValue = wonQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
    const closedQuotes = wonQuotes.length + lostQuotes.length;
    const winRate = closedQuotes > 0 ? Math.round((wonQuotes.length / closedQuotes) * 100) : 0;

    // Recently converted to projects (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyConverted = quotes.filter(q =>
      q.converted_to_project_id &&
      q.converted_at &&
      new Date(q.converted_at) >= thirtyDaysAgo
    ).map(q => {
      const project = projects.find(p => p.id === q.converted_to_project_id);
      return {
        ...q,
        project,
        daysAgo: Math.floor((new Date() - new Date(q.converted_at)) / (1000 * 60 * 60 * 24))
      };
    }).sort((a, b) => new Date(b.converted_at) - new Date(a.converted_at));

    // Weighted forecast by expected close (next 30/60/90 days)
    const now = new Date();
    const forecast30 = activeQuotes.filter(q => {
      if (!q.expected_close_timeframe) return false;
      const closeText = q.expected_close_timeframe.toLowerCase();
      return closeText.includes('week') || closeText.includes('30') || closeText.includes('asap') || closeText.includes('soon');
    }).reduce((sum, q) => sum + ((q.total_price || 0) * ((q.outlook_percentage || 50) / 100)), 0);

    const forecast60 = activeQuotes.filter(q => {
      if (!q.expected_close_timeframe) return false;
      const closeText = q.expected_close_timeframe.toLowerCase();
      return closeText.includes('60') || closeText.includes('month') || closeText.includes('2 week');
    }).reduce((sum, q) => sum + ((q.total_price || 0) * ((q.outlook_percentage || 50) / 100)), 0);

    const forecast90 = activeQuotes.filter(q => {
      if (!q.expected_close_timeframe) return false;
      const closeText = q.expected_close_timeframe.toLowerCase();
      return closeText.includes('90') || closeText.includes('quarter') || closeText.includes('3 month');
    }).reduce((sum, q) => sum + ((q.total_price || 0) * ((q.outlook_percentage || 50) / 100)), 0);

    // Building type breakdown by factory
    const factoryBuildingTypes = {};
    activeQuotes.forEach(q => {
      const factory = q.factory || q.praxis_source_factory || 'Unknown';
      const buildingType = q.building_type || 'Unknown';
      if (!factoryBuildingTypes[factory]) {
        factoryBuildingTypes[factory] = { CUSTOM: 0, 'FLEET/STOCK': 0, GOVERNMENT: 0, Business: 0, Unknown: 0 };
      }
      factoryBuildingTypes[factory][buildingType] = (factoryBuildingTypes[factory][buildingType] || 0) + 1;
    });

    return {
      pipelineValue,
      weightedPipelineValue,
      pipelineCount: activeQuotes.length,
      wonValue,
      wonCount: wonQuotes.length,
      winRate,
      pmFlaggedQuotes,
      pmFlaggedCount: pmFlaggedQuotes.length,
      recentlyConverted,
      forecast: { next30: forecast30, next60: forecast60, next90: forecast90 },
      factoryBuildingTypes
    };
  }, [quotes, projects]);

  // ==========================================================================
  // RENDER - LOADING
  // ==========================================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Loading executive dashboard...</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - MAIN
  // ==========================================================================
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <TrendingUp size={28} style={{ color: 'var(--sunbelt-orange)' }} />
            Executive Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Portfolio performance and strategic overview • Updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => fetchAllData()}
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
            Refresh
          </button>

          {/* New Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.8125rem'
              }}
            >
              <Plus size={14} />
              New
              <ChevronDown size={12} />
            </button>

            {showNewDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '180px',
                zIndex: 100
              }}>
                <button
                  onClick={() => { setShowCreateProject(true); setShowNewDropdown(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <Building2 size={16} />
                  New Project
                </button>
                <button
                  onClick={() => { setShowPraxisImport(true); setShowNewDropdown(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <FileUp size={16} />
                  Import from Praxis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TOP KPI CARDS                                                     */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Total Portfolio Value */}
        <div style={{
          background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.9 }}>
            <DollarSign size={18} />
            <span style={{ fontSize: '0.8125rem', fontWeight: '500' }}>Portfolio Value</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {formatCurrency(executiveMetrics.totalContractValue)}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px' }}>
            {formatCurrency(executiveMetrics.activeContractValue)} active
          </div>
        </div>

        {/* Active Projects */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--info)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Active Projects</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {executiveMetrics.activeProjects}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {executiveMetrics.completedProjects} completed • {executiveMetrics.onHoldProjects} on hold
          </div>
        </div>

        {/* On-Time Delivery */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Target size={18} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>On-Time Delivery</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '2rem', fontWeight: '700', color: executiveMetrics.onTimeRate >= 90 ? '#22c55e' : executiveMetrics.onTimeRate >= 75 ? '#f59e0b' : '#ef4444' }}>
              {executiveMetrics.onTimeRate}%
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Based on completed projects
          </div>
        </div>

        {/* Overdue Items */}
        <div style={{
          background: executiveMetrics.totalOverdueItems > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: executiveMetrics.totalOverdueItems > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} style={{ color: executiveMetrics.totalOverdueItems > 0 ? '#ef4444' : 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.8125rem', color: executiveMetrics.totalOverdueItems > 0 ? '#ef4444' : 'var(--text-secondary)', fontWeight: '500' }}>Overdue Items</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: executiveMetrics.totalOverdueItems > 0 ? '#ef4444' : 'var(--text-primary)' }}>
            {executiveMetrics.totalOverdueItems}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Across all active projects
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* HEALTH & TEAM ROW                                                 */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Portfolio Health */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            Portfolio Health
          </h3>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#22c55e' }}>{executiveMetrics.healthCounts.onTrack}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>On Track</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>{executiveMetrics.healthCounts.atRisk}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>At Risk</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>{executiveMetrics.healthCounts.critical}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Critical</div>
            </div>
          </div>

          {/* Health Bar */}
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: '6px', height: '12px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${(executiveMetrics.healthCounts.onTrack / executiveMetrics.activeProjects) * 100}%`, background: '#22c55e', height: '100%' }} />
            <div style={{ width: `${(executiveMetrics.healthCounts.atRisk / executiveMetrics.activeProjects) * 100}%`, background: '#f59e0b', height: '100%' }} />
            <div style={{ width: `${(executiveMetrics.healthCounts.critical / executiveMetrics.activeProjects) * 100}%`, background: '#ef4444', height: '100%' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            <span>{Math.round((executiveMetrics.healthCounts.onTrack / executiveMetrics.activeProjects) * 100) || 0}% healthy</span>
            <span>{executiveMetrics.activeProjects} active projects</span>
          </div>
        </div>

        {/* Team Overview */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            Team Overview
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{executiveMetrics.teamSize}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Team Members</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{executiveMetrics.avgProjectsPerPM}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Avg Projects/PM</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{executiveMetrics.factoryStats.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Factories</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SALES PIPELINE SUMMARY                                            */}
      {/* ================================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        marginBottom: 'var(--space-lg)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} style={{ color: '#3b82f6' }} />
          Sales Pipeline Overview
          <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-tertiary)', marginLeft: '8px' }}>Read-Only</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {/* Pipeline Value */}
          <div style={{
            padding: '14px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
              {formatCurrency(salesPipelineMetrics.pipelineValue)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '4px' }}>
              Pipeline ({salesPipelineMetrics.pipelineCount})
            </div>
          </div>

          {/* Weighted Pipeline */}
          <div style={{
            padding: '14px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
              {formatCurrency(salesPipelineMetrics.weightedPipelineValue)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '4px' }}>
              Weighted Value
            </div>
          </div>

          {/* Won Revenue */}
          <div style={{
            padding: '14px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
              {formatCurrency(salesPipelineMetrics.wonValue)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '4px' }}>
              Won ({salesPipelineMetrics.wonCount})
            </div>
          </div>

          {/* Win Rate */}
          <div style={{
            padding: '14px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {salesPipelineMetrics.winRate}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '4px' }}>
              Win Rate
            </div>
          </div>

          {/* PM Flagged */}
          <div style={{
            padding: '14px',
            background: salesPipelineMetrics.pmFlaggedCount > 0 ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: salesPipelineMetrics.pmFlaggedCount > 0 ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: salesPipelineMetrics.pmFlaggedCount > 0 ? '#8b5cf6' : 'var(--text-primary)' }}>
              {salesPipelineMetrics.pmFlaggedCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: '4px' }}>
              PM Flagged
            </div>
          </div>
        </div>

        {/* Forecast Section */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Next 30d</span>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(salesPipelineMetrics.forecast.next30)}</span>
            </div>
          </div>
          <div style={{ flex: 1, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Next 60d</span>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(salesPipelineMetrics.forecast.next60)}</span>
            </div>
          </div>
          <div style={{ flex: 1, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Next 90d</span>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(salesPipelineMetrics.forecast.next90)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* PM FLAGGED & RECENTLY CONVERTED ROW                               */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* PM Flagged Quotes */}
        <div style={{
          background: salesPipelineMetrics.pmFlaggedCount > 0 ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: salesPipelineMetrics.pmFlaggedCount > 0 ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: salesPipelineMetrics.pmFlaggedCount > 0 ? '#8b5cf6' : 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flag size={18} style={{ color: '#8b5cf6' }} />
            Needs PM Attention ({salesPipelineMetrics.pmFlaggedCount})
          </h3>

          {salesPipelineMetrics.pmFlaggedQuotes.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No quotes flagged for PM</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {salesPipelineMetrics.pmFlaggedQuotes.slice(0, 5).map(quote => (
                <div
                  key={quote.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {quote.project_name || quote.quote_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {quote.dealer?.name || quote.customer?.company_name || 'Unknown'}
                    </div>
                    {quote.pm_flagged_reason && (
                      <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '4px', fontStyle: 'italic' }}>
                        "{quote.pm_flagged_reason}"
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: 'var(--sunbelt-orange)', fontSize: '0.9rem' }}>
                      {formatCurrency(quote.total_price)}
                    </div>
                    {quote.pm_flagged_at && (
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {Math.floor((new Date() - new Date(quote.pm_flagged_at)) / (1000 * 60 * 60 * 24))}d ago
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Converted */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowRight size={18} style={{ color: '#10b981' }} />
            Recently Converted (30 days)
          </h3>

          {salesPipelineMetrics.recentlyConverted.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No quotes converted recently</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {salesPipelineMetrics.recentlyConverted.slice(0, 5).map(quote => (
                <div
                  key={quote.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {quote.project?.project_number || 'Project'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      From: {quote.quote_number || 'Quote'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#10b981', fontSize: '0.875rem' }}>
                      {formatCurrency(quote.project?.contract_value || quote.total_price)}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {quote.daysAgo === 0 ? 'Today' : `${quote.daysAgo}d ago`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* FACTORY PERFORMANCE                                               */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--border-color)',
        marginBottom: 'var(--space-lg)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Factory size={18} style={{ color: 'var(--sunbelt-orange)' }} />
          Factory Performance
        </h3>

        {executiveMetrics.factoryStats.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No factory data available</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {executiveMetrics.factoryStats.map(factory => (
              <div
                key={factory.name}
                style={{
                  padding: '16px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '0.9375rem' }}>
                  {factory.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Active</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{factory.active}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Value</span>
                  <span style={{ fontWeight: '600', color: 'var(--sunbelt-orange)' }}>{formatCurrency(factory.value)}</span>
                </div>
                {factory.atRisk > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>At Risk</span>
                    <span style={{ fontWeight: '600', color: '#f59e0b' }}>{factory.atRisk}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* DELIVERIES & CLIENTS ROW                                          */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Upcoming Deliveries */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            Upcoming Deliveries (60 days)
          </h3>

          {executiveMetrics.upcomingDeliveries.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No upcoming deliveries</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {executiveMetrics.upcomingDeliveries.map(project => (
                <div
                  key={project.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {project.project_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{project.name}</div>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    background: project.daysUntil <= 7 ? 'rgba(239, 68, 68, 0.15)' : project.daysUntil <= 14 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: project.daysUntil <= 7 ? '#ef4444' : project.daysUntil <= 14 ? '#f59e0b' : '#22c55e'
                  }}>
                    {project.daysUntil === 0 ? 'Today' : project.daysUntil === 1 ? 'Tomorrow' : `${project.daysUntil} days`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Clients */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            Top Clients by Value
          </h3>

          {executiveMetrics.clientStats.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No client data available</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {executiveMetrics.clientStats.map((client, idx) => (
                <div
                  key={client.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: idx === 0 ? 'var(--sunbelt-orange)' : 'var(--bg-tertiary)',
                      color: idx === 0 ? 'white' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        {client.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {client.active} active • {client.total} total
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', color: 'var(--sunbelt-orange)', fontSize: '0.9375rem' }}>
                    {formatCurrency(client.value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* COMPLETION TREND                                                   */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} style={{ color: 'var(--sunbelt-orange)' }} />
          Project Completions (6 months)
        </h3>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '120px' }}>
          {executiveMetrics.completionTrend.map((month, idx) => {
            const maxCount = Math.max(...executiveMetrics.completionTrend.map(m => m.count), 1);
            const heightPercent = (month.count / maxCount) * 100;
            
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '100%',
                  height: `${heightPercent}%`,
                  minHeight: month.count > 0 ? '20px' : '4px',
                  background: 'linear-gradient(180deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: '4px'
                }}>
                  {month.count > 0 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'white' }}>{month.count}</span>
                  )}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{month.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* MODALS                                                            */}
      {/* ================================================================== */}
      {showCreateProject && (
        <CreateProjectModal
          isOpen={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          onSuccess={() => {
            setShowCreateProject(false);
            fetchAllData();
            setToast({ message: 'Project created successfully', type: 'success' });
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {showPraxisImport && (
        <PraxisImportModal
          isOpen={showPraxisImport}
          onClose={() => setShowPraxisImport(false)}
          onSuccess={(importedProjects) => {
            setShowPraxisImport(false);
            fetchAllData();
            const count = Array.isArray(importedProjects) ? importedProjects.length : 1;
            setToast({ message: `${count} project(s) imported from Praxis`, type: 'success' });
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {/* ================================================================== */}
      {/* TOAST                                                             */}
      {/* ================================================================== */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontWeight: '500',
          fontSize: '0.875rem'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default VPDashboard;