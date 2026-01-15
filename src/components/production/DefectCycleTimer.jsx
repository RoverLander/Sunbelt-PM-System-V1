// ============================================================================
// DefectCycleTimer.jsx - Defect-to-Fix Cycle Timer (PGM-017)
// ============================================================================
// Measures defect detection to resolution time with station breakdown.
//
// Props:
// - factoryId: Factory UUID (required)
// - compact: Boolean for dashboard widget mode (default: false)
// - thresholdHours: Flag threshold in hours (default: 4)
// - onDefectClick: Callback when defect is clicked
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Timer,
  Wrench,
  ChevronRight,
  BarChart3,
  Target,
  Activity
} from 'lucide-react';
import { getDefectFixCycles, getDefectFixStats } from '../../services/efficiencyService';

const TIME_BANDS = {
  good: { max: 2, color: '#22c55e', label: '< 2hrs' },
  warning: { max: 4, color: '#f59e0b', label: '2-4hrs' },
  critical: { max: Infinity, color: '#ef4444', label: '> 4hrs' }
};

export default function DefectCycleTimer({
  factoryId,
  compact = false,
  thresholdHours = 4,
  onDefectClick
}) {
  // State
  const [cycles, setCycles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState('all');

  // Fetch data callback
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const [cyclesRes, statsRes] = await Promise.all([
        getDefectFixCycles(factoryId, { limit: compact ? 10 : 50 }),
        getDefectFixStats(factoryId, startDate, endDate)
      ]);

      setCycles(cyclesRes.data || []);
      setStats(statsRes.data || null);
    } catch (error) {
      console.error('Error fetching defect cycle data:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId, compact]);

  // Fetch data on mount and when factory changes
  useEffect(() => {
    if (factoryId) {
      fetchData();
    }
  }, [factoryId, fetchData]);

  // Filter cycles by station
  const filteredCycles = useMemo(() => {
    if (selectedStation === 'all') return cycles;
    return cycles.filter(c => c.station_id === selectedStation);
  }, [cycles, selectedStation]);

  // Get unique stations from cycles
  const stations = useMemo(() => {
    const stationMap = {};
    cycles.forEach(c => {
      if (c.station && !stationMap[c.station_id]) {
        stationMap[c.station_id] = c.station;
      }
    });
    return Object.values(stationMap);
  }, [cycles]);

  // Get time band for duration
  const getTimeBand = (hours) => {
    if (hours < TIME_BANDS.good.max) return TIME_BANDS.good;
    if (hours < TIME_BANDS.warning.max) return TIME_BANDS.warning;
    return TIME_BANDS.critical;
  };

  // Format duration
  const formatDuration = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    if (hours < 24) {
      return `${Math.round(hours * 10) / 10}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  // Styles
  const styles = {
    container: {
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-primary)',
      overflow: 'hidden'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: compact ? 'var(--space-md)' : 'var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-tertiary)'
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      margin: 0,
      fontSize: compact ? '1rem' : '1.125rem',
      fontWeight: '600',
      color: 'var(--text-primary)'
    },
    headerIcon: {
      color: '#ef4444'
    },
    content: {
      padding: compact ? 'var(--space-md)' : 'var(--space-lg)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: 'var(--space-md)',
      marginBottom: 'var(--space-lg)'
    },
    statCard: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    statIcon: {
      width: '40px',
      height: '40px',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    statValue: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: 'var(--text-primary)'
    },
    statLabel: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    avgDisplay: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: 'var(--space-lg)',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 'var(--space-lg)'
    },
    avgValue: {
      fontSize: '2.5rem',
      fontWeight: '700',
      marginBottom: 'var(--space-xs)'
    },
    avgLabel: {
      fontSize: '0.875rem',
      color: 'var(--text-secondary)'
    },
    targetIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      marginTop: 'var(--space-sm)',
      fontSize: '0.8125rem'
    },
    filterBar: {
      display: 'flex',
      gap: 'var(--space-sm)',
      marginBottom: 'var(--space-md)',
      flexWrap: 'wrap'
    },
    filterSelect: {
      padding: 'var(--space-xs) var(--space-sm)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-primary)',
      fontSize: '0.875rem',
      cursor: 'pointer'
    },
    cycleList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    },
    cycleCard: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'all 0.15s ease'
    },
    cycleHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 'var(--space-xs)'
    },
    cycleModule: {
      fontSize: '0.9375rem',
      fontWeight: '600',
      color: 'var(--text-primary)'
    },
    cycleDuration: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.875rem',
      fontWeight: '600'
    },
    cycleMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      fontSize: '0.8125rem',
      color: 'var(--text-secondary)'
    },
    stationBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    ongoingBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      background: 'rgba(239, 68, 68, 0.15)',
      color: '#ef4444',
      fontSize: '0.75rem',
      fontWeight: '500',
      animation: 'pulse 2s infinite'
    },
    stationBreakdown: {
      marginTop: 'var(--space-lg)'
    },
    sectionTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-sm)'
    },
    stationGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: 'var(--space-sm)'
    },
    stationCard: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-sm)',
      textAlign: 'center'
    },
    stationName: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      marginBottom: 'var(--space-xs)'
    },
    stationAvg: {
      fontSize: '1.125rem',
      fontWeight: '700'
    },
    stationCount: {
      fontSize: '0.6875rem',
      color: 'var(--text-tertiary)'
    },
    viewAllLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: 'var(--text-secondary)',
      fontSize: '0.8125rem',
      cursor: 'pointer',
      marginTop: 'var(--space-md)',
      justifyContent: 'center'
    },
    emptyState: {
      textAlign: 'center',
      padding: 'var(--space-xl)',
      color: 'var(--text-secondary)'
    },
    timeBands: {
      display: 'flex',
      gap: 'var(--space-md)',
      justifyContent: 'center',
      marginTop: 'var(--space-md)',
      padding: 'var(--space-sm)',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)'
    },
    timeBand: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      fontSize: '0.75rem'
    },
    timeBandDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%'
    }
  };

  // Render compact version
  if (compact) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>
            <Timer size={18} style={styles.headerIcon} />
            Defect Fix Timer
          </h3>
        </div>

        <div style={styles.content}>
          {/* Average Time Display */}
          {stats && (
            <div style={styles.avgDisplay}>
              <div style={{
                ...styles.avgValue,
                color: getTimeBand(stats.avgDurationHours).color
              }}>
                {formatDuration(stats.avgDurationHours)}
              </div>
              <div style={styles.avgLabel}>Average Fix Time</div>
              <div style={{
                ...styles.targetIndicator,
                color: stats.avgDurationHours <= thresholdHours ? '#22c55e' : '#ef4444'
              }}>
                {stats.avgDurationHours <= thresholdHours ? (
                  <>
                    <TrendingDown size={14} />
                    Under {thresholdHours}hr target
                  </>
                ) : (
                  <>
                    <TrendingUp size={14} />
                    {formatDuration(stats.avgDurationHours - thresholdHours)} over target
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, background: 'rgba(239, 68, 68, 0.15)'}}>
                <AlertTriangle size={18} color="#ef4444" />
              </div>
              <div>
                <div style={styles.statValue}>{stats?.ongoing || 0}</div>
                <div style={styles.statLabel}>Ongoing</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, background: 'rgba(34, 197, 94, 0.15)'}}>
                <CheckCircle2 size={18} color="#22c55e" />
              </div>
              <div>
                <div style={styles.statValue}>{stats?.completed || 0}</div>
                <div style={styles.statLabel}>Fixed</div>
              </div>
            </div>
          </div>

          {/* Recent defects */}
          <div style={styles.cycleList}>
            {loading ? (
              <div style={styles.emptyState}>Loading...</div>
            ) : filteredCycles.length === 0 ? (
              <div style={styles.emptyState}>No defects to track</div>
            ) : (
              filteredCycles.slice(0, 3).map(cycle => {
                const band = getTimeBand(cycle.duration_hours);
                return (
                  <div
                    key={cycle.id}
                    style={{
                      ...styles.cycleCard,
                      borderColor: cycle.is_ongoing ? 'rgba(239, 68, 68, 0.3)' : 'transparent'
                    }}
                    onClick={() => onDefectClick && onDefectClick(cycle)}
                  >
                    <div style={styles.cycleHeader}>
                      <span style={styles.cycleModule}>
                        {cycle.module?.serial_number || 'Unknown Module'}
                      </span>
                      <span style={{
                        ...styles.cycleDuration,
                        background: `${band.color}20`,
                        color: band.color
                      }}>
                        <Clock size={12} />
                        {formatDuration(cycle.duration_hours)}
                      </span>
                    </div>
                    <div style={styles.cycleMeta}>
                      <span style={{
                        ...styles.stationBadge,
                        background: cycle.station?.color ? `${cycle.station.color}20` : 'var(--bg-tertiary)',
                        color: cycle.station?.color || 'var(--text-secondary)'
                      }}>
                        {cycle.station?.name || 'Unknown Station'}
                      </span>
                      {cycle.is_ongoing && (
                        <span style={styles.ongoingBadge}>
                          <Activity size={10} />
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={styles.viewAllLink}>
            View All Defects <ChevronRight size={14} />
          </div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>
          <Timer size={20} style={styles.headerIcon} />
          Defect-to-Fix Cycle Timer
        </h3>
        <div style={{display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
          <Target size={14} color="var(--text-secondary)" />
          <span style={{fontSize: '0.8125rem', color: 'var(--text-secondary)'}}>
            Target: {thresholdHours} hours
          </span>
        </div>
      </div>

      <div style={styles.content}>
        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(99, 102, 241, 0.15)'}}>
              <BarChart3 size={20} color="#6366f1" />
            </div>
            <div>
              <div style={styles.statValue}>{stats?.total || 0}</div>
              <div style={styles.statLabel}>Total (30d)</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(239, 68, 68, 0.15)'}}>
              <AlertTriangle size={20} color="#ef4444" />
            </div>
            <div>
              <div style={styles.statValue}>{stats?.ongoing || 0}</div>
              <div style={styles.statLabel}>Ongoing</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(34, 197, 94, 0.15)'}}>
              <CheckCircle2 size={20} color="#22c55e" />
            </div>
            <div>
              <div style={styles.statValue}>{stats?.completed || 0}</div>
              <div style={styles.statLabel}>Completed</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(245, 158, 11, 0.15)'}}>
              <Clock size={20} color="#f59e0b" />
            </div>
            <div>
              <div style={{
                ...styles.statValue,
                color: getTimeBand(stats?.avgDurationHours || 0).color
              }}>
                {formatDuration(stats?.avgDurationHours || 0)}
              </div>
              <div style={styles.statLabel}>Avg Time</div>
            </div>
          </div>
        </div>

        {/* Average Time Display */}
        {stats && (
          <div style={styles.avgDisplay}>
            <div style={{
              ...styles.avgValue,
              color: getTimeBand(stats.avgDurationHours).color
            }}>
              {formatDuration(stats.avgDurationHours)}
            </div>
            <div style={styles.avgLabel}>Average Fix Time (Weighted)</div>
            <div style={{
              ...styles.targetIndicator,
              color: stats.avgDurationHours <= thresholdHours ? '#22c55e' : '#ef4444'
            }}>
              {stats.avgDurationHours <= thresholdHours ? (
                <>
                  <CheckCircle2 size={14} />
                  Within {thresholdHours}-hour target
                </>
              ) : (
                <>
                  <AlertTriangle size={14} />
                  {formatDuration(stats.avgDurationHours - thresholdHours)} over target
                </>
              )}
            </div>
            <div style={styles.timeBands}>
              {Object.values(TIME_BANDS).map((band, i) => (
                <div key={i} style={styles.timeBand}>
                  <div style={{...styles.timeBandDot, background: band.color}} />
                  <span style={{color: 'var(--text-secondary)'}}>{band.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Station Breakdown */}
        {stats?.byStation && Object.keys(stats.byStation).length > 0 && (
          <div style={styles.stationBreakdown}>
            <h4 style={styles.sectionTitle}>By Station</h4>
            <div style={styles.stationGrid}>
              {Object.entries(stats.byStation).map(([stationId, data]) => {
                const band = getTimeBand(data.avgHours);
                return (
                  <div key={stationId} style={styles.stationCard}>
                    <div style={styles.stationName}>{data.name}</div>
                    <div style={{...styles.stationAvg, color: band.color}}>
                      {formatDuration(data.avgHours)}
                    </div>
                    <div style={styles.stationCount}>{data.count} defects</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter */}
        {!compact && stations.length > 0 && (
          <div style={{...styles.filterBar, marginTop: 'var(--space-lg)'}}>
            <select
              style={styles.filterSelect}
              value={selectedStation}
              onChange={e => setSelectedStation(e.target.value)}
            >
              <option value="all">All Stations</option>
              {stations.map(station => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Defect List */}
        <div style={styles.cycleList}>
          {loading ? (
            <div style={styles.emptyState}>Loading defect cycles...</div>
          ) : filteredCycles.length === 0 ? (
            <div style={styles.emptyState}>
              <Wrench size={40} style={{marginBottom: 'var(--space-sm)', opacity: 0.5}} />
              <p>No defects to track</p>
              <p style={{fontSize: '0.875rem'}}>Quality is looking good!</p>
            </div>
          ) : (
            filteredCycles.map(cycle => {
              const band = getTimeBand(cycle.duration_hours);
              return (
                <div
                  key={cycle.id}
                  style={{
                    ...styles.cycleCard,
                    borderColor: cycle.is_ongoing ? 'rgba(239, 68, 68, 0.3)' : 'transparent'
                  }}
                  onClick={() => onDefectClick && onDefectClick(cycle)}
                  onMouseOver={(e) => {
                    if (!cycle.is_ongoing) {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!cycle.is_ongoing) {
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <div style={styles.cycleHeader}>
                    <div>
                      <span style={styles.cycleModule}>
                        {cycle.module?.serial_number || 'Unknown Module'}
                      </span>
                      {cycle.module?.name && (
                        <span style={{
                          marginLeft: 'var(--space-sm)',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)'
                        }}>
                          {cycle.module.name}
                        </span>
                      )}
                    </div>
                    <span style={{
                      ...styles.cycleDuration,
                      background: `${band.color}20`,
                      color: band.color
                    }}>
                      <Clock size={14} />
                      {formatDuration(cycle.duration_hours)}
                    </span>
                  </div>
                  <div style={styles.cycleMeta}>
                    <span style={{
                      ...styles.stationBadge,
                      background: cycle.station?.color ? `${cycle.station.color}20` : 'var(--bg-tertiary)',
                      color: cycle.station?.color || 'var(--text-secondary)'
                    }}>
                      {cycle.station?.name || 'Unknown Station'}
                    </span>
                    {cycle.is_ongoing ? (
                      <span style={styles.ongoingBadge}>
                        <Activity size={10} />
                        In Progress
                      </span>
                    ) : (
                      <span style={{color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <CheckCircle2 size={12} />
                        Fixed
                      </span>
                    )}
                    {cycle.defects && cycle.defects.length > 0 && (
                      <span style={{color: 'var(--text-tertiary)'}}>
                        {cycle.defects.length} {cycle.defects.length === 1 ? 'defect' : 'defects'}
                      </span>
                    )}
                    <span style={{color: 'var(--text-tertiary)', fontSize: '0.75rem'}}>
                      {new Date(cycle.hold_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
