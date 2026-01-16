// ============================================================================
// qcService.js - Quality Control Service Layer
// ============================================================================
// Manages QC inspections, checklists, and rework workflows.
//
// Created: January 15, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Get a QC record by ID
 *
 * @param {string} qcId - QC record UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getQCRecordById(qcId) {
  try {
    const { data, error } = await supabase
      .from('qc_records')
      .select(`
        *,
        module:modules(id, serial_number, name, project_id),
        station:station_templates(id, name, code, color),
        inspector:workers!inspector_id(id, full_name),
        inspector_user:users!inspector_user_id(id, full_name)
      `)
      .eq('id', qcId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching QC record:', error);
    return { data: null, error };
  }
}

/**
 * Get QC records for a module
 *
 * @param {string} moduleId - Module UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getQCRecordsByModule(moduleId) {
  try {
    const { data, error } = await supabase
      .from('qc_records')
      .select(`
        *,
        station:station_templates(id, name, code, color),
        inspector:workers!inspector_id(id, full_name),
        inspector_user:users!inspector_user_id(id, full_name)
      `)
      .eq('module_id', moduleId)
      .order('inspected_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching QC records:', error);
    return { data: [], error };
  }
}

/**
 * Get QC records for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getQCRecordsByFactory(factoryId, filters = {}) {
  try {
    let query = supabase
      .from('qc_records')
      .select(`
        *,
        module:modules(id, serial_number, name, project_id, project:projects(name)),
        station:station_templates(id, name, code, color),
        inspector:workers!inspector_id(id, full_name),
        inspector_user:users!inspector_user_id(id, full_name)
      `)
      .eq('factory_id', factoryId);

    // Apply filters - 'result' maps to 'status' in schema
    if (filters.result) {
      query = query.eq('status', filters.result);
    }
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
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching QC records:', error);
    return { data: [], error };
  }
}

/**
 * Get pending inspections for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getPendingInspections(factoryId) {
  try {
    // Get modules at inspection stations that haven't been inspected
    const { data: inspectionStations, error: stationsError } = await supabase
      .from('station_templates')
      .select('id')
      .eq('is_inspection_station', true);

    if (stationsError) throw stationsError;

    const stationIds = inspectionStations?.map(s => s.id) || [];

    if (stationIds.length === 0) {
      return { data: [], error: null };
    }

    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        *,
        project:projects(id, name, project_number),
        current_station:station_templates(id, name, code, color)
      `)
      .eq('factory_id', factoryId)
      .in('current_station_id', stationIds)
      .not('status', 'in', '("Completed", "Shipped")')
      .order('actual_start', { ascending: true });

    if (modulesError) throw modulesError;

    return { data: modules || [], error: null };
  } catch (error) {
    console.error('Error fetching pending inspections:', error);
    return { data: [], error };
  }
}

/**
 * Get QC summary stats for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getQCSummary(factoryId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('qc_records')
      .select('status, passed')
      .eq('factory_id', factoryId)
      .gte('inspected_at', startDate.toISOString())
      .lte('inspected_at', endDate.toISOString());

    if (error) throw error;

    const total = data?.length || 0;
    const passed = data?.filter(r => r.status === 'Passed' || r.passed === true).length || 0;
    const failed = data?.filter(r => r.status === 'Failed' || r.passed === false).length || 0;
    const pending = data?.filter(r => r.status === 'Pending').length || 0;

    return {
      data: {
        total,
        passed,
        failed,
        pending,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching QC summary:', error);
    return { data: { total: 0, passed: 0, failed: 0, pending: 0, passRate: 0 }, error };
  }
}

// ============================================================================
// CREATE FUNCTIONS
// ============================================================================

/**
 * Create a new QC record
 *
 * @param {Object} qcData - QC record data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function createQCRecord(qcData) {
  try {
    // Determine passed status from result
    const passed = qcData.result === 'Pass';
    const status = qcData.result === 'Fail' ? 'Failed' :
                   qcData.result === 'Pass' ? 'Passed' : 'Pending';

    const { data, error } = await supabase
      .from('qc_records')
      .insert({
        factory_id: qcData.factory_id,
        module_id: qcData.module_id,
        station_id: qcData.station_id,
        inspector_id: qcData.inspector_id, // Worker ID
        inspector_user_id: qcData.inspector_user_id, // System user ID
        status: status,
        passed: passed,
        checklist_results: qcData.checklist_responses || [],
        notes: qcData.notes,
        defects_found: qcData.defects_found || [],
        photo_urls: qcData.photos || [],
        rework_required: qcData.result === 'Fail',
        inspected_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // If failed, update module status
    if (qcData.result === 'Fail') {
      await supabase
        .from('modules')
        .update({
          status: 'QC Hold',
          updated_at: new Date().toISOString()
        })
        .eq('id', qcData.module_id);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating QC record:', error);
    return { data: null, error };
  }
}

/**
 * Submit a QC checklist for a module at a station
 *
 * @param {string} moduleId - Module UUID
 * @param {string} stationId - Station UUID
 * @param {string} inspectorId - Inspector user UUID
 * @param {Object} checklistResponses - Object with checklist item responses
 * @param {string} notes - Additional notes
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function submitQCChecklist(moduleId, stationId, inspectorId, checklistResponses, notes = '') {
  try {
    // Get module's factory
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('factory_id')
      .eq('id', moduleId)
      .single();

    if (moduleError) throw moduleError;

    // Determine result based on responses
    const responses = Object.values(checklistResponses);
    const allPassed = responses.every(r => r === true || r === 'pass' || r === 'Pass');
    const anyFailed = responses.some(r => r === false || r === 'fail' || r === 'Fail');
    const result = anyFailed ? 'Fail' : allPassed ? 'Pass' : 'Conditional';

    // Find failed items
    const defects = Object.entries(checklistResponses)
      .filter(([_k, v]) => v === false || v === 'fail' || v === 'Fail')
      .map(([k, _v]) => ({ item: k, type: 'checklist_fail' }));

    return await createQCRecord({
      factory_id: module.factory_id,
      module_id: moduleId,
      station_id: stationId,
      inspector_id: inspectorId,
      result,
      checklist_responses: checklistResponses,
      notes,
      defects_found: defects
    });
  } catch (error) {
    console.error('Error submitting QC checklist:', error);
    return { data: null, error };
  }
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Update a QC record
 *
 * @param {string} qcId - QC record UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateQCRecord(qcId, updates) {
  try {
    const { data, error } = await supabase
      .from('qc_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', qcId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating QC record:', error);
    return { data: null, error };
  }
}

/**
 * Mark rework as completed
 *
 * @param {string} qcId - QC record UUID
 * @param {string} completedBy - User ID who completed the rework
 * @param {string} notes - Rework completion notes
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function completeRework(qcId, completedBy, notes = '') {
  try {
    const { data, error } = await supabase
      .from('qc_records')
      .update({
        rework_completed: true,
        rework_completed_at: new Date().toISOString(),
        rework_completed_by: completedBy,
        rework_notes: notes
      })
      .eq('id', qcId)
      .select('module_id')
      .single();

    if (error) throw error;

    // Update module status back to In Queue
    if (data?.module_id) {
      await supabase
        .from('modules')
        .update({
          status: 'In Queue',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.module_id);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error completing rework:', error);
    return { data: null, error };
  }
}

// ============================================================================
// DEFECT TRACKING
// ============================================================================

/**
 * Add a defect to a QC record
 *
 * @param {string} qcId - QC record UUID
 * @param {Object} defect - Defect details
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function addDefect(qcId, defect) {
  try {
    // Get current defects
    const { data: record, error: fetchError } = await supabase
      .from('qc_records')
      .select('defects_found')
      .eq('id', qcId)
      .single();

    if (fetchError) throw fetchError;

    const defects = record.defects_found || [];
    defects.push({
      ...defect,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    });

    const { error: updateError } = await supabase
      .from('qc_records')
      .update({ defects_found: defects })
      .eq('id', qcId);

    if (updateError) throw updateError;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error adding defect:', error);
    return { success: false, error };
  }
}

/**
 * Get defect statistics for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getDefectStats(factoryId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('qc_records')
      .select('defects_found, station_id')
      .eq('factory_id', factoryId)
      .gte('inspected_at', startDate.toISOString())
      .lte('inspected_at', endDate.toISOString());

    if (error) throw error;

    // Count defects by type
    const defectCounts = {};
    const stationDefects = {};

    (data || []).forEach(record => {
      (record.defects_found || []).forEach(defect => {
        const type = defect.type || 'unknown';
        defectCounts[type] = (defectCounts[type] || 0) + 1;

        if (record.station_id) {
          stationDefects[record.station_id] = (stationDefects[record.station_id] || 0) + 1;
        }
      });
    });

    return {
      data: {
        totalDefects: Object.values(defectCounts).reduce((a, b) => a + b, 0),
        byType: defectCounts,
        byStation: stationDefects
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching defect stats:', error);
    return { data: { totalDefects: 0, byType: {}, byStation: {} }, error };
  }
}

// ============================================================================
// PHOTO HANDLING
// ============================================================================

/**
 * Upload a QC photo
 *
 * @param {string} qcId - QC record UUID
 * @param {File} file - Image file
 * @returns {Promise<{url: string, error: Error}>}
 */
export async function uploadQCPhoto(qcId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `qc/${qcId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('qc-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('qc-photos')
      .getPublicUrl(fileName);

    // Add to QC record photo_urls array
    const { data: record, error: fetchError } = await supabase
      .from('qc_records')
      .select('photo_urls')
      .eq('id', qcId)
      .single();

    if (fetchError) throw fetchError;

    const photo_urls = record.photo_urls || [];
    photo_urls.push(publicUrl);

    await supabase
      .from('qc_records')
      .update({ photo_urls })
      .eq('id', qcId);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading QC photo:', error);
    return { url: null, error };
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  getQCRecordById,
  getQCRecordsByModule,
  getQCRecordsByFactory,
  getPendingInspections,
  getQCSummary,
  createQCRecord,
  submitQCChecklist,
  updateQCRecord,
  completeRework,
  addDefect,
  getDefectStats,
  uploadQCPhoto
};
