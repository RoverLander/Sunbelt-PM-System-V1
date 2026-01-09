// ============================================================================
// SubmittalsPage Component
// ============================================================================
// Standalone page showing all submittals for the current user's projects.
// For Directors: Shows all submittals across all projects
// For PMs: Shows submittals from their assigned projects
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Calendar,
  User,
  FolderKanban,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function SubmittalsPage({ isDirectorView = false, onNavigateToProject }) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submittals, setSubmittals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('pending');
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
        // Include projects where user is: PM (owner_id), Backup PM, or Creator
        projectsQuery = projectsQuery.or(`owner_id.eq.${userData.id},backup_pm_id.eq.${userData.id},created_by.eq.${userData.id}`);
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
    const pendingStatuses = ['Pending', 'Submitted', 'Under Review'];
    const approvedStatuses = ['Approved', 'Approved as Noted'];
    
    if (filterStatus === 'pending' && !pendingStatuses.includes(submittal.status)) return false;
    if (filterStatus === 'approved' && !approvedStatuses.includes(submittal.status)) return false;
    if (filterStatus === 'rejected' && submittal.status !== 'Rejected' && submittal.status !== 'Revise and Resubmit') return false;
    if (filterStatus === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      if (!submittal.due_date || submittal.due_date >= today || approvedStatuses.includes(submittal.status) || submittal.status === 'Rejected') return false;
    }

    if (filterProject !== 'all' && submittal.project_id !== filterProject) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!submittal.title?.toLowerCase().includes(term) && 
          !submittal.project?.project_number?.toLowerCase().includes(term) &&
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
    const approvedStatuses = ['Approved', 'Approved as Noted', 'Rejected'];
    if (!dateString || approvedStatuses.includes(status)) return false;
    return dateString < new Date().toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'var(--text-tertiary)',
      'Submitted': '#3b82f6',
      'Under Review': '#f59e0b',
      'Approved': '#22c55e',
      'Approved as Noted': '#84cc16',
      'Revise and Resubmit': '#f59e0b',
      'Rejected': '#ef4444'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  const getStatusIcon = (status) => {
    if (['Approved', 'Approved as Noted'].includes(status)) return CheckCircle;
    if (status === 'Rejected') return XCircle;
    if (status === 'Revise and Resubmit') return AlertTriangle;
    return ClipboardList;
  };

  const pendingStatuses = ['Pending', 'Submitted', 'Under Review'];
  const stats = {
    pending: submittals.filter(s => pendingStatuses.includes(s.status)).length,
    overdue: submittals.filter(s => isOverdue(s.due_date, s.status)).length,
    approved: submittals.filter(s => ['Approved', 'Approved as Noted'].includes(s.status)).length
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ClipboardList size={28} style={{ color: 'var(--sunbelt-orange)' }} />
          {isDirectorView ? 'All Submittals' : 'My Submittals'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {isDirectorView ? 'Submittals across all projects' : 'Submittals from your assigned projects'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: 'var(--space-lg)' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Pending</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.pending}</div>
        </div>
        <div style={{ background: stats.overdue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: stats.overdue > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-secondary)', marginBottom: '4px' }}>Overdue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{stats.overdue}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Approved</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>{stats.approved}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
        >
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected/Revise</option>
          <option value="all">All</option>
        </select>

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.project_number}</option>
          ))}
        </select>

        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search submittals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {/* Submittals List */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {filteredSubmittals.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No submittals match your filters</p>
          </div>
        ) : (
          <div>
            {filteredSubmittals.map((submittal, idx) => {
              const StatusIcon = getStatusIcon(submittal.status);
              return (
                <div
                  key={submittal.id}
                  onClick={() => onNavigateToProject && onNavigateToProject(submittal.project_id, 'submittals')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: idx < filteredSubmittals.length - 1 ? '1px solid var(--border-color)' : 'none',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Status indicator */}
                  <StatusIcon 
                    size={18} 
                    style={{ color: getStatusColor(submittal.status), flexShrink: 0 }}
                  />

                  {/* Main content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: '2px' }}>
                      {submittal.spec_section && (
                        <span style={{ color: 'var(--sunbelt-orange)', marginRight: '8px' }}>
                          {submittal.spec_section}
                        </span>
                      )}
                      {submittal.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FolderKanban size={12} />
                        {submittal.project?.project_number}
                      </span>
                      {submittal.sent_to && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          {submittal.sent_to}
                        </span>
                      )}
                      {submittal.revision_number > 0 && (
                        <span>Rev {submittal.revision_number}</span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    background: `${getStatusColor(submittal.status)}20`,
                    color: getStatusColor(submittal.status),
                    minWidth: '90px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    {submittal.status}
                  </span>

                  {/* Due date */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8125rem',
                    color: isOverdue(submittal.due_date, submittal.status) ? 'var(--danger)' : 'var(--text-secondary)',
                    fontWeight: isOverdue(submittal.due_date, submittal.status) ? '600' : '400',
                    minWidth: '70px'
                  }}>
                    <Calendar size={14} />
                    {formatDate(submittal.due_date)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SubmittalsPage;