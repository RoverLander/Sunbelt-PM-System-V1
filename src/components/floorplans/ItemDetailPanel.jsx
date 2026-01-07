// ============================================================================
// ItemDetailPanel Component
// ============================================================================
// Slide-out panel showing full RFI or Submittal details when clicking
// a marker on the floor plan. Allows navigation to full edit modal.
// ============================================================================

import React from 'react';
import {
  X,
  MessageSquare,
  ClipboardList,
  Calendar,
  User,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  Mail,
  ChevronRight
} from 'lucide-react';

// ============================================================================
// STATUS COLORS
// ============================================================================
const STATUS_COLORS = {
  'Open': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  'Pending': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  'Answered': { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
  'Closed': { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b' },
  'Submitted': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  'Under Review': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  'Approved': { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
  'Approved as Noted': { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
  'Revise & Resubmit': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  'Rejected': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }
};

const DEFAULT_STATUS = { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b' };

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ItemDetailPanel({ item, itemType, onClose, projectNumber }) {
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const isRFI = itemType === 'rfi';
  const statusColors = STATUS_COLORS[item?.status] || DEFAULT_STATUS;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = () => {
    if (!item?.due_date) return false;
    const closedStatuses = ['Closed', 'Approved', 'Approved as Noted', 'Answered'];
    return new Date(item.due_date) < new Date() && !closedStatuses.includes(item.status);
  };

  const calculateDaysOpen = () => {
    if (!item?.created_at) return null;
    const created = new Date(item.created_at);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!item) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1000
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '450px',
        maxWidth: '90vw',
        background: 'var(--bg-primary)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.2s ease-out'
      }}>
        {/* ================================================================ */}
        {/* HEADER                                                          */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--space-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: isRFI ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 107, 53, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isRFI ? (
                  <MessageSquare size={20} style={{ color: '#3b82f6' }} />
                ) : (
                  <ClipboardList size={20} style={{ color: 'var(--sunbelt-orange)' }} />
                )}
              </div>
              <div>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  color: isRFI ? '#3b82f6' : 'var(--sunbelt-orange)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {isRFI ? 'Request for Information' : 'Submittal'}
                </span>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {isRFI ? item.rfi_number : item.submittal_number}
                </h2>
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
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.8125rem',
              fontWeight: '600',
              background: isOverdue() ? 'rgba(239, 68, 68, 0.15)' : statusColors.bg,
              color: isOverdue() ? '#ef4444' : statusColors.color
            }}>
              {isOverdue() && <AlertCircle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
              {item.status}
            </span>

            {isRFI && item.is_external && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.8125rem',
                fontWeight: '600',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b'
              }}>
                <ExternalLink size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                External
              </span>
            )}

            {!isRFI && item.revision_number > 0 && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.8125rem',
                fontWeight: '600',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)'
              }}>
                Rev {item.revision_number}
              </span>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* CONTENT                                                         */}
        {/* ================================================================ */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-lg)'
        }}>
          {/* Title */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label style={{
              fontSize: '0.6875rem',
              fontWeight: '600',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {isRFI ? 'Subject' : 'Title'}
            </label>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 'var(--space-xs) 0 0 0',
              lineHeight: 1.4
            }}>
              {isRFI ? item.subject : item.title}
            </h3>
          </div>

          {/* Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-xl)'
          }}>
            {/* Sent To */}
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                marginBottom: 'var(--space-xs)'
              }}>
                <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase'
                }}>
                  Sent To
                </span>
              </div>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {item.sent_to || 'Internal'}
              </p>
              {item.sent_to_email && (
                <a 
                  href={`mailto:${item.sent_to_email}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--sunbelt-orange)',
                    marginTop: '2px',
                    textDecoration: 'none'
                  }}
                >
                  <Mail size={12} />
                  {item.sent_to_email}
                </a>
              )}
            </div>

            {/* Due Date */}
            <div style={{
              padding: 'var(--space-md)',
              background: isOverdue() ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: isOverdue() ? '1px solid rgba(239, 68, 68, 0.2)' : 'none'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                marginBottom: 'var(--space-xs)'
              }}>
                <Calendar size={14} style={{ color: isOverdue() ? '#ef4444' : 'var(--text-tertiary)' }} />
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  color: isOverdue() ? '#ef4444' : 'var(--text-tertiary)',
                  textTransform: 'uppercase'
                }}>
                  Due Date
                </span>
              </div>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isOverdue() ? '#ef4444' : 'var(--text-primary)',
                margin: 0
              }}>
                {formatDate(item.due_date)}
              </p>
              {isOverdue() && (
                <span style={{
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  fontWeight: '600'
                }}>
                  Overdue
                </span>
              )}
            </div>

            {/* Days Open (RFI only) */}
            {isRFI && (
              <div style={{
                padding: 'var(--space-md)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase'
                  }}>
                    Days Open
                  </span>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {calculateDaysOpen()} days
                </p>
              </div>
            )}

            {/* Submittal Type (Submittal only) */}
            {!isRFI && item.submittal_type && (
              <div style={{
                padding: 'var(--space-md)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase'
                  }}>
                    Type
                  </span>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {item.submittal_type}
                </p>
              </div>
            )}

            {/* Spec Section (Submittal only) */}
            {!isRFI && item.spec_section && (
              <div style={{
                padding: 'var(--space-md)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase'
                  }}>
                    Spec Section
                  </span>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {item.spec_section}
                </p>
              </div>
            )}
          </div>

          {/* Question (RFI) or Description (Submittal) */}
          {(isRFI ? item.question : item.description) && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label style={{
                fontSize: '0.6875rem',
                fontWeight: '600',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {isRFI ? 'Question' : 'Description'}
              </label>
              <div style={{
                marginTop: 'var(--space-sm)',
                padding: 'var(--space-md)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {isRFI ? item.question : item.description}
              </div>
            </div>
          )}

          {/* Answer (RFI only) */}
          {isRFI && item.answer && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label style={{
                fontSize: '0.6875rem',
                fontWeight: '600',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Answer
              </label>
              <div style={{
                marginTop: 'var(--space-sm)',
                padding: 'var(--space-md)',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {item.answer}
              </div>
            </div>
          )}

          {/* Manufacturer Info (Submittal only) */}
          {!isRFI && (item.manufacturer || item.model_number) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-xl)'
            }}>
              {item.manufacturer && (
                <div>
                  <label style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase'
                  }}>
                    Manufacturer
                  </label>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    margin: 'var(--space-xs) 0 0 0'
                  }}>
                    {item.manufacturer}
                  </p>
                </div>
              )}
              {item.model_number && (
                <div>
                  <label style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase'
                  }}>
                    Model Number
                  </label>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    margin: 'var(--space-xs) 0 0 0'
                  }}>
                    {item.model_number}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* FOOTER                                                          */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-lg)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            margin: 0
          }}>
            Created {formatDate(item.created_at)}
          </p>

          <button
            onClick={() => {
              // This would navigate to the full RFI/Submittal page
              // For now, just close the panel
              alert(`Navigate to full ${isRFI ? 'RFI' : 'Submittal'} view - to be implemented`);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            View Full Details
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

export default ItemDetailPanel;