import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ExternalLink,
  Package,
  Flame
} from 'lucide-react';
import TimelineHeader from './TimelineHeader';
import TimelineBar from './TimelineBar';
import ModuleCardTooltip from './ModuleCardTooltip';
import {
  ZOOM_LEVELS,
  addDays,
  startOfDay,
  startOfWeek,
  getDayWidth,
  calculateBarPosition,
  calculateTimelineWidth,
  generateDateHeaders,
  isSameDay,
  pixelToDate,
  snapToGrid
} from './timelineUtils';

/**
 * CalendarTimelineView - Gantt-style timeline view for production modules
 *
 * @param {Array} modules - Array of module objects to display
 * @param {function} onModuleClick - Handler for module click
 * @param {function} onModuleReschedule - Handler for module reschedule (drag)
 * @param {function} onViewChange - Handler for view change
 * @param {Date} initialDate - Initial center date
 * @param {boolean} canEdit - Whether editing is allowed
 */
function CalendarTimelineView({
  modules = [],
  onModuleClick,
  onModuleReschedule,
  onViewChange,
  initialDate = new Date(),
  canEdit = true,
  isPopout = false,
  onPopoutClose
}) {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const popoutWindowRef = useRef(null);

  // State
  const [currentDate, setCurrentDate] = useState(startOfDay(initialDate));
  const [zoomLevel, setZoomLevel] = useState('week');
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hoveredModule, setHoveredModule] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [compactLeftPanel, setCompactLeftPanel] = useState(false);

  // Drag-to-pan state (using refs to avoid stale closure issues)
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const isDraggingRef = useRef(false);

  // Calculate timeline range (3 months)
  const timelineRange = useMemo(() => {
    const start = addDays(currentDate, -30);
    const end = addDays(currentDate, 60);
    return { start: startOfDay(start), end: startOfDay(end) };
  }, [currentDate]);

  const dayWidth = getDayWidth(zoomLevel);
  const totalWidth = calculateTimelineWidth(timelineRange.start, timelineRange.end, zoomLevel);
  const headers = generateDateHeaders(timelineRange.start, timelineRange.end, zoomLevel);

  // Responsive sizing
  const rowHeight = compactLeftPanel ? 40 : 48;
  const leftPanelWidth = compactLeftPanel ? 160 : 220;

  // Pop-out window handler
  const handlePopout = useCallback(() => {
    // Create pop-out window with timeline
    const width = Math.min(window.screen.width * 0.9, 1600);
    const height = Math.min(window.screen.height * 0.8, 900);
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no`;

    // Store module data for the popout
    localStorage.setItem('timelinePopoutData', JSON.stringify({
      modules: modules,
      currentDate: currentDate.toISOString(),
      zoomLevel: zoomLevel
    }));

    popoutWindowRef.current = window.open('/timeline-popout', 'ProductionTimeline', features);

    // Listen for popout close
    if (popoutWindowRef.current) {
      const checkClosed = setInterval(() => {
        if (popoutWindowRef.current?.closed) {
          clearInterval(checkClosed);
          popoutWindowRef.current = null;
        }
      }, 1000);
    }
  }, [modules, currentDate, zoomLevel]);

  // Toggle expanded/fullscreen mode
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Toggle compact mode for laptop screens
  const toggleCompact = useCallback(() => {
    setCompactLeftPanel(!compactLeftPanel);
  }, [compactLeftPanel]);

  // Drag-to-pan handlers
  const handleMouseDown = (e) => {
    // Only start drag if clicking on the timeline background, not on a module bar
    if (e.target.closest('[data-module-bar]')) return;

    // Prevent text selection during drag
    e.preventDefault();

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      scrollLeft: timelineRef.current?.scrollLeft || 0
    };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !timelineRef.current) return;

    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    timelineRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  };

  // Sort modules by start date, then by rush status
  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => {
      // Rush modules first
      if (a.is_rush && !b.is_rush) return -1;
      if (!a.is_rush && b.is_rush) return 1;

      // Then by start date
      const aStart = new Date(a.scheduled_start || new Date());
      const bStart = new Date(b.scheduled_start || new Date());
      return aStart - bStart;
    });
  }, [modules]);

  // Center on today on mount
  useEffect(() => {
    if (timelineRef.current) {
      const todayIndex = headers.findIndex(h => isSameDay(h.date, new Date()));
      if (todayIndex !== -1) {
        const containerWidth = containerRef.current?.offsetWidth || 800;
        const targetScroll = todayIndex * dayWidth - containerWidth / 2 + dayWidth / 2;
        timelineRef.current.scrollLeft = Math.max(0, targetScroll);
      }
    }
  }, [zoomLevel, headers, dayWidth]);

  // Navigation handlers
  const navigateTimeline = (direction) => {
    const days = zoomLevel === 'day' ? 7 : zoomLevel === 'week' ? 14 : 30;
    setCurrentDate(addDays(currentDate, direction * days));
  };

  const goToToday = () => {
    setCurrentDate(startOfDay(new Date()));
  };

  // Zoom handlers
  const zoomIn = () => {
    const levels = ['month', 'week', 'day'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1]);
    }
  };

  const zoomOut = () => {
    const levels = ['month', 'week', 'day'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(levels[currentIndex - 1]);
    }
  };

  // Scroll handler
  const handleScroll = (e) => {
    setScrollLeft(e.target.scrollLeft);
  };

  // Tooltip handlers
  const handleModuleMouseEnter = (module, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 300)
    });
    setHoveredModule(module);
  };

  const handleModuleMouseLeave = () => {
    setHoveredModule(null);
  };

  // Drag handlers for rescheduling
  const handleDragStart = (e, module) => {
    // Handled by TimelineBar
  };

  const handleDragEnd = (e, module) => {
    // Calculate new dates based on drop position
    if (onModuleReschedule && canEdit) {
      // Get drop position and calculate new start date
      // This would need the actual drop coordinates
    }
  };

  // Container styles based on expanded state
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '500px',
    background: 'var(--bg-secondary)',
    borderRadius: isExpanded ? 0 : 'var(--radius-lg)',
    border: isExpanded ? 'none' : '1px solid var(--border-color)',
    ...(isExpanded && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      borderRadius: 0
    }),
    ...(isPopout && {
      height: '100vh',
      borderRadius: 0,
      border: 'none'
    })
  };

  return (
    <div
      ref={containerRef}
      style={containerStyles}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
          gap: '8px',
          flexShrink: 0,
          minHeight: '48px',
          overflowX: 'auto'
        }}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Calendar size={20} style={{ color: 'var(--sunbelt-orange)' }} />
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap'
            }}
          >
            Timeline
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', flexShrink: 0 }} />

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={zoomOut}
            disabled={zoomLevel === 'month'}
            title="Zoom out"
            style={{
              padding: '6px 8px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: zoomLevel === 'month' ? 'not-allowed' : 'pointer',
              color: zoomLevel === 'month' ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem'
            }}
          >
            <ZoomOut size={14} />
          </button>
          <span
            style={{
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {ZOOM_LEVELS[zoomLevel].label}
          </span>
          <button
            onClick={zoomIn}
            disabled={zoomLevel === 'day'}
            title="Zoom in"
            style={{
              padding: '6px 8px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: zoomLevel === 'day' ? 'not-allowed' : 'pointer',
              color: zoomLevel === 'day' ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem'
            }}
          >
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', flexShrink: 0 }} />

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => navigateTimeline(-1)}
            title="Previous"
            style={{
              padding: '6px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToToday}
            style={{
              padding: '6px 10px',
              background: 'var(--sunbelt-orange)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Today
          </button>
          <button
            onClick={() => navigateTimeline(1)}
            title="Next"
            style={{
              padding: '6px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View Switcher */}
        {onViewChange && !isPopout && (
          <select
            onChange={(e) => onViewChange(e.target.value)}
            defaultValue="timeline"
            style={{
              padding: '6px 10px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
            <option value="timeline">Timeline</option>
            <option value="station">Station</option>
          </select>
        )}

        {/* Fullscreen Toggle */}
        {!isPopout && (
          <button
            onClick={toggleExpanded}
            title={isExpanded ? 'Exit fullscreen' : 'Fullscreen'}
            style={{
              padding: '6px',
              background: isExpanded ? 'var(--sunbelt-orange)' : 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: isExpanded ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              flexShrink: 0
            }}
          >
            <Maximize2 size={16} />
          </button>
        )}

        {/* Pop-out Button */}
        {!isPopout && (
          <button
            onClick={handlePopout}
            title="Open in new window"
            style={{
              padding: '6px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              flexShrink: 0
            }}
          >
            <ExternalLink size={16} />
          </button>
        )}

        {/* Close button for popout */}
        {isPopout && onPopoutClose && (
          <button
            onClick={onPopoutClose}
            title="Close"
            style={{
              padding: '6px 12px',
              background: 'var(--danger)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600',
              flexShrink: 0
            }}
          >
            Close
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Fixed Left Panel - Module Info */}
        <div
          style={{
            width: leftPanelWidth,
            flexShrink: 0,
            borderRight: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Left Panel Header */}
          <div
            style={{
              padding: '12px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)',
              height: zoomLevel === 'day' ? 66 : 58,
              display: 'flex',
              alignItems: 'flex-end'
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Modules ({sortedModules.length})
            </span>
          </div>

          {/* Module List */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {sortedModules.map((module, index) => (
              <div
                key={module.id || index}
                style={{
                  height: rowHeight,
                  padding: compactLeftPanel ? '4px 8px' : '8px 12px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: compactLeftPanel ? '4px' : '8px',
                  background: module.is_rush ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={() => onModuleClick && onModuleClick(module)}
              >
                <Package
                  size={compactLeftPanel ? 12 : 14}
                  style={{
                    color: module.is_rush ? 'var(--danger)' : module.color || 'var(--sunbelt-orange)',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: compactLeftPanel ? '0.6875rem' : '0.75rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {module.serial_number || module.module_number || 'Unknown'}
                  </div>
                  {!compactLeftPanel && (
                    <div
                      style={{
                        fontSize: '0.625rem',
                        color: 'var(--text-tertiary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {module.project?.name || module.project_name || 'No Project'}
                    </div>
                  )}
                </div>
                {module.is_rush && <Flame size={compactLeftPanel ? 10 : 12} style={{ color: 'var(--danger)' }} />}
              </div>
            ))}

            {/* Empty State */}
            {sortedModules.length === 0 && (
              <div
                style={{
                  padding: 'var(--space-xl)',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)'
                }}
              >
                <Package size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ fontSize: '0.875rem', margin: 0 }}>No modules scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Timeline Area */}
        <div
          ref={timelineRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: isDragging ? 'none' : 'auto'
          }}
        >
          {/* Timeline Header */}
          <TimelineHeader
            startDate={timelineRange.start}
            endDate={timelineRange.end}
            zoomLevel={zoomLevel}
            scrollLeft={scrollLeft}
          />

          {/* Timeline Body */}
          <div
            style={{
              position: 'relative',
              width: totalWidth,
              minHeight: Math.max(sortedModules.length * rowHeight, 400)
            }}
          >
            {/* Grid Lines - Background layer */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: totalWidth,
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
              }}
            >
              {headers.map((header, index) => (
                <div
                  key={`grid-${index}`}
                  style={{
                    position: 'absolute',
                    left: index * dayWidth,
                    top: 0,
                    bottom: 0,
                    width: dayWidth,
                    borderRight: '1px solid var(--border-color)',
                    background: header.isToday
                      ? 'rgba(255, 107, 53, 0.05)'
                      : header.isWeekend
                        ? 'rgba(0, 0, 0, 0.02)'
                        : 'transparent'
                  }}
                />
              ))}
            </div>

            {/* Module Rows with Bars */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {sortedModules.map((module, index) => {
                const barPos = calculateBarPosition(module, timelineRange.start, zoomLevel);

                return (
                  <div
                    key={module.id || index}
                    style={{
                      position: 'relative',
                      height: rowHeight,
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    <TimelineBar
                      module={module}
                      left={barPos.left}
                      width={barPos.width}
                      draggable={canEdit}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onClick={onModuleClick}
                      onMouseEnter={handleModuleMouseEnter}
                      onMouseLeave={handleModuleMouseLeave}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-lg)',
          padding: 'var(--space-sm) var(--space-lg)',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
          fontSize: '0.75rem'
        }}
      >
        <span style={{ color: 'var(--text-tertiary)', fontWeight: '600' }}>Status:</span>
        {[
          { label: 'Not Started', color: 'var(--text-tertiary)' },
          { label: 'In Progress', color: 'var(--sunbelt-orange)' },
          { label: 'Completed', color: 'var(--success)' },
          { label: 'Rush', color: 'var(--danger)' }
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: `${item.color}30`,
                border: `2px solid ${item.color}`
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Module Tooltip */}
      <ModuleCardTooltip
        module={hoveredModule}
        position={tooltipPosition}
        visible={hoveredModule !== null}
      />
    </div>
  );
}

export default CalendarTimelineView;
