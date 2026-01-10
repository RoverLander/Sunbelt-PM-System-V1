// ============================================================================
// itAnalytics.js - IT Management Analytics & System Metrics
// ============================================================================
// Comprehensive analytics for IT administrators including:
// - System health scoring
// - User engagement metrics
// - Database statistics
// - Security analytics
// - Performance metrics
//
// Created: January 10, 2026
// ============================================================================

import { differenceInDays, differenceInHours, parseISO, format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

// ============================================================================
// CONSTANTS
// ============================================================================

export const SYSTEM_HEALTH_WEIGHTS = {
  databaseConnection: 25,
  authService: 20,
  storageService: 15,
  dataIntegrity: 20,
  performance: 20
};

export const ROLE_HIERARCHY = {
  'Admin': 5,
  'VP': 4,
  'Director': 3,
  'IT': 3,
  'PM': 2,
  'Project Coordinator': 2,
  'Plant Manager': 1
};

export const ROLE_COLORS = {
  'Admin': '#ef4444',
  'VP': '#8b5cf6',
  'Director': '#3b82f6',
  'IT': '#06b6d4',
  'PM': '#ff6b35',
  'Project Coordinator': '#ec4899',
  'Plant Manager': '#22c55e'
};

// ============================================================================
// USER ANALYTICS
// ============================================================================

/**
 * Calculate comprehensive user analytics
 * @param {Array} users - Array of user records
 * @param {Array} projects - Array of projects
 * @param {Array} tasks - Array of tasks
 * @returns {Object} User analytics
 */
export function calculateUserAnalytics(users, projects, tasks) {
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);
  const sevenDaysAgo = subDays(today, 7);

  // Basic counts
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active !== false).length;
  const inactiveUsers = totalUsers - activeUsers;

  // Role distribution
  const roleDistribution = {};
  users.forEach(user => {
    const role = user.role || 'Unknown';
    roleDistribution[role] = (roleDistribution[role] || 0) + 1;
  });

  // Users by creation date (growth)
  const recentUsers = users.filter(u => {
    if (!u.created_at) return false;
    return parseISO(u.created_at) >= thirtyDaysAgo;
  }).length;

  const usersThisWeek = users.filter(u => {
    if (!u.created_at) return false;
    return parseISO(u.created_at) >= sevenDaysAgo;
  }).length;

  // User activity analysis
  const userActivity = users.map(user => {
    const userProjects = projects.filter(p =>
      p.owner_id === user.id ||
      p.primary_pm_id === user.id ||
      p.backup_pm_id === user.id
    );

    const userTasks = tasks.filter(t =>
      t.assignee_id === user.id ||
      t.internal_owner_id === user.id
    );

    const activeTasks = userTasks.filter(t => !['Completed', 'Cancelled'].includes(t.status));
    const completedTasks = userTasks.filter(t => t.status === 'Completed');

    // Calculate last activity (most recent update from tasks)
    const taskDates = userTasks
      .filter(t => t.updated_at)
      .map(t => parseISO(t.updated_at));
    const lastActivity = taskDates.length > 0
      ? new Date(Math.max(...taskDates))
      : null;

    const daysSinceActivity = lastActivity
      ? differenceInDays(today, lastActivity)
      : null;

    return {
      ...user,
      projectCount: userProjects.length,
      taskCount: userTasks.length,
      activeTaskCount: activeTasks.length,
      completedTaskCount: completedTasks.length,
      lastActivity,
      daysSinceActivity,
      isStale: daysSinceActivity !== null && daysSinceActivity > 30,
      activityLevel: activeTasks.length > 10 ? 'high' :
                     activeTasks.length > 5 ? 'medium' :
                     activeTasks.length > 0 ? 'low' : 'none'
    };
  });

  // Find potentially problematic users
  const staleUsers = userActivity.filter(u => u.is_active !== false && u.isStale);
  const overloadedUsers = userActivity.filter(u => u.activeTaskCount > 20);
  const idleActiveUsers = userActivity.filter(u =>
    u.is_active !== false && u.activityLevel === 'none' && u.projectCount === 0
  );

  // Top contributors
  const topContributors = [...userActivity]
    .sort((a, b) => b.completedTaskCount - a.completedTaskCount)
    .slice(0, 10);

  return {
    summary: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      activeRate: Math.round((activeUsers / totalUsers) * 100) || 0,
      recentUsers,
      usersThisWeek
    },
    roleDistribution: Object.entries(roleDistribution)
      .map(([role, count]) => ({
        role,
        count,
        percentage: Math.round((count / totalUsers) * 100),
        color: ROLE_COLORS[role] || '#64748b'
      }))
      .sort((a, b) => b.count - a.count),
    activity: {
      staleUsers: staleUsers.length,
      overloadedUsers: overloadedUsers.length,
      idleActiveUsers: idleActiveUsers.length
    },
    topContributors,
    userActivity,
    concerns: [
      ...(staleUsers.length > 0 ? [{
        type: 'Stale Users',
        count: staleUsers.length,
        severity: staleUsers.length > 5 ? 'warning' : 'info',
        description: 'Active users with no activity in 30+ days'
      }] : []),
      ...(overloadedUsers.length > 0 ? [{
        type: 'Overloaded Users',
        count: overloadedUsers.length,
        severity: 'warning',
        description: 'Users with 20+ active tasks'
      }] : []),
      ...(idleActiveUsers.length > 0 ? [{
        type: 'Idle Active Users',
        count: idleActiveUsers.length,
        severity: 'info',
        description: 'Active users with no projects or tasks assigned'
      }] : [])
    ]
  };
}

// ============================================================================
// DATABASE ANALYTICS
// ============================================================================

/**
 * Calculate database statistics and health metrics
 * @param {Object} tableCounts - Object with table names and counts
 * @param {Object} integrityChecks - Results of integrity checks
 * @returns {Object} Database analytics
 */
export function calculateDatabaseAnalytics(tableCounts, integrityChecks) {
  const tables = Object.entries(tableCounts).map(([name, count]) => ({
    name,
    count,
    status: count > 0 ? 'healthy' : 'empty'
  }));

  const totalRecords = Object.values(tableCounts).reduce((sum, count) => sum + count, 0);

  // Estimate storage (rough estimate: ~1KB per record average)
  const estimatedStorageKB = totalRecords * 1;
  const estimatedStorageMB = (estimatedStorageKB / 1024).toFixed(2);

  // Calculate integrity score
  const integrityIssues = Object.values(integrityChecks || {})
    .reduce((sum, count) => sum + (count || 0), 0);

  const integrityScore = Math.max(0, 100 - (integrityIssues * 5));

  return {
    summary: {
      totalTables: tables.length,
      totalRecords,
      estimatedStorageMB,
      integrityScore,
      healthyTables: tables.filter(t => t.status === 'healthy').length,
      emptyTables: tables.filter(t => t.status === 'empty').length
    },
    tables: tables.sort((a, b) => b.count - a.count),
    integrity: {
      score: integrityScore,
      issues: integrityIssues,
      checks: integrityChecks,
      status: integrityScore >= 90 ? 'healthy' :
              integrityScore >= 70 ? 'warning' : 'critical'
    }
  };
}

// ============================================================================
// SYSTEM PERFORMANCE ANALYTICS
// ============================================================================

/**
 * Calculate system performance metrics
 * @param {Object} serviceStatus - Status of various services
 * @param {number} dbLatency - Database latency in ms
 * @returns {Object} Performance analytics
 */
export function calculatePerformanceMetrics(serviceStatus, dbLatency) {
  // Performance scoring
  const dbScore = dbLatency < 100 ? 100 :
                  dbLatency < 200 ? 80 :
                  dbLatency < 500 ? 60 :
                  dbLatency < 1000 ? 40 : 20;

  const authScore = serviceStatus.auth ? 100 : 0;
  const storageScore = serviceStatus.storage ? 100 : 0;
  const dbConnectionScore = serviceStatus.database ? 100 : 0;

  const overallScore = Math.round(
    (dbScore * 0.3) +
    (authScore * 0.25) +
    (storageScore * 0.2) +
    (dbConnectionScore * 0.25)
  );

  return {
    overall: {
      score: overallScore,
      status: overallScore >= 90 ? 'excellent' :
              overallScore >= 70 ? 'good' :
              overallScore >= 50 ? 'fair' : 'poor',
      color: overallScore >= 90 ? '#22c55e' :
             overallScore >= 70 ? '#f59e0b' :
             overallScore >= 50 ? '#f97316' : '#ef4444'
    },
    breakdown: [
      {
        name: 'Database Connection',
        score: dbConnectionScore,
        status: dbConnectionScore === 100 ? 'connected' : 'disconnected'
      },
      {
        name: 'Database Latency',
        score: dbScore,
        value: `${dbLatency}ms`,
        status: dbLatency < 200 ? 'fast' : dbLatency < 500 ? 'acceptable' : 'slow'
      },
      {
        name: 'Authentication',
        score: authScore,
        status: authScore === 100 ? 'operational' : 'down'
      },
      {
        name: 'File Storage',
        score: storageScore,
        status: storageScore === 100 ? 'accessible' : 'inaccessible'
      }
    ],
    latency: {
      database: dbLatency,
      rating: dbLatency < 100 ? 'excellent' :
              dbLatency < 200 ? 'good' :
              dbLatency < 500 ? 'acceptable' : 'slow'
    }
  };
}

