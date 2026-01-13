// ============================================================================
// PMDashboard.jsx - Project Manager Command Center (Praxis Enhanced)
// ============================================================================
// Full-featured dashboard with:
// - Status indicators (portfolio health)
// - Overdue / Due Soon sections
// - Weekly calendar view
// - Gantt chart timeline
// - Active projects table
//
// PRAXIS ENHANCEMENTS (Jan 13, 2026):
// - Praxis fields in project cards (building type, sqft, modules, dealer)
// - Delivery Timeline view (30/60/90 days)
// - Urgent Delivery Alerts (next 14 days)
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
  ToggleRight,
  FileUp,
  Truck,
  Package,
  Star,
  Building2
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import CreateProjectModal from '../projects/CreateProjectModal';
import PraxisImportModal from '../projects/PraxisImportModal';

// ============================================================================
// CONSTANTS
// ============================================================================
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TOAST_DURATION = 3000;

// Active project statuses for filtering
const ACTIVE_STATUSES = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];

// Building type colors for Praxis fields
const BUILDING_TYPE_COLORS = {
  'CUSTOM': '#f59e0b',
  'FLEET/STOCK': '#3b82f6',
  'GOVERNMENT': '#22c55e',
  'Business': '#8b5cf6'
};

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

const formatSqft = (sqft) => {
  if (!sqft) return '';
  return `${sqft.toLocaleString()} sqft`;
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

// Helper to render icon inline (avoids component-during-render warning)
const renderItemIcon = (type, size, style) => {
  const IconComponent = getItemTypeIcon(type);
  return <IconComponent size={size} style={style} />;
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
  const [showPraxisImport, setShowPraxisImport] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [deliveryTimelineRange, setDeliveryTimelineRange] = useState(30); // 30, 60, 90 days
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
      // STEP 2: Fetch tasks, RFIs, submittals, milestones for MY projects
      // FIX: Use client-side filtering instead of .in() to avoid 400 errors
      // =====================================================================
      let tasksData = [];
      let rfisData = [];
      let submittalsData = [];
      let milestonesData = [];

      if (myProjectIds.length > 0) {
        const myProjectIdsSet = new Set(myProjectIds); // For O(1) lookup

        const [tasksRes, rfisRes, submittalsRes, milestonesRes] = await Promise.all([
          supabase.from('tasks').select(`
            *,
            project:project_id(id, name, project_number, color),
            assignee:assignee_id(id, name),
            internal_owner:internal_owner_id(id, name)
          `),

          supabase.from('rfis').select(`
            *,
            project:project_id(id, name, project_number, color)
          `),

          supabase.from('submittals').select(`
            *,
            project:project_id(id, name, project_number, color)
          `),

          supabase.from('milestones').select(`
            *,
            project:project_id(id, name, project_number, color)
          `)
        ]);

        if (tasksRes.error) console.warn('Tasks query failed:', tasksRes.error.message);
        if (rfisRes.error) console.warn('RFIs query failed:', rfisRes.error.message);
        if (submittalsRes.error) console.warn('Submittals query failed:', submittalsRes.error.message);
        if (milestonesRes.error) console.warn('Milestones query failed:', milestonesRes.error.message);

        // Client-side filtering by project IDs
        tasksData = (tasksRes.data || [])
          .filter(t => myProjectIdsSet.has(t.project_id))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        rfisData = (rfisRes.data || [])
          .filter(r => myProjectIdsSet.has(r.project_id))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        submittalsData = (submittalsRes.data || [])
          .filter(s => myProjectIdsSet.has(s.project_id))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        milestonesData = (milestonesRes.data || [])
          .filter(m => myProjectIdsSet.has(m.project_id))
          .sort((a, b) => new Date(a.due_date || '9999') - new Date(b.due_date || '9999'));
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
  // COMPUTED: URGENT DELIVERIES (next 14 days)
  // ==========================================================================
  const urgentDeliveries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activeProjects
      .filter(p => p.delivery_date || p.target_online_date)
      .map(p => {
        const deliveryDate = new Date((p.delivery_date || p.target_online_date) + 'T00:00:00');
        const daysUntil = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
        return { ...p, deliveryDate, daysUntil };
      })
      .filter(p => p.daysUntil >= 0 && p.daysUntil <= 14)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [activeProjects]);

  // ==========================================================================
  // COMPUTED: DELIVERY TIMELINE (30/60/90 days based on toggle)
  // ==========================================================================
  const deliveryTimeline = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activeProjects
      .filter(p => p.delivery_date || p.target_online_date)
      .map(p => {
        const deliveryDate = new Date((p.delivery_date || p.target_online_date) + 'T00:00:00');
        const daysUntil = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
        return { ...p, deliveryDate, daysUntil };
      })
      .filter(p => p.daysUntil >= 0 && p.daysUntil <= deliveryTimelineRange)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [activeProjects, deliveryTimelineRange]);

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
                <button
                  onClick={() => { setShowPraxisImport(true); setShowNewDropdown(false); }}
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
                  <FileUp size={16} />
                  Import from Praxis
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
      {/* URGENT DELIVERIES ALERT                                           */}
      {/* ================================================================== */}
      {urgentDeliveries.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.1))',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <Truck size={20} style={{ color: '#ef4444' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#ef4444' }}>
              Urgent Deliveries ({urgentDeliveries.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Next 14 days</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
            {urgentDeliveries.map(project => {
              const buildingTypeColor = BUILDING_TYPE_COLORS[project.building_type] || 'var(--text-tertiary)';
              return (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  style={{
                    flex: '0 0 auto',
                    minWidth: '200px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: project.daysUntil <= 3 ? '2px solid #ef4444' : '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {project.project_number}
                    </div>
                    <div style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.6875rem',
                      fontWeight: '700',
                      background: project.daysUntil <= 3 ? 'rgba(239, 68, 68, 0.2)' : project.daysUntil <= 7 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                      color: project.daysUntil <= 3 ? '#ef4444' : project.daysUntil <= 7 ? '#f59e0b' : '#22c55e'
                    }}>
                      {project.daysUntil === 0 ? 'Today' : project.daysUntil === 1 ? 'Tomorrow' : `${project.daysUntil}d`}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    {project.name}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {project.building_type && (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                        background: `${buildingTypeColor}20`,
                        color: buildingTypeColor
                      }}>
                        {project.building_type}
                      </span>
                    )}
                    {project.square_footage && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                        {formatSqft(project.square_footage)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  {items.slice(0, 3).map(item => (
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
                      {renderItemIcon(item.type, 10, { color: getItemTypeColor(item.type), flexShrink: 0 })}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                    </div>
                  ))}
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
      {/* DELIVERY TIMELINE                                                 */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: 'var(--space-md)',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Truck size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Delivery Timeline ({deliveryTimeline.length})
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {[30, 60, 90].map(days => (
              <button
                key={days}
                onClick={() => setDeliveryTimelineRange(days)}
                style={{
                  padding: '4px 12px',
                  background: deliveryTimelineRange === days ? 'var(--sunbelt-orange)' : 'var(--bg-primary)',
                  color: deliveryTimelineRange === days ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        {deliveryTimeline.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>
            No deliveries in the next {deliveryTimelineRange} days
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deliveryTimeline.map(project => {
              const buildingTypeColor = BUILDING_TYPE_COLORS[project.building_type] || 'var(--text-tertiary)';
              const urgencyColor = project.daysUntil <= 7 ? '#ef4444' : project.daysUntil <= 14 ? '#f59e0b' : '#22c55e';

              return (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                >
                  {/* Days indicator */}
                  <div style={{
                    minWidth: '50px',
                    textAlign: 'center',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    background: `${urgencyColor}15`,
                    border: `1px solid ${urgencyColor}30`
                  }}>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: urgencyColor }}>
                      {project.daysUntil}
                    </div>
                    <div style={{ fontSize: '0.5625rem', color: urgencyColor, textTransform: 'uppercase' }}>
                      days
                    </div>
                  </div>

                  {/* Project info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        {project.project_number}
                      </span>
                      {project.building_type && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          background: `${buildingTypeColor}20`,
                          color: buildingTypeColor
                        }}>
                          {project.building_type}
                        </span>
                      )}
                      {project.difficulty_rating && (
                        <span style={{ display: 'flex', gap: '1px' }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star
                              key={n}
                              size={10}
                              fill={n <= project.difficulty_rating ? '#f59e0b' : 'transparent'}
                              style={{ color: n <= project.difficulty_rating ? '#f59e0b' : 'var(--text-tertiary)' }}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {project.name}
                    </div>
                  </div>

                  {/* Specs */}
                  <div style={{ textAlign: 'right' }}>
                    {(project.square_footage || project.module_count) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {project.square_footage ? formatSqft(project.square_footage) : ''}
                        {project.square_footage && project.module_count ? ' • ' : ''}
                        {project.module_count ? `${project.module_count} mod` : ''}
                      </div>
                    )}
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                      {formatDate(project.delivery_date || project.target_online_date)}
                    </div>
                  </div>

                  <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              );
            })}
          </div>
        )}
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
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Type</th>
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
                  const buildingTypeColor = BUILDING_TYPE_COLORS[project.building_type] || 'var(--text-tertiary)';

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
                            {project.dealer_name && (
                              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{project.dealer_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        {project.building_type ? (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: '600',
                            background: `${buildingTypeColor}20`,
                            color: buildingTypeColor
                          }}>
                            {project.building_type}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>-</span>
                        )}
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
                      <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {formatDate(project.delivery_date || project.target_online_date)}
                        </div>
                        {project.promised_delivery_date && project.promised_delivery_date !== project.delivery_date && (
                          <div style={{ fontSize: '0.6875rem', color: '#f59e0b' }}>
                            Promised: {formatDate(project.promised_delivery_date)}
                          </div>
                        )}
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

      <PraxisImportModal
        isOpen={showPraxisImport}
        onClose={() => setShowPraxisImport(false)}
        onSuccess={(importedProjects) => {
          setShowPraxisImport(false);
          fetchDashboardData();
          const count = Array.isArray(importedProjects) ? importedProjects.length : 1;
          showToast(`${count} project(s) imported from Praxis`);
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
      {renderItemIcon(item.type, 14, { color: getItemTypeColor(item.type), flexShrink: 0 })}
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