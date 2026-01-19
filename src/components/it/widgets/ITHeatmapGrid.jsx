// ============================================================================
// ITHeatmapGrid.jsx - Activity Heatmap Grid
// ============================================================================
// Displays a heatmap grid showing activity patterns (like GitHub contributions)
// ============================================================================

import React, { useState } from 'react';

function ITHeatmapGrid({
  data = [], // Array of { date: string, value: number, label?: string }
  weeks = 4,
  colorScale = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'], // GitHub-style greens
  cellSize = 12,
  cellGap = 3,
  showLabels = true,
  showTooltip = true,
  onCellClick
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Generate grid data for the last N weeks
  const generateGridData = () => {
    const grid = [];
    const today = new Date();
    const dataMap = new Map(data.map(d => [d.date, d]));

    for (let week = weeks - 1; week >= 0; week--) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + (6 - day)));
        const dateStr = date.toISOString().split('T')[0];
        const cellData = dataMap.get(dateStr);
        weekData.push({
          date: dateStr,
          value: cellData?.value || 0,
          label: cellData?.label || `${date.toLocaleDateString()}: No activity`
        });
      }
      grid.push(weekData);
    }
    return grid;
  };

  const gridData = generateGridData();

  // Get max value for scaling
  const maxValue = Math.max(...data.map(d => d.value), 1);

  // Get color based on value
  const getColor = (value) => {
    if (value === 0) return colorScale[0];
    const ratio = value / maxValue;
    const index = Math.min(Math.floor(ratio * (colorScale.length - 1)) + 1, colorScale.length - 1);
    return colorScale[index];
  };

  const gridWidth = weeks * (cellSize + cellGap) - cellGap;
  const gridHeight = 7 * (cellSize + cellGap) - cellGap;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Day labels */}
        {showLabels && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: cellGap,
            marginRight: '4px'
          }}>
            {days.map((day, index) => (
              <div
                key={day}
                style={{
                  height: cellSize,
                  fontSize: '0.65rem',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  width: '24px'
                }}
              >
                {index % 2 === 0 ? day : ''}
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        <svg
          width={gridWidth}
          height={gridHeight}
          style={{ overflow: 'visible' }}
        >
          {gridData.map((week, weekIndex) =>
            week.map((cell, dayIndex) => (
              <rect
                key={`${weekIndex}-${dayIndex}`}
                x={weekIndex * (cellSize + cellGap)}
                y={dayIndex * (cellSize + cellGap)}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={getColor(cell.value)}
                style={{
                  cursor: onCellClick ? 'pointer' : 'default',
                  transition: 'fill 0.2s ease'
                }}
                onMouseEnter={() => showTooltip && setHoveredCell({ ...cell, x: weekIndex, y: dayIndex })}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => onCellClick && onCellClick(cell)}
              />
            ))
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginTop: '8px',
        fontSize: '0.65rem',
        color: 'var(--text-tertiary)'
      }}>
        <span>Less</span>
        {colorScale.map((color, index) => (
          <div
            key={index}
            style={{
              width: cellSize - 2,
              height: cellSize - 2,
              borderRadius: '2px',
              background: color
            }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div style={{
          position: 'absolute',
          left: hoveredCell.x * (cellSize + cellGap) + cellSize + 8,
          top: hoveredCell.y * (cellSize + cellGap),
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '6px 10px',
          fontSize: '0.75rem',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: '600' }}>{hoveredCell.value} activities</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>
            {new Date(hoveredCell.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ITHeatmapGrid;
