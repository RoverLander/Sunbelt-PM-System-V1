// ============================================================================
// AnnouncementBanner.jsx
// ============================================================================
// Displays system-wide announcements at the top of the app.
// Fetches active announcements and allows users to dismiss them.
//
// Features:
// - Fetches active, non-expired announcements
// - Filters by user role and factory
// - Allows dismissing announcements
// - Different styles for info, warning, critical, maintenance types
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Info,
  AlertTriangle,
  AlertCircle,
  Wrench,
  X
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================
const TYPE_CONFIG = {
  info: {
    icon: Info,
    bg: 'rgba(59, 130, 246, 0.1)',
    border: '#3b82f6',
    text: '#3b82f6'
  },
  warning: {
    icon: AlertTriangle,
    bg: 'rgba(245, 158, 11, 0.1)',
    border: '#f59e0b',
    text: '#f59e0b'
  },
  critical: {
    icon: AlertCircle,
    bg: 'rgba(239, 68, 68, 0.1)',
    border: '#ef4444',
    text: '#ef4444'
  },
  maintenance: {
    icon: Wrench,
    bg: 'rgba(139, 92, 246, 0.1)',
    border: '#8b5cf6',
    text: '#8b5cf6'
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AnnouncementBanner() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // ============================================================================
  // FETCH DATA
  // ============================================================================
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
      fetchAnnouncements();
      fetchDismissals();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, factory')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:created_by(name)
        `)
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('type', { ascending: true }) // critical first
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchDismissals = async () => {
    try {
      const { data, error } = await supabase
        .from('announcement_dismissals')
        .select('announcement_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setDismissedIds(new Set(data?.map(d => d.announcement_id) || []));
    } catch (error) {
      console.error('Error fetching dismissals:', error);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleDismiss = async (announcementId) => {
    try {
      const { error } = await supabase
        .from('announcement_dismissals')
        .insert([{
          announcement_id: announcementId,
          user_id: user.id
        }]);

      if (error) throw error;

      setDismissedIds(prev => new Set([...prev, announcementId]));
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  };

  // ============================================================================
  // FILTERING
  // ============================================================================
  const visibleAnnouncements = announcements.filter(announcement => {
    // Already dismissed?
    if (dismissedIds.has(announcement.id)) return false;

    // Check role targeting
    if (announcement.target_roles && announcement.target_roles.length > 0) {
      if (!userProfile?.role || !announcement.target_roles.includes(userProfile.role)) {
        return false;
      }
    }

    // Check factory targeting
    if (announcement.target_factories && announcement.target_factories.length > 0) {
      if (!userProfile?.factory || !announcement.target_factories.includes(userProfile.factory)) {
        return false;
      }
    }

    return true;
  });

  // ============================================================================
  // RENDER
  // ============================================================================
  if (visibleAnnouncements.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {visibleAnnouncements.map(announcement => {
        const config = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.info;
        const Icon = config.icon;

        return (
          <div
            key={announcement.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: config.bg,
              borderLeft: `4px solid ${config.border}`,
              borderRadius: '0 8px 8px 0'
            }}
          >
            <Icon size={20} style={{ color: config.text, flexShrink: 0 }} />

            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: '600',
                color: config.text,
                fontSize: '0.9rem',
                marginBottom: '2px'
              }}>
                {announcement.title}
              </div>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                lineHeight: '1.4'
              }}>
                {announcement.message}
              </div>
            </div>

            {announcement.is_dismissible && (
              <button
                onClick={() => handleDismiss(announcement.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Dismiss"
              >
                <X size={18} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AnnouncementBanner;
