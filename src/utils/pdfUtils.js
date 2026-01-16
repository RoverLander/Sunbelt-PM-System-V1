/**
 * PDF Export Utility - Professional Construction Documents
 * Generates polished PDF forms for RFIs, Submittals, and Tasks
 * 
 * Features:
 * - Professional construction industry document styling
 * - Company branding with logo placeholder
 * - Clean visual hierarchy and typography
 * - Formal approval/signature sections
 * - Document control information
 * - Print-optimized layouts
 * 
 * Uses browser print functionality for maximum compatibility
 */

// ===== CONFIGURATION =====

/**
 * Company branding configuration
 * Update these values to customize the PDF output
 */
const COMPANY_CONFIG = {
  name: 'SUNBELT MODULAR',
  tagline: 'Modular Building Solutions',
  // Base64 logo can be added here for branding
  // logo: 'data:image/png;base64,...',
  primaryColor: '#FF6B35',    // Sunbelt Orange
  secondaryColor: '#1E293B',  // Dark slate
  accentColor: '#0EA5E9',     // Info blue
};

/**
 * Factory logo mapping - maps factory codes/names to logo paths
 * Logos are stored in src/assets/logos/
 */
const FACTORY_LOGOS = {
  // Factory codes from FACTORY_LOCATIONS
  'NWBS': '/src/assets/logos/Northwest-Logo-Final.png',
  'BRIT': '/src/assets/logos/Britco-Logo-Final-FR.png',
  'PMI': '/src/assets/logos/PMI-Revision-400x309.png',
  'SSI': '/src/assets/logos/SSI-Logo-Tall.png',
  'AMTEX': '/src/assets/logos/New-AmTex-Logo.png',
  'MRS': '/src/assets/logos/Mr-Steel-Logo-Final.png',
  'CB': '/src/assets/logos/C-B-Logo-Final-1-400x400.png',
  'IND': '/src/assets/logos/Indicom-Logo-Final-400x400.png',
  'SEMO': '/src/assets/logos/Southeast-Logo-Final.png',

  // Also support full factory names
  'Northwest Building Systems': '/src/assets/logos/Northwest-Logo-Final.png',
  'Britco': '/src/assets/logos/Britco-Logo-Final-FR.png',
  'Palomar Modular': '/src/assets/logos/PMI-Revision-400x309.png',
  'Sunbelt Structures': '/src/assets/logos/SSI-Logo-Tall.png',
  'AmTex Modular': '/src/assets/logos/New-AmTex-Logo.png',
  'Mr. Steel': '/src/assets/logos/Mr-Steel-Logo-Final.png',
  'C&B Modular': '/src/assets/logos/C-B-Logo-Final-1-400x400.png',
  'Indicom': '/src/assets/logos/Indicom-Logo-Final-400x400.png',
  'Southeast Modular': '/src/assets/logos/Southeast-Logo-Final.png',

  // Default Sunbelt logo
  'default': '/src/assets/logos/Sunbelt-Logo.jpg'
};

/**
 * Convert an image URL to base64 for embedding in PDF HTML
 * @param {string} url - Image URL path
 * @returns {Promise<string>} Base64 encoded image data URL
 */
const imageToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to load logo:', url, error);
    return null;
  }
};

/**
 * Get factory logo as base64 for PDF embedding
 * @param {string} factoryCode - Factory code or name
 * @returns {Promise<string|null>} Base64 logo or null
 */
const getFactoryLogoBase64 = async (factoryCode) => {
  if (!factoryCode) return null;

  // Try to find logo by code or name
  const logoPath = FACTORY_LOGOS[factoryCode] ||
                   FACTORY_LOGOS[factoryCode?.toUpperCase()] ||
                   FACTORY_LOGOS['default'];

  if (logoPath) {
    return await imageToBase64(logoPath);
  }
  return null;
};

// ===== UTILITY FUNCTIONS =====

/**
 * Format date for professional PDF display
 * @param {string} dateString - ISO date string
 * @param {boolean} includeDay - Include day of week
 * @returns {string} Formatted date string
 */
const formatPDFDate = (dateString, includeDay = false) => {
  if (!dateString) return '—';
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeDay && { weekday: 'long' })
  };
  
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Format date in short format for tables
 * @param {string} dateString - ISO date string
 * @returns {string} Short formatted date
 */
const formatShortDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

/**
 * Escape HTML to prevent XSS in generated content
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeHTML = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Generate document control number
 * @param {string} prefix - Document type prefix
 * @param {string} number - Document number
 * @returns {string} Formatted control number
 */
const _generateControlNumber = (prefix, number) => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `${prefix}-${number}-${date}`;
};

// ===== PDF GENERATION =====

/**
 * Generate and download PDF by opening print dialog
 * @param {string} htmlContent - Complete HTML document
 * @param {string} filename - Download filename
 */
const generatePDF = (htmlContent, _filename) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  
  if (!printWindow) {
    alert('Please allow popups to generate PDF. Check your browser settings.');
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content and fonts to load
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };
};

// ===== STYLE DEFINITIONS =====

/**
 * Get base CSS reset and typography
 * @returns {string} Base CSS styles
 */
const getBaseStyles = () => `
  /* ===== CSS RESET ===== */
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* ===== ROOT VARIABLES ===== */
  :root {
    --primary: ${COMPANY_CONFIG.primaryColor};
    --secondary: ${COMPANY_CONFIG.secondaryColor};
    --accent: ${COMPANY_CONFIG.accentColor};
    --text-primary: #111827;
    --text-secondary: #4B5563;
    --text-muted: #9CA3AF;
    --border-light: #E5E7EB;
    --border-medium: #D1D5DB;
    --bg-light: #F9FAFB;
    --bg-subtle: #F3F4F6;
    --success: #059669;
    --warning: #D97706;
    --danger: #DC2626;
    --info: #0284C7;
  }

  /* ===== TYPOGRAPHY ===== */
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: var(--text-primary);
    background: white;
    padding: 0.4in 0.5in;
    max-width: 8.5in;
    margin: 0 auto;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.25;
    color: var(--secondary);
  }

  p { margin: 0; }
`;

/**
 * Get professional document header styles
 * @returns {string} Header CSS styles
 */
const getHeaderStyles = () => `
  /* ===== DOCUMENT HEADER ===== */
  .document-header {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    padding-bottom: 16px;
    margin-bottom: 20px;
    border-bottom: 3px solid var(--primary);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .factory-logo {
    height: 50px;
    width: auto;
    max-width: 120px;
    object-fit: contain;
  }

  .company-info {
    flex: 1;
  }

  .company-name {
    font-size: 18pt;
    font-weight: 700;
    color: var(--primary);
    letter-spacing: 1px;
    margin-bottom: 2px;
  }

  .company-tagline {
    font-size: 9pt;
    color: var(--text-secondary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .document-title-block {
    text-align: right;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .document-type {
    font-size: 14pt;
    font-weight: 700;
    color: var(--secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .document-number {
    font-size: 16pt;
    font-weight: 700;
    color: var(--primary);
    font-family: 'Consolas', 'Monaco', monospace;
  }

  .document-revision {
    font-size: 9pt;
    color: var(--text-muted);
    margin-top: 2px;
  }
`;

/**
 * Get info grid and field styles
 * @returns {string} Grid CSS styles
 */
const getGridStyles = () => `
  /* ===== INFO GRID ===== */
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0;
    border: 1px solid var(--border-medium);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 20px;
    background: white;
  }

  .info-grid.three-col {
    grid-template-columns: repeat(3, 1fr);
  }

  .info-cell {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-light);
    border-right: 1px solid var(--border-light);
    background: white;
  }

  .info-cell:nth-child(2n) {
    border-right: none;
  }

  .info-grid.three-col .info-cell:nth-child(3n) {
    border-right: none;
  }

  .info-cell:nth-last-child(-n+2) {
    border-bottom: none;
  }

  .info-grid.three-col .info-cell:nth-last-child(-n+3) {
    border-bottom: none;
  }

  .info-cell.highlight {
    background: var(--bg-light);
  }

  .info-cell.full-width {
    grid-column: 1 / -1;
    border-right: none;
  }

  .info-label {
    display: block;
    font-size: 8pt;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }

  .info-value {
    display: block;
    font-size: 10pt;
    font-weight: 500;
    color: var(--text-primary);
    word-break: break-word;
  }

  .info-value.large {
    font-size: 11pt;
    font-weight: 600;
  }

  .info-value.mono {
    font-family: 'Consolas', 'Monaco', monospace;
  }
`;

