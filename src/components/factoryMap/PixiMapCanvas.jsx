import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { ViewportController } from './systems/ViewportController';
import { LODManager } from './systems/LODManager';
import { USMapLayer } from './layers/USMapLayer';
import { TerrainLayer } from './layers/TerrainLayer';
import { RoutesLayer } from './layers/RoutesLayer';
import { FactoriesLayer } from './layers/FactoriesLayer';
import { JobSitesLayer } from './layers/JobSitesLayer';
import { TrucksLayer } from './layers/TrucksLayer';
import { CelebrationParticles } from './effects/CelebrationParticles';
import { FACTORY_LOCATIONS, getPixelPosition } from './data/factoryLocations';

// Map dimensions
const MAP_WIDTH = 4000;
const MAP_HEIGHT = 2500;

/**
 * PixiMapCanvas - Main Pixi.js canvas wrapper component
 * Handles initialization, layers, and animation loop
 */
const PixiMapCanvas = ({
  width,
  height,
  onZoomChange,
  onViewportChange: _onViewportChange,
  onFactoryHover,
  onFactoryClick,
  onFactoryHoverEnd,
  onJobSiteHover,
  onJobSiteClick,
  onJobSiteHoverEnd,
  onTruckHover,
  onTruckClick,
  onTruckHoverEnd,
  onTruckArrived,
  onFactoryJump,
  factoryStats = {},
  projects: _projects = [],
  deliveries = [],
  highlightedFactory = null
}) => {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const viewportRef = useRef(null);
  const lodManagerRef = useRef(null);
  const layersRef = useRef({});
  const [isReady, setIsReady] = useState(false);

  // Store callbacks in refs to avoid stale closures in Pixi event handlers
  const callbacksRef = useRef({});
  callbacksRef.current = {
    onZoomChange,
    onViewportChange,
    onFactoryHover,
    onFactoryClick,
    onFactoryHoverEnd,
    onJobSiteHover,
    onJobSiteClick,
    onJobSiteHoverEnd,
    onTruckHover,
    onTruckClick,
    onTruckHoverEnd,
    onTruckArrived,
    onFactoryJump
  };

  // Initialize Pixi application
  useEffect(() => {
    console.log('[PixiMapCanvas] Mount - containerRef:', !!containerRef.current, 'appRef:', !!appRef.current);
    if (!containerRef.current || appRef.current) return;

    const initPixi = async () => {
      console.log('[PixiMapCanvas] Initializing PIXI...');
      // Create Pixi Application
      const app = new PIXI.Application();

      await app.init({
        width: width || containerRef.current.clientWidth,
        height: height || containerRef.current.clientHeight,
        backgroundColor: 0x0a0a14,
        antialias: false, // Pixel art style - no smoothing
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        powerPreference: 'high-performance'
      });

      // Add canvas to DOM
      console.log('[PixiMapCanvas] PIXI initialized, adding canvas to DOM');
      containerRef.current.appendChild(app.canvas);
      appRef.current = app;
      console.log('[PixiMapCanvas] Canvas added, creating layers...');

      // Create main map container
      const mapContainer = new PIXI.Container();
      mapContainer.label = 'mapContainer';
      app.stage.addChild(mapContainer);

      // Initialize layers (order matters - bottom to top)
      const mapDimensions = { width: MAP_WIDTH, height: MAP_HEIGHT };

      // 1. US Map background layer
      const usMapLayer = new USMapLayer(mapDimensions);
      mapContainer.addChild(usMapLayer);
      layersRef.current.usMap = usMapLayer;

      // 2. Terrain decorations layer
      const terrainLayer = new TerrainLayer(mapDimensions, { density: 'medium' });
      mapContainer.addChild(terrainLayer);
      layersRef.current.terrain = terrainLayer;

      // 3. Routes layer (delivery paths)
      const routesLayer = new RoutesLayer(mapDimensions);
      mapContainer.addChild(routesLayer);
      layersRef.current.routes = routesLayer;

      // 4. Job Sites layer (delivery destinations)
      const jobSitesLayer = new JobSitesLayer(mapDimensions);
      mapContainer.addChild(jobSitesLayer);
      layersRef.current.jobSites = jobSitesLayer;

      // 5. Factories layer
      const factoriesLayer = new FactoriesLayer(mapDimensions);
      mapContainer.addChild(factoriesLayer);
      layersRef.current.factories = factoriesLayer;

      // 6. Trucks layer (animated deliveries)
      const trucksLayer = new TrucksLayer(mapDimensions);
      mapContainer.addChild(trucksLayer);
      layersRef.current.trucks = trucksLayer;

      // 7. Celebration particles layer (on top of everything)
      const celebrationLayer = new CelebrationParticles();
      mapContainer.addChild(celebrationLayer);
      layersRef.current.celebration = celebrationLayer;

      // Setup event handlers
      setupEventHandlers();

      // Initialize LOD Manager
      const lodManager = new LODManager(layersRef.current);
      lodManagerRef.current = lodManager;

      // Initialize viewport controller (pan/zoom)
      const viewport = new ViewportController(app, mapContainer, {
        initialZoom: 0.6,
        minZoom: 0.25,
        maxZoom: 2.0,
        mapWidth: MAP_WIDTH,
        mapHeight: MAP_HEIGHT,
        onZoomChange: (zoom) => {
          callbacksRef.current.onZoomChange?.(zoom);
          lodManager.update(zoom);
        },
        onViewportChange: (bounds) => {
          callbacksRef.current.onViewportChange?.(bounds);
        },
        onFactoryJump: (code, index) => {
          callbacksRef.current.onFactoryJump?.(code, index);
        }
      });
      viewportRef.current = viewport;

      // Set factory positions for keyboard navigation (1-9 keys)
      const factoryPositions = Object.entries(FACTORY_LOCATIONS).map(([code, data]) => ({
        code,
        x: (data.x / 100) * MAP_WIDTH,
        y: (data.y / 100) * MAP_HEIGHT,
        name: data.name
      }));
      viewport.setFactoryPositions(factoryPositions);

      console.log('[PixiMapCanvas] All layers created, starting animation loop');

      // Animation loop
      app.ticker.add((ticker) => {
        const deltaTime = ticker.deltaTime;

        // Update all animated layers
        if (lodManagerRef.current?.shouldAnimate()) {
          factoriesLayer.update(deltaTime);
          jobSitesLayer.update(deltaTime);
          trucksLayer.update(deltaTime);
          routesLayer.update(deltaTime);
        }

        // Always update celebration particles (even during pause)
        celebrationLayer.update(deltaTime);
      });

      setIsReady(true);
    };

    const setupEventHandlers = () => {
      const layers = layersRef.current;

      // Factory events - use callbacksRef to avoid stale closures
      layers.factories.on('factory:hover', (data) => callbacksRef.current.onFactoryHover?.(data));
      layers.factories.on('factory:hoverend', () => callbacksRef.current.onFactoryHoverEnd?.());
      layers.factories.on('factory:click', (data) => callbacksRef.current.onFactoryClick?.(data));

      // Job site events
      layers.jobSites.on('jobsite:hover', (data) => callbacksRef.current.onJobSiteHover?.(data));
      layers.jobSites.on('jobsite:hoverend', () => callbacksRef.current.onJobSiteHoverEnd?.());
      layers.jobSites.on('jobsite:click', (data) => callbacksRef.current.onJobSiteClick?.(data));

      // Truck events
      layers.trucks.on('truck:hover', (data) => callbacksRef.current.onTruckHover?.(data));
      layers.trucks.on('truck:hoverend', () => callbacksRef.current.onTruckHoverEnd?.());
      layers.trucks.on('truck:click', (data) => callbacksRef.current.onTruckClick?.(data));
      layers.trucks.on('truck:arrived', (data) => {
        // Trigger celebration particles at arrival location
        const truck = layers.trucks.trucks.get(data.deliveryId);
        if (truck && layers.celebration) {
          layers.celebration.celebrate(truck.x, truck.y, {
            particleCount: 40,
            spread: 180,
            duration: 2500
          });
        }
        callbacksRef.current.onTruckArrived?.(data);
      });
    };

    initPixi();

    // Cleanup
    return () => {
      if (viewportRef.current) {
        viewportRef.current.destroy();
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, []);

  // Handle resize
  useEffect(() => {
    if (!appRef.current || !width || !height) return;
    appRef.current.renderer.resize(width, height);
  }, [width, height]);

  // Update factory stats
  useEffect(() => {
    if (layersRef.current.factories && factoryStats) {
      layersRef.current.factories.updateStats(factoryStats);
    }
  }, [factoryStats]);

  // Update projects (job sites)
  useEffect(() => {
    if (!layersRef.current.jobSites || !isReady) return;

    // Filter to projects with delivery locations
    const projectsWithLocations = projects.filter(p =>
      p.delivery_state && ['In Progress', 'Shipping', 'Installation'].includes(p.status)
    );

    layersRef.current.jobSites.loadProjects(projectsWithLocations);
  }, [projects, isReady]);

  // Update deliveries (routes & trucks)
  useEffect(() => {
    if (!layersRef.current.routes || !layersRef.current.trucks || !isReady) return;

    const routes = layersRef.current.routes;
    const trucks = layersRef.current.trucks;

    // Clear existing
    routes.clear();
    trucks.clear();

    // Create routes and trucks for active deliveries
    deliveries.forEach(delivery => {
      const factoryCode = delivery.factory?.split(' - ')[0];
      const factoryPos = getPixelPosition(factoryCode, MAP_WIDTH, MAP_HEIGHT);

      if (!factoryPos || !delivery.delivery_state) return;

      // Get destination position
      const destPos = layersRef.current.jobSites.getJobSitePosition(delivery.id);
      if (!destPos) return;

      // Create route with factory code for highlighting
      const _routeData = routes.createRouteWithFactory(
        delivery.id,
        factoryPos,
        destPos,
        factoryCode,
        {
          status: delivery.status === 'Shipping' ? 'active' : 'completed',
          color: delivery.status === 'Shipping' ? 0xf97316 : 0x22c55e,
          animated: delivery.status === 'Shipping'
        }
      );

      // Create truck for shipping deliveries
      if (delivery.status === 'Shipping') {
        const routePath = routes.getRoutePath(delivery.id);
        if (routePath) {
          trucks.addTruck(delivery.id, {
            projectName: delivery.name,
            projectId: delivery.id,
            fromFactory: factoryCode,
            toCity: delivery.delivery_city,
            toState: delivery.delivery_state,
            progress: delivery.delivery_progress || Math.random() * 0.8 + 0.1
          }, routePath);
        }
      }
    });
  }, [deliveries, isReady]);

  // Public methods

  const setZoom = useCallback((level) => {
    viewportRef.current?.setZoom(level);
  }, []);

  const resetView = useCallback(() => {
    viewportRef.current?.resetView();
  }, []);

  const panToFactory = useCallback((factoryCode) => {
    const pos = layersRef.current.factories?.getFactoryPosition(factoryCode);
    if (pos) {
      viewportRef.current?.panTo(pos.x, pos.y, true);
    }
  }, []);

  const panToJobSite = useCallback((projectId) => {
    const pos = layersRef.current.jobSites?.getJobSitePosition(projectId);
    if (pos) {
      viewportRef.current?.panTo(pos.x, pos.y, true);
    }
  }, []);

  const getZoom = useCallback(() => {
    return viewportRef.current?.getZoom() || 1;
  }, []);

  const getTruckPositions = useCallback(() => {
    return layersRef.current.trucks?.getTruckPositions() || [];
  }, []);

  const highlightRoutesFromFactory = useCallback((factoryCode) => {
    if (!layersRef.current.routes) return;
    layersRef.current.routes.highlightByFactory(factoryCode);
  }, []);

  const clearRouteHighlights = useCallback(() => {
    if (!layersRef.current.routes) return;
    layersRef.current.routes.clearHighlights();
  }, []);

  const triggerCelebration = useCallback((x, y, options = {}) => {
    if (!layersRef.current.celebration) return;
    layersRef.current.celebration.celebrate(x, y, options);
  }, []);

  // Expose methods
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.setZoom = setZoom;
      containerRef.current.resetView = resetView;
      containerRef.current.panToFactory = panToFactory;
      containerRef.current.panToJobSite = panToJobSite;
      containerRef.current.getZoom = getZoom;
      containerRef.current.getTruckPositions = getTruckPositions;
      containerRef.current.highlightRoutesFromFactory = highlightRoutesFromFactory;
      containerRef.current.clearRouteHighlights = clearRouteHighlights;
      containerRef.current.triggerCelebration = triggerCelebration;
    }
  }, [setZoom, resetView, panToFactory, panToJobSite, getZoom, getTruckPositions, highlightRoutesFromFactory, clearRouteHighlights, triggerCelebration]);

  // Handle highlighted factory changes (route highlighting)
  useEffect(() => {
    if (!isReady || !layersRef.current.routes) return;

    if (highlightedFactory) {
      highlightRoutesFromFactory(highlightedFactory);
    } else {
      clearRouteHighlights();
    }
  }, [highlightedFactory, isReady, highlightRoutesFromFactory, clearRouteHighlights]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'grab'
      }}
    />
  );
};

export default PixiMapCanvas;
