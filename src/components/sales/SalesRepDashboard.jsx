// ============================================================================
// SalesRepDashboard.jsx - Sales Rep Dashboard
// ============================================================================
// Dashboard for Sales Reps to see ONLY their own quotes and projects.
// Simplified view focused on individual performance and tasks.
//
// Visibility Rules:
// - See only quotes assigned to them
// - See only projects converted from their quotes
// - Personal performance metrics only
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  RefreshCw,
  Percent,
  Loader2,
  FileUp,
  AlertTriangle,
  Flag,
  Package,
  Ruler,
  Star,
  Target,
  Calendar,
  TrendingDown,
  Factory,
  Award,
  FileText,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import QuoteForm from './QuoteForm';
import QuoteDetail from './QuoteDetail';
import CustomerForm from './CustomerForm';
import PraxisQuoteImportModal from './PraxisQuoteImportModal';

// Import shared constants
import {
  STATUS_CONFIG,
  ACTIVE_STATUSES,
  BUILDING_TYPES,
  BUILDING_TYPE_COLORS,
  AGING_THRESHOLDS,
  formatCurrency,
  formatCompactCurrency,
  getDaysAgo,
  getAgingColor,
  getAgingLabel
} from '../../constants/salesStatuses';

const renderDifficultyRating = (rating) => {
  if (!rating) return null;
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          fill={i <= rating ? '#f59e0b' : 'transparent'}
          style={{ color: i <= rating ? '#f59e0b' : 'var(--text-tertiary)' }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// MY PIPELINE STATUS COMPONENT (Personal Progress)
// ============================================================================
const MyPipelineStatus = ({ quotes }) => {
  const statusCounts = useMemo(() => {
    return ACTIVE_STATUSES.map(status => {
      const config = STATUS_CONFIG[status];
      const statusQuotes = quotes.filter(q => q.status === status);
      const value = statusQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
      return {
        status,
        ...config,
        count: statusQuotes.length,
        value
      };
    }).filter(s => s.count > 0);
  }, [quotes]);

  if (statusCounts.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Target size={18} style={{ color: 'var(--sunbelt-orange)' }} />
        My Pipeline Progress
      </h3>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {statusCounts.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.status}
              style={{
                flex: '1 1 140px',
                padding: '12px',
                background: item.bgColor,
                borderRadius: '8px',
                border: `1px solid ${item.color}30`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon size={16} style={{ color: item.color }} />
                <span style={{ fontSize: '0.8rem', fontWeight: '500', color: item.color }}>
                  {item.label}
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {item.count}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {formatCompactCurrency(item.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// NEEDS ATTENTION COMPONENT
// ============================================================================
const NeedsAttentionSection = ({ quotes, onQuoteClick }) => {
  const attentionItems = useMemo(() => {
    const items = [];

    // Stale quotes (30+ days)
    quotes.forEach(q => {
      if (!ACTIVE_STATUSES.includes(q.status)) return;
      const daysOld = getDaysAgo(q.created_at);
      if (daysOld >= AGING_THRESHOLDS.stale) {
        items.push({
          quote: q,
          type: 'stale',
          priority: 1,
          message: `${daysOld} days without activity`,
          color: '#ef4444'
        });
      } else if (daysOld >= AGING_THRESHOLDS.aging) {
        items.push({
          quote: q,
          type: 'aging',
          priority: 2,
          message: `${daysOld} days old - follow up soon`,
          color: '#f59e0b'
        });
      }
    });

    // PM Flagged quotes
    quotes.forEach(q => {
      if (q.pm_flagged && ACTIVE_STATUSES.includes(q.status)) {
        const existing = items.find(i => i.quote.id === q.id);
        if (!existing) {
          items.push({
            quote: q,
            type: 'pm_flagged',
            priority: 1,
            message: q.pm_flagged_reason || 'Flagged for PM review',
            color: '#8b5cf6'
          });
        }
      }
    });

    return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [quotes]);

  if (attentionItems.length === 0) {
    return (
      <div style={{
        background: 'rgba(34, 197, 94, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <CheckCircle size={20} style={{ color: '#22c55e' }} />
        <span style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: '500' }}>
          All caught up! No quotes need immediate attention.
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(239, 68, 68, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      padding: '16px',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <AlertTriangle size={18} style={{ color: '#ef4444' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ef4444' }}>
          Needs Your Attention ({attentionItems.length})
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {attentionItems.map((item, idx) => (
          <button
            key={`${item.quote.id}-${idx}`}
            onClick={() => onQuoteClick(item.quote)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${item.color}`,
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                {item.quote.project_name || item.quote.quote_number}
              </div>
              <div style={{ fontSize: '0.75rem', color: item.color, marginTop: '2px' }}>
                {item.message}
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {formatCompactCurrency(item.quote.total_price)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// QUICK STATS COMPONENT
// ============================================================================
const QuickStats = ({ quotes }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = quotes.filter(q => {
      const created = new Date(q.created_at);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    });

    const lastMonth = quotes.filter(q => {
      const created = new Date(q.created_at);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return created.getMonth() === lastMonthDate.getMonth() && created.getFullYear() === lastMonthDate.getFullYear();
    });

    const wonThisMonth = quotes.filter(q => {
      if (q.status !== 'won') return false;
      const updated = new Date(q.updated_at);
      return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear();
    });

    const convertedThisMonth = quotes.filter(q => {
      if (q.status !== 'converted') return false;
      const updated = new Date(q.updated_at);
      return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear();
    });

    return {
      newThisMonth: thisMonth.length,
      newLastMonth: lastMonth.length,
      wonThisMonth: wonThisMonth.length,
      wonValue: wonThisMonth.reduce((sum, q) => sum + (q.total_price || 0), 0),
      convertedThisMonth: convertedThisMonth.length
    };
  }, [quotes]);

  const trend = stats.newThisMonth >= stats.newLastMonth ? 'up' : 'down';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      marginBottom: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Calendar size={16} style={{ color: '#3b82f6' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            This Month
          </span>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {stats.newThisMonth}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: trend === 'up' ? '#22c55e' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {stats.newLastMonth} last month
        </div>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Award size={16} style={{ color: '#22c55e' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Won This Month
          </span>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
          {stats.wonThisMonth}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {formatCompactCurrency(stats.wonValue)} value
        </div>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ArrowRight size={16} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Converted
          </span>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
          {stats.convertedThisMonth}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          to PM this month
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SalesRepDashboard() {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [userFactory, setUserFactory] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [buildingTypeFilter, setBuildingTypeFilter] = useState('all');

  // Modals
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showPraxisImport, setShowPraxisImport] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showNewDropdown, setShowNewDropdown] = useState(false);

  // ==========================================================================
  // DATA FETCHING - Only user's own quotes
  // ==========================================================================
  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Get user's factory
      const { data: userData } = await supabase
        .from('users')
        .select('factory')
        .eq('id', user.id)
        .single();
      setUserFactory(userData?.factory);

      // Fetch ONLY quotes assigned to this user
      const [quotesRes, customersRes, dealersRes] = await Promise.all([
        supabase
          .from('sales_quotes')
          .select(`
            *,
            customer:customer_id(id, company_name, contact_name),
            assigned_user:assigned_to(id, name),
            dealer:dealer_id(id, code, name, branch_name)
          `)
          .eq('assigned_to', user.id)
          .eq('is_latest_version', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('sales_customers')
          .select('*')
          .order('company_name'),
        supabase
          .from('dealers')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ]);

      if (quotesRes.error) throw quotesRes.error;
      setQuotes(quotesRes.data || []);

      if (customersRes.error) throw customersRes.error;
      setCustomers(customersRes.data || []);

      if (!dealersRes.error) {
        setDealers(dealersRes.data || []);
      }

    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================
  const metrics = useMemo(() => {
    const activeQuotes = quotes.filter(q => ACTIVE_STATUSES.includes(q.status));
    const wonQuotes = quotes.filter(q => q.status === 'won');
    const lostQuotes = quotes.filter(q => q.status === 'lost');

    const pipelineValue = activeQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
    const weightedPipelineValue = activeQuotes.reduce((sum, q) => {
      const outlook = q.outlook_percentage || 50;
      return sum + ((q.total_price || 0) * (outlook / 100));
    }, 0);

    const wonValue = wonQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
    const closedQuotes = wonQuotes.length + lostQuotes.length;
    const winRate = closedQuotes > 0 ? Math.round((wonQuotes.length / closedQuotes) * 100) : 0;

    return {
      pipelineValue,
      weightedPipelineValue,
      pipelineCount: activeQuotes.length,
      wonValue,
      wonCount: wonQuotes.length,
      lostCount: lostQuotes.length,
      winRate,
      totalQuotes: quotes.length
    };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        quote.quote_number?.toLowerCase().includes(searchLower) ||
        quote.project_name?.toLowerCase().includes(searchLower) ||
        quote.customer?.company_name?.toLowerCase().includes(searchLower) ||
        quote.praxis_quote_number?.toLowerCase().includes(searchLower);

      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = ACTIVE_STATUSES.includes(quote.status);
      } else if (statusFilter !== 'all') {
        matchesStatus = quote.status === statusFilter;
      }

      const matchesBuildingType = buildingTypeFilter === 'all' || quote.building_type === buildingTypeFilter;

      return matchesSearch && matchesStatus && matchesBuildingType;
    });
  }, [quotes, searchQuery, statusFilter, buildingTypeFilter]);

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
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              My Sales Dashboard
            </h1>
            {userFactory && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(59, 130, 246, 0.15)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#3b82f6'
              }}>
                <Factory size={14} />
                {userFactory}
              </span>
            )}
          </div>
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
            margin: '4px 0 0'
          }}>
            Track your quotes, pipeline, and customer relationships
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPraxisImport(true)}
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
            <FileUp size={18} />
            Import from Praxis
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              onBlur={() => setTimeout(() => setShowNewDropdown(false), 150)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'var(--sunbelt-orange)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} />
              New
              <ChevronDown size={16} style={{
                transition: 'transform 0.2s',
                transform: showNewDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
              }} />
            </button>

            {showNewDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                minWidth: '160px',
                zIndex: 100
              }}>
                <button
                  onClick={() => {
                    setShowNewDropdown(false);
                    handleNewQuote();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FileText size={16} style={{ color: 'var(--sunbelt-orange)' }} />
                  New Quote
                </button>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 8px' }} />
                <button
                  onClick={() => {
                    setShowNewDropdown(false);
                    setShowCustomerForm(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Building2 size={16} style={{ color: '#8b5cf6' }} />
                  New Customer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Metrics Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px',
        marginBottom: '20px',
        background: 'var(--border-color)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Pipeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <DollarSign size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>My Pipeline</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {formatCompactCurrency(metrics.pipelineValue)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              {metrics.pipelineCount} active quotes
            </div>
          </div>
        </div>

        {/* Weighted */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TrendingUp size={18} style={{ color: '#06b6d4' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Weighted</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#06b6d4' }}>
              {formatCompactCurrency(metrics.weightedPipelineValue)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              probability adjusted
            </div>
          </div>
        </div>

        {/* Won */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Award size={18} style={{ color: '#22c55e' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Won</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#22c55e' }}>
              {formatCompactCurrency(metrics.wonValue)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              {metrics.wonCount} deals
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Percent size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Win Rate</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {metrics.winRate}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              {metrics.wonCount}W / {metrics.lostCount}L
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Monthly trends */}
      <QuickStats quotes={quotes} />

      {/* Needs Attention Section */}
      <NeedsAttentionSection quotes={quotes} onQuoteClick={handleViewQuote} />

      {/* Pipeline Status */}
      <MyPipelineStatus quotes={quotes} />

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
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
          maxWidth: '350px'
        }}>
          <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search my quotes..."
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <option value="active">Active Pipeline</option>
          <option value="all">All My Quotes</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label} Only</option>
          ))}
        </select>

        <select
          value={buildingTypeFilter}
          onChange={(e) => setBuildingTypeFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Types</option>
          {BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

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

      {/* Results Count */}
      <div style={{
        fontSize: '0.8rem',
        color: 'var(--text-tertiary)',
        marginBottom: '12px'
      }}>
        Showing {filteredQuotes.length} {statusFilter === 'active' ? 'active' : ''} quotes
        {statusFilter === 'active' && quotes.length > filteredQuotes.length && (
          <span style={{ color: 'var(--text-tertiary)' }}>
            {' '}({quotes.length - filteredQuotes.length} won/lost/expired not shown)
          </span>
        )}
      </div>

      {/* Quotes List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '12px' }}>Loading your quotes...</div>
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
            {searchQuery || statusFilter !== 'active' || buildingTypeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first quote to get started'}
          </div>
          {!searchQuery && statusFilter === 'active' && buildingTypeFilter === 'all' && (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredQuotes.map(quote => {
            const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusConfig.icon;
            const daysOld = getDaysAgo(quote.created_at);
            const agingColor = getAgingColor(daysOld);

            return (
              <div
                key={quote.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 18px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  borderLeft: `4px solid ${agingColor}`,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s'
                }}
                onClick={() => handleViewQuote(quote)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.borderLeftColor = agingColor;
                }}
              >
                {/* Status Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: statusConfig.bgColor,
                  flexShrink: 0
                }}>
                  <StatusIcon size={18} style={{ color: statusConfig.color }} />
                </div>

                {/* Main Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}>
                      {quote.notes || quote.customer?.company_name || 'Untitled Quote'}
                    </span>
                    <code style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-tertiary)',
                      background: 'var(--bg-tertiary)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {quote.praxis_quote_number || quote.quote_number}
                    </code>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: statusConfig.bgColor,
                      color: statusConfig.color,
                      fontWeight: '500'
                    }}>
                      {statusConfig.label}
                    </span>
                    {quote.pm_flagged && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#8b5cf6',
                        fontWeight: '500'
                      }}>
                        <Flag size={10} />
                        PM
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-tertiary)',
                    flexWrap: 'wrap'
                  }}>
                    {(quote.customer?.company_name || quote.dealer?.name) && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={12} />
                        {quote.dealer?.name || quote.customer?.company_name}
                      </span>
                    )}
                    <span>{quote.factory}</span>
                    {quote.square_footage && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Ruler size={12} />
                        {quote.square_footage.toLocaleString()} sqft
                      </span>
                    )}
                    {daysOld !== null && (
                      <span style={{ color: agingColor, fontWeight: daysOld >= AGING_THRESHOLDS.stale ? '600' : '400' }}>
                        {getAgingLabel(daysOld)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Praxis Data Column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', minWidth: '80px' }}>
                  {quote.outlook_percentage && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: quote.outlook_percentage >= 90 ? 'rgba(34, 197, 94, 0.15)' :
                                 quote.outlook_percentage >= 70 ? 'rgba(245, 158, 11, 0.15)' :
                                 'rgba(100, 116, 139, 0.15)',
                      color: quote.outlook_percentage >= 90 ? '#22c55e' :
                             quote.outlook_percentage >= 70 ? '#f59e0b' :
                             'var(--text-secondary)',
                      fontWeight: '600'
                    }}>
                      {quote.outlook_percentage}%
                    </div>
                  )}
                  {quote.difficulty_rating && renderDifficultyRating(quote.difficulty_rating)}
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {formatCurrency(quote.total_price)}
                  </div>
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
                      padding: '7px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteQuote(quote)}
                    title="Delete"
                    style={{
                      padding: '7px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
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

      {showCustomerForm && (
        <CustomerForm
          onSave={handleCustomerSaved}
          onCancel={() => setShowCustomerForm(false)}
        />
      )}

      {showPraxisImport && (
        <PraxisQuoteImportModal
          isOpen={showPraxisImport}
          onClose={() => setShowPraxisImport(false)}
          onSuccess={() => {
            setShowPraxisImport(false);
            fetchData();
          }}
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

export default SalesRepDashboard;
