// ============================================================================
// GanttTimeline Component
// ============================================================================
// Interactive Gantt chart showing project timelines with key dates.
// Reusable for both Director Dashboard and PM project views.
//
// FEATURES:
// - Horizontal scrolling timeline
// - Project bars showing start → delivery dates
// - Milestone markers
// - Today indicator
// - Zoom controls (month/quarter/year view)
// - Color-coded by project health status
// - Click to open project details
//
// USAGE:
// <GanttTimeline 
//   projects={projectsArray}
//   onProjectClick={(project) => handleClick(project)}
//   showMilestones={true}
// />
// ============================================================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Target,
  Truck,
  Flag,
  Circle
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================
const ZOOM_LEVELS = {
  month: { label: 'Month', daysVisible: 30, dayWidth: 24 },
  quarter: { label: 'Quarter', daysVisible: 90, dayWidth: 8 },
  halfYear: { label: '6 Months', daysVisible: 180, dayWidth: 4 },
  year: { label: 'Year', daysVisible: 365, dayWidth: 2 }
};

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 60;
const LABEL_WIDTH = 220;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatMonthYear = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const formatMonth = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short' });
};

const formatDay = (date) => {
  return date.getDate();
};

const getDaysBetween = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function GanttTimeline({ 
  projects = [], 
  onProjectClick,
  showMilestones = false,
  milestones = []
}) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [zoomLevel, setZoomLevel] = useState('quarter');
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  // ==========================================================================
  // CALCULATE TIMELINE BOUNDS
  // ==========================================================================
  const timelineBounds = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find earliest and latest dates from projects
    let earliest = new Date(today);
    let latest = new Date(today);

    // Start from 30 days ago
    earliest.setDate(earliest.getDate() - 30);
    // End 180 days from now by default
    latest.setDate(latest.getDate() + 180);

    projects.forEach(project => {
      if (project.start_date) {
        const start = new Date(project.start_date);
        if (start < earliest) earliest = new Date(start);
      }
      if (project.delivery_date) {
        const delivery = new Date(project.delivery_date);
        if (delivery > latest) latest = new Date(delivery);
      }
      if (project.target_online_date) {
        const online = new Date(project.target_online_date);
        if (online > latest) latest = new Date(online);
      }
    });

    // Add some padding
    earliest.setDate(earliest.getDate() - 14);
    latest.setDate(latest.getDate() + 30);

    return { start: earliest, end: latest, today };
  }, [projects]);

  // ==========================================================================
  // CALCULATE DIMENSIONS
  // ==========================================================================
  const dimensions = useMemo(() => {
    const totalDays = getDaysBetween(timelineBounds.start, timelineBounds.end);
    const zoom = ZOOM_LEVELS[zoomLevel];
    const timelineWidth = totalDays * zoom.dayWidth;
    const contentHeight = projects.length * ROW_HEIGHT;

    return {
      totalDays,
      timelineWidth,
      contentHeight,
      dayWidth: zoom.dayWidth
    };
  }, [timelineBounds, zoomLevel, projects.length]);

  // ==========================================================================
  // SCROLL TO TODAY ON MOUNT
  // ==========================================================================
  useEffect(() => {
    if (timelineRef.current) {
      const todayOffset = getDaysBetween(timelineBounds.start, timelineBounds.today);
      const todayPosition = todayOffset * dimensions.dayWidth;
      const containerWidth = timelineRef.current.clientWidth - LABEL_WIDTH;
      const scrollTo = Math.max(0, todayPosition - containerWidth / 3);
      timelineRef.current.scrollLeft = scrollTo;
    }
  }, [timelineBounds, dimensions.dayWidth]);

  // ==========================================================================
  // GENERATE TIMELINE HEADERS
  // ==========================================================================
  const timelineHeaders = useMemo(() => {
    const months = [];
    const days = [];
    
    let currentDate = new Date(timelineBounds.start);
    let currentMonth = null;
    let monthStartX = 0;

    for (let i = 0; i <= dimensions.totalDays; i++) {
      const date = addDays(timelineBounds.start, i);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      // Track months
      if (monthKey !== currentMonth) {
        if (currentMonth !== null) {
          months[months.length - 1].width = (i * dimensions.dayWidth) - monthStartX;
        }
        months.push({
          label: formatMonthYear(date),
          x: i * dimensions.dayWidth,
          width: 0
        });
        monthStartX = i * dimensions.dayWidth;
        currentMonth = monthKey;
      }

      // Add day markers for month view
      if (zoomLevel === 'month') {
        days.push({
          label: formatDay(date),
          x: i * dimensions.dayWidth,
          isWeekend: isWeekend(date),
          isToday: isSameDay(date, timelineBounds.today)
        });
      }
    }

    // Set final month width
    if (months.length > 0) {
      months[months.length - 1].width = dimensions.timelineWidth - months[months.length - 1].x;
    }

    return { months, days };
  }, [timelineBounds, dimensions, zoomLevel]);

  // ==========================================================================
  // CALCULATE TODAY LINE POSITION
  // ==========================================================================
  const todayPosition = useMemo(() => {
    const daysFromStart = getDaysBetween(timelineBounds.start, timelineBounds.today);
    return daysFromStart * dimensions.dayWidth;
  }, [timelineBounds, dimensions.dayWidth]);

  // ==========================================================================
  // RENDER PROJECT BAR
  // ==========================================================================
  const renderProjectBar = (project, index) => {
    const startDate = project.start_date ? new Date(project.start_date) : timelineBounds.today;
    const endDate = project.delivery_date ? new Date(project.delivery_date) : addDays(startDate, 90);
    const onlineDate = project.target_online_date ? new Date(project.target_online_date) : null;

    const startOffset = getDaysBetween(timelineBounds.start, startDate);
    const duration = getDaysBetween(startDate, endDate);

    const barX = startOffset * dimensions.dayWidth;
    const barWidth = Math.max(duration * dimensions.dayWidth, 20);
    const barY = index * ROW_HEIGHT + 8;
    const barHeight = ROW_HEIGHT - 16;

    const isHovered = hoveredProject === project.id;

    // Determine bar color based on health status
    const getBarColor = () => {
      if (project.healthStatus === 'critical') return '#ef4444';
      if (project.healthStatus === 'at-risk') return '#f59e0b';
      if (project.healthStatus === 'inactive') return '#64748b';
      return '#22c55e';
    };

    const barColor = getBarColor();

    // Calculate online date marker position
    let onlineX = null;
    if (onlineDate) {
      const onlineOffset = getDaysBetween(timelineBounds.start, onlineDate);
      onlineX = onlineOffset * dimensions.dayWidth;
    }

    return (
      <g key={project.id}>
        {/* Project Bar */}
        <rect
          x={barX}
          y={barY}
          width={barWidth}
          height={barHeight}
          rx={4}
          fill={barColor}
          opacity={isHovered ? 1 : 0.8}
          style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={() => {
            setHoveredProject(project.id);
            setTooltipData({
              project,
              x: barX + barWidth / 2,
              y: barY
            });
          }}
          onMouseLeave={() => {
            setHoveredProject(null);
            setTooltipData(null);
          }}
          onClick={() => onProjectClick?.(project)}
        />

        {/* Progress indicator (if available) */}
        {project.progress !== undefined && project.progress > 0 && (
          <rect
            x={barX}
            y={barY}
            width={Math.min(barWidth * (project.progress / 100), barWidth)}
            height={barHeight}
            rx={4}
            fill={barColor}
            opacity={1}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Project number label on bar */}
        {barWidth > 60 && (
          <text
            x={barX + 8}
            y={barY + barHeight / 2 + 4}
            fill="white"
            fontSize="11"
            fontWeight="600"
            style={{ pointerEvents: 'none' }}
          >
            {project.project_number}
          </text>
        )}

        {/* Online Date Marker */}
        {onlineX !== null && (
          <g>
            <line
              x1={onlineX}
              y1={barY - 2}
              x2={onlineX}
              y2={barY + barHeight + 2}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="4,2"
            />
            <circle
              cx={onlineX}
              cy={barY - 6}
              r={4}
              fill="#3b82f6"
            />
          </g>
        )}

        {/* Delivery Date Marker */}
        <g>
          <circle
            cx={barX + barWidth}
            cy={barY + barHeight / 2}
            r={isHovered ? 6 : 5}
            fill="white"
            stroke={barColor}
            strokeWidth={2}
          />
        </g>
      </g>
    );
  };

  // ==========================================================================
  // HANDLE ZOOM
  // ==========================================================================
  const handleZoomIn = () => {
    const levels = Object.keys(ZOOM_LEVELS);
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(levels[currentIndex - 1]);
    }
  };

  const handleZoomOut = () => {
    const levels = Object.keys(ZOOM_LEVELS);
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1]);
    }
  };

  // ==========================================================================
  // SCROLL NAVIGATION
  // ==========================================================================
  const scrollTimeline = (direction) => {
    if (timelineRef.current) {
      const scrollAmount = timelineRef.current.clientWidth * 0.5;
      timelineRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  // ==========================================================================
  // RENDER - EMPTY STATE
  // ==========================================================================
  if (projects.length === 0) {
    return (
      <div style={{
        padding: 'var(--space-2xl)',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <Calendar size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
        <p>No projects to display on timeline</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - MAIN
  // ==========================================================================
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* ================================================================== */}
      {/* CONTROLS                                                          */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-md)',
        flexWrap: 'wrap',
        gap: 'var(--space-sm)'
      }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#22c55e' }} />
            <span style={{ color: 'var(--text-secondary)' }}>On Track</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#f59e0b' }} />
            <span style={{ color: 'var(--text-secondary)' }}>At Risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ef4444' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Critical</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Online Date</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid var(--text-secondary)', background: 'white' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Delivery</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button
            onClick={() => scrollTimeline('left')}
            style={{
              padding: '6px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '4px'
          }}>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel === 'month'}
              style={{
                padding: '6px',
                background: 'none',
                border: 'none',
                cursor: zoomLevel === 'month' ? 'not-allowed' : 'pointer',
                opacity: zoomLevel === 'month' ? 0.3 : 1,
                color: 'var(--text-secondary)'
              }}
            >
              <ZoomIn size={16} />
            </button>
            <span style={{
              padding: '0 var(--space-sm)',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              minWidth: '70px',
              textAlign: 'center'
            }}>
              {ZOOM_LEVELS[zoomLevel].label}
            </span>
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel === 'year'}
              style={{
                padding: '6px',
                background: 'none',
                border: 'none',
                cursor: zoomLevel === 'year' ? 'not-allowed' : 'pointer',
                opacity: zoomLevel === 'year' ? 0.3 : 1,
                color: 'var(--text-secondary)'
              }}
            >
              <ZoomOut size={16} />
            </button>
          </div>

          <button
            onClick={() => scrollTimeline('right')}
            style={{
              padding: '6px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* GANTT CHART                                                       */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'var(--bg-primary)'
      }}>
        {/* ===== PROJECT LABELS (FIXED) ===== */}
        <div style={{
          width: LABEL_WIDTH,
          flexShrink: 0,
          borderRight: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)'
        }}>
          {/* Header */}
          <div style={{
            height: HEADER_HEIGHT,
            padding: 'var(--space-md)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-end',
            fontWeight: '600',
            fontSize: '0.8125rem',
            color: 'var(--text-primary)'
          }}>
            Project
          </div>

          {/* Project Labels */}
          {projects.map((project, index) => (
            <div
              key={project.id}
              onClick={() => onProjectClick?.(project)}
              style={{
                height: ROW_HEIGHT,
                padding: '0 var(--space-md)',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                background: hoveredProject === project.id ? 'var(--bg-tertiary)' : 'transparent',
                transition: 'background 0.15s'
              }}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {project.project_number}
                </div>
                <div style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {project.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== TIMELINE (SCROLLABLE) ===== */}
        <div
          ref={timelineRef}
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden'
          }}
        >
          <div style={{
            width: dimensions.timelineWidth,
            minWidth: '100%'
          }}>
            {/* Timeline Header */}
            <div style={{
              height: HEADER_HEIGHT,
              borderBottom: '1px solid var(--border-color)',
              position: 'relative'
            }}>
              {/* Month Headers */}
              <div style={{ height: '30px', position: 'relative', borderBottom: '1px solid var(--border-color)' }}>
                {timelineHeaders.months.map((month, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: month.x,
                      width: month.width,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 'var(--space-sm)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      borderRight: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)'
                    }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>

              {/* Day Headers (Month view only) */}
              {zoomLevel === 'month' && (
                <div style={{ height: '30px', position: 'relative' }}>
                  {timelineHeaders.days.map((day, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        left: day.x,
                        width: dimensions.dayWidth,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: day.isToday ? '700' : '400',
                        color: day.isToday ? 'var(--sunbelt-orange)' : day.isWeekend ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                        background: day.isToday ? 'rgba(255, 107, 53, 0.1)' : day.isWeekend ? 'var(--bg-tertiary)' : 'transparent'
                      }}
                    >
                      {day.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline Grid & Bars */}
            <svg
              width={dimensions.timelineWidth}
              height={dimensions.contentHeight}
              style={{ display: 'block' }}
            >
              {/* Grid Lines */}
              {timelineHeaders.months.map((month, index) => (
                <line
                  key={index}
                  x1={month.x}
                  y1={0}
                  x2={month.x}
                  y2={dimensions.contentHeight}
                  stroke="var(--border-color)"
                  strokeWidth={1}
                />
              ))}

              {/* Row Backgrounds */}
              {projects.map((_, index) => (
                <rect
                  key={index}
                  x={0}
                  y={index * ROW_HEIGHT}
                  width={dimensions.timelineWidth}
                  height={ROW_HEIGHT}
                  fill={index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'}
                />
              ))}

              {/* Row Dividers */}
              {projects.map((_, index) => (
                <line
                  key={index}
                  x1={0}
                  y1={(index + 1) * ROW_HEIGHT}
                  x2={dimensions.timelineWidth}
                  y2={(index + 1) * ROW_HEIGHT}
                  stroke="var(--border-color)"
                  strokeWidth={1}
                />
              ))}

              {/* Today Line */}
              <line
                x1={todayPosition}
                y1={0}
                x2={todayPosition}
                y2={dimensions.contentHeight}
                stroke="var(--sunbelt-orange)"
                strokeWidth={2}
                strokeDasharray="4,4"
              />

              {/* Today Label */}
              <g transform={`translate(${todayPosition}, 0)`}>
                <rect
                  x={-20}
                  y={0}
                  width={40}
                  height={16}
                  rx={8}
                  fill="var(--sunbelt-orange)"
                />
                <text
                  x={0}
                  y={11}
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="600"
                >
                  Today
                </text>
              </g>

              {/* Project Bars */}
              {projects.map((project, index) => renderProjectBar(project, index))}
            </svg>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TOOLTIP                                                           */}
      {/* ================================================================== */}
      {tooltipData && (
        <div
          style={{
            position: 'absolute',
            left: LABEL_WIDTH + tooltipData.x,
            top: HEADER_HEIGHT + tooltipData.y - 80,
            transform: 'translateX(-50%)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 100,
            minWidth: '200px',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {tooltipData.project.project_number}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
            {tooltipData.project.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)', fontSize: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>Start:</span>
              <span style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>
                {tooltipData.project.start_date ? new Date(tooltipData.project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>Delivery:</span>
              <span style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>
                {tooltipData.project.delivery_date ? new Date(tooltipData.project.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
              </span>
            </div>
          </div>
          {tooltipData.project.healthLabel && (
            <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: tooltipData.project.healthColor
              }} />
              <span style={{ fontSize: '0.75rem', color: tooltipData.project.healthColor, fontWeight: '500' }}>
                {tooltipData.project.healthLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GanttTimeline;