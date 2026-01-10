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
  
  // Data
  const [projects, setProjects] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  
  // Edit modals
  const [editTask, setEditTask] = useState(null);
  const [editRFI, setEditRFI] = useState(null);
  const [editSubmittal, setEditSubmittal] = useState(null);
  
  // Toast
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [user]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      // Fetch all projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      // Fetch all tasks with project info
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(id, name, project_number, color),
          assignee:assignee_id(name),
          internal_owner:internal_owner_id(name)
        `);

      // Fetch all RFIs with project info
      const { data: rfisData } = await supabase
        .from('rfis')
        .select(`
          *,
          project:project_id(id, name, project_number, color)
        `);

      // Fetch all submittals with project info
      const { data: submittalsData } = await supabase
        .from('submittals')
        .select(`
          *,
          project:project_id(id, name, project_number, color)
        `);

      // Fetch all milestones with project info
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select(`
          *,
          project:project_id(id, name, project_number, color)
        `);

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
        />
      )}
      
      {currentView === 'day' && (
        <CalendarDayView
          items={calendarItems}
          projects={projects}
          onItemClick={handleItemClick}
          onViewChange={handleViewChange}
          initialDate={selectedDate}
        />
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <EditTaskModal
          isOpen={true}
          onClose={() => setEditTask(null)}
          task={editTask}
          projectId={editTask.project_id}
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