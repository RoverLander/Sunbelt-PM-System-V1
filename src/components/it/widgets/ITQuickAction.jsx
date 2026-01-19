// ============================================================================
// ITQuickAction.jsx - Quick Action Button
// ============================================================================
// Styled button for quick actions in the IT Dashboard
// ============================================================================

import React from 'react';
import { ChevronRight } from 'lucide-react';

function ITQuickAction({
  icon: Icon,
  label,
  description,
  onClick,
  color = 'var(--sunbelt-orange)',
  variant = 'default', // 'default' | 'compact' | 'card'
  disabled = false
}) {
  if (variant === 'compact') {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.8125rem',
          textAlign: 'left',
          width: '100%',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.background = 'var(--bg-tertiary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-primary)';
        }}
      >
        <Icon size={14} style={{ color: disabled ? 'var(--text-tertiary)' : color }} />
        <span style={{ flex: 1 }}>{label}</span>
        <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={20} style={{ color: disabled ? 'var(--text-tertiary)' : color }} />
        </div>
        <span style={{ fontSize: '0.8125rem', fontWeight: '500' }}>{label}</span>
        {description && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
            {description}
          </span>
        )}
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.875rem',
        textAlign: 'left',
        width: '100%',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s'
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'var(--bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--bg-primary)';
      }}
    >
      <Icon size={16} style={{ color: disabled ? 'var(--text-tertiary)' : color }} />
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
    </button>
  );
}

export default ITQuickAction;
