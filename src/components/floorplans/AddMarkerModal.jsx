// ============================================================================
// AddMarkerModal Component
// ============================================================================
// Modal for selecting which RFI or Submittal to link to a floor plan location.
// Shows searchable list of items with status indicators.
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  MessageSquare,
  ClipboardList,
  Calendar,
  User,
  Check,
  MapPin,
  AlertCircle
} from 'lucide-react';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AddMarkerModal({ isOpen, onClose, rfis, submittals, existingMarkers, onSelect }) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [itemType, setItemType] = useState('rfi');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // ==========================================================================
  // GET EXISTING MARKER ITEM IDS
  // ==========================================================================
  const existingMarkerIds = useMemo(() => {
    return new Set((existingMarkers || []).map(m => m.item_id));
  }, [existingMarkers]);

  // ==========================================================================
  // FILTER ITEMS
  // ==========================================================================
  const items = itemType === 'rfi' ? rfis : submittals;

  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter(item => {
      const search = searchTerm.toLowerCase();
      
      if (itemType === 'rfi') {
        return (
          item.rfi_number?.toLowerCase().includes(search) ||
          item.subject?.toLowerCase().includes(search) ||
          item.sent_to?.toLowerCase().includes(search)
        );
      } else {
        return (
          item.submittal_number?.toLowerCase().includes(search) ||
          item.title?.toLowerCase().includes(search) ||
          item.sent_to?.toLowerCase().includes(search) ||
          item.submittal_type?.toLowerCase().includes(search)
        );
      }
    });
  }, [items, searchTerm, itemType]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleSelect = () => {
    if (!selectedItem) return;
    onSelect(itemType, selectedItem.id);
  };

  // ==========================================================================
  // STATUS COLORS
  // ==========================================================================
  const getStatusColor = (status) => {
    const colors = {
      'Open': '#3b82f6',
      'Pending': '#f59e0b',
      'Answered': '#22c55e',
      'Closed': '#64748b',
      'Submitted': '#3b82f6',
      'Under Review': '#f59e0b',
      'Approved': '#22c55e',
      'Approved as Noted': '#22c55e',
      'Revise & Resubmit': '#ef4444',
      'Rejected': '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  // ==========================================================================
  // FORMAT DATE
  // ==========================================================================
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // ==========================================================================
  // CHECK IF OVERDUE
  // ==========================================================================
  const isOverdue = (item) => {
    if (!item.due_date) return false;
    const closedStatuses = ['Closed', 'Approved', 'Approved as Noted', 'Answered'];
    return new Date(item.due_date) < new Date() && !closedStatuses.includes(item.status);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '550px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* ================================================================ */}
        {/* HEADER                                                          */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-xl)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <MapPin size={20} style={{ color: 'var(--sunbelt-orange)' }} />
              Add Marker
            </h2>
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              margin: '4px 0 0 0'
            }}>
              Select an RFI or Submittal to place on the floor plan
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
              borderRadius: '6px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* ================================================================ */}
        {/* TYPE TOGGLE                                                     */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-md) var(--space-xl)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '4px'
          }}>
            <button
              onClick={() => {
                setItemType('rfi');
                setSelectedItem(null);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-xs)',
                padding: '10px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: itemType === 'rfi' ? 'var(--bg-primary)' : 'transparent',
                color: itemType === 'rfi' ? '#3b82f6' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: itemType === 'rfi' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <MessageSquare size={16} />
              RFIs ({rfis?.length || 0})
            </button>
            <button
              onClick={() => {
                setItemType('submittal');
                setSelectedItem(null);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-xs)',
                padding: '10px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: itemType === 'submittal' ? 'var(--bg-primary)' : 'transparent',
                color: itemType === 'submittal' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: itemType === 'submittal' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <ClipboardList size={16} />
              Submittals ({submittals?.length || 0})
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SEARCH                                                          */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-md) var(--space-xl)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)'
            }} />
            <input
              type="text"
              placeholder={`Search ${itemType === 'rfi' ? 'RFIs' : 'Submittals'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/* ITEMS LIST                                                      */}
        {/* ================================================================ */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-md) var(--space-xl)'
        }}>
          {filteredItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-xl)',
              color: 'var(--text-secondary)'
            }}>
              {searchTerm ? (
                <p>No {itemType === 'rfi' ? 'RFIs' : 'Submittals'} match your search</p>
              ) : (
                <p>No {itemType === 'rfi' ? 'RFIs' : 'Submittals'} available</p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {filteredItems.map(item => {
                const isSelected = selectedItem?.id === item.id;
                const hasExistingMarker = existingMarkerIds.has(item.id);
                const itemIsOverdue = isOverdue(item);
                const statusColor = getStatusColor(item.status);

                return (
                  <div
                    key={item.id}
                    onClick={() => !hasExistingMarker && setSelectedItem(item)}
                    style={{
                      padding: 'var(--space-md)',
                      background: isSelected 
                        ? 'rgba(255, 107, 53, 0.1)' 
                        : hasExistingMarker 
                          ? 'var(--bg-tertiary)' 
                          : 'var(--bg-secondary)',
                      border: `2px solid ${isSelected ? 'var(--sunbelt-orange)' : 'transparent'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: hasExistingMarker ? 'not-allowed' : 'pointer',
                      opacity: hasExistingMarker ? 0.6 : 1,
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 'var(--space-xs)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        {isSelected && (
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'var(--sunbelt-orange)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Check size={12} color="white" />
                          </div>
                        )}
                        <span style={{
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)'
                        }}>
                          {itemType === 'rfi' ? item.rfi_number : item.submittal_number}
                        </span>
                        {hasExistingMarker && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            background: 'var(--bg-primary)',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            color: 'var(--text-tertiary)'
                          }}>
                            <MapPin size={10} />
                            Already on plan
                          </span>
                        )}
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.6875rem',
                        fontWeight: '600',
                        background: `${statusColor}20`,
                        color: statusColor
                      }}>
                        {item.status}
                      </span>
                    </div>

                    <h4 style={{
                      fontSize: '0.8125rem',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      margin: '0 0 var(--space-xs) 0'
                    }}>
                      {itemType === 'rfi' ? item.subject : item.title}
                    </h4>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {item.sent_to && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          {item.sent_to}
                        </span>
                      )}
                      {item.due_date && (
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          color: itemIsOverdue ? '#ef4444' : 'var(--text-secondary)'
                        }}>
                          <Calendar size={12} />
                          {formatDate(item.due_date)}
                          {itemIsOverdue && (
                            <AlertCircle size={12} style={{ marginLeft: '2px' }} />
                          )}
                        </span>
                      )}
                      {itemType === 'submittal' && item.submittal_type && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ClipboardList size={12} />
                          {item.submittal_type}
                        </span>
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
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            {selectedItem ? (
              <span>
                Selected: <strong style={{ color: 'var(--text-primary)' }}>
                  {itemType === 'rfi' ? selectedItem.rfi_number : selectedItem.submittal_number}
                </strong>
              </span>
            ) : (
              'Select an item to place on the floor plan'
            )}
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedItem}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '10px 20px',
                background: selectedItem 
                  ? 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))'
                  : 'var(--bg-tertiary)',
                color: selectedItem ? 'white' : 'var(--text-tertiary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: selectedItem ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: '0.9375rem'
              }}
            >
              <MapPin size={16} />
              Add Marker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddMarkerModal;