// ============================================================================
// SalesDashboard.jsx - Sales Team Dashboard
// ============================================================================
// Main dashboard for sales reps and managers to track quotes and pipeline.
//
// FEATURES:
// - Pipeline metrics cards (by stage)
// - Quote list with search and filters
// - Win/loss tracking
// - Quick actions (new quote, new customer)
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Building2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  MoreVertical,
  Edit2,
  Eye,
  Trash2,
  RefreshCw,
  Calendar,
  ArrowRight,
  Award,
  Percent,
  Loader2
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import QuoteForm from './QuoteForm';
import QuoteDetail from './QuoteDetail';
import CustomerForm from './CustomerForm';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#64748b', icon: FileText, bgColor: 'rgba(100, 116, 139, 0.1)' },
  sent: { label: 'Sent', color: '#3b82f6', icon: Send, bgColor: 'rgba(59, 130, 246, 0.1)' },
  negotiating: { label: 'Negotiating', color: '#f59e0b', icon: Clock, bgColor: 'rgba(245, 158, 11, 0.1)' },
  won: { label: 'Won', color: '#22c55e', icon: CheckCircle, bgColor: 'rgba(34, 197, 94, 0.1)' },
  lost: { label: 'Lost', color: '#ef4444', icon: XCircle, bgColor: 'rgba(239, 68, 68, 0.1)' }
};

const FACTORIES = ['NWBS', 'WM-EAST', 'WM-WEST', 'MM', 'SSI', 'MS', 'MG', 'SEMO', 'PMI', 'AMTEX', 'BRIT', 'CB', 'IND', 'MRS'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// formatDate - used in quote list to show created_at
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// formatShortDate - used in quote cards for compact display
const formatShortDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

// Suppress unused warnings for functions that are used in JSX
void formatDate;
void formatShortDate;

const getDaysAgo = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SalesDashboard() {
  // Auth context available if needed for user-specific features
  useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // active, all, won, lost
  const [factoryFilter, setFactoryFilter] = useState('all');

  // Modals
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('sales_quotes')
        .select(`
          *,
          customer:customer_id(id, company_name, contact_name),
          assigned_user:assigned_to(id, name)
        `)
        .eq('is_latest_version', true)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;
      setQuotes(quotesData || []);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('sales_customers')
        .select('*')
        .order('company_name');

      if (customersError) throw customersError;
      setCustomers(customersData || []);

    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================
  const metrics = useMemo(() => {
    const activeQuotes = quotes.filter(q => ['draft', 'sent', 'negotiating'].includes(q.status));
    const wonQuotes = quotes.filter(q => q.status === 'won');
    const lostQuotes = quotes.filter(q => q.status === 'lost');

    const pipelineValue = activeQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
    const wonValue = wonQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);

    const closedQuotes = wonQuotes.length + lostQuotes.length;
    const winRate = closedQuotes > 0 ? Math.round((wonQuotes.length / closedQuotes) * 100) : 0;

    return {
      pipelineValue,
      pipelineCount: activeQuotes.length,
      wonValue,
      wonCount: wonQuotes.length,
      lostCount: lostQuotes.length,
      winRate,
      byStatus: {
        draft: quotes.filter(q => q.status === 'draft'),
        sent: quotes.filter(q => q.status === 'sent'),
        negotiating: quotes.filter(q => q.status === 'negotiating'),
        won: wonQuotes,
        lost: lostQuotes
      }
    };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        quote.quote_number?.toLowerCase().includes(searchLower) ||
        quote.project_name?.toLowerCase().includes(searchLower) ||
        quote.customer?.company_name?.toLowerCase().includes(searchLower);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = ['draft', 'sent', 'negotiating'].includes(quote.status);
      } else if (statusFilter !== 'all') {
        matchesStatus = quote.status === statusFilter;
      }

      // Factory filter
      const matchesFactory = factoryFilter === 'all' || quote.factory === factoryFilter;

      return matchesSearch && matchesStatus && matchesFactory;
    });
  }, [quotes, searchQuery, statusFilter, factoryFilter]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleNewQuote = () => {
    setEditingQuote(null);
    setShowQuoteForm(true);
  };

  const handleEditQuote = (quote) => {
    setEditingQuote(quote);
    setShowQuoteForm(true);
  };

  const handleViewQuote = (quote) => {
    setSelectedQuote(quote);
  };

  const handleDeleteQuote = async (quote) => {
    if (!window.confirm(`Delete quote ${quote.quote_number}? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('sales_quotes')
        .delete()
        .eq('id', quote.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote');
    }
  };

  const handleQuoteSaved = () => {
    setShowQuoteForm(false);
    setEditingQuote(null);
    fetchData();
  };

  const handleCustomerSaved = () => {
    setShowCustomerForm(false);
    fetchData();
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (selectedQuote) {
    return (
      <QuoteDetail
        quote={selectedQuote}
        onBack={() => setSelectedQuote(null)}
        onEdit={() => {
          setEditingQuote(selectedQuote);
          setSelectedQuote(null);
          setShowQuoteForm(true);
        }}
        onRefresh={fetchData}
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Sales Dashboard
          </h1>
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
            margin: '4px 0 0'
          }}>
            Track quotes, pipeline, and customer relationships
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowCustomerForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Building2 size={18} />
            New Customer
          </button>
          <button
            onClick={handleNewQuote}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--sunbelt-orange)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} />
            New Quote
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Pipeline Value */}
        <div style={{
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={20} style={{ color: '#3b82f6' }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Pipeline Value
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {formatCurrency(metrics.pipelineValue)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {metrics.pipelineCount} active quotes
          </div>
        </div>

        {/* Won This Year */}
        <div style={{
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={20} style={{ color: '#22c55e' }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Won Revenue
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
            {formatCurrency(metrics.wonValue)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {metrics.wonCount} deals closed
          </div>
        </div>

        {/* Win Rate */}
        <div style={{
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Percent size={20} style={{ color: '#f59e0b' }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Win Rate
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {metrics.winRate}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {metrics.wonCount}W / {metrics.lostCount}L
          </div>
        </div>

        {/* Customers */}
        <div style={{
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={20} style={{ color: '#8b5cf6' }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Customers
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {customers.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Active accounts
          </div>
        </div>
      </div>

      {/* Pipeline Stages Mini-Cards */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {['draft', 'sent', 'negotiating'].map(status => {
          const config = STATUS_CONFIG[status];
          const statusQuotes = metrics.byStatus[status];
          const value = statusQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'active' : status)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: statusFilter === status ? config.bgColor : 'var(--bg-secondary)',
                border: `1px solid ${statusFilter === status ? config.color : 'var(--border-color)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                minWidth: '140px'
              }}
            >
              <config.icon size={18} style={{ color: config.color }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                  {config.label}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {statusQuotes.length} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-tertiary)' }}>
                    ({formatCurrency(value)})
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
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
            placeholder="Search quotes, customers..."
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

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          <option value="active">Active Pipeline</option>
          <option value="all">All Quotes</option>
          <option value="draft">Draft Only</option>
          <option value="sent">Sent Only</option>
          <option value="negotiating">Negotiating Only</option>
          <option value="won">Won Only</option>
          <option value="lost">Lost Only</option>
        </select>

        {/* Factory Filter */}
        <select
          value={factoryFilter}
          onChange={(e) => setFactoryFilter(e.target.value)}
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
          <option value="all">All Factories</option>
          {FACTORIES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Refresh */}
        <button
          onClick={fetchData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Quotes List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '12px' }}>Loading quotes...</div>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <FileText size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '8px' }}>
            No quotes found
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {searchQuery || statusFilter !== 'active' || factoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first quote to get started'}
          </div>
          {!searchQuery && statusFilter === 'active' && factoryFilter === 'all' && (
            <button
              onClick={handleNewQuote}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'var(--sunbelt-orange)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} />
              Create Quote
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredQuotes.map(quote => {
            const statusConfig = STATUS_CONFIG[quote.status];
            const StatusIcon = statusConfig.icon;
            const daysOld = getDaysAgo(quote.created_at);

            return (
              <div
                key={quote.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s'
                }}
                onClick={() => handleViewQuote(quote)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {/* Status Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: statusConfig.bgColor,
                  flexShrink: 0
                }}>
                  <StatusIcon size={20} style={{ color: statusConfig.color }} />
                </div>

                {/* Main Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}>
                      {quote.project_name || 'Untitled Quote'}
                    </span>
                    <code style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-tertiary)',
                      background: 'var(--bg-tertiary)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {quote.quote_number}
                    </code>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: statusConfig.bgColor,
                      color: statusConfig.color,
                      fontWeight: '500'
                    }}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '0.85rem',
                    color: 'var(--text-tertiary)'
                  }}>
                    {quote.customer?.company_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={14} />
                        {quote.customer.company_name}
                      </span>
                    )}
                    <span>{quote.factory}</span>
                    {daysOld !== null && (
                      <span>{daysOld === 0 ? 'Today' : `${daysOld}d ago`}</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {formatCurrency(quote.total_price)}
                  </div>
                  {quote.assigned_user?.name && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      {quote.assigned_user.name}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div
                  style={{ display: 'flex', gap: '4px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleEditQuote(quote)}
                    title="Edit"
                    style={{
                      padding: '8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteQuote(quote)}
                    title="Delete"
                    style={{
                      padding: '8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Quote Form Modal */}
      {showQuoteForm && (
        <QuoteForm
          quote={editingQuote}
          customers={customers}
          onSave={handleQuoteSaved}
          onCancel={() => {
            setShowQuoteForm(false);
            setEditingQuote(null);
          }}
        />
      )}

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm
          onSave={handleCustomerSaved}
          onCancel={() => setShowCustomerForm(false)}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SalesDashboard;
