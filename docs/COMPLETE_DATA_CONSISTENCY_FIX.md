# Complete Data Consistency Fix Plan

## Status: IMPLEMENTED - January 16, 2026
## Scope: Demo Data Generation + Application-Layer Validation

---

## EXECUTIVE SUMMARY

This document outlines a comprehensive fix for all data consistency issues across the Sunbelt PM System. The fix addresses:
1. **Demo Data Generation** - Ensuring generated data follows logical business rules
2. **Application Validation** - Preventing invalid data from being created through the UI/API

### Confidence Assessment
| Component | Confidence | Reasoning |
|-----------|------------|-----------|
| Problem Identification | 0.95 | Comprehensive audit completed |
| Demo Data Fixes | 0.90 | Clear patterns to implement |
| Application Validation | 0.85 | Some edge cases may exist |
| Overall | 0.88 | High confidence in approach |

---

## PART 1: CONSISTENCY RULES CATALOG

### 1.1 Module Status Rules (ALREADY IMPLEMENTED)
```
DATE RELATIONSHIP          →  VALID STATUSES
─────────────────────────────────────────────────
scheduled_start > today+7  →  Not Started
scheduled_start > today    →  In Queue
scheduled_start ≤ today    →  In Progress, QC Hold
scheduled_end < today      →  Completed, Staged, Shipped
```

### 1.2 Station Progression Rules (TO IMPLEMENT)
```
RULE: Modules must flow through stations in ORDER
─────────────────────────────────────────────────
Station order_num: 1 → 2 → 3 → ... → 12
Cannot skip stations (e.g., 3 → 8 is INVALID)
Exception: Rush orders may skip non-critical stations
```

### 1.3 QC Gate Rules (TO IMPLEMENT)
```
INSPECTION-REQUIRED STATIONS:
─────────────────────────────────────────────────
Station 5 (ELEC_ROUGH)   - requires_inspection: true
Station 6 (PLUMB_ROUGH)  - requires_inspection: true
Station 7 (HVAC)         - requires_inspection: true
Station 8 (INWALL_INSP)  - is_inspection_station: true
Station 10 (FINAL_INSP)  - is_inspection_station: true

RULE: Module cannot leave station if:
- Station requires_inspection = true AND
- No qc_record exists with passed = true
```

### 1.4 Worker Assignment Rules (TO IMPLEMENT)
```
RULE: Worker can only be assigned to station if:
─────────────────────────────────────────────────
1. worker.primary_station_id = station_id, OR
2. cross_training record exists with:
   - worker_id matches
   - station_id matches
   - is_active = true
   - expires_at IS NULL or expires_at > today
```

### 1.5 Crew Size Rules (TO IMPLEMENT)
```
RULE: Station assignment crew must satisfy:
─────────────────────────────────────────────────
station.min_crew_size ≤ crew_ids.length ≤ station.max_crew_size

Lead worker requirements:
- lead_id must have is_lead = true
- lead_id must have proficiency_level IN ('Intermediate', 'Expert')
```

### 1.6 Shift Consistency Rules (TO IMPLEMENT)
```
RULE: Worker shifts must be consistent:
─────────────────────────────────────────────────
1. Only ONE active shift per worker (clock_out IS NULL)
2. clock_in < clock_out (always)
3. total_hours = hours_regular + hours_ot + hours_double
4. If worker.is_active = false, cannot clock in
```

### 1.7 Station Assignment ↔ Module Sync Rules
```
RULE: Data must be synchronized:
─────────────────────────────────────────────────
1. If station_assignment.status = 'In Progress':
   module.current_station_id MUST = station_assignment.station_id

2. If station_assignment.qc_passed = true:
   qc_records must have matching passed = true record
```

### 1.8 Long Lead Items Rules
```
RULE: Long leads must block appropriately:
─────────────────────────────────────────────────
1. If module.long_leads array has items:
   Each item must exist in long_lead_items table

2. Module cannot start production if:
   Any long_lead_item.status NOT IN ('Received', 'Verified')
```

---

## PART 2: DEMO DATA GENERATION FIXES

### 2.1 Worker Shifts Generation

**Current Issue:** Shifts may have illogical times or multiple active shifts per worker.

**Fix Logic:**
```sql
-- For each worker, generate realistic shifts
-- Only workers with is_active = true get shifts
-- Maximum one active (incomplete) shift per worker
-- Shift times must be within working hours (6am-6pm typically)
-- Past shifts must have clock_out set
```

### 2.2 QC Records Generation

**Current Issue:** Modules at inspection stations may lack QC records.

**Fix Logic:**
```sql
-- For each module that has passed through an inspection station:
IF module.current_station.order_num > inspection_station.order_num THEN
  -- Module has passed this station, needs QC record
  INSERT qc_record with passed = true

ELSIF module.current_station_id = inspection_station.id
  AND module.status = 'QC Hold' THEN
  -- Module is being inspected
  INSERT qc_record with status = 'Pending' or 'Failed'
```

### 2.3 Station Assignments Generation

**Current Issue:** Station assignments may not match module current_station_id.

**Fix Logic:**
```sql
-- For each module:
-- Create station_assignments for all stations UP TO current_station
FOR station_order_num FROM 1 TO module.current_station.order_num:
  IF station_order_num < current_station.order_num THEN
    -- Past station - completed
    INSERT station_assignment with status = 'Completed'
  ELSIF station_order_num = current_station.order_num THEN
    -- Current station - in progress or pending
    INSERT station_assignment with status matching module.status
```

### 2.4 Cross-Training Generation

**Current Issue:** Workers may be assigned without valid certifications.

**Fix Logic:**
```sql
-- Each worker gets certification for primary_station
-- Some workers get additional certifications (30-50%)
-- Ensure all workers in station_assignments.crew_ids have certs
-- Set realistic proficiency levels based on hire_date tenure
```

---

## PART 3: APPLICATION VALIDATION FIXES

### 3.1 New Validation Module: validationService.js

Create a central validation service with reusable functions:

```javascript
// validationService.js exports:
validateStationProgression(moduleId, targetStationId)
validateQCGate(moduleId, currentStationId)
validateWorkerCertification(workerId, stationId)
validateCrewSize(stationId, crewIds)
validateShiftConsistency(workerId)
validateModuleStatusTransition(moduleId, newStatus)
```

### 3.2 Integration Points

| Service | Function | Validation to Add |
|---------|----------|-------------------|
| modulesService | moveModuleToStation | validateStationProgression, validateQCGate |
| modulesService | updateModuleStatus | validateModuleStatusTransition |
| stationService | createStationAssignment | validateWorkerCertification, validateCrewSize |
| workersService | clockIn | validateShiftConsistency |
| workersService | assignToStation | validateWorkerCertification |

---

## PART 4: IMPLEMENTATION STEPS

### Phase 1: Foundation (COMPLETED)
1. ✅ Create consistency plan document
2. ✅ Create validationService.js with core functions
3. ✅ Update DEBUG_COMPLIANT_DEMO_DATA.sql with all fixes

### Phase 2: Demo Data (COMPLETED)
4. ✅ Fix worker shifts generation - weekdays only, single active shift
5. ✅ Fix QC records generation - for all modules past inspection stations
6. ✅ Fix station assignments generation - synced with module current_station_id
7. ✅ Fix cross-training generation - for all assigned workers

### Phase 3: Application Layer (COMPLETED)
8. ✅ Update modulesService.js with validations
9. ✅ Update workersService.js with validations

### Phase 4: Verification (READY)
10. ⬜ Run demo data and verify no inconsistencies
11. ⬜ Test application flows with new validations

---

## PART 5: KEY CAVEATS

1. **Rush Orders Exception**: Rush modules may bypass some station progression rules
2. **Historical Data**: Existing production data won't be auto-fixed; requires migration
3. **Edge Cases**: Some complex scenarios (rework loops, split modules) need manual handling
4. **Performance**: Validation adds overhead; implement efficiently with batch operations

---

## PART 6: FILES TO MODIFY

### New Files
- `src/services/validationService.js` - Central validation logic

### Modified Files
- `supabase/demo/DEBUG_COMPLIANT_DEMO_DATA.sql` - Demo data generation
- `src/services/modulesService.js` - Add validation calls
- `src/services/stationService.js` - Add validation calls
- `src/services/workersService.js` - Add validation calls
- `src/services/qcService.js` - Add sync logic

---
