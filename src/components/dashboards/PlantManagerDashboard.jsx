// ============================================================================
// PlantManagerDashboard.jsx - Plant General Manager Dashboard
// ============================================================================
// Main dashboard for Plant GM role showing production line, calendar,
// crew status, and factory operations overview.
//
// FEATURES:
// - Overview grid with key metrics
// - Production Line Canvas (12 stations)
// - Module scheduling calendar
// - Crew attendance/status
// - Inspection tracking
//
// Created: January 15, 2026
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Factory,
  Calendar,
  Users,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Truck,
  ClipboardCheck,
  Settings,
  RefreshCw,
  ChevronRight,
  Activity,
  Loader,
  Zap,
  GripVertical,
  XCircle,
  BarChart3,
  Gauge
} from 'lucide-react';
import { startOfWeek, addDays, isToday } from 'date-fns';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { getStationsWithModuleCounts, getQueueStatusColor } from '../../services/stationService';
import { getModulesByFactory, getModuleStatusColor, moveModuleToStation } from '../../services/modulesService';
import {
  getWorkersByFactory,
  getActiveShifts,
  getAttendanceSummary,
  getShiftsForDateRange,
  clockIn,
  clockOut,
  startBreak,
  endBreak
} from '../../services/workersService';
import { getQCRecordsByFactory, getPendingInspections } from '../../services/qcService';
import StationDetailModal from '../production/StationDetailModal';
import ModuleDetailModal from '../production/ModuleDetailModal';
import ProductionCalendar from '../production/ProductionCalendar';
import ScheduleModuleModal from '../production/ScheduleModuleModal';
import SimModeToolbar from '../production/SimModeToolbar';

// Batch 2 Components
import TaktTimeTracker from '../production/TaktTimeTracker';
import QueueTimeMonitor from '../production/QueueTimeMonitor';
import QCInspectionModal from '../production/QCInspectionModal';
import CrewScheduleView from '../production/CrewScheduleView';
import AttendanceDashboard from '../production/AttendanceDashboard';

// Batch 3 Components
import KaizenBoard from '../production/KaizenBoard';
import DefectCycleTimer from '../production/DefectCycleTimer';
import CrewUtilizationHeatmap from '../production/CrewUtilizationHeatmap';
import OEECalculator from '../production/OEECalculator';
import CrossTrainingMatrix from '../production/CrossTrainingMatrix';
import VisualLoadBoard from '../production/VisualLoadBoard';

// Batch 4 Components
import PlantConfigPanel from '../production/PlantConfigPanel';
import PipelineAutoSchedule from '../production/PipelineAutoSchedule';
import DailyReportGenerator from '../production/DailyReportGenerator';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-xl)'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '4px'
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.15s ease'
  },
  tabBar: {
    display: 'flex',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-xl)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: 'var(--space-md)'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-lg)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.15s ease'
  },
  tabActive: {
    background: 'var(--sunbelt-orange)',
    color: 'white'
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)'
  },
  statCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-md)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
    minWidth: 0
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  // Production Line Section
  section: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-lg)'
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },

  // Production Line Canvas
  productionLine: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md) 0'
  },
  stationBox: {
    minWidth: 0,
    background: 'var(--bg-tertiary)',
    border: '2px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-sm)',
    textAlign: 'center',
    position: 'relative',
    transition: 'all 0.15s ease',
    cursor: 'pointer'
  },
  stationName: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  stationCount: {
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '2px'
  },
  stationLabel: {
    fontSize: '0.6rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase'
  },
  stationOrder: {
    position: 'absolute',
    top: '-6px',
    left: '-6px',
    width: '16px',
    height: '16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '50%',
    fontSize: '0.6rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)'
  },

  // Module Cards
  moduleList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-md)'
  },
  moduleCard: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    borderLeft: '4px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  moduleSerial: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '4px'
  },
  moduleProject: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-sm)'
  },
  moduleMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  moduleStatus: {
    fontSize: '0.65rem',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '500'
  },

  // Crew Section
  crewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-md)'
  },
  crewCard: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  crewAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--sunbelt-orange)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  crewName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  crewRole: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  crewStatus: {
    marginLeft: 'auto',
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xxl)',
    color: 'var(--text-secondary)'
  },
  emptyIcon: {
    marginBottom: 'var(--space-md)',
    opacity: 0.5
  },

  // Loading
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-xxl)',
    color: 'var(--text-secondary)'
  },

  // Batch 2: Crew sub-tab bar
  crewSubTabBar: {
    display: 'flex',
    gap: 'var(--space-xs)',
    marginBottom: 'var(--space-lg)',
    background: 'var(--bg-tertiary)',
    padding: 'var(--space-xs)',
    borderRadius: 'var(--radius-md)',
    width: 'fit-content'
  },
  crewSubTab: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.15s ease'
  },
  crewSubTabActive: {
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },

  // Batch 2: Metrics row for Overview/Production
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)'
  },

  // Batch 2: Quality stats grid
  qualityStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)'
  },

  // Batch 2: QC record item
  qcRecordItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    borderLeft: '4px solid',
    transition: 'all 0.15s ease'
  }
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

