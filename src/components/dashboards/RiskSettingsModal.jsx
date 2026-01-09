// ============================================================================
// RiskSettingsModal Component
// ============================================================================
// Modal for configuring risk assessment thresholds.
// Settings are saved to localStorage and used by DirectorDashboard.
//
// CONFIGURABLE THRESHOLDS:
// - Overdue threshold: Days past due before flagging
// - Stalled days: No activity threshold
// - Upcoming deadline warning: Days before due date to warn
// - Critical deadline: Days before due date for critical status
// - At-risk item count: Number of overdue items to mark project "at risk"
// ============================================================================

import React, { useState } from 'react';
import {
  X,
  Settings,
  AlertTriangle,
  Clock,
  Calendar,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================
const DEFAULT_SETTINGS = {
  overdueThreshold: 0,
  stalledDays: 14,
  upcomingDeadlineDays: 7,
  criticalDeadlineDays: 3,
  atRiskItemCount: 3
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function RiskSettingsModal({ isOpen, onClose, settings, onSave }) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [formData, setFormData] = useState({ ...settings });
  const [errors, setErrors] = useState({});

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_SETTINGS });
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};

    if (formData.overdueThreshold < 0) {
      newErrors.overdueThreshold = 'Must be 0 or greater';
    }
    if (formData.stalledDays < 1) {
      newErrors.stalledDays = 'Must be at least 1 day';
    }
    if (formData.upcomingDeadlineDays < 1) {
      newErrors.upcomingDeadlineDays = 'Must be at least 1 day';
    }
    if (formData.criticalDeadlineDays < 1) {
      newErrors.criticalDeadlineDays = 'Must be at least 1 day';
    }
    if (formData.criticalDeadlineDays > formData.upcomingDeadlineDays) {
      newErrors.criticalDeadlineDays = 'Must be less than upcoming deadline days';
    }
    if (formData.atRiskItemCount < 1) {
      newErrors.atRiskItemCount = 'Must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-lg)'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
        }}
      >
        {/* ================================================================ */}
        {/* HEADER                                                          */}
        {/* ================================================================ */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-lg)',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Settings size={24} style={{ color: 'var(--sunbelt-orange)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Risk Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* ================================================================ */}
        {/* FORM                                                            */}
        {/* ================================================================ */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: 'var(--space-lg)' }}>
            {/* Info Banner */}
            <div style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              padding: 'var(--space-md)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-xl)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)'
            }}>
              <HelpCircle size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
              <span>
                Configure how projects are evaluated for risk status. These settings affect the dashboard metrics and health indicators.
              </span>
            </div>

            {/* ===== OVERDUE THRESHOLD ===== */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                <Clock size={16} style={{ color: '#ef4444' }} />
                <label style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Overdue Threshold
                </label>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 var(--space-sm) 0' }}>
                Days past due date before an item is flagged as overdue
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.overdueThreshold}
                  onChange={(e) => handleChange('overdueThreshold', e.target.value)}
                  style={{
                    width: '80px',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${errors.overdueThreshold ? '#ef4444' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>days</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                  (0 = flag same day as due date)
                </span>
              </div>
              {errors.overdueThreshold && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.overdueThreshold}</p>
              )}
            </div>

            {/* ===== STALLED DAYS ===== */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                <label style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Stalled Project Threshold
                </label>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 var(--space-sm) 0' }}>
                Mark project as stalled if no activity for this many days
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.stalledDays}
                  onChange={(e) => handleChange('stalledDays', e.target.value)}
                  style={{
                    width: '80px',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${errors.stalledDays ? '#ef4444' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>days</span>
              </div>
              {errors.stalledDays && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.stalledDays}</p>
              )}
            </div>

            {/* ===== UPCOMING DEADLINE DAYS ===== */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                <Calendar size={16} style={{ color: 'var(--sunbelt-orange)' }} />
                <label style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Upcoming Deadline Warning
                </label>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 var(--space-sm) 0' }}>
                Show deadline warnings for items due within this many days
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.upcomingDeadlineDays}
                  onChange={(e) => handleChange('upcomingDeadlineDays', e.target.value)}
                  style={{
                    width: '80px',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${errors.upcomingDeadlineDays ? '#ef4444' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>days</span>
              </div>
              {errors.upcomingDeadlineDays && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.upcomingDeadlineDays}</p>
              )}
            </div>

            {/* ===== CRITICAL DEADLINE DAYS ===== */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                <AlertCircle size={16} style={{ color: '#ef4444' }} />
                <label style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Critical Deadline Threshold
                </label>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 var(--space-sm) 0' }}>
                Mark as critical if delivery is within this many days
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={formData.criticalDeadlineDays}
                  onChange={(e) => handleChange('criticalDeadlineDays', e.target.value)}
                  style={{
                    width: '80px',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${errors.criticalDeadlineDays ? '#ef4444' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>days</span>
              </div>
              {errors.criticalDeadlineDays && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.criticalDeadlineDays}</p>
              )}
            </div>

            {/* ===== AT RISK ITEM COUNT ===== */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                <label style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  At-Risk Item Count
                </label>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 var(--space-sm) 0' }}>
                Number of overdue items needed to mark a project as "Critical"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.atRiskItemCount}
                  onChange={(e) => handleChange('atRiskItemCount', e.target.value)}
                  style={{
                    width: '80px',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    border: `1px solid ${errors.atRiskItemCount ? '#ef4444' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>items</span>
              </div>
              {errors.atRiskItemCount && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.atRiskItemCount}</p>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* FOOTER                                                          */}
          {/* ================================================================ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-lg)',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-primary)'
            }}
          >
            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '10px 16px',
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <RotateCcw size={16} />
              Reset to Defaults
            </button>

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RiskSettingsModal;