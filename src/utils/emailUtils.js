/**
 * Email Draft Utility - Professional Construction Communications
 * Generates mailto links to open Outlook/email client with pre-filled content
 * 
 * Features:
 * - Professional email templates for construction documents
 * - Multiple email types (initial, reminder, follow-up, response)
 * - Urgency indicators based on due dates
 * - Attachment listing in email body
 * - Configurable company branding
 * - Smart date formatting with relative dates
 * 
 * Note: mailto: links have character limits (~2000 chars in URL).
 * Long emails may be truncated by some email clients.
 */

// ===== CONFIGURATION =====

/**
 * Company configuration for email branding
 * Update these values to customize email output
 */
const COMPANY_CONFIG = {
  name: 'Sunbelt Modular',
  fullName: 'Sunbelt Modular, Inc.',
  tagline: 'Modular Building Solutions',
  // Default signature - can be overridden per user in future
  defaultSignature: 'Sunbelt Modular Project Team',
  // Default CC for internal tracking (optional)
  defaultCC: '',
  // Phone/contact info for signature
  phone: '',
  website: 'www.sunbeltmodular.com',
};

/**
 * Email template configuration
 */
const EMAIL_CONFIG = {
  // Maximum body length before warning (mailto: limitation)
  maxBodyLength: 1800,
  // Line width for text wrapping
  lineWidth: 60,
  // Divider styles
  dividers: {
    heavy: '════════════════════════════════════════════════════════',
    light: '────────────────────────────────────────────────────────',
    dotted: '• • • • • • • • • • • • • • • • • • • • • • • • • • • •',
  },
};

// ===== UTILITY FUNCTIONS =====

/**
 * Format date for email display (full format)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatEmailDate = (dateString) => {
  if (!dateString) return 'Not specified';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date in short format
 * @param {string} dateString - ISO date string
 * @returns {string} Short formatted date
 */
const formatShortDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Calculate days until/since a date
 * @param {string} dateString - ISO date string
 * @returns {Object} { days: number, isOverdue: boolean, isPast: boolean }
 */
const calculateDaysFromNow = (dateString) => {
  if (!dateString) return { days: null, isOverdue: false, isPast: false };
  
  const targetDate = new Date(dateString);
  const today = new Date();
  
  // Reset time portions for accurate day calculation
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    days: Math.abs(diffDays),
    isOverdue: diffDays < 0,
    isPast: diffDays < 0,
    isToday: diffDays === 0,
    isTomorrow: diffDays === 1,
    isUrgent: diffDays >= 0 && diffDays <= 2,
  };
};

/**
 * Get urgency label based on due date
 * @param {string} dueDate - Due date string
 * @returns {string} Urgency indicator for subject line
 */
const getUrgencyIndicator = (dueDate) => {
  if (!dueDate) return '';
  
  const { days, isOverdue, isToday, isTomorrow } = calculateDaysFromNow(dueDate);
  
  if (isOverdue) return '[OVERDUE] ';
  if (isToday) return '[DUE TODAY] ';
  if (isTomorrow) return '[DUE TOMORROW] ';
  if (days <= 3) return '[URGENT] ';
  
  return '';
};

/**
 * Format due date with relative indicator
 * @param {string} dueDate - Due date string
 * @returns {string} Formatted date with relative context
 */
const formatDueDateWithContext = (dueDate) => {
  if (!dueDate) return 'Not specified';
  
  const { days, isOverdue, isToday, isTomorrow } = calculateDaysFromNow(dueDate);
  const formattedDate = formatEmailDate(dueDate);
  
  if (isOverdue) {
    return `${formattedDate} (${days} day${days !== 1 ? 's' : ''} OVERDUE)`;
  }
  if (isToday) {
    return `${formattedDate} (TODAY)`;
  }
  if (isTomorrow) {
    return `${formattedDate} (Tomorrow)`;
  }
  if (days <= 7) {
    return `${formattedDate} (in ${days} days)`;
  }
  
  return formattedDate;
};

/**
 * Get priority label
 * @param {string} priority - Priority level
 * @returns {string} Formatted priority string
 */
const getPriorityLabel = (priority) => {
  const labels = {
    'Critical': '🔴 CRITICAL',
    'High': '🟠 High Priority',
    'Medium': '🟡 Medium Priority',
    'Low': '🟢 Low Priority',
  };
  return labels[priority] || priority || 'Normal';
};

/**
 * Format attachment list for email body
 * @param {Array} attachments - Array of attachment objects
 * @returns {string} Formatted attachment list
 */
const formatAttachmentList = (attachments) => {
  if (!attachments || attachments.length === 0) return '';
  
  const list = attachments.map(att => `  • ${att.file_name}`).join('\n');
  return `\nATTACHED FILES (${attachments.length}):\n${list}\n`;
};

