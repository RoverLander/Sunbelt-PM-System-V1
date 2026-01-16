// ============================================================================
// DirectorDashboard Component - Responsive Version (Praxis Enhanced)
// ============================================================================
// Max-width container with responsive grids for all screen sizes
//
// PRAXIS ENHANCEMENTS:
// - Praxis fields in project table (building type, sqft, modules, dealer)
// - Weighted PM workload toggle (simple vs difficulty-weighted)
// - Incoming Projects section (quotes at 95%+ outlook)
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Calendar,
  ChevronRight,
  Settings,
  Filter,
  Search,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  ArrowRight,
  Activity,
  Layers,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  FileUp,
  Plus,
  Package,
  Star,
  Truck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import GanttTimeline from './GanttTimeline';
import RiskSettingsModal from './RiskSettingsModal';
import TeamWorkloadView from './TeamWorkloadView';
import RecentActivityFeed from './RecentActivityFeed';
import CreateProjectModal from '../projects/CreateProjectModal';
import PraxisImportModal from '../projects/PraxisImportModal';

// ============================================================================
// DEFAULT RISK SETTINGS
// ============================================================================
const DEFAULT_RISK_SETTINGS = {
  overdueThreshold: 0,
  stalledDays: 14,
  upcomingDeadlineDays: 7,
  criticalDeadlineDays: 3,
  atRiskItemCount: 3
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// eslint-disable-next-line no-unused-vars
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatShortDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
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

// eslint-disable-next-line no-unused-vars
const getDaysOverdue = (dateString) => {
  const days = getDaysUntil(dateString);
  return days !== null && days < 0 ? Math.abs(days) : 0;
};

const formatCurrency = (amount) => {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

const formatSqft = (sqft) => {
  if (!sqft) return '-';
  return `${sqft.toLocaleString()} sqft`;
};

// Building type badge colors
const BUILDING_TYPE_COLORS = {
  'CUSTOM': '#f59e0b',
  'FLEET/STOCK': '#3b82f6',
  'GOVERNMENT': '#22c55e',
  'Business': '#8b5cf6'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function DirectorDashboard() {
  const { user: _user } = useAuth();

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

  const [quotes, setQuotes] = useState([]); // Sales quotes for incoming projects
  const [selectedProject, setSelectedProject] = useState(null);
  const [showRiskSettings, setShowRiskSettings] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showPraxisImport, setShowPraxisImport] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [filterPM, setFilterPM] = useState('all');
  const [filterFactory, setFilterFactory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState('timeline');
  const [useWeightedWorkload, setUseWeightedWorkload] = useState(false); // Toggle for workload calculation
  const [toast, setToast] = useState(null);

  const [riskSettings, setRiskSettings] = useState(() => {
    const saved = localStorage.getItem('directorRiskSettings');
    return saved ? JSON.parse(saved) : DEFAULT_RISK_SETTINGS;
  });

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes, rfisRes, submittalsRes, milestonesRes, usersRes, quotesRes] = await Promise.all([
        supabase.from('projects').select('*').order('updated_at', { ascending: false }),
        supabase.from('tasks').select('*, project:project_id(id, project_number), assignee:assignee_id(name)'),
        supabase.from('rfis').select('*, project:project_id(id, project_number)'),
        supabase.from('submittals').select('*, project:project_id(id, project_number)'),
        supabase.from('milestones').select('*, project:project_id(id, project_number)'),
        supabase.from('users').select('*').eq('is_active', true),
        // Fetch high-probability quotes for "Incoming Projects" section
        supabase.from('sales_quotes').select(`
          *,
          dealer:dealer_id(id, code, name, branch_name)
        `).eq('is_latest_version', true).gte('outlook_percentage', 95).order('expected_close_timeframe', { ascending: true })
      ]);

      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
      setMilestones(milestonesRes.data || []);
      setUsers(usersRes.data || []);
      setQuotes(quotesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // CALCULATE METRICS
  // ==========================================================================
  const portfolioMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];

    const activeProjects = projects.filter(p => activeStatuses.includes(p.status));

    const projectsWithHealth = activeProjects.map(project => {
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

      let healthStatus = 'on-track';
      if (totalOverdue >= riskSettings.atRiskItemCount || (deliveryDays !== null && deliveryDays <= riskSettings.criticalDeadlineDays)) {
        healthStatus = 'critical';
      } else if (totalOverdue > 0 || (deliveryDays !== null && deliveryDays <= riskSettings.upcomingDeadlineDays)) {
        healthStatus = 'at-risk';
      }

      return {
        ...project,
        totalOverdue,
        overdueTasks,
        overdueRFIs,
        overdueSubmittals,
        deliveryDays,
        healthStatus,
        isDeliveryCritical: deliveryDays !== null && deliveryDays <= riskSettings.criticalDeadlineDays
      };
    });

    const onTrack = projectsWithHealth.filter(p => p.healthStatus === 'on-track').length;
    const atRisk = projectsWithHealth.filter(p => p.healthStatus === 'at-risk').length;
    const critical = projectsWithHealth.filter(p => p.healthStatus === 'critical').length;
    const criticalProjects = projectsWithHealth.filter(p => p.healthStatus === 'critical');

    const totalOverdueItems = projectsWithHealth.reduce((sum, p) => sum + p.totalOverdue, 0);

    const upcomingDeadlines = [
      ...tasks.filter(t => {
        const days = getDaysUntil(t.due_date);
        return days !== null && days >= 0 && days <= riskSettings.upcomingDeadlineDays && !['Completed', 'Cancelled'].includes(t.status);
      }).map(t => ({ ...t, type: 'task', daysUntil: getDaysUntil(t.due_date) })),
      ...rfis.filter(r => {
        const days = getDaysUntil(r.due_date);
        return days !== null && days >= 0 && days <= riskSettings.upcomingDeadlineDays && !['Answered', 'Closed'].includes(r.status);
      }).map(r => ({ ...r, type: 'rfi', daysUntil: getDaysUntil(r.due_date) })),
      ...submittals.filter(s => {
        const days = getDaysUntil(s.due_date);
        return days !== null && days >= 0 && days <= riskSettings.upcomingDeadlineDays && ['Pending', 'Submitted', 'Under Review'].includes(s.status);
      }).map(s => ({ ...s, type: 'submittal', daysUntil: getDaysUntil(s.due_date) }))
    ].sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 10);

    return {
      totalActive: activeProjects.length,
      onTrack,
      atRisk,
      critical,
      totalOverdueItems,
      criticalProjects,
      stalledProjects: [],
      upcomingDeadlines,
      projectsWithHealth
    };
  }, [projects, tasks, rfis, submittals, riskSettings]);

  // ==========================================================================
  // FILTERED PROJECTS
  // ==========================================================================
  const filteredProjects = useMemo(() => {
    let filtered = portfolioMetrics.projectsWithHealth;

    if (filterStatus === 'active') {
      filtered = filtered.filter(p => ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'].includes(p.status));
    } else if (filterStatus === 'at-risk') {
      filtered = filtered.filter(p => p.healthStatus === 'at-risk' || p.healthStatus === 'critical');
    } else if (filterStatus === 'critical') {
      filtered = filtered.filter(p => p.healthStatus === 'critical');
    }

    if (filterPM !== 'all') {
      filtered = filtered.filter(p => p.owner_id === filterPM);
    }

    if (filterFactory !== 'all') {
      filtered = filtered.filter(p => p.factory === filterFactory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.project_number?.toLowerCase().includes(term) ||
        p.name?.toLowerCase().includes(term) ||
        p.client_name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [portfolioMetrics.projectsWithHealth, filterStatus, filterPM, filterFactory, searchTerm]);

  // ==========================================================================
  // INCOMING PROJECTS (High-Probability Quotes)
  // ==========================================================================
  const incomingProjects = useMemo(() => {
    // Only show unconverted quotes at 95%+ outlook
    return quotes.filter(q =>
      !q.converted_to_project_id &&
      q.outlook_percentage >= 95 &&
      !['won', 'lost', 'expired', 'converted'].includes(q.status)
    ).sort((a, b) => (b.outlook_percentage || 0) - (a.outlook_percentage || 0));
  }, [quotes]);

  // ==========================================================================
  // WEIGHTED PM WORKLOAD CALCULATION
  // ==========================================================================
  const pmWorkloadStats = useMemo(() => {
    const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
    // Roles: 'PM', 'Director' (not 'Project Manager')
    const pms = users.filter(u => ['PM', 'Director'].includes(u.role));

    return pms.map(pm => {
      const pmProjects = projects.filter(p =>
        p.owner_id === pm.id && activeStatuses.includes(p.status)
      );

      // Simple count
      const projectCount = pmProjects.length;

      // Total contract value
      const totalValue = pmProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);

      // Weighted by difficulty (1-5, default to 3)
      const weightedCount = pmProjects.reduce((sum, p) => {
        const difficulty = p.difficulty_rating || 3;
        return sum + difficulty;
      }, 0);

      // Average difficulty
      const avgDifficulty = pmProjects.length > 0
        ? (weightedCount / pmProjects.length).toFixed(1)
        : 0;

      return {
        ...pm,
        projectCount,
        totalValue,
        weightedCount,
        avgDifficulty,
        projects: pmProjects
      };
    }).sort((a, b) => useWeightedWorkload
      ? b.weightedCount - a.weightedCount
      : b.projectCount - a.projectCount
    );
  }, [users, projects, useWeightedWorkload]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRiskSettingsSave = (newSettings) => {
    setRiskSettings(newSettings);
    localStorage.setItem('directorRiskSettings', JSON.stringify(newSettings));
    showToast('Risk settings updated');
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'at-risk': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  const uniqueFactories = [...new Set(projects.map(p => p.factory).filter(Boolean))];
  const uniquePMs = users.filter(u => ['Project Manager', 'Director', 'Admin'].includes(u.role));

  // ==========================================================================
  // RENDER - PROJECT DETAILS
  // ==========================================================================
  if (selectedProject) {
    return (
      <ProjectDetails
        project={selectedProject}
        onBack={() => {
          setSelectedProject(null);
          fetchDashboardData();
        }}
        onUpdate={(updated) => {
          setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
          setSelectedProject(updated);
          showToast('Project updated');
        }}
      />
    );
  }

  // ==========================================================================
  // RENDER - LOADING
  // ==========================================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Loading dashboard...</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - MAIN
  // ==========================================================================
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
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
            <BarChart3 size={28} style={{ color: 'var(--sunbelt-orange)' }} />
            Portfolio Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {portfolioMetrics.totalActive} active projects across your portfolio
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => fetchDashboardData()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
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
          <button
            onClick={() => setShowRiskSettings(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8125rem'
            }}
          >
            <Settings size={14} />
            Settings
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

      {/* SUMMARY CARDS - 5 columns max */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Active */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--info)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Active</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{portfolioMetrics.totalActive}</div>
        </div>

        {/* On Track */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>On Track</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#22c55e' }}>{portfolioMetrics.onTrack}</div>
        </div>

        {/* At Risk */}
        <div 
          onClick={() => portfolioMetrics.atRisk > 0 && setFilterStatus('at-risk')}
          style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)', cursor: portfolioMetrics.atRisk > 0 ? 'pointer' : 'default' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>At Risk</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f59e0b' }}>{portfolioMetrics.atRisk}</div>
        </div>

        {/* Critical */}
        <div
          onClick={() => portfolioMetrics.critical > 0 && setFilterStatus('critical')}
          style={{ background: portfolioMetrics.critical > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: portfolioMetrics.critical > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)', cursor: portfolioMetrics.critical > 0 ? 'pointer' : 'default' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertCircle size={18} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '0.8125rem', color: portfolioMetrics.critical > 0 ? '#ef4444' : 'var(--text-secondary)' }}>Critical</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#ef4444' }}>{portfolioMetrics.critical}</div>
        </div>

        {/* Overdue Items */}
        <div style={{ background: portfolioMetrics.totalOverdueItems > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: portfolioMetrics.totalOverdueItems > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Clock size={18} style={{ color: portfolioMetrics.totalOverdueItems > 0 ? '#ef4444' : 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.8125rem', color: portfolioMetrics.totalOverdueItems > 0 ? '#ef4444' : 'var(--text-secondary)' }}>Overdue</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: portfolioMetrics.totalOverdueItems > 0 ? '#ef4444' : 'var(--text-primary)' }}>{portfolioMetrics.totalOverdueItems}</div>
        </div>
      </div>

      {/* ATTENTION ALERTS */}
      {portfolioMetrics.criticalProjects.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: 'var(--space-lg)'
        }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#ef4444', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            Attention Required ({portfolioMetrics.criticalProjects.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {portfolioMetrics.criticalProjects.slice(0, 5).map(project => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{project.project_number}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{project.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                    {project.totalOverdue > 0 && <span style={{ color: '#ef4444' }}>{project.totalOverdue} overdue</span>}
                    {project.isDeliveryCritical && <span style={{ color: '#ef4444' }}>Delivery in {project.deliveryDays}d</span>}
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TWO COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', marginBottom: 'var(--space-lg)' }}>
        {/* TIMELINE */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div
            onClick={() => setExpandedSection(expandedSection === 'timeline' ? null : 'timeline')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer', borderBottom: expandedSection === 'timeline' ? '1px solid var(--border-color)' : 'none' }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              Project Timeline
            </h3>
            <ChevronDown size={18} style={{ color: 'var(--text-tertiary)', transform: expandedSection === 'timeline' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </div>
          {expandedSection === 'timeline' && (
            <div style={{ padding: '16px' }}>
              <GanttTimeline projects={filteredProjects} onProjectClick={setSelectedProject} />
            </div>
          )}
        </div>

        {/* UPCOMING DEADLINES */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              Upcoming ({portfolioMetrics.upcomingDeadlines.length})
            </h3>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {portfolioMetrics.upcomingDeadlines.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                No upcoming deadlines
              </div>
            ) : (
              portfolioMetrics.upcomingDeadlines.map((item, idx) => (
                <div key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.type === 'task' ? item.title : item.type === 'rfi' ? item.subject : item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {item.project?.project_number} • {item.type.toUpperCase()}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    background: item.daysUntil <= 2 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: item.daysUntil <= 2 ? '#ef4444' : '#f59e0b',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.daysUntil === 0 ? 'Today' : item.daysUntil === 1 ? 'Tomorrow' : `${item.daysUntil}d`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FILTERS & PROJECT TABLE */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: 'var(--space-lg)' }}>
        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>All Projects</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
              <option value="active">Active</option>
              <option value="at-risk">At Risk</option>
              <option value="critical">Critical</option>
              <option value="all">All</option>
            </select>
            <select value={filterPM} onChange={(e) => setFilterPM(e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
              <option value="all">All PMs</option>
              {uniquePMs.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
            </select>
            <select value={filterFactory} onChange={(e) => setFilterFactory(e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
              <option value="all">All Factories</option>
              {uniqueFactories.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '6px 10px 6px 30px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem', width: '150px' }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Project</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Type</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Specs</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Health</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Overdue</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Delivery</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.slice(0, 15).map(project => {
                const buildingTypeColor = BUILDING_TYPE_COLORS[project.building_type] || 'var(--text-tertiary)';
                return (
                  <tr
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{project.project_number}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{project.name}</div>
                      {project.dealer_name && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {project.dealer_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {project.building_type ? (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: '600',
                          background: `${buildingTypeColor}20`,
                          color: buildingTypeColor
                        }}>
                          {project.building_type}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem' }}>
                      {project.square_footage || project.module_count ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {project.square_footage && (
                            <span style={{ color: 'var(--text-secondary)' }}>{formatSqft(project.square_footage)}</span>
                          )}
                          {project.module_count && (
                            <span style={{ color: 'var(--text-tertiary)' }}>{project.module_count} module{project.module_count > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: getHealthColor(project.healthStatus)
                      }} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: project.totalOverdue > 0 ? '#ef4444' : 'var(--text-tertiary)', fontWeight: project.totalOverdue > 0 ? '600' : '400' }}>
                      {project.totalOverdue}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>{formatShortDate(project.delivery_date)}</div>
                      {project.promised_delivery_date && project.promised_delivery_date !== project.delivery_date && (
                        <div style={{ fontSize: '0.6875rem', color: '#f59e0b' }}>
                          Promised: {formatShortDate(project.promised_delivery_date)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProjects.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No projects match your filters
          </div>
        )}
      </div>

      {/* INCOMING PROJECTS & TEAM WORKLOAD ROW */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Incoming Projects (95%+ Outlook) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.1))',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '16px'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Truck size={18} style={{ color: '#10b981' }} />
            Incoming Projects ({incomingProjects.length})
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-tertiary)', marginLeft: '4px' }}>95%+ outlook</span>
          </h3>

          {incomingProjects.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No high-probability quotes in pipeline</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incomingProjects.slice(0, 5).map(quote => {
                const buildingTypeColor = BUILDING_TYPE_COLORS[quote.building_type] || 'var(--text-tertiary)';
                return (
                  <div
                    key={quote.id}
                    style={{
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                          {quote.project_name || quote.quote_number}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {quote.dealer?.name || 'Unknown Dealer'}
                        </div>
                      </div>
                      <div style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.6875rem',
                        fontWeight: '700',
                        background: quote.outlook_percentage === 100 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: quote.outlook_percentage === 100 ? '#22c55e' : '#f59e0b'
                      }}>
                        {quote.outlook_percentage}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {quote.building_type && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          background: `${buildingTypeColor}20`,
                          color: buildingTypeColor
                        }}>
                          {quote.building_type}
                        </span>
                      )}
                      {quote.square_footage && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          {formatSqft(quote.square_footage)}
                        </span>
                      )}
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--sunbelt-orange)', marginLeft: 'auto' }}>
                        {formatCurrency(quote.total_price)}
                      </span>
                    </div>
                    {quote.expected_close_timeframe && (
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                        Expected: {quote.expected_close_timeframe}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PM Workload with Toggle */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Users size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              PM Workload
            </h3>
            <button
              onClick={() => setUseWeightedWorkload(!useWeightedWorkload)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: useWeightedWorkload ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-tertiary)',
                border: useWeightedWorkload ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: useWeightedWorkload ? '#8b5cf6' : 'var(--text-secondary)'
              }}
            >
              {useWeightedWorkload ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              {useWeightedWorkload ? 'Weighted' : 'Simple'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pmWorkloadStats.slice(0, 6).map(pm => {
              const maxWorkload = Math.max(...pmWorkloadStats.map(p => useWeightedWorkload ? p.weightedCount : p.projectCount), 1);
              const currentWorkload = useWeightedWorkload ? pm.weightedCount : pm.projectCount;
              const widthPercent = (currentWorkload / maxWorkload) * 100;

              return (
                <div
                  key={pm.id}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                      {pm.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {pm.projectCount} project{pm.projectCount !== 1 ? 's' : ''}
                      </span>
                      {useWeightedWorkload && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: '600',
                          background: 'rgba(139, 92, 246, 0.15)',
                          color: '#8b5cf6'
                        }}>
                          {pm.avgDifficulty}★ avg
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${widthPercent}%`,
                      height: '100%',
                      background: widthPercent > 80 ? '#ef4444' : widthPercent > 60 ? '#f59e0b' : '#22c55e',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {formatCurrency(pm.totalValue)} total value
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RISK SETTINGS MODAL */}
      {showRiskSettings && (
        <RiskSettingsModal
          isOpen={showRiskSettings}
          onClose={() => setShowRiskSettings(false)}
          settings={riskSettings}
          onSave={handleRiskSettingsSave}
        />
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateProject && (
        <CreateProjectModal
          isOpen={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          onSuccess={() => {
            setShowCreateProject(false);
            fetchDashboardData();
            setToast({ message: 'Project created successfully', type: 'success' });
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {/* PRAXIS IMPORT MODAL */}
      {showPraxisImport && (
        <PraxisImportModal
          isOpen={showPraxisImport}
          onClose={() => setShowPraxisImport(false)}
          onSuccess={(importedProjects) => {
            setShowPraxisImport(false);
            fetchDashboardData();
            const count = Array.isArray(importedProjects) ? importedProjects.length : 1;
            setToast({ message: `${count} project(s) imported from Praxis`, type: 'success' });
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {/* TOAST */}
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

export default DirectorDashboard;