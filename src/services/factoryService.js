// ============================================================================
// factoryService.js - Factory Network & Project Count Service
// ============================================================================
// Manages factory locations, project counts, and metrics for the Factory Map feature.
// Integrates with Supabase to provide real-time factory status and project assignments.
//
// Created: January 20, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';

// ============================================================================
// PRIMARY FETCH FUNCTIONS - PROJECT COUNTS
// ============================================================================

/**
 * Get all factories with their project counts
 * Primary function for the Factory Map feature
 *
 * @returns {Promise<{data: Array, error: Error}>}
 * @example
 * const { data: factoriesWithCounts } = await getFactoriesWithProjectCounts();
 * // Returns: [
 * //   {
 * //     id: 'uuid...',
 * //     code: 'NWBS',
 * //     short_name: 'Northwest Builders',
 * //     full_name: 'Northwest Building Systems',
 * //     city: 'Portland',
 * //     state: 'OR',
 * //     is_active: true,
 * //     project_count: 14,
 * //     active_project_count: 8,
 * //     module_count: 24
 * //   },
 * //   ...
 * // ]
 */
export async function getFactoriesWithProjectCounts() {
  try {
    // Fetch all active factories
    const { data: factories, error: factoriesError } = await supabase
      .from('factories')
      .select('*')
      .eq('is_active', true)
      .order('short_name');

    if (factoriesError) throw factoriesError;
    if (!factories || factories.length === 0) {
      return { data: [], error: null };
    }

    // Get project counts for each factory (all projects)
    const { data: allProjectCounts, error: projectCountError } = await supabase
      .from('projects')
      .select('factory', { count: 'exact' })
      .in('factory', factories.map(f => f.code));

    if (projectCountError) throw projectCountError;

    // Get active project counts for each factory
    const { data: activeProjects, error: activeError } = await supabase
      .from('projects')
      .select('factory, id')
      .in('factory', factories.map(f => f.code))
      .in('status', ['Planning', 'In Progress', 'Production']);

    if (activeError) throw activeError;

    // Get module counts for each factory
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('factory_id')
      .in('factory_id', factories.map(f => f.id));

    if (modulesError) throw modulesError;

    // Build count maps
    const projectCountMap = {};
    const activeProjectCountMap = {};
    const moduleCountMap = {};

    (allProjectCounts || []).forEach(proj => {
      projectCountMap[proj.factory] = (projectCountMap[proj.factory] || 0) + 1;
    });

    (activeProjects || []).forEach(proj => {
      activeProjectCountMap[proj.factory] = (activeProjectCountMap[proj.factory] || 0) + 1;
    });

    (modules || []).forEach(mod => {
      moduleCountMap[mod.factory_id] = (moduleCountMap[mod.factory_id] || 0) + 1;
    });

    // Merge counts with factory data
    const factoriesWithCounts = factories.map(factory => ({
      ...factory,
      project_count: projectCountMap[factory.code] || 0,
      active_project_count: activeProjectCountMap[factory.code] || 0,
      module_count: moduleCountMap[factory.id] || 0
    }));

    return { data: factoriesWithCounts, error: null };
  } catch (error) {
    console.error('Error fetching factories with project counts:', error);
    return { data: [], error };
  }
}

/**
 * Get project count for a specific factory
 *
 * @param {string} factoryCode - Factory code (e.g., 'NWBS', 'PMI')
 * @returns {Promise<{data: Object, error: Error}>}
 * @example
 * const { data: factoryCounts } = await getFactoryProjectCount('NWBS');
 * // Returns: { total: 14, active: 8, modules: 24 }
 */
export async function getFactoryProjectCount(factoryCode) {
  try {
    // Get factory by code to get UUID
    const { data: factory, error: factoryError } = await supabase
      .from('factories')
      .select('id')
      .eq('code', factoryCode)
      .single();

    if (factoryError) throw factoryError;
    if (!factory) {
      return { data: { total: 0, active: 0, modules: 0 }, error: null };
    }

    // Parallel queries for efficiency
    const [projectsResult, activeResult, modulesResult] = await Promise.all([
      // Total projects
      supabase
        .from('projects')
        .select('id', { count: 'exact' })
        .eq('factory', factoryCode),

      // Active projects
      supabase
        .from('projects')
        .select('id', { count: 'exact' })
        .eq('factory', factoryCode)
        .in('status', ['Planning', 'In Progress', 'Production']),

      // Modules for this factory
      supabase
        .from('modules')
        .select('id', { count: 'exact' })
        .eq('factory_id', factory.id)
    ]);

    return {
      data: {
        total: projectsResult.count || 0,
        active: activeResult.count || 0,
        modules: modulesResult.count || 0
      },
      error: null
    };
  } catch (error) {
    console.error(`Error fetching project count for factory ${factoryCode}:`, error);
    return { data: { total: 0, active: 0, modules: 0 }, error };
  }
}

// ============================================================================
// DETAILED FETCH FUNCTIONS
// ============================================================================

/**
 * Get all projects for a specific factory with full details
 *
 * @param {string} factoryCode - Factory code
 * @param {Object} filters - Optional filters {status, is_pm_job, include_archived}
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getFactoryProjects(factoryCode, filters = {}) {
  try {
    let query = supabase
      .from('projects')
      .select('id, name, project_number, status, delivery_date, owner:owner_id(name), module_count')
      .eq('factory', factoryCode);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.is_pm_job !== undefined) {
      query = query.eq('is_pm_job', filters.is_pm_job);
    }
    if (filters.include_archived !== true) {
      query = query.not('status', 'in', '("Archived", "Cancelled")');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error(`Error fetching projects for factory ${factoryCode}:`, error);
    return { data: [], error };
  }
}

/**
 * Get factory details by code
 *
 * @param {string} factoryCode - Factory code (e.g., 'NWBS', 'PMI')
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getFactoryByCode(factoryCode) {
  try {
    const { data, error } = await supabase
      .from('factories')
      .select('*')
      .eq('code', factoryCode)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error fetching factory ${factoryCode}:`, error);
    return { data: null, error };
  }
}

/**
 * Get factory details by UUID
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getFactoryById(factoryId) {
  try {
    const { data, error } = await supabase
      .from('factories')
      .select('*')
      .eq('id', factoryId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error fetching factory ${factoryId}:`, error);
    return { data: null, error };
  }
}

/**
 * Get all factories (active and inactive)
 *
 * @param {boolean} activeOnly - If true, only return active factories (default: true)
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getAllFactories(activeOnly = true) {
  try {
    let query = supabase
      .from('factories')
      .select('*')
      .order('short_name');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching factories:', error);
    return { data: [], error };
  }
}

// ============================================================================
// AGGREGATION & SUMMARY FUNCTIONS
// ============================================================================

/**
 * Get factory network summary (all factories with key metrics)
 * Perfect for dashboard/overview screens
 *
 * @returns {Promise<{data: {total_factories: number, total_projects: number, total_modules: number, factories: Array}, error: Error}>}
 */
export async function getFactoryNetworkSummary() {
  try {
    const { data: factories, error: error1 } = await getFactoriesWithProjectCounts();
    if (error1) throw error1;

    if (!factories || factories.length === 0) {
      return {
        data: {
          total_factories: 0,
          total_projects: 0,
          total_modules: 0,
          factories: []
        },
        error: null
      };
    }

    // Calculate totals
    const totals = factories.reduce(
      (acc, factory) => ({
        total_projects: acc.total_projects + (factory.project_count || 0),
        total_modules: acc.total_modules + (factory.module_count || 0)
      }),
      { total_projects: 0, total_modules: 0 }
    );

    return {
      data: {
        total_factories: factories.length,
        total_projects: totals.total_projects,
        total_modules: totals.total_modules,
        factories: factories
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching factory network summary:', error);
    return {
      data: {
        total_factories: 0,
        total_projects: 0,
        total_modules: 0,
        factories: []
      },
      error
    };
  }
}

/**
 * Get busy factories (ranked by active project count)
 * Useful for identifying which factories need attention
 *
 * @param {number} limit - Number of factories to return (default: 10)
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getBusiestFactories(limit = 10) {
  try {
    const { data: factories, error } = await getFactoriesWithProjectCounts();
    if (error) throw error;

    // Sort by active projects, then total modules
    const sorted = (factories || [])
      .filter(f => f.active_project_count > 0 || f.module_count > 0)
      .sort((a, b) => {
        if (b.active_project_count !== a.active_project_count) {
          return b.active_project_count - a.active_project_count;
        }
        return b.module_count - a.module_count;
      })
      .slice(0, limit);

    return { data: sorted, error: null };
  } catch (error) {
    console.error('Error fetching busiest factories:', error);
    return { data: [], error };
  }
}

// ============================================================================
// MODULE-LEVEL FUNCTIONS
// ============================================================================

/**
 * Get all modules for a factory (for production line view)
 *
 * @param {string} factoryId - Factory UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getFactoryModules(factoryId, filters = {}) {
  try {
    let query = supabase
      .from('modules')
      .select(`
        *,
        project:projects(id, name, project_number, delivery_date),
        current_station:station_templates(id, name, code, color)
      `)
      .eq('factory_id', factoryId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.excludeCompleted !== false) {
      query = query.not('status', 'in', '("Completed", "Shipped")');
    }

    const { data, error } = await query.order('sequence_number');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error(`Error fetching modules for factory ${factoryId}:`, error);
    return { data: [], error };
  }
}

/**
 * Get module count by status for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Object, error: Error}>}
 * @example
 * const { data: statusCounts } = await getFactoryModuleStatusCounts('uuid-here');
 * // Returns: { 'In Progress': 5, 'In Queue': 3, 'QC Hold': 1, ... }
 */
export async function getFactoryModuleStatusCounts(factoryId) {
  try {
    const { data: modules, error } = await supabase
      .from('modules')
      .select('status')
      .eq('factory_id', factoryId);

    if (error) throw error;

    // Count modules by status
    const statusCounts = {};
    (modules || []).forEach(module => {
      statusCounts[module.status] = (statusCounts[module.status] || 0) + 1;
    });

    return { data: statusCounts, error: null };
  } catch (error) {
    console.error(`Error fetching module status counts for factory ${factoryId}:`, error);
    return { data: {}, error };
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Primary
  getFactoriesWithProjectCounts,
  getFactoryProjectCount,
  
  // Detailed
  getFactoryProjects,
  getFactoryByCode,
  getFactoryById,
  getAllFactories,
  
  // Aggregation
  getFactoryNetworkSummary,
  getBusiestFactories,
  
  // Modules
  getFactoryModules,
  getFactoryModuleStatusCounts
};
