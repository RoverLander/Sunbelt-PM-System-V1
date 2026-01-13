// ============================================================================
// praxisImport.js - Praxis CSV Import and Export Utilities
// ============================================================================
// Handles importing project data from Praxis (Access-based estimating software)
// via CSV export, and generating import templates.
//
// Features:
// - CSV parsing with field mapping
// - Validation with error reporting
// - Template generation for Praxis export
// - Data transformation to Sunbelt PM schema
//
// Reference: docs/PRAXIS_INTEGRATION_ANALYSIS.md
// ============================================================================

import * as XLSX from 'xlsx';

// ============================================================================
// CONSTANTS - Field Mapping from Praxis to Sunbelt PM
// ============================================================================

/**
 * CSV column headers and their mapping to Sunbelt PM fields
 * Order matters for template generation
 */
export const PRAXIS_FIELD_MAP = {
  // === IDENTIFICATION ===
  'Quote Number': 'praxis_quote_number',
  'Serial Number': 'serial_number',
  'Folder Number': 'folder_number',

  // === BUILDING INFO ===
  'Building Description': 'name',
  'Building Type': 'building_type',
  'Height': 'building_height',
  'Width': 'building_width',
  'Length': 'building_length',
  'Interior Wall LF': 'interior_wall_lf',
  'Stories': 'stories',
  'Module Size': 'module_size',
  'Module Count': 'module_count',

  // === DEALER ===
  'Dealer Code': 'dealer_code',          // Used to lookup dealer_id
  'Dealer Branch': 'dealer_branch',
  'Dealer Contact': 'dealer_contact_name',
  'Customer PO': 'customer_po_number',

  // === COSTS ===
  'Material Cost': 'material_cost',
  'Factor': 'markup_factor',
  'Total Price': 'contract_value',
  'Engineering Cost': 'engineering_cost',
  'Approvals Cost': 'approvals_cost',

  // === LOCATION & COMPLIANCE ===
  'State Tags': 'state_tags',
  'Climate Zone': 'climate_zone',
  'Floor Load PSF': 'floor_load_psf',
  'Roof Load PSF': 'roof_load_psf',
  'Site Address': 'site_address',
  'Site City': 'site_city',
  'Site State': 'site_state',
  'Site ZIP': 'site_zip',
  'Occupancy Type': 'occupancy_type',
  'Set Type': 'set_type',

  // === SPECIAL REQUIREMENTS ===
  'TT&P Required': 'requires_ttp',
  'Sprinkler Type': 'sprinkler_type',
  'Has Plumbing': 'has_plumbing',
  'WUI Compliant': 'wui_compliant',
  'Cut Sheets Required': 'requires_cut_sheets',
  'O&M Manuals Required': 'requires_om_manuals',

  // === DATES ===
  'Date Sold': 'sold_date',
  'Promised Delivery': 'promised_delivery_date',
  'Drawings Due': 'drawings_due_date',

  // === SALES ===
  'Salesperson': 'salesperson',
  'Estimator': 'estimator_name',        // Used to lookup estimator_id

  // === FACTORY ===
  'Factory Code': 'praxis_source_factory',

  // === NOTES ===
  'Long Lead Notes': 'long_lead_notes',
  'Description': 'description'
};

// Reverse map for export
export const SUNBELT_TO_PRAXIS_MAP = Object.fromEntries(
  Object.entries(PRAXIS_FIELD_MAP).map(([k, v]) => [v, k])
);

// Required fields for import
export const REQUIRED_FIELDS = [
  'Building Description',  // name
  'Factory Code'          // factory
];

// Boolean fields that need conversion
export const BOOLEAN_FIELDS = [
  'requires_ttp',
  'has_plumbing',
  'wui_compliant',
  'requires_cut_sheets',
  'requires_om_manuals'
];

// Numeric fields that need parsing
export const NUMERIC_FIELDS = [
  'building_height',
  'building_width',
  'building_length',
  'interior_wall_lf',
  'stories',
  'module_count',
  'material_cost',
  'markup_factor',
  'contract_value',
  'engineering_cost',
  'approvals_cost',
  'climate_zone',
  'floor_load_psf',
  'roof_load_psf'
];

// Date fields that need parsing
export const DATE_FIELDS = [
  'sold_date',
  'promised_delivery_date',
  'drawings_due_date'
];

// Building type options (match Praxis)
export const BUILDING_TYPES = [
  'CUSTOM',
  'FLEET/STOCK',
  'GOVERNMENT',
  'Business'
];

// Set type options
export const SET_TYPES = [
  'PAD',
  'PIERS',
  'ABOVE GRADE SET'
];

// Sprinkler type options
export const SPRINKLER_TYPES = [
  'N/A',
  'Wet',
  'Dry'
];

// ============================================================================
// CSV PARSING
// ============================================================================

/**
 * Parse CSV file content into array of row objects
 * @param {string} csvContent - Raw CSV string
 * @returns {Object} { headers: string[], rows: Object[], errors: string[] }
 */
export const parseCSV = (csvContent) => {
  const errors = [];

  try {
    // Use SheetJS to parse CSV
    const workbook = XLSX.read(csvContent, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      errors.push('CSV file must have at least a header row and one data row');
      return { headers: [], rows: [], errors };
    }

    const headers = data[0].map(h => String(h).trim());
    const rows = [];

    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const rowData = data[i];
      if (!rowData || rowData.length === 0) continue; // Skip empty rows

      const row = {};
      headers.forEach((header, idx) => {
        row[header] = rowData[idx] !== undefined ? String(rowData[idx]).trim() : '';
      });

      // Skip rows where all values are empty
      if (Object.values(row).every(v => !v)) continue;

      row._rowNumber = i + 1; // Track original row number for error reporting
      rows.push(row);
    }

    return { headers, rows, errors };

  } catch (err) {
    errors.push(`CSV parsing error: ${err.message}`);
    return { headers: [], rows: [], errors };
  }
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a single row of CSV data
 * @param {Object} row - Row data object
 * @param {number} rowIndex - Row index for error messages
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[] }
 */
export const validateRow = (row, rowIndex) => {
  const errors = [];
  const warnings = [];
  const rowNum = row._rowNumber || rowIndex + 1;

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    if (!row[field] || row[field].trim() === '') {
      errors.push(`Row ${rowNum}: Missing required field "${field}"`);
    }
  });

  // Validate building type if provided
  if (row['Building Type'] && !BUILDING_TYPES.includes(row['Building Type'].toUpperCase())) {
    warnings.push(`Row ${rowNum}: Unknown building type "${row['Building Type']}", will be stored as-is`);
  }

  // Validate set type if provided
  if (row['Set Type'] && !SET_TYPES.includes(row['Set Type'].toUpperCase())) {
    warnings.push(`Row ${rowNum}: Unknown set type "${row['Set Type']}", will be stored as-is`);
  }

  // Validate sprinkler type if provided
  if (row['Sprinkler Type'] && !SPRINKLER_TYPES.includes(row['Sprinkler Type'])) {
    warnings.push(`Row ${rowNum}: Unknown sprinkler type "${row['Sprinkler Type']}", will be stored as-is`);
  }

  // Validate numeric fields
  const numericCsvFields = ['Height', 'Width', 'Length', 'Stories', 'Module Count',
                           'Material Cost', 'Factor', 'Total Price', 'Climate Zone',
                           'Floor Load PSF', 'Roof Load PSF'];
  numericCsvFields.forEach(field => {
    if (row[field] && row[field] !== '' && isNaN(parseFloat(row[field]))) {
      errors.push(`Row ${rowNum}: Invalid number for "${field}": ${row[field]}`);
    }
  });

  // Validate date fields
  const dateCsvFields = ['Date Sold', 'Promised Delivery', 'Drawings Due'];
  dateCsvFields.forEach(field => {
    if (row[field] && row[field] !== '') {
      const dateVal = new Date(row[field]);
      if (isNaN(dateVal.getTime())) {
        errors.push(`Row ${rowNum}: Invalid date for "${field}": ${row[field]}`);
      }
    }
  });

  // Validate quote number format (optional, just warn)
  if (row['Quote Number']) {
    const quotePattern = /^[A-Z]{2,4}-\d{4}-\d{4}$/;
    if (!quotePattern.test(row['Quote Number'])) {
      warnings.push(`Row ${rowNum}: Quote number "${row['Quote Number']}" doesn't match expected format (e.g., NW-0061-2025)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate all rows in CSV data
 * @param {Object[]} rows - Array of row objects
 * @returns {Object} { isValid: boolean, errors: string[], warnings: string[] }
 */
export const validateCSV = (rows) => {
  const allErrors = [];
  const allWarnings = [];

  if (rows.length === 0) {
    allErrors.push('No data rows found in CSV');
    return { isValid: false, errors: allErrors, warnings: allWarnings };
  }

  rows.forEach((row, idx) => {
    const { errors, warnings } = validateRow(row, idx);
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Convert boolean string values to actual booleans
 */
const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  const str = String(value).toLowerCase().trim();
  return ['true', 'yes', '1', 'y', 'x'].includes(str);
};

/**
 * Parse date string to ISO format
 */
const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

/**
 * Parse numeric value
 */
const parseNumber = (value, isInteger = false) => {
  if (!value && value !== 0) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  return isInteger ? Math.round(num) : num;
};

/**
 * Transform a CSV row to Sunbelt PM project data
 * @param {Object} row - CSV row object
 * @param {Object} options - { dealers: [], users: [], factory: string }
 * @returns {Object} Transformed project data
 */
export const transformRowToProject = (row, options = {}) => {
  const { dealers = [], users = [], defaultFactory = '' } = options;
  const project = {};

  // Map each CSV field to Sunbelt PM field
  Object.entries(PRAXIS_FIELD_MAP).forEach(([csvField, dbField]) => {
    const value = row[csvField];

    // Skip special lookup fields
    if (dbField === 'dealer_code' || dbField === 'estimator_name') return;

    // Handle boolean fields
    if (BOOLEAN_FIELDS.includes(dbField)) {
      project[dbField] = parseBoolean(value);
      return;
    }

    // Handle date fields
    if (DATE_FIELDS.includes(dbField)) {
      project[dbField] = parseDate(value);
      return;
    }

    // Handle numeric fields
    if (NUMERIC_FIELDS.includes(dbField)) {
      const isInteger = ['building_height', 'building_width', 'building_length',
                        'interior_wall_lf', 'stories', 'module_count',
                        'climate_zone', 'floor_load_psf', 'roof_load_psf'].includes(dbField);
      project[dbField] = parseNumber(value, isInteger);
      return;
    }

    // String fields
    project[dbField] = value || null;
  });

  // Lookup dealer_id from dealer_code
  if (row['Dealer Code'] && dealers.length > 0) {
    const dealer = dealers.find(d =>
      d.code.toLowerCase() === row['Dealer Code'].toLowerCase()
    );
    if (dealer) {
      project.dealer_id = dealer.id;
    }
  }

  // Lookup estimator_id from estimator name
  if (row['Estimator'] && users.length > 0) {
    const estimator = users.find(u =>
      u.name.toLowerCase() === row['Estimator'].toLowerCase()
    );
    if (estimator) {
      project.estimator_id = estimator.id;
    }
  }

  // Map factory code to full factory value
  if (project.praxis_source_factory) {
    project.factory = mapFactoryCodeToValue(project.praxis_source_factory);
  } else if (defaultFactory) {
    project.factory = defaultFactory;
  }

  // Set import metadata
  project.imported_from = 'csv_import';
  project.praxis_synced_at = new Date().toISOString();

  // Default status for new imports
  project.status = 'Pre-PM';

  return project;
};

/**
 * Map Praxis factory code to Sunbelt PM factory value
 */
export const mapFactoryCodeToValue = (code) => {
  const factoryMap = {
    'NW': 'NWBS - Northwest Building Systems',
    'NWBS': 'NWBS - Northwest Building Systems',
    'WM': 'WM-EVERGREEN - Whitley Manufacturing Evergreen',
    'WE': 'WM-EVERGREEN - Whitley Manufacturing Evergreen',
    'PMI': 'PMI - Phoenix Modular',
    'SMM': 'SMM - Southeast Modular',
    'AMT': 'AMT - AMTEX',
    'C&B': 'C&B - C&B Modular',
    'IBI': 'IBI - Indicom Buildings',
    'MRS': 'MRS - MR Steel',
    'PRM': 'PRM - Pro-Mod Manufacturing',
    'SSI': 'SSI - Specialized Structures',
    'BUSA': 'BUSA - Britco USA'
  };

  return factoryMap[code.toUpperCase()] || code;
};

// ============================================================================
// TEMPLATE GENERATION
// ============================================================================

/**
 * Generate a blank CSV template for Praxis export
 * @returns {Blob} CSV file blob
 */
export const generateImportTemplate = () => {
  // Headers in order
  const headers = Object.keys(PRAXIS_FIELD_MAP);

  // Sample row with example values
  const sampleRow = [
    'NW-0061-2025',      // Quote Number
    '25239',             // Serial Number
    '251201',            // Folder Number
    '14x65 INL Restroom Facility', // Building Description
    'CUSTOM',            // Building Type
    '11',                // Height
    '14',                // Width
    '65',                // Length
    '26',                // Interior Wall LF
    '1',                 // Stories
    '14x65',             // Module Size
    '1',                 // Module Count
    'PMSI',              // Dealer Code
    'MOBMOD-BOISE',      // Dealer Branch
    'Steve Haynie',      // Dealer Contact
    'PO-2025-001',       // Customer PO
    '85303.59',          // Material Cost
    '0.500',             // Factor
    '184824.33',         // Total Price
    '1800.00',           // Engineering Cost
    '1922.00',           // Approvals Cost
    'WA',                // State Tags
    '5',                 // Climate Zone
    '40',                // Floor Load PSF
    '30',                // Roof Load PSF
    '123 Main St',       // Site Address
    'Seattle',           // Site City
    'WA',                // Site State
    '98101',             // Site ZIP
    'B',                 // Occupancy Type
    'PAD',               // Set Type
    'No',                // TT&P Required
    'Wet',               // Sprinkler Type
    'Yes',               // Has Plumbing
    'No',                // WUI Compliant
    'Yes',               // Cut Sheets Required
    'Yes',               // O&M Manuals Required
    '2025-05-08',        // Date Sold
    '2025-08-15',        // Promised Delivery
    '2025-06-01',        // Drawings Due
    'Mitch Quintana',    // Salesperson
    'Hank Smith',        // Estimator
    'NW',                // Factory Code
    'HVAC unit has 6-week lead time', // Long Lead Notes
    'Custom restroom facility with ADA compliance' // Description
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

  // Set column widths
  const colWidths = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Praxis Import Template');

  // Add instructions sheet
  const instructions = [
    ['Praxis Import Template - Instructions'],
    [''],
    ['Required Fields:'],
    ['- Building Description: Project name'],
    ['- Factory Code: NW, WM, PMI, etc.'],
    [''],
    ['Optional but Recommended:'],
    ['- Quote Number: Format like NW-0061-2025'],
    ['- Serial Number: Auto-generated by Praxis when sold'],
    ['- Dealer Code: PMSI, MMG, US MOD, United Rentals'],
    [''],
    ['Data Format Notes:'],
    ['- Dates: Use YYYY-MM-DD format (e.g., 2025-05-08)'],
    ['- Boolean fields: Use Yes/No, True/False, or 1/0'],
    ['- Numbers: Use decimal point (e.g., 0.500 not 0,500)'],
    [''],
    ['Building Types: CUSTOM, FLEET/STOCK, GOVERNMENT, Business'],
    ['Set Types: PAD, PIERS, ABOVE GRADE SET'],
    ['Sprinkler Types: N/A, Wet, Dry'],
    ['Occupancy Types: A, B, E, I-2, etc.'],
    [''],
    ['Factory Codes:'],
    ['- NW/NWBS: Northwest Building Systems'],
    ['- WM/WE: Whitley Manufacturing Evergreen'],
    ['- PMI: Phoenix Modular'],
    ['- SMM: Southeast Modular'],
    [''],
    ['Tip: Delete this sample row before importing real data!']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Generate file
  const wbout = XLSX.write(wb, { bookType: 'csv', type: 'array' });
  return new Blob([wbout], { type: 'text/csv' });
};

/**
 * Generate Excel template (more professional with styling)
 * @returns {Blob} XLSX file blob
 */
export const generateImportTemplateExcel = () => {
  const headers = Object.keys(PRAXIS_FIELD_MAP);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  // Set column widths
  const colWidths = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Praxis Import');

  // Add instructions sheet
  const instructions = [
    ['Praxis Import Template - Instructions'],
    [''],
    ['Required Fields:'],
    ['- Building Description (Project name)'],
    ['- Factory Code (NW, WM, PMI, etc.)'],
    [''],
    ['Data Format Notes:'],
    ['- Dates: YYYY-MM-DD format'],
    ['- Boolean fields: Yes/No or True/False'],
    ['- Numbers: Use decimal point'],
    [''],
    ['See PRAXIS_INTEGRATION_ANALYSIS.md for full field documentation']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Download template file
 * @param {string} format - 'csv' or 'xlsx'
 */
export const downloadImportTemplate = (format = 'csv') => {
  const blob = format === 'xlsx'
    ? generateImportTemplateExcel()
    : generateImportTemplate();

  const filename = format === 'xlsx'
    ? 'praxis_import_template.xlsx'
    : 'praxis_import_template.csv';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// FULL IMPORT PROCESS
// ============================================================================

/**
 * Process a complete CSV import
 * @param {string} csvContent - Raw CSV string content
 * @param {Object} options - { dealers, users, factory, userId }
 * @returns {Object} { success: boolean, projects: [], errors: [], warnings: [], stats: {} }
 */
export const processCSVImport = (csvContent, options = {}) => {
  const result = {
    success: false,
    projects: [],
    errors: [],
    warnings: [],
    stats: {
      total: 0,
      valid: 0,
      invalid: 0
    }
  };

  // Step 1: Parse CSV
  const { headers, rows, errors: parseErrors } = parseCSV(csvContent);
  if (parseErrors.length > 0) {
    result.errors.push(...parseErrors);
    return result;
  }

  result.stats.total = rows.length;

  // Step 2: Validate
  const { isValid, errors: validationErrors, warnings } = validateCSV(rows);
  result.warnings.push(...warnings);

  if (!isValid) {
    result.errors.push(...validationErrors);
    result.stats.invalid = rows.length;
    return result;
  }

  // Step 3: Transform each row
  const validProjects = [];
  rows.forEach((row, idx) => {
    try {
      const project = transformRowToProject(row, options);
      project._sourceRow = row._rowNumber || idx + 2;
      validProjects.push(project);
      result.stats.valid++;
    } catch (err) {
      result.errors.push(`Row ${row._rowNumber || idx + 2}: Transform error - ${err.message}`);
      result.stats.invalid++;
    }
  });

  result.projects = validProjects;
  result.success = result.errors.length === 0;

  return result;
};
