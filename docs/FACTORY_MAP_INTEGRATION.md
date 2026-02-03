# Factory Map Integration Guide

**Date:** February 3, 2026  
**Status:** ✅ Complete - Ready to test  
**Ported from:** clawd-pm-dashboard

---

## 📦 What Was Installed

### 1. **FactoryMapPage Component**
- **Location:** `/src/pages/FactoryMapPage.jsx`
- **Size:** 14KB (421 lines)
- **Features:**
  - Mapbox GL JS dark theme map
  - 15 factory locations with coordinates
  - Interactive factory list sidebar
  - Click-to-navigate & zoom
  - "Show All Factories" bounds fitting
  - Fallback UI for missing Mapbox token
  - Fully styled with Sunbelt design tokens

### 2. **Factory Data Service**
- **Location:** `/src/services/factoryService.js`
- **Size:** 14KB
- **Functions:**
  - `getFactoriesWithProjectCounts()` - Main function for map
  - `getFactoryProjectCount(code)` - Individual factory stats
  - `getFactoryProjects(code, filters)` - Full project list
  - `getFactoryNetworkSummary()` - Network-wide metrics
  - `getBusiestFactories(limit)` - Ranked by activity
  - Module-level functions for production tracking

### 3. **Dependencies**
- **mapbox-gl:** `v3.18.1` ✅ Installed
- **Environment:** `.env` with `VITE_MAPBOX_TOKEN` ✅ Configured

---

## 🚀 Testing Locally

### Start Dev Server
```bash
cd /mnt/c/Users/matth/Projects/Sunbelt-PM-System-V1
npm run dev
```

### Access Factory Map
1. Navigate to **Factory Map** in sidebar (PM/Director/VP/IT roles)
2. Map should load with dark theme
3. Click factory pins to zoom
4. Click sidebar items to navigate
5. Click "Show All Factories" to reset view

### Expected Behavior
- ✅ Map loads with all 15 factories visible
- ✅ Orange pins with factory codes on click
- ✅ Smooth zoom/pan animations
- ✅ Sidebar highlights selected factory
- ✅ Mapbox attribution in footer

---

## 🔗 Integration Points

### Current State (Phase 1)
**FactoryMapPage.jsx** uses **hardcoded coordinates** from the component:
```javascript
const FACTORIES = [
  { code: 'SNB', name: 'Sunbelt Modular (Corporate HQ)', ... },
  { code: 'AMT', name: 'AmTex Corporation', ... },
  // ... 13 more
];
```

### Future Integration (Phase 2)
To connect **live project counts** from Supabase:

**Step 1:** Import the service in `FactoryMapPage.jsx`:
```javascript
import { getFactoriesWithProjectCounts } from '../services/factoryService';
```

**Step 2:** Fetch data on component mount:
```javascript
useEffect(() => {
  const loadFactoryData = async () => {
    const { data, error } = await getFactoriesWithProjectCounts();
    if (data) {
      setFactoryStats(data); // Update state
    }
  };
  loadFactoryData();
}, []);
```

**Step 3:** Display project counts in tooltips:
```javascript
const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
  <div>
    <strong>${factory.code}</strong><br/>
    ${factory.name}<br/>
    <span style="font-size: 0.75rem; color: #6b7280;">
      ${factory.location} • ${factory.project_count || 0} projects
    </span>
  </div>
`);
```

---

## 📊 Database Schema

The `factoryService.js` expects these Supabase tables:

### `factories`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `code` | VARCHAR(20) | Unique factory code (e.g., 'NWBS') |
| `short_name` | VARCHAR | Display name |
| `full_name` | VARCHAR | Legal name |
| `city` | VARCHAR | |
| `state` | VARCHAR(2) | |
| `is_active` | BOOLEAN | Filter inactive factories |

### `projects`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `factory` | VARCHAR(20) | Foreign key to `factories.code` |
| `status` | VARCHAR | 'Planning', 'In Progress', etc. |
| `name` | VARCHAR | |

### `modules`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `factory_id` | UUID | Foreign key to `factories.id` |
| `project_id` | UUID | Foreign key to `projects.id` |
| `status` | VARCHAR | Module production status |

---

## 🎨 Styling

The component uses **Sunbelt PM System design tokens**:

| CSS Variable | Usage |
|-------------|--------|
| `--text-primary` | Main text color |
| `--text-secondary` | Secondary text |
| `--text-tertiary` | Muted text |
| `--bg-primary` | Main background |
| `--bg-secondary` | Card backgrounds |
| `--bg-tertiary` | Hover states |
| `--sunbelt-orange` | Brand color, factory pins |
| `--border-color` | Borders, dividers |

**All CSS variables are already compatible** - no style adaptation was needed during port.

---

## ⚙️ Configuration

### Environment Variables
```bash
# .env file
VITE_MAPBOX_TOKEN=pk.eyJ1Ijoicm92ZXJsYW5kZXIi...
```

**Token source:** Retrieved from `clawd-pm-dashboard` frontend  
**Get your own:** https://account.mapbox.com/

### Vite Config
No changes needed - Vite automatically loads `.env` files and exposes `VITE_*` prefixed variables.

---

## 🐛 Troubleshooting

### Map doesn't load
1. **Check token:** Console should show "Map loaded successfully!"
2. **Check .env:** Verify `VITE_MAPBOX_TOKEN` is set
3. **Restart dev server:** Changes to `.env` require restart

### Factory pins don't appear
1. **Check console:** Look for Mapbox GL errors
2. **Check coordinates:** Factory positions are hardcoded in component
3. **Check map load event:** Markers are added after map.on('load')

### Sidebar doesn't scroll
- Check if `overflow-y: auto` is applied to sidebar div
- Verify `max-height: calc(100vh - 32px)` is set

### Styling looks wrong
- Verify CSS variables exist in `App.css`
- Check browser console for missing variable warnings
- Ensure dark/light theme is properly applied

---

## 🚧 Known Limitations (Current Version)

1. **No live project counts** - Factory locations are hardcoded
2. **No delivery routes** - No lines showing factory → project site
3. **No real-time updates** - Static map on page load
4. **No factory filtering** - All 15 factories always visible

**These are planned for Phase 2** when Supabase integration is fully connected.

---

## 📝 Next Steps

### Recommended Order:
1. ✅ **Test locally** - Verify map loads and pins work
2. ⚠️ **Add project counts** - Integrate `factoryService.js`
3. ⚠️ **Add delivery routes** - Show factory → project lines
4. ⚠️ **Add real-time updates** - Poll Supabase every 30s
5. ⚠️ **Add factory filtering** - Toggle factories by region/type

### Quick Wins:
- Add project count badges to sidebar items
- Show "busiest factory" highlight
- Add search/filter to sidebar
- Export map as PNG screenshot

---

## 📚 References

- **Original source:** `/mnt/c/Users/matth/Projects/clawd-pm-dashboard/frontend/src/components/factory/FactoryMapPage.jsx`
- **Mapbox GL JS docs:** https://docs.mapbox.com/mapbox-gl-js/
- **Design inspiration:** https://peaceandquiet.io/
- **Supabase client:** `/src/utils/supabaseClient.js`

---

**Integration complete. Ready to test.** 🎉
