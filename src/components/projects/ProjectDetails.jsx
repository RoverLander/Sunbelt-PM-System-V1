// ============================================================================
// ProjectDetails.jsx - Project Detail View (COMPLETE VERSION)
// ============================================================================
// Workspace style with:
// - Compact one-line header
// - Full-width tabs spanning content area
// - Consistent max-width for ALL tab content
// - Kanban as default view for Tasks
// - Floorplan tab restored
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
  GripVertical
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

// ============================================================================
// CONSTANTS
// ============================================================================
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'rfis', label: 'RFIs', icon: MessageSquare },
  { id: 'submittals', label: 'Submittals', icon: ClipboardList },
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'floorplan', label: 'Floorplan', icon: Map },
  { id: 'calendar', label: 'Calendar', icon: Calendar }
];

const TASK_STATUS_OPTIONS = ['All', 'Not Started', 'In Progress', 'On Hold', 'Blocked', 'Completed'];
const RFI_STATUS_OPTIONS = ['All', 'Draft', 'Open', 'Pending', 'Answered', 'Closed'];
const SUBMITTAL_STATUS_OPTIONS = ['All', 'Pending', 'Submitted', 'Under Review', 'Approved', 'Approved as Noted', 'Revise and Resubmit', 'Rejected'];

// Kanban column configuration - Title Case to match database
const KANBAN_COLUMNS = [
  { id: 'Not Started', label: 'Not Started', color: 'var(--text-tertiary)' },
  { id: 'In Progress', label: 'In Progress', color: 'var(--sunbelt-orange)' },
  { id: 'On Hold', label: 'On Hold', color: 'var(--warning)' },
  { id: 'Completed', label: 'Completed', color: 'var(--success)' }
];

