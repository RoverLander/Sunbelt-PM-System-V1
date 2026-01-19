// ============================================================================
// ITMiniChart.jsx - Mini Bar/Area Chart
// ============================================================================
// Lightweight mini chart for showing metrics in a compact space
// ============================================================================

import React, { useMemo } from 'react';

function ITMiniChart({
  data = [], // Array of numbers or { value: number, label?: string }
  type = 'bar', // 'bar' | 'area' | 'line'
  width = 120,
  height = 40,
  color = '#3b82f6',
  showValues = false,
  animated = true
}) {
  const values = useMemo(() => {
    return data.map(d => typeof d === 'number' ? d : d.value);
  }, [data]);

  const max = Math.max(...values, 1);
  const barWidth = Math.max((width / values.length) - 2, 4);
  const barGap = 2;

  // Generate bar chart
  const renderBars = () => {
    return values.map((value, index) => {
      const barHeight = (value / max) * (height - 8);
      const x = index * (barWidth + barGap);
      const y = height - barHeight - 4;

      return (
        <rect
          key={index}
          x={x}
          y={y}
          width={barWidth}
          height={barHeight}
          rx={2}
          fill={color}
          fillOpacity={0.8}
          style={animated ? {
            animation: `barGrow 0.5s ease-out ${index * 0.05}s backwards`
          } : {}}
        />
      );
    });
  };

  // Generate area/line chart
  const renderAreaLine = () => {
    if (values.length < 2) return null;

    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value / max) * (height - 8)) - 4;
      return { x, y };
    });

    const linePath = points.reduce((acc, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, '');

    const areaPath = `${linePath} L ${width} ${height - 4} L 0 ${height - 4} Z`;

    return (
      <>
        {type === 'area' && (
          <path
            d={areaPath}
            fill={`url(#mini-chart-gradient-${color.replace('#', '')})`}
            style={animated ? { animation: 'fadeIn 0.5s ease-out' } : {}}
          />
        )}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={animated ? {
            strokeDasharray: 500,
            strokeDashoffset: 500,
            animation: 'lineDraw 1s ease-out forwards'
          } : {}}
        />
        {/* End point dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={4}
            fill={color}
            stroke="var(--bg-secondary)"
            strokeWidth={2}
          />
        )}
      </>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`mini-chart-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {type === 'bar' ? renderBars() : renderAreaLine()}
      </svg>

      {showValues && values.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '-16px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.6rem',
          color: 'var(--text-tertiary)'
        }}>
          <span>{values[0]}</span>
          <span>{values[values.length - 1]}</span>
        </div>
      )}

      <style>{`
        @keyframes barGrow {
          from {
            transform: scaleY(0);
            transform-origin: bottom;
          }
          to {
            transform: scaleY(1);
          }
        }
        @keyframes lineDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ITMiniChart;
