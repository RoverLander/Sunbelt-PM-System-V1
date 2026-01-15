// ============================================================================
// PipelineAutoSchedule.jsx - Pipeline Auto-Schedule (PGM-025)
// ============================================================================
// Automatic scheduling tool that suggests and applies optimal schedule
// based on capacity, deadlines, and priorities.
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Zap,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Play,
  Pause,
  Package,
  ArrowRight,
  Info,
  Filter,
  X
} from 'lucide-react';
import { getAutoScheduleSuggestions, applyAutoSchedule, getPipelineData } from '../../services/vpService';
import { format, parseISO, differenceInDays } from 'date-fns';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PipelineAutoSchedule({ factoryId, factoryName, onScheduleApplied }) {
  // State
  const [suggestions, setSuggestions] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [applyStatus, setApplyStatus] = useState(null);
  const [view, setView] = useState('suggestions'); // suggestions, pipeline

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [suggestionsResult, pipelineResult] = await Promise.all([
        getAutoScheduleSuggestions(factoryId),
        getPipelineData([factoryId])
      ]);

      setSuggestions(suggestionsResult.data || []);
      setPipeline(pipelineResult.data || []);
      setSelectedSuggestions(suggestionsResult.data?.map(s => s.module.id) || []);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId]);

  useEffect(() => {
    if (factoryId) {
      fetchData();
    }
  }, [factoryId, fetchData]);

  // Toggle suggestion selection
  const toggleSuggestion = (moduleId) => {
    setSelectedSuggestions(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Select/deselect all
  const toggleAll = () => {
    if (selectedSuggestions.length === suggestions.length) {
      setSelectedSuggestions([]);
    } else {
      setSelectedSuggestions(suggestions.map(s => s.module.id));
    }
  };

  // Apply selected suggestions
  const handleApply = async () => {
    if (selectedSuggestions.length === 0) return;

    setApplying(true);
    setApplyStatus(null);

    try {
      const selectedItems = suggestions.filter(s =>
        selectedSuggestions.includes(s.module.id)
      );

      const { data, error } = await applyAutoSchedule(factoryId, selectedItems);

      if (error) throw error;

      setApplyStatus({
        type: 'success',
        message: `Successfully scheduled ${data.appliedCount} modules`
      });

      // Refresh data
      await fetchData();
      onScheduleApplied?.(data);

      // Clear status after 5 seconds
      setTimeout(() => setApplyStatus(null), 5000);
    } catch (error) {
      console.error('Error applying schedule:', error);
      setApplyStatus({
        type: 'error',
        message: 'Failed to apply schedule'
      });
    } finally {
      setApplying(false);
    }
  };

  // Get priority color (reserved for future urgency visualization)
  const _getPriorityColor = (suggestion) => {
    if (!suggestion.module.projects?.target_completion) return 'var(--text-secondary)';

    const daysUntilDue = differenceInDays(
      parseISO(suggestion.module.projects.target_completion),
      new Date()
    );

    if (daysUntilDue < 7) return '#ef4444';
    if (daysUntilDue < 14) return '#f59e0b';
    return '#22c55e';
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
    applyButton: {
      background: 'var(--sunbelt-orange)',
      borderColor: 'var(--sunbelt-orange)',
      color: 'white'
    },
    applyButtonDisabled: {
      background: 'var(--bg-tertiary)',
      borderColor: 'var(--border-primary)',
      color: 'var(--text-secondary)',
      cursor: 'not-allowed'
    },

    // Status banner
    statusBanner: {
      padding: 'var(--space-md) var(--space-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      borderBottom: '1px solid var(--border-primary)'
    },
    successBanner: {
      background: 'rgba(34, 197, 94, 0.1)'
    },
    errorBanner: {
      background: 'rgba(239, 68, 68, 0.1)'
    },

    // View tabs
    tabs: {
      display: 'flex',
      gap: 'var(--space-xs)',
      padding: 'var(--space-md) var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-primary)'
    },
    tab: {
      padding: 'var(--space-sm) var(--space-md)',
      background: 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    tabActive: {
      background: 'var(--bg-tertiary)',
      color: 'var(--text-primary)'
    },

    // Stats bar
    statsBar: {
      display: 'flex',
      gap: 'var(--space-xl)',
      padding: 'var(--space-md) var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-primary)'
    },
    stat: {
      display: 'flex',
      flexDirection: 'column'
    },
    statValue: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: 'var(--text-primary)'
    },
    statLabel: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    },

    // Suggestion list
    suggestionList: {
      maxHeight: '500px',
      overflow: 'auto'
    },
    selectAllRow: {
      padding: 'var(--space-md) var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      background: 'var(--bg-tertiary)'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      borderRadius: 'var(--radius-sm)',
      border: '2px solid var(--border-primary)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s ease'
    },
    checkboxChecked: {
      background: 'var(--sunbelt-orange)',
      borderColor: 'var(--sunbelt-orange)'
    },
    suggestionRow: {
      padding: 'var(--space-md) var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto auto',
      gap: 'var(--space-lg)',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'background 0.15s ease'
    },
    moduleInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    moduleSerial: {
      fontWeight: '600',
      color: 'var(--text-primary)'
    },
    projectName: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    },
    scheduleInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    },
    dateChip: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-xs) var(--space-sm)',
      background: 'rgba(34, 197, 94, 0.15)',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: '#22c55e'
    },
    reasonText: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      maxWidth: '200px'
    },

    // Pipeline view
    pipelineTable: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: 'var(--space-md)',
      textAlign: 'left',
      fontWeight: '600',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-tertiary)'
    },
    td: {
      padding: 'var(--space-md)',
      borderBottom: '1px solid var(--border-primary)',
      fontSize: '0.875rem',
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
      minHeight: '300px'
    },
    spinner: {
      animation: 'spin 1s linear infinite'
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <Zap size={24} color="var(--sunbelt-orange)" />
          Auto-Schedule
          {factoryName && <span style={styles.factoryBadge}>{factoryName}</span>}
        </div>
        <div style={styles.headerActions}>
          <button style={styles.button} onClick={fetchData}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            style={{
              ...styles.button,
              ...(selectedSuggestions.length > 0 ? styles.applyButton : styles.applyButtonDisabled)
            }}
            onClick={handleApply}
            disabled={selectedSuggestions.length === 0 || applying}
          >
            {applying ? <RefreshCw size={16} style={styles.spinner} /> : <Play size={16} />}
            Apply ({selectedSuggestions.length})
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {applyStatus && (
        <div
          style={{
            ...styles.statusBanner,
            ...(applyStatus.type === 'success' ? styles.successBanner : styles.errorBanner)
          }}
        >
          {applyStatus.type === 'success' ? (
            <CheckCircle2 size={18} color="#22c55e" />
          ) : (
            <AlertTriangle size={18} color="#ef4444" />
          )}
          <span style={{ flex: 1 }}>{applyStatus.message}</span>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setApplyStatus(null)}
          >
            <X size={16} color="var(--text-secondary)" />
          </button>
        </div>
      )}

      {/* View Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(view === 'suggestions' ? styles.tabActive : {}) }}
          onClick={() => setView('suggestions')}
        >
          Suggestions ({suggestions.length})
        </button>
        <button
          style={{ ...styles.tab, ...(view === 'pipeline' ? styles.tabActive : {}) }}
          onClick={() => setView('pipeline')}
        >
          Pipeline ({pipeline.length})
        </button>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <div style={styles.statValue}>{suggestions.length}</div>
          <div style={styles.statLabel}>Unscheduled Modules</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statValue}>{selectedSuggestions.length}</div>
          <div style={styles.statLabel}>Selected to Schedule</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statValue}>{pipeline.length}</div>
          <div style={styles.statLabel}>Projects in Pipeline</div>
        </div>
      </div>

      {/* Suggestions View */}
      {view === 'suggestions' && (
        <>
          {suggestions.length > 0 ? (
            <div style={styles.suggestionList}>
              {/* Select All Row */}
              <div style={styles.selectAllRow}>
                <div
                  style={{
                    ...styles.checkbox,
                    ...(selectedSuggestions.length === suggestions.length ? styles.checkboxChecked : {})
                  }}
                  onClick={toggleAll}
                >
                  {selectedSuggestions.length === suggestions.length && (
                    <CheckCircle2 size={12} color="white" />
                  )}
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {selectedSuggestions.length === suggestions.length ? 'Deselect All' : 'Select All'}
                </span>
              </div>

              {/* Suggestion Rows */}
              {suggestions.map(suggestion => {
                const isSelected = selectedSuggestions.includes(suggestion.module.id);
                return (
                  <div
                    key={suggestion.module.id}
                    style={styles.suggestionRow}
                    onClick={() => toggleSuggestion(suggestion.module.id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div
                      style={{
                        ...styles.checkbox,
                        ...(isSelected ? styles.checkboxChecked : {})
                      }}
                    >
                      {isSelected && <CheckCircle2 size={12} color="white" />}
                    </div>

                    <div style={styles.moduleInfo}>
                      <div style={styles.moduleSerial}>
                        {suggestion.module.serial_number}
                      </div>
                      <div style={styles.projectName}>
                        {suggestion.module.projects?.name || 'Unknown Project'}
                      </div>
                    </div>

                    <div style={styles.scheduleInfo}>
                      <ArrowRight size={16} color="var(--text-tertiary)" />
                      <div style={styles.dateChip}>
                        <Calendar size={12} />
                        {suggestion.suggestedDate}
                      </div>
                    </div>

                    <div style={styles.reasonText}>
                      {suggestion.reason}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <CheckCircle2 size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
              <p>All modules are scheduled</p>
              <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-sm)' }}>
                No unscheduled modules found for this factory
              </p>
            </div>
          )}
        </>
      )}

      {/* Pipeline View */}
      {view === 'pipeline' && (
        <>
          {pipeline.length > 0 ? (
            <div style={{ overflow: 'auto', maxHeight: '500px' }}>
              <table style={styles.pipelineTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>Project</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Modules</th>
                    <th style={styles.th}>Target Date</th>
                    <th style={styles.th}>Contract Value</th>
                  </tr>
                </thead>
                <tbody>
                  {pipeline.map(project => (
                    <tr key={project.id}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '600' }}>{project.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {project.project_number}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          padding: 'var(--space-xs) var(--space-sm)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: project.status === 'In Progress' ? 'rgba(34, 197, 94, 0.15)' :
                            project.status === 'Planning' ? 'rgba(59, 130, 246, 0.15)' :
                              'rgba(245, 158, 11, 0.15)',
                          color: project.status === 'In Progress' ? '#22c55e' :
                            project.status === 'Planning' ? '#3b82f6' : '#f59e0b'
                        }}>
                          {project.status}
                        </span>
                      </td>
                      <td style={styles.td}>{project.module_count || 0}</td>
                      <td style={styles.td}>
                        {project.target_completion
                          ? format(parseISO(project.target_completion), 'MMM d, yyyy')
                          : '-'
                        }
                      </td>
                      <td style={styles.td}>
                        {project.contract_value
                          ? `$${(project.contract_value / 1000).toFixed(0)}K`
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Package size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
              <p>No projects in pipeline</p>
            </div>
          )}
        </>
      )}

      {/* CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
