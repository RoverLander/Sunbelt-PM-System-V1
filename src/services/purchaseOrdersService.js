// ============================================================================
// purchaseOrdersService.js - Purchase Orders Service Layer
// ============================================================================
// Manages purchase orders for inventory and materials tracking.
// Supports the PWA inventory receiving workflow.
//
// Created: January 16, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Get a single purchase order by ID
 *
 * @param {string} poId - Purchase order UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getPurchaseOrderById(poId) {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        project:projects(id, name, project_number),
        factory:factories(id, name, code),
        created_by_user:users!purchase_orders_created_by_fkey(id, name),
        approved_by_user:users!purchase_orders_approved_by_fkey(id, name)
      `)
      .eq('id', poId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return { data: null, error };
  }
}

/**
 * Get purchase orders for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @param {Object} filters - Optional filters
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getPurchaseOrdersByFactory(factoryId, filters = {}) {
  try {
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        project:projects(id, name, project_number),
        factory:factories(id, name, code)
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

    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    if (filters.vendor) {
      query = query.ilike('vendor_name', `%${filters.vendor}%`);
    }

    if (filters.startDate) {
      query = query.gte('order_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('order_date', filters.endDate);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return { data: [], error };
  }
}

/**
 * Get pending purchase orders (awaiting delivery)
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getPendingPurchaseOrders(factoryId) {
  return getPurchaseOrdersByFactory(factoryId, {
    status: ['Ordered', 'Partial']
  });
}

/**
 * Get purchase orders by project
 *
 * @param {string} projectId - Project UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getPurchaseOrdersByProject(projectId) {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        factory:factories(id, name, code)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching project purchase orders:', error);
    return { data: [], error };
  }
}

/**
 * Search purchase orders by PO number
 *
 * @param {string} factoryId - Factory UUID
 * @param {string} searchTerm - PO number search term
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function searchPurchaseOrders(factoryId, searchTerm) {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        id, po_number, vendor_name, status, expected_delivery, total,
        project:projects(id, name, project_number)
      `)
      .eq('factory_id', factoryId)
      .ilike('po_number', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error searching purchase orders:', error);
    return { data: [], error };
  }
}

// ============================================================================
// CREATE FUNCTIONS
// ============================================================================

/**
 * Generate next PO number for a factory
 *
 * @param {string} factoryCode - Factory code (e.g., 'NW', 'SE')
 * @returns {Promise<string>} Generated PO number
 */
export async function generatePONumber(factoryCode) {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `PO-${factoryCode}-${year}`;

  // Get highest PO number with this prefix
  const { data } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .ilike('po_number', `${prefix}%`)
    .order('po_number', { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].po_number.split('-').pop()) || 0;
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Create a new purchase order
 *
 * @param {Object} poData - Purchase order data
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function createPurchaseOrder(poData) {
  try {
    // Get factory code for PO number generation
    const { data: factory } = await supabase
      .from('factories')
      .select('code')
      .eq('id', poData.factory_id)
      .single();

    const poNumber = poData.po_number || await generatePONumber(factory?.code || 'XX');

    // Calculate totals from line items
    const lineItems = poData.line_items || [];
    const subtotal = lineItems.reduce((sum, item) => sum + (item.totalCost || item.quantity * item.unitCost || 0), 0);
    const tax = poData.tax || 0;
    const shipping = poData.shipping || 0;
    const total = subtotal + tax + shipping;

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert({
        factory_id: poData.factory_id,
        project_id: poData.project_id,
        po_number: poNumber,
        vendor_name: poData.vendor_name,
        vendor_contact: poData.vendor_contact,
        vendor_email: poData.vendor_email,
        vendor_phone: poData.vendor_phone,
        status: poData.status || 'Draft',
        order_date: poData.order_date,
        expected_delivery: poData.expected_delivery,
        line_items: lineItems,
        subtotal,
        tax,
        shipping,
        total,
        notes: poData.notes,
        attachments: poData.attachments || [],
        created_by: poData.created_by
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return { data: null, error };
  }
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Update a purchase order
 *
 * @param {string} poId - Purchase order UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updatePurchaseOrder(poId, updates) {
  try {
    // Recalculate totals if line items changed
    if (updates.line_items) {
      const lineItems = updates.line_items;
      updates.subtotal = lineItems.reduce((sum, item) => sum + (item.totalCost || item.quantity * item.unitCost || 0), 0);
      updates.total = updates.subtotal + (updates.tax || 0) + (updates.shipping || 0);
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', poId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return { data: null, error };
  }
}

/**
 * Update PO status
 *
 * @param {string} poId - Purchase order UUID
 * @param {string} newStatus - New status value
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updatePOStatus(poId, newStatus) {
  const updates = { status: newStatus };

  // Set actual_delivery when fully received
  if (newStatus === 'Received') {
    updates.actual_delivery = new Date().toISOString().split('T')[0];
  }

  return updatePurchaseOrder(poId, updates);
}

/**
 * Approve a purchase order
 *
 * @param {string} poId - Purchase order UUID
 * @param {string} approverId - User UUID approving
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function approvePurchaseOrder(poId, approverId) {
  return updatePurchaseOrder(poId, {
    status: 'Approved',
    approved_by: approverId,
    approved_at: new Date().toISOString()
  });
}

/**
 * Mark PO as ordered
 *
 * @param {string} poId - Purchase order UUID
 * @param {Date} orderDate - Date order was placed
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function markPOOrdered(poId, orderDate = new Date()) {
  return updatePurchaseOrder(poId, {
    status: 'Ordered',
    order_date: orderDate.toISOString().split('T')[0]
  });
}

/**
 * Update line item received quantity
 *
 * @param {string} poId - Purchase order UUID
 * @param {number} lineIndex - Index of line item in array
 * @param {number} quantityReceived - Quantity received
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateLineItemReceived(poId, lineIndex, quantityReceived) {
  try {
    // Get current PO
    const { data: po, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('line_items, status')
      .eq('id', poId)
      .single();

    if (fetchError) throw fetchError;

    // Update line item
    const lineItems = [...po.line_items];
    if (lineIndex >= 0 && lineIndex < lineItems.length) {
      lineItems[lineIndex] = {
        ...lineItems[lineIndex],
        received: (lineItems[lineIndex].received || 0) + quantityReceived,
        lastReceivedAt: new Date().toISOString()
      };
    }

    // Check if all items fully received
    const allReceived = lineItems.every(item =>
      (item.received || 0) >= (item.quantity || 0)
    );
    const someReceived = lineItems.some(item =>
      (item.received || 0) > 0
    );

    let newStatus = po.status;
    if (allReceived) {
      newStatus = 'Received';
    } else if (someReceived && po.status === 'Ordered') {
      newStatus = 'Partial';
    }

    return updatePurchaseOrder(poId, {
      line_items: lineItems,
      status: newStatus,
      actual_delivery: allReceived ? new Date().toISOString().split('T')[0] : null
    });
  } catch (error) {
    console.error('Error updating line item:', error);
    return { data: null, error };
  }
}

/**
 * Add line item to PO
 *
 * @param {string} poId - Purchase order UUID
 * @param {Object} lineItem - Line item to add
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function addLineItem(poId, lineItem) {
  try {
    const { data: po, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('line_items')
      .eq('id', poId)
      .single();

    if (fetchError) throw fetchError;

    const lineItems = [...(po.line_items || []), {
      ...lineItem,
      totalCost: lineItem.quantity * lineItem.unitCost,
      received: 0
    }];

    return updatePurchaseOrder(poId, { line_items: lineItems });
  } catch (error) {
    console.error('Error adding line item:', error);
    return { data: null, error };
  }
}

/**
 * Remove line item from PO
 *
 * @param {string} poId - Purchase order UUID
 * @param {number} lineIndex - Index of line item to remove
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function removeLineItem(poId, lineIndex) {
  try {
    const { data: po, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('line_items')
      .eq('id', poId)
      .single();

    if (fetchError) throw fetchError;

    const lineItems = po.line_items.filter((_, index) => index !== lineIndex);

    return updatePurchaseOrder(poId, { line_items: lineItems });
  } catch (error) {
    console.error('Error removing line item:', error);
    return { data: null, error };
  }
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete a purchase order (only if Draft or Cancelled)
 *
 * @param {string} poId - Purchase order UUID
 * @returns {Promise<{success: boolean, error: Error}>}
 */
export async function deletePurchaseOrder(poId) {
  try {
    // Only allow deletion of Draft or Cancelled POs
    const { data: po, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('status')
      .eq('id', poId)
      .single();

    if (fetchError) throw fetchError;

    if (!['Draft', 'Cancelled'].includes(po.status)) {
      return {
        success: false,
        error: new Error('Only Draft or Cancelled purchase orders can be deleted')
      };
    }

    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', poId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return { success: false, error };
  }
}

/**
 * Cancel a purchase order
 *
 * @param {string} poId - Purchase order UUID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function cancelPurchaseOrder(poId, reason = '') {
  return updatePurchaseOrder(poId, {
    status: 'Cancelled',
    notes: reason ? `CANCELLED: ${reason}` : 'CANCELLED'
  });
}

// ============================================================================
// SUMMARY / ANALYTICS
// ============================================================================

/**
 * Get PO summary stats for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function getPOSummary(factoryId) {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('status, total')
      .eq('factory_id', factoryId);

    if (error) throw error;

    const summary = {
      total: data.length,
      draft: data.filter(po => po.status === 'Draft').length,
      pendingApproval: data.filter(po => po.status === 'Pending Approval').length,
      ordered: data.filter(po => po.status === 'Ordered').length,
      partial: data.filter(po => po.status === 'Partial').length,
      received: data.filter(po => po.status === 'Received').length,
      totalValue: data.reduce((sum, po) => sum + (po.total || 0), 0),
      pendingValue: data
        .filter(po => ['Ordered', 'Partial'].includes(po.status))
        .reduce((sum, po) => sum + (po.total || 0), 0)
    };

    return { data: summary, error: null };
  } catch (error) {
    console.error('Error getting PO summary:', error);
    return { data: null, error };
  }
}

/**
 * Get overdue purchase orders
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getOverduePurchaseOrders(factoryId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        project:projects(id, name, project_number)
      `)
      .eq('factory_id', factoryId)
      .in('status', ['Ordered', 'Partial'])
      .lt('expected_delivery', today)
      .order('expected_delivery');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting overdue POs:', error);
    return { data: [], error };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get PO status color
 *
 * @param {string} status - PO status
 * @returns {string} Hex color code
 */
export function getPOStatusColor(status) {
  const colors = {
    'Draft': '#64748b',           // gray
    'Pending Approval': '#f59e0b', // amber
    'Approved': '#3b82f6',        // blue
    'Ordered': '#8b5cf6',         // purple
    'Partial': '#f97316',         // orange
    'Received': '#22c55e',        // green
    'Closed': '#14b8a6',          // teal
    'Cancelled': '#ef4444'        // red
  };
  return colors[status] || '#64748b';
}

/**
 * Format currency value
 *
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Fetch
  getPurchaseOrderById,
  getPurchaseOrdersByFactory,
  getPendingPurchaseOrders,
  getPurchaseOrdersByProject,
  searchPurchaseOrders,

  // Create
  generatePONumber,
  createPurchaseOrder,

  // Update
  updatePurchaseOrder,
  updatePOStatus,
  approvePurchaseOrder,
  markPOOrdered,
  updateLineItemReceived,
  addLineItem,
  removeLineItem,

  // Delete
  deletePurchaseOrder,
  cancelPurchaseOrder,

  // Summary
  getPOSummary,
  getOverduePurchaseOrders,

  // Utility
  getPOStatusColor,
  formatCurrency
};
