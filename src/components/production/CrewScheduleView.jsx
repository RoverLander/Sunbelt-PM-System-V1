/**
 * CrewScheduleView.jsx
 * PGM-014: Weekly crew schedule grid
 *
 * Displays a weekly view of worker schedules with:
 * - Day columns (Mon-Sun)
 * - Worker rows grouped by crew/station
 * - Shift assignments with start/end times
 * - PTO/absence indicators
 * - Overtime highlighting
 * - Drag-to-assign capability (future)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

// Shift type configurations
const SHIFT_TYPES = {
  DAY: { label: 'Day', hours: '6:00 AM - 2:30 PM', color: '#3b82f6', bg: '#eff6ff' },
  SWING: { label: 'Swing', hours: '2:00 PM - 10:30 PM', color: '#8b5cf6', bg: '#f5f3ff' },
  NIGHT: { label: 'Night', hours: '10:00 PM - 6:30 AM', color: '#6366f1', bg: '#eef2ff' },
  FLEX: { label: 'Flex', hours: 'Varies', color: '#06b6d4', bg: '#ecfeff' }
};

// Absence type configurations
const ABSENCE_TYPES = {
  PTO: { label: 'PTO', color: '#10b981', bg: '#d1fae5', icon: '🏖️' },
  SICK: { label: 'Sick', color: '#f59e0b', bg: '#fef3c7', icon: '🤒' },
  FMLA: { label: 'FMLA', color: '#8b5cf6', bg: '#ede9fe', icon: '📋' },
  JURY: { label: 'Jury Duty', color: '#6b7280', bg: '#f3f4f6', icon: '⚖️' },
  BEREAVEMENT: { label: 'Bereavement', color: '#374151', bg: '#e5e7eb', icon: '🕯️' }
};

// Day of week labels
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Get week dates starting from a given date
 */
function getWeekDates(weekStart) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(weekStart, i));
  }
  return dates;
}

/**
 * Calculate weekly hours for a worker
 */
function calculateWeeklyHours(shifts, weekDates) {
  let regular = 0;
  let overtime = 0;

  shifts.forEach(shift => {
    const hours = shift.hours_worked || 8;
    regular += Math.min(hours, 8);
    overtime += Math.max(0, hours - 8);
  });

  // Weekly overtime (over 40 hours)
  if (regular > 40) {
    overtime += regular - 40;
    regular = 40;
  }

  return { regular, overtime, total: regular + overtime };
}

/**
 * Individual schedule cell component
 */
function ScheduleCell({
  worker,
  date,
  shift,
  absence,
  onCellClick,
  isToday
}) {
  const hasShift = shift && !absence;
  const shiftType = hasShift ? SHIFT_TYPES[shift.shift_type] || SHIFT_TYPES.DAY : null;
  const absenceType = absence ? ABSENCE_TYPES[absence.type] || ABSENCE_TYPES.PTO : null;

  const cellStyle = {
    padding: '4px 6px',
    borderRight: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
    minHeight: '48px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    backgroundColor: isToday ? '#fefce8' : 'white',
    position: 'relative'
  };

  if (absence) {
    cellStyle.backgroundColor = absenceType.bg;
  } else if (hasShift && shift.is_overtime) {
    cellStyle.backgroundColor = '#fef2f2';
  }

  const handleClick = () => {
    if (onCellClick) {
      onCellClick({ worker, date, shift, absence });
    }
  };

  return (
    <td style={cellStyle} onClick={handleClick}>
      {absence ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px'
        }}>
          <span style={{ fontSize: '16px' }}>{absenceType.icon}</span>
          <span style={{
            fontSize: '10px',
            fontWeight: '500',
            color: absenceType.color
          }}>
            {absenceType.label}
          </span>
        </div>
      ) : hasShift ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: shiftType.color,
            backgroundColor: shiftType.bg,
            padding: '2px 6px',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            {shiftType.label}
          </span>
          <span style={{
            fontSize: '10px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            {shift.clock_in ? format(parseISO(shift.clock_in), 'h:mm a') : shiftType.hours.split(' - ')[0]}
          </span>
          {shift.is_overtime && (
            <span style={{
              fontSize: '9px',
              color: '#dc2626',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              +OT
            </span>
          )}
        </div>
      ) : (
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d1d5db',
          fontSize: '18px'
        }}>
          −
        </div>
      )}
    </td>
  );
}

