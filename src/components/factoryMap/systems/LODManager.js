/**
 * LODManager - Level of Detail manager
 * Adjusts rendering quality based on zoom level for performance
 */
export class LODManager {
  constructor(layers, options = {}) {
    this.layers = layers;
    this.currentZoom = 1;
    this.currentLOD = 'medium';

    // LOD thresholds
    this.thresholds = {
      minimal: 0.3,   // Below 30% zoom
      low: 0.5,       // 30-50% zoom
      medium: 1.0,    // 50-100% zoom
      high: 1.5,      // 100-150% zoom
      full: 2.0       // Above 150% zoom
    };

    // Settings per LOD level
    this.settings = {
      minimal: {
        terrain: false,
        decorations: false,
        routes: 'simple',
        factories: 'dots',
        jobSites: 'dots',
        trucks: 'dots',
        animations: false,
        labels: false
      },
      low: {
        terrain: false,
        decorations: false,
        routes: 'simple',
        factories: 'small',
        jobSites: 'small',
        trucks: 'small',
        animations: false,
        labels: false
      },
      medium: {
        terrain: true,
        decorations: 'sparse',
        routes: 'normal',
        factories: 'normal',
        jobSites: 'normal',
        trucks: 'normal',
        animations: true,
        labels: true
      },
      high: {
        terrain: true,
        decorations: 'normal',
        routes: 'detailed',
        factories: 'detailed',
        jobSites: 'detailed',
        trucks: 'detailed',
        animations: true,
        labels: true
      },
      full: {
        terrain: true,
        decorations: 'full',
        routes: 'detailed',
        factories: 'detailed',
        jobSites: 'detailed',
        trucks: 'detailed',
        animations: true,
        labels: true
      }
    };
  }

  // Update LOD based on zoom
  update(zoom) {
    this.currentZoom = zoom;
    const newLOD = this.calculateLOD(zoom);

    if (newLOD !== this.currentLOD) {
      this.currentLOD = newLOD;
      this.applyLOD(newLOD);
    }
  }

  calculateLOD(zoom) {
    if (zoom < this.thresholds.minimal) return 'minimal';
    if (zoom < this.thresholds.low) return 'low';
    if (zoom < this.thresholds.medium) return 'medium';
    if (zoom < this.thresholds.high) return 'high';
    return 'full';
  }

  applyLOD(level) {
    const settings = this.settings[level];

    // Terrain layer
    if (this.layers.terrain) {
      this.layers.terrain.visible = settings.terrain;
      if (settings.decorations) {
        this.layers.terrain.setDetailLevel(settings.decorations);
      }
    }

    // Factories layer
    if (this.layers.factories) {
      this.layers.factories.setDetailLevel(settings.factories);
    }

    // Job sites layer
    if (this.layers.jobSites) {
      this.layers.jobSites.visible = settings.jobSites !== false;
      if (settings.jobSites === 'dots') {
        this.layers.jobSites.scale.set(0.5);
      } else if (settings.jobSites === 'small') {
        this.layers.jobSites.scale.set(0.7);
      } else {
        this.layers.jobSites.scale.set(1);
      }
    }

    // Routes layer
    if (this.layers.routes) {
      this.layers.routes.visible = settings.routes !== false;
    }

    // Trucks layer
    if (this.layers.trucks) {
      this.layers.trucks.visible = settings.trucks !== false;
      if (settings.trucks === 'dots') {
        this.layers.trucks.scale.set(0.5);
      } else if (settings.trucks === 'small') {
        this.layers.trucks.scale.set(0.7);
      } else {
        this.layers.trucks.scale.set(1);
      }
    }

    // Emit event for other systems to respond
    return settings;
  }

  // Get current LOD level
  getLOD() {
    return this.currentLOD;
  }

  // Get current settings
  getSettings() {
    return this.settings[this.currentLOD];
  }

  // Check if animations should run
  shouldAnimate() {
    return this.settings[this.currentLOD].animations;
  }
}

export default LODManager;
