/**
 * Calendar Utility - Comprehensive Date & Calendar Management
 * Provides all date manipulation, calendar item building, and display utilities
 * 
 * Features:
 * - Timezone-safe date operations
 * - Week, month, quarter, and year date ranges
 * - Business day calculations
 * - Calendar item building and grouping
 * - Overdue and upcoming item detection
 * - Flexible date formatting
 * - Project color management
 * - Summary statistics
 * 
 * All date operations use local timezone unless otherwise specified
 */

// ===== CONFIGURATION =====

/**
 * Sunbelt color palette for projects
 * Used when projects don't have assigned colors
 */
export const PROJECT_COLORS = [
  '#FF6B35', // Sunbelt Orange (primary)
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#64748B', // Slate
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
];

/**
 * Calendar item types enum
 */
export const CALENDAR_ITEM_TYPES = {
  TASK: 'task',
  RFI: 'rfi',
  SUBMITTAL: 'submittal',
  MILESTONE: 'milestone',
  ONLINE_DATE: 'online_date',
  OFFLINE_DATE: 'offline_date',
  DELIVERY_DATE: 'delivery_date',
};

/**
 * Item type display configuration
 * Includes labels, icons, colors, and sort priority
 */
export const ITEM_TYPE_CONFIG = {
  task: {
    label: 'Task',
    shortLabel: 'T',
    icon: 'CheckSquare',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    priority: 5,
  },
  rfi: {
    label: 'RFI',
    shortLabel: 'R',
    icon: 'MessageSquare',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    priority: 6,
  },
  submittal: {
    label: 'Submittal',
    shortLabel: 'S',
    icon: 'ClipboardList',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    priority: 7,
  },
  milestone: {
    label: 'Milestone',
    shortLabel: 'M',
    icon: 'Flag',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    priority: 4,
  },
  online_date: {
    label: 'Online',
    shortLabel: 'ON',
    icon: 'Play',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    priority: 1,
  },
  offline_date: {
    label: 'Offline',
    shortLabel: 'OFF',
    icon: 'Square',
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.1)',
    priority: 2,
  },
  delivery_date: {
    label: 'Delivery',
    shortLabel: 'D',
    icon: 'Truck',
    color: '#FF6B35',
    bgColor: 'rgba(255, 107, 53, 0.1)',
    priority: 3,
  },
};

/**
 * Status configurations for styling
 */
