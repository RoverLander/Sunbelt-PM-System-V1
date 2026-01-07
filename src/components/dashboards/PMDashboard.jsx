import React, { useState, useEffect } from 'react';
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
  LayoutGrid
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import CreateProjectModal from '../projects/CreateProjectModal';
import CalendarWeekView from '../calendar/CalendarWeekView';
import KanbanBoard from '../projects/KanbanBoard';
import { buildCalendarItems, getProjectColor } from '../../utils/calendarUtils';

// ============================================================================
// PM DASHBOARD COMPONENT
// Main dashboard showing projects, tasks, RFIs, submittals overview
// Layout: Stats → Quick Actions → Calendar → Kanban Board → Projects/Overdue
// ============================================================================

function PMDashboard() {
  const { user } = useAuth();
  
  // =========================================================================
  // STATE - DATA
  // =========================================================================
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  
  // =========================================================================
  // STATE - UI
  // =========================================================================
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [toast, setToast] = useState(null);

  // =========================================================================
  // EFFECTS
  // =========================================================================
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // =========================================================================
  // DATA FETCHING
  // =========================================================================
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      // Fetch all tasks with project info
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(id, name, project_number, color),
          assignee:assignee_id(name),
          internal_owner:internal_owner_id(name)
        `)
        .order('created_at', { ascending: false });

      // Fetch all RFIs with project info
      const { data: rfisData } = await supabase
        .from('rfis')
        .select(`
          *,
          project:project_id(id, name, project_number, color)
        `)
        .order('created_at', { ascending: false });

      // Fetch all submittals with project info
      const { data: submittalsData } = await supabase
        .from('submittals')
        .select(`
          *,
          project:project_id(id, name, project_number, color)
        `)
        .order('created_at', { ascending: false });

      // Fetch all milestones with project info
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select(`
          *,
          project:project_id(id, name, project_number, color)
        `)
        .order('due_date', { ascending: true });

      // Assign colors to projects that don't have one
      const projectsWithColors = (projectsData || []).map((project, index) => ({
        ...project,
        color: project.color || getProjectColor(project, index)
      }));

      setProjects(projectsWithColors);
      setTasks(tasksData || []);
      setRFIs(rfisData || []);
      setSubmittals(submittalsData || []);
      setMilestones(milestonesData || []);

      // Build calendar items
      const items = buildCalendarItems(
        projectsWithColors,
        tasksData,
        rfisData,
        submittalsData,
        milestonesData
      );
      setCalendarItems(items);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // =========================================================================
  // COMPUTED STATS
  // =========================================================================
  const today = new Date().toISOString().split('T')[0];
  
  const activeProjects = projects.filter(p => 
    !['Completed', 'Cancelled', 'On Hold', 'Warranty'].includes(p.status)
  ).length;

  const myTasks = tasks.filter(t => 
    (t.assignee_id === user?.id || t.internal_owner_id === user?.id) &&
    !['Completed', 'Cancelled'].includes(t.status)
  );

  const overdueTasks = myTasks.filter(t => t.due_date && t.due_date < today);

  const openRFIs = rfis.filter(r => r.status === 'Open');
  const pendingSubmittals = submittals.filter(s => 
    ['Pending', 'Submitted', 'Under Review'].includes(s.status)
  );

  const totalContractValue = projects
    .filter(p => !['Cancelled'].includes(p.status))
    .reduce((sum, p) => sum + (p.contract_value || 0), 0);

  // Get active tasks (not cancelled) for kanban board
  const activeTasks = tasks.filter(t => t.status !== 'Cancelled');

  // =========================================================================
  // FORMAT HELPERS
  // =========================================================================
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getProjectStatusColor = (status) => {
    const colors = {
      'Planning': 'var(--info)',
      'Pre-PM': 'var(--warning)',
      'In Progress': 'var(--sunbelt-orange)',
      'On Hold': 'var(--text-tertiary)',
      'Completed': 'var(--success)',
      'Cancelled': 'var(--danger)',
      'Warranty': 'var(--info)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================
  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleProjectUpdate = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
    showToast('Project updated successfully');
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
    setShowCreateProject(false);
    showToast('Project created successfully');
    fetchDashboardData();
  };

  const handleCalendarItemClick = (item) => {
    const project = projects.find(p => p.id === item.projectId);
    if (project) {
      setSelectedProject(project);
    }
  };

  const handleCalendarViewChange = (view) => {
    console.log('View change requested:', view);
  };

  // =========================================================================
  // KANBAN HANDLERS
  // =========================================================================
  const handleTaskStatusChange = async (taskId, newStatus) => {
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
      
      showToast(`Task moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Failed to update task status', 'error');
    }
  };

  const handleKanbanTaskClick = (task) => {
    const project = projects.find(p => p.id === task.project_id);
    if (project) {
      setSelectedProject(project);
    }
  };

  // =========================================================================
  // RENDER - PROJECT DETAILS VIEW
  // =========================================================================
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

  // =========================================================================
  // RENDER - LOADING STATE
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
          Loading dashboard...
        </p>
      </div>
    );
  }

  // =========================================================================
  // RENDER - MAIN DASHBOARD
  // =========================================================================
  return (
    <div>
      {/* ================================================================== */}
      {/* 1. WELCOME HEADER                                                  */}
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Here's what's happening with your projects today
        </p>
      </div>

      {/* ================================================================== */}
      {/* 2. QUICK STATS                                                     */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
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
            <FolderKanban size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Active Projects</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {activeProjects}
          </div>
        </div>

        {/* My Tasks */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <CheckSquare size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>My Tasks</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {myTasks.length}
          </div>
        </div>

        {/* Overdue */}
        <div style={{
          background: overdueTasks.length > 0 ? 'var(--danger-light)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: `1px solid ${overdueTasks.length > 0 ? 'var(--danger)' : 'var(--border-color)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <AlertTriangle size={20} style={{ color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>Overdue</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {overdueTasks.length}
          </div>
        </div>

        {/* Open RFIs */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <MessageSquare size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Open RFIs</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {openRFIs.length}
          </div>
        </div>

        {/* Pending Submittals */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <ClipboardList size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Pending Submittals</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {pendingSubmittals.length}
          </div>
        </div>

        {/* Portfolio Value */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <DollarSign size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Portfolio Value</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {formatCurrency(totalContractValue)}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. QUICK ACTIONS (Back to original position)                       */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button
            onClick={() => setShowCreateProject(true)}
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
              transition: 'all 0.15s'
            }}
          >
            <Plus size={18} />
            New Project
          </button>
          <button
            disabled
            style={{
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
            }}
            title="Select a project first"
          >
            <MessageSquare size={18} />
            New RFI
          </button>
          <button
            disabled
            style={{
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
            }}
            title="Select a project first"
          >
            <ClipboardList size={18} />
            New Submittal
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 4. CALENDAR WEEK VIEW                                              */}
      {/* ================================================================== */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <CalendarWeekView
          items={calendarItems}
          projects={projects}
          onItemClick={handleCalendarItemClick}
          onViewChange={handleCalendarViewChange}
          compact={false}
        />
      </div>

      {/* ================================================================== */}
      {/* 5. KANBAN BOARD - ALL TASKS ACROSS PROJECTS                       */}
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
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 'var(--space-lg)' 
        }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <LayoutGrid size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            All Tasks Board
          </h3>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {activeTasks.length} tasks across {projects.length} projects
          </span>
        </div>
        
        {activeTasks.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--space-2xl)', 
            color: 'var(--text-tertiary)' 
          }}>
            <CheckSquare size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
              No tasks yet
            </h4>
            <p>Create a project and add tasks to see them here</p>
          </div>
        ) : (
          <KanbanBoard
            tasks={activeTasks}
            onStatusChange={handleTaskStatusChange}
            onTaskClick={handleKanbanTaskClick}
            showProject={true}
          />
        )}
      </div>

      {/* ================================================================== */}
      {/* 6. MAIN CONTENT GRID - Projects & Overdue                         */}
      {/* ================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        {/* My Projects */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              My Projects
            </h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {projects.length} total
            </span>
          </div>

          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-tertiary)' }}>
              <FolderKanban size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>No projects yet</h4>
              <p>Create your first project to get started</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {projects.slice(0, 5).map(project => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${project.color || 'var(--sunbelt-orange)'}`,
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{project.name}</span>
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
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
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

        {/* Overdue Items */}
        <div style={{
          background: overdueTasks.length > 0 ? 'var(--danger-light)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: `1px solid ${overdueTasks.length > 0 ? 'var(--danger)' : 'var(--border-color)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
            <AlertTriangle size={20} style={{ color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--sunbelt-orange)' }} />
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
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)' }}>
              <CheckSquare size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>All caught up!</h4>
              <p>No overdue items</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {overdueTasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  onClick={() => handleKanbanTaskClick(task)}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--danger)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {task.project?.name} • Due {formatDate(task.due_date)}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: '600' }}>
                    {Math.floor((new Date() - new Date(task.due_date)) / 86400000)}d overdue
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* MODALS                                                             */}
      {/* ================================================================== */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={handleProjectCreated}
      />

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

export default PMDashboard;