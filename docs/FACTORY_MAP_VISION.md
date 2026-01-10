# Factory Map - Vision Board & Game Plan

**Feature:** Animated Isometric US Map with Live Factory & Delivery Visualization
**Status:** Planning Phase
**Created:** January 10, 2026

---

## 🎯 Concept Overview

An interactive, animated map page showing all Sunbelt factories across the US in a fun, retro 8-bit/isometric style. The map visualizes:
- Factory locations with animated smokestacks
- Active deliveries as trucks traveling to destinations
- Real-time project status integration

**Inspiration:** SimCity, RollerCoaster Tycoon, Factorio, old-school logistics games

---

## 🎨 Visual Style Guide

### Aesthetic
- **Style:** Clean isometric pixel art (16-bit era feel, not too retro)
- **Perspective:** 2:1 isometric (classic game standard)
- **Color Palette:**
  ```
  Background:     #0a0a14 (dark navy, matches app theme)
  Land Mass:      #1a2a3a → #2a3a4a (gradient, subtle terrain)
  Water:          #0d1929 (darker than land)
  Factory Base:   #3a3a4a (industrial gray)
  Factory Accent: #f97316 (Sunbelt orange)
  Smoke:          #ffffff → transparent (animated)
  Roads/Paths:    #4a5568 with #f97316 dashed animation
  Truck:          #f97316 (orange branded trucks)
  Delivery Dots:  #22c55e (green = delivered), #f59e0b (yellow = in transit)
  ```

### Map Design
```
    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │         🏭 NWBS                                             │
    │        (Washington)            🏭 BRIT                      │
    │              ╲                 (Montana?)                   │
    │               ╲                                             │
    │    🏭 MM       ╲                                            │
    │   (California)  ╲         🏭 MG                             │
    │        │         ╲       (Midwest)                          │
    │        │          ╲           │                             │
    │        ▼           ╲          │      🏭 WM-EAST             │
    │    [Delivery]       ╲         │     (East Coast)            │
    │                      ╲        │          │                  │
    │   🏭 PMI              ╲       │          ▼                  │
    │  (SoCal)    🏭 AMTEX   ╲      │     [Delivery]              │
    │               (Texas)   ╲     │                             │
    │                  │       ╲    │    🏭 SEMO                  │
    │     🏭 SSI       │        ╲   │   (Southeast)               │
    │    (Texas)       │         ╲──┘                             │
    │        └─────────┴──────🚚──→ [Active Delivery]             │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
```

---

## 🏭 Factory Sprite Design

### Base Factory (32x48 pixels, isometric)
```
        ░░████░░░░████░░
        ░█░░░░█░░█░░░░█░      <- Smokestacks (animated smoke)
        ░█░░░░█░░█░░░░█░
        ░██████░░██████░
       ╱──────────────────╲
      ╱  ┌────┐  ┌────┐    ╲   <- Windows (orange glow)
     ╱   │ ▓▓ │  │ ▓▓ │     ╲
    ╱    └────┘  └────┘      ╲
   ╱  ╔══════════════════╗    ╲
  ╱   ║   FACTORY NAME   ║     ╲  <- Factory label
 ╱────╚══════════════════╝──────╲
╱▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╲ <- Base platform
```

### Smoke Animation Frames (CSS keyframes)
```
Frame 1:  ░      Frame 2:  ░░     Frame 3: ░░░    Frame 4:  ░░
           ░               ░░               ░░              ░
           █                █                █               █
```

### Factory States
- **Idle:** Slow smoke, dim windows
- **Active (has projects in production):** Fast smoke, bright orange windows, subtle pulse
- **Shipping:** Truck departing animation

---

## 🚚 Delivery Truck Design

### Truck + Modular Unit (24x16 pixels)
```
  ┌─────────────────┐
  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  <- Modular unit (beige/tan)
  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
  └─────────────────┘
     ┌───────┐
     │ 🟠🟠🟠 │  <- Cab (Sunbelt orange)
     │ ○   ○ │  <- Wheels
     └───────┘
```

### Truck Animation
- Subtle bounce as it moves (wheels animation)
- Follows curved paths (bezier curves)
- Dust trail particles behind
- Speed: ~5 seconds to cross map

---

## 📍 Location Markers

### Factory Marker
```
    ╱╲
   ╱🏭╲   <- Factory icon
   ╲  ╱
    ╲╱
    │
    ●     <- Pin point
```

### Delivery Destination
```
   ╭───╮
   │ 📦 │  <- Package/building icon
   ╰───╯
     │
     ▼    <- Pulsing indicator
```

---

## 🗺️ Map Layout

### US Regions with Factory Positions
```javascript
const FACTORY_LOCATIONS = {
  'NWBS': { x: 12, y: 15, name: 'Northwest Building Systems', state: 'WA' },
  'WM-WEST': { x: 10, y: 35, name: 'Whitley Manufacturing West', state: 'CA' },
  'WM-EAST': { x: 82, y: 40, name: 'Whitley Manufacturing East', state: 'NC' },
  'MM': { x: 8, y: 45, name: 'Mobile Modular', state: 'CA' },
  'SSI': { x: 45, y: 70, name: 'Sunbelt Structures', state: 'TX' },
  'MS': { x: 75, y: 35, name: 'ModSpace', state: 'PA' },
  'MG': { x: 60, y: 45, name: 'Modular Genius', state: 'MD' },
  'SEMO': { x: 78, y: 55, name: 'Southeast Modular', state: 'GA' },
  'PMI': { x: 12, y: 55, name: 'Palomar Modular', state: 'CA' },
  'AMTEX': { x: 40, y: 65, name: 'AmTex Modular', state: 'TX' },
  'BRIT': { x: 15, y: 10, name: 'Britco', state: 'WA' },
  'CB': { x: 55, y: 50, name: 'C&B Modular', state: 'TN' },
  'IND': { x: 65, y: 38, name: 'Indicom', state: 'OH' },
  'MRS': { x: 50, y: 42, name: 'Mr. Steel', state: 'MO' }
};
```

---

## 🔧 Technical Architecture

### Option A: CSS + SVG (Recommended for MVP)
**Pros:** Simpler, performant, easier to maintain
**Cons:** Limited pixel-perfect control

```
Components:
├── FactoryMapPage.jsx      <- Main page container
├── IsometricMap.jsx        <- SVG map with US shape
├── FactorySprite.jsx       <- Individual factory component
├── DeliveryTruck.jsx       <- Animated truck on path
├── SmokeAnimation.jsx      <- Reusable smoke effect
├── MapLegend.jsx           <- Stats overlay
└── factoryMapUtils.js      <- Coordinate calculations
```

### Option B: HTML5 Canvas
**Pros:** Full pixel art control, game-like feel
**Cons:** More complex, harder to integrate with React

### Option C: Pixi.js
**Pros:** Professional 2D rendering, sprite sheets
**Cons:** Additional dependency, steeper learning curve

### Recommendation: **Option A for MVP**, upgrade to Canvas/Pixi if needed

---

## 📊 Data Integration

### Required Data
```javascript
// From projects table
{
  id: 'uuid',
  name: 'Project Name',
  factory: 'NWBS - Northwest Building Systems',  // Extract code
  status: 'In Progress',  // or 'Shipping', 'Completed'
  delivery_state: 'CA',   // For destination plotting
  delivery_city: 'Los Angeles',
  delivery_date: '2026-02-15'
}

// Derived delivery status
{
  project_id: 'uuid',
  from_factory: 'NWBS',
  to_location: { x: 10, y: 45 },  // Calculated from address
  status: 'in_transit' | 'delivered' | 'scheduled',
  progress: 0.65  // For truck position along path
}
```

### Real-time Updates
- Supabase subscription for project status changes
- Truck positions update every few seconds
- New deliveries trigger truck spawn animation

---

## 🎮 Interactions

### Hover States
- **Factory:** Popup with name, active projects count, recent deliveries
- **Truck:** Popup with project name, destination, ETA
- **Delivery Point:** Project details

### Click Actions
- **Factory:** Navigate to filtered projects list
- **Truck:** Navigate to project detail
- **Delivery Point:** Navigate to project detail

