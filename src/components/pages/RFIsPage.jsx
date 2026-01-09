// ============================================================================
// RFIsPage Component
// ============================================================================
// Standalone page showing all RFIs for the current user's projects.
// For Directors: Shows all RFIs across all projects
// For PMs: Shows RFIs from their assigned projects
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Calendar,
  User,
  FolderKanban,
  Clock,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function RFIsPage({ isDirectorView = false, onNavigateToProject }) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [rfis, setRFIs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('open');
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
    const colors = {
      'Draft': 'var(--text-tertiary)',
      'Open': '#f59e0b',
      'Answered': '#22c55e',
      'Closed': 'var(--text-tertiary)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  const stats = {
    total: rfis.filter(r => !['Answered', 'Closed'].includes(r.status)).length,
    overdue: rfis.filter(r => isOverdue(r.due_date, r.status)).length,
    answered: rfis.filter(r => r.status === 'Answered').length
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
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={28} style={{ color: 'var(--sunbelt-orange)' }} />
          {isDirectorView ? 'All RFIs' : 'My RFIs'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {isDirectorView ? 'RFIs across all projects' : 'RFIs from your assigned projects'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: 'var(--space-lg)' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Open RFIs</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.total}</div>
        </div>
        <div style={{ background: stats.overdue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: stats.overdue > 0 ? '1px solid var(--danger)' : '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-secondary)', marginBottom: '4px' }}>Overdue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{stats.overdue}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Answered</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>{stats.answered}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
        >
          <option value="open">Open</option>
          <option value="overdue">Overdue</option>
          <option value="answered">Answered</option>
          <option value="all">All RFIs</option>
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
            placeholder="Search RFIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {/* RFIs List */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {filteredRFIs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FileText size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No RFIs match your filters</p>
          </div>
        ) : (
          <div>
            {filteredRFIs.map((rfi, idx) => (
              <div
                key={rfi.id}
                onClick={() => onNavigateToProject && onNavigateToProject(rfi.project_id, 'rfis')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderBottom: idx < filteredRFIs.length - 1 ? '1px solid var(--border-color)' : 'none',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Status indicator */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getStatusColor(rfi.status),
                  flexShrink: 0
                }} />

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: '2px' }}>
                    <span style={{ color: 'var(--sunbelt-orange)', marginRight: '8px' }}>
                      {rfi.rfi_number || `RFI-${String(rfi.number || '').padStart(3, '0')}`}
                    </span>
                    {rfi.subject}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FolderKanban size={12} />
                      {rfi.project?.project_number}
                    </span>
                    {rfi.sent_to && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        {rfi.sent_to}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  background: `${getStatusColor(rfi.status)}20`,
                  color: getStatusColor(rfi.status),
                  minWidth: '70px',
                  textAlign: 'center'
                }}>
                  {rfi.status}
                </span>

                {/* Due date */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8125rem',
                  color: isOverdue(rfi.due_date, rfi.status) ? 'var(--danger)' : 'var(--text-secondary)',
                  fontWeight: isOverdue(rfi.due_date, rfi.status) ? '600' : '400',
                  minWidth: '70px'
                }}>
                  <Calendar size={14} />
                  {formatDate(rfi.due_date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RFIsPage;