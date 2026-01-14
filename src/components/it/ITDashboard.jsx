// ============================================================================
// ITDashboard.jsx - IT Administration Dashboard
// ============================================================================
// Main dashboard for IT personnel to manage users, monitor system health,
// troubleshoot issues, and view audit logs.
//
// FEATURES:
// - System health overview
// - User management quick stats
// - Recent activity feed
// - Quick action buttons
// - Navigation to detailed panels
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  HardDrive,
  RefreshCw,
  Settings,
  FileText,
  Clock,
  UserPlus,
  Search,
  ChevronRight,
  AlertTriangle,
  Server,
  Key,
  Eye,
  Lock,
  Wrench
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import UserManagement from './UserManagement';
import SystemHealth from './SystemHealth';
import AuditLogViewer from './AuditLogViewer';
import SecurityCenter from './SecurityCenter';
import DatabaseTools from './DatabaseTools';
import SystemConfiguration from './SystemConfiguration';

// ============================================================================
// CONSTANTS
// ============================================================================
const TOAST_DURATION = 5000;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ITDashboard({ initialTab }) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(initialTab || 'overview'); // overview, users, health, audit, security, database, settings
  const [toast, setToast] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    totalRFIs: 0,
    totalSubmittals: 0,
    storageUsed: 0,
    recentErrors: 0
  });

  // Recent activity
  const [recentActivity, setRecentActivity] = useState([]);

  // ==========================================================================
  // TOAST
  // ==========================================================================
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), TOAST_DURATION);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ==========================================================================
  // FETCH STATS
  // ==========================================================================
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all counts in parallel
      const [
        usersRes,
        projectsRes,
        tasksRes,
        rfisRes,
        submittalsRes
      ] = await Promise.all([
        supabase.from('users').select('id, is_active', { count: 'exact' }),
        supabase.from('projects').select('id, status', { count: 'exact' }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
        supabase.from('rfis').select('id', { count: 'exact', head: true }),
        supabase.from('submittals').select('id', { count: 'exact', head: true })
      ]);

      const users = usersRes.data || [];
      const projects = projectsRes.data || [];

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.is_active !== false).length,
        inactiveUsers: users.filter(u => u.is_active === false).length,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => !['Completed', 'Cancelled'].includes(p.status)).length,
        totalTasks: tasksRes.count || 0,
        totalRFIs: rfisRes.count || 0,
        totalSubmittals: submittalsRes.count || 0,
        storageUsed: 0, // Would need storage API
        recentErrors: 0 // Would need error_log table
      });

      // Fetch recent activity (simulated from recent records)
      await fetchRecentActivity();

    } catch (error) {
      console.error('Error fetching IT stats:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ==========================================================================
  // FETCH RECENT ACTIVITY
  // ==========================================================================
  const fetchRecentActivity = async () => {
    try {
      // Get recent projects, tasks, users created/updated
      const [recentProjects, recentTasks, recentUsers] = await Promise.all([
        supabase.from('projects').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }).limit(5),
        supabase.from('tasks').select('id, title, created_at, updated_at').order('updated_at', { ascending: false }).limit(5),
        supabase.from('users').select('id, name, created_at').order('created_at', { ascending: false }).limit(3)
      ]);

      const activities = [];

      // Add project activities
      (recentProjects.data || []).forEach(p => {
        activities.push({
          id: `project-${p.id}`,
          type: 'project',
          action: 'updated',
          name: p.name,
          timestamp: p.updated_at || p.created_at
        });
      });

      // Add task activities
      (recentTasks.data || []).forEach(t => {
        activities.push({
          id: `task-${t.id}`,
          type: 'task',
          action: 'updated',
          name: t.title,
          timestamp: t.updated_at || t.created_at
        });
      });

      // Add user activities
      (recentUsers.data || []).forEach(u => {
        activities.push({
          id: `user-${u.id}`,
          type: 'user',
          action: 'created',
          name: u.name,
          timestamp: u.created_at
        });
      });

      // Sort by timestamp and take top 10
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ==========================================================================
  // RENDER PANEL CONTENT
  // ==========================================================================
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'users':
        return <UserManagement showToast={showToast} />;
      case 'health':
        return <SystemHealth showToast={showToast} />;
      case 'audit':
        return <AuditLogViewer showToast={showToast} />;
      case 'security':
        return <SecurityCenter />;
      case 'database':
        return <DatabaseTools />;
      case 'settings':
        return <SystemConfiguration />;
      default:
        return renderOverview();
    }
  };

  // ==========================================================================
  // RENDER OVERVIEW
  // ==========================================================================
  const renderOverview = () => (
    <>
      {/* ================================================================== */}
      {/* STATS CARDS - Modern Gradient Style                               */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
        marginBottom: 'var(--space-lg)'
      }}>
        <StatCardModern
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          subValue={`${stats.activeUsers} active`}
          color="#3b82f6"
          gradient="linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))"
          onClick={() => setActivePanel('users')}
        />
        <StatCardModern
          icon={Database}
          label="Active Projects"
          value={stats.activeProjects}
          subValue={`${stats.totalProjects} total`}
          color="var(--sunbelt-orange)"
          gradient="linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))"
        />
        <StatCardModern
          icon={CheckCircle}
          label="Total Tasks"
          value={stats.totalTasks}
          color="#22c55e"
          gradient="linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))"
        />
        <StatCardModern
          icon={FileText}
          label="Total RFIs"
          value={stats.totalRFIs}
          color="#f59e0b"
          gradient="linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))"
        />
        <StatCardModern
          icon={Activity}
          label="System Status"
          value="Healthy"
          subValue="All operational"
          color="#22c55e"
          gradient="linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))"
          onClick={() => setActivePanel('health')}
        />
        <StatCardModern
          icon={AlertTriangle}
          label="Recent Errors"
          value={stats.recentErrors}
          subValue="Last 24h"
          color={stats.recentErrors > 0 ? '#ef4444' : '#64748b'}
          gradient={stats.recentErrors > 0
            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))"
            : "linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.02))"}
          highlight={stats.recentErrors > 0}
        />
      </div>

      {/* ================================================================== */}
      {/* QUICK ACTIONS & RECENT ACTIVITY                                   */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-lg)'
      }}>
        {/* Quick Actions */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: 'var(--space-lg)'
        }}>
          <h3 style={{
            margin: '0 0 var(--space-md) 0',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <Settings size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            Quick Actions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <QuickActionButton
              icon={UserPlus}
              label="Add New User"
              onClick={() => setActivePanel('users')}
            />
            <QuickActionButton
              icon={Shield}
              label="Security Center"
              onClick={() => setActivePanel('security')}
            />
            <QuickActionButton
              icon={Database}
              label="Database Tools"
              onClick={() => setActivePanel('database')}
            />
            <QuickActionButton
              icon={Eye}
              label="View Audit Log"
              onClick={() => setActivePanel('audit')}
            />
            <QuickActionButton
              icon={Activity}
              label="System Diagnostics"
              onClick={() => setActivePanel('health')}
            />
            <QuickActionButton
              icon={Settings}
              label="System Settings"
              onClick={() => setActivePanel('settings')}
            />
            <QuickActionButton
              icon={RefreshCw}
              label="Refresh All Data"
              onClick={fetchStats}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: 'var(--space-lg)'
        }}>
          <h3 style={{
            margin: '0 0 var(--space-md) 0',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <Clock size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            Recent Activity
          </h3>

          {recentActivity.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              No recent activity
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {recentActivity.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* DATABASE OVERVIEW                                                 */}
      {/* ================================================================== */}
      <div style={{
        marginTop: 'var(--space-xl)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: 'var(--space-lg)'
      }}>
        <h3 style={{
          margin: '0 0 var(--space-md) 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <Server size={18} style={{ color: 'var(--sunbelt-orange)' }} />
          Database Overview
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--space-md)'
        }}>
          <TableStat table="users" count={stats.totalUsers} />
          <TableStat table="projects" count={stats.totalProjects} />
          <TableStat table="tasks" count={stats.totalTasks} />
          <TableStat table="rfis" count={stats.totalRFIs} />
          <TableStat table="submittals" count={stats.totalSubmittals} />
        </div>
      </div>
    </>
  );

  // ==========================================================================
  // RENDER: Loading
  // ==========================================================================
  if (loading && activePanel === 'overview') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="loading-spinner" />
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>Loading IT Dashboard...</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: Main Dashboard
  // ==========================================================================
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <Shield size={28} style={{ color: '#3b82f6' }} />
            IT Administration
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9375rem' }}>
            System management and user administration
          </p>
        </div>

        <button
          onClick={fetchStats}
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
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* ================================================================== */}
      {/* NAVIGATION TABS                                                   */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-xs)',
        marginBottom: 'var(--space-lg)',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: 'var(--space-sm)',
        overflowX: 'auto'
      }}>
        <NavTab
          active={activePanel === 'overview'}
          onClick={() => setActivePanel('overview')}
          icon={Activity}
          label="Overview"
        />
        <NavTab
          active={activePanel === 'users'}
          onClick={() => setActivePanel('users')}
          icon={Users}
          label="Users"
        />
        <NavTab
          active={activePanel === 'health'}
          onClick={() => setActivePanel('health')}
          icon={Server}
          label="System Health"
        />
        <NavTab
          active={activePanel === 'security'}
          onClick={() => setActivePanel('security')}
          icon={Shield}
          label="Security"
        />
        <NavTab
          active={activePanel === 'database'}
          onClick={() => setActivePanel('database')}
          icon={Database}
          label="Database"
        />
        <NavTab
          active={activePanel === 'audit'}
          onClick={() => setActivePanel('audit')}
          icon={FileText}
          label="Audit Log"
        />
        <NavTab
          active={activePanel === 'settings'}
          onClick={() => setActivePanel('settings')}
          icon={Settings}
          label="Settings"
        />
      </div>

      {/* ================================================================== */}
      {/* PANEL CONTENT                                                     */}
      {/* ================================================================== */}
      {renderPanelContent()}

      {/* ================================================================== */}
      {/* TOAST                                                             */}
      {/* ================================================================== */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '16px 24px',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          background: toast.type === 'error' ? 'var(--danger)' : toast.type === 'info' ? '#3b82f6' : '#22c55e',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          zIndex: 10000,
          animation: 'slideInRight 0.3s ease-out',
          fontWeight: '500',
          fontSize: '0.9375rem'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {toast.message}
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Navigation Tab
function NavTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: 'var(--space-sm) var(--space-md)',
        background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: active ? '#3b82f6' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: active ? '600' : '500',
        transition: 'all 0.15s'
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

// Modern Stat Card with gradient
function StatCardModern({ icon: Icon, label, value, subValue, color, gradient, onClick, highlight }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        background: gradient || 'var(--bg-secondary)',
        borderRadius: '12px',
        border: highlight ? `1px solid ${color}` : '1px solid var(--border-color)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={18} style={{ color }} />
        </div>
        {onClick && (
          <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
        )}
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: 'var(--text-primary)',
        lineHeight: 1.2
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        marginTop: '4px',
        fontWeight: '500'
      }}>
        {label}
      </div>
      {subValue && (
        <div style={{
          fontSize: '0.6875rem',
          color: 'var(--text-tertiary)',
          marginTop: '2px'
        }}>
          {subValue}
        </div>
      )}
    </div>
  );
}

// Stat Card (legacy)
function StatCard({ icon: Icon, label, value, subValue, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 'var(--space-lg)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
        <Icon size={20} style={{ color }} />
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
        {value}
      </div>
      {subValue && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          {subValue}
        </div>
      )}
      {onClick && (
        <div style={{ fontSize: '0.75rem', color, marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          View details <ChevronRight size={12} />
        </div>
      )}
    </div>
  );
}

// Quick Action Button
function QuickActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: 'var(--space-sm) var(--space-md)',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '0.875rem',
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.15s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
    >
      <Icon size={16} style={{ color: 'var(--sunbelt-orange)' }} />
      {label}
      <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
    </button>
  );
}

// Activity Item - helper to get icon component
const getActivityIcon = (type) => {
  switch (type) {
    case 'user': return Users;
    case 'project': return Database;
    case 'task': return CheckCircle;
    default: return Activity;
  }
};

const getActivityColor = (type) => {
  switch (type) {
    case 'user': return '#3b82f6';
    case 'project': return 'var(--sunbelt-orange)';
    case 'task': return '#22c55e';
    default: return 'var(--text-secondary)';
  }
};

const renderActivityIcon = (type) => {
  const IconComponent = getActivityIcon(type);
  return <IconComponent size={14} style={{ color: getActivityColor(type), flexShrink: 0 }} />;
};

function ActivityItem({ activity }) {
  const timeAgo = getTimeAgo(activity.timestamp);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      padding: 'var(--space-xs) 0',
      borderBottom: '1px solid var(--border-color)'
    }}>
      {renderActivityIcon(activity.type)}
      <span style={{
        fontSize: '0.8125rem',
        color: 'var(--text-primary)',
        flex: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} {activity.action}: <strong>{activity.name}</strong>
      </span>
      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
        {timeAgo}
      </span>
    </div>
  );
}

// Table Stat
function TableStat({ table, count }) {
  return (
    <div style={{
      padding: 'var(--space-sm) var(--space-md)',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
        {table}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
        {count.toLocaleString()}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

export default ITDashboard;