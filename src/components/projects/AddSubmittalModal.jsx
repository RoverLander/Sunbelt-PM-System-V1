// ============================================================================
// AddSubmittalModal.jsx - Create New Submittal Modal (POLISHED VERSION)
// ============================================================================
// Modal form for creating new submittals within a project.
// Supports various submittal types with auto-numbering.
//
// PROPS:
// - isOpen: Boolean controlling modal visibility
// - onClose: Callback to close modal
// - projectId: UUID of parent project
// - projectNumber: Project number for submittal numbering
// - projectName: Project name for email drafts
// - onSuccess: Callback after successful submittal creation
//
// FIXES:
// - Auto-generates submittal number based on existing count
// - Proper form validation with field-level errors
// - Loading state prevents double-submission
// - Email validation for external recipients
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Plus,
  Mail,
  AlertCircle,
  Loader,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { draftSubmittalEmail } from '../../utils/emailUtils';
import { getSuggestedPriority, getSuggestedInternalOwners } from '../../utils/smartDefaults';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Approved as Noted', label: 'Approved as Noted' },
  { value: 'Revise and Resubmit', label: 'Revise and Resubmit' },
  { value: 'Rejected', label: 'Rejected' }
];

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
];

const SUBMITTAL_TYPES = [
  { value: 'Shop Drawings', label: 'Shop Drawings' },
  { value: 'Product Data', label: 'Product Data' },
  { value: 'Samples', label: 'Samples' },
  { value: 'Design Data', label: 'Design Data' },
  { value: 'Test Reports', label: 'Test Reports' },
  { value: 'Certificates', label: 'Certificates' },
  { value: 'Warranties', label: 'Warranties' },
  { value: 'O&M Manuals', label: 'O&M Manuals' },
  { value: 'Mix Design', label: 'Mix Design' },
  { value: 'Other', label: 'Other' }
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
    maxWidth: '650px',
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
  row3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 'var(--space-md)'
  },
  submittalNumberBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-lg)'
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
 * Validate email format
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Generate submittal number based on project and count
 */
const generateSubmittalNumber = (projectNumber, count) => {
  const num = String(count + 1).padStart(3, '0');
  return projectNumber ? `${projectNumber}-SUB-${num}` : `SUB-${num}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AddSubmittalModal({
  isOpen,
  onClose,
  projectId,
  projectNumber = '',
  projectName = '',
  onSuccess
}) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [submittalNumber, setSubmittalNumber] = useState('');
  const [nextNumber, setNextNumber] = useState(1);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    submittal_type: 'Shop Drawings',
    recipient_type: 'external',
    sent_to: '',
    sent_to_email: '',
    internal_owner_id: '',
    status: 'Pending',
    priority: 'Medium',
    due_date: '',
    date_submitted: '',
    spec_section: '',
    manufacturer: '',
    model_number: ''
  });

  // ==========================================================================
  // SMART DEFAULTS - Sort users by relevance to submittal content
  // ==========================================================================
  const sortedUsers = useMemo(() => {
    if (!users.length) return [];
    const searchText = `${formData.title} ${formData.description} ${formData.submittal_type}`;
    return getSuggestedInternalOwners(users, 'submittal', searchText);
  }, [users, formData.title, formData.description, formData.submittal_type]);

  // Suggested priority based on title/description text
  const suggestedPriority = useMemo(() => {
    const searchText = `${formData.title} ${formData.description}`;
    return getSuggestedPriority(searchText);
  }, [formData.title, formData.description]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Reset form and fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        submittal_type: 'Shop Drawings',
        recipient_type: 'external',
        sent_to: '',
        sent_to_email: '',
        internal_owner_id: user?.id || '',
        status: 'Pending',
        priority: 'Medium',
        due_date: '',
        date_submitted: '',
        spec_section: '',
        manufacturer: '',
        model_number: ''
      });
      setError('');
      setFieldErrors({});
      fetchUsers();
      fetchNextSubmittalNumber();
    }
  }, [isOpen, user, projectId]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchNextSubmittalNumber = async () => {
    try {
      const { count, error } = await supabase
        .from('submittals')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) throw error;

      const num = (count || 0) + 1;
      setNextNumber(num);
      setSubmittalNumber(generateSubmittalNumber(projectNumber, count || 0));
    } catch (err) {
      console.error('Error fetching submittal count:', err);
      setSubmittalNumber(generateSubmittalNumber(projectNumber, 0));
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

    // External recipient validation
    if (formData.recipient_type === 'external') {
      if (!formData.sent_to.trim()) {
        errors.sent_to = 'Recipient name is required';
      }
      if (!formData.sent_to_email.trim()) {
        errors.sent_to_email = 'Recipient email is required';
      } else if (!isValidEmail(formData.sent_to_email)) {
        errors.sent_to_email = 'Please enter a valid email address';
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

  const handleSubmit = async (e, shouldEmail = false) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Prepare submittal data
      const submittalData = {
        project_id: projectId,
        submittal_number: submittalNumber,
        number: nextNumber,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        submittal_type: formData.submittal_type,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        date_submitted: formData.date_submitted || null,
        spec_section: formData.spec_section.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        model_number: formData.model_number.trim() || null,
        revision_number: 0,
        internal_owner_id: formData.internal_owner_id || user?.id,
        created_by: user?.id
      };

      // Handle recipient
      if (formData.recipient_type === 'external') {
        submittalData.is_external = true;
        submittalData.sent_to = formData.sent_to.trim();
        submittalData.sent_to_email = formData.sent_to_email.trim().toLowerCase();
      } else {
        submittalData.is_external = false;
        submittalData.sent_to = null;
        submittalData.sent_to_email = null;
      }

      // Create submittal
      const { data: submittal, error: submittalError } = await supabase
        .from('submittals')
        .insert([submittalData])
        .select()
        .single();

      if (submittalError) throw submittalError;

      // Draft email if requested
      if (shouldEmail && formData.recipient_type === 'external') {
        draftSubmittalEmail(submittal, projectName, projectNumber);
      }

      onSuccess(submittal);
    } catch (err) {
      console.error('Error creating submittal:', err);
      setError(err.message || 'Failed to create submittal. Please try again.');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <ClipboardList size={24} style={{ color: 'var(--sunbelt-orange)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Create New Submittal
            </h2>
          </div>
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

          {/* Submittal Number Badge */}
          <div style={styles.submittalNumberBadge}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Submittal Number:
            </span>
            <span style={{ fontWeight: '700', color: 'var(--sunbelt-orange)', fontSize: '1rem' }}>
              {submittalNumber}
            </span>
          </div>

          {/* Title and Type */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Title <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Submittal title"
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
            <div style={styles.formGroup}>
              <label style={styles.label}>Type</label>
              <select
                name="submittal_type"
                value={formData.submittal_type}
                onChange={handleChange}
                style={styles.select}
              >
                {SUBMITTAL_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Additional details (optional)"
              style={styles.textarea}
            />
          </div>

          {/* Recipient Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Send To</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="recipient_type"
                  value="external"
                  checked={formData.recipient_type === 'external'}
                  onChange={handleChange}
                />
                External Reviewer
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="recipient_type"
                  value="internal"
                  checked={formData.recipient_type === 'internal'}
                  onChange={handleChange}
                />
                Internal (No Recipient)
              </label>
            </div>
          </div>

          {/* External Recipient */}
          {formData.recipient_type === 'external' && (
            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Reviewer Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="sent_to"
                  value={formData.sent_to}
                  onChange={handleChange}
                  placeholder="Contact name"
                  style={{
                    ...styles.input,
                    ...(fieldErrors.sent_to ? styles.inputError : {})
                  }}
                />
                {fieldErrors.sent_to && (
                  <div style={styles.errorText}>{fieldErrors.sent_to}</div>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Reviewer Email <span style={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  name="sent_to_email"
                  value={formData.sent_to_email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  style={{
                    ...styles.input,
                    ...(fieldErrors.sent_to_email ? styles.inputError : {})
                  }}
                />
                {fieldErrors.sent_to_email && (
                  <div style={styles.errorText}>{fieldErrors.sent_to_email}</div>
                )}
              </div>
            </div>
          )}

          {/* Internal Owner - Smart Sorted */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Internal Owner
              {sortedUsers.length > 0 && sortedUsers[0]._suggestionScore > 0 && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: '0.7rem',
                  color: 'var(--sunbelt-orange)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <Sparkles size={12} />
                  Smart sorted
                </span>
              )}
            </label>
            <select
              name="internal_owner_id"
              value={formData.internal_owner_id}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">Select owner</option>
              {sortedUsers.map((u, idx) => (
                <option key={u.id} value={u.id}>
                  {u.name}{u._suggestionScore > 5 && idx < 3 ? ' ★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status, Priority, Due Date */}
          <div style={styles.row3}>
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
              <label style={styles.label}>
                Priority
                {suggestedPriority !== 'Medium' && suggestedPriority !== formData.priority && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: suggestedPriority }))}
                    style={{
                      marginLeft: '8px',
                      fontSize: '0.7rem',
                      color: 'var(--sunbelt-orange)',
                      background: 'rgba(255, 107, 53, 0.1)',
                      border: '1px solid var(--sunbelt-orange)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Sparkles size={10} />
                    Suggest: {suggestedPriority}
                  </button>
                )}
              </label>
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
            <div style={styles.formGroup}>
              <label style={styles.label}>Due Date</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          {/* Spec Section, Manufacturer, Model */}
          <div style={styles.row3}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Spec Section</label>
              <input
                type="text"
                name="spec_section"
                value={formData.spec_section}
                onChange={handleChange}
                placeholder="e.g., 08 11 00"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Manufacturer</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                placeholder="Manufacturer name"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Model Number</label>
              <input
                type="text"
                name="model_number"
                value={formData.model_number}
                onChange={handleChange}
                placeholder="Model/part #"
                style={styles.input}
              />
            </div>
          </div>

          {/* Date Submitted */}
          <div style={{ ...styles.formGroup, maxWidth: '200px' }}>
            <label style={styles.label}>Date Submitted</label>
            <input
              type="date"
              name="date_submitted"
              value={formData.date_submitted}
              onChange={handleChange}
              style={styles.input}
            />
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

          {formData.recipient_type === 'external' && (
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
                Create Submittal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddSubmittalModal;