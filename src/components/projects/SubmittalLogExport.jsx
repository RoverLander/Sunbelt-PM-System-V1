import React, { useState } from 'react';
import { Download } from 'lucide-react';
import ExcelJS from 'exceljs';

function SubmittalLogExport({ submittals, projectName, projectNumber }) {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = async () => {
    setExporting(true);

    try {
      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Submittal Log');

      // Define columns with headers and widths
      worksheet.columns = [
        { header: 'Submittal #', key: 'submittalNum', width: 20 },
        { header: 'Rev', key: 'rev', width: 5 },
        { header: 'Title', key: 'title', width: 35 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Spec Section', key: 'specSection', width: 12 },
        { header: 'Manufacturer', key: 'manufacturer', width: 18 },
        { header: 'Model Number', key: 'modelNumber', width: 15 },
        { header: 'Sent To', key: 'sentTo', width: 25 },
        { header: 'Contact Email', key: 'contactEmail', width: 30 },
        { header: 'Internal Owner', key: 'internalOwner', width: 20 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Priority', key: 'priority', width: 10 },
        { header: 'Date Sent', key: 'dateSent', width: 12 },
        { header: 'Due Date', key: 'dueDate', width: 12 },
        { header: 'Response Date', key: 'responseDate', width: 14 },
        { header: 'Days Open', key: 'daysOpen', width: 10 },
        { header: 'Response Notes', key: 'responseNotes', width: 50 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Created', key: 'created', width: 12 },
      ];

      // Add data rows
      submittals.forEach((sub, index) => {
        worksheet.addRow({
          submittalNum: sub.submittal_number || `SUB-${String(index + 1).padStart(3, '0')}`,
          rev: sub.revision_number || 0,
          title: sub.title || '',
          type: sub.submittal_type || '',
          specSection: sub.spec_section || '',
          manufacturer: sub.manufacturer || '',
          modelNumber: sub.model_number || '',
          sentTo: sub.external_contact_name || sub.sent_to || '',
          contactEmail: sub.external_contact_email || '',
          internalOwner: sub.internal_owner?.name || '',
          status: sub.status || 'Pending',
          priority: sub.priority || 'Medium',
          dateSent: sub.date_sent ? new Date(sub.date_sent).toLocaleDateString() : '',
          dueDate: sub.due_date ? new Date(sub.due_date).toLocaleDateString() : '',
          responseDate: sub.response_date ? new Date(sub.response_date).toLocaleDateString() : '',
          daysOpen: sub.days_open || calculateDaysOpen(sub.date_sent, sub.response_date, sub.status),
          responseNotes: sub.response_notes || '',
          description: sub.description || '',
          created: sub.created_at ? new Date(sub.created_at).toLocaleDateString() : ''
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };

      // Generate filename with date
      const today = new Date().toISOString().split('T')[0];
      const filename = `${projectNumber}_Submittal_Log_${today}.xlsx`;

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
      console.error('Error exporting Submittal log:', error);
      alert('Error exporting Submittal log. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const calculateDaysOpen = (dateSent, responseDate, status) => {
    if (!dateSent) return 0;
    const sent = new Date(dateSent);
    const end = (status === 'Approved' || status === 'Rejected') && responseDate 
      ? new Date(responseDate) 
      : new Date();
    const diffTime = Math.abs(end - sent);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <button
      onClick={exportToExcel}
      disabled={exporting || submittals.length === 0}
      className="btn btn-secondary"
      style={{ 
        padding: '8px 16px', 
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)'
      }}
      title={submittals.length === 0 ? 'No submittals to export' : 'Export Submittal Log to Excel'}
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

export default SubmittalLogExport;