# PWA Mobile App Integration Plan: Building Specs & PM Flag Features

## Overview

This plan outlines how to incorporate the Building Specifications and PM Flag features (implemented January 18, 2026) into the PWA mobile applications:

1. **PWA Floor App** - For factory floor workers (PIN authentication)
2. **PWA Manager App** - For Project Managers on mobile (email/password authentication)

---

## Current State Analysis

### Features Already Implemented (Desktop)

| Feature | Desktop Location | Data Flow |
|---------|-----------------|-----------|
| Building Specs Input | QuoteForm.jsx | → sales_quotes table |
| PM Flag Toggle | VPDashboard.jsx | → sales_quotes.is_pm_flagged |
| Specs Transfer | QuoteDetail.jsx | sales_quotes → projects |
| PM Assignment Queue | DirectorDashboard.jsx | projects WHERE is_pm_job=true |
| Specs Display (Project) | OverviewTab.jsx | projects.building_* fields |
| Specs Display (Module) | ModuleDetailModal.jsx | projects.building_* via module.project_id |

### Building Specs Fields

```
building_type      : text     (CUSTOM, GOVERNMENT, EDUCATION, etc.)
building_width     : int      (in feet)
building_length    : int      (in feet)
mod_width          : int      (10, 12, 14, or custom)
module_count       : int      (number of modules)
occupancy          : char     (A-U occupancy classification)
special_materials  : jsonb    ({ tt_p, sprinklers, plumbing })
```

### PM Flag Fields

```
is_pm_job              : boolean   (project is PM-managed)
pm_flagged_from_quote  : boolean   (came from flagged quote)
assigned_pm_id         : uuid      (assigned Project Manager)
pm_assigned_at         : timestamp (when assigned)
```

---

## Integration Plan

### Phase 1: PWA Manager App Enhancements

#### 1.1 ProjectDetail.jsx - Add Building Specifications Section

**Location:** `src/pwa/manager/pages/ProjectDetail.jsx`

**Current State:** Shows Key Dates, Contract, Location, and Building Details (type, factory, square footage, stories)

**Enhancement:** Add full Building Specifications section with new fields

```jsx
// Add to renderOverview() after existing Building Info section

{/* Building Specifications */}
<div style={styles.section}>
  <h3 style={styles.sectionTitle}>Building Specifications</h3>
  <div style={styles.infoGrid}>
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>Dimensions</div>
      <div style={styles.infoValueSmall}>
        {project.building_width && project.building_length
          ? `${project.building_width}' × ${project.building_length}'`
          : '—'}
      </div>
    </div>
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>Module Width</div>
      <div style={styles.infoValueSmall}>
        {project.mod_width ? `${project.mod_width}'` : '—'}
      </div>
    </div>
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>Occupancy</div>
      <div style={styles.infoValueSmall}>
        {project.occupancy || '—'}
      </div>
    </div>
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>Module Count</div>
      <div style={styles.infoValueSmall}>
        {project.module_count || '—'}
      </div>
    </div>
  </div>

  {/* Special Materials Tags */}
  {project.special_materials && (
    <div style={{ marginTop: 'var(--space-md)' }}>
      <div style={styles.infoLabel}>Special Materials</div>
      <div style={styles.tagsContainer}>
        {project.special_materials.tt_p && (
          <span style={styles.materialTag}>TT&P</span>
        )}
        {project.special_materials.sprinklers && (
          <span style={styles.materialTag}>Sprinklers</span>
        )}
        {project.special_materials.plumbing && (
          <span style={styles.materialTag}>Plumbing</span>
        )}
      </div>
    </div>
  )}
</div>
```

**New Styles to Add:**

```jsx
tagsContainer: {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-xs)'
},
materialTag: {
  padding: '4px 10px',
  background: 'rgba(249, 115, 22, 0.15)',  // Orange tint
  color: '#f97316',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: '600'
}
```

#### 1.2 ProjectDetail.jsx - Add PM Assignment Badge

**Enhancement:** Show PM job status and assigned PM in header badges

```jsx
// Add after existing badges in projectHeader
{project.is_pm_job && (
  <span style={{
    ...styles.badge,
    background: 'rgba(168, 85, 247, 0.2)',
    color: '#a855f7'
  }}>
    PM JOB
  </span>
)}

{project.assigned_pm_name && (
  <span style={{
    ...styles.badge,
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6'
  }}>
    PM: {project.assigned_pm_name}
  </span>
)}
```

#### 1.3 ProjectsList.jsx - Add PM Badge to List Items

**Location:** `src/pwa/manager/pages/ProjectsList.jsx`

**Enhancement:** Show PM job indicator on project cards

```jsx
// In project card rendering
{project.is_pm_job && (
  <span style={styles.pmBadge}>PM</span>
)}
```

#### 1.4 ManagerDashboard.jsx - Add PM Project Count

**Location:** `src/pwa/manager/pages/ManagerDashboard.jsx`

**Enhancement:** Add stat card showing PM jobs count

```jsx
// Add to stats grid
<div style={styles.statCard}>
  <div style={styles.statValue}>{pmJobsCount}</div>
  <div style={styles.statLabel}>PM Jobs</div>
</div>
```

---

### Phase 2: PWA Floor App Enhancements

#### 2.1 ModuleLookup.jsx - Add Building Specs to Module Detail

**Location:** `src/pwa/pages/ModuleLookup.jsx`

**Current State:** Shows module dimensions (module_width, module_length, module_height) and building_category

**Enhancement:** Update ModuleDetailCard to show project's building specs

```jsx
// In ModuleDetailCard component, add after existing sections

{/* Project Building Specifications */}
{module.project && (
  <div style={styles.infoSection}>
    <div style={styles.infoLabel}>Project Building Specs</div>
    <div style={styles.specsGrid}>
      {module.project.building_width && module.project.building_length && (
        <div style={styles.specItem}>
          <span style={styles.specLabel}>Overall Size</span>
          <span style={styles.specValue}>
            {module.project.building_width}' × {module.project.building_length}'
          </span>
        </div>
      )}
      {module.project.mod_width && (
        <div style={styles.specItem}>
          <span style={styles.specLabel}>Mod Width</span>
          <span style={styles.specValue}>{module.project.mod_width}'</span>
        </div>
      )}
      {module.project.occupancy && (
        <div style={styles.specItem}>
          <span style={styles.specLabel}>Occupancy</span>
          <span style={styles.specValue}>{module.project.occupancy}</span>
        </div>
      )}
    </div>
  </div>
)}

{/* Special Materials Warning */}
{module.project?.special_materials && (
  <div style={styles.specialMaterialsBanner}>
    <AlertCircle size={16} />
    <span>Special Materials:</span>
    {module.project.special_materials.tt_p && <span style={styles.matTag}>TT&P</span>}
    {module.project.special_materials.sprinklers && <span style={styles.matTag}>Sprinklers</span>}
    {module.project.special_materials.plumbing && <span style={styles.matTag}>Plumbing</span>}
  </div>
)}
```

**New Styles:**

```jsx
specsGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px',
  marginTop: '8px'
},
specItem: {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
},
specLabel: {
  fontSize: '0.75rem',
  color: 'var(--text-tertiary)'
},
specValue: {
  fontSize: '0.9375rem',
  fontWeight: '500',
  color: 'var(--text-primary)'
},
specialMaterialsBanner: {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px',
  padding: '10px 12px',
  background: 'rgba(249, 115, 22, 0.15)',
  border: '1px solid rgba(249, 115, 22, 0.3)',
  borderRadius: '8px',
  color: '#f97316',
  fontWeight: '500',
  fontSize: '0.875rem',
  marginBottom: '16px'
},
matTag: {
  padding: '2px 8px',
  background: 'rgba(249, 115, 22, 0.25)',
  borderRadius: '4px',
  fontSize: '0.75rem'
}
```

#### 2.2 Update modulesService.js - Include Building Specs in Query

**Location:** `src/services/modulesService.js`

**Enhancement:** Update `getModuleById` to include project building specs

```javascript
// In getModuleById function, update the select statement
const { data, error } = await supabase
  .from('modules')
  .select(`
    *,
    project:projects(
      id,
      name,
      project_number,
      building_type,
      building_width,
      building_length,
      mod_width,
      module_count,
      occupancy,
      special_materials,
      is_pm_job
    ),
    factory:factories(id, name, code),
    current_station:station_templates(id, name, code, color)
  `)
  .eq('id', moduleId)
  .single();
```

#### 2.3 QCInspection.jsx - Show Building Specs Context

**Location:** `src/pwa/pages/QCInspection.jsx`

**Enhancement:** Display building specs during QC inspection for context

```jsx
// Add collapsible section showing project specs
{module?.project && (
  <details style={styles.specsCollapsible}>
    <summary style={styles.specsSummary}>
      <Building2 size={16} />
      <span>Project Specs</span>
    </summary>
    <div style={styles.specsContent}>
      <div>Type: {module.project.building_type || 'N/A'}</div>
      <div>Size: {module.project.building_width}' × {module.project.building_length}'</div>
      <div>Occupancy: {module.project.occupancy || 'N/A'}</div>
      {module.project.special_materials?.sprinklers && (
        <div style={styles.warningText}>⚠️ Sprinkler system required</div>
      )}
    </div>
  </details>
)}
```

---

### Phase 3: Service Layer Updates

#### 3.1 Ensure Project Joins Include Building Specs

All project-related queries should include the building spec fields:

```javascript
// Standard project select with building specs
const PROJECT_SELECT_WITH_SPECS = `
  id,
  project_number,
  name,
  status,
  factory,
  contract_value,
  start_date,
  delivery_date,
  building_type,
  building_width,
  building_length,
  mod_width,
  module_count,
  occupancy,
  special_materials,
  is_pm_job,
  pm_flagged_from_quote,
  assigned_pm_id,
  assigned_pm:users!assigned_pm_id(id, name)
`;
```

---

## Implementation Order

### Priority 1 (High Impact, Quick Wins)
1. **ModuleLookup.jsx** - Add building specs display (floor workers need this most)
2. **ProjectDetail.jsx (Manager)** - Add building specs section
3. **modulesService.js** - Update query to include specs

### Priority 2 (Enhanced Experience)
4. **ProjectDetail.jsx (Manager)** - Add PM job badge
5. **ProjectsList.jsx (Manager)** - Add PM indicator
6. **ManagerDashboard.jsx** - Add PM jobs count

### Priority 3 (Contextual Improvements)
7. **QCInspection.jsx** - Add specs collapsible section
8. **StationMove.jsx** - Consider adding specs context

---

## Data Flow Verification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BUILDING SPECS DATA FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

    Desktop: QuoteForm
         │
         ▼
    sales_quotes (building_*, special_materials, is_pm_flagged)
         │
         │ Convert to Project (QuoteDetail.jsx)
         ▼
    projects (building_*, special_materials, is_pm_job, pm_flagged_from_quote)
         │
         ├──────────────────────────────────────────────────┐
         │                                                  │
         ▼                                                  ▼
    PWA Manager App                                   PWA Floor App
    ┌─────────────────┐                              ┌─────────────────┐
    │ ProjectDetail   │                              │ ModuleLookup    │
    │ • Building Specs│                              │ • Module details│
    │ • PM Job Badge  │                              │ • Project specs │
    │ • PM Assignment │                              │ • Special mats  │
    └─────────────────┘                              │ • PM job flag   │
                                                     └─────────────────┘
                                                            │
                                                            ▼
                                                     ┌─────────────────┐
                                                     │ QCInspection    │
                                                     │ • Specs context │
                                                     │ • Requirements  │
                                                     └─────────────────┘
```

---

## Testing Checklist

### PWA Manager App
- [ ] ProjectDetail shows building specs section
- [ ] Building dimensions display correctly (W × L)
- [ ] Module width shows with unit (')
- [ ] Occupancy classification displays
- [ ] Special materials tags render
- [ ] PM Job badge appears for is_pm_job=true projects
- [ ] Assigned PM name displays if set
- [ ] ProjectsList shows PM indicator

### PWA Floor App
- [ ] ModuleLookup shows project building specs
- [ ] Special materials banner appears when applicable
- [ ] Sprinkler/TT&P/Plumbing tags display
- [ ] QCInspection shows specs context
- [ ] Data loads correctly from service layer

### Service Layer
- [ ] modulesService includes project building specs in join
- [ ] getModuleById returns all spec fields
- [ ] searchModules includes necessary project data

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/pwa/manager/pages/ProjectDetail.jsx` | Add building specs section, PM badges | P1 |
| `src/pwa/pages/ModuleLookup.jsx` | Add project specs to ModuleDetailCard | P1 |
| `src/services/modulesService.js` | Update query to include building specs | P1 |
| `src/pwa/manager/pages/ProjectsList.jsx` | Add PM job indicator | P2 |
| `src/pwa/manager/pages/ManagerDashboard.jsx` | Add PM jobs count stat | P2 |
| `src/pwa/pages/QCInspection.jsx` | Add specs context section | P3 |

---

## Estimated Implementation Time

| Phase | Components | Time |
|-------|------------|------|
| Phase 1 | Manager App enhancements | 2-3 hours |
| Phase 2 | Floor App enhancements | 2-3 hours |
| Phase 3 | Service layer updates | 30 min |
| Testing | Both apps | 1 hour |
| **Total** | | **5-7 hours** |

---

## Notes

- All changes are additive (no breaking changes)
- Building specs are read-only in PWA (editing stays on desktop)
- PM assignment stays on DirectorDashboard (desktop only)
- Consider offline caching for specs data in future enhancement
