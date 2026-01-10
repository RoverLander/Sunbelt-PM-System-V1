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

## 🔍 Zoom System & Map Scale

### Map Dimensions
- **Full map size:** 4000 x 2500 pixels (large canvas for detail)
- **Viewport:** Fits container, scrollable/pannable
- **Aspect ratio:** Roughly matches continental US (1.6:1)

### Zoom Levels

| Level | Scale | View | Detail |
|-------|-------|------|--------|
| 1 (Min) | 25% | Entire US visible | Factory dots, major highways |
| 2 | 50% | Half country | Factory sprites (small), region colors |
| 3 | 100% | Regional view | Full factory detail, terrain sprites |
| 4 | 150% | State level | Individual trees, detailed terrain |
| 5 (Max) | 200% | Local area | Full animation detail, road textures |

### Zoom Controls
```
┌─────────────────────────────────────────────────────────────────┐
│  [−] ━━━━━━●━━━━━━━━ [+]    100%    [🏠 Reset] [📍 Find Factory]│
└─────────────────────────────────────────────────────────────────┘
```

### Pan/Navigation
- **Mouse drag:** Click and drag to pan
- **Scroll wheel:** Zoom in/out at cursor position
- **Keyboard:** Arrow keys to pan, +/- to zoom
- **Touch:** Pinch to zoom, drag to pan
- **Mini-map:** Small overview in corner showing current viewport

### Mini-Map Preview
```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                          [ MAIN MAP VIEW ]                               │
│                                                                          │
│                                                               ┌───────┐  │
│                                                               │ ░░░░░ │  │
│                                                               │ ░[█]░ │  │
│                                                               │ ░░░░░ │  │
│                                                               └───────┘  │
│                                                                Mini-map  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🌲 Terrain & Regional Features

### US Geographic Regions

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ╔══════════════╗                           ╔═══════════════════╗      │
│   ║   PACIFIC    ║                           ║    NORTHEAST      ║      │
│   ║  NORTHWEST   ║     ╔══════════════╗      ║   Urban/Industrial║      │
│   ║ 🌲🌧️⛰️🦌    ║     ║   NORTHERN   ║      ║   🏙️🍂🏭         ║      │
│   ╚══════════════╝     ║   PLAINS     ║      ╚═══════════════════╝      │
│                        ║  🌾🌻🚜🐄   ║                                  │
│   ╔══════════════╗     ╚══════════════╝      ╔═══════════════════╗      │
│   ║  CALIFORNIA  ║                           ║    MID-ATLANTIC   ║      │
│   ║ 🌴☀️🏖️🎬    ║     ╔══════════════╗      ║   🌳🏛️🦌         ║      │
│   ╚══════════════╝     ║   MIDWEST    ║      ╚═══════════════════╝      │
│                        ║  🌽🏠🌾🐷   ║                                  │
│   ╔══════════════╗     ╚══════════════╝      ╔═══════════════════╗      │
│   ║  SOUTHWEST   ║                           ║    SOUTHEAST      ║      │
│   ║ 🌵🏜️☀️🦎    ║     ╔══════════════╗      ║   🌳🍑🦀🌡️       ║      │
│   ╚══════════════╝     ║    TEXAS     ║      ╚═══════════════════╝      │
│                        ║  🤠🐄🛢️🌵   ║                                  │
│                        ╚══════════════╝                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Regional Color Palettes

```javascript
const REGION_PALETTES = {
  pacificNorthwest: {
    ground: ['#1a3d2e', '#2d5a3f', '#1f4a35'],  // Deep forest greens
    accent: '#4a7c59',                           // Mossy green
    water: '#1a3a4a',                            // Cool blue-gray
    sky: '#5a7a8a'                               // Overcast
  },
  california: {
    ground: ['#8b7355', '#a08060', '#c4a574'],  // Golden/tan
    accent: '#d4a84b',                           // Sunshine gold
    water: '#2a5a7a',                            // Pacific blue
    sky: '#6a9fc9'                               // Clear blue
  },
  southwest: {
    ground: ['#c4956a', '#d4a070', '#e4b585'],  // Desert sand/orange
    accent: '#e07020',                           // Sunset orange
    water: '#3a4a5a',                            // Sparse (dry)
    sky: '#8ab4d4'                               // Bright blue
  },
  texas: {
    ground: ['#8a7a55', '#9a8a60', '#aa9a70'],  // Dusty tan/brown
    accent: '#6a8a5a',                           // Scrubland green
    water: '#4a5a6a',                            // Rivers
    sky: '#7aa4c4'                               // Big sky
  },
  midwest: {
    ground: ['#5a7a45', '#6a8a50', '#7a9a5a'],  // Farm greens
    accent: '#c4a040',                           // Wheat gold
    water: '#3a5a7a',                            // Lakes/rivers
    sky: '#8ab4d4'                               // Open sky
  },
  southeast: {
    ground: ['#4a6a40', '#5a7a4a', '#6a8a55'],  // Lush greens
    accent: '#3a8a6a',                           // Humid green
    water: '#2a4a6a',                            // Atlantic
    sky: '#7a9ab4'                               // Humid haze
  },
  northeast: {
    ground: ['#4a5a45', '#5a6a50', '#6a7a5a'],  // Forest greens
    accent: '#8a6a4a',                           // Fall foliage
    water: '#2a4a5a',                            // Cool waters
    sky: '#6a8a9a'                               // Urban haze
  },
  mountainWest: {
    ground: ['#5a6a55', '#6a7a60', '#7a8a6a'],  // Alpine greens
    accent: '#8a9aaa',                           // Rocky gray
    water: '#3a5a7a',                            // Mountain lakes
    sky: '#9ab4d4'                               // Clear altitude
  }
};
```

### Regional Sprite Catalog

#### Pacific Northwest (WA, OR) - NWBS, BRIT
```
🌲 Evergreen Trees (Dense)     ⛰️ Mountain Ranges         🌧️ Rain Clouds
     ▲                              ▲▲▲                      ░░░░░░
    ▲▲▲                            ▲▲▲▲▲                    ░░░░░░░
   ▲▲▲▲▲                          ▲▲▲▲▲▲▲                  ░░░░░░░░
    ███                          ▓▓▓▓▓▓▓▓▓                    │││

🦌 Deer (occasional)           ☕ Coffee Shop               🪵 Log Pile
    ╱╲                           ┌─────┐                     ═══
   ╱  ╲                          │CAFE │                    ═════
   │  │                          └─────┘                   ═══════
```

#### California (CA) - MM, WM-WEST, PMI
```
🌴 Palm Trees                  🏖️ Beach/Coast              ☀️ Sun
    ╲│╱                            ～～～                      ╲│╱
     │                            ～～～～                    ──●──
    ╱│╲                          ▒▒▒▒▒▒▒                     ╱│╲
     │
     │                          🎬 Hollywood Sign          🌊 Waves
    ███                         ┌───────────┐               ～～～
                                │HOLLYWOOD  │              ～～～～
                                └───────────┘             ～～～～～
```

#### Southwest / Texas (AZ, NM, TX) - SSI, AMTEX
```
🌵 Saguaro Cactus              🏜️ Mesa/Butte              🦎 Lizard
     │                            ▓▓▓▓▓                       ╱╲
    ╱│╲                          ▓▓▓▓▓▓▓                     ╱──╲
     │                          ▓▓▓▓▓▓▓▓▓                   ╱    ╲
     │                         ▓▓▓▓▓▓▓▓▓▓▓
    ╱│╲
                               🛢️ Oil Derrick              🤠 Cowboy Hat
🌾 Tumbleweed                      ▲                          ───
   ○○○                            ╱╲                        ╱     ╲
  ○○○○○                          ╱  ╲                      ╱       ╲
   ○○○                          ╱    ╲
                                │    │
```

#### Midwest (MO, OH, IN) - MRS, IND
```
🌽 Corn Field                  🚜 Tractor                  🐄 Cow
   │││││                         ┌───┐                        ╱╲
   │││││                        ┌┴───┴┐                     ╱    ╲
   │││││                        │     │○○                   │    │
  ▓▓▓▓▓▓▓                       └─────┘                     └────┘

🌻 Sunflower                   🏠 Farmhouse                🌾 Wheat
    ●●●                          ▲                          │││││
   ●●●●●                        ╱ ╲                         │││││
    │                          ╱   ╲                        ▓▓▓▓▓
    │                         └─────┘
```

#### Southeast (GA, TN, NC) - SEMO, CB, WM-EAST
```
🌳 Oak/Pine Trees              🍑 Peach Tree               🦀 Crab
    ●●●                           ●●                         ╱╲
   ●●●●●                         ●●●                       ╱    ╲
   ●●●●●                          │                       ╱  ╱╲  ╲
    ███                          ███                      ────────

🌡️ Humidity Haze              🎸 Guitar (Nashville)       🌳 Spanish Moss
   ░░░░░░░                        │                          ●●●
  ░░░░░░░░░                      ╱ ╲                       ●│││●
 ░░░░░░░░░░░                    ╱   ╲                     │││││││
                               └─────┘                      ███
```

#### Northeast (PA, MD) - MS, MG
```
🏙️ City Skyline               🍂 Fall Foliage             🏛️ Historical
    ▓▓▓▓▓                         ●●●                        ═══
   ▓▓▓▓▓▓▓                       ●●●●●                       │││
  ▓▓▓▓▓▓▓▓▓                     ●●●●●●●                     ─────
 ▓▓▓▓▓▓▓▓▓▓▓                      ███                      │     │

🏭 Industrial                  🦌 White-tail Deer          🍁 Maple
   ▓▓▓  ▓▓▓                        ╱╲                        ●●●
   █████████                      ╱  ╲                      ●●●●●
   │  │  │                        │  │                       ███
```

### Terrain Tile System (16x16 pixel tiles)

```javascript
const TERRAIN_TILES = {
  // Base terrain
  grass_light: 'tile_001',
  grass_dark: 'tile_002',
  dirt: 'tile_003',
  sand: 'tile_004',
  desert: 'tile_005',
  snow: 'tile_006',
  water_shallow: 'tile_007',
  water_deep: 'tile_008',

  // Roads
  road_horizontal: 'tile_020',
  road_vertical: 'tile_021',
  road_intersection: 'tile_022',
  highway_horizontal: 'tile_023',
  highway_vertical: 'tile_024',

  // Transitions (for smooth region blending)
  grass_to_desert: 'tile_040',
  grass_to_sand: 'tile_041',
  land_to_water: 'tile_042',
};

