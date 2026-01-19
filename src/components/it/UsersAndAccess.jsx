// ============================================================================
// UsersAndAccess.jsx - Merged Users & Access Tab
// ============================================================================
// Combines User Management, Active Sessions, Role Analytics, and Access Logs
// into a single tabbed interface for comprehensive user administration.
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Activity,
  Shield,
  Clock,
  LogIn,
  LogOut,
  UserPlus,
  PieChart,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  MoreVertical,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import UserManagement from './UserManagement';
import SessionManager from './SessionManager';
import { ITSubTabs } from './widgets';
import * as itService from '../../services/itService';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function UsersAndAccess({ showToast }) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('users');
  const [loading, setLoading] = useState(true);

  // Analytics data
  const [userAnalytics, setUserAnalytics] = useState({
    roleDistribution: [],
    userGrowth: [],
    inactiveUsers: []
  });

  // Access logs
  const [accessLogs, setAccessLogs] = useState([]);
  const [logsFilter, setLogsFilter] = useState('all'); // all, login, logout, failed
  const [logsSearchTerm, setLogsSearchTerm] = useState('');

  // Sub-tabs configuration
  const subTabs = [
    { id: 'users', label: 'All Users', icon: Users },
    { id: 'sessions', label: 'Active Sessions', icon: Activity },
    { id: 'analytics', label: 'Role Analytics', icon: PieChart },
    { id: 'access', label: 'Access Logs', icon: Clock }
  ];

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await itService.getUserAnalytics();
      setUserAnalytics(data);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccessLogs = useCallback(async () => {
    try {
      // Try to fetch from login_activity table (if it exists)
      const { data, error } = await supabase
        .from('login_activity')
        .select(`
          id,
          user_id,
          action,
          ip_address,
          user_agent,
          created_at,
          users!login_activity_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        // Fall back to simulated data if table doesn't exist
        console.log('login_activity table not available, using simulated data');
        setAccessLogs(generateSimulatedAccessLogs());
      } else {
        setAccessLogs(data || []);
      }
    } catch (error) {
      console.error('Error fetching access logs:', error);
      setAccessLogs(generateSimulatedAccessLogs());
    }
  }, []);

  // Generate simulated access logs for demo
  const generateSimulatedAccessLogs = () => {
    const actions = ['login', 'logout', 'failed_login', 'session_timeout'];
    const users = [
      { name: 'John Smith', email: 'jsmith@sunbelt.com' },
      { name: 'Sarah Johnson', email: 'sjohnson@sunbelt.com' },
      { name: 'Mike Williams', email: 'mwilliams@sunbelt.com' },
      { name: 'Lisa Brown', email: 'lbrown@sunbelt.com' },
      { name: 'David Miller', email: 'dmiller@sunbelt.com' }
    ];

    return Array.from({ length: 50 }, (_, i) => ({
      id: `log-${i}`,
      user_id: `user-${i % 5}`,
      action: actions[Math.floor(Math.random() * 4)],
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      users: users[i % 5]
    }));
  };

  useEffect(() => {
    if (activeSubTab === 'analytics') {
      fetchAnalytics();
    } else if (activeSubTab === 'access') {
      fetchAccessLogs();
    }
  }, [activeSubTab, fetchAnalytics, fetchAccessLogs]);

  // ==========================================================================
  // FILTERED LOGS
  // ==========================================================================
  const filteredLogs = useMemo(() => {
    let logs = [...accessLogs];

    if (logsFilter !== 'all') {
      logs = logs.filter(log => log.action === logsFilter);
    }

    if (logsSearchTerm) {
      const term = logsSearchTerm.toLowerCase();
      logs = logs.filter(log =>
        log.users?.name?.toLowerCase().includes(term) ||
        log.users?.email?.toLowerCase().includes(term) ||
        log.ip_address?.includes(term)
      );
    }

    return logs;
  }, [accessLogs, logsFilter, logsSearchTerm]);

  // ==========================================================================
  // RENDER CONTENT
  // ==========================================================================
  const renderContent = () => {
    switch (activeSubTab) {
      case 'users':
        return <UserManagement showToast={showToast} />;
      case 'sessions':
        return <SessionManager showToast={showToast} />;
      case 'analytics':
        return renderRoleAnalytics();
      case 'access':
        return renderAccessLogs();
      default:
        return null;
    }
  };

  // ==========================================================================
  // RENDER ROLE ANALYTICS
  // ==========================================================================
  const renderRoleAnalytics = () => {
    const { roleDistribution, userGrowth, inactiveUsers } = userAnalytics;

    // Calculate role distribution for pie chart
    const totalUsers = roleDistribution.reduce((sum, r) => sum + r.count, 0);

    // Role colors
    const roleColors = {
      admin: '#ef4444',
      it: '#3b82f6',
      director: '#8b5cf6',
      vp: '#f59e0b',
      pm: '#22c55e',
      pc: '#06b6d4',
      sales_manager: '#ec4899',
      sales_rep: '#f97316',
      plant_manager: '#14b8a6',
      qc_manager: '#6366f1',
      default: '#64748b'
    };

    return (
      <div>
        {/* Role Distribution & User Growth */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-lg)'
        }}>
          {/* Role Distribution */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '20px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <PieChart size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              Role Distribution
            </h3>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              {/* Simple SVG Pie Chart */}
              <svg width="150" height="150" viewBox="0 0 150 150">
                {roleDistribution.length > 0 ? (
                  (() => {
                    let currentAngle = 0;
                    return roleDistribution.map((role, idx) => {
                      const percentage = totalUsers > 0 ? role.count / totalUsers : 0;
                      const angle = percentage * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;

                      const x1 = 75 + 60 * Math.cos((startAngle - 90) * Math.PI / 180);
                      const y1 = 75 + 60 * Math.sin((startAngle - 90) * Math.PI / 180);
                      const x2 = 75 + 60 * Math.cos((endAngle - 90) * Math.PI / 180);
                      const y2 = 75 + 60 * Math.sin((endAngle - 90) * Math.PI / 180);

                      const largeArcFlag = angle > 180 ? 1 : 0;

                      currentAngle += angle;

                      if (percentage === 0) return null;

                      const path = percentage === 1
                        ? `M 75 15 A 60 60 0 1 1 74.99 15 Z`
                        : `M 75 75 L ${x1} ${y1} A 60 60 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                      return (
                        <path
                          key={role.role}
                          d={path}
                          fill={roleColors[role.role] || roleColors.default}
                          stroke="var(--bg-secondary)"
                          strokeWidth="2"
                        />
                      );
                    });
                  })()
                ) : (
                  <circle cx="75" cy="75" r="60" fill="var(--bg-tertiary)" />
                )}
                <circle cx="75" cy="75" r="35" fill="var(--bg-secondary)" />
                <text x="75" y="70" textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="700">
                  {totalUsers}
                </text>
                <text x="75" y="88" textAnchor="middle" fill="var(--text-tertiary)" fontSize="11">
                  total users
                </text>
              </svg>

              {/* Legend */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {roleDistribution.map(role => (
                  <div key={role.role} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8125rem'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: roleColors[role.role] || roleColors.default
                    }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1, textTransform: 'capitalize' }}>
                      {role.role.replace(/_/g, ' ')}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {role.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Growth */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '20px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TrendingUp size={18} style={{ color: '#22c55e' }} />
              User Growth (Last 6 Months)
            </h3>

            {/* Simple bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
              {userGrowth.length > 0 ? userGrowth.map((month, idx) => {
                const maxCount = Math.max(...userGrowth.map(m => m.count), 1);
                const height = (month.count / maxCount) * 100;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '100%',
                      height: `${height}px`,
                      background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: '4px'
                    }} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                      {month.month}
                    </span>
                  </div>
                );
              }) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                  No growth data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inactive Users */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ color: '#f59e0b' }} />
              Inactive Users (&gt;90 Days)
            </span>
            <span style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: inactiveUsers.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              color: inactiveUsers.length > 0 ? '#f59e0b' : '#22c55e'
            }}>
              {inactiveUsers.length} users
            </span>
          </h3>

          {inactiveUsers.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '0.875rem'
            }}>
              <CheckCircle size={24} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <div>All users are active</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {inactiveUsers.slice(0, 10).map(user => (
                <div key={user.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)'
                  }}>
                    {user.name?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {user.email}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Last active
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#f59e0b', fontWeight: '500' }}>
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================================================
  // RENDER ACCESS LOGS
  // ==========================================================================
  const renderAccessLogs = () => {
    const getActionIcon = (action) => {
      switch (action) {
        case 'login': return LogIn;
        case 'logout': return LogOut;
        case 'failed_login': return XCircle;
        case 'session_timeout': return Clock;
        default: return Activity;
      }
    };

    const getActionColor = (action) => {
      switch (action) {
        case 'login': return '#22c55e';
        case 'logout': return '#3b82f6';
        case 'failed_login': return '#ef4444';
        case 'session_timeout': return '#f59e0b';
        default: return 'var(--text-secondary)';
      }
    };

    return (
      <div>
        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: 'var(--space-lg)'
        }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            flex: 1,
            maxWidth: '300px'
          }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search users or IPs..."
              value={logsSearchTerm}
              onChange={(e) => setLogsSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter buttons */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'login', label: 'Logins' },
              { id: 'logout', label: 'Logouts' },
              { id: 'failed_login', label: 'Failed' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setLogsFilter(filter.id)}
                style={{
                  padding: '6px 12px',
                  background: logsFilter === filter.id ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: logsFilter === filter.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: logsFilter === filter.id ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchAccessLogs}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8125rem'
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          {/* Export */}
          <button
            onClick={() => showToast('Exporting access logs...', 'info')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: '500'
            }}
          >
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Logs Table */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px 150px 180px',
            padding: '12px 16px',
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div>User</div>
            <div>Action</div>
            <div>IP Address</div>
            <div>Timestamp</div>
          </div>

          {/* Table Body */}
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredLogs.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem'
              }}>
                No access logs found
              </div>
            ) : (
              filteredLogs.map(log => {
                const Icon = getActionIcon(log.action);
                const color = getActionColor(log.action);

                return (
                  <div key={log.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 150px 180px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    alignItems: 'center',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* User */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)'
                      }}>
                        {log.users?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {log.users?.name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {log.users?.email || ''}
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={12} style={{ color }} />
                      </div>
                      <span style={{
                        fontSize: '0.8125rem',
                        color,
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* IP Address */}
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace'
                    }}>
                      {log.ip_address || '-'}
                    </div>

                    {/* Timestamp */}
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <ITSubTabs
          tabs={subTabs}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          variant="pills"
        />
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}

export default UsersAndAccess;
