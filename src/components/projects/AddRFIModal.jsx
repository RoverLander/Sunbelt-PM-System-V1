// ============================================================================
// AddRFIModal.jsx
// ============================================================================
// Modal component for creating new RFIs (Requests for Information).
// 
// FEATURES:
// - Create RFIs to internal team members OR external contacts
// - Auto-generates RFI number based on project (e.g., NWBS-25001-RFI-001)
// - File attachment support with drag-and-drop
// - Email draft integration for external RFIs
// - PDF export capability
//
// DEPENDENCIES:
// - useContacts hook: Fetches both users (PMs) and factory contacts
// - supabaseClient: Database operations
// - emailUtils: Email draft generation
// - pdfUtils: PDF export
//
// PROPS:
// - isOpen: Boolean to control modal visibility
// - onClose: Function called when modal closes
// - projectId: UUID of the parent project
// - projectNumber: Project number for RFI numbering (e.g., "NWBS-25001")
// - projectName: Project name for display/export
// - onSuccess: Callback with created RFI data
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Upload, FileText, Image, File, Trash2, Paperclip, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../hooks/useContacts';
import { draftRFIEmail } from '../../utils/emailUtils';
import { exportRFIToPDF } from '../../utils/pdfUtils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AddRFIModal({ isOpen, onClose, projectId, projectNumber, projectName = '', onSuccess }) {
  
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  const { user } = useAuth();
  const { contacts, loading: contactsLoading } = useContacts(isOpen); // Only fetch when modal opens

  // ==========================================================================
  // STATE - Form Data
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextRFINumber, setNextRFINumber] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // Form fields for RFI creation
  const [formData, setFormData] = useState({
    subject: '',              // RFI subject line (required)
    question: '',             // Detailed question/request (required)
    recipient_type: 'external', // 'external' or 'internal'
    sent_to: '',              // Recipient name or company
    sent_to_email: '',        // Recipient email (for external)
    internal_owner_id: '',    // User ID responsible for tracking
    priority: 'Medium',       // 'Low', 'Medium', 'High'
    due_date: ''              // Expected response date
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      generateRFINumber();
      // Set current user as default internal owner
      setFormData(prev => ({ ...prev, internal_owner_id: user?.id || '' }));
      setPendingFiles([]);
      setError('');
    }
  }, [isOpen, user]);

  // ==========================================================================
  // RFI NUMBER GENERATION
  // ==========================================================================
  // Format: {PROJECT_NUMBER}-RFI-{SEQUENCE}
  // Example: NWBS-25001-RFI-001
  
  const generateRFINumber = async () => {
    try {
      // Count existing RFIs for this project
      const { count } = await supabase
        .from('rfis')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      // Generate next sequential number
      const rfiNum = (count || 0) + 1;
      const newRFINumber = `${projectNumber}-RFI-${String(rfiNum).padStart(3, '0')}`;
      setNextRFINumber(newRFINumber);
    } catch (error) {
      console.error('Error generating RFI number:', error);
      setNextRFINumber(`${projectNumber}-RFI-001`);
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
  // FILE ATTACHMENT HELPERS
  // ==========================================================================
  
  // Get appropriate icon based on file type
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image size={16} style={{ color: 'var(--info)' }} />;
    if (fileType?.includes('pdf')) return <FileText size={16} style={{ color: '#ef4444' }} />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FileText size={16} style={{ color: '#3b82f6' }} />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileText size={16} style={{ color: '#22c55e' }} />;
    return <File size={16} />;
  };

  // Format file size for display (e.g., "1.5 MB")
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle file selection from input
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create pending file objects with unique IDs
    const newFiles = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setPendingFiles(prev => [...prev, ...newFiles]);
    
    // Clear input for re-selection of same file
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove a pending file before submission
  const handleRemovePendingFile = (fileId) => {
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // ==========================================================================
  // FILE UPLOAD
  // ==========================================================================
  // Upload files to Supabase storage and create attachment records
  
  const uploadPendingFiles = async (rfiId) => {
    const uploadedAttachments = [];

    for (const pendingFile of pendingFiles) {
      try {
        // Create unique storage path: {project_id}/rfis/{rfi_id}/{timestamp}_{filename}
        const timestamp = Date.now();
        const safeName = pendingFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${projectId}/rfis/${rfiId}/${timestamp}_${safeName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, pendingFile.file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(storagePath);

        // Create attachment record in database
        const attachmentData = {
          project_id: projectId,
          rfi_id: rfiId,
          file_name: pendingFile.name,
          file_size: pendingFile.size,
          file_type: pendingFile.type,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          uploaded_by: user.id
        };

        const { data: newAttachment, error: insertError } = await supabase
          .from('file_attachments')
          .insert([attachmentData])
          .select()
          .single();

        if (!insertError && newAttachment) {
          uploadedAttachments.push(newAttachment);
        }
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    return uploadedAttachments;
  };

  // ==========================================================================
  // RFI CREATION
  // ==========================================================================
  
  const createRFI = async () => {
    // Build RFI data object
    const rfiData = {
      project_id: projectId,
      rfi_number: nextRFINumber,
      subject: formData.subject.trim(),
      question: formData.question.trim(),
      // For external: use text input; for internal: use selected contact name
      sent_to: formData.recipient_type === 'external' 
        ? formData.sent_to.trim() 
        : formData.sent_to,
      sent_to_email: formData.recipient_type === 'external' ? formData.sent_to_email.trim() : null,
      is_external: formData.recipient_type === 'external',
      internal_owner_id: formData.internal_owner_id || null,
      priority: formData.priority,
      due_date: formData.due_date || null,
      status: 'Open',
      date_sent: new Date().toISOString().split('T')[0],
      created_by: user.id
    };

    // Insert RFI into database
    const { data, error: insertError } = await supabase
      .from('rfis')
      .insert([rfiData])
      .select()
      .single();

    if (insertError) throw insertError;

    // Upload any pending files
    let attachments = [];
    if (pendingFiles.length > 0) {
      attachments = await uploadPendingFiles(data.id);
    }

    return { rfi: data, attachments };
  };

  // ==========================================================================
  // FORM SUBMISSION HANDLERS
  // ==========================================================================

  // Standard submit - create RFI only
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { rfi } = await createRFI();
      onSuccess(rfi);
      handleClose();
    } catch (error) {
      console.error('Error creating RFI:', error);
      setError(error.message || 'Failed to create RFI');
    } finally {
      setLoading(false);
    }
  };

  // Create and open email draft
  const handleCreateAndEmail = async () => {
    setLoading(true);
    setError('');

    try {
      const { rfi } = await createRFI();
      
      // Open email client with pre-filled draft
      const rfiForEmail = {
        ...rfi,
        sent_to_email: formData.sent_to_email
      };
      draftRFIEmail(rfiForEmail, projectName, projectNumber);
      
      onSuccess(rfi);
      handleClose();
    } catch (error) {
      console.error('Error creating RFI:', error);
      setError(error.message || 'Failed to create RFI');
    } finally {
      setLoading(false);
    }
  };

  // Create and export PDF
  const handleCreateAndExportPDF = async () => {
    setLoading(true);
    setError('');

    try {
      const { rfi, attachments } = await createRFI();
      
      // Generate PDF with RFI details
      exportRFIToPDF(rfi, projectName, projectNumber, attachments);
      
      onSuccess(rfi);
      handleClose();
    } catch (error) {
      console.error('Error creating RFI:', error);
      setError(error.message || 'Failed to create RFI');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // MODAL CLOSE
  // ==========================================================================
  
  const handleClose = () => {
    // Reset form state
    setFormData({
      subject: '',
      question: '',
      recipient_type: 'external',
      sent_to: '',
      sent_to_email: '',
      internal_owner_id: '',
      priority: 'Medium',
      due_date: ''
    });
    setPendingFiles([]);
    setError('');
    onClose();
  };

  // ==========================================================================
  // RENDER - Early return if not open
  // ==========================================================================
  
  if (!isOpen) return null;

  // ==========================================================================
  // RENDER - Modal UI
  // ==========================================================================
  
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
        maxWidth: '700px',
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
              Create RFI
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              RFI Number: <span style={{ color: 'var(--sunbelt-orange)', fontWeight: '600' }}>{nextRFINumber}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
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
          {/* SUBJECT FIELD                                                */}
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
              placeholder="e.g., Electrical panel location clarification"
            />
          </div>

          {/* ============================================================ */}
          {/* QUESTION FIELD                                               */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Question / Request *</label>
            <textarea
              name="question"
              value={formData.question}
              onChange={handleChange}
              required
              className="form-input"
              rows="4"
              placeholder="Describe the information you need..."
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
          </div>

          {/* ============================================================ */}
          {/* RECIPIENT TYPE TOGGLE                                        */}
          {/* External = Outside company (architect, engineer, etc.)       */}
          {/* Internal = Team members or factory contacts                  */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Send To</label>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              {/* External Option */}
              <label style={{
                flex: 1,
                padding: 'var(--space-md)',
                border: `2px solid ${formData.recipient_type === 'external' ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center',
                background: formData.recipient_type === 'external' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)',
                transition: 'all 0.15s'
              }}>
                <input
                  type="radio"
                  name="recipient_type"
                  value="external"
                  checked={formData.recipient_type === 'external'}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>External Contact</span>
              </label>
              
              {/* Internal Option */}
              <label style={{
                flex: 1,
                padding: 'var(--space-md)',
                border: `2px solid ${formData.recipient_type === 'internal' ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center',
                background: formData.recipient_type === 'internal' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)',
                transition: 'all 0.15s'
              }}>
                <input
                  type="radio"
                  name="recipient_type"
                  value="internal"
                  checked={formData.recipient_type === 'internal'}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Internal Team</span>
              </label>
            </div>
          </div>

          {/* ============================================================ */}
          {/* EXTERNAL RECIPIENT FIELDS                                    */}
          {/* Shown when recipient_type === 'external'                     */}
          {/* ============================================================ */}
          {formData.recipient_type === 'external' && (
            <div style={{ 
              padding: 'var(--space-lg)', 
              background: 'rgba(255, 107, 53, 0.05)', 
              border: '1px solid rgba(255, 107, 53, 0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                External Recipient Details
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                {/* Contact Name/Company */}
                <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="form-label">Contact Name / Company *</label>
                  <input
                    type="text"
                    name="sent_to"
                    value={formData.sent_to}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="e.g., ABC Architecture"
                  />
                </div>
                
                {/* Contact Email */}
                <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="form-label">Contact Email *</label>
                  <input
                    type="email"
                    name="sent_to_email"
                    value={formData.sent_to_email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              {/* Internal Owner - Who tracks this RFI */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Internal Owner (Tracking) *</label>
                <select
                  name="internal_owner_id"
                  value={formData.internal_owner_id}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Select team member</option>
                  {/* Only show users (PMs, Directors) for internal owner */}
                  {contacts.filter(c => c.contact_type === 'user').map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Responsible for following up and logging the response.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* INTERNAL RECIPIENT DROPDOWN                                  */}
          {/* Includes both users AND factory contacts                     */}
          {/* Shown when recipient_type === 'internal'                     */}
          {/* ============================================================ */}
          {formData.recipient_type === 'internal' && (
            <div className="form-group">
              <label className="form-label">Send To (Internal) *</label>
              <select
                name="sent_to"
                value={formData.sent_to}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">Select team member</option>
                
                {/* Group 1: Users (PMs, Directors, VPs) */}
                <optgroup label="── Internal Team ──">
                  {contacts.filter(c => c.contact_type === 'user').map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </optgroup>
                
                {/* Group 2: Factory Contacts by Department */}
                <optgroup label="── Factory Contacts ──">
                  {contacts.filter(c => c.contact_type === 'factory').map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

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
          <div className="form-group">
            <label className="form-label">Attachments</label>
            
            {/* File Upload Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-lg)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: pendingFiles.length > 0 ? 'var(--space-md)' : 0
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <Upload size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                Click to upload files or drag and drop
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Pending Files List */}
            {pendingFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {pendingFiles.map(file => (
                  <div
                    key={file.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      padding: 'var(--space-sm) var(--space-md)',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem'
                    }}
                  >
                    {getFileIcon(file.type)}
                    <span style={{ flex: 1, color: 'var(--text-primary)' }}>{file.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePendingFile(file.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* ACTION BUTTONS                                               */}
          {/* ============================================================ */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            justifyContent: 'flex-end',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'var(--space-lg)',
            flexWrap: 'wrap'
          }}>
            {/* Cancel Button */}
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            
            {/* Create & PDF Button */}
            <button 
              type="button" 
              onClick={handleCreateAndExportPDF}
              disabled={loading}
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
                fontSize: '0.9375rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
              title="Create RFI and export as PDF"
            >
              <FileText size={18} />
              Create & PDF
            </button>
            
            {/* Create & Email Button (only for external with email) */}
            {formData.recipient_type === 'external' && formData.sent_to_email && (
              <button 
                type="button" 
                onClick={handleCreateAndEmail}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  padding: '10px 20px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--success)',
                  fontWeight: '600',
                  fontSize: '0.9375rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
                title="Create RFI and open email draft"
              >
                <Mail size={18} />
                Create & Email
              </button>
            )}
            
            {/* Primary Submit Button */}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                pendingFiles.length > 0 ? 'Creating & Uploading...' : 'Creating...'
              ) : (
                <><Send size={18} /> Create RFI</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRFIModal;