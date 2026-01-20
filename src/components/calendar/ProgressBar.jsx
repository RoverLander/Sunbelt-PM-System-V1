import React from 'react';

/**
 * ProgressBar - A reusable progress bar component for the production calendar
 *
 * @param {number} value - Progress percentage (0-100)
 * @param {string} color - Progress bar color (CSS color value)
 * @param {string} size - Size variant: 'sm' | 'md' | 'lg'
 * @param {boolean} showLabel - Whether to show the percentage label
 * @param {string} label - Custom label text (overrides percentage display)
 * @param {boolean} animated - Whether to animate the bar fill
 * @param {string} bgColor - Background color for the track
 */
function ProgressBar({
  value = 0,
  color = 'var(--sunbelt-orange)',
  size = 'sm',
  showLabel = false,
  label = null,
  animated = false,
  bgColor = 'var(--bg-tertiary)',
  style = {}
}) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 4,
      borderRadius: 2,
      fontSize: '0.625rem'
    },
    md: {
      height: 8,
      borderRadius: 4,
      fontSize: '0.6875rem'
    },
    lg: {
      height: 12,
      borderRadius: 6,
      fontSize: '0.75rem'
    }
  };

  const config = sizeConfig[size] || sizeConfig.sm;

  // Determine color based on progress (optional status-based coloring)
  const getProgressColor = () => {
    if (color) return color;
    if (clampedValue >= 80) return 'var(--status-success)';
    if (clampedValue >= 50) return 'var(--status-warning)';
    return 'var(--status-error)';
  };

  const progressColor = getProgressColor();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        ...style
      }}
    >
      {/* Progress Track */}
      <div
        style={{
          flex: 1,
          height: config.height,
          background: bgColor,
          borderRadius: config.borderRadius,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Progress Fill */}
        <div
          style={{
            height: '100%',
            width: `${clampedValue}%`,
            background: progressColor,
            borderRadius: config.borderRadius,
            transition: animated ? 'width 0.3s ease' : 'none',
            position: 'relative'
          }}
        >
          {/* Optional shine effect */}
          {animated && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite'
              }}
            />
          )}
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <span
          style={{
            fontSize: config.fontSize,
            fontWeight: '600',
            color: 'var(--text-secondary)',
            minWidth: label ? 'auto' : '32px',
            textAlign: 'right',
            whiteSpace: 'nowrap'
          }}
        >
          {label || `${Math.round(clampedValue)}%`}
        </span>
      )}
    </div>
  );
}

/**
 * MiniProgressBar - Compact version for use in small cards
 */
export function MiniProgressBar({ value = 0, color = 'var(--sunbelt-orange)' }) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      style={{
        width: '100%',
        height: 3,
        background: 'rgba(0,0,0,0.1)',
        borderRadius: 1.5,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${clampedValue}%`,
          background: color,
          borderRadius: 1.5,
          transition: 'width 0.2s ease'
        }}
      />
    </div>
  );
}

export default ProgressBar;
