import React from 'react';
import {
  Package,
  Flame,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  User,
  Building2
} from 'lucide-react';
import ProgressBar from './ProgressBar';

/**
 * ModuleCardTooltip - Rich tooltip showing detailed module information
 *
 * @param {Object} module - Module data object
 * @param {Object} position - Position object { top, left }
 * @param {boolean} visible - Whether the tooltip is visible
 */
function ModuleCardTooltip({ module, position, visible }) {
  if (!visible || !module) return null;

  const {
    serial_number,
    module_number,
    project,
    project_name,
    status = 'Not Started',
    current_station_name,
    current_station,
    next_station_name,
    is_rush = false,
    progress = 0,
    qc_status,
    scheduled_start,
    scheduled_end,
    actual_start,
    days_in_production = 0,
    estimated_days = 0,
    assigned_crew,
    color = 'var(--sunbelt-orange)',
    notes
  } = module;

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

  const statusColor = getStatusColor(status);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!scheduled_end) return null;
    const end = new Date(scheduled_end);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  // Row component for info display
  const InfoRow = ({ label, value, icon: Icon, valueColor }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.75rem',
        color: 'var(--text-tertiary)'
      }}>
        {Icon && <Icon size={12} />}
        {label}
      </span>
      <span style={{
        fontSize: '0.75rem',
        fontWeight: '600',
        color: valueColor || 'var(--text-primary)'
      }}>
        {value}
      </span>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: '280px',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 1000,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px',
        background: is_rush ? 'rgba(239, 68, 68, 0.1)' : `${color}15`,
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px'
            }}>
              <Package size={16} style={{ color: is_rush ? 'var(--danger)' : color }} />
              <span style={{
                fontSize: '0.9375rem',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {displayNumber}
              </span>
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              {displayProjectName}
            </div>
          </div>
          {is_rush && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              fontSize: '0.6875rem',
              fontWeight: '700',
              color: 'var(--danger)',
              textTransform: 'uppercase'
            }}>
              <Flame size={12} />
              Rush Order
            </span>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Production Progress
          </span>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: 'var(--text-primary)'
          }}>
            {Math.round(displayProgress)}%
          </span>
        </div>
        <ProgressBar
          value={displayProgress}
          color={is_rush ? 'var(--danger)' : color}
          size="md"
          animated
        />
      </div>

      {/* Info Section */}
      <div style={{ padding: '12px 12px 6px' }}>
        {/* Status */}
        <InfoRow
          label="Status"
          value={
            <span style={{
              padding: '2px 8px',
              borderRadius: '10px',
              background: `${statusColor}20`,
              color: statusColor
            }}>
              {status}
            </span>
          }
        />

        {/* Current Station */}
        <InfoRow
          label="Current Station"
          icon={MapPin}
          value={displayStationName}
        />

        {/* Next Station */}
        {next_station_name && (
          <InfoRow
            label="Next Station"
            icon={ArrowRight}
            value={next_station_name}
            valueColor="var(--text-secondary)"
          />
        )}

        {/* Days in Production */}
        {estimated_days > 0 && (
          <InfoRow
            label="Production Time"
            icon={Clock}
            value={`Day ${days_in_production} of ${estimated_days}`}
          />
        )}

        {/* Scheduled Start */}
        {scheduled_start && (
          <InfoRow
            label="Scheduled Start"
            icon={Calendar}
            value={formatDate(scheduled_start)}
          />
        )}

        {/* Scheduled End */}
        {scheduled_end && (
          <InfoRow
            label="Scheduled End"
            icon={Calendar}
            value={formatDate(scheduled_end)}
            valueColor={daysRemaining !== null && daysRemaining < 0 ? 'var(--danger)' : undefined}
          />
        )}

        {/* QC Status */}
        {qc_status && (
          <InfoRow
            label="QC Status"
            icon={qc_status === 'Passed' ? CheckCircle : AlertCircle}
            value={qc_status}
            valueColor={qc_status === 'Passed' ? 'var(--success)' : 'var(--warning)'}
          />
        )}

        {/* Assigned Crew */}
        {assigned_crew && (
          <InfoRow
            label="Assigned Crew"
            icon={User}
            value={assigned_crew}
          />
        )}
      </div>

      {/* Footer - Days Remaining Alert */}
      {daysRemaining !== null && (
        <div style={{
          padding: '8px 12px',
          background: daysRemaining < 0
            ? 'rgba(239, 68, 68, 0.1)'
            : daysRemaining <= 2
              ? 'rgba(245, 158, 11, 0.1)'
              : 'var(--bg-tertiary)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <Clock
            size={14}
            style={{
              color: daysRemaining < 0
                ? 'var(--danger)'
                : daysRemaining <= 2
                  ? 'var(--warning)'
                  : 'var(--text-secondary)'
            }}
          />
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: daysRemaining < 0
              ? 'var(--danger)'
              : daysRemaining <= 2
                ? 'var(--warning)'
                : 'var(--text-secondary)'
          }}>
            {daysRemaining < 0
              ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`
              : daysRemaining === 0
                ? 'Due today'
                : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
          </span>
        </div>
      )}

      {/* Notes if available */}
      {notes && (
        <div style={{
          padding: '8px 12px',
          background: 'var(--bg-tertiary)',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.6875rem',
          color: 'var(--text-secondary)',
          fontStyle: 'italic'
        }}>
          {notes.length > 100 ? `${notes.substring(0, 100)}...` : notes}
        </div>
      )}
    </div>
  );
}

export default ModuleCardTooltip;
