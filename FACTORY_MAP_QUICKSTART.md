# Factory Map: Quick Start Guide

**TL;DR:** How to create the standalone Factory Map repository in 10 minutes.

---

## Prerequisites

- GitHub account
- GitHub CLI installed (`gh` command)
- Node.js and npm installed

---

## Quick Commands

### 1. Create GitHub Repo (1 minute)

```bash
# Create new private repo
gh repo create sunbelt-factory-map \
  --private \
  --description "Interactive factory network visualization with PIXI.js" \
  --gitignore Node \
  --license MIT \
  --clone

cd sunbelt-factory-map
```

### 2. Setup Project Structure (2 minutes)

```bash
# Create folders
mkdir -p src/{layers,sprites,systems,effects,data}
mkdir -p public/assets/sprites
mkdir -p docs

# Create base files
touch index.html src/{app.js,config.js,data-fetcher.js} vite.config.js
```

### 3. Copy Files from Main Repo (5 minutes)

```bash
# Set path to your main repo
MAIN_REPO="/path/to/Sunbelt-PM-System-V1"

# Copy PIXI code (all reusable!)
cp -r "$MAIN_REPO/src/components/factoryMap/layers/"* src/layers/
cp -r "$MAIN_REPO/src/components/factoryMap/sprites/"* src/sprites/
cp -r "$MAIN_REPO/src/components/factoryMap/systems/"* src/systems/
cp -r "$MAIN_REPO/src/components/factoryMap/effects/"* src/effects/
cp -r "$MAIN_REPO/src/components/factoryMap/data/"* src/data/

# Copy sprites
cp -r "$MAIN_REPO/public/assets/sprites/"* public/assets/sprites/

# Copy docs
cp "$MAIN_REPO/docs/FACTORY_MAP_README.md" docs/README.md
cp "$MAIN_REPO/docs/FACTORY_MAP_DESIGN_DOC.md" docs/DESIGN.md
cp "$MAIN_REPO/docs/FACTORY_MAP_STANDALONE_PLAN.md" docs/IMPLEMENTATION_PLAN.md
cp "$MAIN_REPO/docs/FACTORY_MAP_GITHUB_SETUP.md" docs/GITHUB_SETUP.md
```

### 4. Create package.json (1 minute)

```bash
cat > package.json << 'EOF'
{
  "name": "sunbelt-factory-map",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "pixi.js": "^8.15.0",
    "pixi-filters": "^6.0.4"
  },
  "devDependencies": {
    "vite": "^7.3.0"
  }
}
EOF
```

### 5. Create vite.config.js (1 minute)

```bash
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5175 },
  resolve: {
    alias: { '@': '/src' }
  }
});
EOF
```

### 6. Create .env.example

```bash
cat > .env.example << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:54321
VITE_MAP_WIDTH=4000
VITE_MAP_HEIGHT=2500
EOF

# Copy to .env and edit with your credentials
cp .env.example .env
```

### 7. Install & Test

```bash
npm install
npm run dev
```

### 8. Initial Commit

```bash
git add .
git commit -m "feat: initial project setup with PIXI code"
git push origin main
```

---

## What You'll Have

After these commands, you'll have:

✅ New GitHub repo: `sunbelt-factory-map`
✅ All PIXI layers, sprites, systems copied
✅ Project structure ready
✅ Dev server running on port 5175
✅ Initial commit pushed to GitHub

---

## Next Steps

Follow the implementation plan:

**Phase 1:** Create `index.html` entry point (30 min)
**Phase 2:** Create `app.js` main class (2 hours)
**Phase 3:** Create `data-fetcher.js` for API calls (1 hour)
**Phase 4:** Fix import paths (1 hour)
**Phase 5:** Test and debug (2 hours)

**Total: ~8 hours for working MVP**

See full details in: **docs/IMPLEMENTATION_PLAN.md**

---

## Folder Structure Result

```
sunbelt-factory-map/
├── src/
│   ├── layers/          ← Copied from main repo ✓
│   ├── sprites/         ← Copied from main repo ✓
│   ├── systems/         ← Copied from main repo ✓
│   ├── effects/         ← Copied from main repo ✓
│   ├── data/            ← Copied from main repo ✓
│   ├── app.js           ← To be created
│   ├── config.js        ← To be created
│   └── data-fetcher.js  ← To be created
├── public/assets/sprites/ ← Copied from main repo ✓
├── docs/                ← Copied from main repo ✓
├── index.html           ← To be created
├── package.json         ← Created ✓
└── vite.config.js       ← Created ✓
```

---

## Troubleshooting

**Problem:** `cp: cannot stat` errors
**Solution:** Check the path to your main repo is correct

**Problem:** Import errors when running `npm run dev`
**Solution:** Import paths need to be updated (see Phase 4)

**Problem:** Can't push to GitHub
**Solution:** Run `gh auth login` to authenticate

---

*This is the fast-track version. For detailed explanations, see [FACTORY_MAP_GITHUB_SETUP.md](docs/FACTORY_MAP_GITHUB_SETUP.md)*

