import * as PIXI from 'pixi.js';

/**
 * TruckSprite - Animated delivery truck traveling along route
 * Follows bezier curve path with rotation and wheel animation
 */
export class TruckSprite extends PIXI.Container {
  constructor(deliveryData, routePath, options = {}) {
    super();

    this.deliveryData = deliveryData;
    this.routePath = routePath;
    this.progress = deliveryData.progress || 0;
    this.speed = options.speed || 0.002; // Progress per frame
    this.animationTime = 0;
    this.wheelRotation = 0;

    this.createTruck();
    this.setupInteraction();
    this.updatePosition(this.progress);
  }

  createTruck() {
    const truck = new PIXI.Container();

    // Trailer (tan/beige modular unit)
    const trailer = new PIXI.Graphics();
    trailer.beginFill(0xd4a574);
    trailer.drawRoundedRect(-28, -8, 24, 14, 2);
    trailer.endFill();

    // Trailer details (windows)
    trailer.beginFill(0x8b7355);
    trailer.drawRect(-26, -6, 4, 4);
    trailer.drawRect(-20, -6, 4, 4);
    trailer.drawRect(-14, -6, 4, 4);
    trailer.endFill();

    // Cab (Sunbelt orange)
    const cab = new PIXI.Graphics();
    cab.beginFill(0xf97316);
    cab.drawRoundedRect(-4, -7, 12, 12, 3);
    cab.endFill();

    // Cab window
    cab.beginFill(0x87CEEB);
    cab.drawRect(-2, -5, 6, 5);
    cab.endFill();

    // Wheels
    this.wheels = [];
    const wheelPositions = [-24, -12, 2];

    wheelPositions.forEach(x => {
      const wheel = new PIXI.Graphics();
      wheel.beginFill(0x1a1a1a);
      wheel.drawCircle(0, 0, 4);
      wheel.endFill();

      // Wheel detail
      wheel.beginFill(0x3a3a3a);
      wheel.drawCircle(0, 0, 2);
      wheel.endFill();

      wheel.position.set(x, 6);
      this.wheels.push(wheel);
      truck.addChild(wheel);
    });

    truck.addChild(trailer);
    truck.addChild(cab);

    // Dust particles container
    this.dustContainer = new PIXI.Container();
    this.dustParticles = [];

    // Create dust particles
    for (let i = 0; i < 5; i++) {
      const dust = new PIXI.Graphics();
      dust.beginFill(0xc4956a, 0.4);
      dust.drawCircle(0, 0, 3);
      dust.endFill();
      dust.alpha = 0;
      dust.particleLife = 0;
      this.dustParticles.push(dust);
      this.dustContainer.addChild(dust);
    }

    this.addChild(this.dustContainer);
    this.truck = truck;
    this.addChild(truck);
  }

  setupInteraction() {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    const hitArea = new PIXI.Rectangle(-30, -15, 45, 25);
    this.hitArea = hitArea;

    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('pointerout', this.onPointerOut.bind(this));
    this.on('pointertap', this.onPointerTap.bind(this));
  }

  onPointerOver(event) {
    this.truck.scale.set(1.2);
    const globalPos = this.getGlobalPosition();

    this.emit('truck:hover', {
      deliveryData: this.deliveryData,
      progress: this.progress,
      screenX: globalPos.x,
      screenY: globalPos.y - 30,
      originalEvent: event
    });
  }

  onPointerOut() {
    this.truck.scale.set(1);
    this.emit('truck:hoverend');
  }

  onPointerTap(event) {
    this.emit('truck:click', {
      deliveryData: this.deliveryData,
      originalEvent: event
    });
  }

  // Update position along bezier curve
  updatePosition(progress) {
    this.progress = Math.max(0, Math.min(1, progress));

    // Safety check for route path data
    if (!this.routePath || !this.routePath.from || !this.routePath.to || !this.routePath.controlPoint) {
      console.warn('TruckSprite: Invalid routePath data');
      return;
    }

    const { from, to, controlPoint } = this.routePath;
    const t = this.progress;

    // Quadratic bezier formula
    const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * controlPoint.x + t * t * to.x;
    const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * controlPoint.y + t * t * to.y;

    this.position.set(x, y);

    // Calculate rotation (direction of travel)
    const dx = 2 * (1 - t) * (controlPoint.x - from.x) + 2 * t * (to.x - controlPoint.x);
    const dy = 2 * (1 - t) * (controlPoint.y - from.y) + 2 * t * (to.y - controlPoint.y);
    this.truck.rotation = Math.atan2(dy, dx);
  }

  // Animation update
  update(deltaTime) {
    this.animationTime += deltaTime;

    // Auto-advance progress (simulated movement)
    if (this.progress < 1) {
      this.updatePosition(this.progress + this.speed * deltaTime);
    }

    // Wheel rotation
    this.wheelRotation += deltaTime * 0.3;
    this.wheels.forEach(wheel => {
      wheel.rotation = this.wheelRotation;
    });

    // Dust particles
    this.updateDust(deltaTime);
  }

  updateDust(deltaTime) {
    this.dustParticles.forEach((dust, i) => {
      dust.particleLife -= deltaTime * 0.05;

      if (dust.particleLife <= 0 && this.progress < 0.95 && this.progress > 0.05) {
        // Respawn particle behind truck
        dust.particleLife = 1;
        dust.position.set(
          -35 + Math.random() * 10,
          5 + Math.random() * 5
        );
        dust.alpha = 0.4;
        dust.scale.set(0.5);
      } else if (dust.particleLife > 0) {
        // Animate particle
        dust.x -= deltaTime * 0.5;
        dust.y += (Math.random() - 0.5) * deltaTime * 0.2;
        dust.alpha = dust.particleLife * 0.4;
        dust.scale.set(0.5 + (1 - dust.particleLife) * 1.5);
      }
    });

    // Position dust container at truck's rotation
    this.dustContainer.rotation = this.truck.rotation;
  }

  // Set progress directly (e.g., from database)
  setProgress(progress) {
    this.updatePosition(progress);
  }

  // Check if delivery is complete
  isComplete() {
    return this.progress >= 1;
  }

  // Clean up
  destroy(options) {
    // Remove event listeners
    this.off('pointerover');
    this.off('pointerout');
    this.off('pointertap');

    // Clear dust particles
    this.dustParticles = [];

    super.destroy(options);
  }
}

export default TruckSprite;
