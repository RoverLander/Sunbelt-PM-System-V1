// ============================================================================
// useFloorPlans Hook
// ============================================================================
// Custom hook for managing floor plans and markers data
// Handles CRUD operations for floor plans, pages, and markers
// 
// OPTIMIZED: Uses optimistic updates for instant UI feedback
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useFloorPlans(projectId) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================================================
  // FETCH FLOOR PLANS
  // ==========================================================================
  const fetchFloorPlans = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch floor plans with pages and markers
      const { data, error: fetchError } = await supabase
        .from('floor_plans')
        .select(`
          *,
          pages:floor_plan_pages(*),
          markers:floor_plan_markers(*)
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      
      setFloorPlans(data || []);
    } catch (err) {
      console.error('Error fetching floor plans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // ==========================================================================
  // FETCH MARKERS FOR A SPECIFIC FLOOR PLAN
  // ==========================================================================
  const fetchMarkers = useCallback(async (floorPlanId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('floor_plan_markers')
        .select('*')
        .eq('floor_plan_id', floorPlanId);

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching markers:', err);
      throw err;
    }
  }, []);

  // ==========================================================================
  // CREATE FLOOR PLAN
  // ==========================================================================
  const createFloorPlan = useCallback(async (floorPlanData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('floor_plans')
        .insert([floorPlanData])
        .select()
        .single();

      if (insertError) throw insertError;

      // If it's a multi-page PDF, create page entries
      if (data.page_count > 1) {
        const pages = Array.from({ length: data.page_count }, (_, i) => ({
          floor_plan_id: data.id,
          page_number: i + 1,
          name: `Page ${i + 1}`
        }));

        await supabase.from('floor_plan_pages').insert(pages);
      }

      // ===== OPTIMISTIC UPDATE =====
      // Add to local state immediately
      setFloorPlans(prev => [...prev, { ...data, markers: [], pages: [] }]);
      
      return data;
    } catch (err) {
      console.error('Error creating floor plan:', err);
      throw err;
    }
  }, []);

  // ==========================================================================
  // UPDATE FLOOR PLAN
  // ==========================================================================
  const updateFloorPlan = useCallback(async (id, updates) => {
    try {
      // ===== OPTIMISTIC UPDATE =====
      setFloorPlans(prev => prev.map(fp => 
        fp.id === id ? { ...fp, ...updates } : fp
      ));

      const { data, error: updateError } = await supabase
        .from('floor_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        // Revert on error
        await fetchFloorPlans();
        throw updateError;
      }
      
      return data;
    } catch (err) {
      console.error('Error updating floor plan:', err);
      throw err;
    }
  }, [fetchFloorPlans]);

  // ==========================================================================
  // DELETE FLOOR PLAN (soft delete)
  // ==========================================================================
  const deleteFloorPlan = useCallback(async (id, storagePath) => {
    try {
      // ===== OPTIMISTIC UPDATE =====
      setFloorPlans(prev => prev.filter(fp => fp.id !== id));

      // Delete the file from storage
      if (storagePath) {
        await supabase.storage
          .from('project-files')
          .remove([storagePath]);
      }

      // Soft delete the record
      const { error: deleteError } = await supabase
        .from('floor_plans')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) {
        // Revert on error
        await fetchFloorPlans();
        throw deleteError;
      }
    } catch (err) {
      console.error('Error deleting floor plan:', err);
      throw err;
    }
  }, [fetchFloorPlans]);

  // ==========================================================================
  // UPDATE PAGE NAME
  // ==========================================================================
  const updatePageName = useCallback(async (floorPlanId, pageNumber, name) => {
    try {
      // ===== OPTIMISTIC UPDATE =====
      setFloorPlans(prev => prev.map(fp => {
        if (fp.id !== floorPlanId) return fp;
        
        const existingPageIndex = (fp.pages || []).findIndex(p => p.page_number === pageNumber);
        let updatedPages;
        
        if (existingPageIndex >= 0) {
          updatedPages = [...fp.pages];
          updatedPages[existingPageIndex] = { ...updatedPages[existingPageIndex], name };
        } else {
          updatedPages = [...(fp.pages || []), { floor_plan_id: floorPlanId, page_number: pageNumber, name }];
        }
        
        return { ...fp, pages: updatedPages };
      }));

      // Check if page entry exists
      const { data: existing } = await supabase
        .from('floor_plan_pages')
        .select('id')
        .eq('floor_plan_id', floorPlanId)
        .eq('page_number', pageNumber)
        .single();

      if (existing) {
        await supabase
          .from('floor_plan_pages')
          .update({ name })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('floor_plan_pages')
          .insert([{ floor_plan_id: floorPlanId, page_number: pageNumber, name }]);
      }
    } catch (err) {
      console.error('Error updating page name:', err);
      // Revert on error
      await fetchFloorPlans();
      throw err;
    }
  }, [fetchFloorPlans]);

  // ==========================================================================
  // CREATE MARKER - WITH OPTIMISTIC UPDATE
  // ==========================================================================
  const createMarker = useCallback(async (markerData) => {
    // ===== GENERATE TEMPORARY ID FOR OPTIMISTIC UPDATE =====
    const tempId = `temp-${Date.now()}`;
    const optimisticMarker = {
      ...markerData,
      id: tempId,
      created_at: new Date().toISOString()
    };

    try {
      // ===== OPTIMISTIC UPDATE - INSTANT UI FEEDBACK =====
      setFloorPlans(prev => prev.map(fp => {
        if (fp.id !== markerData.floor_plan_id) return fp;
        return {
          ...fp,
          markers: [...(fp.markers || []), optimisticMarker]
        };
      }));

      // ===== DATABASE INSERT =====
      const { data, error: insertError } = await supabase
        .from('floor_plan_markers')
        .insert([markerData])
        .select()
        .single();

      if (insertError) {
        // ===== REVERT ON ERROR =====
        setFloorPlans(prev => prev.map(fp => {
          if (fp.id !== markerData.floor_plan_id) return fp;
          return {
            ...fp,
            markers: (fp.markers || []).filter(m => m.id !== tempId)
          };
        }));
        throw insertError;
      }

      // ===== REPLACE TEMP MARKER WITH REAL DATA =====
      setFloorPlans(prev => prev.map(fp => {
        if (fp.id !== markerData.floor_plan_id) return fp;
        return {
          ...fp,
          markers: (fp.markers || []).map(m => 
            m.id === tempId ? data : m
          )
        };
      }));

      return data;
    } catch (err) {
      console.error('Error creating marker:', err);
      throw err;
    }
  }, []);

  // ==========================================================================
  // UPDATE MARKER POSITION (for drag) - WITH OPTIMISTIC UPDATE
  // ==========================================================================
  const updateMarkerPosition = useCallback(async (markerId, x_percent, y_percent) => {
    // ===== FIND WHICH FLOOR PLAN HAS THIS MARKER =====
    let floorPlanId = null;
    let originalPosition = null;
    
    for (const fp of floorPlans) {
      const marker = (fp.markers || []).find(m => m.id === markerId);
      if (marker) {
        floorPlanId = fp.id;
        originalPosition = { x_percent: marker.x_percent, y_percent: marker.y_percent };
        break;
      }
    }

    try {
      // ===== OPTIMISTIC UPDATE =====
      if (floorPlanId) {
        setFloorPlans(prev => prev.map(fp => {
          if (fp.id !== floorPlanId) return fp;
          return {
            ...fp,
            markers: (fp.markers || []).map(m => 
              m.id === markerId ? { ...m, x_percent, y_percent } : m
            )
          };
        }));
      }

      const { error: updateError } = await supabase
        .from('floor_plan_markers')
        .update({ x_percent, y_percent })
        .eq('id', markerId);

      if (updateError) {
        // ===== REVERT ON ERROR =====
        if (floorPlanId && originalPosition) {
          setFloorPlans(prev => prev.map(fp => {
            if (fp.id !== floorPlanId) return fp;
            return {
              ...fp,
              markers: (fp.markers || []).map(m => 
                m.id === markerId ? { ...m, ...originalPosition } : m
              )
            };
          }));
        }
        throw updateError;
      }
    } catch (err) {
      console.error('Error updating marker position:', err);
      throw err;
    }
  }, [floorPlans]);

  // ==========================================================================
  // DELETE MARKER - WITH OPTIMISTIC UPDATE
  // ==========================================================================
  const deleteMarker = useCallback(async (markerId) => {
    // ===== FIND WHICH FLOOR PLAN HAS THIS MARKER =====
    let floorPlanId = null;
    let deletedMarker = null;
    
    for (const fp of floorPlans) {
      const marker = (fp.markers || []).find(m => m.id === markerId);
      if (marker) {
        floorPlanId = fp.id;
        deletedMarker = marker;
        break;
      }
    }

    try {
      // ===== OPTIMISTIC UPDATE =====
      if (floorPlanId) {
        setFloorPlans(prev => prev.map(fp => {
          if (fp.id !== floorPlanId) return fp;
          return {
            ...fp,
            markers: (fp.markers || []).filter(m => m.id !== markerId)
          };
        }));
      }

      const { error: deleteError } = await supabase
        .from('floor_plan_markers')
        .delete()
        .eq('id', markerId);

      if (deleteError) {
        // ===== REVERT ON ERROR =====
        if (floorPlanId && deletedMarker) {
          setFloorPlans(prev => prev.map(fp => {
            if (fp.id !== floorPlanId) return fp;
            return {
              ...fp,
              markers: [...(fp.markers || []), deletedMarker]
            };
          }));
        }
        throw deleteError;
      }
    } catch (err) {
      console.error('Error deleting marker:', err);
      throw err;
    }
  }, [floorPlans]);

  // ==========================================================================
  // GET MARKERS FOR AN ITEM (RFI or Submittal or Task)
  // ==========================================================================
  const getMarkersForItem = useCallback(async (itemType, itemId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('floor_plan_markers')
        .select(`
          *,
          floor_plan:floor_plans(id, name, project_id)
        `)
        .eq('item_type', itemType)
        .eq('item_id', itemId);

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching markers for item:', err);
      throw err;
    }
  }, []);

  // ==========================================================================
  // REORDER FLOOR PLANS
  // ==========================================================================
  const reorderFloorPlans = useCallback(async (orderedIds) => {
    try {
      // ===== OPTIMISTIC UPDATE =====
      setFloorPlans(prev => {
        const planMap = new Map(prev.map(fp => [fp.id, fp]));
        return orderedIds.map((id, index) => ({
          ...planMap.get(id),
          sort_order: index
        })).filter(Boolean);
      });

      const updates = orderedIds.map((id, index) => 
        supabase
          .from('floor_plans')
          .update({ sort_order: index })
          .eq('id', id)
      );

      await Promise.all(updates);
    } catch (err) {
      console.error('Error reordering floor plans:', err);
      // Revert on error
      await fetchFloorPlans();
      throw err;
    }
  }, [fetchFloorPlans]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    fetchFloorPlans();
  }, [fetchFloorPlans]);

  // ==========================================================================
  // RETURN
  // ==========================================================================
  return {
    // Data
    floorPlans,
    loading,
    error,
    
    // Actions
    fetchFloorPlans,
    fetchMarkers,
    createFloorPlan,
    updateFloorPlan,
    deleteFloorPlan,
    updatePageName,
    createMarker,
    updateMarkerPosition,
    deleteMarker,
    getMarkersForItem,
    reorderFloorPlans
  };
}

export default useFloorPlans;