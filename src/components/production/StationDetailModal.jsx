// ============================================================================
// StationDetailModal.jsx - Station Detail View Modal
// ============================================================================
// Shows detailed information about a production station including:
// - Current modules at the station
// - Assigned crew members
// - QC checklist progress
// - Time/performance metrics
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Activity,
  ChevronRight,
  Play,
  Pause,
  MoreVertical
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { getModulesAtStation, getModuleStatusColor } from '../../services/modulesService';
import { getWorkersByStation } from '../../services/workersService';
import { getStationChecklist, getExpectedDuration } from '../../services/stationService';

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
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-lg) var(--space-xl)',
    borderBottom: '1px solid var(--border-color)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  stationBadge: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '1.25rem',
    color: 'white'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
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
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--space-xl)'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)'
  },
  statBox: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  statLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
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
  moduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  moduleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    borderLeft: '4px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  moduleInfo: {
    flex: 1
  },
  moduleSerial: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  moduleProject: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  moduleStatus: {
    fontSize: '0.65rem',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '500'
  },
  moduleTime: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)'
  },
  crewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 'var(--space-md)'
  },
  crewCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)'
  },
  crewAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--sunbelt-orange)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  crewName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  crewRole: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)'
  },
  leadBadge: {
    fontSize: '0.6rem',
    padding: '2px 6px',
    background: 'var(--sunbelt-orange)',
    color: 'white',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '600',
    marginLeft: 'var(--space-xs)'
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) 0',
    fontSize: '0.875rem',
    color: 'var(--text-primary)'
  },
  checklistIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-md)',
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

function formatTimeAtStation(startTime) {
  if (!startTime) return 'Not started';

  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMins}m`;
  }
  return `${diffMins}m`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StationDetailModal({
  station,
  factoryId,
  onClose,
  onModuleClick,
  onStartWork,
  userRole
}) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    if (station) {
      fetchData();
    }
  }, [station]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modulesResult, workersResult, checklistResult] = await Promise.all([
        getModulesAtStation(station.id, factoryId),
        getWorkersByStation(station.id),
        getStationChecklist(station.id)
      ]);

      setModules(modulesResult.data || []);
      setWorkers(workersResult.data || []);
      setChecklist(checklistResult.data || []);
    } catch (error) {
      console.error('Error fetching station data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalModules: modules.length,
    inProgress: modules.filter(m => m.status === 'In Progress').length,
    inQueue: modules.filter(m => m.status === 'In Queue').length,
    crewSize: workers.length
  };

  // Expected duration based on building category
  const expectedHours = getExpectedDuration(station, 'stock');

  if (!station) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={{ ...styles.stationBadge, background: station.color || '#6366f1' }}>
              {station.order_num}
            </div>
            <div>
              <h2 style={styles.title}>{station.name}</h2>
              <p style={styles.subtitle}>
                {station.code} • Expected: {expectedHours}h per module
              </p>
            </div>
          </div>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Stats Row */}
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statValue}>{stats.totalModules}</div>
              <div style={styles.statLabel}>Total Modules</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ ...styles.statValue, color: '#3b82f6' }}>{stats.inProgress}</div>
              <div style={styles.statLabel}>In Progress</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ ...styles.statValue, color: '#eab308' }}>{stats.inQueue}</div>
              <div style={styles.statLabel}>In Queue</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ ...styles.statValue, color: '#22c55e' }}>{stats.crewSize}</div>
              <div style={styles.statLabel}>Crew Assigned</div>
            </div>
          </div>

          {/* Modules Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Package size={16} />
              Modules at Station ({modules.length})
            </h3>
            {modules.length > 0 ? (
              <div style={styles.moduleList}>
                {modules.map(module => {
                  const statusColor = getModuleStatusColor(module.status);
                  return (
                    <div
                      key={module.id}
                      style={{
                        ...styles.moduleItem,
                        borderLeftColor: statusColor
                      }}
                      onClick={() => onModuleClick?.(module)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                    >
                      <div style={styles.moduleInfo}>
                        <div style={styles.moduleSerial}>{module.serial_number}</div>
                        <div style={styles.moduleProject}>
                          {module.project?.name || 'Unknown Project'} • {module.project?.project_number || ''}
                        </div>
                      </div>
                      <div
                        style={{
                          ...styles.moduleStatus,
                          background: `${statusColor}20`,
                          color: statusColor
                        }}
                      >
                        {module.status}
                      </div>
                      <div style={styles.moduleTime}>
                        <Clock size={12} />
                        {formatTimeAtStation(module.actual_start)}
                      </div>
                      <ChevronRight size={16} color="var(--text-tertiary)" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <Package size={32} style={{ opacity: 0.5, marginBottom: 'var(--space-sm)' }} />
                <p>No modules at this station</p>
              </div>
            )}
          </div>

          {/* Crew Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Users size={16} />
              Assigned Crew ({workers.length})
            </h3>
            {workers.length > 0 ? (
              <div style={styles.crewGrid}>
                {workers.map(worker => (
                  <div key={worker.id} style={styles.crewCard}>
                    <div style={styles.crewAvatar}>
                      {worker.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div style={styles.crewName}>
                        {worker.full_name}
                        {worker.is_lead && (
                          <span style={styles.leadBadge}>LEAD</span>
                        )}
                      </div>
                      <div style={styles.crewRole}>{worker.title || 'Worker'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <Users size={32} style={{ opacity: 0.5, marginBottom: 'var(--space-sm)' }} />
                <p>No crew assigned to this station</p>
              </div>
            )}
          </div>

          {/* QC Checklist Section */}
          {station.requires_inspection && checklist.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <ClipboardCheck size={16} />
                QC Checklist
              </h3>
              <div>
                {checklist.map((item, idx) => (
                  <div key={idx} style={styles.checklistItem}>
                    <div style={styles.checklistIcon}>
                      {/* Checkbox placeholder - would be interactive in full implementation */}
                    </div>
                    {typeof item === 'string' ? item : item.label || item.description || `Item ${idx + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={onClose}
          >
            Close
          </button>
          {(userRole === 'plant manager' || userRole === 'plant_manager') && stats.inQueue > 0 && (
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={() => onStartWork?.(modules.find(m => m.status === 'In Queue'))}
            >
              <Play size={16} />
              Start Next Module
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
