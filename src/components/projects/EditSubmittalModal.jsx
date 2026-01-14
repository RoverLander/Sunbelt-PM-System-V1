// ============================================================================
// EditSubmittalModal.jsx
// ============================================================================
// Modal component for editing existing Submittals.
// 
// FEATURES:
// - Edit all submittal fields including status, type, reviewer comments
// - Quick status buttons for fast updates
// - Revision tracking with "Resubmit" functionality
// - Shows days open calculation
// - File attachment management
// - Export to PDF/ICS, email draft functionality
// - Delete submittal capability
// - Factory contacts in recipient dropdowns
//
// DEPENDENCIES:
// - useContacts hook: Fetches both users (PMs) and factory contacts
// - supabaseClient: Database operations
// - FileAttachments: File management component
// - emailUtils, pdfUtils, icsUtils: Export utilities
//
// PROPS:
// - isOpen: Boolean to control modal visibility
// - onClose: Function called when modal closes
// - submittal: The submittal object to edit
// - projectName: Project name for display/export
// - projectNumber: Project number for display/export
// - onSuccess: Callback with updated submittal data
// - onDelete: Callback after submittal deletion
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, RotateCcw, Calendar, FileText, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../hooks/useContacts';
import FileAttachments from '../common/FileAttachments';
import ContactPicker from '../common/ContactPicker';
import { exportSubmittalToICS } from '../../utils/icsUtils';
import { exportSubmittalToPDF } from '../../utils/pdfUtils';
import { draftSubmittalEmail } from '../../utils/emailUtils';

// ============================================================================
// CONSTANTS
// ============================================================================
const SUBMITTAL_STATUSES = ['Pending', 'Under Review', 'Approved', 'Approved as Noted', 'Revise & Resubmit', 'Rejected'];
const SUBMITTAL_TYPES = [
  'Shop Drawings',
  'Product Data',
  'Samples',
  'Mock-ups',
  'Certifications',
  'Test Reports',
  'Warranty',
  'O&M Manuals',
  'As-Built Drawings',
  'Cutsheet',
  'Long Lead Item',
  'Color Selection',
  'Other'
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function EditSubmittalModal({ isOpen, onClose, submittal, projectName = '', projectNumber = '', onSuccess, onDelete }) {
  
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  const { user } = useAuth();
  const { contacts } = useContacts(isOpen);

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState([]);
  
  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    submittal_type: 'Shop Drawings',
    spec_section: '',
    manufacturer: '',
    model_number: '',
    sent_to: '',
    sent_to_email: '',
    selected_contact: null, // Full contact object from ContactPicker
    is_external: false,
    internal_owner_id: '',
    priority: 'Medium',
    due_date: '',
    status: 'Pending',
    reviewer_comments: '',
    revision_number: 0
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  useEffect(() => {
    if (isOpen && submittal) {
      setFormData({
        title: submittal.title || '',
        description: submittal.description || '',
        submittal_type: submittal.submittal_type || 'Shop Drawings',
        spec_section: submittal.spec_section || '',
        manufacturer: submittal.manufacturer || '',
        model_number: submittal.model_number || '',
        sent_to: submittal.sent_to || '',
        sent_to_email: submittal.sent_to_email || '',
        selected_contact: null, // Will be populated by ContactPicker if assigned_to_contact_id exists
        is_external: submittal.is_external || false,
        internal_owner_id: submittal.internal_owner_id || '',
        priority: submittal.priority || 'Medium',
        due_date: submittal.due_date || '',
        status: submittal.status || 'Pending',
        reviewer_comments: submittal.reviewer_comments || '',
        revision_number: submittal.revision_number || 0
      });
      fetchAttachments();
    }
  }, [isOpen, submittal]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  
  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('submittal_id', submittal.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================
  
  // Calculate how many days since submittal was sent
  const calculateDaysOpen = () => {
    if (!submittal?.date_submitted) return 0;
    const sent = new Date(submittal.date_submitted);
    const now = new Date();
    const diffTime = Math.abs(now - sent);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle resubmission - increments revision and resets status
  const handleResubmit = () => {
    setFormData(prev => ({
      ...prev,
      status: 'Pending',
      revision_number: prev.revision_number + 1,
      reviewer_comments: ''
    }));
  };

  // Get status color for display
  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'var(--success)';
      case 'Approved as Noted': return '#22c55e';
      case 'Rejected': return 'var(--danger)';
      case 'Revise & Resubmit': return '#f59e0b';
      case 'Under Review': return 'var(--info)';
      default: return 'var(--text-secondary)';
    }
  };

  // ==========================================================================
  // SUBMITTAL UPDATE
  // ==========================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const selectedContact = formData.selected_contact;
      const isExternal = formData.is_external;

      const submittalData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        submittal_type: formData.submittal_type,
        spec_section: formData.spec_section.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        model_number: formData.model_number.trim() || null,
        // Legacy sent_to field (name as string)
        sent_to: isExternal ? formData.sent_to : (selectedContact?.full_name || formData.sent_to),
        sent_to_email: isExternal ? (formData.sent_to_email || null) : (selectedContact?.email || null),
        // New directory_contacts reference
        assigned_to_contact_id: isExternal ? null : (selectedContact?.id || null),
        assigned_to_name: isExternal ? null : (selectedContact?.full_name || null),
        assigned_to_email: isExternal ? null : (selectedContact?.email || null),
        is_external: isExternal,
        internal_owner_id: formData.internal_owner_id || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        status: formData.status,
        reviewer_comments: formData.reviewer_comments.trim() || null,
        revision_number: formData.revision_number,
        // Auto-set date_approved when status changes to Approved
        date_approved: (formData.status === 'Approved' || formData.status === 'Approved as Noted') &&
                       submittal.status !== 'Approved' && submittal.status !== 'Approved as Noted'
          ? new Date().toISOString().split('T')[0]
          : submittal.date_approved,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('submittals')
        .update(submittalData)
        .eq('id', submittal.id);

      if (updateError) throw updateError;

      // Fetch updated submittal with relations
      const { data: updatedSubmittal, error: fetchError } = await supabase
        .from('submittals')
        .select('*, internal_owner:internal_owner_id(id, name)')
        .eq('id', submittal.id)
        .single();

      if (fetchError) throw fetchError;

      onSuccess(updatedSubmittal);
      onClose();
    } catch (error) {
      console.error('Error updating submittal:', error);
      setError(error.message || 'Failed to update submittal');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // SUBMITTAL DELETION
  // ==========================================================================
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this submittal? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      // Delete attachments first
      await supabase
        .from('file_attachments')
        .delete()
        .eq('submittal_id', submittal.id);

      // Delete floor plan markers
      await supabase
        .from('floor_plan_markers')
        .delete()
        .eq('submittal_id', submittal.id);

      // Delete the submittal
      const { error } = await supabase
        .from('submittals')
        .delete()
        .eq('id', submittal.id);

      if (error) throw error;

      onDelete(submittal.id);
      onClose();
    } catch (error) {
      console.error('Error deleting submittal:', error);
      setError(error.message || 'Failed to delete submittal');
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================================
  // EXPORT FUNCTIONS
  // ==========================================================================
  
  const handleExportPDF = () => {
    exportSubmittalToPDF(submittal, projectName, projectNumber, attachments);
  };

  const handleExportICS = () => {
    exportSubmittalToICS(submittal, projectName);
  };

  const handleDraftEmail = () => {
    draftSubmittalEmail(submittal, projectName, projectNumber);
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
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-xl)'
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
          zIndex: 1
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                {submittal?.submittal_number || 'Edit Submittal'}
              </h2>
              {formData.revision_number > 0 && (
                <span style={{
                  padding: '2px 8px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)'
                }}>
                  Rev {formData.revision_number}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Submitted: {submittal?.date_submitted ? new Date(submittal.date_submitted).toLocaleDateString() : 'N/A'} • {calculateDaysOpen()} days
            </p>
          </div>
          
          {/* Export Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <button type="button" onClick={handleExportPDF} style={{ padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }} title="Export as PDF">
              <FileText size={18} />
            </button>
            <button type="button" onClick={handleExportICS} style={{ padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--info)', cursor: 'pointer', display: 'flex' }} title="Add to Calendar">
              <Calendar size={18} />
            </button>
            {formData.sent_to_email && (
              <button type="button" onClick={handleDraftEmail} style={{ padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--success)', cursor: 'pointer', display: 'flex' }} title="Draft Email">
                <Mail size={18} />
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', display: 'flex' }}>
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
            <div style={{ padding: 'var(--space-md)', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', color: 'var(--danger)', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {/* ============================================================ */}
          {/* QUICK STATUS UPDATE                                          */}
          {/* ============================================================ */}
          <div style={{
            padding: 'var(--space-lg)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <label className="form-label" style={{ margin: 0 }}>Status</label>
              {(formData.status === 'Rejected' || formData.status === 'Revise & Resubmit') && (
                <button
                  type="button"
                  onClick={handleResubmit}
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
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={14} />
                  Resubmit
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {SUBMITTAL_STATUSES.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${formData.status === status ? getStatusColor(status) : 'var(--border-color)'}`,
                    background: formData.status === status ? `${getStatusColor(status)}15` : 'var(--bg-primary)',
                    color: formData.status === status ? getStatusColor(status) : 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* TITLE                                                        */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Submittal Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="form-input" />
          </div>

          {/* ============================================================ */}
          {/* TYPE & SPEC SECTION                                          */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Submittal Type</label>
              <select name="submittal_type" value={formData.submittal_type} onChange={handleChange} className="form-input">
                {SUBMITTAL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Spec Section</label>
              <input type="text" name="spec_section" value={formData.spec_section} onChange={handleChange} className="form-input" placeholder="e.g., 08 71 00" />
            </div>
          </div>

          {/* ============================================================ */}
          {/* PRODUCT INFO                                                 */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Manufacturer</label>
              <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="form-input" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Model Number</label>
              <input type="text" name="model_number" value={formData.model_number} onChange={handleChange} className="form-input" />
            </div>
          </div>

          {/* ============================================================ */}
          {/* DESCRIPTION                                                  */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="form-input" rows="2" style={{ resize: 'vertical', minHeight: '60px' }} />
          </div>

          {/* ============================================================ */}
          {/* RECIPIENT INFO                                               */}
          {/* ============================================================ */}
          <div style={{ 
            padding: 'var(--space-lg)', 
            background: formData.is_external ? 'rgba(255, 107, 53, 0.05)' : 'var(--bg-secondary)', 
            border: `1px solid ${formData.is_external ? 'rgba(255, 107, 53, 0.2)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                {formData.is_external ? 'External Recipient' : 'Recipient'}
              </h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.is_external} onChange={(e) => setFormData(prev => ({ ...prev, is_external: e.target.checked }))} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>External</span>
              </label>
            </div>
            
            {/* Recipient - ContactPicker for internal, text inputs for external */}
            {formData.is_external ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Sent To</label>
                  <input type="text" name="sent_to" value={formData.sent_to} onChange={handleChange} className="form-input" placeholder="e.g., ABC Architecture" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email</label>
                  <input type="email" name="sent_to_email" value={formData.sent_to_email} onChange={handleChange} className="form-input" placeholder="contact@example.com" />
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <ContactPicker
                  value={submittal?.assigned_to_contact_id || formData.selected_contact?.id}
                  onChange={(contact) => {
                    setFormData(prev => ({
                      ...prev,
                      selected_contact: contact,
                      sent_to: contact?.full_name || '',
                      sent_to_email: contact?.email || ''
                    }));
                  }}
                  placeholder="Select recipient from directory..."
                  label="Sent To"
                  showExternal={true}
                  onExternalSelect={() => {
                    setFormData(prev => ({ ...prev, is_external: true }));
                  }}
                />
              </div>
            )}

            {formData.is_external && (
              <div className="form-group" style={{ marginTop: 'var(--space-md)', marginBottom: 0 }}>
                <label className="form-label">Internal Owner (Tracking)</label>
                <select name="internal_owner_id" value={formData.internal_owner_id} onChange={handleChange} className="form-input">
                  <option value="">Select team member</option>
                  {contacts.filter(c => c.contact_type === 'user').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* REVIEWER COMMENTS                                            */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Reviewer Comments</label>
            <textarea
              name="reviewer_comments"
              value={formData.reviewer_comments}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder="Comments from reviewer..."
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* ============================================================ */}
          {/* PRIORITY & DUE DATE                                          */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="form-input">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="form-input" />
            </div>
          </div>

          {/* ============================================================ */}
          {/* FILE ATTACHMENTS                                             */}
          {/* ============================================================ */}
          <FileAttachments
            projectId={submittal?.project_id}
            submittalId={submittal?.id}
            attachments={attachments}
            onUpdate={fetchAttachments}
          />

          {/* ============================================================ */}
          {/* ACTION BUTTONS                                               */}
          {/* ============================================================ */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            justifyContent: 'space-between',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'var(--space-lg)'
          }}>
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={deleting || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '10px 20px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontWeight: '600',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.7 : 1
              }}
            >
              <Trash2 size={18} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditSubmittalModal;