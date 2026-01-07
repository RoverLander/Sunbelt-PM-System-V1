// ============================================================================
// CreateProjectModal.jsx
// ============================================================================
// Modal component for creating new Projects.
// 
// FEATURES:
// - Full project setup with all key fields
// - Factory selection from standardized list (with shorthand codes)
// - Auto-generates project number based on factory (e.g., NWBS-25001)
// - Dealer POC (Point of Contact) field
// - Building type, financials, and schedule
//
// DEPENDENCIES:
// - supabaseClient: Database operations
// - factoryConstants: Standardized factory list
//
// PROPS:
// - isOpen: Boolean to control modal visibility
// - onClose: Function called when modal closes
// - onSuccess: Callback with created project data
//
// FIELD NOTES:
// - client_name: Renamed to "Dealer POC" in UI (Point of Contact from dealer)
// - dealer: The dealer company name
// - factory: Uses standardized format "SHORTHAND - Full Name"
// ============================================================================

import React, { useState } from 'react';
import { X, Plus, Building2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// CONSTANTS - Factory Options
// ============================================================================
// Standardized factory names with shorthand codes
// Format: "SHORTHAND - Full Name"
// Used for dropdown and project number generation

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
  const { user } = useAuth();
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',                // Project name (required)
    project_number: '',      // Auto-generated or manual
    status: 'Pre-PM',        // Default status
    factory: '',             // Factory selection (required)
    client_name: '',         // Dealer POC (Point of Contact)
    dealer: '',              // Dealer company name
    site_address: '',        // Site location
    building_type: '',       // Building type
    square_footage: '',      // Building size
    module_count: '',        // Number of modules
    contract_value: '',      // Contract amount
    target_online_date: '',  // Target completion
    start_date: '',          // Start date
    description: ''          // Project description
  });

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ==========================================================================
  // PROJECT NUMBER GENERATION
  // ==========================================================================
  // Format: {FACTORY_SHORTHAND}-{5_DIGIT_RANDOM}
  // Example: NWBS-25001
  
  const generateProjectNumber = () => {
    // Extract shorthand from factory (e.g., "NWBS" from "NWBS - Northwest Building Systems")
    const shorthand = formData.factory?.split(' - ')[0] || 'PRJ';
    const random = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
    
    return `${shorthand}-${random}`;
  };

  // Handle factory change - clear project number to allow auto-generation
  const handleFactoryChange = (e) => {
    const factory = e.target.value;
    setFormData(prev => ({
      ...prev,
      factory,
      project_number: prev.project_number || '' // Keep existing or allow auto-generation
    }));
  };

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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
        client_name: formData.client_name.trim() || null,  // Dealer POC
        dealer: formData.dealer.trim() || null,
        site_address: formData.site_address.trim() || null,
        building_type: formData.building_type || null,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        module_count: formData.module_count ? parseInt(formData.module_count) : null,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        target_online_date: formData.target_online_date || null,
        start_date: formData.start_date || null,
        description: formData.description.trim() || null,
        created_by: user.id
      };

      // Insert project into database
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (insertError) throw insertError;

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
      client_name: '',
      dealer: '',
      site_address: '',
      building_type: '',
      square_footage: '',
      module_count: '',
      contract_value: '',
      target_online_date: '',
      start_date: '',
      description: ''
    });
    setError('');
    onClose();
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
        maxWidth: '800px',
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

            {/* Project Name & Status */}
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
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  {PROJECT_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Factory & Project Number */}
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
                    <option key={factory} value={factory}>{factory}</option>
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
          {/* SECTION: Dealer & Site Information                           */}
          {/* NOTE: "Client Name" renamed to "Dealer POC" per request      */}
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
              {/* Dealer POC (formerly Client Name) */}
              <div className="form-group">
                <label className="form-label">Dealer POC</label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., John Smith"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Point of Contact at the dealer
                </p>
              </div>

              {/* Dealer Company */}
              <div className="form-group">
                <label className="form-label">Dealer</label>
                <input
                  type="text"
                  name="dealer"
                  value={formData.dealer}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., ABC Modular Dealers"
                />
              </div>
            </div>

            {/* Site Address */}
            <div className="form-group">
              <label className="form-label">Site Address</label>
              <input
                type="text"
                name="site_address"
                value={formData.site_address}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 123 Main Street, Phoenix, AZ 85001"
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
                <select
                  name="building_type"
                  value={formData.building_type}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select type</option>
                  {BUILDING_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Square Footage</label>
                <input
                  type="number"
                  name="square_footage"
                  value={formData.square_footage}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 25000"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Module Count</label>
                <input
                  type="number"
                  name="module_count"
                  value={formData.module_count}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 12"
                  min="0"
                />
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Contract Value ($)</label>
                <input
                  type="number"
                  name="contract_value"
                  value={formData.contract_value}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 1500000"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Online Date</label>
                <input
                  type="date"
                  name="target_online_date"
                  value={formData.target_online_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
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
            <button 
              type="button" 
              onClick={handleClose} 
              className="btn btn-secondary" 
              disabled={loading}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Creating...' : <><Plus size={18} /> Create Project</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;