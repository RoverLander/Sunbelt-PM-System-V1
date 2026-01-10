// ============================================================================
// AddTaskModal.jsx - Create New Task Modal (POLISHED VERSION)
// ============================================================================
// Modal form for creating new tasks within a project.
// Supports internal and external assignment, file attachments, milestones.
//
// PROPS:
// - isOpen: Boolean controlling modal visibility
// - onClose: Callback to close modal
// - projectId: UUID of parent project
// - projectName: Project name for email drafts
// - projectNumber: Project number for email drafts
// - onSuccess: Callback after successful task creation
//
// FIXES:
// - Proper form validation with field-level errors
// - Loading state prevents double-submission
// - File upload error handling
// - Memory cleanup for file previews
// - Proper date validation (due date after start date)
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Plus,
  Upload,
  FileText,
  Image,
  File,
  Trash2,
  Paperclip,
  Mail,
  AlertCircle,
  Loader
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../hooks/useContacts';
import { draftTaskEmail } from '../../utils/emailUtils';
import { COURT_OPTIONS } from '../../utils/workflowUtils';

// ============================================================================
// CONSTANTS
// ============================================================================
// Updated Jan 9, 2026: 'On Hold' and 'Blocked' merged into 'Awaiting Response'
const STATUS_OPTIONS = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Awaiting Response', label: 'Awaiting Response' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

