// ============================================================================
// excelExport.js - Professional Excel Export for RFI and Submittal Logs
// ============================================================================
// Generates professionally formatted Excel spreadsheets with:
// - Styled headers with colored backgrounds
// - Status-based conditional formatting
// - Overdue highlighting
// - Auto-width columns
// - Professional borders and typography
// ============================================================================

import ExcelJS from 'exceljs';

// ============================================================================
// STYLE CONSTANTS
// ============================================================================

const COLORS = {
  // Header colors
  headerBg: '2563EB',      // Blue-600
  headerText: 'FFFFFF',    // White

  // Status colors
  approved: 'DCFCE7',      // Green-100
  pending: 'FEF3C7',       // Amber-100
  rejected: 'FEE2E2',      // Red-100
  inProgress: 'DBEAFE',    // Blue-100
  overdue: 'FEE2E2',       // Red-100

  // General
  sectionHeader: 'F3F4F6', // Gray-100
  altRow: 'F9FAFB',        // Gray-50
  border: 'E5E7EB',        // Gray-200
  titleBg: '1E40AF',       // Blue-800
};

const FONTS = {
  title: { bold: true, size: 16, color: { argb: 'FFFFFF' } },
  header: { bold: true, size: 11, color: { argb: 'FFFFFF' } },
  sectionHeader: { bold: true, size: 11 },
  normal: { size: 10 },
  bold: { bold: true, size: 10 },
};

const BORDERS = {
  thin: {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  },
};

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
 * Get background color based on status
 */
const getStatusColor = (status, type = 'rfi') => {
  const statusLower = (status || '').toLowerCase();

  if (type === 'rfi') {
    if (statusLower === 'answered' || statusLower === 'closed') return COLORS.approved;
    if (statusLower === 'open' || statusLower === 'pending') return COLORS.pending;
    if (statusLower === 'draft') return COLORS.altRow;
  } else if (type === 'submittal') {
    if (statusLower === 'approved' || statusLower === 'approved as noted') return COLORS.approved;
    if (statusLower === 'under review' || statusLower === 'submitted') return COLORS.inProgress;
    if (statusLower === 'pending') return COLORS.pending;
    if (statusLower === 'revise and resubmit' || statusLower === 'rejected') return COLORS.rejected;
  } else if (type === 'task') {
    if (statusLower === 'completed') return COLORS.approved;
    if (statusLower === 'in progress') return COLORS.inProgress;
    if (statusLower === 'not started' || statusLower === 'pending') return COLORS.pending;
    if (statusLower === 'on hold' || statusLower === 'awaiting response') return COLORS.altRow;
    if (statusLower === 'cancelled') return COLORS.rejected;
  }

  return null;
};

/**
 * Style a header row
 */
const styleHeaderRow = (row) => {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg }
    };
    cell.font = FONTS.header;
    cell.border = BORDERS.thin;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  row.height = 28;
};

/**
 * Style a data row
 */
const styleDataRow = (row, isOverdueRow, statusColor, isAltRow) => {
  row.eachCell((cell) => {
    // Priority: Overdue > Status color > Alternating row
    if (isOverdueRow) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.overdue }
      };
    } else if (statusColor) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColor }
      };
    } else if (isAltRow) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.altRow }
      };
    }
    cell.font = FONTS.normal;
    cell.border = BORDERS.thin;
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  row.height = 22;
};

/**
 * Auto-fit column widths
 */
const autoFitColumns = (worksheet, headers, data) => {
  headers.forEach((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => {
        const cell = row[i];
        return cell ? String(cell).length : 0;
      })
    );
    worksheet.getColumn(i + 1).width = Math.min(Math.max(maxLength + 2, 10), 50);
  });
};

/**
 * Add project header to worksheet
 */
const addProjectHeader = (worksheet, projectInfo, title, generatedDate) => {
  // Title row
  const titleRow = worksheet.addRow([title]);
  titleRow.font = FONTS.title;
  titleRow.height = 30;
  worksheet.mergeCells(titleRow.number, 1, titleRow.number, 6);
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.titleBg }
  };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  // Empty row
  worksheet.addRow([]);

  // Project info rows
  const infoStyle = { font: FONTS.bold };

  const projectRow = worksheet.addRow(['Project:', projectInfo.name]);
  projectRow.getCell(1).font = FONTS.bold;

  const numberRow = worksheet.addRow(['Project Number:', projectInfo.projectNumber]);
  numberRow.getCell(1).font = FONTS.bold;

  const clientRow = worksheet.addRow(['Client:', projectInfo.client || 'N/A']);
  clientRow.getCell(1).font = FONTS.bold;

  const factoryRow = worksheet.addRow(['Factory:', projectInfo.factory || 'N/A']);
  factoryRow.getCell(1).font = FONTS.bold;

  const genRow = worksheet.addRow(['Generated:', generatedDate]);
  genRow.getCell(1).font = FONTS.bold;

  // Empty row before data
  worksheet.addRow([]);

  return worksheet.rowCount;
};

/**
 * Add summary section
 */
const addSummarySection = (worksheet, summaryData) => {
  worksheet.addRow([]);

  const summaryHeaderRow = worksheet.addRow(['SUMMARY']);
  summaryHeaderRow.font = FONTS.sectionHeader;
  summaryHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.sectionHeader }
  };
  worksheet.mergeCells(summaryHeaderRow.number, 1, summaryHeaderRow.number, 2);

  summaryData.forEach(([label, value]) => {
    const row = worksheet.addRow([label, value]);
    row.getCell(1).font = FONTS.bold;
  });
};

/**
 * Save workbook and trigger download
 */
const downloadWorkbook = async (workbook, filename) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
  return filename;
};

// ============================================================================
// RFI LOG EXPORT
// ============================================================================

/**
 * Export RFI Log to Excel
 * @param {Array} rfis - Array of RFI objects
 * @param {Object} projectInfo - Project information { name, projectNumber, client, factory }
 */
export const exportRFILog = async (rfis, projectInfo) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sunbelt PM System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('RFI Log', {
    views: [{ state: 'frozen', ySplit: 9 }] // Freeze header rows
  });

  const generatedDate = new Date().toLocaleString();

  // Add project header
  addProjectHeader(worksheet, projectInfo, 'RFI LOG', generatedDate);

  // Column headers
  const columnHeaders = [
    'RFI #', 'Subject', 'Question', 'Status', 'Priority',
    'Date Sent', 'Due Date', 'Days Open', 'Sent To', 'Email',
    'Spec Section', 'Drawing Ref', 'Answer', 'Date Answered',
    'Internal Owner', 'Overdue'
  ];

  const headerRow = worksheet.addRow(columnHeaders);
  styleHeaderRow(headerRow);
  const headerRowNum = headerRow.number;

  // Sort RFIs by number
  const sortedRFIs = [...rfis].sort((a, b) => (a.number || 0) - (b.number || 0));

  // Add data rows
  sortedRFIs.forEach((rfi, index) => {
    const closedStatuses = ['Answered', 'Closed'];
    const daysOpen = daysBetween(
      rfi.date_sent || rfi.created_at,
      closedStatuses.includes(rfi.status) ? rfi.date_answered : null
    );
    const overdueFlag = isOverdue(rfi.due_date, rfi.status, closedStatuses);

    const rowData = [
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
      overdueFlag ? 'YES' : ''
    ];

    const row = worksheet.addRow(rowData);
    const statusColor = getStatusColor(rfi.status, 'rfi');
    styleDataRow(row, overdueFlag, statusColor, index % 2 === 1);
  });

  // Auto-fit columns
  const dataForWidth = sortedRFIs.map(rfi => [
    rfi.rfi_number || '', rfi.subject || '', rfi.question || '',
    rfi.status || '', rfi.priority || '', formatDate(rfi.date_sent),
    formatDate(rfi.due_date), '', rfi.sent_to || '', rfi.sent_to_email || '',
    rfi.spec_section || '', rfi.drawing_reference || '', rfi.answer || '',
    formatDate(rfi.date_answered), rfi.internal_owner?.name || '', ''
  ]);
  autoFitColumns(worksheet, columnHeaders, dataForWidth);

  // Summary section
  const totalRFIs = rfis.length;
  const openRFIs = rfis.filter(r => ['Open', 'Pending', 'Draft'].includes(r.status)).length;
  const answeredRFIs = rfis.filter(r => r.status === 'Answered').length;
  const closedRFIs = rfis.filter(r => r.status === 'Closed').length;
  const overdueRFIs = rfis.filter(r =>
    isOverdue(r.due_date, r.status, ['Answered', 'Closed'])
  ).length;

  addSummarySection(worksheet, [
    ['Total RFIs:', totalRFIs],
    ['Open/Pending:', openRFIs],
    ['Answered:', answeredRFIs],
    ['Closed:', closedRFIs],
    ['Overdue:', overdueRFIs]
  ]);

  // Generate filename and download
  const filename = `${projectInfo.projectNumber}_RFI_Log_${new Date().toISOString().split('T')[0]}.xlsx`;
  return await downloadWorkbook(workbook, filename);
};

// ============================================================================
// SUBMITTAL LOG EXPORT
// ============================================================================

/**
 * Export Submittal Log to Excel
 * @param {Array} submittals - Array of Submittal objects
 * @param {Object} projectInfo - Project information { name, projectNumber, client, factory }
 */
export const exportSubmittalLog = async (submittals, projectInfo) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sunbelt PM System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Submittal Log', {
    views: [{ state: 'frozen', ySplit: 9 }]
  });

  const generatedDate = new Date().toLocaleString();

  // Add project header
  addProjectHeader(worksheet, projectInfo, 'SUBMITTAL LOG', generatedDate);

  // Column headers
  const columnHeaders = [
    'Sub #', 'Title', 'Description', 'Type', 'Status', 'Priority',
    'Rev #', 'Date Submitted', 'Due Date', 'Days in Review',
    'Sent To', 'Email', 'Spec Section', 'Manufacturer', 'Model #',
    'Reviewer Comments', 'Date Approved', 'Internal Owner', 'Overdue'
  ];

  const headerRow = worksheet.addRow(columnHeaders);
  styleHeaderRow(headerRow);

  // Sort submittals by number
  const sortedSubmittals = [...submittals].sort((a, b) => (a.number || 0) - (b.number || 0));

  // Add data rows
  sortedSubmittals.forEach((sub, index) => {
    const closedStatuses = ['Approved', 'Approved as Noted', 'Rejected'];
    const daysInReview = daysBetween(
      sub.date_submitted,
      closedStatuses.includes(sub.status) ? sub.date_approved : null
    );
    const overdueFlag = isOverdue(sub.due_date, sub.status, closedStatuses);

    const rowData = [
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
      overdueFlag ? 'YES' : ''
    ];

    const row = worksheet.addRow(rowData);
    const statusColor = getStatusColor(sub.status, 'submittal');
    styleDataRow(row, overdueFlag, statusColor, index % 2 === 1);
  });

  // Auto-fit columns
  const dataForWidth = sortedSubmittals.map(sub => [
    sub.submittal_number || '', sub.title || '', sub.description || '',
    sub.submittal_type || '', sub.status || '', sub.priority || '',
    String(sub.revision_number || 0), formatDate(sub.date_submitted),
    formatDate(sub.due_date), '', sub.sent_to || '', sub.sent_to_email || '',
    sub.spec_section || '', sub.manufacturer || '', sub.model_number || '',
    sub.reviewer_comments || '', formatDate(sub.date_approved),
    sub.internal_owner?.name || '', ''
  ]);
  autoFitColumns(worksheet, columnHeaders, dataForWidth);

  // Summary section
  const totalSubmittals = submittals.length;
  const statusCounts = {
    'Pending': submittals.filter(s => s.status === 'Pending').length,
    'Submitted': submittals.filter(s => s.status === 'Submitted').length,
    'Under Review': submittals.filter(s => s.status === 'Under Review').length,
    'Approved': submittals.filter(s => s.status === 'Approved').length,
    'Approved as Noted': submittals.filter(s => s.status === 'Approved as Noted').length,
    'Revise and Resubmit': submittals.filter(s => s.status === 'Revise and Resubmit').length,
    'Rejected': submittals.filter(s => s.status === 'Rejected').length,
  };
  const overdueSubmittals = submittals.filter(s =>
    isOverdue(s.due_date, s.status, ['Approved', 'Approved as Noted', 'Rejected'])
  ).length;

  addSummarySection(worksheet, [
    ['Total Submittals:', totalSubmittals],
    ['Pending:', statusCounts['Pending']],
    ['Submitted:', statusCounts['Submitted']],
    ['Under Review:', statusCounts['Under Review']],
    ['Approved:', statusCounts['Approved']],
    ['Approved as Noted:', statusCounts['Approved as Noted']],
    ['Revise & Resubmit:', statusCounts['Revise and Resubmit']],
    ['Rejected:', statusCounts['Rejected']],
    ['Overdue:', overdueSubmittals]
  ]);

  // Type breakdown
  worksheet.addRow([]);
  const typeHeaderRow = worksheet.addRow(['BY TYPE']);
  typeHeaderRow.font = FONTS.sectionHeader;
  typeHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.sectionHeader }
  };

  const typeCounts = submittals.reduce((acc, s) => {
    const type = s.submittal_type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  Object.entries(typeCounts).forEach(([type, count]) => {
    const row = worksheet.addRow([`${type}:`, count]);
    row.getCell(1).font = FONTS.bold;
  });

  // Generate filename and download
  const filename = `${projectInfo.projectNumber}_Submittal_Log_${new Date().toISOString().split('T')[0]}.xlsx`;
  return await downloadWorkbook(workbook, filename);
};

// ============================================================================
// TASK LOG EXPORT
// ============================================================================

/**
 * Export Task Log to Excel
 * @param {Array} tasks - Array of Task objects
 * @param {Object} projectInfo - Project information { name, projectNumber, client, factory }
 */
export const exportTaskLog = async (tasks, projectInfo) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sunbelt PM System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Task Log', {
    views: [{ state: 'frozen', ySplit: 9 }]
  });

  const generatedDate = new Date().toLocaleString();

  // Add project header
  addProjectHeader(worksheet, projectInfo, 'TASK LOG', generatedDate);

  // Column headers
  const columnHeaders = [
    'Task', 'Description', 'Status', 'Priority', 'Assigned To',
    'Start Date', 'Due Date', 'Days Open', 'Milestone',
    'Workflow Station', 'Court', 'Completed Date', 'Overdue'
  ];

  const headerRow = worksheet.addRow(columnHeaders);
  styleHeaderRow(headerRow);

  // Sort tasks by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  // Add data rows
  sortedTasks.forEach((task, index) => {
    const closedStatuses = ['Completed', 'Cancelled'];
    const daysOpen = daysBetween(
      task.start_date || task.created_at,
      closedStatuses.includes(task.status) ? task.completed_date : null
    );
    const overdueFlag = isOverdue(task.due_date, task.status, closedStatuses);

    const assignee = task.is_external
      ? `${task.external_assignee_name || 'External'} (External)`
      : task.assignee?.name || task.assigned_to_name || '';

    const rowData = [
      task.title || '',
      task.description || '',
      task.status || '',
      task.priority || '',
      assignee,
      formatDate(task.start_date),
      formatDate(task.due_date),
      daysOpen,
      task.milestone?.name || '',
      task.workflow_station_key || '',
      task.assigned_court || '',
      formatDate(task.completed_date),
      overdueFlag ? 'YES' : ''
    ];

    const row = worksheet.addRow(rowData);
    const statusColor = getStatusColor(task.status, 'task');
    styleDataRow(row, overdueFlag, statusColor, index % 2 === 1);
  });

  // Auto-fit columns
  const dataForWidth = sortedTasks.map(task => [
    task.title || '', task.description || '', task.status || '',
    task.priority || '', task.assignee?.name || '', formatDate(task.start_date),
    formatDate(task.due_date), '', task.milestone?.name || '',
    task.workflow_station_key || '', task.assigned_court || '',
    formatDate(task.completed_date), ''
  ]);
  autoFitColumns(worksheet, columnHeaders, dataForWidth);

  // Summary section
  const totalTasks = tasks.length;
  const notStarted = tasks.filter(t => t.status === 'Not Started').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const awaitingResponse = tasks.filter(t => t.status === 'Awaiting Response' || t.status === 'On Hold').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const cancelled = tasks.filter(t => t.status === 'Cancelled').length;
  const overdueTasks = tasks.filter(t =>
    isOverdue(t.due_date, t.status, ['Completed', 'Cancelled'])
  ).length;

  addSummarySection(worksheet, [
    ['Total Tasks:', totalTasks],
    ['Not Started:', notStarted],
    ['In Progress:', inProgress],
    ['Awaiting Response:', awaitingResponse],
    ['Completed:', completed],
    ['Cancelled:', cancelled],
    ['Overdue:', overdueTasks]
  ]);

  // Priority breakdown
  worksheet.addRow([]);
  const priorityHeaderRow = worksheet.addRow(['BY PRIORITY']);
  priorityHeaderRow.font = FONTS.sectionHeader;
  priorityHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.sectionHeader }
  };

  const priorityCounts = tasks.reduce((acc, t) => {
    const priority = t.priority || 'Medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  Object.entries(priorityCounts).forEach(([priority, count]) => {
    const row = worksheet.addRow([`${priority}:`, count]);
    row.getCell(1).font = FONTS.bold;
  });

  // Generate filename and download
  const filename = `${projectInfo.projectNumber}_Task_Log_${new Date().toISOString().split('T')[0]}.xlsx`;
  return await downloadWorkbook(workbook, filename);
};

