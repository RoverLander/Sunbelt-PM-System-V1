// ============================================================================
// ColorSelectionFormBuilder.jsx - Color Selection Manager
// ============================================================================
// Component for managing color selections within projects.
// Tracks dealer color choices for various building components.
//
// FEATURES:
// - Predefined color categories (Interior, Exterior, Trim, etc.)
// - Track submitted and confirmed selections
// - Email notifications for selection requests
// - Custom color entries
// - Status tracking (Pending, Submitted, Confirmed)
//
// Created: January 9, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Send, Palette, CheckCircle, Clock, Edit2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { draftColorSelectionEmail } from '../../utils/emailUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLOR_CATEGORIES = [
  { id: 'exterior_siding', name: 'Exterior Siding', description: 'Main exterior wall finish' },
  { id: 'exterior_trim', name: 'Exterior Trim', description: 'Window and door trim' },
  { id: 'roofing', name: 'Roofing', description: 'Roof material color' },
  { id: 'interior_walls', name: 'Interior Walls', description: 'Interior paint color' },
  { id: 'interior_trim', name: 'Interior Trim', description: 'Baseboards, casings, crown' },
  { id: 'flooring', name: 'Flooring', description: 'Floor covering material/color' },
  { id: 'cabinets', name: 'Cabinets', description: 'Kitchen/bathroom cabinetry' },
  { id: 'countertops', name: 'Countertops', description: 'Counter surface material/color' },
  { id: 'fixtures', name: 'Fixtures', description: 'Plumbing fixture finish' },
  { id: 'hardware', name: 'Hardware', description: 'Door handles, cabinet pulls' },
  { id: 'doors', name: 'Doors', description: 'Interior/exterior door color' },
  { id: 'other', name: 'Other', description: 'Custom category' },
];

const SELECTION_STATUSES = [
  { value: 'Pending', label: 'Pending Selection', color: 'var(--text-tertiary)', icon: Clock },
  { value: 'Submitted', label: 'Submitted', color: 'var(--info)', icon: Edit2 },
  { value: 'Confirmed', label: 'Confirmed', color: 'var(--success)', icon: CheckCircle },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ColorSelectionFormBuilder({
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
  const [selections, setSelections] = useState([]);
  const [editingSelection, setEditingSelection] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    custom_category: '',
    color_name: '',
    color_code: '',
    manufacturer: '',
    product_line: '',
    status: 'Pending',
    submitted_date: '',
    confirmed_date: '',
    notes: '',
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (isOpen && project?.id) {
      fetchColorSelections();
    }
  }, [isOpen, project?.id]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const fetchColorSelections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('color_selections')
        .select('*')
        .eq('project_id', project?.id)
        .order('category', { ascending: true });

      if (error) throw error;
      setSelections(data || []);
    } catch (err) {
      console.error('Error fetching color selections:', err);
      setError('Failed to load color selections');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================

  const resetForm = () => {
    setFormData({
      category: '',
      custom_category: '',
      color_name: '',
      color_code: '',
      manufacturer: '',
      product_line: '',
      status: 'Pending',
      submitted_date: '',
      confirmed_date: '',
      notes: '',
    });
    setEditingSelection(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSelection = (selection) => {
    setFormData({
      category: selection.category || '',
      custom_category: selection.custom_category || '',
      color_name: selection.color_name || '',
      color_code: selection.color_code || '',
      manufacturer: selection.manufacturer || '',
      product_line: selection.product_line || '',
      status: selection.status || 'Pending',
      submitted_date: selection.submitted_date || '',
      confirmed_date: selection.confirmed_date || '',
      notes: selection.notes || '',
    });
    setEditingSelection(selection);
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

  const handleSaveSelection = async () => {
    if (!formData.category) {
      setError('Category is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const selectionData = {
        project_id: project?.id,
        category: formData.category,
        custom_category: formData.category === 'other' ? formData.custom_category.trim() : null,
        color_name: formData.color_name.trim() || null,
        color_code: formData.color_code.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        product_line: formData.product_line.trim() || null,
        status: formData.status,
        submitted_date: formData.submitted_date || null,
        confirmed_date: formData.confirmed_date || null,
        notes: formData.notes.trim() || null,
      };

      if (editingSelection) {
        // Update existing
        const { error: updateError } = await supabase
          .from('color_selections')
          .update({
            ...selectionData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSelection.id);

        if (updateError) throw updateError;
      } else {
        // Check for duplicate category
        const existing = selections.find(s => s.category === formData.category);
        if (existing) {
          setError('A selection for this category already exists. Edit the existing entry instead.');
          setSaving(false);
          return;
        }

        // Insert new
        const { error: insertError } = await supabase
          .from('color_selections')
          .insert({
            ...selectionData,
            created_by: user?.id,
          });

        if (insertError) throw insertError;
      }

      await fetchColorSelections();
      handleCancelForm();
    } catch (err) {
      console.error('Error saving color selection:', err);
      setError(err.message || 'Failed to save selection');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelection = async (selectionId) => {
    if (!confirm('Are you sure you want to delete this color selection?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('color_selections')
        .delete()
        .eq('id', selectionId);

      if (deleteError) throw deleteError;
      await fetchColorSelections();
    } catch (err) {
      console.error('Error deleting selection:', err);
      setError(err.message || 'Failed to delete selection');
    }
  };

  const handleSendEmail = () => {
    const pendingCategories = selections
      .filter(s => s.status === 'Pending')
      .map(s => getCategoryName(s.category));

    draftColorSelectionEmail({
      to: project?.dealer_email || '',
      project: {
        name: project?.name,
        project_number: project?.project_number,
      },
      categories: pendingCategories,
      dueDate: '', // Can add due date if needed
    });
  };

  const handleQuickStatusUpdate = async (selectionId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'Submitted' && !selections.find(s => s.id === selectionId)?.submitted_date) {
        updateData.submitted_date = new Date().toISOString().split('T')[0];
      }
      if (newStatus === 'Confirmed' && !selections.find(s => s.id === selectionId)?.confirmed_date) {
        updateData.confirmed_date = new Date().toISOString().split('T')[0];
      }

      const { error: updateError } = await supabase
        .from('color_selections')
        .update(updateData)
        .eq('id', selectionId);

      if (updateError) throw updateError;
      await fetchColorSelections();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const getStatusConfig = (status) => {
    return SELECTION_STATUSES.find(s => s.value === status) || SELECTION_STATUSES[0];
  };

  const getCategoryName = (categoryId) => {
    const category = COLOR_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getProgress = () => {
    const total = selections.length;
    const confirmed = selections.filter(s => s.status === 'Confirmed').length;
    return { total, confirmed, percentage: total > 0 ? Math.round((confirmed / total) * 100) : 0 };
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!isOpen) return null;

  const progress = getProgress();

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
              background: 'rgba(236, 72, 153, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Palette size={20} style={{ color: '#ec4899' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                Color Selections
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {project?.project_number} — {project?.name}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            {selections.some(s => s.status === 'Pending') && (
              <button
                type="button"
                onClick={handleSendEmail}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--success)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Send size={16} /> Request Selections
              </button>
            )}
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
                <Plus size={16} /> Add Category
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
        {/* PROGRESS BAR                                                    */}
        {/* ================================================================ */}
        {selections.length > 0 && (
          <div style={{
            padding: 'var(--space-md) var(--space-xl)',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Selection Progress
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {progress.confirmed} / {progress.total} Confirmed ({progress.percentage}%)
              </span>
            </div>
            <div style={{
              height: '8px',
              background: 'var(--bg-primary)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress.percentage}%`,
                background: 'var(--success)',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}

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
                {editingSelection ? 'Edit Color Selection' : 'Add Color Selection'}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="form-input"
                    disabled={!!editingSelection}
                  >
                    <option value="">Select category...</option>
                    {COLOR_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {formData.category === 'other' && (
                  <div className="form-group">
                    <label className="form-label">Custom Category Name</label>
                    <input
                      type="text"
                      name="custom_category"
                      value={formData.custom_category}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter custom category..."
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-input"
                  >
                    {SELECTION_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Color Name</label>
                  <input
                    type="text"
                    name="color_name"
                    value={formData.color_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Arctic White"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Color Code</label>
                  <input
                    type="text"
                    name="color_code"
                    value={formData.color_code}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., SW 7047"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Sherwin-Williams"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Line</label>
                  <input
                    type="text"
                    name="product_line"
                    value={formData.product_line}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Duration Exterior"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="form-input"
                    rows="2"
                    style={{ resize: 'vertical' }}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
                <button type="button" onClick={handleCancelForm} className="btn btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSelection}
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : <><Save size={18} /> Save Selection</>}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SELECTIONS LIST                                              */}
          {/* ============================================================ */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
              Loading selections...
            </div>
          ) : selections.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-xl)',
              color: 'var(--text-tertiary)',
            }}>
              <Palette size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
              <p style={{ marginBottom: 'var(--space-sm)' }}>No color selections yet</p>
              <p style={{ fontSize: '0.875rem' }}>Click "Add Category" to start tracking color selections</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
              {selections.map(selection => {
                const statusConfig = getStatusConfig(selection.status);
                const StatusIcon = statusConfig.icon;
                const categoryConfig = COLOR_CATEGORIES.find(c => c.id === selection.category);

                return (
                  <div
                    key={selection.id}
                    style={{
                      padding: 'var(--space-lg)',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                      <div>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {selection.category === 'other' ? selection.custom_category : categoryConfig?.name}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {categoryConfig?.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <button
                          type="button"
                          onClick={() => handleEditSelection(selection)}
                          style={{
                            padding: '4px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSelection(selection.id)}
                          style={{
                            padding: '4px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {selection.color_name && (
                      <div style={{
                        padding: 'var(--space-md)',
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-md)',
                      }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {selection.color_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {[selection.color_code, selection.manufacturer, selection.product_line].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    )}

                    {/* Quick Status Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      {SELECTION_STATUSES.map(status => {
                        const Icon = status.icon;
                        const isActive = selection.status === status.value;
                        return (
                          <button
                            key={status.value}
                            type="button"
                            onClick={() => !isActive && handleQuickStatusUpdate(selection.id, status.value)}
                            style={{
                              flex: 1,
                              padding: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              border: `1px solid ${isActive ? status.color : 'var(--border-color)'}`,
                              borderRadius: 'var(--radius-sm)',
                              background: isActive ? `${status.color}15` : 'var(--bg-primary)',
                              color: isActive ? status.color : 'var(--text-tertiary)',
                              cursor: isActive ? 'default' : 'pointer',
                            }}
                          >
                            <Icon size={12} />
                            {status.label.split(' ')[0]}
                          </button>
                        );
                      })}
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

export default ColorSelectionFormBuilder;
