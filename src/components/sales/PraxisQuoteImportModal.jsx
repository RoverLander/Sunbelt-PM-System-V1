// ============================================================================
// PraxisQuoteImportModal.jsx
// ============================================================================
// Modal for importing QUOTES from Praxis (Access-based estimating software)
// Unlike PraxisImportModal which creates projects, this creates sales_quotes.
//
// FEATURES:
// - Tab switching between Manual Entry and CSV Import
// - CSV file upload with drag-and-drop
// - Validation with error/warning display
// - Preview of data before import
// - Download template functionality
// - Multi-quote import from CSV
//
// Reference: docs/PRAXIS_INTEGRATION_ANALYSIS.md
// ============================================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, AlertCircle,
  Download, Building2, Loader, ChevronRight, ChevronDown, Plus, Trash2, FileText
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

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

const BUILDING_TYPES = ['CUSTOM', 'FLEET/STOCK', 'GOVERNMENT', 'Business'];
const SET_TYPES = ['PAD', 'PIERS', 'ABOVE GRADE SET'];
const SPRINKLER_TYPES = ['N/A', 'Wet', 'Dry'];
const OCCUPANCY_TYPES = ['A', 'A-1', 'A-2', 'A-3', 'B', 'E', 'F', 'H', 'I', 'I-2', 'M', 'R', 'S', 'U'];

const QUOTE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent to Customer' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'awaiting_po', label: 'Awaiting PO' },
  { value: 'po_received', label: 'PO Received' }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function PraxisQuoteImportModal({ isOpen, onClose, onSuccess, customers = [] }) {
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

  // Dealers for lookup
  const [dealers, setDealers] = useState([]);

  // Manual entry state
  const [manualForm, setManualForm] = useState({
    // Identification
    praxis_quote_number: '',
    project_name: '',
    // Building
    building_type: '',
    building_width: '',
    building_length: '',
    square_footage: '',
    module_count: '1',
    stories: '1',
    // Location
    project_location: '',
    project_city: '',
    project_state: '',
    state_tags: '',
    // Compliance
    climate_zone: '',
    occupancy_type: '',
    set_type: '',
    sprinkler_type: '',
    has_plumbing: false,
    wui_compliant: false,
    // Dealer
    dealer_id: '',
    dealer_contact_name: '',
    // Pricing
    total_price: '',
    // Pipeline
    outlook_percentage: '',
    waiting_on: '',
    expected_close_timeframe: '',
    difficulty_rating: '',
    // Schedule
    promised_delivery_date: '',
    quote_due_date: '',
    // Factory
    factory: '',
    // Status
    status: 'draft',
    // Notes
    project_description: ''
  });

  // Collapsed sections for manual form
  const [expandedSections, setExpandedSections] = useState({
    identification: true,
    building: true,
    location: false,
    compliance: false,
    dealer: false,
    pricing: false,
    pipeline: false,
    schedule: false,
    notes: false
  });

  // =========================================================================
  // EFFECTS
  // =========================================================================
  useEffect(() => {
    if (isOpen) {
      fetchDealers();
    }
  }, [isOpen]);

  // =========================================================================
  // DATA FETCHING
  // =========================================================================
  const fetchDealers = async () => {
    const { data } = await supabase
      .from('dealers')
      .select('id, code, name, branch_code, branch_name')
      .eq('is_active', true)
      .order('name');
    setDealers(data || []);
  };

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleManualChange = (e) => {
    const { name, value, type, checked } = e.target;
    setManualForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-calculate square footage
    if (name === 'building_width' || name === 'building_length') {
      const width = name === 'building_width' ? parseInt(value) || 0 : parseInt(manualForm.building_width) || 0;
      const length = name === 'building_length' ? parseInt(value) || 0 : parseInt(manualForm.building_length) || 0;
      if (width > 0 && length > 0) {
        setManualForm(prev => ({
          ...prev,
          square_footage: String(width * length)
        }));
      }
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const generateQuoteNumber = () => {
    const factory = manualForm.factory ? manualForm.factory.split(' - ')[0] : 'QT';
    const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    const year = new Date().getFullYear();
    return `${factory}-${seq}-${year}`;
  };

  // =========================================================================
  // FORM SUBMISSION
  // =========================================================================
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Generate quote number if not provided
      const quoteNumber = manualForm.praxis_quote_number || generateQuoteNumber();

      // Build the quote object
      const quoteData = {
        quote_number: quoteNumber,
        praxis_quote_number: manualForm.praxis_quote_number || null,
        praxis_source_factory: manualForm.factory ? manualForm.factory.split(' - ')[0] : null,
        project_name: manualForm.project_name,
        project_description: manualForm.project_description,
        project_location: manualForm.project_location,
        project_city: manualForm.project_city,
        project_state: manualForm.project_state,
        factory: manualForm.factory ? manualForm.factory.split(' - ')[0] : null,
        total_price: manualForm.total_price ? parseFloat(manualForm.total_price) : null,
        status: manualForm.status || 'draft',
        // Building specs
        building_type: manualForm.building_type || null,
        building_width: manualForm.building_width ? parseInt(manualForm.building_width) : null,
        building_length: manualForm.building_length ? parseInt(manualForm.building_length) : null,
        square_footage: manualForm.square_footage ? parseInt(manualForm.square_footage) : null,
        module_count: manualForm.module_count ? parseInt(manualForm.module_count) : 1,
        stories: manualForm.stories ? parseInt(manualForm.stories) : 1,
        // Compliance
        state_tags: manualForm.state_tags || null,
        climate_zone: manualForm.climate_zone ? parseInt(manualForm.climate_zone) : null,
        occupancy_type: manualForm.occupancy_type || null,
        set_type: manualForm.set_type || null,
        sprinkler_type: manualForm.sprinkler_type || null,
        has_plumbing: manualForm.has_plumbing,
        wui_compliant: manualForm.wui_compliant,
        // Dealer
        dealer_id: manualForm.dealer_id || null,
        dealer_contact_name: manualForm.dealer_contact_name || null,
        // Pipeline
        outlook_percentage: manualForm.outlook_percentage ? parseInt(manualForm.outlook_percentage) : null,
        waiting_on: manualForm.waiting_on || null,
        expected_close_timeframe: manualForm.expected_close_timeframe || null,
        difficulty_rating: manualForm.difficulty_rating ? parseInt(manualForm.difficulty_rating) : null,
        // Schedule
        promised_delivery_date: manualForm.promised_delivery_date || null,
        quote_due_date: manualForm.quote_due_date || null,
        // Tracking
        imported_from: 'manual_entry',
        praxis_synced_at: new Date().toISOString(),
        assigned_to: user?.id,
        created_by: user?.id
      };

      const { data, error: insertError } = await supabase
        .from('sales_quotes')
        .insert([quoteData])
        .select()
        .single();

      if (insertError) throw insertError;

      onSuccess?.(data);
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import quote');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // CSV HANDLING
  // =========================================================================
  const handleFileSelect = async (file) => {
    if (!file) return;

    setCsvFile(file);
    setError('');
    setValidationResult(null);

    try {
      // Read file content
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));

      if (rows.length < 2) {
        setError('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = rows[0];
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell));

      setCsvData({ headers, rows: dataRows });

      // Basic validation
      const errors = [];
      const warnings = [];

      dataRows.forEach((row, idx) => {
        if (!row[0] && !row[1]) {
          warnings.push(`Row ${idx + 2}: Missing quote number or project name`);
        }
      });

      setValidationResult({
        valid: errors.length === 0,
        errors,
        warnings,
        rowCount: dataRows.length
      });

    } catch (err) {
      setError('Failed to parse CSV file: ' + err.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      handleFileSelect(file);
    } else {
      setError('Please upload a CSV or Excel file');
    }
  };

  const handleCsvImport = async () => {
    if (!csvData || !validationResult?.valid) return;

    setLoading(true);
    setError('');

    try {
      const headers = csvData.headers;
      const quotes = csvData.rows.map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h.toLowerCase().replace(/\s+/g, '_')] = row[i];
        });
        return {
          quote_number: obj.quote_number || obj.praxis_quote_number || generateQuoteNumber(),
          praxis_quote_number: obj.praxis_quote_number || null,
          project_name: obj.project_name || obj.name || 'Imported Quote',
          project_description: obj.description || obj.notes || null,
          factory: obj.factory || null,
          total_price: obj.total_price ? parseFloat(obj.total_price) : null,
          status: 'draft',
          building_type: obj.building_type || null,
          square_footage: obj.square_footage ? parseInt(obj.square_footage) : null,
          module_count: obj.module_count ? parseInt(obj.module_count) : 1,
          imported_from: 'csv_import',
          praxis_synced_at: new Date().toISOString(),
          assigned_to: user?.id,
          created_by: user?.id
        };
      });

      const { data, error: insertError } = await supabase
        .from('sales_quotes')
        .insert(quotes)
        .select();

      if (insertError) throw insertError;

      onSuccess?.(data);
    } catch (err) {
      console.error('CSV import error:', err);
      setError(err.message || 'Failed to import quotes from CSV');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Quote Number', 'Project Name', 'Factory', 'Building Type', 'Square Footage',
      'Module Count', 'Stories', 'Total Price', 'State', 'City', 'Dealer', 'Notes'
    ];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'praxis_quote_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================
  const renderSection = (title, key, children) => (
    <div style={{ marginBottom: '16px' }}>
      <button
        type="button"
        onClick={() => toggleSection(key)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: expandedSections[key] ? '8px 8px 0 0' : '8px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontWeight: '600',
          fontSize: '0.875rem'
        }}
      >
        {title}
        {expandedSections[key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {expandedSections[key] && (
        <div style={{
          padding: '16px',
          border: '1px solid var(--border-color)',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          background: 'var(--bg-secondary)'
        }}>
          {children}
        </div>
      )}
    </div>
  );

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '0.875rem'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: '500'
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={24} style={{ color: 'var(--sunbelt-orange)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              Import Quote from Praxis
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 20px'
        }}>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'manual' ? '2px solid var(--sunbelt-orange)' : '2px solid transparent',
              color: activeTab === 'manual' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'csv' ? '2px solid var(--sunbelt-orange)' : '2px solid transparent',
              color: activeTab === 'csv' ? 'var(--sunbelt-orange)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            CSV Import
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Error display */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              marginBottom: '16px',
              color: '#ef4444',
              fontSize: '0.875rem'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Manual Entry Tab */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit}>
              {/* Identification Section */}
              {renderSection('Quote Identification', 'identification', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Praxis Quote Number</label>
                    <input
                      name="praxis_quote_number"
                      value={manualForm.praxis_quote_number}
                      onChange={handleManualChange}
                      placeholder="e.g., NW-0061-2025"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Project Name *</label>
                    <input
                      name="project_name"
                      value={manualForm.project_name}
                      onChange={handleManualChange}
                      required
                      placeholder="e.g., Lincoln Elementary"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Factory *</label>
                    <select
                      name="factory"
                      value={manualForm.factory}
                      onChange={handleManualChange}
                      required
                      style={inputStyle}
                    >
                      <option value="">Select factory</option>
                      {FACTORY_OPTIONS.map(f => (
                        <option key={f.code} value={f.value}>{f.value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select
                      name="status"
                      value={manualForm.status}
                      onChange={handleManualChange}
                      style={inputStyle}
                    >
                      {QUOTE_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              {/* Building Section */}
              {renderSection('Building Specifications', 'building', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Building Type</label>
                    <select
                      name="building_type"
                      value={manualForm.building_type}
                      onChange={handleManualChange}
                      style={inputStyle}
                    >
                      <option value="">Select type</option>
                      {BUILDING_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Width (ft)</label>
                    <input
                      name="building_width"
                      type="number"
                      value={manualForm.building_width}
                      onChange={handleManualChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Length (ft)</label>
                    <input
                      name="building_length"
                      type="number"
                      value={manualForm.building_length}
                      onChange={handleManualChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Square Footage</label>
                    <input
                      name="square_footage"
                      type="number"
                      value={manualForm.square_footage}
                      onChange={handleManualChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Module Count</label>
                    <input
                      name="module_count"
                      type="number"
                      value={manualForm.module_count}
                      onChange={handleManualChange}
                      min="1"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Stories</label>
                    <input
                      name="stories"
                      type="number"
                      value={manualForm.stories}
                      onChange={handleManualChange}
                      min="1"
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}

              {/* Pricing Section */}
              {renderSection('Pricing', 'pricing', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Total Price ($)</label>
                    <input
                      name="total_price"
                      type="number"
                      value={manualForm.total_price}
                      onChange={handleManualChange}
                      placeholder="e.g., 500000"
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}

              {/* Dealer Section */}
              {renderSection('Dealer Information', 'dealer', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Dealer</label>
                    <select
                      name="dealer_id"
                      value={manualForm.dealer_id}
                      onChange={handleManualChange}
                      style={inputStyle}
                    >
                      <option value="">Select dealer</option>
                      {dealers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Name</label>
                    <input
                      name="dealer_contact_name"
                      value={manualForm.dealer_contact_name}
                      onChange={handleManualChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}

              {/* Location Section */}
              {renderSection('Location', 'location', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Address</label>
                    <input
                      name="project_location"
                      value={manualForm.project_location}
                      onChange={handleManualChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input
                      name="project_city"
                      value={manualForm.project_city}
                      onChange={handleManualChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input
                      name="project_state"
                      value={manualForm.project_state}
                      onChange={handleManualChange}
                      maxLength={2}
                      placeholder="e.g., CA"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>State Tags</label>
                    <input
                      name="state_tags"
                      value={manualForm.state_tags}
                      onChange={handleManualChange}
                      placeholder="e.g., CA, OR, WA"
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}

              {/* Pipeline Section */}
              {renderSection('Pipeline Tracking', 'pipeline', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Outlook %</label>
                    <input
                      name="outlook_percentage"
                      type="number"
                      value={manualForm.outlook_percentage}
                      onChange={handleManualChange}
                      min="0"
                      max="100"
                      placeholder="e.g., 75"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Difficulty (1-5)</label>
                    <input
                      name="difficulty_rating"
                      type="number"
                      value={manualForm.difficulty_rating}
                      onChange={handleManualChange}
                      min="1"
                      max="5"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Waiting On</label>
                    <input
                      name="waiting_on"
                      value={manualForm.waiting_on}
                      onChange={handleManualChange}
                      placeholder="e.g., PO, Sign Off, Colors"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Expected Close</label>
                    <input
                      name="expected_close_timeframe"
                      value={manualForm.expected_close_timeframe}
                      onChange={handleManualChange}
                      placeholder="e.g., Q1 2026"
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}

              {/* Schedule Section */}
              {renderSection('Schedule', 'schedule', (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Quote Due Date</label>
                    <input
                      name="quote_due_date"
                      type="date"
                      value={manualForm.quote_due_date}
                      onChange={handleManualChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Promised Delivery</label>
                    <input
                      name="promised_delivery_date"
                      type="date"
                      value={manualForm.promised_delivery_date}
                      onChange={handleManualChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}

              {/* Notes Section */}
              {renderSection('Notes', 'notes', (
                <div>
                  <label style={labelStyle}>Description / Notes</label>
                  <textarea
                    name="project_description"
                    value={manualForm.project_description}
                    onChange={handleManualChange}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              ))}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.9375rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '20px'
                }}
              >
                {loading ? (
                  <>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Import Quote
                  </>
                )}
              </button>
            </form>
          )}

          {/* CSV Import Tab */}
          {activeTab === 'csv' && (
            <div>
              {/* Download Template */}
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={downloadTemplate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  <Download size={16} />
                  Download CSV Template
                </button>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: csvFile ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-tertiary)'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                {csvFile ? (
                  <>
                    <FileSpreadsheet size={40} style={{ color: 'var(--success)', marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{csvFile.name}</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                      {validationResult?.rowCount} quotes found
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      Drag & drop CSV or Excel file here
                    </p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                      or click to browse
                    </p>
                  </>
                )}
              </div>

              {/* Validation Results */}
              {validationResult && (
                <div style={{ marginTop: '20px' }}>
                  {validationResult.errors.length > 0 && (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#ef4444' }}>
                        <AlertCircle size={16} />
                        <strong>Errors ({validationResult.errors.length})</strong>
                      </div>
                      {validationResult.errors.map((err, i) => (
                        <p key={i} style={{ margin: '4px 0', fontSize: '0.875rem', color: '#ef4444' }}>{err}</p>
                      ))}
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#f59e0b' }}>
                        <AlertTriangle size={16} />
                        <strong>Warnings ({validationResult.warnings.length})</strong>
                      </div>
                      {validationResult.warnings.slice(0, 5).map((warn, i) => (
                        <p key={i} style={{ margin: '4px 0', fontSize: '0.875rem', color: '#f59e0b' }}>{warn}</p>
                      ))}
                      {validationResult.warnings.length > 5 && (
                        <p style={{ margin: '4px 0', fontSize: '0.875rem', color: '#f59e0b' }}>
                          ...and {validationResult.warnings.length - 5} more
                        </p>
                      )}
                    </div>
                  )}

                  {validationResult.valid && (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#22c55e'
                    }}>
                      <CheckCircle size={16} />
                      Ready to import {validationResult.rowCount} quotes
                    </div>
                  )}
                </div>
              )}

              {/* Import Button */}
              {validationResult?.valid && (
                <button
                  onClick={handleCsvImport}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: loading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-orange-dark))',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.9375rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '20px'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Import {validationResult.rowCount} Quotes
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PraxisQuoteImportModal;
