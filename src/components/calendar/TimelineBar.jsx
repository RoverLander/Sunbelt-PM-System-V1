import React, { useState } from 'react';
import { Flame, GripVertical } from 'lucide-react';
import { getModuleStatusColor, isModuleBehindSchedule, calculateProgressWidth } from './timelineUtils';

/**
 * TimelineBar - Individual module bar for the Gantt/Timeline view
 *
 * @param {Object} module - Module data object
 * @param {number} left - Left position in pixels
 * @param {number} width - Width in pixels
 * @param {boolean} draggable - Whether the bar is draggable
 * @param {function} onDragStart - Drag start handler
 * @param {function} onDragEnd - Drag end handler
 * @param {function} onResizeStart - Resize start handler
 * @param {function} onClick - Click handler
 * @param {function} onMouseEnter - Mouse enter handler for tooltip
 * @param {function} onMouseLeave - Mouse leave handler for tooltip
 */
function TimelineBar({
  module,
  left,
  width,
  draggable = false,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onClick,
  onMouseEnter,
  onMouseLeave
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!module) return null;

  const {
    id,
    serial_number,
    module_number,
    project,
    project_name,
    status = 'Not Started',
    is_rush = false,
    progress = 0,
    color
  } = module;

  const displayNumber = serial_number || module_number || 'Unknown';
  const displayProjectName = project?.name || project_name || '';
  const statusColor = color || getModuleStatusColor(status, is_rush);
  const isBehind = isModuleBehindSchedule(module);
  const progressWidth = calculateProgressWidth(module, width - 4); // Account for padding

  // Calculate bar height
  const barHeight = 32;

  // Drag handlers
  const handleDragStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    if (onDragStart) {
      onDragStart(e, module);
    }
    e.dataTransfer.setData('moduleId', id);
    e.dataTransfer.setData('moduleData', JSON.stringify(module));
    e.dataTransfer.setData('action', 'move');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd(e, module);
    }
  };

  // Resize handlers for left/right edges
  const handleResizeStart = (e, edge) => {
    e.stopPropagation();
    e.preventDefault();
    if (onResizeStart) {
      onResizeStart(e, module, edge);
    }
  };

  // Determine bar appearance based on state
  const getBarStyle = () => {
    let background = statusColor;
    let borderColor = statusColor;

    if (is_rush) {
      background = 'var(--danger)';
      borderColor = 'var(--danger)';
    } else if (isBehind) {
      borderColor = 'var(--danger)';
    }

    return {
      position: 'absolute',
      left: left,
      top: 4,
      width: width,
      height: barHeight,
      background: `${background}20`,
      border: `2px solid ${borderColor}`,
      borderRadius: '6px',
      cursor: draggable ? 'grab' : 'pointer',
      opacity: isDragging ? 0.5 : 1,
      transform: isDragging ? 'scale(0.98)' : isHovered ? 'scale(1.02)' : 'scale(1)',
      transition: isDragging ? 'none' : 'all 0.15s ease',
      boxShadow: isHovered ? 'var(--shadow-md)' : 'none',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      zIndex: isDragging ? 100 : isHovered ? 50 : 1
    };
  };

  return (
    <div
      data-module-bar="true"
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick(module, e);
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter && onMouseEnter(module, e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave && onMouseLeave(module, e);
      }}
      style={getBarStyle()}
    >
      {/* Progress Fill */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: progressWidth,
          background: is_rush ? 'var(--danger)' : statusColor,
          opacity: 0.4,
          transition: 'width 0.3s ease'
        }}
      />

      {/* Left Resize Handle */}
      {draggable && isHovered && (
        <div
          onMouseDown={(e) => handleResizeStart(e, 'left')}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '8px',
            cursor: 'ew-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '4px 0 0 4px'
          }}
        >
          <GripVertical size={10} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      )}

      {/* Bar Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 10px',
          position: 'relative',
          zIndex: 2,
          minWidth: 0 // Allow text truncation
        }}
      >
        {/* Rush indicator */}
        {is_rush && (
          <Flame
            size={14}
            style={{
              color: 'var(--danger)',
              flexShrink: 0
            }}
          />
        )}

        {/* Module number */}
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {displayNumber}
        </span>

        {/* Project name (if space allows) */}
        {width > 150 && displayProjectName && (
          <span
            style={{
              fontSize: '0.6875rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              opacity: 0.8
            }}
          >
            {displayProjectName}
          </span>
        )}

        {/* Progress text (if space allows) */}
        {width > 200 && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.625rem',
              fontWeight: '600',
              color: 'var(--text-tertiary)',
              flexShrink: 0
            }}
          >
            {Math.round(progress || 0)}%
          </span>
        )}
      </div>

      {/* Right Resize Handle */}
      {draggable && isHovered && (
        <div
          onMouseDown={(e) => handleResizeStart(e, 'right')}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '8px',
            cursor: 'ew-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '0 4px 4px 0'
          }}
        >
          <GripVertical size={10} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      )}

      {/* Behind schedule indicator */}
      {isBehind && !is_rush && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--danger)',
            border: '2px solid var(--bg-primary)'
          }}
        />
      )}
    </div>
  );
}

export default TimelineBar;