// ============================================================================
// STYLES
// ============================================================================
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-lg)'
  },
  modal: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-xl)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-lg)',
    borderBottom: '1px solid var(--border-color)'
  },
  body: {
    padding: 'var(--space-lg)',
    overflowY: 'auto',
    flex: 1
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-sm)',
    padding: 'var(--space-lg)',
    borderTop: '1px solid var(--border-color)',
    background: 'var(--bg-primary)'
  },
  formGroup: {
    marginBottom: 'var(--space-lg)'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)'
  },
  required: {
    color: 'var(--danger)',
    marginLeft: '2px'
  },
  input: {
    width: '100%',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem'
  },
  inputError: {
    borderColor: 'var(--danger)'
  },
  textarea: {
    width: '100%',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  select: {
    width: '100%',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    cursor: 'pointer'
  },
  errorText: {
    color: 'var(--danger)',
    fontSize: '0.75rem',
    marginTop: 'var(--space-xs)'
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    background: 'var(--danger-light)',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
    fontSize: '0.875rem',
    marginBottom: 'var(--space-lg)'
  },
  radioGroup: {
    display: 'flex',
    gap: 'var(--space-lg)',
    marginBottom: 'var(--space-md)'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    cursor: 'pointer',
    fontSize: '0.9375rem',
    color: 'var(--text-primary)'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-md)'
  },
  fileDropZone: {
    border: '2px dashed var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-lg)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  fileDropZoneActive: {
    borderColor: 'var(--sunbelt-orange)',
    background: 'rgba(255, 107, 53, 0.05)'
  },
  fileList: {
    marginTop: 'var(--space-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)'
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-sm) var(--space-lg)',
    background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: '600',
    fontSize: '0.9375rem',
    cursor: 'pointer',
    minWidth: '120px'
  },
  secondaryButton: {
    padding: 'var(--space-sm) var(--space-lg)',
    background: 'var(--bg-primary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    fontWeight: '600',
    fontSize: '0.9375rem',
    cursor: 'pointer'
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get file icon based on type
 */
const getFileIcon = (fileType) => {
  if (fileType?.startsWith('image/')) return <Image size={18} style={{ color: 'var(--info)' }} />;
  if (fileType?.includes('pdf')) return <FileText size={18} style={{ color: '#ef4444' }} />;
  return <File size={18} style={{ color: 'var(--text-secondary)' }} />;
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AddTaskModal({
  isOpen,
  onClose,
  projectId,
  projectName = '',
  projectNumber = '',
  projectFactory = '',
  prefilledStationKey = null,
  onSuccess
}) {
  const { user } = useAuth();
  const { users, factoryContacts } = useContacts(isOpen);
  const fileInputRef = useRef(null);

  // ==========================================================================
  // DERIVED - EXTRACT FACTORY CODE
  // ==========================================================================
  const projectFactoryCode = projectFactory?.split(' - ')[0] || '';

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [milestones, setMilestones] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

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
    start_date: '',
    workflow_station_key: '',
    assigned_court: ''
  });

  // Workflow stations
  const [workflowStations, setWorkflowStations] = useState([]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
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
        start_date: '',
        workflow_station_key: prefilledStationKey || '',
        assigned_court: ''
      });
      setPendingFiles([]);
      setError('');
      setFieldErrors({});
      fetchMilestones();
      fetchWorkflowStations();
    }
  }, [isOpen, user, prefilledStationKey]);

  // ==========================================================================
  // GROUPED CONTACTS FOR DROPDOWN
  // ==========================================================================
  const groupedContacts = React.useMemo(() => {
    // Get factory contacts for the project's factory
    const projectFactoryContacts = (factoryContacts || []).filter(
      c => c.factory_code === projectFactoryCode
    ).sort((a, b) => a.name.localeCompare(b.name));

    // Get factory contacts from other factories, grouped by factory
    const otherFactoryContacts = (factoryContacts || []).filter(
      c => c.factory_code !== projectFactoryCode
    );

    // Group other factory contacts by factory_code
    const otherFactoriesGrouped = otherFactoryContacts.reduce((acc, contact) => {
      const key = contact.factory_code || 'Unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(contact);
      return acc;
    }, {});

    // Sort each group by name
    Object.keys(otherFactoriesGrouped).forEach(key => {
      otherFactoriesGrouped[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Sunbelt Corporate users (internal team)
    const sunbeltUsers = (users || []).sort((a, b) => a.name.localeCompare(b.name));

    return {
      projectFactory: projectFactoryContacts,
      sunbeltCorporate: sunbeltUsers,
      otherFactories: otherFactoriesGrouped
    };
  }, [factoryContacts, users, projectFactoryCode]);

  // Cleanup file object URLs on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [pendingFiles]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date');

      if (error) throw error;
      setMilestones(data || []);
    } catch (err) {
      console.error('Error fetching milestones:', err);
    }
  };

  const fetchWorkflowStations = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_stations')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setWorkflowStations(data || []);
    } catch (err) {
      console.error('Error fetching workflow stations:', err);
      // Non-critical - table may not exist yet
    }
  };

  // ==========================================================================
  // VALIDATION
  // ==========================================================================
  const validateForm = useCallback(() => {
    const errors = {};

    // Title is required
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    // External assignment validation
    if (formData.assignment_type === 'external') {
      if (!formData.external_assignee_name.trim()) {
        errors.external_assignee_name = 'Name is required for external assignment';
      }
      if (!formData.external_assignee_email.trim()) {
        errors.external_assignee_email = 'Email is required for external assignment';
      } else if (!isValidEmail(formData.external_assignee_email)) {
        errors.external_assignee_email = 'Please enter a valid email address';
      }
    }

    // Date validation
    if (formData.start_date && formData.due_date) {
      if (new Date(formData.due_date) < new Date(formData.start_date)) {
        errors.due_date = 'Due date must be after start date';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    addFiles(files);
  };

  const addFiles = (files) => {
    const validFiles = [];

    files.forEach(file => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }

      // Check file type (optional - allow all if not in list)
      // if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      //   setError(`File type "${file.type}" is not allowed.`);
      //   return;
      // }

      validFiles.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      });
    });

    setPendingFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setPendingFiles(prev => {
      const file = prev[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e, shouldEmail = false) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Prepare task data
      const taskData = {
        project_id: projectId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        milestone_id: formData.milestone_id || null,
        internal_owner_id: formData.internal_owner_id || user?.id,
        created_by: user?.id,
        workflow_station_key: formData.workflow_station_key || null,
        assigned_court: formData.assigned_court || null
      };

      // Handle assignment
      if (formData.assignment_type === 'internal') {
        taskData.assignee_id = formData.assignee_id || null;
        taskData.external_assignee_name = null;
        taskData.external_assignee_email = null;
      } else {
        taskData.assignee_id = null;
        taskData.external_assignee_name = formData.external_assignee_name.trim();
        taskData.external_assignee_email = formData.external_assignee_email.trim().toLowerCase();
      }

      // Create task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (taskError) throw taskError;

      // Upload files if any
      if (pendingFiles.length > 0) {
        for (const fileItem of pendingFiles) {
          const timestamp = Date.now();
          const safeName = fileItem.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `${projectId}/tasks/${task.id}/${timestamp}_${safeName}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(storagePath, fileItem.file);

          if (uploadError) {
            console.error('File upload error:', uploadError);
            continue; // Continue with other files
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('project-files')
            .getPublicUrl(storagePath);

          // Create attachment record
          const { error: attachError } = await supabase.from('attachments').insert([{
            project_id: projectId,
            task_id: task.id,
            file_name: fileItem.name,
            file_size: fileItem.size,
            file_type: fileItem.type,
            storage_path: storagePath,
            public_url: urlData?.publicUrl,
            uploaded_by: user?.id
          }]);
          if (attachError) {
            console.error('Error creating attachment record:', attachError);
          }
        }
      }

      // Draft email if requested
      if (shouldEmail && formData.assignment_type === 'external') {
        draftTaskEmail(
          { ...task, external_assignee_email: formData.external_assignee_email },
          projectName,
          projectNumber
        );
      }

      onSuccess(task);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Add New Task
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={styles.body}>
          {/* Error Banner */}
          {error && (
            <div style={styles.errorBanner}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Title <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              style={{
                ...styles.input,
                ...(fieldErrors.title ? styles.inputError : {})
              }}
              autoFocus
            />
            {fieldErrors.title && (
              <div style={styles.errorText}>{fieldErrors.title}</div>
            )}
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description (optional)"
              style={styles.textarea}
            />
          </div>

          {/* Assignment Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Assignment Type</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="assignment_type"
                  value="internal"
                  checked={formData.assignment_type === 'internal'}
                  onChange={handleChange}
                />
                Internal Team Member
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="assignment_type"
                  value="external"
                  checked={formData.assignment_type === 'external'}
                  onChange={handleChange}
                />
                External Contact
              </label>
            </div>
          </div>

          {/* Internal Assignment */}
          {formData.assignment_type === 'internal' && (
            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assignee</label>
                <select
                  name="assignee_id"
                  value={formData.assignee_id}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Unassigned</option>

                  {/* Section 1: Project Factory Contacts (if factory is set) */}
                  {projectFactoryCode && groupedContacts.projectFactory.length > 0 && (
                    <optgroup label={`━━ ${projectFactory || projectFactoryCode} ━━`}>
                      {groupedContacts.projectFactory.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.department || c.role_code})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Section 2: Sunbelt Corporate (Internal Team) */}
                  {groupedContacts.sunbeltCorporate.length > 0 && (
                    <optgroup label="━━ Sunbelt Corporate ━━">
                      {groupedContacts.sunbeltCorporate.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Section 3: Other Factory Contacts (grouped by factory) */}
                  {Object.entries(groupedContacts.otherFactories).map(([factoryCode, contacts]) => (
                    <optgroup key={factoryCode} label={`── ${factoryCode} ──`}>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.department || c.role_code})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Internal Owner</label>
                <select
                  name="internal_owner_id"
                  value={formData.internal_owner_id}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select owner</option>
                  {groupedContacts.sunbeltCorporate.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* External Assignment */}
          {formData.assignment_type === 'external' && (
            <>
              <div style={styles.row}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    External Name <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="external_assignee_name"
                    value={formData.external_assignee_name}
                    onChange={handleChange}
                    placeholder="Contact name"
                    style={{
                      ...styles.input,
                      ...(fieldErrors.external_assignee_name ? styles.inputError : {})
                    }}
                  />
                  {fieldErrors.external_assignee_name && (
                    <div style={styles.errorText}>{fieldErrors.external_assignee_name}</div>
                  )}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    External Email <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    name="external_assignee_email"
                    value={formData.external_assignee_email}
                    onChange={handleChange}
                    placeholder="contact@example.com"
                    style={{
                      ...styles.input,
                      ...(fieldErrors.external_assignee_email ? styles.inputError : {})
                    }}
                  />
                  {fieldErrors.external_assignee_email && (
                    <div style={styles.errorText}>{fieldErrors.external_assignee_email}</div>
                  )}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Internal Owner</label>
                <select
                  name="internal_owner_id"
                  value={formData.internal_owner_id}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select owner</option>
                  {groupedContacts.sunbeltCorporate.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Status and Priority */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={styles.select}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                style={styles.select}
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Due Date</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(fieldErrors.due_date ? styles.inputError : {})
                }}
              />
              {fieldErrors.due_date && (
                <div style={styles.errorText}>{fieldErrors.due_date}</div>
              )}
            </div>
          </div>

          {/* Milestone */}
          {milestones.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Milestone</label>
              <select
                name="milestone_id"
                value={formData.milestone_id}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">No milestone</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Workflow Station & Court Row */}
          <div style={styles.row}>
            {/* Workflow Station */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Link to Workflow Station</label>
              <select
                name="workflow_station_key"
                value={formData.workflow_station_key}
                onChange={handleChange}
                style={{ ...styles.select, fontSize: '0.875rem' }}
              >
                <option value="">— None (standalone task) —</option>
                {/* Group stations by phase */}
                {[1, 2, 3, 4, 5, 6].map(phase => {
                  const phaseStations = workflowStations.filter(s => s.phase === phase && !s.parent_station_key);
                  if (phaseStations.length === 0) return null;
                  const phaseNames = {
                    1: 'Pre-Production',
                    2: 'Production',
                    3: 'QC & Shipping',
                    4: 'Site Work',
                    5: 'Installation',
                    6: 'Closeout'
                  };
                  return (
                    <optgroup key={phase} label={`━━ Phase ${phase}: ${phaseNames[phase] || 'Other'} ━━`}>
                      {phaseStations.map(station => (
                        <option key={station.station_key} value={station.station_key}>
                          {station.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                Link this task to a workflow station to track progress
              </span>
            </div>

            {/* Assigned Court */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Ball In Court</label>
              <select
                name="assigned_court"
                value={formData.assigned_court}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">Not specified</option>
                {COURT_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* File Attachments */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Paperclip size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Attachments
            </label>
            <div
              style={{
                ...styles.fileDropZone,
                ...(isDragOver ? styles.fileDropZoneActive : {})
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload size={24} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }} />
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Drag files here or click to upload
              </p>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                Max 10MB per file
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {/* File List */}
            {pendingFiles.length > 0 && (
              <div style={styles.fileList}>
                {pendingFiles.map((file, index) => (
                  <div key={index} style={styles.fileItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      {getFileIcon(file.type)}
                      <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {file.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            style={styles.secondaryButton}
            disabled={loading}
          >
            Cancel
          </button>

          {formData.assignment_type === 'external' && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              style={{
                ...styles.secondaryButton,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                ...(loading ? styles.disabledButton : {})
              }}
            >
              <Mail size={16} />
              Create & Email
            </button>
          )}

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              ...styles.primaryButton,
              ...(loading ? styles.disabledButton : {})
            }}
          >
            {loading ? (
              <>
                <Loader size={16} className="spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTaskModal;