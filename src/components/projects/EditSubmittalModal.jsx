import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, RotateCcw, Calendar, FileText, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import FileAttachments from '../common/FileAttachments';
import { exportSubmittalToICS } from '../../utils/icsUtils';
import { exportSubmittalToPDF } from '../../utils/pdfUtils';
import { draftSubmittalEmail } from '../../utils/emailUtils';

function EditSubmittalModal({ isOpen, onClose, submittal, projectName = '', projectNumber = '', onSuccess, onDelete }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    submittal_type: 'Cutsheet',
    sent_to: '',
    sent_to_email: '',
    is_external: false,
    internal_owner_id: '',
    priority: 'Medium',
    due_date: '',
    status: 'Pending',
    reviewer_comments: '',
    revision_number: 0,
    spec_section: '',
    manufacturer: '',
    model_number: ''
  });

  const submittalTypes = [
    'Cutsheet',
    'Long Lead Item',
    'Color Selection',
    'Shop Drawing',
    'Product Data',
    'Sample',
    'Mock-Up',
    'Design Mix',
    'Test Report',
    'Certificate',
    'Warranty',
    'O&M Manual',
    'Other'
  ];

  useEffect(() => {
    if (isOpen && submittal) {
      setFormData({
        title: submittal.title || '',
        description: submittal.description || '',
        submittal_type: submittal.submittal_type || 'Cutsheet',
        sent_to: submittal.sent_to || '',
        sent_to_email: submittal.sent_to_email || '',
        is_external: submittal.is_external || false,
        internal_owner_id: submittal.internal_owner_id || '',
        priority: submittal.priority || 'Medium',
        due_date: submittal.due_date || '',
        status: submittal.status || 'Pending',
        reviewer_comments: submittal.reviewer_comments || '',
        revision_number: submittal.revision_number || 0,
        spec_section: submittal.spec_section || '',
        manufacturer: submittal.manufacturer || '',
        model_number: submittal.model_number || ''
      });
      fetchUsers();
      fetchAttachments();
    }
  }, [isOpen, submittal]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateDaysOpen = () => {
    if (!submittal?.date_submitted) return 0;
    const sent = new Date(submittal.date_submitted);
    const now = new Date();
    const diffTime = Math.abs(now - sent);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleResubmit = () => {
    setFormData(prev => ({
      ...prev,
      status: 'Pending',
      revision_number: prev.revision_number + 1,
      reviewer_comments: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submittalData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        submittal_type: formData.submittal_type,
        sent_to: formData.sent_to,
        sent_to_email: formData.sent_to_email || null,
        is_external: formData.is_external,
        internal_owner_id: formData.internal_owner_id || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        status: formData.status,
        reviewer_comments: formData.reviewer_comments.trim() || null,
        revision_number: formData.revision_number,
        spec_section: formData.spec_section.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        model_number: formData.model_number.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('submittals')
        .update(submittalData)
        .eq('id', submittal.id);

      if (updateError) throw updateError;

      // Fetch updated submittal
      const { data: updatedSubmittal, error: fetchError } = await supabase
        .from('submittals')
        .select('*')
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this submittal?')) return;
    
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('submittals')
        .delete()
        .eq('id', submittal.id);

      if (deleteError) throw deleteError;

      onDelete(submittal);
      onClose();
    } catch (error) {
      console.error('Error deleting submittal:', error);
      setError(error.message || 'Failed to delete submittal');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportToOutlook = () => {
    const submittalForExport = {
      ...submittal,
      title: formData.title,
      description: formData.description,
      submittal_type: formData.submittal_type,
      status: formData.status,
      due_date: formData.due_date,
      sent_to: formData.sent_to,
      revision_number: formData.revision_number,
      spec_section: formData.spec_section,
      manufacturer: formData.manufacturer
    };
    exportSubmittalToICS(submittalForExport, projectName, projectNumber);
  };

  const handleExportPDF = () => {
    const submittalForExport = {
      ...submittal,
      title: formData.title,
      description: formData.description,
      submittal_type: formData.submittal_type,
      status: formData.status,
      due_date: formData.due_date,
      sent_to: formData.sent_to,
      revision_number: formData.revision_number,
      spec_section: formData.spec_section,
      manufacturer: formData.manufacturer,
      model_number: formData.model_number,
      reviewer_comments: formData.reviewer_comments
    };
    exportSubmittalToPDF(submittalForExport, projectName, projectNumber, attachments);
  };

  const handleDraftEmail = () => {
    const submittalForEmail = {
      ...submittal,
      title: formData.title,
      description: formData.description,
      submittal_type: formData.submittal_type,
      status: formData.status,
      due_date: formData.due_date,
      sent_to: formData.sent_to,
      sent_to_email: formData.sent_to_email,
      revision_number: formData.revision_number,
      spec_section: formData.spec_section,
      manufacturer: formData.manufacturer
    };
    draftSubmittalEmail(submittalForEmail, projectName, projectNumber);
  };

  if (!isOpen || !submittal) return null;

  return (
    <div style={{
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
              {submittal.submittal_number}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Submitted {submittal.date_submitted ? new Date(submittal.date_submitted).toLocaleDateString() : 'N/A'} • {calculateDaysOpen()} days open
              {formData.revision_number > 0 && <span style={{ color: 'var(--sunbelt-orange)' }}> • Rev {formData.revision_number}</span>}
            </p>
          </div>
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

        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-xl)' }}>
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

          {/* Quick Status Update */}
          <div style={{
            padding: 'var(--space-lg)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <label className="form-label" style={{ marginBottom: 'var(--space-md)' }}>Status</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {['Pending', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Approved as Noted'].map(status => (
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
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                name="submittal_type"
                value={formData.submittal_type}
                onChange={handleChange}
                className="form-input"
              >
                {submittalTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="2"
              style={{ resize: 'vertical', minHeight: '60px' }}
            />
          </div>

          {/* Product Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Spec Section</label>
              <input
                type="text"
                name="spec_section"
                value={formData.spec_section}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 08 71 00"
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Manufacturer</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Model Number</label>
              <input
                type="text"
                name="model_number"
                value={formData.model_number}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Recipient Info */}
          <div style={{ 
            padding: 'var(--space-lg)', 
            background: formData.is_external ? 'rgba(255, 107, 53, 0.05)' : 'var(--bg-secondary)', 
            border: `1px solid ${formData.is_external ? 'rgba(255, 107, 53, 0.2)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-lg)'
          }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              {formData.is_external ? 'External Recipient' : 'Recipient'}
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Sent To (Name/Company)</label>
                <input
                  type="text"
                  name="sent_to"
                  value={formData.sent_to}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., ABC Architecture"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="sent_to_email"
                  value={formData.sent_to_email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="contact@example.com"
                />
              </div>
            </div>

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
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

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
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Response Due Date</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Response Section */}
          <div style={{ 
            padding: 'var(--space-lg)', 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Reviewer Comments
              </h4>
              {(formData.status === 'Rejected' || formData.status === 'Approved as Noted') && (
                <button
                  type="button"
                  onClick={handleResubmit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--sunbelt-orange)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--sunbelt-orange)',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={14} /> Resubmit (Rev {formData.revision_number + 1})
                </button>
              )}
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                name="reviewer_comments"
                value={formData.reviewer_comments}
                onChange={handleChange}
                className="form-input"
                rows="3"
                placeholder="Log review comments, approval notes, or rejection reasons..."
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>
          </div>

          {/* File Attachments */}
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <FileAttachments 
              projectId={submittal.project_id}
              submittalId={submittal.id}
              onAttachmentsChange={setAttachments}
            />
          </div>

          {/* Export Buttons */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-lg)',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', marginRight: 'var(--space-sm)' }}>
              Export:
            </span>
            
            <button
              type="button"
              onClick={handleExportToOutlook}
              disabled={!formData.due_date}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: formData.due_date ? 'var(--info)' : 'var(--text-tertiary)',
                fontWeight: '600',
                fontSize: '0.8125rem',
                cursor: formData.due_date ? 'pointer' : 'not-allowed',
                opacity: formData.due_date ? 1 : 0.6
              }}
              title={formData.due_date ? 'Add to Outlook calendar' : 'Set a due date first'}
            >
              <Calendar size={14} />
              Calendar
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontWeight: '600',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
              title="Export as PDF form"
            >
              <FileText size={14} />
              PDF
            </button>

            <button
              type="button"
              onClick={handleDraftEmail}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--success)',
                fontWeight: '600',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
              title="Draft email in Outlook"
            >
              <Mail size={14} />
              Email
            </button>
          </div>

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
              className="btn btn-secondary"
              disabled={deleting}
              style={{ color: 'var(--danger)' }}
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