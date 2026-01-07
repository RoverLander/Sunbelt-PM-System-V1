// ============================================================================
// FloorPlanLocationPicker Component
// ============================================================================
// Embed this in RFI/Submittal/Task edit modals to allow users to:
// - See existing floor plan markers for this item
// - Add new markers by selecting a floor plan and clicking a location
// - Remove existing markers
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Map,
  MapPin,
  Plus,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Check,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function FloorPlanLocationPicker({
  projectId,
  itemType, // 'rfi' or 'submittal' or 'task'
  itemId,   // The ID of the RFI/Submittal/Task
  onMarkersChange // Callback when markers are added/removed
}) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [floorPlans, setFloorPlans] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fileUrl, setFileUrl] = useState(null);
  const [pendingPosition, setPendingPosition] = useState(null);
  const [saving, setSaving] = useState(false);

  const imageRef = useRef(null);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    if (projectId) {
      fetchFloorPlans();
    }
  }, [projectId]);

  useEffect(() => {
    if (itemId && itemType) {
      fetchMarkers();
    }
  }, [itemId, itemType]);

  const fetchFloorPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setFloorPlans(data || []);
    } catch (err) {
      console.error('Error fetching floor plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkers = async () => {
    if (!itemId) return;
    
    try {
      const { data, error } = await supabase
        .from('floor_plan_markers')
        .select(`
          *,
          floor_plan:floor_plans(id, name, file_path, page_count)
        `)
        .eq('item_type', itemType)
        .eq('item_id', itemId);

      if (error) throw error;
      setMarkers(data || []);
    } catch (err) {
      console.error('Error fetching markers:', err);
    }
  };

  // ==========================================================================
  // LOAD FILE URL WHEN PLAN SELECTED
  // ==========================================================================
  useEffect(() => {
    if (selectedPlan) {
      loadFileUrl(selectedPlan.file_path);
      setCurrentPage(1);
      setZoom(1);
      setPendingPosition(null);
    }
  }, [selectedPlan]);

  const loadFileUrl = async (filePath) => {
    try {
      const { data } = await supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        setFileUrl(data.publicUrl);
      }
    } catch (err) {
      console.error('Error loading file URL:', err);
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x_percent = ((e.clientX - rect.left) / rect.width) * 100;
    const y_percent = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPosition({ x_percent, y_percent });
  };

  const handleSaveMarker = async () => {
    if (!pendingPosition || !selectedPlan || !itemId) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('floor_plan_markers')
        .insert([{
          floor_plan_id: selectedPlan.id,
          page_number: currentPage,
          item_type: itemType,
          item_id: itemId,
          x_percent: pendingPosition.x_percent,
          y_percent: pendingPosition.y_percent
        }])
        .select(`
          *,
          floor_plan:floor_plans(id, name, file_path, page_count)
        `)
        .single();

      if (error) throw error;

      setMarkers(prev => [...prev, data]);
      setPendingPosition(null);
      setShowPicker(false);
      setSelectedPlan(null);
      onMarkersChange?.();
    } catch (err) {
      console.error('Error saving marker:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMarker = async (markerId) => {
    try {
      const { error } = await supabase
        .from('floor_plan_markers')
        .delete()
        .eq('id', markerId);

      if (error) throw error;

      setMarkers(prev => prev.filter(m => m.id !== markerId));
      onMarkersChange?.();
    } catch (err) {
      console.error('Error deleting marker:', err);
    }
  };

  const handleClosePicker = () => {
    setShowPicker(false);
    setSelectedPlan(null);
    setPendingPosition(null);
    setFileUrl(null);
  };

  // ==========================================================================
  // RENDER - NO FLOOR PLANS
  // ==========================================================================
  if (loading) {
    return (
      <div style={{ padding: 'var(--space-md)', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
        Loading floor plans...
      </div>
    );
  }

  if (floorPlans.length === 0) {
    return (
      <div style={{
        padding: 'var(--space-md)',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          <Map size={16} />
          <span>No floor plans uploaded for this project</span>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - MAIN COMPONENT
  // ==========================================================================
  return (
    <div>
      {/* Section Header */}
      <label style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-sm)'
      }}>
        <Map size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
        Floor Plan Location
      </label>

      {/* Existing Markers */}
      {markers.length > 0 && (
        <div style={{ marginBottom: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          {markers.map(marker => (
            <div
              key={marker.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-sm) var(--space-md)',
                background: 'rgba(255, 107, 53, 0.1)',
                border: '1px solid rgba(255, 107, 53, 0.2)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <MapPin size={14} style={{ color: 'var(--sunbelt-orange)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                  {marker.floor_plan?.name || 'Floor Plan'}
                  {marker.floor_plan?.page_count > 1 && ` (Page ${marker.page_number})`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteMarker(marker.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--danger)',
                  padding: '4px'
                }}
                title="Remove marker"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Location Button */}
      {!showPicker && (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--bg-primary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            width: '100%',
            justifyContent: 'center',
            transition: 'all 0.15s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
            e.currentTarget.style.color = 'var(--sunbelt-orange)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Plus size={14} />
          Add Floor Plan Location
        </button>
      )}

      {/* ================================================================== */}
      {/* PICKER MODAL                                                      */}
      {/* ================================================================== */}
      {showPicker && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-lg)'
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '1000px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid var(--border-color)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-md) var(--space-lg)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {selectedPlan ? 'Click to Place Marker' : 'Select Floor Plan'}
              </h3>
              <button
                type="button"
                onClick={handleClosePicker}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {!selectedPlan ? (
                /* Floor Plan Selection Grid */
                <div style={{ padding: 'var(--space-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                  {floorPlans.map(plan => {
                    const isPdf = plan.file_type === 'application/pdf';
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => !isPdf && setSelectedPlan(plan)}
                        disabled={isPdf}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-lg)',
                          cursor: isPdf ? 'not-allowed' : 'pointer',
                          opacity: isPdf ? 0.5 : 1,
                          textAlign: 'center',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => !isPdf && (e.currentTarget.style.borderColor = 'var(--sunbelt-orange)')}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                      >
                        <Map size={32} style={{ color: isPdf ? 'var(--text-tertiary)' : 'var(--sunbelt-orange)', marginBottom: 'var(--space-sm)' }} />
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {plan.name}
                        </div>
                        {isPdf && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            PDF - Use image for markers
                          </div>
                        )}
                        {plan.page_count > 1 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {plan.page_count} pages
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Floor Plan Image with Click Target */
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Toolbar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-sm) var(--space-lg)',
                    background: 'var(--bg-primary)',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>

                    {/* Page Navigation */}
                    {selectedPlan.page_count > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          style={{ padding: '6px', background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1, color: 'var(--text-primary)' }}
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          Page {currentPage} / {selectedPlan.page_count}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p => Math.min(selectedPlan.page_count, p + 1))}
                          disabled={currentPage === selectedPlan.page_count}
                          style={{ padding: '6px', background: 'none', border: 'none', cursor: currentPage === selectedPlan.page_count ? 'not-allowed' : 'pointer', opacity: currentPage === selectedPlan.page_count ? 0.3 : 1, color: 'var(--text-primary)' }}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    )}

                    {/* Zoom */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button type="button" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ZoomOut size={18} />
                      </button>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', minWidth: '45px', textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                      </span>
                      <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.25))} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ZoomIn size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Instruction */}
                  <div style={{
                    background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                    color: 'white',
                    padding: 'var(--space-sm) var(--space-lg)',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Click on the floor plan to mark the location
                  </div>

                  {/* Image Area */}
                  <div style={{
                    flex: 1,
                    overflow: 'auto',
                    background: '#0a0a14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--space-lg)'
                  }}>
                    {fileUrl && (
                      <div
                        style={{
                          position: 'relative',
                          transform: `scale(${zoom})`,
                          transformOrigin: 'center center',
                          transition: 'transform 0.15s'
                        }}
                      >
                        <img
                          ref={imageRef}
                          src={fileUrl}
                          alt={selectedPlan.name}
                          onClick={handleImageClick}
                          style={{
                            maxWidth: '100%',
                            display: 'block',
                            cursor: 'crosshair',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
                          }}
                        />

                        {/* Pending Marker */}
                        {pendingPosition && (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${pendingPosition.x_percent}%`,
                              top: `${pendingPosition.y_percent}%`,
                              transform: 'translate(-50%, -100%)',
                              pointerEvents: 'none'
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
                                boxShadow: '0 2px 12px rgba(255, 107, 53, 0.5)'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedPlan && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-sm)',
                padding: 'var(--space-md) var(--space-lg)',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-primary)'
              }}>
                <button
                  type="button"
                  onClick={handleClosePicker}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMarker}
                  disabled={!pendingPosition || saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: pendingPosition ? 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))' : 'var(--bg-tertiary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: pendingPosition ? 'white' : 'var(--text-tertiary)',
                    cursor: pendingPosition ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}
                >
                  <Check size={16} />
                  {saving ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FloorPlanLocationPicker;