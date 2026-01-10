// ============================================================================
// LongLeadFormBuilder.jsx - Long Lead Items Manager
// ============================================================================
// Component for managing long lead items within projects.
// Long lead items are materials/equipment that require extended order times.
//
// FEATURES:
// - Add/edit/remove long lead items
// - Track order status and dates
// - Calculate expected delivery based on lead time
// - Email notifications for delays
// - Status tracking (Pending, Ordered, In Transit, Delivered)
//
// Created: January 9, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Send, Package, Truck, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { draftLongLeadEmail } from '../../utils/emailUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

const LONG_LEAD_STATUSES = [
  { value: 'Pending', label: 'Pending Order', color: 'var(--text-tertiary)', icon: Clock },
  { value: 'Ordered', label: 'Ordered', color: 'var(--info)', icon: Package },
  { value: 'In Transit', label: 'In Transit', color: 'var(--warning)', icon: Truck },
  { value: 'Delivered', label: 'Delivered', color: 'var(--success)', icon: CheckCircle },
  { value: 'Delayed', label: 'Delayed', color: 'var(--danger)', icon: Clock },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function LongLeadFormBuilder({
  isOpen,
  onClose,
  project,
  onSuccess,
}) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form state for adding/editing items
  const [formData, setFormData] = useState({
    item_name: '',
    manufacturer: '',
    model_number: '',
    quantity: 1,
    lead_time_weeks: '',
    has_cutsheet: false,
    cutsheet_url: '',
    cutsheet_name: '',
    status: 'Pending',
    submitted_date: '',
    signoff_date: '',
    notes: '',
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (isOpen && project?.id) {
      fetchLongLeadItems();
    }
  }, [isOpen, project?.id]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const fetchLongLeadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('long_lead_items')
        .select('*')
        .eq('project_id', project?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching long lead items:', err);
      setError('Failed to load long lead items');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================

  const resetForm = () => {
    setFormData({
      item_name: '',
      manufacturer: '',
      model_number: '',
      quantity: 1,
      lead_time_weeks: '',
      has_cutsheet: false,
      cutsheet_url: '',
      cutsheet_name: '',
      status: 'Pending',
      submitted_date: '',
      signoff_date: '',
      notes: '',
    });
    setEditingItem(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditItem = (item) => {
    setFormData({
      item_name: item.item_name || '',
      manufacturer: item.manufacturer || '',
      model_number: item.model_number || '',
      quantity: item.quantity || 1,
      lead_time_weeks: item.lead_time_weeks || '',
      has_cutsheet: item.has_cutsheet || false,
      cutsheet_url: item.cutsheet_url || '',
      cutsheet_name: item.cutsheet_name || '',
      status: item.status || 'Pending',
      submitted_date: item.submitted_date || '',
      signoff_date: item.signoff_date || '',
      notes: item.notes || '',
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSaveItem = async () => {
    if (!formData.item_name.trim()) {
      setError('Item name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const itemData = {
        project_id: project?.id,
        item_name: formData.item_name.trim(),
        manufacturer: formData.manufacturer.trim() || null,
        model_number: formData.model_number.trim() || null,
        quantity: parseInt(formData.quantity) || 1,
        lead_time_weeks: parseInt(formData.lead_time_weeks) || null,
        has_cutsheet: formData.has_cutsheet || false,
        cutsheet_url: formData.cutsheet_url.trim() || null,
        cutsheet_name: formData.cutsheet_name.trim() || null,
        status: formData.status,
        submitted_date: formData.submitted_date || null,
        signoff_date: formData.signoff_date || null,
        notes: formData.notes.trim() || null,
      };

      if (editingItem) {
        // Update existing
        const { error: updateError } = await supabase
          .from('long_lead_items')
          .update({
            ...itemData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('long_lead_items')
          .insert(itemData);

        if (insertError) throw insertError;
      }

      await fetchLongLeadItems();
      handleCancelForm();
    } catch (err) {
      console.error('Error saving long lead item:', err);
      setError(err.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this long lead item?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('long_lead_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;
      await fetchLongLeadItems();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.message || 'Failed to delete item');
    }
  };

  const handleSendEmail = (item, type = 'order') => {
    draftLongLeadEmail({
      to: project?.dealer_email || '',
      project: {
        name: project?.name,
        project_number: project?.project_number,
      },
      item: item,
      type: type,
    });
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const getStatusConfig = (status) => {
    return LONG_LEAD_STATUSES.find(s => s.value === status) || LONG_LEAD_STATUSES[0];
  };

  const isOverdue = (item) => {
    // Item is overdue if submitted but not signed off after reasonable time based on lead time
    if (!item.submitted_date || item.status === 'Delivered' || item.signoff_date) return false;
    if (!item.lead_time_weeks) return false;
    const submitted = new Date(item.submitted_date);
    const expectedDate = new Date(submitted);
    expectedDate.setDate(expectedDate.getDate() + (item.lead_time_weeks * 7));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expectedDate < today;
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
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-xl)',
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
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(20, 184, 166, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Package size={20} style={{ color: '#14b8a6' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                Long Lead Items
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {project?.project_number} — {project?.name}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            {!showForm && (
              <button
                type="button"
                onClick={handleAddNew}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 16px',
                  background: 'var(--sunbelt-orange)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Add Item
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* CONTENT                                                         */}
        {/* ================================================================ */}
        <div style={{ padding: 'var(--space-xl)' }}>
          {/* Error Display */}
          {error && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              color: 'var(--danger)',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          {/* ============================================================ */}
          {/* ADD/EDIT FORM                                                */}
          {/* ============================================================ */}
          {showForm && (
            <div style={{
              padding: 'var(--space-lg)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: 'var(--space-xl)',
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-lg)' }}>
                {editingItem ? 'Edit Long Lead Item' : 'Add New Long Lead Item'}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input
                    type="text"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., HVAC Unit"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-input"
                  >
                    {LONG_LEAD_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Carrier"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Model Number</label>
                  <input
                    type="text"
                    name="model_number"
                    value={formData.model_number}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., 50XC-A04A2A6A0A0A0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="form-input"
                    min="1"
                    placeholder="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lead Time (weeks)</label>
                  <input
                    type="number"
                    name="lead_time_weeks"
                    value={formData.lead_time_weeks}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    placeholder="e.g., 12"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Submitted Date</label>
                  <input
                    type="date"
                    name="submitted_date"
                    value={formData.submitted_date}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sign-off Date</label>
                  <input
                    type="date"
                    name="signoff_date"
                    value={formData.signoff_date}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="has_cutsheet"
                      checked={formData.has_cutsheet}
                      onChange={handleChange}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span className="form-label" style={{ margin: 0 }}>Has Cutsheet</span>
                  </label>
                </div>

                {formData.has_cutsheet && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Cutsheet Name</label>
                      <input
                        type="text"
                        name="cutsheet_name"
                        value={formData.cutsheet_name}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Cutsheet document name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Cutsheet URL</label>
                      <input
                        type="text"
                        name="cutsheet_url"
                        value={formData.cutsheet_url}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="https://..."
                      />
                    </div>
                  </>
                )}

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="form-input"
                    rows="2"
                    style={{ resize: 'vertical' }}
                    placeholder="Internal notes..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
                <button type="button" onClick={handleCancelForm} className="btn btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveItem}
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : <><Save size={18} /> Save Item</>}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ITEMS LIST                                                   */}
          {/* ============================================================ */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
              Loading items...
            </div>
          ) : items.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-xl)',
              color: 'var(--text-tertiary)',
            }}>
              <Package size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
              <p style={{ marginBottom: 'var(--space-sm)' }}>No long lead items yet</p>
              <p style={{ fontSize: '0.875rem' }}>Click "Add Item" to track materials with extended lead times</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {items.map(item => {
                const statusConfig = getStatusConfig(item.status);
                const StatusIcon = statusConfig.icon;
                const overdue = isOverdue(item);

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: 'var(--space-lg)',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${overdue ? 'var(--danger)' : 'var(--border-color)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {item.item_name}
                          </h4>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: `${statusConfig.color}20`,
                            color: statusConfig.color,
                          }}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                          {overdue && (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--danger-light)',
                              color: 'var(--danger)',
                            }}>
                              OVERDUE
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', fontSize: '0.875rem' }}>
                          {item.manufacturer && (
                            <div>
                              <span style={{ color: 'var(--text-tertiary)' }}>Manufacturer: </span>
                              <span style={{ color: 'var(--text-secondary)' }}>{item.manufacturer}</span>
                            </div>
                          )}
                          {item.model_number && (
                            <div>
                              <span style={{ color: 'var(--text-tertiary)' }}>Model: </span>
                              <span style={{ color: 'var(--text-secondary)' }}>{item.model_number}</span>
                            </div>
                          )}
                          {item.lead_time_weeks && (
                            <div>
                              <span style={{ color: 'var(--text-tertiary)' }}>Lead Time: </span>
                              <span style={{ color: 'var(--text-secondary)' }}>{item.lead_time_weeks} weeks</span>
                            </div>
                          )}
                          {item.quantity > 1 && (
                            <div>
                              <span style={{ color: 'var(--text-tertiary)' }}>Qty: </span>
                              <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <button
                          type="button"
                          onClick={() => handleSendEmail(item, overdue ? 'delay' : 'order')}
                          style={{
                            padding: '6px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--success)',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                          title="Send Email"
                        >
                          <Send size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditItem(item)}
                          style={{
                            padding: '6px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                          title="Edit"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          style={{
                            padding: '6px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* FOOTER                                                          */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-lg) var(--space-xl)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default LongLeadFormBuilder;
