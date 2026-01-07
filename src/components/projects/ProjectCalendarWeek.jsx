import React, { useState, useEffect } from 'react';
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
  Edit
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

const ICON_MAP = {
  CheckSquare,
  MessageSquare,
  ClipboardList,
  Flag,
  Play,
  Square,
  Truck
};

function ProjectCalendarWeek({ 
  project,
  tasks = [],
  rfis = [],
  submittals = [],
  milestones = [],
  onItemClick
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  const projectColor = project?.color || getProjectColor(project, 0);

  // Build calendar items
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

  useEffect(() => {
    setWeekDates(getWeekDates(currentDate));
  }, [currentDate]);

  useEffect(() => {
    setGroupedItems(groupItemsByDate(calendarItems));
  }, [calendarItems]);

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

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
          flex: weekend ? '0.5' : '1',
          minWidth: 0,
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
          borderBottom: '1px solid var(--border-color)'
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
            fontSize: weekend ? '0.9rem' : '1.25rem', 
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

        {/* Items */}
        <div style={{ 
          flex: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
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
                  padding: weekend ? '2px 4px' : '4px 6px',
                  background: isOverdue ? 'var(--danger-light)' : `${item.color}20`,
                  borderLeft: `3px solid ${isOverdue ? 'var(--danger)' : item.color}`,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
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
                  size={weekend ? 10 : 12} 
                  style={{ color: isOverdue ? 'var(--danger)' : item.color, flexShrink: 0 }} 
                />
                <span style={{
                  fontSize: weekend ? '0.6rem' : '0.7rem',
                  fontWeight: '500',
                  color: isOverdue ? 'var(--danger)' : 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
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
              padding: '2px',
              fontWeight: '600'
            }}>
              +{dayItems.length - maxVisible} more
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-md) var(--space-lg)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Calendar size={18} style={{ color: projectColor }} />
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0 
          }}>
            {getWeekRangeText(weekDates)}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <button
            onClick={goToToday}
            style={{
              padding: '4px 10px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Today
          </button>
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

      {/* Day Headers */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)'
      }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
          const isWeekendDay = day === 'Sat' || day === 'Sun';
          return (
            <div
              key={day}
              style={{
                flex: isWeekendDay ? '0.5' : '1',
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

      {/* Calendar Grid */}
      <div style={{ display: 'flex' }}>
        {weekDates.map((date, index) => renderDayCell(date, index))}
      </div>

      {/* Legend */}
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
              <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Item Popover */}
      {selectedItem && (
        <>
          <div onClick={closePopover} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} />
          <div style={{
            position: 'fixed',
            top: popoverPosition.top,
            left: popoverPosition.left,
            width: '280px',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: 'var(--space-md)',
              borderBottom: '1px solid var(--border-color)',
              background: `${selectedItem.color}15`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: '4px' }}>
                  {React.createElement(getItemIcon(selectedItem.type), { size: 14, style: { color: selectedItem.color } })}
                  <span style={{ fontSize: '0.7rem', fontWeight: '600', color: selectedItem.color, textTransform: 'uppercase' }}>
                    {ITEM_TYPE_CONFIG[selectedItem.type]?.label || selectedItem.type}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                  {selectedItem.title}
                </h4>
              </div>
              <button onClick={closePopover} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Due Date</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '500', color: isPast(selectedItem.date) && !['Completed', 'Cancelled', 'Closed', 'Approved'].includes(selectedItem.status) ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {formatDisplayDate(selectedItem.date, 'long')}
                </span>
              </div>
              {selectedItem.status && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Status</span>
                  <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600', background: `${getStatusColor(selectedItem.status)}20`, color: getStatusColor(selectedItem.status) }}>
                    {selectedItem.status}
                  </span>
                </div>
              )}
            </div>

            {!['online_date', 'offline_date', 'delivery_date'].includes(selectedItem.type) && (
              <div style={{ padding: 'var(--space-sm) var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => { onItemClick && onItemClick(selectedItem); closePopover(); }}
                  style={{
                    width: '100%',
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
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ProjectCalendarWeek;