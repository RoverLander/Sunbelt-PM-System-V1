# Sunbelt PM - Project Roadmap
## Updated: January 9, 2026 (Evening)

---

## 🎯 Vision Statement

Transform Sunbelt Modular's project management from fragmented Access databases and spreadsheets into a unified, role-based web application that provides real-time visibility, streamlined workflows, and actionable insights across all levels of the organization.

---

## 📊 Roadmap Overview

```
Phase 1: Stabilization     ██████████  [Jan 8-9]     ✅ COMPLETE
Phase 2: IT Dashboard      ██████████  [Jan 10-17]   ✅ COMPLETE  
Phase 3: Core Polish       ██████░░░░  [Jan 18-24]   🔄 IN PROGRESS
Phase 4: New Dashboards    ░░░░░░░░░░  [Jan 25-31]   📋 Planned
Phase 5: Advanced Features ░░░░░░░░░░  [Feb 1-14]    📋 Planned
Phase 6: Praxis Migration  ░░░░░░░░░░  [Feb 15-28]   📋 Planned
Phase 7: External Access   ░░░░░░░░░░  [Mar 1-15]    📋 Planned
Phase 8: Mobile & Field    ░░░░░░░░░░  [Mar 16-31]   📋 Planned
```

---

## ✅ Phase 1: Stabilization (Jan 8-9) - COMPLETE

### Bug Fixes
| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 3 | RFI creation error (missing columns) | 🔴 Critical | ✅ Fixed |
| 1 | PM Dashboard shows all projects | 🔴 Critical | ✅ Fixed |
| 10 | Candy defaults to wrong dashboard | 🔴 Critical | ✅ Fixed |
| 11 | Candy can access VP dashboard | 🔴 Critical | ✅ Fixed |
| - | RFI due date mandatory | 🟡 Important | ✅ Fixed |
| - | Modal button styling | 🟡 Important | ✅ Fixed |
| - | Sidebar stats not loading (VP/Director/IT) | 🔴 Critical | ✅ Fixed |
| - | VP stats 400 error (bad column) | 🔴 Critical | ✅ Fixed |
| - | ProjectsPage PM filter incomplete | 🟡 Important | ✅ Fixed |
| - | ProjectsPage Factory filter incomplete | 🟡 Important | ✅ Fixed |

---

## ✅ Phase 2: IT Dashboard (Jan 10-17) - COMPLETE

### 2.1 Database Setup ✅
- [x] audit_log table
- [x] system_settings table
- [x] error_log table
- [x] feature_flags table
- [x] user_sessions table
- [x] User table modifications (last_login, login_count, etc.)

### 2.2 User Management ✅
- [x] User list with search/filter
- [x] Create new users
- [x] Edit existing users
- [x] Deactivate users (soft delete)
- [x] Role assignment
- [x] Password reset trigger

### 2.3 System Health ✅
- [x] Database connection status
- [x] Table row counts
- [x] Storage usage display
- [x] Active sessions count
- [x] Recent errors summary

### 2.4 Audit Log ✅
- [x] View all system changes
- [x] Filter by user/action/table
- [x] Timestamp display
- [x] Change details (old/new values)

### 2.5 IT Sidebar ✅
- [x] IT-specific navigation
- [x] System status indicator
- [x] User/Project counts
- [x] Active users display

---

## 🔄 Phase 3: Core Polish (Jan 18-24) - IN PROGRESS

### 3.1 Completed Today (Jan 9)
| Task | Description | Status |
|------|-------------|--------|
| Calendar Fixed Width | Cells no longer shift with content | ✅ Done |
| Calendar Export | ICS export buttons on all views | ✅ Done |
| Project Calendar Tab | Calendar tab works, shows month view | ✅ Done |
| Project Overview Calendar | Week view on Overview tab | ✅ Done |
| Sidebar Nav Per Role | Correct pages for each dashboard type | ✅ Done |
| Sidebar Nav Order | Role-specific pages first | ✅ Done |
| Sidebar Compact Stats | Fits 1080p without scrolling | ✅ Done |
| VP Reports Route | Reports page accessible | ✅ Done |
| IT Users Route | User Management accessible | ✅ Done |

### 3.2 Remaining Bug Fixes
| Task | Description | Status |
|------|-------------|--------|
| Secondary PM Edit | Add to Edit Project modal | 🔲 Pending |
| Status Squares | Fix counts on Projects page | 🔲 Pending |

### 3.3 UI Improvements
| Task | Description | Status |
|------|-------------|--------|
| Tasks Page Kanban | Add Kanban view with list/board toggle | 🔲 Pending |
| Wider Pages | Expand RFIs, Submittals, Projects width | 🔲 Pending |
| Projects Filter | Default to "My Projects" for PMs | 🔲 Pending |

### 3.4 Login Screen Enhancement (Claude Code)
| Task | Description | Status |
|------|-------------|--------|
| Center Login | Center form on window | 🔲 Assigned |
| Logo Assembly | Sunbelt logo + factory ring | 🔲 Assigned |
| Ring Animation | Slow rotation idle state | 🔲 Assigned |
| Login Animation | Random Convergence/Launch | 🔲 Assigned |

---

## 📋 Phase 4: New Dashboards (Jan 25-31)

### 4.1 Project Coordinator Dashboard
```
Focus: Task execution support across multiple PMs

Features:
- Cross-project task list (all projects they're assigned to)
- Today's tasks / This week's tasks
- Task completion tracking
- Deadline calendar
- Quick task status updates
- Support request queue
```

### 4.2 Plant Manager Dashboard
```
Focus: Factory production and delivery

Features:
- Factory-filtered project view
- Production schedule timeline
- Delivery calendar
- Module tracking
- Factory capacity overview
- Quality metrics
```

---

## 📋 Phase 5: Advanced Features (Feb 1-14)

### 5.1 IT Admin Features (Future)
| Feature | Description | Priority |
|---------|-------------|----------|
| **Manage Permissions** | Override default role permissions per user | 🟡 Medium |
| **System Settings** | Company branding, defaults, notification config | 🟡 Medium |
| Feature Flags UI | Enable/disable features from dashboard | 🟢 Low |
| Session Management | View/terminate active sessions | 🟢 Low |
| Error Log Viewer | Detailed error inspection | 🟢 Low |

### 5.2 Workflow Automation
| Feature | Description |
|---------|-------------|
| Email Notifications | Auto-send on status changes |
| Reminder System | Due date approaching alerts |
| Escalation Rules | Auto-escalate overdue items |
| Template Library | Reusable RFI/Submittal templates |

### 5.3 Reporting
| Feature | Description |
|---------|-------------|
| Custom Reports | Build-your-own report builder |
| Scheduled Reports | Auto-generate weekly/monthly |
| PDF Export | Professional formatted reports |
| Dashboard Snapshots | Point-in-time captures |

---

## 📋 Phase 6: Praxis Migration (Feb 15-28)

### Data Import
- [ ] Project data import from Praxis
- [ ] Historical task/RFI/submittal migration
- [ ] File attachment migration
- [ ] User mapping

### Integration
- [ ] Read-only sync from Praxis
- [ ] Gradual cutover plan
- [ ] Data validation tools

---

## 📋 Phase 7: External Access (Mar 1-15)

### Client Portal
- [ ] Limited client login
- [ ] Project status view
- [ ] RFI response capability
- [ ] Submittal approval workflow
- [ ] Document access

### Dealer Portal
- [ ] Dealer-specific views
- [ ] Quote/PO tracking
- [ ] Communication history

---

## 📋 Phase 8: Mobile & Field (Mar 16-31)

### Mobile Optimization
- [ ] Responsive design improvements
- [ ] Touch-friendly controls
- [ ] Offline capability
- [ ] Photo capture for issues

### Field Features
- [ ] Site check-in
- [ ] Punch list management
- [ ] Photo documentation
- [ ] GPS location tagging

---

## 🗓️ Session Log

### Jan 9, 2026 - Evening Session
**Completed:**
1. ✅ Calendar fixed-width cells (all views)
2. ✅ Calendar export buttons (ICS)
3. ✅ Project Details Calendar tab working
4. ✅ Project Overview week calendar
5. ✅ Sidebar nav per role (correct pages)
6. ✅ Sidebar nav order (role-specific first)
7. ✅ Sidebar compact stats (1080p friendly)
8. ✅ VP Reports route
9. ✅ IT Users route
10. ✅ Sidebar width 280px → 260px

**Files Modified:**
- `Sidebar.jsx` - Complete rewrite of stats + nav
- `App.jsx` - Added VP reports, IT users routes, fixed margin
- `ProjectDetails.jsx` - Calendar tab + Overview calendar
- `CalendarWeekView.jsx` - Fixed width + export
- `ProjectCalendarMonth.jsx` - NEW
- `ProjectCalendarWeek.jsx` - NEW

**Assigned to Claude Code:**
- Login screen centering
- Animated factory logo ring
- Random login animations (Convergence/Launch)

---

### Jan 8, 2026 - Late Night Session
**Completed:**
1. ✅ Fixed Sidebar VP/Director/IT stats not loading
2. ✅ Fixed VP stats 400 error
3. ✅ Fixed ProjectsPage PM filter
4. ✅ Fixed ProjectsPage Factory filter

**Files Modified:**
- `Sidebar.jsx`
- `ProjectsPage.jsx`

---

## 📝 Technical Debt

| Item | Description | Priority |
|------|-------------|----------|
| File Tables | 3 tables (attachments, file_attachments, files) - consolidate | Low |
| Project Columns | Redundant: factory+factory_id, dealer+dealer_name | Low |
| On-Time Rate | Needs actual_completion_date column to calculate properly | Medium |
| RLS Policies | Some tables may need tighter security | Medium |

---

## 🎯 Next Session Priorities

### Matthew (Claude Projects)
1. **Secondary PM in Edit Project Modal** - Critical bug
2. **Status Squares Fix** - Projects page showing wrong counts
3. **Tasks Page Kanban Toggle** - Feature completion

### Claude Code (Parallel)
1. **Login Screen** - Centered, animated logo ring
2. **Login Animations** - Convergence + Launch (random)

---

## 📞 Stakeholders

| Name | Role | Interest |
|------|------|----------|
| Matthew McDaniel | Developer/PM | System architecture, features |
| Candy Schrader | Director | Portfolio oversight, team management |
| Devin Duvak | VP | Executive visibility, analytics |
| Joy | IT | System administration |
