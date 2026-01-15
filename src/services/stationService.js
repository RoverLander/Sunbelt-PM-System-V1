// ============================================================================
// stationService.js - Station Templates Service Layer
// ============================================================================
// Manages the 12 production line stages and factory-specific customizations.
//
// Created: January 15, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Get station templates for a factory
 * Falls back to global templates (factory_id = null) if none exist
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getStationTemplates(factoryId = null) {
  try {
    // First try to get factory-specific stations
    if (factoryId) {
      const { data: factoryStations, error: factoryError } = await supabase
        .from('station_templates')
        .select('*')
        .eq('factory_id', factoryId)
        .eq('is_active', true)
        .order('order_num', { ascending: true });

      if (!factoryError && factoryStations && factoryStations.length > 0) {
        return { data: factoryStations, error: null };
      }
    }

    // Fall back to global templates (factory_id is null)
    const { data: globalStations, error: globalError } = await supabase
      .from('station_templates')
      .select('*')
      .is('factory_id', null)
      .eq('is_active', true)
      .order('order_num', { ascending: true });

    if (globalError) throw globalError;
    return { data: globalStations || [], error: null };
  } catch (error) {
    console.error('Error fetching station templates:', error);
    return { data: [], error };
  }
}

/**
 * Get a single station template by ID
 *
 * @param {string} stationId - Station UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getStationById(stationId) {
  try {
    const { data, error } = await supabase
      .from('station_templates')
      .select('*')
      .eq('id', stationId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching station:', error);
    return { data: null, error };
  }
}

/**
 * Get station templates with module counts (how many modules at each station)
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getStationsWithModuleCounts(factoryId) {
  try {
    // Get stations
    const { data: stations, error: stationError } = await getStationTemplates(factoryId);
    if (stationError) throw stationError;

    // Get module counts per station
    const { data: moduleCounts, error: countError } = await supabase
      .from('modules')
      .select('current_station_id, status')
      .eq('factory_id', factoryId)
      .not('status', 'in', '("Completed", "Shipped")');

    if (countError) throw countError;

    // Count modules per station
    const countMap = {};
    (moduleCounts || []).forEach(mod => {
      if (mod.current_station_id) {
        countMap[mod.current_station_id] = (countMap[mod.current_station_id] || 0) + 1;
      }
    });

    // Merge counts with stations
    const stationsWithCounts = stations.map(station => ({
      ...station,
      module_count: countMap[station.id] || 0
    }));

    return { data: stationsWithCounts, error: null };
  } catch (error) {
    console.error('Error fetching stations with counts:', error);
    return { data: [], error };
  }
}

// ============================================================================
// CREATE / UPDATE FUNCTIONS
// ============================================================================

/**
 * Create a custom station for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Object} stationData - Station data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function createCustomStation(factoryId, stationData) {
  try {
    const { data, error } = await supabase
      .from('station_templates')
      .insert({
        factory_id: factoryId,
        name: stationData.name,
        code: stationData.code,
        description: stationData.description,
        order_num: stationData.order_num,
        requires_inspection: stationData.requires_inspection || false,
        is_inspection_station: stationData.is_inspection_station || false,
        duration_defaults: stationData.duration_defaults || { stock: 4.0, fleet: 4.0, government: 6.0, custom: 8.0 },
        checklist: stationData.checklist || [],
        min_crew_size: stationData.min_crew_size || 1,
        max_crew_size: stationData.max_crew_size || 10,
        recommended_crew_size: stationData.recommended_crew_size || 3,
        color: stationData.color || '#6366f1',
        icon: stationData.icon,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating station:', error);
    return { data: null, error };
  }
}

/**
 * Update a station template
 *
 * @param {string} stationId - Station UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateStationTemplate(stationId, updates) {
  try {
    const { data, error } = await supabase
      .from('station_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', stationId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating station:', error);
    return { data: null, error };
  }
}

/**
 * Reorder stations for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Array} stationOrder - Array of {id, order_num} objects
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function reorderStations(factoryId, stationOrder) {
  try {
    // Update each station's order_num
    const updates = stationOrder.map(({ id, order_num }) =>
      supabase
        .from('station_templates')
        .update({ order_num })
        .eq('id', id)
    );

    await Promise.all(updates);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error reordering stations:', error);
    return { success: false, error };
  }
}

/**
 * Deactivate a station (soft delete)
 *
 * @param {string} stationId - Station UUID
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function deactivateStation(stationId) {
  try {
    const { error } = await supabase
      .from('station_templates')
      .update({ is_active: false })
      .eq('id', stationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deactivating station:', error);
    return { success: false, error };
  }
}

// ============================================================================
// CHECKLIST FUNCTIONS
// ============================================================================

/**
 * Get QC checklist for a station
 *
 * @param {string} stationId - Station UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getStationChecklist(stationId) {
  try {
    const { data, error } = await supabase
      .from('station_templates')
      .select('checklist')
      .eq('id', stationId)
      .single();

    if (error) throw error;
    return { data: data?.checklist || [], error: null };
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return { data: [], error };
  }
}

/**
 * Update QC checklist for a station
 *
 * @param {string} stationId - Station UUID
 * @param {Array} checklist - Array of checklist items
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function updateStationChecklist(stationId, checklist) {
  try {
    const { error } = await supabase
      .from('station_templates')
      .update({ checklist })
      .eq('id', stationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating checklist:', error);
    return { success: false, error };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get expected duration for a station based on building category
 *
 * @param {Object} station - Station template object
 * @param {string} buildingCategory - Building category (stock, fleet, government, custom)
 * @returns {number} Expected hours
 */
export function getExpectedDuration(station, buildingCategory = 'stock') {
  const defaults = station.duration_defaults || {};
  return defaults[buildingCategory.toLowerCase()] || defaults.stock || 4.0;
}

/**
 * Calculate queue status color based on module count
 *
 * @param {number} moduleCount - Number of modules waiting
 * @param {number} maxWip - Maximum work-in-progress threshold (default 3)
 * @returns {string} Color code
 */
export function getQueueStatusColor(moduleCount, maxWip = 3) {
  if (moduleCount === 0) return '#64748b'; // gray - empty
  if (moduleCount <= maxWip) return '#eab308'; // yellow - waiting
  if (moduleCount <= maxWip * 2) return '#f97316'; // orange - backlogged
  return '#ef4444'; // red - jammed
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  getStationTemplates,
  getStationById,
  getStationsWithModuleCounts,
  createCustomStation,
  updateStationTemplate,
  reorderStations,
  deactivateStation,
  getStationChecklist,
  updateStationChecklist,
  getExpectedDuration,
  getQueueStatusColor
};
