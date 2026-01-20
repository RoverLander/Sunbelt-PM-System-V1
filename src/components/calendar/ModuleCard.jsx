import React, { useState } from 'react';
import { Flame, MapPin, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { MiniProgressBar } from './ProgressBar';

/**
 * ModuleCard - Enhanced card component for displaying module information in the production calendar
 *
 * @param {Object} module - Module data object
 * @param {string} variant - Display variant: 'compact' | 'standard' | 'expanded'
 * @param {boolean} draggable - Whether the card is draggable
 * @param {function} onDragStart - Drag start handler
 * @param {function} onDragEnd - Drag end handler
 * @param {function} onClick - Click handler
 * @param {function} onMouseEnter - Mouse enter handler for tooltip
 * @param {function} onMouseLeave - Mouse leave handler for tooltip
 */
function ModuleCard({
  module,
  variant = 'compact',
  draggable = false,
  onDragStart,
  onDragEnd,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style = {}
}) {
  const [isDragging, setIsDragging] = useState(false);

  if (!module) return null;

  // Extract module information
  const {
    id,
    serial_number,
    module_number,
    project,
    project_name,
    status = 'Not Started',
    current_station_name,
    current_station,
    is_rush = false,
    progress = 0,
    qc_status,
    scheduled_start,
    scheduled_end,
    days_in_production = 0,
    estimated_days = 0,
    color = 'var(--sunbelt-orange)'
  } = module;

  // Calculate display values
  const displayNumber = serial_number || module_number || 'Unknown';
  const displayProjectName = project?.name || project_name || 'No Project';
  const displayStationName = current_station_name || current_station?.name || 'Not assigned';
  const displayProgress = Math.min(100, Math.max(0, progress || 0));

  // Status color mapping
  const getStatusColor = (moduleStatus) => {
    const colors = {
      'Not Started': 'var(--text-tertiary)',
      'In Queue': 'var(--info)',
      'In Progress': 'var(--sunbelt-orange)',
      'QC Hold': 'var(--warning)',
      'Rework': 'var(--danger)',
      'Completed': 'var(--success)',
      'Staged': 'var(--info)',
      'Shipped': 'var(--success)'
    };
    return colors[moduleStatus] || 'var(--text-secondary)';
  };

  // QC status indicator
  const getQCIndicator = () => {
    if (!qc_status) return null;
    const passed = qc_status === 'Passed' || qc_status === 'passed';
    return {
      icon: passed ? CheckCircle : AlertCircle,
      color: passed ? 'var(--success)' : 'var(--warning)',
      text: passed ? 'QC Passed' : 'QC Pending'
    };
  };

  const qcIndicator = getQCIndicator();
  const statusColor = getStatusColor(status);

  // Drag handlers
  const handleDragStart = (e) => {
    setIsDragging(true);
    if (onDragStart) {
      onDragStart(e, module);
    }
    e.dataTransfer.setData('moduleId', id);
    e.dataTransfer.setData('moduleData', JSON.stringify(module));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd(e, module);
    }
  };

  // Common card styles
  const cardBaseStyles = {
    position: 'relative',
    background: is_rush ? 'rgba(239, 68, 68, 0.08)' : `${color}15`,
    borderLeft: `3px solid ${is_rush ? 'var(--danger)' : color}`,
    borderRadius: '4px',
    cursor: draggable ? 'grab' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: isDragging ? 0.5 : 1,
    transform: isDragging ? 'scale(0.98)' : 'scale(1)',
    ...style
  };

  // Compact variant (for calendar cells - minimal info)
  if (variant === 'compact') {
    return (
      <div
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(module, e);
        }}
        onMouseEnter={(e) => onMouseEnter && onMouseEnter(module, e)}
        onMouseLeave={(e) => onMouseLeave && onMouseLeave(module, e)}
        style={{
          ...cardBaseStyles,
          padding: '4px 6px'
        }}
        onMouseOver={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'translateX(2px)';
          }
        }}
        onMouseOut={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = isDragging ? 'scale(0.98)' : 'scale(1)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Package size={12} style={{ color: is_rush ? 'var(--danger)' : color, flexShrink: 0 }} />
          <span style={{
            fontSize: '0.7rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {displayNumber}
          </span>
          {is_rush && (
            <Flame size={10} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          )}
        </div>
        {/* Mini progress bar */}
        <div style={{ marginTop: '3px' }}>
          <MiniProgressBar value={displayProgress} color={is_rush ? 'var(--danger)' : color} />
        </div>
      </div>
    );
  }

  // Standard variant (for calendar day view - more info)
  if (variant === 'standard') {
    return (
      <div
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(module, e);
        }}
        onMouseEnter={(e) => onMouseEnter && onMouseEnter(module, e)}
        onMouseLeave={(e) => onMouseLeave && onMouseLeave(module, e)}
        style={{
          ...cardBaseStyles,
          padding: '8px 10px'
        }}
        onMouseOver={(e) => {
          if (!isDragging) {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Header Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package size={14} style={{ color: is_rush ? 'var(--danger)' : color }} />
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              {displayNumber}
            </span>
          </div>
          {is_rush && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 6px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '10px',
              fontSize: '0.625rem',
              fontWeight: '700',
              color: 'var(--danger)',
              textTransform: 'uppercase'
            }}>
              <Flame size={10} />
              Rush
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '6px' }}>
          <MiniProgressBar value={displayProgress} color={is_rush ? 'var(--danger)' : color} />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '2px'
          }}>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
              {Math.round(displayProgress)}%
            </span>
          </div>
        </div>

        {/* Station and Days Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.6875rem',
          color: 'var(--text-secondary)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <MapPin size={10} />
            {displayStationName}
          </span>
          {estimated_days > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={10} />
              Day {days_in_production} of {estimated_days}
            </span>
          )}
        </div>

        {/* Status Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '6px',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <span style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.625rem',
            fontWeight: '600',
            background: `${statusColor}20`,
            color: statusColor
          }}>
            {status}
          </span>
          {qcIndicator && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.625rem',
              color: qcIndicator.color
            }}>
              <qcIndicator.icon size={10} />
              {qc_status}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Expanded variant (for station view - full details)
  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick(module, e);
      }}
      onMouseEnter={(e) => onMouseEnter && onMouseEnter(module, e)}
      onMouseLeave={(e) => onMouseLeave && onMouseLeave(module, e)}
      style={{
        ...cardBaseStyles,
        padding: '12px',
        minWidth: '160px'
      }}
      onMouseOver={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = isDragging ? 'scale(0.98)' : 'scale(1)';
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '2px'
          }}>
            {displayNumber}
          </div>
          <div style={{
            fontSize: '0.6875rem',
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '120px'
          }}>
            {displayProjectName}
          </div>
        </div>
        {is_rush && (
          <Flame size={16} style={{ color: 'var(--danger)' }} />
        )}
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '10px' }}>
        <MiniProgressBar value={displayProgress} color={is_rush ? 'var(--danger)' : color} />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
          fontSize: '0.6875rem'
        }}>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
            {Math.round(displayProgress)}%
          </span>
          {estimated_days > 0 && (
            <span style={{ color: 'var(--text-tertiary)' }}>
              Day {days_in_production}/{estimated_days}
            </span>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{
          padding: '3px 8px',
          borderRadius: '10px',
          fontSize: '0.625rem',
          fontWeight: '600',
          background: `${statusColor}20`,
          color: statusColor
        }}>
          {status}
        </span>
        {qcIndicator && (
          <qcIndicator.icon
            size={14}
            style={{ color: qcIndicator.color }}
            title={qcIndicator.text}
          />
        )}
      </div>
    </div>
  );
}

export default ModuleCard;
