// ============================================================================
// FloorPlansTab Component
// ============================================================================
// Main container for the Floor Plans feature. Shows a list of floor plans
// and allows viewing/editing with markers for RFIs and Submittals.
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
  ChevronRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFloorPlans } from '../../hooks/useFloorPlans';
import FloorPlanViewer from './FloorPlanViewer';
import FloorPlanUploadModal from './FloorPlanUploadModal';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function FloorPlansTab({ projectId, projectNumber, rfis = [], submittals = [], showToast }) {
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

  // ==========================================================================
  // CHECK PM STATUS
  // ==========================================================================
  // Uses the user's global role from the users table
  useEffect(() => {
    if (user) {
      // Check if user has PM role (from AuthContext user object)
      setIsPM(user.role === 'PM');
    }
  }, [user]);

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

  const handleBackToList = () => {
    setSelectedPlan(null);
  };

  // ==========================================================================
  // GET MARKER COUNTS
  // ==========================================================================
  const getMarkerCounts = (plan) => {
    const markers = plan.markers || [];
    const rfiCount = markers.filter(m => m.item_type === 'rfi').length;
    const submittalCount = markers.filter(m => m.item_type === 'submittal').length;
    return { total: markers.length, rfiCount, submittalCount };
  };

  // ==========================================================================
  // GET FILE ICON
  // ==========================================================================
  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) {
      return <FileText size={24} style={{ color: '#ef4444' }} />;
    }
    return <Image size={24} style={{ color: 'var(--info)' }} />;
  };

  // ==========================================================================
  // RENDER - VIEWER MODE
  // ==========================================================================
  if (selectedPlan) {
    return (
      <FloorPlanViewer
        floorPlan={selectedPlan}
        projectId={projectId}
        projectNumber={projectNumber}
        rfis={rfis}
        submittals={submittals}
        isPM={isPM}
        onBack={handleBackToList}
        onMarkerCreate={createMarker}
        onMarkerUpdate={updateMarkerPosition}
        onMarkerDelete={deleteMarker}
        onPageRename={updatePageName}
        showToast={showToast}
        onRefresh={fetchFloorPlans}
      />
    );
  }

  // ==========================================================================
  // RENDER - LIST MODE
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
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0 
          }}>
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
              padding: '10px 20px',
              background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.15s'
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
          background: 'var(--danger-light)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--danger)',
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
          <Map size={64} style={{ 
            color: 'var(--text-tertiary)', 
            opacity: 0.5, 
            marginBottom: 'var(--space-md)' 
          }} />
          <h4 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--space-sm)',
            fontSize: '1.125rem'
          }}>
            No Floor Plans Yet
          </h4>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: 'var(--space-lg)',
            maxWidth: '400px',
            margin: '0 auto var(--space-lg)'
          }}>
            Upload floor plans to mark RFI and Submittal locations directly on your drawings.
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-lg)'
        }}>
          {floorPlans.map(plan => {
            const counts = getMarkerCounts(plan);
            const isMenuOpen = menuOpen === plan.id;

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
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Preview Area */}
                <div style={{
                  height: '140px',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid var(--border-color)',
                  position: 'relative'
                }}>
                  {getFileIcon(plan.file_type)}
                  
                  {/* Page count badge */}
                  {plan.page_count > 1 && (
                    <div style={{
                      position: 'absolute',
                      top: 'var(--space-sm)',
                      right: 'var(--space-sm)',
                      padding: '2px 8px',
                      background: 'rgba(0,0,0,0.6)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.6875rem',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      {plan.page_count} pages
                    </div>
                  )}
                </div>

                {/* Info Area */}
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
                          if (e.key === 'Enter') {
                            e.target.blur();
                          } else if (e.key === 'Escape') {
                            setEditingPlan(null);
                          }
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

                    {/* Action Menu */}
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
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex'
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
                              boxShadow: 'var(--shadow-lg)',
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
                                color: 'var(--danger)',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'var(--danger-light)'}
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

                  {/* Marker Stats */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} />
                      {counts.total} marker{counts.total !== 1 ? 's' : ''}
                    </div>
                    {counts.rfiCount > 0 && (
                      <span style={{ 
                        padding: '2px 6px', 
                        background: 'rgba(59, 130, 246, 0.15)', 
                        color: '#3b82f6',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        fontWeight: '600'
                      }}>
                        {counts.rfiCount} RFI
                      </span>
                    )}
                    {counts.submittalCount > 0 && (
                      <span style={{ 
                        padding: '2px 6px', 
                        background: 'rgba(255, 107, 53, 0.15)', 
                        color: 'var(--sunbelt-orange)',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        fontWeight: '600'
                      }}>
                        {counts.submittalCount} SUB
                      </span>
                    )}
                  </div>

                  {/* View Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    marginTop: 'var(--space-sm)',
                    color: 'var(--sunbelt-orange)',
                    fontSize: '0.8125rem',
                    fontWeight: '600'
                  }}>
                    <Eye size={14} style={{ marginRight: '4px' }} />
                    View Plan
                    <ChevronRight size={14} />
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

      {/* Close menu when clicking outside */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50
          }}
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  );
}

export default FloorPlansTab;