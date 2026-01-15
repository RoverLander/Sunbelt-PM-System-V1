// ============================================================================
// OEECalculator.jsx - OEE Live Calculator (PGM-019)
// ============================================================================
// Overall Equipment Effectiveness calculator showing Availability × Performance × Quality.
//
// Props:
// - factoryId: Factory UUID (required)
// - targetOEE: Target OEE percentage (default: 75)
// - compact: Boolean for dashboard widget mode (default: false)
// - showBreakdown: Boolean to show detailed breakdown (default: true)
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Gauge,
  Clock,
  Zap,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Calendar,
  ChevronRight,
  Info,
  AlertTriangle
} from 'lucide-react';
import { calculateOEE } from '../../services/efficiencyService';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

const OEE_THRESHOLDS = {
  worldClass: 85,
  good: 75,
  acceptable: 65,
  poor: 50
};

const TIME_RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: '30d', label: 'Last 30 Days' }
];

export default function OEECalculator({
  factoryId,
  targetOEE = 75,
  compact = false,
  showBreakdown = true
}) {
  // State
  const [oeeData, setOeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');

  // Get date range
  const getDateRange = (range) => {
    const now = new Date();
    switch (range) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case '30d':
        return { start: subDays(now, 30), end: now };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  // Fetch data callback
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(timeRange);
      const { data, error } = await calculateOEE(factoryId, start, end);
      if (error) throw error;
      setOeeData(data);
    } catch (error) {
      console.error('Error fetching OEE data:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId, timeRange]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if (factoryId) {
      fetchData();
    }
  }, [factoryId, fetchData]);

  // Get OEE status and color
  const getOEEStatus = (oee) => {
    if (oee >= OEE_THRESHOLDS.worldClass) return { label: 'World Class', color: '#22c55e' };
    if (oee >= OEE_THRESHOLDS.good) return { label: 'Good', color: '#84cc16' };
    if (oee >= OEE_THRESHOLDS.acceptable) return { label: 'Acceptable', color: '#f59e0b' };
    if (oee >= OEE_THRESHOLDS.poor) return { label: 'Needs Work', color: '#f97316' };
    return { label: 'Critical', color: '#ef4444' };
  };

  // Get component color
  const getComponentColor = (value) => {
    if (value >= 90) return '#22c55e';
    if (value >= 75) return '#84cc16';
    if (value >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // Format percentage
  const formatPercent = (value) => {
    return `${Math.round(value * 10) / 10}%`;
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
    timeRangeTabs: {
      display: 'flex',
      gap: 'var(--space-xs)',
      background: 'var(--bg-primary)',
      padding: '2px',
      borderRadius: 'var(--radius-md)'
    },
    timeRangeTab: {
      padding: 'var(--space-xs) var(--space-sm)',
      background: 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    timeRangeTabActive: {
      background: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
      fontWeight: '500'
    },
    content: {
      padding: compact ? 'var(--space-md)' : 'var(--space-lg)'
    },
    gaugeContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: compact ? 'var(--space-md)' : 'var(--space-xl)',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 'var(--space-lg)'
    },
    gaugeWrapper: {
      position: 'relative',
      width: compact ? '120px' : '180px',
      height: compact ? '80px' : '120px',
      marginBottom: 'var(--space-md)'
    },
    gaugeSvg: {
      width: '100%',
      height: '100%',
      overflow: 'visible'
    },
    oeeValue: {
      fontSize: compact ? '2rem' : '3rem',
      fontWeight: '700',
      lineHeight: 1
    },
    oeeLabel: {
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      marginBottom: 'var(--space-xs)'
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '0.8125rem',
      fontWeight: '500'
    },
    targetIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      marginTop: 'var(--space-sm)',
      fontSize: '0.8125rem',
      color: 'var(--text-secondary)'
    },
    componentsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 'var(--space-md)',
      marginBottom: 'var(--space-lg)'
    },
    componentCard: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)',
      textAlign: 'center'
    },
    componentIcon: {
      width: '36px',
      height: '36px',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto var(--space-sm)'
    },
    componentValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: 'var(--space-xs)'
    },
    componentLabel: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    breakdownSection: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)'
    },
    breakdownTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-sm)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)'
    },
    breakdownRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'var(--space-xs) 0',
      fontSize: '0.8125rem',
      borderBottom: '1px solid var(--border-primary)'
    },
    breakdownLabel: {
      color: 'var(--text-secondary)'
    },
    breakdownValue: {
      fontWeight: '500',
      color: 'var(--text-primary)'
    },
    formula: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-sm)',
      padding: 'var(--space-md)',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 'var(--space-lg)',
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      flexWrap: 'wrap'
    },
    formulaPart: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    emptyState: {
      textAlign: 'center',
      padding: 'var(--space-xl)',
      color: 'var(--text-secondary)'
    }
  };

  // Render gauge arc
  const renderGauge = (value, size = 180) => {
    const status = getOEEStatus(value);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 15;
    const strokeWidth = 12;

    // Calculate arc path
    const startAngle = -180;
    const endAngle = 0;
    const valueAngle = startAngle + ((value / 100) * (endAngle - startAngle));

    const polarToCartesian = (cx, cy, r, angle) => {
      const rad = (angle * Math.PI) / 180;
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
      };
    };

    const describeArc = (cx, cy, r, startAng, endAng) => {
      const start = polarToCartesian(cx, cy, r, endAng);
      const end = polarToCartesian(cx, cy, r, startAng);
      const largeArcFlag = endAng - startAng <= 180 ? '0' : '1';
      return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    };

    return (
      <svg
        width={size}
        height={size / 1.5}
        viewBox={`0 0 ${size} ${size / 1.5}`}
        style={styles.gaugeSvg}
      >
        {/* Background arc */}
        <path
          d={describeArc(centerX, centerY, radius, startAngle, endAngle)}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={describeArc(centerX, centerY, radius, startAngle, valueAngle)}
          fill="none"
          stroke={status.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ transition: 'all 0.5s ease' }}
        />
        {/* Target marker */}
        {(() => {
          const targetAngle = startAngle + ((targetOEE / 100) * (endAngle - startAngle));
          const targetPos = polarToCartesian(centerX, centerY, radius, targetAngle);
          return (
            <circle
              cx={targetPos.x}
              cy={targetPos.y}
              r={4}
              fill="var(--text-secondary)"
            />
          );
        })()}
      </svg>
    );
  };

  // Render compact version
  if (compact) {
    const status = oeeData ? getOEEStatus(oeeData.oee) : { label: '-', color: '#6b7280' };

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>
            <Gauge size={18} style={styles.headerIcon} />
            OEE
          </h3>
          <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
            {TIME_RANGES.find(r => r.id === timeRange)?.label || 'Today'}
          </span>
        </div>

        <div style={styles.content}>
          <div style={styles.gaugeContainer}>
            {loading ? (
              <div style={{color: 'var(--text-secondary)'}}>Loading...</div>
            ) : oeeData ? (
              <>
                {renderGauge(oeeData.oee, 120)}
                <div style={{...styles.oeeValue, color: status.color}}>
                  {formatPercent(oeeData.oee)}
                </div>
                <div style={{
                  ...styles.statusBadge,
                  background: `${status.color}20`,
                  color: status.color
                }}>
                  {status.label}
                </div>
              </>
            ) : (
              <div style={{color: 'var(--text-secondary)'}}>No data</div>
            )}
          </div>

          {/* Mini components */}
          {oeeData && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-xs)',
              textAlign: 'center',
              fontSize: '0.75rem'
            }}>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: getComponentColor(oeeData.availability)
                }}>
                  {formatPercent(oeeData.availability)}
                </div>
                <div style={{color: 'var(--text-tertiary)'}}>Avail.</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: getComponentColor(oeeData.performance)
                }}>
                  {formatPercent(oeeData.performance)}
                </div>
                <div style={{color: 'var(--text-tertiary)'}}>Perf.</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: getComponentColor(oeeData.quality)
                }}>
                  {formatPercent(oeeData.quality)}
                </div>
                <div style={{color: 'var(--text-tertiary)'}}>Quality</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full version
  const status = oeeData ? getOEEStatus(oeeData.oee) : { label: '-', color: '#6b7280' };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>
          <Gauge size={20} style={styles.headerIcon} />
          OEE Live Calculator
        </h3>
        <div style={styles.timeRangeTabs}>
          {TIME_RANGES.map(range => (
            <button
              key={range.id}
              style={{
                ...styles.timeRangeTab,
                ...(timeRange === range.id ? styles.timeRangeTabActive : {})
              }}
              onClick={() => setTimeRange(range.id)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.emptyState}>Calculating OEE...</div>
        ) : !oeeData ? (
          <div style={styles.emptyState}>
            <Gauge size={40} style={{marginBottom: 'var(--space-sm)', opacity: 0.5}} />
            <p>No data available</p>
          </div>
        ) : (
          <>
            {/* Main Gauge */}
            <div style={styles.gaugeContainer}>
              {renderGauge(oeeData.oee, 180)}
              <div style={{...styles.oeeValue, color: status.color}}>
                {formatPercent(oeeData.oee)}
              </div>
              <div style={styles.oeeLabel}>Overall Equipment Effectiveness</div>
              <div style={{
                ...styles.statusBadge,
                background: `${status.color}20`,
                color: status.color
              }}>
                {status.label}
              </div>
              <div style={styles.targetIndicator}>
                <Target size={14} />
                Target: {targetOEE}%
                {oeeData.oee >= targetOEE ? (
                  <span style={{color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <TrendingUp size={14} />
                    +{formatPercent(oeeData.oee - targetOEE)} above
                  </span>
                ) : (
                  <span style={{color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <TrendingDown size={14} />
                    {formatPercent(targetOEE - oeeData.oee)} below
                  </span>
                )}
              </div>
            </div>

            {/* Formula */}
            <div style={styles.formula}>
              <span style={styles.formulaPart}>
                <Clock size={14} />
                Availability
              </span>
              <span>×</span>
              <span style={styles.formulaPart}>
                <Zap size={14} />
                Performance
              </span>
              <span>×</span>
              <span style={styles.formulaPart}>
                <CheckCircle2 size={14} />
                Quality
              </span>
              <span>=</span>
              <span style={{fontWeight: '600', color: status.color}}>OEE</span>
            </div>

            {/* Component Cards */}
            <div style={styles.componentsGrid}>
              <div style={styles.componentCard}>
                <div style={{
                  ...styles.componentIcon,
                  background: `${getComponentColor(oeeData.availability)}20`
                }}>
                  <Clock size={18} color={getComponentColor(oeeData.availability)} />
                </div>
                <div style={{
                  ...styles.componentValue,
                  color: getComponentColor(oeeData.availability)
                }}>
                  {formatPercent(oeeData.availability)}
                </div>
                <div style={styles.componentLabel}>Availability</div>
                <div style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)',
                  marginTop: 'var(--space-xs)'
                }}>
                  Actual / Planned Time
                </div>
              </div>
              <div style={styles.componentCard}>
                <div style={{
                  ...styles.componentIcon,
                  background: `${getComponentColor(oeeData.performance)}20`
                }}>
                  <Zap size={18} color={getComponentColor(oeeData.performance)} />
                </div>
                <div style={{
                  ...styles.componentValue,
                  color: getComponentColor(oeeData.performance)
                }}>
                  {formatPercent(oeeData.performance)}
                </div>
                <div style={styles.componentLabel}>Performance</div>
                <div style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)',
                  marginTop: 'var(--space-xs)'
                }}>
                  Expected / Actual Cycle
                </div>
              </div>
              <div style={styles.componentCard}>
                <div style={{
                  ...styles.componentIcon,
                  background: `${getComponentColor(oeeData.quality)}20`
                }}>
                  <CheckCircle2 size={18} color={getComponentColor(oeeData.quality)} />
                </div>
                <div style={{
                  ...styles.componentValue,
                  color: getComponentColor(oeeData.quality)
                }}>
                  {formatPercent(oeeData.quality)}
                </div>
                <div style={styles.componentLabel}>Quality</div>
                <div style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)',
                  marginTop: 'var(--space-xs)'
                }}>
                  Good / Total Units
                </div>
              </div>
            </div>

            {/* Breakdown */}
            {showBreakdown && oeeData.breakdown && (
              <div style={styles.breakdownSection}>
                <h4 style={styles.breakdownTitle}>
                  <Info size={14} />
                  Detailed Breakdown
                </h4>
                <div style={styles.breakdownRow}>
                  <span style={styles.breakdownLabel}>Actual Hours Worked</span>
                  <span style={styles.breakdownValue}>{oeeData.breakdown.actualHours}h</span>
                </div>
                <div style={styles.breakdownRow}>
                  <span style={styles.breakdownLabel}>Expected Hours</span>
                  <span style={styles.breakdownValue}>{oeeData.breakdown.expectedHours}h</span>
                </div>
                <div style={styles.breakdownRow}>
                  <span style={styles.breakdownLabel}>Expected Cycle Time</span>
                  <span style={styles.breakdownValue}>{oeeData.breakdown.expectedCycleTime}h</span>
                </div>
                <div style={styles.breakdownRow}>
                  <span style={styles.breakdownLabel}>Actual Cycle Time</span>
                  <span style={styles.breakdownValue}>{oeeData.breakdown.actualCycleTime}h</span>
                </div>
                <div style={styles.breakdownRow}>
                  <span style={styles.breakdownLabel}>Total Inspections</span>
                  <span style={styles.breakdownValue}>{oeeData.breakdown.totalInspections}</span>
                </div>
                <div style={{...styles.breakdownRow, borderBottom: 'none'}}>
                  <span style={styles.breakdownLabel}>Passed Inspections</span>
                  <span style={{...styles.breakdownValue, color: '#22c55e'}}>
                    {oeeData.breakdown.passedInspections}
                  </span>
                </div>
              </div>
            )}

            {/* World Class Reference */}
            <div style={{
              marginTop: 'var(--space-lg)',
              padding: 'var(--space-md)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)'
            }}>
              <strong>OEE Benchmarks:</strong> World Class ≥85% | Good ≥75% | Acceptable ≥65% | Average ~60%
            </div>
          </>
        )}
      </div>
    </div>
  );
}
