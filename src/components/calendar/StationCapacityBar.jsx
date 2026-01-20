import React from 'react';

/**
 * StationCapacityBar - Visual indicator showing station capacity utilization
 *
 * @param {number} current - Current number of modules at station
 * @param {number} capacity - Maximum capacity of station
 * @param {string} color - Bar color
 */
function StationCapacityBar({
  current = 0,
  capacity = 4,
  color = 'var(--sunbelt-orange)'
}) {
  const percentage = capacity > 0 ? Math.min(100, (current / capacity) * 100) : 0;

  // Determine color based on utilization
  const getBarColor = () => {
    if (percentage >= 90) return 'var(--danger)';
    if (percentage >= 70) return 'var(--warning)';
    return color;
  };

  const barColor = getBarColor();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {/* Capacity Text */}
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: percentage >= 90 ? 'var(--danger)' : 'var(--text-secondary)',
          minWidth: '45px'
        }}
      >
        {current}/{capacity}
      </span>

      {/* Progress Bar */}
      <div
        style={{
          flex: 1,
          height: '6px',
          background: 'var(--bg-tertiary)',
          borderRadius: '3px',
          overflow: 'hidden',
          maxWidth: '100px'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: barColor,
            borderRadius: '3px',
            transition: 'width 0.3s ease, background 0.3s ease'
          }}
        />
      </div>

      {/* Percentage */}
      <span
        style={{
          fontSize: '0.625rem',
          color: 'var(--text-tertiary)',
          minWidth: '32px',
          textAlign: 'right'
        }}
      >
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

export default StationCapacityBar;
