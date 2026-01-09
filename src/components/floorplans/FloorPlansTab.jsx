// ============================================================================
// FloorPlansTab Component
// ============================================================================
// Main container for the Floor Plans feature. Shows a grid of floor plans
// and opens a full-screen viewer modal when a plan is selected.
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Map,
  Plus,
  Upload,
  FileText,
  Image,
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  MapPin,
  MessageSquare,
  ClipboardList,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useFloorPlans } from '../../hooks/useFloorPlans';
import FloorPlanViewer from './FloorPlanViewer';
import FloorPlanUploadModal from './FloorPlanUploadModal';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function FloorPlansTab({ projectId, projectNumber, rfis = [], submittals = [], tasks = [], showToast, onDataRefresh }) {
  const { user } = useAuth();
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const { 
    floorPlans, 
    loading, 
    error,
    createFloorPlan,
    updateFloorPlan,
    deleteFloorPlan,
    createMarker,
    updateMarkerPosition,
    deleteMarker,
    updatePageName,
    fetchFloorPlans
  } = useFloorPlans(projectId);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [isPM, setIsPM] = useState(false);
  const [thumbnails, setThumbnails] = useState({});

  // ==========================================================================
  // CHECK PM STATUS
  // ==========================================================================
  useEffect(() => {
    if (user) {
      setIsPM(user.role === 'PM');
    }
  }, [user]);

  // ==========================================================================
  // SYNC SELECTED PLAN WITH FLOOR PLANS
  // ==========================================================================
  // This effect keeps selectedPlan in sync with floorPlans after data refreshes.
  // Without this, the viewer wouldn't show newly created markers until closed/reopened.
  // ==========================================================================
  useEffect(() => {
    if (selectedPlan) {
      const updatedPlan = floorPlans.find(fp => fp.id === selectedPlan.id);
      if (updatedPlan) {
        // Only update if markers have changed to avoid unnecessary re-renders
        const currentMarkerCount = selectedPlan.markers?.length || 0;
        const newMarkerCount = updatedPlan.markers?.length || 0;
        if (currentMarkerCount !== newMarkerCount || 
            JSON.stringify(selectedPlan.markers) !== JSON.stringify(updatedPlan.markers)) {
          setSelectedPlan(updatedPlan);
        }
      }
    }
  }, [floorPlans]);

  // ==========================================================================
  // LOAD THUMBNAILS
  // ==========================================================================
  useEffect(() => {
    const loadThumbnails = async () => {
      const newThumbnails = {};
      for (const plan of floorPlans) {
        if (!plan.file_type?.includes('pdf')) {
          try {
            const { data } = await supabase.storage
              .from('project-files')
              .getPublicUrl(plan.file_path);
            if (data?.publicUrl) {
              newThumbnails[plan.id] = data.publicUrl;
            }
          } catch (err) {
            console.error('Error loading thumbnail:', err);
          }
        }
      }
      setThumbnails(newThumbnails);
    };

    if (floorPlans.length > 0) {
      loadThumbnails();
    }
  }, [floorPlans]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleUploadSuccess = async (newPlan) => {
    showToast('Floor plan uploaded successfully', 'success');
    setShowUploadModal(false);
    await fetchFloorPlans();
  };

  const handleDeletePlan = async (plan) => {
    if (!confirm(`Delete "${plan.name}"? This will also delete all markers on this floor plan.`)) {
      return;
    }

    try {
      await deleteFloorPlan(plan.id, plan.file_path);
      showToast('Floor plan deleted', 'success');
      setMenuOpen(null);
    } catch (err) {
      showToast('Failed to delete floor plan', 'error');
    }
  };

  const handleRenamePlan = async (plan, newName) => {
    try {
      await updateFloorPlan(plan.id, { name: newName });
      showToast('Floor plan renamed', 'success');
      setEditingPlan(null);
    } catch (err) {
      showToast('Failed to rename floor plan', 'error');
    }
  };

  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleCloseViewer = () => {
    setSelectedPlan(null);
    fetchFloorPlans(); // Refresh to get updated markers
  };

  // ==========================================================================
  // GET MARKER COUNTS
  // ==========================================================================
  const getMarkerCounts = (plan) => {
    const markers = plan.markers || [];
    const rfiCount = markers.filter(m => m.item_type === 'rfi').length;
    const submittalCount = markers.filter(m => m.item_type === 'submittal').length;
    const taskCount = markers.filter(m => m.item_type === 'task').length;
    return { total: markers.length, rfiCount, submittalCount, taskCount };
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div>
      {/* ================================================================== */}
      {/* HEADER                                                            */}
      {/* ================================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <Map size={24} style={{ color: 'var(--sunbelt-orange)' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Floor Plans
          </h3>
          <span style={{
            padding: '2px 10px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)'
          }}>
            {floorPlans.length}
          </span>
        </div>

        {isPM && (
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            <Upload size={16} />
            Upload Floor Plan
          </button>
        )}
      </div>

      {/* ================================================================== */}
      {/* ERROR STATE                                                       */}
      {/* ================================================================== */}
      {error && (
        <div style={{
          padding: 'var(--space-md)',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#ef4444',
          marginBottom: 'var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* ================================================================== */}
      {/* LOADING STATE                                                     */}
      {/* ================================================================== */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-2xl)',
          color: 'var(--text-secondary)'
        }}>
          <div className="loading-spinner" style={{ marginBottom: 'var(--space-md)' }}></div>
          <p>Loading floor plans...</p>
        </div>
      ) : floorPlans.length === 0 ? (
        /* ================================================================== */
        /* EMPTY STATE                                                       */
        /* ================================================================== */
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-2xl)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <Map size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.5, marginBottom: 'var(--space-md)' }} />
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)', fontSize: '1.125rem' }}>
            No Floor Plans Yet
          </h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', maxWidth: '400px', margin: '0 auto var(--space-lg)' }}>
            Upload floor plans to mark RFI, Submittal, and Task locations directly on your drawings.
          </p>
          {isPM && (
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              <Upload size={16} />
              Upload First Floor Plan
            </button>
          )}
        </div>
      ) : (
        /* ================================================================== */
        /* FLOOR PLAN GRID                                                   */
        /* ================================================================== */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-lg)'
        }}>
          {floorPlans.map(plan => {
            const counts = getMarkerCounts(plan);
            const isMenuOpen = menuOpen === plan.id;
            const isPdf = plan.file_type?.includes('pdf');
            const thumbnailUrl = thumbnails[plan.id];

            return (
              <div
                key={plan.id}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  transition: 'all 0.15s',
                  cursor: 'pointer'
                }}
                onClick={() => handleViewPlan(plan)}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* ===== PREVIEW AREA ===== */}
                <div style={{
                  height: '180px',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid var(--border-color)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={plan.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : isPdf ? (
                    <FileText size={48} style={{ color: '#ef4444', opacity: 0.5 }} />
                  ) : (
                    <Image size={48} style={{ color: 'var(--info)', opacity: 0.5 }} />
                  )}
                  
                  {/* ===== PAGE COUNT BADGE ===== */}
                  {plan.page_count > 1 && (
                    <div style={{
                      position: 'absolute',
                      top: 'var(--space-sm)',
                      right: 'var(--space-sm)',
                      padding: '4px 10px',
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      {plan.page_count} pages
                    </div>
                  )}

                  {/* ===== PDF BADGE ===== */}
                  {isPdf && (
                    <div style={{
                      position: 'absolute',
                      top: 'var(--space-sm)',
                      left: 'var(--space-sm)',
                      padding: '4px 10px',
                      background: '#ef4444',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      PDF
                    </div>
                  )}

                  {/* ===== VIEW OVERLAY ===== */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  className="view-overlay"
                  >
                    <div style={{
                      padding: '8px 16px',
                      background: 'var(--sunbelt-orange)',
                      color: 'white',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }}
                    className="view-button"
                    >
                      <Eye size={16} />
                      View Floor Plan
                    </div>
                  </div>
                </div>

                {/* ===== INFO AREA ===== */}
                <div style={{ padding: 'var(--space-md)' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    {editingPlan === plan.id ? (
                      <input
                        type="text"
                        defaultValue={plan.name}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== plan.name) {
                            handleRenamePlan(plan, e.target.value.trim());
                          } else {
                            setEditingPlan(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                          else if (e.key === 'Escape') setEditingPlan(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          border: '1px solid var(--sunbelt-orange)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.9375rem',
                          fontWeight: '600'
                        }}
                      />
                    ) : (
                      <h4 style={{
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0,
                        flex: 1
                      }}>
                        {plan.name}
                      </h4>
                    )}

                    {/* ===== ACTION MENU ===== */}
                    {isPM && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(isMenuOpen ? null : plan.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              zIndex: 100,
                              minWidth: '140px',
                              overflow: 'hidden'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setEditingPlan(plan.id);
                                setMenuOpen(null);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-sm)',
                                width: '100%',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                            >
                              <Edit3 size={14} />
                              Rename
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-sm)',
                                width: '100%',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ===== MARKER STATS ===== */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} />
                      <span>{counts.total} markers</span>
                    </div>
                    {counts.rfiCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6' }}>
                        <MessageSquare size={14} />
                        <span>{counts.rfiCount}</span>
                      </div>
                    )}
                    {counts.submittalCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8b5cf6' }}>
                        <ClipboardList size={14} />
                        <span>{counts.submittalCount}</span>
                      </div>
                    )}
                    {counts.taskCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e' }}>
                        <CheckSquare size={14} />
                        <span>{counts.taskCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================== */}
      {/* UPLOAD MODAL                                                      */}
      {/* ================================================================== */}
      {showUploadModal && (
        <FloorPlanUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          projectId={projectId}
          projectNumber={projectNumber}
          onSuccess={handleUploadSuccess}
          existingCount={floorPlans.length}
        />
      )}

      {/* ================================================================== */}
      {/* VIEWER MODAL                                                      */}
      {/* ================================================================== */}
      {selectedPlan && (
        <FloorPlanViewer
          floorPlan={selectedPlan}
          projectId={projectId}
          projectNumber={projectNumber}
          rfis={rfis}
          submittals={submittals}
          tasks={tasks}
          isPM={isPM}
          onClose={handleCloseViewer}
          onMarkerCreate={createMarker}
          onMarkerUpdate={updateMarkerPosition}
          onMarkerDelete={deleteMarker}
          onPageRename={updatePageName}
          showToast={showToast}
          onRefresh={fetchFloorPlans}
          onDataRefresh={onDataRefresh}
        />
      )}

      {/* ===== HOVER STYLES ===== */}
      <style>{`
        .view-overlay:hover {
          background: rgba(0,0,0,0.4) !important;
        }
        .view-overlay:hover .view-button {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

export default FloorPlansTab;