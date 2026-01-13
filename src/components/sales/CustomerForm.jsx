// ============================================================================
// CustomerForm.jsx - Create/Edit Customer Modal
// ============================================================================
// Modal form for creating and editing customer records.
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const FACTORIES = ['NWBS', 'WM-EAST', 'WM-WEST', 'MM', 'SSI', 'MS', 'MG', 'SEMO', 'PMI', 'AMTEX', 'BRIT', 'CB', 'IND', 'MRS'];

const COMPANY_TYPES = [
  { value: 'dealer', label: 'Dealer' },
  { value: 'direct', label: 'Direct Customer' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'developer', label: 'Developer' },
  { value: 'government', label: 'Government' },
  { value: 'general', label: 'General' }
];

const SOURCES = [
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'existing', label: 'Existing Customer' },
  { value: 'other', label: 'Other' }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function CustomerForm({ customer, onSave, onCancel }) {
  const { user } = useAuth();
  const isEditing = !!customer;

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    company_type: 'general',
    contact_name: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    secondary_contact_name: '',
    secondary_contact_email: '',
    secondary_contact_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    source: '',
    notes: '',
    factory: user?.factory || FACTORIES[0]
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  useEffect(() => {
    if (customer) {
      setFormData({
        company_name: customer.company_name || '',
        company_type: customer.company_type || 'general',
        contact_name: customer.contact_name || '',
        contact_title: customer.contact_title || '',
        contact_email: customer.contact_email || '',
        contact_phone: customer.contact_phone || '',
        secondary_contact_name: customer.secondary_contact_name || '',
        secondary_contact_email: customer.secondary_contact_email || '',
        secondary_contact_phone: customer.secondary_contact_phone || '',
        address_line1: customer.address_line1 || '',
        address_line2: customer.address_line2 || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        source: customer.source || '',
        notes: customer.notes || '',
        factory: customer.factory || FACTORIES[0]
      });
    }
  }, [customer]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.company_name.trim()) {
      alert('Company name is required');
      return;
    }

    if (!formData.factory) {
      alert('Factory is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        company_name: formData.company_name.trim(),
        company_type: formData.company_type,
        contact_name: formData.contact_name.trim() || null,
        contact_title: formData.contact_title.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        secondary_contact_name: formData.secondary_contact_name.trim() || null,
        secondary_contact_email: formData.secondary_contact_email.trim() || null,
        secondary_contact_phone: formData.secondary_contact_phone.trim() || null,
        address_line1: formData.address_line1.trim() || null,
        address_line2: formData.address_line2.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        source: formData.source || null,
        notes: formData.notes.trim() || null,
        factory: formData.factory
      };

      if (isEditing) {
        const { error } = await supabase
          .from('sales_customers')
          .update(payload)
          .eq('id', customer.id);

        if (error) throw error;
      } else {
        payload.created_by = user?.id;

        const { error } = await supabase
          .from('sales_customers')
          .insert([payload]);

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div
      style={{
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
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-primary)',
          zIndex: 10
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            {isEditing ? 'Edit Customer' : 'New Customer'}
          </h3>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Company Info */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Building2 size={16} />
              Company Information
            </h4>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    Company Type
                  </label>
                  <select
                    value={formData.company_type}
                    onChange={(e) => handleChange('company_type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}
                  >
                    {COMPANY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="">Select source</option>
                    {SOURCES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    Factory *
                  </label>
                  <select
                    value={formData.factory}
                    onChange={(e) => handleChange('factory', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}
                  >
                    {FACTORIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <User size={16} />
              Primary Contact
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => handleChange('contact_name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.contact_title}
                  onChange={(e) => handleChange('contact_title', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MapPin size={16} />
              Address
            </h4>

            <div style={{ display: 'grid', gap: '12px' }}>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                placeholder="Address Line 1"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              />
              <input
                type="text"
                value={formData.address_line2}
                onChange={(e) => handleChange('address_line2', e.target.value)}
                placeholder="Address Line 2"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="City"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                />
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="State"
                  maxLength={2}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    textTransform: 'uppercase'
                  }}
                />
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => handleChange('zip_code', e.target.value)}
                  placeholder="ZIP"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                background: 'var(--sunbelt-orange)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? 'Update Customer' : 'Create Customer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default CustomerForm;
