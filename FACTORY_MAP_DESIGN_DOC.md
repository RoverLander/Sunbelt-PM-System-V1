# Factory Map - Complete Design Document
## Vision: Gamified PM System with Strategy Game Aesthetic

---

## 🎯 Core Purpose
Transform project management into an engaging, game-like experience where PMs, Directors, and VPs can visualize and interact with the entire Sunbelt network in real-time.

---

## 🎨 Visual Style Reference
**Primary Inspiration:** Age of Empires III + Civilization V + SimCity 4
- Isometric/angled strategy game aesthetic
- Rich, textured environments
- Detailed but stylized (not photorealistic)
- Clear visual hierarchy
- Strategic board game feel
- Modern take on retro gaming

---

## 📐 Map Perspective: Two Options

### Option A: Subtle Isometric Perspective ✨ (RECOMMENDED)
**Description:**
- USA map tilted at a gentle angle (~15-20 degrees, not 75!)
- South (Texas, Florida) closer to viewer
- North (Washington, Maine) further away
- Creates depth while keeping USA outline recognizable
- Similar to how strategy games show their world maps

**Technical Implementation:**
```javascript
// Apply isometric transformation to map container
const isometricSkew = {
  x: 1.0,           // No horizontal skew
  y: 0.85,          // Slight vertical compression (north appears further)
  rotation: 0,      // Keep upright
  perspective: 200  // Subtle 3D depth
};

// Transform coordinates for all sprites
function toIsometric(x, y) {
  return {
    x: x,
    y: y * isometricSkew.y  // Compress northern elements
  };
}
```

**Pros:**
- Stunning visual impact
- True strategy game feel
- More immersive
- Matches AoE3/Civ5 reference perfectly
- Professional, polished look

**Cons:**
- More complex coordinate system
- Slightly longer development time
- Need to adjust all positioning logic

---

### Option B: Standard Top-Down Map
**Description:**
- Traditional flat map view (current implementation)
- USA shown from directly above
- Isometric buildings placed on flat map
- Simpler coordinate system

**Technical Implementation:**
```javascript
// Standard 2D positioning (current approach)
function placeSprite(x, y) {
  sprite.position.set(x, y);
}
```

**Pros:**
- Simpler to implement
- Easier coordinate calculations
- Familiar perspective
- Faster development

**Cons:**
- Less visually impressive
- Doesn't match strategy game reference as closely
- Less immersive

---

## 🗺️ Map Background Design

### Terrain Rendering
**Style:** Textured, painted terrain (AoE3/Civ5 style)

**Regions & Colors:**
- **Pacific Northwest:** Deep green forests, blue water
- **West Coast:** Golden hills, coastal blue
- **Mountain West:** Gray/brown peaks, white snow caps
- **Midwest:** Yellow/tan farmland, green plains
- **South-Central West:** Red/tan desert, cacti
- **Southeast:** Green forests, swamps
- **Mid-Atlantic:** Mixed forests, urban gray
- **New England:** Dense forests, coastal blue

**Terrain Features:**
- 🏔️ **Mountain Ranges:** Rockies, Appalachians, Sierra Nevada
  - Stylized peaks with snow caps
  - Shading to show elevation
  - Static (no animation)

- 🌊 **Water Bodies:** Pacific, Atlantic, Gulf, Great Lakes, Major Rivers
  - Animated water texture (gentle waves)
  - Lighter blue for shallow, darker for deep
  - Subtle shimmer effect

- 🌲 **Forests:** PNW, Northeast, Southeast
  - Clusters of stylized trees
  - Gentle sway animation (very subtle)
  - Darker green areas

- 🏜️ **Deserts:** Southwest, parts of Mountain West
  - Tan/orange texture
  - Cacti sprites (static)
  - Heat shimmer effect (subtle wave distortion)

**State Borders:**
- Very subtle thin lines
- Only visible at medium-high zoom
- Don't distract from game elements
- Grayish, low opacity (0.2)

---

## 🏭 Factory Sprites - Multi-Scale Design

### Zoom Level 1: Maximum Zoom Out (Whole USA Visible)
**Factory Sprite Size:** ~24x36 pixels

**Design:**
- Simplified isometric building
- Basic rectangular shape with peaked roof
- Single smokestack (2-3 pixels wide)
- Windows as colored rectangles (2x2 pixels)

**Idle State:**
- Dark gray building
- No window glow
- Thin smoke puff every 3 seconds

**Active State:**
- Orange accent stripe
- Orange glowing windows
- Visible orange aura (8px radius, 0.3 alpha)
- Smoke puffs every 1 second
- Badge showing project count (12x12px circle)

**Label:**
- Factory code in small font (8px)
- Positioned below building

---

### Zoom Level 2: Medium Zoom (Regional View)
**Factory Sprite Size:** ~48x72 pixels

**Design:**
- More detailed isometric building
- Visible wall faces (left and right)
- Detailed roof structure
- Two smokestacks
- Multiple windows (4-6 total)
- Door visible

**Idle State:**
- Slow smoke (every 2-3 seconds)
- Dark windows
- Subtle shadow

**Active State:**
- Fast smoke (every 0.5 seconds)
- Glowing windows (pulsing gently)
- Orange glow around building
- Sign pole beside building:
  - Factory logo on sign (16x16px)
  - Project counter below (shows "3" etc.)
- Sunbelt orange accent stripe around building

**Animations:**
- Smoke particles rise and dissipate
- Window glow pulses (0.8-1.0 alpha, 2 second cycle)
- Slight building "bobbing" (Wreck-It Ralph style)
  - 1-2 pixel vertical movement
  - Slow, gentle bounce

---

### Zoom Level 3: Maximum Zoom In (Detailed View)
**Factory Sprite Size:** ~80x120 pixels (current size)

**Design:**
- Full detail isometric building
- All architectural elements visible
- Base platform/foundation
- Multiple wall sections with depth
- Detailed roof with tiles
- Two distinct smokestacks with rims
- 6+ windows with frames
- Prominent door
- Detailed shadows

**Idle State:**
- Very slow smoke (every 4 seconds)
- Windows dark or barely lit
- Minimal activity
- Subdued colors

**Active State:**
- Rapid smoke (smoke speed tied to project count):
  - 1 project: every 2 seconds
  - 3 projects: every 1 second
  - 5+ projects: every 0.5 seconds
- Bright glowing windows (full orange)
- Strong orange aura (20px radius)
- Factory sign with logo (32x32px logo)
- Project counter badge (green circle, 18px diameter)
- Sunbelt orange stripe very visible
- Additional details:
  - Exhaust steam from vents
  - Slight heat shimmer above building
  - Ground shadows with ambient occlusion

**Full Animation Suite:**
- Smoke particles with physics:
  - Rise 40-50 pixels
  - Drift left/right (wind effect)
  - Fade out gradually
  - Scale from 0.5 to 2.0
- Window lights flicker randomly (not all windows sync)
- Building gentle bounce (2-3px, 1 second cycle)
- Glow pulses with breathing effect
- Sign counter updates with smooth number transition

---

## 🚛 Delivery Trucks - Multi-Scale

### Zoom Level 1: Far Out
- **Not visible** (too small, would clutter)
- Routes visible as thin lines

### Zoom Level 2: Medium
**Truck Size:** ~20x12 pixels

**Design:**
- Simple rectangular trailer (tan)
- Orange cab (Sunbelt color)
- 2 visible wheels (black dots)
- Basic form, recognizable as truck

**Animation:**
- Travels along route at steady speed
- Wheels rotate
- Slight dust trail behind (3-4 particles)

### Zoom Level 3: Close
**Truck Size:** ~40x24 pixels (current size)

**Design:**
- Detailed modular unit trailer (tan/beige)
  - Windows on trailer sides (4x4px each)
  - Paneling lines
- Orange Sunbelt cab
  - Windshield (light blue)
  - Side windows
  - Chrome details
- 3 wheels with treads
- Exhaust stack on cab

**Full Animation:**
- Smooth path following along bezier route
- Rotation matches travel direction
- All 3 wheels rotate independently
- Exhaust puffs from stack (every 0.5 seconds)
  - Small gray smoke clouds
  - Rise and fade quickly
- Dust particles from wheels (5-6 particles)
  - Trail behind truck
  - Tan/brown color
  - Drift and settle
- Truck bounces slightly while driving (1-2px)
- Scale animation when hovering (1.0 → 1.2)

---

## 🏗️ Job Sites - Progressive Detail

### Zoom Level 1: Far Out
**Size:** ~12x12 pixel marker

**Design:**
- Simple construction marker icon
- Orange construction cone or flag
- Basic visibility only

### Zoom Level 2: Medium
**Size:** ~32x32 pixel site

**Design:**
- Dirt patch (brown texture)
- 2-3 construction barriers (orange/white)
- Small equipment silhouette

### Zoom Level 3: Close - PROGRESSIVE STAGES

#### Stage 1: Project Created (Pre-Online)
**Size:** ~64x48 pixels

**Design:**
- Leveled dirt pad (brown/tan textured rectangle)
- Tire tracks visible in dirt
- Site marker post with project info
- Minimal activity

#### Stage 2: Early Progress (< 25% to online)
**Added Elements:**
- Orange construction barriers around perimeter (4-6 barriers)
- Construction equipment appears:
  - Small excavator (16x12px, yellow)
  - Bulldozer (18x10px, yellow)
- Material piles (dirt, gravel)
- Dust particles occasionally

#### Stage 3: Foundation Stage (25-75% to online)
**Added Elements:**
- Concrete stem wall foundation visible
  - Gray rectangular outline
  - Rebar details (small vertical lines)
- Construction equipment active:
  - Crane appears (tall, rotating boom)
  - Cement mixer truck
- More barriers and safety cones
- Site trailer/office (small white rectangle)

#### Stage 4: Building Online (Delivery Phase)
**Transformation:**
- Modular building appears (instant transition when truck arrives)
- Celebration particle effect plays:
  - 40-50 colorful particles burst from center
  - Mix of orange, yellow, gold, white
  - Spread 180 degrees upward
  - 2.5 second duration
  - "Pop" feel

**Completed Building Design:**
- Tan/beige modular office (48x36px)
- Windows with curtains (4-6 windows)
- Door (centered, brown)
- Roof (gray/brown, peaked)
- AC unit on roof (small gray box)
- Steps leading to door
- Ground around building cleaned up

#### Stage 5: Completed (60 Day Timer)
**Visual:**
- Building fully rendered
- Landscaping appears:
  - Small shrubs around building
  - Gravel or grass texture
- Site equipment removed
- Clean, finished appearance

**After 60 Days:**
- Gradual fade out (2 second alpha transition: 1.0 → 0.0)
- Building and route disappear
- Site returns to base terrain

---

## 🛣️ Routes - Dynamic Line Visualization

### Route States

#### State 1: Scheduled (Gray/Dormant)
**Appearance:**
- Thin dotted line (1-2px width)
- Gray color (0x6b7280)
- Static (no animation)
- Low opacity (0.4)
- Barely visible, subtle

**When:** Project created but not yet online

#### State 2: Online/Active (Sunbelt Orange)
**Appearance:**
- Animated dashed line (3-4px width)
- Sunbelt orange (0xf97316)
- Dashes flow along path (animating dash offset)
- Bright, prominent (0.9 opacity)
- Smooth bezier curve

**Animation:**
- Dashes move along route creating "flow" effect
- Speed: moderate (not too fast)
- Creates sense of energy and activity

**When:** Building goes online, before delivery

#### State 3: Delivery In Progress (Pulsing Orange)
**Appearance:**
- Solid line (4px width)
- Bright orange with pulsing glow effect
- Glow radiates 2-3px beyond line
- Truck traveling along route
- Full opacity (1.0)

**Animation:**
- Glow pulses (0.6-1.0 alpha, 1.5 second cycle)
- Creates "hot" active delivery feel

**When:** Truck is traveling (shipping phase)

#### State 4: Completed (Faded Green)
**Appearance:**
- Solid thin line (2px width)
- Green color (0x22c55e)
- Static (no animation)
- Low opacity (0.3)
- Subtle, background element

**Duration:** Shows for 5-10 seconds after delivery
**Then:** Fades out completely (2 second transition)

### Route Path Behavior

**Path Calculation:**
- Origin: Factory center point
- Destination: Job site center point
- Path: Quadratic bezier curve
  - Control point: Midpoint between origin/destination, offset upward by 80-120px
  - Creates natural arc
  - Trucks follow this curve

**Zoom Level Behavior:**
- **Zoom 1 (Far):** Routes visible, simplified curves, thinner lines (1-2px)
- **Zoom 2 (Medium):** Standard routes, medium lines (2-3px)
- **Zoom 3 (Close):** Detailed routes, thick lines (3-4px), full animations

**Road Following (Future Enhancement):**
- At closer zoom levels, routes could follow actual road networks
- Currently: Direct bezier curve (simplified)
- Future: Pathfinding along interstate highways

---

## ⛅ Ambient Animations

### Sky Layer (Always Active)

#### Clouds
**Design:**
- Fluffy white/gray clouds (various sizes: 40-120px)
- Semi-transparent (0.6-0.8 alpha)
- Different cloud types:
  - Puffy cumulus (day)
  - Thin cirrus streaks
  - Dark storm clouds (weather events)

**Animation:**
- Drift slowly west to east
- Speed: ~5 pixels per second
- Clouds cycle: fade in from west edge, fade out at east edge
- 8-12 clouds visible at any time
- Each cloud drifts at slightly different speeds (parallax)

**Zoom Behavior:**
- Always visible at all zoom levels
- Scale with zoom

#### Day/Night Cycle
**Duration Options:**
- Real-time: Matches actual local time
- Accelerated: 1 real minute = 1 game hour (24 min = full day)
- Toggle: User can switch modes or disable

**Day Phase (6 AM - 6 PM):**
- Bright blue sky background (0x87CEEB)
- Sun visible in sky (yellow circle with glow)
- Sun moves east to west across sky
- Bright lighting on all sprites
- Light shadows

**Sunset Phase (6 PM - 8 PM):**
- Sky gradient: blue → orange → purple
- Sun at horizon (larger, orange-red)
- Long shadows
- Warm color filter over map (subtle orange tint)

**Night Phase (8 PM - 6 AM):**
- Dark blue/purple sky (0x0d1929)
- Moon visible (white/gray circle)
- Stars twinkling (small white dots, random flicker)
- Factory lights more prominent (glow stronger)
- Cool blue color filter

**Dawn Phase (6 AM - 8 AM):**
- Sky gradient: purple → pink → blue
- Sun rising from east
- Shadows shorten
- Warm morning light

#### Birds
**Design:**
- Small V-shaped formations (3-7 birds per flock)
- Black silhouettes (2-3 pixels each)
- Simple wing flap animation (2 frames)

**Behavior:**
- Appear randomly every 30-60 seconds
- Fly across screen in formation
- Speed: ~15 pixels per second
- Paths: Various angles (not just horizontal)
- Occasionally break formation slightly (realistic)

**Zoom Behavior:**
- Visible at medium and far zoom
- Hidden at maximum zoom in (too small)

---

### Regional Ambient Elements

#### Ocean/Coasts (Pacific, Atlantic, Gulf)
**Waves:**
- Animated texture on water
- Gentle undulating motion
- Light reflection shimmer
- White wave crests along coastlines

**Frequency:** Constant, subtle

#### Rivers (Mississippi, Missouri, Colorado, etc.)
**Flow:**
- Animated blue texture
- Directional flow (north to south generally)
- Subtle current effect
- Sparkles where sun hits

**Frequency:** Constant

#### Forests (PNW, Northeast, Southeast)
**Trees Swaying:**
- Groups of trees gently rock side-to-side
- Wind effect (synchronized across region)
- 1-2 degree rotation, slow cycle (3-4 seconds)
- Leaves rustle (subtle particle effect)

**Frequency:** Constant, very gentle

#### Deserts (Southwest, parts of Mountain West)
**Heat Shimmer:**
- Vertical wave distortion effect
- Subtle, transparent overlay
- Creates "heat wave" mirage effect
- More prominent during day cycle

**Tumbleweeds (occasional):**
- Small brown spherical sprite
- Rolls across desert regions
- Rare (1-2 per minute)
- Bounces slightly

**Frequency:** Heat shimmer constant, tumbleweeds occasional

#### Great Plains (Midwest)
**Wheat Fields:**
- Golden wheat texture in farmland areas
- Wave motion (wind blowing through)
- Directional flow (west to east generally)

**Frequency:** Constant, gentle

#### Mountains (Rockies, Appalachians, Sierra Nevada)
**Snow Caps:**
- White texture on peaks
- Occasional snow particle drift
- Avalanche effect (very rare, special event)

**Frequency:** Snow mostly static, occasional particles

---

### Weather System (Real-Time Data Integration)

#### Rain
**Visual:**
- Diagonal rain streaks falling (60-degree angle)
- Semi-transparent white/blue lines
- Puddle splashes on ground
- Darkened sky
- Clouds thicker, gray

**Regional:** Affects specific areas based on real weather API

**Impact:**
- Truck speeds slightly slower
- Factory smoke dissipates faster
- Ambient sounds (if enabled): rain patter

#### Snow
**Visual:**
- White snowflakes falling (various sizes)
- Accumulation on ground (white texture overlay)
- Snow on factory roofs
- Factory smoke more visible against white

**Regional:** Northern states, winter seasons

**Impact:**
- Truck speeds slightly slower
- Everything slightly covered in white

#### Thunderstorms
**Visual:**
- Dark storm clouds
- Lightning flashes (screen briefly lights up)
- Heavy rain
- Wind effect (trees/objects bend more)

**Regional:** Midwest, Southeast primarily

**Impact:**
- Dramatic visual effect
- No gameplay impact (purely aesthetic)

#### Clear/Sunny
**Visual:**
- Bright sky
- Minimal clouds
- Sun rays visible (god rays through clouds)
- Strong shadows

**Regional:** Default state, varies by weather data

---

## 🎮 Interactive Elements

### Factory Interactions

#### Hover State
**Visual Feedback:**
- Factory scales up (1.0 → 1.1)
- Glow intensifies (alpha +0.3)
- Cursor changes to pointer
- Tooltip appears after 0.5 seconds

**Tooltip Content:**
- Factory name and code
- Location (city, state)
- Active projects count
- Capacity utilization (e.g., "3/10 active")
- Status indicator (Idle / Active / At Capacity)

**Position:** Tooltip follows cursor, offset 10px right and down

#### Click Action
**Visual Feedback:**
- Brief "pop" scale animation (1.1 → 1.2 → 1.1, 100ms each)
- Particle burst effect (small, subtle)

**Action Menu Appears:**
- Modal/panel slides in from right side
- Contains:
  - Factory details (full info)
  - List of active projects
  - Quick actions:
    - "View All Projects" button
    - "Create New Project" button (if permitted)
    - "Factory Analytics" button
  - Recent activity timeline

**Route Highlighting:**
- All routes from this factory highlight
- Other routes dim to 0.2 alpha
- Routes scale up slightly (1.2x)
- Makes connections clear

---

### Job Site Interactions

#### Hover State
**Visual Feedback:**
- Construction site glows (orange outline)
- Equipment bounces slightly
- Tooltip appears

**Tooltip Content:**
- Project name
- Project ID
- Status (e.g., "Foundation - 45% Complete")
- From factory (e.g., "From DAL")
- Timeline info:
  - Days until online
  - Expected delivery date
- Progress bar

#### Click Action
**Visual Feedback:**
- Site pulses (scale 1.0 → 1.15 → 1.0)
- Highlight effect

**Project Detail Panel Appears:**
- Slides in from right
- Contains:
  - Full project details
  - Timeline visualization
  - Photos (if available)
  - Team members
  - Quick actions:
    - "Edit Project" button (if permitted)
    - "View Documents" button
    - "Contact Team" button

---

### Route Interactions

#### Hover State
**Visual Feedback:**
- Route line thickens (+2px)
- Color brightens (alpha +0.2)
- Tooltip appears at mouse position

**Tooltip Content:**
**If Pre-Online:**
- "Scheduled Delivery"
- Project name
- "Goes Online: [date]"
- Days remaining countdown

**If Active/Shipping:**
- "Delivery in Progress"
- Project name
- Progress bar (% complete)
- "ETA: [date/time]"
- "From: [Factory Code]"
- "To: [City, State]"

**If Completed:**
- "Delivered [X days ago]"
- Project name
- Delivery date

#### Click Action
- Opens project detail panel (same as clicking job site)

---

### Truck Interactions

#### Hover State
**Visual Feedback:**
- Truck scales up (1.0 → 1.2)
- Exhaust animation intensifies
- Shadow expands
- Tooltip appears above truck

**Tooltip Content:**
- "Delivery in Progress"
- Project name
- Progress: "[X]% complete"
- ETA: "[time/date]"
- From/To info
- Driver name (if available)

#### Click Action
**Visual Feedback:**
- Truck bounces
- Brief particle trail boost

**Tracking Panel Appears:**
- Shows truck location details
- Project info
- Delivery timeline
- "View Project Details" button
- "Contact Driver" button (if available)

---

### PM Portrait Interactions (Sidebar)

#### Portrait Display
**Design:**
- 8-bit pixel art style face (64x64 pixels)
- Retro game character feel
- Unique for each PM

**Health Indicator:**
- Colored border around portrait:
  - Green (0x22c55e): Healthy (good metrics)
  - Yellow (0xf59e0b): Moderate (some delays)
  - Orange (0xf97316): Stressed (multiple issues)
  - Red (0xef4444): Critical (urgent attention)

**Expression Changes:**
- Happy face (green health)
- Neutral face (yellow health)
- Concerned face (orange health)
- Stressed face (red health)

**Metrics Display Below Portrait:**
- Active Projects: [X]
- On-Time Rate: [X]%
- Health Score: [X]/100
- Small bar graph visualization

#### Hover State
**Visual Feedback:**
- Portrait bounces slightly
- Border glow effect
- Tooltip with full stats

#### Click Action
**Visual Feedback:**
- Portrait "pops" forward
- Brief flash effect

**Map Interaction:**
- Camera pans to center all their projects
- All routes from their projects highlight (bright)
- Other routes dim (0.2 alpha)
- Job sites with their projects glow
- Factory connections highlighted

**Detail Panel:**
- PM info panel opens
- Shows all projects
- Metrics dashboard
- Quick actions

---

## ⌨️ Keyboard Shortcuts

### Navigation
- **Arrow Keys:** Pan map (smooth scroll)
- **+/=:** Zoom in
- **-/_:** Zoom out
- **Space:** Reset view to center
- **H:** Toggle help overlay

### Factory Quick Jump
- **1-9:** Jump to factories by number
  - Animates camera pan to factory
  - Brief highlight pulse on arrival
- **0:** Cycle through all factories

### Layers/Views
- **L:** Toggle routes layer
- **T:** Toggle trucks visibility
- **J:** Toggle job sites visibility
- **W:** Toggle weather effects
- **D:** Toggle day/night cycle

### System
- **M:** Toggle music
- **S:** Toggle sound effects
- **F:** Toggle fullscreen
- **Esc:** Close any open panels/menus

### Filters (with CTRL/CMD)
- **CTRL+A:** Show all projects
- **CTRL+O:** Show only online projects
- **CTRL+S:** Show only shipping projects
- **CTRL+C:** Show only completed projects

---

## 📊 Zoom Level System (LOD - Level of Detail)

### Performance Management

**Zoom Level Detection:**
```javascript
// Calculate current zoom level (0.25 to 2.0 scale)
const zoom = viewport.scale.x;

// Determine LOD tier
let lodLevel;
if (zoom < 0.5) {
  lodLevel = 1; // Far out
} else if (zoom < 1.0) {
  lodLevel = 2; // Medium
} else {
  lodLevel = 3; // Close up
}
```

### LOD Level 1: Far Out (Zoom < 0.5)
**Visible:**
- Simplified factory sprites (24x36px)
- Routes (thin lines)
- Job site markers (simple icons)
- Terrain features (low detail)
- Clouds

**Hidden/Disabled:**
- Trucks (not rendered)
- Detailed animations (smoke slow/disabled)
- Ambient particles
- Window glow effects
- Sign poles and badges

**Render Count:**
- ~50-100 sprites total
- 15-20 draw calls
- 60 FPS target

---

### LOD Level 2: Medium (Zoom 0.5 - 1.0)
**Visible:**
- Medium factory sprites (48x72px)
- All routes with animations
- Trucks (simplified, 20x12px)
- Job sites (32x32px with some detail)
- Terrain features (medium detail)
- Clouds, birds

**Active Animations:**
- Factory smoke (medium frequency)
- Route dashes animating
- Truck movement
- Basic dust trails
- Window glow (simplified)

**Hidden/Disabled:**
- Complex particle systems
- Detailed equipment at job sites
- Exhaust from trucks
- Heat shimmer effects

**Render Count:**
- ~200-300 sprites total
- 30-40 draw calls
- 60 FPS target

---

### LOD Level 3: Close (Zoom >= 1.0)
**Visible:**
- Full detail factory sprites (80x120px)
- All elements visible
- Trucks with full detail (40x24px)
- Job sites with progressive stages
- All terrain features
- All ambient elements

**Active Animations:**
- Everything enabled:
  - Fast smoke particles
  - Complex dust systems
  - Exhaust puffs
  - Window flickering
  - Building bobbing
  - Equipment movement at job sites
  - Weather effects
  - Heat shimmer
  - Wave animations

**Render Count:**
- ~500-800 sprites total
- 50-80 draw calls
- 30-60 FPS target (acceptable)

---

### Dynamic LOD Adjustment

**Performance Monitoring:**
```javascript
// Track FPS
if (currentFPS < 30) {
  // Reduce quality automatically
  reduceLODQuality();
}

function reduceLODQuality() {
  // Disable expensive effects
  disableParticles();
  reduceAnimationFrequency();
  simplifySprites();
}
```

**User Setting:**
- Graphics Quality dropdown:
  - Ultra (all effects)
  - High (standard)
  - Medium (reduced particles)
  - Low (minimal animations)
  - Auto (dynamic adjustment)

---

## 🎵 Audio System

### Background Music
**Tracks:**
- Theme 1: "Factory Floor" (upbeat, industrial rhythm)
- Theme 2: "Open Road" (driving, optimistic)
- Theme 3: "Strategic Overview" (calm, thoughtful)

**Behavior:**
- Loops seamlessly
- Volume: 30% default
- User can toggle on/off
- Fades when panels open

### Sound Effects

**Factory Sounds:**
- Factory activation: Low industrial hum
- Project completion: Success chime (short, satisfying)

**Truck Sounds:**
- Truck horn: Occasional honk (rare, not annoying)
- Delivery arrival: Success ding

**UI Sounds:**
- Button click: Soft click
- Panel open: Whoosh slide
- Hover: Subtle tick
- Error/warning: Alert beep

**Ambient Sounds:**
- Rain: Gentle patter (if weather enabled)
- Thunder: Rumble (during storms)
- Birds: Occasional chirp

**Volume Control:**
- Master volume slider
- Music volume slider
- SFX volume slider
- Ambient volume slider
- Individual toggles for each category

---

## 🎨 Color Palette

### Brand Colors
- **Sunbelt Orange:** #f97316 (primary accent)
- **Dark Navy:** #0a0a14 (background)
- **Off-White:** #f5f5f5 (text, UI)

### Status Colors
- **Success Green:** #22c55e (completed, healthy)
- **Warning Yellow:** #f59e0b (attention needed)
- **Alert Orange:** #f97316 (issues)
- **Critical Red:** #ef4444 (urgent)
- **Inactive Gray:** #6b7280 (dormant, disabled)

### Terrain Colors
- **Ocean Blue:** #1e40af (deep water)
- **Coast Blue:** #3b82f6 (shallow water)
- **Forest Green:** #166534 (dense trees)
- **Plains Green:** #84cc16 (farmland)
- **Desert Tan:** #d4a574 (arid regions)
- **Mountain Gray:** #6b7280 (peaks)
- **Snow White:** #f0f9ff (caps)

### UI Colors
- **Panel Background:** rgba(10, 10, 20, 0.95) (dark, semi-transparent)
- **Border:** rgba(249, 115, 22, 0.5) (subtle orange)
- **Hover:** rgba(249, 115, 22, 0.2) (light orange glow)
- **Active:** rgba(249, 115, 22, 0.8) (bright orange)

---

## 📱 Responsive Design

### Window Sizes

#### Laptop (1280x720 - 1920x1080)
- Standard view
- Sidebar visible
- All UI elements shown
- Optimal experience

#### Large Screen (1920x1080+)
- Expanded view
- Larger sprites possible
- More zoom levels
- Additional info panels

#### Fullscreen Mode
- No browser chrome
- Immersive view
- Sidebar collapsible
- ESC to exit

---

## 🔐 Permission Levels

### PM (Project Manager)
**Can See:**
- All factories
- All projects (emphasis on their own)
- Their own PM portrait and metrics
- General network status

**Can Do:**
- View project details
- Click factories to see info
- Use keyboard shortcuts
- Interact with their projects
- View but not edit others' projects

---

### Director
**Can See:**
- Everything PMs see
- All PM portraits and metrics
- Aggregated analytics
- Network health overview

**Can Do:**
- Everything PMs can do
- Click any PM portrait to filter view
- Access advanced analytics
- See historical data
- Generate reports

---

### VP (Vice President)
**Can See:**
- Everything Directors see
- Executive dashboard overlay
- Financial metrics
- High-level KPIs
- Performance comparisons

**Can Do:**
- Everything Directors can do
- Access executive controls
- System settings
- User management (if applicable)
- Export data

---

## 🚀 Implementation Phases

### Phase 1: Core Foundation (Week 1-2)
- [ ] Map perspective decision (isometric vs top-down)
- [ ] Basic terrain rendering
- [ ] Factory sprites (all 3 LOD levels)
- [ ] Coordinate system setup
- [ ] Pan/zoom controls working
- [ ] Basic layout

### Phase 2: Movement & Routes (Week 3-4)
- [ ] Route rendering system
- [ ] Bezier curve pathfinding
- [ ] Truck sprites (all LOD levels)
- [ ] Truck movement along routes
- [ ] Route state system (scheduled/active/complete)
- [ ] Basic animations

### Phase 3: Job Sites & Progression (Week 5-6)
- [ ] Job site sprites (all stages)
- [ ] Progressive construction visualization
- [ ] Celebration particles on completion
- [ ] 60-day fade out system
- [ ] Project lifecycle integration

### Phase 4: Interactions & UI (Week 7-8)
- [ ] Hover tooltips
- [ ] Click actions
- [ ] Detail panels
- [ ] PM portrait sidebar
- [ ] Keyboard shortcuts
- [ ] Quick actions menus

### Phase 5: Polish & Ambient (Week 9-10)
- [ ] Day/night cycle
- [ ] Weather system (real data integration)
- [ ] Ambient animations (clouds, birds, etc.)
- [ ] Regional decorations
- [ ] Sound effects and music
- [ ] Performance optimization

### Phase 6: Advanced Features (Week 11-12)
- [ ] LOD system refinement
- [ ] Permission system integration
- [ ] Analytics integration
- [ ] Historical playback (optional)
- [ ] Mobile optimization (if needed)
- [ ] Final bug fixes and polish

---

## 🎯 Success Metrics

### Performance Targets
- **60 FPS** at medium zoom (LOD 2)
- **30+ FPS** at maximum zoom (LOD 3)
- **< 3 second** initial load time
- **< 500ms** interaction response time

### User Engagement
- Daily active users increase
- Average session time > 5 minutes
- Click-through rate on interactive elements
- Positive user feedback scores

### Business Value
- Improved project visibility
- Faster decision-making
- Reduced status update requests
- Better cross-team awareness

---

## 📝 Technical Stack

**Rendering:**
- PIXI.js v8.15.0 (WebGL 2D renderer)
- React 19.2.3 (component framework)

**Architecture:**
- Layer-based rendering system
- LOD Manager for performance
- Viewport Controller for camera
- Event-driven sprite communication

**Data:**
- Real-time project data from API
- Weather API integration (OpenWeather or similar)
- WebSocket for live updates (optional)

**Performance:**
- Object pooling for particles
- Texture atlases for sprites
- Culling for off-screen objects
- LOD system for zoom levels

---

## 🎨 Next Steps: Visual Examples Needed

Before proceeding with implementation, we need to create visual mockups of:

1. **Map Perspective Comparison**
   - Side-by-side: Isometric vs Top-Down
   - Show how USA looks in each style
   - Demonstrate factory placement

2. **Sprite Scale Reference**
   - Show factory sprites at all 3 LOD levels
   - Demonstrate detail differences
   - Verify readability

3. **Color & Style Test**
   - Terrain texture samples
   - Factory sprite in AoE3/Civ5 style
   - Verify aesthetic matches vision

4. **Animation Reference**
   - GIF/video showing:
     - Truck movement
     - Smoke animation
     - Route pulsing
     - Job site progression

**Let's create these mockups before coding!**

---

## 🤝 Design Approval Checklist

- [ ] Map perspective chosen (isometric or top-down)
- [ ] Sprite style approved (factory, truck, job site examples)
- [ ] Color palette confirmed
- [ ] Animation style verified
- [ ] LOD levels make sense
- [ ] Interaction flows clear
- [ ] Audio approach agreed upon
- [ ] Timeline and phases realistic

**Once all checked, proceed to implementation!**

---

*Document Version: 1.0*
*Last Updated: 2026-01-11*
*Status: Awaiting Design Approval*
