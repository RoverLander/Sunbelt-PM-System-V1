// ============================================================================
// TeamPage Component
// ============================================================================
// Director-only page showing team workload and capacity.
// Displays all PMs with their project loads, tasks, and overdue items.
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Users,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  FileText,
  ClipboardList,
  ChevronRight,
  Mail,
  Search
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function TeamPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('projects');

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes, tasksRes, rfisRes, submittalsRes] = await Promise.all([
        supabase.from('users').select('*').eq('is_active', true),
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('id, project_id, status, due_date, assignee_id, internal_owner_id'),
        supabase.from('rfis').select('id, project_id, status, due_date'),
        supabase.from('submittals').select('id, project_id, status, due_date')
      ]);

      setUsers(usersRes.data || []);
      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // CALCULATE WORKLOAD
  // ==========================================================================
  const today = new Date().toISOString().split('T')[0];

  // Filter for team members (PM, Director, Admin - not VP)
  const teamData = users
    .filter(u => ['PM', 'Project Manager', 'Director', 'Admin'].includes(u.role))
    .map(member => {
      // Projects where user is PM (owner_id)
      const memberProjects = projects.filter(p => 
        p.owner_id === member.id && 
        ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'].includes(p.status)
      );

      // Backup projects
      const secondaryProjects = projects.filter(p => 
        p.backup_pm_id === member.id && 
        p.owner_id !== member.id &&
        ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress'].includes(p.status)
      );

      const allProjectIds = memberProjects.map(p => p.id);

      // Tasks for member's projects
      const memberTasks = tasks.filter(t => 
        allProjectIds.includes(t.project_id) &&
        !['Completed', 'Cancelled'].includes(t.status)
      );

      const assignedTasks = memberTasks.filter(t => 
        t.assignee_id === member.id || t.internal_owner_id === member.id
      );

      const overdueTasks = assignedTasks.filter(t => t.due_date && t.due_date < today);

      // RFIs for member's projects
      const memberRFIs = rfis.filter(r => 
        allProjectIds.includes(r.project_id) &&
        !['Answered', 'Closed'].includes(r.status)
      );
      const overdueRFIs = memberRFIs.filter(r => r.due_date && r.due_date < today);

      // Submittals for member's projects
      const memberSubmittals = submittals.filter(s => 
        allProjectIds.includes(s.project_id) &&
        ['Pending', 'Submitted', 'Under Review'].includes(s.status)
      );
      const overdueSubmittals = memberSubmittals.filter(s => s.due_date && s.due_date < today);

      const totalOverdue = overdueTasks.length + overdueRFIs.length + overdueSubmittals.length;

      // Capacity score (100 = available, 0 = overloaded)
      const capacityScore = Math.max(0, Math.min(100,
        100 - (memberProjects.length * 15) - (assignedTasks.length * 2) - (totalOverdue * 10)
      ));

      return {
        ...member,
        projectCount: memberProjects.length,
        secondaryCount: secondaryProjects.length,
        projects: memberProjects,
        taskCount: assignedTasks.length,
        overdueTasks: overdueTasks.length,
        openRFIs: memberRFIs.length,
        overdueRFIs: overdueRFIs.length,
        openSubmittals: memberSubmittals.length,
        overdueSubmittals: overdueSubmittals.length,
        totalOverdue,
        capacityScore
      };
    })
    .filter(m => {
      if (!searchTerm) return true;
      return m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             m.email?.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'projects') return b.projectCount - a.projectCount;
      if (sortBy === 'tasks') return b.taskCount - a.taskCount;
      if (sortBy === 'overdue') return b.totalOverdue - a.totalOverdue;
      if (sortBy === 'capacity') return a.capacityScore - b.capacityScore;
      return 0;
    });

  // ==========================================================================
  // HELPERS
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
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={28} style={{ color: 'var(--sunbelt-orange)' }} />
          Team Workload
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          View capacity and assignments across your team
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: 'var(--space-lg)' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Team Members</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{teamData.length}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Available</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>{teamData.filter(m => m.capacityScore >= 60).length}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Busy</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>{teamData.filter(m => m.capacityScore >= 30 && m.capacityScore < 60).length}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Overloaded</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>{teamData.filter(m => m.capacityScore < 30).length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: 'var(--space-md)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {['projects', 'tasks', 'overdue', 'capacity'].map(opt => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              style={{
                padding: '6px 12px',
                background: sortBy === opt ? 'var(--sunbelt-orange)' : 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: sortBy === opt ? 'white' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Team Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {teamData.map(member => (
          <div
            key={member.id}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}>
                    {member.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{member.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{member.role}</div>
                  </div>
                </div>

                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  background: `${getCapacityColor(member.capacityScore)}20`,
                  color: getCapacityColor(member.capacityScore)
                }}>
                  {getCapacityLabel(member.capacityScore)}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                    <FolderKanban size={14} style={{ color: 'var(--info)' }} />
                    <span style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>{member.projectCount}</span>
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Projects</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                    <CheckSquare size={14} style={{ color: '#22c55e' }} />
                    <span style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>{member.taskCount}</span>
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Tasks</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                    <AlertCircle size={14} style={{ color: member.totalOverdue > 0 ? '#ef4444' : 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: '1.125rem', fontWeight: '700', color: member.totalOverdue > 0 ? '#ef4444' : 'var(--text-primary)' }}>{member.totalOverdue}</span>
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Overdue</div>
                </div>
              </div>

              {/* Capacity bar */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${100 - member.capacityScore}%`,
                  background: getCapacityColor(member.capacityScore),
                  borderRadius: '4px',
                  transition: 'width 0.3s'
                }} />
              </div>

              {/* Additional details */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileText size={12} />
                  {member.openRFIs} RFIs
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ClipboardList size={12} />
                  {member.openSubmittals} Submittals
                </span>
                {member.secondaryCount > 0 && (
                  <span>+{member.secondaryCount} backup</span>
                )}
              </div>
            </div>

            {/* Projects preview */}
            {member.projects.length > 0 && (
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '600' }}>
                  Active Projects
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {member.projects.slice(0, 4).map(p => (
                    <span
                      key={p.id}
                      style={{
                        padding: '3px 8px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {p.project_number}
                    </span>
                  ))}
                  {member.projects.length > 4 && (
                    <span style={{ padding: '3px 8px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                      +{member.projects.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {teamData.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <Users size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No team members found</p>
        </div>
      )}
    </div>
  );
}

export default TeamPage;