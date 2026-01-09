// ============================================================================
// DrawingVersionModal.jsx - Drawing Version Tracking Modal
// ============================================================================
// Modal component for tracking drawing versions and dealer approvals.
// Supports 20%, 65%, 95%, and 100% drawing sets with version history.
//
// FEATURES:
// - Create new drawing version submissions
// - Track version history per drawing percentage
// - Record dealer responses (Approve, Approve with Redlines, etc.)
// - Email notification for approval requests
// - File attachment support
// - Status tracking workflow
//
// Created: January 9, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Send, FileText, CheckCircle, XCircle, Edit3, History } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { draftDrawingApprovalEmail } from '../../utils/emailUtils';
import { DRAWING_PERCENTAGES, DEALER_RESPONSE_OPTIONS } from '../../utils/workflowUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

const DRAWING_STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft', color: 'var(--text-tertiary)' },
  { value: 'Submitted', label: 'Submitted to Dealer', color: 'var(--info)' },
  { value: 'Under Review', label: 'Under Review', color: 'var(--warning)' },
  { value: 'Approved', label: 'Approved', color: 'var(--success)' },
  { value: 'Approved with Redlines', label: 'Approved with Redlines', color: 'var(--info)' },
  { value: 'Rejected', label: 'Rejected - Revisions Required', color: 'var(--danger)' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function DrawingVersionModal({
  isOpen,
  onClose,
  project,
  drawingVersion = null, // null for new, object for edit
  defaultPercentage = 20,
  onSuccess,
}) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    drawing_percentage: defaultPercentage,
    version_number: 1,
    status: 'Draft',
    submitted_date: '',
    response_date: '',
    dealer_response: '',
    redline_notes: '',
    internal_notes: '',
  });
  const [versionHistory, setVersionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (isOpen) {
      if (drawingVersion) {
        // Edit mode
        setFormData({
          drawing_percentage: drawingVersion.drawing_percentage || defaultPercentage,
          version_number: drawingVersion.version_number || 1,
          status: drawingVersion.status || 'Draft',
          submitted_date: drawingVersion.submitted_date || '',
          response_date: drawingVersion.response_date || '',
          dealer_response: drawingVersion.dealer_response || '',
          redline_notes: drawingVersion.redline_notes || '',
          internal_notes: drawingVersion.internal_notes || '',
        });
        fetchVersionHistory(drawingVersion.drawing_percentage);
      } else {
        // New mode
        resetForm();
        fetchNextVersion(defaultPercentage);
        fetchVersionHistory(defaultPercentage);
      }
    }
  }, [isOpen, drawingVersion, defaultPercentage]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const fetchNextVersion = async (percentage) => {
    try {
      const { data, error } = await supabase
        .from('drawing_versions')
        .select('version_number')
        .eq('project_id', project?.id)
        .eq('drawing_percentage', percentage)
        .order('version_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      const nextVersion = data && data.length > 0 ? data[0].version_number + 1 : 1;
      setFormData(prev => ({ ...prev, version_number: nextVersion }));
    } catch (err) {
      console.error('Error fetching next version:', err);
    }
  };

  const fetchVersionHistory = async (percentage) => {
    try {
      const { data, error } = await supabase
        .from('drawing_versions')
        .select('*')
        .eq('project_id', project?.id)
        .eq('drawing_percentage', percentage)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersionHistory(data || []);
    } catch (err) {
      console.error('Error fetching version history:', err);
      setVersionHistory([]);
    }
  };

  const resetForm = () => {
    setFormData({
      drawing_percentage: defaultPercentage,
      version_number: 1,
      status: 'Draft',
      submitted_date: '',
      response_date: '',
      dealer_response: '',
      redline_notes: '',
      internal_notes: '',
    });
    setError('');
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Fetch next version when percentage changes (for new drawings)
    if (name === 'drawing_percentage' && !drawingVersion) {
      fetchNextVersion(parseInt(value));
      fetchVersionHistory(parseInt(value));
    }
  };

  const handleResponseSelect = (response) => {
    setFormData(prev => ({
      ...prev,
      dealer_response: response,
      status: response === 'Approve' ? 'Approved' :
              response === 'Approve with Redlines' ? 'Approved with Redlines' :
              'Rejected',
      response_date: prev.response_date || new Date().toISOString().split('T')[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const versionData = {
        project_id: project?.id,
        drawing_percentage: formData.drawing_percentage,
        version_number: formData.version_number,
        status: formData.status,
        submitted_date: formData.submitted_date || null,
        response_date: formData.response_date || null,
        dealer_response: formData.dealer_response || null,
        redline_notes: formData.redline_notes.trim() || null,
        internal_notes: formData.internal_notes.trim() || null,
        created_by: user?.id,
      };

      if (drawingVersion) {
        // Update existing
        const { error: updateError } = await supabase
          .from('drawing_versions')
          .update({
            ...versionData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', drawingVersion.id);

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('drawing_versions')
          .insert(versionData);

        if (insertError) throw insertError;
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error saving drawing version:', err);
      setError(err.message || 'Failed to save drawing version');
    } finally {
      setLoading(false);
    }
  };

  const handleSendApprovalEmail = () => {
    draftDrawingApprovalEmail({
      to: project?.dealer_email || '',
      project: {
        name: project?.name,
        project_number: project?.project_number,
      },
      drawingType: `${formData.drawing_percentage}%`,
      version: formData.version_number,
      dueDate: '', // Can add due date field if needed
    });
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const getStatusColor = (status) => {
    const option = DRAWING_STATUS_OPTIONS.find(o => o.value === status);
    return option?.color || 'var(--text-tertiary)';
  };

  const getResponseColor = (response) => {
    const option = DEALER_RESPONSE_OPTIONS.find(o => o.value === response);
    return option?.color || 'var(--text-tertiary)';
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!isOpen) return null;

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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-primary)',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileText size={20} style={{ color: 'var(--info)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                {drawingVersion ? 'Edit Drawing Version' : 'New Drawing Submission'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {project?.project_number} — {project?.name}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '8px',
                background: showHistory ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)',
                border: `1px solid ${showHistory ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                color: showHistory ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
              }}
              title="Version History"
            >
              <History size={18} />
            </button>
            <button
              type="button"
              onClick={handleSendApprovalEmail}
              style={{
                padding: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--success)',
                cursor: 'pointer',
                display: 'flex',
              }}
              title="Send Approval Request"
            >
              <Send size={18} />
            </button>
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
        {/* VERSION HISTORY PANEL                                           */}
        {/* ================================================================ */}
        {showHistory && versionHistory.length > 0 && (
          <div style={{
            padding: 'var(--space-lg)',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Version History - {formData.drawing_percentage}% Drawings
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {versionHistory.map(ver => (
                <div
                  key={ver.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      v{ver.version_number}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: `${getStatusColor(ver.status)}20`,
                      color: getStatusColor(ver.status),
                    }}>
                      {ver.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    {ver.dealer_response && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: getResponseColor(ver.dealer_response),
                      }}>
                        {ver.dealer_response}
                      </span>
                    )}
                    {ver.submitted_date && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {new Date(ver.submitted_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* FORM                                                            */}
        {/* ================================================================ */}
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-xl)' }}>
          {/* Error Display */}
          {error && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              color: 'var(--danger)',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          {/* ============================================================ */}
          {/* DRAWING PERCENTAGE & VERSION                                 */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Drawing Set</label>
              <select
                name="drawing_percentage"
                value={formData.drawing_percentage}
                onChange={handleChange}
                className="form-input"
                disabled={!!drawingVersion}
              >
                {DRAWING_PERCENTAGES.map(pct => (
                  <option key={pct} value={pct}>{pct}% Drawings</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Version</label>
              <input
                type="number"
                name="version_number"
                value={formData.version_number}
                onChange={handleChange}
                min="1"
                className="form-input"
                readOnly={!drawingVersion}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
              >
                {DRAWING_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ============================================================ */}
          {/* DATES                                                        */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Submitted Date</label>
              <input
                type="date"
                name="submitted_date"
                value={formData.submitted_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Response Date</label>
              <input
                type="date"
                name="response_date"
                value={formData.response_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* DEALER RESPONSE BUTTONS                                      */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Dealer Response</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)' }}>
              {DEALER_RESPONSE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleResponseSelect(opt.value)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${formData.dealer_response === opt.value ? opt.color : 'var(--border-color)'}`,
                    background: formData.dealer_response === opt.value ? `${opt.color}15` : 'var(--bg-secondary)',
                    color: formData.dealer_response === opt.value ? opt.color : 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  {opt.value.includes('Approve') ? <CheckCircle size={14} /> :
                   opt.value.includes('Reject') ? <XCircle size={14} /> :
                   <Edit3 size={14} />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* REDLINE NOTES                                                */}
          {/* ============================================================ */}
          {(formData.dealer_response === 'Approve with Redlines' || formData.dealer_response === 'Reject with Redlines') && (
            <div className="form-group">
              <label className="form-label">Redline Notes</label>
              <textarea
                name="redline_notes"
                value={formData.redline_notes}
                onChange={handleChange}
                className="form-input"
                rows="3"
                style={{ resize: 'vertical', minHeight: '80px' }}
                placeholder="Describe the redline changes requested..."
              />
            </div>
          )}

          {/* ============================================================ */}
          {/* INTERNAL NOTES                                               */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Internal Notes</label>
            <textarea
              name="internal_notes"
              value={formData.internal_notes}
              onChange={handleChange}
              className="form-input"
              rows="2"
              style={{ resize: 'vertical', minHeight: '60px' }}
              placeholder="Notes for internal reference..."
            />
          </div>

          {/* ============================================================ */}
          {/* ACTION BUTTONS                                               */}
          {/* ============================================================ */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            justifyContent: 'flex-end',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'var(--space-lg)',
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : <><Save size={18} /> Save Drawing Version</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DrawingVersionModal;
