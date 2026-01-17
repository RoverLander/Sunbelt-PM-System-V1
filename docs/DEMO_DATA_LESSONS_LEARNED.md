# Demo Data Lessons Learned

**Created:** January 17, 2026
**Purpose:** Document schema discrepancies and lessons learned during demo data creation

---

## CRITICAL LESSONS LEARNED

### 1. ALWAYS Check Schema Before Writing SQL

**Mistake:** Created SQL with assumed column names without verifying actual database schema.

**Correct Process:**
1. Read DATABASE_SCHEMA.md FIRST
2. Verify table structures against actual migrations
3. Cross-reference CLAUDE_INSTRUCTIONS.md for business rules
4. Use the Sunbelt Directory Excel for contact data source

---

## SCHEMA DISCREPANCIES FOUND

### Table: `sales_customers`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `name` | `company_name` |
| `company` | N/A (removed/merged) |
| `customer_type` | `company_type` |
| `factory_id` (UUID) | `factory` (VARCHAR - factory code) |
| `address` | `address_line1` |
| `email` | `contact_email` |
| `phone` | `contact_phone` |

**Correct `sales_customers` columns:**
- `id`, `company_name` (UNIQUE), `company_type`, `contact_name`, `contact_title`, `contact_email`, `contact_phone`, `address_line1`, `city`, `state`, `zip_code`, `factory`, `notes`, `is_active`, `created_at`, `updated_at`

**Valid `company_type` values:** `general`, `government`, `direct`, `dealer`

---

### Table: `sales_quotes`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `quote_date` | `created_at` (timestamp, auto) |
| `estimated_value` | `total_price` |
| `factory_code` | `factory` |
| `lost_reason` | N/A (not in schema) |

**Correct `sales_quotes` columns:**
- `id`, `quote_number`, `customer_id`, `status`, `total_price`, `won_date`, `assigned_to`, `notes`, `is_latest_version`
- Praxis: `praxis_quote_number`, `praxis_source_factory`
- Dealer: `dealer_id`, `dealer_branch`, `dealer_contact_name`
- Building: `building_type`, `building_width`, `building_length`, `square_footage`, `unit_count`, `module_count`, `stories`
- Compliance: `state_tags`, `climate_zone`, `occupancy_type`, `set_type`, `sprinkler_type`, `has_plumbing`, `wui_compliant`
- Pipeline: `outlook_percentage`, `waiting_on`, `expected_close_timeframe`, `difficulty_rating`, `valid_until`
- PM Flagging: `pm_flagged`, `pm_flagged_at`, `pm_flagged_by`, `pm_flagged_reason`
- Conversion: `converted_to_project_id`, `project_id`, `converted_at`, `converted_by`
- Project: `project_name`, `project_description`, `project_location`, `project_city`, `project_state`, `factory`

**Valid `status` values:** `draft`, `pending`, `sent`, `negotiating`, `awaiting_po`, `po_received`, `won`, `lost`, `expired`, `converted`

---

### Table: `tasks`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `assigned_to` | `assignee_id` OR `internal_owner_id` |

**Assignment Fields (Complex):**
- `assignee_id` - Old assignment field (FK to users.id)
- `internal_owner_id` - Internal team owner (FK to users.id)
- `assigned_to_contact_id` - FK to directory_contacts.id
- `assigned_to_name`, `assigned_to_email` - Snapshots
- `notify_contacts` - JSONB array of {id, name, email}
- `is_external`, `assigned_to_external_id` - External contact assignment
- `assigned_external_name`, `assigned_external_email`
- `external_assignee_name`, `external_assignee_email` - Legacy fields

---

### Table: `rfis`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `submitted_by` | `internal_owner_id` |
| `assigned_to` | `assigned_to_contact_id` OR `internal_owner_id` |

**Similar complex assignment fields as tasks.**

---

### Table: `submittals`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `submitted_by` | `internal_owner_id` |

**Similar complex assignment fields as tasks/rfis.**

---

### Table: `milestones`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `name` | `title` |
| `target_date` | `due_date` |
| `description` | `notes` |

---

### Table: `change_orders`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `title` | `description` (use this for title content) |
| `amount` | `total_amount` |
| `requested_by` | `created_by` |
| `approved_by` | N/A (status tracks approval) |
| `request_date` | `date` |

**Correct columns:** `id`, `project_id`, `change_order_number`, `co_number`, `change_type`, `co_type`, `status`, `description`, `reason`, `notes`, `date`, `submitted_date`, `sent_date`, `signed_date`, `implemented_date`, `total_amount`, `document_url`, `created_by`, `created_at`, `updated_at`

---

### Table: `long_lead_items`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `order_date` | `order_date` (correct) |
| `expected_date` | `expected_delivery` |
| `vendor` | `supplier` |

---

### Table: `color_selections`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `selection_name` | `item_name` |
| `color_code` | `color_code` (correct) |

---

### Table: `announcements`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `message` | `content` |
| `type` | `announcement_type` |
| `priority` | N/A (not in schema - only has `is_dismissible`) |
| `start_date` | `starts_at` (TIMESTAMPTZ) |
| `end_date` | `expires_at` (TIMESTAMPTZ) |
| `target_roles` | `target_roles` (TEXT[] not VARCHAR) |

---

### Table: `feature_flags`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| `key` | `flag_key` |
| `flag_type` | `category` |
| `allowed_roles` | `target_roles` |

---

### Table: `station_assignments`

| SQL Used (WRONG) | Actual Schema (CORRECT) |
|------------------|-------------------------|
| Used correctly | Verify `lead_id` FK is to `users.id` (not workers) |

**Note:** Per schema, `lead_id` is FK to `users.id`, not `workers.id`. This means leads must have user accounts.

---

## BUSINESS RULES TO REMEMBER

### 1. PM Team Structure
- **Corporate/Remote PMs:** Not tied to specific factories
  - Candy Nelson (Director, also PM duties, fewer projects)
  - Crystal James (PM, 4+ projects)
  - Matthew McDaniel (PM, Primary: NWBS, Secondary: WM-EVERGREEN)
  - Michael (PM, 4+ projects)
  - Hector (PM, 4+ projects)

### 2. Factory-Specific Roles
- Sales_Manager, Sales_Rep, PC, Plant_GM are factory-specific
- These users have `factory` and `factory_id` populated

### 3. Project Ownership
- **PM Jobs:** `is_pm_job = true`, contract value $500k+
  - Has `primary_pm_id` (required)
  - Has `backup_pm_id` (another PM from team)
  - `owner_id` = `primary_pm_id`

- **STOCK Jobs:** `is_pm_job = false`, handled by PCs
  - `primary_pm_id` = NULL
  - `backup_pm_id` = NULL
  - `owner_id` = PC user

### 4. Project Clustering
Each PM should have projects clustered around specific factories:
- Matthew: NWBS (3), WM-EVERGREEN (2), SMM (1)
- Crystal: PMI (3), WM-SOUTH (2), AMT (1)
- Michael: WM-EAST (3), WM-ROCHESTER (2)
- Hector: WM-SOUTH (3), AMT (2)
- Candy: Various (2-3 projects)

### 5. Valid Building Types
- `CUSTOM`, `FLEET/STOCK`, `GOVERNMENT`, `Business`

### 6. Valid Project Statuses
- `Draft`, `Active`, `In Progress`, `On Hold`, `Complete`, `Cancelled`

### 7. Valid Health Statuses
- `On Track`, `At Risk`, `Critical`

### 8. Workflow Phases
- Phase 1: Sales Handoff, Kickoff Meeting
- Phase 2: Drawings (20%, 65%, 95%, 100%), Color Selections, Long Lead Items, Cutsheets
- Phase 3: Engineering Review, Third Party, State Approval, Production Release
- Phase 4: Production, QC Inspection, Staging, Delivery, Set Complete, Closeout