// Consistent content width for all tabs
const TAB_CONTENT_MAX_WIDTH = '1200px';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (amount) => {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const getStatusColor = (status) => {
  const colors = {
    // Project statuses
    'Planning': 'var(--info)', 'Pre-PM': 'var(--warning)', 'PM Handoff': 'var(--sunbelt-orange)',
    'In Progress': 'var(--sunbelt-orange)', 'On Hold': 'var(--text-tertiary)',
    'Completed': 'var(--success)', 'Cancelled': 'var(--danger)', 'Warranty': 'var(--info)',
    // Task statuses
    'Not Started': 'var(--text-tertiary)', 'Blocked': 'var(--danger)',
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

  // Filters
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [taskView, setTaskView] = useState('kanban'); // DEFAULT: Kanban view
  
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
    setLoading(true);
    try {
      const [projectRes, tasksRes, rfisRes, submittalsRes, milestonesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', project.id).single(),
        supabase.from('tasks')
          .select('*, assignee:assignee_id(id, name), internal_owner:internal_owner_id(id, name)')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false }),
        supabase.from('rfis')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false }),
        supabase.from('submittals')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false }),
        supabase.from('milestones')
          .select('*')
          .eq('project_id', project.id)
          .order('due_date', { ascending: true })
      ]);

      if (projectRes.data) setProject(projectRes.data);
      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
      setMilestones(milestonesRes.data || []);
    } catch (error) {
      console.error('Error fetching project data:', error);
      showToast('Failed to load project data', 'error');
    } finally {
      setLoading(false);
    }
  }, [project.id, showToast]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Set initial tab if provided
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab.toLowerCase());
    }
  }, [initialTab]);

  // ==========================================================================
  // FILTERED DATA
  // ==========================================================================
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (taskStatusFilter !== 'All' && task.status !== taskStatusFilter) return false;
      if (taskSearch) {
        const search = taskSearch.toLowerCase();
        if (!task.title?.toLowerCase().includes(search) && !task.description?.toLowerCase().includes(search)) return false;
      }
      return true;
    });
  }, [tasks, taskStatusFilter, taskSearch]);

  const filteredRFIs = useMemo(() => {
    return rfis.filter(rfi => {
      if (rfiStatusFilter !== 'All' && rfi.status !== rfiStatusFilter) return false;
      if (rfiSearch) {
        const search = rfiSearch.toLowerCase();
        if (!rfi.rfi_number?.toLowerCase().includes(search) && 
            !rfi.subject?.toLowerCase().includes(search) &&
            !rfi.sent_to?.toLowerCase().includes(search)) return false;
      }
      return true;
    });
  }, [rfis, rfiStatusFilter, rfiSearch]);

  const filteredSubmittals = useMemo(() => {
    return submittals.filter(sub => {
      if (submittalStatusFilter !== 'All' && sub.status !== submittalStatusFilter) return false;
      if (submittalSearch) {
        const search = submittalSearch.toLowerCase();
        if (!sub.submittal_number?.toLowerCase().includes(search) && 
            !sub.title?.toLowerCase().includes(search) &&
            !sub.manufacturer?.toLowerCase().includes(search)) return false;
      }
      return true;
    });
  }, [submittals, submittalStatusFilter, submittalSearch]);

  // ==========================================================================
  // STATS
  // ==========================================================================
  const stats = useMemo(() => ({
    taskTotal: tasks.length,
    taskCompleted: tasks.filter(t => t.status === 'Completed').length,
    rfiOpen: rfis.filter(r => !['Closed', 'Answered'].includes(r.status)).length,
    rfiTotal: rfis.length,
    subPending: submittals.filter(s => !['Approved', 'Approved as Noted', 'Rejected'].includes(s.status)).length,
    subTotal: submittals.length
  }), [tasks, rfis, submittals]);

  // ==========================================================================
  // KANBAN HANDLERS
  // ==========================================================================
  const handleDragStart = useCallback((e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e, newStatus) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', draggedTask.id);
      
      if (error) throw error;
      
      setTasks(prev => prev.map(t => t.id === draggedTask.id ? { ...t, status: newStatus } : t));
      showToast(`Task moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task', 'error');
    } finally {
      setDraggedTask(null);
    }
  }, [draggedTask, showToast]);

  const handleTaskStatusChange = useCallback(async (taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);
      
      if (error) throw error;
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      showToast('Task updated');
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task', 'error');
    }
  }, [showToast]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* ================================================================== */}
      {/* COMPACT HEADER                                                    */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        padding: 'var(--space-md) 0', marginBottom: 'var(--space-md)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', padding: 'var(--space-xs)', fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

        <div style={{
          width: '12px', height: '12px', borderRadius: '3px',
          background: project.color || 'var(--sunbelt-orange)', flexShrink: 0
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {project.name}
            </h1>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              {project.project_number}
            </span>
            <span style={{
              padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
              background: `${getStatusColor(project.status)}20`, color: getStatusColor(project.status)
            }}>
              {project.status}
            </span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {project.contract_value && <span>{formatCurrency(project.contract_value)}</span>}
            {project.target_online_date && <span>Due {formatDate(project.target_online_date)}</span>}
            {project.client_name && <span>{project.client_name}</span>}
          </div>
        </div>

        <button
          onClick={() => setShowEditProject(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500'
          }}
        >
          <Edit size={14} /> Edit
        </button>
      </div>

      {/* ================================================================== */}
      {/* TABS                                                              */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex', gap: '0', borderBottom: '1px solid var(--border-color)',
        marginBottom: 'var(--space-lg)'
      }}>
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
      {/* TAB CONTENT - Consistent max-width wrapper                        */}
      {/* ================================================================== */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <div style={{ maxWidth: TAB_CONTENT_MAX_WIDTH, margin: '0 auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <div className="loading-spinner" />
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <OverviewTab project={project} stats={stats} milestones={milestones} />
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
                  onStatusChange={handleTaskStatusChange}
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

              {/* CALENDAR TAB */}
              {activeTab === 'calendar' && (
                <PlaceholderTab icon={Calendar} message="Calendar view coming soon" />
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
// PLACEHOLDER TAB (for unimplemented tabs)
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
// OVERVIEW TAB
// ============================================================================
function OverviewTab({ project, stats, milestones }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
      {/* Project Info */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 var(--space-md) 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Project Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <InfoField label="Client" value={project.client_name} />
          <InfoField label="Location" value={project.location} />
          <InfoField label="Contract Value" value={formatCurrency(project.contract_value)} />
          <InfoField label="Target Online" value={formatDate(project.target_online_date)} />
          <InfoField label="Project Type" value={project.project_type} />
          <InfoField label="Factory" value={project.factory} />
        </div>
        {project.description && (
          <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Description</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{project.description}</div>
          </div>
        )}
      </div>

      {/* Summary Stats & Milestones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
          <StatCard icon={CheckSquare} label="Tasks Done" value={`${stats.taskCompleted}/${stats.taskTotal}`} />
          <StatCard icon={MessageSquare} label="Open RFIs" value={stats.rfiOpen} highlight={stats.rfiOpen > 0} color="var(--sunbelt-orange)" />
          <StatCard icon={ClipboardList} label="Pending Subs" value={stats.subPending} highlight={stats.subPending > 0} color="var(--warning)" />
        </div>

        {/* Milestones */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)', flex: 1 }}>
          <h3 style={{ margin: '0 0 var(--space-md) 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            <Flag size={16} style={{ marginRight: 'var(--space-xs)', verticalAlign: 'middle' }} />
            Milestones
          </h3>
          {milestones.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No milestones yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {milestones.slice(0, 5).map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{m.name}</span>
                  <span style={{
                    fontSize: '0.8125rem',
                    color: isOverdue(m.due_date, m.status, ['Completed']) ? 'var(--danger)' : 'var(--text-secondary)'
                  }}>
                    {formatDate(m.due_date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)' }}>{value || '—'}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight = false, color = 'var(--sunbelt-orange)' }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
      <Icon size={24} style={{ color, marginBottom: 'var(--space-sm)' }} />
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: highlight ? color : 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  );
}

// ============================================================================
// TASKS TAB
// ============================================================================
function TasksTab({ tasks, allTasks, search, setSearch, statusFilter, setStatusFilter, view, setView, onAdd, onEdit, onStatusChange, onDragStart, onDragOver, onDrop, draggedTask }) {
  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flex: 1 }}>
          {/* Search */}
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." />

          {/* Status Filter */}
          <select
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>

          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            {tasks.length} of {allTasks.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          {/* View Toggle - Fixed positioning */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-color)', width: '160px' }}>
            <button
              onClick={() => setView('kanban')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                flex: 1, padding: '6px 0', border: 'none', borderRadius: 'var(--radius-sm)',
                background: view === 'kanban' ? 'var(--bg-primary)' : 'transparent',
                color: view === 'kanban' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: 'pointer', fontSize: '0.8125rem', fontWeight: '500'
              }}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
            <button
              onClick={() => setView('list')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                flex: 1, padding: '6px 0', border: 'none', borderRadius: 'var(--radius-sm)',
                background: view === 'list' ? 'var(--bg-primary)' : 'transparent',
                color: view === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: 'pointer', fontSize: '0.8125rem', fontWeight: '500'
              }}
            >
              <List size={14} /> List
            </button>
          </div>

          <button
            onClick={onAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
              padding: '6px 14px', background: 'var(--sunbelt-orange)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: '600'
            }}
          >
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'kanban' ? (
        <KanbanBoard 
          tasks={allTasks} 
          onTaskClick={onEdit} 
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          draggedTask={draggedTask}
        />
      ) : (
        <DataTable
          columns={[
            { key: 'title', label: 'Task', render: (task) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                {isOverdue(task.due_date, task.status, ['Completed', 'Cancelled']) && (
                  <AlertTriangle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{task.title}</div>
                  {task.description && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.description}</div>
                  )}
                </div>
              </div>
            )},
            { key: 'status', label: 'Status', width: '120px', render: (task) => (
              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: `${getStatusColor(task.status)}20`, color: getStatusColor(task.status) }}>
                {task.status}
              </span>
            )},
            { key: 'priority', label: 'Priority', width: '80px', render: (task) => (
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getPriorityColor(task.priority) }}>
                {task.priority || '—'}
              </span>
            )},
            { key: 'assignee', label: 'Assignee', width: '150px', render: (task) => {
              const name = task.external_assignee_name || task.assignee?.name;
              const isExternal = !!task.external_assignee_email;
              return name ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.875rem' }}>{name}</span>
                  {isExternal && <ExternalLink size={12} style={{ color: 'var(--sunbelt-orange)' }} />}
                </div>
              ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
            }},
            { key: 'due_date', label: 'Due', width: '100px', render: (task) => (
              <span style={{ fontSize: '0.875rem', color: isOverdue(task.due_date, task.status, ['Completed', 'Cancelled']) ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isOverdue(task.due_date, task.status, ['Completed', 'Cancelled']) ? '600' : '400' }}>
                {formatDate(task.due_date)}
              </span>
            )}
          ]}
          data={tasks}
          onRowClick={onEdit}
          emptyMessage="No tasks yet"
        />
      )}
    </div>
  );
}

// ============================================================================
// KANBAN BOARD - Narrower columns to fit within tab content width
// ============================================================================
function KanbanBoard({ tasks, onTaskClick, onDragStart, onDragOver, onDrop, draggedTask }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 'var(--space-md)',
      minHeight: '400px'
    }}>
      {KANBAN_COLUMNS.map(column => {
        const columnTasks = tasks.filter(t => t.status === column.id);
        const isDropTarget = draggedTask && draggedTask.status !== column.id;
        
        return (
          <div
            key={column.id}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id)}
            style={{
              background: isDropTarget ? `${column.color}10` : 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: isDropTarget ? `2px dashed ${column.color}` : '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '400px',
              transition: 'all 0.2s'
            }}
          >
            {/* Column Header */}
            <div style={{
              padding: 'var(--space-md)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: column.color }} />
                <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {column.label}
                </span>
              </div>
              <span style={{
                padding: '2px 8px', borderRadius: '10px',
                fontSize: '0.75rem', fontWeight: '600',
                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)'
              }}>
                {columnTasks.length}
              </span>
            </div>

            {/* Column Content */}
            <div style={{
              flex: 1,
              padding: 'var(--space-sm)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)'
            }}>
              {columnTasks.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.8125rem'
                }}>
                  {isDropTarget ? 'Drop here' : 'No tasks'}
                </div>
              ) : (
                columnTasks.map(task => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onDragStart={onDragStart}
                    isDragging={draggedTask?.id === task.id}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ task, onClick, onDragStart, isDragging }) {
  const isTaskOverdue = isOverdue(task.due_date, task.status, ['Completed', 'Cancelled']);
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={onClick}
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-sm)',
        border: '1px solid var(--border-color)',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.15s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
        <GripVertical size={12} style={{ color: 'var(--text-tertiary)', marginTop: '2px', flexShrink: 0 }} />
        <div style={{
          flex: 1, fontSize: '0.8125rem', fontWeight: '500',
          color: 'var(--text-primary)', lineHeight: '1.3'
        }}>
          {task.title}
        </div>
      </div>

      {/* Card Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          {task.priority && (
            <span style={{
              fontSize: '0.625rem', fontWeight: '600',
              padding: '1px 4px', borderRadius: '3px',
              background: `${getPriorityColor(task.priority)}20`,
              color: getPriorityColor(task.priority)
            }}>
              {task.priority}
            </span>
          )}
        </div>
        
        {task.due_date && (
          <span style={{
            fontSize: '0.6875rem',
            color: isTaskOverdue ? 'var(--danger)' : 'var(--text-tertiary)',
            fontWeight: isTaskOverdue ? '600' : '400'
          }}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      {/* Assignee */}
      {(task.assignee?.name || task.external_assignee_name) && (
        <div style={{
          marginTop: 'var(--space-xs)', paddingTop: 'var(--space-xs)',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.6875rem', color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
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
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flex: 1 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search RFIs..." />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer' }}>
            {RFI_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{rfis.length} of {allRFIs.length}</span>
        </div>
        <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '6px 14px', background: 'var(--sunbelt-orange)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
          <Plus size={14} /> Add RFI
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'rfi_number', label: 'RFI #', width: '120px', render: (rfi) => <span style={{ fontWeight: '600', color: 'var(--sunbelt-orange)' }}>{rfi.rfi_number}</span> },
          { key: 'subject', label: 'Subject', render: (rfi) => (
            <div>
              <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{rfi.subject}</div>
              {rfi.question && <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rfi.question}</div>}
            </div>
          )},
          { key: 'status', label: 'Status', width: '100px', render: (rfi) => (
            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: `${getStatusColor(rfi.status)}20`, color: getStatusColor(rfi.status) }}>{rfi.status}</span>
          )},
          { key: 'sent_to', label: 'Sent To', width: '150px', render: (rfi) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.875rem' }}>{rfi.sent_to || 'Internal'}</span>
              {rfi.is_external && <ExternalLink size={12} style={{ color: 'var(--sunbelt-orange)' }} />}
            </div>
          )},
          { key: 'due_date', label: 'Due', width: '100px', render: (rfi) => (
            <span style={{ fontSize: '0.875rem', color: isOverdue(rfi.due_date, rfi.status, ['Closed', 'Answered']) ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isOverdue(rfi.due_date, rfi.status, ['Closed', 'Answered']) ? '600' : '400' }}>
              {formatDate(rfi.due_date)}
            </span>
          )}
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
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flex: 1 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search submittals..." />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer' }}>
            {SUBMITTAL_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{submittals.length} of {allSubmittals.length}</span>
        </div>
        <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '6px 14px', background: 'var(--sunbelt-orange)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
          <Plus size={14} /> Add Submittal
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'submittal_number', label: 'Sub #', width: '120px', render: (sub) => <span style={{ fontWeight: '600', color: 'var(--sunbelt-orange)' }}>{sub.submittal_number}</span> },
          { key: 'title', label: 'Title', render: (sub) => (
            <div>
              <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{sub.title}</div>
              {sub.manufacturer && <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{sub.manufacturer}{sub.model_number && ` • ${sub.model_number}`}</div>}
            </div>
          )},
          { key: 'type', label: 'Type', width: '120px', render: (sub) => <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{sub.submittal_type || '—'}</span> },
          { key: 'status', label: 'Status', width: '130px', render: (sub) => (
            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: `${getStatusColor(sub.status)}20`, color: getStatusColor(sub.status), whiteSpace: 'nowrap' }}>{sub.status}</span>
          )},
          { key: 'revision', label: 'Rev', width: '50px', render: (sub) => (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-tertiary)', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{sub.revision_number || 0}</span>
          )},
          { key: 'due_date', label: 'Due', width: '100px', render: (sub) => (
            <span style={{ fontSize: '0.875rem', color: isOverdue(sub.due_date, sub.status, ['Approved', 'Approved as Noted', 'Rejected']) ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isOverdue(sub.due_date, sub.status, ['Approved', 'Approved as Noted', 'Rejected']) ? '600' : '400' }}>
              {formatDate(sub.due_date)}
            </span>
          )}
        ]}
        data={submittals}
        onRowClick={onEdit}
        emptyMessage="No submittals yet"
      />
    </div>
  );
}

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 12px', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
      minWidth: '200px', maxWidth: '280px'
    }}>
      <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
      <input
        type="text" placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)}
        style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', width: '100%' }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-tertiary)' }}>
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function DataTable({ columns, data, onRowClick, emptyMessage }) {
  if (data.length === 0) {
    return (
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-tertiary)' }}>
            {columns.map(col => (
              <th key={col.key} style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', width: col.width }}>
                {col.label}
              </th>
            ))}
            <th style={{ width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              style={{ borderTop: index > 0 ? '1px solid var(--border-color)' : 'none', cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: 'var(--space-md)' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              <td style={{ padding: 'var(--space-md)' }}>
                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProjectDetails;