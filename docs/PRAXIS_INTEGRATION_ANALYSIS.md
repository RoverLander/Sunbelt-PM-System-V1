# Praxis Integration Analysis

**Created:** January 13, 2026
**Status:** Analysis Complete - Ready for Implementation Planning
**Last Updated:** January 13, 2026

---

## Overview

This document captures findings from analyzing Praxis (Access-based estimating software) and planning the integration with Sunbelt PM System.

### Goal
Enable sales team to create projects in Sunbelt PM from their Praxis quotes/estimates without re-entering data. Praxis remains the source of truth for estimates; Sunbelt PM is the tracking layer for project execution.

### Current State
- Each factory has its own Praxis server (isolated, no cross-factory communication)
- Praxis is Access-based with export capabilities (can print to PDF, export reports)
- Manual handoff process currently uses paper/PDF forms and email
- Quote numbers are factory-prefixed (e.g., `NW-0061-2025` for Northwest)

---

## Source Documents Analyzed

| Document | Status | Key Findings |
|----------|--------|--------------|
| Sales to Project Coordinator Handoff.pdf | **Reviewed** | Handoff form with all required fields |
| SB2025-001-Dealer Requirements.pdf | **Reviewed** | Dealer qualification & onboarding requirements |
| Creating Sales Orders in Praxis.pdf | **Reviewed** | Complete 34-step workflow from PO to handoff |
| Procedures for quoting and Sales Releases.pdf | **Reviewed** | Quote approval process, sales release requirements |
| Estimating Process.pdf | **Reviewed** | High-level estimating approach and BOS importance |
| NWBS Estimating Process.pdf | **Reviewed** | Detailed Praxis UI walkthrough with screenshots |
| Order processing -Checklist.pdf | **Reviewed** | 11-item document checklist for order processing |
| Change Orders or Red Line Revisions in Praxis.pdf | **Reviewed** | Change order workflow, factor adjustments, internal signatures |
| Canceling Orders in Praxis.pdf | **Reviewed** | Cancellation process, negative entries, status updates |
| Long Lead Form.pdf | **Reviewed** | Long lead item tracking with qty, color, lead time |
| Color Selection Form.pdf | **Reviewed** | Color selections for flooring, walls, doors, roofing, etc. |

---

## Praxis System Overview

### Main Menu Structure
- **Maintain Quotes** → Estimate Building, Item And Option Pricing, Print Quotes, Sales Release/Building Order
- **Reports**
- **Bill Of Materials**
- **Inventory**
- **Update Info Tables**

### Key Praxis Screens

#### 1. Estimate Entry (Quote Screen)
| Field | Example Value | Notes |
|-------|---------------|-------|
| Quote Number | NW-0061-2025 | Factory prefix + sequential number + year |
| Ver | 3 of 3 | Version tracking |
| Quote Received | 21-Feb-25 | Date quote request received |
| Creation Date | 21-Feb-25 | Date quote created |
| Date Sold | 08-May-25 | Date PO received |
| Building Description | 14x65 INL Restroom Facility | Free text |
| Quote Status | Open / Sold | Dropdown |
| Quote Notes | 250125 | Bid folder number reference |
| Building Type | CUSTOM, FLEET/STOCK, GOVERNMENT | Dropdown |
| Height | 11, 12, 13 | Based on module length |
| Width | 14 | Module width |
| Length | 65 | Module length |
| Interior Wall | 26 | Linear feet of interior walls |
| # of Stories | 1 | Number of stories |
| Salesman | Mitch Quintana | Dropdown |
| Customer | Mobile Modular, etc. | Dropdown (Dealer) |
| Contact | Steve Haynie | Dealer contact |

#### Cost Fields
| Field | Example | Notes |
|-------|---------|-------|
| Total Material Cost | $85,303.59 | Raw materials |
| Factor | 0.500 | Markup factor |
| Material Factor Cost | $174,319.33 | Material x Factor |
| All Other Quote Costs | $10,505.00 | Engineering, approvals, etc. |
| **Total cost for this estimate** | **$184,824.33** | Final quote price |

#### Itemized Costs
| Cost Type | Example Value |
|-----------|---------------|
| Approvals/Inspections | $1,922.00 |
| Engineering (Sub Con) | $0.00 |
| Engineering (Internal) | $1,800.00 |
| Service Allowance | $1,800.00 |
| Contingency | $3,203.00 |
| Fedex | $50.00 |
| MBI Seal | $30.00 (per mod) |
| Waste | 0.0200 (2%) |

#### 2. Building Order Sheet
Fields captured when quote converts to sale:
| Field | Notes |
|-------|-------|
| Serial Number | Auto-generated (e.g., 25239) |
| Quote Number | Links back to quote |
| Description | Building description |
| New Total | Final price after options |
| Sales Rep | Salesperson name |
| Date | Sale date |
| PO Number | Customer PO |
| Project Number | Internal project number |
| Dealer | Dealer name |
| Dealer Branch | Dealer location code (e.g., MOBMOD-BOISE) |
| Dealer Rep | Dealer contact name |
| Tags | State tags |
| BLDG Size | Width x Length |
| # Bldgs | Number of buildings |
| MOD Size | Module dimensions |
| Occupancy | Building occupancy type (A, B, E, etc.) |
| Special Materials | TT&P, Sprinklers, Plumbing checkboxes |
| Long Lead | Longest lead time item |
| Prints Due | Drawing due date |
| Promised Delivery Date | Customer requested date |

#### 3. Sales Release Screen
| Field | Notes |
|-------|-------|
| Serial Number | Building serial |
| Dealer Address | Shipping address |
| BLDG Address | Site installation address |
| Climate Zone | 1-8 |
| Floor Load | psf rating |
| Roof Load | psf rating |
| Set Type | PAD/PIERS/ABOVE GRADE SET |
| Occupancy | A, B, E, etc. |
| WUI Compliant | PMI Only checkbox |
| Plumbing Manifold Supplied | Checkbox |
| Sprinkler System | N/A, Wet, Dry |
| Hitch/HVAC Location On Plan | Checkbox |
| Vendor Quotes (Cut Sheets Attached) | Checkbox |

---

## Complete Workflow: Quote to Project Handoff

### Phase 1: Quoting
1. Receive bid request from dealer
2. Create quote folder in Sales drive
3. Add to Sales Project Log
4. Create/duplicate quote in Praxis
5. Fill out building specs (dimensions, climate zone, snow load, etc.)
6. Add materials via Quote Details
7. Review with manager (quotes >$800K need VP approval, >$1M need exec approval)
8. Send quote to dealer

### Phase 2: PO Receipt & Conversion
1. Receive Purchase Order from dealer
2. **Verify PO price matches Praxis quote** (including options)
3. Save PO to quote folder
4. **CRITICAL: Check with team before converting** (only one person should generate serial numbers at a time)
5. Change Quote Status to "Sold"
6. Add Date Sold
7. Generate Serial Number(s)

### Phase 3: Building Order Sheet & Sales Release
1. Fill out Building Order Sheet with all details
2. **Verify New Total matches PO total**
3. Fill out Sales Release with site info, compliance details
4. Print/Save both to bid folder

### Phase 4: Handoff Documents
1. Fill out **Color Selection Form**
2. Fill out **Long Lead Form** (items, lead times)
3. Fill out **Sales to Project Coordinator Handoff Document**

### Phase 5: Email Handoff
Send to: PC, GM, Design Manager, Production Manager, Purchasing Manager, Accounts Receivable

---

## Change Orders / Red Line Revisions

After initial handoff, changes flow through the **Redlines** tab in Praxis:

### Change Order Workflow
1. Dealer requests changes (redlines)
2. Sales person enters changes in Praxis Redlines tab
3. Build out changes with itemized adds/removes (positive/negative quantities)
4. Apply factor based on project stage:
   - **Before design handoff:** Same factor as building (e.g., 0.56)
   - **After drawings/state approval:** Subtract 2 points (e.g., 0.54)
   - **On production line:** Subtract 4 points (e.g., 0.52)
5. Print Redline Change Order PDF
6. Email to customer for signature + updated PO
7. Once signed, get internal signatures (GM, Production, Design, Purchasing, QA, Accounting, PC)
8. Mark as "Customer Accepted" in Praxis
9. Update Sales Release with changes
10. Reprint Sales Release and Building Order Sheet
11. Notify all managers of new building cost

### Change Order Fields
| Field | Notes |
|-------|-------|
| Description | Full text description of changes |
| Item/Category/SubCategory | Line items being added/removed |
| Qty | Positive = add, Negative = remove |
| Price | Unit price |
| Factor | Adjusted based on project stage |
| Factor Price | Price x Factor |
| Change Order # | Sequential number |
| Customer Accepted | Yes-Accept / No-Decline |

---

## Cancellations

### Cancellation Workflow
1. Sales Manager creates negative redline entry crediting full or partial price
2. Email executives (Jay Daniels, Jay Vanvlerah), GM, and PC with:
   - Serial numbers cancelled
   - Customer PO # affected
   - Effect on revenue
   - Reason for cancellation
   - Suggested refund amount
3. Get approval and signatures
4. Remove from Pipeline Report
5. PC marks status as "canceled" in Project Log

**Key Point:** Cancellations are handled as negative change orders, not deletion.

---

## Order Processing Document Checklist

1. Building Order
2. PO or NTP
3. Color Directive
4. Long Lead Form
5. Floorplan used for quote
6. Pre-Release (if applicable)
7. Sales Release
8. Dealer Quote Request
9. Special Pricing or cut sheets
10. Correspondence
11. Extension Sheet

---

## Data Field Mapping: Praxis to Sunbelt PM

### Project Header
| Praxis Field | Sunbelt PM Field | Status |
|-------------|------------------|--------|
| Quote Number | `praxis_quote_number` | **NEW** |
| Serial Number | `serial_number` | **NEW** |
| Building Description | `name` | Exists |
| Date Sold | `sold_date` | **NEW** |
| Salesman | `estimator_id` | **NEW** |
| Customer (Dealer) | `dealer_id` | **NEW** |
| Building Type | `building_type` | **NEW** |

### Building Specifications
| Praxis Field | Sunbelt PM Field | Status |
|-------------|------------------|--------|
| Height | `building_height` | **NEW** |
| Width | `building_width` | **NEW** |
| Length | `building_length` | **NEW** |
| Interior Wall LF | `interior_wall_lf` | **NEW** |
| # of Stories | `stories` | **NEW** |
| MOD Size | `module_size` | **NEW** |

### Cost Information
| Praxis Field | Sunbelt PM Field | Status |
|-------------|------------------|--------|
| Total Material Cost | `material_cost` | **NEW** |
| Factor | `markup_factor` | **NEW** |
| Total cost for estimate | `contract_value` | Exists |
| Engineering | `engineering_cost` | **NEW** |
| Approvals | `approvals_cost` | **NEW** |

### Location & Compliance
| Praxis Field | Sunbelt PM Field | Status |
|-------------|------------------|--------|
| State Tags | `state_tags` | **NEW** |
| Climate Zone | `climate_zone` | **NEW** |
| Floor Load | `floor_load_psf` | **NEW** |
| Roof Load | `roof_load_psf` | **NEW** |
| Site Address | `site_address` | **NEW** |
| Occupancy | `occupancy_type` | **NEW** |
| Set Type | `set_type` | **NEW** |

