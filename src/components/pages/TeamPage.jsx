// ============================================================================
// TeamPage Component - Team Management with Kanban Builder
// ============================================================================
// Director/VP page for managing PM teams with drag-and-drop functionality.
//
// FEATURES:
// - All PMs tab: Grid view of all team members with workload stats
// - Team Builder tab: Kanban-style drag-and-drop team organization
// - Create, edit, delete teams
// - Add/remove PMs from multiple teams
// - Real-time team statistics
//
// Created: January 14, 2026
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  FileText,
  ClipboardList,
  Search,
  Plus,
  X,
  Edit3,
  Trash2,
  GripVertical,
  LayoutGrid,
  Columns,
  RefreshCw,
  ChevronDown,
  UserPlus,
  Building2
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const TEAM_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' }
];

// ============================================================================
// PM CARD COMPONENT
// ============================================================================

function PMCard({ pm, isDragging, onDragStart, onDragEnd, showRemove, onRemove, compact = false }) {
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

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, pm)}
      onDragEnd={onDragEnd}
      style={{
        background: isDragging ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        padding: compact ? '10px 12px' : '12px 14px',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.15s',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: compact ? '8px' : '10px' }}>
        <div style={{
          width: compact ? '32px' : '36px',
          height: compact ? '32px' : '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600',
          fontSize: compact ? '0.8125rem' : '0.875rem',
          flexShrink: 0
        }}>
          {pm.name?.charAt(0) || 'U'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: '600',
            color: 'var(--text-primary)',
            fontSize: compact ? '0.8125rem' : '0.875rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {pm.name}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
            {pm.role}
          </div>
        </div>

        {/* Capacity Badge */}
        <span style={{
          padding: '3px 8px',
          borderRadius: '10px',
          fontSize: '0.625rem',
          fontWeight: '600',
          background: `${getCapacityColor(pm.capacityScore)}20`,
          color: getCapacityColor(pm.capacityScore),
          whiteSpace: 'nowrap'
        }}>
          {getCapacityLabel(pm.capacityScore)}
        </span>

        {/* Remove Button */}
        {showRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(pm); }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              flexShrink: 0
            }}
            title="Remove from team"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: compact ? '6px' : '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
            <FolderKanban size={12} style={{ color: 'var(--info)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {pm.projectCount}
            </span>
          </div>
          <span style={{ fontSize: '0.5625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Projects
          </span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
            <CheckSquare size={12} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {pm.taskCount}
            </span>
          </div>
          <span style={{ fontSize: '0.5625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Tasks
          </span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
            <AlertCircle size={12} style={{ color: pm.totalOverdue > 0 ? '#ef4444' : 'var(--text-tertiary)' }} />
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: pm.totalOverdue > 0 ? '#ef4444' : 'var(--text-primary)'
            }}>
              {pm.totalOverdue}
            </span>
          </div>
          <span style={{ fontSize: '0.5625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Overdue
          </span>
        </div>
      </div>

      {/* Capacity Bar */}
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
          borderRadius: '2px'
        }} />
      </div>

      {/* Project Tags */}
      {!compact && pm.projects && pm.projects.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {pm.projects.slice(0, 3).map(p => (
            <span
              key={p.id}
              style={{
                padding: '2px 6px',
                background: 'var(--bg-tertiary)',
                borderRadius: '3px',
                fontSize: '0.625rem',
                color: 'var(--text-secondary)'
              }}
            >
              {p.project_number}
            </span>
          ))}
          {pm.projects.length > 3 && (
            <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
              +{pm.projects.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TEAM COLUMN COMPONENT
// ============================================================================

function TeamColumn({
  team,
  members,
  onDrop,
  onRemoveMember,
  onEditTeam,
  onDeleteTeam,
  dragOverTeam,
  setDragOverTeam
}) {
  const teamStats = useMemo(() => {
    const totalProjects = members.reduce((sum, m) => sum + m.projectCount, 0);
    const totalOverdue = members.reduce((sum, m) => sum + m.totalOverdue, 0);
    const avgCapacity = members.length > 0
      ? Math.round(members.reduce((sum, m) => sum + m.capacityScore, 0) / members.length)
      : 100;
    const overloaded = members.filter(m => m.capacityScore < 30).length;

    return { totalProjects, totalOverdue, avgCapacity, overloaded };
  }, [members]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOverTeam(team.id);
  };

  const handleDragLeave = () => {
    setDragOverTeam(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOverTeam(null);
    const pmId = e.dataTransfer.getData('pmId');
    if (pmId) {
      onDrop(team.id, pmId);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: `2px solid ${dragOverTeam === team.id ? team.color : 'var(--border-color)'}`,
        minWidth: '280px',
        maxWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s'
      }}
    >
      {/* Team Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: `${team.color}10`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              background: team.color
            }} />
            <h3 style={{
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              {team.name}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => onEditTeam(team)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Edit team"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onDeleteTeam(team)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Delete team"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Team Stats */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>{members.length} PM{members.length !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{teamStats.totalProjects} projects</span>
          {teamStats.overloaded > 0 && (
            <>
              <span>•</span>
              <span style={{ color: '#ef4444' }}>{teamStats.overloaded} overloaded</span>
            </>
          )}
        </div>
      </div>

      {/* Members List */}
      <div style={{
        padding: '12px',
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: '150px'
      }}>
        {members.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: '0.8125rem',
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}>
            <UserPlus size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <div>Drop PMs here</div>
          </div>
        ) : (
          members.map(pm => (
            <PMCard
              key={pm.id}
              pm={pm}
              compact
              showRemove
              onRemove={() => onRemoveMember(team.id, pm.id)}
              onDragStart={(e) => {
                e.dataTransfer.setData('pmId', pm.id);
                e.dataTransfer.setData('fromTeam', team.id);
              }}
              onDragEnd={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CREATE/EDIT TEAM MODAL
// ============================================================================

function TeamModal({ team, onSave, onClose }) {
  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');
  const [color, setColor] = useState(team?.color || TEAM_COLORS[0].value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), description: description.trim(), color });
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            {team ? 'Edit Team' : 'Create New Team'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Team Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Southeast Region"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Color */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Team Color
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TEAM_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: c.value,
                    border: color === c.value ? '3px solid var(--text-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            style={{
              padding: '8px 16px',
              background: 'var(--sunbelt-orange)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              fontSize: '0.8125rem',
              fontWeight: '500',
              cursor: name.trim() && !saving ? 'pointer' : 'not-allowed',
              opacity: name.trim() && !saving ? 1 : 0.5
            }}
          >
            {saving ? 'Saving...' : (team ? 'Save Changes' : 'Create Team')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function TeamPage() {
  const { user } = useAuth();

  // Data state
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRFIs] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'builder'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('projects');
  const [draggedPM, setDraggedPM] = useState(null);
  const [dragOverTeam, setDragOverTeam] = useState(null);

  // Modal state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes, tasksRes, rfisRes, submittalsRes, teamsRes, teamMembersRes] = await Promise.all([
        supabase.from('users').select('*').eq('is_active', true),
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('id, project_id, status, due_date, assignee_id, internal_owner_id'),
        supabase.from('rfis').select('id, project_id, status, due_date'),
        supabase.from('submittals').select('id, project_id, status, due_date'),
        supabase.from('teams').select('*').order('created_at'),
        supabase.from('team_members').select('*')
      ]);

      setUsers(usersRes.data || []);
      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setRFIs(rfisRes.data || []);
      setSubmittals(submittalsRes.data || []);
      setTeams(teamsRes.data || []);
      setTeamMembers(teamMembersRes.data || []);
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

  // Determine which roles to show based on current user
  // VP sees: PMs, Directors, Plant Managers
  // Director sees: PMs
  const visibleRoles = useMemo(() => {
    if (user?.role === 'VP') {
      return ['PM', 'Project Manager', 'Project_Manager', 'Director', 'PC', 'Plant_Manager'];
    }
    return ['PM', 'Project Manager', 'Project_Manager'];
  }, [user?.role]);

  const pmData = useMemo(() => {
    return users
      .filter(u => visibleRoles.includes(u.role))
      .map(member => {
        // Projects where user is PM (owner_id or primary_pm_id)
        const memberProjects = projects.filter(p =>
          (p.owner_id === member.id || p.primary_pm_id === member.id) &&
          ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress', 'Active'].includes(p.status)
        );

        // Backup projects
        const secondaryProjects = projects.filter(p =>
          p.backup_pm_id === member.id &&
          p.owner_id !== member.id &&
          ['Planning', 'Pre-PM', 'PM Handoff', 'In Progress', 'Active'].includes(p.status)
        );

        const allProjectIds = memberProjects.map(p => p.id);

        // Tasks for member
        const memberTasks = tasks.filter(t =>
          (t.assignee_id === member.id || t.internal_owner_id === member.id) &&
          !['Completed', 'Cancelled'].includes(t.status)
        );
        const overdueTasks = memberTasks.filter(t => t.due_date && t.due_date < today);

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
          100 - (memberProjects.length * 15) - (memberTasks.length * 2) - (totalOverdue * 10)
        ));

        return {
          ...member,
          projectCount: memberProjects.length,
          secondaryCount: secondaryProjects.length,
          projects: memberProjects,
          taskCount: memberTasks.length,
          overdueTasks: overdueTasks.length,
          openRFIs: memberRFIs.length,
          overdueRFIs: overdueRFIs.length,
          openSubmittals: memberSubmittals.length,
          overdueSubmittals: overdueSubmittals.length,
          totalOverdue,
          capacityScore
        };
      });
  }, [users, projects, tasks, rfis, submittals, today, visibleRoles]);

  // Filtered and sorted PM data for All PMs tab
  const filteredPMData = useMemo(() => {
    return pmData
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
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        return 0;
      });
  }, [pmData, searchTerm, sortBy]);

  // Get members for a specific team
  const getTeamMembers = useCallback((teamId) => {
    const memberIds = teamMembers
      .filter(tm => tm.team_id === teamId)
      .map(tm => tm.user_id);
    return pmData.filter(pm => memberIds.includes(pm.id));
  }, [teamMembers, pmData]);

  // Get set of all PM IDs that are in any team
  const assignedPMIds = useMemo(() => {
    return new Set(teamMembers.map(tm => tm.user_id));
  }, [teamMembers]);

  // ==========================================================================
  // TEAM OPERATIONS
  // ==========================================================================

  const handleCreateTeam = async (teamData) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{ ...teamData, created_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      setTeams([...teams, data]);
      setShowTeamModal(false);
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
    }
  };

  const handleUpdateTeam = async (teamData) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update(teamData)
        .eq('id', editingTeam.id);

      if (error) throw error;
      setTeams(teams.map(t => t.id === editingTeam.id ? { ...t, ...teamData } : t));
      setEditingTeam(null);
      setShowTeamModal(false);
    } catch (error) {
      console.error('Error updating team:', error);
      alert('Failed to update team. Please try again.');
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!confirm(`Are you sure you want to delete "${team.name}"? This will remove all PM assignments.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', team.id);

      if (error) throw error;
      setTeams(teams.filter(t => t.id !== team.id));
      setTeamMembers(teamMembers.filter(tm => tm.team_id !== team.id));
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team. Please try again.');
    }
  };

  const handleAddMemberToTeam = async (teamId, userId) => {
    // Check if already a member
    const existing = teamMembers.find(tm => tm.team_id === teamId && tm.user_id === userId);
    if (existing) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert([{ team_id: teamId, user_id: userId, added_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      setTeamMembers([...teamMembers, data]);
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const handleRemoveMemberFromTeam = async (teamId, userId) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
      setTeamMembers(teamMembers.filter(tm => !(tm.team_id === teamId && tm.user_id === userId)));
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  // ==========================================================================
  // DRAG AND DROP
  // ==========================================================================

  const handleDragStart = (e, pm) => {
    setDraggedPM(pm);
    e.dataTransfer.setData('pmId', pm.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedPM(null);
    setDragOverTeam(null);
  };

  // ==========================================================================
  // SUMMARY STATS
  // ==========================================================================

  const summaryStats = useMemo(() => {
    const available = pmData.filter(m => m.capacityScore >= 60).length;
    const busy = pmData.filter(m => m.capacityScore >= 30 && m.capacityScore < 60).length;
    const overloaded = pmData.filter(m => m.capacityScore < 30).length;
    const totalProjects = pmData.reduce((sum, m) => sum + m.projectCount, 0);

    return { total: pmData.length, available, busy, overloaded, totalProjects };
  }, [pmData]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <RefreshCw size={24} className="spin" style={{ color: 'var(--text-secondary)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-lg)'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Users size={28} style={{ color: 'var(--sunbelt-orange)' }} />
            Team Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Organize and manage your team's workload
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {activeTab === 'builder' && (
            <button
              onClick={() => { setEditingTeam(null); setShowTeamModal(true); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--sunbelt-orange)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: '0.8125rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              New Team
            </button>
          )}
          <button
            onClick={fetchData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: 'var(--space-lg)',
        background: 'var(--bg-secondary)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: activeTab === 'all' ? 'var(--bg-primary)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: '0.8125rem',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: activeTab === 'all' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <LayoutGrid size={16} />
          All Team Members
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: activeTab === 'builder' ? 'var(--bg-primary)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === 'builder' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: '0.8125rem',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: activeTab === 'builder' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <Columns size={16} />
          Team Builder
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Team Members
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {summaryStats.total}
          </div>
        </div>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Available
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
            {summaryStats.available}
          </div>
        </div>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Busy
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
            {summaryStats.busy}
          </div>
        </div>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Overloaded
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
            {summaryStats.overloaded}
          </div>
        </div>
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Active Projects
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--sunbelt-orange)' }}>
            {summaryStats.totalProjects}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'all' ? (
        // ====================================================================
        // ALL PMs TAB
        // ====================================================================
        <div>
          {/* Filters */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: 'var(--space-md)',
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)'
              }} />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              {['name', 'projects', 'tasks', 'overdue', 'capacity'].map(opt => (
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

          {/* PM Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {filteredPMData.map(pm => (
              <PMCard
                key={pm.id}
                pm={pm}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>

          {filteredPMData.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No team members found</p>
            </div>
          )}
        </div>
      ) : (
        // ====================================================================
        // TEAM BUILDER TAB
        // ====================================================================
        <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 340px)', minHeight: '500px' }}>
          {/* PM Pool (Left Side) */}
          <div style={{
            width: '320px',
            flexShrink: 0,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h3 style={{
                fontSize: '0.9375rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: '8px'
              }}>
                All Team Members
              </h3>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)'
                }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem'
                  }}
                />
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {filteredPMData.map(pm => (
                <PMCard
                  key={pm.id}
                  pm={pm}
                  compact
                  isDragging={draggedPM?.id === pm.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </div>

          {/* Teams (Right Side - Scrollable) */}
          <div style={{
            flex: 1,
            overflowX: 'auto',
            display: 'flex',
            gap: '16px',
            paddingBottom: '8px'
          }}>
            {teams.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '2px dashed var(--border-color)'
              }}>
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  <Columns size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.9375rem', marginBottom: '12px' }}>No teams created yet</p>
                  <button
                    onClick={() => { setEditingTeam(null); setShowTeamModal(true); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: 'var(--sunbelt-orange)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      color: 'white',
                      fontSize: '0.8125rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                    Create Your First Team
                  </button>
                </div>
              </div>
            ) : (
              teams.map(team => (
                <TeamColumn
                  key={team.id}
                  team={team}
                  members={getTeamMembers(team.id)}
                  onDrop={handleAddMemberToTeam}
                  onRemoveMember={handleRemoveMemberFromTeam}
                  onEditTeam={(t) => { setEditingTeam(t); setShowTeamModal(true); }}
                  onDeleteTeam={handleDeleteTeam}
                  dragOverTeam={dragOverTeam}
                  setDragOverTeam={setDragOverTeam}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <TeamModal
          team={editingTeam}
          onSave={editingTeam ? handleUpdateTeam : handleCreateTeam}
          onClose={() => { setShowTeamModal(false); setEditingTeam(null); }}
        />
      )}
    </div>
  );
}

export default TeamPage;
