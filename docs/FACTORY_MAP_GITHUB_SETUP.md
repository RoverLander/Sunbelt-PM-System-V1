# Factory Map: GitHub Repository Setup Guide

This guide walks you through creating a separate GitHub repository for the standalone Factory Map.

---

## Step 1: Create New GitHub Repository

### Option A: Via GitHub Website (Recommended)

1. Go to https://github.com/new
2. Fill in repository details:
   - **Repository name:** `sunbelt-factory-map`
   - **Description:** `Interactive factory network visualization with PIXI.js - gamified project management map`
   - **Visibility:** Private (or Public if you want to showcase)
   - **Initialize:** ✅ Add a README file
   - **Add .gitignore:** Select "Node" template
   - **Choose a license:** MIT (or your preference)

3. Click **"Create repository"**

### Option B: Via GitHub CLI

```bash
gh repo create sunbelt-factory-map \
  --private \
  --description "Interactive factory network visualization with PIXI.js" \
  --gitignore Node \
  --license MIT
```

---

## Step 2: Clone and Setup Local Repository

### 2.1 Clone the New Repo

```bash
cd ~/Projects  # or your projects folder
gh repo clone YOUR_USERNAME/sunbelt-factory-map
cd sunbelt-factory-map
```

### 2.2 Initialize Project Structure

```bash
# Create folder structure
mkdir -p src/{layers,sprites,systems,effects,data,utils}
mkdir -p public/assets/{sprites,audio}
mkdir -p docs

# Create base files
touch index.html
touch src/app.js
touch src/config.js
touch src/data-fetcher.js
touch .env.example
touch vite.config.js
touch package.json
```

---

## Step 3: Copy PIXI Code from Main Repo

### 3.1 Copy Core PIXI Files

From your **main Sunbelt PM repo**, copy these files:

```bash
# Navigate to main repo
cd /path/to/Sunbelt-PM-System-V1

# Copy layers (100% reusable!)
cp src/components/factoryMap/layers/*.js ~/Projects/sunbelt-factory-map/src/layers/

# Copy sprites (100% reusable!)
cp src/components/factoryMap/sprites/*.js ~/Projects/sunbelt-factory-map/src/sprites/

# Copy systems (100% reusable!)
cp src/components/factoryMap/systems/*.js ~/Projects/sunbelt-factory-map/src/systems/

# Copy effects (100% reusable!)
cp src/components/factoryMap/effects/*.js ~/Projects/sunbelt-factory-map/src/effects/

# Copy data utilities
cp src/components/factoryMap/data/*.js ~/Projects/sunbelt-factory-map/src/data/

# Copy AI-generated sprites
cp -r public/assets/sprites ~/Projects/sunbelt-factory-map/public/assets/
```

### 3.2 Copy Documentation

```bash
# Navigate to main repo
cd /path/to/Sunbelt-PM-System-V1

# Copy relevant docs
cp docs/FACTORY_MAP_README.md ~/Projects/sunbelt-factory-map/docs/README.md
cp docs/FACTORY_MAP_DESIGN_DOC.md ~/Projects/sunbelt-factory-map/docs/DESIGN.md
cp docs/FACTORY_MAP_SPRITE_SPECS.md ~/Projects/sunbelt-factory-map/docs/SPRITE_SPECS.md
cp docs/FACTORY_MAP_STANDALONE_PLAN.md ~/Projects/sunbelt-factory-map/docs/IMPLEMENTATION_PLAN.md
cp FACTORY_MAP_PIVOT_SUMMARY.md ~/Projects/sunbelt-factory-map/docs/PIVOT_SUMMARY.md
```

---

## Step 4: Create package.json

### Navigate to Standalone Repo

```bash
cd ~/Projects/sunbelt-factory-map
```

### Create package.json

```json
{
  "name": "sunbelt-factory-map",
  "version": "0.1.0",
  "description": "Interactive factory network visualization with PIXI.js",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js",
    "format": "prettier --write \"src/**/*.js\""
  },
  "dependencies": {
    "pixi.js": "^8.15.0",
    "pixi-filters": "^6.0.4"
  },
  "devDependencies": {
    "vite": "^7.3.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/sunbelt-factory-map.git"
  },
  "keywords": [
    "pixi",
    "canvas",
    "visualization",
    "map",
    "factory",
    "modular-construction"
  ],
  "author": "Your Name",
  "license": "MIT"
}
```

---

## Step 5: Create vite.config.js

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 5175,
    open: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

---

## Step 6: Create Environment Config

### Create .env.example

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
VITE_API_BASE_URL=http://localhost:54321

# Map Configuration
VITE_MAP_WIDTH=4000
VITE_MAP_HEIGHT=2500

# Debug
VITE_ENABLE_DEBUG_LOGS=true
```

### Create .env (for local development)

```bash
cp .env.example .env
# Then edit .env with your actual Supabase credentials
```

### Add to .gitignore

Make sure `.env` is in your `.gitignore`:

```
.env
.env.local
```

---

## Step 7: Update Import Statements

### Fix Import Paths in Copied Files

The copied PIXI files will have React-style import paths. Update them:

**Find and replace in all copied files:**

```bash
# In the standalone repo
cd ~/Projects/sunbelt-factory-map

# Fix relative imports
find src -name "*.js" -exec sed -i 's|from '\''./|from '\''@/|g' {} +
find src -name "*.js" -exec sed -i 's|from "\\./|from "@/|g' {} +

# Remove React imports (if any exist)
find src -name "*.js" -exec sed -i '/import.*from.*react/d' {} +
```

**Example transformation:**

```javascript
// OLD (React version):
import { FactorySprite } from '../sprites/FactorySprite';

// NEW (Standalone version):
import { FactorySprite } from '@/sprites/FactorySprite.js';
```

---

## Step 8: Create Initial Commit

```bash
cd ~/Projects/sunbelt-factory-map

# Stage all files
git add .

# Create initial commit
git commit -m "feat: initial project setup

- Add PIXI.js layers, sprites, systems from main repo
- Add project structure and build config
- Add comprehensive documentation
- Add AI-generated factory sprites
"

# Push to GitHub
git push origin main
```

---

## Step 9: Install Dependencies

```bash
npm install
```

---

## Step 10: Verify Setup

```bash
# Start dev server
npm run dev

# You should see:
# ✓ Vite dev server running at http://localhost:5175
```

At this point:
- ✅ Repository created on GitHub
- ✅ Local clone with all PIXI code
- ✅ Dependencies installed
- ✅ Dev server running

**Next:** Follow the implementation plan in `docs/IMPLEMENTATION_PLAN.md`

---

## Repository Structure (Final)

```
sunbelt-factory-map/
├── .git/
├── .gitignore
├── .env.example
├── .env                    # (not committed)
├── package.json
├── package-lock.json
├── vite.config.js
├── index.html              # Main entry point
├── README.md               # Project overview
│
├── src/
│   ├── app.js              # Main application class
│   ├── config.js           # Configuration
│   ├── data-fetcher.js     # API calls
│   │
│   ├── layers/             # PIXI layers (copied from main repo)
│   │   ├── USMapLayer.js
│   │   ├── FactoriesLayer.js
│   │   ├── RoutesLayer.js
│   │   ├── JobSitesLayer.js
│   │   ├── TrucksLayer.js
│   │   └── TerrainLayer.js
│   │
│   ├── sprites/            # PIXI sprites (copied from main repo)
│   │   ├── FactorySprite.js
│   │   ├── TruckSprite.js
│   │   └── JobSiteSprite.js
│   │
│   ├── systems/            # PIXI systems (copied from main repo)
│   │   ├── ViewportController.js
│   │   └── LODManager.js
│   │
│   ├── effects/            # PIXI effects (copied from main repo)
│   │   └── CelebrationParticles.js
│   │
│   ├── data/               # Data utilities (copied from main repo)
│   │   ├── factoryLocations.js
│   │   └── mapGeometry.js
│   │
│   └── utils/              # Helper functions
│       └── logger.js
│
├── public/
│   └── assets/
│       ├── sprites/        # AI-generated sprites (copied from main repo)
│       │   └── factory_idle.png
│       └── audio/          # (optional)
│
├── docs/
│   ├── README.md           # Project overview
│   ├── DESIGN.md           # Design vision
│   ├── SPRITE_SPECS.md     # AI sprite generation
│   ├── IMPLEMENTATION_PLAN.md  # Development guide
│   └── PIVOT_SUMMARY.md    # Why standalone
│
└── dist/                   # Build output (gitignored)
```

---

## Maintenance & Updates

### Keeping in Sync with Main Repo

If you make improvements to the PIXI code in the standalone repo:

**Option 1: Manual Copy Back**
```bash
# Copy improved layers back to main repo
cp src/layers/*.js /path/to/Sunbelt-PM-System-V1/src/components/factoryMap/layers/
```

**Option 2: Git Subtree (Advanced)**
Set up the standalone repo as a subtree of the main repo for easier syncing.

### Version Control

Use semantic versioning:
- `0.1.0` - Initial MVP
- `0.2.0` - Add routes and trucks
- `1.0.0` - Production ready
- `1.1.0` - New features (mini-map, weather effects)
- `1.1.1` - Bug fixes

---

## Deployment Options

### Option 1: Vercel (Recommended)

```bash
npm install -g vercel
vercel login
vercel
```

### Option 2: Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Option 3: GitHub Pages

```bash
# Add to package.json:
"scripts": {
  "deploy": "vite build && gh-pages -d dist"
}

npm install --save-dev gh-pages
npm run deploy
```

### Option 4: Self-Hosted

```bash
npm run build
# Upload dist/ folder to your web server
```

---

## Security Notes

1. **Never commit .env** - Contains Supabase keys
2. **Use anon key only** - Never expose service role key
3. **Enable RLS** - Ensure Row Level Security on Supabase tables
4. **Authentication** - Pass tokens securely via URL params or postMessage

---

## Questions?

See the full implementation plan in:
**docs/IMPLEMENTATION_PLAN.md**

---

*Guide created: January 12, 2026*
*Estimated setup time: 30-45 minutes*
