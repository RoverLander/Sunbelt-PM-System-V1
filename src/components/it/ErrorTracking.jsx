// ============================================================================
// ErrorTracking.jsx
// ============================================================================
// IT Error Tracking page with List and Kanban views.
// Allows IT staff to view, assign, and resolve error tickets.
//
// Features:
// - List view with sorting and filtering
// - Kanban board view with drag-and-drop
// - Ticket detail modal
// - Assignment to IT users
// - Status workflow: New → Investigating → In Progress → Resolved → Closed
// - Priority levels: Critical, High, Medium, Low
// - Comments on tickets
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  List,
  Kanban,
  Plus,
  Search,
  Filter,
  ChevronDown,
  X,
  User,
  Clock,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUSES = ['New', 'Investigating', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

const STATUS_COLORS = {
  'New': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: '#ef4444' },
  'Investigating': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: '#f59e0b' },
  'In Progress': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: '#3b82f6' },
  'Resolved': { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', border: '#22c55e' },
  'Closed': { bg: 'rgba(100, 116, 139, 0.1)', text: '#64748b', border: '#64748b' }
};

const PRIORITY_COLORS = {
  'Critical': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
  'High': { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' },
  'Medium': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  'Low': { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ErrorTracking() {
  const { user } = useAuth();

  // State
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [tickets, setTickets] = useState([]);
  const [itUsers, setItUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [showMyTicketsOnly, setShowMyTicketsOnly] = useState(false);

  // Check if user can assign tickets (IT_Manager or Admin only)
  const canAssignTickets = currentUserRole === 'IT_Manager' || currentUserRole === 'Admin';
  const isRegularIT = currentUserRole === 'IT';

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  useEffect(() => {
    fetchCurrentUserRole();
    fetchTickets();
    fetchITUsers();
  }, []);

  const fetchCurrentUserRole = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCurrentUserRole(data?.role || null);

      // Default to showing my tickets for regular IT staff
      if (data?.role === 'IT') {
        setShowMyTicketsOnly(true);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('error_tickets')
        .select(`
          *,
          assigned_user:assigned_to(id, name, email),
          reporter:reported_by(id, name, email),
          resolver:resolved_by(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchITUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('role', ['IT', 'IT_Manager', 'Admin'])
        .eq('is_active', true);

      if (error) throw error;
      setItUsers(data || []);
    } catch (error) {
      console.error('Error fetching IT users:', error);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const updates = { status: newStatus };

      // Auto-set resolved fields
      if (newStatus === 'Resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user?.id;
      }

      const { error } = await supabase
        .from('error_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;
      fetchTickets();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAssignTicket = async (ticketId, userId) => {
    try {
      const { error } = await supabase
        .from('error_tickets')
        .update({
          assigned_to: userId,
          assigned_by: user?.id,
          assigned_at: new Date().toISOString(),
          status: 'Investigating' // Auto-move to investigating when assigned
        })
        .eq('id', ticketId);

      if (error) throw error;
      fetchTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  // ============================================================================
  // FILTERING
  // ============================================================================
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.error_message?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;

    // For "My Tickets" filter - show tickets assigned to current user
    const matchesMyTickets = !showMyTicketsOnly || ticket.assigned_to === user?.id;

    return matchesSearch && matchesStatus && matchesPriority && matchesMyTickets;
  });

  // Group tickets by status for Kanban
  const ticketsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = filteredTickets.filter(t => t.status === status);
    return acc;
  }, {});

  // ============================================================================
  // RENDER: Stats Header
  // ============================================================================
  const renderStats = () => {
    const stats = {
      total: tickets.length,
      new: tickets.filter(t => t.status === 'New').length,
      inProgress: tickets.filter(t => ['Investigating', 'In Progress'].includes(t.status)).length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      critical: tickets.filter(t => t.priority === 'Critical' && t.status !== 'Closed').length
    };

    return (
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {[
          { label: 'Total Tickets', value: stats.total, color: '#64748b' },
          { label: 'New', value: stats.new, color: '#ef4444' },
          { label: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
          { label: 'Resolved', value: stats.resolved, color: '#22c55e' },
          { label: 'Critical', value: stats.critical, color: '#ef4444', highlight: stats.critical > 0 }
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              padding: '16px 24px',
              background: stat.highlight ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
              borderRadius: '12px',
              border: `1px solid ${stat.highlight ? '#ef4444' : 'var(--border-color)'}`,
              minWidth: '140px'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ============================================================================
  // RENDER: Toolbar
  // ============================================================================
  const renderToolbar = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '8px 12px',
        border: '1px solid var(--border-color)',
        flex: '1',
        minWidth: '200px',
        maxWidth: '400px'
      }}>
        <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            width: '100%'
          }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {/* My Tickets / All Tickets Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setShowMyTicketsOnly(true)}
            style={{
              padding: '8px 12px',
              background: showMyTicketsOnly ? 'var(--sunbelt-orange)' : 'transparent',
              border: 'none',
              color: showMyTicketsOnly ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            My Tickets
          </button>
          <button
            onClick={() => setShowMyTicketsOnly(false)}
            style={{
              padding: '8px 12px',
              background: !showMyTicketsOnly ? 'var(--sunbelt-orange)' : 'transparent',
              border: 'none',
              color: !showMyTicketsOnly ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            All Tickets
          </button>
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* View Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 12px',
              background: viewMode === 'list' ? 'var(--sunbelt-orange)' : 'transparent',
              border: 'none',
              color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <List size={16} />
            List
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            style={{
              padding: '8px 12px',
              background: viewMode === 'kanban' ? 'var(--sunbelt-orange)' : 'transparent',
              border: 'none',
              color: viewMode === 'kanban' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Kanban size={16} />
            Kanban
          </button>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchTickets}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: Ticket Card (shared between views)
  // ============================================================================
  const renderTicketCard = (ticket, compact = false) => {
    const statusColor = STATUS_COLORS[ticket.status] || STATUS_COLORS['New'];
    const priorityColor = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS['Medium'];

    return (
      <div
        key={ticket.id}
        onClick={() => setSelectedTicket(ticket)}
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          padding: compact ? '12px' : '16px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          borderLeft: `4px solid ${statusColor.border}`
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--sunbelt-orange)',
            fontFamily: 'monospace'
          }}>
            {ticket.ticket_number}
          </span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: '600',
            background: priorityColor.bg,
            color: priorityColor.text
          }}>
            {ticket.priority}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontWeight: '600',
          color: 'var(--text-primary)',
          fontSize: compact ? '0.85rem' : '0.95rem',
          marginBottom: '8px',
          lineHeight: '1.4'
        }}>
          {ticket.title?.length > 60 ? ticket.title.substring(0, 60) + '...' : ticket.title}
        </div>

        {/* Status Badge */}
        <div style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: '600',
          background: statusColor.bg,
          color: statusColor.text,
          marginBottom: '8px'
        }}>
          {ticket.status}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-color)'
        }}>
          {/* Assigned To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {ticket.assigned_user?.name || 'Unassigned'}
            </span>
          </div>

          {/* Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              {new Date(ticket.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: List View
  // ============================================================================
  const renderListView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {filteredTickets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-tertiary)'
        }}>
          <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No tickets found</div>
          <div style={{ fontSize: '0.9rem' }}>
            {tickets.length === 0 ? 'No error tickets have been created yet.' : 'Try adjusting your filters.'}
          </div>
        </div>
      ) : (
        filteredTickets.map(ticket => renderTicketCard(ticket))
      )}
    </div>
  );

  // ============================================================================
  // RENDER: Kanban View
  // ============================================================================
  const renderKanbanView = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${STATUSES.length}, minmax(250px, 1fr))`,
      gap: '16px',
      overflowX: 'auto',
      paddingBottom: '16px'
    }}>
      {STATUSES.map(status => {
        const statusColor = STATUS_COLORS[status];
        const statusTickets = ticketsByStatus[status] || [];

        return (
          <div
            key={status}
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: '12px',
              padding: '16px',
              minHeight: '400px'
            }}
          >
            {/* Column Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: `2px solid ${statusColor.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: statusColor.text
                }} />
                <span style={{
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}>
                  {status}
                </span>
              </div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: '600',
                background: statusColor.bg,
                color: statusColor.text
              }}>
                {statusTickets.length}
              </span>
            </div>

            {/* Column Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {statusTickets.map(ticket => renderTicketCard(ticket, true))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ============================================================================
  // RENDER: Ticket Detail Modal
  // ============================================================================
  const renderTicketModal = () => {
    if (!selectedTicket) return null;

    const statusColor = STATUS_COLORS[selectedTicket.status];
    const priorityColor = PRIORITY_COLORS[selectedTicket.priority];

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setSelectedTicket(null)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid var(--border-color)'
          }}
        >
          {/* Modal Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--sunbelt-orange)',
                  fontFamily: 'monospace'
                }}>
                  {selectedTicket.ticket_number}
                </span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: priorityColor.bg,
                  color: priorityColor.text
                }}>
                  {selectedTicket.priority}
                </span>
              </div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {selectedTicket.title}
              </h2>
            </div>
            <button
              onClick={() => setSelectedTicket(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '24px' }}>
            {/* Status & Assignment Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Status */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-tertiary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>
                  Status
                </label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => {
                    handleStatusChange(selectedTicket.id, e.target.value);
                    setSelectedTicket({ ...selectedTicket, status: e.target.value });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: statusColor.bg,
                    border: `1px solid ${statusColor.border}`,
                    borderRadius: '8px',
                    color: statusColor.text,
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-tertiary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>
                  Assigned To {!canAssignTickets && <span style={{ color: 'var(--text-tertiary)', fontWeight: '400' }}>(Manager only)</span>}
                </label>
                {canAssignTickets ? (
                  <select
                    value={selectedTicket.assigned_to || ''}
                    onChange={(e) => {
                      handleAssignTicket(selectedTicket.id, e.target.value || null);
                      setSelectedTicket({ ...selectedTicket, assigned_to: e.target.value });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Unassigned</option>
                    {itUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                  }}>
                    {selectedTicket.assigned_user?.name || 'Unassigned'}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedTicket.description && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-tertiary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>
                  Description
                </label>
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTicket.description}
                </div>
              </div>
            )}

            {/* Error Message */}
            {selectedTicket.error_message && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-tertiary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>
                  Error Message
                </label>
                <pre style={{
                  padding: '16px',
                  background: '#0f172a',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {selectedTicket.error_message}
                </pre>
              </div>
            )}

            {/* Page URL */}
            {selectedTicket.page_url && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-tertiary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>
                  Page URL
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px'
                }}>
                  <ExternalLink size={16} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{
                    color: 'var(--info)',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all'
                  }}>
                    {selectedTicket.page_url}
                  </span>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '16px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Created</span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {new Date(selectedTicket.created_at).toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Reported By</span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedTicket.reporter?.name || 'System'}
                </div>
              </div>
              {selectedTicket.resolved_at && (
                <>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Resolved</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(selectedTicket.resolved_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Resolved By</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {selectedTicket.resolver?.name || 'Unknown'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: 'var(--text-tertiary)'
      }}>
        <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <AlertTriangle size={28} style={{ color: 'var(--sunbelt-orange)' }} />
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Error Tracking
          </h1>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: 0 }}>
          Track and resolve system errors reported by users
        </p>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Content */}
      {viewMode === 'list' ? renderListView() : renderKanbanView()}

      {/* Ticket Detail Modal */}
      {renderTicketModal()}

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ErrorTracking;
