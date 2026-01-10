import React from 'react';
import { Minus, Plus, Home, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import { FACTORY_LOCATIONS } from './data/factoryLocations';

/**
 * MapControls - Zoom controls and factory navigation
 */
const MapControls = ({
  currentZoom,
  onZoomChange,
  onReset,
  onFindFactory
}) => {
  const zoomPercentage = Math.round(currentZoom * 100);

  const handleZoomIn = () => {
    onZoomChange(Math.min(currentZoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(currentZoom - 0.1, 0.25));
  };

  const handleSliderChange = (e) => {
    onZoomChange(parseFloat(e.target.value));
  };

  return (
    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
      {/* Zoom controls */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-3 shadow-lg border border-slate-700">
        <button
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-300 hover:text-white"
          title="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
          type="range"
          min="0.25"
          max="2"
          step="0.05"
          value={currentZoom}
          onChange={handleSliderChange}
          className="w-24 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />

        <button
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-300 hover:text-white"
          title="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>

        <span className="text-sm font-mono text-slate-300 w-12 text-center">
          {zoomPercentage}%
        </span>
      </div>

      {/* Quick actions */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg px-2 py-2 flex items-center gap-1 shadow-lg border border-slate-700">
        <button
          onClick={onReset}
          className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-300 hover:text-white flex items-center gap-1.5"
          title="Reset view"
        >
          <Home className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Reset</span>
        </button>

        {/* Factory dropdown */}
        <div className="relative">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onFindFactory(e.target.value);
                e.target.value = ''; // Reset selection
              }
            }}
            className="appearance-none bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md pl-7 pr-3 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500 border border-slate-600"
            defaultValue=""
          >
            <option value="" disabled>Find Factory</option>
            {Object.entries(FACTORY_LOCATIONS).map(([code, data]) => (
              <option key={code} value={code}>
                {code} - {data.state}
              </option>
            ))}
          </select>
          <Navigation className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default MapControls;
