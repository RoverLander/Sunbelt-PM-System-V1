// ============================================================================
// FloorPlanUploadModal Component
// ============================================================================
// Modal for uploading new floor plan files (PDF or images).
// PDF files are automatically converted to PNG for marker support.
// ============================================================================

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Image,
  AlertCircle,
  Loader,
  File,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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
  const [conversionProgress, setConversionProgress] = useState('');
  const [isPdfConverting, setIsPdfConverting] = useState(false);

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

    // For PDFs, automatically detect page count
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPageCount(pdf.numPages);
      } catch (err) {
        console.error('Error detecting PDF pages:', err);
        setPageCount(1);
      }
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
  // PDF TO PNG CONVERSION
  // ==========================================================================
  const convertPdfToImages = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images = [];

    // Render at 2x scale for good quality (adjustable)
    const scale = 2.0;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      setConversionProgress(`Converting page ${pageNum} of ${pdf.numPages}...`);

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Convert canvas to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 0.95);
      });

      images.push({
        pageNumber: pageNum,
        blob,
        width: viewport.width,
        height: viewport.height
      });
    }

    return images;
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
      const timestamp = Date.now();
      const isPdf = selectedFile.type === 'application/pdf';

      // If PDF, convert to PNG images first
      if (isPdf) {
        setIsPdfConverting(true);
        setConversionProgress('Starting PDF conversion...');

        try {
          const images = await convertPdfToImages(selectedFile);

          // Upload each page as a separate floor plan or as pages of one plan
          if (images.length === 1) {
            // Single page PDF - upload as single image
            setConversionProgress('Uploading converted image...');
            const storagePath = `${projectId}/floor-plans/${timestamp}_${name.trim().replace(/[^a-zA-Z0-9._-]/g, '_')}.png`;

            const { error: uploadError } = await supabase.storage
              .from('project-files')
              .upload(storagePath, images[0].blob, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'image/png'
              });

            if (uploadError) throw uploadError;

            // Create floor plan record
            const { data, error: insertError } = await supabase
              .from('floor_plans')
              .insert([{
                project_id: projectId,
                name: name.trim(),
                description: description.trim() || null,
                file_path: storagePath,
                file_name: `${name.trim()}.png`,
                file_type: 'image/png',
                file_size: images[0].blob.size,
                page_count: 1,
                sort_order: existingCount || 0,
                uploaded_by: user?.id
              }])
              .select()
              .single();

            if (insertError) throw insertError;
            onSuccess && onSuccess(data);

          } else {
            // Multi-page PDF - create separate floor plans for each page
            // This allows independent marker placement on each page
            for (let i = 0; i < images.length; i++) {
              setConversionProgress(`Uploading page ${i + 1} of ${images.length}...`);
              const image = images[i];
              const pageName = `${name.trim()} - Page ${i + 1}`;
              const storagePath = `${projectId}/floor-plans/${timestamp}_page${i + 1}_${name.trim().replace(/[^a-zA-Z0-9._-]/g, '_')}.png`;

              const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(storagePath, image.blob, {
                  cacheControl: '3600',
                  upsert: false,
                  contentType: 'image/png'
                });

              if (uploadError) throw uploadError;

              // Create floor plan record for this page
              const { error: insertError } = await supabase
                .from('floor_plans')
                .insert([{
                  project_id: projectId,
                  name: pageName,
                  description: description.trim() || null,
                  file_path: storagePath,
                  file_name: `${pageName}.png`,
                  file_type: 'image/png',
                  file_size: image.blob.size,
                  page_count: 1,
                  sort_order: (existingCount || 0) + i,
                  uploaded_by: user?.id
                }])
                .select()
                .single();

              if (insertError) throw insertError;
            }

            onSuccess && onSuccess({ multiple: true, count: images.length });
          }

        } catch (convErr) {
          console.error('PDF conversion error:', convErr);
          throw new Error('Failed to convert PDF. Try uploading as PNG/JPG instead.');
        } finally {
          setIsPdfConverting(false);
          setConversionProgress('');
        }

      } else {
        // Regular image upload
        const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${projectId}/floor-plans/${timestamp}_${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Create floor plan record
        const { data, error: insertError } = await supabase
          .from('floor_plans')
          .insert([{
            project_id: projectId,
            name: name.trim(),
            description: description.trim() || null,
            file_path: storagePath,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            file_size: selectedFile.size,
            page_count: 1,
            sort_order: existingCount || 0,
            uploaded_by: user?.id
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        onSuccess && onSuccess(data);
      }

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
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      {formatFileSize(selectedFile.size)}
                      {selectedFile.type === 'application/pdf' && ` • ${pageCount} page${pageCount > 1 ? 's' : ''}`}
                    </p>
                    {selectedFile.type === 'application/pdf' && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--success)',
                        margin: '8px 0 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}>
                        <CheckCircle size={12} />
                        Will be converted to PNG for marker support
                      </p>
                    )}
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
            {/* PDF INFO (multi-page notice)                                 */}
            {/* ============================================================ */}
            {selectedFile?.type === 'application/pdf' && pageCount > 1 && (
              <div style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                color: 'var(--info)'
              }}>
                This {pageCount}-page PDF will be converted to {pageCount} separate floor plan images,
                each with independent marker support.
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
                  {isPdfConverting ? conversionProgress || 'Converting...' : 'Uploading...'}
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