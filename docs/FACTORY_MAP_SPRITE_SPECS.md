# Factory Map - Sprite Design Specifications for AI Generation

## Overview

This document contains detailed specifications for creating pixel art sprites for the Factory Map game interface. Use these specs with AI image generation tools (Midjourney, DALL-E 3, Stable Diffusion) to create consistent, high-quality assets.

---

## Art Style Guidelines

### Overall Aesthetic
**Style Reference:** Age of Empires III + Civilization V + Retro Strategy Games

**Key Characteristics:**
- **Pixel art style** with modern polish (not strictly 8-bit)
- **Isometric perspective** for buildings and objects
- **Rich, saturated colors** with good contrast
- **Clean silhouettes** - easily readable at small sizes
- **Subtle texture** without being noisy
- **Consistent lighting** - light source from top-left
- **Game-like polish** - professional but not photorealistic

### Color Palette

**Primary Brand Colors:**
- Sunbelt Orange: `#f97316`
- Dark Navy: `#0a0a14`
- Off-White: `#f5f5f5`

**Terrain Colors:**
- Ocean Deep: `#1e40af`
- Ocean Shallow: `#3b82f6`
- Forest Green: `#166534`
- Plains Green: `#84cc16`
- Desert Tan: `#d4a574`
- Mountain Gray: `#6b7280`
- Snow White: `#f0f9ff`

**Status Colors:**
- Success Green: `#22c55e`
- Warning Yellow: `#f59e0b`
- Alert Orange: `#f97316`
- Critical Red: `#ef4444`
- Inactive Gray: `#6b7280`

---

## Factory Building Sprites

### Factory Sprite - LOD Level 1 (Far Zoom)
**Dimensions:** 24x36 pixels

**Description:**
Simple isometric factory building suitable for viewing from far away.

**AI Generation Prompt:**
```
Create a pixel art isometric factory building sprite, 24x36 pixels, viewed from top-left.
Small industrial building with:
- Simple rectangular base in dark gray (#3a3a4a)
- Peaked roof in medium gray (#5a5a6a)
- Single smokestack (3 pixels wide) on roof
- Two small orange windows (#f97316)
- Isometric perspective (pseudo-3D)
- Clean pixel art style, similar to Age of Empires
- Light source from top-left
- No background, transparent
```

**Variations Needed:**
1. **Idle State** - Dark windows, thin smoke puff
2. **Active State** - Glowing orange windows, thicker smoke, orange glow aura

---

### Factory Sprite - LOD Level 2 (Medium Zoom)
**Dimensions:** 48x72 pixels

**Description:**
More detailed factory with visible architectural elements.

**AI Generation Prompt:**
```
Create a pixel art isometric factory building sprite, 48x72 pixels, industrial modular building style.
Details:
- Isometric perspective showing left and right wall faces
- Dark gray walls (#3a3a4a left, #4a4a5a right)
- Peaked roof (#5a5a6a) with subtle tile texture
- Two smokestacks on roof (6 pixels wide each)
- 4-6 orange windows (#f97316) with frames
- Centered door (brown #2a2a3a)
- Sunbelt orange accent stripe (#f97316) around middle
- Base platform/shadow
- Similar to Age of Empires 3 building style
- Pixel art, clean and readable
- Light from top-left
- Transparent background
```

**Variations Needed:**
1. **Idle State** - Windows dark/dim
2. **Active State** - Windows bright orange, visible glow
3. **Sign Post** (separate sprite 24x32px) - Factory logo on sign, project counter below

---

### Factory Sprite - LOD Level 3 (Close Zoom)
**Dimensions:** 80x120 pixels

**Description:**
Fully detailed factory with all architectural elements visible.

**AI Generation Prompt:**
```
Create a highly detailed pixel art isometric factory building sprite, 80x120 pixels, industrial warehouse style.
Full details:
- Isometric diamond base platform (#2a2a3a)
- Three wall faces visible (left #3a3a4a, right #4a4a5a, variations)
- Detailed peaked roof (#5a5a6a) with individual tiles
- Two smokestacks with metallic rims and detail
- 8+ windows with frames and interior glow
- Prominent door with steps
- Sunbelt orange decorative stripe (#f97316) wrapping building
- Subtle weathering and texture
- Ground shadow with ambient occlusion
- Industrial vents, pipes, details
- Style similar to Age of Empires 3 or Civilization 5
- High-quality pixel art, very detailed
- Light source top-left
- Transparent background
```

**Variations Needed:**
1. **Idle State** - Minimal activity
2. **Active State - Light** (1-3 projects) - Some windows lit
3. **Active State - Medium** (4-6 projects) - Most windows lit, more smoke
4. **Active State - Heavy** (7+ projects) - All windows lit, rapid smoke, strong glow

**Additional Assets:**
- **Factory Logo Signs** (32x32px each) - 14 different factory logos
- **Project Counter Badge** (18x18px) - Green circle with number

---

## Delivery Truck Sprites

### Truck Sprite - LOD Level 2 (Medium Zoom)
**Dimensions:** 20x12 pixels

**Description:**
Simplified truck suitable for medium zoom level.

**AI Generation Prompt:**
```
Create a pixel art semi truck sprite, 20x12 pixels, side view.
Components:
- Tan/beige rectangular trailer (modular building unit)
- Orange cab (#f97316) in front
- 2 black wheels visible
- Very simple, blocky pixel art
- Recognizable as a truck hauling a modular unit
- Transparent background
```

---

### Truck Sprite - LOD Level 3 (Close Zoom)
**Dimensions:** 40x24 pixels

**Description:**
Detailed semi truck hauling modular office unit.

**AI Generation Prompt:**
```
Create a detailed pixel art semi truck sprite, 40x24 pixels, side profile view.
Details:
- Large tan/beige trailer (#d4a574) - modular office unit
  - 3 small windows (4x4px each) on trailer side
  - Paneling lines showing modular construction
  - Subtle weathering
- Sunbelt orange cab (#f97316)
  - Light blue windshield (#87CEEB)
  - Side window
  - Chrome details (exhaust stack, mirrors)
- 3 black wheels (#1a1a1a) with gray centers
- Visible details: door handle, logos, lights
- Style similar to pixel art strategy games
- Clean, readable silhouette
- Transparent background
```

**Additional Assets:**
- **Exhaust Puff** (8x8px) - Gray smoke cloud
- **Dust Particle** (6x6px) - Tan dust cloud

---

## Construction Site / Job Site Sprites

### Stage 1: Dirt Patch
**Dimensions:** 64x48 pixels

**AI Generation Prompt:**
```
Create pixel art construction site sprite, 64x48 pixels, isometric view.
Stage 1 - Initial site:
- Leveled dirt pad (brown #8b7355)
- Tire track marks in dirt
- Simple site marker post
- Minimal detail, just cleared land
- Isometric perspective matching factory buildings
- Transparent background
```

---

### Stage 2: Early Construction
**Dimensions:** 64x48 pixels

**AI Generation Prompt:**
```
Create pixel art construction site sprite, 64x48 pixels, isometric view.
Stage 2 - Early progress:
- Brown dirt pad with tracks
- 4-6 orange/white construction barriers around perimeter
- Yellow excavator (16x12px) on site
- Yellow bulldozer (18x10px) nearby
- Dirt and gravel piles
- Basic construction activity visible
- Isometric perspective
- Pixel art style, detailed
- Transparent background
```

---

### Stage 3: Foundation Stage
**Dimensions:** 64x48 pixels

**AI Generation Prompt:**
```
Create pixel art construction site sprite, 64x48 pixels, isometric view.
Stage 3 - Foundation work:
- Concrete stem wall foundation (gray #6b7280) visible
- Rebar details (small vertical lines in foundation)
- Construction crane with rotating boom
- Cement mixer truck
- Site trailer/office (small white rectangle)
- More barriers and safety equipment
- Active construction site feel
- Isometric perspective
- Transparent background
```

---

### Stage 4: Completed Modular Building
**Dimensions:** 48x36 pixels

**AI Generation Prompt:**
```
Create pixel art modular office building sprite, 48x36 pixels, isometric view.
Completed modular building:
- Tan/beige modular office (#d4a574)
- 4-6 windows with curtains
- Centered brown door with steps
- Gray peaked roof
- AC unit on roof (small gray box)
- Clean, finished appearance
- Subtle ground landscaping (small shrubs)
- Isometric perspective matching factories
- Professional, completed look
- Transparent background
```

**Decay Sequence:**
Create additional sprites showing building at 80%, 60%, 40%, 20% opacity for fade-out effect.

---

## Terrain & Ambient Sprites

### Trees (Forest Regions)
**Dimensions:** Various (12x18px to 24x32px)

**AI Generation Prompt:**
```
Create pixel art tree sprites for strategy game map, various sizes.
Tree types needed:
1. Pine tree (12x18px) - Dark green, conical
2. Deciduous tree (16x20px) - Round canopy, green
3. Tree cluster (24x32px) - 3-4 trees grouped

Requirements:
- Simple, stylized pixel art
- Recognizable tree silhouettes
- Colors: dark green (#166534), medium green (#22c55e)
- Suitable for map background decoration
- Transparent background
- Light from top-left
```

---

### Mountains
**Dimensions:** Various (32x40px to 80x60px)

**AI Generation Prompt:**
```
Create pixel art mountain sprites for strategy game map.
Mountain styles:
1. Single peak (32x40px) - Rocky mountain
2. Mountain range (80x60px) - 3-4 connected peaks
3. Snow-capped peak (40x50px) - White snow cap

Requirements:
- Isometric/pseudo-3D perspective
- Gray rocky texture (#6b7280)
- White snow caps (#f0f9ff) on peaks
- Subtle shading for depth
- Style matches Age of Empires terrain
- Transparent background
```

---

### Water Features

**River Segment (32x32px):**
```
Create pixel art river tile, 32x32 pixels, top-down view.
Animated water tile:
- Blue water (#3b82f6)
- Subtle wave pattern
- Flowing appearance (create 4 frames for animation loop)
- Tile-able edges for connecting segments
- Light shimmer effect
- Transparent background
```

**Lake Section (64x64px):**
```
Create pixel art lake tile, 64x64 pixels, top-down view.
Large water body:
- Deep blue center (#1e40af)
- Lighter blue edges (#3b82f6)
- Gentle wave texture
- Suitable for tiling
- Slight shimmer/reflection
- Transparent background
```

---

### Desert Elements

**Cactus (12x18px):**
```
Create pixel art saguaro cactus sprite, 12x18 pixels.
Desert cactus:
- Classic saguaro shape with arms
- Green (#5a7a45) with darker outlines
- Simple, iconic silhouette
- Suitable for desert regions
- Transparent background
```

**Tumbleweed (16x12px):**
```
Create pixel art tumbleweed sprite, 16x12 pixels.
Rolling tumbleweed:
- Spherical brown shape (#8b7355)
- Tangled branch appearance
- Create 4 rotation frames for rolling animation
- Light and airy look
- Transparent background
```

---

## Weather & Ambient Effects

### Cloud Sprites
**Dimensions:** Various (40x20px to 120x40px)

**AI Generation Prompt:**
```
Create pixel art cloud sprites for strategy game sky.
Cloud types:
1. Small fluffy cloud (40x20px)
2. Medium cloud (80x30px)
3. Large cloud (120x40px)
4. Storm cloud (100x35px) - darker gray

Requirements:
- White/light gray (#f5f5f5 to #d1d5db)
- Fluffy, cartoonish style
- Semi-transparent edges
- Suitable for slow drift animation
- Transparent background
```

---

### Weather Particles

**Rain Drop (2x4px):**
```
Create pixel art rain drop sprite, 2x4 pixels.
Simple rain streak:
- Light blue/white
- Diagonal angle (45 degrees)
- Minimal detail (just 2-4 pixels)
- For use in bulk (100+ on screen)
```

**Snowflake (4x4px):**
```
Create pixel art snowflake sprite, 4x4 pixels.
Small snowflake:
- White with slight blue tint
- Simple 6-pointed star or circle
- Very minimal (4-6 pixels total)
- For use in bulk
- Transparent background
```

---

### Birds
**Dimensions:** 8x6 pixels

**AI Generation Prompt:**
```
Create pixel art bird flock sprite, birds 8x6 pixels each.
Flying birds:
- V-formation (3-7 birds)
- Black silhouettes
- Simple V or W shape per bird
- 2 frame wing flap animation
- Very simple, recognizable as birds
- Transparent background
```

---

## UI Elements

### PM Portrait Frame
**Dimensions:** 64x64 pixels

**AI Generation Prompt:**
```
Create 8-bit style character portrait template, 64x64 pixels.
Retro game character portrait:
- Square frame with slight border
- Space for pixel art face (48x48px inner area)
- Retro RPG/strategy game style
- Border color changes based on "health":
  - Green (#22c55e) - healthy
  - Yellow (#f59e0b) - moderate
  - Orange (#f97316) - stressed
  - Red (#ef4444) - critical
- Transparent background

Note: Actual faces will be created separately, this is just the frame.
```

---

### Particle Effects

**Celebration Particle (6x6px):**
```
Create pixel art celebration particle, 6x6 pixels.
Confetti pieces:
- Small squares, circles, stars
- Bright colors: orange (#f97316), yellow (#f59e0b), gold (#fbbf24), white
- Simple shapes for particle system
- Multiple variations (10-15 different particles)
- Transparent background
```

**Smoke Puff (12x12px):**
```
Create pixel art smoke puff sprite, 12x12 pixels.
Factory smoke:
- Fluffy white/gray cloud (#f5f5f5)
- Create 4 frames showing expansion (6px → 12px)
- Fades from solid to semi-transparent
- For factory smokestack animation
- Transparent background
```

**Dust Cloud (8x8px):**
```
Create pixel art dust cloud sprite, 8x8 pixels.
Truck dust:
- Tan/brown (#c4956a)
- Small puffy cloud
- 3 frames showing expansion
- Semi-transparent
- For truck trail effect
- Transparent background
```

---

## Icon Assets

### Factory Logo Icons
**Dimensions:** 16x16 pixels each

Need 14 unique factory logos. Each should be:
- Simple, recognizable symbol
- Fits in 16x16px
- Uses Sunbelt orange (#f97316) as primary color
- Clear silhouette
- Professional industrial theme

**Suggestions:**
1. NWBS - Mountain with building
2. BRIT - Maple leaf with gear
3. WM-WEST - California bear
4. MM - Letter M with wheels
5. PMI - Palm tree with building
6. SSI - Sun with building silhouette
7. AMTEX - Texas star
8. MRS - Steel I-beam
9. CB - Music note (Nashville)
10. IND - Gear icon
11. SEMO - Peach with building
12. WM-EAST - Abstract building
13. MS - Keystone shape
14. MG - Lightbulb or brain

---

## Sprite Sheet Organization

### Recommended Layout

**factories.png** (Texture Atlas)
```
- Factory LOD1 Idle (24x36)
- Factory LOD1 Active (24x36)
- Factory LOD2 Idle (48x72)
- Factory LOD2 Active (48x72)
- Factory LOD3 Idle (80x120)
- Factory LOD3 Active Light (80x120)
- Factory LOD3 Active Medium (80x120)
- Factory LOD3 Active Heavy (80x120)
- Sign Posts x14 (24x32 each)
- Factory Logos x14 (16x16 each)
```

**trucks.png**
```
- Truck LOD2 (20x12) x4 rotation angles
- Truck LOD3 (40x24) x8 rotation angles
- Exhaust puff x4 frames (8x8)
- Dust particles x3 frames (6x6)
```

**jobsites.png**
```
- Dirt patch (64x48)
- Early construction (64x48)
- Foundation (64x48)
- Completed building (48x36)
- Fade variants (48x36) x5 opacity levels
```

**terrain.png**
```
- Trees (various sizes) x10 variants
- Mountains (various sizes) x5 variants
- Cacti x3 variants
- Tumbleweeds x4 frames
```

**ambient.png**
```
- Clouds x6 variants
- Birds x3 formations
- Rain drops
- Snowflakes
- Smoke puffs x4 frames
```

**ui.png**
```
- PM portrait frames x4 colors
- Celebration particles x15 variants
- Icons and badges
```

---

## Animation Frame Sequences

### Smoke Stack Animation
**Frames:** 4
**Duration:** 2 seconds total (0.5s per frame)
```
Frame 1: Small puff (6x6px) at stack top
Frame 2: Medium cloud (10x10px) rising 10px
Frame 3: Larger cloud (14x14px) rising 20px
Frame 4: Faded cloud (16x16px) rising 30px, alpha 0.3
```

### Truck Wheels Rotation
**Frames:** 4
**Duration:** 0.5 seconds loop
```
Frame 1: Spoke at 0°
Frame 2: Spoke at 90°
Frame 3: Spoke at 180°
Frame 4: Spoke at 270°
```

### Tree Sway
**Frames:** 4
**Duration:** 3 seconds loop
```
Frame 1: Neutral position
Frame 2: Lean right 2°
Frame 3: Neutral position
Frame 4: Lean left 2°
```

---

## Quality Checklist

Before accepting sprites, verify:
- [ ] Correct dimensions (exact pixel size)
- [ ] Transparent background (no white/black)
- [ ] Consistent lighting (top-left)
- [ ] Clean edges (no anti-aliasing artifacts)
- [ ] Color palette matches specifications
- [ ] Readable at target size
- [ ] Matches style of other sprites
- [ ] Animation frames align properly
- [ ] No compression artifacts
- [ ] Saved as PNG (not JPG)

---

## File Naming Convention

```
<category>_<name>_<variant>_<frame>.png

Examples:
factory_lod3_active_heavy.png
truck_lod2_rotation_0.png
jobsite_stage2_construction.png
tree_pine_small.png
cloud_medium_01.png
smoke_puff_frame_3.png
```

---

## Export Settings

**File Format:** PNG-24
**Color Mode:** RGB + Alpha
**Resolution:** 72 DPI (screen)
**Compression:** Lossless PNG
**No Interlacing**
**No Metadata**

---

## Integration Notes

Once sprites are created:
1. Create sprite sheets using TexturePacker or similar tool
2. Generate JSON metadata for PIXI.js
3. Replace PIXI.Graphics calls with PIXI.Sprite
4. Update dimensions in sprite constructors
5. Test all animations frame by frame
6. Verify performance (sprite sheets reduce draw calls)

---

*Document Version: 1.0*
*Last Updated: 2026-01-11*

*Ready for AI image generation tools (Midjourney, DALL-E 3, Stable Diffusion)*
