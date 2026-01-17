// ============================================================================
// indexedDB.js - IndexedDB Wrapper for PWA Offline Storage
// ============================================================================
// Provides a simple API for storing and retrieving data in IndexedDB.
// Used for caching modules, stations, workers, and pending offline actions.
//
// Created: January 17, 2026
// ============================================================================

import { openDB } from 'idb';

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

const DB_NAME = 'sunbelt_pwa';
const DB_VERSION = 1;

// Store names
export const STORES = {
  MODULES: 'modules',
  STATIONS: 'stations',
  WORKERS: 'workers',
  PURCHASE_ORDERS: 'purchase_orders',
  PENDING_ACTIONS: 'pending_actions',
  PHOTO_QUEUE: 'photo_queue',
  SYNC_META: 'sync_meta'
};

// Action types for pending actions
export const ACTION_TYPES = {
  QC_SUBMIT: 'qc_submit',
  STATION_MOVE: 'station_move',
  INVENTORY_RECEIVE: 'inventory_receive',
  CLOCK_IN: 'clock_in',
  CLOCK_OUT: 'clock_out'
};

// Sync status
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed'
};

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Open and initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export async function openDatabase() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Modules store - cached module data
      if (!db.objectStoreNames.contains(STORES.MODULES)) {
        const modulesStore = db.createObjectStore(STORES.MODULES, { keyPath: 'id' });
        modulesStore.createIndex('serial_number', 'serial_number', { unique: true });
        modulesStore.createIndex('factory_id', 'factory_id');
        modulesStore.createIndex('current_station_id', 'current_station_id');
      }

      // Stations store - cached station templates
      if (!db.objectStoreNames.contains(STORES.STATIONS)) {
        const stationsStore = db.createObjectStore(STORES.STATIONS, { keyPath: 'id' });
        stationsStore.createIndex('factory_id', 'factory_id');
        stationsStore.createIndex('order_num', 'order_num');
      }

      // Workers store - cached worker data
      if (!db.objectStoreNames.contains(STORES.WORKERS)) {
        const workersStore = db.createObjectStore(STORES.WORKERS, { keyPath: 'id' });
        workersStore.createIndex('factory_id', 'factory_id');
        workersStore.createIndex('is_active', 'is_active');
        workersStore.createIndex('primary_station_id', 'primary_station_id');
      }

      // Purchase orders store - cached POs
      if (!db.objectStoreNames.contains(STORES.PURCHASE_ORDERS)) {
        const posStore = db.createObjectStore(STORES.PURCHASE_ORDERS, { keyPath: 'id' });
        posStore.createIndex('factory_id', 'factory_id');
        posStore.createIndex('status', 'status');
      }

      // Pending actions queue - offline actions to sync
      if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
        const actionsStore = db.createObjectStore(STORES.PENDING_ACTIONS, {
          keyPath: 'id',
          autoIncrement: true
        });
        actionsStore.createIndex('action_type', 'action_type');
        actionsStore.createIndex('sync_status', 'sync_status');
        actionsStore.createIndex('created_at', 'created_at');
      }

      // Photo queue - photos waiting to upload
      if (!db.objectStoreNames.contains(STORES.PHOTO_QUEUE)) {
        const photoStore = db.createObjectStore(STORES.PHOTO_QUEUE, {
          keyPath: 'id',
          autoIncrement: true
        });
        photoStore.createIndex('action_id', 'action_id');
        photoStore.createIndex('created_at', 'created_at');
      }

      // Sync metadata - last sync time, factory info, etc.
      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        db.createObjectStore(STORES.SYNC_META, { keyPath: 'key' });
      }
    }
  });
}

// Singleton database instance
let dbInstance = null;

/**
 * Get database instance (singleton)
 * @returns {Promise<IDBDatabase>}
 */
export async function getDB() {
  if (!dbInstance) {
    dbInstance = await openDatabase();
  }
  return dbInstance;
}

// ============================================================================
// GENERIC CRUD OPERATIONS
// ============================================================================

/**
 * Get all items from a store
 * @param {string} storeName - Store name
 * @returns {Promise<Array>}
 */
export async function getAll(storeName) {
  const db = await getDB();
  return db.getAll(storeName);
}

/**
 * Get item by ID from a store
 * @param {string} storeName - Store name
 * @param {string|number} id - Item ID
 * @returns {Promise<Object|undefined>}
 */
export async function getById(storeName, id) {
  const db = await getDB();
  return db.get(storeName, id);
}

/**
 * Get items by index
 * @param {string} storeName - Store name
 * @param {string} indexName - Index name
 * @param {*} value - Index value to match
 * @returns {Promise<Array>}
 */
export async function getByIndex(storeName, indexName, value) {
  const db = await getDB();
  return db.getAllFromIndex(storeName, indexName, value);
}

/**
 * Add or update an item in a store
 * @param {string} storeName - Store name
 * @param {Object} item - Item to add/update
 * @returns {Promise<string|number>} - Item ID
 */
export async function put(storeName, item) {
  const db = await getDB();
  return db.put(storeName, item);
}

/**
 * Add multiple items to a store
 * @param {string} storeName - Store name
 * @param {Array} items - Items to add
 * @returns {Promise<void>}
 */
export async function putMany(storeName, items) {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  await Promise.all([
    ...items.map(item => tx.store.put(item)),
    tx.done
  ]);
}

/**
 * Delete an item from a store
 * @param {string} storeName - Store name
 * @param {string|number} id - Item ID
 * @returns {Promise<void>}
 */
export async function deleteItem(storeName, id) {
  const db = await getDB();
  return db.delete(storeName, id);
}

/**
 * Clear all items from a store
 * @param {string} storeName - Store name
 * @returns {Promise<void>}
 */
export async function clearStore(storeName) {
  const db = await getDB();
  return db.clear(storeName);
}

// ============================================================================
// SYNC METADATA OPERATIONS
// ============================================================================

/**
 * Get sync metadata value
 * @param {string} key - Metadata key
 * @returns {Promise<*>}
 */
export async function getSyncMeta(key) {
  const item = await getById(STORES.SYNC_META, key);
  return item?.value;
}

/**
 * Set sync metadata value
 * @param {string} key - Metadata key
 * @param {*} value - Metadata value
 * @returns {Promise<void>}
 */
export async function setSyncMeta(key, value) {
  await put(STORES.SYNC_META, { key, value, updated_at: Date.now() });
}

/**
 * Get last sync timestamp
 * @returns {Promise<number|null>}
 */
export async function getLastSync() {
  return getSyncMeta('last_sync');
}

/**
 * Set last sync timestamp to now
 * @returns {Promise<void>}
 */
export async function setLastSync() {
  await setSyncMeta('last_sync', Date.now());
}

/**
 * Get time since last sync in minutes
 * @returns {Promise<number|null>}
 */
export async function getMinutesSinceSync() {
  const lastSync = await getLastSync();
  if (!lastSync) return null;
  return Math.floor((Date.now() - lastSync) / 60000);
}

// ============================================================================
// PENDING ACTIONS OPERATIONS
// ============================================================================

/**
 * Add a pending action to the queue
 * @param {string} actionType - Action type (from ACTION_TYPES)
 * @param {Object} payload - Action payload
 * @returns {Promise<number>} - Action ID
 */
export async function addPendingAction(actionType, payload) {
  return put(STORES.PENDING_ACTIONS, {
    action_type: actionType,
    payload,
    sync_status: SYNC_STATUS.PENDING,
    created_at: Date.now(),
    retry_count: 0,
    error_message: null
  });
}

/**
 * Get all pending actions
 * @returns {Promise<Array>}
 */
export async function getPendingActions() {
  return getByIndex(STORES.PENDING_ACTIONS, 'sync_status', SYNC_STATUS.PENDING);
}

/**
 * Get failed actions
 * @returns {Promise<Array>}
 */
export async function getFailedActions() {
  return getByIndex(STORES.PENDING_ACTIONS, 'sync_status', SYNC_STATUS.FAILED);
}

/**
 * Update action status
 * @param {number} actionId - Action ID
 * @param {string} status - New status
 * @param {string|null} errorMessage - Error message (for failed status)
 * @returns {Promise<void>}
 */
export async function updateActionStatus(actionId, status, errorMessage = null) {
  const action = await getById(STORES.PENDING_ACTIONS, actionId);
  if (action) {
    action.sync_status = status;
    action.error_message = errorMessage;
    if (status === SYNC_STATUS.FAILED) {
      action.retry_count = (action.retry_count || 0) + 1;
    }
    await put(STORES.PENDING_ACTIONS, action);
  }
}

/**
 * Delete synced actions (cleanup)
 * @returns {Promise<void>}
 */
export async function cleanupSyncedActions() {
  const db = await getDB();
  const tx = db.transaction(STORES.PENDING_ACTIONS, 'readwrite');
  const index = tx.store.index('sync_status');

  let cursor = await index.openCursor(SYNC_STATUS.SYNCED);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

/**
 * Get count of pending actions by status
 * @returns {Promise<Object>} - { pending: number, failed: number, syncing: number }
 */
export async function getPendingActionCounts() {
  const all = await getAll(STORES.PENDING_ACTIONS);
  return {
    pending: all.filter(a => a.sync_status === SYNC_STATUS.PENDING).length,
    failed: all.filter(a => a.sync_status === SYNC_STATUS.FAILED).length,
    syncing: all.filter(a => a.sync_status === SYNC_STATUS.SYNCING).length,
    total: all.length
  };
}

// ============================================================================
// PHOTO QUEUE OPERATIONS
// ============================================================================

/**
 * Add photo to upload queue
 * @param {number} actionId - Related action ID
 * @param {Blob} photoBlob - Photo blob data
 * @param {string} filename - Original filename
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<number>} - Photo queue ID
 */
export async function addPhotoToQueue(actionId, photoBlob, filename, metadata = {}) {
  return put(STORES.PHOTO_QUEUE, {
    action_id: actionId,
    blob: photoBlob,
    filename,
    metadata,
    created_at: Date.now(),
    uploaded: false
  });
}

/**
 * Get photos for an action
 * @param {number} actionId - Action ID
 * @returns {Promise<Array>}
 */
export async function getPhotosForAction(actionId) {
  return getByIndex(STORES.PHOTO_QUEUE, 'action_id', actionId);
}

/**
 * Mark photo as uploaded
 * @param {number} photoId - Photo queue ID
 * @param {string} url - Uploaded URL
 * @returns {Promise<void>}
 */
export async function markPhotoUploaded(photoId, url) {
  const photo = await getById(STORES.PHOTO_QUEUE, photoId);
  if (photo) {
    photo.uploaded = true;
    photo.url = url;
    photo.uploaded_at = Date.now();
    await put(STORES.PHOTO_QUEUE, photo);
  }
}

/**
 * Delete uploaded photos (cleanup)
 * @returns {Promise<void>}
 */
export async function cleanupUploadedPhotos() {
  const db = await getDB();
  const tx = db.transaction(STORES.PHOTO_QUEUE, 'readwrite');
  const all = await tx.store.getAll();

  for (const photo of all) {
    if (photo.uploaded) {
      await tx.store.delete(photo.id);
    }
  }

  await tx.done;
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Cache modules for offline access
 * @param {Array} modules - Modules to cache
 * @returns {Promise<void>}
 */
export async function cacheModules(modules) {
  await putMany(STORES.MODULES, modules);
}

/**
 * Cache stations for offline access
 * @param {Array} stations - Stations to cache
 * @returns {Promise<void>}
 */
export async function cacheStations(stations) {
  await putMany(STORES.STATIONS, stations);
}

/**
 * Cache workers for offline access
 * @param {Array} workers - Workers to cache
 * @returns {Promise<void>}
 */
export async function cacheWorkers(workers) {
  await putMany(STORES.WORKERS, workers);
}

/**
 * Cache purchase orders for offline access
 * @param {Array} purchaseOrders - POs to cache
 * @returns {Promise<void>}
 */
export async function cachePurchaseOrders(purchaseOrders) {
  await putMany(STORES.PURCHASE_ORDERS, purchaseOrders);
}

/**
 * Get cached modules by factory
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Array>}
 */
export async function getCachedModules(factoryId) {
  return getByIndex(STORES.MODULES, 'factory_id', factoryId);
}

/**
 * Get cached stations by factory
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Array>}
 */
export async function getCachedStations(factoryId) {
  return getByIndex(STORES.STATIONS, 'factory_id', factoryId);
}

/**
 * Get cached workers by factory
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Array>}
 */
export async function getCachedWorkers(factoryId) {
  return getByIndex(STORES.WORKERS, 'factory_id', factoryId);
}

/**
 * Get cached purchase orders by factory
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Array>}
 */
export async function getCachedPurchaseOrders(factoryId) {
  return getByIndex(STORES.PURCHASE_ORDERS, 'factory_id', factoryId);
}

// ============================================================================
// STORAGE QUOTA
// ============================================================================

/**
 * Get storage usage estimate
 * @returns {Promise<Object>} - { usage: number, quota: number, percent: number }
 */
export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percent: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
    };
  }
  return { usage: 0, quota: 0, percent: 0 };
}

/**
 * Check if storage is running low (> 80% used)
 * @returns {Promise<boolean>}
 */
export async function isStorageLow() {
  const estimate = await getStorageEstimate();
  return estimate.percent > 80;
}

// ============================================================================
// DATABASE MAINTENANCE
// ============================================================================

/**
 * Clear all cached data (but keep pending actions)
 * @returns {Promise<void>}
 */
export async function clearCache() {
  await Promise.all([
    clearStore(STORES.MODULES),
    clearStore(STORES.STATIONS),
    clearStore(STORES.WORKERS),
    clearStore(STORES.PURCHASE_ORDERS)
  ]);
}

/**
 * Clear everything including pending actions (full reset)
 * @returns {Promise<void>}
 */
export async function clearAll() {
  const db = await getDB();
  const storeNames = Array.from(db.objectStoreNames);
  await Promise.all(storeNames.map(name => clearStore(name)));
}

/**
 * Export database for debugging
 * @returns {Promise<Object>}
 */
export async function exportDatabase() {
  const result = {};
  for (const storeName of Object.values(STORES)) {
    result[storeName] = await getAll(storeName);
  }
  result._meta = {
    exported_at: new Date().toISOString(),
    db_name: DB_NAME,
    db_version: DB_VERSION
  };
  return result;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Database
  openDatabase,
  getDB,

  // CRUD
  getAll,
  getById,
  getByIndex,
  put,
  putMany,
  deleteItem,
  clearStore,

  // Sync Meta
  getSyncMeta,
  setSyncMeta,
  getLastSync,
  setLastSync,
  getMinutesSinceSync,

  // Pending Actions
  addPendingAction,
  getPendingActions,
  getFailedActions,
  updateActionStatus,
  cleanupSyncedActions,
  getPendingActionCounts,

  // Photo Queue
  addPhotoToQueue,
  getPhotosForAction,
  markPhotoUploaded,
  cleanupUploadedPhotos,

  // Cache
  cacheModules,
  cacheStations,
  cacheWorkers,
  cachePurchaseOrders,
  getCachedModules,
  getCachedStations,
  getCachedWorkers,
  getCachedPurchaseOrders,

  // Storage
  getStorageEstimate,
  isStorageLow,

  // Maintenance
  clearCache,
  clearAll,
  exportDatabase,

  // Constants
  STORES,
  ACTION_TYPES,
  SYNC_STATUS
};
