// ============================================================================
// QCInspectionModal.jsx - Mobile-Friendly QC Checklist Modal
// ============================================================================
// Allows inspectors to perform QC inspections with:
// - Checklist items with pass/fail buttons
// - Photo capture/upload
// - Notes and defect logging
// - Auto-creates rework tasks on fail
//
// PGM-010: QC Inspection Modal
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Image,
  Trash2,
  Send,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Loader,
  FileText,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { createQCRecord, uploadQCPhoto } from '../../services/qcService';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// DEFAULT CHECKLISTS BY STATION
// ============================================================================

const DEFAULT_CHECKLISTS = {
  FRAME: [
    { id: 'frame_welds', label: 'All welds complete and inspected', category: 'Structure' },
    { id: 'frame_square', label: 'Frame is square (diagonal measurements)', category: 'Structure' },
    { id: 'frame_level', label: 'Frame is level on all axes', category: 'Structure' },
    { id: 'anchor_bolts', label: 'Anchor bolt locations correct', category: 'Structure' },
    { id: 'steel_clean', label: 'Steel surfaces clean and primed', category: 'Finish' }
  ],
  WALLS: [
    { id: 'studs_spacing', label: 'Stud spacing per plans (16" or 24" OC)', category: 'Framing' },
    { id: 'headers', label: 'Headers installed at openings', category: 'Framing' },
    { id: 'blocking', label: 'Blocking installed for fixtures', category: 'Framing' },
    { id: 'sheathing', label: 'Sheathing properly fastened', category: 'Envelope' },
    { id: 'vapor_barrier', label: 'Vapor barrier installed correctly', category: 'Envelope' }
  ],
  MEP_ROUGHIN: [
    { id: 'elec_wiring', label: 'Electrical wiring per code', category: 'Electrical' },
    { id: 'elec_boxes', label: 'Electrical boxes secured and accessible', category: 'Electrical' },
    { id: 'plumb_supply', label: 'Supply lines pressure tested', category: 'Plumbing' },
    { id: 'plumb_drain', label: 'Drain lines slope tested', category: 'Plumbing' },
    { id: 'hvac_ducts', label: 'HVAC ducts sealed and supported', category: 'Mechanical' },
    { id: 'hvac_unit', label: 'HVAC unit installed level', category: 'Mechanical' }
  ],
  INSULATION: [
    { id: 'insul_walls', label: 'Wall insulation R-value correct', category: 'Thermal' },
    { id: 'insul_ceiling', label: 'Ceiling insulation R-value correct', category: 'Thermal' },
    { id: 'insul_floor', label: 'Floor insulation complete', category: 'Thermal' },
    { id: 'insul_gaps', label: 'No gaps or compression in insulation', category: 'Thermal' },
    { id: 'vapor_seal', label: 'Vapor barrier sealed at penetrations', category: 'Moisture' }
  ],
  DRYWALL: [
    { id: 'dw_install', label: 'Drywall properly fastened', category: 'Installation' },
    { id: 'dw_tape', label: 'Joints taped and mudded', category: 'Finish' },
    { id: 'dw_corners', label: 'Corner bead installed', category: 'Finish' },
    { id: 'dw_texture', label: 'Texture applied evenly', category: 'Finish' },
    { id: 'dw_sand', label: 'Surfaces sanded smooth', category: 'Finish' }
  ],
  PAINT: [
    { id: 'paint_prime', label: 'Primer applied to all surfaces', category: 'Prep' },
    { id: 'paint_walls', label: 'Wall paint - correct color and coverage', category: 'Application' },
    { id: 'paint_trim', label: 'Trim paint - clean lines', category: 'Application' },
    { id: 'paint_touch', label: 'Touch-ups complete', category: 'Final' },
    { id: 'paint_protect', label: 'Floors/fixtures protected', category: 'Protection' }
  ],
  FINISH: [
    { id: 'floor_install', label: 'Flooring installed per spec', category: 'Flooring' },
    { id: 'floor_trim', label: 'Base trim installed', category: 'Flooring' },
    { id: 'cab_install', label: 'Cabinets level and secured', category: 'Cabinets' },
    { id: 'cab_hardware', label: 'Cabinet hardware installed', category: 'Cabinets' },
    { id: 'fixtures', label: 'All fixtures operational', category: 'Fixtures' },
    { id: 'doors', label: 'Doors swing freely, hardware works', category: 'Doors' },
    { id: 'windows', label: 'Windows operate and seal', category: 'Windows' }
  ],
  FINAL_QC: [
    { id: 'fqc_elec', label: 'All electrical circuits tested', category: 'Systems' },
    { id: 'fqc_plumb', label: 'All plumbing fixtures tested', category: 'Systems' },
    { id: 'fqc_hvac', label: 'HVAC operational and balanced', category: 'Systems' },
    { id: 'fqc_clean', label: 'Unit cleaned throughout', category: 'Final' },
    { id: 'fqc_punch', label: 'Punch list items addressed', category: 'Final' },
    { id: 'fqc_docs', label: 'Documentation complete', category: 'Final' },
    { id: 'fqc_photos', label: 'Completion photos taken', category: 'Final' }
  ]
};

