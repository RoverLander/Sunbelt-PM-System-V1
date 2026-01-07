// ============================================================================
// FloorPlanViewer Component
// ============================================================================
// Full-screen viewer for floor plans with marker support.
// Renders PDFs using PDF.js and supports pan, zoom, and marker placement.
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Maximize2,
  RotateCw,
  Settings,
  X
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import FloorPlanMarker from './FloorPlanMarker';
import AddMarkerModal from './AddMarkerModal';
import ItemDetailPanel from './ItemDetailPanel';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// ============================================================================
// CONSTANTS
// ============================================================================
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
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
  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);

  // ==========================================================================
  // STATE - VIEWER
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [renderedPage, setRenderedPage] = useState(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // ==========================================================================
  // STATE - MARKERS
  // ==========================================================================
  const [markers, setMarkers] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'rfi', 'submittal'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'open', 'closed'
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [draggingMarker, setDraggingMarker] = useState(null);

  // ==========================================================================
  // STATE - MODALS
  // ==========================================================================
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [pendingMarkerPosition, setPendingMarkerPosition] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editingPageName, setEditingPageName] = useState(false);

  // ==========================================================================
  // LOAD PDF/IMAGE
  // ==========================================================================
  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);

      try {
        if (floorPlan.file_type === 'application/pdf') {
          // Load PDF
          const { data } = await supabase.storage
            .from('project-files')
            .download(floorPlan.file_path);

          const arrayBuffer = await data.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          pdfDocRef.current = pdf;
          setPdfDoc(pdf);
        }
      } catch (err) {
        console.error('Error loading document:', err);
        showToast('Failed to load floor plan', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();

    return () => {
      pdfDocRef.current = null;
    };
  }, [floorPlan]);

  // ==========================================================================
  // RENDER PDF PAGE
  // ==========================================================================
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoom });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        setCanvasDimensions({ width: viewport.width, height: viewport.height });

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        setRenderedPage(currentPage);
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, zoom]);

  // ==========================================================================
  // LOAD MARKERS FOR CURRENT PAGE
  // ==========================================================================
  useEffect(() => {
    const pageMarkers = (floorPlan.markers || []).filter(
      m => m.page_number === currentPage
    );
    setMarkers(pageMarkers);
  }, [floorPlan.markers, currentPage]);

  // ==========================================================================
  // FILTER MARKERS
  // ==========================================================================
  const filteredMarkers = markers.filter(marker => {
    // Type filter
    if (filterType !== 'all' && marker.item_type !== filterType) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all') {
      const item = marker.item;
      if (!item) return false;
      
      const isOpen = ['Open', 'Pending', 'In Progress', 'Submitted', 'Under Review'].includes(item.status);
      if (filterStatus === 'open' && !isOpen) return false;
      if (filterStatus === 'closed' && isOpen) return false;
    }

    return true;
  });

  // ==========================================================================
  // HANDLERS - ZOOM
  // ==========================================================================
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  // ==========================================================================
  // HANDLERS - PAGE NAVIGATION
  // ==========================================================================
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, floorPlan.page_count));
  };

  // ==========================================================================
  // HANDLERS - CANVAS CLICK (for adding markers)
  // ==========================================================================
  const handleCanvasClick = (e) => {
    if (!isPM || draggingMarker) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to percentage
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setPendingMarkerPosition({ x: xPercent, y: yPercent });
    setShowAddMarker(true);
  };

  // ==========================================================================
  // HANDLERS - MARKER ACTIONS
  // ==========================================================================
  const handleMarkerClick = (marker) => {
    setDetailItem(marker.item);
    setShowDetailPanel(true);
  };

  const handleMarkerDragStart = (marker) => {
    if (!isPM) return;
    setDraggingMarker(marker);
  };

  const handleMarkerDragEnd = async (marker, newX, newY) => {
    if (!isPM) return;

    try {
      await onMarkerUpdate(marker.id, newX, newY);
      showToast('Marker position updated', 'success');
    } catch (err) {
      showToast('Failed to update marker position', 'error');
    }

    setDraggingMarker(null);
  };

  const handleMarkerDelete = async (marker) => {
    if (!confirm('Remove this marker from the floor plan?')) return;

    try {
      await onMarkerDelete(marker.id);
      showToast('Marker removed', 'success');
    } catch (err) {
      showToast('Failed to remove marker', 'error');
    }
  };

  // ==========================================================================
  // HANDLERS - ADD MARKER
  // ==========================================================================
  const handleAddMarker = async (itemType, itemId) => {
    if (!pendingMarkerPosition) return;

    try {
      await onMarkerCreate({
        floor_plan_id: floorPlan.id,
        page_number: currentPage,
        item_type: itemType,
        item_id: itemId,
        x_percent: pendingMarkerPosition.x,
        y_percent: pendingMarkerPosition.y,
        created_by: null // Will be set by RLS
      });

      showToast('Marker added', 'success');
      setShowAddMarker(false);
      setPendingMarkerPosition(null);
      await onRefresh();
    } catch (err) {
      showToast('Failed to add marker', 'error');
    }
  };

  // ==========================================================================
  // HANDLERS - PAGE NAME
  // ==========================================================================
  const handlePageNameSave = async (newName) => {
    try {
      await onPageRename(floorPlan.id, currentPage, newName);
      showToast('Page renamed', 'success');
      setEditingPageName(false);
      await onRefresh();
    } catch (err) {
      showToast('Failed to rename page', 'error');
    }
  };

  // ==========================================================================
  // GET CURRENT PAGE NAME
  // ==========================================================================
  const getCurrentPageName = () => {
    const pages = floorPlan.pages || [];
    const page = pages.find(p => p.page_number === currentPage);
    return page?.name || `Page ${currentPage}`;
  };

  // ==========================================================================
  // RENDER - IMAGE FLOOR PLAN
  // ==========================================================================
  const renderImage = () => {
    const { data } = supabase.storage
      .from('project-files')
      .getPublicUrl(floorPlan.file_path);

    return (
      <img
        src={data.publicUrl}
        alt={floorPlan.name}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center'
        }}
        onClick={handleCanvasClick}
      />
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-md) var(--space-lg)',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
      }}>
        {/* Left: Back & Title */}
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
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h2 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              margin: 0
            }}>
              {floorPlan.name}
            </h2>
            {floorPlan.page_count > 1 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-sm)',
                marginTop: '2px'
              }}>
                {editingPageName ? (
                  <input
                    type="text"
                    defaultValue={getCurrentPageName()}
                    autoFocus
                    onBlur={(e) => handlePageNameSave(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePageNameSave(e.target.value);
                      if (e.key === 'Escape') setEditingPageName(false);
                    }}
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.8125rem',
                      border: '1px solid var(--sunbelt-orange)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {getCurrentPageName()}
                  </span>
                )}
                {isPM && !editingPageName && (
                  <button
                    onClick={() => setEditingPageName(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      display: 'flex'
                    }}
                    title="Rename page"
                  >
                    <Edit3 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Page Navigation */}
        {floorPlan.page_count > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            background: 'var(--bg-primary)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                display: 'flex',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{
              padding: '0 var(--space-sm)',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              {currentPage} / {floorPlan.page_count}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === floorPlan.page_count}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px',
                cursor: currentPage === floorPlan.page_count ? 'not-allowed' : 'pointer',
                color: currentPage === floorPlan.page_count ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                display: 'flex',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Right: Zoom & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {/* Zoom Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            background: 'var(--bg-primary)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px',
                cursor: zoom <= MIN_ZOOM ? 'not-allowed' : 'pointer',
                color: zoom <= MIN_ZOOM ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                display: 'flex',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleZoomReset}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 8px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                minWidth: '50px'
              }}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px',
                cursor: zoom >= MAX_ZOOM ? 'not-allowed' : 'pointer',
                color: zoom >= MAX_ZOOM ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                display: 'flex',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Add Marker Button */}
          {isPM && (
            <div style={{
              padding: '6px 12px',
              background: 'rgba(255, 107, 53, 0.1)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--sunbelt-orange)',
              fontSize: '0.8125rem',
              fontWeight: '500'
            }}>
              <MapPin size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Click on plan to add marker
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* FILTER BAR                                                        */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-sm) var(--space-lg)',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)'
      }}>
        <Filter size={16} style={{ color: 'var(--text-tertiary)' }} />
        
        {/* Type Filter */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--bg-secondary)',
          padding: '2px',
          borderRadius: 'var(--radius-sm)'
        }}>
          {[
            { key: 'all', label: 'All', icon: MapPin },
            { key: 'rfi', label: 'RFIs', icon: MessageSquare, color: '#3b82f6' },
            { key: 'submittal', label: 'Submittals', icon: ClipboardList, color: 'var(--sunbelt-orange)' }
          ].map(filter => {
            const Icon = filter.icon;
            const isActive = filterType === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--bg-primary)' : 'transparent',
                  color: isActive ? (filter.color || 'var(--text-primary)') : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer'
                }}
              >
                <Icon size={14} />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--bg-secondary)',
          padding: '2px',
          borderRadius: 'var(--radius-sm)'
        }}>
          {[
            { key: 'all', label: 'All Status' },
            { key: 'open', label: 'Open' },
            { key: 'closed', label: 'Closed' }
          ].map(filter => {
            const isActive = filterStatus === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setFilterStatus(filter.key)}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--bg-primary)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer'
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Marker Count */}
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)'
        }}>
          {filteredMarkers.length} marker{filteredMarkers.length !== 1 ? 's' : ''} visible
        </span>
      </div>

      {/* ================================================================== */}
      {/* VIEWER AREA                                                       */}
      {/* ================================================================== */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--bg-tertiary)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-lg)'
        }}
      >
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'var(--text-secondary)'
          }}>
            <div className="loading-spinner" style={{ marginBottom: 'var(--space-md)' }}></div>
            <p>Loading floor plan...</p>
          </div>
        ) : (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Canvas/Image */}
            {floorPlan.file_type === 'application/pdf' ? (
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{
                  cursor: isPM ? 'crosshair' : 'default',
                  boxShadow: 'var(--shadow-lg)',
                  borderRadius: 'var(--radius-sm)'
                }}
              />
            ) : (
              renderImage()
            )}

            {/* Markers */}
            {filteredMarkers.map(marker => (
              <FloorPlanMarker
                key={marker.id}
                marker={marker}
                isPM={isPM}
                isHovered={hoveredMarker === marker.id}
                isDragging={draggingMarker?.id === marker.id}
                canvasDimensions={canvasDimensions}
                onHover={() => setHoveredMarker(marker.id)}
                onLeave={() => setHoveredMarker(null)}
                onClick={() => handleMarkerClick(marker)}
                onDragStart={() => handleMarkerDragStart(marker)}
                onDragEnd={(x, y) => handleMarkerDragEnd(marker, x, y)}
                onDelete={() => handleMarkerDelete(marker)}
              />
            ))}

            {/* Pending Marker Preview */}
            {pendingMarkerPosition && (
              <div
                style={{
                  position: 'absolute',
                  left: `${pendingMarkerPosition.x}%`,
                  top: `${pendingMarkerPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--sunbelt-orange)',
                  border: '3px solid white',
                  boxShadow: 'var(--shadow-md)',
                  opacity: 0.8,
                  pointerEvents: 'none',
                  animation: 'pulse 1s infinite'
                }}
              />
            )}
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
          onSelect={handleAddMarker}
        />
      )}

      {/* ================================================================== */}
      {/* DETAIL PANEL                                                      */}
      {/* ================================================================== */}
      {showDetailPanel && detailItem && (
        <ItemDetailPanel
          item={detailItem}
          itemType={detailItem.rfi_number ? 'rfi' : 'submittal'}
          onClose={() => {
            setShowDetailPanel(false);
            setDetailItem(null);
          }}
          projectNumber={projectNumber}
        />
      )}
    </div>
  );
}

// Import supabase for file access
import { supabase } from '../../utils/supabaseClient';

export default FloorPlanViewer;