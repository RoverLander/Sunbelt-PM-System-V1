// ============================================================================
// inventoryReceiptsService.js - Inventory Receipts Service Layer
// ============================================================================
// Manages inventory receiving records for the PWA Mobile Floor App.
// Tracks items received against purchase orders with photos and quantities.
//
// Created: January 16, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';
import { updateLineItemReceived } from './purchaseOrdersService';

// Storage bucket for receipt photos
const RECEIPTS_BUCKET = 'inventory-receipts';

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Get a single receipt by ID
 *
 * @param {string} receiptId - Receipt UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getReceiptById(receiptId) {
  try {
    const { data, error } = await supabase
      .from('inventory_receipts')
      .select(`
        *,
        purchase_order:purchase_orders(id, po_number, vendor_name, project_id),
        received_by_worker:workers!inventory_receipts_received_by_fkey(id, full_name, employee_id),
        verified_by_user:users!inventory_receipts_verified_by_fkey(id, full_name)
      `)
      .eq('id', receiptId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return { data: null, error };
  }
}

/**
 * Get receipts for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getReceiptsByFactory(factoryId, filters = {}) {
  try {
    let query = supabase
      .from('inventory_receipts')
      .select(`
        *,
        purchase_order:purchase_orders(id, po_number, vendor_name),
        received_by_worker:workers!inventory_receipts_received_by_fkey(id, full_name)
      `)
      .eq('factory_id', factoryId);

    // Apply filters
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.poId) {
      query = query.eq('po_id', filters.poId);
    }

    if (filters.startDate) {
      query = query.gte('received_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('received_at', filters.endDate);
    }

    if (filters.partName) {
      query = query.ilike('part_name', `%${filters.partName}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('received_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return { data: [], error };
  }
}

/**
 * Get receipts for a purchase order
 *
 * @param {string} poId - Purchase order UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getReceiptsByPO(poId) {
  try {
    const { data, error } = await supabase
      .from('inventory_receipts')
      .select(`
        *,
        received_by_worker:workers!inventory_receipts_received_by_fkey(id, full_name, employee_id)
      `)
      .eq('po_id', poId)
      .order('received_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching PO receipts:', error);
    return { data: [], error };
  }
}

/**
 * Get recent receipts for today
 *
 * @param {string} factoryId - Factory UUID
 * @param {number} limit - Max receipts to return
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getTodaysReceipts(factoryId, limit = 50) {
  const today = new Date().toISOString().split('T')[0];

  return getReceiptsByFactory(factoryId, {
    startDate: `${today}T00:00:00`,
    endDate: `${today}T23:59:59`,
    limit
  });
}

/**
 * Get receipts pending verification
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getPendingVerification(factoryId) {
  try {
    const { data, error } = await supabase
      .from('inventory_receipts')
      .select(`
        *,
        purchase_order:purchase_orders(id, po_number, vendor_name),
        received_by_worker:workers!inventory_receipts_received_by_fkey(id, full_name)
      `)
      .eq('factory_id', factoryId)
      .in('status', ['Received', 'Partial', 'Damaged'])
      .is('verified_at', null)
      .order('received_at', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching pending verification:', error);
    return { data: [], error };
  }
}

// ============================================================================
// CREATE FUNCTIONS
// ============================================================================

/**
 * Create a new inventory receipt
 *
 * @param {Object} receiptData - Receipt data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function createReceipt(receiptData) {
  try {
    // Determine status based on quantities
    let status = 'Received';
    if (receiptData.quantity_damaged > 0) {
      status = 'Damaged';
    } else if (receiptData.quantity_received < receiptData.quantity_expected) {
      status = 'Partial';
    }

    const { data, error } = await supabase
      .from('inventory_receipts')
      .insert({
        factory_id: receiptData.factory_id,
        po_id: receiptData.po_id,
        po_line_index: receiptData.po_line_index,
        part_name: receiptData.part_name,
        part_number: receiptData.part_number,
        quantity_expected: receiptData.quantity_expected || 0,
        quantity_received: receiptData.quantity_received,
        quantity_damaged: receiptData.quantity_damaged || 0,
        received_by: receiptData.received_by,           // Worker ID
        received_by_user: receiptData.received_by_user, // User ID (if user received)
        storage_location: receiptData.storage_location,
        gps_location: receiptData.gps_location,
        photo_urls: receiptData.photo_urls || [],
        status,
        notes: receiptData.notes,
        damage_notes: receiptData.damage_notes
      })
      .select()
      .single();

    if (error) throw error;

    // Update PO line item if linked to a PO
    if (receiptData.po_id && receiptData.po_line_index !== undefined) {
      await updateLineItemReceived(
        receiptData.po_id,
        receiptData.po_line_index,
        receiptData.quantity_received
      );
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating receipt:', error);
    return { data: null, error };
  }
}

/**
 * Create receipt from PO line item (PWA flow)
 *
 * @param {string} factoryId - Factory UUID
 * @param {string} poId - Purchase order UUID
 * @param {number} lineIndex - Index into PO line_items array
 * @param {Object} lineItem - Line item data from PO
 * @param {Object} receiveData - Receiving data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function receiveFromPOLine(factoryId, poId, lineIndex, lineItem, receiveData) {
  return createReceipt({
    factory_id: factoryId,
    po_id: poId,
    po_line_index: lineIndex,
    part_name: lineItem.partName,
    part_number: lineItem.partNumber,
    quantity_expected: lineItem.quantity - (lineItem.received || 0),
    quantity_received: receiveData.quantity_received,
    quantity_damaged: receiveData.quantity_damaged || 0,
    received_by: receiveData.worker_id,
    received_by_user: receiveData.user_id,
    storage_location: receiveData.storage_location,
    gps_location: receiveData.gps_location,
    photo_urls: receiveData.photo_urls || [],
    notes: receiveData.notes,
    damage_notes: receiveData.damage_notes
  });
}

/**
 * Create receipt for non-PO item (ad-hoc receiving)
 *
 * @param {Object} receiptData - Receipt data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function receiveAdHocItem(receiptData) {
  return createReceipt({
    ...receiptData,
    po_id: null,
    po_line_index: null,
    quantity_expected: receiptData.quantity_received // For ad-hoc, expected = received
  });
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Update a receipt
 *
 * @param {string} receiptId - Receipt UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateReceipt(receiptId, updates) {
  try {
    const { data, error } = await supabase
      .from('inventory_receipts')
      .update(updates)
      .eq('id', receiptId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating receipt:', error);
    return { data: null, error };
  }
}

/**
 * Verify a receipt (manager action)
 *
 * @param {string} receiptId - Receipt UUID
 * @param {string} verifierId - User UUID verifying
 * @param {string} newStatus - Optional new status (defaults to 'Verified')
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function verifyReceipt(receiptId, verifierId, newStatus = 'Verified') {
  return updateReceipt(receiptId, {
    status: newStatus,
    verified_by: verifierId,
    verified_at: new Date().toISOString()
  });
}

/**
 * Reject a receipt
 *
 * @param {string} receiptId - Receipt UUID
 * @param {string} verifierId - User UUID rejecting
 * @param {string} reason - Rejection reason
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function rejectReceipt(receiptId, verifierId, reason) {
  return updateReceipt(receiptId, {
    status: 'Rejected',
    verified_by: verifierId,
    verified_at: new Date().toISOString(),
    notes: reason
  });
}

/**
 * Add photos to a receipt
 *
 * @param {string} receiptId - Receipt UUID
 * @param {Array<string>} newPhotoUrls - URLs of new photos
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function addPhotosToReceipt(receiptId, newPhotoUrls) {
  try {
    // Get current photos
    const { data: receipt, error: fetchError } = await supabase
      .from('inventory_receipts')
      .select('photo_urls')
      .eq('id', receiptId)
      .single();

    if (fetchError) throw fetchError;

    const photoUrls = [...(receipt.photo_urls || []), ...newPhotoUrls];

    return updateReceipt(receiptId, { photo_urls: photoUrls });
  } catch (error) {
    console.error('Error adding photos:', error);
    return { data: null, error };
  }
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete a receipt (only if not verified)
 *
 * @param {string} receiptId - Receipt UUID
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function deleteReceipt(receiptId) {
  try {
    // Check if receipt is verified
    const { data: receipt, error: fetchError } = await supabase
      .from('inventory_receipts')
      .select('verified_at, photo_urls')
      .eq('id', receiptId)
      .single();

    if (fetchError) throw fetchError;

    if (receipt.verified_at) {
      return {
        success: false,
        error: new Error('Cannot delete a verified receipt')
      };
    }

    // Delete associated photos from storage
    if (receipt.photo_urls && receipt.photo_urls.length > 0) {
      for (const url of receipt.photo_urls) {
        try {
          const path = url.split(`${RECEIPTS_BUCKET}/`)[1];
          if (path) {
            await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
          }
        } catch (photoError) {
          console.warn('Failed to delete photo:', photoError);
        }
      }
    }

    const { error } = await supabase
      .from('inventory_receipts')
      .delete()
      .eq('id', receiptId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return { success: false, error };
  }
}

// ============================================================================
// PHOTO UPLOAD
// ============================================================================

/**
 * Upload a photo for a receipt
 *
 * @param {string} receiptId - Receipt UUID
 * @param {File} file - Image file to upload
 * @returns {Promise<{url: string, error: Error}>}
 */
export async function uploadReceiptPhoto(receiptId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${receiptId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(RECEIPTS_BUCKET)
      .getPublicUrl(fileName);

    // Add URL to receipt
    await addPhotosToReceipt(receiptId, [publicUrl]);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading receipt photo:', error);
    return { url: null, error };
  }
}

/**
 * Upload multiple photos for a receipt
 *
 * @param {string} receiptId - Receipt UUID
 * @param {Array<File>} files - Image files to upload
 * @returns {Promise<{urls: Array<string>, errors: Array}>}
 */
export async function uploadReceiptPhotos(receiptId, files) {
  const urls = [];
  const errors = [];

  for (const file of files) {
    const { url, error } = await uploadReceiptPhoto(receiptId, file);
    if (url) {
      urls.push(url);
    }
    if (error) {
      errors.push({ file: file.name, error });
    }
  }

  return { urls, errors };
}

// ============================================================================
// SUMMARY / ANALYTICS
// ============================================================================

/**
 * Get receipt summary for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getReceiptSummary(factoryId, startDate = null, endDate = null) {
  try {
    let query = supabase
      .from('inventory_receipts')
      .select('status, quantity_received, quantity_damaged')
      .eq('factory_id', factoryId);

    if (startDate) {
      query = query.gte('received_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('received_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    const summary = {
      total: data.length,
      received: data.filter(r => r.status === 'Received').length,
      partial: data.filter(r => r.status === 'Partial').length,
      damaged: data.filter(r => r.status === 'Damaged').length,
      verified: data.filter(r => r.status === 'Verified').length,
      rejected: data.filter(r => r.status === 'Rejected').length,
      totalQuantity: data.reduce((sum, r) => sum + (r.quantity_received || 0), 0),
      damagedQuantity: data.reduce((sum, r) => sum + (r.quantity_damaged || 0), 0)
    };

    return { data: summary, error: null };
  } catch (error) {
    console.error('Error getting receipt summary:', error);
    return { data: null, error };
  }
}

/**
 * Get receiving activity by worker
 *
 * @param {string} factoryId - Factory UUID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getReceivingByWorker(factoryId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('inventory_receipts')
      .select(`
        received_by,
        received_by_worker:workers!inventory_receipts_received_by_fkey(id, full_name, employee_id),
        quantity_received
      `)
      .eq('factory_id', factoryId)
      .gte('received_at', startDate.toISOString())
      .lte('received_at', endDate.toISOString());

    if (error) throw error;

    // Group by worker
    const byWorker = {};
    for (const receipt of data) {
      const workerId = receipt.received_by;
      if (!workerId) continue;

      if (!byWorker[workerId]) {
        byWorker[workerId] = {
          worker: receipt.received_by_worker,
          receiptCount: 0,
          totalQuantity: 0
        };
      }

      byWorker[workerId].receiptCount++;
      byWorker[workerId].totalQuantity += receipt.quantity_received || 0;
    }

    return {
      data: Object.values(byWorker).sort((a, b) => b.receiptCount - a.receiptCount),
      error: null
    };
  } catch (error) {
    console.error('Error getting receiving by worker:', error);
    return { data: [], error };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get receipt status color
 *
 * @param {string} status - Receipt status
 * @returns {string} Hex color code
 */
export function getReceiptStatusColor(status) {
  const colors = {
    'Received': '#22c55e',    // green
    'Partial': '#f97316',     // orange
    'Damaged': '#ef4444',     // red
    'Rejected': '#dc2626',    // dark red
    'Verified': '#14b8a6'     // teal
  };
  return colors[status] || '#64748b';
}

/**
 * Get receipt status icon
 *
 * @param {string} status - Receipt status
 * @returns {string} Icon name (lucide)
 */
export function getReceiptStatusIcon(status) {
  const icons = {
    'Received': 'CheckCircle2',
    'Partial': 'AlertCircle',
    'Damaged': 'XCircle',
    'Rejected': 'Ban',
    'Verified': 'BadgeCheck'
  };
  return icons[status] || 'Circle';
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Fetch
  getReceiptById,
  getReceiptsByFactory,
  getReceiptsByPO,
  getTodaysReceipts,
  getPendingVerification,

  // Create
  createReceipt,
  receiveFromPOLine,
  receiveAdHocItem,

  // Update
  updateReceipt,
  verifyReceipt,
  rejectReceipt,
  addPhotosToReceipt,

  // Delete
  deleteReceipt,

  // Photo Upload
  uploadReceiptPhoto,
  uploadReceiptPhotos,

  // Summary
  getReceiptSummary,
  getReceivingByWorker,

  // Utility
  getReceiptStatusColor,
  getReceiptStatusIcon
};