/**
 * Worker row component
 */
function WorkerRow({
  worker,
  weekDates,
  shifts,
  absences,
  onCellClick
}) {
  const today = new Date();

  // Map shifts and absences by date
  const shiftsByDate = useMemo(() => {
    const map = {};
    shifts.forEach(shift => {
      const shiftDate = shift.shift_date || shift.clock_in?.split('T')[0];
      if (shiftDate) {
        map[shiftDate] = shift;
      }
    });
    return map;
  }, [shifts]);

  const absencesByDate = useMemo(() => {
    const map = {};
    absences.forEach(absence => {
      // Handle multi-day absences
      const start = parseISO(absence.start_date);
      const end = absence.end_date ? parseISO(absence.end_date) : start;
      let current = start;
      while (current <= end) {
        map[format(current, 'yyyy-MM-dd')] = absence;
        current = addDays(current, 1);
      }
    });
    return map;
  }, [absences]);

  // Calculate weekly hours
  const weeklyHours = useMemo(() =>
    calculateWeeklyHours(shifts, weekDates),
    [shifts, weekDates]
  );

  return (
    <tr>
      {/* Worker info cell */}
      <td style={{
        padding: '8px 12px',
        borderRight: '2px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        position: 'sticky',
        left: 0,
        zIndex: 1,
        minWidth: '180px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            color: '#1d4ed8'
          }}>
            {worker.first_name?.[0]}{worker.last_name?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: '500', fontSize: '13px', color: '#111827' }}>
              {worker.first_name} {worker.last_name}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              {worker.role || worker.skill_level || 'Worker'}
            </div>
          </div>
        </div>
      </td>

      {/* Day cells */}
      {weekDates.map((date, idx) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return (
          <ScheduleCell
            key={idx}
            worker={worker}
            date={date}
            shift={shiftsByDate[dateKey]}
            absence={absencesByDate[dateKey]}
            onCellClick={onCellClick}
            isToday={isSameDay(date, today)}
          />
        );
      })}

      {/* Weekly totals cell */}
      <td style={{
        padding: '8px 12px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        textAlign: 'center',
        minWidth: '80px'
      }}>
        <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>
          {weeklyHours.total.toFixed(1)}h
        </div>
        {weeklyHours.overtime > 0 && (
          <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: '500' }}>
            +{weeklyHours.overtime.toFixed(1)} OT
          </div>
        )}
      </td>
    </tr>
  );
}

/**
 * Crew group header row
 */
function CrewHeader({ crewName, workerCount, expanded, onToggle }) {
  return (
    <tr
      onClick={onToggle}
      style={{ cursor: 'pointer' }}
    >
      <td
        colSpan={9}
        style={{
          padding: '10px 12px',
          backgroundColor: '#f3f4f6',
          borderBottom: '2px solid #d1d5db',
          fontWeight: '600',
          fontSize: '13px',
          color: '#374151'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            fontSize: '12px'
          }}>
            ▶
          </span>
          <span>{crewName}</span>
          <span style={{
            fontSize: '11px',
            color: '#6b7280',
            fontWeight: '400',
            marginLeft: '8px'
          }}>
            ({workerCount} workers)
          </span>
        </div>
      </td>
    </tr>
  );
}

/**
 * Main CrewScheduleView component
 */
