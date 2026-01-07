// ============================================================================
// AddTaskModal.jsx
// ============================================================================
// Modal component for creating new Tasks within a project.
// 
// FEATURES:
// - Create tasks assigned to internal team OR external contacts
// - Link tasks to project milestones
// - File attachment support
// - Email draft integration for external tasks
// - Priority and status management
//
// DEPENDENCIES:
// - useContacts hook: Fetches both users (PMs) and factory contacts
// - supabaseClient: Database operations
// - emailUtils: Email draft generation
//
// PROPS:
// - isOpen: Boolean to control modal visibility
// - onClose: Function called when modal closes
// - projectId: UUID of the parent project
// - projectName: Project name for display
// - projectNumber: Project number for display
// - onSuccess: Callback with created task data
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Upload, FileText, Image, File, Trash2, Paperclip, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../hooks/useContacts';
import { draftTaskEmail } from '../../utils/emailUtils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AddTaskModal({ isOpen, onClose, projectId, projectName = '', projectNumber = '', onSuccess }) {
  
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  const { user } = useAuth();
  const { contacts, loading: contactsLoading } = useContacts(isOpen);

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // Form fields for task creation
  const [formData, setFormData] = useState({
    title: '',                    // Task title (required)
    description: '',              // Task description
    assignment_type: 'internal',  // 'internal' or 'external'
    assignee_id: '',              // User/contact ID for internal assignment
    external_assignee_name: '',   // Name for external assignee
    external_assignee_email: '',  // Email for external assignee
    internal_owner_id: '',        // User ID responsible for tracking
    milestone_id: '',             // Optional linked milestone
    status: 'Not Started',        // Task status
    priority: 'Medium',           // 'Low', 'Medium', 'High'
    due_date: '',                 // Due date
    start_date: ''                // Start date
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  useEffect(() => {
    if (isOpen) {
      fetchMilestones();
      // Set current user as default internal owner
      setFormData(prev => ({ ...prev, internal_owner_id: user?.id || '' }));
      setPendingFiles([]);
      setError('');
    }
  }, [isOpen, user]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  
  // Fetch milestones for this project
  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date');
      
      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
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
  // FILE HELPERS
  // ==========================================================================
  
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

  // ==========================================================================
  // FILE UPLOAD
  // ==========================================================================
  
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

  // ==========================================================================
  // TASK CREATION
  // ==========================================================================
  
  const createTask = async () => {
    // Determine if external based on assignment type
    const isExternal = formData.assignment_type === 'external';
    
    // Build task data object
    const taskData = {
      project_id: projectId,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      // For internal: use selected contact ID; for external: null
      assignee_id: isExternal ? null : (formData.assignee_id || null),
      // External assignee fields
      external_assignee_name: isExternal ? formData.external_assignee_name.trim() : null,
      external_assignee_email: isExternal ? formData.external_assignee_email.trim() : null,
      is_external: isExternal,
      internal_owner_id: formData.internal_owner_id || null,
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

    // Upload any pending files
    let attachments = [];
    if (pendingFiles.length > 0) {
      attachments = await uploadPendingFiles(data.id);
    }

    return { task: data, attachments };
  };

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { task } = await createTask();
      onSuccess(task);
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // Create task and open email draft
  const handleCreateAndEmail = async () => {
    setLoading(true);
    setError('');

    try {
      const { task } = await createTask();
      
      // Draft email to external assignee
      const taskForEmail = {
        ...task,
        external_assignee_email: formData.external_assignee_email
      };
      draftTaskEmail(taskForEmail, projectName, projectNumber);
      
      onSuccess(task);
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // MODAL CLOSE
  // ==========================================================================
  
  const handleClose = () => {
    setFormData({
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
    setPendingFiles([]);
    setError('');
    onClose();
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Create Task
          </h2>
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
          {/* TASK TITLE                                                   */}
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
              placeholder="e.g., Review floor plans"
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
              placeholder="Additional details about this task..."
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* ============================================================ */}
          {/* ASSIGNMENT TYPE TOGGLE                                       */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              {/* Internal Option */}
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
              
              {/* External Option */}
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

          {/* ============================================================ */}
          {/* INTERNAL ASSIGNEE DROPDOWN                                   */}
          {/* Shows users AND factory contacts                             */}
          {/* ============================================================ */}
          {formData.assignment_type === 'internal' && (
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select
                name="assignee_id"
                value={formData.assignee_id}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select team member</option>
                
                {/* Group 1: Users (PMs, Directors, VPs) */}
                <optgroup label="── Internal Team ──">
                  {contacts.filter(c => c.contact_type === 'user').map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </optgroup>
                
                {/* Group 2: Factory Contacts */}
                <optgroup label="── Factory Contacts ──">
                  {contacts.filter(c => c.contact_type === 'factory').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* ============================================================ */}
          {/* EXTERNAL ASSIGNEE FIELDS                                     */}
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
              
              {/* External Name */}
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
              
              {/* External Email */}
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

              {/* Internal Owner for Tracking */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Internal Owner (Tracking) *</label>
                <select
                  name="internal_owner_id"
                  value={formData.internal_owner_id}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Select team member</option>
                  {contacts.filter(c => c.contact_type === 'user').map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Responsible for following up on this task.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MILESTONE LINK (Optional)                                    */}
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
          {/* PRIORITY & STATUS                                            */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
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
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
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
          <div className="form-group">
            <label className="form-label">Attachments</label>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-lg)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: pendingFiles.length > 0 ? 'var(--space-md)' : 0
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <Upload size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                Click to upload files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Pending Files List */}
            {pendingFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {pendingFiles.map(file => (
                  <div
                    key={file.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      padding: 'var(--space-sm) var(--space-md)',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem'
                    }}
                  >
                    {getFileIcon(file.type)}
                    <span style={{ flex: 1, color: 'var(--text-primary)' }}>{file.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePendingFile(file.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* ACTION BUTTONS                                               */}
          {/* ============================================================ */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            justifyContent: 'flex-end',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'var(--space-lg)'
          }}>
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            
            {/* Create & Email (for external only) */}
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
              >
                <Mail size={18} />
                Create & Email
              </button>
            )}
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : <><Plus size={18} /> Create Task</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;