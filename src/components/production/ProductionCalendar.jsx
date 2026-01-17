// ============================================================================
// ProductionCalendar.jsx - Module Scheduling Calendar
// ============================================================================
// Displays scheduled modules in Day/Week/Month views with scheduling support.
//
// FEATURES:
// - Day/Week/Month view modes
// - Module blocks showing project name, module #, status
// - Color coding by status/health
// - Click module to open detail modal
// - Drag to reschedule (GM only)
// - Simulation mode support (in-memory edits)
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Package,
  AlertTriangle,
  Zap,
  Play,
  Eye,
  Radio,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { getModuleStatusColor } from '../../services/modulesService';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden'
  },
  simModeBorder: {
    border: '2px solid #f59e0b'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-lg)',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-tertiary)',
    flexWrap: 'wrap',
    gap: 'var(--space-md)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: 'var(--space-sm) var(--space-md)',
    minWidth: '36px',
    height: '32px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontWeight: '500',
    fontSize: '0.75rem',
    transition: 'all 0.15s ease'
  },
  navButtonIcon: {
    color: 'var(--sunbelt-orange)'
  },
  currentDate: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    minWidth: '200px',
    textAlign: 'center'
  },
  todayBtn: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--sunbelt-orange)',
    border: '1px solid var(--sunbelt-orange)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600'
  },
  viewToggle: {
    display: 'flex',
    gap: '2px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '2px'
  },
  viewBtn: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.15s ease'
  },
  viewBtnActive: {
    background: 'var(--sunbelt-orange)',
    color: 'white'
  },

  // Calendar Grid
  calendarGrid: {
    display: 'grid',
    background: 'var(--bg-primary)'
  },
  weekHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-tertiary)'
  },
  weekDay: {
    padding: 'var(--space-md)',
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)'
  },
  dayCell: {
    minHeight: '120px',
    padding: 'var(--space-sm)',
    borderRight: '1px solid var(--border-color)',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    cursor: 'pointer',
    transition: 'background 0.15s ease'
  },
  dayCellOther: {
    background: 'var(--bg-secondary)',
    opacity: 0.6
  },
  dayCellToday: {
    background: 'rgba(251, 113, 16, 0.05)'
  },
  dayNumber: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-sm)'
  },
  dayNumberToday: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    background: 'var(--sunbelt-orange)',
    color: 'white',
    borderRadius: '50%'
  },

  // Week View
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: '60px repeat(7, 1fr)'
  },
  timeColumn: {
    borderRight: '1px solid var(--border-color)',
    background: 'var(--bg-tertiary)'
  },
  timeSlot: {
    height: '60px',
    padding: 'var(--space-xs)',
    fontSize: '0.65rem',
    color: 'var(--text-tertiary)',
    textAlign: 'right',
    paddingRight: 'var(--space-sm)'
  },
  weekDayColumn: {
    borderRight: '1px solid var(--border-color)',
    position: 'relative'
  },
  weekDayHeader: {
    padding: 'var(--space-md)',
    textAlign: 'center',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-tertiary)'
  },
  weekDayName: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase'
  },
  weekDayDate: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },

  // Day View
  dayViewContainer: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr',
    maxHeight: '600px',
    overflowY: 'auto'
  },
  dayViewHeader: {
    padding: 'var(--space-lg)',
    textAlign: 'center',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-tertiary)'
  },
  dayViewContent: {
    position: 'relative',
    minHeight: '600px'
  },

  // Module blocks
  moduleBlock: {
    padding: 'var(--space-sm)',
    marginBottom: '3px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderLeft: '4px solid',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  moduleBlockCompact: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  moduleMore: {
    fontSize: '0.65rem',
    color: 'var(--text-tertiary)',
    padding: '2px var(--space-sm)',
    cursor: 'pointer'
  },

  // Sim mode indicator
  simBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    background: '#f59e0b',
    color: 'white',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.7rem',
    fontWeight: '600'
  },

  // Empty state
  emptyDay: {
    color: 'var(--text-tertiary)',
    fontSize: '0.7rem',
    fontStyle: 'italic',
    padding: 'var(--space-sm)'
  },

  // Legend
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-md)',
    padding: 'var(--space-md) var(--space-lg)',
    borderTop: '1px solid var(--border-color)',
    background: 'var(--bg-tertiary)'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    color: 'var(--text-secondary)'
  },
  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(0,0,0,0.1)'
  },
  legendLabel: {
    whiteSpace: 'nowrap'
  },

  // Mode indicator
  modeToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '2px'
  },
  modeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  modeBtnLive: {
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e'
  },
  modeBtnSim: {
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b'
  },
  modeBtnInactive: {
    color: 'var(--text-tertiary)'
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: 'var(--space-xs) var(--space-sm)',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#22c55e'
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 2s infinite'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Module status colors for legend
const MODULE_STATUSES = [
  { status: 'Not Started', color: '#64748b', description: 'Not yet started' },
  { status: 'In Queue', color: '#eab308', description: 'Waiting at station' },
  { status: 'In Progress', color: '#3b82f6', description: 'Currently being worked on' },
  { status: 'QC Hold', color: '#f97316', description: 'On hold for QC inspection' },
  { status: 'Rework', color: '#ef4444', description: 'Needs rework' },
  { status: 'Completed', color: '#22c55e', description: 'Production complete' },
  { status: 'Staged', color: '#8b5cf6', description: 'Ready for shipment' },
  { status: 'Shipped', color: '#14b8a6', description: 'Delivered to site' }
];

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days = [];

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  // Next month days
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  return days;
}

