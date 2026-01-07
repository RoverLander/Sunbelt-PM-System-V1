// ============================================================================
// FloorPlanMarker Component
// ============================================================================
// Individual marker pin on a floor plan. Shows hover card with item details,
// supports drag repositioning (PM only), and click to view full details.
// ============================================================================

import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  ClipboardList,
  Calendar,
  User,
  ChevronRight,
  Trash2,
  GripVertical,
  AlertCircle
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_COLORS = {
  // RFI Statuses
  'Open': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', markerBg: '#3b82f6' },
  'Pending': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', markerBg: '#f59e0b' },
  'Answered': { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', markerBg: '#22c55e' },
  'Closed': { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b', markerBg: '#64748b' },
  
  // Submittal Statuses
  'Submitted': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', markerBg: '#3b82f6' },
  'Under Review': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', markerBg: '#f59e0b' },
  'Approved': { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', markerBg: '#22c55e' },
  'Approved as Noted': { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', markerBg: '#22c55e' },
  'Revise & Resubmit': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', markerBg: '#ef4444' },
  'Rejected': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', markerBg: '#ef4444' }
};

const DEFAULT_STATUS_COLOR = { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b', markerBg: '#64748b' };

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function FloorPlanMarker({
  marker,
  isPM,
  isHovered,
  isDragging,
  canvasDimensions,
  onHover,
  onLeave,
  onClick,
  onDragStart,
  onDragEnd,
  onDelete
}) {
  const markerRef = useRef(null);
  const [localDragging, setLocalDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState(null);

  // ==========================================================================
  // GET ITEM DATA
  // ==========================================================================
  const item = marker.item;
  const isRFI = marker.item_type === 'rfi';
  const statusColors = STATUS_COLORS[item?.status] || DEFAULT_STATUS_COLOR;

  // Get display number and title
  const displayNumber = isRFI ? item?.rfi_number : item?.submittal_number;
  const displayTitle = isRFI ? item?.subject : item?.title;

  // Check if overdue
  const isOverdue = item?.due_date && new Date(item.due_date) < new Date() && 
    !['Closed', 'Approved', 'Approved as Noted', 'Answered'].includes(item?.status);

  // ==========================================================================
  // DRAG HANDLERS
  // ==========================================================================
  const handleMouseDown = (e) => {
    if (!isPM) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = markerRef.current.parentElement.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - markerRef.current.offsetLeft,
      y: e.clientY - markerRef.current.offsetTop
    });
    setLocalDragging(true);
    onDragStart?.();

    // Add global listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!localDragging) return;

    const parent = markerRef.current.parentElement;
    const rect = parent.getBoundingClientRect();
    
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp to bounds
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setDragPosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e) => {
    if (!localDragging) return;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (dragPosition) {
      onDragEnd?.(dragPosition.x, dragPosition.y);
    }

    setLocalDragging(false);
    setDragPosition(null);
  };

  // ==========================================================================
  // FORMAT DATE
  // ==========================================================================
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // ==========================================================================
  // POSITION
  // ==========================================================================
  const xPos = dragPosition?.x ?? marker.x_percent;
  const yPos = dragPosition?.y ?? marker.y_percent;

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div
      ref={markerRef}
      style={{
        position: 'absolute',
        left: `${xPos}%`,
        top: `${yPos}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isHovered || localDragging ? 100 : 10,
        cursor: isPM ? 'grab' : 'pointer'
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* ================================================================== */}
      {/* MARKER PIN                                                        */}
      {/* ================================================================== */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onMouseDown={handleMouseDown}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: isOverdue ? '#ef4444' : statusColors.markerBg,
          border: '3px solid white',
          boxShadow: isHovered || localDragging 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : '0 2px 6px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: localDragging ? 'none' : 'all 0.15s',
          transform: isHovered && !localDragging ? 'scale(1.15)' : 'scale(1)'
        }}
      >
        {isRFI ? (
          <MessageSquare size={14} color="white" />
        ) : (
          <ClipboardList size={14} color="white" />
        )}
      </div>

      {/* ================================================================== */}
      {/* HOVER CARD                                                        */}
      {/* ================================================================== */}
      {isHovered && !localDragging && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '100%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            minWidth: '240px',
            maxWidth: '300px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            zIndex: 200
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{
                padding: '2px 6px',
                background: isRFI ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 107, 53, 0.15)',
                color: isRFI ? '#3b82f6' : 'var(--sunbelt-orange)',
                borderRadius: '4px',
                fontSize: '0.6875rem',
                fontWeight: '700'
              }}>
                {isRFI ? 'RFI' : 'SUB'}
              </span>
              <span style={{
                fontWeight: '600',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)'
              }}>
                {displayNumber}
              </span>
            </div>

            {/* Status Badge */}
            <span style={{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.6875rem',
              fontWeight: '600',
              background: isOverdue ? 'rgba(239, 68, 68, 0.15)' : statusColors.bg,
              color: isOverdue ? '#ef4444' : statusColors.color
            }}>
              {isOverdue && <AlertCircle size={10} style={{ marginRight: '2px', verticalAlign: 'middle' }} />}
              {item?.status}
            </span>
          </div>

          {/* Content */}
          <div style={{ padding: 'var(--space-md)' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-sm) 0',
              lineHeight: 1.3
            }}>
              {displayTitle}
            </h4>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              {/* Sent To */}
              {item?.sent_to && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={12} />
                  <span>{item.sent_to}</span>
                </div>
              )}

              {/* Due Date */}
              {item?.due_date && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  color: isOverdue ? '#ef4444' : 'var(--text-secondary)'
                }}>
                  <Calendar size={12} />
                  <span>Due: {formatDate(item.due_date)}</span>
                  {isOverdue && <span style={{ fontWeight: '600' }}>(Overdue)</span>}
                </div>
              )}

              {/* Submittal Type */}
              {!isRFI && item?.submittal_type && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClipboardList size={12} />
                  <span>{item.submittal_type}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'var(--sunbelt-orange)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              View Details
              <ChevronRight size={14} />
            </button>

            {isPM && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                title="Remove marker"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Drag hint (PM only) */}
          {isPM && (
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '2px 8px',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '4px',
              fontSize: '0.625rem',
              color: 'white',
              whiteSpace: 'nowrap'
            }}>
              Drag to reposition
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FloorPlanMarker;