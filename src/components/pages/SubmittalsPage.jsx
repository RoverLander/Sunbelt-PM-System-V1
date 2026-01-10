// ============================================================================
// SubmittalsPage.jsx - Submittals Landing Page with Table Layout
// ============================================================================
// Standalone page showing all submittals for the current user's projects.
// For Directors: Shows all submittals across all projects
// For PMs: Shows submittals from their assigned projects
//
// FEATURES:
// - Table layout for proper width handling
// - Stats and filters on same row
// - Filters: status, project, search
// - Stats cards: Pending, Overdue, Approved
// - Click row to navigate to project Submittals tab
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
  ClipboardList,
  Search,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_COLORS = {
  'Draft': 'var(--text-tertiary)',
  'Submitted': '#f59e0b',
  'Pending': '#f59e0b',
  'Under Review': 'var(--sunbelt-orange)',
  'Approved': '#22c55e',
  'Approved as Noted': '#22c55e',
  'Rejected': '#ef4444',
  'Revise and Resubmit': '#ef4444',
  'Closed': 'var(--text-tertiary)'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SubmittalsPage({
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
  const [submittals, setSubmittals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // ==========================================================================
  // STATE - FILTERS (Default to 'all')
  // ==========================================================================
  const [filterStatus, setFilterStatus] = useState(initialFilter || 'all');
  const [filterProject, setFilterProject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

      let projectsQuery = supabase.from('projects').select('id, project_number, name, color');

      if (!isDirectorView && userData) {
        if (includeBackupProjects) {
          projectsQuery = projectsQuery.or(`owner_id.eq.${userData.id},primary_pm_id.eq.${userData.id},backup_pm_id.eq.${userData.id},created_by.eq.${userData.id}`);
        } else {
          projectsQuery = projectsQuery.or(`owner_id.eq.${userData.id},primary_pm_id.eq.${userData.id},created_by.eq.${userData.id}`);
        }
      }

      const { data: projectsData } = await projectsQuery;
      setProjects(projectsData || []);

      const projectIds = (projectsData || []).map(p => p.id);

      if (projectIds.length > 0) {
        const { data: submittalsData } = await supabase
          .from('submittals')
          .select(`
            *,
            project:project_id(id, project_number, name, color)
          `)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        setSubmittals(submittalsData || []);
      } else {
        setSubmittals([]);
      }
    } catch (error) {
      console.error('Error fetching submittals:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FILTER SUBMITTALS
  // ==========================================================================
  const filteredSubmittals = submittals.filter(submittal => {
    const closedStatuses = ['Approved', 'Approved as Noted', 'Closed'];
    const rejectedStatuses = ['Rejected', 'Revise and Resubmit'];

    if (filterStatus === 'pending' && [...closedStatuses, ...rejectedStatuses].includes(submittal.status)) return false;
    if (filterStatus === 'approved' && !['Approved', 'Approved as Noted'].includes(submittal.status)) return false;
    if (filterStatus === 'rejected' && !rejectedStatuses.includes(submittal.status)) return false;
    if (filterStatus === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      if (!submittal.due_date || submittal.due_date >= today || closedStatuses.includes(submittal.status)) return false;
    }

    if (filterProject !== 'all' && submittal.project_id !== filterProject) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!submittal.title?.toLowerCase().includes(term) &&
          !submittal.project?.project_number?.toLowerCase().includes(term) &&
          !submittal.submittal_number?.toLowerCase().includes(term) &&
          !submittal.spec_section?.toLowerCase().includes(term)) return false;
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
    const closedStatuses = ['Approved', 'Approved as Noted', 'Closed'];
    if (!dateString || closedStatuses.includes(status)) return false;
    return dateString < new Date().toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'var(--text-secondary)';
  };

  // ==========================================================================
  // STATS
  // ==========================================================================
  const closedStatuses = ['Approved', 'Approved as Noted', 'Closed'];
  const stats = {
    pending: submittals.filter(s => !closedStatuses.includes(s.status) && !['Rejected', 'Revise and Resubmit'].includes(s.status)).length,
    overdue: submittals.filter(s => isOverdue(s.due_date, s.status)).length,
    approved: submittals.filter(s => ['Approved', 'Approved as Noted'].includes(s.status)).length
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
              <ClipboardList size={28} style={{ color: 'var(--sunbelt-orange)' }} />
              {isDirectorView ? 'All Submittals' : 'My Submittals'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {isDirectorView ? 'Submittals across all projects' : 'Submittals from your assigned projects'}
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Pending</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.pending}</div>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Approved</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22c55e' }}>{stats.approved}</div>
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
            <option value="all">All Submittals</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected/Revise</option>
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
              placeholder="Search submittals..."
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
        {filteredSubmittals.length === 0 ? (
          <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <AlertCircle size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
            <p>No submittals found</p>
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
                  }}>Submittal</th>
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
                    width: '130px'
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
                {filteredSubmittals.map((submittal, idx) => {
                  const overdue = isOverdue(submittal.due_date, submittal.status);
                  return (
                    <tr
                      key={submittal.id}
                      onClick={() => onNavigateToProject && onNavigateToProject(submittal.project_id, 'submittals')}
                      style={{
                        borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none',
                        cursor: 'pointer',
                        background: overdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = overdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}
                    >
                      {/* Submittal Number + Title */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          {submittal.spec_section && (
                            <span style={{ color: 'var(--sunbelt-orange)', marginRight: '8px' }}>
                              {submittal.spec_section}
                            </span>
                          )}
                          {submittal.title}
                        </div>
                        {submittal.revision_number > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            Rev {submittal.revision_number}
                          </div>
                        )}
                      </td>

                      {/* Project */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: submittal.project?.color || 'var(--sunbelt-orange)'
                          }} />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {submittal.project?.project_number}
                          </span>
                        </div>
                      </td>

                      {/* Sent To */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {submittal.sent_to || submittal.external_assignee_email || '-'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: `${getStatusColor(submittal.status)}20`,
                          color: getStatusColor(submittal.status)
                        }}>
                          {submittal.status}
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
                          {formatDate(submittal.due_date)}
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

export default SubmittalsPage;