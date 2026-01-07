// ============================================================================
// FloorPlanViewer Component
// ============================================================================
// Full-screen modal viewer for floor plans with marker support.
// Features: zoom, pan, marker placement, filters, and item detail panel.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit3,
  MapPin,
  MessageSquare,
  ClipboardList,
  ExternalLink,
  Check,
  Maximize2,
  Move,
  MousePointer,
  Trash2
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import AddMarkerModal from './AddMarkerModal';
import ItemDetailPanel from './ItemDetailPanel';

// ============================================================================
// CONSTANTS
// ============================================================================
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
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
  onClose,
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
  const [mode, setMode] = useState('view'); // 'view' or 'addMarker'

  // ==========================================================================
  // STATE - MARKERS
  // ==========================================================================
  const [markers, setMarkers] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState(null);

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
    }).filter(m => m.item);

    setMarkers(enrichedMarkers);
  }, [floorPlan.markers, currentPage, filterType, filterStatus, rfis, submittals]);

  // ==========================================================================
  // HANDLERS - ZOOM
  // ==========================================================================
  const handleZoomIn = () => setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  const handleZoomOut = () => setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  const handleResetZoom = () => setZoom(1);

  // ==========================================================================
  // HANDLERS - PAGE NAVIGATION
  // ==========================================================================
  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(pageCount, p + 1));

  // ==========================================================================
  // HANDLERS - MARKER PLACEMENT
  // ==========================================================================
  const handleImageClick = (e) => {
    if (!isPM || mode !== 'addMarker' || isPdf) return;

    const rect = e.currentTarget.getBoundingClientRect();
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
      setMode('view');
      onRefresh?.();
    } catch (err) {
      console.error('Error creating marker:', err);
      showToast?.('Error adding marker', 'error');
    }
  };

  const handleMarkerDelete = async (markerId) => {
    if (!confirm('Remove this marker?')) return;
    
    try {
      await onMarkerDelete(markerId);
      showToast?.('Marker removed');
      setSelectedMarker(null);
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
  // GET MARKER COLOR
  // ==========================================================================
  const getMarkerColor = (marker) => {
    if (!marker.item) return '#64748b';
    
    const status = marker.item.status;
    const isOverdue = marker.item.due_date && new Date(marker.item.due_date) < new Date();
    
    if (isOverdue && !['Closed', 'Answered', 'Approved', 'Approved as Noted'].includes(status)) {
      return '#ef4444';
    }

    if (marker.item_type === 'rfi') {
      const colors = { 'Open': '#3b82f6', 'Pending': '#f59e0b', 'Answered': '#22c55e', 'Closed': '#64748b' };
      return colors[status] || '#64748b';
    } else {
      const colors = { 'Pending': '#f59e0b', 'Submitted': '#3b82f6', 'Under Review': '#8b5cf6', 'Approved': '#22c55e', 'Approved as Noted': '#22c55e', 'Revise & Resubmit': '#ef4444', 'Rejected': '#ef4444' };
      return colors[status] || '#64748b';
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ================================================================== */}
      {/* TOOLBAR                                                           */}
      {/* ================================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-md) var(--space-lg)',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          gap: 'var(--space-md)',
          flexWrap: 'wrap'
        }}
      >
        {/* Left - Title & Page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              {floorPlan.name}
            </h2>
            {pageCount > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: '4px' }}>
                {editingPageName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="text"
                      value={pageName}
                      onChange={(e) => setPageName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePageName()}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.875rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--sunbelt-orange)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        width: '150px'
                      }}
                      autoFocus
                    />
                    <button onClick={handleSavePageName} style={{ background: 'var(--success)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', cursor: 'pointer', padding: '6px' }}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingPageName(false)} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {currentPageName}
                    {isPM && (
                      <button onClick={handleStartRename} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px' }} title="Rename page">
                        <Edit3 size={14} />
                      </button>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Page Navigation */}
          {pageCount > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <button onClick={handlePrevPage} disabled={currentPage === 1} style={{ padding: '6px', background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1, color: 'var(--text-primary)' }}>
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', minWidth: '80px', textAlign: 'center', fontWeight: '500' }}>
                {currentPage} / {pageCount}
              </span>
              <button onClick={handleNextPage} disabled={currentPage === pageCount} style={{ padding: '6px', background: 'none', border: 'none', cursor: currentPage === pageCount ? 'not-allowed' : 'pointer', opacity: currentPage === pageCount ? 0.3 : 1, color: 'var(--text-primary)' }}>
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Center - Zoom & Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {/* Zoom Controls */}
          {!isPdf && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <button onClick={handleZoomOut} disabled={zoom <= MIN_ZOOM} style={{ padding: '6px', background: 'none', border: 'none', cursor: zoom <= MIN_ZOOM ? 'not-allowed' : 'pointer', opacity: zoom <= MIN_ZOOM ? 0.3 : 1, color: 'var(--text-primary)' }}>
                <ZoomOut size={18} />
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', minWidth: '50px', textAlign: 'center', fontWeight: '500' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM} style={{ padding: '6px', background: 'none', border: 'none', cursor: zoom >= MAX_ZOOM ? 'not-allowed' : 'pointer', opacity: zoom >= MAX_ZOOM ? 0.3 : 1, color: 'var(--text-primary)' }}>
                <ZoomIn size={18} />
              </button>
              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />
              <button onClick={handleResetZoom} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Reset zoom">
                <RotateCcw size={16} />
              </button>
            </div>
          )}

          {/* Mode Toggle (PM only) */}
          {isPM && !isPdf && (
            <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setMode('view')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: mode === 'view' ? 'var(--bg-secondary)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: mode === 'view' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: mode === 'view' ? '600' : '500',
                  fontSize: '0.875rem'
                }}
              >
                <MousePointer size={16} />
                View
              </button>
              <button
                onClick={() => setMode('addMarker')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: mode === 'addMarker' ? 'rgba(255, 107, 53, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: mode === 'addMarker' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                  fontWeight: mode === 'addMarker' ? '600' : '500',
                  fontSize: '0.875rem'
                }}
              >
                <MapPin size={16} />
                Add Marker
              </button>
            </div>
          )}
        </div>

        {/* Right - Filters & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {/* Marker Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginRight: 'var(--space-md)', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {markers.length} markers
            </span>
          </div>

          {/* Filter Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: showFilters ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-primary)',
                border: `1px solid ${showFilters ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: showFilters ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                fontWeight: '500'
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
                  marginTop: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-md)',
                  zIndex: 100,
                  minWidth: '220px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  >
                    <option value="all">All Types</option>
                    <option value="rfi">RFIs Only</option>
                    <option value="submittal">Submittals Only</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open/Pending</option>
                    <option value="closed">Closed/Approved</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Open PDF External */}
          {isPdf && fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <ExternalLink size={16} />
              Open PDF
            </a>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            <X size={18} />
            Close
          </button>
        </div>
      </div>

      {/* Mode Instruction Banner */}
      {mode === 'addMarker' && !isPdf && (
        <div style={{
          background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
          color: 'white',
          padding: 'var(--space-sm) var(--space-lg)',
          textAlign: 'center',
          fontWeight: '500',
          fontSize: '0.875rem'
        }}>
          <MapPin size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          Click anywhere on the floor plan to place a marker
        </div>
      )}

      {/* ================================================================== */}
      {/* VIEWER AREA                                                       */}
      {/* ================================================================== */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#0a0a14',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {loading ? (
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ marginBottom: 'var(--space-md)' }}></div>
            <p>Loading floor plan...</p>
          </div>
        ) : isPdf ? (
          <div style={{ width: '100%', height: '100%', padding: 'var(--space-lg)' }}>
            <iframe
              src={`${fileUrl}#page=${currentPage}`}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: 'var(--radius-lg)' }}
              title={floorPlan.name}
            />
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 'var(--space-md)', fontSize: '0.8125rem' }}>
              💡 For marker support, upload floor plans as images (PNG, JPG)
            </p>
          </div>
        ) : fileUrl ? (
          <div
            style={{
              position: 'relative',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease',
              margin: '40px'
            }}
          >
            <img
              ref={imageRef}
              src={fileUrl}
              alt={floorPlan.name}
              onClick={handleImageClick}
              style={{
                maxWidth: '100%',
                display: 'block',
                cursor: mode === 'addMarker' ? 'crosshair' : 'default',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
              }}
            />

            {/* Markers */}
            {markers.map(marker => {
              const color = getMarkerColor(marker);
              const isHovered = hoveredMarker === marker.id;
              const isSelected = selectedMarker?.id === marker.id;

              return (
                <div
                  key={marker.id}
                  style={{
                    position: 'absolute',
                    left: `${marker.x_percent}%`,
                    top: `${marker.y_percent}%`,
                    transform: 'translate(-50%, -100%)',
                    cursor: 'pointer',
                    zIndex: isHovered || isSelected ? 50 : 10
                  }}
                  onMouseEnter={() => setHoveredMarker(marker.id)}
                  onMouseLeave={() => setHoveredMarker(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarker(marker);
                  }}
                >
                  {/* Pin */}
                  <div style={{
                    width: isHovered || isSelected ? '32px' : '28px',
                    height: isHovered || isSelected ? '32px' : '28px',
                    background: color,
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '3px solid white',
                    boxShadow: `0 2px 8px rgba(0,0,0,0.4), 0 0 0 ${isSelected ? '3px' : '0px'} ${color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}>
                    <div style={{ transform: 'rotate(45deg)' }}>
                      {marker.item_type === 'rfi' ? (
                        <MessageSquare size={isHovered || isSelected ? 14 : 12} color="white" />
                      ) : (
                        <ClipboardList size={isHovered || isSelected ? 14 : 12} color="white" />
                      )}
                    </div>
                  </div>

                  {/* Hover Card */}
                  {isHovered && !selectedMarker && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-sm) var(--space-md)',
                        minWidth: '200px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        whiteSpace: 'nowrap',
                        zIndex: 100
                      }}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.875rem' }}>
                        {marker.item_type === 'rfi' ? marker.item.rfi_number : marker.item.submittal_number}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '4px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {marker.item_type === 'rfi' ? marker.item.subject : marker.item.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.6875rem',
                          fontWeight: '600',
                          background: `${color}20`,
                          color: color
                        }}>
                          {marker.item.status}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Click for details
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pending Marker */}
            {pendingMarkerPosition && (
              <div
                style={{
                  position: 'absolute',
                  left: `${pendingMarkerPosition.x_percent}%`,
                  top: `${pendingMarkerPosition.y_percent}%`,
                  transform: 'translate(-50%, -100%)',
                  pointerEvents: 'none',
                  zIndex: 100
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'var(--sunbelt-orange)',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '3px solid white',
                    boxShadow: '0 2px 12px rgba(255, 107, 53, 0.5)',
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
      {/* SELECTED MARKER DETAIL PANEL                                      */}
      {/* ================================================================== */}
      {selectedMarker && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '400px',
            background: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 200
          }}
        >
          {/* Panel Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {selectedMarker.item_type === 'rfi' ? 'RFI Details' : 'Submittal Details'}
            </h3>
            <button
              onClick={() => setSelectedMarker(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Panel Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-lg)' }}>
            {selectedMarker.item && (
              <>
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                    {selectedMarker.item_type === 'rfi' ? 'RFI Number' : 'Submittal Number'}
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--sunbelt-orange)' }}>
                    {selectedMarker.item_type === 'rfi' ? selectedMarker.item.rfi_number : selectedMarker.item.submittal_number}
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                    {selectedMarker.item_type === 'rfi' ? 'Subject' : 'Title'}
                  </div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                    {selectedMarker.item_type === 'rfi' ? selectedMarker.item.subject : selectedMarker.item.title}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Status</div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      background: `${getMarkerColor(selectedMarker)}20`,
                      color: getMarkerColor(selectedMarker)
                    }}>
                      {selectedMarker.item.status}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Due Date</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {selectedMarker.item.due_date ? new Date(selectedMarker.item.due_date).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                </div>

                {selectedMarker.item.sent_to && (
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Sent To</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{selectedMarker.item.sent_to}</div>
                  </div>
                )}

                {selectedMarker.item_type === 'rfi' && selectedMarker.item.question && (
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Question</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: '1.5', background: 'var(--bg-primary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                      {selectedMarker.item.question}
                    </div>
                  </div>
                )}

                {selectedMarker.item_type === 'submittal' && selectedMarker.item.description && (
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Description</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: '1.5', background: 'var(--bg-primary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                      {selectedMarker.item.description}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Panel Footer */}
          {isPM && (
            <div style={{
              padding: 'var(--space-md) var(--space-lg)',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button
                onClick={() => handleMarkerDelete(selectedMarker.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}
              >
                <Trash2 size={16} />
                Remove Marker from Floor Plan
              </button>
            </div>
          )}
        </div>
      )}

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

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -100%) scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default FloorPlanViewer;