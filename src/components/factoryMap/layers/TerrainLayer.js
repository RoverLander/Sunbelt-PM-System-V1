import * as PIXI from 'pixi.js';
import { REGION_CONFIG, getRegionAt } from '../data/factoryLocations';

/**
 * TerrainLayer - Regional decorations like trees, mountains, cacti
 * Generates appropriate sprites based on geographic region
 */
export class TerrainLayer extends PIXI.Container {
  constructor(mapDimensions, options = {}) {
    super();

    this.name = 'terrainLayer';
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
        tree.beginFill(0x1a4d2e);
        tree.moveTo(0, -20 * scale);
        tree.lineTo(-10 * scale, 0);
        tree.lineTo(10 * scale, 0);
        tree.closePath();
        tree.endFill();
        // Second layer
        tree.beginFill(0x236b40);
        tree.moveTo(0, -28 * scale);
        tree.lineTo(-7 * scale, -10 * scale);
        tree.lineTo(7 * scale, -10 * scale);
        tree.closePath();
        tree.endFill();
        // Trunk
        tree.beginFill(0x4a3520);
        tree.drawRect(-2 * scale, 0, 4 * scale, 6 * scale);
        tree.endFill();
        break;

      case 'palm':
        // Palm trunk
        tree.beginFill(0x8b7355);
        tree.drawRect(-2 * scale, -15 * scale, 4 * scale, 20 * scale);
        tree.endFill();
        // Palm fronds
        tree.beginFill(0x228b22);
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          tree.moveTo(0, -18 * scale);
          tree.lineTo(
            Math.cos(angle) * 12 * scale,
            -18 * scale + Math.sin(angle) * 8 * scale - 5 * scale
          );
        }
        tree.endFill();
        break;

      case 'oak':
      case 'maple':
        // Round deciduous tree
        const color = type === 'maple' ? 0xc75b39 : 0x2d5a3f;
        tree.beginFill(color);
        tree.drawCircle(0, -12 * scale, 10 * scale);
        tree.endFill();
        tree.beginFill(0x4a3520);
        tree.drawRect(-2 * scale, -4 * scale, 4 * scale, 8 * scale);
        tree.endFill();
        break;

      case 'pine':
        // Southern pine
        tree.beginFill(0x2d5a3f);
        tree.moveTo(0, -25 * scale);
        tree.lineTo(-8 * scale, -5 * scale);
        tree.lineTo(8 * scale, -5 * scale);
        tree.closePath();
        tree.endFill();
        tree.beginFill(0x4a3520);
        tree.drawRect(-2 * scale, -5 * scale, 4 * scale, 10 * scale);
        tree.endFill();
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
    cactus.beginFill(0x228b22);
    cactus.drawRoundedRect(-3 * scale, -20 * scale, 6 * scale, 25 * scale, 3 * scale);
    cactus.endFill();

    // Arms
    if (Math.random() > 0.3) {
      cactus.drawRoundedRect(-10 * scale, -15 * scale, 7 * scale, 4 * scale, 2 * scale);
      cactus.drawRoundedRect(-10 * scale, -15 * scale, 4 * scale, 10 * scale, 2 * scale);
    }
    if (Math.random() > 0.3) {
      cactus.drawRoundedRect(3 * scale, -12 * scale, 7 * scale, 4 * scale, 2 * scale);
      cactus.drawRoundedRect(6 * scale, -12 * scale, 4 * scale, 8 * scale, 2 * scale);
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
    mountain.beginFill(0x5a6a55);
    mountain.moveTo(0, -40 * scale);
    mountain.lineTo(-50 * scale, 0);
    mountain.lineTo(50 * scale, 0);
    mountain.closePath();
    mountain.endFill();

    // Snow cap
    mountain.beginFill(0xffffff, 0.9);
    mountain.moveTo(0, -40 * scale);
    mountain.lineTo(-12 * scale, -25 * scale);
    mountain.lineTo(12 * scale, -25 * scale);
    mountain.closePath();
    mountain.endFill();

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
      mesa.beginFill(0xc4956a);
      mesa.moveTo(-30 * scale, 0);
      mesa.lineTo(-25 * scale, -20 * scale);
      mesa.lineTo(25 * scale, -20 * scale);
      mesa.lineTo(30 * scale, 0);
      mesa.closePath();
      mesa.endFill();

      mesa.beginFill(0xd4a574);
      mesa.drawRect(-20 * scale, -20 * scale, 40 * scale, 5 * scale);
      mesa.endFill();

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
      derrick.beginFill(0x3a3a3a);
      derrick.moveTo(0, -30);
      derrick.lineTo(-8, 0);
      derrick.lineTo(8, 0);
      derrick.closePath();
      derrick.endFill();

      derrick.lineStyle(2, 0x3a3a3a);
      derrick.moveTo(-4, -10);
      derrick.lineTo(4, -10);
      derrick.moveTo(-6, -5);
      derrick.lineTo(6, -5);

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
      farm.beginFill(0xc75050);
      farm.drawRect(-8, -12, 16, 12);
      farm.endFill();

      // Roof
      farm.beginFill(0x4a3520);
      farm.moveTo(-10, -12);
      farm.lineTo(0, -20);
      farm.lineTo(10, -12);
      farm.closePath();
      farm.endFill();

      // Field pattern
      farm.beginFill(0xc4a040, 0.3);
      farm.drawRect(-25, 5, 50, 20);
      farm.endFill();

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
      building.beginFill(0x4a5568);
      building.drawRect(-8, -height, 16, height);
      building.endFill();

      // Windows
      building.beginFill(0xfbbf24, 0.6);
      for (let row = 0; row < Math.floor(height / 8); row++) {
        building.drawRect(-5, -height + 3 + row * 8, 4, 3);
        building.drawRect(1, -height + 3 + row * 8, 4, 3);
      }
      building.endFill();

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
