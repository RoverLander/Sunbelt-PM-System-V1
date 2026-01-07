/**
 * ICS Calendar Export Utility
 * Generates .ics files compatible with Outlook, Google Calendar, Apple Calendar
 */

/**
 * Format a date for ICS format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
 */
 const formatICSDate = (dateString, allDay = true) => {
  const date = new Date(dateString);
  
  if (allDay) {
    // For all-day events, use YYYYMMDD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate() + 1).padStart(2, '0'); // +1 because date is parsed as UTC
    return `${year}${month}${day}`;
  } else {
    // For timed events, use UTC format
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }
};

/**
 * Generate a unique ID for the event
 */
const generateUID = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@sunbeltpm.com`;
};

/**
 * Escape special characters for ICS format
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
 * Create a single ICS event
 */
const createICSEvent = ({
  title,
  description = '',
  startDate,
  endDate = null,
  location = '',
  allDay = true,
  category = '',
  url = ''
}) => {
  const uid = generateUID();
  const now = formatICSDate(new Date().toISOString(), false);
  const start = formatICSDate(startDate, allDay);
  const end = endDate ? formatICSDate(endDate, allDay) : formatICSDate(startDate, allDay);

  let event = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
  ];

  if (allDay) {
    event.push(`DTSTART;VALUE=DATE:${start}`);
    event.push(`DTEND;VALUE=DATE:${end}`);
  } else {
    event.push(`DTSTART:${start}`);
    event.push(`DTEND:${end}`);
  }

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
  
  return event.join('\r\n');
};

/**
 * Create a complete ICS calendar with one or more events
 */
const createICSCalendar = (events, calendarName = 'Sunbelt PM Export') => {
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sunbelt Modular//PM System//EN',
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ];

  return calendar.join('\r\n');
};

/**
 * Download an ICS file
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

/**
 * Export a single task to ICS
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

/**
 * Export project key dates to ICS
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

export default {
  exportTaskToICS,
  exportRFIToICS,
  exportSubmittalToICS,
  exportMilestoneToICS,
  exportProjectDatesToICS,
  exportAllProjectItemsToICS
};