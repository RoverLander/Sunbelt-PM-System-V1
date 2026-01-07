import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, FileText, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import FileAttachments from '../common/FileAttachments';
import { exportTaskToICS } from '../../utils/icsUtils';
import { exportTaskToPDF } from '../../utils/pdfUtils';
import { draftTaskEmail } from '../../utils/emailUtils';

function EditTaskModal({ isOpen, onClose, task, projectId, projectName = '', projectNumber = '', onSuccess, onDelete }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [attachments, setAttachments] = useState([]);
  
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

  useEffect(() => {
    if (isOpen && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignment_type: task.external_assignee_email ? 'external' : 'internal',
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
      fetchUsers();
      fetchMilestones();
      fetchAttachments();
    }
  }, [isOpen, task]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        assignee_id: formData.assignment_type === 'internal' ? (formData.assignee_id || null) : null,
        external_assignee_name: formData.assignment_type === 'external' ? formData.external_assignee_name.trim() : null,
        external_assignee_email: formData.assignment_type === 'external' ? formData.external_assignee_email.trim() : null,
        internal_owner_id: formData.assignment_type === 'external' ? (formData.internal_owner_id || null) : null,
        milestone_id: formData.milestone_id || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        start_date: formData.start_date || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', task.id);

      if (updateError) throw updateError;

      // Fetch updated task
      const { data: updatedTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*, assignee:assignee_id(id, name), internal_owner:internal_owner_id(id, name)')
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (deleteError) throw deleteError;

      onDelete(task);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportToOutlook = () => {
    const taskForExport = {
      ...task,
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date,
      start_date: formData.start_date,
      is_external: formData.assignment_type === 'external',
      external_assignee: formData.external_assignee_name,
      assignee: task.assignee
    };
    exportTaskToICS(taskForExport, projectName, projectNumber);
  };

  const handleExportPDF = () => {
    const taskForExport = {
      ...task,
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date,
      start_date: formData.start_date,
      is_external: formData.assignment_type === 'external',
      external_assignee: formData.external_assignee_name,
      assignee: task.assignee
    };
    exportTaskToPDF(taskForExport, projectName, projectNumber, attachments);
  };

  const handleDraftEmail = () => {
    const taskForEmail = {
      ...task,
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date,
      is_external: formData.assignment_type === 'external',
      external_assignee_email: formData.external_assignee_email,
      assignee: task.assignee
    };
    draftTaskEmail(taskForEmail, projectName, projectNumber);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              borderRadius: '6px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-xl)' }}>
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

          {/* Quick Status Update */}
          <div style={{
            padding: 'var(--space-lg)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <label className="form-label" style={{ marginBottom: 'var(--space-md)' }}>Quick Status Update</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {['Not Started', 'In Progress', 'Blocked', 'Completed', 'Cancelled'].map(status => (
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

          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="e.g., Review floor plans"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder="Additional details about this task..."
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* Assignment Type Toggle */}
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
                background: formData.assignment_type === 'internal' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)',
                transition: 'all 0.15s'
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
                background: formData.assignment_type === 'external' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)',
                transition: 'all 0.15s'
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

          {/* INTERNAL ASSIGNMENT */}
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
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* EXTERNAL ASSIGNMENT */}
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
                <label className="form-label">External Contact Email *</label>
                <input
                  type="email"
                  name="external_assignee_email"
                  value={formData.external_assignee_email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="john@architectfirm.com"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Internal Owner (Responsible for Tracking) *</label>
                <select
                  name="internal_owner_id"
                  value={formData.internal_owner_id}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Select team member</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  This person is responsible for following up and updating the task status.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Milestone</label>
              <select
                name="milestone_id"
                value={formData.milestone_id}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">No milestone</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-input"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

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

          {/* File Attachments */}
          {task && (
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <FileAttachments 
                projectId={projectId}
                taskId={task.id}
                onAttachmentsChange={setAttachments}
              />
            </div>
          )}

          {/* Export Buttons */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-lg)',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', marginRight: 'var(--space-sm)' }}>
              Export:
            </span>
            
            <button
              type="button"
              onClick={handleExportToOutlook}
              disabled={!formData.due_date}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: formData.due_date ? 'var(--info)' : 'var(--text-tertiary)',
                fontWeight: '600',
                fontSize: '0.8125rem',
                cursor: formData.due_date ? 'pointer' : 'not-allowed',
                opacity: formData.due_date ? 1 : 0.6
              }}
              title={formData.due_date ? 'Add to Outlook calendar' : 'Set a due date first'}
            >
              <Calendar size={14} />
              Calendar
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontWeight: '600',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
              title="Export as PDF"
            >
              <FileText size={14} />
              PDF
            </button>

            <button
              type="button"
              onClick={handleDraftEmail}
              disabled={formData.assignment_type !== 'external'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: formData.assignment_type === 'external' ? 'var(--success)' : 'var(--text-tertiary)',
                fontWeight: '600',
                fontSize: '0.8125rem',
                cursor: formData.assignment_type === 'external' ? 'pointer' : 'not-allowed',
                opacity: formData.assignment_type === 'external' ? 1 : 0.6
              }}
              title={formData.assignment_type === 'external' ? 'Draft email to external contact' : 'Only available for external tasks'}
            >
              <Mail size={14} />
              Email
            </button>
          </div>

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
              className="btn btn-secondary"
              disabled={deleting}
              style={{ color: 'var(--danger)' }}
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