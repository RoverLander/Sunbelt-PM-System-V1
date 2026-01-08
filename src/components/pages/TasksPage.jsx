// ============================================================================
// TasksPage Component
// ============================================================================
// Standalone page showing all tasks for the current user's projects.
// For Directors: Shows all tasks across all projects
// For PMs: Shows tasks from their assigned projects
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Filter,
  Search,
  Clock,
  AlertCircle,
  ChevronRight,
  Calendar,
  User,
  FolderKanban
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function TasksPage({ isDirectorView = false }) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('open');
  const [filterProject, setFilterProject] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    if (user) fetchData();
  }, [user, isDirectorView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setCurrentUser(userData);

      // Get projects based on view type
      let projectsQuery = supabase.from('projects').select('id, project_number, name, color');
      
      if (!isDirectorView && userData) {
        // Include projects where user is: PM, Secondary PM, or Creator
        projectsQuery = projectsQuery.or(`pm_id.eq.${userData.id},secondary_pm_id.eq.${userData.id},created_by.eq.${userData.id}`);
      }

      const { data: projectsData } = await projectsQuery;
      setProjects(projectsData || []);

      const projectIds = (projectsData || []).map(p => p.id);

      // Get tasks
      if (projectIds.length > 0) {
        const { data: tasksData } = await supabase
          .from('tasks')
          .select(`
            *,
            project:project_id(id, project_number, name, color),
            assignee:assignee_id(name),
            internal_owner:internal_owner_id(name)
          `)
          .in('project_id', projectIds)
          .order('due_date', { ascending: true });

        setTasks(tasksData || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FILTER TASKS
  // ==========================================================================
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filterStatus === 'open' && ['Completed', 'Cancelled'].includes(task.status)) return false;
    if (filterStatus === 'completed' && task.status !== 'Completed') return false;
    if (filterStatus === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      if (!task.due_date || task.due_date >= today || ['Completed', 'Cancelled'].includes(task.status)) return false;
    }

    // Project filter
    if (filterProject !== 'all' && task.project_id !== filterProject) return false;

    // Priority filter
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!task.title?.toLowerCase().includes(term) && 
          !task.project?.project_number?.toLowerCase().includes(term)) return false;
    }

    return true;
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateString, status) => {
    if (!dateString || ['Completed', 'Cancelled'].includes(status)) return false;
    return dateString < new Date().toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'var(--text-tertiary)',
      'In Progress': 'var(--info)',
      'Blocked': 'var(--danger)',
      'Completed': 'var(--success)',
      'Cancelled': 'var(--text-tertiary)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': '#ef4444',
      'Medium': '#f59e0b',
      'Low': '#22c55e'
    };
    return colors[priority] || 'var(--text-secondary)';
  };

  const stats = {
    total: tasks.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length,
    overdue: tasks.filter(t => isOverdue(t.due_date, t.status)).length,
    dueThisWeek: tasks.filter(t => {
      if (!t.due_date || ['Completed', 'Cancelled'].includes(t.status)) return false;
      const due = new Date(t.due_date);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return due >= today && due <= weekFromNow;
    }).length
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckSquare size={28} style={{ color: 'var(--sunbelt-orange)' }} />
          {isDirectorView ? 'All Tasks' : 'My Tasks'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {isDirectorView ? 'Tasks across all projects' : 'Tasks from your assigned projects'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: 'var(--space-lg)' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Open Tasks</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.total}</div>
        </div>
        <div style={{ background: stats.overdue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: stats.overdue > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-secondary)', marginBottom: '4px' }}>Overdue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{stats.overdue}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Due This Week</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.dueThisWeek}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: 'var(--space-md)',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
        >
          <option value="open">Open Tasks</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
          <option value="all">All Tasks</option>
        </select>

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.project_number}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
        >
          <option value="all">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckSquare size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No tasks match your filters</p>
          </div>
        ) : (
          <div>
            {filteredTasks.map((task, idx) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderBottom: idx < filteredTasks.length - 1 ? '1px solid var(--border-color)' : 'none',
                  gap: '16px'
                }}
              >
                {/* Status indicator */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getStatusColor(task.status),
                  flexShrink: 0
                }} />

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: '2px' }}>
                    {task.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FolderKanban size={12} />
                      {task.project?.project_number}
                    </span>
                    {(task.assignee?.name || task.external_assignee_name) && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        {task.assignee?.name || task.external_assignee_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  background: `${getPriorityColor(task.priority)}20`,
                  color: getPriorityColor(task.priority)
                }}>
                  {task.priority}
                </span>

                {/* Status */}
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  background: 'var(--bg-tertiary)',
                  color: getStatusColor(task.status),
                  minWidth: '80px',
                  textAlign: 'center'
                }}>
                  {task.status}
                </span>

                {/* Due date */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8125rem',
                  color: isOverdue(task.due_date, task.status) ? 'var(--danger)' : 'var(--text-secondary)',
                  fontWeight: isOverdue(task.due_date, task.status) ? '600' : '400',
                  minWidth: '70px'
                }}>
                  <Calendar size={14} />
                  {formatDate(task.due_date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TasksPage;