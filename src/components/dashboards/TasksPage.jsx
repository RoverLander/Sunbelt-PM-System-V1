// ============================================================================
// TASKS PAGE COMPONENT
// Landing page showing all tasks across all projects
// Features: Kanban/List toggle, filters, Add Task with project selection
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  List,
  LayoutGrid,
  Calendar,
  User,
  ChevronRight,
  ExternalLink,
  FolderKanban,
  X,
  AlertCircle,
  Search
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import KanbanBoard from '../projects/KanbanBoard';
import AddTaskModal from '../projects/AddTaskModal';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function TasksPage({ onNavigateToProject }) {
  const { user } = useAuth();

  // =========================================================================
  // STATE - DATA
  // =========================================================================
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // STATE - UI
  // =========================================================================
  const [viewMode, setViewMode] = useState('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // =========================================================================
  // STATE - MODALS
  // =========================================================================
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedProjectForTask, setSelectedProjectForTask] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // =========================================================================
  // EFFECTS
  // =========================================================================
  useEffect(() => {
    fetchData();
  }, []);

  // =========================================================================
  // DATA FETCHING
  // =========================================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all tasks with project and assignee info
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(id, name, project_number, color),
          assignee:assignee_id(id, name),
          internal_owner:internal_owner_id(id, name)
        `)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch all active projects for filters and add task modal
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .not('status', 'in', '("Cancelled")')
        .order('name');

      if (projectsError) throw projectsError;

      // Fetch all active users for filters
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (usersError) throw usersError;

      setTasks(tasksData || []);
      setProjects(projectsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToastMessage('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  const showToastMessage = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // =========================================================================
  // FILTER TASKS
  // =========================================================================
  const filteredTasks = tasks.filter(task => {
    // Exclude cancelled tasks
    if (task.status === 'Cancelled') return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = task.title?.toLowerCase().includes(query);
      const matchesProject = task.project?.name?.toLowerCase().includes(query);
      const matchesProjectNumber = task.project?.project_number?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesProject && !matchesProjectNumber) return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    
    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    
    // Project filter
    if (projectFilter !== 'all' && task.project_id !== projectFilter) return false;
    
    // Assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'me') {
        if (task.assignee_id !== user?.id && task.internal_owner_id !== user?.id) return false;
      } else if (assigneeFilter === 'unassigned') {
        if (task.assignee_id || task.external_assignee_name) return false;
      } else {
        if (task.assignee_id !== assigneeFilter && task.internal_owner_id !== assigneeFilter) return false;
      }
    }
    
    return true;
  });

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      showToastMessage(`Task moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      showToastMessage('Failed to update task status', 'error');
    }
  };

  const handleTaskClick = (task) => {
    // Navigate to the project's Tasks tab
    if (task.project_id && onNavigateToProject) {
      onNavigateToProject(task.project_id, 'Tasks');
    }
  };

  const handleAddTaskClick = () => {
    setShowProjectSelector(true);
  };

  const handleProjectSelect = (project) => {
    setSelectedProjectForTask(project);
    setShowProjectSelector(false);
    setShowAddTaskModal(true);
  };

  const handleTaskCreated = () => {
    fetchData();
    setShowAddTaskModal(false);
    setSelectedProjectForTask(null);
    showToastMessage('Task created successfully');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    setAssigneeFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || 
                           projectFilter !== 'all' || assigneeFilter !== 'all';

  // =========================================================================
  // FORMAT HELPERS
  // =========================================================================
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'var(--text-muted)',
      'In Progress': 'var(--sunbelt-orange)',
      'On Hold': '#f59e0b',
      'Completed': 'var(--success)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': '#8b0000',
      'High': '#ef4444',
      'Medium': '#f59e0b',
      'Low': '#22c55e'
    };
    return colors[priority] || 'var(--text-secondary)';
  };

  // =========================================================================
  // LOADING STATE
  // =========================================================================
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
          Loading tasks...
        </p>
      </div>
    );
  }

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div>
      {/* ================================================================== */}
      {/* PAGE HEADER                                                        */}
      {/* ================================================================== */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <CheckSquare size={32} style={{ color: 'var(--sunbelt-orange)' }} />
              Tasks
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Manage all tasks across your projects
            </p>
          </div>
          <button
            onClick={handleAddTaskClick}
            style={{
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
              fontSize: '0.9375rem'
            }}
          >
            <Plus size={20} />
            Add Task
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* STATS BAR                                                          */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)'
      }}>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Tasks</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {tasks.filter(t => t.status !== 'Cancelled').length}
          </div>
        </div>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>In Progress</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--sunbelt-orange)' }}>
            {tasks.filter(t => t.status === 'In Progress').length}
          </div>
        </div>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Completed</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
            {tasks.filter(t => t.status === 'Completed').length}
          </div>
        </div>
        <div style={{
          background: tasks.filter(t => t.due_date && t.due_date < new Date().toISOString().split('T')[0] && t.status !== 'Completed').length > 0 
            ? 'var(--danger-light)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: tasks.filter(t => t.due_date && t.due_date < new Date().toISOString().split('T')[0] && t.status !== 'Completed').length > 0
            ? '1px solid var(--danger)' : '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Overdue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)' }}>
            {tasks.filter(t => t.due_date && t.due_date < new Date().toISOString().split('T')[0] && t.status !== 'Completed').length}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* FILTERS & VIEW TOGGLE                                              */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}>
          {/* Search & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  width: '200px'
                }}
              />
            </div>

            <Filter size={16} color="var(--text-secondary)" />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              <option value="all">All Status</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
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
              <option value="all">All Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                maxWidth: '180px'
              }}
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_number} - {p.name}</option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
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
              <option value="all">All Assignees</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: viewMode === 'list' ? 'var(--sunbelt-orange)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                transition: 'all 0.15s'
              }}
            >
              <List size={18} />
              List
            </button>
            <button
              onClick={() => setViewMode('board')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: viewMode === 'board' ? 'var(--sunbelt-orange)' : 'transparent',
                color: viewMode === 'board' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                transition: 'all 0.15s'
              }}
            >
              <LayoutGrid size={18} />
              Board
            </button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div style={{
            marginTop: 'var(--space-md)',
            paddingTop: 'var(--space-md)',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            Showing {filteredTasks.length} of {tasks.filter(t => t.status !== 'Cancelled').length} tasks
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* TASKS CONTENT                                                      */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        border: '1px solid var(--border-color)',
        minHeight: '500px'
      }}>
        {filteredTasks.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '400px',
            color: 'var(--text-tertiary)'
          }}>
            <CheckSquare size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
              {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
            </h4>
            <p>{hasActiveFilters ? 'Try adjusting your filters' : 'Create your first task to get started'}</p>
          </div>
        ) : viewMode === 'board' ? (
          /* KANBAN BOARD VIEW */
          <KanbanBoard
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onTaskClick={handleTaskClick}
            showProject={true}
          />
        ) : (
          /* LIST VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {filteredTasks.map(task => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';

              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${task.project?.color || 'var(--sunbelt-orange)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {/* Project Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px'
                    }}>
                      <FolderKanban size={12} color={task.project?.color || 'var(--sunbelt-orange)'} />
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        fontWeight: '500'
                      }}>
                        {task.project?.project_number} - {task.project?.name}
                      </span>
                    </div>

                    {/* Title & Badges */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      marginBottom: '4px',
                      flexWrap: 'wrap'
                    }}>
                      {(task.external_assignee_email || task.external_assignee_name) && (
                        <ExternalLink size={14} color="var(--sunbelt-orange)" title="External Task" />
                      )}
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {task.title}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        background: `${getStatusColor(task.status)}20`,
                        color: getStatusColor(task.status)
                      }}>
                        {task.status}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        background: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority)
                      }}>
                        {task.priority}
                      </span>
                      {isOverdue && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          background: 'var(--danger-light)',
                          color: 'var(--danger)'
                        }}>
                          Overdue
                        </span>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)'
                    }}>
                      {(task.assignee?.name || task.external_assignee_name) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          {task.assignee?.name || task.external_assignee_name}
                        </span>
                      )}
                      {task.due_date && (
                        <>
                          <span>•</span>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)'
                          }}>
                            <Calendar size={12} />
                            Due: {formatDate(task.due_date)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* PROJECT SELECTOR MODAL                                             */}
      {/* ================================================================== */}
      {showProjectSelector && (
        <div style={{
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
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: 'var(--space-xl)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Select Project
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Choose a project to add the task to
                </p>
              </div>
              <button
                onClick={() => setShowProjectSelector(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  borderRadius: '6px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Project List */}
            <div style={{ padding: 'var(--space-lg)' }}>
              {projects.filter(p => !['Completed', 'Cancelled'].includes(p.status)).length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)' }}>
                  <FolderKanban size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
                  <p>No active projects found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {projects
                    .filter(p => !['Completed', 'Cancelled'].includes(p.status))
                    .map(project => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSelect(project)}
                        style={{
                          padding: 'var(--space-md) var(--space-lg)',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderLeft: `4px solid ${project.color || 'var(--sunbelt-orange)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
                          e.currentTarget.style.background = 'var(--bg-tertiary)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {project.name}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {project.project_number} • {project.status}
                          </div>
                        </div>
                        <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* ADD TASK MODAL                                                     */}
      {/* ================================================================== */}
      {showAddTaskModal && selectedProjectForTask && (
        <AddTaskModal
          isOpen={showAddTaskModal}
          onClose={() => {
            setShowAddTaskModal(false);
            setSelectedProjectForTask(null);
          }}
          projectId={selectedProjectForTask.id}
          projectName={selectedProjectForTask.name}
          projectNumber={selectedProjectForTask.project_number}
          onSuccess={handleTaskCreated}
        />
      )}

      {/* ================================================================== */}
      {/* TOAST NOTIFICATION                                                 */}
      {/* ================================================================== */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <CheckSquare size={18} style={{ color: 'var(--success)' }} />}
          {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--danger)' }} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default TasksPage;