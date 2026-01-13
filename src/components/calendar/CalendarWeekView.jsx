// ============================================================================
// CalendarWeekView.jsx
// ============================================================================
// Week view calendar component with fixed-width day cells.
//
// FEATURES:
// - Fixed width columns that don't shift based on content
// - Text truncation for long item names
// - Export Week to Outlook button
// - Item popover on click
// - Weekend columns slightly narrower
//
// FIXES (Jan 9, 2026):
// - ✅ FIXED: Day cells now have fixed width (won't grow/shrink with content)
// - ✅ FIXED: Text items truncate with ellipsis
// - ✅ ADDED: Export Week to Outlook button
//
// DEPENDENCIES:
// - calendarUtils: Date formatting and grouping utilities
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  Flag,
  Play,
  Square,
  Truck,
  X,
  Edit,
  ExternalLink,
  Download
} from 'lucide-react';
import {
  getWeekDates,
  formatDateKey,
  formatDisplayDate,
  getWeekRangeText,
  isToday,
  isPast,
  isWeekend,
  groupItemsByDate,
  ITEM_TYPE_CONFIG
} from '../../utils/calendarUtils';

// ============================================================================
// ICON MAPPING
// ============================================================================
const ICON_MAP = {
  CheckSquare,
  MessageSquare,
  ClipboardList,
  Flag,
  Play,
  Square,
  Truck
};

// ============================================================================
// ICS EXPORT HELPER FUNCTIONS
// ============================================================================

const escapeICS = (str) => {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
};

const formatICSDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const getExclusiveEndDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const generateUID = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@sunbeltpm`;
};

const createICSEvent = ({ title, description, startDate, category }) => {
  const uid = generateUID();
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const start = formatICSDate(startDate);
  const end = getExclusiveEndDate(startDate);

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    'SEQUENCE:0',
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    'TRANSP:TRANSPARENT',
    'STATUS:CONFIRMED',
    `SUMMARY:${escapeICS(title)}`,
    description ? `DESCRIPTION:${escapeICS(description)}` : '',
    category ? `CATEGORIES:${escapeICS(category)}` : '',
    'END:VEVENT'
  ].filter(Boolean).join('\r\n');
};

const downloadICS = (icsContent, filename) => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function CalendarWeekView({
  items = [],
  projects = [],
  onItemClick,
  onDateClick,
  onViewChange,
  compact = false,
  canEdit = true
}) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    const dates = getWeekDates(currentDate);
    setWeekDates(dates);
  }, [currentDate]);

  useEffect(() => {
    setGroupedItems(groupItemsByDate(items));
  }, [items]);

  // ==========================================================================
  // COMPUTED: Items for current week (for export)
  // ==========================================================================
  const weekItems = useMemo(() => {
    if (weekDates.length === 0) return [];
    
    const weekItemsList = [];
    weekDates.forEach(date => {
      const dateKey = formatDateKey(date);
      const dayItems = groupedItems[dateKey] || [];
      weekItemsList.push(...dayItems);
    });
    return weekItemsList;
  }, [weekDates, groupedItems]);

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // ==========================================================================
  // EXPORT TO OUTLOOK
  // ==========================================================================
  const handleExportWeek = () => {
    if (weekItems.length === 0) {
      alert('No items to export for this week.');
      return;
    }

    const events = weekItems.map(item => {
      const typeLabel = item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'Item';
      return createICSEvent({
        title: `[${typeLabel}] ${item.title}`,
        description: `Status: ${item.status || 'N/A'}\\nProject: ${item.projectName || 'N/A'}`,
        startDate: item.date,
        category: typeLabel
      });
    });

    const weekRange = getWeekRangeText(weekDates);
    const calendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sunbelt Modular//PM System//EN',
      `X-WR-CALNAME:Week of ${weekRange}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');

    const filename = `Week_${formatDateKey(weekDates[0])}_to_${formatDateKey(weekDates[6])}.ics`;
    downloadICS(calendar, filename);
  };

  // ==========================================================================
  // ITEM CLICK HANDLER
  // ==========================================================================
  const handleItemClick = (item, event) => {
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverWidth = 320;
    const popoverHeight = 250;
    
    let left = rect.left;
    let top = rect.bottom + 8;
    
    if (left + popoverWidth > viewportWidth - 20) {
      left = viewportWidth - popoverWidth - 20;
    }
    if (top + popoverHeight > viewportHeight - 20) {
      top = rect.top - popoverHeight - 8;
    }
    
    setPopoverPosition({
      top: Math.max(20, top),
      left: Math.max(20, left)
    });
    setSelectedItem(item);
  };

  const closePopover = () => {
    setSelectedItem(null);
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getItemIcon = (type) => {
    const config = ITEM_TYPE_CONFIG[type];
    if (!config) return CheckSquare;
    return ICON_MAP[config.icon] || CheckSquare;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'var(--text-tertiary)',
      'In Progress': 'var(--sunbelt-orange)',
      'Awaiting Response': 'var(--warning)',
      'Completed': 'var(--success)',
      'Cancelled': 'var(--text-tertiary)',
      'Open': 'var(--sunbelt-orange)',
      'Answered': 'var(--success)',
      'Closed': 'var(--text-tertiary)',
      'Pending': 'var(--text-tertiary)',
      'Submitted': 'var(--sunbelt-orange)',
      'Under Review': 'var(--warning)',
      'Approved': 'var(--success)',
      'Rejected': 'var(--danger)',
      'Approved as Noted': 'var(--info)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  // ==========================================================================
  // RENDER: Day Cell
  // ==========================================================================
  const renderDayCell = (date, index) => {
    const dateKey = formatDateKey(date);
    const dayItems = groupedItems[dateKey] || [];
    const today = isToday(date);
    const weekend = isWeekend(date);
    const maxVisible = compact ? 2 : weekend ? 3 : 5;
    const hasMore = dayItems.length > maxVisible;

    return (
      <div
        key={dateKey}
        onClick={() => onDateClick && onDateClick(date)}
        style={{
          // ✅ FIXED: Use flex-basis 0 to ensure equal distribution
          flex: weekend ? '0.5 1 0' : '1 1 0',
          // ✅ FIXED: Set minimum width so cells don't collapse
          minWidth: weekend ? '80px' : '120px',
          // ✅ FIXED: Overflow hidden to contain content
          overflow: 'hidden',
          padding: weekend ? 'var(--space-xs)' : 'var(--space-sm)',
          background: today 
            ? 'rgba(255, 107, 53, 0.08)' 
            : weekend 
              ? 'var(--bg-tertiary)' 
              : 'var(--bg-primary)',
          borderRight: index < 6 ? '1px solid var(--border-color)' : 'none',
          cursor: onDateClick ? 'pointer' : 'default',
          transition: 'background 0.15s',
          display: 'flex',
          flexDirection: 'column',
          minHeight: compact ? '150px' : '220px'
        }}
      >
        {/* Day Header */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          marginBottom: 'var(--space-sm)',
          paddingBottom: 'var(--space-xs)',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0
        }}>
          <span style={{ 
            fontSize: weekend ? '0.65rem' : '0.75rem', 
            color: today ? 'var(--sunbelt-orange)' : 'var(--text-tertiary)',
            textTransform: 'uppercase',
            fontWeight: '600',
            letterSpacing: '0.05em'
          }}>
            {formatDisplayDate(date, 'weekday')}
          </span>
          <span style={{ 
            fontSize: weekend ? '1rem' : '1.5rem', 
            fontWeight: '700',
            color: today ? 'white' : 'var(--text-primary)',
            width: weekend ? '28px' : '36px',
            height: weekend ? '28px' : '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: today ? 'var(--sunbelt-orange)' : 'transparent'
          }}>
            {formatDisplayDate(date, 'dayNum')}
          </span>
        </div>

        {/* Items Container - ✅ FIXED: overflow hidden */}
        <div style={{ 
          flex: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {dayItems.slice(0, maxVisible).map(item => {
            const Icon = getItemIcon(item.type);
            const isOverdue = isPast(item.date) && 
              !['Completed', 'Cancelled', 'Closed', 'Approved', 'Approved as Noted'].includes(item.status);

            return (
              <div
                key={item.id}
                onClick={(e) => handleItemClick(item, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: weekend ? '3px 4px' : '5px 8px',
                  background: isOverdue ? 'var(--danger-light)' : `${item.color}20`,
                  borderLeft: `3px solid ${isOverdue ? 'var(--danger)' : item.color}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  // ✅ FIXED: Ensure item doesn't overflow cell
                  overflow: 'hidden',
                  flexShrink: 0
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateX(2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Icon 
                  size={weekend ? 10 : 14} 
                  style={{ 
                    color: isOverdue ? 'var(--danger)' : item.color,
                    flexShrink: 0
                  }} 
                />
                {/* ✅ FIXED: Text truncates with ellipsis */}
                <span style={{
                  fontSize: weekend ? '0.65rem' : '0.75rem',
                  fontWeight: '500',
                  color: isOverdue ? 'var(--danger)' : 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0
                }}>
                  {item.title}
                </span>
              </div>
            );
          })}

          {hasMore && (
            <div 
              style={{
                fontSize: weekend ? '0.6rem' : '0.7rem',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                padding: '2px',
                cursor: 'pointer',
                fontWeight: '600',
                flexShrink: 0
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDateClick && onDateClick(date);
              }}
            >
              +{dayItems.length - maxVisible} more
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
      // ✅ FIXED: Ensure container takes full width
      width: '100%'
    }}>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-md) var(--space-lg)',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <Calendar size={20} style={{ color: 'var(--sunbelt-orange)' }} />
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0 
          }}>
            {getWeekRangeText(weekDates)}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {/* ✅ ADDED: Export to Outlook Button */}
          <button
            onClick={handleExportWeek}
            title="Export week to Outlook"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: '600',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
              e.currentTarget.style.color = 'var(--sunbelt-orange)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--bg-primary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Download size={14} />
            Export Week
          </button>

          {/* Today Button */}
          <button
            onClick={goToToday}
            style={{
              padding: '6px 12px',
              background: 'var(--sunbelt-orange)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: '600'
            }}
          >
            Today
          </button>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => navigateWeek(-1)}
              style={{
                padding: '6px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                transition: 'all 0.15s'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => navigateWeek(1)}
              style={{
                padding: '6px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                transition: 'all 0.15s'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* View Toggle */}
          {onViewChange && (
            <select
              onChange={(e) => onViewChange(e.target.value)}
              defaultValue="week"
              style={{
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="day">Day</option>
            </select>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* CALENDAR GRID - ✅ FIXED: width 100%                              */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        width: '100%'
      }}>
        {weekDates.map((date, index) => renderDayCell(date, index))}
      </div>

      {/* ================================================================== */}
      {/* LEGEND                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        padding: 'var(--space-sm) var(--space-lg)',
        background: 'var(--bg-tertiary)',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>
          Legend:
        </span>
        {projects.slice(0, 6).map((project, index) => (
          <div key={project.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              background: project.color || `hsl(${index * 45}, 70%, 50%)`
            }} />
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {project.name}
            </span>
          </div>
        ))}
        {projects.length > 6 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            +{projects.length - 6} more
          </span>
        )}
      </div>

      {/* ================================================================== */}
      {/* ITEM POPOVER                                                      */}
      {/* ================================================================== */}
      {selectedItem && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999
            }}
            onClick={closePopover}
          />
          
          {/* Popover */}
          <div style={{
            position: 'fixed',
            top: popoverPosition.top,
            left: popoverPosition.left,
            width: '320px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            {/* Popover Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: 'var(--space-md)',
              borderBottom: '1px solid var(--border-color)',
              background: `${selectedItem.color}15`
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-xs)',
                  marginBottom: '4px'
                }}>
                  {React.createElement(getItemIcon(selectedItem.type), { 
                    size: 16, 
                    style: { color: selectedItem.color }
                  })}
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: selectedItem.color,
                    textTransform: 'uppercase'
                  }}>
                    {selectedItem.type}
                  </span>
                </div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.3
                }}>
                  {selectedItem.title}
                </h4>
              </div>
              <button
                onClick={closePopover}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Popover Content */}
            <div style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Due Date</span>
                  <span style={{
                    fontSize: '0.875rem',
                    color: isPast(selectedItem.date) && 
                      !['Completed', 'Cancelled', 'Closed', 'Approved'].includes(selectedItem.status)
                        ? 'var(--danger)' 
                        : 'var(--text-primary)',
                    fontWeight: '500'
                  }}>
                    {formatDisplayDate(selectedItem.date, 'long')}
                  </span>
                </div>
                {selectedItem.status && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Status</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: `${getStatusColor(selectedItem.status)}20`,
                      color: getStatusColor(selectedItem.status)
                    }}>
                      {selectedItem.status}
                    </span>
                  </div>
                )}
                {selectedItem.projectName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Project</span>
                    <span style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-primary)',
                      fontWeight: '500'
                    }}>
                      {selectedItem.projectName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Popover Actions */}
            <div style={{
              padding: 'var(--space-md)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: 'var(--space-sm)'
            }}>
              {canEdit && (
                <button
                  onClick={() => {
                    onItemClick && onItemClick(selectedItem);
                    closePopover();
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-xs)',
                    padding: 'var(--space-sm)',
                    background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Edit size={14} />
                  Edit
                </button>
              )}
              <button
                onClick={closePopover}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--space-sm)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CalendarWeekView;