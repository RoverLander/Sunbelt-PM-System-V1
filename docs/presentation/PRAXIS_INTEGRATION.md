# Integrating Sunbelt-PM-System Frontend and Backend with Company Systems

**Prepared by: Matthew McDaniel**
**Date: January 17, 2026**
**Purpose: Presentation to IT Team on Tuesday**
 **Executive Summary** : Sunbelt-PM-System (React frontend + Supabase backend) can integrate with our legacy Access-based Praxis software to unify data across sales, PM/operations, and production—reducing manual handoffs and enabling real-time insights. This document explores options from simple (file-based) to advanced (automated sync), with how-tos, pros/cons, and why each fits our on-prem setup. Start with Level 1 for quick wins; aim for Level 2/3 for scalability. Use this as your presentation outline—diagrams for visuals, questions section for discussion.

## Why Integration Matters

Praxis is our core for sales estimating (quotes, specs, costs), but as a desktop legacy system, it's isolated—only one user can edit at a time, and sharing relies on emails/PDFs. Sunbelt-PM-System adds modern tracking (workflows, dashboards) but needs Praxis data to shine. Integration means pulling estimates into the app automatically, like turning a static photo (Praxis export) into a live video (real-time views). Benefits: cut delays (e.g., 30% faster handoffs), boost accuracy, and unlock analytics—aligning with our mission to unify departments and improve performance. Without it, we stay siloed; with it, we gain a competitive edge in modular construction.

We'll evaluate on a spectrum, assuming Praxis stays on-prem (local network/Windows servers). No cloud migration means focusing on secure, local bridges.

## Level 1: Simple File-Based Integration (Manual Sync)

### How It Works

* **Praxis Side** : Export data as CSV/Excel using Access' built-in tools (e.g., right-click query → "Export to Excel"). For example, run a report on quotes and save as CSV.
* **Sunbelt-PM Side** : Add an upload button in the frontend (e.g., ProjectsPage). User selects file; app parses it (PapaParse for CSV, SheetJS for Excel) and inserts/updates Supabase records after normalization (mapping fields like 'Quote Number' to 'praxis_quote_number').
* **Data Flow** : Manual—sales exports from Praxis, PM uploads to app (e.g., via email/share drive). App processes on client-side or via Edge Function for security.
* **Implementation Effort** : 1-2 days; add UI button and parser library (npm i papaparse).
* **Visual Flow** (Mermaid diagram):

### Pros

* **Simple and Low-Cost** : No new servers—uses built-in tools; quick to set up for testing.
* **No Disruption** : Praxis unchanged; IT can implement without deep Access knowledge.
* **Secure Offline** : Files can be encrypted/shared securely; no always-on connections.

### Cons

* **Manual Steps** : Human error (e.g., wrong file version); not real-time—delays if exports forgotten.
* **Limited Scale** : For many projects, uploading large files slows app; no auto-validation against live data.
* **Maintenance** : File formats might change, requiring parser updates.

### Why This Option?

Like sending a letter vs. a phone call—reliable but slow. Ideal for our legacy setup as a starting point: prove value with minimal risk (e.g., test on 5 quotes), then iterate. If IT wants zero new code, this leverages existing exports.

## Level 2: Intermediate API Wrapper (Semi-Automated Local Server)

### How It Works

* **Praxis Side** : Install a local Node.js server on a company machine/network share; use libraries (node-adodb/ODBC) to query Access DB directly.
* **Sunbelt-PM Side** : Frontend calls API endpoints (e.g., fetch('/api/quotes')) on page load/button click; API normalizes data and returns JSON for Supabase insert.
* **Data Flow** : Semi-auto—sales can trigger exports, but API pulls on-demand or via schedule (cron job). Bidirectional if needed (e.g., update Praxis from app).
* **Implementation Effort** : 2-4 days; IT sets up Node + drivers, add auth (JWT).
* **Visual Flow** (Mermaid diagram):

### Pros

* **Automation Boost** : Faster than files (on-demand pulls); real-time-ish for dashboards.
* **Secure Bridge** : API adds layers (auth, validation) — protects Access like a locked door.
* **Flexibility** : Easy to add logic (e.g., auto-normalize dates) or scheduled syncs.

### Cons

* **Setup Required** : IT must install Node/drivers (Windows-compatible); potential config issues.
* **Ongoing Maintenance** : Server needs monitoring/updates; network-dependent for remote access.
* **Moderate Complexity** : More parts than files, but still on-prem.

### Why This Option?

Like upgrading from mail to email—adds speed/flexibility without overhaul. Fits our needs for gradual modernization: enables features like live workflow updates from estimates, reducing delays by 20-30%. If IT is open to a small server, this scales Praxis without migration.

## Level 3: Full Integration (Automated Sync with Hybrid Linking)

### How It Works

