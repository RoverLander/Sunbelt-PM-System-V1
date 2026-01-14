// ============================================================================
// OverviewTab.jsx - Redesigned Project Overview Tab
// ============================================================================
// Modern project overview with:
// - Project Health Score with visual gauge
// - Key Dates timeline with progress bar
// - Blockers & Attention Needed section
// - Recent Activity feed
// - Compact project info
// - This Week calendar strip
//
// Inspired by: Procore, BuilderTrend, CoConstruct, Monday.com
// Created: January 14, 2026
// ============================================================================

import React, { useMemo } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  DollarSign,
  Building2,
  MapPin,
  Factory,
  Flag,
  FileText,
  MessageSquare,
  ClipboardList,
  TrendingUp,
  Activity,
  ChevronRight,
  AlertCircle,
  CheckSquare,
  Target,
  Zap
} from 'lucide-react';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFullDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (value) => {
  if (!value) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const getDaysUntil = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.floor((date - now) / (1000 * 60 * 60 * 24));
  return diff;
};

const getDaysAgo = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  return diff;
};

const isOverdue = (dueDate, status, completedStatuses = []) => {
  if (!dueDate) return false;
  if (completedStatuses.includes(status)) return false;
  return new Date(dueDate) < new Date();
};

const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const diff = getDaysAgo(dateString);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return formatDate(dateString);
};

// ============================================================================
// PROJECT HEALTH SCORE COMPONENT
// ============================================================================
function ProjectHealthScore({ tasks, rfis, submittals, milestones, project }) {
  const health = useMemo(() => {
    let score = 100;
    let factors = [];

    // Task completion rate (max -30 points)
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const overdueTasks = tasks.filter(t => isOverdue(t.due_date, t.status, ['Completed', 'Cancelled'])).length;

    if (totalTasks > 0) {
      const taskCompletionRate = completedTasks / totalTasks;
      if (taskCompletionRate < 0.5) {
        score -= 15;
        factors.push({ type: 'warning', text: `${Math.round(taskCompletionRate * 100)}% tasks complete` });
      }
    }

    if (overdueTasks > 0) {
      score -= Math.min(overdueTasks * 5, 20);
      factors.push({ type: 'danger', text: `${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}` });
    }

    // Open RFIs (max -20 points)
    const openRFIs = rfis.filter(r => r.status === 'Open').length;
    const overdueRFIs = rfis.filter(r => isOverdue(r.due_date, r.status, ['Answered', 'Closed'])).length;

    if (overdueRFIs > 0) {
      score -= Math.min(overdueRFIs * 7, 15);
      factors.push({ type: 'danger', text: `${overdueRFIs} RFI${overdueRFIs > 1 ? 's' : ''} overdue` });
    } else if (openRFIs > 3) {
      score -= 5;
      factors.push({ type: 'warning', text: `${openRFIs} open RFIs` });
    }

    // Pending submittals (max -20 points)
    const pendingSubmittals = submittals.filter(s => ['Pending', 'Submitted', 'Under Review'].includes(s.status)).length;
    const overdueSubmittals = submittals.filter(s => isOverdue(s.due_date, s.status, ['Approved', 'Approved as Noted'])).length;

    if (overdueSubmittals > 0) {
      score -= Math.min(overdueSubmittals * 5, 15);
      factors.push({ type: 'danger', text: `${overdueSubmittals} submittal${overdueSubmittals > 1 ? 's' : ''} overdue` });
    }

    // Milestone progress (max -15 points)
    const completedMilestones = milestones.filter(m => m.is_completed).length;
    const overdueMilestones = milestones.filter(m => !m.is_completed && isOverdue(m.due_date, null, [])).length;

    if (overdueMilestones > 0) {
      score -= Math.min(overdueMilestones * 10, 15);
      factors.push({ type: 'danger', text: `${overdueMilestones} milestone${overdueMilestones > 1 ? 's' : ''} behind` });
    }

    // If no issues, add positive feedback
    if (factors.length === 0) {
      factors.push({ type: 'success', text: 'All items on track' });
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      status: score >= 85 ? 'On Track' : score >= 60 ? 'At Risk' : 'Critical',
      color: score >= 85 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
    };
  }, [tasks, rfis, submittals, milestones]);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Target size={18} style={{ color: health.color }} />
          Project Health
        </h3>
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: `${health.color}20`,
          color: health.color
        }}>
          {health.status}
        </span>
      </div>

      {/* Health Score Gauge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          position: 'relative',
          width: '80px',
          height: '80px'
        }}>
          <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={health.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${health.score * 2.51} 251`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: health.color }}>
              {health.score}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {health.factors.map((factor, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: idx < health.factors.length - 1 ? '6px' : 0
            }}>
              {factor.type === 'success' && <CheckCircle size={14} style={{ color: '#22c55e' }} />}
              {factor.type === 'warning' && <AlertTriangle size={14} style={{ color: '#f59e0b' }} />}
              {factor.type === 'danger' && <AlertCircle size={14} style={{ color: '#ef4444' }} />}
              <span style={{
                fontSize: '0.8rem',
                color: factor.type === 'success' ? '#22c55e' : factor.type === 'warning' ? '#f59e0b' : '#ef4444'
              }}>
                {factor.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {tasks.filter(t => t.status === 'Completed').length}/{tasks.length}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Tasks</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: rfis.filter(r => r.status === 'Open').length > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
            {rfis.filter(r => r.status === 'Open').length}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Open RFIs</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: submittals.filter(s => s.status === 'Pending').length > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
            {submittals.filter(s => ['Pending', 'Under Review'].includes(s.status)).length}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Pending Subs</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KEY DATES TIMELINE COMPONENT
// ============================================================================
function KeyDatesTimeline({ project, milestones }) {
  const keyDates = useMemo(() => {
    const dates = [];

    // Add key project dates
    if (project.sales_handoff_date) {
      dates.push({
        label: 'Sales Handoff',
        date: project.sales_handoff_date,
        isComplete: new Date(project.sales_handoff_date) < new Date(),
        type: 'milestone'
      });
    }

    // Add milestones
    milestones.forEach(m => {
      dates.push({
        label: m.name,
        date: m.due_date,
        isComplete: m.is_completed,
        type: 'milestone'
      });
    });

    // Add target online date
    if (project.target_online_date) {
      dates.push({
        label: 'Target Online',
        date: project.target_online_date,
        isComplete: false,
        type: 'target',
        isTarget: true
      });
    }

    // Sort by date
    return dates.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [project, milestones]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (keyDates.length === 0) return 0;
    const completed = keyDates.filter(d => d.isComplete).length;
    return Math.round((completed / keyDates.length) * 100);
  }, [keyDates]);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      padding: '20px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Flag size={18} style={{ color: 'var(--sunbelt-orange)' }} />
          Key Dates
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {progress}% complete
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '6px',
        background: 'var(--bg-tertiary)',
        borderRadius: '3px',
        marginBottom: '16px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #22c55e, #10b981)',
          borderRadius: '3px',
          transition: 'width 0.5s ease'
        }} />
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {keyDates.slice(0, 5).map((item, idx) => {
          const daysUntil = getDaysUntil(item.date);
          const isOverdueItem = !item.isComplete && daysUntil !== null && daysUntil < 0;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: item.isTarget ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-primary)',
                borderRadius: '8px',
                borderLeft: `3px solid ${item.isComplete ? '#22c55e' : isOverdueItem ? '#ef4444' : item.isTarget ? '#f59e0b' : 'var(--border-color)'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.isComplete ? (
                  <CheckCircle size={16} style={{ color: '#22c55e' }} />
                ) : isOverdueItem ? (
                  <AlertCircle size={16} style={{ color: '#ef4444' }} />
                ) : item.isTarget ? (
                  <Target size={16} style={{ color: '#f59e0b' }} />
                ) : (
                  <Clock size={16} style={{ color: 'var(--text-tertiary)' }} />
                )}
                <span style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  fontWeight: item.isTarget ? '600' : '400'
                }}>
                  {item.label}
                </span>
              </div>
              <span style={{
                fontSize: '0.8rem',
                color: item.isComplete ? '#22c55e' : isOverdueItem ? '#ef4444' : item.isTarget ? '#f59e0b' : 'var(--text-tertiary)',
                fontWeight: '500'
              }}>
                {formatDate(item.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// BLOCKERS & ATTENTION NEEDED COMPONENT
// ============================================================================
function BlockersSection({ tasks, rfis, submittals, onItemClick }) {
  const blockers = useMemo(() => {
    const items = [];

    // Overdue tasks
    tasks.forEach(t => {
      if (isOverdue(t.due_date, t.status, ['Completed', 'Cancelled'])) {
        const daysOverdue = Math.abs(getDaysUntil(t.due_date));
        items.push({
          type: 'task',
          data: t,
          title: t.title,
          message: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
          severity: daysOverdue > 7 ? 'critical' : 'warning',
          icon: CheckSquare
        });
      }
    });

    // Overdue RFIs
    rfis.forEach(r => {
      if (isOverdue(r.due_date, r.status, ['Answered', 'Closed'])) {
        const daysOverdue = Math.abs(getDaysUntil(r.due_date));
        items.push({
          type: 'rfi',
          data: r,
          title: `RFI-${String(r.number || '').padStart(3, '0')}: ${r.subject}`,
          message: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
          severity: daysOverdue > 5 ? 'critical' : 'warning',
          icon: MessageSquare
        });
      }
    });

    // Overdue submittals
    submittals.forEach(s => {
      if (isOverdue(s.due_date, s.status, ['Approved', 'Approved as Noted'])) {
        const daysOverdue = Math.abs(getDaysUntil(s.due_date));
        items.push({
          type: 'submittal',
          data: s,
          title: `SUB-${String(s.number || '').padStart(3, '0')}: ${s.description}`,
          message: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
          severity: daysOverdue > 5 ? 'critical' : 'warning',
          icon: ClipboardList
        });
      }
    });

    // Items due soon (within 3 days)
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);

    tasks.forEach(t => {
      if (!['Completed', 'Cancelled'].includes(t.status) && t.due_date) {
        const dueDate = new Date(t.due_date);
        const today = new Date();
        if (dueDate > today && dueDate <= soon) {
          items.push({
            type: 'task',
            data: t,
            title: t.title,
            message: `Due ${formatDate(t.due_date)}`,
            severity: 'info',
            icon: CheckSquare
          });
        }
      }
    });

    // Sort by severity then date
    return items.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }).slice(0, 5);
  }, [tasks, rfis, submittals]);

  if (blockers.length === 0) {
    return (
      <div style={{
        background: 'rgba(34, 197, 94, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <CheckCircle size={24} style={{ color: '#22c55e' }} />
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#22c55e' }}>
            All Clear
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            No blockers or overdue items
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      padding: '20px'
    }}>
      <h3 style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Zap size={18} style={{ color: '#ef4444' }} />
        Needs Attention
        <span style={{
          padding: '2px 8px',
          borderRadius: '10px',
          fontSize: '0.7rem',
          fontWeight: '600',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444'
        }}>
          {blockers.length}
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {blockers.map((item, idx) => {
          const Icon = item.icon;
          const bgColor = item.severity === 'critical' ? 'rgba(239, 68, 68, 0.08)' :
                          item.severity === 'warning' ? 'rgba(245, 158, 11, 0.08)' :
                          'var(--bg-primary)';
          const borderColor = item.severity === 'critical' ? '#ef4444' :
                              item.severity === 'warning' ? '#f59e0b' :
                              '#3b82f6';

          return (
            <button
              key={idx}
              onClick={() => onItemClick && onItemClick(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: bgColor,
                border: 'none',
                borderLeft: `3px solid ${borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <Icon size={16} style={{ color: borderColor, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: borderColor }}>
                    {item.message}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// PROJECT INFO CARD COMPONENT
// ============================================================================
function ProjectInfoCard({ project }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      padding: '20px'
    }}>
      <h3 style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Building2 size={18} style={{ color: 'var(--sunbelt-orange)' }} />
        Project Details
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <InfoRow icon={Building2} label="Client" value={project.client_name} />
        <InfoRow icon={Factory} label="Factory" value={project.factory_name || project.factory} />
        <InfoRow icon={DollarSign} label="Value" value={formatCurrency(project.contract_value)} highlight />
        <InfoRow icon={MapPin} label="Location" value={project.site_address || project.site_city} />
        <InfoRow icon={FileText} label="Type" value={project.project_type || project.building_type} />
        {project.square_footage && (
          <InfoRow icon={Target} label="Size" value={`${project.square_footage?.toLocaleString()} sqft`} />
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Icon size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{
          fontSize: '0.875rem',
          color: highlight ? 'var(--sunbelt-orange)' : 'var(--text-primary)',
          fontWeight: highlight ? '700' : '500'
        }}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RECENT ACTIVITY COMPONENT
// ============================================================================
function RecentActivity({ tasks, rfis, submittals }) {
  const activities = useMemo(() => {
    const items = [];

    // Add recent tasks (created or updated)
    tasks.slice(0, 10).forEach(t => {
      if (t.updated_at) {
        items.push({
          type: 'task',
          action: t.status === 'Completed' ? 'completed' : 'updated',
          title: t.title,
          date: t.updated_at,
          icon: CheckSquare,
          color: t.status === 'Completed' ? '#22c55e' : '#3b82f6'
        });
      }
    });

    // Add recent RFIs
    rfis.slice(0, 5).forEach(r => {
      items.push({
        type: 'rfi',
        action: r.status === 'Answered' ? 'answered' : r.status === 'Closed' ? 'closed' : 'created',
        title: r.subject,
        date: r.updated_at || r.created_at,
        icon: MessageSquare,
        color: r.status === 'Answered' ? '#22c55e' : '#f59e0b'
      });
    });

    // Add recent submittals
    submittals.slice(0, 5).forEach(s => {
      items.push({
        type: 'submittal',
        action: s.status === 'Approved' ? 'approved' : 'updated',
        title: s.description,
        date: s.updated_at || s.created_at,
        icon: ClipboardList,
        color: s.status === 'Approved' ? '#22c55e' : '#8b5cf6'
      });
    });

    // Sort by date and take top 6
    return items
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [tasks, rfis, submittals]);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      padding: '20px'
    }}>
      <h3 style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Activity size={18} style={{ color: '#8b5cf6' }} />
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
          No recent activity
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={14} style={{ color: item.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{item.action}</span>: {item.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    {getRelativeTime(item.date)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// THIS WEEK CALENDAR STRIP
// ============================================================================
function ThisWeekCalendar({ tasks, rfis, submittals, milestones }) {
  const weekData = useMemo(() => {
    const today = new Date();
    const days = [];

    // Get Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);

    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));
      const dayRFIs = rfis.filter(r => r.due_date && r.due_date.startsWith(dateStr));
      const daySubmittals = submittals.filter(s => s.due_date && s.due_date.startsWith(dateStr));
      const dayMilestones = milestones.filter(m => m.due_date && m.due_date.startsWith(dateStr));

      days.push({
        date,
        dateStr,
        isToday: date.toDateString() === today.toDateString(),
        tasks: dayTasks,
        rfis: dayRFIs,
        submittals: daySubmittals,
        milestones: dayMilestones,
        hasItems: dayTasks.length + dayRFIs.length + daySubmittals.length + dayMilestones.length > 0
      });
    }

    return days;
  }, [tasks, rfis, submittals, milestones]);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      padding: '20px'
    }}>
      <h3 style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Calendar size={18} style={{ color: '#3b82f6' }} />
        This Week
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        {weekData.map((day, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px 8px',
              background: day.isToday ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-primary)',
              borderRadius: '8px',
              textAlign: 'center',
              border: day.isToday ? '2px solid var(--sunbelt-orange)' : '1px solid var(--border-color)'
            }}
          >
            <div style={{
              fontSize: '0.7rem',
              color: day.isToday ? 'var(--sunbelt-orange)' : 'var(--text-tertiary)',
              fontWeight: day.isToday ? '600' : '400',
              marginBottom: '4px'
            }}>
              {dayNames[idx]}
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: day.isToday ? 'var(--sunbelt-orange)' : 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              {day.date.getDate()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {day.tasks.length > 0 && (
                <div style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  borderRadius: '4px'
                }}>
                  {day.tasks.length} task{day.tasks.length > 1 ? 's' : ''}
                </div>
              )}
              {day.rfis.length > 0 && (
                <div style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  borderRadius: '4px'
                }}>
                  {day.rfis.length} RFI{day.rfis.length > 1 ? 's' : ''}
                </div>
              )}
              {day.submittals.length > 0 && (
                <div style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#8b5cf6',
                  borderRadius: '4px'
                }}>
                  {day.submittals.length} sub
                </div>
              )}
              {day.milestones.length > 0 && (
                <div style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  borderRadius: '4px'
                }}>
                  Milestone
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN OVERVIEW TAB COMPONENT
// ============================================================================
function OverviewTab({ project, stats, milestones, tasks, rfis, submittals, setEditTask, setEditRFI, setEditSubmittal }) {
  const handleBlockerClick = (item) => {
    if (item.type === 'task' && setEditTask) setEditTask(item.data);
    else if (item.type === 'rfi' && setEditRFI) setEditRFI(item.data);
    else if (item.type === 'submittal' && setEditSubmittal) setEditSubmittal(item.data);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Row: Health Score + Key Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <ProjectHealthScore
          tasks={tasks}
          rfis={rfis}
          submittals={submittals}
          milestones={milestones}
          project={project}
        />
        <KeyDatesTimeline project={project} milestones={milestones} />
      </div>

      {/* Blockers Section - Full Width */}
      <BlockersSection
        tasks={tasks}
        rfis={rfis}
        submittals={submittals}
        onItemClick={handleBlockerClick}
      />

      {/* Bottom Row: Project Info + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <ProjectInfoCard project={project} />
        <RecentActivity tasks={tasks} rfis={rfis} submittals={submittals} />
      </div>

      {/* This Week Calendar */}
      <ThisWeekCalendar
        tasks={tasks}
        rfis={rfis}
        submittals={submittals}
        milestones={milestones}
      />
    </div>
  );
}

export default OverviewTab;
