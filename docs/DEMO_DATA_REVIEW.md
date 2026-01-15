# Demo Data Plan Review - Critical Analysis

**Created:** January 15, 2026
**Purpose:** Identify potential bugs, logic breaks, and compatibility issues before implementing demo data

---

## Executive Summary

This review analyzes the Demo Data Plan V2 against the PGM Implementation Plan and existing codebase to identify:
1. **Schema Compatibility Issues** - Missing/mismatched fields
2. **Foreign Key Dependencies** - Order of operations problems
3. **Service Layer Requirements** - What the code expects
4. **Role/Permission Issues** - RLS policy considerations
5. **Logic Gaps** - Missing data relationships

---

## Critical Issues Found

### Issue 1: Station Templates - Global vs Factory-Specific

**Problem:** The `stationService.js` falls back to global templates (`factory_id IS NULL`) when no factory-specific stations exist. The migration seeds global templates, not NWBS-specific.

**Current Code (stationService.js:22-51):**
```javascript
// First try to get factory-specific stations
if (factoryId) {
  const { data: factoryStations } = await supabase
    .from('station_templates')
    .eq('factory_id', factoryId)
    ...
}
// Fall back to global templates (factory_id is null)
const { data: globalStations } = await supabase
  .from('station_templates')
  .is('factory_id', null)
  ...
```

**Impact:** Demo data should use global station templates (factory_id = NULL), not create NWBS-specific ones.

**Resolution:** Modules should reference global station IDs via `current_station_id`. Do NOT create duplicate stations for NWBS.

---

### Issue 2: Module Serial Number Format

**Problem:** The demo plan suggests serial numbers like `NWBS-26-001-M1` but the service generates them as `{PROJECT_NUMBER}-M{SEQUENCE}`.

**Current Code (modulesService.js:186-188):**
```javascript
export function generateModuleSerial(projectNumber, sequenceNumber) {
  return `${projectNumber}-M${sequenceNumber}`;
}
```

**Impact:** If project_number is `NWBS-26-001`, serial becomes `NWBS-26-001-M1` which is correct. But PC projects like `NWBS-26-S01` would produce `NWBS-26-S01-M1`.

**Resolution:** Ensure project_number format is consistent. Use format: `{FACTORY}-{YEAR}-{TYPE}{SEQ}` where TYPE is blank for PM, 'S' for Stock/PC.

---

### Issue 3: Module Factory Assignment

**Problem:** Modules need `factory_id` set correctly for the Plant GM dashboard to filter by factory.

**Current Code (modulesService.js:73-83):**
```javascript
export async function getModulesByFactory(factoryId, filters = {}) {
  let query = supabase
    .from('modules')
    .select(`...`)
    .eq('factory_id', factoryId);  // <-- Requires factory_id
```

**Impact:** If modules don't have `factory_id` set, Plant GM sees no modules.

**Resolution:** Demo data MUST set `factory_id` on every module. Get factory_id from:
```sql
SELECT id FROM factories WHERE code = 'NWBS'
```

---

### Issue 4: Workers Primary Station Reference

**Problem:** Workers table has `primary_station_id` referencing `station_templates`. If using global templates, this needs the correct global station UUID.

**Schema (workers table):**
```sql
primary_station_id UUID REFERENCES station_templates(id) ON DELETE SET NULL
```

**Impact:** If demo data creates workers with station IDs that don't match global templates, FK constraint fails.

**Resolution:**
1. First query global station IDs
2. Assign workers to those station IDs
3. Don't hardcode UUIDs - always query dynamically

---

### Issue 5: Project Owner vs Primary PM

**Problem:** The demo plan uses `owner_id` for PC projects but the calendar filters check `owner_id OR primary_pm_id OR backup_pm_id`.

**Calendar Filtering Logic (CalendarPage.jsx):**
```javascript
// PM role filtering
.or(`owner_id.eq.${user.id},primary_pm_id.eq.${user.id},backup_pm_id.eq.${user.id}`)
```