// eslint-disable-next-line no-unused-vars
function StatCard({ icon: Icon, value, label, color, onClick }) {
  return (
    <div
      style={styles.statCard}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ ...styles.statIcon, background: `${color}20` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

// ============================================================================
// STATION BOX COMPONENT
// ============================================================================

function StationBox({ station, onClick, onDragOver, onDrop, isDragTarget }) {
  const queueColor = getQueueStatusColor(station.module_count);

  return (
    <div
      style={{
        ...styles.stationBox,
        borderColor: isDragTarget ? 'var(--sunbelt-orange)' : (station.color || 'var(--border-color)'),
        boxShadow: isDragTarget ? '0 0 0 2px var(--sunbelt-orange)' : 'none'
      }}
      onClick={() => onClick(station)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, station)}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${station.color}10`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--bg-tertiary)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={styles.stationOrder}>{station.order_num}</div>
      <div style={styles.stationName} title={station.name}>
        {station.name}
      </div>
      <div style={{ ...styles.stationCount, color: queueColor }}>
        {station.module_count}
      </div>
      <div style={styles.stationLabel}>modules</div>
    </div>
  );
}

// ============================================================================
// MODULE CARD COMPONENT
// ============================================================================

function ModuleCard({ module, onClick, draggable, onDragStart }) {
  const statusColor = getModuleStatusColor(module.status);

  return (
    <div
      style={{
        ...styles.moduleCard,
        borderLeftColor: statusColor,
        cursor: draggable ? 'grab' : 'pointer'
      }}
      onClick={() => onClick(module)}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, module)}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-secondary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--bg-tertiary)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        {draggable && (
          <GripVertical size={14} color="var(--text-tertiary)" style={{ cursor: 'grab' }} />
        )}
        <div>
          <div style={styles.moduleSerial}>
            {module.serial_number}
            {module.is_rush && (
              <Zap size={12} color="#ef4444" style={{ marginLeft: '4px' }} />
            )}
          </div>
          <div style={styles.moduleProject}>
            {module.project?.name || 'Unknown Project'}
          </div>
        </div>
      </div>
      <div style={styles.moduleMeta}>
        <div
          style={{
            ...styles.moduleStatus,
            background: `${statusColor}20`,
            color: statusColor
          }}
        >
          {module.status}
        </div>
        {module.current_station && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
            @ {module.current_station.name}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlantManagerDashboard({ onNavigateToProject, initialView = 'overview' }) {
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState(initialView);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [factoryId, setFactoryId] = useState(null);
  const [factoryCode, setFactoryCode] = useState(null);
  const [stations, setStations] = useState([]);
  const [modules, setModules] = useState([]);
  const [activeShifts, setActiveShifts] = useState([]);
  const [attendance, setAttendance] = useState({ total: 0, present: 0, absent: 0, late: 0 });
  const [projects, setProjects] = useState([]);

  // Modal state
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showStationModal, setShowStationModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);

  // Drag state for GM overrides
  const [draggedModule, setDraggedModule] = useState(null);

  // Calendar/Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [moduleToSchedule, setModuleToSchedule] = useState(null);

  // Simulation mode state
  const [isSimMode, setIsSimMode] = useState(false);
  const [simulatedChanges, setSimulatedChanges] = useState({});
  const [publishing, setPublishing] = useState(false);

  // Batch 2: Crew sub-tab state
  const [crewSubTab, setCrewSubTab] = useState('attendance');

  // Batch 2: Extended worker data
  const [workers, setWorkers] = useState([]);
  const [weeklyShifts, setWeeklyShifts] = useState([]);
  const [absences, _setAbsences] = useState([]); // Reserved for future absences service

  // Batch 2: QC data
  const [qcRecords, setQcRecords] = useState([]);
  const [pendingInspections, setPendingInspections] = useState([]);
  const [showQCModal, setShowQCModal] = useState(false);
  const [qcModule, setQcModule] = useState(null);
  const [qcStation, setQcStation] = useState(null);

  // Fetch user's factory
  useEffect(() => {
    fetchUserFactory();
  }, [user]);

  // Fetch data when factory is set
  useEffect(() => {
    if (factoryId) {
      fetchAllData();
    }
  }, [factoryId]);

  const fetchUserFactory = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('factory_id, factory')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (userData?.factory_id) {
        setFactoryId(userData.factory_id);
        setFactoryCode(userData.factory);
      } else if (userData?.factory) {
        // Get factory_id from code
        const { data: factory } = await supabase
          .from('factories')
          .select('id')
          .eq('code', userData.factory)
          .single();

        if (factory) {
          setFactoryId(factory.id);
          setFactoryCode(userData.factory);
        }
      }
    } catch (error) {
      console.error('Error fetching user factory:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStations(),
        fetchModules(),
        fetchShifts(),
        fetchProjects(),
        fetchWorkers(),
        fetchWeeklyShifts(),
        fetchQCData()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    const { data } = await getStationsWithModuleCounts(factoryId);
    setStations(data || []);
  };

  const fetchModules = async () => {
    const { data } = await getModulesByFactory(factoryId);
    setModules(data || []);
  };

  const fetchShifts = async () => {
    const { data } = await getActiveShifts(factoryId);
    setActiveShifts(data || []);

    const { data: attendanceData } = await getAttendanceSummary(factoryId);
    setAttendance(attendanceData);
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('factory_id', factoryId)
      .in('status', ['Active', 'In Progress', 'Production'])
      .order('delivery_date', { ascending: true });

    if (!error) setProjects(data || []);
  };

  // Batch 2: Fetch workers for attendance and schedule views
  const fetchWorkers = async () => {
    const { data } = await getWorkersByFactory(factoryId, { isActive: true });
    setWorkers(data || []);
  };

  // Batch 2: Fetch weekly shifts for schedule view
  const fetchWeeklyShifts = async (weekStart = null) => {
    const start = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = addDays(start, 7);
    const { data } = await getShiftsForDateRange(factoryId, start, end);
    setWeeklyShifts(data || []);
  };

  // Batch 2: Fetch QC data
  const fetchQCData = async () => {
    try {
      const [recordsResult, pendingResult] = await Promise.all([
        getQCRecordsByFactory(factoryId),
        getPendingInspections(factoryId)
      ]);
      setQcRecords(recordsResult?.data || []);
      setPendingInspections(pendingResult?.data || []);
    } catch (error) {
      console.error('Error fetching QC data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Batch 2: Clock in handler
  const handleClockIn = async (workerId) => {
    try {
      const { error } = await clockIn(workerId, 'manual');
      if (!error) {
        fetchShifts();
        fetchWorkers();
      }
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  // Batch 2: Clock out handler
  const handleClockOut = async (shiftId) => {
    try {
      const { error } = await clockOut(shiftId);
      if (!error) {
        fetchShifts();
      }
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  // Batch 2: Start break handler
  const handleStartBreak = async (shiftId) => {
    try {
      const { success } = await startBreak(shiftId, 'break');
      if (success) {
        fetchShifts();
      }
    } catch (error) {
      console.error('Error starting break:', error);
    }
  };

  // Batch 2: End break handler
  const handleEndBreak = async (shiftId) => {
    try {
      const { success } = await endBreak(shiftId);
      if (success) {
        fetchShifts();
      }
    } catch (error) {
      console.error('Error ending break:', error);
    }
  };

  // Batch 2: Start QC inspection handler
  const handleStartQCInspection = (module, station = null) => {
    setQcModule(module);
    setQcStation(station || module.current_station);
    setShowQCModal(true);
  };

  // Computed stats
  const stats = useMemo(() => {
    const inProgress = modules.filter(m => m.status === 'In Progress').length;
    const inQueue = modules.filter(m => m.status === 'In Queue').length;
    const completed = modules.filter(m => m.status === 'Completed').length;
    const staged = modules.filter(m => m.status === 'Staged').length;

    return {
      activeModules: inProgress + inQueue,
      inProgress,
      completed,
      staged,
      activeProjects: projects.length,
      crewPresent: attendance.present,
      crewTotal: attendance.total
    };
  }, [modules, projects, attendance]);

  // Handle station click - opens station detail modal
  const handleStationClick = (station) => {
    setSelectedStation(station);
    setShowStationModal(true);
  };

  // Handle module click - opens module detail modal
  const handleModuleClick = (module) => {
    setSelectedModule(module);
    setShowModuleModal(true);
  };

  // Close modals
  const handleCloseStationModal = () => {
    setShowStationModal(false);
    setSelectedStation(null);
  };

  const handleCloseModuleModal = () => {
    setShowModuleModal(false);
    setSelectedModule(null);
  };

  // Handle module status change from modal
  const handleModuleStatusChange = (updatedModule) => {
    setModules(prev =>
      prev.map(m => m.id === updatedModule.id ? updatedModule : m)
    );
    fetchStations(); // Refresh station counts
  };

  // Navigate to project from module modal
  const handleNavigateToProjectFromModule = (projectId) => {
    handleCloseModuleModal();
    if (onNavigateToProject) {
      onNavigateToProject(projectId, 'workflow');
    }
  };

  // Start work on a module from station modal
  const handleStartWork = async (module) => {
    if (!module) return;
    try {
      // Update module status to In Progress
      const { data, error } = await supabase
        .from('modules')
        .update({ status: 'In Progress', actual_start: new Date().toISOString() })
        .eq('id', module.id)
        .select()
        .single();

      if (!error && data) {
        handleModuleStatusChange(data);
        handleCloseStationModal();
      }
    } catch (error) {
      console.error('Error starting work:', error);
    }
  };

  // Drag and drop handlers for GM override
  const handleDragStart = (e, module) => {
    setDraggedModule(module);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStation) => {
    e.preventDefault();
    if (!draggedModule || draggedModule.current_station_id === targetStation.id) {
      setDraggedModule(null);
      return;
    }

    try {
      // Move module to target station
      const { data, error } = await moveModuleToStation(
        draggedModule.id,
        targetStation.id
      );

      if (!error && data) {
        // Log the GM override
        await supabase.from('calendar_audit').insert({
          factory_id: factoryId,
          user_id: user.id,
          action: 'gm_override_move',
          entity_type: 'module',
          entity_id: draggedModule.id,
          new_data: {
            module_serial: draggedModule.serial_number,
            from_station_id: draggedModule.current_station_id,
            to_station_id: targetStation.id,
            to_station_name: targetStation.name
          }
        });

        // Refresh data
        fetchModules();
        fetchStations();
      }
    } catch (error) {
      console.error('Error moving module:', error);
    }

    setDraggedModule(null);
  };

  // Check if user is Plant Manager (for GM override features)
  const isPlantManager = user?.role?.toLowerCase() === 'plant manager' ||
                         user?.role?.toLowerCase() === 'plant_manager' ||
                         user?.role?.toLowerCase() === 'plant_gm';

  // Simulation mode handlers
  const handleToggleSimMode = () => {
    if (isSimMode && Object.keys(simulatedChanges).length > 0) {
      if (!window.confirm('You have unsaved simulation changes. Discard them?')) {
        return;
      }
      setSimulatedChanges({});
    }
    setIsSimMode(!isSimMode);
  };

  const handleSimulatedSchedule = ({ moduleId, startDate }) => {
    setSimulatedChanges(prev => ({
      ...prev,
      [moduleId]: startDate
    }));
  };

  const handleDiscardSimChanges = () => {
    if (window.confirm('Discard all simulation changes?')) {
      setSimulatedChanges({});
    }
  };

  const handlePublishSimChanges = async () => {
    const changes = Object.entries(simulatedChanges);
    if (changes.length === 0) return;

    setPublishing(true);

    try {
      // Update each module's scheduled_start
      const updates = changes.map(([moduleId, newDate]) =>
        supabase
          .from('modules')
          .update({
            scheduled_start: newDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', moduleId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} module(s)`);
      }

      // Create audit log entry
      await supabase.from('calendar_audit').insert({
        factory_id: factoryId,
        user_id: user.id,
        action: 'sim_publish',
        entity_type: 'batch',
        new_data: {
          changes_count: changes.length,
          modules: changes.map(([id, date]) => ({ id, scheduled_start: date }))
        },
        from_simulation: true,
        notes: `Published ${changes.length} schedule change(s) from simulation mode`
      });

      // Clear simulation state and refresh data
      setSimulatedChanges({});
      setIsSimMode(false);
      fetchModules();
    } catch (error) {
      console.error('Error publishing simulation changes:', error);
      alert('Failed to publish changes: ' + error.message);
    } finally {
      setPublishing(false);
    }
  };

  // Open schedule modal for a module
  const handleOpenScheduleModal = (module) => {
    setModuleToSchedule(module);
    setShowScheduleModal(true);
  };

  // Handle scheduling from the modal
  const handleScheduleModule = (result) => {
    if (isSimMode) {
      // In sim mode, store in simulated changes
      handleSimulatedSchedule(result);
    } else {
      // Real update - refresh modules
      fetchModules();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.loading}>
        <Loader size={32} className="spinning" />
        <p style={{ marginTop: 'var(--space-md)' }}>Loading factory data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Factory size={28} />
            Plant Manager Dashboard
          </h1>
          <p style={styles.subtitle}>
            {factoryCode || 'Factory'} Production Overview
          </p>
        </div>
        <button
          style={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'production', label: 'Production', icon: Factory },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'crew', label: 'Crew', icon: Users },
          { id: 'quality', label: 'Quality', icon: ClipboardCheck },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'pipeline', label: 'Pipeline', icon: Zap },
          { id: 'reports', label: 'Reports', icon: ClipboardCheck },
          { id: 'config', label: 'Config', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Grid - Always visible */}
      <div style={styles.statsGrid}>
        <StatCard
          icon={Package}
          value={stats.activeModules}
          label="Active Modules"
          color="#3b82f6"
        />
        <StatCard
          icon={Activity}
          value={stats.inProgress}
          label="In Progress"
          color="#22c55e"
        />
        <StatCard
          icon={Clock}
          value={stats.staged}
          label="Staged"
          color="#8b5cf6"
        />
        <StatCard
          icon={Truck}
          value={stats.completed}
          label="Completed Today"
          color="#14b8a6"
        />
        <StatCard
          icon={Users}
          value={`${stats.crewPresent}/${stats.crewTotal}`}
          label="Crew Present"
          color="#f59e0b"
        />
        <StatCard
          icon={ClipboardCheck}
          value={stats.activeProjects}
          label="Active Projects"
          color="#ec4899"
        />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Batch 2: Metrics Widgets Row */}
          <div style={styles.metricsRow}>
            <TaktTimeTracker
              factoryId={factoryId}
              stations={stations}
              modules={modules}
              compact={true}
              onStationClick={(station) => {
                handleStationClick(station);
                setActiveTab('production');
              }}
            />
            <QueueTimeMonitor
              factoryId={factoryId}
              stations={stations}
              modules={modules}
              compact={true}
              onModuleClick={(module) => {
                handleModuleClick(module);
                setActiveTab('production');
              }}
            />
          </div>

          {/* Production Line Preview */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <Factory size={20} />
                Production Line Status
              </h2>
              <button
                style={{ ...styles.refreshBtn, fontSize: '0.75rem' }}
                onClick={() => setActiveTab('production')}
              >
                View Details <ChevronRight size={14} />
              </button>
            </div>
            <div style={styles.productionLine}>
              {stations.map((station) => (
                <StationBox
                  key={station.id}
                  station={station}
                  onClick={handleStationClick}
                  onDragOver={isPlantManager ? handleDragOver : undefined}
                  onDrop={isPlantManager ? handleDrop : undefined}
                  isDragTarget={draggedModule && draggedModule.current_station_id !== station.id}
                />
              ))}
            </div>
          </div>

          {/* Active Modules */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <Package size={20} />
                Active Modules
              </h2>
            </div>
            {modules.length > 0 ? (
              <div style={styles.moduleList}>
                {modules.slice(0, 6).map(module => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onClick={handleModuleClick}
                    draggable={isPlantManager}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <Package size={48} style={styles.emptyIcon} />
                <p>No active modules in production</p>
              </div>
            )}
          </div>

          {/* Batch 3: Analytics Widgets Row */}
          <div style={styles.metricsRow}>
            <OEECalculator
              factoryId={factoryId}
              targetOEE={75}
              compact={true}
            />
            <VisualLoadBoard
              factoryId={factoryId}
              compact={true}
              onModuleClick={handleModuleClick}
            />
          </div>

          {/* Batch 3: Kaizen & Defect Row */}
          <div style={styles.metricsRow}>
            <KaizenBoard
              factoryId={factoryId}
              compact={true}
            />
            <DefectCycleTimer
              factoryId={factoryId}
              compact={true}
              thresholdHours={4}
            />
          </div>
        </>
      )}

      {/* Production Tab */}
      {activeTab === 'production' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Factory size={20} />
              Production Line
              {isPlantManager && (
                <span style={{
                  fontSize: '0.65rem',
                  background: 'var(--sunbelt-orange)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  marginLeft: 'var(--space-sm)',
                  fontWeight: '600'
                }}>
                  <Zap size={10} style={{ marginRight: '2px' }} />
                  GM Mode
                </span>
              )}
            </h2>
          </div>
          <div style={styles.productionLine}>
            {stations.map((station) => (
              <StationBox
                key={station.id}
                station={station}
                onClick={handleStationClick}
                onDragOver={isPlantManager ? handleDragOver : undefined}
                onDrop={isPlantManager ? handleDrop : undefined}
                isDragTarget={draggedModule && draggedModule.current_station_id !== station.id}
              />
            ))}
          </div>

          {/* Batch 2: Full Metrics Widgets */}
          <div style={{ ...styles.metricsRow, marginTop: 'var(--space-lg)' }}>
            <TaktTimeTracker
              factoryId={factoryId}
              stations={stations}
              modules={modules}
              compact={false}
              onStationClick={handleStationClick}
            />
            <QueueTimeMonitor
              factoryId={factoryId}
              stations={stations}
              modules={modules}
              compact={false}
              onModuleClick={handleModuleClick}
            />
          </div>

          {/* Modules by Station */}
          {stations.map(station => {
            const stationModules = modules.filter(m => m.current_station_id === station.id);
            if (stationModules.length === 0) return null;

            return (
              <div key={station.id} style={{ marginTop: 'var(--space-xl)' }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: station.color,
                  marginBottom: 'var(--space-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)'
                }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: station.color
                  }} />
                  {station.name} ({stationModules.length})
                </h3>
                <div style={styles.moduleList}>
                  {stationModules.map(module => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      onClick={handleModuleClick}
                      draggable={isPlantManager}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Calendar size={20} />
              Production Calendar
            </h2>
          </div>

          {/* Simulation Mode Toolbar */}
          <SimModeToolbar
            isSimMode={isSimMode}
            onToggleSimMode={handleToggleSimMode}
            simulatedChanges={simulatedChanges}
            modules={modules}
            onPublish={handlePublishSimChanges}
            onDiscard={handleDiscardSimChanges}
            publishing={publishing}
            userRole={user?.role}
          />

          {/* Production Calendar */}
          <ProductionCalendar
            modules={modules}
            onModuleClick={handleOpenScheduleModal}
            onScheduleModule={handleScheduleModule}
            isSimMode={isSimMode}
            simulatedChanges={simulatedChanges}
            userRole={user?.role}
          />

          {/* Unscheduled Modules List */}
          {modules.filter(m => !m.scheduled_start).length > 0 && (
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }}>
                <AlertTriangle size={16} color="#f59e0b" />
                Unscheduled Modules ({modules.filter(m => !m.scheduled_start).length})
              </h3>
              <div style={styles.moduleList}>
                {modules.filter(m => !m.scheduled_start).slice(0, 8).map(module => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onClick={() => handleOpenScheduleModal(module)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crew Tab - Batch 2 Enhanced with Sub-Tabs */}
      {activeTab === 'crew' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Users size={20} />
              Crew Management
            </h2>
          </div>

          {/* Sub-Tab Bar */}
          <div style={styles.crewSubTabBar}>
            <button
              style={{
                ...styles.crewSubTab,
                ...(crewSubTab === 'attendance' ? styles.crewSubTabActive : {})
              }}
              onClick={() => setCrewSubTab('attendance')}
            >
              Attendance
            </button>
            <button
              style={{
                ...styles.crewSubTab,
                ...(crewSubTab === 'schedule' ? styles.crewSubTabActive : {})
              }}
              onClick={() => setCrewSubTab('schedule')}
            >
              Weekly Schedule
            </button>
            <button
              style={{
                ...styles.crewSubTab,
                ...(crewSubTab === 'utilization' ? styles.crewSubTabActive : {})
              }}
              onClick={() => setCrewSubTab('utilization')}
            >
              Utilization
            </button>
            <button
              style={{
                ...styles.crewSubTab,
                ...(crewSubTab === 'training' ? styles.crewSubTabActive : {})
              }}
              onClick={() => setCrewSubTab('training')}
            >
              Cross-Training
            </button>
          </div>

          {/* Attendance Sub-Tab */}
          {crewSubTab === 'attendance' && (
            <AttendanceDashboard
              factoryId={factoryId}
              workers={workers.map(w => ({
                id: w.id,
                first_name: w.full_name?.split(' ')[0] || '',
                last_name: w.full_name?.split(' ').slice(1).join(' ') || '',
                role: w.title,
                station_name: w.primary_station?.name
              }))}
              shifts={activeShifts.map(s => ({
                ...s,
                worker_id: s.worker_id,
                clock_in: s.clock_in,
                clock_out: s.clock_out,
                on_break: s.status === 'on_break',
                is_late: s.is_late,
                hours_worked: parseFloat(s.total_hours || 0)
              }))}
              absences={absences.filter(a => {
                try {
                  return isToday(new Date(a.start_date));
                } catch {
                  return false;
                }
              })}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
              onStartBreak={handleStartBreak}
              onEndBreak={handleEndBreak}
              onRefresh={fetchShifts}
              compact={false}
              showAreaBreakdown={true}
            />
          )}

          {/* Schedule Sub-Tab */}
          {crewSubTab === 'schedule' && (
            <CrewScheduleView
              factoryId={factoryId}
              workers={workers.map(w => ({
                id: w.id,
                first_name: w.full_name?.split(' ')[0] || '',
                last_name: w.full_name?.split(' ').slice(1).join(' ') || '',
                role: w.title,
                station_name: w.primary_station?.name,
                crew_name: w.primary_station?.name || 'Unassigned'
              }))}
              shifts={weeklyShifts.map(s => ({
                ...s,
                shift_date: s.clock_in?.split('T')[0],
                shift_type: s.shift_type || 'DAY',
                is_overtime: parseFloat(s.total_hours || 0) > 8
              }))}
              absences={absences}
              onWeekChange={(weekStr) => fetchWeeklyShifts(new Date(weekStr))}
              groupBy="station"
              showTotals={true}
              compact={false}
            />
          )}

          {/* Utilization Sub-Tab - Batch 3 NEW */}
          {crewSubTab === 'utilization' && (
            <CrewUtilizationHeatmap
              factoryId={factoryId}
              compact={false}
              showNames={true}
            />
          )}

          {/* Cross-Training Sub-Tab - Batch 3 NEW */}
          {crewSubTab === 'training' && (
            <CrossTrainingMatrix
              factoryId={factoryId}
              compact={false}
              showMetrics={true}
            />
          )}
        </div>
      )}

      {/* Quality Tab - Batch 2 NEW */}
      {activeTab === 'quality' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <ClipboardCheck size={20} />
              Quality Control
            </h2>
          </div>

          {/* QC Stats Grid */}
          <div style={styles.qualityStatsGrid}>
            <div style={{
              ...styles.statCard,
              borderLeftColor: '#22c55e',
              borderLeftWidth: '4px',
              borderLeftStyle: 'solid'
            }}>
              <div style={{ ...styles.statIcon, background: 'rgba(34, 197, 94, 0.15)' }}>
                <CheckCircle2 size={20} color="#22c55e" />
              </div>
              <div>
                <div style={styles.statValue}>
                  {qcRecords.filter(r => r.passed).length}
                </div>
                <div style={styles.statLabel}>Passed Today</div>
              </div>
            </div>
            <div style={{
              ...styles.statCard,
              borderLeftColor: '#ef4444',
              borderLeftWidth: '4px',
              borderLeftStyle: 'solid'
            }}>
              <div style={{ ...styles.statIcon, background: 'rgba(239, 68, 68, 0.15)' }}>
                <XCircle size={20} color="#ef4444" />
              </div>
              <div>
                <div style={styles.statValue}>
                  {qcRecords.filter(r => !r.passed).length}
                </div>
                <div style={styles.statLabel}>Failed Today</div>
              </div>
            </div>
            <div style={{
              ...styles.statCard,
              borderLeftColor: '#f59e0b',
              borderLeftWidth: '4px',
              borderLeftStyle: 'solid'
            }}>
              <div style={{ ...styles.statIcon, background: 'rgba(245, 158, 11, 0.15)' }}>
                <AlertTriangle size={20} color="#f59e0b" />
              </div>
              <div>
                <div style={styles.statValue}>
                  {pendingInspections.length}
                </div>
                <div style={styles.statLabel}>Pending</div>
              </div>
            </div>
            <div style={{
              ...styles.statCard,
              borderLeftColor: '#3b82f6',
              borderLeftWidth: '4px',
              borderLeftStyle: 'solid'
            }}>
              <div style={{ ...styles.statIcon, background: 'rgba(59, 130, 246, 0.15)' }}>
                <TrendingUp size={20} color="#3b82f6" />
              </div>
              <div>
                <div style={styles.statValue}>
                  {qcRecords.length > 0
                    ? Math.round((qcRecords.filter(r => r.passed).length / qcRecords.length) * 100)
                    : 100}%
                </div>
                <div style={styles.statLabel}>Pass Rate</div>
              </div>
            </div>
          </div>

          {/* Pending Inspections */}
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}>
            <AlertTriangle size={16} color="#f59e0b" />
            Pending Inspections ({pendingInspections.length})
          </h3>

          {pendingInspections.length > 0 ? (
            <div style={styles.moduleList}>
              {pendingInspections.map(module => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onClick={() => handleStartQCInspection(module)}
                />
              ))}
            </div>
          ) : (
            <div style={{
              ...styles.emptyState,
              padding: 'var(--space-xl)'
            }}>
              <CheckCircle2 size={48} style={{ ...styles.emptyIcon, color: '#22c55e' }} />
              <p>All inspections complete!</p>
            </div>
          )}

          {/* Recent QC Records */}
          {qcRecords.length > 0 && (
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-md)'
              }}>
                Recent Inspections
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {qcRecords.slice(0, 5).map(record => (
                  <div
                    key={record.id}
                    style={{
                      ...styles.qcRecordItem,
                      borderLeftColor: record.passed ? '#22c55e' : '#ef4444'
                    }}
                  >
                    {record.passed ? (
                      <CheckCircle2 size={18} color="#22c55e" />
                    ) : (
                      <XCircle size={18} color="#ef4444" />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {record.module?.serial_number || 'Unknown Module'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {record.station?.name || 'Unknown Station'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '500',
                      background: record.passed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: record.passed ? '#22c55e' : '#ef4444'
                    }}>
                      {record.passed ? 'PASSED' : 'FAILED'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab - Batch 3 NEW */}
      {activeTab === 'analytics' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <BarChart3 size={20} />
              Analytics & Efficiency Tools
            </h2>
          </div>

          {/* OEE and Load Board Row */}
          <div style={styles.metricsRow}>
            <OEECalculator
              factoryId={factoryId}
              targetOEE={75}
              compact={false}
              showBreakdown={true}
            />
            <VisualLoadBoard
              factoryId={factoryId}
              compact={false}
              showPrint={true}
              onModuleClick={handleModuleClick}
            />
          </div>

          {/* Defect Timer and Kaizen Row */}
          <div style={styles.metricsRow}>
            <DefectCycleTimer
              factoryId={factoryId}
              compact={false}
              thresholdHours={4}
              onDefectClick={(cycle) => {
                if (cycle.module_id) {
                  const module = modules.find(m => m.id === cycle.module_id);
                  if (module) handleModuleClick(module);
                }
              }}
            />
            <KaizenBoard
              factoryId={factoryId}
              compact={false}
            />
          </div>

          {/* Utilization and Cross-Training Row */}
          <div style={styles.metricsRow}>
            <CrewUtilizationHeatmap
              factoryId={factoryId}
              compact={false}
              showNames={true}
            />
            <CrossTrainingMatrix
              factoryId={factoryId}
              compact={false}
              showMetrics={true}
            />
          </div>
        </div>
      )}

      {/* Pipeline Tab - Batch 4 NEW */}
      {activeTab === 'pipeline' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Zap size={20} />
              Pipeline & Auto-Schedule
            </h2>
          </div>
          <PipelineAutoSchedule
            factoryId={factoryId}
            factoryName={factoryName}
            onScheduleApplied={() => {
              fetchAllData();
            }}
          />
        </div>
      )}

      {/* Reports Tab - Batch 4 NEW */}
      {activeTab === 'reports' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <ClipboardCheck size={20} />
              Daily Production Reports
            </h2>
          </div>
          <DailyReportGenerator
            factoryId={factoryId}
            factoryName={factoryName}
          />
        </div>
      )}

      {/* Config Tab - Batch 4 NEW */}
      {activeTab === 'config' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Settings size={20} />
              Plant Configuration
            </h2>
          </div>
          <PlantConfigPanel
            factoryId={factoryId}
            factoryName={factoryName}
            onSave={() => {
              fetchAllData();
            }}
          />
        </div>
      )}

      {/* Station Detail Modal */}
      {showStationModal && selectedStation && (
        <StationDetailModal
          station={selectedStation}
          factoryId={factoryId}
          onClose={handleCloseStationModal}
          onModuleClick={(module) => {
            handleCloseStationModal();
            handleModuleClick(module);
          }}
          onStartWork={handleStartWork}
          userRole={user?.role}
        />
      )}

      {/* Module Detail Modal */}
      {showModuleModal && selectedModule && (
        <ModuleDetailModal
          module={selectedModule}
          onClose={handleCloseModuleModal}
          onNavigateToProject={handleNavigateToProjectFromModule}
          onStatusChange={handleModuleStatusChange}
          userRole={user?.role}
        />
      )}

      {/* Schedule Module Modal */}
      {showScheduleModal && moduleToSchedule && (
        <ScheduleModuleModal
          module={moduleToSchedule}
          onClose={() => {
            setShowScheduleModal(false);
            setModuleToSchedule(null);
          }}
          onSchedule={handleScheduleModule}
          isSimMode={isSimMode}
        />
      )}

      {/* Batch 2: QC Inspection Modal */}
      {showQCModal && qcModule && (
        <QCInspectionModal
          module={qcModule}
          station={qcStation}
          factoryId={factoryId}
          onClose={() => {
            setShowQCModal(false);
            setQcModule(null);
            setQcStation(null);
          }}
          onSubmit={() => {
            fetchModules();
            fetchQCData();
            fetchStations();
          }}
        />
      )}
    </div>
  );
}
