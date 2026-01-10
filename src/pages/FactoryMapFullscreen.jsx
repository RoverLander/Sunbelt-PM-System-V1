import React from 'react';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import FactoryMapPage from './FactoryMapPage';

/**
 * FactoryMapFullscreen - Fullscreen wrapper for Factory Map
 * Renders the map without sidebar for maximum screen real estate
 */
const FactoryMapFullscreen = ({ onBack, onNavigateToProject }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      {/* Back button overlay */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/90 hover:bg-slate-700 backdrop-blur-sm text-white rounded-lg border border-slate-600 hover:border-orange-500 transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Exit Fullscreen</span>
        </button>
      </div>

      {/* Fullscreen map */}
      <div className="w-full h-full">
        <FactoryMapPage
          onNavigateToProject={onNavigateToProject}
          isFullscreen={true}
        />
      </div>
    </div>
  );
};

export default FactoryMapFullscreen;
