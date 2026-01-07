// ============================================================================
// AddSubmittalModal.jsx
// ============================================================================
// Modal component for creating new Submittals within a project.
// 
// FEATURES:
// - Create submittals for internal team OR external reviewers
// - Auto-generates submittal number (e.g., NWBS-25001-SUB-001)
// - Multiple submittal types (Shop Drawings, Product Data, Samples, etc.)
// - File attachment support
// - Email draft integration
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
// - projectNumber: Project number for submittal numbering
// - projectName: Project name for display/export
// - onSuccess: Callback with created submittal data
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Upload, FileText, Image, File, Trash2, Paperclip, Mail } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../hooks/useContacts';
import { draftSubmittalEmail } from '../../utils/emailUtils';
import { exportSubmittalToPDF } from '../../utils/pdfUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

// Available submittal types for dropdown
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
  'Other'
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AddSubmittalModal({ isOpen, onClose, projectId, projectNumber, projectName = '', onSuccess }) {
  
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  const { user } = useAuth();
  const { contacts, loading: contactsLoading } = useContacts(isOpen);

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextSubmittalNumber, setNextSubmittalNumber] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // Form fields for submittal creation
  const [formData, setFormData] = useState({
    title: '',                    // Submittal title (required)
    description: '',              // Description
    submittal_type: 'Shop Drawings', // Type of submittal
    spec_section: '',             // Spec section reference (e.g., "08 71 00")
    manufacturer: '',             // Manufacturer name
    model_number: '',             // Model/product number
    recipient_type: 'external',   // 'external' or 'internal'
    sent_to: '',                  // Recipient name/company
    sent_to_email: '',            // Recipient email
    internal_owner_id: '',        // User ID for tracking
    priority: 'Medium',           // Priority level
    due_date: ''                  // Due date
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  useEffect(() => {
    if (isOpen) {
      generateSubmittalNumber();
      setFormData(prev => ({ ...prev, internal_owner_id: user?.id || '' }));
      setPendingFiles([]);
      setError('');
    }
  }, [isOpen, user]);

  // ==========================================================================
  // SUBMITTAL NUMBER GENERATION
  // ==========================================================================
  // Format: {PROJECT_NUMBER}-SUB-{SEQUENCE}
  // Example: NWBS-25001-SUB-001
  
  const generateSubmittalNumber = async () => {
    try {
      const { count } = await supabase
        .from('submittals')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      const subNum = (count || 0) + 1;
      const newSubmittalNumber = `${projectNumber}-SUB-${String(subNum).padStart(3, '0')}`;
      setNextSubmittalNumber(newSubmittalNumber);
    } catch (error) {
      console.error('Error generating submittal number:', error);
      setNextSubmittalNumber(`${projectNumber}-SUB-001`);
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
  // FILE HELPERS
  // ==========================================================================
  
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image size={16} style={{ color: 'var(--info)' }} />;
    if (fileType?.includes('pdf')) return <FileText size={16} style={{ color: '#ef4444' }} />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FileText size={16} style={{ color: '#3b82f6' }} />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileText size={16} style={{ color: '#22c55e' }} />;
    return <File size={16} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setPendingFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePendingFile = (fileId) => {
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // ==========================================================================
  // FILE UPLOAD
  // ==========================================================================
  
  const uploadPendingFiles = async (submittalId) => {
    const uploadedAttachments = [];

    for (const pendingFile of pendingFiles) {
      try {
        const timestamp = Date.now();
        const safeName = pendingFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${projectId}/submittals/${submittalId}/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, pendingFile.file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(storagePath);

        const attachmentData = {
          project_id: projectId,
          submittal_id: submittalId,
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
  // SUBMITTAL CREATION
  // ==========================================================================
  
  const createSubmittal = async () => {
    const submittalData = {
      project_id: projectId,
      submittal_number: nextSubmittalNumber,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      submittal_type: formData.submittal_type,
      spec_section: formData.spec_section.trim() || null,
      manufacturer: formData.manufacturer.trim() || null,
      model_number: formData.model_number.trim() || null,
      sent_to: formData.recipient_type === 'external' 
        ? formData.sent_to.trim() 
        : formData.sent_to,
      sent_to_email: formData.recipient_type === 'external' ? formData.sent_to_email.trim() : null,
      is_external: formData.recipient_type === 'external',
      internal_owner_id: formData.internal_owner_id || null,
      priority: formData.priority,
      due_date: formData.due_date || null,
      status: 'Pending',
      date_submitted: new Date().toISOString().split('T')[0],
      created_by: user.id
    };

    const { data, error: insertError } = await supabase
      .from('submittals')
      .insert([submittalData])
      .select()
      .single();

    if (insertError) throw insertError;

    let attachments = [];
    if (pendingFiles.length > 0) {
      attachments = await uploadPendingFiles(data.id);
    }

    return { submittal: data, attachments };
  };

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { submittal } = await createSubmittal();
      onSuccess(submittal);
      handleClose();
    } catch (error) {
      console.error('Error creating submittal:', error);
      setError(error.message || 'Failed to create submittal');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndEmail = async () => {
    setLoading(true);
    setError('');

    try {
      const { submittal } = await createSubmittal();
      
      const submittalForEmail = {
        ...submittal,
        sent_to_email: formData.sent_to_email
      };
      draftSubmittalEmail(submittalForEmail, projectName, projectNumber);
      
      onSuccess(submittal);
      handleClose();
    } catch (error) {
      console.error('Error creating submittal:', error);
      setError(error.message || 'Failed to create submittal');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndExportPDF = async () => {
    setLoading(true);
    setError('');

    try {
      const { submittal, attachments } = await createSubmittal();
      exportSubmittalToPDF(submittal, projectName, projectNumber, attachments);
      onSuccess(submittal);
      handleClose();
    } catch (error) {
      console.error('Error creating submittal:', error);
      setError(error.message || 'Failed to create submittal');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // MODAL CLOSE
  // ==========================================================================
  
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      submittal_type: 'Shop Drawings',
      spec_section: '',
      manufacturer: '',
      model_number: '',
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
              Create Submittal
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Submittal Number: <span style={{ color: 'var(--sunbelt-orange)', fontWeight: '600' }}>{nextSubmittalNumber}</span>
            </p>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}>
            <X size={24} />
          </button>
        </div>

        {/* ================================================================ */}
        {/* FORM                                                            */}
        {/* ================================================================ */}
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-xl)' }}>
          
          {error && (
            <div style={{ padding: 'var(--space-md)', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', color: 'var(--danger)', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {/* ============================================================ */}
          {/* TITLE                                                        */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Submittal Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="e.g., HVAC Unit Shop Drawings"
            />
          </div>

          {/* ============================================================ */}
          {/* TYPE & SPEC SECTION                                          */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Submittal Type *</label>
              <select
                name="submittal_type"
                value={formData.submittal_type}
                onChange={handleChange}
                required
                className="form-input"
              >
                {SUBMITTAL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Spec Section</label>
              <input
                type="text"
                name="spec_section"
                value={formData.spec_section}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 23 05 00"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* PRODUCT INFO                                                 */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
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
                placeholder="e.g., 50XC-A12"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* DESCRIPTION                                                  */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder="Additional details..."
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          {/* ============================================================ */}
          {/* RECIPIENT TYPE TOGGLE                                        */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Send To</label>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <label style={{
                flex: 1, padding: 'var(--space-md)',
                border: `2px solid ${formData.recipient_type === 'external' ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                background: formData.recipient_type === 'external' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)'
              }}>
                <input type="radio" name="recipient_type" value="external" checked={formData.recipient_type === 'external'} onChange={handleChange} style={{ marginRight: '8px' }} />
                <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>External Contact</span>
              </label>
              
              <label style={{
                flex: 1, padding: 'var(--space-md)',
                border: `2px solid ${formData.recipient_type === 'internal' ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                background: formData.recipient_type === 'internal' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)'
              }}>
                <input type="radio" name="recipient_type" value="internal" checked={formData.recipient_type === 'internal'} onChange={handleChange} style={{ marginRight: '8px' }} />
                <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Internal Team</span>
              </label>
            </div>
          </div>

          {/* ============================================================ */}
          {/* EXTERNAL RECIPIENT FIELDS                                    */}
          {/* ============================================================ */}
          {formData.recipient_type === 'external' && (
            <div style={{ padding: 'var(--space-lg)', background: 'rgba(255, 107, 53, 0.05)', border: '1px solid rgba(255, 107, 53, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                External Recipient Details
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="form-label">Contact Name / Company *</label>
                  <input type="text" name="sent_to" value={formData.sent_to} onChange={handleChange} required className="form-input" placeholder="e.g., ABC Architecture" />
                </div>
                
                <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="form-label">Contact Email *</label>
                  <input type="email" name="sent_to_email" value={formData.sent_to_email} onChange={handleChange} required className="form-input" placeholder="contact@example.com" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Internal Owner (Tracking) *</label>
                <select name="internal_owner_id" value={formData.internal_owner_id} onChange={handleChange} required className="form-input">
                  <option value="">Select team member</option>
                  {contacts.filter(c => c.contact_type === 'user').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* INTERNAL RECIPIENT DROPDOWN                                  */}
          {/* ============================================================ */}
          {formData.recipient_type === 'internal' && (
            <div className="form-group">
              <label className="form-label">Send To (Internal) *</label>
              <select name="sent_to" value={formData.sent_to} onChange={handleChange} required className="form-input">
                <option value="">Select team member</option>
                <optgroup label="── Internal Team ──">
                  {contacts.filter(c => c.contact_type === 'user').map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </optgroup>
                <optgroup label="── Factory Contacts ──">
                  {contacts.filter(c => c.contact_type === 'factory').map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
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
          <div className="form-group">
            <label className="form-label">Attachments</label>
            
            <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', textAlign: 'center', cursor: 'pointer', marginBottom: pendingFiles.length > 0 ? 'var(--space-md)' : 0 }}>
              <Upload size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Click to upload files</p>
              <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>

            {pendingFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {pendingFiles.map(file => (
                  <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                    {getFileIcon(file.type)}
                    <span style={{ flex: 1, color: 'var(--text-primary)' }}>{file.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{formatFileSize(file.size)}</span>
                    <button type="button" onClick={() => handleRemovePendingFile(file.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
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
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-color)', marginTop: 'var(--space-lg)', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
            
            <button type="button" onClick={handleCreateAndExportPDF} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '10px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              <FileText size={18} />Create & PDF
            </button>
            
            {formData.recipient_type === 'external' && formData.sent_to_email && (
              <button type="button" onClick={handleCreateAndEmail} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: '10px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                <Mail size={18} />Create & Email
              </button>
            )}
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : <><Send size={18} /> Create Submittal</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSubmittalModal;