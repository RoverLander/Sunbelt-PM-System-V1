// ============================================================================
// ITHealthGauge.jsx - Circular Health Score Gauge
// ============================================================================
// Displays a circular gauge showing system health (0-100%)
// ============================================================================

import React from 'react';

function ITHealthGauge({
  score = 0, // 0-100
  label = 'System Health',
  size = 'default', // 'small' | 'default' | 'large'
  showBreakdown = false,
  breakdown = [], // [{ label: 'Database', status: 'ok' | 'warning' | 'error' }]
  onClick
}) {
  const sizeConfig = {
    small: { radius: 40, stroke: 6, fontSize: '1.25rem', labelSize: '0.7rem' },
    default: { radius: 60, stroke: 8, fontSize: '1.75rem', labelSize: '0.8rem' },
    large: { radius: 80, stroke: 10, fontSize: '2.25rem', labelSize: '0.9rem' }
  };

  const config = sizeConfig[size] || sizeConfig.default;
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (value) => {
    if (value >= 90) return '#22c55e'; // Green
    if (value >= 70) return '#f59e0b'; // Yellow
    if (value >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#64748b';
    }
  };

  const color = getColor(score);
  const svgSize = (config.radius + config.stroke) * 2;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {/* Gauge Circle */}
      <div style={{ position: 'relative', width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={config.radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={config.stroke}
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={config.radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s' }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: config.fontSize,
            fontWeight: '700',
            color: 'var(--text-primary)',
            lineHeight: 1
          }}>
            {score}%
          </div>
          <div style={{
            fontSize: config.labelSize,
            color: 'var(--text-tertiary)',
            marginTop: '4px'
          }}>
            {label}
          </div>
        </div>
      </div>

      {/* Breakdown indicators */}
      {showBreakdown && breakdown.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '12px',
          justifyContent: 'center'
        }}>
          {breakdown.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getStatusColor(item.status)
              }} />
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ITHealthGauge;
