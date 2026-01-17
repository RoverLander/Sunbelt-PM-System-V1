// ============================================================================
// vpService.js - VP Dashboard & Multi-Plant Management Service
// ============================================================================
// Service layer for VP-level views, multi-plant aggregation, and config.
//
// Created: January 15, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';

// ============================================================================
// MULTI-PLANT AGGREGATION
// ============================================================================

/**
 * Get all factories with their production metrics
 */
export async function getFactoriesWithMetrics() {
  try {
    // Get all active factories
    const { data: factories, error: factoriesError } = await supabase
      .from('factories')
      .select('*')
      .eq('is_active', true)
      .order('short_name');

    if (factoriesError) throw factoriesError;

    // Get metrics for each factory
    const factoriesWithMetrics = await Promise.all(
      (factories || []).map(async (factory) => {
        const metrics = await getFactoryMetrics(factory.id);
        const config = await getPlantConfig(factory.id);
        return {
          ...factory,
          metrics: metrics.data || {},
          config: config.data || {}
        };
      })
    );

    return { data: factoriesWithMetrics, error: null };
  } catch (error) {
    console.error('Error fetching factories with metrics:', error);
    return { data: [], error };
  }
}

/**
 * Get production metrics for a single factory
 */
export async function getFactoryMetrics(factoryId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallel queries for efficiency
    const [
      modulesResult,
      projectsResult,
      workersResult,
      shiftsResult,
      qcResult
    ] = await Promise.all([
      // Active modules
      supabase
        .from('modules')
        .select('id, status, current_station_id', { count: 'exact' })
        .eq('factory_id', factoryId)
        .in('status', ['In Progress', 'Scheduled', 'On Hold']),

      // Active projects
      supabase
        .from('projects')
        .select('id, status, contract_value', { count: 'exact' })
        .eq('factory', factoryId)
        .in('status', ['Planning', 'In Progress', 'Production']),

      // Active workers
      supabase
        .from('workers')
        .select('id', { count: 'exact' })
        .eq('factory_id', factoryId)
        .eq('is_active', true),

      // Today's shifts
      supabase
        .from('worker_shifts')
        .select('id, total_hours')
        .eq('factory_id', factoryId)
        .gte('clock_in', today.toISOString()),

      // QC records last 30 days
      supabase
        .from('qc_records')
        .select('id, passed')
        .eq('factory_id', factoryId)
        .gte('created_at', thirtyDaysAgo.toISOString())
    ]);

    // Calculate metrics
    const modules = modulesResult.data || [];
    const projects = projectsResult.data || [];
    const shifts = shiftsResult.data || [];
    const qcRecords = qcResult.data || [];

    const totalContractValue = projects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
    const todayHours = shifts.reduce((sum, s) => sum + (s.total_hours || 0), 0);
    const passedQC = qcRecords.filter(r => r.passed).length;
    const qcPassRate = qcRecords.length > 0 ? Math.round((passedQC / qcRecords.length) * 100) : 100;

    // Calculate OEE estimate (simplified)
    const oee = Math.round(qcPassRate * 0.85); // Simplified estimate

    return {
      data: {
        activeModules: modulesResult.count || 0,
        activeProjects: projectsResult.count || 0,
        activeWorkers: workersResult.count || 0,
        todayShifts: shifts.length,
        todayHours,
        totalContractValue,
        qcPassRate,
        oee,
        modulesInProgress: modules.filter(m => m.status === 'In Progress').length,
        modulesScheduled: modules.filter(m => m.status === 'Scheduled').length,
        modulesOnHold: modules.filter(m => m.status === 'On Hold').length
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching factory metrics:', error);
    return { data: {}, error };
  }
}

/**
 * Get aggregated metrics across all factories
 */
export async function getAggregateMetrics() {
  try {
    const { data: factories } = await getFactoriesWithMetrics();

    if (!factories || factories.length === 0) {
      return { data: null, error: null };
    }

    // Aggregate metrics with weighting
    let totalModules = 0;
    let totalProjects = 0;
    let totalWorkers = 0;
    let totalContractValue = 0;
    let weightedOEE = 0;
    let totalWeight = 0;

    factories.forEach(factory => {
      const metrics = factory.metrics || {};
      const config = factory.config || {};
      const weight = config.vp_settings?.weight_in_aggregate || 1.0;

      totalModules += metrics.activeModules || 0;
      totalProjects += metrics.activeProjects || 0;
      totalWorkers += metrics.activeWorkers || 0;
      totalContractValue += metrics.totalContractValue || 0;

      if (metrics.oee) {
        weightedOEE += (metrics.oee * weight);
        totalWeight += weight;
      }
    });

    const avgOEE = totalWeight > 0 ? Math.round(weightedOEE / totalWeight) : 0;

    return {
      data: {
        totalFactories: factories.length,
        totalModules,
        totalProjects,
        totalWorkers,
        totalContractValue,
        avgOEE,
        factories
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching aggregate metrics:', error);
    return { data: null, error };
  }
}

// ============================================================================
// PLANT CONFIG MANAGEMENT
// ============================================================================

/**
 * Get plant configuration for a factory
 */
export async function getPlantConfig(factoryId) {
  try {
    const { data, error } = await supabase
      .from('plant_config')
      .select('*')
      .eq('factory_id', factoryId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    // Return default config if none exists
    if (!data) {
      return {
        data: {
          factory_id: factoryId,
          time_settings: {
            shift_start: '06:00',
            shift_end: '14:30',
            break_minutes: 30,
            lunch_minutes: 30,
            ot_threshold_daily: 8,
            ot_threshold_weekly: 40,
            double_time_threshold: 12
          },
          efficiency_modules: {
            takt_time_tracker: false,
            queue_time_monitor: false,
            kaizen_board: false,
            defect_fix_timer: false,
            material_flow_trace: false,
            crew_utilization_heatmap: false,
            line_balancing_sim: false,
            visual_load_board: false,
            five_s_audit: false,
            oee_calculator: false,
            cross_training_matrix: false,
            safety_micro_check: false
          },
          line_sim_defaults: {
            target_throughput_per_day: 2,
            max_wip_per_station: 3,
            bottleneck_threshold_hours: 4
          },
          vp_settings: {
            weight_in_aggregate: 1.0,
            target_oee: 0.75,
            target_on_time_delivery: 0.90
          },
          calendar_settings: {
            work_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            holidays: [],
            auto_schedule_enabled: false
          }
        },
        error: null
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching plant config:', error);
    return { data: null, error };
  }
}

/**
 * Update plant configuration
 */
export async function updatePlantConfig(factoryId, updates) {
  try {
    // Check if config exists
    const { data: existing } = await supabase
      .from('plant_config')
      .select('id')
      .eq('factory_id', factoryId)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('plant_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('factory_id', factoryId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('plant_config')
        .insert({
          factory_id: factoryId,
          ...updates
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error updating plant config:', error);
    return { data: null, error };
  }
}

/**
 * Update efficiency module toggles
 */
export async function toggleEfficiencyModule(factoryId, moduleName, enabled) {
  try {
    const { data: config } = await getPlantConfig(factoryId);
    const efficiencyModules = config?.efficiency_modules || {};

    efficiencyModules[moduleName] = enabled;

    return await updatePlantConfig(factoryId, {
      efficiency_modules: efficiencyModules
    });
  } catch (error) {
    console.error('Error toggling efficiency module:', error);
    return { data: null, error };
  }
}

// ============================================================================
// VP CONFIG MANAGEMENT
// ============================================================================

/**
 * Get VP config for all factories
 */
export async function getVPConfig() {
  try {
    const { data, error } = await supabase
      .from('plant_config')
      .select(`
        id,
        factory_id,
        vp_settings,
        factories!inner(id, code, short_name, full_name)
      `)
      .order('factories(short_name)');

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching VP config:', error);
    return { data: [], error };
  }
}

/**
 * Update VP settings for a factory
 */
export async function updateVPSettings(factoryId, vpSettings) {
  try {
    return await updatePlantConfig(factoryId, {
      vp_settings: vpSettings
    });
  } catch (error) {
    console.error('Error updating VP settings:', error);
    return { data: null, error };
  }
}

/**
 * Bulk update VP settings for multiple factories
 */
export async function bulkUpdateVPSettings(updates) {
  try {
    // updates = [{factoryId, vpSettings}, ...]
    const results = await Promise.all(
      updates.map(({ factoryId, vpSettings }) =>
        updateVPSettings(factoryId, vpSettings)
      )
    );

    const hasError = results.some(r => r.error);
    return {
      data: results.map(r => r.data),
      error: hasError ? 'Some updates failed' : null
    };
  } catch (error) {
    console.error('Error bulk updating VP settings:', error);
    return { data: null, error };
  }
}

// ============================================================================
// PIPELINE & SCHEDULING
// ============================================================================

/**
 * Get pipeline data across factories
 */
export async function getPipelineData(factoryIds = null) {
  try {
    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        project_number,
        status,
        factory,
        contract_value,
        start_date,
        target_completion,
        module_count
      `)
      .in('status', ['Planning', 'In Progress', 'Production', 'Scheduled'])
      .order('target_completion');

    if (factoryIds && factoryIds.length > 0) {
      query = query.in('factory', factoryIds);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    return { data: [], error };
  }
}

/**
 * Get auto-schedule suggestions based on capacity
 */
export async function getAutoScheduleSuggestions(factoryId) {
  try {
    // Get factory config
    const { data: config } = await getPlantConfig(factoryId);
    const targetThroughput = config?.line_sim_defaults?.target_throughput_per_day || 2;

    // Get unscheduled modules
    const { data: unscheduled, error } = await supabase
      .from('modules')
      .select(`
        id,
        serial_number,
        status,
        scheduled_start,
        scheduled_end,
        project:project_id(id, name, target_completion)
      `)
      .eq('factory_id', factoryId)
      .is('scheduled_start', null)
      .in('status', ['Not Started', 'Scheduled']);

    if (error) throw error;

    // Get current scheduled load by date
    const { data: scheduled } = await supabase
      .from('modules')
      .select('id, scheduled_start, scheduled_end')
      .eq('factory_id', factoryId)
      .not('scheduled_start', 'is', null)
      .gte('scheduled_end', new Date().toISOString());

    // Build suggestions
    const suggestions = [];
    const dateLoad = {};

    // Calculate existing load per day
    (scheduled || []).forEach(mod => {
      if (mod.scheduled_start) {
        const date = mod.scheduled_start.split('T')[0];
        dateLoad[date] = (dateLoad[date] || 0) + 1;
      }
    });

    // Suggest dates for unscheduled modules
    let currentDate = new Date();
    (unscheduled || []).forEach(mod => {
      // Find next available date with capacity
      while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const currentLoad = dateLoad[dateStr] || 0;
        if (currentLoad < targetThroughput) {
          suggestions.push({
            module: mod,
            suggestedDate: dateStr,
            reason: `Capacity available (${currentLoad}/${targetThroughput} modules)`
          });
          dateLoad[dateStr] = currentLoad + 1;
          break;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return { data: suggestions, error: null };
  } catch (error) {
    console.error('Error getting auto-schedule suggestions:', error);
    return { data: [], error };
  }
}

/**
 * Apply auto-schedule suggestions
 */
export async function applyAutoSchedule(factoryId, suggestions) {
  try {
    const updates = suggestions.map(s => ({
      id: s.module.id,
      scheduled_start: s.suggestedDate,
      scheduled_end: s.suggestedDate // Same day for simplicity
    }));

    const results = await Promise.all(
      updates.map(update =>
        supabase
          .from('modules')
          .update({
            scheduled_start: update.scheduled_start,
            scheduled_end: update.scheduled_end,
            status: 'Scheduled'
          })
          .eq('id', update.id)
      )
    );

    const hasError = results.some(r => r.error);

    // Log audit
    await supabase.from('calendar_audit').insert({
      factory_id: factoryId,
      action: 'auto_schedule',
      new_data: { applied_count: suggestions.length },
      notes: `Auto-scheduled ${suggestions.length} modules`
    });

    return {
      data: { appliedCount: suggestions.length },
      error: hasError ? 'Some updates failed' : null
    };
  } catch (error) {
    console.error('Error applying auto-schedule:', error);
    return { data: null, error };
  }
}

// ============================================================================
// DAILY REPORTS
// ============================================================================

/**
 * Generate daily report data for a factory
 */
export async function generateDailyReport(factoryId, date = new Date()) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Parallel queries
    const [
      shiftsResult,
      qcResult,
      modulesResult,
      assignmentsResult
    ] = await Promise.all([
      // Shifts for the day
      supabase
        .from('worker_shifts')
        .select(`
          *,
          workers!inner(id, full_name, title, hourly_rate)
        `)
        .eq('factory_id', factoryId)
        .gte('clock_in', startOfDay.toISOString())
        .lte('clock_in', endOfDay.toISOString()),

      // QC records for the day
      supabase
        .from('qc_records')
        .select(`
          *,
          modules!inner(id, serial_number),
          station_templates!inner(id, name)
        `)
        .eq('factory_id', factoryId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString()),

      // Modules completed
      supabase
        .from('modules')
        .select('*')
        .eq('factory_id', factoryId)
        .eq('status', 'Complete')
        .gte('completed_at', startOfDay.toISOString())
        .lte('completed_at', endOfDay.toISOString()),

      // Station assignments
      supabase
        .from('station_assignments')
        .select(`
          *,
          station_templates!inner(id, name, order_num),
          modules!inner(id, serial_number)
        `)
        .eq('factory_id', factoryId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
    ]);

    const shifts = shiftsResult.data || [];
    const qcRecords = qcResult.data || [];
    const completedModules = modulesResult.data || [];
    const assignments = assignmentsResult.data || [];

    // Calculate summaries
    const totalHours = shifts.reduce((sum, s) => sum + (s.total_hours || 0), 0);
    const totalRegularHours = shifts.reduce((sum, s) => sum + (s.hours_regular || 0), 0);
    const totalOTHours = shifts.reduce((sum, s) => sum + (s.hours_ot || 0), 0);
    const totalPay = shifts.reduce((sum, s) => sum + (s.total_pay || 0), 0);

    const qcPassed = qcRecords.filter(r => r.passed).length;
    const qcFailed = qcRecords.filter(r => !r.passed).length;
    const qcPassRate = qcRecords.length > 0
      ? Math.round((qcPassed / qcRecords.length) * 100)
      : 100;

    // Group assignments by station
    const stationSummary = {};
    assignments.forEach(a => {
      const stationName = a.station_templates?.name || 'Unknown';
      if (!stationSummary[stationName]) {
        stationSummary[stationName] = { count: 0, modules: [] };
      }
      stationSummary[stationName].count++;
      stationSummary[stationName].modules.push(a.modules?.serial_number);
    });

    return {
      data: {
        date: startOfDay.toISOString().split('T')[0],
        factory_id: factoryId,

        // Labor summary
        labor: {
          workerCount: new Set(shifts.map(s => s.worker_id)).size,
          totalHours: Math.round(totalHours * 100) / 100,
          regularHours: Math.round(totalRegularHours * 100) / 100,
          overtimeHours: Math.round(totalOTHours * 100) / 100,
          totalPay: Math.round(totalPay * 100) / 100,
          shifts: shifts.map(s => ({
            worker: s.workers?.full_name,
            title: s.workers?.title,
            clockIn: s.clock_in,
            clockOut: s.clock_out,
            hours: s.total_hours,
            pay: s.total_pay
          }))
        },

        // Production summary
        production: {
          modulesCompleted: completedModules.length,
          stationActivity: stationSummary,
          assignments: assignments.length
        },

        // Quality summary
        quality: {
          inspections: qcRecords.length,
          passed: qcPassed,
          failed: qcFailed,
          passRate: qcPassRate,
          records: qcRecords.map(r => ({
            module: r.modules?.serial_number,
            station: r.station_templates?.name,
            passed: r.passed,
            notes: r.notes
          }))
        },

        // Generated timestamp
        generatedAt: new Date().toISOString()
      },
      error: null
    };
  } catch (error) {
    console.error('Error generating daily report:', error);
    return { data: null, error };
  }
}

/**
 * Get saved daily reports
 */
export async function getDailyReports(factoryId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('factory_id', factoryId)
      .gte('report_date', startDate)
      .lte('report_date', endDate)
      .order('report_date', { ascending: false });

    if (error && error.code !== '42P01') throw error; // Table might not exist

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return { data: [], error };
  }
}

export default {
  getFactoriesWithMetrics,
  getFactoryMetrics,
  getAggregateMetrics,
  getPlantConfig,
  updatePlantConfig,
  toggleEfficiencyModule,
  getVPConfig,
  updateVPSettings,
  bulkUpdateVPSettings,
  getPipelineData,
  getAutoScheduleSuggestions,
  applyAutoSchedule,
  generateDailyReport,
  getDailyReports
};
