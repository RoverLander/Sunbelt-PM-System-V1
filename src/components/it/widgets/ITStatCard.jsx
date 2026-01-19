// ============================================================================
// ITStatCard.jsx - KPI Stat Card with Trend Indicator
// ============================================================================
// Displays a single KPI metric with optional trend indicator and sparkline
// ============================================================================

import React from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function ITStatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = '#3b82f6',
  trend = null, // { value: number, direction: 'up' | 'down' | 'flat' }
  onClick,
  gradient,
  highlight = false,
  size = 'default' // 'compact' | 'default' | 'large'
}) {
  const sizeStyles = {
    compact: { padding: '12px', iconSize: 32, valueSize: '1.25rem', labelSize: '0.7rem' },
    default: { padding: '16px', iconSize: 36, valueSize: '1.5rem', labelSize: '0.75rem' },
    large: { padding: '20px', iconSize: 44, valueSize: '2rem', labelSize: '0.85rem' }
  };

  const sizes = sizeStyles[size] || sizeStyles.default;

  const getTrendIcon = () => {
    if (!trend) return null;
    const direction = trend.direction || (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'flat');
    switch (direction) {
      case 'up': return <TrendingUp size={14} />;
      case 'down': return <TrendingDown size={14} />;
      default: return <Minus size={14} />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'var(--text-tertiary)';
    const direction = trend.direction || (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'flat');
    // For error/issue metrics, down is good
    if (trend.invertColors) {
      return direction === 'down' ? '#22c55e' : direction === 'up' ? '#ef4444' : 'var(--text-tertiary)';
    }
    return direction === 'up' ? '#22c55e' : direction === 'down' ? '#ef4444' : 'var(--text-tertiary)';
  };

  return (
    <div
      onClick={onClick}
      style={{
        padding: sizes.padding,
        background: gradient || 'var(--bg-secondary)',
        borderRadius: '12px',
        border: highlight ? `1px solid ${color}` : '1px solid var(--border-color)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header Row: Icon + Trend/Arrow */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{
          width: sizes.iconSize,
          height: sizes.iconSize,
          borderRadius: '10px',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={sizes.iconSize * 0.5} style={{ color }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {trend && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.7rem',
              fontWeight: '600',
              color: getTrendColor()
            }}>
              {getTrendIcon()}
              {trend.value !== undefined && (
                <span>{Math.abs(trend.value)}%</span>
              )}
            </div>
          )}
          {onClick && (
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          )}
        </div>
      </div>

      {/* Value */}
      <div style={{
        fontSize: sizes.valueSize,
        fontWeight: '700',
        color: 'var(--text-primary)',
        lineHeight: 1.2
      }}>
        {value}
      </div>

      {/* Label */}
      <div style={{
        fontSize: sizes.labelSize,
        color: 'var(--text-secondary)',
        marginTop: '4px',
        fontWeight: '500'
      }}>
        {label}
      </div>

      {/* Sub Value */}
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

export default ITStatCard;