export const STATUS_CONFIG = {
  // Task statuses
  'Not Started': { color: '#64748B', bgColor: 'rgba(100, 116, 139, 0.1)', isComplete: false },
  'In Progress': { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', isComplete: false },
  'Awaiting Response': { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', isComplete: false },
  'Completed': { color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)', isComplete: true },
  'Cancelled': { color: '#64748B', bgColor: 'rgba(100, 116, 139, 0.1)', isComplete: true },
  
  // RFI statuses
  'Open': { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', isComplete: false },
  'Answered': { color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)', isComplete: false },
  'Closed': { color: '#64748B', bgColor: 'rgba(100, 116, 139, 0.1)', isComplete: true },
  
  // Submittal statuses
  'Pending': { color: '#64748B', bgColor: 'rgba(100, 116, 139, 0.1)', isComplete: false },
  'Submitted': { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)', isComplete: false },
  'Under Review': { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', isComplete: false },
  'Approved': { color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)', isComplete: true },
  'Approved as Noted': { color: '#06B6D4', bgColor: 'rgba(6, 182, 212, 0.1)', isComplete: true },
  'Rejected': { color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)', isComplete: false },
};

/**
 * Week start day (0 = Sunday, 1 = Monday)
 */
const WEEK_START = 1; // Monday

// ===== DATE CREATION HELPERS =====

/**
 * Create a date object from year, month, day without timezone issues
 * This ensures consistent local date creation
 * 
 * @param {number} year - Full year
 * @param {number} month - Month (0-11)
 * @param {number} day - Day of month
 * @returns {Date} Local date object
 */
const createLocalDate = (year, month, day) => {
  return new Date(year, month, day, 0, 0, 0, 0);
};

/**
 * Parse a date string (YYYY-MM-DD) into a local date
 * CRITICAL: This avoids timezone issues that occur with new Date('YYYY-MM-DD')
 * 
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {Date} Local date object
 */
export const parseLocalDate = (dateInput) => {
  if (!dateInput) return null;
  
  // If already a Date object, normalize to local midnight
  if (dateInput instanceof Date) {
    return createLocalDate(
      dateInput.getFullYear(),
      dateInput.getMonth(),
      dateInput.getDate()
    );
  }
  
  // Parse string format YYYY-MM-DD
  const dateStr = String(dateInput).split('T')[0];
  const parts = dateStr.split('-');
  
  if (parts.length !== 3) {
    console.warn('Invalid date format:', dateInput);
    return null;
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const day = parseInt(parts[2], 10);
  
  return createLocalDate(year, month, day);
};

/**
 * Get today's date at midnight (local time)
 * @returns {Date} Today's date
 */
export const getToday = () => {
  const now = new Date();
  return createLocalDate(now.getFullYear(), now.getMonth(), now.getDate());
};

// ===== DATE FORMATTING =====

/**
 * Format date as YYYY-MM-DD string (for keys and comparison)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateKey = (date) => {
  const d = parseLocalDate(date);
  if (!d) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format date for display with various format options
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'weekday', 'dayNum', 'monthYear', 'full'
 * @returns {string} Formatted date string
 */
export const formatDisplayDate = (date, format = 'short') => {
  const d = parseLocalDate(date);
  if (!d) return '';
  
  const formats = {
    short: { month: 'short', day: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    weekday: { weekday: 'short' },
    weekdayLong: { weekday: 'long' },
    dayNum: null, // Special case
    monthYear: { month: 'long', year: 'numeric' },
    monthShort: { month: 'short', year: 'numeric' },
    full: { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
    iso: null, // Special case
  };
  
  if (format === 'dayNum') {
    return String(d.getDate());
  }
  
  if (format === 'iso') {
    return formatDateKey(d);
  }
  
  const options = formats[format] || formats.short;
  return d.toLocaleDateString('en-US', options);
};

/**
 * Get month name
 * @param {Date|string} date - Date
 * @param {boolean} short - Use short format
 * @returns {string} Month name
 */
export const getMonthName = (date, short = false) => {
  const d = parseLocalDate(date);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: short ? 'short' : 'long' });
};

/**
 * Get month and year text (e.g., "January 2025")
 * @param {Date|string} date - Date
 * @returns {string} Month and year text
 */
export const getMonthText = (date) => {
  const d = parseLocalDate(date);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Get week range text (e.g., "Jan 1 - 7, 2025" or "Dec 30 - Jan 5, 2025")
 * @param {Date[]} dates - Array of dates in the week
 * @returns {string} Week range text
 */
export const getWeekRangeText = (dates) => {
  if (!dates || dates.length === 0) return '';
  
  const start = dates[0];
  const end = dates[dates.length - 1];
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  
  if (startYear !== endYear) {
    return `${startMonth} ${start.getDate()}, ${startYear} - ${endMonth} ${end.getDate()}, ${endYear}`;
  }
  
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${endYear}`;
  }
  
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${endYear}`;
};

/**
 * Get day range text for a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} Range text
 */
export const getDateRangeText = (startDate, endDate) => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  
  if (!start || !end) return '';
  
  return getWeekRangeText([start, end]);
};

// ===== DATE COMPARISON =====

/**
 * Check if two dates are the same day
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  return formatDateKey(date1) === formatDateKey(date2);
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if today
 */
export const isToday = (date) => {
  return isSameDay(date, getToday());
};

/**
 * Check if date is in the past (before today)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if past
 */
export const isPast = (date) => {
  const d = parseLocalDate(date);
  const today = getToday();
  if (!d) return false;
  return d < today;
};

/**
 * Check if date is in the future (after today)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if future
 */
export const isFuture = (date) => {
  const d = parseLocalDate(date);
  const today = getToday();
  if (!d) return false;
  return d > today;
};

/**
 * Check if date is a weekend (Saturday or Sunday)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if weekend
 */
export const isWeekend = (date) => {
  const d = parseLocalDate(date);
  if (!d) return false;
  const day = d.getDay();
  return day === 0 || day === 6;
};

/**
 * Check if date is a business day (Monday-Friday)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if business day
 */
export const isBusinessDay = (date) => {
  return !isWeekend(date);
};

/**
 * Check if date is in the current month
 * @param {Date|string} date - Date to check
 * @param {Date|string} referenceDate - Reference date (defaults to today)
 * @returns {boolean} True if same month
 */
export const isCurrentMonth = (date, referenceDate = null) => {
  const d = parseLocalDate(date);
  const ref = referenceDate ? parseLocalDate(referenceDate) : getToday();
  if (!d || !ref) return false;
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
};

/**
 * Check if date is in the current week
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if in current week
 */
export const isCurrentWeek = (date) => {
  const d = parseLocalDate(date);
  if (!d) return false;
  
  const weekDates = getWeekDates(getToday());
  const dateKey = formatDateKey(d);
  
  return weekDates.some(wd => formatDateKey(wd) === dateKey);
};

/**
 * Compare two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDates = (date1, date2) => {
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  
  if (!d1 && !d2) return 0;
  if (!d1) return 1;
  if (!d2) return -1;
  
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};

// ===== DATE ARITHMETIC =====

/**
 * Add days to a date
 * @param {Date|string} date - Start date
 * @param {number} days - Days to add (can be negative)
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const d = parseLocalDate(date);
  if (!d) return null;
  
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add weeks to a date
 * @param {Date|string} date - Start date
 * @param {number} weeks - Weeks to add (can be negative)
 * @returns {Date} New date
 */
export const addWeeks = (date, weeks) => {
  return addDays(date, weeks * 7);
};

/**
 * Add months to a date
 * @param {Date|string} date - Start date
 * @param {number} months - Months to add (can be negative)
 * @returns {Date} New date
 */
export const addMonths = (date, months) => {
  const d = parseLocalDate(date);
  if (!d) return null;
  
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Add years to a date
 * @param {Date|string} date - Start date
 * @param {number} years - Years to add (can be negative)
 * @returns {Date} New date
 */
export const addYears = (date, years) => {
  const d = parseLocalDate(date);
  if (!d) return null;
  
  const result = new Date(d);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

/**
 * Get the difference in days between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Number of days (positive if date1 > date2)
 */
export const getDaysDifference = (date1, date2) => {
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  
  if (!d1 || !d2) return 0;
  
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get days until a date (from today)
 * @param {Date|string} date - Target date
 * @returns {number} Days until date (negative if past)
 */
export const getDaysUntil = (date) => {
  return getDaysDifference(date, getToday());
};

/**
 * Get the next business day from a date
 * @param {Date|string} date - Start date
 * @returns {Date} Next business day
 */
export const getNextBusinessDay = (date) => {
  let d = addDays(date, 1);
  while (isWeekend(d)) {
    d = addDays(d, 1);
  }
  return d;
};

/**
 * Get business days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of business days
 */
export const getBusinessDaysBetween = (startDate, endDate) => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  
  if (!start || !end || start >= end) return 0;
  
  let count = 0;
  let current = new Date(start);
  
  while (current < end) {
    if (isBusinessDay(current)) {
      count++;
    }
    current = addDays(current, 1);
  }
  
  return count;
};

// ===== DATE RANGE GENERATORS =====

/**
 * Get week dates for a given date (Monday-Sunday or Sunday-Saturday based on WEEK_START)
 * @param {Date|string} date - Any date in the week
 * @returns {Date[]} Array of 7 dates for the week
 */
export const getWeekDates = (date) => {
  const d = parseLocalDate(date);
  if (!d) return [];
  
  const dayOfWeek = d.getDay();
  
  // Calculate days to subtract to get to week start
  let daysToSubtract;
  if (WEEK_START === 1) { // Monday start
    daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  } else { // Sunday start
    daysToSubtract = dayOfWeek;
  }
  
  const weekStart = addDays(d, -daysToSubtract);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(weekStart, i));
  }
  
  return dates;
};

/**
 * Get month dates including leading/trailing days to fill the calendar grid
 * @param {Date|string} date - Any date in the month
 * @returns {Date[]} Array of dates for calendar display (usually 35 or 42 days)
 */
export const getMonthDates = (date) => {
  const d = parseLocalDate(date);
  if (!d) return [];
  
  const year = d.getFullYear();
  const month = d.getMonth();
  
  // First and last day of the month
  const firstDay = createLocalDate(year, month, 1);
  const lastDay = createLocalDate(year, month + 1, 0);
  
  // Calculate start day (Monday of the week containing the first day)
  const firstDayOfWeek = firstDay.getDay();
  let daysToSubtract;
  if (WEEK_START === 1) { // Monday start
    daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  } else { // Sunday start
    daysToSubtract = firstDayOfWeek;
  }
  const start = addDays(firstDay, -daysToSubtract);
  
  // Calculate end day (Sunday of the week containing the last day)
  const lastDayOfWeek = lastDay.getDay();
  let daysToAdd;
  if (WEEK_START === 1) { // Monday start
    daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
  } else { // Sunday start
    daysToAdd = lastDayOfWeek === 6 ? 0 : 6 - lastDayOfWeek;
  }
  const end = addDays(lastDay, daysToAdd);
  
  // Generate all dates
  const dates = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }
  
  return dates;
};

/**
 * Get quarter dates (first and last day of quarter)
 * @param {Date|string} date - Any date in the quarter
 * @returns {Object} { start: Date, end: Date, quarter: number, year: number }
 */
export const getQuarterDates = (date) => {
  const d = parseLocalDate(date);
  if (!d) return null;
  
  const year = d.getFullYear();
  const month = d.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  
  const startMonth = (quarter - 1) * 3;
  const start = createLocalDate(year, startMonth, 1);
  const end = createLocalDate(year, startMonth + 3, 0);
  
  return { start, end, quarter, year };
};

/**
 * Get year dates (first and last day of year)
 * @param {Date|string} date - Any date in the year
 * @returns {Object} { start: Date, end: Date, year: number }
 */
export const getYearDates = (date) => {
  const d = parseLocalDate(date);
  if (!d) return null;
  
  const year = d.getFullYear();
  const start = createLocalDate(year, 0, 1);
  const end = createLocalDate(year, 11, 31);
  
  return { start, end, year };
};

/**
 * Get array of dates between two dates (inclusive)
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Date[]} Array of dates
 */
export const getDateRange = (startDate, endDate) => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  
  if (!start || !end || start > end) return [];
  
  const dates = [];
  let current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }
  
  return dates;
};

/**
 * Get first day of month
 * @param {Date|string} date - Any date in the month
 * @returns {Date} First day of month
 */
export const getFirstDayOfMonth = (date) => {
  const d = parseLocalDate(date);
  if (!d) return null;
  return createLocalDate(d.getFullYear(), d.getMonth(), 1);
};

/**
 * Get last day of month
 * @param {Date|string} date - Any date in the month
 * @returns {Date} Last day of month
 */
export const getLastDayOfMonth = (date) => {
  const d = parseLocalDate(date);
  if (!d) return null;
  return createLocalDate(d.getFullYear(), d.getMonth() + 1, 0);
};

/**
 * Get number of days in month
 * @param {Date|string} date - Any date in the month
 * @returns {number} Number of days
 */
export const getDaysInMonth = (date) => {
  const lastDay = getLastDayOfMonth(date);
  return lastDay ? lastDay.getDate() : 0;
};

/**
 * Get ISO week number
 * @param {Date|string} date - Date to check
 * @returns {number} Week number (1-53)
 */
export const getWeekNumber = (date) => {
  const d = parseLocalDate(date);
  if (!d) return 0;
  
  // Copy date so we don't modify original
  const target = new Date(d);
  
  // ISO week starts on Monday, so adjust
  const dayNum = (target.getDay() + 6) % 7;
  
  // Set to nearest Thursday (ISO weeks are defined by Thursday)
  target.setDate(target.getDate() - dayNum + 3);
  
  // January 4th is always in week 1
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3);
  
  // Calculate week number
  const diff = target - firstThursday;
  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
};

// ===== PROJECT COLOR MANAGEMENT =====

/**
 * Get color for a project (use stored color or assign from palette)
 * @param {Object} project - Project object
 * @param {number} index - Index for color assignment
 * @returns {string} Hex color string
 */
export const getProjectColor = (project, index = 0) => {
  if (project?.color) return project.color;
  return PROJECT_COLORS[index % PROJECT_COLORS.length];
};

/**
 * Build a project color map from an array of projects
 * @param {Object[]} projects - Array of projects
 * @returns {Object} Map of projectId -> color
 */
export const buildProjectColorMap = (projects) => {
  const map = {};
  projects?.forEach((project, index) => {
    map[project.id] = getProjectColor(project, index);
  });
  return map;
};

/**
 * Get contrasting text color (black or white) for a background color
 * @param {string} hexColor - Hex color string
 * @returns {string} '#000000' or '#FFFFFF'
 */
export const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000';
  
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// ===== CALENDAR ITEM BUILDING =====

/**
 * Build calendar items from project data
 * @param {Object[]} projects - Array of projects
 * @param {Object[]} tasks - Array of tasks
 * @param {Object[]} rfis - Array of RFIs
 * @param {Object[]} submittals - Array of submittals
 * @param {Object[]} milestones - Array of milestones
 * @returns {Object[]} Array of calendar items
 */
export const buildCalendarItems = (projects, tasks, rfis, submittals, milestones) => {
  const items = [];
  const projectColorMap = buildProjectColorMap(projects);

  // Add tasks
  tasks?.forEach(task => {
    if (task.due_date) {
      items.push({
        id: `task-${task.id}`,
        type: CALENDAR_ITEM_TYPES.TASK,
        title: task.title,
        date: task.due_date,
        projectId: task.project_id,
        projectName: task.project?.name || 'Unknown Project',
        projectNumber: task.project?.project_number,
        color: projectColorMap[task.project_id] || PROJECT_COLORS[0],
        status: task.status,
        priority: task.priority,
        data: task,
      });
    }
  });

  // Add RFIs
  rfis?.forEach(rfi => {
    if (rfi.due_date) {
      items.push({
        id: `rfi-${rfi.id}`,
        type: CALENDAR_ITEM_TYPES.RFI,
        title: `${rfi.rfi_number}: ${rfi.subject}`,
        date: rfi.due_date,
        projectId: rfi.project_id,
        projectName: rfi.project?.name || 'Unknown Project',
        projectNumber: rfi.project?.project_number,
        color: projectColorMap[rfi.project_id] || PROJECT_COLORS[0],
        status: rfi.status,
        priority: rfi.priority,
        data: rfi,
      });
    }
  });

  // Add submittals
  submittals?.forEach(submittal => {
    if (submittal.due_date) {
      items.push({
        id: `submittal-${submittal.id}`,
        type: CALENDAR_ITEM_TYPES.SUBMITTAL,
        title: `${submittal.submittal_number}: ${submittal.title}`,
        date: submittal.due_date,
        projectId: submittal.project_id,
        projectName: submittal.project?.name || 'Unknown Project',
        projectNumber: submittal.project?.project_number,
        color: projectColorMap[submittal.project_id] || PROJECT_COLORS[0],
        status: submittal.status,
        priority: submittal.priority,
        data: submittal,
      });
    }
  });

  // Add milestones
  milestones?.forEach(milestone => {
    if (milestone.due_date) {
      items.push({
        id: `milestone-${milestone.id}`,
        type: CALENDAR_ITEM_TYPES.MILESTONE,
        title: milestone.name,
        date: milestone.due_date,
        projectId: milestone.project_id,
        projectName: milestone.project?.name || 'Unknown Project',
        projectNumber: milestone.project?.project_number,
        color: projectColorMap[milestone.project_id] || PROJECT_COLORS[0],
        status: milestone.status,
        data: milestone,
      });
    }
  });

  // Add project dates
  projects?.forEach((project, index) => {
    const color = getProjectColor(project, index);
    
    if (project.target_online_date) {
      items.push({
        id: `online-${project.id}`,
        type: CALENDAR_ITEM_TYPES.ONLINE_DATE,
        title: `${project.project_number || project.name} - Online`,
        date: project.target_online_date,
        projectId: project.id,
        projectName: project.name,
        projectNumber: project.project_number,
        color,
        status: project.status,
        data: project,
      });
    }
    
    if (project.target_offline_date) {
      items.push({
        id: `offline-${project.id}`,
        type: CALENDAR_ITEM_TYPES.OFFLINE_DATE,
        title: `${project.project_number || project.name} - Offline`,
        date: project.target_offline_date,
        projectId: project.id,
        projectName: project.name,
        projectNumber: project.project_number,
        color,
        status: project.status,
        data: project,
      });
    }
    
    if (project.delivery_date) {
      items.push({
        id: `delivery-${project.id}`,
        type: CALENDAR_ITEM_TYPES.DELIVERY_DATE,
        title: `${project.project_number || project.name} - Delivery`,
        date: project.delivery_date,
        projectId: project.id,
        projectName: project.name,
        projectNumber: project.project_number,
        color,
        status: project.status,
        data: project,
      });
    }
  });

  return items;
};

/**
 * Build calendar items for a single project
 * @param {Object} project - Project object
 * @param {Object[]} tasks - Array of tasks
 * @param {Object[]} rfis - Array of RFIs
 * @param {Object[]} submittals - Array of submittals
 * @param {Object[]} milestones - Array of milestones
 * @returns {Object[]} Array of calendar items
 */
export const buildProjectCalendarItems = (project, tasks, rfis, submittals, milestones) => {
  return buildCalendarItems([project], tasks, rfis, submittals, milestones);
};

// ===== ITEM GROUPING & SORTING =====

/**
 * Group items by date
 * @param {Object[]} items - Array of calendar items
 * @returns {Object} Map of dateKey -> items[]
 */
export const groupItemsByDate = (items) => {
  const grouped = {};
  
  items?.forEach(item => {
    if (!item.date) return;
    
    const dateKey = formatDateKey(item.date);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(item);
  });
  
  // Sort items within each day by type priority, then by title
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => {
      const priorityA = ITEM_TYPE_CONFIG[a.type]?.priority || 99;
      const priorityB = ITEM_TYPE_CONFIG[b.type]?.priority || 99;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return (a.title || '').localeCompare(b.title || '');
    });
  });
  
  return grouped;
};

/**
 * Group items by project
 * @param {Object[]} items - Array of calendar items
 * @returns {Object} Map of projectId -> items[]
 */
export const groupItemsByProject = (items) => {
  const grouped = {};
  
  items?.forEach(item => {
    const projectId = item.projectId || 'unassigned';
    if (!grouped[projectId]) {
      grouped[projectId] = [];
    }
    grouped[projectId].push(item);
  });
  
  return grouped;
};

/**
 * Group items by type
 * @param {Object[]} items - Array of calendar items
 * @returns {Object} Map of type -> items[]
 */
export const groupItemsByType = (items) => {
  const grouped = {};
  
  items?.forEach(item => {
    const type = item.type || 'unknown';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(item);
  });
  
  return grouped;
};

/**
 * Sort items by date
 * @param {Object[]} items - Array of calendar items
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Object[]} Sorted array
 */
export const sortItemsByDate = (items, direction = 'asc') => {
  return [...(items || [])].sort((a, b) => {
    const comparison = compareDates(a.date, b.date);
    return direction === 'desc' ? -comparison : comparison;
  });
};

// ===== ITEM FILTERING =====

/**
 * Filter items by date range
 * @param {Object[]} items - Array of calendar items
 * @param {Date|string} startDate - Start date (inclusive)
 * @param {Date|string} endDate - End date (inclusive)
 * @returns {Object[]} Filtered items
 */
export const filterItemsByDateRange = (items, startDate, endDate) => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  
  if (!start || !end) return items || [];
  
  return (items || []).filter(item => {
    const itemDate = parseLocalDate(item.date);
    if (!itemDate) return false;
    return itemDate >= start && itemDate <= end;
  });
};

/**
 * Filter items by project
 * @param {Object[]} items - Array of calendar items
 * @param {string} projectId - Project ID to filter by
 * @returns {Object[]} Filtered items
 */
export const filterItemsByProject = (items, projectId) => {
  if (!projectId || projectId === 'all') return items || [];
  return (items || []).filter(item => item.projectId === projectId);
};

/**
 * Filter items by type
 * @param {Object[]} items - Array of calendar items
 * @param {string} type - Item type to filter by
 * @returns {Object[]} Filtered items
 */
export const filterItemsByType = (items, type) => {
  if (!type || type === 'all') return items || [];
  return (items || []).filter(item => item.type === type);
};

/**
 * Filter items by status
 * @param {Object[]} items - Array of calendar items
 * @param {string|string[]} statuses - Status or array of statuses to include
 * @returns {Object[]} Filtered items
 */
export const filterItemsByStatus = (items, statuses) => {
  if (!statuses) return items || [];
  
  const statusArray = Array.isArray(statuses) ? statuses : [statuses];
  return (items || []).filter(item => statusArray.includes(item.status));
};

