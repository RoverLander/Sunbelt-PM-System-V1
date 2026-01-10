import React, { useState, useEffect, useRef } from 'react';
import { Factory, Package, Truck, TrendingUp, AlertCircle, Calendar, User, DollarSign } from 'lucide-react';

/**
 * MapTooltip - Rich tooltips for factories, job sites, and trucks
 */
const MapTooltip = ({ data, type, position, visible, onClose }) => {
  const [show, setShow] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const tooltipRef = useRef(null);

  // Delay showing tooltip to prevent flickering
  useEffect(() => {
    if (visible && data) {
      const timer = setTimeout(() => setShow(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, data]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!tooltipRef.current || !position) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const padding = 20;

    let { x, y } = position;

    // Adjust horizontal position
    if (x + rect.width + padding > window.innerWidth) {
      x = x - rect.width - 20; // Show on left side
    } else {
      x = x + 15; // Show on right side
    }

    // Adjust vertical position
    if (y + rect.height + padding > window.innerHeight) {
      y = window.innerHeight - rect.height - padding;
    }

    setAdjustedPosition({ x: Math.max(padding, x), y: Math.max(padding, y) });
  }, [position, show]);

  if (!show || !data) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-slate-600 overflow-hidden animate-fadeIn"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        maxWidth: '340px'
      }}
      onMouseEnter={(e) => e.stopPropagation()}
    >
      {type === 'factory' && <FactoryTooltipContent data={data} />}
      {type === 'jobsite' && <JobSiteTooltipContent data={data} />}
      {type === 'truck' && <TruckTooltipContent data={data} />}
    </div>
  );
};

/**
 * Factory tooltip content
 */
const FactoryTooltipContent = ({ data }) => {
  const { factoryData, stats = {} } = data;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-700">
        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <Factory className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">{factoryData.code}</h3>
          <p className="text-sm text-slate-400">{factoryData.name}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatBox
          value={stats.activeProjects || 0}
          label="Active Projects"
          color="orange"
          icon={<Package className="w-3.5 h-3.5" />}
        />
        <StatBox
          value={stats.shippingThisWeek || 0}
          label="Shipping"
          color="green"
          icon={<Truck className="w-3.5 h-3.5" />}
        />
      </div>

      {/* In Production list */}
      {stats.inProduction?.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            In Production
          </h4>
          <div className="space-y-1.5">
            {stats.inProduction.slice(0, 3).map((project, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300 truncate flex-1 mr-2">{project.name}</span>
                <span className="text-orange-400 font-mono text-xs">
                  [{project.progress || 0}%]
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent deliveries */}
      {stats.recentDeliveries?.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Recent Deliveries
          </h4>
          <div className="space-y-1">
            {stats.recentDeliveries.slice(0, 2).map((delivery, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300 truncate flex-1 mr-2">{delivery.name}</span>
                <span className="text-green-400 text-xs flex items-center gap-1">
                  <span>✓</span> {formatDate(delivery.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract value */}
      {stats.totalContractValue > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-400 border-t border-slate-700 pt-3 mt-3">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-semibold">
            ${formatCurrency(stats.totalContractValue)}
          </span>
          <span>Active Contract Value</span>
        </div>
      )}

      {/* Click hint */}
      <div className="text-center mt-3 pt-2 border-t border-slate-700">
        <span className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer">
          Click to view all projects →
        </span>
      </div>
    </div>
  );
};

/**
 * Job Site tooltip content
 */
const JobSiteTooltipContent = ({ data }) => {
  const { projectData, stats = {} } = data;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-slate-700">
        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-white">{projectData?.name || 'Project'}</h3>
          <p className="text-sm text-slate-400">
            {projectData?.city}, {projectData?.state}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Status</span>
          <StatusBadge status={projectData?.status} />
        </div>
        {projectData?.phase && (
          <div className="text-sm text-slate-300">
            Phase: {projectData.phase}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        {projectData?.factory && (
          <div className="flex items-center gap-2 text-slate-300">
            <Factory className="w-4 h-4 text-slate-500" />
            Factory: {projectData.factory}
          </div>
        )}
        {projectData?.pm && (
          <div className="flex items-center gap-2 text-slate-300">
            <User className="w-4 h-4 text-slate-500" />
            PM: {projectData.pm}
          </div>
        )}
        {projectData?.contractValue && (
          <div className="flex items-center gap-2 text-slate-300">
            <DollarSign className="w-4 h-4 text-slate-500" />
            Contract: ${formatCurrency(projectData.contractValue)}
          </div>
        )}
      </div>

      {/* Open items warning */}
      {(stats.openRFIs > 0 || stats.openSubmittals > 0) && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700 text-sm">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400">
            {stats.openRFIs > 0 && `${stats.openRFIs} Open RFIs`}
            {stats.openRFIs > 0 && stats.openSubmittals > 0 && ' • '}
            {stats.openSubmittals > 0 && `${stats.openSubmittals} Pending Submittals`}
          </span>
        </div>
      )}

      {/* Click hint */}
      <div className="text-center mt-3 pt-2 border-t border-slate-700">
        <span className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
          Click to view project →
        </span>
      </div>
    </div>
  );
};

/**
 * Truck (delivery in transit) tooltip content
 */
const TruckTooltipContent = ({ data }) => {
  const { deliveryData } = data;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-700">
        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Truck className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-amber-400">IN TRANSIT</h3>
          <p className="text-sm text-white">{deliveryData?.projectName}</p>
        </div>
      </div>

      {/* Route */}
      <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="text-slate-400">
            <Factory className="w-4 h-4 inline mr-1" />
            From
          </div>
          <span className="text-white font-medium">{deliveryData?.fromFactory}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-400">
            <Package className="w-4 h-4 inline mr-1" />
            To
          </div>
          <span className="text-white font-medium">{deliveryData?.toCity}, {deliveryData?.toState}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progress</span>
          <span>{deliveryData?.progress || 0}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
            style={{ width: `${deliveryData?.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Time details */}
      <div className="space-y-2 text-sm">
        {deliveryData?.departedAt && (
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-slate-500" />
            Departed: {formatDateTime(deliveryData.departedAt)}
          </div>
        )}
        {deliveryData?.eta && (
          <div className="flex items-center gap-2 text-slate-300">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            ETA: {formatDateTime(deliveryData.eta)}
          </div>
        )}
      </div>

      {/* Click hint */}
      <div className="text-center mt-3 pt-2 border-t border-slate-700">
        <span className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer">
          Click to view project →
        </span>
      </div>
    </div>
  );
};

// Helper components and functions

const StatBox = ({ value, label, color, icon }) => {
  const colorClasses = {
    orange: 'text-orange-400 bg-orange-500/10',
    green: 'text-green-400 bg-green-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    amber: 'text-amber-400 bg-amber-500/10'
  };

  return (
    <div className={`rounded-lg p-2.5 ${colorClasses[color] || colorClasses.orange}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon}
        <span className="text-xl font-bold">{value}</span>
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusColors = {
    'In Progress': 'bg-blue-500/20 text-blue-400',
    'Shipping': 'bg-amber-500/20 text-amber-400',
    'Installation': 'bg-green-500/20 text-green-400',
    'Completed': 'bg-slate-500/20 text-slate-400',
    'On Hold': 'bg-red-500/20 text-red-400'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status] || statusColors['In Progress']}`}>
      {status || 'Unknown'}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

export default MapTooltip;
