// ============================================================================
// modulesService.js - Modules Service Layer
// ============================================================================
// Manages individual modules within projects for factory production tracking.
// Each project consists of X modules that flow through the 12 production stages.
//
// Created: January 15, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Get a single module by ID
 *
 * @param {string} moduleId - Module UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getModuleById(moduleId) {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select(`
        *,
        project:projects(id, name, project_number, factory, building_type),
        current_station:station_templates(id, name, code, color)
      `)
      .eq('id', moduleId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching module:', error);
    return { data: null, error };
  }
}

/**
 * Get all modules for a project
 *
 * @param {string} projectId - Project UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getModulesByProject(projectId) {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select(`
        *,
        current_station:station_templates(id, name, code, color)
      `)
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching modules:', error);
    return { data: [], error };
  }
}

/**
 * Get all modules for a factory (for production line view)
 *
 * @param {string} factoryId - Factory UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getModulesByFactory(factoryId, filters = {}) {
  try {
    let query = supabase
      .from('modules')
      .select(`
        *,
        project:projects(id, name, project_number, building_type, delivery_date),
        current_station:station_templates(id, name, code, color, order_num)
      `)
      .eq('factory_id', factoryId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.excludeCompleted !== false) {
      query = query.not('status', 'in', '("Completed", "Shipped")');
    }
    if (filters.stationId) {
      query = query.eq('current_station_id', filters.stationId);
    }
    if (filters.isRush) {
      query = query.eq('is_rush', true);
    }

    query = query.order('scheduled_start', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching factory modules:', error);
    return { data: [], error };
  }
}

/**
 * Get modules scheduled for a date range (for calendar)
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getScheduledModules(factoryId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select(`
        *,
        project:projects(id, name, project_number, building_type),
        current_station:station_templates(id, name, code, color)
      `)
      .eq('factory_id', factoryId)
      .gte('scheduled_start', startDate.toISOString().split('T')[0])
      .lte('scheduled_end', endDate.toISOString().split('T')[0])
      .order('scheduled_start', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching scheduled modules:', error);
    return { data: [], error };
  }
}

/**
 * Get modules at a specific station
 *
 * @param {string} stationId - Station UUID
 * @param {string} factoryId - Factory UUID (optional, for filtering)
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getModulesAtStation(stationId, factoryId = null) {
  try {
    let query = supabase
      .from('modules')
      .select(`
        *,
        project:projects(id, name, project_number, building_type, delivery_date)
      `)
      .eq('current_station_id', stationId)
      .not('status', 'in', '("Completed", "Shipped")');

    if (factoryId) {
      query = query.eq('factory_id', factoryId);
    }

    query = query.order('actual_start', { ascending: true, nullsFirst: true });

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching modules at station:', error);
    return { data: [], error };
  }
}

// ============================================================================
// CREATE FUNCTIONS
// ============================================================================

/**
 * Generate serial number for a module
 *
 * @param {string} projectNumber - Project number (e.g., 'NWBS-25250')
 * @param {number} sequenceNumber - Module sequence (1, 2, 3...)
 * @returns {string} Serial number (e.g., 'NWBS-25250-M1')
 */
export function generateModuleSerial(projectNumber, sequenceNumber) {
  return `${projectNumber}-M${sequenceNumber}`;
}

/**
 * Create a new module
 *
 * @param {string} projectId - Project UUID
 * @param {Object} moduleData - Module data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function createModule(projectId, moduleData) {
  try {
    // Get project info for serial generation
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_number, factory, building_type, module_count')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // Get factory_id from factory code
    const { data: factory } = await supabase
      .from('factories')
      .select('id')
      .eq('code', project.factory)
      .single();

    // Get next sequence number
    const { data: existingModules } = await supabase
      .from('modules')
      .select('sequence_number')
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: false })
      .limit(1);

    const nextSequence = (existingModules?.[0]?.sequence_number || 0) + 1;
    const serialNumber = generateModuleSerial(project.project_number, nextSequence);

    const { data, error } = await supabase
      .from('modules')
      .insert({
        project_id: projectId,
        factory_id: factory?.id,
        serial_number: serialNumber,
        name: moduleData.name || `Module ${nextSequence}`,
        sequence_number: nextSequence,
        status: 'Not Started',
        module_width: moduleData.module_width,
        module_length: moduleData.module_length,
        module_height: moduleData.module_height,
        building_category: project.building_type?.toLowerCase() || 'stock',
        is_rush: moduleData.is_rush || false,
        special_requirements: moduleData.special_requirements || [],
        notes: moduleData.notes,
        scheduled_start: moduleData.scheduled_start,
        scheduled_end: moduleData.scheduled_end
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating module:', error);
    return { data: null, error };
  }
}

/**
 * Create all modules for a project based on module_count
 *
 * @param {string} projectId - Project UUID
 * @param {number} moduleCount - Number of modules to create
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function createModulesForProject(projectId, moduleCount = 1) {
  try {
    const modules = [];
    for (let i = 0; i < moduleCount; i++) {
      const { data, error } = await createModule(projectId, {
        name: `Module ${i + 1}`
      });
      if (error) throw error;
      modules.push(data);
    }
    return { data: modules, error: null };
  } catch (error) {
    console.error('Error creating modules for project:', error);
    return { data: [], error };
  }
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Update a module
 *
 * @param {string} moduleId - Module UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateModule(moduleId, updates) {
  try {
    const { data, error } = await supabase
      .from('modules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating module:', error);
    return { data: null, error };
  }
}

/**
 * Update module status
 *
 * @param {string} moduleId - Module UUID
 * @param {string} newStatus - New status value
 * @param {string} stationId - Optional new station ID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateModuleStatus(moduleId, newStatus, stationId = null) {
  try {
    const updates = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (stationId) {
      updates.current_station_id = stationId;
    }

    // Set actual_start if starting
    if (newStatus === 'In Progress') {
      const { data: current } = await supabase
        .from('modules')
        .select('actual_start')
        .eq('id', moduleId)
        .single();

      if (!current?.actual_start) {
        updates.actual_start = new Date().toISOString();
      }
    }

    // Set actual_end if completing
    if (newStatus === 'Completed' || newStatus === 'Shipped') {
      updates.actual_end = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', moduleId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating module status:', error);
    return { data: null, error };
  }
}

/**
 * Move module to a different station
 *
 * @param {string} moduleId - Module UUID
 * @param {string} stationId - Target station UUID
 * @param {string} leadId - Lead user ID (optional)
 * @param {Array} crewIds - Array of worker IDs (optional)
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function moveModuleToStation(moduleId, stationId, leadId = null, crewIds = []) {
  try {
    // Update module's current station
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .update({
        current_station_id: stationId,
        status: 'In Queue',
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .select('*, factory_id')
      .single();

    if (moduleError) throw moduleError;

    // Create station assignment record
    const { error: assignmentError } = await supabase
      .from('station_assignments')
      .insert({
        module_id: moduleId,
        station_id: stationId,
        factory_id: module.factory_id,
        lead_id: leadId,
        crew_ids: crewIds,
        status: 'Pending'
      });

    if (assignmentError) throw assignmentError;

    return { data: module, error: null };
  } catch (error) {
    console.error('Error moving module to station:', error);
    return { data: null, error };
  }
}

/**
 * Schedule a module
 *
 * @param {string} moduleId - Module UUID
 * @param {Date} startDate - Scheduled start date
 * @param {Date} endDate - Scheduled end date
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function scheduleModule(moduleId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('modules')
      .update({
        scheduled_start: startDate.toISOString().split('T')[0],
        scheduled_end: endDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error scheduling module:', error);
    return { data: null, error };
  }
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete a module
 *
 * @param {string} moduleId - Module UUID
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function deleteModule(moduleId) {
  try {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting module:', error);
    return { success: false, error };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get module status color
 *
 * @param {string} status - Module status
 * @returns {string} Hex color code
 */
export function getModuleStatusColor(status) {
  const colors = {
    'Not Started': '#64748b', // gray
    'In Queue': '#eab308', // yellow
    'In Progress': '#3b82f6', // blue
    'QC Hold': '#f97316', // orange
    'Rework': '#ef4444', // red
    'Completed': '#22c55e', // green
    'Staged': '#8b5cf6', // purple
    'Shipped': '#14b8a6' // teal
  };
  return colors[status] || '#64748b';
}

/**
 * Calculate days until delivery
 *
 * @param {Object} module - Module with project.delivery_date
 * @returns {number} Days remaining (negative if overdue)
 */
export function getDaysUntilDelivery(module) {
  const deliveryDate = module.project?.delivery_date || module.scheduled_end;
  if (!deliveryDate) return null;

  const today = new Date();
  const delivery = new Date(deliveryDate);
  const diffTime = delivery - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  getModuleById,
  getModulesByProject,
  getModulesByFactory,
  getScheduledModules,
  getModulesAtStation,
  generateModuleSerial,
  createModule,
  createModulesForProject,
  updateModule,
  updateModuleStatus,
  moveModuleToStation,
  scheduleModule,
  deleteModule,
  getModuleStatusColor,
  getDaysUntilDelivery
};
