// ============================================================================
// AnnouncementManager.jsx
// ============================================================================
// IT tool for creating and managing system-wide announcements.
//
// Features:
// - Create new announcements
// - Edit existing announcements
// - Set type (info, warning, critical, maintenance)
// - Target specific roles or factories
// - Set start/expiration dates
// - Toggle active status
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  Wrench,
  Calendar,
  Users,
  Factory,
  Eye,
  EyeOff,
  Save,
  Loader2
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const ANNOUNCEMENT_TYPES = [
  { value: 'info', label: 'Info', icon: Info, color: '#3b82f6' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: '#f59e0b' },
  { value: 'critical', label: 'Critical', icon: AlertCircle, color: '#ef4444' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: '#8b5cf6' }
];

const ROLES = ['PM', 'Director', 'VP', 'IT', 'IT_Manager', 'Admin', 'Project Coordinator', 'Plant Manager', 'Sales_Rep', 'Sales_Manager'];
const FACTORIES = ['NWBS', 'WM-EAST', 'WM-WEST', 'MM', 'SSI', 'MS', 'MG', 'SEMO', 'PMI', 'AMTEX', 'BRIT', 'CB', 'IND', 'MRS'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AnnouncementManager() {
  const { user } = useAuth();

  // State
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target_roles: [],
    target_factories: [],
    starts_at: '',
    expires_at: '',
    is_dismissible: true,
    is_active: true
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:created_by(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      target_roles: [],
      target_factories: [],
      starts_at: '',
      expires_at: '',
      is_dismissible: true,
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || '',
      message: announcement.message || '',
      type: announcement.type || 'info',
      target_roles: announcement.target_roles || [],
      target_factories: announcement.target_factories || [],
      starts_at: announcement.starts_at ? announcement.starts_at.split('T')[0] : '',
      expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : '',
      is_dismissible: announcement.is_dismissible ?? true,
      is_active: announcement.is_active ?? true
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Title and message are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        target_roles: formData.target_roles.length > 0 ? formData.target_roles : null,
        target_factories: formData.target_factories.length > 0 ? formData.target_factories : null,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        is_dismissible: formData.is_dismissible,
        is_active: formData.is_active
      };

      if (editingAnnouncement) {
        // Update existing
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
      } else {
        // Create new
        payload.created_by = user?.id;
        const { error } = await supabase
          .from('announcements')
          .insert([payload]);

        if (error) throw error;
      }

      setShowModal(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const handleToggleActive = async (announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !announcement.is_active })
        .eq('id', announcement.id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Announcement Manager
          </h2>
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
            margin: '6px 0 0'
          }}>
            Create and manage system-wide announcements
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'var(--sunbelt-orange)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          New Announcement
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>Loading announcements...</div>
        </div>
      ) : announcements.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: 'var(--bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}>
          <Info size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '4px' }}>
            No announcements yet
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Create your first announcement to communicate with users
          </div>
        </div>
      ) : (
        /* Announcements List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.map(announcement => {
            const typeConfig = ANNOUNCEMENT_TYPES.find(t => t.value === announcement.type) || ANNOUNCEMENT_TYPES[0];
            const Icon = typeConfig.icon;

            return (
              <div
                key={announcement.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  opacity: announcement.is_active ? 1 : 0.6
                }}
              >
                {/* Type Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${typeConfig.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={20} style={{ color: typeConfig.color }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}>
                      {announcement.title}
                    </span>
                    {!announcement.is_active && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        background: 'rgba(100, 116, 139, 0.2)',
                        color: '#64748b'
                      }}>
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    marginBottom: '6px'
                  }}>
                    {announcement.message.length > 100
                      ? announcement.message.substring(0, 100) + '...'
                      : announcement.message}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)'
                  }}>
                    <span>By {announcement.author?.name || 'Unknown'}</span>
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    {announcement.target_roles?.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} />
                        {announcement.target_roles.length} roles
                      </span>
                    )}
                    {announcement.target_factories?.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Factory size={12} />
                        {announcement.target_factories.length} factories
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleToggleActive(announcement)}
                    title={announcement.is_active ? 'Deactivate' : 'Activate'}
                    style={{
                      padding: '8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: announcement.is_active ? '#22c55e' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {announcement.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(announcement)}
                    title="Edit"
                    style={{
                      padding: '8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    title="Delete"
                    style={{
                      padding: '8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          style={{
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
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid var(--border-color)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Title */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Announcement message"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  Type
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ANNOUNCEMENT_TYPES.map(type => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: isSelected ? `${type.color}20` : 'var(--bg-secondary)',
                          border: `1px solid ${isSelected ? type.color : 'var(--border-color)'}`,
                          borderRadius: '8px',
                          color: isSelected ? type.color : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: isSelected ? '600' : '400'
                        }}
                      >
                        <Icon size={16} />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Roles */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  Target Roles <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(leave empty for all)</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ROLES.map(role => {
                    const isSelected = formData.target_roles.includes(role);
                    return (
                      <button
                        key={role}
                        onClick={() => setFormData({
                          ...formData,
                          target_roles: toggleArrayItem(formData.target_roles, role)
                        })}
                        style={{
                          padding: '6px 12px',
                          background: isSelected ? 'var(--sunbelt-orange)' : 'var(--bg-secondary)',
                          border: `1px solid ${isSelected ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                          borderRadius: '6px',
                          color: isSelected ? 'white' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Factories */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  Target Factories <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(leave empty for all)</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {FACTORIES.map(factory => {
                    const isSelected = formData.target_factories.includes(factory);
                    return (
                      <button
                        key={factory}
                        onClick={() => setFormData({
                          ...formData,
                          target_factories: toggleArrayItem(formData.target_factories, factory)
                        })}
                        style={{
                          padding: '6px 12px',
                          background: isSelected ? 'var(--sunbelt-orange)' : 'var(--bg-secondary)',
                          border: `1px solid ${isSelected ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                          borderRadius: '6px',
                          color: isSelected ? 'white' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        {factory}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Start Date <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Expiration Date <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_dismissible}
                    onChange={(e) => setFormData({ ...formData, is_dismissible: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--sunbelt-orange)' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Allow users to dismiss</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--sunbelt-orange)' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Active (visible to users)</span>
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'var(--sunbelt-orange)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                  {saving ? 'Saving...' : 'Save Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AnnouncementManager;
