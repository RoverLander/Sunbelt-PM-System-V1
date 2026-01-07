import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, MessageSquare, Calendar, FileText, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import FileAttachments from '../common/FileAttachments';
import { exportRFIToICS } from '../../utils/icsUtils';
import { exportRFIToPDF } from '../../utils/pdfUtils';
import { draftRFIEmail } from '../../utils/emailUtils';

function EditRFIModal({ isOpen, onClose, rfi, projectName = '', projectNumber = '', onSuccess, onDelete }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  
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
      fetchUsers();
      fetchAttachments();
    }
  }, [isOpen, rfi]);

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
        .eq('rfi_id', rfi.id)
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
    if (!rfi?.date_sent) return 0;
    const sent = new Date(rfi.date_sent);
    const now = new Date();
    const diffTime = Math.abs(now - sent);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('rfis')
        .update(rfiData)
        .eq('id', rfi.id);

      if (updateError) throw updateError;

      // Fetch updated RFI
      const { data: updatedRFI, error: fetchError } = await supabase
        .from('rfis')
        .select('*')
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this RFI?')) return;
    
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('rfis')
        .delete()
        .eq('id', rfi.id);

      if (deleteError) throw deleteError;

      onDelete(rfi);
      onClose();
    } catch (error) {
      console.error('Error deleting RFI:', error);
      setError(error.message || 'Failed to delete RFI');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportToOutlook = () => {
    const rfiForExport = {
      ...rfi,
      subject: formData.subject,
      question: formData.question,
      answer: formData.answer,
      status: formData.status,
      due_date: formData.due_date,
      sent_to: formData.sent_to
    };
    exportRFIToICS(rfiForExport, projectName, projectNumber);
  };

  const handleExportPDF = () => {
    const rfiForExport = {
      ...rfi,
      subject: formData.subject,
      question: formData.question,
      answer: formData.answer,
      status: formData.status,
      due_date: formData.due_date,
      sent_to: formData.sent_to,
      date_sent: formData.date_sent
    };
    exportRFIToPDF(rfiForExport, projectName, projectNumber, attachments);
  };

  const handleDraftEmail = () => {
    const rfiForEmail = {
      ...rfi,
      subject: formData.subject,
      question: formData.question,
      answer: formData.answer,
      status: formData.status,
      due_date: formData.due_date,
      sent_to: formData.sent_to,
      sent_to_email: formData.sent_to_email
    };
    draftRFIEmail(rfiForEmail, projectName, projectNumber);
  };

  if (!isOpen || !rfi) return null;

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
        maxWidth: '750px',
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
              {rfi.rfi_number}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Sent {rfi.date_sent ? new Date(rfi.date_sent).toLocaleDateString() : 'N/A'} • {calculateDaysOpen()} days open
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
              {['Open', 'Pending', 'Answered', 'Closed'].map(status => (
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
            <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <MessageSquare size={16} />
              Response / Answer
            </h4>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Response Notes</label>
              <textarea
                name="answer"
                value={formData.answer}
                onChange={handleChange}
                className="form-input"
                rows="3"
                placeholder="Log the response received..."
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>
          </div>

          {/* File Attachments */}
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <FileAttachments 
              projectId={rfi.project_id}
              rfiId={rfi.id}
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

export default EditRFIModal;