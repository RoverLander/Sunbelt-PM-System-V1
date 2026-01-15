// ============================================================================
// CalendarSimContext.jsx - Calendar Simulation State Management
// ============================================================================
// Provides state management for simulation mode in the production calendar.
// Allows "what-if" editing without persisting to the database until published.
//
// Created: January 15, 2026
// ============================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

// ============================================================================
// CONTEXT
// ============================================================================

const CalendarSimContext = createContext(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function CalendarSimProvider({ children, factoryId, userId }) {
  // Simulation mode state
  const [isSimMode, setIsSimMode] = useState(false);
  const [simulatedChanges, setSimulatedChanges] = useState({});
  const [publishing, setPublishing] = useState(false);

  // Toggle simulation mode
  const toggleSimMode = useCallback(() => {
    if (isSimMode) {
      // Exiting sim mode - warn if there are unsaved changes
      if (Object.keys(simulatedChanges).length > 0) {
        if (!window.confirm('You have unsaved simulation changes. Discard them?')) {
          return;
        }
        setSimulatedChanges({});
      }
    }
    setIsSimMode(!isSimMode);
  }, [isSimMode, simulatedChanges]);

  // Add a simulated change
  const addSimulatedChange = useCallback((moduleId, newDate) => {
    setSimulatedChanges(prev => ({
      ...prev,
      [moduleId]: newDate
    }));
  }, []);

  // Remove a simulated change
  const removeSimulatedChange = useCallback((moduleId) => {
    setSimulatedChanges(prev => {
      const next = { ...prev };
      delete next[moduleId];
      return next;
    });
  }, []);

  // Discard all simulated changes
  const discardChanges = useCallback(() => {
    if (Object.keys(simulatedChanges).length > 0) {
      if (window.confirm('Discard all simulation changes?')) {
        setSimulatedChanges({});
      }
    }
  }, [simulatedChanges]);

  // Publish all simulated changes to the database
  const publishChanges = useCallback(async () => {
    const changes = Object.entries(simulatedChanges);
    if (changes.length === 0) return { success: true };

    setPublishing(true);

    try {
      // Update each module's scheduled_start
      const updates = changes.map(([moduleId, newDate]) =>
        supabase
          .from('modules')
          .update({
            scheduled_start: newDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', moduleId)
      );

      const results = await Promise.all(updates);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} module(s)`);
      }

      // Create audit log entry
      await supabase.from('calendar_audit').insert({
        factory_id: factoryId,
        user_id: userId,
        action: 'sim_publish',
        entity_type: 'batch',
        new_data: {
          changes_count: changes.length,
          modules: changes.map(([id, date]) => ({ id, scheduled_start: date }))
        },
        from_simulation: true,
        notes: `Published ${changes.length} schedule change(s) from simulation mode`
      });

      // Clear simulation state
      setSimulatedChanges({});
      setIsSimMode(false);

      return { success: true, count: changes.length };
    } catch (error) {
      console.error('Error publishing simulation changes:', error);
      return { success: false, error: error.message };
    } finally {
      setPublishing(false);
    }
  }, [simulatedChanges, factoryId, userId]);

  // Context value
  const value = {
    // State
    isSimMode,
    simulatedChanges,
    publishing,
    changeCount: Object.keys(simulatedChanges).length,

    // Actions
    toggleSimMode,
    addSimulatedChange,
    removeSimulatedChange,
    discardChanges,
    publishChanges
  };

  return (
    <CalendarSimContext.Provider value={value}>
      {children}
    </CalendarSimContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCalendarSim() {
  const context = useContext(CalendarSimContext);
  if (!context) {
    throw new Error('useCalendarSim must be used within a CalendarSimProvider');
  }
  return context;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default CalendarSimContext;
