import * as PIXI from 'pixi.js';
import { REGION_CONFIG, getRegionAt } from '../data/factoryLocations';

/**
 * TerrainLayer - Regional decorations like trees, mountains, cacti
 * Generates appropriate sprites based on geographic region
 * Updated for PIXI v8 Graphics API
 */
export class TerrainLayer extends PIXI.Container {
  constructor(mapDimensions, options = {}) {
    super();

    this.label = 'terrainLayer';
    this.mapWidth = mapDimensions.width;
    this.mapHeight = mapDimensions.height;
    this.density = options.density || 'medium';

    this.decorations = [];
    this.generateTerrain();
  }

  generateTerrain() {
    const densityMultiplier = {
      low: 0.5,
      medium: 1,
      high: 1.5
    }[this.density] || 1;

    // Generate decorations for each region
    Object.entries(REGION_CONFIG).forEach(([regionName, config]) => {
      const { bounds } = config;

      // Convert bounds to pixels
      const x1 = (bounds.x1 / 100) * this.mapWidth;
      const y1 = (bounds.y1 / 100) * this.mapHeight;
      const x2 = (bounds.x2 / 100) * this.mapWidth;
      const y2 = (bounds.y2 / 100) * this.mapHeight;

      // Generate region-specific decorations
      this.generateRegionDecorations(regionName, x1, y1, x2, y2, densityMultiplier);
    });
  }

  generateRegionDecorations(region, x1, y1, x2, y2, densityMult) {
    const area = (x2 - x1) * (y2 - y1);
    const baseCount = Math.floor((area / 100000) * densityMult);

    switch (region) {
      case 'pacificNorthwest':
        this.generateTrees(x1, y1, x2, y2, baseCount * 3, 'evergreen');
        this.generateMountains(x1, y1, x2, y2, Math.floor(baseCount / 3));
        break;

      case 'california':
        this.generateTrees(x1, y1, x2, y2, baseCount, 'palm');
        this.generateTrees(x1, y1, x2, y2, baseCount / 2, 'oak');
        break;

      case 'southwest':
        this.generateCacti(x1, y1, x2, y2, baseCount * 2);
        this.generateMesas(x1, y1, x2, y2, Math.floor(baseCount / 4));
        break;

      case 'texas':
        this.generateCacti(x1, y1, x2, y2, baseCount);
        this.generateOilDerricks(x1, y1, x2, y2, Math.floor(baseCount / 5));
        break;

      case 'midwest':
        this.generateFarms(x1, y1, x2, y2, baseCount);
        this.generateTrees(x1, y1, x2, y2, baseCount / 2, 'oak');
        break;

      case 'southeast':
        this.generateTrees(x1, y1, x2, y2, baseCount * 2, 'pine');
        this.generateTrees(x1, y1, x2, y2, baseCount / 2, 'oak');
        break;

      case 'northeast':
        this.generateTrees(x1, y1, x2, y2, baseCount, 'maple');
        this.generateBuildings(x1, y1, x2, y2, Math.floor(baseCount / 3));
        break;
    }
  }

  // Tree generation
  generateTrees(x1, y1, x2, y2, count, type) {
    for (let i = 0; i < count; i++) {
      const x = x1 + Math.random() * (x2 - x1);
      const y = y1 + Math.random() * (y2 - y1);
      const scale = 0.6 + Math.random() * 0.8;

      const tree = this.createTree(type, scale);
      tree.position.set(x, y);
      this.decorations.push(tree);
      this.addChild(tree);
    }
  }

  createTree(type, scale = 1) {
    const tree = new PIXI.Graphics();

    switch (type) {
      case 'evergreen':
        // Triangle pine tree
        tree
          .poly([0, -20 * scale, -10 * scale, 0, 10 * scale, 0])
          .fill(0x1a4d2e);
        // Second layer
        tree
          .poly([0, -28 * scale, -7 * scale, -10 * scale, 7 * scale, -10 * scale])
          .fill(0x236b40);
        // Trunk
        tree
          .rect(-2 * scale, 0, 4 * scale, 6 * scale)
          .fill(0x4a3520);
        break;

      case 'palm':
        // Palm trunk
        tree
          .rect(-2 * scale, -15 * scale, 4 * scale, 20 * scale)
          .fill(0x8b7355);
        // Palm fronds - simplified for v8
        tree
          .circle(0, -18 * scale, 10 * scale)
          .fill({ color: 0x228b22, alpha: 0.7 });
        break;

      case 'oak':
      case 'maple':
        // Round deciduous tree
        const color = type === 'maple' ? 0xc75b39 : 0x2d5a3f;
        tree
          .circle(0, -12 * scale, 10 * scale)
          .fill(color);
        tree
          .rect(-2 * scale, -4 * scale, 4 * scale, 8 * scale)
          .fill(0x4a3520);
        break;

      case 'pine':
        // Southern pine
        tree
          .poly([0, -25 * scale, -8 * scale, -5 * scale, 8 * scale, -5 * scale])
          .fill(0x2d5a3f);
        tree
          .rect(-2 * scale, -5 * scale, 4 * scale, 10 * scale)
          .fill(0x4a3520);
        break;
    }

    tree.alpha = 0.8;
    return tree;
  }

  // Cacti generation
  generateCacti(x1, y1, x2, y2, count) {
    for (let i = 0; i < count; i++) {
      const x = x1 + Math.random() * (x2 - x1);
      const y = y1 + Math.random() * (y2 - y1);
      const scale = 0.5 + Math.random() * 0.5;

      const cactus = this.createCactus(scale);
      cactus.position.set(x, y);
      this.decorations.push(cactus);
      this.addChild(cactus);
    }
  }

  createCactus(scale = 1) {
    const cactus = new PIXI.Graphics();

    // Main trunk
    cactus
      .roundRect(-3 * scale, -20 * scale, 6 * scale, 25 * scale, 3 * scale)
      .fill(0x228b22);

    // Arms
    if (Math.random() > 0.3) {
      cactus
        .roundRect(-10 * scale, -15 * scale, 7 * scale, 4 * scale, 2 * scale)
        .roundRect(-10 * scale, -15 * scale, 4 * scale, 10 * scale, 2 * scale)
        .fill(0x228b22);
    }
    if (Math.random() > 0.3) {
      cactus
        .roundRect(3 * scale, -12 * scale, 7 * scale, 4 * scale, 2 * scale)
        .roundRect(6 * scale, -12 * scale, 4 * scale, 8 * scale, 2 * scale)
        .fill(0x228b22);
    }

    cactus.alpha = 0.8;
    return cactus;
  }

  // Mountains
  generateMountains(x1, y1, x2, y2, count) {
    for (let i = 0; i < count; i++) {
      const x = x1 + Math.random() * (x2 - x1);
      const y = y1 + Math.random() * (y2 - y1);
      const scale = 1 + Math.random() * 1.5;

      const mountain = this.createMountain(scale);
      mountain.position.set(x, y);
      this.decorations.push(mountain);
      this.addChild(mountain);
    }
  }

  createMountain(scale = 1) {
    const mountain = new PIXI.Graphics();

    // Mountain body
    mountain
      .poly([0, -40 * scale, -50 * scale, 0, 50 * scale, 0])
      .fill(0x5a6a55);

    // Snow cap
    mountain
      .poly([0, -40 * scale, -12 * scale, -25 * scale, 12 * scale, -25 * scale])
      .fill({ color: 0xffffff, alpha: 0.9 });

    mountain.alpha = 0.6;
    return mountain;
  }

  // Mesas (Southwest)
  generateMesas(x1, y1, x2, y2, count) {
    for (let i = 0; i < count; i++) {
      const x = x1 + Math.random() * (x2 - x1);
      const y = y1 + Math.random() * (y2 - y1);
      const scale = 1 + Math.random();

      const mesa = new PIXI.Graphics();
      mesa
        .poly([-30 * scale, 0, -25 * scale, -20 * scale, 25 * scale, -20 * scale, 30 * scale, 0])
        .fill(0xc4956a);

      mesa
        .rect(-20 * scale, -20 * scale, 40 * scale, 5 * scale)
        .fill(0xd4a574);

      mesa.position.set(x, y);
      mesa.alpha = 0.5;
      this.decorations.push(mesa);
      this.addChild(mesa);
    }
  }

  // Oil derricks (Texas)
  generateOilDerricks(x1, y1, x2, y2, count) {
    for (let i = 0; i < count; i++) {
      const x = x1 + Math.random() * (x2 - x1);
      const y = y1 + Math.random() * (y2 - y1);

      const derrick = new PIXI.Graphics();
      derrick
        .poly([0, -30, -8, 0, 8, 0])
        .fill(0x3a3a3a);

      derrick
        .moveTo(-4, -10)
        .lineTo(4, -10)
        .moveTo(-6, -5)
        .lineTo(6, -5)
        .stroke({ color: 0x3a3a3a, width: 2 });

      derrick.position.set(x, y);
      derrick.alpha = 0.6;
      this.decorations.push(derrick);
      this.addChild(derrick);
    }
  }

  // Farms (Midwest)
  generateFarms(x1, y1, x2, y2, count) {
    for (let i = 0; i < count; i++) {
      const x = x1 + Math.random() * (x2 - x1);
      const y = y1 + Math.random() * (y2 - y1);

      const farm = new PIXI.Graphics();

      // Farmhouse
      farm
        .rect(-8, -12, 16, 12)
        .fill(0xc75050);

      // Roof
      farm
        .poly([-10, -12, 0, -20, 10, -12])
        .fill(0x4a3520);

      // Field pattern
      farm
        .rect(-25, 5, 50, 20)
        .fill({ color: 0xc4a040, alpha: 0.3 });

      farm.position.set(x, y);
      farm.alpha = 0.5;
      this.decorations.push(farm);
      this.addChild(farm);
    }
  }

  // City buildings (Northeast)
  generateBuildings(x1, y1, x2, y2, count) {
    for (let i = 0; i < count; i++) {
      const x = x1 + Math.random() * (x2 - x1);
      const y = y1 + Math.random() * (y2 - y1);
      const height = 20 + Math.random() * 30;

      const building = new PIXI.Graphics();
      building
        .rect(-8, -height, 16, height)
        .fill(0x4a5568);

      // Windows
      for (let row = 0; row < Math.floor(height / 8); row++) {
        building
          .rect(-5, -height + 3 + row * 8, 4, 3)
          .rect(1, -height + 3 + row * 8, 4, 3);
      }
      building.fill({ color: 0xfbbf24, alpha: 0.6 });

      building.position.set(x, y);
      building.alpha = 0.5;
      this.decorations.push(building);
      this.addChild(building);
    }
  }

  // Clear all decorations
  clear() {
    this.decorations.forEach(dec => {
      this.removeChild(dec);
      dec.destroy();
    });
    this.decorations = [];
  }

  // Set visibility based on zoom level (LOD)
  setDetailLevel(level) {
    const visible = level !== 'minimal';
    const alpha = level === 'full' ? 0.8 : level === 'medium' ? 0.5 : 0.3;

    this.visible = visible;
    if (visible) {
      this.alpha = alpha;
    }
  }
}

export default TerrainLayer;
