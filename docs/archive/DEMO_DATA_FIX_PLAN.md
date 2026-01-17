# Demo Data Logic Fix Plan

## Status: ✅ IMPLEMENTED - January 16, 2026
## Analysis Date: January 16, 2026

---

## 1. PROBLEM DECOMPOSITION

### 1.1 Primary Issue Identified
**Module status is assigned based on sequence position, not date relationship to today.**

Current broken logic:
```sql
-- Line 768: Schedule calculated from project start
v_scheduled_start := v_project_start + ((j - 1) * 5);

-- Lines 721-740: Status assigned by module sequence position
IF j <= 2 THEN
  -- Early modules get Shipped/Staged/Completed
ELSIF j <= v_module_quantity / 2 THEN
  -- Middle modules get Completed/In Progress/QC Hold
ELSE
  -- Later modules get In Progress/In Queue/Not Started
END IF;
```

**Problem:** A module's `scheduled_start` can be in the FUTURE while its status is "In Progress" because:
- Project with start = today - 30 days
- Module j=10 has scheduled_start = (today - 30) + (9 * 5) = today + 15 days
- But sequence position j=10 (later half) assigns "In Progress" status

### 1.2 Secondary Issues to Address

| Issue | Description | Impact |
|-------|-------------|--------|
| **Date-Status Mismatch** | In Progress modules with future dates | Illogical data |
| **No actual_start tracking** | In Progress modules should have actual_start | Missing audit trail |
| **Station assignment** | Not correlated with progress dates | Inconsistent flow |
| **Project phase mismatch** | current_phase doesn't align with module progress | Dashboard confusion |

---

## 2. SOLUTION DESIGN

### 2.1 Core Principle
**The module's STATUS must be derived from its SCHEDULED_START relative to TODAY, not from sequence position.**

### 2.2 New Status Assignment Logic

```
DATE RELATIONSHIP          →  VALID STATUSES
─────────────────────────────────────────────────
scheduled_start > today    →  Not Started, In Queue
scheduled_start = today    →  In Queue, In Progress
scheduled_start < today    →  In Progress, QC Hold, Completed, Staged, Shipped
scheduled_end < today      →  Completed, Staged, Shipped (should be done)
```

### 2.3 Detailed Rules

| Condition | Valid Statuses | Station Assignment |
|-----------|----------------|-------------------|
| `scheduled_start > today + 7` | Not Started | NULL |
| `scheduled_start > today AND scheduled_start <= today + 7` | In Queue | Station 1-3 |
| `scheduled_start <= today AND scheduled_end > today` | In Progress, In Queue, QC Hold | Station 1-10 |
| `scheduled_end <= today AND scheduled_end > today - 14` | Completed, Staged | Station 10-11 |
| `scheduled_end < today - 14` | Shipped | Station 12 or NULL |

### 2.4 Additional Date Fields to Set

| Status | actual_start | actual_end | Logic |
|--------|--------------|------------|-------|
| Not Started | NULL | NULL | Work hasn't begun |
| In Queue | scheduled_start OR today | NULL | At station waiting |
| In Progress | <= today | NULL | Actively working |
| QC Hold | <= today | NULL | Paused for inspection |
| Completed | <= today | <= today | Done in factory |
| Staged | <= today | <= today | Ready for shipping |
| Shipped | <= today | <= today | Delivered |

---

## 3. IMPLEMENTATION STEPS

### Step 1: Calculate Date-Based Status
Replace the sequence-based IF/ELSIF chain with date-aware logic:

```sql
-- Calculate days from today
v_days_until_start := v_scheduled_start - v_today;
v_days_since_end := v_today - v_scheduled_end;

-- Assign status based on dates
IF v_days_until_start > 7 THEN
  -- Future module - not started
  v_mod_status := 'Not Started';
  v_mod_station_id := NULL;
  v_actual_start := NULL;
  v_actual_end := NULL;

ELSIF v_days_until_start > 0 THEN
  -- Upcoming week - queued
  v_mod_status := 'In Queue';
  -- Assign to early station
  v_actual_start := NULL;
  v_actual_end := NULL;

ELSIF v_days_since_end > 14 THEN
  -- Long overdue - should be shipped
  v_mod_status := 'Shipped';
  v_actual_start := v_scheduled_start;
  v_actual_end := v_scheduled_end + floor(random() * 7)::INTEGER;

ELSIF v_days_since_end > 0 THEN
  -- Past due - completed or staged
  v_mod_status := CASE WHEN random() < 0.7 THEN 'Staged' ELSE 'Completed' END;
  v_actual_start := v_scheduled_start;
  v_actual_end := v_scheduled_end + floor(random() * 3)::INTEGER;

ELSE
  -- Active period (between start and end)
  v_random_float := random();
  IF v_random_float < 0.6 THEN
    v_mod_status := 'In Progress';
  ELSIF v_random_float < 0.8 THEN
    v_mod_status := 'In Queue';
  ELSE
    v_mod_status := 'QC Hold';
  END IF;
  v_actual_start := v_scheduled_start - floor(random() * 3)::INTEGER;
  v_actual_end := NULL;
END IF;
```

### Step 2: Station Assignment Based on Status
```sql
-- Get appropriate station based on status
IF v_mod_status = 'Not Started' THEN
  v_mod_station_id := NULL;

ELSIF v_mod_status = 'In Queue' THEN
  -- Queue at early stations (1-4)
  SELECT id INTO v_mod_station_id
  FROM station_templates
  WHERE (factory_id = v_factory.id OR factory_id IS NULL)
    AND order_num BETWEEN 1 AND 4
    AND is_active = true
  ORDER BY random()
  LIMIT 1;

ELSIF v_mod_status = 'In Progress' THEN
  -- Calculate station based on how far through scheduled period
  v_progress_pct := LEAST(1.0, (v_today - v_scheduled_start)::FLOAT / GREATEST(1, (v_scheduled_end - v_scheduled_start)::FLOAT));
  v_target_station := 1 + floor(v_progress_pct * 9)::INTEGER;  -- Stations 1-10

  SELECT id INTO v_mod_station_id
  FROM station_templates
  WHERE (factory_id = v_factory.id OR factory_id IS NULL)
    AND order_num = v_target_station
    AND is_active = true
  LIMIT 1;

ELSIF v_mod_status = 'QC Hold' THEN
  -- At inspection stations (5 or 10)
  SELECT id INTO v_mod_station_id
  FROM station_templates
  WHERE (factory_id = v_factory.id OR factory_id IS NULL)
    AND requires_inspection = true
  ORDER BY random()
  LIMIT 1;

ELSIF v_mod_status IN ('Completed', 'Staged') THEN
  -- At final inspection or staging (10-11)
  SELECT id INTO v_mod_station_id
  FROM station_templates
  WHERE (factory_id = v_factory.id OR factory_id IS NULL)
    AND order_num BETWEEN 10 AND 11
  ORDER BY order_num DESC
  LIMIT 1;

ELSIF v_mod_status = 'Shipped' THEN
  -- Clear station or set to Shipping (12)
  SELECT id INTO v_mod_station_id
  FROM station_templates
  WHERE (factory_id = v_factory.id OR factory_id IS NULL)
    AND order_num = 12
  LIMIT 1;
END IF;
```

### Step 3: Update INSERT to include actual dates
```sql
INSERT INTO modules (
  project_id, factory_id, serial_number, name, sequence_number,
  status, current_station_id, scheduled_start, scheduled_end,
  actual_start, actual_end,  -- ADD THESE
  building_category, is_rush, module_width, module_length
)
VALUES (
  ...
  v_actual_start,
  v_actual_end,
  ...
)
```

### Step 4: Project Status Consistency
Update project status assignment to align with module distribution:
- If most modules are Shipped → Project should be 'Completed'
- If modules are mixed → Project should be 'Active'
- If all modules are Not Started → Project should be 'Draft' or 'Planning'

---

## 4. VALIDATION CHECKLIST

After applying fixes, verify:

- [ ] No modules have "In Progress" status with `scheduled_start > today`
- [ ] No modules have "Not Started" status with `scheduled_start < today - 7`
- [ ] Modules with "Completed/Staged/Shipped" have `actual_end` set
- [ ] Modules with "In Progress" have `actual_start` set
- [ ] Station assignments match status (Not Started = NULL, Shipped = station 12)
- [ ] Project status aligns with module progress

---

## 5. CONFIDENCE ASSESSMENT

| Component | Confidence | Reasoning |
|-----------|------------|-----------|
| Problem identification | 0.95 | Clear trace through code shows date-sequence mismatch |
| Solution logic | 0.90 | Standard date-based status patterns |
| Implementation | 0.85 | SQL is straightforward but edge cases exist |
| Overall | 0.88 | High confidence in fix approach |

---

## 6. KEY CAVEATS

1. **Random distribution may still create edge cases** - A module starting today could randomly get "In Queue" which is technically valid
2. **Rush orders** may need special handling - Rush modules might be "In Progress" before scheduled_start
3. **Project start date calculation** needs review to ensure projects span appropriate date ranges
4. **Calendar view depends on scheduled_start** - This is the date shown, and status should be consistent
