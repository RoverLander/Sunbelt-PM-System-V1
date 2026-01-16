// ============================================================================
// FloorPlanViewer Component
// ============================================================================
// Full-screen modal viewer for floor plans with marker support.
// Features: zoom, pan, marker placement, filters, and item detail panel.
// 
// SUPPORTED MARKER TYPES:
// - RFIs (rfi)
// - Submittals (submittal)
// - Tasks (task)
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
  CheckSquare,
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
  tasks,
  isPM,
  onClose,
  onMarkerCreate,
  onMarkerUpdate: _onMarkerUpdate,
  onMarkerDelete,
  onPageRename,
  showToast,
  onRefresh,
  onDataRefresh,
  onNavigateToItem
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
  // eslint-disable-next-line no-unused-vars
  const [imageDimensions, _setImageDimensions] = useState({ width: 0, height: 0 });
  const [mode, setMode] = useState('view'); // 'view' or 'addMarker'

  // ==========================================================================
  // STATE - PAN/DRAG
  // ==========================================================================
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
  // EFFECT - LOAD FILE URL
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
  // EFFECT - FILTER AND ENRICH MARKERS
  // ==========================================================================
  // This effect filters markers by page, type, and status, then enriches
  // each marker with its associated item data (RFI, Submittal, or Task)
  // ==========================================================================
  useEffect(() => {
    let filtered = floorPlan.markers || [];

    // ===== FILTER BY CURRENT PAGE =====
    filtered = filtered.filter(m => m.page_number === currentPage);

    // ===== FILTER BY TYPE =====
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.item_type === filterType);
    }

    // ===== FILTER BY STATUS =====
    if (filterStatus !== 'all') {
      filtered = filtered.filter(marker => {
        // Find the associated item based on type
        let item = null;
        if (marker.item_type === 'rfi') {
          item = rfis?.find(r => r.id === marker.item_id);
        } else if (marker.item_type === 'submittal') {
          item = submittals?.find(s => s.id === marker.item_id);
        } else if (marker.item_type === 'task') {
          item = tasks?.find(t => t.id === marker.item_id);
        }

        if (!item) return false;

        // ===== CHECK OPEN/PENDING STATUS =====
        if (filterStatus === 'open') {
          if (marker.item_type === 'rfi') {
            return ['Open', 'Pending'].includes(item.status);
          } else if (marker.item_type === 'submittal') {
            return ['Pending', 'Submitted', 'Under Review'].includes(item.status);
          } else if (marker.item_type === 'task') {
            return ['Not Started', 'In Progress', 'Awaiting Response'].includes(item.status);
          }
        } 
        // ===== CHECK CLOSED/COMPLETED STATUS =====
        else {
          if (marker.item_type === 'rfi') {
            return ['Answered', 'Closed'].includes(item.status);
          } else if (marker.item_type === 'submittal') {
            return ['Approved', 'Approved as Noted', 'Rejected', 'Revise & Resubmit'].includes(item.status);
          } else if (marker.item_type === 'task') {
            return ['Completed', 'Cancelled'].includes(item.status);
          }
        }
        return false;
      });
    }

    // ===== ENRICH MARKERS WITH ITEM DATA =====
    // Attach the full item object to each marker for display
    const enrichedMarkers = filtered.map(marker => {
      let item = null;
      if (marker.item_type === 'rfi') {
        item = rfis?.find(r => r.id === marker.item_id);
      } else if (marker.item_type === 'submittal') {
        item = submittals?.find(s => s.id === marker.item_id);
      } else if (marker.item_type === 'task') {
        item = tasks?.find(t => t.id === marker.item_id);
      }
      return { ...marker, item };
    }).filter(m => m.item); // Remove markers without matching items

    setMarkers(enrichedMarkers);
  }, [floorPlan.markers, currentPage, filterType, filterStatus, rfis, submittals, tasks]);

  // ==========================================================================
  // HANDLERS - ZOOM
  // ==========================================================================
  const handleZoomIn = () => setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  const handleZoomOut = () => setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // ==========================================================================
  // HANDLERS - PAN/DRAG
  // ==========================================================================
  const handleMouseDown = (e) => {
    // Only pan in view mode (not addMarker mode)
    if (mode !== 'view') return;
    // Don't start drag if clicking on marker elements or buttons
    const target = e.target;
    const isMarkerOrButton = target.closest('[data-marker]') || target.tagName === 'BUTTON';
    if (isMarkerOrButton) return;

    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // ==========================================================================
  // HANDLERS - PAGE NAVIGATION
  // ==========================================================================
  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(pageCount, p + 1));

  // ==========================================================================
  // HANDLERS - MARKER PLACEMENT
  // ==========================================================================
  const handleImageClick = (e) => {
    if (!isPM || mode !== 'addMarker' || isPdf || isDragging) return;

    // Get the image element for accurate positioning
    const img = imageRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x_percent = ((e.clientX - rect.left) / rect.width) * 100;
    const y_percent = ((e.clientY - rect.top) / rect.height) * 100;

    // Only place marker if click is within the image bounds
    if (x_percent >= 0 && x_percent <= 100 && y_percent >= 0 && y_percent <= 100) {
      setPendingMarkerPosition({ x_percent, y_percent });
      setShowAddMarker(true);
    }
  };

  // ===== HANDLE MARKER CREATION =====
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

  // ===== HANDLE MARKER DELETION =====
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
  // HELPER - GET MARKER COLOR
  // ==========================================================================
  // Returns color based on item type, status, and overdue state
  // ==========================================================================
  const getMarkerColor = (marker) => {
    if (!marker.item) return '#64748b';
    
    const status = marker.item.status;
    const isOverdue = marker.item.due_date && new Date(marker.item.due_date) < new Date();
    
    // ===== OVERDUE CHECK =====
    // Show red for overdue items (except closed/completed statuses)
    const closedStatuses = ['Closed', 'Answered', 'Approved', 'Approved as Noted', 'Completed', 'Cancelled'];
    if (isOverdue && !closedStatuses.includes(status)) {
      return '#ef4444';
    }

    // ===== RFI COLORS =====
    if (marker.item_type === 'rfi') {
      const colors = { 
        'Open': '#3b82f6', 
        'Pending': '#f59e0b', 
        'Answered': '#22c55e', 
        'Closed': '#64748b' 
      };
      return colors[status] || '#64748b';
    } 
    // ===== SUBMITTAL COLORS =====
    else if (marker.item_type === 'submittal') {
      const colors = { 
        'Pending': '#f59e0b', 
        'Submitted': '#3b82f6', 
        'Under Review': '#8b5cf6', 
        'Approved': '#22c55e', 
        'Approved as Noted': '#22c55e', 
        'Revise & Resubmit': '#ef4444', 
        'Rejected': '#ef4444' 
      };
      return colors[status] || '#64748b';
    } 
    // ===== TASK COLORS =====
    else if (marker.item_type === 'task') {
      const colors = {
        'Not Started': '#64748b',
        'In Progress': '#3b82f6',
        'Awaiting Response': '#f59e0b',
        'Completed': '#22c55e',
        'Cancelled': '#94a3b8'
      };
      return colors[status] || '#64748b';
    }
    
    return '#64748b';
  };

  // ==========================================================================
  // HELPER - GET MARKER ICON
  // ==========================================================================
  const getMarkerIcon = (itemType, size) => {
    if (itemType === 'rfi') {
      return <MessageSquare size={size} color="white" />;
    } else if (itemType === 'task') {
      return <CheckSquare size={size} color="white" />;
    } else {
      return <ClipboardList size={size} color="white" />;
    }
  };

  // ==========================================================================
  // HELPER - GET ITEM DISPLAY INFO
  // ==========================================================================
  const getItemDisplayInfo = (marker) => {
    if (!marker.item) return { number: '', title: '', label: '' };

    if (marker.item_type === 'rfi') {
      return {
        number: marker.item.rfi_number,
        title: marker.item.subject,
        label: 'RFI Number',
        titleLabel: 'Subject',
        detailsTitle: 'RFI Details',
        tabName: 'rfis'
      };
    } else if (marker.item_type === 'task') {
      return {
        number: marker.item.title,
        title: marker.item.description || '',
        label: 'Task',
        titleLabel: 'Description',
        detailsTitle: 'Task Details',
        tabName: 'tasks'
      };
    } else {
      return {
        number: marker.item.submittal_number,
        title: marker.item.title,
        label: 'Submittal Number',
        titleLabel: 'Title',
        detailsTitle: 'Submittal Details',
        tabName: 'submittals'
      };
    }
  };

  // ==========================================================================
  // HANDLER - NAVIGATE TO ITEM
  // ==========================================================================
  const handleNavigateToItem = (marker) => {
    if (!onNavigateToItem || !marker.item) return;

    const displayInfo = getItemDisplayInfo(marker);
    onClose(); // Close the viewer first
    onNavigateToItem(displayInfo.tabName, marker.item.id);
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
        {/* ===== LEFT - TITLE & PAGE ===== */}
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

          {/* ===== PAGE NAVIGATION ===== */}
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

        {/* ===== CENTER - ZOOM & MODE ===== */}
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

          {/* ===== MODE TOGGLE (PM ONLY) ===== */}
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

        {/* ===== RIGHT - FILTERS & CLOSE ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {/* Marker Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginRight: 'var(--space-md)', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {markers.length} markers
            </span>
          </div>

          {/* ===== FILTER BUTTON & DROPDOWN ===== */}
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
                {/* ===== TYPE FILTER ===== */}
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
                    <option value="task">Tasks Only</option>
                  </select>
                </div>
                {/* ===== STATUS FILTER ===== */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open/Pending</option>
                    <option value="closed">Closed/Completed</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ===== OPEN PDF EXTERNAL ===== */}
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

          {/* ===== CLOSE BUTTON ===== */}
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

      {/* ================================================================== */}
      {/* MODE INSTRUCTION BANNER                                           */}
      {/* ================================================================== */}
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          flex: 1,
          overflow: 'hidden',
          background: '#0a0a14',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: mode === 'addMarker' ? 'crosshair' :
                  isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* ===== LOADING STATE ===== */}
        {loading ? (
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ marginBottom: 'var(--space-md)' }}></div>
            <p>Loading floor plan...</p>
          </div>
        ) : isPdf ? (
          /* ===== PDF VIEWER ===== */
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
          /* ===== IMAGE VIEWER WITH MARKERS ===== */
          <div
            onClick={handleImageClick}
            style={{
              position: 'relative',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              userSelect: 'none',
              willChange: isDragging ? 'transform' : 'auto'
            }}
          >
            <img
              ref={imageRef}
              src={fileUrl}
              alt={floorPlan.name}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              style={{
                maxWidth: 'calc(100vw - 80px)',
                maxHeight: 'calc(100vh - 200px)',
                display: 'block',
                cursor: 'inherit',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                pointerEvents: 'none'
              }}
            />

            {/* ===== RENDER MARKERS ===== */}
            {markers.map(marker => {
              const color = getMarkerColor(marker);
              const isHovered = hoveredMarker === marker.id;
              const isSelected = selectedMarker?.id === marker.id;
              const displayInfo = getItemDisplayInfo(marker);

              return (
                <div
                  key={marker.id}
                  data-marker="true"
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
                  {/* ===== MARKER PIN ===== */}
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
                      {getMarkerIcon(marker.item_type, isHovered || isSelected ? 14 : 12)}
                    </div>
                  </div>

                  {/* ===== HOVER CARD ===== */}
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
                        {displayInfo.number}
                      </div>
                      {displayInfo.title && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '4px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayInfo.title}
                        </div>
                      )}
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

            {/* ===== PENDING MARKER (DURING PLACEMENT) ===== */}
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
          /* ===== ERROR STATE ===== */
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
          {/* ===== PANEL HEADER ===== */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {getItemDisplayInfo(selectedMarker).detailsTitle}
            </h3>
            <button
              onClick={() => setSelectedMarker(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* ===== PANEL CONTENT ===== */}
          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-lg)' }}>
            {selectedMarker.item && (
              <>
                {/* ===== ITEM NUMBER / TITLE ===== */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                    {getItemDisplayInfo(selectedMarker).label}
                  </div>
                  <div
                    onClick={() => handleNavigateToItem(selectedMarker)}
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: 'var(--sunbelt-orange)',
                      cursor: onNavigateToItem ? 'pointer' : 'default',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'opacity 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (onNavigateToItem) {
                        e.currentTarget.style.opacity = '0.8';
                        e.currentTarget.style.textDecoration = 'underline';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                    title={onNavigateToItem ? `View ${getItemDisplayInfo(selectedMarker).label}` : ''}
                  >
                    {getItemDisplayInfo(selectedMarker).number}
                    {onNavigateToItem && <ExternalLink size={14} />}
                  </div>
                </div>

                {/* ===== SUBJECT / TITLE / DESCRIPTION ===== */}
                {getItemDisplayInfo(selectedMarker).title && (
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                      {getItemDisplayInfo(selectedMarker).titleLabel}
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {getItemDisplayInfo(selectedMarker).title}
                    </div>
                  </div>
                )}

                {/* ===== STATUS & DUE DATE ===== */}
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

                {/* ===== PRIORITY (FOR TASKS) ===== */}
                {selectedMarker.item_type === 'task' && selectedMarker.item.priority && (
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Priority</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{selectedMarker.item.priority}</div>
                  </div>
                )}

                {/* ===== SENT TO (FOR RFIs & SUBMITTALS) ===== */}
                {selectedMarker.item.sent_to && (
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Sent To</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{selectedMarker.item.sent_to}</div>
                  </div>
                )}

                {/* ===== ASSIGNEE (FOR TASKS) ===== */}
                {selectedMarker.item_type === 'task' && (selectedMarker.item.assignee?.name || selectedMarker.item.external_assignee_name) && (
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Assigned To</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {selectedMarker.item.external_assignee_name || selectedMarker.item.assignee?.name || 'Unassigned'}
                    </div>
                  </div>
                )}

                {/* ===== QUESTION (FOR RFIs) ===== */}
                {selectedMarker.item_type === 'rfi' && selectedMarker.item.question && (
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Question</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: '1.5', background: 'var(--bg-primary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                      {selectedMarker.item.question}
                    </div>
                  </div>
                )}

                {/* ===== DESCRIPTION (FOR SUBMITTALS) ===== */}
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

          {/* ===== PANEL FOOTER - DELETE BUTTON ===== */}
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
          tasks={tasks || []}
          existingMarkers={floorPlan.markers || []}
          onSelect={handleMarkerSelect}
          projectId={projectId}
          projectNumber={projectNumber}
          showToast={showToast}
          onDataRefresh={onDataRefresh}
        />
      )}

      {/* ================================================================== */}
      {/* PULSE ANIMATION STYLES                                            */}
      {/* ================================================================== */}
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