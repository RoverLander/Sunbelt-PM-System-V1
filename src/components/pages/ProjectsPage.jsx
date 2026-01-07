// ============================================================================
// ProjectsPage.jsx
// ============================================================================
// Dedicated page for viewing and managing all projects.
// 
// FEATURES:
// - Grid/List view toggle
// - Filter by status, factory
// - Search projects
// - Create new project
// - Click to view project details
//
// DEPENDENCIES:
// - supabaseClient: Database operations
// - CreateProjectModal: For creating new projects
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Grid, List, Building2, 
  Calendar, DollarSign, MapPin, ChevronRight,
  FolderKanban, MoreVertical, Users
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../projects/CreateProjectModal';
import ProjectDetails from '../projects/ProjectDetails';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_COLORS = {
  'Pre-PM': { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b' },
  'Planning': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
  'PM Handoff': { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
  'In Progress': { bg: 'rgba(255, 107, 53, 0.1)', color: '#ff6b35' },
  'On Hold': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  'Completed': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
  'Cancelled': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
  'Warranty': { bg: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ProjectsPage() {
  const { user } = useAuth();
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  
  // View & Filters
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFactory, setFilterFactory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Toast
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          primary_pm:primary_pm_id(id, name),
          backup_pm:backup_pm_id(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      setFilteredProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FILTERING
  // ==========================================================================
  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.project_number?.toLowerCase().includes(query) ||
        p.dealer?.toLowerCase().includes(query) ||
        p.site_address?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Factory filter
    if (filterFactory !== 'all') {
      filtered = filtered.filter(p => p.factory === filterFactory);
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery, filterStatus, filterFactory]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get unique factories for filter dropdown
  const factories = [...new Set(projects.map(p => p.factory).filter(Boolean))];

  // Get unique statuses for filter dropdown
  const statuses = [...new Set(projects.map(p => p.status).filter(Boolean))];

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
    showToast('Project created successfully', 'success');
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
  };

  // ==========================================================================
  // RENDER - Project Details View
  // ==========================================================================
  if (selectedProject) {
    return (
      <ProjectDetails
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onUpdate={handleProjectUpdated}
      />
    );
  }

  // ==========================================================================
  // RENDER - Projects List/Grid
  // ==========================================================================
  return (
    <div>
      {/* ================================================================== */}
      {/* PAGE HEADER                                                       */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-xl)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-xs)'
          }}>
            Projects
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} 
            {filterStatus !== 'all' && ` • ${filterStatus}`}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* ================================================================== */}
      {/* FILTERS & SEARCH BAR                                              */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ 
          flex: 1, 
          minWidth: '250px',
          position: 'relative'
        }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)'
            }} 
          />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.9375rem'
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            minWidth: '140px'
          }}
        >
          <option value="all">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {/* Factory Filter */}
        <select
          value={filterFactory}
          onChange={(e) => setFilterFactory(e.target.value)}
          style={{
            padding: '10px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            minWidth: '180px'
          }}
        >
          <option value="all">All Factories</option>
          {factories.map(factory => (
            <option key={factory} value={factory}>{factory}</option>
          ))}
        </select>

        {/* View Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'grid' ? 'var(--bg-primary)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'list' ? 'var(--bg-primary)' : 'transparent',
              color: viewMode === 'list' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* LOADING STATE                                                     */}
      {/* ================================================================== */}
      {loading && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 'var(--space-xxl)',
          color: 'var(--text-secondary)'
        }}>
          <div className="loading-spinner" style={{ marginRight: 'var(--space-md)' }}></div>
          Loading projects...
        </div>
      )}

      {/* ================================================================== */}
      {/* EMPTY STATE                                                       */}
      {/* ================================================================== */}
      {!loading && filteredProjects.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-xxl)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <FolderKanban size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
            {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'No projects yet'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Create your first project to get started'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={18} /> Create Project
            </button>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* GRID VIEW                                                         */}
      {/* ================================================================== */}
      {!loading && filteredProjects.length > 0 && viewMode === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 'var(--space-lg)'
        }}>
          {filteredProjects.map(project => (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderLeft: `4px solid ${STATUS_COLORS[project.status]?.color || 'var(--border-color)'}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '700', 
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                    lineHeight: 1.3
                  }}>
                    {project.name}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                    {project.project_number || 'No project number'}
                  </p>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: STATUS_COLORS[project.status]?.bg || 'var(--bg-tertiary)',
                  color: STATUS_COLORS[project.status]?.color || 'var(--text-secondary)'
                }}>
                  {project.status}
                </span>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {project.factory && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.8125rem' }}>
                    <Building2 size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{project.factory}</span>
                  </div>
                )}
                {project.dealer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.8125rem' }}>
                    <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{project.dealer}</span>
                  </div>
                )}
                {project.site_address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.8125rem' }}>
                    <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {project.site_address}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: 'var(--space-md)',
                paddingTop: 'var(--space-md)',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                  {project.primary_pm?.name || 'Unassigned'}
                </div>
                {project.contract_value && (
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--success)' }}>
                    {formatCurrency(project.contract_value)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================== */}
      {/* LIST VIEW                                                         */}
      {/* ================================================================== */}
      {!loading && filteredProjects.length > 0 && viewMode === 'list' && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Project</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Factory</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>PM</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Value</th>
                <th style={{ padding: 'var(--space-md)', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => (
                <tr 
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  style={{ 
                    borderTop: index > 0 ? '1px solid var(--border-color)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: 'var(--space-md)' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {project.name}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                      {project.project_number || '-'}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: STATUS_COLORS[project.status]?.bg || 'var(--bg-tertiary)',
                      color: STATUS_COLORS[project.status]?.color || 'var(--text-secondary)'
                    }}>
                      {project.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-md)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {project.factory || '-'}
                  </td>
                  <td style={{ padding: 'var(--space-md)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {project.primary_pm?.name || 'Unassigned'}
                  </td>
                  <td style={{ padding: 'var(--space-md)', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: 'var(--success)' }}>
                    {formatCurrency(project.contract_value)}
                  </td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================================================================== */}
      {/* CREATE PROJECT MODAL                                              */}
      {/* ================================================================== */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
      />

      {/* ================================================================== */}
      {/* TOAST NOTIFICATION                                                */}
      {/* ================================================================== */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: 'var(--space-md) var(--space-lg)',
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1001,
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;