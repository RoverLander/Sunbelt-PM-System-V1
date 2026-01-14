# Database Schema Reference

**Last Updated:** January 14, 2026
**Database:** Supabase (PostgreSQL)
**Version:** 1.1.0

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Project Management Tables](#project-management-tables)
3. [Workflow Tables](#workflow-tables)
4. [Sales Pipeline Tables](#sales-pipeline-tables)
5. [Directory System Tables](#directory-system-tables)
6. [IT Admin Tables](#it-admin-tables)
7. [Supporting Tables](#supporting-tables)
8. [Row Level Security (RLS)](#row-level-security-rls)

---

## Core Tables

### users

User accounts for the system. Links to Supabase Auth.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key, links to auth.users |
| email | VARCHAR(255) | NO | | Email address (unique) |
| name | VARCHAR(100) | NO | | Display name |
| role | VARCHAR(30) | NO | | Role: VP, Director, PM, PC, IT, IT_Manager, Admin, Sales_Manager, Sales_Rep |
| factory | VARCHAR(20) | YES | | Factory code assignment (e.g., 'NWBS', 'PMI') |
| factory_id | UUID | YES | | FK to factories.id |
| phone | VARCHAR(20) | YES | | Phone number |
| is_active | BOOLEAN | NO | true | Active status |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Indexes:** `idx_users_role`, `idx_users_factory`, `idx_users_email`

---

### projects

Main projects table with full Praxis integration.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_number | VARCHAR(30) | NO | | Unique project number (e.g., 'NWBS-25250') |
| name | VARCHAR(200) | NO | | Project name |
| client_name | VARCHAR(200) | YES | | Client company name |
| factory | VARCHAR(20) | NO | | Factory code |
| status | VARCHAR(30) | NO | 'Draft' | Project status |
| health_status | VARCHAR(30) | NO | 'On Track' | On Track, At Risk, Critical |
| current_phase | INTEGER | NO | 1 | Current workflow phase (1-4) |
| contract_value | NUMERIC(12,2) | YES | | Contract value |
| **PM Assignment** |
| owner_id | UUID | YES | | FK to users.id - Project owner |
| primary_pm_id | UUID | YES | | FK to users.id - Primary PM |
| backup_pm_id | UUID | YES | | FK to users.id - Backup PM |
| created_by | UUID | YES | | FK to users.id |
| **Dates** |
| start_date | DATE | YES | | Project start |
| delivery_date | DATE | YES | | Target delivery |
| target_online_date | DATE | YES | | Target go-live |
| **Praxis Identification** |
| praxis_quote_number | VARCHAR(20) | YES | | Praxis quote format: {Factory}-{Seq}-{Year} |
| serial_number | VARCHAR(20) | YES | | Auto-generated on sale |
| praxis_source_factory | VARCHAR(10) | YES | | Source factory code |
| folder_number | VARCHAR(20) | YES | | Bid folder reference |
| customer_po_number | VARCHAR(50) | YES | | Customer PO |
| **Building Specs** |
| building_type | VARCHAR(30) | YES | | CUSTOM, FLEET/STOCK, GOVERNMENT, Business |
| building_height | INTEGER | YES | | |
| building_width | INTEGER | YES | | |
| building_length | INTEGER | YES | | |
| interior_wall_lf | INTEGER | YES | | Interior wall linear feet |
| stories | INTEGER | YES | 1 | Number of stories |
| module_size | VARCHAR(20) | YES | | |
| module_count | INTEGER | YES | 1 | |
| **Cost Info** |
| material_cost | DECIMAL(12,2) | YES | | |
| markup_factor | DECIMAL(5,3) | YES | | |
| engineering_cost | DECIMAL(10,2) | YES | | |
| approvals_cost | DECIMAL(10,2) | YES | | |
| price_per_sqft | DECIMAL(10,2) | YES | | |
| **Location & Compliance** |
| site_address | TEXT | YES | | |
| site_city | VARCHAR(100) | YES | | |
| site_state | VARCHAR(2) | YES | | |
| site_zip | VARCHAR(10) | YES | | |
| state_tags | TEXT | YES | | Installation state(s) |
| climate_zone | INTEGER | YES | | |
| floor_load_psf | INTEGER | YES | | |
| roof_load_psf | INTEGER | YES | | |
| occupancy_type | VARCHAR(10) | YES | | A, B, E, etc. |
| set_type | VARCHAR(30) | YES | | PAD, PIERS, ABOVE GRADE SET |
| **Special Requirements** |
| requires_ttp | BOOLEAN | NO | false | Toilet, Tissue & Paper |
| sprinkler_type | VARCHAR(20) | YES | | N/A, Wet, Dry |
| has_plumbing | BOOLEAN | NO | false | |
| wui_compliant | BOOLEAN | NO | false | Wildland Urban Interface |
| requires_cut_sheets | BOOLEAN | NO | false | |
| requires_om_manuals | BOOLEAN | NO | false | |
| foundation_plan_status | VARCHAR(30) | YES | | |
| **Dealer Reference** |
| dealer_id | UUID | YES | | FK to dealers.id |
| dealer_branch | VARCHAR(50) | YES | | |
| dealer_contact_name | VARCHAR(100) | YES | | |
| dealer_email | VARCHAR(255) | YES | | |
| dealer_name | VARCHAR(100) | YES | | |
| **Schedule** |
| promised_delivery_date | DATE | YES | | |
| drawings_due_date | DATE | YES | | |
| long_lead_notes | TEXT | YES | | |
| sold_date | DATE | YES | | |
| **Pipeline/Forecasting** |
| outlook_percentage | INTEGER | YES | | Sales probability |
| waiting_on | TEXT | YES | | Blocker |
| expected_close_timeframe | VARCHAR(50) | YES | | |
| difficulty_rating | INTEGER | YES | | 1-5 complexity |
| **Approval Tracking** |
| customer_submittal_date | DATE | YES | | |
| customer_approval_date | DATE | YES | | |
| state_submittal_date | DATE | YES | | |
| state_approval_date | DATE | YES | | |
| **Timestamps** |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |
| workflow_started_at | TIMESTAMPTZ | YES | | |
| praxis_synced_at | TIMESTAMPTZ | YES | | |

**Indexes:** `idx_projects_factory`, `idx_projects_status`, `idx_projects_praxis_quote`, `idx_projects_serial`, `idx_projects_dealer`, `idx_projects_building_type`, `idx_projects_sold_date`

---

### tasks

Task items linked to projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | NO | | FK to projects.id |
| title | VARCHAR(200) | NO | | Task title |
| description | TEXT | YES | | |
| status | VARCHAR(30) | NO | 'Not Started' | Not Started, In Progress, Awaiting Response, Completed, Cancelled |
| priority | VARCHAR(20) | NO | 'Medium' | Low, Medium, High, Critical |
| due_date | DATE | YES | | |
| start_date | DATE | YES | | |
| **Assignment** |
| assignee_id | UUID | YES | | FK to users.id - Old assignment field |
| internal_owner_id | UUID | YES | | FK to users.id - Internal team owner |
| **Directory Contact Assignment** |
| assigned_to_contact_id | UUID | YES | | FK to directory_contacts.id |
| assigned_to_name | VARCHAR(200) | YES | | Name snapshot |
| assigned_to_email | VARCHAR(255) | YES | | Email snapshot |
| notify_contacts | JSONB | NO | '[]' | Array of {id, name, email} |
| **External Contact Assignment** |
| is_external | BOOLEAN | NO | false | External assignment flag |
| assigned_to_external_id | UUID | YES | | FK to external_contacts.id |
| assigned_external_name | VARCHAR(200) | YES | | |
| assigned_external_email | VARCHAR(255) | YES | | |
| external_assignee_name | VARCHAR(200) | YES | | Legacy external name |
| external_assignee_email | VARCHAR(255) | YES | | Legacy external email |
| **Workflow** |
| milestone_id | UUID | YES | | FK to milestones.id |
| workflow_station_key | VARCHAR(50) | YES | | FK to workflow_stations.station_key |
| assigned_court | VARCHAR(30) | YES | | Factory, Field |
| **Timestamps** |
| created_by | UUID | YES | | FK to users.id |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Indexes:** `idx_tasks_project`, `idx_tasks_status`, `idx_tasks_assignee`, `idx_tasks_assigned_contact`, `idx_tasks_assigned_external`

---

### rfis

Request for Information records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | NO | | FK to projects.id |
| rfi_number | VARCHAR(30) | NO | | Auto-generated: PROJECT-RFI-001 |
| subject | VARCHAR(200) | NO | | RFI subject line |
| question | TEXT | YES | | Question content |
| answer | TEXT | YES | | Answer when provided |
| status | VARCHAR(30) | NO | 'Draft' | Draft, Open, Pending, Answered, Closed |
| priority | VARCHAR(20) | NO | 'Medium' | |
| due_date | DATE | YES | | |
| **Recipient** |
| sent_to | VARCHAR(200) | YES | | Recipient name |
| sent_to_email | VARCHAR(255) | YES | | |
| internal_owner_id | UUID | YES | | FK to users.id |
| is_external | BOOLEAN | NO | false | |
| **Directory Contact Assignment** |
| assigned_to_contact_id | UUID | YES | | FK to directory_contacts.id |
| assigned_to_name | VARCHAR(200) | YES | | |
| assigned_to_email | VARCHAR(255) | YES | | |
| notify_contacts | JSONB | NO | '[]' | |
| **External Contact Assignment** |
| assigned_to_external_id | UUID | YES | | FK to external_contacts.id |
| assigned_external_name | VARCHAR(200) | YES | | |
| assigned_external_email | VARCHAR(255) | YES | | |
| **References** |
| spec_section | VARCHAR(100) | YES | | Spec section reference |
| drawing_reference | VARCHAR(100) | YES | | Drawing reference |
| **Timestamps** |
| created_by | UUID | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Indexes:** `idx_rfis_project`, `idx_rfis_status`, `idx_rfis_assigned_contact`, `idx_rfis_assigned_external`

---

### submittals

Submittal tracking records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | NO | | FK to projects.id |
| submittal_number | VARCHAR(30) | NO | | Auto-generated: PROJECT-SUB-001 |
| title | VARCHAR(200) | NO | | Submittal title |
| submittal_type | VARCHAR(50) | YES | | Shop Drawings, Product Data, Samples, etc. |
| status | VARCHAR(30) | NO | 'Pending' | Pending, Submitted, Under Review, Approved, Rejected |
| revision_number | INTEGER | NO | 1 | Current revision |
| **Specifications** |
| spec_section | VARCHAR(100) | YES | | |
| manufacturer | VARCHAR(200) | YES | | |
| model_number | VARCHAR(100) | YES | | |
| **Review** |
| reviewer_comments | TEXT | YES | | |
| due_date | DATE | YES | | |
| submitted_date | DATE | YES | | |
| **Recipient** |
| sent_to | VARCHAR(200) | YES | | |
| sent_to_email | VARCHAR(255) | YES | | |
| internal_owner_id | UUID | YES | | |
| is_external | BOOLEAN | NO | false | |
| **Directory Contact Assignment** |
| assigned_to_contact_id | UUID | YES | | FK to directory_contacts.id |
| assigned_to_name | VARCHAR(200) | YES | | |
| assigned_to_email | VARCHAR(255) | YES | | |
| notify_contacts | JSONB | NO | '[]' | |
| **External Contact Assignment** |
| assigned_to_external_id | UUID | YES | | FK to external_contacts.id |
| assigned_external_name | VARCHAR(200) | YES | | |
| assigned_external_email | VARCHAR(255) | YES | | |
| **Timestamps** |
| created_by | UUID | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Indexes:** `idx_submittals_project`, `idx_submittals_status`, `idx_submittals_assigned_contact`, `idx_submittals_assigned_external`

---

### milestones

Project milestone dates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | NO | | FK to projects.id |
| title | VARCHAR(200) | NO | | Milestone name |
| due_date | DATE | YES | | Target date |
| completed_date | DATE | YES | | Actual completion |
| status | VARCHAR(30) | NO | 'Pending' | Pending, Completed |
| notes | TEXT | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

---

## Project Management Tables

### project_logs

Audit log of project changes and notes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | NO | | FK to projects.id |
| user_id | UUID | YES | | FK to users.id |
| entry_type | VARCHAR(50) | NO | 'note' | note, status_change, task_update, etc. |
| title | VARCHAR(255) | YES | | Log entry title |
| content | TEXT | YES | | Log content |
| attachments | JSONB | NO | '[]' | Array of attachment info |
| metadata | JSONB | NO | '{}' | Additional metadata |
| is_pinned | BOOLEAN | NO | false | |
| is_important | BOOLEAN | NO | false | |
| log_date | DATE | NO | CURRENT_DATE | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Indexes:** `idx_project_logs_project`, `idx_project_logs_date`, `idx_project_logs_type`

---

### file_attachments

Uploaded files linked to various items.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| task_id | UUID | YES | | FK to tasks.id |
| rfi_id | UUID | YES | | FK to rfis.id |
| submittal_id | UUID | YES | | FK to submittals.id |
| file_name | VARCHAR(255) | NO | | Original filename |
| file_path | TEXT | NO | | Supabase storage path |
| file_size | INTEGER | YES | | Size in bytes |
| content_type | VARCHAR(100) | YES | | MIME type |
| uploaded_by | UUID | YES | | FK to users.id |
| created_at | TIMESTAMPTZ | NO | NOW() | |

---

### floor_plans

Floor plan images for projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | NO | | FK to projects.id |
| name | VARCHAR(200) | YES | | Floor plan name |
| file_path | TEXT | NO | | Storage path |
| file_name | VARCHAR(255) | YES | | |
| is_active | BOOLEAN | NO | true | |
| created_by | UUID | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |

---

### floor_plan_items

Markers pinned to floor plans.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| floor_plan_id | UUID | NO | | FK to floor_plans.id |
| page_id | UUID | YES | | FK to floor_plan_pages.id |
| x_position | NUMERIC(5,2) | NO | 50 | X position (%) |
| y_position | NUMERIC(5,2) | NO | 50 | Y position (%) |
| item_type | VARCHAR(50) | NO | 'marker' | marker, task, rfi, submittal |
| label | VARCHAR(100) | YES | | |
| description | TEXT | YES | | |
| status | VARCHAR(30) | NO | 'pending' | |
| task_id | UUID | YES | | FK to tasks.id |
| rfi_id | UUID | YES | | FK to rfis.id |
| submittal_id | UUID | YES | | FK to submittals.id |
| color | VARCHAR(20) | NO | '#3b82f6' | |
| icon | VARCHAR(50) | YES | | |
| metadata | JSONB | NO | '{}' | |
| created_by | UUID | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

---

## Workflow Tables

### workflow_stations

Workflow station definitions (29 stations across 4 phases).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| station_key | VARCHAR(50) | NO | | Unique key (e.g., 'design_kickoff') |
| station_name | VARCHAR(100) | YES | | Legacy name column |
| name | VARCHAR(100) | YES | | Display name |
| description | TEXT | YES | | |
| phase | INTEGER | NO | | Phase 1-4 |
| display_order | INTEGER | NO | | Sort order |
| default_owner | VARCHAR(50) | YES | | Default owner role |
| is_required | BOOLEAN | NO | true | Required for completion |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | NOW() | |

**Indexes:** `idx_workflow_stations_phase`

---

### project_workflow_status

Project progress through workflow stations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | YES | | FK to projects.id |
| station_key | VARCHAR(50) | YES | | FK to workflow_stations.station_key |
| status | VARCHAR(20) | NO | 'not_started' | not_started, in_progress, complete |
| started_date | DATE | YES | | |
| completed_date | DATE | YES | | |
| deadline | DATE | YES | | |
| notes | TEXT | YES | | |
| updated_by | UUID | YES | | FK to users.id |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Unique:** (project_id, station_key)

---

### change_orders

Change order tracking for projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | YES | | FK to projects.id |
| change_order_number | VARCHAR(20) | YES | | Display number |
| co_number | INTEGER | YES | | Numeric CO number |
| change_type | VARCHAR(30) | NO | 'General' | |
| co_type | VARCHAR(30) | YES | | |
| status | VARCHAR(20) | NO | 'Draft' | Draft, Pending, Approved, Rejected |
| description | TEXT | YES | | |
| reason | TEXT | YES | | |
| notes | TEXT | YES | | |
| date | DATE | YES | | |
| submitted_date | DATE | YES | | |
| sent_date | DATE | YES | | |
| signed_date | DATE | YES | | |
| implemented_date | DATE | YES | | |
| total_amount | NUMERIC(12,2) | NO | 0 | |
| document_url | TEXT | YES | | |
| created_by | UUID | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

---

### long_lead_items

Long lead time items tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | YES | | FK to projects.id |
| item_name | VARCHAR(200) | NO | | |
| description | TEXT | YES | | |
| manufacturer | VARCHAR(100) | YES | | |
| model_number | VARCHAR(100) | YES | | |
| supplier | VARCHAR(100) | YES | | |
| quantity | INTEGER | NO | 1 | |
| lead_time_weeks | INTEGER | YES | | |
| has_cutsheet | BOOLEAN | NO | false | |
| cutsheet_url | TEXT | YES | | |
| cutsheet_name | VARCHAR(255) | YES | | |
| order_date | DATE | YES | | |
| expected_delivery | DATE | YES | | |
| actual_delivery | DATE | YES | | |
| submitted_date | DATE | YES | | |
| signoff_date | DATE | YES | | |
| status | VARCHAR(30) | NO | 'Pending' | |
| notes | TEXT | YES | | |
| created_by | UUID | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

---

### color_selections

Color selections tracking for projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | YES | | FK to projects.id |
| category | VARCHAR(50) | NO | | Category (Wall, Floor, Trim, etc.) |
| custom_category | VARCHAR(100) | YES | | |
| item_name | VARCHAR(200) | YES | | |
| color_name | VARCHAR(100) | YES | | |
| color_code | VARCHAR(50) | YES | | |
| manufacturer | VARCHAR(100) | YES | | |
| product_line | VARCHAR(100) | YES | | |
| cutsheet_url | TEXT | YES | | |
| cutsheet_name | VARCHAR(255) | YES | | |
| is_non_stock | BOOLEAN | NO | false | |
| non_stock_verified | BOOLEAN | NO | false | |
| non_stock_lead_time | VARCHAR(50) | YES | | |
| status | VARCHAR(30) | NO | 'Pending' | |
| submitted_date | DATE | YES | | |
| confirmed_date | DATE | YES | | |
| notes | TEXT | YES | | |
| created_by | UUID | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

---

## Sales Pipeline Tables

### sales_quotes

Sales quotes with full Praxis integration.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| quote_number | VARCHAR(50) | YES | | Quote reference number |
| customer_id | UUID | YES | | FK to sales_customers.id |
| status | VARCHAR(30) | NO | 'draft' | draft, pending, sent, negotiating, awaiting_po, po_received, won, lost, expired, converted |
| total_price | NUMERIC(12,2) | YES | | |
| won_date | DATE | YES | | |
| assigned_to | UUID | YES | | FK to users.id |
| notes | TEXT | YES | | |
| is_latest_version | BOOLEAN | NO | true | |
| **Praxis Identification** |
| praxis_quote_number | VARCHAR(20) | YES | | |
| praxis_source_factory | VARCHAR(10) | YES | | |
| **Dealer Reference** |
| dealer_id | UUID | YES | | FK to dealers.id |
| dealer_branch | VARCHAR(50) | YES | | |
| dealer_contact_name | VARCHAR(100) | YES | | |
| **Building Specs** |
| building_type | VARCHAR(30) | YES | | CUSTOM, FLEET/STOCK, GOVERNMENT, Business |
| building_width | INTEGER | YES | | |
| building_length | INTEGER | YES | | |
| square_footage | INTEGER | YES | | |
| total_square_footage | INTEGER | YES | | Calculated total |
| unit_count | INTEGER | YES | 1 | Number of units |
| module_count | INTEGER | YES | 1 | |
| stories | INTEGER | YES | 1 | |
| **Compliance** |
| state_tags | TEXT | YES | | |
| climate_zone | INTEGER | YES | | |
| occupancy_type | VARCHAR(10) | YES | | |
| set_type | VARCHAR(30) | YES | | |
| sprinkler_type | VARCHAR(20) | YES | | |
| has_plumbing | BOOLEAN | NO | false | |
| wui_compliant | BOOLEAN | NO | false | |
| **Pipeline Tracking** |
| outlook_percentage | INTEGER | YES | | Sales probability |
| waiting_on | TEXT | YES | | Blocker |
| expected_close_timeframe | VARCHAR(50) | YES | | |
| difficulty_rating | INTEGER | YES | | 1-5 |
| valid_until | DATE | YES | | Quote expiration |
| **PM Flagging** |
| pm_flagged | BOOLEAN | NO | false | |
| pm_flagged_at | TIMESTAMPTZ | YES | | |
| pm_flagged_by | UUID | YES | | FK to users.id |
| pm_flagged_reason | TEXT | YES | | |
| **Conversion** |
| converted_to_project_id | UUID | YES | | FK to projects.id |
| project_id | UUID | YES | | FK to projects.id |
| converted_at | TIMESTAMPTZ | YES | | |
| converted_by | UUID | YES | | FK to users.id |
| **Project Details** |
| project_name | VARCHAR(200) | YES | | |
| project_description | TEXT | YES | | |
| project_location | VARCHAR(255) | YES | | |
| project_city | VARCHAR(100) | YES | | |
| project_state | VARCHAR(2) | YES | | |
| factory | VARCHAR(20) | YES | | Factory code |
| **Timestamps** |
| created_by | UUID | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Indexes:** `idx_sales_quotes_customer`, `idx_sales_quotes_status`, `idx_sales_quotes_assigned`, `idx_sales_quotes_dealer`, `idx_sales_quotes_pm_flagged`, `idx_sales_quotes_outlook`, `idx_sales_quotes_building_type`

---

### sales_customers

CRM customer records for sales.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| company_name | VARCHAR(200) | NO | | (Unique) |
| company_type | VARCHAR(50) | NO | 'general' | general, government, direct, dealer |
| contact_name | VARCHAR(100) | YES | | |
| contact_title | VARCHAR(100) | YES | | |
| contact_email | VARCHAR(255) | YES | | |
| contact_phone | VARCHAR(50) | YES | | |
| address_line1 | VARCHAR(255) | YES | | |
| city | VARCHAR(100) | YES | | |
| state | VARCHAR(2) | YES | | |
| zip_code | VARCHAR(20) | YES | | |
| factory | VARCHAR(20) | YES | | Associated factory |
| notes | TEXT | YES | | |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

---

### dealers

Praxis dealers/distributors who resell Sunbelt products.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| code | VARCHAR(20) | NO | | Short code (PMSI, MMG) (Unique) |
| name | VARCHAR(200) | NO | | Full name |
| branch_code | VARCHAR(50) | YES | | Branch code |
| branch_name | VARCHAR(200) | YES | | Branch name |
| contact_name | VARCHAR(100) | YES | | |
| contact_email | VARCHAR(255) | YES | | |
| contact_phone | VARCHAR(20) | YES | | |
| address | TEXT | YES | | |
| city | VARCHAR(100) | YES | | |
| state | VARCHAR(2) | YES | | |
| zip | VARCHAR(10) | YES | | |
| phone | VARCHAR(20) | YES | | |
| email | VARCHAR(255) | YES | | |
| factory | VARCHAR(10) | YES | | Primary factory |
| is_active | BOOLEAN | NO | true | |
| notes | TEXT | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Unique:** (code, branch_code)

---

## Directory System Tables

### factories

Factory locations with contact information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| code | VARCHAR(20) | NO | | Unique factory code |
| short_name | VARCHAR(100) | YES | | Short display name |
| full_name | VARCHAR(200) | YES | | Full name |
| display_value | VARCHAR(255) | YES | | Dropdown display |
| city | VARCHAR(100) | YES | | |
| state | VARCHAR(2) | YES | | |
| region | VARCHAR(50) | YES | | |
| address_line1 | VARCHAR(255) | YES | | |
| address_line2 | VARCHAR(255) | YES | | |
| zip_code | VARCHAR(20) | YES | | |
| phone | VARCHAR(50) | YES | | |
| fax | VARCHAR(50) | YES | | |
| email_domain | VARCHAR(100) | YES | | |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Factory Codes:** NWBS, WM-EAST, WM-WEST, WM-SOUTH, WM-ROCHESTER, WM-EVERGREEN, MM, SSI, MS, MG, SEMO, PMI, AMTEX, BRIT, CB, IND, MRS, SNB, PRM, SMM, AMT, BUSA, IBI

---

### departments

Department lookup table.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| code | VARCHAR(30) | NO | | Unique code |
| name | VARCHAR(100) | NO | | Display name |
| description | TEXT | YES | | |
| sort_order | INTEGER | NO | 0 | |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | NOW() | |

**Department Codes:** EXECUTIVE, ACCOUNTING, HR, MARKETING, SALES, OPERATIONS, PRODUCTION, PURCHASING, ENGINEERING, DRAFTING, QUALITY, SAFETY, IT, SERVICE

---

### directory_contacts

Internal Sunbelt employees (311 contacts).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| first_name | VARCHAR(100) | NO | | |
| last_name | VARCHAR(100) | NO | | |
| full_name | VARCHAR(200) | GENERATED | | first_name + ' ' + last_name |
| position | VARCHAR(200) | NO | | Job title |
| department_code | VARCHAR(30) | YES | | FK to departments.code |
| factory_code | VARCHAR(20) | YES | | FK to factories.code |
| email | VARCHAR(255) | YES | | |
| phone_main | VARCHAR(50) | YES | | |
| phone_extension | VARCHAR(20) | YES | | |
| phone_direct | VARCHAR(50) | YES | | |
| phone_cell | VARCHAR(50) | YES | | |
| is_active | BOOLEAN | NO | true | |
| deactivated_at | TIMESTAMPTZ | YES | | |
| deactivated_reason | TEXT | YES | | |
| user_id | UUID | YES | | FK to users.id (if has login) |
| notes | TEXT | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Indexes:** `idx_directory_contacts_factory`, `idx_directory_contacts_department`, `idx_directory_contacts_active`, `idx_directory_contacts_name`, `idx_directory_contacts_email`, `idx_directory_contacts_full_name`

---

### external_contacts

External contacts (customers, vendors, architects, etc.).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| company_name | VARCHAR(200) | NO | | |
| company_type | VARCHAR(50) | NO | 'Other' | Customer, Architect, Inspector, Vendor, Dealer, Other |
| first_name | VARCHAR(100) | YES | | |
| last_name | VARCHAR(100) | YES | | |
| full_name | VARCHAR(200) | GENERATED | | |
| position | VARCHAR(200) | YES | | |
| email | VARCHAR(255) | YES | | |
| phone | VARCHAR(50) | YES | | |
| phone_cell | VARCHAR(50) | YES | | |
| address_line1 | VARCHAR(255) | YES | | |
| address_line2 | VARCHAR(255) | YES | | |
| city | VARCHAR(100) | YES | | |
| state | VARCHAR(2) | YES | | |
| zip_code | VARCHAR(20) | YES | | |
| primary_factory_code | VARCHAR(20) | YES | | FK to factories.code |
| has_portal_access | BOOLEAN | NO | false | Future: portal access |
| portal_access_level | VARCHAR(30) | YES | | view_only, respond, full |
| is_active | BOOLEAN | NO | true | |
| notes | TEXT | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

---

### project_external_contacts

Junction table linking external contacts to projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | YES | | FK to projects.id |
| external_contact_id | UUID | YES | | FK to external_contacts.id |
| role | VARCHAR(100) | YES | | Customer Rep, Architect, etc. |
| is_primary | BOOLEAN | NO | false | |
| created_at | TIMESTAMPTZ | NO | NOW() | |

**Unique:** (project_id, external_contact_id)

---

## IT Admin Tables

### system_errors

Captured JavaScript errors from the application.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| error_message | TEXT | YES | | |
| error_stack | TEXT | YES | | |
| component_stack | TEXT | YES | | |
| url | TEXT | YES | | Page URL |
| user_agent | TEXT | YES | | |
| user_id | UUID | YES | | |
| user_role | VARCHAR(30) | YES | | |
| metadata | JSONB | NO | '{}' | |
| created_at | TIMESTAMPTZ | NO | NOW() | |

---

### error_tickets

IT ticket system for tracking errors.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| ticket_number | VARCHAR(20) | YES | | ERR-0001, ERR-0002, etc. |
| title | VARCHAR(255) | NO | | |
| description | TEXT | YES | | |
| status | VARCHAR(30) | NO | 'New' | New, Investigating, In Progress, Resolved, Closed |
| priority | VARCHAR(20) | NO | 'Medium' | Critical, High, Medium, Low |
| system_error_id | UUID | YES | | FK to system_errors.id |
| assigned_to | UUID | YES | | FK to users.id |
| reported_by | UUID | YES | | |
| resolved_at | TIMESTAMPTZ | YES | | |
| resolution_notes | TEXT | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

---

### error_ticket_comments

Comments on error tickets.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| ticket_id | UUID | NO | | FK to error_tickets.id |
| user_id | UUID | YES | | FK to users.id |
| content | TEXT | NO | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |

---

### announcements

System-wide announcements.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| title | VARCHAR(255) | NO | | |
| content | TEXT | YES | | |
| announcement_type | VARCHAR(30) | NO | 'info' | info, warning, critical, maintenance |
| target_roles | TEXT[] | YES | | Target roles or null for all |
| target_factories | TEXT[] | YES | | Target factories or null for all |
| starts_at | TIMESTAMPTZ | YES | | |
| expires_at | TIMESTAMPTZ | YES | | |
| is_dismissible | BOOLEAN | NO | true | |
| is_active | BOOLEAN | NO | true | |
| created_by | UUID | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

---

### announcement_dismissals

Tracks dismissed announcements per user.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| announcement_id | UUID | NO | | FK to announcements.id |
| user_id | UUID | NO | | FK to users.id |
| dismissed_at | TIMESTAMPTZ | NO | NOW() | |

**Unique:** (announcement_id, user_id)

---

### feature_flags

Runtime feature toggles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| flag_key | VARCHAR(100) | NO | | Unique key |
| name | VARCHAR(200) | NO | | Display name |
| description | TEXT | YES | | |
| category | VARCHAR(50) | NO | 'feature' | feature, ui, experimental, maintenance |
| is_enabled | BOOLEAN | NO | false | |
| target_roles | TEXT[] | YES | | |
| target_factories | TEXT[] | YES | | |
| target_users | UUID[] | YES | | |
| metadata | JSONB | NO | '{}' | |
| created_by | UUID | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

---

### feature_flag_audit

Audit log of feature flag changes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| flag_id | UUID | NO | | FK to feature_flags.id |
| changed_by | UUID | YES | | FK to users.id |
| action | VARCHAR(50) | NO | | created, updated, deleted |
| old_value | JSONB | YES | | |
| new_value | JSONB | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |

---

### user_sessions

Tracks user login sessions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| user_id | UUID | NO | | FK to users.id |
| session_token | TEXT | YES | | |
| device_info | TEXT | YES | | |
| ip_address | VARCHAR(50) | YES | | |
| location | TEXT | YES | | |
| last_activity | TIMESTAMPTZ | YES | | |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| expires_at | TIMESTAMPTZ | YES | | |

---

## Supporting Tables

### factory_contacts

Legacy factory contacts table (non-login contacts).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| name | VARCHAR(100) | NO | | |
| email | VARCHAR(255) | YES | | |
| phone | VARCHAR(50) | YES | | |
| role_code | VARCHAR(30) | YES | | Role at factory |
| department | VARCHAR(100) | YES | | |
| factory_code | VARCHAR(20) | YES | | |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | NOW() | |

**Note:** This table is being phased out in favor of `directory_contacts`.

---

### project_documents_checklist

Order processing document checklist per project.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| project_id | UUID | NO | | FK to projects.id |
| document_type | VARCHAR(50) | NO | | Type from standard list |
| custom_name | VARCHAR(200) | YES | | |
| display_order | INTEGER | NO | 0 | |
| is_required | BOOLEAN | NO | true | |
| is_received | BOOLEAN | NO | false | |
| received_date | DATE | YES | | |
| file_path | TEXT | YES | | |
| file_name | VARCHAR(255) | YES | | |
| file_size | INTEGER | YES | | |
| notes | TEXT | YES | | |
| created_at | TIMESTAMPTZ | NO | NOW() | |
| updated_at | TIMESTAMPTZ | NO | NOW() | |

**Document Types:** sales_release, building_order, change_orders, dealer_po, sub_material_bids, bid_specs, floor_plan, bom, internal_calcs, correspondence, extension_sheet, color_selection, long_lead_form, handoff_doc

---

### praxis_import_log

Audit log for Praxis data imports.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| import_type | VARCHAR(30) | NO | | manual_entry, csv_import |
| project_id | UUID | YES | | FK to projects.id |
| praxis_quote_number | VARCHAR(20) | YES | | |
| serial_number | VARCHAR(20) | YES | | |
| source_file_name | VARCHAR(255) | YES | | |
| row_count | INTEGER | YES | | |
| success_count | INTEGER | YES | | |
| error_count | INTEGER | YES | | |
| errors | JSONB | YES | | |
| imported_by | UUID | YES | | FK to users.id |
| imported_at | TIMESTAMPTZ | NO | NOW() | |
| factory | VARCHAR(10) | YES | | |

---

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### Read Access
- Most tables are readable by all authenticated users
- `system_errors`, `error_tickets` restricted to IT/Admin roles

### Write Access
- Users can create/edit records they own or are assigned to
- VP/Director/Admin roles have broader write access
- IT_Manager can assign tickets; IT staff can only update their assigned tickets

### Policy Patterns Used

```sql
-- Example: All authenticated users can read
CREATE POLICY "table_read_all" ON table_name
  FOR SELECT TO authenticated USING (true);

-- Example: Role-based write access
CREATE POLICY "table_write_elevated" ON table_name
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('director', 'vp', 'admin', 'Director', 'VP', 'Admin')
    )
  );

-- Example: Open access (used for most tables)
CREATE POLICY "table_all" ON table_name
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## Triggers

### Project Status Change Logging
```sql
CREATE TRIGGER trigger_log_project_status
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION log_project_status_change();
```

### Task Change Logging
```sql
CREATE TRIGGER trigger_log_task_change
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_change();
```

---

## Migration Files

| File | Description |
|------|-------------|
| `02_FIX_ALL.sql` | Core schema with workflow, logs, floor plan items |
| `20260113_praxis_integration.sql` | Praxis fields for projects, dealers table |
| `20260113_sales_quotes_praxis_fields.sql` | Praxis fields for sales_quotes |
| `20260114_directory_system.sql` | Directory system with departments, contacts |

---

## Notes

1. **UUID Primary Keys**: All tables use UUID primary keys for security and portability
2. **Timestamps**: All tables include `created_at`, most include `updated_at`
3. **Soft Deletes**: Tables use `is_active` boolean instead of hard deletes
4. **Generated Columns**: `full_name` columns are auto-generated from first_name + last_name
5. **Case Sensitivity**: Role values use mixed case (VP, Director, PM, etc.)
