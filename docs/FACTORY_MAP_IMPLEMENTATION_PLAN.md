# Factory Map - Technical Implementation Plan

**Feature:** Animated Isometric US Map with Terrain, Zoom, and Live Data
**Status:** Ready for Implementation
**Created:** January 10, 2026
**Reference:** [FACTORY_MAP_VISION.md](./FACTORY_MAP_VISION.md)

---

## Overview

This document provides a step-by-step technical plan to implement the Factory Map feature. The plan is organized into phases that can be executed sequentially, with each phase building on the previous one.

**Total Estimated Phases:** 6
**Tech Stack:** React + Pixi.js + Supabase

---

## Prerequisites

Before starting implementation:

```bash
# Install required dependencies
npm install pixi.js @pixi/react

# Optional but recommended for development
npm install pixi.js-legacy  # Fallback for older browsers
```

---

## Phase 1: Foundation & Basic Map Canvas

**Goal:** Get a basic Pixi.js canvas rendering in React with pan/zoom controls

### Step 1.1: Create Page Structure

```
src/
├── pages/
│   └── FactoryMapPage.jsx          <- New page component
├── components/
│   └── factoryMap/
│       ├── index.js                <- Barrel export
│       ├── PixiMapCanvas.jsx       <- Pixi.js wrapper component
│       ├── MapControls.jsx         <- Zoom/filter controls (React)
│       └── MiniMap.jsx             <- Overview navigator (React)
```

**Tasks:**
- [ ] Create `src/pages/FactoryMapPage.jsx` - main page container
- [ ] Create `src/components/factoryMap/PixiMapCanvas.jsx` - Pixi canvas wrapper
- [ ] Create `src/components/factoryMap/MapControls.jsx` - zoom slider, buttons
- [ ] Add route to `App.jsx`: `/factory-map`
- [ ] Add sidebar navigation item with map icon

### Step 1.2: Initialize Pixi.js Application

**File:** `src/components/factoryMap/PixiMapCanvas.jsx`

```javascript
// Core setup pattern
import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

const PixiMapCanvas = ({ width, height, onReady }) => {
  const containerRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    // Initialize Pixi Application
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x0a0a14,
      antialias: false,  // Pixel art style
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    containerRef.current.appendChild(app.view);
    appRef.current = app;

    // Create main container for map content
    const mapContainer = new PIXI.Container();
    mapContainer.name = 'mapContainer';
    app.stage.addChild(mapContainer);

    onReady?.(app, mapContainer);

    return () => {
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width, height }} />;
};
```

**Tasks:**
- [ ] Set up Pixi.js application with correct settings
- [ ] Create main container hierarchy
- [ ] Handle resize events
- [ ] Implement cleanup on unmount

### Step 1.3: Implement Pan & Zoom System

**File:** `src/components/factoryMap/systems/ViewportController.js`

```javascript
class ViewportController {
  constructor(app, mapContainer) {
    this.app = app;
    this.container = mapContainer;
    this.zoom = 1;
    this.minZoom = 0.25;
    this.maxZoom = 2;
    this.position = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.momentum = { x: 0, y: 0 };

    this.setupEventListeners();
  }

  setupEventListeners() {
    const view = this.app.view;

    // Mouse wheel zoom
    view.addEventListener('wheel', this.handleWheel.bind(this));

    // Pan with drag - ALWAYS enabled regardless of zoom
    view.addEventListener('mousedown', this.handleMouseDown.bind(this));
    view.addEventListener('mousemove', this.handleMouseMove.bind(this));
    view.addEventListener('mouseup', this.handleMouseUp.bind(this));
    view.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    // Touch support
    view.addEventListener('touchstart', this.handleTouchStart.bind(this));
    view.addEventListener('touchmove', this.handleTouchMove.bind(this));
    view.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Keyboard controls
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoomAtPoint(this.zoom * delta, e.clientX, e.clientY);
  }

  zoomAtPoint(newZoom, clientX, clientY) {
    newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));

    // Get mouse position relative to container
    const rect = this.app.view.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Calculate zoom pivot
    const worldX = (mouseX - this.position.x) / this.zoom;
    const worldY = (mouseY - this.position.y) / this.zoom;

    this.zoom = newZoom;

    // Adjust position to zoom at cursor
    this.position.x = mouseX - worldX * this.zoom;
    this.position.y = mouseY - worldY * this.zoom;

    this.applyTransform();
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.dragStart = { x: e.clientX - this.position.x, y: e.clientY - this.position.y };
    this.momentum = { x: 0, y: 0 };
    this.app.view.style.cursor = 'grabbing';
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;

    const newX = e.clientX - this.dragStart.x;
    const newY = e.clientY - this.dragStart.y;

    // Calculate momentum for smooth release
    this.momentum.x = newX - this.position.x;
    this.momentum.y = newY - this.position.y;

    this.position.x = newX;
    this.position.y = newY;
    this.applyTransform();
  }

  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.app.view.style.cursor = 'grab';
      this.startMomentumScroll();
    }
  }

  startMomentumScroll() {
    const friction = 0.95;
    const minVelocity = 0.5;

    const animate = () => {
      if (Math.abs(this.momentum.x) < minVelocity &&
          Math.abs(this.momentum.y) < minVelocity) {
        return;
      }

      this.position.x += this.momentum.x;
      this.position.y += this.momentum.y;
      this.momentum.x *= friction;
      this.momentum.y *= friction;

      this.applyTransform();
      requestAnimationFrame(animate);
    };

    animate();
  }

  applyTransform() {
    this.container.scale.set(this.zoom);
    this.container.position.set(this.position.x, this.position.y);
  }

  // Public methods for MapControls component
  setZoom(level) {
    const centerX = this.app.view.width / 2;
    const centerY = this.app.view.height / 2;
    this.zoomAtPoint(level, centerX, centerY);
  }

  resetView() {
    this.zoom = 1;
    this.position = { x: 0, y: 0 };
    this.applyTransform();
  }

  panTo(x, y) {
    // Animate pan to specific coordinates
    // ... GSAP or manual animation
  }
}
```

**Tasks:**
- [ ] Create ViewportController class
- [ ] Implement mouse wheel zoom (zoom to cursor position)
- [ ] Implement click-and-drag pan (works at ANY zoom level)
- [ ] Implement momentum scrolling after drag release
- [ ] Implement touch gestures (pinch zoom, drag pan)
- [ ] Implement keyboard controls (arrows, +/-)
- [ ] Add boundary constraints (soft edges)
- [ ] Connect to MapControls component

### Step 1.4: Create Map Controls UI

**File:** `src/components/factoryMap/MapControls.jsx`

```javascript
const MapControls = ({ viewport, currentZoom, onZoomChange, onReset, onFindFactory }) => {
  const zoomLevels = [0.25, 0.5, 1, 1.5, 2];

  return (
    <div className="absolute bottom-4 left-4 bg-slate-800/90 rounded-lg p-3 flex items-center gap-4">
      <button onClick={() => onZoomChange(currentZoom * 0.8)}>−</button>
      <input
        type="range"
        min="0.25"
        max="2"
        step="0.05"
        value={currentZoom}
        onChange={(e) => onZoomChange(parseFloat(e.target.value))}
      />
      <button onClick={() => onZoomChange(currentZoom * 1.2)}>+</button>
      <span className="text-sm">{Math.round(currentZoom * 100)}%</span>
      <button onClick={onReset}>🏠 Reset</button>
      <button onClick={onFindFactory}>📍 Find Factory</button>
    </div>
  );
};
```

**Tasks:**
- [ ] Create zoom slider with +/- buttons
- [ ] Display current zoom percentage
- [ ] Add reset view button
- [ ] Add "Find Factory" dropdown/search
- [ ] Style to match app theme

---

## Phase 2: US Map Base & Factory Markers

**Goal:** Render US map shape with factory markers at correct positions

### Step 2.1: Create US Map Outline

**File:** `src/components/factoryMap/layers/USMapLayer.js`

```javascript
class USMapLayer extends PIXI.Container {
  constructor() {
    super();
    this.name = 'usMapLayer';
    this.createMapShape();
  }

  createMapShape() {
    // Option A: SVG path converted to Pixi Graphics
    // Option B: Pre-rendered tilemap
    // Option C: Simple polygon approximation for MVP

    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x1a2a3a);  // Base land color

    // Simplified US outline (replace with actual path data)
    // Path data can be extracted from a GeoJSON of US boundaries
    graphics.drawPolygon([
      // ... coordinate points
    ]);

    graphics.endFill();
    this.addChild(graphics);
  }
}
```

**Tasks:**
- [ ] Get simplified US map path data (GeoJSON → points)
- [ ] Create USMapLayer class extending PIXI.Container
- [ ] Render base map shape with land/water colors
- [ ] Add state boundaries (optional, low priority)

### Step 2.2: Define Factory Locations

**File:** `src/components/factoryMap/data/factoryLocations.js`

```javascript
// Map coordinates (0-100 percentage-based for flexibility)
export const FACTORY_LOCATIONS = {
  'NWBS': {
    x: 12, y: 15,
    name: 'Northwest Building Systems',
    state: 'WA',
    city: 'Tacoma',
    region: 'pacificNorthwest'
  },
  'WM-WEST': {
    x: 10, y: 35,
    name: 'Whitley Manufacturing West',
    state: 'CA',
    city: 'Stockton',
    region: 'california'
  },
  // ... all factories
};

// Convert percentage coords to pixel coords
export const getPixelPosition = (factoryCode, mapWidth, mapHeight) => {
  const loc = FACTORY_LOCATIONS[factoryCode];
  return {
    x: (loc.x / 100) * mapWidth,
    y: (loc.y / 100) * mapHeight
  };
};
```

**Tasks:**
- [ ] Define all factory locations with coordinates
- [ ] Add metadata (region, state, city)
- [ ] Create coordinate conversion utilities

### Step 2.3: Create Factory Markers

**File:** `src/components/factoryMap/sprites/FactorySprite.js`

```javascript
class FactorySprite extends PIXI.Container {
  constructor(factoryData) {
    super();
    this.factoryData = factoryData;
    this.name = `factory_${factoryData.code}`;

    this.createSprite();
    this.setupInteraction();
  }

  createSprite() {
    // Simple version for MVP - colored rectangle with icon
    const base = new PIXI.Graphics();
    base.beginFill(0x3a3a4a);
    base.drawRect(-16, -24, 32, 48);
    base.endFill();

    // Orange accent
    base.beginFill(0xf97316);
    base.drawRect(-16, -24, 32, 8);
    base.endFill();

    this.addChild(base);

    // Label
    const label = new PIXI.Text(this.factoryData.code, {
      fontSize: 10,
      fill: 0xffffff,
      fontFamily: 'monospace'
    });
    label.anchor.set(0.5, 0);
    label.y = 28;
    this.addChild(label);
  }

  setupInteraction() {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', this.onHover.bind(this));
    this.on('pointerout', this.onHoverEnd.bind(this));
    this.on('pointertap', this.onClick.bind(this));
  }

  onHover() {
    this.scale.set(1.1);
    // Emit event for tooltip
    this.emit('factory:hover', this.factoryData);
  }

  onHoverEnd() {
    this.scale.set(1);
    this.emit('factory:hoverend');
  }

  onClick() {
    this.emit('factory:click', this.factoryData);
  }
}
```

**Tasks:**
- [ ] Create FactorySprite class
- [ ] Render basic factory shape (upgrade to pixel art later)
- [ ] Add factory code label
- [ ] Setup pointer events (hover, click)
- [ ] Emit events for tooltip system

### Step 2.4: Create Factories Layer

**File:** `src/components/factoryMap/layers/FactoriesLayer.js`

```javascript
class FactoriesLayer extends PIXI.Container {
  constructor(mapDimensions) {
    super();
    this.name = 'factoriesLayer';
    this.factories = new Map();
    this.mapDimensions = mapDimensions;
  }

  initialize(factoryLocations) {
    Object.entries(factoryLocations).forEach(([code, data]) => {
      const position = getPixelPosition(code, this.mapDimensions.width, this.mapDimensions.height);
      const sprite = new FactorySprite({ code, ...data });
      sprite.position.set(position.x, position.y);

      // Bubble up events
      sprite.on('factory:hover', (data) => this.emit('factory:hover', data));
      sprite.on('factory:hoverend', () => this.emit('factory:hoverend'));
      sprite.on('factory:click', (data) => this.emit('factory:click', data));

      this.factories.set(code, sprite);
      this.addChild(sprite);
    });
  }

  highlightFactory(code) {
    this.factories.get(code)?.scale.set(1.2);
  }

  panToFactory(code, viewport) {
    const factory = this.factories.get(code);
    if (factory) {
      viewport.panTo(factory.x, factory.y);
    }
  }
}
```

**Tasks:**
- [ ] Create FactoriesLayer to manage all factory sprites
- [ ] Position factories at correct map locations
- [ ] Handle event bubbling to parent
- [ ] Add highlight/focus methods

---

## Phase 3: Tooltip System

**Goal:** Show rich tooltips on hover for factories, job sites, and trucks

### Step 3.1: Create Tooltip Container (React)

**File:** `src/components/factoryMap/MapTooltip.jsx`

```javascript
import { useState, useEffect } from 'react';

const MapTooltip = ({ data, type, position, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 200ms delay before showing
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || !visible) return null;

  // Position tooltip, keeping within viewport
  const style = {
    position: 'absolute',
    left: Math.min(position.x, window.innerWidth - 350),
    top: Math.min(position.y, window.innerHeight - 400),
    zIndex: 1000,
  };

  return (
    <div style={style} className="bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-4 w-80">
      {type === 'factory' && <FactoryTooltipContent data={data} />}
      {type === 'jobsite' && <JobSiteTooltipContent data={data} />}
      {type === 'truck' && <TruckTooltipContent data={data} />}
    </div>
  );
};

const FactoryTooltipContent = ({ data }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">🏭</span>
      <div>
        <h3 className="font-bold text-white">{data.code}</h3>
        <p className="text-sm text-slate-400">{data.name}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="bg-slate-700 rounded p-2 text-center">
        <div className="text-xl font-bold text-orange-400">{data.stats?.activeProjects || 0}</div>
        <div className="text-xs text-slate-400">Active Projects</div>
      </div>
      <div className="bg-slate-700 rounded p-2 text-center">
        <div className="text-xl font-bold text-green-400">{data.stats?.shippingThisWeek || 0}</div>
        <div className="text-xs text-slate-400">Shipping</div>
      </div>
    </div>

    {data.inProduction?.length > 0 && (
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-slate-400 mb-1">IN PRODUCTION</h4>
        {data.inProduction.slice(0, 3).map((p, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-slate-300 truncate">{p.name}</span>
            <span className="text-orange-400">[{p.progress}%]</span>
          </div>
        ))}
      </div>
    )}

    <div className="text-center text-xs text-orange-400 cursor-pointer hover:underline">
      Click to view all projects →
    </div>
  </div>
);

// Similar components for JobSiteTooltipContent and TruckTooltipContent
```

**Tasks:**
- [ ] Create MapTooltip container component
- [ ] Create FactoryTooltipContent with stats, projects, deliveries
- [ ] Create JobSiteTooltipContent with project details
- [ ] Create TruckTooltipContent with delivery progress
- [ ] Implement 200ms delay before showing
- [ ] Implement viewport-aware positioning
- [ ] Style to match vision mockups

### Step 3.2: Connect Tooltip to Pixi Events

**File:** `src/components/factoryMap/PixiMapCanvas.jsx` (update)

```javascript
const PixiMapCanvas = ({ ... }) => {
  const [tooltip, setTooltip] = useState(null);

  const handleFactoryHover = useCallback((factoryData, event) => {
    // Fetch additional data from Supabase
    fetchFactoryStats(factoryData.code).then(stats => {
      setTooltip({
        type: 'factory',
        data: { ...factoryData, stats },
        position: { x: event.clientX + 10, y: event.clientY + 10 }
      });
    });
  }, []);

  const handleHoverEnd = useCallback(() => {
    setTooltip(null);
  }, []);

  // In initialization:
  // factoriesLayer.on('factory:hover', handleFactoryHover);
  // factoriesLayer.on('factory:hoverend', handleHoverEnd);

  return (
    <>
      <div ref={containerRef} />
      <MapTooltip {...tooltip} onClose={() => setTooltip(null)} />
    </>
  );
};
```

**Tasks:**
- [ ] Connect Pixi sprite events to React tooltip state
- [ ] Fetch live data from Supabase on hover
- [ ] Handle hover position tracking
- [ ] Implement tooltip persistence when hovering tooltip itself

### Step 3.3: Create Data Fetching Hooks

**File:** `src/hooks/useFactoryMapData.js`

```javascript
import { useQuery } from '@tanstack/react-query'; // or custom hook
import { supabase } from '../lib/supabase';

export const useFactoryStats = (factoryCode) => {
  return useQuery({
    queryKey: ['factoryStats', factoryCode],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, contract_value')
        .ilike('factory', `${factoryCode}%`);

      const active = projects.filter(p => p.status !== 'Completed');
      const shipping = projects.filter(p => p.status === 'Shipping');

      return {
        activeProjects: active.length,
        shippingThisWeek: shipping.length,
        totalContractValue: active.reduce((sum, p) => sum + (p.contract_value || 0), 0),
        inProduction: active.slice(0, 3).map(p => ({
          name: p.name,
          progress: 50  // Calculate from milestones
        }))
      };
    },
    staleTime: 30000  // Cache for 30 seconds
  });
};

export const useProjectsForMap = () => {
  return useQuery({
    queryKey: ['projectsForMap'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name, factory, status, delivery_city, delivery_state, pm:users(name)')
        .in('status', ['In Progress', 'Shipping', 'Installation']);

      return data;
    }
  });
};
```

**Tasks:**
- [ ] Create useFactoryStats hook for tooltip data
- [ ] Create useProjectsForMap hook for job sites
- [ ] Create useActiveDeliveries hook for trucks
- [ ] Implement caching to prevent excessive fetches

---

## Phase 4: Job Sites & Delivery Routes

**Goal:** Show project delivery destinations and animated truck routes

### Step 4.1: Create Job Site Markers

**File:** `src/components/factoryMap/sprites/JobSiteSprite.js`

```javascript
class JobSiteSprite extends PIXI.Container {
  constructor(projectData) {
    super();
    this.projectData = projectData;
    this.createMarker();
    this.setupInteraction();
  }

  createMarker() {
    // Pin/marker shape
    const marker = new PIXI.Graphics();
    marker.beginFill(this.getStatusColor());
    marker.moveTo(0, 0);
    marker.lineTo(-8, -20);
    marker.lineTo(8, -20);
    marker.closePath();
    marker.drawCircle(0, -20, 8);
    marker.endFill();

    // Package icon in center
    const icon = new PIXI.Text('📦', { fontSize: 10 });
    icon.anchor.set(0.5);
    icon.position.set(0, -20);

    this.addChild(marker, icon);

    // Pulsing animation for active sites
    if (this.projectData.status === 'Installation') {
      this.startPulse();
    }
  }

  getStatusColor() {
    switch (this.projectData.status) {
      case 'Shipping': return 0xf59e0b;    // Amber
      case 'Installation': return 0x22c55e; // Green
      case 'Delivered': return 0x3b82f6;    // Blue
      default: return 0x6b7280;              // Gray
    }
  }

  startPulse() {
    // Animate scale up/down
  }
}
```

**Tasks:**
- [ ] Create JobSiteSprite class
- [ ] Color-code by project status
- [ ] Add pulsing animation for active installations
- [ ] Setup hover/click events

### Step 4.2: Geocode Project Locations

**File:** `src/components/factoryMap/utils/geocoding.js`

```javascript
// Simple state-to-coordinates mapping for MVP
// (Full geocoding would use Google Maps API)

const STATE_CENTERS = {
  'AL': { x: 72, y: 65 },
  'AK': { x: 15, y: 85 },
  'AZ': { x: 25, y: 55 },
  'AR': { x: 58, y: 58 },
  'CA': { x: 10, y: 45 },
  // ... all states
  'WA': { x: 12, y: 12 },
  'WV': { x: 78, y: 45 },
  'WI': { x: 62, y: 28 },
  'WY': { x: 32, y: 30 },
};

export const getProjectCoordinates = (project) => {
  const state = project.delivery_state;
  const baseCoords = STATE_CENTERS[state];

  if (!baseCoords) return null;

  // Add slight randomization to prevent overlap
  return {
    x: baseCoords.x + (Math.random() - 0.5) * 5,
    y: baseCoords.y + (Math.random() - 0.5) * 5
  };
};
```

**Tasks:**
- [ ] Create state center coordinates mapping
- [ ] Add city-level precision (optional)
- [ ] Handle coordinate randomization for overlapping sites
- [ ] Consider using actual geocoding API for accuracy

### Step 4.3: Create Delivery Routes

**File:** `src/components/factoryMap/layers/RoutesLayer.js`

```javascript
class RoutesLayer extends PIXI.Container {
  constructor() {
    super();
    this.name = 'routesLayer';
    this.routes = new Map();
  }

  createRoute(fromFactory, toProject) {
    const route = new PIXI.Graphics();

    // Get coordinates
    const from = getPixelPosition(fromFactory, MAP_WIDTH, MAP_HEIGHT);
    const to = getProjectCoordinates(toProject);

    // Draw curved path
    route.lineStyle(2, 0x4a5568, 0.6);

    // Bezier curve for nice arc
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - 50; // Arc upward

    route.moveTo(from.x, from.y);
    route.quadraticCurveTo(midX, midY, to.x, to.y);

    this.addChild(route);

    return { from, to, midX, midY };
  }

  // Animated dashed line for active deliveries
  createAnimatedRoute(fromFactory, toProject) {
    // Use PIXI filters or shader for dashed animation
  }
}
```

**Tasks:**
- [ ] Create RoutesLayer class
- [ ] Draw curved paths between factories and destinations
- [ ] Add dashed line animation for active deliveries
- [ ] Color-code routes by status

### Step 4.4: Create Animated Trucks

**File:** `src/components/factoryMap/sprites/TruckSprite.js`

```javascript
class TruckSprite extends PIXI.Container {
  constructor(deliveryData, routePath) {
    super();
    this.deliveryData = deliveryData;
    this.routePath = routePath;
    this.progress = deliveryData.progress || 0;

    this.createTruck();
    this.setupInteraction();
  }

  createTruck() {
    // Simple truck shape for MVP
    const truck = new PIXI.Graphics();

    // Cab (orange)
    truck.beginFill(0xf97316);
    truck.drawRect(0, 0, 12, 10);
    truck.endFill();

    // Trailer (tan)
    truck.beginFill(0xd4a574);
    truck.drawRect(-20, 0, 20, 10);
    truck.endFill();

    // Wheels
    truck.beginFill(0x1a1a1a);
    truck.drawCircle(-15, 10, 3);
    truck.drawCircle(-5, 10, 3);
    truck.drawCircle(6, 10, 3);
    truck.endFill();

    this.addChild(truck);
  }

  updatePosition(progress) {
    this.progress = progress;

    // Calculate position along bezier curve
    const t = progress;
    const { from, to, midX, midY } = this.routePath;

    // Quadratic bezier formula
    const x = (1-t)*(1-t)*from.x + 2*(1-t)*t*midX + t*t*to.x;
    const y = (1-t)*(1-t)*from.y + 2*(1-t)*t*midY + t*t*to.y;

    this.position.set(x, y);

    // Rotate truck to face direction of travel
    const dx = 2*(1-t)*(midX-from.x) + 2*t*(to.x-midX);
    const dy = 2*(1-t)*(midY-from.y) + 2*t*(to.y-midY);
    this.rotation = Math.atan2(dy, dx);
  }

  animate() {
    // Smooth animation along route
    // Update progress based on delivery ETA
  }
}
```

**Tasks:**
- [ ] Create TruckSprite class
- [ ] Implement bezier curve position calculation
- [ ] Add rotation to face travel direction
- [ ] Animate smooth movement along route
- [ ] Add wheel rotation animation
- [ ] Setup hover/click events

---

## Phase 5: Terrain & Regional Features

**Goal:** Add regional terrain, decorations, and weather effects

### Step 5.1: Create Terrain Tile System

**File:** `src/components/factoryMap/layers/TerrainLayer.js`

```javascript
class TerrainLayer extends PIXI.Container {
  constructor(mapDimensions) {
    super();
    this.name = 'terrainLayer';
    this.tiles = [];

    this.generateTerrain(mapDimensions);
  }

  generateTerrain({ width, height }) {
    const tileSize = 16;

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const region = this.getRegionAt(x, y, width, height);
        const color = this.getTerrainColor(region);

        const tile = new PIXI.Graphics();
        tile.beginFill(color);
        tile.drawRect(0, 0, tileSize, tileSize);
        tile.endFill();
        tile.position.set(x, y);

        this.addChild(tile);
      }
    }
  }

  getRegionAt(x, y, mapWidth, mapHeight) {
    const px = (x / mapWidth) * 100;
    const py = (y / mapHeight) * 100;

    // Check region boundaries
    for (const [region, data] of Object.entries(REGION_BOUNDARIES)) {
      if (px >= data.bounds.x1 && px <= data.bounds.x2 &&
          py >= data.bounds.y1 && py <= data.bounds.y2) {
        return region;
      }
    }
    return 'default';
  }

  getTerrainColor(region) {
    const palette = REGION_PALETTES[region] || REGION_PALETTES.midwest;
    const colors = palette.ground;
    return parseInt(colors[Math.floor(Math.random() * colors.length)].replace('#', ''), 16);
  }
}
```

**Tasks:**
- [ ] Create tile-based terrain generation
- [ ] Implement region detection from coordinates
- [ ] Apply regional color palettes
- [ ] Add terrain transitions between regions

### Step 5.2: Add Regional Decorations

**File:** `src/components/factoryMap/layers/DecorationsLayer.js`

```javascript
class DecorationsLayer extends PIXI.Container {
  constructor(mapDimensions) {
    super();
    this.name = 'decorationsLayer';

    this.generateDecorations(mapDimensions);
  }

  generateDecorations({ width, height }) {
    for (const [region, config] of Object.entries(REGION_BOUNDARIES)) {
      const density = config.density;
      const bounds = config.bounds;

      // Generate trees
      if (density.trees) {
        this.generateTrees(region, bounds, density.trees, width, height);
      }

      // Generate cacti (southwest)
      if (density.cacti) {
        this.generateCacti(bounds, density.cacti, width, height);
      }

      // Generate farms (midwest)
      if (density.farms) {
        this.generateFarms(bounds, density.farms, width, height);
      }

      // ... other decoration types
    }
  }

  generateTrees(region, bounds, density, mapWidth, mapHeight) {
    const count = this.getDensityCount(density);
    const treeType = this.getTreeTypeForRegion(region);

    for (let i = 0; i < count; i++) {
      const x = this.randomInRange(bounds.x1, bounds.x2) / 100 * mapWidth;
      const y = this.randomInRange(bounds.y1, bounds.y2) / 100 * mapHeight;

      const tree = this.createTree(treeType);
      tree.position.set(x, y);
      this.addChild(tree);
    }
  }

  createTree(type) {
    const tree = new PIXI.Graphics();

    switch (type) {
      case 'evergreen':
        // Triangle tree
        tree.beginFill(0x1a3d2e);
        tree.moveTo(0, -20);
        tree.lineTo(-8, 0);
        tree.lineTo(8, 0);
        tree.closePath();
        tree.endFill();
        // Trunk
        tree.beginFill(0x4a3520);
        tree.drawRect(-2, 0, 4, 6);
        tree.endFill();
        break;

      case 'palm':
        // Palm tree shape
        break;

      case 'oak':
        // Round tree
        break;
    }

    return tree;
  }
}
```

**Tasks:**
- [ ] Create decoration generation system
- [ ] Implement tree sprites (evergreen, palm, oak)
- [ ] Implement cacti sprites
- [ ] Implement farm buildings
- [ ] Implement city buildings
- [ ] Add mountains and terrain features
- [ ] Respect region boundaries

### Step 5.3: Add Weather Effects (Optional Enhancement)

**File:** `src/components/factoryMap/effects/WeatherEffects.js`

```javascript
class WeatherEffects extends PIXI.Container {
  constructor() {
    super();
    this.name = 'weatherEffects';
  }

  addRainEffect(region, bounds) {
    // Particle system for rain
  }

  addHeatShimmer(region, bounds) {
    // Displacement filter for heat wave effect
  }

  addClouds(region, bounds) {
    // Animated cloud sprites
  }
}
```

**Tasks:**
- [ ] Create particle system for rain (Pacific NW)
- [ ] Create heat shimmer effect (Southwest)
- [ ] Create cloud animations
- [ ] Create tumbleweed animations (Texas)
- [ ] Add seasonal variations (optional)

---

## Phase 6: Level of Detail & Performance

**Goal:** Optimize rendering for smooth performance at all zoom levels

### Step 6.1: Implement LOD System

**File:** `src/components/factoryMap/systems/LODManager.js`

```javascript
class LODManager {
  constructor(layers) {
    this.layers = layers;
    this.currentLOD = 'zoom_100';
  }

  updateLOD(zoom) {
    const newLOD = this.getLODLevel(zoom);

    if (newLOD !== this.currentLOD) {
      this.currentLOD = newLOD;
      this.applyLODSettings(LOD_SETTINGS[newLOD]);
    }
  }

  getLODLevel(zoom) {
    if (zoom <= 0.25) return 'zoom_25';
    if (zoom <= 0.5) return 'zoom_50';
    if (zoom <= 1) return 'zoom_100';
    if (zoom <= 1.5) return 'zoom_150';
    return 'zoom_200';
  }

  applyLODSettings(settings) {
    // Show/hide layers based on settings
    this.layers.decorations.visible = settings.show_decorations !== false;
    this.layers.weather.visible = settings.show_weather !== false;

    // Simplify sprites at lower zoom
    if (settings.show_factories === 'dots') {
      this.layers.factories.showSimplified();
    } else {
      this.layers.factories.showDetailed();
    }

    // Toggle animations
    this.layers.factories.setAnimationsEnabled(settings.show_factories.includes('animated'));
    this.layers.trucks.setAnimationsEnabled(settings.show_trucks.includes('animated'));
  }
}
```

**Tasks:**
- [ ] Create LODManager class
- [ ] Define LOD thresholds
- [ ] Implement layer visibility switching
- [ ] Implement sprite simplification at low zoom
- [ ] Disable animations at low zoom

### Step 6.2: Implement Sprite Culling

**File:** `src/components/factoryMap/systems/CullingSystem.js`

```javascript
class CullingSystem {
  constructor(app, mapContainer) {
    this.app = app;
    this.container = mapContainer;
    this.margin = 100; // px buffer
  }

  update() {
    const bounds = this.getViewBounds();

    this.container.children.forEach(layer => {
      if (layer.children) {
        layer.children.forEach(sprite => {
          sprite.visible = this.isInView(sprite, bounds);
        });
      }
    });
  }

  getViewBounds() {
    const scale = this.container.scale.x;
    const pos = this.container.position;

    return {
      left: (-pos.x / scale) - this.margin,
      right: (-pos.x / scale) + (this.app.view.width / scale) + this.margin,
      top: (-pos.y / scale) - this.margin,
      bottom: (-pos.y / scale) + (this.app.view.height / scale) + this.margin
    };
  }

  isInView(sprite, bounds) {
    return sprite.x >= bounds.left && sprite.x <= bounds.right &&
           sprite.y >= bounds.top && sprite.y <= bounds.bottom;
  }
}
```

**Tasks:**
- [ ] Create CullingSystem class
- [ ] Calculate visible viewport bounds
- [ ] Update sprite visibility on pan/zoom
- [ ] Optimize update frequency (debounce)

### Step 6.3: Add Mini-Map

**File:** `src/components/factoryMap/MiniMap.jsx`

```javascript
const MiniMap = ({ mapDimensions, viewportBounds, onNavigate }) => {
  const scale = 0.05; // 5% of actual size

  const viewboxStyle = {
    left: `${viewportBounds.x * scale}px`,
    top: `${viewportBounds.y * scale}px`,
    width: `${viewportBounds.width * scale}px`,
    height: `${viewportBounds.height * scale}px`,
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    onNavigate(x, y);
  };

  return (
    <div className="absolute bottom-4 right-4 w-40 h-24 bg-slate-800/80 rounded border border-slate-600">
      {/* Simplified map */}
      <div className="w-full h-full relative" onClick={handleClick}>
        {/* US outline */}
        <svg className="w-full h-full opacity-50">
          {/* Simplified path */}
        </svg>

        {/* Factory dots */}
        {Object.entries(FACTORY_LOCATIONS).map(([code, loc]) => (
          <div
            key={code}
            className="absolute w-1 h-1 bg-orange-500 rounded-full"
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
          />
        ))}

        {/* Current viewport indicator */}
        <div className="absolute border-2 border-orange-400" style={viewboxStyle} />
      </div>
    </div>
  );
};
```

**Tasks:**
- [ ] Create MiniMap component
- [ ] Render simplified US outline
- [ ] Show factory locations as dots
- [ ] Show current viewport rectangle
- [ ] Enable click-to-navigate
- [ ] Update viewport indicator on pan/zoom

---

## Phase 7: Integration & Polish

### Step 7.1: Add Sidebar Navigation

**File:** Update `src/components/layout/Sidebar.jsx`

```javascript
// Add to navigation items
{
  name: 'Factory Map',
  href: '/factory-map',
  icon: MapIcon,  // from lucide-react or heroicons
  current: pathname === '/factory-map'
}
```

**Tasks:**
- [ ] Add Factory Map to sidebar navigation
- [ ] Choose appropriate map icon
- [ ] Handle active state

### Step 7.2: Add Filter Controls

**File:** `src/components/factoryMap/MapFilters.jsx`

