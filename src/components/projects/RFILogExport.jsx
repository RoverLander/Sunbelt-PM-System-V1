import React, { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';

function RFILogExport({ rfis, projectName, projectNumber }) {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = async () => {
    setExporting(true);

    try {
      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('RFI Log');

      // Define columns with headers and widths
      worksheet.columns = [
        { header: 'RFI #', key: 'rfiNum', width: 18 },
        { header: 'Subject', key: 'subject', width: 35 },
        { header: 'Question', key: 'question', width: 50 },
        { header: 'Sent To', key: 'sentTo', width: 25 },
        { header: 'Contact Email', key: 'contactEmail', width: 30 },
        { header: 'Internal Owner', key: 'internalOwner', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Priority', key: 'priority', width: 10 },
        { header: 'Date Sent', key: 'dateSent', width: 12 },
        { header: 'Due Date', key: 'dueDate', width: 12 },
        { header: 'Response Date', key: 'responseDate', width: 14 },
        { header: 'Days Open', key: 'daysOpen', width: 10 },
        { header: 'Response Notes', key: 'responseNotes', width: 50 },
        { header: 'Created', key: 'created', width: 12 },
      ];

      // Add data rows
      rfis.forEach((rfi, index) => {
        worksheet.addRow({
          rfiNum: rfi.rfi_number || `RFI-${String(index + 1).padStart(3, '0')}`,
          subject: rfi.subject || '',
          question: rfi.question || '',
          sentTo: rfi.external_contact_name || rfi.sent_to || '',
          contactEmail: rfi.external_contact_email || '',
          internalOwner: rfi.internal_owner?.name || '',
          status: rfi.status || 'Open',
          priority: rfi.priority || 'Medium',
          dateSent: rfi.date_sent ? new Date(rfi.date_sent).toLocaleDateString() : '',
          dueDate: rfi.due_date ? new Date(rfi.due_date).toLocaleDateString() : '',
          responseDate: rfi.response_date ? new Date(rfi.response_date).toLocaleDateString() : '',
          daysOpen: rfi.days_open || calculateDaysOpen(rfi.date_sent, rfi.response_date, rfi.status),
          responseNotes: rfi.response_notes || '',
          created: rfi.created_at ? new Date(rfi.created_at).toLocaleDateString() : ''
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };

      // Generate filename with date
      const today = new Date().toISOString().split('T')[0];
      const filename = `${projectNumber}_RFI_Log_${today}.xlsx`;

      // Save file - create blob and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

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