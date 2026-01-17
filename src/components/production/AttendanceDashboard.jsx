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
 * - Non-work day detection (weekends/holidays show "Not Scheduled" instead of "Absent")
 *
 * Updated: January 17, 2026 - Non-work day handling (weekend/holiday detection)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { format, parseISO, differenceInMinutes, isToday } from 'date-fns';

// Status configurations - using rgba for dark mode compatibility
const ATTENDANCE_STATUS = {
  CLOCKED_IN: { label: 'Clocked In', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '✓' },
  CLOCKED_OUT: { label: 'Clocked Out', color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)', icon: '−' },
  LATE: { label: 'Late', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '⚠' },
  ON_BREAK: { label: 'On Break', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: '☕' },
  ABSENT: { label: 'Absent', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '✗' },
  PTO: { label: 'PTO', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: '🏖' },
  NOT_SCHEDULED: { label: 'Not Scheduled', color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)', icon: '📅' }
};

// Default work days (Monday-Friday) - 0 = Sunday, 1 = Monday, ..., 6 = Saturday
const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];

// Shift timing (for late detection)
const SHIFT_START_TIMES = {
  DAY: { hour: 6, minute: 0 },
  SWING: { hour: 14, minute: 0 },
  NIGHT: { hour: 22, minute: 0 }
};

const LATE_THRESHOLD_MINUTES = 5;

/**
 * Check if today is a work day
 */
function checkIsWorkDay(workDays = DEFAULT_WORK_DAYS, holidays = []) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Check if it's a weekend (not in work days)
  if (!workDays.includes(dayOfWeek)) {
    return false;
  }

  // Check if it's a holiday
  const todayStr = format(today, 'yyyy-MM-dd');
  if (holidays.some(h => h === todayStr || h.date === todayStr)) {
    return false;
  }

  return true;
}

/**
 * Get worker attendance status
 */
function getAttendanceStatus(worker, shift, absence, isWorkDay = true) {
  if (absence) {
    return ATTENDANCE_STATUS.PTO;
  }

  if (!shift) {
    // If it's not a work day, show "Not Scheduled" instead of "Absent"
    return isWorkDay ? ATTENDANCE_STATUS.ABSENT : ATTENDANCE_STATUS.NOT_SCHEDULED;
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

  // No clock in yet
  return isWorkDay ? ATTENDANCE_STATUS.ABSENT : ATTENDANCE_STATUS.NOT_SCHEDULED;
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
        backgroundColor: bg || 'var(--bg-tertiary)',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        border: '1px solid var(--border-color)'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
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
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        color: color || 'var(--text-primary)'
      }}>
        {value}
      </div>
      {subValue && (
        <div style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
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
  compact,
  isWorkDay = true
}) {
  const status = getAttendanceStatus(worker, shift, absence, isWorkDay);
  const minutesLate = shift?.clock_in
    ? calculateMinutesLate(shift.clock_in, shift.shift_type)
    : 0;

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: compact ? '8px 12px' : '12px 16px',
    borderBottom: '1px solid var(--border-color)',
    transition: 'background-color 0.15s',
    gap: '12px'
  };

  return (
    <div
      style={rowStyle}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
          color: 'var(--text-primary)'
        }}>
          {worker.first_name} {worker.last_name}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-secondary)'
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
        color: 'var(--text-secondary)',
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
        color: 'var(--text-primary)',
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
                        backgroundColor: 'var(--text-secondary)',
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
function AreaBreakdown({ workers, shifts, absences, isWorkDay = true }) {
  // Group by station/area
  const areaStats = useMemo(() => {
    const areas = {};

    workers.forEach(worker => {
      const area = worker.station_name || worker.area || 'Unassigned';
      if (!areas[area]) {
        areas[area] = { present: 0, absent: 0, notScheduled: 0, total: 0 };
      }

      const shift = shifts.find(s => s.worker_id === worker.id);
      const absence = absences.find(a => a.worker_id === worker.id);

      areas[area].total++;
      if (shift?.clock_in && !shift.clock_out) {
        areas[area].present++;
      } else if (!absence) {
        // If not a work day, count as not scheduled instead of absent
        if (isWorkDay) {
          areas[area].absent++;
        } else {
          areas[area].notScheduled++;
        }
      }
    });

    return Object.entries(areas)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [workers, shifts, absences, isWorkDay]);

  return (
    <div style={{
      borderTop: '1px solid var(--border-color)',
      padding: '16px'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-primary)',
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
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '6px',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--text-primary)',
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
                  color: 'var(--text-primary)'
                }}>
                  {area.present}
                </span>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
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
  workDays = DEFAULT_WORK_DAYS, // Array of work days [1,2,3,4,5] = Mon-Fri
  holidays = [], // Array of holiday dates (strings 'yyyy-MM-dd' or objects with .date)
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
  onRefresh,
  compact = false,
  showAreaBreakdown = true,
  filterStatus = 'all' // 'all', 'present', 'absent', 'late', 'not_scheduled'
}) {
  const [statusFilter, setStatusFilter] = useState(filterStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'status', 'time'

  // Check if today is a work day
  const isWorkDay = useMemo(() => {
    return checkIsWorkDay(workDays, holidays);
  }, [workDays, holidays]);

  // Calculate attendance stats
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let notScheduled = 0;
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
        // If not a work day, count as "not scheduled" instead of "absent"
        if (isWorkDay) {
          absent++;
        } else {
          notScheduled++;
        }
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
      notScheduled,
      late,
      onBreak,
      onPTO,
      totalHours,
      overtimeCount,
      attendanceRate,
      isWorkDay,
      total: workers.length
    };
  }, [workers, shifts, absences, isWorkDay]);

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
        const status = getAttendanceStatus(worker, shift, absence, isWorkDay);

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
          case 'not_scheduled':
            return status === ATTENDANCE_STATUS.NOT_SCHEDULED;
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
        const statusA = getAttendanceStatus(a, shiftA, null, isWorkDay);
        const statusB = getAttendanceStatus(b, shiftB, null, isWorkDay);
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
  }, [workers, shifts, absences, searchTerm, statusFilter, sortBy, isWorkDay]);

  // Container styles - using CSS variables for dark mode
  const containerStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: compact ? '12px 16px' : '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-tertiary)'
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
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{isWorkDay ? '👥' : '📅'}</span>
            {isWorkDay ? "Today's Attendance" : 'Non-Work Day'}
          </h3>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              {format(new Date(), 'EEEE, MMM d')}
            </span>

            {onRefresh && (
              <button
                onClick={onRefresh}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
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
          {isWorkDay ? (
            // Work day stats - show Present, Absent, Late, PTO
            <>
              <StatCard
                label="Present"
                value={stats.present}
                subValue={`${stats.attendanceRate}% rate`}
                color="#10b981"
                bg="rgba(16, 185, 129, 0.15)"
                icon="✓"
                onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
              />
              <StatCard
                label="Absent"
                value={stats.absent}
                color="#ef4444"
                bg="rgba(239, 68, 68, 0.15)"
                icon="✗"
                onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
              />
              <StatCard
                label="Late"
                value={stats.late}
                color="#f59e0b"
                bg="rgba(245, 158, 11, 0.15)"
                icon="⚠"
                onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
              />
              <StatCard
                label="On PTO"
                value={stats.onPTO}
                color="#3b82f6"
                bg="rgba(59, 130, 246, 0.15)"
                icon="🏖"
                onClick={() => setStatusFilter(statusFilter === 'pto' ? 'all' : 'pto')}
              />
              {!compact && (
                <StatCard
                  label="Total Hours"
                  value={stats.totalHours.toFixed(1)}
                  subValue={stats.overtimeCount > 0 ? `${stats.overtimeCount} on OT` : null}
                  color="#6366f1"
                  bg="rgba(99, 102, 241, 0.15)"
                  icon="⏱"
                />
              )}
            </>
          ) : (
            // Non-work day stats - show Not Scheduled, any clocked in workers (overtime), PTO
            <>
              <StatCard
                label="Not Scheduled"
                value={stats.notScheduled}
                subValue="Weekend/Holiday"
                color="var(--text-tertiary)"
                bg="var(--bg-tertiary)"
                icon="📅"
              />
              {stats.present > 0 && (
                <StatCard
                  label="Working (OT)"
                  value={stats.present}
                  subValue="Overtime pay"
                  color="#f59e0b"
                  bg="rgba(245, 158, 11, 0.15)"
                  icon="⏰"
                  onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
                />
              )}
              {stats.onPTO > 0 && (
                <StatCard
                  label="On PTO"
                  value={stats.onPTO}
                  color="#3b82f6"
                  bg="rgba(59, 130, 246, 0.15)"
                  icon="🏖"
                  onClick={() => setStatusFilter(statusFilter === 'pto' ? 'all' : 'pto')}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        backgroundColor: 'var(--bg-secondary)'
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
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
            fontSize: '14px'
          }}>
            🔍
          </span>
        </div>

        {/* Status filter buttons - different options for work day vs non-work day */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: 'var(--bg-tertiary)',
          padding: '3px',
          borderRadius: '6px'
        }}>
          {(isWorkDay
            ? ['all', 'present', 'absent', 'late']
            : ['all', 'present', 'not_scheduled']
          ).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '4px 12px',
                backgroundColor: statusFilter === status ? 'var(--bg-primary)' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: statusFilter === status ? '500' : '400',
                color: statusFilter === status ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: statusFilter === status ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'capitalize'
              }}
            >
              {status === 'not_scheduled' ? 'Not Scheduled' : status}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
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
          color: 'var(--text-secondary)',
          marginLeft: 'auto'
        }}>
          {filteredWorkers.length} of {workers.length} workers
        </span>
      </div>

      {/* Worker list */}
      <div style={{
        maxHeight: compact ? '300px' : '400px',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-secondary)'
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
              isWorkDay={isWorkDay}
            />
          ))
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
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
          isWorkDay={isWorkDay}
        />
      )}
    </div>
  );
}
