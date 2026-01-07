import React, { useState } from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

function SubmittalLogExport({ submittals, projectName, projectNumber }) {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = () => {
    setExporting(true);

    try {
      // Prepare data for export
      const exportData = submittals.map((sub, index) => ({
        'Submittal #': sub.submittal_number || `SUB-${String(index + 1).padStart(3, '0')}`,
        'Rev': sub.revision_number || 0,
        'Title': sub.title || '',
        'Type': sub.submittal_type || '',
        'Spec Section': sub.spec_section || '',
        'Manufacturer': sub.manufacturer || '',
        'Model Number': sub.model_number || '',
        'Sent To': sub.external_contact_name || sub.sent_to || '',
        'Contact Email': sub.external_contact_email || '',
        'Internal Owner': sub.internal_owner?.name || '',
        'Status': sub.status || 'Pending',
        'Priority': sub.priority || 'Medium',
        'Date Sent': sub.date_sent ? new Date(sub.date_sent).toLocaleDateString() : '',
        'Due Date': sub.due_date ? new Date(sub.due_date).toLocaleDateString() : '',
        'Response Date': sub.response_date ? new Date(sub.response_date).toLocaleDateString() : '',
        'Days Open': sub.days_open || calculateDaysOpen(sub.date_sent, sub.response_date, sub.status),
        'Response Notes': sub.response_notes || '',
        'Description': sub.description || '',
        'Created': sub.created_at ? new Date(sub.created_at).toLocaleDateString() : ''
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 20 },  // Submittal #
        { wch: 5 },   // Rev
        { wch: 35 },  // Title
        { wch: 15 },  // Type
        { wch: 12 },  // Spec Section
        { wch: 18 },  // Manufacturer
        { wch: 15 },  // Model Number
        { wch: 25 },  // Sent To
        { wch: 30 },  // Contact Email
        { wch: 20 },  // Internal Owner
        { wch: 18 },  // Status
        { wch: 10 },  // Priority
        { wch: 12 },  // Date Sent
        { wch: 12 },  // Due Date
        { wch: 14 },  // Response Date
        { wch: 10 },  // Days Open
        { wch: 50 },  // Response Notes
        { wch: 40 },  // Description
        { wch: 12 },  // Created
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Submittal Log');

      // Generate filename with date
      const today = new Date().toISOString().split('T')[0];
      const filename = `${projectNumber}_Submittal_Log_${today}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

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