/**
 * Build email signature
 * @param {Object} [options] - Signature options
 * @returns {string} Email signature block
 */
const buildSignature = (options = {}) => {
  const senderName = options.senderName || COMPANY_CONFIG.defaultSignature;
  const includeCompany = options.includeCompany !== false;
  
  const lines = [
    '',
    'Thank you,',
    '',
    senderName,
  ];
  
  if (includeCompany) {
    lines.push(COMPANY_CONFIG.name);
    if (COMPANY_CONFIG.phone) lines.push(COMPANY_CONFIG.phone);
    if (COMPANY_CONFIG.website) lines.push(COMPANY_CONFIG.website);
  }
  
  return lines.join('\n');
};

/**
 * Build project reference line
 * @param {string} projectName - Project name
 * @param {string} projectNumber - Project number
 * @returns {string} Formatted project reference
 */
const buildProjectReference = (projectName, projectNumber) => {
  if (projectNumber && projectName) {
    return `${projectNumber} — ${projectName}`;
  }
  return projectNumber || projectName || 'N/A';
};

// ===== CORE EMAIL FUNCTION =====

/**
 * Open email client with pre-filled content
 * @param {Object} options - Email options
 * @param {string} [options.to] - Recipient email
 * @param {string} [options.cc] - CC recipients
 * @param {string} [options.bcc] - BCC recipients
 * @param {string} [options.subject] - Email subject
 * @param {string} [options.body] - Email body
 * @returns {boolean} Success status
 */
const openEmailDraft = ({ to = '', cc = '', bcc = '', subject = '', body = '' }) => {
  // Build query parameters
  const params = new URLSearchParams();

  // Add CC (combine default CC with provided CC)
  const combinedCC = [COMPANY_CONFIG.defaultCC, cc].filter(Boolean).join(',');
  if (combinedCC) params.append('cc', combinedCC);

  if (bcc) params.append('bcc', bcc);
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);

  // URLSearchParams encodes spaces as '+', but mailto: requires '%20'
  const queryString = params.toString().replace(/\+/g, '%20');
  const mailto = `mailto:${encodeURIComponent(to)}${queryString ? '?' + queryString : ''}`;
  
  // Check for length limitations
  if (mailto.length > 2000) {
    console.warn('Email URL exceeds 2000 characters. Some content may be truncated.');
  }
  
  // Open email client
  window.location.href = mailto;
  return true;
};

// ===== TASK EMAIL FUNCTIONS =====

/**
 * Draft email for a Task assignment
 * @param {Object} task - Task object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Object} [options] - Additional options
 */
export const draftTaskEmail = (task, projectName = '', projectNumber = '', options = {}) => {
  const to = task.external_assignee_email || options.to || '';
  const projectRef = buildProjectReference(projectName, projectNumber);
  const urgency = getUrgencyIndicator(task.due_date);
  
  const subject = `${urgency}[${projectNumber || 'TASK'}] ${task.title}`;
  
  const body = [
    `TASK ASSIGNMENT`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Task: ${task.title}`,
    `Project: ${projectRef}`,
    `Date Issued: ${formatShortDate(new Date().toISOString())}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `ASSIGNMENT DETAILS`,
    '',
    `Assigned To: ${task.external_assignee || task.assignee?.name || 'N/A'}`,
    `Status: ${task.status || 'Not Started'}`,
    `Priority: ${getPriorityLabel(task.priority)}`,
    '',
    `Start Date: ${formatShortDate(task.start_date)}`,
    `Due Date: ${formatDueDateWithContext(task.due_date)}`,
    '',
    task.milestone?.name ? `Milestone: ${task.milestone.name}\n` : '',
    EMAIL_CONFIG.dividers.light,
    '',
    `DESCRIPTION`,
    '',
    task.description || '(No description provided)',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `ACTION REQUIRED`,
    '',
    'Please review the above task details and confirm receipt.',
    'Let us know if you have any questions or need clarification.',
    '',
    options.attachments ? formatAttachmentList(options.attachments) : '',
    buildSignature(options),
  ].filter(line => line !== undefined).join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft task reminder email
 * @param {Object} task - Task object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Object} [options] - Additional options
 */
