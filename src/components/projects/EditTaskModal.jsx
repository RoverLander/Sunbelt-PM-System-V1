// ============================================================================
// EditTaskModal.jsx
// ============================================================================
// Modal component for editing existing Tasks.
// 
// FEATURES:
// - Edit all task fields including assignment, status, priority
// - Quick status buttons for fast updates
// - Support for both internal and external assignments
// - Milestone linking
// - File attachment management
// - Export to PDF/ICS, email draft functionality
// - Delete task capability
// - Factory contacts in assignee dropdowns
//
// DEPENDENCIES:
// - useContacts hook: Fetches both users (PMs) and factory contacts
// - supabaseClient: Database operations
// - FileAttachments: File management component
// - emailUtils, pdfUtils, icsUtils: Export utilities
//
// PROPS:
// - isOpen: Boolean to control modal visibility
// - onClose: Function called when modal closes
// - task: The task object to edit
// - projectId: UUID of the parent project
// - projectName: Project name for display/export
// - projectNumber: Project number for display/export
// - onSuccess: Callback with updated task data
// - onDelete: Callback after task deletion
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, FileText, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../hooks/useContacts';
import FileAttachments from '../common/FileAttachments';
import { exportTaskToICS } from '../../utils/icsUtils';
import { exportTaskToPDF } from '../../utils/pdfUtils';
import { draftTaskEmail } from '../../utils/emailUtils';

