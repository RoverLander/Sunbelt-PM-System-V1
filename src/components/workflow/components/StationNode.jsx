// ============================================================================
// StationNode.jsx - Custom React Flow Node for Workflow Stations
// ============================================================================
// Pill-shaped node with status animations, deadline indicators, and tooltips.
//
// DESIGN (per workflow.md):
// - Rounded pill shape
// - Internal status dots/checkpoints
// - Color-coded by status: gray (not started), orange pulse (in progress),
//   red pulse (blocked), green glow (complete)
// - Shows station name, due date, task count
//
// Created: January 13, 2026
// ============================================================================

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Loader,
  SkipForward
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_COLORS = {
  not_started: { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', text: 'var(--text-tertiary)' },
  in_progress: { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#f97316' },
  awaiting_response: { bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308', text: '#eab308' },
  blocked: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' },
  completed: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#22c55e' },
  skipped: { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', text: 'var(--text-tertiary)' }
};

const COURT_COLORS = {
  factory: '#ec4899',
  field: '#3b82f6',
  dealer: '#8b5cf6',
  pm: '#22c55e'
};

// ============================================================================
// STATUS ICON COMPONENT
// ============================================================================
function StatusIcon({ status, size = 14 }) {
  const color = STATUS_COLORS[status]?.text || 'var(--text-tertiary)';

  switch (status) {
    case 'completed':
      return <CheckCircle2 size={size} style={{ color }} />;
    case 'in_progress':
      return (
        <Loader
          size={size}
          style={{ color, animation: 'spin 2s linear infinite' }}
        />
      );
    case 'awaiting_response':
      return (
        <Clock
          size={size}
          style={{ color, animation: 'pulse 1.5s ease-in-out infinite' }}
        />
      );
    case 'blocked':
      return (
        <AlertCircle
          size={size}
          style={{ color, animation: 'pulse 0.8s ease-in-out infinite' }}
        />
      );
    case 'skipped':
      return <SkipForward size={size} style={{ color }} />;
    default:
      return <Circle size={size} style={{ color }} />;
  }
}

// ============================================================================
// MAIN STATION NODE COMPONENT
// ============================================================================
function StationNode({ data, selected }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const {
    name = 'Station',
    status = 'not_started',
    phase = 1,
    court = 'factory',
    dueDate,
    taskCount = 0,
    rfiCount = 0,
    progress = 0,
    isOverdue = false,
    daysUntil = null,
    onClick
  } = data;

  const colors = STATUS_COLORS[status] || STATUS_COLORS.not_started;
  const courtColor = COURT_COLORS[court] || COURT_COLORS.factory;

  // Calculate urgency for deadline
  const getUrgencyColor = () => {
    if (daysUntil === null || status === 'completed' || status === 'skipped') return null;
    if (daysUntil < 0) return '#ef4444'; // Overdue
    if (daysUntil <= 2) return '#f97316'; // Critical
    if (daysUntil <= 7) return '#eab308'; // Warning
    return null;
  };

  const urgencyColor = getUrgencyColor();

  // Animation class based on status
  const getAnimationStyle = () => {
    if (status === 'in_progress') {
      return {
        animation: 'borderPulse 2s ease-in-out infinite',
        boxShadow: `0 0 0 0 ${colors.border}`
      };
    }
    if (status === 'blocked') {
      return {
        animation: 'borderPulseRed 0.8s ease-in-out infinite',
        boxShadow: `0 0 0 0 #ef4444`
      };
    }
    if (status === 'completed') {
      return {
        boxShadow: `0 0 12px ${colors.border}40`
      };
    }
    return {};
  };

  return (
    <>
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 8,
          height: 8,
          background: colors.border,
          border: 'none'
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 8,
          height: 8,
          background: colors.border,
          border: 'none'
        }}
      />

      {/* Main node container */}
      <div
        onClick={() => onClick?.(data)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          background: colors.bg,
          border: `2px solid ${selected ? 'var(--sunbelt-orange)' : colors.border}`,
          borderRadius: '24px',
          padding: '10px 16px',
          minWidth: '140px',
          maxWidth: '200px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          opacity: status === 'skipped' ? 0.6 : 1,
          ...getAnimationStyle()
        }}
      >
        {/* Top row: Icon + Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px'
        }}>
          <StatusIcon status={status} size={16} />
          <span style={{
            fontWeight: '600',
            fontSize: '0.8rem',
            color: status === 'skipped' ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: status === 'skipped' ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {name}
          </span>
        </div>

        {/* Progress bar (if in progress) */}
        {status === 'in_progress' && progress > 0 && (
          <div style={{
            height: '3px',
            background: 'var(--bg-secondary)',
            borderRadius: '2px',
            marginBottom: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: colors.border,
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}

        {/* Bottom row: Counts + Court badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          {/* Task/RFI counts */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.65rem',
            color: 'var(--text-tertiary)'
          }}>
            {taskCount > 0 && (
              <span style={{
                background: 'var(--bg-secondary)',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {taskCount} task{taskCount > 1 ? 's' : ''}
              </span>
            )}
            {rfiCount > 0 && (
              <span style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {rfiCount} RFI{rfiCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Court badge */}
          <span style={{
            fontSize: '0.55rem',
            fontWeight: '600',
            color: courtColor,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {court}
          </span>
        </div>

        {/* Urgency indicator */}
        {urgencyColor && status !== 'completed' && status !== 'skipped' && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: urgencyColor,
            border: '2px solid var(--bg-primary)'
          }} />
        )}

        {/* Tooltip */}
        {showTooltip && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 14px',
            minWidth: '180px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 100,
            pointerEvents: 'none'
          }}>
            <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
              {name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.7rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Status:</span>
                <span style={{ color: colors.text, fontWeight: '500' }}>
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              {daysUntil !== null && status !== 'completed' && status !== 'skipped' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Deadline:</span>
                  <span style={{ color: urgencyColor || 'var(--text-primary)', fontWeight: '500' }}>
                    {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` :
                     daysUntil === 0 ? 'Due today' :
                     `${daysUntil}d left`}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Tasks:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{taskCount}</span>
              </div>
            </div>
            {/* Tooltip arrow */}
            <div style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '8px',
              height: '8px',
              background: 'var(--bg-primary)',
              borderRight: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)'
            }} />
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes borderPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(249, 115, 22, 0); }
        }
        @keyframes borderPulseRed {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </>
  );
}

export default memo(StationNode);
