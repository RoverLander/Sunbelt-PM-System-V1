// ============================================================================
// WorkflowTracker.jsx - Visual Workflow Diagram (Subway Style)
// ============================================================================
// Visual representation of project workflow progress showing:
// - 4 main phases with animated connections
// - Station nodes with status indicators
// - Sub-stations for detailed tracking
// - Interactive nodes that open detail modals
// - Color-coded by status and deadline proximity
//
// DESIGN:
// - Subway/train map aesthetic
// - Horizontal phase layout with vertical sub-stations
// - Animated "train" indicator for current progress
// - Pulsing nodes for items awaiting response
//
// Created: January 9, 2026
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  SkipForward,
  Loader,
  Flag,
  FileText,
  Palette,
  Package,
  Cog,
  Building,
  MapPin,
  Truck
} from 'lucide-react';
import {
  getStationColor,
  getStationStatusLabel,
  calculateStationStatus,
  getStationDeadline,
  getDaysUntilDeadline,
  getUrgencyLevel,
  formatDateShort
} from '../../utils/workflowUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

const PHASE_COLORS = {
  1: '#3b82f6', // Blue - Initiation
  2: '#f59e0b', // Amber - Dealer Sign-Offs
  3: '#8b5cf6', // Purple - Internal Approvals
  4: '#22c55e'  // Green - Delivery
};

const STATION_ICONS = {
  'po_received': Flag,
  'drawings': FileText,
  'long_lead': Package,
  'cutsheets': FileText,
  'colors': Palette,
  'procurement': Package,
  'engineering': Cog,
  'third_party': Building,
  'state_approval': MapPin,
  'production': Cog,
  'transport': Truck
};

// ============================================================================
// WORKFLOW NODE COMPONENT
// ============================================================================
function WorkflowNode({
  station,
  status,
  deadline,
  linkedTaskCount = 0,
  isExpanded,
  hasChildren,
  onToggle,
  onClick,
  isParallel,
  level = 0
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const daysUntil = getDaysUntilDeadline(deadline);
  const urgency = getUrgencyLevel(daysUntil);
  const color = getStationColor(status, deadline);
  const Icon = STATION_ICONS[station.station_key] || Circle;

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
      case 'in_progress':
        return <Loader size={16} style={{ color, animation: 'spin 2s linear infinite' }} />;
      case 'awaiting_response':
        return <Clock size={16} style={{ color, animation: 'pulse 2s ease-in-out infinite' }} />;
      case 'skipped':
        return <SkipForward size={16} style={{ color: 'var(--text-tertiary)' }} />;
      default:
        return <Circle size={16} style={{ color: 'var(--text-tertiary)' }} />;
    }
  };

  const getTooltipContent = () => {
    const statusLabels = {
      'completed': 'Completed',
      'in_progress': 'In Progress',
      'awaiting_response': 'Awaiting Response',
      'skipped': 'Skipped',
      'not_started': 'Not Started'
    };

    let deadlineText = '';
    if (deadline && status !== 'completed' && status !== 'skipped') {
      if (daysUntil < 0) deadlineText = `⚠️ ${Math.abs(daysUntil)} days overdue`;
      else if (daysUntil === 0) deadlineText = '⚠️ Due today';
      else deadlineText = `${daysUntil} days remaining`;
    }

    return {
      status: statusLabels[status] || 'Not Started',
      taskCount: linkedTaskCount,
      deadline: deadlineText,
      action: status === 'not_started' || linkedTaskCount === 0
        ? 'Click to create a task'
        : 'Click to view details'
    };
  };

  const tooltip = getTooltipContent();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        paddingLeft: level > 0 ? `${level * 24}px` : 0,
        marginBottom: '8px',
        position: 'relative'
      }}
    >
      {/* Status indicator */}
      <div
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: status === 'completed' ? 'rgba(34, 197, 94, 0.2)' :
                     status === 'skipped' ? 'var(--bg-tertiary)' :
                     status === 'not_started' ? 'var(--bg-tertiary)' :
                     `${color}20`,
          border: `2px solid ${status === 'not_started' ? 'var(--border-color)' : color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          position: 'relative',
          opacity: status === 'not_started' ? 0.6 : 1
        }}
      >
        {getStatusIcon()}

        {/* Urgency dot */}
        {urgency === 'overdue' && status !== 'completed' && status !== 'skipped' && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'var(--danger)',
            border: '2px solid var(--bg-secondary)'
          }} />
        )}

        {/* Task count badge */}
        {linkedTaskCount > 0 && status !== 'completed' && (
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            minWidth: '16px',
            height: '16px',
            borderRadius: '8px',
            background: 'var(--sunbelt-orange)',
            color: 'white',
            fontSize: '0.625rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid var(--bg-secondary)'
          }}>
            {linkedTaskCount}
          </div>
        )}

        {/* Tooltip */}
        {showTooltip && (
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: 'calc(100% + 8px)',
            transform: 'translateX(-50%)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            minWidth: '200px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            pointerEvents: 'none'
          }}>
            <div style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {station.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Status:</span>
                <span style={{ color, fontWeight: '600' }}>{tooltip.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Tasks:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{tooltip.taskCount}</span>
              </div>
              {tooltip.deadline && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Deadline:</span>
                  <span style={{ color: urgency === 'overdue' ? 'var(--danger)' : 'var(--text-primary)', fontWeight: '600' }}>
                    {tooltip.deadline}
                  </span>
                </div>
              )}
            </div>
            <div style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-color)',
              color: 'var(--sunbelt-orange)',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {tooltip.action}
            </div>
            {/* Arrow */}
            <div style={{
              position: 'absolute',
              left: '50%',
              bottom: '-6px',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '10px',
              height: '10px',
              background: 'var(--bg-primary)',
              borderRight: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)'
            }} />
          </div>
        )}
      </div>

      {/* Station info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: hasChildren ? 'pointer' : 'default'
          }}
          onClick={hasChildren ? onToggle : onClick}
        >
          {hasChildren && (
            isExpanded ?
              <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} /> :
              <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
          )}

          <Icon size={14} style={{ color, flexShrink: 0 }} />

          <span
            style={{
              fontWeight: '600',
              fontSize: '0.875rem',
              color: status === 'skipped' ? 'var(--text-tertiary)' : 'var(--text-primary)',
              textDecoration: status === 'skipped' ? 'line-through' : 'none'
            }}
          >
            {station.name}
          </span>

          {isParallel && (
            <span style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--bg-tertiary)',
              fontSize: '0.625rem',
              color: 'var(--text-tertiary)'
            }}>
              Parallel
            </span>
          )}
        </div>

        {/* Status and deadline */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '4px',
          marginLeft: hasChildren ? '22px' : 0,
          fontSize: '0.75rem'
        }}>
          <span style={{ color }}>
            {getStationStatusLabel(status)}
          </span>

          {deadline && status !== 'completed' && status !== 'skipped' && (
            <>
              <span style={{ color: 'var(--text-tertiary)' }}>•</span>
              <span style={{
                color: urgency === 'overdue' ? 'var(--danger)' :
                       urgency === 'critical' ? 'var(--warning)' :
                       'var(--text-secondary)'
              }}>
                {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` :
                 daysUntil === 0 ? 'Due today' :
                 `${daysUntil}d left`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PHASE HEADER COMPONENT
// ============================================================================
function PhaseHeader({ phase, phaseName, stations, projectStatuses }) {
  const phaseColor = PHASE_COLORS[phase];

  // Calculate phase progress
  const phaseStations = stations.filter(s => s.phase === phase && !s.parent_station_key);
  const completedCount = phaseStations.filter(s => {
    const status = projectStatuses?.[s.station_key] || 'not_started';
    return status === 'completed' || status === 'skipped';
  }).length;

  const progressPercent = phaseStations.length > 0 ?
    Math.round((completedCount / phaseStations.length) * 100) : 0;

  return (
    <div style={{
      padding: '12px 16px',
      background: `${phaseColor}15`,
      borderLeft: `3px solid ${phaseColor}`,
      borderRadius: '0 var(--radius-md) var(--radius-md) 0',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: phaseColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '700'
          }}>
            {phase}
          </span>
          <div>
            <div style={{
              fontWeight: '700',
              fontSize: '1rem',
              color: 'var(--text-primary)'
            }}>
              {phaseName}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              {completedCount} of {phaseStations.length} complete
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div style={{
          width: '60px',
          height: '60px',
          position: 'relative'
        }}>
          <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={phaseColor}
              strokeWidth="3"
              strokeDasharray={`${progressPercent}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: phaseColor
          }}>
            {progressPercent}%
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN WORKFLOW TRACKER COMPONENT
// ============================================================================
function WorkflowTracker({
  projectId,
  stations = [],
  tasks = [],
  projectStatuses = {},
  onStationClick
}) {
  // Track expanded stations
  const [expandedStations, setExpandedStations] = useState(new Set(['drawings', 'long_lead', 'cutsheets', 'colors']));

  // Toggle station expansion
  const toggleStation = useCallback((stationKey) => {
    setExpandedStations(prev => {
      const next = new Set(prev);
      if (next.has(stationKey)) {
        next.delete(stationKey);
      } else {
        next.add(stationKey);
      }
      return next;
    });
  }, []);

  // Calculate station statuses from tasks
  const calculatedStatuses = useMemo(() => {
    const statuses = { ...projectStatuses };

    stations.forEach(station => {
      // Find tasks linked to this station
      const stationTasks = tasks.filter(t => t.workflow_station_key === station.station_key);

      if (stationTasks.length > 0) {
        statuses[station.station_key] = calculateStationStatus(stationTasks);
      }
    });

    return statuses;
  }, [stations, tasks, projectStatuses]);

  // Calculate station deadlines from tasks
  const stationDeadlines = useMemo(() => {
    const deadlines = {};

    stations.forEach(station => {
      const stationTasks = tasks.filter(t => t.workflow_station_key === station.station_key);
      const deadline = getStationDeadline(stationTasks);
      if (deadline) {
        deadlines[station.station_key] = deadline;
      }
    });

    return deadlines;
  }, [stations, tasks]);

  // Group stations by phase
  const stationsByPhase = useMemo(() => {
    const grouped = {};

    stations.forEach(station => {
      if (!grouped[station.phase]) {
        grouped[station.phase] = {
          phaseName: station.phase_name,
          stations: []
        };
      }
      grouped[station.phase].stations.push(station);
    });

    // Sort stations within each phase
    Object.values(grouped).forEach(phase => {
      phase.stations.sort((a, b) => a.display_order - b.display_order);
    });

    return grouped;
  }, [stations]);

  // Get children for a station
  const getChildren = useCallback((stationKey) => {
    return stations.filter(s => s.parent_station_key === stationKey);
  }, [stations]);

  // Calculate task counts per station
  const stationTaskCounts = useMemo(() => {
    const counts = {};
    stations.forEach(station => {
      counts[station.station_key] = tasks.filter(t => t.workflow_station_key === station.station_key).length;
    });
    return counts;
  }, [stations, tasks]);

  // Handle station click
  const handleStationClick = useCallback((station) => {
    if (onStationClick) {
      const taskCount = stationTaskCounts[station.station_key] || 0;
      onStationClick(station, calculatedStatuses[station.station_key], stationDeadlines[station.station_key], taskCount);
    }
  }, [onStationClick, calculatedStatuses, stationDeadlines, stationTaskCounts]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const leafStations = stations.filter(s =>
      !stations.some(other => other.parent_station_key === s.station_key)
    );

    const completed = leafStations.filter(s => {
      const status = calculatedStatuses[s.station_key];
      return status === 'completed' || status === 'skipped';
    }).length;

    return {
      completed,
      total: leafStations.length,
      percentage: leafStations.length > 0 ? Math.round((completed / leafStations.length) * 100) : 0
    };
  }, [stations, calculatedStatuses]);

  // Render a station and its children recursively
  const renderStation = (station, level = 0) => {
    const children = getChildren(station.station_key);
    const hasChildren = children.length > 0;
    const isExpanded = expandedStations.has(station.station_key);
    const status = calculatedStatuses[station.station_key] || 'not_started';
    const deadline = stationDeadlines[station.station_key];
    const taskCount = stationTaskCounts[station.station_key] || 0;

    return (
      <div key={station.station_key}>
        <WorkflowNode
          station={station}
          status={status}
          deadline={deadline}
          linkedTaskCount={taskCount}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggle={() => toggleStation(station.station_key)}
          onClick={() => handleStationClick(station)}
          isParallel={station.is_parallel}
          level={level}
        />

        {hasChildren && isExpanded && (
          <div style={{ marginLeft: '18px', borderLeft: '2px solid var(--border-color)', paddingLeft: '16px' }}>
            {children.map(child => renderStation(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (stations.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'var(--text-tertiary)'
      }}>
        <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>No workflow stations configured.</p>
        <p style={{ fontSize: '0.875rem' }}>Run the database migration to set up workflow tracking.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* ================================================================== */}
      {/* OVERALL PROGRESS HEADER                                           */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        padding: '16px 20px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Workflow Progress
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: '4px 0 0 0'
          }}>
            {overallProgress.completed} of {overallProgress.total} stations complete
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ width: '200px' }}>
          <div style={{
            height: '8px',
            background: 'var(--bg-secondary)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${overallProgress.percentage}%`,
              background: 'linear-gradient(90deg, var(--sunbelt-orange), var(--success))',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{
            textAlign: 'right',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--sunbelt-orange)',
            marginTop: '4px'
          }}>
            {overallProgress.percentage}% Complete
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* PHASES                                                            */}
      {/* ================================================================== */}
      {Object.entries(stationsByPhase)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([phase, { phaseName, stations: phaseStations }]) => (
          <div key={phase} style={{ marginBottom: '24px' }}>
            <PhaseHeader
              phase={parseInt(phase)}
              phaseName={phaseName}
              stations={stations}
              projectStatuses={calculatedStatuses}
            />

            <div style={{ paddingLeft: '8px' }}>
              {phaseStations
                .filter(s => !s.parent_station_key)
                .map(station => renderStation(station))}
            </div>
          </div>
        ))}

      {/* ================================================================== */}
      {/* CSS ANIMATIONS                                                    */}
      {/* ================================================================== */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default WorkflowTracker;
