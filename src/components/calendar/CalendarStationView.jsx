import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Filter,
  MapPin,
  Package,
  AlertTriangle,
  Truck,
  RefreshCw,
  ChevronDown,
  X,
  Flame
} from 'lucide-react';
import StationLane from './StationLane';
import ModuleCardTooltip from './ModuleCardTooltip';

// Default station configuration
const DEFAULT_STATIONS = [
  { id: 'framing', name: 'Framing Station', color: '#3B82F6', capacity: 4, order: 1 },
  { id: 'electrical', name: 'Electrical Station', color: '#F59E0B', capacity: 3, order: 2 },
  { id: 'plumbing', name: 'Plumbing Station', color: '#06B6D4', capacity: 3, order: 3 },
  { id: 'hvac', name: 'HVAC Station', color: '#8B5CF6', capacity: 2, order: 4 },
  { id: 'insulation', name: 'Insulation Station', color: '#10B981', capacity: 4, order: 5 },
  { id: 'drywall', name: 'Drywall Station', color: '#EC4899', capacity: 4, order: 6 },
  { id: 'finish', name: 'Finish Station', color: '#6366F1', capacity: 3, order: 7 }
];

/**
 * CalendarStationView - Station/Resource view showing modules grouped by station
 *
 * @param {Array} modules - Array of module objects to display
 * @param {Array} stations - Array of station configurations
 * @param {function} onModuleClick - Handler for module click
 * @param {function} onModuleMove - Handler for module station change
 * @param {function} onViewChange - Handler for view change
 * @param {boolean} canEdit - Whether editing is allowed
 */
function CalendarStationView({
  modules = [],
  stations = DEFAULT_STATIONS,
  onModuleClick,
  onModuleMove,
  onViewChange,
  canEdit = true
}) {
  // State
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showRushOnly, setShowRushOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [collapsedStations, setCollapsedStations] = useState({});
  const [hoveredModule, setHoveredModule] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Get unique projects from modules
  const projects = useMemo(() => {
    const projectMap = new Map();
    modules.forEach((module) => {
      const projectId = module.project_id || module.project?.id;
      const projectName = module.project?.name || module.project_name;
      if (projectId && projectName) {
        projectMap.set(projectId, {
          id: projectId,
          name: projectName,
          number: module.project?.project_number || module.project_number
        });
      }
    });
    return Array.from(projectMap.values());
  }, [modules]);

  // Filter modules
  const filteredModules = useMemo(() => {
    let filtered = [...modules];

    if (filterProject !== 'all') {
      filtered = filtered.filter((m) => (m.project_id || m.project?.id) === filterProject);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }

    if (showRushOnly) {
      filtered = filtered.filter((m) => m.is_rush);
    }

    return filtered;
  }, [modules, filterProject, filterStatus, showRushOnly]);

  // Group modules by station
  const modulesByStation = useMemo(() => {
    const grouped = {};

    // Initialize all stations
    stations.forEach((station) => {
      grouped[station.id] = [];
    });

    // Add special groups
    grouped['qc_hold'] = [];
    grouped['staged'] = [];
    grouped['unassigned'] = [];

    // Distribute modules
    filteredModules.forEach((module) => {
      const stationId = module.current_station_id;
      const status = module.status;

      if (status === 'QC Hold' || status === 'Rework') {
        grouped['qc_hold'].push(module);
      } else if (status === 'Staged' || status === 'Completed') {
        grouped['staged'].push(module);
      } else if (stationId && grouped[stationId]) {
        grouped[stationId].push(module);
      } else {
        grouped['unassigned'].push(module);
      }
    });

    return grouped;
  }, [filteredModules, stations]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      total: filteredModules.length,
      rush: filteredModules.filter((m) => m.is_rush).length,
      qcHold: modulesByStation['qc_hold']?.length || 0,
      staged: modulesByStation['staged']?.length || 0
    };
  }, [filteredModules, modulesByStation]);

  // Toggle station collapse
  const toggleStationCollapse = (stationId) => {
    setCollapsedStations((prev) => ({
      ...prev,
      [stationId]: !prev[stationId]
    }));
  };

  // Handle module drop on station
  const handleModuleDrop = (moduleId, targetStation, moduleData) => {
    if (onModuleMove && canEdit) {
      onModuleMove(moduleId, targetStation.id, moduleData);
    }
  };

  // Tooltip handlers
  const handleModuleMouseEnter = (module, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top,
      left: Math.min(rect.right + 8, window.innerWidth - 300)
    });
    setHoveredModule(module);
  };

  const handleModuleMouseLeave = () => {
    setHoveredModule(null);
  };

  // Clear filters
  const clearFilters = () => {
    setFilterProject('all');
    setFilterStatus('all');
    setShowRushOnly(false);
  };

  const hasActiveFilters = filterProject !== 'all' || filterStatus !== 'all' || showRushOnly;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <MapPin size={24} style={{ color: 'var(--sunbelt-orange)' }} />
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0
            }}
          >
            Station View
          </h2>
          <span
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}
          >
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {/* Stats */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              marginRight: 'var(--space-md)'
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}
            >
              <Package size={14} />
              <strong>{totals.total}</strong> modules
            </span>
            {totals.rush > 0 && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--danger)'
                }}
              >
                <Flame size={14} />
                <strong>{totals.rush}</strong> rush
              </span>
            )}
            {totals.qcHold > 0 && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--warning)'
                }}
              >
                <AlertTriangle size={14} />
                <strong>{totals.qcHold}</strong> QC hold
              </span>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: hasActiveFilters ? 'rgba(255, 107, 53, 0.15)' : 'var(--bg-tertiary)',
              border: hasActiveFilters
                ? '1px solid rgba(255, 107, 53, 0.3)'
                : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: '500',
              color: hasActiveFilters ? 'var(--sunbelt-orange)' : 'var(--text-secondary)'
            }}
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--sunbelt-orange)'
                }}
              />
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: 'var(--text-tertiary)'
              }}
            >
              <X size={14} />
              Clear
            </button>
          )}

          {/* View Switcher */}
          {onViewChange && (
            <select
              onChange={(e) => onViewChange(e.target.value)}
              defaultValue="station"
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
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
              <option value="timeline">Timeline</option>
              <option value="station">Station</option>
            </select>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            flexWrap: 'wrap'
          }}
        >
          {/* Project Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--text-tertiary)'
              }}
            >
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
                fontSize: '0.8125rem',
                cursor: 'pointer',
                minWidth: '160px'
              }}
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.number} - {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--text-tertiary)'
              }}
            >
              Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                minWidth: '140px'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Queue">In Queue</option>
              <option value="In Progress">In Progress</option>
              <option value="QC Hold">QC Hold</option>
              <option value="Rework">Rework</option>
              <option value="Completed">Completed</option>
              <option value="Staged">Staged</option>
            </select>
          </div>

          {/* Rush Only Toggle */}
          <button
            onClick={() => setShowRushOnly(!showRushOnly)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: showRushOnly ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-primary)',
              border: showRushOnly
                ? '1px solid var(--danger)'
                : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: showRushOnly ? 'var(--danger)' : 'var(--text-secondary)'
            }}
          >
            <Flame size={14} />
            Rush Only
          </button>
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)'
        }}
      >
        {/* Production Stations */}
        {stations
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((station) => (
            <StationLane
              key={station.id}
              station={station}
              modules={modulesByStation[station.id] || []}
              capacity={station.capacity || 4}
              canEdit={canEdit}
              onModuleClick={onModuleClick}
              onModuleDrop={handleModuleDrop}
              onModuleMouseEnter={handleModuleMouseEnter}
              onModuleMouseLeave={handleModuleMouseLeave}
              collapsed={collapsedStations[station.id]}
              onToggleCollapse={() => toggleStationCollapse(station.id)}
            />
          ))}

        {/* QC Hold Section */}
        {modulesByStation['qc_hold']?.length > 0 && (
          <StationLane
            station={{
              id: 'qc_hold',
              name: 'QC Hold / Rework',
              color: 'var(--warning)'
            }}
            modules={modulesByStation['qc_hold']}
            capacity={99}
            canEdit={canEdit}
            onModuleClick={onModuleClick}
            onModuleDrop={handleModuleDrop}
            onModuleMouseEnter={handleModuleMouseEnter}
            onModuleMouseLeave={handleModuleMouseLeave}
            collapsed={collapsedStations['qc_hold']}
            onToggleCollapse={() => toggleStationCollapse('qc_hold')}
          />
        )}

        {/* Staging Area */}
        {modulesByStation['staged']?.length > 0 && (
          <StationLane
            station={{
              id: 'staged',
              name: 'Staging Area',
              color: 'var(--success)'
            }}
            modules={modulesByStation['staged']}
            capacity={99}
            canEdit={canEdit}
            onModuleClick={onModuleClick}
            onModuleDrop={handleModuleDrop}
            onModuleMouseEnter={handleModuleMouseEnter}
            onModuleMouseLeave={handleModuleMouseLeave}
            collapsed={collapsedStations['staged']}
            onToggleCollapse={() => toggleStationCollapse('staged')}
          />
        )}

        {/* Unassigned Modules */}
        {modulesByStation['unassigned']?.length > 0 && (
          <StationLane
            station={{
              id: 'unassigned',
              name: 'Unassigned Modules',
              color: 'var(--text-tertiary)'
            }}
            modules={modulesByStation['unassigned']}
            capacity={99}
            canEdit={canEdit}
            onModuleClick={onModuleClick}
            onModuleDrop={handleModuleDrop}
            onModuleMouseEnter={handleModuleMouseEnter}
            onModuleMouseLeave={handleModuleMouseLeave}
            collapsed={collapsedStations['unassigned']}
            onToggleCollapse={() => toggleStationCollapse('unassigned')}
          />
        )}

        {/* Empty State */}
        {filteredModules.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-xl)',
              color: 'var(--text-tertiary)',
              textAlign: 'center'
            }}
          >
            <Package size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                margin: '0 0 8px 0'
              }}
            >
              No Modules Found
            </h3>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              {hasActiveFilters
                ? 'Try adjusting your filters to see more modules.'
                : 'No modules are currently scheduled.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  marginTop: 'var(--space-md)',
                  padding: '8px 16px',
                  background: 'var(--sunbelt-orange)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
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

export default CalendarStationView;
