import * as PIXI from 'pixi.js';

/**
 * FactorySprite - Interactive factory marker on the map
 * Features animated smoke and hover/click interactions
 * Updated for PIXI v8 Graphics API
 */
export class FactorySprite extends PIXI.Container {
  constructor(factoryData, options = {}) {
    super();

    this.factoryData = factoryData;
    this.label = factoryData.code;
    this.isActive = options.isActive ?? true;
    this.scale.set(1);

    // Animation state
    this.smokeParticles = [];
    this.animationTime = Math.random() * 100; // Random start offset
    this.glowIntensity = 0;

    // Create sprite elements
    this.createBuilding();
    this.createSmokestacks();
    this.createLabel();
    this.setupInteraction();

    // Start animations
    this.startAnimations();
  }

  createBuilding() {
    const building = new PIXI.Graphics();

    // Base platform (isometric diamond)
    building
      .poly([-40, 20, 0, 35, 40, 20, 0, 5])
      .fill(0x2a2a3a);

    // Main building body - left face
    building
      .poly([-40, 20, -40, -15, 0, 0, 0, 35])
      .fill(0x3a3a4a);

    // Main building body - right face
    building
      .poly([0, 35, 0, 0, 40, -15, 40, 20])
      .fill(0x4a4a5a);

    // Roof
    building
      .poly([-40, -15, 0, -30, 40, -15, 0, 0])
      .fill(0x5a5a6a);

    // Windows (orange glow)
    const windowColor = this.isActive ? 0xf97316 : 0x4a4a5a;

    // Left face windows
    building
      .rect(-30, -5, 8, 10)
      .rect(-18, -5, 8, 10)
      .fill(windowColor);

    // Right face windows
    building
      .rect(12, -5, 8, 10)
      .rect(24, -5, 8, 10)
      .fill({ color: windowColor, alpha: 0.8 });

    // Door
    building
      .rect(-6, 10, 12, 18)
      .fill(0x2a2a3a);

    // Sunbelt accent stripe
    building
      .rect(-40, -17, 80, 3)
      .fill(0xf97316);

    this.building = building;
    this.addChild(building);
  }

  createSmokestacks() {
    this.smokestackContainer = new PIXI.Container();

    // Create two smokestacks
    const positions = [{ x: -20, y: -35 }, { x: 15, y: -32 }];

    positions.forEach((pos, index) => {
      // Smokestack cylinder
      const stack = new PIXI.Graphics();
      stack
        .rect(pos.x - 4, pos.y, 8, 15)
        .fill(0x5a5a6a);

      // Top rim
      stack
        .ellipse(pos.x, pos.y, 5, 2)
        .fill(0x6a6a7a);

      this.smokestackContainer.addChild(stack);

      // Create smoke particles for this stack
      if (this.isActive) {
        for (let i = 0; i < 4; i++) {
          const smoke = this.createSmokeParticle(pos.x, pos.y - 5, index * 25 + i * 25);
          this.smokeParticles.push(smoke);
          this.smokestackContainer.addChild(smoke);
        }
      }
    });

    this.addChild(this.smokestackContainer);
  }

  createSmokeParticle(x, baseY, timeOffset) {
    const smoke = new PIXI.Graphics();
    smoke
      .circle(0, 0, 6)
      .fill({ color: 0xffffff, alpha: 0.6 });

    smoke.position.set(x, baseY);
    smoke.baseX = x;
    smoke.baseY = baseY;
    smoke.timeOffset = timeOffset;
    smoke.alpha = 0;

    return smoke;
  }

  createLabel() {
    // Background pill
    const labelBg = new PIXI.Graphics();
    labelBg
      .roundRect(-25, 38, 50, 18, 9)
      .fill({ color: 0x1a1a2e, alpha: 0.9 })
      .stroke({ color: 0xf97316, width: 1, alpha: 0.8 });

    this.addChild(labelBg);

    // Label text - PIXI v8 uses TextStyle
    const label = new PIXI.Text({
      text: this.label,
      style: {
        fontSize: 11,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        fill: 0xffffff,
        align: 'center'
      }
    });
    label.anchor.set(0.5, 0.5);
    label.position.set(0, 47);

    this.labelText = label;
    this.addChild(label);

    // Stats badge (shows active project count)
    this.createStatsBadge();
  }