```javascript
const MapFilters = ({ filters, onFilterChange }) => {
  return (
    <div className="absolute top-4 right-4 bg-slate-800/90 rounded-lg p-3">
      <h4 className="text-sm font-semibold mb-2">Filters</h4>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.showInTransit}
          onChange={(e) => onFilterChange({ showInTransit: e.target.checked })}
        />
        Show In-Transit Deliveries
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.showDelivered}
          onChange={(e) => onFilterChange({ showDelivered: e.target.checked })}
        />
        Show Delivered (This Month)
      </label>

      <select
        value={filters.timeRange}
        onChange={(e) => onFilterChange({ timeRange: e.target.value })}
        className="mt-2 w-full bg-slate-700 rounded"
      >
        <option value="week">Last Week</option>
        <option value="month">Last Month</option>
        <option value="quarter">Last Quarter</option>
        <option value="all">All Time</option>
      </select>
    </div>
  );
};
```

**Tasks:**
- [ ] Create filter panel component
- [ ] Implement delivery status filters
- [ ] Implement time range filter
- [ ] Implement factory toggle
- [ ] Connect filters to map layers

### Step 7.3: Add Stats Dashboard

**File:** `src/components/factoryMap/MapStats.jsx`

```javascript
const MapStats = ({ stats }) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
      <StatCard icon="🏭" value={stats.activeFactories} label="Active Factories" />
      <StatCard icon="🚚" value={stats.inTransit} label="In Transit" />
      <StatCard icon="📦" value={stats.deliveredThisMonth} label="Delivered This Month" />
    </div>
  );
};
```

**Tasks:**
- [ ] Create stats cards component
- [ ] Fetch aggregate statistics
- [ ] Position at bottom of map

### Step 7.4: Real-time Updates

```javascript
// Subscribe to project changes
useEffect(() => {
  const subscription = supabase
    .channel('project-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'projects'
    }, (payload) => {
      // Update relevant sprites
      refreshMapData();
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

**Tasks:**
- [ ] Set up Supabase real-time subscription
- [ ] Handle project status changes
- [ ] Animate new deliveries (truck spawn)
- [ ] Animate completed deliveries (truck arrival)

---

## File Structure Summary

```
src/
├── pages/
│   └── FactoryMapPage.jsx
│
├── components/
│   └── factoryMap/
│       ├── index.js
│       ├── PixiMapCanvas.jsx
│       ├── MapControls.jsx
│       ├── MapFilters.jsx
│       ├── MapStats.jsx
│       ├── MapTooltip.jsx
│       ├── MiniMap.jsx
│       │
│       ├── layers/
│       │   ├── USMapLayer.js
│       │   ├── TerrainLayer.js
│       │   ├── DecorationsLayer.js
│       │   ├── RoutesLayer.js
│       │   ├── FactoriesLayer.js
│       │   ├── JobSitesLayer.js
│       │   └── TrucksLayer.js
│       │
│       ├── sprites/
│       │   ├── FactorySprite.js
│       │   ├── JobSiteSprite.js
│       │   └── TruckSprite.js
│       │
│       ├── systems/
│       │   ├── ViewportController.js
│       │   ├── LODManager.js
│       │   └── CullingSystem.js
│       │
│       ├── effects/
│       │   └── WeatherEffects.js
│       │
│       ├── data/
│       │   ├── factoryLocations.js
│       │   ├── regionBoundaries.js
│       │   └── stateCoordinates.js
│       │
│       └── utils/
│           ├── geocoding.js
│           └── bezierPath.js
│
├── hooks/
│   └── useFactoryMapData.js
│
└── assets/
    └── spritesheets/
        └── (future sprite assets)
```

---

## Execution Checklist

### Phase 1: Foundation (Start Here)
- [ ] Install pixi.js dependency
- [ ] Create FactoryMapPage.jsx
- [ ] Create PixiMapCanvas.jsx with basic Pixi setup
- [ ] Implement ViewportController (pan/zoom at any level)
- [ ] Create MapControls.jsx
- [ ] Add route and sidebar navigation

### Phase 2: Factories
- [ ] Create factory locations data
- [ ] Create FactorySprite class
- [ ] Create FactoriesLayer
- [ ] Render all factories at correct positions

### Phase 3: Tooltips
- [ ] Create MapTooltip component
- [ ] Create tooltip content components
- [ ] Connect Pixi events to React state
- [ ] Fetch live data on hover

### Phase 4: Job Sites & Trucks
- [ ] Create JobSiteSprite
- [ ] Create state coordinates mapping
- [ ] Create RoutesLayer with bezier paths
- [ ] Create TruckSprite with animation

### Phase 5: Terrain (Enhancement)
- [ ] Create TerrainLayer
- [ ] Create DecorationsLayer
- [ ] Generate regional decorations

### Phase 6: Performance
- [ ] Implement LODManager
- [ ] Implement CullingSystem
- [ ] Create MiniMap

### Phase 7: Polish
- [ ] Add filter controls
- [ ] Add stats dashboard
- [ ] Set up real-time updates
- [ ] Testing and bug fixes

---

## Notes

- **MVP Path:** Phases 1-3 provide a functional map with factories and tooltips
- **Full Feature:** All 7 phases for complete vision
- **Sprite Assets:** Initially use programmatic graphics; upgrade to pixel art sprites later
- **Testing:** Test on different screen sizes and zoom levels throughout

Ready to execute when you give the go-ahead!
