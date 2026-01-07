// ============================================================================
// DirectorDashboard Component
// ============================================================================
// Executive-level dashboard showing portfolio-wide metrics, risk indicators,
// and timeline overview across all projects.
//
// KEY FEATURES:
// - Portfolio summary cards (active projects, at-risk count, overdue items)
// - Configurable risk thresholds via settings modal
// - Projects at Risk panel with drill-down
// - Upcoming Deadlines panel
// - Gantt timeline view of all projects
// - Project health table with filtering
//
// RISK CALCULATION:
// - Overdue items (RFIs, Submittals, Tasks past due date)
// - Stalled projects (no activity in X days)
// - Approaching deadlines (delivery within X days)
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
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import GanttTimeline from './GanttTimeline';
import RiskSettingsModal from './RiskSettingsModal';
import TeamWorkloadView from './TeamWorkloadView';
import RecentActivityFeed from './RecentActivityFeed';

// ============================================================================
// DEFAULT RISK SETTINGS
// ============================================================================
const DEFAULT_RISK_SETTINGS = {
  overdueThreshold: 0,        // Days past due to flag as overdue (0 = same day)
  stalledDays: 14,            // No activity in X days = stalled
  upcomingDeadlineDays: 7,    // Flag items due within X days
  criticalDeadlineDays: 3,    // Flag items due within X days as critical
  atRiskItemCount: 3          // Number of overdue items to mark project "at risk"
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
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
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDaysOverdue = (dateString) => {
  const days = getDaysUntil(dateString);
  return days !== null && days < 0 ? Math.abs(days) : 0;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function DirectorDashboard() {
  const { user } = useAuth();

  // ==========================================================================
  // STATE - DATA
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [users, setUsers] = useState([]);

  // ==========================================================================
  // STATE - UI
  // ==========================================================================
  const [selectedProject, setSelectedProject] = useState(null);
  const [showRiskSettings, setShowRiskSettings] = useState(false);
  const [filterPM, setFilterPM] = useState('all');
  const [filterFactory, setFilterFactory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState('timeline');
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // STATE - RISK SETTINGS
  // ==========================================================================
  const [riskSettings, setRiskSettings] = useState(() => {
    const saved = localStorage.getItem('directorRiskSettings');
    return saved ? JSON.parse(saved) : DEFAULT_RISK_SETTINGS;
  });

  // ==========================================================================
  // FETCH ALL DATA
  // ==========================================================================
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // ===== FETCH PROJECTS =====
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      // ===== FETCH TASKS =====
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(id, name, project_number),
          assignee:assignee_id(id, name),
          internal_owner:internal_owner_id(id, name)
        `)
        .order('due_date', { ascending: true });

      // ===== FETCH RFIS =====
      const { data: rfisData } = await supabase
        .from('rfis')
        .select(`
          *,
          project:project_id(id, name, project_number)
        `)
        .order('due_date', { ascending: true });

      // ===== FETCH SUBMITTALS =====
      const { data: submittalsData } = await supabase
        .from('submittals')
        .select(`
          *,
          project:project_id(id, name, project_number)
        `)
        .order('due_date', { ascending: true });

      // ===== FETCH MILESTONES =====
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select(`
          *,
          project:project_id(id, name, project_number)
        `)
        .order('due_date', { ascending: true });

      // ===== FETCH USERS (PMs) =====
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('name');

      setProjects(projectsData || []);
      setTasks(tasksData || []);
      setRFIs(rfisData || []);
      setSubmittals(submittalsData || []);
      setMilestones(milestonesData || []);
      setUsers(usersData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Error loading dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // TOAST HELPER
  // ==========================================================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ==========================================================================
  // SAVE RISK SETTINGS
  // ==========================================================================
  const handleSaveRiskSettings = (newSettings) => {
    setRiskSettings(newSettings);
    localStorage.setItem('directorRiskSettings', JSON.stringify(newSettings));
    setShowRiskSettings(false);
    showToast('Risk settings updated');
  };

  // ==========================================================================
  // CALCULATE PROJECT HEALTH & RISK METRICS
  // ==========================================================================
  const projectHealthData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return projects.map(project => {
      // ===== GET PROJECT ITEMS =====
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const projectRFIs = rfis.filter(r => r.project_id === project.id);
      const projectSubmittals = submittals.filter(s => s.project_id === project.id);
      const projectMilestones = milestones.filter(m => m.project_id === project.id);

      // ===== CALCULATE OVERDUE ITEMS =====
      const closedTaskStatuses = ['Completed', 'Cancelled'];
      const closedRFIStatuses = ['Answered', 'Closed'];
      const closedSubmittalStatuses = ['Approved', 'Approved as Noted', 'Rejected'];

      const overdueTasks = projectTasks.filter(t => 
        t.due_date && 
        new Date(t.due_date) < today &&
        !closedTaskStatuses.includes(t.status)
      );

      const overdueRFIs = projectRFIs.filter(r => 
        r.due_date && 
        new Date(r.due_date) < today &&
        !closedRFIStatuses.includes(r.status)
      );

      const overdueSubmittals = projectSubmittals.filter(s => 
        s.due_date && 
        new Date(s.due_date) < today &&
        !closedSubmittalStatuses.includes(s.status)
      );

      const totalOverdue = overdueTasks.length + overdueRFIs.length + overdueSubmittals.length;

      // ===== CHECK STALLED (NO RECENT ACTIVITY) =====
      const stalledDate = new Date(today);
      stalledDate.setDate(stalledDate.getDate() - riskSettings.stalledDays);
      const lastActivity = new Date(project.updated_at);
      const isStalled = lastActivity < stalledDate;

      // ===== CHECK UPCOMING DELIVERY =====
      const deliveryDays = getDaysUntil(project.delivery_date);
      const isDeliveryClose = deliveryDays !== null && deliveryDays >= 0 && deliveryDays <= riskSettings.upcomingDeadlineDays;
      const isDeliveryCritical = deliveryDays !== null && deliveryDays >= 0 && deliveryDays <= riskSettings.criticalDeadlineDays;

      // ===== DETERMINE HEALTH STATUS =====
      let healthStatus = 'on-track';
      let healthColor = '#22c55e';
      let healthLabel = 'On Track';

      if (totalOverdue >= riskSettings.atRiskItemCount || isStalled || isDeliveryCritical) {
        healthStatus = 'critical';
        healthColor = '#ef4444';
        healthLabel = 'Critical';
      } else if (totalOverdue > 0 || isDeliveryClose) {
        healthStatus = 'at-risk';
        healthColor = '#f59e0b';
        healthLabel = 'At Risk';
      }

      // ===== CHECK IF COMPLETED/INACTIVE =====
      const inactiveStatuses = ['Completed', 'Cancelled', 'On Hold', 'Warranty'];
      if (inactiveStatuses.includes(project.status)) {
        healthStatus = 'inactive';
        healthColor = '#64748b';
        healthLabel = project.status;
      }

      return {
        ...project,
        healthStatus,
        healthColor,
        healthLabel,
        totalOverdue,
        overdueTasks: overdueTasks.length,
        overdueRFIs: overdueRFIs.length,
        overdueSubmittals: overdueSubmittals.length,
        isStalled,
        deliveryDays,
        isDeliveryClose,
        isDeliveryCritical,
        taskCount: projectTasks.length,
        rfiCount: projectRFIs.length,
        submittalCount: projectSubmittals.length,
        milestoneCount: projectMilestones.length,
        openTasks: projectTasks.filter(t => !closedTaskStatuses.includes(t.status)).length,
        openRFIs: projectRFIs.filter(r => !closedRFIStatuses.includes(r.status)).length,
        openSubmittals: projectSubmittals.filter(s => !closedSubmittalStatuses.includes(s.status)).length
      };
    });
  }, [projects, tasks, rfis, submittals, milestones, riskSettings]);

  // ==========================================================================
  // PORTFOLIO METRICS
  // ==========================================================================
  const portfolioMetrics = useMemo(() => {
    const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
    const activeProjects = projectHealthData.filter(p => activeStatuses.includes(p.status));
    
    const criticalProjects = activeProjects.filter(p => p.healthStatus === 'critical');
    const atRiskProjects = activeProjects.filter(p => p.healthStatus === 'at-risk');
    const onTrackProjects = activeProjects.filter(p => p.healthStatus === 'on-track');

    const totalOverdueItems = activeProjects.reduce((sum, p) => sum + p.totalOverdue, 0);
    const stalledProjects = activeProjects.filter(p => p.isStalled);

    // ===== UPCOMING DEADLINES (NEXT 7 DAYS) =====
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const upcomingDeadlines = [
      ...tasks.filter(t => {
        if (!t.due_date || ['Completed', 'Cancelled'].includes(t.status)) return false;
        const due = new Date(t.due_date);
        return due >= today && due <= weekFromNow;
      }).map(t => ({ ...t, type: 'task', dueDate: t.due_date })),
      ...rfis.filter(r => {
        if (!r.due_date || ['Answered', 'Closed'].includes(r.status)) return false;
        const due = new Date(r.due_date);
        return due >= today && due <= weekFromNow;
      }).map(r => ({ ...r, type: 'rfi', dueDate: r.due_date })),
      ...submittals.filter(s => {
        if (!s.due_date || ['Approved', 'Approved as Noted', 'Rejected'].includes(s.status)) return false;
        const due = new Date(s.due_date);
        return due >= today && due <= weekFromNow;
      }).map(s => ({ ...s, type: 'submittal', dueDate: s.due_date })),
      ...milestones.filter(m => {
        if (!m.due_date || m.status === 'Completed') return false;
        const due = new Date(m.due_date);
        return due >= today && due <= weekFromNow;
      }).map(m => ({ ...m, type: 'milestone', dueDate: m.due_date }))
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return {
      totalActive: activeProjects.length,
      critical: criticalProjects.length,
      atRisk: atRiskProjects.length,
      onTrack: onTrackProjects.length,
      totalOverdueItems,
      stalledCount: stalledProjects.length,
      upcomingDeadlines,
      criticalProjects,
      atRiskProjects,
      stalledProjects
    };
  }, [projectHealthData, tasks, rfis, submittals, milestones]);

  // ==========================================================================
  // FILTERED PROJECTS
  // ==========================================================================
  const filteredProjects = useMemo(() => {
    return projectHealthData.filter(project => {
      // ===== STATUS FILTER =====
      if (filterStatus === 'active') {
        const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
        if (!activeStatuses.includes(project.status)) return false;
      } else if (filterStatus === 'at-risk') {
        if (project.healthStatus !== 'at-risk' && project.healthStatus !== 'critical') return false;
      } else if (filterStatus === 'completed') {
        if (project.status !== 'Completed') return false;
      }

      // ===== PM FILTER =====
      if (filterPM !== 'all' && project.pm_id !== filterPM) return false;

      // ===== FACTORY FILTER =====
      if (filterFactory !== 'all' && project.factory !== filterFactory) return false;

      // ===== SEARCH =====
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = project.name?.toLowerCase().includes(search);
        const matchesNumber = project.project_number?.toLowerCase().includes(search);
        const matchesClient = project.client_name?.toLowerCase().includes(search);
        if (!matchesName && !matchesNumber && !matchesClient) return false;
      }

      return true;
    });
  }, [projectHealthData, filterStatus, filterPM, filterFactory, searchTerm]);

  // ==========================================================================
  // GET UNIQUE FACTORIES
  // ==========================================================================
  const factories = useMemo(() => {
    const factorySet = new Set(projects.map(p => p.factory).filter(Boolean));
    return Array.from(factorySet).sort();
  }, [projects]);

  // ==========================================================================
  // HANDLE PROJECT UPDATE
  // ==========================================================================
  const handleProjectUpdate = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
    showToast('Project updated');
  };

  // ==========================================================================
  // RENDER - PROJECT DETAILS VIEW
  // ==========================================================================
  if (selectedProject) {
    return (
      <ProjectDetails
        project={selectedProject}
        onBack={() => {
          setSelectedProject(null);
          fetchDashboardData();
        }}
        onUpdate={handleProjectUpdate}
      />
    );
  }

  // ==========================================================================
  // RENDER - LOADING STATE
  // ==========================================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>
          Loading director dashboard...
        </p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - MAIN DASHBOARD
  // ==========================================================================
  return (
    <div>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-xl)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <BarChart3 size={32} style={{ color: 'var(--sunbelt-orange)' }} />
            Director Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Portfolio overview and risk management
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            onClick={() => fetchDashboardData()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: '8px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => setShowRiskSettings(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: '8px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Settings size={16} />
            Risk Settings
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* PORTFOLIO SUMMARY CARDS                                           */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)'
      }}>
        {/* Active Projects */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <Building2 size={20} style={{ color: 'var(--info)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Active Projects</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {portfolioMetrics.totalActive}
          </div>
        </div>

        {/* On Track */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>On Track</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#22c55e' }}>
            {portfolioMetrics.onTrack}
          </div>
        </div>

        {/* At Risk */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)',
          cursor: portfolioMetrics.atRisk > 0 ? 'pointer' : 'default'
        }}
        onClick={() => portfolioMetrics.atRisk > 0 && setFilterStatus('at-risk')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>At Risk</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
            {portfolioMetrics.atRisk}
          </div>
        </div>

        {/* Critical */}
        <div style={{
          background: portfolioMetrics.critical > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: `1px solid ${portfolioMetrics.critical > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`,
          cursor: portfolioMetrics.critical > 0 ? 'pointer' : 'default'
        }}
        onClick={() => portfolioMetrics.critical > 0 && setFilterStatus('at-risk')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Critical</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
            {portfolioMetrics.critical}
          </div>
        </div>

        {/* Total Overdue Items */}
        <div style={{
          background: portfolioMetrics.totalOverdueItems > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <Clock size={20} style={{ color: portfolioMetrics.totalOverdueItems > 0 ? '#ef4444' : 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Overdue Items</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: portfolioMetrics.totalOverdueItems > 0 ? '#ef4444' : 'var(--text-primary)' }}>
            {portfolioMetrics.totalOverdueItems}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <Calendar size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Due This Week</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {portfolioMetrics.upcomingDeadlines.length}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* RISK ALERTS SECTION                                               */}
      {/* ================================================================== */}
      {(portfolioMetrics.criticalProjects.length > 0 || portfolioMetrics.stalledProjects.length > 0) && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '700',
            color: '#ef4444',
            margin: '0 0 var(--space-md) 0',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <AlertTriangle size={20} />
            Attention Required
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {/* Critical Projects */}
            {portfolioMetrics.criticalProjects.map(project => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-md)',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{project.project_number}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>•</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{project.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: '0.8125rem' }}>
                    {project.totalOverdue > 0 && (
                      <span style={{ color: '#ef4444' }}>
                        {project.totalOverdue} overdue items
                      </span>
                    )}
                    {project.isStalled && (
                      <span style={{ color: '#f59e0b' }}>
                        Stalled ({riskSettings.stalledDays}+ days no activity)
                      </span>
                    )}
                    {project.isDeliveryCritical && (
                      <span style={{ color: '#ef4444' }}>
                        Delivery in {project.deliveryDays} days
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            ))}

            {/* Stalled Projects (not already shown as critical) */}
            {portfolioMetrics.stalledProjects
              .filter(p => p.healthStatus !== 'critical')
              .map(project => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-md)',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{project.project_number}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>•</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{project.name}</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: '#f59e0b' }}>
                    No activity in {riskSettings.stalledDays}+ days
                  </span>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* GANTT TIMELINE                                                    */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        marginBottom: 'var(--space-xl)',
        overflow: 'hidden'
      }}>
        <div
          onClick={() => setExpandedSection(expandedSection === 'timeline' ? null : 'timeline')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-lg)',
            cursor: 'pointer',
            borderBottom: expandedSection === 'timeline' ? '1px solid var(--border-color)' : 'none'
          }}
        >
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <Layers size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            Project Timeline
          </h3>
          <ChevronDown
            size={20}
            style={{
              color: 'var(--text-tertiary)',
              transform: expandedSection === 'timeline' ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          />
        </div>

        {expandedSection === 'timeline' && (
          <div style={{ padding: 'var(--space-lg)' }}>
            <GanttTimeline
              projects={filteredProjects}
              onProjectClick={setSelectedProject}
            />
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* UPCOMING DEADLINES                                                */}
      {/* ================================================================== */}
      {portfolioMetrics.upcomingDeadlines.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          marginBottom: 'var(--space-xl)',
          overflow: 'hidden'
        }}>
          <div
            onClick={() => setExpandedSection(expandedSection === 'deadlines' ? null : 'deadlines')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-lg)',
              cursor: 'pointer',
              borderBottom: expandedSection === 'deadlines' ? '1px solid var(--border-color)' : 'none'
            }}
          >
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <Calendar size={20} style={{ color: 'var(--sunbelt-orange)' }} />
              Upcoming Deadlines
              <span style={{
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: '600',
                background: 'var(--sunbelt-orange)',
                color: 'white'
              }}>
                {portfolioMetrics.upcomingDeadlines.length}
              </span>
            </h3>
            <ChevronDown
              size={20}
              style={{
                color: 'var(--text-tertiary)',
                transform: expandedSection === 'deadlines' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
          </div>

          {expandedSection === 'deadlines' && (
            <div style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {portfolioMetrics.upcomingDeadlines.slice(0, 15).map((item, idx) => {
                  const days = getDaysUntil(item.dueDate);
                  const isUrgent = days <= riskSettings.criticalDeadlineDays;

                  return (
                    <div
                      key={`${item.type}-${item.id || idx}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-sm) var(--space-md)',
                        background: isUrgent ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          background: item.type === 'task' ? 'rgba(34, 197, 94, 0.15)' :
                                      item.type === 'rfi' ? 'rgba(59, 130, 246, 0.15)' :
                                      item.type === 'submittal' ? 'rgba(139, 92, 246, 0.15)' :
                                      'rgba(255, 107, 53, 0.15)',
                          color: item.type === 'task' ? '#22c55e' :
                                 item.type === 'rfi' ? '#3b82f6' :
                                 item.type === 'submittal' ? '#8b5cf6' :
                                 'var(--sunbelt-orange)'
                        }}>
                          {item.type}
                        </span>
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {item.type === 'rfi' ? item.subject :
                             item.type === 'submittal' ? item.title :
                             item.type === 'milestone' ? item.name :
                             item.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            {item.project?.project_number || item.project_number} • {item.project?.name || ''}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        color: isUrgent ? '#ef4444' : days === 0 ? '#f59e0b' : 'var(--text-secondary)'
                      }}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* PROJECT TABLE WITH FILTERS                                        */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Table Header with Filters */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <Building2 size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            All Projects
            <span style={{
              padding: '2px 10px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)'
            }}>
              {filteredProjects.length}
            </span>
          </h3>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)'
              }} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px 8px 34px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  width: '200px'
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            >
              <option value="active">Active Projects</option>
              <option value="at-risk">At Risk Only</option>
              <option value="all">All Projects</option>
              <option value="completed">Completed</option>
            </select>

            {/* Factory Filter */}
            <select
              value={filterFactory}
              onChange={(e) => setFilterFactory(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Factories</option>
              {factories.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)' }}>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open Items</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overdue</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Factory</th>
                <th style={{ padding: 'var(--space-md)', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => (
                <tr
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: 'var(--space-md)' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {project.project_number}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {project.name}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: project.status === 'In Progress' ? 'rgba(255, 107, 53, 0.15)' :
                                  project.status === 'Completed' ? 'rgba(34, 197, 94, 0.15)' :
                                  'var(--bg-tertiary)',
                      color: project.status === 'In Progress' ? 'var(--sunbelt-orange)' :
                             project.status === 'Completed' ? '#22c55e' :
                             'var(--text-secondary)'
                    }}>
                      {project.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: project.healthColor
                      }} />
                      <span style={{ fontSize: '0.8125rem', color: project.healthColor, fontWeight: '500' }}>
                        {project.healthLabel}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', fontSize: '0.75rem' }}>
                      <span title="Tasks" style={{ color: '#22c55e' }}>{project.openTasks}T</span>
                      <span title="RFIs" style={{ color: '#3b82f6' }}>{project.openRFIs}R</span>
                      <span title="Submittals" style={{ color: '#8b5cf6' }}>{project.openSubmittals}S</span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                    {project.totalOverdue > 0 ? (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444'
                      }}>
                        {project.totalOverdue}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    {project.delivery_date ? (
                      <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {formatShortDate(project.delivery_date)}
                        </div>
                        {project.deliveryDays !== null && project.deliveryDays >= 0 && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: project.isDeliveryCritical ? '#ef4444' :
                                   project.isDeliveryClose ? '#f59e0b' :
                                   'var(--text-tertiary)'
                          }}>
                            {project.deliveryDays === 0 ? 'Today' :
                             project.deliveryDays === 1 ? 'Tomorrow' :
                             `${project.deliveryDays} days`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-md)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {project.factory || '-'}
                  </td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProjects.length === 0 && (
            <div style={{
              padding: 'var(--space-2xl)',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              No projects match your filters
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* TEAM WORKLOAD SECTION                                             */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: 'var(--space-lg)',
        marginTop: 'var(--space-xl)'
      }}>
        <TeamWorkloadView
          users={users}
          projects={projects}
          tasks={tasks}
          rfis={rfis}
          submittals={submittals}
          onUserClick={(user) => console.log('User clicked:', user)}
          onProjectClick={(project) => setSelectedProject(project)}
        />
      </div>

      {/* ================================================================== */}
      {/* RECENT ACTIVITY SECTION                                           */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: 'var(--space-lg)',
        marginTop: 'var(--space-xl)'
      }}>
        <RecentActivityFeed
          tasks={tasks}
          rfis={rfis}
          submittals={submittals}
          milestones={milestones}
          projects={projects}
          users={users}
          onItemClick={(type, item) => {
            if (type === 'project') {
              setSelectedProject(item);
            } else {
              // For tasks, rfis, submittals - find the project and open it
              const project = projects.find(p => p.id === item.project_id);
              if (project) {
                setSelectedProject(project);
              }
            }
          }}
          maxItems={15}
        />
      </div>

      {/* ================================================================== */}
      {/* RISK SETTINGS MODAL                                               */}
      {/* ================================================================== */}
      {showRiskSettings && (
        <RiskSettingsModal
          isOpen={showRiskSettings}
          onClose={() => setShowRiskSettings(false)}
          settings={riskSettings}
          onSave={handleSaveRiskSettings}
        />
      )}

      {/* ================================================================== */}
      {/* TOAST NOTIFICATION                                                */}
      {/* ================================================================== */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--space-xl)',
          right: 'var(--space-xl)',
          padding: 'var(--space-md) var(--space-lg)',
          background: toast.type === 'error' ? '#ef4444' : '#22c55e',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          fontWeight: '500'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default DirectorDashboard;