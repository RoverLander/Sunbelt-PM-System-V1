// ============================================================================
// SessionManager.jsx
// ============================================================================
// IT tool for viewing and managing user sessions.
//
// Features:
// - View all active sessions
// - See user, device, location info
// - Force logout users
// - Session history
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Loader2,
  User,
  Activity,
  X
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const REFRESH_INTERVAL = 30000; // 30 seconds

// ============================================================================
// HELPERS
// ============================================================================
const getDeviceIcon = (deviceInfo) => {
  if (!deviceInfo) return Monitor;
  const device = (deviceInfo.device || '').toLowerCase();
  if (device.includes('mobile') || device.includes('phone')) return Smartphone;
  if (device.includes('tablet') || device.includes('ipad')) return Tablet;
  return Monitor;
};

const formatDuration = (startDate) => {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now - start;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffMins}m`;
};

const getActivityStatus = (lastActive) => {
  if (!lastActive) return { status: 'unknown', color: '#64748b' };
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const diffMins = Math.floor((now - lastActiveDate) / 60000);

  if (diffMins < 5) return { status: 'Active', color: '#22c55e' };
  if (diffMins < 15) return { status: 'Idle', color: '#f59e0b' };
  if (diffMins < 60) return { status: 'Away', color: '#f97316' };
  return { status: 'Inactive', color: '#ef4444' };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SessionManager() {
  const { user } = useAuth();

  // State
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showConfirmLogout, setShowConfirmLogout] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    idle: 0,
    byRole: {}
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const fetchSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          user:user_id(id, name, email, role, factory)
        `)
        .eq('is_active', true)
        .order('last_active_at', { ascending: false });

      if (error) throw error;

      const sessionsData = data || [];
      setSessions(sessionsData);

      // Calculate stats
      const roleCount = {};
      let activeCount = 0;
      let idleCount = 0;

      sessionsData.forEach(s => {
        const role = s.user?.role || 'Unknown';
        roleCount[role] = (roleCount[role] || 0) + 1;

        const activity = getActivityStatus(s.last_active_at);
        if (activity.status === 'Active') activeCount++;
        else if (activity.status === 'Idle') idleCount++;
      });

      setStats({
        total: sessionsData.length,
        active: activeCount,
        idle: idleCount,
        byRole: roleCount
      });

    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();

    // Auto-refresh
    const interval = setInterval(fetchSessions, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleForceLogout = async (sessionId) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          ended_reason: 'forced'
        })
        .eq('id', sessionId);

      if (error) throw error;

      setShowConfirmLogout(null);
      fetchSessions();
    } catch (error) {
      console.error('Error forcing logout:', error);
      alert('Failed to force logout');
    }
  };

  const handleLogoutAll = async (userId) => {
    if (!window.confirm('Are you sure you want to log out all sessions for this user?')) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          ended_reason: 'forced'
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      fetchSessions();
    } catch (error) {
      console.error('Error forcing logout all:', error);
    }
  };

  // ============================================================================
  // FILTERING
  // ============================================================================
  const filteredSessions = sessions.filter(session => {
    const matchesSearch =
      session.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.ip_address?.includes(searchQuery);

    const matchesRole = roleFilter === 'all' || session.user?.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Get unique roles for filter
  const uniqueRoles = [...new Set(sessions.map(s => s.user?.role).filter(Boolean))];

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
            Session Manager
          </h2>
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
            margin: '6px 0 0'
          }}>
            Monitor active user sessions and manage access
          </p>
        </div>
        <button
          onClick={fetchSessions}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          minWidth: '120px'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '2px', textTransform: 'uppercase' }}>
            Total
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.total}
          </div>
        </div>
        <div style={{
          padding: '12px 20px',
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          minWidth: '120px'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#22c55e', marginBottom: '2px', textTransform: 'uppercase' }}>
            Active
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22c55e' }}>
            {stats.active}
          </div>
        </div>
        <div style={{
          padding: '12px 20px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          minWidth: '120px'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginBottom: '2px', textTransform: 'uppercase' }}>
            Idle
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b' }}>
            {stats.idle}
          </div>
        </div>
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
            placeholder="Search users or IP..."
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

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
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
          <option value="all">All Roles</option>
          {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>Loading sessions...</div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: 'var(--bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}>
          <Users size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '4px' }}>
            No active sessions found
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Sessions will appear here when users log in
          </div>
        </div>
      ) : (
        /* Sessions List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSessions.map(session => {
            const DeviceIcon = getDeviceIcon(session.device_info);
            const activity = getActivityStatus(session.last_active_at);

            return (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/* Activity Indicator */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: activity.color,
                  flexShrink: 0
                }} />

                {/* User Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}>
                      {session.user?.name || 'Unknown User'}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)'
                    }}>
                      {session.user?.role || 'Unknown'}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      background: `${activity.color}20`,
                      color: activity.color
                    }}>
                      {activity.status}
                    </span>
                  </div>
                  <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem'
                  }}>
                    {session.user?.email}
                    {session.user?.factory && (
                      <span style={{ color: 'var(--text-tertiary)' }}> - {session.user.factory}</span>
                    )}
                  </div>
                </div>

                {/* Device Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.8rem'
                }}>
                  <DeviceIcon size={16} />
                  <span>{session.device_info?.browser || 'Unknown'}</span>
                </div>

                {/* IP Address */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.8rem',
                  minWidth: '120px'
                }}>
                  <Globe size={14} />
                  <span>{session.ip_address || 'Unknown'}</span>
                </div>

                {/* Duration */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.8rem',
                  minWidth: '80px'
                }}>
                  <Clock size={14} />
                  <span>{formatDuration(session.started_at)}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setShowConfirmLogout(session)}
                    title="Force logout"
                    disabled={session.user_id === user?.id}
                    style={{
                      padding: '8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: session.user_id === user?.id ? 'var(--text-tertiary)' : '#ef4444',
                      cursor: session.user_id === user?.id ? 'not-allowed' : 'pointer',
                      opacity: session.user_id === user?.id ? 0.5 : 1
                    }}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Logout Modal */}
      {showConfirmLogout && (
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
          onClick={() => setShowConfirmLogout(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '400px',
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                Force Logout
              </h3>
              <button
                onClick={() => setShowConfirmLogout(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                <div>
                  <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '0.9rem' }}>
                    End Session
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    This will immediately log out {showConfirmLogout.user?.name || 'this user'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowConfirmLogout(null)}
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
                  onClick={() => handleForceLogout(showConfirmLogout.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={16} />
                  Force Logout
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

export default SessionManager;
