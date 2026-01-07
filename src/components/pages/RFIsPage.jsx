// ============================================================================
// RFIsPage.jsx
// ============================================================================
// Dedicated page for viewing and managing all RFIs across all projects.
// 
// FEATURES:
// - List view with sorting
// - Filter by status, priority, project
// - Search RFIs
// - Create new RFI (requires project selection)
// - Click to edit RFI
// - Shows days open and overdue status
//
// DEPENDENCIES:
// - supabaseClient: Database operations
// - AddRFIModal: For creating new RFIs
// - EditRFIModal: For editing RFIs
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, MessageSquare, Calendar, 
  AlertCircle, Clock, CheckCircle2, ChevronRight,
  FileText
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import AddRFIModal from '../projects/AddRFIModal';
import EditRFIModal from '../projects/EditRFIModal';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_CONFIG = {
  'Open': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
  'Pending': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  'Answered': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
  'Closed': { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }
};

const PRIORITY_COLORS = {
  'Low': '#64748b',
  'Medium': '#f59e0b',
  'High': '#ef4444'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function RFIsPage() {
  const { user } = useAuth();
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [rfis, setRFIs] = useState([]);
  const [filteredRFIs, setFilteredRFIs] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProjectForAdd, setSelectedProjectForAdd] = useState(null);
  const [editRFI, setEditRFI] = useState(null);
  
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

      // Fetch all RFIs with project info
      const { data: rfisData, error } = await supabase
        .from('rfis')
        .select(`
          *,
          project:project_id(id, name, project_number),
          internal_owner:internal_owner_id(id, name)
        `)
        .order('date_sent', { ascending: false });

      if (error) throw error;
      setRFIs(rfisData || []);
      setFilteredRFIs(rfisData || []);
    } catch (error) {
      console.error('Error fetching RFIs:', error);
      showToast('Failed to load RFIs', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FILTERING
  // ==========================================================================
  useEffect(() => {
    let filtered = [...rfis];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.subject?.toLowerCase().includes(query) ||
        r.rfi_number?.toLowerCase().includes(query) ||
        r.question?.toLowerCase().includes(query) ||
        r.project?.name?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(r => r.priority === filterPriority);
    }

    if (filterProject !== 'all') {
      filtered = filtered.filter(r => r.project_id === filterProject);
    }

    setFilteredRFIs(filtered);
  }, [rfis, searchQuery, filterStatus, filterPriority, filterProject]);

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

  const calculateDaysOpen = (dateSent) => {
    if (!dateSent) return 0;
    const sent = new Date(dateSent);
    const now = new Date();
    const diffTime = Math.abs(now - sent);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (rfi) => {
    if (!rfi.due_date || rfi.status === 'Answered' || rfi.status === 'Closed') return false;
    return new Date(rfi.due_date) < new Date();
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleAddRFI = () => {
    if (projects.length === 0) {
      showToast('Create a project first before adding RFIs', 'error');
      return;
    }
    setSelectedProjectForAdd(projects[0]);
    setShowAddModal(true);
  };

  const handleRFICreated = (newRFI) => {
    fetchData();
    showToast('RFI created successfully', 'success');
  };

  const handleRFIUpdated = (updatedRFI) => {
    setRFIs(prev => prev.map(r => r.id === updatedRFI.id ? { ...r, ...updatedRFI } : r));
    showToast('RFI updated', 'success');
  };

  const handleRFIDeleted = (rfiId) => {
    setRFIs(prev => prev.filter(r => r.id !== rfiId));
    showToast('RFI deleted', 'success');
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
            RFIs
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {filteredRFIs.length} RFI{filteredRFIs.length !== 1 ? 's' : ''}
            {filteredRFIs.filter(r => r.status === 'Open').length > 0 && 
              ` • ${filteredRFIs.filter(r => r.status === 'Open').length} open`}
          </p>
        </div>

        <button
          onClick={handleAddRFI}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
        >
          <Plus size={18} />
          New RFI
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
            placeholder="Search RFIs..."
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

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{
            padding: '10px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem'
          }}
        >
          <option value="all">All Priorities</option>
          {Object.keys(PRIORITY_COLORS).map(priority => (
            <option key={priority} value={priority}>{priority}</option>
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
          Loading RFIs...
        </div>
      )}

      {!loading && filteredRFIs.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-xxl)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <MessageSquare size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
            {searchQuery || filterStatus !== 'all' ? 'No RFIs found' : 'No RFIs yet'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Create your first RFI to get started'}
          </p>
        </div>
      )}

      {/* ================================================================== */}
      {/* RFI LIST                                                          */}
      {/* ================================================================== */}
      {!loading && filteredRFIs.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>RFI</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Project</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Sent To</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Due</th>
                <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Days Open</th>
                <th style={{ padding: 'var(--space-md)', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRFIs.map((rfi, index) => {
                const overdue = isOverdue(rfi);
                const daysOpen = calculateDaysOpen(rfi.date_sent);
                
                return (
                  <tr 
                    key={rfi.id}
                    onClick={() => setEditRFI(rfi)}
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
                        {rfi.rfi_number || 'No Number'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                        {rfi.subject}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--sunbelt-orange)', fontWeight: '500' }}>
                        {rfi.project?.name || '-'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: STATUS_CONFIG[rfi.status]?.bg || 'var(--bg-tertiary)',
                        color: STATUS_CONFIG[rfi.status]?.color || 'var(--text-secondary)'
                      }}>
                        {rfi.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {rfi.sent_to || '-'}
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: '0.875rem', color: overdue ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: overdue ? '600' : '400' }}>
                      {formatDate(rfi.due_date)}
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: '0.875rem', color: daysOpen > 7 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                      {daysOpen} days
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
        <AddRFIModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedProjectForAdd(null);
          }}
          projectId={selectedProjectForAdd.id}
          projectNumber={selectedProjectForAdd.project_number}
          projectName={selectedProjectForAdd.name}
          onSuccess={handleRFICreated}
        />
      )}

      {editRFI && (
        <EditRFIModal
          isOpen={!!editRFI}
          onClose={() => setEditRFI(null)}
          rfi={editRFI}
          projectName={editRFI.project?.name || ''}
          projectNumber={editRFI.project?.project_number || ''}
          onSuccess={handleRFIUpdated}
          onDelete={handleRFIDeleted}
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

export default RFIsPage;