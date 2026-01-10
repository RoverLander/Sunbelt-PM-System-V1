// ============================================================================
// excelExport.js - Professional Excel Export for RFI and Submittal Logs
// ============================================================================
// Generates professionally formatted Excel spreadsheets for:
// - RFI (Request for Information) Log
// - Submittal Log
//
// Features:
// - Project header information
// - Styled column headers
// - Auto-width columns
// - Status-based highlighting
// - Summary statistics
// - Professional formatting
// ============================================================================

import * as XLSX from 'xlsx';

// ============================================================================
// CONSTANTS
// ============================================================================

const RFI_STATUSES = ['Draft', 'Open', 'Pending', 'Answered', 'Closed'];
const SUBMITTAL_STATUSES = [
  'Pending', 'Submitted', 'Under Review',
  'Approved', 'Approved as Noted', 'Revise and Resubmit', 'Rejected'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format date for Excel display
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Calculate days between two dates
 */
const daysBetween = (startDate, endDate) => {
  if (!startDate) return '';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if date is overdue
 */
const isOverdue = (dueDate, status, closedStatuses) => {
  if (!dueDate) return false;
  if (closedStatuses.includes(status)) return false;
  return new Date(dueDate) < new Date();
};

/**
 * Set column widths based on content
 */
const setColumnWidths = (worksheet, data, headers) => {
  const colWidths = headers.map((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => {
        const cell = row[i];
        return cell ? String(cell).length : 0;
      })
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });
  worksheet['!cols'] = colWidths;
};

/**
 * Create worksheet with header rows
 */
const createWorksheetWithHeader = (projectInfo, title, generatedDate) => {
  const headerRows = [
    [title],
    [],
    ['Project:', projectInfo.name],
    ['Project Number:', projectInfo.projectNumber],
    ['Client:', projectInfo.client || 'N/A'],
    ['Factory:', projectInfo.factory || 'N/A'],
    ['Generated:', generatedDate],
    []
  ];
  return headerRows;
};

// ============================================================================
// RFI LOG EXPORT
// ============================================================================

/**
 * Export RFI Log to Excel
 * @param {Array} rfis - Array of RFI objects
 * @param {Object} projectInfo - Project information { name, projectNumber, client, factory }
 */
export const exportRFILog = (rfis, projectInfo) => {
  const generatedDate = new Date().toLocaleString();

  // Create header section
  const headerRows = createWorksheetWithHeader(
    projectInfo,
    'RFI LOG',
    generatedDate
  );

  // Column headers
  const columnHeaders = [
    'RFI #',
    'Subject',
    'Question',
    'Status',
    'Priority',
    'Date Sent',
    'Due Date',
    'Days Open',
    'Sent To',
    'Email',
    'Spec Section',
    'Drawing Ref',
    'Answer',
    'Date Answered',
    'Internal Owner',
    'Overdue'
  ];

  // Sort RFIs by number
  const sortedRFIs = [...rfis].sort((a, b) => (a.number || 0) - (b.number || 0));

  // Map RFI data to rows
  const dataRows = sortedRFIs.map(rfi => {
    const closedStatuses = ['Answered', 'Closed'];
    const daysOpen = daysBetween(
      rfi.date_sent || rfi.created_at,
      closedStatuses.includes(rfi.status) ? rfi.date_answered : null
    );
    const overdue = isOverdue(rfi.due_date, rfi.status, closedStatuses);

    return [
      rfi.rfi_number || '',
      rfi.subject || '',
      rfi.question || '',
      rfi.status || '',
      rfi.priority || '',
      formatDate(rfi.date_sent),
      formatDate(rfi.due_date),
      daysOpen,
      rfi.sent_to || '',
      rfi.sent_to_email || '',
      rfi.spec_section || '',
      rfi.drawing_reference || '',
      rfi.answer || '',
      formatDate(rfi.date_answered),
      rfi.internal_owner?.name || '',
      overdue ? 'YES' : ''
    ];
  });

  // Summary section
  const totalRFIs = rfis.length;
  const openRFIs = rfis.filter(r => ['Open', 'Pending', 'Draft'].includes(r.status)).length;
  const answeredRFIs = rfis.filter(r => r.status === 'Answered').length;
  const closedRFIs = rfis.filter(r => r.status === 'Closed').length;
  const overdueRFIs = rfis.filter(r =>
    isOverdue(r.due_date, r.status, ['Answered', 'Closed'])
  ).length;

  const summaryRows = [
    [],
    ['SUMMARY'],
    ['Total RFIs:', totalRFIs],
    ['Open/Pending:', openRFIs],
    ['Answered:', answeredRFIs],
    ['Closed:', closedRFIs],
    ['Overdue:', overdueRFIs]
  ];

  // Combine all rows
  const allRows = [
    ...headerRows,
    columnHeaders,
    ...dataRows,
    ...summaryRows
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  setColumnWidths(worksheet, dataRows, columnHeaders);

  // Merge title cell
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } } // Merge title row
  ];

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'RFI Log');

  // Generate filename
  const filename = `${projectInfo.projectNumber}_RFI_Log_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);

  return filename;
};

// ============================================================================
// SUBMITTAL LOG EXPORT
// ============================================================================

/**
 * Export Submittal Log to Excel
 * @param {Array} submittals - Array of Submittal objects
 * @param {Object} projectInfo - Project information { name, projectNumber, client, factory }
 */
export const exportSubmittalLog = (submittals, projectInfo) => {
  const generatedDate = new Date().toLocaleString();

  // Create header section
  const headerRows = createWorksheetWithHeader(
    projectInfo,
    'SUBMITTAL LOG',
    generatedDate
  );

  // Column headers
  const columnHeaders = [
    'Sub #',
    'Title',
    'Description',
    'Type',
    'Status',
    'Priority',
    'Rev #',
    'Date Submitted',
    'Due Date',
    'Days in Review',
    'Sent To',
    'Email',
    'Spec Section',
    'Manufacturer',
    'Model #',
    'Reviewer Comments',
    'Date Approved',
    'Internal Owner',
    'Overdue'
  ];

  // Sort submittals by number
  const sortedSubmittals = [...submittals].sort((a, b) => (a.number || 0) - (b.number || 0));

  // Map submittal data to rows
  const dataRows = sortedSubmittals.map(sub => {
    const closedStatuses = ['Approved', 'Approved as Noted', 'Rejected'];
    const daysInReview = daysBetween(
      sub.date_submitted,
      closedStatuses.includes(sub.status) ? sub.date_approved : null
    );
    const overdue = isOverdue(sub.due_date, sub.status, closedStatuses);

    return [
      sub.submittal_number || '',
      sub.title || '',
      sub.description || '',
      sub.submittal_type || '',
      sub.status || '',
      sub.priority || '',
      sub.revision_number || 0,
      formatDate(sub.date_submitted),
      formatDate(sub.due_date),
      daysInReview,
      sub.sent_to || '',
      sub.sent_to_email || '',
      sub.spec_section || '',
      sub.manufacturer || '',
      sub.model_number || '',
      sub.reviewer_comments || '',
      formatDate(sub.date_approved),
      sub.internal_owner?.name || '',
      overdue ? 'YES' : ''
    ];
  });

  // Summary section by status
  const totalSubmittals = submittals.length;
  const statusCounts = SUBMITTAL_STATUSES.reduce((acc, status) => {
    acc[status] = submittals.filter(s => s.status === status).length;
    return acc;
  }, {});
  const overdueSubmittals = submittals.filter(s =>
    isOverdue(s.due_date, s.status, ['Approved', 'Approved as Noted', 'Rejected'])
  ).length;

  const summaryRows = [
    [],
    ['SUMMARY'],
    ['Total Submittals:', totalSubmittals],
    ['Pending:', statusCounts['Pending'] || 0],
    ['Submitted:', statusCounts['Submitted'] || 0],
    ['Under Review:', statusCounts['Under Review'] || 0],
    ['Approved:', statusCounts['Approved'] || 0],
    ['Approved as Noted:', statusCounts['Approved as Noted'] || 0],
    ['Revise & Resubmit:', statusCounts['Revise and Resubmit'] || 0],
    ['Rejected:', statusCounts['Rejected'] || 0],
    ['Overdue:', overdueSubmittals]
  ];

  // Type breakdown
  const typeRows = [
    [],
    ['BY TYPE']
  ];
  const typeCounts = submittals.reduce((acc, s) => {
    const type = s.submittal_type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  Object.entries(typeCounts).forEach(([type, count]) => {
    typeRows.push([`${type}:`, count]);
  });

  // Combine all rows
  const allRows = [
    ...headerRows,
    columnHeaders,
    ...dataRows,
    ...summaryRows,
    ...typeRows
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  setColumnWidths(worksheet, dataRows, columnHeaders);

  // Merge title cell
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
  ];

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Submittal Log');

  // Generate filename
  const filename = `${projectInfo.projectNumber}_Submittal_Log_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);

  return filename;
};

// ============================================================================
// COMBINED EXPORT (Both logs in one workbook)
// ============================================================================

/**
 * Export both RFI and Submittal logs in a single workbook
 * @param {Array} rfis - Array of RFI objects
 * @param {Array} submittals - Array of Submittal objects
 * @param {Object} projectInfo - Project information
 */
export const exportProjectLogs = (rfis, submittals, projectInfo) => {
  const generatedDate = new Date().toLocaleString();
  const workbook = XLSX.utils.book_new();

  // ===== RFI SHEET =====
  const rfiHeaderRows = createWorksheetWithHeader(projectInfo, 'RFI LOG', generatedDate);
  const rfiColumnHeaders = [
    'RFI #', 'Subject', 'Question', 'Status', 'Priority',
    'Date Sent', 'Due Date', 'Days Open', 'Sent To', 'Email',
    'Spec Section', 'Drawing Ref', 'Answer', 'Date Answered', 'Overdue'
  ];

  const sortedRFIs = [...rfis].sort((a, b) => (a.number || 0) - (b.number || 0));
  const rfiDataRows = sortedRFIs.map(rfi => {
    const closedStatuses = ['Answered', 'Closed'];
    const daysOpen = daysBetween(rfi.date_sent || rfi.created_at,
      closedStatuses.includes(rfi.status) ? rfi.date_answered : null);
    const overdue = isOverdue(rfi.due_date, rfi.status, closedStatuses);

    return [
      rfi.rfi_number || '', rfi.subject || '', rfi.question || '',
      rfi.status || '', rfi.priority || '', formatDate(rfi.date_sent),
      formatDate(rfi.due_date), daysOpen, rfi.sent_to || '',
      rfi.sent_to_email || '', rfi.spec_section || '', rfi.drawing_reference || '',
      rfi.answer || '', formatDate(rfi.date_answered), overdue ? 'YES' : ''
    ];
  });

  const rfiSummary = [
    [], ['SUMMARY'],
    ['Total RFIs:', rfis.length],
    ['Open/Pending:', rfis.filter(r => ['Open', 'Pending', 'Draft'].includes(r.status)).length],
    ['Answered:', rfis.filter(r => r.status === 'Answered').length],
    ['Closed:', rfis.filter(r => r.status === 'Closed').length]
  ];

  const rfiAllRows = [...rfiHeaderRows, rfiColumnHeaders, ...rfiDataRows, ...rfiSummary];
  const rfiWorksheet = XLSX.utils.aoa_to_sheet(rfiAllRows);
  setColumnWidths(rfiWorksheet, rfiDataRows, rfiColumnHeaders);
  XLSX.utils.book_append_sheet(workbook, rfiWorksheet, 'RFI Log');

  // ===== SUBMITTAL SHEET =====
  const subHeaderRows = createWorksheetWithHeader(projectInfo, 'SUBMITTAL LOG', generatedDate);
  const subColumnHeaders = [
    'Sub #', 'Title', 'Type', 'Status', 'Priority', 'Rev #',
    'Date Submitted', 'Due Date', 'Days in Review', 'Sent To',
    'Spec Section', 'Manufacturer', 'Model #', 'Reviewer Comments', 'Overdue'
  ];

  const sortedSubmittals = [...submittals].sort((a, b) => (a.number || 0) - (b.number || 0));
  const subDataRows = sortedSubmittals.map(sub => {
    const closedStatuses = ['Approved', 'Approved as Noted', 'Rejected'];
    const daysInReview = daysBetween(sub.date_submitted,
      closedStatuses.includes(sub.status) ? sub.date_approved : null);
    const overdue = isOverdue(sub.due_date, sub.status, closedStatuses);

    return [
      sub.submittal_number || '', sub.title || '', sub.submittal_type || '',
      sub.status || '', sub.priority || '', sub.revision_number || 0,
      formatDate(sub.date_submitted), formatDate(sub.due_date), daysInReview,
      sub.sent_to || '', sub.spec_section || '', sub.manufacturer || '',
      sub.model_number || '', sub.reviewer_comments || '', overdue ? 'YES' : ''
    ];
  });

  const subSummary = [
    [], ['SUMMARY'],
    ['Total Submittals:', submittals.length],
    ['Approved:', submittals.filter(s => ['Approved', 'Approved as Noted'].includes(s.status)).length],
    ['Under Review:', submittals.filter(s => s.status === 'Under Review').length],
    ['Pending:', submittals.filter(s => ['Pending', 'Submitted'].includes(s.status)).length],
    ['Action Required:', submittals.filter(s => s.status === 'Revise and Resubmit').length]
  ];

  const subAllRows = [...subHeaderRows, subColumnHeaders, ...subDataRows, ...subSummary];
  const subWorksheet = XLSX.utils.aoa_to_sheet(subAllRows);
  setColumnWidths(subWorksheet, subDataRows, subColumnHeaders);
  XLSX.utils.book_append_sheet(workbook, subWorksheet, 'Submittal Log');

  // Generate filename and download
  const filename = `${projectInfo.projectNumber}_Project_Logs_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return filename;
};

export default {
  exportRFILog,
  exportSubmittalLog,
  exportProjectLogs
};
