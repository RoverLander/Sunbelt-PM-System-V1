// ============================================================================
// SalesManagerDashboard.jsx - Sales Manager Dashboard
// ============================================================================
// Dashboard for Sales Managers to see all quotes and projects at their factory.
// Can view team performance, all quotes at their factory, and converted projects.
//
// Visibility Rules:
// - See all quotes at their factory (not just their own)
// - View team member performance
// - See all converted projects at their factory
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
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  Edit2,
  Trash2,
  RefreshCw,
  Award,
  Percent,
  Loader2,
  FileUp,
  AlertTriangle,
  Flag,
  Package,
  Ruler,
  Star,
  Timer,
  ArrowRight,
  Users,
  User,
  Factory
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import QuoteForm from './QuoteForm';
import QuoteDetail from './QuoteDetail';
import CustomerForm from './CustomerForm';
import PraxisQuoteImportModal from './PraxisQuoteImportModal';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#64748b', icon: FileText, bgColor: 'rgba(100, 116, 139, 0.1)', order: 1 },
  pending: { label: 'Pending', color: '#a855f7', icon: Clock, bgColor: 'rgba(168, 85, 247, 0.1)', order: 2 },
  sent: { label: 'Sent', color: '#3b82f6', icon: Send, bgColor: 'rgba(59, 130, 246, 0.1)', order: 3 },
  negotiating: { label: 'Negotiating', color: '#f59e0b', icon: Clock, bgColor: 'rgba(245, 158, 11, 0.1)', order: 4 },
  awaiting_po: { label: 'Awaiting PO', color: '#8b5cf6', icon: Timer, bgColor: 'rgba(139, 92, 246, 0.1)', order: 5 },
  po_received: { label: 'PO Received', color: '#06b6d4', icon: CheckCircle, bgColor: 'rgba(6, 182, 212, 0.1)', order: 6 },
  won: { label: 'Won', color: '#22c55e', icon: Award, bgColor: 'rgba(34, 197, 94, 0.1)', order: 7 },
  lost: { label: 'Lost', color: '#ef4444', icon: XCircle, bgColor: 'rgba(239, 68, 68, 0.1)', order: 8 },
  expired: { label: 'Expired', color: '#6b7280', icon: Clock, bgColor: 'rgba(107, 114, 128, 0.1)', order: 9 },
  converted: { label: 'Converted', color: '#10b981', icon: ArrowRight, bgColor: 'rgba(16, 185, 129, 0.1)', order: 10 }
};

const ACTIVE_STATUSES = ['draft', 'sent', 'negotiating', 'pending', 'awaiting_po', 'po_received'];
const BUILDING_TYPES = ['CUSTOM', 'FLEET/STOCK', 'GOVERNMENT', 'Business'];
const BUILDING_TYPE_COLORS = {
  'CUSTOM': '#f59e0b',
  'FLEET/STOCK': '#3b82f6',
  'GOVERNMENT': '#22c55e',
  'Business': '#8b5cf6'
};

const FACTORIES = ['NWBS', 'WM-EAST', 'WM-WEST', 'MM', 'SSI', 'MS', 'MG', 'SEMO', 'PMI', 'AMTEX', 'BRIT', 'CB', 'IND', 'MRS'];

const AGING_THRESHOLDS = {
  fresh: 15,
  aging: 25,
  stale: 30
};

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

const formatCompactCurrency = (amount) => {
  if (!amount && amount !== 0) return '-';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return formatCurrency(amount);
};

const getDaysAgo = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getAgingColor = (daysOld) => {
  if (daysOld === null) return 'var(--text-tertiary)';
  if (daysOld <= AGING_THRESHOLDS.fresh) return '#22c55e';
  if (daysOld <= AGING_THRESHOLDS.aging) return '#f59e0b';
  return '#ef4444';
};

const getAgingLabel = (daysOld) => {
  if (daysOld === null) return '';
  if (daysOld === 0) return 'Today';
  if (daysOld <= AGING_THRESHOLDS.fresh) return `${daysOld}d`;
  if (daysOld <= AGING_THRESHOLDS.aging) return `${daysOld}d (aging)`;
  return `${daysOld}d (stale)`;
};

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
// SALES FUNNEL COMPONENT
// ============================================================================
const SalesFunnel = ({ quotes, onStageClick, activeFilter }) => {
  const stages = useMemo(() => {
    const stageData = [
      { key: 'draft', ...STATUS_CONFIG.draft },
      { key: 'sent', ...STATUS_CONFIG.sent },
      { key: 'negotiating', ...STATUS_CONFIG.negotiating },
      { key: 'awaiting_po', ...STATUS_CONFIG.awaiting_po },
      { key: 'po_received', ...STATUS_CONFIG.po_received },
      { key: 'converted', ...STATUS_CONFIG.converted }
    ];

    return stageData.map(stage => {
      const stageQuotes = quotes.filter(q => q.status === stage.key);
      const count = stageQuotes.length;
      const value = stageQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
      const weightedValue = stageQuotes.reduce((sum, q) => {
        const outlook = q.outlook_percentage || 50;
        return sum + ((q.total_price || 0) * (outlook / 100));
      }, 0);
      return { ...stage, count, value, weightedValue };
    });
  }, [quotes]);

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      padding: '20px',
      marginBottom: '24px'
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
        <TrendingUp size={18} style={{ color: 'var(--sunbelt-orange)' }} />
        Sales Funnel
      </h3>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '120px' }}>
        {stages.map((stage, idx) => {
          const heightPercent = (stage.count / maxCount) * 100;
          const isActive = activeFilter === stage.key;
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              onClick={() => onStageClick(stage.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                opacity: isActive ? 1 : 0.8,
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: '100%',
                height: `${Math.max(heightPercent, 10)}%`,
                background: isActive ? stage.color : stage.bgColor,
                borderRadius: '6px 6px 0 0',
                border: `2px solid ${stage.color}`,
                borderBottom: idx < stages.length - 1 ? 'none' : `2px solid ${stage.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '30px',
                transition: 'all 0.2s'
              }}>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: isActive ? 'white' : stage.color
                }}>
                  {stage.count}
                </span>
              </div>
              <div style={{
                width: '100%',
                padding: '8px 4px',
                textAlign: 'center',
                background: isActive ? stage.bgColor : 'transparent',
                borderRadius: '0 0 6px 6px'
              }}>
                <Icon size={14} style={{ color: stage.color, marginBottom: '4px' }} />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                  {stage.label}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: stage.color }}>
                  {formatCompactCurrency(stage.value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// BUILDING TYPE CHART COMPONENT
// ============================================================================
const BuildingTypeChart = ({ quotes }) => {
  const breakdown = useMemo(() => {
    const types = {};
    BUILDING_TYPES.forEach(type => {
      types[type] = { count: 0, value: 0 };
    });
    types['Other'] = { count: 0, value: 0 };

    quotes.forEach(q => {
      if (ACTIVE_STATUSES.includes(q.status)) {
        const type = q.building_type && BUILDING_TYPES.includes(q.building_type)
          ? q.building_type
          : 'Other';
        types[type].count++;
        types[type].value += q.total_price || 0;
      }
    });

    return Object.entries(types)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => ({
        type,
        ...data,
        color: BUILDING_TYPE_COLORS[type] || '#6b7280'
      }));
  }, [quotes]);

  const totalValue = breakdown.reduce((sum, b) => sum + b.value, 0);

  if (breakdown.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      padding: '20px'
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
        <Package size={18} style={{ color: 'var(--sunbelt-orange)' }} />
        Pipeline by Building Type
      </h3>
      <div style={{ display: 'flex', gap: '4px', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
        {breakdown.map(item => (
          <div
            key={item.type}
            style={{
              width: `${(item.value / totalValue) * 100}%`,
              background: item.color,
              minWidth: item.value > 0 ? '4px' : 0
            }}
            title={`${item.type}: ${formatCurrency(item.value)}`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {breakdown.map(item => (
          <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              background: item.color
            }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {item.type}: {item.count} ({formatCompactCurrency(item.value)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// STALE QUOTES ALERT COMPONENT
// ============================================================================
const StaleQuotesAlert = ({ quotes, onQuoteClick }) => {
  const staleQuotes = useMemo(() => {
    return quotes
      .filter(q => {
        if (!ACTIVE_STATUSES.includes(q.status)) return false;
        const daysOld = getDaysAgo(q.created_at);
        return daysOld !== null && daysOld >= AGING_THRESHOLDS.stale;
      })
      .sort((a, b) => getDaysAgo(b.created_at) - getDaysAgo(a.created_at))
      .slice(0, 5);
  }, [quotes]);

  if (staleQuotes.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(239, 68, 68, 0.1)',
      borderRadius: '12px',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      padding: '16px',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <AlertTriangle size={18} style={{ color: '#ef4444' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ef4444' }}>
          Stale Quotes ({staleQuotes.length})
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          Over 30 days without activity
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {staleQuotes.map(quote => (
          <button
            key={quote.id}
            onClick={() => onQuoteClick(quote)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              {quote.project_name || quote.quote_number}
            </span>
            <span style={{ color: '#ef4444', fontWeight: '600' }}>
              {getDaysAgo(quote.created_at)}d
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// PM FLAGGED SECTION COMPONENT
// ============================================================================
const PMFlaggedSection = ({ quotes, onQuoteClick }) => {
  const flaggedQuotes = useMemo(() => {
    return quotes
      .filter(q => q.pm_flagged)
      .sort((a, b) => new Date(b.pm_flagged_at || 0) - new Date(a.pm_flagged_at || 0));
  }, [quotes]);

  if (flaggedQuotes.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(139, 92, 246, 0.1)',
      borderRadius: '12px',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      padding: '16px',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <Flag size={18} style={{ color: '#8b5cf6' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#8b5cf6' }}>
          Flagged for PM ({flaggedQuotes.length})
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {flaggedQuotes.slice(0, 3).map(quote => (
          <button
            key={quote.id}
            onClick={() => onQuoteClick(quote)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                {quote.project_name || quote.quote_number}
              </div>
              {quote.pm_flagged_reason && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {quote.pm_flagged_reason}
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {formatCompactCurrency(quote.total_price)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SalesManagerDashboard() {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);
  const [userFactory, setUserFactory] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [factoryFilter, setFactoryFilter] = useState('all');
  const [buildingTypeFilter, setBuildingTypeFilter] = useState('all');
  const [showPMFlaggedOnly, setShowPMFlaggedOnly] = useState(false);
  const [teamMemberFilter, setTeamMemberFilter] = useState('all');

  // Modals
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showPraxisImport, setShowPraxisImport] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showNewDropdown, setShowNewDropdown] = useState(false);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // First get the user's factory
      let factory = null;
      if (user?.id) {
        const { data: userData } = await supabase
          .from('users')
          .select('factory')
          .eq('id', user.id)
          .single();
        factory = userData?.factory;
        setUserFactory(factory);
      }

      // Build quotes query - Sales Managers see all quotes at their factory
      let quotesQuery = supabase
        .from('sales_quotes')
        .select(`
          *,
          customer:customer_id(id, company_name, contact_name),
          assigned_user:assigned_to(id, name, factory),
          dealer:dealer_id(id, code, name, branch_name)
        `)
        .eq('is_latest_version', true)
        .order('created_at', { ascending: false });

      // Filter by factory if the user has one
      if (factory) {
        quotesQuery = quotesQuery.eq('factory', factory);
      }

      const [quotesRes, customersRes, dealersRes, salesTeamRes] = await Promise.all([
        quotesQuery,
        supabase
          .from('sales_customers')
          .select('*')
          .order('company_name'),
        supabase
          .from('dealers')
          .select('*')
          .eq('is_active', true)
          .order('name'),
        // Fetch sales team members at this factory
        factory ? supabase
          .from('users')
          .select('id, name, role, email, factory')
          .in('role', ['Sales_Rep', 'Sales_Manager'])
          .eq('factory', factory)
          .eq('is_active', true)
          .order('name')
        : supabase
          .from('users')
          .select('id, name, role, email, factory')
          .in('role', ['Sales_Rep', 'Sales_Manager'])
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

      if (!salesTeamRes.error) {
        setSalesTeam(salesTeamRes.data || []);
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
    const pmFlaggedQuotes = quotes.filter(q => q.pm_flagged && ACTIVE_STATUSES.includes(q.status));

    const pipelineValue = activeQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
    const weightedPipelineValue = activeQuotes.reduce((sum, q) => {
      const outlook = q.outlook_percentage || 50;
      return sum + ((q.total_price || 0) * (outlook / 100));
    }, 0);

    const wonValue = wonQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
    const closedQuotes = wonQuotes.length + lostQuotes.length;
    const winRate = closedQuotes > 0 ? Math.round((wonQuotes.length / closedQuotes) * 100) : 0;

    const staleCount = activeQuotes.filter(q => {
      const daysOld = getDaysAgo(q.created_at);
      return daysOld !== null && daysOld >= AGING_THRESHOLDS.stale;
    }).length;

    return {
      pipelineValue,
      weightedPipelineValue,
      pipelineCount: activeQuotes.length,
      wonValue,
      wonCount: wonQuotes.length,
      lostCount: lostQuotes.length,
      winRate,
      pmFlaggedCount: pmFlaggedQuotes.length,
      staleCount
    };
  }, [quotes]);

  // Team performance metrics
  const teamMetrics = useMemo(() => {
    if (salesTeam.length === 0) return [];

    return salesTeam.map(member => {
      const memberQuotes = quotes.filter(q => q.assigned_to === member.id);
      const activeQuotes = memberQuotes.filter(q => ACTIVE_STATUSES.includes(q.status));
      const wonQuotes = memberQuotes.filter(q => q.status === 'won');
      const lostQuotes = memberQuotes.filter(q => q.status === 'lost');

      const pipelineValue = activeQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
      const weightedValue = activeQuotes.reduce((sum, q) => {
        const outlook = q.outlook_percentage || 50;
        return sum + ((q.total_price || 0) * (outlook / 100));
      }, 0);
      const wonValue = wonQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
      const closedCount = wonQuotes.length + lostQuotes.length;
      const winRate = closedCount > 0 ? Math.round((wonQuotes.length / closedCount) * 100) : 0;

      return {
        ...member,
        totalQuotes: memberQuotes.length,
        activeQuotes: activeQuotes.length,
        wonCount: wonQuotes.length,
        lostCount: lostQuotes.length,
        pipelineValue,
        weightedValue,
        wonValue,
        winRate
      };
    }).sort((a, b) => b.pipelineValue - a.pipelineValue);
  }, [quotes, salesTeam]);

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

      const matchesFactory = factoryFilter === 'all' || quote.factory === factoryFilter;
      const matchesBuildingType = buildingTypeFilter === 'all' || quote.building_type === buildingTypeFilter;
      const matchesPMFlagged = !showPMFlaggedOnly || quote.pm_flagged;
      const matchesTeamMember = teamMemberFilter === 'all' || quote.assigned_to === teamMemberFilter;

      return matchesSearch && matchesStatus && matchesFactory && matchesBuildingType && matchesPMFlagged && matchesTeamMember;
    });
  }, [quotes, searchQuery, statusFilter, factoryFilter, buildingTypeFilter, showPMFlaggedOnly, teamMemberFilter]);

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

  const handleFunnelStageClick = (stage) => {
    setStatusFilter(statusFilter === stage ? 'active' : stage);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Sales Manager Dashboard
            </h1>
            {userFactory && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(139, 92, 246, 0.15)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#8b5cf6'
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
            Track team quotes, pipeline, and customer relationships
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
        gridTemplateColumns: metrics.pmFlaggedCount > 0 ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)',
        gap: '1px',
        marginBottom: '16px',
        background: 'var(--border-color)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Pipeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <DollarSign size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Pipeline</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {formatCompactCurrency(metrics.pipelineValue)}
              <span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '6px' }}>
                ({metrics.pipelineCount})
              </span>
            </div>
          </div>
        </div>

        {/* Weighted */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TrendingUp size={16} style={{ color: '#06b6d4' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Weighted</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#06b6d4' }}>
              {formatCompactCurrency(metrics.weightedPipelineValue)}
            </div>
          </div>
        </div>

        {/* Won */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Award size={16} style={{ color: '#22c55e' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Won</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#22c55e' }}>
              {formatCompactCurrency(metrics.wonValue)}
              <span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '6px' }}>
                ({metrics.wonCount})
              </span>
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Percent size={16} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Win Rate</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {metrics.winRate}%
              <span style={{ fontSize: '0.7rem', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '6px' }}>
                {metrics.wonCount}W/{metrics.lostCount}L
              </span>
            </div>
          </div>
        </div>

        {/* Team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={16} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Team</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {salesTeam.length}
            </div>
          </div>
        </div>

        {/* PM Flagged */}
        {metrics.pmFlaggedCount > 0 && (
          <div
            onClick={() => setShowPMFlaggedOnly(!showPMFlaggedOnly)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 20px',
              background: showPMFlaggedOnly ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Flag size={16} style={{ color: '#ef4444' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>PM Flagged</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444' }}>
                {metrics.pmFlaggedCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sales Funnel */}
      <SalesFunnel
        quotes={quotes}
        onStageClick={handleFunnelStageClick}
        activeFilter={statusFilter}
      />

      {/* Building Type Chart */}
      <div style={{ marginBottom: '16px' }}>
        <BuildingTypeChart quotes={quotes} />
      </div>

      {/* Team Overview */}
      {salesTeam.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Users size={16} style={{ color: '#10b981' }} />
              Team Overview
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {salesTeam.length} members
            </span>
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {teamMetrics.slice(0, 6).map(member => {
              const maxPipeline = Math.max(...teamMetrics.map(m => m.pipelineValue), 1);
              const barWidth = (member.pipelineValue / maxPipeline) * 100;

              return (
                <div
                  key={member.id}
                  onClick={() => setTeamMemberFilter(teamMemberFilter === member.id ? 'all' : member.id)}
                  style={{
                    flex: '1 1 200px',
                    padding: '10px 12px',
                    background: teamMemberFilter === member.id ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: teamMemberFilter === member.id ? '1px solid #10b981' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: member.role === 'Sales_Manager' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={12} style={{ color: member.role === 'Sales_Manager' ? '#8b5cf6' : '#3b82f6' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {member.name?.split(' ')[0]}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10b981' }}>
                      {formatCompactCurrency(member.pipelineValue)}
                    </span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: '2px', height: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: '#10b981',
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {teamMemberFilter !== 'all' && (
            <div style={{
              marginTop: '10px',
              padding: '6px 10px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
                Filtering: <strong>{salesTeam.find(m => m.id === teamMemberFilter)?.name}</strong>
              </span>
              <button
                onClick={() => setTeamMemberFilter('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: '600'
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Alerts Section */}
      <StaleQuotesAlert quotes={quotes} onQuoteClick={handleViewQuote} />
      <PMFlaggedSection quotes={quotes} onQuoteClick={handleViewQuote} />

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
            placeholder="Search quotes..."
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
          <option value="all">All Quotes</option>
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
        {userFactory && ` at ${userFactory}`}
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
                    {quote.assigned_user?.name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <User size={12} />
                        {quote.assigned_user.name}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', minWidth: '100px' }}>
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
                  {quote.waiting_on && (
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-tertiary)',
                      maxWidth: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={quote.waiting_on}
                    >
                      {quote.waiting_on}
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

export default SalesManagerDashboard;
