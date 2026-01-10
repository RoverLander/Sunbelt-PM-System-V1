// ============================================================================
// workflowAnalytics.js - Executive Metrics & Analytics Calculations
// ============================================================================
// Comprehensive analytics for VP/Director dashboards and executive reports.
// Calculates workflow performance, bottlenecks, cycle times, and trends.
//
// Created: January 10, 2026
// ============================================================================

import { differenceInDays, differenceInBusinessDays, parseISO, format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// ============================================================================
// CONSTANTS
// ============================================================================

export const WORKFLOW_PHASES = {
  1: { name: 'Initiation', color: '#3b82f6' },
  2: { name: 'Dealer Sign-Offs', color: '#f59e0b' },
  3: { name: 'Internal Approvals', color: '#8b5cf6' },
  4: { name: 'Delivery', color: '#22c55e' }
};

export const COURT_LABELS = {
  dealer: { name: 'Dealer', color: '#f59e0b' },
  drafting: { name: 'Drafting', color: '#3b82f6' },
  pm: { name: 'Project Manager', color: '#22c55e' },
  engineering: { name: 'Engineering', color: '#8b5cf6' },
  third_party: { name: 'Third Party', color: '#6366f1' },
  state: { name: 'State/Regulatory', color: '#ef4444' },
  factory: { name: 'Factory', color: '#f97316' },
  procurement: { name: 'Procurement', color: '#14b8a6' }
};

// ============================================================================
// PHASE DISTRIBUTION ANALYTICS
// ============================================================================

/**
 * Calculate distribution of projects across workflow phases
 * @param {Array} projects - Array of project objects
 * @param {Array} workflowStatuses - Array of project_workflow_status records
 * @returns {Object} Phase distribution metrics
 */
export function calculatePhaseDistribution(projects, workflowStatuses) {
  const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
  const activeProjects = projects.filter(p => activeStatuses.includes(p.status));

  // Group workflow statuses by project
  const projectPhases = {};
  activeProjects.forEach(project => {
    const statuses = workflowStatuses.filter(ws => ws.project_id === project.id);

    // Determine current phase based on completed stations
    let currentPhase = project.current_phase || 1;

    // If no explicit phase, calculate from station completion
    if (!project.current_phase && statuses.length > 0) {
      const completedStations = statuses.filter(s => s.status === 'completed');
      const inProgressStations = statuses.filter(s => s.status === 'in_progress');

      // Find highest phase with activity
      const activePhases = [...completedStations, ...inProgressStations]
        .map(s => s.phase || 1);
      currentPhase = activePhases.length > 0 ? Math.max(...activePhases) : 1;
    }

    projectPhases[project.id] = currentPhase;
  });

  // Count projects per phase
  const phaseCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  Object.values(projectPhases).forEach(phase => {
    phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
  });

  const total = activeProjects.length || 1;

  return {
    counts: phaseCounts,
    percentages: {
      1: Math.round((phaseCounts[1] / total) * 100),
      2: Math.round((phaseCounts[2] / total) * 100),
      3: Math.round((phaseCounts[3] / total) * 100),
      4: Math.round((phaseCounts[4] / total) * 100)
    },
    totalActive: activeProjects.length,
    breakdown: Object.entries(phaseCounts).map(([phase, count]) => ({
      phase: parseInt(phase),
      phaseName: WORKFLOW_PHASES[phase]?.name || `Phase ${phase}`,
      color: WORKFLOW_PHASES[phase]?.color || '#64748b',
      count,
      percentage: Math.round((count / total) * 100)
    }))
  };
}

// ============================================================================
// STATION PERFORMANCE ANALYTICS
// ============================================================================

/**
 * Calculate average duration for each workflow station
 * @param {Array} workflowStatuses - Array of project_workflow_status records
 * @param {Array} stations - Array of workflow_stations definitions
 * @returns {Array} Station performance metrics
 */
export function calculateStationPerformance(workflowStatuses, stations) {
  const stationMetrics = {};

  // Initialize metrics for each station
  stations.forEach(station => {
    stationMetrics[station.station_key] = {
      station_key: station.station_key,
      name: station.name,
      phase: station.phase,
      completed: 0,
      inProgress: 0,
      awaiting: 0,
      totalDays: 0,
      completedWithDates: 0,
      avgDays: 0,
      overdueCount: 0
    };
  });

  const today = new Date();

  workflowStatuses.forEach(ws => {
    const metrics = stationMetrics[ws.station_key];
    if (!metrics) return;

    // Count by status
    if (ws.status === 'completed') {
      metrics.completed++;

      // Calculate duration if we have dates
      if (ws.started_date && ws.completed_date) {
        const days = differenceInBusinessDays(
          parseISO(ws.completed_date),
          parseISO(ws.started_date)
        );
        metrics.totalDays += Math.max(0, days);
        metrics.completedWithDates++;
      }
    } else if (ws.status === 'in_progress') {
      metrics.inProgress++;
    } else if (ws.status === 'awaiting_response') {
      metrics.awaiting++;
    }

    // Check for overdue
    if (ws.deadline && ws.status !== 'completed' && ws.status !== 'skipped') {
      if (parseISO(ws.deadline) < today) {
        metrics.overdueCount++;
      }
    }
  });

  // Calculate averages and sort by bottleneck potential
  return Object.values(stationMetrics)
    .map(m => ({
      ...m,
      avgDays: m.completedWithDates > 0 ? Math.round(m.totalDays / m.completedWithDates) : null,
      activeCount: m.inProgress + m.awaiting,
      bottleneckScore: (m.inProgress * 2) + (m.awaiting * 3) + (m.overdueCount * 5)
    }))
    .sort((a, b) => b.bottleneckScore - a.bottleneckScore);
}

/**
 * Identify top bottleneck stations
 * @param {Array} stationPerformance - Output from calculateStationPerformance
 * @param {number} limit - Number of bottlenecks to return
 * @returns {Array} Top bottleneck stations
 */
export function identifyBottlenecks(stationPerformance, limit = 5) {
  return stationPerformance
    .filter(s => s.bottleneckScore > 0)
    .slice(0, limit)
    .map(s => ({
      ...s,
      severity: s.bottleneckScore >= 10 ? 'critical' : s.bottleneckScore >= 5 ? 'warning' : 'normal'
    }));
}

// ============================================================================
// DRAWING CYCLE ANALYTICS
// ============================================================================

/**
 * Calculate drawing approval metrics
 * @param {Array} drawingVersions - Array of drawing_versions records
 * @returns {Object} Drawing cycle metrics
 */
export function calculateDrawingMetrics(drawingVersions) {
  const byPercentage = { 20: [], 65: [], 95: [], 100: [] };
  const responseTypes = {
    'Approve': 0,
    'Approve with Redlines': 0,
    'Reject with Redlines': 0,
    'Reject': 0
  };

  let totalCycleTime = 0;
  let cycleCount = 0;
  let totalRevisions = 0;

  drawingVersions.forEach(dv => {
    // Group by percentage
    if (byPercentage[dv.drawing_percentage]) {
      byPercentage[dv.drawing_percentage].push(dv);
    }

    // Count response types
    if (dv.dealer_response && responseTypes.hasOwnProperty(dv.dealer_response)) {
      responseTypes[dv.dealer_response]++;
    }

    // Calculate cycle time (submission to response)
    if (dv.submitted_date && dv.response_date) {
      const days = differenceInBusinessDays(
        parseISO(dv.response_date),
        parseISO(dv.submitted_date)
      );
      totalCycleTime += Math.max(0, days);
      cycleCount++;
    }

    // Count revisions (version > 1 means revisions occurred)
    if (dv.version_number > 1) {
      totalRevisions++;
    }
  });

  const totalResponses = Object.values(responseTypes).reduce((a, b) => a + b, 0);

  return {
    // Cycle time metrics
    avgCycleTimeDays: cycleCount > 0 ? Math.round(totalCycleTime / cycleCount) : null,
    totalSubmissions: drawingVersions.length,

    // Approval rate metrics
    approvalRate: totalResponses > 0
      ? Math.round((responseTypes['Approve'] / totalResponses) * 100)
      : null,
    redlineRate: totalResponses > 0
      ? Math.round(((responseTypes['Approve with Redlines'] + responseTypes['Reject with Redlines']) / totalResponses) * 100)
      : null,
    rejectionRate: totalResponses > 0
      ? Math.round((responseTypes['Reject'] / totalResponses) * 100)
      : null,

    // Response breakdown
    responseBreakdown: Object.entries(responseTypes).map(([type, count]) => ({
      type,
      count,
      percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0
    })),

    // By drawing percentage
    byPercentage: Object.entries(byPercentage).map(([pct, versions]) => {
      const approved = versions.filter(v => v.dealer_response === 'Approve').length;
      const total = versions.filter(v => v.dealer_response).length;
      return {
        percentage: parseInt(pct),
        submissions: versions.length,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : null,
        avgRevisions: versions.length > 0
          ? (versions.reduce((sum, v) => sum + v.version_number, 0) / versions.length).toFixed(1)
          : 0
      };
    }),

    // Revision metrics
    totalRevisions,
    revisionRate: drawingVersions.length > 0
      ? Math.round((totalRevisions / drawingVersions.length) * 100)
      : 0
  };
}

// ============================================================================
// CHANGE ORDER ANALYTICS
// ============================================================================

/**
 * Calculate change order metrics and trends
 * @param {Array} changeOrders - Array of change_orders records
 * @param {Array} projects - Array of projects for context
 * @returns {Object} Change order metrics
 */
export function calculateChangeOrderMetrics(changeOrders, projects) {
  const byType = { Redlines: [], General: [], Pricing: [] };
  const byStatus = { Draft: 0, Sent: 0, Signed: 0, Implemented: 0, Rejected: 0 };

  let totalValue = 0;
  let signedValue = 0;
  let avgProcessingTime = 0;
  let processingCount = 0;

  changeOrders.forEach(co => {
    // Group by type
    if (byType[co.change_type]) {
      byType[co.change_type].push(co);
    }

    // Count by status
    if (byStatus.hasOwnProperty(co.status)) {
      byStatus[co.status]++;
    }

    // Sum values
    totalValue += parseFloat(co.total_amount) || 0;
    if (co.status === 'Signed' || co.status === 'Implemented') {
      signedValue += parseFloat(co.total_amount) || 0;
    }

    // Calculate processing time (submitted to signed)
    if (co.submitted_date && co.signed_date) {
      const days = differenceInBusinessDays(
        parseISO(co.signed_date),
        parseISO(co.submitted_date)
      );
      avgProcessingTime += Math.max(0, days);
      processingCount++;
    }
  });

  const projectCount = projects.length || 1;
  const activeProjects = projects.filter(p =>
    ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'].includes(p.status)
  ).length || 1;

  return {
    // Volume metrics
    totalCount: changeOrders.length,
    avgPerProject: (changeOrders.length / projectCount).toFixed(1),
    avgPerActiveProject: (changeOrders.length / activeProjects).toFixed(1),

    // Value metrics
    totalValue,
    signedValue,
    avgValue: changeOrders.length > 0 ? Math.round(totalValue / changeOrders.length) : 0,

    // Processing metrics
    avgProcessingDays: processingCount > 0 ? Math.round(avgProcessingTime / processingCount) : null,

    // Status breakdown
    statusBreakdown: Object.entries(byStatus).map(([status, count]) => ({
      status,
      count,
      percentage: changeOrders.length > 0 ? Math.round((count / changeOrders.length) * 100) : 0
    })),

    // Type breakdown
    typeBreakdown: Object.entries(byType).map(([type, orders]) => ({
      type,
      count: orders.length,
      value: orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
      percentage: changeOrders.length > 0 ? Math.round((orders.length / changeOrders.length) * 100) : 0
    })),

    // Pending action
    pendingCount: byStatus.Draft + byStatus.Sent,
    pendingValue: changeOrders
      .filter(co => co.status === 'Draft' || co.status === 'Sent')
      .reduce((sum, co) => sum + (parseFloat(co.total_amount) || 0), 0)
  };
}

// ============================================================================
// LONG LEAD ITEM ANALYTICS
// ============================================================================

/**
 * Calculate long lead item performance metrics
 * @param {Array} longLeadItems - Array of long_lead_items records
 * @returns {Object} Long lead item metrics
 */
export function calculateLongLeadMetrics(longLeadItems) {
  const byStatus = { Pending: 0, Ordered: 0, 'In Transit': 0, Delivered: 0, Delayed: 0 };

  let onTimeDeliveries = 0;
  let lateDeliveries = 0;
  let totalLeadTimeVariance = 0;
  let varianceCount = 0;

  const supplierPerformance = {};

  longLeadItems.forEach(item => {
    // Count by status
    if (byStatus.hasOwnProperty(item.status)) {
      byStatus[item.status]++;
    }

    // Check delivery performance
    if (item.status === 'Delivered' && item.expected_delivery && item.actual_delivery) {
      const expectedDate = parseISO(item.expected_delivery);
      const actualDate = parseISO(item.actual_delivery);
      const variance = differenceInDays(actualDate, expectedDate);

      if (variance <= 0) {
        onTimeDeliveries++;
      } else {
        lateDeliveries++;
      }

      totalLeadTimeVariance += variance;
      varianceCount++;
    }

    // Track supplier performance
    if (item.supplier) {
      if (!supplierPerformance[item.supplier]) {
        supplierPerformance[item.supplier] = { total: 0, delayed: 0, delivered: 0 };
      }
      supplierPerformance[item.supplier].total++;
      if (item.status === 'Delayed') supplierPerformance[item.supplier].delayed++;
      if (item.status === 'Delivered') supplierPerformance[item.supplier].delivered++;
    }
  });

  const deliveredCount = onTimeDeliveries + lateDeliveries;

  return {
    // Volume metrics
    totalItems: longLeadItems.length,
    pendingOrders: byStatus.Pending,
    inTransit: byStatus['In Transit'],
    delayedCount: byStatus.Delayed,

    // Status breakdown
    statusBreakdown: Object.entries(byStatus).map(([status, count]) => ({
      status,
      count,
      percentage: longLeadItems.length > 0 ? Math.round((count / longLeadItems.length) * 100) : 0
    })),

    // Delivery performance
    onTimeRate: deliveredCount > 0 ? Math.round((onTimeDeliveries / deliveredCount) * 100) : null,
    avgVarianceDays: varianceCount > 0 ? Math.round(totalLeadTimeVariance / varianceCount) : null,

    // Supplier metrics
    supplierPerformance: Object.entries(supplierPerformance)
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        delayRate: stats.total > 0 ? Math.round((stats.delayed / stats.total) * 100) : 0,
        onTimeRate: stats.delivered > 0 ? Math.round(((stats.delivered - stats.delayed) / stats.delivered) * 100) : null
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10),

    // Risk indicator
    atRiskCount: byStatus.Delayed + Math.floor(byStatus['In Transit'] * 0.1) // Assume 10% transit risk
  };
}

// ============================================================================
// COURT/RESPONSIBILITY ANALYTICS
// ============================================================================

/**
 * Calculate time/tasks distribution by responsible party (court)
 * @param {Array} tasks - Array of tasks with assigned_court
 * @returns {Object} Court distribution metrics
 */
export function calculateCourtMetrics(tasks) {
  const activeTasks = tasks.filter(t => !['Completed', 'Cancelled'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  const courtMetrics = {};

  // Initialize all courts
  Object.keys(COURT_LABELS).forEach(court => {
    courtMetrics[court] = {
      court,
      label: COURT_LABELS[court].name,
      color: COURT_LABELS[court].color,
      activeTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      awaitingTasks: 0,
      totalDays: 0,
      completedWithDates: 0
    };
  });

  const today = new Date();

  tasks.forEach(task => {
    const court = task.assigned_court || 'pm'; // Default to PM if not set
    const metrics = courtMetrics[court];
    if (!metrics) return;

    if (task.status === 'Completed') {
      metrics.completedTasks++;

      // Calculate completion time if dates available
      if (task.created_at && task.completed_at) {
        const days = differenceInBusinessDays(
          parseISO(task.completed_at),
          parseISO(task.created_at)
        );
        metrics.totalDays += Math.max(0, days);
        metrics.completedWithDates++;
      }
    } else if (task.status !== 'Cancelled') {
      metrics.activeTasks++;

      if (task.status === 'Awaiting Response') {
        metrics.awaitingTasks++;
      }

      // Check overdue
      if (task.due_date && parseISO(task.due_date) < today) {
        metrics.overdueTasks++;
      }
    }
  });

  // Calculate derived metrics
  return Object.values(courtMetrics)
    .map(m => ({
      ...m,
      avgCompletionDays: m.completedWithDates > 0
        ? Math.round(m.totalDays / m.completedWithDates)
        : null,
      overdueRate: m.activeTasks > 0
        ? Math.round((m.overdueTasks / m.activeTasks) * 100)
        : 0,
      workload: m.activeTasks + m.awaitingTasks
    }))
    .sort((a, b) => b.workload - a.workload);
}

// ============================================================================
// DELIVERY PERFORMANCE ANALYTICS
// ============================================================================

/**
 * Calculate delivery accuracy and trends
 * @param {Array} projects - Array of projects with delivery dates
 * @returns {Object} Delivery performance metrics
 */
export function calculateDeliveryMetrics(projects) {
  const completedWithDelivery = projects.filter(p =>
    p.status === 'Completed' && p.delivery_date
  );

  let onTime = 0;
  let early = 0;
  let late = 0;
  let totalVariance = 0;

  const byFactory = {};

  completedWithDelivery.forEach(project => {
    const scheduled = parseISO(project.delivery_date);
    const actual = project.actual_completion_date
      ? parseISO(project.actual_completion_date)
      : parseISO(project.completed_at || project.updated_at);

    const variance = differenceInDays(actual, scheduled);
    totalVariance += variance;

    if (variance <= 0) {
      if (variance < -7) early++;
      else onTime++;
    } else {
      late++;
    }

    // Track by factory
    const factory = project.factory || 'Unknown';
    if (!byFactory[factory]) {
      byFactory[factory] = { total: 0, onTime: 0, late: 0, totalVariance: 0 };
    }
    byFactory[factory].total++;
    if (variance <= 0) byFactory[factory].onTime++;
    else byFactory[factory].late++;
    byFactory[factory].totalVariance += variance;
  });

  const total = completedWithDelivery.length || 1;

  return {
    // Overall metrics
    totalDelivered: completedWithDelivery.length,
    onTimeCount: onTime + early,
    lateCount: late,
    onTimeRate: Math.round(((onTime + early) / total) * 100),
    avgVarianceDays: Math.round(totalVariance / total),

    // Breakdown
    breakdown: [
      { label: 'Early (>7 days)', count: early, color: '#22c55e' },
      { label: 'On Time', count: onTime, color: '#3b82f6' },
      { label: 'Late', count: late, color: '#ef4444' }
    ],

    // By factory
    factoryPerformance: Object.entries(byFactory)
      .map(([factory, stats]) => ({
        factory,
        total: stats.total,
        onTimeRate: Math.round((stats.onTime / stats.total) * 100),
        avgVariance: Math.round(stats.totalVariance / stats.total)
      }))
      .sort((a, b) => b.onTimeRate - a.onTimeRate)
  };
}

// ============================================================================
// TREND ANALYTICS
// ============================================================================

/**
 * Calculate monthly trends for key metrics
 * @param {Array} projects - Array of projects
 * @param {Array} tasks - Array of tasks
 * @param {Array} changeOrders - Array of change orders
 * @param {number} months - Number of months to analyze
 * @returns {Object} Monthly trend data
 */
export function calculateMonthlyTrends(projects, tasks, changeOrders, months = 6) {
  const trends = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(today, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthKey = format(monthDate, 'MMM yyyy');

    // Projects completed this month
    const completedProjects = projects.filter(p => {
      if (p.status !== 'Completed' || !p.completed_at) return false;
      const completedDate = parseISO(p.completed_at);
      return completedDate >= monthStart && completedDate <= monthEnd;
    }).length;

    // Projects started this month
    const startedProjects = projects.filter(p => {
      if (!p.created_at) return false;
      const createdDate = parseISO(p.created_at);
      return createdDate >= monthStart && createdDate <= monthEnd;
    }).length;

    // Tasks completed this month
    const completedTasks = tasks.filter(t => {
      if (t.status !== 'Completed' || !t.completed_at) return false;
      const completedDate = parseISO(t.completed_at);
      return completedDate >= monthStart && completedDate <= monthEnd;
    }).length;

    // Change orders this month
    const monthChangeOrders = changeOrders.filter(co => {
      if (!co.created_at) return false;
      const createdDate = parseISO(co.created_at);
      return createdDate >= monthStart && createdDate <= monthEnd;
    });

    const coCount = monthChangeOrders.length;
    const coValue = monthChangeOrders.reduce((sum, co) => sum + (parseFloat(co.total_amount) || 0), 0);

    trends.push({
      month: monthKey,
      monthDate: monthStart,
      projectsStarted: startedProjects,
      projectsCompleted: completedProjects,
      tasksCompleted: completedTasks,
      changeOrderCount: coCount,
      changeOrderValue: coValue
    });
  }

  return {
    months: trends,
    summary: {
      avgProjectsStarted: Math.round(trends.reduce((sum, t) => sum + t.projectsStarted, 0) / months),
      avgProjectsCompleted: Math.round(trends.reduce((sum, t) => sum + t.projectsCompleted, 0) / months),
      avgTasksCompleted: Math.round(trends.reduce((sum, t) => sum + t.tasksCompleted, 0) / months),
      totalChangeOrderValue: trends.reduce((sum, t) => sum + t.changeOrderValue, 0)
    }
  };
}

// ============================================================================
// COMPREHENSIVE EXECUTIVE SUMMARY
// ============================================================================

/**
 * Generate comprehensive executive summary metrics
 * @param {Object} data - All data objects
 * @returns {Object} Executive summary
 */
export function generateExecutiveSummary({
  projects,
  tasks,
  rfis,
  submittals,
  workflowStatuses,
  stations,
  drawingVersions,
  changeOrders,
  longLeadItems
}) {
  const activeStatuses = ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'];
  const activeProjects = projects.filter(p => activeStatuses.includes(p.status));
  const today = new Date().toISOString().split('T')[0];

  // Calculate all metrics
  const phaseDistribution = calculatePhaseDistribution(projects, workflowStatuses || []);
  const drawingMetrics = calculateDrawingMetrics(drawingVersions || []);
  const changeOrderMetrics = calculateChangeOrderMetrics(changeOrders || [], projects);
  const longLeadMetrics = calculateLongLeadMetrics(longLeadItems || []);
  const deliveryMetrics = calculateDeliveryMetrics(projects);
  const courtMetrics = calculateCourtMetrics(tasks);

  // Calculate overdue counts
  const overdueTasks = tasks.filter(t =>
    t.due_date && t.due_date < today && !['Completed', 'Cancelled'].includes(t.status)
  ).length;

  const overdueRFIs = rfis.filter(r =>
    r.due_date && r.due_date < today && !['Answered', 'Closed'].includes(r.status)
  ).length;

  const overdueSubmittals = submittals.filter(s =>
    s.due_date && s.due_date < today && ['Pending', 'Submitted', 'Under Review'].includes(s.status)
  ).length;

  // Calculate portfolio value
  const totalContractValue = projects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
  const activeContractValue = activeProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);

  return {
    // Portfolio overview
    portfolio: {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: projects.filter(p => p.status === 'Completed').length,
      totalContractValue,
      activeContractValue
    },

    // Health indicators
    health: {
      totalOverdue: overdueTasks + overdueRFIs + overdueSubmittals,
      overdueTasks,
      overdueRFIs,
      overdueSubmittals,
      delayedLongLeadItems: longLeadMetrics.delayedCount,
      pendingChangeOrders: changeOrderMetrics.pendingCount
    },

    // Performance metrics
    performance: {
      onTimeDeliveryRate: deliveryMetrics.onTimeRate,
      drawingApprovalRate: drawingMetrics.approvalRate,
      avgDrawingCycleTime: drawingMetrics.avgCycleTimeDays,
      avgChangeOrderProcessing: changeOrderMetrics.avgProcessingDays,
      longLeadOnTimeRate: longLeadMetrics.onTimeRate
    },

    // Workflow distribution
    workflow: phaseDistribution,

    // Financial impact
    financial: {
      pendingChangeOrderValue: changeOrderMetrics.pendingValue,
      signedChangeOrderValue: changeOrderMetrics.signedValue,
      avgChangeOrderValue: changeOrderMetrics.avgValue
    },

    // Top concerns (for executive attention)
    topConcerns: [
      ...(overdueTasks > 5 ? [{ type: 'Overdue Tasks', count: overdueTasks, severity: 'high' }] : []),
      ...(longLeadMetrics.delayedCount > 0 ? [{ type: 'Delayed Long Lead Items', count: longLeadMetrics.delayedCount, severity: 'high' }] : []),
      ...(changeOrderMetrics.pendingCount > 10 ? [{ type: 'Pending Change Orders', count: changeOrderMetrics.pendingCount, severity: 'medium' }] : []),
      ...(drawingMetrics.rejectionRate > 20 ? [{ type: 'High Drawing Rejection Rate', count: `${drawingMetrics.rejectionRate}%`, severity: 'medium' }] : [])
    ].sort((a, b) => (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0)),

    // Detailed breakdowns
    details: {
      drawingMetrics,
      changeOrderMetrics,
      longLeadMetrics,
      deliveryMetrics,
      courtMetrics
    }
  };
}

export default {
  WORKFLOW_PHASES,
  COURT_LABELS,
  calculatePhaseDistribution,
  calculateStationPerformance,
  identifyBottlenecks,
  calculateDrawingMetrics,
  calculateChangeOrderMetrics,
  calculateLongLeadMetrics,
  calculateCourtMetrics,
  calculateDeliveryMetrics,
  calculateMonthlyTrends,
  generateExecutiveSummary
};
