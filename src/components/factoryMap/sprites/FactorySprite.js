import * as PIXI from 'pixi.js';

/**
 * FactorySprite - Interactive factory marker on the map
 * Features animated smoke and hover/click interactions
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

    // Base platform
    building.beginFill(0x2a2a3a);
    building.moveTo(-40, 20);
    building.lineTo(0, 35);
    building.lineTo(40, 20);
    building.lineTo(0, 5);
    building.closePath();
    building.endFill();

    // Main building body - left face
    building.beginFill(0x3a3a4a);
    building.moveTo(-40, 20);
    building.lineTo(-40, -15);
    building.lineTo(0, 0);
    building.lineTo(0, 35);
    building.closePath();
    building.endFill();

    // Main building body - right face
    building.beginFill(0x4a4a5a);
    building.moveTo(0, 35);
    building.lineTo(0, 0);
    building.lineTo(40, -15);
    building.lineTo(40, 20);
    building.closePath();
    building.endFill();

    // Roof
    building.beginFill(0x5a5a6a);
    building.moveTo(-40, -15);
    building.lineTo(0, -30);
    building.lineTo(40, -15);
    building.lineTo(0, 0);
    building.closePath();
    building.endFill();

    // Windows (orange glow)
    const windowColor = this.isActive ? 0xf97316 : 0x4a4a5a;

    // Left face windows
    building.beginFill(windowColor);
    building.drawRect(-30, -5, 8, 10);
    building.drawRect(-18, -5, 8, 10);
    building.endFill();

    // Right face windows
    building.beginFill(windowColor, 0.8);
    building.drawRect(12, -5, 8, 10);
    building.drawRect(24, -5, 8, 10);
    building.endFill();

    // Door
    building.beginFill(0x2a2a3a);
    building.drawRect(-6, 10, 12, 18);
    building.endFill();

    // Sunbelt accent stripe
    building.beginFill(0xf97316);
    building.drawRect(-40, -17, 80, 3);
    building.endFill();

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
      stack.beginFill(0x5a5a6a);
      stack.drawRect(pos.x - 4, pos.y, 8, 15);
      stack.endFill();

      // Top rim
      stack.beginFill(0x6a6a7a);
      stack.drawEllipse(pos.x, pos.y, 5, 2);
      stack.endFill();

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
    smoke.beginFill(0xffffff, 0.6);
    smoke.drawCircle(0, 0, 6);
    smoke.endFill();

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
    labelBg.beginFill(0x1a1a2e, 0.9);
    labelBg.drawRoundedRect(-25, 38, 50, 18, 9);
    labelBg.endFill();

    // Border
    labelBg.lineStyle(1, 0xf97316, 0.8);
    labelBg.drawRoundedRect(-25, 38, 50, 18, 9);

    this.addChild(labelBg);

    // Label text
    const label = new PIXI.Text(this.label, {
      fontSize: 11,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center'
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
    badge.name = 'statsBadge';
    badge.position.set(35, -40);

    // Badge background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x22c55e);
    bg.drawCircle(0, 0, 12);
    bg.endFill();

    // Badge border
    bg.lineStyle(2, 0x166534);
    bg.drawCircle(0, 0, 12);

    badge.addChild(bg);

    // Badge text (count)
    const countText = new PIXI.Text('0', {
      fontSize: 10,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fill: 0xffffff
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
      bg.beginFill(color);
      bg.drawCircle(0, 0, 12);
      bg.endFill();
      bg.lineStyle(2, 0x1a1a2e);
      bg.drawCircle(0, 0, 12);
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
