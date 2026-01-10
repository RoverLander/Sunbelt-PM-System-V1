import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, FileText, ClipboardList, Users } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

/**
 * PMHealthPanel - Displays PM character avatars with health bars
 * Shows workload status with visual indicators
 */
const PMHealthPanel = ({ expanded = false, showTeam = false }) => {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [userHealth, setUserHealth] = useState(null);
  const [teamHealth, setTeamHealth] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    } else {
      // No user logged in - stop loading
      setLoading(false);
    }
  }, [user]);

  // Fetch health data
  useEffect(() => {
    if (currentUser) {
      fetchHealthData();
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setCurrentUser(data);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchHealthData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const weekEnd = weekFromNow.toISOString().split('T')[0];

      // Define active statuses for filtering
      const activeTaskStatuses = ['Not Started', 'In Progress', 'Awaiting Response'];
      const activeRfiStatuses = ['Open', 'Pending Response'];
      const activeSubmittalStatuses = ['Pending', 'Under Review'];

      // Fetch user's tasks - filter client-side to avoid Supabase .in() issues
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, status, due_date')
        .or(`assignee_id.eq.${currentUser.id},internal_owner_id.eq.${currentUser.id}`);

      const tasks = (allTasks || []).filter(t => activeTaskStatuses.includes(t.status));

      // Fetch user's RFIs - filter client-side
      const { data: allRfis } = await supabase
        .from('rfis')
        .select('id, status, response_due_date')
        .eq('assigned_to', currentUser.id);

      const rfis = (allRfis || []).filter(r => activeRfiStatuses.includes(r.status));

      // Fetch user's submittals - filter client-side
      const { data: allSubmittals } = await supabase
        .from('submittals')
        .select('id, status, due_date')
        .eq('submitted_by', currentUser.id);

      const submittals = (allSubmittals || []).filter(s => activeSubmittalStatuses.includes(s.status));

      // Calculate health metrics
      const taskList = tasks || [];
      const rfiList = rfis || [];
      const submittalList = submittals || [];

      const overdueTasks = taskList.filter(t => t.due_date && t.due_date < today).length;
      const overdueRFIs = rfiList.filter(r => r.response_due_date && r.response_due_date < today).length;
      const overdueSubmittals = submittalList.filter(s => s.due_date && s.due_date < today).length;

      const dueSoonTasks = taskList.filter(t =>
        t.due_date && t.due_date >= today && t.due_date <= weekEnd
      ).length;

      const health = calculateHealth({
        activeTasks: taskList.length,
        overdueTasks,
        overdueRFIs,
        overdueSubmittals,
        dueSoon: dueSoonTasks,
        completedThisWeek: 0 // Would need to query completed tasks
      });

      setUserHealth({
        ...health,
        activeTasks: taskList.length,
        openRFIs: rfiList.length,
        pendingSubmittals: submittalList.length,
        overdueTasks,
        overdueRFIs,
        overdueSubmittals,
        dueSoon: dueSoonTasks
      });

      // If director/VP, fetch team health
      if (showTeam && ['Director', 'VP', 'Admin'].includes(currentUser.role)) {
        await fetchTeamHealth();
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching health data:', err);
      setLoading(false);
    }
  };

  const fetchTeamHealth = async () => {
    try {
      // Fetch all PMs - filter client-side to avoid .in() issues
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, role, avatar_url')
        .eq('is_active', true);

      const pmRoles = ['PM', 'Project Manager', 'Director'];
      const pms = (allUsers || []).filter(u => pmRoles.includes(u.role));

      if (!pms.length) return;

      // Define active task statuses
      const activeTaskStatuses = ['Not Started', 'In Progress', 'Awaiting Response'];

      // For each PM, calculate their health (simplified)
      const healthPromises = pms.map(async (pm) => {
        const today = new Date().toISOString().split('T')[0];

        // Fetch all tasks for this PM and filter client-side
        const { data: pmTasks } = await supabase
          .from('tasks')
          .select('id, status, due_date')
          .or(`assignee_id.eq.${pm.id},internal_owner_id.eq.${pm.id}`);

        const activeTasks = (pmTasks || []).filter(t => activeTaskStatuses.includes(t.status));
        const taskCount = activeTasks.length;
        const overdueCount = activeTasks.filter(t => t.due_date && t.due_date < today).length;

        const health = calculateHealth({
          activeTasks: taskCount || 0,
          overdueTasks: overdueCount || 0
        });

        return {
          ...pm,
          health: health.percentage,
          expression: health.expression,
          activeTasks: taskCount || 0,
          overdue: overdueCount || 0
        };
      });

      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled(healthPromises);
      const teamData = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      setTeamHealth(teamData.sort((a, b) => a.health - b.health)); // Sort by health (worst first)
    } catch (err) {
      console.error('Error fetching team health:', err);
    }
  };

  // Health calculation
  const calculateHealth = (data) => {
    let health = 100;

    // Overdue items (biggest impact)
    health -= (data.overdueTasks || 0) * 8;
    health -= (data.overdueRFIs || 0) * 10;
    health -= (data.overdueSubmittals || 0) * 6;

    // Active workload (moderate impact)
    const activeTaskPenalty = Math.max(0, (data.activeTasks || 0) - 10) * 2;
    health -= activeTaskPenalty;

    // Items due soon (minor stress)
    health -= (data.dueSoon || 0) * 2;

    // Positive factors
    health += (data.completedThisWeek || 0) * 1;

    health = Math.max(0, Math.min(100, health));

    return {
      percentage: health,
      expression: getExpression(health),
      color: getHealthColor(health),
      level: getHealthLevel(health)
    };
  };

  const getExpression = (health) => {
    if (health >= 80) return '😊';
    if (health >= 60) return '😐';
    if (health >= 40) return '😟';
    if (health >= 20) return '😰';
    return '😵';
  };

  const getHealthColor = (health) => {
    if (health >= 80) return '#22c55e';
    if (health >= 60) return '#84cc16';
    if (health >= 40) return '#f59e0b';
    if (health >= 20) return '#f97316';
    return '#ef4444';
  };

  const getHealthLevel = (health) => {
    if (health >= 80) return 'Excellent';
    if (health >= 60) return 'Good';
    if (health >= 40) return 'Stressed';
    if (health >= 20) return 'Overwhelmed';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="bg-slate-800/90 rounded-lg p-4 animate-pulse">
        <div className="h-20 bg-slate-700 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
      {/* Current User Health */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Your Status
        </h3>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-3xl">
              {userHealth?.expression || '😊'}
            </div>
            {/* Health indicator dot */}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800"
              style={{ backgroundColor: userHealth?.color || '#22c55e' }}
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="font-semibold text-white">
              {currentUser?.name || 'Loading...'}
            </div>
            <div className="text-xs text-slate-400">{currentUser?.role}</div>

            {/* Health bar */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Health</span>
                <span style={{ color: userHealth?.color }}>
                  {userHealth?.percentage || 0}% - {userHealth?.level}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${userHealth?.percentage || 0}%`,
                    backgroundColor: userHealth?.color
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {expanded && userHealth && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <StatBox
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              value={userHealth.activeTasks}
              label="Tasks"
              color={userHealth.activeTasks > 15 ? 'amber' : 'blue'}
            />
            <StatBox
              icon={<FileText className="w-3.5 h-3.5" />}
              value={userHealth.openRFIs}
              label="RFIs"
              color={userHealth.overdueRFIs > 0 ? 'red' : 'blue'}
            />
            <StatBox
              icon={<ClipboardList className="w-3.5 h-3.5" />}
              value={userHealth.pendingSubmittals}
              label="Submittals"
              color="blue"
            />
          </div>
        )}

        {/* Overdue warning */}
        {userHealth && (userHealth.overdueTasks > 0 || userHealth.overdueRFIs > 0) && (
          <div className="mt-3 p-2 bg-red-500/10 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400">
              {userHealth.overdueTasks + userHealth.overdueRFIs} overdue items
            </span>
          </div>
        )}
      </div>

      {/* Team Health (for Directors/VPs) */}
      {showTeam && teamHealth.length > 0 && (
        <div className="p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Team Status
          </h3>

          <div className="space-y-2">
            {teamHealth.slice(0, 6).map((pm) => (
              <div
                key={pm.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                {/* Mini avatar */}
                <div className="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center text-lg">
                  {pm.expression}
                </div>

                {/* Name and bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white truncate">{pm.name}</span>
                    <span className="text-xs" style={{ color: getHealthColor(pm.health) }}>
                      {pm.health}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pm.health}%`,
                        backgroundColor: getHealthColor(pm.health)
                      }}
                    />
                  </div>
                </div>

                {/* Quick stats */}
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  T:{pm.activeTasks} O:{pm.overdue}
                </div>
              </div>
            ))}
          </div>

          {teamHealth.length > 6 && (
            <div className="text-center mt-2">
              <span className="text-xs text-slate-500">
                +{teamHealth.length - 6} more team members
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper component
const StatBox = ({ icon, value, label, color }) => {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    red: 'text-red-400 bg-red-500/10',
    green: 'text-green-400 bg-green-500/10'
  };

  return (
    <div className={`rounded-lg p-2 ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-lg font-bold">{value}</span>
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
};

export default PMHealthPanel;
