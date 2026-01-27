# Sunbelt PM System - Technical Presentation Reference Guide

> **Purpose:** Quick-reference guide for presenting the system to IT Leadership and VP of Operations
> **Audience:** Lead IT Programmer, IT Director, VP of Operations
> **Your Position:** You built this to extend Praxis, not replace it

---

## TABLE OF CONTENTS

1. [30-Second Elevator Pitch](#30-second-elevator-pitch)
2. [Glossary of Terms](#glossary-of-terms)
3. [Technology Stack Explained](#technology-stack-explained)
4. [Why These Technologies (Defense)](#why-these-technologies)
5. [Access vs. This System](#access-database-vs-this-system)
6. [Praxis Integration Story](#praxis-integration-story)
7. [Architecture Overview](#architecture-overview)
8. [Security Model](#security-model)
9. [Database Design](#database-design)
10. [Key Features Explained](#key-features-explained)
11. [The Math (OEE, Analytics)](#the-math-behind-analytics)
12. [VP of Operations - Q&A](#vp-of-operations-qa)
13. [IT Director - Q&A](#it-director-qa)
14. [Lead IT Programmer - Q&A](#lead-it-programmer-qa)
15. [Skeptical Questions - Q&A](#skeptical-questions-qa)
16. [Demo Script](#demo-script)

---

## 30-SECOND ELEVATOR PITCH

> "This system extends Praxis - it doesn't replace it. Praxis stays the source of truth for quotes and sales. But Praxis was never designed for real-time production tracking across 14 factories, mobile floor apps, or executive dashboards. This system imports from Praxis and adds the visibility layer - PMs can track projects, Plant Managers see live OEE, floor workers update modules from tablets, and leadership sees all 14 factories on one screen. It's built on industry-standard tech that any developer can maintain."

---

## GLOSSARY OF TERMS

### Database & Backend Terms

| Term | What It Is | Analogy |
|------|-----------|---------|
| **SQL** | Structured Query Language - the language used to talk to databases | Like English for databases. "SELECT * FROM projects WHERE status = 'active'" means "give me all active projects" |
| **PostgreSQL** | An open-source relational database (free, enterprise-grade) | Like Excel on steroids - tables with rows and columns, but can handle millions of records and complex relationships |
| **Supabase** | A platform that bundles PostgreSQL + authentication + real-time + APIs | Like getting a fully-equipped kitchen instead of buying appliances separately |
| **API** | Application Programming Interface - how the frontend talks to the backend | Like a waiter: takes your order (request), brings it to the kitchen (database), returns with food (data) |
| **REST API** | A standard pattern for APIs using HTTP verbs (GET, POST, PUT, DELETE) | GET = read, POST = create, PUT = update, DELETE = remove |
| **Endpoint** | A specific URL that the API responds to | `/api/projects` is an endpoint that returns project data |
| **Query** | A request to the database for specific data | "Give me all projects where PM is John Smith" |
| **Migration** | A versioned change to database structure | Like tracked changes in Word - you can see what changed and when |
| **Schema** | The structure/blueprint of your database (tables, columns, relationships) | Like an architect's blueprint for a building |

### Authentication & Security Terms

| Term | What It Is | Analogy |
|------|-----------|---------|
| **JWT** | JSON Web Token - an encrypted "ticket" proving who you are | Like a concert wristband - proves you paid, contains your seat info, hard to fake |
| **Authentication** | Proving who you are (login) | Showing your ID at the door |
| **Authorization** | Proving what you can do (permissions) | Your ID says you're 21, so you can enter the bar area |
| **RLS** | Row-Level Security - database rules controlling who sees which rows | A bouncer at every table checking if you're allowed to see that data |
| **RBAC** | Role-Based Access Control - permissions based on your role | VP sees everything, PM sees assigned projects, Floor Worker sees their station |
| **Session** | Your active logged-in state | The time between logging in and logging out |
| **OAuth** | Letting users log in with Google/Microsoft/etc. | "Sign in with Google" buttons |

### Frontend & UI Terms

| Term | What It Is | Analogy |
|------|-----------|---------|
| **React** | A JavaScript library for building user interfaces | LEGO blocks for websites - build components, snap them together |
| **Component** | A reusable piece of UI (button, card, modal) | A LEGO brick you can use in multiple places |
| **State** | Data that can change and causes UI to update | The "score" in a game - when it changes, the scoreboard updates |
| **Hook** | A React function that lets components use features like state | `useState` holds data, `useEffect` runs code when things change |
| **Context** | A way to share data across components without passing it manually | A company-wide announcement vs. telling each person individually |
| **Props** | Data passed from parent component to child | Handing a document to someone - they can read it but not change the original |
| **Render** | When React draws/updates the UI | Refreshing the screen to show new data |

### Build & Development Terms

| Term | What It Is | Analogy |
|------|-----------|---------|
| **Vite** | A modern build tool that compiles code for production | A factory that takes raw ingredients and packages them for shipping |
| **Build** | The process of preparing code for production | Compiling, optimizing, bundling all the code |
| **Bundle** | All your code packaged into files the browser can run | Taking 500 source files and creating 5 optimized files |
| **Hot Reload** | Code changes appear instantly without full page refresh | Seeing paint dry in real-time vs. waiting for the whole room |
| **npm** | Node Package Manager - installs code libraries | Like an app store for code libraries |
| **Dependency** | External code your app relies on | React is a dependency - your app needs it to run |

### PWA & Offline Terms

| Term | What It Is | Analogy |
|------|-----------|---------|
| **PWA** | Progressive Web App - a website that works like a native app | A website that can be "installed" and works offline |
| **Service Worker** | Background script that enables offline functionality | A personal assistant that caches things for you |
| **Cache** | Stored copies of data/pages for faster access | Keeping frequently-used files on your desk instead of the filing cabinet |
| **IndexedDB** | Browser-based database for offline storage | A filing cabinet built into your browser |
| **Sync** | Updating local data with server data (and vice versa) | Merging your offline changes when you reconnect |

### Manufacturing Terms

| Term | What It Is | Formula/Details |
|------|-----------|-----------------|
| **OEE** | Overall Equipment Effectiveness - manufacturing efficiency metric | Availability × Performance × Quality |
| **Takt Time** | The pace at which products must be completed to meet demand | Available time ÷ Customer demand |
| **Kaizen** | Japanese for "continuous improvement" - small incremental changes | Worker suggestions that save time/money |
| **5S** | Workplace organization method | Sort, Set in order, Shine, Standardize, Sustain |
| **Module** | A prefabricated building section | One piece of a modular building |
| **Station** | A production line location where work happens | Framing station, electrical station, QC station |
| **Long-Lead Item** | Materials with extended delivery times | Custom windows, specialty HVAC - order early |
| **Rework** | Fixing defects found in QC | Module failed inspection, needs repair |

### Project Management Terms

| Term | What It Is | Details |
|------|-----------|---------|
| **RFI** | Request for Information - question needing answer before work continues | "The blueprint shows 8' ceilings but spec says 9' - which is correct?" |
| **Submittal** | Documents submitted for approval (shop drawings, product data) | "Here's the exact window we plan to install - approve?" |
| **Change Order** | Formal modification to the original contract/scope | Customer wants to add a bathroom - new price, new timeline |
| **PM** | Project Manager - owns the project delivery | Single point of accountability |
| **PC** | Project Coordinator - supports PM with admin/coordination | Factory-level support |
| **Workflow** | The sequence of steps a process follows | Quote → Project → Production → QC → Ship |

---

## TECHNOLOGY STACK EXPLAINED

### The Stack at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 19 + Vite 7 + Lucide Icons + PixiJS (Factory Map)   │
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

### Why Each Technology Was Chosen

| Technology | Why We Chose It | Alternative Considered |
|------------|-----------------|----------------------|
| **React 19** | Industry standard, huge talent pool, component reusability | Vue, Angular - smaller communities |
| **PostgreSQL** | Most advanced open-source DB, free, enterprise features | MySQL (less features), SQL Server (licensing cost) |
| **Supabase** | PostgreSQL + auth + real-time in one, generous free tier | Firebase (NoSQL, harder to query), AWS (complex setup) |
| **Vite** | Fastest build tool, instant hot reload | Webpack (slower, more config) |
| **PixiJS** | GPU-accelerated graphics for interactive Factory Map | Canvas (slower), SVG (not performant for animations) |
| **Lucide Icons** | 500+ clean icons, tree-shakeable (small bundle) | Font Awesome (larger), custom SVGs (time-consuming) |

---

## WHY THESE TECHNOLOGIES

### "Why React instead of something simpler?"

> "React is what Facebook, Netflix, Airbnb, and most modern companies use. It has the largest ecosystem of pre-built components, the biggest talent pool for hiring, and a 10-year track record. Our components are reusable - the same ProjectCard works on every dashboard. If we need to hire someone to maintain this, finding React developers is easy."

### "Why PostgreSQL instead of sticking with Access?"

> "PostgreSQL is the most advanced open-source database in the world. It's free, handles millions of records, supports thousands of concurrent users, and has enterprise security features built in. Access was designed for single-user desktop apps - it starts corrupting when more than 10-15 people use it simultaneously. We needed 14 factories with hundreds of users."

### "Why Supabase instead of building our own backend?"

> "Supabase gives us PostgreSQL, authentication, real-time subscriptions, and auto-generated APIs out of the box. Building that ourselves would take months. Supabase is open-source - if they disappeared tomorrow, we could self-host. And it's $25/month for production-grade infrastructure."

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

## PRAXIS INTEGRATION STORY

### The Key Message

> **"We're not replacing Praxis. We're extending it."**

Praxis is excellent for what it does - quote generation and sales data entry. Sales keeps their workflow. But Praxis was never designed for:
- Production tracking across 14 factories
- Real-time executive dashboards
- Mobile apps for floor workers
- PM project management workflows
- OEE and manufacturing analytics

### How Integration Works Today

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    Praxis    │  CSV    │   PM System  │  Real   │  Dashboards  │
│   (Access)   │ ──────► │   Import     │ ──────► │   & PWA      │
│              │ Export  │              │  Time   │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

1. **Sales creates quote in Praxis** (their existing workflow - unchanged)
2. **Export quotes as CSV** (built-in Access feature)
3. **Import into PM System** (PraxisQuoteImportModal validates and maps 30+ fields)
4. **Quote becomes visible** in sales pipeline, can convert to project
5. **Project flows through production** with full tracking

### What Gets Imported from Praxis

| Praxis Field | PM System Field | Notes |
|--------------|-----------------|-------|
| Quote Number | praxis_quote_number | Links records between systems |
| Customer Info | sales_customers | Name, contact, address |
| Building Type | building_type | Residential, Commercial, etc. |
| Dimensions | width, length, height | Module specifications |
| Module Count | module_count | How many modules in building |
| Stories | stories | 1, 2, or 3 story |
| Base Price | base_price | Before options |
| Options | options_price | Add-ons |
| Total | total_contract_value | Final price |
| Dealer | dealer_id | Matched by dealer code |
| Compliance Flags | wui_compliant, sprinkler_type | Building requirements |

### Future Integration Options

| Method | Effort | Description |
|--------|--------|-------------|
| **CSV (Current)** | Done | Manual export/import, works now |
| **Scheduled Sync** | Medium | Script runs nightly, auto-imports new quotes |
| **ODBC Direct Link** | Medium-High | Real-time read from Access tables |
| **Full Migration** | High | Move all historical data, replace Access |

---

## ARCHITECTURE OVERVIEW

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USERS                                      │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│     VP      │   Director  │     PM      │  Plant Mgr  │ Floor Worker│
│ (All data)  │ (Factory)   │ (Projects)  │ (Factory)   │  (Station)  │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘
       │             │             │             │             │
       ▼             ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │    VP    │ │ Director │ │    PM    │ │  Plant   │ │   PWA    │  │
│  │Dashboard │ │Dashboard │ │Dashboard │ │Dashboard │ │  (Floor) │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    SERVICE LAYER                              │   │
│  │  vpService │ modulesService │ efficiencyService │ qcService  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │   Auth   │ │ REST API │ │ Real-time│ │ Storage  │               │
│  │  (JWT)   │ │  (CRUD)  │ │(WebSocket│ │ (Files)  │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    POSTGRESQL                                 │   │
│  │                                                               │   │
│  │   projects │ modules │ workers │ sales_quotes │ rfis │ etc   │   │
│  │                                                               │   │
│  │   ┌─────────────────────────────────────────────────────┐    │   │
│  │   │              ROW-LEVEL SECURITY                      │    │   │
│  │   │  "PC only sees their factory's data"                │    │   │
│  │   │  "PM only sees assigned projects"                   │    │   │
│  │   └─────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
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

---

## SECURITY MODEL

### Three Layers of Security

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: AUTHENTICATION                                         │
│ "Are you who you say you are?"                                  │
│                                                                  │
│ • Email/password login via Supabase Auth                        │
│ • JWT token issued on successful login                          │
│ • Token expires, must re-authenticate                           │
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

### Role Permissions Matrix

| Role | Factories | Projects | Modules | Quotes | Workers | System Config |
|------|-----------|----------|---------|--------|---------|---------------|
| **VP** | All | All | All | All | All | View |
| **Director** | Assigned | Factory's | Factory's | Factory's | Factory's | View |
| **PM** | All (view) | Assigned | Project's | Flagged | View | None |
| **PC** | Assigned | Factory's | Factory's | Factory's | Factory's | None |
| **Plant_GM** | Assigned | Factory's | Factory's | View | Factory's | Factory |
| **Sales_Manager** | All (view) | View | None | All | None | None |
| **Sales_Rep** | All (view) | View | None | Own | None | None |
| **IT** | All | All | All | All | All | All |

### Authentication Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  User    │      │  React   │      │ Supabase │      │ Database │
│          │      │  App     │      │   Auth   │      │          │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │ 1. Enter email/ │                 │                 │
     │    password     │                 │                 │
     │ ───────────────>│                 │                 │
     │                 │                 │                 │
     │                 │ 2. signIn()     │                 │
     │                 │ ───────────────>│                 │
     │                 │                 │                 │
     │                 │                 │ 3. Validate     │
     │                 │                 │    credentials  │
     │                 │                 │ ───────────────>│
     │                 │                 │                 │
     │                 │                 │ 4. Return user  │
     │                 │                 │<─ ─ ─ ─ ─ ─ ─ ─│
     │                 │                 │                 │
     │                 │ 5. JWT token +  │                 │
     │                 │    user data    │                 │
     │                 │<─ ─ ─ ─ ─ ─ ─ ─│                 │
     │                 │                 │                 │
     │ 6. Show         │                 │                 │
     │    dashboard    │                 │                 │
     │<─ ─ ─ ─ ─ ─ ─ ─│                 │                 │
     │                 │                 │                 │
```

### What Happens When Someone Leaves

1. IT Admin opens User Management
2. Sets user status to "Inactive"
3. User's session is invalidated
4. Next API request fails authentication
5. User redirected to login (which won't work)
6. All audit logs preserved

---

## DATABASE DESIGN

### Core Entity Relationships

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
                                      ┌─────────────────────────┤
                                      │                         │
                                      ▼                         ▼
                               ┌──────────────┐          ┌──────────────┐
                               │station_assign│          │  qc_records  │
                               └──────┬───────┘          └──────────────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │   workers    │
                               └──────────────┘
```

### Key Tables Explained

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **projects** | Core project record | id, name, status, phase, pm_id, factory_id, contract_value |
| **modules** | Individual building sections | id, project_id, status, current_station, dimensions |
| **sales_quotes** | Quotes from Praxis | id, praxis_quote_number, customer, dealer, pricing, specs |
| **tasks** | Work items for PMs | id, project_id, assignee, status, priority, due_date |
| **rfis** | Questions needing answers | id, project_id, question, status, assigned_to |
| **submittals** | Documents for approval | id, project_id, type, revision, status |
| **workers** | Factory floor employees | id, employee_id, name, department, certifications |
| **stations** | Production line locations | id, factory_id, name, sequence, typical_duration |
| **station_assignments** | Module at a station | id, module_id, station_id, crew, start_time, end_time |
| **qc_records** | Quality inspections | id, module_id, station_id, pass/fail, defects |
| **factories** | 14 Sunbelt locations | id, code, name, address, config |
| **users** | System users | id, email, role, factory_id (if PC/Plant) |

### Module Status Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Not Started │ ──► │  In Queue   │ ──► │ In Progress │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┤
                    │                          │
                    ▼                          ▼
             ┌─────────────┐            ┌─────────────┐
             │  QC Hold    │            │  Completed  │
             └──────┬──────┘            └──────┬──────┘
                    │                          │
                    ▼                          ▼
             ┌─────────────┐            ┌─────────────┐
             │   Rework    │            │   Staged    │
             └──────┬──────┘            └──────┬──────┘
                    │                          │
                    └──────► back to           ▼
                             In Progress ┌─────────────┐
                                        │   Shipped   │
                                        └─────────────┘
```

### Project Status Lifecycle

```
Planning ──► Pre-PM ──► PM Handoff ──► In Progress ──► Warranty ──► Completed
                │                            │
                │                            ▼
                │                        On Hold
                │                            │
                ▼                            ▼
            Cancelled                    Cancelled
```

---

## KEY FEATURES EXPLAINED

### 1. Role-Based Dashboards

Each role sees a different home screen optimized for their job:

| Dashboard | User | Key Widgets |
|-----------|------|-------------|
| **VPDashboard** | VP, Director | All factories map, KPI cards, sales pipeline, project health |
| **DirectorDashboard** | Director | Factory metrics, project status, team workload |
| **PMDashboard** | PM | Assigned projects, task queue, RFI/submittal status |
| **PCDashboard** | PC | Factory projects, coordination tasks |
| **PlantManagerDashboard** | Plant GM | Production line, OEE, crew scheduling, modules |
| **SalesDashboard** | Sales Rep | Personal pipeline, quotes, activities |
| **SalesManagerDashboard** | Sales Mgr | Team pipeline, forecasting, performance |
| **ITDashboard** | IT | User management, alerts, logs, system health |

### 2. Factory Map (PixiJS)

Interactive USA map showing all 14 factories:
- **Why PixiJS?** GPU-accelerated 2D graphics, smooth animations, handles complex interactions
- Click a factory → drill into that location's metrics
- Color-coded by performance/status
- Animated factory icons (Studio Ghibli style)

### 3. Production Tracking

Full module lifecycle from raw material to shipping:
- **Station Queue** - See what's waiting at each station
- **Crew Assignment** - Who's working on what
- **Time Tracking** - Estimated vs. actual duration
- **QC Checkpoints** - Pass/fail at each station
- **Rework Loop** - Failed QC → rework → re-inspect

### 4. PWA (Progressive Web App)

Mobile app for factory floor without app store:
- **Worker App** (`/pwa/`) - Clock in/out, view assignments, update status
- **Manager App** (`/pwa/manager/`) - Approve time, assign crew, view metrics
- **Offline Mode** - Works without internet, syncs when connected
- **Install** - Add to home screen, launches like native app

### 5. RFI/Submittal Workflow

Track questions and documents through approval:
- **RFI Flow:** Draft → Open → Pending Response → Answered → Closed
- **Submittal Flow:** Draft → Submitted → Under Review → Approved/Rejected
- **Floor Plan Markers** - Pin RFIs/submittals to exact locations on drawings
- **Excel Export** - Professional formatted logs for meetings

### 6. Sales Pipeline (Praxis Integration)

Manage quotes from import to conversion:
- **CSV Import** - Bring quotes from Praxis
- **Pipeline Stages** - Draft, Proposal, Negotiation, Won, Lost
- **Aging Analysis** - Identify stalled deals (color-coded)
- **PM Flagging** - PMs can flag quotes needing attention
- **Conversion** - Convert won quote to project with one click

### 7. QC Inspection System

Quality control at every station:
- **Checklists** - Configurable per station
- **Pass/Fail** - Record results with photos
- **Defect Tracking** - Log issues, track through rework
- **QC Hold** - Module can't proceed until issues resolved

### 8. Crew Management

Workforce planning and tracking:
- **Scheduling** - Weekly crew assignments
- **Cross-Training Matrix** - Who can work which stations
- **Utilization Heatmap** - Over/under-staffed stations
- **Time & Attendance** - Clock in/out, breaks, total hours

### 9. Kaizen Suggestions

Continuous improvement tracking:
- **Worker Submissions** - Anyone can suggest improvements
- **Review Workflow** - Submitted → Approved/Rejected
- **Savings Tracking** - Estimated $ saved
- **Bonus Awards** - Track rewards for implemented ideas

### 10. Reports & Excel Export

Professional outputs:
- **RFI Log** - Formatted Excel with status, dates, assignments
- **Submittal Log** - Revision tracking, approval status
- **Production Reports** - Daily/weekly metrics
- **Custom Dashboards** - KPIs with drill-down

---

## THE MATH BEHIND ANALYTICS

### OEE (Overall Equipment Effectiveness)

**The Formula:**
```
OEE = Availability × Performance × Quality
```

**Components:**

| Metric | Formula | Example |
|--------|---------|---------|
| **Availability** | (Run Time) ÷ (Planned Time) | 7.5 hrs worked ÷ 8 hrs planned = **93.75%** |
| **Performance** | (Actual Output) ÷ (Theoretical Max) | 18 modules ÷ 20 max possible = **90%** |
| **Quality** | (Good Units) ÷ (Total Units) | 17 good ÷ 18 total = **94.4%** |
| **OEE** | 0.9375 × 0.90 × 0.944 | = **79.7%** |

**Benchmarks:**
- **World Class:** ≥85%
- **Good:** 75-84%
- **Acceptable:** 65-74%
- **Poor:** <65%

**Why It Matters:**
- Low Availability → Too much downtime (maintenance, changeover)
- Low Performance → Running slower than capable (bottlenecks, inefficiency)
- Low Quality → Too many defects (rework, scrap)

Each problem requires a different fix. OEE tells you WHERE to focus.

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

### Quote Aging Analysis

**Categories:**
| Age | Status | Action |
|-----|--------|--------|
| 0-7 days | Fresh (Green) | Normal follow-up |
| 8-30 days | Active (Yellow) | Check in, maintain momentum |
| 31-60 days | At Risk (Orange) | Escalate, find blockers |
| 60+ days | Critical (Red) | Decision: close or kill |

### Crew Utilization

**The Formula:**
```
Utilization % = (Assigned Hours) ÷ (Available Hours) × 100
```

**Heatmap Interpretation:**
- **Green (80-100%):** Optimal utilization
- **Yellow (60-79%):** Underutilized, capacity available
- **Red (>100%):** Overloaded, risk of burnout/delays

### Project Health Score

**Factors Considered:**
```
Health = f(Schedule Variance, Budget Variance, RFI Backlog, Completion %)
```

| Indicator | Weight | Green | Yellow | Red |
|-----------|--------|-------|--------|-----|
| Schedule | 30% | On time | 1-2 weeks late | >2 weeks late |
| Budget | 25% | Under/on budget | 1-5% over | >5% over |
| Open RFIs | 20% | 0-2 open | 3-5 open | >5 open |
| Completion | 25% | On track | Slightly behind | Significantly behind |

---

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

> **Answer:** "Real-time. The system uses WebSocket connections - when data changes in Dallas, your dashboard updates within seconds. No refreshing, no waiting for a report. You'll see:
> - Module stuck in QC hold
> - OEE dropping below threshold
> - Project falling behind schedule
> - RFIs aging without response
>
> Plus, we can configure system alerts to notify you of specific conditions."

### Q: "We have 14 factories. How do I compare performance across all of them at a glance?"

> **Answer:** "The VP Dashboard has a factory comparison view - all 14 plants on one screen showing:
> - Current OEE
> - Modules in production
> - Projects by status
> - On-time delivery %
>
> Click any factory to drill into details. The Factory Map also color-codes by performance - green factories are healthy, red need attention."

### Q: "What happens when a PM is overloaded?"

> **Answer:** "The PM workload view shows:
> - Projects per PM
> - Tasks due this week
> - Open RFIs pending response
> - Hours estimated vs. capacity
>
> Before a PM drowns, you see the imbalance and can reassign projects."

### Q: "Our sales team says quotes sit too long. Does this help?"

> **Answer:** "Yes - the quote aging analysis shows exactly which quotes are stalling. Color-coded: green (fresh), yellow (active), orange (at risk), red (critical). Sales managers see at a glance which deals need attention. We track days-in-stage so you can identify bottlenecks in your sales process."

### Q: "If a module fails QC, what happens?"

> **Answer:** "The module goes into QC Hold status - it can't proceed to the next station. The defect is logged with:
> - What failed (checklist item)
> - Photos
> - Severity
>
> It enters a rework loop. Once fixed, it goes through QC again. We track:
> - First-pass yield (modules passing on first try)
> - Rework time
> - Defect trends by station/crew
>
> This feeds into the Quality component of OEE."

### Q: "We've had projects delayed by long-lead items. How does this help?"

> **Answer:** "There's a Long-Lead Items tracker:
> - Items flagged as long-lead during quoting
> - Expected delivery dates
> - Alerts when delivery might impact production
> - Dashboard showing items at risk
>
> You'll know about potential delays before they hit the floor."

### Q: "What about Kaizen?"

> **Answer:** "Full Kaizen board:
> - Any worker can submit improvement ideas
> - Review workflow (Submitted → Under Review → Approved/Rejected)
> - Track estimated savings
> - Record bonus awards for implemented ideas
> - Reports showing suggestions by plant, savings realized
>
> Now continuous improvement is visible and measurable."

---

## IT DIRECTOR Q&A

### Q: "We've invested years in Praxis. Are you asking us to throw that away?"

> **Answer:** "Absolutely not. Praxis stays. Sales keeps their exact workflow - nothing changes for them. This system extends Praxis with capabilities it was never designed for: real-time production tracking, mobile apps, executive dashboards, OEE analytics. We import FROM Praxis; we don't replace it."

### Q: "What happens in 3 years when you're not maintaining this?"

> **Answer:** "The technology choices were made specifically for maintainability:
> - **React** - most popular frontend framework, huge talent pool
> - **PostgreSQL** - most popular database, 30 years of stability
> - **Supabase** - open source, can self-host if needed
>
> There's nothing proprietary. Any React developer can pick this up. The codebase is organized by feature with a service layer separating concerns. It's standard architecture."

### Q: "Our Access database has 8 years of quote history. Can your system see that?"

> **Answer:** "Three options:
> 1. **CSV Import** (available now) - export from Access, import to system
> 2. **Historical Migration** - one-time import of all historical quotes
> 3. **ODBC Connection** (future) - direct read-access to Access tables
>
> We designed for coexistence, not replacement. Your historical data is safe."

### Q: "Who can see what?"

> **Answer:** "Three layers of security:
> 1. **Authentication** - must log in with valid credentials
> 2. **Role-based UI** - menus/buttons filtered by role
> 3. **Row-level security** - database enforces data boundaries
>
> Example: A Project Coordinator in Atlanta literally cannot query Phoenix data. The database refuses, even if there's a bug in the app."

### Q: "If an employee leaves, how do we revoke access?"

> **Answer:** "IT Admin marks user as Inactive. Their session invalidates immediately. Next API request fails. They're locked out within seconds. All their historical activity is preserved for audit."

### Q: "What certifications does Supabase have?"

> **Answer:** "Supabase has:
> - **SOC 2 Type II** certification
> - **HIPAA** compliance available
> - Data encrypted at rest and in transit
> - Regular security audits
>
> They're trusted by thousands of companies including enterprise clients."

### Q: "Where does the data physically live?"

> **Answer:** "Supabase data centers are in the US (AWS infrastructure). You can choose the region when setting up the project. Data never leaves the US."

### Q: "What's the disaster recovery plan?"

> **Answer:** "Supabase provides:
> - **Daily automatic backups** (retained 7 days on Pro)
> - **Point-in-time recovery** - restore to any second
> - **Database exports** - download full backup anytime
>
> For complete outage, the PWA continues working offline with cached data and syncs when service returns."

### Q: "Can we export all our data if we decide to leave?"

> **Answer:** "Yes. PostgreSQL exports to standard SQL format. All your data, all your schema. No lock-in. You could migrate to any PostgreSQL host or even different databases."

### Q: "How do you handle audit trails?"

> **Answer:** "Multiple levels:
> - **Login activity** - who logged in when
> - **Config audit** - who changed settings
> - **Calendar audit** - schedule changes tracked
> - **Supabase logs** - all API requests logged
>
> We can trace any action back to user and timestamp."

### Q: "What's the total cost of ownership?"

> **Answer:** "
> - **Supabase Pro:** $25/month
> - **Hosting:** Included (or can self-host Vite build)
> - **Maintenance:** Standard React development
> - **No licensing fees** - all open-source foundation
>
> Compare to: Access corruption recovery, VPN infrastructure for remote access, manual reporting labor, custom app development for mobile."

---

## LEAD IT PROGRAMMER Q&A

### Q: "Explain the tech stack. Why these specific technologies?"

> **Answer:** "
> - **React 19** - Industry standard, component reusability, huge ecosystem
> - **Vite** - Fastest build tool, instant hot reload in dev
> - **PostgreSQL** - Most advanced open-source database
> - **Supabase** - PostgreSQL + Auth + Real-time + Storage in one
> - **PixiJS** - GPU-accelerated graphics for the Factory Map
> - **Lucide** - Icon library, tree-shakeable for small bundles
>
> Every choice prioritizes: industry standard (hireable), maintainable, performant."

### Q: "What's the difference between Supabase and Firebase? Why not Firebase?"

> **Answer:** "Firebase uses a NoSQL document database. Great for simple apps, but:
> - **No SQL** - complex queries are hard/impossible
> - **No relations** - can't do JOINs
> - **No RLS at row level** - security is more complex
>
> Supabase uses PostgreSQL:
> - **Full SQL** - any query you can imagine
> - **Relations** - proper foreign keys, JOINs
> - **True RLS** - security policies at database level
> - **Open source** - no vendor lock-in"

### Q: "How do you handle state management?"

> **Answer:** "React Context API for global state (auth), component state (useState) for local. No Redux - intentionally. Redux adds complexity we don't need. The architecture:
> - **AuthContext** - user session, role, factory
> - **Component state** - form inputs, UI toggles
> - **Supabase queries** - data lives in database, not client
> - **Real-time subscriptions** - data stays fresh"

### Q: "Walk me through authentication flow."

> **Answer:** "
> 1. User enters email/password in Login.jsx
> 2. `supabase.auth.signInWithPassword()` called
> 3. Supabase validates credentials
> 4. Returns JWT token + user metadata
> 5. Token stored in browser (httpOnly cookie or localStorage)
> 6. AuthContext updates, triggers re-render
> 7. App checks role, renders appropriate dashboard
> 8. Every API request includes JWT in Authorization header
> 9. Supabase validates token + checks RLS policies
> 10. Only authorized data returned"

### Q: "What's your caching strategy?"

> **Answer:** "Multiple layers:
> - **Service Worker** - PWA caches pages and assets
> - **Supabase** - connection pooling, prepared statements
> - **localStorage** - user preferences, filter state
> - **IndexedDB** - offline data storage
> - **React** - useMemo/useCallback for expensive computations
>
> PWA cache strategy:
> - API calls: NetworkFirst (try network, fall back to cache)
> - Static assets: CacheFirst (use cache, update in background)"

### Q: "How does real-time work?"

> **Answer:** "Supabase Real-time uses WebSockets:
> 1. Client opens WebSocket connection on mount
> 2. Subscribes to specific tables (e.g., `modules`)
> 3. When ANY client changes that table, Supabase broadcasts
> 4. All subscribed clients receive the change
> 5. React state updates, UI re-renders
>
> No polling. Instant updates. Scales to thousands of connections."

### Q: "What's the service layer architecture?"

> **Answer:** "Business logic separated from UI:
> ```
> Component (UI) → Service (logic) → Supabase (data)
> ```
>
> Example services:
> - `vpService.js` - VP dashboard queries
> - `modulesService.js` - module CRUD and status
> - `efficiencyService.js` - OEE calculations
> - `qcService.js` - quality control operations
>
> Components don't know about Supabase. Services don't know about React. Clean separation."

### Q: "How do you handle errors?"

> **Answer:** "
> - **API errors** - try/catch in services, user-friendly messages
> - **Network errors** - offline detection, retry logic
> - **Validation errors** - form validation before submission
> - **React errors** - Error Boundaries catch component crashes
>
> Users see friendly messages, not stack traces. All errors logged for debugging."

### Q: "What testing is in place?"

> **Answer:** "Currently focused on:
> - **Manual testing** - each feature tested before deploy
> - **TypeScript** - would catch many errors (future enhancement)
> - **ESLint** - catches common mistakes
>
> Future roadmap: Jest unit tests, Playwright E2E tests."

### Q: "How do database migrations work?"

> **Answer:** "SQL files in `supabase/migrations/`:
> - Named by date: `20260120_comprehensive_demo_data.sql`
> - Run in order via Supabase dashboard
> - Each migration is idempotent (safe to re-run)
> - Archive folder for historical migrations
>
> Same pattern as Rails/Django migrations."

### Q: "What's in your build pipeline?"

> **Answer:** "
> 1. **Dev:** `npm run dev` - Vite dev server with hot reload
> 2. **Build:** `npm run build` - creates optimized bundle
> 3. **Preview:** `npm run preview` - test production build locally
> 4. **Deploy:** Upload `dist/` folder to hosting
>
> Vite handles: bundling, tree-shaking, code-splitting, minification, PWA generation."

### Q: "What prevents a Plant Manager in Atlanta from seeing Phoenix's data?"

> **Answer:** "Row-Level Security policy in PostgreSQL:
> ```sql
> CREATE POLICY factory_isolation ON modules
> FOR SELECT
> USING (factory_id = auth.jwt() ->> 'factory_id');
> ```
>
> The database itself checks: does your JWT's factory_id match this row's factory_id? If not, row is invisible. Even if the frontend has a bug, the database enforces the boundary."

### Q: "Offline - what happens if two people edit the same module offline?"

> **Answer:** "Last-write-wins for most fields. The system isn't designed for extensive offline collaboration - it's for factory floor workers checking in/out and updating status. In practice:
> - Worker A updates module status to 'In Progress'
> - Worker B (offline) also updates the same module
> - Worker B reconnects
> - Worker B's update overwrites Worker A's
>
> For conflict-prone operations, we can add optimistic locking (check updated_at before saving). Current use case doesn't require it."

---

## SKEPTICAL QUESTIONS Q&A

### Q: "This seems overengineered. Why not just use SharePoint and Excel?"

> **Answer:** "SharePoint and Excel are great for documents and simple lists. They can't do:
> - Real-time production tracking across 14 factories
> - Mobile apps that work offline
> - Role-based row-level security
> - OEE calculations automatically
> - WebSocket live updates
>
> We'd end up with 50 spreadsheets, manual data entry everywhere, no single source of truth, and no mobile access for floor workers. This consolidates everything."

### Q: "We tried a custom system 5 years ago and it failed. Why is this different?"

> **Answer:** "Good question. Usually custom systems fail because:
> - Proprietary tech (developers leave, no one can maintain)
> - Tried to replace everything at once
> - No mobile support
> - Poor user experience
>
> This is different:
> - **Standard tech** - React + PostgreSQL, anyone can maintain
> - **Extends, doesn't replace** - Praxis stays
> - **PWA mobile** - works on any device
> - **Modern UX** - designed for actual users, not IT requirements"

### Q: "Our workers aren't tech-savvy. Will they actually use this?"

> **Answer:** "The PWA is designed for simplicity:
> - Worker enters employee ID and 4-digit PIN
> - Sees only their relevant information
> - Big buttons: Clock In, Clock Out, Update Status
> - Works like an app they already know
>
> We're not asking workers to learn a complex system. It's simpler than their phone."

### Q: "What's the learning curve?"

> **Answer:** "Depends on role:
> - **Floor workers:** 5 minutes. Clock in, see tasks, clock out.
> - **PMs:** 1-2 hours. Familiar project management patterns.
> - **Plant Managers:** Half day. New visibility, same operations.
> - **Executives:** Immediate. Dashboards are self-explanatory.
>
> We can do brief training sessions by role."

### Q: "What happens if internet goes down at a factory for a whole day?"

> **Answer:** "PWA continues working:
> - Workers clock in/out (stored locally)
> - Module status updates (queued locally)
> - View cached data (production boards, schedules)
>
> When internet returns:
> - Queued changes sync automatically
> - Dashboard updates with current data
>
> The factory doesn't stop because Wi-Fi is down."

### Q: "How do you handle 50 workers all clocking in at 6 AM?"

> **Answer:** "
> - **Supabase connection pooling** - handles concurrent requests
> - **PostgreSQL** - designed for high concurrency
> - **Lightweight operations** - clock-in is a single insert
>
> 50 concurrent requests is nothing for this architecture. We could handle 500."

### Q: "What's the mobile experience like?"

> **Answer:** "It's a PWA (Progressive Web App):
> - Open URL in browser
> - Tap 'Add to Home Screen'
> - Launches like a native app
> - Responsive design - works on phone, tablet, desktop
> - Touch-optimized buttons and navigation
>
> No App Store download. Updates deploy instantly. Same code everywhere."

---

## FUTURE & SCALABILITY Q&A

### Q: "What's on the roadmap?"

> **Answer:** "Future enhancements could include:
> - **Scheduled Praxis sync** - automatic nightly import
> - **Push notifications** - alerts to mobile devices
> - **Advanced reporting** - custom report builder
> - **ERP integration** - connect to accounting/inventory systems
> - **Automated scheduling** - AI-suggested production schedules
> - **Unit tests** - comprehensive test coverage
>
> The architecture supports all of these."

### Q: "Can this scale to 50 factories? 100?"

> **Answer:** "Yes. PostgreSQL handles massive scale (Instagram runs on it). Supabase auto-scales. The architecture is:
> - **Stateless frontend** - any number of users
> - **Connection pooling** - efficient database usage
> - **Row-level security** - performance optimized per-user queries
>
> 50 or 100 factories is the same architecture, more rows."

### Q: "Can we add custom fields without code changes?"

> **Answer:** "Database changes require a migration (SQL file). But:
> - PostgreSQL supports JSONB columns for flexible data
> - We could add a 'custom_fields' column
> - UI could dynamically render based on configuration
>
> Full flexibility would require planned enhancement."

### Q: "What about ERP integration?"

> **Answer:** "PostgreSQL can connect to:
> - **ODBC** - any ODBC-compatible system
> - **REST APIs** - most modern ERPs have APIs
> - **CSV/Excel** - batch import/export
> - **Database links** - direct table access
>
> Integration depends on what ERP system. Architecture supports it."

### Q: "Could this eventually replace Praxis entirely?"

> **Answer:** "Technically, yes. The sales quote functionality is built. But:
> - Migration requires buy-in from sales team
> - Data migration is a project itself
> - Training and change management needed
>
> It's possible, but should be a deliberate decision, not a side effect."

---

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
2. "CSV from Praxis, validates and maps fields"
3. Show imported quote in pipeline
4. "Convert to project with one click"

### Closing

"Questions?"

---

## QUICK REFERENCE CHEAT SHEET

### Numbers to Know

| Metric | Value |
|--------|-------|
| Factories supported | 14 (scalable) |
| User roles | 10 |
| Database tables | 30+ |
| Services | 11 |
| Dashboard types | 8 |
| Import fields from Praxis | 30+ |

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

### Emergency Phrases

- "That's a great question - let me show you in the code"
- "The architecture supports that - it would be a future enhancement"
- "We specifically designed for that scenario"
- "That's exactly why we chose PostgreSQL over Access"
- "The security model prevents that at the database level"

---

*Document generated for technical presentation. Audience: Lead IT Programmer, IT Director, VP of Operations.*
