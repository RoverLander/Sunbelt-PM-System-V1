/**
 * Timeline Utilities for the Production Calendar Gantt/Timeline View
 */

// Zoom level configurations
export const ZOOM_LEVELS = {
  day: {
    label: 'Day',
    dayWidth: 120,      // Width per day in pixels
    headerFormat: 'short', // Date format for header
    gridLines: 1,       // Grid lines per day
    showHours: true
  },
  week: {
    label: 'Week',
    dayWidth: 60,
    headerFormat: 'numeric',
    gridLines: 1,
    showHours: false
  },
  month: {
    label: 'Month',
    dayWidth: 24,
    headerFormat: 'numeric',
    gridLines: 7, // Weekly grid lines
    showHours: false
  }
};

/**
 * Get the start of the day (midnight)
 */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the day (23:59:59.999)
 */
export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get the start of the week (Monday)
 */
export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the start of the month
 */
export function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Add days to a date
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Get the difference in days between two dates
 */
export function diffInDays(date1, date2) {
  const d1 = startOfDay(date1);
  const d2 = startOfDay(date2);
  const diffTime = d2 - d1;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if two date ranges overlap
 */
export function rangesOverlap(start1, end1, start2, end2) {
  return start1 <= end2 && end1 >= start2;
}

/**
 * Get date range for timeline based on zoom level
 */
export function getTimelineRange(centerDate, zoomLevel, viewportWidth) {
  const config = ZOOM_LEVELS[zoomLevel];
  const daysVisible = Math.ceil(viewportWidth / config.dayWidth);
  const halfDays = Math.floor(daysVisible / 2);

  const start = addDays(centerDate, -halfDays - 7); // Buffer for scrolling
  const end = addDays(centerDate, halfDays + 7);

  return { start: startOfDay(start), end: endOfDay(end) };
}

/**
 * Generate date headers for timeline based on zoom level
 */
export function generateDateHeaders(startDate, endDate, zoomLevel) {
  const headers = [];
  const config = ZOOM_LEVELS[zoomLevel];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const isToday = isSameDay(currentDate, new Date());
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

    headers.push({
      date: new Date(currentDate),
      label: formatDateHeader(currentDate, config.headerFormat),
      dayOfWeek: getDayOfWeekShort(currentDate),
      isToday,
      isWeekend
    });

    currentDate = addDays(currentDate, 1);
  }

  return headers;
}

/**
 * Format date for header display
 */
export function formatDateHeader(date, format) {
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'numeric':
      return date.getDate().toString();
    case 'full':
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    default:
      return date.getDate().toString();
  }
}

/**
 * Get short day of week name
 */
export function getDayOfWeekShort(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Calculate pixel position for a date on the timeline
 */
export function dateToPixel(date, timelineStart, zoomLevel) {
  const config = ZOOM_LEVELS[zoomLevel];
  const days = diffInDays(timelineStart, date);
  return days * config.dayWidth;
}

/**
 * Calculate date from pixel position on the timeline
 */
export function pixelToDate(pixel, timelineStart, zoomLevel) {
  const config = ZOOM_LEVELS[zoomLevel];
  const days = Math.round(pixel / config.dayWidth);
  return addDays(timelineStart, days);
}

/**
 * Calculate bar dimensions for a module on the timeline
 */
export function calculateBarPosition(module, timelineStart, zoomLevel) {
  const config = ZOOM_LEVELS[zoomLevel];

  const moduleStart = module.scheduled_start ? new Date(module.scheduled_start) : new Date();
  const moduleEnd = module.scheduled_end ? new Date(module.scheduled_end) : addDays(moduleStart, 5);

  const startX = dateToPixel(moduleStart, timelineStart, zoomLevel);
  const endX = dateToPixel(moduleEnd, timelineStart, zoomLevel);
  const width = Math.max(endX - startX + config.dayWidth, config.dayWidth); // Minimum width of 1 day

  return {
    left: startX,
    width: width,
    startDate: moduleStart,
    endDate: moduleEnd
  };
}

/**
 * Snap a pixel position to the nearest day grid
 */
export function snapToGrid(pixel, zoomLevel) {
  const config = ZOOM_LEVELS[zoomLevel];
  return Math.round(pixel / config.dayWidth) * config.dayWidth;
}

/**
 * Get the width of a single day in pixels for current zoom level
 */
export function getDayWidth(zoomLevel) {
  return ZOOM_LEVELS[zoomLevel]?.dayWidth || ZOOM_LEVELS.week.dayWidth;
}

/**
 * Calculate total timeline width based on date range and zoom level
 */
export function calculateTimelineWidth(startDate, endDate, zoomLevel) {
  const days = diffInDays(startDate, endDate) + 1;
  const config = ZOOM_LEVELS[zoomLevel];
  return days * config.dayWidth;
}

/**
 * Get module status color for timeline bar
 */
export function getModuleStatusColor(status, isRush = false) {
  if (isRush) return 'var(--danger)';

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

  return colors[status] || 'var(--sunbelt-orange)';
}

/**
 * Check if a module is behind schedule
 */
export function isModuleBehindSchedule(module) {
  if (!module.scheduled_end) return false;
  const endDate = new Date(module.scheduled_end);
  const today = new Date();

  if (module.status === 'Completed' || module.status === 'Shipped') {
    return false;
  }

  return endDate < today;
}

/**
 * Calculate progress bar width based on dates
 */
export function calculateProgressWidth(module, barWidth) {
  const progress = module.progress || 0;
  return Math.min(barWidth, (progress / 100) * barWidth);
}

/**
 * Generate week numbers for month view header
 */
export function generateWeekNumbers(startDate, endDate) {
  const weeks = [];
  let currentDate = startOfWeek(startDate);

  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    const weekEnd = addDays(currentDate, 6);

    weeks.push({
      start: weekStart,
      end: weekEnd,
      weekNumber: getWeekNumber(weekStart),
      label: `Week ${getWeekNumber(weekStart)}`
    });

    currentDate = addDays(currentDate, 7);
  }

  return weeks;
}

/**
 * Get ISO week number for a date
 */
export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Format duration in days to readable string
 */
export function formatDuration(days) {
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (remainingDays === 0) {
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  return `${weeks}w ${remainingDays}d`;
}
