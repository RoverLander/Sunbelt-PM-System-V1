// ============================================================================
// ProjectCalendarMonth.jsx
// ============================================================================
// Month view calendar for a single project showing tasks, RFIs, submittals,
// milestones, and key project dates.
//
// FEATURES:
// - Fixed width columns that don't shift based on content
// - Text truncation for long item names
// - Export Month to Outlook button
// - Filter by item type
// - Item popover on click
//
// FIXES (Jan 9, 2026):
// - ✅ FIXED: Day cells now have fixed width (won't grow/shrink with content)
// - ✅ FIXED: Text items truncate with ellipsis
// - ✅ ADDED: Export Month to Outlook button
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
  Filter,
  Download
} from 'lucide-react';
import {
  getMonthDates,
  formatDateKey,
  formatDisplayDate,
  getMonthText,
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
function ProjectCalendarMonth({ 
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
  const [monthDates, setMonthDates] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

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
    setMonthDates(getMonthDates(currentDate));
  }, [currentDate]);

  useEffect(() => {
    let filtered = [...calendarItems];
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }
    setGroupedItems(groupItemsByDate(filtered));
  }, [calendarItems, filterType]);

  // ==========================================================================
  // COMPUTED: Items for current month (for export)
  // ==========================================================================
  const monthItems = useMemo(() => {
    if (monthDates.length === 0) return [];
    
    const startDate = monthDates[0];
    const endDate = monthDates[monthDates.length - 1];
    
    return calendarItems.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [monthDates, calendarItems]);

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  // ==========================================================================
  // EXPORT TO OUTLOOK
  // ==========================================================================
  const handleExportMonth = () => {
    if (monthItems.length === 0) {
      alert('No items to export for this month.');
      return;
    }

    const events = monthItems.map(item => {
      const typeLabel = item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'Item';
      return createICSEvent({
        title: `[${project?.project_number || 'Project'}] ${item.title}`,
        description: `Status: ${item.status || 'N/A'}\\nType: ${typeLabel}`,
        startDate: item.date,
        category: typeLabel
      });
    });

    const monthName = getMonthText(currentDate);
    const calendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sunbelt Modular//PM System//EN',
      `X-WR-CALNAME:${project?.project_number || 'Project'} - ${monthName}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');

    const filename = `${project?.project_number || 'Project'}_${monthName.replace(' ', '_')}.ics`;
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
    
    let left = rect.left;
    let top = rect.bottom + 8;
    
    if (left + 300 > viewportWidth - 20) left = viewportWidth - 320;
    if (top + 250 > viewportHeight - 20) top = rect.top - 258;
    
    setPopoverPosition({ top: Math.max(20, top), left: Math.max(20, left) });
    setSelectedItem(item);
  };

  const closePopover = () => setSelectedItem(null);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getItemIcon = (type) => ICON_MAP[ITEM_TYPE_CONFIG[type]?.icon] || CheckSquare;

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'var(--text-tertiary)', 'In Progress': 'var(--sunbelt-orange)',
      'Awaiting Response': 'var(--warning)', 'Completed': 'var(--success)', 'Cancelled': 'var(--text-tertiary)',
      'Open': 'var(--sunbelt-orange)', 'Answered': 'var(--success)', 'Closed': 'var(--text-tertiary)',
      'Pending': 'var(--text-tertiary)', 'Submitted': 'var(--sunbelt-orange)',
      'Under Review': 'var(--warning)', 'Approved': 'var(--success)', 'Rejected': 'var(--danger)',
      'Approved as Noted': 'var(--info)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  const isCurrentMonth = (date) => date.getMonth() === currentDate.getMonth();

  // Build weeks array
  const weeks = [];
  for (let i = 0; i < monthDates.length; i += 7) {
    weeks.push(monthDates.slice(i, i + 7));
  }

  // Type counts for filter badges
  const typeCounts = {
    task: calendarItems.filter(i => i.type === 'task').length,
    rfi: calendarItems.filter(i => i.type === 'rfi').length,
    submittal: calendarItems.filter(i => i.type === 'submittal').length,
    milestone: calendarItems.filter(i => i.type === 'milestone').length,
  };

  // ==========================================================================
  // RENDER: Day Cell
  // ==========================================================================
  const renderDayCell = (date, dayIndex) => {
    const dateKey = formatDateKey(date);
    const dayItems = groupedItems[dateKey] || [];
    const today = isToday(date);
    const weekend = isWeekend(date);
    const currentMonth = isCurrentMonth(date);
    const maxVisible = 3;
    const hasMore = dayItems.length > maxVisible;

    return (
      <div
        key={dateKey}
        style={{
          // ✅ FIXED: Use flex-basis 0 to ensure equal distribution
          flex: weekend ? '0.6 1 0' : '1 1 0',
          // ✅ FIXED: Set minimum width so cells don't collapse
          minWidth: weekend ? '60px' : '100px',
          // ✅ FIXED: Overflow hidden to contain content
          overflow: 'hidden',
          minHeight: '100px',
          padding: 'var(--space-xs)',
          background: today ? `${projectColor}15` : weekend ? 'rgba(0,0,0,0.02)' : 'transparent',
          borderRight: dayIndex < 6 ? '1px solid var(--border-color)' : 'none',
          borderBottom: '1px solid var(--border-color)',
          opacity: currentMonth ? 1 : 0.4,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Day Number */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px', flexShrink: 0 }}>
          <span style={{ 
            fontSize: '0.8125rem', 
            fontWeight: today ? '700' : '600',
            color: today ? 'white' : currentMonth ? 'var(--text-primary)' : 'var(--text-tertiary)',
            width: today ? '24px' : 'auto',
            height: today ? '24px' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: today ? projectColor : 'transparent'
          }}>
            {date.getDate()}
          </span>
        </div>

        {/* Items Container - ✅ FIXED: overflow hidden */}
        <div style={{ 
          flex: 1, 
          overflow: 'hidden',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '2px' 
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
                  gap: '3px',
                  padding: '2px 4px',
                  background: isOverdue ? 'var(--danger-light)' : `${projectColor}20`,
                  borderLeft: `2px solid ${isOverdue ? 'var(--danger)' : projectColor}`,
                  borderRadius: '2px',
                  cursor: 'pointer',
                  // ✅ FIXED: Ensure item doesn't overflow cell
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                <Icon size={10} style={{ color: isOverdue ? 'var(--danger)' : projectColor, flexShrink: 0 }} />
                {/* ✅ FIXED: Text truncates with ellipsis */}
                <span style={{
                  fontSize: '0.65rem',
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
              fontSize: '0.6rem', 
              color: projectColor, 
              textAlign: 'center', 
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
      minHeight: '600px',
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
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: `${projectColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={22} style={{ color: projectColor }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              {getMonthText(currentDate)}
            </h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {calendarItems.length} items scheduled
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: '8px 14px',
              background: showFilters ? `${projectColor}15` : 'var(--bg-primary)',
              border: `1px solid ${showFilters ? projectColor : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-sm)',
              color: showFilters ? projectColor : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: '600'
            }}
          >
            <Filter size={16} />
            Filter
          </button>

          {/* ✅ ADDED: Export to Outlook Button */}
          <button
            onClick={handleExportMonth}
            title="Export month to Outlook"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
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
              padding: '8px 14px',
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
              onClick={() => navigateMonth(-1)}
              style={{
                padding: '8px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              style={{
                padding: '8px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* FILTERS ROW                                                       */}
      {/* ================================================================== */}
      {showFilters && (
        <div style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
          flexWrap: 'wrap'
        }}>
          {[
            { type: 'all', label: 'All', count: calendarItems.length },
            { type: 'task', label: 'Tasks', count: typeCounts.task, icon: CheckSquare },
            { type: 'rfi', label: 'RFIs', count: typeCounts.rfi, icon: MessageSquare },
            { type: 'submittal', label: 'Submittals', count: typeCounts.submittal, icon: ClipboardList },
            { type: 'milestone', label: 'Milestones', count: typeCounts.milestone, icon: Flag },
          ].map(filter => (
            <button
              key={filter.type}
              onClick={() => setFilterType(filter.type)}
              style={{
                padding: '6px 12px',
                background: filterType === filter.type ? projectColor : 'var(--bg-primary)',
                color: filterType === filter.type ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {filter.icon && <filter.icon size={14} />}
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      )}

      {/* ================================================================== */}
      {/* DAY HEADERS                                                       */}
      {/* ================================================================== */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-color)', 
        background: 'var(--bg-tertiary)',
        width: '100%'
      }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
          const isWeekendDay = day === 'Sat' || day === 'Sun';
          return (
            <div key={day} style={{
              flex: isWeekendDay ? '0.6 1 0' : '1 1 0',
              minWidth: isWeekendDay ? '60px' : '100px',
              padding: 'var(--space-sm)',
              textAlign: 'center',
              fontSize: '0.8125rem',
              fontWeight: '700',
              color: isWeekendDay ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              textTransform: 'uppercase',
              borderRight: index < 6 ? '1px solid var(--border-color)' : 'none'
            }}>
              {day}
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* CALENDAR GRID - ✅ FIXED: width 100%                              */}
      {/* ================================================================== */}
      <div style={{ width: '100%' }}>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} style={{ display: 'flex', width: '100%' }}>
            {week.map((date, dayIndex) => renderDayCell(date, dayIndex))}
          </div>
        ))}
      </div>

      {/* ================================================================== */}
      {/* LEGEND                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        padding: 'var(--space-sm) var(--space-lg)',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>Legend:</span>
        {[
          { icon: CheckSquare, label: 'Task' },
          { icon: MessageSquare, label: 'RFI' },
          { icon: ClipboardList, label: 'Submittal' },
          { icon: Flag, label: 'Milestone' },
          { icon: Play, label: 'Online' },
          { icon: Truck, label: 'Delivery' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <item.icon size={12} style={{ color: projectColor }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
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
            width: '300px',
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
                  fontSize: '0.9375rem',
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

export default ProjectCalendarMonth;