// ============================================================================
// GLOBAL RFI/SUBMITTAL/TASK EXPORT (All Projects)
// ============================================================================

/**
 * Export all RFIs across projects to Excel
 * @param {Array} rfis - Array of RFI objects with project relation
 */
export const exportAllRFIs = async (rfis) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sunbelt PM System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('All RFIs', {
    views: [{ state: 'frozen', ySplit: 6 }]
  });

  const generatedDate = new Date().toLocaleString();

  // Title
  const titleRow = worksheet.addRow(['ALL RFIs REPORT']);
  titleRow.font = FONTS.title;
  titleRow.height = 30;
  worksheet.mergeCells(1, 1, 1, 6);
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.titleBg }
  };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]);

  const genRow = worksheet.addRow(['Generated:', generatedDate]);
  genRow.getCell(1).font = FONTS.bold;

  const totalRow = worksheet.addRow(['Total RFIs:', rfis.length]);
  totalRow.getCell(1).font = FONTS.bold;

  worksheet.addRow([]);

  // Column headers
  const columnHeaders = [
    'RFI #', 'Project', 'Subject', 'Status', 'Priority',
    'Sent To', 'Due Date', 'Days Open', 'Answered', 'Overdue'
  ];

  const headerRow = worksheet.addRow(columnHeaders);
  styleHeaderRow(headerRow);

  // Sort by due date
  const sortedRFIs = [...rfis].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  // Add data rows
  sortedRFIs.forEach((rfi, index) => {
    const closedStatuses = ['Answered', 'Closed'];
    const daysOpen = daysBetween(
      rfi.date_sent || rfi.created_at,
      closedStatuses.includes(rfi.status) ? rfi.date_answered : null
    );
    const overdueFlag = isOverdue(rfi.due_date, rfi.status, closedStatuses);

    const rowData = [
      rfi.rfi_number || '',
      rfi.project?.project_number || '',
      rfi.subject || '',
      rfi.status || '',
      rfi.priority || '',
      rfi.sent_to || '',
      formatDate(rfi.due_date),
      daysOpen,
      formatDate(rfi.date_answered),
      overdueFlag ? 'YES' : ''
    ];

    const row = worksheet.addRow(rowData);
    const statusColor = getStatusColor(rfi.status, 'rfi');
    styleDataRow(row, overdueFlag, statusColor, index % 2 === 1);
  });

  // Auto-fit columns
  const dataForWidth = sortedRFIs.map(rfi => [
    rfi.rfi_number || '', rfi.project?.project_number || '', rfi.subject || '',
    rfi.status || '', rfi.priority || '', rfi.sent_to || '',
    formatDate(rfi.due_date), '', formatDate(rfi.date_answered), ''
  ]);
  autoFitColumns(worksheet, columnHeaders, dataForWidth);

  const filename = `All_RFIs_${new Date().toISOString().split('T')[0]}.xlsx`;
  return await downloadWorkbook(workbook, filename);
};

