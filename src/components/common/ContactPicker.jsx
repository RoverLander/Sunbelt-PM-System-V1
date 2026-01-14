// ============================================================================
// ContactPicker.jsx - Reusable Contact Selection Component
// ============================================================================
// A searchable dropdown component for selecting contacts from the directory.
// Features:
// - Type-ahead search by name, email, or position
// - Filter by factory (defaults to project's factory)
// - Filter by department
// - Shows contact details (position, department, factory)
// - Department color coding
// - Keyboard navigation support
//
// Usage:
//   <ContactPicker
//     value={assigneeId}
//     onChange={(contact) => setAssignee(contact)}
//     projectFactory="NWBS"
//     placeholder="Select assignee..."
//   />
//
// Created: January 14, 2026
// ============================================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  ChevronDown,
  X,
  User,
  Building2,
  Briefcase,
  Check,
  Loader2
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// CONSTANTS - Match DirectoryPage
// ============================================================================
const DEPARTMENT_LABELS = {
  'EXECUTIVE': 'Executive',
  'ACCOUNTING': 'Accounting',
  'HR': 'Human Resources',
  'MARKETING': 'Marketing',
  'SALES': 'Sales',
  'OPERATIONS': 'Operations',
  'PRODUCTION': 'Production',
  'PURCHASING': 'Purchasing',
  'ENGINEERING': 'Engineering',
  'DRAFTING': 'Drafting',
  'QUALITY': 'Quality',
  'SAFETY': 'Safety',
  'IT': 'Information Technology',
  'SERVICE': 'Service & Warranty'
};

const DEPARTMENT_COLORS = {
  'EXECUTIVE': '#8b5cf6',
  'ACCOUNTING': '#06b6d4',
  'HR': '#ec4899',
  'MARKETING': '#f59e0b',
  'SALES': '#10b981',
  'OPERATIONS': '#3b82f6',
  'PRODUCTION': '#6366f1',
  'PURCHASING': '#14b8a6',
  'ENGINEERING': '#f97316',
  'DRAFTING': '#a855f7',
  'QUALITY': '#22c55e',
  'SAFETY': '#ef4444',
  'IT': '#0ea5e9',
  'SERVICE': '#84cc16'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ContactPicker({
  value,              // Selected contact ID or contact object
  onChange,           // Callback when contact is selected: (contact) => void
  projectFactory,     // Factory code to prioritize in results (e.g., 'NWBS')
  placeholder = 'Select contact...',
  disabled = false,
  className = '',
  suggestedDepartments = [], // Array of department codes to show first
  allowClear = true,
  showExternal = false, // Show option to enter external contact
  onExternalSelect,   // Callback when external option is selected
  label,              // Optional label above the picker
  required = false,
  error = null        // Error message to display
}) {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState([]);
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, factoriesRes] = await Promise.all([
        supabase
          .from('directory_contacts')
          .select('*')
          .eq('is_active', true)
          .order('last_name', { ascending: true }),
        supabase
          .from('factories')
          .select('code, short_name, full_name')
          .eq('is_active', true)
          .order('short_name', { ascending: true })
      ]);

      setContacts(contactsRes.data || []);
      setFactories(factoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // RESOLVE INITIAL VALUE
  // ==========================================================================
  useEffect(() => {
    if (value && contacts.length > 0) {
      // If value is an ID, find the contact
      if (typeof value === 'string') {
        const found = contacts.find(c => c.id === value);
        setSelectedContact(found || null);
      } else if (typeof value === 'object' && value.id) {
        // Value is already a contact object
        setSelectedContact(value);
      }
    } else if (!value) {
      setSelectedContact(null);
    }
  }, [value, contacts]);

  // ==========================================================================
  // FILTERED & SORTED CONTACTS
  // ==========================================================================
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.full_name?.toLowerCase().includes(search) ||
        contact.first_name?.toLowerCase().includes(search) ||
        contact.last_name?.toLowerCase().includes(search) ||
        contact.email?.toLowerCase().includes(search) ||
        contact.position?.toLowerCase().includes(search)
      );
    }

    // Sort: Project factory first, then suggested departments, then alphabetically
    return [...filtered].sort((a, b) => {
      // Project factory contacts first
      const aIsProjectFactory = a.factory_code === projectFactory;
      const bIsProjectFactory = b.factory_code === projectFactory;
      if (aIsProjectFactory && !bIsProjectFactory) return -1;
      if (!aIsProjectFactory && bIsProjectFactory) return 1;

      // Suggested departments next
      if (suggestedDepartments.length > 0) {
        const aInSuggested = suggestedDepartments.includes(a.department_code);
        const bInSuggested = suggestedDepartments.includes(b.department_code);
        if (aInSuggested && !bInSuggested) return -1;
        if (!aInSuggested && bInSuggested) return 1;
      }

      // Then alphabetically by last name
      return (a.last_name || '').localeCompare(b.last_name || '');
    });
  }, [contacts, searchTerm, projectFactory, suggestedDepartments]);

  // Group contacts by factory for display
  const groupedContacts = useMemo(() => {
    const groups = {};

    // First add project factory group if exists
    if (projectFactory) {
      groups[projectFactory] = [];
    }

    // Group all filtered contacts
    filteredContacts.forEach(contact => {
      const factoryCode = contact.factory_code || 'OTHER';
      if (!groups[factoryCode]) {
        groups[factoryCode] = [];
      }
      groups[factoryCode].push(contact);
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [filteredContacts, projectFactory]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const items = [];
    Object.keys(groupedContacts).forEach(factoryCode => {
      groupedContacts[factoryCode].forEach(contact => {
        items.push({ type: 'contact', contact, factoryCode });
      });
    });
    if (showExternal) {
      items.push({ type: 'external' });
    }
    return items;
  }, [groupedContacts, showExternal]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getFactoryName = (code) => {
    const factory = factories.find(f => f.code === code);
    return factory?.short_name || factory?.full_name || code;
  };

  const getDeptColor = (code) => DEPARTMENT_COLORS[code] || '#6b7280';

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================
  const handleSelect = (contact) => {
    setSelectedContact(contact);
    setIsOpen(false);
    setSearchTerm('');
    onChange?.(contact);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedContact(null);
    onChange?.(null);
  };

  const handleExternalSelect = () => {
    setIsOpen(false);
    setSearchTerm('');
    onExternalSelect?.();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          Math.min(prev + 1, flatList.length - 1)
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const item = flatList[highlightedIndex];
        if (item?.type === 'contact') {
          handleSelect(item.contact);
        } else if (item?.type === 'external') {
          handleExternalSelect();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.querySelector('[data-highlighted="true"]');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // ==========================================================================
  // RENDER: CONTACT ITEM
  // ==========================================================================
  const renderContactItem = (contact, index, isHighlighted) => {
    const deptColor = getDeptColor(contact.department_code);
    const isSelected = selectedContact?.id === contact.id;

    return (
      <div
        key={contact.id}
        data-highlighted={isHighlighted}
        onClick={() => handleSelect(contact)}
        style={{
          padding: '10px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: isHighlighted ? 'var(--bg-tertiary)' : 'transparent',
          borderLeft: isSelected ? '3px solid var(--sunbelt-orange)' : '3px solid transparent'
        }}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        {/* Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${deptColor}, ${deptColor}99)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600',
          fontSize: '0.75rem',
          flexShrink: 0
        }}>
          {contact.first_name?.[0]}{contact.last_name?.[0]}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: '500',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {contact.full_name}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {contact.position}
          </div>
        </div>

        {/* Department badge */}
        {contact.department_code && (
          <span style={{
            padding: '2px 6px',
            background: `${deptColor}20`,
            color: deptColor,
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.625rem',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            {DEPARTMENT_LABELS[contact.department_code]?.split(' ')[0] || contact.department_code}
          </span>
        )}

        {/* Selected check */}
        {isSelected && (
          <Check size={16} style={{ color: 'var(--sunbelt-orange)', flexShrink: 0 }} />
        )}
      </div>
    );
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  return (
    <div className={className} style={{ position: 'relative' }} ref={containerRef}>
      {/* Label */}
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-secondary)'
        }}>
          {label}
          {required && <span style={{ color: 'var(--error)', marginLeft: '4px' }}>*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: disabled ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
          border: `1px solid ${error ? 'var(--error)' : isOpen ? 'var(--sunbelt-orange)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textAlign: 'left',
          transition: 'border-color 0.15s',
          opacity: disabled ? 0.6 : 1
        }}
      >
        {selectedContact ? (
          <>
            {/* Selected contact display */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${getDeptColor(selectedContact.department_code)}, ${getDeptColor(selectedContact.department_code)}99)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.6875rem',
              flexShrink: 0
            }}>
              {selectedContact.first_name?.[0]}{selectedContact.last_name?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: '500',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {selectedContact.full_name}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {selectedContact.position} - {getFactoryName(selectedContact.factory_code)}
              </div>
            </div>
            {allowClear && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </>
        ) : (
          <>
            {/* Placeholder */}
            <User size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              {placeholder}
            </span>
          </>
        )}
        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-tertiary)',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.15s'
          }}
        />
      </button>

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: '4px',
          fontSize: '0.75rem',
          color: 'var(--error)'
        }}>
          {error}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Search input */}
          <div style={{
            padding: '8px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)'
                }}
              />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by name, email, position..."
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 36px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Contact list */}
          <div
            ref={listRef}
            style={{
              overflow: 'auto',
              flex: 1
            }}
          >
            {loading ? (
              <div style={{
                padding: 'var(--space-lg)',
                textAlign: 'center',
                color: 'var(--text-tertiary)'
              }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                Loading contacts...
              </div>
            ) : flatList.length === 0 ? (
              <div style={{
                padding: 'var(--space-lg)',
                textAlign: 'center',
                color: 'var(--text-tertiary)'
              }}>
                <User size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                No contacts found
              </div>
            ) : (
              <>
                {/* Grouped by factory */}
                {Object.keys(groupedContacts).map((factoryCode, groupIndex) => {
                  const factoryContacts = groupedContacts[factoryCode];
                  const isProjectFactory = factoryCode === projectFactory;

                  // Calculate base index for this group
                  let baseIndex = 0;
                  Object.keys(groupedContacts).slice(0, groupIndex).forEach(key => {
                    baseIndex += groupedContacts[key].length;
                  });

                  return (
                    <div key={factoryCode}>
                      {/* Factory header */}
                      <div style={{
                        padding: '8px 12px',
                        background: 'var(--bg-tertiary)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        position: 'sticky',
                        top: 0,
                        borderBottom: '1px solid var(--border-color)'
                      }}>
                        <Building2 size={14} style={{ color: isProjectFactory ? 'var(--sunbelt-orange)' : 'var(--text-tertiary)' }} />
                        {getFactoryName(factoryCode)}
                        {isProjectFactory && (
                          <span style={{
                            padding: '2px 6px',
                            background: 'var(--sunbelt-orange)',
                            color: 'white',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.625rem'
                          }}>
                            Project Factory
                          </span>
                        )}
                        <span style={{
                          marginLeft: 'auto',
                          color: 'var(--text-tertiary)',
                          fontWeight: '500'
                        }}>
                          {factoryContacts.length}
                        </span>
                      </div>

                      {/* Contacts in this factory */}
                      {factoryContacts.map((contact, contactIndex) => {
                        const globalIndex = baseIndex + contactIndex;
                        return renderContactItem(
                          contact,
                          globalIndex,
                          highlightedIndex === globalIndex
                        );
                      })}
                    </div>
                  );
                })}

                {/* External option */}
                {showExternal && (
                  <div
                    onClick={handleExternalSelect}
                    data-highlighted={highlightedIndex === flatList.length - 1}
                    style={{
                      padding: '12px',
                      borderTop: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: highlightedIndex === flatList.length - 1 ? 'var(--bg-tertiary)' : 'transparent'
                    }}
                    onMouseEnter={() => setHighlightedIndex(flatList.length - 1)}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      border: '2px dashed var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <User size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div>
                      <div style={{
                        fontWeight: '500',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem'
                      }}>
                        External Contact
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)'
                      }}>
                        Enter name and email manually
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactPicker;
