// ============================================================================
// VPProductionDashboard.jsx - VP Multi-Plant Production Dashboard (PGM-022)
// ============================================================================
// Executive view showing aggregated production metrics across all factories with
// drill-down capability and side-by-side comparison.
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Factory,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  ChevronRight,
  RefreshCw,
  Settings,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Filter,
  ArrowUpRight,
  Gauge
} from 'lucide-react';
import {
  getAggregateMetrics
} from '../../services/vpService';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VPProductionDashboard({ onNavigateToFactory, onNavigateToConfig }) {
  // State
  const [aggregateData, setAggregateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid, table, compare
  const [selectedFactories, setSelectedFactories] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // name, oee, modules, value

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getAggregateMetrics();
      if (error) throw error;
      setAggregateData(data);
    } catch (error) {
      console.error('Error fetching VP data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sort factories
  const sortedFactories = React.useMemo(() => {
    if (!aggregateData?.factories) return [];

    const factories = [...aggregateData.factories];

    switch (sortBy) {
      case 'oee':
        return factories.sort((a, b) => (b.metrics?.oee || 0) - (a.metrics?.oee || 0));
      case 'modules':
        return factories.sort((a, b) => (b.metrics?.activeModules || 0) - (a.metrics?.activeModules || 0));
      case 'value':
        return factories.sort((a, b) => (b.metrics?.totalContractValue || 0) - (a.metrics?.totalContractValue || 0));
      case 'workers':
        return factories.sort((a, b) => (b.metrics?.activeWorkers || 0) - (a.metrics?.activeWorkers || 0));
      default:
        return factories.sort((a, b) => a.short_name.localeCompare(b.short_name));
    }
  }, [aggregateData?.factories, sortBy]);

  // Toggle factory selection for comparison
  const toggleFactorySelection = (factoryId) => {
    setSelectedFactories(prev =>
      prev.includes(factoryId)
        ? prev.filter(id => id !== factoryId)
        : [...prev, factoryId]
    );
  };

  // Get OEE status color
  const getOEEColor = (oee) => {
    if (oee >= 85) return '#22c55e';
    if (oee >= 75) return '#84cc16';
    if (oee >= 65) return '#f59e0b';
    return '#ef4444';
  };

  // Format currency
  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Styles
  const styles = {
    container: {
      padding: 'var(--space-xl)',
      maxWidth: '1600px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 'var(--space-xl)'
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      fontSize: '1.5rem',
      fontWeight: '600',
      color: 'var(--text-primary)'
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)'
    },
    actionButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-sm) var(--space-md)',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    actionButtonPrimary: {
      background: 'var(--sunbelt-orange)',
      borderColor: 'var(--sunbelt-orange)',
      color: 'white'
    },

    // Aggregate stats
    aggregateSection: {
      marginBottom: 'var(--space-xl)'
    },
    aggregateGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 'var(--space-lg)'
    },
    aggregateCard: {
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-primary)',
      padding: 'var(--space-lg)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-md)'
    },
    aggregateIcon: {
      padding: 'var(--space-sm)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    aggregateValue: {
      fontSize: '1.75rem',
      fontWeight: '700',
      color: 'var(--text-primary)',
      lineHeight: '1'
    },
    aggregateLabel: {
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      marginTop: 'var(--space-xs)'
    },

    // View controls
    viewControls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 'var(--space-lg)'
    },
    viewTabs: {
      display: 'flex',
      gap: 'var(--space-xs)',
      background: 'var(--bg-tertiary)',
      padding: 'var(--space-xs)',
      borderRadius: 'var(--radius-md)'
    },
    viewTab: {
      padding: 'var(--space-sm) var(--space-md)',
      background: 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.15s ease'
    },
    viewTabActive: {
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-sm)'
    },
    sortSelect: {
      padding: 'var(--space-sm) var(--space-md)',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      fontSize: '0.875rem',
      cursor: 'pointer'
    },

    // Factory grid
    factoryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: 'var(--space-lg)'
    },
    factoryCard: {
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-primary)',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    factoryCardSelected: {
      borderColor: 'var(--sunbelt-orange)',
      boxShadow: '0 0 0 2px rgba(255, 107, 53, 0.2)'
    },
    factoryHeader: {
      padding: 'var(--space-lg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-tertiary)'
    },
    factoryName: {
      fontWeight: '600',
      color: 'var(--text-primary)',
      fontSize: '1rem'
    },
    factoryCode: {
      fontSize: '0.75rem',
      color: 'var(--text-tertiary)',
      fontFamily: 'var(--font-mono)'
    },
    factoryLocation: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)'
    },
    factoryBody: {
      padding: 'var(--space-lg)'
    },
    factoryMetrics: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 'var(--space-md)'
    },
    factoryMetric: {
      textAlign: 'center'
    },
    metricValue: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'var(--text-primary)'
    },
    metricLabel: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      marginTop: '2px'
    },
    factoryFooter: {
      padding: 'var(--space-md) var(--space-lg)',
      borderTop: '1px solid var(--border-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--bg-tertiary)'
    },
    oeeGauge: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    oeeValue: {
      fontWeight: '700',
      fontSize: '1.125rem'
    },
    viewButton: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-xs) var(--space-sm)',
      background: 'transparent',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: '0.75rem'
    },

    // Table view
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--border-primary)'
    },
    tableHead: {
      background: 'var(--bg-tertiary)'
    },
    th: {
      padding: 'var(--space-md)',
      textAlign: 'left',
      fontWeight: '600',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid var(--border-primary)'
    },
    td: {
      padding: 'var(--space-md)',
      borderBottom: '1px solid var(--border-primary)',
      fontSize: '0.875rem',
      color: 'var(--text-primary)'
    },
    tableRow: {
      cursor: 'pointer',
      transition: 'background 0.15s ease'
    },

    // Compare view
    compareContainer: {
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(selectedFactories.length || 2, 4)}, 1fr)`,
      gap: 'var(--space-lg)'
    },
    compareCard: {
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-primary)',
      overflow: 'hidden'
    },
    compareHeader: {
      padding: 'var(--space-lg)',
      background: 'var(--bg-tertiary)',
      borderBottom: '1px solid var(--border-primary)',
      textAlign: 'center'
    },
    compareMetrics: {
      padding: 'var(--space-lg)'
    },
    compareRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'var(--space-sm) 0',
      borderBottom: '1px solid var(--border-secondary)'
    },
    compareLabel: {
      fontSize: '0.875rem',
      color: 'var(--text-secondary)'
    },
    compareValue: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--text-primary)'
    },

    // Loading
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px'
    },
    spinner: {
      animation: 'spin 1s linear infinite'
    },

    // Empty state
    emptyState: {
      textAlign: 'center',
      padding: 'var(--space-xxl)',
      color: 'var(--text-secondary)'
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <RefreshCw size={32} color="var(--text-tertiary)" style={styles.spinner} />
        </div>
      </div>
    );
  }

  // Empty state
  if (!aggregateData || !aggregateData.factories?.length) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <Building2 size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
          <p>No factory data available</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <Building2 size={28} color="var(--sunbelt-orange)" />
          Multi-Plant Production Overview
        </div>
        <div style={styles.headerActions}>
          <button style={styles.actionButton} onClick={fetchData}>
            <RefreshCw size={16} />
            Refresh
          </button>
          {onNavigateToConfig && (
            <button
              style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
              onClick={onNavigateToConfig}
            >
              <Settings size={16} />
              Configure
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Stats */}
      <div style={styles.aggregateSection}>
        <div style={styles.aggregateGrid}>
          <div style={styles.aggregateCard}>
            <div style={{ ...styles.aggregateIcon, background: 'rgba(99, 102, 241, 0.15)' }}>
              <Factory size={24} color="#6366f1" />
            </div>
            <div>
              <div style={styles.aggregateValue}>{aggregateData.totalFactories}</div>
              <div style={styles.aggregateLabel}>Active Factories</div>
            </div>
          </div>

          <div style={styles.aggregateCard}>
            <div style={{ ...styles.aggregateIcon, background: 'rgba(34, 197, 94, 0.15)' }}>
              <Package size={24} color="#22c55e" />
            </div>
            <div>
              <div style={styles.aggregateValue}>{aggregateData.totalModules}</div>
              <div style={styles.aggregateLabel}>Active Modules</div>
            </div>
          </div>

          <div style={styles.aggregateCard}>
            <div style={{ ...styles.aggregateIcon, background: 'rgba(59, 130, 246, 0.15)' }}>
              <Users size={24} color="#3b82f6" />
            </div>
            <div>
              <div style={styles.aggregateValue}>{aggregateData.totalWorkers}</div>
              <div style={styles.aggregateLabel}>Total Workers</div>
            </div>
          </div>

          <div style={styles.aggregateCard}>
            <div style={{ ...styles.aggregateIcon, background: 'rgba(245, 158, 11, 0.15)' }}>
              <DollarSign size={24} color="#f59e0b" />
            </div>
            <div>
              <div style={styles.aggregateValue}>{formatCurrency(aggregateData.totalContractValue)}</div>
              <div style={styles.aggregateLabel}>Total Contract Value</div>
            </div>
          </div>

          <div style={styles.aggregateCard}>
            <div style={{ ...styles.aggregateIcon, background: `rgba(${aggregateData.avgOEE >= 75 ? '34, 197, 94' : '239, 68, 68'}, 0.15)` }}>
              <Gauge size={24} color={getOEEColor(aggregateData.avgOEE)} />
            </div>
            <div>
              <div style={{ ...styles.aggregateValue, color: getOEEColor(aggregateData.avgOEE) }}>
                {aggregateData.avgOEE}%
              </div>
              <div style={styles.aggregateLabel}>Fleet OEE Average</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div style={styles.viewControls}>
        <div style={styles.viewTabs}>
          <button
            style={{ ...styles.viewTab, ...(viewMode === 'grid' ? styles.viewTabActive : {}) }}
            onClick={() => setViewMode('grid')}
          >
            Grid View
          </button>
          <button
            style={{ ...styles.viewTab, ...(viewMode === 'table' ? styles.viewTabActive : {}) }}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
          <button
            style={{ ...styles.viewTab, ...(viewMode === 'compare' ? styles.viewTabActive : {}) }}
            onClick={() => setViewMode('compare')}
            disabled={selectedFactories.length < 2}
          >
            Compare ({selectedFactories.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sort by:</span>
          <select
            style={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="oee">OEE</option>
            <option value="modules">Active Modules</option>
            <option value="value">Contract Value</option>
            <option value="workers">Workers</option>
          </select>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div style={styles.factoryGrid}>
          {sortedFactories.map(factory => (
            <div
              key={factory.id}
              style={{
                ...styles.factoryCard,
                ...(selectedFactories.includes(factory.id) ? styles.factoryCardSelected : {})
              }}
              onClick={() => toggleFactorySelection(factory.id)}
              onDoubleClick={() => onNavigateToFactory?.(factory.id)}
            >
              <div style={styles.factoryHeader}>
                <div>
                  <div style={styles.factoryName}>{factory.short_name}</div>
                  <div style={styles.factoryCode}>{factory.code}</div>
                </div>
                <div style={styles.factoryLocation}>
                  {factory.city}, {factory.state}
                </div>
              </div>

              <div style={styles.factoryBody}>
                <div style={styles.factoryMetrics}>
                  <div style={styles.factoryMetric}>
                    <div style={styles.metricValue}>{factory.metrics?.activeModules || 0}</div>
                    <div style={styles.metricLabel}>Active Modules</div>
                  </div>
                  <div style={styles.factoryMetric}>
                    <div style={styles.metricValue}>{factory.metrics?.activeProjects || 0}</div>
                    <div style={styles.metricLabel}>Projects</div>
                  </div>
                  <div style={styles.factoryMetric}>
                    <div style={styles.metricValue}>{factory.metrics?.activeWorkers || 0}</div>
                    <div style={styles.metricLabel}>Workers</div>
                  </div>
                  <div style={styles.factoryMetric}>
                    <div style={styles.metricValue}>{factory.metrics?.qcPassRate || 100}%</div>
                    <div style={styles.metricLabel}>QC Pass Rate</div>
                  </div>
                </div>
              </div>

              <div style={styles.factoryFooter}>
                <div style={styles.oeeGauge}>
                  <Gauge size={18} color={getOEEColor(factory.metrics?.oee || 0)} />
                  <span style={{ ...styles.oeeValue, color: getOEEColor(factory.metrics?.oee || 0) }}>
                    {factory.metrics?.oee || 0}% OEE
                  </span>
                </div>
                <button
                  style={styles.viewButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToFactory?.(factory.id);
                  }}
                >
                  View <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.th}>Factory</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>OEE</th>
              <th style={styles.th}>Modules</th>
              <th style={styles.th}>Projects</th>
              <th style={styles.th}>Workers</th>
              <th style={styles.th}>Contract Value</th>
              <th style={styles.th}>QC Rate</th>
            </tr>
          </thead>
          <tbody>
            {sortedFactories.map(factory => (
              <tr
                key={factory.id}
                style={styles.tableRow}
                onClick={() => onNavigateToFactory?.(factory.id)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={styles.td}>
                  <div style={{ fontWeight: '600' }}>{factory.short_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{factory.code}</div>
                </td>
                <td style={styles.td}>{factory.city}, {factory.state}</td>
                <td style={styles.td}>
                  <span style={{ fontWeight: '600', color: getOEEColor(factory.metrics?.oee || 0) }}>
                    {factory.metrics?.oee || 0}%
                  </span>
                </td>
                <td style={styles.td}>{factory.metrics?.activeModules || 0}</td>
                <td style={styles.td}>{factory.metrics?.activeProjects || 0}</td>
                <td style={styles.td}>{factory.metrics?.activeWorkers || 0}</td>
                <td style={styles.td}>{formatCurrency(factory.metrics?.totalContractValue || 0)}</td>
                <td style={styles.td}>{factory.metrics?.qcPassRate || 100}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Compare View */}
      {viewMode === 'compare' && selectedFactories.length >= 2 && (
        <div style={styles.compareContainer}>
          {sortedFactories
            .filter(f => selectedFactories.includes(f.id))
            .map(factory => (
              <div key={factory.id} style={styles.compareCard}>
                <div style={styles.compareHeader}>
                  <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{factory.short_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{factory.code}</div>
                </div>
                <div style={styles.compareMetrics}>
                  <div style={styles.compareRow}>
                    <span style={styles.compareLabel}>OEE</span>
                    <span style={{ ...styles.compareValue, color: getOEEColor(factory.metrics?.oee || 0) }}>
                      {factory.metrics?.oee || 0}%
                    </span>
                  </div>
                  <div style={styles.compareRow}>
                    <span style={styles.compareLabel}>Active Modules</span>
                    <span style={styles.compareValue}>{factory.metrics?.activeModules || 0}</span>
                  </div>
                  <div style={styles.compareRow}>
                    <span style={styles.compareLabel}>Projects</span>
                    <span style={styles.compareValue}>{factory.metrics?.activeProjects || 0}</span>
                  </div>
                  <div style={styles.compareRow}>
                    <span style={styles.compareLabel}>Workers</span>
                    <span style={styles.compareValue}>{factory.metrics?.activeWorkers || 0}</span>
                  </div>
                  <div style={styles.compareRow}>
                    <span style={styles.compareLabel}>Contract Value</span>
                    <span style={styles.compareValue}>
                      {formatCurrency(factory.metrics?.totalContractValue || 0)}
                    </span>
                  </div>
                  <div style={styles.compareRow}>
                    <span style={styles.compareLabel}>QC Pass Rate</span>
                    <span style={styles.compareValue}>{factory.metrics?.qcPassRate || 100}%</span>
                  </div>
                  <div style={styles.compareRow}>
                    <span style={styles.compareLabel}>In Progress</span>
                    <span style={styles.compareValue}>{factory.metrics?.modulesInProgress || 0}</span>
                  </div>
                  <div style={styles.compareRow}>
                    <span style={styles.compareLabel}>Today Hours</span>
                    <span style={styles.compareValue}>{factory.metrics?.todayHours || 0}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {viewMode === 'compare' && selectedFactories.length < 2 && (
        <div style={styles.emptyState}>
          <PieChart size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-md)' }} />
          <p>Select at least 2 factories to compare</p>
          <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-sm)' }}>
            Click on factory cards in Grid view to select them
          </p>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