/**
 * Get overdue items (past due date and not completed)
 * @param {Object[]} items - Array of calendar items
 * @returns {Object[]} Overdue items
 */
export const getOverdueItems = (items) => {
  const today = getToday();
  const completedStatuses = ['Completed', 'Cancelled', 'Closed', 'Approved', 'Approved as Noted'];
  
  return (items || []).filter(item => {
    const itemDate = parseLocalDate(item.date);
    if (!itemDate) return false;
    return itemDate < today && !completedStatuses.includes(item.status);
  });
};

/**
 * Get upcoming items (due within specified days)
 * @param {Object[]} items - Array of calendar items
 * @param {number} days - Number of days to look ahead
 * @returns {Object[]} Upcoming items
 */
export const getUpcomingItems = (items, days = 7) => {
  const today = getToday();
  const endDate = addDays(today, days);
  const completedStatuses = ['Completed', 'Cancelled', 'Closed', 'Approved', 'Approved as Noted'];
  
  return (items || []).filter(item => {
    const itemDate = parseLocalDate(item.date);
    if (!itemDate) return false;
    return itemDate >= today && itemDate <= endDate && !completedStatuses.includes(item.status);
  });
};

/**
 * Get items due today
 * @param {Object[]} items - Array of calendar items
 * @returns {Object[]} Items due today
 */
export const getTodayItems = (items) => {
  return (items || []).filter(item => isToday(item.date));
};

// ===== SUMMARY STATISTICS =====

/**
 * Get calendar summary statistics
 * @param {Object[]} items - Array of calendar items
 * @returns {Object} Summary statistics
 */
export const getCalendarSummary = (items) => {
  const allItems = items || [];
  const overdue = getOverdueItems(allItems);
  const upcoming = getUpcomingItems(allItems, 7);
  const todayItems = getTodayItems(allItems);
  const byType = groupItemsByType(allItems);
  
  return {
    total: allItems.length,
    overdue: overdue.length,
    overdueItems: overdue,
    dueToday: todayItems.length,
    dueTodayItems: todayItems,
    upcoming: upcoming.length,
    upcomingItems: upcoming,
    byType: {
      tasks: (byType.task || []).length,
      rfis: (byType.rfi || []).length,
      submittals: (byType.submittal || []).length,
      milestones: (byType.milestone || []).length,
      projectDates: (byType.online_date || []).length + 
                   (byType.offline_date || []).length + 
                   (byType.delivery_date || []).length,
    },
  };
};

/**
 * Get items for a specific date with summary
 * @param {Object[]} items - Array of calendar items
 * @param {Date|string} date - Date to get items for
 * @returns {Object} { items: [], summary: {} }
 */
