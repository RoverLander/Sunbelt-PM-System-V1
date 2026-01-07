// ============================================================================
// SubmittalsPage.jsx
// ============================================================================
// Dedicated page for viewing and managing all Submittals across all projects.
// 
// FEATURES:
// - List view with sorting
// - Filter by status, type, project
// - Search submittals
// - Create new submittal (requires project selection)
// - Click to edit submittal
// - Shows revision numbers and approval status
//
// DEPENDENCIES:
// - supabaseClient: Database operations
// - AddSubmittalModal: For creating new submittals
// - EditSubmittalModal: For editing submittals
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, ClipboardList, Calendar, 
  ChevronRight, FileCheck, RotateCcw
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import AddSubmittalModal from '../projects/AddSubmittalModal';
import EditSubmittalModal from '../projects/EditSubmittalModal';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_CONFIG = {
  'Pending': { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b' },
  'Under Review': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
  'Approved': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
  'Approved as Noted': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
  'Revise & Resubmit': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  'Rejected': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
};

const SUBMITTAL_TYPES = [
  'Shop Drawings',
  'Product Data',
  'Samples',
  'Cutsheet',
  'Long Lead Item',
  'Color Selection',
  'Certifications',
  'Test Reports',
  'Warranty',
  'O&M Manuals',
  'As-Built Drawings',
  'Other'
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SubmittalsPage() {
  const { user } = useAuth();
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [submittals, setSubmittals] = useState([]);
  const [filteredSubmittals, setFilteredSubmittals] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProjectForAdd, setSelectedProjectForAdd] = useState(null);
  const [editSubmittal, setEditSubmittal] = useState(null);
  
  // Toast
  const [toast, setToast] = useState(null);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, project_number')
        .order('name');
      
      setProjects(projectsData || []);

      // Fetch all submittals with project info
      const { data: submittalsData, error } = await supabase
        .from('submittals')
        .select(`
          *,
          project:project_id(id, name, project_number),
          internal_owner:internal_owner_id(id, name)
        `)
        .order('date_submitted', { ascending: false });

      if (error) throw error;
      setSubmittals(submittalsData || []);
      setFilteredSubmittals(submittalsData || []);
    } catch (error) {
      console.error('Error fetching submittals:', error);
      showToast('Failed to load submittals', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FILTERING
  // ==========================================================================
  useEffect(() => {
    let filtered = [...submittals];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title?.toLowerCase().includes(query) ||
        s.submittal_number?.toLowerCase().includes(query) ||
        s.spec_section?.toLowerCase().includes(query) ||
        s.manufacturer?.toLowerCase().includes(query) ||
        s.project?.name?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.submittal_type === filterType);
    }

    if (filterProject !== 'all') {
      filtered = filtered.filter(s => s.project_id === filterProject);
    }

    setFilteredSubmittals(filtered);
  }, [submittals, searchQuery, filterStatus, filterType, filterProject]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (submittal) => {
    if (!submittal.due_date || submittal.status === 'Approved' || submittal.status === 'Approved as Noted') return false;
    return new Date(submittal.due_date) < new Date();
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleAddSubmittal = () => {
    if (projects.length === 0) {
      showToast('Create a project first before adding submittals', 'error');
      return;
    }
    setSelectedProjectForAdd(projects[0]);
    setShowAddModal(true);
  };

  const handleSubmittalCreated = (newSubmittal) => {
    fetchData();
    showToast('Submittal created successfully', 'success');
  };

  const handleSubmittalUpdated = (updatedSubmittal) => {
    setSubmittals(prev => prev.map(s => s.id === updatedSubmittal.id ? { ...s, ...updatedSubmittal } : s));
    showToast('Submittal updated', 'success');
  };

  const handleSubmittalDeleted = (submittalId) => {
    setSubmittals(prev => prev.filter(s => s.id !== submittalId));
    showToast('Submittal deleted', 'success');
  };

  // ==========================================================================
  // RENDER
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
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
            Submittals
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {filteredSubmittals.length} submittal{filteredSubmittals.length !== 1 ? 's' : ''}
            {filteredSubmittals.filter(s => s.status === 'Pending' || s.status === 'Under Review').length > 0 && 
              ` • ${filteredSubmittals.filter(s => s.status === 'Pending' || s.status === 'Under Review').length} pending review`}
          </p>
        </div>

        <button
          onClick={handleAddSubmittal}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
        >
          <Plus size={18} />
          New Submittal
        </button>
      </div>

      {/* ================================================================== */}
      {/* FILTERS                                                           */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search submittals..."
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
            fontSize: '0.875rem'
          }}
        >
          <option value="all">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '10px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem'
          }}
        >
          <option value="all">All Types</option>
          {SUBMITTAL_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {/* Project Filter */}
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          style={{
            padding: '10px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            maxWidth: '200px'
          }}
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* ================================================================== */}
      {/* LOADING / EMPTY STATE                                             */}
      {/* ================================================================== */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xxl)', color: 'var(--text-secondary)' }}>
          <div className="loading-spinner" style={{ marginRight: 'var(--space-md)' }}></div>
          Loading submittals...
        </div>
      )}

      {!loading && filteredSubmittals.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-xxl)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <ClipboardList size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
            {searchQuery || filterStatus !== 'all' ? 'No submittals found' : 'No submittals yet'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Create your first submittal to get started'}
          </p>
        </div>
      )}

      {/* ================================================================== */}
      {/* SUBMITTAL LIST                                                    */}
      {/* ================================================================== */}
      {!loading && filteredSubmittals.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Submittal</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Project</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Rev</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Due</th>
                <th style={{ padding: 'var(--space-md)', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmittals.map((submittal, index) => {
                const overdue = isOverdue(submittal);
                
                return (
                  <tr 
                    key={submittal.id}
                    onClick={() => setEditSubmittal(submittal)}
                    style={{ 
                      borderTop: index > 0 ? '1px solid var(--border-color)' : 'none',
                      cursor: 'pointer',
                      background: overdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = overdue ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = overdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}
                  >
                    <td style={{ padding: 'var(--space-md)' }}>
                      <div style={{ fontWeight: '600', color: overdue ? 'var(--danger)' : 'var(--text-primary)', marginBottom: '2px' }}>
                        {submittal.submittal_number || 'No Number'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                        {submittal.title}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--sunbelt-orange)', fontWeight: '500' }}>
                        {submittal.project?.name || '-'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {submittal.submittal_type || '-'}
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: STATUS_CONFIG[submittal.status]?.bg || 'var(--bg-tertiary)',
                        color: STATUS_CONFIG[submittal.status]?.color || 'var(--text-secondary)'
                      }}>
                        {submittal.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      {submittal.revision_number > 0 ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          <RotateCcw size={10} />
                          {submittal.revision_number}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: '0.875rem', color: overdue ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: overdue ? '600' : '400' }}>
                      {formatDate(submittal.due_date)}
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODALS                                                            */}
      {/* ================================================================== */}
      {showAddModal && selectedProjectForAdd && (
        <AddSubmittalModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedProjectForAdd(null);
          }}
          projectId={selectedProjectForAdd.id}
          projectNumber={selectedProjectForAdd.project_number}
          projectName={selectedProjectForAdd.name}
          onSuccess={handleSubmittalCreated}
        />
      )}

      {editSubmittal && (
        <EditSubmittalModal
          isOpen={!!editSubmittal}
          onClose={() => setEditSubmittal(null)}
          submittal={editSubmittal}
          projectName={editSubmittal.project?.name || ''}
          projectNumber={editSubmittal.project?.project_number || ''}
          onSuccess={handleSubmittalUpdated}
          onDelete={handleSubmittalDeleted}
        />
      )}

      {/* Toast */}
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
          zIndex: 1001
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default SubmittalsPage;