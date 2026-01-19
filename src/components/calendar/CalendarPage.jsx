import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import CalendarWeekView from './CalendarWeekView';
import CalendarMonthView from './CalendarMonthView';
import CalendarDayView from './CalendarDayView';
import { buildCalendarItems, getProjectColor, ITEM_TYPE_CONFIG } from '../../utils/calendarUtils';
import {
  Calendar,
  Factory,
  Briefcase,
  Filter,
  ChevronDown,
  X,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  Flag,
  Truck,
  Play,
  Square
} from 'lucide-react';

// Import edit modals
import EditTaskModal from '../projects/EditTaskModal';
import EditRFIModal from '../projects/EditRFIModal';
import EditSubmittalModal from '../projects/EditSubmittalModal';

function CalendarPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('month'); // week, month, day
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [userFactoryCode, setUserFactoryCode] = useState(null);

  // View mode: 'all' | 'production' | 'pm'
  const [viewMode, setViewMode] = useState('all');

  // Filters
  const [filterFactory, setFilterFactory] = useState('all');
  const [filterTypes, setFilterTypes] = useState([]); // Empty = show all
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]); // Unfiltered for factory list
  const [calendarItems, setCalendarItems] = useState([]);
  const [allCalendarItems, setAllCalendarItems] = useState([]); // Unfiltered

  // Edit modals
  const [editTask, setEditTask] = useState(null);
  const [editRFI, setEditRFI] = useState(null);
  const [editSubmittal, setEditSubmittal] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  // Roles configuration
  const factoryRestrictedRoles = ['project coordinator', 'pc', 'plant manager', 'plant_manager', 'plant_gm', 'sales_manager', 'sales manager'];
  const readOnlyRoles = ['project coordinator', 'pc', 'plant manager', 'plant_manager', 'plant_gm'];
  const pmRoles = ['project manager', 'pm'];
  const salesManagerRoles = ['sales_manager', 'sales manager'];
  const salesRepRoles = ['sales_rep', 'sales rep'];
  const canEdit = !readOnlyRoles.includes(currentUserRole.toLowerCase());

  // Item types for filtering
  const itemTypes = [
    { id: 'task', label: 'Tasks', icon: CheckSquare, color: '#3B82F6' },
    { id: 'rfi', label: 'RFIs', icon: MessageSquare, color: '#F59E0B' },
    { id: 'submittal', label: 'Submittals', icon: ClipboardList, color: '#8B5CF6' },
    { id: 'milestone', label: 'Milestones', icon: Flag, color: '#22C55E' },
    { id: 'online_date', label: 'Online', icon: Play, color: '#22C55E' },
    { id: 'offline_date', label: 'Offline', icon: Square, color: '#64748B' },
    { id: 'delivery_date', label: 'Delivery', icon: Truck, color: '#FF6B35' }
  ];

  // Get unique factories from projects
  const factories = useMemo(() => {
    const factorySet = new Set(allProjects.map(p => p.factory).filter(Boolean));
    return Array.from(factorySet).sort();
  }, [allProjects]);

  useEffect(() => {
    fetchCalendarData();
  }, [user]);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [viewMode, filterFactory, filterTypes, allCalendarItems, allProjects]);

  const applyFilters = () => {
    let filteredItems = [...allCalendarItems];
    let filteredProjects = [...allProjects];

    // Filter by view mode (Production vs PM)
    if (viewMode === 'production') {
      // Production view: Only show project dates (online, offline, delivery)
      const productionTypes = ['online_date', 'offline_date', 'delivery_date'];
      filteredItems = filteredItems.filter(item => productionTypes.includes(item.type));
    } else if (viewMode === 'pm') {
      // PM view: Show tasks, RFIs, submittals, milestones
      const pmTypes = ['task', 'rfi', 'submittal', 'milestone'];
      filteredItems = filteredItems.filter(item => pmTypes.includes(item.type));
    }

    // Filter by factory
    if (filterFactory !== 'all') {
      const factoryProjectIds = new Set(
        filteredProjects.filter(p => p.factory === filterFactory).map(p => p.id)
      );
      filteredItems = filteredItems.filter(item => factoryProjectIds.has(item.projectId));
      filteredProjects = filteredProjects.filter(p => p.factory === filterFactory);
    }

    // Filter by item types
    if (filterTypes.length > 0) {
      filteredItems = filteredItems.filter(item => filterTypes.includes(item.type));
    }

    setCalendarItems(filteredItems);
    setProjects(filteredProjects);
  };

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      // Fetch current user role and factory assignment
      let userRole = '';
      let factoryCode = null;

      if (user?.id) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, factory')
          .eq('id', user.id)
          .single();

        if (userData?.role) {
          userRole = userData.role;
          setCurrentUserRole(userData.role);
        }

        if (userData?.factory) {
          factoryCode = userData.factory;
          setUserFactoryCode(factoryCode);
        }
      }

      // Check role-based filtering
      const isFactoryRestrictedPM = factoryRestrictedRoles.some(r => userRole.toLowerCase() === r) && factoryCode;
      const shouldFilterByPM = pmRoles.includes(userRole.toLowerCase()) && user?.id;
      const shouldFilterBySalesManager = salesManagerRoles.includes(userRole.toLowerCase()) && factoryCode;
      const shouldFilterBySalesRep = salesRepRoles.includes(userRole.toLowerCase()) && user?.id;

      // Fetch all data
      const baseQueries = [
        supabase.from('tasks').select('*, project:projects(id, name, project_number, factory, color, owner_id, primary_pm_id, backup_pm_id)'),
        supabase.from('rfis').select('*, project:projects(id, name, project_number, factory, color, owner_id, primary_pm_id, backup_pm_id)'),
        supabase.from('submittals').select('*, project:projects(id, name, project_number, factory, color, owner_id, primary_pm_id, backup_pm_id)'),
        supabase.from('milestones').select('*, project:projects(id, name, project_number, factory, color, owner_id, primary_pm_id, backup_pm_id)')
      ];

      let quotesResultIndex = null;

      if (shouldFilterBySalesRep) {
        quotesResultIndex = baseQueries.length;
        baseQueries.push(
          supabase.from('sales_quotes').select('project_id, converted_to_project_id').eq('assigned_to', user.id)
        );
      }

      const results = await Promise.all(baseQueries);
      const [tasksResult, rfisResult, submittalsResult, milestonesResult] = results;
      const quotesResult = quotesResultIndex !== null ? results[quotesResultIndex] : null;

      let tasksData = tasksResult.data || [];
      let rfisData = rfisResult.data || [];
      let submittalsData = submittalsResult.data || [];
      let milestonesData = milestonesResult.data || [];

      // Apply role-based filtering
      if (isFactoryRestrictedPM) {
        tasksData = tasksData.filter(t => t.project?.factory === factoryCode);
        rfisData = rfisData.filter(r => r.project?.factory === factoryCode);
        submittalsData = submittalsData.filter(s => s.project?.factory === factoryCode);
        milestonesData = milestonesData.filter(m => m.project?.factory === factoryCode);
      }

      if (shouldFilterBySalesManager && factoryCode) {
        tasksData = tasksData.filter(t => t.project?.factory === factoryCode);
        rfisData = rfisData.filter(r => r.project?.factory === factoryCode);
        submittalsData = submittalsData.filter(s => s.project?.factory === factoryCode);
        milestonesData = milestonesData.filter(m => m.project?.factory === factoryCode);
      }

      if (shouldFilterByPM) {
        const isAssignedToUser = (project) => {
          if (!project) return false;
          return project.owner_id === user.id ||
                 project.primary_pm_id === user.id ||
                 project.backup_pm_id === user.id;
        };
        tasksData = tasksData.filter(t => isAssignedToUser(t.project));
        rfisData = rfisData.filter(r => isAssignedToUser(r.project));
        submittalsData = submittalsData.filter(s => isAssignedToUser(s.project));
        milestonesData = milestonesData.filter(m => isAssignedToUser(m.project));
      }

      if (shouldFilterBySalesRep && quotesResult) {
        const assignedProjectIds = new Set();
        (quotesResult?.data || []).forEach(q => {
          if (q.project_id) assignedProjectIds.add(q.project_id);
          if (q.converted_to_project_id) assignedProjectIds.add(q.converted_to_project_id);
        });
        const isAssignedProject = (project) => project && assignedProjectIds.has(project.id);
        tasksData = tasksData.filter(t => isAssignedProject(t.project));
        rfisData = rfisData.filter(r => isAssignedProject(r.project));
        submittalsData = submittalsData.filter(s => isAssignedProject(s.project));
        milestonesData = milestonesData.filter(m => isAssignedProject(m.project));
      }

      // Build projects from embedded data
      const embeddedProjectsMap = {};
      [...tasksData, ...rfisData, ...submittalsData, ...milestonesData].forEach(item => {
        if (item.project && item.project.id) {
          embeddedProjectsMap[item.project.id] = item.project;
        }
      });

      // Fetch all projects
      let projectsData = [];
      const { data: allProjectsData } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (allProjectsData && allProjectsData.length > 0) {
        projectsData = allProjectsData;

        if (isFactoryRestrictedPM) {
          projectsData = projectsData.filter(p => p.factory === factoryCode);
        }
        if (shouldFilterByPM) {
          projectsData = projectsData.filter(p =>
            p.owner_id === user.id ||
            p.primary_pm_id === user.id ||
            p.backup_pm_id === user.id
          );
        }
        if (shouldFilterBySalesManager && factoryCode) {
          projectsData = projectsData.filter(p => p.factory === factoryCode);
        }
        if (shouldFilterBySalesRep && quotesResult) {
          const assignedProjectIds = new Set();
          (quotesResult?.data || []).forEach(q => {
            if (q.project_id) assignedProjectIds.add(q.project_id);
            if (q.converted_to_project_id) assignedProjectIds.add(q.converted_to_project_id);
          });
          projectsData = projectsData.filter(p => assignedProjectIds.has(p.id));
        }
      } else {
        projectsData = Object.values(embeddedProjectsMap);
      }

      // Assign colors to projects
      const projectsWithColors = (projectsData || []).map((project, index) => ({
        ...project,
        color: project.color || getProjectColor(project, index)
      }));

      setAllProjects(projectsWithColors);

      // Build calendar items
      const items = buildCalendarItems(
        projectsWithColors,
        tasksData,
        rfisData,
        submittalsData,
        milestonesData
      );
      setAllCalendarItems(items);

    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setCurrentView('day');
  };

  const handleItemClick = (item) => {
    if (!canEdit) {
      showToast('View only - editing is restricted for your role', 'info');
      return;
    }

    switch (item.type) {
      case 'task':
        setEditTask(item.data);
        break;
      case 'rfi':
        setEditRFI(item.data);
        break;
      case 'submittal':
        setEditSubmittal(item.data);
        break;
      default:
        break;
    }
  };

  const handleEditSuccess = () => {
    showToast('Item updated successfully');
    fetchCalendarData();
  };

  const handleDeleteSuccess = () => {
    showToast('Item deleted');
    fetchCalendarData();
  };

  const toggleTypeFilter = (typeId) => {
    setFilterTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const clearFilters = () => {
    setViewMode('all');
    setFilterFactory('all');
    setFilterTypes([]);
  };

  const hasActiveFilters = viewMode !== 'all' || filterFactory !== 'all' || filterTypes.length > 0;

  // Styles
  const styles = {
    container: {
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column'
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      flexWrap: 'wrap',
      gap: '12px'
    },
    toolbarLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    toolbarRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    viewModeToggle: {
      display: 'flex',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      padding: '3px',
      gap: '2px'
    },
    viewModeBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      background: 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      fontSize: '0.8125rem',
      fontWeight: '500',
      color: 'var(--text-secondary)',
      transition: 'all 0.15s ease'
    },
    viewModeBtnActive: {
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-sm)'
    },
    filterBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      background: hasActiveFilters ? 'rgba(255, 107, 53, 0.15)' : 'var(--bg-tertiary)',
      border: hasActiveFilters ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      fontSize: '0.8125rem',
      fontWeight: '500',
      color: hasActiveFilters ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
      transition: 'all 0.15s ease'
    },
    dropdown: {
      position: 'relative',
      display: 'inline-block'
    },
    select: {
      appearance: 'none',
      padding: '8px 32px 8px 12px',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.8125rem',
      fontWeight: '500',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      minWidth: '140px'
    },
    selectIcon: {
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--text-tertiary)'
    },
    filterPanel: {
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    },
    filterLabel: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--text-tertiary)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    typeChip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: '500',
      cursor: 'pointer',
      border: '1px solid transparent',
      transition: 'all 0.15s ease'
    },
    clearBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      background: 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: 'var(--text-tertiary)',
      cursor: 'pointer'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '18px',
      height: '18px',
      padding: '0 6px',
      borderRadius: '9px',
      fontSize: '0.6875rem',
      fontWeight: '600',
      background: 'var(--sunbelt-orange)',
      color: 'white'
    },
    calendarContent: {
      flex: 1,
      overflow: 'hidden'
    },
    stats: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      fontSize: '0.75rem',
      color: 'var(--text-tertiary)'
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  };

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
          Loading calendar...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Enhanced Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          {/* View Mode Toggle */}
          <div style={styles.viewModeToggle}>
            <button
              style={{
                ...styles.viewModeBtn,
                ...(viewMode === 'all' ? styles.viewModeBtnActive : {})
              }}
              onClick={() => setViewMode('all')}
            >
              <Calendar size={14} />
              All
            </button>
            <button
              style={{
                ...styles.viewModeBtn,
                ...(viewMode === 'production' ? styles.viewModeBtnActive : {})
              }}
              onClick={() => setViewMode('production')}
            >
              <Factory size={14} />
              Production
            </button>
            <button
              style={{
                ...styles.viewModeBtn,
                ...(viewMode === 'pm' ? styles.viewModeBtnActive : {})
              }}
              onClick={() => setViewMode('pm')}
            >
              <Briefcase size={14} />
              PM
            </button>
          </div>

          {/* Factory Filter */}
          {factories.length > 1 && (
            <div style={styles.dropdown}>
              <select
                value={filterFactory}
                onChange={(e) => setFilterFactory(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Factories</option>
                {factories.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <ChevronDown size={14} style={styles.selectIcon} />
            </div>
          )}

          {/* Filter Toggle */}
          <button
            style={styles.filterBtn}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            Types
            {filterTypes.length > 0 && (
              <span style={styles.badge}>{filterTypes.length}</span>
            )}
          </button>
        </div>

        <div style={styles.toolbarRight}>
          {/* Stats */}
          <div style={styles.stats}>
            <span style={styles.statItem}>
              <strong>{calendarItems.length}</strong> items
            </span>
            <span style={styles.statItem}>
              <strong>{projects.length}</strong> projects
            </span>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button style={styles.clearBtn} onClick={clearFilters}>
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Type Filters Panel */}
      {showFilters && (
        <div style={styles.filterPanel}>
          <span style={styles.filterLabel}>Item Types:</span>
          {itemTypes.map(type => {
            const isActive = filterTypes.length === 0 || filterTypes.includes(type.id);
            const isSelected = filterTypes.includes(type.id);
            const Icon = type.icon;

            return (
              <button
                key={type.id}
                onClick={() => toggleTypeFilter(type.id)}
                style={{
                  ...styles.typeChip,
                  background: isSelected ? `${type.color}20` : 'var(--bg-tertiary)',
                  borderColor: isSelected ? type.color : 'var(--border-color)',
                  color: isSelected ? type.color : 'var(--text-secondary)',
                  opacity: isActive ? 1 : 0.5
                }}
              >
                <Icon size={12} />
                {type.label}
              </button>
            );
          })}

          {filterTypes.length > 0 && (
            <button
              style={styles.clearBtn}
              onClick={() => setFilterTypes([])}
            >
              Show All
            </button>
          )}
        </div>
      )}

      {/* Calendar Content */}
      <div style={styles.calendarContent}>
        {currentView === 'week' && (
          <CalendarWeekView
            items={calendarItems}
            projects={projects}
            onItemClick={handleItemClick}
            onDateClick={handleDateClick}
            onViewChange={handleViewChange}
            canEdit={canEdit}
          />
        )}

        {currentView === 'month' && (
          <CalendarMonthView
            items={calendarItems}
            projects={projects}
            onItemClick={handleItemClick}
            onDateClick={handleDateClick}
            onViewChange={handleViewChange}
            initialDate={selectedDate}
            canEdit={canEdit}
          />
        )}

        {currentView === 'day' && (
          <CalendarDayView
            items={calendarItems}
            projects={projects}
            onItemClick={handleItemClick}
            onViewChange={handleViewChange}
            initialDate={selectedDate}
            canEdit={canEdit}
          />
        )}
      </div>

      {/* Edit Task Modal */}
      {editTask && (
        <EditTaskModal
          isOpen={true}
          onClose={() => setEditTask(null)}
          task={editTask}
          projectId={editTask.project_id}
          projectName={editTask.project?.name || ''}
          projectNumber={editTask.project?.project_number || ''}
          onSuccess={() => {
            setEditTask(null);
            handleEditSuccess();
          }}
          onDelete={() => {
            setEditTask(null);
            handleDeleteSuccess();
          }}
        />
      )}

      {/* Edit RFI Modal */}
      {editRFI && (
        <EditRFIModal
          isOpen={true}
          onClose={() => setEditRFI(null)}
          rfi={editRFI}
          projectName={editRFI.project?.name || ''}
          projectNumber={editRFI.project?.project_number || ''}
          factoryCode={editRFI.project?.factory || ''}
          onSuccess={() => {
            setEditRFI(null);
            handleEditSuccess();
          }}
          onDelete={() => {
            setEditRFI(null);
            handleDeleteSuccess();
          }}
        />
      )}

      {/* Edit Submittal Modal */}
      {editSubmittal && (
        <EditSubmittalModal
          isOpen={true}
          onClose={() => setEditSubmittal(null)}
          submittal={editSubmittal}
          onSuccess={() => {
            setEditSubmittal(null);
            handleEditSuccess();
          }}
          onDelete={() => {
            setEditSubmittal(null);
            handleDeleteSuccess();
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
