// ============================================================================
// ProjectLog.jsx - Daily Project Log & Activity Timeline
// ============================================================================
// Features:
// - Timeline view grouped by date
// - Manual notes with rich content
// - Auto-populated activity from project changes
// - File/photo attachments
// - Pin important entries
// - Search and filter
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Pin,
  PinOff,
  Edit3,
  Trash2,
  Paperclip,
  Image,
  FileText,
  File,
  Download,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  Flag,
  Activity,
  AlertCircle,
  X,
  Upload,
  Loader,
  Calendar,
  MoreVertical,
  Star,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const ENTRY_TYPE_CONFIG = {
  note: {
    icon: Edit3,
    color: 'var(--sunbelt-orange)',
    label: 'Note',
    bgColor: 'rgba(255, 107, 53, 0.1)'
  },
  activity: {
    icon: Activity,
    color: 'var(--info)',
    label: 'Activity',
    bgColor: 'rgba(59, 130, 246, 0.1)'
  },
  status_change: {
    icon: ArrowUp,
    color: 'var(--warning)',
    label: 'Status Change',
    bgColor: 'rgba(245, 158, 11, 0.1)'
  },
  milestone: {
    icon: Flag,
    color: 'var(--success)',
    label: 'Milestone',
    bgColor: 'rgba(34, 197, 94, 0.1)'
  },
  file_upload: {
    icon: Paperclip,
    color: 'var(--info)',
    label: 'File Upload',
    bgColor: 'rgba(59, 130, 246, 0.1)'
  },
  rfi_update: {
    icon: MessageSquare,
    color: '#8b5cf6',
    label: 'RFI',
    bgColor: 'rgba(139, 92, 246, 0.1)'
  },
  submittal_update: {
    icon: ClipboardList,
    color: '#06b6d4',
    label: 'Submittal',
    bgColor: 'rgba(6, 182, 212, 0.1)'
  },
  task_update: {
    icon: CheckSquare,
    color: 'var(--sunbelt-orange)',
    label: 'Task',
    bgColor: 'rgba(255, 107, 53, 0.1)'
  }
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Activity' },
  { value: 'note', label: 'Notes Only' },
  { value: 'task_update', label: 'Task Updates' },
  { value: 'rfi_update', label: 'RFI Updates' },
  { value: 'submittal_update', label: 'Submittal Updates' },
  { value: 'milestone', label: 'Milestones' },
  { value: 'status_change', label: 'Status Changes' }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatRelativeDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateString);
};

