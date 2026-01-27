# Sunbelt PM System - MASTER Presentation Reference Guide

> **Purpose:** Comprehensive quick-reference for presenting to IT Leadership and VP of Operations
> **Audience:** Lead IT Programmer, IT Director, VP of Operations
> **Your Position:** You built this to extend Praxis, not replace it
> **Presentation Date:** January 20, 2026

---

# TABLE OF CONTENTS

## PART 1: QUICK START
1. [30-Second Elevator Pitch](#30-second-elevator-pitch)
2. [Mission Statement](#mission-statement)
3. [The Problem We're Solving](#the-problem-were-solving)
4. [Cost Comparison](#cost-comparison)

## PART 2: GLOSSARY
5. [Complete Glossary of Terms](#complete-glossary-of-terms)

## PART 3: TECHNOLOGY
6. [Technology Stack Explained](#technology-stack-explained)
7. [Why These Technologies (Defense)](#why-these-technologies)
8. [Access vs. This System](#access-database-vs-this-system)

## PART 4: PRAXIS INTEGRATION
9. [Praxis Integration Story](#praxis-integration-story)
10. [Integration Levels (Future Options)](#integration-levels)
11. [Field Mappings](#praxis-field-mappings)

## PART 5: ARCHITECTURE
12. [System Architecture](#system-architecture)
13. [Security Model](#security-model)
14. [Database Schema](#database-schema)

## PART 6: FEATURES
15. [Complete Feature Overview](#complete-feature-overview)
16. [Dashboard Details](#dashboard-details)
17. [Mobile PWA Apps](#mobile-pwa-apps)

## PART 7: ANALYTICS
18. [The Math Behind Analytics](#the-math-behind-analytics)

## PART 8: Q&A BY AUDIENCE
19. [VP of Operations Q&A](#vp-of-operations-qa)
20. [IT Director Q&A](#it-director-qa)
21. [Lead IT Programmer Q&A](#lead-it-programmer-qa)
22. [Skeptical/Challenge Questions](#skeptical-questions-qa)

## PART 9: PRESENTATION AIDS
23. [Demo Script](#demo-script)
24. [Quick Reference Cheat Sheet](#quick-reference-cheat-sheet)
25. [Business Impact & ROI](#business-impact--roi)
26. [Adoption Roadmap](#adoption-roadmap)

---

# PART 1: QUICK START

## 30-SECOND ELEVATOR PITCH

> "This system extends Praxis - it doesn't replace it. Praxis stays the source of truth for quotes and sales. But Praxis was never designed for real-time production tracking across 14 factories, mobile floor apps, or executive dashboards. This system imports from Praxis and adds the visibility layer - PMs can track projects, Plant Managers see live OEE, floor workers update modules from tablets, and leadership sees all 14 factories on one screen. It's built on industry-standard tech that any developer can maintain."

---

## MISSION STATEMENT

**Sunbelt-PM-System** is a unified platform that streamlines modular construction workflows across sales, project management/operations, and production at Sunbelt Modular, integrating shared real-time data and advanced analytics—such as efficiency tracking, personnel metrics, and factory dashboards—to eliminate silos, boost company-wide performance, and enable data-driven insights for trends, forecasting, and continuous improvement.

---

## THE PROBLEM WE'RE SOLVING

| Current State | Impact |
|--------------|--------|
| Praxis handles estimating/accounting only | No visibility into project execution |
| Sales handoffs via email/PDF | Re-entry errors, delayed updates |
| No central project tracking | Missed deadlines, lost information |
| Factory operations are siloed | No real-time production visibility |
| Manual crew tracking | Inefficient labor utilization |
| No quality metrics | Reactive vs. proactive QC |

**Result:** Time wasted, increased delays, limited growth potential across 14 factories.

---

## COST COMPARISON

| Solution | Monthly Cost (100+ users) |
|----------|--------------------------|
| Procore | $5,000 - $15,000/month |
| Monday.com | $2,000 - $5,000/month |
| Asana Business | $1,500 - $4,000/month |
| **Sunbelt PM System** | **~$25-50/month hosting** |

### Hosting Breakdown

| Component | Service | Cost |
|-----------|---------|------|
| Frontend | Vercel/Netlify (static) | Free tier |
| Backend | Supabase Pro | $25/month |
| Storage | Supabase Storage | Included |
| Edge Functions | Supabase Edge | Included |
| **Total** | | **~$25-50/month** |

### Scaling Path

| Users | Recommendation | Est. Cost |
|-------|---------------|-----------|
| 1-50 | Supabase Pro | $25/month |
| 50-100 | Supabase Pro | $50/month |
| 100-200 | Supabase Pro + compute add-on | $75-100/month |
| 200+ | Supabase Enterprise or self-host | Custom |

---

# PART 2: GLOSSARY

## COMPLETE GLOSSARY OF TERMS

### Database & Backend Terms

| Term | What It Is | Plain English |
|------|-----------|---------------|
| **SQL** | Structured Query Language | The language to talk to databases. "SELECT * FROM projects WHERE status = 'active'" = "give me all active projects" |
| **PostgreSQL** | Open-source relational database | Like Excel on steroids - tables with rows and columns, handles millions of records |
| **Supabase** | Platform bundling PostgreSQL + auth + real-time + APIs | Like getting a fully-equipped kitchen instead of buying appliances separately |
| **API** | Application Programming Interface | Like a waiter: takes your order (request), brings it to the kitchen (database), returns with food (data) |
| **REST API** | Standard pattern for APIs using HTTP verbs | GET = read, POST = create, PUT = update, DELETE = remove |
| **Endpoint** | A specific URL the API responds to | `/api/projects` returns project data |
| **Query** | A request to the database | "Give me all projects where PM is John Smith" |
| **Migration** | A versioned change to database structure | Like tracked changes in Word - you can see what changed when |
| **Schema** | The structure/blueprint of your database | Like an architect's blueprint for a building |
| **ODBC** | Open Database Connectivity | A universal connector for databases - lets different systems talk to each other |
| **Edge Function** | Server-side code that runs close to users | Like having a helper at each post office vs. one central location |

### Authentication & Security Terms

| Term | What It Is | Analogy |
|------|-----------|---------|
| **JWT** | JSON Web Token - encrypted ticket proving identity | Like a concert wristband - proves you paid, contains your seat info, hard to fake |
| **Authentication** | Proving who you are (login) | Showing your ID at the door |
| **Authorization** | Proving what you can do (permissions) | Your ID says you're 21, so you can enter the bar |
| **RLS** | Row-Level Security - database rules controlling who sees what | A bouncer at every table checking if you're allowed to see that data |
| **RBAC** | Role-Based Access Control | VP sees everything, PM sees assigned projects, Worker sees their station |
| **Session** | Your active logged-in state | The time between logging in and logging out |
| **bcrypt** | Password hashing algorithm | Scrambles PINs so even database admins can't read them |
| **SOC 2** | Security certification for cloud services | Proof that the company follows strict security practices |

### Frontend & UI Terms

| Term | What It Is | Analogy |
|------|-----------|---------|
| **React** | JavaScript library for building user interfaces | LEGO blocks for websites - build components, snap together |
| **Component** | A reusable piece of UI | A LEGO brick you can use in multiple places |
| **State** | Data that can change and causes UI to update | The "score" in a game - when it changes, the scoreboard updates |
| **Hook** | A React function for features like state | `useState` holds data, `useEffect` runs code when things change |
| **Context** | A way to share data across components | A company-wide announcement vs. telling each person individually |
| **SPA** | Single Page Application | The whole app loads once, then updates without refreshing |
| **Render** | When React draws/updates the UI | Refreshing the screen to show new data |

### Build & Development Terms

| Term | What It Is | Analogy |
|------|-----------|---------|
| **Vite** | Modern build tool compiling code for production | A factory packaging raw ingredients for shipping |
| **Build** | Process of preparing code for production | Compiling, optimizing, bundling all the code |
| **Bundle** | All code packaged into browser-runnable files | Taking 500 source files → 5 optimized files |
| **Hot Reload** | Code changes appear instantly | Seeing paint dry in real-time vs. waiting for the whole room |
| **npm** | Node Package Manager | Like an app store for code libraries |
| **LOC** | Lines of Code | Size measure (~15,000+ in this project) |
| **ESLint** | Code quality checker | Catches common mistakes before they cause problems |

### PWA & Offline Terms

| Term | What It Is | Analogy |
|------|-----------|---------|
| **PWA** | Progressive Web App | A website that works like a native app, even offline |
| **Service Worker** | Background script enabling offline | A personal assistant caching things for you |
| **Cache** | Stored copies for faster access | Keeping files on your desk instead of the filing cabinet |
| **IndexedDB** | Browser-based database for offline storage | A filing cabinet built into your browser |
| **Sync** | Updating local data with server (and vice versa) | Merging your offline changes when you reconnect |
| **Workbox** | Google's library for service workers | Pre-built offline strategies |

### Manufacturing Terms

| Term | What It Is | Formula/Details |
|------|-----------|-----------------|
| **OEE** | Overall Equipment Effectiveness | Availability × Performance × Quality |
| **Takt Time** | Pace to meet demand | Available time ÷ Customer demand |
| **Kaizen** | Japanese for "continuous improvement" | Worker suggestions that save time/money |
| **5S** | Workplace organization method | Sort, Set in order, Shine, Standardize, Sustain |
| **Module** | A prefabricated building section | One piece of a modular building |
| **Station** | Production line location | Framing station, electrical station, QC station |
| **Long-Lead Item** | Materials with extended delivery | Custom windows, specialty HVAC - order early |
| **Rework** | Fixing defects found in QC | Module failed inspection, needs repair |
| **First-Pass Yield** | Modules passing QC on first try | Higher = better quality |

### Project Management Terms

| Term | What It Is | Example |
|------|-----------|---------|
| **RFI** | Request for Information | "Blueprint shows 8' ceilings but spec says 9' - which is correct?" |
| **Submittal** | Documents for approval | "Here's the exact window we plan to install - approve?" |
| **Change Order** | Formal contract modification | Customer wants to add a bathroom - new price, new timeline |
| **PM** | Project Manager | Single point of accountability for project delivery |
| **PC** | Project Coordinator | Factory-level support for PMs |
| **Workflow** | Sequence of process steps | Quote → Project → Production → QC → Ship |

---

# PART 3: TECHNOLOGY

## TECHNOLOGY STACK EXPLAINED

### Executive Technical Summary

| Metric | Value |
|--------|-------|
| **Frontend** | React 18/19 + Vite (SPA) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **Codebase** | ~15,000+ LOC across 100+ components |
| **Database** | 30+ tables with Row Level Security |
| **Hosting Cost** | ~$25-50/month (Supabase Pro) |
| **Security** | RLS, JWT auth, input sanitization |
| **npm audit** | Clean (no known vulnerabilities) |

### The Stack at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + Vite + Lucide Icons + PixiJS (Factory Map)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│         Supabase Auto-generated REST API + Real-time        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│     PostgreSQL + Row-Level Security + Audit Logging         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                            │
│              Supabase Auth (JWT tokens)                      │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Technologies

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks |
| **Vite** | Build tool and dev server |
| **CSS Variables** | Theming (dark mode, Sunbelt Orange #FF6B35) |
| **Lucide React** | Icon library |
| **React Flow** | Workflow visualization |
| **Framer Motion** | Animations |
| **PixiJS v8** | Factory map (WebGL) |
| **SheetJS/ExcelJS** | Excel import/export |
| **PapaParse** | CSV parsing |
| **date-fns** | Date utilities |

### Backend (Supabase)

| Service | Purpose |
|---------|---------|
| **PostgreSQL** | Primary database |
| **Auth** | Email/password + JWT |
| **Storage** | File uploads (floor plans, documents) |
| **Edge Functions** | Server-side logic (Deno) |
| **Realtime** | Live subscriptions (WebSockets) |

### PWA Technologies

| Technology | Purpose |
|------------|---------|
| **Service Worker** | Offline support |
| **Workbox** | Caching strategies |
| **Web App Manifest** | Install capability |
| **IndexedDB** | Local data storage |

---

## WHY THESE TECHNOLOGIES

### "Why React instead of something simpler?"

> "React is what Facebook, Netflix, Airbnb, and most modern companies use. It has the largest ecosystem of pre-built components, the biggest talent pool for hiring, and a 10-year track record. Our components are reusable - the same ProjectCard works on every dashboard. If we need to hire someone to maintain this, finding React developers is easy."

### "Why PostgreSQL instead of sticking with Access?"

> "PostgreSQL is the most advanced open-source database in the world. It's free, handles millions of records, supports thousands of concurrent users, and has enterprise security features built in. Access was designed for single-user desktop apps - it starts corrupting when more than 10-15 people use it simultaneously. We needed 14 factories with hundreds of users."

### "Why Supabase instead of Firebase?"

> "Firebase uses a NoSQL document database. Great for simple apps, but:
> - **No SQL** - complex queries are hard/impossible
> - **No relations** - can't do JOINs
> - **No RLS at row level** - security is more complex
>
> Supabase uses PostgreSQL:
> - **Full SQL** - any query you can imagine
> - **Relations** - proper foreign keys, JOINs
> - **True RLS** - security policies at database level
> - **Open source** - no vendor lock-in"

### "Why not just use SharePoint and Excel?"

> "SharePoint and Excel can't do real-time production tracking, mobile offline apps, role-based row-level security, or OEE calculations. We'd end up with 50 spreadsheets that don't talk to each other, manual data entry everywhere, and no single source of truth. This system automates what would otherwise be hours of manual work."

### "Why a PWA instead of a native mobile app?"

> "A PWA works on any device - iOS, Android, tablets, desktops - with one codebase. No App Store approval delays, no installing updates. Workers open a URL, tap 'Add to Home Screen,' done. It works offline, syncs when connected. Building separate iOS and Android apps would triple development time."

---

## ACCESS DATABASE VS. THIS SYSTEM

### Head-to-Head Comparison

| Capability | Microsoft Access | This System |
|------------|------------------|-------------|
| **Max concurrent users** | 10-15 (then corruption risk) | Thousands |
| **Database size limit** | 2 GB | Unlimited (scales automatically) |
| **Mobile support** | None | Full PWA (works like native app) |
| **Offline capability** | Only if file is local | PWA caches and syncs |
| **Real-time updates** | Manual refresh | WebSocket push (instant) |
| **Multi-location access** | VPN + shared drive | Browser from anywhere |
| **Security granularity** | File-level (all or nothing) | Row-level (user sees only their data) |
| **Audit trail** | Manual/limited | Automatic logging of all changes |
| **Backup/recovery** | Manual file copies | Automatic daily backups, point-in-time recovery |
| **API access** | Complex VBA/ODBC | Built-in REST API |
| **Reporting** | Access Reports (limited) | Custom dashboards, Excel export, PDF |

### When Access is Fine
- Single user or small team (< 10)
- Data entry and simple reports
- No mobile requirement
- No real-time requirement
- Local network only

### When You Need This System
- 14 factories, hundreds of users
- Mobile floor workers with tablets
- Real-time dashboards for leadership
- Role-based security (PM sees their projects, VP sees all)
- Offline capability on factory floor
- Audit trails for compliance
- Complex analytics (OEE, utilization, forecasting)

---

# PART 4: PRAXIS INTEGRATION

## PRAXIS INTEGRATION STORY

### The Key Message

> **"We're not replacing Praxis. We're extending it."**

| Praxis Handles | Sunbelt PM System Handles |
|----------------|---------------------------|
| Estimating | Project execution |
| Accounting | Task/RFI/Submittal tracking |
| Sales quotes | Production management |
| Cost calculations | Crew/attendance |
| Financial tracking | Quality control |

### Why Integration Matters

Praxis is our core for sales estimating (quotes, specs, costs), but as a desktop legacy system, it's isolated—only one user can edit at a time, and sharing relies on emails/PDFs. Sunbelt-PM-System adds modern tracking (workflows, dashboards) but needs Praxis data to shine.

Integration means pulling estimates into the app automatically, like turning a static photo (Praxis export) into a live video (real-time views).

**Benefits:** Cut delays (e.g., 30% faster handoffs), boost accuracy, unlock analytics.

### Current Integration Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    Praxis    │  CSV    │   PM System  │  Real   │  Dashboards  │
│   (Access)   │ ──────► │   Import     │ ──────► │   & PWA      │
│              │ Export  │              │  Time   │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

1. **Sales creates quote in Praxis** (existing workflow - unchanged)
2. **Export quotes as CSV** (built-in Access feature)
3. **Import into PM System** (PraxisQuoteImportModal validates and maps 40+ fields)
4. **Quote becomes visible** in sales pipeline, can convert to project
5. **Project flows through production** with full tracking

---

## INTEGRATION LEVELS

### Level 1: Simple File-Based (Current - DONE)

**How it works:**
- Export from Praxis as CSV/Excel using Access' built-in tools
- Upload via PraxisQuoteImportModal in the app
- PapaParse/SheetJS parsing with ~40 field mappings
- Insert to `sales_quotes` or `projects`

**Pros:**
- Simple and low-cost - no new servers
- No disruption - Praxis unchanged
- Secure offline - files can be encrypted/shared securely

**Cons:**
- Manual steps - human error possible
- Not real-time - delays if exports forgotten
- Maintenance - file formats might change

**Implementation:** Done - 1-2 days

---

### Level 2: API Wrapper (Semi-Automated)

**How it works:**
- Install local Node.js server on company machine
- Use node-adodb/ODBC to query Access DB directly
- Frontend calls API endpoints on demand or via schedule
- API normalizes data and returns JSON for Supabase insert

**Pros:**
- Automation boost - on-demand pulls
- Secure bridge - API adds auth/validation layers
- Flexibility - easy to add scheduled syncs

**Cons:**
- Setup required - IT must install Node/drivers
- Ongoing maintenance - server needs monitoring

**Implementation:** 2-4 days

---

### Level 3: Full Integration (Automated Sync)

**How it works:**
- Upsize Access to local SQL Server Express (free)
- Use Node scripts or Edge Functions to sync data
- Event triggers or cron jobs push/pull data
- Bidirectional for unified updates

**Pros:**
- High automation - near-real-time sync
- Scalability - fixes Access limits (no file locks)
- Data integrity - centralized validation

**Cons:**
- Higher complexity - DB upsizing risks
- More IT involvement needed

**Implementation:** 4-7 days + testing

---

## PRAXIS FIELD MAPPINGS

### What Gets Imported (~40 fields)

| Praxis Field | Database Column | Notes |
|--------------|-----------------|-------|
| Quote Number | praxis_quote_number | Links records between systems |
| Building Length | building_length | Module specifications |
| Building Width | building_width | |
| Material Cost | material_cost | Pricing data |
| Customer Name | client_name | Customer info |
| Dealer | dealer_id (FK) | Matched by dealer code |
| Factory | factory_id (FK) | Source factory |
| Building Type | building_type | CUSTOM, FLEET/STOCK, GOVERNMENT |
| Module Count | module_count | How many modules |
| Stories | stories | 1, 2, or 3 |
| State Tags | state_tags | Installation state(s) |
| Climate Zone | climate_zone | Building requirements |
| Sprinkler Type | sprinkler_type | N/A, Wet, Dry |
| Has Plumbing | has_plumbing | Boolean |
| WUI Compliant | wui_compliant | Wildland Urban Interface |
| Outlook % | outlook_percentage | Sales probability |
| Difficulty | difficulty_rating | 1-5 complexity |

---

# PART 5: ARCHITECTURE

## SYSTEM ARCHITECTURE

### Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Desktop App (React SPA)     │  Floor PWA      │  Manager PWA       │
│  - VP Dashboard              │  - Module Lookup│  - Dashboard       │
│  - Director Dashboard        │  - Station Move │  - Projects        │
│  - PM Dashboard              │  - QC Inspect   │  - Tasks/RFIs      │
│  - Plant Manager Dashboard   │  - Inventory    │  - QC Summary      │
│  - PC Dashboard              │                 │                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Auth (JWT)  │  PostgreSQL + RLS  │  Storage  │  Edge Functions     │
│              │                    │           │                     │
│  - Login     │  - 30+ tables      │  - Floor  │  - PIN Auth         │
│  - Sessions  │  - Row Level       │    plans  │  - Secure updates   │
│  - Roles     │    Security        │  - Docs   │  - Validation       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Praxis Import (CSV/Excel)  │  Future: API Wrapper  │  Webhooks     │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow Example

**User loads PM Dashboard:**

1. Browser requests `PMDashboard` component
2. Component calls `supabase.from('projects').select('*')`
3. Supabase checks JWT token (is user authenticated?)
4. Supabase checks RLS policies (which projects can this user see?)
5. PostgreSQL returns only authorized rows
6. React renders the data
7. WebSocket subscription listens for changes
8. When data changes, UI updates automatically

### Network Requirements

| Requirement | Details |
|-------------|---------|
| **Protocol** | HTTPS (443) |
| **Bandwidth** | Minimal (~50KB per page load) |
| **Latency** | <200ms recommended |
| **Firewall** | Allow *.supabase.co |

---

## SECURITY MODEL

### Three Layers of Security

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: AUTHENTICATION                                         │
│ "Are you who you say you are?"                                  │
│                                                                  │
│ • Desktop App: Email/password via Supabase Auth                 │
│ • Floor PWA: PIN-based via Edge Function (bcrypt)               │
│ • JWT tokens (15-min expiry, auto-refresh)                      │
│ • Token is cryptographically signed (can't be forged)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: ROLE-BASED ACCESS CONTROL (UI)                         │
│ "What menu items and buttons do you see?"                       │
│                                                                  │
│ • VP sees all dashboards, all factories                         │
│ • PM sees assigned projects only                                │
│ • Plant Manager sees production tools                           │
│ • Floor Worker sees PWA only                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: ROW-LEVEL SECURITY (Database)                          │
│ "Even if you bypass the UI, what data can you actually get?"    │
│                                                                  │
│ • Policies written in SQL, enforced by PostgreSQL               │
│ • PC can only SELECT where factory_id = their factory           │
│ • PM can only SELECT where pm_id = their user_id                │
│ • Even a bug in the app can't leak unauthorized data            │
└─────────────────────────────────────────────────────────────────┘
```

### Role Hierarchy

| Role | Access Level |
|------|-------------|
| **VP** | All factories, all data (read), pipeline visibility |
| **Director** | Assigned factories, team projects |
| **PM** | Own projects, factory data |
| **PC** | Factory projects, deadline focus |
| **Plant Manager** | Factory production, crew, modules |
| **Sales Manager** | Team quotes, pipeline |
| **Sales Rep** | Own quotes only |
| **IT Manager** | Admin tools, error logs, feature flags |

### Role Permissions Matrix

| Role | Factories | Projects | Modules | Quotes | Workers | Config |
|------|-----------|----------|---------|--------|---------|--------|
| **VP** | All | All | All | All | All | View |
| **Director** | Assigned | Factory's | Factory's | Factory's | Factory's | View |
| **PM** | All (view) | Assigned | Project's | Flagged | View | None |
| **PC** | Assigned | Factory's | Factory's | Factory's | Factory's | None |
| **Plant_GM** | Assigned | Factory's | Factory's | View | Factory's | Factory |
| **Sales_Mgr** | All (view) | View | None | All | None | None |
| **Sales_Rep** | All (view) | View | None | Own | None | None |
| **IT** | All | All | All | All | All | All |

### Data Protection

| Layer | Implementation |
|-------|---------------|
| **Input Sanitization** | DOMPurify for XSS prevention |
| **SQL Injection** | Parameterized queries (Supabase SDK) |
| **HTTPS** | All traffic encrypted |
| **Storage** | Private buckets, signed URLs |
| **Secrets** | Environment variables only |

### RLS Policy Example

```sql
-- Example: Users see only their factory's data
CREATE POLICY "factory_isolation" ON projects
FOR ALL USING (
  factory_id IN (
    SELECT factory_id FROM users WHERE id = auth.uid()
  )
);

-- Example: Role-based access
CREATE POLICY "pm_update_own_projects" ON projects
FOR UPDATE USING (
  owner_id = auth.uid() OR
  primary_pm_id = auth.uid() OR
  backup_pm_id = auth.uid()
);
```

---

## DATABASE SCHEMA

### Core Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **users** | User accounts | id, email, role, factory_id |
| **factories** | Factory locations | id, name, code, timezone |
| **projects** | Project records | id, name, status, factory_id, owner_id, praxis_quote_number |
| **tasks** | Task tracking | id, project_id, status, priority, assigned_by, due_date |
| **rfis** | RFI management | id, project_id, subject, status, question |
| **submittals** | Submittal tracking | id, project_id, status, spec_section |

### Production Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **modules** | Production modules | id, serial_number, project_id, current_station_id, status |
| **station_templates** | Station definitions | id, factory_id, name, sequence |
| **workers** | Factory workers | id, employee_id, factory_id, is_lead, pin_hash |
| **worker_shifts** | Time tracking | id, worker_id, clock_in, clock_out, break_minutes |
| **qc_records** | QC inspections | id, module_id, station_id, passed, defect_codes |

### Sales Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **sales_quotes** | Quote lifecycle | id, quote_number, status, outlook_percentage |
| **dealers** | Dealer database | id, name, contact_info |
| **praxis_import_log** | Import tracking | id, filename, row_count, status |

### Support Tables

| Table | Purpose |
|-------|---------|
| **floor_plans** | Floor plan files |
| **floor_plan_markers** | Coordinate markers |
| **long_lead_items** | Long lead tracking |
| **workflow_stations** | Project workflow state |
| **announcements** | System announcements |
| **feature_flags** | Feature toggles |

### Entity Relationships

```
                                    ┌──────────────┐
                                    │   dealers    │
                                    └──────┬───────┘
                                           │
┌──────────────┐    ┌──────────────┐       │       ┌──────────────┐
│    users     │    │sales_customers│       │       │  factories   │
└──────┬───────┘    └──────┬───────┘       │       └──────┬───────┘
       │                   │               │              │
       │    ┌──────────────┴───────────────┴──────────────┘
       │    │
       │    ▼
       │  ┌──────────────┐
       │  │ sales_quotes │ ─────► Can convert to project
       │  └──────────────┘
       │
       ▼
┌──────────────┐
│   projects   │
└──────┬───────┘
       │
       ├──────────────────┬──────────────────┬──────────────────┐
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    tasks     │   │     rfis     │   │  submittals  │   │   modules    │
└──────────────┘   └──────────────┘   └──────────────┘   └──────┬───────┘
                                                                │
                                                                ▼
                                                         ┌──────────────┐
                                                         │station_assign│
                                                         └──────┬───────┘
                                                                │
                                                                ▼
                                                         ┌──────────────┐
                                                         │   workers    │
                                                         └──────────────┘
```

### Module Status Lifecycle

```
Not Started ──► In Queue ──► In Progress ──► Completed ──► Staged ──► Shipped
                                   │
                                   ▼
                              QC Hold ──► Rework ──► back to In Progress
```

### Project Status Lifecycle

```
Planning ──► Pre-PM ──► PM Handoff ──► In Progress ──► Warranty ──► Completed
                │                            │
                ▼                            ▼
            Cancelled                    On Hold
```

---

# PART 6: FEATURES

## COMPLETE FEATURE OVERVIEW

### What Is Built: Summary

| Category | Count | Examples |
|----------|-------|----------|
| **Dashboards** | 8 | VP, Director, PM, Plant Manager, PC, Sales Rep, Sales Manager, IT |
| **Mobile Apps** | 2 | Floor App (workers), Manager PWA (supervisors) |
| **Project Features** | 8+ | Workflow, Tasks, RFIs, Submittals, Floor Plans, Calendar |
| **Production Features** | 8+ | Takt Time, Queue Monitor, OEE, Kaizen Board |
| **Crew Features** | 4 | Attendance, Schedule, Utilization, Cross-Training |
| **Analytics** | 5+ | Executive Reports, Quality Metrics, Daily Reports |

---

## DASHBOARD DETAILS

### VP Dashboard - Enterprise View

**Portfolio Metrics:**
- Total portfolio value across all factories
- Active project count and on-time delivery %
- Overdue items requiring attention
- Portfolio health breakdown (On Track / At Risk / Critical)

**Sales Pipeline Visibility:**
- Pipeline value and weighted forecast
- Win rate calculations
- PM-flagged quotes needing attention
- 30/60/90 day forecast buckets

**Strategic Insights:**
- Factory performance comparison
- Top clients by contract value
- Upcoming deliveries (60-day horizon)
- 6-month completion trends

---

### Director Dashboard - Portfolio Command

**Portfolio Health:**
- Health at a glance (On Track / At Risk / Critical)
- All projects with health indicators
- Building type breakdown (Custom, Fleet, Government)

**PM Workload Analysis:**
- Projects per PM with difficulty weighting
- Visual load bars (overloaded/balanced/available)
- Incoming opportunities (95%+ outlook quotes)

**Timeline View:**
- Gantt-style project timeline
- Upcoming deadlines (next 7 days)
- Attention/critical projects highlighted

---

### PM Dashboard - Personal Command Center

**My Work:**
- My active projects, open tasks, open RFIs
- Overdue items (highlighted red)
- Due this week items

**Calendar Integration:**
- Weekly calendar view
- Color-coded by type (tasks, RFIs, submittals, milestones)

**Delivery Tracking:**
- Urgent deliveries (next 14 days)
- 30/60/90 day delivery timeline

---

### Plant Manager Dashboard - Production Control

**9 Functional Tabs:**

| Tab | Purpose |
|-----|---------|
| **Overview** | Stats grid, production preview, real-time widgets |
| **Production** | 12-station production line, module tracking, drag-drop |
| **Calendar** | Production scheduling with simulation mode |
| **Crew** | Attendance, weekly schedule, utilization, cross-training |
| **Quality** | QC stats, pending inspections, pass/fail records |
| **Analytics** | OEE, takt time, queue analysis, kaizen board |
| **Pipeline** | Auto-scheduling tools |
| **Reports** | Daily production report generation |
| **Config** | Plant settings and preferences |

**Production Metrics:**
- Modules: Working / In Queue / Staged / Completed
- Crew present count
- Active projects in factory
- Bottleneck alerts (queue > 3 modules)

**Crew Management:**
- Clock in/out tracking with breaks
- Weekly shift assignments by station
- Utilization heatmaps
- Cross-training matrix (skills/certifications)

---

### PC Dashboard - Factory Operations

**Key Metrics:**
- Factory projects count
- Overdue items (highlighted)
- Due today / due this week counts
- Warning emails sent

**Deadline Management:**
- Upcoming deadlines (15 items, sorted by urgency)
- Click to navigate to project workflow
- Overdue section with red highlighting

---

## MOBILE PWA APPS

### Floor App - Factory Workers

**Target Users:** Production workers, technicians, crew members

| Feature | Description |
|---------|-------------|
| **Module Lookup** | Search/scan modules by serial number, view status and location |
| **Station Move** | Transfer modules between stations with queue position |
| **QC Inspection** | Pass/fail inspections with defect codes |
| **Inventory Receiving** | Goods receipt and location assignment |

**Design:** Dark mode for factory floor, large touch targets, PIN-based login (4-digit)

**Technical:**
- PIN auth via bcrypt Edge Function
- Offline support via Service Worker + IndexedDB
- 8-hour session length (shift-based)

---

### Manager PWA - Supervisors

**Target Users:** Crew leaders, supervisors, factory managers

| Feature | Description |
|---------|-------------|
| **Dashboard** | Quick stats, project list, recent activity feed |
| **Projects** | Filterable project list with status and search |
| **Project Detail** | Tasks, RFIs, submittals, timeline, files, audit log |
| **Tasks** | All tasks with create/edit/complete capability |
| **RFIs** | All RFIs with create/edit capability |
| **QC Summary** | Daily stats, recent inspections, defect trends |

**Design:** Mobile-optimized, offline support, real-time sync indicator

---

# PART 7: ANALYTICS

## THE MATH BEHIND ANALYTICS

### OEE (Overall Equipment Effectiveness)

**The Formula:**
```
OEE = Availability × Performance × Quality
```

**Components:**

| Metric | Formula | Example |
|--------|---------|---------|
| **Availability** | (Run Time) ÷ (Planned Time) | 7.5 hrs ÷ 8 hrs = **93.75%** |
| **Performance** | (Actual Output) ÷ (Theoretical Max) | 18 modules ÷ 20 = **90%** |
| **Quality** | (Good Units) ÷ (Total Units) | 17 good ÷ 18 = **94.4%** |
| **OEE** | 0.9375 × 0.90 × 0.944 | = **79.7%** |

**Benchmarks:**
- **World Class:** ≥85%
- **Good:** 75-84%
- **Acceptable:** 65-74%
- **Poor:** <65%

**Why It Matters:**
- Low Availability → Too much downtime → fix maintenance, reduce changeover
- Low Performance → Running slow → find bottlenecks, training issues
- Low Quality → Too many defects → fix upstream processes

---

### Weighted Pipeline Forecast

**The Formula:**
```
Weighted Value = Quote Value × Close Probability
Pipeline Total = Sum of all Weighted Values
```

**Example:**
| Quote | Value | Probability | Weighted |
|-------|-------|-------------|----------|
| Quote A | $500,000 | 80% | $400,000 |
| Quote B | $750,000 | 30% | $225,000 |
| Quote C | $300,000 | 90% | $270,000 |
| **Total** | $1,550,000 | - | **$895,000** |

The pipeline shows $1.55M but realistically expect ~$895K.

---

### Quote Aging Analysis

| Age | Status | Action |
|-----|--------|--------|
| 0-7 days | Fresh (Green) | Normal follow-up |
| 8-30 days | Active (Yellow) | Check in, maintain momentum |
| 31-60 days | At Risk (Orange) | Escalate, find blockers |
| 60+ days | Critical (Red) | Decision: close or kill |

---

### Crew Utilization

**The Formula:**
```
Utilization % = (Assigned Hours) ÷ (Available Hours) × 100
```

**Heatmap Interpretation:**
- **Green (80-100%):** Optimal utilization
- **Yellow (60-79%):** Underutilized, capacity available
- **Red (>100%):** Overloaded, risk of burnout/delays

---

### Project Health Score

| Indicator | Weight | Green | Yellow | Red |
|-----------|--------|-------|--------|-----|
| Schedule | 30% | On time | 1-2 weeks late | >2 weeks late |
| Budget | 25% | Under/on budget | 1-5% over | >5% over |
| Open RFIs | 20% | 0-2 open | 3-5 open | >5 open |
| Completion | 25% | On track | Slightly behind | Significantly behind |

---

# PART 8: Q&A BY AUDIENCE

## VP OF OPERATIONS Q&A

### Q: "Walk me through what happens when a quote comes in from Praxis and becomes a module on the factory floor."

> **Answer:** "Here's the journey:
> 1. **Sales creates quote in Praxis** - their normal workflow, unchanged
> 2. **Export to CSV** - standard Access export
> 3. **Import to PM System** - validation, field mapping, de-duplication
> 4. **Quote appears in Sales Pipeline** - visible to sales managers, PMs can flag
> 5. **Quote wins → Convert to Project** - one click creates project record
> 6. **PM assigned** - project shows on their dashboard
> 7. **Modules created** - based on building specs (2-story = X modules)
> 8. **Modules scheduled** - assigned to production calendar
> 9. **Production begins** - modules flow through stations
> 10. **QC at each station** - pass/fail checkpoints
> 11. **Completed → Staged → Shipped** - tracked to delivery"

### Q: "You mentioned OEE. Why should I care about a number?"

> **Answer:** "OEE tells you WHERE you're losing money. If OEE is 75%, you're losing 25% of potential output. But the breakdown matters:
> - **Low Availability** = too much downtime → fix maintenance, reduce changeover
> - **Low Performance** = running slow → find bottlenecks, training issues
> - **Low Quality** = too many defects → fix upstream processes
>
> Without OEE, you're guessing. With it, you know exactly what to fix."

### Q: "If I'm sitting in my office and something goes wrong at the Dallas plant, how quickly do I know?"

> **Answer:** "Real-time. WebSocket connections mean when data changes in Dallas, your dashboard updates within seconds. No refreshing, no waiting for a report. You'll see:
> - Module stuck in QC hold
> - OEE dropping below threshold
> - Project falling behind schedule
> - RFIs aging without response"

### Q: "We have 14 factories. How do I compare performance across all of them at a glance?"

> **Answer:** "The VP Dashboard has a factory comparison view - all 14 plants on one screen showing:
> - Current OEE
> - Modules in production
> - Projects by status
> - On-time delivery %
>
> The Factory Map color-codes by performance - green factories are healthy, red need attention."

### Q: "What happens when a PM is overloaded?"

> **Answer:** "The PM workload view shows projects per PM, tasks due this week, open RFIs pending response, and hours estimated vs. capacity. Before a PM drowns, you see the imbalance and can reassign projects."

### Q: "Our sales team says quotes sit too long. Does this help?"

> **Answer:** "Yes - the quote aging analysis shows exactly which quotes are stalling. Color-coded: green (fresh), yellow (active), orange (at risk), red (critical). We track days-in-stage so you can identify bottlenecks."

### Q: "If a module fails QC, what happens?"

> **Answer:** "Module goes into QC Hold status - can't proceed to next station. Defect logged with what failed, photos, severity. Enters rework loop. We track first-pass yield, rework time, and defect trends. This feeds into the Quality component of OEE."

### Q: "What about Kaizen?"

> **Answer:** "Full Kaizen board: anyone can submit improvement ideas, review workflow (Submitted → Approved/Rejected), track estimated savings, record bonus awards. Continuous improvement is now visible and measurable."

---

## IT DIRECTOR Q&A

### Q: "We've invested years in Praxis. Are you asking us to throw that away?"

> **Answer:** "Absolutely not. Praxis stays. Sales keeps their exact workflow - nothing changes for them. This system extends Praxis with capabilities it was never designed for: real-time production tracking, mobile apps, executive dashboards. We import FROM Praxis; we don't replace it."

### Q: "What happens in 3 years when you're not maintaining this?"

> **Answer:** "The technology choices were made specifically for maintainability:
> - **React** - most popular frontend framework, huge talent pool
> - **PostgreSQL** - most popular database, 30 years of stability
> - **Supabase** - open source, can self-host if needed
>
> There's nothing proprietary. Any React developer can pick this up."

### Q: "Our Access database has 8 years of quote history. Can your system see that?"

> **Answer:** "Three options:
> 1. **CSV Import** (available now) - export from Access, import to system
> 2. **Historical Migration** - one-time import of all historical quotes
> 3. **ODBC Connection** (future) - direct read-access to Access tables"

### Q: "Who can see what?"

> **Answer:** "Three layers: Authentication (must log in), Role-based UI (menus filtered by role), Row-level security (database enforces data boundaries). A PC in Atlanta literally cannot query Phoenix data - the database refuses."

### Q: "If an employee leaves, how do we revoke access?"

> **Answer:** "IT Admin marks user as Inactive. Session invalidates immediately. Next API request fails. Locked out within seconds. All audit logs preserved."

### Q: "What certifications does Supabase have?"

> **Answer:** "SOC 2 Type II certification, HIPAA compliance available, data encrypted at rest and in transit, regular security audits. Trusted by thousands of companies."

### Q: "Where does the data physically live?"

> **Answer:** "Supabase data centers are in the US (AWS infrastructure). You can choose the region. Data never leaves the US."

### Q: "What's the disaster recovery plan?"

> **Answer:** "Daily automatic backups (7-day retention on Pro), point-in-time recovery, database exports anytime. For complete outage, PWA continues working offline and syncs when service returns."

### Q: "Can we export all our data if we decide to leave?"

> **Answer:** "Yes. PostgreSQL exports to standard SQL format. All your data, all your schema. No lock-in."

### Q: "How do you handle audit trails?"

> **Answer:** "Login activity (who logged in when), config audit (who changed settings), calendar audit (schedule changes), Supabase logs (all API requests). We can trace any action to user and timestamp."

### Q: "What's the total cost of ownership?"

> **Answer:** "Supabase Pro: $25/month. Hosting: Included. Maintenance: Standard React development. No licensing fees. Compare to: Access corruption recovery, VPN infrastructure, manual reporting labor."

---

## LEAD IT PROGRAMMER Q&A

### Q: "Explain the tech stack. Why these specific technologies?"

> **Answer:**
> - **React 18** - Industry standard, component reusability, huge ecosystem
> - **Vite** - Fastest build tool, instant hot reload
> - **PostgreSQL** - Most advanced open-source database
> - **Supabase** - PostgreSQL + Auth + Real-time + Storage in one
> - **PixiJS** - GPU-accelerated graphics for Factory Map
> - **Lucide** - Icon library, tree-shakeable
>
> Every choice prioritizes: industry standard (hireable), maintainable, performant."

### Q: "How do you handle state management?"

> **Answer:** "React Context API for global state (auth), useState for local. No Redux - intentionally. Architecture:
> - AuthContext - user session, role, factory
> - Component state - form inputs, UI toggles
> - Supabase queries - data lives in database
> - Real-time subscriptions - data stays fresh"

### Q: "Walk me through authentication flow."

> **Answer:**
> 1. User enters email/password in Login.jsx
> 2. `supabase.auth.signInWithPassword()` called
> 3. Supabase validates credentials
> 4. Returns JWT token + user metadata
> 5. Token stored in browser
> 6. AuthContext updates, triggers re-render
> 7. App checks role, renders appropriate dashboard
> 8. Every API request includes JWT in Authorization header
> 9. Supabase validates token + checks RLS policies
> 10. Only authorized data returned"

### Q: "What's your caching strategy?"

> **Answer:** "Multiple layers: Service Worker (PWA caches pages), Supabase (connection pooling), localStorage (preferences), IndexedDB (offline data), React (useMemo/useCallback). PWA cache: API calls use NetworkFirst, static assets use CacheFirst."

### Q: "How does real-time work?"

> **Answer:** "Supabase Real-time uses WebSockets. Client opens connection, subscribes to tables. When ANY client changes that table, Supabase broadcasts. All subscribed clients receive change. React state updates, UI re-renders. No polling. Instant."

### Q: "What's the service layer architecture?"

> **Answer:** "Business logic separated from UI:
> ```
> Component (UI) → Service (logic) → Supabase (data)
> ```
> Example: vpService.js, modulesService.js, efficiencyService.js, qcService.js. Components don't know about Supabase. Clean separation."

### Q: "How do database migrations work?"

> **Answer:** "SQL files in `supabase/migrations/`, named by date (e.g., `20260120_comprehensive_demo_data.sql`). Run in order via Supabase dashboard. Same pattern as Rails/Django migrations."

### Q: "What prevents a Plant Manager in Atlanta from seeing Phoenix's data?"

> **Answer:** "Row-Level Security policy in PostgreSQL:
> ```sql
> CREATE POLICY factory_isolation ON modules
> FOR SELECT
> USING (factory_id = auth.jwt() ->> 'factory_id');
> ```
> The database itself checks: does your JWT's factory_id match this row's factory_id? Even if frontend has a bug, database enforces boundary."

### Q: "Offline - what happens if two people edit the same module offline?"

> **Answer:** "Last-write-wins for most fields. The system is designed for factory floor workers - clock in/out, status updates. For conflict-prone operations, we can add optimistic locking. Current use case doesn't require it."

---

## SKEPTICAL QUESTIONS Q&A

### Q: "This seems overengineered. Why not just use SharePoint and Excel?"

> **Answer:** "SharePoint and Excel can't do real-time production tracking, mobile offline apps, row-level security, or OEE calculations. We'd end up with 50 spreadsheets, manual entry everywhere, no single source of truth. This consolidates everything."

### Q: "We tried a custom system 5 years ago and it failed. Why is this different?"

> **Answer:** "Custom systems usually fail because: proprietary tech (no one can maintain), tried to replace everything at once, no mobile, poor UX. This is different: standard tech (React + PostgreSQL), extends not replaces (Praxis stays), PWA mobile, modern UX."

### Q: "Our workers aren't tech-savvy. Will they actually use this?"

> **Answer:** "The PWA is designed for simplicity: enter employee ID and 4-digit PIN, see only relevant info, big buttons (Clock In, Clock Out, Update Status). It's simpler than their phone."

### Q: "What's the learning curve?"

> **Answer:**
> - Floor workers: 5 minutes
> - PMs: 1-2 hours
> - Plant Managers: Half day
> - Executives: Immediate (dashboards are self-explanatory)"

### Q: "What happens if internet goes down at a factory for a whole day?"

> **Answer:** "PWA continues working: workers clock in/out (stored locally), module status updates (queued locally), view cached data. When internet returns, queued changes sync automatically."

### Q: "How do you handle 50 workers all clocking in at 6 AM?"

> **Answer:** "Supabase connection pooling handles concurrent requests. PostgreSQL is designed for high concurrency. Clock-in is a single insert. 50 concurrent requests is nothing - we could handle 500."

### Q: "Can this scale to 50 factories? 100?"

> **Answer:** "Yes. PostgreSQL handles massive scale (Instagram runs on it). Supabase auto-scales. Architecture is stateless frontend, connection pooling, RLS-optimized queries. Same architecture, more rows."

---

# PART 9: PRESENTATION AIDS

## DEMO SCRIPT

### Opening (2 minutes)
1. Show login screen with factory logos
2. Log in as VP
3. "This is what a VP sees first thing Monday morning"

### VP Dashboard (3 minutes)
1. Factory Map - "All 14 plants at a glance"
2. KPI Cards - "Key metrics without clicking anything"
3. Click a factory - "Drill into any location"
4. Sales Pipeline - "Quote aging, what needs attention"

### Production Tracking (3 minutes)
1. Switch to Plant Manager view
2. Production Board - "Modules at each station"
3. Click a module - "Full history, QC results, crew"
4. OEE Calculator - "Live efficiency calculation"

### PWA Demo (2 minutes)
1. Open on tablet/phone (or resize browser)
2. Show worker login (PIN)
3. Clock In
4. Update module status
5. "Works offline - try airplane mode"

### Project Management (2 minutes)
1. Switch to PM view
2. Show assigned projects
3. Open RFI list
4. Show floor plan with markers
5. "Pin RFIs to exact locations"

### Praxis Integration (2 minutes)
1. Show import modal
2. "CSV from Praxis, validates and maps 40+ fields"
3. Show imported quote in pipeline
4. "Convert to project with one click"

### Closing
"Questions?"

---

## QUICK REFERENCE CHEAT SHEET

### Numbers to Know

| Metric | Value |
|--------|-------|
| Factories supported | 14 (scalable to 100+) |
| User roles | 10 |
| Database tables | 30+ |
| Lines of code | 15,000+ |
| Components | 100+ |
| Services | 11 |
| Dashboard types | 8 |
| Import fields from Praxis | 40+ |
| Monthly hosting cost | ~$25-50 |

### Key URLs

| Location | URL |
|----------|-----|
| Main app | `/` |
| Worker PWA | `/pwa/` |
| Manager PWA | `/pwa/manager/` |

### Key Files (if asked)

| Purpose | File |
|---------|------|
| Main routing | `src/App.jsx` |
| VP Dashboard | `src/components/dashboards/VPDashboard.jsx` |
| OEE Calculation | `src/services/efficiencyService.js` |
| Praxis Import | `src/utils/praxisImport.js` |
| Auth Context | `src/context/AuthContext.jsx` |
| Module Service | `src/services/modulesService.js` |

### Repository Structure

```
sunbelt-pm-system-v1/
├── src/
│   ├── components/
│   │   ├── auth/           # Login, signup
│   │   ├── dashboards/     # Role dashboards (8)
│   │   ├── production/     # Production components (20+)
│   │   ├── projects/       # Project management
│   │   ├── sales/          # Sales/quotes
│   │   └── ...
│   ├── context/            # React contexts
│   ├── hooks/              # Custom hooks
│   ├── pwa/                # PWA applications
│   ├── services/           # API services (11)
│   └── utils/              # Utilities
├── supabase/
│   ├── migrations/         # Database migrations
│   ├── functions/          # Edge Functions
│   └── demo/               # Demo data scripts
└── docs/                   # Documentation
```

### Emergency Phrases

- "That's a great question - let me show you in the code"
- "The architecture supports that - it would be a future enhancement"
- "We specifically designed for that scenario"
- "That's exactly why we chose PostgreSQL over Access"
- "The security model prevents that at the database level"
- "We're not replacing Praxis, we're extending it"

---

## BUSINESS IMPACT & ROI

### Efficiency Gains

| Area | Current | With System | Improvement |
|------|---------|-------------|-------------|
| Sales-to-PM Handoff | 2-4 hours | 5 minutes | 95% faster |
| Status Updates | Manual calls/emails | Real-time dashboard | Instant visibility |
| Crew Tracking | Paper timesheets | Digital clock in/out | Accurate labor data |
| QC Documentation | Paper checklists | Digital with photos | Audit-ready records |

### Projected Benefits

- **20-30% reduction** in project cycle time
- **15% improvement** in on-time delivery
- **Elimination** of duplicate data entry
- **Real-time** visibility across all 14 factories
- **Data-driven** decision making

### Cost Savings

| Item | Annual Savings |
|------|---------------|
| Avoided SaaS licensing | $24,000 - $60,000 |
| Reduced re-entry labor | $15,000 - $30,000 |
| Fewer delays/expediting | $50,000 - $100,000 |
| **Total Potential** | **$89,000 - $190,000** |

---

## ADOPTION ROADMAP

### Phase 1: Demo & Buy-In (This Week)
- Presentation with live demo
- Real data showcase
- Q&A and feedback collection

### Phase 2: Pilot (Q1 2026)
- Deploy to 1-2 factories
- Train key users (1-hour sessions per role)
- Measure time savings and gather feedback
- Refine based on real usage

### Phase 3: Rollout (Q2 2026)
- Company-wide deployment
- Full training program
- Praxis integration enhancements
- Mobile app expansion

### Phase 4: Enhancement (Q3+ 2026)
- AI-powered insights
- Advanced analytics
- Third-party integrations
- Continuous improvement

---

## IT COLLABORATION OPPORTUNITIES

### Immediate (Post-Demo)

| Item | Description |
|------|-------------|
| **Code Review** | Access to GitHub repo for security audit |
| **Pilot Setup** | Configure for 1 factory |
| **User Provisioning** | Create initial user accounts |
| **Network Access** | Whitelist Supabase endpoints |

### Short-Term

| Item | Description |
|------|-------------|
| **SSO Integration** | SAML/OAuth with corporate identity |
| **Monitoring** | Add to existing monitoring stack |
| **Backup Strategy** | Configure database backup retention |

### Long-Term

| Item | Description |
|------|-------------|
| **Praxis API** | Build ODBC wrapper for automated sync |
| **On-Prem Option** | Evaluate self-hosted Supabase |
| **Mobile MDM** | PWA deployment via MDM |

---

## CONTACT & RESOURCES

| Resource | Location |
|----------|----------|
| **GitHub Repo** | [To be shared with IT] |
| **Demo Environment** | [Deployed URL] |
| **Documentation** | /docs folder in repo |
| **Technical Contact** | Matthew McDaniel (matthew.mcdaniel@sunbeltmodular.com) |

---

*Sunbelt PM System V1 - Technical Presentation Master Guide*
*Built with React + Supabase*
*Sunbelt Orange: #FF6B35*
