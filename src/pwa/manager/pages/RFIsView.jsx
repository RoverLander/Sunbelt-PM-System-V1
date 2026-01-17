// ============================================================================
// RFIsView.jsx - RFIs View Page for Manager PWA
// ============================================================================
// List and manage RFIs with status filtering.
//
// Created: January 17, 2026
// Phase 4 Implementation
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import { supabase } from '../../../utils/supabaseClient';
import {
  Search,
  Plus,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Mail,
  ExternalLink
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Open', label: 'Open' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Answered', label: 'Answered' },
  { id: 'Closed', label: 'Closed' }
];

const STATUS_COLORS = {
  'Draft': '#6b7280',
  'Open': '#3b82f6',
  'Pending': '#f59e0b',
  'Answered': '#22c55e',
  'Closed': '#6b7280'
};

const PRIORITY_COLORS = {
  'Low': '#6b7280',
  'Medium': '#3b82f6',
  'High': '#f59e0b',
  'Critical': '#ef4444'
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer'
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
    fontSize: '0.8rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  filterChipActive: {
    background: 'var(--accent-primary)',
    borderColor: 'var(--accent-primary)',
    color: 'white'
  },
  filterCount: {
    padding: '2px 6px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '10px',
    fontSize: '0.7rem'
  },
  rfiCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-primary)',
    padding: 'var(--space-md) var(--space-lg)',
    cursor: 'pointer'
  },
  rfiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-sm)'
  },
  rfiNumber: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--accent-primary)',
    marginBottom: '4px'
  },
  rfiSubject: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    flex: 1,
    paddingRight: 'var(--space-sm)'
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.625rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    flexShrink: 0
  },
  rfiMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-md)',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  projectTag: {
    padding: '2px 8px',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  sentTo: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--text-secondary)'
  },
  answeredBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 'var(--radius-sm)',
    color: '#22c55e',
    fontSize: '0.75rem',
    fontWeight: '500',
    marginTop: 'var(--space-sm)'
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

export default function RFIsView({ onCreateRFI }) {
  const { userId, canViewAllProjects } = useManagerAuth();

  const [loading, setLoading] = useState(true);
  const [rfis, setRFIs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [counts, setCounts] = useState({});

  // ==========================================================================
  // FETCH RFIs
  // ==========================================================================

  const fetchRFIs = useCallback(async () => {
    setLoading(true);

    try {
      // First get project IDs the user has access to
      let projectQuery = supabase.from('projects').select('id');

      if (!canViewAllProjects) {
        projectQuery = projectQuery.or(
          `owner_id.eq.${userId},primary_pm_id.eq.${userId},backup_pm_id.eq.${userId}`
        );
      }

      const { data: projects } = await projectQuery;
      const projectIds = projects?.map(p => p.id) || [];

      if (projectIds.length === 0) {
        setRFIs([]);
        setCounts({});
        setLoading(false);
        return;
      }

      // Fetch RFIs
      const { data: rfisData, error } = await supabase
        .from('rfis')
        .select('id, rfi_number, subject, status, priority, due_date, sent_to, answer, project:projects(id, project_number, name)')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate counts
      const newCounts = {
        all: rfisData?.length || 0,
        'Open': 0,
        'Pending': 0,
        'Answered': 0,
        'Closed': 0
      };

      rfisData?.forEach(rfi => {
        if (rfi.status && newCounts[rfi.status] !== undefined) {
          newCounts[rfi.status]++;
        }
      });

      setCounts(newCounts);
      setRFIs(rfisData || []);
    } catch (err) {
      console.error('[RFIsView] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, canViewAllProjects]);

  useEffect(() => {
    if (userId) {
      fetchRFIs();
    }
  }, [userId, fetchRFIs]);

  // ==========================================================================
  // FILTER RFIs
  // ==========================================================================

  const filteredRFIs = rfis.filter(rfi => {
    // Status filter
    if (statusFilter !== 'all' && rfi.status !== statusFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        rfi.rfi_number?.toLowerCase().includes(query) ||
        rfi.subject?.toLowerCase().includes(query) ||
        rfi.sent_to?.toLowerCase().includes(query) ||
        rfi.project?.project_number?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>RFIs</h1>
        <button style={styles.addButton} onClick={onCreateRFI}>
          <Plus size={18} />
          New RFI
        </button>
      </div>

      {/* Search Bar */}
      <div style={styles.searchBar}>
        <Search size={20} color="var(--text-tertiary)" />
        <input
          type="text"
          placeholder="Search RFIs..."
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
            {counts[filter.id] > 0 && (
              <span style={styles.filterCount}>{counts[filter.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* RFIs List */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filteredRFIs.length === 0 ? (
        <div style={styles.emptyState}>
          <MessageSquare size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
          <p>No RFIs found</p>
        </div>
      ) : (
        filteredRFIs.map(rfi => (
          <div key={rfi.id} style={styles.rfiCard}>
            <div style={styles.rfiHeader}>
              <div style={{ flex: 1 }}>
                <div style={styles.rfiNumber}>{rfi.rfi_number}</div>
                <div style={styles.rfiSubject}>{rfi.subject}</div>
              </div>
              <span
                style={{
                  ...styles.statusBadge,
                  background: `${STATUS_COLORS[rfi.status] || '#6b7280'}20`,
                  color: STATUS_COLORS[rfi.status] || '#6b7280'
                }}
              >
                {rfi.status}
              </span>
            </div>

            <div style={styles.rfiMeta}>
              {/* Project */}
              {rfi.project && (
                <span style={styles.projectTag}>
                  {rfi.project.project_number}
                </span>
              )}

              {/* Sent To */}
              {rfi.sent_to && (
                <div style={styles.sentTo}>
                  <Mail size={14} />
                  {rfi.sent_to}
                </div>
              )}

              {/* Due Date */}
              {rfi.due_date && (
                <div style={styles.metaItem}>
                  <Clock size={14} />
                  Due {formatDate(rfi.due_date)}
                </div>
              )}

              {/* Priority */}
              {rfi.priority && rfi.priority !== 'Medium' && (
                <div style={{ ...styles.metaItem, color: PRIORITY_COLORS[rfi.priority] }}>
                  <AlertTriangle size={14} />
                  {rfi.priority}
                </div>
              )}
            </div>

            {/* Show if answered */}
            {rfi.status === 'Answered' && rfi.answer && (
              <div style={styles.answeredBadge}>
                <CheckCircle size={14} />
                Response received
              </div>
            )}
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
