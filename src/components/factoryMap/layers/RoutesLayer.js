import * as PIXI from 'pixi.js';

/**
 * RoutesLayer - Renders delivery routes as curved paths
 * Uses bezier curves with animated dashed lines for active deliveries
 */
export class RoutesLayer extends PIXI.Container {
  constructor(mapDimensions) {
    super();

    this.name = 'routesLayer';
    this.mapWidth = mapDimensions.width;
    this.mapHeight = mapDimensions.height;
    this.routes = new Map();
    this.animationTime = 0;
  }

  // Create a route between factory and destination
  createRoute(routeId, fromPos, toPos, options = {}) {
    const {
      status = 'active',
      color = 0xf97316,
      animated = true
    } = options;

    // Calculate control point for nice arc
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = Math.min(fromPos.y, toPos.y) - 80; // Arc upward

    const routeData = {
      id: routeId,
      from: fromPos,
      to: toPos,
      controlPoint: { x: midX, y: midY },
      status,
      color,
      animated,
      dashOffset: 0
    };

    // Create graphics for route
    const routeGraphics = new PIXI.Graphics();
    this.drawRoute(routeGraphics, routeData);

    routeData.graphics = routeGraphics;
    this.routes.set(routeId, routeData);
    this.addChild(routeGraphics);

    return routeData;
  }

  drawRoute(graphics, routeData) {
    const { from, to, controlPoint, status, color } = routeData;

    graphics.clear();

    // Draw path shadow first
    graphics.lineStyle(4, 0x000000, 0.2);
    graphics.moveTo(from.x, from.y + 2);
    graphics.quadraticCurveTo(controlPoint.x, controlPoint.y + 2, to.x, to.y + 2);

    // Main route line
    if (status === 'active') {
      // Dashed animated line for active deliveries
      this.drawDashedCurve(graphics, from, controlPoint, to, {
        color,
        width: 3,
        dashLength: 12,
        gapLength: 8,
        offset: routeData.dashOffset
      });
    } else if (status === 'completed') {
      // Solid faded line for completed
      graphics.lineStyle(2, color, 0.3);
      graphics.moveTo(from.x, from.y);
      graphics.quadraticCurveTo(controlPoint.x, controlPoint.y, to.x, to.y);
    } else {
      // Dotted line for scheduled
      this.drawDashedCurve(graphics, from, controlPoint, to, {
        color: 0x6b7280,
        width: 2,
        dashLength: 4,
        gapLength: 8,
        offset: 0
      });
    }

    // Origin marker (small circle at factory)
    graphics.beginFill(color, 0.8);
    graphics.drawCircle(from.x, from.y, 5);
    graphics.endFill();

    // Destination marker
    graphics.beginFill(color, 0.8);
    graphics.drawCircle(to.x, to.y, 5);
    graphics.endFill();
  }

  // Draw dashed bezier curve
  drawDashedCurve(graphics, from, control, to, options) {
    const { color, width, dashLength, gapLength, offset } = options;

    // Sample points along curve
    const segments = 50;
    const points = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * control.x + t * t * to.x;
      const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * control.y + t * t * to.y;
      points.push({ x, y });
    }

    // Calculate total length
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Draw dashes
    const dashCycle = dashLength + gapLength;
    let currentLength = offset % dashCycle;
    let drawing = currentLength < dashLength;
    let segmentStart = 0;

    graphics.lineStyle(width, color, 0.9);

    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      // Skip zero-length segments
      if (segmentLength < 0.001) continue;

      let remaining = segmentLength;
      let startPoint = points[i - 1];

      while (remaining > 0) {
        const distToNext = drawing
          ? dashLength - (currentLength % dashCycle)
          : gapLength - ((currentLength - dashLength) % dashCycle);

        const dist = Math.min(remaining, distToNext);
        const t = dist / segmentLength;

        const endX = startPoint.x + (points[i].x - points[i - 1].x) * t;
        const endY = startPoint.y + (points[i].y - points[i - 1].y) * t;

        if (drawing) {
          graphics.moveTo(startPoint.x, startPoint.y);
          graphics.lineTo(endX, endY);
        }

        currentLength += dist;
        if (currentLength >= dashCycle) {
          currentLength = currentLength % dashCycle;
        }
        drawing = currentLength < dashLength;

        remaining -= dist;
        startPoint = { x: endX, y: endY };
      }
    }
  }

  // Update route (e.g., status change)
  updateRoute(routeId, updates) {
    const route = this.routes.get(routeId);
    if (!route) return;

    Object.assign(route, updates);
    this.drawRoute(route.graphics, route);
  }

  // Remove route
  removeRoute(routeId) {
    const route = this.routes.get(routeId);
    if (route) {
      this.removeChild(route.graphics);
      route.graphics.destroy();
      this.routes.delete(routeId);
    }
  }

  // Animation update
  update(deltaTime) {
    this.animationTime += deltaTime;

    // Animate active routes
    this.routes.forEach(route => {
      if (route.animated && route.status === 'active') {
        route.dashOffset += deltaTime * 0.5;
        this.drawRoute(route.graphics, route);
      }
    });
  }

  // Clear all routes
  clear() {
    this.routes.forEach(route => {
      this.removeChild(route.graphics);
      route.graphics.destroy();
    });
    this.routes.clear();
  }

  // Get route path for truck positioning
  getRoutePath(routeId) {
    const route = this.routes.get(routeId);
    if (!route) return null;

    return {
      from: route.from,
      to: route.to,
      controlPoint: route.controlPoint
    };
  }
}

export default RoutesLayer;