export const draftTaskReminderEmail = (task, projectName = '', projectNumber = '', options = {}) => {
  const to = task.external_assignee_email || options.to || '';
  const projectRef = buildProjectReference(projectName, projectNumber);
  const { days, isOverdue } = calculateDaysFromNow(task.due_date);
  
  const urgencyPrefix = isOverdue ? '[OVERDUE] ' : '[REMINDER] ';
  const subject = `${urgencyPrefix}[${projectNumber || 'TASK'}] ${task.title}`;
  
  const statusMessage = isOverdue
    ? `This task is now ${days} day${days !== 1 ? 's' : ''} overdue.`
    : `This task is due ${days === 0 ? 'TODAY' : `in ${days} day${days !== 1 ? 's' : ''}`}.`;
  
  const body = [
    `TASK REMINDER`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    statusMessage,
    '',
    `Task: ${task.title}`,
    `Project: ${projectRef}`,
    `Due Date: ${formatDueDateWithContext(task.due_date)}`,
    `Priority: ${getPriorityLabel(task.priority)}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    'Please provide a status update on this task at your earliest convenience.',
    '',
    'If you have completed this task, please let us know so we can',
    'update our records accordingly.',
    '',
    'If you need additional time or have encountered any issues,',
    'please reach out to discuss.',
    '',
    buildSignature(options),
  ].join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

// ===== RFI EMAIL FUNCTIONS =====

/**
 * Draft email for an RFI
 * @param {Object} rfi - RFI object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Object} [options] - Additional options
 */
export const draftRFIEmail = (rfi, projectName = '', projectNumber = '', options = {}) => {
  const to = rfi.sent_to_email || options.to || '';
  const projectRef = buildProjectReference(projectName, projectNumber);
  const urgency = getUrgencyIndicator(rfi.due_date);
  
  const subject = `${urgency}[${projectNumber || 'RFI'}] ${rfi.rfi_number}: ${rfi.subject}`;
  
  const body = [
    `REQUEST FOR INFORMATION`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `RFI Number: ${rfi.rfi_number}`,
    `Project: ${projectRef}`,
    `Date Issued: ${formatShortDate(rfi.date_sent || new Date().toISOString())}`,
    `Response Due: ${formatDueDateWithContext(rfi.due_date)}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `TO: ${rfi.sent_to || 'N/A'}`,
    `FROM: ${COMPANY_CONFIG.name}`,
    rfi.spec_section ? `SPEC SECTION: ${rfi.spec_section}` : '',
    rfi.drawing_reference ? `DRAWING REF: ${rfi.drawing_reference}` : '',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `QUESTION / REQUEST`,
    '',
    rfi.question || '[Please provide your question here]',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `RESPONSE REQUIRED`,
    '',
    'Please provide your response by the due date noted above.',
    '',
    'When responding, please:',
    '  • Reference the RFI number in your reply',
    '  • Include any supporting documentation',
    '  • Note if additional time is needed',
    '',
    options.attachments ? formatAttachmentList(options.attachments) : '',
    'If you have any questions or need clarification, please contact us.',
    '',
    buildSignature(options),
  ].filter(line => line !== undefined && line !== '').join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft RFI reminder email
 * @param {Object} rfi - RFI object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Object} [options] - Additional options
 */
