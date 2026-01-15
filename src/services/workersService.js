// ============================================================================
// workersService.js - Workers Service Layer
// ============================================================================
// Manages factory floor workers (separate from system users).
// Handles workforce tracking, shifts, and assignments.
//
// Created: January 15, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Get a single worker by ID
 *
 * @param {string} workerId - Worker UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getWorkerById(workerId) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select(`
        *,
        primary_station:station_templates(id, name, code, color),
        supervisor:workers!reports_to(id, full_name, title)
      `)
      .eq('id', workerId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching worker:', error);
    return { data: null, error };
  }
}

/**
 * Get all workers for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getWorkersByFactory(factoryId, filters = {}) {
  try {
    let query = supabase
      .from('workers')
      .select(`
        *,
        primary_station:station_templates(id, name, code, color)
      `)
      .eq('factory_id', factoryId);

    // Apply filters
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    } else {
      query = query.eq('is_active', true); // Default to active only
    }

    if (filters.isLead) {
      query = query.eq('is_lead', true);
    }

    if (filters.stationId) {
      query = query.eq('primary_station_id', filters.stationId);
    }

    if (filters.title) {
      query = query.ilike('title', `%${filters.title}%`);
    }

    query = query.order('full_name', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching workers:', error);
    return { data: [], error };
  }
}

/**
 * Get workers assigned to a specific station
 *
 * @param {string} stationId - Station UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getWorkersByStation(stationId) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('primary_station_id', stationId)
      .eq('is_active', true)
      .order('is_lead', { ascending: false })
      .order('full_name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching workers by station:', error);
    return { data: [], error };
  }
}

/**
 * Get station leads for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getStationLeads(factoryId) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select(`
        *,
        primary_station:station_templates(id, name, code, color)
      `)
      .eq('factory_id', factoryId)
      .eq('is_lead', true)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching station leads:', error);
    return { data: [], error };
  }
}

/**
 * Get available workers (not currently on shift or assigned)
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} date - Date to check availability
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getAvailableWorkers(factoryId, date = new Date()) {
  try {
    // Get all active workers
    const { data: allWorkers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .eq('factory_id', factoryId)
      .eq('is_active', true);

    if (workersError) throw workersError;

    // Get workers currently clocked in
    const dateStr = date.toISOString().split('T')[0];
    const { data: activeShifts, error: shiftsError } = await supabase
      .from('worker_shifts')
      .select('worker_id')
      .eq('factory_id', factoryId)
      .gte('clock_in', `${dateStr}T00:00:00`)
      .is('clock_out', null);

    if (shiftsError) throw shiftsError;

    const clockedInIds = new Set(activeShifts?.map(s => s.worker_id) || []);

    // Filter to available workers
    const available = allWorkers.filter(w => !clockedInIds.has(w.id));

    return { data: available, error: null };
  } catch (error) {
    console.error('Error fetching available workers:', error);
    return { data: [], error };
  }
}

// ============================================================================
// CREATE / UPDATE FUNCTIONS
// ============================================================================

/**
 * Create a new worker
 *
 * @param {string} factoryId - Factory UUID
 * @param {Object} workerData - Worker data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function createWorker(factoryId, workerData) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .insert({
        factory_id: factoryId,
        employee_id: workerData.employee_id,
        first_name: workerData.first_name,
        last_name: workerData.last_name,
        phone: workerData.phone,
        email: workerData.email,
        title: workerData.title,
        primary_station_id: workerData.primary_station_id,
        is_lead: workerData.is_lead || false,
        reports_to: workerData.reports_to,
        hourly_rate: workerData.hourly_rate,
        ot_multiplier: workerData.ot_multiplier || 1.5,
        double_time_multiplier: workerData.double_time_multiplier || 2.0,
        hire_date: workerData.hire_date,
        certifications: workerData.certifications || [],
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating worker:', error);
    return { data: null, error };
  }
}

/**
 * Update a worker
 *
 * @param {string} workerId - Worker UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateWorker(workerId, updates) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', workerId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating worker:', error);
    return { data: null, error };
  }
}

/**
 * Deactivate a worker (soft delete)
 *
 * @param {string} workerId - Worker UUID
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function deactivateWorker(workerId) {
  try {
    const { error } = await supabase
      .from('workers')
      .update({
        is_active: false,
        termination_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', workerId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deactivating worker:', error);
    return { success: false, error };
  }
}

// ============================================================================
// SHIFT FUNCTIONS
// ============================================================================

/**
 * Clock in a worker
 *
 * @param {string} workerId - Worker UUID
 * @param {string} source - Clock source ('kiosk', 'app', 'manual')
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function clockIn(workerId, source = 'kiosk') {
  try {
    // Get worker's factory_id
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('factory_id, hourly_rate')
      .eq('id', workerId)
      .single();

    if (workerError) throw workerError;

    const { data, error } = await supabase
      .from('worker_shifts')
      .insert({
        worker_id: workerId,
        factory_id: worker.factory_id,
        clock_in: new Date().toISOString(),
        source,
        status: 'active',
        rate_applied: worker.hourly_rate
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error clocking in:', error);
    return { data: null, error };
  }
}

/**
 * Clock out a worker
 *
 * @param {string} shiftId - Shift UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function clockOut(shiftId) {
  try {
    // Get shift details
    const { data: shift, error: shiftError } = await supabase
      .from('worker_shifts')
      .select('clock_in, rate_applied')
      .eq('id', shiftId)
      .single();

    if (shiftError) throw shiftError;

    const clockOut = new Date();
    const clockIn = new Date(shift.clock_in);
    const totalHours = (clockOut - clockIn) / (1000 * 60 * 60);

    // Calculate regular vs OT hours (simple 8-hour threshold)
    const regularHours = Math.min(totalHours, 8);
    const otHours = Math.max(0, Math.min(totalHours - 8, 4));
    const doubleHours = Math.max(0, totalHours - 12);

    // Calculate pay
    const rate = shift.rate_applied || 0;
    const totalPay = (regularHours * rate) + (otHours * rate * 1.5) + (doubleHours * rate * 2);

    const { data, error } = await supabase
      .from('worker_shifts')
      .update({
        clock_out: clockOut.toISOString(),
        total_hours: totalHours.toFixed(2),
        hours_regular: regularHours.toFixed(2),
        hours_ot: otHours.toFixed(2),
        hours_double: doubleHours.toFixed(2),
        total_pay: totalPay.toFixed(2),
        status: 'completed'
      })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error clocking out:', error);
    return { data: null, error };
  }
}

/**
 * Get active shifts for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getActiveShifts(factoryId) {
  try {
    const { data, error } = await supabase
      .from('worker_shifts')
      .select(`
        *,
        worker:workers(id, full_name, title, employee_id)
      `)
      .eq('factory_id', factoryId)
      .eq('status', 'active')
      .is('clock_out', null)
      .order('clock_in', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching active shifts:', error);
    return { data: [], error };
  }
}

/**
 * Get shift history for a worker
 *
 * @param {string} workerId - Worker UUID
 * @param {number} limit - Max records to return
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getWorkerShiftHistory(workerId, limit = 30) {
  try {
    const { data, error } = await supabase
      .from('worker_shifts')
      .select('*')
      .eq('worker_id', workerId)
      .order('clock_in', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching shift history:', error);
    return { data: [], error };
  }
}

// ============================================================================
// ATTENDANCE FUNCTIONS
// ============================================================================

/**
 * Get attendance summary for a factory on a given date
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} date - Date to check
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getAttendanceSummary(factoryId, date = new Date()) {
  try {
    const dateStr = date.toISOString().split('T')[0];

    // Get all active workers
    const { data: allWorkers, error: workersError } = await supabase
      .from('workers')
      .select('id')
      .eq('factory_id', factoryId)
      .eq('is_active', true);

    if (workersError) throw workersError;

    // Get workers who clocked in today
    const { data: shifts, error: shiftsError } = await supabase
      .from('worker_shifts')
      .select('worker_id, clock_in')
      .eq('factory_id', factoryId)
      .gte('clock_in', `${dateStr}T00:00:00`)
      .lt('clock_in', `${dateStr}T23:59:59`);

    if (shiftsError) throw shiftsError;

    const clockedInIds = new Set(shifts?.map(s => s.worker_id) || []);

    // Check for late arrivals (after 6:30 AM)
    const lateThreshold = new Date(`${dateStr}T06:30:00`);
    const lateCount = shifts?.filter(s => new Date(s.clock_in) > lateThreshold).length || 0;

    return {
      data: {
        total: allWorkers?.length || 0,
        present: clockedInIds.size,
        absent: (allWorkers?.length || 0) - clockedInIds.size,
        late: lateCount
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    return { data: { total: 0, present: 0, absent: 0, late: 0 }, error };
  }
}

// ============================================================================
// WEEKLY SCHEDULE FUNCTIONS (PGM-013/014)
// ============================================================================

/**
 * Get shifts for a date range (for weekly schedule view)
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getShiftsForDateRange(factoryId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('worker_shifts')
      .select(`
        *,
        worker:workers(id, full_name, employee_id, title, primary_station_id, is_lead,
          primary_station:station_templates(id, name, code, color))
      `)
      .eq('factory_id', factoryId)
      .gte('clock_in', startDate.toISOString())
      .lte('clock_in', endDate.toISOString())
      .order('clock_in', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching shifts for date range:', error);
    return { data: [], error };
  }
}

/**
 * Get weekly payroll summary for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} weekStart - Start of the week (Monday)
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getWeeklyPayrollSummary(factoryId, weekStart) {
  try {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const { data: shifts, error } = await supabase
      .from('worker_shifts')
      .select(`
        *,
        worker:workers(id, full_name, employee_id, hourly_rate, ot_multiplier, double_time_multiplier)
      `)
      .eq('factory_id', factoryId)
      .gte('clock_in', weekStart.toISOString())
      .lt('clock_in', weekEnd.toISOString())
      .not('clock_out', 'is', null);

    if (error) throw error;

    // Aggregate by worker
    const workerTotals = {};
    (shifts || []).forEach(shift => {
      const workerId = shift.worker_id;
      if (!workerTotals[workerId]) {
        workerTotals[workerId] = {
          worker: shift.worker,
          regularHours: 0,
          otHours: 0,
          doubleHours: 0,
          totalHours: 0,
          totalPay: 0,
          shiftCount: 0
        };
      }
      workerTotals[workerId].regularHours += parseFloat(shift.hours_regular || 0);
      workerTotals[workerId].otHours += parseFloat(shift.hours_ot || 0);
      workerTotals[workerId].doubleHours += parseFloat(shift.hours_double || 0);
      workerTotals[workerId].totalHours += parseFloat(shift.total_hours || 0);
      workerTotals[workerId].totalPay += parseFloat(shift.total_pay || 0);
      workerTotals[workerId].shiftCount += 1;
    });

    // Calculate totals
    const workers = Object.values(workerTotals);
    const summary = {
      workers,
      totalRegularHours: workers.reduce((sum, w) => sum + w.regularHours, 0),
      totalOTHours: workers.reduce((sum, w) => sum + w.otHours, 0),
      totalDoubleHours: workers.reduce((sum, w) => sum + w.doubleHours, 0),
      totalHours: workers.reduce((sum, w) => sum + w.totalHours, 0),
      totalPay: workers.reduce((sum, w) => sum + w.totalPay, 0),
      workerCount: workers.length,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0]
    };

    return { data: summary, error: null };
  } catch (error) {
    console.error('Error fetching weekly payroll:', error);
    return { data: null, error };
  }
}

/**
 * Get worker's current shift (if clocked in)
 *
 * @param {string} workerId - Worker UUID
 * @returns {Promise<{data: Object|null, error: Error}>}
 */
export async function getCurrentShift(workerId) {
  try {
    const { data, error } = await supabase
      .from('worker_shifts')
      .select('*')
      .eq('worker_id', workerId)
      .eq('status', 'active')
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching current shift:', error);
    return { data: null, error };
  }
}

/**
 * Start a break for a shift
 *
 * @param {string} shiftId - Shift UUID
 * @param {string} breakType - Break type ('break', 'lunch')
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function startBreak(shiftId, breakType = 'break') {
  try {
    const { data: shift, error: fetchError } = await supabase
      .from('worker_shifts')
      .select('breaks')
      .eq('id', shiftId)
      .single();

    if (fetchError) throw fetchError;

    const breaks = shift.breaks || [];
    breaks.push({
      type: breakType,
      started_at: new Date().toISOString(),
      ended_at: null
    });

    const { error } = await supabase
      .from('worker_shifts')
      .update({
        breaks,
        status: 'on_break'
      })
      .eq('id', shiftId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error starting break:', error);
    return { success: false, error };
  }
}

/**
 * End a break for a shift
 *
 * @param {string} shiftId - Shift UUID
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function endBreak(shiftId) {
  try {
    const { data: shift, error: fetchError } = await supabase
      .from('worker_shifts')
      .select('breaks')
      .eq('id', shiftId)
      .single();

    if (fetchError) throw fetchError;

    const breaks = shift.breaks || [];
    const lastBreak = breaks[breaks.length - 1];
    if (lastBreak && !lastBreak.ended_at) {
      lastBreak.ended_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('worker_shifts')
      .update({
        breaks,
        status: 'active'
      })
      .eq('id', shiftId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error ending break:', error);
    return { success: false, error };
  }
}

/**
 * Get attendance for multiple days (for schedule view)
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} startDate - Start date
 * @param {number} days - Number of days
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getMultiDayAttendance(factoryId, startDate, days = 7) {
  try {
    const attendance = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const { data } = await getAttendanceSummary(factoryId, date);
      attendance[dateStr] = data;
    }

    return { data: attendance, error: null };
  } catch (error) {
    console.error('Error fetching multi-day attendance:', error);
    return { data: {}, error };
  }
}

// ============================================================================
// CERTIFICATION FUNCTIONS
// ============================================================================

/**
 * Add a certification to a worker
 *
 * @param {string} workerId - Worker UUID
 * @param {string} stationId - Station UUID they're certified for
 * @param {string} certifiedBy - User who certified them
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function addCertification(workerId, stationId, certifiedBy = null) {
  try {
    // Get current certifications
    const { data: worker, error: fetchError } = await supabase
      .from('workers')
      .select('certifications')
      .eq('id', workerId)
      .single();

    if (fetchError) throw fetchError;

    const certifications = worker.certifications || [];

    // Check if already certified
    if (certifications.some(c => c.station_id === stationId)) {
      return { success: true, error: null }; // Already certified
    }

    // Add new certification
    certifications.push({
      station_id: stationId,
      certified_at: new Date().toISOString(),
      certified_by: certifiedBy
    });

    const { error: updateError } = await supabase
      .from('workers')
      .update({ certifications })
      .eq('id', workerId);

    if (updateError) throw updateError;

    // Also add to cross_training table
    await supabase
      .from('cross_training')
      .insert({
        worker_id: workerId,
        station_id: stationId,
        certified_at: new Date().toISOString().split('T')[0],
        certified_by: certifiedBy,
        proficiency_level: 'Basic',
        is_active: true
      });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error adding certification:', error);
    return { success: false, error };
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Fetch functions
  getWorkerById,
  getWorkersByFactory,
  getWorkersByStation,
  getStationLeads,
  getAvailableWorkers,

  // CRUD functions
  createWorker,
  updateWorker,
  deactivateWorker,

  // Shift functions
  clockIn,
  clockOut,
  getActiveShifts,
  getWorkerShiftHistory,
  getAttendanceSummary,

  // PGM-013: Enhanced shift management
  getShiftsForDateRange,
  getWeeklyPayrollSummary,
  getCurrentShift,
  startBreak,
  endBreak,
  getMultiDayAttendance,

  // Certification functions
  addCertification
};
