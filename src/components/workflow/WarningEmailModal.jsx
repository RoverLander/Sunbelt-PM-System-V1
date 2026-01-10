// ============================================================================
// WarningEmailModal.jsx - Warning Email Composer for Workflow Tracking
// ============================================================================
// Modal component for composing and sending warning emails related to
// workflow delays. Opens email in default email client (Outlook) with
// pre-filled content and logs the email to the database.
//
// FEATURES:
// - Multiple warning email types (dealer, internal, factory)
// - Auto-populated recipient from project/station data
// - Customizable email content
// - Email logging to warning_emails_log table
// - Integration with emailUtils warning templates
//
// Created: January 9, 2026
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Send, Mail, AlertTriangle, Clock, User, Building2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  WARNING_EMAIL_TYPES,
  draftDealerWarningEmail,
  draftInternalWarningEmail,
  draftFactoryWarningEmail,
  draftDrawingApprovalEmail,
  draftLongLeadEmail,
  draftColorSelectionEmail,
} from '../../utils/emailUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

const EMAIL_TYPE_CONFIG = {
  [WARNING_EMAIL_TYPES.DEALER_DELAY]: {
    label: 'Dealer Response Delay',
    icon: Building2,
    color: 'var(--info)',
    description: 'Notify dealer of overdue response on drawings or approvals',
  },
  [WARNING_EMAIL_TYPES.INTERNAL_DELAY]: {
    label: 'Internal Processing Delay',
    icon: User,
    color: 'var(--warning)',
    description: 'Alert internal team member of overdue workflow station',
  },
  [WARNING_EMAIL_TYPES.FACTORY_DELAY]: {
    label: 'Factory Milestone Delay',
    icon: Clock,
    color: 'var(--danger)',
    description: 'Notify factory of delayed production milestone',
  },
  [WARNING_EMAIL_TYPES.DRAWING_APPROVAL]: {
    label: 'Drawing Approval Request',
    icon: Mail,
    color: 'var(--sunbelt-orange)',
    description: 'Request dealer approval on drawing set',
  },
  [WARNING_EMAIL_TYPES.LONG_LEAD_DELAY]: {
    label: 'Long Lead Item Delay',
    icon: AlertTriangle,
    color: 'var(--danger)',
    description: 'Alert about long lead item delay',
  },
  [WARNING_EMAIL_TYPES.COLOR_SELECTION]: {
    label: 'Color Selection Request',
    icon: Mail,
    color: 'var(--success)',
    description: 'Request color selections from dealer',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function WarningEmailModal({
  isOpen,
  onClose,
  project,
  station = null,
  task = null,
  defaultType = null,
  onSuccess,
}) {
  const { user } = useAuth();

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailType, setEmailType] = useState(defaultType || WARNING_EMAIL_TYPES.DEALER_DELAY);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [daysOverdue, setDaysOverdue] = useState(0);
  const [contacts, setContacts] = useState([]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      calculateDaysOverdue();
      // Pre-fill recipient if available
      if (project?.dealer_email) {
        setRecipientEmail(project.dealer_email);
        setRecipientName(project.dealer_name || '');
      }
    }
  }, [isOpen, project]);

  useEffect(() => {
    if (defaultType) {
      setEmailType(defaultType);
    }
  }, [defaultType]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const fetchContacts = async () => {
    try {
      // Fetch factory contacts and users
      const [factoryRes, usersRes] = await Promise.all([
        supabase.from('factory_contacts').select('*').order('name'),
        supabase.from('users').select('id, name, email, role').order('name'),
      ]);

      const allContacts = [
        ...(factoryRes.data || []).map(c => ({ ...c, type: 'factory' })),
        ...(usersRes.data || []).map(u => ({ ...u, type: 'user' })),
      ];

      setContacts(allContacts);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const calculateDaysOverdue = () => {
    // Calculate days overdue from task or station deadline
    const deadline = task?.due_date || station?.deadline;
    if (!deadline) {
      setDaysOverdue(0);
      return;
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - deadlineDate) / (1000 * 60 * 60 * 24));
    setDaysOverdue(Math.max(0, diffDays));
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      setError('Please enter a recipient email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build email options
      const emailOptions = {
        to: recipientEmail,
        project: {
          name: project?.name,
          project_number: project?.project_number,
        },
        stationName: station?.name || '',
        daysOverdue,
        itemDescription: task?.title || station?.name || '',
        pendingItems: task ? [task.title] : [],
        originalDueDate: task?.due_date || station?.deadline || '',
      };

      // Send appropriate email type
      switch (emailType) {
        case WARNING_EMAIL_TYPES.DEALER_DELAY:
          draftDealerWarningEmail(emailOptions);
          break;
        case WARNING_EMAIL_TYPES.INTERNAL_DELAY:
          draftInternalWarningEmail(emailOptions);
          break;
        case WARNING_EMAIL_TYPES.FACTORY_DELAY:
          draftFactoryWarningEmail({
            ...emailOptions,
            milestoneName: station?.name || task?.title || '',
          });
          break;
        case WARNING_EMAIL_TYPES.DRAWING_APPROVAL:
          draftDrawingApprovalEmail({
            ...emailOptions,
            drawingType: station?.name || 'Drawing Set',
          });
          break;
        case WARNING_EMAIL_TYPES.LONG_LEAD_DELAY:
          draftLongLeadEmail({
            ...emailOptions,
            item: { item_name: task?.title || '' },
            type: 'delay',
          });
          break;
        case WARNING_EMAIL_TYPES.COLOR_SELECTION:
          draftColorSelectionEmail(emailOptions);
          break;
        default:
          draftDealerWarningEmail(emailOptions);
      }

      // Log the warning email to database
      const { error: logError } = await supabase
        .from('warning_emails_log')
        .insert({
          project_id: project?.id,
          email_type: emailType,
          sent_to_emails: [recipientEmail],
          email_subject: `Warning: ${station?.name || task?.title || 'Action Required'}`,
          email_body: additionalNotes || null,
          sent_by: user?.id,
          status: 'Sent',
        });

      if (logError) {
        console.error('Error logging warning email:', logError);
        // Don't fail the operation, email was still sent
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error sending warning email:', err);
      setError(err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = (e) => {
    const selectedEmail = e.target.value;
    setRecipientEmail(selectedEmail);

    const contact = contacts.find(c => c.email === selectedEmail);
    if (contact) {
      setRecipientName(contact.name || '');
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!isOpen) return null;

  const typeConfig = EMAIL_TYPE_CONFIG[emailType] || EMAIL_TYPE_CONFIG[WARNING_EMAIL_TYPES.DEALER_DELAY];
  const TypeIcon = typeConfig.icon;

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
        maxWidth: '600px',
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
              background: `${typeConfig.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TypeIcon size={20} style={{ color: typeConfig.color }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                Send Warning Email
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {project?.project_number} — {project?.name}
              </p>
            </div>
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

        {/* ================================================================ */}
        {/* FORM                                                            */}
        {/* ================================================================ */}
        <div style={{ padding: 'var(--space-xl)' }}>
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
          {/* EMAIL TYPE SELECTION                                         */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Email Type</label>
            <select
              value={emailType}
              onChange={(e) => setEmailType(e.target.value)}
              className="form-input"
            >
              {Object.entries(EMAIL_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {typeConfig.description}
            </p>
          </div>

          {/* ============================================================ */}
          {/* RECIPIENT                                                    */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Recipient</label>
            <select
              value={recipientEmail}
              onChange={handleContactSelect}
              className="form-input"
              style={{ marginBottom: 'var(--space-sm)' }}
            >
              <option value="">Select from contacts...</option>
              <optgroup label="── Factory Contacts ──">
                {contacts.filter(c => c.type === 'factory').map(c => (
                  <option key={c.id} value={c.email}>{c.name} ({c.email})</option>
                ))}
              </optgroup>
              <optgroup label="── Team Members ──">
                {contacts.filter(c => c.type === 'user').map(c => (
                  <option key={c.id} value={c.email}>{c.name} ({c.role})</option>
                ))}
              </optgroup>
            </select>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Or enter email address manually"
              className="form-input"
            />
          </div>

          {/* ============================================================ */}
          {/* RECIPIENT NAME                                               */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Recipient Name (Optional)</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Contact name"
              className="form-input"
            />
          </div>

          {/* ============================================================ */}
          {/* CONTEXT INFO                                                 */}
          {/* ============================================================ */}
          <div style={{
            padding: 'var(--space-lg)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-lg)',
            border: '1px solid var(--border-color)',
          }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Email Context
            </h4>
            <div style={{ display: 'grid', gap: 'var(--space-sm)', fontSize: '0.875rem' }}>
              {station && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Station:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{station.name}</span>
                </div>
              )}
              {task && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Task:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{task.title}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Days Overdue:</span>
                <span style={{
                  color: daysOverdue > 7 ? 'var(--danger)' : daysOverdue > 3 ? 'var(--warning)' : 'var(--text-primary)',
                  fontWeight: '600',
                }}>
                  {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* DAYS OVERDUE (EDITABLE)                                      */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Days Overdue</label>
            <input
              type="number"
              min="0"
              value={daysOverdue}
              onChange={(e) => setDaysOverdue(parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '120px' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Adjust if needed for email content
            </p>
          </div>

          {/* ============================================================ */}
          {/* ADDITIONAL NOTES                                             */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Internal Notes (Not included in email)</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Notes for your records..."
              className="form-input"
              rows="2"
              style={{ resize: 'vertical', minHeight: '60px' }}
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
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={loading || !recipientEmail}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '10px 20px',
                background: 'var(--sunbelt-orange)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontWeight: '600',
                cursor: loading || !recipientEmail ? 'not-allowed' : 'pointer',
                opacity: loading || !recipientEmail ? 0.7 : 1,
              }}
            >
              <Send size={18} />
              {loading ? 'Opening...' : 'Open in Email Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarningEmailModal;
