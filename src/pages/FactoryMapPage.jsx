// ============================================================================
// FactoryMapPage - Under Construction
// ============================================================================
// The Factory Map feature is being rebuilt as a standalone implementation.
// This page shows a placeholder until the new version is ready.
//
// See docs/FACTORY_MAP_STANDALONE_PLAN.md for implementation details.
// ============================================================================

import React from 'react';
import { Factory, Construction, Wrench, Clock } from 'lucide-react';

const FactoryMapPage = () => {
  return (
    <div style={{ padding: '20px', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Factory size={28} style={{ color: 'var(--sunbelt-orange)' }} />
          Factory Network Map
        </h2>
        <p style={{
          color: 'var(--text-tertiary)',
          fontSize: '0.9rem',
          margin: '4px 0 0'
        }}>
          Interactive view of all Sunbelt manufacturing facilities
        </p>
      </div>

      {/* Under Construction Card */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '48px',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Construction size={40} style={{ color: '#f59e0b' }} />
        </div>

        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: '0 0 12px'
        }}>
          Under Construction
        </h3>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          margin: '0 0 24px'
        }}>
          The Factory Network Map is being rebuilt with improved performance and reliability.
          The new version will feature an interactive map showing all Sunbelt factory locations,
          active deliveries, and real-time project status.
        </p>

        {/* Feature List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          textAlign: 'left',
          background: 'var(--bg-tertiary)',
          borderRadius: '8px',
          padding: '16px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Factory size={18} style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              14 factory locations with live project counts
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wrench size={18} style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Click-to-navigate to factory projects
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={18} style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Real-time delivery tracking (coming soon)
            </span>
          </div>
        </div>

        <p style={{
          color: 'var(--text-tertiary)',
          fontSize: '0.85rem',
          margin: '24px 0 0',
          fontStyle: 'italic'
        }}>
          Check back soon for updates!
        </p>
      </div>
    </div>
  );
};

export default FactoryMapPage;
