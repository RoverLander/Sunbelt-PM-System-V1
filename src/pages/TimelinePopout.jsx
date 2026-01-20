// ============================================================================
// TimelinePopout.jsx - Standalone Timeline View for Multi-Monitor Setups
// ============================================================================
// Opens the Production Timeline in a resizable, pop-out window.
// Reads module data from localStorage that was set by the parent window.
//
// Created: January 20, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import CalendarTimelineView from '../components/calendar/CalendarTimelineView';
import '../App.css';

/**
 * TimelinePopout - Standalone page for the production timeline
 * Designed to be opened in a separate window for multi-monitor setups
 */
function TimelinePopout() {
  const [modules, setModules] = useState([]);
  const [initialDate, setInitialDate] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('timelinePopoutData');
      if (storedData) {
        const data = JSON.parse(storedData);
        setModules(data.modules || []);
        setInitialDate(data.currentDate ? new Date(data.currentDate) : new Date());
        setZoomLevel(data.zoomLevel || 'week');
      } else {
        setError('No timeline data found. Please open the timeline from the main app.');
      }
    } catch (err) {
      console.error('Error loading timeline data:', err);
      setError('Failed to load timeline data.');
    } finally {
      setLoading(false);
    }

    // Set up listener for data updates from parent window
    const handleStorageChange = (e) => {
      if (e.key === 'timelinePopoutData' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          setModules(data.modules || []);
          setInitialDate(data.currentDate ? new Date(data.currentDate) : new Date());
          setZoomLevel(data.zoomLevel || 'week');
        } catch (err) {
          console.error('Error updating timeline data:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Update document title
    document.title = 'Production Timeline - Sunbelt PM';

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle close
  const handleClose = () => {
    window.close();
  };

  // Handle module click (could open in parent window or show modal)
  const handleModuleClick = (module) => {
    // For now, just log - could send message to parent window
    console.log('Module clicked:', module);
    // Could use postMessage to communicate with parent window
    if (window.opener) {
      window.opener.postMessage({ type: 'MODULE_CLICK', module }, '*');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--sunbelt-orange)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}
          />
          <p>Loading timeline...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          padding: '20px'
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: '400px',
            padding: '32px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}
        >
          <h2 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Error</h2>
          <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>{error}</p>
          <button
            onClick={handleClose}
            style={{
              padding: '12px 24px',
              background: 'var(--sunbelt-orange)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-primary)',
        overflow: 'hidden'
      }}
    >
      <CalendarTimelineView
        modules={modules}
        initialDate={initialDate}
        onModuleClick={handleModuleClick}
        canEdit={false}
        isPopout={true}
        onPopoutClose={handleClose}
      />
    </div>
  );
}

export default TimelinePopout;
