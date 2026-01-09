# Sunbelt PM - Post-Sales Workflow Specification
## Document Version: 1.0 (Draft)
## Created: January 9, 2026
## Status: 🔴 PLANNING - Major Update Required

---

## 📁 PROJECT FOLDER STRUCTURE (Sunbelt Standard)

Based on **Project Folder Structure 2.0 Field Reference Guide (June 2025)**

This is the standardized folder structure across ALL Sunbelt plants.

### Primary Folders (8 Main Categories):

| # | Folder | Purpose | Primary Users |
|---|--------|---------|---------------|
| 1 | **Sales** | Customer elements: estimates, floor plans, specs, POs, change orders | Sales, Estimators |
| 2 | **Schedule** | Schedule Letter only (Original → Final Signed) | GMs, PCs |
| 3 | **Correspondence** | Archive of project communications (internal & external) | Sales, GMs, PCs |
| 4 | **Drafting & Engineering** | Drawings, Calculations, State Seal Packages | Drafting Dept |
| 5 | **Procurement** | Purchase orders and quotes specific to project | Procurement |
| 6 | **Accounting** | Project invoicing and MSOs | Accounting Dept |
| 7 | **Project Coordination & Management** | POST-SALES: Color selections, long lead, RFIs, submittals | PM, PC |
| 8 | **Quality Control** | Reports, photos, ship loose, warranty | QC, Service Manager |

---

### Detailed Subfolder Structure:

#### 1. Sales
```
Sales/
├── Project Release Folder/
│   └── Estimate (Bill of Materials)
├── Preliminary Floor Plan/
├── Unit Price Sheet/
├── Specifications/
├── Bid Quotes/
└── PO & Change Orders/
    ├── Purchase Orders/
    │   └── Final-Signed/
    └── Change Orders/
```

#### 2. Schedule
```
Schedule/
├── Original/           ← Original Schedule Letter
├── Iterations/         ← All versions between original and final
└── Final-Signed/       ← Signed Schedule Letter from customer
```

#### 3. Correspondence
```
Correspondence/
├── Sales Emails/       ← Between Sales and Customer
└── Emails/             ← Internal + External project emails
```

#### 4. Drafting & Engineering
```
Drafting & Engineering/
├── Drawings PDF/
│   ├── Customer Submitted Drawings/
│   ├── Final Production Drawings/
│   └── Subcontractor & Vendor Drawings/
├── ACAD/
├── Calculations/
│   ├── Energy Calcs/
│   ├── Structural Calcs/
│   └── Spreadsheet Backup/
├── State Approvals/
├── Preliminary/
├── Production Details/
└── Archive/
```

#### 5. Procurement
```
Procurement/
├── Quotes/             ← Material/sub quotes AFTER release
├── Cut Sheets/         ← Product specs for materials
├── Purchase Orders/    ← Project-specific POs
└── Drawings for Vendors/
```

#### 6. Accounting
```
Accounting/
├── Payment Terms/      ← Only for special payment terms
├── Invoicing/          ← All project invoices
└── MSO-Labels/         ← MSOs and State Tags
```

#### 7. Project Coordination & Management ⭐ (PM/PC Primary)
```
Project Coordination & Management/
├── Long Lead Authorizations/
│   └── Final-Sent/     ← Approved Long Lead forms
├── Color Selections/
│   └── Final-Sent/     ← Approved Color Selection forms
├── Client Submittals & Approvals/
├── Vendor-Sub Coordination/
└── RFIs/               ← RFIs sent to Dealer
```

#### 8. Quality Control
```
Quality Control/
├── Production Photos/
├── QC Traveler/
├── Factory Inspections/
├── Ship Loose/
│   ├── Ship Loose List/
│   └── Ship Loose Photos/
├── Labels-Tags/        ← State Seal Decals, Certification labels
├── Transport-Delivery/
├── Delivery Tickets/
└── Warranty Photos/
```

---

### File Storage Quick Reference:

| Document Type | Storage Path | Who Saves |
|---------------|--------------|-----------|
| **Dealer Quote** | Sales → Project Release Folder → Estimate | Sales, Estimators |
| **Signed PO** | Sales → PO & Change Orders → Purchase Orders → Final-Signed | Sales, Estimators |
| **Change Orders** | Sales → PO & Change Orders → Change Orders | Sales |
| **Schedule Letter (Original)** | Schedule → Original | GM |
| **Schedule Letter (Signed)** | Schedule → Final-Signed | GM, PC |
| **Long Lead Form (Approved)** | Project Coord & Mgmt → Long Lead Authorizations → Final-Sent | PC |
| **Color Selection (Approved)** | Project Coord & Mgmt → Color Selections → Final-Sent | PC |
| **Submittals (Approved)** | Project Coord & Mgmt → Client Submittals & Approvals | PM, PC |
| **RFIs** | Project Coord & Mgmt → RFIs | PM |
| **Cut Sheets** | Procurement → Cut Sheets | Procurement, Sales |
| **Final Drawings** | Drafting & Engineering → Drawings PDF → Final Drawings | Drafting |
| **Production Photos** | Quality Control → Production Photos | QC |
| **Warranty Photos** | Quality Control → Warranty Photos | QC |

---

### Workflow Document Mapping:

| Our Workflow Form | Folder Location |
|-------------------|-----------------|
| **Schedule Letter** | Schedule → (Original / Iterations / Final-Signed) |
| **Long Lead Items Form** | Project Coord & Mgmt → Long Lead Authorizations → Final-Sent |
| **Color Selection Form** | Project Coord & Mgmt → Color Selections → Final-Sent |
| **Signed Drawings** | Drafting & Engineering → Drawings PDF → Final Drawings |
| **Purchase Order** | Sales → PO & Change Orders → Purchase Orders → Final-Signed |
| **Change Orders** | Sales → PO & Change Orders → Change Orders |
| **Dealer Quote** | Sales → Project Release Folder → Estimate |
| **RFIs** | Project Coord & Mgmt → RFIs |
| **Submittals** | Project Coord & Mgmt → Client Submittals & Approvals |
| **Cut Sheets (HVAC, Panels)** | Procurement → Cut Sheets |

---

This document captures the **post-sales release workflow** for modular building projects. The workflow begins after the Sales Manager releases a project and the PM takes over.

---

## 📝 DEALER SIGN-OFF FORMS SUMMARY

| Form | Purpose | Who Fills | Who Signs | Special Logic |
|------|---------|-----------|-----------|---------------|
| **Long Lead Items** | Approve equipment with long procurement times | PM (PC can assist) | Dealer | Attach cutsheets for HVAC, Panels |
| **Color Selection** | Choose colors/finishes for materials | PM marks items, Dealer selects colors | Dealer | ⚠️ Non-stock → auto-create task |
| **Signed Off Drawings** | Approve full drawing set | Factory provides | Dealer | Email ack or signed drawings |
| **Purchase Order (PO)** | Approve project pricing/scope | Sales Manager | Dealer | Required before Sales Release |
| **Change Order (CO)** | Approve changes after signed drawings | Sales Manager generates | Dealer | Required before any post-signoff changes |

### Key Relationships:
```
Sales Release requires → Signed PO from Dealer
                      
Signed Off Drawings → LOCKED
  │
  └─► Any changes require → Change Order (CO)
                              │
                              └─► Sales Manager generates
                              └─► Dealer must sign
                              └─► PM tracks status
                              └─► Then changes can be made

Final Price Approval = PO signed + ALL Change Orders signed
```

### Who Owns What:
| Item | Owner | Tracker |
|------|-------|---------|
| PO | Sales Manager | PM |
| Change Orders | Sales Manager | PM |
| Long Lead Form | PM | PM/PC |
| Color Selection | PM | PM/PC |
| Signed Drawings | Factory/PM | PM |

