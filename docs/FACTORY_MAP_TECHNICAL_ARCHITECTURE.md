# Factory Map - Technical Architecture Document

## System Overview

The Factory Map is a gamified, interactive visualization system built with PIXI.js v8 and React 19 that displays the Sunbelt PM network in real-time. It transforms project management data into an engaging strategy game-style interface.

---

## Technology Stack

### Core Technologies
- **Rendering Engine:** PIXI.js v8.15.0 (WebGL 2D)
- **Framework:** React 19.2.3
- **Language:** JavaScript/JSX
- **Build Tool:** Vite 7.3.0

### Key Libraries
- `pixi.js` - WebGL rendering and sprite management
- `react` - Component architecture and state management
- `react-router-dom` - Page routing

---

## Architecture Layers

### 1. React Component Layer

#### FactoryMapPage.jsx / FactoryMapFullscreen.jsx
**Purpose:** Top-level React components that manage state and user interactions

**Responsibilities:**
- Fetch project and delivery data from API
- Manage UI state (panels, tooltips, selections)
- Handle user interactions (clicks, hovers)
- Pass data down to PIXI canvas wrapper

**Key State:**
```javascript
{
  projects: [],           // Active projects
  deliveries: [],         // Delivery tracking data
  factoryStats: {},       // Factory metrics (project counts)
  highlightedFactory: null, // Currently selected factory
  hoveredElement: null,   // Current hover target
  selectedPanel: null     // Open detail panel
}
```

#### PixiMapCanvas.jsx
**Purpose:** React wrapper for PIXI.js application

**Responsibilities:**
- Initialize PIXI application
- Create and manage layers
- Handle canvas resize
- Bridge React state to PIXI systems
- Expose imperative API (panTo, setZoom, etc.)

**Lifecycle:**
```javascript
// Mount: Initialize PIXI
useEffect(() => {
  const app = new PIXI.Application();
  await app.init({ ... });
  // Create layers
  // Setup event handlers
  // Start animation loop
}, []);

// Data Updates: Sync to PIXI
useEffect(() => {
  layersRef.current.factories.updateStats(factoryStats);
}, [factoryStats]);

// Cleanup: Destroy PIXI
return () => {
  app.destroy(true, { children: true });
};
```

---

### 2. PIXI Layer System

Layers are rendered in order (bottom to top):

#### Layer 1: USMapLayer
**File:** `src/components/factoryMap/layers/USMapLayer.js`

**Purpose:** Background map rendering

**Contains:**
- Ocean background (dark blue)
- US land mass outline (simplified polygon)
- Regional coloring (based on REGION_CONFIG)
- Coastline details (wave decorations)
- Grid overlay (subtle lines)
- Terrain features (mountains, rivers, forests)

**Key Methods:**
```javascript
createBackground()     // Ocean fill
createUSOutline()      // Country polygon
createRegions()        // Regional tinting
createCoastlines()     // Wave details
createGrid()           // Grid overlay
addDecoration(type, x, y)  // Add terrain sprites
```

---

#### Layer 2: TerrainLayer
**File:** `src/components/factoryMap/layers/TerrainLayer.js`

**Purpose:** Ambient terrain decorations

**Contains:**
- Trees (forests, swaying animation)
- Mountains (stylized peaks)
- Desert elements (cacti, heat shimmer)
- Water features (animated rivers, lakes)

**Density Levels:**
- `low`: Minimal decorations, better performance
- `medium`: Balanced detail (default)
- `high`: Maximum detail, decorative

---

#### Layer 3: RoutesLayer
**File:** `src/components/factoryMap/layers/RoutesLayer.js`

**Purpose:** Delivery route visualization

**Route States:**
1. **Scheduled** (gray, dotted, static)
2. **Active** (orange, dashed, animated)
3. **Shipping** (bright orange, pulsing, truck present)
4. **Completed** (green, faded, temporary)

**Key Data Structure:**
```javascript
{
  id: 'project-123',
  from: { x, y },           // Factory position
  to: { x, y },             // Job site position
  controlPoint: { x, y },   // Bezier curve control
  status: 'active',
  color: 0xf97316,
  animated: true,
  dashOffset: 0,            // For animation
  factoryCode: 'DAL'        // For highlighting
}
```

**Path Calculation:**
- Uses quadratic bezier curves
- Control point: midpoint offset upward by 80-120px
- Creates natural arc effect

**Animation:**
```javascript
update(deltaTime) {
  routes.forEach(route => {
    if (route.animated) {
      route.dashOffset += deltaTime * 0.5;
      this.drawRoute(route.graphics, route);
    }
  });
}
```

---

#### Layer 4: JobSitesLayer
**File:** `src/components/factoryMap/layers/JobSitesLayer.js`

**Purpose:** Construction site rendering and progression

**Job Site Stages:**
1. **Created** - Dirt patch only
2. **Early Progress** - Dirt + barriers + equipment
3. **Foundation** - Concrete stem wall visible
4. **Online/Delivered** - Modular building appears
5. **Completed** - Building with landscaping
6. **Fade Out** - After 60 days

**Sprite Components:**
- Dirt pad (brown textured rectangle)
- Construction barriers (orange/white)
- Equipment (excavator, bulldozer, crane)
- Foundation (gray concrete outline)
- Modular building (tan with windows, door, roof)
- Landscaping (shrubs, gravel)

**Position Calculation:**
```javascript
// Uses state coordinates with deterministic jitter
const pos = getStatePixelPosition(
  project.delivery_state,
  MAP_WIDTH,
  MAP_HEIGHT,
  project.id  // Seed for consistent placement
);
```

---

#### Layer 5: FactoriesLayer
**File:** `src/components/factoryMap/layers/FactoriesLayer.js`

**Purpose:** Factory sprite management

**Container for:**
- 14 FactorySprite instances (one per factory)
- Factory event routing (hover, click)
- Stats updates (project counts)

**Factory Locations:**
```javascript
FACTORY_LOCATIONS = {
  'NWBS': { x: 12, y: 12, name: 'Northwest Building Systems', ... },
  'BRIT': { x: 15, y: 8, name: 'Britco', ... },
  // ... 12 more factories
}
```

---

#### Layer 6: TrucksLayer
**File:** `src/components/factoryMap/layers/TrucksLayer.js`

**Purpose:** Animated delivery truck management

**Contains:**
- Map of active truck sprites
- Truck movement along route paths
- Progress tracking (0.0 to 1.0)
- Arrival event triggering

**Truck Lifecycle:**
```javascript
// Create truck
trucks.addTruck(deliveryId, deliveryData, routePath);

// Update each frame
update(deltaTime) {
  trucks.forEach(truck => {
    truck.update(deltaTime);
    if (truck.isComplete()) {
      this.emit('truck:arrived', { deliveryId, ... });
      this.removeTruck(deliveryId);
    }
  });
}
```

---

#### Layer 7: CelebrationParticles
**File:** `src/components/factoryMap/effects/CelebrationParticles.js`

**Purpose:** Particle effects for completion events

**Triggers:**
- Project delivery completion
- Milestone achievements
- Special events

**Particle Properties:**
```javascript
{
  x, y,                  // Position
  vx, vy,                // Velocity
  life: 1.0,             // Lifetime (1.0 → 0.0)
  color: 0xf97316,       // Particle color
  scale: 1.0,            // Size
  alpha: 1.0             // Opacity
}
```

---

### 3. Sprite Classes

#### FactorySprite.js
**Extends:** `PIXI.Container`

**Structure:**
```
FactorySprite (Container)
├── building (Graphics)
│   ├── Base platform (isometric diamond)
│   ├── Left wall face
│   ├── Right wall face
│   ├── Roof
│   ├── Windows (6x, glowing if active)
│   ├── Door
│   └── Sunbelt stripe
├── smokestackContainer (Container)
│   ├── Smokestack 1 (Graphics + smoke particles)
│   └── Smokestack 2 (Graphics + smoke particles)
├── labelBg (Graphics - pill shape)
├── labelText (Text - factory code)
└── statsBadge (Container)
    ├── Circle background (Graphics)
    └── Count text (Text)
```

**States:**
- **Idle:** Slow smoke, dark windows, no glow
- **Active:** Fast smoke, glowing windows, orange aura

**Animations:**
```javascript
update(deltaTime) {
  // Smoke particles physics
  smokeParticles.forEach(smoke => {
    smoke.y -= deltaTime * 0.5;           // Rise
    smoke.x += Math.sin(time) * 0.2;      // Drift
    smoke.alpha = fadeInOut(progress);     // Fade
    smoke.scale.set(0.5 + progress * 1.5); // Grow
  });
}
```

**Events:**
- `factory:hover` - Mouse enters factory bounds
- `factory:hoverend` - Mouse leaves factory bounds
- `factory:click` - User clicks factory

---

#### TruckSprite.js
**Extends:** `PIXI.Container`

**Structure:**
```
TruckSprite (Container)
├── dustContainer (Container)
│   └── dustParticles[] (Graphics - 5 particles)
└── truck (Container)
    ├── trailer (Graphics - tan rectangle)
    │   └── windows[] (Graphics - 3 windows)
    ├── cab (Graphics - orange)
    │   └── window (Graphics - windshield)
    └── wheels[] (Container - 3 wheels)
        ├── outer (Graphics - black circle)
        └── detail (Graphics - gray center)
```

**Movement:**
```javascript
// Follows bezier curve path
updatePosition(progress) {
  const { from, to, controlPoint } = this.routePath;
  const t = this.progress;

  // Quadratic bezier formula
  const x = (1-t)² * from.x + 2(1-t)t * control.x + t² * to.x;
  const y = (1-t)² * from.y + 2(1-t)t * control.y + t² * to.y;

  this.position.set(x, y);

  // Calculate rotation from velocity
  const dx = derivative_x(t);
  const dy = derivative_y(t);
  this.truck.rotation = Math.atan2(dy, dx);
}
```

**Animations:**
- Wheel rotation (continuous spin)
- Dust particles trailing behind
- Exhaust puffs from stack
- Bounce effect while moving

---

### 4. System Controllers

#### ViewportController.js
**Purpose:** Camera control (pan, zoom, keyboard navigation)

**Features:**
- Mouse drag panning
- Mouse wheel zooming
- Keyboard shortcuts (arrow keys, 1-9 factory jump)
- Smooth animated transitions
- Bounds clamping (keep map in view)

**Key Methods:**
```javascript
panTo(x, y, animate = false)  // Move camera to position
setZoom(level)                 // Set zoom level (0.25 - 2.0)
resetView()                    // Return to initial view
jumpToFactory(code)            // Animate to factory location
```

**Zoom Levels:**
- Min: 0.25 (entire USA visible)
- Initial: 0.6 (balanced view)
- Max: 2.0 (close detail)

---

#### LODManager.js
**Purpose:** Level of Detail optimization for performance

**LOD Tiers:**

**Tier 1 (zoom < 0.5):**
- Simplified factory sprites
- No trucks rendered
- Thin route lines
- No animations (or very slow)
- Minimal draw calls

**Tier 2 (zoom 0.5 - 1.0):**
- Medium factory sprites
- Trucks visible (simplified)
- Standard routes
- Basic animations
- Moderate draw calls

**Tier 3 (zoom >= 1.0):**
- Full detail factories
- Detailed trucks with particles
- Thick routes with effects
- All animations active
- Maximum visual quality

**Dynamic Adjustment:**
```javascript
update(zoom) {
  const newTier = calculateTier(zoom);
  if (newTier !== currentTier) {
    this.transitionToTier(newTier);
  }
}

shouldAnimate() {
  return currentFPS > 30 && currentTier >= 2;
}
```

---

## Data Flow

### 1. Initial Load
```
User navigates to page
    ↓
React component mounts
    ↓
Fetch projects & deliveries from API
    ↓
Initialize PIXI application
    ↓
Create all layers
    ↓
Pass data to layers
    ↓
Render frame
    ↓
Start animation loop
```

### 2. Data Updates
```
API data changes (polling or WebSocket)
    ↓
React state updates
    ↓
useEffect triggered
    ↓
Call layer update methods
    ↓
Layers reconcile sprites
    ↓
Add/remove/update sprites as needed
    ↓
Next frame renders changes
```

### 3. User Interaction
```
User clicks factory
    ↓
PIXI detects hit (hitArea check)
    ↓
FactorySprite emits 'factory:click' event
    ↓
FactoriesLayer bubbles event up
    ↓
PixiMapCanvas receives event via callback
    ↓
React component handles event
    ↓
Update state (selected factory, open panel)
    ↓
UI updates (panel slides in)
```

---

## Performance Optimizations

### 1. Object Pooling
**Purpose:** Reuse particles instead of creating/destroying

```javascript
class ParticlePool {
  constructor(size) {
    this.pool = [];
    for (let i = 0; i < size; i++) {
      this.pool.push(this.createParticle());
    }
  }

  acquire() {
    return this.pool.find(p => !p.active) || this.createParticle();
  }

  release(particle) {
    particle.active = false;
    particle.visible = false;
  }
}
```

### 2. Texture Atlases
**Purpose:** Reduce draw calls by batching sprites

```javascript
// Combine multiple sprites into single texture
const atlas = await PIXI.Assets.load('sprites/atlas.json');
const sprite = new PIXI.Sprite(atlas.textures['factory.png']);
```

### 3. Culling
**Purpose:** Don't render off-screen sprites

```javascript
update() {
  const viewport = this.getVisibleBounds();
  sprites.forEach(sprite => {
    sprite.visible = this.isInViewport(sprite, viewport);
  });
}
```

### 4. Throttling Updates
**Purpose:** Limit expensive operations

```javascript
let lastUpdate = 0;
const UPDATE_INTERVAL = 100; // ms

ticker.add((delta) => {
  const now = Date.now();
  if (now - lastUpdate > UPDATE_INTERVAL) {
    this.expensiveUpdate();
    lastUpdate = now;
  }
});
```

---

## Event System

### Layer Events
Layers emit events that bubble up to PixiMapCanvas:

```javascript
// Factory events
factories.on('factory:hover', (data) => {
  // data: { factoryData, screenX, screenY }
});

factories.on('factory:click', (data) => {
  // data: { factoryData, originalEvent }
});

// Truck events
trucks.on('truck:arrived', (data) => {
  // data: { deliveryId, deliveryData }
});

// Job site events
jobSites.on('jobsite:click', (data) => {
  // data: { projectData, screenX, screenY }
});
```

### Event Flow
```
User action (mouse click)
    ↓
PIXI eventMode='static' detects hit
    ↓
Sprite handler (onPointerTap)
    ↓
Sprite emits custom event
    ↓
Layer listens and re-emits
    ↓
PixiMapCanvas callback invoked
    ↓
React component handler
    ↓
State update
```

---

## File Structure

```
src/components/factoryMap/
├── FactoryMapPage.jsx              # Main page component
├── FactoryMapFullscreen.jsx        # Fullscreen variant
├── PixiMapCanvas.jsx               # PIXI wrapper
│
├── layers/
│   ├── USMapLayer.js               # Background map
│   ├── TerrainLayer.js             # Ambient decorations
│   ├── RoutesLayer.js              # Delivery routes
│   ├── FactoriesLayer.js           # Factory container
│   ├── JobSitesLayer.js            # Construction sites
│   └── TrucksLayer.js              # Delivery trucks
│
├── sprites/
│   ├── FactorySprite.js            # Individual factory
│   ├── TruckSprite.js              # Delivery truck
│   └── JobSiteSprite.js            # Construction site
│
├── systems/
│   ├── ViewportController.js       # Camera control
│   └── LODManager.js               # Performance optimization
│
├── effects/
│   └── CelebrationParticles.js    # Particle system
│
├── data/
│   └── factoryLocations.js        # Map coordinates
│
└── styles/
    └── FactoryMapPage.css         # Page styles
```

