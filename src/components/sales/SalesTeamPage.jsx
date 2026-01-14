// ============================================================================
// SalesTeamPage Component
// ============================================================================
// Dedicated page for Sales Managers to view team performance metrics.
// Shows workload distribution across sales team members.
//
// FEATURES:
// - Sales rep workload cards with capacity indicators
// - Quote distribution and pipeline breakdown
// - Win rate and conversion tracking per rep
// - Sortable by different metrics
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  DollarSign,
  Award,
  AlertCircle,
  TrendingUp,
  Target,
  User,
  ChevronRight,
  RefreshCw,
  FileText,
  Clock,
  Percent
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const ACTIVE_STATUSES = ['draft', 'sent', 'negotiating', 'pending', 'awaiting_po', 'po_received'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SalesTeamPage({ onNavigateToQuote }) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [sortBy, setSortBy] = useState('pipeline'); // pipeline, active, winRate, overdue

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [quotesRes, teamRes] = await Promise.all([
        supabase
          .from('sales_quotes')
          .select(`
            *,
            customer:customer_id(id, company_name),
            dealer:dealer_id(id, code, name)
          `)
          .eq('is_latest_version', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('id, name, role, email, factory_id')
          .in('role', ['Sales_Rep', 'Sales_Manager'])
          .eq('is_active', true)
          .order('name')
      ]);

      if (quotesRes.error) throw quotesRes.error;
      setQuotes(quotesRes.data || []);

      if (!teamRes.error) {
        setSalesTeam(teamRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching sales team data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================================================
  // CALCULATE WORKLOAD PER TEAM MEMBER
  // ==========================================================================
  const workloadData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return salesTeam.map(member => {
      const memberQuotes = quotes.filter(q => q.assigned_to === member.id);
      const activeQuotes = memberQuotes.filter(q => ACTIVE_STATUSES.includes(q.status));
      const wonQuotes = memberQuotes.filter(q => q.status === 'won');
      const lostQuotes = memberQuotes.filter(q => q.status === 'lost');

      // Pipeline value (raw and weighted)
      const pipelineValue = activeQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
      const weightedValue = activeQuotes.reduce((sum, q) => {
        const outlook = q.outlook_percentage || 50;
        return sum + ((q.total_price || 0) * (outlook / 100));
      }, 0);

      // Won value
      const wonValue = wonQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);

      // Win rate
      const closedCount = wonQuotes.length + lostQuotes.length;
      const winRate = closedCount > 0 ? Math.round((wonQuotes.length / closedCount) * 100) : 0;

      // Stale quotes (over 30 days without activity)
      const staleQuotes = activeQuotes.filter(q => {
        const created = new Date(q.created_at);
        const daysSinceCreated = Math.floor((today - created) / (1000 * 60 * 60 * 24));
        return daysSinceCreated >= 30;
      });

      // Recent wins (last 30 days)
      const recentWins = wonQuotes.filter(q => {
        if (!q.won_date) return false;
        const wonDate = new Date(q.won_date);
        return wonDate >= thirtyDaysAgo;
      });

      // Capacity score (simplified)
      // Higher score = more available capacity
      const capacityScore = Math.min(100, Math.max(0,
        100 - (activeQuotes.length * 8) - (staleQuotes.length * 15)
      ));

      return {
        ...member,
        totalQuotes: memberQuotes.length,
        activeQuotes: activeQuotes.length,
        wonCount: wonQuotes.length,
        lostCount: lostQuotes.length,
        pipelineValue,
        weightedValue,
        wonValue,
        winRate,
        staleCount: staleQuotes.length,
        recentWins: recentWins.length,
        capacityScore,
        quotes: activeQuotes.slice(0, 5) // Top 5 active quotes for detail view
      };
    }).sort((a, b) => {
      switch (sortBy) {
        case 'pipeline': return b.pipelineValue - a.pipelineValue;
        case 'active': return b.activeQuotes - a.activeQuotes;
        case 'winRate': return b.winRate - a.winRate;
        case 'overdue': return b.staleCount - a.staleCount;
        default: return b.pipelineValue - a.pipelineValue;
      }
    });
  }, [quotes, salesTeam, sortBy]);

  // ==========================================================================
  // TOTALS
  // ==========================================================================
  const totals = useMemo(() => {
    return workloadData.reduce((acc, member) => ({
      totalPipeline: acc.totalPipeline + member.pipelineValue,
      totalWeighted: acc.totalWeighted + member.weightedValue,
      totalWon: acc.totalWon + member.wonValue,
      totalActive: acc.totalActive + member.activeQuotes,
      totalStale: acc.totalStale + member.staleCount
    }), {
      totalPipeline: 0,
      totalWeighted: 0,
      totalWon: 0,
      totalActive: 0,
      totalStale: 0
    });
  }, [workloadData]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getCapacityColor = (score) => {
    if (score >= 60) return '#22c55e';
    if (score >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const getCapacityLabel = (score) => {
    if (score >= 60) return 'Available';
    if (score >= 30) return 'Busy';
    return 'At Capacity';
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>
          Loading team data...
        </p>
      </div>
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
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Users size={28} style={{ color: '#10b981' }} />
            Sales Team
          </h1>
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
            margin: '4px 0 0'
          }}>
            Track team performance, workload, and pipeline distribution
          </p>
        </div>

        <button
          onClick={fetchData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Team Summary Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '1px',
        marginBottom: '24px',
        background: 'var(--border-color)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Total Pipeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Target size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Total Pipeline</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>
              {formatCurrency(totals.totalPipeline)}
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
              {formatCurrency(totals.totalWeighted)}
            </div>
          </div>
        </div>

        {/* Total Won */}
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
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Won Revenue</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#22c55e' }}>
              {formatCurrency(totals.totalWon)}
            </div>
          </div>
        </div>

        {/* Active Quotes */}
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
            <FileText size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Active Quotes</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {totals.totalActive}
            </div>
          </div>
        </div>

        {/* Stale Quotes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: totals.totalStale > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={16} style={{ color: totals.totalStale > 0 ? '#ef4444' : 'var(--text-tertiary)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Stale (30d+)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: totals.totalStale > 0 ? '#ef4444' : 'var(--text-primary)' }}>
              {totals.totalStale}
            </div>
          </div>
        </div>
      </div>

      {/* Sort Options + Team Count */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {salesTeam.length} team members
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'pipeline', label: 'Pipeline' },
            { id: 'active', label: 'Active' },
            { id: 'winRate', label: 'Win Rate' },
            { id: 'overdue', label: 'Stale' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              style={{
                padding: '6px 12px',
                background: sortBy === opt.id ? '#10b981' : 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: '6px',
                color: sortBy === opt.id ? 'white' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team Grid */}
      {workloadData.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <Users size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '8px' }}>
            No sales team members found
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            Add users with the Sales_Rep or Sales_Manager role to see team performance
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {workloadData.map(member => {
            const maxPipeline = Math.max(...workloadData.map(m => m.pipelineValue), 1);
            const barWidth = (member.pipelineValue / maxPipeline) * 100;
            const isSelected = selectedMember === member.id;

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(isSelected ? null : member.id)}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: `1px solid ${isSelected ? '#10b981' : 'var(--border-color)'}`,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {/* Member Header */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: member.role === 'Sales_Manager'
                        ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}>
                      {member.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {member.role === 'Sales_Manager' ? 'Sales Manager' : 'Sales Rep'}
                      </div>
                    </div>
                  </div>

                  {/* Capacity Badge */}
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    background: `${getCapacityColor(member.capacityScore)}20`,
                    color: getCapacityColor(member.capacityScore)
                  }}>
                    {getCapacityLabel(member.capacityScore)}
                  </div>
                </div>

                {/* Pipeline Value */}
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Pipeline Value
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                        {formatCurrency(member.pipelineValue)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Weighted
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#06b6d4' }}>
                        {formatCurrency(member.weightedValue)}
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Bar */}
                  <div style={{
                    height: '6px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Stats Grid */}
                <div style={{
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px'
                }}>
                  {/* Active */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {member.activeQuotes}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Active
                    </div>
                  </div>

                  {/* Won */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22c55e' }}>
                      {member.wonCount}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Won
                    </div>
                  </div>

                  {/* Lost */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444' }}>
                      {member.lostCount}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Lost
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--info)' }}>
                      {member.winRate}%
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Win Rate
                    </div>
                  </div>
                </div>

                {/* Stale Warning */}
                {member.staleCount > 0 && (
                  <div style={{
                    padding: '10px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={14} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '500' }}>
                      {member.staleCount} stale quote{member.staleCount > 1 ? 's' : ''} (30+ days)
                    </span>
                  </div>
                )}

                {/* Expanded Details */}
                {isSelected && member.quotes.length > 0 && (
                  <div style={{
                    padding: '16px',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-tertiary)'
                  }}>
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                      marginBottom: '10px'
                    }}>
                      Active Quotes
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {member.quotes.map(quote => (
                        <div
                          key={quote.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToQuote?.(quote);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                              {quote.project_name || quote.quote_number}
                            </div>
                            {quote.customer?.company_name && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                {quote.customer.company_name}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {formatCurrency(quote.total_price)}
                            </span>
                            <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SalesTeamPage;
