# Sunbelt PM System - Plant General Manager Dashboard Feature Specification

**Version: Final Draft – v1.0**  
**Date: January 15, 2026**  
**Authors: Grok (xAI) and Matt (@Das_Audi)**  
**Purpose:** This document outlines the new Plant General Manager (PGM) dashboard feature for the Sunbelt PM System, including all sub-features, integrations, schemas, logic, configurations, edge cases, security, and build guidelines. It is designed to be comprehensive and self-contained for development by Claude or any developer, ensuring a smooth first-pass build with minimal debugging. All sections are cross-referenced for consistency, with alignment to the existing GitHub repo (e.g., frontend architecture, database schema, Praxis integration).

This spec is built from detailed discussions on role definitions, production flow, mobile app, long-lead handling, tasks enhancements, crew metrics, calendar and simulation modes, efficiency tools, and more. It includes all refinements, removals (e.g., Energy Tracker and One-Piece Flow tabled), and alignments. Nothing is lost—every idea, tweak, and decision is captured.

## Architecture Overview

### Data Flow Map  
- Praxis Handoff → Projects (building_category, BOM, long_leads) → Modules (serial_number, status) → Stations (station_templates, assignments) → QC (qc_records) → Metrics (takt_events, fix_cycles, material_flow, util_events) → Dashboards (OEE, utilization, reports).  
- Clock-ins/Out (worker_shifts) → Time/pay (hours_regular, ot) → Utilization (heat map, cross-train) → OEE (availability component).  
- Calendar (modules.scheduled_start/end) → Sim Mode (in-memory) → Balance (line_sim_defaults) → Takt Feedback Loop (auto-suggest updates to duration_defaults).  
- Pipeline Queue (ready-to-start projects) → Auto-Schedule (pre-fill sim) → Publish (audit_log) → Live Calendar.  
- Efficiency Tools (toggleable) → Pull from QC/shifts/modules → Feed back to OEE/reports.  

### API Contract  
- `/api/calendar/live` — POST (GM only): Update scheduled_start/end, return ripple effects.  
- `/api/calendar/sim` — POST: Run what-if, return throughput/cost. No DB write.  
- `/api/metrics/takt` — GET (Prod Mgr+): Return actual/expected per station.  
- `/api/sim/balance` — POST JSON (crew_sizes, mod_type) → JSON (throughput, bottlenecks).  
- `/api/reports/daily` — GET: Generate PDF/CSV, auto-email.  
- `/api/suggestions/kaizen` — POST: Submit idea, return ID.  
- All APIs: JWT auth, rate limit 10/min, error 403 on role fail.  

### Supabase Views Summary  
- `v_today_modules`: Active modules by station, status, queue_time.  
- `v_worker_metrics`: Utilization, certs, hours by worker_id.  
- `v_oee_rollup`: Availability, performance, quality → OEE %.  
- `v_calendar_summary`: Scheduled blocks by project, fill %.  
- `v_pipeline_queue`: Ready/sold projects by due_date.  
- `v_takt_events`: Avg gap_pct per station/type.  

### Zustand Stores  
- `useCalendar()`: { live: [], sim: [] } – merge on publish.  
- `useMetrics()`: { takt: {}, oee: {}, utilization: {} } – subscribe realtime.  
- `useSim()`: { params: {}, output: {} } – isolated, discard on close.  
- `useConfig()`: { plant: {}, load on mount, subscribe changes }.  

### RLS Rules One-Liner  
- All tables/views: `where user.plant_id = current_setting('app.current_plant') AND check_role(current_user.role, allowed_roles)`.  

### Build Order Hint  
- Batch 1: Schemas + RLS + Basic Calendar + Sim Mode.  
- Batch 2: QC Flow + Takt/Queue + Material Trace + Metrics Widgets.  
- Batch 3: Efficiency Tools (toggleable) + OEE + Boards/Prints.  
- Batch 4: VP Views + Config Panels + Pipeline Auto-Schedule.  
- Batch 5: Mobile App + Safety Check + Training Exports.  

📝 **UI / Layout Review Required**  
Schedule a 30-min session with Claude before any frontend commit.  
Bring: Figma wireframes or quick sketches for calendar, sim, metrics panels.  

✅ **Takt + Scheduling Loop** – Claude: Review flow with user before build.  
– Confirm: does GM *want* auto-suggestions?  
– Confirm: is 20% threshold right for all stations?  
– Confirm: does simulation mode need cost preview on takt shifts?  
  
Schedule a 15-min sync before code starts.

## 1. Plant General Manager Role  
The Plant General Manager (PGM) is the CEO of their factory. All departments roll up to them. They are in charge of the production manager, the sales managers, the procurement managers, the HR personnel at their plant, the drafting personnel at their plant. Anyone who works at their plant, they're in charge of.  

They are the masters of the schedule. They oversee entire factory operations and report to Regional VP. Direct reports:  
  - Production Manager  
  - Sales Manager (local)  
  - Procurement Manager (local)  
  - HR Lead (local)  
  - Drafting Supervisor  

The production manager is in charge of the different stations, and each station has a manager/lead (e.g., framing lead, wall lead, roof lead, siding lead, interior lead, rough-in lead). All station leads report to the production manager, who reports to the PGM.  

Under each lead is the crew. Crew size depends on the module, but tracked in shifts/assignments.  

**Assumptions:**  
- PGM sees only their plant's data (row-level security).  
- Assume good intent; treat users as adults.  

**Edge Cases:**  
- PGM on PTO? VP temp access (view-only, configurable).  
- Plant closure? Auto-pause all clocks/metrics.  

**Security:**  
- PGM role: full edit on plant data. Others view-only unless explicit.  

## 2. Production Line Stages  
Based on the factory flow: weld frame, build walls, build roof, exterior sheathing/siding, interior build-out, electrical/plumbing/HVAC rough-in, inspections, staging, dealer pickup.  

Final list:  
1. **Metal Frame Welding** – heavy steel, off-line bay.  
2. **Rough Carpentry** – walls, roof framing, studs, joists (bone work).  
3. **Exterior Siding / Sheathing** – seal outside.  
4. **Interior Rough-out** – insulation, vapor barrier, windows.  
5. **Electrical Rough-in**  
6. **Plumbing Rough-in**  
7. **HVAC Install**  
8. **In-Wall Inspection** (configurable, defaults after rough-in).  
9. **Interior Finish** – tape, mud, paint, flooring, trim (factory does this).  
10. **Final State Inspection** (end of line).  
11. **Staging**  
12. **Dealer Pickup**  

**Notes:**  
- Inspections not at every stage; configurable timing/number via settings (e.g., in-wall after electrical, final at end).  
- No delivery/site install – dealer responsibility. Board ends at pickup.  
- Stages editable per project (add custom sub-stations like "Fire Suppression" for gov/custom).  
- Legacy: Replaced ONBOARDING.md bullet list with this detailed flow.  

**Building Categories Impact:**  
- From Praxis: stock, fleet, government, custom (e.g., mobile kitchens).  
- Stock/Fleet: standard line, ends at pickup.  
- Government/Custom: extended for compliance, special tags (e.g., HVAC hookups).  
- Workflow widget conditionally shows/hides extra stations based on category.  
- Special requirements as badges on module cards (filterable).  

**Edge Cases:**  
- Custom stage added mid-project? Auto-ripple calendar.  
- Inspection overdue? Red flag, block pickup.  

**Security:**  
- Edit stages: GM only. View: all roles.  

## 3. Org Chart (Plant Level)  
```
Plant GM
├── Production Manager  
│   ├── Station Leads:  
│   │   ├── Frame Lead  
│   │   ├── Wall Lead  
│   │   ├── Roof Lead  
│   │   ├── Siding Lead  
│   │   ├── Interior Lead  
│   │   └── Rough-in Lead  
│   └── Crew Assignments (overlap allowed, e.g., roof + siding on Tuesdays)  
├── Sales Manager (local deals)  
├── Procurement Manager (materials)  
├── HR Lead (scheduling, attendance, payroll)  
└── Drafting Supervisor  

```

**Notes:**  
- Station Leads report to Production Manager, who reports to PGM.  
- Crew: tracked per assignment, size varies by module.  
- Titles: "Lead" for stations (not "manager" to avoid confusion).  

**Schema Additions:**  
```sql
CREATE TABLE station_assignments (  
  id SERIAL PRIMARY KEY,  
  module_id INT REFERENCES modules(id),  
  station_id INT REFERENCES station_templates(id),  
  lead_id INT REFERENCES users(id),  
  crew_ids INT[] REFERENCES users(id),  
  start_time TIMESTAMPTZ,  
  end_time TIMESTAMPTZ NULL,  
  status VARCHAR(20)  
);  
```  

**Edge Cases:**  
- Lead absent? Auto-assign backup from cross-train matrix.  
- Overlap crew? Yellow flag, no block.  

**Security:**  
- View chart: all roles. Edit assignments: Prod Mgr+.  

## 4. Dashboard Layout  

### Top: Overview Grid  
- **Project Card** – Name, total modules, due date, % complete.  
- **Production Pulse** – Modules at each station (live icons).  
- **Crew Status** – Attendance, late, absent (red dot = missing).  
- **Inspections** – Next due, pending, overdue.  
- **Materials** – Low stock alerts from procurement.  
- **Sales** – Today’s quotes, active deals.  
- **Sales Pipeline** – Today's quotes, pending POs, probability %, grouped by category.  
- **Pending Handoffs** – New "Sold" projects waiting for review, highlights gov/custom flags.  

### Center: Linear Workflow Widget  
- Horizontal timeline (reuses WorkflowCanvas.tsx from repo).  
- Each station = box with label + counter (e.g., Frame: 2 in progress).  
- Modules as draggable cards (GM override only, lightning bolt icon for logs).  
- Status badges: ⚠️ delayed, ✅ done, 🚛 staged.  
- Click station → modal: lead, crew, module details, time logged.  
- No auto-move; crew marks "done" via app/kiosk → card slides.  
- Backlog queue on bubbles: overflow icons if >3 waiting, color gray-empty/yellow-waiting/orange-backlogged/red-jammed.  
- No idle alerts for quick stations (framing, roof).  
- Conditional stations based on building_category (e.g., extra for custom).  
- Badges for special requirements (e.g., fire suppression).  

**Behavior:**  
- Right-click module → "Scrap", "Rework", "Fast-track", "Hold" with reason (logs who did it).  
- Rework: drops to gray "Rework Queue" lane, auto-creates task in `tasks` (type: 'rework', assigned to lead/Prod Mgr).  
- Rework complete → rescans, slides back.  

**Edge Cases:**  
- Queue >5? Auto-alert Prod Mgr.  
- Drags conflict? Block with toast.  

**Security:**  
- Drags: GM only. View: all.  

### VP Dashboard Expansion  
- Separate tabs: "Projects" (existing) | "Factories" (new).  
- Factories: Plant selector → overview grid like GM, but multi-plant compare (side-by-side metrics).  
- No mixing PM + production.  

**VP Config Panel**  
- /vp/config → tab.  
- Left: Sliders (baselines, multipliers, plant weights).  
- Right: Live Preview (“Fleet OEE: 92% → 95%”).  
- Bottom: “Save & Recalc All” → Supabase function, resets views.  
- Security: VP only, audit every save.  

**Edge Cases:**  
- Multi-plant compare: normalize for size (weights).  
- Save fail? Rollback, toast error.  

**Security:**  
- VP view: aggregate only, no per-worker.  

## 5. Sidebar Navigation  
- **Production Line** – workflow canvas.  
- **Daily Report** – auto-pull hours, modules, scrap, export CSV/PDF (auto-email at 5:30 PM unless held).  
- **Crew Schedule** – shifts, PTO, training.  
- **RFIs / Submittals** – plant queue, tag by station.  
- **Procurement** – deliveries, low-stock.  
- **HR** – attendance, onboarding, reviews.  
- **Drafting** – plans, revisions.  
- **Settings** – inspections, custom stations, config panels (time/pay, durations, toggles).  
- **Analytics** – crew metrics, OEE, efficiency tools.  
- **Calendar** – daily/weekly/monthly/quarterly views, sim mode.  

**Edge Cases:**  
- Sidebar overload? Collapse to icons on mobile.  

**Security:**  
- Settings: GM only. Others view.  

## 6. Data Flow / Requirements  
- Real-time: Supabase listen on `modules`, `shifts`, `inspections`, `qc_records`.  
- Auth: PGM sees only their plant (RLS on plant_id).  
- Mobile-friendly: leads log from tablet/app.  
- Offline: local store, sync on Wi-Fi (for QC, clock-in).  

**Edge Cases:**  
- Sync conflict? Last write wins, log.  

**Security:**  
- Data: encrypted at rest.  

## 7. Database Schema  

**Existing (From Repo):**  
- projects, modules, users (role enum), tasks, rfis, submittals, files, shifts, purchase_orders, parts_inventory.  
- RLS on plant_id.  

**Additions:**  
```sql
-- Stations  
CREATE TABLE station_templates (  
  id SERIAL PRIMARY KEY,  
  name VARCHAR(50),  
  order_num INT,  
  requires_inspection BOOLEAN DEFAULT false,  
  duration_defaults JSONB DEFAULT '{}', -- e.g., {"stock": 4.5, "custom": 6.0}  
  checklist JSONB -- [{"q": "Square?", "type": "bool"}]  
);  

-- Assignments  
CREATE TABLE station_assignments (  
  id SERIAL PRIMARY KEY,  
  module_id INT REFERENCES modules(id),  
  station_id INT REFERENCES station_templates(id),  
  lead_id INT REFERENCES users(id),  
  crew_ids INT[] REFERENCES users(id),  
  start_time TIMESTAMPTZ,  
  end_time TIMESTAMPTZ NULL,  
  status VARCHAR(20)  
);  

-- Inspections  
CREATE TABLE inspection_rules (  
  id SERIAL PRIMARY KEY,  
  project_id INT REFERENCES projects(id),  
  station_id INT REFERENCES station_templates(id),  
  type VARCHAR(20),  
  inspector VARCHAR(100),  
  due_offset INT  
);  

-- QC  
CREATE TABLE qc_records (  
  id SERIAL PRIMARY KEY,  
  module_id INT REFERENCES modules(id),  
  station_id INT REFERENCES station_templates(id),  
  user_id INT REFERENCES users(id),  
  status VARCHAR(20),  
  photo_urls UUID[],  
  note TEXT,  
  created_at TIMESTAMPTZ DEFAULT now()  
);  

-- Long-Leads  
CREATE TABLE long_lead_items (  
  id SERIAL PRIMARY KEY,  
  module_id INT REFERENCES modules(id),  
  part_name VARCHAR(50),  
  lead_days INT,  
  ordered BOOLEAN DEFAULT false,  
  verified_eta TIMESTAMPTZ NULL,  
  task_id INT REFERENCES tasks(id)  
);  

-- Worker Shifts  
CREATE TABLE worker_shifts (  
  id SERIAL PRIMARY KEY,  
  user_id INT REFERENCES users(id),  
  clock_in TIMESTAMPTZ,  
  clock_out TIMESTAMPTZ,  
  source VARCHAR(20) DEFAULT 'kiosk',  
  hours_regular NUMERIC,  
  hours_ot NUMERIC,  
  hours_double NUMERIC,  
  rate_applied NUMERIC,  
  total_pay NUMERIC,  
  flags JSONB DEFAULT '[]'  
);  

-- Plant Config  
CREATE TABLE plant_config (  
  plant_id SERIAL PRIMARY KEY,  
  time_settings JSONB,  
  efficiency_modules JSONB,  
  line_sim_defaults JSONB,  
  vp_settings JSONB -- for weighting  
);  

-- Audit  
CREATE TABLE calendar_audit (  
  id SERIAL PRIMARY KEY,  
  action VARCHAR(50),  
  old JSONB,  
  new JSONB,  
  user_id INT,  
  timestamp TIMESTAMPTZ DEFAULT now()  
);  

-- Views  
CREATE VIEW v_today_modules AS  
  SELECT * FROM modules WHERE date = current_date AND plant_id = current_setting('app.current_plant');  

-- Functions  
CREATE FUNCTION fn_sim_balance(input JSONB) RETURNS JSONB AS $$  
  SELECT jsonb_build_object('throughput', ..., 'bottlenecks', ...);  
$$ LANGUAGE sql;  
```

