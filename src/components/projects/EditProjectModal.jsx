import React, { useState, useEffect } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

function EditProjectModal({ isOpen, onClose, project, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    project_number: '',
    status: 'Planning',
    client_name: '',
    dealer: '',
    factory: '',
    building_type: '',
    site_address: '',
    square_footage: '',
    module_count: '',
    contract_value: '',
    target_online_date: '',
    target_offline_date: '',
    delivery_date: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    'Planning',
    'Pre-PM',
    'PM Handoff',
    'In Progress',
    'On Hold',
    'Completed',
    'Cancelled',
    'Warranty'
  ];

  const factoryOptions = [
    'Phoenix, AZ',
    'Mabank, TX',
    'Cartersville, GA',
    'Hamlet, NC',
    'Lebanon, OR',
    'Other'
  ];

  const buildingTypes = [
    'Education',
    'Healthcare',
    'Commercial',
    'Government',
    'Multi-Family',
    'Industrial',
    'Retail',
    'Other'
  ];

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name || '',
        project_number: project.project_number || '',
        status: project.status || 'Planning',
        client_name: project.client_name || '',
        dealer: project.dealer || '',
        factory: project.factory || '',
        building_type: project.building_type || '',
        site_address: project.site_address || '',
        square_footage: project.square_footage || '',
        module_count: project.module_count || '',
        contract_value: project.contract_value || '',
        target_online_date: project.target_online_date || '',
        target_offline_date: project.target_offline_date || '',
        delivery_date: project.delivery_date || '',
        description: project.description || ''
      });
      setError('');
    }
  }, [project, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Project name is required');
        setSaving(false);
        return;
      }

      if (!formData.project_number.trim()) {
        setError('Project number is required');
        setSaving(false);
        return;
      }

      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        project_number: formData.project_number.trim(),
        status: formData.status,
        client_name: formData.client_name.trim() || null,
        dealer: formData.dealer.trim() || null,
        factory: formData.factory || null,
        building_type: formData.building_type || null,
        site_address: formData.site_address.trim() || null,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        module_count: formData.module_count ? parseInt(formData.module_count) : null,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        target_online_date: formData.target_online_date || null,
        target_offline_date: formData.target_offline_date || null,
        delivery_date: formData.delivery_date || null,
        description: formData.description.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id);

      if (updateError) throw updateError;

      // Fetch the updated project to return
      const { data: updatedProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single();

      if (fetchError) throw fetchError;

      setSaving(false);
      onSuccess && onSuccess(updatedProject);
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.message || 'Failed to update project');
      setSaving(false);
    }
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
      padding: 'var(--space-md)'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--space-lg)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={20} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Edit Project
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {project?.project_number}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {error && (
              <div style={{
                padding: 'var(--space-md)',
                background: 'var(--danger-light)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Basic Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
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
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Project Number *
                  </label>
                  <input
                    type="text"
                    name="project_number"
                    value={formData.project_number}
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
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Contract Value
                  </label>
                  <input
                    type="number"
                    name="contract_value"
                    value={formData.contract_value}
                    onChange={handleChange}
                    placeholder="0"
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

            {/* Client Info */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Client Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Client Name
                  </label>
                  <input
                    type="text"
                    name="client_name"
                    value={formData.client_name}
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
                <div style={{ gridColumn: '1 / -1' }}>
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
            </div>

            {/* Project Details */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Project Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
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
                    <option value="">Select Factory</option>
                    {factoryOptions.map(factory => (
                      <option key={factory} value={factory}>{factory}</option>
                    ))}
                  </select>
                </div>
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
                    <option value="">Select Type</option>
                    {buildingTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Square Footage
                  </label>
                  <input
                    type="number"
                    name="square_footage"
                    value={formData.square_footage}
                    onChange={handleChange}
                    placeholder="0"
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
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Module Count
                  </label>
                  <input
                    type="number"
                    name="module_count"
                    value={formData.module_count}
                    onChange={handleChange}
                    placeholder="0"
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

            {/* Dates */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Key Dates
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Target Online Date
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
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Target Offline Date
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
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: 'var(--space-lg)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-md)',
            background: 'var(--bg-secondary)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '0.9375rem',
                cursor: 'pointer'
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
                gap: 'var(--space-sm)',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
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