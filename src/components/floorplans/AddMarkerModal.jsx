// ============================================================================
// AddMarkerModal.jsx
// ============================================================================
// Modal for linking floor plan markers to RFIs, Submittals, or Tasks.
// Supports both selecting existing items AND creating new ones directly.
//
// FEATURES:
// - Two modes: "Select Existing" or "Create New"
// - Create RFIs, Submittals, or Tasks directly from floor plan
// - Auto-generates item numbers (e.g., NWBS-25001-RFI-001)
// - Factory contacts available in recipient dropdowns
//
// DEPENDENCIES:
// - useContacts hook: Fetches both users (PMs) and factory contacts
// - supabaseClient: Database operations
//
// PROPS:
// - isOpen: Boolean to control modal visibility
// - onClose: Function called when modal closes
// - rfis: Array of existing RFIs for selection
// - submittals: Array of existing submittals for selection
// - tasks: Array of existing tasks for selection
// - existingMarkers: Array of markers already on this floor plan
// - onSelect: Callback when item is selected (itemType, itemId, newItem?)
// - projectId: UUID of the parent project
// - projectNumber: Project number for item numbering
// - showToast: Function for toast notifications
// - onDataRefresh: Function to refresh parent data after creation
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  MessageSquare,
  ClipboardList,
  CheckSquare,
  Calendar,
  User,
  Check,
  MapPin,
  AlertCircle,
  Plus,
  Flag
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../hooks/useContacts';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function AddMarkerModal({ 
  isOpen, 
  onClose, 
  rfis, 
  submittals, 
  tasks,
  existingMarkers, 
  onSelect,
  projectId,
  projectNumber,
  showToast,
  onDataRefresh
}) {
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  const { user } = useAuth();
  const { contacts } = useContacts(isOpen); // Fetch users + factory contacts
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [mode, setMode] = useState('select');
  const [itemType, setItemType] = useState('rfi');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [creating, setCreating] = useState(false);
  const [nextRFINumber, setNextRFINumber] = useState('');
  const [nextSubmittalNumber, setNextSubmittalNumber] = useState('');

  // RFI Form State
  const [rfiData, setRfiData] = useState({
    subject: '',
    question: '',
    sent_to: '',
    sent_to_email: '',
    priority: 'Medium',
    due_date: '',
    spec_section: '',
    drawing_reference: ''
  });

  // Submittal Form State
  const [submittalData, setSubmittalData] = useState({
    title: '',
    description: '',
    submittal_type: 'Shop Drawings',
    spec_section: '',
    sent_to: '',
    sent_to_email: '',
    due_date: ''
  });

  // Task Form State
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'Medium'
  });

  // ==========================================================================
  // GENERATE NEXT NUMBERS
  // ==========================================================================
  useEffect(() => {
    if (isOpen && projectId && projectNumber) {
      generateNextNumbers();
    }
  }, [isOpen, projectId, projectNumber]);

  const generateNextNumbers = async () => {
    try {
      // Get next RFI number
      const { count: rfiCount } = await supabase
        .from('rfis')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      const rfiNum = (rfiCount || 0) + 1;
      setNextRFINumber(`${projectNumber}-RFI-${String(rfiNum).padStart(3, '0')}`);

      // Get next Submittal number
      const { count: subCount } = await supabase
        .from('submittals')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      const subNum = (subCount || 0) + 1;
      setNextSubmittalNumber(`${projectNumber}-SUB-${String(subNum).padStart(3, '0')}`);
    } catch (err) {
      console.error('Error generating numbers:', err);
      setNextRFINumber(`${projectNumber}-RFI-001`);
      setNextSubmittalNumber(`${projectNumber}-SUB-001`);
    }
  };

  // ==========================================================================
  // GET EXISTING MARKER ITEM IDS
  // ==========================================================================
  const existingMarkerIds = useMemo(() => {
    return new Set((existingMarkers || []).map(m => m.item_id));
  }, [existingMarkers]);

  // ==========================================================================
  // FILTER ITEMS
  // ==========================================================================
  const getItems = () => {
    if (itemType === 'rfi') return rfis || [];
    if (itemType === 'submittal') return submittals || [];
    if (itemType === 'task') return tasks || [];
    return [];
  };

  const filteredItems = useMemo(() => {
    const items = getItems();
    if (!items.length) return [];

    return items.filter(item => {
      const search = searchTerm.toLowerCase();
      
      if (itemType === 'rfi') {
        return (
          item.rfi_number?.toLowerCase().includes(search) ||
          item.subject?.toLowerCase().includes(search) ||
          item.sent_to?.toLowerCase().includes(search)
        );
      } else if (itemType === 'submittal') {
        return (
          item.submittal_number?.toLowerCase().includes(search) ||
          item.title?.toLowerCase().includes(search) ||
          item.sent_to?.toLowerCase().includes(search)
        );
      } else {
        return (
          item.title?.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search)
        );
      }
    });
  }, [rfis, submittals, tasks, searchTerm, itemType]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleSelect = () => {
    if (!selectedItem) return;
    onSelect(itemType, selectedItem.id);
  };

  const handleCreateAndSelect = async () => {
    if (creating) return;
    setCreating(true);

    try {
      let newItem = null;

      if (itemType === 'rfi') {
        if (!rfiData.subject.trim()) {
          showToast?.('Subject is required', 'error');
          setCreating(false);
          return;
        }

        const { data, error } = await supabase
          .from('rfis')
          .insert([{
            project_id: projectId,
            rfi_number: nextRFINumber,
            subject: rfiData.subject.trim(),
            question: rfiData.question.trim() || null,
            sent_to: rfiData.sent_to.trim() || null,
            sent_to_email: rfiData.sent_to_email.trim() || null,
            is_external: !!rfiData.sent_to_email,
            priority: rfiData.priority,
            due_date: rfiData.due_date || null,
            spec_section: rfiData.spec_section.trim() || null,
            drawing_reference: rfiData.drawing_reference.trim() || null,
            status: 'Open',
            date_sent: new Date().toISOString().split('T')[0],
            created_by: user?.id
          }])
          .select()
          .single();

        if (error) throw error;
        newItem = data;
        showToast?.(`Created ${nextRFINumber}`, 'success');

      } else if (itemType === 'submittal') {
        if (!submittalData.title.trim()) {
          showToast?.('Title is required', 'error');
          setCreating(false);
          return;
        }

        const { data, error } = await supabase
          .from('submittals')
          .insert([{
            project_id: projectId,
            submittal_number: nextSubmittalNumber,
            title: submittalData.title.trim(),
            description: submittalData.description.trim() || null,
            submittal_type: submittalData.submittal_type,
            spec_section: submittalData.spec_section.trim() || null,
            sent_to: submittalData.sent_to.trim() || null,
            sent_to_email: submittalData.sent_to_email.trim() || null,
            is_external: !!submittalData.sent_to_email,
            due_date: submittalData.due_date || null,
            status: 'Pending',
            date_submitted: new Date().toISOString().split('T')[0],
            created_by: user?.id
          }])
          .select()
          .single();

        if (error) throw error;
        newItem = data;
        showToast?.(`Created ${nextSubmittalNumber}`, 'success');

      } else if (itemType === 'task') {
        if (!taskData.title.trim()) {
          showToast?.('Title is required', 'error');
          setCreating(false);
          return;
        }

        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            project_id: projectId,
            title: taskData.title.trim(),
            description: taskData.description.trim() || null,
            due_date: taskData.due_date || null,
            priority: taskData.priority,
            status: 'Not Started',
            created_by: user?.id
          }])
          .select()
          .single();

        if (error) throw error;
        newItem = data;
        showToast?.('Task created', 'success');
      }

      if (newItem) {
        // Refresh the parent data so the new item shows in lists
        onDataRefresh?.();
        // Create the marker
        onSelect(itemType, newItem.id, newItem);
      }

    } catch (err) {
      console.error('Error creating item:', err);
      showToast?.(err.message || 'Failed to create item', 'error');
    } finally {
      setCreating(false);
    }
  };

  const isCreateFormValid = () => {
    if (itemType === 'rfi') return rfiData.subject.trim().length > 0;
    if (itemType === 'submittal') return submittalData.title.trim().length > 0;
    if (itemType === 'task') return taskData.title.trim().length > 0;
    return false;
  };

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getStatusColor = (status) => {
    const colors = {
      'Open': '#3b82f6', 'Pending': '#f59e0b', 'Answered': '#22c55e', 'Closed': '#64748b',
      'Submitted': '#3b82f6', 'Under Review': '#f59e0b', 'Approved': '#22c55e',
      'Approved as Noted': '#22c55e', 'Revise & Resubmit': '#ef4444', 'Rejected': '#ef4444',
      'Not Started': '#64748b', 'In Progress': '#3b82f6', 'On Hold': '#f59e0b', 'Completed': '#22c55e'
    };
    return colors[status] || '#64748b';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (item) => {
    if (!item.due_date) return false;
    const closedStatuses = ['Closed', 'Approved', 'Approved as Noted', 'Answered', 'Completed'];
    return new Date(item.due_date) < new Date() && !closedStatuses.includes(item.status);
  };

  const getPriorityColor = (priority) => {
    const colors = { 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#22c55e' };
    return colors[priority] || '#64748b';
  };

  // ==========================================================================
  // STYLES
  // ==========================================================================
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px'
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
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '650px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* ================================================================ */}
        {/* HEADER                                                          */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-lg) var(--space-xl)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0,
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'
            }}>
              <MapPin size={20} style={{ color: 'var(--sunbelt-orange)' }} />
              Add Marker
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {mode === 'select' ? 'Select existing or create new' : (
                itemType === 'rfi' ? `Creating: ${nextRFINumber}` :
                itemType === 'submittal' ? `Creating: ${nextSubmittalNumber}` :
                'Create new Task'
              )}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}>
            <X size={24} />
          </button>
        </div>

        {/* ================================================================ */}
        {/* MODE TOGGLE                                                     */}
        {/* ================================================================ */}
        <div style={{ padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            onClick={() => setMode('select')}
            style={{
              flex: 1, padding: '10px',
              background: mode === 'select' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)',
              border: `2px solid ${mode === 'select' ? 'var(--sunbelt-orange)' : 'transparent'}`,
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              color: mode === 'select' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              fontWeight: '600', fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Search size={16} />
            Select Existing
          </button>
          <button
            onClick={() => setMode('create')}
            style={{
              flex: 1, padding: '10px',
              background: mode === 'create' ? 'rgba(255, 107, 53, 0.1)' : 'var(--bg-secondary)',
              border: `2px solid ${mode === 'create' ? 'var(--sunbelt-orange)' : 'transparent'}`,
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              color: mode === 'create' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              fontWeight: '600', fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Plus size={16} />
            Create New
          </button>
        </div>

        {/* ================================================================ */}
        {/* TYPE TOGGLE                                                     */}
        {/* ================================================================ */}
        <div style={{ padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
            {[
              { key: 'rfi', label: 'RFI', icon: MessageSquare, color: '#3b82f6' },
              { key: 'submittal', label: 'Submittal', icon: ClipboardList, color: '#8b5cf6' },
              { key: 'task', label: 'Task', icon: CheckSquare, color: '#22c55e' }
            ].map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => { setItemType(key); setSelectedItem(null); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '8px 12px',
                  background: itemType === key ? 'var(--bg-primary)' : 'transparent',
                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  color: itemType === key ? color : 'var(--text-secondary)',
                  fontWeight: itemType === key ? '600' : '500', fontSize: '0.875rem'
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/* SELECT MODE                                                     */}
        {/* ================================================================ */}
        {mode === 'select' && (
          <>
            <div style={{ padding: 'var(--space-md) var(--space-xl)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder={`Search ${itemType}s...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '0 var(--space-xl) var(--space-md)' }}>
              {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                  {searchTerm ? (
                    <p>No {itemType}s match your search</p>
                  ) : (
                    <div>
                      <p style={{ marginBottom: 'var(--space-md)' }}>No {itemType}s available</p>
                      <button
                        onClick={() => setMode('create')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', background: 'var(--sunbelt-orange)', color: 'white',
                          border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                          fontWeight: '600', fontSize: '0.875rem'
                        }}
                      >
                        <Plus size={16} />
                        Create New {itemType.toUpperCase()}
                      </button>
                    </div>
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
                          background: isSelected ? 'rgba(255, 107, 53, 0.1)' : hasExistingMarker ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                          border: `2px solid ${isSelected ? 'var(--sunbelt-orange)' : 'transparent'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: hasExistingMarker ? 'not-allowed' : 'pointer',
                          opacity: hasExistingMarker ? 0.6 : 1
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xs)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            {isSelected && (
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--sunbelt-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={12} color="white" />
                              </div>
                            )}
                            <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                              {itemType === 'rfi' ? item.rfi_number : itemType === 'submittal' ? item.submittal_number : item.title}
                            </span>
                            {hasExistingMarker && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                                <MapPin size={10} />
                                Already placed
                              </span>
                            )}
                          </div>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.6875rem', fontWeight: '600', background: `${statusColor}20`, color: statusColor }}>
                            {item.status}
                          </span>
                        </div>

                        {itemType !== 'task' && (
                          <h4 style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-primary)', margin: '0 0 var(--space-xs) 0' }}>
                            {itemType === 'rfi' ? item.subject : item.title}
                          </h4>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.sent_to && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} />
                              {item.sent_to}
                            </span>
                          )}
                          {item.due_date && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: itemIsOverdue ? '#ef4444' : 'var(--text-secondary)' }}>
                              <Calendar size={12} />
                              {formatDate(item.due_date)}
                              {itemIsOverdue && <AlertCircle size={12} />}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/* CREATE MODE - RFI FORM                                          */}
        {/* ================================================================ */}
        {mode === 'create' && itemType === 'rfi' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-lg) var(--space-xl)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Subject */}
              <div>
                <label style={labelStyle}>Subject *</label>
                <input
                  type="text"
                  value={rfiData.subject}
                  onChange={(e) => setRfiData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of the RFI"
                  style={inputStyle}
                />
              </div>

              {/* Question */}
              <div>
                <label style={labelStyle}>Question / Details</label>
                <textarea
                  value={rfiData.question}
                  onChange={(e) => setRfiData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Detailed question or request for information"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Sent To Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label style={labelStyle}>Sent To (Name)</label>
                  <input
                    type="text"
                    value={rfiData.sent_to}
                    onChange={(e) => setRfiData(prev => ({ ...prev, sent_to: e.target.value }))}
                    placeholder="Recipient name"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email (if external)</label>
                  <input
                    type="email"
                    value={rfiData.sent_to_email}
                    onChange={(e) => setRfiData(prev => ({ ...prev, sent_to_email: e.target.value }))}
                    placeholder="recipient@company.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Priority & Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select
                    value={rfiData.priority}
                    onChange={(e) => setRfiData(prev => ({ ...prev, priority: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input
                    type="date"
                    value={rfiData.due_date}
                    onChange={(e) => setRfiData(prev => ({ ...prev, due_date: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Spec & Drawing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label style={labelStyle}>Spec Section</label>
                  <input
                    type="text"
                    value={rfiData.spec_section}
                    onChange={(e) => setRfiData(prev => ({ ...prev, spec_section: e.target.value }))}
                    placeholder="e.g., 03 30 00"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Drawing Reference</label>
                  <input
                    type="text"
                    value={rfiData.drawing_reference}
                    onChange={(e) => setRfiData(prev => ({ ...prev, drawing_reference: e.target.value }))}
                    placeholder="e.g., A-101"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* CREATE MODE - SUBMITTAL FORM                                    */}
        {/* ================================================================ */}
        {mode === 'create' && itemType === 'submittal' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-lg) var(--space-xl)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  type="text"
                  value={submittalData.title}
                  onChange={(e) => setSubmittalData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Submittal title"
                  style={inputStyle}
                />
              </div>

              {/* Type & Spec Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label style={labelStyle}>Submittal Type</label>
                  <select
                    value={submittalData.submittal_type}
                    onChange={(e) => setSubmittalData(prev => ({ ...prev, submittal_type: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="Shop Drawings">Shop Drawings</option>
                    <option value="Product Data">Product Data</option>
                    <option value="Samples">Samples</option>
                    <option value="Mock-ups">Mock-ups</option>
                    <option value="Certifications">Certifications</option>
                    <option value="Test Reports">Test Reports</option>
                    <option value="Warranty">Warranty</option>
                    <option value="O&M Manuals">O&M Manuals</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Spec Section</label>
                  <input
                    type="text"
                    value={submittalData.spec_section}
                    onChange={(e) => setSubmittalData(prev => ({ ...prev, spec_section: e.target.value }))}
                    placeholder="e.g., 08 71 00"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={submittalData.description}
                  onChange={(e) => setSubmittalData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Sent To Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label style={labelStyle}>Sent To (Name)</label>
                  <input
                    type="text"
                    value={submittalData.sent_to}
                    onChange={(e) => setSubmittalData(prev => ({ ...prev, sent_to: e.target.value }))}
                    placeholder="Recipient name"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email (if external)</label>
                  <input
                    type="email"
                    value={submittalData.sent_to_email}
                    onChange={(e) => setSubmittalData(prev => ({ ...prev, sent_to_email: e.target.value }))}
                    placeholder="recipient@company.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Due Date */}
              <div style={{ width: '50%' }}>
                <label style={labelStyle}>Due Date</label>
                <input
                  type="date"
                  value={submittalData.due_date}
                  onChange={(e) => setSubmittalData(prev => ({ ...prev, due_date: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* CREATE MODE - TASK FORM                                         */}
        {/* ================================================================ */}
        {mode === 'create' && itemType === 'task' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-lg) var(--space-xl)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Task Title *</label>
                <input
                  type="text"
                  value={taskData.title}
                  onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What needs to be done?"
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={taskData.description}
                  onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Priority & Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select
                    value={taskData.priority}
                    onChange={(e) => setTaskData(prev => ({ ...prev, priority: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input
                    type="date"
                    value={taskData.due_date}
                    onChange={(e) => setTaskData(prev => ({ ...prev, due_date: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
            {mode === 'select' ? (
              selectedItem ? (
                <span>Selected: <strong style={{ color: 'var(--text-primary)' }}>
                  {itemType === 'rfi' ? selectedItem.rfi_number : itemType === 'submittal' ? selectedItem.submittal_number : selectedItem.title}
                </strong></span>
              ) : 'Select an item or create new'
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ color: 'var(--sunbelt-orange)' }} />
                Will create & place marker
              </span>
            )}
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem' }}
            >
              Cancel
            </button>

            {mode === 'select' ? (
              <button
                onClick={handleSelect}
                disabled={!selectedItem}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                  background: selectedItem ? 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))' : 'var(--bg-tertiary)',
                  color: selectedItem ? 'white' : 'var(--text-tertiary)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  cursor: selectedItem ? 'pointer' : 'not-allowed',
                  fontWeight: '600', fontSize: '0.875rem'
                }}
              >
                <MapPin size={16} />
                Add Marker
              </button>
            ) : (
              <button
                onClick={handleCreateAndSelect}
                disabled={!isCreateFormValid() || creating}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                  background: isCreateFormValid() && !creating ? 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))' : 'var(--bg-tertiary)',
                  color: isCreateFormValid() && !creating ? 'white' : 'var(--text-tertiary)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  cursor: isCreateFormValid() && !creating ? 'pointer' : 'not-allowed',
                  fontWeight: '600', fontSize: '0.875rem'
                }}
              >
                {creating ? 'Creating...' : <><Plus size={16} /> Create & Add Marker</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddMarkerModal;