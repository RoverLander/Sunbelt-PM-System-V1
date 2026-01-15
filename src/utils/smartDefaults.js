// ============================================================================
// smartDefaults.js - Department-Based Smart Contact Suggestions
// ============================================================================
// Auto-suggests contacts based on item type and category.
// Uses department codes from the departments table.
//
// Department Codes: EXECUTIVE, ACCOUNTING, HR, MARKETING, SALES, OPERATIONS,
//                   PRODUCTION, PURCHASING, ENGINEERING, DRAFTING, QUALITY,
//                   SAFETY, IT, SERVICE
//
// Created: January 14, 2026
// ============================================================================

// ============================================================================
// SMART SUGGESTION MAPPINGS
// ============================================================================

/**
 * RFI Type to Department Mapping
 * Maps RFI categories/types to suggested department codes
 */
export const RFI_DEPARTMENT_SUGGESTIONS = {
  // Technical RFIs
  'technical': ['ENGINEERING', 'DRAFTING'],
  'structural': ['ENGINEERING'],
  'electrical': ['ENGINEERING'],
  'mechanical': ['ENGINEERING'],
  'plumbing': ['ENGINEERING'],

  // Drawing-related RFIs
  'drawing': ['DRAFTING', 'ENGINEERING'],
  'blueprint': ['DRAFTING'],
  'layout': ['DRAFTING', 'ENGINEERING'],
  'design': ['DRAFTING', 'ENGINEERING'],

  // Material/Purchasing RFIs
  'material': ['PURCHASING', 'PRODUCTION'],
  'procurement': ['PURCHASING'],
  'vendor': ['PURCHASING'],
  'supplier': ['PURCHASING'],
  'cost': ['PURCHASING', 'ACCOUNTING'],
  'pricing': ['PURCHASING', 'SALES'],

  // Quality RFIs
  'quality': ['QUALITY', 'ENGINEERING'],
  'inspection': ['QUALITY'],
  'spec': ['QUALITY', 'ENGINEERING'],
  'specification': ['QUALITY', 'ENGINEERING'],

  // Production RFIs
  'production': ['PRODUCTION', 'OPERATIONS'],
  'manufacturing': ['PRODUCTION'],
  'assembly': ['PRODUCTION'],
  'fabrication': ['PRODUCTION'],

  // Safety RFIs
  'safety': ['SAFETY', 'QUALITY'],
  'compliance': ['SAFETY', 'QUALITY'],

  // Default for general RFIs
  'default': ['ENGINEERING', 'DRAFTING']
};

/**
 * Submittal Type to Department Mapping
 */
export const SUBMITTAL_DEPARTMENT_SUGGESTIONS = {
  // Engineering submittals
  'engineering': ['ENGINEERING'],
  'structural': ['ENGINEERING'],
  'calculations': ['ENGINEERING'],

  // Drawing submittals
  'drawing': ['DRAFTING', 'ENGINEERING'],
  'shop drawing': ['DRAFTING'],
  'as-built': ['DRAFTING'],

  // Material submittals
  'material': ['PURCHASING', 'QUALITY'],
  'product data': ['PURCHASING', 'ENGINEERING'],
  'sample': ['QUALITY', 'PURCHASING'],

  // Quality submittals
  'quality': ['QUALITY'],
  'test report': ['QUALITY'],
  'certification': ['QUALITY'],
  'warranty': ['QUALITY', 'SERVICE'],

  // O&M submittals
  'o&m': ['SERVICE', 'ENGINEERING'],
  'manual': ['SERVICE', 'ENGINEERING'],

  // Default for general submittals
  'default': ['ENGINEERING', 'QUALITY']
};

/**
 * Task Type to Department Mapping
 */
export const TASK_DEPARTMENT_SUGGESTIONS = {
  // Production tasks
  'production': ['PRODUCTION', 'OPERATIONS'],
  'manufacturing': ['PRODUCTION'],
  'assembly': ['PRODUCTION'],
  'fabrication': ['PRODUCTION'],

  // QC tasks
  'qc': ['QUALITY'],
  'quality': ['QUALITY'],
  'inspection': ['QUALITY'],
  'testing': ['QUALITY'],

  // Engineering tasks
  'engineering': ['ENGINEERING'],
  'design': ['ENGINEERING', 'DRAFTING'],
  'technical': ['ENGINEERING'],

  // Drafting tasks
  'drafting': ['DRAFTING'],
  'drawing': ['DRAFTING'],
  'cad': ['DRAFTING'],

  // Purchasing tasks
  'purchasing': ['PURCHASING'],
  'procurement': ['PURCHASING'],
  'order': ['PURCHASING'],

  // Safety tasks
  'safety': ['SAFETY'],
  'compliance': ['SAFETY', 'QUALITY'],

  // Service tasks
  'service': ['SERVICE'],
  'warranty': ['SERVICE'],
  'repair': ['SERVICE'],

  // Default for general tasks
  'default': ['PRODUCTION', 'OPERATIONS']
};

// ============================================================================
// SUGGESTION FUNCTIONS
// ============================================================================

/**
 * Get suggested department codes based on item type and text content
 *
 * @param {string} itemType - 'rfi', 'submittal', or 'task'
 * @param {string} text - Subject/title/description to analyze
 * @returns {string[]} Array of suggested department codes
 */
export function getSuggestedDepartments(itemType, text = '') {
  const lowercaseText = text.toLowerCase();
  let mapping;

  switch (itemType) {
    case 'rfi':
      mapping = RFI_DEPARTMENT_SUGGESTIONS;
      break;
    case 'submittal':
      mapping = SUBMITTAL_DEPARTMENT_SUGGESTIONS;
      break;
    case 'task':
      mapping = TASK_DEPARTMENT_SUGGESTIONS;
      break;
    default:
      return [];
  }

  // Check each keyword in the mapping
  for (const [keyword, departments] of Object.entries(mapping)) {
    if (keyword !== 'default' && lowercaseText.includes(keyword)) {
      return departments;
    }
  }

  // Return default suggestions for this item type
  return mapping['default'] || [];
}

