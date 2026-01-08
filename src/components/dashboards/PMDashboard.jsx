// ============================================================================
// PMDashboard.jsx - Project Manager Dashboard (POLISHED VERSION)
// ============================================================================
// Main dashboard for Project Managers showing overview statistics,
// calendar widget, project list, and overdue items.
//
// FIXES:
// - Toast uses inline styles (no CSS class dependency)
// - Proper error handling with user feedback
// - useCallback for handlers to prevent re-renders
// - Loading state with proper cleanup
// - Memory leak prevention for setTimeout
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  Plus,
  Calendar,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  ChevronRight,
  AlertCircle,
  Clock,
  Target
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import CreateProjectModal from '../projects/CreateProjectModal';
import CalendarWeekView from '../calendar/CalendarWeekView';
import { buildCalendarItems, getProjectColor } from '../../utils/calendarUtils';

// ============================================================================
// CONSTANTS
// ============================================================================
const TOAST_DURATION = 3000;

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
  statCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    border: '1px solid var(--border-color)'
  },
  statCardDanger: {
    background: 'var(--danger-light)',
    border: '1px solid var(--danger)'
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md) var(--space-lg)',
    background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  disabledButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md) var(--space-lg)',
    background: 'var(--bg-primary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    fontWeight: '600',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  projectCard: {
    padding: 'var(--space-md) var(--space-lg)',
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  overdueItem: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-sm)',
    borderLeft: '3px solid var(--danger)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency for display
 */
const formatCurrency = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Get project status color
 */
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

/**
 * Calculate days overdue
 */
const getDaysOverdue = (dateString) => {
  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function PMDashboard() {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);

  // View states
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectTab, setSelectedProjectTab] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Auto-dismiss toast with cleanup
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), TOAST_DURATION);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [projectsRes, tasksRes, rfisRes, submittalsRes, milestonesRes] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .order('updated_at', { ascending: false }),
        supabase
          .from('tasks')
          .select(`
            *,
            project:project_id(id, name, project_number, color),
            assignee:assignee_id(name),
            internal_owner:internal_owner_id(name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('rfis')
          .select(`
            *,
            project:project_id(id, name, project_number, color)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('submittals')
          .select(`
            *,
            project:project_id(id, name, project_number, color)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('milestones')
          .select(`
            *,
            project:project_id(id, name, project_number, color)
          `)
          .order('due_date', { ascending: true })
      ]);

      // Check for errors
      if (projectsRes.error) throw projectsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (rfisRes.error) throw rfisRes.error;
      if (submittalsRes.error) throw submittalsRes.error;
      if (milestonesRes.error) throw milestonesRes.error;

      // Assign colors to projects that don't have one
      const projectsWithColors = (projectsRes.data || []).map((project, index) => ({
        ...project,
        color: project.color || getProjectColor(project, index)
      }));

      setProjects(projectsWithColors);
      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
      setMilestones(milestonesRes.data || []);

      // Build calendar items
      const items = buildCalendarItems(
        projectsWithColors,
        tasksRes.data,
        rfisRes.data,
        submittalsRes.data,
        milestonesRes.data
      );
      setCalendarItems(items);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================
  const today = new Date().toISOString().split('T')[0];

  // Active projects (not completed/cancelled/on hold)
  const activeProjects = projects.filter(p =>
    !['Completed', 'Cancelled', 'On Hold', 'Warranty'].includes(p.status)
  ).length;

  // My tasks (assigned to me or I own)
  const myTasks = tasks.filter(t =>
    (t.assignee_id === user?.id || t.internal_owner_id === user?.id) &&
    !['Completed', 'Cancelled'].includes(t.status)
  );

  // Overdue tasks
  const overdueTasks = myTasks.filter(t => t.due_date && t.due_date < today);

  // Open RFIs
  const openRFIs = rfis.filter(r => ['Open', 'Draft'].includes(r.status));

  // Pending submittals
  const pendingSubmittals = submittals.filter(s =>
    ['Pending', 'Submitted', 'Under Review'].includes(s.status)
  );

  // Total contract value (excluding cancelled)
  const totalContractValue = projects
    .filter(p => !['Cancelled'].includes(p.status))
    .reduce((sum, p) => sum + (p.contract_value || 0), 0);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleProjectClick = useCallback((project) => {
    setSelectedProject(project);
    setSelectedProjectTab(null);
  }, []);

  const handleProjectUpdate = useCallback((updatedProject) => {
    setProjects(prev => prev.map(p =>
      p.id === updatedProject.id ? updatedProject : p
    ));
    setSelectedProject(updatedProject);
    showToast('Project updated successfully');
  }, [showToast]);

  const handleProjectCreated = useCallback((newProject) => {
    setProjects(prev => [newProject, ...prev]);
    setShowCreateProject(false);
    showToast('Project created successfully');
    fetchDashboardData();
  }, [fetchDashboardData, showToast]);

  const handleCalendarItemClick = useCallback((item) => {
    const project = projects.find(p => p.id === item.projectId);
    if (project) {
      setSelectedProject(project);
      // Set the appropriate tab based on item type
      if (item.type === 'task') setSelectedProjectTab('Tasks');
      else if (item.type === 'rfi') setSelectedProjectTab('RFIs');
      else if (item.type === 'submittal') setSelectedProjectTab('Submittals');
    }
  }, [projects]);

  const handleBackFromProject = useCallback(() => {
    setSelectedProject(null);
    setSelectedProjectTab(null);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ==========================================================================
  // RENDER - Project Details View
  // ==========================================================================
  if (selectedProject) {
    return (
      <ProjectDetails
        project={selectedProject}
        onBack={handleBackFromProject}
        onUpdate={handleProjectUpdate}
        initialTab={selectedProjectTab}
      />
    );
  }

  // ==========================================================================
  // RENDER - Loading State
  // ==========================================================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - Error State
  // ==========================================================================
  if (error && projects.length === 0) {
    return (
      <div style={{ ...styles.loadingContainer, textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: 'var(--space-md)' }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
          Failed to load dashboard
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          {error}
        </p>
        <button
          onClick={fetchDashboardData}
          style={styles.primaryButton}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - Main Dashboard
  // ==========================================================================
  return (
    <div>
      {/* ================================================================== */}
      {/* WELCOME HEADER                                                    */}
      {/* ================================================================== */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-xs)'
        }}>
          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* ================================================================== */}
      {/* STATS CARDS                                                       */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)'
      }}>
        {/* Active Projects */}
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <FolderKanban size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active Projects</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {activeProjects}
          </div>
        </div>

        {/* My Tasks */}
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <CheckSquare size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>My Tasks</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {myTasks.length}
          </div>
        </div>

        {/* Open RFIs */}
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <MessageSquare size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Open RFIs</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {openRFIs.length}
          </div>
        </div>

        {/* Pending Submittals */}
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <ClipboardList size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pending Submittals</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {pendingSubmittals.length}
          </div>
        </div>

        {/* Contract Value */}
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <DollarSign size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Value</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {formatCurrency(totalContractValue)}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* QUICK ACTIONS                                                     */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setShowCreateProject(true)}
          style={styles.primaryButton}
        >
          <Plus size={18} />
          New Project
        </button>
        <button
          disabled
          style={styles.disabledButton}
          title="Select a project first"
        >
          <MessageSquare size={18} />
          New RFI
        </button>
        <button
          disabled
          style={styles.disabledButton}
          title="Select a project first"
        >
          <ClipboardList size={18} />
          New Submittal
        </button>
      </div>

      {/* ================================================================== */}
      {/* CALENDAR WEEK VIEW                                                */}
      {/* ================================================================== */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <CalendarWeekView
          items={calendarItems}
          projects={projects}
          onItemClick={handleCalendarItemClick}
          compact={false}
        />
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT GRID                                                 */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 'var(--space-xl)'
      }}>
        {/* MY PROJECTS */}
        <div style={styles.statCard}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-lg)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              My Projects
            </h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {projects.length} total
            </span>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              subtitle="Create your first project to get started"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {projects.slice(0, 5).map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={handleProjectClick}
                />
              ))}
            </div>
          )}

          {projects.length > 5 && (
            <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
              <button style={{
                background: 'none',
                border: 'none',
                color: 'var(--sunbelt-orange)',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-xs)'
              }}>
                View all {projects.length} projects
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* OVERDUE ITEMS */}
        <div style={{
          ...styles.statCard,
          ...(overdueTasks.length > 0 ? styles.statCardDanger : {})
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)'
          }}>
            <AlertTriangle size={20} style={{
              color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--sunbelt-orange)'
            }} />
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text-primary)',
              margin: 0
            }}>
              Overdue Items ({overdueTasks.length})
            </h3>
          </div>

          {overdueTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="All caught up!"
              subtitle="No overdue items"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {overdueTasks.slice(0, 5).map(task => (
                <div key={task.id} style={styles.overdueItem}>
                  <div>
                    <div style={{
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {task.project?.name} • Due {formatDate(task.due_date)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--danger)',
                    fontWeight: '600'
                  }}>
                    {getDaysOverdue(task.due_date)}d overdue
                  </span>
                </div>
              ))}
              {overdueTasks.length > 5 && (
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  textAlign: 'center',
                  margin: 'var(--space-sm) 0 0 0'
                }}>
                  +{overdueTasks.length - 5} more overdue items
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* CREATE PROJECT MODAL                                              */}
      {/* ================================================================== */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={handleProjectCreated}
      />

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
 * Project Card Component
 */
function ProjectCard({ project, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(project)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.projectCard,
        borderLeft: `4px solid ${project.color || 'var(--sunbelt-orange)'}`,
        borderColor: isHovered ? 'var(--sunbelt-orange)' : 'var(--border-color)',
        transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          marginBottom: '4px'
        }}>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
            {project.name}
          </span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: '600',
            background: `${getProjectStatusColor(project.status)}20`,
            color: getProjectStatusColor(project.status),
            textTransform: 'uppercase'
          }}>
            {project.status}
          </span>
        </div>
        <div style={{
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)'
        }}>
          <span>{project.project_number}</span>
          {project.target_online_date && (
            <>
              <span>•</span>
              <span>Online: {formatDate(project.target_online_date)}</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-xl)',
      color: 'var(--text-tertiary)'
    }}>
      <Icon size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
      <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
        {title}
      </h4>
      <p>{subtitle}</p>
    </div>
  );
}

export default PMDashboard;