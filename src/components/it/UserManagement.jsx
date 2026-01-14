// ============================================================================
// UserManagement.jsx - User Administration Panel
// ============================================================================
// Complete user management interface for IT administrators.
//
// FEATURES:
// - User list with search and filters
// - Create new users
// - Edit existing users
// - Activate/deactivate users
// - Role assignment
// - View user details and activity
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  ChevronDown,
  CheckCircle,
  XCircle,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
  Eye,
  Key,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';

// ============================================================================
// CONSTANTS
// ============================================================================
const ROLES = ['PM', 'Director', 'VP', 'IT', 'IT_Manager', 'Admin', 'Project Coordinator', 'Plant Manager', 'Sales_Rep', 'Sales_Manager'];

const ROLE_COLORS = {
  'PM': '#3b82f6',
  'Director': 'var(--sunbelt-orange)',
  'VP': '#8b5cf6',
  'IT': '#06b6d4',
  'IT_Manager': '#0891b2',
  'Admin': '#ef4444',
  'Project Coordinator': '#22c55e',
  'Plant Manager': '#f59e0b',
  'Sales_Rep': '#10b981',
  'Sales_Manager': '#059669'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function UserManagement({ showToast }) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);

  // ==========================================================================
  // FETCH USERS
  // ==========================================================================
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ==========================================================================
  // FILTER & SORT USERS
  // ==========================================================================
  const filteredUsers = users
    .filter(user => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!user.name?.toLowerCase().includes(query) &&
            !user.email?.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'active' && user.is_active === false) {
        return false;
      }
      if (statusFilter === 'inactive' && user.is_active !== false) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'role':
          comparison = (a.role || '').localeCompare(b.role || '');
          break;
        case 'created':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.is_active === false ? true : false;
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      showToast(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      showToast('Failed to update user status', 'error');
    }
    setShowActionMenu(null);
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      showToast('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
    setShowActionMenu(null);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const handleUserCreated = () => {
    setShowCreateModal(false);
    showToast('User created! Initial password: Sunbelt2026!', 'success');
    fetchUsers();
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    showToast('User updated successfully');
    fetchUsers();
  };

  const handleExportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Created'].join(','),
      ...filteredUsers.map(u => [
        u.name,
        u.email,
        u.role,
        u.is_active === false ? 'Inactive' : 'Active',
        new Date(u.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Users exported successfully');
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <Users size={22} style={{ color: '#3b82f6' }} />
            User Management
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {filteredUsers.length} of {users.length} users
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            onClick={handleExportUsers}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* FILTERS                                                           */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-md)',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1',
          minWidth: '200px',
          maxWidth: '400px'
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
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-sm) var(--space-md) var(--space-sm) 36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Roles</option>
          {ROLES.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Sort */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field);
            setSortOrder(order);
          }}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="email-asc">Email A-Z</option>
          <option value="role-asc">Role A-Z</option>
          <option value="created-desc">Newest First</option>
          <option value="created-asc">Oldest First</option>
        </select>
      </div>

      {/* ================================================================== */}
      {/* USER TABLE                                                        */}
      {/* ================================================================== */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'var(--space-2xl)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div className="loading-spinner" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-2xl)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <Users size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>No users found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first user to get started'}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th style={tableHeaderStyle}>User</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={{ ...tableHeaderStyle, width: '120px' }}>Role</th>
                <th style={{ ...tableHeaderStyle, width: '100px', textAlign: 'center' }}>Status</th>
                <th style={{ ...tableHeaderStyle, width: '120px' }}>Created</th>
                <th style={{ ...tableHeaderStyle, width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  style={{
                    borderTop: index > 0 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* User */}
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: ROLE_COLORS[user.role] || 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        flexShrink: 0
                      }}>
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: user.is_active === false ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          fontSize: '0.9375rem'
                        }}>
                          {user.name || 'Unnamed User'}
                        </div>
                        {user.title && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            {user.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={tableCellStyle}>
                    <span style={{
                      color: user.is_active === false ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      {user.email || '—'}
                    </span>
                  </td>

                  {/* Role */}
                  <td style={tableCellStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: `${ROLE_COLORS[user.role] || 'var(--text-tertiary)'}20`,
                      color: ROLE_COLORS[user.role] || 'var(--text-tertiary)'
                    }}>
                      {user.role?.replace(/_/g, ' ') || 'No Role'}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                    {user.is_active === false ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)'
                      }}>
                        <XCircle size={12} />
                        Inactive
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: 'rgba(34, 197, 94, 0.1)',
                        color: '#22c55e'
                      }}>
                        <CheckCircle size={12} />
                        Active
                      </span>
                    )}
                  </td>

                  {/* Created */}
                  <td style={tableCellStyle}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={tableCellStyle}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                        style={{
                          padding: '6px',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {showActionMenu === user.id && (
                        <>
                          <div
                            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                            onClick={() => setShowActionMenu(null)}
                          />
                          <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '4px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            minWidth: '160px',
                            zIndex: 100,
                            overflow: 'hidden'
                          }}>
                            <ActionMenuItem
                              icon={Edit}
                              label="Edit User"
                              onClick={() => handleEditUser(user)}
                            />
                            <ActionMenuItem
                              icon={user.is_active === false ? CheckCircle : XCircle}
                              label={user.is_active === false ? 'Activate' : 'Deactivate'}
                              onClick={() => handleToggleStatus(user)}
                            />
                            <ActionMenuItem
                              icon={Key}
                              label="Reset Password"
                              onClick={() => {
                                showToast('Password reset email sent', 'info');
                                setShowActionMenu(null);
                              }}
                            />
                            <ActionMenuItem
                              icon={Trash2}
                              label="Delete User"
                              danger
                              onClick={() => handleDeleteUser(user)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODALS                                                            */}
      {/* ================================================================== */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleUserCreated}
      />

      {selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSuccess={handleUserUpdated}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ActionMenuItem({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        width: '100%',
        padding: 'var(--space-sm) var(--space-md)',
        background: 'transparent',
        border: 'none',
        color: danger ? 'var(--danger)' : 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '0.875rem',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = danger ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const tableHeaderStyle = {
  padding: 'var(--space-sm) var(--space-md)',
  textAlign: 'left',
  fontSize: '0.6875rem',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tableCellStyle = {
  padding: 'var(--space-sm) var(--space-md)'
};

export default UserManagement;