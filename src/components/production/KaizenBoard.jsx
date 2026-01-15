// ============================================================================
// KaizenBoard.jsx - Digital Kaizen Suggestion Board (PGM-016)
// ============================================================================
// Employee improvement idea tracking with submission, review, and leaderboard.
//
// Props:
// - factoryId: Factory UUID (required)
// - compact: Boolean for dashboard widget mode (default: false)
// - onSuggestionClick: Callback when suggestion is clicked
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Lightbulb,
  Plus,
  X,
  Award,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  User,
  Eye,
  EyeOff,
  Trophy,
  Filter,
  ChevronRight,
  Camera,
  Sparkles,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import {
  getKaizenSuggestions,
  createKaizenSuggestion,
  getKaizenLeaderboard
} from '../../services/efficiencyService';

const CATEGORIES = [
  { value: 'safety', label: 'Safety', color: '#ef4444' },
  { value: 'efficiency', label: 'Efficiency', color: '#22c55e' },
  { value: 'quality', label: 'Quality', color: '#6366f1' },
  { value: 'cost', label: 'Cost Reduction', color: '#f59e0b' },
  { value: 'other', label: 'Other', color: '#8b5cf6' }
];

const STATUS_CONFIG = {
  'Submitted': { color: '#6b7280', icon: Send, label: 'Submitted' },
  'Under Review': { color: '#f59e0b', icon: Clock, label: 'Under Review' },
  'Approved': { color: '#22c55e', icon: CheckCircle2, label: 'Approved' },
  'Implemented': { color: '#6366f1', icon: Sparkles, label: 'Implemented' },
  'Rejected': { color: '#ef4444', icon: XCircle, label: 'Rejected' }
};

export default function KaizenBoard({
  factoryId,
  compact = false,
  onSuggestionClick
}) {
  // State
  const [suggestions, setSuggestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); // eslint-disable-line no-unused-vars
  const [selectedSuggestion, setSelectedSuggestion] = useState(null); // eslint-disable-line no-unused-vars
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // New suggestion form
  const [newSuggestion, setNewSuggestion] = useState({
    title: '',
    description: '',
    category: 'efficiency',
    is_anonymous: false
  });

  // Fetch data callback
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [suggestionsRes, leaderboardRes] = await Promise.all([
        getKaizenSuggestions(factoryId, { limit: compact ? 5 : 100 }),
        getKaizenLeaderboard(factoryId, 5)
      ]);
      setSuggestions(suggestionsRes.data || []);
      setLeaderboard(leaderboardRes.data || []);
    } catch (error) {
      console.error('Error fetching Kaizen data:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId, compact]);

  // Fetch data on mount and when factory changes
  useEffect(() => {
    if (factoryId) {
      fetchData();
    }
  }, [factoryId, fetchData]);

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(s => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      return true;
    });
  }, [suggestions, filterStatus, filterCategory]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: suggestions.length,
      pending: suggestions.filter(s => s.status === 'Submitted' || s.status === 'Under Review').length,
      approved: suggestions.filter(s => s.status === 'Approved' || s.status === 'Implemented').length,
      totalSavings: suggestions
        .filter(s => s.status === 'Approved' || s.status === 'Implemented')
        .reduce((sum, s) => sum + (s.estimated_savings || 0), 0),
      totalBonuses: suggestions.reduce((sum, s) => sum + (s.bonus_amount || 0), 0)
    };
  }, [suggestions]);

  // Handle new suggestion submit
  const handleSubmit = async () => {
    if (!newSuggestion.title.trim()) return;

    try {
      await createKaizenSuggestion({
        factory_id: factoryId,
        ...newSuggestion
      });
      setShowNewModal(false);
      setNewSuggestion({
        title: '',
        description: '',
        category: 'efficiency',
        is_anonymous: false
      });
      fetchData();
    } catch (error) {
      console.error('Error creating suggestion:', error);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    } else {
      setSelectedSuggestion(suggestion);
      setShowDetailModal(true);
    }
  };

  // Styles
  const styles = {
    container: {
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-primary)',
      overflow: 'hidden'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: compact ? 'var(--space-md)' : 'var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-tertiary)'
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      margin: 0,
      fontSize: compact ? '1rem' : '1.125rem',
      fontWeight: '600',
      color: 'var(--text-primary)'
    },
    headerIcon: {
      color: '#f59e0b'
    },
    content: {
      padding: compact ? 'var(--space-md)' : 'var(--space-lg)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: 'var(--space-md)',
      marginBottom: 'var(--space-lg)'
    },
    statCard: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    statIcon: {
      width: '40px',
      height: '40px',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    statValue: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: 'var(--text-primary)'
    },
    statLabel: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    filterBar: {
      display: 'flex',
      gap: 'var(--space-sm)',
      marginBottom: 'var(--space-md)',
      flexWrap: 'wrap'
    },
    filterSelect: {
      padding: 'var(--space-xs) var(--space-sm)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-primary)',
      fontSize: '0.875rem',
      cursor: 'pointer'
    },
    suggestionList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    },
    suggestionCard: {
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md)',
      cursor: 'pointer',
      border: '1px solid transparent',
      transition: 'all 0.15s ease'
    },
    suggestionHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 'var(--space-xs)'
    },
    suggestionTitle: {
      fontSize: '0.9375rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      margin: 0
    },
    suggestionMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      fontSize: '0.8125rem',
      color: 'var(--text-secondary)'
    },
    categoryBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    leaderboardSection: {
      marginTop: 'var(--space-lg)',
      padding: 'var(--space-md)',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)'
    },
    leaderboardTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-sm)'
    },
    leaderboardList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)'
    },
    leaderboardItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-xs) 0',
      fontSize: '0.8125rem'
    },
    leaderboardRank: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    newButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-sm) var(--space-md)',
      background: '#f59e0b',
      color: 'white',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.15s ease'
    },
    viewAllLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: 'var(--text-secondary)',
      fontSize: '0.8125rem',
      cursor: 'pointer',
      marginTop: 'var(--space-md)',
      justifyContent: 'center'
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-lg)'
    },
    modal: {
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: 'var(--shadow-xl)'
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-lg)',
      borderBottom: '1px solid var(--border-primary)'
    },
    modalTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      margin: 0
    },
    modalClose: {
      background: 'none',
      border: 'none',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      padding: 'var(--space-xs)'
    },
    modalBody: {
      padding: 'var(--space-lg)'
    },
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-sm)',
      padding: 'var(--space-lg)',
      borderTop: '1px solid var(--border-primary)'
    },
    formGroup: {
      marginBottom: 'var(--space-md)'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-xs)'
    },
    input: {
      width: '100%',
      padding: 'var(--space-sm) var(--space-md)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      fontSize: '0.9375rem'
    },
    textarea: {
      width: '100%',
      padding: 'var(--space-sm) var(--space-md)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      fontSize: '0.9375rem',
      minHeight: '100px',
      resize: 'vertical'
    },
    select: {
      width: '100%',
      padding: 'var(--space-sm) var(--space-md)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      fontSize: '0.9375rem',
      cursor: 'pointer'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)',
      cursor: 'pointer'
    },
    button: {
      padding: 'var(--space-sm) var(--space-md)',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    buttonPrimary: {
      background: '#f59e0b',
      color: 'white',
      border: 'none'
    },
    buttonSecondary: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-primary)'
    },
    emptyState: {
      textAlign: 'center',
      padding: 'var(--space-xl)',
      color: 'var(--text-secondary)'
    }
  };

  const getCategoryStyle = (category) => {
    const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[4];
    return {
      background: `${cat.color}20`,
      color: cat.color
    };
  };

  const getStatusStyle = (status) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Submitted'];
    return {
      background: `${cfg.color}20`,
      color: cfg.color
    };
  };

  // Render compact version
  if (compact) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>
            <Lightbulb size={18} style={styles.headerIcon} />
            Kaizen Board
          </h3>
          <button
            style={styles.newButton}
            onClick={() => setShowNewModal(true)}
          >
            <Plus size={14} />
            New Idea
          </button>
        </div>

        <div style={styles.content}>
          {/* Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, background: 'rgba(99, 102, 241, 0.15)'}}>
                <MessageSquare size={18} color="#6366f1" />
              </div>
              <div>
                <div style={styles.statValue}>{stats.pending}</div>
                <div style={styles.statLabel}>Pending</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, background: 'rgba(34, 197, 94, 0.15)'}}>
                <CheckCircle2 size={18} color="#22c55e" />
              </div>
              <div>
                <div style={styles.statValue}>{stats.approved}</div>
                <div style={styles.statLabel}>Approved</div>
              </div>
            </div>
          </div>

          {/* Recent suggestions */}
          <div style={styles.suggestionList}>
            {loading ? (
              <div style={styles.emptyState}>Loading...</div>
            ) : filteredSuggestions.length === 0 ? (
              <div style={styles.emptyState}>No suggestions yet</div>
            ) : (
              filteredSuggestions.slice(0, 3).map(suggestion => (
                <div
                  key={suggestion.id}
                  style={styles.suggestionCard}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div style={styles.suggestionHeader}>
                    <h4 style={styles.suggestionTitle}>{suggestion.title}</h4>
                    <span style={{...styles.statusBadge, ...getStatusStyle(suggestion.status)}}>
                      {suggestion.status}
                    </span>
                  </div>
                  <div style={styles.suggestionMeta}>
                    <span style={{...styles.categoryBadge, ...getCategoryStyle(suggestion.category)}}>
                      {CATEGORIES.find(c => c.value === suggestion.category)?.label || 'Other'}
                    </span>
                    {suggestion.is_anonymous ? (
                      <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <EyeOff size={12} /> Anonymous
                      </span>
                    ) : (
                      <span>{suggestion.worker?.full_name || suggestion.user?.full_name || 'Unknown'}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            style={styles.viewAllLink}
            onClick={() => {/* Navigate to full view */}}
          >
            View All Suggestions <ChevronRight size={14} />
          </div>
        </div>

        {/* New Suggestion Modal */}
        {showNewModal && (
          <div style={styles.modalOverlay} onClick={() => setShowNewModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Submit New Idea</h3>
                <button style={styles.modalClose} onClick={() => setShowNewModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Title *</label>
                  <input
                    style={styles.input}
                    value={newSuggestion.title}
                    onChange={e => setNewSuggestion({...newSuggestion, title: e.target.value})}
                    placeholder="Brief title for your idea"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    style={styles.textarea}
                    value={newSuggestion.description}
                    onChange={e => setNewSuggestion({...newSuggestion, description: e.target.value})}
                    placeholder="Describe your improvement idea..."
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    style={styles.select}
                    value={newSuggestion.category}
                    onChange={e => setNewSuggestion({...newSuggestion, category: e.target.value})}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={newSuggestion.is_anonymous}
                      onChange={e => setNewSuggestion({...newSuggestion, is_anonymous: e.target.checked})}
                    />
                    Submit anonymously
                  </label>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button
                  style={{...styles.button, ...styles.buttonSecondary}}
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button
                  style={{...styles.button, ...styles.buttonPrimary}}
                  onClick={handleSubmit}
                  disabled={!newSuggestion.title.trim()}
                >
                  Submit Idea
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>
          <Lightbulb size={20} style={styles.headerIcon} />
          Kaizen Suggestion Board
        </h3>
        <button
          style={styles.newButton}
          onClick={() => setShowNewModal(true)}
        >
          <Plus size={16} />
          Submit New Idea
        </button>
      </div>

      <div style={styles.content}>
        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(99, 102, 241, 0.15)'}}>
              <Lightbulb size={20} color="#6366f1" />
            </div>
            <div>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Total Ideas</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(245, 158, 11, 0.15)'}}>
              <Clock size={20} color="#f59e0b" />
            </div>
            <div>
              <div style={styles.statValue}>{stats.pending}</div>
              <div style={styles.statLabel}>Pending Review</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(34, 197, 94, 0.15)'}}>
              <CheckCircle2 size={20} color="#22c55e" />
            </div>
            <div>
              <div style={styles.statValue}>{stats.approved}</div>
              <div style={styles.statLabel}>Approved</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: 'rgba(16, 185, 129, 0.15)'}}>
              <DollarSign size={20} color="#10b981" />
            </div>
            <div>
              <div style={styles.statValue}>${stats.totalSavings.toLocaleString()}</div>
              <div style={styles.statLabel}>Est. Savings</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterBar}>
          <select
            style={styles.filterSelect}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            style={styles.filterSelect}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Suggestions List */}
        <div style={styles.suggestionList}>
          {loading ? (
            <div style={styles.emptyState}>Loading suggestions...</div>
          ) : filteredSuggestions.length === 0 ? (
            <div style={styles.emptyState}>
              <Lightbulb size={40} style={{marginBottom: 'var(--space-sm)', opacity: 0.5}} />
              <p>No suggestions found</p>
              <p style={{fontSize: '0.875rem'}}>Be the first to submit an improvement idea!</p>
            </div>
          ) : (
            filteredSuggestions.map(suggestion => {
              const StatusIcon = STATUS_CONFIG[suggestion.status]?.icon || Send;
              return (
                <div
                  key={suggestion.id}
                  style={styles.suggestionCard}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.background = 'var(--bg-primary)';
                  }}
                >
                  <div style={styles.suggestionHeader}>
                    <div>
                      <h4 style={styles.suggestionTitle}>{suggestion.title}</h4>
                      {suggestion.description && (
                        <p style={{
                          margin: 'var(--space-xs) 0 0',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.4'
                        }}>
                          {suggestion.description.length > 150
                            ? suggestion.description.substring(0, 150) + '...'
                            : suggestion.description}
                        </p>
                      )}
                    </div>
                    <span style={{...styles.statusBadge, ...getStatusStyle(suggestion.status)}}>
                      <StatusIcon size={12} />
                      {suggestion.status}
                    </span>
                  </div>
                  <div style={{...styles.suggestionMeta, marginTop: 'var(--space-sm)'}}>
                    <span style={{...styles.categoryBadge, ...getCategoryStyle(suggestion.category)}}>
                      {CATEGORIES.find(c => c.value === suggestion.category)?.label || 'Other'}
                    </span>
                    {suggestion.is_anonymous ? (
                      <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <EyeOff size={12} /> Anonymous
                      </span>
                    ) : (
                      <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <User size={12} />
                        {suggestion.worker?.full_name || suggestion.user?.full_name || 'Unknown'}
                      </span>
                    )}
                    {suggestion.bonus_amount > 0 && (
                      <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981'}}>
                        <Award size={12} />
                        ${suggestion.bonus_amount} bonus
                      </span>
                    )}
                    {suggestion.estimated_savings > 0 && (
                      <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e'}}>
                        <TrendingUp size={12} />
                        ${suggestion.estimated_savings.toLocaleString()} savings
                      </span>
                    )}
                    <span style={{color: 'var(--text-tertiary)', fontSize: '0.75rem'}}>
                      {new Date(suggestion.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div style={styles.leaderboardSection}>
            <h4 style={styles.leaderboardTitle}>
              <Trophy size={16} color="#f59e0b" />
              Top Contributors
            </h4>
            <div style={styles.leaderboardList}>
              {leaderboard.map((entry, index) => (
                <div key={entry.id} style={styles.leaderboardItem}>
                  <div style={styles.leaderboardRank}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : index === 2 ? '#d97706' : 'var(--bg-tertiary)',
                      color: index < 3 ? 'white' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: '600'
                    }}>
                      {index + 1}
                    </span>
                    <span style={{color: 'var(--text-primary)'}}>{entry.name}</span>
                  </div>
                  <span style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {entry.count} {entry.count === 1 ? 'idea' : 'ideas'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Suggestion Modal */}
      {showNewModal && (
        <div style={styles.modalOverlay} onClick={() => setShowNewModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Submit New Improvement Idea</h3>
              <button style={styles.modalClose} onClick={() => setShowNewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title *</label>
                <input
                  style={styles.input}
                  value={newSuggestion.title}
                  onChange={e => setNewSuggestion({...newSuggestion, title: e.target.value})}
                  placeholder="Brief title for your idea"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  value={newSuggestion.description}
                  onChange={e => setNewSuggestion({...newSuggestion, description: e.target.value})}
                  placeholder="Describe your improvement idea in detail..."
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  style={styles.select}
                  value={newSuggestion.category}
                  onChange={e => setNewSuggestion({...newSuggestion, category: e.target.value})}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={newSuggestion.is_anonymous}
                    onChange={e => setNewSuggestion({...newSuggestion, is_anonymous: e.target.checked})}
                  />
                  <span>Submit anonymously</span>
                </label>
                <p style={{
                  margin: 'var(--space-xs) 0 0',
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)'
                }}>
                  Your name won't be shown with the suggestion
                </p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{...styles.button, ...styles.buttonSecondary}}
                onClick={() => setShowNewModal(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  opacity: newSuggestion.title.trim() ? 1 : 0.5
                }}
                onClick={handleSubmit}
                disabled={!newSuggestion.title.trim()}
              >
                Submit Idea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
