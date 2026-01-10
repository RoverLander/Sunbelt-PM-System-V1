import * as PIXI from 'pixi.js';

/**
 * JobSiteSprite - Delivery destination marker
 * Shows project location with status-based coloring and pulse animation
 */
export class JobSiteSprite extends PIXI.Container {
  constructor(projectData, options = {}) {
    super();

    this.projectData = projectData;
    this.status = projectData.status || 'In Progress';
    this.animationTime = Math.random() * 100;
    this.pulseScale = 1;

    this.createMarker();
    this.setupInteraction();
  }

  createMarker() {
    // Pin/marker shape
    const marker = new PIXI.Graphics();
    const color = this.getStatusColor();

    // Pin body
    marker.beginFill(color);
    marker.moveTo(0, 0);
    marker.lineTo(-10, -25);
    marker.quadraticCurveTo(-12, -32, 0, -35);
    marker.quadraticCurveTo(12, -32, 10, -25);
    marker.lineTo(0, 0);
    marker.closePath();
    marker.endFill();

    // Inner circle
    marker.beginFill(0xffffff);
    marker.drawCircle(0, -25, 6);
    marker.endFill();

    // Icon in center (package)
    marker.beginFill(color);
    marker.drawRect(-3, -28, 6, 6);
    marker.endFill();

    this.marker = marker;
    this.addChild(marker);

    // Shadow/glow for active sites
    if (this.status === 'Installation' || this.status === 'Shipping') {
      const glow = new PIXI.Graphics();
      glow.beginFill(color, 0.3);
      glow.drawCircle(0, -25, 15);
      glow.endFill();
      glow.name = 'glow';
      this.addChildAt(glow, 0);
    }

    // Label (project name truncated)
    const name = this.projectData.name || 'Project';
    const truncated = name.length > 15 ? name.substring(0, 12) + '...' : name;

    const label = new PIXI.Text(truncated, {
      fontSize: 9,
      fontFamily: 'sans-serif',
      fill: 0xffffff,
      align: 'center'
    });
    label.anchor.set(0.5, 0);
    label.position.set(0, 5);
    label.alpha = 0.8;
    this.label = label;
    this.addChild(label);
  }

  getStatusColor() {
    const colors = {
      'Planning': 0x6b7280,
      'Pre-PM': 0x8b5cf6,
      'PM Handoff': 0x8b5cf6,
      'In Progress': 0x3b82f6,
      'Shipping': 0xf59e0b,
      'Installation': 0x22c55e,
      'Completed': 0x10b981,
      'On Hold': 0xef4444
    };
    return colors[this.status] || 0x6b7280;
  }

  setupInteraction() {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    const hitArea = new PIXI.Rectangle(-15, -40, 30, 50);
    this.hitArea = hitArea;

    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('pointerout', this.onPointerOut.bind(this));
    this.on('pointertap', this.onPointerTap.bind(this));
  }

  onPointerOver(event) {
    this.scale.set(1.2);
    const globalPos = this.getGlobalPosition();

    this.emit('jobsite:hover', {
      projectData: this.projectData,
      screenX: globalPos.x,
      screenY: globalPos.y - 50,
      originalEvent: event
    });
  }

  onPointerOut() {
    this.scale.set(1);
    this.emit('jobsite:hoverend');
  }

  onPointerTap(event) {
    this.emit('jobsite:click', {
      projectData: this.projectData,
      originalEvent: event
    });
  }

  // Animation update
  update(deltaTime) {
    this.animationTime += deltaTime * 0.1;

    // Pulse animation for active sites
    if (this.status === 'Installation' || this.status === 'Shipping') {
      const pulse = Math.sin(this.animationTime) * 0.1 + 1;
      const glow = this.getChildByName('glow');
      if (glow) {
        glow.scale.set(pulse);
        glow.alpha = 0.3 + Math.sin(this.animationTime) * 0.1;
      }
    }
  }

  // Update project data
  updateData(newData) {
    this.projectData = { ...this.projectData, ...newData };
    this.status = newData.status || this.status;
    // Could rebuild marker if status changed
  }
}

export default JobSiteSprite;
