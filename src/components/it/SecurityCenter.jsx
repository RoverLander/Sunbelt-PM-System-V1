// ============================================================================
// SecurityCenter.jsx - IT Security Monitoring Dashboard
// ============================================================================
// Comprehensive security monitoring for IT administrators including:
// - Security score and status
// - Privileged account management
// - Session monitoring
// - Security alerts and recommendations
// - Access control overview
//
// Created: January 10, 2026
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Key,
  Lock,
  Unlock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  Eye,
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { calculateSecurityMetrics, calculateUserAnalytics, ROLE_COLORS } from '../../utils/itAnalytics';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SecurityScoreCard({ score, status }) {
  const getScoreColor = (s) => {
    if (s >= 90) return '#22c55e';
    if (s >= 70) return '#3b82f6';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      border: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      gap: '24px'
    }}>
      {/* Circular Score */}
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke="var(--bg-tertiary)"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color }}>{score}</div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Score</div>
        </div>
      </div>

      {/* Status Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          {score >= 70 ? (
            <ShieldCheck size={24} style={{ color }} />
          ) : (
            <ShieldAlert size={24} style={{ color }} />
          )}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Security Status: {status}
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          {score >= 90 ? 'Your system security is excellent. All key metrics are within acceptable ranges.' :
           score >= 70 ? 'System security is good but there are some areas that could be improved.' :
           score >= 50 ? 'Security needs attention. Review the recommendations below.' :
           'Critical security issues detected. Immediate action recommended.'}
        </p>
      </div>
    </div>
  );
}

function AlertCard({ alert, onDismiss }) {
  const severityColors = {
    error: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: AlertCircle },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', icon: AlertTriangle },
    info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', icon: Info }
  };

  const style = severityColors[alert.severity] || severityColors.info;
  const Icon = style.icon;

  return (
    <div style={{
      background: style.bg,
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      border: `1px solid ${style.border}40`,
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start'
    }}>
      <Icon size={20} style={{ color: style.border, flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {alert.type}
          {alert.count !== null && (
            <span style={{ marginLeft: '8px', color: style.border }}>({alert.count})</span>
          )}
        </div>
        {alert.description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
            {alert.description}
          </p>
        )}
        {alert.recommendation && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>
            Recommendation: {alert.recommendation}
          </p>
        )}
      </div>
    </div>
  );
}

function PrivilegedUserCard({ user }) {
  const roleColor = ROLE_COLORS[user.role] || '#64748b';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: `${roleColor}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: roleColor,
        fontWeight: '600',
        fontSize: '0.875rem'
      }}>
        {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{user.email}</div>
      </div>
      <div style={{
        padding: '4px 10px',
        borderRadius: 'var(--radius-sm)',
        background: `${roleColor}20`,
        color: roleColor,
        fontSize: '0.75rem',
        fontWeight: '600'
      }}>
        {user.role?.replace(/_/g, ' ')}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.75rem',
        color: user.is_active !== false ? 'var(--success)' : 'var(--text-tertiary)'
      }}>
        {user.is_active !== false ? <UserCheck size={14} /> : <UserX size={14} />}
        {user.is_active !== false ? 'Active' : 'Inactive'}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function SecurityCenter() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes, tasksRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('projects').select('id, owner_id, primary_pm_id, backup_pm_id'),
        supabase.from('tasks').select('id, assignee_id, internal_owner_id, status, updated_at, completed_at')
      ]);

      setUsers(usersRes.data || []);
      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate security metrics
  const securityMetrics = useMemo(() => {
    return calculateSecurityMetrics(users, {
      authenticated: !!currentUser,
      userId: currentUser?.id
    });
  }, [users, currentUser]);

  // Calculate user analytics for additional insights
  const userAnalytics = useMemo(() => {
    return calculateUserAnalytics(users, projects, tasks);
  }, [users, projects, tasks]);

  // Get privileged users
  const privilegedUsers = useMemo(() => {
    return users.filter(u =>
      ['Admin', 'VP', 'Director', 'IT'].includes(u.role)
    ).sort((a, b) => {
      const roleOrder = { 'Admin': 0, 'VP': 1, 'Director': 2, 'IT': 3 };
      return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
    });
  }, [users]);

  // All security concerns/alerts
  const allAlerts = useMemo(() => {
    return [
      ...securityMetrics.concerns,
      ...userAnalytics.concerns.filter(c => c.severity === 'warning')
    ];
  }, [securityMetrics, userAnalytics]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <RefreshCw size={24} className="spin" style={{ color: 'var(--text-secondary)' }} />
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
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Shield size={24} style={{ color: '#06b6d4' }} />
            Security Center
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Monitor system security, access controls, and privileged accounts
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
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
      </div>

      {/* Security Score Card */}
      <SecurityScoreCard
        score={securityMetrics.score}
        status={securityMetrics.status}
      />

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginTop: '24px'
      }}>
        {/* Left Column */}
        <div>
          {/* Security Alerts */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--border-color)',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
              Security Alerts
              {allAlerts.length > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.75rem'
                }}>
                  {allAlerts.length}
                </span>
              )}
            </h3>

            {allAlerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allAlerts.map((alert, i) => (
                  <AlertCard key={i} alert={alert} />
                ))}
              </div>
            ) : (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: 'var(--text-tertiary)'
              }}>
                <CheckCircle2 size={32} style={{ color: '#22c55e', marginBottom: '8px' }} />
                <p style={{ margin: 0 }}>No security alerts at this time</p>
              </div>
            )}
          </div>

          {/* Access Summary */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Key size={18} style={{ color: '#8b5cf6' }} />
              Access Summary
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {userAnalytics.summary.totalUsers}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Total Users
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#22c55e' }}>
                  {userAnalytics.summary.activeUsers}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Active Users
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#ef4444' }}>
                  {securityMetrics.privilegedAccounts.admins}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Admins
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f59e0b' }}>
                  {securityMetrics.privilegedAccounts.totalHighPrivilege}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  High Privilege
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Privileged Users */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Users size={18} style={{ color: '#06b6d4' }} />
            Privileged Accounts ({privilegedUsers.length})
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {privilegedUsers.map(user => (
              <PrivilegedUserCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--border-color)',
        marginTop: '24px'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Activity size={18} style={{ color: '#22c55e' }} />
          User Role Distribution
        </h3>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {userAnalytics.roleDistribution.map(role => (
            <div key={role.role} style={{
              flex: '1',
              minWidth: '120px',
              padding: '16px',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: role.color,
                margin: '0 auto 8px'
              }} />
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {role.count}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {role.role}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
                {role.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '16px',
        fontSize: '0.75rem',
        color: 'var(--text-tertiary)',
        textAlign: 'right'
      }}>
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}

export default SecurityCenter;
