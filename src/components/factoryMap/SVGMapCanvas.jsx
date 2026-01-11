import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FACTORY_LOCATIONS } from './data/factoryLocations';

/**
 * SVGMapCanvas - SVG-based factory map that works in any environment
 * Fallback for when PIXI/WebGL doesn't work (like WebContainer)
 */
const SVGMapCanvas = ({
  onZoomChange,
  onViewportChange,
  onFactoryHover,
  onFactoryClick,
  onFactoryHoverEnd,
  factoryStats = {},
  projects = [],
  deliveries = [],
  highlightedFactory = null
}) => {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredFactory, setHoveredFactory] = useState(null);

  // Map dimensions
  const MAP_WIDTH = 1000;
  const MAP_HEIGHT = 625;

  // Handle zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * delta));
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [zoom, onZoomChange]);

  // Handle pan
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.factory-marker')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Factory hover handlers
  const handleFactoryMouseEnter = useCallback((code, e) => {
    const factory = FACTORY_LOCATIONS[code];
    setHoveredFactory(code);

    const rect = e.currentTarget.getBoundingClientRect();
    onFactoryHover?.({
      factoryData: { code, ...factory },
      stats: factoryStats[code] || {},
      screenX: rect.left + rect.width / 2,
      screenY: rect.top
    });
  }, [factoryStats, onFactoryHover]);

  const handleFactoryMouseLeave = useCallback(() => {
    setHoveredFactory(null);
    onFactoryHoverEnd?.();
  }, [onFactoryHoverEnd]);

  const handleFactoryClick = useCallback((code) => {
    const factory = FACTORY_LOCATIONS[code];
    onFactoryClick?.({
      factoryData: { code, ...factory },
      stats: factoryStats[code] || {}
    });
  }, [factoryStats, onFactoryClick]);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Expose methods
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.setZoom = (z) => setZoom(z);
      containerRef.current.resetView = resetView;
      containerRef.current.panToFactory = (code) => {
        const factory = FACTORY_LOCATIONS[code];
        if (factory) {
          setPan({
            x: -(factory.x / 100 * MAP_WIDTH - MAP_WIDTH / 2) * zoom,
            y: -(factory.y / 100 * MAP_HEIGHT - MAP_HEIGHT / 2) * zoom
          });
          setZoom(1.5);
        }
      };
      containerRef.current.getTruckPositions = () => [];
    }
  }, [zoom, resetView]);

  // Simplified US outline path (focusing on southern states where Sunbelt operates)
  const usOutlinePath = `
    M 50,50
    L 180,50 L 250,80 L 450,60 L 550,100 L 700,150 L 780,250
    L 950,250 L 950,350 L 880,500 L 820,600
    L 850,720 L 800,850 L 750,780
    L 550,750 L 420,800 L 300,780 L 280,650
    L 80,650 L 30,450 L 50,150 Z
  `;

  // Texas outline (simplified)
  const texasPath = `
    M 280,480 L 320,450 L 380,460 L 420,500 L 450,480
    L 480,520 L 500,600 L 450,680 L 380,720 L 320,700
    L 280,650 L 260,580 L 280,520 Z
  `;

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-900 overflow-hidden cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center'
        }}
      >
        {/* Background */}
        <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="#0d1929" />

        {/* US Map Outline */}
        <path
          d={usOutlinePath}
          fill="#1a2a3a"
          stroke="#3a4a5a"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Texas highlight */}
        <path
          d={texasPath}
          fill="#1e3a4a"
          stroke="#4a6a7a"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Grid lines */}
        {[...Array(11)].map((_, i) => (
          <React.Fragment key={`grid-${i}`}>
            <line
              x1={i * 100}
              y1="0"
              x2={i * 100}
              y2={MAP_HEIGHT}
              stroke="#2a3a4a"
              strokeWidth="0.5"
              opacity="0.3"
            />
            <line
              x1="0"
              y1={i * 62.5}
              x2={MAP_WIDTH}
              y2={i * 62.5}
              stroke="#2a3a4a"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </React.Fragment>
        ))}

        {/* Delivery routes */}
        {deliveries.map(delivery => {
          const factoryCode = delivery.factory?.split(' - ')[0];
          const factory = FACTORY_LOCATIONS[factoryCode];
          if (!factory) return null;

          // Simple line to approximate delivery location
          const fromX = factory.x / 100 * MAP_WIDTH;
          const fromY = factory.y / 100 * MAP_HEIGHT;

          return (
            <g key={delivery.id}>
              <line
                x1={fromX}
                y1={fromY}
                x2={fromX + (Math.random() - 0.5) * 200}
                y2={fromY + (Math.random() - 0.5) * 100}
                stroke="#f97316"
                strokeWidth="2"
                strokeDasharray="8,4"
                opacity="0.6"
              />
            </g>
          );
        })}

        {/* Factory markers */}
        {Object.entries(FACTORY_LOCATIONS).map(([code, factory]) => {
          const x = factory.x / 100 * MAP_WIDTH;
          const y = factory.y / 100 * MAP_HEIGHT;
          const stats = factoryStats[code] || {};
          const isHighlighted = highlightedFactory === code;
          const isHovered = hoveredFactory === code;
          const hasProjects = (stats.activeProjects || 0) > 0;

          return (
            <g
              key={code}
              className="factory-marker cursor-pointer"
              transform={`translate(${x}, ${y})`}
              onMouseEnter={(e) => handleFactoryMouseEnter(code, e)}
              onMouseLeave={handleFactoryMouseLeave}
              onClick={() => handleFactoryClick(code)}
            >
              {/* Glow effect for active factories */}
              {hasProjects && (
                <circle
                  r="30"
                  fill="#f97316"
                  opacity="0.2"
                  className="animate-pulse"
                />
              )}

              {/* Building base */}
              <rect
                x="-20"
                y="-15"
                width="40"
                height="30"
                fill={isHovered ? '#4a5a6a' : '#3a4a5a'}
                stroke={isHighlighted ? '#f97316' : '#5a6a7a'}
                strokeWidth={isHighlighted ? 3 : 1}
                rx="2"
              />

              {/* Roof */}
              <polygon
                points="-22,-15 0,-28 22,-15"
                fill={isHovered ? '#5a6a7a' : '#4a5a6a'}
                stroke={isHighlighted ? '#f97316' : '#6a7a8a'}
                strokeWidth="1"
              />

              {/* Smokestack */}
              <rect x="-15" y="-35" width="6" height="12" fill="#5a6a7a" />
              <rect x="8" y="-32" width="5" height="10" fill="#5a6a7a" />

              {/* Windows - orange when active */}
              <rect x="-14" y="-8" width="8" height="6" fill={hasProjects ? '#f97316' : '#4a5a6a'} />
              <rect x="-2" y="-8" width="8" height="6" fill={hasProjects ? '#f97316' : '#4a5a6a'} />
              <rect x="-14" y="2" width="8" height="6" fill={hasProjects ? '#f97316' : '#4a5a6a'} />
              <rect x="-2" y="2" width="8" height="6" fill={hasProjects ? '#f97316' : '#4a5a6a'} />

              {/* Door */}
              <rect x="-4" y="8" width="8" height="7" fill="#2a3a4a" />

              {/* Orange accent stripe */}
              <rect x="-20" y="-16" width="40" height="3" fill="#f97316" />

              {/* Label background */}
              <rect
                x="-18"
                y="20"
                width="36"
                height="14"
                rx="7"
                fill="#1a1a2e"
                stroke="#f97316"
                strokeWidth="1"
                opacity="0.9"
              />

              {/* Label text */}
              <text
                x="0"
                y="30"
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {code}
              </text>

              {/* Stats badge */}
              {stats.activeProjects > 0 && (
                <g transform="translate(22, -25)">
                  <circle
                    r="10"
                    fill={stats.activeProjects > 10 ? '#f59e0b' : stats.activeProjects > 5 ? '#84cc16' : '#22c55e'}
                    stroke="#1a1a2e"
                    strokeWidth="2"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {stats.activeProjects > 99 ? '99+' : stats.activeProjects}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 bg-slate-800/80 px-3 py-1 rounded text-xs text-slate-400 font-mono">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default SVGMapCanvas;
