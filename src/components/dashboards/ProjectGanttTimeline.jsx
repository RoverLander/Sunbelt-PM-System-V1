// ============================================================================
// ProjectGanttTimeline Component
// ============================================================================
// Gantt timeline view for a single project showing:
// - Tasks with durations
// - Milestones as diamond markers
// - RFI due dates
// - Submittal due dates
// - Key project dates (Online, Offline, Delivery)
//
// USAGE:
// <ProjectGanttTimeline
//   project={projectObject}
//   tasks={tasksArray}
//   milestones={milestonesArray}
//   rfis={rfisArray}
//   submittals={submittalsArray}
//   onItemClick={(type, item) => handleClick(type, item)}
// />
// ============================================================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckSquare,
  Flag,
  FileText,
  ClipboardList,
  Target,
  Truck,
  Factory
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================
const ZOOM_LEVELS = {
  week: { label: 'Week', daysVisible: 14, dayWidth: 40 },
  month: { label: 'Month', daysVisible: 30, dayWidth: 24 },
  quarter: { label: 'Quarter', daysVisible: 90, dayWidth: 8 },
  halfYear: { label: '6 Months', daysVisible: 180, dayWidth: 4 }
};

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 50;
const LABEL_WIDTH = 280;

const ITEM_COLORS = {
  task: '#22c55e',
  milestone: '#f59e0b',
  rfi: '#3b82f6',
  submittal: '#8b5cf6',
  projectDate: '#ef4444'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatMonthYear = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const formatDay = (date) => {
  return date.getDate();
};

const formatDayName = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
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

const getStatusColor = (status, type) => {
  if (type === 'task') {
    switch (status) {
      case 'Completed': return '#22c55e';
      case 'In Progress': return '#3b82f6';
      case 'Blocked': return '#ef4444';
      default: return '#64748b';
    }
  }
  if (type === 'rfi') {
    switch (status) {
      case 'Answered': return '#22c55e';
      case 'Open': return '#f59e0b';
      case 'Draft': return '#64748b';
      default: return '#3b82f6';
    }
  }
  if (type === 'submittal') {
    switch (status) {
      case 'Approved': return '#22c55e';
      case 'Approved as Noted': return '#84cc16';
      case 'Revise and Resubmit': return '#f59e0b';
      case 'Rejected': return '#ef4444';
      default: return '#8b5cf6';
    }
  }
  return ITEM_COLORS[type] || '#64748b';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ProjectGanttTimeline({ 
  project,
  tasks = [], 
  milestones = [],
  rfis = [],
  submittals = [],
  onItemClick
}) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [zoomLevel, setZoomLevel] = useState('month');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const [filter, setFilter] = useState('all'); // all, tasks, milestones, rfis, submittals
  
  const timelineRef = useRef(null);

  // ==========================================================================
  // BUILD TIMELINE ITEMS
  // ==========================================================================
  const timelineItems = useMemo(() => {
    const items = [];

    // ===== PROJECT KEY DATES =====
    if (project?.target_online_date) {
      items.push({
        id: 'project-online',
        type: 'projectDate',
        subType: 'online',
        name: 'Factory Online',
        date: project.target_online_date,
        icon: Factory
      });
    }
    if (project?.target_offline_date) {
      items.push({
        id: 'project-offline',
        type: 'projectDate',
        subType: 'offline',
        name: 'Factory Offline',
        date: project.target_offline_date,
        icon: Factory
      });
    }
    if (project?.delivery_date) {
      items.push({
        id: 'project-delivery',
        type: 'projectDate',
        subType: 'delivery',
        name: 'Delivery Date',
        date: project.delivery_date,
        icon: Truck
      });
    }

    // ===== MILESTONES =====
    if (filter === 'all' || filter === 'milestones') {
      milestones.forEach(m => {
        if (m.due_date) {
          items.push({
            id: `milestone-${m.id}`,
            type: 'milestone',
            name: m.name,
            date: m.due_date,
            status: m.status,
            data: m,
            icon: Flag
          });
        }
      });
    }

    // ===== TASKS =====
    if (filter === 'all' || filter === 'tasks') {
      tasks.forEach(t => {
        if (t.due_date) {
          items.push({
            id: `task-${t.id}`,
            type: 'task',
            name: t.title,
            startDate: t.start_date || t.due_date,
            date: t.due_date,
            status: t.status,
            data: t,
            icon: CheckSquare
          });
        }
      });
    }

    // ===== RFIS =====
    if (filter === 'all' || filter === 'rfis') {
      rfis.forEach(r => {
        if (r.due_date) {
          items.push({
            id: `rfi-${r.id}`,
            type: 'rfi',
            name: `RFI-${String(r.number || '').padStart(3, '0')}: ${r.subject}`,
            date: r.due_date,
            status: r.status,
            data: r,
            icon: FileText
          });
        }
      });
    }

    // ===== SUBMITTALS =====
    if (filter === 'all' || filter === 'submittals') {
      submittals.forEach(s => {
        if (s.due_date) {
          items.push({
            id: `submittal-${s.id}`,
            type: 'submittal',
            name: `${s.spec_section || ''} - ${s.title}`,
            date: s.due_date,
            status: s.status,
            data: s,
            icon: ClipboardList
          });
        }
      });
    }

    // Sort by date
    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    return items;
  }, [project, tasks, milestones, rfis, submittals, filter]);

  // ==========================================================================
  // CALCULATE TIMELINE BOUNDS
  // ==========================================================================
  const timelineBounds = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let earliest = new Date(today);
    let latest = new Date(today);

    // Start from 14 days ago
    earliest.setDate(earliest.getDate() - 14);
    // End 90 days from now by default
    latest.setDate(latest.getDate() + 90);

    // Expand based on items
    timelineItems.forEach(item => {
      const itemDate = new Date(item.date);
      if (item.startDate) {
        const startDate = new Date(item.startDate);
        if (startDate < earliest) earliest = new Date(startDate);
      }
      if (itemDate < earliest) earliest = new Date(itemDate);
      if (itemDate > latest) latest = new Date(itemDate);
    });

    // Add padding
    earliest.setDate(earliest.getDate() - 7);
    latest.setDate(latest.getDate() + 14);

    return { start: earliest, end: latest, today };
  }, [timelineItems]);

  // ==========================================================================
  // CALCULATE DIMENSIONS
  // ==========================================================================
  const dimensions = useMemo(() => {
    const totalDays = getDaysBetween(timelineBounds.start, timelineBounds.end);
    const zoom = ZOOM_LEVELS[zoomLevel];
    const timelineWidth = totalDays * zoom.dayWidth;
    const contentHeight = timelineItems.length * ROW_HEIGHT;

    return {
      totalDays,
      timelineWidth,
      contentHeight,
      dayWidth: zoom.dayWidth
    };
  }, [timelineBounds, zoomLevel, timelineItems.length]);

  // ==========================================================================
  // SCROLL TO TODAY ON MOUNT
  // ==========================================================================
  useEffect(() => {
    if (timelineRef.current) {
      const todayOffset = getDaysBetween(timelineBounds.start, timelineBounds.today);
      const todayPosition = todayOffset * dimensions.dayWidth;
      const containerWidth = timelineRef.current.clientWidth - LABEL_WIDTH;
      const scrollTo = Math.max(0, todayPosition - containerWidth / 4);
      timelineRef.current.scrollLeft = scrollTo;
    }
  }, [timelineBounds, dimensions.dayWidth]);

  // ==========================================================================
  // GENERATE TIMELINE HEADERS
  // ==========================================================================
  const timelineHeaders = useMemo(() => {
    const months = [];
    const days = [];
    
    let currentMonth = null;
    let monthStartX = 0;

    for (let i = 0; i <= dimensions.totalDays; i++) {
      const date = addDays(timelineBounds.start, i);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

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

      // Day markers for week/month view
      if (zoomLevel === 'week' || zoomLevel === 'month') {
        days.push({
          label: formatDay(date),
          dayName: formatDayName(date),
          x: i * dimensions.dayWidth,
          isWeekend: isWeekend(date),
          isToday: isSameDay(date, timelineBounds.today)
        });
      }
    }

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
  // RENDER ITEM
  // ==========================================================================
  const renderItem = (item, index) => {
    const itemDate = new Date(item.date);
    const dateOffset = getDaysBetween(timelineBounds.start, itemDate);
    const itemX = dateOffset * dimensions.dayWidth;
    const itemY = index * ROW_HEIGHT + ROW_HEIGHT / 2;

    const isHovered = hoveredItem === item.id;
    const color = item.type === 'projectDate' 
      ? '#ef4444' 
      : getStatusColor(item.status, item.type);

    // For tasks with start dates, draw a bar
    if (item.type === 'task' && item.startDate) {
      const startDate = new Date(item.startDate);
      const startOffset = getDaysBetween(timelineBounds.start, startDate);
      const duration = getDaysBetween(startDate, itemDate);
      const barX = startOffset * dimensions.dayWidth;
      const barWidth = Math.max(duration * dimensions.dayWidth, 8);

      return (
        <g key={item.id}>
          {/* Task bar */}
          <rect
            x={barX}
            y={itemY - 10}
            width={barWidth}
            height={20}
            rx={4}
            fill={color}
            opacity={isHovered ? 1 : 0.8}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => {
              setHoveredItem(item.id);
              setTooltipData({ item, x: barX + barWidth / 2, y: itemY - 10 });
            }}
            onMouseLeave={() => {
              setHoveredItem(null);
              setTooltipData(null);
            }}
            onClick={() => onItemClick?.(item.type, item.data)}
          />
          {/* End marker */}
          <circle
            cx={barX + barWidth}
            cy={itemY}
            r={isHovered ? 6 : 5}
            fill="white"
            stroke={color}
            strokeWidth={2}
          />
        </g>
      );
    }

    // For milestones, draw a diamond
    if (item.type === 'milestone') {
      const size = isHovered ? 10 : 8;
      return (
        <g key={item.id}>
          <polygon
            points={`${itemX},${itemY - size} ${itemX + size},${itemY} ${itemX},${itemY + size} ${itemX - size},${itemY}`}
            fill={color}
            opacity={isHovered ? 1 : 0.8}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => {
              setHoveredItem(item.id);
              setTooltipData({ item, x: itemX, y: itemY - size });
            }}
            onMouseLeave={() => {
              setHoveredItem(null);
              setTooltipData(null);
            }}
            onClick={() => onItemClick?.(item.type, item.data)}
          />
        </g>
      );
    }

    // For project dates, draw a vertical line with marker
    if (item.type === 'projectDate') {
      return (
        <g key={item.id}>
          <line
            x1={itemX}
            y1={0}
            x2={itemX}
            y2={dimensions.contentHeight}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="6,3"
            opacity={0.6}
          />
          <circle
            cx={itemX}
            cy={itemY}
            r={isHovered ? 8 : 6}
            fill={color}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => {
              setHoveredItem(item.id);
              setTooltipData({ item, x: itemX, y: itemY - 8 });
            }}
            onMouseLeave={() => {
              setHoveredItem(null);
              setTooltipData(null);
            }}
          />
        </g>
      );
    }

    // Default: circle marker (RFIs, Submittals)
    return (
      <g key={item.id}>
        <circle
          cx={itemX}
          cy={itemY}
          r={isHovered ? 8 : 6}
          fill={color}
          opacity={isHovered ? 1 : 0.8}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => {
            setHoveredItem(item.id);
            setTooltipData({ item, x: itemX, y: itemY - 8 });
          }}
          onMouseLeave={() => {
            setHoveredItem(null);
            setTooltipData(null);
          }}
          onClick={() => onItemClick?.(item.type, item.data)}
        />
      </g>
    );
  };

  // ==========================================================================
  // ZOOM CONTROLS
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

  const scrollTimeline = (direction) => {
    if (timelineRef.current) {
      const scrollAmount = timelineRef.current.clientWidth * 0.5;
      timelineRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  // ==========================================================================
  // RENDER - EMPTY STATE
  // ==========================================================================
  if (timelineItems.length === 0) {
    return (
      <div style={{
        padding: 'var(--space-2xl)',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <Calendar size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
        <p>No items with due dates to display</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - MAIN
  // ==========================================================================
  return (
    <div style={{ position: 'relative' }}>
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
        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {['all', 'tasks', 'milestones', 'rfis', 'submittals'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 12px',
                background: filter === f ? 'var(--sunbelt-orange)' : 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: filter === f ? 'white' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: '0.6875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckSquare size={12} style={{ color: ITEM_COLORS.task }} />
            <span style={{ color: 'var(--text-tertiary)' }}>Task</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flag size={12} style={{ color: ITEM_COLORS.milestone }} />
            <span style={{ color: 'var(--text-tertiary)' }}>Milestone</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={12} style={{ color: ITEM_COLORS.rfi }} />
            <span style={{ color: 'var(--text-tertiary)' }}>RFI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ClipboardList size={12} style={{ color: ITEM_COLORS.submittal }} />
            <span style={{ color: 'var(--text-tertiary)' }}>Submittal</span>
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
              disabled={zoomLevel === 'week'}
              style={{
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: zoomLevel === 'week' ? 'not-allowed' : 'pointer',
                opacity: zoomLevel === 'week' ? 0.3 : 1,
                color: 'var(--text-secondary)'
              }}
            >
              <ZoomIn size={14} />
            </button>
            <span style={{
              padding: '0 var(--space-sm)',
              fontSize: '0.6875rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {ZOOM_LEVELS[zoomLevel].label}
            </span>
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel === 'halfYear'}
              style={{
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: zoomLevel === 'halfYear' ? 'not-allowed' : 'pointer',
                opacity: zoomLevel === 'halfYear' ? 0.3 : 1,
                color: 'var(--text-secondary)'
              }}
            >
              <ZoomOut size={14} />
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
        {/* ===== ITEM LABELS (FIXED) ===== */}
        <div style={{
          width: LABEL_WIDTH,
          flexShrink: 0,
          borderRight: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)'
        }}>
          {/* Header */}
          <div style={{
            height: HEADER_HEIGHT,
            padding: 'var(--space-sm)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-end',
            fontWeight: '600',
            fontSize: '0.75rem',
            color: 'var(--text-primary)'
          }}>
            Item
          </div>

          {/* Item Labels */}
          {timelineItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => item.data && onItemClick?.(item.type, item.data)}
                style={{
                  height: ROW_HEIGHT,
                  padding: '0 var(--space-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: item.data ? 'pointer' : 'default',
                  background: hoveredItem === item.id ? 'var(--bg-tertiary)' : 'transparent',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Icon size={14} style={{ 
                  color: item.type === 'projectDate' ? '#ef4444' : getStatusColor(item.status, item.type),
                  flexShrink: 0 
                }} />
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.name}
                </span>
              </div>
            );
          })}
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
              <div style={{ height: zoomLevel === 'week' || zoomLevel === 'month' ? '25px' : '100%', position: 'relative', borderBottom: zoomLevel === 'week' || zoomLevel === 'month' ? '1px solid var(--border-color)' : 'none' }}>
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
                      fontSize: '0.6875rem',
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

              {/* Day Headers */}
              {(zoomLevel === 'week' || zoomLevel === 'month') && (
                <div style={{ height: '25px', position: 'relative' }}>
                  {timelineHeaders.days.map((day, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        left: day.x,
                        width: dimensions.dayWidth,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.5625rem',
                        fontWeight: day.isToday ? '700' : '400',
                        color: day.isToday ? 'var(--sunbelt-orange)' : day.isWeekend ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                        background: day.isToday ? 'rgba(255, 107, 53, 0.1)' : day.isWeekend ? 'var(--bg-tertiary)' : 'transparent'
                      }}
                    >
                      <span>{day.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline Grid & Items */}
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
              {timelineItems.map((_, index) => (
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
              {timelineItems.map((_, index) => (
                <line
                  key={`div-${index}`}
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
              />

              {/* Items */}
              {timelineItems.map((item, index) => renderItem(item, index))}
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
            top: HEADER_HEIGHT + tooltipData.y - 60,
            transform: 'translateX(-50%)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-sm)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 100,
            minWidth: '150px',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {tooltipData.item.name}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
            {new Date(tooltipData.item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          {tooltipData.item.status && (
            <div style={{ 
              fontSize: '0.625rem', 
              color: getStatusColor(tooltipData.item.status, tooltipData.item.type),
              fontWeight: '600',
              marginTop: '2px'
            }}>
              {tooltipData.item.status}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectGanttTimeline;