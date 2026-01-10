// ============================================================================
// ProjectDetails.jsx - Project Detail View (COMPLETE VERSION)
// ============================================================================
// Workspace style with:
// - Compact one-line header
// - Full-width tabs spanning content area
// - Consistent max-width for ALL tab content
// - Kanban as default view for Tasks
// - Floorplan tab restored
// - Calendar tab with ProjectCalendarMonth
// - Week calendar on Overview tab
//
// FIXES (Jan 9, 2026):
// - ✅ FIXED: Removed duplicate Calendar tab
// - ✅ FIXED: Calendar tab now shows ProjectCalendarMonth
// - ✅ ADDED: ProjectCalendarWeek on Overview tab
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Edit,
  Plus,
  Search,
  X,
  ChevronRight,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  FolderOpen,
  Calendar,
  LayoutGrid,
  List,
  AlertCircle,
  ExternalLink,
  AlertTriangle,
  Flag,
  Map,
  GripVertical,
  GitGraph
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Modal imports
import EditProjectModal from './EditProjectModal';
import AddTaskModal from './AddTaskModal';
import EditTaskModal from './EditTaskModal';
import AddRFIModal from './AddRFIModal';
import EditRFIModal from './EditRFIModal';
import AddSubmittalModal from './AddSubmittalModal';
import EditSubmittalModal from './EditSubmittalModal';
import AddMilestoneModal from './AddMilestoneModal';
import { FloorPlansTab } from '../floorplans';

// ✅ ADDED: Calendar imports
import ProjectCalendarMonth from './ProjectCalendarMonth';
import ProjectCalendarWeek from './ProjectCalendarWeek';

// ✅ ADDED: Workflow imports
import WorkflowTracker from './WorkflowTracker';

// ============================================================================
// CONSTANTS
// ============================================================================
// ✅ FIXED: Only ONE Calendar tab
// ✅ ADDED: Workflow tab for project lifecycle tracking
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'workflow', label: 'Workflow', icon: GitGraph },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'rfis', label: 'RFIs', icon: MessageSquare },
  { id: 'submittals', label: 'Submittals', icon: ClipboardList },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'floorplan', label: 'Floorplan', icon: Map },
];

// Updated Jan 9, 2026: 'On Hold' and 'Blocked' merged into 'Awaiting Response'
const TASK_STATUS_OPTIONS = ['All', 'Not Started', 'In Progress', 'Awaiting Response', 'Completed', 'Cancelled'];
const RFI_STATUS_OPTIONS = ['All', 'Draft', 'Open', 'Answered', 'Closed'];
const SUBMITTAL_STATUS_OPTIONS = ['All', 'Pending', 'Submitted', 'Under Review', 'Approved', 'Approved as Noted', 'Revise and Resubmit', 'Rejected'];

