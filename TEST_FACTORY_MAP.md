# 🧪 Factory Map - Test Checklist

**Before GitHub Push:** Complete this checklist to verify everything works locally.

---

## ✅ Pre-Test Setup

### 1. Verify Files Exist
```bash
cd /mnt/c/Users/matth/Projects/Sunbelt-PM-System-V1
ls -lh src/pages/FactoryMapPage.jsx        # Should be ~14KB
ls -lh src/services/factoryService.js       # Should be ~14KB
ls -lh .env                                 # Should exist
```

### 2. Check Dependencies
```bash
npm list mapbox-gl
# Expected: mapbox-gl@3.18.1
```

### 3. Verify Mapbox Token
```bash
cat .env | grep VITE_MAPBOX_TOKEN
# Should show: VITE_MAPBOX_TOKEN=pk.eyJ...
```

---

## 🚀 Start Dev Server

```bash
cd /mnt/c/Users/matth/Projects/Sunbelt-PM-System-V1
npm run dev
```

**Expected output:**
```
  VITE v... ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Navigate to:** http://localhost:5173

---

## 🧪 Test Scenarios

### Test 1: Map Loads Successfully ✓
**Action:** Navigate to Factory Map page via sidebar  
**Expected:**
- [ ] Map loads with dark theme
- [ ] 15 factory pins visible (orange dots)
- [ ] US map centered and visible
- [ ] No console errors
- [ ] "Map loaded successfully!" in console

**If map doesn't load:**
- Check browser console for Mapbox errors
- Verify `.env` file has `VITE_MAPBOX_TOKEN`
- Restart dev server (`Ctrl+C` then `npm run dev`)

---

### Test 2: Factory Sidebar Works ✓
**Action:** Check left sidebar with factory list  
**Expected:**
- [ ] Sidebar shows "Factory Locations" header
- [ ] "Show All Factories" button visible
- [ ] 15 factories listed (SNB, AMT, BUSA, C&B, IBI, MRS, NWBS, PMI, SMM, SSI, WM-EAST, WM-EVERGREEN, WM-ROCHESTER, WM-SOUTH, PRM)
- [ ] Each factory shows: code, name, location
- [ ] Hover highlights items

---

### Test 3: Factory Selection ✓
**Action:** Click a factory in sidebar (e.g., "NWBS - Northwest Building Systems")  
**Expected:**
- [ ] Map flies/zooms to factory location
- [ ] Factory item highlights in sidebar (orange border)
- [ ] Smooth animation
- [ ] Factory code badge shows "NWBS"

**Try:** Click 3-4 different factories to test navigation

---

### Test 4: Factory Pin Clicks ✓
**Action:** Click orange factory pins on map  
**Expected:**
- [ ] Popup appears with factory info:
  - Factory code (orange, bold)
  - Factory name
  - Location (city, state)
- [ ] Map zooms to that factory
- [ ] Sidebar item highlights

---

### Test 5: "Show All Factories" Button ✓
**Action:**
1. Click a factory to zoom in
2. Click "Show All Factories" button in sidebar

**Expected:**
- [ ] Map zooms out to show all 15 factories
- [ ] All pins visible
- [ ] Sidebar selection clears
- [ ] Smooth bounds animation

---

### Test 6: Map Controls ✓
**Action:** Use map controls (top-right corner)  
**Expected:**
- [ ] Zoom in (+) button works
- [ ] Zoom out (-) button works
- [ ] Compass/rotate control works
- [ ] Mouse wheel zoom works
- [ ] Click-drag panning works

---

### Test 7: Responsive Design ✓
**Action:** Resize browser window  
**Expected:**
- [ ] Map resizes smoothly
- [ ] Sidebar stays visible on desktop
- [ ] No horizontal scroll
- [ ] Controls stay in top-right corner

---

### Test 8: Dark Theme Styling ✓
**Action:** Inspect visual styling  
**Expected:**
- [ ] Map uses dark theme (not light)
- [ ] Factory pins are Sunbelt orange
- [ ] Sidebar has dark background with blur
- [ ] Text is readable (white/gray on dark)
- [ ] Borders visible but subtle
- [ ] Attribution footer at bottom (small, centered)

---

### Test 9: Console Check ✓
**Action:** Open browser dev tools (F12)  
**Expected:**
- [ ] "Map loaded successfully!" logged
- [ ] "FactoryMapPage render" debug log
- [ ] No Mapbox GL errors
- [ ] No React errors
- [ ] No missing CSS variable warnings

---

## 🐛 Known Issues to Check

### Issue: Map is blank
**Fix:**
1. Check console for Mapbox errors
2. Verify `VITE_MAPBOX_TOKEN` in `.env`
3. Restart dev server
4. Try hard refresh (`Ctrl+Shift+R`)

### Issue: Pins don't appear
**Fix:**
1. Check console for "Map loaded successfully!"
2. If not logged, map hasn't finished loading
3. Wait 2-3 seconds, then check again
4. Try clicking "Show All Factories" to trigger bounds fit

### Issue: Clicking factory does nothing
**Fix:**
1. Check browser console for JavaScript errors
2. Verify factory coordinates in `FactoryMapPage.jsx`
3. Try clicking the pin directly instead of sidebar

### Issue: Sidebar is cut off
**Fix:**
1. Check if `overflow-y: auto` is applied
2. Verify `max-height: calc(100vh - 32px)` exists
3. Scroll down in sidebar - content should be scrollable

---

## ✅ Final Checks Before GitHub Push

### Code Quality
- [ ] No console errors in browser dev tools
- [ ] No ESLint warnings (run `npm run lint`)
- [ ] All 15 factories load correctly
- [ ] Map performance is smooth (no lag)

### Files to Commit
```bash
git status
```

**Should show:**
- `src/pages/FactoryMapPage.jsx` (modified)
- `src/services/factoryService.js` (new file)
- `.env` (⚠️ DO NOT COMMIT - contains Mapbox token)
- `package.json` + `package-lock.json` (modified - mapbox-gl added)
- `docs/FACTORY_MAP_INTEGRATION.md` (new file)
- `TEST_FACTORY_MAP.md` (new file)

### Git Commands
```bash
# Stage files (DO NOT add .env!)
git add src/pages/FactoryMapPage.jsx
git add src/services/factoryService.js
git add docs/FACTORY_MAP_INTEGRATION.md
git add TEST_FACTORY_MAP.md
git add package.json package-lock.json

# Commit
git commit -m "Add Factory Map feature with Mapbox GL JS

- Port FactoryMapPage from clawd-pm-dashboard
- Add factoryService.js for Supabase data layer
- Install mapbox-gl@3.18.1
- Add integration documentation
- 15 factory locations with interactive map
- Dark theme matching Sunbelt design tokens"

# Push to GitHub
git push origin main
```

---

## 📝 Test Results

**Date Tested:** _____________  
**Tested By:** _____________  
**Browser:** _____________  
**Result:** ☐ PASS  ☐ FAIL

**Notes:**
```

```

---

**All tests passed?** ✅ Ready to push to GitHub!  
**Tests failed?** 🐛 Check troubleshooting section above.
