// ============================================================================
// CrewUtilizationHeatmap.jsx - Crew Utilization Heatmap (PGM-018)
// ============================================================================
// Visual grid showing worker vs station utilization with color coding.
//
// Props:
// - factoryId: Factory UUID (required)
// - date: Date to show utilization for (default: today)
// - compact: Boolean for dashboard widget mode (default: false)
// - idleThreshold: Minutes before flagging as idle (default: 15)
// - showNames: Boolean to show worker names (default: true for GM, false for leads)
// - onCellClick: Callback when cell is clicked
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Coffee,
  CheckCircle2,
  Pause,
  User
} from 'lucide-react';
import { getCrewUtilization } from '../../services/efficiencyService';
import { format, addDays, subDays, isToday } from 'date-fns';

const STATUS_COLORS = {
  active: '#22c55e',
  idle: '#6b7280',
  wait: '#f59e0b',
  break: '#8b5cf6',
  absent: '#ef4444'
};

export default function CrewUtilizationHeatmap({
  factoryId,
  date: initialDate = new Date(),
  compact = false,
  idleThreshold = 15, // eslint-disable-line no-unused-vars
  showNames = true,
  onCellClick
}) {
  // State
  const [utilizationData, setUtilizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Fetch data callback
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getCrewUtilization(factoryId, currentDate);
      if (error) throw error;
      setUtilizationData(data);
    } catch (error) {
      console.error('Error fetching utilization data:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId, currentDate]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if (factoryId) {
      fetchData();
    }
  }, [factoryId, fetchData]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!utilizationData) return { active: 0, idle: 0, avgUtilization: 0 };

    const { workers, matrix } = utilizationData;
    let activeCount = 0;
    let totalMinutes = 0;
    let totalPossibleMinutes = 0;

    workers.forEach(worker => {
      const workerData = matrix[worker.id];
      if (workerData?.shift) {
        const shiftMinutes = (workerData.shift.totalHours || 8) * 60;
        totalPossibleMinutes += shiftMinutes;

        Object.values(workerData.stations).forEach(station => {
          totalMinutes += station.minutes || 0;
          if (station.minutes > 0) activeCount++;
        });
      }
    });

    return {
      active: activeCount,
      idle: workers.length - activeCount,
      avgUtilization: totalPossibleMinutes > 0
        ? Math.round((totalMinutes / totalPossibleMinutes) * 100)
        : 0,
      totalWorkers: workers.length
    };
  }, [utilizationData]);

  // Get cell color based on minutes
  const getCellColor = (minutes, maxMinutes = 60) => {
    if (minutes === 0) return 'var(--bg-tertiary)';
    const intensity = Math.min(minutes / maxMinutes, 1);
    const r = Math.round(34 + (0 - 34) * intensity);
    const g = Math.round(197 + (0 - 197) * intensity);
    const b = Math.round(94 + (0 - 94) * intensity);
    return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.7})`;
  };

  // Date navigation
  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

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
      color: '#6366f1'
    },
    dateNav: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    dateButton: {
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      padding: 'var(--space-xs)',
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    dateDisplay: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'var(--text-primary)',
      minWidth: '120px',
      textAlign: 'center'
    },
    todayButton: {
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      padding: 'var(--space-xs) var(--space-sm)',
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      fontSize: '0.75rem'
    },
    content: {
      padding: compact ? 'var(--space-md)' : 'var(--space-lg)'
    },
    statsRow: {
      display: 'flex',
      gap: 'var(--space-md)',
      marginBottom: 'var(--space-lg)',
      flexWrap: 'wrap'
    },
    statBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-xs) var(--space-sm)',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.8125rem'
    },
    heatmapContainer: {
      overflowX: 'auto'
    },
    heatmapTable: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '600px'
    },
    headerCell: {
      padding: 'var(--space-sm)',
      background: 'var(--bg-tertiary)',
      borderBottom: '1px solid var(--border-primary)',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--text-secondary)',
      textAlign: 'center',
      whiteSpace: 'nowrap'
    },
    headerCellFirst: {
      textAlign: 'left',
      position: 'sticky',
      left: 0,
      background: 'var(--bg-tertiary)',
      zIndex: 1
    },
    workerRow: {
      borderBottom: '1px solid var(--border-primary)'
    },
    workerCell: {
      padding: 'var(--space-sm)',
      fontSize: '0.8125rem',
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap',
      position: 'sticky',
      left: 0,
      background: 'var(--bg-secondary)',
      zIndex: 1,
      borderRight: '1px solid var(--border-primary)'
    },
    workerName: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)'
    },
    leadBadge: {
      background: 'rgba(99, 102, 241, 0.15)',
      color: '#6366f1',
      padding: '1px 4px',
      borderRadius: '4px',
      fontSize: '0.6875rem',
      fontWeight: '600'
    },
    dataCell: {
      padding: 'var(--space-xs)',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      position: 'relative'
    },
    cellContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '40px',
      minHeight: '32px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    tooltip: {
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-sm)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 100,
      whiteSpace: 'nowrap',
      fontSize: '0.75rem',
      marginBottom: 'var(--space-xs)'
    },
    legend: {
      display: 'flex',
      gap: 'var(--space-md)',
      justifyContent: 'center',
      marginTop: 'var(--space-lg)',
      padding: 'var(--space-sm)',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      flexWrap: 'wrap'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    },
    legendColor: {
      width: '12px',
      height: '12px',
      borderRadius: '2px'
    },
    emptyState: {
      textAlign: 'center',
      padding: 'var(--space-xl)',
      color: 'var(--text-secondary)'
    },
    utilizationBar: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      padding: 'var(--space-md)',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 'var(--space-lg)'
    },
    barTrack: {
      flex: 1,
      height: '8px',
      background: 'var(--bg-tertiary)',
      borderRadius: '4px',
      overflow: 'hidden'
    },
    barFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    },
    barLabel: {
      fontSize: '0.875rem',
      fontWeight: '600',
      minWidth: '50px',
      textAlign: 'right'
    }
  };

  // Render compact version
  if (compact) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>
            <Users size={18} style={styles.headerIcon} />
            Crew Utilization
          </h3>
          <span style={{fontSize: '0.8125rem', color: 'var(--text-secondary)'}}>
            {isToday(currentDate) ? 'Today' : format(currentDate, 'MMM d')}
          </span>
        </div>

        <div style={styles.content}>
          {/* Utilization Bar */}
          <div style={styles.utilizationBar}>
            <Activity size={16} color="#6366f1" />
            <div style={styles.barTrack}>
              <div style={{
                ...styles.barFill,
                width: `${stats.avgUtilization}%`,
                background: stats.avgUtilization >= 70 ? '#22c55e' :
                           stats.avgUtilization >= 40 ? '#f59e0b' : '#ef4444'
              }} />
            </div>
            <span style={{
              ...styles.barLabel,
              color: stats.avgUtilization >= 70 ? '#22c55e' :
                     stats.avgUtilization >= 40 ? '#f59e0b' : '#ef4444'
            }}>
              {stats.avgUtilization}%
            </span>
          </div>

          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statBadge}>
              <CheckCircle2 size={14} color="#22c55e" />
              <span>{stats.totalWorkers} workers</span>
            </div>
            <div style={styles.statBadge}>
              <Activity size={14} color="#6366f1" />
              <span>{stats.active} active</span>
            </div>
          </div>

          {/* Mini heatmap preview */}
          {utilizationData && utilizationData.workers.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(utilizationData.stations?.length || 6, 6)}, 1fr)`,
              gap: '2px',
              marginBottom: 'var(--space-sm)'
            }}>
              {utilizationData.stations?.slice(0, 6).map(station => (
                <div key={station.id} style={{
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  background: getCellColor(
                    utilizationData.workers.reduce((sum, w) =>
                      sum + (utilizationData.matrix[w.id]?.stations[station.id]?.minutes || 0), 0
                    ) / utilizationData.workers.length,
                    60
                  ),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-primary)',
                    fontWeight: '500'
                  }}>
                    {station.code?.slice(0, 4) || station.name?.slice(0, 4)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>
          <Users size={20} style={styles.headerIcon} />
          Crew Utilization Heatmap
        </h3>
        <div style={styles.dateNav}>
          <button style={styles.dateButton} onClick={goToPreviousDay}>
            <ChevronLeft size={16} />
          </button>
          <span style={styles.dateDisplay}>
            {isToday(currentDate) ? 'Today' : format(currentDate, 'MMM d, yyyy')}
          </span>
          <button style={styles.dateButton} onClick={goToNextDay}>
            <ChevronRight size={16} />
          </button>
          {!isToday(currentDate) && (
            <button style={styles.todayButton} onClick={goToToday}>
              Today
            </button>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {/* Utilization Summary */}
        <div style={styles.utilizationBar}>
          <span style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
            Overall Utilization
          </span>
          <div style={styles.barTrack}>
            <div style={{
              ...styles.barFill,
              width: `${stats.avgUtilization}%`,
              background: stats.avgUtilization >= 70 ? '#22c55e' :
                         stats.avgUtilization >= 40 ? '#f59e0b' : '#ef4444'
            }} />
          </div>
          <span style={{
            ...styles.barLabel,
            color: stats.avgUtilization >= 70 ? '#22c55e' :
                   stats.avgUtilization >= 40 ? '#f59e0b' : '#ef4444'
          }}>
            {stats.avgUtilization}%
          </span>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.statBadge}>
            <Users size={14} color="var(--text-secondary)" />
            <span>{stats.totalWorkers} workers</span>
          </div>
          <div style={styles.statBadge}>
            <Activity size={14} color="#22c55e" />
            <span style={{color: '#22c55e'}}>{stats.active} active</span>
          </div>
          <div style={styles.statBadge}>
            <Pause size={14} color="#6b7280" />
            <span style={{color: '#6b7280'}}>{stats.idle} idle</span>
          </div>
        </div>

        {/* Heatmap */}
        {loading ? (
          <div style={styles.emptyState}>Loading utilization data...</div>
        ) : !utilizationData || utilizationData.workers.length === 0 ? (
          <div style={styles.emptyState}>
            <Users size={40} style={{marginBottom: 'var(--space-sm)', opacity: 0.5}} />
            <p>No workers found</p>
          </div>
        ) : (
          <div style={styles.heatmapContainer}>
            <table style={styles.heatmapTable}>
              <thead>
                <tr>
                  <th style={{...styles.headerCell, ...styles.headerCellFirst}}>
                    Worker
                  </th>
                  {utilizationData.stations?.map(station => (
                    <th key={station.id} style={styles.headerCell}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: station.color || 'var(--text-tertiary)'
                        }} />
                        <span>{station.code || station.name?.slice(0, 6)}</span>
                      </div>
                    </th>
                  ))}
                  <th style={styles.headerCell}>Total</th>
                </tr>
              </thead>
              <tbody>
                {utilizationData.workers.map(worker => {
                  const workerData = utilizationData.matrix[worker.id];
                  const totalMinutes = Object.values(workerData?.stations || {})
                    .reduce((sum, s) => sum + (s.minutes || 0), 0);

                  return (
                    <tr key={worker.id} style={styles.workerRow}>
                      <td style={styles.workerCell}>
                        <div style={styles.workerName}>
                          <User size={14} color="var(--text-tertiary)" />
                          {showNames ? (
                            <span>{worker.full_name}</span>
                          ) : (
                            <span>{worker.employee_id}</span>
                          )}
                          {worker.is_lead && (
                            <span style={styles.leadBadge}>Lead</span>
                          )}
                        </div>
                      </td>
                      {utilizationData.stations?.map(station => {
                        const stationData = workerData?.stations[station.id];
                        const minutes = stationData?.minutes || 0;
                        const isHovered = hoveredCell?.worker === worker.id &&
                                         hoveredCell?.station === station.id;

                        return (
                          <td
                            key={station.id}
                            style={styles.dataCell}
                            onMouseEnter={() => setHoveredCell({ worker: worker.id, station: station.id })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => onCellClick && onCellClick(worker, station, stationData)}
                          >
                            <div style={{
                              ...styles.cellContent,
                              background: getCellColor(minutes, 120),
                              color: minutes > 60 ? 'white' : 'var(--text-primary)'
                            }}>
                              {minutes > 0 ? `${Math.round(minutes)}m` : '-'}
                            </div>
                            {isHovered && minutes > 0 && (
                              <div style={styles.tooltip}>
                                <div><strong>{worker.full_name}</strong></div>
                                <div>{station.name}</div>
                                <div style={{color: '#22c55e'}}>
                                  {Math.round(minutes)} minutes
                                </div>
                                {stationData?.assignments > 0 && (
                                  <div style={{color: 'var(--text-tertiary)'}}>
                                    {stationData.assignments} assignments
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td style={{
                        ...styles.dataCell,
                        background: 'var(--bg-tertiary)',
                        fontWeight: '600',
                        fontSize: '0.8125rem'
                      }}>
                        {Math.round(totalMinutes / 60 * 10) / 10}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, background: 'var(--bg-tertiary)'}} />
            <span>No time</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, background: getCellColor(30, 120)}} />
            <span>Low</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, background: getCellColor(60, 120)}} />
            <span>Medium</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, background: getCellColor(120, 120)}} />
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
