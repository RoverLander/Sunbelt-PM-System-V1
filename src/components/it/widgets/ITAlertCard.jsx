// ============================================================================
// ITAlertCard.jsx - Alert/Notification Card
// ============================================================================
// Displays system alerts with severity levels
// ============================================================================

import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X, ChevronRight } from 'lucide-react';

function ITAlertCard({
  type = 'info', // 'error' | 'warning' | 'info' | 'success'
  title,
  message,
  timestamp,
  onView,
  onDismiss,
  compact = false
}) {
  const typeConfig = {
    error: {
      icon: AlertCircle,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)'
    },
    warning: {
      icon: AlertTriangle,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)'
    },
    info: {
      icon: Info,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)'
    },
    success: {
      icon: CheckCircle,
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.3)'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        onClick={onView}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          background: config.bg,
          borderRadius: '8px',
          border: `1px solid ${config.border}`,
          cursor: onView ? 'pointer' : 'default',
          transition: 'all 0.15s'
        }}
      >
        <Icon size={16} style={{ color: config.color, flexShrink: 0 }} />
        <span style={{
          flex: 1,
          fontSize: '0.8125rem',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </span>
        {onView && (
          <span style={{
            fontSize: '0.75rem',
            color: config.color,
            fontWeight: '500'
          }}>
            View
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '14px 16px',
      background: config.bg,
      borderRadius: '10px',
      border: `1px solid ${config.border}`,
      position: 'relative'
    }}>
      {/* Icon */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: `${config.color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={18} style={{ color: config.color }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: '600',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          marginBottom: message ? '4px' : 0
        }}>
          {title}
        </div>
        {message && (
          <div style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4
          }}>
            {message}
          </div>
        )}
        {timestamp && (
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)',
            marginTop: '6px'
          }}>
            {timestamp}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onView && (
          <button
            onClick={onView}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            View
            <ChevronRight size={14} />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              padding: '4px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default ITAlertCard;
