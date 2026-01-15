// ============================================================================
// CrossTrainingMatrix.jsx - Cross-Training Matrix (PGM-020)
// ============================================================================
// Grid showing worker vs station certifications with proficiency levels.
//
// Props:
// - factoryId: Factory UUID (required)
// - compact: Boolean for dashboard widget mode (default: false)
// - showMetrics: Boolean to show performance metrics (default: true)
// - onCertify: Callback when certifying a worker
// - onCellClick: Callback when clicking a certification cell
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Star,
  Clock,
  AlertTriangle,
  Plus,
  ChevronRight,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { getCrossTrainingMatrix, updateCrossTraining, removeCrossTraining } from '../../services/efficiencyService';

const PROFICIENCY_LEVELS = {
  Basic: { color: '#f59e0b', icon: '★', label: 'Basic' },
  Intermediate: { color: '#22c55e', icon: '★★', label: 'Intermediate' },
  Expert: { color: '#6366f1', icon: '★★★', label: 'Expert' }
};

export default function CrossTrainingMatrix({
  factoryId,
  compact = false,
  showMetrics = true, // eslint-disable-line no-unused-vars
  onCertify,
  onCellClick
}) {
  // State
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showCertifyModal, setShowCertifyModal] = useState(false);
  const [certifyStation, setCertifyStation] = useState(null);

  // Fetch data callback
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getCrossTrainingMatrix(factoryId);
      if (error) throw error;
      setMatrixData(data);
    } catch (error) {
      console.error('Error fetching cross-training data:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId]);

  // Fetch data on mount and when factory changes
  useEffect(() => {
    if (factoryId) {
      fetchData();
    }
  }, [factoryId, fetchData]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!matrixData) return { avgFlex: 0, lowFlexStations: 0 };

    const flexValues = Object.values(matrixData.stationFlex).map(s => s.flexPercent);
    const avgFlex = flexValues.length > 0
      ? Math.round(flexValues.reduce((a, b) => a + b, 0) / flexValues.length)
      : 0;

    const lowFlexStations = flexValues.filter(f => f < 30).length;

    return { avgFlex, lowFlexStations };
  }, [matrixData]);

  // Handle certify
  const handleCertify = async (workerId, stationId, level = 'Basic') => {
    if (onCertify) {
      onCertify(workerId, stationId, level);
      return;
    }

    try {
      await updateCrossTraining(workerId, stationId, {
        proficiency_level: level
      });
      fetchData();
    } catch (error) {
      console.error('Error certifying worker:', error);
    }
  };

  // Handle remove certification - available for future UI implementation
  // eslint-disable-next-line no-unused-vars
  const handleRemoveCert = async (workerId, stationId) => {
    try {
      await removeCrossTraining(workerId, stationId);
      fetchData();
    } catch (error) {
      console.error('Error removing certification:', error);
    }
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
      color: '#6366f1'
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
    matrixContainer: {
      overflowX: 'auto'
    },
    matrixTable: {
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
      transition: 'all 0.15s ease'
    },
    cellContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '40px',
      minHeight: '32px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: '500',
      position: 'relative'
    },
    certified: {
      background: 'rgba(34, 197, 94, 0.15)'
    },
    notCertified: {
      background: 'var(--bg-tertiary)'
    },
    certBadge: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px'
    },
    flexFooter: {
      borderTop: '2px solid var(--border-primary)'
    },
    flexCell: {
      padding: 'var(--space-sm)',
      textAlign: 'center',
      fontSize: '0.75rem',
      fontWeight: '600',
      background: 'var(--bg-tertiary)'
    },
    legend: {
      display: 'flex',
      gap: 'var(--space-lg)',
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
      fontSize: '0.75rem'
    },
    stationFlexSection: {
      marginTop: 'var(--space-lg)'
    },
    sectionTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-sm)'
    },
    flexGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: 'var(--space-sm)'
    },
    flexCard: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-sm)',
      textAlign: 'center'
    },
    flexBar: {
      height: '4px',
      background: 'var(--bg-tertiary)',
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: 'var(--space-xs)'
    },
    flexBarFill: {
      height: '100%',
      borderRadius: '2px',
      transition: 'width 0.3s ease'
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
    }
  };

  const getFlexColor = (percent) => {
    if (percent >= 70) return '#22c55e';
    if (percent >= 40) return '#f59e0b';
    return '#ef4444';
  };

  // Render compact version
  if (compact) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>
            <GraduationCap size={18} style={styles.headerIcon} />
            Cross-Training
          </h3>
        </div>

        <div style={styles.content}>
          {/* Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, background: 'rgba(34, 197, 94, 0.15)'}}>
                <Award size={18} color="#22c55e" />
              </div>
              <div>
                <div style={styles.statValue}>{matrixData?.totalCertifications || 0}</div>
                <div style={styles.statLabel}>Certs</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, background: 'rgba(99, 102, 241, 0.15)'}}>
                <TrendingUp size={18} color="#6366f1" />
              </div>
              <div>
                <div style={{...styles.statValue, color: getFlexColor(stats.avgFlex)}}>
                  {stats.avgFlex}%
                </div>
                <div style={styles.statLabel}>Avg Flex</div>
              </div>
            </div>
          </div>

          {/* Station flex preview */}
          {matrixData?.stationFlex && (
            <div style={styles.flexGrid}>
              {Object.values(matrixData.stationFlex).slice(0, 4).map(sf => (
                <div key={sf.station.id} style={styles.flexCard}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '2px'
                  }}>
                    {sf.station.code || sf.station.name?.slice(0, 6)}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: getFlexColor(sf.flexPercent)
                  }}>
                    {sf.flexPercent}%
                  </div>
                  <div style={styles.flexBar}>
                    <div style={{
                      ...styles.flexBarFill,
                      width: `${sf.flexPercent}%`,
                      background: getFlexColor(sf.flexPercent)
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.viewAllLink}>
            View Full Matrix <ChevronRight size={14} />
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
          <GraduationCap size={20} style={styles.headerIcon} />
          Cross-Training Matrix
        </h3>
        <div style={{display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
          {stats.lowFlexStations > 0 && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem'
            }}>
              <AlertTriangle size={12} />
              {stats.lowFlexStations} low-flex stations
            </span>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(99, 102, 241, 0.15)'}}>
              <Users size={20} color="#6366f1" />
            </div>
            <div>
              <div style={styles.statValue}>{matrixData?.totalWorkers || 0}</div>
              <div style={styles.statLabel}>Workers</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(34, 197, 94, 0.15)'}}>
              <Award size={20} color="#22c55e" />
            </div>
            <div>
              <div style={styles.statValue}>{matrixData?.totalCertifications || 0}</div>
              <div style={styles.statLabel}>Certifications</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(245, 158, 11, 0.15)'}}>
              <TrendingUp size={20} color="#f59e0b" />
            </div>
            <div>
              <div style={{...styles.statValue, color: getFlexColor(stats.avgFlex)}}>
                {stats.avgFlex}%
              </div>
              <div style={styles.statLabel}>Avg Flexibility</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(239, 68, 68, 0.15)'}}>
              <AlertTriangle size={20} color="#ef4444" />
            </div>
            <div>
              <div style={styles.statValue}>{stats.lowFlexStations}</div>
              <div style={styles.statLabel}>Low Flex Stations</div>
            </div>
          </div>
        </div>

        {/* Matrix */}
        {loading ? (
          <div style={styles.emptyState}>Loading matrix...</div>
        ) : !matrixData || matrixData.workers.length === 0 ? (
          <div style={styles.emptyState}>
            <GraduationCap size={40} style={{marginBottom: 'var(--space-sm)', opacity: 0.5}} />
            <p>No workers found</p>
          </div>
        ) : (
          <div style={styles.matrixContainer}>
            <table style={styles.matrixTable}>
              <thead>
                <tr>
                  <th style={{...styles.headerCell, ...styles.headerCellFirst}}>
                    Worker
                  </th>
                  {matrixData.stations?.map(station => (
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
                </tr>
              </thead>
              <tbody>
                {matrixData.workers.map(worker => {
                  const workerData = matrixData.matrix[worker.id];

                  return (
                    <tr key={worker.id} style={styles.workerRow}>
                      <td style={styles.workerCell}>
                        <div style={styles.workerName}>
                          <User size={14} color="var(--text-tertiary)" />
                          <span>{worker.full_name}</span>
                          {worker.is_lead && (
                            <span style={styles.leadBadge}>Lead</span>
                          )}
                        </div>
                      </td>
                      {matrixData.stations?.map(station => {
                        const cert = workerData?.certifications[station.id];
                        const isPrimary = worker.primary_station_id === station.id;
                        const level = cert?.level || null;
                        const levelConfig = level ? PROFICIENCY_LEVELS[level] : null;

                        return (
                          <td
                            key={station.id}
                            style={styles.dataCell}
                            onClick={() => {
                              if (onCellClick) {
                                onCellClick(worker, station, cert);
                              } else if (!cert?.certified) {
                                setSelectedWorker(worker);
                                setCertifyStation(station);
                                setShowCertifyModal(true);
                              }
                            }}
                          >
                            <div style={{
                              ...styles.cellContent,
                              ...(cert?.certified ? styles.certified : styles.notCertified),
                              border: isPrimary ? '2px solid var(--text-primary)' : 'none'
                            }}>
                              {cert?.certified ? (
                                <div style={styles.certBadge}>
                                  <span style={{color: levelConfig?.color || '#22c55e'}}>
                                    {levelConfig?.icon || '✓'}
                                  </span>
                                </div>
                              ) : (
                                <Plus size={12} color="var(--text-tertiary)" />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {/* Flex row */}
                <tr style={styles.flexFooter}>
                  <td style={{...styles.flexCell, textAlign: 'left', position: 'sticky', left: 0}}>
                    <strong>Station Flexibility</strong>
                  </td>
                  {matrixData.stations?.map(station => {
                    const flex = matrixData.stationFlex[station.id];
                    return (
                      <td key={station.id} style={{
                        ...styles.flexCell,
                        color: getFlexColor(flex?.flexPercent || 0)
                      }}>
                        {flex?.flexPercent || 0}%
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <span style={{color: PROFICIENCY_LEVELS.Basic.color}}>★</span>
            <span style={{color: 'var(--text-secondary)'}}>Basic</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{color: PROFICIENCY_LEVELS.Intermediate.color}}>★★</span>
            <span style={{color: 'var(--text-secondary)'}}>Intermediate</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{color: PROFICIENCY_LEVELS.Expert.color}}>★★★</span>
            <span style={{color: 'var(--text-secondary)'}}>Expert</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--text-primary)',
              borderRadius: 'var(--radius-sm)'
            }} />
            <span style={{color: 'var(--text-secondary)'}}>Primary Station</span>
          </div>
        </div>

        {/* Station Flex Summary */}
        {matrixData?.stationFlex && (
          <div style={styles.stationFlexSection}>
            <h4 style={styles.sectionTitle}>Station Flexibility</h4>
            <div style={styles.flexGrid}>
              {Object.values(matrixData.stationFlex).map(sf => (
                <div key={sf.station.id} style={styles.flexCard}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    {sf.station.name}
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: getFlexColor(sf.flexPercent)
                  }}>
                    {sf.flexPercent}%
                  </div>
                  <div style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-tertiary)'
                  }}>
                    {sf.certifiedCount} of {matrixData.totalWorkers} certified
                  </div>
                  <div style={styles.flexBar}>
                    <div style={{
                      ...styles.flexBarFill,
                      width: `${sf.flexPercent}%`,
                      background: getFlexColor(sf.flexPercent)
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Certify Modal - simplified */}
      {showCertifyModal && selectedWorker && certifyStation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowCertifyModal(false)}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            maxWidth: '400px',
            width: '90%'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{margin: '0 0 var(--space-md)', color: 'var(--text-primary)'}}>
              Certify Worker
            </h3>
            <p style={{color: 'var(--text-secondary)', marginBottom: 'var(--space-md)'}}>
              Certify <strong>{selectedWorker.full_name}</strong> for <strong>{certifyStation.name}</strong>?
            </p>
            <div style={{display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap'}}>
              {Object.entries(PROFICIENCY_LEVELS).map(([level, config]) => (
                <button
                  key={level}
                  onClick={() => {
                    handleCertify(selectedWorker.id, certifyStation.id, level);
                    setShowCertifyModal(false);
                  }}
                  style={{
                    flex: 1,
                    padding: 'var(--space-sm)',
                    background: `${config.color}20`,
                    border: `1px solid ${config.color}`,
                    borderRadius: 'var(--radius-md)',
                    color: config.color,
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{fontWeight: '600'}}>{config.icon}</div>
                  <div>{config.label}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCertifyModal(false)}
              style={{
                width: '100%',
                marginTop: 'var(--space-md)',
                padding: 'var(--space-sm)',
                background: 'transparent',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
