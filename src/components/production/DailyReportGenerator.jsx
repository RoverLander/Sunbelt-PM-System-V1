// ============================================================================
// DailyReportGenerator.jsx - Daily Report Auto-Generation (PGM-026)
// ============================================================================
// Auto-generates daily production reports with hours, modules, quality,
// and exports to PDF/CSV with optional auto-email.
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  Users,
  Package,
  CheckCircle2,
  AlertTriangle,
  Download,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Printer,
  DollarSign,
  Activity,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  Settings
} from 'lucide-react';
import { generateDailyReport } from '../../services/vpService';
import { format, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths, isToday, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DailyReportGenerator({ factoryId, factoryName: _factoryName }) {
  // State
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exportFormat, setExportFormat] = useState('pdf');
  const [reportType, setReportType] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [showSettings, setShowSettings] = useState(false);
  const [sectionToggles, setSectionToggles] = useState({
    laborDetails: true,
    stationActivity: true,
    qualityControl: true,
    moduleCompletions: true,
    attendanceSummary: true
  });

  // Get date range based on report type
  const getDateRange = useCallback(() => {
    if (reportType === 'weekly') {
      return {
        startDate: startOfWeek(selectedDate, { weekStartsOn: 1 }), // Monday start
        endDate: endOfWeek(selectedDate, { weekStartsOn: 1 })
      };
    } else if (reportType === 'monthly') {
      return {
        startDate: startOfMonth(selectedDate),
        endDate: endOfMonth(selectedDate)
      };
    }
    return { startDate: selectedDate, endDate: selectedDate };
  }, [selectedDate, reportType]);

  // Fetch report
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      if (reportType === 'daily') {
        const { data, error } = await generateDailyReport(factoryId, selectedDate);
        if (error) throw error;
        setReport(data);
      } else {
        // For weekly/monthly, fetch reports for each day and aggregate
        const aggregatedReport = {
          type: reportType,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          labor: {
            workerCount: 0,
            totalHours: 0,
            regularHours: 0,
            overtimeHours: 0,
            totalPay: 0,
            shifts: [],
            uniqueWorkers: new Set()
          },
          production: {
            modulesCompleted: 0,
            assignments: 0,
            stationActivity: {}
          },
          quality: {
            inspections: 0,
            passed: 0,
            failed: 0,
            passRate: 0,
            records: []
          },
          generatedAt: new Date().toISOString()
        };

        // Generate reports for each day in range
        let currentDate = startDate;
        while (currentDate <= endDate) {
          const { data, error } = await generateDailyReport(factoryId, currentDate);
          if (!error && data) {
            // Aggregate labor data
            aggregatedReport.labor.totalHours += data.labor.totalHours || 0;
            aggregatedReport.labor.regularHours += data.labor.regularHours || 0;
            aggregatedReport.labor.overtimeHours += data.labor.overtimeHours || 0;
            aggregatedReport.labor.totalPay += data.labor.totalPay || 0;
            data.labor.shifts?.forEach(s => {
              aggregatedReport.labor.uniqueWorkers.add(s.worker);
              aggregatedReport.labor.shifts.push({ ...s, date: format(currentDate, 'MM/dd') });
            });

            // Aggregate production data
            aggregatedReport.production.modulesCompleted += data.production.modulesCompleted || 0;
            aggregatedReport.production.assignments += data.production.assignments || 0;
            Object.entries(data.production.stationActivity || {}).forEach(([station, d]) => {
              if (!aggregatedReport.production.stationActivity[station]) {
                aggregatedReport.production.stationActivity[station] = { count: 0 };
              }
              aggregatedReport.production.stationActivity[station].count += d.count || 0;
            });

            // Aggregate quality data
            aggregatedReport.quality.inspections += data.quality.inspections || 0;
            aggregatedReport.quality.passed += data.quality.passed || 0;
            aggregatedReport.quality.failed += data.quality.failed || 0;
            data.quality.records?.forEach(r => {
              aggregatedReport.quality.records.push({ ...r, date: format(currentDate, 'MM/dd') });
            });
          }
          currentDate = addDays(currentDate, 1);
        }

        // Calculate final stats
        aggregatedReport.labor.workerCount = aggregatedReport.labor.uniqueWorkers.size;
        delete aggregatedReport.labor.uniqueWorkers; // Remove Set before setting state
        aggregatedReport.quality.passRate = aggregatedReport.quality.inspections > 0
          ? Math.round((aggregatedReport.quality.passed / aggregatedReport.quality.inspections) * 100)
          : 0;

        setReport(aggregatedReport);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId, selectedDate, reportType, getDateRange]);

  useEffect(() => {
    if (factoryId) {
      fetchReport();
    }
  }, [factoryId, fetchReport]);

  // Navigate date based on report type
  const goToPrev = () => {
    if (reportType === 'weekly') {
      setSelectedDate(prev => subWeeks(prev, 1));
    } else if (reportType === 'monthly') {
      setSelectedDate(prev => subMonths(prev, 1));
    } else {
      setSelectedDate(prev => subDays(prev, 1));
    }
  };

  const goToNext = () => {
    const { endDate } = getDateRange();
    if (isSameDay(endDate, new Date()) || endDate > new Date()) return;

    if (reportType === 'weekly') {
      setSelectedDate(prev => addWeeks(prev, 1));
    } else if (reportType === 'monthly') {
      setSelectedDate(prev => addMonths(prev, 1));
    } else {
      setSelectedDate(prev => addDays(prev, 1));
    }
  };

  const goToToday = () => setSelectedDate(new Date());

  // Get date display text
  const getDateDisplayText = () => {
    if (reportType === 'weekly') {
      const { startDate, endDate } = getDateRange();
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    } else if (reportType === 'monthly') {
      return format(selectedDate, 'MMMM yyyy');
    }
    return format(selectedDate, 'EEEE, MMMM d, yyyy');
  };

  // Check if current period includes today
  const isCurrentPeriod = () => {
    const { startDate, endDate } = getDateRange();
    const today = new Date();
    return today >= startDate && today <= endDate;
  };

  // Toggle section
  const toggleSection = (section) => {
    setSectionToggles(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Export report
  const handleExport = () => {
    if (!report) return;

    if (exportFormat === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const rows = [
      ['Daily Production Report'],
      ['Factory', _factoryName || 'Unknown'],
      ['Date', report.date],
      ['Generated', new Date().toISOString()],
      [''],
      ['LABOR SUMMARY'],
      ['Workers Present', report.labor.workerCount],
      ['Total Hours', report.labor.totalHours],
      ['Regular Hours', report.labor.regularHours],
      ['Overtime Hours', report.labor.overtimeHours],
      ['Total Pay', `$${report.labor.totalPay}`],
      [''],
      ['PRODUCTION SUMMARY'],
      ['Modules Completed', report.production.modulesCompleted],
      ['Station Assignments', report.production.assignments],
      [''],
      ['QUALITY SUMMARY'],
      ['Total Inspections', report.quality.inspections],
      ['Passed', report.quality.passed],
      ['Failed', report.quality.failed],
      ['Pass Rate', `${report.quality.passRate}%`],
      [''],
      ['SHIFT DETAILS'],
      ['Worker', 'Title', 'Clock In', 'Clock Out', 'Hours', 'Pay'],
      ...report.labor.shifts.map(s => [
        s.worker,
        s.title || '',
        s.clockIn ? format(parseISO(s.clockIn), 'HH:mm') : '',
        s.clockOut ? format(parseISO(s.clockOut), 'HH:mm') : '',
        s.hours || 0,
        `$${s.pay || 0}`
      ])
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-report-${report.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to PDF (simplified - uses print)
  const exportToPDF = () => {
    window.print();
  };

  // Format time
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
      return format(parseISO(isoString), 'h:mm a');
    } catch {
      return '-';
    }
  };

  // Styles
  const styles = {
    container: {
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-primary)',
      overflow: 'hidden'
    },
    header: {
      padding: 'var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-tertiary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'var(--text-primary)'
    },
    factoryBadge: {
      fontSize: '0.75rem',
      color: 'var(--text-tertiary)',
      background: 'var(--bg-secondary)',
      padding: 'var(--space-xs) var(--space-sm)',
      borderRadius: 'var(--radius-sm)'
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-sm) var(--space-md)',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    exportButton: {
      background: 'var(--sunbelt-orange)',
      borderColor: 'var(--sunbelt-orange)',
      color: 'white'
    },
    select: {
      padding: 'var(--space-sm) var(--space-md)',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      fontSize: '0.875rem',
      cursor: 'pointer'
    },

    // Date navigation
    dateNav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-md)',
      padding: 'var(--space-md) var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-primary)'
    },
    dateNavButton: {
      padding: 'var(--space-xs)',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center'
    },
    dateNavButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    currentDate: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      minWidth: '200px',
      textAlign: 'center'
    },
    todayBadge: {
      marginLeft: 'var(--space-sm)',
      padding: 'var(--space-xs) var(--space-sm)',
      background: 'rgba(34, 197, 94, 0.15)',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: '#22c55e'
    },

    // Report content
    reportContent: {
      padding: 'var(--space-lg)'
    },

    // Summary cards
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 'var(--space-lg)',
      marginBottom: 'var(--space-xl)'
    },
    summaryCard: {
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-lg)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-md)'
    },
    summaryIcon: {
      padding: 'var(--space-sm)',
      borderRadius: 'var(--radius-md)',
      display: 'flex'
    },
    summaryValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: 'var(--text-primary)'
    },
    summaryLabel: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    },

    // Section
    section: {
      marginBottom: 'var(--space-xl)'
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      marginBottom: 'var(--space-md)',
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--text-primary)'
    },

    // Table
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      border: '1px solid var(--border-primary)'
    },
    th: {
      padding: 'var(--space-sm) var(--space-md)',
      textAlign: 'left',
      fontWeight: '600',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-tertiary)'
    },
    td: {
      padding: 'var(--space-sm) var(--space-md)',
      borderBottom: '1px solid var(--border-secondary)',
      fontSize: '0.875rem',
      color: 'var(--text-primary)'
    },

    // Station summary
    stationGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: 'var(--space-md)'
    },
    stationCard: {
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)',
      textAlign: 'center'
    },
    stationName: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      marginBottom: 'var(--space-xs)'
    },
    stationCount: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: 'var(--text-primary)'
    },

    // Empty state
    emptyState: {
      padding: 'var(--space-xxl)',
      textAlign: 'center',
      color: 'var(--text-secondary)'
    },

    // Loading
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px'
    },
    spinner: {
      animation: 'spin 1s linear infinite'
    },

    // Print styles
    printOnly: {
      display: 'none'
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <RefreshCw size={32} color="var(--text-tertiary)" style={styles.spinner} />
        </div>
      </div>
    );
  }

  // Get report title
  const getReportTitle = () => {
    if (reportType === 'weekly') return 'Weekly Production Report';
    if (reportType === 'monthly') return 'Monthly Production Report';
    return 'Daily Production Report';
  };

  return (
    <div style={styles.container} className="daily-report">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <FileText size={24} color="var(--sunbelt-orange)" />
          {getReportTitle()}
          {_factoryName && <span style={styles.factoryBadge}>{_factoryName}</span>}
        </div>
        <div style={styles.headerActions}>
          {/* Report Type Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)',
            overflow: 'hidden'
          }}>
            {['daily', 'weekly', 'monthly'].map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  background: reportType === type ? 'var(--sunbelt-orange)' : 'transparent',
                  color: reportType === type ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: reportType === type ? '600' : '400',
                  textTransform: 'capitalize'
                }}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            style={{
              ...styles.button,
              background: showSettings ? 'var(--sunbelt-orange)' : 'var(--bg-tertiary)',
              color: showSettings ? 'white' : 'var(--text-primary)'
            }}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={16} />
            Sections
          </button>

          <select
            style={styles.select}
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
          </select>
          <button
            style={{ ...styles.button, ...styles.exportButton }}
            onClick={handleExport}
            disabled={!report}
          >
            <Download size={16} />
            Export
          </button>
          <button style={styles.button} onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {/* Section Toggles Panel */}
      {showSettings && (
        <div style={{
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Include in report:
          </span>
          {Object.entries({
            laborDetails: 'Labor Details',
            stationActivity: 'Station Activity',
            qualityControl: 'Quality Control',
            moduleCompletions: 'Module Completions',
            attendanceSummary: 'Attendance Summary'
          }).map(([key, label]) => (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)'
              }}
            >
              <input
                type="checkbox"
                checked={sectionToggles[key]}
                onChange={() => toggleSection(key)}
                style={{ cursor: 'pointer' }}
              />
              {label}
            </label>
          ))}
        </div>
      )}

      {/* Date Navigation */}
      <div style={styles.dateNav}>
        <button style={styles.dateNavButton} onClick={goToPrev}>
          <ChevronLeft size={18} />
        </button>
        <div style={styles.currentDate}>
          {getDateDisplayText()}
          {isCurrentPeriod() && <span style={styles.todayBadge}>{reportType === 'daily' ? 'Today' : 'Current'}</span>}
        </div>
        <button
          style={{
            ...styles.dateNavButton,
            ...(isCurrentPeriod() ? styles.dateNavButtonDisabled : {})
          }}
          onClick={goToNext}
          disabled={isCurrentPeriod()}
        >
          <ChevronRight size={18} />
        </button>
        {!isToday(selectedDate) && (
          <button style={styles.button} onClick={goToToday}>
            Today
          </button>
        )}
      </div>

      {/* Report Content */}
      {report ? (
        <div style={styles.reportContent}>
          {/* Summary Cards */}
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={{ ...styles.summaryIcon, background: 'rgba(59, 130, 246, 0.15)' }}>
                <Users size={20} color="#3b82f6" />
              </div>
              <div>
                <div style={styles.summaryValue}>{report.labor.workerCount}</div>
                <div style={styles.summaryLabel}>Workers Present</div>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={{ ...styles.summaryIcon, background: 'rgba(99, 102, 241, 0.15)' }}>
                <Clock size={20} color="#6366f1" />
              </div>
              <div>
                <div style={styles.summaryValue}>{report.labor.totalHours}</div>
                <div style={styles.summaryLabel}>Total Hours</div>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={{ ...styles.summaryIcon, background: 'rgba(34, 197, 94, 0.15)' }}>
                <Package size={20} color="#22c55e" />
              </div>
              <div>
                <div style={styles.summaryValue}>{report.production.modulesCompleted}</div>
                <div style={styles.summaryLabel}>Modules Completed</div>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={{ ...styles.summaryIcon, background: 'rgba(245, 158, 11, 0.15)' }}>
                <CheckCircle2 size={20} color="#f59e0b" />
              </div>
              <div>
                <div style={styles.summaryValue}>{report.quality.passRate}%</div>
                <div style={styles.summaryLabel}>QC Pass Rate</div>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={{ ...styles.summaryIcon, background: 'rgba(239, 68, 68, 0.15)' }}>
                <DollarSign size={20} color="#ef4444" />
              </div>
              <div>
                <div style={styles.summaryValue}>${report.labor.totalPay}</div>
                <div style={styles.summaryLabel}>Labor Cost</div>
              </div>
            </div>
          </div>

          {/* Labor Details */}
          {sectionToggles.laborDetails && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <Users size={18} color="var(--sunbelt-orange)" />
                Labor Details
                {reportType !== 'daily' && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>({report.labor.shifts.length} records)</span>}
              </div>
              {report.labor.shifts.length > 0 ? (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {reportType !== 'daily' && <th style={styles.th}>Date</th>}
                      <th style={styles.th}>Worker</th>
                      <th style={styles.th}>Title</th>
                      <th style={styles.th}>Clock In</th>
                      <th style={styles.th}>Clock Out</th>
                      <th style={styles.th}>Hours</th>
                      <th style={styles.th}>Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.labor.shifts.map((shift, idx) => (
                      <tr key={idx}>
                        {reportType !== 'daily' && <td style={styles.td}>{shift.date || '-'}</td>}
                        <td style={styles.td}>{shift.worker || '-'}</td>
                        <td style={styles.td}>{shift.title || '-'}</td>
                        <td style={styles.td}>{formatTime(shift.clockIn)}</td>
                        <td style={styles.td}>{formatTime(shift.clockOut)}</td>
                        <td style={styles.td}>{shift.hours || 0}</td>
                        <td style={styles.td}>${shift.pay || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No shifts recorded for this {reportType === 'daily' ? 'day' : 'period'}
                </p>
              )}
            </div>
          )}

          {/* Station Activity */}
          {sectionToggles.stationActivity && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <Activity size={18} color="var(--sunbelt-orange)" />
                Station Activity
              </div>
              {Object.keys(report.production.stationActivity).length > 0 ? (
                <div style={styles.stationGrid}>
                  {Object.entries(report.production.stationActivity).map(([station, data]) => (
                  <div key={station} style={styles.stationCard}>
                    <div style={styles.stationName}>{station}</div>
                    <div style={styles.stationCount}>{data.count}</div>
                  </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No station activity recorded for this {reportType === 'daily' ? 'day' : 'period'}
                </p>
              )}
            </div>
          )}

          {/* Quality Summary */}
          {sectionToggles.qualityControl && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <CheckCircle2 size={18} color="var(--sunbelt-orange)" />
                Quality Control
                {reportType !== 'daily' && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>({report.quality.records.length} inspections)</span>}
              </div>
              {report.quality.records.length > 0 ? (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {reportType !== 'daily' && <th style={styles.th}>Date</th>}
                      <th style={styles.th}>Module</th>
                      <th style={styles.th}>Station</th>
                      <th style={styles.th}>Result</th>
                      <th style={styles.th}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.quality.records.map((record, idx) => (
                      <tr key={idx}>
                        {reportType !== 'daily' && <td style={styles.td}>{record.date || '-'}</td>}
                        <td style={styles.td}>{record.module || '-'}</td>
                        <td style={styles.td}>{record.station || '-'}</td>
                        <td style={styles.td}>
                          <span style={{
                            padding: 'var(--space-xs) var(--space-sm)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            background: record.passed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: record.passed ? '#22c55e' : '#ef4444'
                          }}>
                            {record.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td style={styles.td}>{record.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No QC inspections recorded for this {reportType === 'daily' ? 'day' : 'period'}
                </p>
              )}
            </div>
          )}

          {/* Generated Timestamp */}
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-lg)',
            borderTop: '1px solid var(--border-primary)',
            marginTop: 'var(--space-lg)',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)'
          }}>
            Report generated: {format(parseISO(report.generatedAt), 'MMMM d, yyyy h:mm a')}
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <FileText size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
          <p>No data available for this date</p>
        </div>
      )}

      {/* CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media print {
          .daily-report {
            border: none !important;
            box-shadow: none !important;
          }
          .daily-report button,
          .daily-report select {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
