// ============================================================================
// PMDashboard.jsx - Project Manager Command Center (FIXED VERSION)
// ============================================================================
// Full-featured dashboard with:
// - Status indicators (portfolio health)
// - Overdue / Due Soon sections
// - Weekly calendar view
// - Gantt chart timeline
// - Active projects table
//
// FIXES (Jan 8, 2026):
// - Now filters to show ONLY user's projects (owner_id = user.id)
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
const CALENDAR_MIN_HEIGHT = '140px'; // Fixed height for calendar consistency

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  if (compareDate.getTime() === today.getTime()) return 'Today';
  if (compareDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateShort = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatCurrency = (amount) => {
  if (!amount) return '—';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

const formatCurrencyFull = (amount) => {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

const getProjectStatusColor = (status) => {
  const colors = {
    'Planning': 'var(--info)', 'Pre-PM': 'var(--warning)', 'PM Handoff': 'var(--sunbelt-orange)',
    'In Progress': 'var(--sunbelt-orange)', 'On Hold': 'var(--text-tertiary)',
    'Completed': 'var(--success)', 'Cancelled': 'var(--danger)', 'Warranty': 'var(--info)'
  };
  return colors[status] || 'var(--text-secondary)';
};

const getItemTypeIcon = (type) => {
  switch (type) {
    case 'task': return CheckSquare;
    case 'rfi': return MessageSquare;
    case 'submittal': return ClipboardList;
    case 'milestone': return Flag;
    default: return AlertCircle;
  }
};

const getItemTypeColor = (type) => {
  switch (type) {
    case 'task': return 'var(--info)';
    case 'rfi': return 'var(--sunbelt-orange)';
    case 'submittal': return 'var(--success)';
    case 'milestone': return 'var(--warning)';
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

const getWeekDates = (referenceDate = new Date()) => {
  const dates = [];
  const startOfWeek = new Date(referenceDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day); // Start from Sunday
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
};

const isToday = (date) => {
  return isSameDay(date, new Date());
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

  // View state
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectTab, setSelectedProjectTab] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // INCLUDE SECONDARY TOGGLE - Persisted to localStorage
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
      // STEP 1: Fetch ONLY projects where user is PM or Secondary PM
      // =====================================================================
      let projectsData = [];
      
      if (includeSecondary) {
        // Include both primary and secondary PM projects
        // Use two separate queries and combine (Supabase OR on same column is tricky)
        const [primaryRes, secondaryRes] = await Promise.all([
          supabase.from('projects').select('*').eq('owner_id', user.id),
          supabase.from('projects').select('*').eq('backup_pm_id', user.id)
        ]);
        
        if (primaryRes.error) throw primaryRes.error;
        if (secondaryRes.error) throw secondaryRes.error;
        
        // Combine and deduplicate
        const allProjects = [...(primaryRes.data || []), ...(secondaryRes.data || [])];
        const uniqueProjects = allProjects.filter((project, index, self) =>
          index === self.findIndex(p => p.id === project.id)
        );
        projectsData = uniqueProjects;
      } else {
        // Only primary PM projects
        const { data, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id)
          .order('updated_at', { ascending: false });
        
        if (projectsError) throw projectsError;
        projectsData = data || [];
      }

      // Sort by updated_at
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

        if (tasksRes.error) throw tasksRes.error;
        if (rfisRes.error) throw rfisRes.error;
        if (submittalsRes.error) throw submittalsRes.error;
        if (milestonesRes.error) throw milestonesRes.error;

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
      setError('Failed to load dashboard data');
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

  // All calendar items (including milestones)
  const allCalendarItems = useMemo(() => {
    const items = [...myItems];
    
    // Add milestones from active projects
    milestones.forEach(milestone => {
      const project = projects.find(p => p.id === milestone.project_id);
      if (project && !['Completed', 'Cancelled'].includes(project.status) && milestone.due_date) {
        items.push({
          id: milestone.id,
          type: 'milestone',
          title: milestone.name,
          identifier: milestone.name,
          dueDate: milestone.due_date,
          status: milestone.status,
          project: { id: project.id, name: project.name, project_number: project.project_number, color: project.color },
          raw: milestone
        });
      }
    });

    return items;
  }, [myItems, milestones, projects]);

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
  // COMPUTED: PROJECT STATS & HEALTH
  // ==========================================================================
  const projectStats = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const projectRFIs = rfis.filter(r => r.project_id === project.id);
      const projectSubs = submittals.filter(s => s.project_id === project.id);
      const projectMilestones = milestones.filter(m => m.project_id === project.id);

      // Calculate overdue items for this project
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const overdueTaskCount = projectTasks.filter(t => 
        t.due_date && new Date(t.due_date) < today && !['Completed', 'Cancelled'].includes(t.status)
      ).length;
      
      const overdueRFICount = projectRFIs.filter(r => 
        r.due_date && new Date(r.due_date) < today && !['Closed', 'Answered'].includes(r.status)
      ).length;

      const totalOverdue = overdueTaskCount + overdueRFICount;

      // Determine health status
      let health = 'on-track';
      if (totalOverdue > 3) health = 'behind';
      else if (totalOverdue > 0) health = 'at-risk';

      return {
        ...project,
        taskCount: projectTasks.length,
        taskCompleted: projectTasks.filter(t => t.status === 'Completed').length,
        openRFIs: projectRFIs.filter(r => !['Closed', 'Answered'].includes(r.status)).length,
        pendingSubs: projectSubs.filter(s => !['Approved', 'Approved as Noted', 'Rejected'].includes(s.status)).length,
        milestoneCount: projectMilestones.length,
        overdueCount: totalOverdue,
        health
      };
    });
  }, [projects, tasks, rfis, submittals, milestones]);

  // Active projects only
  const activeProjects = useMemo(() => {
    return projectStats.filter(p => !['Completed', 'Cancelled', 'On Hold'].includes(p.status));
  }, [projectStats]);

  // Portfolio health summary
  const portfolioHealth = useMemo(() => {
    const onTrack = activeProjects.filter(p => p.health === 'on-track').length;
    const atRisk = activeProjects.filter(p => p.health === 'at-risk').length;
    const behind = activeProjects.filter(p => p.health === 'behind').length;
    const totalValue = activeProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
    
    return { onTrack, atRisk, behind, totalValue };
  }, [activeProjects]);

  // ==========================================================================
  // COMPUTED: WEEKLY CALENDAR
  // ==========================================================================
  const weekDates = useMemo(() => {
    const refDate = new Date();
    refDate.setDate(refDate.getDate() + (calendarWeekOffset * 7));
    return getWeekDates(refDate);
  }, [calendarWeekOffset]);

  const calendarItemsByDay = useMemo(() => {
    const byDay = {};
    weekDates.forEach(date => {
      const key = date.toDateString();
      byDay[key] = allCalendarItems.filter(item => isSameDay(item.dueDate, date));
    });
    return byDay;
  }, [weekDates, allCalendarItems]);

  // ==========================================================================
  // COMPUTED: GANTT DATA
  // ==========================================================================
  const ganttData = useMemo(() => {
    // Find date range for Gantt
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 1);
    const sixMonthsFromNow = new Date(today);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 5);

    let minDate = threeMonthsAgo;
    let maxDate = sixMonthsFromNow;

    // Adjust based on actual project dates
    activeProjects.forEach(p => {
      if (p.start_date && new Date(p.start_date) < minDate) minDate = new Date(p.start_date);
      if (p.target_online_date && new Date(p.target_online_date) > maxDate) maxDate = new Date(p.target_online_date);
    });

    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

    // Generate month labels
    const months = [];
    const currentMonth = new Date(minDate);
    currentMonth.setDate(1);
    while (currentMonth <= maxDate) {
      const monthStart = new Date(currentMonth);
      const daysFromStart = Math.ceil((monthStart - minDate) / (1000 * 60 * 60 * 24));
      months.push({
        label: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        position: (daysFromStart / totalDays) * 100
      });
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Calculate bar positions for each project
    const bars = activeProjects.map(project => {
      const startDate = project.start_date ? new Date(project.start_date) : new Date();
      const endDate = project.target_online_date ? new Date(project.target_online_date) : new Date();
      
      const startDays = Math.max(0, Math.ceil((startDate - minDate) / (1000 * 60 * 60 * 24)));
      const endDays = Math.min(totalDays, Math.ceil((endDate - minDate) / (1000 * 60 * 60 * 24)));
      
      const startPercent = (startDays / totalDays) * 100;
      const widthPercent = ((endDays - startDays) / totalDays) * 100;
      
      // Progress based on completed tasks
      const progress = project.taskCount > 0 ? (project.taskCompleted / project.taskCount) * 100 : 0;

      return {
        ...project,
        startPercent,
        widthPercent: Math.max(widthPercent, 2), // Minimum 2% width for visibility
        progress
      };
    });

    // Today marker position
    const todayDays = Math.ceil((today - minDate) / (1000 * 60 * 60 * 24));
    const todayPercent = (todayDays / totalDays) * 100;

    return { months, bars, todayPercent, minDate, maxDate };
  }, [activeProjects]);

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
      else setSelectedProjectTab(null);
    }
  }, []);

  const handleBackFromProject = useCallback(() => {
    setSelectedProject(null);
    setSelectedProjectTab(null);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleProjectCreated = useCallback(() => {
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
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9375rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
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
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowNewDropdown(false)} />
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
      {/* STATUS INDICATORS                                                 */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)',
        padding: 'var(--space-md) var(--space-lg)',
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)', flexWrap: 'wrap'
      }}>
        <StatusIndicator
          icon={TrendingUp}
          label="On Track"
          value={portfolioHealth.onTrack}
          color="var(--success)"
        />
        <StatusIndicator
          icon={AlertTriangle}
          label="At Risk"
          value={portfolioHealth.atRisk}
          color="var(--warning)"
          highlight={portfolioHealth.atRisk > 0}
        />
        <StatusIndicator
          icon={AlertCircle}
          label="Behind"
          value={portfolioHealth.behind}
          color="var(--danger)"
          highlight={portfolioHealth.behind > 0}
        />
        <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 var(--space-sm)' }} />
        <StatusIndicator
          icon={FolderKanban}
          label="Active Projects"
          value={activeProjects.length}
          color="var(--sunbelt-orange)"
        />
        <StatusIndicator
          icon={DollarSign}
          label="Portfolio Value"
          value={formatCurrency(portfolioHealth.totalValue)}
          color="var(--text-primary)"
          isText
        />
        <StatusIndicator
          icon={Target}
          label="My Items Due"
          value={overdueItems.length + needsAttentionItems.length}
          color={overdueItems.length > 0 ? 'var(--danger)' : 'var(--warning)'}
          highlight={overdueItems.length > 0}
        />
      </div>

      {/* ================================================================== */}
      {/* OVERDUE & NEEDS ATTENTION                                         */}
      {/* ================================================================== */}
      {(overdueItems.length > 0 || needsAttentionItems.length > 0) && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: overdueItems.length > 0 && needsAttentionItems.length > 0 ? '1fr 1fr' : '1fr',
          gap: 'var(--space-lg)', 
          marginBottom: 'var(--space-lg)' 
        }}>
          {/* Overdue Section */}
          {overdueItems.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: 'var(--danger)' }}>
                  Overdue ({overdueItems.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {overdueItems.slice(0, 4).map(item => (
                  <AttentionItem key={`${item.type}-${item.id}`} item={item} onClick={handleItemClick} isOverdue />
                ))}
                {overdueItems.length > 4 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--danger)', margin: 'var(--space-xs) 0 0 0' }}>
                    +{overdueItems.length - 4} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Due Soon Section */}
          {needsAttentionItems.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <Clock size={18} style={{ color: 'var(--warning)' }} />
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: 'var(--warning)' }}>
                  Due Within 48hrs ({needsAttentionItems.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {needsAttentionItems.slice(0, 4).map(item => (
                  <AttentionItem key={`${item.type}-${item.id}`} item={item} onClick={handleItemClick} />
                ))}
                {needsAttentionItems.length > 4 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--warning)', margin: 'var(--space-xs) 0 0 0' }}>
                    +{needsAttentionItems.length - 4} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* WEEKLY CALENDAR - FIXED HEIGHT                                    */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)', marginBottom: 'var(--space-lg)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Calendar size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              This Week
            </h3>
            {calendarWeekOffset !== 0 && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                ({calendarWeekOffset > 0 ? '+' : ''}{calendarWeekOffset} week{Math.abs(calendarWeekOffset) !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <button
              onClick={() => setCalendarWeekOffset(prev => prev - 1)}
              style={{
                padding: '4px 8px', background: 'var(--bg-tertiary)', border: 'none',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCalendarWeekOffset(0)}
              disabled={calendarWeekOffset === 0}
              style={{
                padding: '4px 12px', background: calendarWeekOffset === 0 ? 'var(--bg-tertiary)' : 'var(--sunbelt-orange)',
                border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                color: calendarWeekOffset === 0 ? 'var(--text-tertiary)' : 'white',
                fontSize: '0.75rem', fontWeight: '600'
              }}
            >
              Today
            </button>
            <button
              onClick={() => setCalendarWeekOffset(prev => prev + 1)}
              style={{
                padding: '4px 8px', background: 'var(--bg-tertiary)', border: 'none',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        {/* FIXED: Calendar grid now has fixed minHeight */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: CALENDAR_MIN_HEIGHT }}>
          {weekDates.map((date, index) => {
            const dayKey = date.toDateString();
            const items = calendarItemsByDay[dayKey] || [];
            const isCurrentDay = isToday(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            return (
              <div
                key={dayKey}
                style={{
                  padding: 'var(--space-sm)',
                  borderLeft: index > 0 ? '1px solid var(--border-color)' : 'none',
                  background: isCurrentDay ? 'rgba(255, 107, 53, 0.05)' : isWeekend ? 'var(--bg-tertiary)' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{
                  textAlign: 'center', marginBottom: 'var(--space-sm)',
                  paddingBottom: 'var(--space-xs)', borderBottom: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                    {DAYS_OF_WEEK[date.getDay()]}
                  </div>
                  <div style={{
                    fontSize: '1.125rem', fontWeight: isCurrentDay ? '700' : '500',
                    color: isCurrentDay ? 'var(--sunbelt-orange)' : 'var(--text-primary)'
                  }}>
                    {date.getDate()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  {items.slice(0, 3).map(item => {
                    const Icon = getItemTypeIcon(item.type);
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleItemClick(item)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '2px 4px', borderRadius: '3px',
                          background: `${getItemTypeColor(item.type)}15`,
                          cursor: 'pointer', fontSize: '0.6875rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}
                        title={`${item.identifier}: ${item.title}`}
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
      {/* GANTT CHART                                                       */}
      {/* ================================================================== */}
      {activeProjects.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)', marginBottom: 'var(--space-lg)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Target size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Project Timeline
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
              {includeSecondary ? (
                <ToggleRight size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              ) : (
                <ToggleLeft size={18} />
              )}
            </button>
          </div>

          {/* Month Headers */}
          <div style={{ position: 'relative', height: '30px', borderBottom: '1px solid var(--border-color)', marginLeft: '200px' }}>
            {ganttData.months.map((month, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${month.position}%`,
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  padding: '8px 0',
                  borderLeft: '1px solid var(--border-color)',
                  paddingLeft: '8px'
                }}
              >
                {month.label}
              </div>
            ))}
            {/* Today marker */}
            <div style={{
              position: 'absolute',
              left: `${ganttData.todayPercent}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              background: 'var(--sunbelt-orange)',
              zIndex: 2
            }} />
          </div>

          {/* Project Bars */}
          <div style={{ padding: 'var(--space-sm) 0' }}>
            {ganttData.bars.map(project => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                style={{
                  display: 'flex', alignItems: 'center', height: '36px',
                  cursor: 'pointer', transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Project Name */}
                <div style={{
                  width: '200px', flexShrink: 0, padding: '0 var(--space-md)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '2px',
                    background: project.color || 'var(--sunbelt-orange)'
                  }} />
                  <span style={{
                    fontSize: '0.8125rem', color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {project.name}
                  </span>
                  {project.health === 'at-risk' && <AlertTriangle size={12} style={{ color: 'var(--warning)' }} />}
                  {project.health === 'behind' && <AlertCircle size={12} style={{ color: 'var(--danger)' }} />}
                </div>

                {/* Bar Area */}
                <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                  {/* Today line */}
                  <div style={{
                    position: 'absolute',
                    left: `${ganttData.todayPercent}%`,
                    top: 0, bottom: 0, width: '2px',
                    background: 'var(--sunbelt-orange)', opacity: 0.3
                  }} />
                  
                  {/* Project Bar */}
                  <div style={{
                    position: 'absolute',
                    left: `${project.startPercent}%`,
                    width: `${project.widthPercent}%`,
                    top: '8px', height: '20px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    {/* Progress Fill */}
                    <div style={{
                      width: `${project.progress}%`,
                      height: '100%',
                      background: project.color || 'var(--sunbelt-orange)',
                      opacity: 0.8,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* ACTIVE PROJECTS TABLE                                             */}
      {/* ================================================================== */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
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
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              {includeSecondary 
                ? "You don't have any projects assigned as primary or secondary PM"
                : "Create your first project or enable 'Include backup projects' to see secondary PM assignments"
              }
            </p>
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
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Status</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '80px' }}>Health</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '80px' }}>Tasks</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '70px' }}>RFIs</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '70px' }}>Subs</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'right', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Value</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'right', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '90px' }}>Due</th>
                  <th style={{ width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.map((project, index) => (
                  <tr
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    style={{
                      borderTop: index > 0 ? '1px solid var(--border-color)' : 'none',
                      cursor: 'pointer', transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: project.color || 'var(--sunbelt-orange)' }} />
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{project.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{project.project_number}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '10px', fontSize: '0.6875rem', fontWeight: '600',
                        background: `${getProjectStatusColor(project.status)}20`,
                        color: getProjectStatusColor(project.status)
                      }}>
                        {project.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center' }}>
                      <HealthBadge health={project.health} />
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{project.taskCompleted}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>/{project.taskCount}</span>
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', fontSize: '0.8125rem' }}>
                      <span style={{ color: project.openRFIs > 0 ? 'var(--sunbelt-orange)' : 'var(--text-tertiary)', fontWeight: project.openRFIs > 0 ? '600' : '400' }}>
                        {project.openRFIs || '—'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', fontSize: '0.8125rem' }}>
                      <span style={{ color: project.pendingSubs > 0 ? 'var(--warning)' : 'var(--text-tertiary)', fontWeight: project.pendingSubs > 0 ? '600' : '400' }}>
                        {project.pendingSubs || '—'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {formatCurrency(project.contract_value)}
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {formatDate(project.target_online_date)}
                    </td>
                    <td style={{ padding: 'var(--space-sm)' }}>
                      <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
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
// STATUS INDICATOR COMPONENT
// ============================================================================
function StatusIndicator({ icon: Icon, label, value, color, highlight = false, isText = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
      padding: 'var(--space-xs) var(--space-sm)',
      background: highlight ? `${color}15` : 'transparent',
      borderRadius: 'var(--radius-md)'
    }}>
      <Icon size={16} style={{ color }} />
      <div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
        <div style={{ fontSize: isText ? '0.9375rem' : '1.125rem', fontWeight: '700', color }}>{value}</div>
      </div>
    </div>
  );
}

// ============================================================================
// HEALTH BADGE COMPONENT
// ============================================================================
function HealthBadge({ health }) {
  const config = {
    'on-track': { color: 'var(--success)', label: '●', title: 'On Track' },
    'at-risk': { color: 'var(--warning)', label: '●', title: 'At Risk' },
    'behind': { color: 'var(--danger)', label: '●', title: 'Behind' }
  };
  const { color, label, title } = config[health] || config['on-track'];
  
  return (
    <span
      title={title}
      style={{
        display: 'inline-block',
        width: '10px', height: '10px',
        borderRadius: '50%',
        background: color
      }}
    />
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
        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
        padding: '6px var(--space-sm)',
        background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
        cursor: 'pointer', transition: 'transform 0.15s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
    >
      <Icon size={14} style={{ color: getItemTypeColor(item.type), flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {item.title}
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
          {item.project?.project_number}
        </div>
      </div>
      <div style={{
        fontSize: '0.6875rem', fontWeight: '600',
        color: isOverdue ? 'var(--danger)' : 'var(--warning)',
        whiteSpace: 'nowrap'
      }}>
        {isOverdue ? `${Math.abs(daysUntil)}d late` : formatDate(item.dueDate)}
      </div>
    </div>
  );
}

export default PMDashboard;