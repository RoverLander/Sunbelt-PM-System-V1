# Factory Map: Standalone Implementation Plan

## Executive Summary

**Goal:** Build a standalone vanilla JavaScript + PIXI.js Factory Map that works independently of the React application.

**Timeline:** Estimated 8-12 hours of focused development
**Approach:** Extract existing PIXI code, create simple HTML/JS wrapper, deploy as separate app
**Integration:** Link from main app or embed via iframe

---

## Why Standalone?

### React Integration Issues (Lessons Learned)
1. **StrictMode double-mounting** breaks PIXI event listeners
2. **Synthetic events** intercept canvas wheel/mouse events
3. **Hot Module Reload** inconsistently updates PIXI components
4. **Component lifecycle** conflicts with PIXI's imperative canvas API
5. **Debugging complexity** from React + PIXI interaction

### Standalone Benefits
✅ **Direct control** - No React interference
✅ **Standard events** - Browser events work as documented
✅ **Simpler debugging** - Just vanilla JS + PIXI
✅ **Better performance** - No virtual DOM overhead
✅ **90% code reuse** - Layers/sprites already vanilla JS

---

## Architecture Overview

### Current Structure (React)
```
React App
  └─ PixiMapCanvas (React Component)
       ├─ PIXI Application
       ├─ ViewportController ⭐ Reusable
       ├─ LODManager ⭐ Reusable
       └─ Layers ⭐ Reusable
            ├─ USMapLayer
            ├─ FactoriesLayer
            ├─ RoutesLayer
            ├─ JobSitesLayer
            ├─ TrucksLayer
            └─ CelebrationParticles
```

### New Structure (Standalone)
```
index.html
  └─ app.js
       ├─ PIXI Application
       ├─ ViewportController ⭐ Copy from React version
       ├─ LODManager ⭐ Copy from React version
       └─ Layers ⭐ Copy from React version
            └─ (Same structure, just copy files!)
```

**Key Insight:** The React wrapper was only ~100 lines. The other ~3000 lines of PIXI code is pure JavaScript and 100% reusable!

---

## Implementation Plan

### Phase 1: Project Setup (30 minutes)

**Goal:** Create folder structure and HTML entry point

#### 1.1 Create Directory Structure
```bash
public/factory-map-standalone/
├── index.html          # Entry point
├── app.js              # Main initialization
├── config.js           # API URLs, auth
├── data-fetcher.js     # API calls
├── layers/             # Copy from src/components/factoryMap/layers/
├── sprites/            # Copy from src/components/factoryMap/sprites/
├── systems/            # Copy from src/components/factoryMap/systems/
├── effects/            # Copy from src/components/factoryMap/effects/
└── assets/             # Symlink to ../assets/
```

#### 1.2 Create index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sunbelt PM - Factory Map</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #0a0a14; font-family: sans-serif; }
    #map-canvas { display: block; }
    #loading { /* Loading screen styles */ }
    #error { /* Error screen styles */ }
  </style>
</head>
<body>
  <div id="loading">Loading Factory Map...</div>
  <div id="error" style="display: none;">Error loading map</div>

  <script type="module" src="./app.js"></script>
</body>
</html>
```

#### 1.3 Create config.js
```javascript
export const CONFIG = {
  API_BASE_URL: 'http://localhost:54321',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  MAP_WIDTH: 4000,
  MAP_HEIGHT: 2500,
  ENABLE_DEBUG_LOGS: true
};
```

---

### Phase 2: Copy PIXI Code (1 hour)

**Goal:** Transfer all reusable PIXI code from React version

#### 2.1 Copy Layers (Already Vanilla JS!)
```bash
cp -r src/components/factoryMap/layers/* public/factory-map-standalone/layers/
cp -r src/components/factoryMap/sprites/* public/factory-map-standalone/sprites/
cp -r src/components/factoryMap/systems/* public/factory-map-standalone/systems/
cp -r src/components/factoryMap/effects/* public/factory-map-standalone/effects/
```

#### 2.2 Copy Data Utilities
```bash
cp src/components/factoryMap/data/factoryLocations.js public/factory-map-standalone/data/
cp src/components/factoryMap/data/mapGeometry.js public/factory-map-standalone/data/
```

#### 2.3 Update Import Statements
- Change relative imports to work with new structure
- Remove any React-specific imports (useState, useEffect, etc.)
- Most files should work as-is!

---

### Phase 3: Create Main App (2 hours)

**Goal:** Initialize PIXI and wire up all systems

#### 3.1 Create app.js
```javascript
import * as PIXI from 'pixi.js';
import { ViewportController } from './systems/ViewportController.js';
import { LODManager } from './systems/LODManager.js';
import { USMapLayer } from './layers/USMapLayer.js';
import { FactoriesLayer } from './layers/FactoriesLayer.js';
import { RoutesLayer } from './layers/RoutesLayer.js';
import { JobSitesLayer } from './layers/JobSitesLayer.js';
import { TrucksLayer } from './layers/TrucksLayer.js';
import { CelebrationParticles } from './effects/CelebrationParticles.js';
import { CONFIG } from './config.js';
import { DataFetcher } from './data-fetcher.js';

class FactoryMapApp {
  constructor() {
    this.app = null;
    this.layers = {};
    this.viewport = null;
    this.lodManager = null;
    this.dataFetcher = new DataFetcher();
  }

  async init() {
    try {
      // Show loading screen
      document.getElementById('loading').style.display = 'flex';

      // Initialize PIXI Application
      this.app = new PIXI.Application();
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x0a0a14,
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        powerPreference: 'high-performance'
      });

      // Add canvas to DOM
      document.body.appendChild(this.app.canvas);

      // Create map container
      const mapContainer = new PIXI.Container();
      mapContainer.label = 'mapContainer';
      this.app.stage.addChild(mapContainer);

      // Initialize all layers (same as React version!)
      await this.createLayers(mapContainer);

      // Setup viewport controller (zoom/pan)
      this.setupViewport(mapContainer);

      // Setup LOD manager
      this.lodManager = new LODManager(this.layers);

      // Start animation loop
      this.app.ticker.add((ticker) => {
        const deltaTime = ticker.deltaTime;

        if (this.lodManager?.shouldAnimate()) {
          this.layers.factories.update(deltaTime);
          this.layers.jobSites.update(deltaTime);
          this.layers.trucks.update(deltaTime);
          this.layers.routes.update(deltaTime);
        }

        this.layers.celebration.update(deltaTime);
      });

      // Fetch and load data
      await this.loadData();

      // Hide loading screen
      document.getElementById('loading').style.display = 'none';

      console.log('[FactoryMapApp] Initialized successfully!');
    } catch (error) {
      console.error('[FactoryMapApp] Init error:', error);
      this.showError(error);
    }
  }

  async createLayers(mapContainer) {
    const dims = { width: CONFIG.MAP_WIDTH, height: CONFIG.MAP_HEIGHT };

    // Create layers in correct order (bottom to top)
    this.layers.usMap = new USMapLayer(dims);
    this.layers.routes = new RoutesLayer(dims);
    this.layers.jobSites = new JobSitesLayer(dims);
    this.layers.factories = new FactoriesLayer(dims);
    this.layers.trucks = new TrucksLayer(dims);
    this.layers.celebration = new CelebrationParticles();

    // Add to container
    mapContainer.addChild(this.layers.usMap);
    mapContainer.addChild(this.layers.routes);
    mapContainer.addChild(this.layers.jobSites);
    mapContainer.addChild(this.layers.factories);
    mapContainer.addChild(this.layers.trucks);
    mapContainer.addChild(this.layers.celebration);

    // Setup event listeners
    this.layers.trucks.on('truck:arrived', (data) => {
      const truck = this.layers.trucks.trucks.get(data.deliveryId);
      if (truck) {
        this.layers.celebration.celebrate(truck.x, truck.y, {
          particleCount: 40,
          spread: 180,
          duration: 2500
        });
      }
    });
  }

  setupViewport(mapContainer) {
    this.viewport = new ViewportController(this.app, mapContainer, {
      initialZoom: 0.6,
      minZoom: 0.25,
      maxZoom: 2.0,
      mapWidth: CONFIG.MAP_WIDTH,
      mapHeight: CONFIG.MAP_HEIGHT,
      onZoomChange: (zoom) => {
        if (this.lodManager) {
          this.lodManager.update(zoom);
        }
      }
    });
  }

  async loadData() {
    // Fetch factory stats
    const factoryStats = await this.dataFetcher.getFactoryStats();

    // Fetch active projects
    const projects = await this.dataFetcher.getProjects();

    // Fetch deliveries
    const deliveries = await this.dataFetcher.getDeliveries();

    // Load into layers
    // (Implementation details...)
  }

  showError(error) {
    document.getElementById('loading').style.display = 'none';
    const errorEl = document.getElementById('error');
    errorEl.textContent = `Error: ${error.message}`;
    errorEl.style.display = 'flex';
  }
}

// Initialize app when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new FactoryMapApp();
  app.init();
});

// Export for debugging
window.factoryMapApp = app;
```

---

### Phase 4: Data Fetching (1 hour)

**Goal:** Replace React hooks with fetch API

#### 4.1 Create data-fetcher.js
```javascript
import { CONFIG } from './config.js';

export class DataFetcher {
  constructor() {
    this.authToken = this.getAuthToken();
  }

  getAuthToken() {
    // Get from URL params, localStorage, or session
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || localStorage.getItem('sb-access-token');
  }

  async fetchAPI(endpoint) {
    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getFactoryStats() {
    // Implementation same as React hooks
    const { data, error } = await this.fetchAPI('/rest/v1/projects?select=*');
    if (error) throw error;

    // Process and return factory stats
    return this.processFactoryStats(data);
  }

  async getProjects() {
    // Implementation...
  }

  async getDeliveries() {
    // Implementation...
  }

  processFactoryStats(projects) {
    // Same logic as React version
    const stats = {};
    // ... processing logic ...
    return stats;
  }
}
```

---

### Phase 5: Authentication & Integration (1 hour)

**Goal:** Connect to main React app

#### 5.1 Main App Integration
Two options:

**Option A: Direct Link (Simpler)**
```jsx
// In main React app
<Link to="/factory-map-standalone">
  View Factory Map
</Link>
```

Add route in Vite config:
```javascript
// vite.config.js
export default {
  // ...
  server: {
    proxy: {
      '/factory-map-standalone': {
        target: 'http://localhost:5174/public/factory-map-standalone/index.html',
        changeOrigin: true
      }
    }
  }
}
```

**Option B: iframe Embed (More Integrated)**
```jsx
// In main React app
<iframe
  src="/factory-map-standalone/index.html"
  style={{ width: '100%', height: '100vh', border: 'none' }}
  onLoad={sendAuthToken}
/>
```

#### 5.2 Token Passing
**URL params (Simpler):**
```javascript
// Main app
window.open(`/factory-map-standalone/?token=${accessToken}`);

// Standalone app
const token = new URLSearchParams(window.location.search).get('token');
```

**postMessage (iframe):**
```javascript
// Main app → iframe
iframe.contentWindow.postMessage({
  type: 'AUTH_TOKEN',
  token: accessToken
}, '*');

// Standalone app receives
window.addEventListener('message', (event) => {
  if (event.data.type === 'AUTH_TOKEN') {
    localStorage.setItem('auth-token', event.data.token);
  }
});
```

---

### Phase 6: Testing & Polish (2 hours)

**Goal:** Ensure everything works as intended

#### 6.1 Core Functionality Tests
- [ ] Map loads without errors
- [ ] Factories appear at correct locations
- [ ] Mouse wheel zooms map (NOT scrolling page!)
- [ ] Click-drag pans map with momentum
- [ ] Sprites visible with correct positioning
- [ ] Factory sprites show Studio Ghibli buildings
- [ ] Hover tooltips work
- [ ] Click events fire correctly

#### 6.2 Data Integration Tests
- [ ] Factory stats load from API
- [ ] Projects appear as job sites
- [ ] Delivery routes render
- [ ] Trucks animate along routes
- [ ] Celebration particles trigger on delivery

#### 6.3 Performance Tests
- [ ] 60 FPS at medium zoom
- [ ] No memory leaks
- [ ] LOD system working
- [ ] Fast initial load (<3 seconds)

#### 6.4 Polish
- [ ] Add loading screen
- [ ] Add error handling
- [ ] Add "Back to Dashboard" button
- [ ] Add keyboard shortcuts
- [ ] Add mini-map (optional)
- [ ] Add debug panel (optional)

---

## File Checklist

### Files to Copy (No Changes Needed)
✅ All layer files (USMapLayer, FactoriesLayer, etc.)
✅ All sprite files (FactorySprite, TruckSprite, etc.)
✅ ViewportController.js
✅ LODManager.js
✅ CelebrationParticles.js
✅ factoryLocations.js
✅ mapGeometry.js

### Files to Create
⬜ index.html
⬜ app.js
⬜ config.js
⬜ data-fetcher.js
⬜ styles.css (optional)

### Files to Update
⬜ Fix import paths in copied files
⬜ Remove React-specific code (if any)

---

## Deployment

### Development
```bash
# Serve with Vite
npm run dev

# Access at:
http://localhost:5174/factory-map-standalone/
```

### Production Build
```bash
# Build standalone app
npm run build

# Output:
dist/factory-map-standalone/
```

### Hosting Options
1. **Same server as main app** - deploy to /factory-map/
2. **Separate subdomain** - map.sunbeltpm.com
3. **CDN** - for maximum performance
4. **iframe in main app** - feels more integrated

---

## Success Criteria

When implementation is complete, the standalone app should:

✅ Load independently without React
✅ Display all 14 factories with sprites
✅ Support zoom/pan without page scroll issues
✅ Fetch live data from Supabase
✅ Show routes and animated trucks
✅ Maintain 60 FPS performance
✅ Have < 3 second load time
✅ Pass authentication from main app
✅ Work in all major browsers

---

## Timeline Estimate

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| 1 | Project setup | 30 minutes |
| 2 | Copy PIXI code | 1 hour |
| 3 | Create main app | 2 hours |
| 4 | Data fetching | 1 hour |
| 5 | Authentication | 1 hour |
| 6 | Testing & polish | 2 hours |
| **Total** | | **7.5-8 hours** |

*Add buffer for debugging: 10-12 hours total*

---

## Risk Mitigation

### Potential Issues & Solutions

**Issue:** Import paths break after copying
**Solution:** Use find-and-replace to update all import statements

**Issue:** PIXI version mismatch
**Solution:** Use same version as main app (pixi.js v8.15.0)

**Issue:** Authentication doesn't work
**Solution:** Add debug logging, test with hardcoded token first

**Issue:** Performance worse than React version
**Solution:** Profile with Chrome DevTools, optimize draw calls

**Issue:** Sprites still not rendering
**Solution:** Start with programmatic fallback, add sprites later

---

## Next Steps

1. **Create project structure** - Make folders, copy files
2. **Build minimal working version** - Just map + one factory
3. **Test zoom/pan** - Verify event handling works
4. **Add data fetching** - Connect to API
5. **Full feature parity** - Match React version functionality
6. **Integration** - Link from main app

---

*Plan created: January 2026*
*Estimated completion: 1-2 days of focused work*
*Complexity: Low-Medium (mostly copying existing code)*
