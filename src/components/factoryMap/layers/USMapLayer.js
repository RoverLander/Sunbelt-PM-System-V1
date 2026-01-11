import * as PIXI from 'pixi.js';
import { REGION_CONFIG } from '../data/factoryLocations';

/**
 * USMapLayer - Renders the stylized US map background
 * Uses simplified polygon shapes with regional coloring
 * Updated for PIXI v8 Graphics API
 */
export class USMapLayer extends PIXI.Container {
  constructor(mapDimensions) {
    super();

    this.label = 'usMapLayer';
    this.mapWidth = mapDimensions.width;
    this.mapHeight = mapDimensions.height;

    this.createBackground();
    this.createUSOutline();
    this.createRegions();
    this.createCoastlines();
    this.createGrid();
  }

  createBackground() {
    // Ocean/background
    const bg = new PIXI.Graphics();
    bg
      .rect(0, 0, this.mapWidth, this.mapHeight)
      .fill(0x0d1929);
    this.addChild(bg);
  }

  createUSOutline() {
    // Simplified US continental outline
    // Coordinates are percentages of map dimensions
    const outline = [
      // Pacific Northwest
      { x: 5, y: 5 },
      { x: 8, y: 3 },
      { x: 18, y: 5 },
      // Northern border
      { x: 25, y: 8 },
      { x: 45, y: 6 },
      { x: 55, y: 10 },
      { x: 65, y: 12 },
      // Great Lakes region
      { x: 70, y: 15 },
      { x: 75, y: 18 },
      { x: 72, y: 22 },
      { x: 78, y: 25 },
      // Northeast
      { x: 88, y: 22 },
      { x: 95, y: 25 },
      { x: 98, y: 28 },
      // East coast
      { x: 95, y: 35 },
      { x: 90, y: 42 },
      { x: 88, y: 50 },
      { x: 85, y: 55 },
      // Southeast
      { x: 82, y: 60 },
      { x: 78, y: 65 },
      // Florida
      { x: 82, y: 72 },
      { x: 85, y: 82 },
      { x: 80, y: 85 },
      { x: 75, y: 78 },
      // Gulf coast
      { x: 68, y: 72 },
      { x: 60, y: 70 },
      { x: 55, y: 75 },
      { x: 48, y: 78 },
      // Texas
      { x: 42, y: 80 },
      { x: 35, y: 85 },
      { x: 30, y: 78 },
      { x: 32, y: 70 },
      { x: 28, y: 65 },
      // Southwest
      { x: 22, y: 70 },
      { x: 18, y: 68 },
      { x: 15, y: 72 },
      // California coast
      { x: 8, y: 65 },
      { x: 5, y: 55 },
      { x: 3, y: 45 },
      { x: 5, y: 35 },
      // Pacific Northwest coast
      { x: 3, y: 25 },
      { x: 5, y: 15 },
      { x: 5, y: 5 }
    ];

    // Convert percentages to pixels - flat array for PIXI v8 poly()
    const points = outline.flatMap(p => [
      (p.x / 100) * this.mapWidth,
      (p.y / 100) * this.mapHeight
    ]);

    // Base land mass
    const land = new PIXI.Graphics();
    land
      .poly(points)
      .fill(0x1a2a3a)
      .stroke({ color: 0x3a4a5a, width: 2, alpha: 0.5 });

    this.addChild(land);
  }

  createRegions() {
    // Draw colored regions based on REGION_CONFIG
    Object.entries(REGION_CONFIG).forEach(([regionName, config]) => {
      const { bounds, color } = config;

      const region = new PIXI.Graphics();
      // Parse color with fallback for invalid values
      let colorHex = parseInt((color || '').replace('#', ''), 16);
      if (!Number.isFinite(colorHex)) {
        colorHex = 0x1a2a3a; // Default dark blue-gray
      }

      // Draw region rectangle with rounded corners
      const x = (bounds.x1 / 100) * this.mapWidth;
      const y = (bounds.y1 / 100) * this.mapHeight;
      const width = ((bounds.x2 - bounds.x1) / 100) * this.mapWidth;
      const height = ((bounds.y2 - bounds.y1) / 100) * this.mapHeight;

      region
        .roundRect(x, y, width, height, 20)
        .fill({ color: colorHex, alpha: 0.3 });

      this.addChild(region);
    });
  }

  createCoastlines() {
    // Add subtle coastline details - each wave segment as separate Graphics
    const coastlineContainer = new PIXI.Container();
    coastlineContainer.label = 'coastlines';

    // West coast waves
    for (let y = 20; y < 70; y += 5) {
      const x = (3 / 100) * this.mapWidth;
      const yPos = (y / 100) * this.mapHeight;

      const wave = new PIXI.Graphics();
      wave.moveTo(x - 10, yPos);
      wave.quadraticCurveTo(x - 5, yPos + 10, x - 10, yPos + 20);
      wave.stroke({ color: 0x2a4a6a, width: 1, alpha: 0.4 });
      coastlineContainer.addChild(wave);
    }

    // East coast waves
    for (let y = 30; y < 65; y += 5) {
      const x = (92 / 100) * this.mapWidth;
      const yPos = (y / 100) * this.mapHeight;

      const wave = new PIXI.Graphics();
      wave.moveTo(x + 10, yPos);
      wave.quadraticCurveTo(x + 5, yPos + 10, x + 10, yPos + 20);
      wave.stroke({ color: 0x2a4a6a, width: 1, alpha: 0.4 });
      coastlineContainer.addChild(wave);
    }

    this.addChild(coastlineContainer);
  }

  createGrid() {
    // Subtle grid overlay for that retro map feel
    const gridContainer = new PIXI.Container();
    gridContainer.label = 'grid';

    // Vertical lines
    for (let x = 0; x <= 100; x += 10) {
      const xPos = (x / 100) * this.mapWidth;
      const line = new PIXI.Graphics();
      line.moveTo(xPos, 0);
      line.lineTo(xPos, this.mapHeight);
      line.stroke({ color: 0x2a3a4a, width: 1, alpha: 0.15 });
      gridContainer.addChild(line);
    }

    // Horizontal lines
    for (let y = 0; y <= 100; y += 10) {
      const yPos = (y / 100) * this.mapHeight;
      const line = new PIXI.Graphics();
      line.moveTo(0, yPos);
      line.lineTo(this.mapWidth, yPos);
      line.stroke({ color: 0x2a3a4a, width: 1, alpha: 0.15 });
      gridContainer.addChild(line);
    }

    this.addChild(gridContainer);
  }

  // Add terrain decorations based on region
  addDecoration(type, x, y) {
    // Will be expanded in Phase 5
  }
}

export default USMapLayer;
