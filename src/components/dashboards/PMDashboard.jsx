// ============================================================================
// PMDashboard.jsx - Project Manager Command Center
// ============================================================================
// Full-featured dashboard with:
// - Status indicators (portfolio health)
// - Overdue / Due Soon sections
// - Weekly calendar view
// - Gantt chart timeline
// - Active projects table
//
// FIXES (Jan 9, 2026):
// - ✅ FIXED: Now checks owner_id, primary_pm_id, AND backup_pm_id for projects
// - ✅ FIXED: Proper deduplication of projects from multiple queries
// - ✅ IMPROVED: Better error handling with specific error messages
// - ✅ IMPROVED: Consistent date handling
//
// PREVIOUS FIXES (Jan 8, 2026):
// - Now filters to show ONLY user's projects
// - Respects "Include backup projects" toggle for backup_pm_id
// - Fixed calendar to maintain consistent height
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  Target,
  DollarSign,
  Flag,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import CreateProjectModal from '../projects/CreateProjectModal';

// ============================================================================
// CONSTANTS
// ============================================================================
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TOAST_DURATION = 3000;

// Active project statuses for filtering
const ACTIVE_STATUSES = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString + 'T00:00:00'); // ✅ FIXED: Ensure consistent timezone
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatCurrency = (amount) => {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00'); // ✅ FIXED: Ensure consistent timezone
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getItemTypeColor = (type) => {
  const colors = {
    task: 'var(--info)',
    rfi: 'var(--warning)',
    submittal: 'var(--success)',
    milestone: 'var(--sunbelt-orange)'
  };
  return colors[type] || 'var(--text-secondary)';
};

const getItemTypeIcon = (type) => {
  const icons = {
    task: CheckSquare,
    rfi: MessageSquare,
    submittal: ClipboardList,
    milestone: Flag
  };
  return icons[type] || CheckSquare;
};

const getWeekDates = (offset = 0) => {
  const today = new Date();
  const currentDay = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay + (offset * 7));
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
};

const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

const isToday = (date) => {
  return isSameDay(date, new Date());
};

