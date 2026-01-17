// ============================================================================
// ProjectDetail.jsx - Project Detail Page for Manager PWA
// ============================================================================
// Displays project details with tabs: Overview, Tasks, RFIs, Modules.
// Allows navigation back to projects list.
//
// Created: January 17, 2026
// Phase 2 Implementation
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import { supabase } from '../../../utils/supabaseClient';
import {
  ArrowLeft,
  Calendar,
  Building2,
  DollarSign,
  Users,
  CheckSquare,
  MessageSquare,
  Box,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronRight,
  MapPin
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'rfis', label: 'RFIs' },
  { id: 'modules', label: 'Modules' }
];

const HEALTH_COLORS = {
  'On Track': '#22c55e',
  'At Risk': '#f59e0b',
  'Critical': '#ef4444'
};

const STATUS_COLORS = {
  'Draft': '#6b7280',
  'Planning': '#3b82f6',
  'In Progress': '#8b5cf6',
  'Production': '#f59e0b',
  'Complete': '#22c55e',
  'Completed': '#22c55e',
  'On Hold': '#ef4444'
};

const TASK_STATUS_COLORS = {
  'Not Started': '#6b7280',
  'In Progress': '#3b82f6',
  'Awaiting Response': '#f59e0b',
  'Completed': '#22c55e',
  'Cancelled': '#ef4444'
};