export const getDateItems = (items, date) => {
  const dateKey = formatDateKey(date);
  const grouped = groupItemsByDate(items);
  const dateItems = grouped[dateKey] || [];
  
  return {
    items: dateItems,
    summary: {
      total: dateItems.length,
      overdue: dateItems.filter(i => {
        const completedStatuses = ['Completed', 'Cancelled', 'Closed', 'Approved', 'Approved as Noted'];
        return isPast(i.date) && !completedStatuses.includes(i.status);
      }).length,
      byType: groupItemsByType(dateItems),
    },
  };
};

// ===== DEFAULT EXPORT =====

export default {
  // Configuration
  PROJECT_COLORS,
  CALENDAR_ITEM_TYPES,
  ITEM_TYPE_CONFIG,
  STATUS_CONFIG,
  
  // Date creation
  parseLocalDate,
  getToday,
  
  // Formatting
  formatDateKey,
  formatDisplayDate,
  getMonthName,
  getMonthText,
  getWeekRangeText,
  getDateRangeText,
  
  // Comparison
  isSameDay,
  isToday,
  isPast,
  isFuture,
  isWeekend,
  isBusinessDay,
  isCurrentMonth,
  isCurrentWeek,
  compareDates,
  
  // Arithmetic
  addDays,
  addWeeks,
  addMonths,
  addYears,
  getDaysDifference,
  getDaysUntil,
  getNextBusinessDay,
  getBusinessDaysBetween,
  
  // Date ranges
  getWeekDates,
  getMonthDates,
  getQuarterDates,
  getYearDates,
  getDateRange,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getDaysInMonth,
  getWeekNumber,
  
  // Colors
  getProjectColor,
  buildProjectColorMap,
  getContrastColor,
  
  // Item building
  buildCalendarItems,
  buildProjectCalendarItems,
  
  // Grouping & sorting
  groupItemsByDate,
  groupItemsByProject,
  groupItemsByType,
  sortItemsByDate,
  
  // Filtering
  filterItemsByDateRange,
  filterItemsByProject,
  filterItemsByType,
  filterItemsByStatus,
  getOverdueItems,
  getUpcomingItems,
  getTodayItems,
  
  // Statistics
  getCalendarSummary,
  getDateItems,
};