/**
 * Filter contacts by suggested departments
 *
 * @param {Array} contacts - Array of directory_contacts or users
 * @param {string[]} departmentCodes - Array of department codes to filter by
 * @param {string} factoryCode - Optional factory code to prioritize
 * @returns {Array} Sorted array of suggested contacts
 */
export function filterContactsByDepartments(contacts, departmentCodes, factoryCode = null) {
  if (!contacts || !departmentCodes || departmentCodes.length === 0) {
    return contacts || [];
  }

  // Score and sort contacts
  const scoredContacts = contacts.map(contact => {
    let score = 0;
    const deptCode = contact.department_code || contact.department;

    // Primary match: department is in suggested list
    if (deptCode && departmentCodes.includes(deptCode)) {
      // Higher score for earlier departments in the list
      const deptIndex = departmentCodes.indexOf(deptCode);
      score += (departmentCodes.length - deptIndex) * 10;
    }

    // Bonus: same factory
    if (factoryCode && (contact.factory_code === factoryCode || contact.factory === factoryCode)) {
      score += 5;
    }

    return { ...contact, _suggestionScore: score };
  });

  // Sort by score descending, then by name
  return scoredContacts
    .sort((a, b) => {
      if (b._suggestionScore !== a._suggestionScore) {
        return b._suggestionScore - a._suggestionScore;
      }
      const nameA = a.full_name || a.name || '';
      const nameB = b.full_name || b.name || '';
      return nameA.localeCompare(nameB);
    });
}

/**
 * Get suggested internal owners (users) based on item type and text
 *
 * @param {Array} users - Array of users from the users table
 * @param {string} itemType - 'rfi', 'submittal', or 'task'
 * @param {string} text - Subject/title to analyze
 * @param {string} factoryCode - Optional factory code to prioritize
 * @returns {Array} Sorted array of suggested users
 */
export function getSuggestedInternalOwners(users, itemType, text = '', factoryCode = null) {
  // For now, we map user roles to "virtual" departments
  // PM/Director -> general oversight
  // PC (Plant Controller) -> PRODUCTION, OPERATIONS
  // IT -> IT

  const suggestedDepts = getSuggestedDepartments(itemType, text);

  // Map departments to user roles
  const roleMapping = {
    'ENGINEERING': ['PM', 'Project_Manager', 'Director'],
    'DRAFTING': ['PM', 'Project_Manager', 'Director'],
    'PURCHASING': ['PM', 'Project_Manager', 'Director'],
    'QUALITY': ['PM', 'Project_Manager', 'Director', 'PC'],
    'PRODUCTION': ['PC', 'PM', 'Project_Manager'],
    'OPERATIONS': ['PC', 'Director'],
    'SAFETY': ['PC', 'Director'],
    'SERVICE': ['PM', 'Project_Manager'],
    'IT': ['IT', 'IT_Manager']
  };

  // Build list of suggested roles
  const suggestedRoles = new Set();
  suggestedDepts.forEach(dept => {
    const roles = roleMapping[dept] || ['PM', 'Project_Manager'];
    roles.forEach(role => suggestedRoles.add(role));
  });

  // Score users
  const scoredUsers = users.map(user => {
    let score = 0;

    // User role matches suggested roles
    if (suggestedRoles.has(user.role)) {
      score += 10;
    }

    // Same factory bonus
    if (factoryCode && user.factory === factoryCode) {
      score += 5;
    }

    return { ...user, _suggestionScore: score };
  });

  return scoredUsers.sort((a, b) => {
    if (b._suggestionScore !== a._suggestionScore) {
      return b._suggestionScore - a._suggestionScore;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Check if text suggests a specific department
 * Used for showing "Suggested" badge in UI
 *
 * @param {string} text - Text to analyze
 * @param {string} departmentCode - Department code to check
 * @param {string} itemType - Item type for context
 * @returns {boolean} True if department is suggested
 */
export function isDepartmentSuggested(text, departmentCode, itemType) {
  const suggestions = getSuggestedDepartments(itemType, text);
  return suggestions.includes(departmentCode);
}

// ============================================================================
// PRIORITY SUGGESTION
// ============================================================================

/**
 * Suggest priority based on keywords in text
 *
 * @param {string} text - Subject/description text
 * @returns {string} Suggested priority: 'Critical', 'High', 'Medium', or 'Low'
 */
export function getSuggestedPriority(text = '') {
  const lowercaseText = text.toLowerCase();

  // Critical keywords
  const criticalKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately', 'blocking'];
  if (criticalKeywords.some(kw => lowercaseText.includes(kw))) {
    return 'Critical';
  }

  // High priority keywords
  const highKeywords = ['important', 'priority', 'deadline', 'time-sensitive', 'expedite'];
  if (highKeywords.some(kw => lowercaseText.includes(kw))) {
    return 'High';
  }

  // Low priority keywords
  const lowKeywords = ['fyi', 'when possible', 'not urgent', 'low priority', 'informational'];
  if (lowKeywords.some(kw => lowercaseText.includes(kw))) {
    return 'Low';
  }

  // Default to Medium
  return 'Medium';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getSuggestedDepartments,
  filterContactsByDepartments,
  getSuggestedInternalOwners,
  isDepartmentSuggested,
  getSuggestedPriority,
  RFI_DEPARTMENT_SUGGESTIONS,
  SUBMITTAL_DEPARTMENT_SUGGESTIONS,
  TASK_DEPARTMENT_SUGGESTIONS
};