/**
 * Get content section styles
 * @returns {string} Section CSS styles
 */
const getSectionStyles = () => `
  /* ===== CONTENT SECTIONS ===== */
  .section {
    margin-bottom: 20px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--border-light);
  }

  .section-title {
    font-size: 10pt;
    font-weight: 700;
    color: var(--secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-badge {
    font-size: 8pt;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
  }

  .section-content {
    padding: 14px 16px;
    background: var(--bg-light);
    border: 1px solid var(--border-light);
    border-radius: 6px;
    min-height: 60px;
    font-size: 10pt;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .section-content.large {
    min-height: 100px;
  }

  .section-content.response {
    background: white;
    border: 2px solid var(--border-medium);
    border-left: 4px solid var(--accent);
  }

  .section-content.empty {
    color: var(--text-muted);
    font-style: italic;
  }
`;

/**
 * Get status badge styles
 * @returns {string} Badge CSS styles
 */
const getBadgeStyles = () => `
  /* ===== STATUS BADGES ===== */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 9pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  /* RFI Statuses */
  .status-open {
    background: #FEF3C7;
    color: #92400E;
    border: 1px solid #FCD34D;
  }

  .status-answered {
    background: #D1FAE5;
    color: #065F46;
    border: 1px solid #6EE7B7;
  }

  .status-closed {
    background: #E5E7EB;
    color: #374151;
    border: 1px solid #9CA3AF;
  }

  /* Task Statuses */
  .status-not-started {
    background: #F3F4F6;
    color: #4B5563;
    border: 1px solid #D1D5DB;
  }

  .status-in-progress {
    background: #DBEAFE;
    color: #1E40AF;
    border: 1px solid #93C5FD;
  }

  .status-blocked {
    background: #FEE2E2;
    color: #991B1B;
    border: 1px solid #FCA5A5;
  }

  .status-completed {
    background: #D1FAE5;
    color: #065F46;
    border: 1px solid #6EE7B7;
  }

  .status-cancelled {
    background: #F3F4F6;
    color: #6B7280;
    border: 1px solid #D1D5DB;
    text-decoration: line-through;
  }

  /* Submittal Statuses */
  .status-pending {
    background: #F3F4F6;
    color: #4B5563;
    border: 1px solid #D1D5DB;
  }

  .status-submitted {
    background: #DBEAFE;
    color: #1E40AF;
    border: 1px solid #93C5FD;
  }

  .status-under-review {
    background: #FEF3C7;
    color: #92400E;
    border: 1px solid #FCD34D;
  }

  .status-approved {
    background: #D1FAE5;
    color: #065F46;
    border: 1px solid #6EE7B7;
  }

  .status-approved-as-noted {
    background: #E0E7FF;
    color: #3730A3;
    border: 1px solid #A5B4FC;
  }

  .status-rejected {
    background: #FEE2E2;
    color: #991B1B;
    border: 1px solid #FCA5A5;
  }

  /* Priority Badges */
  .priority-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
  }

  .priority-low {
    background: #F3F4F6;
    color: #6B7280;
  }

  .priority-medium {
    background: #FEF3C7;
    color: #92400E;
  }

  .priority-high {
    background: #FED7AA;
    color: #C2410C;
  }

  .priority-critical {
    background: #FEE2E2;
    color: #991B1B;
  }
`;

/**
 * Get approval section styles
 * @returns {string} Approval CSS styles
 */
const getApprovalStyles = () => `
  /* ===== APPROVAL SECTION ===== */
  .approval-section {
    margin-top: 24px;
    border: 2px solid var(--secondary);
    border-radius: 6px;
    overflow: hidden;
  }

  .approval-header {
    background: var(--secondary);
    color: white;
    padding: 10px 16px;
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
  }

  .approval-body {
    padding: 16px;
    background: white;
  }

  .approval-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .approval-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--border-medium);
    border-radius: 4px;
    background: var(--bg-light);
  }

  .checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid var(--border-medium);
    border-radius: 3px;
    flex-shrink: 0;
  }

  .approval-option span {
    font-size: 9pt;
    font-weight: 600;
    color: var(--text-primary);
  }

  .comments-box {
    margin-bottom: 16px;
  }

  .comments-label {
    font-size: 8pt;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .comments-field {
    width: 100%;
    min-height: 60px;
    padding: 10px 12px;
    border: 1px solid var(--border-medium);
    border-radius: 4px;
    background: white;
    font-size: 10pt;
  }

  /* ===== SIGNATURE SECTION ===== */
  .signature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-light);
  }

  .signature-block {
    display: flex;
    flex-direction: column;
  }

  .signature-line {
    height: 40px;
    border-bottom: 1px solid var(--text-primary);
    margin-bottom: 6px;
  }

  .signature-label {
    font-size: 8pt;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
`;

/**
 * Get attachment and list styles
 * @returns {string} List CSS styles
 */
const getListStyles = () => `
  /* ===== ATTACHMENTS LIST ===== */
  .attachments-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .attachment-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: white;
    border: 1px solid var(--border-light);
    border-radius: 4px;
    margin-bottom: 6px;
  }

  .attachment-item:last-child {
    margin-bottom: 0;
  }

  .attachment-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-subtle);
    border-radius: 4px;
    font-size: 12px;
  }

  .attachment-name {
    flex: 1;
    font-size: 9pt;
    font-weight: 500;
    color: var(--text-primary);
  }

  .attachment-size {
    font-size: 8pt;
    color: var(--text-muted);
  }
`;

/**
 * Get footer styles
 * @returns {string} Footer CSS styles
 */
const getFooterStyles = () => `
  /* ===== DOCUMENT FOOTER ===== */
  .document-footer {
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid var(--border-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-left {
    font-size: 8pt;
    color: var(--text-muted);
  }

  .footer-right {
    font-size: 8pt;
    color: var(--text-muted);
    text-align: right;
  }

  .footer-brand {
    color: var(--primary);
    font-weight: 600;
  }
`;

/**
 * Get print media styles
 * @returns {string} Print CSS styles
 */
const getPrintStyles = () => `
  /* ===== PRINT STYLES ===== */
  @media print {
    body {
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .no-print {
      display: none !important;
    }

    .page-break {
      page-break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }
  }

  @page {
    margin: 0.5in;
    size: letter;
  }
`;

/**
 * Combine all styles into complete stylesheet
 * @returns {string} Complete CSS stylesheet
 */
const getPDFStyles = () => `
  ${getBaseStyles()}
  ${getHeaderStyles()}
  ${getGridStyles()}
  ${getSectionStyles()}
  ${getBadgeStyles()}
  ${getApprovalStyles()}
  ${getListStyles()}
  ${getFooterStyles()}
  ${getPrintStyles()}
`;

// ===== COMPONENT HELPERS =====

/**
 * Generate document header HTML
 * @param {string} docType - Document type label
 * @param {string} docNumber - Document number
 * @param {string} [revision] - Revision number
 * @param {string} [factoryLogoBase64] - Base64 encoded factory logo
 * @returns {string} Header HTML
 */
const generateHeader = (docType, docNumber, revision = null, factoryLogoBase64 = null) => `
  <header class="document-header">
    <div class="header-left">
      ${factoryLogoBase64 ? `<img src="${factoryLogoBase64}" alt="Factory Logo" class="factory-logo" />` : ''}
      <div class="company-info">
        <div class="company-name">${COMPANY_CONFIG.name}</div>
        <div class="company-tagline">${COMPANY_CONFIG.tagline}</div>
      </div>
    </div>
    <div class="document-title-block">
      <div class="document-type">${escapeHTML(docType)}</div>
      <div class="document-number">${escapeHTML(docNumber)}</div>
      ${revision !== null ? `<div class="document-revision">Revision ${revision}</div>` : ''}
    </div>
  </header>
`;

/**
 * Generate document footer HTML
 * @param {string} docNumber - Document number for reference
 * @returns {string} Footer HTML
 */
const generateFooter = (docNumber) => `
  <footer class="document-footer">
    <div class="footer-left">
      <span class="footer-brand">Sunbelt Modular PM System</span> • Generated ${formatPDFDate(new Date().toISOString())}
    </div>
    <div class="footer-right">
      Document: ${escapeHTML(docNumber)}
    </div>
  </footer>
`;

/**
 * Generate info cell HTML
 * @param {string} label - Field label
 * @param {string} value - Field value
 * @param {Object} [options] - Additional options
 * @returns {string} Info cell HTML
 */
const generateInfoCell = (label, value, options = {}) => {
  const classes = ['info-cell'];
  if (options.highlight) classes.push('highlight');
  if (options.fullWidth) classes.push('full-width');
  
  const valueClasses = ['info-value'];
  if (options.large) valueClasses.push('large');
  if (options.mono) valueClasses.push('mono');
  
  return `
    <div class="${classes.join(' ')}">
      <span class="info-label">${escapeHTML(label)}</span>
      <span class="${valueClasses.join(' ')}">${value}</span>
    </div>
  `;
};

/**
 * Get status badge HTML
 * @param {string} status - Status value
 * @returns {string} Badge HTML
 */
const getStatusBadge = (status) => {
  const statusClass = status?.toLowerCase().replace(/\s+/g, '-') || 'pending';
  return `<span class="status-badge status-${statusClass}">${escapeHTML(status || 'N/A')}</span>`;
};

/**
 * Get priority badge HTML
 * @param {string} priority - Priority value
 * @returns {string} Badge HTML
 */
const getPriorityBadge = (priority) => {
  const priorityClass = priority?.toLowerCase() || 'medium';
  return `<span class="priority-badge priority-${priorityClass}">${escapeHTML(priority || 'Medium')}</span>`;
};

/**
 * Generate attachments list HTML
 * @param {Array} attachments - Array of attachment objects
 * @returns {string} Attachments HTML
 */
