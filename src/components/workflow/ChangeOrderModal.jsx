// ============================================================================
// ChangeOrderModal.jsx - Change Order Management Modal
// ============================================================================
// Modal component for creating and managing change orders within projects.
// Supports redlines, general changes, and pricing adjustments.
//
// FEATURES:
// - Create new change orders
// - Edit existing change orders
// - Add/remove line items
// - Track status workflow (Draft → Sent → Signed → Implemented)
// - Calculate totals automatically
// - Email notification integration
// - File attachments support
//
// Created: January 9, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Send, FileText, DollarSign } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { draftChangeOrderEmail } from '../../utils/emailUtils';
import { CHANGE_ORDER_TYPES, CHANGE_ORDER_STATUSES } from '../../utils/workflowUtils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ChangeOrderModal({
  isOpen,
  onClose,
  project,
  changeOrder = null, // null for new, object for edit
  onSuccess,
}) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    co_number: '',
    co_type: 'General',
    status: 'Draft',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    sent_date: '',
    signed_date: '',
    implemented_date: '',
    total_amount: 0,
  });
  const [lineItems, setLineItems] = useState([]);
  const [nextCONumber, setNextCONumber] = useState('');

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (isOpen) {
      if (changeOrder) {
        // Edit mode - populate form with existing data
        setFormData({
          co_number: changeOrder.co_number || '',
          co_type: changeOrder.co_type || 'General',
          status: changeOrder.status || 'Draft',
          notes: changeOrder.notes || '',
          date: changeOrder.date || new Date().toISOString().split('T')[0],
          sent_date: changeOrder.sent_date || '',
          signed_date: changeOrder.signed_date || '',
          implemented_date: changeOrder.implemented_date || '',
          total_amount: changeOrder.total_amount || 0,
        });
        fetchLineItems(changeOrder.id);
      } else {
        // New mode - reset form and get next CO number
        resetForm();
        generateNextCONumber();
      }
    }
  }, [isOpen, changeOrder]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const generateNextCONumber = async () => {
    try {
      const { data, error } = await supabase
        .from('change_orders')
        .select('co_number')
        .eq('project_id', project?.id)
        .order('co_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNum = 1;
      if (data && data.length > 0 && data[0].co_number) {
        nextNum = data[0].co_number + 1;
      }

      setNextCONumber(nextNum);
      setFormData(prev => ({ ...prev, co_number: nextNum }));
    } catch (err) {
      console.error('Error generating CO number:', err);
      setNextCONumber(1);
      setFormData(prev => ({ ...prev, co_number: 1 }));
    }
  };

  const fetchLineItems = async (changeOrderId) => {
    try {
      const { data, error } = await supabase
        .from('change_order_items')
        .select('*')
        .eq('change_order_id', changeOrderId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setLineItems(data || []);
    } catch (err) {
      console.error('Error fetching line items:', err);
      setLineItems([]);
    }
  };

  const resetForm = () => {
    setFormData({
      co_number: '',
      co_type: 'General',
      status: 'Draft',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      sent_date: '',
      signed_date: '',
      implemented_date: '',
      total_amount: 0,
    });
    setLineItems([]);
    setError('');
  };

  // ==========================================================================
  // LINE ITEM HANDLERS
  // ==========================================================================

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        description: '',
        price: 0,
        sort_order: prev.length,
        isNew: true,
      },
    ]);
  };

  const updateLineItem = (index, field, value) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeLineItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate total from line items
  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  };

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const totalAmount = calculateTotal();
      const coData = {
        project_id: project?.id,
        co_number: parseInt(formData.co_number) || 1,
        co_type: formData.co_type,
        status: formData.status,
        date: formData.date || new Date().toISOString().split('T')[0],
        notes: formData.notes?.trim() || null,
        sent_date: formData.sent_date || null,
        signed_date: formData.signed_date || null,
        implemented_date: formData.implemented_date || null,
        total_amount: totalAmount,
        created_by: user?.id,
      };

      let changeOrderId;

      if (changeOrder) {
        // Update existing
        const { error: updateError } = await supabase
          .from('change_orders')
          .update({
            ...coData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', changeOrder.id);

        if (updateError) throw updateError;
        changeOrderId = changeOrder.id;

        // Delete existing line items and re-insert
        await supabase
          .from('change_order_items')
          .delete()
          .eq('change_order_id', changeOrderId);
      } else {
        // Insert new
        const { data: newCO, error: insertError } = await supabase
          .from('change_orders')
          .insert(coData)
          .select()
          .single();

        if (insertError) throw insertError;
        changeOrderId = newCO.id;
      }

      // Insert line items
      if (lineItems.length > 0) {
        const itemsToInsert = lineItems.map((item, index) => ({
          change_order_id: changeOrderId,
          description: item.description,
          price: parseFloat(item.price) || 0,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('change_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error saving change order:', err);
      setError(err.message || 'Failed to save change order');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = () => {
    draftChangeOrderEmail({
      to: project?.dealer_email || '',
      project: {
        name: project?.name,
        project_number: project?.project_number,
      },
      changeOrder: {
        co_number: formData.co_number,
        co_type: formData.co_type,
        status: formData.status,
        notes: formData.notes,
        amount: calculateTotal(),
      },
      type: formData.status === 'Signed' ? 'signed' : formData.status === 'Sent' ? 'reminder' : 'initial',
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!isOpen) return null;

  const total = calculateTotal();

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
        maxWidth: '800px',
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
              background: 'rgba(255, 107, 53, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileText size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                {changeOrder ? 'Edit Change Order' : 'New Change Order'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {project?.project_number} — {project?.name}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            {changeOrder && (
              <button
                type="button"
                onClick={handleSendEmail}
                style={{
                  padding: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--success)',
                  cursor: 'pointer',
                  display: 'flex',
                }}
                title="Send Email"
              >
                <Send size={18} />
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
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          {/* ============================================================ */}
          {/* BASIC INFO                                                   */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">CO Number *</label>
              <input
                type="number"
                name="co_number"
                value={formData.co_number}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="1"
                min="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                name="co_type"
                value={formData.co_type}
                onChange={handleChange}
                className="form-input"
              >
                {CHANGE_ORDER_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
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
                {CHANGE_ORDER_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ============================================================ */}
          {/* NOTES                                                        */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
              rows="3"
              style={{ resize: 'vertical', minHeight: '80px' }}
              placeholder="Change order details and notes..."
            />
          </div>

          {/* ============================================================ */}
          {/* DATES                                                        */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sent Date</label>
              <input
                type="date"
                name="sent_date"
                value={formData.sent_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Signed Date</label>
              <input
                type="date"
                name="signed_date"
                value={formData.signed_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Implemented Date</label>
              <input
                type="date"
                name="implemented_date"
                value={formData.implemented_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* LINE ITEMS                                                   */}
          {/* ============================================================ */}
          <div style={{
            marginTop: 'var(--space-xl)',
            padding: 'var(--space-lg)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Line Items
              </h4>
              <button
                type="button"
                onClick={addLineItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: 'var(--sunbelt-orange)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            {/* Line Items Table */}
            {lineItems.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)', fontWeight: '600' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontWeight: '600', width: '150px' }}>Price</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 4px' }}>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 8px', fontSize: '0.875rem' }}
                            placeholder="Item description"
                          />
                        </td>
                        <td style={{ padding: '8px 4px' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateLineItem(index, 'price', e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 8px', fontSize: '0.875rem', textAlign: 'right' }}
                          />
                        </td>
                        <td style={{ padding: '8px 4px' }}>
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--space-lg)' }}>
                No line items. Click "Add Item" to add items.
              </p>
            )}

            {/* Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 'var(--space-lg)',
              marginTop: 'var(--space-lg)',
              paddingTop: 'var(--space-md)',
              borderTop: '2px solid var(--border-color)',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Total:</span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--sunbelt-orange)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <DollarSign size={20} />
                {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* ACTION BUTTONS                                               */}
          {/* ============================================================ */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            justifyContent: 'flex-end',
            paddingTop: 'var(--space-xl)',
            marginTop: 'var(--space-lg)',
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : <><Save size={18} /> Save Change Order</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangeOrderModal;
