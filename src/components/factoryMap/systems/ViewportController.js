/**
 * ViewportController - Handles pan and zoom for the map canvas
 * Pan works at ANY zoom level with momentum scrolling
 */
export class ViewportController {
  constructor(app, mapContainer, options = {}) {
    this.app = app;
    this.container = mapContainer;

    // Zoom settings
    this.minZoom = options.minZoom || 0.25;
    this.maxZoom = options.maxZoom || 2.0;
    this.zoomStep = options.zoomStep || 0.1;
    // Clamp initial zoom to valid bounds
    const initialZoom = options.initialZoom || 0.6;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, initialZoom));

    // Position (map offset)
    this.position = { x: 0, y: 0 };

    // Drag state
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.lastDragPos = { x: 0, y: 0 };

    // Momentum
    this.momentum = { x: 0, y: 0 };
    this.momentumAnimationId = null;
    this.panAnimationId = null;
    this.friction = 0.92;
    this.minVelocity = 0.5;

    // Map dimensions (will be set after initialization)
    this.mapWidth = options.mapWidth || 4000;
    this.mapHeight = options.mapHeight || 2500;

    // Callbacks
    this.onZoomChange = options.onZoomChange || (() => {});
    this.onViewportChange = options.onViewportChange || (() => {});
    this.onFactoryJump = options.onFactoryJump || (() => {});

    // Factory positions for keyboard shortcuts (will be set externally)
    this.factoryPositions = [];

    // Bind methods
    this.handleWheel = this.handleWheel.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    this.setupEventListeners();
    this.centerMap();
  }

  setupEventListeners() {
    const view = this.app.canvas;

    // Mouse wheel for zoom
    view.addEventListener('wheel', this.handleWheel, { passive: false });

    // Mouse drag for pan - ALWAYS enabled
    view.addEventListener('mousedown', this.handleMouseDown);
    view.addEventListener('mousemove', this.handleMouseMove);
    view.addEventListener('mouseup', this.handleMouseUp);
    view.addEventListener('mouseleave', this.handleMouseUp);

    // Touch support
    view.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    view.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    view.addEventListener('touchend', this.handleTouchEnd);

    // Keyboard controls
    window.addEventListener('keydown', this.handleKeyDown);
  }

  destroy() {
    // Guard against calling destroy before full initialization
    if (!this.app?.canvas) {
      // Still clean up keyboard listener and animations
      window.removeEventListener('keydown', this.handleKeyDown);
      if (this.momentumAnimationId) cancelAnimationFrame(this.momentumAnimationId);
      if (this.panAnimationId) cancelAnimationFrame(this.panAnimationId);
      return;
    }

    const view = this.app.canvas;

    view.removeEventListener('wheel', this.handleWheel);
    view.removeEventListener('mousedown', this.handleMouseDown);
    view.removeEventListener('mousemove', this.handleMouseMove);
    view.removeEventListener('mouseup', this.handleMouseUp);
    view.removeEventListener('mouseleave', this.handleMouseUp);
    view.removeEventListener('touchstart', this.handleTouchStart);
    view.removeEventListener('touchmove', this.handleTouchMove);
    view.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('keydown', this.handleKeyDown);

    if (this.momentumAnimationId) {
      cancelAnimationFrame(this.momentumAnimationId);
    }
    if (this.panAnimationId) {
      cancelAnimationFrame(this.panAnimationId);
    }
  }

  // Center the map in the viewport
  centerMap() {
    const viewWidth = this.app.canvas.width;
    const viewHeight = this.app.canvas.height;

    this.position.x = (viewWidth - this.mapWidth * this.zoom) / 2;
    this.position.y = (viewHeight - this.mapHeight * this.zoom) / 2;

    this.applyTransform();
  }

  // Mouse wheel zoom
  handleWheel(e) {
    e.preventDefault();

    const rect = this.app.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomDelta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + zoomDelta));

    this.zoomAtPoint(newZoom, mouseX, mouseY);
  }

  // Zoom at a specific point (keeps that point stationary)
  zoomAtPoint(newZoom, pivotX, pivotY) {
    if (newZoom === this.zoom) return;
    // Guard against division by zero
    if (this.zoom === 0) return;

    // Get world coordinates of pivot point before zoom
    const worldX = (pivotX - this.position.x) / this.zoom;
    const worldY = (pivotY - this.position.y) / this.zoom;

    // Apply new zoom
    this.zoom = newZoom;

    // Adjust position to keep pivot point stationary
    this.position.x = pivotX - worldX * this.zoom;
    this.position.y = pivotY - worldY * this.zoom;

    this.constrainPosition();
    this.applyTransform();
    this.onZoomChange(this.zoom);
    this.onViewportChange(this.getViewportBounds());
  }

  // Mouse drag handlers
  handleMouseDown(e) {
    // Stop any momentum animation
    if (this.momentumAnimationId) {
      cancelAnimationFrame(this.momentumAnimationId);
      this.momentumAnimationId = null;
    }

    this.isDragging = true;
    this.dragStart = {
      x: e.clientX - this.position.x,
      y: e.clientY - this.position.y
    };
    this.lastDragPos = { x: e.clientX, y: e.clientY };
    this.momentum = { x: 0, y: 0 };

    this.app.canvas.style.cursor = 'grabbing';
  }

  handleMouseMove(e) {
    if (!this.isDragging) {
      // Update cursor based on what's under mouse
      this.app.canvas.style.cursor = 'grab';
      return;
    }

    const newX = e.clientX - this.dragStart.x;
    const newY = e.clientY - this.dragStart.y;

    // Calculate velocity for momentum
    this.momentum.x = e.clientX - this.lastDragPos.x;
    this.momentum.y = e.clientY - this.lastDragPos.y;
    this.lastDragPos = { x: e.clientX, y: e.clientY };

    this.position.x = newX;
    this.position.y = newY;

    this.constrainPosition();
    this.applyTransform();
    this.onViewportChange(this.getViewportBounds());
  }

  handleMouseUp() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.app.canvas.style.cursor = 'grab';

    // Start momentum scrolling if we have velocity
    if (Math.abs(this.momentum.x) > this.minVelocity ||
        Math.abs(this.momentum.y) > this.minVelocity) {
      this.startMomentumScroll();
    }
  }

  // Touch handlers
  handleTouchStart(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }
    // TODO: Handle pinch zoom with two fingers
  }

  handleTouchMove(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }

  handleTouchEnd(e) {
    this.handleMouseUp();
  }

  // Keyboard controls
  handleKeyDown(e) {
    // Don't handle if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const panAmount = 50;

    switch (e.key) {
      case 'ArrowUp':
        this.pan(0, panAmount);
        break;
      case 'ArrowDown':
        this.pan(0, -panAmount);
        break;
      case 'ArrowLeft':
        this.pan(panAmount, 0);
        break;
      case 'ArrowRight':
        this.pan(-panAmount, 0);
        break;
      case '+':
      case '=':
        this.setZoom(this.zoom + this.zoomStep);
        break;
      case '-':
      case '_':
        this.setZoom(this.zoom - this.zoomStep);
        break;
      case '0':
        // Reset view
        this.resetView();
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        // Jump to factory by index
        const index = parseInt(e.key) - 1;
        if (this.factoryPositions[index]) {
          const pos = this.factoryPositions[index];
          this.panTo(pos.x, pos.y, true);
          this.onFactoryJump(pos.code, index);
        }
        break;
      default:
        return; // Don't prevent default for unhandled keys
    }

    e.preventDefault();
  }

  // Set factory positions for keyboard shortcuts
  setFactoryPositions(positions) {
    this.factoryPositions = positions;
  }

  // Momentum scrolling animation
  startMomentumScroll() {
    const animate = () => {
      // Check if velocity is below threshold
      if (Math.abs(this.momentum.x) < this.minVelocity &&
          Math.abs(this.momentum.y) < this.minVelocity) {
        this.momentumAnimationId = null;
        return;
      }

      // Apply momentum
      this.position.x += this.momentum.x;
      this.position.y += this.momentum.y;

      // Apply friction
      this.momentum.x *= this.friction;
      this.momentum.y *= this.friction;

      this.constrainPosition();
      this.applyTransform();
      this.onViewportChange(this.getViewportBounds());

      this.momentumAnimationId = requestAnimationFrame(animate);
    };

    this.momentumAnimationId = requestAnimationFrame(animate);
  }

  // Soft boundary constraints
  constrainPosition() {
    const viewWidth = this.app.canvas.width;
    const viewHeight = this.app.canvas.height;
    const scaledWidth = this.mapWidth * this.zoom;
    const scaledHeight = this.mapHeight * this.zoom;

    // Allow some overscroll but constrain to reasonable bounds
    const margin = 200;

    const minX = viewWidth - scaledWidth - margin;
    const maxX = margin;
    const minY = viewHeight - scaledHeight - margin;
    const maxY = margin;

    // Soft constraint with elastic bounce-back
    if (this.position.x < minX) {
      this.position.x = minX + (this.position.x - minX) * 0.3;
      this.momentum.x *= 0.5;
    } else if (this.position.x > maxX) {
      this.position.x = maxX + (this.position.x - maxX) * 0.3;
      this.momentum.x *= 0.5;
    }

    if (this.position.y < minY) {
      this.position.y = minY + (this.position.y - minY) * 0.3;
      this.momentum.y *= 0.5;
    } else if (this.position.y > maxY) {
      this.position.y = maxY + (this.position.y - maxY) * 0.3;
      this.momentum.y *= 0.5;
    }
  }

  // Apply transform to container
  applyTransform() {
    this.container.scale.set(this.zoom);
    this.container.position.set(this.position.x, this.position.y);
  }

  // Public API methods

  setZoom(level) {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
    const centerX = this.app.canvas.width / 2;
    const centerY = this.app.canvas.height / 2;
    this.zoomAtPoint(newZoom, centerX, centerY);
  }

  pan(deltaX, deltaY) {
    this.position.x += deltaX;
    this.position.y += deltaY;
    this.constrainPosition();
    this.applyTransform();
    this.onViewportChange(this.getViewportBounds());
  }

  panTo(worldX, worldY, animate = true) {
    const viewWidth = this.app.canvas.width;
    const viewHeight = this.app.canvas.height;

    const targetX = (viewWidth / 2) - (worldX * this.zoom);
    const targetY = (viewHeight / 2) - (worldY * this.zoom);

    if (animate) {
      this.animatePanTo(targetX, targetY);
    } else {
      this.position.x = targetX;
      this.position.y = targetY;
      this.constrainPosition();
      this.applyTransform();
      this.onViewportChange(this.getViewportBounds());
    }
  }

  animatePanTo(targetX, targetY, duration = 500) {
    // Cancel any existing pan animation to prevent stacking
    if (this.panAnimationId) {
      cancelAnimationFrame(this.panAnimationId);
      this.panAnimationId = null;
    }

    const startX = this.position.x;
    const startY = this.position.y;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      this.position.x = startX + (targetX - startX) * eased;
      this.position.y = startY + (targetY - startY) * eased;

      this.applyTransform();
      this.onViewportChange(this.getViewportBounds());

      if (progress < 1) {
        this.panAnimationId = requestAnimationFrame(animate);
      } else {
        this.panAnimationId = null;
      }
    };

    this.panAnimationId = requestAnimationFrame(animate);
  }

  resetView() {
    // Cancel any pending animations before resetting
    if (this.momentumAnimationId) {
      cancelAnimationFrame(this.momentumAnimationId);
      this.momentumAnimationId = null;
    }
    if (this.panAnimationId) {
      cancelAnimationFrame(this.panAnimationId);
      this.panAnimationId = null;
    }

    this.zoom = 0.6; // Match initial zoom from PixiMapCanvas
    this.centerMap();
    this.onZoomChange(this.zoom);
    this.onViewportChange(this.getViewportBounds());
  }

  // Get current viewport bounds in world coordinates
  getViewportBounds() {
    const viewWidth = this.app.canvas.width;
    const viewHeight = this.app.canvas.height;

    return {
      left: -this.position.x / this.zoom,
      top: -this.position.y / this.zoom,
      right: (-this.position.x + viewWidth) / this.zoom,
      bottom: (-this.position.y + viewHeight) / this.zoom,
      width: viewWidth / this.zoom,
      height: viewHeight / this.zoom,
      zoom: this.zoom
    };
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.position.x) / this.zoom,
      y: (screenY - this.position.y) / this.zoom
    };
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.zoom + this.position.x,
      y: worldY * this.zoom + this.position.y
    };
  }

  // Get current zoom level
  getZoom() {
    return this.zoom;
  }
}

export default ViewportController;
