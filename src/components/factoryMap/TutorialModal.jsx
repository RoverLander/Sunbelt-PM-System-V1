import React, { useState, useEffect } from 'react';
import {
  X,
  Factory,
  Truck,
  MapPin,
  MousePointer2,
  ZoomIn,
  Keyboard,
  Search,
  Filter,
  Map,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

const STORAGE_KEY = 'factoryMap_tutorialSeen';

const tutorialSteps = [
  {
    title: 'Welcome to Factory Network Map',
    icon: Factory,
    content: 'This interactive dashboard shows all Sunbelt manufacturing facilities across the country and tracks active deliveries in real-time.',
    tips: [
      'See all 14 factory locations at a glance',
      'Track deliveries as they move to job sites',
      'Monitor your workload with the PM Health panel'
    ]
  },
  {
    title: 'Navigate the Map',
    icon: MousePointer2,
    content: 'Move around the map easily with mouse or touch controls.',
    tips: [
      'Click and drag to pan around the map',
      'Scroll wheel to zoom in and out',
      'Use the zoom slider on the right side',
      'Click "Reset" to return to the default view'
    ]
  },
  {
    title: 'Factory Locations',
    icon: Factory,
    content: 'Each factory is shown as an isometric building with animated smoke stacks.',
    tips: [
      'Hover over a factory to see stats and active projects',
      'Click a factory to view its details',
      'Orange glow indicates active production',
      'Badges show the number of active projects'
    ]
  },
  {
    title: 'Delivery Tracking',
    icon: Truck,
    content: 'Watch deliveries travel from factories to job sites in real-time.',
    tips: [
      'Animated trucks show active shipments',
      'Hover over a truck to see delivery details',
      'Click a truck to view the project',
      'Confetti celebration when deliveries arrive!'
    ]
  },
  {
    title: 'Job Sites',
    icon: MapPin,
    content: 'Job sites mark where deliveries are heading.',
    tips: [
      'Blue markers show delivery destinations',
      'Hover to see project name and location',
      'Click to navigate to the project details',
      'Routes connect factories to their job sites'
    ]
  },
  {
    title: 'Keyboard Shortcuts',
    icon: Keyboard,
    content: 'Power users can navigate quickly with keyboard shortcuts.',
    tips: [
      'Press 1-9 to jump to specific factories',
      'Use arrow keys to pan the map',
      '+/- keys to zoom in and out',
      'Press R to reset the view'
    ]
  },
  {
    title: 'Search & Filter',
    icon: Search,
    content: 'Find specific projects or filter what you see on the map.',
    tips: [
      'Click the search icon to find projects by name or city',
      'Use filters to show/hide by delivery status',
      'The minimap shows an overview of truck positions'
    ]
  }
];

/**
 * TutorialModal - Welcome tutorial popup for the Factory Network Map
 * Shows on first visit and can be reopened via help button
 */
const TutorialModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset to first step when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">{step.title}</h2>
            </div>
            <button
              onClick={handleSkip}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Close tutorial"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-slate-300 mb-4">{step.content}</p>

          <div className="bg-slate-900/50 rounded-xl p-4">
            <ul className="space-y-2">
              {step.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-orange-400 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-orange-500 w-4'
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {isFirstStep && (
              <button
                onClick={handleSkip}
                className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Skip Tour
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * HelpButton - Floating button to reopen the tutorial
 */
export const HelpButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="p-2 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-600 hover:border-orange-500 hover:bg-slate-700 transition-colors group"
    title="Show tutorial"
  >
    <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-colors" />
  </button>
);

/**
 * Hook to manage tutorial visibility with localStorage persistence
 */
export const useTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Check if user has seen the tutorial before
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setShowTutorial(true);
    }
    setHasLoaded(true);
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const openTutorial = () => {
    setShowTutorial(true);
  };

  return {
    showTutorial,
    hasLoaded,
    closeTutorial,
    openTutorial
  };
};

export default TutorialModal;
