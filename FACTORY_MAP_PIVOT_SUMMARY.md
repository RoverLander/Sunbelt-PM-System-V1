# Factory Map: Architecture Pivot Summary

**Date:** January 12, 2026
**Decision:** Pivot from React-integrated to Standalone Vanilla JS Implementation

---

## What Was Done

### 1. Documentation Updated ✅
- **[FACTORY_MAP_README.md](docs/FACTORY_MAP_README.md)** - Updated with architecture pivot notice
- **[FACTORY_MAP_STANDALONE_PLAN.md](docs/FACTORY_MAP_STANDALONE_PLAN.md)** - Complete implementation plan
- React-specific docs marked as archived/deprecated

### 2. UI Updated ✅
- **[FactoryMapFullscreen.jsx](src/pages/FactoryMapFullscreen.jsx)** - Shows "Under Construction" notice
- Clean, professional design explaining the architecture change
- Maintains user trust with transparency about the rebuild

### 3. Supabase Folder Organized ✅
- **[supabase/README.md](supabase/README.md)** - Comprehensive documentation added
- All folders (demo, migrations, setup) documented
- Clear usage instructions for each script type

---

## Why We Pivoted

### Issues Encountered with React + PIXI Integration

1. **Event Handling Conflicts**
   - React's synthetic events blocked PIXI canvas wheel/mouse events
   - Mouse wheel scrolled page instead of zooming map
   - Event listeners orphaned on component re-mount

2. **React StrictMode Problems**
   - Double-mounting broke PIXI event listener setup
   - Even after disabling, HMR inconsistently updated components

3. **Sprite Rendering Issues**
   - Sprites positioned off-screen with negative Y coordinates
   - GlowFilter + anchor point interaction caused bounds calculation errors
   - React reconciliation interfered with PIXI's imperative canvas updates

4. **Debugging Complexity**
   - Hard to determine if issues were from React or PIXI
   - HMR made it unclear if code changes actually applied
   - Console logs showed "successful" but visuals didn't match

### Multiple Fix Attempts Made

Over 6+ hours of debugging, we tried:
- ✗ Adjusting sprite anchor points (3 different approaches)
- ✗ Disabling React StrictMode
- ✗ Fixing component lifecycle (early returns, cleanup)
- ✗ Adding canvas touch-action styling
- ✗ Removing React synthetic event handlers
- ✗ Manual Y offset calculations
- ✗ Hard refreshes, cache clearing, full server restarts

**Result:** Sprites loaded successfully but remained invisible. Zoom never worked.

---

## The Solution: Standalone Vanilla JS

### Key Insight
**90% of the PIXI code is already vanilla JavaScript!**

The React wrapper was only ~100 lines. The other ~3000 lines are pure JS classes:
- `layers/` - All reusable ✅
- `sprites/` - All reusable ✅
- `systems/` - All reusable ✅
- `effects/` - All reusable ✅

**We just need to remove the React wrapper and create a simple HTML entry point.**

### Benefits of Standalone Approach

1. **Eliminates All React Conflicts**
   - No synthetic events blocking canvas
   - No StrictMode double-mounting
   - No HMR inconsistencies
   - No lifecycle management issues

2. **Simpler & Faster**
   - Direct browser events work as documented
   - Standard JavaScript debugging
   - No virtual DOM overhead
   - Faster initial load

3. **Easy Integration**
   - Can still link from main app
   - Can embed via iframe if needed
   - Authentication via URL params or postMessage
   - Feels like part of the same system

4. **90% Code Reuse**
   - Copy existing PIXI classes
   - Update import statements
   - Create simple HTML/JS wrapper
   - Done!

---

## What's Next

### Implementation Plan

See **[FACTORY_MAP_STANDALONE_PLAN.md](docs/FACTORY_MAP_STANDALONE_PLAN.md)** for full details.

**Summary:**
1. Create `public/factory-map-standalone/` folder structure
2. Copy all PIXI layers/sprites/systems (already vanilla JS!)
3. Create `index.html` + `app.js` entry point
4. Replace React hooks with fetch API
5. Add authentication token passing
6. Test zoom, pan, sprite rendering
7. Integrate with main app (link or iframe)

**Estimated Time:** 8-12 hours of focused work
**Complexity:** Low-Medium (mostly copying existing code)

### Testing Checklist

Before marking as complete:
- [ ] Map loads without errors
- [ ] Mouse wheel zooms map (NOT scrolling page)
- [ ] Click-drag pans map smoothly
- [ ] All 14 factories visible with sprites
- [ ] Data loads from Supabase API
- [ ] Routes and trucks animate
- [ ] 60 FPS performance maintained
- [ ] < 3 second initial load time

---

## Files Changed

### Updated
- `docs/FACTORY_MAP_README.md` - Architecture pivot notice
- `src/pages/FactoryMapFullscreen.jsx` - Under construction UI

### Created
- `docs/FACTORY_MAP_STANDALONE_PLAN.md` - Implementation guide
- `supabase/README.md` - Database documentation
- `FACTORY_MAP_PIVOT_SUMMARY.md` - This file

### Preserved (Reference Only)
- `src/components/factoryMap/` - All PIXI code (will be copied)
- `docs/FACTORY_MAP_TECHNICAL_ARCHITECTURE.md` - React architecture (archived)
- `docs/FACTORY_MAP_WORKFLOW.md` - React workflow (archived)

### Still Valid
- `docs/FACTORY_MAP_DESIGN_DOC.md` - Design vision unchanged
- `docs/FACTORY_MAP_SPRITE_SPECS.md` - Sprite specs unchanged
- `public/assets/sprites/factory_idle.png` - Studio Ghibli sprites ready

---

## Lessons Learned

### What Worked
✅ PIXI.js is excellent for canvas graphics
✅ Layer architecture is clean and maintainable
✅ LOD system performs well
✅ AI-generated sprites (Scenario.gg) look great
✅ ViewportController handles zoom/pan elegantly

### What Didn't Work
❌ React + imperative canvas libraries = friction
❌ Synthetic events block native browser events
❌ HMR unreliable for canvas components
❌ StrictMode incompatible with PIXI lifecycles

### Best Practices Identified
1. **Use React for UI, not canvas** - React excels at UI, struggles with imperative canvas APIs
2. **Keep canvas code vanilla** - Easier to debug, better performance, more portable
3. **Integrate via iframe if needed** - Clean separation, no conflicts
4. **Test early without React** - Would have saved 6+ hours of debugging

---

## Recommendation

**Proceed with standalone implementation.**

The architecture pivot is the right call because:
1. We've exhausted React integration options
2. 90% of code is already reusable vanilla JS
3. Standalone eliminates all current blockers
4. Implementation time is reasonable (1-2 days)
5. End result will be more maintainable

---

## Questions?

See the full implementation plan in:
**[docs/FACTORY_MAP_STANDALONE_PLAN.md](docs/FACTORY_MAP_STANDALONE_PLAN.md)**

---

*Summary created: January 12, 2026*
*Status: Ready to Begin Standalone Implementation*
*Next Action: Follow Phase 1 of standalone plan*
