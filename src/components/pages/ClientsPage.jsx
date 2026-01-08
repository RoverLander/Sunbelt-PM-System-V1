// ============================================================================
// ClientsPage Component
// ============================================================================
// VP-level view of all clients/accounts with:
// - Client list with project counts and values
// - Expandable client details showing their projects
// - Search and sort capabilities
// - Revenue analysis by client
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Building2,
  DollarSign,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  Calendar,
  TrendingUp,
  Star,
  Award
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// HELPERS
// ============================================================================
const formatCurrency = (amount) => {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('value');
  const [expandedClient, setExpandedClient] = useState(null);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('projects')
        .select(`
          *,
          pm:pm_id(name)
        `)
        .order('created_at', { ascending: false });

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // CALCULATE CLIENT DATA
  // ==========================================================================
  const clientData = useMemo(() => {
    const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
    const clients = {};

    projects.forEach(project => {
      const clientName = project.client_name || 'Unknown Client';
      
      if (!clients[clientName]) {
        clients[clientName] = {
          name: clientName,
          projects: [],
          totalValue: 0,
          activeValue: 0,
          activeCount: 0,
          completedCount: 0,
          totalCount: 0,
          firstProject: project.created_at,
          lastProject: project.created_at
        };
      }

      clients[clientName].projects.push(project);
      clients[clientName].totalValue += project.contract_value || 0;
      clients[clientName].totalCount++;

      if (activeStatuses.includes(project.status)) {
        clients[clientName].activeCount++;
        clients[clientName].activeValue += project.contract_value || 0;
      } else if (project.status === 'Completed') {
        clients[clientName].completedCount++;
      }

      if (new Date(project.created_at) < new Date(clients[clientName].firstProject)) {
        clients[clientName].firstProject = project.created_at;
      }
      if (new Date(project.created_at) > new Date(clients[clientName].lastProject)) {
        clients[clientName].lastProject = project.created_at;
      }
    });

    let clientList = Object.values(clients);

    // Filter
    if (searchTerm) {
      clientList = clientList.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    clientList.sort((a, b) => {
      if (sortBy === 'value') return b.totalValue - a.totalValue;
      if (sortBy === 'projects') return b.totalCount - a.totalCount;
      if (sortBy === 'active') return b.activeCount - a.activeCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return clientList;
  }, [projects, searchTerm, sortBy]);

  // ==========================================================================
  // SUMMARY STATS
  // ==========================================================================
  const summaryStats = useMemo(() => {
    const totalValue = clientData.reduce((sum, c) => sum + c.totalValue, 0);
    const activeValue = clientData.reduce((sum, c) => sum + c.activeValue, 0);
    const topClient = clientData[0] || null;

    return {
      totalClients: clientData.length,
      totalValue,
      activeValue,
      topClient
    };
  }, [clientData]);

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
          <Briefcase size={28} style={{ color: 'var(--sunbelt-orange)' }} />
          Client Accounts
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Overview of all client relationships and project history
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: 'var(--space-lg)' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--info)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Clients</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{summaryStats.totalClients}</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign size={18} style={{ color: 'var(--sunbelt-orange)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total Value</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(summaryStats.totalValue)}</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={18} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Active Value</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#22c55e' }}>{formatCurrency(summaryStats.activeValue)}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))', borderRadius: 'var(--radius-lg)', padding: '20px', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.9 }}>
            <Award size={18} />
            <span style={{ fontSize: '0.8125rem' }}>Top Client</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{summaryStats.topClient?.name || '-'}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
            {summaryStats.topClient ? formatCurrency(summaryStats.topClient.totalValue) : ''}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-md)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { key: 'value', label: 'Value' },
            { key: 'projects', label: 'Projects' },
            { key: 'active', label: 'Active' },
            { key: 'name', label: 'Name' }
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              style={{
                padding: '8px 14px',
                background: sortBy === opt.key ? 'var(--sunbelt-orange)' : 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: sortBy === opt.key ? 'white' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {clientData.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <Briefcase size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No clients found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {searchTerm ? 'Try adjusting your search' : 'No client data available'}
            </p>
          </div>
        ) : (
          clientData.map(client => (
            <div
              key={client.name}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
              }}
            >
              {/* Client Header */}
              <div
                onClick={() => setExpandedClient(expandedClient === client.name ? null : client.name)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  background: expandedClient === client.name ? 'var(--bg-tertiary)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '1.125rem'
                  }}>
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1rem' }}>{client.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      Customer since {formatDate(client.firstProject)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>{client.totalCount}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Projects</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--sunbelt-orange)' }}>{client.activeCount}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#22c55e' }}>{client.completedCount}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Complete</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(client.totalValue)}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Total Value</div>
                  </div>
                  {expandedClient === client.name ? (
                    <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />
                  ) : (
                    <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
                  )}
                </div>
              </div>

              {/* Expanded Projects */}
              {expandedClient === client.name && (
                <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Project History
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {client.projects.map(project => (
                      <div
                        key={project.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          background: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {project.project_number}
                            <span style={{ fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '8px' }}>{project.name}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {project.pm?.name || 'Unassigned'} • {formatDate(project.created_at)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.6875rem',
                            fontWeight: '600',
                            background: project.status === 'Completed' ? 'rgba(34, 197, 94, 0.15)' : project.status === 'In Progress' ? 'rgba(255, 107, 53, 0.15)' : 'var(--bg-tertiary)',
                            color: project.status === 'Completed' ? '#22c55e' : project.status === 'In Progress' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)'
                          }}>
                            {project.status}
                          </span>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)', minWidth: '80px', textAlign: 'right' }}>
                            {formatCurrency(project.contract_value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ClientsPage;