const generateAttachmentsList = (attachments) => {
  if (!attachments || attachments.length === 0) return '';
  
  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['dwg', 'dxf'].includes(ext)) return '📐';
    return '📎';
  };

  return `
    <div class="section avoid-break">
      <div class="section-header">
        <span class="section-title">Attachments</span>
        <span class="section-badge" style="background: var(--bg-subtle); color: var(--text-secondary);">
          ${attachments.length} file${attachments.length !== 1 ? 's' : ''}
        </span>
      </div>
      <ul class="attachments-list">
        ${attachments.map(att => `
          <li class="attachment-item">
            <span class="attachment-icon">${getFileIcon(att.file_name)}</span>
            <span class="attachment-name">${escapeHTML(att.file_name)}</span>
            ${att.file_size ? `<span class="attachment-size">${formatFileSize(att.file_size)}</span>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  `;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// ===== EXPORT FUNCTIONS =====

/**
 * Export RFI as Professional PDF
 * @param {Object} rfi - RFI object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Array} [attachments] - Array of attachments
 * @param {string} [factoryCode] - Factory code or name for logo
 */
export const exportRFIToPDF = async (rfi, projectName = '', projectNumber = '', attachments = [], factoryCode = '') => {
  const projectDisplay = projectNumber
    ? `${projectNumber}${projectName ? ` — ${projectName}` : ''}`
    : projectName || '—';

  // Load factory logo as base64 for embedding
  const factoryLogoBase64 = await getFactoryLogoBase64(factoryCode);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHTML(rfi.rfi_number)} - ${escapeHTML(rfi.subject)}</title>
      <style>${getPDFStyles()}</style>
    </head>
    <body>
      ${generateHeader('Request for Information', rfi.rfi_number, null, factoryLogoBase64)}

      <!-- Project & Status Info -->
      <div class="info-grid">
        ${generateInfoCell('Project', escapeHTML(projectDisplay), { large: true })}
        ${generateInfoCell('Status', getStatusBadge(rfi.status))}
        ${generateInfoCell('To', escapeHTML(rfi.sent_to || '—'))}
        ${generateInfoCell('From', escapeHTML(rfi.from || 'Sunbelt Modular'))}
        ${generateInfoCell('Date Issued', formatPDFDate(rfi.date_sent || rfi.created_at))}
        ${generateInfoCell('Response Required', formatPDFDate(rfi.due_date))}
        ${rfi.spec_section ? generateInfoCell('Spec Section', escapeHTML(rfi.spec_section), { mono: true }) : ''}
        ${rfi.drawing_reference ? generateInfoCell('Drawing Reference', escapeHTML(rfi.drawing_reference), { mono: true }) : ''}
      </div>

      <!-- Question Section -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">Question / Request for Information</span>
        </div>
        <div class="section-content ${!rfi.question ? 'empty' : ''}">
          ${rfi.question ? escapeHTML(rfi.question) : 'No question provided.'}
        </div>
      </div>

      <!-- Response Section -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">Response</span>
          ${rfi.response_date ? `<span class="section-badge" style="background: var(--success); color: white;">Received ${formatShortDate(rfi.response_date)}</span>` : ''}
        </div>
        <div class="section-content response ${!rfi.answer ? 'empty' : ''}">
          ${rfi.answer ? escapeHTML(rfi.answer) : '(Awaiting Response)'}
        </div>
      </div>

      ${generateAttachmentsList(attachments)}

      <!-- Signature Section -->
      <div class="section avoid-break">
        <div class="signature-grid">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Authorized Signature / Date</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Printed Name / Title</div>
          </div>
        </div>
      </div>

      ${generateFooter(rfi.rfi_number)}
    </body>
    </html>
  `;

  generatePDF(html, `${rfi.rfi_number}.pdf`);
};

/**
 * Export Submittal as Professional PDF
 * @param {Object} submittal - Submittal object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Array} [attachments] - Array of attachments
 */
export const exportSubmittalToPDF = (submittal, projectName = '', projectNumber = '', attachments = []) => {
  const projectDisplay = projectNumber 
    ? `${projectNumber}${projectName ? ` — ${projectName}` : ''}`
    : projectName || '—';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHTML(submittal.submittal_number)} - ${escapeHTML(submittal.title)}</title>
      <style>${getPDFStyles()}</style>
    </head>
    <body>
      ${generateHeader('Submittal', submittal.submittal_number, submittal.revision_number || 0)}
      
      <!-- Project & Submittal Info -->
      <div class="info-grid">
        ${generateInfoCell('Project', escapeHTML(projectDisplay), { large: true })}
        ${generateInfoCell('Status', getStatusBadge(submittal.status))}
        ${generateInfoCell('Submittal Title', escapeHTML(submittal.title || '—'), { fullWidth: true })}
        ${generateInfoCell('Type', escapeHTML(submittal.submittal_type || '—'))}
        ${generateInfoCell('Priority', getPriorityBadge(submittal.priority))}
        ${generateInfoCell('Submitted To', escapeHTML(submittal.sent_to || '—'))}
        ${generateInfoCell('Date Submitted', formatPDFDate(submittal.date_sent || submittal.created_at))}
        ${generateInfoCell('Response Required', formatPDFDate(submittal.due_date))}
        ${generateInfoCell('Response Date', formatPDFDate(submittal.response_date))}
      </div>

      <!-- Specification Details -->
      ${(submittal.spec_section || submittal.manufacturer || submittal.model_number) ? `
      <div class="info-grid three-col" style="margin-top: -10px;">
        ${submittal.spec_section ? generateInfoCell('Spec Section', escapeHTML(submittal.spec_section), { mono: true }) : generateInfoCell('Spec Section', '—')}
        ${submittal.manufacturer ? generateInfoCell('Manufacturer', escapeHTML(submittal.manufacturer)) : generateInfoCell('Manufacturer', '—')}
        ${submittal.model_number ? generateInfoCell('Model Number', escapeHTML(submittal.model_number), { mono: true }) : generateInfoCell('Model Number', '—')}
      </div>
      ` : ''}

      <!-- Description Section -->
      ${submittal.description ? `
      <div class="section">
        <div class="section-header">
          <span class="section-title">Description</span>
        </div>
        <div class="section-content">
          ${escapeHTML(submittal.description)}
        </div>
      </div>
      ` : ''}

      ${generateAttachmentsList(attachments)}

      <!-- Approval Section -->
      <div class="approval-section avoid-break">
        <div class="approval-header">Reviewer Action Required</div>
        <div class="approval-body">
          <div class="approval-options">
            <div class="approval-option">
              <div class="checkbox"></div>
              <span>Approved</span>
            </div>
            <div class="approval-option">
              <div class="checkbox"></div>
              <span>Approved as Noted</span>
            </div>
            <div class="approval-option">
              <div class="checkbox"></div>
              <span>Revise and Resubmit</span>
            </div>
            <div class="approval-option">
              <div class="checkbox"></div>
              <span>Rejected</span>
            </div>
          </div>

          <div class="comments-box">
            <div class="comments-label">Reviewer Comments</div>
            <div class="comments-field">${escapeHTML(submittal.reviewer_comments || '')}</div>
          </div>

          <div class="signature-grid">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">Reviewer Signature / Date</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">Printed Name / Title</div>
            </div>
          </div>
        </div>
      </div>

      ${generateFooter(submittal.submittal_number)}
    </body>
    </html>
  `;

  generatePDF(html, `${submittal.submittal_number}.pdf`);
};