**Impact:** PC users need `owner_id` set to their user ID for calendar to show their items.

**Resolution:** Ensure PC projects set:
- `owner_id` = Dawn Hinkle's user ID
- `primary_pm_id` = NULL (no PM needed)
- `backup_pm_id` = NULL

---

### Issue 6: Building Type vs Building Category

**Problem:** Projects use `building_type`, modules use `building_category`. These must match for station duration calculations.

**Schema Fields:**
- `projects.building_type` - VARCHAR (e.g., 'GOVERNMENT', 'CUSTOM', 'STOCK')
- `modules.building_category` - VARCHAR (e.g., 'government', 'custom', 'stock')

**Current Code (modulesService.js:238):**
```javascript
building_category: project.building_type?.toLowerCase() || 'stock'
```

**Impact:** The service lowercases `building_type` when creating modules. Demo data should use uppercase for projects, lowercase for modules.

**Resolution:**
- Projects: `building_type = 'GOVERNMENT'` (uppercase)
- Modules: `building_category = 'government'` (lowercase)

---

### Issue 7: Station Assignment Lead Reference

**Problem:** `station_assignments.lead_id` references `users(id)`, but leads are typically in the `workers` table.

**Schema (station_assignments):**
```sql
lead_id UUID REFERENCES users(id) ON DELETE SET NULL  -- References users, not workers!
crew_ids UUID[] DEFAULT '{}'  -- Array of user IDs? Or worker IDs?
```

**Impact:** The schema expects user IDs for leads, but the demo plan discusses workers as leads.

**Investigation Needed:** Check if `lead_id` should reference `workers` or `users`.

**Current Code (modulesService.js:388-398):**
```javascript
// Create station assignment record
const { error: assignmentError } = await supabase
  .from('station_assignments')
  .insert({
    module_id: moduleId,
    station_id: stationId,
    factory_id: module.factory_id,
    lead_id: leadId,  // Passed from caller - type unclear
    crew_ids: crewIds,  // Array - type unclear
    status: 'Pending'
  });
```

**Resolution Options:**
1. Keep as users - leads must be system users with Plant_GM/Production_Manager role
2. Change FK to reference workers - leads can be any factory worker
3. Both - lead_id for system user, add worker_lead_id for worker reference

**Recommendation:** For demo data, use NULL for `lead_id` and `crew_ids` since the schema currently expects user IDs, not worker IDs. This is a schema design issue to address separately.

---

### Issue 8: Scheduled Start/End Date Handling

**Problem:** Calendar queries filter by `scheduled_start` and `scheduled_end` but some modules might only have `scheduled_start`.

**Current Code (modulesService.js:129-131):**
```javascript
.gte('scheduled_start', startDate.toISOString().split('T')[0])
.lte('scheduled_end', endDate.toISOString().split('T')[0])  // What if null?
```

**Impact:** Modules with `scheduled_start` but no `scheduled_end` might not appear in calendar queries.

**Resolution:** Demo data should set BOTH `scheduled_start` AND `scheduled_end` for all modules. Calculate `scheduled_end` as:
```sql
scheduled_end = scheduled_start + INTERVAL '14 days'  -- 2-week production window
```

---

### Issue 9: Project module_count vs Actual Modules

**Problem:** Projects have a `module_count` field that should match the number of modules created.

**Impact:** If we create 8 modules for a project but `module_count = 6`, there's a mismatch.

**Resolution:** After creating modules, update the project:
```sql
UPDATE projects SET module_count = (
  SELECT COUNT(*) FROM modules WHERE project_id = projects.id
) WHERE id = v_project_id;
```

---

### Issue 10: Plant Config for NWBS

**Problem:** The Plant Manager Dashboard may expect a `plant_config` record for the factory.

**Schema (plant_config):**
```sql
CREATE TABLE plant_config (
  factory_id UUID REFERENCES factories(id) PRIMARY KEY,
  takt_threshold_pct INTEGER DEFAULT 20,
  queue_alert_minutes INTEGER DEFAULT 30,
  shift_start TIME DEFAULT '06:00:00',
  shift_end TIME DEFAULT '14:30:00',
  ...
);
```

**Impact:** If no config exists, queries might fail or use unexpected defaults.

**Resolution:** Create plant_config for NWBS:
```sql
INSERT INTO plant_config (factory_id, takt_threshold_pct, queue_alert_minutes)
SELECT id, 20, 30 FROM factories WHERE code = 'NWBS'
ON CONFLICT (factory_id) DO NOTHING;
```

---

## Medium Priority Issues

### Issue 11: Workflow Stations vs Production Stations

**Clarification Needed:** There are TWO types of "stations":
1. **Workflow Stations** (21 stations in 4 phases) - `workflow_stations` table
2. **Production Stations** (12 manufacturing stages) - `station_templates` table

The Demo Plan discusses both. They are DIFFERENT concepts:
- **Workflow Stations:** Project milestones (Sales Handoff → 20% Drawings → Engineering Review → Delivery)
- **Production Stations:** Factory floor stages (Frame → Walls → Paint → Finish)

**Impact:** Demo data must populate BOTH tables correctly:
- Projects use `project_workflow_status` linked to `workflow_stations`
- Modules use `current_station_id` linked to `station_templates`

---

### Issue 12: Sales Quote to Project Linkage

**Problem:** Won quotes should link to projects via `converted_to_project_id`.

**Current Sales Quote Schema:**
```sql
converted_to_project_id UUID REFERENCES projects(id),
converted_at TIMESTAMPTZ,
converted_by UUID REFERENCES users(id)
```

**Impact:** The VP dashboard shows "Recently Converted" quotes. Demo data needs this linkage.

**Resolution:** For won quotes:
```sql
UPDATE sales_quotes SET
  converted_to_project_id = (SELECT id FROM projects WHERE project_number = 'NWBS-26-001'),
  converted_at = CURRENT_DATE - INTERVAL '30 days',
  converted_by = (SELECT id FROM users WHERE email ILIKE '%mitch%')
WHERE quote_number = 'Q-2026-M01';
```

---

### Issue 13: RLS Policies for Plant_GM Role

**Problem:** RLS policies must allow Plant_GM to read modules, workers, shifts for their factory.

**Required RLS Check:** Verify these policies exist in `20260115_plant_manager_system.sql`:
- `modules`: Plant_GM can read where `factory_id` matches user's factory
- `workers`: Plant_GM can read/write where `factory_id` matches user's factory
- `worker_shifts`: Same as workers
- `station_assignments`: Same as workers

**Impact:** If RLS denies access, Plant GM sees empty dashboard.

---

### Issue 14: Production_Manager Role Usage

**Question:** The demo plan includes Justin Downing as `Production_Manager`. How does this role differ from `Plant_GM`?

**Current Understanding:**
- `Plant_GM` (Ross Parks) - Factory-level oversight, drag-drop overrides
- `Production_Manager` (Justin Downing) - Day-to-day production, reports to Plant_GM

**Impact:** Need to verify code handles `Production_Manager` role correctly in:
- Sidebar navigation
- Dashboard routing
- RLS policies

**Check:** Does `Production_Manager` have its own dashboard or use Plant_GM dashboard?

---

## Low Priority / Future Considerations

### Issue 15: Worker Shifts Spanning Midnight

If shifts clock in at 6:00 AM and run 8-10 hours, they won't span midnight. But if anyone clocks in after 4 PM, shifts could span dates.

**Resolution:** Demo data creates shifts at `CURRENT_DATE + INTERVAL '6 hours'` (6 AM), avoiding midnight issues.

---

### Issue 16: QC Records for Demo

The QC Records table exists but the demo plan doesn't explicitly populate it. For a complete demo:

**Optional Enhancement:**
```sql
-- Create sample QC records for modules at inspection station
INSERT INTO qc_records (module_id, station_id, factory_id, status, passed, inspected_at)
SELECT m.id, m.current_station_id, m.factory_id, 'Passed', true, NOW() - INTERVAL '1 hour'
FROM modules m
JOIN station_templates st ON m.current_station_id = st.id
WHERE st.code = 'INSPECTION' AND m.status = 'Completed';
```

---

### Issue 17: Calendar Audit for Demo

The `calendar_audit` table tracks GM overrides. Demo could include sample audit entries:

**Optional Enhancement:**
```sql
INSERT INTO calendar_audit (factory_id, user_id, action, entity_type, entity_id, new_data, notes)
VALUES (
  v_factory_id,
  v_ross_id,
  'schedule_change',
  'module',
  v_module_id,
  '{"scheduled_start": "2026-01-20", "previous_start": "2026-01-25"}',
  'Moved up to meet delivery deadline'
);
```

---

## Execution Order Recommendations

Based on FK dependencies, execute in this order:

```
1. factories (must exist)
2. users (Ross, Dawn, Justin) - needs factory_id
3. station_templates (global, factory_id = NULL) - already seeded in migration
4. plant_config (needs factory_id)
5. workflow_stations (if not exist) - for project workflow
6. projects (PM + PC) - needs factory, owner_id, primary_pm_id
7. project_workflow_status (needs project_id, workflow_station_id)
8. modules (needs project_id, factory_id, current_station_id)
9. workers (needs factory_id, primary_station_id)
10. worker_shifts (needs worker_id, factory_id)
11. station_assignments (needs module_id, station_id, factory_id)
12. tasks, rfis, submittals (needs project_id, assignee_id)
13. sales_customers (needs factory)
14. sales_quotes (needs assigned_to, customer_id, factory)
15. Update quotes with converted_to_project_id
```

---

## Verification Checklist

After running demo data, verify:

- [ ] Ross Parks can log in and sees Plant_GM dashboard
- [ ] Ross sees 63 modules across 12 production stations
- [ ] Ross sees 60 workers, ~50 clocked in
- [ ] Dawn Hinkle can log in and sees PC dashboard
- [ ] Dawn sees her 12 STOCK projects
- [ ] Matthew sees his 4 PM projects in calendar
- [ ] Mitch sees his 10 quotes in sales dashboard
- [ ] VP can see all projects across factories
- [ ] Production calendar shows scheduled modules
- [ ] Station detail modal shows modules and crew

---

## Summary of Changes Needed

1. **Use global station_templates** - Don't create factory-specific stations
2. **Set factory_id on all modules** - Critical for Plant GM filtering
3. **Set both scheduled_start AND scheduled_end** - For calendar queries
4. **Create plant_config for NWBS** - For factory configuration
5. **Set owner_id on PC projects** - For Dawn's calendar filtering
6. **Match building_type/building_category case** - Uppercase projects, lowercase modules
7. **Leave lead_id/crew_ids as NULL** - Schema expects user IDs, not worker IDs
8. **Update project module_count** - Match actual modules created
9. **Link won quotes to projects** - Via converted_to_project_id

---

## Deep SQL Review - Final Pass (January 15, 2026)

### Migration File Analysis

#### 1. `20260115_plant_manager_system.sql` - VERIFIED CORRECT

**Schema Design:**
- Creates 15 PGM tables with proper FK relationships
- Drops tables in correct reverse dependency order (lines 19-39)
- Uses `gen_random_uuid()` for primary keys
- Has comprehensive RLS policies for all tables

**Global Station Templates:**
- Line 1362-1410: Seeds 12 global stations with `factory_id = NULL`
- Service correctly falls back to global templates when no factory-specific exist
- **VERIFIED:** `WHERE factory_id IS NULL` will return these templates

**Station Assignments Lead Reference:**
- Line 177: `lead_id UUID REFERENCES users(id) ON DELETE SET NULL`
- This is intentional - leads are system users (Plant_GM, Production_Manager), not workers
- `crew_ids UUID[]` is an array of worker IDs (no FK constraint on arrays)
- **DESIGN DECISION:** Keep as users reference for accountability

**RLS Policies:**
- Lines 792-1295: Comprehensive policies for all 15 tables
- Factory filtering works via `u.factory_id = table.factory_id`
- VP, Director, Admin can see all factories
- Plant_GM, Production_Manager limited to their factory

---

#### 2. `20260115_pgm_demo_data.sql` - NEEDS ENHANCEMENT

**Current State:**
- Creates 10 workers (insufficient for new plan - need 60)
- Creates 8 modules (insufficient for new plan - need 63)
- Uses global station templates correctly (line 51, 132, etc.)
- Creates plant_config correctly (lines 178-182)

**Issues Found:**
- Line 106-108: Project lookup uses `factory = v_factory_code` but projects table uses factory codes like 'NWBS - Northwest Building Systems', not 'NWBS'
- **FIX NEEDED:** Change to `WHERE factory ILIKE v_factory_code || '%'` or `WHERE factory ILIKE '%' || v_factory_code || '%'`

- Line 164: Module 7 missing `scheduled_end` - will break calendar queries
- Line 168-169: Module 8 missing both `scheduled_start` AND `scheduled_end`
- **FIX NEEDED:** All modules need both dates set

---

#### 3. `20260115_ross_parks_plant_gm.sql` - VERIFIED CORRECT

**User Assignment:**
- Sets Ross Parks as Plant_GM role with factory = 'NWBS'
- Sets factory_id correctly from factories table
- RLS policies will filter correctly

---

### Demo File Analysis

#### 4. `MASTER_DEMO_DATA.sql` - EXECUTION ORDER VERIFIED

**Order is correct:**
```
0. Update Users (roles/factories)
1. Clear Data (safe_truncate)
2. Create Factories (15)
3. Create Departments (14)
4. Create Workflow Stations (21 in 4 phases)
5. Import Projects (20)
6. Generate Project Data (tasks, RFIs, etc.)
7. Initialize Workflow Status
8. Create Sales Data
9. Import Directory Contacts
```

**Issue Found:**
- Robert Thaler (line 126-138) uses hardcoded UUID `aa90ef56-5f69-4531-a24a-5b3d1db608f2`
- This is fine IF the auth.users table also has this UUID, otherwise FK will fail
- **RECOMMENDATION:** Use SELECT from auth.users like other users

---

#### 5. `05_IMPORT_PROJECTS.sql` - VERIFIED CORRECT

**FK Dependencies:**
- Correctly queries user IDs dynamically (lines 47-53)
- Has fallback to first PM if user not found (lines 56-62)
- All FKs to users table handled properly

**Project Factory Values:**
- Uses full factory names: `'NWBS - Northwest Building Systems'`, `'PMI - Phoenix Modular'`
- **IMPORTANT:** PGM demo data must match these patterns when querying projects by factory

---

#### 6. `07_WORKFLOW_STATUS.sql` - VERIFIED CORRECT

**Workflow vs Production Stations:**
- Uses `workflow_stations` table (21 stations, 4 phases)
- Creates `project_workflow_status` linking projects to workflow stations
- **COMPLETELY SEPARATE** from `station_templates` (12 production stages)

---

#### 7. `08_SALES_DATA.sql` - VERIFIED CORRECT

**Quote to Project Linkage:**
- Has `converted_to_project_id` column
- Links won quotes to projects correctly
- Contains quotes for both Mitch (Sales_Manager) and Robert (Sales_Rep)

---

#### 8. `10_SCHEMA_FIXES.sql` - VERIFIED CORRECT

**Critical Fix:**
- Line 26: Adds `factory_id` column to users table
- Line 29-33: Populates factory_id from factory code
- **REQUIRED** for Plant GM RLS policies to work

---

### Cross-File Dependency Analysis

#### FK Dependency Graph (Correct Order):

```
factories (base)
    ↓
users (needs factory_id)
    ↓
departments (standalone)
    ↓
workflow_stations (standalone)
station_templates (standalone, factory_id nullable)
    ↓
projects (needs users.id for pm_ids, owner_id)
    ↓
project_workflow_status (needs projects.id, workflow_stations.station_key)
modules (needs projects.id, factories.id, station_templates.id)
workers (needs factories.id, station_templates.id)
    ↓
worker_shifts (needs workers.id, factories.id)
station_assignments (needs modules.id, station_templates.id, factories.id)
    ↓
tasks, rfis, submittals (need projects.id, users.id)
sales_quotes (need users.id)
```

---

### Critical Compatibility Issues

#### Issue 18: Factory Code Mismatch Between Tables

**Problem:** Multiple query patterns for factory filtering:
- `projects.factory` = 'NWBS - Northwest Building Systems' (full name)
- `factories.code` = 'NWBS' (code only)
- `users.factory` = 'NWBS' (code only)
- `modules.factory_id` = UUID

**Impact:** PGM demo data line 106-108 queries:
```sql
SELECT id INTO v_project_id FROM projects
WHERE factory = v_factory_code  -- v_factory_code = 'NWBS', but projects.factory = 'NWBS - Northwest Building Systems'
```

**Resolution:** Fix query to use ILIKE pattern matching:
```sql
WHERE factory ILIKE '%' || v_factory_code || '%'
```

---

#### Issue 19: Module Missing scheduled_end

**Problem:** Some modules in `20260115_pgm_demo_data.sql` don't set `scheduled_end`:
- Line 164-165: Module 7 has `scheduled_start` but no `scheduled_end`
- Line 168-169: Module 8 has neither

**Impact:** Calendar query (modulesService.js:129-131) filters:
```javascript
.gte('scheduled_start', startDate.toISOString().split('T')[0])
.lte('scheduled_end', endDate.toISOString().split('T')[0])
```

Modules without `scheduled_end` won't appear in calendar views.

**Resolution:** All modules need both dates. Calculate:
```sql
scheduled_end = COALESCE(scheduled_end, scheduled_start + INTERVAL '14 days')
```

---

#### Issue 20: Production_Manager Role Missing from Sidebar

**Problem:** Demo plan includes Justin Downing as Production_Manager, but need to verify:
1. Sidebar shows correct menu for this role
2. Dashboard routing works
3. RLS policies include this role

**Verification Needed:**
- `src/components/layout/Sidebar.jsx` - Check role handling
- `src/contexts/AuthContext.jsx` - Check role validation

**Current RLS Policies (VERIFIED):**
- Line 838-839: modules_insert_policy includes Production_Manager
- Line 850-851: modules_update_policy includes Production_Manager
- Line 946-948: station_assignments_insert_policy includes Production_Manager

---

### Final Recommendations

1. **Fix PGM Demo Data Factory Query** - Use ILIKE for project lookup
2. **Add scheduled_end to All Modules** - Required for calendar
3. **Verify Production_Manager UI** - Sidebar and dashboard routing
4. **Test RLS with Plant_GM Login** - Ensure factory filtering works
5. **Run Schema Fixes AFTER MASTER_DEMO_DATA** - Adds required columns

---

### Execution Order for Complete Demo Setup

```bash
# 1. Run migrations (in order)
supabase/migrations/20260113_praxis_integration.sql
supabase/migrations/20260113_sales_quotes_praxis_fields.sql
supabase/migrations/20260114_directory_system.sql
supabase/migrations/20260114_team_builder.sql
supabase/migrations/20260115_plant_manager_system.sql

# 2. Run master demo data (combines all demo scripts)
supabase/demo/MASTER_DEMO_DATA.sql

# 3. Apply schema fixes (adds missing columns)
supabase/demo/10_SCHEMA_FIXES.sql

# 4. Set up Plant GM role
supabase/migrations/20260115_ross_parks_plant_gm.sql

# 5. Add PGM-specific demo data
supabase/migrations/20260115_pgm_demo_data.sql
```

---

*Final Review completed: January 15, 2026*
