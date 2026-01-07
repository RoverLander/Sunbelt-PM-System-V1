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
  Filter,
  Clock,
  AlertTriangle
} from 'lucide-react';
import {
  formatDateKey,
  formatDisplayDate,
  isToday,
  isPast,
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

function CalendarDayView({ 
  items = [], 
  projects = [],
  onItemClick,
  onViewChange,
  initialDate = new Date()
}) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [dayItems, setDayItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Filters
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Get items for current day
    const dateKey = formatDateKey(currentDate);
    const grouped = groupItemsByDate(items);
    let filteredItems = grouped[dateKey] || [];
    
    // Apply filters
    if (filterProject !== 'all') {
      filteredItems = filteredItems.filter(item => item.projectId === filterProject);
    }
    
    if (filterType !== 'all') {
      filteredItems = filteredItems.filter(item => item.type === filterType);
    }
    
    setDayItems(filteredItems);
  }, [items, currentDate, filterProject, filterType]);

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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

  const today = isToday(currentDate);
  const dateKey = formatDateKey(currentDate);

  // Group items by type for organized display
  const groupedByType = {
    project_dates: dayItems.filter(i => ['online_date', 'offline_date', 'delivery_date'].includes(i.type)),
    milestones: dayItems.filter(i => i.type === 'milestone'),
    tasks: dayItems.filter(i => i.type === 'task'),
    rfis: dayItems.filter(i => i.type === 'rfi'),
    submittals: dayItems.filter(i => i.type === 'submittal')
  };

  const renderItemCard = (item) => {
    const Icon = getItemIcon(item.type);
    const isOverdue = isPast(item.date) && 
      !['Completed', 'Cancelled', 'Closed', 'Approved', 'Approved as Noted'].includes(item.status);
    const config = ITEM_TYPE_CONFIG[item.type];

    return (
      <div
        key={item.id}
        onClick={() => setSelectedItem(item)}
        style={{
          padding: 'var(--space-md)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border-color)'}`,
          borderLeft: `4px solid ${isOverdue ? 'var(--danger)' : item.color}`,
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateX(4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Type Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                background: `${item.color}20`,
                borderRadius: '10px'
              }}>
                <Icon size={12} style={{ color: item.color }} />
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  color: item.color,
                  textTransform: 'uppercase'
                }}>
                  {config?.label || item.type}
                </span>
              </div>
              
              {isOverdue && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: 'var(--danger-light)',
                  borderRadius: '10px'
                }}>
                  <AlertTriangle size={12} style={{ color: 'var(--danger)' }} />
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: 'var(--danger)'
                  }}>
                    OVERDUE
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-xs) 0',
              lineHeight: 1.3
            }}>
              {item.title}
            </h4>

            {/* Project */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-xs)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '2px',
                background: item.color
              }} />
              <span style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)'
              }}>
                {item.projectName}
                {item.projectNumber && (
                  <span style={{ color: 'var(--text-tertiary)' }}> • {item.projectNumber}</span>
                )}
              </span>
            </div>

            {/* Additional Details */}
            {item.data && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                {item.type === 'task' && item.data.assignee?.name && (
                  <span>Assigned to: {item.data.assignee.name}</span>
                )}
                {item.type === 'rfi' && item.data.sent_to && (
                  <span>Sent to: {item.data.sent_to}</span>
                )}
                {item.type === 'submittal' && item.data.submittal_type && (
                  <span>Type: {item.data.submittal_type}</span>
                )}
              </div>
            )}
          </div>

          {/* Status Badge */}
          {item.status && (
            <span style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: `${getStatusColor(item.status)}20`,
              color: getStatusColor(item.status),
              whiteSpace: 'nowrap'
            }}>
              {item.status}
            </span>
          )}
        </div>

        {/* Action Hint */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 'var(--space-sm)',
          paddingTop: 'var(--space-sm)',
          borderTop: '1px solid var(--border-color)'
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            Click to view details
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    );
  };

  const renderSection = (title, items, icon) => {
    if (items.length === 0) return null;
    
    const Icon = icon;
    
    return (
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-md)'
        }}>
          <Icon size={18} style={{ color: 'var(--sunbelt-orange)' }} />
          <h3 style={{
            fontSize: '0.9375rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {title}
          </h3>
          <span style={{
            padding: '2px 8px',
            background: 'var(--bg-tertiary)',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--text-secondary)'
          }}>
            {items.length}
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {items.map(item => renderItemCard(item))}
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
      height: '100%'
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
          <div>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              margin: 0 
            }}>
              {formatDisplayDate(currentDate, 'long')}
            </h2>
            {today && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--sunbelt-orange)'
              }}>
                Today
              </span>
            )}
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
              padding: '6px 12px',
              background: showFilters ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-primary)',
              border: `1px solid ${showFilters ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-sm)',
              color: showFilters ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
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
              onClick={() => navigateDay(-1)}
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
              onClick={() => navigateDay(1)}
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
              defaultValue="day"
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

      {/* Filters Row */}
      {showFilters && (
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
          flexWrap: 'wrap'
        }}>
          {/* Project Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Project:
            </label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              style={{
                padding: '4px 8px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                minWidth: '150px'
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
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Type:
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '4px 8px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                minWidth: '150px'
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
                padding: '4px 8px',
                background: 'none',
                border: 'none',
                color: 'var(--sunbelt-orange)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Summary Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        padding: 'var(--space-sm) var(--space-lg)',
        borderBottom: '1px solid var(--border-color)',
        background: today ? 'rgba(255, 107, 53, 0.05)' : 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <Clock size={16} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{dayItems.length}</strong> items scheduled
          </span>
        </div>
        
        {dayItems.filter(i => isPast(i.date) && !['Completed', 'Cancelled', 'Closed', 'Approved'].includes(i.status)).length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>
              <strong>{dayItems.filter(i => isPast(i.date) && !['Completed', 'Cancelled', 'Closed', 'Approved'].includes(i.status)).length}</strong> overdue
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-lg)' }}>
        {dayItems.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-2xl)',
            color: 'var(--text-tertiary)'
          }}>
            <Calendar size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
              No items scheduled
            </h3>
            <p style={{ fontSize: '0.875rem' }}>
              {today ? "You're all clear for today!" : "Nothing due on this day."}
            </p>
          </div>
        ) : (
          <>
            {renderSection('Project Dates', groupedByType.project_dates, Play)}
            {renderSection('Milestones', groupedByType.milestones, Flag)}
            {renderSection('Tasks', groupedByType.tasks, CheckSquare)}
            {renderSection('RFIs', groupedByType.rfis, MessageSquare)}
            {renderSection('Submittals', groupedByType.submittals, ClipboardList)}
          </>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: 'var(--space-lg)',
              borderBottom: '1px solid var(--border-color)',
              background: `${selectedItem.color}10`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                  {React.createElement(getItemIcon(selectedItem.type), {
                    size: 20,
                    style: { color: selectedItem.color }
                  })}
                  <span style={{
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: selectedItem.color,
                    textTransform: 'uppercase'
                  }}>
                    {ITEM_TYPE_CONFIG[selectedItem.type]?.label || selectedItem.type}
                  </span>
                </div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700', 
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.3
                }}>
                  {selectedItem.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {/* Project */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-md)',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    background: selectedItem.color
                  }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Project</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {selectedItem.projectName}
                    </div>
                  </div>
                </div>

                {/* Status & Date Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  {selectedItem.status && (
                    <div style={{
                      padding: 'var(--space-md)',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Status</div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        background: `${getStatusColor(selectedItem.status)}20`,
                        color: getStatusColor(selectedItem.status)
                      }}>
                        {selectedItem.status}
                      </span>
                    </div>
                  )}
                  
                  <div style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Due Date</div>
                    <div style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: '600',
                      color: isPast(selectedItem.date) && 
                        !['Completed', 'Cancelled', 'Closed', 'Approved'].includes(selectedItem.status)
                          ? 'var(--danger)' 
                          : 'var(--text-primary)'
                    }}>
                      {formatDisplayDate(selectedItem.date, 'short')}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {selectedItem.data && (
                  <div style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>
                      Details
                    </div>
                    
                    {selectedItem.type === 'task' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        {selectedItem.data.assignee?.name && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <strong>Assigned to:</strong> {selectedItem.data.assignee.name}
                          </div>
                        )}
                        {selectedItem.data.priority && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <strong>Priority:</strong> {selectedItem.data.priority}
                          </div>
                        )}
                        {selectedItem.data.description && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                            {selectedItem.data.description}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedItem.type === 'rfi' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        {selectedItem.data.sent_to && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <strong>Sent to:</strong> {selectedItem.data.sent_to}
                          </div>
                        )}
                        {selectedItem.data.question && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                            {selectedItem.data.question}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedItem.type === 'submittal' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        {selectedItem.data.submittal_type && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <strong>Type:</strong> {selectedItem.data.submittal_type}
                          </div>
                        )}
                        {selectedItem.data.sent_to && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <strong>Sent to:</strong> {selectedItem.data.sent_to}
                          </div>
                        )}
                        {selectedItem.data.manufacturer && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <strong>Manufacturer:</strong> {selectedItem.data.manufacturer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: 'var(--space-lg)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: 'var(--space-sm)',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  padding: 'var(--space-sm) var(--space-lg)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  onItemClick && onItemClick(selectedItem);
                  setSelectedItem(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  padding: 'var(--space-sm) var(--space-lg)',
                  background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Edit size={16} />
                Edit Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarDayView;