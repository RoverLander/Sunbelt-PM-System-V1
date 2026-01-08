// ============================================================================
// PMDashboard.jsx - Project Manager Dashboard (REDESIGNED)
// ============================================================================
// Command Center style dashboard with:
// - Overdue items section (past due)
// - Needs Attention section (due within 48 hours)
// - Full-width project table
// - Compact calendar heat map
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import CreateProjectModal from '../projects/CreateProjectModal';

// ============================================================================
// CONSTANTS
// ============================================================================
const TOAST_DURATION = 3000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Reset times for comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  if (compareDate.getTime() === today.getTime()) return 'Today';
  if (compareDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatCurrency = (amount) => {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

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

const getItemTypeIcon = (type) => {
  switch (type) {
    case 'task': return CheckSquare;
    case 'rfi': return MessageSquare;
    case 'submittal': return ClipboardList;
    default: return AlertCircle;
  }
};

const getItemTypeColor = (type) => {
  switch (type) {
    case 'task': return 'var(--info)';
    case 'rfi': return 'var(--sunbelt-orange)';
    case 'submittal': return 'var(--success)';
    default: return 'var(--text-secondary)';
  }
};

const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
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

  // View state
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectTab, setSelectedProjectTab] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // TOAST
  // ==========================================================================
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

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
      const [projectsRes, tasksRes, rfisRes, submittalsRes] = await Promise.all([
        supabase.from('projects').select('*').order('updated_at', { ascending: false }),
        supabase.from('tasks').select(`
          *, 
          project:project_id(id, name, project_number, color),
          assignee:assignee_id(id, name),
          internal_owner:internal_owner_id(id, name)
        `).order('created_at', { ascending: false }),
        supabase.from('rfis').select(`
          *, 
          project:project_id(id, name, project_number, color)
        `).order('created_at', { ascending: false }),
        supabase.from('submittals').select(`
          *, 
          project:project_id(id, name, project_number, color)
        `).order('created_at', { ascending: false })
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (rfisRes.error) throw rfisRes.error;
      if (submittalsRes.error) throw submittalsRes.error;

      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ==========================================================================
  // COMPUTED: MY ITEMS (assigned to me or I'm internal owner)
  // ==========================================================================
  const myItems = useMemo(() => {
    const items = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // My Tasks
    tasks.forEach(task => {
      const isMyTask = task.assignee_id === user?.id || task.internal_owner_id === user?.id;
      const isActive = !['Completed', 'Cancelled'].includes(task.status);
      
      if (isMyTask && isActive && task.due_date) {
        items.push({
          id: task.id,
          type: 'task',
          title: task.title,
          identifier: task.title,
          dueDate: task.due_date,
          status: task.status,
          priority: task.priority,
          project: task.project,
          raw: task
        });
      }
    });

    // My RFIs
    rfis.forEach(rfi => {
      const isMyRFI = rfi.internal_owner_id === user?.id;
      const isActive = !['Closed', 'Answered'].includes(rfi.status);
      
      if (isMyRFI && isActive && rfi.due_date) {
        items.push({
          id: rfi.id,
          type: 'rfi',
          title: rfi.subject,
          identifier: rfi.rfi_number,
          dueDate: rfi.due_date,
          status: rfi.status,
          priority: rfi.priority,
          project: rfi.project,
          raw: rfi
        });
      }
    });

    // My Submittals
    submittals.forEach(sub => {
      const isMySub = sub.internal_owner_id === user?.id;
      const isActive = !['Approved', 'Approved as Noted', 'Rejected'].includes(sub.status);
      
      if (isMySub && isActive && sub.due_date) {
        items.push({
          id: sub.id,
          type: 'submittal',
          title: sub.title,
          identifier: sub.submittal_number,
          dueDate: sub.due_date,
          status: sub.status,
          priority: sub.priority,
          project: sub.project,
          raw: sub
        });
      }
    });

    return items;
  }, [tasks, rfis, submittals, user]);

  // Overdue items (past due)
  const overdueItems = useMemo(() => {
    return myItems
      .filter(item => getDaysUntilDue(item.dueDate) < 0)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [myItems]);

  // Needs Attention (due within 48 hours, not overdue)
  const needsAttentionItems = useMemo(() => {
    return myItems
      .filter(item => {
        const days = getDaysUntilDue(item.dueDate);
        return days >= 0 && days <= 2;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [myItems]);

  // ==========================================================================
  // COMPUTED: PROJECT STATS
  // ==========================================================================
  const projectStats = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const projectRFIs = rfis.filter(r => r.project_id === project.id);
      const projectSubs = submittals.filter(s => s.project_id === project.id);

      return {
        ...project,
        taskCount: projectTasks.length,
        taskCompleted: projectTasks.filter(t => t.status === 'Completed').length,
        openRFIs: projectRFIs.filter(r => !['Closed', 'Answered'].includes(r.status)).length,
        pendingSubs: projectSubs.filter(s => !['Approved', 'Approved as Noted', 'Rejected'].includes(s.status)).length
      };
    });
  }, [projects, tasks, rfis, submittals]);

  // Active projects only
  const activeProjects = useMemo(() => {
    return projectStats.filter(p => !['Completed', 'Cancelled', 'On Hold'].includes(p.status));
  }, [projectStats]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleProjectClick = useCallback((project) => {
    setSelectedProject(project);
    setSelectedProjectTab(null);
  }, []);

  const handleItemClick = useCallback((item) => {
    if (item.project) {
      setSelectedProject(item.project);
      if (item.type === 'task') setSelectedProjectTab('Tasks');
      else if (item.type === 'rfi') setSelectedProjectTab('RFIs');
      else if (item.type === 'submittal') setSelectedProjectTab('Submittals');
    }
  }, []);

  const handleBackFromProject = useCallback(() => {
    setSelectedProject(null);
    setSelectedProjectTab(null);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleProjectCreated = useCallback((newProject) => {
    setShowCreateProject(false);
    showToast('Project created successfully');
    fetchDashboardData();
  }, [fetchDashboardData, showToast]);

  // ==========================================================================
  // RENDER: Project Details View
  // ==========================================================================
  if (selectedProject) {
    return (
      <ProjectDetails
        project={selectedProject}
        onBack={handleBackFromProject}
        onUpdate={(updated) => {
          setSelectedProject(updated);
          showToast('Project updated');
        }}
        initialTab={selectedProjectTab}
      />
    );
  }

  // ==========================================================================
  // RENDER: Loading
  // ==========================================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="loading-spinner" />
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Loading dashboard...</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: Error
  // ==========================================================================
  if (error && projects.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: 'var(--space-md)' }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>Failed to load dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>{error}</p>
        <button onClick={fetchDashboardData} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
          padding: 'var(--space-sm) var(--space-lg)',
          background: 'var(--sunbelt-orange)', color: 'white',
          border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600'
        }}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: Main Dashboard
  // ==========================================================================
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''} • {overdueItems.length + needsAttentionItems.length} item{overdueItems.length + needsAttentionItems.length !== 1 ? 's' : ''} need{overdueItems.length + needsAttentionItems.length === 1 ? 's' : ''} attention
          </p>
        </div>

        {/* New Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNewDropdown(!showNewDropdown)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-lg)',
              background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
              color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
              fontWeight: '600', cursor: 'pointer', fontSize: '0.9375rem'
            }}
          >
            <Plus size={18} /> New <ChevronDown size={16} />
          </button>
          
          {showNewDropdown && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                onClick={() => setShowNewDropdown(false)} 
              />
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                minWidth: '160px', zIndex: 100, overflow: 'hidden'
              }}>
                <button
                  onClick={() => { setShowCreateProject(true); setShowNewDropdown(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                    width: '100%', padding: 'var(--space-md)', border: 'none',
                    background: 'transparent', color: 'var(--text-primary)',
                    cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <FolderKanban size={16} /> New Project
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* OVERDUE & NEEDS ATTENTION                                         */}
      {/* ================================================================== */}
      {(overdueItems.length > 0 || needsAttentionItems.length > 0) && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: overdueItems.length > 0 && needsAttentionItems.length > 0 ? '1fr 1fr' : '1fr',
          gap: 'var(--space-lg)', 
          marginBottom: 'var(--space-xl)' 
        }}>
          {/* Overdue Section */}
          {overdueItems.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-lg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--danger)' }}>
                  Overdue ({overdueItems.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {overdueItems.slice(0, 5).map(item => (
                  <AttentionItem key={`${item.type}-${item.id}`} item={item} onClick={handleItemClick} isOverdue />
                ))}
                {overdueItems.length > 5 && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', margin: 'var(--space-sm) 0 0 0' }}>
                    +{overdueItems.length - 5} more overdue items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Needs Attention Section */}
          {needsAttentionItems.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-lg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <Clock size={20} style={{ color: 'var(--warning)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--warning)' }}>
                  Due Soon ({needsAttentionItems.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {needsAttentionItems.slice(0, 5).map(item => (
                  <AttentionItem key={`${item.type}-${item.id}`} item={item} onClick={handleItemClick} />
                ))}
                {needsAttentionItems.length > 5 && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--warning)', margin: 'var(--space-sm) 0 0 0' }}>
                    +{needsAttentionItems.length - 5} more items due soon
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* ACTIVE PROJECTS TABLE                                             */}
      {/* ================================================================== */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Active Projects
          </h2>
          {projects.length > activeProjects.length && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              {projects.length - activeProjects.length} completed/on hold
            </span>
          )}
        </div>

        {activeProjects.length === 0 ? (
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)', padding: 'var(--space-2xl)',
            textAlign: 'center'
          }}>
            <FolderKanban size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>No active projects</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>Create your first project to get started</p>
            <button
              onClick={() => setShowCreateProject(true)}
              style={{
                padding: 'var(--space-sm) var(--space-lg)',
                background: 'var(--sunbelt-orange)', color: 'white',
                border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600'
              }}
            >
              <Plus size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Create Project
            </button>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)', overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '120px' }}>Status</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Tasks</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '80px' }}>RFIs</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Submittals</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '120px' }}>Value</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Due</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.map((project, index) => (
                  <tr
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    style={{
                      borderTop: index > 0 ? '1px solid var(--border-color)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: 'var(--space-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <div style={{
                          width: '10px', height: '10px', borderRadius: '3px',
                          background: project.color || 'var(--sunbelt-orange)'
                        }} />
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{project.name}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{project.project_number}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px',
                        fontSize: '0.75rem', fontWeight: '600',
                        background: `${getProjectStatusColor(project.status)}20`,
                        color: getProjectStatusColor(project.status)
                      }}>
                        {project.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                        {project.taskCompleted}/{project.taskCount}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                      <span style={{
                        color: project.openRFIs > 0 ? 'var(--sunbelt-orange)' : 'var(--text-tertiary)',
                        fontWeight: project.openRFIs > 0 ? '600' : '400'
                      }}>
                        {project.openRFIs > 0 ? `${project.openRFIs} open` : '—'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                      <span style={{
                        color: project.pendingSubs > 0 ? 'var(--warning)' : 'var(--text-tertiary)',
                        fontWeight: project.pendingSubs > 0 ? '600' : '400'
                      }}>
                        {project.pendingSubs > 0 ? `${project.pendingSubs} pending` : '—'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {formatCurrency(project.contract_value)}
                    </td>
                    <td style={{ padding: 'var(--space-md)', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {formatDate(project.target_online_date)}
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* MODALS                                                            */}
      {/* ================================================================== */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={handleProjectCreated}
      />

      {/* ================================================================== */}
      {/* TOAST                                                             */}
      {/* ================================================================== */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 20px', color: 'white',
          borderRadius: 'var(--radius-md)',
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', zIndex: 10000
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckSquare size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ATTENTION ITEM COMPONENT
// ============================================================================
function AttentionItem({ item, onClick, isOverdue = false }) {
  const Icon = getItemTypeIcon(item.type);
  const daysUntil = getDaysUntilDue(item.dueDate);
  
  return (
    <div
      onClick={() => onClick(item)}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        padding: 'var(--space-sm) var(--space-md)',
        background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
        cursor: 'pointer', transition: 'transform 0.15s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
    >
      <Icon size={16} style={{ color: getItemTypeColor(item.type), flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {item.identifier !== item.title ? `${item.identifier}: ` : ''}{item.title}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {item.project?.project_number || item.project?.name}
        </div>
      </div>
      <div style={{
        fontSize: '0.75rem', fontWeight: '600',
        color: isOverdue ? 'var(--danger)' : 'var(--warning)',
        whiteSpace: 'nowrap'
      }}>
        {isOverdue ? `${Math.abs(daysUntil)}d overdue` : formatDate(item.dueDate)}
      </div>
      <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
    </div>
  );
}

export default PMDashboard;