const PRIORITY_COLORS = {
  'Low': '#6b7280',
  'Medium': '#3b82f6',
  'High': '#f59e0b',
  'Critical': '#ef4444'
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    width: '100%',
    maxWidth: '100%'
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: 'var(--bg-primary)',
    paddingBottom: 'var(--space-md)',
    borderBottom: '1px solid var(--border-primary)'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-sm) 0',
    background: 'transparent',
    border: 'none',
    color: 'var(--accent-primary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: 'var(--space-md)'
  },
  projectHeader: {
    marginBottom: 'var(--space-md)'
  },
  projectNumber: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--accent-primary)',
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  projectName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-sm)',
    lineHeight: '1.3'
  },
  badges: {
    display: 'flex',
    gap: 'var(--space-sm)',
    flexWrap: 'wrap'
  },
  badge: {
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.7rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  tabBar: {
    display: 'flex',
    gap: 'var(--space-xs)',
    overflowX: 'auto',
    paddingBottom: 'var(--space-xs)',
    WebkitOverflowScrolling: 'touch'
  },
  tab: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  },
  tabActive: {
    color: 'var(--accent-primary)',
    borderBottomColor: 'var(--accent-primary)'
  },
  tabBadge: {
    marginLeft: '6px',
    padding: '2px 6px',
    background: 'var(--bg-tertiary)',
    borderRadius: '10px',
    fontSize: '0.7rem'
  },
  content: {
    flex: 1,
    paddingTop: 'var(--space-lg)'
  },
  section: {
    marginBottom: 'var(--space-xl)'
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    marginBottom: 'var(--space-md)'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-md)'
  },
  infoCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    border: '1px solid var(--border-primary)'
  },
  infoLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginBottom: '4px'
  },
  infoValue: {
    fontSize: '1rem',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  infoValueSmall: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  listCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    overflow: 'hidden'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-md) var(--space-lg)',
    borderBottom: '1px solid var(--border-primary)',
    cursor: 'pointer'
  },
  listItemLast: {
    borderBottom: 'none'
  },
  listItemContent: {
    flex: 1,
    minWidth: 0
  },
  listItemTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  listItemSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-tertiary)'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '8px',
    flexShrink: 0
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProjectDetail({ project, onBack, onCreateTask, onCreateRFI }) {
  const { userId } = useManagerAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [modules, setModules] = useState([]);
  const [counts, setCounts] = useState({ tasks: 0, rfis: 0, modules: 0 });

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================

  const fetchProjectData = useCallback(async () => {
    if (!project?.id) return;

    setLoading(true);

    try {
      // Fetch all data in parallel
      const [tasksRes, rfisRes, modulesRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, status, priority, due_date')
          .eq('project_id', project.id)
          .order('due_date', { ascending: true, nullsFirst: false }),

        supabase
          .from('rfis')
          .select('id, rfi_number, subject, status, due_date')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('modules')
          .select('id, serial_number, name, status, current_station_id')
          .eq('project_id', project.id)
          .order('sequence_number', { ascending: true })
      ]);

      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setModules(modulesRes.data || []);

      setCounts({
        tasks: tasksRes.data?.length || 0,
        rfis: rfisRes.data?.length || 0,
        modules: modulesRes.data?.length || 0
      });
    } catch (err) {
      console.error('[ProjectDetail] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const isOverdue = (dateStr, status) => {
    if (!dateStr || status === 'Completed' || status === 'Closed') return false;
    return dateStr < new Date().toISOString().split('T')[0];
  };

  if (!project) {
    return (
      <div style={styles.emptyState}>
        <p>No project selected</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER TAB CONTENT
  // ==========================================================================

  const renderOverview = () => (
    <div>
      {/* Key Dates */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Key Dates</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Start Date</div>
            <div style={styles.infoValue}>{formatDate(project.start_date)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Delivery Date</div>
            <div style={{
              ...styles.infoValue,
              color: isOverdue(project.delivery_date, project.status) ? '#ef4444' : 'var(--text-primary)'
            }}>
              {formatDate(project.delivery_date)}
            </div>
          </div>
        </div>
      </div>

      {/* Financials */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Contract</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Contract Value</div>
            <div style={styles.infoValue}>{formatCurrency(project.contract_value)}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Modules</div>
            <div style={styles.infoValue}>{project.module_count || '—'}</div>
          </div>
        </div>
      </div>

      {/* Location */}
      {(project.site_city || project.site_state) && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Location</h3>
          <div style={{ ...styles.infoCard, display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <MapPin size={20} color="var(--text-tertiary)" />
            <div>
              <div style={styles.infoValueSmall}>
                {[project.site_city, project.site_state].filter(Boolean).join(', ') || 'Not specified'}
              </div>
              {project.site_address && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {project.site_address}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Building Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Building Details</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Type</div>
            <div style={styles.infoValueSmall}>{project.building_type || '—'}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Factory</div>
            <div style={styles.infoValueSmall}>{project.factory || '—'}</div>
          </div>
          {project.square_footage && (
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Square Footage</div>
              <div style={styles.infoValueSmall}>{project.square_footage?.toLocaleString()} SF</div>
            </div>
          )}
          {project.stories && (
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Stories</div>
              <div style={styles.infoValueSmall}>{project.stories}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTasks = () => {
    if (loading) {
      return (
        <div style={styles.loadingContainer}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div style={styles.emptyState}>
          <CheckSquare size={40} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
          <p>No tasks yet</p>
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-sm) var(--space-lg)',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Create Task
            </button>
          )}
        </div>
      );
    }

    return (
      <div style={styles.listCard}>
        {tasks.map((task, index) => (
          <div
            key={task.id}
            style={{
              ...styles.listItem,
              ...(index === tasks.length - 1 ? styles.listItemLast : {})
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <span
                style={{
                  ...styles.statusDot,
                  background: TASK_STATUS_COLORS[task.status] || '#6b7280'
                }}
              />
              <div style={styles.listItemContent}>
                <div style={styles.listItemTitle}>{task.title}</div>
                <div style={styles.listItemSubtitle}>
                  {task.status} • {task.due_date ? formatDate(task.due_date) : 'No due date'}
                </div>
              </div>
            </div>
            <span
              style={{
                ...styles.badge,
                background: `${PRIORITY_COLORS[task.priority] || '#6b7280'}20`,
                color: PRIORITY_COLORS[task.priority] || '#6b7280'
              }}
            >
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderRFIs = () => {
    if (loading) {
      return (
        <div style={styles.loadingContainer}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      );
    }

    if (rfis.length === 0) {
      return (
        <div style={styles.emptyState}>
          <MessageSquare size={40} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
          <p>No RFIs yet</p>
          {onCreateRFI && (
            <button
              onClick={onCreateRFI}
              style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-sm) var(--space-lg)',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Create RFI
            </button>
          )}
        </div>
      );
    }

    const RFI_STATUS_COLORS = {
      'Draft': '#6b7280',
      'Open': '#3b82f6',
      'Pending': '#f59e0b',
      'Answered': '#22c55e',
      'Closed': '#6b7280'
    };

    return (
      <div style={styles.listCard}>
        {rfis.map((rfi, index) => (
          <div
            key={rfi.id}
            style={{
              ...styles.listItem,
              ...(index === rfis.length - 1 ? styles.listItemLast : {})
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <span
                style={{
                  ...styles.statusDot,
                  background: RFI_STATUS_COLORS[rfi.status] || '#6b7280'
                }}
              />
              <div style={styles.listItemContent}>
                <div style={styles.listItemTitle}>{rfi.subject}</div>
                <div style={styles.listItemSubtitle}>
                  {rfi.rfi_number} • {rfi.status}
                </div>
              </div>
            </div>
            <ChevronRight size={20} color="var(--text-tertiary)" />
          </div>
        ))}
      </div>
    );
  };

  const renderModules = () => {
    if (loading) {
      return (
        <div style={styles.loadingContainer}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      );
    }

    if (modules.length === 0) {
      return (
        <div style={styles.emptyState}>
          <Box size={40} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
          <p>No modules assigned</p>
        </div>
      );
    }

    // Module statuses per CLAUDE_INSTRUCTIONS.MD
    const MODULE_STATUS_COLORS = {
      'Not Started': '#64748b',
      'In Queue': '#eab308',
      'In Progress': '#3b82f6',
      'QC Hold': '#f97316',
      'Rework': '#ef4444',
      'Completed': '#22c55e',
      'Staged': '#8b5cf6',
      'Shipped': '#14b8a6'
    };

    return (
      <div style={styles.listCard}>
        {modules.map((module, index) => (
          <div
            key={module.id}
            style={{
              ...styles.listItem,
              ...(index === modules.length - 1 ? styles.listItemLast : {})
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <span
                style={{
                  ...styles.statusDot,
                  background: MODULE_STATUS_COLORS[module.status] || '#6b7280'
                }}
              />
              <div style={styles.listItemContent}>
                <div style={styles.listItemTitle}>{module.serial_number}</div>
                <div style={styles.listItemSubtitle}>
                  {module.status}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          <ArrowLeft size={18} />
          Back to Projects
        </button>

        <div style={styles.projectHeader}>
          <div style={styles.projectNumber}>{project.project_number}</div>
          <h1 style={styles.projectName}>{project.name}</h1>
          <div style={styles.badges}>
            <span
              style={{
                ...styles.badge,
                background: `${STATUS_COLORS[project.status] || '#6b7280'}20`,
                color: STATUS_COLORS[project.status] || '#6b7280'
              }}
            >
              {project.status}
            </span>
            {project.health_status && (
              <span
                style={{
                  ...styles.badge,
                  background: `${HEALTH_COLORS[project.health_status] || '#6b7280'}20`,
                  color: HEALTH_COLORS[project.health_status] || '#6b7280'
                }}
              >
                {project.health_status}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
            >
              {tab.label}
              {tab.id !== 'overview' && counts[tab.id] > 0 && (
                <span style={styles.tabBadge}>{counts[tab.id]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'rfis' && renderRFIs()}
        {activeTab === 'modules' && renderModules()}
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