const DECORATION_SPRITES = {
  // Trees (multiple sizes)
  tree_evergreen_sm: { w: 8, h: 12 },
  tree_evergreen_md: { w: 12, h: 20 },
  tree_evergreen_lg: { w: 16, h: 28 },
  tree_palm_sm: { w: 8, h: 16 },
  tree_palm_lg: { w: 12, h: 24 },
  tree_oak_sm: { w: 12, h: 14 },
  tree_oak_lg: { w: 18, h: 22 },
  tree_pine_sm: { w: 10, h: 16 },
  cactus_saguaro: { w: 8, h: 20 },
  cactus_small: { w: 6, h: 8 },

  // Terrain features
  mountain_sm: { w: 32, h: 24 },
  mountain_lg: { w: 64, h: 40 },
  mesa: { w: 48, h: 28 },
  rock_pile: { w: 12, h: 8 },

  // Water features
  lake: { w: 48, h: 32 },
  river_segment: { w: 16, h: 64 },

  // Regional decorations
  farmhouse: { w: 24, h: 20 },
  barn: { w: 28, h: 22 },
  oil_derrick: { w: 16, h: 32 },
  windmill: { w: 12, h: 28 },
  city_building_sm: { w: 16, h: 24 },
  city_building_lg: { w: 24, h: 40 },
};
```

### Region Boundaries & Factory Placement

```javascript
const REGION_BOUNDARIES = {
  pacificNorthwest: {
    bounds: { x1: 0, y1: 0, x2: 20, y2: 30 },
    factories: ['NWBS', 'BRIT'],
    density: { trees: 'very_high', mountains: 'high', buildings: 'low' }
  },
  california: {
    bounds: { x1: 0, y1: 30, x2: 15, y2: 65 },
    factories: ['MM', 'WM-WEST', 'PMI'],
    density: { trees: 'medium', palm_trees: 'high', urban: 'medium' }
  },
  southwest: {
    bounds: { x1: 15, y1: 55, x2: 35, y2: 80 },
    factories: [],
    density: { cacti: 'high', mesas: 'medium', buildings: 'very_low' }
  },
  texas: {
    bounds: { x1: 35, y1: 55, x2: 55, y2: 85 },
    factories: ['SSI', 'AMTEX'],
    density: { cacti: 'medium', oil_derricks: 'medium', ranches: 'medium' }
  },
  midwest: {
    bounds: { x1: 45, y1: 35, x2: 70, y2: 55 },
    factories: ['MRS', 'IND', 'CB'],
    density: { farms: 'very_high', trees: 'medium', urban: 'low' }
  },
  southeast: {
    bounds: { x1: 70, y1: 50, x2: 100, y2: 80 },
    factories: ['SEMO'],
    density: { trees: 'high', farms: 'medium', humidity_effects: true }
  },
  northeast: {
    bounds: { x1: 70, y1: 25, x2: 100, y2: 50 },
    factories: ['MS', 'MG', 'WM-EAST'],
    density: { urban: 'high', trees: 'medium', industrial: 'high' }
  }
};
```

### Animated Environmental Elements

#### Weather Effects (Subtle, Per-Region)
```javascript
const WEATHER_EFFECTS = {
  pacificNorthwest: {
    rain: { frequency: 0.3, particles: 50 },
    clouds: { speed: 'slow', density: 'high' }
  },
  california: {
    sun_rays: { frequency: 0.8, intensity: 'bright' },
    haze: { frequency: 0.2, coastal: true }
  },
  southwest: {
    heat_shimmer: { frequency: 0.9 },
    dust_devils: { frequency: 0.1, size: 'small' }
  },
  texas: {
    heat_shimmer: { frequency: 0.6 },
    tumbleweeds: { frequency: 0.15, speed: 'medium' }
  },
  midwest: {
    clouds: { speed: 'medium', density: 'low' },
    wind: { grass_sway: true }
  },
  southeast: {
    humidity: { haze_level: 0.3 },
    fireflies: { night_only: true, frequency: 0.4 }
  },
  northeast: {
    clouds: { speed: 'fast', density: 'medium' },
    fall_leaves: { seasonal: true, frequency: 0.2 }
  }
};
```

#### Wildlife (Rare, Ambient)
```javascript
const WILDLIFE = {
  deer: { regions: ['pacificNorthwest', 'northeast', 'midwest'], rarity: 0.05 },
  coyote: { regions: ['southwest', 'texas'], rarity: 0.03 },
  eagle: { regions: ['all'], rarity: 0.02, flight_path: true },
  cattle: { regions: ['texas', 'midwest'], rarity: 0.15, herds: true },
  seagulls: { regions: ['california'], rarity: 0.1, coastal: true }
};
```

### Level of Detail (LOD) System

```javascript
const LOD_SETTINGS = {
  zoom_25: {
    // Zoomed way out - minimal detail
    show_terrain_colors: true,
    show_terrain_tiles: false,
    show_decorations: false,
    show_factories: 'dots',
    show_roads: 'major_only',
    show_trucks: 'dots',
    show_weather: false,
    show_wildlife: false
  },
  zoom_50: {
    // Half zoom - region overview
    show_terrain_colors: true,
    show_terrain_tiles: false,
    show_decorations: 'large_only',  // Mountains, mesas
    show_factories: 'small_sprites',
    show_roads: 'all',
    show_trucks: 'small_sprites',
    show_weather: 'subtle',
    show_wildlife: false
  },
  zoom_100: {
    // Default - balanced detail
    show_terrain_colors: true,
    show_terrain_tiles: true,
    show_decorations: 'medium_and_large',
    show_factories: 'full_sprites',
    show_roads: 'all_with_texture',
    show_trucks: 'full_sprites',
    show_weather: true,
    show_wildlife: 'rare'
  },
  zoom_150: {
    // Zoomed in - high detail
    show_terrain_colors: true,
    show_terrain_tiles: true,
    show_decorations: 'all',
    show_factories: 'full_animated',
    show_roads: 'all_with_texture',
    show_trucks: 'full_animated',
    show_weather: true,
    show_wildlife: 'occasional'
  },
  zoom_200: {
    // Max zoom - full detail
    show_terrain_colors: true,
    show_terrain_tiles: true,
    show_decorations: 'all_with_shadows',
    show_factories: 'full_animated_detailed',
    show_roads: 'all_detailed',
    show_trucks: 'full_animated_detailed',
    show_weather: 'full',
    show_wildlife: 'normal'
  }
};
```

---

## 🔧 Technical Architecture

### Revised Recommendation: Pixi.js (for full terrain system)

Given the expanded scope with zoom, terrain, and regional sprites, **Pixi.js is now recommended** for the full implementation. However, we can still start with a simpler approach for MVP.

### Option A: CSS + SVG (Simplified MVP Only)
**Pros:** Simpler, faster to build initial version
**Cons:** Won't scale well with terrain tiles and zoom levels
**Best for:** Quick proof-of-concept with factory markers only

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
**Cons:** More complex, manual sprite management, no built-in optimization
**Best for:** Mid-complexity with custom rendering needs

### Option C: Pixi.js ⭐ RECOMMENDED
**Pros:** Professional 2D WebGL rendering, sprite sheets, built-in zoom/pan, excellent performance with thousands of sprites, particle systems for weather
**Cons:** Additional dependency (~500KB), learning curve
**Best for:** Full terrain system with LOD, animations, and zoom

```
Architecture with Pixi.js:
├── FactoryMapPage.jsx           <- React container
│   └── PixiMapCanvas.jsx        <- Pixi.js canvas wrapper
│
├── pixi/
│   ├── MapApplication.js        <- Main Pixi app setup
│   ├── layers/
│   │   ├── TerrainLayer.js      <- Ground tiles by region
│   │   ├── DecorationsLayer.js  <- Trees, rocks, buildings
│   │   ├── RoadsLayer.js        <- Highways and routes
│   │   ├── FactoriesLayer.js    <- Factory sprites
│   │   ├── TrucksLayer.js       <- Animated delivery trucks
│   │   ├── WeatherLayer.js      <- Rain, clouds, effects
│   │   └── UILayer.js           <- Labels, tooltips
│   │
│   ├── sprites/
│   │   ├── FactorySprite.js     <- Factory with smoke animation
│   │   ├── TruckSprite.js       <- Truck with movement
│   │   ├── TreeSprite.js        <- Various tree types
│   │   └── ...
│   │
│   ├── systems/
│   │   ├── ZoomController.js    <- Handle zoom levels & LOD
│   │   ├── PanController.js     <- Mouse/touch panning
│   │   ├── CullingSystem.js     <- Only render visible sprites
│   │   └── LODManager.js        <- Level of detail switching
│   │
│   └── utils/
│       ├── spritesheet.js       <- Load sprite atlases
│       └── regionUtils.js       <- Region boundary checks
│
├── assets/
│   ├── spritesheets/
│   │   ├── terrain.json         <- Terrain tiles atlas
│   │   ├── decorations.json     <- Trees, rocks, buildings
│   │   ├── factories.json       <- Factory sprites
│   │   ├── vehicles.json        <- Trucks, animations
│   │   └── weather.json         <- Particles, effects
│   └── images/
│       └── (source PNGs)
│
└── components/
    ├── MapControls.jsx          <- React zoom/filter controls
    ├── MiniMap.jsx              <- Overview navigator
    ├── FactoryTooltip.jsx       <- Hover info popups
    └── PMStatusPanel.jsx        <- Character health sidebar
```

### Performance Considerations

```javascript
const PERFORMANCE_CONFIG = {
  // Sprite culling - don't render off-screen sprites
  culling: {
    enabled: true,
    margin: 100  // px buffer around viewport
  },

  // Object pooling - reuse sprite instances
  pooling: {
    trucks: 50,      // Max concurrent truck sprites
    particles: 500,  // Weather/smoke particles
    trees: 2000      // Decoration sprites
  },

  // Level of Detail thresholds
  lod: {
    disableAnimations: 0.25,  // At 25% zoom, no animations
    simplifySprites: 0.5,     // At 50%, use simpler sprites
    fullDetail: 1.0           // At 100%+, full quality
  },

  // Render optimization
  render: {
    antialias: false,         // Pixel art doesn't need it
    resolution: window.devicePixelRatio,
    backgroundColor: 0x0a0a14,
    preserveDrawingBuffer: false
  }
};
```

### Sprite Sheet Organization

```
terrain_atlas.png (1024x1024)
┌────┬────┬────┬────┬────┬────┬────┬────┐
│g_lt│g_dk│dirt│sand│dsrt│snow│w_sh│w_dp│  <- Base terrain (16x16 each)
├────┼────┼────┼────┼────┼────┼────┼────┤
│r_h │r_v │r_x │hw_h│hw_v│    │    │    │  <- Roads
├────┼────┼────┼────┼────┼────┼────┼────┤
│g2d │g2s │l2w │    │    │    │    │    │  <- Transitions
└────┴────┴────┴────┴────┴────┴────┴────┘

decorations_atlas.png (2048x2048)
┌─────────┬─────────┬─────────┬─────────┐
│ Trees   │ Cacti   │Mountains│ Farms   │
│ (all    │ (all    │ (sm/lg) │ (houses │
│  sizes) │  sizes) │         │  barns) │
├─────────┼─────────┼─────────┼─────────┤
│ Urban   │ Texas   │ Coastal │ Weather │
│ (bldgs, │ (oil,   │ (beach, │ (clouds │
│  indust)│  ranch) │  waves) │  rain)  │
└─────────┴─────────┴─────────┴─────────┘

factories_atlas.png (512x512)
┌──────────────┬──────────────┐
│ Factory      │ Factory      │
│ (idle)       │ (active)     │
│ 3 sizes      │ 3 sizes      │
├──────────────┼──────────────┤
│ Smoke        │ Truck        │
│ (4 frames)   │ (8 directions│
│              │  + wheel anim)│
└──────────────┴──────────────┘
```

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

## 👤 PM Character & Health System

### Concept Overview
Each PM has a pixel-art character avatar with a health bar reflecting their workload status. The character's expression and appearance change based on their "health" (work status). This gamifies the experience while providing quick visual status of team capacity.

### Character Avatar Design

#### Base Character (16x24 pixels, pixel art style)
```
     ████████
    █▓▓▓▓▓▓▓▓█
    █▓██▓▓██▓█      <- Eyes (animated blink)
    █▓▓▓██▓▓▓█      <- Nose
    █▓▓████▓▓█      <- Mouth (changes with health)
    █▓▓▓▓▓▓▓▓█
     ████████
       ████         <- Neck
    ██████████      <- Shoulders (Sunbelt orange polo)
   █▓▓▓▓▓▓▓▓▓▓█
   █▓▓▓▓▓▓▓▓▓▓█