export const draftRFIReminderEmail = (rfi, projectName = '', projectNumber = '', options = {}) => {
  const to = rfi.sent_to_email || options.to || '';
  const projectRef = buildProjectReference(projectName, projectNumber);
  const { days, isOverdue } = calculateDaysFromNow(rfi.due_date);
  
  const urgencyPrefix = isOverdue ? '[OVERDUE] ' : '[REMINDER] ';
  const subject = `${urgencyPrefix}[${projectNumber || 'RFI'}] ${rfi.rfi_number}: ${rfi.subject}`;
  
  const statusMessage = isOverdue
    ? `This RFI response is now ${days} day${days !== 1 ? 's' : ''} overdue.`
    : `This RFI response is due ${days === 0 ? 'TODAY' : `in ${days} day${days !== 1 ? 's' : ''}`}.`;
  
  const body = [
    `RFI RESPONSE REMINDER`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    statusMessage,
    '',
    `RFI Number: ${rfi.rfi_number}`,
    `Subject: ${rfi.subject}`,
    `Project: ${projectRef}`,
    `Due Date: ${formatDueDateWithContext(rfi.due_date)}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `ORIGINAL QUESTION`,
    '',
    rfi.question || '[Original question]',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    'We are awaiting your response to the above RFI.',
    '',
    'Your timely response is important to keep the project on schedule.',
    'If you need additional time, please let us know immediately.',
    '',
    buildSignature(options),
  ].join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft RFI response/answer email (when closing an RFI)
 * @param {Object} rfi - RFI object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Object} [options] - Additional options
 */
export const draftRFIResponseEmail = (rfi, projectName = '', projectNumber = '', options = {}) => {
  const to = rfi.received_from_email || options.to || '';
  const projectRef = buildProjectReference(projectName, projectNumber);
  
  const subject = `RE: [${projectNumber || 'RFI'}] ${rfi.rfi_number}: ${rfi.subject}`;
  
  const body = [
    `RFI RESPONSE`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `RFI Number: ${rfi.rfi_number}`,
    `Project: ${projectRef}`,
    `Response Date: ${formatShortDate(new Date().toISOString())}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `ORIGINAL QUESTION`,
    '',
    rfi.question || '[Original question]',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `RESPONSE`,
    '',
    rfi.answer || '[Your response here]',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    'Please let us know if you need any additional information or',
    'clarification regarding this response.',
    '',
    buildSignature(options),
  ].join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

// ===== SUBMITTAL EMAIL FUNCTIONS =====

/**
 * Draft email for a Submittal
 * @param {Object} submittal - Submittal object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Object} [options] - Additional options
 */
export const draftSubmittalEmail = (submittal, projectName = '', projectNumber = '', options = {}) => {
  const to = submittal.sent_to_email || options.to || '';
  const projectRef = buildProjectReference(projectName, projectNumber);
  const urgency = getUrgencyIndicator(submittal.due_date);
  const revisionNote = submittal.revision_number > 0 
    ? ` (Rev. ${submittal.revision_number})` 
    : '';
  
  const subject = `${urgency}[${projectNumber || 'SUB'}] ${submittal.submittal_number}${revisionNote}: ${submittal.title}`;
  
  const body = [
    `SUBMITTAL TRANSMITTAL`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Submittal Number: ${submittal.submittal_number}${revisionNote}`,
    `Project: ${projectRef}`,
    `Date Submitted: ${formatShortDate(submittal.date_sent || new Date().toISOString())}`,
    `Response Due: ${formatDueDateWithContext(submittal.due_date)}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `TO: ${submittal.sent_to || 'N/A'}`,
    `FROM: ${COMPANY_CONFIG.name}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `SUBMITTAL DETAILS`,
    '',
    `Title: ${submittal.title}`,
    `Type: ${submittal.submittal_type || 'N/A'}`,
    `Priority: ${getPriorityLabel(submittal.priority)}`,
    submittal.revision_number > 0 ? `Revision: ${submittal.revision_number}` : '',
    '',
    submittal.spec_section ? `Spec Section: ${submittal.spec_section}` : '',
    submittal.manufacturer ? `Manufacturer: ${submittal.manufacturer}` : '',
    submittal.model_number ? `Model Number: ${submittal.model_number}` : '',
    '',
    submittal.description ? `Description:\n${submittal.description}\n` : '',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `ACTION REQUIRED`,
    '',
    'Please review and indicate your response:',
    '',
    '  [ ] APPROVED',
    '  [ ] APPROVED AS NOTED',
    '  [ ] REVISE AND RESUBMIT',
    '  [ ] REJECTED',
    '',
    'Comments:',
    '',
    '',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    options.attachments ? formatAttachmentList(options.attachments) : '',
    'Please review and return by the due date noted above.',
    '',
    buildSignature(options),
  ].filter(line => line !== undefined && line !== '').join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft submittal reminder email
 * @param {Object} submittal - Submittal object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Object} [options] - Additional options
 */
export const draftSubmittalReminderEmail = (submittal, projectName = '', projectNumber = '', options = {}) => {
  const to = submittal.sent_to_email || options.to || '';
  const projectRef = buildProjectReference(projectName, projectNumber);
  const { days, isOverdue } = calculateDaysFromNow(submittal.due_date);
  const revisionNote = submittal.revision_number > 0 
    ? ` (Rev. ${submittal.revision_number})` 
    : '';
  
  const urgencyPrefix = isOverdue ? '[OVERDUE] ' : '[REMINDER] ';
  const subject = `${urgencyPrefix}[${projectNumber || 'SUB'}] ${submittal.submittal_number}${revisionNote}: ${submittal.title}`;
  
  const statusMessage = isOverdue
    ? `This submittal review is now ${days} day${days !== 1 ? 's' : ''} overdue.`
    : `This submittal review is due ${days === 0 ? 'TODAY' : `in ${days} day${days !== 1 ? 's' : ''}`}.`;
  
  const body = [
    `SUBMITTAL REVIEW REMINDER`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    statusMessage,
    '',
    `Submittal Number: ${submittal.submittal_number}${revisionNote}`,
    `Title: ${submittal.title}`,
    `Type: ${submittal.submittal_type || 'N/A'}`,
    `Project: ${projectRef}`,
    `Due Date: ${formatDueDateWithContext(submittal.due_date)}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    'We are awaiting your review of the above submittal.',
    '',
    'Please indicate one of the following:',
    '  • Approved',
    '  • Approved as Noted',
    '  • Revise and Resubmit',
    '  • Rejected',
    '',
    'Your timely review is important to keep the project on schedule.',
    'If you need additional time, please let us know immediately.',
    '',
    buildSignature(options),
  ].join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft submittal response notification email (when status changes)
 * @param {Object} submittal - Submittal object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Object} [options] - Additional options
 */
export const draftSubmittalResponseEmail = (submittal, projectName = '', projectNumber = '', options = {}) => {
  const to = options.to || '';
  const projectRef = buildProjectReference(projectName, projectNumber);
  const revisionNote = submittal.revision_number > 0 
    ? ` (Rev. ${submittal.revision_number})` 
    : '';
  
  const statusEmoji = {
    'Approved': '✅',
    'Approved as Noted': '✅',
    'Rejected': '❌',
    'Revise and Resubmit': '🔄',
  };
  
  const emoji = statusEmoji[submittal.status] || '📋';
  const subject = `${emoji} [${projectNumber || 'SUB'}] ${submittal.submittal_number}${revisionNote}: ${submittal.status}`;
  
  const body = [
    `SUBMITTAL RESPONSE NOTIFICATION`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Submittal Number: ${submittal.submittal_number}${revisionNote}`,
    `Title: ${submittal.title}`,
    `Project: ${projectRef}`,
    '',
    `STATUS: ${submittal.status?.toUpperCase()}`,
    `Response Date: ${formatShortDate(new Date().toISOString())}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    submittal.reviewer_comments ? `REVIEWER COMMENTS:\n\n${submittal.reviewer_comments}\n\n${EMAIL_CONFIG.dividers.light}\n` : '',
    submittal.status === 'Revise and Resubmit' || submittal.status === 'Rejected'
      ? 'Please address the comments above and resubmit for review.\n'
      : 'This submittal has been processed. Please retain for your records.\n',
    '',
    buildSignature(options),
  ].filter(line => line !== undefined).join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

// ===== GENERAL EMAIL FUNCTIONS =====

/**
 * Draft a general project email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.projectName] - Project name
 * @param {string} [options.projectNumber] - Project number
 * @param {string} [options.body] - Email body content
 * @param {string} [options.cc] - CC recipients
 */
export const draftProjectEmail = (options = {}) => {
  const projectRef = buildProjectReference(options.projectName, options.projectNumber);
  
  const subject = options.projectNumber 
    ? `[${options.projectNumber}] ${options.subject || ''}`
    : options.subject || '';
  
  const body = [
    options.body || '',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `Project: ${projectRef}`,
    '',
    buildSignature(options),
  ].join('\n');

  openEmailDraft({ 
    to: options.to || '', 
    subject, 
    body, 
    cc: options.cc 
  });
};

/**
 * Draft a batch notification email (multiple items)
 * @param {Object} options - Email options
 * @param {Array} options.items - Array of items to include
 * @param {string} options.itemType - Type of items ('tasks', 'rfis', 'submittals')
 * @param {string} [options.projectName] - Project name
 * @param {string} [options.projectNumber] - Project number
 * @param {string} [options.to] - Recipient email
 */
export const draftBatchNotificationEmail = (options = {}) => {
  const { items = [], itemType = 'items', projectName, projectNumber, to = '' } = options;
  const projectRef = buildProjectReference(projectName, projectNumber);
  
  const itemLabel = itemType.charAt(0).toUpperCase() + itemType.slice(1);
  const subject = `[${projectNumber || 'PROJECT'}] ${itemLabel} Status Update (${items.length} items)`;
  
  const itemsList = items.map(item => {
    const dueInfo = item.due_date ? ` - Due: ${formatShortDate(item.due_date)}` : '';
    const title = item.title || item.subject || item.name || 'Untitled';
    const number = item.rfi_number || item.submittal_number || '';
    return `  • ${number ? `${number}: ` : ''}${title}${dueInfo}`;
  }).join('\n');
  
  const body = [
    `${itemLabel.toUpperCase()} STATUS UPDATE`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Project: ${projectRef}`,
    `Date: ${formatShortDate(new Date().toISOString())}`,
    `Total ${itemLabel}: ${items.length}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `${itemLabel.toUpperCase()} LIST`,
    '',
    itemsList,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    'Please review the items listed above.',
    '',
    buildSignature(options),
  ].join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

// ===== WARNING EMAIL FUNCTIONS =====

/**
 * Warning email types for workflow tracking
 */
export const WARNING_EMAIL_TYPES = {
  DEALER_DELAY: 'dealer_delay',
  INTERNAL_DELAY: 'internal_delay',
  FACTORY_DELAY: 'factory_delay',
  DRAWING_APPROVAL: 'drawing_approval',
  CHANGE_ORDER: 'change_order',
  LONG_LEAD_DELAY: 'long_lead_delay',
  COLOR_SELECTION: 'color_selection',
};

/**
 * Draft warning email for dealer response delay
 * @param {Object} options - Warning email options
 * @param {string} options.to - Dealer email address
 * @param {Object} options.project - Project object with name, number
 * @param {string} options.stationName - Workflow station name
 * @param {number} options.daysOverdue - Number of days overdue
 * @param {string} [options.itemDescription] - Description of pending item
 * @param {Array} [options.pendingItems] - List of pending items
 * @param {string} [options.originalDueDate] - Original due date
 */
export const draftDealerWarningEmail = (options = {}) => {
  const {
    to = '',
    project = {},
    stationName = '',
    daysOverdue = 0,
    itemDescription = '',
    pendingItems = [],
    originalDueDate = '',
  } = options;

  const projectRef = buildProjectReference(project.name, project.project_number);
  const urgencyPrefix = daysOverdue > 7 ? '[CRITICAL] ' : daysOverdue > 3 ? '[URGENT] ' : '[REMINDER] ';

  const subject = `${urgencyPrefix}[${project.project_number || 'PROJECT'}] Response Required: ${stationName || itemDescription}`;

  const pendingList = pendingItems.length > 0
    ? '\nPENDING ITEMS:\n' + pendingItems.map(item => `  • ${item}`).join('\n') + '\n'
    : '';

  const body = [
    `DEALER RESPONSE REQUIRED`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Project: ${projectRef}`,
    `Item: ${stationName || itemDescription}`,
    originalDueDate ? `Original Due Date: ${formatEmailDate(originalDueDate)}` : '',
    `Status: ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `We are awaiting your response on the following:`,
    '',
    itemDescription || stationName,
    pendingList,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `IMPACT NOTICE`,
    '',
    'Delays in dealer approvals directly impact the project timeline.',
    'This may affect:',
    '  • Production scheduling',
    '  • Delivery dates',
    '  • Installation timeline',
    '',
    'Please provide your response at your earliest convenience.',
    'If you need additional time or have questions, please contact us immediately.',
    '',
    buildSignature(options),
  ].filter(line => line !== undefined && line !== '').join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft warning email for internal processing delay
 * @param {Object} options - Warning email options
 * @param {string} options.to - Internal team member email
 * @param {Object} options.project - Project object
 * @param {string} options.stationName - Workflow station name
 * @param {number} options.daysOverdue - Number of days overdue
 * @param {Array} [options.blockedTasks] - List of blocked downstream tasks
 */
export const draftInternalWarningEmail = (options = {}) => {
  const {
    to = '',
    project = {},
    stationName = '',
    daysOverdue = 0,
    blockedTasks = [],
  } = options;

  const projectRef = buildProjectReference(project.name, project.project_number);
  const urgencyPrefix = daysOverdue > 5 ? '[CRITICAL] ' : '[ACTION REQUIRED] ';

  const subject = `${urgencyPrefix}[${project.project_number || 'PROJECT'}] Internal Action Needed: ${stationName}`;

  const blockedList = blockedTasks.length > 0
    ? '\nBLOCKED DOWNSTREAM TASKS:\n' + blockedTasks.map(task => `  • ${task}`).join('\n') + '\n'
    : '';

  const body = [
    `INTERNAL ACTION REQUIRED`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Project: ${projectRef}`,
    `Station: ${stationName}`,
    `Status: ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `This workflow station requires attention.`,
    '',
    `The following tasks are pending completion:`,
    blockedList,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `Please update the status or complete the required actions.`,
    'If blocked by external factors, please update the task status accordingly.',
    '',
    buildSignature(options),
  ].filter(line => line !== undefined && line !== '').join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft warning email for factory milestone delay
 * @param {Object} options - Warning email options
 * @param {string} options.to - Factory contact email
 * @param {Object} options.project - Project object
 * @param {string} options.milestoneName - Milestone name
 * @param {number} options.daysOverdue - Number of days overdue
 * @param {string} [options.originalDate] - Original milestone date
 * @param {string} [options.impact] - Impact description
 */
export const draftFactoryWarningEmail = (options = {}) => {
  const {
    to = '',
    project = {},
    milestoneName = '',
    daysOverdue = 0,
    originalDate = '',
    impact = '',
  } = options;

  const projectRef = buildProjectReference(project.name, project.project_number);
  const urgencyPrefix = daysOverdue > 7 ? '[CRITICAL] ' : '[URGENT] ';

  const subject = `${urgencyPrefix}[${project.project_number || 'PROJECT'}] Factory Milestone Delay: ${milestoneName}`;

  const body = [
    `FACTORY MILESTONE DELAY NOTICE`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Project: ${projectRef}`,
    `Milestone: ${milestoneName}`,
    originalDate ? `Original Date: ${formatEmailDate(originalDate)}` : '',
    `Status: ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `This factory milestone is past its scheduled date.`,
    '',
    impact ? `IMPACT:\n${impact}\n\n${EMAIL_CONFIG.dividers.light}\n` : '',
    `ACTION REQUIRED`,
    '',
    'Please provide:',
    '  1. Updated completion date',
    '  2. Reason for delay',
    '  3. Recovery plan if applicable',
    '',
    'Timely updates are essential for project coordination.',
    '',
    buildSignature(options),
  ].filter(line => line !== undefined && line !== '').join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft email for drawing approval request
 * @param {Object} options - Drawing approval options
 * @param {string} options.to - Dealer email address
 * @param {Object} options.project - Project object
 * @param {string} options.drawingType - Type of drawing (20%, 65%, 95%, 100%)
 * @param {number} [options.version] - Drawing version number
 * @param {string} [options.dueDate] - Response due date
 */
export const draftDrawingApprovalEmail = (options = {}) => {
  const {
    to = '',
    project = {},
    drawingType = '',
    version = 1,
    dueDate = '',
  } = options;

  const projectRef = buildProjectReference(project.name, project.project_number);
  const versionNote = version > 1 ? ` (Version ${version})` : '';

  const subject = `[${project.project_number || 'PROJECT'}] ${drawingType} Drawing Review Required${versionNote}`;

  const body = [
    `DRAWING REVIEW REQUEST`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Project: ${projectRef}`,
    `Drawing Set: ${drawingType}${versionNote}`,
    `Submitted: ${formatShortDate(new Date().toISOString())}`,
    dueDate ? `Response Due: ${formatDueDateWithContext(dueDate)}` : '',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `Please review the attached ${drawingType} drawings and provide your response.`,
    '',
    `RESPONSE OPTIONS`,
    '',
    '  [ ] APPROVE - Drawings accepted as submitted',
    '  [ ] APPROVE WITH REDLINES - Drawings accepted with noted changes',
    '  [ ] REJECT WITH REDLINES - Revisions required, specific changes noted',
    '  [ ] REJECT - Drawings not acceptable, major revisions needed',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    'If providing redlines, please mark up the drawings and return.',
    '',
    'Your timely review helps maintain the project schedule.',
    '',
    buildSignature(options),
  ].filter(line => line !== undefined && line !== '').join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft email for change order notification
 * @param {Object} options - Change order options
 * @param {string} options.to - Recipient email
 * @param {Object} options.project - Project object
 * @param {Object} options.changeOrder - Change order object
 * @param {string} [options.type] - Email type ('initial', 'reminder', 'signed')
 */
export const draftChangeOrderEmail = (options = {}) => {
  const {
    to = '',
    project = {},
    changeOrder = {},
    type = 'initial',
  } = options;

  const projectRef = buildProjectReference(project.name, project.project_number);
  const coNumber = changeOrder.change_order_number || 'CO-XXX';
  const coType = changeOrder.change_type || 'General';

  let subject, heading, actionText;

  switch (type) {
    case 'reminder':
      subject = `[REMINDER] [${project.project_number || 'PROJECT'}] Change Order ${coNumber} - Signature Required`;
      heading = 'CHANGE ORDER REMINDER';
      actionText = 'This change order is awaiting your signature. Please review and sign at your earliest convenience.';
      break;
    case 'signed':
      subject = `[${project.project_number || 'PROJECT'}] Change Order ${coNumber} - Executed`;
      heading = 'CHANGE ORDER EXECUTED';
      actionText = 'This change order has been fully executed. Please retain for your records.';
      break;
    default:
      subject = `[${project.project_number || 'PROJECT'}] Change Order ${coNumber} - ${coType}`;
      heading = 'CHANGE ORDER NOTIFICATION';
      actionText = 'Please review the attached change order and provide your signature.';
  }

  const body = [
    heading,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Project: ${projectRef}`,
    `Change Order: ${coNumber}`,
    `Type: ${coType}`,
    changeOrder.amount ? `Amount: $${changeOrder.amount.toLocaleString()}` : '',
    `Status: ${changeOrder.status || 'Draft'}`,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    changeOrder.description ? `DESCRIPTION:\n\n${changeOrder.description}\n\n${EMAIL_CONFIG.dividers.light}\n` : '',
    actionText,
    '',
    type !== 'signed' ? 'If you have questions or concerns, please contact us before signing.\n' : '',
    buildSignature(options),
  ].filter(line => line !== undefined && line !== '').join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft email for long lead item status
 * @param {Object} options - Long lead options
 * @param {string} options.to - Recipient email
 * @param {Object} options.project - Project object
 * @param {Object} options.item - Long lead item object
 * @param {string} [options.type] - Email type ('order', 'delay', 'delivery')
 */
export const draftLongLeadEmail = (options = {}) => {
  const {
    to = '',
    project = {},
    item = {},
    type = 'order',
  } = options;

  const projectRef = buildProjectReference(project.name, project.project_number);

  let subject, heading, actionText;

  switch (type) {
    case 'delay':
      subject = `[URGENT] [${project.project_number || 'PROJECT'}] Long Lead Item Delay: ${item.item_name || 'Item'}`;
      heading = 'LONG LEAD ITEM DELAY NOTICE';
      actionText = 'This long lead item has been delayed. Please review the updated timeline.';
      break;
    case 'delivery':
      subject = `[${project.project_number || 'PROJECT'}] Long Lead Item Delivery: ${item.item_name || 'Item'}`;
      heading = 'LONG LEAD ITEM DELIVERY NOTICE';
      actionText = 'This long lead item is scheduled for delivery. Please confirm receipt.';
      break;
    default:
      subject = `[${project.project_number || 'PROJECT'}] Long Lead Item Order: ${item.item_name || 'Item'}`;
      heading = 'LONG LEAD ITEM ORDER';
      actionText = 'The following long lead item has been ordered for your project.';
  }

  const body = [
    heading,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Project: ${projectRef}`,
    `Item: ${item.item_name || 'N/A'}`,
    item.manufacturer ? `Manufacturer: ${item.manufacturer}` : '',
    item.model_number ? `Model: ${item.model_number}` : '',
    '',
    item.order_date ? `Order Date: ${formatShortDate(item.order_date)}` : '',
    item.expected_delivery ? `Expected Delivery: ${formatShortDate(item.expected_delivery)}` : '',
    item.lead_time_weeks ? `Lead Time: ${item.lead_time_weeks} weeks` : '',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    actionText,
    '',
    item.notes ? `NOTES:\n${item.notes}\n` : '',
    buildSignature(options),
  ].filter(line => line !== undefined && line !== '').join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

/**
 * Draft email for color selection request
 * @param {Object} options - Color selection options
 * @param {string} options.to - Dealer email address
 * @param {Object} options.project - Project object
 * @param {Array} [options.categories] - Categories needing selection
 * @param {string} [options.dueDate] - Response due date
 */
export const draftColorSelectionEmail = (options = {}) => {
  const {
    to = '',
    project = {},
    categories = [],
    dueDate = '',
  } = options;

  const projectRef = buildProjectReference(project.name, project.project_number);

  const categoryList = categories.length > 0
    ? '\n' + categories.map(cat => `  • ${cat}`).join('\n') + '\n'
    : '';

  const subject = `[${project.project_number || 'PROJECT'}] Color Selections Required`;

  const body = [
    `COLOR SELECTION REQUEST`,
    EMAIL_CONFIG.dividers.heavy,
    '',
    `Project: ${projectRef}`,
    dueDate ? `Selections Due: ${formatDueDateWithContext(dueDate)}` : '',
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `Please provide color selections for the following categories:`,
    categoryList,
    '',
    EMAIL_CONFIG.dividers.light,
    '',
    `INSTRUCTIONS`,
    '',
    '1. Review the attached color options for each category',
    '2. Complete the color selection form',
    '3. Return signed selections by the due date',
    '',
    'If you need physical samples or have questions about',
    'available options, please contact us.',
    '',
    'Timely color selections help maintain the production schedule.',
    '',
    buildSignature(options),
  ].filter(line => line !== undefined && line !== '').join('\n');

  openEmailDraft({ to, subject, body, cc: options.cc });
};

// ===== DEFAULT EXPORT =====

export default {
  // Core
  openEmailDraft,

  // Task emails
  draftTaskEmail,
  draftTaskReminderEmail,

  // RFI emails
  draftRFIEmail,
  draftRFIReminderEmail,
  draftRFIResponseEmail,

  // Submittal emails
  draftSubmittalEmail,
  draftSubmittalReminderEmail,
  draftSubmittalResponseEmail,

  // Warning emails (workflow)
  draftDealerWarningEmail,
  draftInternalWarningEmail,
  draftFactoryWarningEmail,
  draftDrawingApprovalEmail,
  draftChangeOrderEmail,
  draftLongLeadEmail,
  draftColorSelectionEmail,

  // General
  draftProjectEmail,
  draftBatchNotificationEmail,

  // Utilities (exported for potential external use)
  formatEmailDate,
  formatShortDate,
  calculateDaysFromNow,
  getUrgencyIndicator,

  // Constants
  WARNING_EMAIL_TYPES,
};