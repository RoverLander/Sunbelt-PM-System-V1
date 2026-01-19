// ============================================================================
// IT Dashboard Components Index
// ============================================================================
// Export all IT dashboard components for easy importing
// ============================================================================

// Main Dashboard
export { default as ITDashboard } from './ITDashboard';

// User Management
export { default as UserManagement } from './UserManagement';
export { default as CreateUserModal } from './CreateUserModal';
export { default as EditUserModal } from './EditUserModal';

// System Components
export { default as SystemHealth } from './SystemHealth';
export { default as AuditLogViewer } from './AuditLogViewer';
export { default as SecurityCenter } from './SecurityCenter';
export { default as DatabaseTools } from './DatabaseTools';
export { default as SystemConfiguration } from './SystemConfiguration';

// Additional Features
export { default as ErrorTracking } from './ErrorTracking';
export { default as AnnouncementManager } from './AnnouncementManager';
export { default as FeatureFlagManager } from './FeatureFlagManager';
export { default as SessionManager } from './SessionManager';

// Merged Tab Components (New)
export { default as UsersAndAccess } from './UsersAndAccess';
export { default as ActivityAndLogs } from './ActivityAndLogs';

// Widgets (New)
export * from './widgets';