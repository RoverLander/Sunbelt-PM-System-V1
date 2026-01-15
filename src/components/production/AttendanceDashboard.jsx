/**
 * AttendanceDashboard.jsx
 * PGM-015: Real-time attendance dashboard widget
 *
 * Displays:
 * - Current shift attendance metrics
 * - Clock in/out status for all workers
 * - Late arrivals and early departures
 * - Real-time headcount by area/station
 * - Overtime tracking
 * - Quick clock in/out actions
 */

import React, { useState, useMemo, useCallback } from 'react';
import { format, parseISO, differenceInMinutes, isToday } from 'date-fns';

// Status configurations
const ATTENDANCE_STATUS = {
  CLOCKED_IN: { label: 'Clocked In', color: '#10b981', bg: '#d1fae5', icon: '✓' },
  CLOCKED_OUT: { label: 'Clocked Out', color: '#6b7280', bg: '#f3f4f6', icon: '−' },
  LATE: { label: 'Late', color: '#f59e0b', bg: '#fef3c7', icon: '⚠' },
  ON_BREAK: { label: 'On Break', color: '#8b5cf6', bg: '#ede9fe', icon: '☕' },
  ABSENT: { label: 'Absent', color: '#ef4444', bg: '#fee2e2', icon: '✗' },
  PTO: { label: 'PTO', color: '#3b82f6', bg: '#dbeafe', icon: '🏖' }
};

// Shift timing (for late detection)
const SHIFT_START_TIMES = {
  DAY: { hour: 6, minute: 0 },
  SWING: { hour: 14, minute: 0 },
  NIGHT: { hour: 22, minute: 0 }
};

const LATE_THRESHOLD_MINUTES = 5;

/**
 * Get worker attendance status
 */
function getAttendanceStatus(worker, shift, absence) {
  if (absence) {
    return ATTENDANCE_STATUS.PTO;
  }

  if (!shift) {
    return ATTENDANCE_STATUS.ABSENT;
  }

  if (shift.on_break) {
    return ATTENDANCE_STATUS.ON_BREAK;
  }

  if (shift.clock_out) {
    return ATTENDANCE_STATUS.CLOCKED_OUT;
  }

  if (shift.clock_in) {
    // Check if late
    if (shift.is_late) {
      return ATTENDANCE_STATUS.LATE;
    }
    return ATTENDANCE_STATUS.CLOCKED_IN;
  }

  return ATTENDANCE_STATUS.ABSENT;
}

/**
 * Calculate minutes late
 */
function calculateMinutesLate(clockIn, shiftType) {
  if (!clockIn) return 0;

  const clockInTime = parseISO(clockIn);
  const expected = SHIFT_START_TIMES[shiftType] || SHIFT_START_TIMES.DAY;

  const expectedTime = new Date(clockInTime);
  expectedTime.setHours(expected.hour, expected.minute, 0, 0);

  const diff = differenceInMinutes(clockInTime, expectedTime);
  return Math.max(0, diff);
}

/**
 * Stat card component
 */
function StatCard({ label, value, subValue, color, bg, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: '1',
        minWidth: '120px',
        padding: '16px',
        backgroundColor: bg || '#f9fafb',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        border: `1px solid ${color}20`
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
      }}>
        {icon && (
          <span style={{ fontSize: '16px' }}>{icon}</span>
        )}
        <span style={{
          fontSize: '12px',
          fontWeight: '500',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        color: color || '#111827'
      }}>
        {value}
      </div>
      {subValue && (
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '4px'
        }}>
          {subValue}
        </div>
      )}
    </div>
  );
}

/**
 * Worker attendance row component
 */
