// ============================================================================
// useFloorPlans Hook
// ============================================================================
// Custom hook for managing floor plans and markers data
// Handles CRUD operations for floor plans, pages, and markers
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
      const { data, error: fetchError } = await supabase
        .from('floor_plans')
        .select(`
          *,
          pages:floor_plan_pages(*),
          markers:floor_plan_markers(
            *,
            rfi:rfis!floor_plan_markers_item_id_fkey(
              id, rfi_number, subject, status, due_date, sent_to
            ),
            submittal:submittals!floor_plan_markers_item_id_fkey(
              id, submittal_number, title, status, due_date, sent_to, submittal_type
            )
          ),
          uploaded_by_user:users!floor_plans_uploaded_by_fkey(name)
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      
      // Process markers to attach the correct item data
      const processedData = (data || []).map(plan => ({
        ...plan,
        markers: (plan.markers || []).map(marker => ({
          ...marker,
          item: marker.item_type === 'rfi' ? marker.rfi : marker.submittal
        }))
      }));
      
      setFloorPlans(processedData);
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

      await fetchFloorPlans();
      return data;
    } catch (err) {
      console.error('Error creating floor plan:', err);
      throw err;
    }
  }, [fetchFloorPlans]);

  // ==========================================================================
  // UPDATE FLOOR PLAN
  // ==========================================================================
  const updateFloorPlan = useCallback(async (id, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('floor_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      await fetchFloorPlans();
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
      // First, delete the file from storage
      if (storagePath) {
        await supabase.storage
          .from('project-files')
          .remove([storagePath]);
      }

      // Then soft delete the record
      const { error: deleteError } = await supabase
        .from('floor_plans')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchFloorPlans();
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
      // Check if page entry exists
      const { data: existing } = await supabase
        .from('floor_plan_pages')
        .select('id')
        .eq('floor_plan_id', floorPlanId)
        .eq('page_number', pageNumber)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('floor_plan_pages')
          .update({ name })
          .eq('id', existing.id);
      } else {
        // Create new
        await supabase
          .from('floor_plan_pages')
          .insert([{ floor_plan_id: floorPlanId, page_number: pageNumber, name }]);
      }

      await fetchFloorPlans();
    } catch (err) {
      console.error('Error updating page name:', err);
      throw err;
    }
  }, [fetchFloorPlans]);

  // ==========================================================================
  // CREATE MARKER
  // ==========================================================================
  const createMarker = useCallback(async (markerData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('floor_plan_markers')
        .insert([markerData])
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchFloorPlans();
      return data;
    } catch (err) {
      console.error('Error creating marker:', err);
      throw err;
    }
  }, [fetchFloorPlans]);

  // ==========================================================================
  // UPDATE MARKER POSITION (for drag)
  // ==========================================================================
  const updateMarkerPosition = useCallback(async (markerId, x_percent, y_percent) => {
    try {
      const { error: updateError } = await supabase
        .from('floor_plan_markers')
        .update({ x_percent, y_percent })
        .eq('id', markerId);

      if (updateError) throw updateError;
      await fetchFloorPlans();
    } catch (err) {
      console.error('Error updating marker position:', err);
      throw err;
    }
  }, [fetchFloorPlans]);

  // ==========================================================================
  // DELETE MARKER
  // ==========================================================================
  const deleteMarker = useCallback(async (markerId) => {
    try {
      const { error: deleteError } = await supabase
        .from('floor_plan_markers')
        .delete()
        .eq('id', markerId);

      if (deleteError) throw deleteError;
      await fetchFloorPlans();
    } catch (err) {
      console.error('Error deleting marker:', err);
      throw err;
    }
  }, [fetchFloorPlans]);

  // ==========================================================================
  // GET MARKERS FOR AN ITEM (RFI or Submittal)
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
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('floor_plans')
          .update({ sort_order: index })
          .eq('id', id)
      );

      await Promise.all(updates);
      await fetchFloorPlans();
    } catch (err) {
      console.error('Error reordering floor plans:', err);
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