function getWeekDays(date) {
  const week = [];
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    week.push(day);
  }

  return week;
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// MODULE BLOCK COMPONENT
// ============================================================================

function ModuleBlock({ module, compact = false, onClick, isSimulated }) {
  const statusColor = getModuleStatusColor(module.status);

  return (
    <div
      style={{
        ...styles.moduleBlock,
        borderLeftColor: statusColor,
        background: `${statusColor}15`,
        color: 'var(--text-primary)',
        ...(isSimulated ? { boxShadow: '0 0 0 1px #f59e0b' } : {})
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(module);
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${statusColor}25`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${statusColor}15`;
      }}
      title={`${module.serial_number} - ${module.project?.name || 'Unknown'} (${module.status})`}
    >
      <div style={styles.moduleBlockCompact}>
        {module.is_rush && <Zap size={10} color="#ef4444" />}
        {isSimulated && <Eye size={10} color="#f59e0b" />}
        <span>{compact ? module.serial_number : `${module.serial_number} - ${module.project?.name || ''}`}</span>
      </div>
    </div>
  );
}

// ============================================================================
// LEGEND COMPONENT
// ============================================================================

function StatusLegend() {
  return (
    <div style={styles.legendContainer}>
      <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-primary)', marginRight: 'var(--space-sm)' }}>
        Status:
      </span>
      {MODULE_STATUSES.map(({ status, color }) => (
        <div key={status} style={styles.legendItem} title={status}>
          <div style={{ ...styles.legendColor, background: color }} />
          <span style={styles.legendLabel}>{status}</span>
        </div>
      ))}
      <div style={{ ...styles.legendItem, marginLeft: 'var(--space-md)' }}>
        <Zap size={10} color="#ef4444" />
        <span style={styles.legendLabel}>Rush Order</span>
      </div>
    </div>
  );
}

// ============================================================================
// MONTH VIEW COMPONENT
// ============================================================================

