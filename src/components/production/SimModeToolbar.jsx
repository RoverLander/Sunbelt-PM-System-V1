// ============================================================================
// SimModeToolbar.jsx - Simulation Mode Controls
// ============================================================================
// Toolbar for entering/exiting simulation mode and publishing changes.
//
// FEATURES:
// - Toggle between Live and Simulation mode
// - Show pending changes count
// - Preview impact metrics
// - Publish or discard simulation changes
//
// Created: January 15, 2026
// ============================================================================

import React, { useState } from 'react';
import {
  Play,
  Eye,
  EyeOff,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  Zap
} from 'lucide-react';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-md) var(--space-lg)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 'var(--space-md)',
    transition: 'all 0.2s ease'
  },
  simModeActive: {
    background: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b'
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-lg)'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  modeToggle: {
    display: 'flex',
    gap: '2px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '2px'
  },
  modeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    color: 'var(--text-secondary)'
  },
  modeBtnActive: {
    background: 'var(--sunbelt-orange)',
    color: 'white'
  },
  modeBtnSim: {
    background: '#f59e0b',
    color: 'white'
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-xs) var(--space-md)',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  liveBadge: {
    background: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e'
  },
  simBadge: {
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#f59e0b'
  },
  changesCount: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s ease'
  },
  btnDiscard: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444'
  },
  btnPublish: {
    background: '#22c55e',
    color: 'white'
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },

  // Publish Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-lg)',
    borderBottom: '1px solid var(--border-color)'
  },
  modalTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },
  modalBody: {
    padding: 'var(--space-lg)'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-md)',
    padding: 'var(--space-lg)',
    borderTop: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)'
  },
  changesList: {
    maxHeight: '200px',
    overflowY: 'auto',
    marginTop: 'var(--space-md)'
  },
  changeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: 'var(--space-xs)',
    fontSize: '0.8rem'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: '4px'
  }
};

// ============================================================================
// PUBLISH MODAL COMPONENT
// ============================================================================

function PublishModal({ changes, modules, onPublish, onClose, publishing }) {
  const changeEntries = Object.entries(changes);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            <Save size={18} color="#22c55e" />
            Publish Schedule Changes
          </h3>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.modalBody}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            You are about to publish {changeEntries.length} schedule change{changeEntries.length !== 1 ? 's' : ''} to the database.
            This action will update module schedules and create an audit log entry.
          </p>

          <div style={styles.changesList}>
            {changeEntries.map(([moduleId, newDate]) => {
              const module = modules.find(m => m.id === moduleId);
              return (
                <div key={moduleId} style={styles.changeItem}>
                  <CheckCircle size={14} color="#22c55e" />
                  <span style={{ fontWeight: '500' }}>{module?.serial_number || moduleId}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                  <span>{new Date(newDate).toLocaleDateString()}</span>
                </div>
              );
            })}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-md)',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}>
            <AlertTriangle size={16} color="#f59e0b" />
            This will create an audit log entry for tracking purposes.
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button
            style={{
              ...styles.btn,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)'
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{
              ...styles.btn,
              ...styles.btnPublish,
              ...(publishing ? styles.btnDisabled : {})
            }}
            onClick={onPublish}
            disabled={publishing}
          >
            <Save size={14} />
            {publishing ? 'Publishing...' : 'Publish Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SimModeToolbar({
  isSimMode,
  onToggleSimMode,
  simulatedChanges = {},
  modules = [],
  onPublish,
  onDiscard,
  publishing = false,
  userRole
}) {
  const [showPublishModal, setShowPublishModal] = useState(false);

  const changeCount = Object.keys(simulatedChanges).length;

  const isPlantManager = userRole?.toLowerCase() === 'plant manager' ||
                         userRole?.toLowerCase() === 'plant_manager' ||
                         userRole?.toLowerCase() === 'plant_gm';

  // Only show toolbar for Plant Managers
  if (!isPlantManager) {
    return null;
  }

  const handlePublish = async () => {
    await onPublish?.();
    setShowPublishModal(false);
  };

  return (
    <>
      <div style={{
        ...styles.toolbar,
        ...(isSimMode ? styles.simModeActive : {})
      }}>
        <div style={styles.leftSection}>
          {/* Mode Toggle */}
          <div style={styles.modeToggle}>
            <button
              style={{
                ...styles.modeBtn,
                ...(!isSimMode ? styles.modeBtnActive : {})
              }}
              onClick={() => isSimMode && onToggleSimMode?.()}
            >
              <Play size={14} />
              Live
            </button>
            <button
              style={{
                ...styles.modeBtn,
                ...(isSimMode ? styles.modeBtnSim : {})
              }}
              onClick={() => !isSimMode && onToggleSimMode?.()}
            >
              <Eye size={14} />
              Simulation
            </button>
          </div>

          {/* Status Badge */}
          <div style={{
            ...styles.statusBadge,
            ...(isSimMode ? styles.simBadge : styles.liveBadge)
          }}>
            {isSimMode ? (
              <>
                <Zap size={12} />
                What-If Mode Active
              </>
            ) : (
              <>
                <CheckCircle size={12} />
                Live Schedule
              </>
            )}
          </div>

          {/* Changes Count (only in sim mode) */}
          {isSimMode && (
            <div style={styles.changesCount}>
              <span style={{ fontWeight: '600' }}>{changeCount}</span>
              pending change{changeCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div style={styles.rightSection}>
          {isSimMode && (
            <>
              {/* Discard Button */}
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnDiscard,
                  ...(changeCount === 0 ? styles.btnDisabled : {})
                }}
                onClick={onDiscard}
                disabled={changeCount === 0}
                title="Discard all simulation changes"
              >
                <Trash2 size={14} />
                Discard
              </button>

              {/* Publish Button */}
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnPublish,
                  ...(changeCount === 0 ? styles.btnDisabled : {})
                }}
                onClick={() => setShowPublishModal(true)}
                disabled={changeCount === 0}
                title="Publish changes to database"
              >
                <Save size={14} />
                Publish ({changeCount})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <PublishModal
          changes={simulatedChanges}
          modules={modules}
          onPublish={handlePublish}
          onClose={() => setShowPublishModal(false)}
          publishing={publishing}
        />
      )}
    </>
  );
}