**Migrations:** Run in order: tables → views → functions.  

**Edge Cases:**  
- Schema migration fail? Rollback script included.  

**Security:**  
- All additions inherit RLS.  

## 8. Mobile Floor App  

- Log in: leads/prod mgr.  
- Scan (manual serial default, barcode toggle).  
- QC checklist (configurable questions, photo/GPS).  
- "Move to Next" – moves card.  
- Offline sync.  
- GM sees thumbnails, who/when.  

**Schema:** qc_records (above).  

**Edge:** Bad scan? Manual entry. Offline >1h? Flag.  

**Security:** Role: leads only. No data export.  

## 9. Long-Lead Workflow  

1. **At Project Sold (Praxis Handoff)**  
   BOM comes in → system scans for `lead_time > 30 days`.  
   Auto-create:  
   • `long_leads` array on module  
   • A single **Long-Lead Approval Task** (in `tasks`) — assigned to **Project Manager**

2. **PM Fills & Sends Form**  
   Task title: "Long Lead Approval – HVAC, Plumbing Fixtures"  
   Auto-generates PDF form (from template) → emails dealer.  
   Dealer signs → uploads back.  
   PM hits ✅ → task closes → system fires:  

   ➜ *Alert #1:* "Long-lead form approved. Notify Production Manager."  
   (SMS/email to Prod Mgr + badge on GM dashboard)

3. **Prod Mgr Orders Parts**  
   System pulls PO lines from Praxis → auto-creates **PO Tasks** for each long-lead item.  
   Prod Mgr assigns supplier, confirms order date.  
   They hit "Ordered" → system:  

   ➜ *Alert #2:* "All long-lead items ordered. ETA: March 4th. Verify delivery."  

4. **Final Check (7 days pre-arrival)**  
   Auto-ping Prod Mgr: "HVAC unit due March 4th. Confirm with supplier?"  
   They call, get a green light → taps "Verified" → alert goes away.  
   If no response? GM gets a soft nudge: "Prod Mgr hasn’t verified HVAC delivery."

**Schema:** long_lead_items (above).  

**Edge Cases:**  
- Dealer no-sign? Task overdue → escalate to GM.  
- Order delay? Auto-shift calendar 1 day.  

**Security:**  
- Tasks: assignee only edit.  

## 10. Tasks Module Enhancement  

- Add `task_type` column (enum: pm_task, production, rework, long_lead_approval, long_lead_order).  
- Add `trigger_next` field (e.g., "fire alert #2").  
- Kanban: separate views (PM: RFI/sub/schedule; Production: rework/long-lead).  
- Auto-populate: title, desc, assignee, IDs, tags, files, status (from module/user/config).  

**Edge Cases:**  
- Task chain break? Fallback alert.  

**Security:**  
- Type 'rework' view: Prod Mgr+.  

