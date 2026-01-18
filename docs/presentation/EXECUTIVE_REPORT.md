# Sunbelt PM System V1

## Executive Summary Report

---

| | |
|---|---|
| **Prepared by** | Matthew McDaniel |
| **Email** | matthew.mcdaniel@sunbeltmodular.com |
| **Date** | January 17, 2026 |
| **Audience** | Devin Duvak & Candy Juhnke |
| **Purpose** | Demonstrate transformative value and secure company-wide adoption |

---

## Mission Statement

**Sunbelt-PM-System** is a unified platform that streamlines modular construction workflows across sales, project management/operations, and production at Sunbelt Modular, integrating shared real-time data and advanced analytics—such as efficiency tracking, personnel metrics, and factory dashboards—to eliminate silos, boost company-wide performance, and enable data-driven insights for trends, forecasting, and continuous improvement.

---

## The Problem We're Solving

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

## The Solution: A Complete Operational Platform

Built in-house using modern technology (React + Supabase), this system doesn't replace Praxis—it **extends** it into full project lifecycle management with production tracking, crew management, and quality control.

### Cost Comparison

| Solution | Monthly Cost (100+ users) |
|----------|--------------------------|
| Procore | $5,000 - $15,000/month |
| Monday.com | $2,000 - $5,000/month |
| Asana Business | $1,500 - $4,000/month |
| **Sunbelt PM System** | **~$50/month hosting** |

---

## What is Built: Complete Feature Overview

### Role-Specific Dashboards (5 Total)

| Dashboard | User Role | Key Capabilities |
|-----------|-----------|------------------|
| **VP Dashboard** | Executive Leadership | Enterprise portfolio view, sales pipeline, factory performance, top clients, delivery trends |
| **Director Dashboard** | Directors, Senior PMs | Portfolio health, PM workload analysis, project timeline (Gantt), risk tracking, incoming quotes |
| **PM Dashboard** | Project Managers | Personal command center, my tasks/RFIs, calendar, urgent deliveries, active projects |
| **Plant Manager Dashboard** | Factory Managers | Production line, crew management, quality control, analytics, scheduling |
| **PC Dashboard** | Project Coordinators | Factory projects, deadlines, overdue items, warning emails |

---

## Dashboard Details

### VP Dashboard - Enterprise View

**Portfolio Metrics:**
- Total portfolio value across all factories
- Active project count and on-time delivery percentage
- Overdue items requiring attention
- Portfolio health breakdown (On Track / At Risk / Critical)

**Sales Pipeline Visibility:**
- Pipeline value and weighted forecast
- Win rate calculations
- PM-flagged quotes needing attention
- Recently converted quotes (last 30 days)
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
- Week navigation with today button

**Delivery Tracking:**
- Urgent deliveries (next 14 days)
- 30/60/90 day delivery timeline
- Building type and urgency indicators

---

### Plant Manager Dashboard - Production Control

**9 Functional Tabs:**

| Tab | Purpose |
|-----|---------|
| **Overview** | Stats grid, production preview, real-time metrics widgets |
| **Production** | 12-station production line, module tracking, drag-drop movement |
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

**Quality Control:**
- Pass/fail tracking with rates
- Pending inspection queue
- Defect cycle timing
- Quality trend analysis

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

**Project Visibility:**
- Factory projects table with status
- PM assignments
- Open task counts
- Search and filter capability

---

## Mobile Applications (2 PWAs)

### Floor App - Factory Workers

**Target Users:** Production workers, technicians, crew members

| Feature | Description |
|---------|-------------|
| **Module Lookup** | Search/scan modules by serial number, view status and location |
| **Station Move** | Transfer modules between stations with queue position |
| **QC Inspection** | Pass/fail inspections with defect codes |
| **Inventory Receiving** | Goods receipt and location assignment |

**Design:** Dark mode optimized for factory floor, large touch targets, PIN-based login

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

## Project Management Features

| Feature | Description |
|---------|-------------|
| **6-Phase Workflow** | Interactive workflow with draggable stations and status lights |
| **Task Management** | Create, assign, track tasks with priorities and due dates |
| **RFI Tracking** | Request for Information with status workflow and exports |
| **Submittal Management** | Document submittals with approval tracking |
| **Floor Plans** | Upload plans with interactive coordinate markers |
| **Calendar** | Month/week/day views with color-coded deadlines |
| **Document Management** | File uploads with versioning and organization |
| **Praxis Import** | CSV/Excel import with ~40 field mappings |

---

## Production Management Features

| Feature | Description |
|---------|-------------|
| **12-Station Production Line** | Visual grid showing module distribution |
| **Module Tracking** | Serial number, status, project, queue position |
| **Takt Time Tracker** | Cycle time monitoring by station |
| **Queue Time Monitor** | Wait time analysis with bottleneck detection |
| **OEE Calculator** | Overall Equipment Effectiveness metrics |
| **Visual Load Board** | Module queue visualization |
| **Kaizen Board** | Continuous improvement idea tracking |
| **Defect Cycle Timer** | Defect aging and root cause analysis |

---

## Crew Management Features

| Feature | Description |
|---------|-------------|
| **Attendance Dashboard** | Digital clock in/out, break tracking, absence management |
| **Weekly Schedule** | Shift assignments by worker and station |
| **Utilization Heatmap** | Station/skill efficiency visualization |
| **Cross-Training Matrix** | Skills and certifications tracking |

---

## Analytics & Reporting

| Report Type | Description |
|-------------|-------------|
| **Executive Reports** | C-level KPI summaries and trends |
| **Portfolio Performance** | On-time delivery, budget variance |
| **Resource Utilization** | Labor hours by station |
| **Quality Metrics** | Pass rates, defect trends |
| **Daily Production Report** | Factory daily output summary |
| **RFI/Submittal Exports** | Excel exports with factory branding |

---

## Business Impact & ROI

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

## Praxis Integration

The system **complements** Praxis—not replaces it:

| Praxis Handles | Sunbelt PM System Handles |
|----------------|---------------------------|
| Estimating | Project execution |
| Accounting | Task/RFI/Submittal tracking |
| Sales quotes | Production management |
| Cost calculations | Crew/attendance |
| Financial tracking | Quality control |

**Integration:** CSV/Excel import with ~40 field mappings (quote number, building specs, costs, dealer info, etc.)

---

## Sample Adoption Roadmap

### Phase 1: Demo & Buy-In (This Week)
- Tuesday presentation with live demo
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

## Anticipated Questions

### "How does this fit with Praxis?"
It's not a replacement. Praxis remains our estimating/accounting anchor. This system imports Praxis data and extends into PM and production—creating a unified view without duplicating effort.

### "What are the cost savings?"
Avoids SaaS fees ($24K-$60K/year). Hosting is ~$50/month. ROI from efficiency gains could pay for itself in weeks through reduced delays.

### "How long to roll out?"
Pilot: 1-2 weeks post-demo. Company-wide: 1-2 months with phased training. Starts with simple imports from existing Praxis exports.

### "Will this require training?"
Yes, but minimal: 1-hour sessions per role (sales for imports, PM for workflows, production for dashboards). Intuitive interface means quick adoption.

### "What's the risk if it doesn't work?"
Low. Pilot in one factory first. Easy rollback to current processes. We own everything—no vendor dependencies.

### "How secure is the data?"
Built-in row-level security (users see only their factory/role data), encrypted storage, JWT authentication. Full control—no external vendors.

### "Can it scale to all factories?"
Yes—designed for 100-200+ users with auto-scaling. Supports 14 factories out-of-box with factory-based filtering.

---

## Summary: What You're Getting

| Category | Count | Examples |
|----------|-------|----------|
| **Dashboards** | 5 | VP, Director, PM, Plant Manager, PC |
| **Mobile Apps** | 2 | Floor App (workers), Manager PWA (supervisors) |
| **Project Features** | 8+ | Workflow, Tasks, RFIs, Submittals, Floor Plans, Calendar |
| **Production Features** | 8+ | Takt Time, Queue Monitor, OEE, Kaizen Board |
| **Crew Features** | 4 | Attendance, Schedule, Utilization, Cross-Training |
| **Analytics** | 5+ | Executive Reports, Quality Metrics, Daily Reports |

---

*Sunbelt PM System V1 - Built for Sunbelt Modular*
*Sunbelt Orange: #FF6B35*