### Special Requirements
| Praxis Field | Sunbelt PM Field | Status |
|-------------|------------------|--------|
| TT&P | `requires_ttp` | **NEW** |
| Sprinklers | `sprinkler_type` | **NEW** |
| Plumbing | `has_plumbing` | **NEW** |
| WUI Compliant | `wui_compliant` | **NEW** |
| Cut Sheet Manuals | `requires_cut_sheets` | **NEW** |
| O&M Manuals | `requires_om_manuals` | **NEW** |
| Foundation Plan | `foundation_plan_status` | **NEW** |

### Dealer Information
| Praxis Field | Sunbelt PM Field | Status |
|-------------|------------------|--------|
| Dealer | `dealer_id` | **NEW** |
| Dealer Branch | `dealer_branch` | **NEW** |
| Dealer Rep | `dealer_contact_name` | **NEW** |
| PO Number | `customer_po_number` | **NEW** |

### Schedule
| Praxis Field | Sunbelt PM Field | Status |
|-------------|------------------|--------|
| Promised Delivery Date | `promised_delivery_date` | **NEW** |
| Prints Due | `drawings_due_date` | **NEW** |
| Long Lead Notes | `long_lead_notes` | **NEW** |

---

## Proposed Schema Changes

### projects table additions
```sql
-- Praxis Integration Fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS praxis_quote_number VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS serial_number VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_type VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sold_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimator_id UUID REFERENCES users(id);

-- Building Specifications
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_height INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_width INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_length INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS interior_wall_lf INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stories INTEGER DEFAULT 1;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS module_size VARCHAR(20);

-- Cost Information
ALTER TABLE projects ADD COLUMN IF NOT EXISTS material_cost DECIMAL(12,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS markup_factor DECIMAL(5,3);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS engineering_cost DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approvals_cost DECIMAL(10,2);

-- Location & Compliance
ALTER TABLE projects ADD COLUMN IF NOT EXISTS state_tags TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS climate_zone INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS floor_load_psf INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS roof_load_psf INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_address TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_city VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_state VARCHAR(2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_zip VARCHAR(10);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS occupancy_type VARCHAR(5);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS set_type VARCHAR(20);

-- Special Requirements
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_ttp BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sprinkler_type VARCHAR(10);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS has_plumbing BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS wui_compliant BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_cut_sheets BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_om_manuals BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS foundation_plan_status VARCHAR(20);

-- Dealer Information
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dealer_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dealer_branch VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dealer_contact_name VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_po_number VARCHAR(50);

-- Schedule
ALTER TABLE projects ADD COLUMN IF NOT EXISTS promised_delivery_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS drawings_due_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS long_lead_notes TEXT;

-- Sync Tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS praxis_synced_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS praxis_source_factory VARCHAR(10);
```

### New table: dealers
```sql
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(100),
  contact_name VARCHAR(100),
  factory_id UUID REFERENCES factories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New table: project_documents_checklist
```sql
CREATE TABLE project_documents_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  display_order INTEGER,
  is_required BOOLEAN DEFAULT true,
  is_received BOOLEAN DEFAULT false,
  received_date DATE,
  file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New table: long_lead_items
