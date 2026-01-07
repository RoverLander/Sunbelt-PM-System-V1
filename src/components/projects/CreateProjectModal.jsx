import React, { useState } from 'react';
import { X, Plus, Building2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

function CreateProjectModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
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

  const factories = [
    'Phoenix Modular',
    'Denver Modular', 
    'Texas Modular',
    'California Modular',
    'Florida Modular'
  ];

  const statuses = [
    'Planning',
    'Pre-PM',
    'In Progress',
    'On Hold',
    'Completed',
    'Cancelled',
    'Warranty'
  ];

  const buildingTypes = [
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateProjectNumber = () => {
    const factoryPrefixes = {
      'Phoenix Modular': 'PHX',
      'Denver Modular': 'DEN',
      'Texas Modular': 'TEX',
      'California Modular': 'CAL',
      'Florida Modular': 'FLA'
    };
    
    const prefix = factoryPrefixes[formData.factory] || 'PRJ';
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    
    return `${prefix}-${year}-${random}`;
  };

  const handleFactoryChange = (e) => {
    const factory = e.target.value;
    setFormData(prev => ({
      ...prev,
      factory,
      project_number: prev.project_number || '' // Will auto-generate on submit if empty
    }));
  };

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

      const projectData = {
        name: formData.name.trim(),
        project_number: projectNumber,
        status: formData.status,
        factory: formData.factory,
        client_name: formData.client_name.trim() || null,
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
        {/* Header */}
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
                Create New Project
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                Fill in the project details below
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-xl)' }}>
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

          {/* Basic Info Section */}
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
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  {statuses.map(status => (
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
                  {factories.map(factory => (
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

          {/* Client & Dealer Section */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)',
              paddingBottom: 'var(--space-sm)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              Client & Dealer
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Lincoln School District"
                />
              </div>

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

          {/* Building Details Section */}
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
                  {buildingTypes.map(type => (
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

          {/* Financial & Schedule Section */}
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
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  When the project should go online
                </p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: 'var(--space-md)',
              paddingBottom: 'var(--space-sm)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              Additional Information
            </h3>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                rows="4"
                placeholder="Enter any additional project details, notes, or special requirements..."
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            justifyContent: 'flex-end',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--border-color)'
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
              {loading ? 'Creating...' : (
                <>
                  <Plus size={18} />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;