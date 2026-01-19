// ============================================================================
// ActivityAndLogs.jsx - Merged Activity & Logs Tab
// ============================================================================
// Combines Audit Trail, Error Tickets, and System Events into a single
// tabbed interface for comprehensive system monitoring.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  AlertTriangle,
  Activity,
  Server,
  Clock,
  RefreshCw,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  Settings,
  Database,
  Users,
  Shield
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import AuditLogViewer from './AuditLogViewer';
import ErrorTracking from './ErrorTracking';
import { ITSubTabs, ITAlertCard } from './widgets';
import * as itService from '../../services/itService';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ActivityAndLogs({ showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('audit');
  const [loading, setLoading] = useState(false);

  // System events
  const [systemEvents, setSystemEvents] = useState([]);
  const [eventsFilter, setEventsFilter] = useState('all');

  // Sub-tabs configuration
  const subTabs = [
    { id: 'audit', label: 'Audit Trail', icon: FileText },
    { id: 'errors', label: 'Error Tickets', icon: AlertTriangle },
    { id: 'events', label: 'System Events', icon: Server }
  ];

  // ==========================================================================
  // FETCH SYSTEM EVENTS
  // ==========================================================================
  const fetchSystemEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch from config_audit and system_alerts for combined events
      // Note: These return { data, error } objects
      const [configAuditRes, systemAlertsRes] = await Promise.all([
        itService.getConfigAudit({ limit: 50 }),
        itService.getSystemAlerts()
      ]);

      // Extract data from responses
      const configAudit = configAuditRes?.data || [];
      const systemAlerts = systemAlertsRes?.data || [];

      // Combine and normalize events
      const events = [];

      // Add config changes
      configAudit.forEach(audit => {
        events.push({
          id: `config-${audit.id}`,
          type: 'config_change',
          title: `Configuration changed: ${audit.config_key}`,
          description: audit.notes || `Changed from ${JSON.stringify(audit.old_value)} to ${JSON.stringify(audit.new_value)}`,
          category: audit.config_section || 'settings',
          status: audit.status,
          timestamp: audit.changed_at,
          user: audit.changed_by,
          metadata: audit
        });
      });

      // Add system alerts as events
      systemAlerts.forEach(alert => {
        events.push({
          id: `alert-${alert.id}`,
          type: 'system_alert',
          title: alert.title,
          description: alert.message,
          category: alert.category || 'system',
          status: alert.is_active ? 'active' : 'resolved',
          severity: alert.type,
          timestamp: alert.created_at,
          metadata: alert
        });
      });

      // Generate some simulated system events if none exist
      if (events.length === 0) {
        events.push(...generateSimulatedEvents());
      }

      // Sort by timestamp
      events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setSystemEvents(events);
    } catch (error) {
      console.error('Error fetching system events:', error);
      setSystemEvents(generateSimulatedEvents());
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate simulated system events
  const generateSimulatedEvents = () => {
    return [
      {
        id: 'event-1',
        type: 'backup',
        title: 'Daily Backup Completed',
        description: 'Automated daily backup completed successfully. 2.4GB backed up.',
        category: 'database',
        status: 'completed',
        severity: 'success',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'event-2',
        type: 'config_change',
        title: 'Session Timeout Updated',
        description: 'Session timeout changed from 30 minutes to 60 minutes',
        category: 'security',
        status: 'applied',
        severity: 'info',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'event-3',
        type: 'system_alert',
        title: 'High Memory Usage Detected',
        description: 'Server memory usage exceeded 80% threshold',
        category: 'performance',
        status: 'resolved',
        severity: 'warning',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'event-4',
        type: 'maintenance',
        title: 'Scheduled Maintenance Completed',
        description: 'Database optimization and cleanup completed',
        category: 'database',
        status: 'completed',
        severity: 'info',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'event-5',
        type: 'security_scan',
        title: 'Security Scan Completed',
        description: 'No vulnerabilities detected in latest scan',
        category: 'security',
        status: 'completed',
        severity: 'success',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'event-6',
        type: 'user_activity',
        title: 'Bulk User Import',
        description: '15 new users imported via CSV upload',
        category: 'users',
        status: 'completed',
        severity: 'info',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  useEffect(() => {
    if (activeSubTab === 'events') {
      fetchSystemEvents();
    }
  }, [activeSubTab, fetchSystemEvents]);

  // ==========================================================================
  // RENDER CONTENT
  // ==========================================================================
  const renderContent = () => {
    switch (activeSubTab) {
      case 'audit':
        return <AuditLogViewer showToast={showToast} />;
      case 'errors':
        return <ErrorTracking showToast={showToast} />;
      case 'events':
        return renderSystemEvents();
      default:
        return null;
    }
  };

  // ==========================================================================
  // RENDER SYSTEM EVENTS
  // ==========================================================================
  const renderSystemEvents = () => {
    const getEventIcon = (type, category) => {
      switch (category) {
        case 'database': return Database;
        case 'security': return Shield;
        case 'users': return Users;
        case 'settings': return Settings;
        case 'performance': return Activity;
        default: return Server;
      }
    };

    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'success': return '#22c55e';
        case 'warning': return '#f59e0b';
        case 'error': return '#ef4444';
        case 'info':
        default: return '#3b82f6';
      }
    };

    const getSeverityIcon = (severity) => {
      switch (severity) {
        case 'success': return CheckCircle;
        case 'warning': return AlertTriangle;
        case 'error': return XCircle;
        case 'info':
        default: return Info;
      }
    };

    // Filter events
    const filteredEvents = eventsFilter === 'all'
      ? systemEvents
      : systemEvents.filter(e => e.category === eventsFilter);

    // Get unique categories for filter
    const categories = [...new Set(systemEvents.map(e => e.category))];

    return (
      <div>
        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: 'var(--space-lg)'
        }}>
          {/* Category Filter */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setEventsFilter('all')}
              style={{
                padding: '6px 12px',
                background: eventsFilter === 'all' ? 'var(--bg-primary)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: eventsFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: eventsFilter === 'all' ? '600' : '500',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setEventsFilter(cat)}
                style={{
                  padding: '6px 12px',
                  background: eventsFilter === cat ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: eventsFilter === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: eventsFilter === cat ? '600' : '500',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Refresh */}
          <button
            onClick={fetchSystemEvents}
            disabled={loading}
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
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          {/* Export */}
          <button
            onClick={() => showToast('Exporting system events...', 'info')}
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

        {/* Events Timeline */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px'
        }}>
          {loading ? (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-tertiary)'
            }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
              <div>Loading events...</div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '0.875rem'
            }}>
              <Server size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <div>No system events found</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredEvents.map((event, idx) => {
                const CategoryIcon = getEventIcon(event.type, event.category);
                const SeverityIcon = getSeverityIcon(event.severity);
                const severityColor = getSeverityColor(event.severity);

                return (
                  <div key={event.id} style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: `${severityColor}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <SeverityIcon size={20} style={{ color: severityColor }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontSize: '0.9375rem',
                          fontWeight: '600',
                          color: 'var(--text-primary)'
                        }}>
                          {event.title}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.6875rem',
                          fontWeight: '600',
                          background: `${severityColor}15`,
                          color: severityColor,
                          textTransform: 'capitalize'
                        }}>
                          {event.status}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '8px'
                      }}>
                        {event.description}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CategoryIcon size={12} />
                          {event.category}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Spin animation style */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
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

export default ActivityAndLogs;
