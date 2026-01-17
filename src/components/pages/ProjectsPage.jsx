// ============================================================================
// ProjectsPage Component - REDESIGNED
// ============================================================================
// Enhanced Projects page with modern styling inspired by SalesManagerDashboard
// and OverviewTab components.
//
// Features:
// - Enhanced stats cards with icons and colored backgrounds
// - Project cards with health indicators, phase badges, and urgency colors
// - Improved visual hierarchy and hover effects
// - Comprehensive project information at a glance
//
// For Directors: Shows all projects
// For PMs: Shows their assigned projects (primary + secondary)
// For Sales: Read-only view of PM projects
//
// Redesigned: January 14, 2026
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  ChevronRight,
  Calendar,
  User,
  Building2,
  FileUp,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Factory,
  Target,
  TrendingUp,
  Truck,
  AlertCircle,
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import CreateProjectModal from '../projects/CreateProjectModal';
import PraxisImportModal from '../projects/PraxisImportModal';

// ============================================================================
// CONSTANTS
// ============================================================================
const HEALTH_CONFIG = {
  'On Track': { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle },
  'At Risk': { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', icon: AlertTriangle },
  'Critical': { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: AlertCircle }
};

const STATUS_ORDER = {
  'Planning': 1,
  'Pre-PM': 2,
  'PM Handoff': 3,
  'In Progress': 4,
  'Warranty': 5,
  'On Hold': 6,
  'Completed': 7,
  'Cancelled': 8
};

const PHASE_NAMES = {
  1: 'Initiation',
  2: 'Dealer Sign-Offs',
  3: 'Internal Approvals',
  4: 'Delivery'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const formatFullDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getDaysUntil = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.floor((date - now) / (1000 * 60 * 60 * 24));
};

const getDeliveryUrgency = (deliveryDate) => {
  const days = getDaysUntil(deliveryDate);
  if (days === null) return { color: 'var(--text-tertiary)', label: 'TBD' };
  if (days < 0) return { color: '#ef4444', label: `${Math.abs(days)}d overdue` };
  if (days <= 7) return { color: '#ef4444', label: `${days}d` };
  if (days <= 14) return { color: '#f59e0b', label: `${days}d` };
  if (days <= 30) return { color: '#3b82f6', label: `${days}d` };
  return { color: 'var(--text-secondary)', label: `${days}d` };
};

const getStatusColor = (status) => {
  const colors = {
    'Planning': '#3b82f6',
    'Pre-PM': '#8b5cf6',
    'PM Handoff': '#f59e0b',
    'In Progress': 'var(--sunbelt-orange)',
    'On Hold': '#64748b',
    'Completed': '#22c55e',
    'Cancelled': '#ef4444',
    'Warranty': '#06b6d4'
  };
  return colors[status] || 'var(--text-secondary)';
};

const getHealthColor = (health) => {
  return HEALTH_CONFIG[health]?.color || 'var(--text-secondary)';
};

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================
function StatCard({ icon: Icon, label, value, subValue, color, bgColor, onClick, isActive }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? bgColor : 'var(--bg-secondary)',
        borderRadius: '12px',
        border: `1px solid ${isActive ? color : 'var(--border-color)'}`,
        padding: '16px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.background = bgColor;
        }
      }}
      onMouseOut={(e) => {
        if (onClick && !isActive) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.background = 'var(--bg-secondary)';
        }
      }}
    >
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {value}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {label}
          {subValue && <span style={{ color: 'var(--text-tertiary)', marginLeft: '6px' }}>{subValue}</span>}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROJECT CARD COMPONENT
