// ============================================================================
// CreateUserModal.jsx - Create New User Modal
// ============================================================================
// Modal form for IT admins to create new user accounts.
//
// FEATURES:
// - Name, email, role fields
// - Optional title, department, phone
// - Auto-generates initial password (or sends invite)
// - Form validation
// ============================================================================

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  AlertCircle,
  Loader,
  Mail,
  User,
  Shield,
  Phone,
  Briefcase,
  Building
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// CONSTANTS
// ============================================================================
const ROLES = [
  { value: 'PM', label: 'Project Manager', description: 'Manages assigned projects' },
  { value: 'Director', label: 'Director', description: 'Portfolio oversight' },
  { value: 'VP', label: 'VP', description: 'Executive access' },
  { value: 'IT', label: 'IT', description: 'System administration' },
  { value: 'Admin', label: 'Admin', description: 'Full system access' },
  { value: 'Project Coordinator', label: 'Project Coordinator', description: 'Task support' },
  { value: 'Plant Manager', label: 'Plant Manager', description: 'Factory oversight' }
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
    maxWidth: '500px',
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
    marginBottom: 'var(--space-md)'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
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
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
    fontSize: '0.875rem',
    marginBottom: 'var(--space-lg)'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-md)'
  },
  primaryButton: {
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
    minWidth: '120px'
  },
  cancelButton: {
    padding: 'var(--space-sm) var(--space-lg)',
    background: 'var(--bg-tertiary)',
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
  },
  hint: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginTop: 'var(--space-xs)'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function CreateUserModal({ isOpen, onClose, onSuccess }) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'PM',
    title: '',
    department: '',
    phone: '',
    is_active: true
  });

  // ==========================================================================
  // VALIDATION
  // ==========================================================================
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email.toLowerCase())
        .single();

      if (existingUser) {
        setError('A user with this email already exists');
        setLoading(false);
        return;
      }

      // Create user record
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        title: formData.title.trim() || null,
        department: formData.department.trim() || null,
        phone: formData.phone.trim() || null,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert([userData]);

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'PM',
        title: '',
        department: '',
        phone: '',
        is_active: true
      });

      onSuccess();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      role: 'PM',
      title: '',
      department: '',
      phone: '',
      is_active: true
    });
    setError('');
    setFieldErrors({});
    onClose();
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <UserPlus size={24} style={{ color: '#3b82f6' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Create New User
            </h2>
          </div>
          <button
            onClick={handleClose}
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

          {/* Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <User size={14} />
              Full Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Smith"
              style={{
                ...styles.input,
                ...(fieldErrors.name ? styles.inputError : {})
              }}
              autoFocus
            />
            {fieldErrors.name && (
              <div style={styles.errorText}>{fieldErrors.name}</div>
            )}
          </div>

          {/* Email */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Mail size={14} />
              Email Address <span style={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.smith@sunbeltmodular.com"
              style={{
                ...styles.input,
                ...(fieldErrors.email ? styles.inputError : {})
              }}
            />
            {fieldErrors.email && (
              <div style={styles.errorText}>{fieldErrors.email}</div>
            )}
            <div style={styles.hint}>
              User will receive an invitation email to set their password
            </div>
          </div>

          {/* Role */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Shield size={14} />
              Role <span style={styles.required}>*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                ...styles.select,
                ...(fieldErrors.role ? styles.inputError : {})
              }}
            >
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
            {fieldErrors.role && (
              <div style={styles.errorText}>{fieldErrors.role}</div>
            )}
          </div>

          {/* Title & Department */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Briefcase size={14} />
                Job Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Senior PM"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Building size={14} />
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Construction"
                style={styles.input}
              />
            </div>
          </div>

          {/* Phone */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Phone size={14} />
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              style={styles.input}
            />
          </div>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={handleClose}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
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
                <UserPlus size={16} />
                Create User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateUserModal;