// ============================================================================
// QueueTimeMonitor.jsx - Inter-Station Queue Time Monitor
// ============================================================================
// Tracks and displays queue wait times between stations:
// - Real-time wait time per module
// - >30 minute flag alerts
// - Cause attribution options
// - Bottleneck identification
//
// PGM-012: Queue Time Monitor Widget
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Timer,
  Hourglass,
  TrendingUp,
  Package,
  Zap,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// CONSTANTS
// ============================================================================

// Queue time threshold for alerts (in minutes)
const ALERT_THRESHOLD_MINUTES = 30;

// Cause attribution options
const QUEUE_CAUSES = [
  { id: 'waiting_crew', label: 'Waiting for Crew', icon: '👷' },
  { id: 'waiting_materials', label: 'Waiting for Materials', icon: '📦' },
  { id: 'station_occupied', label: 'Station Occupied', icon: '🚧' },
  { id: 'qc_hold', label: 'QC Hold', icon: '🔍' },
  { id: 'rework', label: 'Rework Required', icon: '🔧' },
  { id: 'equipment', label: 'Equipment Issue', icon: '⚙️' },
  { id: 'other', label: 'Other', icon: '❓' }
];

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-md) var(--space-lg)',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-tertiary)'
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  alertBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: '2px var(--space-sm)',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.7rem',
    fontWeight: '500'
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.15s ease'
  },
  body: {
    padding: 'var(--space-lg)'
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-lg)'
  },
  summaryCard: {
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center'
  },
  summaryValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  summaryLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    marginTop: '4px'
  },
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  queueItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    gap: 'var(--space-md)',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
    borderLeft: '4px solid transparent'
  },
  queueItemAlert: {
    borderLeftColor: '#ef4444',
    background: '#fef2f2'
  },
  queueItemWarning: {
    borderLeftColor: '#f59e0b',
    background: '#fffbeb'
  },
  moduleInfo: {
    flex: 1
  },
  moduleSerial: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)'
  },
  moduleProject: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  stationInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)'
  },
  stationBadge: {
    padding: '2px var(--space-sm)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.7rem',
    fontWeight: '500'
  },
  waitTime: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px'
  },
  waitValue: {
    fontSize: '0.875rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)'
  },
  waitLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)'
  },
  causeSelect: {
    padding: 'var(--space-sm)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    minWidth: '140px'
  },
  bottleneckSection: {
    marginTop: 'var(--space-lg)',
    padding: 'var(--space-md)',
    background: 'linear-gradient(135deg, var(--sunbelt-orange) 0%, #f59e0b 100%)',
    borderRadius: 'var(--radius-md)',
    color: 'white'
  },
  bottleneckTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 'var(--space-sm)',
    opacity: 0.9
  },
  bottleneckStation: {
    fontSize: '1rem',
    fontWeight: '700'
  },
  bottleneckMeta: {
    fontSize: '0.75rem',
    marginTop: 'var(--space-xs)',
    opacity: 0.9
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-tertiary)'
  },
  tabs: {
    display: 'flex',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-md)'
  },
  tab: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-tertiary)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  tabActive: {
    background: 'var(--sunbelt-orange)',
    color: 'white'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatWaitTime(minutes) {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getWaitTimeColor(minutes) {
  if (minutes >= 60) return '#ef4444'; // Red - critical
  if (minutes >= ALERT_THRESHOLD_MINUTES) return '#f59e0b'; // Orange - warning
  if (minutes >= 15) return '#eab308'; // Yellow - attention
  return '#22c55e'; // Green - OK
}

function calculateWaitTime(module) {
  // If module has actual_start at current station, it's being worked on
  if (module.actual_start && !module.actual_end) {
    return 0; // Not waiting
  }

  // Calculate time since arriving at station (use updated_at as proxy)
  const arrivalTime = module.station_arrived_at || module.updated_at;
  if (!arrivalTime) return 0;

  const now = new Date();
  const arrival = new Date(arrivalTime);
  return (now - arrival) / (1000 * 60); // Convert to minutes
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function QueueTimeMonitor({
  factoryId,
  stations = [],
  modules = [],
  compact = false,
  onModuleClick
}) {
  const [activeTab, setActiveTab] = useState('waiting');
  const [causeSelections, setCauseSelections] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Calculate queue data for each module
  const queueData = useMemo(() => {
    return modules
      .filter(m => m.status === 'In Queue' || m.status === 'Waiting')
      .map(module => {
        const waitMinutes = calculateWaitTime(module);
        const station = stations.find(s => s.id === module.current_station_id);

        return {
          ...module,
          waitMinutes,
          station,
          isAlert: waitMinutes >= ALERT_THRESHOLD_MINUTES,
          isWarning: waitMinutes >= 15 && waitMinutes < ALERT_THRESHOLD_MINUTES,
          cause: causeSelections[module.id] || null
        };
      })
      .sort((a, b) => b.waitMinutes - a.waitMinutes);
  }, [modules, stations, causeSelections]);

  // Filter based on active tab
  const filteredQueue = useMemo(() => {
    switch (activeTab) {
      case 'alert':
        return queueData.filter(m => m.isAlert);
      case 'all':
        return queueData;
      default: // 'waiting'
        return queueData.filter(m => m.waitMinutes > 0);
    }
  }, [queueData, activeTab]);

  // Summary stats
  const summary = useMemo(() => {
    const waiting = queueData.filter(m => m.waitMinutes > 0);
    const alerts = queueData.filter(m => m.isAlert);
    const avgWait = waiting.length > 0
      ? waiting.reduce((sum, m) => sum + m.waitMinutes, 0) / waiting.length
      : 0;

    // Find bottleneck station (most modules waiting)
    const stationCounts = {};
    waiting.forEach(m => {
      if (m.station) {
        stationCounts[m.station.id] = (stationCounts[m.station.id] || 0) + 1;
      }
    });
    const bottleneckId = Object.entries(stationCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const bottleneck = stations.find(s => s.id === bottleneckId);

    return {
      totalWaiting: waiting.length,
      alertCount: alerts.length,
      avgWaitTime: avgWait,
      longestWait: waiting[0]?.waitMinutes || 0,
      bottleneck,
      bottleneckCount: bottleneckId ? stationCounts[bottleneckId] : 0
    };
  }, [queueData, stations]);

  // Handle cause selection
  const handleCauseChange = async (moduleId, causeId) => {
    setCauseSelections(prev => ({
      ...prev,
      [moduleId]: causeId
    }));

    // Optionally save to database
    try {
      await supabase
        .from('modules')
        .update({
          queue_cause: causeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', moduleId);
    } catch (error) {
      console.error('Error saving queue cause:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Force re-render with new timestamps
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <Hourglass size={16} color="var(--sunbelt-orange)" />
          Queue Time Monitor
          {summary.alertCount > 0 && (
            <span style={styles.alertBadge}>
              <AlertTriangle size={12} />
              {summary.alertCount} critical
            </span>
          )}
        </div>
        <button
          style={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={14}
            style={refreshing ? { animation: 'spin 1s linear infinite' } : {}}
          />
        </button>
      </div>

      <div style={styles.body}>
        {/* Summary Cards */}
        {!compact && (
          <div style={styles.summaryRow}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryValue}>{summary.totalWaiting}</div>
              <div style={styles.summaryLabel}>In Queue</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={{
                ...styles.summaryValue,
                color: summary.alertCount > 0 ? '#ef4444' : '#22c55e'
              }}>
                {summary.alertCount}
              </div>
              <div style={styles.summaryLabel}>Over 30m</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryValue}>
                {formatWaitTime(summary.avgWaitTime)}
              </div>
              <div style={styles.summaryLabel}>Avg Wait</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={{
                ...styles.summaryValue,
                color: getWaitTimeColor(summary.longestWait)
              }}>
                {formatWaitTime(summary.longestWait)}
              </div>
              <div style={styles.summaryLabel}>Longest</div>
            </div>
          </div>
        )}

        {/* Bottleneck Alert */}
        {summary.bottleneck && summary.bottleneckCount >= 2 && (
          <div style={styles.bottleneckSection}>
            <div style={styles.bottleneckTitle}>
              <AlertTriangle size={14} style={{ marginRight: '4px' }} />
              Bottleneck Detected
            </div>
            <div style={styles.bottleneckStation}>
              {summary.bottleneck.name}
            </div>
            <div style={styles.bottleneckMeta}>
              {summary.bottleneckCount} modules waiting
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'waiting' ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab('waiting')}
          >
            Waiting ({queueData.filter(m => m.waitMinutes > 0).length})
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'alert' ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab('alert')}
          >
            Alerts ({queueData.filter(m => m.isAlert).length})
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'all' ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab('all')}
          >
            All ({queueData.length})
          </button>
        </div>

        {/* Queue List */}
        <div style={styles.queueList}>
          {filteredQueue.map(item => {
            const waitColor = getWaitTimeColor(item.waitMinutes);

            return (
              <div
                key={item.id}
                style={{
                  ...styles.queueItem,
                  ...(item.isAlert ? styles.queueItemAlert : {}),
                  ...(item.isWarning && !item.isAlert ? styles.queueItemWarning : {})
                }}
                onClick={() => onModuleClick?.(item)}
              >
                <div style={styles.moduleInfo}>
                  <div style={styles.moduleSerial}>
                    {item.serial_number}
                    {item.is_rush && (
                      <Zap size={12} color="#ef4444" />
                    )}
                  </div>
                  <div style={styles.moduleProject}>
                    {item.project?.name || 'Unknown Project'}
                  </div>
                  <div style={styles.stationInfo}>
                    <span style={{
                      ...styles.stationBadge,
                      borderLeft: `3px solid ${item.station?.color || 'var(--text-tertiary)'}`
                    }}>
                      {item.station?.name || 'Unknown Station'}
                    </span>
                  </div>
                </div>

                {/* Cause Select */}
                <select
                  style={styles.causeSelect}
                  value={item.cause || ''}
                  onChange={(e) => handleCauseChange(item.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Select cause...</option>
                  {QUEUE_CAUSES.map(cause => (
                    <option key={cause.id} value={cause.id}>
                      {cause.icon} {cause.label}
                    </option>
                  ))}
                </select>

                {/* Wait Time */}
                <div style={styles.waitTime}>
                  <div style={{ ...styles.waitValue, color: waitColor }}>
                    {item.isAlert && <AlertTriangle size={14} />}
                    {formatWaitTime(item.waitMinutes)}
                  </div>
                  <div style={styles.waitLabel}>waiting</div>
                </div>

                <ChevronRight size={14} color="var(--text-tertiary)" />
              </div>
            );
          })}

          {filteredQueue.length === 0 && (
            <div style={styles.emptyState}>
              <CheckCircle2 size={32} color="#22c55e" style={{ marginBottom: 'var(--space-sm)' }} />
              <p>No modules waiting in queue</p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                Production is flowing smoothly!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