```

#### LinkedIn Photo → Pixel Art Conversion
1. **Extract key features:** Hair color/style, skin tone, glasses (yes/no), facial hair
2. **Map to pixel palette:** 8-12 colors per character
3. **Process options:**
   - Manual pixel art creation (highest quality)
   - AI-assisted conversion + manual touch-up
   - CSS filter + canvas pixelation (automated)

#### Character Expressions (Based on Health)

| Health Level | Expression | Visual |
|--------------|------------|--------|
| 100-80% (Excellent) | Happy/Confident | 😊 Smile, bright eyes |
| 79-60% (Good) | Neutral/Focused | 😐 Normal expression |
| 59-40% (Stressed) | Concerned | 😟 Slight frown, tired eyes |
| 39-20% (Overwhelmed) | Worried | 😰 Sweat drops, stressed |
| 19-0% (Critical) | Distressed | 😵 Exhausted, red face tint |

### Health Bar Design

```
┌─────────────────────────────────┐
│  [Avatar]  John Smith           │
│            Project Manager      │
│                                 │
│  ████████████░░░░░ 72%         │  <- Health bar
│  ▲ Active: 5  ▲ Overdue: 1     │  <- Quick stats
└─────────────────────────────────┘
```

#### Health Bar Colors
```
100-80%:  #22c55e (Green)    - ████████████████████
79-60%:   #84cc16 (Lime)     - ████████████████░░░░
59-40%:   #f59e0b (Amber)    - ████████████░░░░░░░░
39-20%:   #f97316 (Orange)   - ████████░░░░░░░░░░░░
19-0%:    #ef4444 (Red)      - ████░░░░░░░░░░░░░░░░
```

### Health Metrics Calculation

```javascript
const calculateHealth = (pmData) => {
  let health = 100;

  // Overdue items (biggest impact)
  health -= pmData.overdueTasks * 8;
  health -= pmData.overdueRFIs * 10;
  health -= pmData.overdueSubmittals * 6;

  // Active workload (moderate impact)
  const activeTaskPenalty = Math.max(0, pmData.activeTasks - 10) * 2;
  health -= activeTaskPenalty;

  // Items due within 3 days (minor stress)
  health -= pmData.dueSoon * 2;

  // Positive factors (recovery)
  health += pmData.completedThisWeek * 1;  // Small boost for productivity

  return Math.max(0, Math.min(100, health));
};
```

### PM Card Component

#### Layout for PM View (Own Character)
```
┌──────────────────────────────────────────────────────────────┐
│                       YOUR STATUS                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│         ████████                                             │
│        █▓▓😊▓▓▓█           John Smith                        │
│        █▓▓▓▓▓▓▓█           Senior Project Manager            │
│         ████████           NWBS - Northwest Building         │
│           ████                                               │
│        ██████████          ████████████████░░░░ 78%          │
│       █▓▓▓▓▓▓▓▓▓▓█                                           │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ 📋 12       │ │ ❓ 3        │ │ 📄 5        │            │
│  │ Active      │ │ Open        │ │ Pending     │            │
│  │ Tasks       │ │ RFIs        │ │ Submittals  │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ ⚠️ 2        │ │ 📅 4        │ │ ✅ 8        │            │
│  │ Overdue     │ │ Due Soon    │ │ Completed   │            │
│  │ Items       │ │ (3 days)    │ │ This Week   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Director/VP Team View

#### Team Grid Layout
```
┌──────────────────────────────────────────────────────────────────────────┐
│  TEAM STATUS                                           Sort: [Health ▼]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    ████      │  │    ████      │  │    ████      │  │    ████      │ │
│  │   █😊▓█     │  │   █😐▓█     │  │   █😰▓█     │  │   █😵▓█     │ │
│  │    ████      │  │    ████      │  │    ████      │  │    ████      │ │
│  │  John S.     │  │  Sarah M.    │  │  Mike R.     │  │  Lisa K.     │ │
│  │  ████████░░  │  │  ██████░░░░  │  │  ████░░░░░░  │  │  ██░░░░░░░░  │ │
│  │     92%      │  │     68%      │  │     45%      │  │     18%      │ │
│  │  T:8 O:0     │  │  T:12 O:2    │  │  T:15 O:5    │  │  T:22 O:9    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    ...       │  │    ...       │  │    ...       │  │    ...       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

T = Active Tasks, O = Overdue Items
```

#### Factory Grouping for Directors
```
┌──────────────────────────────────────────────────────────────┐
│  NWBS - Northwest Building Systems                   [4 PMs] │
├──────────────────────────────────────────────────────────────┤
│  [John 92%] [Sarah 68%] [Mike 45%] [+1 more]                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  WM-EAST - Whitley Manufacturing East                [3 PMs] │
├──────────────────────────────────────────────────────────────┤
│  [Tom 88%] [Amy 75%] [Chris 52%]                             │
└──────────────────────────────────────────────────────────────┘
```

### Character Animations

#### Idle Animation (Subtle)
- Eye blink every 3-5 seconds
- Slight breathing movement
- Occasional look around

#### Health-Based Animations
| Health | Animation |
|--------|-----------|
| 80%+ | Occasional smile, confident stance |
| 60-79% | Normal blink, steady |
| 40-59% | Faster blink, occasional wipe brow |
| 20-39% | Nervous twitch, sweat drops |
| <20% | Heavy breathing, dizzy stars |

### Integration with Factory Map

The PM characters appear in a sidebar panel alongside the factory map:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          FACTORY NETWORK MAP                              │
├────────────────────────────────────────────────────────┬──────────────────┤
│                                                        │  YOUR STATUS     │
│                                                        │  ┌────────────┐  │
│              [  ISOMETRIC FACTORY MAP  ]               │  │   😊       │  │
│                                                        │  │  92% ████  │  │
│     🏭~~~~         🏭~~~~                              │  └────────────┘  │
│      NWBS           BRIT                               │                  │
│         ╲                                              │  TEAM           │
│    🏭    ╲                    🏭~~~~                   │  ┌──┐┌──┐┌──┐   │
│    MM     ╲                  WM-EAST                   │  │😊││😐││😰│   │
│     │      🚚═══════════════════►📦                    │  └──┘└──┘└──┘   │
│     ▼                                                  │  ┌──┐┌──┐       │
│    📦        🏭        🏭                              │  │😵││😐│       │
│             SSI      SEMO                              │  └──┘└──┘       │
│                                                        │                  │
└────────────────────────────────────────────────────────┴──────────────────┘
```

### Implementation Phases for Character System

#### Phase 1: Basic Health System
- [ ] Calculate health metrics from database
- [ ] Create health bar component
- [ ] PM card with stats (no avatar yet)

#### Phase 2: Avatar System
- [ ] Design base character template
- [ ] Create 5 expression variations
- [ ] Build avatar component with expression prop

#### Phase 3: Custom Avatars
- [ ] Avatar customization interface (hair, skin, accessories)
- [ ] LinkedIn photo upload option
- [ ] Pixel art conversion tool/process

#### Phase 4: Animations
- [ ] Idle animation (blink, breathe)
- [ ] Health-based expression changes
- [ ] Transition animations

#### Phase 5: Team Views
- [ ] Director team grid
- [ ] VP all-company view
- [ ] Factory grouping
- [ ] Click to view PM details

---

## 💡 Future Enhancements

- Weather effects overlay (rain, snow in regions)
- Day/night cycle based on real time
- Factory production progress bars
- Historical delivery replay (time-lapse)
- Achievement badges (1000th delivery!)
- Sound effects (truck horn, factory ambience)
- Seasonal decorations (snow in winter, etc.)
- **PM leveling system** (XP for completed tasks)
- **Team achievements** (badges for factory performance)
- **Leaderboards** (optional, fun competition)

---

## Next Steps

1. ✅ Vision board complete
2. ⏳ Review and get feedback
3. ⏳ Decide on technical approach
4. ⏳ Create basic page structure
5. ⏳ Build factory sprites
6. ⏳ Implement animations
7. ⏳ Connect data