  createStatsBadge() {
    const badge = new PIXI.Container();
    badge.label = 'statsBadge';
    badge.position.set(35, -40);

    // Badge background
    const bg = new PIXI.Graphics();
    bg
      .circle(0, 0, 12)
      .fill(0x22c55e)
      .stroke({ color: 0x166534, width: 2 });

    badge.addChild(bg);

    // Badge text (count) - PIXI v8 uses TextStyle
    const countText = new PIXI.Text({
      text: '0',
      style: {
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        fill: 0xffffff
      }
    });
    countText.anchor.set(0.5, 0.5);
    badge.addChild(countText);

    this.statsBadge = badge;
    this.statsBadgeText = countText;
    this.statsBadge.visible = false; // Hidden until stats are set
    this.addChild(badge);
  }

  // Update stats badge
  setStats(stats) {
    if (!stats || !this.statsBadge) return;

    const count = stats.activeProjects || 0;
    if (count > 0) {
      this.statsBadgeText.text = count > 99 ? '99+' : count.toString();
      this.statsBadge.visible = true;

      // Change color based on count
      const bg = this.statsBadge.getChildAt(0);
      bg.clear();
      const color = count > 10 ? 0xf59e0b : count > 5 ? 0x84cc16 : 0x22c55e;
      bg
        .circle(0, 0, 12)
        .fill(color)
        .stroke({ color: 0x1a1a2e, width: 2 });
    } else {
      this.statsBadge.visible = false;
    }
  }

  setupInteraction() {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Hover area (larger than visual for easier targeting)
    const hitArea = new PIXI.Rectangle(-45, -50, 90, 110);
    this.hitArea = hitArea;

    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('pointerout', this.onPointerOut.bind(this));
    this.on('pointertap', this.onPointerTap.bind(this));
  }

  onPointerOver(event) {
    // Scale up slightly
    this.scale.set(1.1);

    // Brighten
    this.glowIntensity = 1;

    // Get screen position for tooltip
    const globalPos = this.getGlobalPosition();

    // Emit event for parent to handle tooltip
    this.emit('factory:hover', {
      factoryData: this.factoryData,
      screenX: globalPos.x,
      screenY: globalPos.y,
      originalEvent: event
    });
  }

  onPointerOut() {
    this.scale.set(1);
    this.glowIntensity = 0;
    this.emit('factory:hoverend');
  }

  onPointerTap(event) {
    // Pulse animation
    this.scale.set(1.2);
    this._pulseTimeout = setTimeout(() => {
      if (!this.destroyed) {
        this.scale.set(1.1);
      }
    }, 100);

    this.emit('factory:click', {
      factoryData: this.factoryData,
      originalEvent: event
    });
  }

  startAnimations() {
    // Animation will be driven by parent's ticker
  }

  // Called every frame by parent
  update(deltaTime) {
    this.animationTime += deltaTime * 0.05;
    // Prevent overflow by keeping animationTime within a reasonable range
    // Smoke animation cycles at 100, so use modulo to prevent unbounded growth
    if (this.animationTime > 10000) {
      this.animationTime = this.animationTime % 100;
    }

    // Animate smoke particles
    this.smokeParticles.forEach((smoke, index) => {
      const t = (this.animationTime + smoke.timeOffset) % 100;
      const progress = t / 100;

      // Rise and fade
      smoke.y = smoke.baseY - progress * 40;
      smoke.alpha = Math.sin(progress * Math.PI) * 0.5;

      // Slight horizontal drift
      smoke.x = smoke.baseX + Math.sin(progress * 4 + index) * 8;

      // Scale up as it rises
      smoke.scale.set(0.5 + progress * 1.5);
    });

    // Pulse glow effect when hovered
    if (this.glowIntensity > 0) {
      const pulse = Math.sin(this.animationTime * 0.2) * 0.1 + 0.9;
      // Could apply filter here for glow effect
    }
  }

  // Update active state (e.g., when data changes)
  setActive(active) {
    this.isActive = active;
    // Could update window colors, smoke activity, etc.
  }

  // Clean up
  destroy(options) {
    // Clear any pending timeouts
    if (this._pulseTimeout) {
      clearTimeout(this._pulseTimeout);
      this._pulseTimeout = null;
    }

    // Remove event listeners
    this.off('pointerover');
    this.off('pointerout');
    this.off('pointertap');

    // Properly destroy smoke particles to prevent memory leaks
    this.smokeParticles.forEach(particle => {
      if (particle && !particle.destroyed) {
        particle.destroy();
      }
    });
    this.smokeParticles = [];

    super.destroy(options);
  }
}

export default FactorySprite;
