import * as PIXI from 'pixi.js';
import { GlowFilter } from 'pixi-filters';

/**
 * FactorySprite - Interactive factory marker on the map
 * Supports AI-generated sprite images with dynamic glow effects
 * Falls back to programmatic graphics if sprite not available
 */
export class FactorySprite extends PIXI.Container {
  // Static texture cache for all factory sprites
  static textureCache = null;
  static textureLoading = false;
  static textureLoadPromise = null;

  constructor(factoryData, options = {}) {
    super();

    this.factoryData = factoryData;
    this.label = factoryData.code;
    this.isActive = options.isActive ?? true;
    this.activityLevel = 0; // 0-1, controls glow intensity
    this.scale.set(1);

    // Animation state
    this.smokeParticles = [];
    this.animationTime = Math.random() * 100;
    this.glowIntensity = 0;
    this.targetGlowIntensity = 0;

    // Glow filter for active state
    this.glowFilter = new GlowFilter({
      distance: 20,
      outerStrength: 0,
      innerStrength: 0,
      color: 0xf97316, // Sunbelt orange
      quality: 0.3
    });

    // Create sprite elements
    this.initializeSprite(options);
  }

  async initializeSprite(options) {
    try {
      // Try to load the AI-generated sprite
      const texture = await this.loadFactoryTexture();
      if (texture) {
        this.createSpriteBuilding(texture);
      } else {
        this.createBuilding();
      }
    } catch (err) {
      console.warn('Failed to load factory sprite, using fallback:', err);
      this.createBuilding();
    }

    this.createSmokestacks();
    this.createLabel();
    this.setupInteraction();
    this.startAnimations();
  }

  async loadFactoryTexture() {
    // Return cached texture if available
    if (FactorySprite.textureCache) {
      return FactorySprite.textureCache;
    }

    // If already loading, wait for it
    if (FactorySprite.textureLoading) {
      return FactorySprite.textureLoadPromise;
    }

    // Start loading
    FactorySprite.textureLoading = true;
    FactorySprite.textureLoadPromise = new Promise(async (resolve) => {
      try {
        // Try to load the factory sprite from assets
        const texture = await PIXI.Assets.load('/assets/sprites/factory_idle.png');
        FactorySprite.textureCache = texture;
        resolve(texture);
      } catch (err) {
        console.warn('Factory sprite not found, will use programmatic fallback');
        resolve(null);
      } finally {
        FactorySprite.textureLoading = false;
      }
    });

    return FactorySprite.textureLoadPromise;
  }

  createSpriteBuilding(texture) {
    // Create sprite from AI-generated image
    const sprite = new PIXI.Sprite(texture);

    // Scale to match expected size (adjust based on your sprite dimensions)
    // Your sprite is 832x1216, we want it around 80-100px wide on screen
    const targetWidth = 80;
    const scale = targetWidth / texture.width;
    sprite.scale.set(scale);

    // Center the sprite
    sprite.anchor.set(0.5, 0.85); // Anchor near bottom center for proper positioning

    // Apply glow filter
    sprite.filters = [this.glowFilter];

    this.building = sprite;
    this.buildingSprite = sprite;
    this.usesSpriteImage = true;
    this.addChild(sprite);
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
    const building = new PIXI.Graphics();

    // Build each shape separately with explicit fills
    // Base platform (isometric diamond)
    building.poly([-40, 20, 0, 35, 40, 20, 0, 5]);
    building.fill({ color: 0x2a2a3a });

    // Main building body - left face
    building.poly([-40, 20, -40, -15, 0, 0, 0, 35]);
    building.fill({ color: 0x3a3a4a });

    // Main building body - right face
    building.poly([0, 35, 0, 0, 40, -15, 40, 20]);
    building.fill({ color: 0x4a4a5a });

    // Roof
    building.poly([-40, -15, 0, -30, 40, -15, 0, 0]);
    building.fill({ color: 0x5a5a6a });

    // Windows (orange glow when active)
    const windowColor = this.isActive ? 0xf97316 : 0x4a4a5a;

    // Left face windows
    building.rect(-30, -5, 8, 10);
    building.fill({ color: windowColor });
    building.rect(-18, -5, 8, 10);
    building.fill({ color: windowColor });

    // Right face windows
    building.rect(12, -5, 8, 10);
    building.fill({ color: windowColor, alpha: 0.8 });
    building.rect(24, -5, 8, 10);
    building.fill({ color: windowColor, alpha: 0.8 });

    // Door
    building.rect(-6, 10, 12, 18);
    building.fill({ color: 0x2a2a3a });

    // Sunbelt accent stripe
    building.rect(-40, -17, 80, 3);
    building.fill({ color: 0xf97316 });

    // Apply glow filter to programmatic building too
    building.filters = [this.glowFilter];

    this.building = building;
    this.usesSpriteImage = false;
    this.addChild(building);
  }

  createSmokestacks() {
    this.smokestackContainer = new PIXI.Container();

    // Adjust positions based on whether using sprite or programmatic
    const positions = this.usesSpriteImage
      ? [{ x: -15, y: -60 }, { x: 10, y: -55 }]  // Adjust for sprite
      : [{ x: -20, y: -35 }, { x: 15, y: -32 }]; // Original positions

    positions.forEach((pos, index) => {
      // Only create visual smokestacks for programmatic building
      if (!this.usesSpriteImage) {
        const stack = new PIXI.Graphics();
        stack.rect(pos.x - 4, pos.y, 8, 15);
        stack.fill({ color: 0x5a5a6a });
        stack.ellipse(pos.x, pos.y, 5, 2);
        stack.fill({ color: 0x6a6a7a });
        this.smokestackContainer.addChild(stack);
      }

      // Create smoke particles for both types
      if (this.isActive && this.activityLevel > 0.3) {
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

  /**
   * Set activity level and update glow
   * @param {number} level - 0 to 1 (0 = idle, 1 = max activity)
   */
  setActivityLevel(level) {
    this.activityLevel = Math.max(0, Math.min(1, level));
    this.targetGlowIntensity = this.activityLevel;

    // Update smoke visibility based on activity
    this.updateSmokeVisibility();
  }

  updateSmokeVisibility() {
    // Show smoke particles only when activity is above threshold
    const showSmoke = this.activityLevel > 0.3;
    this.smokeParticles.forEach(smoke => {
      smoke.visible = showSmoke;
    });
  }

  setStats(stats) {
    if (!stats || !this.statsBadge) return;

    const count = stats.activeProjects || 0;

    // Calculate activity level based on project count
    // 0 projects = 0, 1-3 = light, 4-6 = medium, 7+ = heavy
    let activityLevel = 0;
    if (count > 0) {
      if (count <= 3) activityLevel = 0.3;
      else if (count <= 6) activityLevel = 0.6;
      else activityLevel = 1.0;
    }
    this.setActivityLevel(activityLevel);

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
    // Boost glow on hover
    this.targetGlowIntensity = Math.max(this.activityLevel, 0.5);

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
    // Return to activity-based glow
    this.targetGlowIntensity = this.activityLevel;
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

    // Smooth glow transition
    const glowSpeed = 0.1;
    this.glowIntensity += (this.targetGlowIntensity - this.glowIntensity) * glowSpeed;

    // Update glow filter based on intensity
    this.glowFilter.outerStrength = this.glowIntensity * 3;
    this.glowFilter.innerStrength = this.glowIntensity * 1.5;

    // Pulse effect when active
    if (this.activityLevel > 0) {
      const pulse = Math.sin(this.animationTime * 2) * 0.3;
      this.glowFilter.outerStrength += pulse * this.activityLevel;
    }

    // Animate smoke particles
    this.smokeParticles.forEach((smoke, index) => {
      if (!smoke.visible) return;

      const t = (this.animationTime + smoke.timeOffset) % 100;
      const progress = t / 100;

      smoke.y = smoke.baseY - progress * 40;
      smoke.alpha = Math.sin(progress * Math.PI) * 0.5 * this.activityLevel;
      smoke.x = smoke.baseX + Math.sin(progress * 4 + index) * 8;
      smoke.scale.set(0.5 + progress * 1.5);
    });
  }

  setActive(active) {
    this.isActive = active;
    if (!active) {
      this.setActivityLevel(0);
    }
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

    // Clean up filter
    if (this.glowFilter) {
      this.glowFilter.destroy();
    }

    super.destroy(options);
  }
}

export default FactorySprite;
