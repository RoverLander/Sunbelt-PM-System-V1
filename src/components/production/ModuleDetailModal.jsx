// ============================================================================
// ModuleDetailModal.jsx - Module Detail View Modal
// ============================================================================
// Shows detailed information about a production module including:
// - Module specifications and status
// - Production timeline and station history
// - Associated project info
// - QC records and issues
// - Action menu for GM overrides
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Truck,
  FileText,
  History,
  Tag,
  Zap,
  Pause,
  RotateCcw,
  Trash2,
  ChevronDown,
  Building2,
  Ruler
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { getModuleById, getModuleStatusColor, updateModuleStatus } from '../../services/modulesService';
import { getStationTemplates } from '../../services/stationService';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-lg)'
  },
  modal: {
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 'var(--space-lg) var(--space-xl)',
    borderBottom: '1px solid var(--border-color)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-md)'
  },
  moduleIcon: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  statusBadge: {
    fontSize: '0.75rem',
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
    fontWeight: '500',
    marginTop: 'var(--space-sm)',
    display: 'inline-block'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 'var(--space-sm)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
  },
  actionsBtn: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    position: 'relative'
  },
  actionsDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 'var(--space-xs)',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    minWidth: '180px',
    zIndex: 10
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    transition: 'background 0.15s ease'
  },
  actionItemDanger: {
    color: '#ef4444'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--space-xl)'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)'
  },
  infoCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)'
  },
  infoLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)'
  },
  infoValue: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  section: {
    marginBottom: 'var(--space-xl)'
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-md)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },
  timeline: {
    position: 'relative',
    paddingLeft: 'var(--space-xl)'
  },
  timelineLine: {
    position: 'absolute',
    left: '9px',
    top: '8px',
    bottom: '8px',
    width: '2px',
    background: 'var(--border-color)'
  },
  timelineItem: {
    position: 'relative',
    paddingBottom: 'var(--space-md)'
  },
  timelineDot: {
    position: 'absolute',
    left: '-25px',
    top: '4px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid',
    background: 'var(--bg-primary)'
  },
  timelineContent: {
    fontSize: '0.875rem'
  },
  timelineStation: {
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  timelineTime: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)'
  },
  projectLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  projectIcon: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--sunbelt-orange)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  projectInfo: {
    flex: 1
  },
  projectName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  projectNumber: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  rushBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    background: '#ef4444',
    color: 'white',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.65rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-lg) var(--space-xl)',
    borderTop: '1px solid var(--border-color)'
  },
  btn: {
    padding: 'var(--space-sm) var(--space-lg)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    transition: 'all 0.15s ease'
  },
  btnPrimary: {
    background: 'var(--sunbelt-orange)',
    color: 'white',
    border: 'none'
  },
  btnSecondary: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function getDimensionString(module) {
  const parts = [];
  if (module.module_width) parts.push(`${module.module_width}'W`);
  if (module.module_length) parts.push(`${module.module_length}'L`);
  if (module.module_height) parts.push(`${module.module_height}'H`);
  return parts.length > 0 ? parts.join(' x ') : 'Not specified';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ModuleDetailModal({
  moduleId,
  module: initialModule,
  onClose,
  onNavigateToProject,
  onStatusChange,
  userRole
}) {
  const [loading, setLoading] = useState(!initialModule);
  const [module, setModule] = useState(initialModule || null);
  const [stations, setStations] = useState([]);
  const [showActions, setShowActions] = useState(false);
  const [stationHistory, setStationHistory] = useState([]);

  const isPlantManager = userRole === 'plant manager' || userRole === 'plant_manager';

  useEffect(() => {
    if (moduleId && !initialModule) {
      fetchModule();
    }
    fetchStations();
    fetchHistory();
  }, [moduleId]);

  const fetchModule = async () => {
    setLoading(true);
    try {
      const { data } = await getModuleById(moduleId);
      if (data) setModule(data);
    } catch (error) {
      console.error('Error fetching module:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const { data } = await getStationTemplates();
      setStations(data || []);
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  const fetchHistory = async () => {
    if (!moduleId && !initialModule?.id) return;

    try {
      const { data, error } = await supabase
        .from('station_assignments')
        .select(`
          *,
          station:station_templates(id, name, code, color)
        `)
        .eq('module_id', moduleId || initialModule?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) {
        setStationHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleAction = async (action) => {
    setShowActions(false);

    if (!module) return;

    let newStatus;
    switch (action) {
      case 'hold':
        newStatus = 'QC Hold';
        break;
      case 'rework':
        newStatus = 'Rework';
        break;
      case 'fasttrack':
        // Move to next station
        const currentIdx = stations.findIndex(s => s.id === module.current_station_id);
        if (currentIdx < stations.length - 1) {
          const nextStation = stations[currentIdx + 1];
          // Would call moveModuleToStation here
          console.log('Fast-track to:', nextStation.name);
        }
        return;
      case 'scrap':
        // Would require confirmation modal
        console.log('Scrap module');
        return;
      default:
        return;
    }

    try {
      const { data, error } = await updateModuleStatus(module.id, newStatus);
      if (!error && data) {
        setModule(data);
        onStatusChange?.(data);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (!module && loading) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={{ padding: 'var(--space-xxl)', textAlign: 'center' }}>
            Loading module details...
          </div>
        </div>
      </div>
    );
  }

  if (!module) return null;

  const statusColor = getModuleStatusColor(module.status);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={{ ...styles.moduleIcon, background: `${statusColor}20` }}>
              <Package size={24} color={statusColor} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <h2 style={styles.title}>{module.serial_number}</h2>
                {module.is_rush && (
                  <span style={styles.rushBadge}>
                    <Zap size={10} />
                    RUSH
                  </span>
                )}
              </div>
              <p style={styles.subtitle}>
                {module.name || `Module ${module.sequence_number}`}
              </p>
              <span
                style={{
                  ...styles.statusBadge,
                  background: `${statusColor}20`,
                  color: statusColor
                }}
              >
                {module.status}
              </span>
            </div>
          </div>
          <div style={styles.headerActions}>
            {isPlantManager && (
              <div style={{ position: 'relative' }}>
                <button
                  style={styles.actionsBtn}
                  onClick={() => setShowActions(!showActions)}
                >
                  <Zap size={14} />
                  Actions
                  <ChevronDown size={14} />
                </button>
                {showActions && (
                  <div style={styles.actionsDropdown}>
                    <div
                      style={styles.actionItem}
                      onClick={() => handleAction('fasttrack')}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <ArrowRight size={14} />
                      Fast-track
                    </div>
                    <div
                      style={styles.actionItem}
                      onClick={() => handleAction('hold')}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Pause size={14} />
                      QC Hold
                    </div>
                    <div
                      style={styles.actionItem}
                      onClick={() => handleAction('rework')}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <RotateCcw size={14} />
                      Send to Rework
                    </div>
                    <div
                      style={{ ...styles.actionItem, ...styles.actionItemDanger }}
                      onClick={() => handleAction('scrap')}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 size={14} />
                      Scrap Module
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              style={styles.closeBtn}
              onClick={onClose}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Info Grid */}
          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>
                <Building2 size={12} />
                Current Station
              </div>
              <div style={styles.infoValue}>
                {module.current_station?.name || 'Not assigned'}
              </div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>
                <Tag size={12} />
                Building Type
              </div>
              <div style={styles.infoValue}>
                {module.building_category || module.project?.building_type || 'Standard'}
              </div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>
                <Ruler size={12} />
                Dimensions
              </div>
              <div style={styles.infoValue}>
                {getDimensionString(module)}
              </div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>
                <Calendar size={12} />
                Scheduled
              </div>
              <div style={styles.infoValue}>
                {formatDate(module.scheduled_start)}
                {module.scheduled_end && ` - ${formatDate(module.scheduled_end)}`}
              </div>
            </div>
          </div>

          {/* Project Link */}
          {module.project && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <FileText size={16} />
                Project
              </h3>
              <div
                style={styles.projectLink}
                onClick={() => onNavigateToProject?.(module.project.id)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={styles.projectIcon}>
                  <Building2 size={20} />
                </div>
                <div style={styles.projectInfo}>
                  <div style={styles.projectName}>{module.project.name}</div>
                  <div style={styles.projectNumber}>
                    {module.project.project_number} • {module.project.building_type}
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-tertiary)" />
              </div>
            </div>
          )}

          {/* Station History */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <History size={16} />
              Station History
            </h3>
            {stationHistory.length > 0 ? (
              <div style={styles.timeline}>
                <div style={styles.timelineLine} />
                {stationHistory.map((entry, idx) => (
                  <div key={entry.id} style={styles.timelineItem}>
                    <div
                      style={{
                        ...styles.timelineDot,
                        borderColor: entry.station?.color || 'var(--border-color)'
                      }}
                    />
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineStation}>
                        {entry.station?.name || 'Unknown Station'}
                      </div>
                      <div style={styles.timelineTime}>
                        {formatDateTime(entry.created_at)}
                        {entry.actual_start && ` • Started: ${formatDateTime(entry.actual_start)}`}
                        {entry.actual_end && ` • Completed: ${formatDateTime(entry.actual_end)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No station history available
              </div>
            )}
          </div>

          {/* Notes */}
          {module.notes && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <FileText size={16} />
                Notes
              </h3>
              <div style={{
                padding: 'var(--space-md)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}>
                {module.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Last updated: {formatDateTime(module.updated_at)}
          </div>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
