// ============================================================================
// EditProjectModal.jsx - FIXED
// ============================================================================
// Modal component for editing existing Projects.
// 
// FEATURES:
// - Edit all project fields
// - Factory selection from standardized list
// - Status management
// - Primary PM and Secondary PM assignment (✅ ADDED)
// - Dealer POC (Point of Contact) field (renamed from "Client Name")
// - Building details, financials, and schedule
//
// FIXES (Jan 8, 2026):
// - Added Primary PM (owner_id) field
// - Added Secondary PM (backup_pm_id) field
// - Fetches users list for PM dropdowns
//
// DEPENDENCIES:
// - supabaseClient: Database operations
//
// PROPS:
// - isOpen: Boolean to control modal visibility
// - onClose: Function called when modal closes
// - project: The project object to edit
// - onSuccess: Callback with updated project data
//
// FIELD NOTES:
// - client_name: Displayed as "Dealer POC" in UI (Point of Contact from dealer)
// - dealer: The dealer company name
// - factory: Uses standardized format "SHORTHAND - Full Name"
// - owner_id: Primary PM assigned to project
// - backup_pm_id: Secondary/Backup PM assigned to project
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// CONSTANTS - Factory Options
// ============================================================================
// Standardized factory names with shorthand codes
// Format: "SHORTHAND - Full Name"

const FACTORY_OPTIONS = [
  'AMT - AMTEX',
  'BUSA - Britco USA',
  'C&B - C&B Modular',
  'IBI - Indicom Buildings',
  'MRS - MR Steel',
  'NWBS - Northwest Building Systems',
  'PMI - Phoenix Modular',
  'PRM - Pro-Mod Manufacturing',
  'SMM - Southeast Modular',
  'SNB - Sunbelt Modular (Corporate)',
  'SSI - Specialized Structures',
  'WM-EAST - Whitley Manufacturing East',
  'WM-EVERGREEN - Whitley Manufacturing Evergreen',
  'WM-ROCHESTER - Whitley Manufacturing Rochester',
  'WM-SOUTH - Whitley Manufacturing South',
];

// ============================================================================
// CONSTANTS - Status Options
// ============================================================================
const PROJECT_STATUSES = [
  'Planning',
  'Pre-PM',
  'PM Handoff',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled',
  'Warranty'
];

// ============================================================================
// CONSTANTS - Building Types
// ============================================================================
const BUILDING_TYPES = [
  'Education - Elementary',
  'Education - Middle School',
  'Education - High School',
  'Education - Higher Ed',
  'Healthcare - Clinic',
  'Healthcare - Hospital',
  'Commercial - Office',
  'Commercial - Retail',
  'Industrial',
  'Government',
  'Residential - Single Family',
  'Residential - Multi-Family',
  'Religious',
  'Other'
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function EditProjectModal({ isOpen, onClose, project, onSuccess }) {
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);  // ✅ ADDED: Users for PM dropdowns
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    project_number: '',
    status: 'Planning',
    owner_id: '',           // ✅ ADDED: Primary PM
    backup_pm_id: '',       // ✅ ADDED: Secondary PM
    factory: '',
    client_name: '',        // Displayed as "Dealer POC"
    dealer: '',
    site_address: '',
    building_type: '',
    square_footage: '',
    module_count: '',
    contract_value: '',
    start_date: '',
    target_online_date: '',
    target_offline_date: '',
    delivery_date: '',
    description: ''
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  // ✅ ADDED: Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name || '',
        project_number: project.project_number || '',
        status: project.status || 'Planning',
        owner_id: project.owner_id || '',           // ✅ ADDED
        backup_pm_id: project.backup_pm_id || '',   // ✅ ADDED
        factory: project.factory || '',
        client_name: project.client_name || '',
        dealer: project.dealer || '',
        site_address: project.site_address || '',
        building_type: project.building_type || '',
        square_footage: project.square_footage || '',
        module_count: project.module_count || '',
        contract_value: project.contract_value || '',
        start_date: project.start_date || '',
        target_online_date: project.target_online_date || '',
        target_offline_date: project.target_offline_date || '',
        delivery_date: project.delivery_date || '',
        description: project.description || ''
      });
      setError('');
    }
  }, [project, isOpen]);

  // ==========================================================================
  // FETCH USERS - For PM dropdowns
  // ==========================================================================
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('is_active', true)
        .order('name');

      if (!error) {
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Filter users for PM dropdowns (only show PM-capable roles)
  const pmUsers = users.filter(u => 
    ['PM', 'Project Manager', 'Director', 'Admin', 'VP'].includes(u.role)
  );

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ==========================================================================
  // PROJECT UPDATE
  // ==========================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const projectData = {
        name: formData.name.trim(),
        project_number: formData.project_number.trim(),
        status: formData.status,
        owner_id: formData.owner_id || null,           // ✅ ADDED
        backup_pm_id: formData.backup_pm_id || null,   // ✅ ADDED
        factory: formData.factory,
        client_name: formData.client_name.trim() || null,
        dealer: formData.dealer.trim() || null,
        site_address: formData.site_address.trim() || null,
        building_type: formData.building_type || null,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        module_count: formData.module_count ? parseInt(formData.module_count) : null,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        start_date: formData.start_date || null,
        target_online_date: formData.target_online_date || null,
        target_offline_date: formData.target_offline_date || null,
        delivery_date: formData.delivery_date || null,
        description: formData.description.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', project.id);

      if (updateError) throw updateError;

      // Fetch updated project
      const { data: updatedProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single();

      if (fetchError) throw fetchError;

      onSuccess(updatedProject);
      onClose();
    } catch (error) {
      console.error('Error updating project:', error);
      setError(error.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
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
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
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
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-primary)',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Edit Project
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                {project?.project_number} - {project?.name}
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
              borderRadius: '6px'
            }}
          >
            <X size={24} />
          </button>
        </div>

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
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {/* ============================================================ */}
          {/* SECTION: Basic Information                                   */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Basic Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)' }}>
              {/* Project Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
              
              {/* Project Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Project Number
                </label>
                <input
                  type="text"
                  name="project_number"
                  value={formData.project_number}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                >
                  {PROJECT_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              {/* Factory */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Factory
                </label>
                <select
                  name="factory"
                  value={formData.factory}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                >
                  <option value="">Select factory</option>
                  {FACTORY_OPTIONS.map(factory => (
                    <option key={factory} value={factory}>{factory}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Team Assignment (✅ NEW SECTION)                    */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Team Assignment
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              {/* Primary PM */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Primary PM
                </label>
                <select
                  name="owner_id"
                  value={formData.owner_id}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                >
                  <option value="">Select Primary PM</option>
                  {pmUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Secondary PM */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Secondary PM
                </label>
                <select
                  name="backup_pm_id"
                  value={formData.backup_pm_id}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                >
                  <option value="">Select Secondary PM</option>
                  {pmUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Dealer & Site Information                           */}
          {/* NOTE: "Client Name" renamed to "Dealer POC" per request      */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Dealer & Site
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              {/* Dealer POC (formerly Client Name) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Dealer POC
                </label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  placeholder="Point of Contact at dealer"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
              
              {/* Dealer */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Dealer
                </label>
                <input
                  type="text"
                  name="dealer"
                  value={formData.dealer}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
            </div>

            {/* Site Address */}
            <div style={{ marginTop: 'var(--space-md)' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Site Address
              </label>
              <input
                type="text"
                name="site_address"
                value={formData.site_address}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem'
                }}
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Building Details                                    */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Building Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
              {/* Building Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Building Type
                </label>
                <select
                  name="building_type"
                  value={formData.building_type}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                >
                  <option value="">Select type</option>
                  {BUILDING_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              {/* Square Footage */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Square Footage
                </label>
                <input
                  type="number"
                  name="square_footage"
                  value={formData.square_footage}
                  onChange={handleChange}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
              
              {/* Module Count */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Module Count
                </label>
                <input
                  type="number"
                  name="module_count"
                  value={formData.module_count}
                  onChange={handleChange}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Financial                                           */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Financial
            </h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Contract Value ($)
              </label>
              <input
                type="number"
                name="contract_value"
                value={formData.contract_value}
                onChange={handleChange}
                min="0"
                step="1000"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem'
                }}
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Schedule                                            */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Schedule
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
              {/* Start Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
              
              {/* Target Offline */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Target Offline
                </label>
                <input
                  type="date"
                  name="target_offline_date"
                  value={formData.target_offline_date}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
              
              {/* Delivery Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Delivery Date
                </label>
                <input
                  type="date"
                  name="delivery_date"
                  value={formData.delivery_date}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
              
              {/* Target Online */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Target Online
                </label>
                <input
                  type="date"
                  name="target_online_date"
                  value={formData.target_online_date}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Description                                         */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                resize: 'vertical',
                minHeight: '80px'
              }}
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
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '0.9375rem',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: '10px 24px',
                background: 'var(--sunbelt-orange)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.9375rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProjectModal;