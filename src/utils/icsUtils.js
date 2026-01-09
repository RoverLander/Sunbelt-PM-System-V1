/**
 * ICS Calendar Export Utility
 * Generates .ics files compatible with Outlook, Google Calendar, Apple Calendar
 * 
 * RFC 5545 Compliant - https://datatracker.ietf.org/doc/html/rfc5545
 * 
 * Bug Fixes Applied (Jan 2026):
 * - Fixed date off-by-one: Parse date string directly instead of new Date() with UTC issues
 * - Fixed zero-duration events: Use exclusive end date (day + 1) for all-day events per RFC 5545
 * - Added 75-char line folding per RFC 5545
 * - Added SEQUENCE property for Outlook compatibility
 * - Added TRANSP property so all-day events show as "free" not blocking time
 * - Added STATUS property for better calendar sync
 * - Updated deprecated substr() to substring()
 */

// ===== DATE FORMATTING =====

/**
 * Format a date for ICS format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
 * 
 * CRITICAL FIX: Parse the date string directly to avoid timezone/UTC issues
 * that were causing dates to appear on the wrong day for ~50% of users
 * 
 * @param {string} dateString - Date string in YYYY-MM-DD or ISO format
 * @param {boolean} allDay - Whether this is an all-day event
 * @returns {string} Formatted date string for ICS
 */
const formatICSDate = (dateString, allDay = true) => {
  if (allDay) {
    // FIXED: Parse date string directly to avoid UTC conversion issues
    // Previously: new Date(dateString) would parse as UTC midnight,
    // then getDate() would return the previous day in many timezones
    const dateParts = dateString.split('T')[0].split('-');
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];
    return `${year}${month}${day}`;
  } else {
    // For timed events, use UTC format
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }
};

/**
 * Calculate exclusive end date for all-day events
 * RFC 5545 requires DTEND to be the day AFTER the event ends (exclusive)
 * 
 * CRITICAL FIX: All-day events were showing as zero-duration in Outlook
 * because we weren't adding +1 day to the end date
 * 
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Next day formatted as YYYYMMDD
 */
const getExclusiveEndDate = (dateString) => {
  const dateParts = dateString.split('T')[0].split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateParts[2], 10);
  
  // Create date and add one day
  const date = new Date(year, month, day);
  date.setDate(date.getDate() + 1);
  
  // Format the next day
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  
  return `${nextYear}${nextMonth}${nextDay}`;
};

// ===== UTILITY FUNCTIONS =====

/**
 * Generate a unique ID for the event
 * @returns {string} Unique event identifier
 */