// Get checklist for a station code
function getChecklistForStation(stationCode) {
  // Map station codes to checklist keys
  const codeMap = {
    'FRAME': 'FRAME',
    'ROUGH_ELEC': 'MEP_ROUGHIN',
    'ROUGH_PLUMB': 'MEP_ROUGHIN',
    'ROUGH_MECH': 'MEP_ROUGHIN',
    'MEP_ROUGHIN': 'MEP_ROUGHIN',
    'INSULATION': 'INSULATION',
    'DRYWALL': 'DRYWALL',
    'PAINT': 'PAINT',
    'WALLS': 'WALLS',
    'FINISH': 'FINISH',
    'INT_FINISH': 'FINISH',
    'EXT_FINISH': 'FINISH',
    'FINAL_QC': 'FINAL_QC',
    'QC': 'FINAL_QC'
  };

  const key = codeMap[stationCode] || 'FINAL_QC';
  return DEFAULT_CHECKLISTS[key] || DEFAULT_CHECKLISTS.FINAL_QC;
}

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
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-md)'
  },
  modal: {
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-lg)',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)'
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    padding: 'var(--space-sm)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--space-lg)'
  },
  moduleInfo: {
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  serial: {
    fontWeight: '600',
    color: 'var(--text-primary)',
    fontSize: '1rem'
  },
  projectName: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  stationBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-xs) var(--space-sm)',
    background: 'var(--sunbelt-orange)',
    color: 'white',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  section: {
    marginBottom: 'var(--space-xl)'
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-md)',
    cursor: 'pointer'
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-sm)',
    border: '1px solid var(--border-color)',
    transition: 'all 0.15s ease'
  },
  checklistLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    flex: 1
  },
  checklistCategory: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)',
    marginTop: '2px'
  },
  actionButtons: {
    display: 'flex',
    gap: 'var(--space-sm)'
  },
  passBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    border: '2px solid #22c55e',
    background: 'transparent',
    color: '#22c55e',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  passBtnActive: {
    background: '#22c55e',
    color: 'white'
  },
  failBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    border: '2px solid #ef4444',
    background: 'transparent',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  failBtnActive: {
    background: '#ef4444',
    color: 'white'
  },
  photoSection: {
    marginTop: 'var(--space-lg)'
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-md)'
  },
  photoThumb: {
    aspectRatio: '1',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    position: 'relative',
    background: 'var(--bg-tertiary)'
  },
  photoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  photoRemove: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.9)',
    border: 'none',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  addPhotoBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-xs)',
    aspectRatio: '1',
    borderRadius: 'var(--radius-md)',
    border: '2px dashed var(--border-color)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: '0.7rem'
  },
  notesTextarea: {
    width: '100%',
    minHeight: '80px',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  footer: {
    display: 'flex',
    gap: 'var(--space-md)',
    padding: 'var(--space-lg)',
    borderTop: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)'
  },
  submitBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    fontWeight: '600',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  passSubmit: {
    background: '#22c55e',
    color: 'white'
  },
  failSubmit: {
    background: '#ef4444',
    color: 'white'
  },
  cancelBtn: {
    padding: 'var(--space-md) var(--space-lg)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  summary: {
    display: 'flex',
    gap: 'var(--space-lg)',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-lg)'
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    fontSize: '0.875rem'
  },
  warningBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    background: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-lg)',
    color: '#f59e0b',
    fontSize: '0.875rem'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function QCInspectionModal({
  module,
  station,
  factoryId,
  onClose,
  onSubmit
}) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Get checklist for this station
  const checklistItems = getChecklistForStation(station?.code);

  // State
  const [responses, setResponses] = useState({});
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Initialize all as unanswered
  useEffect(() => {
    const initial = {};
    checklistItems.forEach(item => {
      initial[item.id] = null; // null = unanswered, true = pass, false = fail
    });
    setResponses(initial);
  }, [station]);

  // Group items by category
  const groupedItems = checklistItems.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Calculate summary
  const summary = {
    total: checklistItems.length,
    passed: Object.values(responses).filter(v => v === true).length,
    failed: Object.values(responses).filter(v => v === false).length,
    unanswered: Object.values(responses).filter(v => v === null).length
  };

  const allAnswered = summary.unanswered === 0;
  const anyFailed = summary.failed > 0;

  // Handle response toggle
  const handleResponse = (itemId, value) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: prev[itemId] === value ? null : value
    }));
  };

  // Handle photo capture/upload
  const handlePhotoCapture = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhoto(true);

    try {
      const newPhotos = await Promise.all(
        files.map(async (file) => {
          // Create preview URL
          const previewUrl = URL.createObjectURL(file);
          return {
            id: crypto.randomUUID(),
            file,
            previewUrl,
            uploaded: false
          };
        })
      );

      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (error) {
      console.error('Error processing photos:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = (photoId) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo?.previewUrl) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  // Toggle category
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Submit inspection
  const handleSubmit = async () => {
    if (!allAnswered) return;

    setSubmitting(true);

    try {
      // Determine overall result
      const result = anyFailed ? 'Fail' : 'Pass';

      // Find failed items for defects
      const defects = checklistItems
        .filter(item => responses[item.id] === false)
        .map(item => ({
          item: item.id,
          label: item.label,
          category: item.category,
          type: 'checklist_fail'
        }));

      // Upload photos first
      const uploadedUrls = [];
      // Note: In production, you'd upload to Supabase storage here
      // For now, we'll just pass the file references

      // Create QC record
      const { data, error } = await createQCRecord({
        factory_id: factoryId,
        module_id: module.id,
        station_id: station.id,
        inspector_user_id: user.id,
        result,
        checklist_responses: responses,
        notes,
        defects_found: defects,
        photos: uploadedUrls
      });

      if (error) throw error;

      // If failed, create a rework task
      if (result === 'Fail') {
        const defectSummary = defects.map(d => d.label).join(', ');
        await supabase.from('tasks').insert({
          project_id: module.project_id,
          title: `Rework Required: ${module.serial_number}`,
          description: `QC inspection failed at ${station.name}.\n\nFailed items:\n${defectSummary}\n\nNotes: ${notes}`,
          status: 'Not Started',
          priority: 'High',
          assignee_id: user.id,
          internal_owner_id: user.id,
          workflow_station_key: 'production',
          created_at: new Date().toISOString()
        });
      }

      // Notify parent
      if (onSubmit) {
        onSubmit(data, result);
      }

      onClose();
    } catch (error) {
      console.error('Error submitting inspection:', error);
      alert('Failed to submit inspection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            <ClipboardCheck size={20} color="var(--sunbelt-orange)" />
            QC Inspection
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Module Info */}
          <div style={styles.moduleInfo}>
            <div>
              <div style={styles.serial}>{module.serial_number}</div>
              <div style={styles.projectName}>{module.project?.name || 'Unknown Project'}</div>
            </div>
            <div style={styles.stationBadge}>
              {station?.name || 'Final QC'}
            </div>
          </div>

          {/* Summary */}
          <div style={styles.summary}>
            <div style={styles.summaryItem}>
              <CheckCircle2 size={16} color="#22c55e" />
              <span>{summary.passed} Passed</span>
            </div>
            <div style={styles.summaryItem}>
              <XCircle size={16} color="#ef4444" />
              <span>{summary.failed} Failed</span>
            </div>
            <div style={styles.summaryItem}>
              <AlertCircle size={16} color="var(--text-tertiary)" />
              <span>{summary.unanswered} Remaining</span>
            </div>
          </div>

          {/* Warning if any failed */}
          {anyFailed && (
            <div style={styles.warningBanner}>
              <AlertTriangle size={18} />
              <span>
                <strong>{summary.failed} item(s) failed.</strong> A rework task will be created automatically.
              </span>
            </div>
          )}

          {/* Checklist by Category */}
          {Object.entries(groupedItems).map(([category, items]) => {
            const isExpanded = expandedCategories[category] !== false; // Default expanded
            const categoryPassed = items.filter(i => responses[i.id] === true).length;
            const categoryFailed = items.filter(i => responses[i.id] === false).length;

            return (
              <div key={category} style={styles.section}>
                <div
                  style={styles.sectionTitle}
                  onClick={() => toggleCategory(category)}
                >
                  <span>{category} ({categoryPassed + categoryFailed}/{items.length})</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {isExpanded && items.map(item => {
                  const response = responses[item.id];
                  return (
                    <div
                      key={item.id}
                      style={{
                        ...styles.checklistItem,
                        borderColor: response === true ? '#22c55e' :
                                    response === false ? '#ef4444' : 'var(--border-color)'
                      }}
                    >
                      <div>
                        <div style={styles.checklistLabel}>{item.label}</div>
                      </div>
                      <div style={styles.actionButtons}>
                        <button
                          style={{
                            ...styles.passBtn,
                            ...(response === true ? styles.passBtnActive : {})
                          }}
                          onClick={() => handleResponse(item.id, true)}
                          title="Pass"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button
                          style={{
                            ...styles.failBtn,
                            ...(response === false ? styles.failBtnActive : {})
                          }}
                          onClick={() => handleResponse(item.id, false)}
                          title="Fail"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Photos Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>Photos ({photos.length})</span>
            </div>

            <div style={styles.photoGrid}>
              {photos.map(photo => (
                <div key={photo.id} style={styles.photoThumb}>
                  <img
                    src={photo.previewUrl || photo.url}
                    alt="QC Photo"
                    style={styles.photoImg}
                  />
                  <button
                    style={styles.photoRemove}
                    onClick={() => handleRemovePhoto(photo.id)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {photos.length < 8 && (
                <button
                  style={styles.addPhotoBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <Camera size={20} />
                      <span>Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              style={{ display: 'none' }}
              onChange={handlePhotoCapture}
            />
          </div>

          {/* Notes Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>Notes</span>
            </div>
            <textarea
              style={styles.notesTextarea}
              placeholder="Add inspection notes, observations, or defect details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            style={{
              ...styles.submitBtn,
              ...(anyFailed ? styles.failSubmit : styles.passSubmit),
              opacity: !allAnswered || submitting ? 0.5 : 1,
              cursor: !allAnswered || submitting ? 'not-allowed' : 'pointer'
            }}
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                {anyFailed ? 'Submit & Create Rework' : 'Submit Passed'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
