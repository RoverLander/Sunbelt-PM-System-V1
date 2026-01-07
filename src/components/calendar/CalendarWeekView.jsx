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
  Edit,
  ExternalLink
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

// Icon mapping
const ICON_MAP = {
  CheckSquare,
  MessageSquare,
  ClipboardList,
  Flag,
  Play,
  Square,
  Truck
};

function CalendarWeekView({ 
  items = [], 
  projects = [],
  onItemClick,
  onDateClick,
  onViewChange,
  compact = false 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const dates = getWeekDates(currentDate);
    setWeekDates(dates);
  }, [currentDate]);

  useEffect(() => {
    setGroupedItems(groupItemsByDate(items));
  }, [items]);

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
    const popoverWidth = 320;
    
    let left = rect.left;
    if (left + popoverWidth > viewportWidth - 20) {
      left = viewportWidth - popoverWidth - 20;
    }
    
    setPopoverPosition({
      top: rect.bottom + 8,
      left: Math.max(20, left)
    });
    setSelectedItem(item);
  };

  const closePopover = () => {
    setSelectedItem(null);
  };

  const getItemIcon = (type) => {
    const config = ITEM_TYPE_CONFIG[type];
    if (!config) return CheckSquare;
    return ICON_MAP[config.icon] || CheckSquare;
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
    const maxVisible = compact ? 2 : weekend ? 3 : 6;
    const hasMore = dayItems.length > maxVisible;

    return (
      <div
        key={dateKey}
        onClick={() => onDateClick && onDateClick(date)}
        style={{
          flex: weekend ? '0.5' : '1',
          minWidth: 0,
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
          borderBottom: '1px solid var(--border-color)'
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
            color: today ? 'var(--sunbelt-orange)' : 'var(--text-primary)',
            width: weekend ? '28px' : '36px',
            height: weekend ? '28px' : '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: today ? 'var(--sunbelt-orange)' : 'transparent',
            ...(today && { color: 'white' })
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
                  background: `${item.color}20`,
                  borderLeft: `3px solid ${item.color}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  ...(isOverdue && {
                    borderColor: 'var(--danger)',
                    background: 'var(--danger-light)'
                  })
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
                <span style={{
                  fontSize: weekend ? '0.65rem' : '0.75rem',
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
              fontSize: weekend ? '0.6rem' : '0.7rem',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              padding: '2px',
              cursor: 'pointer',
              fontWeight: '600'
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
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
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
          {/* Today Button */}
          <button
            onClick={goToToday}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s'
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

      {/* Calendar Grid */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {weekDates.map((date, index) => renderDayCell(date, index))}
      </div>

      {/* Legend */}
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

      {/* Item Popover */}
      {selectedItem && (
        <>
          {/* Backdrop */}
          <div
            onClick={closePopover}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
          
          {/* Popover */}
          <div
            style={{
              position: 'fixed',
              top: popoverPosition.top,
              left: popoverPosition.left,
              width: '320px',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            {/* Popover Header */}
            <div style={{
              padding: 'var(--space-md)',
              borderBottom: '1px solid var(--border-color)',
              background: `${selectedItem.color}15`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
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
                    {ITEM_TYPE_CONFIG[selectedItem.type]?.label || selectedItem.type}
                  </span>
                </div>
                <h4 style={{ 
                  fontSize: '0.9375rem', 
                  fontWeight: '600', 
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
                <X size={18} />
              </button>
            </div>

            {/* Popover Content */}
            <div style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Project</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                    {selectedItem.projectName}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
              <button
                onClick={() => {
                  closePopover();
                }}
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
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CalendarWeekView;