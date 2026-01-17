// ============================================================================
// OfflineBanner.jsx - Offline Status Banner for PWA
// ============================================================================
// Shows a banner when the device is offline and tracks time offline.
//
// Created: January 17, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  offline: {
    background: 'rgba(239, 68, 68, 0.9)',
    color: 'white'
  },
  syncing: {
    background: 'rgba(245, 158, 11, 0.9)',
    color: 'white'
  },
  online: {
    background: 'rgba(34, 197, 94, 0.9)',
    color: 'white'
  },
  hidden: {
    height: 0,
    padding: 0,
    overflow: 'hidden',
    opacity: 0
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xs)',
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'inherit',
    cursor: 'pointer'
  },
  spin: {
    animation: 'spin 1s linear infinite'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [offlineTime, setOfflineTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // ==========================================================================
  // ONLINE/OFFLINE DETECTION
  // ==========================================================================
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setIsSyncing(true);
        // Simulate sync delay
        setTimeout(() => {
          setIsSyncing(false);
          // Show online banner briefly
          setTimeout(() => {
            setShowBanner(false);
            setWasOffline(false);
          }, 2000);
        }, 1500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowBanner(true);
      setOfflineTime(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // ==========================================================================
  // OFFLINE DURATION
  // ==========================================================================
  const [offlineDuration, setOfflineDuration] = useState(0);

  useEffect(() => {
    if (!isOnline && offlineTime) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - offlineTime.getTime()) / 1000);
        setOfflineDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setOfflineDuration(0);
    }
  }, [isOnline, offlineTime]);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // Don't render if online and banner shouldn't show
  if (isOnline && !wasOffline && !showBanner) {
    return null;
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  let bannerStyle = styles.banner;
  let content = null;

  if (!isOnline) {
    bannerStyle = { ...styles.banner, ...styles.offline };
    content = (
      <>
        <WifiOff size={16} />
        <span>Offline {offlineDuration > 0 ? `(${formatDuration(offlineDuration)})` : ''}</span>
        <span style={{ opacity: 0.8 }}>- Changes will sync when connected</span>
      </>
    );
  } else if (isSyncing) {
    bannerStyle = { ...styles.banner, ...styles.syncing };
    content = (
      <>
        <RefreshCw size={16} style={styles.spin} />
        <span>Syncing changes...</span>
      </>
    );
  } else if (wasOffline && showBanner) {
    bannerStyle = { ...styles.banner, ...styles.online };
    content = (
      <>
        <Wifi size={16} />
        <span>Back online</span>
        <button onClick={handleRefresh} style={styles.refreshButton}>
          <RefreshCw size={14} />
        </button>
      </>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div style={bannerStyle}>
      {content}

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
