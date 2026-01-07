// ============================================================================
// FloorPlanUploadModal Component
// ============================================================================
// Modal for uploading new floor plan files (PDF or images).
// Simplified version that doesn't rely on PDF.js worker for page detection.
// ============================================================================

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Image,
  AlertCircle,
  Loader,
  File
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const ACCEPTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg,.jpeg',
  'image/webp': '.webp'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function FloorPlanUploadModal({ isOpen, onClose, projectId, projectNumber, onSuccess, existingCount }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [selectedFile, setSelectedFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ==========================================================================
  // FILE HANDLING
  // ==========================================================================
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSelectedFile(null);
    setPageCount(1);

    // Validate file type
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      setError('Please upload a PDF or image file (PNG, JPG, WebP)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);

    // Auto-generate name from filename
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    if (!name) {
      setName(baseName);
    }

    // For PDFs, default to 1 page (user can manually specify if needed)
    // PDF.js worker doesn't work well in StackBlitz environment
    if (file.type === 'application/pdf') {
      setPageCount(1);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const syntheticEvent = { target: { files: [file] } };
      handleFileSelect(syntheticEvent);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ==========================================================================
  // SUBMIT HANDLER
  // ==========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a name for the floor plan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate storage path
      const timestamp = Date.now();
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${projectId}/floor-plans/${timestamp}_${sanitizedFileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create floor plan record
      const floorPlanData = {
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
        file_path: storagePath,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        page_count: pageCount,
        sort_order: existingCount || 0,
        uploaded_by: user?.id
      };

      const { data, error: insertError } = await supabase
        .from('floor_plans')
        .insert([floorPlanData])
        .select()
        .single();

      if (insertError) throw insertError;

      // If multi-page PDF, create page entries
      if (pageCount > 1) {
        const pages = Array.from({ length: pageCount }, (_, i) => ({
          floor_plan_id: data.id,
          page_number: i + 1,
          name: `Page ${i + 1}`
        }));

        await supabase.from('floor_plan_pages').insert(pages);
      }

      onSuccess && onSuccess(data);
      handleClose();
    } catch (err) {
      console.error('Error uploading floor plan:', err);
      setError(err.message || 'Failed to upload floor plan');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // RESET / CLOSE
  // ==========================================================================
  const handleClose = () => {
    setSelectedFile(null);
    setName('');
    setDescription('');
    setPageCount(1);
    setError('');
    onClose();
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image size={24} style={{ color: 'var(--info)' }} />;
    if (fileType?.includes('pdf')) return <FileText size={24} style={{ color: '#ef4444' }} />;
    return <File size={24} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-md)'
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* ================================================================ */}
        {/* HEADER                                                          */}
        {/* ================================================================ */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-lg)',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Upload Floor Plan
          </h2>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* ================================================================ */}
        {/* FORM                                                            */}
        {/* ================================================================ */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            
            {/* Error Display */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#ef4444',
                  fontSize: '0.875rem'
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* ============================================================ */}
            {/* FILE DROP ZONE                                               */}
            {/* ============================================================ */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${selectedFile ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-xl)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedFile ? 'rgba(255, 107, 53, 0.05)' : 'var(--bg-primary)'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={Object.values(ACCEPTED_FILE_TYPES).join(',')}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {selectedFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  {getFileIcon(selectedFile.type)}
                  <div>
                    <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      {formatFileSize(selectedFile.size)}
                      {selectedFile.type === 'application/pdf' && ` • PDF`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setName('');
                      setPageCount(1);
                    }}
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--danger)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <Upload size={32} style={{ color: 'var(--text-tertiary)' }} />
                  <div>
                    <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                      Drop file here or click to browse
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      PDF, PNG, JPG, or WebP (max 50MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* NAME INPUT                                                   */}
            {/* ============================================================ */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-xs)'
                }}
              >
                Floor Plan Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Level 1 Floor Plan"
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem'
                }}
              />
            </div>

            {/* ============================================================ */}
            {/* DESCRIPTION INPUT                                            */}
            {/* ============================================================ */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-xs)'
                }}
              >
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes about this floor plan..."
                rows={3}
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* ============================================================ */}
            {/* PAGE COUNT (for PDFs)                                        */}
            {/* ============================================================ */}
            {selectedFile?.type === 'application/pdf' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-xs)'
                  }}
                >
                  Number of Pages
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={pageCount}
                  onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '100px',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Enter the number of pages in your PDF
                </p>
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* FOOTER                                                          */}
          {/* ================================================================ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-sm)',
              padding: 'var(--space-lg)',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9375rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '10px 20px',
                background: selectedFile
                  ? 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))'
                  : 'var(--bg-tertiary)',
                color: selectedFile ? 'white' : 'var(--text-tertiary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: selectedFile ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: '0.9375rem'
              }}
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Floor Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FloorPlanUploadModal;