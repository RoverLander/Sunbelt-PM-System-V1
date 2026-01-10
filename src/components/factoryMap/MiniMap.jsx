import React from 'react';
import { FACTORY_LOCATIONS } from './data/factoryLocations';

// Map dimensions for coordinate conversion (must match PixiMapCanvas)
const MAP_WIDTH = 4000;
const MAP_HEIGHT = 2500;

/**
 * MiniMap - Small overview map showing current viewport, factory locations, and truck positions
 */
const MiniMap = ({ viewport, onNavigate, truckPositions = [] }) => {
  // Calculate viewport rectangle position (normalized 0-100 for SVG viewBox)
  const viewportRect = viewport ? {
    left: (viewport.left / MAP_WIDTH) * 100,
    top: (viewport.top / MAP_HEIGHT) * 100,
    width: (viewport.width / MAP_WIDTH) * 100,
    height: (viewport.height / MAP_HEIGHT) * 100
  } : { left: 0, top: 0, width: 100, height: 100 };

  // Clamp values to prevent NaN or Infinity
  const clamp = (val, min, max) => {
    if (!Number.isFinite(val)) return min;
    return Math.max(min, Math.min(max, val));
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * MAP_HEIGHT;
    onNavigate?.(x, y);
  };

  return (
    <div className="absolute bottom-4 right-4 z-20">
      <div
        className="w-44 h-28 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-600 shadow-lg overflow-hidden cursor-crosshair"
        onClick={handleClick}
      >
        {/* Simplified US map shape */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Background */}
          <rect x="0" y="0" width="100" height="100" fill="#0d1929" />

          {/* Simplified US outline */}
          <path
            d="M5,5 L18,5 L25,8 L45,6 L55,10 L70,15 L78,25 L95,25 L95,35 L88,50 L82,60 L85,82 L75,78 L55,75 L42,80 L30,78 L28,65 L8,65 L3,45 L5,15 Z"
            fill="#1a2a3a"
            stroke="#3a4a5a"
            strokeWidth="0.5"
          />

          {/* Factory dots */}
          {Object.entries(FACTORY_LOCATIONS).map(([code, loc]) => (
            <circle
              key={code}
              cx={loc.x}
              cy={loc.y}
              r="2"
              fill="#f97316"
              className="hover:fill-orange-300"
            >
              <title>{code}</title>
            </circle>
          ))}

          {/* Truck dots (animated) - filter out invalid positions */}
          {truckPositions
            .filter(truck => Number.isFinite(truck.x) && Number.isFinite(truck.y))
            .map((truck) => (
              <circle
                key={truck.id}
                cx={(truck.x / MAP_WIDTH) * 100}
                cy={(truck.y / MAP_HEIGHT) * 100}
                r="1.5"
                fill="#fbbf24"
                className="animate-pulse"
              >
                <title>{truck.data?.projectName || 'Delivery'}</title>
              </circle>
            ))}

          {/* Current viewport rectangle */}
          <rect
            x={clamp(viewportRect.left, 0, 100 - viewportRect.width)}
            y={clamp(viewportRect.top, 0, 100 - viewportRect.height)}
            width={Math.min(viewportRect.width, 100)}
            height={Math.min(viewportRect.height, 100)}
            fill="rgba(249, 115, 22, 0.2)"
            stroke="#f97316"
            strokeWidth="1"
            rx="1"
          />
        </svg>

        {/* Label */}
        <div className="absolute bottom-1 left-2 text-[10px] text-slate-500 font-mono">
          {Math.round(viewport?.zoom * 100 || 100)}%
        </div>
      </div>
    </div>
  );
};

export default MiniMap;