### 9. Directory Contacts
- Internal contacts: `directory_contacts` (from Sunbelt Directory Excel)
- External contacts: `external_contacts`
- Never mix these up in assignments

---

## CHECKLIST FOR FUTURE SQL GENERATION

Before writing any demo data SQL:

- [ ] Read DATABASE_SCHEMA.md completely
- [ ] Read CLAUDE_INSTRUCTIONS.md for business rules
- [ ] Check actual migration files if schema doc might be outdated
- [ ] Use exact column names from schema
- [ ] Check FK references (users.id vs workers.id)
- [ ] Verify ENUM/valid values for status columns
- [ ] Use correct data types (UUID vs VARCHAR, TIMESTAMPTZ vs DATE)
- [ ] Follow naming conventions (factory vs factory_code, company_name vs name)
- [ ] Cross-reference with existing users before assigning owner_id
- [ ] Use Sunbelt Directory Excel for contact data

---

### Table: `projects` - SCHEMA GAP RESOLVED

| Column Added | Migration |
|--------------|-----------|
| `is_pm_job` | `supabase/migrations/20260117_add_is_pm_job_column.sql` |

**Business Rule:**
There are two distinct project types with different ownership and tracking:

1. **PM Jobs** (`is_pm_job = true`)
   - Managed by Corporate PM team (Candy, Crystal, Matthew, Michael, Hector)
   - Tracked in PM Dashboard
   - Has `primary_pm_id` and `backup_pm_id` assigned
   - Typically higher contract value ($500k+)
   - Building types: Usually CUSTOM, GOVERNMENT

2. **PC Jobs / STOCK Jobs** (`is_pm_job = false`)
   - Managed by factory-specific PCs (Dawn at NWBS, Juanita at PMI)
   - Also visible to Plant GM (PGM) at the factory
   - NOT tracked by PMs - they don't see these in their dashboard
   - `primary_pm_id` and `backup_pm_id` are NULL
   - `owner_id` = the PC user
   - Building types: FLEET/STOCK

**STATUS:** ✅ RESOLVED - Migration and demo data updated

---

## CORRECTIONS COMPLETED

The following sections in COMPREHENSIVE_DEMO_DATA.sql have been fixed:

1. **Section 2 (factories):** Added `is_active = true` to all factory rows (column count mismatch)
2. **Section 4 (workflow_stations):** Added `is_active = true` to all rows (column count mismatch)
3. **Section 5 (projects):** Added `is_pm_job` column after migration created it
4. **Section 9 (station_assignments):** Fixed `lead_id` to use `users.id` not `workers.id` (FK constraint)
5. **Section 16 (sales_customers):** Fixed to use `company_name`, `company_type`, `contact_email`, `contact_phone`, `address_line1`, `factory` (VARCHAR)
6. **Section 17 (sales_quotes):** Fixed to use `total_price`, `factory`, removed `quote_date`, `lost_reason`
7. **Section 18 (tasks):** Fixed to use `internal_owner_id` instead of `assigned_to`
8. **Section 19 (rfis):** Fixed to use `internal_owner_id` instead of `submitted_by`/`assigned_to`
9. **Section 20 (submittals):** Fixed to use `internal_owner_id`, added `submittal_type`
10. **Section 21 (milestones):** Fixed to use `title`, `due_date`, `notes`
11. **Section 22 (change_orders):** Fixed to use `change_order_number`, `co_number`, `total_amount`, `date`
12. **Section 23 (long_lead_items):** Fixed to use `supplier`, `expected_delivery`
13. **Section 24 (color_selections):** Fixed to use `item_name`, `color_name`
14. **Section 25 (announcements):** Fixed to use `content`, `announcement_type`, `starts_at`, `expires_at`
15. **Section 26 (feature_flags):** Fixed to use `flag_key`, `category`, `target_roles`

---

## CHANGELOG

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-17 | Claude | Initial document created after schema verification |
