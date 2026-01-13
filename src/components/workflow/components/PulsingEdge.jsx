// ============================================================================
// PulsingEdge.jsx - Custom React Flow Edge with Animations
// ============================================================================
// Curved bezier paths connecting stations with animated pulses.
//
// DESIGN (per workflow.md):
// - Curved connectors attach to node ends (left/right)
// - In Progress: Slow directional pulse (dots moving along path)
// - Complete: Solid green glow
// - Blocked: Static red
// - Not started: Gray dashed
//
// Created: January 13, 2026
// ============================================================================

import React from 'react';
import { BaseEdge, getBezierPath } from '@xyflow/react';

// ============================================================================
// CONSTANTS
// ============================================================================
const EDGE_COLORS = {
  not_started: '#64748b',
  in_progress: '#f97316',
  awaiting_response: '#eab308',
  blocked: '#ef4444',
  completed: '#22c55e',
  skipped: '#94a3b8'
};

// ============================================================================
// ANIMATED DOT COMPONENT (for in-progress edges)
// ============================================================================
function AnimatedDot({ path, color, duration = 2, delay = 0 }) {
  return (
    <circle r="4" fill={color}>
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={path}
      />
    </circle>
  );
}

// ============================================================================
// MAIN PULSING EDGE COMPONENT
// ============================================================================
function PulsingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data = {},
  style = {},
  markerEnd
}) {
  const { status = 'not_started' } = data;
  const color = EDGE_COLORS[status] || EDGE_COLORS.not_started;

  // Get bezier path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25
  });

  // Determine edge style based on status
  const getEdgeStyle = () => {
    const baseStyle = {
      stroke: color,
      strokeWidth: 2,
      fill: 'none',
      ...style
    };

    switch (status) {
      case 'completed':
        return {
          ...baseStyle,
          strokeWidth: 3,
          filter: `drop-shadow(0 0 4px ${color})`
        };
      case 'in_progress':
      case 'awaiting_response':
        return {
          ...baseStyle,
          strokeWidth: 2,
          strokeDasharray: '8 4',
          animation: 'dashMove 1s linear infinite'
        };
      case 'blocked':
        return {
          ...baseStyle,
          strokeWidth: 2,
          strokeDasharray: '4 4'
        };
      case 'not_started':
      case 'skipped':
      default:
        return {
          ...baseStyle,
          strokeWidth: 1.5,
          strokeDasharray: '6 6',
          opacity: 0.5
        };
    }
  };

  const edgeStyle = getEdgeStyle();

  return (
    <>
      {/* Main edge path */}
      <path
        id={id}
        d={edgePath}
        style={edgeStyle}
        className={`workflow-edge workflow-edge-${status}`}
      />

      {/* Animated dots for in-progress edges */}
      {(status === 'in_progress' || status === 'awaiting_response') && (
        <g>
          <AnimatedDot path={edgePath} color={color} duration={2} delay={0} />
          <AnimatedDot path={edgePath} color={color} duration={2} delay={0.7} />
          <AnimatedDot path={edgePath} color={color} duration={2} delay={1.4} />
        </g>
      )}

      {/* Glow effect for completed edges */}
      {status === 'completed' && (
        <path
          d={edgePath}
          style={{
            stroke: color,
            strokeWidth: 8,
            fill: 'none',
            opacity: 0.15,
            filter: 'blur(4px)'
          }}
        />
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes dashMove {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }

        .workflow-edge {
          transition: stroke 0.3s ease, stroke-width 0.3s ease, opacity 0.3s ease;
        }

        .workflow-edge-completed {
          stroke-linecap: round;
        }

        .workflow-edge-in_progress,
        .workflow-edge-awaiting_response {
          stroke-linecap: round;
        }
      `}</style>
    </>
  );
}

export default PulsingEdge;
