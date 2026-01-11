import * as PIXI from 'pixi.js';

/**
 * FactorySprite - Interactive factory marker on the map
 * Updated for PIXI v8 Graphics API - using single chained calls
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
      this.createLabel();
      console.log(`[FactorySprite] Created: ${this.label}, children: ${this.children.length}`);
    } catch (err) {
      console.error('FactorySprite creation error for', this.label, err);
      this.createFallback();
    }

    this.setupInteraction();
  }

  createFallback() {
    console.warn(`[FactorySprite] Using fallback for ${this.label}`);
    // Simple fallback rectangle if building fails
    const fallback = new PIXI.Graphics()
      .rect(-25, -25, 50, 50)
      .fill(0x3a3a4a)
      .stroke({ width: 3, color: 0xff0000 }); // RED stroke for debugging
    this.building = fallback;
    this.addChild(fallback);
  }

  createBuilding() {
    // SIMPLIFIED DEBUG VERSION - single Graphics with all drawing
    // Using exact same pattern as USMapLayer which DOES work
    const building = new PIXI.Graphics();
    const windowColor = this.isActive ? 0xf97316 : 0x4a4a5a;

    // Draw everything in sequence like USMapLayer does
    // Main building body
    building.rect(-35, -30, 70, 60);
    building.fill(0x3a3a4a);

    // Building outline
    building.rect(-35, -30, 70, 60);
    building.stroke({ width: 2, color: 0x2a2a3a });

    // Roof (darker top section)
    building.rect(-35, -30, 70, 12);
    building.fill(0x5a5a6a);

    // Orange accent stripe at top
    building.rect(-35, -32, 70, 4);
    building.fill(0xf97316);

    // Smokestacks
    building.rect(-30, -45, 10, 15);
    building.fill(0x5a5a6a);
    building.rect(20, -42, 8, 12);
    building.fill(0x5a5a6a);

    // Windows - Row 1
    building.rect(-25, -15, 12, 8);
    building.fill(windowColor);
    building.rect(-5, -15, 12, 8);
    building.fill(windowColor);
    building.rect(15, -15, 12, 8);
    building.fill(windowColor);

    // Windows - Row 2
    building.rect(-25, 0, 12, 8);
    building.fill(windowColor);
    building.rect(-5, 0, 12, 8);
    building.fill(windowColor);
    building.rect(15, 0, 12, 8);
    building.fill(windowColor);

    // Door
    building.rect(-8, 15, 16, 15);
    building.fill(0x2a2a3a);

    this.building = building;
    this.addChild(building);

    console.log(`[FactorySprite] Building created for ${this.label}, bounds:`, building.getBounds());
  }

  createLabel() {
    // Background pill
    const labelBg = new PIXI.Graphics()
      .roundRect(-25, 38, 50, 18, 9)
      .fill(0x1a1a2e)
      .stroke({ width: 1, color: 0xf97316 });
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

    const bg = new PIXI.Graphics()
      .circle(0, 0, 12)
      .fill(0x22c55e)
      .stroke({ width: 2, color: 0x166534 });
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
      bg.circle(0, 0, 12).fill(color).stroke({ color: 0x1a1a2e, width: 2 });
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
