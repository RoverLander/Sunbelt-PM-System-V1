// ============================================================================
// FloorPlanUploadModal Component
// ============================================================================
// Modal for uploading new floor plan files (PDF or images).
// Uses PDF.js to detect page count for multi-page PDFs.
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
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const [analyzing, setAnalyzing] = useState(false);
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

    // If PDF, get page count
    if (file.type === 'application/pdf') {
      setAnalyzing(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPageCount(pdf.numPages);
      } catch (err) {
        console.error('Error analyzing PDF:', err);
        // Don't show error, just default to 1 page
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      // Create a synthetic event
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
    
    if (!selectedFile || !name.trim()) {
      setError('Please select a file and enter a name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate storage path
      const timestamp = Date.now();
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${projectId}/floor-plans/${timestamp}_${safeName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(storagePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(storagePath);

      // Create database record
      const floorPlanData = {
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
        file_path: storagePath,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        page_count: pageCount,
        sort_order: existingCount,
        uploaded_by: user.id
      };

      const { data: newPlan, error: insertError } = await supabase
        .from('floor_plans')
        .insert([floorPlanData])
        .select()
        .single();

      if (insertError) throw insertError;

      // If multi-page PDF, create page entries
      if (pageCount > 1) {
        const pages = Array.from({ length: pageCount }, (_, i) => ({
          floor_plan_id: newPlan.id,
          page_number: i + 1,
          name: `Page ${i + 1}`
        }));

        await supabase.from('floor_plan_pages').insert(pages);
      }

      onSuccess(newPlan);
    } catch (err) {
      console.error('Error uploading floor plan:', err);
      setError(err.message || 'Failed to upload floor plan');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!isOpen) return null;

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
        maxWidth: '500px',
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
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              margin: 0 
            }}>
              Upload Floor Plan
            </h2>
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              margin: '4px 0 0 0'
            }}>
              PDF or image files up to 50MB
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
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
          {/* Error Message */}
          {error && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              fontSize: '0.875rem'
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* File Drop Zone */}
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
              marginBottom: 'var(--space-lg)',
              background: selectedFile ? 'rgba(255, 107, 53, 0.05)' : 'var(--bg-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {analyzing ? (
              <div>
                <Loader size={32} className="spin" style={{ color: 'var(--sunbelt-orange)', marginBottom: 'var(--space-sm)' }} />
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Analyzing PDF...</p>
              </div>
            ) : selectedFile ? (
              <div>
                {selectedFile.type === 'application/pdf' ? (
                  <FileText size={32} style={{ color: '#ef4444', marginBottom: 'var(--space-sm)' }} />
                ) : (
                  <Image size={32} style={{ color: 'var(--info)', marginBottom: 'var(--space-sm)' }} />
                )}
                <p style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  {selectedFile.name}
                </p>
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.8125rem',
                  margin: 0
                }}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  {pageCount > 1 && ` • ${pageCount} pages`}
                </p>
                <p style={{
                  color: 'var(--sunbelt-orange)',
                  fontSize: '0.8125rem',
                  marginTop: 'var(--space-sm)'
                }}>
                  Click to change file
                </p>
              </div>
            ) : (
              <div>
                <Upload size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }} />
                <p style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  Drop file here or click to browse
                </p>
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.8125rem',
                  margin: 0
                }}>
                  PDF, PNG, JPG, or WebP
                </p>
              </div>
            )}
          </div>

          {/* Name Field */}
          <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="form-label">
              Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Level 1 Floor Plan"
              className="form-input"
              required
            />
          </div>

          {/* Description Field */}
          <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="form-label">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any notes about this floor plan..."
              className="form-input"
              rows={2}
              style={{ resize: 'vertical', minHeight: '60px' }}
            />
          </div>

          {/* Page Count Info (for multi-page PDFs) */}
          {pageCount > 1 && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: 'var(--info)' }}>Multi-page PDF detected:</strong>{' '}
              This PDF has {pageCount} pages. You can name each page after uploading.
            </div>
          )}

          {/* ================================================================ */}
          {/* FOOTER                                                          */}
          {/* ================================================================ */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            justifyContent: 'flex-end',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile || !name.trim() || analyzing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '10px 20px',
                background: (!selectedFile || !name.trim() || analyzing) 
                  ? 'var(--bg-tertiary)' 
                  : 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                color: (!selectedFile || !name.trim() || analyzing) ? 'var(--text-tertiary)' : 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: (!selectedFile || !name.trim() || loading || analyzing) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.9375rem',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload
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