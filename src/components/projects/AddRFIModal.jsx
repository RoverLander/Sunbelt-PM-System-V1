// ============================================================================
// AddRFIModal.jsx - Create New RFI Modal (FIXED VERSION)
// ============================================================================
// Modal form for creating new RFIs (Requests for Information).
// Supports internal and external recipients with auto-numbering.
//
// FIXES (Jan 8, 2026):
// - Due Date is now MANDATORY (required field)
// - Cancel button styled gray/subtle
// - Create & Email button styled blue to differentiate from primary
// - Better button styling overall
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Plus,
  Mail,
  AlertCircle,
  Loader,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { draftRFIEmail } from '../../utils/emailUtils';
import { getSuggestedPriority, getSuggestedInternalOwners } from '../../utils/smartDefaults';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Open', label: 'Open' },
  { value: 'Pending', label: 'Pending Response' },
  { value: 'Answered', label: 'Answered' },
  { value: 'Closed', label: 'Closed' }
];

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
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
  inputDisabled: {
    background: 'var(--bg-tertiary)',
    cursor: 'not-allowed'
  },
  textarea: {
    width: '100%',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    minHeight: '120px',
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
  rfiNumberBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-lg)'
  },
  // =========================================================================
  // FIXED BUTTON STYLES
  // =========================================================================
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
    overflow: 'hidden',
    transition: 'opacity 0.15s, transform 0.15s'
  },
  // FIXED: Cancel button is now gray/subtle
  cancelButton: {
    padding: 'var(--space-sm) var(--space-lg)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    fontWeight: '600',
    fontSize: '0.9375rem',
    cursor: 'pointer',
    transition: 'background 0.15s'
  },
  // FIXED: Create & Email button is now blue to differentiate
  emailButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-sm) var(--space-lg)',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: '600',
    fontSize: '0.9375rem',
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.15s'
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
 * Generate RFI number based on project and count
 */
