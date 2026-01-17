// ============================================================================
// ModuleLookup.jsx - PWA Module Search Page
// ============================================================================
// Provides serial number search with autocomplete for factory floor workers.
// Workers can search by serial number or project name to find modules.
//
// Created: January 17, 2026
// Phase: PWA Phase 2 - Module Lookup
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Search, Package, MapPin, Clock, ChevronRight, X, AlertCircle } from 'lucide-react';
import { useWorkerAuth } from '../contexts/WorkerAuthContext';
import { searchModules, getModuleById, getModuleStatusColor } from '../../services/modulesService';

/**
 * ModuleLookup - Main module search page for PWA
 *
 * @param {Object} props
 * @param {Function} props.onModuleSelect - Callback when module is selected
 * @returns {JSX.Element}
 */
export default function ModuleLookup({ onModuleSelect }) {
  const { factoryId } = useWorkerAuth();

  // Search state
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Selected module state
  const [selectedModule, setSelectedModule] = useState(null);
  const [isLoadingModule, setIsLoadingModule] = useState(false);

  // Recent searches (persisted in localStorage)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('pwa_recent_modules');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ============================================================================
  // DEBOUNCED SEARCH
  // ============================================================================

  useEffect(() => {
    if (!query || query.length < 2 || !factoryId) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const { data, error } = await searchModules(factoryId, query, 10);

        if (error) {
          setSearchError('Search failed. Please try again.');
          setSuggestions([]);
        } else {
          setSuggestions(data || []);
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchError('Search failed. Please try again.');
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, factoryId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle module selection from suggestions
   */
  const handleSelectModule = useCallback(async (module) => {
    setIsLoadingModule(true);
    setQuery('');
    setSuggestions([]);

    try {
      // Fetch full module details
      const { data, error } = await getModuleById(module.id);

      if (error) {
        setSearchError('Failed to load module details.');
        setSelectedModule(null);
      } else {
        setSelectedModule(data);

        // Add to recent searches
        const recent = [
          { id: module.id, serial_number: module.serial_number, project_name: module.project?.name },
          ...recentSearches.filter(r => r.id !== module.id)
        ].slice(0, 5);

        setRecentSearches(recent);
        localStorage.setItem('pwa_recent_modules', JSON.stringify(recent));

        // Notify parent if callback provided
        if (onModuleSelect) {
          onModuleSelect(data);
        }
      }
    } catch (err) {
      console.error('Error loading module:', err);
      setSearchError('Failed to load module details.');
    } finally {
      setIsLoadingModule(false);
    }
  }, [recentSearches, onModuleSelect]);

  /**
   * Clear search and selection
   */
  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setSelectedModule(null);
    setSearchError(null);
  }, []);

  /**
   * Load module from recent searches
   */
  const handleRecentSelect = useCallback((recent) => {
    handleSelectModule({ id: recent.id, serial_number: recent.serial_number, project: { name: recent.project_name } });
  }, [handleSelectModule]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={styles.container}>
      {/* Search Input */}
      <div style={styles.searchContainer}>
        <div style={styles.searchInputWrapper}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by serial # or project..."
            style={styles.searchInput}
            autoComplete="off"
            autoCapitalize="characters"
          />
          {(query || selectedModule) && (
            <button onClick={handleClear} style={styles.clearButton}>
              <X size={18} />
            </button>
          )}
        </div>

        {isSearching && (
          <div style={styles.searchingIndicator}>Searching...</div>
        )}

        {searchError && (
          <div style={styles.errorMessage}>
            <AlertCircle size={16} />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Search Suggestions */}
      {suggestions.length > 0 && !selectedModule && (
        <div style={styles.suggestionsContainer}>
          <div style={styles.suggestionsHeader}>
            {suggestions.length} module{suggestions.length !== 1 ? 's' : ''} found
          </div>
          {suggestions.map((module) => (
            <button
              key={module.id}
              onClick={() => handleSelectModule(module)}
              style={styles.suggestionItem}
            >
              <div style={styles.suggestionMain}>
                <Package size={18} style={{ color: 'var(--sunbelt-orange)' }} />
                <div style={styles.suggestionText}>
                  <span style={styles.serialNumber}>{module.serial_number}</span>
                  <span style={styles.projectName}>{module.project?.name || 'No Project'}</span>
                </div>
              </div>
              <div style={styles.suggestionMeta}>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getModuleStatusColor(module.status) + '20',
                    color: getModuleStatusColor(module.status)
                  }}
                >
                  {module.status}
                </span>
                <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {query.length >= 2 && !isSearching && suggestions.length === 0 && !selectedModule && (
        <div style={styles.noResults}>
          <Package size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
          <p>No modules found for "{query}"</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Try searching by serial number (e.g., NWBS-25250-M1)
          </p>
        </div>
      )}

      {/* Selected Module Detail */}
      {selectedModule && !isLoadingModule && (
        <ModuleDetailCard module={selectedModule} />
      )}

      {/* Loading Module */}
      {isLoadingModule && (
        <div style={styles.loadingModule}>
          <div style={styles.spinner} />
          <span>Loading module details...</span>
        </div>
      )}

      {/* Recent Searches (when no query and no selection) */}
      {!query && !selectedModule && recentSearches.length > 0 && (
        <div style={styles.recentContainer}>
          <div style={styles.recentHeader}>
            <Clock size={16} />
            <span>Recent Searches</span>
          </div>
          {recentSearches.map((recent) => (
            <button
              key={recent.id}
              onClick={() => handleRecentSelect(recent)}
              style={styles.recentItem}
            >
              <Package size={16} style={{ color: 'var(--text-tertiary)' }} />
              <span style={styles.recentSerial}>{recent.serial_number}</span>
              <span style={styles.recentProject}>{recent.project_name}</span>
              <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!query && !selectedModule && recentSearches.length === 0 && (
        <div style={styles.emptyState}>
          <Search size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
          <p>Search for a module</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Enter a serial number or project name to get started
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODULE DETAIL CARD COMPONENT
// ============================================================================

/**
 * ModuleDetailCard - Displays full module information
 */
function ModuleDetailCard({ module }) {
  if (!module) return null;

  const statusColor = getModuleStatusColor(module.status);

  return (
    <div style={styles.moduleCard}>
      {/* Header */}
      <div style={styles.moduleHeader}>
        <div>
          <h2 style={styles.moduleSerial}>{module.serial_number}</h2>
          <p style={styles.moduleName}>{module.name}</p>
        </div>
        <span
          style={{
            ...styles.statusBadgeLarge,
            backgroundColor: statusColor + '20',
            color: statusColor,
            borderColor: statusColor
          }}
        >
          {module.status}
        </span>
      </div>

      {/* Project Info */}
      <div style={styles.infoSection}>
        <div style={styles.infoLabel}>Project</div>
        <div style={styles.infoValue}>
          {module.project?.name || 'N/A'}
          {module.project?.project_number && (
            <span style={styles.projectNumber}> ({module.project.project_number})</span>
          )}
        </div>
      </div>

      {/* Current Station */}
      <div style={styles.infoSection}>
        <div style={styles.infoLabel}>
          <MapPin size={14} style={{ marginRight: 4 }} />
          Current Station
        </div>
        <div style={styles.stationBadge}>
          <span
            style={{
              ...styles.stationDot,
              backgroundColor: module.current_station?.color || '#64748b'
            }}
          />
          {module.current_station?.name || 'Not Assigned'}
          {module.current_station?.code && (
            <span style={styles.stationCode}>{module.current_station.code}</span>
          )}
        </div>
      </div>

      {/* Module Dimensions */}
      {(module.module_width || module.module_length || module.module_height) && (
        <div style={styles.infoSection}>
          <div style={styles.infoLabel}>Dimensions</div>
          <div style={styles.infoValue}>
            {module.module_width || '-'} × {module.module_length || '-'} × {module.module_height || '-'} ft
          </div>
        </div>
      )}

      {/* Building Type */}
      {module.building_category && (
        <div style={styles.infoSection}>
          <div style={styles.infoLabel}>Building Type</div>
          <div style={styles.infoValue} style={{ textTransform: 'capitalize' }}>
            {module.building_category}
          </div>
        </div>
      )}

      {/* Special Requirements */}
      {module.special_requirements?.length > 0 && (
        <div style={styles.infoSection}>
          <div style={styles.infoLabel}>Special Requirements</div>
          <div style={styles.tagContainer}>
            {module.special_requirements.map((req, idx) => (
              <span key={idx} style={styles.tag}>{req}</span>
            ))}
          </div>
        </div>
      )}

      {/* Rush Indicator */}
      {module.is_rush && (
        <div style={styles.rushBanner}>
          <AlertCircle size={16} />
          <span>RUSH ORDER</span>
        </div>
      )}

      {/* Notes */}
      {module.notes && (
        <div style={styles.infoSection}>
          <div style={styles.infoLabel}>Notes</div>
          <div style={styles.notesText}>{module.notes}</div>
        </div>
      )}
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
    overflowY: 'auto'
  },

  // Search
  searchContainer: {
    marginBottom: '16px'
  },
  searchInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 16px',
    gap: '12px'
  },
  searchIcon: {
    color: 'var(--text-tertiary)',
    flexShrink: 0
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    fontFamily: 'inherit'
  },
  clearButton: {
    background: 'transparent',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: 'var(--text-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchingIndicator: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    marginTop: '8px'
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--error)',
    fontSize: '0.875rem',
    marginTop: '8px',
    padding: '8px 12px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px'
  },

  // Suggestions
  suggestionsContainer: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  suggestionsHeader: {
    padding: '12px 16px',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-color)'
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s'
  },
  suggestionMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  suggestionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  serialNumber: {
    fontWeight: '600',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem'
  },
  projectName: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)'
  },
  suggestionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '500'
  },

  // No Results
  noResults: {
    textAlign: 'center',
    padding: '48px 24px',
    color: 'var(--text-secondary)'
  },

  // Loading
  loadingModule: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    gap: '16px',
    color: 'var(--text-secondary)'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid var(--border-color)',
    borderTopColor: 'var(--sunbelt-orange)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  // Recent Searches
  recentContainer: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  recentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-color)'
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    textAlign: 'left'
  },
  recentSerial: {
    fontWeight: '500',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem'
  },
  recentProject: {
    flex: 1,
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    textAlign: 'right',
    marginRight: '8px'
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '64px 24px',
    color: 'var(--text-secondary)'
  },

  // Module Card
  moduleCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px'
  },
  moduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-color)'
  },
  moduleSerial: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0
  },
  moduleName: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    margin: '4px 0 0 0'
  },
  statusBadgeLarge: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.8125rem',
    fontWeight: '600',
    border: '1px solid'
  },
  infoSection: {
    marginBottom: '16px'
  },
  infoLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px'
  },
  infoValue: {
    fontSize: '1rem',
    color: 'var(--text-primary)',
    fontWeight: '500'
  },
  projectNumber: {
    color: 'var(--text-secondary)',
    fontWeight: '400'
  },
  stationBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'var(--bg-tertiary)',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  stationDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  stationCode: {
    color: 'var(--text-tertiary)',
    fontSize: '0.8125rem',
    marginLeft: '4px'
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tag: {
    padding: '4px 10px',
    background: 'var(--bg-tertiary)',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)'
  },
  rushBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#ef4444',
    fontWeight: '600',
    fontSize: '0.875rem',
    marginBottom: '16px'
  },
  notesText: {
    fontSize: '0.9375rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap'
  }
};