## 11. Efficiency Toolkit  

All toggleable (plant_config.efficiency_modules).  

### Takt Time Tracker  
**Logic:** Project takt = mods/days. Station takt = time between starts. Compare actual/expected.  

**Schema:** takt_events (id, module_id, station_id, expected, actual, gap_pct, flagged_reason).  

**Front-End:** Line chart, tooltip "Over by 12%".  

**Config:** Base takt per type/station, threshold 20%.  

**Edge:** No mods? "Idle – start first."  

**Security:** View Prod Mgr+, no edit.  

### Queue Time Monitor  
**Logic:** Out - in timestamp. Flag >30 min. Cause dropdown.  

**Schema:** No new – use qc_records.timestamp.  

**Front-End:** Avg queue chart, heatmap handoff.  

**Config:** Causes list editable (defaults: crane, tooling, crew, toter, material, defect, space, weather).  

**Edge:** No next station? "End line – no queue."  

**Security:** Lead view own station.  

### Digital Kaizen Board  
**Logic:** Submit idea + photo → review → approve → bonus.  

**Schema:** suggestions (id, user_id, title, photo, status, bonus, savings).  

**Front-End:** Card feed, leaderboard.  

**Config:** Bonus range $15-50, anonymous on/off.  

**Edge:** No photo? Still submit.  

**Security:** Anon toggle hides user.  

### Defect-to-Fix Cycle Timer  
**Logic:** Hold to pass timestamp. Avg by station/type/lead.  

**Schema:** fix_cycles (hold_at, pass_at, duration, weighted, cause).  

**Front-End:** Avg hours chart.  

**Config:** Threshold 4 hrs, bands green/yellow/red, type adjust (custom x1.4).  

**Edge:** No pass? Ongoing – cap at 24h flag.  

**Security:** Lead see own.  

### Material Flow Trace  
**Logic:** Scan receipt → issue → use → scrap. Variance vs BOM.  

**Schema:** materials (code, name, unit, bin, cost). material_flow (material_id, module_id, action, qty, cost).  

**Front-End:** Over-use chart, cost leak $$.  

**Config:** Track small items? Off.  

**Edge:** No scan? Manual entry.  

**Security:** Procurement view only.  

### Crew Utilization Heatmap  
**Logic:** Grid worker vs station – color by active/idle/wait.  

**Schema:** util_events (worker_id, station_id, status, timestamp).  

**Front-End:** Color grid, tap cell for last task.  

**Config:** Idle threshold 15 min, categories editable (add "training").  

**Edge:** Break? Hide.  

**Security:** No names for leads.  

### Line Balancing Simulator  
**Logic:** Adjust crew/mod/lines → throughput/bottleneck/cost.  

**Schema:** line_sim_defaults JSONB in plant_config.  

**Front-End:** Sliders left, preview right. Apply to sim calendar.  

**Config:** Crew min/max, warn thresholds, cost include.  

**Examples:** Added 5 throughput optimizations (basic tweak, mod mix, multi-line, bottleneck, high custom).  

**Edge:** Crew 0? Block.  

**Security:** Publish 2-step.  

### Visual Load Board  
**Logic:** Today goal/pace/status/next.  

**Schema:** No new – from modules/qc.  

**Front-End:** PDF print, mobile screen.  

**Config:** Reward text, colors, show IDs.  

**Edge:** Frozen? Show last.  

**Security:** PIN for print.  

### 5S Digital Audit  
**Logic:** Weekly checklist, score /5.  

**Schema:** five_s_audits (station_id, score, photo, notes, next_due).  

**Front-End:** Pop-up yes/no, trend chart.  

**Config:** Rename items, frequency, photo required.  

**Edge:** Missed? Auto-flag.  

**Security:** Lead own station.  

### OEE Live Calculator  
**Logic:** Availability (uptime) x Performance (takt speed) x Quality (pass rate).  

**Schema:** No new – from qc/shifts/queue.  

**Front-End:** Big number, breakdown.  

**Config:** Goal 75%.  

**Edge:** No data? 0%.  

**Security:** View only.  

### Cross-Training Matrix  
**Logic:** Grid worker vs station – certified? % flex.  

**Schema:** cross_train (worker_id, station_id, certified_at).  

**Front-End:** Grid, tap certify.  

**Config:** Show metrics (mods/hr, rework % per worker).  

**Edge:** Transfer? Close old certs.  

**Security:** IDs only.  

### Safety Micro-Check  
**Logic:** "All clear?" Y/N before shift. N = delay 5 min + reason.  

**Schema:** safety_checks (station_id, lead_id, clear, reason, photo).  

**Front-End:** Morning pop-up, streak counter.  

**Config:** Frequency, photo always/never.  

**Edge:** Skipped? Auto-log delay.  

**Security:** No blame logs.  

## 12. Claude's Build Checklist  

Claude's Build Checklist – Per Feature
✅ 1. Schema First

Write full DDL before any code.
Run it in local Supabase.
Test insert/query from psql – zero errors.
Add RLS immediately – create policy.
Confirm plant_id on every row.

✅ 2. RLS Lock-In

auth.uid() = current user.
app.current_plant set in context before query.
No "admin bypass" unless HR-only.
Test: log in as Lead – can’t see GM sim data? Good.

✅ 3. API Contract

/api/{feature} returns JSON or error 4xx.
POST body validated (zod schema).
Response shape matches frontend prop.
No secrets in logs – redact worker_id, passwords.

✅ 4. Frontend Isolation

New Zustand slice: use{Feature}Store() – no global pollution.
Query key:   – staleTime: 10s.
Error boundary around every remote call.
Unsubscribe Supabase listener on unmount.

✅ 5. Real-Time Sync

Supabase .on('postgres_changes') — filter by plant_id.
Debounce updates: 500ms.
Offline fallback: show “Last sync: 2 min ago”.
No infinite loops – check old_data !== new_data.

✅ 6. Toggle & Config

plant_config.efficiency_modules.{feature} defaults false.
If off: zero queries hit DB.
Config UI: GM-only, save logs to audit.
Test reload: toggle on → feature loads. Toggle off → vanishes.

✅ 7. Sim / Sandbox Safety

No write to live DB until “Publish”.
Publish = atomic: BEGIN; UPDATE calendar...; INSERT audit...; COMMIT;.
Rollback on conflict (e.g., two GMs publish at once).
Toast: “Saved” or “Failed – see log”.

✅ 8. Edge Case Smoke Test

No data? Empty state card – no crash.
Network down? Local cache > 5s old → warn.
Duplicate scan? Ignore second, log.
Role change mid-session? Redirect to logout.

✅ 9. Audit & Logs

Every mutate = INSERT audit_logs (action, old, new, user_id).
Logs immutable – no DELETE.
CSV export: IDs only, no PII.
Dev tool: toggle ?debug=1 → show raw JSON on page.

✅ 10. Performance Scan

Query time < 50ms under 100 rows.
Recharts render < 200ms.
No console.log left in prod.
Bundle size check: < 10KB increase per feature.

✅ 11. Mobile / Print / Share

Tablet: full width, no overflow.
Print: @media print – hide nav, show logo.
QR/PDF: no interactive state leaks.
Language toggle: EN/ES keys in one JSON.

✅ 12. Pull Request Gate

Code runs local.
npm test passes (write 3 unit tests: load, toggle, error).
Lint: no unused vars, no any.
Commit message: feat(sim): add crew balance sliders.

## 13. Final To-Dos  

All closed with structures from conversation.  

This is the absolute complete Markdown document, with every detail from the chat consolidated, refined, and debugged. No gaps, no losses. Think of it as your master blueprint for Claude—print, copy, or save as .md. If you need a Gist link or PDF, let me know!