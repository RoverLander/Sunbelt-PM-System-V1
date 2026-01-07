/**
 * PDF Export Utility
 * Generates professional PDF forms for RFIs, Submittals, and Tasks
 * Uses browser print functionality for maximum compatibility
 */

/**
 * Format date for PDF display
 */
 const formatPDFDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Generate and download PDF by opening print dialog
 */
const generatePDF = (htmlContent, filename) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};

/**
 * Common CSS styles for PDF documents
 */
const getPDFStyles = () => `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #1a1a1a;
    padding: 0.5in;
    max-width: 8.5in;
    margin: 0 auto;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #ff6b35;
    padding-bottom: 15px;
    margin-bottom: 20px;
  }
  
  .logo-section h1 {
    font-size: 24pt;
    font-weight: 700;
    color: #ff6b35;
    margin-bottom: 4px;
  }
  
  .logo-section p {
    font-size: 9pt;
    color: #666;
  }
  
  .document-type {
    text-align: right;
  }
  
  .document-type h2 {
    font-size: 18pt;
    font-weight: 700;
    color: #333;
    margin-bottom: 8px;
  }
  
  .document-number {
    font-size: 14pt;
    font-weight: 600;
    color: #ff6b35;
    background: #fff5f0;
    padding: 8px 16px;
    border-radius: 4px;
    display: inline-block;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
    background: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #e9ecef;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
  }
  
  .info-item.full-width {
    grid-column: 1 / -1;
  }
  
  .info-label {
    font-size: 8pt;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  
  .info-value {
    font-size: 11pt;
    font-weight: 500;
    color: #1a1a1a;
  }
  
  .section {
    margin-bottom: 20px;
  }
  
  .section-title {
    font-size: 11pt;
    font-weight: 700;
    color: #333;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #ff6b35;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }
  
  .section-content {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 15px;
    min-height: 80px;
    white-space: pre-wrap;
  }
  
  .response-section {
    background: #f0f9ff;
    border: 1px solid #0ea5e9;
  }
  
  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 9pt;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-open { background: #fff5f0; color: #ff6b35; }
  .status-answered { background: #f0fdf4; color: #16a34a; }
  .status-closed { background: #f1f5f9; color: #64748b; }
  .status-pending { background: #f1f5f9; color: #64748b; }
  .status-submitted { background: #fff5f0; color: #ff6b35; }
  .status-approved { background: #f0fdf4; color: #16a34a; }
  .status-rejected { background: #fef2f2; color: #dc2626; }
  
  .approval-section {
    margin-top: 30px;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    padding: 20px;
  }
  
  .approval-title {
    font-size: 11pt;
    font-weight: 700;
    margin-bottom: 15px;
  }
  
  .approval-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .approval-option {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .checkbox {
    width: 16px;
    height: 16px;
    border: 2px solid #333;
    border-radius: 3px;
  }
  
  .signature-line {
    margin-top: 30px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
  
  .signature-field {
    border-top: 1px solid #333;
    padding-top: 8px;
  }
  
  .signature-label {
    font-size: 9pt;
    color: #666;
  }
  
  .attachments-list {
    list-style: none;
    padding: 0;
  }
  
  .attachments-list li {
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 4px;
    margin-bottom: 6px;
    font-size: 10pt;
  }
  
  .footer {
    margin-top: 40px;
    padding-top: 15px;
    border-top: 1px solid #e9ecef;
    font-size: 8pt;
    color: #666;
    text-align: center;
  }
  
  @media print {
    body {
      padding: 0;
    }
    
    .no-print {
      display: none;
    }
  }
`;

/**
 * Export RFI as PDF
 */