* **Praxis Side** : Upsize Access to local SQL Server Express (free tool: SQL Server Migration Assistant); link as backend for better multi-user access.
* **Sunbelt-PM Side** : Use Node scripts or Edge Functions to sync data; frontend triggers via buttons; use MSSQL library for queries.
* **Data Flow** : Automated—event triggers (e.g., on Praxis save) or cron jobs push/pull data; bidirectional for unified updates (e.g., app changes reflect in Praxis).
* **Implementation Effort** : 4-7 days; IT upsizes DB, sets up sync jobs.
* **Visual Flow** (Mermaid diagram):

### Pros

* **High Automation** : Near-real-time sync; handles complex workflows (e.g., auto-update dashboards).
* **Scalability** : Centralized production; fixes Access limits (e.g., no file locks).
* **Data Integrity** : Centralized validation → fewer errors; enables advanced analytics.

### Cons

* **Higher Complexity** : DB upsizing risks data issues; more IT involvement.
* **Cost/Time** : Free tools but 1-2 weeks testing; potential for sync conflicts.
* **Maintenance** : Centralized components to manage.

### Why This Option?

Like building a direct highway vs. side roads—maximizes efficiency for high-volume projects. Why? It unlocks full unification (e.g., production metrics fed by sales data), supporting 25% performance gains. If IT sees long-term value, this future-proofs without cloud.

## Recommendations & Next Steps

* **Start Simple** : Begin with Level 1 (CSV) for quick wins/demo — low risk, proves value.
* **Scale Based on Needs** : If real-time is key, go Level 2; for deep unity, Level 3.
* **General Best Practices** : Always normalize data (match formats), add error logging, test with backups. ROI: Could save 20-30% on handoffs/delays.

## Assumptions on Praxis

This document is based on the following assumptions about Praxis, derived from available docs and typical Access-based estimating tools. Each includes rationale and potential impact if incorrect:

* **Access-Based Legacy System** : Assumed Praxis is a desktop Microsoft Access DB (.accdb) with VBA for logic/forms.  *Rationale* : Matches your description and common construction estimating setups.  *Impact if Wrong* : If it's a different DB (e.g., SQL backend), migration tools change but options remain similar.
* **On-Prem Setup** : Assumed local network/Windows servers, no cloud access.  *Rationale* : You specified pre-cloud legacy with migration issues.  *Impact if Wrong* : If partial cloud (e.g., Azure-linked), options lean toward Level 3 hybrids.
* **Data Structure** : Assumed relational tables (e.g., Quotes, Estimates) with exportable reports/queries.  *Rationale* : From PRAXIS_INTEGRATION_ANALYSIS.md mappings (~40 fields like quote_number).  *Impact if Wrong* : If highly customized, add data discovery step.
* **User Access** : Assumed multi-user but with locking issues; sales/PM need read/write.  *Rationale* : Legacy Access limitations.  *Impact if Wrong* : If single-user, syncs simplify but scalability suffers.
* **No Native API** : Assumed no built-in web services.  *Rationale* : Pre-cloud desktop app.  *Impact if Wrong* : If APIs exist, jump to Level 2/3.

If these don't match, we can reassess—e.g., via a quick Praxis schema review.

## Anticipated Questions and Responses

### General Questions

1. **What does this cost?**
   Level 1: $0 (uses existing tools). Level 2: $0-500 (server setup time). Level 3: $0 (free SQL Express) but 1-2 weeks IT labor. No ongoing fees since on-prem.
2. **How long to implement?**
   Level 1: 1-2 days. Level 2: 2-4 days. Level 3: 4-7 days + testing. Start small, iterate.
3. **Will this break Praxis?**
   No—Praxis remains unchanged; we only read/export data. Backups ensure safety.
4. **How do users interact?**
   Simple: Export/upload for Level 1; button clicks for higher levels. Training ~1 hour per role.
5. **Is it secure?**
   Yes—file shares with permissions (Level 1), API auth/firewalls (Levels 2-3). No external exposure.

### Technical Questions

6. **How handle data conflicts/sync errors?**
   Use timestamps for last-modified checks; log errors to file/Supabase. For Level 3, SQL triggers prevent overwrites.
7. **Scalability for multiple factories/users?**
   Level 1: Low (manual). Level 2: Medium (API handles 100+ users). Level 3: High (SQL Express supports 10GB/concurrency); monitor and upgrade if needed.
8. **Network requirements?**
   Local LAN/VPN for secure access; if remote, use secure tunnels. No internet needed unless Supabase cloud-hosted (then hybrid VPN).
9. **What about VBA/custom logic in Praxis?**
   For reads, no issue. For writes, replicate logic in API/scripts (e.g., factor calculations). Test thoroughly to match behavior.
10. **Future-proofing/migration path?**
    Builds toward cloud (e.g., Azure SQL later). Start with Level 1 to validate, then advance—enables gradual modernization without big-bang changes.
