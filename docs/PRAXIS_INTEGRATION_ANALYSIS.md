# Praxis Integration Analysis

**Created:** January 13, 2026
**Status:** In Progress - Gathering Requirements

---

## Overview

This document captures findings from analyzing Praxis (Access-based estimating software) and planning the integration with Sunbelt PM System.

### Goal
Enable sales team to create projects in Sunbelt PM from their Praxis quotes/estimates without re-entering data. Praxis remains the source of truth for estimates; Sunbelt PM is the tracking layer for project execution.

### Current State
- Each factory has its own Praxis server (isolated, no cross-factory communication)
- Praxis is Access-based with export capabilities
- Manual handoff process currently uses paper/PDF forms

---

## Source Documents Analyzed

| Document | Status | Key Findings |
|----------|--------|--------------|
| Sales to Project Coordinator Handoff.pdf | Reviewed | Handoff form with all required fields |
| SB2025-001-Dealer Requirements.pdf | Reviewed | Dealer qualification & onboarding requirements |
| Creating Sales Orders in Praxis.docx | Pending | Need PDF conversion |
| Change Orders or Red Line Revisions in Praxis.docx | Pending | Need PDF conversion |
| Praxis Quote Check Spreadsheet.xlsx | Pending | Need PDF conversion |
| Order processing -Checklist.xlsx | Pending | Need PDF conversion |
| NWBS Estimating Process.docx | Pending | Need PDF conversion |
| Procedures for quoting and Sales Releases.doc | Pending | Need PDF conversion |

---

## Data Fields from Handoff Form

### Project Header Information
| Praxis/Handoff Field | Sunbelt PM Field | Status |
|---------------------|------------------|--------|
| Estimator | `owner_id` or `estimator_id` | Needs mapping |
| Bid Folder Number | `praxis_bid_number` | **NEW FIELD NEEDED** |
| Serial Number | `serial_number` | **NEW FIELD NEEDED** |
| Module Letters (A-D) | `module_letters` or `module_count` | **NEW FIELD NEEDED** |
| Project Size | `square_footage` | Exists |
| Project Name | `name` | Exists |
| Customer desired offline date | `target_completion_date` | Exists |
| Material Cost | `material_cost` | **NEW FIELD NEEDED** |
| States for Insignia | `insignia_states` | **NEW FIELD NEEDED** |

### Dealer/Location Information
| Praxis/Handoff Field | Sunbelt PM Field | Status |
|---------------------|------------------|--------|
| Dealer | `dealer_id` → factory_contacts | Needs linking |
| Dealer Contact Info | Part of factory_contacts | Exists |
| Dealer Location | Part of factory_contacts | Exists |
| End Location Address | `site_address` | **NEW FIELD NEEDED** |
| End Location County | `site_county` | **NEW FIELD NEEDED** |
| City vs County installation | `jurisdiction_type` | **NEW FIELD NEEDED** |

### Required Documents Checklist
These should be tracked as a checklist or attachments in Sunbelt PM:

- [ ] Purchase Order
- [ ] Sales Release
- [ ] Building Order Sheet
- [ ] Cut Sheets
- [ ] Vendor Quotes
- [ ] Emails
- [ ] Plans
- [ ] Color Selection Form
- [ ] Long Lead Form

### Project Requirements (Boolean Flags)
| Requirement | Sunbelt PM Field | Status |
|-------------|------------------|--------|
| Requires Cut Sheet Manuals | `requires_cut_sheets` | **NEW FIELD NEEDED** |
| Requires Physical Samples | `requires_samples` | **NEW FIELD NEEDED** |
| Requires O&M Manuals | `requires_om_manuals` | **NEW FIELD NEEDED** |
| Foundation Plan Status | `foundation_plan_status` | **NEW FIELD NEEDED** |

Foundation Plan Status options:
- Purchasing (from factory)
- Providing (customer provides)
- Not Applicable

---

## Proposed Schema Changes

### projects table additions
```sql
-- Praxis Integration Fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS praxis_bid_number VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS serial_number VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS module_letters VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS material_cost DECIMAL(12,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insignia_states TEXT[];

-- Location Fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_address TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_county VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS jurisdiction_type VARCHAR(20); -- 'city' or 'county'

-- Dealer Link
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES factory_contacts(id);

-- Project Requirements
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_cut_sheets BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_samples BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_om_manuals BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS foundation_plan_status VARCHAR(20); -- 'purchasing', 'providing', 'na'

-- Praxis Sync Tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS praxis_synced_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS praxis_source_factory VARCHAR(10);
```

### New table: project_documents_checklist
```sql
CREATE TABLE project_documents_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  is_required BOOLEAN DEFAULT true,
  is_received BOOLEAN DEFAULT false,
  received_date DATE,
  file_attachment_id UUID REFERENCES file_attachments(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document types:
-- purchase_order, sales_release, building_order_sheet, cut_sheets,
-- vendor_quotes, emails, plans, color_selection, long_lead_form
```

---

## Integration Approaches

### Option A: Manual Excel Upload (Simplest)
**How it works:**
1. Sales exports quote data from Praxis to Excel
2. Sales uploads Excel to Sunbelt PM
3. System parses Excel and creates/updates project

**Pros:**
- No server access needed
- Works with current isolated factory setup
- Sales controls when data syncs

**Cons:**
- Manual step required
- Potential for stale data

### Option B: Watched Folder Auto-Import
**How it works:**
1. Each factory has a shared folder Praxis exports to
2. Sunbelt PM watches folders for new files
3. Auto-imports when files appear

**Pros:**
- More automated than Option A
- Still works with isolated servers

**Cons:**
- Requires server-side process
- Network folder access needed

### Option C: Direct Database Connection (Future)
**How it works:**
1. When factories migrate to cloud
2. Direct read access to Praxis database
3. Real-time or scheduled sync

**Pros:**
- Most automated
- Always up-to-date

**Cons:**
- Requires cloud migration (in progress but difficult)
- Database schema knowledge needed

### Recommendation
Start with **Option A (Manual Excel Upload)** because:
- Works immediately with current infrastructure
- No IT infrastructure changes needed
- Gives sales control over handoff timing
- Can upgrade to Option B/C later

---

## Questions to Clarify

1. **Praxis Export Format:** What does a Praxis export look like? (Excel columns, format)
2. **Unique Identifier:** Is Bid Folder Number unique across all factories?
3. **Update Flow:** When Praxis data changes, should Sunbelt PM auto-update or require manual re-import?
4. **Who Imports:** Sales person, Project Coordinator, or either?
5. **Validation:** Should import reject if required fields missing, or create with warnings?

---

## Next Steps

1. [ ] Get PDF conversions of remaining Praxis docs
2. [ ] Understand Praxis export format/fields
3. [ ] Design import UI mockup
4. [ ] Review with stakeholders
5. [ ] Implement schema changes
6. [ ] Build import functionality

---

## Dealer Entity Notes

From **SB2025-001-Dealer Requirements.pdf**:

Dealers are authorized partners who sell/lease Sunbelt modular buildings. They are a critical entity in the sales flow:
- **Quote** → created for a Dealer
- **Dealer** → sells to End Customer
- **Project** → tracks the building through production/delivery

### Dealer Qualification Requirements
- Financial qualification (credit app + W9)
- Minimum annual modular spending budget
- Active Dealer's License (state-dependent)
- Dedicated modular employee(s)
- Modular business plan or division
- Marketing materials (modular-focused webpage)

### Implication for Sunbelt PM
Need to properly model Dealers as an entity:
- Option A: Use `factory_contacts` with `contact_type = 'dealer'`
- Option B: Create dedicated `dealers` table with richer fields
- Dealers link to projects via `dealer_id` foreign key

---

## Appendix: Source Document References

### Sales to Project Coordinator Handoff.pdf
See: `docs/Sunbelt Sales & Praxis Training Materials/When a Building is Sold/Required for Initial Handoff/Sales to Project Coordinator Handoff.pdf`

Key sections:
- Page 1: Project info, document checklist, requirements, location details

### Dealer Requirements
See: `docs/Sunbelt Sales & Praxis Training Materials/Dealer Info/SB2025-001-Dealer Requirements.pdf`
