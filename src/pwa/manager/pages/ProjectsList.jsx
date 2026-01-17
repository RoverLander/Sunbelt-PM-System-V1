// ============================================================================
// ProjectsList.jsx - Projects List Page for Manager PWA
// ============================================================================
// Filterable, searchable list of projects based on user role.
//
// Created: January 17, 2026
// Phase 2 Implementation
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import { supabase } from '../../../utils/supabaseClient';
import {
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'production', label: 'Production' },
  { id: 'completed', label: 'Completed' }
];

const HEALTH_COLORS = {
  'On Track': '#22c55e',
  'At Risk': '#f59e0b',
  'Critical': '#ef4444'
};

const STATUS_COLORS = {
  'Draft': '#6b7280',
  'Planning': '#3b82f6',
  'In Progress': '#8b5cf6',
  'Production': '#f59e0b',
  'Complete': '#22c55e',
  'Completed': '#22c55e',
  'On Hold': '#ef4444'
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
    width: '100%',
    maxWidth: '100%'
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'var(--bg-secondary)',
    borderRadius: '10px',
    border: '1px solid var(--border-primary)'
  },
  toggleLabel: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  toggle: {
    position: 'relative',
    width: '44px',
    height: '24px',
    background: 'var(--border-primary)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    border: 'none',
    padding: 0
  },
  toggleActive: {
    background: '#FF6B35'
  },
  toggleKnob: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '20px',
    height: '20px',
    background: 'white',
    borderRadius: '50%',
    transition: 'transform 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
  },
  toggleKnobActive: {
    transform: 'translateX(20px)'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)'
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '1rem',
    color: 'var(--text-primary)'
  },
  filterRow: {
    display: 'flex',
    gap: 'var(--space-sm)',
    overflowX: 'auto',
    paddingBottom: 'var(--space-xs)',
    WebkitOverflowScrolling: 'touch'
  },
  filterChip: {
    padding: 'var(--space-xs) var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  },
  filterChipActive: {
    background: 'var(--accent-primary)',
    borderColor: 'var(--accent-primary)',
    color: 'white'
  },
  projectCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    padding: 'var(--space-lg)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
  },
  projectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-sm)'
  },
  projectNumber: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--accent-primary)',
    textTransform: 'uppercase'
  },
  projectName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginTop: '4px',
    lineHeight: '1.3'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.625rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  projectMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-md)',
    marginTop: 'var(--space-md)',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  healthIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '4px'
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-tertiary)'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProjectsList({ onSelectProject }) {
  const { userId, canViewAllProjects } = useManagerAuth();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [includeBackups, setIncludeBackups] = useState(true);

  // ==========================================================================
  // FETCH PROJECTS
  // ==========================================================================

  const fetchProjects = useCallback(async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('projects')
        .select('id, project_number, name, status, health_status, delivery_date, factory, client_name, module_count')
        .order('delivery_date', { ascending: true });

      // Role-based filtering with backup toggle
      if (!canViewAllProjects) {
        const pmFilter = includeBackups
          ? `owner_id.eq.${userId},primary_pm_id.eq.${userId},backup_pm_id.eq.${userId}`
          : `owner_id.eq.${userId},primary_pm_id.eq.${userId}`;
        query = query.or(pmFilter);
      }

      // Status filtering
      if (statusFilter === 'active') {
        query = query.in('status', ['Planning', 'In Progress', 'Production']);
      } else if (statusFilter === 'production') {
        query = query.eq('status', 'Production');
      } else if (statusFilter === 'completed') {
        query = query.in('status', ['Complete', 'Completed']);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('[ProjectsList] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, canViewAllProjects, statusFilter, includeBackups]);

  useEffect(() => {
    if (userId) {
      fetchProjects();
    }
  }, [userId, fetchProjects]);

  // ==========================================================================
  // FILTER BY SEARCH
  // ==========================================================================

  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.project_number?.toLowerCase().includes(query) ||
      project.name?.toLowerCase().includes(query) ||
      project.client_name?.toLowerCase().includes(query)
    );
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div style={styles.container}>
      {/* Backup Jobs Toggle - only show for non-admin users */}
      {!canViewAllProjects && (
        <div style={styles.toggleRow}>
          <span style={styles.toggleLabel}>Include backup jobs</span>
          <button
            style={{
              ...styles.toggle,
              ...(includeBackups ? styles.toggleActive : {})
            }}
            onClick={() => setIncludeBackups(!includeBackups)}
          >
            <span
              style={{
                ...styles.toggleKnob,
                ...(includeBackups ? styles.toggleKnobActive : {})
              }}
            />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div style={styles.searchBar}>
        <Search size={20} color="var(--text-tertiary)" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Filter Chips */}
      <div style={styles.filterRow}>
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id)}
            style={{
              ...styles.filterChip,
              ...(statusFilter === filter.id ? styles.filterChipActive : {})
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Projects List */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={styles.emptyState}>
          <Building2 size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
          <p>No projects found</p>
        </div>
      ) : (
        filteredProjects.map(project => (
          <div
            key={project.id}
            style={styles.projectCard}
            onClick={() => onSelectProject?.(project)}
          >
            <div style={styles.projectHeader}>
              <div>
                <div style={styles.projectNumber}>{project.project_number}</div>
                <div style={styles.projectName}>{project.name}</div>
              </div>
              <span
                style={{
                  ...styles.statusBadge,
                  background: `${STATUS_COLORS[project.status] || '#6b7280'}20`,
                  color: STATUS_COLORS[project.status] || '#6b7280'
                }}
              >
                {project.status}
              </span>
            </div>

            <div style={styles.projectMeta}>
              {/* Health Status */}
              {project.health_status && (
                <div style={styles.metaItem}>
                  <span
                    style={{
                      ...styles.healthIndicator,
                      background: HEALTH_COLORS[project.health_status] || '#6b7280'
                    }}
                  />
                  {project.health_status}
                </div>
              )}

              {/* Delivery Date */}
              <div style={styles.metaItem}>
                <Calendar size={14} />
                {formatDate(project.delivery_date)}
              </div>

              {/* Factory */}
              {project.factory && (
                <div style={styles.metaItem}>
                  <Building2 size={14} />
                  {project.factory}
                </div>
              )}

              {/* Module Count */}
              {project.module_count > 0 && (
                <div style={styles.metaItem}>
                  {project.module_count} modules
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
