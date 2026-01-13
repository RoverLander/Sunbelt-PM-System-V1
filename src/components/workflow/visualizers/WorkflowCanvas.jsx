// ============================================================================
// WorkflowCanvas.jsx - React Flow Workflow Visualization
// ============================================================================
// Main canvas component for visualizing project workflow as a subway map.
//
// FEATURES:
// - React Flow canvas with custom nodes and edges
// - Phase zones as vertical columns/bands
// - Draggable stations within zones
// - Zoom and pan controls
// - Station click to open detail modal
// - Overall progress indicator
//
// DESIGN (per workflow.md):
// - Subway/Metro map aesthetic
// - Phases as canvas zones (columns)
// - Stations as pill-shaped nodes
// - Curved connectors with animations
//
// Created: January 13, 2026
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import StationNode from '../components/StationNode';
import PulsingEdge from '../components/PulsingEdge';
import { useWorkflowGraph } from '../hooks/useWorkflowGraph';
import {
  RefreshCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Loader,
  AlertCircle
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

// Phase zone configuration
const PHASE_ZONES = [
  { id: 1, name: 'Initiation', color: '#3b82f6', x: 0, width: 250 },
  { id: 2, name: 'Dealer Sign-Offs', color: '#f59e0b', x: 250, width: 300 },
  { id: 3, name: 'Internal Approvals', color: '#8b5cf6', x: 550, width: 350 },
  { id: 4, name: 'Delivery', color: '#22c55e', x: 900, width: 250 }
];

// Custom node types
const nodeTypes = {
  stationNode: StationNode
};

// Custom edge types
const edgeTypes = {
  pulsingEdge: PulsingEdge
};

// ============================================================================
// PHASE ZONE BACKGROUND COMPONENT
// ============================================================================
function PhaseZones({ zones }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: -1
    }}>
      {zones.map(zone => (
        <div
          key={zone.id}
          style={{
            position: 'absolute',
            top: 0,
            left: zone.x,
            width: zone.width,
            height: '100%',
            background: `${zone.color}08`,
            borderRight: `1px dashed ${zone.color}30`
          }}
        >
          {/* Phase header */}
          <div style={{
            position: 'sticky',
            top: 0,
            padding: '12px 16px',
            background: `${zone.color}15`,
            borderBottom: `2px solid ${zone.color}`,
            backdropFilter: 'blur(8px)',
            zIndex: 10
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: zone.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700'
              }}>
                {zone.id}
              </span>
              <span style={{
                fontWeight: '600',
                fontSize: '0.875rem',
                color: 'var(--text-primary)'
              }}>
                {zone.name}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// PROGRESS INDICATOR COMPONENT
// ============================================================================
function ProgressIndicator({ nodes, stationStatuses }) {
  const progress = useMemo(() => {
    if (!nodes || nodes.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completed = nodes.filter(n => {
      const status = n.data?.status;
      return status === 'completed' || status === 'skipped';
    }).length;

    return {
      completed,
      total: nodes.length,
      percentage: Math.round((completed / nodes.length) * 100)
    };
  }, [nodes]);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      padding: '12px 16px',
      border: '1px solid var(--border-color)',
      minWidth: '200px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          fontWeight: '600'
        }}>
          Workflow Progress
        </span>
        <span style={{
          fontSize: '1rem',
          fontWeight: '700',
          color: 'var(--sunbelt-orange)'
        }}>
          {progress.percentage}%
        </span>
      </div>
      <div style={{
        height: '6px',
        background: 'var(--bg-tertiary)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${progress.percentage}%`,
          background: 'linear-gradient(90deg, var(--sunbelt-orange), var(--success))',
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <div style={{
        fontSize: '0.7rem',
        color: 'var(--text-tertiary)',
        marginTop: '4px'
      }}>
        {progress.completed} of {progress.total} stations complete
      </div>
    </div>
  );
}

// ============================================================================
// MAIN WORKFLOW CANVAS COMPONENT
// ============================================================================
function WorkflowCanvas({
  projectId,
  onStationClick,
  height = '600px',
  showMiniMap = true,
  showControls = true
}) {
  // Fetch workflow data
  const {
    nodes: initialNodes,
    edges: initialEdges,
    stationStatuses,
    loading,
    error,
    refetch
  } = useWorkflowGraph(projectId, { enableRealtime: true });

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update nodes/edges when data changes
  React.useEffect(() => {
    if (initialNodes && initialNodes.length > 0) {
      // Add click handler to node data
      const nodesWithHandlers = initialNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onClick: (data) => handleNodeClick(data)
        }
      }));
      setNodes(nodesWithHandlers);
    }
  }, [initialNodes]);

  React.useEffect(() => {
    if (initialEdges) {
      setEdges(initialEdges);
    }
  }, [initialEdges]);

  // Handle node click
  const handleNodeClick = useCallback((nodeData) => {
    if (onStationClick) {
      onStationClick({
        station_key: nodeData.stationKey,
        name: nodeData.name,
        description: nodeData.description,
        phase: nodeData.phase
      }, nodeData.status, nodeData.dueDate, nodeData.taskCount);
    }
  }, [onStationClick]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <Loader size={32} style={{ color: 'var(--sunbelt-orange)', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Loading workflow...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <AlertCircle size={32} style={{ color: 'var(--danger)' }} />
        <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Error loading workflow
        </p>
        <button
          onClick={refetch}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: 'var(--sunbelt-orange)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (!nodes || nodes.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <AlertCircle size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          No workflow stations configured
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '4px' }}>
          Run the database migration to set up workflow tracking
        </p>
      </div>
    );
  }

  const containerStyle = isFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    background: 'var(--bg-primary)'
  } : {
    height,
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden'
  };

  return (
    <div style={containerStyle}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'pulsingEdge'
        }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Background */}
        <Background
          variant="dots"
          gap={20}
          size={1}
          color="var(--border-color)"
        />

        {/* Controls */}
        {showControls && (
          <Controls
            position="bottom-right"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}
          />
        )}

        {/* Mini Map */}
        {showMiniMap && (
          <MiniMap
            position="bottom-left"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}
            nodeColor={(node) => {
              const status = node.data?.status;
              if (status === 'completed') return '#22c55e';
              if (status === 'in_progress') return '#f97316';
              if (status === 'blocked') return '#ef4444';
              return '#64748b';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        )}

        {/* Top-right panel with progress and controls */}
        <Panel position="top-right">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <ProgressIndicator nodes={nodes} stationStatuses={stationStatuses} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={refetch}
                title="Refresh"
                style={{
                  padding: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <RefreshCw size={16} style={{ color: 'var(--text-secondary)' }} />
              </button>

              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                style={{
                  padding: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Maximize2 size={16} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>
        </Panel>

        {/* Top-left panel with phase legend */}
        <Panel position="top-left">
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '10px 12px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            gap: '12px'
          }}>
            {PHASE_ZONES.map(zone => (
              <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: zone.color
                }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {zone.name}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>

      {/* Fullscreen close button */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            padding: '12px 20px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
            zIndex: 10000
          }}
        >
          Exit Fullscreen
        </button>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default WorkflowCanvas;
