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
  Loader,
  Map as MapIcon,
  MapPin
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function ProjectFiles({ projectId, onUpdate }) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, task, rfi, submittal, project, floorplan
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      fetchAttachments();
      fetchFloorPlans();
    }
  }, [projectId]);

  // ==========================================================================
  // FETCH ATTACHMENTS
  // ==========================================================================
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

  // ==========================================================================
  // FETCH FLOOR PLANS
  // ==========================================================================
  const fetchFloorPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('floor_plans')
        .select(`
          *,
          markers:floor_plan_markers(id)
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFloorPlans(data || []);
    } catch (error) {
      console.error('Error fetching floor plans:', error);
    }
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getFileIcon = (fileType, isFloorPlan = false) => {
    if (isFloorPlan) return <MapIcon size={20} style={{ color: 'var(--sunbelt-orange)' }} />;
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
      return { type: 'Task', label: attachment.task.title || 'Untitled Task', icon: CheckSquare, color: 'var(--info)' };
    }
    if (attachment.rfi && attachment.rfi_id) {
      return { type: 'RFI', label: `${attachment.rfi.rfi_number || 'N/A'}: ${attachment.rfi.subject || 'No Subject'}`, icon: MessageSquare, color: 'var(--warning)' };
    }
    if (attachment.submittal && attachment.submittal_id) {
      return { type: 'Submittal', label: `${attachment.submittal.submittal_number || 'N/A'}: ${attachment.submittal.title || 'Untitled'}`, icon: ClipboardList, color: 'var(--success)' };
    }
    return { type: 'Project', label: 'General Project File', icon: FolderOpen, color: 'var(--sunbelt-orange)' };
  };

  // ==========================================================================
  // FILE UPLOAD
  // ==========================================================================
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

  // ==========================================================================
  // DELETE HANDLERS
  // ==========================================================================
  const handleDeleteAttachment = async (attachment) => {
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

  const handleDeleteFloorPlan = async (plan) => {
    try {
      // Delete from storage
      await supabase.storage.from('project-files').remove([plan.file_path]);
      
      // Soft delete the record
      await supabase
        .from('floor_plans')
        .update({ is_active: false })
        .eq('id', plan.id);
      
      setFloorPlans(prev => prev.filter(p => p.id !== plan.id));
      setDeleteConfirm(null);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting floor plan:', error);
    }
  };

  // ==========================================================================
  // DOWNLOAD HANDLER
  // ==========================================================================
  const handleDownload = async (item, isFloorPlan = false) => {
    try {
      const storagePath = isFloorPlan ? item.file_path : item.storage_path;
      const fileName = isFloorPlan ? item.file_name : item.file_name;
      
      const { data } = await supabase.storage
        .from('project-files')
        .download(storagePath);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // ==========================================================================
  // FILTER AND SEARCH
  // ==========================================================================
  const filteredAttachments = attachments.filter(att => {
    if (filterType === 'floorplan') return false;
    
    if (filterType !== 'all' && filterType !== 'floorplan') {
      const assocType = getAssociationType(att);
      if (filterType !== assocType) return false;
    }

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

  const filteredFloorPlans = floorPlans.filter(plan => {
    if (filterType !== 'all' && filterType !== 'floorplan') return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!plan.name?.toLowerCase().includes(search) && !plan.file_name?.toLowerCase().includes(search)) {
        return false;
      }
    }

    return true;
  });

  // Combine for display
  const showFloorPlans = filterType === 'all' || filterType === 'floorplan';
  const showAttachments = filterType !== 'floorplan';

  const totalCount = (showAttachments ? filteredAttachments.length : 0) + (showFloorPlans ? filteredFloorPlans.length : 0);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div style={{ 
      background: 'var(--bg-secondary)', 
      borderRadius: 'var(--radius-lg)', 
      padding: 'var(--space-lg)', 
      border: '1px solid var(--border-color)' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 'var(--space-lg)' 
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          margin: 0 
        }}>
          Project Files ({attachments.length + floorPlans.length})
        </h3>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          padding: '8px 16px',
          background: uploading 
            ? 'var(--bg-tertiary)' 
            : 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
          color: 'white',
          border: 'none',
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
          border: '1px solid var(--border-color)',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: 'All', icon: Paperclip },
            { key: 'floorplan', label: 'Floor Plans', icon: MapIcon },
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
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.8125rem',
                  transition: 'all 0.15s'
                }}
              >
                <Icon size={14} />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--space-2xl)', 
          color: 'var(--text-secondary)' 
        }}>
          <div className="loading-spinner" style={{ marginBottom: 'var(--space-md)' }}></div>
          <p>Loading files...</p>
        </div>
      ) : totalCount === 0 ? (
        /* Empty State */
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--space-2xl)', 
          color: 'var(--text-tertiary)' 
        }}>
          <FolderOpen size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
            No files yet
          </h4>
          <p>Upload files or attachments from Tasks, RFIs, and Submittals will appear here</p>
        </div>
      ) : (
        /* File List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          
          {/* Floor Plans Section */}
          {showFloorPlans && filteredFloorPlans.length > 0 && (
            <>
              {filterType === 'all' && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600', 
                  color: 'var(--text-tertiary)', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: 'var(--space-sm)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  Floor Plans ({filteredFloorPlans.length})
                </div>
              )}
              {filteredFloorPlans.map(plan => (
                <div
                  key={`fp-${plan.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md)',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.15s'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 107, 53, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getFileIcon(plan.file_type, true)}
                  </div>

                  {/* File Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {plan.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.8125rem', 
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      flexWrap: 'wrap'
                    }}>
                      <span>{formatFileSize(plan.file_size)}</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        {plan.markers?.length || 0} markers
                      </span>
                      {plan.page_count > 1 && (
                        <>
                          <span>•</span>
                          <span>{plan.page_count} pages</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Association Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: 'rgba(255, 107, 53, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--sunbelt-orange)',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    <MapIcon size={12} />
                    Floor Plan
                  </div>

                  {/* Date */}
                  <div style={{ 
                    fontSize: '0.8125rem', 
                    color: 'var(--text-tertiary)',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatDate(plan.created_at)}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleDownload(plan, true)}
                      style={{
                        padding: '8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex'
                      }}
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'floorplan', item: plan })}
                      style={{
                        padding: '8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--danger)',
                        display: 'flex'
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Attachments Section */}
          {showAttachments && filteredAttachments.length > 0 && (
            <>
              {filterType === 'all' && filteredFloorPlans.length > 0 && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600', 
                  color: 'var(--text-tertiary)', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: 'var(--space-md)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  Attachments ({filteredAttachments.length})
                </div>
              )}
              {filteredAttachments.map(attachment => {
                const assoc = getAssociationLabel(attachment);
                const AssocIcon = assoc.icon;
                
                return (
                  <div
                    key={attachment.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      padding: 'var(--space-md)',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getFileIcon(attachment.file_type)}
                    </div>

                    {/* File Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: 'var(--text-primary)',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {attachment.file_name}
                      </div>
                      <div style={{ 
                        fontSize: '0.8125rem', 
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)'
                      }}>
                        <span>{formatFileSize(attachment.file_size)}</span>
                        {attachment.uploader && (
                          <>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} />
                              {attachment.uploader.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Association Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: `${assoc.color}15`,
                      borderRadius: 'var(--radius-md)',
                      color: assoc.color,
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      <AssocIcon size={12} />
                      {assoc.type}
                    </div>

                    {/* Date */}
                    <div style={{ 
                      fontSize: '0.8125rem', 
                      color: 'var(--text-tertiary)',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatDate(attachment.created_at)}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleDownload(attachment)}
                        style={{
                          padding: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          display: 'flex'
                        }}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'attachment', item: attachment })}
                        style={{
                          padding: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          color: 'var(--danger)',
                          display: 'flex'
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
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
            zIndex: 1000
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-xl)',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid var(--border-color)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)',
              fontSize: '1.125rem'
            }}>
              Delete {deleteConfirm.type === 'floorplan' ? 'Floor Plan' : 'File'}?
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Are you sure you want to delete "{deleteConfirm.type === 'floorplan' ? deleteConfirm.item.name : deleteConfirm.item.file_name}"?
              {deleteConfirm.type === 'floorplan' && deleteConfirm.item.markers?.length > 0 && (
                <span style={{ color: 'var(--warning)', display: 'block', marginTop: 'var(--space-sm)' }}>
                  This will also remove {deleteConfirm.item.markers.length} marker(s) placed on this floor plan.
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'floorplan') {
                    handleDeleteFloorPlan(deleteConfirm.item);
                  } else {
                    handleDeleteAttachment(deleteConfirm.item);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--danger)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
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