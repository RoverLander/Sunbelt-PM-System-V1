// ============================================================================
// PWA Module Index
// ============================================================================
// Re-exports all PWA components and utilities for easy importing.
//
// Created: January 17, 2026
// ============================================================================

// Main App
export { default as PWAApp } from './PWAApp';

// Contexts
export { WorkerAuthProvider, useWorkerAuth } from './contexts/WorkerAuthContext';

// Layout Components
export { default as PWAShell } from './components/layout/PWAShell';
export { default as BottomNav } from './components/layout/BottomNav';

// Auth Components
export { default as WorkerLogin } from './components/auth/WorkerLogin';

// Common Components
export { default as OfflineBanner } from './components/common/OfflineBanner';
export { default as SyncIndicator } from './components/common/SyncIndicator';

// Hooks
export { useOfflineSync, usePendingCount, useLastSync } from './hooks/useOfflineSync';
export { useOnlineStatus, useIsOnline } from './hooks/useOnlineStatus';
export {
  useRealtimeSubscription,
  useModulesSubscription,
  useStationAssignmentsSubscription,
  useQCRecordsSubscription,
  useInventoryReceiptsSubscription,
  useWorkerShiftsSubscription,
  usePWASubscriptions
} from './hooks/useRealtimeSubscription';

// Libraries
export { default as indexedDB } from './lib/indexedDB';
export { default as syncManager } from './lib/syncManager';

// Pages
export { default as PWAHome } from './pages/PWAHome';
export { default as ModuleLookup } from './pages/ModuleLookup';
export { default as QCInspection } from './pages/QCInspection';
export { default as StationMove } from './pages/StationMove';
export { default as InventoryReceiving } from './pages/InventoryReceiving';
