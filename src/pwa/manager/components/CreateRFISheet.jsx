// ============================================================================
// CreateRFISheet.jsx - Bottom Sheet for Creating RFIs
// ============================================================================
// Mobile-optimized bottom sheet for creating new RFIs.
// Uses database schema: rfis table with project_id, subject, question,
// status, priority, due_date, sent_to, internal_owner_id fields.
// Note: rfi_number is auto-generated via database trigger.
//
// Created: January 17, 2026
// Phase 4 Implementation
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import { supabase } from '../../../utils/supabaseClient';
import {
  X,
  MessageSquare,
  Calendar,
  AlertTriangle,
  User,
  Mail,
  Loader2
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITIES = [
  { id: 'Low', label: 'Low', color: '#6b7280' },
  { id: 'Medium', label: 'Medium', color: '#3b82f6' },
  { id: 'High', label: 'High', color: '#f59e0b' },
  { id: 'Critical', label: 'Critical', color: '#ef4444' }
];

const STATUSES = [
  { id: 'Draft', label: 'Draft' },
  { id: 'Open', label: 'Open' }
];

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease-out'
  },
  sheet: {
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90dvh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp 0.3s ease-out'
  },
  handle: {
    width: '36px',
    height: '4px',
    background: 'var(--border-secondary)',
    borderRadius: '2px',
    margin: 'var(--space-sm) auto var(--space-md)'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--space-lg) var(--space-md)',
    borderBottom: '1px solid var(--border-primary)'
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
  },
  closeButton: {
    background: 'var(--bg-tertiary)',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-secondary)'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--space-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  },
  input: {
    width: '100%',
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s ease'
  },
  textarea: {
    resize: 'vertical',
    minHeight: '120px'
  },
  select: {
    appearance: 'none',
    cursor: 'pointer',
    paddingRight: '40px',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center'
  },
  priorityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-sm)'
  },
  priorityButton: {
    padding: 'var(--space-sm) var(--space-xs)',
    border: '2px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    background: 'transparent',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'center'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-md)'
  },
  footer: {
    padding: 'var(--space-lg)',
    borderTop: '1px solid var(--border-primary)',
    display: 'flex',
    gap: 'var(--space-md)'
  },
  cancelButton: {
    flex: 1,
    padding: 'var(--space-md)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  submitButton: {
    flex: 2,
    padding: 'var(--space-md)',
    background: 'var(--accent-primary)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)'
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  error: {
    padding: 'var(--space-md)',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 'var(--radius-md)',
    color: '#ef4444',
    fontSize: '0.875rem'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function CreateRFISheet({ isOpen, onClose, projectId, onRFICreated }) {
  const { userId } = useManagerAuth();

  // Form state
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Open');
  const [dueDate, setDueDate] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [sentToEmail, setSentToEmail] = useState('');
  const [projectIdValue, setProjectIdValue] = useState(projectId || '');

  // UI state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================================================
  // FETCH PROJECTS (if not provided)
  // ==========================================================================

  useEffect(() => {
    if (!projectId) {
      fetchProjects();
    }
  }, [projectId]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_number, name')
        .in('status', ['Planning', 'In Progress', 'Production'])
        .order('project_number', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('[CreateRFISheet] Failed to fetch projects:', err);
    }
  };

  // ==========================================================================
  // RESET FORM
  // ==========================================================================

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setQuestion('');
      setPriority('Medium');
      setStatus('Open');
      setDueDate('');
      setSentTo('');
      setSentToEmail('');
      setProjectIdValue(projectId || '');
      setError(null);
    }
  }, [isOpen, projectId]);

  // ==========================================================================
  // SUBMIT HANDLER
  // ==========================================================================

  const handleSubmit = useCallback(async () => {
    // Validation
    if (!subject.trim()) {
      setError('Please enter an RFI subject');
      return;
    }

    const targetProjectId = projectIdValue || projectId;
    if (!targetProjectId) {
      setError('Please select a project');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate RFI number (format: PRJ-RFI-001)
      // First, get the project number for the prefix
      const { data: projectData } = await supabase
        .from('projects')
        .select('project_number')
        .eq('id', targetProjectId)
        .single();

      // Get count of existing RFIs for this project
      const { count } = await supabase
        .from('rfis')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', targetProjectId);

      const rfiNumber = `${projectData?.project_number || 'PRJ'}-RFI-${String((count || 0) + 1).padStart(3, '0')}`;

      const rfiData = {
        project_id: targetProjectId,
        rfi_number: rfiNumber,
        subject: subject.trim(),
        question: question.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
        sent_to: sentTo.trim() || null,
        sent_to_email: sentToEmail.trim() || null,
        internal_owner_id: userId,
        created_by: userId
      };

      const { data, error: insertError } = await supabase
        .from('rfis')
        .insert(rfiData)
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('[CreateRFISheet] RFI created:', data);

      if (onRFICreated) {
        onRFICreated(data);
      }

      onClose();
    } catch (err) {
      console.error('[CreateRFISheet] Create error:', err);
      setError(err.message || 'Failed to create RFI');
    } finally {
      setLoading(false);
    }
  }, [subject, question, priority, status, dueDate, sentTo, sentToEmail, projectIdValue, projectId, userId, onRFICreated, onClose]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div style={styles.handle} />

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>New RFI</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Error */}
          {error && (
            <div style={styles.error}>{error}</div>
          )}

          {/* Project Selector (if not provided) */}
          {!projectId && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Project</label>
              <select
                value={projectIdValue}
                onChange={(e) => setProjectIdValue(e.target.value)}
                style={{ ...styles.input, ...styles.select }}
              >
                <option value="">Select a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.project_number} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="RFI subject..."
              style={styles.input}
              autoFocus
            />
          </div>

          {/* Question */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question or request for information..."
              style={{ ...styles.input, ...styles.textarea }}
            />
          </div>

          {/* Sent To */}
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Sent To (Name)</label>
              <input
                type="text"
                value={sentTo}
                onChange={(e) => setSentTo(e.target.value)}
                placeholder="Recipient name"
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={sentToEmail}
                onChange={(e) => setSentToEmail(e.target.value)}
                placeholder="email@example.com"
                style={styles.input}
              />
            </div>
          </div>

          {/* Priority */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Priority</label>
            <div style={styles.priorityGrid}>
              {PRIORITIES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  style={{
                    ...styles.priorityButton,
                    color: p.color,
                    ...(priority === p.id ? {
                      borderColor: p.color,
                      background: `${p.color}15`
                    } : {})
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date & Status */}
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ ...styles.input, ...styles.select }}
              >
                {STATUSES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Creating...
              </>
            ) : (
              <>
                <MessageSquare size={18} />
                Create RFI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
