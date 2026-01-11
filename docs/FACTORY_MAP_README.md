# Factory Map System - Documentation Index

## Overview

The Factory Map is a gamified, interactive visualization of the Sunbelt PM network built with PIXI.js and React. It transforms project management into an engaging strategy game-style interface where users can track factories, deliveries, and project progress in real-time.

**Style Inspiration:** Age of Empires III + Civilization V + SimCity 4

---

## Quick Links

### 📚 Documentation
- **[FACTORY_MAP_DESIGN_DOC.md](./FACTORY_MAP_DESIGN_DOC.md)** - Complete design vision (500+ lines)
- **[FACTORY_MAP_TECHNICAL_ARCHITECTURE.md](./FACTORY_MAP_TECHNICAL_ARCHITECTURE.md)** - System architecture
- **[FACTORY_MAP_WORKFLOW.md](./FACTORY_MAP_WORKFLOW.md)** - Development process & workflow
- **[FACTORY_MAP_SPRITE_SPECS.md](./FACTORY_MAP_SPRITE_SPECS.md)** - AI-ready sprite specifications

### 🎮 Implementation
- **Source Code:** `src/components/factoryMap/`
- **Dev Server:** `npm run dev` → http://localhost:5174
- **Main Route:** `/factory-map-fullscreen`

---

## Project Status

### ✅ Completed (Phase 1)
- PIXI.js v8 initialization
- Basic map rendering (USA outline)
- Factory sprite system (isometric 3D)
- Pan/zoom controls
- LOD system foundation
- Route rendering system
- Truck sprite system
- Job site sprites

### 🚧 Current Phase: Phase 2
**Goal:** Build working functional system with programmatic graphics

**Next Steps:**
1. Verify current rendering (check for errors)
2. Fix any broken visuals
3. Implement full interactions (hover, click)
4. Add animations (smoke, trucks, particles)
5. Connect to real project data

### 📋 Upcoming Phases
- **Phase 3:** Job site progression system
- **Phase 4:** UI polish and detail panels
- **Phase 5:** Ambient effects (weather, day/night)
- **Phase 6:** Art replacement with AI-generated sprites

---

## Document Purposes

### 1. Design Document (FACTORY_MAP_DESIGN_DOC.md)
**Purpose:** Complete vision and requirements

**Contains:**
- User stories and purpose
- Visual style direction
- Feature specifications
- LOD system details
- Interaction designs
- Animation specs
- Success metrics

**Audience:** Product owners, designers, developers

---

### 2. Technical Architecture (FACTORY_MAP_TECHNICAL_ARCHITECTURE.md)
**Purpose:** How the system works

**Contains:**
- Technology stack
- Layer architecture
- Sprite class structure
- Data flow diagrams
- Performance optimizations
- API integration
- Event system
- File structure

**Audience:** Developers, technical leads

---

### 3. Workflow Guide (FACTORY_MAP_WORKFLOW.md)
**Purpose:** How to build and maintain it

**Contains:**
- Implementation phases
- Daily development workflow
- Git workflow
- Testing strategy
- Debugging guide
- Performance optimization
- Release checklist
- Maintenance tasks

**Audience:** Developers, project managers

---

### 4. Sprite Specifications (FACTORY_MAP_SPRITE_SPECS.md)
**Purpose:** Create visual assets with AI tools

**Contains:**
- Detailed AI generation prompts
- Sprite dimensions and styles
- Color palette specifications
- Animation frame sequences
- File organization
- Quality checklist
- Export settings

**Audience:** Designers, AI prompt engineers

---

## Development Workflow Summary

### Phase 1: Build with Code (Current)
```javascript
// Use PIXI.Graphics to create sprites programmatically
const factory = new PIXI.Graphics();
factory.rect(0, 0, 80, 120).fill(0x3a3a4a);
```

**Advantages:**
- Fast iteration
- Test functionality immediately
- No dependency on external artists
- Easy to modify and experiment

### Phase 2: Generate with AI (Future)
```
Input: FACTORY_MAP_SPRITE_SPECS.md prompts
AI Tool: Midjourney / DALL-E 3 / Stable Diffusion
Output: High-quality pixel art sprites
```

**Advantages:**
- Professional visual quality
- Consistent art style
- Matches reference aesthetics (AoE3/Civ5)
- Customizable and refinable

### Phase 3: Integrate Assets
```javascript
// Replace Graphics with Sprites
const texture = await PIXI.Assets.load('factories.png');
const factory = new PIXI.Sprite(texture);
```

**Advantages:**
- Better performance (texture atlases)
- Polished visual appearance
- Easier to update individual assets
- Reduced code complexity

---

## Key Features

### Core Gameplay Elements
✅ **14 Factory Locations** across the USA
✅ **Interactive Map** with pan/zoom
✅ **Delivery Routes** connecting factories to job sites
✅ **Animated Trucks** traveling along routes
✅ **Construction Sites** showing project progression
✅ **Particle Effects** for celebrations

### Visual Systems
🎨 **LOD System** - 3 levels of detail based on zoom
🌍 **Terrain Features** - Mountains, rivers, forests
☁️ **Ambient Animations** - Clouds, birds, weather
🌓 **Day/Night Cycle** - Dynamic lighting (toggleable)
🎭 **PM Portraits** - 8-bit health visualization

### Interactions
🖱️ **Hover Tooltips** - Detailed info on hover
🖱️ **Click Actions** - Detail panels and menus
⌨️ **Keyboard Shortcuts** - Fast navigation (1-9, arrows)
📊 **Live Data** - Real-time project updates

---

## Technical Stack

### Core Technologies
- **Rendering:** PIXI.js v8.15.0 (WebGL)
- **Framework:** React 19.2.3
- **Build Tool:** Vite 7.3.0
- **Language:** JavaScript/JSX

### Architecture
```
React Components (State & UI)
    ↓
PixiMapCanvas (PIXI Wrapper)
    ↓
Layers (Rendering System)
├── USMapLayer (Background)
├── TerrainLayer (Decorations)
├── RoutesLayer (Delivery paths)
├── JobSitesLayer (Construction)
├── FactoriesLayer (Buildings)
├── TrucksLayer (Vehicles)
└── CelebrationParticles (Effects)
    ↓
Sprites (Individual Objects)
├── FactorySprite
├── TruckSprite
└── JobSiteSprite
```

---

## Color Palette Reference

### Brand Colors
```css
--sunbelt-orange: #f97316;
--dark-navy: #0a0a14;
--off-white: #f5f5f5;
```

### Status Colors
```css
--success-green: #22c55e;
--warning-yellow: #f59e0b;
--alert-orange: #f97316;
--critical-red: #ef4444;
--inactive-gray: #6b7280;
```

### Terrain Colors
```css
--ocean-deep: #1e40af;
--ocean-shallow: #3b82f6;
--forest-green: #166534;
--plains-green: #84cc16;
--desert-tan: #d4a574;
--mountain-gray: #6b7280;
```

---

## Performance Targets

### FPS Goals
- **60 FPS** at medium zoom (LOD 2)
- **30+ FPS** at max zoom (LOD 3)
- **Stable performance** with 100+ sprites

### Load Times
- **< 3 seconds** initial render
- **< 500ms** interaction response
- **< 2 seconds** zoom level transitions

### Memory
- **Stable memory usage** over time
- **No memory leaks** from sprite creation/destruction
- **Efficient garbage collection**

---

## Browser Support

### Minimum Requirements
- **Chrome 90+**
- **Firefox 88+**
- **Safari 14+**
- **Edge 90+**
- **WebGL 2.0 support**

### Recommended
- **Chrome 120+** (latest)
- **1920x1080** resolution or higher
- **Modern GPU** for smooth animations

---

## File Locations

### Source Code
```
src/components/factoryMap/
├── FactoryMapPage.jsx
├── FactoryMapFullscreen.jsx
├── PixiMapCanvas.jsx
├── layers/
├── sprites/
├── systems/
├── effects/
└── data/
```

### Documentation
```
docs/
├── FACTORY_MAP_README.md (this file)
├── FACTORY_MAP_DESIGN_DOC.md
├── FACTORY_MAP_TECHNICAL_ARCHITECTURE.md
├── FACTORY_MAP_WORKFLOW.md
└── FACTORY_MAP_SPRITE_SPECS.md
```

### Assets (Future)
```
public/assets/factoryMap/
├── sprites/
│   ├── factories.png
│   ├── trucks.png
│   ├── jobsites.png
│   ├── terrain.png
│   └── ui.png
└── audio/
    ├── music/
    └── sfx/
```

---

## Getting Started

### For Developers

1. **Read Technical Architecture**
   - Understand the system structure
   - Review layer architecture
   - Study sprite classes

2. **Read Workflow Guide**
   - Follow development process
   - Use git workflow
   - Run tests

3. **Start Coding**
   - Pick a task from Phase 2
   - Write code
   - Test locally
   - Commit changes

### For Designers

1. **Read Design Document**
   - Understand the vision
   - Review style references
   - Note animation requirements

2. **Read Sprite Specifications**
   - Review all sprite requirements
   - Note dimensions and styles
   - Understand animation frames

3. **Generate Assets**
   - Use AI tools (Midjourney, DALL-E)
   - Follow prompts exactly
   - Export as PNG
   - Organize sprite sheets

### For Product Owners

1. **Read Design Document**
   - Understand feature set
   - Review user interactions
   - Note success metrics

2. **Review Workflow**
   - Understand implementation phases
   - Track progress
   - Provide feedback

3. **Test & Validate**
   - Review working prototypes
   - Validate against requirements
   - Sign off on phases

---

## Common Questions

### Q: Why build with code first instead of using art immediately?
**A:** Building with PIXI.Graphics lets us:
- Test functionality quickly
- Iterate on interactions
- Verify performance
- Provide working reference for artists
- Avoid wasted art effort if design changes

### Q: When will we add the AI-generated sprites?
**A:** After Phase 3 (functional system complete). We'll:
1. Have working system to reference
2. Know exact sprite requirements
3. Generate all assets at once
4. Replace programmatic graphics with sprites
5. Fine-tune and polish

### Q: Can we use real pixel art instead of AI?
**A:** Yes! The sprite specs work for human artists too. You can:
- Commission a pixel artist on Fiverr
- Use Aseprite to create sprites manually
- Hire a game artist
- Mix AI and manual creation

### Q: How do I test the current map?
**A:**
```bash
npm run dev
# Navigate to http://localhost:5174
# Click "Factory Map" in sidebar
# Or go to /factory-map-fullscreen
```

### Q: Where do I report bugs?
**A:** Create issues in the project repository with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if visual
- Browser and OS info

---

## Contact & Support

### Development Team
- **Technical Lead:** [Name]
- **Product Owner:** [Name]
- **Design Lead:** [Name]

### Resources
- **GitHub:** [Repository URL]
- **Documentation:** `docs/` folder
- **API Docs:** [API documentation link]
- **Design Assets:** [Figma/Asset link]

---

## Changelog

### Version 1.0 (2026-01-11)
- Initial documentation created
- Design vision captured
- Technical architecture documented
- Workflow established
- Sprite specifications detailed

### Future Versions
- Will track implementation progress
- Note major milestones
- Document API changes
- Update with new features

---

## Next Steps

### Immediate (This Week)
1. ✅ Complete documentation
2. ⏳ Verify current implementation renders
3. ⏳ Fix any broken visuals
4. ⏳ Add missing interactions
5. ⏳ Connect to real data

### Short Term (Next 2 Weeks)
- Complete Phase 2 (routes & trucks)
- Start Phase 3 (job sites)
- Begin sprite generation with AI
- Performance optimization pass

### Long Term (Next 6 Weeks)
- Complete Phases 4-6
- Replace all graphics with sprites
- Full polish pass
- User acceptance testing
- Production deployment

---

## Success Metrics

### Technical
- [ ] 60 FPS at medium zoom
- [ ] < 3 second load time
- [ ] Zero memory leaks
- [ ] All browsers supported

### User Experience
- [ ] Intuitive interactions
- [ ] Engaging animations
- [ ] Clear information hierarchy
- [ ] Responsive feedback

### Business Value
- [ ] Increased PM engagement
- [ ] Faster status awareness
- [ ] Reduced status meetings
- [ ] Positive user feedback

---

*Documentation maintained by: Development Team*
*Last updated: 2026-01-11*
*Status: Active Development - Phase 2*