---

## API Integration

### Data Requirements

#### Projects Endpoint
**GET /api/projects**

```javascript
{
  id: string,
  name: string,
  status: 'In Progress' | 'Shipping' | 'Installation' | 'Completed',
  factory: string,              // "DAL - Dallas Factory"
  delivery_state: string,       // "TX"
  delivery_city: string,        // "Austin"
  online_date: Date,
  delivery_date: Date,
  delivery_progress: number,    // 0.0 - 1.0
  created_at: Date,
  completed_at: Date | null
}
```

#### Deliveries Endpoint
**GET /api/deliveries/active**

```javascript
{
  id: string,
  project_id: string,
  factory: string,
  delivery_state: string,
  delivery_city: string,
  status: 'Shipping',
  delivery_progress: number,    // 0.0 - 1.0 (truck position)
  estimated_arrival: Date
}
```

#### Factory Stats Endpoint
**GET /api/factories/stats**

```javascript
{
  'DAL': {
    activeProjects: 5,
    capacity: 10,
    utilizationRate: 0.5
  },
  // ... for each factory
}
```

---

## State Management

### React State Structure

```javascript
{
  // Data from API
  projects: Project[],
  deliveries: Delivery[],
  factoryStats: { [code: string]: FactoryStats },

  // UI State
  highlightedFactory: string | null,
  selectedProject: string | null,
  selectedFactory: string | null,
  hoveredElement: {
    type: 'factory' | 'truck' | 'jobsite',
    data: any,
    position: { x, y }
  } | null,

  // Panel State
  activePanel: 'factory' | 'project' | 'truck' | null,
  panelData: any | null,

  // View State
  zoom: number,
  viewportBounds: { x1, y1, x2, y2 }
}
```

### State Update Patterns

**Optimistic Updates:**
```javascript
// Update UI immediately, sync to API in background
const handleFactoryClick = (factoryData) => {
  setSelectedFactory(factoryData.code);
  fetchFactoryDetails(factoryData.code)
    .then(details => setFactoryDetails(details));
};
```

**Polling for Real-time Data:**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetchDeliveryUpdates().then(updates => {
      setDeliveries(updates);
    });
  }, 5000); // Every 5 seconds

  return () => clearInterval(interval);
}, []);
```

---

## Testing Strategy

### Unit Tests
- Sprite calculations (bezier paths, positions)
- LOD tier determination
- Coordinate transformations
- Event emission

### Integration Tests
- Layer initialization
- Data flow (React → PIXI)
- Event bubbling
- API integration

### Performance Tests
- FPS monitoring at different zoom levels
- Memory leak detection
- Sprite count limits
- Animation smoothness

### Visual Regression Tests
- Screenshot comparison
- Sprite positioning accuracy
- Animation consistency

---

## Deployment Considerations

### Build Optimization
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pixi': ['pixi.js'],
          'vendor': ['react', 'react-dom']
        }
      }
    }
  }
}
```

### Asset Loading
```javascript
// Preload essential assets
await PIXI.Assets.load([
  'sprites/factories.json',
  'sprites/trucks.json',
  'audio/background.mp3'
]);
```

### Error Handling
```javascript
try {
  await app.init({ ... });
} catch (error) {
  console.error('PIXI initialization failed:', error);
  // Show fallback UI
  showStaticMapFallback();
}
```

---

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### WebGL Requirements
- WebGL 2.0 support required
- Fallback to Canvas2D if WebGL unavailable

### Feature Detection
```javascript
const hasWebGL = (() => {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') ||
              canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
})();
```

---

## Future Enhancements

### Phase 2 Features
- Weather integration (real-time data)
- Day/night cycle
- Sound effects and music
- Historical playback mode

### Phase 3 Features
- Mobile responsive design
- Touch gesture support
- Offline mode with service worker
- Export to image/video

### Performance Improvements
- Web Workers for heavy calculations
- GPU particle systems
- Instanced rendering for identical sprites
- Lazy loading for distant regions

---

*Document Version: 1.0*
*Last Updated: 2026-01-11*
