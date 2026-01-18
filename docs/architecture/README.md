# Sunbelt PM System - Architecture Documentation

> Generated: January 18, 2026
> System Version: 1.0
> Total Tables: 48 | Total Components: 148+

---

## Quick Links

| Diagram Type | Full System | Core Only |
|-------------|-------------|-----------|
| **Database ERD** | [Mermaid](FULL_SYSTEM_ERD.mermaid) \| [PlantUML](FULL_SYSTEM_ERD.puml) \| [ASCII](FULL_SYSTEM_ERD.txt) | [Mermaid](CORE_SYSTEM_ERD.mermaid) \| [PlantUML](CORE_SYSTEM_ERD.puml) \| [ASCII](CORE_SYSTEM_ERD.txt) |
| **Component Diagram** | [Mermaid](FULL_COMPONENT_DIAGRAM.mermaid) \| [PlantUML](FULL_COMPONENT_DIAGRAM.puml) \| [ASCII](FULL_COMPONENT_DIAGRAM.txt) | [Mermaid](CORE_COMPONENT_DIAGRAM.mermaid) \| [PlantUML](CORE_COMPONENT_DIAGRAM.puml) \| [ASCII](CORE_COMPONENT_DIAGRAM.txt) |

---

## System Overview

The Sunbelt PM System is a modular building production management platform consisting of:

- **Web Application** - React-based dashboard for office users
- **PWA Floor App** - Mobile app for factory floor workers (PIN auth)
- **PWA Manager App** - Mobile app for Project Managers (email auth)
- **Supabase Backend** - PostgreSQL database with real-time subscriptions

---

## Domain Color Coding

| Domain | Color | Hex | Description |
|--------|-------|-----|-------------|
| **Sales** | Blue | `#3b82f6` | Quotes, customers, dealers |
| **Projects** | Green | `#22c55e` | Projects, tasks, RFIs, submittals |
| **Production** | Orange | `#f97316` | Modules, stations, QC records |
| **Users** | Purple | `#a855f7` | System users (managers, PMs) |
| **Inventory** | Yellow | `#eab308` | Purchase orders, receipts |
| **Workforce** | Cyan | `#06b6d4` | Workers, shifts, training |
| **System** | Gray | `#64748b` | Factories, config, departments |

---

## Database Schema Summary

### Table Count by Domain

| Domain | Tables | Key Tables |
|--------|--------|------------|
| Sales | 5 | sales_quotes, sales_customers, dealers |
| Projects | 10 | projects, tasks, rfis, submittals, change_orders |
| Production | 6 | modules, station_templates, qc_records |
| Workforce | 8 | workers, worker_shifts, cross_training |
| Inventory | 3 | purchase_orders, inventory_receipts |
| Users | 1 | users |
| System | 8 | factories, departments, plant_config |
| **Total** | **48** | |

### Core Business Flow

```
Dealer → Customer → Quote → Project → Modules → QC → Ship
              ↓         ↓         ↓
         Building   PM Flag   Production
          Specs    Transfer    Line Flow
```

---

## Component Architecture Summary

### Application Entry Points

| Entry | Auth Type | Target Users |
|-------|-----------|--------------|
| App.jsx | Email/Password | Office staff (VP, Director, PM, Sales) |
| PWAApp.jsx | PIN-based | Factory floor workers |
| ManagerApp.jsx | Email/Password | Project Managers (mobile) |

### Role-Based Dashboards

| Role | Dashboard | Key Features |
|------|-----------|--------------|
| VP | VPDashboard | Sales pipeline, PM flagging, production stats |
| Director | DirectorDashboard | PM assignment queue, Kanban view |
| PM | PMDashboard | Project management, workflow canvas |
| Plant Manager | PlantManagerDashboard | Production line, takt time, crew |
| Sales | SalesDashboard | Quote management, pipeline |

### Service Layer (10 Services)

| Service | Primary Tables | Used By |
|---------|----------------|---------|
| stationService | station_templates, modules | Production line |
| modulesService | modules, projects | Floor app, dashboards |
| workersService | workers, shifts, training | Crew management |
| qcService | qc_records, modules | QC inspection |
| efficiencyService | kaizen, takt_events | Efficiency metrics |
| vpService | factories, projects, modules | VP dashboard |

---

## Recent Features (January 18, 2026)

### Building Specifications

Added to `sales_quotes` and `projects` tables:
- `building_type` - CUSTOM, GOVERNMENT, EDUCATION, HEALTHCARE, etc.
- `building_width`, `building_length` - Overall dimensions in feet
- `mod_width` - Module width (10', 12', 14', or custom)
- `module_count` - Number of modules
- `occupancy` - Classification (A-U)
- `special_materials` - JSONB with TT&P, sprinklers, plumbing flags

### PM Flag Workflow

1. VP flags quote as requiring PM oversight (`is_pm_flagged`)
2. Quote converts to project with `is_pm_job = true`
3. Director assigns PM via assignment queue
4. PM manages project through 19 workflow stations

---

## Viewing the Diagrams

### Mermaid (.mermaid)
- GitHub renders automatically
- VS Code: Install "Markdown Preview Mermaid Support" extension
- Online: [Mermaid Live Editor](https://mermaid.live)

### PlantUML (.puml)
- VS Code: Install "PlantUML" extension
- Online: [PlantUML Server](https://www.plantuml.com/plantuml)
- CLI: `java -jar plantuml.jar diagram.puml`

### ASCII (.txt)
- Any text editor
- Best for quick reference without tooling

---

## PWA Mobile Integration Plan

See [PWA_BUILDING_SPECS_INTEGRATION_PLAN.md](PWA_BUILDING_SPECS_INTEGRATION_PLAN.md) for the plan to add Building Specs and PM Flag features to the mobile apps.

---

## Files in This Directory

```
docs/architecture/
├── README.md                              # This file
├── FULL_SYSTEM_ERD.mermaid               # Complete 48-table ERD (Mermaid)
├── FULL_SYSTEM_ERD.puml                  # Complete 48-table ERD (PlantUML)
├── FULL_SYSTEM_ERD.txt                   # Complete 48-table ERD (ASCII)
├── CORE_SYSTEM_ERD.mermaid               # Core 14-table ERD (Mermaid)
├── CORE_SYSTEM_ERD.puml                  # Core 14-table ERD (PlantUML)
├── CORE_SYSTEM_ERD.txt                   # Core 14-table ERD (ASCII)
├── FULL_COMPONENT_DIAGRAM.mermaid        # Full component dependencies (Mermaid)
├── FULL_COMPONENT_DIAGRAM.puml           # Full component dependencies (PlantUML)
├── FULL_COMPONENT_DIAGRAM.txt            # Full component dependencies (ASCII)
├── CORE_COMPONENT_DIAGRAM.mermaid        # Core component flow (Mermaid)
├── CORE_COMPONENT_DIAGRAM.puml           # Core component flow (PlantUML)
├── CORE_COMPONENT_DIAGRAM.txt            # Core component flow (ASCII)
└── PWA_BUILDING_SPECS_INTEGRATION_PLAN.md # Mobile app integration plan
```

---

## For IT Report

When including these diagrams in an IT report:

1. **Executive Summary** - Use CORE diagrams for high-level overview
2. **Technical Detail** - Use FULL diagrams for complete reference
3. **Format Choice**:
   - PDF/Word: Export PlantUML or Mermaid to PNG/SVG
   - Web/GitHub: Embed Mermaid directly
   - Print: Use ASCII for reliable formatting
