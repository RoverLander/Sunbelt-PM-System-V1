// ============================================================================
// validationService.js - Central Data Consistency Validation
// ============================================================================
// Provides validation functions to ensure data consistency across the system.
// All business rules for data relationships are enforced here.
//
// Created: January 16, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Valid module status transitions
 * Key = current status, Value = array of valid next statuses
 */
export const VALID_STATUS_TRANSITIONS = {
  'Not Started': ['In Queue', 'In Progress'],
  'In Queue': ['In Progress', 'Not Started'],
  'In Progress': ['QC Hold', 'Completed', 'In Queue', 'Rework'],
  'QC Hold': ['In Progress', 'Rework', 'Completed'],
  'Rework': ['In Progress', 'In Queue', 'QC Hold'],
  'Completed': ['Staged', 'Shipped'],
  'Staged': ['Shipped', 'Completed'],
  'Shipped': [] // Terminal state
};

/**
 * Stations that require QC inspection before module can leave
 * These are station order_nums, not IDs
 */
export const QC_REQUIRED_STATIONS = [5, 6, 7, 8, 10];

/**
 * Stations that are dedicated inspection stations
 */
export const INSPECTION_STATION_ORDERS = [8, 10];

// ============================================================================
// STATION PROGRESSION VALIDATION
// ============================================================================

/**
 * Validate that a module can move to the target station
 *
 * Rules enforced:
 * 1. Target station must exist and be active
 * 2. Station order must progress (no skipping, no going backwards except for rework)
 * 3. Current station QC gate must be cleared if required
 *
 * @param {string} moduleId - Module UUID
 * @param {string} targetStationId - Target station UUID
 * @param {Object} options - Options { allowBackward: false, isRework: false }
 * @returns {Promise<{valid: boolean, error: string|null, details: Object}>}
 */
export async function validateStationProgression(moduleId, targetStationId, options = {}) {
  const { allowBackward = false, isRework = false } = options;

  try {
    // Get module with current station
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select(`
        id, status, current_station_id, is_rush,
        current_station:station_templates!current_station_id(id, order_num, name, requires_inspection)
      `)
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return { valid: false, error: 'Module not found', details: { moduleId } };
    }

    // Get target station
    const { data: targetStation, error: stationError } = await supabase
      .from('station_templates')
      .select('id, order_num, name, is_active, requires_inspection, factory_id')
      .eq('id', targetStationId)
      .single();

    if (stationError || !targetStation) {
      return { valid: false, error: 'Target station not found', details: { targetStationId } };
    }

    if (!targetStation.is_active) {
      return { valid: false, error: 'Target station is not active', details: { station: targetStation.name } };
    }

    const currentOrder = module.current_station?.order_num || 0;
    const targetOrder = targetStation.order_num;

    // Rule: Cannot skip stations (more than 1 step forward)
    if (targetOrder > currentOrder + 1 && !module.is_rush) {
      return {
        valid: false,
        error: `Cannot skip stations. Current: ${currentOrder}, Target: ${targetOrder}`,
        details: {
          currentStation: module.current_station?.name || 'None',
          targetStation: targetStation.name,
          stationGap: targetOrder - currentOrder
        }
      };
    }

    // Rule: Cannot go backwards unless rework or explicitly allowed
    if (targetOrder < currentOrder && !allowBackward && !isRework) {
      return {
        valid: false,
        error: 'Cannot move module backwards in production line',
        details: {
          currentStation: module.current_station?.name,
          targetStation: targetStation.name
        }
      };
    }

    // Rule: Check QC gate if current station requires inspection
    if (module.current_station?.requires_inspection || QC_REQUIRED_STATIONS.includes(currentOrder)) {
      const qcResult = await validateQCGate(moduleId, module.current_station_id);
      if (!qcResult.valid) {
        return {
          valid: false,
          error: `QC gate not cleared: ${qcResult.error}`,
          details: qcResult.details
        };
      }
    }

    return {
      valid: true,
      error: null,
      details: {
        currentStation: module.current_station?.name || 'None',
        targetStation: targetStation.name,
        progression: `${currentOrder} → ${targetOrder}`
      }
    };

  } catch (error) {
    console.error('Error validating station progression:', error);
    return { valid: false, error: error.message, details: {} };
  }
}

// ============================================================================
// QC GATE VALIDATION
// ============================================================================

/**
 * Validate that QC requirements are met for a module at a station
 *
 * Rules enforced:
 * 1. If station requires_inspection, a passed QC record must exist
 * 2. Module cannot be in QC Hold status if trying to progress
 *
 * @param {string} moduleId - Module UUID
 * @param {string} stationId - Station UUID to check QC for
 * @returns {Promise<{valid: boolean, error: string|null, details: Object}>}
 */
export async function validateQCGate(moduleId, stationId) {
  try {
    if (!stationId) {
      // No station = no QC requirement
      return { valid: true, error: null, details: { reason: 'No station assigned' } };
    }

    // Get station info
    const { data: station } = await supabase
      .from('station_templates')
      .select('id, name, order_num, requires_inspection, is_inspection_station')
      .eq('id', stationId)
      .single();

    if (!station) {
      return { valid: true, error: null, details: { reason: 'Station not found' } };
    }

    // Check if this station requires QC
    const requiresQC = station.requires_inspection ||
                       station.is_inspection_station ||
                       QC_REQUIRED_STATIONS.includes(station.order_num);

    if (!requiresQC) {
      return { valid: true, error: null, details: { reason: 'Station does not require QC' } };
    }

    // Check for passing QC record
    const { data: qcRecords, error: qcError } = await supabase
      .from('qc_records')
      .select('id, status, passed, inspected_at')
      .eq('module_id', moduleId)
      .eq('station_id', stationId)
      .order('inspected_at', { ascending: false });

    if (qcError) {
      return { valid: false, error: 'Failed to check QC records', details: { error: qcError.message } };
    }

    if (!qcRecords || qcRecords.length === 0) {
      return {
        valid: false,
        error: `QC inspection required at ${station.name}`,
        details: {
          station: station.name,
          stationOrder: station.order_num,
          qcRecordsFound: 0
        }
      };
    }

    // Check if most recent QC passed
    const latestQC = qcRecords[0];
    if (!latestQC.passed || latestQC.status === 'Failed') {
      return {
        valid: false,
        error: `QC inspection failed at ${station.name}. Rework required.`,
        details: {
          station: station.name,
          lastQCStatus: latestQC.status,
          lastQCPassed: latestQC.passed
        }
      };
    }

    return {
      valid: true,
      error: null,
      details: {
        station: station.name,
        qcPassed: true,
        qcRecordId: latestQC.id
      }
    };

  } catch (error) {
    console.error('Error validating QC gate:', error);
    return { valid: false, error: error.message, details: {} };
  }
}

// ============================================================================
// WORKER CERTIFICATION VALIDATION
// ============================================================================

/**
 * Validate that a worker is certified to work at a station
 *
 * Rules enforced:
 * 1. Worker must be active
 * 2. Worker must have primary_station_id = station OR valid cross_training
 * 3. Cross-training must not be expired
 *
 * @param {string} workerId - Worker UUID
 * @param {string} stationId - Station UUID
 * @returns {Promise<{valid: boolean, error: string|null, details: Object}>}
 */
export async function validateWorkerCertification(workerId, stationId) {
  try {
    // Get worker
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, full_name, is_active, primary_station_id, is_lead')
      .eq('id', workerId)
      .single();

    if (workerError || !worker) {
      return { valid: false, error: 'Worker not found', details: { workerId } };
    }

    if (!worker.is_active) {
      return {
        valid: false,
        error: 'Worker is not active',
        details: { worker: worker.full_name, isActive: false }
      };
    }

    // Check if this is their primary station
    if (worker.primary_station_id === stationId) {
      return {
        valid: true,
        error: null,
        details: {
          worker: worker.full_name,
          certifiedBy: 'primary_station',
          isLead: worker.is_lead
        }
      };
    }

    // Check for cross-training certification
    const today = new Date().toISOString().split('T')[0];
    const { data: crossTraining, error: ctError } = await supabase
      .from('cross_training')
      .select('id, proficiency_level, certified_at, expires_at, is_active')
      .eq('worker_id', workerId)
      .eq('station_id', stationId)
      .eq('is_active', true)
      .single();

    if (ctError || !crossTraining) {
      return {
        valid: false,
        error: 'Worker not certified for this station',
        details: {
          worker: worker.full_name,
          stationId,
          hasPrimaryStation: !!worker.primary_station_id,
          crossTrainingFound: false
        }
      };
    }

    // Check expiration
    if (crossTraining.expires_at && crossTraining.expires_at < today) {
      return {
        valid: false,
        error: 'Worker certification has expired',
        details: {
          worker: worker.full_name,
          expiredAt: crossTraining.expires_at,
          proficiencyLevel: crossTraining.proficiency_level
        }
      };
    }

    return {
      valid: true,
      error: null,
      details: {
        worker: worker.full_name,
        certifiedBy: 'cross_training',
        proficiencyLevel: crossTraining.proficiency_level,
        expiresAt: crossTraining.expires_at,
        isLead: worker.is_lead
      }
    };

  } catch (error) {
    console.error('Error validating worker certification:', error);
    return { valid: false, error: error.message, details: {} };
  }
}

// ============================================================================
// CREW SIZE VALIDATION
// ============================================================================

/**
 * Validate that crew size meets station requirements
 *
 * Rules enforced:
 * 1. Crew size >= station.min_crew_size
 * 2. Crew size <= station.max_crew_size
 * 3. Lead worker (if assigned) must have is_lead = true
 *
 * @param {string} stationId - Station UUID
 * @param {Array<string>} crewIds - Array of worker UUIDs
 * @param {string} leadId - Lead worker UUID (optional)
 * @returns {Promise<{valid: boolean, error: string|null, details: Object}>}
 */
export async function validateCrewSize(stationId, crewIds = [], leadId = null) {
  try {
    // Get station requirements
    const { data: station, error: stationError } = await supabase
      .from('station_templates')
      .select('id, name, min_crew_size, max_crew_size, recommended_crew_size')
      .eq('id', stationId)
      .single();

    if (stationError || !station) {
      return { valid: false, error: 'Station not found', details: { stationId } };
    }

    const crewSize = crewIds.length + (leadId && !crewIds.includes(leadId) ? 1 : 0);
    const minCrew = station.min_crew_size || 1;
    const maxCrew = station.max_crew_size || 10;

    if (crewSize < minCrew) {
      return {
        valid: false,
        error: `Crew size too small. Minimum ${minCrew} required, got ${crewSize}`,
        details: {
          station: station.name,
          crewSize,
          minRequired: minCrew,
          maxAllowed: maxCrew
        }
      };
    }

    if (crewSize > maxCrew) {
      return {
        valid: false,
        error: `Crew size too large. Maximum ${maxCrew} allowed, got ${crewSize}`,
        details: {
          station: station.name,
          crewSize,
          minRequired: minCrew,
          maxAllowed: maxCrew
        }
      };
    }

    // Validate lead if provided
    if (leadId) {
      const { data: lead } = await supabase
        .from('workers')
        .select('id, full_name, is_lead, is_active')
        .eq('id', leadId)
        .single();

      if (!lead) {
        return { valid: false, error: 'Lead worker not found', details: { leadId } };
      }

      if (!lead.is_lead) {
        return {
          valid: false,
          error: `${lead.full_name} is not designated as a lead`,
          details: { worker: lead.full_name, isLead: false }
        };
      }

      if (!lead.is_active) {
        return {
          valid: false,
          error: `Lead worker ${lead.full_name} is not active`,
          details: { worker: lead.full_name, isActive: false }
        };
      }
    }

    return {
      valid: true,
      error: null,
      details: {
        station: station.name,
        crewSize,
        minRequired: minCrew,
        maxAllowed: maxCrew,
        recommended: station.recommended_crew_size,
        hasLead: !!leadId
      }
    };

  } catch (error) {
    console.error('Error validating crew size:', error);
    return { valid: false, error: error.message, details: {} };
  }
}

// ============================================================================
// SHIFT CONSISTENCY VALIDATION
// ============================================================================

/**
 * Validate worker shift consistency before clock in
 *
 * Rules enforced:
 * 1. Worker must be active
 * 2. Worker cannot have another active (incomplete) shift
 * 3. Worker must not have clocked in within last minute (prevent duplicates)
 *
 * @param {string} workerId - Worker UUID
 * @returns {Promise<{valid: boolean, error: string|null, details: Object, activeShift: Object|null}>}
 */
export async function validateShiftConsistency(workerId) {
  try {
    // Get worker
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, full_name, is_active')
      .eq('id', workerId)
      .single();

    if (workerError || !worker) {
      return { valid: false, error: 'Worker not found', details: { workerId }, activeShift: null };
    }

    if (!worker.is_active) {
      return {
        valid: false,
        error: 'Inactive workers cannot clock in',
        details: { worker: worker.full_name, isActive: false },
        activeShift: null
      };
    }

    // Check for active shifts
    const { data: activeShifts, error: shiftError } = await supabase
      .from('worker_shifts')
      .select('id, clock_in, status')
      .eq('worker_id', workerId)
      .is('clock_out', null)
      .eq('status', 'active');

    if (shiftError) {
      return { valid: false, error: 'Failed to check active shifts', details: {}, activeShift: null };
    }

    if (activeShifts && activeShifts.length > 0) {
      return {
        valid: false,
        error: 'Worker already has an active shift. Clock out first.',
        details: {
          worker: worker.full_name,
          activeShiftCount: activeShifts.length,
          activeShiftStarted: activeShifts[0].clock_in
        },
        activeShift: activeShifts[0]
      };
    }

    // Check for recent clock-in (within last minute) to prevent duplicates
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentShifts } = await supabase
      .from('worker_shifts')
      .select('id, clock_in')
      .eq('worker_id', workerId)
      .gte('clock_in', oneMinuteAgo);

    if (recentShifts && recentShifts.length > 0) {
      return {
        valid: false,
        error: 'Duplicate clock-in detected. Please wait.',
        details: {
          worker: worker.full_name,
          lastClockIn: recentShifts[0].clock_in
        },
        activeShift: null
      };
    }

    return {
      valid: true,
      error: null,
      details: { worker: worker.full_name },
      activeShift: null
    };

  } catch (error) {
    console.error('Error validating shift consistency:', error);
    return { valid: false, error: error.message, details: {}, activeShift: null };
  }
}

// ============================================================================
// MODULE STATUS TRANSITION VALIDATION
// ============================================================================

/**
 * Validate that a module status transition is valid
 *
 * Rules enforced:
 * 1. Transition must follow valid status progression
 * 2. Cannot skip states (e.g., Not Started → Completed)
 * 3. Special rules for QC Hold and Rework states
 *
 * @param {string} moduleId - Module UUID
 * @param {string} newStatus - Proposed new status
 * @returns {Promise<{valid: boolean, error: string|null, details: Object}>}
 */
export async function validateModuleStatusTransition(moduleId, newStatus) {
  try {
    // Get current module status
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id, status, current_station_id')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return { valid: false, error: 'Module not found', details: { moduleId } };
    }

    const currentStatus = module.status;
    const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!validNextStatuses.includes(newStatus)) {
      return {
        valid: false,
        error: `Invalid status transition: ${currentStatus} → ${newStatus}`,
        details: {
          currentStatus,
          proposedStatus: newStatus,
          validTransitions: validNextStatuses
        }
      };
    }

    // Additional rules for specific transitions
    if (newStatus === 'In Progress' && !module.current_station_id) {
      return {
        valid: false,
        error: 'Module must be assigned to a station before starting work',
        details: { currentStatus, proposedStatus: newStatus }
      };
    }

    if (newStatus === 'Shipped' && currentStatus !== 'Staged') {
      // Allow direct Completed → Shipped but warn
      if (currentStatus === 'Completed') {
        return {
          valid: true,
          error: null,
          details: {
            currentStatus,
            proposedStatus: newStatus,
            warning: 'Skipping Staged status'
          }
        };
      }
    }

    return {
      valid: true,
      error: null,
      details: {
        currentStatus,
        proposedStatus: newStatus,
        validTransitions: validNextStatuses
      }
    };

  } catch (error) {
    console.error('Error validating status transition:', error);
    return { valid: false, error: error.message, details: {} };
  }
}

// ============================================================================
// LONG LEAD ITEMS VALIDATION
// ============================================================================

/**
 * Validate that all long lead items are received before module can start
 *
 * @param {string} moduleId - Module UUID
 * @returns {Promise<{valid: boolean, error: string|null, details: Object}>}
 */
export async function validateLongLeadItems(moduleId) {
  try {
    // Get module's long_leads array
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id, serial_number, long_leads')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return { valid: false, error: 'Module not found', details: { moduleId } };
    }

    // If no long leads, validation passes
    if (!module.long_leads || module.long_leads.length === 0) {
      return { valid: true, error: null, details: { longLeadsRequired: 0 } };
    }

    // Check long_lead_items table for this module
    const { data: items, error: itemsError } = await supabase
      .from('long_lead_items')
      .select('id, part_name, status')
      .eq('module_id', moduleId);

    if (itemsError) {
      return { valid: false, error: 'Failed to check long lead items', details: {} };
    }

    // Check all items are received
    const pendingItems = items?.filter(item =>
      !['Received', 'Verified'].includes(item.status)
    ) || [];

    if (pendingItems.length > 0) {
      return {
        valid: false,
        error: `${pendingItems.length} long lead item(s) not yet received`,
        details: {
          module: module.serial_number,
          totalItems: items?.length || 0,
          pendingItems: pendingItems.map(i => ({ name: i.part_name, status: i.status }))
        }
      };
    }

    return {
      valid: true,
      error: null,
      details: {
        module: module.serial_number,
        longLeadsReceived: items?.length || 0
      }
    };

  } catch (error) {
    console.error('Error validating long lead items:', error);
    return { valid: false, error: error.message, details: {} };
  }
}

// ============================================================================
// BATCH VALIDATION
// ============================================================================

/**
 * Validate multiple crew members for a station assignment
 *
 * @param {string} stationId - Station UUID
 * @param {Array<string>} crewIds - Array of worker UUIDs
 * @returns {Promise<{valid: boolean, errors: Array, validWorkers: Array, invalidWorkers: Array}>}
 */
export async function validateCrewCertifications(stationId, crewIds = []) {
  const results = {
    valid: true,
    errors: [],
    validWorkers: [],
    invalidWorkers: []
  };

  for (const workerId of crewIds) {
    const validation = await validateWorkerCertification(workerId, stationId);
    if (validation.valid) {
      results.validWorkers.push({
        workerId,
        ...validation.details
      });
    } else {
      results.valid = false;
      results.errors.push(validation.error);
      results.invalidWorkers.push({
        workerId,
        error: validation.error,
        ...validation.details
      });
    }
  }

  return results;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  VALID_STATUS_TRANSITIONS,
  QC_REQUIRED_STATIONS,
  INSPECTION_STATION_ORDERS,
  validateStationProgression,
  validateQCGate,
  validateWorkerCertification,
  validateCrewSize,
  validateShiftConsistency,
  validateModuleStatusTransition,
  validateLongLeadItems,
  validateCrewCertifications
};
