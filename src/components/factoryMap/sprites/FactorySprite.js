import * as PIXI from 'pixi.js';

/**
 * FactorySprite - Interactive factory marker on the map
 * Updated for PIXI v8 Graphics API with proper path handling
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
    this.animationTime = Math.random() * 100;
    this.glowIntensity = 0;

    // Create sprite elements with error handling
    try {
      this.createBuilding();
      this.createSmokestacks();
      this.createLabel();
    } catch (err) {
      console.error('FactorySprite creation error for', this.label, err);
      this.createFallback();
    }

    this.setupInteraction();
    this.startAnimations();
  }

  createFallback() {
    // Simple fallback square if building fails
    const fallback = new PIXI.Graphics();
    fallback.rect(-25, -25, 50, 50);
    fallback.fill({ color: 0x3a3a4a });
    fallback.stroke({ color: 0xf97316, width: 2 });
    this.building = fallback;
    this.addChild(fallback);
  }

  createBuilding() {
    const building = new PIXI.Container();
    building.label = 'buildingContainer';

    // Base platform (isometric diamond)
    const base = new PIXI.Graphics();
    base.poly([-40, 20, 0, 35, 40, 20, 0, 5]);
    base.fill({ color: 0x2a2a3a });
    building.addChild(base);

    // Main building body - left face
    const leftFace = new PIXI.Graphics();
    leftFace.poly([-40, 20, -40, -15, 0, 0, 0, 35]);
    leftFace.fill({ color: 0x3a3a4a });
    building.addChild(leftFace);

    // Main building body - right face
    const rightFace = new PIXI.Graphics();
    rightFace.poly([0, 35, 0, 0, 40, -15, 40, 20]);
    rightFace.fill({ color: 0x4a4a5a });
    building.addChild(rightFace);

    // Roof
    const roof = new PIXI.Graphics();
    roof.poly([-40, -15, 0, -30, 40, -15, 0, 0]);
    roof.fill({ color: 0x5a5a6a });
    building.addChild(roof);

    // Windows (orange glow)
    const windowColor = this.isActive ? 0xf97316 : 0x4a4a5a;

    // Left face windows
    const leftWindow1 = new PIXI.Graphics();
    leftWindow1.rect(-30, -5, 8, 10);
    leftWindow1.fill({ color: windowColor });
    building.addChild(leftWindow1);

    const leftWindow2 = new PIXI.Graphics();
    leftWindow2.rect(-18, -5, 8, 10);
    leftWindow2.fill({ color: windowColor });
    building.addChild(leftWindow2);

    // Right face windows
    const rightWindow1 = new PIXI.Graphics();
    rightWindow1.rect(12, -5, 8, 10);
    rightWindow1.fill({ color: windowColor, alpha: 0.8 });
    building.addChild(rightWindow1);

    const rightWindow2 = new PIXI.Graphics();
    rightWindow2.rect(24, -5, 8, 10);
    rightWindow2.fill({ color: windowColor, alpha: 0.8 });
    building.addChild(rightWindow2);

    // Door
    const door = new PIXI.Graphics();
    door.rect(-6, 10, 12, 18);
    door.fill({ color: 0x2a2a3a });
    building.addChild(door);

    // Sunbelt accent stripe
    const stripe = new PIXI.Graphics();
    stripe.rect(-40, -17, 80, 3);
    stripe.fill({ color: 0xf97316 });
    building.addChild(stripe);

    this.building = building;
    this.addChild(building);
  }

  createSmokestacks() {
    this.smokestackContainer = new PIXI.Container();

    const positions = [{ x: -20, y: -35 }, { x: 15, y: -32 }];

    positions.forEach((pos, index) => {
      // Smokestack cylinder
      const stack = new PIXI.Graphics();
      stack.rect(pos.x - 4, pos.y, 8, 15);
      stack.fill({ color: 0x5a5a6a });

      // Top rim
      stack.ellipse(pos.x, pos.y, 5, 2);
      stack.fill({ color: 0x6a6a7a });

      this.smokestackContainer.addChild(stack);

      // Create smoke particles
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
    smoke.circle(0, 0, 6);
    smoke.fill({ color: 0xffffff, alpha: 0.6 });

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
    labelBg.roundRect(-25, 38, 50, 18, 9);
    labelBg.fill({ color: 0x1a1a2e, alpha: 0.9 });
    labelBg.stroke({ color: 0xf97316, width: 1, alpha: 0.8 });

    this.addChild(labelBg);

    // Label text - PIXI v8 style
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

    this.createStatsBadge();
  }

  createStatsBadge() {
    const badge = new PIXI.Container();
    badge.label = 'statsBadge';
    badge.position.set(35, -40);

    const bg = new PIXI.Graphics();
    bg.circle(0, 0, 12);
    bg.fill({ color: 0x22c55e });
    bg.stroke({ color: 0x166534, width: 2 });

    badge.addChild(bg);

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
    this.statsBadge.visible = false;
    this.addChild(badge);
  }

  setStats(stats) {
    if (!stats || !this.statsBadge) return;

    const count = stats.activeProjects || 0;
    if (count > 0) {
      this.statsBadgeText.text = count > 99 ? '99+' : count.toString();
      this.statsBadge.visible = true;

      const bg = this.statsBadge.getChildAt(0);
      bg.clear();
      const color = count > 10 ? 0xf59e0b : count > 5 ? 0x84cc16 : 0x22c55e;
      bg.circle(0, 0, 12);
      bg.fill({ color });
      bg.stroke({ color: 0x1a1a2e, width: 2 });
    } else {
      this.statsBadge.visible = false;
    }
  }

  setupInteraction() {
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new PIXI.Rectangle(-45, -50, 90, 110);

    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('pointerout', this.onPointerOut.bind(this));
    this.on('pointertap', this.onPointerTap.bind(this));
  }

  onPointerOver(event) {
    this.scale.set(1.1);
    this.glowIntensity = 1;

    const globalPos = this.getGlobalPosition();
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
    // Animation driven by parent ticker
  }

  update(deltaTime) {
    this.animationTime += deltaTime * 0.05;
    if (this.animationTime > 10000) {
      this.animationTime = this.animationTime % 100;
    }

    // Animate smoke particles
    this.smokeParticles.forEach((smoke, index) => {
      const t = (this.animationTime + smoke.timeOffset) % 100;
      const progress = t / 100;

      smoke.y = smoke.baseY - progress * 40;
      smoke.alpha = Math.sin(progress * Math.PI) * 0.5;
      smoke.x = smoke.baseX + Math.sin(progress * 4 + index) * 8;
      smoke.scale.set(0.5 + progress * 1.5);
    });
  }

  setActive(active) {
    this.isActive = active;
  }

  destroy(options) {
    if (this._pulseTimeout) {
      clearTimeout(this._pulseTimeout);
      this._pulseTimeout = null;
    }

    this.off('pointerover');
    this.off('pointerout');
    this.off('pointertap');

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
