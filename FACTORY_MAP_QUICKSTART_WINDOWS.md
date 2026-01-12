# Factory Map: Windows PowerShell Quick Start Guide

**TL;DR:** How to create the standalone Factory Map repository in 10 minutes using Windows PowerShell.

---

## Prerequisites

- GitHub account
- GitHub CLI installed (`gh` command) - Install with: `winget install --id GitHub.cli`
- Node.js and npm installed
- Restart VS Code after installing GitHub CLI

---

## Quick Commands (PowerShell)

### 1. Create GitHub Repo (1 minute)

```powershell
# Navigate to your projects folder
cd C:\Users\matth\Projects

# Create new private repo
gh repo create sunbelt-factory-map --private --description "Interactive factory network visualization with PIXI.js" --gitignore Node --license MIT --clone

cd sunbelt-factory-map
```

### 2. Setup Project Structure (2 minutes)

```powershell
# Create folders (PowerShell syntax)
New-Item -ItemType Directory -Path "src\layers" -Force
New-Item -ItemType Directory -Path "src\sprites" -Force
New-Item -ItemType Directory -Path "src\systems" -Force
New-Item -ItemType Directory -Path "src\effects" -Force
New-Item -ItemType Directory -Path "src\data" -Force
New-Item -ItemType Directory -Path "public\assets\sprites" -Force
New-Item -ItemType Directory -Path "docs" -Force

# Create base files
New-Item -ItemType File -Path "index.html" -Force
New-Item -ItemType File -Path "src\app.js" -Force
New-Item -ItemType File -Path "src\config.js" -Force
New-Item -ItemType File -Path "src\data-fetcher.js" -Force
New-Item -ItemType File -Path "vite.config.js" -Force
```

### 3. Copy Files from Main Repo (5 minutes)

```powershell
# Set path to your main repo
$MAIN_REPO = "C:\Users\matth\Projects\Sunbelt-PM-System-V1"

# Copy PIXI code (all reusable!)
Copy-Item "$MAIN_REPO\src\components\factoryMap\layers\*" -Destination "src\layers\" -Recurse -Force
Copy-Item "$MAIN_REPO\src\components\factoryMap\sprites\*" -Destination "src\sprites\" -Recurse -Force
Copy-Item "$MAIN_REPO\src\components\factoryMap\systems\*" -Destination "src\systems\" -Recurse -Force
Copy-Item "$MAIN_REPO\src\components\factoryMap\effects\*" -Destination "src\effects\" -Recurse -Force
Copy-Item "$MAIN_REPO\src\components\factoryMap\data\*" -Destination "src\data\" -Recurse -Force

# Copy sprites
Copy-Item "$MAIN_REPO\public\assets\sprites\*" -Destination "public\assets\sprites\" -Recurse -Force

# Copy docs
Copy-Item "$MAIN_REPO\docs\FACTORY_MAP_README.md" -Destination "docs\README.md" -Force
Copy-Item "$MAIN_REPO\FACTORY_MAP_DESIGN_DOC.md" -Destination "docs\DESIGN.md" -Force
Copy-Item "$MAIN_REPO\docs\FACTORY_MAP_STANDALONE_PLAN.md" -Destination "docs\IMPLEMENTATION_PLAN.md" -Force
Copy-Item "$MAIN_REPO\docs\FACTORY_MAP_GITHUB_SETUP.md" -Destination "docs\GITHUB_SETUP.md" -Force
Copy-Item "$MAIN_REPO\docs\FACTORY_MAP_TECHNICAL_ARCHITECTURE.md" -Destination "docs\ARCHITECTURE.md" -Force
Copy-Item "$MAIN_REPO\docs\FACTORY_MAP_SPRITE_SPECS.md" -Destination "docs\SPRITE_SPECS.md" -Force
```

### 4. Create package.json (1 minute)

```powershell
@'
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
'@ | Out-File -FilePath "package.json" -Encoding utf8
```

### 5. Create vite.config.js (1 minute)

```powershell
@'
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5175 },
  resolve: {
    alias: { '@': '/src' }
  }
});
'@ | Out-File -FilePath "vite.config.js" -Encoding utf8
```

### 6. Create .env.example

```powershell
@'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:54321
VITE_MAP_WIDTH=4000
VITE_MAP_HEIGHT=2500
'@ | Out-File -FilePath ".env.example" -Encoding utf8

# Copy to .env (edit with your credentials later)
Copy-Item ".env.example" -Destination ".env" -Force
```

### 7. Install & Test

```powershell
npm install
npm run dev
```

### 8. Initial Commit

```powershell
git add .
git commit -m "feat: initial project setup with PIXI code"
git push origin main
```

---

## What You'll Have

After these commands, you'll have:

- New GitHub repo: `sunbelt-factory-map`
- All PIXI layers, sprites, systems copied
- Project structure ready
- Dev server running on port 5175
- Initial commit pushed to GitHub

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
│   ├── layers/          <- Copied from main repo
│   ├── sprites/         <- Copied from main repo
│   ├── systems/         <- Copied from main repo
│   ├── effects/         <- Copied from main repo
│   ├── data/            <- Copied from main repo
│   ├── app.js           <- To be created
│   ├── config.js        <- To be created
│   └── data-fetcher.js  <- To be created
├── public/assets/sprites/ <- Copied from main repo
├── docs/                <- Copied from main repo
├── index.html           <- To be created
├── package.json         <- Created
└── vite.config.js       <- Created
```

---

## Troubleshooting

**Problem:** `gh` command not recognized
**Solution:** Restart VS Code after installing GitHub CLI, or run `winget install --id GitHub.cli` first

**Problem:** `Copy-Item` errors about path not found
**Solution:** Make sure you're in the sunbelt-factory-map directory and the $MAIN_REPO path is correct

**Problem:** Import errors when running `npm run dev`
**Solution:** Import paths need to be updated (see Phase 4)

**Problem:** Can't push to GitHub
**Solution:** Run `gh auth login` to authenticate

**Problem:** Files have wrong encoding
**Solution:** The `-Encoding utf8` flag handles this, but you can also open files in VS Code and save with UTF-8

---

*This is the Windows fast-track version. For detailed explanations, see [FACTORY_MAP_GITHUB_SETUP.md](docs/FACTORY_MAP_GITHUB_SETUP.md)*
