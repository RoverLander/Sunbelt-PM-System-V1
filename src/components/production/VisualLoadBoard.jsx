// ============================================================================
// VisualLoadBoard.jsx - Visual Load Board (PGM-021)
// ============================================================================
// Real-time work queue visualization showing daily goal, pace, and status.
//
// Props:
// - factoryId: Factory UUID (required)
// - compact: Boolean for dashboard widget mode (default: false)
// - showPrint: Boolean to show print button (default: true)
// - onModuleClick: Callback when clicking a module
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pause,
  Play,
  ChevronRight,
  Printer,
  RefreshCw,
  Activity,
  Package,
  ArrowRight
} from 'lucide-react';
import { getLoadBoardData } from '../../services/efficiencyService';
import { format } from 'date-fns';

const PACE_CONFIG = {
  'on-track': { color: '#22c55e', icon: TrendingUp, label: 'On Track' },
  'behind': { color: '#f59e0b', icon: TrendingDown, label: 'Behind' },
  'at-risk': { color: '#ef4444', icon: AlertTriangle, label: 'At Risk' },
  'unknown': { color: '#6b7280', icon: Activity, label: 'Unknown' }
};

export default function VisualLoadBoard({
  factoryId,
  compact = false,
  showPrint = true,
  onModuleClick
}) {
  // State
  const [loadData, setLoadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch data callback
  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await getLoadBoardData(factoryId);
      if (error) throw error;
      setLoadData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching load board data:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId]);

  // Fetch data on mount and auto-refresh
  useEffect(() => {
    if (factoryId) {
      fetchData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [factoryId, fetchData]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Get pace config
  const paceConfig = loadData ? PACE_CONFIG[loadData.paceStatus] : PACE_CONFIG['unknown'];
  const PaceIcon = paceConfig.icon;

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
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    refreshButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: 'var(--space-xs) var(--space-sm)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-secondary)',
      fontSize: '0.75rem',
      cursor: 'pointer'
    },
    printButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: 'var(--space-xs) var(--space-sm)',
      background: '#6366f1',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      color: 'white',
      fontSize: '0.75rem',
      cursor: 'pointer'
    },
    content: {
      padding: compact ? 'var(--space-md)' : 'var(--space-lg)'
    },
    heroSection: {
      display: 'grid',
      gridTemplateColumns: compact ? '1fr' : 'repeat(3, 1fr)',
      gap: 'var(--space-lg)',
      marginBottom: 'var(--space-lg)'
    },
    heroCard: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      textAlign: 'center'
    },
    heroLabel: {
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      marginBottom: 'var(--space-sm)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    heroValue: {
      fontSize: compact ? '2.5rem' : '3.5rem',
      fontWeight: '700',
      lineHeight: 1
    },
    heroSublabel: {
      fontSize: '0.8125rem',
      color: 'var(--text-tertiary)',
      marginTop: 'var(--space-sm)'
    },
    progressSection: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      marginBottom: 'var(--space-lg)'
    },
    progressHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 'var(--space-md)'
    },
    progressTitle: {
      fontSize: '0.9375rem',
      fontWeight: '600',
      color: 'var(--text-primary)'
    },
    paceBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '0.8125rem',
      fontWeight: '500'
    },
    progressBar: {
      height: '16px',
      background: 'var(--bg-tertiary)',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
      marginBottom: 'var(--space-sm)'
    },
    progressFill: {
      height: '100%',
      borderRadius: '8px',
      transition: 'width 0.5s ease'
    },
    progressTarget: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '2px',
      background: 'var(--text-primary)',
      zIndex: 1
    },
    progressLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
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
    stationSection: {
      marginBottom: 'var(--space-lg)'
    },
    sectionTitle: {
      fontSize: '0.9375rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-md)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    stationGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: 'var(--space-sm)'
    },
    stationCard: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)',
      borderLeft: '4px solid'
    },
    stationName: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      marginBottom: 'var(--space-xs)'
    },
    stationCount: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: 'var(--text-primary)'
    },
    stationBreakdown: {
      display: 'flex',
      gap: 'var(--space-sm)',
      marginTop: 'var(--space-xs)',
      fontSize: '0.6875rem',
      color: 'var(--text-tertiary)'
    },
    nextUpSection: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)'
    },
    nextUpList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    },
    nextUpItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-sm)',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    moduleInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    moduleSerial: {
      fontWeight: '600',
      color: 'var(--text-primary)',
      fontSize: '0.875rem'
    },
    moduleName: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    },
    stationBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.6875rem',
      fontWeight: '500'
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
    timestamp: {
      fontSize: '0.6875rem',
      color: 'var(--text-tertiary)'
    }
  };

  // Render compact version
  if (compact) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>
            <LayoutGrid size={18} style={styles.headerIcon} />
            Load Board
          </h3>
          <span style={styles.timestamp}>
            {format(lastRefresh, 'HH:mm')}
          </span>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.emptyState}>Loading...</div>
          ) : loadData ? (
            <>
              {/* Hero Stats */}
              <div style={{...styles.heroSection, gridTemplateColumns: 'repeat(2, 1fr)'}}>
                <div style={styles.heroCard}>
                  <div style={styles.heroLabel}>Completed</div>
                  <div style={{...styles.heroValue, color: '#22c55e'}}>
                    {loadData.completed}
                  </div>
                  <div style={styles.heroSublabel}>of {loadData.target} target</div>
                </div>
                <div style={styles.heroCard}>
                  <div style={styles.heroLabel}>Pace</div>
                  <div style={{...styles.heroValue, color: paceConfig.color, fontSize: '2rem'}}>
                    {loadData.pace}%
                  </div>
                  <div style={{
                    ...styles.paceBadge,
                    background: `${paceConfig.color}20`,
                    color: paceConfig.color,
                    marginTop: 'var(--space-xs)',
                    justifyContent: 'center'
                  }}>
                    <PaceIcon size={12} />
                    {paceConfig.label}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${Math.min((loadData.completed / loadData.target) * 100, 100)}%`,
                  background: paceConfig.color
                }} />
                {loadData.expectedByNow > 0 && (
                  <div style={{
                    ...styles.progressTarget,
                    left: `${Math.min((loadData.expectedByNow / loadData.target) * 100, 100)}%`
                  }} />
                )}
              </div>

              {/* Quick Stats */}
              <div style={{display: 'flex', gap: 'var(--space-md)', fontSize: '0.75rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <Play size={12} color="#22c55e" />
                  <span>{loadData.totalInProgress} active</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <Clock size={12} color="#f59e0b" />
                  <span>{loadData.totalWaiting} waiting</span>
                </div>
                {loadData.totalOnHold > 0 && (
                  <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <Pause size={12} color="#ef4444" />
                    <span>{loadData.totalOnHold} on hold</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>No data available</div>
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
          <LayoutGrid size={20} style={styles.headerIcon} />
          Visual Load Board
        </h3>
        <div style={styles.headerActions}>
          <span style={styles.timestamp}>
            Last updated: {format(lastRefresh, 'HH:mm:ss')}
          </span>
          <button style={styles.refreshButton} onClick={fetchData}>
            <RefreshCw size={12} />
            Refresh
          </button>
          {showPrint && (
            <button style={styles.printButton} onClick={handlePrint}>
              <Printer size={12} />
              Print
            </button>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.emptyState}>Loading load board...</div>
        ) : !loadData ? (
          <div style={styles.emptyState}>
            <LayoutGrid size={40} style={{marginBottom: 'var(--space-sm)', opacity: 0.5}} />
            <p>No data available</p>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div style={styles.heroSection}>
              <div style={styles.heroCard}>
                <div style={styles.heroLabel}>Daily Target</div>
                <div style={{...styles.heroValue, color: 'var(--text-primary)'}}>
                  {loadData.target}
                </div>
                <div style={styles.heroSublabel}>modules</div>
              </div>
              <div style={styles.heroCard}>
                <div style={styles.heroLabel}>Completed</div>
                <div style={{...styles.heroValue, color: '#22c55e'}}>
                  {loadData.completed}
                </div>
                <div style={styles.heroSublabel}>
                  {loadData.target - loadData.completed} remaining
                </div>
              </div>
              <div style={styles.heroCard}>
                <div style={styles.heroLabel}>Current Pace</div>
                <div style={{...styles.heroValue, color: paceConfig.color}}>
                  {loadData.pace}%
                </div>
                <div style={{
                  ...styles.paceBadge,
                  background: `${paceConfig.color}20`,
                  color: paceConfig.color,
                  marginTop: 'var(--space-sm)',
                  justifyContent: 'center'
                }}>
                  <PaceIcon size={14} />
                  {paceConfig.label}
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div style={styles.progressSection}>
              <div style={styles.progressHeader}>
                <span style={styles.progressTitle}>Daily Progress</span>
                <span style={{fontSize: '0.8125rem', color: 'var(--text-secondary)'}}>
                  Expected by now: {loadData.expectedByNow} | Actual: {loadData.completed}
                </span>
              </div>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${Math.min((loadData.completed / loadData.target) * 100, 100)}%`,
                  background: paceConfig.color
                }} />
                {loadData.expectedByNow > 0 && (
                  <div
                    style={{
                      ...styles.progressTarget,
                      left: `${Math.min((loadData.expectedByNow / loadData.target) * 100, 100)}%`
                    }}
                    title={`Expected by now: ${loadData.expectedByNow}`}
                  />
                )}
              </div>
              <div style={styles.progressLabels}>
                <span>0</span>
                <span>{loadData.target} (Target)</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{...styles.statIcon, background: 'rgba(34, 197, 94, 0.15)'}}>
                  <Play size={20} color="#22c55e" />
                </div>
                <div>
                  <div style={styles.statValue}>{loadData.totalInProgress}</div>
                  <div style={styles.statLabel}>In Progress</div>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statIcon, background: 'rgba(245, 158, 11, 0.15)'}}>
                  <Clock size={20} color="#f59e0b" />
                </div>
                <div>
                  <div style={styles.statValue}>{loadData.totalWaiting}</div>
                  <div style={styles.statLabel}>Waiting</div>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statIcon, background: 'rgba(239, 68, 68, 0.15)'}}>
                  <Pause size={20} color="#ef4444" />
                </div>
                <div>
                  <div style={styles.statValue}>{loadData.totalOnHold}</div>
                  <div style={styles.statLabel}>On Hold</div>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statIcon, background: 'rgba(99, 102, 241, 0.15)'}}>
                  <CheckCircle2 size={20} color="#6366f1" />
                </div>
                <div>
                  <div style={styles.statValue}>{loadData.completed}</div>
                  <div style={styles.statLabel}>Completed</div>
                </div>
              </div>
            </div>

            {/* Station Queues */}
            {loadData.stationQueues && Object.keys(loadData.stationQueues).length > 0 && (
              <div style={styles.stationSection}>
                <h4 style={styles.sectionTitle}>
                  <Activity size={16} />
                  Station Queues
                </h4>
                <div style={styles.stationGrid}>
                  {Object.values(loadData.stationQueues)
                    .filter(sq => sq.count > 0)
                    .sort((a, b) => (a.station?.order_num || 99) - (b.station?.order_num || 99))
                    .map(sq => (
                      <div
                        key={sq.station.id}
                        style={{
                          ...styles.stationCard,
                          borderLeftColor: sq.station?.color || 'var(--text-tertiary)'
                        }}
                      >
                        <div style={styles.stationName}>{sq.station?.name}</div>
                        <div style={styles.stationCount}>{sq.count}</div>
                        <div style={styles.stationBreakdown}>
                          {sq.inProgress > 0 && (
                            <span style={{color: '#22c55e'}}>{sq.inProgress} active</span>
                          )}
                          {sq.waiting > 0 && (
                            <span style={{color: '#f59e0b'}}>{sq.waiting} waiting</span>
                          )}
                          {sq.onHold > 0 && (
                            <span style={{color: '#ef4444'}}>{sq.onHold} hold</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Next Up */}
            {loadData.nextUp && loadData.nextUp.length > 0 && (
              <div style={styles.nextUpSection}>
                <h4 style={styles.sectionTitle}>
                  <ArrowRight size={16} />
                  Next Up
                </h4>
                <div style={styles.nextUpList}>
                  {loadData.nextUp.map(module => (
                    <div
                      key={module.id}
                      style={styles.nextUpItem}
                      onClick={() => onModuleClick && onModuleClick(module)}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    >
                      <div style={styles.moduleInfo}>
                        <Package size={16} color="var(--text-tertiary)" />
                        <div>
                          <div style={styles.moduleSerial}>{module.serial_number}</div>
                          <div style={styles.moduleName}>
                            {module.project?.name || module.name}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        ...styles.stationBadge,
                        background: module.current_station?.color
                          ? `${module.current_station.color}20`
                          : 'var(--bg-tertiary)',
                        color: module.current_station?.color || 'var(--text-secondary)'
                      }}>
                        {module.current_station?.name || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Print styling info */}
            <div style={{
              marginTop: 'var(--space-lg)',
              padding: 'var(--space-sm)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)'
            }}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')} | Auto-refreshes every 30 seconds
            </div>
          </>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .load-board-print, .load-board-print * { visibility: visible; }
          .load-board-print { position: absolute; left: 0; top: 0; width: 100%; }
          button, .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
