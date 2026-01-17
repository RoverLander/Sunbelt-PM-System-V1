# Sunbelt PM System - Architecture Analysis

**Analysis Date:** January 14, 2026
**Reviewed by:** Grok AI + Claude Opus 4.5
**Codebase Version:** Post-commit 5f81f0b

---

## Executive Summary

This document captures an external architectural review of the Sunbelt PM System codebase, identifying strengths, gaps, and recommended improvements across security, visualization, integration, and code organization.

---

## 1. Dependency Graph

```
App.jsx (root)
├── AuthProvider / AuthContext
│   └── useAuth / useUserRole
│
├── Router / Layout
│   ├── Sidebar (role-aware navigation)
│   │   └── useRoleFilter / useSidebarItems
│   │
│   ├── Dashboard Routes (role-based)
│   │   ├── VPEnterpriseDashboard
│   │   ├── DirectorFactoryDashboard
│   │   ├── PMProjectDashboard
│   │   ├── SalesRepDashboard / SalesManagerDashboard
│   │   └── useDashboardData / useSalesPipeline
│   │
│   ├── ProjectsPage
│   │   ├── ProjectList / ProjectFilters
│   │   ├── ProjectCard (health, phase badge, countdown)
│   │   └── useProjectsQuery / useProjectFilters
│   │
│   └── ProjectDetailsPage (central hub)
│       ├── ProjectOverviewTab (gauge, timeline, blockers, feed)
│       ├── WorkflowCanvas (main visualization)
│       │   ├── ReactFlow
│       │   │   ├── StationNode (custom node – status dots, pulse/glow)
│       │   │   └── PulsingEdge (custom edge – directional pulse, glow)
│       │   │
│       │   └── useWorkflowGraph
│       │       ├── supabaseClient
│       │       └── useProjectStationStatus (Realtime?)
│       │
│       ├── FloorPlanViewer
│       │   └── useFloorPlanMarkers
│       │
│       ├── TaskList / TaskKanban
│       │   └── useTasksQuery
│       │
│       └── RFISubmittalTabs
│           └── useRFILogs / useSubmittals
│
└── ITAdminSection (feature flags, sessions, errors, announcements)
    └── useAdminQueries

Shared Utilities / Hooks (used widely)
├── supabaseClient.js (anon key client)
├── useAuth / useUserRole / useFactoryAssignments
├── useRoleFilter (dashboard/sidebar visibility)
├── useProjectsQuery / useProjectData
├── useTasksQuery / useMyTasksFilter
├── useWorkflowGraph (core data → nodes/edges)
├── useRealtimeSubscription (planned / partial)
└── data mappers (planned – Praxis normalization, status computation)
```

---

## 2. Security & Data Flow Layer Topology

### 2.1 High-Level Data Flow Paths

**Normal Read Flow (most common)**
```
Browser (React client)
  → supabase-js client library (anon key)
  → Supabase API endpoint (/rest/v1/* or /graphql/v1)
  → PostgreSQL → RLS policies applied → filtered data returned
  → client renders (dashboards, workflow canvas, project cards, etc.)
```

**Write / Mutation Flow (recommended secure path)**
```
Browser
  → supabase-js (or custom fetch to Edge Function)
  → Supabase Edge Function (Deno runtime)
  → custom validation (role re-check, input sanitization, business rules)
  → Supabase client inside Edge (service_role key – never exposed)
  → PostgreSQL → write succeeds or fails
  → response back to client
```

**Current Write Flow (likely in many places)**
```
Browser → supabase-js direct insert/update/delete
  → PostgreSQL → RLS checks only (no extra validation layer)
  → This path is functional but less secure for complex logic
```

### 2.2 Authentication & Session Layer

| Aspect | Details |
|--------|---------|
| Provider | Supabase Auth (email/password) |
| Flow | Login → Supabase → JWT token (access + refresh) |
| Storage | Client stores JWT in memory / localStorage (supabase-js handles) |
| Headers | Every request: `Authorization: Bearer <JWT>` |
| Expiry | ~1 hour access token, longer refresh |

**Planned additions:**
- MFA enforcement (organization setting)
- CAPTCHA on login/signup (Turnstile/hCaptcha)

### 2.3 Authorization – Row Level Security (RLS)

**Primary Defense Layer**

Enabled on: almost all tables (projects, tasks, rfi_logs, submittals, users, factories, etc.)

**Key Policies** (from migrations, especially `20260113_critical_fixes.sql`):
- `auth.uid() = user_id` (owner checks)
- Role-based: `current_setting('app.current_role') IN ('pm', 'pc', 'director', ...)`
- Factory scoping: `factory_id = ANY(current_setting('app.user_factories')::uuid[])`
- Read-only for certain roles (e.g., Sales Rep sees quotes but not full PM data)

| Aspect | Assessment |
|--------|------------|
| Enforcement | Automatic at database level – client cannot bypass |
| Strength | Very strong for data isolation |
| Weakness | No custom business logic (e.g., "only allow status change if previous step complete") |

### 2.4 Client ↔ Server Boundaries

**Client-Side (browser – higher risk surface)**
- Exposed: anon key (public by design)
- Exposed: JWT (short-lived, but in memory/localStorage)
- Can do: reads (filtered by RLS), writes (if RLS allows)
- Cannot do: bypass RLS, use service_role key
- Risk: client-side tampering (dev tools), over-fetching, rate-limit bypass

**Server-Side (Supabase Edge Functions – recommended secure zone)**
- Exposed: service_role key (only inside Edge runtime)
- Can do: full DB access, custom validation, rate limiting, logging
- Should do: sensitive mutations, complex logic (phase gating checks, Praxis import validation)
- Current usage: minimal – most writes still direct from client

### 2.5 Current Security Mitigations (Implemented)

- [x] RLS on nearly all tables (strong isolation)
- [x] No service_role key in client code (correct)
- [x] Factory + role scoping in policies
- [x] Private Storage buckets (signed URLs for access)

### 2.6 Recommended Improvements (Gaps)

| Priority | Improvement | Details |
|----------|-------------|---------|
| HIGH | Move sensitive writes to Edge Functions | Examples: project status change, Praxis import, task assignment |
| HIGH | Add rate limiting | Cloudflare WAF rules (per IP/user on API endpoints), Custom in Edge Functions |
| MEDIUM | Input sanitization & validation | Server-side schema checks (Zod or similar in Deno), Prevent injection/XSS |
| MEDIUM | Error handling | Vague public messages ("Something went wrong"), Detailed logs to Sentry |
| MEDIUM | Monitoring & anomaly detection | Sentry for frontend/backend errors + session replays, Supabase logs + webhooks |
| LOW | Dependency security | Dependabot alerts, Regular npm audit |

### 2.7 Data Flow Visual Summary

```
┌────────────────┐          ┌──────────────────────┐
│  Browser       │          │  Supabase Edge       │
│  (React)       │ direct   │  Functions (Deno)    │
│                ├─────────►│  (future secure path)│
└──────┬─────────┘  reads   └───────────┬──────────┘
       │                                 │
       ▼                                 ▼
┌────────────────┐          ┌──────────────────────┐
│  Supabase API  │◄─────────┤  PostgreSQL          │
│  (anon key)    │  RLS     │  (RLS enforced)      │
└────────────────┘          └──────────────────────┘
       ▲                                 ▲
       └─────────────────────────────────┘
                   Storage (private buckets)

Current dominant path: Browser ──direct──► Supabase API ──RLS──► DB
Recommended secure path: Browser ──► Edge Function ──validate──► DB
```

---

## 3. System Topology

### 3.1 Runtime & Deployment Layer