function WorkerAttendanceRow({
  worker,
  shift,
  absence,
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
  compact
}) {
  const status = getAttendanceStatus(worker, shift, absence);
  const minutesLate = shift?.clock_in
    ? calculateMinutesLate(shift.clock_in, shift.shift_type)
    : 0;

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: compact ? '8px 12px' : '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.15s',
    gap: '12px'
  };

  return (
    <div
      style={rowStyle}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
    >
      {/* Status indicator */}
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: status.color,
        flexShrink: 0
      }} />

      {/* Worker info */}
      <div style={{ flex: '1', minWidth: '140px' }}>
        <div style={{
          fontWeight: '500',
          fontSize: '13px',
          color: '#111827'
        }}>
          {worker.first_name} {worker.last_name}
        </div>
        <div style={{
          fontSize: '11px',
          color: '#6b7280'
        }}>
          {worker.role || worker.station_name || 'Worker'}
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        padding: '4px 10px',
        backgroundColor: status.bg,
        color: status.color,
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        minWidth: '90px',
        justifyContent: 'center'
      }}>
        <span>{status.icon}</span>
        <span>{status.label}</span>
      </div>

      {/* Clock in time */}
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        minWidth: '70px',
        textAlign: 'center'
      }}>
        {shift?.clock_in ? (
          <span>
            {format(parseISO(shift.clock_in), 'h:mm a')}
            {minutesLate > LATE_THRESHOLD_MINUTES && (
              <span style={{
                color: '#f59e0b',
                fontSize: '10px',
                display: 'block'
              }}>
                +{minutesLate}min
              </span>
            )}
          </span>
        ) : '−'}
      </div>

      {/* Hours worked */}
      <div style={{
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151',
        minWidth: '50px',
        textAlign: 'center'
      }}>
        {shift?.hours_worked ? `${shift.hours_worked.toFixed(1)}h` : '−'}
      </div>

      {/* Actions */}
      {!compact && (
        <div style={{
          display: 'flex',
          gap: '6px',
          minWidth: '100px',
          justifyContent: 'flex-end'
        }}>
          {!shift?.clock_in && !absence && onClockIn && (
            <button
              onClick={() => onClockIn(worker.id)}
              style={{
                padding: '4px 10px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Clock In
            </button>
          )}

          {shift?.clock_in && !shift?.clock_out && (
            <>
              {!shift.on_break ? (
                <>
                  {onStartBreak && (
                    <button
                      onClick={() => onStartBreak(shift.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Break
                    </button>
                  )}
                  {onClockOut && (
                    <button
                      onClick={() => onClockOut(shift.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Out
                    </button>
                  )}
                </>
              ) : onEndBreak && (
                <button
                  onClick={() => onEndBreak(shift.id)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  End Break
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Area/Station breakdown component
 */
function AreaBreakdown({ workers, shifts, absences }) {
  // Group by station/area
  const areaStats = useMemo(() => {
    const areas = {};

    workers.forEach(worker => {
      const area = worker.station_name || worker.area || 'Unassigned';
      if (!areas[area]) {
        areas[area] = { present: 0, absent: 0, total: 0 };
      }

      const shift = shifts.find(s => s.worker_id === worker.id);
      const absence = absences.find(a => a.worker_id === worker.id);

      areas[area].total++;
      if (shift?.clock_in && !shift.clock_out) {
        areas[area].present++;
      } else if (!absence) {
        areas[area].absent++;
      }
    });

    return Object.entries(areas)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [workers, shifts, absences]);

  return (
    <div style={{
      borderTop: '1px solid #e5e7eb',
      padding: '16px'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Headcount by Area
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '8px'
      }}>
        {areaStats.map(area => {
          const percentage = area.total > 0 ? Math.round((area.present / area.total) * 100) : 0;

          return (
            <div
              key={area.name}
              style={{
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {area.name}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px'
              }}>
                <span style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#111827'
                }}>
                  {area.present}
                </span>
                <span style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  / {area.total}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: percentage >= 90 ? '#10b981' : percentage >= 75 ? '#f59e0b' : '#ef4444',
                  marginLeft: 'auto',
                  fontWeight: '500'
                }}>
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main AttendanceDashboard component
 */
export default function AttendanceDashboard({
  factoryId,
  workers = [],
  shifts = [],
  absences = [],
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
  onRefresh,
  compact = false,
  showAreaBreakdown = true,
  filterStatus = 'all' // 'all', 'present', 'absent', 'late'
}) {
  const [statusFilter, setStatusFilter] = useState(filterStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'status', 'time'

  // Calculate attendance stats
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let onBreak = 0;
    let onPTO = 0;
    let totalHours = 0;
    let overtimeCount = 0;

    workers.forEach(worker => {
      const shift = shifts.find(s => s.worker_id === worker.id);
      const absence = absences.find(a => a.worker_id === worker.id);

      if (absence) {
        onPTO++;
      } else if (!shift || !shift.clock_in) {
        absent++;
      } else if (shift.on_break) {
        onBreak++;
        present++;
      } else if (shift.clock_out) {
        // Already clocked out
      } else {
        present++;

        if (shift.is_late) {
          late++;
        }

        if (shift.hours_worked) {
          totalHours += shift.hours_worked;
          if (shift.hours_worked > 8) {
            overtimeCount++;
          }
        }
      }
    });

    const attendanceRate = workers.length > 0
      ? Math.round(((present + onPTO) / workers.length) * 100)
      : 0;

    return {
      present,
      absent,
      late,
      onBreak,
      onPTO,
      totalHours,
      overtimeCount,
      attendanceRate,
      total: workers.length
    };
  }, [workers, shifts, absences]);

  // Filter and sort workers
  const filteredWorkers = useMemo(() => {
    let filtered = workers.filter(worker => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${worker.first_name} ${worker.last_name}`.toLowerCase();
        if (!fullName.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const shift = shifts.find(s => s.worker_id === worker.id);
        const absence = absences.find(a => a.worker_id === worker.id);
        const status = getAttendanceStatus(worker, shift, absence);

        switch (statusFilter) {
          case 'present':
            return status === ATTENDANCE_STATUS.CLOCKED_IN ||
                   status === ATTENDANCE_STATUS.ON_BREAK;
          case 'absent':
            return status === ATTENDANCE_STATUS.ABSENT;
          case 'late':
            return status === ATTENDANCE_STATUS.LATE;
          case 'pto':
            return status === ATTENDANCE_STATUS.PTO;
          default:
            return true;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      }

      if (sortBy === 'status') {
        const shiftA = shifts.find(s => s.worker_id === a.id);
        const shiftB = shifts.find(s => s.worker_id === b.id);
        const statusA = getAttendanceStatus(a, shiftA, null);
        const statusB = getAttendanceStatus(b, shiftB, null);
        return statusA.label.localeCompare(statusB.label);
      }

      if (sortBy === 'time') {
        const shiftA = shifts.find(s => s.worker_id === a.id);
        const shiftB = shifts.find(s => s.worker_id === b.id);
        const timeA = shiftA?.clock_in || '';
        const timeB = shiftB?.clock_in || '';
        return timeA.localeCompare(timeB);
      }

      return 0;
    });

    return filtered;
  }, [workers, shifts, absences, searchTerm, statusFilter, sortBy]);

  // Container styles
  const containerStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: compact ? '12px 16px' : '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: compact ? '14px' : '16px',
            fontWeight: '600',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>👥</span>
            Today's Attendance
          </h3>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {format(new Date(), 'EEEE, MMM d')}
            </span>

            {onRefresh && (
              <button
                onClick={onRefresh}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ↻
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <StatCard
            label="Present"
            value={stats.present}
            subValue={`${stats.attendanceRate}% rate`}
            color="#10b981"
            bg="#d1fae5"
            icon="✓"
            onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
          />
          <StatCard
            label="Absent"
            value={stats.absent}
            color="#ef4444"
            bg="#fee2e2"
            icon="✗"
            onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
          />
          <StatCard
            label="Late"
            value={stats.late}
            color="#f59e0b"
            bg="#fef3c7"
            icon="⚠"
            onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
          />
          <StatCard
            label="On PTO"
            value={stats.onPTO}
            color="#3b82f6"
            bg="#dbeafe"
            icon="🏖"
            onClick={() => setStatusFilter(statusFilter === 'pto' ? 'all' : 'pto')}
          />
          {!compact && (
            <StatCard
              label="Total Hours"
              value={stats.totalHours.toFixed(1)}
              subValue={stats.overtimeCount > 0 ? `${stats.overtimeCount} on OT` : null}
              color="#6366f1"
              bg="#eef2ff"
              icon="⏱"
            />
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1',
          minWidth: '200px',
          maxWidth: '300px'
        }}>
          <input
            type="text"
            placeholder="Search workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px 6px 32px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '14px'
          }}>
            🔍
          </span>
        </div>

        {/* Status filter buttons */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: '#f3f4f6',
          padding: '3px',
          borderRadius: '6px'
        }}>
          {['all', 'present', 'absent', 'late'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '4px 12px',
                backgroundColor: statusFilter === status ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: statusFilter === status ? '500' : '400',
                color: statusFilter === status ? '#111827' : '#6b7280',
                boxShadow: statusFilter === status ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                textTransform: 'capitalize'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="name">Sort by Name</option>
          <option value="status">Sort by Status</option>
          <option value="time">Sort by Clock In</option>
        </select>

        {/* Results count */}
        <span style={{
          fontSize: '12px',
          color: '#6b7280',
          marginLeft: 'auto'
        }}>
          {filteredWorkers.length} of {workers.length} workers
        </span>
      </div>

      {/* Worker list */}
      <div style={{
        maxHeight: compact ? '300px' : '400px',
        overflowY: 'auto'
      }}>
        {filteredWorkers.length > 0 ? (
          filteredWorkers.map(worker => (
            <WorkerAttendanceRow
              key={worker.id}
              worker={worker}
              shift={shifts.find(s => s.worker_id === worker.id)}
              absence={absences.find(a => a.worker_id === worker.id)}
              onClockIn={onClockIn}
              onClockOut={onClockOut}
              onStartBreak={onStartBreak}
              onEndBreak={onEndBreak}
              compact={compact}
            />
          ))
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
            <div style={{ fontWeight: '500' }}>No workers found</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No workers assigned to this factory'}
            </div>
          </div>
        )}
      </div>

      {/* Area breakdown */}
      {showAreaBreakdown && !compact && workers.length > 0 && (
        <AreaBreakdown
          workers={workers}
          shifts={shifts}
          absences={absences}
        />
      )}
    </div>
  );
}