const generateUID = () => {
  // FIXED: Use substring() instead of deprecated substr()
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@sunbeltpm.com`;
};

/**
 * Escape special characters for ICS format
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for ICS
 */
const escapeICS = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Fold lines to 75 octets per RFC 5545 Section 3.1
 * Lines longer than 75 characters must be folded with CRLF + space
 * 
 * NEW: Previously missing, causing issues with long descriptions in some clients
 * 
 * @param {string} line - Single ICS property line to fold
 * @returns {string} Folded line(s)
 */
const foldLine = (line) => {
  const MAX_LINE_LENGTH = 75;
  
  if (line.length <= MAX_LINE_LENGTH) {
    return line;
  }
  
  const result = [];
  let remaining = line;
  let isFirstLine = true;
  
  while (remaining.length > 0) {
    // First line gets full 75 chars, continuation lines get 74 (after the space)
    const maxChars = isFirstLine ? MAX_LINE_LENGTH : MAX_LINE_LENGTH - 1;
    const chunk = remaining.substring(0, maxChars);
    remaining = remaining.substring(maxChars);
    
    if (isFirstLine) {
      result.push(chunk);
      isFirstLine = false;
    } else {
      // Continuation lines start with a space
      result.push(' ' + chunk);
    }
  }
  
  return result.join('\r\n');
};

/**
 * Apply line folding to all lines in an ICS content array
 * @param {string[]} lines - Array of ICS property lines
 * @returns {string[]} Array with folded lines
 */
const foldAllLines = (lines) => {
  return lines.map(line => foldLine(line));
};

// ===== EVENT CREATION =====

/**
 * Create a single ICS event
 * 
 * Includes RFC 5545 compliant properties:
 * - SEQUENCE: Required by Outlook for proper syncing
 * - TRANSP: Shows all-day events as "free" instead of blocking time
 * - STATUS: Helps calendar clients with sync and display
 * 
 * @param {Object} options - Event options
 * @param {string} options.title - Event title (SUMMARY)
 * @param {string} [options.description] - Event description
 * @param {string} options.startDate - Start date (YYYY-MM-DD or ISO format)
 * @param {string} [options.endDate] - End date (defaults to start date for all-day)
 * @param {string} [options.location] - Event location
 * @param {boolean} [options.allDay=true] - Whether this is an all-day event
 * @param {string} [options.category] - Event category (Task, RFI, etc.)
 * @param {string} [options.url] - URL associated with the event
 * @param {string} [options.status='CONFIRMED'] - Event status (CONFIRMED, TENTATIVE, CANCELLED)
 * @returns {string} ICS VEVENT block
 */
const createICSEvent = ({
  title,
  description = '',
  startDate,
  endDate = null,
  location = '',
  allDay = true,
  category = '',
  url = '',
  status = 'CONFIRMED'
}) => {
  const uid = generateUID();
  const now = formatICSDate(new Date().toISOString(), false);
  const start = formatICSDate(startDate, allDay);
  
  // FIXED: For all-day events, use exclusive end date (day + 1) per RFC 5545
  // This fixes the zero-duration event bug in Outlook
  let end;
  if (allDay) {
    end = endDate ? getExclusiveEndDate(endDate) : getExclusiveEndDate(startDate);
  } else {
    end = endDate ? formatICSDate(endDate, allDay) : formatICSDate(startDate, allDay);
  }

  let event = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    // NEW: SEQUENCE property for Outlook compatibility
    'SEQUENCE:0',
  ];

  if (allDay) {
    event.push(`DTSTART;VALUE=DATE:${start}`);
    event.push(`DTEND;VALUE=DATE:${end}`);
    // NEW: TRANSP property - all-day events don't block time
    event.push('TRANSP:TRANSPARENT');
  } else {
    event.push(`DTSTART:${start}`);
    event.push(`DTEND:${end}`);
    event.push('TRANSP:OPAQUE');
  }

  // NEW: STATUS property for better calendar sync
  event.push(`STATUS:${status}`);
  
  event.push(`SUMMARY:${escapeICS(title)}`);
  
  if (description) {
    event.push(`DESCRIPTION:${escapeICS(description)}`);
  }
  
  if (location) {
    event.push(`LOCATION:${escapeICS(location)}`);
  }
  
  if (category) {
    event.push(`CATEGORIES:${escapeICS(category)}`);
  }
  
  if (url) {
    event.push(`URL:${escapeICS(url)}`);
  }

  event.push('END:VEVENT');
  
  // Apply line folding to all lines
  return foldAllLines(event).join('\r\n');
};

// ===== CALENDAR CREATION =====

/**
 * Create a complete ICS calendar with one or more events
 * @param {string[]} events - Array of VEVENT blocks
 * @param {string} [calendarName='Sunbelt PM Export'] - Calendar display name
 * @returns {string} Complete ICS calendar content
 */
const createICSCalendar = (events, calendarName = 'Sunbelt PM Export') => {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sunbelt Modular//PM System//EN',
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  
  const footer = ['END:VCALENDAR'];
  
  // Apply folding to header lines
  const foldedHeader = foldAllLines(header);
  
  return [...foldedHeader, ...events, ...footer].join('\r\n');
};

// ===== FILE DOWNLOAD =====

/**
 * Download an ICS file
 * @param {string} icsContent - Complete ICS calendar content
 * @param {string} [filename='calendar.ics'] - Download filename
 */
const downloadICS = (icsContent, filename = 'calendar.ics') => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ===== EXPORT FUNCTIONS - INDIVIDUAL ITEMS =====

/**
 * Export a single task to ICS
 * @param {Object} task - Task object with due_date
 * @param {string} [projectName] - Project name for location
 * @param {string} [projectNumber] - Project number for title prefix
 */
export const exportTaskToICS = (task, projectName = '', projectNumber = '') => {
  if (!task.due_date) {
    alert('This task has no due date set.');
    return;
  }

  const description = [
    task.description || '',
    '',
    `Status: ${task.status}`,
    `Priority: ${task.priority || 'Normal'}`,
    task.is_external ? `Assigned to: ${task.external_assignee} (External)` : `Assigned to: ${task.assignee?.name || 'Unassigned'}`,
    projectNumber ? `Project: ${projectNumber}` : ''
  ].filter(Boolean).join('\\n');

  const event = createICSEvent({
    title: `[Task] ${task.title}`,
    description,
    startDate: task.due_date,
    category: 'Task',
    location: projectName
  });

  const calendar = createICSCalendar([event], `${projectNumber || 'Task'} - ${task.title}`);
  downloadICS(calendar, `Task_${task.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
};

/**
 * Export a single RFI to ICS
 * @param {Object} rfi - RFI object with due_date
 * @param {string} [projectName] - Project name for location
 * @param {string} [projectNumber] - Project number for title prefix
 */
export const exportRFIToICS = (rfi, projectName = '', projectNumber = '') => {
  if (!rfi.due_date) {
    alert('This RFI has no due date set.');
    return;
  }

  const description = [
    `Subject: ${rfi.subject}`,
    '',
    `Question: ${rfi.question || 'N/A'}`,
    '',
    `Status: ${rfi.status}`,
    `Sent To: ${rfi.sent_to || 'Internal'}`,
    rfi.answer ? `Answer: ${rfi.answer}` : '',
    projectNumber ? `Project: ${projectNumber}` : ''
  ].filter(Boolean).join('\\n');

  const event = createICSEvent({
    title: `[RFI] ${rfi.rfi_number}: ${rfi.subject}`,
    description,
    startDate: rfi.due_date,
    category: 'RFI'
  });

  const calendar = createICSCalendar([event], `${rfi.rfi_number} - ${rfi.subject}`);
  downloadICS(calendar, `RFI_${rfi.rfi_number.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
};

/**
 * Export a single submittal to ICS
 * @param {Object} submittal - Submittal object with due_date
 * @param {string} [projectName] - Project name for location
 * @param {string} [projectNumber] - Project number for title prefix
 */
export const exportSubmittalToICS = (submittal, projectName = '', projectNumber = '') => {
  if (!submittal.due_date) {
    alert('This submittal has no due date set.');
    return;
  }

  const description = [
    `Title: ${submittal.title}`,
    `Type: ${submittal.submittal_type}`,
    '',
    `Status: ${submittal.status}`,
    `Sent To: ${submittal.sent_to || 'Internal'}`,
    submittal.revision_number > 0 ? `Revision: ${submittal.revision_number}` : '',
    submittal.spec_section ? `Spec Section: ${submittal.spec_section}` : '',
    submittal.manufacturer ? `Manufacturer: ${submittal.manufacturer}` : '',
    projectNumber ? `Project: ${projectNumber}` : ''
  ].filter(Boolean).join('\\n');

  const event = createICSEvent({
    title: `[Submittal] ${submittal.submittal_number}: ${submittal.title}`,
    description,
    startDate: submittal.due_date,
    category: 'Submittal'
  });

  const calendar = createICSCalendar([event], `${submittal.submittal_number} - ${submittal.title}`);
  downloadICS(calendar, `Submittal_${submittal.submittal_number.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
};

/**
 * Export a single milestone to ICS
 * @param {Object} milestone - Milestone object with due_date
 * @param {string} [projectName] - Project name for location
 * @param {string} [projectNumber] - Project number for title prefix
 */
export const exportMilestoneToICS = (milestone, projectName = '', projectNumber = '') => {
  if (!milestone.due_date) {
    alert('This milestone has no due date set.');
    return;
  }

  const description = [
    `Milestone: ${milestone.name}`,
    '',
    `Status: ${milestone.status}`,
    milestone.description || '',
    projectNumber ? `Project: ${projectNumber}` : ''
  ].filter(Boolean).join('\\n');

  const event = createICSEvent({
    title: `[Milestone] ${milestone.name}`,
    description,
    startDate: milestone.due_date,
    category: 'Milestone',
    location: projectName
  });

  const calendar = createICSCalendar([event], `${projectNumber || 'Milestone'} - ${milestone.name}`);
  downloadICS(calendar, `Milestone_${milestone.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
};

// ===== EXPORT FUNCTIONS - PROJECT LEVEL =====

/**
 * Export project key dates to ICS
 * @param {Object} project - Project object with date fields
 */
export const exportProjectDatesToICS = (project) => {
  const events = [];

  if (project.target_online_date) {
    events.push(createICSEvent({
      title: `[${project.project_number}] Online Date`,
      description: `Project: ${project.name}\\nProject goes online`,
      startDate: project.target_online_date,
      category: 'Project Date',
      location: project.site_address || ''
    }));
  }

  if (project.target_offline_date) {
    events.push(createICSEvent({
      title: `[${project.project_number}] Offline Date`,
      description: `Project: ${project.name}\\nProduction ends`,
      startDate: project.target_offline_date,
      category: 'Project Date'
    }));
  }

  if (project.delivery_date) {
    events.push(createICSEvent({
      title: `[${project.project_number}] Delivery Date`,
      description: `Project: ${project.name}\\nModules delivered to site`,
      startDate: project.delivery_date,
      category: 'Project Date',
      location: project.site_address || ''
    }));
  }

  if (events.length === 0) {
    alert('This project has no key dates set.');
    return;
  }

  const calendar = createICSCalendar(events, `${project.project_number} - Key Dates`);
  downloadICS(calendar, `${project.project_number}_Key_Dates.ics`);
};

/**
 * Export all project items (tasks, RFIs, submittals, milestones, dates) to ICS
 * @param {Object} project - Project object
 * @param {Object[]} tasks - Array of tasks
 * @param {Object[]} rfis - Array of RFIs
 * @param {Object[]} submittals - Array of submittals
 * @param {Object[]} milestones - Array of milestones
 */
export const exportAllProjectItemsToICS = (project, tasks, rfis, submittals, milestones) => {
  const events = [];
  const projectNumber = project.project_number;
  const projectName = project.name;

  // Add project dates
  if (project.target_online_date) {
    events.push(createICSEvent({
      title: `[${projectNumber}] Online Date`,
      description: `Project goes online`,
      startDate: project.target_online_date,
      category: 'Project Date'
    }));
  }

  if (project.delivery_date) {
    events.push(createICSEvent({
      title: `[${projectNumber}] Delivery Date`,
      description: `Modules delivered to site`,
      startDate: project.delivery_date,
      category: 'Project Date'
    }));
  }

  // Add milestones
  milestones?.forEach(milestone => {
    if (milestone.due_date) {
      events.push(createICSEvent({
        title: `[${projectNumber}] Milestone: ${milestone.name}`,
        description: `Status: ${milestone.status}`,
        startDate: milestone.due_date,
        category: 'Milestone'
      }));
    }
  });

  // Add tasks
  tasks?.forEach(task => {
    if (task.due_date) {
      events.push(createICSEvent({
        title: `[${projectNumber}] Task: ${task.title}`,
        description: `Status: ${task.status}\\nPriority: ${task.priority || 'Normal'}`,
        startDate: task.due_date,
        category: 'Task'
      }));
    }
  });

  // Add RFIs
  rfis?.forEach(rfi => {
    if (rfi.due_date) {
      events.push(createICSEvent({
        title: `[${projectNumber}] ${rfi.rfi_number}: ${rfi.subject}`,
        description: `Status: ${rfi.status}\\nSent To: ${rfi.sent_to || 'Internal'}`,
        startDate: rfi.due_date,
        category: 'RFI'
      }));
    }
  });

  // Add submittals
  submittals?.forEach(submittal => {
    if (submittal.due_date) {
      events.push(createICSEvent({
        title: `[${projectNumber}] ${submittal.submittal_number}: ${submittal.title}`,
        description: `Type: ${submittal.submittal_type}\\nStatus: ${submittal.status}`,
        startDate: submittal.due_date,
        category: 'Submittal'
      }));
    }
  });

  if (events.length === 0) {
    alert('No items with due dates to export.');
    return;
  }

  const calendar = createICSCalendar(events, `${projectNumber} - ${projectName}`);
  downloadICS(calendar, `${projectNumber}_All_Items.ics`);
};

// ===== DEFAULT EXPORT =====

export default {
  exportTaskToICS,
  exportRFIToICS,
  exportSubmittalToICS,
  exportMilestoneToICS,
  exportProjectDatesToICS,
  exportAllProjectItemsToICS
};