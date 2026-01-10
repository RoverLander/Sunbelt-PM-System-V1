# Sunbelt PM iOS Mobile App - Implementation Plan

**Created:** January 10, 2026
**Last Updated:** January 10, 2026
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Recommendation](#2-technology-recommendation)
3. [Core Mobile Features](#3-core-mobile-features)
4. [App Architecture](#4-app-architecture)
5. [Push Notifications Strategy](#5-push-notifications-strategy)
6. [Offline Capabilities](#6-offline-capabilities)
7. [Navigation Structure](#7-navigation-structure)
8. [Key Screens](#8-key-screens)
9. [Development Phases](#9-development-phases)
10. [Database Changes Required](#10-database-changes-required)
11. [Key Files to Reuse](#11-key-files-to-reuse)
12. [Team & Resources](#12-team--resources)

---

## 1. Executive Summary

This plan outlines the design and development approach for an iOS mobile app that extends the Sunbelt PM System to field users. The app will prioritize quick access to projects, task updates, and status changes while maintaining synchronization with the existing Supabase backend.

### Goals
- Enable field users to view and update projects/tasks on the go
- Provide push notifications for deadlines and assignments
- Support offline usage with background sync
- Maintain consistency with web app data and workflows

### Timeline
- **Total Duration:** ~18 weeks (4.5 months)
- **MVP Target:** 8 weeks

---

## 2. Technology Recommendation

### Recommended: **React Native with Expo**

| Factor | React Native + Expo | Native Swift/SwiftUI | Flutter |
|--------|---------------------|----------------------|---------|
| **Code Reuse** | High - Share logic with web | None | Low |
| **Supabase Integration** | Excellent - Same JS client | Good - Swift SDK | Good |
| **Team Familiarity** | High - Already uses React | New learning curve | New |
| **Development Speed** | Fast - 3-4 months | Slow - 6-8 months | Medium |
| **Offline Support** | Good with WatermelonDB | Excellent with Core Data | Good |
| **Push Notifications** | Built-in Expo notifications | Native APNs | Plugin-based |

### Key Libraries

```
Core:
- expo ~52.x (managed workflow)
- @supabase/supabase-js ^2.89.0 (same as web)
- react-navigation ^6.x (navigation)
- @tanstack/react-query ^5.x (data fetching/caching)

Offline:
- @react-native-async-storage/async-storage
- @nozbe/watermelondb (SQLite for offline-first)

UI/UX:
- react-native-reanimated (animations)
- react-native-gesture-handler (swipe actions)
- expo-image (optimized images)

Push Notifications:
- expo-notifications
- @react-native-firebase/messaging (FCM/APNs)
```

---

## 3. Core Mobile Features

### Priority 1: MVP (8 weeks)

| Feature | Description | Mobile Optimization |
|---------|-------------|---------------------|
| **Authentication** | Login with biometrics | Face ID/Touch ID, secure keychain |
| **My Projects List** | Quick access to assigned projects | Pull-to-refresh, search, filters |
| **Project Details** | View project info, status, dates | Swipe navigation between tabs |
| **My Tasks** | View and update task status | Swipe to complete, quick status picker |
| **Overdue Alerts** | Badge counts, notifications | Home screen badges, in-app alerts |
| **Quick Status Update** | Change task/RFI status | Bottom sheet action picker |

### Priority 2: Core Features (+4 weeks)

| Feature | Description | Mobile Optimization |
|---------|-------------|---------------------|
| **Calendar View** | Week/month calendar | Native date picker, agenda view |
| **RFI Management** | View, create, update RFIs | Photo attachments from camera |
| **Submittals** | View and track submittals | Document preview |
| **Push Notifications** | Real-time alerts | Deep linking to specific items |
| **Offline Mode** | View cached data offline | Queue updates for sync |

### Priority 3: Advanced Features (+4 weeks)

| Feature | Description | Mobile Optimization |
|---------|-------------|---------------------|
| **Floor Plan Viewer** | View floor plans with markers | Pinch-to-zoom, marker taps |
| **Photo Capture** | Take photos, attach to items | Camera integration, compression |
| **File Downloads** | Download and view attachments | Share sheet integration |
| **Director Dashboard** | Portfolio overview | Charts with victory-native |
| **Search** | Global search across projects | Voice search, recent searches |

### Priority 4: Future Enhancements

- [ ] Offline file caching
- [ ] Document scanning (camera to PDF)
- [ ] Apple Watch companion
- [ ] Widget support
- [ ] Siri shortcuts

---

## 4. App Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │   Screens   │  │  Components  │  │    Navigation     │   │
│  │ (30+ files) │  │ (reusable)   │  │ (Stack + Tabs)    │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                       STATE LAYER                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ React Query │  │    Zustand   │  │   Context API     │   │
│  │ (server)    │  │   (client)   │  │   (auth/theme)    │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │  Supabase   │  │  WatermelonDB│  │   Notification    │   │
│  │  Client     │  │  (offline)   │  │   Service         │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                       PLATFORM LAYER                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │    Expo     │  │   Native     │  │    Device APIs    │   │
│  │   Runtime   │  │   Modules    │  │  (Camera, Files)  │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
/mobile-app
├── /src
│   ├── /app                    # Expo Router file-based routing
│   │   ├── (auth)
│   │   │   ├── login.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── (tabs)
│   │   │   ├── index.tsx       # Dashboard
│   │   │   ├── projects.tsx    # Projects list
│   │   │   ├── tasks.tsx       # My tasks
│   │   │   ├── calendar.tsx    # Calendar
│   │   │   └── more.tsx        # Settings
│   │   ├── project/[id]
│   │   │   ├── index.tsx       # Project overview
│   │   │   ├── tasks.tsx
│   │   │   ├── rfis.tsx
│   │   │   ├── submittals.tsx
│   │   │   ├── calendar.tsx
│   │   │   └── files.tsx
│   │   ├── task/[id].tsx
│   │   ├── rfi/[id].tsx
│   │   └── submittal/[id].tsx
│   │
│   ├── /components
│   │   ├── /common
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── PriorityBadge.tsx
│   │   │   ├── DateDisplay.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Card.tsx
│   │   ├── /project
│   │   │   ├── ProjectCard.tsx
│   │   │   └── ProjectHeader.tsx
│   │   ├── /task
│   │   │   ├── TaskRow.tsx
│   │   │   ├── TaskStatusPicker.tsx
│   │   │   └── TaskKanban.tsx
│   │   └── /modals
│   │       ├── StatusUpdateSheet.tsx
│   │       └── QuickAddSheet.tsx
│   │
│   ├── /hooks
│   │   ├── useProjects.ts
│   │   ├── useTasks.ts
│   │   ├── useRFIs.ts
│   │   ├── useAuth.ts
│   │   ├── useOffline.ts
│   │   └── usePushNotifications.ts
│   │
│   ├── /services
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   ├── sync.ts
│   │   └── notifications.ts
│   │
│   ├── /stores
│   │   ├── authStore.ts
│   │   ├── offlineStore.ts
│   │   └── uiStore.ts
│   │
│   ├── /utils                  # Shared from web app
│   │   ├── dateUtils.ts
│   │   ├── statusUtils.ts
│   │   ├── currencyUtils.ts
│   │   └── workflowUtils.ts
│   │
│   ├── /theme
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   │
│   └── /types
│       ├── database.ts
│       ├── navigation.ts
│       └── api.ts
│
├── app.json
├── package.json
├── tsconfig.json
└── eas.json                    # EAS Build configuration
```

---

## 5. Push Notifications Strategy

### Notification Categories

| Category | Trigger | Priority | Deep Link |
|----------|---------|----------|-----------|
| **Task Assigned** | New task assigned | High | `/task/{id}` |
| **Task Due Today** | Daily at 8 AM | High | `/tasks?filter=due_today` |
| **Task Overdue** | When past due date | Critical | `/task/{id}` |
| **RFI Assigned** | New RFI requiring response | High | `/rfi/{id}` |
| **RFI Response** | Answer posted | Medium | `/rfi/{id}` |
| **Submittal Changed** | Approval/rejection | Medium | `/submittal/{id}` |
| **Deadline Warning** | 3 days before milestone | High | `/project/{id}/workflow` |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│         Database Trigger (on INSERT/UPDATE)                  │
│                    → Calls Edge Function                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 SUPABASE EDGE FUNCTION                       │
│  1. Determine notification type                              │
│  2. Look up user's FCM/APNs token                            │
│  3. Call Firebase Cloud Messaging API                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        FCM / APNs                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      iOS APP                                 │
│  - Display notification                                      │
│  - Update badge count                                        │
│  - Deep link to relevant screen on tap                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Offline Capabilities

### Strategy: Optimistic Updates with Background Sync

```
User Action → Local Update → Queue for Sync
                  │                │
                  ▼                ▼
           UI Updates       Pending Changes
           Immediately      Stored in SQLite
                                  │
                     When Online  │
                           ◄──────┘
                           │
                           ▼
                    Sync Service
                    Processes Queue
                           │
                    Success │ Failure
                       │        │
                       ▼        ▼
                   Confirm   Retry/Conflict
                   & Remove  Resolution
```

### Data Caching Strategy

| Data Type | Cache Strategy | Expiry | Offline Action |
|-----------|---------------|--------|----------------|
| **My Projects** | Eager cache | 5 min | Read-only |
| **My Tasks** | Eager cache | 2 min | Status updates queued |
| **Project Details** | On-demand | 10 min | Read-only |
| **RFIs** | On-demand | 10 min | Status updates queued |
| **Submittals** | On-demand | 10 min | Status updates queued |
| **Users List** | Background | 1 hour | Read-only |
| **Attachments** | On-demand | 24 hours | Download for offline |

### Conflict Resolution

- Compare local timestamp with server `updated_at`
- If server is newer: Show conflict UI to user
- If local is newer: Apply change
- If same: Skip (already synced)

---

## 7. Navigation Structure

### Tab-Based Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                      TAB BAR (5 tabs)                        │
├─────────────┬────────────┬────────────┬──────────┬──────────┤
│  Dashboard  │  Projects  │   Tasks    │ Calendar │   More   │
│     🏠      │     📁     │     ✓      │    📅    │    ≡    │
└─────────────┴────────────┴────────────┴──────────┴──────────┘
```

### Navigation Stacks

**Dashboard Tab:**
```
Dashboard Home
├── Project Details (push)
│   └── Task/RFI/Submittal Detail (push)
└── All Overdue Items (push)
```

**Projects Tab:**
```
Projects List
└── Project Details (push)
    ├── Tasks Tab
    ├── RFIs Tab
    ├── Submittals Tab
    ├── Calendar Tab
    ├── Files Tab
    └── Floorplan Tab
```

**Tasks Tab:**
```
My Tasks (with filters)
└── Task Detail (push)
```

**More Tab:**
```
Settings & More
├── Profile
├── Notifications Settings
├── Offline Data
└── Sign Out
```

### Modal Sheets
- Quick Status Update (bottom sheet)
- Add Task (full-screen modal)
- Add RFI (full-screen modal)
- Camera Capture (native camera)
- File Picker (native document picker)

---

## 8. Key Screens

### Screen Inventory (30+ screens)

| Screen | Purpose | Key Actions |
|--------|---------|-------------|
| **Login** | Authentication | Email/password, biometrics |
| **Dashboard** | Overview | View overdue, due today, quick actions |
| **Projects List** | Browse projects | Search, filter, sort |
| **Project Detail** | Project overview | View stats, navigate tabs |
| **Project Tasks** | Tasks within project | Kanban, list view, add task |
| **Project RFIs** | RFIs for project | View, filter, add RFI |
| **Project Submittals** | Submittals | View, filter |
| **Project Calendar** | Calendar | Week/month view |
| **Project Files** | Attachments | View, download, upload |
| **Project Floorplan** | Floor plan viewer | Zoom, tap markers |
| **My Tasks** | All user's tasks | Filter, search, bulk update |
| **Task Detail** | Single task | Edit, update status, add files |
| **RFI Detail** | Single RFI | View, respond, attachments |
| **Submittal Detail** | Single submittal | View, track status |
| **Calendar** | Global calendar | Week/month, agenda |
| **Profile** | User settings | Edit profile, preferences |
| **Notifications** | History | View, mark read, deep link |
| **Settings** | App settings | Theme, notifications, offline |

### Wireframe: Dashboard

```
┌─────────────────────────────────────────┐
│ ≡  My Dashboard            🔔 (badge: 3)│
├─────────────────────────────────────────┤
│                                         │
│  Good morning, John!                    │
│  You have 2 overdue items               │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🔴 OVERDUE (2)              > All │  │
│  │  ├─ Review drawings     2d late   │  │
│  │  └─ Color selection     1d late   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🟡 DUE TODAY (3)            > All │  │
│  │  ├─ Submit RFI-042               │  │
│  │  ├─ Call dealer                  │  │
│  │  └─ Review submittal             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ACTIVE PROJECTS (4)         > All │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ 🟢 PRJ-2024-001             │  │  │
│  │  │ Downtown Medical           │  │  │
│  │  │ 12 tasks • 3 RFIs          │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  🏠     📁     ✓     📅     ≡          │
└─────────────────────────────────────────┘
```

### Wireframe: Task Detail

```
┌─────────────────────────────────────────┐
│ ← Task            ✏️ Edit    ⋮ More     │
├─────────────────────────────────────────┤
│                                         │
│  Review Drawing Package                 │
│  PRJ-2024-001 • Downtown Medical        │
│                                         │
│  ┌───────────┐  ┌───────────┐           │
│  │In Progress│  │   High    │           │
│  │   (tap)   │  │ Priority  │           │
│  └───────────┘  └───────────┘           │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  📅 Due Date         Jan 15, 2026      │
│  👤 Assignee         Sarah Miller       │
│  🎯 Milestone        Phase 1 Complete   │
│  📍 Workflow         Drawings (65%)     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  DESCRIPTION                            │
│  Review the 65% drawing package and     │
│  provide comments by end of week.       │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ATTACHMENTS (2)                        │
│  ┌───────────────────────────────────┐  │
│  │ 📄 Drawing_Package_65.pdf   12MB  │  │
│  │ 📄 Review_Checklist.docx    124KB │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │     📷 Add Photo   📎 Add File     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         ✓ Mark Complete            │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. Development Phases

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Basic app shell with authentication and project viewing

- [ ] Project setup with Expo and TypeScript
- [ ] Supabase client configuration
- [ ] Authentication flow (login, logout, biometrics)
- [ ] Navigation setup (tabs + stacks)
- [ ] Theme system (light/dark mode)
- [ ] Basic screens: Dashboard, Projects List, Project Detail
- [ ] Pull-to-refresh and loading states

**Deliverable:** Authenticated users can view their projects

---

### Phase 2: Task Management (Weeks 5-8)

**Goal:** Full task management with status updates

- [ ] My Tasks screen with filters
- [ ] Task Detail screen
- [ ] Status update bottom sheet
- [ ] Task creation modal
- [ ] Kanban view for project tasks
- [ ] RFI list and detail screens
- [ ] Submittal list and detail screens
- [ ] React Query setup for caching

**Deliverable:** Users can view and update tasks, RFIs, submittals

---

### Phase 3: Offline & Notifications (Weeks 9-12)

**Goal:** Offline support and push notifications

- [ ] AsyncStorage for basic caching
- [ ] WatermelonDB for offline database
- [ ] Sync service for pending changes
- [ ] Conflict resolution UI
- [ ] Push notification setup (Expo + FCM)
- [ ] Supabase Edge Functions for notification triggers
- [ ] Deep linking from notifications
- [ ] Badge count management

**Deliverable:** App works offline; users receive push notifications

---

### Phase 4: Advanced Features (Weeks 13-16)

**Goal:** Complete feature set

- [ ] Calendar view (week/month)
- [ ] File management (view, download, upload)
- [ ] Camera integration for photos
- [ ] Floor plan viewer with markers
- [ ] Director dashboard (if role permits)
- [ ] Global search
- [ ] Profile and settings screens
- [ ] App Store submission preparation

**Deliverable:** Full-featured app ready for App Store

---

### Phase 5: Polish & Launch (Weeks 17-18)

**Goal:** Final polish and release

- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Error tracking (Sentry)
- [ ] Analytics (Amplitude/Mixpanel)
- [ ] TestFlight beta testing
- [ ] App Store submission
- [ ] Documentation

**Deliverable:** App live on App Store

---

## 10. Database Changes Required

### New Table: Push Tokens

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform VARCHAR NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- Index for quick lookups
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;
```

### Database Trigger for Notifications

```sql
-- Trigger for task assignment notifications
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND
     (OLD.assignee_id IS NULL OR OLD.assignee_id != NEW.assignee_id) THEN

    PERFORM net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/send-push',
      body := json_build_object(
        'user_id', NEW.assignee_id,
        'type', 'task_assigned',
        'title', 'New Task Assigned',
        'body', NEW.title,
        'data', json_build_object('task_id', NEW.id, 'project_id', NEW.project_id)
      )::text,
      headers := '{"Content-Type": "application/json"}'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_task_assignment
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION notify_task_assignment();
```

---

## 11. Key Files to Reuse

From the existing web app, these files can be directly reused or adapted:

| Web App File | Mobile Usage |
|--------------|--------------|
| `src/utils/supabaseClient.js` | Adapt for React Native with AsyncStorage |
| `src/utils/calendarUtils.js` | Reuse date formatting logic |
| `src/utils/workflowUtils.js` | Reuse workflow calculations |
| `src/context/AuthContext.jsx` | Adapt auth flow pattern |
| Database types | Generate from Supabase schema |

### Supabase Client for React Native

```typescript
// services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## 12. Team & Resources

### Recommended Team

| Role | Allocation | Responsibilities |
|------|------------|------------------|
| Senior React Native Developer | Full-time | App development, architecture |
| Backend Developer | Part-time | Edge Functions, DB triggers |
| UI/UX Designer | Part-time | Mobile-specific designs |
| QA Tester | Part-time → Full-time | Testing, App Store review |

### Infrastructure Costs (Estimated)

| Service | Cost | Notes |
|---------|------|-------|
| Apple Developer Account | $99/year | Required for App Store |
| Firebase (FCM) | Free tier | Push notifications |
| Expo EAS Build | $99/month | CI/CD for builds |
| Sentry | Free tier | Error tracking |

### App Store Requirements

- [ ] Apple Developer Account
- [ ] App icons (1024x1024)
- [ ] Screenshots for all device sizes
- [ ] Privacy policy URL
- [ ] App description and keywords
- [ ] Age rating questionnaire

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-10 | 1.0 | Initial plan created |

---

## Notes

_Add ongoing notes, decisions, and updates here as development progresses._

