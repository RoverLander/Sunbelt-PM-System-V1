import React from 'react';
import { ArrowLeft, Construction, Code, Zap } from 'lucide-react';

/**
 * FactoryMapFullscreen - UNDER CONSTRUCTION
 * Migrating to standalone vanilla JS + PIXI.js implementation
 */
const FactoryMapFullscreen = ({ onBack }) => {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Back button overlay */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/90 hover:bg-slate-700 backdrop-blur-sm text-white rounded-lg border border-slate-600 hover:border-orange-500 transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>
      </div>

      {/* Under Construction Notice */}
      <div className="flex items-center justify-center h-full">
        <div className="max-w-2xl mx-auto px-8 py-12 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-600 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Construction className="w-20 h-20 text-orange-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 text-center">
            Factory Map: Under Construction
          </h1>

          <p className="text-slate-300 text-lg mb-6 text-center leading-relaxed">
            We're rebuilding the Factory Map with a new architecture for better performance and reliability.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <Code className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">New Architecture</h3>
                <p className="text-slate-300 text-sm">
                  Migrating from React to standalone vanilla JavaScript + PIXI.js for direct canvas control and better event handling.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">Why the Change?</h3>
                <p className="text-slate-300 text-sm">
                  React's synthetic events and lifecycle management were causing conflicts with PIXI.js canvas interactions. The standalone approach eliminates these issues.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-400 text-sm mb-4">
              The Factory Map will return as a standalone experience with full zoom, pan, and interactive features.
            </p>
            <p className="text-slate-500 text-xs">
              Current React implementation preserved in <code className="px-2 py-1 bg-slate-900/50 rounded">src/components/factoryMap/</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactoryMapFullscreen;