function MonthView({ currentDate, modules, onModuleClick, onDayClick, simulatedChanges }) {
  const today = new Date();
  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());

  // Group modules by scheduled date
  const modulesByDate = useMemo(() => {
    const map = {};
    modules.forEach(module => {
      if (module.scheduled_start) {
        const key = formatDateKey(new Date(module.scheduled_start));
        if (!map[key]) map[key] = [];
        map[key].push(module);
      }
    });

    // Apply simulated changes
    if (simulatedChanges) {
      Object.entries(simulatedChanges).forEach(([moduleId, newDate]) => {
        // Remove from old position
        Object.keys(map).forEach(key => {
          map[key] = map[key].filter(m => m.id !== moduleId);
        });
        // Add to new position
        const key = formatDateKey(new Date(newDate));
        if (!map[key]) map[key] = [];
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          map[key].push({ ...module, _simulated: true });
        }
      });
    }

    return map;
  }, [modules, simulatedChanges]);

  return (
    <>
      <div style={styles.weekHeader}>
        {DAYS.map(day => (
          <div key={day} style={styles.weekDay}>{day}</div>
        ))}
      </div>
      <div style={styles.monthGrid}>
        {days.map((day, idx) => {
          const dateKey = formatDateKey(day.date);
          const dayModules = modulesByDate[dateKey] || [];
          const isToday = isSameDay(day.date, today);
          const maxDisplay = 3;

          return (
            <div
              key={idx}
              style={{
                ...styles.dayCell,
                ...(day.isCurrentMonth ? {} : styles.dayCellOther),
                ...(isToday ? styles.dayCellToday : {})
              }}
              onClick={() => onDayClick?.(day.date)}
              onMouseEnter={(e) => {
                if (day.isCurrentMonth) {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }
              }}
              onMouseLeave={(e) => {
                if (day.isCurrentMonth) {
                  e.currentTarget.style.background = isToday
                    ? 'rgba(251, 113, 16, 0.05)'
                    : 'var(--bg-primary)';
                }
              }}
            >
              <div style={styles.dayNumber}>
                {isToday ? (
                  <span style={styles.dayNumberToday}>{day.date.getDate()}</span>
                ) : (
                  day.date.getDate()
                )}
              </div>

              {dayModules.slice(0, maxDisplay).map(module => (
                <ModuleBlock
                  key={module.id}
                  module={module}
                  compact
                  onClick={onModuleClick}
                  isSimulated={module._simulated}
                />
              ))}

              {dayModules.length > maxDisplay && (
                <div style={styles.moduleMore}>
                  +{dayModules.length - maxDisplay} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ============================================================================
// WEEK VIEW COMPONENT
// ============================================================================

function WeekView({ currentDate, modules, onModuleClick, onDayClick, simulatedChanges }) {
  const today = new Date();
  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 12 }, (_, i) => i + 6); // 6 AM to 5 PM

  // Group modules by scheduled date
  const modulesByDate = useMemo(() => {
    const map = {};
    modules.forEach(module => {
      if (module.scheduled_start) {
        const key = formatDateKey(new Date(module.scheduled_start));
        if (!map[key]) map[key] = [];
        map[key].push(module);
      }
    });

    // Apply simulated changes
    if (simulatedChanges) {
      Object.entries(simulatedChanges).forEach(([moduleId, newDate]) => {
        Object.keys(map).forEach(key => {
          map[key] = map[key].filter(m => m.id !== moduleId);
        });
        const key = formatDateKey(new Date(newDate));
        if (!map[key]) map[key] = [];
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          map[key].push({ ...module, _simulated: true });
        }
      });
    }

    return map;
  }, [modules, simulatedChanges]);

  return (
    <div style={styles.weekGrid}>
      {/* Time column header */}
      <div style={{ ...styles.timeColumn, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ height: '60px' }} />
      </div>

      {/* Day headers */}
      {weekDays.map((day, idx) => {
        const isToday = isSameDay(day, today);
        return (
          <div
            key={idx}
            style={{
              ...styles.weekDayHeader,
              ...(isToday ? { background: 'rgba(251, 113, 16, 0.1)' } : {})
            }}
          >
            <div style={styles.weekDayName}>{DAYS[day.getDay()]}</div>
            <div style={{
              ...styles.weekDayDate,
              ...(isToday ? { color: 'var(--sunbelt-orange)' } : {})
            }}>
              {day.getDate()}
            </div>
          </div>
        );
      })}

      {/* Time slots and day columns */}
      <div style={styles.timeColumn}>
        {hours.map(hour => (
          <div key={hour} style={styles.timeSlot}>
            {hour % 12 || 12}{hour < 12 ? 'a' : 'p'}
          </div>
        ))}
      </div>

      {weekDays.map((day, idx) => {
        const dateKey = formatDateKey(day);
        const dayModules = modulesByDate[dateKey] || [];
        const isToday = isSameDay(day, today);

        return (
          <div
            key={idx}
            style={{
              ...styles.weekDayColumn,
              ...(isToday ? { background: 'rgba(251, 113, 16, 0.02)' } : {}),
              minHeight: `${hours.length * 60}px`,
              cursor: 'pointer'
            }}
            onClick={() => onDayClick?.(day)}
          >
            <div style={{ padding: 'var(--space-sm)' }}>
              {dayModules.map(module => (
                <ModuleBlock
                  key={module.id}
                  module={module}
                  onClick={onModuleClick}
                  isSimulated={module._simulated}
                />
              ))}
              {dayModules.length === 0 && (
                <div style={styles.emptyDay}>No modules scheduled</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// DAY VIEW COMPONENT
// ============================================================================

function DayView({ currentDate, modules, onModuleClick, simulatedChanges }) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 6); // 6 AM to 5 PM
  const dateKey = formatDateKey(currentDate);

  // Get modules for this day
  const dayModules = useMemo(() => {
    let result = modules.filter(m => {
      if (!m.scheduled_start) return false;
      return formatDateKey(new Date(m.scheduled_start)) === dateKey;
    });

    // Apply simulated changes
    if (simulatedChanges) {
      const simModules = [];
      Object.entries(simulatedChanges).forEach(([moduleId, newDate]) => {
        if (formatDateKey(new Date(newDate)) === dateKey) {
          const module = modules.find(m => m.id === moduleId);
          if (module) {
            simModules.push({ ...module, _simulated: true });
          }
        }
      });

      // Remove modules that were moved away
      result = result.filter(m => !simulatedChanges[m.id]);
      result = [...result, ...simModules];
    }

    return result;
  }, [modules, dateKey, simulatedChanges]);

  const today = new Date();
  const isToday = isSameDay(currentDate, today);

  return (
    <>
      <div style={{
        ...styles.dayViewHeader,
        ...(isToday ? { background: 'rgba(251, 113, 16, 0.1)' } : {})
      }}>
        <div style={styles.weekDayName}>{DAYS[currentDate.getDay()]}</div>
        <div style={{
          ...styles.weekDayDate,
          fontSize: '2rem',
          ...(isToday ? { color: 'var(--sunbelt-orange)' } : {})
        }}>
          {currentDate.getDate()}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
      </div>

      <div style={styles.dayViewContainer}>
        <div style={styles.timeColumn}>
          {hours.map(hour => (
            <div key={hour} style={styles.timeSlot}>
              {hour % 12 || 12}:00 {hour < 12 ? 'AM' : 'PM'}
            </div>
          ))}
        </div>

        <div style={styles.dayViewContent}>
          <div style={{ padding: 'var(--space-md)' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-md)'
            }}>
              <Package size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Scheduled Modules ({dayModules.length})
            </h4>

            {dayModules.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {dayModules.map(module => (
                  <ModuleBlock
                    key={module.id}
                    module={module}
                    onClick={onModuleClick}
                    isSimulated={module._simulated}
                  />
                ))}
              </div>
            ) : (
              <div style={styles.emptyDay}>
                No modules scheduled for this day
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProductionCalendar({
  modules = [],
  onModuleClick,
  onScheduleModule,
  isSimMode = false,
  simulatedChanges = {},
  onSimChange,
  userRole
}) {
  const [viewMode, setViewMode] = useState('month'); // day, week, month
  const [currentDate, setCurrentDate] = useState(new Date());

  const isPlantManager = userRole?.toLowerCase() === 'plant manager' ||
                         userRole?.toLowerCase() === 'plant_manager' ||
                         userRole?.toLowerCase() === 'plant_gm';

  // Navigation handlers
  const goToToday = () => setCurrentDate(new Date());

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Handle day click - switch to day view
  const handleDayClick = (date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  // Format current date display
  const dateDisplay = useMemo(() => {
    if (viewMode === 'day') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays(currentDate);
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate, viewMode]);

  return (
    <div style={{
      ...styles.container,
      ...(isSimMode ? styles.simModeBorder : {})
    }}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {/* Navigation Buttons */}
          <button
            style={styles.navButton}
            onClick={goToPrevious}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            title={`Previous ${viewMode}`}
          >
            <ChevronLeft size={16} style={styles.navButtonIcon} />
            <span>Prev</span>
          </button>
          <button
            style={styles.navButton}
            onClick={goToNext}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            title={`Next ${viewMode}`}
          >
            <span>Next</span>
            <ChevronRight size={16} style={styles.navButtonIcon} />
          </button>

          {/* Current Date Display */}
          <div style={styles.currentDate}>{dateDisplay}</div>

          {/* Today Button */}
          <button
            style={styles.todayBtn}
            onClick={goToToday}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Today
          </button>
        </div>

        <div style={styles.headerRight}>
          {/* Mode Indicator */}
          <div style={styles.modeToggle}>
            <button
              style={{
                ...styles.modeBtn,
                ...(isSimMode ? styles.modeBtnInactive : styles.modeBtnLive)
              }}
              title="Live Schedule - Shows actual production schedule"
            >
              <Radio size={12} />
              Live
            </button>
            <button
              style={{
                ...styles.modeBtn,
                ...(isSimMode ? styles.modeBtnSim : styles.modeBtnInactive)
              }}
              title="Simulation Mode - Test scheduling changes without saving"
            >
              <Eye size={12} />
              Simulation
            </button>
          </div>

          {/* Live Schedule Indicator */}
          {!isSimMode && (
            <div style={styles.liveIndicator}>
              <div style={styles.liveDot} />
              Live Schedule
            </div>
          )}

          {/* Simulation Mode Badge */}
          {isSimMode && (
            <span style={styles.simBadge}>
              <Eye size={12} />
              Changes Not Saved
            </span>
          )}

          {/* View Mode Toggle */}
          <div style={styles.viewToggle}>
            {['day', 'week', 'month'].map(mode => (
              <button
                key={mode}
                style={{
                  ...styles.viewBtn,
                  ...(viewMode === mode ? styles.viewBtnActive : {})
                }}
                onClick={() => setViewMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div style={styles.calendarGrid}>
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            modules={modules}
            onModuleClick={onModuleClick}
            onDayClick={handleDayClick}
            simulatedChanges={simulatedChanges}
          />
        )}

        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            modules={modules}
            onModuleClick={onModuleClick}
            onDayClick={handleDayClick}
            simulatedChanges={simulatedChanges}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            currentDate={currentDate}
            modules={modules}
            onModuleClick={onModuleClick}
            simulatedChanges={simulatedChanges}
          />
        )}
      </div>

      {/* Status Legend */}
      <StatusLegend />
    </div>
  );
}