const TAB_CONTENT_MAX_WIDTH = '1400px';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatCurrency = (value) => {
  if (!value) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const getStatusColor = (status) => {
  const colors = {
    // Project statuses
    'Planning': 'var(--sunbelt-orange)', 'Pre-PM': 'var(--sunbelt-orange)',
    'PM Handoff': 'var(--sunbelt-orange)',
    'In Progress': 'var(--sunbelt-orange)', 'On Hold': 'var(--text-tertiary)',
    'Completed': 'var(--success)', 'Cancelled': 'var(--danger)', 'Warranty': 'var(--info)',
    // Task statuses (Updated Jan 9, 2026)
    'Not Started': 'var(--text-tertiary)',
    'Awaiting Response': 'var(--warning)',
    // RFI statuses
    'Draft': 'var(--text-tertiary)', 'Open': 'var(--sunbelt-orange)',
    'Pending': 'var(--warning)', 'Answered': 'var(--success)', 'Closed': 'var(--text-tertiary)',
    // Submittal statuses
    'Submitted': 'var(--sunbelt-orange)', 'Under Review': 'var(--warning)',
    'Approved': 'var(--success)', 'Approved as Noted': 'var(--info)',
    'Revise and Resubmit': 'var(--warning)', 'Rejected': 'var(--danger)'
  };
  return colors[status] || 'var(--text-secondary)';
};

const getPriorityColor = (priority) => {
  const colors = { 'Critical': '#dc2626', 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#22c55e' };
  return colors[priority] || 'var(--text-secondary)';
};

const isOverdue = (dueDate, status, completedStatuses = []) => {
  if (!dueDate || completedStatuses.includes(status)) return false;
  return new Date(dueDate) < new Date();
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ProjectDetails({ project: initialProject, onBack, onUpdate, initialTab = null }) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab ? initialTab.toLowerCase() : 'overview');
  
  // Data
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [workflowStations, setWorkflowStations] = useState([]);
  const [projectWorkflowStatus, setProjectWorkflowStatus] = useState({});

  // Filters
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [taskView, setTaskView] = useState('kanban');
  
  const [rfiSearch, setRfiSearch] = useState('');
  const [rfiStatusFilter, setRfiStatusFilter] = useState('All');
  
  const [submittalSearch, setSubmittalSearch] = useState('');
  const [submittalStatusFilter, setSubmittalStatusFilter] = useState('All');

  // Modals
  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddRFI, setShowAddRFI] = useState(false);
  const [showAddSubmittal, setShowAddSubmittal] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editRFI, setEditRFI] = useState(null);
  const [editSubmittal, setEditSubmittal] = useState(null);

  // Kanban drag state
  const [draggedTask, setDraggedTask] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // TOAST
  // ==========================================================================
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchProjectData = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);

    try {
      const [tasksRes, rfisRes, submittalsRes, milestonesRes] = await Promise.all([
        supabase.from('tasks').select('*, assignee:assignee_id(id, name, email)').eq('project_id', project.id).order('due_date'),
        supabase.from('rfis').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
        supabase.from('submittals').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
        supabase.from('milestones').select('*').eq('project_id', project.id).order('due_date')
      ]);

      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
      setMilestones(milestonesRes.data || []);

      // Fetch workflow stations (reference data)
      const { data: stations } = await supabase
        .from('workflow_stations')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      setWorkflowStations(stations || []);

      // Fetch project-specific workflow status
      const { data: statusData } = await supabase
        .from('project_workflow_status')
        .select('*')
        .eq('project_id', project.id);

      // Convert to object keyed by station_key
      const statusMap = {};
      (statusData || []).forEach(s => {
        statusMap[s.station_key] = s.status;
      });
      setProjectWorkflowStatus(statusMap);

    } catch (error) {
      console.error('Error fetching project data:', error);
      showToast('Error loading project data', 'error');
    } finally {
      setLoading(false);
    }
  }, [project?.id, showToast]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================
  const stats = useMemo(() => {
    const taskCompleted = tasks.filter(t => t.status === 'Completed').length;
    const taskTotal = tasks.length;
    const rfiOpen = rfis.filter(r => r.status === 'Open' || r.status === 'Draft').length;
    const subPending = submittals.filter(s => !['Approved', 'Approved as Noted', 'Rejected'].includes(s.status)).length;
    return { taskCompleted, taskTotal, rfiOpen, subPending };
  }, [tasks, rfis, submittals]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title?.toLowerCase().includes(taskSearch.toLowerCase()) ||
        task.description?.toLowerCase().includes(taskSearch.toLowerCase());
      const matchesStatus = taskStatusFilter === 'All' || task.status === taskStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, taskSearch, taskStatusFilter]);

  const filteredRFIs = useMemo(() => {
    return rfis.filter(rfi => {
      const matchesSearch = rfi.subject?.toLowerCase().includes(rfiSearch.toLowerCase()) ||
        rfi.rfi_number?.toLowerCase().includes(rfiSearch.toLowerCase());
      const matchesStatus = rfiStatusFilter === 'All' || rfi.status === rfiStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rfis, rfiSearch, rfiStatusFilter]);

  const filteredSubmittals = useMemo(() => {
    return submittals.filter(sub => {
      const matchesSearch = sub.title?.toLowerCase().includes(submittalSearch.toLowerCase()) ||
        sub.submittal_number?.toLowerCase().includes(submittalSearch.toLowerCase());
      const matchesStatus = submittalStatusFilter === 'All' || sub.status === submittalStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submittals, submittalSearch, submittalStatusFilter]);

  // ==========================================================================
  // KANBAN HANDLERS
  // ==========================================================================
  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus) => {
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    const updatedTask = { ...draggedTask, status: newStatus };
    setTasks(prev => prev.map(t => t.id === draggedTask.id ? updatedTask : t));

    try {
      await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', draggedTask.id);
      showToast(`Task moved to ${newStatus}`);
    } catch (error) {
      setTasks(prev => prev.map(t => t.id === draggedTask.id ? draggedTask : t));
      showToast('Failed to update task', 'error');
    }
    setDraggedTask(null);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!project) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: 'var(--space-md)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Project not found</p>
        <button onClick={onBack} style={{ marginTop: 'var(--space-md)', padding: '8px 16px', background: 'var(--sunbelt-orange)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: project.color || 'var(--sunbelt-orange)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{project.name}</h1>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{project.project_number}</span>
              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.6875rem', fontWeight: '600', background: `${getStatusColor(project.status)}20`, color: getStatusColor(project.status) }}>
                {project.status}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {formatCurrency(project.contract_value)} &nbsp;•&nbsp; {project.client_name || '—'}
            </div>
          </div>
        </div>
        <button onClick={() => setShowEditProject(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
          <Edit size={14} /> Edit
        </button>
      </div>

      {/* ================================================================== */}
      {/* TABS                                                              */}
      {/* ================================================================== */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-color)', marginBottom: 'var(--space-lg)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          let badge = null;
          
          if (tab.id === 'tasks' && stats.taskTotal > 0) badge = `${stats.taskCompleted}/${stats.taskTotal}`;
          if (tab.id === 'rfis' && stats.rfiOpen > 0) badge = stats.rfiOpen;
          if (tab.id === 'submittals' && stats.subPending > 0) badge = stats.subPending;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
                padding: 'var(--space-md) var(--space-lg)',
                background: 'none', border: 'none',
                borderBottom: isActive ? '2px solid var(--sunbelt-orange)' : '2px solid transparent',
                color: isActive ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: isActive ? '600' : '500',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={16} />
              {tab.label}
              {badge && (
                <span style={{
                  padding: '1px 6px', borderRadius: '10px', fontSize: '0.6875rem', fontWeight: '600',
                  background: isActive ? 'var(--sunbelt-orange)' : 'var(--bg-tertiary)',
                  color: isActive ? 'white' : 'var(--text-secondary)'
                }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* TAB CONTENT                                                       */}
      {/* ================================================================== */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <div style={{ maxWidth: TAB_CONTENT_MAX_WIDTH, margin: '0 auto', padding: '0 var(--space-xl) var(--space-xl)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB - ✅ UPDATED with calendar */}
              {activeTab === 'overview' && (
                <OverviewTab
                  project={project}
                  stats={stats}
                  milestones={milestones}
                  tasks={tasks}
                  rfis={rfis}
                  submittals={submittals}
                  setEditTask={setEditTask}
                  setEditRFI={setEditRFI}
                  setEditSubmittal={setEditSubmittal}
                />
              )}

              {/* WORKFLOW TAB - ✅ NEW: Visual workflow progress tracker */}
              {activeTab === 'workflow' && (
                <WorkflowTracker
                  projectId={project.id}
                  stations={workflowStations}
                  tasks={tasks}
                  projectStatuses={projectWorkflowStatus}
                  onStationClick={(station, status, deadline) => {
                    console.log('Station clicked:', station, status, deadline);
                    // TODO: Open StationDetailModal when implemented
                  }}
                />
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && (
                <TasksTab
                  tasks={filteredTasks}
                  allTasks={tasks}
                  search={taskSearch}
                  setSearch={setTaskSearch}
                  statusFilter={taskStatusFilter}
                  setStatusFilter={setTaskStatusFilter}
                  view={taskView}
                  setView={setTaskView}
                  onAdd={() => setShowAddTask(true)}
                  onEdit={setEditTask}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  draggedTask={draggedTask}
                />
              )}

              {/* RFIs TAB */}
              {activeTab === 'rfis' && (
                <RFIsTab
                  rfis={filteredRFIs}
                  allRFIs={rfis}
                  search={rfiSearch}
                  setSearch={setRfiSearch}
                  statusFilter={rfiStatusFilter}
                  setStatusFilter={setRfiStatusFilter}
                  onAdd={() => setShowAddRFI(true)}
                  onEdit={setEditRFI}
                />
              )}

              {/* SUBMITTALS TAB */}
              {activeTab === 'submittals' && (
                <SubmittalsTab
                  submittals={filteredSubmittals}
                  allSubmittals={submittals}
                  search={submittalSearch}
                  setSearch={setSubmittalSearch}
                  statusFilter={submittalStatusFilter}
                  setStatusFilter={setSubmittalStatusFilter}
                  onAdd={() => setShowAddSubmittal(true)}
                  onEdit={setEditSubmittal}
                />
              )}

              {/* FILES TAB */}
              {activeTab === 'files' && (
                <PlaceholderTab icon={FolderOpen} message="File management coming soon" />
              )}

              {/* FLOORPLAN TAB */}
              {activeTab === 'floorplan' && (
                <FloorPlansTab
                  projectId={project.id}
                  projectNumber={project.project_number}
                  rfis={rfis}
                  submittals={submittals}
                  tasks={tasks}
                  showToast={showToast}
                  onDataRefresh={fetchProjectData}
                />
              )}

              {/* ✅ FIXED: CALENDAR TAB - Now uses ProjectCalendarMonth */}
              {activeTab === 'calendar' && (
                <ProjectCalendarMonth
                  project={project}
                  tasks={tasks}
                  rfis={rfis}
                  submittals={submittals}
                  milestones={milestones}
                  onItemClick={(item) => {
                    if (item.type === 'task') setEditTask(item.data);
                    else if (item.type === 'rfi') setEditRFI(item.data);
                    else if (item.type === 'submittal') setEditSubmittal(item.data);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* MODALS                                                            */}
      {/* ================================================================== */}
      <EditProjectModal
        isOpen={showEditProject}
        onClose={() => setShowEditProject(false)}
        project={project}
        onSuccess={(updated) => {
          setProject(updated);
          setShowEditProject(false);
          onUpdate?.(updated);
          showToast('Project updated');
        }}
      />

      <AddTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        projectId={project.id}
        projectName={project.name}
        projectNumber={project.project_number}
        onSuccess={() => {
          setShowAddTask(false);
          fetchProjectData();
          showToast('Task created');
        }}
      />

      {editTask && (
        <EditTaskModal
          isOpen={!!editTask}
          onClose={() => setEditTask(null)}
          task={editTask}
          projectId={project.id}
          projectName={project.name}
          projectNumber={project.project_number}
          onSuccess={() => {
            setEditTask(null);
            fetchProjectData();
            showToast('Task updated');
          }}
          onDelete={() => {
            setEditTask(null);
            fetchProjectData();
            showToast('Task deleted');
          }}
        />
      )}

      <AddRFIModal
        isOpen={showAddRFI}
        onClose={() => setShowAddRFI(false)}
        projectId={project.id}
        projectName={project.name}
        projectNumber={project.project_number}
        onSuccess={() => {
          setShowAddRFI(false);
          fetchProjectData();
          showToast('RFI created');
        }}
      />

      {editRFI && (
        <EditRFIModal
          isOpen={!!editRFI}
          onClose={() => setEditRFI(null)}
          rfi={editRFI}
          projectName={project.name}
          projectNumber={project.project_number}
          onSuccess={() => {
            setEditRFI(null);
            fetchProjectData();
            showToast('RFI updated');
          }}
          onDelete={() => {
            setEditRFI(null);
            fetchProjectData();
            showToast('RFI deleted');
          }}
        />
      )}

      <AddSubmittalModal
        isOpen={showAddSubmittal}
        onClose={() => setShowAddSubmittal(false)}
        projectId={project.id}
        projectName={project.name}
        projectNumber={project.project_number}
        onSuccess={() => {
          setShowAddSubmittal(false);
          fetchProjectData();
          showToast('Submittal created');
        }}
      />

      {editSubmittal && (
        <EditSubmittalModal
          isOpen={!!editSubmittal}
          onClose={() => setEditSubmittal(null)}
          submittal={editSubmittal}
          projectName={project.name}
          projectNumber={project.project_number}
          onSuccess={() => {
            setEditSubmittal(null);
            fetchProjectData();
            showToast('Submittal updated');
          }}
          onDelete={() => {
            setEditSubmittal(null);
            fetchProjectData();
            showToast('Submittal deleted');
          }}
        />
      )}

      <AddMilestoneModal
        isOpen={showAddMilestone}
        onClose={() => setShowAddMilestone(false)}
        projectId={project.id}
        onSuccess={() => {
          setShowAddMilestone(false);
          fetchProjectData();
          showToast('Milestone created');
        }}
      />

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 20px', color: 'white', borderRadius: 'var(--radius-md)',
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
// PLACEHOLDER TAB
// ============================================================================
function PlaceholderTab({ icon: Icon, message }) {
  return (
    <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
      <Icon size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
      <p>{message}</p>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB - ✅ UPDATED with ProjectCalendarWeek
// ============================================================================
function OverviewTab({ project, stats, milestones, tasks, rfis, submittals, setEditTask, setEditRFI, setEditSubmittal }) {
  return (
    <div>
      {/* Top Section: Project Info + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        {/* Project Info */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>Project Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <InfoItem label="Client" value={project.client_name} />
            <InfoItem label="Location" value={project.site_address} />
            <InfoItem label="Contract Value" value={formatCurrency(project.contract_value)} />
            <InfoItem label="Target Online" value={formatDate(project.target_online_date)} />
            <InfoItem label="Project Type" value={project.project_type} />
            <InfoItem label="Factory" value={project.factory_name || project.factory} />
          </div>
          {project.description && (
            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Description</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{project.description}</p>
            </div>
          )}
        </div>

        {/* Stats + Milestones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
            <StatCard icon={CheckSquare} label="Tasks Done" value={`${stats.taskCompleted}/${stats.taskTotal}`} color="var(--sunbelt-orange)" />
            <StatCard icon={MessageSquare} label="Open RFIs" value={stats.rfiOpen} color="var(--info)" />
            <StatCard icon={ClipboardList} label="Pending Subs" value={stats.subPending} color="var(--warning)" />
          </div>

          {/* Milestones */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
              <Flag size={16} style={{ color: 'var(--sunbelt-orange)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Milestones</h3>
            </div>
            {milestones.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No milestones yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {milestones.slice(0, 4).map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{m.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formatDate(m.due_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ ADDED: Week Calendar Section */}
      <div style={{ marginTop: 'var(--space-xl)' }}>
        <ProjectCalendarWeek
          project={project}
          tasks={tasks}
          rfis={rfis}
          submittals={submittals}
          milestones={milestones}
          onItemClick={(item) => {
            if (item.type === 'task') setEditTask(item.data);
            else if (item.type === 'rfi') setEditRFI(item.data);
            else if (item.type === 'submittal') setEditSubmittal(item.data);
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
function InfoItem({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{label}</span>
      <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: '500', marginTop: '2px' }}>{value || '—'}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
      <Icon size={24} style={{ color, marginBottom: 'var(--space-xs)' }} />
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
      />
    </div>
  );
}

// ============================================================================
// TASKS TAB
// ============================================================================
function TasksTab({ tasks, allTasks, search, setSearch, statusFilter, setStatusFilter, view, setView, onAdd, onEdit, onDragStart, onDragOver, onDrop, draggedTask }) {
  // Use the task statuses from TASK_STATUS_OPTIONS (excluding 'All')
  const kanbanStatuses = TASK_STATUS_OPTIONS.filter(s => s !== 'All');

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flex: 1 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer' }}>
            {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? `All Tasks (${allTasks.length})` : s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button onClick={() => setView('kanban')} style={{ padding: '6px 12px', background: view === 'kanban' ? 'var(--sunbelt-orange)' : 'var(--bg-primary)', color: view === 'kanban' ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
              <LayoutGrid size={14} /> Board
            </button>
            <button onClick={() => setView('list')} style={{ padding: '6px 12px', background: view === 'list' ? 'var(--sunbelt-orange)' : 'var(--bg-primary)', color: view === 'list' ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
              <List size={14} /> List
            </button>
          </div>
          <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-md)' }}>
          {kanbanStatuses.map(status => {
            const columnTasks = tasks.filter(t => t.status === status);
            return (
              <div
                key={status}
                onDragOver={onDragOver}
                onDrop={() => onDrop(status)}
                style={{ flex: '1', minWidth: '250px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(status) }} />
                    <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{status}</span>
                  </div>
                  <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{columnTasks.length}</span>
                </div>
                <div style={{ padding: 'var(--space-sm)', flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {columnTasks.map(task => (
                    <TaskCard key={task.id} task={task} onEdit={onEdit} onDragStart={onDragStart} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <DataTable
          columns={[
            { key: 'title', label: 'Task', render: (task) => (
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{task.title}</div>
                {task.assignee?.name && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{task.assignee.name}</div>}
              </div>
            )},
            { key: 'status', label: 'Status', render: (task) => (
              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600', background: `${getStatusColor(task.status)}20`, color: getStatusColor(task.status) }}>
                {task.status}
              </span>
            )},
            { key: 'priority', label: 'Priority', render: (task) => (
              <span style={{ fontSize: '0.8125rem', color: getPriorityColor(task.priority), fontWeight: '500' }}>{task.priority || 'Normal'}</span>
            )},
            { key: 'due_date', label: 'Due', render: (task) => {
              const isTaskOverdue = isOverdue(task.due_date, task.status, ['Completed', 'Cancelled']);
              return <span style={{ fontSize: '0.8125rem', color: isTaskOverdue ? 'var(--danger)' : 'var(--text-secondary)' }}>{formatDate(task.due_date)}</span>;
            }}
          ]}
          data={tasks}
          onRowClick={onEdit}
          emptyMessage="No tasks yet"
        />
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onDragStart }) {
  const isTaskOverdue = isOverdue(task.due_date, task.status, ['Completed', 'Cancelled']);
  
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={() => onEdit(task)}
      style={{ padding: 'var(--space-sm)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.15s' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-xs)' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-primary)', flex: 1 }}>{task.title}</span>
        <GripVertical size={14} style={{ color: 'var(--text-tertiary)', cursor: 'grab', flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
        {task.priority && <span style={{ fontSize: '0.6875rem', fontWeight: '600', color: getPriorityColor(task.priority) }}>{task.priority}</span>}
        {task.due_date && (
          <span style={{ fontSize: '0.6875rem', color: isTaskOverdue ? 'var(--danger)' : 'var(--text-tertiary)', fontWeight: isTaskOverdue ? '600' : '400' }}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
      {(task.assignee?.name || task.external_assignee_name) && (
        <div style={{ marginTop: 'var(--space-xs)', paddingTop: 'var(--space-xs)', borderTop: '1px solid var(--border-color)', fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {task.external_assignee_name || task.assignee?.name}
          {task.external_assignee_email && <ExternalLink size={10} style={{ color: 'var(--sunbelt-orange)' }} />}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RFIs TAB
// ============================================================================
function RFIsTab({ rfis, allRFIs, search, setSearch, statusFilter, setStatusFilter, onAdd, onEdit }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flex: 1 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search RFIs..." />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer' }}>
            {RFI_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? `All RFIs (${allRFIs.length})` : s}</option>)}
          </select>
        </div>
        <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
          <Plus size={16} /> Add RFI
        </button>
      </div>
      <DataTable
        columns={[
          { key: 'rfi_number', label: 'RFI #', render: (rfi) => <span style={{ fontWeight: '600', color: 'var(--sunbelt-orange)' }}>{rfi.rfi_number}</span> },
          { key: 'subject', label: 'Subject', render: (rfi) => <span style={{ color: 'var(--text-primary)' }}>{rfi.subject}</span> },
          { key: 'status', label: 'Status', render: (rfi) => (
            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600', background: `${getStatusColor(rfi.status)}20`, color: getStatusColor(rfi.status) }}>
              {rfi.status}
            </span>
          )},
          { key: 'due_date', label: 'Due', render: (rfi) => {
            const isRFIOverdue = isOverdue(rfi.due_date, rfi.status, ['Closed', 'Answered']);
            return <span style={{ fontSize: '0.8125rem', color: isRFIOverdue ? 'var(--danger)' : 'var(--text-secondary)' }}>{formatDate(rfi.due_date)}</span>;
          }}
        ]}
        data={rfis}
        onRowClick={onEdit}
        emptyMessage="No RFIs yet"
      />
    </div>
  );
}

// ============================================================================
// SUBMITTALS TAB
// ============================================================================
function SubmittalsTab({ submittals, allSubmittals, search, setSearch, statusFilter, setStatusFilter, onAdd, onEdit }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flex: 1 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search submittals..." />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer' }}>
            {SUBMITTAL_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? `All Submittals (${allSubmittals.length})` : s}</option>)}
          </select>
        </div>
        <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
          <Plus size={16} /> Add Submittal
        </button>
      </div>
      <DataTable
        columns={[
          { key: 'submittal_number', label: 'Sub #', render: (sub) => <span style={{ fontWeight: '600', color: 'var(--sunbelt-orange)' }}>{sub.submittal_number}</span> },
          { key: 'title', label: 'Title', render: (sub) => <span style={{ color: 'var(--text-primary)' }}>{sub.title}</span> },
          { key: 'submittal_type', label: 'Type', render: (sub) => <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{sub.submittal_type || '—'}</span> },
          { key: 'status', label: 'Status', render: (sub) => (
            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600', background: `${getStatusColor(sub.status)}20`, color: getStatusColor(sub.status) }}>
              {sub.status}
            </span>
          )},
          { key: 'due_date', label: 'Due', render: (sub) => {
            const isSubOverdue = isOverdue(sub.due_date, sub.status, ['Approved', 'Approved as Noted', 'Rejected']);
            return <span style={{ fontSize: '0.8125rem', color: isSubOverdue ? 'var(--danger)' : 'var(--text-secondary)' }}>{formatDate(sub.due_date)}</span>;
          }}
        ]}
        data={submittals}
        onRowClick={onEdit}
        emptyMessage="No submittals yet"
      />
    </div>
  );
}

// ============================================================================
// DATA TABLE COMPONENT
// ============================================================================
function DataTable({ columns, data, onRowClick, emptyMessage }) {
  if (data.length === 0) {
    return (
      <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            {columns.map(col => (
              <th key={col.key} style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', background: 'var(--bg-tertiary)' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick(row)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.15s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProjectDetails;