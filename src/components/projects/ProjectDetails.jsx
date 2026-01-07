import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Edit, Calendar, DollarSign, CheckSquare, MessageSquare,
  ClipboardList, FolderOpen, Plus, Building2, Target, AlertCircle,
  Download, ChevronRight, Flag, Map
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// MODAL IMPORTS
// ============================================================================
import EditProjectModal from './EditProjectModal';
import AddMilestoneModal from './AddMilestoneModal';
import AddTaskModal from './AddTaskModal';
import EditTaskModal from './EditTaskModal';
import AddRFIModal from './AddRFIModal';
import EditRFIModal from './EditRFIModal';
import AddSubmittalModal from './AddSubmittalModal';
import EditSubmittalModal from './EditSubmittalModal';

// ============================================================================
// COMPONENT IMPORTS
// ============================================================================
import ProjectFiles from './ProjectFiles';
import ProjectCalendarWeek from './ProjectCalendarWeek';
import ProjectCalendarMonth from './ProjectCalendarMonth';
import TasksView from './TasksView';
import { FloorPlansTab } from '../floorplans';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ProjectDetails({ project: initialProject, onBack, onUpdate, initialTab = 'Overview' }) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE - PROJECT DATA
  // ==========================================================================
  const [project, setProject] = useState(initialProject);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================================================
  // STATE - UI CONTROLS
  // ==========================================================================
  const [activeTab, setActiveTab] = useState(initialTab);
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // STATE - MODAL VISIBILITY (set to true to open, false to close)
  // ==========================================================================
  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddRFI, setShowAddRFI] = useState(false);
  const [showAddSubmittal, setShowAddSubmittal] = useState(false);

  // ==========================================================================
  // STATE - EDIT MODALS (set to item object to open, null to close)
  // ==========================================================================
  const [editTask, setEditTask] = useState(null);
  const [editRFI, setEditRFI] = useState(null);
  const [editSubmittal, setEditSubmittal] = useState(null);

  // ==========================================================================
  // CONSTANTS
  // ==========================================================================
  const tabs = ['Overview', 'Tasks', 'RFIs', 'Submittals', 'Calendar', 'Files', 'Floor Plans'];

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => { setProject(initialProject); }, [initialProject]);
  useEffect(() => { if (project?.id) fetchProjectData(); }, [project?.id]);
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const { data: projectData } = await supabase.from('projects').select('*').eq('id', project.id).single();
      if (projectData) setProject(projectData);

      const { data: tasksData } = await supabase.from('tasks')
        .select('*, assignee:assignee_id(id, name), internal_owner:internal_owner_id(id, name)')
        .eq('project_id', project.id).order('created_at', { ascending: false });
      
      const { data: rfisData } = await supabase.from('rfis').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
      const { data: submittalsData } = await supabase.from('submittals').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
      const { data: milestonesData } = await supabase.from('milestones').select('*').eq('project_id', project.id).order('due_date', { ascending: true });

      setTasks(tasksData || []);
      setRFIs(rfisData || []);
      setSubmittals(submittalsData || []);
      setMilestones(milestonesData || []);
    } catch (error) { console.error('Error fetching project data:', error); }
    finally { setLoading(false); }
  };

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ==========================================================================
  // FORMATTING HELPERS
  // ==========================================================================
  const formatCurrency = (amount) => !amount ? 'Not set' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString) => !dateString ? 'Not set' : new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const calculateDaysOpen = (createdAt, status) => {
    if (['Closed', 'Answered'].includes(status)) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  };

  // ==========================================================================
  // STATUS COLOR HELPERS
  // ==========================================================================
  const getStatusColor = (status) => {
    const colors = { 'Planning': 'var(--info)', 'Pre-PM': 'var(--warning)', 'In Progress': 'var(--sunbelt-orange)', 'On Hold': 'var(--text-tertiary)', 'Completed': 'var(--success)', 'Cancelled': 'var(--danger)', 'Warranty': 'var(--info)' };
    return colors[status] || 'var(--text-secondary)';
  };
  const getRFIStatusColor = (status) => {
    const colors = { 'Open': '#3b82f6', 'Pending': '#f59e0b', 'Answered': '#22c55e', 'Closed': '#64748b' };
    return colors[status] || '#64748b';
  };
  const getSubmittalStatusColor = (status) => {
    const colors = { 'Pending': '#f59e0b', 'Submitted': '#3b82f6', 'Under Review': '#8b5cf6', 'Approved': '#22c55e', 'Approved as Noted': '#22c55e', 'Revise & Resubmit': '#ef4444', 'Rejected': '#ef4444' };
    return colors[status] || '#64748b';
  };

  // ==========================================================================
  // EXPORT FUNCTIONS
  // ==========================================================================
  const exportRFILog = () => {
    const headers = ['RFI #', 'Subject', 'Status', 'Sent To', 'Date Sent', 'Due Date', 'Days Open', 'Question', 'Answer'];
    const rows = rfis.map(rfi => [rfi.rfi_number, rfi.subject, rfi.status, rfi.is_external ? rfi.sent_to : 'Internal', formatDate(rfi.date_sent), formatDate(rfi.due_date), calculateDaysOpen(rfi.created_at, rfi.status), rfi.question?.replace(/,/g, ';') || '', rfi.answer?.replace(/,/g, ';') || '']);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${project.project_number}_RFI_Log.csv`; a.click();
  };

  const exportSubmittalLog = () => {
    const headers = ['Submittal #', 'Title', 'Type', 'Status', 'Revision', 'Sent To', 'Due Date', 'Spec Section', 'Manufacturer'];
    const rows = submittals.map(sub => [sub.submittal_number, sub.title, sub.submittal_type, sub.status, sub.revision_number || 0, sub.is_external ? sub.sent_to : 'Internal', formatDate(sub.due_date), sub.spec_section || '', sub.manufacturer || '']);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${project.project_number}_Submittal_Log.csv`; a.click();
  };

  // ==========================================================================
  // MODAL SUCCESS/DELETE HANDLERS
  // ==========================================================================
  const handleProjectUpdateSuccess = (updatedProject) => { setProject(updatedProject); setShowEditProject(false); onUpdate && onUpdate(updatedProject); showToast('Project updated successfully'); };
  const handleTaskSuccess = () => { fetchProjectData(); setShowAddTask(false); setEditTask(null); showToast('Task saved successfully'); };
  const handleTaskDelete = () => { fetchProjectData(); setEditTask(null); showToast('Task deleted'); };
  const handleRFISuccess = () => { fetchProjectData(); setShowAddRFI(false); setEditRFI(null); showToast('RFI saved successfully'); };
  const handleRFIDelete = () => { fetchProjectData(); setEditRFI(null); showToast('RFI deleted'); };
  const handleSubmittalSuccess = () => { fetchProjectData(); setShowAddSubmittal(false); setEditSubmittal(null); showToast('Submittal saved successfully'); };
  const handleSubmittalDelete = () => { fetchProjectData(); setEditSubmittal(null); showToast('Submittal deleted'); };
  const handleMilestoneSuccess = () => { fetchProjectData(); setShowAddMilestone(false); showToast('Milestone added successfully'); };

  // ==========================================================================
  // CALENDAR ITEM CLICK HANDLER
  // ==========================================================================
  const handleCalendarItemClick = (item) => {
    if (item.type === 'task') setEditTask(item.data);
    else if (item.type === 'rfi') setEditRFI(item.data);
    else if (item.type === 'submittal') setEditSubmittal(item.data);
  };

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const openRFIs = rfis.filter(r => r.status === 'Open').length;
  const approvedSubmittals = submittals.filter(s => ['Approved', 'Approved as Noted'].includes(s.status)).length;

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  if (loading && !project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Loading project...</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
        <div>
          <button type="button" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '8px 16px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', marginBottom: 'var(--space-md)' }}><ArrowLeft size={16} />Back to Projects</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{project.name}</h1>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: `${getStatusColor(project.status)}20`, color: getStatusColor(project.status) }}>{project.status}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-xs) 0 0 0' }}>{project.project_number} • {project.client_name || 'No client'}</p>
        </div>
        <button type="button" onClick={() => setShowEditProject(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '10px 20px', background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.9375rem' }}><Edit size={18} />Edit Project</button>
      </div>

      {/* ================================================================== */}
      {/* STATS BAR                                                         */}
      {/* ================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}><DollarSign size={18} style={{ color: 'var(--sunbelt-orange)' }} /><span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Contract Value</span></div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(project.contract_value)}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}><CheckSquare size={18} style={{ color: 'var(--sunbelt-orange)' }} /><span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Tasks</span></div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{completedTasks} / {tasks.length}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}><MessageSquare size={18} style={{ color: 'var(--sunbelt-orange)' }} /><span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Open RFIs</span></div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{openRFIs} / {rfis.length}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}><ClipboardList size={18} style={{ color: 'var(--sunbelt-orange)' }} /><span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Submittals</span></div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{approvedSubmittals} / {submittals.length}</div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TAB NAVIGATION                                                    */}
      {/* ================================================================== */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-sm)' }}>
        {tabs.map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-sm) var(--space-md)', background: activeTab === tab ? 'rgba(255, 107, 53, 0.1)' : 'transparent', border: 'none', borderRadius: 'var(--radius-md)', color: activeTab === tab ? 'var(--sunbelt-orange)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.15s' }}>
            {tab === 'Overview' && <Building2 size={16} />}
            {tab === 'Tasks' && <CheckSquare size={16} />}
            {tab === 'RFIs' && <MessageSquare size={16} />}
            {tab === 'Submittals' && <ClipboardList size={16} />}
            {tab === 'Calendar' && <Calendar size={16} />}
            {tab === 'Files' && <FolderOpen size={16} />}
            {tab === 'Floor Plans' && <Map size={16} />}
            {tab}
            {tab === 'Tasks' && <span style={{ marginLeft: '4px', opacity: 0.7 }}>({tasks.length})</span>}
            {tab === 'RFIs' && <span style={{ marginLeft: '4px', opacity: 0.7 }}>({rfis.length})</span>}
            {tab === 'Submittals' && <span style={{ marginLeft: '4px', opacity: 0.7 }}>({submittals.length})</span>}
          </button>
        ))}
      </div>

      {/* ================================================================== */}
      {/* TAB CONTENT - OVERVIEW                                            */}
      {/* ================================================================== */}
      {activeTab === 'Overview' && (
        <div>
          {/* Week Calendar Widget */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <ProjectCalendarWeek project={project} tasks={tasks} rfis={rfis} submittals={submittals} milestones={milestones} onItemClick={handleCalendarItemClick} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-xl)' }}>
            {/* PROJECT INFORMATION CARD */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-lg)' }}>Project Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div><label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</label><p style={{ color: 'var(--text-primary)', margin: '4px 0 0 0', fontWeight: '500' }}>{project.client_name || 'Not specified'}</p></div>
                <div><label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contract Value</label><p style={{ color: 'var(--text-primary)', margin: '4px 0 0 0', fontWeight: '500' }}>{formatCurrency(project.contract_value)}</p></div>
                <div><label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Square Footage</label><p style={{ color: 'var(--text-primary)', margin: '4px 0 0 0', fontWeight: '500' }}>{project.square_footage ? `${project.square_footage.toLocaleString()} sq ft` : 'Not specified'}</p></div>
                <div><label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Module Count</label><p style={{ color: 'var(--text-primary)', margin: '4px 0 0 0', fontWeight: '500' }}>{project.module_count || 'Not specified'}</p></div>
                <div><label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Online Date</label><p style={{ color: 'var(--text-primary)', margin: '4px 0 0 0', fontWeight: '500' }}>{formatDate(project.target_online_date)}</p></div>
                <div><label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Date</label><p style={{ color: 'var(--text-primary)', margin: '4px 0 0 0', fontWeight: '500' }}>{formatDate(project.delivery_date)}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Site Address</label><p style={{ color: 'var(--text-primary)', margin: '4px 0 0 0', fontWeight: '500' }}>{project.site_address || 'Not specified'}</p></div>
                {project.description && <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label><p style={{ color: 'var(--text-primary)', margin: '4px 0 0 0', fontWeight: '500' }}>{project.description}</p></div>}
              </div>
            </div>

            {/* MILESTONES CARD */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Milestones</h3>
                <button type="button" onClick={() => setShowAddMilestone(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '6px 12px', background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.8125rem' }}><Plus size={14} />Add</button>
              </div>
              {milestones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-tertiary)' }}><Flag size={32} style={{ marginBottom: 'var(--space-sm)', opacity: 0.5 }} /><p>No milestones yet</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {milestones.map(milestone => (
                    <div key={milestone.id} style={{ padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${milestone.status === 'Completed' ? 'var(--success)' : 'var(--sunbelt-orange)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{milestone.name}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600', background: milestone.status === 'Completed' ? 'var(--success-light)' : 'rgba(255, 107, 53, 0.1)', color: milestone.status === 'Completed' ? 'var(--success)' : 'var(--sunbelt-orange)' }}>{milestone.status}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Due: {formatDate(milestone.due_date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB CONTENT - TASKS (Kanban/List Toggle)                          */}
      {/* ================================================================== */}
      {activeTab === 'Tasks' && (
        <TasksView
          tasks={tasks}
          projectId={project.id}
          projectName={project.name}
          projectNumber={project.project_number}
          onTaskClick={(task) => setEditTask(task)}
          onAddTask={() => setShowAddTask(true)}
          onTasksChange={setTasks}
          showToast={showToast}
        />
      )}

      {/* ================================================================== */}
      {/* TAB CONTENT - RFIs                                                */}
      {/* ================================================================== */}
      {activeTab === 'RFIs' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>RFIs ({rfis.length})</h3>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {rfis.length > 0 && <button type="button" onClick={exportRFILog} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '8px 16px', background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}><Download size={16} />Export Log</button>}
              <button type="button" onClick={() => setShowAddRFI(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '8px 16px', background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}><Plus size={16} />Add RFI</button>
            </div>
          </div>
          {rfis.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-tertiary)' }}><MessageSquare size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} /><h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>No RFIs yet</h4><p>Create your first RFI to get started</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {rfis.map(rfi => (
                <div key={rfi.id} onClick={() => setEditRFI(rfi)} style={{ padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
                      {rfi.is_external && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }} title="External RFI" />}
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{rfi.rfi_number}: {rfi.subject}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600', background: `${getRFIStatusColor(rfi.status)}20`, color: getRFIStatusColor(rfi.status) }}>{rfi.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <span>To: {rfi.sent_to || 'Internal'}</span><span>•</span><span>Days Open: {calculateDaysOpen(rfi.created_at, rfi.status)}</span>
                      {rfi.due_date && <><span>•</span><span>Due: {formatDate(rfi.due_date)}</span></>}
                    </div>
                  </div>
                  <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB CONTENT - SUBMITTALS                                          */}
      {/* ================================================================== */}
      {activeTab === 'Submittals' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Submittals ({submittals.length})</h3>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {submittals.length > 0 && <button type="button" onClick={exportSubmittalLog} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '8px 16px', background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}><Download size={16} />Export Log</button>}
              <button type="button" onClick={() => setShowAddSubmittal(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '8px 16px', background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}><Plus size={16} />Add Submittal</button>
            </div>
          </div>
          {submittals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-tertiary)' }}><ClipboardList size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} /><h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>No Submittals yet</h4><p>Create your first Submittal to get started</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {submittals.map(submittal => (
                <div key={submittal.id} onClick={() => setEditSubmittal(submittal)} style={{ padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
                      {submittal.is_external && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }} title="External Submittal" />}
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{submittal.submittal_number}: {submittal.title}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600', background: `${getSubmittalStatusColor(submittal.status)}20`, color: getSubmittalStatusColor(submittal.status) }}>{submittal.status}</span>
                      {submittal.revision_number > 0 && <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Rev {submittal.revision_number}</span>}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <span>{submittal.submittal_type}</span><span>•</span><span>To: {submittal.sent_to || 'Internal'}</span>
                      {submittal.due_date && <><span>•</span><span>Due: {formatDate(submittal.due_date)}</span></>}
                    </div>
                  </div>
                  <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB CONTENT - CALENDAR                                            */}
      {/* ================================================================== */}
      {activeTab === 'Calendar' && <ProjectCalendarMonth project={project} tasks={tasks} rfis={rfis} submittals={submittals} milestones={milestones} onItemClick={handleCalendarItemClick} />}

      {/* ================================================================== */}
      {/* TAB CONTENT - FILES                                               */}
      {/* ================================================================== */}
      {activeTab === 'Files' && <ProjectFiles projectId={project.id} onUpdate={fetchProjectData} />}

      {/* ================================================================== */}
      {/* TAB CONTENT - FLOOR PLANS                                         */}
      {/* ================================================================== */}
      {activeTab === 'Floor Plans' && (
        <FloorPlansTab
          projectId={project.id}
          projectNumber={project.project_number}
          rfis={rfis}
          submittals={submittals}
          showToast={showToast}
        />
      )}

      {/* ================================================================== */}
      {/* MODALS - Edit Project                                             */}
      {/* ================================================================== */}
      {showEditProject && <EditProjectModal isOpen={showEditProject} onClose={() => setShowEditProject(false)} project={project} onSuccess={handleProjectUpdateSuccess} />}

      {/* ================================================================== */}
      {/* MODALS - Milestones                                               */}
      {/* ================================================================== */}
      {showAddMilestone && <AddMilestoneModal isOpen={showAddMilestone} onClose={() => setShowAddMilestone(false)} projectId={project.id} onSuccess={handleMilestoneSuccess} />}

      {/* ================================================================== */}
      {/* MODALS - Tasks                                                    */}
      {/* ================================================================== */}
      {showAddTask && <AddTaskModal isOpen={showAddTask} onClose={() => setShowAddTask(false)} projectId={project.id} projectName={project.name} projectNumber={project.project_number} onSuccess={handleTaskSuccess} />}
      {editTask && <EditTaskModal isOpen={true} onClose={() => setEditTask(null)} task={editTask} projectId={project.id} projectName={project.name} projectNumber={project.project_number} onSuccess={handleTaskSuccess} onDelete={handleTaskDelete} />}

      {/* ================================================================== */}
      {/* MODALS - RFIs                                                     */}
      {/* ================================================================== */}
      {showAddRFI && <AddRFIModal isOpen={showAddRFI} onClose={() => setShowAddRFI(false)} projectId={project.id} projectNumber={project.project_number} projectName={project.name} onSuccess={handleRFISuccess} />}
      {editRFI && <EditRFIModal isOpen={true} onClose={() => setEditRFI(null)} rfi={editRFI} projectName={project.name} projectNumber={project.project_number} onSuccess={handleRFISuccess} onDelete={handleRFIDelete} />}

      {/* ================================================================== */}
      {/* MODALS - Submittals                                               */}
      {/* ================================================================== */}
      {showAddSubmittal && <AddSubmittalModal isOpen={showAddSubmittal} onClose={() => setShowAddSubmittal(false)} projectId={project.id} projectNumber={project.project_number} projectName={project.name} onSuccess={handleSubmittalSuccess} />}
      {editSubmittal && <EditSubmittalModal isOpen={true} onClose={() => setEditSubmittal(null)} submittal={editSubmittal} projectName={project.name} projectNumber={project.project_number} onSuccess={handleSubmittalSuccess} onDelete={handleSubmittalDelete} />}

      {/* ================================================================== */}
      {/* TOAST NOTIFICATION                                                */}
      {/* ================================================================== */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === 'success' && <CheckSquare size={18} style={{ color: 'var(--success)' }} />}{toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--danger)' }} />}{toast.message}</div>}
    </div>
  );
}

export default ProjectDetails;