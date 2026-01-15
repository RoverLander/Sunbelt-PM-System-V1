// ============================================================================
// ScheduleModuleModal.jsx - Schedule a Module Modal
// ============================================================================
// Modal for scheduling or rescheduling a module's production dates.
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Package,
  AlertTriangle,
  Save,
  Zap
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { getModuleStatusColor } from '../../services/modulesService';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-lg)'
  },
  modal: {
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-lg)',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)'
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: 'var(--text-secondary)'
  },
  body: {
    padding: 'var(--space-lg)',
    overflowY: 'auto',
    flex: 1
  },
  moduleInfo: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
    borderLeft: '4px solid'
  },
  moduleSerial: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },
  moduleProject: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '4px'
  },
  formGroup: {
    marginBottom: 'var(--space-lg)'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-sm)'
  },
  input: {
    width: '100%',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    transition: 'border-color 0.15s ease'
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-md)'
  },
  hint: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginTop: 'var(--space-xs)'
  },
  warning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    marginBottom: 'var(--space-lg)'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-md)',
    padding: 'var(--space-lg)',
    borderTop: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)'
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md) var(--space-lg)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  btnSecondary: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)'
  },
  btnPrimary: {
    background: 'var(--sunbelt-orange)',
    border: '1px solid var(--sunbelt-orange)',
    color: 'white'
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScheduleModuleModal({
  module,
  onClose,
  onSchedule,
  isSimMode = false
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const statusColor = module ? getModuleStatusColor(module.status) : '#6366f1';

  // Initialize dates from module
  useEffect(() => {
    if (module) {
      if (module.scheduled_start) {
        setStartDate(module.scheduled_start.split('T')[0]);
      }
      if (module.scheduled_end) {
        setEndDate(module.scheduled_end.split('T')[0]);
      }
    }
  }, [module]);

  const handleSave = async () => {
    if (!startDate) {
      setError('Start date is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isSimMode) {
        // In simulation mode, just call callback without DB write
        onSchedule?.({
          moduleId: module.id,
          startDate,
          endDate: endDate || null
        });
        onClose();
        return;
      }

      // Update module in database
      const { data, error: updateError } = await supabase
        .from('modules')
        .update({
          scheduled_start: startDate,
          scheduled_end: endDate || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', module.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onSchedule?.(data);
      onClose();
    } catch (err) {
      console.error('Error scheduling module:', err);
      setError(err.message || 'Failed to schedule module');
    } finally {
      setSaving(false);
    }
  };

  if (!module) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            <Calendar size={20} />
            Schedule Module
          </h2>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Module Info */}
          <div style={{ ...styles.moduleInfo, borderLeftColor: statusColor }}>
            <div style={styles.moduleSerial}>
              <Package size={16} />
              {module.serial_number}
              {module.is_rush && <Zap size={14} color="#ef4444" />}
            </div>
            <div style={styles.moduleProject}>
              {module.project?.name || 'Unknown Project'}
            </div>
          </div>

          {/* Sim Mode Warning */}
          {isSimMode && (
            <div style={styles.warning}>
              <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Simulation Mode</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Changes will not be saved to the database. Use "Publish" to commit all simulation changes.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              ...styles.warning,
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}>
              <AlertTriangle size={18} color="#ef4444" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Inputs */}
          <div style={styles.inputRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Clock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Start Date *
              </label>
              <input
                type="date"
                style={styles.input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = 'var(--sunbelt-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
              <div style={styles.hint}>When production begins</div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Calendar size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                End Date
              </label>
              <input
                type="date"
                style={styles.input}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                onFocus={(e) => e.target.style.borderColor = 'var(--sunbelt-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
              <div style={styles.hint}>Estimated completion</div>
            </div>
          </div>

          {/* Current Schedule Info */}
          {module.scheduled_start && (
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-tertiary)',
              padding: 'var(--space-md)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <strong>Currently scheduled:</strong>{' '}
              {new Date(module.scheduled_start).toLocaleDateString()}
              {module.scheduled_end && (
                <> to {new Date(module.scheduled_end).toLocaleDateString()}</>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleSave}
            disabled={saving || !startDate}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <Save size={16} />
            {saving ? 'Saving...' : (isSimMode ? 'Apply to Simulation' : 'Save Schedule')}
          </button>
        </div>
      </div>
    </div>
  );
}
