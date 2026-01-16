import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { 
  Paperclip, 
  Upload, 
  X, 
  FileText, 
  Image, 
  File,
  Download,
  Trash2,
  Loader
} from 'lucide-react';

function FileAttachments({ projectId, taskId, rfiId, submittalId, onUpdate }) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAttachments();
  }, [taskId, rfiId, submittalId]);

  const fetchAttachments = async () => {
    try {
      let query = supabase
        .from('attachments')
        .select('*')
        .order('created_at', { ascending: false });

      if (taskId) query = query.eq('task_id', taskId);
      else if (rfiId) query = query.eq('rfi_id', rfiId);
      else if (submittalId) query = query.eq('submittal_id', submittalId);
      else return;

      const { data, error } = await query;
      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image size={18} style={{ color: 'var(--info)' }} />;
    if (fileType?.includes('pdf')) return <FileText size={18} style={{ color: '#ef4444' }} />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FileText size={18} style={{ color: '#3b82f6' }} />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileText size={18} style={{ color: '#22c55e' }} />;
    return <File size={18} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      for (const file of files) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        let folder = 'general';
        let itemId = null;
        
        if (taskId) { folder = 'tasks'; itemId = taskId; }
        else if (rfiId) { folder = 'rfis'; itemId = rfiId; }
        else if (submittalId) { folder = 'submittals'; itemId = submittalId; }

        const storagePath = `${projectId}/${folder}/${itemId}/${timestamp}_${safeName}`;

        const { data: _uploadData, error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(storagePath);

        const attachmentData = {
          project_id: projectId,
          task_id: taskId || null,
          rfi_id: rfiId || null,
          submittal_id: submittalId || null,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          uploaded_by: user.id
        };

        const { error: insertError } = await supabase
          .from('attachments')
          .insert([attachmentData]);

        if (insertError) throw insertError;
      }

      fetchAttachments();
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (attachment) => {
    if (!confirm(`Delete "${attachment.file_name}"?`)) return;

    setDeleting(attachment.id);
    try {
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([attachment.storage_path]);

      if (storageError) console.warn('Storage delete warning:', storageError);

      const { error: deleteError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);

      if (deleteError) throw deleteError;

      fetchAttachments();
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Error deleting attachment:', error);
      setError(error.message || 'Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (attachment) => {
    window.open(attachment.public_url, '_blank');
  };

  return (
    <div style={{ 
      padding: 'var(--space-lg)', 
      background: 'var(--bg-secondary)', 
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h4 style={{ 
          fontSize: '0.875rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <Paperclip size={16} />
          Attachments ({attachments.length})
        </h4>
        
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          padding: '6px 12px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)',
          fontSize: '0.8125rem',
          fontWeight: '600',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.6 : 1,
          transition: 'all 0.15s'
        }}>
          {uploading ? (
            <>
              <Loader size={14} className="spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={14} />
              Upload
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {error && (
        <div style={{
          padding: 'var(--space-sm)',
          background: 'var(--danger-light)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--danger)',
          fontSize: '0.75rem',
          marginBottom: 'var(--space-sm)'
        }}>
          {error}
        </div>
      )}

      {attachments.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--space-lg)', 
          color: 'var(--text-tertiary)',
          fontSize: '0.875rem'
        }}>
          No attachments yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {attachments.map(attachment => (
            <div 
              key={attachment.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {getFileIcon(attachment.file_type)}
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {attachment.file_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {formatFileSize(attachment.file_size)}
                  {attachment.created_at && ` • ${new Date(attachment.created_at).toLocaleDateString()}`}
                </div>
              </div>

              <button
                onClick={() => handleDownload(attachment)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  borderRadius: '4px'
                }}
                title="Download"
              >
                <Download size={16} />
              </button>

              <button
                onClick={() => handleDelete(attachment)}
                disabled={deleting === attachment.id}
                style={{
                  background: 'none',
                  border: 'none',
                  color: deleting === attachment.id ? 'var(--text-tertiary)' : 'var(--danger)',
                  cursor: deleting === attachment.id ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  borderRadius: '4px'
                }}
                title="Delete"
              >
                {deleting === attachment.id ? <Loader size={16} /> : <Trash2 size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default FileAttachments;