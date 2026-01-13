# Dashboard Enhancement Plan - Praxis Integration

**Created:** January 13, 2026
**Status:** ✅ IMPLEMENTED (January 13, 2026)

---

## Overview

This document outlines the planned enhancements to all role-based dashboards to leverage new Praxis data fields and improve the user experience.

---

## 1. Sales Dashboard Enhancements

### Current State
- Basic metrics: Pipeline Value, Won Revenue, Win Rate, Customer Count
- Status filters: Draft, Sent, Negotiating
- Simple quote list

### Planned Enhancements

#### 1.1 Pipeline Metrics (Enhanced)
- [x] **Weighted Pipeline**: Value × outlook_percentage for realistic forecasting
- [x] **Visual Funnel**: Open Quote → Awaiting PO → PO Received → Converted
  - Show count and value at each stage
  - Clickable to filter list

#### 1.2 Building Type Analytics
- [x] **Breakdown Chart**: Pie/donut showing pipeline by building type (CUSTOM, FLEET/STOCK, GOVERNMENT, Business)
- [x] **Filter Option**: Add building type to existing filters

#### 1.3 Quote List Enhancements
Display Praxis fields in quote cards:
- [x] `outlook_percentage` - Visual badge (75%, 95%, 100%)
- [x] `waiting_on` - Status chip showing what's blocking (PO, Sign Off, Colors)
- [x] `difficulty_rating` - 1-5 stars or dots
- [x] `expected_close_timeframe` - Text display
- [x] `building_type` - Badge/tag
- [x] `square_footage` / `module_count` - Compact display
- [x] Dealer info on hover/expand

#### 1.4 PM Flagging
- [x] **Badge**: Visual indicator on PM-flagged quotes
- [x] **Metrics Card**: Count of PM-flagged quotes
- [x] **Filter**: "PM Flagged" option in status filter
- [x] **Section**: Dedicated "Flagged for PM" collapsible section

#### 1.5 Quote Aging/Staleness
- [x] **Color Scale** (30-day working day scale):
  - Green: 0-15 days (healthy)
  - Yellow: 16-25 days (aging)
  - Red: 26-30+ days (stale)
- [x] **Stale Alert Section**: Quotes 30+ days without activity
- [x] Age indicator on each quote card

#### 1.6 Status Config Update
Update STATUS_CONFIG to include Praxis-aligned statuses:
- `draft` → Draft
- `sent` → Sent
- `negotiating` → Negotiating
- `awaiting_po` → Awaiting PO (NEW)
- `po_received` → PO Received (NEW)
- `won` → Won
- `lost` → Lost
- `expired` → Expired (NEW)
- `converted` → Converted (NEW)

---

## 2. VP Dashboard Enhancements

### Current State
- High-level KPIs across all factories
- Project health distribution
- Factory performance comparison
- Delivery timeline

### Planned Enhancements

#### 2.1 Sales Pipeline Visibility
- [x] **Pipeline Summary Card**: Total quotes, weighted value, win rate (read-only)
- [x] **"Needs PM Attention" Section**: PM-flagged quotes requiring action
  - Quote name, dealer, value, reason for flagging
  - Days since flagged
  - Click to view details

#### 2.2 Quote-to-Project Conversion
- [x] **Recently Converted Section**: Projects converted from quotes in last 30 days
  - Show original quote number, conversion date
  - Source quote value vs project contract value
  - Time from quote to conversion

#### 2.3 Factory Performance (Enhanced)
- [x] **Building Type Breakdown**: Chart showing factory mix (CUSTOM vs FLEET/STOCK vs GOVERNMENT)
- [x] **Conversion Time by Factory**: Average days from quote to project by factory

#### 2.4 Forecasting
- [x] **Weighted Pipeline Chart**: Revenue forecast by expected close date
  - Next 30/60/90 days buckets
  - Weighted by outlook_percentage
- [x] **Weighted Pipeline Total**: Single metric showing realistic pipeline value

---

## 3. Director Dashboard Enhancements

### Current State
- Portfolio metrics with risk assessment
- PM workload distribution
- Gantt timeline
- Team activity feed

### Planned Enhancements

#### 3.1 Praxis Project Fields
Display in project cards/table:
- [x] Building specs (width × length, sqft, modules, stories)
- [x] Compliance flags (WUI, sprinkler type, climate zone)
- [x] Cost breakdown (material cost, markup, $/sqft)
- [x] Dealer info (name, branch, contact)
- [x] Promised delivery date (highlight vs actual delivery)

#### 3.2 PM Workload (Enhanced)
- [x] **Toggle View**: Switch between:
  - Simple: Project count + contract value per PM
  - Weighted: Factor in difficulty_rating (1-5 scale)
- [x] Difficulty-weighted capacity indicator

#### 3.3 Incoming Projects Section
- [x] **"Coming Soon" Widget**: Quotes at 95%+ outlook
  - Quote name, dealer, expected close
  - Building type, sqft, value
  - Assigned PM (if known)
  - Days until expected close

---

## 4. PM Dashboard Enhancements

### Current State
- Portfolio health indicators
- Overdue/due soon sections
- Weekly calendar
- Gantt timeline
- Active projects table

### Planned Enhancements

#### 4.1 Project Card Enhancements
Display Praxis fields:
- [x] `building_type` - Badge (CUSTOM, FLEET/STOCK, etc.)
- [x] `module_count` / `square_footage` - Compact display
- [x] `promised_delivery_date` - Highlight if different from delivery_date
- [x] Dealer contact info (name, phone) - Quick access
- [x] `difficulty_rating` - Visual indicator (1-5)

#### 4.2 Delivery Timeline View
- [x] **Timeline Component**: All upcoming deliveries
  - Toggle: 30 / 60 / 90 days view
  - Visual timeline with project cards
  - Color-coded by urgency (green/yellow/red)
- [x] **Urgent Delivery Alerts**: Projects with delivery in next 14 days
  - Prominent placement at top of dashboard
  - Days until delivery countdown

#### 4.3 Document Checklist (Project Detail Only)
- [x] Add checklist widget to ProjectDetails component
- [x] Show required documents and status
- [x] Allow PM to mark documents as received
- [x] Note: NOT on dashboard, only in project detail view

---

## Implementation Order

1. **Sales Dashboard** (most Praxis impact)
   - Update STATUS_CONFIG
   - Add weighted pipeline and funnel
   - Enhance quote cards with Praxis fields
   - Add aging/staleness indicators
   - Add PM flagging UI

2. **VP Dashboard**
   - Add sales pipeline summary
   - Add PM-flagged quotes section
   - Add recently converted section
   - Add forecasting chart

3. **Director Dashboard**
   - Add Praxis fields to project display
   - Add workload toggle (simple vs weighted)
   - Add incoming projects section

4. **PM Dashboard**
   - Enhance project cards with Praxis fields
   - Add delivery timeline view
   - Add urgent delivery alerts

---

## Design Reference

Look to these tools for inspiration:
- **Salesforce**: Pipeline visualization, opportunity stages
- **HubSpot**: Deal funnel, weighted pipeline
- **Monday.com**: Clean card layouts, color coding
- **Asana**: Timeline views, status indicators
- **Linear**: Minimal, elegant metric displays

---

## Notes

- All dashboards should maintain current dark theme
- Use existing Sunbelt orange accent color
- Keep mobile-responsive design
- Minimize additional database queries where possible
- Use memoization for computed metrics
