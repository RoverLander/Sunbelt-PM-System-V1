import * as PIXI from 'pixi.js';
import { JobSiteSprite } from '../sprites/JobSiteSprite';
import { STATE_COORDINATES, getStatePixelPosition } from '../data/factoryLocations';

/**
 * JobSitesLayer - Manages all job site markers on the map
 */
export class JobSitesLayer extends PIXI.Container {
  constructor(mapDimensions) {
    super();

    this.name = 'jobSitesLayer';
    this.mapWidth = mapDimensions.width;
    this.mapHeight = mapDimensions.height;
    this.jobSites = new Map();
  }

  // Add job sites from projects data
  loadProjects(projects) {
    // Clear existing
    this.clear();

    projects.forEach(project => {
      this.addJobSite(project);
    });
  }

  // Add single job site
  addJobSite(project) {
    if (!project.delivery_state) return null;

    // Get position from state (use project.id as seed for consistent positioning)
    const position = getStatePixelPosition(
      project.delivery_state,
      this.mapWidth,
      this.mapHeight,
      project.id // Seed ensures consistent position across re-renders
    );

    if (!position) return null;

    const sprite = new JobSiteSprite({
      id: project.id,
      name: project.name,
      status: project.status,
      factory: project.factory,
      city: project.delivery_city,
      state: project.delivery_state,
      pm: project.pm?.name || project.owner?.name,
      contractValue: project.contract_value
    });

    sprite.position.set(position.x, position.y);

    // Forward events
    sprite.on('jobsite:hover', (data) => this.emit('jobsite:hover', data));
    sprite.on('jobsite:hoverend', () => this.emit('jobsite:hoverend'));
    sprite.on('jobsite:click', (data) => this.emit('jobsite:click', data));

    this.jobSites.set(project.id, sprite);
    this.addChild(sprite);

    return sprite;
  }

  // Update job site
  updateJobSite(projectId, updates) {
    const sprite = this.jobSites.get(projectId);
    if (sprite) {
      sprite.updateData(updates);
    }
  }

  // Remove job site
  removeJobSite(projectId) {
    const sprite = this.jobSites.get(projectId);
    if (sprite) {
      this.removeChild(sprite);
      sprite.destroy();
      this.jobSites.delete(projectId);
    }
  }

  // Animation update
  update(deltaTime) {
    this.jobSites.forEach(sprite => {
      sprite.update(deltaTime);
    });
  }

  // Get job site position
  getJobSitePosition(projectId) {
    const sprite = this.jobSites.get(projectId);
    return sprite ? { x: sprite.x, y: sprite.y } : null;
  }

  // Clear all job sites
  clear() {
    this.jobSites.forEach(sprite => {
      this.removeChild(sprite);
      sprite.destroy();
    });
    this.jobSites.clear();
  }

  // Set visibility based on filters
  setFilter(filterFn) {
    this.jobSites.forEach((sprite, id) => {
      sprite.visible = filterFn(sprite.projectData);
    });
  }

  // Show all
  showAll() {
    this.jobSites.forEach(sprite => {
      sprite.visible = true;
    });
  }

  // Get all visible job sites (for minimap, etc.)
  getVisiblePositions() {
    const positions = [];
    this.jobSites.forEach((sprite, id) => {
      if (sprite.visible) {
        positions.push({
          id,
          x: sprite.x / this.mapWidth,
          y: sprite.y / this.mapHeight,
          status: sprite.status
        });
      }
    });
    return positions;
  }
}

export default JobSitesLayer;
