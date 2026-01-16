// ============================================================================
// Skeleton Components - Loading State Placeholders
// ============================================================================
// Provides shimmer-animated skeleton components for loading states.
// Based on DEBUG_TEST_GUIDE Phase 2.1 recommendations.
//
// Usage:
//   import { SkeletonCard, SkeletonTable, SkeletonKanban } from './Skeleton';
//   if (loading) return <SkeletonTable rows={5} columns={4} />;
//
// Created: January 16, 2026
// ============================================================================

import React from 'react';

// ============================================================================
// STYLES
// ============================================================================
const styles = {
  // Base shimmer animation
  shimmer: {
    background: 'linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary) 50%, var(--bg-secondary) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
    borderRadius: '4px'
  },

  // Card skeleton
  card: {
    padding: '20px',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '10px',
    background: 'var(--bg-secondary)'
  },
  cardTitle: {
    height: '20px',
    marginBottom: '12px',
    width: '60%'
  },
  cardText: {
    height: '14px',
    marginBottom: '8px',
    width: '100%'
  },
  cardTextShort: {
    width: '40%'
  },

  // Table skeleton
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableRow: {
    display: 'flex',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid var(--border-primary)'
  },
  tableHeader: {
    height: '16px',
    flex: 1
  },
  tableCell: {
    height: '14px',
    flex: 1
  },

  // Kanban skeleton
  kanban: {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto'
  },
  kanbanColumn: {
    flex: '0 0 280px',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    padding: '12px'
  },
  kanbanHeader: {
    height: '24px',
    marginBottom: '16px',
    width: '50%'
  },
  kanbanCard: {
    height: '80px',
    marginBottom: '8px',
    borderRadius: 'var(--radius-sm)'
  },

  // Stats grid skeleton
  statsGrid: {
    display: 'grid',
    gap: '16px'
  },
  statCard: {
    padding: '20px',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)'
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginBottom: '12px'
  },
  statValue: {
    height: '32px',
    width: '60px',
    marginBottom: '8px'
  },
  statLabel: {
    height: '14px',
    width: '80px'
  },

  // List skeleton
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)'
  },
  listAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    flexShrink: 0
  },
  listContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  listTitle: {
    height: '16px',
    width: '70%'
  },
  listSubtitle: {
    height: '12px',
    width: '40%'
  }
};

// Inject keyframes animation (only once)
if (typeof document !== 'undefined' && !document.getElementById('skeleton-keyframes')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'skeleton-keyframes';
  styleSheet.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(styleSheet);
}

// ============================================================================
// SKELETON CARD
// ============================================================================
export function SkeletonCard({ lines = 3 }) {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.shimmer, ...styles.cardTitle }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            ...styles.shimmer,
            ...styles.cardText,
            ...(i === lines - 1 ? styles.cardTextShort : {})
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SKELETON TABLE
// ============================================================================
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div style={styles.table}>
      {/* Header */}
      <div style={styles.tableRow}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} style={{ ...styles.shimmer, ...styles.tableHeader }} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={styles.tableRow}>
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} style={{ ...styles.shimmer, ...styles.tableCell }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SKELETON KANBAN
// ============================================================================
export function SkeletonKanban({ columns = 4, cardsPerColumn = 3 }) {
  return (
    <div style={styles.kanban}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} style={styles.kanbanColumn}>
          <div style={{ ...styles.shimmer, ...styles.kanbanHeader }} />
          {Array.from({ length: cardsPerColumn }).map((_, j) => (
            <div key={j} style={{ ...styles.shimmer, ...styles.kanbanCard }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SKELETON STATS GRID
// ============================================================================
export function SkeletonStatsGrid({ count = 4, columns = 4 }) {
  return (
    <div style={{ ...styles.statsGrid, gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={styles.statCard}>
          <div style={{ ...styles.shimmer, ...styles.statIcon }} />
          <div style={{ ...styles.shimmer, ...styles.statValue }} />
          <div style={{ ...styles.shimmer, ...styles.statLabel }} />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SKELETON LIST
// ============================================================================
export function SkeletonList({ items = 5, showAvatar = true }) {
  return (
    <div style={styles.list}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={styles.listItem}>
          {showAvatar && <div style={{ ...styles.shimmer, ...styles.listAvatar }} />}
          <div style={styles.listContent}>
            <div style={{ ...styles.shimmer, ...styles.listTitle }} />
            <div style={{ ...styles.shimmer, ...styles.listSubtitle }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SKELETON TEXT
// ============================================================================
export function SkeletonText({ width = '100%', height = '14px' }) {
  return (
    <div style={{ ...styles.shimmer, width, height }} />
  );
}

// ============================================================================
// GENERIC LOADING SPINNER
// ============================================================================
export function LoadingSpinner({ size = 40, color = 'var(--sunbelt-orange)' }) {
  return (
    <div style={{
      width: size,
      height: size,
      border: `3px solid var(--border-primary)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// FULL PAGE LOADING
// ============================================================================
export function FullPageLoader({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '16px'
    }}>
      <LoadingSpinner size={48} />
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        {message}
      </div>
    </div>
  );
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================
export default {
  SkeletonCard,
  SkeletonTable,
  SkeletonKanban,
  SkeletonStatsGrid,
  SkeletonList,
  SkeletonText,
  LoadingSpinner,
  FullPageLoader
};
