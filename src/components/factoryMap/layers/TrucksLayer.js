import * as PIXI from 'pixi.js';
import { TruckSprite } from '../sprites/TruckSprite';

/**
 * TrucksLayer - Manages animated delivery trucks on routes
 */
export class TrucksLayer extends PIXI.Container {
  constructor(mapDimensions) {
    super();

    this.name = 'trucksLayer';
    this.mapWidth = mapDimensions.width;
    this.mapHeight = mapDimensions.height;
    this.trucks = new Map();
  }

  // Add truck for a delivery
  addTruck(deliveryId, deliveryData, routePath) {
    // Remove existing truck for this delivery
    this.removeTruck(deliveryId);

    const truck = new TruckSprite(deliveryData, routePath, {
      speed: 0.001 + Math.random() * 0.001 // Slight variation
    });

    // Forward events
    truck.on('truck:hover', (data) => this.emit('truck:hover', data));
    truck.on('truck:hoverend', () => this.emit('truck:hoverend'));
    truck.on('truck:click', (data) => this.emit('truck:click', data));

    this.trucks.set(deliveryId, truck);
    this.addChild(truck);

    return truck;
  }

  // Update truck progress
  updateTruckProgress(deliveryId, progress) {
    const truck = this.trucks.get(deliveryId);
    if (truck) {
      truck.setProgress(progress);
    }
  }

  // Remove truck
  removeTruck(deliveryId) {
    const truck = this.trucks.get(deliveryId);
    if (truck) {
      this.removeChild(truck);
      truck.destroy();
      this.trucks.delete(deliveryId);
    }
  }

  // Animation update
  update(deltaTime) {
    const completed = [];

    this.trucks.forEach((truck, id) => {
      truck.update(deltaTime);

      // Check if delivery is complete
      if (truck.isComplete()) {
        completed.push(id);
      }
    });

    // Emit completion events
    completed.forEach(id => {
      const truck = this.trucks.get(id);
      if (truck) {
        this.emit('truck:arrived', {
          deliveryId: id,
          deliveryData: truck.deliveryData
        });
      }
    });
  }

  // Clear all trucks
  clear() {
    this.trucks.forEach(truck => {
      this.removeChild(truck);
      truck.destroy();
    });
    this.trucks.clear();
  }

  // Get truck count
  getCount() {
    return this.trucks.size;
  }

  // Get all truck positions (for stats)
  getTruckPositions() {
    const positions = [];
    this.trucks.forEach((truck, id) => {
      positions.push({
        id,
        x: truck.x,
        y: truck.y,
        progress: truck.progress,
        data: truck.deliveryData
      });
    });
    return positions;
  }

  // Pause/resume all trucks
  setPaused(paused) {
    this.trucks.forEach(truck => {
      truck.speed = paused ? 0 : 0.001;
    });
  }
}

export default TrucksLayer;