// ============================================================================
// ACTIVITY ANALYTICS
// ============================================================================

/**
 * Calculate activity trends and patterns
 * @param {Array} projects - Array of projects
 * @param {Array} tasks - Array of tasks
 * @param {Array} rfis - Array of RFIs
 * @param {Array} submittals - Array of submittals
 * @param {number} days - Number of days to analyze
 * @returns {Object} Activity analytics
 */
export function calculateActivityTrends(projects, tasks, rfis, submittals, days = 30) {
  const today = new Date();
  const startDate = subDays(today, days);

  // Helper to count items created per day
  const countByDay = (items, dateField = 'created_at') => {
    const counts = {};
    for (let i = 0; i <= days; i++) {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      counts[date] = 0;
    }

    items.forEach(item => {
      if (!item[dateField]) return;
      const date = format(parseISO(item[dateField]), 'yyyy-MM-dd');
      if (counts.hasOwnProperty(date)) {
        counts[date]++;
      }
    });

    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .reverse();
  };

  // Calculate daily activity
  const projectActivity = countByDay(projects);
  const taskActivity = countByDay(tasks);
  const rfiActivity = countByDay(rfis);
  const submittalActivity = countByDay(submittals);

  // Calculate totals for period
  const periodProjects = projects.filter(p =>
    p.created_at && parseISO(p.created_at) >= startDate
  ).length;
  const periodTasks = tasks.filter(t =>
    t.created_at && parseISO(t.created_at) >= startDate
  ).length;
  const periodRFIs = rfis.filter(r =>
    r.created_at && parseISO(r.created_at) >= startDate
  ).length;
  const periodSubmittals = submittals.filter(s =>
    s.created_at && parseISO(s.created_at) >= startDate
  ).length;

  // Calculate completion activity
  const completedTasks = tasks.filter(t =>
    t.status === 'Completed' &&
    t.completed_at &&
    parseISO(t.completed_at) >= startDate
  ).length;

  // Daily average
  const avgDaily = {
    projects: (periodProjects / days).toFixed(1),
    tasks: (periodTasks / days).toFixed(1),
    rfis: (periodRFIs / days).toFixed(1),
    submittals: (periodSubmittals / days).toFixed(1)
  };

  // Peak activity day
  const combinedActivity = projectActivity.map((p, i) => ({
    date: p.date,
    total: p.count + taskActivity[i].count + rfiActivity[i].count + submittalActivity[i].count
  }));
  const peakDay = combinedActivity.reduce((max, day) =>
    day.total > max.total ? day : max
  , { date: null, total: 0 });

  return {
    period: {
      days,
      start: format(startDate, 'MMM d, yyyy'),
      end: format(today, 'MMM d, yyyy')
    },
    totals: {
      projects: periodProjects,
      tasks: periodTasks,
      rfis: periodRFIs,
      submittals: periodSubmittals,
      completedTasks,
      total: periodProjects + periodTasks + periodRFIs + periodSubmittals
    },
    dailyAverage: avgDaily,
    peakDay: {
      date: peakDay.date ? format(parseISO(peakDay.date), 'MMM d') : 'N/A',
      count: peakDay.total
    },
    trends: {
      projects: projectActivity,
      tasks: taskActivity,
      rfis: rfiActivity,
      submittals: submittalActivity,
      combined: combinedActivity
    }
  };
}

// ============================================================================
// SECURITY ANALYTICS
// ============================================================================

/**
 * Calculate security-related metrics
 * @param {Array} users - Array of users
 * @param {Object} sessionInfo - Current session information
 * @returns {Object} Security analytics
 */
export function calculateSecurityMetrics(users, sessionInfo = {}) {
  // Role analysis for security
  const adminUsers = users.filter(u => u.role === 'Admin' && u.is_active !== false);
  const itUsers = users.filter(u => u.role === 'IT' && u.is_active !== false);
  const highPrivilegeUsers = users.filter(u =>
    ['Admin', 'VP', 'Director', 'IT'].includes(u.role) && u.is_active !== false
  );

  // Users without recent activity (potential security risk)
  const inactiveHighPrivilege = highPrivilegeUsers.filter(u => {
    if (!u.updated_at) return true;
    const daysSinceUpdate = differenceInDays(new Date(), parseISO(u.updated_at));
    return daysSinceUpdate > 90;
  });

  // Calculate security score
  let securityScore = 100;

  // Deduct for security concerns
  if (adminUsers.length > 3) securityScore -= 10; // Too many admins
  if (inactiveHighPrivilege.length > 0) securityScore -= (inactiveHighPrivilege.length * 5);
  if (!sessionInfo.authenticated) securityScore -= 20;

  securityScore = Math.max(0, securityScore);

  return {
    score: securityScore,
    status: securityScore >= 90 ? 'secure' :
            securityScore >= 70 ? 'acceptable' :
            securityScore >= 50 ? 'needs attention' : 'at risk',
    privilegedAccounts: {
      admins: adminUsers.length,
      itUsers: itUsers.length,
      totalHighPrivilege: highPrivilegeUsers.length
    },
    concerns: [
      ...(adminUsers.length > 3 ? [{
        type: 'Too Many Admins',
        count: adminUsers.length,
        severity: 'warning',
        recommendation: 'Review admin accounts and reduce to necessary minimum'
      }] : []),
      ...(inactiveHighPrivilege.length > 0 ? [{
        type: 'Inactive High-Privilege Users',
        count: inactiveHighPrivilege.length,
        severity: 'warning',
        recommendation: 'Review and deactivate unused privileged accounts'
      }] : [])
    ],
    session: {
      authenticated: sessionInfo.authenticated || false,
      userId: sessionInfo.userId || null
    }
  };
}

// ============================================================================
// COMPREHENSIVE IT DASHBOARD SUMMARY
// ============================================================================

/**
 * Generate comprehensive IT dashboard summary
 * @param {Object} data - All data objects
 * @returns {Object} IT dashboard summary
 */
export function generateITDashboardSummary({
  users,
  projects,
  tasks,
  rfis,
  submittals,
  tableCounts,
  integrityChecks,
  serviceStatus,
  dbLatency,
  sessionInfo
}) {
  const userAnalytics = calculateUserAnalytics(users || [], projects || [], tasks || []);
  const dbAnalytics = calculateDatabaseAnalytics(tableCounts || {}, integrityChecks || {});
  const performanceMetrics = calculatePerformanceMetrics(serviceStatus || {}, dbLatency || 0);
  const activityTrends = calculateActivityTrends(
    projects || [],
    tasks || [],
    rfis || [],
    submittals || [],
    30
  );
  const securityMetrics = calculateSecurityMetrics(users || [], sessionInfo || {});

  // Calculate overall system health score
  const overallHealthScore = Math.round(
    (performanceMetrics.overall.score * 0.3) +
    (dbAnalytics.integrity.score * 0.25) +
    (securityMetrics.score * 0.25) +
    (userAnalytics.summary.activeRate * 0.2)
  );

  return {
    healthScore: {
      overall: overallHealthScore,
      status: overallHealthScore >= 90 ? 'Excellent' :
              overallHealthScore >= 75 ? 'Good' :
              overallHealthScore >= 60 ? 'Fair' : 'Needs Attention',
      color: overallHealthScore >= 90 ? '#22c55e' :
             overallHealthScore >= 75 ? '#3b82f6' :
             overallHealthScore >= 60 ? '#f59e0b' : '#ef4444'
    },
    users: userAnalytics,
    database: dbAnalytics,
    performance: performanceMetrics,
    activity: activityTrends,
    security: securityMetrics,
    quickStats: {
      totalUsers: userAnalytics.summary.totalUsers,
      activeUsers: userAnalytics.summary.activeUsers,
      totalRecords: dbAnalytics.summary.totalRecords,
      systemScore: performanceMetrics.overall.score,
      securityScore: securityMetrics.score,
      activityToday: activityTrends.trends.combined[activityTrends.trends.combined.length - 1]?.count || 0
    },
    alerts: [
      ...userAnalytics.concerns,
      ...securityMetrics.concerns,
      ...(dbAnalytics.integrity.status !== 'healthy' ? [{
        type: 'Database Integrity',
        count: dbAnalytics.integrity.issues,
        severity: dbAnalytics.integrity.status === 'critical' ? 'error' : 'warning',
        description: `${dbAnalytics.integrity.issues} data integrity issues detected`
      }] : []),
      ...(performanceMetrics.overall.score < 70 ? [{
        type: 'System Performance',
        count: null,
        severity: 'warning',
        description: 'System performance below optimal levels'
      }] : [])
    ]
  };
}

export default {
  ROLE_COLORS,
  ROLE_HIERARCHY,
  calculateUserAnalytics,
  calculateDatabaseAnalytics,
  calculatePerformanceMetrics,
  calculateActivityTrends,
  calculateSecurityMetrics,
  generateITDashboardSummary
};