```sql
CREATE TABLE long_lead_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  color VARCHAR(100),
  lead_time_weeks INTEGER,
  sign_off_received BOOLEAN DEFAULT false,
  sign_off_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Integration Approach Recommendation

### Phase 1: Manual Import (Start Here)
**Trigger:** When quote status changes to "Sold" and serial number is generated

**Process:**
1. Sales exports Building Order Sheet + Sales Release as PDF from Praxis
2. Sales uploads to Sunbelt PM via import form
3. Manual data entry form pre-populated where possible
4. Review and confirm
5. Project created in Sunbelt PM

### Phase 2: Structured Export (Future)
Add custom CSV export report to Praxis for automated field mapping.

### Phase 3: Direct Integration (Far Future)
When factories migrate to cloud, direct database sync becomes possible.

---

## Key Findings

1. **Quote Number Format:** `{Factory}-{Sequence}-{Year}` (e.g., NW-0061-2025)
2. **Serial Number:** Auto-generated sequential per factory (e.g., 25239)
3. **Unique Identifier:** Serial Number + Factory is globally unique
4. **Handoff Trigger:** PO receipt and quote status change to "Sold"
5. **Handoff Recipient:** Project Coordinator
6. **Critical Data Sources:** Building Order Sheet + Sales Release contain 95% of needed data

---

---

## Additional Documents Analyzed (Session 2)

| Document | Status | Key Findings |
|----------|--------|--------------|
| Pipeline Report Template.xlsx | **Reviewed** | Sales forecasting with quote-to-serial transition tracking |
| Sales Project Log Blank Copy.xlsx | **Reviewed** | Quoting activity tracker with folder #, difficulty rating |
| Pre-Customer Meeting Requirements.pdf | **Reviewed** | Critical post-handoff milestone with role responsibilities |
| Sales Folder Order of Importance.pdf | **Reviewed** | Document hierarchy (Sales Release > BOS > Change Orders) |
| 2 hour fire wall parts.pdf | **Reviewed** | BOM template with ABAS part numbers, 47% markup |
| Folder Templates/ | **Reviewed** | Standard 8-section project folder structure |

---

## Pipeline Report Fields

The Pipeline Report tracks deals from quote through sale:

| Field | Description |
|-------|-------------|
| Salesperson | Deal owner |
| Dealer | Customer (US MOD, MMG, PMSI, United Rentals) |
| Serial/Quote Number | Serial if sold (100%), Quote # if pending (95%) |
| BLDG Size | Width x Length |
| QTY Floors | Number of buildings |
| Amount | Unit price |
| Total Project | Amount x QTY (calculated) |
| Description | Government, Business, Stock |
| Waiting On | Blocker (PO, Sign Off, Colors) |
| Timeframe | Expected close |
| Outlook | Probability % |

**Key Insight:** The transition from Quote Number to Serial Number indicates sale completion.

---

## Sales Project Log Fields

Tracks quoting activity before sale:

| Field | Description |
|-------|-------------|
| Estimator | Who's quoting |
| Date Received | Bid request date |
| Q&A Due Date | Question deadline |
| Due Date | Quote due date |
| Folder # | Bid folder reference (e.g., 251201) |
| BLDG Description | Building type/size |
| Customer / Contact | Dealer info |
| Progress Notes | Status |
| Quote # | Factory-prefix format |
| Quote Status | Complete, In Progress |
| Quoted Price | Total price |
| Price per SF | $/sqft metric |
| State Tags | Destination state |
| Width / Length / # Of Mods | Dimensions |
| Difficulty | Complexity rating |

---

## Pre-Customer Meeting Process (NEW)

A critical milestone ~2 days after foremen receive prints, before sending to customer.

### Required Attendees
- GM
- Purchasing Manager
- Production Manager
- Sales Rep
- Project Coordinator
- Design Manager and/or Drafter

### Responsibilities by Role

| Role | Preparation | During Meeting | After Meeting |
|------|-------------|----------------|---------------|
| **Design** | Print plans for 10 people, draft NLEA & Scope of Work | Mark up large prints with redlines | Fix redlines in CAD |
| **PC** | Schedule meeting, create Color Selection Sheet | Take notes, track timeline to drawings date | Send plans + colors + schedule letter to customer |
| **Sales** | Review plans | Run meeting sheet-by-sheet, note cost impacts, note customer conversations needed | Contact customer for questions, verify redlines fixed |
| **Purchasing** | Verify long lead times, review Color Selection | Note material issues, vendor questions | Add long leads to ordering schedule, set up new vendors |
| **Production** | Collect redlines from all foremen | Relay foremen issues to design | Communicate redline decisions back to foremen |
| **GM** | Review plans | Final say on construction issues | Verify updated plans |

### Foremen Who Review Plans
1. HVAC Foreman
2. Electrical Foreman
3. Plumbing Foreman
4. Sidewalls/Roofs Foreman
5. Final Pad Foreman
6. Any other pertinent foreman

---

## Sales Folder Document Hierarchy

Documents in order of importance (for resolving conflicts):

| Priority | Document | Key Contents |
|----------|----------|--------------|
| 1 | Sales Release | Materials list, climate zone, loads, occupancy, WUI, address, sprinklers, set type |
| 2 | Building Order Sheet | Price, options, change orders, special materials, PO#, mod size |
| 3 | Redline Change Orders | Accepted changes (also shown on BOS) |
| 4 | Quote Exclusions | What's NOT included |
| 5 | Customer Correspondence | Discussions with customer |
| 6 | Specifications Q&A | Bid clarifications |
| 7 | Specifications Document | Government job specs |
| 8 | Statement of Work | Scope of work |
| 9 | Customer Supplied Drawings | Floor plans bid was based on |
| 10 | Cut Sheets | Product specifications |
| 11 | Sub & Material Conversations | Vendor discussions |
| 12 | Customer PO | May be stale after change orders |

**Key Insight:** Customer PO is lowest priority because it can diverge from Building Order Sheet after change orders (especially for non-PMSI dealers).

---

## Standard Project Folder Structure

```
Buildings/
├── 1.SALES/
├── 2.SCHEDULE/
├── 3.EMAIL ARCHIVE/
│   ├── 1.SALES/
│   └── 2.GENERAL/
├── 4.DRAFTING & ENG/
│   ├── 1.DRAWINGS PDF/
│   │   ├── 01 PRE CUSTOMER
│   │   ├── 02 ENGINEERING
│   │   ├── 03 PRODUCTION
│   │   └── 04 AS BUILTS
│   ├── 2.DRAWINGS DWG/
│   └── 3.ENG DOCS/
│       ├── 1.ENERGY CALCS
│       ├── 2.STRUCT CALCS
│       └── 3.NOTES & SKETCHES
├── 5.PROCUREMENT/
│   ├── 1.MATERIAL QUOTES/
│   ├── 2.CUT SHEETS/
│   └── 3.POs/
├── 6.ACCOUNTING/
│   ├── 1.PAYMENT TERMS/
│   ├── 2.INVOICES/
│   └── 3.MSO-LABELS/
├── 7.PROJECT MGMT/
│   ├── Customer/
│   │   ├── Customer Submittal/
│   │   ├── Customer Re-Submittal/
│   │   └── Customer Approval/
│   │       ├── Color Selection/
│   │       ├── Cut Sheet Manual/
│   │       ├── Drawing/
│   │       ├── Long Lead Authorization/
│   │       ├── O&M Manuals/
│   │       └── RFIs/ (Submitted/Response)
│   ├── State/
│   │   ├── State Submittal/
│   │   ├── State Resubmittal/
│   │   └── State Approval/
│   ├── RFIs/
│   ├── Cut Sheet Manual/
│   ├── Long Lead Authorization/
│   └── O&M Manuals/
└── 8.QC/
    ├── 1.PRODUCTION PHOTOS/
    ├── 2.QC TRAVELER/
    ├── 3.SHIP LOOSE/
    │   ├── 1. SHIP LOOSE LIST/
    │   └── 2. SHIP LOOSE PHOTOS/
    ├── 4.LABELS/
    ├── 5.SHIPPING FORMS/
    ├── 6.DRIVER PICK-UP/
    └── 7.WARRANTY/
        ├── 1.EQUIPMENT WARRANTY CARDS/
        ├── 2.O&M MANUALS/
        └── 3.PHOTOS/