const getFileIcon = (fileType) => {
  if (fileType?.startsWith('image/')) return <Image size={16} style={{ color: 'var(--info)' }} />;
  if (fileType?.includes('pdf')) return <FileText size={16} style={{ color: '#ef4444' }} />;
  return <File size={16} style={{ color: 'var(--text-secondary)' }} />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ProjectLog({ projectId, onUpdate }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [expandedDates, setExpandedDates] = useState({});
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchLogs = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('project_logs')
        .select(`
          *,
          author:user_id(id, name, email, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);

      // Auto-expand today and yesterday
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      setExpandedDates({ [today]: true, [yesterday]: true });

    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleTogglePin = async (log) => {
    try {
      const { error } = await supabase
        .from('project_logs')
        .update({ is_pinned: !log.is_pinned })
        .eq('id', log.id);

      if (error) throw error;

      setLogs(prev => prev.map(l =>
        l.id === log.id ? { ...l, is_pinned: !l.is_pinned } : l
      ));
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleDeleteLog = async (log) => {
    if (!confirm('Delete this log entry?')) return;

    try {
      // Delete attachments from storage first
      if (log.attachments?.length > 0) {
        const paths = log.attachments.map(a => a.storage_path);
        await supabase.storage.from('project-files').remove(paths);
      }

      const { error } = await supabase
        .from('project_logs')
        .delete()
        .eq('id', log.id);

      if (error) throw error;

      setLogs(prev => prev.filter(l => l.id !== log.id));
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const toggleDateExpansion = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // ==========================================================================
  // FILTERING & GROUPING
  // ==========================================================================
  const filteredLogs = logs.filter(log => {
    // Filter by pinned
    if (showPinnedOnly && !log.is_pinned) return false;

    // Filter by type
    if (filterType !== 'all' && log.entry_type !== filterType) return false;

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesTitle = log.title?.toLowerCase().includes(search);
      const matchesContent = log.content?.toLowerCase().includes(search);
      const matchesAuthor = log.author?.name?.toLowerCase().includes(search);
      if (!matchesTitle && !matchesContent && !matchesAuthor) return false;
    }

    return true;
  });

  // Group by date
  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = log.log_date || log.created_at?.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
    return groups;
  }, {});

  // Sort dates descending
  const sortedDates = Object.keys(groupedLogs).sort((a, b) =>
    new Date(b) - new Date(a)
  );

  // Pinned logs (always show at top)
  const pinnedLogs = logs.filter(l => l.is_pinned && !showPinnedOnly);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      minHeight: '400px'
    }}>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{
        padding: 'var(--space-lg)',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <BookOpen size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Project Log
            </h3>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              background: 'var(--bg-primary)',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {logs.length} entries
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            <Plus size={16} />
            Add Note
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div style={{
            flex: 1,
            minWidth: '200px',
            position: 'relative'
          }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)'
            }} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Pinned Toggle */}
          <button
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: showPinnedOnly ? 'var(--sunbelt-orange)' : 'var(--bg-primary)',
              color: showPinnedOnly ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            <Pin size={14} />
            Pinned
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* CONTENT                                                           */}
      {/* ================================================================== */}
      <div style={{ padding: 'var(--space-lg)' }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-2xl)',
            color: 'var(--text-secondary)'
          }}>
            <div className="loading-spinner" style={{ marginBottom: 'var(--space-md)' }}></div>
            <p>Loading log entries...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-2xl)',
            color: 'var(--text-tertiary)'
          }}>
            <BookOpen size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
              {searchTerm || filterType !== 'all' ? 'No matching entries' : 'No log entries yet'}
            </h4>
            <p>
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add notes to track daily project activity'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  marginTop: 'var(--space-md)',
                  padding: '10px 20px',
                  background: 'var(--sunbelt-orange)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Add First Note
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedLogs.length > 0 && !showPinnedOnly && (
              <div style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  marginBottom: 'var(--space-md)'
                }}>
                  <Pin size={14} style={{ color: 'var(--sunbelt-orange)' }} />
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--sunbelt-orange)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Pinned
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {pinnedLogs.slice(0, 3).map(log => (
                    <LogEntry
                      key={log.id}
                      log={log}
                      user={user}
                      onTogglePin={handleTogglePin}
                      onEdit={() => setEditingLog(log)}
                      onDelete={() => handleDeleteLog(log)}
                      isPinned
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {sortedDates.map(date => {
                const dateLogs = groupedLogs[date];
                const isExpanded = expandedDates[date] !== false;

                return (
                  <div key={date}>
                    {/* Date Header */}
                    <button
                      onClick={() => toggleDateExpansion(date)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                        width: '100%',
                        padding: 'var(--space-sm) 0',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginBottom: isExpanded ? 'var(--space-md)' : 0
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
                      ) : (
                        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                      )}
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {formatRelativeDate(date)}
                      </div>
                      <div style={{
                        flex: 1,
                        height: '1px',
                        background: 'var(--border-color)',
                        marginLeft: 'var(--space-sm)'
                      }} />
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-tertiary)',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        {dateLogs.length} {dateLogs.length === 1 ? 'entry' : 'entries'}
                      </span>
                    </button>

                    {/* Log Entries */}
                    {isExpanded && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-sm)',
                        marginLeft: 'var(--space-lg)',
                        borderLeft: '2px solid var(--border-color)',
                        paddingLeft: 'var(--space-lg)'
                      }}>
                        {dateLogs.map(log => (
                          <LogEntry
                            key={log.id}
                            log={log}
                            user={user}
                            onTogglePin={handleTogglePin}
                            onEdit={() => setEditingLog(log)}
                            onDelete={() => handleDeleteLog(log)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ================================================================== */}
      {/* ADD/EDIT MODAL                                                    */}
      {/* ================================================================== */}
      {(showAddModal || editingLog) && (
        <AddLogEntryModal
          projectId={projectId}
          editingLog={editingLog}
          onClose={() => {
            setShowAddModal(false);
            setEditingLog(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingLog(null);
            fetchLogs();
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// LOG ENTRY COMPONENT
// ============================================================================
function LogEntry({ log, user, onTogglePin, onEdit, onDelete, isPinned }) {
  const [showMenu, setShowMenu] = useState(false);
  const config = ENTRY_TYPE_CONFIG[log.entry_type] || ENTRY_TYPE_CONFIG.activity;
  const Icon = config.icon;
  const isOwnEntry = log.user_id === user?.id;
  const isNote = log.entry_type === 'note';
  const attachments = log.attachments || [];

  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${isPinned ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
      overflow: 'hidden'
    }}>
      {/* Timeline Dot */}
      <div style={{
        position: 'absolute',
        left: '-25px',
        top: '20px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: config.color,
        border: '2px solid var(--bg-secondary)'
      }} />

      {/* Content */}
      <div style={{ padding: 'var(--space-md)' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flex: 1 }}>
            {/* Type Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              background: config.bgColor,
              borderRadius: 'var(--radius-sm)',
              color: config.color,
              fontSize: '0.6875rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              <Icon size={12} />
              {config.label}
            </div>

            {/* Title */}
            {log.title && (
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                {log.title}
              </span>
            )}

            {/* Pin Icon */}
            {log.is_pinned && (
              <Pin size={12} style={{ color: 'var(--sunbelt-orange)' }} />
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)'
            }}>
              {formatTime(log.created_at)}
            </span>

            {/* More Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex'
                }}
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 100
                    }}
                    onClick={() => setShowMenu(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '4px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 101,
                    minWidth: '140px',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => { onTogglePin(log); setShowMenu(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '10px 14px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {log.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      {log.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                    {isNote && isOwnEntry && (
                      <>
                        <button
                          onClick={() => { onEdit(); setShowMenu(false); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px 14px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => { onDelete(); setShowMenu(false); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px 14px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {log.content && (
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap'
          }}>
            {log.content}
          </p>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div style={{
            marginTop: 'var(--space-md)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)'
          }}>
            {attachments.map((att, idx) => (
              <a
                key={idx}
                href={att.public_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  textDecoration: 'none'
                }}
              >
                {getFileIcon(att.file_type)}
                <span style={{
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {att.file_name}
                </span>
                {att.file_size && (
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    ({formatFileSize(att.file_size)})
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Image Previews */}
        {attachments.filter(a => a.file_type?.startsWith('image/')).length > 0 && (
          <div style={{
            marginTop: 'var(--space-md)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)'
          }}>
            {attachments.filter(a => a.file_type?.startsWith('image/')).map((att, idx) => (
              <a
                key={idx}
                href={att.public_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={att.public_url}
                  alt={att.file_name}
                  style={{
                    width: '120px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}
                />
              </a>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          marginTop: 'var(--space-sm)',
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)'
        }}>
          <User size={12} />
          <span>{log.author?.name || 'System'}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADD/EDIT LOG ENTRY MODAL
// ============================================================================
function AddLogEntryModal({ projectId, editingLog, onClose, onSuccess }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(editingLog?.title || '');
  const [content, setContent] = useState(editingLog?.content || '');
  const [isImportant, setIsImportant] = useState(editingLog?.is_important || false);
  const [isPinned, setIsPinned] = useState(editingLog?.is_pinned || false);
  const [attachments, setAttachments] = useState(editingLog?.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Handle file upload
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const newAttachments = [];

      for (const file of files) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${projectId}/logs/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(storagePath);

        newAttachments.push({
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: storagePath,
          public_url: urlData.publicUrl
        });
      }

      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const handleRemoveAttachment = async (index) => {
    const att = attachments[index];

    // Only remove from storage if it's a new upload (not from editingLog)
    if (!editingLog?.attachments?.find(a => a.storage_path === att.storage_path)) {
      await supabase.storage.from('project-files').remove([att.storage_path]);
    }

    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Save log entry
  const handleSave = async () => {
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const logData = {
        project_id: projectId,
        user_id: user.id,
        entry_type: 'note',
        title: title.trim() || null,
        content: content.trim(),
        attachments,
        is_important: isImportant,
        is_pinned: isPinned,
        log_date: new Date().toISOString().split('T')[0]
      };

      if (editingLog) {
        const { error } = await supabase
          .from('project_logs')
          .update({
            title: logData.title,
            content: logData.content,
            attachments: logData.attachments,
            is_important: logData.is_important,
            is_pinned: logData.is_pinned,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingLog.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_logs')
          .insert([logData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving log:', err);
      setError('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-lg)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border-color)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <Edit3 size={20} style={{ color: 'var(--sunbelt-orange)' }} />
            {editingLog ? 'Edit Note' : 'Add Note'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: 'var(--space-lg)',
          overflow: 'auto',
          flex: 1
        }}>
          {error && (
            <div style={{
              padding: 'var(--space-sm)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              fontSize: '0.875rem',
              marginBottom: 'var(--space-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '6px'
            }}>
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for this note..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem'
              }}
            />
          </div>

          {/* Content */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '6px'
            }}>
              Note Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                resize: 'vertical',
                lineHeight: 1.5
              }}
            />
          </div>

          {/* Attachments */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '6px'
            }}>
              Attachments
            </label>

            {/* Existing Attachments */}
            {attachments.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-sm)',
                marginBottom: 'var(--space-sm)'
              }}>
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem'
                    }}
                  >
                    {getFileIcon(att.file_type)}
                    <span style={{
                      maxWidth: '150px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--text-primary)'
                    }}>
                      {att.file_name}
                    </span>
                    <button
                      onClick={() => handleRemoveAttachment(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-primary)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: '500',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1
            }}>
              {uploading ? (
                <>
                  <Loader size={16} className="spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Add Files or Photos
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Options */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-lg)',
            flexWrap: 'wrap'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--sunbelt-orange)'
                }}
              />
              <Pin size={14} style={{ color: isPinned ? 'var(--sunbelt-orange)' : 'var(--text-tertiary)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Pin to top
              </span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--warning)'
                }}
              />
              <Star size={14} style={{ color: isImportant ? 'var(--warning)' : 'var(--text-tertiary)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Mark as important
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--space-sm)',
          padding: 'var(--space-lg)',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            style={{
              padding: '10px 20px',
              background: saving || !content.trim()
                ? 'var(--bg-tertiary)'
                : 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              fontWeight: '600',
              cursor: saving || !content.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {saving && <Loader size={16} className="spin" />}
            {editingLog ? 'Save Changes' : 'Add Note'}
          </button>
        </div>
      </div>

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

export default ProjectLog;