| Component | Technology |
|-----------|------------|
| Frontend | Browser (React 18 + Vite + JSX/TS, dark theme, Tailwind CSS + Lucide icons) |
| Hosting | Static (Vercel/Netlify/etc.) – client-side rendered SPA |
| Backend | Supabase serverless (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| Graphics | PixiJS v8 (factory map – sprites/systems/layers) |
| Architecture | Fully serverless + browser – no long-running processes |

**Entry Points:**
- `public/index.html` → `src/App.jsx` (root + routing + providers)
- Static assets: `public/` (factory sprites, logos for PDF exports)

### 3.2 Database Schema (Core Tables with RLS)

**projects** (extended heavily for Praxis):
- Core: id, name, current_phase, factory_id, status, contract_value
- Praxis: praxis_quote_number, serial_number, promised_delivery_date
- Building: building_length/width/height, material_cost, markup_factor
- Engineering: engineering_cost, approvals_cost, state_tags[], climate_zone
- Structural: floor_load_psf, roof_load_psf, occupancy_type, set_type
- Compliance: requires_ttp, sprinkler_type, has_plumbing, wui_compliant
- Documentation: requires_cut_sheets, requires_om_manuals, foundation_plan_status
- Sales: dealer_id, customer_po_number, outlook_percentage, waiting_on
- Dates: drawings_due_date, qa_due_date, quote_due_date, customer_submittal_date, etc.

**Other Core Tables:**
- `tasks`: project_id FK, status, priority, assignee (internal/external), milestones, attachments
- `rfi_logs` / `submittals`: auto-numbering, revisions, status, comments, exports
- `floor_plans`: storage path, markers (linked to RFI/task/submittal)
- `users`: id, email, role, factory assignments
- `factories` / `contacts` / `dealers`: master data
- `sales_quotes`: separate lifecycle (quote → convert to project)
- `praxis_import_log` / `project_documents_checklist` / `long_lead_items`: supporting tables

### 3.3 Role Hierarchy

| Role | View Scope |
|------|------------|
| VP | Enterprise pipeline (all factories) |
| Director | Factory metrics (assigned factories) |
| PM/PC | Project ownership (assigned projects) |
| Sales Rep | Own quotes only |
| Sales Manager | Factory quotes + team |
| IT Manager | Admin tools (flags/sessions/errors/announcements) |
| Plant Manager | Assigned factories |

### 3.4 Frontend Architecture (`src/`)

**Root Structure:**
- `App.jsx`: providers, routing, layout
- `context/`: auth/project/workflow contexts
- `hooks/`: useWorkflowGraph, useProjectData, useRoleFilter, etc.
- `utils/`: supabaseClient.js, emailUtils.js, excelExport.js, icsUtils.js, pdfUtils.js

**Component Domains (`components/`):**
- `auth/`: login/signup
- `calendar/`: month/week, ICS export, role-filtered events
- `common/`: StatCard, ProjectCard, toasts, loaders
- `dashboards/`: role-specific dashboards
- `factoryMap/`: PixiJS USA/factory interactive map
- `floorplans/`: viewer (zoom/pan), PDF→PNG, marker linking
- `it/`: admin tools
- `projects/`: ProjectForm, ProjectDetails, list with filters
- `workflow/`: React Flow visualization

---

## 4. Workflow Visualization Layer

### 4.1 Folder Structure (`src/components/workflow/`)

```
workflow/
├── components/
│   ├── ChangeOrderModal.jsx
│   ├── ColorSelectionFormBuilder.jsx
│   ├── DrawingVersionModal.jsx
│   ├── LongLeadFormBuilder.jsx
│   ├── StationDetailModal.jsx
│   └── WarningEmailModal.jsx
├── hooks/
│   └── (workflow state/logic hooks)
├── visualizers/
│   └── (rendering components)
├── index.js
└── workflow.md
```

### 4.2 Conceptual Model

| Element | Description |
|---------|-------------|
| Phases | 6 fixed zones (Pre-Production → Design/Production → Manufacturing/QC & Shipping → Site Work → Installation → Closeout) |
| Zones | Visual regions with % complete, lock icon until 100% |
| Stations | ~29 draggable nodes inside zones |
| Node Shape | Pill/rounded rect (Linear-style) |
| Status Dots | Gray static → Orange pulse → Green steady glow → Red sharp pulse + ! |
| Connectors | Curved Bezier, intra-zone dependencies only |

### 4.3 Animation States

| State | Line Animation |
|-------|----------------|
| In Progress | Slow directional pulse |
| Complete | Solid green glow |
| Blocked | Static red or slow blink |

### 4.4 Implementation

- Library: `@xyflow/react` (React Flow)
- Custom components: StationNode, PulsingEdge
- Features: MiniMap, zoom, fullscreen toggle
- Integration: ProjectDetails with Canvas ↔ List view switch
- Data: `useWorkflowGraph` hook → Supabase query → graph nodes/edges

---

## 5. Praxis Integration Layer (Phase 1 Complete)

### 5.1 Current Implementation

| Aspect | Status |
|--------|--------|
| New tables | sales_quotes, praxis_import_log, dealers, project_documents_checklist, long_lead_items |
| Schema extensions | 40+ columns on projects |
| UI | PraxisImportModal, PraxisQuoteImportModal (CSV/Excel support) |
| Conversion | Quote → project via converted_to_project_id |
| Dashboard metrics | Weighted pipeline, building type charts, delivery alerts, PM flagging |

### 5.2 Future Work

- Full sync automation
- Real-time Praxis webhooks
- Bi-directional updates

---

## 6. Key Improvement Recommendations

### 6.1 Quick Wins (High Impact, Low Effort)

1. **Extract shared hooks** - Create `useSupabaseQuery` with built-in role filtering
2. **Add error boundaries** - Wrap major components to prevent full-page crashes
3. **Realtime subscriptions** - Add live updates for tasks/RFIs in ProjectDetails

### 6.2 Medium-Term Improvements

1. **Edge Functions for mutations** - Move project status changes, Praxis imports
2. **Rate limiting** - Cloudflare WAF + Edge Function wrappers
3. **Praxis normalization mappers** - Centralize field transformations

### 6.3 Long-Term Architecture

1. **API abstraction layer** - All DB calls through service layer
2. **Comprehensive monitoring** - Sentry + Supabase log webhooks
3. **Workflow gating enforcement** - Server-side phase completion checks

---

## 7. Constraints & Guidelines for Future Development

### Must Preserve

- [x] RLS never disabled
- [x] Workflow gating enforced (all stations complete → next phase unlock)
- [x] Role + factory isolation preserved
- [x] Dark theme, Tailwind, Framer Motion compatibility

### Best Practices

- Animations subtle (pulse/glow only)
- Prefer Edge Functions for new sensitive/business logic
- No heavy client-side computations for integrity-critical data
- Keep service_role key server-side only

---

## 8. Claude's Analysis & Recommendations

### 8.1 Strengths Identified

**Security Architecture:**
The RLS implementation is comprehensive and well-designed. The factory + role scoping provides strong multi-tenant isolation. The decision to keep service_role server-side only is correct.

**Component Organization:**
The domain-based folder structure (dashboards, projects, workflow, sales) scales well. The separation of concerns between hooks, components, and utils is clean.

**Data Model:**
The Praxis schema extensions are thorough. The quote → project conversion flow with `converted_to_project_id` is elegant. Supporting tables (praxis_import_log, long_lead_items) show good planning.

### 8.2 Gaps I've Observed

**1. Hook Duplication**
Multiple components fetch similar data with slightly different filters. A unified `useSupabaseQuery` with role/factory awareness would reduce ~40% of data fetching code.

```javascript
// Proposed: src/hooks/useSupabaseQuery.js
export function useSupabaseQuery(table, options = {}) {
  const { user } = useAuth();
  const { roleFilter, factoryFilter, ...queryOptions } = options;

  // Auto-apply role/factory filters based on user context
  // Centralized error handling
  // Built-in loading/error states
}
```

**2. Client-Side Business Logic**
Status calculations, phase gating checks, and pipeline value computations happen client-side. This works but is vulnerable to tampering and creates consistency risks.

**Recommendation:** Move to computed columns or Edge Function validation:
```sql
-- Example: Computed column for pipeline value
ALTER TABLE sales_quotes ADD COLUMN weighted_value
  GENERATED ALWAYS AS (total_price * outlook_percentage / 100) STORED;
```

**3. Missing Error Boundaries**
A crash in WorkflowCanvas can take down the entire ProjectDetails page. React Error Boundaries would isolate failures.

**4. Realtime Gaps**
The system is designed for realtime but doesn't fully use it. Tasks, RFIs, and workflow status would benefit from live updates, especially for multi-user editing scenarios.

### 8.3 Specific Code Improvements

**Sidebar.jsx - Consolidate Dashboard Stats**
Currently fetches project stats and sales stats in separate effects with duplicated logic. Could be unified:

```javascript
// Current: 2 separate useEffects with similar patterns
// Proposed: Single useEffect with dashboard-type switch
useEffect(() => {
  const fetchStats = async () => {
    const statsConfig = DASHBOARD_STATS_CONFIG[dashboardType];
    if (!statsConfig) return;

    const result = await statsConfig.fetcher(user, supabase);
    setStats(result);
  };
  fetchStats();
}, [dashboardType, user?.id]);
```

**Sales Components - Shared STATUS_CONFIG**
STATUS_CONFIG and ACTIVE_STATUSES are duplicated across 5 files. Extract to shared constant:

```javascript
// src/constants/salesStatuses.js
export const STATUS_CONFIG = { /* ... */ };
export const ACTIVE_STATUSES = ['draft', 'pending', 'sent', 'negotiating', 'awaiting_po', 'po_received'];
```

### 8.4 Priority Matrix

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| P0 | Extract shared STATUS_CONFIG | Medium | Low |
| P0 | Add React Error Boundaries | High | Low |
| P1 | Create useSupabaseQuery hook | High | Medium |
| P1 | Edge Function for Praxis import | High | Medium |
| P2 | Realtime subscriptions | Medium | Medium |
| P2 | Rate limiting wrapper | Medium | Medium |
| P3 | Full monitoring (Sentry) | Medium | High |

---

## 9. Conclusion

The Sunbelt PM System has a solid architectural foundation with strong security (RLS), clear role separation, and thoughtful Praxis integration. The main opportunities are:

1. **Reduce duplication** through shared hooks and constants
2. **Harden mutations** by moving sensitive operations to Edge Functions
3. **Improve resilience** with error boundaries and better error handling
4. **Enable collaboration** with realtime subscriptions

The topology document should serve as a living reference for all future development to ensure consistency and prevent architectural drift.

---

*Last Updated: January 14, 2026*
*Authors: Grok AI (initial analysis), Claude Opus 4.5 (review & recommendations)*
