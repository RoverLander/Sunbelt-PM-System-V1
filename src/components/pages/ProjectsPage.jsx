// ============================================================================
// ProjectsPage Component
// ============================================================================
// Standalone page showing projects list.
// For Directors: Shows all projects
// For PMs: Shows their assigned projects (primary + secondary)
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  ChevronRight,
  Calendar,
  User,
  Building2,
  Filter
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProjectDetails from '../projects/ProjectDetails';
import CreateProjectModal from '../projects/CreateProjectModal';

function ProjectsPage({ isDirectorView = false }) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterPM, setFilterPM] = useState('all');
  const [filterFactory, setFilterFactory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [toast, setToast] = useState(null);

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

      // Get users for filter
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('is_active', true);
      setUsers(usersData || []);

      // Get projects
      let projectsQuery = supabase
        .from('projects')
        .select(`
          *,
          pm:pm_id(id, name),
          secondary_pm:secondary_pm_id(id, name)
        `)
        .order('updated_at', { ascending: false });

      if (!isDirectorView && userData) {
        projectsQuery = projectsQuery.or(`pm_id.eq.${userData.id},secondary_pm_id.eq.${userData.id}`);
      }

      const { data: projectsData } = await projectsQuery;
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FILTER PROJECTS
  // ==========================================================================
  const filteredProjects = projects.filter(project => {
    // Status filter
    const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
    if (filterStatus === 'active' && !activeStatuses.includes(project.status)) return false;
    if (filterStatus === 'completed' && project.status !== 'Completed') return false;
    if (filterStatus === 'on-hold' && project.status !== 'On Hold') return false;

    // PM filter
    if (filterPM !== 'all' && project.pm_id !== filterPM) return false;

    // Factory filter
    if (filterFactory !== 'all' && project.factory !== filterFactory) return false;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!project.project_number?.toLowerCase().includes(term) &&
          !project.name?.toLowerCase().includes(term) &&
          !project.client_name?.toLowerCase().includes(term)) return false;
    }

    return true;
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'var(--info)',
      'Pre-PM': '#f59e0b',
      'PM Handoff': '#f59e0b',
      'In Progress': 'var(--sunbelt-orange)',
      'On Hold': 'var(--text-tertiary)',
      'Completed': '#22c55e',
      'Cancelled': '#ef4444',
      'Warranty': 'var(--info)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const uniqueFactories = [...new Set(projects.map(p => p.factory).filter(Boolean))];
  const pms = users.filter(u => ['Project Manager', 'Director', 'Admin'].includes(u.role));

  const stats = {
    total: projects.length,
    active: projects.filter(p => ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'].includes(p.status)).length,
    completed: projects.filter(p => p.status === 'Completed').length
  };

  // ==========================================================================
  // RENDER - PROJECT DETAILS
  // ==========================================================================
  if (selectedProject) {
    return (
      <ProjectDetails
        project={selectedProject}
        onBack={() => {
          setSelectedProject(null);
          fetchData();
        }}
        onUpdate={(updated) => {
          setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
          setSelectedProject(updated);
          showToast('Project updated');
        }}
      />
    );
  }

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
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderKanban size={28} style={{ color: 'var(--sunbelt-orange)' }} />
            {isDirectorView ? 'All Projects' : 'My Projects'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isDirectorView ? 'All projects across the organization' : 'Projects assigned to you'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateProject(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: 'var(--space-lg)' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Projects</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.total}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Active</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--sunbelt-orange)' }}>{stats.active}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Completed</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>{stats.completed}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="all">All Statuses</option>
        </select>

        {isDirectorView && (
          <select
            value={filterPM}
            onChange={(e) => setFilterPM(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
          >
            <option value="all">All PMs</option>
            {pms.map(pm => (
              <option key={pm.id} value={pm.id}>{pm.name}</option>
            ))}
          </select>
        )}

        <select
          value={filterFactory}
          onChange={(e) => setFilterFactory(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
        >
          <option value="all">All Factories</option>
          {uniqueFactories.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <FolderKanban size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No projects found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {searchTerm || filterStatus !== 'active' ? 'Try adjusting your filters' : 'Create your first project to get started'}
          </p>
          <button
            onClick={() => setShowCreateProject(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            Create Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredProjects.map(project => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '2px' }}>
                    {project.project_number}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{project.name}</div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  background: `${getStatusColor(project.status)}20`,
                  color: getStatusColor(project.status)
                }}>
                  {project.status}
                </span>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                {project.client_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={14} />
                    <span>{project.client_name}</span>
                  </div>
                )}
                {project.pm?.name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} />
                    <span>{project.pm.name}</span>
                    {project.secondary_pm?.name && (
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        (+{project.secondary_pm.name})
                      </span>
                    )}
                  </div>
                )}
                {project.delivery_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} />
                    <span>Delivery: {formatDate(project.delivery_date)}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                {project.factory && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {project.factory}
                  </span>
                )}
                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateProject && (
        <CreateProjectModal
          isOpen={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          onSuccess={(newProject) => {
            setProjects(prev => [newProject, ...prev]);
            setShowCreateProject(false);
            showToast('Project created');
          }}
          currentUserId={currentUser?.id}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;