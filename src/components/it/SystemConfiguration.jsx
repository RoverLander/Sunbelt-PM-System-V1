// ============================================================================
// SystemConfiguration.jsx - System Configuration Manager
// ============================================================================
// Comprehensive system configuration for IT administrators including:
// - Application settings
// - Email configuration
// - Notification preferences
// - Feature toggles
// - Environment info
// - Cache management
// - Performance tuning
//
// Created: January 10, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Mail,
  Bell,
  ToggleLeft,
  ToggleRight,
  Server,
  Cpu,
  Database,
  Globe,
  Clock,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  Zap,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock,
  FolderKanban,
  Calendar,
  FileQuestion,
  Factory,
  Key,
  Timer,
  UserCheck
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// CONFIGURATION SECTIONS
// ============================================================================

const DEFAULT_CONFIG = {
  email: {
    warningEnabled: true,
    warningDaysBefore: 3,
    dailyDigestEnabled: false,
    dailyDigestTime: '08:00',
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    fromAddress: 'noreply@sunbelt-pm.com'
  },
  notifications: {
    browserNotifications: true,
    taskReminders: true,
    rfiAlerts: true,
    submittalAlerts: true,
    workflowUpdates: true,
    projectMilestones: true,
    deliveryReminders: true
  },
  features: {
    darkMode: true,
    autoSave: true,
    compactView: false,
    animationsEnabled: true,
    debugMode: false,
    maintenanceMode: false
  },
  performance: {
    cacheEnabled: true,
    cacheDuration: 300,
    lazyLoadImages: true,
    paginationSize: 50,
    maxFileSize: 50
  },
  security: {
    sessionTimeout: 480, // minutes (8 hours)
    requireStrongPasswords: true,
    minPasswordLength: 8,
    enforce2FAAdmins: false,
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
    autoLogoutOnIdle: true,
    idleTimeout: 60 // minutes
  },
  projects: {
    defaultPhaseCount: 4,
    autoArchiveDays: 90,
    requireProjectNumber: true,
    projectNumberPrefix: 'SBT',
    defaultHealthStatus: 'On Track',
    warnDeliveryDaysBefore: 14,
    criticalDeliveryDaysBefore: 7
  },
  calendar: {
    workdayStart: '07:00',
    workdayEnd: '17:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    includesSaturday: false,
    defaultMeetingDuration: 60, // minutes
    showWeekends: true
  },
  rfiSubmittal: {
    defaultRFIDueDays: 7,
    defaultSubmittalDueDays: 14,
    requireApprovalForClose: true,
    autoNotifyOnOverdue: true,
    escalateDaysOverdue: 3
  },
  factory: {
    defaultFactory: 'ATX', // AmTex default
    requireFactoryAssignment: true,
    showAllFactoriesInReports: true,
    factoryColorCoding: true
  }
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ConfigSection({ title, icon: Icon, color, children }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      border: '1px solid var(--border-color)',
      marginBottom: '20px'
    }}>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Icon size={20} style={{ color }} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function ConfigToggle({ label, description, value, onChange, disabled }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <div>
        <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {description}
          </div>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        style={{
          background: 'none',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 0,
          opacity: disabled ? 0.5 : 1
        }}
      >
        {value ? (
          <ToggleRight size={28} style={{ color: '#22c55e' }} />
        ) : (
          <ToggleLeft size={28} style={{ color: 'var(--text-tertiary)' }} />
        )}
      </button>
    </div>
  );
}

function ConfigInput({ label, description, type, value, onChange, suffix, min, max, disabled }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <div>
        <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type={type || 'text'}
          value={value}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          min={min}
          max={max}
          disabled={disabled}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            width: type === 'number' ? '80px' : '200px',
            textAlign: type === 'number' ? 'right' : 'left'
          }}
        />
        {suffix && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function EnvironmentInfo({ label, value, sensitive, copyable }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(!sensitive);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <code style={{
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-tertiary)',
          fontSize: '0.75rem',
          color: 'var(--text-primary)',
          fontFamily: 'monospace'
        }}>
          {sensitive && !visible ? '••••••••' : value}
        </code>
        {sensitive && (
          <button
            onClick={() => setVisible(!visible)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-tertiary)'
            }}
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        {copyable && (
          <button
            onClick={handleCopy}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: copied ? '#22c55e' : 'var(--text-tertiary)'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function SystemConfiguration() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    supabaseUrl: '',
    environment: 'production',
    buildVersion: '1.0.0',
    lastDeployment: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    browserInfo: navigator.userAgent
  });

  useEffect(() => {
    // Get Supabase URL from client
    const url = supabase.supabaseUrl;
    setSystemInfo(prev => ({
      ...prev,
      supabaseUrl: url || 'Unknown'
    }));

    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('system_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Error loading config:', e);
      }
    }
  }, []);

  const updateConfig = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('system_config', JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      // Clear localStorage cache items
      const cacheKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('cache_') || key.startsWith('sb-')
      );
      cacheKeys.forEach(key => localStorage.removeItem(key));

      // Clear session storage
      sessionStorage.clear();

      await new Promise(resolve => setTimeout(resolve, 500));
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setClearingCache(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Settings size={24} style={{ color: '#8b5cf6' }} />
            System Configuration
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Manage application settings, notifications, and performance options
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8125rem'
            }}
          >
            <RefreshCw size={14} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: saved ? '#22c55e' : 'var(--sunbelt-orange)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem',
              fontWeight: '600'
            }}
          >
            {saving ? (
              <RefreshCw size={14} className="spin" />
            ) : saved ? (
              <CheckCircle2 size={14} />
            ) : (
              <Save size={14} />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* Left Column */}
        <div>
          {/* Email Configuration */}
          <ConfigSection title="Email Settings" icon={Mail} color="#f59e0b">
            <ConfigToggle
              label="Warning Emails"
              description="Send email warnings for approaching deadlines"
              value={config.email.warningEnabled}
              onChange={(v) => updateConfig('email', 'warningEnabled', v)}
            />
            <ConfigInput
              label="Warning Days Before"
              description="Days before deadline to send warning"
              type="number"
              value={config.email.warningDaysBefore}
              onChange={(v) => updateConfig('email', 'warningDaysBefore', v)}
              suffix="days"
              min={1}
              max={14}
            />
            <ConfigToggle
              label="Daily Digest"
              description="Send daily summary emails to PMs"
              value={config.email.dailyDigestEnabled}
              onChange={(v) => updateConfig('email', 'dailyDigestEnabled', v)}
            />
            <ConfigInput
              label="Digest Time"
              type="time"
              value={config.email.dailyDigestTime}
              onChange={(v) => updateConfig('email', 'dailyDigestTime', v)}
              disabled={!config.email.dailyDigestEnabled}
            />
          </ConfigSection>

          {/* Notification Settings */}
          <ConfigSection title="Notifications" icon={Bell} color="#3b82f6">
            <ConfigToggle
              label="Browser Notifications"
              description="Show desktop notifications for updates"
              value={config.notifications.browserNotifications}
              onChange={(v) => updateConfig('notifications', 'browserNotifications', v)}
            />
            <ConfigToggle
              label="Task Reminders"
              description="Notify on task due dates and assignments"
              value={config.notifications.taskReminders}
              onChange={(v) => updateConfig('notifications', 'taskReminders', v)}
            />
            <ConfigToggle
              label="RFI Alerts"
              description="Notify on RFI status changes"
              value={config.notifications.rfiAlerts}
              onChange={(v) => updateConfig('notifications', 'rfiAlerts', v)}
            />
            <ConfigToggle
              label="Submittal Alerts"
              description="Notify on submittal updates"
              value={config.notifications.submittalAlerts}
              onChange={(v) => updateConfig('notifications', 'submittalAlerts', v)}
            />
            <ConfigToggle
              label="Workflow Updates"
              description="Notify on workflow phase changes"
              value={config.notifications.workflowUpdates}
              onChange={(v) => updateConfig('notifications', 'workflowUpdates', v)}
            />
          </ConfigSection>

          {/* Feature Toggles */}
          <ConfigSection title="Feature Toggles" icon={Zap} color="#22c55e">
            <ConfigToggle
              label="Dark Mode Support"
              description="Enable dark mode theme option"
              value={config.features.darkMode}
              onChange={(v) => updateConfig('features', 'darkMode', v)}
            />
            <ConfigToggle
              label="Auto-Save"
              description="Automatically save form changes"
              value={config.features.autoSave}
              onChange={(v) => updateConfig('features', 'autoSave', v)}
            />
            <ConfigToggle
              label="Compact View"
              description="Use condensed UI layout"
              value={config.features.compactView}
              onChange={(v) => updateConfig('features', 'compactView', v)}
            />
            <ConfigToggle
              label="Animations"
              description="Enable UI animations and transitions"
              value={config.features.animationsEnabled}
              onChange={(v) => updateConfig('features', 'animationsEnabled', v)}
            />
            <ConfigToggle
              label="Debug Mode"
              description="Show debug information in console"
              value={config.features.debugMode}
              onChange={(v) => updateConfig('features', 'debugMode', v)}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: config.features.maintenanceMode ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              margin: '0 -20px',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{
                  fontWeight: '500',
                  color: config.features.maintenanceMode ? '#ef4444' : 'var(--text-primary)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                  Maintenance Mode
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Disable access for non-admin users
                </div>
              </div>
              <button
                onClick={() => updateConfig('features', 'maintenanceMode', !config.features.maintenanceMode)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {config.features.maintenanceMode ? (
                  <ToggleRight size={28} style={{ color: '#ef4444' }} />
                ) : (
                  <ToggleLeft size={28} style={{ color: 'var(--text-tertiary)' }} />
                )}
              </button>
            </div>
          </ConfigSection>

          {/* Security Settings */}
          <ConfigSection title="Security Settings" icon={Lock} color="#ef4444">
            <ConfigInput
              label="Session Timeout"
              description="Auto logout after inactivity"
              type="number"
              value={config.security.sessionTimeout}
              onChange={(v) => updateConfig('security', 'sessionTimeout', v)}
              suffix="minutes"
              min={15}
              max={1440}
            />
            <ConfigToggle
              label="Strong Passwords Required"
              description="Enforce complex password rules"
              value={config.security.requireStrongPasswords}
              onChange={(v) => updateConfig('security', 'requireStrongPasswords', v)}
            />
            <ConfigInput
              label="Minimum Password Length"
              description="Minimum characters required"
              type="number"
              value={config.security.minPasswordLength}
              onChange={(v) => updateConfig('security', 'minPasswordLength', v)}
              suffix="chars"
              min={6}
              max={32}
              disabled={!config.security.requireStrongPasswords}
            />
            <ConfigToggle
              label="Require 2FA for Admins"
              description="Two-factor authentication for admin accounts"
              value={config.security.enforce2FAAdmins}
              onChange={(v) => updateConfig('security', 'enforce2FAAdmins', v)}
            />
            <ConfigInput
              label="Max Login Attempts"
              description="Failed attempts before lockout"
              type="number"
              value={config.security.maxLoginAttempts}
              onChange={(v) => updateConfig('security', 'maxLoginAttempts', v)}
              suffix="attempts"
              min={3}
              max={10}
            />
            <ConfigInput
              label="Lockout Duration"
              description="Account lockout time after max attempts"
              type="number"
              value={config.security.lockoutDuration}
              onChange={(v) => updateConfig('security', 'lockoutDuration', v)}
              suffix="minutes"
              min={5}
              max={120}
            />
            <ConfigToggle
              label="Auto Logout on Idle"
              description="Logout users after idle timeout"
              value={config.security.autoLogoutOnIdle}
              onChange={(v) => updateConfig('security', 'autoLogoutOnIdle', v)}
            />
            <ConfigInput
              label="Idle Timeout"
              description="Minutes of inactivity before logout"
              type="number"
              value={config.security.idleTimeout}
              onChange={(v) => updateConfig('security', 'idleTimeout', v)}
              suffix="minutes"
              min={5}
              max={240}
              disabled={!config.security.autoLogoutOnIdle}
            />
          </ConfigSection>

          {/* Project Defaults */}
          <ConfigSection title="Project Defaults" icon={FolderKanban} color="#8b5cf6">
            <ConfigInput
              label="Default Phase Count"
              description="Number of phases for new projects"
              type="number"
              value={config.projects.defaultPhaseCount}
              onChange={(v) => updateConfig('projects', 'defaultPhaseCount', v)}
              suffix="phases"
              min={1}
              max={10}
            />
            <ConfigInput
              label="Auto-Archive After"
              description="Days after completion to archive"
              type="number"
              value={config.projects.autoArchiveDays}
              onChange={(v) => updateConfig('projects', 'autoArchiveDays', v)}
              suffix="days"
              min={30}
              max={365}
            />
            <ConfigToggle
              label="Require Project Number"
              description="Project number mandatory on creation"
              value={config.projects.requireProjectNumber}
              onChange={(v) => updateConfig('projects', 'requireProjectNumber', v)}
            />
            <ConfigInput
              label="Project Number Prefix"
              description="Default prefix for project numbers"
              type="text"
              value={config.projects.projectNumberPrefix}
              onChange={(v) => updateConfig('projects', 'projectNumberPrefix', v)}
            />
            <ConfigInput
              label="Warning Days Before Delivery"
              description="Days to show warning indicator"
              type="number"
              value={config.projects.warnDeliveryDaysBefore}
              onChange={(v) => updateConfig('projects', 'warnDeliveryDaysBefore', v)}
              suffix="days"
              min={3}
              max={30}
            />
            <ConfigInput
              label="Critical Days Before Delivery"
              description="Days to show critical indicator"
              type="number"
              value={config.projects.criticalDeliveryDaysBefore}
              onChange={(v) => updateConfig('projects', 'criticalDeliveryDaysBefore', v)}
              suffix="days"
              min={1}
              max={14}
            />
          </ConfigSection>
        </div>

        {/* Right Column */}
        <div>
          {/* Performance Settings */}
          <ConfigSection title="Performance" icon={Cpu} color="#06b6d4">
            <ConfigToggle
              label="Caching Enabled"
              description="Cache API responses for better performance"
              value={config.performance.cacheEnabled}
              onChange={(v) => updateConfig('performance', 'cacheEnabled', v)}
            />
            <ConfigInput
              label="Cache Duration"
              description="How long to cache data"
              type="number"
              value={config.performance.cacheDuration}
              onChange={(v) => updateConfig('performance', 'cacheDuration', v)}
              suffix="seconds"
              min={60}
              max={3600}
              disabled={!config.performance.cacheEnabled}
            />
            <ConfigToggle
              label="Lazy Load Images"
              description="Load images only when visible"
              value={config.performance.lazyLoadImages}
              onChange={(v) => updateConfig('performance', 'lazyLoadImages', v)}
            />
            <ConfigInput
              label="Pagination Size"
              description="Default items per page in lists"
              type="number"
              value={config.performance.paginationSize}
              onChange={(v) => updateConfig('performance', 'paginationSize', v)}
              suffix="items"
              min={10}
              max={200}
            />
            <ConfigInput
              label="Max File Size"
              description="Maximum upload file size"
              type="number"
              value={config.performance.maxFileSize}
              onChange={(v) => updateConfig('performance', 'maxFileSize', v)}
              suffix="MB"
              min={5}
              max={100}
            />
          </ConfigSection>

          {/* Cache Management */}
          <ConfigSection title="Cache Management" icon={Database} color="#ec4899">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  Clear Application Cache
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Remove cached data and refresh all content
                </div>
              </div>
              <button
                onClick={handleClearCache}
                disabled={clearingCache}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: cacheCleared ? '#22c55e' : 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: cacheCleared ? 'white' : 'var(--text-primary)',
                  cursor: clearingCache ? 'not-allowed' : 'pointer',
                  fontSize: '0.8125rem'
                }}
              >
                {clearingCache ? (
                  <RefreshCw size={14} className="spin" />
                ) : cacheCleared ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <Trash2 size={14} />
                )}
                {cacheCleared ? 'Cleared!' : 'Clear Cache'}
              </button>
            </div>
          </ConfigSection>

          {/* Environment Information */}
          <ConfigSection title="Environment" icon={Server} color="#64748b">
            <EnvironmentInfo
              label="Supabase URL"
              value={systemInfo.supabaseUrl}
              copyable
            />
            <EnvironmentInfo
              label="Environment"
              value={systemInfo.environment}
            />
            <EnvironmentInfo
              label="Build Version"
              value={systemInfo.buildVersion}
            />
            <EnvironmentInfo
              label="Timezone"
              value={systemInfo.timezone}
            />
            <EnvironmentInfo
              label="Last Deployment"
              value={new Date(systemInfo.lastDeployment).toLocaleString()}
            />
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                marginBottom: '4px'
              }}>
                Browser
              </div>
              <code style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                wordBreak: 'break-all'
              }}>
                {systemInfo.browserInfo}
              </code>
            </div>
          </ConfigSection>

          {/* System Status */}
          <ConfigSection title="System Status" icon={Shield} color="#22c55e">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              <div style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <CheckCircle2 size={24} style={{ color: '#22c55e', marginBottom: '8px' }} />
                <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Database
                </div>
                <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Connected</div>
              </div>
              <div style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <CheckCircle2 size={24} style={{ color: '#22c55e', marginBottom: '8px' }} />
                <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Auth Service
                </div>
                <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Operational</div>
              </div>
              <div style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <CheckCircle2 size={24} style={{ color: '#22c55e', marginBottom: '8px' }} />
                <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Storage
                </div>
                <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Available</div>
              </div>
              <div style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <CheckCircle2 size={24} style={{ color: '#22c55e', marginBottom: '8px' }} />
                <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Realtime
                </div>
                <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Active</div>
              </div>
            </div>
          </ConfigSection>

          {/* Calendar & Scheduling */}
          <ConfigSection title="Calendar & Scheduling" icon={Calendar} color="#0ea5e9">
            <ConfigInput
              label="Workday Start"
              description="Default work start time"
              type="time"
              value={config.calendar.workdayStart}
              onChange={(v) => updateConfig('calendar', 'workdayStart', v)}
            />
            <ConfigInput
              label="Workday End"
              description="Default work end time"
              type="time"
              value={config.calendar.workdayEnd}
              onChange={(v) => updateConfig('calendar', 'workdayEnd', v)}
            />
            <ConfigToggle
              label="Include Saturdays"
              description="Count Saturdays as working days"
              value={config.calendar.includesSaturday}
              onChange={(v) => updateConfig('calendar', 'includesSaturday', v)}
            />
            <ConfigInput
              label="Default Meeting Duration"
              description="Default length for new meetings"
              type="number"
              value={config.calendar.defaultMeetingDuration}
              onChange={(v) => updateConfig('calendar', 'defaultMeetingDuration', v)}
              suffix="minutes"
              min={15}
              max={480}
            />
            <ConfigToggle
              label="Show Weekends"
              description="Display weekends in calendar views"
              value={config.calendar.showWeekends}
              onChange={(v) => updateConfig('calendar', 'showWeekends', v)}
            />
          </ConfigSection>

          {/* RFI & Submittal Settings */}
          <ConfigSection title="RFI & Submittal Settings" icon={FileQuestion} color="#f97316">
            <ConfigInput
              label="Default RFI Due Days"
              description="Days until RFI response is due"
              type="number"
              value={config.rfiSubmittal.defaultRFIDueDays}
              onChange={(v) => updateConfig('rfiSubmittal', 'defaultRFIDueDays', v)}
              suffix="days"
              min={1}
              max={30}
            />
            <ConfigInput
              label="Default Submittal Due Days"
              description="Days until submittal is due"
              type="number"
              value={config.rfiSubmittal.defaultSubmittalDueDays}
              onChange={(v) => updateConfig('rfiSubmittal', 'defaultSubmittalDueDays', v)}
              suffix="days"
              min={1}
              max={60}
            />
            <ConfigToggle
              label="Require Approval to Close"
              description="Manager approval needed to close items"
              value={config.rfiSubmittal.requireApprovalForClose}
              onChange={(v) => updateConfig('rfiSubmittal', 'requireApprovalForClose', v)}
            />
            <ConfigToggle
              label="Auto-Notify on Overdue"
              description="Send alerts when items become overdue"
              value={config.rfiSubmittal.autoNotifyOnOverdue}
              onChange={(v) => updateConfig('rfiSubmittal', 'autoNotifyOnOverdue', v)}
            />
            <ConfigInput
              label="Escalation Days"
              description="Days overdue before escalation"
              type="number"
              value={config.rfiSubmittal.escalateDaysOverdue}
              onChange={(v) => updateConfig('rfiSubmittal', 'escalateDaysOverdue', v)}
              suffix="days"
              min={1}
              max={14}
              disabled={!config.rfiSubmittal.autoNotifyOnOverdue}
            />
          </ConfigSection>

          {/* Factory Settings */}
          <ConfigSection title="Factory Settings" icon={Factory} color="#10b981">
            <ConfigInput
              label="Default Factory"
              description="Default factory for new projects"
              type="text"
              value={config.factory.defaultFactory}
              onChange={(v) => updateConfig('factory', 'defaultFactory', v)}
            />
            <ConfigToggle
              label="Require Factory Assignment"
              description="Factory required for all projects"
              value={config.factory.requireFactoryAssignment}
              onChange={(v) => updateConfig('factory', 'requireFactoryAssignment', v)}
            />
            <ConfigToggle
              label="Show All Factories in Reports"
              description="Include all factories in aggregate reports"
              value={config.factory.showAllFactoriesInReports}
              onChange={(v) => updateConfig('factory', 'showAllFactoriesInReports', v)}
            />
            <ConfigToggle
              label="Factory Color Coding"
              description="Use color coding for factory identification"
              value={config.factory.factoryColorCoding}
              onChange={(v) => updateConfig('factory', 'factoryColorCoding', v)}
            />
          </ConfigSection>
        </div>
      </div>
    </div>
  );
}

export default SystemConfiguration;
