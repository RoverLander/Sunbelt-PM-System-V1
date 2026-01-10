import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { ViewportController } from './systems/ViewportController';
import { USMapLayer } from './layers/USMapLayer';
import { FactoriesLayer } from './layers/FactoriesLayer';

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
  onViewportChange,
  onFactoryHover,
  onFactoryClick,
  onFactoryHoverEnd,
  factoryStats = {}
}) => {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const viewportRef = useRef(null);
  const layersRef = useRef({});
  const [isReady, setIsReady] = useState(false);

  // Initialize Pixi application
  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    const initPixi = async () => {
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
      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Create main map container
      const mapContainer = new PIXI.Container();
      mapContainer.name = 'mapContainer';
      app.stage.addChild(mapContainer);

      // Initialize layers
      const mapDimensions = { width: MAP_WIDTH, height: MAP_HEIGHT };

      // 1. US Map background layer
      const usMapLayer = new USMapLayer(mapDimensions);
      mapContainer.addChild(usMapLayer);
      layersRef.current.usMap = usMapLayer;

      // 2. Factories layer
      const factoriesLayer = new FactoriesLayer(mapDimensions);
      mapContainer.addChild(factoriesLayer);
      layersRef.current.factories = factoriesLayer;

      // Setup factory events
      factoriesLayer.on('factory:hover', (data) => {
        onFactoryHover?.(data);
      });

      factoriesLayer.on('factory:hoverend', () => {
        onFactoryHoverEnd?.();
      });

      factoriesLayer.on('factory:click', (data) => {
        onFactoryClick?.(data);
      });

      // Initialize viewport controller (pan/zoom)
      const viewport = new ViewportController(app, mapContainer, {
        initialZoom: 0.6,
        minZoom: 0.25,
        maxZoom: 2.0,
        mapWidth: MAP_WIDTH,
        mapHeight: MAP_HEIGHT,
        onZoomChange: (zoom) => {
          onZoomChange?.(zoom);
          updateLOD(zoom);
        },
        onViewportChange: (bounds) => {
          onViewportChange?.(bounds);
        }
      });
      viewportRef.current = viewport;

      // Animation loop
      app.ticker.add((ticker) => {
        const deltaTime = ticker.deltaTime;

        // Update factory animations
        factoriesLayer.update(deltaTime);
      });

      setIsReady(true);
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

  // Update factory stats when they change
  useEffect(() => {
    if (layersRef.current.factories && factoryStats) {
      layersRef.current.factories.updateStats(factoryStats);
    }
  }, [factoryStats]);

  // LOD (Level of Detail) based on zoom
  const updateLOD = useCallback((zoom) => {
    if (!layersRef.current.factories) return;

    if (zoom <= 0.3) {
      layersRef.current.factories.setDetailLevel('dots');
    } else if (zoom <= 0.5) {
      layersRef.current.factories.setDetailLevel('small');
    } else {
      layersRef.current.factories.setDetailLevel('full');
    }
  }, []);

  // Public methods exposed via ref

  // Zoom to specific level
  const setZoom = useCallback((level) => {
    viewportRef.current?.setZoom(level);
  }, []);

  // Reset view to default
  const resetView = useCallback(() => {
    viewportRef.current?.resetView();
  }, []);

  // Pan to specific factory
  const panToFactory = useCallback((factoryCode) => {
    const pos = layersRef.current.factories?.getFactoryPosition(factoryCode);
    if (pos) {
      viewportRef.current?.panTo(pos.x, pos.y, true);
    }
  }, []);

  // Get current zoom
  const getZoom = useCallback(() => {
    return viewportRef.current?.getZoom() || 1;
  }, []);

  // Expose methods to parent via useImperativeHandle pattern
  // (Alternative: pass these as props or use context)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.setZoom = setZoom;
      containerRef.current.resetView = resetView;
      containerRef.current.panToFactory = panToFactory;
      containerRef.current.getZoom = getZoom;
    }
  }, [setZoom, resetView, panToFactory, getZoom]);

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