/**
 * Export all Submittals across projects to Excel
 * @param {Array} submittals - Array of Submittal objects with project relation
 */
export const exportAllSubmittals = async (submittals) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sunbelt PM System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('All Submittals', {
    views: [{ state: 'frozen', ySplit: 6 }]
  });

  const generatedDate = new Date().toLocaleString();

  // Title
  const titleRow = worksheet.addRow(['ALL SUBMITTALS REPORT']);
  titleRow.font = FONTS.title;
  titleRow.height = 30;
  worksheet.mergeCells(1, 1, 1, 6);
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.titleBg }
  };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]);

  const genRow = worksheet.addRow(['Generated:', generatedDate]);
  genRow.getCell(1).font = FONTS.bold;

  const totalRow = worksheet.addRow(['Total Submittals:', submittals.length]);
  totalRow.getCell(1).font = FONTS.bold;

  worksheet.addRow([]);

  // Column headers
  const columnHeaders = [
    'Sub #', 'Project', 'Title', 'Type', 'Status', 'Priority',
    'Sent To', 'Due Date', 'Days in Review', 'Approved Date', 'Overdue'
  ];

  const headerRow = worksheet.addRow(columnHeaders);
  styleHeaderRow(headerRow);

  // Sort by due date
  const sortedSubmittals = [...submittals].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  // Add data rows
  sortedSubmittals.forEach((sub, index) => {
    const closedStatuses = ['Approved', 'Approved as Noted', 'Rejected'];
    const daysInReview = daysBetween(
      sub.date_submitted,
      closedStatuses.includes(sub.status) ? sub.date_approved : null
    );
    const overdueFlag = isOverdue(sub.due_date, sub.status, closedStatuses);

    const rowData = [
      sub.submittal_number || '',
      sub.project?.project_number || '',
      sub.title || '',
      sub.submittal_type || '',
      sub.status || '',
      sub.priority || '',
      sub.sent_to || '',
      formatDate(sub.due_date),
      daysInReview,
      formatDate(sub.date_approved),
      overdueFlag ? 'YES' : ''
    ];

    const row = worksheet.addRow(rowData);
    const statusColor = getStatusColor(sub.status, 'submittal');
    styleDataRow(row, overdueFlag, statusColor, index % 2 === 1);
  });

  // Auto-fit columns
  const dataForWidth = sortedSubmittals.map(sub => [
    sub.submittal_number || '', sub.project?.project_number || '', sub.title || '',
    sub.submittal_type || '', sub.status || '', sub.priority || '',
    sub.sent_to || '', formatDate(sub.due_date), '',
    formatDate(sub.date_approved), ''
  ]);
  autoFitColumns(worksheet, columnHeaders, dataForWidth);

  const filename = `All_Submittals_${new Date().toISOString().split('T')[0]}.xlsx`;
  return await downloadWorkbook(workbook, filename);
};

