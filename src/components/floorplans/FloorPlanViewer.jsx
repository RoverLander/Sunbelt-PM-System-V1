// ============================================================================
// FloorPlanViewer Component
// ============================================================================
// Full-screen viewer for floor plans with marker support.
// Uses browser's native PDF viewer for PDFs, img for images.
// Markers work on both - positioned as percentage overlays.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit3,
  MapPin,
  MessageSquare,
  ClipboardList,
  ExternalLink,
  X,
  Check
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import FloorPlanMarker from './FloorPlanMarker';
import AddMarkerModal from './AddMarkerModal';
import ItemDetailPanel from './ItemDetailPanel';

// ============================================================================
// CONSTANTS
// ============================================================================
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function FloorPlanViewer({
  floorPlan,
  projectId,
  projectNumber,
  rfis,
  submittals,
  isPM,
  onBack,
  onMarkerCreate,
  onMarkerUpdate,
  onMarkerDelete,
  onPageRename,
  showToast,
  onRefresh
}) {
  // ==========================================================================
  // REFS
  // ==========================================================================
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // ==========================================================================
  // STATE - VIEWER
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fileUrl, setFileUrl] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // ==========================================================================
  // STATE - MARKERS
  // ==========================================================================
  const [markers, setMarkers] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // ==========================================================================
  // STATE - MODALS
  // ==========================================================================
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [pendingMarkerPosition, setPendingMarkerPosition] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);

  // ==========================================================================
  // STATE - PAGE RENAME
  // ==========================================================================
  const [editingPageName, setEditingPageName] = useState(false);
  const [pageName, setPageName] = useState('');

  // ==========================================================================
  // DERIVED VALUES
  // ==========================================================================
  const isPdf = floorPlan.file_type === 'application/pdf';
  const pageCount = floorPlan.page_count || 1;
  const currentPageData = floorPlan.pages?.find(p => p.page_number === currentPage);
  const currentPageName = currentPageData?.name || `Page ${currentPage}`;

  // ==========================================================================
  // LOAD FILE URL
  // ==========================================================================
  useEffect(() => {
    const loadFile = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.storage
          .from('project-files')
          .getPublicUrl(floorPlan.file_path);

        if (data?.publicUrl) {
          setFileUrl(data.publicUrl);
        }
      } catch (err) {
        console.error('Error loading file:', err);
        showToast?.('Error loading floor plan', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (floorPlan.file_path) {
      loadFile();
    }
  }, [floorPlan.file_path]);

  // ==========================================================================
  // FILTER MARKERS
  // ==========================================================================
  useEffect(() => {
    let filtered = floorPlan.markers || [];

    // Filter by current page
    filtered = filtered.filter(m => m.page_number === currentPage);

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.item_type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(marker => {
        const item = marker.item_type === 'rfi'
          ? rfis?.find(r => r.id === marker.item_id)
          : submittals?.find(s => s.id === marker.item_id);

        if (!item) return false;

        if (filterStatus === 'open') {
          return marker.item_type === 'rfi'
            ? ['Open', 'Pending'].includes(item.status)
            : ['Pending', 'Submitted', 'Under Review'].includes(item.status);
        } else {
          return marker.item_type === 'rfi'
            ? ['Answered', 'Closed'].includes(item.status)
            : ['Approved', 'Approved as Noted', 'Rejected', 'Revise & Resubmit'].includes(item.status);
        }
      });
    }

    // Enrich markers with item data
    const enrichedMarkers = filtered.map(marker => {
      const item = marker.item_type === 'rfi'
        ? rfis?.find(r => r.id === marker.item_id)
        : submittals?.find(s => s.id === marker.item_id);
      return { ...marker, item };
    }).filter(m => m.item); // Only show markers with valid items

    setMarkers(enrichedMarkers);
  }, [floorPlan.markers, currentPage, filterType, filterStatus, rfis, submittals]);

  // ==========================================================================
  // HANDLERS - ZOOM
  // ==========================================================================
  const handleZoomIn = () => setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  const handleZoomOut = () => setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM));

  // ==========================================================================
  // HANDLERS - PAGE NAVIGATION
  // ==========================================================================
  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(pageCount, p + 1));

  // ==========================================================================
  // HANDLERS - MARKER PLACEMENT
  // ==========================================================================
  const handleImageClick = (e) => {
    if (!isPM || isPdf) return; // Can't place markers on PDF view

    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x_percent = ((e.clientX - rect.left) / rect.width) * 100;
    const y_percent = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingMarkerPosition({ x_percent, y_percent });
    setShowAddMarker(true);
  };

  const handleMarkerSelect = async (itemType, itemId) => {
    if (!pendingMarkerPosition) return;

    try {
      await onMarkerCreate({
        floor_plan_id: floorPlan.id,
        page_number: currentPage,
        item_type: itemType,
        item_id: itemId,
        x_percent: pendingMarkerPosition.x_percent,
        y_percent: pendingMarkerPosition.y_percent
      });
      showToast?.('Marker added');
      setShowAddMarker(false);
      setPendingMarkerPosition(null);
      onRefresh?.();
    } catch (err) {
      console.error('Error creating marker:', err);
      showToast?.('Error adding marker', 'error');
    }
  };

  const handleMarkerDrag = async (markerId, x_percent, y_percent) => {
    try {
      await onMarkerUpdate(markerId, x_percent, y_percent);
      onRefresh?.();
    } catch (err) {
      console.error('Error updating marker:', err);
      showToast?.('Error moving marker', 'error');
    }
  };

  const handleMarkerDelete = async (markerId) => {
    try {
      await onMarkerDelete(markerId);
      showToast?.('Marker removed');
      onRefresh?.();
    } catch (err) {
      console.error('Error deleting marker:', err);
      showToast?.('Error removing marker', 'error');
    }
  };

  // ==========================================================================
  // HANDLERS - PAGE RENAME
  // ==========================================================================
  const handleStartRename = () => {
    setPageName(currentPageName);
    setEditingPageName(true);
  };

  const handleSavePageName = async () => {
    if (!pageName.trim()) return;

    try {
      await onPageRename(floorPlan.id, currentPage, pageName.trim());
      showToast?.('Page renamed');
      setEditingPageName(false);
      onRefresh?.();
    } catch (err) {
      console.error('Error renaming page:', err);
      showToast?.('Error renaming page', 'error');
    }
  };

  // ==========================================================================
  // IMAGE LOAD HANDLER
  // ==========================================================================
  const handleImageLoad = (e) => {
    setImageDimensions({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
      {/* ================================================================== */}
      {/* TOOLBAR                                                           */}
      {/* ================================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-md)',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          gap: 'var(--space-md)',
          flexWrap: 'wrap'
        }}
      >
        {/* Left - Back & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: '8px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {floorPlan.name}
            </h2>
            {pageCount > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: '2px' }}>
                {editingPageName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="text"
                      value={pageName}
                      onChange={(e) => setPageName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePageName()}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.8125rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        width: '120px'
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSavePageName}
                      style={{
                        background: 'var(--success)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => setEditingPageName(false)}
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {currentPageName}
                    </span>
                    {isPM && (
                      <button
                        onClick={handleStartRename}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-tertiary)',
                          padding: '2px'
                        }}
                        title="Rename page"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center - Page Navigation */}
        {pageCount > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{
                padding: '6px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                color: 'var(--text-secondary)'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', minWidth: '80px', textAlign: 'center' }}>
              Page {currentPage} / {pageCount}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === pageCount}
              style={{
                padding: '6px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: currentPage === pageCount ? 'not-allowed' : 'pointer',
                opacity: currentPage === pageCount ? 0.5 : 1,
                color: 'var(--text-secondary)'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Right - Zoom & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {/* Zoom (only for images) */}
          {!isPdf && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                style={{
                  padding: '6px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: zoom <= MIN_ZOOM ? 'not-allowed' : 'pointer',
                  opacity: zoom <= MIN_ZOOM ? 0.5 : 1,
                  color: 'var(--text-secondary)'
                }}
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', minWidth: '45px', textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                style={{
                  padding: '6px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: zoom >= MAX_ZOOM ? 'not-allowed' : 'pointer',
                  opacity: zoom >= MAX_ZOOM ? 0.5 : 1,
                  color: 'var(--text-secondary)'
                }}
              >
                <ZoomIn size={16} />
              </button>
            </div>
          )}

          {/* Filter Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: showFilters ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-primary)',
                border: `1px solid ${showFilters ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: showFilters ? 'var(--sunbelt-orange)' : 'var(--text-secondary)'
              }}
            >
              <Filter size={16} />
              Filters
            </button>

            {showFilters && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  zIndex: 100,
                  minWidth: '200px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ marginBottom: 'var(--space-sm)' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="rfi">RFIs Only</option>
                    <option value="submittal">Submittals Only</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open/Pending</option>
                    <option value="closed">Closed/Approved</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Open in New Tab (for PDFs) */}
          {isPdf && fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}
            >
              <ExternalLink size={16} />
              Open PDF
            </a>
          )}

          {/* Add Marker Button (PM only, images only) */}
          {isPM && !isPdf && (
            <button
              onClick={() => {}}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'white',
                fontWeight: '500',
                fontSize: '0.875rem'
              }}
              title="Click on the floor plan to add a marker"
            >
              <MapPin size={16} />
              Click to Add Marker
            </button>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* MARKER STATS BAR                                                  */}
      {/* ================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-lg)',
          padding: 'var(--space-sm) var(--space-md)',
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '0.8125rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <MapPin size={14} />
          <span>{markers.length} markers on this page</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6' }}>
          <MessageSquare size={14} />
          <span>{markers.filter(m => m.item_type === 'rfi').length} RFIs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6' }}>
          <ClipboardList size={14} />
          <span>{markers.filter(m => m.item_type === 'submittal').length} Submittals</span>
        </div>
      </div>

      {/* ================================================================== */}
      {/* VIEWER AREA                                                       */}
      {/* ================================================================== */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#1a1a2e',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-lg)'
        }}
      >
        {loading ? (
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ marginBottom: 'var(--space-md)' }}></div>
            <p>Loading floor plan...</p>
          </div>
        ) : isPdf ? (
          /* PDF - Show embedded viewer */
          <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
            <iframe
              src={`${fileUrl}#page=${currentPage}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 'var(--radius-md)'
              }}
              title={floorPlan.name}
            />
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: 'var(--space-sm)', fontSize: '0.8125rem' }}>
              Tip: For best marker support, upload floor plans as images (PNG, JPG)
            </p>
          </div>
        ) : fileUrl ? (
          /* Image - Show with markers */
          <div
            style={{
              position: 'relative',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease'
            }}
          >
            <img
              ref={imageRef}
              src={fileUrl}
              alt={floorPlan.name}
              onLoad={handleImageLoad}
              onClick={handleImageClick}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
                cursor: isPM ? 'crosshair' : 'default',
                borderRadius: 'var(--radius-md)'
              }}
            />

            {/* Markers Overlay */}
            {markers.map(marker => (
              <FloorPlanMarker
                key={marker.id}
                marker={marker}
                isPM={isPM}
                onClick={() => setSelectedMarker(marker)}
                onDrag={(x, y) => handleMarkerDrag(marker.id, x, y)}
                onDelete={() => handleMarkerDelete(marker.id)}
              />
            ))}

            {/* Pending Marker */}
            {pendingMarkerPosition && (
              <div
                style={{
                  position: 'absolute',
                  left: `${pendingMarkerPosition.x_percent}%`,
                  top: `${pendingMarkerPosition.y_percent}%`,
                  transform: 'translate(-50%, -100%)',
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    background: 'var(--sunbelt-orange)',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    animation: 'pulse 1s infinite'
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'white', textAlign: 'center' }}>
            <p>Unable to load floor plan</p>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* ADD MARKER MODAL                                                  */}
      {/* ================================================================== */}
      {showAddMarker && (
        <AddMarkerModal
          isOpen={showAddMarker}
          onClose={() => {
            setShowAddMarker(false);
            setPendingMarkerPosition(null);
          }}
          rfis={rfis}
          submittals={submittals}
          existingMarkers={floorPlan.markers || []}
          onSelect={handleMarkerSelect}
        />
      )}

      {/* ================================================================== */}
      {/* ITEM DETAIL PANEL                                                 */}
      {/* ================================================================== */}
      {selectedMarker && (
        <ItemDetailPanel
          marker={selectedMarker}
          onClose={() => setSelectedMarker(null)}
          onDelete={isPM ? () => {
            handleMarkerDelete(selectedMarker.id);
            setSelectedMarker(null);
          } : null}
        />
      )}
    </div>
  );
}

export default FloorPlanViewer;