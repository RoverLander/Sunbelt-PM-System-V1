import * as PIXI from 'pixi.js';

/**
 * FactorySprite - Interactive factory marker on the map
 * Using PIXI v8 Graphics API with full chaining pattern
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

    // Create sprite elements
    try {
      this.createBuilding();
      this.createLabel();
      console.log(`[FactorySprite] Created: ${this.label}, children: ${this.children.length}`);
    } catch (err) {
      console.error('[FactorySprite] Error creating', this.label, ':', err.message);
      this.createFallback();
    }

    this.setupInteraction();
  }

  createFallback() {
    console.warn(`[FactorySprite] Using fallback for ${this.label}`);
    // Ultra-simple fallback - just a circle (matches PIXI v8 examples exactly)
    const fallback = new PIXI.Graphics()
      .circle(0, 0, 25)
      .fill(0xf97316);
    this.building = fallback;
    this.addChild(fallback);
  }

  createBuilding() {
    // PIXI v8: Use chained calls like the official docs
    // https://pixijs.com/8.x/guides/components/scene-objects/graphics
    const windowColor = this.isActive ? 0xf97316 : 0x4a4a5a;

    // Create building body - all in one chained Graphics
    const body = new PIXI.Graphics()
      .rect(-35, -30, 70, 60)
      .fill(0x3a3a4a);
    this.addChild(body);

    // Roof section
    const roof = new PIXI.Graphics()
      .rect(-35, -30, 70, 12)
      .fill(0x5a5a6a);
    this.addChild(roof);

    // Smokestacks as separate Graphics
    const stacks = new PIXI.Graphics()
      .rect(-30, -45, 10, 15)
      .fill(0x5a5a6a);
    this.addChild(stacks);

    const stack2 = new PIXI.Graphics()
      .rect(20, -42, 8, 12)
      .fill(0x5a5a6a);
    this.addChild(stack2);

    // Orange accent stripe
    const stripe = new PIXI.Graphics()
      .rect(-35, -32, 70, 4)
      .fill(0xf97316);
    this.addChild(stripe);

    // Windows - each as separate Graphics to avoid chaining issues
    const win1 = new PIXI.Graphics().rect(-25, -15, 12, 8).fill(windowColor);
    const win2 = new PIXI.Graphics().rect(-5, -15, 12, 8).fill(windowColor);
    const win3 = new PIXI.Graphics().rect(15, -15, 12, 8).fill(windowColor);
    const win4 = new PIXI.Graphics().rect(-25, 0, 12, 8).fill(windowColor);
    const win5 = new PIXI.Graphics().rect(-5, 0, 12, 8).fill(windowColor);
    const win6 = new PIXI.Graphics().rect(15, 0, 12, 8).fill(windowColor);

    this.addChild(win1, win2, win3, win4, win5, win6);

    // Door
    const door = new PIXI.Graphics()
      .rect(-8, 15, 16, 15)
      .fill(0x2a2a3a);
    this.addChild(door);

    this.building = body;
  }

  createLabel() {
    // Background pill for label
    const labelBg = new PIXI.Graphics()
      .roundRect(-25, 38, 50, 18, 9)
      .fill(0x1a1a2e);
    this.addChild(labelBg);

    // Orange border on label
    const labelBorder = new PIXI.Graphics()
      .roundRect(-25, 38, 50, 18, 9)
      .stroke({ width: 1, color: 0xf97316 });
    this.addChild(labelBorder);

    // Label text
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
      .fill(0x22c55e);
    badge.addChild(bg);

    const border = new PIXI.Graphics()
      .circle(0, 0, 12)
      .stroke({ width: 2, color: 0x166534 });
    badge.addChild(border);

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

      // Update badge color based on count
      const bg = this.statsBadge.getChildAt(0);
      if (bg) {
        bg.clear();
        const color = count > 10 ? 0xf59e0b : count > 5 ? 0x84cc16 : 0x22c55e;
        bg.circle(0, 0, 12).fill(color);
      }
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
