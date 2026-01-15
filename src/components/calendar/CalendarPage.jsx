import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import CalendarWeekView from './CalendarWeekView';
import CalendarMonthView from './CalendarMonthView';
import CalendarDayView from './CalendarDayView';
import { buildCalendarItems, getProjectColor } from '../../utils/calendarUtils';

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
  // eslint-disable-next-line no-unused-vars
  const [userFactoryCode, setUserFactoryCode] = useState(null); // Factory code for PC/Plant Manager filtering (used in fetchCalendarData)

  // Data
  const [projects, setProjects] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);

  // Edit modals
  const [editTask, setEditTask] = useState(null);
  const [editRFI, setEditRFI] = useState(null);
  const [editSubmittal, setEditSubmittal] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  // Roles that cannot edit tasks/items AND should only see their factory's data
  const factoryRestrictedRoles = ['project coordinator', 'pc', 'plant manager', 'sales_manager', 'sales manager'];
  const readOnlyRoles = ['project coordinator', 'pc', 'plant manager'];
  // PM roles that should only see their assigned projects
  const pmRoles = ['project manager', 'pm'];
  // Sales roles
  const salesManagerRoles = ['sales_manager', 'sales manager'];
  const salesRepRoles = ['sales_rep', 'sales rep'];
  const canEdit = !readOnlyRoles.includes(currentUserRole.toLowerCase());
  // Note: These role checks are used inside fetchCalendarData, not directly in component render
   
  const _isFactoryRestricted = factoryRestrictedRoles.includes(currentUserRole.toLowerCase());
   
  const _isPM = pmRoles.includes(currentUserRole.toLowerCase());
   
  const _isSalesManager = salesManagerRoles.includes(currentUserRole.toLowerCase());
   
  const _isSalesRep = salesRepRoles.includes(currentUserRole.toLowerCase());

  useEffect(() => {
    fetchCalendarData();
  }, [user]);

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

        // Get factory code for PC/Plant Manager/Sales users
        // Users table has direct 'factory' column with factory code (e.g., 'PMI', 'NWBS')
        if (userData?.factory) {
          factoryCode = userData.factory;
          setUserFactoryCode(factoryCode);
        }
      }

      // Check if this user should only see their factory's data (PC/Plant Manager)
      const isFactoryRestrictedPM = ['project coordinator', 'pc', 'plant manager'].includes(userRole.toLowerCase()) && factoryCode;

      // Check if this user is a PM (should only see their assigned projects)
      const shouldFilterByPM = pmRoles.includes(userRole.toLowerCase()) && user?.id;

      // Check if this user is a Sales Manager (should see projects linked to factory quotes)
      const shouldFilterBySalesManager = salesManagerRoles.includes(userRole.toLowerCase()) && factoryCode;

      // Check if this user is a Sales Rep (should only see projects they're assigned to via quotes)
      const shouldFilterBySalesRep = salesRepRoles.includes(userRole.toLowerCase()) && user?.id;

      // Fetch all tasks, RFIs, submittals, milestones WITH embedded project info
      // This bypasses RLS issues where PC users can't read projects directly
      // Include PM assignment fields for PM filtering
      const baseQueries = [
        supabase.from('tasks').select('*, project:projects(id, name, project_number, factory, color, owner_id, primary_pm_id, backup_pm_id)'),
        supabase.from('rfis').select('*, project:projects(id, name, project_number, factory, color, owner_id, primary_pm_id, backup_pm_id)'),
        supabase.from('submittals').select('*, project:projects(id, name, project_number, factory, color, owner_id, primary_pm_id, backup_pm_id)'),
        supabase.from('milestones').select('*, project:projects(id, name, project_number, factory, color, owner_id, primary_pm_id, backup_pm_id)')
      ];

      // Track where quotes result will be in the results array
      let quotesResultIndex = null;

      // For Sales Manager, fetch all quotes in their factory to determine linked projects
      if (shouldFilterBySalesManager) {
        quotesResultIndex = baseQueries.length;
        baseQueries.push(
          supabase.from('sales_quotes').select('project_id, converted_to_project_id').eq('factory', factoryCode)
        );
      }

      // For Sales Reps, also fetch quotes to determine which projects they're assigned to
      // Note: Quotes use both project_id and converted_to_project_id to link to projects
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

      // Filter by factory for PC/Plant Manager users
      if (isFactoryRestrictedPM) {
        tasksData = tasksData.filter(t => t.project?.factory === factoryCode);
        rfisData = rfisData.filter(r => r.project?.factory === factoryCode);
        submittalsData = submittalsData.filter(s => s.project?.factory === factoryCode);
        milestonesData = milestonesData.filter(m => m.project?.factory === factoryCode);
      }

      // Filter by Sales Manager's factory quotes
      if (shouldFilterBySalesManager && quotesResult) {
        const linkedProjectIds = new Set();
        (quotesResult?.data || []).forEach(q => {
          if (q.project_id) linkedProjectIds.add(q.project_id);
          if (q.converted_to_project_id) linkedProjectIds.add(q.converted_to_project_id);
        });
        const isLinkedProject = (project) => project && linkedProjectIds.has(project.id);
        tasksData = tasksData.filter(t => isLinkedProject(t.project));
        rfisData = rfisData.filter(r => isLinkedProject(r.project));
        submittalsData = submittalsData.filter(s => isLinkedProject(s.project));
        milestonesData = milestonesData.filter(m => isLinkedProject(m.project));
      }

      // Filter by PM assignment for PM users
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

      // Filter by Sales Rep's assigned projects (via quotes)
      // Quotes can link to projects via either project_id or converted_to_project_id
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

      // Build projects from embedded data (fallback for RLS-blocked users)
      const embeddedProjectsMap = {};
      [...tasksData, ...rfisData, ...submittalsData, ...milestonesData].forEach(item => {
        if (item.project && item.project.id) {
          embeddedProjectsMap[item.project.id] = item.project;
        }
      });

      // Try to fetch all projects directly first
      let projectsData = [];
      const { data: allProjects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (allProjects && allProjects.length > 0) {
        projectsData = allProjects;
        // Also filter projects by factory for PC/Plant Manager users
        if (isFactoryRestrictedPM) {
          projectsData = projectsData.filter(p => p.factory === factoryCode);
        }
        // Also filter projects by PM assignment for PM users
        if (shouldFilterByPM) {
          projectsData = projectsData.filter(p =>
            p.owner_id === user.id ||
            p.primary_pm_id === user.id ||
            p.backup_pm_id === user.id
          );
        }
        // Also filter projects by Sales Manager's factory quotes
        if (shouldFilterBySalesManager && quotesResult) {
          const linkedProjectIds = new Set();
          (quotesResult?.data || []).forEach(q => {
            if (q.project_id) linkedProjectIds.add(q.project_id);
            if (q.converted_to_project_id) linkedProjectIds.add(q.converted_to_project_id);
          });
          projectsData = projectsData.filter(p => linkedProjectIds.has(p.id));
        }
        // Also filter projects by Sales Rep's assigned quotes
        if (shouldFilterBySalesRep && quotesResult) {
          const assignedProjectIds = new Set();
          (quotesResult?.data || []).forEach(q => {
            if (q.project_id) assignedProjectIds.add(q.project_id);
            if (q.converted_to_project_id) assignedProjectIds.add(q.converted_to_project_id);
          });
          projectsData = projectsData.filter(p => assignedProjectIds.has(p.id));
        }
      } else {
        // Fallback: use projects extracted from embedded joins (already filtered)
        projectsData = Object.values(embeddedProjectsMap);
      }

      // Assign colors to projects
      const projectsWithColors = (projectsData || []).map((project, index) => ({
        ...project,
        color: project.color || getProjectColor(project, index)
      }));

      setProjects(projectsWithColors);

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
    // PC and Plant Manager roles cannot edit items
    if (!canEdit) {
      showToast('View only - editing is restricted for your role', 'info');
      return;
    }

    // Open the appropriate edit modal
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
        // For project dates and milestones - no action needed currently
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
    <div style={{ height: 'calc(100vh - 64px)' }}>
      {/* Render appropriate view */}
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