// ============================================================================
// CONSTANTS
// ============================================================================
// Updated Jan 9, 2026: 'On Hold' changed to 'Awaiting Response'
const TASK_STATUSES = ['Not Started', 'In Progress', 'Awaiting Response', 'Completed', 'Cancelled'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function EditTaskModal({ isOpen, onClose, task, projectId, projectName = '', projectNumber = '', onSuccess, onDelete }) {
  
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  const { user } = useAuth();
  const { contacts } = useContacts(isOpen);

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [attachments, setAttachments] = useState([]);
  
  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignment_type: 'internal',
    assignee_id: '',
    external_assignee_name: '',
    external_assignee_email: '',
    internal_owner_id: '',
    milestone_id: '',
    status: 'Not Started',
    priority: 'Medium',
    due_date: '',
    start_date: ''
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  useEffect(() => {
    if (isOpen && task) {
      // Determine assignment type based on existing data
      const isExternal = !!task.external_assignee_email || !!task.external_assignee_name;
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignment_type: isExternal ? 'external' : 'internal',
        assignee_id: task.assignee_id || '',
        external_assignee_name: task.external_assignee_name || '',
        external_assignee_email: task.external_assignee_email || '',
        internal_owner_id: task.internal_owner_id || '',
        milestone_id: task.milestone_id || '',
        status: task.status || 'Not Started',
        priority: task.priority || 'Medium',
        due_date: task.due_date || '',
        start_date: task.start_date || ''
      });
      fetchMilestones();
      fetchAttachments();
    }
  }, [isOpen, task]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  
  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ==========================================================================
  // TASK UPDATE
  // ==========================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isExternal = formData.assignment_type === 'external';
      
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        assignee_id: isExternal ? null : (formData.assignee_id || null),
        external_assignee_name: isExternal ? formData.external_assignee_name.trim() : null,
        external_assignee_email: isExternal ? formData.external_assignee_email.trim() : null,
        is_external: isExternal,
        internal_owner_id: isExternal ? (formData.internal_owner_id || null) : null,
        milestone_id: formData.milestone_id || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        start_date: formData.start_date || null,
        // Auto-set completed date
        completed_date: formData.status === 'Completed' && task.status !== 'Completed'
          ? new Date().toISOString().split('T')[0]
          : task.completed_date,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', task.id);

      if (updateError) throw updateError;

      // Fetch updated task with relations
      const { data: updatedTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*, assignee:assignee_id(id, name), internal_owner:internal_owner_id(id, name), milestone:milestone_id(id, name)')
        .eq('id', task.id)
        .single();

      if (fetchError) throw fetchError;

      onSuccess(updatedTask);
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // TASK DELETION
  // ==========================================================================
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      // Delete attachments first
      await supabase
        .from('file_attachments')
        .delete()
        .eq('task_id', task.id);

      // Delete floor plan markers
      await supabase
        .from('floor_plan_markers')
        .delete()
        .eq('task_id', task.id);

      // Delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      onDelete(task.id);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================================
  // EXPORT FUNCTIONS
  // ==========================================================================
  
  const handleExportPDF = () => {
    exportTaskToPDF(task, projectName, projectNumber, attachments);
  };

  const handleExportICS = () => {
    exportTaskToICS(task, projectName);
  };

  const handleDraftEmail = () => {
    const taskForEmail = {
      ...task,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      due_date: formData.due_date,
      is_external: formData.assignment_type === 'external',
      external_assignee_email: formData.external_assignee_email
    };
    draftTaskEmail(taskForEmail, projectName, projectNumber);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* ================================================================ */}
        {/* HEADER                                                          */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-xl)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-primary)',
          zIndex: 1
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Edit Task
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Update task details and status
            </p>
          </div>
          
          {/* Export Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={handleExportPDF}
              style={{
                padding: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="Export as PDF"
            >
              <FileText size={18} />
            </button>
            <button
              type="button"
              onClick={handleExportICS}
              style={{
                padding: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--info)',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="Add to Calendar"
            >
              <Calendar size={18} />
            </button>
            {formData.assignment_type === 'external' && formData.external_assignee_email && (
              <button
                type="button"
                onClick={handleDraftEmail}
                style={{
                  padding: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--success)',
                  cursor: 'pointer',
                  display: 'flex'
                }}
                title="Draft Email"
              >
                <Mail size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* FORM                                                            */}
        {/* ================================================================ */}
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-xl)' }}>
          
          {/* Error Display */}
          {error && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              color: 'var(--danger)',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {/* ============================================================ */}
          {/* QUICK STATUS UPDATE                                          */}
          {/* ============================================================ */}
          <div style={{
            padding: 'var(--space-lg)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <label className="form-label" style={{ marginBottom: 'var(--space-md)' }}>Status</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {TASK_STATUSES.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status }))}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${formData.status === status ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                    background: formData.status === status ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-primary)',
                    color: formData.status === status ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* TITLE                                                        */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* ============================================================ */}
          {/* DESCRIPTION                                                  */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="3"
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* ============================================================ */}
          {/* ASSIGNMENT TYPE TOGGLE                                       */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Assignment Type</label>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <label style={{
                flex: 1,
                padding: 'var(--space-md)',
                border: `2px solid ${formData.assignment_type === 'internal' ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center',
                background: formData.assignment_type === 'internal' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)'
              }}>
                <input
                  type="radio"
                  name="assignment_type"
                  value="internal"
                  checked={formData.assignment_type === 'internal'}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Internal Team</span>
              </label>
              
              <label style={{
                flex: 1,
                padding: 'var(--space-md)',
                border: `2px solid ${formData.assignment_type === 'external' ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center',
                background: formData.assignment_type === 'external' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)'
              }}>
                <input
                  type="radio"
                  name="assignment_type"
                  value="external"
                  checked={formData.assignment_type === 'external'}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>External Contact</span>
              </label>
            </div>
          </div>

          {/* ============================================================ */}
          {/* INTERNAL ASSIGNMENT                                          */}
          {/* ============================================================ */}
          {formData.assignment_type === 'internal' && (
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select
                name="assignee_id"
                value={formData.assignee_id}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select team member</option>
                {/* Internal Team */}
                <optgroup label="── Internal Team ──">
                  {contacts.filter(c => c.contact_type === 'user').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </optgroup>
                {/* Factory Contacts */}
                <optgroup label="── Factory Contacts ──">
                  {contacts.filter(c => c.contact_type === 'factory').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* ============================================================ */}
          {/* EXTERNAL ASSIGNMENT                                          */}
          {/* ============================================================ */}
          {formData.assignment_type === 'external' && (
            <div style={{ 
              padding: 'var(--space-lg)', 
              background: 'rgba(255, 107, 53, 0.05)', 
              border: '1px solid rgba(255, 107, 53, 0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                External Contact Details
              </h4>
              
              <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="form-label">External Contact Name *</label>
                <input
                  type="text"
                  name="external_assignee_name"
                  value={formData.external_assignee_name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="e.g., John Smith (Architect)"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="form-label">External Email *</label>
                <input
                  type="email"
                  name="external_assignee_email"
                  value={formData.external_assignee_email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="contact@example.com"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Internal Owner (Tracking)</label>
                <select
                  name="internal_owner_id"
                  value={formData.internal_owner_id}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select team member</option>
                  {contacts.filter(c => c.contact_type === 'user').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MILESTONE LINK                                               */}
          {/* ============================================================ */}
          {milestones.length > 0 && (
            <div className="form-group">
              <label className="form-label">Link to Milestone</label>
              <select
                name="milestone_id"
                value={formData.milestone_id}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">No milestone</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.due_date ? `(Due: ${new Date(m.due_date).toLocaleDateString()})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ============================================================ */}
          {/* PRIORITY                                                     */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-input"
            >
              {TASK_PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* ============================================================ */}
          {/* DATES                                                        */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* FILE ATTACHMENTS                                             */}
          {/* ============================================================ */}
          <FileAttachments
            projectId={projectId}
            taskId={task?.id}
            attachments={attachments}
            onUpdate={fetchAttachments}
          />

          {/* ============================================================ */}
          {/* ACTION BUTTONS                                               */}
          {/* ============================================================ */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            justifyContent: 'space-between',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'var(--space-lg)'
          }}>
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={deleting || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '10px 20px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontWeight: '600',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.7 : 1
              }}
            >
              <Trash2 size={18} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTaskModal;