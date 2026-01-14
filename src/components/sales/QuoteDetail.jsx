// ============================================================================
// QuoteDetail.jsx - Quote Detail View
// ============================================================================
// Full view of a sales quote with status management and handoff capabilities.
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit2,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  User,
  History,
  Loader2,
  Copy,
  MoreVertical,
  AlertCircle,
  FileText
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Import shared constants
import {
  STATUS_CONFIG,
  LOST_REASONS,
  formatCurrency,
  getStatusConfig
} from '../../constants/salesStatuses';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function QuoteDetail({ quote, onBack, onEdit, onRefresh }) {
  const { user } = useAuth();
  const statusConfig = STATUS_CONFIG[quote.status];
  const StatusIcon = statusConfig?.icon || FileText;

  // State
  const [updating, setUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [activities, setActivities] = useState([]);
  const [revisions, setRevisions] = useState([]); // For future revision history display
  void revisions; // TODO: Display revision history in UI

  // Fetch functions defined before useEffect
  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_activities')
        .select(`
          *,
          creator:created_by(name)
        `)
        .eq('quote_id', quote.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const fetchRevisions = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_quote_revisions')
        .select('*')
        .eq('quote_id', quote.id)
        .order('version', { ascending: false });

      if (error) throw error;
      setRevisions(data || []);
    } catch (err) {
      console.error('Error fetching revisions:', err);
    }
  };

  // Fetch related data
  useEffect(() => {
    fetchActivities();
    fetchRevisions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote.id]);

  // Status change handlers
  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'lost') {
      setShowLostModal(true);
      setShowStatusMenu(false);
      return;
    }

    setUpdating(true);
    try {
      const updates = {
        status: newStatus,
        last_modified_by: user?.id
      };

      if (newStatus === 'sent' && !quote.sent_at) {
        updates.sent_at = new Date().toISOString();
      }

      if (newStatus === 'won') {
        updates.won_date = new Date().toISOString().slice(0, 10);
      }

      const { error } = await supabase
        .from('sales_quotes')
        .update(updates)
        .eq('id', quote.id);

      if (error) throw error;

      // Log activity
      await supabase.from('sales_activities').insert({
        quote_id: quote.id,
        activity_type: 'status_change',
        subject: `Status changed to ${newStatus}`,
        old_status: quote.status,
        new_status: newStatus,
        created_by: user?.id
      });

      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
      setShowStatusMenu(false);
    }
  };

  const handleMarkLost = async () => {
    if (!lostReason) {
      alert('Please select a reason');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('sales_quotes')
        .update({
          status: 'lost',
          lost_date: new Date().toISOString().slice(0, 10),
          lost_reason: lostReason,
          competitor_name: competitorName || null,
          last_modified_by: user?.id
        })
        .eq('id', quote.id);

      if (error) throw error;

      // Log activity
      await supabase.from('sales_activities').insert({
        quote_id: quote.id,
        activity_type: 'status_change',
        subject: 'Quote marked as lost',
        description: `Reason: ${lostReason}${competitorName ? `, Competitor: ${competitorName}` : ''}`,
        old_status: quote.status,
        new_status: 'lost',
        created_by: user?.id
      });

      onRefresh();
    } catch (error) {
      console.error('Error marking as lost:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
      setShowLostModal(false);
    }
  };

  const handleCreateProject = async () => {
    if (!window.confirm('Create a PM project from this quote? This will mark the quote as handed off.')) {
      return;
    }

    setUpdating(true);
    try {
      // Create the project
      const projectData = {
        project_name: quote.project_name,
        factory: quote.factory,
        factory_code: quote.factory, // Use same value for consistency
        status: 'Planning', // Start in Planning status
        source_quote_id: quote.id,
        contract_value: quote.total_price || null,
        // Map customer info if available
        client_name: quote.customer?.company_name || null,
        client_contact_name: quote.customer?.contact_name || null,
        client_contact_email: quote.customer?.contact_email || null,
        client_contact_phone: quote.customer?.contact_phone || null,
        location: quote.project_location || null,
        city: quote.project_city || null,
        state: quote.project_state || null,
        description: quote.project_description || null,
        created_by: user?.id
      };

      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (projectError) throw projectError;

      // Update quote with handoff info
      const { error: quoteError } = await supabase
        .from('sales_quotes')
        .update({
          handed_off_to_pm: true,
          handed_off_date: new Date().toISOString(),
          handed_off_by: user?.id,
          project_id: newProject.id
        })
        .eq('id', quote.id);

      if (quoteError) throw quoteError;

      // Log activity
      await supabase.from('sales_activities').insert({
        quote_id: quote.id,
        activity_type: 'other',
        subject: 'Project created from quote',
        description: `PM Project created: ${newProject.project_name}`,
        created_by: user?.id
      });

      alert('Project created successfully!');
      onRefresh();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              {quote.project_name}
            </h1>
            <code style={{
              fontSize: '0.85rem',
              color: 'var(--text-tertiary)',
              background: 'var(--bg-tertiary)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              {quote.quote_number}
            </code>
          </div>
          {quote.customer?.company_name && (
            <p style={{ color: 'var(--text-tertiary)', margin: '4px 0 0', fontSize: '0.9rem' }}>
              {quote.customer.company_name}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {quote.status === 'won' && !quote.handed_off_to_pm && (
            <button
              onClick={handleCreateProject}
              disabled={updating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#22c55e',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: updating ? 'not-allowed' : 'pointer',
                opacity: updating ? 0.7 : 1
              }}
            >
              <ArrowRight size={18} />
              Create PM Project
            </button>
          )}

          <button
            onClick={onEdit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <Edit2 size={18} />
            Edit
          </button>

          {/* Status Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={updating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: statusConfig.bgColor,
                border: `1px solid ${statusConfig.color}`,
                borderRadius: '8px',
                color: statusConfig.color,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <StatusIcon size={18} />
              {statusConfig.label}
              {updating && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            </button>

            {showStatusMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '180px',
                zIndex: 100
              }}>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={status === quote.status}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px 16px',
                      background: status === quote.status ? 'var(--bg-secondary)' : 'transparent',
                      border: 'none',
                      color: status === quote.status ? 'var(--text-tertiary)' : config.color,
                      cursor: status === quote.status ? 'default' : 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <config.icon size={16} />
                    {config.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Pricing Card */}
          <div style={{
            padding: '24px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <DollarSign size={16} />
              Pricing
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Base Price</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {formatCurrency(quote.base_price)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Options</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {formatCurrency(quote.options_price)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Discount</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ef4444' }}>
                  {quote.discount_percent ? `${quote.discount_percent}%` :
                   quote.discount_amount ? formatCurrency(quote.discount_amount) : '-'}
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Total</span>
              <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--sunbelt-orange)' }}>
                {formatCurrency(quote.total_price)}
              </span>
            </div>
          </div>

          {/* Project Details Card */}
          <div style={{
            padding: '24px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileText size={16} />
              Project Details
            </h3>

            {quote.project_description && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
                {quote.project_description}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Factory</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{quote.factory}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Product Type</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {quote.product_type?.replace(/_/g, ' ') || '-'}
                </div>
              </div>
              {quote.project_location && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Delivery Location</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {quote.project_location}
                    {quote.project_city && `, ${quote.project_city}`}
                    {quote.project_state && `, ${quote.project_state}`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline & Terms Card */}
          <div style={{
            padding: '24px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Calendar size={16} />
              Timeline & Terms
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Requested Delivery</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {formatDate(quote.requested_delivery_date)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Est. Production</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {quote.estimated_production_weeks ? `${quote.estimated_production_weeks} weeks` : '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Valid Until</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {formatDate(quote.quote_valid_until)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Payment Terms</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {quote.payment_terms?.replace(/_/g, ' ') || '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Deposit Required</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {formatCurrency(quote.deposit_required)}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(quote.internal_notes || quote.customer_notes) && (
            <div style={{
              padding: '24px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '16px'
              }}>
                Notes
              </h3>

              {quote.internal_notes && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                    Internal Notes
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    {quote.internal_notes}
                  </p>
                </div>
              )}

              {quote.customer_notes && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                    Customer Notes
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    {quote.customer_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer Card */}
          {quote.customer && (
            <div style={{
              padding: '20px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Building2 size={16} />
                Customer
              </h3>

              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {quote.customer.company_name}
              </div>

              {quote.customer.contact_name && (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {quote.customer.contact_name}
                </div>
              )}
            </div>
          )}

          {/* Assignment Card */}
          <div style={{
            padding: '20px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <User size={16} />
              Assignment
            </h3>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {quote.assigned_user?.name || 'Unassigned'}
            </div>
          </div>

          {/* Activity Log */}
          <div style={{
            padding: '20px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <History size={16} />
              Recent Activity
            </h3>

            {activities.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                No activity yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activities.slice(0, 5).map(activity => (
                  <div key={activity.id} style={{ fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-primary)' }}>{activity.subject}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      {activity.creator?.name} - {formatDate(activity.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div style={{
            padding: '20px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '12px'
            }}>
              Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Created</span>
                <span style={{ color: 'var(--text-secondary)' }}>{formatDate(quote.created_at)}</span>
              </div>
              {quote.sent_at && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Sent</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{formatDate(quote.sent_at)}</span>
                </div>
              )}
              {quote.won_date && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Won</span>
                  <span style={{ color: '#22c55e' }}>{formatDate(quote.won_date)}</span>
                </div>
              )}
              {quote.lost_date && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Lost</span>
                  <span style={{ color: '#ef4444' }}>{formatDate(quote.lost_date)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Version</span>
                <span style={{ color: 'var(--text-secondary)' }}>{quote.version || 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lost Reason Modal */}
      {showLostModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowLostModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              border: '1px solid var(--border-color)'
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)' }}>Mark as Lost</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Reason *
              </label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Select reason</option>
                {LOST_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {lostReason === 'competitor' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Competitor Name
                </label>
                <input
                  type="text"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLostModal(false)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkLost}
                disabled={updating || !lostReason}
                style={{
                  padding: '10px 16px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: updating || !lostReason ? 'not-allowed' : 'pointer',
                  opacity: updating || !lostReason ? 0.7 : 1
                }}
              >
                {updating ? 'Saving...' : 'Mark as Lost'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default QuoteDetail;