### Common Workflow (All Forms):
1. PM prepares form (in-app or factory doc)
2. PM attaches relevant cutsheets
3. PM sends to Dealer
4. Dealer reviews, fills in selections, signs
5. Dealer returns signed form
6. PM uploads signed PDF to system
7. System marks milestone complete

### Form Options (All Forms):
- **Option A:** Build in Sunbelt PM → Generate PDF → Send
- **Option B:** Upload factory form → Track status only

---

## 📄 Source Document: Factory Schedule Letter

Based on actual **Phoenix Modular (PMI) Schedule Letter** dated 11/7/2025:

### Header Information Tracked:
| Field | Example Value | Notes |
|-------|---------------|-------|
| Factory | Phoenix Modular | Logo/letterhead |
| Dealer | MOBILE MODULAR MANAGEMENT | Customer company |
| Dealer Rep | JOEY MADERE | Customer contact |
| Date | 11/7/2025 | Schedule letter date |
| Serial # | PMI-6798 | Factory serial number |
| Quote # | PM-1072-2025 | Quote reference |
| Size | 1 - 52x140 | Module count and dimensions |

---

## 🎯 Schedule Milestones (From Schedule Letter)

These are the **7 main milestones** tracked on the factory schedule letter:

| # | Milestone | Owner | Type | Due Date | Notes |
|---|-----------|-------|------|----------|-------|
| 1 | Receipt of Purchase Order | Internal | 🔵 INTERNAL | 11/04/2025 | PO received from dealer |
| 2 | Drawings Submitted to Customer | Factory/PM | 🔵 INTERNAL | 12/05/2025 | "full drawings out" |
| 3 | "Long Lead" Material Signed Off by Customer | **DEALER** | 🟠 DEALER | 12/12/2025 | HVAC, Panels, etc. |
| 4 | Customer 'Signed Off' Drawings | **DEALER** | 🟠 DEALER | 12/12/2025 | Full drawing set approval |
| 5 | Final Price Approval From Customer | **DEALER** | 🟠 DEALER | 12/16/2025 | PO + all COs signed |
| 6 | State Approvals From State Agencies | External | 🟢 EXTERNAL | Varies | Can be "NA" |
| 7 | Project Complete and Ready for Transport | Factory | 🔵 INTERNAL | 03/30/2026 | Can be date range |

### Milestone Types:
- 🔵 **INTERNAL** - Sunbelt/Factory responsibility
- 🟠 **DEALER** - Requires dealer sign-off (WARNING EMAILS)
- 🟢 **EXTERNAL** - Third party (state agencies)

---

## 📄 CHANGE ORDER (CO) WORKFLOW

### What It Is:
Any changes to the project AFTER drawings have been signed off require a formal Change Order.

### Why It Exists:
- Signed drawings = locked scope
- Changes affect price, schedule, materials
- Must have dealer approval before making changes
- Creates audit trail

### Workflow:
```
1. Change requested (by dealer, PM, or factory issue)
         │
         ▼
2. Sales Manager generates Change Order
   - Describes change
   - Shows price impact (+/-)
   - Shows schedule impact (if any)
         │
         ▼
3. CO sent to Dealer for signature
         │
         ▼
4. Dealer signs and returns CO
         │
         ▼
5. PM uploads signed CO to system
         │
         ▼
6. Changes can now be implemented
         │
         ▼
7. Final Price Approval = PO + ALL signed COs
```

### Responsibility:
| Role | Responsibility |
|------|----------------|
| **Sales Manager** | Generates CO, sends to dealer |
| **PM** | Tracks CO status, uploads signed docs |
| **Dealer** | Reviews and signs |

### What We Track:
| Field | Description |
|-------|-------------|
| CO Number | Sequential per project (CO-001, CO-002) |
| Description | What's changing |
| Price Impact | +$X or -$X |
| Schedule Impact | Days added/removed |
| Status | Draft → Sent → Signed → Implemented |
| Requested By | Dealer / PM / Factory |
| Created Date | When CO was generated |
| Sent Date | When sent to dealer |
| Signed Date | When dealer signed |
| Signed By | Dealer contact name |
| Signed Document | ✅ Stored PDF |

### Database Table:
```sql
CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- CO Info
  co_number INTEGER NOT NULL,       -- Sequential: 1, 2, 3... (CO #9 in example)
  co_type VARCHAR DEFAULT 'General', -- 'Redlines' (drawing changes), 'General', 'Pricing'
  date DATE NOT NULL,
  
  -- Parties
  to_name VARCHAR,                  -- Dealer contact (Bill Ackerman)
  from_name VARCHAR,                -- Sales person (Mitch Quintana)
  
  -- Reference
  po_number VARCHAR,                -- R339004567
  
  -- Status
  status VARCHAR DEFAULT 'Draft',   -- 'Draft', 'Sent', 'Signed', 'Implemented', 'Rejected'
  
  -- Dates
  sent_date DATE,
  signed_date DATE,
  implemented_date DATE,
  
  -- Sign-Off
  signed_by VARCHAR,
  signature_date DATE,              -- Date dealer wrote on form
  document_url TEXT,                -- Signed CO PDF
  document_name VARCHAR,
  
  -- Totals (calculated from line items)
  total_amount NUMERIC DEFAULT 0,   -- Can be $0.00
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, co_number)     -- CO numbers unique per project
);

CREATE TABLE change_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_order_id UUID REFERENCES change_orders(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,        -- The change description
  price NUMERIC DEFAULT 0,          -- Can be positive, negative, or zero
  sort_order INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_co_project ON change_orders(project_id);
CREATE INDEX idx_co_status ON change_orders(status);
CREATE INDEX idx_co_items ON change_order_items(change_order_id);
```

### CO Types:
| Type | Description |
|------|-------------|
| **Redlines** | Changes to blueprints/drawings |
| **General** | Other changes (equipment, materials) |
| **Pricing** | Price adjustments only |

---

## 📄 PURCHASE ORDER (PO) - Reference

### What It Is:
The dealer's official order document that authorizes the project to proceed. Required before Sales Release.

### Key Points:
- **Dealer-specific format** - Each dealer has their own PO layout
- **Not generated by Sunbelt** - Comes FROM the dealer
- **PM just tracks** - Sales manages, PM references
- **Triggers project start** - Receipt of signed PO = Milestone #1

### Example Fields (Mobile Modular PO):
| Field | Example |
|-------|---------|
| PO Number | R339004567 |
| PO Date | 08/08/2025 |
| Account Number | 612954 |
| To (Factory) | Northwest Building Systems |
| Ship To | Site address |
| Bill To | Dealer billing address |
| Line Items | SKU, Description, Qty, Price |
| Quote Reference | NW-0179-2025 v-02 |
| Serial/Project # | SN 25250 |
| Special Notes | State codes, offline date, requirements |
| Approval Signature | Dealer signs |

### What We Track:
| Field | Description |
|-------|-------------|
| PO Number | Dealer's PO reference |
| PO Date | When issued |
| PO Amount | Total value |
| Received Date | When factory received |
| Document | ✅ Stored PDF |
| Status | Received / Pending |

### Storage Location:
`Sales → PO & Change Orders → Purchase Orders → Final-Signed`

---

## 📄 COLOR SELECTION FORM - Detailed Specification

### What It Is:
A form listing all materials/finishes that require color selection by the dealer. Material types are determined during the quote phase; this form captures the specific color/finish choices.

### Sample: PMI-6787 (Phoenix Modular)

### Form Categories:
| Left Column | Right Column |
|-------------|--------------|
| Floor Covering | Cove Base |
| Interior Wall Finish | Interior Trim |
| Interior Doors | Exterior Doors |
| Exterior Wall Finish (Metal PBR) | Roofing |
| Cabinets | Miscellaneous |

### Example Items (varies by project):
- Vinyl Tackboard
- French Doors
- Body Color, Trim Color, Hood Color (Exterior)
- Laminate Color, Counter Tops
- Exterior Door Color + Jamb Color
- Mini Blinds
- Paint Colors
- Shingle/Roofing Color

### Workflow:
1. **Sales phase:** Material selections determined during quote
2. **After PO signed:** Dealer knows what materials they're getting
3. **PM/PC fills form:** Marks which items need color selection (X's)
4. **PM sends cutsheets:** For items requiring color choices
5. **Dealer selects colors:** Based on cutsheets provided
6. **Dealer signs form:** Returns completed & signed
7. **PM reviews:** Checks for non-stock selections

### Responsibility:
| Role | Responsibility |
|------|----------------|
| **Sales Manager** | Determines materials during quote phase |
| **PM** | Partially fills form, sends to dealer with cutsheets |
| **PC** | Can assist PM with form prep |
| **Dealer** | Selects colors, signs, returns |

### ⚠️ Non-Stock Color Warning:
- "NON STOCK COLORS ARE 6-8 WKS" per factory note
- **If dealer selects non-stock:**
  - System creates FLAG/TASK automatically
  - PM must verify lead times with factory
  - May affect online date
  - Task: "Verify lead time for non-stock color selection"

### What We Track in System:
| Field | Description |
|-------|-------------|
| Form sent date | When PM sent to dealer |
| Form due date | From Schedule Letter |
| Form signed date | When dealer returned signed |
| Signed by | Dealer contact name |
| Signed document | ✅ Stored PDF in system |
| Status | Draft → Sent → Signed / Overdue |
| Has non-stock selections | Boolean flag |
| Non-stock verified | PM confirmed lead times |

### Form Creation Options:
**Option A: Create in Sunbelt PM (In-App Form Builder)**
- PM marks which categories need selection
- Attach cutsheets per category
- Dealer fills in color choices (or PM enters after receiving)
- Signature capture
- Auto-flag non-stock selections

**Option B: Use Factory Document**
- Upload factory-specific form
- Track status only
- Manually flag non-stock items

---

## 📄 IN-APP COLOR SELECTION FORM BUILDER

### Category/Item Structure:
```
Category: Floor Covering
  ├─ Item: VCT (1/8")
  │    └─ Options: Standard, Roll Goods, Carpet, Other
  │    └─ Color Selected: ____________
  │    └─ Cut Sheet: [attached PDF]
  │    └─ Is Non-Stock: [ ] checkbox
  │
  ├─ Item: Cove Base
       └─ Options: Prefinished, Painted, Vinyl, Stained, Self Cove
       └─ Color Selected: ____________
```

### Form Fields Per Item:
| Field | Type | Notes |
|-------|------|-------|
| Category | Dropdown | Floor, Walls, Doors, etc. |
| Item Type | Text/Dropdown | VCT, Carpet, Paint, etc. |
| Options Available | Multi-select | From cutsheet |
| Selected Option | Text | Dealer's choice |
| Color/Finish | Text | Specific color name/code |
| Cut Sheet | File | PDF attachment |
| Is Non-Stock | Checkbox | ⚠️ Triggers task if checked |
| Notes | Text | Special instructions |

### Auto-Generated Tasks (When Non-Stock Selected):
```
Task: "Verify lead time - Non-stock [Item Name]"
Assigned to: PM
Priority: High
Due: 2 days from selection
Description: "Dealer selected non-stock [color] for [item]. 
             Verify lead time with factory and confirm 
             impact on online date."
```

---

## 📐 DRAWING WORKFLOW - Complete Specification

### Overview
The drawing workflow is a critical path item. Delays in getting signed-off drawings cascade into engineering, third party, and state approval delays - which can cause missed line time.

**Key Principle:** Dealer sees the drawing review loop. Dealer does NOT see internal processes (Engineering, Third Party, State).

---

### Phase 1: Drawing Review Loop (Dealer-Facing)

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
Drafting creates/updates drawings                             │
        │                                                     │
        ▼                                                     │
PM sends to Dealer (CC: Sales)                                │
        │                                                     │
        ▼                                                     │
Dealer Reviews                                                │
        │                                                     │
        ├── APPROVE ──────────────────► Done (move to Phase 2)
        │
        ├── APPROVE WITH REDLINES ────► Make minor changes, 
        │                               consider approved,
        │                               move to Phase 2
        │
        ├── REJECT WITH REDLINES ─────► Make changes, send back
        │                               for re-review ─────────┘
        │
        └── REJECT ───────────────────► Major issues, discuss
                                        with dealer, restart ──┘
```

### Drawing Milestones (Percentages):
| % | Milestone | Description |
|---|-----------|-------------|
| **20%** | Initial Floor Plan | Basic layout sent for early feedback |
| **65%** | Design Development | Major systems included, detailed review |
| **95%** | Construction Documents | Near-final, minor tweaks only |
| **100%** | Signed-Off Drawings | **LOCKED** - Changes require Change Order |

### Version Control - What We Track Per Version:
| Field | Description |
|-------|-------------|
| Version Number | v1, v2, v3... (auto-increment) |
| Drawing Percentage | 20%, 65%, 95%, 100% |
| Date Sent to Dealer | When PM sent drawings |
| Sent By | PM name (always CC Sales) |
| Dealer Response | Approve / Approve with Redlines / Reject with Redlines / Reject |
| Response Date | When dealer responded |
| Redline Document | Attached PDF if applicable |
| Notes | Any comments |

### Dealer Response Statuses:
| Status | Meaning | Next Action |
|--------|---------|-------------|
| **Approve** | No changes needed | Move to next phase/percentage |
| **Approve with Redlines** | Minor changes, but approved | Make changes, consider approved |
| **Reject with Redlines** | Changes required before approval | Make changes, resend for review |
| **Reject** | Major issues, not acceptable | Discuss with dealer, may need redesign |

---

### Phase 2: Internal Process (NOT Dealer-Facing)

Once 100% drawings are signed off by dealer, the internal process begins. **Dealer does not see or track this.**

```
100% Signed-Off Drawings
        │
        ▼
┌───────────────────┐
│   ENGINEERING     │  ◄── Sunbelt internal team (usually)
│   REVIEW          │      Can be specialty third party
│   (few weeks)     │
└────────┬──────────┘
         │
         ├── Issues found? ──► Discuss internally
         │                     If dealer approval needed → PM contacts dealer
         │                     If cost involved → Sales drafts CO
         │
         ▼
┌───────────────────┐
│   THIRD PARTY     │  ◄── Local firm (varies by factory)
│   STAMP           │      Don't track company name
│   (few weeks)     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   STATE           │  ◄── State agency for modular buildings
│   APPROVAL        │      Can request multiple states
│   (weeks-months)  │      Issues seals/tags for building
└────────┬──────────┘
         │
         ▼
    Ready for Production
    (Seals/tags must be on building before shipping)
```

### Engineering Review:
| Field | Description |
|-------|-------------|
| Sent to Engineering | Date |
| Engineering Complete | Date |
| Engineering Notes | Any issues found |
| Dealer Approval Needed | Boolean - did engineering find issues requiring dealer sign-off? |
| CO Triggered | Boolean - did issues result in Change Order? |

### Third Party Review:
| Field | Description |
|-------|-------------|
| Sent to Third Party | Date |
| Third Party ETA | Expected return date (if provided) |
| Third Party Complete | Date stamped drawings returned |
| Notes | Any issues |

### State Approval:
| Field | Description |
|-------|-------------|
| States Required | Array - can be multiple (dealer may want building moveable) |
| Sent to State | Date (per state) |
| State ETA | Expected approval date (if provided, not always given) |
| State Complete | Date approved (per state) |
| Insignia/Seal Numbers | Numbers received from state |
| Notes | Any issues |

### Multi-State Approval Notes:
- **IIBC Compact States:** Minnesota, New Jersey, Rhode Island, North Dakota (+ Wisconsin via MN agreement)
  - One IIBC seal = accepted in all member states
- **California (HCD):** Requires state-specific insignia, 4-6 week review typical
- **Other states:** 39 states have specific modular programs; others work with local authorities
- Dealer may request multiple state approvals if they plan to relocate the building

---

### Procurement Relationship

**Key Insight:** Procurement is triggered by **cutsheet submittal sign-off**, NOT drawing percentages.

```
Cutsheet Submittals approved by Dealer
        │
        ▼
Procurement can begin ordering
        │
        ├── Long Lead Items: Order EARLY (HVAC, Panels, etc.)
        │   └── Must arrive before online date
        │
        └── Standard Items: Order closer to online date
            └── Factories don't have storage space
```

**Note:** Drawing changes CAN affect cutsheets, but dealer must approve the cutsheet regardless.

---

### Database Tables for Drawing Workflow:

```sql
-- Drawing versions (the review loop)
CREATE TABLE drawing_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Version Info
  version_number INTEGER NOT NULL,        -- Auto-increment per project
  drawing_percentage INTEGER,             -- 20, 65, 95, 100
  
  -- Sent Info
  sent_date DATE,
  sent_by UUID REFERENCES users(id),      -- PM who sent
  
  -- Dealer Response
  dealer_response VARCHAR,                -- 'Approve', 'Approve with Redlines', 'Reject with Redlines', 'Reject'
  response_date DATE,
  redline_document_url TEXT,              -- Attached redline PDF
  redline_document_name VARCHAR,
  
  -- Status
  status VARCHAR DEFAULT 'Sent',          -- 'Draft', 'Sent', 'Awaiting Response', 'Complete'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, version_number)
);

CREATE INDEX idx_drawing_versions_project ON drawing_versions(project_id);

-- Engineering review tracking
CREATE TABLE engineering_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Dates
  sent_date DATE,
  eta_date DATE,
  complete_date DATE,
  
  -- Issues
  issues_found BOOLEAN DEFAULT false,
  dealer_approval_needed BOOLEAN DEFAULT false,
  co_triggered BOOLEAN DEFAULT false,
  change_order_id UUID REFERENCES change_orders(id),
  
  -- Metadata
  notes TEXT,
  reviewed_by VARCHAR,                    -- Internal or third party company
  is_internal BOOLEAN DEFAULT true,       -- Sunbelt team vs specialty third party
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Third party stamp tracking
CREATE TABLE third_party_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Dates
  sent_date DATE,
  eta_date DATE,                          -- Not always provided
  complete_date DATE,
  
  -- Status
  status VARCHAR DEFAULT 'Pending',       -- 'Pending', 'In Review', 'Complete'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- State approvals (can have multiple per project)
CREATE TABLE state_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- State Info
  state_code VARCHAR(2) NOT NULL,         -- 'CA', 'TX', 'MN', etc.
  state_name VARCHAR,                     -- 'California', 'Texas', etc.
  
  -- Dates
  sent_date DATE,
  eta_date DATE,                          -- Not always provided
  complete_date DATE,
  
  -- Results
  insignia_numbers TEXT,                  -- Seal/tag numbers received
  
  -- Status
  status VARCHAR DEFAULT 'Pending',       -- 'Pending', 'Submitted', 'Approved', 'Rejected'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_state_approvals_project ON state_approvals(project_id);
CREATE INDEX idx_state_approvals_state ON state_approvals(state_code);
```

---

Tracked separately - shows engineering/drawing progress:

*See "DRAWING WORKFLOW - Complete Specification" section above for full details.*

Drawing percentages: **20% → 65% → 95% → 100%**

---

## 📄 LONG LEAD FORM - Detailed Specification

### What It Is:
A form sent to the dealer listing equipment/materials that have long procurement times and need early approval to meet the production schedule.

### Form Contents (Per Line Item):
| Field | Description | Example |
|-------|-------------|---------|
| Device Name | What the item is | "HVAC Unit" |
| Model Number | Specific model | "Carrier 24ACC636A003" |
| Quantity | How many needed | 2 |
| Cut Sheet | Spec document attached | PDF attachment |

### Cut Sheets:
- **Always included for:** HVAC, Panels
- **Sometimes included for:** Other items if available
- **Format:** PDF attachment to the form

### Typical Long Lead Items:
- ✅ HVAC (always)
- ✅ Panels (always)
- Others vary by project/building type

### Workflow:
1. **PM fills out form** (or PC can assist)
2. **PM attaches cut sheets** for HVAC, panels, etc.
3. **Form sent to Dealer** for review
4. **Dealer signs entire form** (not line-by-line approval)
5. **Signed form returned** to PM
6. **PM tracks completion** in system

### Responsibility:
| Role | Responsibility |
|------|----------------|
| **PM** | Primary - fills out form, sends to dealer |
| **PC** | Secondary - can fill out, tracks progress |
| **Dealer** | Signs and returns |

### Deadline Impact:
⚠️ **If dealer misses sign-off deadline:**
- Online date at risk
- Factory line time scheduled **months in advance**
- Late sign-offs cascade into production delays
- May affect delivery date

### What We Track in System:
| Field | Description |
|-------|-------------|
| Form sent date | When PM sent to dealer |
| Form due date | From Schedule Letter |
| Form signed date | When dealer returned signed |
| Signed by | Dealer contact name |
| Signed document | ✅ **Stored PDF in system** |
| Status | Draft → Sent → Signed / Overdue |

### Form Creation Options:
User can choose:

**Option A: Create in Sunbelt PM (In-App Form Builder)**
- PM enters line items directly in system
- System generates professional PDF
- Attach cut sheets to each line item
- Send directly from system
- Track everything in one place

**Option B: Use Factory Document**
- Upload factory-specific form template
- Fill out externally
- Upload completed form to system
- Attach cut sheets separately
- System tracks status only

### Form Variations:
- Forms differ slightly by factory
- Core fields are consistent
- Same approval workflow regardless of factory

---

## 📄 IN-APP LONG LEAD FORM BUILDER

### Line Item Fields:
| Field | Type | Required |
|-------|------|----------|
| Device/Item Name | Text | Yes |
| Model Number | Text | Yes |
| Manufacturer | Text | No |
| Quantity | Number | Yes |
| Cut Sheet | File Upload | No (but recommended for HVAC/Panels) |
| Notes | Text | No |

### Form Actions:
- Add Line Item
- Remove Line Item
- Reorder Items
- Attach Cut Sheet (per item)
- Preview PDF
- Send to Dealer (generates email)
- Download PDF (for manual sending)

### Generated PDF Should Include:
- Company letterhead (Sunbelt or Factory logo)
- Project info (number, name, dealer, etc.)
- Table of line items
- Signature line for dealer
- Due date prominently displayed
- Return instructions

---

## 🔔 Warning Email System - DETAILED

### Timing:
- **2 days before deadline** - Warning email sent

### Recipients:
| Recipient | Role | Notes |
|-----------|------|-------|
| **TO:** Dealer | Customer contact | Primary recipient |
| **CC:** Secondary PM | Backup PM on project | Always CC'd |
| **CC:** Director | Oversight | Always CC'd |
| **CC:** Project Coordinator | PC tracking the project | If assigned |
| **CC:** Plant Manager | Factory contact | Relevant to project's factory |
| **CC:** Sales Manager | Original salesperson | Relevant to project |

### Email Content Should Include:
- Project number and name
- Milestone name (e.g., "Long Lead Items Sign-Off")
- Due date
- Days until due (or days overdue)
- Dealer contact info
- What action is needed
- Link to project in system (for internal recipients)

### Trigger Options:
- [ ] Auto-send 2 days before? OR
- [ ] PM clicks "Send Warning" button?
- [ ] Both? (Auto-draft, PM approves/sends)

---

## 🚇 VISUAL WORKFLOW TRACKER - "Control Center"

### Overview
A visual pipeline diagram showing project progress through all phases. Inspired by subway/train control center aesthetics - nodes connected by animated flowing lines, showing real-time status of where the project stands.

**Key Features:**
- Top-to-bottom (portrait) OR left-to-right (landscape) orientation toggle
- Animated flowing lines (slow, subtle pulse)
- Color-coded status indicators on nodes
- Hover for quick details, click for full modal
- Integrates with Tasks system

---

### Visual Style

**Theme:** Matches system/user dark/light mode setting

**Nodes:**
- Circular nodes (not rectangles)
- Small indicator dot shows status color
- Node label below/beside

**Lines:**
- Animated flowing lines connecting nodes
- Slow, subtle pulse animation
- Solid when path is active
- Frozen animation when project on hold

**Status Colors:**
| Color | Status | Condition |
|-------|--------|-----------|
| ⚪ Gray | Not Started | No work begun |
| 🟡 Yellow | In Progress | Work happening, deadline > 2 days away |
| 🟠 Orange | Nearing Deadline | 2 days or less until deadline |
| 🔴 Red | At/Past Deadline | Due today or overdue |
| 🟢 Green | Complete | All linked tasks done |
| ~~⚪~~ Crossed | N/A / Skipped | Station not applicable to this project |

**Note:** No flashing red in this view - just solid red for overdue.

---

### Flow Diagram

```
═══════════════════════════════════════════════════════════════════════════════
PHASE 1: INITIATION
═══════════════════════════════════════════════════════════════════════════════
                                    
                              ◉ PO RECEIVED
                                    │
═══════════════════════════════════════════════════════════════════════════════
PHASE 2: DEALER SIGN-OFFS
═══════════════════════════════════════════════════════════════════════════════
                                    │
     ┌──────────────┬───────────────┼───────────────┬──────────────┐
     │              │               │               │              │
     ▼              ▼               ▼               ▼              ▼
◉ DRAWINGS    ◉ LONG LEAD      ◉ CUTSHEETS     ◉ COLORS      [FUTURE]
     │              │               │               │
  ◉ 20%        ◉ Submitted     ◉ Submitted     ◉ Submitted
     │              │               │               │
  ◉ 65%        ◉ Signed Off    ◉ Signed Off    ◉ Signed Off
     │              │               │               │
  ◉ 95%             └───────┬───────┘               │
     │                      │                       │
  ◉ 100%              ◉ PROCUREMENT                 │
     │                      │                       │
     └──────────────────────┴───────────────────────┘
                            │
═══════════════════════════════════════════════════════════════════════════════
PHASE 3: INTERNAL APPROVALS
═══════════════════════════════════════════════════════════════════════════════
                            │
                    ◉ ENGINEERING
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
          ▼                                   ▼
    ◉ THIRD PARTY                      ◉ PRODUCTION
          │                                   │
    ◉ STATE(S)                               │
     (1 per state)                            │
          │                                   │
          └─────────────────┬─────────────────┘
                            │
                      (merge point)
                            │
═══════════════════════════════════════════════════════════════════════════════
PHASE 4: DELIVERY
═══════════════════════════════════════════════════════════════════════════════
                            │
                      ◉ TRANSPORT
                            │
                         ✓ COMPLETE
```

**Notes:**
- Production starts after Engineering (doesn't wait for Third Party/State)
- Cannot ship (Transport) until State(s) approved
- Procurement branches from Long Lead + Cutsheets sign-offs
- If only 1 state required, show 1 state node
- [FUTURE] placeholder for additional parallel tracks later

---

### Station List

| Phase | Station | Sub-Stations | Notes |
|-------|---------|--------------|-------|
| **1. Initiation** | PO Received | - | Trigger for everything |
| **2. Dealer Sign-Offs** | Drawings | 20%, 65%, 95%, 100% | Version controlled |
| | Long Lead | Submitted, Signed Off | |
| | Cutsheets | Submitted, Signed Off | |
| | Colors | Submitted, Signed Off | |
| | Procurement | - | Branches from LL + Cutsheets |
| **3. Internal** | Engineering | - | Usually internal team |
| | Third Party | - | Runs parallel with Production |
| | State(s) | 1 node per state | Dynamic based on project |
| | Production | - | Starts after Engineering |
| **4. Delivery** | Transport | - | Requires State(s) complete |

---

### Interaction

**Hover (Quick View):**
```
┌─────────────────────────────┐
│ LONG LEAD - SIGNED OFF      │
│ ─────────────────────────── │
│ Status: Awaiting Response   │
│ Court: Dealer               │
│ Due: Jan 15, 2026           │
│ Days: 2 remaining           │
│ ─────────────────────────── │
│ Click for details →         │
└─────────────────────────────┘
```

**Click (Full Modal):**
- Station name and status
- All linked tasks with their statuses
- Due date and timeline
- Whose court it's in
- History/notes
- CO impacts (if any - "Revised due to CO #3 on 1/15/26")
- Link to navigate to that section in project

---

### Orientation Toggle

**Location:** Top-right of the Workflow tab (consistent with other view toggles)

**Options:**
| Icon | Mode | Description |
|------|------|-------------|
| ↕️ | Portrait | Top-to-bottom flow, scrollable |
| ↔️ | Landscape | Left-to-right flow, can stretch across monitors |

**Saved:** User preference (persists across sessions)

---

### Edge Cases

| Scenario | Visual Treatment |
|----------|------------------|
| Project just created | All nodes gray except PO (green if received) |
| Project on hold | Frozen animation, maybe slight opacity reduction |
| Station N/A (skipped) | Crossed out node, grayed, line bypasses |
| Change Order impact | No visual indicator; noted in modal history |
| Multiple states | Multiple state nodes appear dynamically |
| Single state | One state node |
| No states required | State node hidden or crossed out |

---

### Task Integration

**Task Statuses (System-Wide Update):**
| Status | Description | Kanban Column |
|--------|-------------|---------------|
| **Not Started** | Work hasn't begun | To Do |
| **In Progress** | Actively being worked on | In Progress |
| **Awaiting Response** | Waiting on someone else (dealer, state, etc.) | Waiting |
| **Completed** | Done | Done |
| **Cancelled** | No longer needed (e.g., removed by CO) | (Hidden or Archive) |

**"Court" Values for Awaiting Response:**
| Court | Meaning |
|-------|---------|
| Dealer | Waiting on dealer response/sign-off |
| Drafting | Drafting team working on drawings |
| PM | PM needs to send/act |
| Engineering | Internal engineering review |
| Third Party | Waiting on third party stamp |
| State | Waiting on state approval |
| Factory | Factory/production team |
| Procurement | Waiting on materials |

**Station ↔ Task Relationship:**
- **1:Many** - Each station can have multiple tasks linked
- Tasks are NOT auto-generated by default
- Users link tasks to stations manually when creating/editing tasks
- Toggle option to auto-generate station tasks (in project creation + project settings)

**Station Status Calculation (Worst Status Wins):**
```
If ANY linked task is:        Station shows:
─────────────────────────────────────────────
Cancelled (all)           →   Crossed out / N/A
Not Started (any)         →   Not Started (gray)
In Progress (any)         →   In Progress (yellow/orange/red based on deadline)
Awaiting Response (any)   →   Awaiting Response (yellow/orange/red)
Completed (all)           →   Complete (green)
```

**Priority:** Not Started > In Progress > Awaiting Response > Completed
(Excluding Cancelled which is special case)

**Station Deadline Calculation:**
- Uses the **earliest deadline** among all linked tasks
- This drives the yellow → orange → red color transition

**Auto-Sync:**
- When task status changes → station status auto-recalculates
- Station status is derived, not stored separately

---

### Auto-Generate Tasks Toggle

**Project Creation:**
- [ ] Auto-generate workflow tasks
- If checked: Creates one task per station with default due dates based on milestone template

**Project Settings (Details page):**
- Toggle: "Auto-generate remaining workflow tasks"
- Only generates tasks for stations that don't have any linked tasks yet

**Default:** OFF (to prevent dashboard clutter)

---

### Database Schema

```sql
-- Workflow stations (template - what stations exist)
CREATE TABLE workflow_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Station Identity
  station_key VARCHAR NOT NULL UNIQUE,    -- 'drawings_20', 'long_lead_submitted', etc.
  station_name VARCHAR NOT NULL,          -- 'Drawings - 20%'
  phase INTEGER NOT NULL,                 -- 1, 2, 3, 4
  phase_name VARCHAR NOT NULL,            -- 'Initiation', 'Dealer Sign-Offs', etc.
  
  -- Position in flow
  parent_station_key VARCHAR,             -- For sub-stations (e.g., 'drawings' for 'drawings_20')
  display_order INTEGER NOT NULL,         -- Order within phase
  
  -- Behavior
  is_parallel BOOLEAN DEFAULT false,      -- Part of parallel track?
  parallel_group VARCHAR,                 -- Group name for parallel stations
  can_skip BOOLEAN DEFAULT false,         -- Can this station be N/A?
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project-specific station status (derived/cached)
CREATE TABLE project_workflow_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  station_key VARCHAR REFERENCES workflow_stations(station_key),
  
  -- Status (derived from linked tasks, cached for performance)
  status VARCHAR DEFAULT 'not_started',   -- 'not_started', 'in_progress', 'awaiting_response', 'completed', 'skipped'
  
  -- Deadline (earliest from linked tasks)
  earliest_deadline DATE,
  
  -- Skip handling
  is_skipped BOOLEAN DEFAULT false,
  skipped_reason VARCHAR,
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, station_key)
);

CREATE INDEX idx_project_workflow_project ON project_workflow_status(project_id);

-- Link tasks to stations
ALTER TABLE tasks ADD COLUMN workflow_station_key VARCHAR REFERENCES workflow_stations(station_key);
ALTER TABLE tasks ADD COLUMN assigned_court VARCHAR;  -- 'dealer', 'drafting', 'pm', 'engineering', etc.

CREATE INDEX idx_tasks_workflow_station ON tasks(workflow_station_key);

-- Update task status enum (if using enum, otherwise just VARCHAR)
-- Statuses: 'Not Started', 'In Progress', 'Awaiting Response', 'Completed', 'Cancelled'
```

---

### Seed Data - Workflow Stations

```sql
INSERT INTO workflow_stations (station_key, station_name, phase, phase_name, parent_station_key, display_order, is_parallel, parallel_group, can_skip) VALUES
-- Phase 1: Initiation
('po_received', 'PO Received', 1, 'Initiation', NULL, 1, false, NULL, false),

-- Phase 2: Dealer Sign-Offs
('drawings', 'Drawings', 2, 'Dealer Sign-Offs', NULL, 10, true, 'dealer_signoffs', false),
('drawings_20', '20%', 2, 'Dealer Sign-Offs', 'drawings', 11, false, NULL, false),
('drawings_65', '65%', 2, 'Dealer Sign-Offs', 'drawings', 12, false, NULL, false),
('drawings_95', '95%', 2, 'Dealer Sign-Offs', 'drawings', 13, false, NULL, false),
('drawings_100', '100%', 2, 'Dealer Sign-Offs', 'drawings', 14, false, NULL, false),

('long_lead', 'Long Lead', 2, 'Dealer Sign-Offs', NULL, 20, true, 'dealer_signoffs', true),
('long_lead_submitted', 'Submitted', 2, 'Dealer Sign-Offs', 'long_lead', 21, false, NULL, true),
('long_lead_signed', 'Signed Off', 2, 'Dealer Sign-Offs', 'long_lead', 22, false, NULL, true),

('cutsheets', 'Cutsheets', 2, 'Dealer Sign-Offs', NULL, 30, true, 'dealer_signoffs', true),
('cutsheets_submitted', 'Submitted', 2, 'Dealer Sign-Offs', 'cutsheets', 31, false, NULL, true),
('cutsheets_signed', 'Signed Off', 2, 'Dealer Sign-Offs', 'cutsheets', 32, false, NULL, true),

('colors', 'Colors', 2, 'Dealer Sign-Offs', NULL, 40, true, 'dealer_signoffs', true),
('colors_submitted', 'Submitted', 2, 'Dealer Sign-Offs', 'colors', 41, false, NULL, true),
('colors_signed', 'Signed Off', 2, 'Dealer Sign-Offs', 'colors', 42, false, NULL, true),

('procurement', 'Procurement', 2, 'Dealer Sign-Offs', NULL, 50, false, NULL, false),

-- Phase 3: Internal Approvals
('engineering', 'Engineering', 3, 'Internal Approvals', NULL, 60, false, NULL, false),
('third_party', 'Third Party', 3, 'Internal Approvals', NULL, 70, true, 'internal_parallel', false),
('state_approval', 'State Approval', 3, 'Internal Approvals', NULL, 71, true, 'internal_parallel', true),
('production', 'Production', 3, 'Internal Approvals', NULL, 72, true, 'internal_parallel', false),

-- Phase 4: Delivery
('transport', 'Transport', 4, 'Delivery', NULL, 80, false, NULL, false);
```

---

### UI Location

**Tab:** New "Workflow" tab in Project Details (alongside Overview, Tasks, Schedule, Files, etc.)

**Tab Order Suggestion:**
`Overview | Workflow | Tasks | Schedule | RFIs | Submittals | Files | ...`

---

### Future Enhancements (Not in V1)

- Dealer Portal view (simplified, internal phases hidden)
- Print/export workflow diagram
- Historical view (show completed dates on each station)
- Comparison view (planned vs actual timeline)
- Gantt chart overlay option

---

## 👥 USER ROLES

### Existing Roles (from current system):
| Role | Dashboard Access | Description |
|------|------------------|-------------|
| **PM** | PM Dashboard | Project Manager - manages assigned projects |
| **Director** | PM + Director | Oversees multiple PMs and projects |
| **VP** | PM + Director + VP | Executive overview across all factories |
| **Admin** | All dashboards | Full system access |
| **IT** | PM + Director + IT | Technical administration |

### NEW Role: Project Coordinator (PC)
| Attribute | Value |
|-----------|-------|
| **Role Name** | PC (Project Coordinator) |
| **Factory-Specific** | YES - each PC is assigned to a specific factory |
| **Dashboard** | PC Dashboard (new) |
| **Primary Function** | Track deadlines, send warning emails, coordinate between PM and factory |

**PC Responsibilities:**
- Monitor all projects at their factory
- Track upcoming deadlines across all milestones
- Trigger/send warning emails (2 days before deadline)
- Coordinate with drafting team
- Coordinate with engineering
- Send drawings to third party and state
- Track state approval status

**PC Dashboard Shows:**
- All projects at their factory
- Upcoming deadlines (sorted by urgency)
- Overdue items (RED)
- Warning emails sent/pending
- Drawing status across all projects
- State approval status across all projects

---

## 🏭 FACTORY MILESTONE TEMPLATES

### Concept:
Each factory can have its own milestone template that auto-populates when a project is created. For now, all factories use the SAME template (the 7 standard milestones). Designed for easy extension later.

### Standard Template (All Factories - V1):
| # | Milestone Name | Days from PO | Requires Sign-Off |
|---|----------------|--------------|-------------------|
| 1 | Receipt of Purchase Order | 0 | No (trigger) |
| 2 | Drawings Submitted to Customer | +14 | No |
| 3 | Customer Approved Drawings Returned | +28 | YES |
| 4 | Long Lead Items Submitted to Customer | +21 | No |
| 5 | Long Lead Items Sign-Off Returned | +35 | YES |
| 6 | Color Selections Submitted to Customer | +21 | No |
| 7 | Color Selections Sign-Off Returned | +35 | YES |

*Note: Days are examples - actual dates set per project based on Schedule Letter*

### Database Design (Extensible):
```sql
-- Factory milestone templates
CREATE TABLE factory_milestone_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
  
  -- Template Info
  milestone_order INTEGER NOT NULL,       -- Display order
  milestone_name VARCHAR NOT NULL,
  milestone_key VARCHAR NOT NULL,         -- Machine-readable key for code reference
  
  -- Defaults
  default_days_from_po INTEGER,           -- Default offset from PO date
  requires_signoff BOOLEAN DEFAULT false,
  signoff_type VARCHAR,                   -- 'dealer', 'internal', null
  
  -- Extensibility
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',            -- Future fields without schema change
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(factory_id, milestone_key)
);

-- Seed all factories with standard template
-- (Run after factories table exists)
```

### Extensibility Notes:
- `metadata JSONB` field allows adding new attributes without migrations
- `milestone_key` allows code to reference specific milestones reliably
- `is_active` allows "soft delete" of milestones without breaking history
- Template changes only affect NEW projects (existing projects keep their milestones)

---

### ✅ ALL QUESTIONS ANSWERED

### Milestones:
1. ✅ ANSWERED - 7 milestones are STANDARD across all factories
2. ✅ ANSWERED - Factory-specific templates YES, but all same for now. Design for extensibility.
3. ✅ ANSWERED - Drawing milestones: 20%, 65%, 95%, 100%

### Long Lead Items:
4. ✅ ANSWERED - Typical items: HVAC, Panels (always have cut sheets), others vary

### Sign-Offs:
5. ✅ ANSWERED - Dealer signs the form (physical/PDF signature)
6. ✅ ANSWERED - Track whole form signed, not line-by-line
7. ✅ ANSWERED - YES, store signed PDFs in system

### State Approvals:
8. ✅ ANSWERED - Each state has own agency; IIBC compact (MN, NJ, RI, ND + WI) provides reciprocity
9. ✅ ANSWERED - Don't track agency name, just state
10. ✅ ANSWERED - Timeline varies: weeks to months depending on state/complexity

### Internal Process:
11. ✅ ANSWERED - Internal process: Engineering → Third Party → State
12. ✅ ANSWERED - Dealer does NOT see internal process

### Drawing Workflow:
13. ✅ ANSWERED - PM is intermediary once assigned (Sales always CC'd)
14. ✅ ANSWERED - Version control: version #, date sent, response, redlines, response date
15. ✅ ANSWERED - 4 statuses: Approve, Approve with Redlines, Reject with Redlines, Reject
16. ✅ ANSWERED - One unified drawing set (not tracked separately)
17. ✅ ANSWERED - Engineering usually Sunbelt internal, sometimes specialty third party
18. ✅ ANSWERED - Third party varies by factory (local firm), don't track company name
19. ✅ ANSWERED - State returns stamps (on drawings) and seals/tags (on building)

### Procurement:
20. ✅ ANSWERED - Triggered by cutsheet submittal sign-off, NOT drawing percentage
21. ✅ ANSWERED - Long lead items ordered early; standard items closer to online date
22. ✅ ANSWERED - Factories don't have storage space

### Warning Emails:
23. ✅ ANSWERED - TO: Dealer, CC: Secondary PM, Director, PC, Plant Manager, Sales Manager
24. ✅ ANSWERED - 2 days before deadline
25. ✅ ANSWERED - Yes, dealer gets reminders

### Roles & Dashboards:
26. ✅ ANSWERED - PC (Project Coordinator) is separate role from PM
27. ✅ ANSWERED - PC is factory-specific
28. ✅ ANSWERED - PC gets their own dashboard

### Form Creation:
29. ✅ ANSWERED - In-app form builder OR upload factory doc

### PO & Building Type:
30. ✅ ANSWERED - Just track that we have PO, don't need to pull data from it
31. ✅ ANSWERED - Commercial modular (medical, education, bunk houses, dorms, multiplexes) - NOT residential single family

---

## 🗄️ DATABASE CHANGES NEEDED

### Option A: Add Milestones to Projects Table
Add columns directly to `projects` table:
```
+ po_received_date
+ po_received_due
... etc
```
**Pros:** Simple, no new tables
**Cons:** Projects table already has 52 columns, inflexible
**VERDICT:** ❌ Not recommended

### Option B: New `project_milestones` Table (RECOMMENDED) ✅
```sql
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Milestone Info
  milestone_type VARCHAR NOT NULL,  -- 'po_received', 'long_lead_signoff', etc.
  milestone_name VARCHAR NOT NULL,  -- Display name
  milestone_category VARCHAR,       -- 'internal', 'dealer', 'external'
  
  -- Dates
  due_date DATE,
  completed_date DATE,
  sent_date DATE,                   -- When form was sent to dealer
  
  -- Status
  status VARCHAR DEFAULT 'Pending', -- 'Pending', 'Sent', 'Completed', 'Overdue', 'N/A'
  
  -- Sign-Off Info (for dealer milestones)
  is_dealer_signoff BOOLEAN DEFAULT false,
  signed_by VARCHAR,                -- Who signed (dealer contact name)
  signed_date TIMESTAMP,
  
  -- Document Storage
  document_url TEXT,                -- Link to signed document in storage
  document_name VARCHAR,            -- Original filename
  
  -- Warning Email Tracking
  warning_email_sent_at TIMESTAMP,
  warning_email_sent_to TEXT[],     -- Array of email addresses
  
  -- Metadata
  notes TEXT,
  sort_order INTEGER,               -- Display order
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_milestones_due ON project_milestones(due_date);
CREATE INDEX idx_milestones_status ON project_milestones(status);
CREATE INDEX idx_milestones_category ON project_milestones(milestone_category);
```

### New `long_lead_items` Table (For In-App Form Builder)
```sql
CREATE TABLE long_lead_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE CASCADE,
  
  -- Item Details
  item_name VARCHAR NOT NULL,       -- "HVAC Unit"
  model_number VARCHAR,             -- "Carrier 24ACC636A003"
  manufacturer VARCHAR,
  quantity INTEGER DEFAULT 1,
  
  -- Cut Sheet
  cut_sheet_url TEXT,               -- Link to cut sheet PDF
  cut_sheet_name VARCHAR,
  
  -- Metadata
  notes TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_long_lead_project ON long_lead_items(project_id);
CREATE INDEX idx_long_lead_milestone ON long_lead_items(milestone_id);
```

### New `color_selections` Table (For In-App Color Form Builder)
```sql
CREATE TABLE color_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE CASCADE,
  
  -- Category & Item
  category VARCHAR NOT NULL,        -- 'Floor Covering', 'Interior Walls', etc.
  item_type VARCHAR NOT NULL,       -- 'VCT', 'Carpet', 'Paint', etc.
  
  -- Selection Details
  options_available TEXT,           -- What options are available
  selected_option VARCHAR,          -- What dealer chose
  color_finish VARCHAR,             -- Specific color name/code
  
  -- Cut Sheet
  cut_sheet_url TEXT,
  cut_sheet_name VARCHAR,
  
  -- Non-Stock Tracking
  is_non_stock BOOLEAN DEFAULT false,
  non_stock_verified BOOLEAN DEFAULT false,
  non_stock_lead_time VARCHAR,      -- "6-8 weeks"
  non_stock_task_id UUID,           -- Link to auto-generated task
  
  -- Metadata
  notes TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_color_project ON color_selections(project_id);
CREATE INDEX idx_color_milestone ON color_selections(milestone_id);
CREATE INDEX idx_color_non_stock ON color_selections(is_non_stock);
```

### New `drawing_progress` Table
```sql
CREATE TABLE drawing_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  percentage INTEGER NOT NULL,      -- 20, 40, 60, 80, 100
  milestone_name VARCHAR,           -- "Floor plan only drawing out"
  
  due_date DATE,
  completed_date DATE,
  status VARCHAR DEFAULT 'Pending',
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drawing_project ON drawing_progress(project_id);
```

### New `milestone_templates` Table (Factory-Specific)
```sql
CREATE TABLE milestone_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id UUID REFERENCES factories(id),
  
  milestone_type VARCHAR NOT NULL,
  milestone_name VARCHAR NOT NULL,
  milestone_category VARCHAR,       -- 'internal', 'dealer', 'external'
  
  default_days_from_po INTEGER,     -- Days offset from PO date
  sort_order INTEGER,
  is_dealer_signoff BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT true,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_factory ON milestone_templates(factory_id);
```

### New `warning_emails_log` Table (Audit Trail)
```sql
CREATE TABLE warning_emails_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  milestone_id UUID REFERENCES project_milestones(id),
  
  -- Email Details
  email_type VARCHAR,               -- 'warning', 'overdue', 'confirmation'
  sent_to TEXT[],                   -- TO recipients
  cc_to TEXT[],                     -- CC recipients
  subject VARCHAR,
  body TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID REFERENCES users(id),
  
  -- Status
  delivery_status VARCHAR           -- 'sent', 'failed', 'bounced'
);

CREATE INDEX idx_warning_emails_project ON warning_emails_log(project_id);
CREATE INDEX idx_warning_emails_milestone ON warning_emails_log(milestone_id);
```

### Projects Table Updates
```sql
-- Add fields to track project team for email CCs
ALTER TABLE projects ADD COLUMN IF NOT EXISTS 
  coordinator_id UUID REFERENCES users(id);  -- PC assigned

ALTER TABLE projects ADD COLUMN IF NOT EXISTS
  plant_manager_id UUID REFERENCES users(id);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS
  sales_manager_id UUID REFERENCES users(id);

-- Note: secondary_pm already exists as backup_pm_id
```

### File Categories Update
Update `file_attachments.category` to use Sunbelt Folder Structure 2.0:
```sql
-- Example category values (hierarchical path format):
-- 'sales/estimate'
-- 'sales/po/final_signed'
-- 'schedule/final_signed'
-- 'project_mgmt/long_lead/final_sent'
-- 'project_mgmt/color_selections/final_sent'
-- 'procurement/cut_sheets'
-- 'qc/production_photos'
-- etc.

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_file_attachments_category 
  ON file_attachments(category);
```

---

## 🖥️ UI CHANGES NEEDED

### 1. Project Details - Files Tab Enhancement
**Current:** Basic file list with filter by type (Floor Plans, Documents, Task Attachments, etc.)

**Enhanced:** Implement full **Sunbelt Folder Structure 2.0**
- Tree view showing all 8 main folders
- Subfolders as defined in the standard
- Upload to specific folder location
- Move files between folders
- Folder-based filtering

**Folder Categories for `file_attachments.category`:**
```
'sales/estimate'
'sales/floor_plan'
'sales/specifications'
'sales/po/final_signed'
'sales/change_orders'
'schedule/original'
'schedule/iterations'
'schedule/final_signed'
'correspondence/sales_emails'
'correspondence/emails'
'drafting/drawings/final'
'drafting/drawings/customer'
'drafting/calculations'
'drafting/state_approvals'
'procurement/quotes'
'procurement/cut_sheets'
'procurement/purchase_orders'
'accounting/invoicing'
'accounting/mso_labels'
'project_mgmt/long_lead/final_sent'
'project_mgmt/color_selections/final_sent'
'project_mgmt/submittals'
'project_mgmt/vendor_coordination'
'project_mgmt/rfis'
'qc/production_photos'
'qc/qc_traveler'
'qc/factory_inspections'
'qc/ship_loose'
'qc/ship_loose_photos'
'qc/labels_tags'
'qc/transport_delivery'
'qc/delivery_tickets'
'qc/warranty_photos'
```

### 2. Project Details - New "Schedule" Tab
- Shows all milestones in timeline/checklist format
- Visual indicators (green=done, yellow=upcoming, red=overdue)
- Click to mark complete / add notes
- Upload signed documents
- Long Lead Form builder (in-app) OR upload
- Color Selection Form builder (in-app) OR upload

### 3. NEW: Project Coordinator (PC) Dashboard
**Focus:** Track sign-offs and deadlines across multiple PMs' projects

| Section | Description |
|---------|-------------|
| Upcoming Deadlines | All dealer sign-offs due in next 7 days |
| Overdue Items | All missed deadlines requiring action |
| Projects by PM | Group view of which PM owns which projects |
| My Assigned Projects | Projects where PC is assigned |
| Quick Actions | Send reminder, mark complete, upload doc |

**PC Dashboard Widgets:**
- 🔴 Overdue Sign-Offs (count + list)
- 🟡 Due This Week (count + list)
- 🟢 Recently Completed (last 7 days)
- 📊 Sign-Off Compliance Rate
- 📋 Projects Needing Attention

### 4. Dashboard Updates (PM/Director)
- Show upcoming dealer sign-offs needed
- Show overdue milestones across all projects
- Quick actions to send reminder emails

### 5. New Modals
- Edit Milestone modal
- Upload Sign-Off Document modal
- Send Reminder Email modal
- Long Lead Form Builder modal
- Color Selection Form Builder modal

### 6. Reports
- Add "Schedule Compliance" report
- Track on-time vs late sign-offs
- Factory comparison
- PM comparison (who gets sign-offs on time)

### 7. Email Templates
- Warning Email (2 days before)
- Overdue Email
- Confirmation Email (when signed)

---

## ⚠️ RISK ASSESSMENT

### What We DON'T Want to Break:
- ✅ Existing task system (keep working)
- ✅ RFI system (keep working)
- ✅ Submittal system (keep working)
- ✅ Calendar integration
- ✅ Dashboard views
- ✅ Role-based access

### Approach:
1. **Add new tables** rather than heavily modifying existing
2. **New tab on ProjectDetails** rather than changing existing tabs
3. **Extend** existing components rather than rewriting
4. **Feature flag** if needed to roll out gradually

---

## 📝 NEXT STEPS

1. [ ] Matthew answers questions above
2. [ ] Finalize database schema
3. [ ] Create SQL migration scripts
4. [ ] Design UI mockups
5. [ ] Build incrementally:
   - Phase 1: Database + basic milestone tracking
   - Phase 2: ProjectDetails Schedule tab
   - Phase 3: Warning email system
   - Phase 4: Dashboard integration
   - Phase 5: Reports

---

## 📎 ATTACHMENTS

- [x] Schedule Letter example (PMI-6798) - uploaded by Matthew
- [x] Long Lead Form template (.xls) - uploaded by Matthew
- [x] Color Selection Form example (PMI-6787) - uploaded by Matthew
- [x] Change Order example (NWBS #25250, CO #9) - uploaded by Matthew
- [x] Dealer Quote example (PMI PM-1072-2025) - uploaded by Matthew
- [x] **Project Folder Structure 2.0** (PowerPoint) - Sunbelt standard folder structure
- [x] Purchase Order example (Mobile Modular R339004567, Project 25250) - uploaded by Matthew

---

*Document will be updated as we gather more requirements*
