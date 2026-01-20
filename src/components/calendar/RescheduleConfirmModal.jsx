import React from 'react';
import { X, Calendar, ArrowRight, AlertTriangle, Clock, Package } from 'lucide-react';

/**
 * RescheduleConfirmModal - Confirmation dialog for rescheduling modules
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm handler
 * @param {Object} module - Module being rescheduled
 * @param {Date} oldDate - Original scheduled date
 * @param {Date} newDate - New scheduled date
 * @param {Object} oldStation - Original station (for station changes)
 * @param {Object} newStation - New station (for station changes)
 * @param {string} changeType - Type of change: 'reschedule' | 'station_change'
 */
function RescheduleConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  module,
  oldDate,
  newDate,
  oldStation,
  newStation,
  changeType = 'reschedule'
}) {
  if (!isOpen || !module) return null;

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDaysDifference = () => {
    if (!oldDate || !newDate) return null;
    const old = new Date(oldDate);
    const newD = new Date(newDate);
    const diffTime = newD - old;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysDiff = calculateDaysDifference();

  const isStationChange = changeType === 'station_change';
  const title = isStationChange ? 'Confirm Station Change' : 'Confirm Reschedule';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '400px',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-lg)',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              {isStationChange ? (
                <Package size={20} style={{ color: 'var(--sunbelt-orange)' }} />
              ) : (
                <Calendar size={20} style={{ color: 'var(--sunbelt-orange)' }} />
              )}
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: 0
                }}
              >
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                display: 'flex'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: 'var(--space-lg)' }}>
            {/* Module Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                padding: 'var(--space-md)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-lg)'
              }}
            >
              <Package size={24} style={{ color: module.color || 'var(--sunbelt-orange)' }} />
              <div>
                <div
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)'
                  }}
                >
                  {module.module_number || `${module.project_number}-M01`}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {module.project_name || module.project_number}
                </div>
              </div>
              {module.is_rush && (
                <span
                  style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    borderRadius: '10px',
                    fontSize: '0.625rem',
                    fontWeight: '700',
                    color: 'var(--danger)',
                    textTransform: 'uppercase'
                  }}
                >
                  Rush
                </span>
              )}
            </div>

            {/* Change Visualization */}
            {!isStationChange && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-md)',
                  marginBottom: 'var(--space-lg)'
                }}
              >
                {/* Old Date */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}
                  >
                    From
                  </div>
                  <div
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {formatDate(oldDate)}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight size={24} style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }} />

                {/* New Date */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}
                  >
                    To
                  </div>
                  <div
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      background: 'rgba(255, 107, 53, 0.15)',
                      border: '1px solid var(--sunbelt-orange)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: 'var(--sunbelt-orange)'
                    }}
                  >
                    {formatDate(newDate)}
                  </div>
                </div>
              </div>
            )}

            {/* Station Change Visualization */}
            {isStationChange && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-md)',
                  marginBottom: 'var(--space-lg)'
                }}
              >
                {/* Old Station */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}
                  >
                    From Station
                  </div>
                  <div
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {oldStation?.name || 'Unknown'}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight size={24} style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }} />

                {/* New Station */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}
                  >
                    To Station
                  </div>
                  <div
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      background: `${newStation?.color || 'var(--sunbelt-orange)'}20`,
                      border: `1px solid ${newStation?.color || 'var(--sunbelt-orange)'}`,
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: newStation?.color || 'var(--sunbelt-orange)'
                    }}
                  >
                    {newStation?.name || 'Unknown'}
                  </div>
                </div>
              </div>
            )}

            {/* Days Difference Badge */}
            {!isStationChange && daysDiff !== null && daysDiff !== 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: 'var(--space-sm) var(--space-md)',
                  background:
                    daysDiff > 0
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(34, 197, 94, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-lg)'
                }}
              >
                <Clock
                  size={14}
                  style={{
                    color: daysDiff > 0 ? 'var(--warning)' : 'var(--success)'
                  }}
                />
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: daysDiff > 0 ? 'var(--warning)' : 'var(--success)'
                  }}
                >
                  {daysDiff > 0 ? `Delayed by ${daysDiff} day${daysDiff !== 1 ? 's' : ''}` : `Moved earlier by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''}`}
                </span>
              </div>
            )}

            {/* Warning for significant changes */}
            {!isStationChange && daysDiff !== null && Math.abs(daysDiff) > 7 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-md)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-lg)'
                }}
              >
                <AlertTriangle
                  size={16}
                  style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--warning)' }}>Significant Schedule Change:</strong>{' '}
                  This change moves the module by more than a week. Please ensure this aligns with project timelines and dependencies.
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              padding: 'var(--space-lg)',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)'
            }}
          >
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: 'var(--space-md)',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm({
                  module,
                  oldDate,
                  newDate,
                  oldStation,
                  newStation,
                  changeType
                });
                onClose();
              }}
              style={{
                flex: 1,
                padding: 'var(--space-md)',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {isStationChange ? 'Move to Station' : 'Confirm Reschedule'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default RescheduleConfirmModal;