// ✅ ADDED: Helper to deduplicate projects by ID
const deduplicateProjects = (projects) => {
  const seen = new Set();
  return projects.filter(project => {
    if (seen.has(project.id)) return false;
    seen.add(project.id);
    return true;
  });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function PMDashboard({ onNavigateToProject }) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE - DATA
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [milestones, setMilestones] = useState([]);

  // ==========================================================================
  // STATE - UI
  // ==========================================================================
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectTab, setSelectedProjectTab] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // STATE - INCLUDE SECONDARY TOGGLE (Persisted to localStorage)
  // ==========================================================================
  const [includeSecondary, setIncludeSecondary] = useState(() => {
    const saved = localStorage.getItem('pmDashboardIncludeSecondary');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const toggleIncludeSecondary = () => {
    const newValue = !includeSecondary;
    setIncludeSecondary(newValue);
    localStorage.setItem('pmDashboardIncludeSecondary', JSON.stringify(newValue));
  };

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
  // DATA FETCHING - FILTERED TO USER'S PROJECTS ONLY
  // ==========================================================================
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // =====================================================================
      // STEP 1: Fetch projects where user is PM (owner_id, primary_pm_id, or backup_pm_id)
      // ✅ FIXED: Now checks all 3 PM fields
      // =====================================================================
      let projectsData = [];
      
      if (includeSecondary) {
        // Include primary (owner_id + primary_pm_id) AND backup PM projects
        const [ownerRes, primaryPmRes, backupRes] = await Promise.all([
          supabase.from('projects').select('*').eq('owner_id', user.id),
          supabase.from('projects').select('*').eq('primary_pm_id', user.id),
          supabase.from('projects').select('*').eq('backup_pm_id', user.id)
        ]);
        
        if (ownerRes.error) throw new Error(`Owner query failed: ${ownerRes.error.message}`);
        if (primaryPmRes.error) throw new Error(`Primary PM query failed: ${primaryPmRes.error.message}`);
        if (backupRes.error) throw new Error(`Backup PM query failed: ${backupRes.error.message}`);
        
        // Combine and deduplicate
        const allProjects = [
          ...(ownerRes.data || []), 
          ...(primaryPmRes.data || []), 
          ...(backupRes.data || [])
        ];
        projectsData = deduplicateProjects(allProjects);
      } else {
        // Only primary PM projects (check both owner_id AND primary_pm_id)
        // ✅ FIXED: Now checks both owner_id AND primary_pm_id
        const [ownerRes, primaryPmRes] = await Promise.all([
          supabase.from('projects').select('*').eq('owner_id', user.id),
          supabase.from('projects').select('*').eq('primary_pm_id', user.id)
        ]);
        
        if (ownerRes.error) throw new Error(`Owner query failed: ${ownerRes.error.message}`);
        if (primaryPmRes.error) throw new Error(`Primary PM query failed: ${primaryPmRes.error.message}`);
        
        // Combine and deduplicate
        const allProjects = [...(ownerRes.data || []), ...(primaryPmRes.data || [])];
        projectsData = deduplicateProjects(allProjects);
      }

      // Sort by updated_at descending
      projectsData.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      
      const myProjectIds = projectsData.map(p => p.id);

      // =====================================================================
      // STEP 2: Fetch tasks, RFIs, submittals, milestones for MY projects only
      // =====================================================================
      let tasksData = [];
      let rfisData = [];
      let submittalsData = [];
      let milestonesData = [];

      if (myProjectIds.length > 0) {
        const [tasksRes, rfisRes, submittalsRes, milestonesRes] = await Promise.all([
          supabase.from('tasks').select(`
            *, 
            project:project_id(id, name, project_number, color),
            assignee:assignee_id(id, name),
            internal_owner:internal_owner_id(id, name)
          `)
          .in('project_id', myProjectIds)
          .order('created_at', { ascending: false }),
          
          supabase.from('rfis').select(`
            *, 
            project:project_id(id, name, project_number, color)
          `)
          .in('project_id', myProjectIds)
          .order('created_at', { ascending: false }),
          
          supabase.from('submittals').select(`
            *, 
            project:project_id(id, name, project_number, color)
          `)
          .in('project_id', myProjectIds)
          .order('created_at', { ascending: false }),
          
          supabase.from('milestones').select(`
            *,
            project:project_id(id, name, project_number, color)
          `)
          .in('project_id', myProjectIds)
          .order('due_date', { ascending: true })
        ]);

        if (tasksRes.error) throw new Error(`Tasks query failed: ${tasksRes.error.message}`);
        if (rfisRes.error) throw new Error(`RFIs query failed: ${rfisRes.error.message}`);
        if (submittalsRes.error) throw new Error(`Submittals query failed: ${submittalsRes.error.message}`);
        if (milestonesRes.error) throw new Error(`Milestones query failed: ${milestonesRes.error.message}`);

        tasksData = tasksRes.data || [];
        rfisData = rfisRes.data || [];
        submittalsData = submittalsRes.data || [];
        milestonesData = milestonesRes.data || [];
      }

      setProjects(projectsData);
      setTasks(tasksData);
      setRFIs(rfisData);
      setSubmittals(submittalsData);
      setMilestones(milestonesData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, includeSecondary, showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ==========================================================================
  // COMPUTED: MY ITEMS (tasks, RFIs, submittals assigned to me)
  // ==========================================================================
  const myItems = useMemo(() => {
    const items = [];

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
      const isActive = !['Approved', 'Closed', 'Rejected'].includes(sub.status);
      
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
  }, [tasks, rfis, submittals, user?.id]);

  // ==========================================================================
  // COMPUTED: OVERDUE ITEMS
  // ==========================================================================
  const overdueItems = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return myItems.filter(item => item.dueDate < today);
  }, [myItems]);

  // ==========================================================================
  // COMPUTED: DUE SOON ITEMS (next 7 days)
  // ==========================================================================
  const dueSoonItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    return myItems
      .filter(item => item.dueDate >= todayStr && item.dueDate <= nextWeekStr)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [myItems]);

  // ==========================================================================
  // COMPUTED: ACTIVE PROJECTS
  // ==========================================================================
  const activeProjects = useMemo(() => {
    return projects.filter(p => ACTIVE_STATUSES.includes(p.status));
  }, [projects]);

  // ==========================================================================
  // COMPUTED: CALENDAR ITEMS BY DATE
  // ==========================================================================
  const calendarItemsByDate = useMemo(() => {
    const weekDates = getWeekDates(calendarWeekOffset);
    const itemsByDate = {};
    
    weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      itemsByDate[dateStr] = [];
    });

    // Add tasks
    tasks.forEach(task => {
      if (task.due_date && itemsByDate[task.due_date] !== undefined) {
        itemsByDate[task.due_date].push({
          id: task.id,
          type: 'task',
          title: task.title,
          status: task.status,
          project: task.project
        });
      }
    });

    // Add RFIs
    rfis.forEach(rfi => {
      if (rfi.due_date && itemsByDate[rfi.due_date] !== undefined) {
        itemsByDate[rfi.due_date].push({
          id: rfi.id,
          type: 'rfi',
          title: rfi.subject,
          status: rfi.status,
          project: rfi.project
        });
      }
    });

    // Add Submittals
    submittals.forEach(sub => {
      if (sub.due_date && itemsByDate[sub.due_date] !== undefined) {
        itemsByDate[sub.due_date].push({
          id: sub.id,
          type: 'submittal',
          title: sub.title,
          status: sub.status,
          project: sub.project
        });
      }
    });

    // Add Milestones
    milestones.forEach(milestone => {
      if (milestone.due_date && itemsByDate[milestone.due_date] !== undefined) {
        itemsByDate[milestone.due_date].push({
          id: milestone.id,
          type: 'milestone',
          title: milestone.name,
          status: milestone.status,
          project: milestone.project
        });
      }
    });

    return itemsByDate;
  }, [tasks, rfis, submittals, milestones, calendarWeekOffset]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleProjectClick = (project) => {
    if (onNavigateToProject) {
      onNavigateToProject(project.id);
    } else {
      setSelectedProject(project);
      setSelectedProjectTab('Overview');
    }
  };

  const handleBackFromProject = () => {
    setSelectedProject(null);
    setSelectedProjectTab(null);
    fetchDashboardData();
  };

  const handleRefresh = useCallback(() => {
    fetchDashboardData();
    showToast('Dashboard refreshed');
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
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>Failed to Load Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>{error}</p>
        <button
          onClick={handleRefresh}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-lg)',
            background: 'var(--sunbelt-orange)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: Main Dashboard
  // ==========================================================================
  const weekDates = getWeekDates(calendarWeekOffset);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FolderKanban size={28} style={{ color: 'var(--sunbelt-orange)' }} />
            My Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''} • {myItems.length} open item{myItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <RefreshCw size={16} />
          </button>
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              <Plus size={16} />
              New
              <ChevronDown size={14} />
            </button>
            
            {showNewDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '160px',
                zIndex: 100
              }}>
                <button
                  onClick={() => { setShowCreateProject(true); setShowNewDropdown(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <FolderKanban size={16} />
                  New Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* STATUS CARDS                                                      */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)'
      }}>
        <StatCard 
          label="Active Projects" 
          value={activeProjects.length} 
          icon={FolderKanban} 
          color="var(--sunbelt-orange)" 
        />
        <StatCard 
          label="Open Tasks" 
          value={tasks.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length} 
          icon={CheckSquare} 
          color="var(--info)" 
        />
        <StatCard 
          label="Open RFIs" 
          value={rfis.filter(r => !['Closed', 'Answered'].includes(r.status)).length} 
          icon={MessageSquare} 
          color="var(--warning)" 
        />
        <StatCard 
          label="Overdue" 
          value={overdueItems.length} 
          icon={AlertCircle} 
          color={overdueItems.length > 0 ? 'var(--danger)' : 'var(--success)'} 
          highlight={overdueItems.length > 0}
        />
      </div>

      {/* ================================================================== */}
      {/* ATTENTION SECTIONS (OVERDUE & DUE SOON)                           */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Overdue Items */}
        <div style={{
          background: overdueItems.length > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-secondary)',
          border: overdueItems.length > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '600', color: 'var(--danger)' }}>
              Overdue ({overdueItems.length})
            </h3>
          </div>
          
          {overdueItems.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>
              No overdue items
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {overdueItems.slice(0, 5).map(item => (
                <AttentionItem key={item.id} item={item} onClick={handleProjectClick} isOverdue />
              ))}
              {overdueItems.length > 5 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                  +{overdueItems.length - 5} more overdue
                </p>
              )}
            </div>
          )}
        </div>

        {/* Due Soon */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <Clock size={18} style={{ color: 'var(--warning)' }} />
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Due This Week ({dueSoonItems.length})
            </h3>
          </div>
          
          {dueSoonItems.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>
              No items due this week
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dueSoonItems.slice(0, 5).map(item => (
                <AttentionItem key={item.id} item={item} onClick={handleProjectClick} />
              ))}
              {dueSoonItems.length > 5 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                  +{dueSoonItems.length - 5} more due this week
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* WEEKLY CALENDAR                                                   */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        marginBottom: 'var(--space-lg)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Calendar size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Week of {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h3>
          </div>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setCalendarWeekOffset(calendarWeekOffset - 1)}
              style={{
                padding: '6px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCalendarWeekOffset(0)}
              style={{
                padding: '6px 12px',
                background: calendarWeekOffset === 0 ? 'var(--sunbelt-orange)' : 'var(--bg-primary)',
                color: calendarWeekOffset === 0 ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              Today
            </button>
            <button
              onClick={() => setCalendarWeekOffset(calendarWeekOffset + 1)}
              style={{
                padding: '6px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          background: 'var(--border-color)'
        }}>
          {weekDates.map((date, i) => {
            const dateStr = date.toISOString().split('T')[0];
            const items = calendarItemsByDate[dateStr] || [];
            const today = isToday(date);
            
            return (
              <div
                key={dateStr}
                style={{
                  background: 'var(--bg-secondary)',
                  padding: 'var(--space-sm)',
                  minHeight: '120px'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: 'var(--space-sm)'
                }}>
                  <span style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase'
                  }}>
                    {DAYS_OF_WEEK[i]}
                  </span>
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: today ? 'white' : 'var(--text-primary)',
                    background: today ? 'var(--sunbelt-orange)' : 'transparent',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {date.getDate()}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {items.slice(0, 3).map(item => {
                    const Icon = getItemTypeIcon(item.type);
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 4px',
                          background: `${getItemTypeColor(item.type)}15`,
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.6875rem',
                          color: getItemTypeColor(item.type),
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <Icon size={10} style={{ color: getItemTypeColor(item.type), flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                      </div>
                    );
                  })}
                  {items.length > 3 && (
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                      +{items.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* PROJECTS TABLE                                                    */}
      {/* ================================================================== */}
      {activeProjects.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Target size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Active Projects
              </h3>
            </div>
            
            {/* Include Secondary Toggle */}
            <button
              onClick={toggleIncludeSecondary}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'transparent',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                fontSize: '0.75rem'
              }}
            >
              <span>Include backup projects</span>
              {includeSecondary ? 
                <ToggleRight size={18} style={{ color: 'var(--sunbelt-orange)' }} /> : 
                <ToggleLeft size={18} />
              }
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)' }}>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Project</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Tasks</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>RFIs</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Delivery</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}></th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.map(project => {
                  const projectTasks = tasks.filter(t => t.project_id === project.id);
                  const projectRFIs = rfis.filter(r => r.project_id === project.id);
                  const openTasks = projectTasks.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length;
                  const openRFIs = projectRFIs.filter(r => !['Closed', 'Answered'].includes(r.status)).length;
                  
                  return (
                    <tr
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <div style={{
                            width: '4px',
                            height: '32px',
                            borderRadius: '2px',
                            background: project.color || 'var(--sunbelt-orange)'
                          }} />
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{project.project_number}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{project.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: project.status === 'In Progress' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: project.status === 'In Progress' ? 'var(--success)' : 'var(--info)'
                        }}>
                          {project.status}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                        <span style={{ fontWeight: '600', color: openTasks > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                          {openTasks}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                        <span style={{ fontWeight: '600', color: openRFIs > 0 ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                          {openRFIs}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-md)', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {formatDate(project.target_online_date)}
                      </td>
                      <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODALS                                                            */}
      {/* ================================================================== */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={() => {
          setShowCreateProject(false);
          fetchDashboardData();
          showToast('Project created successfully');
        }}
      />

      {/* ================================================================== */}
      {/* TOAST                                                             */}
      {/* ================================================================== */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--space-lg)',
          right: 'var(--space-lg)',
          padding: 'var(--space-md) var(--space-lg)',
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          animation: 'slideIn 0.2s ease'
        }}>
          {toast.message}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showNewDropdown && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          onClick={() => setShowNewDropdown(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
function StatCard({ label, value, icon: Icon, color, isText = false, highlight = false }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      padding: 'var(--space-md) var(--space-lg)',
      background: highlight ? `${color}15` : 'var(--bg-secondary)',
      border: highlight ? `1px solid ${color}` : '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-md)',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {label}
        </div>
        <div style={{ fontSize: isText ? '1rem' : '1.5rem', fontWeight: '700', color }}>
          {value}
        </div>
      </div>
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
      onClick={() => onClick(item.project)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: '6px var(--space-sm)',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'transform 0.15s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
    >
      <Icon size={14} style={{ color: getItemTypeColor(item.type), flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.8125rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {item.title}
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
          {item.project?.project_number}
        </div>
      </div>
      <div style={{
        fontSize: '0.6875rem',
        fontWeight: '600',
        color: isOverdue ? 'var(--danger)' : 'var(--warning)',
        whiteSpace: 'nowrap'
      }}>
        {isOverdue ? `${Math.abs(daysUntil)}d late` : formatDate(item.dueDate)}
      </div>
    </div>
  );
}

export default PMDashboard;