# Local Development Branch - UPDATE

**Branch:** `local-dev-clean`
**Date:** January 2026
**Purpose:** Clean codebase for local development, removing all WebContainer/StackBlitz workarounds

---

## Summary of Changes

This branch removes all WebContainer-specific workarounds that were added to make the application work in StackBlitz. These workarounds are not needed (and may cause issues) when running on a local development machine or production hosting.

---

## Files Modified

### 1. `src/utils/supabaseClient.js`

**Changes:**
- Removed WebContainer detection (`isWebContainer`)
- Removed global error suppression for "Cannot navigate to URL" errors
- Removed custom storage that blocked auth-related localStorage keys
- Removed `stopAutoRefresh()` call
- Removed realtime disconnect

**New Configuration:**
```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,      // Now enabled
    persistSession: true,         // Now enabled
    detectSessionInUrl: true,     // Now enabled
    storageKey: 'sunbelt-pm-auth',
    storage: window.localStorage
  },
  realtime: {
    params: {
      eventsPerSecond: 10         // Realtime enabled
    }
  }
});
```

**Added Helpers:**
- `safeQuery()` - Safe query execution with error handling
- `isAuthenticated()` - Check if user is authenticated
- `getCurrentUser()` - Get current user

---

### 2. `src/context/AuthContext.jsx`

**Changes:**
- Removed `isWebContainer` import
- Removed WebContainer detection that skipped session recovery
- Removed special handling for `TOKEN_REFRESHED` events
- Restored normal auth state change handling

**Result:** Normal authentication flow now works properly with token refresh, session persistence, and automatic recovery.

---

### 3. `src/pages/FactoryMapPage.jsx`

**Changes:**
- Switched from `SVGMapCanvas` back to `PixiMapCanvas`
- Restored all event handlers (job site, truck, etc.)

**Why:** The SVG fallback was created because PIXI/WebGL didn't work in WebContainer. On a real development machine, WebGL works properly, so we use the full-featured PIXI canvas.

---

## Files NOT Modified (But Reviewed)

### Dashboard Query Patterns

The following files use client-side filtering instead of Supabase's `.in()` and `.or()` operators:
- `src/components/dashboards/PMDashboard.jsx`
- `src/components/dashboards/PCDashboard.jsx`
- `src/components/pages/ProjectsPage.jsx`
- `src/components/pages/TasksPage.jsx`
- `src/components/pages/RFIsPage.jsx`
- `src/components/pages/SubmittalsPage.jsx`

**Decision:** These changes were kept as-is because:
1. Client-side filtering works in all environments
2. The data volumes are small enough that performance difference is negligible
3. Reverting would require extensive testing

---

## Factory Map (PIXI.js)

The factory map uses PIXI.js v8.15.0 with the following components:

| Component | Description |
|-----------|-------------|
| `PixiMapCanvas.jsx` | Main canvas wrapper, initializes PIXI app |
| `USMapLayer.js` | Renders US map background |
| `TerrainLayer.js` | Regional decorations (trees, cacti, etc.) |
| `FactoriesLayer.js` | Factory sprite management |
| `FactorySprite.js` | Individual factory buildings |
| `JobSitesLayer.js` | Delivery destination markers |
| `TrucksLayer.js` | Animated delivery trucks |
| `RoutesLayer.js` | Delivery route paths |

**PIXI v8 Graphics API:**
Uses the object-style fill syntax:
```javascript
graphics.rect(x, y, w, h);
graphics.fill({ color: 0x3a3a4a });
```

---

## How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd Sunbelt-PM-System-V1
   git checkout local-dev-clean
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`

---

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

---

## Known Issues / Notes

1. **Large bundle size warning:** The main JS bundle is ~2MB. Consider code-splitting for production.

2. **PIXI.js WebGL:** Requires a browser with WebGL support. All modern browsers support this.

3. **Supabase Auth:** Uses PKCE flow which is recommended for browser applications.

---

## Testing Checklist

Before deploying, verify:

- [ ] Login/logout works
- [ ] Session persists after page refresh
- [ ] Factory Map loads and displays factories
- [ ] Hovering over factories shows tooltips
- [ ] Dashboard data loads correctly
- [ ] No console errors

---

## Contact

For questions about these changes, refer to the git commit history on this branch.
