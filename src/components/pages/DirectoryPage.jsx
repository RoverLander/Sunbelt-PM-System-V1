// ============================================================================
// DirectoryPage.jsx - Company Directory
// ============================================================================
// Full-page company directory showing all internal Sunbelt employees.
// Features:
// - Search by name, email, or position
// - Filter by factory
// - Filter by department
// - Click contact to view details
// - Cards grouped by factory with contact count
//
// Created: January 14, 2026
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  Building2,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  X,
  Filter,
  Briefcase,
  MapPin,
  User,
  Factory
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// CONSTANTS
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
function DirectoryPage() {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [factories, setFactories] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFactory, setSelectedFactory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);
  const [expandedFactories, setExpandedFactories] = useState(new Set());
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'list'

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, factoriesRes, departmentsRes] = await Promise.all([
        supabase
          .from('directory_contacts')
          .select('*')
          .eq('is_active', true)
          .order('last_name', { ascending: true }),
        supabase
          .from('factories')
          .select('code, short_name, full_name, city, state, phone, email_domain')
          .eq('is_active', true)
          .order('short_name', { ascending: true }),
        supabase
          .from('departments')
          .select('code, name, description')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      ]);

      setContacts(contactsRes.data || []);
      setFactories(factoriesRes.data || []);
      setDepartments(departmentsRes.data || []);

      // Expand all factories by default
      if (factoriesRes.data) {
        setExpandedFactories(new Set(factoriesRes.data.map(f => f.code)));
      }
    } catch (error) {
      console.error('Error fetching directory data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FILTERED CONTACTS
  // ==========================================================================
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          contact.full_name?.toLowerCase().includes(search) ||
          contact.first_name?.toLowerCase().includes(search) ||
          contact.last_name?.toLowerCase().includes(search) ||
          contact.email?.toLowerCase().includes(search) ||
          contact.position?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Factory filter
      if (selectedFactory !== 'all' && contact.factory_code !== selectedFactory) {
        return false;
      }

      // Department filter
      if (selectedDepartment !== 'all' && contact.department_code !== selectedDepartment) {
        return false;
      }

      return true;
    });
  }, [contacts, searchTerm, selectedFactory, selectedDepartment]);

  // ==========================================================================
  // GROUPED BY FACTORY
  // ==========================================================================
  const groupedContacts = useMemo(() => {
    const groups = {};

    filteredContacts.forEach(contact => {
      const factoryCode = contact.factory_code || 'UNASSIGNED';
      if (!groups[factoryCode]) {
        groups[factoryCode] = [];
      }
      groups[factoryCode].push(contact);
    });

    // Sort contacts within each group by last name
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
    });

    return groups;
  }, [filteredContacts]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getFactoryInfo = (code) => {
    return factories.find(f => f.code === code) || { short_name: code, full_name: code };
  };

  const getDepartmentColor = (code) => {
    return DEPARTMENT_COLORS[code] || '#6b7280';
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    return phone;
  };

  const toggleFactory = (factoryCode) => {
    setExpandedFactories(prev => {
      const next = new Set(prev);
      if (next.has(factoryCode)) {
        next.delete(factoryCode);
      } else {
        next.add(factoryCode);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedFactories(new Set(Object.keys(groupedContacts)));
  };

  const collapseAll = () => {
    setExpandedFactories(new Set());
  };

  // ==========================================================================
  // RENDER: CONTACT CARD
  // ==========================================================================
  const renderContactCard = (contact) => {
    const deptColor = getDepartmentColor(contact.department_code);

    return (
      <div
        key={contact.id}
        onClick={() => setSelectedContact(contact)}
        style={{
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          border: '1px solid var(--border-color)',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--sunbelt-orange)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* Avatar */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${deptColor}, ${deptColor}99)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.875rem',
            flexShrink: 0
          }}>
            {contact.first_name?.[0]}{contact.last_name?.[0]}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: '600',
              color: 'var(--text-primary)',
              fontSize: '0.9375rem',
              marginBottom: '2px'
            }}>
              {contact.full_name}
            </div>
            <div style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              marginBottom: '4px'
            }}>
              {contact.position}
            </div>
            {contact.department_code && (
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                background: `${deptColor}20`,
                color: deptColor,
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.6875rem',
                fontWeight: '500'
              }}>
                {DEPARTMENT_LABELS[contact.department_code] || contact.department_code}
              </span>
            )}
          </div>

          {/* Quick contact icons */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none'
                }}
                title={contact.email}
              >
                <Mail size={14} />
              </a>
            )}
            {(contact.phone_direct || contact.phone_cell || contact.phone_main) && (
              <a
                href={`tel:${contact.phone_direct || contact.phone_cell || contact.phone_main}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none'
                }}
                title={contact.phone_direct || contact.phone_cell || contact.phone_main}
              >
                <Phone size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // RENDER: CONTACT DETAIL MODAL
  // ==========================================================================
  const renderContactModal = () => {
    if (!selectedContact) return null;

    const contact = selectedContact;
    const factory = getFactoryInfo(contact.factory_code);
    const deptColor = getDepartmentColor(contact.department_code);

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--space-xl)'
        }}
        onClick={() => setSelectedContact(null)}
      >
        <div
          style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: 'var(--space-lg)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-md)'
          }}>
            {/* Avatar */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${deptColor}, ${deptColor}99)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '1.25rem',
              flexShrink: 0
            }}>
              {contact.first_name?.[0]}{contact.last_name?.[0]}
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {contact.full_name}
              </h2>
              <p style={{
                margin: '4px 0 8px',
                color: 'var(--text-secondary)',
                fontSize: '0.9375rem'
              }}>
                {contact.position}
              </p>
              {contact.department_code && (
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: `${deptColor}20`,
                  color: deptColor,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {DEPARTMENT_LABELS[contact.department_code] || contact.department_code}
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedContact(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--text-tertiary)'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Contact Info */}
          <div style={{ padding: 'var(--space-lg)' }}>
            {/* Factory */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: 'var(--space-md)',
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <Factory size={18} style={{ color: 'var(--sunbelt-orange)' }} />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {factory.short_name || factory.full_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {factory.city && factory.state ? `${factory.city}, ${factory.state}` : 'Factory'}
                </div>
              </div>
            </div>

            {/* Contact methods */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    transition: 'background 0.15s'
                  }}
                >
                  <Mail size={18} style={{ color: 'var(--info)' }} />
                  <span style={{ fontSize: '0.875rem' }}>{contact.email}</span>
                </a>
              )}

              {contact.phone_main && (
                <a
                  href={`tel:${contact.phone_main}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <Phone size={18} style={{ color: 'var(--success)' }} />
                  <div>
                    <span style={{ fontSize: '0.875rem' }}>{contact.phone_main}</span>
                    {contact.phone_extension && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                        ext. {contact.phone_extension}
                      </span>
                    )}
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Main</div>
                  </div>
                </a>
              )}

              {contact.phone_direct && (
                <a
                  href={`tel:${contact.phone_direct}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <Phone size={18} style={{ color: 'var(--warning)' }} />
                  <div>
                    <span style={{ fontSize: '0.875rem' }}>{contact.phone_direct}</span>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Direct</div>
                  </div>
                </a>
              )}

              {contact.phone_cell && (
                <a
                  href={`tel:${contact.phone_cell}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)'
                  }}
                >
                  <Phone size={18} style={{ color: '#8b5cf6' }} />
                  <div>
                    <span style={{ fontSize: '0.875rem' }}>{contact.phone_cell}</span>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Cell</div>
                  </div>
                </a>
              )}
            </div>

            {/* Notes */}
            {contact.notes && (
              <div style={{
                marginTop: 'var(--space-md)',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-tertiary)',
                  marginBottom: '4px'
                }}>
                  Notes
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {contact.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>
          Loading directory...
        </p>
      </div>
    );
  }

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={24} color="white" />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              Company Directory
            </h1>
            <p style={{
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '0.875rem'
            }}>
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
              {(selectedFactory !== 'all' || selectedDepartment !== 'all' || searchTerm) && ' (filtered)'}
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={expandAll}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{
          flex: '1 1 300px',
          position: 'relative'
        }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)'
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                padding: '4px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Factory filter */}
        <div style={{ position: 'relative' }}>
          <Factory
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none'
            }}
          />
          <select
            value={selectedFactory}
            onChange={(e) => setSelectedFactory(e.target.value)}
            style={{
              padding: '10px 36px 10px 40px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              appearance: 'none',
              minWidth: '180px'
            }}
          >
            <option value="all">All Factories</option>
            {factories.map(factory => (
              <option key={factory.code} value={factory.code}>
                {factory.short_name || factory.code}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Department filter */}
        <div style={{ position: 'relative' }}>
          <Briefcase
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none'
            }}
          />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              padding: '10px 36px 10px 40px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              appearance: 'none',
              minWidth: '200px'
            }}
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept.code} value={dept.code}>
                {dept.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Clear filters */}
        {(selectedFactory !== 'all' || selectedDepartment !== 'all' || searchTerm) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedFactory('all');
              setSelectedDepartment('all');
            }}
            style={{
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem'
            }}
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
      </div>

      {/* No results */}
      {filteredContacts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-xl)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <Users size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No contacts found</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Grouped contacts by factory */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {Object.keys(groupedContacts)
          .sort((a, b) => {
            const factoryA = getFactoryInfo(a);
            const factoryB = getFactoryInfo(b);
            return (factoryA.short_name || a).localeCompare(factoryB.short_name || b);
          })
          .map(factoryCode => {
            const factory = getFactoryInfo(factoryCode);
            const contactList = groupedContacts[factoryCode];
            const isExpanded = expandedFactories.has(factoryCode);

            return (
              <div
                key={factoryCode}
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden'
                }}
              >
                {/* Factory header */}
                <button
                  onClick={() => toggleFactory(factoryCode)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md) var(--space-lg)',
                    background: 'var(--bg-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                  )}

                  <Building2 size={20} style={{ color: 'var(--sunbelt-orange)' }} />

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}>
                      {factory.short_name || factory.full_name || factoryCode}
                    </div>
                    {factory.city && factory.state && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <MapPin size={12} />
                        {factory.city}, {factory.state}
                      </div>
                    )}
                  </div>

                  <div style={{
                    padding: '4px 12px',
                    background: 'var(--sunbelt-orange)',
                    color: 'white',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {contactList.length}
                  </div>
                </button>

                {/* Contacts grid */}
                {isExpanded && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-md)'
                  }}>
                    {contactList.map(contact => renderContactCard(contact))}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Contact detail modal */}
      {renderContactModal()}
    </div>
  );
}

export default DirectoryPage;
