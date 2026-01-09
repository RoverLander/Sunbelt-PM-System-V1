// ============================================================================
// StationDetailModal.jsx - Workflow Station Detail View
// ============================================================================
// Modal component for viewing detailed workflow station information.
// Shows linked tasks, status, deadlines, and available actions.
//
// FEATURES:
// - Station information display
// - Linked tasks list with status
// - Quick task status updates
// - Warning email trigger
// - Station notes/history
// - Court (ball-in-whose-court) display
//
// Created: January 9, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Plus,
  ExternalLink,
  User,
  Calendar
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  calculateStationStatus,
  getStationColor,
  getStationStatusLabel,
  getCourtOption,
  formatDate,
  formatRelativeDate,
  COURT_OPTIONS,
  TASK_STATUS_COLORS,
} from '../../utils/workflowUtils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function StationDetailModal({
  isOpen,
  onClose,
  project,
  station,
  onSendWarning,
  onAddTask,
  onTaskClick,
  onRefresh,
}) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [linkedTasks, setLinkedTasks] = useState([]);
  const [stationStatus, setStationStatus] = useState(null);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (isOpen && station && project?.id) {
      fetchLinkedTasks();
    }
  }, [isOpen, station, project?.id]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const fetchLinkedTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id(id, name),
          internal_owner:internal_owner_id(id, name)
        `)
        .eq('project_id', project?.id)
        .eq('workflow_station_key', station?.station_key)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      setLinkedTasks(data || []);

      // Calculate station status from tasks
      const status = calculateStationStatus(data || []);
      setStationStatus(status);
    } catch (err) {
      console.error('Error fetching linked tasks:', err);
      setLinkedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (taskId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Auto-set completed date
      if (newStatus === 'Completed') {
        updateData.completed_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Refresh tasks
      await fetchLinkedTasks();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const getDeadlineInfo = () => {
    if (linkedTasks.length === 0) return null;

    const upcomingDeadlines = linkedTasks
      .filter(t => t.due_date && t.status !== 'Completed' && t.status !== 'Cancelled')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    if (upcomingDeadlines.length === 0) return null;

    const earliest = upcomingDeadlines[0];
    const deadlineDate = new Date(earliest.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    return {
      date: earliest.due_date,
      daysUntil,
      isOverdue: daysUntil < 0,
      isUrgent: daysUntil >= 0 && daysUntil <= 2,
    };
  };

  const getTaskCounts = () => {
    const total = linkedTasks.length;
    const completed = linkedTasks.filter(t => t.status === 'Completed').length;
    const inProgress = linkedTasks.filter(t => t.status === 'In Progress').length;
    const awaiting = linkedTasks.filter(t => t.status === 'Awaiting Response').length;
    const notStarted = linkedTasks.filter(t => t.status === 'Not Started').length;

    return { total, completed, inProgress, awaiting, notStarted };
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!isOpen || !station) return null;

  const deadlineInfo = getDeadlineInfo();
  const taskCounts = getTaskCounts();
  const statusColor = getStationColor(stationStatus, deadlineInfo?.date);
  const statusLabel = getStationStatusLabel(stationStatus);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-xl)',
      }}>
        {/* ================================================================ */}
        {/* HEADER                                                          */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-xl)',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-primary)',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: statusColor,
                }} />
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                }}>
                  Phase {station.phase}
                </span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {station.name}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {station.description}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* STATUS SUMMARY                                                  */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-lg) var(--space-xl)',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-lg)' }}>
            {/* Status */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Status</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: statusColor,
              }}>
                {stationStatus === 'completed' ? <CheckCircle size={16} /> :
                 stationStatus === 'awaiting_response' ? <Clock size={16} /> :
                 <AlertTriangle size={16} />}
                {statusLabel}
              </div>
            </div>

            {/* Tasks */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Tasks</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {taskCounts.completed} / {taskCounts.total} complete
              </div>
            </div>

            {/* Deadline */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Deadline</div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: deadlineInfo?.isOverdue ? 'var(--danger)' :
                       deadlineInfo?.isUrgent ? 'var(--warning)' :
                       'var(--text-primary)',
              }}>
                {deadlineInfo ? formatRelativeDate(deadlineInfo.date) : '—'}
              </div>
            </div>

            {/* Default Court */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Default Owner</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {station.default_owner || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* ACTIONS                                                         */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-md) var(--space-xl)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          gap: 'var(--space-sm)',
        }}>
          {onAddTask && (
            <button
              type="button"
              onClick={() => onAddTask(station.station_key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                background: 'var(--sunbelt-orange)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} /> Add Task
            </button>
          )}
          {onSendWarning && (stationStatus !== 'completed' && stationStatus !== 'skipped') && (
            <button
              type="button"
              onClick={() => onSendWarning(station)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: deadlineInfo?.isOverdue ? 'var(--danger)' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Send size={16} /> Send Warning
            </button>
          )}
        </div>

        {/* ================================================================ */}
        {/* LINKED TASKS                                                    */}
        {/* ================================================================ */}
        <div style={{ padding: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-lg)' }}>
            Linked Tasks ({linkedTasks.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
              Loading tasks...
            </div>
          ) : linkedTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-xl)',
              color: 'var(--text-tertiary)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
            }}>
              <AlertTriangle size={32} style={{ marginBottom: 'var(--space-sm)', opacity: 0.5 }} />
              <p style={{ marginBottom: 'var(--space-xs)' }}>No tasks linked to this station</p>
              <p style={{ fontSize: '0.875rem' }}>Create a task and assign it to this workflow station</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {linkedTasks.map(task => {
                const courtOption = getCourtOption(task.assigned_court);
                const isOverdue = task.due_date &&
                  task.status !== 'Completed' &&
                  task.status !== 'Cancelled' &&
                  new Date(task.due_date) < new Date();

                return (
                  <div
                    key={task.id}
                    style={{
                      padding: 'var(--space-md)',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border-color)'}`,
                      cursor: onTaskClick ? 'pointer' : 'default',
                    }}
                    onClick={() => onTaskClick && onTaskClick(task)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
                          <span style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            textDecoration: task.status === 'Cancelled' ? 'line-through' : 'none',
                          }}>
                            {task.title}
                          </span>
                          {isOverdue && (
                            <span style={{
                              fontSize: '0.625rem',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--danger-light)',
                              color: 'var(--danger)',
                              fontWeight: '600',
                            }}>
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', fontSize: '0.75rem' }}>
                          {/* Status */}
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: `${TASK_STATUS_COLORS[task.status]}20`,
                            color: TASK_STATUS_COLORS[task.status],
                            fontWeight: '500',
                          }}>
                            {task.status}
                          </span>

                          {/* Court */}
                          {courtOption && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: courtOption.color,
                            }}>
                              <User size={12} />
                              {courtOption.label}
                            </span>
                          )}

                          {/* Due Date */}
                          {task.due_date && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: isOverdue ? 'var(--danger)' : 'var(--text-tertiary)',
                            }}>
                              <Calendar size={12} />
                              {formatDate(task.due_date)}
                            </span>
                          )}

                          {/* Assignee */}
                          {(task.assignee?.name || task.external_assignee_name) && (
                            <span style={{ color: 'var(--text-tertiary)' }}>
                              → {task.assignee?.name || task.external_assignee_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Status Buttons */}
                      {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickStatusUpdate(task.id, 'Completed');
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--success)',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Mark Complete"
                          >
                            <CheckCircle size={12} />
                          </button>
                          {onTaskClick && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskClick(task);
                              }}
                              style={{
                                padding: '4px 8px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                              }}
                              title="View Details"
                            >
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* FOOTER                                                          */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-lg) var(--space-xl)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default StationDetailModal;