/**
 * Export all Tasks across projects to Excel
 * @param {Array} tasks - Array of Task objects with project relation
 */
export const exportAllTasks = async (tasks) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sunbelt PM System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('All Tasks', {
    views: [{ state: 'frozen', ySplit: 6 }]
  });

  const generatedDate = new Date().toLocaleString();

  // Title
  const titleRow = worksheet.addRow(['ALL TASKS REPORT']);
  titleRow.font = FONTS.title;
  titleRow.height = 30;
  worksheet.mergeCells(1, 1, 1, 6);
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.titleBg }
  };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]);

  const genRow = worksheet.addRow(['Generated:', generatedDate]);
  genRow.getCell(1).font = FONTS.bold;

  const totalRow = worksheet.addRow(['Total Tasks:', tasks.length]);
  totalRow.getCell(1).font = FONTS.bold;

  worksheet.addRow([]);

  // Column headers
  const columnHeaders = [
    'Task', 'Project', 'Status', 'Priority', 'Assigned To',
    'Due Date', 'Days Open', 'Completed', 'Overdue'
  ];

  const headerRow = worksheet.addRow(columnHeaders);
  styleHeaderRow(headerRow);

  // Sort by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  // Add data rows
  sortedTasks.forEach((task, index) => {
    const closedStatuses = ['Completed', 'Cancelled'];
    const daysOpen = daysBetween(
      task.start_date || task.created_at,
      closedStatuses.includes(task.status) ? task.completed_date : null
    );
    const overdueFlag = isOverdue(task.due_date, task.status, closedStatuses);

    const assignee = task.is_external
      ? `${task.external_assignee_name || 'External'}`
      : task.assignee?.name || task.assigned_to_name || '';

    const rowData = [
      task.title || '',
      task.project?.project_number || '',
      task.status || '',
      task.priority || '',
      assignee,
      formatDate(task.due_date),
      daysOpen,
      formatDate(task.completed_date),
      overdueFlag ? 'YES' : ''
    ];

    const row = worksheet.addRow(rowData);
    const statusColor = getStatusColor(task.status, 'task');
    styleDataRow(row, overdueFlag, statusColor, index % 2 === 1);
  });

  // Auto-fit columns
  const dataForWidth = sortedTasks.map(task => [
    task.title || '', task.project?.project_number || '', task.status || '',
    task.priority || '', task.assignee?.name || '', formatDate(task.due_date),
    '', formatDate(task.completed_date), ''
  ]);
  autoFitColumns(worksheet, columnHeaders, dataForWidth);

  const filename = `All_Tasks_${new Date().toISOString().split('T')[0]}.xlsx`;
  return await downloadWorkbook(workbook, filename);
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
export const exportProjectLogs = async (rfis, submittals, projectInfo) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sunbelt PM System';
  workbook.created = new Date();

  const generatedDate = new Date().toLocaleString();

  // ===== RFI SHEET =====
  const rfiSheet = workbook.addWorksheet('RFI Log', {
    views: [{ state: 'frozen', ySplit: 9 }]
  });

  addProjectHeader(rfiSheet, projectInfo, 'RFI LOG', generatedDate);

  const rfiHeaders = [
    'RFI #', 'Subject', 'Question', 'Status', 'Priority',
    'Date Sent', 'Due Date', 'Days Open', 'Sent To', 'Email',
    'Spec Section', 'Drawing Ref', 'Answer', 'Date Answered', 'Overdue'
  ];

  const rfiHeaderRow = rfiSheet.addRow(rfiHeaders);
  styleHeaderRow(rfiHeaderRow);

  const sortedRFIs = [...rfis].sort((a, b) => (a.number || 0) - (b.number || 0));

  sortedRFIs.forEach((rfi, index) => {
    const closedStatuses = ['Answered', 'Closed'];
    const daysOpen = daysBetween(
      rfi.date_sent || rfi.created_at,
      closedStatuses.includes(rfi.status) ? rfi.date_answered : null
    );
    const overdueFlag = isOverdue(rfi.due_date, rfi.status, closedStatuses);

    const row = rfiSheet.addRow([
      rfi.rfi_number || '', rfi.subject || '', rfi.question || '',
      rfi.status || '', rfi.priority || '', formatDate(rfi.date_sent),
      formatDate(rfi.due_date), daysOpen, rfi.sent_to || '',
      rfi.sent_to_email || '', rfi.spec_section || '', rfi.drawing_reference || '',
      rfi.answer || '', formatDate(rfi.date_answered), overdueFlag ? 'YES' : ''
    ]);

    const statusColor = getStatusColor(rfi.status, 'rfi');
    styleDataRow(row, overdueFlag, statusColor, index % 2 === 1);
  });

  // RFI Summary
  addSummarySection(rfiSheet, [
    ['Total RFIs:', rfis.length],
    ['Open/Pending:', rfis.filter(r => ['Open', 'Pending', 'Draft'].includes(r.status)).length],
    ['Answered:', rfis.filter(r => r.status === 'Answered').length],
    ['Closed:', rfis.filter(r => r.status === 'Closed').length]
  ]);

  // Auto-fit RFI columns
  const rfiDataForWidth = sortedRFIs.map(rfi => [
    rfi.rfi_number || '', rfi.subject || '', rfi.question || '',
    rfi.status || '', rfi.priority || '', formatDate(rfi.date_sent),
    formatDate(rfi.due_date), '', rfi.sent_to || '', rfi.sent_to_email || '',
    rfi.spec_section || '', rfi.drawing_reference || '', rfi.answer || '',
    formatDate(rfi.date_answered), ''
  ]);
  autoFitColumns(rfiSheet, rfiHeaders, rfiDataForWidth);

  // ===== SUBMITTAL SHEET =====
  const subSheet = workbook.addWorksheet('Submittal Log', {
    views: [{ state: 'frozen', ySplit: 9 }]
  });

  addProjectHeader(subSheet, projectInfo, 'SUBMITTAL LOG', generatedDate);

  const subHeaders = [
    'Sub #', 'Title', 'Type', 'Status', 'Priority', 'Rev #',
    'Date Submitted', 'Due Date', 'Days in Review', 'Sent To',
    'Spec Section', 'Manufacturer', 'Model #', 'Reviewer Comments', 'Overdue'
  ];

  const subHeaderRow = subSheet.addRow(subHeaders);
  styleHeaderRow(subHeaderRow);

  const sortedSubmittals = [...submittals].sort((a, b) => (a.number || 0) - (b.number || 0));

  sortedSubmittals.forEach((sub, index) => {
    const closedStatuses = ['Approved', 'Approved as Noted', 'Rejected'];
    const daysInReview = daysBetween(
      sub.date_submitted,
      closedStatuses.includes(sub.status) ? sub.date_approved : null
    );
    const overdueFlag = isOverdue(sub.due_date, sub.status, closedStatuses);

    const row = subSheet.addRow([
      sub.submittal_number || '', sub.title || '', sub.submittal_type || '',
      sub.status || '', sub.priority || '', sub.revision_number || 0,
      formatDate(sub.date_submitted), formatDate(sub.due_date), daysInReview,
      sub.sent_to || '', sub.spec_section || '', sub.manufacturer || '',
      sub.model_number || '', sub.reviewer_comments || '', overdueFlag ? 'YES' : ''
    ]);

    const statusColor = getStatusColor(sub.status, 'submittal');
    styleDataRow(row, overdueFlag, statusColor, index % 2 === 1);
  });

  // Submittal Summary
  addSummarySection(subSheet, [
    ['Total Submittals:', submittals.length],
    ['Approved:', submittals.filter(s => ['Approved', 'Approved as Noted'].includes(s.status)).length],
    ['Under Review:', submittals.filter(s => s.status === 'Under Review').length],
    ['Pending:', submittals.filter(s => ['Pending', 'Submitted'].includes(s.status)).length],
    ['Action Required:', submittals.filter(s => s.status === 'Revise and Resubmit').length]
  ]);

  // Auto-fit Submittal columns
  const subDataForWidth = sortedSubmittals.map(sub => [
    sub.submittal_number || '', sub.title || '', sub.submittal_type || '',
    sub.status || '', sub.priority || '', String(sub.revision_number || 0),
    formatDate(sub.date_submitted), formatDate(sub.due_date), '',
    sub.sent_to || '', sub.spec_section || '', sub.manufacturer || '',
    sub.model_number || '', sub.reviewer_comments || '', ''
  ]);
  autoFitColumns(subSheet, subHeaders, subDataForWidth);

  // Generate filename and download
  const filename = `${projectInfo.projectNumber}_Project_Logs_${new Date().toISOString().split('T')[0]}.xlsx`;
  return await downloadWorkbook(workbook, filename);
};

export default {
  exportRFILog,
  exportSubmittalLog,
  exportTaskLog,
  exportAllRFIs,
  exportAllSubmittals,
  exportAllTasks,
  exportProjectLogs
};
