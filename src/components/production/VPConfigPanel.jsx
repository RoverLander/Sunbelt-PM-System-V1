// ============================================================================
// VPConfigPanel.jsx - VP Configuration Panel (PGM-024)
// ============================================================================
// VP-level configuration for weights, baselines, and aggregate settings
// across all factories with live preview of changes.
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Settings,
  Sliders,
  Target,
  Gauge,
  Factory,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  BarChart3,
  TrendingUp,
  Eye
} from 'lucide-react';
import { getVPConfig, bulkUpdateVPSettings } from '../../services/vpService';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VPConfigPanel({ onSave }) {
  // State
  const [factories, setFactories] = useState([]);
  const [originalConfig, setOriginalConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  // Preview mode state (reserved for future live preview feature)
  const [_previewMode, _setPreviewMode] = useState(false);
  const [_aggregatePreview, _setAggregatePreview] = useState(null);

  // Fetch config
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getVPConfig();
      if (error) throw error;

      // Transform data for editing
      const factoryConfigs = (data || []).map(item => ({
        id: item.id,
        factoryId: item.factory_id,
        code: item.factories?.code || 'Unknown',
        name: item.factories?.short_name || item.factories?.full_name || 'Unknown',
        vpSettings: item.vp_settings || {
          weight_in_aggregate: 1.0,
          target_oee: 0.75,
          target_on_time_delivery: 0.90
        }
      }));

      setFactories(factoryConfigs);
      setOriginalConfig(JSON.parse(JSON.stringify(factoryConfigs)));
    } catch (error) {
      console.error('Error fetching VP config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(factories) !== JSON.stringify(originalConfig);
    setHasChanges(changed);
  }, [factories, originalConfig]);

  // Calculate aggregate preview
  const calculatedPreview = useMemo(() => {
    if (!factories.length) return null;

    let totalWeight = 0;
    let weightedOEE = 0;
    let weightedDelivery = 0;

    factories.forEach(f => {
      const weight = f.vpSettings?.weight_in_aggregate || 1.0;
      const oee = f.vpSettings?.target_oee || 0.75;
      const delivery = f.vpSettings?.target_on_time_delivery || 0.90;

      totalWeight += weight;
      weightedOEE += oee * weight;
      weightedDelivery += delivery * weight;
    });

    return {
      avgOEE: totalWeight > 0 ? Math.round((weightedOEE / totalWeight) * 100) : 0,
      avgDelivery: totalWeight > 0 ? Math.round((weightedDelivery / totalWeight) * 100) : 0,
      totalWeight: Math.round(totalWeight * 100) / 100
    };
  }, [factories]);

  // Handle setting change
  const handleSettingChange = (factoryId, key, value) => {
    setFactories(prev => prev.map(f => {
      if (f.factoryId === factoryId) {
        return {
          ...f,
          vpSettings: {
            ...f.vpSettings,
            [key]: value
          }
        };
      }
      return f;
    }));
  };

  // Apply preset to all factories
  const applyPreset = (preset) => {
    setFactories(prev => prev.map(f => ({
      ...f,
      vpSettings: {
        ...f.vpSettings,
        target_oee: preset.oee,
        target_on_time_delivery: preset.delivery
      }
    })));
  };

  // Reset weights to equal
  const resetWeightsEqual = () => {
    setFactories(prev => prev.map(f => ({
      ...f,
      vpSettings: {
        ...f.vpSettings,
        weight_in_aggregate: 1.0
      }
    })));
  };

  // Save config
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const updates = factories.map(f => ({
        factoryId: f.factoryId,
        vpSettings: f.vpSettings
      }));

      const { error } = await bulkUpdateVPSettings(updates);

      if (error) throw error;

      setSaveStatus('success');
      setHasChanges(false);
      setOriginalConfig(JSON.parse(JSON.stringify(factories)));
      onSave?.(factories);

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving VP config:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Discard changes
  const handleDiscard = () => {
    setFactories(JSON.parse(JSON.stringify(originalConfig)));
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
    saveButton: {
      background: hasChanges ? 'var(--sunbelt-orange)' : 'var(--bg-tertiary)',
      borderColor: hasChanges ? 'var(--sunbelt-orange)' : 'var(--border-primary)',
      color: hasChanges ? 'white' : 'var(--text-secondary)',
      cursor: hasChanges ? 'pointer' : 'not-allowed',
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

    // Preview panel
    previewPanel: {
      padding: 'var(--space-lg)',
      background: 'rgba(99, 102, 241, 0.05)',
      borderBottom: '1px solid var(--border-primary)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 'var(--space-lg)'
    },
    previewCard: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    },
    previewIcon: {
      padding: 'var(--space-sm)',
      borderRadius: 'var(--radius-md)',
      display: 'flex'
    },
    previewValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: 'var(--text-primary)'
    },
    previewLabel: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    },

    // Presets
    presetsBar: {
      padding: 'var(--space-md) var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      flexWrap: 'wrap'
    },
    presetLabel: {
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      fontWeight: '500'
    },
    presetButton: {
      padding: 'var(--space-xs) var(--space-md)',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      fontSize: '0.75rem',
      fontWeight: '500',
      transition: 'all 0.15s ease'
    },

    // Factory list
    factoryList: {
      maxHeight: '500px',
      overflow: 'auto'
    },
    factoryRow: {
      padding: 'var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)',
      display: 'grid',
      gridTemplateColumns: '200px 1fr 1fr 1fr',
      gap: 'var(--space-lg)',
      alignItems: 'center'
    },
    factoryInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    factoryName: {
      fontWeight: '600',
      color: 'var(--text-primary)'
    },
    factoryCode: {
      fontSize: '0.75rem',
      color: 'var(--text-tertiary)',
      fontFamily: 'var(--font-mono)'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)'
    },
    label: {
      fontSize: '0.75rem',
      fontWeight: '500',
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
      fontSize: '0.875rem',
      width: '100px'
    },
    sliderContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    },
    slider: {
      flex: 1,
      WebkitAppearance: 'none',
      height: '6px',
      borderRadius: '3px',
      background: 'var(--bg-tertiary)',
      cursor: 'pointer'
    },
    sliderValue: {
      fontWeight: '600',
      color: 'var(--text-primary)',
      minWidth: '50px',
      textAlign: 'right'
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

  // Presets
  const presets = [
    { name: 'Conservative', oee: 0.65, delivery: 0.85 },
    { name: 'Standard', oee: 0.75, delivery: 0.90 },
    { name: 'Aggressive', oee: 0.85, delivery: 0.95 },
    { name: 'World Class', oee: 0.90, delivery: 0.98 }
  ];

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
          <Sliders size={24} color="var(--sunbelt-orange)" />
          VP Configuration - Weights & Baselines
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
          {hasChanges && (
            <button style={styles.button} onClick={handleDiscard}>
              Discard
            </button>
          )}
          <button
            style={{ ...styles.button, ...styles.saveButton }}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? <RefreshCw size={16} style={styles.spinner} /> : <Save size={16} />}
            Save & Recalculate
          </button>
        </div>
      </div>

      {/* Live Preview */}
      {calculatedPreview && (
        <div style={styles.previewPanel}>
          <div style={styles.previewCard}>
            <div style={{ ...styles.previewIcon, background: 'rgba(99, 102, 241, 0.15)' }}>
              <Eye size={20} color="#6366f1" />
            </div>
            <div>
              <div style={styles.previewLabel}>Preview</div>
              <div style={{ ...styles.previewValue, fontSize: '1rem', color: 'var(--text-secondary)' }}>
                Live calculation
              </div>
            </div>
          </div>
          <div style={styles.previewCard}>
            <div style={{ ...styles.previewIcon, background: 'rgba(34, 197, 94, 0.15)' }}>
              <Gauge size={20} color="#22c55e" />
            </div>
            <div>
              <div style={styles.previewValue}>{calculatedPreview.avgOEE}%</div>
              <div style={styles.previewLabel}>Fleet Target OEE</div>
            </div>
          </div>
          <div style={styles.previewCard}>
            <div style={{ ...styles.previewIcon, background: 'rgba(59, 130, 246, 0.15)' }}>
              <Target size={20} color="#3b82f6" />
            </div>
            <div>
              <div style={styles.previewValue}>{calculatedPreview.avgDelivery}%</div>
              <div style={styles.previewLabel}>Fleet Target Delivery</div>
            </div>
          </div>
          <div style={styles.previewCard}>
            <div style={{ ...styles.previewIcon, background: 'rgba(245, 158, 11, 0.15)' }}>
              <BarChart3 size={20} color="#f59e0b" />
            </div>
            <div>
              <div style={styles.previewValue}>{calculatedPreview.totalWeight}</div>
              <div style={styles.previewLabel}>Total Weight</div>
            </div>
          </div>
        </div>
      )}

      {/* Presets Bar */}
      <div style={styles.presetsBar}>
        <span style={styles.presetLabel}>Apply Preset:</span>
        {presets.map(preset => (
          <button
            key={preset.name}
            style={styles.presetButton}
            onClick={() => applyPreset(preset)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.borderColor = 'var(--border-primary)';
            }}
          >
            {preset.name}
          </button>
        ))}
        <span style={{ ...styles.presetLabel, marginLeft: 'auto' }}>|</span>
        <button
          style={styles.presetButton}
          onClick={resetWeightsEqual}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-tertiary)';
            e.currentTarget.style.borderColor = 'var(--border-primary)';
          }}
        >
          Reset Weights to 1.0
        </button>
      </div>

      {/* Factory List Header */}
      <div style={{ ...styles.factoryRow, background: 'var(--bg-tertiary)', fontWeight: '600' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Factory
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Weight in Aggregate
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Target OEE
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Target On-Time Delivery
        </div>
      </div>

      {/* Factory List */}
      <div style={styles.factoryList}>
        {factories.map(factory => (
          <div key={factory.factoryId} style={styles.factoryRow}>
            <div style={styles.factoryInfo}>
              <div style={styles.factoryName}>{factory.name}</div>
              <div style={styles.factoryCode}>{factory.code}</div>
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.sliderContainer}>
                <input
                  type="range"
                  style={styles.slider}
                  min="0"
                  max="3"
                  step="0.1"
                  value={factory.vpSettings?.weight_in_aggregate || 1.0}
                  onChange={(e) => handleSettingChange(factory.factoryId, 'weight_in_aggregate', parseFloat(e.target.value))}
                />
                <span style={styles.sliderValue}>
                  {(factory.vpSettings?.weight_in_aggregate || 1.0).toFixed(1)}
                </span>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.sliderContainer}>
                <input
                  type="range"
                  style={styles.slider}
                  min="0.5"
                  max="1"
                  step="0.01"
                  value={factory.vpSettings?.target_oee || 0.75}
                  onChange={(e) => handleSettingChange(factory.factoryId, 'target_oee', parseFloat(e.target.value))}
                />
                <span style={styles.sliderValue}>
                  {Math.round((factory.vpSettings?.target_oee || 0.75) * 100)}%
                </span>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.sliderContainer}>
                <input
                  type="range"
                  style={styles.slider}
                  min="0.7"
                  max="1"
                  step="0.01"
                  value={factory.vpSettings?.target_on_time_delivery || 0.90}
                  onChange={(e) => handleSettingChange(factory.factoryId, 'target_on_time_delivery', parseFloat(e.target.value))}
                />
                <span style={styles.sliderValue}>
                  {Math.round((factory.vpSettings?.target_on_time_delivery || 0.90) * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {factories.length === 0 && (
        <div style={{ padding: 'var(--space-xxl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Factory size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
          <p>No factories configured</p>
        </div>
      )}

      {/* CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--sunbelt-orange);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--sunbelt-orange);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
