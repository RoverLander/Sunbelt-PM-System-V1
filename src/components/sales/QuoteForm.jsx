// ============================================================================
// QuoteForm.jsx - Create/Edit Quote Modal
// ============================================================================
// Modal form for creating and editing sales quotes.
//
// FEATURES:
// - Customer selection or quick-create
// - Product configuration (flexible JSONB)
// - Pricing with discounts
// - Timeline and terms
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  User,
  Plus,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const FACTORIES = ['NWBS', 'WM-EAST', 'WM-WEST', 'MM', 'SSI', 'MS', 'MG', 'SEMO', 'PMI', 'AMTEX', 'BRIT', 'CB', 'IND', 'MRS'];

const PRODUCT_TYPES = [
  { value: 'modular_building', label: 'Modular Building' },
  { value: 'portable_building', label: 'Portable Building' },
  { value: 'custom_structure', label: 'Custom Structure' },
  { value: 'renovation', label: 'Renovation/Addition' },
  { value: 'other', label: 'Other' }
];

const PAYMENT_TERMS = [
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_60', label: 'Net 60' },
  { value: '50_50', label: '50% Deposit / 50% on Delivery' },
  { value: 'progress', label: 'Progress Payments' },
  { value: 'custom', label: 'Custom Terms' }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function QuoteForm({ quote, customers, onSave, onCancel }) {
  const { user } = useAuth();
  const isEditing = !!quote;

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [saving, setSaving] = useState(false);
  const [salesUsers, setSalesUsers] = useState([]);

  const [formData, setFormData] = useState({
    // Customer
    customer_id: '',

    // Project Info
    project_name: '',
    project_description: '',
    project_location: '',
    project_city: '',
    project_state: '',

    // Factory & Assignment
    factory: user?.factory || FACTORIES[0],
    assigned_to: user?.id || '',

    // Product
    product_type: 'modular_building',
    product_config: {},

    // Pricing
    base_price: '',
    options_price: '',
    discount_amount: '',
    discount_percent: '',

    // Terms
    payment_terms: 'net_30',
    deposit_required: '',
    requested_delivery_date: '',
    estimated_production_weeks: '',
    quote_valid_until: '',

    // Notes
    internal_notes: '',
    customer_notes: '',

    // Status
    is_enabled: true
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  useEffect(() => {
    fetchSalesUsers();

    if (quote) {
      setFormData({
        customer_id: quote.customer_id || '',
        project_name: quote.project_name || '',
        project_description: quote.project_description || '',
        project_location: quote.project_location || '',
        project_city: quote.project_city || '',
        project_state: quote.project_state || '',
        factory: quote.factory || FACTORIES[0],
        assigned_to: quote.assigned_to || '',
        product_type: quote.product_type || 'modular_building',
        product_config: quote.product_config || {},
        base_price: quote.base_price || '',
        options_price: quote.options_price || '',
        discount_amount: quote.discount_amount || '',
        discount_percent: quote.discount_percent || '',
        payment_terms: quote.payment_terms || 'net_30',
        deposit_required: quote.deposit_required || '',
        requested_delivery_date: quote.requested_delivery_date?.slice(0, 10) || '',
        estimated_production_weeks: quote.estimated_production_weeks || '',
        quote_valid_until: quote.quote_valid_until?.slice(0, 10) || '',
        internal_notes: quote.internal_notes || '',
        customer_notes: quote.customer_notes || '',
        is_enabled: true
      });
    }
  }, [quote]);

  const fetchSalesUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, factory, role')
        .in('role', ['Sales_Rep', 'Sales_Manager'])
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSalesUsers(data || []);
    } catch (error) {
      console.error('Error fetching sales users:', error);
    }
  };

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================
  const calculateTotal = () => {
    const base = parseFloat(formData.base_price) || 0;
    const options = parseFloat(formData.options_price) || 0;
    const subtotal = base + options;

    let discount = 0;
    if (formData.discount_percent) {
      discount = subtotal * (parseFloat(formData.discount_percent) / 100);
    } else if (formData.discount_amount) {
      discount = parseFloat(formData.discount_amount);
    }

    return Math.max(0, subtotal - discount);
  };

  const totalPrice = calculateTotal();

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.project_name.trim()) {
      alert('Project name is required');
      return;
    }

    if (!formData.factory) {
      alert('Factory is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer_id: formData.customer_id || null,
        project_name: formData.project_name.trim(),
        project_description: formData.project_description.trim() || null,
        project_location: formData.project_location.trim() || null,
        project_city: formData.project_city.trim() || null,
        project_state: formData.project_state.trim() || null,
        factory: formData.factory,
        assigned_to: formData.assigned_to || user?.id,
        product_type: formData.product_type,
        product_config: formData.product_config,
        base_price: formData.base_price ? parseFloat(formData.base_price) : null,
        options_price: formData.options_price ? parseFloat(formData.options_price) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        discount_percent: formData.discount_percent ? parseFloat(formData.discount_percent) : null,
        total_price: totalPrice,
        payment_terms: formData.payment_terms || null,
        deposit_required: formData.deposit_required ? parseFloat(formData.deposit_required) : null,
        requested_delivery_date: formData.requested_delivery_date || null,
        estimated_production_weeks: formData.estimated_production_weeks ? parseInt(formData.estimated_production_weeks) : null,
        quote_valid_until: formData.quote_valid_until || null,
        internal_notes: formData.internal_notes.trim() || null,
        customer_notes: formData.customer_notes.trim() || null,
        last_modified_by: user?.id
      };

      if (isEditing) {
        const { error } = await supabase
          .from('sales_quotes')
          .update(payload)
          .eq('id', quote.id);

        if (error) throw error;
      } else {
        // Generate quote number
        const { data: quoteNum, error: numError } = await supabase
          .rpc('generate_quote_number', { p_factory: formData.factory });

        if (numError) {
          // Fallback if RPC doesn't exist yet
          const timestamp = Date.now().toString().slice(-6);
          payload.quote_number = `${formData.factory}-${new Date().getFullYear()}-${timestamp}`;
        } else {
          payload.quote_number = quoteNum;
        }

        payload.created_by = user?.id;
        payload.status = 'draft';

        const { error } = await supabase
          .from('sales_quotes')
          .insert([payload]);

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Failed to save quote: ' + error.message);
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
          maxWidth: '700px',
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
            {isEditing ? 'Edit Quote' : 'New Quote'}
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
          {/* Customer Selection */}
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
              Customer
            </h4>
            <select
              value={formData.customer_id}
              onChange={(e) => handleChange('customer_id', e.target.value)}
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
              <option value="">Select customer (optional)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company_name} {c.contact_name ? `- ${c.contact_name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Project Info */}
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
              <FileText size={16} />
              Project Details
            </h4>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => handleChange('project_name', e.target.value)}
                  placeholder="e.g., Smith Office Building"
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

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  value={formData.project_description}
                  onChange={(e) => handleChange('project_description', e.target.value)}
                  placeholder="Brief description of the project..."
                  rows={2}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    Assigned To
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => handleChange('assigned_to', e.target.value)}
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
                    <option value="">Unassigned</option>
                    {salesUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.factory})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
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
              Delivery Location
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={formData.project_location}
                  onChange={(e) => handleChange('project_location', e.target.value)}
                  placeholder="Street address"
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
                  City
                </label>
                <input
                  type="text"
                  value={formData.project_city}
                  onChange={(e) => handleChange('project_city', e.target.value)}
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
                  State
                </label>
                <input
                  type="text"
                  value={formData.project_state}
                  onChange={(e) => handleChange('project_state', e.target.value)}
                  maxLength={2}
                  placeholder="TX"
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
              </div>
            </div>
          </div>

          {/* Product Type */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
              Product Type
            </label>
            <select
              value={formData.product_type}
              onChange={(e) => handleChange('product_type', e.target.value)}
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
              {PRODUCT_TYPES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Pricing */}
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
              <DollarSign size={16} />
              Pricing
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Base Price
                </label>
                <input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => handleChange('base_price', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
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
                  Options/Add-ons
                </label>
                <input
                  type="number"
                  value={formData.options_price}
                  onChange={(e) => handleChange('options_price', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
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
                  Discount %
                </label>
                <input
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => {
                    handleChange('discount_percent', e.target.value);
                    handleChange('discount_amount', '');
                  }}
                  placeholder="0"
                  min="0"
                  max="100"
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
                  Or Discount $
                </label>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => {
                    handleChange('discount_amount', e.target.value);
                    handleChange('discount_percent', '');
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
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

            {/* Total */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Total Price
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--sunbelt-orange)' }}>
                ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Timeline & Terms */}
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
              <Calendar size={16} />
              Timeline & Terms
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Requested Delivery
                </label>
                <input
                  type="date"
                  value={formData.requested_delivery_date}
                  onChange={(e) => handleChange('requested_delivery_date', e.target.value)}
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
                  Est. Production (weeks)
                </label>
                <input
                  type="number"
                  value={formData.estimated_production_weeks}
                  onChange={(e) => handleChange('estimated_production_weeks', e.target.value)}
                  placeholder="e.g., 8"
                  min="1"
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
                  Quote Valid Until
                </label>
                <input
                  type="date"
                  value={formData.quote_valid_until}
                  onChange={(e) => handleChange('quote_valid_until', e.target.value)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Payment Terms
                </label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => handleChange('payment_terms', e.target.value)}
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
                  {PAYMENT_TERMS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Deposit Required
                </label>
                <input
                  type="number"
                  value={formData.deposit_required}
                  onChange={(e) => handleChange('deposit_required', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Internal Notes (not on quote)
                </label>
                <textarea
                  value={formData.internal_notes}
                  onChange={(e) => handleChange('internal_notes', e.target.value)}
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
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  Customer Notes (on quote)
                </label>
                <textarea
                  value={formData.customer_notes}
                  onChange={(e) => handleChange('customer_notes', e.target.value)}
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
            </div>
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
                  {isEditing ? 'Update Quote' : 'Create Quote'}
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

export default QuoteForm;
