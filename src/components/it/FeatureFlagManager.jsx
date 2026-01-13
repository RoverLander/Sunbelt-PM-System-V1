// ============================================================================
// FeatureFlagManager.jsx
// ============================================================================
// IT tool for managing runtime feature flags.
//
// Features:
// - Toggle features on/off
// - View flag details and targeting
// - See audit history
// - Create new flags
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Flag,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  History,
  Users,
  Factory,
  Filter,
  CheckCircle,
  XCircle,
  Calendar,
  Percent,
  Link,
  Globe,
  User
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const CATEGORIES = [
  { value: 'feature', label: 'Feature', color: '#3b82f6' },
  { value: 'ui', label: 'UI', color: '#8b5cf6' },
  { value: 'experimental', label: 'Experimental', color: '#f59e0b' },
  { value: 'maintenance', label: 'Maintenance', color: '#ef4444' },
  { value: 'general', label: 'General', color: '#64748b' }
];

const ROLES = ['PM', 'Director', 'VP', 'IT', 'IT_Manager', 'Admin', 'Project Coordinator', 'Plant Manager', 'Sales_Rep', 'Sales_Manager'];
const FACTORIES = ['NWBS', 'WM-EAST', 'WM-WEST', 'MM', 'SSI', 'MS', 'MG', 'SEMO', 'PMI', 'AMTEX', 'BRIT', 'CB', 'IND', 'MRS'];
const ENVIRONMENTS = [
  { value: 'all', label: 'All Environments' },
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function FeatureFlagManager() {
  const { user } = useAuth();

  // State
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAudit, setShowAudit] = useState(null);
  const [auditLog, setAuditLog] = useState([]);

  // Users for targeting
  const [allUsers, setAllUsers] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    is_enabled: false,
    category: 'feature',
    enabled_roles: [],
    enabled_factories: [],
    enabled_users: [],
    enable_at: '',
    disable_at: '',
    rollout_percentage: '',
    depends_on_flag: '',
    environment: 'all'
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  useEffect(() => {
    fetchFlags();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select(`
          *,
          creator:created_by(name),
          toggler:last_toggled_by(name)
        `)
        .order('category')
        .order('name');

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLog = async (flagId) => {
    try {
      const { data, error } = await supabase
        .from('feature_flag_audit')
        .select(`
          *,
          changer:changed_by(name)
        `)
        .eq('flag_id', flagId)
        .order('changed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAuditLog(data || []);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleToggle = async (flag) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({
          is_enabled: !flag.is_enabled,
          last_toggled_at: new Date().toISOString(),
          last_toggled_by: user?.id
        })
        .eq('id', flag.id);

      if (error) throw error;
      fetchFlags();
    } catch (error) {
      console.error('Error toggling flag:', error);
    }
  };

  const handleOpenCreate = () => {
    setEditingFlag(null);
    setFormData({
      key: '',
      name: '',
      description: '',
      is_enabled: false,
      category: 'feature',
      enabled_roles: [],
      enabled_factories: [],
      enabled_users: [],
      enable_at: '',
      disable_at: '',
      rollout_percentage: '',
      depends_on_flag: '',
      environment: 'all'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (flag) => {
    setEditingFlag(flag);
    setFormData({
      key: flag.key || '',
      name: flag.name || '',
      description: flag.description || '',
      is_enabled: flag.is_enabled ?? false,
      category: flag.category || 'feature',
      enabled_roles: flag.enabled_roles || [],
      enabled_factories: flag.enabled_factories || [],
      enabled_users: flag.enabled_users || [],
      enable_at: flag.enable_at ? flag.enable_at.slice(0, 16) : '',
      disable_at: flag.disable_at ? flag.disable_at.slice(0, 16) : '',
      rollout_percentage: flag.rollout_percentage ?? '',
      depends_on_flag: flag.depends_on_flag || '',
      environment: flag.environment || 'all'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.key.trim() || !formData.name.trim()) {
      alert('Key and name are required');
      return;
    }

    // Validate key format (lowercase, underscores only)
    const keyPattern = /^[a-z][a-z0-9_]*$/;
    if (!keyPattern.test(formData.key)) {
      alert('Key must be lowercase letters, numbers, and underscores only');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        key: formData.key.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_enabled: formData.is_enabled,
        category: formData.category,
        enabled_roles: formData.enabled_roles.length > 0 ? formData.enabled_roles : null,
        enabled_factories: formData.enabled_factories.length > 0 ? formData.enabled_factories : null,
        enabled_users: formData.enabled_users.length > 0 ? formData.enabled_users : null,
        enable_at: formData.enable_at ? new Date(formData.enable_at).toISOString() : null,
        disable_at: formData.disable_at ? new Date(formData.disable_at).toISOString() : null,
        rollout_percentage: formData.rollout_percentage !== '' ? parseInt(formData.rollout_percentage, 10) : null,
        depends_on_flag: formData.depends_on_flag || null,
        environment: formData.environment,
        last_toggled_by: user?.id
      };

      if (editingFlag) {
        const { error } = await supabase
          .from('feature_flags')
          .update(payload)
          .eq('id', editingFlag.id);

        if (error) throw error;
      } else {
        payload.created_by = user?.id;
        const { error } = await supabase
          .from('feature_flags')
          .insert([payload]);

        if (error) throw error;
      }

      setShowModal(false);
      fetchFlags();
    } catch (error) {
      console.error('Error saving flag:', error);
      alert('Failed to save feature flag');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feature flag?')) return;

    try {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFlags();
    } catch (error) {
      console.error('Error deleting flag:', error);
    }
  };

  const handleShowAudit = (flag) => {
    setShowAudit(flag);
    fetchAuditLog(flag.id);
  };

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  // ============================================================================
  // FILTERING
  // ============================================================================
  const filteredFlags = flags.filter(flag => {
    const matchesSearch =
      flag.key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || flag.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedFlags = filteredFlags.reduce((acc, flag) => {
    const cat = flag.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(flag);
    return acc;
  }, {});

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
            Feature Flags
          </h2>
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
            margin: '6px 0 0'
          }}>
            Toggle features on/off without deploying code
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
          New Flag
        </button>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid var(--border-color)',
          flex: '1',
          minWidth: '200px',
          maxWidth: '400px'
        }}>
          <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              width: '100%'
            }}
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>Loading feature flags...</div>
        </div>
      ) : Object.keys(groupedFlags).length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: 'var(--bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}>
          <Flag size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '4px' }}>
            No feature flags found
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Create a feature flag to toggle functionality at runtime
          </div>
        </div>
      ) : (
        /* Flags List by Category */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {CATEGORIES.filter(c => groupedFlags[c.value]).map(category => (
            <div key={category.value}>
              {/* Category Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: category.color
                }} />
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {category.label}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-tertiary)',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {groupedFlags[category.value].length}
                </span>
              </div>

              {/* Flags in Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupedFlags[category.value].map(flag => (
                  <div
                    key={flag.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px 20px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(flag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex'
                      }}
                      title={flag.is_enabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {flag.is_enabled ? (
                        <ToggleRight size={32} style={{ color: '#22c55e' }} />
                      ) : (
                        <ToggleLeft size={32} style={{ color: '#64748b' }} />
                      )}
                    </button>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem'
                        }}>
                          {flag.name}
                        </span>
                        <code style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-tertiary)',
                          background: 'var(--bg-tertiary)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {flag.key}
                        </code>
                      </div>
                      {flag.description && (
                        <div style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.85rem'
                        }}>
                          {flag.description}
                        </div>
                      )}
                      {(flag.enabled_roles?.length > 0 || flag.enabled_factories?.length > 0 || flag.enabled_users?.length > 0 || flag.rollout_percentage || flag.enable_at || flag.disable_at || flag.depends_on_flag || (flag.environment && flag.environment !== 'all')) && (
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          marginTop: '6px',
                          fontSize: '0.75rem',
                          color: 'var(--text-tertiary)',
                          flexWrap: 'wrap'
                        }}>
                          {flag.enabled_roles?.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={12} />
                              {flag.enabled_roles.length} roles
                            </span>
                          )}
                          {flag.enabled_factories?.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Factory size={12} />
                              {flag.enabled_factories.length} factories
                            </span>
                          )}
                          {flag.enabled_users?.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} />
                              {flag.enabled_users.length} users
                            </span>
                          )}
                          {flag.rollout_percentage && flag.rollout_percentage < 100 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Percent size={12} />
                              {flag.rollout_percentage}% rollout
                            </span>
                          )}
                          {(flag.enable_at || flag.disable_at) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              Scheduled
                            </span>
                          )}
                          {flag.depends_on_flag && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Link size={12} />
                              Has dependency
                            </span>
                          )}
                          {flag.environment && flag.environment !== 'all' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Globe size={12} />
                              {flag.environment}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleShowAudit(flag)}
                        title="View history"
                        style={{
                          padding: '6px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <History size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(flag)}
                        title="Edit"
                        style={{
                          padding: '6px',
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
                        onClick={() => handleDelete(flag.id)}
                        title="Delete"
                        style={{
                          padding: '6px',
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
                ))}
              </div>
            </div>
          ))}
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
              maxWidth: '550px',
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {editingFlag ? 'Edit Feature Flag' : 'New Feature Flag'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Key */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Key * <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(lowercase, underscores)</span>
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="feature_key"
                  disabled={!!editingFlag}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: editingFlag ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Feature Name"
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

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this flag control?"
                  rows={2}
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

              {/* Category */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Category
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setFormData({ ...formData, category: cat.value })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: formData.category === cat.value ? `${cat.color}20` : 'var(--bg-secondary)',
                        border: `1px solid ${formData.category === cat.value ? cat.color : 'var(--border-color)'}`,
                        borderRadius: '6px',
                        color: formData.category === cat.value ? cat.color : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Roles */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Users size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Limit to Roles <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(leave empty for all)</span>
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => setFormData({ ...formData, enabled_roles: toggleArrayItem(formData.enabled_roles, role) })}
                      style={{
                        padding: '4px 10px',
                        background: formData.enabled_roles.includes(role) ? 'var(--sunbelt-orange)' : 'var(--bg-secondary)',
                        border: `1px solid ${formData.enabled_roles.includes(role) ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                        borderRadius: '4px',
                        color: formData.enabled_roles.includes(role) ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Factories */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Factory size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Limit to Factories <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(leave empty for all)</span>
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {FACTORIES.map(factory => (
                    <button
                      key={factory}
                      onClick={() => setFormData({ ...formData, enabled_factories: toggleArrayItem(formData.enabled_factories, factory) })}
                      style={{
                        padding: '4px 10px',
                        background: formData.enabled_factories.includes(factory) ? 'var(--sunbelt-orange)' : 'var(--bg-secondary)',
                        border: `1px solid ${formData.enabled_factories.includes(factory) ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                        borderRadius: '4px',
                        color: formData.enabled_factories.includes(factory) ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      {factory}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Users */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Limit to Specific Users <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(leave empty for all)</span>
                </label>
                <select
                  multiple
                  value={formData.enabled_users}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, enabled_users: selected });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    minHeight: '100px'
                  }}
                >
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                {formData.enabled_users.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {formData.enabled_users.length} user(s) selected
                  </div>
                )}
              </div>

              {/* Environment */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Globe size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Environment
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ENVIRONMENTS.map(env => (
                    <button
                      key={env.value}
                      onClick={() => setFormData({ ...formData, environment: env.value })}
                      style={{
                        padding: '6px 12px',
                        background: formData.environment === env.value ? 'var(--sunbelt-orange)' : 'var(--bg-secondary)',
                        border: `1px solid ${formData.environment === env.value ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                        borderRadius: '6px',
                        color: formData.environment === env.value ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {env.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Schedule <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(optional auto-enable/disable)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                      Enable At
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.enable_at}
                      onChange={(e) => setFormData({ ...formData, enable_at: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                      Disable At
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.disable_at}
                      onChange={(e) => setFormData({ ...formData, disable_at: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Percentage Rollout */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Percent size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Percentage Rollout <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(leave empty for 100%)</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.rollout_percentage}
                    onChange={(e) => setFormData({ ...formData, rollout_percentage: e.target.value })}
                    placeholder="100"
                    style={{
                      width: '100px',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>% of users</span>
                </div>
                {formData.rollout_percentage && formData.rollout_percentage !== '100' && (
                  <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Flag will be enabled for {formData.rollout_percentage}% of users (deterministic based on user ID)
                  </div>
                )}
              </div>

              {/* Dependencies */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Link size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Depends On <span style={{ fontWeight: '400', color: 'var(--text-tertiary)' }}>(only active if parent flag is enabled)</span>
                </label>
                <select
                  value={formData.depends_on_flag}
                  onChange={(e) => setFormData({ ...formData, depends_on_flag: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">No dependency</option>
                  {flags.filter(f => f.id !== editingFlag?.id).map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial State */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--sunbelt-orange)' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Enable immediately</span>
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
                  {saving ? 'Saving...' : 'Save Flag'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAudit && (
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
          onClick={() => setShowAudit(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                  Change History
                </h3>
                <code style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{showAudit.key}</code>
              </div>
              <button
                onClick={() => setShowAudit(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '16px 24px' }}>
              {auditLog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
                  No history found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {auditLog.map(entry => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px'
                      }}
                    >
                      {entry.action === 'enabled' ? (
                        <CheckCircle size={20} style={{ color: '#22c55e' }} />
                      ) : entry.action === 'disabled' ? (
                        <XCircle size={20} style={{ color: '#ef4444' }} />
                      ) : (
                        <History size={20} style={{ color: '#64748b' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          <span style={{ textTransform: 'capitalize' }}>{entry.action}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {entry.changer?.name || 'System'} - {new Date(entry.changed_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

export default FeatureFlagManager;
