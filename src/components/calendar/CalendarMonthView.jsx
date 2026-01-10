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
  ExternalLink,
  Filter
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
  CALENDAR_ITEM_TYPES
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

function CalendarMonthView({ 
  items = [], 
  projects = [],
  onItemClick,
  onDateClick,
  onViewChange,
  initialDate = new Date()
}) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [monthDates, setMonthDates] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  
  // Filters
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const dates = getMonthDates(currentDate);
    setMonthDates(dates);
  }, [currentDate]);

  useEffect(() => {
    // Apply filters
    let filteredItems = [...items];
    
    if (filterProject !== 'all') {
      filteredItems = filteredItems.filter(item => item.projectId === filterProject);
    }
    
    if (filterType !== 'all') {
      filteredItems = filteredItems.filter(item => item.type === filterType);
    }
    
    setGroupedItems(groupItemsByDate(filteredItems));
  }, [items, filterProject, filterType]);

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
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
    const popoverWidth = 320;
    const popoverHeight = 280;
    
    let left = rect.left;
    let top = rect.bottom + 8;
    
    // Adjust horizontal position
    if (left + popoverWidth > viewportWidth - 20) {
      left = viewportWidth - popoverWidth - 20;
    }
    
    // Adjust vertical position if needed
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

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Get weeks for grid
  const weeks = [];
  for (let i = 0; i < monthDates.length; i += 7) {
    weeks.push(monthDates.slice(i, i + 7));
  }

  const renderDayCell = (date, dayIndex) => {
    const dateKey = formatDateKey(date);
    const dayItems = groupedItems[dateKey] || [];
    const today = isToday(date);
    const weekend = isWeekend(date);
    const currentMonth = isCurrentMonth(date);
    const maxVisible = 4;
    const hasMore = dayItems.length > maxVisible;

    return (
      <div
        key={dateKey}
        onClick={() => onDateClick && onDateClick(date)}
        style={{
          flex: weekend ? '0.6' : '1',
          minWidth: 120,
          minHeight: '140px',
          padding: 'var(--space-xs) var(--space-sm)',
          background: today 
            ? 'rgba(255, 107, 53, 0.08)' 
            : weekend 
              ? 'rgba(0, 0, 0, 0.02)' 
              : 'transparent',
          borderRight: dayIndex < 6 ? '1px solid var(--border-color)' : 'none',
          borderBottom: '1px solid var(--border-color)',
          cursor: onDateClick ? 'pointer' : 'default',
          transition: 'background 0.15s',
          opacity: currentMonth ? 1 : 0.4,
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseOver={(e) => {
          if (!today) e.currentTarget.style.background = 'var(--bg-tertiary)';
        }}
        onMouseOut={(e) => {
          if (!today) {
            e.currentTarget.style.background = weekend ? 'rgba(0, 0, 0, 0.02)' : 'transparent';
          }
        }}
      >
        {/* Day Number */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          marginBottom: '6px'
        }}>
          <span style={{ 
            fontSize: weekend ? '0.8125rem' : '0.9375rem', 
            fontWeight: today ? '700' : '600',
            color: today ? 'white' : currentMonth ? 'var(--text-primary)' : 'var(--text-tertiary)',
            width: today ? '28px' : 'auto',
            height: today ? '28px' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: today ? 'var(--sunbelt-orange)' : 'transparent',
            padding: today ? '0' : '2px 4px'
          }}>
            {date.getDate()}
          </span>
        </div>

        {/* Items */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          flex: 1,
          overflow: 'hidden'
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
                  padding: '4px 6px',
                  background: isOverdue ? 'var(--danger-light)' : `${item.color}20`,
                  borderLeft: `3px solid ${isOverdue ? 'var(--danger)' : item.color}`,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => {
                  e.stopPropagation();
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <Icon 
                  size={12} 
                  style={{ 
                    color: isOverdue ? 'var(--danger)' : item.color,
                    flexShrink: 0
                  }} 
                />
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  color: isOverdue ? 'var(--danger)' : 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2
                }}>
                  {item.title}
                </span>
              </div>
            );
          })}

          {hasMore && (
            <div 
              style={{
                fontSize: '0.7rem',
                color: 'var(--sunbelt-orange)',
                padding: '2px 6px',
                cursor: 'pointer',
                fontWeight: '600',
                textAlign: 'center'
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
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '700px'
    }}>
      {/* Header */}
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
          <Calendar size={24} style={{ color: 'var(--sunbelt-orange)' }} />
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0 
          }}>
            {getMonthText(currentDate)}
          </h2>
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
              background: showFilters ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-primary)',
              border: `1px solid ${showFilters ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-sm)',
              color: showFilters ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <Filter size={16} />
            Filters
            {(filterProject !== 'all' || filterType !== 'all') && (
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--sunbelt-orange)'
              }} />
            )}
          </button>

          {/* Today Button */}
          <button
            onClick={goToToday}
            style={{
              padding: '8px 14px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
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
              onClick={() => navigateMonth(-1)}
              style={{
                padding: '8px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                transition: 'all 0.15s'
              }}
            >
              <ChevronLeft size={20} />
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
                display: 'flex',
                transition: 'all 0.15s'
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* View Toggle */}
          {onViewChange && (
            <select
              onChange={(e) => onViewChange(e.target.value)}
              defaultValue="month"
              style={{
                padding: '8px 14px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
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

      {/* Filters Row */}
      {showFilters && (
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Project Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Project:
            </label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Type:
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="all">All Types</option>
              <option value={CALENDAR_ITEM_TYPES.TASK}>Tasks</option>
              <option value={CALENDAR_ITEM_TYPES.RFI}>RFIs</option>
              <option value={CALENDAR_ITEM_TYPES.SUBMITTAL}>Submittals</option>
              <option value={CALENDAR_ITEM_TYPES.MILESTONE}>Milestones</option>
              <option value={CALENDAR_ITEM_TYPES.ONLINE_DATE}>Online Dates</option>
              <option value={CALENDAR_ITEM_TYPES.OFFLINE_DATE}>Offline Dates</option>
              <option value={CALENDAR_ITEM_TYPES.DELIVERY_DATE}>Delivery Dates</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(filterProject !== 'all' || filterType !== 'all') && (
            <button
              onClick={() => {
                setFilterProject('all');
                setFilterType('all');
              }}
              style={{
                padding: '6px 12px',
                background: 'none',
                border: 'none',
                color: 'var(--sunbelt-orange)',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

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
                flex: isWeekendDay ? '0.6' : '1',
                padding: 'var(--space-sm) var(--space-md)',
                textAlign: 'center',
                fontSize: '0.8125rem',
                fontWeight: '700',
                color: isWeekendDay ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderRight: index < 6 ? '1px solid var(--border-color)' : 'none'
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {weeks.map((week, weekIndex) => (
          <div 
            key={weekIndex}
            style={{
              display: 'flex',
              minHeight: '140px'
            }}
          >
            {week.map((date, dayIndex) => renderDayCell(date, dayIndex))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        padding: 'var(--space-md) var(--space-lg)',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>
          Projects:
        </span>
        {projects.slice(0, 8).map((project) => (
          <div 
            key={project.id} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              cursor: 'pointer',
              opacity: filterProject === 'all' || filterProject === project.id ? 1 : 0.4,
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s'
            }}
            onClick={() => setFilterProject(filterProject === project.id ? 'all' : project.id)}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              background: project.color
            }} />
            <span style={{ 
              fontSize: '0.8125rem', 
              color: 'var(--text-secondary)',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: '500'
            }}>
              {project.name}
            </span>
          </div>
        ))}
        {projects.length > 8 && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            +{projects.length - 8} more
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

export default CalendarMonthView;