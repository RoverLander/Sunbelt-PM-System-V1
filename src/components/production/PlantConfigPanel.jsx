// ============================================================================
// PlantConfigPanel.jsx - Plant Configuration Panel (PGM-023)
// ============================================================================
// Configuration panel for Plant GM to customize their factory settings
// including time/pay, efficiency module toggles, and line defaults.
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Clock,
  DollarSign,
  Activity,
  Calendar,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Target,
  Users,
  Gauge,
  Package,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { getPlantConfig, updatePlantConfig } from '../../services/vpService';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlantConfigPanel({ factoryId, factoryName, onSave }) {
  // State
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    time: true,
    efficiency: true,
    line: false,
    calendar: false
  });
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  // Fetch config
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getPlantConfig(factoryId);
      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Error fetching plant config:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId]);

  useEffect(() => {
    if (factoryId) {
      fetchConfig();
    }
  }, [factoryId, fetchConfig]);

  // Handle time setting change
  const handleTimeChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      time_settings: {
        ...prev.time_settings,
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  // Handle efficiency module toggle
  const handleModuleToggle = (moduleName) => {
    setConfig(prev => ({
      ...prev,
      efficiency_modules: {
        ...prev.efficiency_modules,
        [moduleName]: !prev.efficiency_modules[moduleName]
      }
    }));
    setHasChanges(true);
  };

  // Handle line sim default change
  const handleLineSimChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      line_sim_defaults: {
        ...prev.line_sim_defaults,
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  // Handle calendar setting change
  const handleCalendarChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      calendar_settings: {
        ...prev.calendar_settings,
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  // Toggle work day
  const toggleWorkDay = (day) => {
    const currentDays = config?.calendar_settings?.work_days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    handleCalendarChange('work_days', newDays);
  };

  // Save config
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const { error } = await updatePlantConfig(factoryId, {
        time_settings: config.time_settings,
        efficiency_modules: config.efficiency_modules,
        line_sim_defaults: config.line_sim_defaults,
        calendar_settings: config.calendar_settings
      });

      if (error) throw error;

      setSaveStatus('success');
      setHasChanges(false);
      onSave?.(config);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
    factoryName: {
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      fontWeight: 'normal'
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    },
    saveButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-sm) var(--space-lg)',
      background: hasChanges ? 'var(--sunbelt-orange)' : 'var(--bg-tertiary)',
      border: `1px solid ${hasChanges ? 'var(--sunbelt-orange)' : 'var(--border-primary)'}`,
      borderRadius: 'var(--radius-md)',
      color: hasChanges ? 'white' : 'var(--text-secondary)',
      cursor: hasChanges ? 'pointer' : 'not-allowed',
      fontSize: '0.875rem',
      fontWeight: '500',
      opacity: saving ? 0.7 : 1
    },
    statusBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-xs) var(--space-sm)',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    successBadge: {
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#22c55e'
    },
    errorBadge: {
      background: 'rgba(239, 68, 68, 0.15)',
      color: '#ef4444'
    },

    // Section
    section: {
      borderBottom: '1px solid var(--border-primary)'
    },
    sectionHeader: {
      padding: 'var(--space-md) var(--space-lg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      background: 'var(--bg-primary)',
      transition: 'background 0.15s ease'
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      fontWeight: '600',
      color: 'var(--text-primary)',
      fontSize: '0.9375rem'
    },
    sectionContent: {
      padding: 'var(--space-lg)',
      background: 'var(--bg-secondary)'
    },

    // Form elements
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 'var(--space-lg)'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)'
    },
    label: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    input: {
      padding: 'var(--space-sm) var(--space-md)',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      fontSize: '0.875rem'
    },
    inputSmall: {
      width: '100px'
    },
    hint: {
      fontSize: '0.75rem',
      color: 'var(--text-tertiary)',
      marginTop: 'var(--space-xs)'
    },

    // Toggle grid for modules
    toggleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 'var(--space-md)'
    },
    toggleCard: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-md)',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-primary)',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    toggleCardActive: {
      borderColor: 'var(--sunbelt-orange)',
      background: 'rgba(255, 107, 53, 0.05)'
    },
    toggleLabel: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'var(--text-primary)'
    },
    toggleDescription: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      marginTop: '2px'
    },
    toggle: {
      cursor: 'pointer'
    },

    // Work days
    workDaysGrid: {
      display: 'flex',
      gap: 'var(--space-sm)',
      flexWrap: 'wrap'
    },
    dayButton: {
      padding: 'var(--space-sm) var(--space-md)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-primary)',
      background: 'var(--bg-tertiary)',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.15s ease'
    },
    dayButtonActive: {
      background: 'var(--sunbelt-orange)',
      borderColor: 'var(--sunbelt-orange)',
      color: 'white'
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

  // Efficiency module definitions
  const efficiencyModules = [
    { key: 'takt_time_tracker', label: 'Takt Time Tracker', desc: 'Compare actual vs expected station times' },
    { key: 'queue_time_monitor', label: 'Queue Time Monitor', desc: 'Track delays between stations' },
    { key: 'kaizen_board', label: 'Kaizen Board', desc: 'Employee improvement suggestions' },
    { key: 'defect_fix_timer', label: 'Defect Fix Timer', desc: 'Track defect-to-resolution time' },
    { key: 'material_flow_trace', label: 'Material Flow Trace', desc: 'Track material usage vs BOM' },
    { key: 'crew_utilization_heatmap', label: 'Utilization Heatmap', desc: 'Worker activity grid' },
    { key: 'line_balancing_sim', label: 'Line Balancing Sim', desc: 'What-if capacity planning' },
    { key: 'visual_load_board', label: 'Visual Load Board', desc: 'Daily goal and pace display' },
    { key: 'five_s_audit', label: '5S Audit', desc: 'Workplace organization checks' },
    { key: 'oee_calculator', label: 'OEE Calculator', desc: 'Overall Equipment Effectiveness' },
    { key: 'cross_training_matrix', label: 'Cross-Training Matrix', desc: 'Worker certification grid' },
    { key: 'safety_micro_check', label: 'Safety Micro-Check', desc: 'Pre-shift safety confirmation' }
  ];

  // Work days
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  if (!config) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <AlertTriangle size={32} color="var(--text-tertiary)" />
          <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>
            Failed to load configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <Settings size={24} color="var(--sunbelt-orange)" />
          Plant Configuration
          {factoryName && <span style={styles.factoryName}>• {factoryName}</span>}
        </div>
        <div style={styles.headerActions}>
          {saveStatus === 'success' && (
            <div style={{ ...styles.statusBadge, ...styles.successBadge }}>
              <CheckCircle2 size={14} />
              Saved
            </div>
          )}
          {saveStatus === 'error' && (
            <div style={{ ...styles.statusBadge, ...styles.errorBadge }}>
              <AlertTriangle size={14} />
              Save failed
            </div>
          )}
          <button
            style={styles.saveButton}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? <RefreshCw size={16} style={styles.spinner} /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Time & Pay Settings */}
      <div style={styles.section}>
        <div
          style={styles.sectionHeader}
          onClick={() => toggleSection('time')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
        >
          <div style={styles.sectionTitle}>
            <Clock size={18} color="var(--sunbelt-orange)" />
            Time & Pay Settings
          </div>
          {expandedSections.time ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>

        {expandedSections.time && (
          <div style={styles.sectionContent}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Shift Start</label>
                <input
                  type="time"
                  style={styles.input}
                  value={config.time_settings?.shift_start || '06:00'}
                  onChange={(e) => handleTimeChange('shift_start', e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Shift End</label>
                <input
                  type="time"
                  style={styles.input}
                  value={config.time_settings?.shift_end || '14:30'}
                  onChange={(e) => handleTimeChange('shift_end', e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Break Minutes</label>
                <input
                  type="number"
                  style={{ ...styles.input, ...styles.inputSmall }}
                  value={config.time_settings?.break_minutes || 30}
                  onChange={(e) => handleTimeChange('break_minutes', parseInt(e.target.value))}
                  min={0}
                  max={60}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Lunch Minutes</label>
                <input
                  type="number"
                  style={{ ...styles.input, ...styles.inputSmall }}
                  value={config.time_settings?.lunch_minutes || 30}
                  onChange={(e) => handleTimeChange('lunch_minutes', parseInt(e.target.value))}
                  min={0}
                  max={60}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Daily OT Threshold (hrs)</label>
                <input
                  type="number"
                  style={{ ...styles.input, ...styles.inputSmall }}
                  value={config.time_settings?.ot_threshold_daily || 8}
                  onChange={(e) => handleTimeChange('ot_threshold_daily', parseInt(e.target.value))}
                  min={1}
                  max={24}
                />
                <span style={styles.hint}>Hours before overtime rate</span>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Weekly OT Threshold (hrs)</label>
                <input
                  type="number"
                  style={{ ...styles.input, ...styles.inputSmall }}
                  value={config.time_settings?.ot_threshold_weekly || 40}
                  onChange={(e) => handleTimeChange('ot_threshold_weekly', parseInt(e.target.value))}
                  min={1}
                  max={168}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Double-Time Threshold (hrs)</label>
                <input
                  type="number"
                  style={{ ...styles.input, ...styles.inputSmall }}
                  value={config.time_settings?.double_time_threshold || 12}
                  onChange={(e) => handleTimeChange('double_time_threshold', parseInt(e.target.value))}
                  min={1}
                  max={24}
                />
                <span style={styles.hint}>Daily hours for 2x rate</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Efficiency Modules */}
      <div style={styles.section}>
        <div
          style={styles.sectionHeader}
          onClick={() => toggleSection('efficiency')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
        >
          <div style={styles.sectionTitle}>
            <Activity size={18} color="var(--sunbelt-orange)" />
            Efficiency Modules
          </div>
          {expandedSections.efficiency ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>

        {expandedSections.efficiency && (
          <div style={styles.sectionContent}>
            <div style={styles.toggleGrid}>
              {efficiencyModules.map(mod => {
                const isEnabled = config.efficiency_modules?.[mod.key] || false;
                return (
                  <div
                    key={mod.key}
                    style={{
                      ...styles.toggleCard,
                      ...(isEnabled ? styles.toggleCardActive : {})
                    }}
                    onClick={() => handleModuleToggle(mod.key)}
                  >
                    <div>
                      <div style={styles.toggleLabel}>{mod.label}</div>
                      <div style={styles.toggleDescription}>{mod.desc}</div>
                    </div>
                    {isEnabled ? (
                      <ToggleRight size={28} color="var(--sunbelt-orange)" style={styles.toggle} />
                    ) : (
                      <ToggleLeft size={28} color="var(--text-tertiary)" style={styles.toggle} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Line Simulation Defaults */}
      <div style={styles.section}>
        <div
          style={styles.sectionHeader}
          onClick={() => toggleSection('line')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
        >
          <div style={styles.sectionTitle}>
            <Sliders size={18} color="var(--sunbelt-orange)" />
            Line Simulation Defaults
          </div>
          {expandedSections.line ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>

        {expandedSections.line && (
          <div style={styles.sectionContent}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Target Throughput / Day</label>
                <input
                  type="number"
                  style={{ ...styles.input, ...styles.inputSmall }}
                  value={config.line_sim_defaults?.target_throughput_per_day || 2}
                  onChange={(e) => handleLineSimChange('target_throughput_per_day', parseInt(e.target.value))}
                  min={1}
                  max={20}
                />
                <span style={styles.hint}>Modules completed per day</span>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Max WIP Per Station</label>
                <input
                  type="number"
                  style={{ ...styles.input, ...styles.inputSmall }}
                  value={config.line_sim_defaults?.max_wip_per_station || 3}
                  onChange={(e) => handleLineSimChange('max_wip_per_station', parseInt(e.target.value))}
                  min={1}
                  max={10}
                />
                <span style={styles.hint}>Work-in-progress limit</span>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bottleneck Threshold (hrs)</label>
                <input
                  type="number"
                  style={{ ...styles.input, ...styles.inputSmall }}
                  value={config.line_sim_defaults?.bottleneck_threshold_hours || 4}
                  onChange={(e) => handleLineSimChange('bottleneck_threshold_hours', parseInt(e.target.value))}
                  min={1}
                  max={24}
                />
                <span style={styles.hint}>Flag stations over this</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Settings */}
      <div style={{ ...styles.section, borderBottom: 'none' }}>
        <div
          style={styles.sectionHeader}
          onClick={() => toggleSection('calendar')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
        >
          <div style={styles.sectionTitle}>
            <Calendar size={18} color="var(--sunbelt-orange)" />
            Calendar Settings
          </div>
          {expandedSections.calendar ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>

        {expandedSections.calendar && (
          <div style={styles.sectionContent}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Work Days</label>
              <div style={styles.workDaysGrid}>
                {allDays.map(day => {
                  const isActive = (config.calendar_settings?.work_days || []).includes(day);
                  return (
                    <button
                      key={day}
                      style={{
                        ...styles.dayButton,
                        ...(isActive ? styles.dayButtonActive : {})
                      }}
                      onClick={() => toggleWorkDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ ...styles.formGroup, marginTop: 'var(--space-lg)' }}>
              <label style={styles.label}>Auto-Schedule</label>
              <div
                style={{
                  ...styles.toggleCard,
                  ...(config.calendar_settings?.auto_schedule_enabled ? styles.toggleCardActive : {}),
                  width: 'fit-content'
                }}
                onClick={() => handleCalendarChange('auto_schedule_enabled', !config.calendar_settings?.auto_schedule_enabled)}
              >
                <div style={{ marginRight: 'var(--space-lg)' }}>
                  <div style={styles.toggleLabel}>Enable Auto-Scheduling</div>
                  <div style={styles.toggleDescription}>Automatically schedule unassigned modules</div>
                </div>
                {config.calendar_settings?.auto_schedule_enabled ? (
                  <ToggleRight size={28} color="var(--sunbelt-orange)" style={styles.toggle} />
                ) : (
                  <ToggleLeft size={28} color="var(--text-tertiary)" style={styles.toggle} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
