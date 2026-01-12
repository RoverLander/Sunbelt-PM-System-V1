# URGENT: Factory Map Sprite Rendering & Zoom Debug Session

## Current Problem Summary
The Factory Map page is NOT working correctly:
1. **Sprites invisible** - Factory building sprites load but don't render on screen
2. **Zoom broken** - Mouse wheel scrolls the PAGE instead of zooming the map
3. **No interaction** - Map doesn't respond to zoom/pan controls

## What We Know (From Previous Debug Session)

### Sprite Loading Status
✅ **Sprites ARE loading successfully**
- Texture file exists: `public/assets/sprites/factory_idle.png` (756KB, 832x1216px)
- All 14 factories log "Texture loaded successfully"
- Sprites created with dimensions: 80x117 pixels (scaled from 832x1216)
- Console shows: `visible: true`, `alpha: 1`

### The Root Cause Found
❌ **Sprites positioned OFF-SCREEN with NEGATIVE Y coordinates**
```
Sprite bounds from console:
minY: -239.63
maxY: -169.47
minX: 1611
maxX: 1659
```

The sprites are being rendered ABOVE the visible viewport due to anchor point calculation.

### Attempted Fixes (Not Working Yet)
1. Changed sprite anchor from `(0.5, 0.85)` to `(0.5, 1.0)` in FactorySprite.js line 112
2. Added `onWheel={(e) => e.preventDefault()}` to container div in PixiMapCanvas.jsx line 398
3. Added debug logging to ViewportController.js

**User reports AFTER these changes: Still broken, same symptoms**

## Critical Files to Investigate

### 1. FactorySprite.js (Sprite Creation)
**Path:** `src/components/factoryMap/sprites/FactorySprite.js`

**Key sections:**
- Lines 96-127: `createSpriteBuilding()` - where sprite is created and positioned
- Line 112: Anchor point setting (recently changed to `0.5, 1.0`)
- Line 120: `addChildAt(sprite, 0)` - sprite added to container

**Questions to answer:**
- Is the anchor change actually taking effect? (Check HMR reload)
- Is the sprite being added to the correct container?
- What is the sprite's LOCAL position vs WORLD position?
- Is the container itself positioned correctly?

### 2. PixiMapCanvas.jsx (Canvas Setup)
**Path:** `src/components/factoryMap/PixiMapCanvas.jsx`

**Key sections:**
- Lines 70-98: PIXI initialization
- Lines 94-97: mapContainer creation and adding to stage
- Lines 122-125: FactoriesLayer added to mapContainer
- Lines 144-162: ViewportController initialization
- Line 398: `onWheel` handler (recently added)

**Questions to answer:**
- Is React HMR updating the wheel handler properly?
- Is the mapContainer scale/position being set?
- Is ViewportController.setupEventListeners() being called?
- Are there MULTIPLE instances of the canvas being created? (React StrictMode?)

### 3. ViewportController.js (Zoom/Pan System)
**Path:** `src/components/factoryMap/systems/ViewportController.js`

**Key sections:**
- Lines 58-77: `setupEventListeners()` - attaches wheel event
- Lines 121-135: `handleWheel()` - processes zoom (has debug logs)
- Lines 361-367: `applyTransform()` - applies scale to container (has debug logs)

**Questions to answer:**
- Are wheel events reaching `handleWheel()`? (Check console for debug logs)
- Is `applyTransform()` being called? (Check console)
- Is the container reference valid?
- Is the event listener being attached AFTER canvas is mounted?

## Systematic Debug Plan

### Step 1: Verify React Rendering & HMR
```bash
# Check if React StrictMode is causing double renders
# Look for duplicate log messages in console
```

**Actions:**
1. Check if PixiMapCanvas is rendering twice (count "Mount" logs)
2. Check if sprites are being created twice
3. Verify HMR is reloading components after code changes
4. Consider adding `import.meta.hot.accept()` if needed

### Step 2: Verify Canvas Event Listeners
**Add comprehensive logging to ViewportController constructor:**
```javascript
setupEventListeners() {
  const view = this.app.canvas;
  console.log('[ViewportController] Setting up event listeners on canvas:', view);
  console.log('[ViewportController] Canvas dimensions:', view.width, 'x', view.height);

  view.addEventListener('wheel', this.handleWheel, { passive: false });
  console.log('[ViewportController] Wheel listener attached');

  // Test if it fires immediately
  setTimeout(() => {
    console.log('[ViewportController] Please scroll mouse wheel over canvas NOW');
  }, 2000);
}
```

**Expected output:**
- Canvas dimensions logged
- "Wheel listener attached" message
- When user scrolls: "Wheel event: [deltaY]" messages

**If no wheel events fire:**
- Canvas might not exist when listeners attached
- Canvas might be replaced/recreated after listeners attached
- Container div's onWheel might be blocking before it reaches canvas

### Step 3: Fix Sprite Positioning
**The anchor fix might not be working because:**
1. HMR didn't reload the sprite class
2. Sprites were created BEFORE the fix
3. Container position is wrong
4. Transform is being applied incorrectly

**Add this debug code to FactorySprite.js line 112:**
```javascript
// Anchor at bottom center so sprite sits ON the factory location point
sprite.anchor.set(0.5, 1.0);
console.log('[FactorySprite] Sprite anchor set to:', sprite.anchor.x, sprite.anchor.y);
console.log('[FactorySprite] Sprite LOCAL position:', sprite.position.x, sprite.position.y);
console.log('[FactorySprite] Container WORLD position:', this.getGlobalPosition());
```

**Then check bounds AFTER adding to container:**
```javascript
this.addChildAt(sprite, 0);
const bounds = sprite.getBounds();
console.log('[FactorySprite] AFTER adding - Sprite bounds:', {
  minX: bounds.minX,
  minY: bounds.minY,
  maxX: bounds.maxX,
  maxY: bounds.maxY,
  width: bounds.width,
  height: bounds.height
});
console.log('[FactorySprite] Is sprite in viewport? minY should be > 0 and < 2000');
```

### Step 4: Force Full Reload
**React HMR might not be updating everything properly.**

**Actions:**
1. Stop dev server (Ctrl+C)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Delete `.vite` cache folder if exists
4. Restart: `npm run dev`
5. Hard refresh browser (Ctrl+Shift+R)

### Step 5: Check for Container Transform Issues
**Add logging to see the entire transform chain:**

In PixiMapCanvas.jsx after creating viewport (around line 162):
```javascript
viewportRef.current = viewport;

// Debug: Log transform chain after initialization
setTimeout(() => {
  console.log('[PixiMapCanvas] === TRANSFORM DEBUG ===');
  console.log('[PixiMapCanvas] Stage children:', app.stage.children.length);
  console.log('[PixiMapCanvas] MapContainer scale:', mapContainer.scale.x, mapContainer.scale.y);
  console.log('[PixiMapCanvas] MapContainer position:', mapContainer.position.x, mapContainer.position.y);
  console.log('[PixiMapCanvas] FactoriesLayer position:', layersRef.current.factories.position.x, layersRef.current.factories.position.y);
  console.log('[PixiMapCanvas] First factory sprite:', layersRef.current.factories.children[0]);
  if (layersRef.current.factories.children[0]) {
    const firstFactory = layersRef.current.factories.children[0];
    console.log('[PixiMapCanvas] First factory bounds:', firstFactory.getBounds());
  }
}, 1000);
```

### Step 6: Alternative Wheel Event Strategy
**If onWheel on div doesn't work, try:**

In PixiMapCanvas.jsx useEffect, add direct listener to container:
```javascript
useEffect(() => {
  if (!containerRef.current) return;

  const handleContainerWheel = (e) => {
    console.log('[PixiMapCanvas] Container wheel event captured');
    e.preventDefault();
    e.stopPropagation();
  };

  const container = containerRef.current;
  container.addEventListener('wheel', handleContainerWheel, { passive: false });

  return () => {
    container.removeEventListener('wheel', handleContainerWheel);
  };
}, []);
```

## Quick Tests to Run

### Test 1: Sprite Exists Check
Open browser console and run:
```javascript
// Find PIXI app instance
const canvas = document.querySelector('canvas');
const app = canvas.__pixiapp; // or however PIXI stores it

// Check stage hierarchy
console.log('Stage children:', app.stage.children);
console.log('Map container:', app.stage.children[0]);
console.log('Factories layer:', app.stage.children[0].children[4]); // Factories is 5th layer (index 4)
console.log('Factory sprites:', app.stage.children[0].children[4].children);

// Check first factory sprite bounds
const firstFactory = app.stage.children[0].children[4].children[0];
console.log('First factory bounds:', firstFactory.getBounds());
console.log('First factory visible:', firstFactory.visible);
console.log('First factory alpha:', firstFactory.alpha);
```

### Test 2: Manual Zoom Test
Open browser console and run:
```javascript
// Find viewport controller
const canvas = document.querySelector('canvas');
// Manually trigger zoom
// This will tell us if the zoom SYSTEM works even if wheel events don't fire
```

## Expected Outcomes

### If Sprites Render After Full Reload
**Cause:** HMR not updating class definitions properly
**Solution:** Document that full reload needed after sprite changes

### If Wheel Events Still Don't Fire
**Cause:** Event listener timing or React re-rendering issue
**Solution:** Move event listener setup to useEffect with proper dependencies

### If Sprites Still Have Negative Y
**Cause:** Anchor change didn't take effect OR container positioning is wrong
**Solution:** Check if sprites are being created with OLD code, force recreation

### If Everything Logs Correctly But Still Invisible
**Cause:** Rendering layer issue (z-index, filters, blend modes)
**Solution:** Check GlowFilter, check sprite rendering order, disable filters temporarily

## Success Criteria
✅ Console shows: "Wheel event: [number]" when scrolling over map
✅ Console shows: "Applying transform - zoom: [changing number]"
✅ Sprite bounds show: minY between 0 and viewport height (not negative)
✅ Factory sprites visible on map as Studio Ghibli buildings
✅ Mouse wheel zooms map smoothly

## Files Modified So Far
1. `src/components/factoryMap/sprites/FactorySprite.js` - Changed anchor to (0.5, 1.0), added debug logs
2. `src/components/factoryMap/PixiMapCanvas.jsx` - Added onWheel preventDefault
3. `src/components/factoryMap/systems/ViewportController.js` - Added debug logs to handleWheel and applyTransform

## Next Session Instructions
1. Start by checking console for ViewportController debug logs
2. Try scrolling wheel - do ANY logs appear?
3. Check sprite bounds - are Y coordinates still negative?
4. If needed, do FULL RELOAD (stop server, clear cache, restart)
5. Follow debug plan systematically
6. Report findings and update this file with solutions

## Quick Win Attempts (Try These First)

### Attempt 1: Force Container to Capture Wheel
```javascript
// In PixiMapCanvas.jsx, change line 398 to:
onWheel={(e) => {
  console.log('[Container] Wheel event captured!', e.deltaY);
  e.preventDefault();
  e.stopPropagation();
}}
```

### Attempt 2: Check if Sprites Need Manual Refresh
```javascript
// After anchor change, add this in createSpriteBuilding():
sprite.anchor.set(0.5, 1.0);
sprite.position.set(0, 0); // Reset position
this.addChildAt(sprite, 0);
sprite.updateTransform(); // Force update
```

### Attempt 3: Verify Canvas is Interactive
```javascript
// In ViewportController setupEventListeners, add:
view.style.touchAction = 'none';
view.style.userSelect = 'none';
```

Good luck! Report back with console output and we'll solve this.
