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
  AlertCircle
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function RFIsPage({ isDirectorView = false, onNavigateToProject }) {
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    if (user) fetchData();
  }, [user, isDirectorView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setCurrentUser(userData);

      let projectsQuery = supabase.from('projects').select('id, project_number, name, color');

      if (!isDirectorView && userData) {
        projectsQuery = projectsQuery.or(`owner_id.eq.${userData.id},primary_pm_id.eq.${userData.id},backup_pm_id.eq.${userData.id},created_by.eq.${userData.id}`);
      }

      const { data: projectsData } = await projectsQuery;
      setProjects(projectsData || []);

      const projectIds = (projectsData || []).map(p => p.id);

      if (projectIds.length > 0) {
        const { data: rfisData } = await supabase
          .from('rfis')
          .select(`
            *,
            project:project_id(id, project_number, name, color)
          `)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        setRFIs(rfisData || []);
      } else {
        setRFIs([]);
      }
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
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>RFI</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '180px'
                  }}>Project</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '180px'
                  }}>Sent To</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '100px'
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '120px'
                  }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRFIs.map((rfi, idx) => {
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