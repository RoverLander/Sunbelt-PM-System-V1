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
  const [userFactoryCode, setUserFactoryCode] = useState(null); // Factory code for PC/Plant Manager filtering

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
  const factoryRestrictedRoles = ['project coordinator', 'pc', 'plant manager'];
  const readOnlyRoles = ['project coordinator', 'pc', 'plant manager'];
  const canEdit = !readOnlyRoles.includes(currentUserRole.toLowerCase());
  const isFactoryRestricted = factoryRestrictedRoles.includes(currentUserRole.toLowerCase());

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
          .select('role, factory_id, factory:factories(code)')
          .eq('id', user.id)
          .single();

        if (userData?.role) {
          userRole = userData.role;
          setCurrentUserRole(userData.role);
        }

        // Get factory code for PC/Plant Manager users
        if (userData?.factory?.code) {
          factoryCode = userData.factory.code;
          setUserFactoryCode(factoryCode);
        }
      }

      // Check if this user should only see their factory's data
      const shouldFilterByFactory = factoryRestrictedRoles.includes(userRole.toLowerCase()) && factoryCode;

      // Fetch all tasks, RFIs, submittals, milestones WITH embedded project info
      // This bypasses RLS issues where PC users can't read projects directly
      const [tasksResult, rfisResult, submittalsResult, milestonesResult] = await Promise.all([
        supabase.from('tasks').select('*, project:projects(id, name, project_number, factory, color)'),
        supabase.from('rfis').select('*, project:projects(id, name, project_number, factory, color)'),
        supabase.from('submittals').select('*, project:projects(id, name, project_number, factory, color)'),
        supabase.from('milestones').select('*, project:projects(id, name, project_number, factory, color)')
      ]);

      let tasksData = tasksResult.data || [];
      let rfisData = rfisResult.data || [];
      let submittalsData = submittalsResult.data || [];
      let milestonesData = milestonesResult.data || [];

      // Filter by factory for PC/Plant Manager users
      if (shouldFilterByFactory) {
        tasksData = tasksData.filter(t => t.project?.factory === factoryCode);
        rfisData = rfisData.filter(r => r.project?.factory === factoryCode);
        submittalsData = submittalsData.filter(s => s.project?.factory === factoryCode);
        milestonesData = milestonesData.filter(m => m.project?.factory === factoryCode);
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
        // Also filter projects by factory for restricted users
        if (shouldFilterByFactory) {
          projectsData = projectsData.filter(p => p.factory === factoryCode);
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