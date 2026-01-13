// ============================================================================
// FeatureFlagContext.jsx
// ============================================================================
// Provides feature flag state and helper functions throughout the app.
//
// Usage:
//   const { isEnabled, flags, loading } = useFeatureFlags();
//   if (isEnabled('factory_map')) { ... }
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

// ============================================================================
// CONTEXT
// ============================================================================
const FeatureFlagContext = createContext({
  flags: {},
  loading: true,
  isEnabled: () => false,
  refreshFlags: () => {}
});

// ============================================================================
// PROVIDER
// ============================================================================
export function FeatureFlagProvider({ children }) {
  const { user } = useAuth();
  const [flags, setFlags] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile for targeting
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, role, factory')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile for flags:', error);
    }
  };

  // Fetch feature flags
  const fetchFlags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');

      if (error) throw error;

      // Convert to keyed object for easy lookup
      const flagsMap = {};
      (data || []).forEach(flag => {
        flagsMap[flag.key] = flag;
      });

      setFlags(flagsMap);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('feature_flags_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags' },
        () => {
          fetchFlags();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchFlags]);

  // Simple hash function for deterministic percentage rollout
  const hashString = useCallback((str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }, []);

  // Get current environment (could be expanded based on your deployment setup)
  const getCurrentEnvironment = useCallback(() => {
    // Check for environment variable or hostname-based detection
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    if (hostname.includes('staging') || hostname.includes('stage')) {
      return 'staging';
    }
    return 'production';
  }, []);

  // Check if a feature is enabled for the current user
  const isEnabled = useCallback((flagKey) => {
    const flag = flags[flagKey];

    // Flag doesn't exist
    if (!flag) return false;

    // Flag is globally disabled
    if (!flag.is_enabled) return false;

    // Check schedule - enable_at (flag should not be active before this time)
    if (flag.enable_at) {
      const enableTime = new Date(flag.enable_at);
      if (new Date() < enableTime) {
        return false;
      }
    }

    // Check schedule - disable_at (flag should not be active after this time)
    if (flag.disable_at) {
      const disableTime = new Date(flag.disable_at);
      if (new Date() > disableTime) {
        return false;
      }
    }

    // Check environment targeting
    if (flag.environment && flag.environment !== 'all') {
      const currentEnv = getCurrentEnvironment();
      if (flag.environment !== currentEnv) {
        return false;
      }
    }

    // Check dependency - if this flag depends on another, the parent must be enabled
    if (flag.depends_on_flag) {
      const parentFlag = Object.values(flags).find(f => f.id === flag.depends_on_flag);
      if (!parentFlag || !parentFlag.is_enabled) {
        return false;
      }
    }

    // Check user targeting if specified
    if (flag.enabled_users && flag.enabled_users.length > 0) {
      if (!userProfile?.id || !flag.enabled_users.includes(userProfile.id)) {
        return false;
      }
    }

    // Check role targeting if specified
    if (flag.enabled_roles && flag.enabled_roles.length > 0) {
      if (!userProfile?.role || !flag.enabled_roles.includes(userProfile.role)) {
        return false;
      }
    }

    // Check factory targeting if specified
    if (flag.enabled_factories && flag.enabled_factories.length > 0) {
      if (!userProfile?.factory || !flag.enabled_factories.includes(userProfile.factory)) {
        return false;
      }
    }

    // Check percentage rollout (deterministic based on user ID + flag key)
    if (flag.rollout_percentage !== null && flag.rollout_percentage !== undefined && flag.rollout_percentage < 100) {
      if (!userProfile?.id) {
        // No user ID, can't determine rollout - default to disabled
        return false;
      }
      // Create deterministic hash from user ID + flag key
      const hash = hashString(userProfile.id + flagKey);
      const userPercentile = hash % 100;
      if (userPercentile >= flag.rollout_percentage) {
        return false;
      }
    }

    return true;
  }, [flags, userProfile, hashString, getCurrentEnvironment]);

  const value = {
    flags,
    loading,
    isEnabled,
    refreshFlags: fetchFlags
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

export default FeatureFlagContext;
