// ============================================================================
// useWorkflowGraph.js - React Flow Graph Data Hook
// ============================================================================
// Fetches workflow stations and transforms them into React Flow nodes/edges.
//
// FEATURES:
// - Fetches stations from Supabase workflow_stations table
// - Calculates station statuses from linked tasks
// - Generates node positions based on phase zones
// - Creates edges based on station dependencies
// - Supports real-time updates (optional)
//
// Created: January 13, 2026
// ============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import {
  calculateStationStatus,
  getStationDeadline,
  getDaysUntilDeadline
} from '../../../utils/workflowUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

// Phase zone X positions (horizontal layout)
const PHASE_POSITIONS = {
  1: { x: 50, name: 'Initiation' },
  2: { x: 300, name: 'Dealer Sign-Offs' },
  3: { x: 600, name: 'Internal Approvals' },
  4: { x: 900, name: 'Delivery' }
};

// Vertical spacing between nodes in same phase
const VERTICAL_SPACING = 100;
const NODE_START_Y = 80;

// ============================================================================
// MAIN HOOK
// ============================================================================
export function useWorkflowGraph(projectId, options = {}) {
  const { enableRealtime = false } = options;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stations, setStations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRfis] = useState([]);

  // =========================================================================
  // DATA FETCHING
  // =========================================================================
  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [stationsRes, tasksRes, rfisRes] = await Promise.all([
        supabase
          .from('workflow_stations')
          .select('*')
          .order('phase')
          .order('display_order'),
        supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId),
        supabase
          .from('rfis')
          .select('*')
          .eq('project_id', projectId)
      ]);

      if (stationsRes.error) throw stationsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (rfisRes.error) throw rfisRes.error;

      setStations(stationsRes.data || []);
      setTasks(tasksRes.data || []);
      setRfis(rfisRes.data || []);
    } catch (err) {
      console.error('Error fetching workflow data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription (optional)
  useEffect(() => {
    if (!enableRealtime || !projectId) return;

    const tasksChannel = supabase
      .channel(`tasks-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [projectId, enableRealtime, fetchData]);

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  // Calculate station statuses based on linked tasks
  const stationStatuses = useMemo(() => {
    const statuses = {};

    stations.forEach(station => {
      const stationTasks = tasks.filter(t => t.workflow_station_key === station.station_key);
      statuses[station.station_key] = {
        status: calculateStationStatus(stationTasks),
        deadline: getStationDeadline(stationTasks),
        taskCount: stationTasks.length,
        tasks: stationTasks
      };
    });

    return statuses;
  }, [stations, tasks]);

  // Calculate RFI counts per station
  const stationRfiCounts = useMemo(() => {
    const counts = {};
    // RFIs might be linked via workflow_station_key or just via project
    rfis.forEach(rfi => {
      if (rfi.workflow_station_key) {
        counts[rfi.workflow_station_key] = (counts[rfi.workflow_station_key] || 0) + 1;
      }
    });
    return counts;
  }, [rfis]);

  // Generate React Flow nodes from stations
  const nodes = useMemo(() => {
    // Group stations by phase for positioning
    const stationsByPhase = {};
    stations.forEach(station => {
      if (!station.parent_station_key) { // Only root stations as nodes
        if (!stationsByPhase[station.phase]) {
          stationsByPhase[station.phase] = [];
        }
        stationsByPhase[station.phase].push(station);
      }
    });

    // Generate nodes with positions
    const generatedNodes = [];

    Object.entries(stationsByPhase).forEach(([phase, phaseStations]) => {
      const phaseX = PHASE_POSITIONS[phase]?.x || 50;

      phaseStations.forEach((station, index) => {
        const statusData = stationStatuses[station.station_key] || {};
        const daysUntil = statusData.deadline ? getDaysUntilDeadline(statusData.deadline) : null;

        generatedNodes.push({
          id: station.station_key,
          type: 'stationNode',
          position: {
            x: phaseX,
            y: NODE_START_Y + (index * VERTICAL_SPACING)
          },
          data: {
            name: station.name || station.station_name,
            status: statusData.status || 'not_started',
            phase: parseInt(phase),
            phaseName: PHASE_POSITIONS[phase]?.name || `Phase ${phase}`,
            court: station.default_owner || 'factory',
            dueDate: statusData.deadline,
            daysUntil,
            taskCount: statusData.taskCount || 0,
            rfiCount: stationRfiCounts[station.station_key] || 0,
            progress: calculateProgress(statusData.tasks || []),
            isOverdue: daysUntil !== null && daysUntil < 0,
            stationKey: station.station_key,
            description: station.description
          },
          draggable: true
        });
      });
    });

    return generatedNodes;
  }, [stations, stationStatuses, stationRfiCounts]);

  // Generate React Flow edges from station dependencies
  const edges = useMemo(() => {
    const generatedEdges = [];

    // Create sequential edges within each phase
    const stationsByPhase = {};
    stations.forEach(station => {
      if (!station.parent_station_key) {
        if (!stationsByPhase[station.phase]) {
          stationsByPhase[station.phase] = [];
        }
        stationsByPhase[station.phase].push(station);
      }
    });

    // Sort by display_order and create edges
    Object.values(stationsByPhase).forEach(phaseStations => {
      const sorted = phaseStations.sort((a, b) => a.display_order - b.display_order);

      for (let i = 0; i < sorted.length - 1; i++) {
        const source = sorted[i];
        const target = sorted[i + 1];
        const sourceStatus = stationStatuses[source.station_key]?.status || 'not_started';

        generatedEdges.push({
          id: `${source.station_key}-${target.station_key}`,
          source: source.station_key,
          target: target.station_key,
          type: 'pulsingEdge',
          data: {
            status: sourceStatus
          },
          animated: sourceStatus === 'in_progress'
        });
      }
    });

    // Create edges between phases (last station of phase N to first station of phase N+1)
    const phases = Object.keys(stationsByPhase).sort((a, b) => parseInt(a) - parseInt(b));

    for (let i = 0; i < phases.length - 1; i++) {
      const currentPhase = stationsByPhase[phases[i]];
      const nextPhase = stationsByPhase[phases[i + 1]];

      if (currentPhase?.length && nextPhase?.length) {
        const lastInCurrent = currentPhase[currentPhase.length - 1];
        const firstInNext = nextPhase[0];
        const sourceStatus = stationStatuses[lastInCurrent.station_key]?.status || 'not_started';

        generatedEdges.push({
          id: `phase-${phases[i]}-to-${phases[i + 1]}`,
          source: lastInCurrent.station_key,
          target: firstInNext.station_key,
          type: 'pulsingEdge',
          data: {
            status: sourceStatus === 'completed' ? 'completed' : 'not_started',
            isPhaseConnection: true
          },
          style: {
            strokeWidth: 3
          }
        });
      }
    }

    return generatedEdges;
  }, [stations, stationStatuses]);

  // =========================================================================
  // ACTIONS
  // =========================================================================

  // Update station status (manual override)
  const updateStationStatus = useCallback(async (stationKey, newStatus) => {
    // This would update a project_station_status table if we had one
    // For now, statuses are derived from tasks
    console.log('Station status update requested:', stationKey, newStatus);
    await fetchData(); // Refresh data
  }, [fetchData]);

  // =========================================================================
  // RETURN
  // =========================================================================
  return {
    // Data
    nodes,
    edges,
    stations,
    tasks,
    stationStatuses,

    // State
    loading,
    error,

    // Actions
    refetch: fetchData,
    updateStationStatus
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate progress percentage from tasks
 */
function calculateProgress(tasks) {
  if (!tasks || tasks.length === 0) return 0;

  const completedCount = tasks.filter(t =>
    t.status === 'Completed' || t.status === 'Cancelled'
  ).length;

  return Math.round((completedCount / tasks.length) * 100);
}

export default useWorkflowGraph;
