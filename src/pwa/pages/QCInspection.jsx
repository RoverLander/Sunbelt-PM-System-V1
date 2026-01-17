// ============================================================================
// QCInspection.jsx - PWA QC Inspection Page
// ============================================================================
// Mobile-optimized QC inspection workflow with checklist, photo capture,
// and result submission. Supports Pass/Fail with auto-rework task creation.
//
// Created: January 17, 2026
// Phase: PWA Phase 3 - QC Inspection Workflow
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardCheck, Camera, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, ChevronLeft, Send, Package, MapPin, Loader,
  Image as ImageIcon, X, RotateCcw
} from 'lucide-react';
import { useWorkerAuth } from '../contexts/WorkerAuthContext';
import { searchModules, getModuleById, getModuleStatusColor } from '../../services/modulesService';
import {
  createQCRecord,
  uploadQCPhoto,
  getPendingInspections
} from '../../services/qcService';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS = {
  SELECT_MODULE: 'select_module',
  CHECKLIST: 'checklist',
  PHOTOS: 'photos',
  REVIEW: 'review',
  COMPLETE: 'complete'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * QCInspection - Main QC inspection workflow page
 *
 * @returns {JSX.Element}
 */
export default function QCInspection() {
  const { worker, factoryId, isLead } = useWorkerAuth();

  // Workflow state
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_MODULE);
  const [selectedModule, setSelectedModule] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [checklistResponses, setChecklistResponses] = useState({});
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Module selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingModules, setPendingModules] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPending, setIsLoadingPending] = useState(true);

  // ============================================================================
  // LOAD PENDING INSPECTIONS
  // ============================================================================

  useEffect(() => {
    if (factoryId) {
      loadPendingInspections();
    }
  }, [factoryId]);

  const loadPendingInspections = async () => {
    setIsLoadingPending(true);
    try {
      const { data, error } = await getPendingInspections(factoryId);
      if (!error && data) {
        setPendingModules(data);
      }
    } catch (err) {
      console.error('Error loading pending inspections:', err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  // ============================================================================
  // SEARCH MODULES
  // ============================================================================

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2 || !factoryId) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await searchModules(factoryId, searchQuery, 5);
        setSearchResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, factoryId]);

  // ============================================================================
  // LOAD MODULE & CHECKLIST
  // ============================================================================

  const handleSelectModule = useCallback(async (module) => {
    try {
      // Get full module details
      const { data: fullModule } = await getModuleById(module.id);
      if (!fullModule) {
        alert('Failed to load module details');
        return;
      }

      setSelectedModule(fullModule);

      // Load checklist from station template
      if (fullModule.current_station?.checklist) {
        const checklistItems = fullModule.current_station.checklist;
        setChecklist(Array.isArray(checklistItems) ? checklistItems : []);
        // Initialize responses
        const initialResponses = {};
        (Array.isArray(checklistItems) ? checklistItems : []).forEach((item, idx) => {
          initialResponses[idx] = null; // null = not answered
        });
        setChecklistResponses(initialResponses);
      } else {
        // No checklist - use default
        setChecklist([
          { q: 'Visual inspection passed?', type: 'yesno' },
          { q: 'No visible defects?', type: 'yesno' },
          { q: 'Meets quality standards?', type: 'yesno' }
        ]);
        setChecklistResponses({ 0: null, 1: null, 2: null });
      }

      setSearchQuery('');
      setSearchResults([]);
      setCurrentStep(STEPS.CHECKLIST);
    } catch (err) {
      console.error('Error selecting module:', err);
      alert('Failed to load module');
    }
  }, []);

  // ============================================================================
  // CHECKLIST HANDLERS
  // ============================================================================

  const handleChecklistResponse = useCallback((index, value) => {
    setChecklistResponses(prev => ({
      ...prev,
      [index]: value
    }));
  }, []);

  const isChecklistComplete = useCallback(() => {
    return Object.values(checklistResponses).every(v => v !== null);
  }, [checklistResponses]);

  const getChecklistResult = useCallback(() => {
    const responses = Object.values(checklistResponses);
    const allPassed = responses.every(v => v === true);
    const anyFailed = responses.some(v => v === false);
    return anyFailed ? 'Fail' : allPassed ? 'Pass' : 'Conditional';
  }, [checklistResponses]);

  // ============================================================================
  // PHOTO CAPTURE
  // ============================================================================

  const fileInputRef = useRef(null);

  const handleCapturePhoto = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePhotoSelected = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: event.target.result,
          uploading: false,
          uploaded: false,
          url: null
        }]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRemovePhoto = useCallback((photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }, []);

  // ============================================================================
  // SUBMIT INSPECTION
  // ============================================================================

  const handleSubmit = useCallback(async () => {
    if (!selectedModule || !worker) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Upload photos first
      const uploadedUrls = [];
      for (const photo of photos) {
        if (!photo.uploaded && photo.file) {
          // Generate a temporary QC ID for file organization
          const tempId = crypto.randomUUID();
          const fileExt = photo.file.name.split('.').pop();
          const fileName = `qc/${tempId}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('qc-photos')
            .upload(fileName, photo.file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('qc-photos')
              .getPublicUrl(fileName);
            uploadedUrls.push(publicUrl);
          }
        } else if (photo.url) {
          uploadedUrls.push(photo.url);
        }
      }

      // Create QC record
      const result = getChecklistResult();
      const qcData = {
        factory_id: factoryId,
        module_id: selectedModule.id,
        station_id: selectedModule.current_station_id,
        inspector_id: worker.id,
        result,
        checklist_responses: checklistResponses,
        notes,
        photos: uploadedUrls,
        defects_found: result === 'Fail' ? [{ type: 'checklist_fail', note: notes }] : []
      };

      const { data, error } = await createQCRecord(qcData);

      if (error) {
        throw new Error(error.message || 'Failed to submit inspection');
      }

      setSubmitSuccess(true);
      setCurrentStep(STEPS.COMPLETE);
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(err.message || 'Failed to submit inspection');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedModule, worker, factoryId, photos, checklistResponses, notes, getChecklistResult]);

  // ============================================================================
  // RESET WORKFLOW
  // ============================================================================

  const handleReset = useCallback(() => {
    setCurrentStep(STEPS.SELECT_MODULE);
    setSelectedModule(null);
    setChecklist([]);
    setChecklistResponses({});
    setPhotos([]);
    setNotes('');
    setSubmitError(null);
    setSubmitSuccess(false);
    loadPendingInspections();
  }, []);

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  // Step 1: Select Module
  if (currentStep === STEPS.SELECT_MODULE) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <ClipboardCheck size={24} style={{ color: 'var(--sunbelt-orange)' }} />
          <h1 style={styles.title}>QC Inspection</h1>
        </div>

        {/* Search */}
        <div style={styles.searchBox}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search module by serial #..."
            style={styles.searchInput}
          />
          {isSearching && <Loader size={18} style={styles.searchSpinner} />}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={styles.searchResults}>
            {searchResults.map(mod => (
              <ModuleListItem
                key={mod.id}
                module={mod}
                onSelect={() => handleSelectModule(mod)}
              />
            ))}
          </div>
        )}

        {/* Pending Inspections */}
        {!searchQuery && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Pending Inspections</h3>
            {isLoadingPending ? (
              <div style={styles.loading}>
                <Loader size={24} />
                <span>Loading...</span>
              </div>
            ) : pendingModules.length === 0 ? (
              <div style={styles.emptyState}>
                <CheckCircle size={48} style={{ color: 'var(--success)' }} />
                <p>No pending inspections</p>
              </div>
            ) : (
              <div style={styles.moduleList}>
                {pendingModules.map(mod => (
                  <ModuleListItem
                    key={mod.id}
                    module={mod}
                    onSelect={() => handleSelectModule(mod)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Step 2: Checklist
  if (currentStep === STEPS.CHECKLIST) {
    return (
      <div style={styles.container}>
        <StepHeader
          module={selectedModule}
          step={1}
          totalSteps={3}
          title="Checklist"
          onBack={() => setCurrentStep(STEPS.SELECT_MODULE)}
        />

        <div style={styles.checklistContainer}>
          {checklist.map((item, idx) => (
            <ChecklistItemComponent
              key={idx}
              index={idx}
              item={item}
              response={checklistResponses[idx]}
              onResponse={(value) => handleChecklistResponse(idx, value)}
            />
          ))}
        </div>

        <div style={styles.navButtons}>
          <button
            onClick={() => setCurrentStep(STEPS.PHOTOS)}
            disabled={!isChecklistComplete()}
            style={{
              ...styles.primaryButton,
              opacity: isChecklistComplete() ? 1 : 0.5
            }}
          >
            <span>Continue to Photos</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Photos
  if (currentStep === STEPS.PHOTOS) {
    return (
      <div style={styles.container}>
        <StepHeader
          module={selectedModule}
          step={2}
          totalSteps={3}
          title="Photos"
          onBack={() => setCurrentStep(STEPS.CHECKLIST)}
        />

        <div style={styles.photoSection}>
          <p style={styles.photoHint}>
            Capture photos of the module for documentation (optional)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoSelected}
            style={{ display: 'none' }}
          />

          <button onClick={handleCapturePhoto} style={styles.captureButton}>
            <Camera size={24} />
            <span>Take Photo</span>
          </button>

          {photos.length > 0 && (
            <div style={styles.photoGrid}>
              {photos.map(photo => (
                <div key={photo.id} style={styles.photoThumb}>
                  <img src={photo.preview} alt="QC" style={styles.photoImage} />
                  <button
                    onClick={() => handleRemovePhoto(photo.id)}
                    style={styles.removePhotoBtn}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={styles.photoCount}>
            {photos.length} photo{photos.length !== 1 ? 's' : ''} captured
          </div>
        </div>

        <div style={styles.navButtons}>
          <button
            onClick={() => setCurrentStep(STEPS.REVIEW)}
            style={styles.primaryButton}
          >
            <span>Review & Submit</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Review & Submit
  if (currentStep === STEPS.REVIEW) {
    const result = getChecklistResult();
    const passedCount = Object.values(checklistResponses).filter(v => v === true).length;
    const failedCount = Object.values(checklistResponses).filter(v => v === false).length;

    return (
      <div style={styles.container}>
        <StepHeader
          module={selectedModule}
          step={3}
          totalSteps={3}
          title="Review"
          onBack={() => setCurrentStep(STEPS.PHOTOS)}
        />

        {/* Result Summary */}
        <div style={{
          ...styles.resultCard,
          borderColor: result === 'Pass' ? 'var(--success)' : 'var(--error)'
        }}>
          {result === 'Pass' ? (
            <CheckCircle size={48} style={{ color: 'var(--success)' }} />
          ) : (
            <XCircle size={48} style={{ color: 'var(--error)' }} />
          )}
          <h2 style={{
            ...styles.resultText,
            color: result === 'Pass' ? 'var(--success)' : 'var(--error)'
          }}>
            {result === 'Pass' ? 'PASSED' : 'FAILED'}
          </h2>
          <p style={styles.resultSubtext}>
            {passedCount} passed, {failedCount} failed
          </p>
        </div>

        {/* Photos Summary */}
        {photos.length > 0 && (
          <div style={styles.summarySection}>
            <h4 style={styles.summaryTitle}>
              <ImageIcon size={16} /> {photos.length} Photos Attached
            </h4>
          </div>
        )}

        {/* Notes */}
        <div style={styles.notesSection}>
          <label style={styles.notesLabel}>Additional Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes or observations..."
            style={styles.notesInput}
            rows={3}
          />
        </div>

        {/* Error Message */}
        {submitError && (
          <div style={styles.errorMessage}>
            <AlertTriangle size={18} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div style={styles.navButtons}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              ...styles.submitButton,
              backgroundColor: result === 'Pass' ? 'var(--success)' : 'var(--error)',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? (
              <>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Submit Inspection</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Complete
  if (currentStep === STEPS.COMPLETE) {
    const result = getChecklistResult();

    return (
      <div style={styles.container}>
        <div style={styles.completeContainer}>
          {result === 'Pass' ? (
            <CheckCircle size={80} style={{ color: 'var(--success)' }} />
          ) : (
            <XCircle size={80} style={{ color: 'var(--error)' }} />
          )}

          <h1 style={styles.completeTitle}>
            Inspection {result === 'Pass' ? 'Passed' : 'Failed'}
          </h1>

          <p style={styles.completeSubtext}>
            {selectedModule?.serial_number}
          </p>

          {result === 'Fail' && (
            <div style={styles.reworkNotice}>
              <AlertTriangle size={20} />
              <span>Module has been flagged for rework</span>
            </div>
          )}

          <button onClick={handleReset} style={styles.newInspectionButton}>
            <RotateCcw size={20} />
            <span>New Inspection</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * ModuleListItem - Module selection item
 */
function ModuleListItem({ module, onSelect }) {
  return (
    <button onClick={onSelect} style={styles.moduleItem}>
      <div style={styles.moduleItemMain}>
        <Package size={18} style={{ color: 'var(--sunbelt-orange)' }} />
        <div style={styles.moduleItemText}>
          <span style={styles.moduleSerial}>{module.serial_number}</span>
          <span style={styles.moduleProject}>
            {module.project?.name || 'No Project'}
          </span>
        </div>
      </div>
      <div style={styles.moduleItemMeta}>
        {module.current_station && (
          <span style={styles.stationTag}>
            {module.current_station.name}
          </span>
        )}
        <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
      </div>
    </button>
  );
}

/**
 * StepHeader - Step indicator with module info
 */
function StepHeader({ module, step, totalSteps, title, onBack }) {
  return (
    <div style={styles.stepHeader}>
      <button onClick={onBack} style={styles.backButton}>
        <ChevronLeft size={24} />
      </button>
      <div style={styles.stepInfo}>
        <span style={styles.stepCounter}>Step {step} of {totalSteps}</span>
        <h2 style={styles.stepTitle}>{title}</h2>
        {module && (
          <span style={styles.stepModule}>{module.serial_number}</span>
        )}
      </div>
    </div>
  );
}

/**
 * ChecklistItemComponent - Individual checklist item with Yes/No/NA buttons
 */
function ChecklistItemComponent({ index, item, response, onResponse }) {
  const question = typeof item === 'string' ? item : item.q || item.question || `Item ${index + 1}`;

  return (
    <div style={styles.checklistItem}>
      <div style={styles.checklistQuestion}>
        <span style={styles.questionNumber}>{index + 1}</span>
        <span style={styles.questionText}>{question}</span>
      </div>
      <div style={styles.responseButtons}>
        <button
          onClick={() => onResponse(true)}
          style={{
            ...styles.responseBtn,
            ...(response === true ? styles.responseBtnPass : {})
          }}
        >
          <CheckCircle size={18} />
          <span>Pass</span>
        </button>
        <button
          onClick={() => onResponse(false)}
          style={{
            ...styles.responseBtn,
            ...(response === false ? styles.responseBtnFail : {})
          }}
        >
          <XCircle size={18} />
          <span>Fail</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    padding: '16px',
    height: '100%',
    overflowY: 'auto',
    paddingBottom: '100px'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },

  // Search
  searchBox: {
    position: 'relative',
    marginBottom: '20px'
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  searchSpinner: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)',
    animation: 'spin 1s linear infinite'
  },
  searchResults: {
    marginBottom: '20px'
  },

  // Section
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px'
  },

  // Loading
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '40px',
    color: 'var(--text-secondary)'
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-secondary)'
  },

  // Module List
  moduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  moduleItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left'
  },
  moduleItemMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  moduleItemText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  moduleSerial: {
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  moduleProject: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)'
  },
  moduleItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  stationTag: {
    padding: '4px 8px',
    fontSize: '0.75rem',
    background: 'var(--bg-tertiary)',
    borderRadius: '6px',
    color: 'var(--text-secondary)'
  },

  // Step Header
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-color)'
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    borderRadius: '8px'
  },
  stepInfo: {
    flex: 1
  },
  stepCounter: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase'
  },
  stepTitle: {
    margin: '4px 0 0 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  stepModule: {
    fontSize: '0.875rem',
    color: 'var(--sunbelt-orange)'
  },

  // Checklist
  checklistContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px'
  },
  checklistItem: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '16px'
  },
  checklistQuestion: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px'
  },
  questionNumber: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-tertiary)',
    borderRadius: '50%',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    flexShrink: 0
  },
  questionText: {
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    lineHeight: 1.4
  },
  responseButtons: {
    display: 'flex',
    gap: '10px'
  },
  responseBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    border: '2px solid var(--border-color)',
    borderRadius: '10px',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.9375rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  responseBtnPass: {
    borderColor: 'var(--success)',
    background: 'rgba(34, 197, 94, 0.15)',
    color: 'var(--success)'
  },
  responseBtnFail: {
    borderColor: 'var(--error)',
    background: 'rgba(239, 68, 68, 0.15)',
    color: 'var(--error)'
  },

  // Photos
  photoSection: {
    marginBottom: '24px'
  },
  photoHint: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    marginBottom: '16px'
  },
  captureButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '20px',
    background: 'var(--bg-secondary)',
    border: '2px dashed var(--border-color)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginTop: '16px'
  },
  photoThumb: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  removePhotoBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    border: 'none',
    borderRadius: '50%',
    color: 'white',
    cursor: 'pointer'
  },
  photoCount: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    marginTop: '12px'
  },

  // Navigation
  navButtons: {
    position: 'fixed',
    bottom: '80px',
    left: '16px',
    right: '16px'
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '16px',
    background: 'var(--sunbelt-orange)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Review
  resultCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px',
    background: 'var(--bg-secondary)',
    border: '2px solid',
    borderRadius: '16px',
    marginBottom: '20px'
  },
  resultText: {
    margin: '16px 0 8px 0',
    fontSize: '1.5rem',
    fontWeight: '700'
  },
  resultSubtext: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem'
  },
  summarySection: {
    padding: '16px',
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    marginBottom: '16px'
  },
  summaryTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: '0.9375rem'
  },
  notesSection: {
    marginBottom: '20px'
  },
  notesLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)'
  },
  notesInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    resize: 'none',
    fontFamily: 'inherit'
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: 'var(--error)',
    marginBottom: '16px'
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Complete
  completeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    textAlign: 'center'
  },
  completeTitle: {
    margin: '24px 0 8px 0',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  completeSubtext: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    marginBottom: '24px'
  },
  reworkNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(239, 68, 68, 0.15)',
    borderRadius: '8px',
    color: 'var(--error)',
    marginBottom: '24px'
  },
  newInspectionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    background: 'var(--sunbelt-orange)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  }
};
