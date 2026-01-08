// ============================================================================
// PMDashboard Component - With Gantt Timeline
// ============================================================================
// Project Manager dashboard showing:
// - Stats cards
// - Project timeline (Gantt)
// - My Projects list (primary + secondary)
// - Week calendar preview
//
// Only shows projects where user is PM or Secondary PM
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  Plus,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Shield,
  Layers,
  ChevronDown,
  Target
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import CreateProjectModal from '../projects/CreateProjectModal';
import CalendarWeekView from '../calendar/CalendarWeekView';
import GanttTimeline from './GanttTimeline';
import { buildCalendarItems, getProjectColor } from '../../utils/calendarUtils';

// ============================================================================
// HELPER - Calculate project health for Gantt
// ============================================================================
const calculateProjectHealth = (project, tasks, rfis, submittals) => {
  const today = new Date().toISOString().split('T')[0];
  
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

  // Calculate days to delivery
  let deliveryDays = null;
  if (project.delivery_date) {
    const delivery = new Date(project.delivery_date);
    const now = new Date();
    deliveryDays = Math.ceil((delivery - now) / (1000 * 60 * 60 * 24));
  }

  // Determine health status
  let healthStatus = 'on-track';
  if (totalOverdue >= 3 || (deliveryDays !== null && deliveryDays <= 3)) {
    healthStatus = 'critical';
  } else if (totalOverdue > 0 || (deliveryDays !== null && deliveryDays <= 7)) {
    healthStatus = 'at-risk';
  }

  return {
    ...project,
    healthStatus,
    totalOverdue,
    overdueTasks,
    overdueRFIs,
    overdueSubmittals,
    deliveryDays
  };
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
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [secondaryProjects, setSecondaryProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showSecondaryProjects, setShowSecondaryProjects] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    if (user) {
      fetchCurrentUser();
    }
  }, [user]);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch primary projects
      const { data: primaryProjectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('pm_id', currentUser.id)
        .order('updated_at', { ascending: false });

      // Fetch secondary projects
      const { data: secondaryProjectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('secondary_pm_id', currentUser.id)
        .neq('pm_id', currentUser.id)
        .order('updated_at', { ascending: false });

      const primaryProjects = primaryProjectsData || [];
      const secondaryData = secondaryProjectsData || [];

      const allProjectIds = [
        ...primaryProjects.map(p => p.id),
        ...secondaryData.map(p => p.id)
      ];

      // Fetch related data
      let tasksData = [], rfisData = [], submittalsData = [], milestonesData = [];

      if (allProjectIds.length > 0) {
        const [tasksRes, rfisRes, submittalsRes, milestonesRes] = await Promise.all([
          supabase.from('tasks').select('*, project:project_id(id, name, project_number, color), assignee:assignee_id(name), internal_owner:internal_owner_id(name)').in('project_id', allProjectIds),
          supabase.from('rfis').select('*, project:project_id(id, name, project_number, color)').in('project_id', allProjectIds),
          supabase.from('submittals').select('*, project:project_id(id, name, project_number, color)').in('project_id', allProjectIds),
          supabase.from('milestones').select('*, project:project_id(id, name, project_number, color)').in('project_id', allProjectIds)
        ]);

        tasksData = tasksRes.data || [];
        rfisData = rfisRes.data || [];
        submittalsData = submittalsRes.data || [];
        milestonesData = milestonesRes.data || [];
      }

      // Add colors and isPrimary flag
      const primaryWithColors = primaryProjects.map((project, index) => ({
        ...project,
        color: project.color || getProjectColor(project, index),
        isPrimary: true
      }));

      const secondaryWithColors = secondaryData.map((project, index) => ({
        ...project,
        color: project.color || getProjectColor(project, index + primaryProjects.length),
        isPrimary: false
      }));

      setProjects(primaryWithColors);
      setSecondaryProjects(secondaryWithColors);
      setTasks(tasksData);
      setRFIs(rfisData);
      setSubmittals(submittalsData);
      setMilestones(milestonesData);

      // Build calendar items
      const items = buildCalendarItems(
        primaryWithColors,
        tasksData.filter(t => primaryWithColors.some(p => p.id === t.project_id)),
        rfisData.filter(r => primaryWithColors.some(p => p.id === r.project_id)),
        submittalsData.filter(s => primaryWithColors.some(p => p.id === s.project_id)),
        milestonesData.filter(m => primaryWithColors.some(p => p.id === m.project_id))
      );
      setCalendarItems(items);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // PROJECTS WITH HEALTH (for Gantt)
  // ==========================================================================
  const projectsWithHealth = useMemo(() => {
    const allProjects = [...projects, ...secondaryProjects];
    return allProjects
      .filter(p => ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'].includes(p.status))
      .map(project => calculateProjectHealth(project, tasks, rfis, submittals));
  }, [projects, secondaryProjects, tasks, rfis, submittals]);

  // ==========================================================================
  // STATS
  // ==========================================================================
  const today = new Date().toISOString().split('T')[0];
  
  const activeProjects = projects.filter(p => 
    !['Completed', 'Cancelled', 'On Hold', 'Warranty'].includes(p.status)
  ).length;

  const primaryProjectIds = projects.map(p => p.id);
  
  const myTasks = tasks.filter(t => 
    primaryProjectIds.includes(t.project_id) &&
    (t.assignee_id === user?.id || t.internal_owner_id === user?.id) &&
    !['Completed', 'Cancelled'].includes(t.status)
  );

  const overdueTasks = myTasks.filter(t => t.due_date && t.due_date < today);

  const openRFIs = rfis.filter(r => 
    primaryProjectIds.includes(r.project_id) &&
    r.status === 'Open'
  );
  
  const pendingSubmittals = submittals.filter(s => 
    primaryProjectIds.includes(s.project_id) &&
    ['Pending', 'Submitted', 'Under Review'].includes(s.status)
  );

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getProjectStatusColor = (status) => {
    const colors = {
      'Planning': 'var(--info)',
      'Pre-PM': 'var(--warning)',
      'PM Handoff': 'var(--warning)',
      'In Progress': 'var(--sunbelt-orange)',
      'On Hold': 'var(--text-tertiary)',
      'Completed': 'var(--success)',
      'Cancelled': 'var(--danger)',
      'Warranty': 'var(--info)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleProjectClick = (project) => setSelectedProject(project);

  const handleProjectUpdate = (updatedProject) => {
    if (updatedProject.isPrimary !== false) {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    } else {
      setSecondaryProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
    setSelectedProject(updatedProject);
    showToast('Project updated');
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [{ ...newProject, isPrimary: true }, ...prev]);
    setShowCreateProject(false);
    showToast('Project created');
    fetchDashboardData();
  };

  const handleCalendarItemClick = (item) => {
    const allProjects = [...projects, ...secondaryProjects];
    const project = allProjects.find(p => p.id === item.projectId);
    if (project) setSelectedProject(project);
  };

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
        onUpdate={handleProjectUpdate}
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
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Welcome back, {currentUser?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* STATS CARDS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '12px',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FolderKanban size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>My Projects</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{activeProjects}</div>
          {secondaryProjects.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>+{secondaryProjects.length} backup</div>
          )}
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckSquare size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>My Tasks</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{myTasks.length}</div>
        </div>

        <div style={{ background: overdueTasks.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: overdueTasks.length > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertCircle size={18} style={{ color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.8125rem', color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>Overdue</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{overdueTasks.length}</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <MessageSquare size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Open RFIs</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{openRFIs.length}</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ClipboardList size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Submittals</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{pendingSubmittals.length}</div>
        </div>
      </div>

      {/* PROJECT TIMELINE (GANTT) */}
      {projectsWithHealth.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          marginBottom: 'var(--space-lg)',
          overflow: 'hidden'
        }}>
          <div
            onClick={() => setShowTimeline(!showTimeline)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              cursor: 'pointer',
              borderBottom: showTimeline ? '1px solid var(--border-color)' : 'none'
            }}
          >
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Layers size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              My Project Timeline
            </h3>
            <ChevronDown
              size={18}
              style={{
                color: 'var(--text-tertiary)',
                transform: showTimeline ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
          </div>

          {showTimeline && (
            <div style={{ padding: '16px' }}>
              <GanttTimeline
                projects={projectsWithHealth}
                onProjectClick={handleProjectClick}
              />
            </div>
          )}
        </div>
      )}

      {/* TWO COLUMN - PROJECTS + CALENDAR */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 380px', 
        gap: '16px',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Projects List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              My Projects
            </h2>
            <button
              onClick={() => setShowCreateProject(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              New Project
            </button>
          </div>

          {projects.length === 0 && secondaryProjects.length === 0 ? (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              textAlign: 'center',
              border: '1px solid var(--border-color)'
            }}>
              <FolderKanban size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1rem' }}>No projects assigned</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
                Create your first project to get started.
              </p>
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
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Primary Projects */}
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = project.color || 'var(--sunbelt-orange)';
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: project.color || 'var(--sunbelt-orange)' }} />
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{project.project_number}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{project.name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.6875rem',
                      fontWeight: '600',
                      background: `${getProjectStatusColor(project.status)}20`,
                      color: getProjectStatusColor(project.status)
                    }}>
                      {project.status}
                    </span>
                    {project.delivery_date && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {formatDate(project.delivery_date)}
                      </span>
                    )}
                    <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              ))}

              {/* Secondary Projects */}
              {secondaryProjects.length > 0 && (
                <>
                  <button
                    onClick={() => setShowSecondaryProjects(!showSecondaryProjects)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-color)',
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={16} style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        Backup Projects ({secondaryProjects.length})
                      </span>
                    </div>
                    <ChevronRight 
                      size={16} 
                      style={{ 
                        color: 'var(--text-tertiary)',
                        transform: showSecondaryProjects ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }} 
                    />
                  </button>

                  {showSecondaryProjects && secondaryProjects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--border-color)',
                        cursor: 'pointer',
                        marginLeft: '20px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: project.color || 'var(--text-tertiary)', opacity: 0.5 }} />
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                            {project.project_number}
                            <span style={{ marginLeft: '8px', fontSize: '0.625rem', padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: '4px', color: 'var(--text-tertiary)' }}>
                              BACKUP
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{project.name}</div>
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Calendar Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              This Week
            </h2>
          </div>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <CalendarWeekView
              items={calendarItems}
              onItemClick={handleCalendarItemClick}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* CREATE PROJECT MODAL */}
      {showCreateProject && (
        <CreateProjectModal
          isOpen={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          onSuccess={handleProjectCreated}
          currentUserId={currentUser?.id}
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
          fontWeight: '500'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default PMDashboard;