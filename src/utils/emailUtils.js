/**
 * Email Draft Utility
 * Generates mailto links to open Outlook/email client with pre-filled content
 */

/**
 * Open email client with pre-filled content
 */
 const openEmailDraft = ({ to = '', cc = '', bcc = '', subject = '', body = '' }) => {
  const params = new URLSearchParams();
  
  if (cc) params.append('cc', cc);
  if (bcc) params.append('bcc', bcc);
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  
  const queryString = params.toString();
  const mailto = `mailto:${to}${queryString ? '?' + queryString : ''}`;
  
  window.location.href = mailto;
};

/**
 * Format date for email display
 */
const formatEmailDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Draft email for a Task
 */
export const draftTaskEmail = (task, projectName = '', projectNumber = '') => {
  const to = task.external_assignee_email || '';
  
  const subject = `[${projectNumber || 'Task'}] ${task.title}`;
  
  const body = [
    `Task: ${task.title}`,
    `Project: ${projectNumber ? `${projectNumber} - ${projectName}` : projectName || 'N/A'}`,
    '',
    '--- Task Details ---',
    '',
    `Status: ${task.status}`,
    `Priority: ${task.priority || 'Normal'}`,
    `Due Date: ${formatEmailDate(task.due_date)}`,
    '',
    task.description ? `Description:\n${task.description}` : '',
    '',
    '---',
    '',
    'Please let me know if you have any questions.',
    '',
    'Thank you,'
  ].filter(line => line !== undefined).join('\n');

  openEmailDraft({ to, subject, body });
};

/**
 * Draft email for an RFI
 */
export const draftRFIEmail = (rfi, projectName = '', projectNumber = '') => {
  const to = rfi.sent_to_email || '';
  
  const subject = `[${projectNumber || 'RFI'}] ${rfi.rfi_number}: ${rfi.subject}`;
  
  const body = [
    `REQUEST FOR INFORMATION`,
    '',
    `RFI Number: ${rfi.rfi_number}`,
    `Project: ${projectNumber ? `${projectNumber} - ${projectName}` : projectName || 'N/A'}`,
    `Date: ${formatEmailDate(new Date().toISOString())}`,
    `Response Due: ${formatEmailDate(rfi.due_date)}`,
    '',
    '═══════════════════════════════════════',
    '',
    `TO: ${rfi.sent_to || 'N/A'}`,
    `FROM: Sunbelt Modular`,
    '',
    '═══════════════════════════════════════',
    '',
    'QUESTION:',
    '',
    rfi.question || '[Question details]',
    '',
    '═══════════════════════════════════════',
    '',
    'Please provide your response by the due date noted above.',
    '',
    'If you have any questions or need clarification, please contact us.',
    '',
    'Thank you,',
    '',
    '---',
    'Sunbelt Modular',
  ].join('\n');

  openEmailDraft({ to, subject, body });
};

/**
 * Draft email for a Submittal
 */
export const draftSubmittalEmail = (submittal, projectName = '', projectNumber = '') => {
  const to = submittal.sent_to_email || '';
  
  const subject = `[${projectNumber || 'Submittal'}] ${submittal.submittal_number}: ${submittal.title}`;
  
  const body = [
    `SUBMITTAL TRANSMITTAL`,
    '',
    `Submittal Number: ${submittal.submittal_number}`,
    `Project: ${projectNumber ? `${projectNumber} - ${projectName}` : projectName || 'N/A'}`,
    `Date: ${formatEmailDate(new Date().toISOString())}`,
    `Response Due: ${formatEmailDate(submittal.due_date)}`,
    '',
    '═══════════════════════════════════════',
    '',
    `TO: ${submittal.sent_to || 'N/A'}`,
    `FROM: Sunbelt Modular`,
    '',
    '═══════════════════════════════════════',
    '',
    'SUBMITTAL DETAILS:',
    '',
    `Title: ${submittal.title}`,
    `Type: ${submittal.submittal_type}`,
    submittal.revision_number > 0 ? `Revision: ${submittal.revision_number}` : '',
    submittal.spec_section ? `Spec Section: ${submittal.spec_section}` : '',
    submittal.manufacturer ? `Manufacturer: ${submittal.manufacturer}` : '',
    '',
    submittal.description ? `Description:\n${submittal.description}` : '',
    '',
    '═══════════════════════════════════════',
    '',
    'ACTION REQUIRED:',
    '[ ] Approved',
    '[ ] Approved as Noted',
    '[ ] Revise and Resubmit',
    '[ ] Rejected',
    '',
    'Comments:',
    '',
    '',
    '═══════════════════════════════════════',
    '',
    'Please review and return by the due date noted above.',
    '',
    'Thank you,',
    '',
    '---',
    'Sunbelt Modular',
  ].filter(line => line !== undefined && line !== '').join('\n');

  openEmailDraft({ to, subject, body });
};

/**
 * Draft RFI response email (when answering an RFI)
 */
export const draftRFIResponseEmail = (rfi, projectName = '', projectNumber = '') => {
  const to = rfi.received_from_email || '';
  
  const subject = `RE: [${projectNumber || 'RFI'}] ${rfi.rfi_number}: ${rfi.subject}`;
  
  const body = [
    `RFI RESPONSE`,
    '',
    `RFI Number: ${rfi.rfi_number}`,
    `Project: ${projectNumber ? `${projectNumber} - ${projectName}` : projectName || 'N/A'}`,
    `Response Date: ${formatEmailDate(new Date().toISOString())}`,
    '',
    '═══════════════════════════════════════',
    '',
    'ORIGINAL QUESTION:',
    '',
    rfi.question || '[Original question]',
    '',
    '═══════════════════════════════════════',
    '',
    'RESPONSE:',
    '',
    rfi.answer || '[Your response here]',
    '',
    '═══════════════════════════════════════',
    '',
    'Please let us know if you need any additional information.',
    '',
    'Thank you,',
    '',
    '---',
    'Sunbelt Modular',
  ].join('\n');

  openEmailDraft({ to, subject, body });
};

export default {
  draftTaskEmail,
  draftRFIEmail,
  draftSubmittalEmail,
  draftRFIResponseEmail,
  openEmailDraft
};