export const exportRFIToPDF = (rfi, projectName = '', projectNumber = '', attachments = []) => {
  const statusClass = rfi.status?.toLowerCase().replace(' ', '-') || 'open';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${rfi.rfi_number} - ${rfi.subject}</title>
      <style>${getPDFStyles()}</style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <h1>SUNBELT MODULAR</h1>
          <p>Modular Building Solutions</p>
        </div>
        <div class="document-type">
          <h2>REQUEST FOR INFORMATION</h2>
          <div class="document-number">${rfi.rfi_number}</div>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Project</span>
          <span class="info-value">${projectNumber ? `${projectNumber} - ${projectName}` : projectName || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Status</span>
          <span class="info-value"><span class="status-badge status-${statusClass}">${rfi.status}</span></span>
        </div>
        <div class="info-item">
          <span class="info-label">To</span>
          <span class="info-value">${rfi.sent_to || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">From</span>
          <span class="info-value">${rfi.from || 'Sunbelt Modular'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date Sent</span>
          <span class="info-value">${formatPDFDate(rfi.date_sent || rfi.created_at)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Response Due</span>
          <span class="info-value">${formatPDFDate(rfi.due_date)}</span>
        </div>
        ${rfi.spec_section ? `
        <div class="info-item">
          <span class="info-label">Spec Section</span>
          <span class="info-value">${rfi.spec_section}</span>
        </div>
        ` : ''}
        ${rfi.drawing_reference ? `
        <div class="info-item">
          <span class="info-label">Drawing Reference</span>
          <span class="info-value">${rfi.drawing_reference}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="section">
        <div class="section-title">Question / Request</div>
        <div class="section-content">${rfi.question || 'No question provided.'}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Response</div>
        <div class="section-content response-section">${rfi.answer || '(Awaiting Response)'}</div>
      </div>
      
      ${attachments.length > 0 ? `
      <div class="section">
        <div class="section-title">Attachments</div>
        <ul class="attachments-list">
          ${attachments.map(att => `<li>📎 ${att.file_name}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div class="signature-line">
        <div class="signature-field">
          <div class="signature-label">Signature / Date</div>
        </div>
        <div class="signature-field">
          <div class="signature-label">Printed Name / Title</div>
        </div>
      </div>
      
      <div class="footer">
        <p>Generated from Sunbelt Modular PM System • ${formatPDFDate(new Date().toISOString())}</p>
      </div>
    </body>
    </html>
  `;

  generatePDF(html, `${rfi.rfi_number}.pdf`);
};

/**
 * Export Submittal as PDF
 */
export const exportSubmittalToPDF = (submittal, projectName = '', projectNumber = '', attachments = []) => {
  const statusClass = submittal.status?.toLowerCase().replace(' ', '-') || 'pending';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${submittal.submittal_number} - ${submittal.title}</title>
      <style>${getPDFStyles()}</style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <h1>SUNBELT MODULAR</h1>
          <p>Modular Building Solutions</p>
        </div>
        <div class="document-type">
          <h2>SUBMITTAL</h2>
          <div class="document-number">${submittal.submittal_number}</div>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Project</span>
          <span class="info-value">${projectNumber ? `${projectNumber} - ${projectName}` : projectName || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Status</span>
          <span class="info-value"><span class="status-badge status-${statusClass}">${submittal.status}</span></span>
        </div>
        <div class="info-item full-width">
          <span class="info-label">Submittal Title</span>
          <span class="info-value">${submittal.title}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Type</span>
          <span class="info-value">${submittal.submittal_type}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Revision</span>
          <span class="info-value">${submittal.revision_number || 0}</span>
        </div>
        <div class="info-item">
          <span class="info-label">To</span>
          <span class="info-value">${submittal.sent_to || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">From</span>
          <span class="info-value">${submittal.from || 'Sunbelt Modular'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date Submitted</span>
          <span class="info-value">${formatPDFDate(submittal.date_submitted || submittal.created_at)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Response Due</span>
          <span class="info-value">${formatPDFDate(submittal.due_date)}</span>
        </div>
        ${submittal.spec_section ? `
        <div class="info-item">
          <span class="info-label">Spec Section</span>
          <span class="info-value">${submittal.spec_section}</span>
        </div>
        ` : ''}
        ${submittal.manufacturer ? `
        <div class="info-item">
          <span class="info-label">Manufacturer</span>
          <span class="info-value">${submittal.manufacturer}</span>
        </div>
        ` : ''}
        ${submittal.model_number ? `
        <div class="info-item">
          <span class="info-label">Model Number</span>
          <span class="info-value">${submittal.model_number}</span>
        </div>
        ` : ''}
      </div>
      
      ${submittal.description ? `
      <div class="section">
        <div class="section-title">Description</div>
        <div class="section-content">${submittal.description}</div>
      </div>
      ` : ''}
      
      ${attachments.length > 0 ? `
      <div class="section">
        <div class="section-title">Attachments</div>
        <ul class="attachments-list">
          ${attachments.map(att => `<li>📎 ${att.file_name}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div class="approval-section">
        <div class="approval-title">REVIEWER ACTION REQUIRED</div>
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
        
        <div class="section">
          <div class="section-title">Reviewer Comments</div>
          <div class="section-content" style="min-height: 60px;">${submittal.reviewer_comments || ''}</div>
        </div>
        
        <div class="signature-line">
          <div class="signature-field">
            <div class="signature-label">Reviewer Signature / Date</div>
          </div>
          <div class="signature-field">
            <div class="signature-label">Printed Name / Title</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>Generated from Sunbelt Modular PM System • ${formatPDFDate(new Date().toISOString())}</p>
      </div>
    </body>
    </html>
  `;

  generatePDF(html, `${submittal.submittal_number}.pdf`);
};

/**
 * Export Task as PDF
 */
export const exportTaskToPDF = (task, projectName = '', projectNumber = '', attachments = []) => {
  const statusClass = task.status?.toLowerCase().replace(' ', '-') || 'not-started';
  const priorityColors = {
    'Low': '#64748b',
    'Medium': '#f59e0b',
    'High': '#ef4444',
    'Critical': '#dc2626'
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Task - ${task.title}</title>
      <style>
        ${getPDFStyles()}
        .priority-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 9pt;
          font-weight: 600;
          color: white;
          background: ${priorityColors[task.priority] || '#64748b'};
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <h1>SUNBELT MODULAR</h1>
          <p>Modular Building Solutions</p>
        </div>
        <div class="document-type">
          <h2>TASK ASSIGNMENT</h2>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-item full-width">
          <span class="info-label">Task Title</span>
          <span class="info-value" style="font-size: 14pt; font-weight: 700;">${task.title}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Project</span>
          <span class="info-value">${projectNumber ? `${projectNumber} - ${projectName}` : projectName || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Status</span>
          <span class="info-value"><span class="status-badge status-${statusClass}">${task.status}</span></span>
        </div>
        <div class="info-item">
          <span class="info-label">Priority</span>
          <span class="info-value"><span class="priority-badge">${task.priority || 'Medium'}</span></span>
        </div>
        <div class="info-item">
          <span class="info-label">Assigned To</span>
          <span class="info-value">${task.is_external ? `${task.external_assignee} (External)` : task.assignee?.name || 'Unassigned'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Start Date</span>
          <span class="info-value">${formatPDFDate(task.start_date)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Due Date</span>
          <span class="info-value">${formatPDFDate(task.due_date)}</span>
        </div>
      </div>
      
      ${task.description ? `
      <div class="section">
        <div class="section-title">Description</div>
        <div class="section-content">${task.description}</div>
      </div>
      ` : ''}
      
      ${attachments.length > 0 ? `
      <div class="section">
        <div class="section-title">Attachments</div>
        <ul class="attachments-list">
          ${attachments.map(att => `<li>📎 ${att.file_name}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">Notes / Updates</div>
        <div class="section-content" style="min-height: 100px;"></div>
      </div>
      
      <div class="footer">
        <p>Generated from Sunbelt Modular PM System • ${formatPDFDate(new Date().toISOString())}</p>
      </div>
    </body>
    </html>
  `;

  generatePDF(html, `Task_${task.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};

export default {
  exportRFIToPDF,
  exportSubmittalToPDF,
  exportTaskToPDF
};