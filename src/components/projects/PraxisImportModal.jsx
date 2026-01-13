// ============================================================================
// PraxisImportModal.jsx
// ============================================================================
// Modal for importing projects from Praxis (Access-based estimating software)
// Supports both CSV import and manual entry modes.
//
// FEATURES:
// - Tab switching between Manual Entry and CSV Import
// - CSV file upload with drag-and-drop
// - Validation with error/warning display
// - Preview of data before import
// - Download template functionality
// - Multi-project import from CSV
//
// Reference: docs/PRAXIS_INTEGRATION_ANALYSIS.md
// ============================================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, AlertCircle,
  Download, Building2, Loader, ChevronRight, ChevronDown, Plus, Trash2
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  parseCSV,
  validateCSV,
  transformRowToProject,
  downloadImportTemplate,
  PRAXIS_FIELD_MAP,
  BUILDING_TYPES,
  SET_TYPES,
  SPRINKLER_TYPES,
  mapFactoryCodeToValue
} from '../../utils/praxisImport';

// ============================================================================
// CONSTANTS
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

const OCCUPANCY_TYPES = ['A', 'A-1', 'A-2', 'A-3', 'B', 'E', 'F', 'H', 'I', 'I-2', 'M', 'R', 'S', 'U'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function PraxisImportModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // =========================================================================
  // STATE
  // =========================================================================
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'csv'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // CSV Import state
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Dealers and users for lookup
  const [dealers, setDealers] = useState([]);
  const [users, setUsers] = useState([]);

  // Manual entry state
  const [manualForm, setManualForm] = useState({
    // Identification
    praxis_quote_number: '',
    serial_number: '',
    folder_number: '',
    // Building
    name: '',
    building_type: '',
    building_height: '',
    building_width: '',
    building_length: '',
    interior_wall_lf: '',
    stories: '1',
    module_size: '',
    module_count: '1',
    // Dealer
    dealer_id: '',
    dealer_branch: '',
    dealer_contact_name: '',
    customer_po_number: '',
    // Costs
    material_cost: '',
    markup_factor: '',
    contract_value: '',
    engineering_cost: '',
    approvals_cost: '',
    // Location
    state_tags: '',
    climate_zone: '',
    floor_load_psf: '',
    roof_load_psf: '',
    site_address: '',
    site_city: '',
    site_state: '',
    site_zip: '',
    occupancy_type: '',
    set_type: '',
    // Special
    requires_ttp: false,
    sprinkler_type: '',
    has_plumbing: false,
    wui_compliant: false,
    requires_cut_sheets: false,
    requires_om_manuals: false,
    // Dates
    sold_date: '',
    promised_delivery_date: '',
    drawings_due_date: '',
    // Sales
    salesperson: '',
    factory: '',
    // Notes
    long_lead_notes: '',
    description: ''
  });

  // =========================================================================
  // EFFECTS - Load dealers and users on open
  // =========================================================================
  React.useEffect(() => {
    if (isOpen) {
      loadLookupData();
      resetState();
    }
  }, [isOpen]);

  const loadLookupData = async () => {
    try {
      // Load dealers
      const { data: dealerData } = await supabase
        .from('dealers')
        .select('*')
        .order('name');
      setDealers(dealerData || []);

      // Load users
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, role')
        .order('name');
      setUsers(userData || []);
    } catch (err) {
      console.error('Error loading lookup data:', err);
    }
  };

  const resetState = () => {
    setError('');
    setCsvFile(null);
    setCsvData(null);
    setValidationResult(null);
    setPreviewData([]);
    setShowPreview(false);
    setManualForm({
      praxis_quote_number: '',
      serial_number: '',
      folder_number: '',
      name: '',
      building_type: '',
      building_height: '',
      building_width: '',
      building_length: '',
      interior_wall_lf: '',
      stories: '1',
      module_size: '',
      module_count: '1',
      dealer_id: '',
      dealer_branch: '',
      dealer_contact_name: '',
      customer_po_number: '',
      material_cost: '',
      markup_factor: '',
      contract_value: '',
      engineering_cost: '',
      approvals_cost: '',
      state_tags: '',
      climate_zone: '',
      floor_load_psf: '',
      roof_load_psf: '',
      site_address: '',
      site_city: '',
      site_state: '',
      site_zip: '',
      occupancy_type: '',
      set_type: '',
      requires_ttp: false,
      sprinkler_type: '',
      has_plumbing: false,
      wui_compliant: false,
      requires_cut_sheets: false,
      requires_om_manuals: false,
      sold_date: '',
      promised_delivery_date: '',
      drawings_due_date: '',
      salesperson: '',
      factory: '',
      long_lead_notes: '',
      description: ''
    });
  };

  // =========================================================================
  // CSV FILE HANDLING
  // =========================================================================

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target?.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [dealers, users]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file) => {
    setError('');
    setValidationResult(null);
    setPreviewData([]);

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    setCsvFile(file);

    try {
      const content = await file.text();
      const { headers, rows, errors: parseErrors } = parseCSV(content);

      if (parseErrors.length > 0) {
        setError(parseErrors.join('\n'));
        return;
      }

      setCsvData({ headers, rows });

      // Validate
      const validation = validateCSV(rows);
      setValidationResult(validation);

      // Transform for preview (first 5 rows)
      const preview = rows.slice(0, 5).map((row, idx) => {
        try {
          return transformRowToProject(row, { dealers, users });
        } catch (err) {
          return { _error: err.message, _row: idx + 2 };
        }
      });
      setPreviewData(preview);
      setShowPreview(true);

    } catch (err) {
      setError(`Error reading file: ${err.message}`);
    }
  };

  // =========================================================================
  // MANUAL FORM HANDLERS
  // =========================================================================

  const handleManualChange = (e) => {
    const { name, value, type, checked } = e.target;
    setManualForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // =========================================================================
  // IMPORT HANDLERS
  // =========================================================================

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!manualForm.name.trim()) {
        throw new Error('Building Description (Project Name) is required');
      }
      if (!manualForm.factory) {
        throw new Error('Factory is required');
      }

      // Build project data
      const projectData = {
        name: manualForm.name.trim(),
        status: 'Pre-PM',
        factory: manualForm.factory,
        // Praxis fields
        praxis_quote_number: manualForm.praxis_quote_number || null,
        serial_number: manualForm.serial_number || null,
        folder_number: manualForm.folder_number || null,
        building_type: manualForm.building_type || null,
        building_height: manualForm.building_height ? parseInt(manualForm.building_height) : null,
        building_width: manualForm.building_width ? parseInt(manualForm.building_width) : null,
        building_length: manualForm.building_length ? parseInt(manualForm.building_length) : null,
        interior_wall_lf: manualForm.interior_wall_lf ? parseInt(manualForm.interior_wall_lf) : null,
        stories: manualForm.stories ? parseInt(manualForm.stories) : 1,
        module_size: manualForm.module_size || null,
        module_count: manualForm.module_count ? parseInt(manualForm.module_count) : 1,
        // Dealer
        dealer_id: manualForm.dealer_id || null,
        dealer_branch: manualForm.dealer_branch || null,
        dealer_contact_name: manualForm.dealer_contact_name || null,
        customer_po_number: manualForm.customer_po_number || null,
        // Costs
        material_cost: manualForm.material_cost ? parseFloat(manualForm.material_cost) : null,
        markup_factor: manualForm.markup_factor ? parseFloat(manualForm.markup_factor) : null,
        contract_value: manualForm.contract_value ? parseFloat(manualForm.contract_value) : null,
        engineering_cost: manualForm.engineering_cost ? parseFloat(manualForm.engineering_cost) : null,
        approvals_cost: manualForm.approvals_cost ? parseFloat(manualForm.approvals_cost) : null,
        // Location
        state_tags: manualForm.state_tags || null,
        climate_zone: manualForm.climate_zone ? parseInt(manualForm.climate_zone) : null,
        floor_load_psf: manualForm.floor_load_psf ? parseInt(manualForm.floor_load_psf) : null,
        roof_load_psf: manualForm.roof_load_psf ? parseInt(manualForm.roof_load_psf) : null,
        site_address: manualForm.site_address || null,
        site_city: manualForm.site_city || null,
        site_state: manualForm.site_state || null,
        site_zip: manualForm.site_zip || null,
        occupancy_type: manualForm.occupancy_type || null,
        set_type: manualForm.set_type || null,
        // Special
        requires_ttp: manualForm.requires_ttp,
        sprinkler_type: manualForm.sprinkler_type || null,
        has_plumbing: manualForm.has_plumbing,
        wui_compliant: manualForm.wui_compliant,
        requires_cut_sheets: manualForm.requires_cut_sheets,
        requires_om_manuals: manualForm.requires_om_manuals,
        // Dates
        sold_date: manualForm.sold_date || null,
        promised_delivery_date: manualForm.promised_delivery_date || null,
        drawings_due_date: manualForm.drawings_due_date || null,
        // Sales
        salesperson: manualForm.salesperson || null,
        // Notes
        long_lead_notes: manualForm.long_lead_notes || null,
        description: manualForm.description || null,
        // Meta
        imported_from: 'manual_entry',
        praxis_synced_at: new Date().toISOString(),
        created_by: user.id
      };

      // Insert project
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Log import
      await supabase.from('praxis_import_log').insert([{
        import_type: 'manual_entry',
        project_id: data.id,
        praxis_quote_number: projectData.praxis_quote_number,
        serial_number: projectData.serial_number,
        success_count: 1,
        imported_by: user.id,
        factory: projectData.factory
      }]);

      onSuccess(data);
      onClose();

    } catch (err) {
      console.error('Manual import error:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async () => {
    if (!csvData || !validationResult?.isValid) return;

    setLoading(true);
    setError('');

    try {
      const projects = [];
      const errors = [];

      // Transform all rows
      for (const row of csvData.rows) {
        try {
          const project = transformRowToProject(row, { dealers, users });
          project.created_by = user.id;
          projects.push(project);
        } catch (err) {
          errors.push(`Row ${row._rowNumber}: ${err.message}`);
        }
      }

      if (errors.length > 0 && projects.length === 0) {
        throw new Error(errors.join('\n'));
      }

      // Insert all projects
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert(projects)
        .select();

      if (insertError) throw insertError;

      // Log import
      await supabase.from('praxis_import_log').insert([{
        import_type: 'csv_import',
        source_file_name: csvFile?.name,
        row_count: csvData.rows.length,
        success_count: data.length,
        error_count: errors.length,
        errors: errors.length > 0 ? errors : null,
        imported_by: user.id
      }]);

      onSuccess(data);
      onClose();

    } catch (err) {
      console.error('CSV import error:', err);
      setError(err.message || 'Failed to import projects');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

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
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* ================================================================ */}
        {/* HEADER                                                          */}
        {/* ================================================================ */}
        <div style={{
          padding: 'var(--space-lg)',
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
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Import from Praxis
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                Create projects from Praxis Building Order data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* ================================================================ */}
        {/* TAB NAVIGATION                                                  */}
        {/* ================================================================ */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 var(--space-lg)'
        }}>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'manual' ? '2px solid var(--sunbelt-orange)' : '2px solid transparent',
              color: activeTab === 'manual' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'manual' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}
          >
            <Building2 size={18} /> Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'csv' ? '2px solid var(--sunbelt-orange)' : '2px solid transparent',
              color: activeTab === 'csv' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'csv' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}
          >
            <Upload size={18} /> CSV Import
          </button>
        </div>

        {/* ================================================================ */}
        {/* ERROR DISPLAY                                                   */}
        {/* ================================================================ */}
        {error && (
          <div style={{
            margin: 'var(--space-lg)',
            padding: 'var(--space-md)',
            background: 'var(--danger-light)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap'
          }}>
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            {error}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB CONTENT                                                     */}
        {/* ================================================================ */}
        <div style={{ padding: 'var(--space-lg)' }}>
          {activeTab === 'manual' ? (
            <ManualEntryForm
              formData={manualForm}
              onChange={handleManualChange}
              onSubmit={handleManualSubmit}
              dealers={dealers}
              loading={loading}
              factoryOptions={FACTORY_OPTIONS}
            />
          ) : (
            <CSVImportForm
              file={csvFile}
              csvData={csvData}
              validationResult={validationResult}
              previewData={previewData}
              showPreview={showPreview}
              setShowPreview={setShowPreview}
              onFileDrop={handleFileDrop}
              onFileSelect={handleFileSelect}
              onImport={handleCSVImport}
              onDownloadTemplate={downloadImportTemplate}
              fileInputRef={fileInputRef}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MANUAL ENTRY FORM COMPONENT
// ============================================================================

function ManualEntryForm({ formData, onChange, onSubmit, dealers, loading, factoryOptions }) {
  const [expandedSections, setExpandedSections] = useState({
    identification: true,
    building: true,
    dealer: false,
    costs: false,
    location: false,
    special: false,
    schedule: false,
    notes: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ section, title, icon: Icon }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        width: '100%',
        padding: 'var(--space-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        marginBottom: expandedSections[section] ? 'var(--space-md)' : 'var(--space-sm)',
        textAlign: 'left'
      }}
    >
      {expandedSections[section] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      {Icon && <Icon size={18} style={{ color: 'var(--sunbelt-orange)' }} />}
      <span style={{ fontWeight: '600', color: 'var(--text-primary)', flex: 1 }}>{title}</span>
    </button>
  );

  return (
    <form onSubmit={onSubmit}>
      {/* Identification */}
      <SectionHeader section="identification" title="Identification (from Praxis)" />
      {expandedSections.identification && (
        <div style={{ marginBottom: 'var(--space-lg)', paddingLeft: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Quote Number</label>
              <input
                type="text"
                name="praxis_quote_number"
                value={formData.praxis_quote_number}
                onChange={onChange}
                className="form-input"
                placeholder="e.g., NW-0061-2025"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={onChange}
                className="form-input"
                placeholder="e.g., 25239"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Folder Number</label>
              <input
                type="text"
                name="folder_number"
                value={formData.folder_number}
                onChange={onChange}
                className="form-input"
                placeholder="e.g., 251201"
              />
            </div>
          </div>
        </div>
      )}

      {/* Building Info */}
      <SectionHeader section="building" title="Building Information *" />
      {expandedSections.building && (
        <div style={{ marginBottom: 'var(--space-lg)', paddingLeft: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Building Description (Project Name) *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                required
                className="form-input"
                placeholder="e.g., 14x65 INL Restroom Facility"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Factory *</label>
              <select name="factory" value={formData.factory} onChange={onChange} required className="form-input">
                <option value="">Select factory</option>
                {factoryOptions.map(f => (
                  <option key={f.value} value={f.value}>{f.value}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select name="building_type" value={formData.building_type} onChange={onChange} className="form-input">
                <option value="">Select</option>
                {BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Height</label>
              <input type="number" name="building_height" value={formData.building_height} onChange={onChange} className="form-input" placeholder="ft" />
            </div>
            <div className="form-group">
              <label className="form-label">Width</label>
              <input type="number" name="building_width" value={formData.building_width} onChange={onChange} className="form-input" placeholder="ft" />
            </div>
            <div className="form-group">
              <label className="form-label">Length</label>
              <input type="number" name="building_length" value={formData.building_length} onChange={onChange} className="form-input" placeholder="ft" />
            </div>
            <div className="form-group">
              <label className="form-label">Stories</label>
              <input type="number" name="stories" value={formData.stories} onChange={onChange} className="form-input" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Modules</label>
              <input type="number" name="module_count" value={formData.module_count} onChange={onChange} className="form-input" min="1" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Module Size</label>
              <input type="text" name="module_size" value={formData.module_size} onChange={onChange} className="form-input" placeholder="e.g., 14x65" />
            </div>
            <div className="form-group">
              <label className="form-label">Interior Wall LF</label>
              <input type="number" name="interior_wall_lf" value={formData.interior_wall_lf} onChange={onChange} className="form-input" placeholder="Linear feet" />
            </div>
          </div>
        </div>
      )}

      {/* Dealer */}
      <SectionHeader section="dealer" title="Dealer Information" />
      {expandedSections.dealer && (
        <div style={{ marginBottom: 'var(--space-lg)', paddingLeft: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Dealer</label>
              <select name="dealer_id" value={formData.dealer_id} onChange={onChange} className="form-input">
                <option value="">Select dealer</option>
                {dealers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Branch</label>
              <input type="text" name="dealer_branch" value={formData.dealer_branch} onChange={onChange} className="form-input" placeholder="e.g., MOBMOD-BOISE" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Contact Name</label>
              <input type="text" name="dealer_contact_name" value={formData.dealer_contact_name} onChange={onChange} className="form-input" placeholder="e.g., Steve Haynie" />
            </div>
            <div className="form-group">
              <label className="form-label">Customer PO #</label>
              <input type="text" name="customer_po_number" value={formData.customer_po_number} onChange={onChange} className="form-input" placeholder="e.g., PO-2025-001" />
            </div>
          </div>
        </div>
      )}

      {/* Costs */}
      <SectionHeader section="costs" title="Cost Information" />
      {expandedSections.costs && (
        <div style={{ marginBottom: 'var(--space-lg)', paddingLeft: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Material Cost ($)</label>
              <input type="number" name="material_cost" value={formData.material_cost} onChange={onChange} className="form-input" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Factor</label>
              <input type="number" name="markup_factor" value={formData.markup_factor} onChange={onChange} className="form-input" step="0.001" placeholder="e.g., 0.500" />
            </div>
            <div className="form-group">
              <label className="form-label">Total Price ($)</label>
              <input type="number" name="contract_value" value={formData.contract_value} onChange={onChange} className="form-input" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Engineering ($)</label>
              <input type="number" name="engineering_cost" value={formData.engineering_cost} onChange={onChange} className="form-input" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Approvals ($)</label>
              <input type="number" name="approvals_cost" value={formData.approvals_cost} onChange={onChange} className="form-input" step="0.01" />
            </div>
          </div>
        </div>
      )}

      {/* Location & Compliance */}
      <SectionHeader section="location" title="Location & Compliance" />
      {expandedSections.location && (
        <div style={{ marginBottom: 'var(--space-lg)', paddingLeft: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Site Address</label>
              <input type="text" name="site_address" value={formData.site_address} onChange={onChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input type="text" name="site_city" value={formData.site_city} onChange={onChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input type="text" name="site_state" value={formData.site_state} onChange={onChange} className="form-input" maxLength={2} />
            </div>
            <div className="form-group">
              <label className="form-label">ZIP</label>
              <input type="text" name="site_zip" value={formData.site_zip} onChange={onChange} className="form-input" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">State Tags</label>
              <input type="text" name="state_tags" value={formData.state_tags} onChange={onChange} className="form-input" placeholder="e.g., WA" />
            </div>
            <div className="form-group">
              <label className="form-label">Climate Zone</label>
              <input type="number" name="climate_zone" value={formData.climate_zone} onChange={onChange} className="form-input" min="1" max="8" />
            </div>
            <div className="form-group">
              <label className="form-label">Floor Load (PSF)</label>
              <input type="number" name="floor_load_psf" value={formData.floor_load_psf} onChange={onChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Roof Load (PSF)</label>
              <input type="number" name="roof_load_psf" value={formData.roof_load_psf} onChange={onChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Occupancy</label>
              <select name="occupancy_type" value={formData.occupancy_type} onChange={onChange} className="form-input">
                <option value="">Select</option>
                {OCCUPANCY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Set Type</label>
              <select name="set_type" value={formData.set_type} onChange={onChange} className="form-input">
                <option value="">Select</option>
                {SET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Special Requirements */}
      <SectionHeader section="special" title="Special Requirements" />
      {expandedSections.special && (
        <div style={{ marginBottom: 'var(--space-lg)', paddingLeft: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Sprinkler Type</label>
              <select name="sprinkler_type" value={formData.sprinkler_type} onChange={onChange} className="form-input">
                <option value="">Select</option>
                {SPRINKLER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
            {[
              { name: 'requires_ttp', label: 'TT&P Required' },
              { name: 'has_plumbing', label: 'Has Plumbing' },
              { name: 'wui_compliant', label: 'WUI Compliant' },
              { name: 'requires_cut_sheets', label: 'Cut Sheets Required' },
              { name: 'requires_om_manuals', label: 'O&M Manuals Required' }
            ].map(({ name, label }) => (
              <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name={name}
                  checked={formData[name]}
                  onChange={onChange}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ color: 'var(--text-primary)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Schedule & Sales */}
      <SectionHeader section="schedule" title="Schedule & Sales" />
      {expandedSections.schedule && (
        <div style={{ marginBottom: 'var(--space-lg)', paddingLeft: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Date Sold</label>
              <input type="date" name="sold_date" value={formData.sold_date} onChange={onChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Promised Delivery</label>
              <input type="date" name="promised_delivery_date" value={formData.promised_delivery_date} onChange={onChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Drawings Due</label>
              <input type="date" name="drawings_due_date" value={formData.drawings_due_date} onChange={onChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Salesperson</label>
              <input type="text" name="salesperson" value={formData.salesperson} onChange={onChange} className="form-input" placeholder="e.g., Mitch Quintana" />
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <SectionHeader section="notes" title="Notes" />
      {expandedSections.notes && (
        <div style={{ marginBottom: 'var(--space-lg)', paddingLeft: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Long Lead Notes</label>
            <textarea name="long_lead_notes" value={formData.long_lead_notes} onChange={onChange} className="form-input" rows="2" placeholder="Notes about long lead items..." />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" value={formData.description} onChange={onChange} className="form-input" rows="3" placeholder="Project description..." />
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-color)' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><Loader size={16} className="spin" /> Creating...</> : <><Plus size={16} /> Create Project</>}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// CSV IMPORT FORM COMPONENT
// ============================================================================

function CSVImportForm({
  file, csvData, validationResult, previewData, showPreview, setShowPreview,
  onFileDrop, onFileSelect, onImport, onDownloadTemplate, fileInputRef, loading
}) {
  return (
    <div>
      {/* Template Download */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)',
        padding: 'var(--space-md)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-primary)' }}>Need a template?</p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Download a CSV template with all Praxis fields
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            type="button"
            onClick={() => onDownloadTemplate('csv')}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem' }}
          >
            <Download size={16} /> CSV Template
          </button>
          <button
            type="button"
            onClick={() => onDownloadTemplate('xlsx')}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem' }}
          >
            <Download size={16} /> Excel Template
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onFileDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
          marginBottom: 'var(--space-lg)',
          background: file ? 'var(--success-light)' : 'var(--bg-secondary)'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={onFileSelect}
          style={{ display: 'none' }}
        />
        {file ? (
          <>
            <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: 'var(--space-md)' }} />
            <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>
              {file.name}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 'var(--space-sm) 0 0 0' }}>
              {csvData ? `${csvData.rows.length} rows found` : 'Processing...'}
            </p>
          </>
        ) : (
          <>
            <Upload size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
            <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>
              Drop CSV or Excel file here
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 'var(--space-sm) 0 0 0' }}>
              or click to browse
            </p>
          </>
        )}
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          {validationResult.isValid ? (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--success-light)',
              border: '1px solid var(--success)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--success)', fontWeight: '500' }}>
                Validation passed - {csvData.rows.length} projects ready to import
              </span>
            </div>
          ) : (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
                <span style={{ color: 'var(--danger)', fontWeight: '500' }}>
                  Validation failed - {validationResult.errors.length} errors
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-lg)', color: 'var(--danger)', fontSize: '0.875rem' }}>
                {validationResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {validationResult.errors.length > 5 && (
                  <li>...and {validationResult.errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--warning-light)',
              border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-md)',
              marginTop: 'var(--space-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                <span style={{ color: 'var(--warning-dark)', fontWeight: '500' }}>
                  {validationResult.warnings.length} warnings
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-lg)', color: 'var(--warning-dark)', fontSize: '0.875rem' }}>
                {validationResult.warnings.slice(0, 3).map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
                {validationResult.warnings.length > 3 && (
                  <li>...and {validationResult.warnings.length - 3} more warnings</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {previewData.length > 0 && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginBottom: 'var(--space-md)'
            }}
          >
            {showPreview ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
              Preview (first {previewData.length} rows)
            </span>
          </button>

          {showPreview && (
            <div style={{
              overflowX: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Name</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Quote #</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Serial #</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Size</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px' }}>{p.name || '-'}</td>
                      <td style={{ padding: '8px' }}>{p.praxis_quote_number || '-'}</td>
                      <td style={{ padding: '8px' }}>{p.serial_number || '-'}</td>
                      <td style={{ padding: '8px' }}>{p.building_width && p.building_length ? `${p.building_width}x${p.building_length}` : '-'}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{p.contract_value ? `$${Number(p.contract_value).toLocaleString()}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Import Button */}
      {csvData && validationResult?.isValid && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={onImport}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <><Loader size={16} className="spin" /> Importing...</>
            ) : (
              <><Upload size={16} /> Import {csvData.rows.length} Project{csvData.rows.length > 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default PraxisImportModal;