const generateRFINumber = (projectNumber, count) => {
  const num = String(count + 1).padStart(3, '0');
  return projectNumber ? `${projectNumber}-RFI-${num}` : `RFI-${num}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AddRFIModal({
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
  const [rfiNumber, setRfiNumber] = useState('');
  const [nextNumber, setNextNumber] = useState(1);

  const [formData, setFormData] = useState({
    subject: '',
    question: '',
    recipient_type: 'external',
    sent_to: '',
    sent_to_email: '',
    internal_owner_id: '',
    status: 'Open',
    priority: 'Medium',
    due_date: '',
    date_sent: new Date().toISOString().split('T')[0],
    spec_section: '',
    drawing_reference: ''
  });

  // Track if priority was auto-suggested (user can override)
  const [priorityAutoSet, setPriorityAutoSet] = useState(false);

  // ==========================================================================
  // SMART DEFAULTS - Sort users by relevance to RFI content
  // ==========================================================================
  const sortedUsers = useMemo(() => {
    if (!users.length) return [];
    const searchText = `${formData.subject} ${formData.question}`;
    return getSuggestedInternalOwners(users, 'rfi', searchText);
  }, [users, formData.subject, formData.question]);

  // Suggested priority based on subject/question text
  const suggestedPriority = useMemo(() => {
    const searchText = `${formData.subject} ${formData.question}`;
    return getSuggestedPriority(searchText);
  }, [formData.subject, formData.question]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Reset form and fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set default due date to 7 days from now
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      
      setFormData({
        subject: '',
        question: '',
        recipient_type: 'external',
        sent_to: '',
        sent_to_email: '',
        internal_owner_id: user?.id || '',
        status: 'Open',
        priority: 'Medium',
        due_date: defaultDueDate.toISOString().split('T')[0], // Default to 7 days out
        date_sent: new Date().toISOString().split('T')[0],
        spec_section: '',
        drawing_reference: ''
      });
      setError('');
      setFieldErrors({});
      fetchUsers();
      fetchNextRFINumber();
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

  const fetchNextRFINumber = async () => {
    try {
      const { count, error } = await supabase
        .from('rfis')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) throw error;

      const num = (count || 0) + 1;
      setNextNumber(num);
      setRfiNumber(generateRFINumber(projectNumber, count || 0));
    } catch (err) {
      console.error('Error fetching RFI count:', err);
      setRfiNumber(generateRFINumber(projectNumber, 0));
    }
  };

  // ==========================================================================
  // VALIDATION - FIXED: Due date is now required
  // ==========================================================================
  const validateForm = useCallback(() => {
    const errors = {};

    // Subject is required
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    // Question is required
    if (!formData.question.trim()) {
      errors.question = 'Question/request is required';
    }

    // FIXED: Due date is now REQUIRED
    if (!formData.due_date) {
      errors.due_date = 'Due date is required';
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
      // Prepare RFI data
      const rfiData = {
        project_id: projectId,
        rfi_number: rfiNumber,
        number: nextNumber,
        subject: formData.subject.trim(),
        question: formData.question.trim(),
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        date_sent: formData.date_sent || null,
        spec_section: formData.spec_section.trim() || null,
        drawing_reference: formData.drawing_reference.trim() || null,
        internal_owner_id: formData.internal_owner_id || user?.id,
        created_by: user?.id
      };

      // Handle recipient
      if (formData.recipient_type === 'external') {
        rfiData.is_external = true;
        rfiData.sent_to = formData.sent_to.trim();
        rfiData.sent_to_email = formData.sent_to_email.trim().toLowerCase();
      } else {
        rfiData.is_external = false;
        rfiData.sent_to = null;
        rfiData.sent_to_email = null;
      }

      // Create RFI
      const { data: rfi, error: rfiError } = await supabase
        .from('rfis')
        .insert([rfiData])
        .select()
        .single();

      if (rfiError) throw rfiError;

      // Draft email if requested
      if (shouldEmail && formData.recipient_type === 'external') {
        draftRFIEmail(rfi, projectName, projectNumber);
      }

      onSuccess(rfi);
    } catch (err) {
      console.error('Error creating RFI:', err);
      setError(err.message || 'Failed to create RFI. Please try again.');
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
            <MessageSquare size={24} style={{ color: 'var(--sunbelt-orange)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Create New RFI
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

          {/* RFI Number Badge */}
          <div style={styles.rfiNumberBadge}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              RFI Number:
            </span>
            <span style={{ fontWeight: '700', color: 'var(--sunbelt-orange)', fontSize: '1rem' }}>
              {rfiNumber}
            </span>
          </div>

          {/* Subject */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Subject <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief description of the request"
              style={{
                ...styles.input,
                ...(fieldErrors.subject ? styles.inputError : {})
              }}
              autoFocus
            />
            {fieldErrors.subject && (
              <div style={styles.errorText}>{fieldErrors.subject}</div>
            )}
          </div>

          {/* Question */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Question/Request <span style={styles.required}>*</span>
            </label>
            <textarea
              name="question"
              value={formData.question}
              onChange={handleChange}
              placeholder="Detailed question or request for information..."
              style={{
                ...styles.textarea,
                ...(fieldErrors.question ? styles.inputError : {})
              }}
            />
            {fieldErrors.question && (
              <div style={styles.errorText}>{fieldErrors.question}</div>
            )}
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
                External Contact
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
                  Recipient Name <span style={styles.required}>*</span>
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
                  Recipient Email <span style={styles.required}>*</span>
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

          {/* Status, Priority, Due Date - FIXED: Due Date now required */}
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
                    onClick={() => {
                      setFormData(prev => ({ ...prev, priority: suggestedPriority }));
                      setPriorityAutoSet(true);
                    }}
                    style={{
                      marginLeft: '8px',
                      fontSize: '0.65rem',
                      color: 'var(--sunbelt-orange)',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid var(--sunbelt-orange)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                    title={`Based on keywords in your text`}
                  >
                    <Sparkles size={10} />
                    Suggest: {suggestedPriority}
                  </button>
                )}
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={(e) => {
                  handleChange(e);
                  setPriorityAutoSet(false);
                }}
                style={styles.select}
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* FIXED: Due Date is now required */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Due Date <span style={styles.required}>*</span>
              </label>
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

          {/* Reference Fields */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Spec Section</label>
              <input
                type="text"
                name="spec_section"
                value={formData.spec_section}
                onChange={handleChange}
                placeholder="e.g., 03 30 00"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Drawing Reference</label>
              <input
                type="text"
                name="drawing_reference"
                value={formData.drawing_reference}
                onChange={handleChange}
                placeholder="e.g., A-101"
                style={styles.input}
              />
            </div>
          </div>

          {/* Date Sent */}
          <div style={{ ...styles.formGroup, maxWidth: '200px' }}>
            <label style={styles.label}>Date Sent</label>
            <input
              type="date"
              name="date_sent"
              value={formData.date_sent}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </form>

        {/* Footer - FIXED BUTTON STYLES */}
        <div style={styles.footer}>
          {/* Cancel Button - Gray/Subtle */}
          <button
            type="button"
            onClick={onClose}
            style={styles.cancelButton}
            disabled={loading}
            onMouseEnter={(e) => e.target.style.background = 'var(--bg-primary)'}
            onMouseLeave={(e) => e.target.style.background = 'var(--bg-tertiary)'}
          >
            Cancel
          </button>

          {/* Create & Email Button - Blue */}
          {formData.recipient_type === 'external' && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              style={{
                ...styles.emailButton,
                ...(loading ? styles.disabledButton : {})
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.opacity = '1'; }}
            >
              <Mail size={16} />
              Create & Email
            </button>
          )}

          {/* Primary Create Button - Orange */}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              ...styles.primaryButton,
              ...(loading ? styles.disabledButton : {})
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.opacity = '1'; }}
          >
            {loading ? (
              <>
                <Loader size={16} className="spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create RFI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddRFIModal;