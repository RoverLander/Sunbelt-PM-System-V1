// ============================================================================
// syncManager.js - Offline Sync Manager for PWA
// ============================================================================
// Handles syncing pending offline actions with Supabase when connectivity
// is restored. Processes QC submissions, station moves, inventory receipts.
//
// Created: January 17, 2026
// ============================================================================

import { supabase } from '../../utils/supabaseClient';
import {
  getPendingActions,
  getFailedActions,
  updateActionStatus,
  cleanupSyncedActions,
  getPhotosForAction,
  markPhotoUploaded,
  cleanupUploadedPhotos,
  setLastSync,
  getPendingActionCounts,
  ACTION_TYPES,
  SYNC_STATUS
} from './indexedDB';

// Service imports for syncing actions
import { createQCRecord, uploadQCPhoto } from '../../services/qcService';
import { createReceipt, uploadReceiptPhoto } from '../../services/inventoryReceiptsService';
import { moveModuleToStation } from '../../services/modulesService';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const PHOTO_CHUNK_SIZE = 3; // Upload photos in parallel chunks

// ============================================================================
// SYNC MANAGER CLASS
// ============================================================================

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = new Set();
    this.onlineListener = null;
  }

  // ==========================================================================
  // LISTENER MANAGEMENT
  // ==========================================================================

  /**
   * Add a sync status listener
   * @param {Function} listener - Callback (status, counts) => void
   * @returns {Function} Unsubscribe function
   */
  addListener(listener) {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  /**
   * Notify all listeners of sync status change
   * @param {string} status - 'idle' | 'syncing' | 'error' | 'complete'
   * @param {Object} counts - Pending action counts
   */
  notifyListeners(status, counts = null) {
    this.syncListeners.forEach(listener => {
      try {
        listener(status, counts);
      } catch (err) {
        console.error('Sync listener error:', err);
      }
    });
  }

  // ==========================================================================
  // ONLINE/OFFLINE HANDLING
  // ==========================================================================

  /**
   * Start listening for online/offline events
   */
  startOnlineListener() {
    if (this.onlineListener) return;

    this.onlineListener = () => {
      if (navigator.onLine) {
        console.log('[SyncManager] Online - triggering sync');
        this.syncAll();
      }
    };

    window.addEventListener('online', this.onlineListener);
  }

  /**
   * Stop listening for online/offline events
   */
  stopOnlineListener() {
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
      this.onlineListener = null;
    }
  }

  /**
   * Check if currently online
   * @returns {boolean}
   */
  isOnline() {
    return navigator.onLine;
  }

  // ==========================================================================
  // MAIN SYNC ORCHESTRATION
  // ==========================================================================

  /**
   * Sync all pending actions
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} Sync results
   */
  async syncAll(options = {}) {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress');
      return { success: false, reason: 'sync_in_progress' };
    }

    // Check online status
    if (!this.isOnline()) {
      console.log('[SyncManager] Offline - skipping sync');
      return { success: false, reason: 'offline' };
    }

    this.isSyncing = true;
    this.notifyListeners('syncing');

    const results = {
      success: true,
      synced: 0,
      failed: 0,
      photosUploaded: 0,
      errors: []
    };

    try {
      // 1. Get pending actions
      const pendingActions = await getPendingActions();
      console.log(`[SyncManager] Found ${pendingActions.length} pending actions`);

      // 2. Process each action
      for (const action of pendingActions) {
        try {
          const actionResult = await this.processAction(action);
          if (actionResult.success) {
            results.synced++;
            results.photosUploaded += actionResult.photosUploaded || 0;
          } else {
            results.failed++;
            results.errors.push({
              actionId: action.id,
              type: action.action_type,
              error: actionResult.error
            });
          }
        } catch (err) {
          results.failed++;
          results.errors.push({
            actionId: action.id,
            type: action.action_type,
            error: err.message
          });
        }
      }

      // 3. Retry failed actions (with retry limit)
      if (options.retryFailed !== false) {
        const failedActions = await getFailedActions();
        const retryableActions = failedActions.filter(a => a.retry_count < MAX_RETRIES);

        for (const action of retryableActions) {
          try {
            const actionResult = await this.processAction(action);
            if (actionResult.success) {
              results.synced++;
            }
          } catch (err) {
            // Already marked as failed in processAction
          }
        }
      }

      // 4. Cleanup synced actions and uploaded photos
      await cleanupSyncedActions();
      await cleanupUploadedPhotos();

      // 5. Update last sync timestamp
      await setLastSync();

      // 6. Get final counts
      const counts = await getPendingActionCounts();

      if (results.failed > 0) {
        results.success = false;
        this.notifyListeners('error', counts);
      } else {
        this.notifyListeners('complete', counts);
      }

      console.log(`[SyncManager] Sync complete: ${results.synced} synced, ${results.failed} failed`);
      return results;

    } catch (err) {
      console.error('[SyncManager] Sync error:', err);
      results.success = false;
      results.errors.push({ error: err.message });
      this.notifyListeners('error');
      return results;

    } finally {
      this.isSyncing = false;
    }
  }

  // ==========================================================================
  // ACTION PROCESSORS
  // ==========================================================================

  /**
   * Process a single pending action
   * @param {Object} action - Pending action object
   * @returns {Promise<Object>} Result { success, error, photosUploaded }
   */
  async processAction(action) {
    console.log(`[SyncManager] Processing action ${action.id}: ${action.action_type}`);

    // Mark as syncing
    await updateActionStatus(action.id, SYNC_STATUS.SYNCING);

    try {
      let result;

      switch (action.action_type) {
        case ACTION_TYPES.QC_SUBMIT:
          result = await this.syncQCSubmission(action);
          break;

        case ACTION_TYPES.STATION_MOVE:
          result = await this.syncStationMove(action);
          break;

        case ACTION_TYPES.INVENTORY_RECEIVE:
          result = await this.syncInventoryReceive(action);
          break;

        case ACTION_TYPES.CLOCK_IN:
        case ACTION_TYPES.CLOCK_OUT:
          result = await this.syncClockAction(action);
          break;

        default:
          throw new Error(`Unknown action type: ${action.action_type}`);
      }

      if (result.success) {
        await updateActionStatus(action.id, SYNC_STATUS.SYNCED);
      } else {
        await updateActionStatus(action.id, SYNC_STATUS.FAILED, result.error);
      }

      return result;

    } catch (err) {
      console.error(`[SyncManager] Action ${action.id} failed:`, err);
      await updateActionStatus(action.id, SYNC_STATUS.FAILED, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Sync QC submission
   * @param {Object} action - Action with QC payload
   * @returns {Promise<Object>}
   */
  async syncQCSubmission(action) {
    const { payload } = action;

    // 1. Upload any queued photos first
    const photos = await getPhotosForAction(action.id);
    const photoUrls = [...(payload.photos || [])];
    let photosUploaded = 0;

    for (const photo of photos) {
      if (!photo.uploaded) {
        try {
          // Create a File object from the blob
          const file = new File([photo.blob], photo.filename, { type: photo.blob.type });

          // Upload to Supabase storage
          const { url, error } = await this.uploadPhotoToStorage(
            'qc-photos',
            `qc/${payload.module_id}`,
            file
          );

          if (url) {
            photoUrls.push(url);
            await markPhotoUploaded(photo.id, url);
            photosUploaded++;
          } else {
            console.warn('Photo upload failed:', error);
          }
        } catch (err) {
          console.warn('Photo upload error:', err);
        }
      }
    }

    // 2. Create QC record
    const { data, error } = await createQCRecord({
      ...payload,
      photos: photoUrls
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, photosUploaded };
  }

  /**
   * Sync station move
   * @param {Object} action - Action with station move payload
   * @returns {Promise<Object>}
   */
  async syncStationMove(action) {
    const { payload } = action;

    const { data, error } = await moveModuleToStation(
      payload.module_id,
      payload.station_id,
      payload.lead_id,
      payload.crew_ids || []
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * Sync inventory receive
   * @param {Object} action - Action with inventory payload
   * @returns {Promise<Object>}
   */
  async syncInventoryReceive(action) {
    const { payload } = action;

    // 1. Upload any queued photos first
    const photos = await getPhotosForAction(action.id);
    const photoUrls = [...(payload.photo_urls || [])];
    let photosUploaded = 0;

    for (const photo of photos) {
      if (!photo.uploaded) {
        try {
          const file = new File([photo.blob], photo.filename, { type: photo.blob.type });

          const { url, error } = await this.uploadPhotoToStorage(
            'inventory-receipts',
            `receipts/${payload.po_id || 'adhoc'}`,
            file
          );

          if (url) {
            photoUrls.push(url);
            await markPhotoUploaded(photo.id, url);
            photosUploaded++;
          } else {
            console.warn('Photo upload failed:', error);
          }
        } catch (err) {
          console.warn('Photo upload error:', err);
        }
      }
    }

    // 2. Create receipt
    const { data, error } = await createReceipt({
      ...payload,
      photo_urls: photoUrls
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, photosUploaded };
  }

  /**
   * Sync clock in/out action
   * @param {Object} action - Action with clock payload
   * @returns {Promise<Object>}
   */
  async syncClockAction(action) {
    const { payload } = action;

    // Clock in/out handled by workers service
    // This is a placeholder for future implementation
    const table = action.action_type === ACTION_TYPES.CLOCK_IN ? 'worker_shifts' : 'worker_shifts';

    if (action.action_type === ACTION_TYPES.CLOCK_IN) {
      const { data, error } = await supabase
        .from('worker_shifts')
        .insert({
          worker_id: payload.worker_id,
          factory_id: payload.factory_id,
          clock_in: payload.timestamp,
          clock_in_method: 'pwa_offline'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };

    } else {
      // Clock out - update existing shift
      const { data, error } = await supabase
        .from('worker_shifts')
        .update({
          clock_out: payload.timestamp,
          clock_out_method: 'pwa_offline'
        })
        .eq('id', payload.shift_id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    }
  }

  // ==========================================================================
  // PHOTO UPLOAD HELPERS
  // ==========================================================================

  /**
   * Upload a photo to Supabase storage
   * @param {string} bucket - Storage bucket name
   * @param {string} folder - Folder path within bucket
   * @param {File} file - File to upload
   * @returns {Promise<{url: string, error: Error}>}
   */
  async uploadPhotoToStorage(bucket, folder, file) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return { url: publicUrl, error: null };

    } catch (error) {
      console.error('Storage upload error:', error);
      return { url: null, error };
    }
  }

  /**
   * Upload multiple photos in chunks
   * @param {string} bucket - Storage bucket
   * @param {string} folder - Folder path
   * @param {Array<File>} files - Files to upload
   * @returns {Promise<{urls: Array<string>, errors: Array}>}
   */
  async uploadPhotosInChunks(bucket, folder, files) {
    const urls = [];
    const errors = [];

    // Process in chunks to avoid overwhelming the connection
    for (let i = 0; i < files.length; i += PHOTO_CHUNK_SIZE) {
      const chunk = files.slice(i, i + PHOTO_CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map(file => this.uploadPhotoToStorage(bucket, folder, file))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.url) {
          urls.push(result.value.url);
        } else {
          errors.push({
            file: chunk[index].name,
            error: result.reason || result.value?.error
          });
        }
      });
    }

    return { urls, errors };
  }

  // ==========================================================================
  // STATUS & DIAGNOSTICS
  // ==========================================================================

  /**
   * Get current sync status
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const counts = await getPendingActionCounts();
    return {
      isSyncing: this.isSyncing,
      isOnline: this.isOnline(),
      ...counts
    };
  }

  /**
   * Force retry all failed actions
   * @returns {Promise<Object>}
   */
  async retryFailed() {
    // Reset retry counts for failed actions
    const failedActions = await getFailedActions();

    for (const action of failedActions) {
      await updateActionStatus(action.id, SYNC_STATUS.PENDING);
    }

    // Trigger sync
    return this.syncAll();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const syncManager = new SyncManager();

// ============================================================================
// BACKGROUND SYNC REGISTRATION
// ============================================================================

/**
 * Register for background sync (if supported)
 * @returns {Promise<boolean>}
 */
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-pending-actions');
      console.log('[SyncManager] Background sync registered');
      return true;
    } catch (err) {
      console.warn('[SyncManager] Background sync registration failed:', err);
      return false;
    }
  }
  return false;
}

/**
 * Handle background sync event (called from service worker)
 * @param {Event} event - Sync event
 */
export async function handleBackgroundSync(event) {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncManager.syncAll());
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const syncAll = () => syncManager.syncAll();
export const getStatus = () => syncManager.getStatus();
export const retryFailed = () => syncManager.retryFailed();
export const addSyncListener = (listener) => syncManager.addListener(listener);
export const startOnlineListener = () => syncManager.startOnlineListener();
export const stopOnlineListener = () => syncManager.stopOnlineListener();
export const isOnline = () => syncManager.isOnline();

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default syncManager;
