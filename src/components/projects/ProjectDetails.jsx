// ============================================================================
// ProjectDetails.jsx - Project Detail View (POLISHED VERSION)
// ============================================================================
// Main component for viewing and managing a single project.
// Features: Tabbed interface, stats cards, task/RFI/submittal management,
// calendar views, file management, and export capabilities.
//
// PROPS:
// - project: Project object (required)
// - onBack: Callback when back button clicked (required)
// - onUpdate: Callback when project is updated (optional)
// - initialTab: Tab to open on load (optional, default: 'Overview')
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Edit,
  Calendar,
  DollarSign,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  FolderOpen,
  Plus,
  Building2,
  Target,
  AlertCircle,
  Download,
  ChevronRight,
  Flag,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// MODAL IMPORTS
// ============================================================================
import EditProjectModal from './EditProjectModal';
import AddMilestoneModal from './AddMilestoneModal';
import AddTaskModal from './AddTaskModal';
import EditTaskModal from './EditTaskModal';
import AddRFIModal from './AddRFIModal';
import EditRFIModal from './EditRFIModal';
import AddSubmittalModal from './AddSubmittalModal';
import EditSubmittalModal from './EditSubmittalModal';

// ============================================================================
// COMPONENT IMPORTS
// ============================================================================
import ProjectFiles from './ProjectFiles';
import ProjectCalendarWeek from './ProjectCalendarWeek';
import ProjectCalendarMonth from './ProjectCalendarMonth';
import TasksView from './TasksView';

// ============================================================================
// CONSTANTS
// ============================================================================
const TABS = ['Overview', 'Tasks', 'RFIs', 'Submittals', 'Calendar', 'Files'];

