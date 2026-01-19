// ============================================================================
// ITSparkline.jsx - Mini SVG Line Chart
// ============================================================================
// Lightweight sparkline chart for showing trends without external libraries
// ============================================================================

import React, { useMemo } from 'react';

function ITSparkline({
  data = [], // Array of numbers
  width = 100,
  height = 30,
  color = '#3b82f6',
  showArea = true,
  showDots = false,
  strokeWidth = 2,
  animated = true
}) {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return { line: '', area: '' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create line path
    const linePath = points.reduce((acc, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, '');

    // Create area path (closed shape for gradient fill)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return { line: linePath, area: areaPath, points };
  }, [data, width, height]);

  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height}>
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-tertiary)"
          fontSize="10"
        >
          No data
        </text>
      </svg>
    );
  }

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showArea && (
        <path
          d={pathData.area}
          fill={`url(#sparkline-gradient-${color.replace('#', '')})`}
          style={animated ? { animation: 'fadeIn 0.5s ease-out' } : {}}
        />
      )}

      {/* Line */}
      <path
        d={pathData.line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={animated ? {
          strokeDasharray: 1000,
          strokeDashoffset: 1000,
          animation: 'sparklineDraw 1s ease-out forwards'
        } : {}}
      />

      {/* Dots at data points */}
      {showDots && pathData.points && pathData.points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={3}
          fill={color}
          style={animated ? { animation: `fadeIn 0.3s ease-out ${index * 0.1}s forwards`, opacity: 0 } : {}}
        />
      ))}

      {/* End dot (current value) */}
      {pathData.points && pathData.points.length > 0 && (
        <circle
          cx={pathData.points[pathData.points.length - 1].x}
          cy={pathData.points[pathData.points.length - 1].y}
          r={4}
          fill={color}
          stroke="var(--bg-secondary)"
          strokeWidth={2}
        />
      )}

      <style>{`
        @keyframes sparklineDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      `}</style>
    </svg>
  );
}

export default ITSparkline;
