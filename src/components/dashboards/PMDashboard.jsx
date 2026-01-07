// ============================================================================
// PMDashboard Component
// ============================================================================
// Project Manager dashboard showing only projects assigned to the current user.
//
// KEY FEATURES:
// - Only shows projects where user is PM (primary) or Secondary PM (backup)
// - Primary projects shown first, secondary projects in separate section
// - Stats only count primary project items (unless toggle enabled)
// - Week calendar preview
// - Recent tasks and activities
//
// FIXES:
// - No longer shows all projects to everyone
// - Proper PM-based filtering
// - Secondary project organization
// ============================================================================

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
  Users,
  Shield
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import CreateProjectModal from '../projects/CreateProjectModal';
import CalendarWeekView from '../calendar/CalendarWeekView';
import { buildCalendarItems, getProjectColor } from '../../utils/calendarUtils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function PMDashboard() {
  const { user } = useAuth();
  
  // ==========================================================================
  // STATE - DATA
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
  
  // ==========================================================================
  // STATE - UI
  // ==========================================================================
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showSecondaryProjects, setShowSecondaryProjects] = useState(false);
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // FETCH DATA ON MOUNT
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

  // ==========================================================================
  // FETCH CURRENT USER
  // ==========================================================================
  const fetchCurrentUser = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCurrentUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  // ==========================================================================
  // FETCH DASHBOARD DATA (FILTERED BY USER)
  // ==========================================================================
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // ===== FETCH PRIMARY PROJECTS (where user is PM) =====
      const { data: primaryProjectsData, error: primaryError } = await supabase
        .from('projects')
        .select('*')
        .eq('pm_id', currentUser.id)
        .order('updated_at', { ascending: false });

      if (primaryError) throw primaryError;

      // ===== FETCH SECONDARY PROJECTS (where user is backup PM) =====
      const { data: secondaryProjectsData, error: secondaryError } = await supabase
        .from('projects')
        .select('*')
        .eq('secondary_pm_id', currentUser.id)
        .neq('pm_id', currentUser.id) // Exclude if also primary
        .order('updated_at', { ascending: false });

      // Don't throw error if column doesn't exist yet
      const secondaryData = secondaryError ? [] : (secondaryProjectsData || []);

      // ===== COMBINE PROJECT IDS FOR RELATED DATA =====
      const allProjectIds = [
        ...(primaryProjectsData || []).map(p => p.id),
        ...secondaryData.map(p => p.id)
      ];

      // ===== FETCH TASKS FOR USER'S PROJECTS =====
      let tasksData = [];
      if (allProjectIds.length > 0) {
        const { data } = await supabase
          .from('tasks')
          .select(`
            *,
            project:project_id(id, name, project_number, color),
            assignee:assignee_id(name),
            internal_owner:internal_owner_id(name)
          `)
          .in('project_id', allProjectIds)
          .order('created_at', { ascending: false });
        tasksData = data || [];
      }

      // ===== FETCH RFIS FOR USER'S PROJECTS =====
      let rfisData = [];
      if (allProjectIds.length > 0) {
        const { data } = await supabase
          .from('rfis')
          .select(`
            *,
            project:project_id(id, name, project_number, color)
          `)
          .in('project_id', allProjectIds)
          .order('created_at', { ascending: false });
        rfisData = data || [];
      }

      // ===== FETCH SUBMITTALS FOR USER'S PROJECTS =====
      let submittalsData = [];
      if (allProjectIds.length > 0) {
        const { data } = await supabase
          .from('submittals')
          .select(`
            *,
            project:project_id(id, name, project_number, color)
          `)
          .in('project_id', allProjectIds)
          .order('created_at', { ascending: false });
        submittalsData = data || [];
      }

      // ===== FETCH MILESTONES FOR USER'S PROJECTS =====
      let milestonesData = [];
      if (allProjectIds.length > 0) {
        const { data } = await supabase
          .from('milestones')
          .select(`
            *,
            project:project_id(id, name, project_number, color)
          `)
          .in('project_id', allProjectIds)
          .order('due_date', { ascending: true });
        milestonesData = data || [];
      }

      // ===== ASSIGN COLORS TO PROJECTS =====
      const primaryWithColors = (primaryProjectsData || []).map((project, index) => ({
        ...project,
        color: project.color || getProjectColor(project, index),
        isPrimary: true
      }));

      const secondaryWithColors = secondaryData.map((project, index) => ({
        ...project,
        color: project.color || getProjectColor(project, index + primaryWithColors.length),
        isPrimary: false
      }));

      // ===== SET STATE =====
      setProjects(primaryWithColors);
      setSecondaryProjects(secondaryWithColors);
      setTasks(tasksData);
      setRFIs(rfisData);
      setSubmittals(submittalsData);
      setMilestones(milestonesData);

      // ===== BUILD CALENDAR ITEMS (PRIMARY ONLY) =====
      const items = buildCalendarItems(
        primaryWithColors,
        tasksData.filter(t => primaryWithColors.some(p => p.id === t.project_id)),
        rfisData.filter(r => primaryWithColors.some(p => p.id === r.project_id)),
        submittalsData.filter(s => primaryWithColors.some(p => p.id === s.project_id)),
        milestonesData.filter(m => primaryWithColors.some(p => p.id === m.project_id))
      );
      setCalendarItems(items);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
  // CALCULATE STATS (PRIMARY PROJECTS ONLY)
  // ==========================================================================
  const today = new Date().toISOString().split('T')[0];
  
  const activeProjects = projects.filter(p => 
    !['Completed', 'Cancelled', 'On Hold', 'Warranty'].includes(p.status)
  ).length;

  // Only count tasks from PRIMARY projects
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

  const totalContractValue = projects
    .filter(p => !['Cancelled'].includes(p.status))
    .reduce((sum, p) => sum + (p.contract_value || 0), 0);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
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
  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleProjectUpdate = (updatedProject) => {
    if (updatedProject.isPrimary !== false) {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    } else {
      setSecondaryProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
    setSelectedProject(updatedProject);
    showToast('Project updated successfully');
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [{ ...newProject, isPrimary: true }, ...prev]);
    setShowCreateProject(false);
    showToast('Project created successfully');
    fetchDashboardData();
  };

  const handleCalendarItemClick = (item) => {
    const allProjects = [...projects, ...secondaryProjects];
    const project = allProjects.find(p => p.id === item.projectId);
    if (project) {
      setSelectedProject(project);
    }
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
          Loading dashboard...
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
      {/* WELCOME HEADER                                                    */}
      {/* ================================================================== */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: 'var(--space-xs)' 
        }}>
          Welcome back, {currentUser?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* ================================================================== */}
      {/* STATS CARDS                                                       */}
      {/* ================================================================== */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 'var(--space-lg)',
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
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>My Projects</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {activeProjects}
          </div>
          {secondaryProjects.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              +{secondaryProjects.length} backup
            </div>
          )}
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
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>My Tasks</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {myTasks.length}
          </div>
        </div>

        {/* Overdue */}
        <div style={{
          background: overdueTasks.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          border: `1px solid ${overdueTasks.length > 0 ? 'var(--danger)' : 'var(--border-color)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <AlertCircle size={20} style={{ color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.875rem', color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>Overdue</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
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
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Open RFIs</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
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
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pending Submittals</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {pendingSubmittals.length}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MY PROJECTS SECTION                                               */}
      {/* ================================================================== */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 400px', 
        gap: 'var(--space-xl)',
        marginBottom: 'var(--space-xl)'
      }}>
        {/* Projects List */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 'var(--space-lg)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              My Projects
            </h2>
            <button
              onClick={() => setShowCreateProject(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '8px 16px',
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

          {/* Primary Projects */}
          {projects.length === 0 && secondaryProjects.length === 0 ? (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2xl)',
              textAlign: 'center',
              border: '1px solid var(--border-color)'
            }}>
              <FolderKanban size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>No projects assigned</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                You don't have any projects assigned to you yet.
              </p>
              <button
                onClick={() => setShowCreateProject(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Plus size={18} />
                Create First Project
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-md) var(--space-lg)',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{
                      width: '4px',
                      height: '40px',
                      borderRadius: '2px',
                      background: project.color || 'var(--sunbelt-orange)'
                    }} />
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {project.project_number}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {project.name}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: `${getProjectStatusColor(project.status)}20`,
                      color: getProjectStatusColor(project.status)
                    }}>
                      {project.status}
                    </span>
                    {project.delivery_date && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        {formatDate(project.delivery_date)}
                      </span>
                    )}
                    <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              ))}

              {/* ===== SECONDARY PROJECTS SECTION ===== */}
              {secondaryProjects.length > 0 && (
                <>
                  <button
                    onClick={() => setShowSecondaryProjects(!showSecondaryProjects)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-md) var(--space-lg)',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-color)',
                      cursor: 'pointer',
                      marginTop: 'var(--space-md)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <Shield size={18} style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        Backup Projects ({secondaryProjects.length})
                      </span>
                    </div>
                    <ChevronRight 
                      size={18} 
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
                        padding: 'var(--space-md) var(--space-lg)',
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        marginLeft: 'var(--space-lg)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = project.color || 'var(--text-tertiary)';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'var(--bg-primary)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div style={{
                          width: '4px',
                          height: '40px',
                          borderRadius: '2px',
                          background: project.color || 'var(--text-tertiary)',
                          opacity: 0.5
                        }} />
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {project.project_number}
                            <span style={{ 
                              marginLeft: 'var(--space-sm)',
                              fontSize: '0.625rem',
                              padding: '2px 6px',
                              background: 'var(--bg-tertiary)',
                              borderRadius: '4px',
                              color: 'var(--text-tertiary)'
                            }}>
                              BACKUP
                            </span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {project.name}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: `${getProjectStatusColor(project.status)}20`,
                          color: getProjectStatusColor(project.status)
                        }}>
                          {project.status}
                        </span>
                        <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Calendar Preview */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 'var(--space-lg)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
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

      {/* ================================================================== */}
      {/* CREATE PROJECT MODAL                                              */}
      {/* ================================================================== */}
      {showCreateProject && (
        <CreateProjectModal
          isOpen={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          onSuccess={handleProjectCreated}
          currentUserId={currentUser?.id}
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