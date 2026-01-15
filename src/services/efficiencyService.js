// ============================================================================
// efficiencyService.js - Efficiency Toolkit Service Layer
// ============================================================================
// Manages Kaizen suggestions, defect tracking, utilization events, OEE
// calculations, cross-training, and visual load board data.
//
// Batch 3: PGM-016 through PGM-021
// Created: January 15, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';

// ============================================================================
// KAIZEN SUGGESTIONS (PGM-016)
// ============================================================================

/**
 * Get Kaizen suggestions for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getKaizenSuggestions(factoryId, filters = {}) {
  try {
    let query = supabase
      .from('kaizen_suggestions')
      .select(`
        *,
        worker:workers(id, full_name, employee_id),
        user:users(id, full_name),
        station:station_templates(id, name, code, color),
        reviewer:users!reviewed_by(id, full_name)
      `)
      .eq('factory_id', factoryId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    query = query.order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching Kaizen suggestions:', error);
    return { data: [], error };
  }
}

/**
 * Create a new Kaizen suggestion
 *
 * @param {Object} suggestion - Suggestion data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function createKaizenSuggestion(suggestion) {
  try {
    const { data, error } = await supabase
      .from('kaizen_suggestions')
      .insert({
        factory_id: suggestion.factory_id,
        worker_id: suggestion.worker_id,
        user_id: suggestion.user_id,
        is_anonymous: suggestion.is_anonymous || false,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        station_id: suggestion.station_id,
        photo_urls: suggestion.photo_urls || [],
        status: 'Submitted'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating Kaizen suggestion:', error);
    return { data: null, error };
  }
}

/**
 * Update a Kaizen suggestion (review, approve, etc.)
 *
 * @param {string} suggestionId - Suggestion UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateKaizenSuggestion(suggestionId, updates) {
  try {
    const { data, error } = await supabase
      .from('kaizen_suggestions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', suggestionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating Kaizen suggestion:', error);
    return { data: null, error };
  }
}

/**
 * Approve a Kaizen suggestion with bonus
 *
 * @param {string} suggestionId - Suggestion UUID
 * @param {string} reviewerId - Reviewer user UUID
 * @param {number} bonusAmount - Bonus to award
 * @param {number} estimatedSavings - Estimated savings from idea
 * @param {string} notes - Review notes
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function approveKaizenSuggestion(suggestionId, reviewerId, bonusAmount, estimatedSavings, notes = '') {
  return updateKaizenSuggestion(suggestionId, {
    status: 'Approved',
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
    bonus_amount: bonusAmount,
    estimated_savings: estimatedSavings,
    review_notes: notes
  });
}

/**
 * Get Kaizen leaderboard (top contributors)
 *
 * @param {string} factoryId - Factory UUID
 * @param {number} limit - Number of top contributors
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getKaizenLeaderboard(factoryId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('kaizen_suggestions')
      .select(`
        worker_id,
        worker:workers(id, full_name, employee_id),
        user_id,
        user:users(id, full_name)
      `)
      .eq('factory_id', factoryId)
      .eq('status', 'Approved')
      .eq('is_anonymous', false);

    if (error) throw error;

    // Aggregate by submitter
    const counts = {};
    (data || []).forEach(s => {
      const key = s.worker_id || s.user_id;
      const name = s.worker?.full_name || s.user?.full_name || 'Unknown';
      if (!counts[key]) {
        counts[key] = { id: key, name, count: 0 };
      }
      counts[key].count++;
    });

    const leaderboard = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { data: leaderboard, error: null };
  } catch (error) {
    console.error('Error fetching Kaizen leaderboard:', error);
    return { data: [], error };
  }
}

// ============================================================================
// DEFECT-TO-FIX CYCLE TIMER (PGM-017)
// ============================================================================

/**
 * Get defect fix cycles for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getDefectFixCycles(factoryId, filters = {}) {
  try {
    // Get QC records that required rework
    let query = supabase
      .from('qc_records')
      .select(`
        *,
        module:modules(id, serial_number, name, building_category),
        station:station_templates(id, name, code, color)
      `)
      .eq('factory_id', factoryId)
      .eq('rework_required', true);

    if (filters.stationId) {
      query = query.eq('station_id', filters.stationId);
    }
    if (filters.startDate) {
      query = query.gte('inspected_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('inspected_at', filters.endDate.toISOString());
    }

    query = query.order('inspected_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate fix cycle times
    const cycles = (data || []).map(record => {
      const holdAt = new Date(record.inspected_at);
      const passAt = record.rework_completed_at ? new Date(record.rework_completed_at) : null;
      const durationHours = passAt
        ? (passAt - holdAt) / (1000 * 60 * 60)
        : (new Date() - holdAt) / (1000 * 60 * 60);

      // Apply category multiplier
      const categoryMultiplier = record.module?.building_category === 'custom' ? 1.4 : 1.0;
      const weightedDuration = durationHours / categoryMultiplier;

      return {
        id: record.id,
        module_id: record.module_id,
        station_id: record.station_id,
        module: record.module,
        station: record.station,
        hold_at: record.inspected_at,
        pass_at: record.rework_completed_at,
        duration_hours: Math.round(durationHours * 10) / 10,
        weighted_hours: Math.round(weightedDuration * 10) / 10,
        is_ongoing: !record.rework_completed_at,
        defects: record.defects_found || [],
        notes: record.notes
      };
    });

    return { data: cycles, error: null };
  } catch (error) {
    console.error('Error fetching defect fix cycles:', error);
    return { data: [], error };
  }
}

/**
 * Get defect fix cycle statistics
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getDefectFixStats(factoryId, startDate, endDate) {
  try {
    const { data: cycles, error } = await getDefectFixCycles(factoryId, {
      startDate,
      endDate
    });

    if (error) throw error;

    const completed = cycles.filter(c => !c.is_ongoing);
    const ongoing = cycles.filter(c => c.is_ongoing);

    // Calculate averages
    const avgDuration = completed.length > 0
      ? completed.reduce((sum, c) => sum + c.duration_hours, 0) / completed.length
      : 0;

    const avgWeighted = completed.length > 0
      ? completed.reduce((sum, c) => sum + c.weighted_hours, 0) / completed.length
      : 0;

    // By station
    const byStation = {};
    cycles.forEach(c => {
      const stationId = c.station_id;
      const stationName = c.station?.name || 'Unknown';
      if (!byStation[stationId]) {
        byStation[stationId] = { name: stationName, count: 0, totalHours: 0 };
      }
      byStation[stationId].count++;
      if (!c.is_ongoing) {
        byStation[stationId].totalHours += c.duration_hours;
      }
    });

    // Calculate avg per station
    Object.keys(byStation).forEach(id => {
      const s = byStation[id];
      s.avgHours = s.count > 0 ? Math.round((s.totalHours / s.count) * 10) / 10 : 0;
    });

    return {
      data: {
        total: cycles.length,
        completed: completed.length,
        ongoing: ongoing.length,
        avgDurationHours: Math.round(avgDuration * 10) / 10,
        avgWeightedHours: Math.round(avgWeighted * 10) / 10,
        byStation
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching defect fix stats:', error);
    return { data: { total: 0, completed: 0, ongoing: 0, avgDurationHours: 0, avgWeightedHours: 0, byStation: {} }, error };
  }
}

// ============================================================================
// CREW UTILIZATION HEATMAP (PGM-018)
// ============================================================================

/**
 * Get worker utilization data for heatmap
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} date - Date to get utilization for
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getCrewUtilization(factoryId, date = new Date()) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, full_name, employee_id, primary_station_id, is_lead')
      .eq('factory_id', factoryId)
      .eq('is_active', true);

    if (workersError) throw workersError;

    // Get stations
    const { data: stations, error: stationsError } = await supabase
      .from('station_templates')
      .select('id, name, code, color, order_num')
      .order('order_num');

    if (stationsError) throw stationsError;

    // Get shifts for the day
    const { data: shifts, error: shiftsError } = await supabase
      .from('worker_shifts')
      .select('*')
      .eq('factory_id', factoryId)
      .gte('clock_in', startOfDay.toISOString())
      .lte('clock_in', endOfDay.toISOString());

    if (shiftsError) throw shiftsError;

    // Get station assignments for the day
    const { data: assignments, error: assignmentsError } = await supabase
      .from('station_assignments')
      .select('*')
      .eq('factory_id', factoryId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());

    if (assignmentsError) throw assignmentsError;

    // Build utilization matrix
    const matrix = {};
    workers.forEach(worker => {
      matrix[worker.id] = {
        worker,
        stations: {}
      };

      // Calculate time at each station
      stations.forEach(station => {
        const workerAssignments = assignments.filter(a =>
          a.station_id === station.id &&
          (a.lead_id === worker.id || (a.crew_ids && a.crew_ids.includes(worker.id)))
        );

        const totalMinutes = workerAssignments.reduce((sum, a) => {
          const start = new Date(a.start_time);
          const end = a.end_time ? new Date(a.end_time) : new Date();
          return sum + (end - start) / (1000 * 60);
        }, 0);

        matrix[worker.id].stations[station.id] = {
          station,
          minutes: Math.round(totalMinutes),
          status: totalMinutes > 0 ? 'active' : 'idle',
          assignments: workerAssignments.length
        };
      });

      // Get shift info
      const workerShift = shifts.find(s => s.worker_id === worker.id);
      matrix[worker.id].shift = workerShift ? {
        clockIn: workerShift.clock_in,
        clockOut: workerShift.clock_out,
        totalHours: workerShift.total_hours
      } : null;
    });

    return {
      data: {
        workers,
        stations,
        matrix,
        date: date.toISOString()
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching crew utilization:', error);
    return { data: { workers: [], stations: [], matrix: {}, date: null }, error };
  }
}

// ============================================================================
// OEE LIVE CALCULATOR (PGM-019)
// ============================================================================

/**
 * Calculate Overall Equipment Effectiveness (OEE)
 * OEE = Availability × Performance × Quality
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function calculateOEE(factoryId, startDate, endDate) {
  try {
    // Get shifts for availability
    const { data: shifts, error: shiftsError } = await supabase
      .from('worker_shifts')
      .select('clock_in, clock_out, total_hours')
      .eq('factory_id', factoryId)
      .gte('clock_in', startDate.toISOString())
      .lte('clock_in', endDate.toISOString())
      .not('clock_out', 'is', null);

    if (shiftsError) throw shiftsError;

    // Get plant config for expected hours
    const { data: config, error: configError } = await supabase
      .from('plant_config')
      .select('time_settings')
      .eq('factory_id', factoryId)
      .single();

    if (configError && configError.code !== 'PGRST116') throw configError;

    const timeSettings = config?.time_settings || {
      shift_start: '06:00',
      shift_end: '14:30',
      break_minutes: 30,
      lunch_minutes: 30
    };

    // Calculate expected work hours per day
    const [startHour, startMin] = timeSettings.shift_start.split(':').map(Number);
    const [endHour, endMin] = timeSettings.shift_end.split(':').map(Number);
    const shiftMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const breakMinutes = (timeSettings.break_minutes || 0) + (timeSettings.lunch_minutes || 0);
    const expectedHoursPerDay = (shiftMinutes - breakMinutes) / 60;

    // Calculate days in range
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const expectedTotalHours = expectedHoursPerDay * days * (shifts.length || 1);

    // Actual hours worked
    const actualHours = shifts.reduce((sum, s) => sum + (s.total_hours || 0), 0);

    // Availability = Actual Time / Planned Time
    const availability = expectedTotalHours > 0
      ? Math.min(actualHours / expectedTotalHours, 1)
      : 0;

    // Get takt events for performance
    const { data: taktEvents, error: taktError } = await supabase
      .from('takt_events')
      .select('expected_hours, actual_hours')
      .eq('factory_id', factoryId)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())
      .not('actual_hours', 'is', null);

    if (taktError) throw taktError;

    // Performance = Expected Cycle Time / Actual Cycle Time
    const expectedCycleTime = taktEvents.reduce((sum, t) => sum + (t.expected_hours || 0), 0);
    const actualCycleTime = taktEvents.reduce((sum, t) => sum + (t.actual_hours || 0), 0);
    const performance = actualCycleTime > 0
      ? Math.min(expectedCycleTime / actualCycleTime, 1)
      : taktEvents.length > 0 ? 1 : 0;

    // Get QC records for quality
    const { data: qcRecords, error: qcError } = await supabase
      .from('qc_records')
      .select('passed')
      .eq('factory_id', factoryId)
      .gte('inspected_at', startDate.toISOString())
      .lte('inspected_at', endDate.toISOString());

    if (qcError) throw qcError;

    // Quality = Good Units / Total Units
    const totalInspections = qcRecords.length;
    const passedInspections = qcRecords.filter(r => r.passed).length;
    const quality = totalInspections > 0
      ? passedInspections / totalInspections
      : 1;

    // Calculate OEE
    const oee = availability * performance * quality;

    return {
      data: {
        oee: Math.round(oee * 1000) / 10, // As percentage
        availability: Math.round(availability * 1000) / 10,
        performance: Math.round(performance * 1000) / 10,
        quality: Math.round(quality * 1000) / 10,
        breakdown: {
          actualHours,
          expectedHours: Math.round(expectedTotalHours * 10) / 10,
          expectedCycleTime: Math.round(expectedCycleTime * 10) / 10,
          actualCycleTime: Math.round(actualCycleTime * 10) / 10,
          totalInspections,
          passedInspections
        },
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      },
      error: null
    };
  } catch (error) {
    console.error('Error calculating OEE:', error);
    return {
      data: {
        oee: 0,
        availability: 0,
        performance: 0,
        quality: 0,
        breakdown: {},
        dateRange: {}
      },
      error
    };
  }
}

// ============================================================================
// CROSS-TRAINING MATRIX (PGM-020)
// ============================================================================

/**
 * Get cross-training certifications for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getCrossTrainingMatrix(factoryId) {
  try {
    // Get workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, full_name, employee_id, primary_station_id, is_lead')
      .eq('factory_id', factoryId)
      .eq('is_active', true)
      .order('full_name');

    if (workersError) throw workersError;

    // Get stations
    const { data: stations, error: stationsError } = await supabase
      .from('station_templates')
      .select('id, name, code, color, order_num')
      .order('order_num');

    if (stationsError) throw stationsError;

    // Get certifications
    const { data: certifications, error: certsError } = await supabase
      .from('cross_training')
      .select('*')
      .eq('factory_id', factoryId)
      .eq('is_active', true);

    if (certsError) throw certsError;

    // Build matrix
    const matrix = {};
    workers.forEach(worker => {
      matrix[worker.id] = {
        worker,
        certifications: {}
      };

      stations.forEach(station => {
        const cert = certifications.find(c =>
          c.worker_id === worker.id && c.station_id === station.id
        );

        matrix[worker.id].certifications[station.id] = cert ? {
          certified: true,
          level: cert.proficiency_level,
          certifiedAt: cert.certified_at,
          expiresAt: cert.expires_at,
          avgHours: cert.avg_completion_hours,
          reworkRate: cert.rework_rate
        } : {
          certified: false
        };
      });
    });

    // Calculate station flex (% of workers certified per station)
    const stationFlex = {};
    stations.forEach(station => {
      const certifiedCount = Object.values(matrix).filter(
        w => w.certifications[station.id]?.certified
      ).length;
      stationFlex[station.id] = {
        station,
        certifiedCount,
        flexPercent: workers.length > 0
          ? Math.round((certifiedCount / workers.length) * 100)
          : 0
      };
    });

    return {
      data: {
        workers,
        stations,
        matrix,
        stationFlex,
        totalWorkers: workers.length,
        totalCertifications: certifications.length
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching cross-training matrix:', error);
    return { data: { workers: [], stations: [], matrix: {}, stationFlex: {}, totalWorkers: 0, totalCertifications: 0 }, error };
  }
}

/**
 * Add or update a cross-training certification
 *
 * @param {string} workerId - Worker UUID
 * @param {string} stationId - Station UUID
 * @param {Object} certData - Certification data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateCrossTraining(workerId, stationId, certData) {
  try {
    // Get worker's factory
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('factory_id')
      .eq('id', workerId)
      .single();

    if (workerError) throw workerError;

    const { data, error } = await supabase
      .from('cross_training')
      .upsert({
        worker_id: workerId,
        station_id: stationId,
        factory_id: worker.factory_id,
        certified_at: certData.certified_at || new Date().toISOString().split('T')[0],
        expires_at: certData.expires_at,
        certified_by: certData.certified_by,
        proficiency_level: certData.proficiency_level || 'Basic',
        is_active: true
      }, {
        onConflict: 'worker_id,station_id'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating cross-training:', error);
    return { data: null, error };
  }
}

/**
 * Remove a cross-training certification
 *
 * @param {string} workerId - Worker UUID
 * @param {string} stationId - Station UUID
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function removeCrossTraining(workerId, stationId) {
  try {
    const { error } = await supabase
      .from('cross_training')
      .update({ is_active: false })
      .eq('worker_id', workerId)
      .eq('station_id', stationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing cross-training:', error);
    return { success: false, error };
  }
}

// ============================================================================
// VISUAL LOAD BOARD (PGM-021)
// ============================================================================

/**
 * Get load board data for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} date - Date to get load board for
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getLoadBoardData(factoryId, date = new Date()) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get plant config for targets
    const { data: config, error: configError } = await supabase
      .from('plant_config')
      .select('line_sim_defaults')
      .eq('factory_id', factoryId)
      .single();

    if (configError && configError.code !== 'PGRST116') throw configError;

    const targetThroughput = config?.line_sim_defaults?.target_throughput_per_day || 2;

    // Get stations
    const { data: stations, error: stationsError } = await supabase
      .from('station_templates')
      .select('id, name, code, color, order_num')
      .order('order_num');

    if (stationsError) throw stationsError;

    // Get modules currently in production
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        *,
        project:projects(id, name, project_number),
        current_station:station_templates(id, name, code, color, order_num)
      `)
      .eq('factory_id', factoryId)
      .in('status', ['In Queue', 'In Progress', 'QC Hold']);

    if (modulesError) throw modulesError;

    // Get completed today
    const { data: completedToday, error: completedError } = await supabase
      .from('modules')
      .select('id')
      .eq('factory_id', factoryId)
      .eq('status', 'Completed')
      .gte('actual_end', startOfDay.toISOString())
      .lte('actual_end', endOfDay.toISOString());

    if (completedError) throw completedError;

    // Build station queue data
    const stationQueues = {};
    stations.forEach(station => {
      const stationModules = modules.filter(m => m.current_station_id === station.id);
      stationQueues[station.id] = {
        station,
        modules: stationModules,
        count: stationModules.length,
        inProgress: stationModules.filter(m => m.status === 'In Progress').length,
        waiting: stationModules.filter(m => m.status === 'In Queue').length,
        onHold: stationModules.filter(m => m.status === 'QC Hold').length
      };
    });

    // Calculate pace
    const now = new Date();
    const shiftStartHour = 6; // 6 AM
    const hoursElapsed = Math.max(0, now.getHours() - shiftStartHour + now.getMinutes() / 60);
    const shiftHours = 8.5; // Standard shift
    const expectedByNow = Math.floor((hoursElapsed / shiftHours) * targetThroughput);
    const actual = completedToday?.length || 0;
    const pace = expectedByNow > 0 ? (actual / expectedByNow) : (actual > 0 ? 1 : 0);

    return {
      data: {
        date: date.toISOString().split('T')[0],
        target: targetThroughput,
        completed: actual,
        expectedByNow,
        pace: Math.round(pace * 100),
        paceStatus: pace >= 1 ? 'on-track' : pace >= 0.8 ? 'behind' : 'at-risk',
        totalInProgress: modules.filter(m => m.status === 'In Progress').length,
        totalWaiting: modules.filter(m => m.status === 'In Queue').length,
        totalOnHold: modules.filter(m => m.status === 'QC Hold').length,
        stations,
        stationQueues,
        nextUp: modules
          .filter(m => m.status === 'In Queue')
          .sort((a, b) => (a.current_station?.order_num || 99) - (b.current_station?.order_num || 99))
          .slice(0, 5)
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching load board data:', error);
    return {
      data: {
        date: null,
        target: 0,
        completed: 0,
        expectedByNow: 0,
        pace: 0,
        paceStatus: 'unknown',
        totalInProgress: 0,
        totalWaiting: 0,
        totalOnHold: 0,
        stations: [],
        stationQueues: {},
        nextUp: []
      },
      error
    };
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Kaizen
  getKaizenSuggestions,
  createKaizenSuggestion,
  updateKaizenSuggestion,
  approveKaizenSuggestion,
  getKaizenLeaderboard,

  // Defect Fix
  getDefectFixCycles,
  getDefectFixStats,

  // Utilization
  getCrewUtilization,

  // OEE
  calculateOEE,

  // Cross-Training
  getCrossTrainingMatrix,
  updateCrossTraining,
  removeCrossTraining,

  // Load Board
  getLoadBoardData
};
