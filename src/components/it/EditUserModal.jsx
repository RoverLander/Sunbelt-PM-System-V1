// ============================================================================
// EditUserModal.jsx - Edit Existing User Modal
// ============================================================================
// Modal form for IT admins to edit user accounts.
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  AlertCircle,
  Loader,
  Mail,
  Shield,
  Phone,
  Briefcase,
  Building,
  Save,
  Factory
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// CONSTANTS
// ============================================================================
const ROLES = [
  { value: 'PM', label: 'Project Manager' },
  { value: 'Director', label: 'Director' },
  { value: 'VP', label: 'VP' },
  { value: 'IT', label: 'IT' },
  { value: 'IT_Manager', label: 'IT Manager' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Project Coordinator', label: 'Project Coordinator' },
  { value: 'Plant Manager', label: 'Plant Manager' },
  { value: 'Sales_Rep', label: 'Sales Rep' },
  { value: 'Sales_Manager', label: 'Sales Manager' }
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
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    cursor: 'pointer'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function EditUserModal({ isOpen, onClose, user, onSuccess }) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [factories, setFactories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'PM',
    title: '',
    department: '',
    phone: '',
    factory_id: '',
    is_active: true
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  // Fetch factories list
  useEffect(() => {
    const fetchFactories = async () => {
      const { data } = await supabase
        .from('factories')
        .select('id, short_name, code')
        .eq('is_active', true)
        .order('short_name');
      setFactories(data || []);
    };
    if (isOpen) {
      fetchFactories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'PM',
        title: user.title || '',
        department: user.department || '',
        phone: user.phone || '',
        factory_id: user.factory_id || '',
        is_active: user.is_active !== false
      });
      setError('');
      setFieldErrors({});
    }
  }, [isOpen, user]);

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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

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
      // Check if email changed and already exists
      if (formData.email.toLowerCase() !== user.email?.toLowerCase()) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', formData.email.toLowerCase())
          .neq('id', user.id)
          .single();

        if (existingUser) {
          setError('A user with this email already exists');
          setLoading(false);
          return;
        }
      }

      // Update user record
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        title: formData.title.trim() || null,
        department: formData.department.trim() || null,
        phone: formData.phone.trim() || null,
        factory_id: formData.factory_id || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!isOpen || !user) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <User size={24} style={{ color: '#3b82f6' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Edit User
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
              style={styles.select}
            >
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
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

          {/* Factory Assignment */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Factory size={14} />
              Assigned Factory
            </label>
            <select
              name="factory_id"
              value={formData.factory_id}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">No factory assigned</option>
              {factories.map(factory => (
                <option key={factory.id} value={factory.id}>
                  {factory.short_name} ({factory.code})
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Required for Project Coordinator and Plant Manager roles
            </div>
          </div>

          {/* Active Status */}
          <div style={styles.formGroup}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--text-primary)' }}>User is active</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={onClose}
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
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditUserModal;