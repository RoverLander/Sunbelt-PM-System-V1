import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Factory, Truck, Package, TrendingUp } from 'lucide-react';
import PixiMapCanvas from '../components/factoryMap/PixiMapCanvas';
import MapControls from '../components/factoryMap/MapControls';
import MapTooltip from '../components/factoryMap/MapTooltip';
import MiniMap from '../components/factoryMap/MiniMap';
import { supabase } from '../utils/supabaseClient';
import { FACTORY_LOCATIONS } from '../components/factoryMap/data/factoryLocations';

/**
 * FactoryMapPage - Main page component for the interactive factory network map
 */
const FactoryMapPage = ({ onNavigateToProject }) => {
  const canvasRef = useRef(null);

  // Viewport state
  const [currentZoom, setCurrentZoom] = useState(0.6);
  const [viewport, setViewport] = useState(null);

  // Tooltip state
  const [tooltip, setTooltip] = useState({
    visible: false,
    type: null,
    data: null,
    position: { x: 0, y: 0 }
  });

  // Stats data
  const [factoryStats, setFactoryStats] = useState({});
  const [mapStats, setMapStats] = useState({
    activeFactories: Object.keys(FACTORY_LOCATIONS).length,
    inTransit: 0,
    deliveredThisMonth: 0,
    totalProjects: 0
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Fetch factory stats from database
  useEffect(() => {
    fetchFactoryStats();
    fetchMapStats();
  }, []);

  const fetchFactoryStats = async () => {
    try {
      // Get all projects grouped by factory
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name, factory, status, contract_value')
        .not('factory', 'is', null);

      if (error) throw error;

      // Group by factory code
      const stats = {};
      const factoryCodes = Object.keys(FACTORY_LOCATIONS);

      factoryCodes.forEach(code => {
        const factoryProjects = (projects || []).filter(p =>
          p.factory?.toUpperCase().startsWith(code)
        );

        const activeProjects = factoryProjects.filter(p =>
          !['Completed', 'Cancelled'].includes(p.status)
        );

        const shippingProjects = factoryProjects.filter(p =>
          p.status === 'Shipping'
        );

        stats[code] = {
          activeProjects: activeProjects.length,
          shippingThisWeek: shippingProjects.length,
          totalContractValue: activeProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0),
          inProduction: activeProjects.slice(0, 3).map(p => ({
            name: p.name,
            progress: Math.floor(Math.random() * 80 + 20) // TODO: Calculate from actual data
          })),
          recentDeliveries: [] // TODO: Implement delivery tracking
        };
      });

      setFactoryStats(stats);
    } catch (err) {
      console.error('Error fetching factory stats:', err);
    }
  };

  const fetchMapStats = async () => {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, status');

      if (error) throw error;

      const active = (projects || []).filter(p =>
        !['Completed', 'Cancelled'].includes(p.status)
      );

      const shipping = (projects || []).filter(p => p.status === 'Shipping');

      setMapStats({
        activeFactories: Object.keys(FACTORY_LOCATIONS).length,
        inTransit: shipping.length,
        deliveredThisMonth: Math.floor(Math.random() * 20 + 5), // TODO: Real data
        totalProjects: active.length
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching map stats:', err);
      setIsLoading(false);
    }
  };

  // Handlers
  const handleZoomChange = useCallback((zoom) => {
    setCurrentZoom(zoom);
    canvasRef.current?.setZoom?.(zoom);
  }, []);

  const handleViewportChange = useCallback((bounds) => {
    setViewport(bounds);
  }, []);

  const handleReset = useCallback(() => {
    canvasRef.current?.resetView?.();
  }, []);

  const handleFindFactory = useCallback((factoryCode) => {
    canvasRef.current?.panToFactory?.(factoryCode);
  }, []);

  const handleFactoryHover = useCallback((data) => {
    setTooltip({
      visible: true,
      type: 'factory',
      data: {
        ...data,
        stats: factoryStats[data.factoryData.code] || {}
      },
      position: { x: data.screenX, y: data.screenY }
    });
  }, [factoryStats]);

  const handleFactoryHoverEnd = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleFactoryClick = useCallback((data) => {
    // For now, log the click - could integrate with app navigation later
    const factoryCode = data.factoryData.code;
    console.log(`Factory clicked: ${factoryCode}`, data);
    // TODO: Integrate with App.jsx navigation to filter projects by factory
    // onNavigateToProject could be extended to support factory filter
  }, []);

  const handleMiniMapNavigate = useCallback((x, y) => {
    // Pan to clicked position on mini-map
    const canvas = canvasRef.current;
    if (canvas) {
      // Access the viewport controller through the canvas methods
      // This would need panTo exposed
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Factory className="w-7 h-7 text-orange-500" />
              Factory Network Map
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Interactive view of all Sunbelt manufacturing facilities and active deliveries
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4">
            <QuickStat
              icon={<Factory className="w-4 h-4" />}
              value={mapStats.activeFactories}
              label="Factories"
              color="orange"
            />
            <QuickStat
              icon={<Truck className="w-4 h-4" />}
              value={mapStats.inTransit}
              label="In Transit"
              color="amber"
            />
            <QuickStat
              icon={<Package className="w-4 h-4" />}
              value={mapStats.deliveredThisMonth}
              label="This Month"
              color="green"
            />
            <QuickStat
              icon={<TrendingUp className="w-4 h-4" />}
              value={mapStats.totalProjects}
              label="Active Projects"
              color="blue"
            />
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/80 z-30 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400">Loading factory data...</p>
            </div>
          </div>
        )}

        {/* Pixi.js Canvas */}
        <div ref={canvasRef} className="absolute inset-0">
          <PixiMapCanvas
            onZoomChange={setCurrentZoom}
            onViewportChange={handleViewportChange}
            onFactoryHover={handleFactoryHover}
            onFactoryHoverEnd={handleFactoryHoverEnd}
            onFactoryClick={handleFactoryClick}
            factoryStats={factoryStats}
          />
        </div>

        {/* Map Controls */}
        <MapControls
          currentZoom={currentZoom}
          onZoomChange={handleZoomChange}
          onReset={handleReset}
          onFindFactory={handleFindFactory}
        />

        {/* Mini Map */}
        <MiniMap
          viewport={viewport}
          onNavigate={handleMiniMapNavigate}
        />

        {/* Tooltip */}
        <MapTooltip
          visible={tooltip.visible}
          type={tooltip.type}
          data={tooltip.data}
          position={tooltip.position}
        />

        {/* Legend */}
        <div className="absolute top-4 right-4 z-20 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Legend</h4>
          <div className="space-y-1.5">
            <LegendItem color="bg-orange-500" label="Factory Location" />
            <LegendItem color="bg-amber-500" label="In Transit" />
            <LegendItem color="bg-green-500" label="Delivered" />
            <LegendItem color="bg-blue-500" label="Job Site" />
          </div>
        </div>

        {/* Instructions hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-800/70 backdrop-blur-sm rounded-full px-4 py-2 text-xs text-slate-400">
          <span className="hidden sm:inline">Drag to pan • Scroll to zoom • </span>
          Click factory for details
        </div>
      </div>
    </div>
  );
};

// Helper components

const QuickStat = ({ icon, value, label, color }) => {
  const colorClasses = {
    orange: 'text-orange-400 bg-orange-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    green: 'text-green-400 bg-green-500/10',
    blue: 'text-blue-400 bg-blue-500/10'
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colorClasses[color]}`}>
      {icon}
      <div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2 text-xs text-slate-300">
    <span className={`w-3 h-3 rounded-full ${color}`} />
    {label}
  </div>
);

export default FactoryMapPage;
