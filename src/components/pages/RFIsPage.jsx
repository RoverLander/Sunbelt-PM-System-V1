// ============================================================================
// RFIsPage.jsx - RFIs Landing Page with Table Layout
// ============================================================================
// Standalone page showing all RFIs for the current user's projects.
// For Directors: Shows all RFIs across all projects
// For PMs: Shows RFIs from their assigned projects
//
// FEATURES:
// - Table layout for proper width handling
// - Stats and filters on same row
// - Filters: status, project, search
// - Stats cards: Open, Overdue, Answered
// - Click row to navigate to project RFIs tab
// - Wider layout (maxWidth: 1600px)
//
// FIXES (Jan 9, 2026):
// - ✅ FIXED: Converted to table layout for full-width display
// - ✅ FIXED: maxWidth increased to 1600px
// - ✅ FIXED: Stats and filters on same row
// - ✅ FIXED: Default filter to 'all'
//
// DEPENDENCIES:
// - supabaseClient: Database operations
// - AuthContext: User authentication
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_COLORS = {
  'Draft': 'var(--text-tertiary)',
  'Open': '#f59e0b',
  'Answered': '#22c55e',
  'Closed': 'var(--text-tertiary)'
};

// Status ordering for sorting (lower number = earlier in workflow)
const STATUS_ORDER = {
  'Draft': 1,
  'Open': 2,
  'Answered': 3,
  'Closed': 4
};

// ============================================================================
// SORTABLE TABLE HEADER COMPONENT
// ============================================================================
function SortableHeader({ label, column, currentSort, onSort, width }) {
  const isActive = currentSort.column === column;
  const direction = isActive ? currentSort.direction : null;

  return (
    <th
      onClick={() => onSort(column)}
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: isActive ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        userSelect: 'none',
        width: width || 'auto',
        transition: 'color 0.15s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sunbelt-orange)'}
      onMouseLeave={(e) => e.currentTarget.style.color = isActive ? 'var(--sunbelt-orange)' : 'var(--text-secondary)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {direction === 'asc' ? (
          <ChevronUp size={14} />
        ) : direction === 'desc' ? (
          <ChevronDown size={14} />
        ) : (
          <ChevronsUpDown size={14} style={{ opacity: 0.4 }} />
        )}
      </div>
    </th>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function RFIsPage({
  isDirectorView = false,
  onNavigateToProject,
  includeBackupProjects = false,
  onToggleBackupProjects,
  initialFilter = null
}) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE - DATA
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [rfis, setRFIs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // ==========================================================================
  // STATE - FILTERS (Default to 'all')
  // ==========================================================================
  const [filterStatus, setFilterStatus] = useState(initialFilter || 'all');
  const [filterProject, setFilterProject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ==========================================================================
  // STATE - SORTING (Default to due_date ascending - most urgent first)
  // ==========================================================================
  const [sort, setSort] = useState({ column: 'due_date', direction: 'asc' });

  // ==========================================================================
  // SORT HANDLER
  // ==========================================================================
  const handleSort = (column) => {
    setSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // ==========================================================================
  // SORT COMPARATOR
  // ==========================================================================
  const sortRFIs = (a, b) => {
    const { column, direction } = sort;
    const multiplier = direction === 'asc' ? 1 : -1;

    switch (column) {
      case 'subject':
        return multiplier * (a.subject || '').localeCompare(b.subject || '');
      case 'project':
        return multiplier * (a.project?.project_number || '').localeCompare(b.project?.project_number || '');
      case 'sent_to':
        return multiplier * (a.sent_to || '').localeCompare(b.sent_to || '');
      case 'status':
        return multiplier * ((STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99));
      case 'due_date':
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return multiplier * 1;
        if (!b.due_date) return multiplier * -1;
        return multiplier * (new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      default:
        return 0;
    }
  };

  // Update filter when initialFilter prop changes
  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
    }
  }, [initialFilter]);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    if (user) fetchData();
  }, [user, isDirectorView, includeBackupProjects]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setCurrentUser(userData);

      // FIX: Removed .or() filter - use client-side filtering to avoid 400 errors in web containers
      const { data: allProjectsData } = await supabase
        .from('projects')
        .select('id, project_number, name, color, owner_id, primary_pm_id, backup_pm_id, created_by');

      // Client-side filter for user's projects
      let projectsData = allProjectsData || [];
      if (!isDirectorView && userData) {
        projectsData = projectsData.filter(p => {
          if (includeBackupProjects) {
            return p.owner_id === userData.id ||
                   p.primary_pm_id === userData.id ||
                   p.backup_pm_id === userData.id ||
                   p.created_by === userData.id;
          } else {
            return p.owner_id === userData.id ||
                   p.primary_pm_id === userData.id ||
                   p.created_by === userData.id;
          }
        });
      }
      setProjects(projectsData);

      const projectIds = projectsData.map(p => p.id);
      const projectIdsSet = new Set(projectIds);

      // FIX: Removed .in() filter - use client-side filtering
      const { data: allRfisData } = await supabase
        .from('rfis')
        .select(`
          *,
          project:project_id(id, project_number, name, color)
        `);

      // Client-side filter and sort
      const rfisData = (allRfisData || [])
        .filter(r => projectIdsSet.has(r.project_id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setRFIs(rfisData);
    } catch (error) {
      console.error('Error fetching RFIs:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FILTER RFIs
  // ==========================================================================
  const filteredRFIs = rfis.filter(rfi => {
    if (filterStatus === 'open' && ['Answered', 'Closed'].includes(rfi.status)) return false;
    if (filterStatus === 'answered' && rfi.status !== 'Answered') return false;
    if (filterStatus === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      if (!rfi.due_date || rfi.due_date >= today || ['Answered', 'Closed'].includes(rfi.status)) return false;
    }

    if (filterProject !== 'all' && rfi.project_id !== filterProject) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!rfi.subject?.toLowerCase().includes(term) &&
          !rfi.project?.project_number?.toLowerCase().includes(term) &&
          !rfi.rfi_number?.toLowerCase().includes(term)) return false;
    }

    return true;
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateString, status) => {
    if (!dateString || ['Answered', 'Closed'].includes(status)) return false;
    return dateString < new Date().toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'var(--text-secondary)';
  };

  // ==========================================================================
  // STATS
  // ==========================================================================
  const stats = {
    total: rfis.filter(r => !['Answered', 'Closed'].includes(r.status)).length,
    overdue: rfis.filter(r => isOverdue(r.due_date, r.status)).length,
    answered: rfis.filter(r => r.status === 'Answered').length
  };

  // ==========================================================================
  // RENDER - LOADING
  // ==========================================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - MAIN
  // ==========================================================================
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FileText size={28} style={{ color: 'var(--sunbelt-orange)' }} />
              {isDirectorView ? 'All RFIs' : 'My RFIs'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {isDirectorView ? 'RFIs across all projects' : 'RFIs from your assigned projects'}
            </p>
          </div>

          {/* Include Backup Projects Toggle */}
          {!isDirectorView && onToggleBackupProjects && (
            <button
              onClick={() => onToggleBackupProjects(!includeBackupProjects)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                background: includeBackupProjects ? 'rgba(249, 115, 22, 0.1)' : 'var(--bg-secondary)',
                border: `1px solid ${includeBackupProjects ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: includeBackupProjects ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: '500',
                transition: 'all 0.15s'
              }}
            >
              {includeBackupProjects ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              Include backup PM projects
            </button>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* STATS + FILTERS ROW                                               */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap'
      }}>
        {/* Stats Cards */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 20px',
            border: '1px solid var(--border-color)',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Open RFIs</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.total}</div>
          </div>
          <div style={{
            background: stats.overdue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 20px',
            border: stats.overdue > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.75rem', color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-secondary)', marginBottom: '2px' }}>Overdue</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{stats.overdue}</div>
          </div>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 20px',
            border: '1px solid var(--border-color)',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Answered</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22c55e' }}>{stats.answered}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem'
            }}
          >
            <option value="all">All RFIs</option>
            <option value="open">Open</option>
            <option value="overdue">Overdue</option>
            <option value="answered">Answered</option>
          </select>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem'
            }}
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.project_number} - {p.name}</option>
            ))}
          </select>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search RFIs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                outline: 'none',
                width: '150px'
              }}
            />
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TABLE                                                             */}
      {/* ================================================================== */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {filteredRFIs.length === 0 ? (
          <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <AlertCircle size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
            <p>No RFIs found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <SortableHeader label="RFI" column="subject" currentSort={sort} onSort={handleSort} />
                  <SortableHeader label="Project" column="project" currentSort={sort} onSort={handleSort} width="180px" />
                  <SortableHeader label="Sent To" column="sent_to" currentSort={sort} onSort={handleSort} width="180px" />
                  <SortableHeader label="Status" column="status" currentSort={sort} onSort={handleSort} width="100px" />
                  <SortableHeader label="Due Date" column="due_date" currentSort={sort} onSort={handleSort} width="120px" />
                </tr>
              </thead>
              <tbody>
                {[...filteredRFIs].sort(sortRFIs).map((rfi, idx) => {
                  const overdue = isOverdue(rfi.due_date, rfi.status);
                  return (
                    <tr
                      key={rfi.id}
                      onClick={() => onNavigateToProject && onNavigateToProject(rfi.project_id, 'rfis')}
                      style={{
                        borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none',
                        cursor: 'pointer',
                        background: overdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = overdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}
                    >
                      {/* RFI Number + Subject */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--sunbelt-orange)', marginRight: '8px' }}>
                            {rfi.rfi_number || `RFI-${String(rfi.number || '').padStart(3, '0')}`}
                          </span>
                          {rfi.subject}
                        </div>
                      </td>

                      {/* Project */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: rfi.project?.color || 'var(--sunbelt-orange)'
                          }} />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {rfi.project?.project_number}
                          </span>
                        </div>
                      </td>

                      {/* Sent To */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {rfi.sent_to || '-'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: `${getStatusColor(rfi.status)}20`,
                          color: getStatusColor(rfi.status)
                        }}>
                          {rfi.status}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: overdue ? 'var(--danger)' : 'var(--text-secondary)',
                          fontWeight: overdue ? '600' : '400',
                          fontSize: '0.8125rem'
                        }}>
                          <Calendar size={14} />
                          {formatDate(rfi.due_date)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default RFIsPage;