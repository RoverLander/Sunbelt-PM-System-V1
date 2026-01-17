// ============================================================================
// StationMove.jsx - PWA Station Movement Page
// ============================================================================
// Mobile-optimized workflow for moving modules between production stations.
// Supports crew selection, confirmation, and QC gate enforcement.
//
// Created: January 17, 2026
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Clock,
  MapPin,
  Package,
  ChevronRight,
  X,
  Loader2,
  User,
  ClipboardCheck
} from 'lucide-react';
import { useWorkerAuth } from '../contexts/WorkerAuthContext';
import { searchModules, getModuleById, moveModuleToStation } from '../../services/modulesService';
import { getStationTemplates } from '../../services/stationService';
import { getWorkersByStation } from '../../services/workersService';

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS = {
  SELECT_MODULE: 'select_module',
  SELECT_CREW: 'select_crew',
  CONFIRM: 'confirm',
  COMPLETE: 'complete'
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    padding: 'var(--space-md)',
    paddingBottom: '100px',
    minHeight: '100vh',
    background: 'var(--bg-primary)'
  },
  searchSection: {
    marginBottom: 'var(--space-lg)'
  },
  searchInputWrapper: {
    position: 'relative',
    marginBottom: 'var(--space-md)'
  },
  searchInput: {
    width: '100%',
    padding: 'var(--space-md)',
    paddingLeft: '44px',
    fontSize: '16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)'
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  moduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  moduleItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  moduleInfo: {
    flex: 1
  },
  moduleSerial: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '2px'
  },
  moduleMeta: {
    fontSize: '0.813rem',
    color: 'var(--text-secondary)'
  },
  stationBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75rem',
    fontWeight: '500'
  },

  // Step header
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
    paddingBottom: 'var(--space-md)',
    borderBottom: '1px solid var(--border-color)'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    background: 'var(--bg-tertiary)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  stepTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  stepIndicator: {
    marginLeft: 'auto',
    fontSize: '0.875rem',
    color: 'var(--text-tertiary)'
  },

  // Module card (selected)
  selectedModuleCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)'
  },
  selectedModuleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)'
  },
  moduleIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    background: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: '#6366f1'
  },
  selectedModuleInfo: {
    flex: 1
  },
  selectedModuleSerial: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  selectedModuleProject: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },
  stationFlow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    marginTop: 'var(--space-md)'
  },
  stationBox: {
    flex: 1,
    textAlign: 'center'
  },
  stationLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginBottom: '4px'
  },
  stationName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  flowArrow: {
    padding: '0 var(--space-md)',
    color: 'var(--sunbelt-orange)'
  },

  // Crew selection
  crewSection: {
    marginBottom: 'var(--space-lg)'
  },
  crewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  crewItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '2px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  crewItemSelected: {
    borderColor: 'var(--sunbelt-orange)',
    background: 'rgba(249, 115, 22, 0.1)'
  },
  crewCheckbox: {
    width: '24px',
    height: '24px',
    borderRadius: 'var(--radius-sm)',
    border: '2px solid var(--border-color)',
    marginRight: 'var(--space-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
  },
  crewCheckboxSelected: {
    background: 'var(--sunbelt-orange)',
    borderColor: 'var(--sunbelt-orange)'
  },
  crewInfo: {
    flex: 1
  },
  crewName: {
    fontSize: '1rem',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  crewRole: {
    fontSize: '0.813rem',
    color: 'var(--text-secondary)'
  },
  leadBadge: {
    padding: '2px 8px',
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: '500'
  },

  // Confirm section
  confirmCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)'
  },
  confirmRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)'
  },
  confirmIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    flexShrink: 0
  },
  confirmLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginBottom: '2px'
  },
  confirmValue: {
    fontSize: '0.938rem',
    color: 'var(--text-primary)',
    fontWeight: '500'
  },

  // Warning banner
  warningBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-lg)'
  },
  warningIcon: {
    color: '#f59e0b',
    flexShrink: 0,
    marginTop: '2px'
  },
  warningText: {
    fontSize: '0.875rem',
    color: '#f59e0b',
    lineHeight: 1.5
  },

  // Action buttons
  actionButton: {
    width: '100%',
    padding: 'var(--space-lg)',
    fontSize: '1rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    transition: 'all 0.15s ease'
  },
  primaryButton: {
    background: 'var(--sunbelt-orange)',
    color: 'white'
  },
  secondaryButton: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)'
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },

  // Complete state
  completeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xl)',
    textAlign: 'center'
  },
  completeIcon: {
    width: '80px',
    height: '80px',
    background: 'rgba(34, 197, 94, 0.15)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--space-lg)'
  },
  completeTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-sm)'
  },
  completeMessage: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-xl)'
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Module list item for selection
 */
const ModuleListItem = ({ module, onClick }) => {
  const stationColor = module.current_station?.color || '#6366f1';

  return (
    <div style={styles.moduleItem} onClick={onClick}>
      <div style={styles.moduleInfo}>
        <div style={styles.moduleSerial}>{module.serial_number}</div>
        <div style={styles.moduleMeta}>
          {module.project?.name || 'No Project'}
        </div>
        {module.current_station && (
          <div
            style={{
              ...styles.stationBadge,
              background: `${stationColor}20`,
              color: stationColor,
              marginTop: '4px'
            }}
          >
            <MapPin size={12} />
            {module.current_station.name}
          </div>
        )}
      </div>
      <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
    </div>
  );
};

/**
 * Step header with back navigation
 */
const StepHeader = ({ title, step, totalSteps, onBack }) => (
  <div style={styles.stepHeader}>
    <button style={styles.backButton} onClick={onBack}>
      <ArrowLeft size={20} />
    </button>
    <div style={styles.stepTitle}>{title}</div>
    <div style={styles.stepIndicator}>Step {step}/{totalSteps}</div>
  </div>
);

/**
 * Crew member selection item
 */
const CrewItem = ({ worker, selected, onClick }) => (
  <div
    style={{
      ...styles.crewItem,
      ...(selected ? styles.crewItemSelected : {})
    }}
    onClick={onClick}
  >
    <div
      style={{
        ...styles.crewCheckbox,
        ...(selected ? styles.crewCheckboxSelected : {})
      }}
    >
      {selected && <CheckCircle2 size={14} color="white" />}
    </div>
    <div style={styles.crewInfo}>
      <div style={styles.crewName}>{worker.full_name}</div>
      <div style={styles.crewRole}>{worker.title || 'Worker'}</div>
    </div>
    {worker.is_lead && (
      <span style={styles.leadBadge}>Lead</span>
    )}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StationMove() {
  const { worker, factoryId } = useWorkerAuth();

  // Step state
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_MODULE);

  // Module selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Station data
  const [stations, setStations] = useState([]);
  const [nextStation, setNextStation] = useState(null);

  // Crew selection
  const [availableCrew, setAvailableCrew] = useState([]);
  const [selectedCrew, setSelectedCrew] = useState([]);
  const [isLoadingCrew, setIsLoadingCrew] = useState(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [requiresQC, setRequiresQC] = useState(false);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Load stations on mount
  useEffect(() => {
    const loadStations = async () => {
      if (!factoryId) return;
      const { data } = await getStationTemplates(factoryId);
      setStations(data || []);
    };
    loadStations();
  }, [factoryId]);

  // Search modules with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2 && factoryId) {
        setIsSearching(true);
        const { data } = await searchModules(factoryId, searchQuery, 10);
        setSearchResults(data || []);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, factoryId]);

  // Calculate next station when module is selected
  useEffect(() => {
    if (selectedModule && stations.length > 0) {
      const currentStationId = selectedModule.current_station_id || selectedModule.current_station?.id;
      const currentIndex = stations.findIndex(s => s.id === currentStationId);

      if (currentIndex >= 0 && currentIndex < stations.length - 1) {
        const next = stations[currentIndex + 1];
        setNextStation(next);

        // Check if current station requires QC before moving
        const currentStation = stations[currentIndex];
        setRequiresQC(currentStation?.requires_inspection || false);
      } else if (currentIndex === stations.length - 1) {
        // At final station
        setNextStation(null);
      } else {
        // No current station, default to first station
        setNextStation(stations[0]);
      }
    }
  }, [selectedModule, stations]);

  // Load available crew when moving to crew selection
  useEffect(() => {
    const loadCrew = async () => {
      if (currentStep === STEPS.SELECT_CREW && selectedModule) {
        setIsLoadingCrew(true);
        const stationId = selectedModule.current_station_id || selectedModule.current_station?.id;

        if (stationId) {
          const { data } = await getWorkersByStation(stationId);
          setAvailableCrew(data || []);

          // Auto-select current worker if they're in the list
          if (worker) {
            const currentWorkerInList = (data || []).find(w => w.id === worker.id);
            if (currentWorkerInList) {
              setSelectedCrew([worker.id]);
            }
          }
        }
        setIsLoadingCrew(false);
      }
    };
    loadCrew();
  }, [currentStep, selectedModule, worker]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectModule = async (module) => {
    // Fetch full module details
    const { data } = await getModuleById(module.id);
    if (data) {
      setSelectedModule(data);
      setCurrentStep(STEPS.SELECT_CREW);
    }
  };

  const handleToggleCrew = (workerId) => {
    setSelectedCrew(prev => {
      if (prev.includes(workerId)) {
        return prev.filter(id => id !== workerId);
      }
      return [...prev, workerId];
    });
  };

  const handleProceedToConfirm = () => {
    if (selectedCrew.length === 0) {
      setError('Please select at least one crew member');
      return;
    }
    setError(null);
    setCurrentStep(STEPS.CONFIRM);
  };

  const handleConfirmMove = async () => {
    if (!selectedModule || !nextStation) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // The lead is the current worker (must be a lead to use this app)
      const leadId = worker?.id;

      const { data, error: moveError, validation } = await moveModuleToStation(
        selectedModule.id,
        nextStation.id,
        leadId,
        selectedCrew
      );

      if (moveError) {
        // Check if it's a validation error (like QC required)
        if (validation && !validation.valid) {
          setError(validation.error || 'Cannot move module at this time');
        } else {
          setError(moveError.message || 'Failed to move module');
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      setCurrentStep(STEPS.COMPLETE);
    } catch (err) {
      console.error('Move error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setError(null);
    switch (currentStep) {
      case STEPS.SELECT_CREW:
        setSelectedModule(null);
        setSelectedCrew([]);
        setCurrentStep(STEPS.SELECT_MODULE);
        break;
      case STEPS.CONFIRM:
        setCurrentStep(STEPS.SELECT_CREW);
        break;
      default:
        break;
    }
  };

  const handleStartOver = () => {
    setCurrentStep(STEPS.SELECT_MODULE);
    setSelectedModule(null);
    setNextStation(null);
    setSelectedCrew([]);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setRequiresQC(false);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderSelectedModuleCard = () => {
    if (!selectedModule) return null;

    const currentStation = selectedModule.current_station;

    return (
      <div style={styles.selectedModuleCard}>
        <div style={styles.selectedModuleHeader}>
          <div style={styles.moduleIcon}>
            <Package size={24} />
          </div>
          <div style={styles.selectedModuleInfo}>
            <div style={styles.selectedModuleSerial}>{selectedModule.serial_number}</div>
            <div style={styles.selectedModuleProject}>
              {selectedModule.project?.name || 'No Project'}
            </div>
          </div>
        </div>

        {nextStation && (
          <div style={styles.stationFlow}>
            <div style={styles.stationBox}>
              <div style={styles.stationLabel}>FROM</div>
              <div style={styles.stationName}>
                {currentStation?.name || 'Not Assigned'}
              </div>
            </div>
            <div style={styles.flowArrow}>
              <ArrowRight size={24} />
            </div>
            <div style={styles.stationBox}>
              <div style={styles.stationLabel}>TO</div>
              <div style={{...styles.stationName, color: 'var(--sunbelt-orange)'}}>
                {nextStation.name}
              </div>
            </div>
          </div>
        )}

        {!nextStation && currentStation && (
          <div style={styles.warningBanner}>
            <AlertTriangle size={20} style={styles.warningIcon} />
            <div style={styles.warningText}>
              This module is at the final station. Use the "Complete Module" action instead.
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER: Step 1 - Select Module
  // ============================================================================

  const renderSelectModule = () => (
    <div>
      <div style={styles.searchSection}>
        <div style={styles.searchInputWrapper}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search by serial or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {isSearching && (
        <div style={styles.loadingContainer}>
          <Loader2 size={24} style={styles.spinner} />
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div>
          <div style={styles.sectionTitle}>Search Results</div>
          <div style={styles.moduleList}>
            {searchResults.map(module => (
              <ModuleListItem
                key={module.id}
                module={module}
                onClick={() => handleSelectModule(module)}
              />
            ))}
          </div>
        </div>
      )}

      {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div style={styles.emptyState}>
          <Package size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3 }} />
          <p>No modules found matching "{searchQuery}"</p>
        </div>
      )}

      {!isSearching && searchQuery.length < 2 && (
        <div style={styles.emptyState}>
          <Search size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3 }} />
          <p>Enter a serial number or project name to search</p>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // RENDER: Step 2 - Select Crew
  // ============================================================================

  const renderSelectCrew = () => (
    <div>
      <StepHeader
        title="Select Crew"
        step={1}
        totalSteps={2}
        onBack={handleBack}
      />

      {renderSelectedModuleCard()}

      {requiresQC && (
        <div style={styles.warningBanner}>
          <ClipboardCheck size={20} style={styles.warningIcon} />
          <div style={styles.warningText}>
            <strong>QC Inspection Required:</strong> This station requires a QC inspection before the module can be moved. Complete the inspection first.
          </div>
        </div>
      )}

      <div style={styles.crewSection}>
        <div style={styles.sectionTitle}>Crew Members</div>

        {isLoadingCrew && (
          <div style={styles.loadingContainer}>
            <Loader2 size={24} style={styles.spinner} />
          </div>
        )}

        {!isLoadingCrew && availableCrew.length > 0 && (
          <div style={styles.crewList}>
            {availableCrew.map(crewMember => (
              <CrewItem
                key={crewMember.id}
                worker={crewMember}
                selected={selectedCrew.includes(crewMember.id)}
                onClick={() => handleToggleCrew(crewMember.id)}
              />
            ))}
          </div>
        )}

        {!isLoadingCrew && availableCrew.length === 0 && (
          <div style={styles.emptyState}>
            <Users size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3 }} />
            <p>No crew members assigned to this station</p>
          </div>
        )}
      </div>

      {error && (
        <div style={{...styles.warningBanner, background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)'}}>
          <AlertTriangle size={20} style={{...styles.warningIcon, color: '#ef4444'}} />
          <div style={{...styles.warningText, color: '#ef4444'}}>{error}</div>
        </div>
      )}

      <button
        style={{
          ...styles.actionButton,
          ...styles.primaryButton,
          ...(selectedCrew.length === 0 || !nextStation ? styles.disabledButton : {})
        }}
        onClick={handleProceedToConfirm}
        disabled={selectedCrew.length === 0 || !nextStation}
      >
        Continue to Confirm
        <ArrowRight size={20} />
      </button>
    </div>
  );

  // ============================================================================
  // RENDER: Step 3 - Confirm Move
  // ============================================================================

  const renderConfirm = () => {
    const selectedCrewNames = availableCrew
      .filter(w => selectedCrew.includes(w.id))
      .map(w => w.full_name)
      .join(', ');

    return (
      <div>
        <StepHeader
          title="Confirm Move"
          step={2}
          totalSteps={2}
          onBack={handleBack}
        />

        <div style={styles.confirmCard}>
          <div style={styles.confirmRow}>
            <div style={styles.confirmIcon}>
              <Package size={18} />
            </div>
            <div>
              <div style={styles.confirmLabel}>Module</div>
              <div style={styles.confirmValue}>{selectedModule?.serial_number}</div>
            </div>
          </div>

          <div style={styles.confirmRow}>
            <div style={styles.confirmIcon}>
              <MapPin size={18} />
            </div>
            <div>
              <div style={styles.confirmLabel}>Moving From</div>
              <div style={styles.confirmValue}>
                {selectedModule?.current_station?.name || 'Not Assigned'}
              </div>
            </div>
          </div>

          <div style={styles.confirmRow}>
            <div style={styles.confirmIcon}>
              <ArrowRight size={18} />
            </div>
            <div>
              <div style={styles.confirmLabel}>Moving To</div>
              <div style={{...styles.confirmValue, color: 'var(--sunbelt-orange)'}}>
                {nextStation?.name}
              </div>
            </div>
          </div>

          <div style={styles.confirmRow}>
            <div style={styles.confirmIcon}>
              <Users size={18} />
            </div>
            <div>
              <div style={styles.confirmLabel}>Crew ({selectedCrew.length})</div>
              <div style={styles.confirmValue}>{selectedCrewNames}</div>
            </div>
          </div>

          <div style={{...styles.confirmRow, marginBottom: 0}}>
            <div style={styles.confirmIcon}>
              <User size={18} />
            </div>
            <div>
              <div style={styles.confirmLabel}>Lead</div>
              <div style={styles.confirmValue}>{worker?.full_name || 'You'}</div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{...styles.warningBanner, background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)'}}>
            <AlertTriangle size={20} style={{...styles.warningIcon, color: '#ef4444'}} />
            <div style={{...styles.warningText, color: '#ef4444'}}>{error}</div>
          </div>
        )}

        <button
          style={{
            ...styles.actionButton,
            ...styles.primaryButton,
            ...(isSubmitting ? styles.disabledButton : {})
          }}
          onClick={handleConfirmMove}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} style={styles.spinner} />
              Moving...
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              Confirm Move
            </>
          )}
        </button>
      </div>
    );
  };

  // ============================================================================
  // RENDER: Step 4 - Complete
  // ============================================================================

  const renderComplete = () => (
    <div style={styles.completeContainer}>
      <div style={styles.completeIcon}>
        <CheckCircle2 size={40} color="#22c55e" />
      </div>
      <div style={styles.completeTitle}>Module Moved!</div>
      <div style={styles.completeMessage}>
        <strong>{selectedModule?.serial_number}</strong> has been moved to{' '}
        <strong>{nextStation?.name}</strong>
      </div>

      <button
        style={{...styles.actionButton, ...styles.primaryButton, width: 'auto', padding: 'var(--space-md) var(--space-xl)'}}
        onClick={handleStartOver}
      >
        Move Another Module
      </button>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div style={styles.container}>
      {currentStep === STEPS.SELECT_MODULE && renderSelectModule()}
      {currentStep === STEPS.SELECT_CREW && renderSelectCrew()}
      {currentStep === STEPS.CONFIRM && renderConfirm()}
      {currentStep === STEPS.COMPLETE && renderComplete()}
    </div>
  );
}