/**
 * Export Task as Professional PDF
 * @param {Object} task - Task object
 * @param {string} [projectName] - Project name
 * @param {string} [projectNumber] - Project number
 * @param {Array} [attachments] - Array of attachments
 */
export const exportTaskToPDF = (task, projectName = '', projectNumber = '', attachments = []) => {
  const projectDisplay = projectNumber 
    ? `${projectNumber}${projectName ? ` — ${projectName}` : ''}`
    : projectName || '—';

  // Determine assignee display
  const assigneeDisplay = task.is_external 
    ? `${task.external_assignee || '—'} (External)`
    : task.assignee?.name || 'Unassigned';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task - ${escapeHTML(task.title)}</title>
      <style>${getPDFStyles()}</style>
    </head>
    <body>
      ${generateHeader('Task Assignment', `TASK-${String(task.id).substring(0, 8).toUpperCase()}`)}
      
      <!-- Task Info -->
      <div class="info-grid">
        ${generateInfoCell('Project', escapeHTML(projectDisplay), { large: true })}
        ${generateInfoCell('Status', getStatusBadge(task.status))}
        ${generateInfoCell('Task Title', escapeHTML(task.title || '—'), { fullWidth: true, large: true })}
        ${generateInfoCell('Assigned To', escapeHTML(assigneeDisplay))}
        ${generateInfoCell('Priority', getPriorityBadge(task.priority))}
        ${generateInfoCell('Start Date', formatPDFDate(task.start_date))}
        ${generateInfoCell('Due Date', formatPDFDate(task.due_date))}
        ${task.milestone?.name ? generateInfoCell('Milestone', escapeHTML(task.milestone.name), { fullWidth: true }) : ''}
      </div>

      <!-- Description Section -->
      ${task.description ? `
      <div class="section">
        <div class="section-header">
          <span class="section-title">Task Description</span>
        </div>
        <div class="section-content">
          ${escapeHTML(task.description)}
        </div>
      </div>
      ` : ''}

      ${generateAttachmentsList(attachments)}

      <!-- Notes Section -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">Notes / Progress Updates</span>
        </div>
        <div class="section-content large empty">
          (Use this space for notes and progress updates)
        </div>
      </div>

      <!-- Completion Signature -->
      <div class="section avoid-break">
        <div class="signature-grid">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Completed By / Date</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Verified By / Date</div>
          </div>
        </div>
      </div>

      ${generateFooter(`TASK-${String(task.id).substring(0, 8).toUpperCase()}`)}
    </body>
    </html>
  `;

  generatePDF(html, `Task_${task.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};

// ===== DEFAULT EXPORT =====

export default {
  exportRFIToPDF,
  exportSubmittalToPDF,
  exportTaskToPDF
};