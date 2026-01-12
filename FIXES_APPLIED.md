# Factory Map Fixes Applied

## Summary

All critical fixes have been implemented and hot-reloaded via Vite HMR. The Factory Map should now display sprites correctly and respond to zoom controls.

## Changes Made

### 1. Fixed Sprite Positioning (FactorySprite.js)

**Problem:** Sprites had negative Y coordinates due to GlowFilter + anchor point interaction

**Solution:**
- Changed anchor from `(0.5, 1.0)` to `(0.5, 0.5)` (center anchor)
- Added manual Y offset: `sprite.position.y = -(sprite.height / 2)`
- Moved filter application AFTER adding sprite to container
- Improved logging to show actual bounds coordinates

**File:** `src/components/factoryMap/sprites/FactorySprite.js`
**Lines:** 111-131

### 2. Disabled React StrictMode (main.jsx)

**Problem:** StrictMode double-mounting broke PIXI event listeners

**Solution:**
- Removed `<StrictMode>` wrapper from root render
- Added comment explaining why it's disabled

**File:** `src/main.jsx`
**Lines:** 1-8

### 3. Fixed Event Listener Lifecycle (PixiMapCanvas.jsx)

**Problem:** React synthetic `onWheel` handler blocked canvas wheel events

**Solution:**
- Removed `onWheel={(e) => e.preventDefault()}` from container div
- Added cleanup logic for existing PIXI instances on remount
- Changed early return to allow proper re-initialization

**File:** `src/components/factoryMap/PixiMapCanvas.jsx`
**Lines:** 71-82, 401-409

### 4. Added Canvas Styling (ViewportController.js)

**Problem:** Canvas not capturing wheel events properly

**Solution:**
- Added `view.style.touchAction = 'none'` to canvas
- Added logging for event listener setup
- Enhanced wheel event logging with ✓ checkmark

**File:** `src/components/factoryMap/systems/ViewportController.js`
**Lines:** 63, 67, 128

## Testing Instructions

### Test 1: Check Sprite Visibility
1. Look at the map - you should see factory building sprites (not just orange circles)
2. All 14 factories should have visible Studio Ghibli-style buildings
3. Check console for sprite bounds - **minY should be positive** (not negative)

### Test 2: Test Zoom
1. Hover mouse over the map canvas
2. Scroll mouse wheel up/down
3. **Expected:**
   - Console shows: `[ViewportController] ✓ Wheel event received: [number]`
   - Map zooms in/out smoothly
   - Page does NOT scroll

### Test 3: Test Pan
1. Click and drag on map
2. **Expected:**
   - Map pans with momentum
   - Cursor changes to "grabbing"

## Console Logs to Watch For

### Sprite Loading (should show positive Y now):
```
[FactorySprite] Sprite added - visible: true alpha: 1
[FactorySprite] Sprite bounds: {minX: 440, minY: 241, maxX: 520, maxY: 358}
[FactorySprite] Container position: 480 300
```

**✓ GOOD:** minY is positive (e.g., 241)
**✗ BAD:** minY is negative (e.g., -239)

### Event Listener Setup:
```
[ViewportController] Event listeners attached to canvas
```

### Zoom Events (when you scroll):
```
[ViewportController] ✓ Wheel event received: -100 Current zoom: 0.6
[ViewportController] New zoom: 0.7
[ViewportController] Applying transform - zoom: 0.7 position: {x: ..., y: ...}
```

## If Issues Persist

### Issue: Sprites Still Not Visible

**Try:**
1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Check console - expand the sprite bounds object
3. Run this in console:
```javascript
const factories = document.querySelector('canvas').__pixiapp.stage.children[0].children[4];
console.log('Factory count:', factories.children.length);
console.log('First factory:', factories.children[0]);
console.log('First factory bounds:', factories.children[0].getBounds());
```

### Issue: Zoom Still Not Working

**Try:**
1. Verify console shows: `[ViewportController] Event listeners attached to canvas`
2. When scrolling, check if ANY logs appear
3. If no logs appear, the event listener may not be attached yet
4. Try clicking on the map first, then scrolling

### Issue: HMR Not Updating

**Full reload:**
```bash
# Stop dev server
Ctrl+C

# Restart
npm run dev
```

Then hard refresh browser (Ctrl+Shift+R)

## Rollback

If needed, revert changes:
```bash
git checkout src/components/factoryMap/sprites/FactorySprite.js
git checkout src/main.jsx
git checkout src/components/factoryMap/PixiMapCanvas.jsx
git checkout src/components/factoryMap/systems/ViewportController.js
```

## Success Criteria

When everything works correctly, you should see:

✅ Factory sprites visible on map (Studio Ghibli buildings)
✅ Console shows positive Y coordinates in sprite bounds
✅ Mouse wheel zooms map (doesn't scroll page)
✅ Console shows "✓ Wheel event received" when scrolling
✅ Click-drag pans the map smoothly
✅ Labels and stat badges visible above factories
✅ No console errors

## Next Steps

Once verified working:
1. Remove debug console logs (optional cleanup)
2. Adjust smoke particle positions if needed (lines 181-185 in FactorySprite.js)
3. Continue with sprite generation for other assets (USA map, trucks, etc.)
4. Test LOD system at different zoom levels

---

**Status:** ✅ All fixes applied and hot-reloaded
**Vite HMR:** Page reloaded at 5:55:26 PM (main.jsx change)
**Last update:** Multiple HMR updates through 5:56:26 PM
