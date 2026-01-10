import * as PIXI from 'pixi.js';
import { FactorySprite } from '../sprites/FactorySprite';
import { FACTORY_LOCATIONS, getPixelPosition } from '../data/factoryLocations';

/**
 * FactoriesLayer - Manages all factory sprites on the map
 */
export class FactoriesLayer extends PIXI.Container {
  constructor(mapDimensions, options = {}) {
    super();

    this.label = 'factoriesLayer';
    this.mapWidth = mapDimensions.width;
    this.mapHeight = mapDimensions.height;

    // Map of factory code -> sprite
    this.factories = new Map();

    // Factory stats data (will be populated from database)
    this.factoryStats = new Map();

    // Initialize factories
    this.initialize();
  }

  initialize() {
    Object.entries(FACTORY_LOCATIONS).forEach(([code, data]) => {
      const position = getPixelPosition(code, this.mapWidth, this.mapHeight);
      if (!position) return;

      const sprite = new FactorySprite({
        code,
        ...data
      });

      sprite.position.set(position.x, position.y);

      // Forward events
      sprite.on('factory:hover', (eventData) => {
        const stats = this.factoryStats.get(code) || {};
        this.emit('factory:hover', {
          ...eventData,
          stats
        });
      });

      sprite.on('factory:hoverend', () => {
        this.emit('factory:hoverend');
      });

      sprite.on('factory:click', (eventData) => {
        const stats = this.factoryStats.get(code) || {};
        this.emit('factory:click', {
          ...eventData,
          stats
        });
      });

      this.factories.set(code, sprite);
      this.addChild(sprite);
    });
  }

  // Update with live stats from database
  updateStats(statsData) {
    // statsData is an object: { 'NWBS': { activeProjects: 5, ... }, ... }
    Object.entries(statsData).forEach(([code, stats]) => {
      this.factoryStats.set(code, stats);

      // Update factory active state and stats badge
      const factory = this.factories.get(code);
      if (factory) {
        factory.setActive(stats.activeProjects > 0);
        factory.setStats(stats);
      }
    });
  }

  // Update animations - called every frame
  update(deltaTime) {
    this.factories.forEach(factory => {
      factory.update(deltaTime);
    });
  }

  // Highlight a specific factory
  highlightFactory(code) {
    const factory = this.factories.get(code);
    if (factory) {
      factory.scale.set(1.3);
      // Could add glow filter
    }
  }

  // Clear highlight
  clearHighlight(code) {
    const factory = this.factories.get(code);
    if (factory) {
      factory.scale.set(1);
    }
  }

  // Get factory position for navigation
  getFactoryPosition(code) {
    const factory = this.factories.get(code);
    if (factory) {
      return { x: factory.x, y: factory.y };
    }
    return null;
  }

  // Get all factory positions (for mini-map)
  getAllPositions() {
    const positions = [];
    this.factories.forEach((sprite, code) => {
      positions.push({
        code,
        x: sprite.x / this.mapWidth,  // Normalized 0-1
        y: sprite.y / this.mapHeight
      });
    });
    return positions;
  }

  // Set visibility based on LOD
  setDetailLevel(level) {
    this.factories.forEach(factory => {
      if (level === 'dots') {
        // Show simplified version
        factory.visible = true;
        factory.scale.set(0.5);
      } else if (level === 'small') {
        factory.visible = true;
        factory.scale.set(0.7);
      } else {
        factory.visible = true;
        factory.scale.set(1);
      }
    });
  }
}

export default FactoriesLayer;
