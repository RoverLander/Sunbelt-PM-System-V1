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
  Package,
  Filter,
  X,
  SortAsc,
  SortDesc,
  Search,
  Eye
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../projects/CreateProjectModal';
import PraxisImportModal from '../projects/PraxisImportModal';
import QuoteDetail from '../sales/QuoteDetail';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatCurrency = (amount) => {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

const _formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const _formatFullDate = (dateString) => {
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
  const [_milestones, setMilestones] = useState([]);
  const [users, setUsers] = useState([]);
  const [quotes, setQuotes] = useState([]); // Sales quotes for pipeline visibility
  const [_timeRange, _setTimeRange] = useState('quarter'); // month, quarter, year
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showPraxisImport, setShowPraxisImport] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [toast, setToast] = useState(null);
  const [flaggingQuote, setFlaggingQuote] = useState(null); // Quote being flagged
  const [flagNotes, setFlagNotes] = useState('');
  const [flagging, setFlagging] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null); // Quote detail view
  const [teamViewTab, setTeamViewTab] = useState('pm'); // 'pm' | 'production'

  // Quote filtering and viewing state
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [quoteFilters, setQuoteFilters] = useState({
    factory: '',
    buildingType: '',
    status: '',
    search: ''
  });
  const [quoteSortBy, setQuoteSortBy] = useState('created_at'); // 'created_at', 'total_price', 'project_name', 'factory'
  const [quoteSortDir, setQuoteSortDir] = useState('desc'); // 'asc', 'desc'

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
  // FLAG QUOTE FOR PM HANDLER
  // ==========================================================================
  const handleFlagForPM = async (quote, unflag = false) => {
    if (!quote) return;

    setFlagging(true);
    try {
      const updates = unflag ? {
        is_pm_flagged: false,
        pm_flagged_at: null,
        pm_flagged_by: null,
        pm_flag_notes: null
      } : {
        is_pm_flagged: true,
        pm_flagged_at: new Date().toISOString(),
        pm_flagged_by: user?.id,
        pm_flag_notes: flagNotes.trim() || null
      };

      const { error } = await supabase
        .from('sales_quotes')
        .update(updates)
        .eq('id', quote.id);

      if (error) throw error;

      // Create notification for PM team (Director and VP)
      if (!unflag) {
        const pmTeam = users.filter(u => ['Director', 'VP'].includes(u.role));
        const notifications = pmTeam.map(pm => ({
          user_id: pm.id,
          type: 'pm_flag',
          title: 'Quote Flagged for PM Review',
          message: `Quote ${quote.quote_number || quote.project_name} has been flagged as a PM project${flagNotes ? ': ' + flagNotes : ''}`,
          related_type: 'quote',
          related_id: quote.id,
          created_by: user?.id
        }));

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications).catch(err => {
            console.warn('Could not create notifications:', err);
          });
        }
      }

      setToast({
        message: unflag
          ? `Quote unflagged from PM review`
          : `Quote flagged for PM review`,
        type: 'success'
      });
      setTimeout(() => setToast(null), 3000);

      // Refresh data
      fetchAllData();
    } catch (error) {
      console.error('Error flagging quote:', error);
      setToast({ message: 'Failed to update quote flag', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setFlagging(false);
      setFlaggingQuote(null);
      setFlagNotes('');
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
    // PM roles: PM, Project_Manager, Project Manager, Director
    const pms = users.filter(u =>
      ['PM', 'Project_Manager', 'Project Manager', 'Director'].includes(u.role)
    );
    const avgProjectsPerPM = pms.length > 0
      ? (activeProjects.length / pms.length).toFixed(1)
      : 0;

    // Production roles: Plant Manager, Plant_Manager, Plant_GM, PC, Project Coordinator
    const productionStaff = users.filter(u =>
      ['Plant Manager', 'Plant_Manager', 'Plant_GM', 'PC', 'Project Coordinator', 'plant manager', 'plant_manager', 'plant_gm', 'pc', 'project coordinator'].includes(u.role)
    );

    // Group PMs by factory for workload view (legacy - kept for reference)
    // Find PMs who have projects assigned at each factory (by owner_id, assigned_pm_id, or primary_pm_id)
    const pmsByFactory = factories.reduce((acc, factory) => {
      const factoryProjects = activeProjects.filter(p => p.factory === factory);

      // Find unique PMs who have projects at this factory
      const pmIdsAtFactory = new Set();
      factoryProjects.forEach(p => {
        if (p.owner_id) pmIdsAtFactory.add(p.owner_id);
        if (p.assigned_pm_id) pmIdsAtFactory.add(p.assigned_pm_id);
        if (p.primary_pm_id) pmIdsAtFactory.add(p.primary_pm_id);
      });

      const factoryPMs = pms.filter(pm => pmIdsAtFactory.has(pm.id));

      acc[factory] = {
        pms: factoryPMs,
        projectCount: factoryProjects.length,
        avgLoad: factoryPMs.length > 0 ? (factoryProjects.length / factoryPMs.length).toFixed(1) : 0
      };
      return acc;
    }, {});

    // NEW: Group factories by PM (PMs as top level with factories underneath)
    const factoriesByPM = pms.reduce((acc, pm) => {
      // Find all projects where this PM is assigned
      const pmProjects = activeProjects.filter(p =>
        p.owner_id === pm.id || p.assigned_pm_id === pm.id || p.primary_pm_id === pm.id
      );

      // Group PM's projects by factory
      const pmFactories = {};
      pmProjects.forEach(project => {
        const factory = project.factory || 'Unassigned';
        if (!pmFactories[factory]) {
          pmFactories[factory] = { name: factory, projectCount: 0 };
        }
        pmFactories[factory].projectCount++;
      });

      acc[pm.id] = {
        pm: pm,
        name: pm.name || pm.email || 'Unknown PM',
        totalProjects: pmProjects.length,
        factories: Object.values(pmFactories).sort((a, b) => b.projectCount - a.projectCount)
      };
      return acc;
    }, {});

    // Group production staff by factory
    const productionByFactory = factories.reduce((acc, factory) => {
      const factoryProduction = productionStaff.filter(p => p.factory === factory);
      acc[factory] = {
        staff: factoryProduction,
        count: factoryProduction.length
      };
      return acc;
    }, {});

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
      pms,
      productionStaff,
      pmsByFactory,
      factoriesByPM,
      productionByFactory,

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
    const pmFlaggedQuotes = quotes.filter(q => q.is_pm_flagged && ACTIVE_STATUSES.includes(q.status));

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
    const _now = new Date();
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
      activeQuotes, // All active quotes for pipeline view with flag buttons
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
  // FILTERED & SORTED QUOTES
  // ==========================================================================
  const filteredAndSortedQuotes = useMemo(() => {
    let result = [...(salesPipelineMetrics.activeQuotes || [])];

    // Apply filters
    if (quoteFilters.factory) {
      result = result.filter(q => (q.factory || q.praxis_source_factory || '').toLowerCase() === quoteFilters.factory.toLowerCase());
    }
    if (quoteFilters.buildingType) {
      result = result.filter(q => (q.building_type || '').toLowerCase() === quoteFilters.buildingType.toLowerCase());
    }
    if (quoteFilters.status) {
      result = result.filter(q => q.status === quoteFilters.status);
    }
    if (quoteFilters.search) {
      const searchLower = quoteFilters.search.toLowerCase();
      result = result.filter(q =>
        (q.project_name || '').toLowerCase().includes(searchLower) ||
        (q.quote_number || '').toLowerCase().includes(searchLower) ||
        (q.dealer?.name || '').toLowerCase().includes(searchLower) ||
        (q.customer?.company_name || '').toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal, bVal;
      switch (quoteSortBy) {
        case 'total_price':
          aVal = a.total_price || 0;
          bVal = b.total_price || 0;
          break;
        case 'project_name':
          aVal = (a.project_name || a.quote_number || '').toLowerCase();
          bVal = (b.project_name || b.quote_number || '').toLowerCase();
          break;
        case 'factory':
          aVal = (a.factory || a.praxis_source_factory || '').toLowerCase();
          bVal = (b.factory || b.praxis_source_factory || '').toLowerCase();
          break;
        case 'module_count':
          aVal = a.module_count || 0;
          bVal = b.module_count || 0;
          break;
        default: // created_at
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
      }

      if (typeof aVal === 'string') {
        return quoteSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return quoteSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [salesPipelineMetrics.activeQuotes, quoteFilters, quoteSortBy, quoteSortDir]);

  // Get unique values for filter dropdowns
  const quoteFilterOptions = useMemo(() => {
    const quotes = salesPipelineMetrics.activeQuotes || [];
    return {
      factories: [...new Set(quotes.map(q => q.factory || q.praxis_source_factory).filter(Boolean))].sort(),
      buildingTypes: [...new Set(quotes.map(q => q.building_type).filter(Boolean))].sort(),
      statuses: [...new Set(quotes.map(q => q.status).filter(Boolean))].sort()
    };
  }, [salesPipelineMetrics.activeQuotes]);

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
  // RENDER - QUOTE DETAIL VIEW
  // ==========================================================================
  if (selectedQuote) {
    return (
      <QuoteDetail
        quote={selectedQuote}
        onBack={() => setSelectedQuote(null)}
        onRefresh={() => {
          fetchAllData();
          setSelectedQuote(null);
        }}
      />
    );
  }

  // ==========================================================================
  // RENDER - MAIN
  // ==========================================================================
  return (
    <div style={{ maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
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
        gridTemplateColumns: '1fr 2fr',
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

        {/* Team Management - Enhanced */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          {/* Header with tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              Team Management
            </h3>

            {/* PM vs Production Tabs */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              gap: '2px'
            }}>
              <button
                onClick={() => setTeamViewTab('pm')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: teamViewTab === 'pm' ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  color: teamViewTab === 'pm' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: teamViewTab === 'pm' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Briefcase size={14} />
                Project Management
              </button>
              <button
                onClick={() => setTeamViewTab('production')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: teamViewTab === 'production' ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  color: teamViewTab === 'production' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: teamViewTab === 'production' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Factory size={14} />
                Production
              </button>
            </div>
          </div>

          {/* Summary Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {teamViewTab === 'pm' ? executiveMetrics.teamSize : executiveMetrics.productionStaff?.length || 0}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                {teamViewTab === 'pm' ? 'PM Team' : 'Production Staff'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {teamViewTab === 'pm' ? executiveMetrics.avgProjectsPerPM : executiveMetrics.factoryStats.length}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                {teamViewTab === 'pm' ? 'Avg Projects/PM' : 'Factories'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {executiveMetrics.activeProjects}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active Projects</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {executiveMetrics.factoryStats.length}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Locations</div>
            </div>
          </div>

          {/* PM View: PMs as top level with their Factories underneath */}
          {teamViewTab === 'pm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {Object.values(executiveMetrics.factoriesByPM || {})
                .filter(data => data.totalProjects > 0) // Only show PMs with projects
                .sort((a, b) => b.totalProjects - a.totalProjects) // Sort by project count descending
                .map((data) => (
                <div
                  key={data.pm.id}
                  style={{
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {/* PM Header Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: data.factories.length > 0 ? '10px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--sunbelt-orange), #f59e0b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '0.875rem'
                      }}>
                        {data.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{data.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {data.factories.length} {data.factories.length === 1 ? 'factory' : 'factories'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--sunbelt-orange)' }}>{data.totalProjects}</div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Projects</div>
                      </div>
                    </div>
                  </div>

                  {/* Factories under this PM */}
                  {data.factories.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '46px' }}>
                      {data.factories.map((factory) => (
                        <div
                          key={factory.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem'
                          }}
                        >
                          <Factory size={12} style={{ color: '#8b5cf6' }} />
                          <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{factory.name}</span>
                          <span style={{
                            background: 'var(--sunbelt-orange)',
                            color: 'white',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            fontSize: '0.6875rem',
                            fontWeight: '600'
                          }}>
                            {factory.projectCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {Object.values(executiveMetrics.factoriesByPM || {}).filter(d => d.totalProjects > 0).length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  No PMs with active projects
                </div>
              )}
            </div>
          )}

          {/* Production View: Factory Breakdown with Production Staff */}
          {teamViewTab === 'production' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {Object.entries(executiveMetrics.productionByFactory || {}).map(([factory, data]) => (
                <div
                  key={factory}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(249, 115, 22, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Factory size={16} color="#f97316" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{factory}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {data.staff?.map(s => s.name?.split(' ')[0]).join(', ') || 'No staff assigned'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{data.count}</div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Staff</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--sunbelt-orange)' }}>
                        {executiveMetrics.factoryStats.find(f => f.name === factory)?.active || 0}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active</div>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(executiveMetrics.productionByFactory || {}).length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  No factory data available
                </div>
              )}
            </div>
          )}
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
      {/* PIPELINE QUOTES WITH FLAG ACTIONS                                 */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--border-color)',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Header with title and View All button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} style={{ color: '#3b82f6' }} />
            Active Pipeline Quotes ({salesPipelineMetrics.pipelineCount})
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Click flag icon to mark as PM project
            </span>
            <button
              onClick={() => setShowAllQuotes(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: '500'
              }}
            >
              <Eye size={14} />
              View All
            </button>
          </div>
        </div>

        {salesPipelineMetrics.activeQuotes?.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No active quotes in pipeline</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
            {salesPipelineMetrics.activeQuotes?.slice(0, 12).map(quote => (
              <div
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '14px',
                  background: quote.is_pm_flagged ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: quote.is_pm_flagged ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {quote.project_name || quote.quote_number}
                    </div>
                    {quote.is_pm_flagged && (
                      <span style={{
                        background: '#8b5cf6',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.625rem',
                        fontWeight: '600'
                      }}>
                        PM
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {quote.factory} • {quote.dealer?.name || quote.customer?.company_name || 'Unknown'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--sunbelt-orange)', fontSize: '0.875rem' }}>
                      {formatCurrency(quote.total_price)}
                    </span>
                    {quote.building_type && (
                      <span style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.625rem'
                      }}>
                        {quote.building_type}
                      </span>
                    )}
                    {quote.module_count && (
                      <span style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.625rem'
                      }}>
                        {quote.module_count} modules
                      </span>
                    )}
                  </div>
                </div>
                {/* Flag Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening quote detail
                    if (quote.is_pm_flagged) {
                      handleFlagForPM(quote, true); // Unflag
                    } else {
                      setFlaggingQuote(quote);
                    }
                  }}
                  title={quote.is_pm_flagged ? 'Remove PM flag' : 'Flag as PM project'}
                  style={{
                    background: quote.is_pm_flagged ? '#8b5cf6' : 'var(--bg-tertiary)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '10px'
                  }}
                >
                  <Flag
                    size={16}
                    fill={quote.is_pm_flagged ? 'white' : 'none'}
                    color={quote.is_pm_flagged ? 'white' : 'var(--text-secondary)'}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Show more indicator if there are more than 12 quotes */}
        {salesPipelineMetrics.pipelineCount > 12 && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => setShowAllQuotes(true)}
              style={{
                padding: '8px 24px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              View all {salesPipelineMetrics.pipelineCount} quotes
            </button>
          </div>
        )}
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
                  onClick={() => setSelectedQuote(quote)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = '#8b5cf6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {quote.project_name || quote.quote_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {quote.dealer?.name || quote.customer?.company_name || 'Unknown'}
                    </div>
                    {quote.pm_flag_notes && (
                      <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '4px', fontStyle: 'italic' }}>
                        "{quote.pm_flag_notes}"
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--sunbelt-orange)', fontSize: '0.9rem' }}>
                        {formatCurrency(quote.total_price)}
                      </div>
                      {quote.pm_flagged_at && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {Math.floor((new Date() - new Date(quote.pm_flagged_at)) / (1000 * 60 * 60 * 24))}d ago
                        </div>
                      )}
                    </div>
                    {/* Unflag Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFlagForPM(quote, true); }}
                      title="Remove PM flag"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        fontSize: '0.625rem',
                        color: '#ef4444',
                        fontWeight: '600'
                      }}
                    >
                      Unflag
                    </button>
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
                  onClick={() => setSelectedQuote(quote)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = '#10b981'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
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
      {/* FACTORY, DELIVERIES & CLIENTS ROW                                 */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Factory Performance */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Factory size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            Factory Performance
          </h3>

          {executiveMetrics.factoryStats.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No factory data available</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {executiveMetrics.factoryStats.map(factory => (
                <div
                  key={factory.name}
                  style={{
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                      {factory.name}
                    </span>
                    {factory.atRisk > 0 && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.6875rem',
                        fontWeight: '600',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b'
                      }}>
                        {factory.atRisk} at risk
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{factory.active} active</span>
                    <span style={{ fontWeight: '600', color: 'var(--sunbelt-orange)' }}>{formatCurrency(factory.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
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

      {/* PM Flag Modal */}
      {flaggingQuote && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => { setFlaggingQuote(null); setFlagNotes(''); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              width: '100%',
              maxWidth: '450px',
              border: '1px solid var(--border-color)'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flag size={20} style={{ color: '#8b5cf6' }} />
              Flag as PM Project
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                {flaggingQuote.project_name || flaggingQuote.quote_number}
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: '4px' }}>
                {flaggingQuote.factory} • {formatCurrency(flaggingQuote.total_price)}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Notes (optional)
              </label>
              <textarea
                value={flagNotes}
                onChange={(e) => setFlagNotes(e.target.value)}
                placeholder="Why is this a PM project? Any special requirements..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
              Flagging this quote will notify the PM team (Director and VP) and mark it for PM review.
              When converted to a project, it will appear in the Director's assignment queue.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setFlaggingQuote(null); setFlagNotes(''); }}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleFlagForPM(flaggingQuote)}
                disabled={flagging}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  background: '#8b5cf6',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: flagging ? 'not-allowed' : 'pointer',
                  opacity: flagging ? 0.7 : 1
                }}
              >
                <Flag size={16} />
                {flagging ? 'Flagging...' : 'Flag for PM'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* VIEW ALL QUOTES MODAL                                             */}
      {/* ================================================================== */}
      {showAllQuotes && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => {
            setShowAllQuotes(false);
            setQuoteFilters({ factory: '', buildingType: '', status: '', search: '' });
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={24} style={{ color: '#3b82f6' }} />
                All Pipeline Quotes
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>
                  ({filteredAndSortedQuotes.length} of {salesPipelineMetrics.pipelineCount})
                </span>
              </h2>
              <button
                onClick={() => {
                  setShowAllQuotes(false);
                  setQuoteFilters({ factory: '', buildingType: '', status: '', search: '' });
                }}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Filter Bar */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Search quotes..."
                  value={quoteFilters.search}
                  onChange={(e) => setQuoteFilters(prev => ({ ...prev, search: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Factory Filter */}
              <select
                value={quoteFilters.factory}
                onChange={(e) => setQuoteFilters(prev => ({ ...prev, factory: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Factories</option>
                {quoteFilterOptions.factories.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              {/* Building Type Filter */}
              <select
                value={quoteFilters.buildingType}
                onChange={(e) => setQuoteFilters(prev => ({ ...prev, buildingType: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Building Types</option>
                {quoteFilterOptions.buildingTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={quoteFilters.status}
                onChange={(e) => setQuoteFilters(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Statuses</option>
                {quoteFilterOptions.statuses.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>

              {/* Sort By */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Sort:</span>
                <select
                  value={quoteSortBy}
                  onChange={(e) => setQuoteSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="created_at">Date Created</option>
                  <option value="total_price">Price</option>
                  <option value="project_name">Name</option>
                  <option value="factory">Factory</option>
                  <option value="module_count">Modules</option>
                </select>
                <button
                  onClick={() => setQuoteSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                  style={{
                    padding: '8px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={quoteSortDir === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {quoteSortDir === 'asc' ? (
                    <SortAsc size={16} color="var(--text-secondary)" />
                  ) : (
                    <SortDesc size={16} color="var(--text-secondary)" />
                  )}
                </button>
              </div>

              {/* Clear Filters */}
              {(quoteFilters.factory || quoteFilters.buildingType || quoteFilters.status || quoteFilters.search) && (
                <button
                  onClick={() => setQuoteFilters({ factory: '', buildingType: '', status: '', search: '' })}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ef4444',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>

            {/* Quote List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 24px'
            }}>
              {filteredAndSortedQuotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                  <Package size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No quotes match your filters</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredAndSortedQuotes.map(quote => (
                    <div
                      key={quote.id}
                      onClick={() => {
                        setShowAllQuotes(false);
                        setSelectedQuote(quote);
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        background: quote.is_pm_flagged ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: quote.is_pm_flagged ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = quote.is_pm_flagged ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = quote.is_pm_flagged ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)';
                      }}
                    >
                      {/* Left: Name and details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                            {quote.project_name || quote.quote_number}
                          </div>
                          {quote.is_pm_flagged && (
                            <span style={{
                              background: '#8b5cf6',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.625rem',
                              fontWeight: '600'
                            }}>
                              PM
                            </span>
                          )}
                          <span style={{
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            textTransform: 'capitalize'
                          }}>
                            {(quote.status || '').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          {quote.dealer?.name || quote.customer?.company_name || 'Unknown Customer'}
                        </div>
                      </div>

                      {/* Middle: Factory, Building Type, Modules */}
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginRight: '20px' }}>
                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {quote.factory || '-'}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Factory</div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {quote.building_type || '-'}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Type</div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '60px' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {quote.module_count || '-'}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Modules</div>
                        </div>
                      </div>

                      {/* Right: Price and Flag button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', color: 'var(--sunbelt-orange)', fontSize: '1rem' }}>
                            {formatCurrency(quote.total_price)}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                            {quote.outlook_percentage || 50}% outlook
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (quote.is_pm_flagged) {
                              handleFlagForPM(quote, true);
                            } else {
                              setFlaggingQuote(quote);
                              setShowAllQuotes(false);
                            }
                          }}
                          title={quote.is_pm_flagged ? 'Remove PM flag' : 'Flag as PM project'}
                          style={{
                            background: quote.is_pm_flagged ? '#8b5cf6' : 'var(--bg-tertiary)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Flag
                            size={16}
                            fill={quote.is_pm_flagged ? 'white' : 'none'}
                            color={quote.is_pm_flagged ? 'white' : 'var(--text-secondary)'}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                Total Value: <span style={{ fontWeight: '700', color: 'var(--sunbelt-orange)' }}>
                  {formatCurrency(filteredAndSortedQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0))}
                </span>
                {' '}•{' '}
                Weighted: <span style={{ fontWeight: '600', color: '#8b5cf6' }}>
                  {formatCurrency(filteredAndSortedQuotes.reduce((sum, q) => sum + ((q.total_price || 0) * ((q.outlook_percentage || 50) / 100)), 0))}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowAllQuotes(false);
                  setQuoteFilters({ factory: '', buildingType: '', status: '', search: '' });
                }}
                style={{
                  padding: '10px 20px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
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