export default function CrewScheduleView({
  factoryId,
  workers = [],
  shifts = [],
  absences = [],
  weekStart = null,
  onWeekChange,
  onCellClick,
  onAddShift,
  groupBy = 'crew', // 'crew', 'station', 'none'
  showTotals = true,
  compact = false
}) {
  // State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    if (weekStart) return parseISO(weekStart);
    return startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  });
  const [expandedGroups, setExpandedGroups] = useState(new Set(['all']));
  const [filterShiftType, setFilterShiftType] = useState('all');

  // Calculate week dates
  const weekDates = useMemo(() =>
    getWeekDates(currentWeekStart),
    [currentWeekStart]
  );

  // Group workers
  const groupedWorkers = useMemo(() => {
    if (groupBy === 'none') {
      return [{ name: 'All Workers', workers }];
    }

    const groups = {};
    workers.forEach(worker => {
      const groupKey = groupBy === 'crew'
        ? (worker.crew_name || worker.assigned_crew || 'Unassigned')
        : (worker.station_name || worker.primary_station || 'Unassigned');

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(worker);
    });

    return Object.entries(groups)
      .map(([name, workers]) => ({ name, workers }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [workers, groupBy]);

  // Map shifts by worker
  const shiftsByWorker = useMemo(() => {
    const map = {};
    shifts.forEach(shift => {
      const workerId = shift.worker_id;
      if (!map[workerId]) {
        map[workerId] = [];
      }
      map[workerId].push(shift);
    });
    return map;
  }, [shifts]);

  // Map absences by worker
  const absencesByWorker = useMemo(() => {
    const map = {};
    absences.forEach(absence => {
      const workerId = absence.worker_id;
      if (!map[workerId]) {
        map[workerId] = [];
      }
      map[workerId].push(absence);
    });
    return map;
  }, [absences]);

  // Navigation handlers
  const handlePrevWeek = useCallback(() => {
    const newStart = addDays(currentWeekStart, -7);
    setCurrentWeekStart(newStart);
    if (onWeekChange) {
      onWeekChange(format(newStart, 'yyyy-MM-dd'));
    }
  }, [currentWeekStart, onWeekChange]);

  const handleNextWeek = useCallback(() => {
    const newStart = addDays(currentWeekStart, 7);
    setCurrentWeekStart(newStart);
    if (onWeekChange) {
      onWeekChange(format(newStart, 'yyyy-MM-dd'));
    }
  }, [currentWeekStart, onWeekChange]);

  const handleToday = useCallback(() => {
    const newStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    setCurrentWeekStart(newStart);
    if (onWeekChange) {
      onWeekChange(format(newStart, 'yyyy-MM-dd'));
    }
  }, [onWeekChange]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupName) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  }, []);

  // Calculate schedule stats
  const scheduleStats = useMemo(() => {
    let scheduled = 0;
    let unscheduled = 0;
    let onPTO = 0;
    let overtime = 0;

    workers.forEach(worker => {
      const workerShifts = shiftsByWorker[worker.id] || [];
      const workerAbsences = absencesByWorker[worker.id] || [];

      if (workerAbsences.length > 0) {
        onPTO++;
      } else if (workerShifts.length > 0) {
        scheduled++;
        if (workerShifts.some(s => s.is_overtime)) {
          overtime++;
        }
      } else {
        unscheduled++;
      }
    });

    return { scheduled, unscheduled, onPTO, overtime };
  }, [workers, shiftsByWorker, absencesByWorker]);

  // Styles
  const containerStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  };

  const headerStyle = {
    padding: compact ? '12px 16px' : '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Title and week navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h3 style={{
              margin: 0,
              fontSize: compact ? '14px' : '16px',
              fontWeight: '600',
              color: '#111827'
            }}>
              Crew Schedule
            </h3>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'white',
              padding: '4px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <button
                onClick={handlePrevWeek}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#6b7280'
                }}
              >
                ◀
              </button>

              <span style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                minWidth: '160px',
                textAlign: 'center'
              }}>
                {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
              </span>

              <button
                onClick={handleNextWeek}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#6b7280'
                }}
              >
                ▶
              </button>
            </div>

            <button
              onClick={handleToday}
              style={{
                padding: '4px 12px',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151'
              }}
            >
              Today
            </button>
          </div>

          {/* Stats badges */}
          {!compact && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                padding: '4px 12px',
                backgroundColor: '#dcfce7',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#166534'
              }}>
                {scheduleStats.scheduled} Scheduled
              </div>
              <div style={{
                padding: '4px 12px',
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#92400e'
              }}>
                {scheduleStats.onPTO} On Leave
              </div>
              {scheduleStats.overtime > 0 && (
                <div style={{
                  padding: '4px 12px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#991b1b'
                }}>
                  {scheduleStats.overtime} OT
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {onAddShift && (
            <button
              onClick={() => onAddShift()}
              style={{
                padding: '6px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              + Add Shift
            </button>
          )}
        </div>

        {/* Shift type legend */}
        {!compact && (
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
              SHIFT TYPES:
            </span>
            {Object.entries(SHIFT_TYPES).map(([key, config]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  backgroundColor: config.color
                }} />
                <span style={{ color: '#6b7280' }}>{config.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px'
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '10px 12px',
                textAlign: 'left',
                backgroundColor: '#f3f4f6',
                borderRight: '2px solid #e5e7eb',
                borderBottom: '2px solid #d1d5db',
                position: 'sticky',
                left: 0,
                zIndex: 2,
                minWidth: '180px'
              }}>
                Worker
              </th>
              {weekDates.map((date, idx) => {
                const isToday = isSameDay(date, new Date());
                const isWeekend = idx >= 5;
                return (
                  <th
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      backgroundColor: isToday ? '#fef9c3' : isWeekend ? '#f9fafb' : '#f3f4f6',
                      borderRight: '1px solid #e5e7eb',
                      borderBottom: '2px solid #d1d5db',
                      minWidth: '90px'
                    }}
                  >
                    <div style={{ fontWeight: '600', color: '#374151' }}>
                      {WEEKDAYS[idx]}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: isToday ? '#854d0e' : '#6b7280',
                      fontWeight: isToday ? '600' : '400'
                    }}>
                      {format(date, 'MMM d')}
                    </div>
                  </th>
                );
              })}
              {showTotals && (
                <th style={{
                  padding: '10px 12px',
                  textAlign: 'center',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '2px solid #d1d5db',
                  minWidth: '80px'
                }}>
                  <div style={{ fontWeight: '600', color: '#374151' }}>Total</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Hours</div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {groupedWorkers.map((group) => {
              const isExpanded = expandedGroups.has('all') || expandedGroups.has(group.name);

              return (
                <React.Fragment key={group.name}>
                  {groupBy !== 'none' && (
                    <CrewHeader
                      crewName={group.name}
                      workerCount={group.workers.length}
                      expanded={isExpanded}
                      onToggle={() => toggleGroup(group.name)}
                    />
                  )}

                  {isExpanded && group.workers.map(worker => (
                    <WorkerRow
                      key={worker.id}
                      worker={worker}
                      weekDates={weekDates}
                      shifts={shiftsByWorker[worker.id] || []}
                      absences={absencesByWorker[worker.id] || []}
                      onCellClick={onCellClick}
                    />
                  ))}
                </React.Fragment>
              );
            })}

            {workers.length === 0 && (
              <tr>
                <td
                  colSpan={showTotals ? 9 : 8}
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                  <div style={{ fontWeight: '500' }}>No workers assigned</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Add workers to see their schedule
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with absence legend */}
      {!compact && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
            ABSENCE TYPES:
          </span>
          {Object.entries(ABSENCE_TYPES).map(([key, config]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px'
              }}
            >
              <span>{config.icon}</span>
              <span style={{ color: '#6b7280' }}>{config.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