const TAB_ICONS = {
  Overview: Building2,
  Tasks: CheckSquare,
  RFIs: MessageSquare,
  Submittals: ClipboardList,
  Calendar: Calendar,
  Files: FolderOpen
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency with fallback
 */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date with fallback
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format short date for lists
 */
const formatShortDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get today's date as YYYY-MM-DD string
 */
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Check if a date is overdue (before today)
 */
const isOverdue = (dateString) => {
  if (!dateString) return false;
  return dateString < getTodayString();
};

/**
 * Calculate days open from creation date
 */
const calculateDaysOpen = (createdAt, status) => {
  const closedStatuses = ['Closed', 'Completed', 'Approved', 'Rejected', 'Cancelled'];
  if (closedStatuses.includes(status)) return '-';
  const created = new Date(createdAt);
  const now = new Date();
  return Math.ceil((now - created) / (1000 * 60 * 60 * 24));
};

/**
 * Get days until a date (negative if overdue)
 */
const getDaysUntil = (dateString) => {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

// ============================================================================
// STATUS COLOR HELPERS
// ============================================================================
const getProjectStatusColor = (status) => {
  const colors = {
    'Planning': 'var(--info)',
    'Pre-PM': 'var(--warning)',
    'PM Handoff': 'var(--sunbelt-orange)',
    'In Progress': 'var(--sunbelt-orange)',
    'On Hold': 'var(--text-tertiary)',
    'Completed': 'var(--success)',
    'Cancelled': 'var(--danger)',
    'Warranty': 'var(--info)'
  };
  return colors[status] || 'var(--text-secondary)';
};

const getRFIStatusColor = (status) => {
  const colors = {
    'Draft': 'var(--text-tertiary)',
    'Open': 'var(--sunbelt-orange)',
    'Pending': 'var(--warning)',
    'Answered': 'var(--success)',
    'Closed': 'var(--text-tertiary)'
  };
  return colors[status] || 'var(--text-secondary)';
};

const getSubmittalStatusColor = (status) => {
  const colors = {
    'Pending': 'var(--text-tertiary)',
    'Submitted': 'var(--sunbelt-orange)',
    'Under Review': 'var(--warning)',
    'Approved': 'var(--success)',
    'Approved as Noted': 'var(--info)',
    'Revise and Resubmit': 'var(--warning)',
    'Rejected': 'var(--danger)'
  };
  return colors[status] || 'var(--text-secondary)';
};

const getMilestoneStatusColor = (status) => {
  const colors = {
    'Pending': 'var(--text-tertiary)',
    'In Progress': 'var(--sunbelt-orange)',
    'Completed': 'var(--success)'
  };
  return colors[status] || 'var(--text-secondary)';
};

// ============================================================================
// CSV EXPORT HELPER (properly escapes values)
// ============================================================================
const escapeCSVValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const generateCSV = (headers, rows) => {
  const headerLine = headers.map(escapeCSVValue).join(',');
  const dataLines = rows.map(row => row.map(escapeCSVValue).join(','));
  return [headerLine, ...dataLines].join('\r\n');
};

const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

// ============================================================================
// INLINE STYLES
// ============================================================================
const styles = {
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    color: 'white',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 10000,
    animation: 'toastSlideIn 0.3s ease'
  },
  toastSuccess: {
    background: 'var(--success)'
  },
  toastError: {
    background: 'var(--danger)'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh'
  },
  loadingText: {
    marginTop: 'var(--space-md)',
    color: 'var(--text-secondary)'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    flexShrink: 0
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  overdueBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.7rem',
    fontWeight: '600',
    background: 'var(--danger)',
    color: 'white'
  },
  statCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    border: '1px solid var(--border-color)'
  },
  statCardOverdue: {
    border: '1px solid var(--danger)'
  },
  listItem: {
    padding: 'var(--space-md)',
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: '8px 16px',
    background: 'var(--bg-primary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem'
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ProjectDetails({
  project: initialProject,
  onBack,
  onUpdate,
  initialTab = 'Overview'
}) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE - PROJECT DATA
  // ==========================================================================
  const [project, setProject] = useState(initialProject);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================================================
  // STATE - UI CONTROLS
  // ==========================================================================
  const [activeTab, setActiveTab] = useState(
    TABS.includes(initialTab) ? initialTab : 'Overview'
  );
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // STATE - MODAL VISIBILITY
  // ==========================================================================
  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddRFI, setShowAddRFI] = useState(false);
  const [showAddSubmittal, setShowAddSubmittal] = useState(false);

  // ==========================================================================
  // STATE - EDIT MODALS (set to item object to open, null to close)
  // ==========================================================================
  const [editTask, setEditTask] = useState(null);
  const [editRFI, setEditRFI] = useState(null);
  const [editSubmittal, setEditSubmittal] = useState(null);

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchProjectData = useCallback(async () => {
    if (!project?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel for better performance
      const [projectRes, tasksRes, rfisRes, submittalsRes, milestonesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', project.id).single(),
        supabase.from('tasks')
          .select('*, assignee:assignee_id(id, name), internal_owner:internal_owner_id(id, name)')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false }),
        supabase.from('rfis')
          .select('*')
          .eq('project_id', project.id)
          .order('number', { ascending: false }),
        supabase.from('submittals')
          .select('*')
          .eq('project_id', project.id)
          .order('number', { ascending: false }),
        supabase.from('milestones')
          .select('*')
          .eq('project_id', project.id)
          .order('due_date', { ascending: true })
      ]);

      // Check for errors
      if (projectRes.error) throw projectRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (rfisRes.error) throw rfisRes.error;
      if (submittalsRes.error) throw submittalsRes.error;
      if (milestonesRes.error) throw milestonesRes.error;

      // Update state
      if (projectRes.data) setProject(projectRes.data);
      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
      setMilestones(milestonesRes.data || []);

    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project data. Please try again.');
      showToast('Failed to load project data', 'error');
    } finally {
      setLoading(false);
    }
  }, [project?.id, showToast]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Update project when prop changes
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  // Update active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab && TABS.includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Fetch project data when project ID changes
  useEffect(() => {
    if (project?.id) {
      fetchProjectData();
    }
  }, [project?.id, fetchProjectData]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================
  const today = getTodayString();

  // Task stats
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const overdueTasks = tasks.filter(t =>
    t.due_date && t.due_date < today && !['Completed', 'Cancelled'].includes(t.status)
  ).length;

  // RFI stats
  const openRFIs = rfis.filter(r => ['Open', 'Draft'].includes(r.status)).length;
  const overdueRFIs = rfis.filter(r =>
    r.due_date && r.due_date < today && !['Answered', 'Closed'].includes(r.status)
  ).length;

  // Submittal stats
  const approvedSubmittals = submittals.filter(s =>
    ['Approved', 'Approved as Noted'].includes(s.status)
  ).length;
  const overdueSubmittals = submittals.filter(s =>
    s.due_date && s.due_date < today && ['Pending', 'Submitted', 'Under Review'].includes(s.status)
  ).length;

  // ==========================================================================
  // EXPORT FUNCTIONS
  // ==========================================================================
  const exportRFILog = () => {
    const headers = ['RFI #', 'Subject', 'Status', 'Sent To', 'Date Sent', 'Due Date', 'Days Open', 'Question', 'Answer'];
    const rows = rfis.map(rfi => [
      rfi.rfi_number || `RFI-${String(rfi.number || 0).padStart(3, '0')}`,
      rfi.subject || '',
      rfi.status || '',
      rfi.is_external ? (rfi.sent_to || '') : 'Internal',
      formatShortDate(rfi.date_sent),
      formatShortDate(rfi.due_date),
      calculateDaysOpen(rfi.created_at, rfi.status),
      rfi.question || '',
      rfi.answer || ''
    ]);

    const csvContent = generateCSV(headers, rows);
    downloadCSV(csvContent, `${project.project_number}_RFI_Log.csv`);
    showToast('RFI log exported');
  };

  const exportSubmittalLog = () => {
    const headers = ['Submittal #', 'Title', 'Type', 'Status', 'Sent To', 'Due Date', 'Revision', 'Spec Section', 'Manufacturer'];
    const rows = submittals.map(sub => [
      sub.submittal_number || `SUB-${String(sub.number || 0).padStart(3, '0')}`,
      sub.title || '',
      sub.submittal_type || '',
      sub.status || '',
      sub.is_external ? (sub.sent_to || '') : 'Internal',
      formatShortDate(sub.due_date),
      sub.revision_number || 0,
      sub.spec_section || '',
      sub.manufacturer || ''
    ]);

    const csvContent = generateCSV(headers, rows);
    downloadCSV(csvContent, `${project.project_number}_Submittal_Log.csv`);
    showToast('Submittal log exported');
  };

  // ==========================================================================
  // MODAL SUCCESS/DELETE HANDLERS
  // ==========================================================================
  const handleProjectUpdateSuccess = (updatedProject) => {
    setProject(updatedProject);
    setShowEditProject(false);
    if (onUpdate) onUpdate(updatedProject);
    showToast('Project updated successfully');
  };

  const handleTaskSuccess = () => {
    fetchProjectData();
    setShowAddTask(false);
    setEditTask(null);
    showToast('Task saved successfully');
  };

  const handleTaskDelete = () => {
    fetchProjectData();
    setEditTask(null);
    showToast('Task deleted');
  };

  const handleRFISuccess = () => {
    fetchProjectData();
    setShowAddRFI(false);
    setEditRFI(null);
    showToast('RFI saved successfully');
  };

  const handleRFIDelete = () => {
    fetchProjectData();
    setEditRFI(null);
    showToast('RFI deleted');
  };

  const handleSubmittalSuccess = () => {
    fetchProjectData();
    setShowAddSubmittal(false);
    setEditSubmittal(null);
    showToast('Submittal saved successfully');
  };

  const handleSubmittalDelete = () => {
    fetchProjectData();
    setEditSubmittal(null);
    showToast('Submittal deleted');
  };

  const handleMilestoneSuccess = () => {
    fetchProjectData();
    setShowAddMilestone(false);
    showToast('Milestone added successfully');
  };

  // ==========================================================================
  // CALENDAR ITEM CLICK HANDLER
  // ==========================================================================
  const handleCalendarItemClick = (item) => {
    if (item.type === 'task') setEditTask(item.data);
    else if (item.type === 'rfi') setEditRFI(item.data);
    else if (item.type === 'submittal') setEditSubmittal(item.data);
  };

  // ==========================================================================
  // RENDER - LOADING STATE
  // ==========================================================================
  if (loading && !project) {
    return (
      <div style={styles.loadingContainer}>
        <div className="loading-spinner"></div>
        <p style={styles.loadingText}>Loading project...</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - ERROR STATE
  // ==========================================================================
  if (error && !project) {
    return (
      <div style={{ ...styles.loadingContainer, textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: 'var(--space-md)' }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
          Failed to load project
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          {error}
        </p>
        <button onClick={onBack} style={styles.secondaryButton}>
          Go Back
        </button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
          <button
            onClick={onBack}
            style={styles.backButton}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                {project.project_number}
              </h1>
              <span style={{
                ...styles.statusBadge,
                background: `${getProjectStatusColor(project.status)}20`,
                color: getProjectStatusColor(project.status)
              }}>
                {project.status}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>
              {project.name}
            </p>
            {project.client_name && (
              <p style={{ color: 'var(--text-tertiary)', margin: '4px 0 0 0', fontSize: '0.875rem' }}>
                {project.client_name}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowEditProject(true)}
          style={styles.secondaryButton}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <Edit size={16} />
          Edit Project
        </button>
      </div>

      {/* ================================================================== */}
      {/* STATS CARDS                                                       */}
      {/* ================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {/* Contract Value */}
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <DollarSign size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Contract Value</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {formatCurrency(project.contract_value)}
          </div>
        </div>

        {/* Tasks */}
        <div style={{ ...styles.statCard, ...(overdueTasks > 0 ? styles.statCardOverdue : {}) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <CheckSquare size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Tasks</span>
            {overdueTasks > 0 && (
              <span style={styles.overdueBadge}>{overdueTasks} overdue</span>
            )}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {completedTasks} / {tasks.length}
          </div>
        </div>

        {/* RFIs */}
        <div style={{ ...styles.statCard, ...(overdueRFIs > 0 ? styles.statCardOverdue : {}) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <MessageSquare size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Open RFIs</span>
            {overdueRFIs > 0 && (
              <span style={styles.overdueBadge}>{overdueRFIs} overdue</span>
            )}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {openRFIs} / {rfis.length}
          </div>
        </div>

        {/* Submittals */}
        <div style={{ ...styles.statCard, ...(overdueSubmittals > 0 ? styles.statCardOverdue : {}) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <ClipboardList size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Submittals</span>
            {overdueSubmittals > 0 && (
              <span style={styles.overdueBadge}>{overdueSubmittals} overdue</span>
            )}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {approvedSubmittals} / {submittals.length}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TAB NAVIGATION                                                    */}
      {/* ================================================================== */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-sm)', overflowX: 'auto' }}>
        {TABS.map(tab => {
          const IconComponent = TAB_ICONS[tab];
          let count = null;
          if (tab === 'Tasks') count = tasks.length;
          if (tab === 'RFIs') count = rfis.length;
          if (tab === 'Submittals') count = submittals.length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: 'var(--space-sm) var(--space-md)',
                background: activeTab === tab ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: activeTab === tab ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap'
              }}
            >
              <IconComponent size={16} />
              {tab}
              {count !== null && (
                <span style={{ marginLeft: '4px', opacity: 0.7 }}>({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* TAB CONTENT - OVERVIEW                                            */}
      {/* ================================================================== */}
      {activeTab === 'Overview' && (
        <div>
          {/* Week Calendar Widget */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <ProjectCalendarWeek
              project={project}
              tasks={tasks}
              rfis={rfis}
              submittals={submittals}
              milestones={milestones}
              onItemClick={handleCalendarItemClick}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--space-xl)' }}>
            {/* PROJECT INFORMATION CARD */}
            <div style={styles.statCard}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 var(--space-lg) 0' }}>
                Project Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-lg)' }}>
                <InfoField label="Client" value={project.client_name} />
                <InfoField label="Dealer" value={project.dealer || project.dealer_name} />
                <InfoField label="Factory" value={project.factory} />
                <InfoField label="Building Type" value={project.building_type} />
                <InfoField label="Square Footage" value={project.square_footage ? `${project.square_footage.toLocaleString()} SF` : null} />
                <InfoField label="Module Count" value={project.module_count} />
                <InfoField label="Target Online Date" value={formatDate(project.target_online_date)} />
                <InfoField label="Delivery Date" value={formatDate(project.delivery_date || project.target_delivery_date)} />
                <InfoField label="Site Address" value={project.site_address} fullWidth />
                {project.description && (
                  <InfoField label="Description" value={project.description} fullWidth />
                )}
              </div>
            </div>

            {/* MILESTONES CARD */}
            <div style={styles.statCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Milestones
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddMilestone(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              {milestones.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', margin: 0 }}>
                  No milestones added yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {milestones.slice(0, 5).map(milestone => (
                    <div
                      key={milestone.id}
                      style={{
                        padding: 'var(--space-sm)',
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `3px solid ${getMilestoneStatusColor(milestone.status)}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                          {milestone.name}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          background: `${getMilestoneStatusColor(milestone.status)}20`,
                          color: getMilestoneStatusColor(milestone.status)
                        }}>
                          {milestone.status}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Due: {formatDate(milestone.due_date)}
                      </span>
                    </div>
                  ))}
                  {milestones.length > 5 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, textAlign: 'center' }}>
                      +{milestones.length - 5} more milestones
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB CONTENT - TASKS                                               */}
      {/* ================================================================== */}
      {activeTab === 'Tasks' && (
        <TasksView
          tasks={tasks}
          projectId={project.id}
          projectName={project.name}
          projectNumber={project.project_number}
          onTaskClick={(task) => setEditTask(task)}
          onAddTask={() => setShowAddTask(true)}
          onTasksChange={setTasks}
          showToast={showToast}
        />
      )}

      {/* ================================================================== */}
      {/* TAB CONTENT - RFIs                                                */}
      {/* ================================================================== */}
      {activeTab === 'RFIs' && (
        <div style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              RFIs ({rfis.length})
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {rfis.length > 0 && (
                <button type="button" onClick={exportRFILog} style={styles.secondaryButton}>
                  <Download size={16} />
                  Export Log
                </button>
              )}
              <button type="button" onClick={() => setShowAddRFI(true)} style={styles.primaryButton}>
                <Plus size={16} />
                Add RFI
              </button>
            </div>
          </div>

          {rfis.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No RFIs yet" subtitle="Create your first RFI to get started" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {rfis.map(rfi => {
                const rfiOverdue = isOverdue(rfi.due_date) && !['Answered', 'Closed'].includes(rfi.status);

                return (
                  <ListItem
                    key={rfi.id}
                    onClick={() => setEditRFI(rfi)}
                    isOverdue={rfiOverdue}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px', flexWrap: 'wrap' }}>
                        {rfi.is_external && (
                          <span
                            style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }}
                            title="External RFI"
                          />
                        )}
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {rfi.rfi_number || `RFI-${String(rfi.number || 0).padStart(3, '0')}`}: {rfi.subject}
                        </span>
                        <StatusBadge status={rfi.status} getColor={getRFIStatusColor} />
                        {rfiOverdue && <span style={styles.overdueBadge}>Overdue</span>}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        <span>To: {rfi.sent_to || 'Internal'}</span>
                        <span>•</span>
                        <span>Days Open: {calculateDaysOpen(rfi.created_at, rfi.status)}</span>
                        {rfi.due_date && (
                          <>
                            <span>•</span>
                            <span style={{ color: rfiOverdue ? 'var(--danger)' : 'inherit' }}>
                              Due: {formatShortDate(rfi.due_date)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                  </ListItem>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB CONTENT - SUBMITTALS                                          */}
      {/* ================================================================== */}
      {activeTab === 'Submittals' && (
        <div style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Submittals ({submittals.length})
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {submittals.length > 0 && (
                <button type="button" onClick={exportSubmittalLog} style={styles.secondaryButton}>
                  <Download size={16} />
                  Export Log
                </button>
              )}
              <button type="button" onClick={() => setShowAddSubmittal(true)} style={styles.primaryButton}>
                <Plus size={16} />
                Add Submittal
              </button>
            </div>
          </div>

          {submittals.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No Submittals yet" subtitle="Create your first submittal to get started" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {submittals.map(submittal => {
                const subOverdue = isOverdue(submittal.due_date) &&
                  ['Pending', 'Submitted', 'Under Review'].includes(submittal.status);

                return (
                  <ListItem
                    key={submittal.id}
                    onClick={() => setEditSubmittal(submittal)}
                    isOverdue={subOverdue}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px', flexWrap: 'wrap' }}>
                        {submittal.is_external && (
                          <span
                            style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }}
                            title="External Submittal"
                          />
                        )}
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {submittal.spec_section && (
                            <span style={{ color: 'var(--sunbelt-orange)', marginRight: '8px' }}>
                              {submittal.spec_section}
                            </span>
                          )}
                          {submittal.title}
                        </span>
                        <StatusBadge status={submittal.status} getColor={getSubmittalStatusColor} />
                        {submittal.revision_number > 0 && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}>
                            Rev {submittal.revision_number}
                          </span>
                        )}
                        {subOverdue && <span style={styles.overdueBadge}>Overdue</span>}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        <span>{submittal.submittal_type}</span>
                        <span>•</span>
                        <span>To: {submittal.sent_to || 'Internal'}</span>
                        {submittal.due_date && (
                          <>
                            <span>•</span>
                            <span style={{ color: subOverdue ? 'var(--danger)' : 'inherit' }}>
                              Due: {formatShortDate(submittal.due_date)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                  </ListItem>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB CONTENT - CALENDAR                                            */}
      {/* ================================================================== */}
      {activeTab === 'Calendar' && (
        <ProjectCalendarMonth
          project={project}
          tasks={tasks}
          rfis={rfis}
          submittals={submittals}
          milestones={milestones}
          onItemClick={handleCalendarItemClick}
        />
      )}

      {/* ================================================================== */}
      {/* TAB CONTENT - FILES                                               */}
      {/* ================================================================== */}
      {activeTab === 'Files' && (
        <ProjectFiles projectId={project.id} />
      )}

      {/* ================================================================== */}
      {/* MODALS                                                            */}
      {/* ================================================================== */}
      {showEditProject && (
        <EditProjectModal
          isOpen={showEditProject}
          onClose={() => setShowEditProject(false)}
          project={project}
          onSuccess={handleProjectUpdateSuccess}
        />
      )}

      {showAddMilestone && (
        <AddMilestoneModal
          isOpen={showAddMilestone}
          onClose={() => setShowAddMilestone(false)}
          projectId={project.id}
          onSuccess={handleMilestoneSuccess}
        />
      )}

      {showAddTask && (
        <AddTaskModal
          isOpen={showAddTask}
          onClose={() => setShowAddTask(false)}
          projectId={project.id}
          projectName={project.name}
          projectNumber={project.project_number}
          onSuccess={handleTaskSuccess}
        />
      )}

      {editTask && (
        <EditTaskModal
          isOpen={true}
          onClose={() => setEditTask(null)}
          task={editTask}
          projectId={project.id}
          projectName={project.name}
          projectNumber={project.project_number}
          onSuccess={handleTaskSuccess}
          onDelete={handleTaskDelete}
        />
      )}

      {showAddRFI && (
        <AddRFIModal
          isOpen={showAddRFI}
          onClose={() => setShowAddRFI(false)}
          projectId={project.id}
          projectNumber={project.project_number}
          projectName={project.name}
          onSuccess={handleRFISuccess}
        />
      )}

      {editRFI && (
        <EditRFIModal
          isOpen={true}
          onClose={() => setEditRFI(null)}
          rfi={editRFI}
          projectName={project.name}
          projectNumber={project.project_number}
          onSuccess={handleRFISuccess}
          onDelete={handleRFIDelete}
        />
      )}

      {showAddSubmittal && (
        <AddSubmittalModal
          isOpen={showAddSubmittal}
          onClose={() => setShowAddSubmittal(false)}
          projectId={project.id}
          projectNumber={project.project_number}
          projectName={project.name}
          onSuccess={handleSubmittalSuccess}
        />
      )}

      {editSubmittal && (
        <EditSubmittalModal
          isOpen={true}
          onClose={() => setEditSubmittal(null)}
          submittal={editSubmittal}
          projectName={project.name}
          projectNumber={project.project_number}
          onSuccess={handleSubmittalSuccess}
          onDelete={handleSubmittalDelete}
        />
      )}

      {/* ================================================================== */}
      {/* TOAST NOTIFICATION                                                */}
      {/* ================================================================== */}
      {toast && (
        <div style={{
          ...styles.toast,
          ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)
        }}>
          {toast.type === 'success' && <CheckSquare size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Info field for project details
 */
function InfoField({ label, value, fullWidth = false }) {
  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <label style={{
        fontSize: '0.75rem',
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {label}
      </label>
      <p style={{
        color: 'var(--text-primary)',
        margin: '4px 0 0 0',
        fontWeight: '500'
      }}>
        {value || 'Not specified'}
      </p>
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status, getColor }) {
  const color = getColor(status);
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '0.7rem',
      fontWeight: '600',
      background: `${color}20`,
      color: color
    }}>
      {status}
    </span>
  );
}

/**
 * List item component with hover effects
 */
function ListItem({ children, onClick, isOverdue = false }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      style={{
        ...styles.listItem,
        borderColor: isHovered ? 'var(--sunbelt-orange)' : (isOverdue ? 'var(--danger)' : 'var(--border-color)'),
        transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
      }}
    >
      {children}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-tertiary)' }}>
      <Icon size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
      <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>{title}</h4>
      <p>{subtitle}</p>
    </div>
  );
}

export default ProjectDetails;