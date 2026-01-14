// ============================================================================
// TeamWorkloadView Component
// ============================================================================
// Shows workload distribution across team members (PMs).
// Displays projects, tasks, and items per team member.
//
// FEATURES:
// - PM workload cards
// - Project distribution
// - Task counts and status breakdown
// - Overdue items per PM
// - Visual capacity indicators
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Users,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  FileText,
  ClipboardList,
  TrendingUp,
  ChevronRight,
  User
} from 'lucide-react';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function TeamWorkloadView({ 
  users = [], 
  projects = [], 
  tasks = [], 
  rfis = [], 
  submittals = [],
  onUserClick,
  onProjectClick
}) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [selectedPM, setSelectedPM] = useState(null);
  const [sortBy, setSortBy] = useState('projects'); // projects, tasks, overdue

  // ==========================================================================
  // CALCULATE WORKLOAD PER USER
  // ==========================================================================
  const workloadData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    // Roles: 'PM', 'Director' (not 'Project Manager')
    return users
      .filter(u => u.role === 'PM' || u.role === 'Director' || u.role === 'Project Manager' || u.role === 'Project_Manager')
      .map(user => {
        // ===== PROJECTS =====
        // Use owner_id or primary_pm_id to find PM's projects
        const userProjects = projects.filter(p => p.owner_id === user.id || p.primary_pm_id === user.id);
        const activeProjects = userProjects.filter(p => 
          ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'].includes(p.status)
        );

        // ===== TASKS =====
        const userTasks = tasks.filter(t => 
          t.assignee_id === user.id || t.internal_owner_id === user.id
        );
        const openTasks = userTasks.filter(t => 
          !['Completed', 'Cancelled'].includes(t.status)
        );
        const overdueTasks = openTasks.filter(t => 
          t.due_date && t.due_date < today
        );
        const inProgressTasks = openTasks.filter(t => t.status === 'In Progress');
        const awaitingTasks = openTasks.filter(t => t.status === 'Awaiting Response');

        // ===== RFIS =====
        const userRFIs = rfis.filter(r => {
          const projectIds = userProjects.map(p => p.id);
          return projectIds.includes(r.project_id);
        });
        const openRFIs = userRFIs.filter(r => 
          !['Answered', 'Closed'].includes(r.status)
        );
        const overdueRFIs = openRFIs.filter(r => 
          r.due_date && r.due_date < today
        );

        // ===== SUBMITTALS =====
        const userSubmittals = submittals.filter(s => {
          const projectIds = userProjects.map(p => p.id);
          return projectIds.includes(s.project_id);
        });
        const openSubmittals = userSubmittals.filter(s => 
          !['Approved', 'Approved as Noted', 'Rejected'].includes(s.status)
        );
        const overdueSubmittals = openSubmittals.filter(s => 
          s.due_date && s.due_date < today
        );

        // ===== TOTALS =====
        const totalOverdue = overdueTasks.length + overdueRFIs.length + overdueSubmittals.length;
        const totalOpen = openTasks.length + openRFIs.length + openSubmittals.length;

        // ===== CAPACITY SCORE (simplified) =====
        // Score 0-100 based on workload
        const capacityScore = Math.min(100, Math.max(0, 
          100 - (activeProjects.length * 15) - (openTasks.length * 2) - (totalOverdue * 10)
        ));

        return {
          ...user,
          activeProjects: activeProjects.length,
          totalProjects: userProjects.length,
          projects: activeProjects,
          openTasks: openTasks.length,
          inProgressTasks: inProgressTasks.length,
          awaitingTasks: awaitingTasks.length,
          overdueTasks: overdueTasks.length,
          openRFIs: openRFIs.length,
          overdueRFIs: overdueRFIs.length,
          openSubmittals: openSubmittals.length,
          overdueSubmittals: overdueSubmittals.length,
          totalOverdue,
          totalOpen,
          capacityScore
        };
      })
      .sort((a, b) => {
        if (sortBy === 'projects') return b.activeProjects - a.activeProjects;
        if (sortBy === 'tasks') return b.openTasks - a.openTasks;
        if (sortBy === 'overdue') return b.totalOverdue - a.totalOverdue;
        return 0;
      });
  }, [users, projects, tasks, rfis, submittals, sortBy]);

  // ==========================================================================
  // GET CAPACITY COLOR
  // ==========================================================================
  const getCapacityColor = (score) => {
    if (score >= 60) return '#22c55e';
    if (score >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const getCapacityLabel = (score) => {
    if (score >= 60) return 'Available';
    if (score >= 30) return 'Busy';
    return 'Overloaded';
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
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <Users size={20} style={{ color: 'var(--sunbelt-orange)' }} />
          Team Workload
        </h3>

        {/* Sort Options */}
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {[
            { id: 'projects', label: 'Projects' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'overdue', label: 'Overdue' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              style={{
                padding: '4px 10px',
                background: sortBy === opt.id ? 'var(--sunbelt-orange)' : 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: sortBy === opt.id ? 'white' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* TEAM GRID                                                         */}
      {/* ================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--space-md)'
      }}>
        {workloadData.map(pm => (
          <div
            key={pm.id}
            onClick={() => {
              setSelectedPM(selectedPM === pm.id ? null : pm.id);
              onUserClick?.(pm);
            }}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${selectedPM === pm.id ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {/* PM Header */}
            <div style={{
              padding: 'var(--space-md)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  {pm.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                    {pm.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {pm.role}
                  </div>
                </div>
              </div>

              {/* Capacity Badge */}
              <div style={{
                padding: '4px 8px',
                borderRadius: '10px',
                fontSize: '0.6875rem',
                fontWeight: '600',
                background: `${getCapacityColor(pm.capacityScore)}20`,
                color: getCapacityColor(pm.capacityScore)
              }}>
                {getCapacityLabel(pm.capacityScore)}
              </div>
            </div>

            {/* Stats */}
            <div style={{
              padding: 'var(--space-md)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-sm)'
            }}>
              {/* Projects */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                  <FolderKanban size={14} style={{ color: 'var(--info)' }} />
                  <span style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {pm.activeProjects}
                  </span>
                </div>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Projects
                </span>
              </div>

              {/* Tasks */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                  <CheckSquare size={14} style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {pm.openTasks}
                  </span>
                </div>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Tasks
                </span>
              </div>

              {/* Overdue */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                  <AlertCircle size={14} style={{ color: pm.totalOverdue > 0 ? '#ef4444' : 'var(--text-tertiary)' }} />
                  <span style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '700', 
                    color: pm.totalOverdue > 0 ? '#ef4444' : 'var(--text-primary)' 
                  }}>
                    {pm.totalOverdue}
                  </span>
                </div>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Overdue
                </span>
              </div>
            </div>

            {/* Capacity Bar */}
            <div style={{ padding: '0 var(--space-md) var(--space-md)' }}>
              <div style={{
                height: '4px',
                background: 'var(--bg-tertiary)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${100 - pm.capacityScore}%`,
                  background: getCapacityColor(pm.capacityScore),
                  borderRadius: '2px',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>

            {/* Expanded Details */}
            {selectedPM === pm.id && (
              <div style={{
                padding: 'var(--space-md)',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)'
              }}>
                {/* Item Breakdown */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: 'var(--space-sm)',
                  marginBottom: 'var(--space-md)'
                }}>
                  <div style={{ fontSize: '0.75rem' }}>
                    <div style={{ color: 'var(--text-tertiary)', marginBottom: '2px' }}>RFIs</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <FileText size={12} style={{ color: '#3b82f6' }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{pm.openRFIs}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>open</span>
                      {pm.overdueRFIs > 0 && (
                        <span style={{ color: '#ef4444', fontWeight: '600' }}>({pm.overdueRFIs} overdue)</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>
                    <div style={{ color: 'var(--text-tertiary)', marginBottom: '2px' }}>Submittals</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <ClipboardList size={12} style={{ color: '#8b5cf6' }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{pm.openSubmittals}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>open</span>
                      {pm.overdueSubmittals > 0 && (
                        <span style={{ color: '#ef4444', fontWeight: '600' }}>({pm.overdueSubmittals} overdue)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project List */}
                {pm.projects.length > 0 && (
                  <div>
                    <div style={{ 
                      fontSize: '0.6875rem', 
                      color: 'var(--text-tertiary)', 
                      marginBottom: 'var(--space-xs)',
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    }}>
                      Active Projects
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {pm.projects.slice(0, 5).map(proj => (
                        <div
                          key={proj.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onProjectClick?.(proj);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            background: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                            {proj.project_number}
                          </span>
                          <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      ))}
                      {pm.projects.length > 5 && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '4px' }}>
                          +{pm.projects.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ================================================================== */}
      {/* EMPTY STATE                                                       */}
      {/* ================================================================== */}
      {workloadData.length === 0 && (
        <div style={{
          padding: 'var(--space-2xl)',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <Users size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
          <p>No team members found</p>
        </div>
      )}
    </div>
  );
}

export default TeamWorkloadView;