// ============================================================================
function ProjectCard({ project, onClick }) {
  const healthConfig = HEALTH_CONFIG[project.health_status] || HEALTH_CONFIG['On Track'];
  const deliveryUrgency = getDeliveryUrgency(project.target_online_date || project.delivery_date);
  const statusColor = getStatusColor(project.status);
  const phase = project.current_phase || 1;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${healthConfig.color}`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.15s'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
        e.currentTarget.style.borderLeftColor = healthConfig.color;
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.borderLeftColor = healthConfig.color;
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Card Header */}
      <div style={{ padding: '16px 20px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: '700',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              marginBottom: '2px'
            }}>
              {project.project_number}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {project.name}
            </div>
          </div>

          {/* Status Badge */}
          <span style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.6875rem',
            fontWeight: '600',
            background: `${statusColor}20`,
            color: statusColor,
            whiteSpace: 'nowrap',
            marginLeft: '12px'
          }}>
            {project.status}
          </span>
        </div>

        {/* Client & Factory Row */}
        {project.client_name && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8125rem',
            color: 'var(--text-tertiary)',
            marginBottom: '4px'
          }}>
            <Building2 size={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.client_name}
            </span>
          </div>
        )}
      </div>

      {/* Info Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        padding: '0 20px 16px'
      }}>
        {/* PM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.pm?.name || '—'}
          </span>
        </div>

        {/* Factory */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Factory size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {project.factory || '—'}
          </span>
        </div>
      </div>

      {/* Footer with Phase, Health, and Delivery */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        background: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--border-color)'
      }}>
        {/* Phase Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            background: 'var(--sunbelt-orange)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>
            {phase}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {PHASE_NAMES[phase] || `Phase ${phase}`}
          </span>
        </div>

        {/* Health Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: healthConfig.color
          }} />
          <span style={{ fontSize: '0.75rem', color: healthConfig.color, fontWeight: '500' }}>
            {project.health_status || 'On Track'}
          </span>
        </div>

        {/* Delivery Date */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Truck size={14} style={{ color: deliveryUrgency.color }} />
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: deliveryUrgency.color
          }}>
            {deliveryUrgency.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ProjectsPage({ isDirectorView = false, isSalesView = false, onNavigateToProject, includeBackupProjects = false, onToggleBackup }) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE - DATA
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [factories, setFactories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // ==========================================================================
  // STATE - UI
  // ==========================================================================
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showPraxisImport, setShowPraxisImport] = useState(false);
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // STATE - FILTERS
  // ==========================================================================
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterPM, setFilterPM] = useState('all');
  const [filterFactory, setFilterFactory] = useState('all');
  const [filterHealth, setFilterHealth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ==========================================================================
  // STATE - SORTING
  // ==========================================================================
  const [sortBy, setSortBy] = useState('updated_at_desc');

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    if (user) fetchData();
  }, [user, isDirectorView, includeBackupProjects]);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setCurrentUser(userData);

      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('is_active', true)
        .order('name');
      setUsers(usersData || []);

      const { data: factoriesData } = await supabase
        .from('factories')
        .select('id, short_name, code')
        .eq('is_active', true)
        .order('short_name');
      setFactories(factoriesData || []);

      const { data: allProjectsData } = await supabase
        .from('projects')
        .select(`
          *,
          pm:owner_id(id, name),
          backup_pm:backup_pm_id(id, name)
        `);

      let projectsData = allProjectsData || [];
      if (!isDirectorView && userData) {
        // Filter to only show projects where user is primary PM or owner
        // If includeBackupProjects is true, also include backup assignments
        projectsData = projectsData.filter(p => {
          const isPrimaryOrOwner = p.owner_id === userData.id ||
                                    p.primary_pm_id === userData.id ||
                                    p.created_by === userData.id;
          const isBackup = p.backup_pm_id === userData.id;

          return isPrimaryOrOwner || (includeBackupProjects && isBackup);
        });
      }

      projectsData.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      setProjects(projectsData);

    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================
  const stats = useMemo(() => {
    const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
    const active = projects.filter(p => activeStatuses.includes(p.status));

    const now = new Date();
    const thisWeek = projects.filter(p => {
      if (!p.target_online_date && !p.delivery_date) return false;
      const deliveryDate = new Date(p.target_online_date || p.delivery_date);
      const daysUntil = Math.floor((deliveryDate - now) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7 && activeStatuses.includes(p.status);
    });

    const atRisk = projects.filter(p =>
      p.health_status === 'At Risk' && activeStatuses.includes(p.status)
    );

    const critical = projects.filter(p =>
      p.health_status === 'Critical' && activeStatuses.includes(p.status)
    );

    const overdue = projects.filter(p => {
      if (!activeStatuses.includes(p.status)) return false;
      const deliveryDate = p.target_online_date || p.delivery_date;
      if (!deliveryDate) return false;
      return new Date(deliveryDate) < now;
    });

    return {
      total: projects.length,
      active: active.length,
      thisWeek: thisWeek.length,
      atRisk: atRisk.length,
      critical: critical.length,
      overdue: overdue.length,
      completed: projects.filter(p => p.status === 'Completed').length
    };
  }, [projects]);

  const pms = useMemo(() =>
    users.filter(u => ['PM', 'Project Manager', 'Project_Manager', 'Director', 'Admin', 'VP'].includes(u.role))
  , [users]);

  // ==========================================================================
  // FILTER PROJECTS
  // ==========================================================================
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Status filter
      const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
      if (filterStatus === 'active' && !activeStatuses.includes(project.status)) return false;
      if (filterStatus === 'completed' && project.status !== 'Completed') return false;
      if (filterStatus === 'on-hold' && project.status !== 'On Hold') return false;

      // PM filter
      if (filterPM !== 'all' && project.owner_id !== filterPM) return false;

      // Factory filter
      if (filterFactory !== 'all' && project.factory !== filterFactory) return false;

      // Health filter
      if (filterHealth !== 'all' && project.health_status !== filterHealth) return false;

      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !project.project_number?.toLowerCase().includes(term) &&
          !project.name?.toLowerCase().includes(term) &&
          !project.client_name?.toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [projects, filterStatus, filterPM, filterFactory, filterHealth, searchTerm]);

  // ==========================================================================
  // SORT PROJECTS
  // ==========================================================================
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      switch (sortBy) {
        case 'project_number_asc':
          return (a.project_number || '').localeCompare(b.project_number || '');
        case 'project_number_desc':
          return (b.project_number || '').localeCompare(a.project_number || '');
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'delivery_date_asc':
          if (!a.target_online_date && !b.target_online_date) return 0;
          if (!a.target_online_date) return 1;
          if (!b.target_online_date) return -1;
          return new Date(a.target_online_date) - new Date(b.target_online_date);
        case 'delivery_date_desc':
          if (!a.target_online_date && !b.target_online_date) return 0;
          if (!a.target_online_date) return 1;
          if (!b.target_online_date) return -1;
          return new Date(b.target_online_date) - new Date(a.target_online_date);
        case 'status_asc':
          return (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
        case 'status_desc':
          return (STATUS_ORDER[b.status] || 99) - (STATUS_ORDER[a.status] || 99);
        case 'updated_at_desc':
        default:
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      }
    });
  }, [filteredProjects, sortBy]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
          fetchData();
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
          Loading projects...
        </p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - MAIN VIEW
  // ==========================================================================
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

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
            <FolderKanban size={28} style={{ color: 'var(--sunbelt-orange)' }} />
            {isSalesView ? 'PM Projects' : isDirectorView ? 'All Projects' : 'My Projects'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isSalesView
              ? 'Projects converted from your quotes (read-only)'
              : isDirectorView
                ? 'All projects across the organization'
                : 'Projects assigned to you'}
          </p>
        </div>

        {!isSalesView && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowPraxisImport(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
                e.currentTarget.style.color = 'var(--sunbelt-orange)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              <FileUp size={18} />
              Import from Praxis
            </button>
            <button
              onClick={() => setShowCreateProject(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} />
              New Project
            </button>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* ENHANCED STATS CARDS                                              */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: 'var(--space-lg)'
      }}>
        <StatCard
          icon={FolderKanban}
          label="Total Projects"
          value={stats.total}
          color="var(--sunbelt-orange)"
          bgColor="rgba(245, 158, 11, 0.1)"
        />
        <StatCard
          icon={Activity}
          label="Active"
          value={stats.active}
          color="#3b82f6"
          bgColor="rgba(59, 130, 246, 0.1)"
          onClick={() => setFilterStatus('active')}
          isActive={filterStatus === 'active'}
        />
        <StatCard
          icon={Truck}
          label="This Week"
          value={stats.thisWeek}
          subValue="deliveries"
          color="#8b5cf6"
          bgColor="rgba(139, 92, 246, 0.1)"
        />
        <StatCard
          icon={AlertTriangle}
          label="At Risk"
          value={stats.atRisk}
          color="#f59e0b"
          bgColor="rgba(245, 158, 11, 0.1)"
          onClick={() => {
            setFilterHealth('At Risk');
            setFilterStatus('active');
          }}
          isActive={filterHealth === 'At Risk'}
        />
        <StatCard
          icon={AlertCircle}
          label="Critical"
          value={stats.critical}
          color="#ef4444"
          bgColor="rgba(239, 68, 68, 0.1)"
          onClick={() => {
            setFilterHealth('Critical');
            setFilterStatus('active');
          }}
          isActive={filterHealth === 'Critical'}
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completed}
          color="#22c55e"
          bgColor="rgba(34, 197, 94, 0.1)"
          onClick={() => setFilterStatus('completed')}
          isActive={filterStatus === 'completed'}
        />
      </div>

      {/* ================================================================== */}
      {/* FILTERS BAR                                                       */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: 'var(--space-md)',
        flexWrap: 'wrap',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setFilterHealth('all'); }}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="all">All Statuses</option>
        </select>

        {/* Health Filter */}
        <select
          value={filterHealth}
          onChange={(e) => setFilterHealth(e.target.value)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Health</option>
          <option value="On Track">On Track</option>
          <option value="At Risk">At Risk</option>
          <option value="Critical">Critical</option>
        </select>

        {/* PM Filter - Only show in Director View */}
        {isDirectorView && (
          <select
            value={filterPM}
            onChange={(e) => setFilterPM(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">All PMs</option>
            {pms.map(pm => (
              <option key={pm.id} value={pm.id}>{pm.name}</option>
            ))}
          </select>
        )}

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
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Factories</option>
          {factories.map(f => (
            <option key={f.id} value={f.code}>{f.short_name}</option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            cursor: 'pointer'
          }}
        >
          <option value="updated_at_desc">Recently Updated</option>
          <option value="delivery_date_asc">Delivery (Soonest)</option>
          <option value="delivery_date_desc">Delivery (Latest)</option>
          <option value="project_number_asc">Project # (A-Z)</option>
          <option value="project_number_desc">Project # (Z-A)</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="status_asc">Status (Early to Late)</option>
        </select>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)'
            }}
          />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem'
            }}
          />
        </div>

        {/* Clear Filters */}
        {(filterStatus !== 'active' || filterPM !== 'all' || filterFactory !== 'all' || filterHealth !== 'all' || searchTerm) && (
          <button
            onClick={() => {
              setFilterStatus('active');
              setFilterPM('all');
              setFilterFactory('all');
              setFilterHealth('all');
              setSearchTerm('');
            }}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        )}

        {/* Backup Projects Toggle - Only show for PM view (not Director/Sales) */}
        {!isDirectorView && !isSalesView && onToggleBackup && (
          <button
            onClick={() => onToggleBackup(!includeBackupProjects)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: includeBackupProjects ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              border: `1px solid ${includeBackupProjects ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              color: includeBackupProjects ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            }}
            title={includeBackupProjects ? 'Hide backup PM projects' : 'Show backup PM projects'}
          >
            {includeBackupProjects ? <Eye size={14} /> : <EyeOff size={14} />}
            Backup Projects
          </button>
        )}
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: 'var(--space-md)', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
        Showing {sortedProjects.length} of {projects.length} projects
      </div>

      {/* ================================================================== */}
      {/* PROJECTS GRID                                                     */}
      {/* ================================================================== */}
      {sortedProjects.length === 0 ? (
        <div style={{
          padding: '60px 40px',
          textAlign: 'center',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <FolderKanban size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No projects found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {searchTerm || filterStatus !== 'active' || filterHealth !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first project to get started'}
          </p>
          {!isSalesView && (
            <button
              onClick={() => setShowCreateProject(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '16px'
        }}>
          {sortedProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onNavigateToProject
                ? onNavigateToProject(project.id, 'overview')
                : setSelectedProject(project)
              }
            />
          ))}
        </div>
      )}

      {/* ================================================================== */}
      {/* CREATE PROJECT MODAL                                              */}
      {/* ================================================================== */}
      {showCreateProject && (
        <CreateProjectModal
          isOpen={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          onSuccess={(newProject) => {
            setProjects(prev => [newProject, ...prev]);
            setShowCreateProject(false);
            showToast('Project created');
          }}
          currentUserId={currentUser?.id}
        />
      )}

      {/* ================================================================== */}
      {/* PRAXIS IMPORT MODAL                                               */}
      {/* ================================================================== */}
      {showPraxisImport && (
        <PraxisImportModal
          isOpen={showPraxisImport}
          onClose={() => setShowPraxisImport(false)}
          onSuccess={(importedProjects) => {
            const newProjects = Array.isArray(importedProjects)
              ? importedProjects
              : [importedProjects];
            setProjects(prev => [...newProjects, ...prev]);
            setShowPraxisImport(false);
            showToast(`${newProjects.length} project(s) imported from Praxis`);
            fetchData();
          }}
          currentUserId={currentUser?.id}
        />
      )}

      {/* ================================================================== */}
      {/* TOAST NOTIFICATION                                                */}
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
          zIndex: 1000
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
