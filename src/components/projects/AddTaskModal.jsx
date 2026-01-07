import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Upload, FileText, Image, File, Trash2, Paperclip, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { draftTaskEmail } from '../../utils/emailUtils';

function AddTaskModal({ isOpen, onClose, projectId, projectName = '', projectNumber = '', onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);
  
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
    if (isOpen) {
      fetchUsers();
      fetchMilestones();
      setFormData(prev => ({ ...prev, internal_owner_id: user?.id || '' }));
      setPendingFiles([]);
      setError('');
    }
  }, [isOpen, user]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image size={16} style={{ color: 'var(--info)' }} />;
    if (fileType?.includes('pdf')) return <FileText size={16} style={{ color: '#ef4444' }} />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FileText size={16} style={{ color: '#3b82f6' }} />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileText size={16} style={{ color: '#22c55e' }} />;
    return <File size={16} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setPendingFiles(prev => [...prev, ...newFiles]);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePendingFile = (fileId) => {
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadPendingFiles = async (taskId) => {
    const uploadedAttachments = [];

    for (const pendingFile of pendingFiles) {
      try {
        const timestamp = Date.now();
        const safeName = pendingFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${projectId}/tasks/${taskId}/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, pendingFile.file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(storagePath);

        const attachmentData = {
          project_id: projectId,
          task_id: taskId,
          file_name: pendingFile.name,
          file_size: pendingFile.size,
          file_type: pendingFile.type,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          uploaded_by: user.id
        };

        const { data: newAttachment, error: insertError } = await supabase
          .from('file_attachments')
          .insert([attachmentData])
          .select()
          .single();

        if (!insertError && newAttachment) {
          uploadedAttachments.push(newAttachment);
        }
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    return uploadedAttachments;
  };

  const createTask = async () => {
    const taskData = {
      project_id: projectId,
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
      created_by: user.id
    };

    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (insertError) throw insertError;

    if (pendingFiles.length > 0) {
      await uploadPendingFiles(data.id);
    }

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await createTask();
      onSuccess(data);
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndEmail = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await createTask();
      
      // Draft the email
      const taskForEmail = {
        ...data,
        external_assignee_email: formData.external_assignee_email
      };
      draftTaskEmail(taskForEmail, projectName, projectNumber);
      
      onSuccess(data);
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      assignment_type: 'internal',
      assignee_id: '',
      external_assignee_name: '',
      external_assignee_email: '',
      internal_owner_id: user?.id || '',
      milestone_id: '',
      status: 'Not Started',
      priority: 'Medium',
      due_date: '',
      start_date: ''
    });
    setPendingFiles([]);
    setError('');
    onClose();
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
              Add Task
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Create a new task for this project
            </p>
          </div>
          <button
            onClick={handleClose}
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
            <label className="form-label">Assign To</label>
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

          {/* Internal Assignment */}
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

          {/* External Assignment */}
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

          {/* File Attachments Section */}
          <div style={{ 
            padding: 'var(--space-lg)', 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }}>
                <Paperclip size={16} />
                Attachments ({pendingFiles.length})
              </h4>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}>
                <Upload size={14} />
                Add Files
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {pendingFiles.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', margin: 'var(--space-md) 0' }}>
                No files attached. Click "Add Files" to attach documents.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {pendingFiles.map(file => (
                  <div key={file.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {getFileIcon(file.type)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePendingFile(file.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        borderRadius: '4px'
                      }}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            justifyContent: 'flex-end',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'var(--space-lg)',
            flexWrap: 'wrap'
          }}>
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            
            {formData.assignment_type === 'external' && formData.external_assignee_email && (
              <button 
                type="button" 
                onClick={handleCreateAndEmail}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  padding: '10px 20px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--success)',
                  fontWeight: '600',
                  fontSize: '0.9375rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
                title="Create task and open email draft"
              >
                <Mail size={18} />
                Create & Email
              </button>
            )}
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                pendingFiles.length > 0 ? 'Creating & Uploading...' : 'Creating...'
              ) : (
                <><Plus size={18} /> Create Task</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;