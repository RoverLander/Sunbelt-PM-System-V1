import React, { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

function RFILogExport({ rfis, projectName, projectNumber }) {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = () => {
    setExporting(true);

    try {
      // Prepare data for export
      const exportData = rfis.map((rfi, index) => ({
        'RFI #': rfi.rfi_number || `RFI-${String(index + 1).padStart(3, '0')}`,
        'Subject': rfi.subject || '',
        'Question': rfi.question || '',
        'Sent To': rfi.external_contact_name || rfi.sent_to || '',
        'Contact Email': rfi.external_contact_email || '',
        'Internal Owner': rfi.internal_owner?.name || '',
        'Status': rfi.status || 'Open',
        'Priority': rfi.priority || 'Medium',
        'Date Sent': rfi.date_sent ? new Date(rfi.date_sent).toLocaleDateString() : '',
        'Due Date': rfi.due_date ? new Date(rfi.due_date).toLocaleDateString() : '',
        'Response Date': rfi.response_date ? new Date(rfi.response_date).toLocaleDateString() : '',
        'Days Open': rfi.days_open || calculateDaysOpen(rfi.date_sent, rfi.response_date, rfi.status),
        'Response Notes': rfi.response_notes || '',
        'Created': rfi.created_at ? new Date(rfi.created_at).toLocaleDateString() : ''
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 18 },  // RFI #
        { wch: 35 },  // Subject
        { wch: 50 },  // Question
        { wch: 25 },  // Sent To
        { wch: 30 },  // Contact Email
        { wch: 20 },  // Internal Owner
        { wch: 12 },  // Status
        { wch: 10 },  // Priority
        { wch: 12 },  // Date Sent
        { wch: 12 },  // Due Date
        { wch: 14 },  // Response Date
        { wch: 10 },  // Days Open
        { wch: 50 },  // Response Notes
        { wch: 12 },  // Created
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'RFI Log');

      // Generate filename with date
      const today = new Date().toISOString().split('T')[0];
      const filename = `${projectNumber}_RFI_Log_${today}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

    } catch (error) {
      console.error('Error exporting RFI log:', error);
      alert('Error exporting RFI log. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const calculateDaysOpen = (dateSent, responseDate, status) => {
    if (!dateSent) return 0;
    const sent = new Date(dateSent);
    const end = (status === 'Closed' && responseDate) ? new Date(responseDate) : new Date();
    const diffTime = Math.abs(end - sent);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <button
      onClick={exportToExcel}
      disabled={exporting || rfis.length === 0}
      className="btn btn-secondary"
      style={{ 
        padding: '8px 16px', 
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)'
      }}
      title={rfis.length === 0 ? 'No RFIs to export' : 'Export RFI Log to Excel'}
    >
      {exporting ? (
        <>
          <div className="loading-spinner" style={{ width: '16px', height: '16px', margin: 0 }}></div>
          Exporting...
        </>
      ) : (
        <>
          <Download size={16} />
          Export Log
        </>
      )}
    </button>
  );
}

export default RFILogExport;