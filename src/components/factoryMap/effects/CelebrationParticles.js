import * as PIXI from 'pixi.js';

/**
 * CelebrationParticles - Confetti burst effect for delivery arrivals
 * Creates colorful particles that burst outward and fall with gravity
 */
export class CelebrationParticles extends PIXI.Container {
  constructor() {
    super();

    this.name = 'celebrationParticles';
    this.particleSystems = [];

    // Sunbelt-themed colors
    this.colors = [
      0xf97316, // Orange (primary)
      0xfbbf24, // Amber
      0x22c55e, // Green (success)
      0x3b82f6, // Blue
      0xffffff, // White
      0xfcd34d, // Yellow
    ];
  }

  /**
   * Trigger a celebration burst at the given position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {object} options - Optional configuration
   */
  celebrate(x, y, options = {}) {
    const {
      particleCount = 30,
      spread = 150,
      duration = 2000,
      gravity = 0.15,
      initialVelocity = 8
    } = options;

    const system = {
      particles: [],
      startTime: Date.now(),
      duration,
      graphics: new PIXI.Graphics()
    };

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const velocity = initialVelocity * (0.5 + Math.random() * 0.5);

      system.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity * (0.5 + Math.random()),
        vy: Math.sin(angle) * velocity - Math.random() * 3, // Bias upward
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        size: 3 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        gravity,
        alpha: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }

    this.addChild(system.graphics);
    this.particleSystems.push(system);
  }

  /**
   * Update all particle systems - called every frame
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    const now = Date.now();
    const toRemove = [];

    this.particleSystems.forEach((system, index) => {
      const elapsed = now - system.startTime;
      const progress = elapsed / system.duration;

      if (progress >= 1) {
        toRemove.push(index);
        return;
      }

      // Clear and redraw
      system.graphics.clear();

      system.particles.forEach(p => {
        // Physics update
        p.x += p.vx * deltaTime * 0.1;
        p.y += p.vy * deltaTime * 0.1;
        p.vy += p.gravity * deltaTime * 0.1; // Gravity
        p.vx *= 0.99; // Air resistance
        p.rotation += p.rotationSpeed * deltaTime * 0.1;

        // Fade out in last 30%
        if (progress > 0.7) {
          p.alpha = 1 - ((progress - 0.7) / 0.3);
        }

        // Draw particle
        system.graphics.beginFill(p.color, p.alpha);

        if (p.shape === 'rect') {
          // Rotated rectangle (confetti)
          const cos = Math.cos(p.rotation);
          const sin = Math.sin(p.rotation);
          const hw = p.size * 0.8;
          const hh = p.size * 0.4;

          system.graphics.moveTo(
            p.x + cos * hw - sin * hh,
            p.y + sin * hw + cos * hh
          );
          system.graphics.lineTo(
            p.x - cos * hw - sin * hh,
            p.y - sin * hw + cos * hh
          );
          system.graphics.lineTo(
            p.x - cos * hw + sin * hh,
            p.y - sin * hw - cos * hh
          );
          system.graphics.lineTo(
            p.x + cos * hw + sin * hh,
            p.y + sin * hw - cos * hh
          );
          system.graphics.closePath();
        } else {
          // Circle
          system.graphics.drawCircle(p.x, p.y, p.size * 0.5);
        }

        system.graphics.endFill();
      });
    });

    // Remove completed systems (in reverse order)
    toRemove.reverse().forEach(index => {
      const system = this.particleSystems[index];
      this.removeChild(system.graphics);
      system.graphics.destroy();
      this.particleSystems.splice(index, 1);
    });
  }

  /**
   * Clear all active particle systems
   */
  clear() {
    this.particleSystems.forEach(system => {
      this.removeChild(system.graphics);
      system.graphics.destroy();
    });
    this.particleSystems = [];
  }

  /**
   * Check if any celebrations are active
   */
  isActive() {
    return this.particleSystems.length > 0;
  }

  /**
   * Clean up all resources
   */
  destroy(options) {
    this.clear();
    super.destroy(options);
  }
}

export default CelebrationParticles;
