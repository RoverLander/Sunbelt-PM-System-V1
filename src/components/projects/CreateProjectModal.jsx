// ============================================================================
// CreateProjectModal.jsx
// ============================================================================
// Modal component for creating new Projects.
// 
// FEATURES:
// - Primary PM auto-filled with logged-in user (locked/unchangeable)
// - Backup PM selection from team members
// - Factory selection auto-populates factory team contacts
// - Salesperson field for factory sales rep
// - File upload at project creation (Sales Release PDFs, etc.)
// - Auto-generates project number based on factory
// - Dealer POC (Point of Contact) field
//
// DEPENDENCIES:
// - supabaseClient: Database operations
// - useContacts: For PM dropdown
// - useAuth: For current user (Primary PM)
//
// DATABASE FIELDS:
// - primary_pm_id: UUID (auto-filled, required)
// - backup_pm_id: UUID (optional)
// - factory_gm_id, factory_pc_id, factory_sales_id, factory_purchasing_id: UUIDs
// - salesperson: Text field for factory sales rep name
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Building2, Upload, FileText, Trash2, Users, Factory } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useContacts } from '../../hooks/useContacts';

// ============================================================================
// CONSTANTS - Factory Options
// ============================================================================
const FACTORY_OPTIONS = [
  { value: 'AMT - AMTEX', code: 'AMT' },
  { value: 'BUSA - Britco USA', code: 'BUSA' },
  { value: 'C&B - C&B Modular', code: 'C&B' },
  { value: 'IBI - Indicom Buildings', code: 'IBI' },
  { value: 'MRS - MR Steel', code: 'MRS' },
  { value: 'NWBS - Northwest Building Systems', code: 'NWBS' },
  { value: 'PMI - Phoenix Modular', code: 'PMI' },
  { value: 'PRM - Pro-Mod Manufacturing', code: 'PRM' },
  { value: 'SMM - Southeast Modular', code: 'SMM' },
  { value: 'SNB - Sunbelt Modular (Corporate)', code: 'SNB' },
  { value: 'SSI - Specialized Structures', code: 'SSI' },
  { value: 'WM-EAST - Whitley Manufacturing East', code: 'WM-EAST' },
  { value: 'WM-EVERGREEN - Whitley Manufacturing Evergreen', code: 'WM-EVERGREEN' },
  { value: 'WM-ROCHESTER - Whitley Manufacturing Rochester', code: 'WM-ROCHESTER' },
  { value: 'WM-SOUTH - Whitley Manufacturing South', code: 'WM-SOUTH' },
];

// ============================================================================
// CONSTANTS - Status Options
// ============================================================================
const PROJECT_STATUSES = [
  'Pre-PM',
  'Planning',
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
function CreateProjectModal({ isOpen, onClose, onSuccess }) {
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  const { user } = useAuth();
  const { contacts, users, factoryContacts } = useContacts(isOpen);
  const fileInputRef = useRef(null);

  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  
  // Factory team (auto-populated when factory is selected)
  const [factoryTeam, setFactoryTeam] = useState({
    gm: null,
    pc: null,
    sales: null,
    purchasing: null
  });
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    project_number: '',
    status: 'Pre-PM',
    factory: '',
    // PM Assignments
    primary_pm_id: '',      // Auto-filled with current user
    backup_pm_id: '',       // Optional
    // Dealer Info
    client_name: '',        // Dealer POC
    dealer: '',             // Dealer company name
    site_address: '',
    // Building Details
    building_type: '',
    square_footage: '',
    module_count: '',
    // Financial
    contract_value: '',
    // Schedule
    start_date: '',
    target_offline_date: '',
    delivery_date: '',
    target_online_date: '',
    // Sales Info
    salesperson: '',
    // Notes
    description: ''
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  // Set Primary PM to current user when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData(prev => ({ ...prev, primary_pm_id: user.id }));
      setPendingFiles([]);
      setError('');
      setFactoryTeam({ gm: null, pc: null, sales: null, purchasing: null });
    }
  }, [isOpen, user]);

  // ==========================================================================
  // FACTORY TEAM AUTO-POPULATION
  // ==========================================================================
  // When factory is selected, find contacts by role for that factory
  
  const populateFactoryTeam = (factoryCode) => {
    if (!factoryCode || !factoryContacts.length) {
      setFactoryTeam({ gm: null, pc: null, sales: null, purchasing: null });
      return;
    }

    // Filter contacts for selected factory
    const factoryPeople = factoryContacts.filter(c => c.factory_code === factoryCode);

    // Find by department/role_code
    const gm = factoryPeople.find(c => c.department === 'PGM' || c.role_code === 'PGM');
    const pc = factoryPeople.find(c => c.department === 'PC' || c.role_code === 'PC');
    const sales = factoryPeople.find(c => c.department === 'SALES' || c.role_code === 'SALES');
    const purchasing = factoryPeople.find(c => c.department === 'PURCH' || c.role_code === 'PURCH');

    setFactoryTeam({
      gm: gm || null,
      pc: pc || null,
      sales: sales || null,
      purchasing: purchasing || null
    });

    // Auto-fill salesperson if found
    if (sales) {
      setFormData(prev => ({ ...prev, salesperson: sales.name }));
    }
  };

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle factory selection - triggers team auto-population
  const handleFactoryChange = (e) => {
    const factoryValue = e.target.value;
    const factoryOption = FACTORY_OPTIONS.find(f => f.value === factoryValue);
    const factoryCode = factoryOption?.code || '';

    setFormData(prev => ({
      ...prev,
      factory: factoryValue,
      project_number: prev.project_number || '' // Keep existing or allow auto-gen
    }));

    // Auto-populate factory team
    populateFactoryTeam(factoryCode);
  };

  // ==========================================================================
  // PROJECT NUMBER GENERATION
  // ==========================================================================
  
  const generateProjectNumber = () => {
    const factoryOption = FACTORY_OPTIONS.find(f => f.value === formData.factory);
    const shorthand = factoryOption?.code || 'PRJ';
    const random = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
    return `${shorthand}-${random}`;
  };

  // ==========================================================================
  // FILE HANDLING
  // ==========================================================================
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setPendingFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (fileId) => {
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Upload files after project creation
  const uploadProjectFiles = async (projectId) => {
    for (const pendingFile of pendingFiles) {
      try {
        const timestamp = Date.now();
        const safeName = pendingFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${projectId}/documents/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, pendingFile.file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(storagePath);

        // Create file attachment record
        await supabase
          .from('file_attachments')
          .insert([{
            project_id: projectId,
            file_name: pendingFile.name,
            file_size: pendingFile.size,
            file_type: pendingFile.type,
            storage_path: storagePath,
            public_url: urlData.publicUrl,
            uploaded_by: user.id,
            category: 'Sales Release' // Default category for creation uploads
          }]);

      } catch (error) {
        console.error('Error processing file:', error);
      }
    }
  };

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.factory) {
        throw new Error('Please select a factory');
      }

      // Generate project number if not provided
      let projectNumber = formData.project_number.trim();
      if (!projectNumber) {
        projectNumber = generateProjectNumber();
      }

      // Build project data object
      const projectData = {
        name: formData.name.trim(),
        project_number: projectNumber,
        status: formData.status,
        factory: formData.factory,
        // PM Assignments
        primary_pm_id: formData.primary_pm_id,
        backup_pm_id: formData.backup_pm_id || null,
        // Factory Team (from auto-population)
        factory_gm_id: factoryTeam.gm?.id || null,
        factory_pc_id: factoryTeam.pc?.id || null,
        factory_sales_id: factoryTeam.sales?.id || null,
        factory_purchasing_id: factoryTeam.purchasing?.id || null,
        // Dealer Info
        client_name: formData.client_name.trim() || null,
        dealer: formData.dealer.trim() || null,
        site_address: formData.site_address.trim() || null,
        // Building Details
        building_type: formData.building_type || null,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        module_count: formData.module_count ? parseInt(formData.module_count) : null,
        // Financial
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        // Schedule
        start_date: formData.start_date || null,
        target_offline_date: formData.target_offline_date || null,
        delivery_date: formData.delivery_date || null,
        target_online_date: formData.target_online_date || null,
        // Sales Info
        salesperson: formData.salesperson.trim() || null,
        // Notes
        description: formData.description.trim() || null,
        // Meta
        created_by: user.id
      };

      // Insert project into database
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload any pending files
      if (pendingFiles.length > 0) {
        await uploadProjectFiles(data.id);
      }

      onSuccess(data);
      handleClose();

    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // MODAL CLOSE
  // ==========================================================================
  
  const handleClose = () => {
    setFormData({
      name: '',
      project_number: '',
      status: 'Pre-PM',
      factory: '',
      primary_pm_id: '',
      backup_pm_id: '',
      client_name: '',
      dealer: '',
      site_address: '',
      building_type: '',
      square_footage: '',
      module_count: '',
      contract_value: '',
      start_date: '',
      target_offline_date: '',
      delivery_date: '',
      target_online_date: '',
      salesperson: '',
      description: ''
    });
    setPendingFiles([]);
    setFactoryTeam({ gm: null, pc: null, sales: null, purchasing: null });
    setError('');
    onClose();
  };

  // ==========================================================================
  // HELPER: Get current user's name for display
  // ==========================================================================
  const getCurrentUserName = () => {
    const currentUser = users.find(u => u.id === user?.id);
    return currentUser?.name || user?.email || 'Current User';
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
                Create Project
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                Add a new project to the system
              </p>
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}>
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
              fontSize: '1rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)',
              paddingBottom: 'var(--space-sm)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              Basic Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="e.g., Lincoln Elementary School"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} required className="form-input">
                  {PROJECT_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Factory *</label>
                <select
                  name="factory"
                  value={formData.factory}
                  onChange={handleFactoryChange}
                  required
                  className="form-input"
                >
                  <option value="">Select factory</option>
                  {FACTORY_OPTIONS.map(factory => (
                    <option key={factory.value} value={factory.value}>{factory.value}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Project Number</label>
                <input
                  type="text"
                  name="project_number"
                  value={formData.project_number}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Auto-generated if left blank"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Leave blank to auto-generate based on factory
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Project Team                                        */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)',
              paddingBottom: 'var(--space-sm)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <Users size={18} /> Project Team
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              {/* Primary PM - Locked to current user */}
              <div className="form-group">
                <label className="form-label">Primary PM *</label>
                <input
                  type="text"
                  value={getCurrentUserName()}
                  disabled
                  className="form-input"
                  style={{ 
                    background: 'var(--bg-tertiary)', 
                    cursor: 'not-allowed',
                    color: 'var(--sunbelt-orange)',
                    fontWeight: '600'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  You are automatically assigned as Primary PM
                </p>
              </div>

              {/* Backup PM - Selectable */}
              <div className="form-group">
                <label className="form-label">Backup PM</label>
                <select
                  name="backup_pm_id"
                  value={formData.backup_pm_id}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select backup PM (optional)</option>
                  {users.filter(u => u.id !== user?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Salesperson */}
            <div className="form-group">
              <label className="form-label">Factory Salesperson</label>
              <input
                type="text"
                name="salesperson"
                value={formData.salesperson}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., George Avila"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Factory Team (Auto-populated)                       */}
          {/* ============================================================ */}
          {formData.factory && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                marginBottom: 'var(--space-md)',
                paddingBottom: 'var(--space-sm)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }}>
                <Factory size={18} /> Factory Team
                <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-tertiary)' }}>
                  (Auto-populated)
                </span>
              </h3>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: 'var(--space-md)',
                padding: 'var(--space-md)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                {/* GM */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                    General Manager
                  </label>
                  <p style={{ fontSize: '0.875rem', color: factoryTeam.gm ? 'var(--text-primary)' : 'var(--text-muted)', margin: 0, fontWeight: factoryTeam.gm ? '500' : '400' }}>
                    {factoryTeam.gm?.name || 'Not assigned'}
                  </p>
                </div>

                {/* PC */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                    Project Coordinator
                  </label>
                  <p style={{ fontSize: '0.875rem', color: factoryTeam.pc ? 'var(--text-primary)' : 'var(--text-muted)', margin: 0, fontWeight: factoryTeam.pc ? '500' : '400' }}>
                    {factoryTeam.pc?.name || 'Not assigned'}
                  </p>
                </div>

                {/* Sales */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                    Sales Manager
                  </label>
                  <p style={{ fontSize: '0.875rem', color: factoryTeam.sales ? 'var(--text-primary)' : 'var(--text-muted)', margin: 0, fontWeight: factoryTeam.sales ? '500' : '400' }}>
                    {factoryTeam.sales?.name || 'Not assigned'}
                  </p>
                </div>

                {/* Purchasing */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                    Purchasing Manager
                  </label>
                  <p style={{ fontSize: '0.875rem', color: factoryTeam.purchasing ? 'var(--text-primary)' : 'var(--text-muted)', margin: 0, fontWeight: factoryTeam.purchasing ? '500' : '400' }}>
                    {factoryTeam.purchasing?.name || 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SECTION: Dealer & Site                                       */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)',
              paddingBottom: 'var(--space-sm)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              Dealer & Site
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Dealer POC</label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Joey Madere"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Point of Contact at the dealer
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Dealer</label>
                <input
                  type="text"
                  name="dealer"
                  value={formData.dealer}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Mobile Modular Management"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Site Address</label>
              <input
                type="text"
                name="site_address"
                value={formData.site_address}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 31267 Valley Center Road, Valley Center, CA 92082"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Building Details                                    */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)',
              paddingBottom: 'var(--space-sm)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              Building Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Building Type</label>
                <select name="building_type" value={formData.building_type} onChange={handleChange} className="form-input">
                  <option value="">Select type</option>
                  {BUILDING_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Square Footage</label>
                <input type="number" name="square_footage" value={formData.square_footage} onChange={handleChange} className="form-input" placeholder="e.g., 25000" min="0" />
              </div>

              <div className="form-group">
                <label className="form-label">Module Count</label>
                <input type="number" name="module_count" value={formData.module_count} onChange={handleChange} className="form-input" placeholder="e.g., 12" min="0" />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Financial & Schedule                                */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)',
              paddingBottom: 'var(--space-sm)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              Financial & Schedule
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Contract Value ($)</label>
                <input type="number" name="contract_value" value={formData.contract_value} onChange={handleChange} className="form-input" placeholder="e.g., 1500000" min="0" step="1000" />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Target Offline</label>
                <input type="date" name="target_offline_date" value={formData.target_offline_date} onChange={handleChange} className="form-input" />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Factory completion</p>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Date</label>
                <input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} className="form-input" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Target Online</label>
                <input type="date" name="target_online_date" value={formData.target_online_date} onChange={handleChange} className="form-input" />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Building opens</p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: File Uploads                                        */}
          {/* ============================================================ */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)',
              paddingBottom: 'var(--space-sm)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              Attachments
            </h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-lg)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: pendingFiles.length > 0 ? 'var(--space-md)' : 0
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--sunbelt-orange)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <Upload size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                Click to upload Sales Release, PO, or other project documents
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Pending Files List */}
            {pendingFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {pendingFiles.map(file => (
                  <div key={file.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem'
                  }}>
                    <FileText size={16} style={{ color: file.type?.includes('pdf') ? '#ef4444' : 'var(--text-tertiary)' }} />
                    <span style={{ flex: 1, color: 'var(--text-primary)' }}>{file.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* SECTION: Description                                         */}
          {/* ============================================================ */}
          <div className="form-group">
            <label className="form-label">Project Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder="Brief description of the project..."
              style={{ resize: 'vertical', minHeight: '80px' }}
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
            marginTop: 'var(--space-lg)'
          }}>
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (pendingFiles.length > 0 ? 'Creating & Uploading...' : 'Creating...') : <><Plus size={18} /> Create Project</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;