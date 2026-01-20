import React, { useState } from 'react';
import { MapPin, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import ModuleCard from './ModuleCard';
import StationCapacityBar from './StationCapacityBar';

/**
 * StationLane - A horizontal lane showing modules at a specific station
 *
 * @param {Object} station - Station data object
 * @param {Array} modules - Array of modules at this station
 * @param {number} capacity - Maximum capacity of the station
 * @param {boolean} canEdit - Whether editing is allowed
 * @param {function} onModuleClick - Handler for module click
 * @param {function} onModuleDrop - Handler for module drop (from drag)
 * @param {function} onModuleMouseEnter - Handler for module mouse enter
 * @param {function} onModuleMouseLeave - Handler for module mouse leave
 * @param {boolean} collapsed - Whether the lane is collapsed
 * @param {function} onToggleCollapse - Handler for collapse toggle
 */
function StationLane({
  station,
  modules = [],
  capacity = 4,
  canEdit = true,
  onModuleClick,
  onModuleDrop,
  onModuleMouseEnter,
  onModuleMouseLeave,
  collapsed = false,
  onToggleCollapse
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    id,
    name = 'Unknown Station',
    color = 'var(--sunbelt-orange)',
    type = 'production'
  } = station || {};

  const emptySlots = Math.max(0, capacity - modules.length);
  const isAtCapacity = modules.length >= capacity;

  // Drag handlers for drop zone
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isAtCapacity && canEdit) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (!isAtCapacity && canEdit) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (isAtCapacity || !canEdit) return;

    const moduleId = e.dataTransfer.getData('moduleId');
    const moduleDataStr = e.dataTransfer.getData('moduleData');

    if (moduleId && onModuleDrop) {
      const moduleData = moduleDataStr ? JSON.parse(moduleDataStr) : null;
      onModuleDrop(moduleId, station, moduleData);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${isDragOver ? color : 'var(--border-color)'}`,
        overflow: 'hidden',
        transition: 'border-color 0.15s ease'
      }}
    >
      {/* Station Header */}
      <div
        onClick={onToggleCollapse}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-sm) var(--space-md)',
          background: 'var(--bg-tertiary)',
          borderBottom: collapsed ? 'none' : '1px solid var(--border-color)',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {/* Collapse Toggle */}
          {onToggleCollapse && (
            collapsed ? (
              <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
            ) : (
              <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
            )
          )}

          {/* Station Icon */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MapPin size={14} style={{ color: color }} />
          </div>

          {/* Station Name */}
          <div>
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0
              }}
            >
              {name}
            </h4>
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-tertiary)'
              }}
            >
              {modules.length} module{modules.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Capacity Bar */}
        <StationCapacityBar
          current={modules.length}
          capacity={capacity}
          color={color}
        />
      </div>

      {/* Module Cards Area */}
      {!collapsed && (
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            minHeight: '100px',
            background: isDragOver ? `${color}10` : 'transparent',
            transition: 'background 0.15s ease'
          }}
        >
          {/* Module Cards */}
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              variant="expanded"
              draggable={canEdit}
              onClick={onModuleClick}
              onMouseEnter={onModuleMouseEnter}
              onMouseLeave={onModuleMouseLeave}
              style={{ flex: '0 0 auto' }}
            />
          ))}

          {/* Empty Slots */}
          {emptySlots > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '160px',
                minHeight: '100px',
                padding: 'var(--space-md)',
                background: isDragOver ? `${color}20` : 'var(--bg-tertiary)',
                border: `2px dashed ${isDragOver ? color : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                color: isDragOver ? color : 'var(--text-tertiary)',
                fontSize: '0.75rem',
                fontWeight: '500',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {isDragOver ? (
                <span>Drop module here</span>
              ) : (
                <span>
                  {emptySlots} empty slot{emptySlots !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {/* Empty State when no modules and no slots shown */}
          {modules.length === 0 && emptySlots === 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-lg)',
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem'
              }}
            >
              No modules at this station
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StationLane;
