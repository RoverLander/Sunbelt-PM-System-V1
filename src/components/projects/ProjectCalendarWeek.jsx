// ============================================================================
// ProjectCalendarWeek.jsx
// ============================================================================
// Week view calendar for a single project showing tasks, RFIs, submittals,
// milestones, and key project dates.
//
// FEATURES:
// - Fixed width columns that don't shift based on content
// - Text truncation for long item names
// - Export Week to Outlook button
// - Item popover on click
//
// FIXES (Jan 9, 2026):
// - ✅ FIXED: Day cells now have fixed width (won't grow/shrink with content)
// - ✅ FIXED: Text items truncate with ellipsis
// - ✅ ADDED: Export Week to Outlook button
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
  ITEM_TYPE_CONFIG,
  CALENDAR_ITEM_TYPES,
  getProjectColor
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
function ProjectCalendarWeek({ 
  project,
  tasks = [],
  rfis = [],
  submittals = [],
  milestones = [],
  onItemClick
}) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  const projectColor = project?.color || getProjectColor(project, 0);

  // ==========================================================================
  // BUILD CALENDAR ITEMS
  // ==========================================================================
  useEffect(() => {
    const items = [];

    tasks?.forEach(task => {
      if (task.due_date) {
        items.push({
          id: `task-${task.id}`,
          type: CALENDAR_ITEM_TYPES.TASK,
          title: task.title,
          date: task.due_date,
          color: projectColor,
          status: task.status,
          data: task,
        });
      }
    });

    rfis?.forEach(rfi => {
      if (rfi.due_date) {
        items.push({
          id: `rfi-${rfi.id}`,
          type: CALENDAR_ITEM_TYPES.RFI,
          title: `${rfi.rfi_number}: ${rfi.subject}`,
          date: rfi.due_date,
          color: projectColor,
          status: rfi.status,
          data: rfi,
        });
      }
    });

    submittals?.forEach(sub => {
      if (sub.due_date) {
        items.push({
          id: `sub-${sub.id}`,
          type: CALENDAR_ITEM_TYPES.SUBMITTAL,
          title: `${sub.submittal_number}: ${sub.title}`,
          date: sub.due_date,
          color: projectColor,
          status: sub.status,
          data: sub,
        });
      }
    });

    milestones?.forEach(milestone => {
      if (milestone.due_date) {
        items.push({
          id: `milestone-${milestone.id}`,
          type: CALENDAR_ITEM_TYPES.MILESTONE,
          title: milestone.name,
          date: milestone.due_date,
          color: projectColor,
          status: milestone.status,
          data: milestone,
        });
      }
    });

    if (project?.target_online_date) {
      items.push({
        id: `online-${project.id}`,
        type: CALENDAR_ITEM_TYPES.ONLINE_DATE,
        title: 'Online Date',
        date: project.target_online_date,
        color: projectColor,
        data: project,
      });
    }
    
    if (project?.target_offline_date) {
      items.push({
        id: `offline-${project.id}`,
        type: CALENDAR_ITEM_TYPES.OFFLINE_DATE,
        title: 'Offline Date',
        date: project.target_offline_date,
        color: projectColor,
        data: project,
      });
    }
    
    if (project?.delivery_date) {
      items.push({
        id: `delivery-${project.id}`,
        type: CALENDAR_ITEM_TYPES.DELIVERY_DATE,
        title: 'Delivery Date',
        date: project.delivery_date,
        color: projectColor,
        data: project,
      });
    }

    setCalendarItems(items);
  }, [project, tasks, rfis, submittals, milestones, projectColor]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    setWeekDates(getWeekDates(currentDate));
  }, [currentDate]);

  useEffect(() => {
    setGroupedItems(groupItemsByDate(calendarItems));
  }, [calendarItems]);

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
        title: `[${project?.project_number || 'Project'}] ${item.title}`,
        description: `Status: ${item.status || 'N/A'}\\nType: ${typeLabel}`,
        startDate: item.date,
        category: typeLabel
      });
    });

    const weekRange = getWeekRangeText(weekDates);
    const calendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sunbelt Modular//PM System//EN',
      `X-WR-CALNAME:${project?.project_number || 'Project'} - ${weekRange}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');

    const filename = `${project?.project_number || 'Project'}_Week_${formatDateKey(weekDates[0])}.ics`;
    downloadICS(calendar, filename);
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleItemClick = (item, event) => {
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverWidth = 300;
    const popoverHeight = 220;
    
    let left = rect.left;
    let top = rect.bottom + 8;
    
    if (left + popoverWidth > viewportWidth - 20) {
      left = viewportWidth - popoverWidth - 20;
    }
    if (top + popoverHeight > viewportHeight - 20) {
      top = rect.top - popoverHeight - 8;
    }
    
    setPopoverPosition({ top: Math.max(20, top), left: Math.max(20, left) });
    setSelectedItem(item);
  };

  const closePopover = () => setSelectedItem(null);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getItemIcon = (type) => {
    const config = ITEM_TYPE_CONFIG[type];
    return ICON_MAP[config?.icon] || CheckSquare;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'var(--text-tertiary)',
      'In Progress': 'var(--sunbelt-orange)',
      'Blocked': 'var(--danger)',
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
    const maxVisible = weekend ? 2 : 4;
    const hasMore = dayItems.length > maxVisible;

    return (
      <div
        key={dateKey}
        style={{
          // ✅ FIXED: Use flex-basis 0 to ensure equal distribution
          flex: weekend ? '0.5 1 0' : '1 1 0',
          // ✅ FIXED: Set minimum width so cells don't collapse
          minWidth: weekend ? '80px' : '120px',
          // ✅ FIXED: Overflow hidden to contain content
          overflow: 'hidden',
          padding: weekend ? 'var(--space-xs)' : 'var(--space-sm)',
          background: today 
            ? `${projectColor}15`
            : weekend 
              ? 'var(--bg-tertiary)' 
              : 'var(--bg-primary)',
          borderRight: index < 6 ? '1px solid var(--border-color)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '160px'
        }}
      >
        {/* Day Header */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          marginBottom: 'var(--space-xs)',
          paddingBottom: 'var(--space-xs)',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0
        }}>
          <span style={{ 
            fontSize: weekend ? '0.6rem' : '0.7rem', 
            color: today ? projectColor : 'var(--text-tertiary)',
            textTransform: 'uppercase',
            fontWeight: '600',
            letterSpacing: '0.05em'
          }}>
            {formatDisplayDate(date, 'weekday')}
          </span>
          <span style={{ 
            fontSize: weekend ? '1rem' : '1.25rem', 
            fontWeight: '700',
            color: today ? 'white' : 'var(--text-primary)',
            width: weekend ? '24px' : '32px',
            height: weekend ? '24px' : '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: today ? projectColor : 'transparent'
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
                  padding: weekend ? '3px 4px' : '4px 6px',
                  background: isOverdue ? 'var(--danger-light)' : `${projectColor}20`,
                  borderLeft: `2px solid ${isOverdue ? 'var(--danger)' : projectColor}`,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  // ✅ FIXED: Ensure item doesn't overflow cell
                  overflow: 'hidden',
                  flexShrink: 0
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <Icon 
                  size={weekend ? 10 : 12} 
                  style={{ 
                    color: isOverdue ? 'var(--danger)' : projectColor,
                    flexShrink: 0
                  }} 
                />
                {/* ✅ FIXED: Text truncates with ellipsis */}
                <span style={{
                  fontSize: weekend ? '0.6rem' : '0.7rem',
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
            <div style={{
              fontSize: weekend ? '0.55rem' : '0.65rem',
              color: projectColor,
              textAlign: 'center',
              padding: '2px',
              fontWeight: '600',
              flexShrink: 0
            }}>
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
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: `${projectColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={20} style={{ color: projectColor }} />
          </div>
          <h3 style={{ 
            fontSize: '1rem', 
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
              e.currentTarget.style.borderColor = projectColor;
              e.currentTarget.style.color = projectColor;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--bg-primary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Download size={14} />
            Export
          </button>

          {/* Today Button */}
          <button
            onClick={goToToday}
            style={{
              padding: '6px 12px',
              background: projectColor,
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
                padding: '4px',
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
              onClick={() => navigateWeek(1)}
              style={{
                padding: '4px',
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
        </div>
      </div>

      {/* ================================================================== */}
      {/* DAY HEADERS                                                       */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)',
        width: '100%'
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
          const isWeekendDay = day === 'Sat' || day === 'Sun';
          return (
            <div
              key={day}
              style={{
                flex: isWeekendDay ? '0.5 1 0' : '1 1 0',
                minWidth: isWeekendDay ? '80px' : '120px',
                padding: 'var(--space-xs) var(--space-sm)',
                textAlign: 'center',
                fontSize: '0.7rem',
                fontWeight: '700',
                color: isWeekendDay ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                textTransform: 'uppercase',
                borderRight: index < 6 ? '1px solid var(--border-color)' : 'none'
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* CALENDAR GRID - ✅ FIXED: width 100%                              */}
      {/* ================================================================== */}
      <div style={{ display: 'flex', width: '100%' }}>
        {weekDates.map((date, index) => renderDayCell(date, index))}
      </div>

      {/* ================================================================== */}
      {/* LEGEND                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-xs) var(--space-lg)',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)',
        flexWrap: 'wrap'
      }}>
        {[
          { icon: CheckSquare, label: 'Task' },
          { icon: MessageSquare, label: 'RFI' },
          { icon: ClipboardList, label: 'Submittal' },
          { icon: Flag, label: 'Milestone' },
          { icon: Play, label: 'Online' },
          { icon: Truck, label: 'Delivery' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon size={10} style={{ color: projectColor }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* ITEM POPOVER                                                      */}
      {/* ================================================================== */}
      {selectedItem && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={closePopover}
          />
          <div style={{
            position: 'fixed',
            top: popoverPosition.top,
            left: popoverPosition.left,
            width: '280px',
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
              background: `${projectColor}15`
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-xs)',
                  marginBottom: '4px'
                }}>
                  {React.createElement(getItemIcon(selectedItem.type), { 
                    size: 14, 
                    style: { color: projectColor }
                  })}
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: projectColor,
                    textTransform: 'uppercase'
                  }}>
                    {selectedItem.type}
                  </span>
                </div>
                <h4 style={{
                  fontSize: '0.875rem',
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
                  display: 'flex'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Popover Content */}
            <div style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Due Date</span>
                  <span style={{
                    fontSize: '0.8125rem',
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
              </div>
            </div>

            {/* Popover Actions */}
            <div style={{
              padding: 'var(--space-md)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: 'var(--space-sm)'
            }}>
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
                  background: `linear-gradient(135deg, ${projectColor}, ${projectColor}dd)`,
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

export default ProjectCalendarWeek;