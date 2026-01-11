# Factory Map Sprite Generation Guide

## Overview

This document covers the sprite generation workflow established for the Factory Map project, including AI generation settings, prompts, and code implementation for dynamic glow effects.

---

## Art Direction Decision

### Final Style Choice
- **Model**: Scenario.gg "Isometric Background" model
- **Art Style**: Studio Ghibli-inspired, hand-painted aesthetic
- **NOT**: Mobile game / Clash of Clans style (too cartoony)
- **Target Feel**: Age of Empires 3 / Civilization 5 / Spirited Away backgrounds

### Why This Style Works
- Warm, inviting, nostalgic feel
- Hand-painted texture adds character
- Buildings feel "lived in" with personality
- Matches the gamified PM vision without being too casual

---

## Scenario.gg Settings

### Recommended Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| **Model** | Isometric Background | Best results for this style |
| **Dimensions** | 832 x 1216 | ~2:3 ratio, high detail |
| **Guidance** | 6-7 | Higher = follows prompt better |
| **Sampling Steps** | 35-40 | More refinement for details |
| **Image Count** | 3-4 | For first attempts |
| **Seed** | Random initially | Lock once you get good results |

### Reference Image Settings (for variations)

| Setting | Value |
|---------|-------|
| **Mode** | Image to Image |
| **Influence** | 75-80% |

---

## Factory Sprite Prompts

### Master Idle State (Use This First)

```
Isometric factory building, Studio Ghibli background art style, anime scenery illustration

Cozy industrial warehouse on grassy plot, cream weathered walls, gray stone foundation, peaked slate roof with painted tile texture, two brick smokestacks with aged patina, no smoke

Eight wooden-framed windows, all dark and unlit, factory at rest, warm brown door with worn steps, large warehouse door, orange accent stripe, vintage pipes, ivy climbing corner, wildflowers at base

Golden hour lighting, soft atmospheric shadows, warm nostalgic mood, peaceful end-of-day scene, hand-painted aesthetic

Three-quarter isometric view, transparent background, detailed illustration, game background asset
```

### Negative Prompt

```
3D render, plastic, harsh shadows, cool blue, modern, sterile, mobile game, cartoon, chibi, blurry, text, watermark
```

---

## Asset Strategy: Code-Based Glow

### Decision
Instead of generating multiple sprite states (idle, active light, active medium, active heavy), we use **one master sprite** with **code-based dynamic glow**.

### Benefits
- Single asset to manage
- Perfect consistency
- Dynamic control (glow = activity level)
- Smooth animated transitions
- Less generation work

### How It Works

```
Project Count    Activity Level    Glow Effect
─────────────────────────────────────────────
0                0.0               None
1-3              0.3               Light orange glow
4-6              0.6               Medium glow + smoke
7+               1.0               Heavy glow + pulse + smoke
Hover            +0.5 boost        Enhanced glow on interaction
```

---

## Code Implementation

### Files Modified

1. **`package.json`** - Added `pixi-filters` dependency
2. **`src/components/factoryMap/sprites/FactorySprite.js`** - Complete rewrite with glow support

### Key Features Added

```javascript
// GlowFilter from pixi-filters
import { GlowFilter } from 'pixi-filters';

// Dynamic glow based on activity
this.glowFilter = new GlowFilter({
  distance: 20,
  outerStrength: 0,      // Controlled by activityLevel
  innerStrength: 0,
  color: 0xf97316,       // Sunbelt orange
  quality: 0.3
});

// Activity levels set automatically from project count
factory.setActivityLevel(0.6);  // 0-1 scale

// Or automatically via setStats()
factory.setStats({ activeProjects: 5 });  // Auto-calculates glow
```

### Sprite Loading

The code automatically tries to load:
```
/public/assets/sprites/factory_idle.png
```

If not found, falls back to programmatic graphics.

---

## Folder Structure

```
public/
└── assets/
    └── sprites/
        └── factory_idle.png    ← Put your sprite here
```

---

## Next Steps

### Immediate
1. Export factory sprite from Scenario.gg with transparent background
2. Save as `public/assets/sprites/factory_idle.png`
3. Run `npm run dev` and test on Factory Map page
4. Adjust smoke particle positions if needed (line 181 in FactorySprite.js)

### Future Assets to Generate
- [ ] Delivery truck sprite (same style)
- [ ] USA map background
- [ ] Construction site stages
- [ ] Terrain elements (trees, mountains if needed)

---

## USA Map Prompt (For Later)

```
Top-down stylized USA map, pixel art game asset, strategy game world map

MAP SHAPE:
- Continental United States outline (no Alaska/Hawaii)
- Clean border edge
- Transparent background outside USA shape

TERRAIN REGIONS (natural transitions between areas):
- NORTHWEST: Dark green pine forests, gray-blue mountains
- CALIFORNIA COAST: Golden tan hills, green valleys
- SOUTHWEST: Desert tan and orange, scattered cacti dots
- ROCKY MOUNTAINS: Gray and white snow-capped peaks running north-south
- GREAT PLAINS: Golden wheat color, gentle texture
- MIDWEST: Light green farmland pattern
- GREAT LAKES: Deep blue water bodies
- SOUTHEAST: Rich green forests, hints of blue rivers
- FLORIDA: Bright green peninsula, surrounded by blue
- NORTHEAST: Mixed green and autumn orange forests
- TEXAS: Mix of desert tan (west) and green (east)

WATER:
- Atlantic Ocean: Deep blue on right edge
- Pacific Ocean: Deep blue on left edge
- Gulf of Mexico: Blue curve along southern coast
- Great Lakes: Visible blue shapes

STYLE:
- Studio Ghibli / hand-painted aesthetic (match factory style)
- Painterly, soft terrain transitions (no hard lines)
- Subtle texture throughout
- Warm, earthy color palette
- NO state borders, NO city markers, NO text labels
- Light source from top-left
- Game-ready background asset
- Dimensions: wide format (16:9 ratio ideal)
```

---

## Troubleshooting

### Sprite Not Loading
- Check file path: must be `/public/assets/sprites/factory_idle.png`
- Check browser console for errors
- Ensure PNG has transparency

### Glow Not Showing
- Verify `pixi-filters` is installed: `npm list pixi-filters`
- Check that factory has active projects (glow only shows when activity > 0)
- Try hovering over factory (hover boost should show glow)

### Smoke Position Wrong
Edit line 181 in `FactorySprite.js`:
```javascript
const positions = this.usesSpriteImage
  ? [{ x: -15, y: -60 }, { x: 10, y: -55 }]  // Adjust x, y values
  : [{ x: -20, y: -35 }, { x: 15, y: -32 }];
```

---

## Git Branch

All changes are on branch:
```
claude/isometric-map-alternatives-98Ixu
```

---

*Document created: 2026-01-11*
*Last updated: 2026-01-11*