### Controls
- **Zoom:** Mouse wheel or +/- buttons
- **Pan:** Click and drag (optional)
- **Filter:** Toggle delivery status visibility
- **Time Range:** Show deliveries from last week/month/all

---

## 📐 UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Factory Network Map                              [Filter ▼] [⚙️]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │                    [ ISOMETRIC MAP ]                        │   │
│   │                                                             │   │
│   │     🏭~~~~         🏭~~~~                                   │   │
│   │      NWBS           BRIT                                    │   │
│   │         ╲                                                   │   │
│   │    🏭    ╲                    🏭~~~~                        │   │
│   │    MM     ╲                  WM-EAST                        │   │
│   │     │      🚚═══════════════════►📦                         │   │
│   │     ▼                                                       │   │
│   │    📦        🏭        🏭                                   │   │
│   │             SSI      SEMO                                   │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│   │ 🏭 14        │ │ 🚚 5         │ │ 📦 127       │               │
│   │ Active       │ │ In Transit   │ │ Delivered    │               │
│   │ Factories    │ │ Deliveries   │ │ This Month   │               │
│   └──────────────┘ └──────────────┘ └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Phases

### Phase 1: Static Map (MVP)
- [ ] Create FactoryMapPage component
- [ ] SVG-based US map outline (simplified)
- [ ] Position factory markers at correct locations
- [ ] Basic factory sprite (CSS/SVG)
- [ ] Add to sidebar navigation
- [ ] Stats cards at bottom

### Phase 2: Animations
- [ ] Smoke animation on factories
- [ ] Factory glow/pulse for active ones
- [ ] Hover tooltips with project info

### Phase 3: Delivery Visualization
- [ ] Path lines from factory to delivery locations
- [ ] Animated truck sprites
- [ ] Truck movement along paths
- [ ] Delivery point markers

### Phase 4: Data Integration
- [ ] Connect to projects database
- [ ] Calculate delivery positions
- [ ] Filter by time range
- [ ] Real-time updates (Supabase realtime)

### Phase 5: Polish
- [ ] Zoom/pan controls
- [ ] Click to navigate
- [ ] Sound effects (optional, muted by default)
- [ ] Mobile responsive version
- [ ] Performance optimization

---

## 🎨 Asset Requirements

### Sprites Needed
1. Factory building (3 sizes: small, medium, large)
2. Smoke particles (4-frame animation)
3. Delivery truck + trailer
4. Truck wheels (spinning animation)
5. Delivery destination marker
6. US map outline (simplified isometric)

### Asset Options
- **Create custom:** Pixel art in Aseprite/Piskel
- **Use library:** Kenney.nl (free game assets)
- **CSS-only:** Shapes with CSS transforms

### Recommended: Start CSS-only, replace with sprites later

---

## 📝 Questions to Resolve

1. **Exact factory locations?** - Need real addresses for accurate positioning
2. **Delivery location granularity?** - State-level or city-level?
3. **How many active deliveries typically?** - For performance planning
4. **Offline/demo mode?** - Should it work without live data?
5. **Mobile experience?** - Simplified or same features?

---

## 🗓️ Estimated Timeline

| Phase | Effort | Description |
|-------|--------|-------------|
| Phase 1 | 2-3 days | Static map with factories |
| Phase 2 | 1-2 days | Animations |
| Phase 3 | 2-3 days | Delivery trucks & paths |
| Phase 4 | 1-2 days | Data integration |
| Phase 5 | 1-2 days | Polish & interactions |

**Total: ~8-12 days for full feature**

---

## 💡 Future Enhancements

- Weather effects overlay (rain, snow in regions)
- Day/night cycle based on real time
- Factory production progress bars
- Historical delivery replay (time-lapse)
- Achievement badges (1000th delivery!)
- Sound effects (truck horn, factory ambience)
- Seasonal decorations (snow in winter, etc.)

---

## Next Steps

1. ✅ Vision board complete
2. ⏳ Review and get feedback
3. ⏳ Decide on technical approach
4. ⏳ Create basic page structure
5. ⏳ Build factory sprites
6. ⏳ Implement animations
7. ⏳ Connect data
