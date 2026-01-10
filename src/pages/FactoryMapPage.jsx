import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Factory, Truck, Package, TrendingUp, Search, Filter, X, CheckCircle, HelpCircle, Maximize2 } from 'lucide-react';
import PixiMapCanvas from '../components/factoryMap/PixiMapCanvas';
import MapControls from '../components/factoryMap/MapControls';
import MapTooltip from '../components/factoryMap/MapTooltip';
import MiniMap from '../components/factoryMap/MiniMap';
import PMHealthPanel from '../components/factoryMap/PMHealthPanel';
import TutorialModal, { useTutorial } from '../components/factoryMap/TutorialModal';
import { supabase } from '../utils/supabaseClient';
import { FACTORY_LOCATIONS } from '../components/factoryMap/data/factoryLocations';

// Time-of-day color tints
const getTimeOfDayTint = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 8) return { name: 'Dawn', tint: 'from-orange-900/20' };
  if (hour >= 8 && hour < 17) return { name: 'Day', tint: '' };
  if (hour >= 17 && hour < 20) return { name: 'Dusk', tint: 'from-orange-800/20' };
  return { name: 'Night', tint: 'from-blue-900/30' };
};

/**
 * FactoryMapPage - Main page component for the interactive factory network map
 */
const FactoryMapPage = ({ onNavigateToProject, onOpenFullscreen, isFullscreen = false }) => {
  const canvasRef = useRef(null);
  const isMountedRef = useRef(true); // Track mount state for async operations

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

  // Projects and deliveries for routes/trucks
  const [projects, setProjects] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Route highlighting (on factory hover)
  const [highlightedFactory, setHighlightedFactory] = useState(null);

  // Delivery arrival toast
  const [arrivalToast, setArrivalToast] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // Filter state
  const [statusFilters, setStatusFilters] = useState({
    'In Progress': true,
    'Shipping': true,
    'Installation': true
  });
  const [showFilters, setShowFilters] = useState(false);

  // Time-of-day
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDayTint());

  // Truck positions for minimap
  const [truckPositions, setTruckPositions] = useState([]);

  // Tutorial state
  const { showTutorial, closeTutorial, openTutorial } = useTutorial();

  // Fetch factory stats from database with cleanup to prevent race conditions
  useEffect(() => {
    isMountedRef.current = true;

    const fetchData = async () => {
      await Promise.all([
        fetchFactoryStats(),
        fetchMapStats(),
        fetchProjectsAndDeliveries()
      ]);
    };

    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update time-of-day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDayTint());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update truck positions for minimap periodically
  useEffect(() => {
    // Poll truck positions - check canvas availability inside interval
    // since canvas may not be ready on initial mount
    const interval = setInterval(() => {
      const positions = canvasRef.current?.getTruckPositions?.() || [];
      setTruckPositions(positions);
    }, 500);

    return () => clearInterval(interval);
  }, []); // Empty dependency - runs once on mount

  // Search projects
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = projects.filter(p =>
      p.name?.toLowerCase().includes(query) ||
      p.delivery_city?.toLowerCase().includes(query) ||
      p.delivery_state?.toLowerCase().includes(query)
    ).slice(0, 5);

    setSearchResults(results);
  }, [searchQuery, projects]);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (arrivalToast) {
      const timer = setTimeout(() => setArrivalToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [arrivalToast]);

  const fetchFactoryStats = async () => {
    try {
      // Get all projects grouped by factory
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name, factory, status, contract_value')
        .not('factory', 'is', null);

      if (error) throw error;
      if (!isMountedRef.current) return; // Prevent state update if unmounted

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
      if (!isMountedRef.current) return; // Prevent state update if unmounted

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
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const fetchProjectsAndDeliveries = async () => {
    try {
      // Fetch projects with delivery locations
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('id, name, factory, status, delivery_city, delivery_state, contract_value')
        .not('delivery_state', 'is', null)
        .in('status', ['In Progress', 'Shipping', 'Installation']);

      if (error) throw error;
      if (!isMountedRef.current) return; // Prevent state update if unmounted

      const projectsList = projectData || [];
      setProjects(projectsList);

      // Create deliveries from shipping projects
      const deliveriesList = projectsList
        .filter(p => p.status === 'Shipping')
        .map(p => ({
          id: p.id,
          name: p.name,
          factory: p.factory,
          status: p.status,
          delivery_city: p.delivery_city || 'Unknown',
          delivery_state: p.delivery_state || 'Unknown',
          delivery_progress: Math.random() * 0.8 + 0.1 // Simulated progress for now
        }));

      setDeliveries(deliveriesList);
    } catch (err) {
      console.error('Error fetching projects and deliveries:', err);
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
    // Highlight routes from this factory
    setHighlightedFactory(data.factoryData.code);
  }, [factoryStats]);

  const handleFactoryHoverEnd = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHighlightedFactory(null);
  }, []);

  const handleFactoryClick = useCallback((data) => {
    // For now, log the click - could integrate with app navigation later
    const factoryCode = data.factoryData.code;
    console.log(`Factory clicked: ${factoryCode}`, data);
    // TODO: Integrate with App.jsx navigation to filter projects by factory
    // onNavigateToProject could be extended to support factory filter
  }, []);

  // Job site handlers
  const handleJobSiteHover = useCallback((data) => {
    setTooltip({
      visible: true,
      type: 'jobsite',
      data: data,
      position: { x: data.screenX, y: data.screenY }
    });
  }, []);

  const handleJobSiteHoverEnd = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleJobSiteClick = useCallback((data) => {
    console.log('Job site clicked:', data);
    // projectData.id is the correct property from JobSiteSprite
    const projectId = data.projectData?.id;
    if (projectId && onNavigateToProject) {
      onNavigateToProject(projectId);
    }
  }, [onNavigateToProject]);

  // Truck handlers
  const handleTruckHover = useCallback((data) => {
    setTooltip({
      visible: true,
      type: 'truck',
      data: data,
      position: { x: data.screenX, y: data.screenY }
    });
  }, []);

  const handleTruckHoverEnd = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleTruckClick = useCallback((data) => {
    console.log('Truck clicked:', data);
    // deliveryData.projectId is the correct property from TruckSprite
    const projectId = data.deliveryData?.projectId;
    if (projectId && onNavigateToProject) {
      onNavigateToProject(projectId);
    }
  }, [onNavigateToProject]);

  const handleMiniMapNavigate = useCallback((x, y) => {
    // Pan to clicked position on mini-map - would need panTo exposed
  }, []);

  // Truck arrival handler - show toast and celebration
  const handleTruckArrived = useCallback((data) => {
    setArrivalToast({
      projectName: data.deliveryData?.projectName || 'Delivery',
      destination: `${data.deliveryData?.toCity}, ${data.deliveryData?.toState}`,
      factory: data.deliveryData?.fromFactory
    });
  }, []);

  // Factory jump handler (keyboard 1-9)
  const handleFactoryJump = useCallback((code, index) => {
    console.log(`Jumped to factory: ${code} (key ${index + 1})`);
  }, []);

  // Search handlers
  const handleSearchSelect = useCallback((project) => {
    canvasRef.current?.panToJobSite?.(project.id);
    setShowSearch(false);
    setSearchQuery('');
  }, []);

  // Filter toggle
  const toggleStatusFilter = useCallback((status) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  }, []);

  // Get filtered deliveries based on status filters
  const filteredDeliveries = deliveries.filter(d => statusFilters[d.status]);

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

            {/* Fullscreen button - only show when not already fullscreen */}
            {!isFullscreen && onOpenFullscreen && (
              <button
                onClick={onOpenFullscreen}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-orange-500 transition-colors group"
                title="Open fullscreen (F11)"
              >
                <Maximize2 className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-colors" />
              </button>
            )}

            {/* Help button */}
            <button
              onClick={openTutorial}
              className="p-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-orange-500 transition-colors group"
              title="Show tutorial"
            >
              <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-colors" />
            </button>
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

        {/* Time-of-day overlay */}
        {timeOfDay.tint && (
          <div className={`absolute inset-0 pointer-events-none bg-gradient-to-b ${timeOfDay.tint} to-transparent z-5`} />
        )}

        {/* Pixi.js Canvas */}
        <div ref={canvasRef} className="absolute inset-0">
          <PixiMapCanvas
            onZoomChange={setCurrentZoom}
            onViewportChange={handleViewportChange}
            onFactoryHover={handleFactoryHover}
            onFactoryHoverEnd={handleFactoryHoverEnd}
            onFactoryClick={handleFactoryClick}
            onJobSiteHover={handleJobSiteHover}
            onJobSiteHoverEnd={handleJobSiteHoverEnd}
            onJobSiteClick={handleJobSiteClick}
            onTruckHover={handleTruckHover}
            onTruckHoverEnd={handleTruckHoverEnd}
            onTruckClick={handleTruckClick}
            onTruckArrived={handleTruckArrived}
            onFactoryJump={handleFactoryJump}
            factoryStats={factoryStats}
            projects={projects}
            deliveries={filteredDeliveries}
            highlightedFactory={highlightedFactory}
          />
        </div>

        {/* PM Health Panel - Left sidebar */}
        <div className="absolute top-4 left-4 z-20 w-64">
          <PMHealthPanel expanded={true} showTeam={false} />
        </div>

        {/* Map Controls */}
        <MapControls
          currentZoom={currentZoom}
          onZoomChange={handleZoomChange}
          onReset={handleReset}
          onFindFactory={handleFindFactory}
        />

        {/* Mini Map with truck dots */}
        <MiniMap
          viewport={viewport}
          onNavigate={handleMiniMapNavigate}
          truckPositions={truckPositions}
        />

        {/* Search & Filter Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-600 hover:border-orange-500 transition-colors"
              title="Search projects (Ctrl+F)"
            >
              <Search className="w-5 h-5 text-slate-400" />
            </button>

            {showSearch && (
              <div className="absolute top-full mt-2 left-0 w-72 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600 shadow-xl overflow-hidden">
                <div className="p-2 border-b border-slate-700">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects, cities..."
                    className="w-full bg-slate-700 text-white text-sm rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                    autoFocus
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto">
                    {searchResults.map(project => (
                      <button
                        key={project.id}
                        onClick={() => handleSearchSelect(project)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="text-sm text-white truncate">{project.name}</div>
                        <div className="text-xs text-slate-400">
                          {project.delivery_city}, {project.delivery_state}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && (
                  <div className="p-3 text-sm text-slate-400 text-center">
                    No projects found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 bg-slate-800/90 backdrop-blur-sm rounded-lg border transition-colors ${
                Object.values(statusFilters).some(v => !v)
                  ? 'border-orange-500 text-orange-400'
                  : 'border-slate-600 hover:border-orange-500 text-slate-400'
              }`}
              title="Filter by status"
            >
              <Filter className="w-5 h-5" />
            </button>

            {showFilters && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600 shadow-xl p-2">
                <div className="text-xs text-slate-400 uppercase tracking-wide px-2 mb-2">
                  Show Status
                </div>
                {Object.entries(statusFilters).map(([status, enabled]) => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                      enabled ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border ${
                      enabled ? 'bg-orange-500 border-orange-500' : 'border-slate-500'
                    } flex items-center justify-center`}>
                      {enabled && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delivery Arrival Toast */}
        {arrivalToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-slideDown">
            <div className="bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <div>
                <div className="font-semibold">Delivery Arrived!</div>
                <div className="text-sm text-green-100">
                  {arrivalToast.projectName} delivered to {arrivalToast.destination}
                </div>
              </div>
              <button
                onClick={() => setArrivalToast(null)}
                className="ml-2 p-1 hover:bg-green-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
          <span className="hidden md:inline">1-9 jump to factories • </span>
          Click for details
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={closeTutorial} />
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
