// ============================================================================
// EditRFIModal.jsx
// ============================================================================
// Modal component for editing existing RFIs (Requests for Information).
// 
// FEATURES:
// - Edit all RFI fields including status, subject, question, answer
// - Quick status buttons for fast updates
// - Shows days open calculation
// - File attachment management
// - Export to PDF/ICS, email draft functionality
// - Delete RFI capability
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
// - rfi: The RFI object to edit
// - projectName: Project name for display/export
// - projectNumber: Project number for display/export
// - onSuccess: Callback with updated RFI data
// - onDelete: Callback after RFI deletion
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, MessageSquare, Calendar, FileText, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../hooks/useContacts';
import FileAttachments from '../common/FileAttachments';
import { exportRFIToICS } from '../../utils/icsUtils';
import { exportRFIToPDF } from '../../utils/pdfUtils';
import { draftRFIEmail } from '../../utils/emailUtils';

// ============================================================================
// CONSTANTS
// ============================================================================
const RFI_STATUSES = ['Open', 'Pending', 'Answered', 'Closed'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function EditRFIModal({ isOpen, onClose, rfi, projectName = '', projectNumber = '', factoryCode = '', onSuccess, onDelete }) {
  
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  const { user } = useAuth();
  const { contacts } = useContacts(isOpen); // Fetch users + factory contacts

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState([]);
  
  // Form fields
  const [formData, setFormData] = useState({
    subject: '',
    question: '',
    answer: '',
    sent_to: '',
    sent_to_email: '',
    is_external: false,
    internal_owner_id: '',
    priority: 'Medium',
    due_date: '',
    status: 'Open',
    date_sent: ''
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  // Initialize form when modal opens with RFI data
  useEffect(() => {
    if (isOpen && rfi) {
      setFormData({
        subject: rfi.subject || '',
        question: rfi.question || '',
        answer: rfi.answer || '',
        sent_to: rfi.sent_to || '',
        sent_to_email: rfi.sent_to_email || '',
        is_external: rfi.is_external || false,
        internal_owner_id: rfi.internal_owner_id || '',
        priority: rfi.priority || 'Medium',
        due_date: rfi.due_date || '',
        status: rfi.status || 'Open',
        date_sent: rfi.date_sent || ''
      });
      fetchAttachments();
    }
  }, [isOpen, rfi]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  
  // Fetch file attachments for this RFI
  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('rfi_id', rfi.id)
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
  
  // Calculate how many days this RFI has been open
  const calculateDaysOpen = () => {
    if (!rfi?.date_sent) return 0;
    const sent = new Date(rfi.date_sent);
    const now = new Date();
    const diffTime = Math.abs(now - sent);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // ==========================================================================
  // RFI UPDATE
  // ==========================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const rfiData = {
        subject: formData.subject.trim(),
        question: formData.question.trim(),
        answer: formData.answer.trim() || null,
        sent_to: formData.sent_to,
        sent_to_email: formData.sent_to_email || null,
        is_external: formData.is_external,
        internal_owner_id: formData.internal_owner_id || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        status: formData.status,
        // Auto-set date_answered when status changes to Answered
        date_answered: formData.status === 'Answered' && rfi.status !== 'Answered' 
          ? new Date().toISOString().split('T')[0] 
          : rfi.date_answered,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('rfis')
        .update(rfiData)
        .eq('id', rfi.id);

      if (updateError) throw updateError;

      // Fetch updated RFI with relations
      const { data: updatedRFI, error: fetchError } = await supabase
        .from('rfis')
        .select('*, internal_owner:internal_owner_id(id, name)')
        .eq('id', rfi.id)
        .single();

      if (fetchError) throw fetchError;

      onSuccess(updatedRFI);
      onClose();
    } catch (error) {
      console.error('Error updating RFI:', error);
      setError(error.message || 'Failed to update RFI');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // RFI DELETION
  // ==========================================================================
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this RFI? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      // Delete attachments first
      await supabase
        .from('file_attachments')
        .delete()
        .eq('rfi_id', rfi.id);

      // Delete floor plan markers
      await supabase
        .from('floor_plan_markers')
        .delete()
        .eq('rfi_id', rfi.id);

      // Delete the RFI
      const { error } = await supabase
        .from('rfis')
        .delete()
        .eq('id', rfi.id);

      if (error) throw error;

      onDelete(rfi.id);
      onClose();
    } catch (error) {
      console.error('Error deleting RFI:', error);
      setError(error.message || 'Failed to delete RFI');
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================================
  // EXPORT FUNCTIONS
  // ==========================================================================
  
  const handleExportPDF = async () => {
    await exportRFIToPDF(rfi, projectName, projectNumber, attachments, factoryCode);
  };

  const handleExportICS = () => {
    exportRFIToICS(rfi, projectName);
  };

  const handleDraftEmail = () => {
    draftRFIEmail(rfi, projectName, projectNumber);
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {rfi?.rfi_number || 'Edit RFI'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Sent: {rfi?.date_sent ? new Date(rfi.date_sent).toLocaleDateString() : 'N/A'} • {calculateDaysOpen()} days open
            </p>
          </div>
          
          {/* Export Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={handleExportPDF}
              style={{
                padding: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="Export as PDF"
            >
              <FileText size={18} />
            </button>
            <button
              type="button"
              onClick={handleExportICS}
              style={{
                padding: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--info)',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="Add to Calendar"
            >
              <Calendar size={18} />
            </button>
            {formData.sent_to_email && (
              <button
                type="button"
                onClick={handleDraftEmail}
                style={{
                  padding: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--success)',
                  cursor: 'pointer',
                  display: 'flex'
                }}
                title="Draft Email"
              >
                <Mail size={18} />
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
                borderRadius: '6px'
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
              fontSize: '0.875rem'
            }}>
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
            <label className="form-label" style={{ marginBottom: 'var(--space-md)' }}>Status</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {RFI_STATUSES.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status }))}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${formData.status === status ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                    background: formData.status === status ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-primary)',
                    color: formData.status === status ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '0.875rem',
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
          {/* SUBJECT                                                      */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* ============================================================ */}
          {/* QUESTION                                                     */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Question / Request</label>
            <textarea
              name="question"
              value={formData.question}
              onChange={handleChange}
              className="form-input"
              rows="3"
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* ============================================================ */}
          {/* ANSWER (for when RFI is responded to)                        */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Answer / Response</label>
            <textarea
              name="answer"
              value={formData.answer}
              onChange={handleChange}
              className="form-input"
              rows="4"
              placeholder="Enter the response to this RFI..."
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
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
              
              {/* External Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_external}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_external: e.target.checked }))}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>External</span>
              </label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              {/* Sent To */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Sent To (Name/Company)</label>
                {formData.is_external ? (
                  <input
                    type="text"
                    name="sent_to"
                    value={formData.sent_to}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., ABC Architecture"
                  />
                ) : (
                  <select
                    name="sent_to"
                    value={formData.sent_to}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Select recipient</option>
                    {/* Internal Team */}
                    <optgroup label="── Internal Team ──">
                      {contacts.filter(c => c.contact_type === 'user').map(u => (
                        <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                      ))}
                    </optgroup>
                    {/* Factory Contacts */}
                    <optgroup label="── Factory Contacts ──">
                      {contacts.filter(c => c.contact_type === 'factory').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                )}
              </div>
              
              {/* Email (for external) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="sent_to_email"
                  value={formData.sent_to_email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="contact@example.com"
                  disabled={!formData.is_external}
                />
              </div>
            </div>

            {/* Internal Owner (for external RFIs) */}
            {formData.is_external && (
              <div className="form-group" style={{ marginTop: 'var(--space-md)', marginBottom: 0 }}>
                <label className="form-label">Internal Owner (Tracking)</label>
                <select
                  name="internal_owner_id"
                  value={formData.internal_owner_id}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select team member</option>
                  {contacts.filter(c => c.contact_type === 'user').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* PRIORITY & DUE DATE                                          */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-input"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* FILE ATTACHMENTS                                             */}
          {/* ============================================================ */}
          <FileAttachments
            projectId={rfi?.project_id}
            rfiId={rfi?.id}
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
            {/* Delete Button */}
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
            
            {/* Save/Cancel Buttons */}
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

export default EditRFIModal;