```

### Quotes Folder Structure (Separate)
```
Quotes/
├── 1.SALES RELEASE & ORDER SHEET/
├── 2.FLOORPLAN/
├── 3.BOM/
├── 4.BID SPECS/
├── 5.SUB & MATL BIDS/
├── 6.DEALER PO/
├── 7.CHANGE ORDERS/
├── 8.CORRESPONDANCE/
└── 9.INTERNAL CALCULATIONS/
```

---

## Expanded Workflow: Complete Project Lifecycle

### Phase 1: Quoting (Sales Project Log)
1. Receive bid request → Add to Sales Project Log
2. Create quote folder using Quotes template
3. Create/duplicate quote in Praxis
4. Fill out building specs
5. Add materials via Quote Details
6. Manager review (>$800K needs VP, >$1M needs exec)
7. Send quote to dealer

### Phase 2: PO Receipt & Conversion (Pipeline Report)
1. Receive PO from dealer
2. Verify PO price matches Praxis quote
3. Save PO to quote folder
4. **Check with team before converting** (serial number coordination)
5. Change Quote Status to "Sold"
6. Generate Serial Number(s)
7. Fill out Building Order Sheet & Sales Release
8. Move from Pipeline (95%) to Pipeline (100%)

### Phase 3: Handoff to PC
1. Fill out Color Selection Form
2. Fill out Long Lead Form
3. Fill out Sales to PC Handoff Document
4. Email handoff package to: PC, GM, Design Manager, Production Manager, Purchasing Manager, AR
5. Create Building folder using Buildings template

### Phase 4: Pre-Customer Meeting (NEW - 2 days after prints distributed)
1. Design prints and distributes plans to all foremen
2. Foremen review and provide redlines
3. PC schedules meeting, creates Color Selection Sheet
4. Meeting: Sales runs, all parties contribute redlines
5. Design fixes redlines in CAD
6. GM, Sales, Design verify updated plans
7. PC sends to customer: plans + color selection + schedule letter

### Phase 5: Customer Approval Cycle
1. Customer reviews plans
2. Handle customer redlines/questions via Sales
3. Re-submittal if needed
4. Customer approval received
5. Long lead authorization signed

### Phase 6: State Approval Cycle
1. Submit to state for approval
2. Handle state comments
3. Re-submittal if needed
4. State approval received

### Phase 7: Production
1. Production drawings released
2. Procurement orders materials
3. Production builds modules
4. QC inspections
5. Production photos

### Phase 8: Shipping & Closeout
1. Ship loose items prepared
2. Shipping forms completed
3. Driver pick-up scheduled
4. Warranty documentation compiled
5. O&M manuals delivered

---

## Key Dealers Identified

| Code | Full Name | Notes |
|------|-----------|-------|
| PMSI | Pacific Mobile Structures Inc | PO often matches BOS |
| MMG | Mobile Modular Group | PO may diverge after change orders |
| US MOD | US Modular | |
| United Rentals | United Rentals | Stock buildings |

---

## Building Types

| Type | Description |
|------|-------------|
| CUSTOM | Custom-designed building |
| FLEET/STOCK | Standard inventory building |
| GOVERNMENT | Government contract building (has bid specs) |
| Business | Commercial building |

---

## Revised Schema Additions

Based on new findings, additional fields needed:

```sql
-- Pipeline/Forecasting Fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS outlook_percentage INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS waiting_on TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_close_timeframe VARCHAR(50);

-- Quote Tracking Fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS folder_number VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qa_due_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quote_due_date DATE;

-- Pre-Customer Meeting Tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pre_customer_meeting_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pre_customer_meeting_notes TEXT;

-- Approval Tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_submittal_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_approval_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS state_submittal_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS state_approval_date DATE;
```

---

## Next Steps

1. [x] Read all SOP documents
2. [x] Map Praxis fields to Sunbelt PM schema
3. [x] Document complete workflow
4. [x] Review Forms & Info folder
5. [x] Review When a Building is Sold folder
6. [x] Document folder structure template
7. [ ] Review with Matthew for accuracy
8. [ ] Decide on import mechanism
9. [ ] Design UI for import workflow
10. [ ] Implement schema changes
11. [ ] Build import functionality
12. [ ] Test with real Praxis exports
