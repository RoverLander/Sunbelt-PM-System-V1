import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  FileText, 
  Image, 
  File, 
  Download, 
  Trash2, 
  Upload, 
  Search,
  Filter,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  Paperclip,
  Calendar,
  User,
  X,
  Loader
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function ProjectFiles({ projectId, onUpdate }) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, task, rfi, submittal, project
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      fetchAttachments();
    }
  }, [projectId]);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select(`
          *,
          task:task_id(id, title),
          rfi:rfi_id(id, rfi_number, subject),
          submittal:submittal_id(id, submittal_number, title),
          uploader:uploaded_by(name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image size={20} style={{ color: 'var(--info)' }} />;
    if (fileType?.includes('pdf')) return <FileText size={20} style={{ color: '#ef4444' }} />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FileText size={20} style={{ color: '#3b82f6' }} />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileText size={20} style={{ color: '#22c55e' }} />;
    return <File size={20} style={{ color: 'var(--text-secondary)' }} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAssociationType = (attachment) => {
    if (attachment.task_id) return 'task';
    if (attachment.rfi_id) return 'rfi';
    if (attachment.submittal_id) return 'submittal';
    return 'project';
  };

  const getAssociationLabel = (attachment) => {
    if (attachment.task && attachment.task_id) {
      return { type: 'Task', label: attachment.task.title, icon: CheckSquare, color: 'var(--info)' };
    }
    if (attachment.rfi && attachment.rfi_id) {
      return { type: 'RFI', label: `${attachment.rfi.rfi_number}: ${attachment.rfi.subject}`, icon: MessageSquare, color: 'var(--warning)' };
    }
    if (attachment.submittal && attachment.submittal_id) {
      return { type: 'Submittal', label: `${attachment.submittal.submittal_number}: ${attachment.submittal.title}`, icon: ClipboardList, color: 'var(--success)' };
    }
    return { type: 'Project', label: 'General Project File', icon: FolderOpen, color: 'var(--sunbelt-orange)' };
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${projectId}/general/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(storagePath);

        const attachmentData = {
          project_id: projectId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          uploaded_by: user.id
        };

        await supabase.from('attachments').insert([attachmentData]);
      }

      fetchAttachments();
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachment) => {
    try {
      await supabase.storage.from('project-files').remove([attachment.storage_path]);
      await supabase.from('attachments').delete().eq('id', attachment.id);
      
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      setDeleteConfirm(null);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  // Filter and search
  const filteredAttachments = attachments.filter(att => {
    // Filter by type
    if (filterType !== 'all') {
      const assocType = getAssociationType(att);
      if (filterType !== assocType) return false;
    }

    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = att.file_name?.toLowerCase().includes(search);
      const matchesTask = att.task?.title?.toLowerCase().includes(search);
      const matchesRFI = att.rfi?.subject?.toLowerCase().includes(search) || att.rfi?.rfi_number?.toLowerCase().includes(search);
      const matchesSubmittal = att.submittal?.title?.toLowerCase().includes(search) || att.submittal?.submittal_number?.toLowerCase().includes(search);
      
      if (!matchesName && !matchesTask && !matchesRFI && !matchesSubmittal) return false;
    }

    return true;
  });

  // Count by type
  const counts = {
    all: attachments.length,
    task: attachments.filter(a => a.task_id).length,
    rfi: attachments.filter(a => a.rfi_id).length,
    submittal: attachments.filter(a => a.submittal_id).length,
    project: attachments.filter(a => !a.task_id && !a.rfi_id && !a.submittal_id).length
  };

  if (loading) {
    return (
      <div style={{ 
        padding: 'var(--space-2xl)', 
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <Loader size={32} className="spin" style={{ margin: '0 auto var(--space-md)' }} />
        <p>Loading files...</p>
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <FolderOpen size={24} style={{ color: 'var(--sunbelt-orange)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Project Files
          </h3>
          <span style={{ 
            background: 'var(--bg-tertiary)', 
            color: 'var(--text-secondary)',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            {attachments.length}
          </span>
        </div>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          padding: 'var(--space-sm) var(--space-md)',
          background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          fontSize: '0.875rem',
          opacity: uploading ? 0.7 : 1,
          transition: 'all 0.15s'
        }}>
          {uploading ? (
            <>
              <Loader size={16} className="spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload Files
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

      {/* Search and Filters */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-md)', 
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ 
          flex: 1,
          minWidth: '200px',
          position: 'relative'
        }}>
          <Search size={18} style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)'
          }} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '40px' }}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '4px',
          background: 'var(--bg-secondary)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          {[
            { key: 'all', label: 'All', icon: Paperclip },
            { key: 'task', label: 'Tasks', icon: CheckSquare },
            { key: 'rfi', label: 'RFIs', icon: MessageSquare },
            { key: 'submittal', label: 'Submittals', icon: ClipboardList },
            { key: 'project', label: 'General', icon: FolderOpen }
          ].map(filter => {
            const Icon = filter.icon;
            const isActive = filterType === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--bg-primary)' : 'transparent',
                  color: isActive ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <Icon size={14} />
                {filter.label}
                <span style={{
                  background: isActive ? 'rgba(255, 107, 53, 0.15)' : 'var(--bg-tertiary)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.75rem'
                }}>
                  {counts[filter.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Files List */}
      {filteredAttachments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-2xl)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <FolderOpen size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
            {searchTerm || filterType !== 'all' ? 'No files match your search' : 'No files yet'}
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter'
              : 'Upload files or attach them to tasks, RFIs, and submittals'
            }
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 180px 150px 100px 80px',
            gap: 'var(--space-md)',
            padding: 'var(--space-md) var(--space-lg)',
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div>File Name</div>
            <div>Associated With</div>
            <div>Uploaded By</div>
            <div>Size</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {/* File Rows */}
          {filteredAttachments.map(attachment => {
            const association = getAssociationLabel(attachment);
            const AssocIcon = association.icon;

            return (
              <div 
                key={attachment.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px 150px 100px 80px',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md) var(--space-lg)',
                  borderBottom: '1px solid var(--border-color)',
                  alignItems: 'center',
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* File Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 }}>
                  {getFileIcon(attachment.file_type)}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {attachment.file_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {formatDate(attachment.created_at)}
                    </div>
                  </div>
                </div>

                {/* Association */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: `${association.color}15`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: association.color,
                    maxWidth: '100%'
                  }}>
                    <AssocIcon size={12} />
                    <span style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {association.type}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {association.label}
                  </div>
                </div>

                {/* Uploaded By */}
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {attachment.uploader?.name || 'Unknown'}
                </div>

                {/* Size */}
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  {formatFileSize(attachment.file_size)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-xs)' }}>
                  <button
                    onClick={() => window.open(attachment.public_url, '_blank')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--info)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(attachment)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
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
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-xl)',
            maxWidth: '400px',
            width: '100%',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--danger-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={20} style={{ color: 'var(--danger)' }} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Delete File?</h3>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '0.9375rem' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.file_name}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn btn-danger"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectFiles;