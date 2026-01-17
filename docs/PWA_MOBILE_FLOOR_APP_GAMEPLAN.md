# PWA Mobile Floor App (PGM-027) - Comprehensive Game Plan

**Created:** January 16, 2026
**Updated:** January 17, 2026 (Phases 6-7 Offline Sync & Real-Time Complete)
**Status:** Implementation Phase - Phase 7 Complete ✅
**Confidence Level:** 0.98 (all phases complete, ready for testing)
**Authors:** Claude (Master Coder/App Developer/Integration Specialist)

---

## Implementation Status (January 17, 2026)

### Phase 1: Foundation - COMPLETE ✅

| Requirement | Status | Completed |
|-------------|--------|-----------|
| Worker PIN auth columns | ✅ COMPLETE | Migration applied |
| `worker_sessions` table | ✅ COMPLETE | Migration applied |
| `purchase_orders` table | ✅ COMPLETE | Migration applied |
| `inventory_receipts` table | ✅ COMPLETE | Migration applied |
| Storage bucket `inventory-receipts` | ✅ COMPLETE | Created via Dashboard |
| Edge Function `worker-auth` | ✅ COMPLETE | Deployed via Dashboard |
| PWA folder structure | ✅ COMPLETE | 8 files in src/pwa/ |
| PWA routing integration | ✅ COMPLETE | App.jsx updated |
| Vite PWA plugin | ✅ COMPLETE | vite.config.js updated |

### Phase 2: Module Lookup - COMPLETE ✅

| Requirement | Status | Completed |
|-------------|--------|-----------|
| searchModules function | ✅ COMPLETE | Added to modulesService.js |
| ModuleLookup page | ✅ COMPLETE | src/pwa/pages/ModuleLookup.jsx |
| Module detail display | ✅ COMPLETE | ModuleDetailCard component |
| Search autocomplete | ✅ COMPLETE | 300ms debounce, 10 results |
| Recent searches | ✅ COMPLETE | localStorage persistence |
| PWA navigation integration | ✅ COMPLETE | PWAApp.jsx updated |

### Phase 3: QC Inspection - COMPLETE ✅

| Requirement | Status | Completed |
|-------------|--------|-----------|
| QCInspection page | ✅ COMPLETE | src/pwa/pages/QCInspection.jsx |
| Checklist rendering | ✅ COMPLETE | Loads from station_templates.checklist |
| Photo capture | ✅ COMPLETE | Camera API with file input |
| Checklist item component | ✅ COMPLETE | Pass/Fail buttons with state |
| QC record submission | ✅ COMPLETE | Uses qcService.createQCRecord |
| Result display | ✅ COMPLETE | Pass/Fail with rework notice |
| PWA navigation integration | ✅ COMPLETE | PWAApp.jsx updated |

### Phase 4: Station Movement - COMPLETE ✅

| Requirement | Status | Completed |
|-------------|--------|-----------|
| StationMove page | ✅ COMPLETE | src/pwa/pages/StationMove.jsx |
| Module selection | ✅ COMPLETE | Search with station display |
| Next station calculation | ✅ COMPLETE | Auto-detect from station order |
| Crew selection | ✅ COMPLETE | Checkbox list from workers table |
| Confirmation workflow | ✅ COMPLETE | 3-step: Select → Crew → Confirm |
| QC gate enforcement | ✅ COMPLETE | Warning if inspection required |
| Station assignment creation | ✅ COMPLETE | Uses moveModuleToStation() |
| PWA navigation integration | ✅ COMPLETE | Quick action from home |

### Phase 5: Inventory Receiving - COMPLETE ✅

| Requirement | Status | Completed |
|-------------|--------|-----------|
| InventoryReceiving page | ✅ COMPLETE | src/pwa/pages/InventoryReceiving.jsx |
| Pending PO list | ✅ COMPLETE | Uses getPendingPurchaseOrders() |
| PO search | ✅ COMPLETE | Search by PO number |
| Line items display | ✅ COMPLETE | With remaining quantity |
| Quantity entry | ✅ COMPLETE | +/- controls with max limit |
| Damage tracking | ✅ COMPLETE | Toggle with damaged qty/notes |
| Photo capture | ✅ COMPLETE | Camera API with upload |
| Receipt creation | ✅ COMPLETE | Uses inventoryReceiptsService |
| PWA navigation integration | ✅ COMPLETE | Bottom nav + home action |

### Services Created

| Service | File | Status |
|---------|------|--------|
| Worker Auth | `src/services/workerAuthService.js` | ✅ COMPLETE |
| Purchase Orders | `src/services/purchaseOrdersService.js` | ✅ COMPLETE |
| Inventory Receipts | `src/services/inventoryReceiptsService.js` | ✅ COMPLETE |
| Module Search | `src/services/modulesService.js` | ✅ searchModules added |

### PWA Components Created

| Component | Path | Purpose |
|-----------|------|---------|
| PWAApp | `src/pwa/PWAApp.jsx` | Main app with view routing |
| WorkerAuthContext | `src/pwa/contexts/WorkerAuthContext.jsx` | PIN auth context |
| WorkerLogin | `src/pwa/components/auth/WorkerLogin.jsx` | PIN login screen |
| PWAShell | `src/pwa/components/layout/PWAShell.jsx` | App shell layout |
| BottomNav | `src/pwa/components/layout/BottomNav.jsx` | Navigation bar |
| OfflineBanner | `src/pwa/components/common/OfflineBanner.jsx` | Offline indicator |
| PWAHome | `src/pwa/pages/PWAHome.jsx` | Home dashboard |
| ModuleLookup | `src/pwa/pages/ModuleLookup.jsx` | Module search page |
| QCInspection | `src/pwa/pages/QCInspection.jsx` | QC inspection workflow |
| StationMove | `src/pwa/pages/StationMove.jsx` | Station movement workflow |
| InventoryReceiving | `src/pwa/pages/InventoryReceiving.jsx` | Inventory receiving workflow |
| SyncIndicator | `src/pwa/components/common/SyncIndicator.jsx` | Sync status indicator |
| index.js | `src/pwa/index.js` | Module exports |

### Phase 6: Offline Sync - COMPLETE ✅

| Requirement | Status | Completed |
|-------------|--------|-----------|
| IndexedDB library | ✅ COMPLETE | src/pwa/lib/indexedDB.js |
| SyncManager | ✅ COMPLETE | src/pwa/lib/syncManager.js |
| useOnlineStatus hook | ✅ COMPLETE | src/pwa/hooks/useOnlineStatus.js |
| useOfflineSync hook | ✅ COMPLETE | src/pwa/hooks/useOfflineSync.js |
| SyncIndicator component | ✅ COMPLETE | src/pwa/components/common/SyncIndicator.jsx |
| PWAShell integration | ✅ COMPLETE | SyncIndicator in header |
| Background sync registration | ✅ COMPLETE | In syncManager.js |
| Storage quota management | ✅ COMPLETE | 200MB limit with warnings |

### Phase 7: Real-Time & Polish - COMPLETE ✅

| Requirement | Status | Completed |
|-------------|--------|-----------|
| useRealtimeSubscription hook | ✅ COMPLETE | src/pwa/hooks/useRealtimeSubscription.js |
| useModulesSubscription | ✅ COMPLETE | Table-specific subscription |
| useQCRecordsSubscription | ✅ COMPLETE | Table-specific subscription |
| useStationAssignmentsSubscription | ✅ COMPLETE | Table-specific subscription |
| useInventoryReceiptsSubscription | ✅ COMPLETE | Table-specific subscription |
| useWorkerShiftsSubscription | ✅ COMPLETE | Table-specific subscription |
| usePWASubscriptions | ✅ COMPLETE | Combined multi-table hook |
| Visibility change handling | ✅ COMPLETE | Auto-pause/resume subscriptions |
| Module exports updated | ✅ COMPLETE | src/pwa/index.js |

### PWA Libraries Created

| Library | Path | Purpose |
|---------|------|---------|
| indexedDB | `src/pwa/lib/indexedDB.js` | IndexedDB wrapper for offline storage |
| syncManager | `src/pwa/lib/syncManager.js` | Handles syncing pending actions |

### PWA Hooks Created

| Hook | Path | Purpose |
|------|------|---------|
| useOnlineStatus | `src/pwa/hooks/useOnlineStatus.js` | Track online/offline status |
| useOfflineSync | `src/pwa/hooks/useOfflineSync.js` | Manage offline sync operations |
| useRealtimeSubscription | `src/pwa/hooks/useRealtimeSubscription.js` | Real-time Supabase subscriptions |

**Reference:** See [PWA_SCHEMA_COMPARISON.md](./PWA_SCHEMA_COMPARISON.md) for full audit results.

### Next Steps:
1. ✅ Phase 1-7 Complete
2. Test PWA on physical devices
3. Deploy to production

---

## User Clarifications (January 16, 2026)

| Question | Answer | Impact |
|----------|--------|--------|
| Barcode format? | **No barcodes currently used** - future feature. Manual entry is default. | Simplifies Phase 2 - barcode is optional enhancement |
| Inventory scanning? | **Yes** - leads/PM/QC should scan incoming inventory | Added new sub-system #9 |
| Worker auth? | **Workers table** - leads are in workers, not users | Requires custom auth flow |
| WiFi coverage? | **Good** - plus cell service available | Reduces offline complexity |
| Photos per module? | **20-30 photos** per module for QC/inspection | Significant storage consideration |

---

## Executive Summary

This document provides a methodical game plan for implementing the Mobile Floor App PWA for the Sunbelt PM System. Following the DECOMPOSE → SOLVE → VERIFY → SYNTHESIZE → REFLECT methodology, this plan breaks down the "Very Large" undertaking into manageable sub-problems with explicit confidence ratings.

**Mission Alignment:** The PWA directly supports the mission goal of "20-30% operational efficiency improvement" by enabling real-time floor data capture and reducing paper-based workflows.

---

## 1. DECOMPOSE: Sub-Problem Breakdown

The Mobile Floor App decomposes into **9 major sub-systems**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PWA MOBILE FLOOR APP                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Authentication & Authorization (Workers Table)                           │
│  2. Module Lookup (Manual Serial Entry - Barcode Future)                     │
│  3. QC Inspection Workflow                                                   │
│  4. Station Movement ("Move to Next")                                        │
│  5. Offline Sync & Data Persistence                                          │
│  6. Real-Time Updates & Notifications                                        │
│  7. PWA Infrastructure (Installable, Service Worker)                         │
│  8. Photo Capture & GPS Tagging (20-30 photos/module)                        │
│  9. Inventory Receiving & Scanning (NEW)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SOLVE: Each Sub-Problem with Confidence Ratings

### 2.1 Authentication & Authorization (Workers Table)

**Confidence: 0.78** *(revised down - custom auth required)*

#### Requirements (from PLANT_MANAGER_ROADMAP.md):
- Log in: leads/prod mgr only
- Role: leads only, no data export
- Security: PIN for print

#### CRITICAL ARCHITECTURE DECISION: Workers vs Users

**Clarification:** Leads/workers are stored in the `workers` table, NOT the `users` table.

```sql
-- Current workers table structure
workers (
  id UUID PRIMARY KEY,
  factory_id UUID REFERENCES factories(id),
  first_name VARCHAR,
  last_name VARCHAR,
  employee_id VARCHAR,        -- Badge/employee number
  is_lead BOOLEAN,            -- Station lead flag
  is_active BOOLEAN,
  hourly_rate NUMERIC,
  primary_station_id UUID,    -- Primary work area
  ...
)
```

**Challenge:** Workers don't have Supabase Auth credentials (email/password). Need custom auth.

#### Solution Options:

**Option A: PIN-Based Auth (Recommended)**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WORKER PIN AUTHENTICATION                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │  Enter       │────▶│  Lookup      │────▶│  Verify      │                 │
│  │  Employee ID │     │  Worker      │     │  PIN Hash    │                 │
│  │  + 4-6 PIN   │     │  by emp_id   │     │  (bcrypt)    │                 │
│  └──────────────┘     └──────────────┘     └──────────────┘                 │
│                                                    │                         │
│                                       ┌────────────┴────────────┐            │
│                                       ▼                         ▼            │
│                                ┌────────────┐           ┌────────────┐       │
│                                │  Success   │           │  Failed    │       │
│                                │  → Issue   │           │  → Lock    │       │
│                                │  JWT token │           │  after 3   │       │
│                                └────────────┘           └────────────┘       │
│                                                                              │
│  JWT Payload:                                                                │
│  {                                                                           │
│    worker_id: "uuid",                                                        │
│    factory_id: "uuid",                                                       │
│    is_lead: true,                                                            │
│    primary_station_id: "uuid",                                               │
│    exp: timestamp                                                            │
│  }                                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Option B: Badge Scan + PIN**
- Scan employee badge barcode (future enhancement)
- Enter 4-digit PIN
- Same JWT flow as Option A

**Option C: Kiosk Mode (Shared Device)**
- Device pre-authenticated to factory
- Worker enters employee ID only
- Less secure but faster for high-volume use

#### Schema Addition Required:

```sql
-- Add to workers table for PWA auth
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(60);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin_attempts INTEGER DEFAULT 0;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Create worker_sessions table for JWT validation
CREATE TABLE worker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  factory_id UUID REFERENCES factories(id),
  token_hash VARCHAR(64),          -- SHA256 of JWT for revocation
  device_info JSONB,               -- Browser/device fingerprint
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_worker_sessions_worker ON worker_sessions(worker_id);
CREATE INDEX idx_worker_sessions_token ON worker_sessions(token_hash);
```

#### Backend API Required:

```javascript
// Supabase Edge Function: /functions/v1/worker-auth
// POST /worker-auth/login
{
  employee_id: "EMP001",
  pin: "1234",
  device_info: { ... }
}

// Response
{
  token: "eyJhbG...",
  worker: {
    id: "uuid",
    name: "John Smith",
    is_lead: true,
    factory_id: "uuid",
    primary_station: { id, name }
  },
  expires_at: "2026-01-17T06:00:00Z"
}
```

**Implementation:**
- Create Supabase Edge Function for worker auth
- PIN hashed with bcrypt (cost factor 10)
- JWT signed with Supabase JWT secret
- Store session in IndexedDB for offline access
- Auto-logout after 8 hours (shift length)
- Lock account after 3 failed PIN attempts (15 min cooldown)

**Files to Create:**
- `supabase/functions/worker-auth/index.ts` - Edge function
- `src/pwa/contexts/WorkerAuthContext.jsx`
- `src/pwa/components/WorkerLogin.jsx`
- `src/pwa/hooks/useWorkerAuth.js`
- `src/pwa/lib/workerSession.js`

**Who Can Access:**
- `workers.is_lead = true` - Station leads
- `workers.is_lead = true AND primary_station_id IN (QC stations)` - QC inspectors
- Production Managers (from `users` table) - use regular Supabase auth

**Caveats:**
- Need to create Edge Function for custom auth
- RLS policies need to work with custom JWT claims
- PIN reset flow needed (via Production Manager)

---

### 2.2 Module Lookup (Manual Serial Entry)

**Confidence: 0.92** *(revised up - barcodes are future feature)*

#### Requirements:
- Manual serial entry (primary - **barcodes not currently used**)
- Fast lookup with autocomplete
- Barcode scanning (future enhancement when barcodes are added to modules)

#### Solution:

**Manual Serial Entry (Current Implementation)**
```jsx
// Smart search with autocomplete
const ModuleLookup = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      searchModules(debouncedQuery, factoryId).then(setSuggestions);
    }
  }, [debouncedQuery]);

  return (
    <div>
      <input
        type="text"
        placeholder="Enter serial (e.g., MOD-2026-0001) or project name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        inputMode="text"
        autoComplete="off"
        style={{ fontSize: '18px', padding: '16px' }}  // Touch-friendly
      />
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map(mod => (
            <li key={mod.id} onClick={() => selectModule(mod)}>
              <strong>{mod.serial_number}</strong>
              <span>{mod.project?.name} - Station: {mod.current_station?.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

**Future Enhancement: Barcode Scanner**

> **Note:** Barcodes are NOT currently used on modules. This is planned for future implementation.
> When barcodes are added, the following approach is recommended:

```javascript
// Future: Using native camera API + barcode detection
// Browser Barcode Detection API (Chrome 83+, Edge 83+)
const barcodeDetector = new BarcodeDetector({ formats: ['code_128', 'qr_code'] });

async function scanBarcode(imageData) {
  const barcodes = await barcodeDetector.detect(imageData);
  return barcodes[0]?.rawValue; // Returns serial number
}
```

**Libraries for Future Barcode Implementation:**

| Library | Size | Offline | Confidence |
|---------|------|---------|------------|
| Native BarcodeDetector API | 0KB | Yes | 0.85 (not Safari) |
| html5-qrcode | 95KB | Yes | 0.85 |

**Recommendation:** When barcodes are implemented, use QR codes for modules (easy to print, high reliability) and Code 128 for inventory items.

**Files to Create:**
- `src/pwa/components/ModuleLookup.jsx` - Smart search with autocomplete
- `src/pwa/hooks/useModuleSearch.js` - Debounced search hook
- `src/pwa/components/BarcodeScanner.jsx` *(future - when barcodes added)*

**Caveats:**
- Current MVP uses manual entry only
- Barcode infrastructure can be added later without major refactoring
- Consider QR codes when implementing - more reliable than 1D barcodes in factory lighting

---

### 2.3 QC Inspection Workflow

**Confidence: 0.88**

#### Requirements:
- QC checklist (configurable questions, photo/GPS)
- Checklist items from `station_templates.checklist` (JSONB)
- Pass/Fail with notes
- Auto-create rework task on fail

#### Existing Assets:
- `src/components/production/QCInspectionModal.jsx` (Batch 2 - COMPLETE)
- `src/services/qcService.js` (Batch 2 - COMPLETE)
- `qc_records` table exists

#### Solution:

```
┌─────────────────────────────────────────────────────────────────┐
│  QC INSPECTION FLOW (Mobile-Optimized)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  1. Scan/    │───▶│  2. Load     │───▶│  3. Display  │       │
│  │  Select      │    │  Checklist   │    │  Questions   │       │
│  │  Module      │    │  from Station│    │  (Yes/No/NA) │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                  │               │
│                                                  ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  6. Submit   │◀───│  5. Add      │◀───│  4. Capture  │       │
│  │  QC Record   │    │  Notes/      │    │  Photos      │       │
│  │  + Location  │    │  Defects     │    │  (Optional)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  7. IF FAILED:                                           │    │
│  │     - Mark module status = 'QC_Failed'                   │    │
│  │     - Auto-create rework task (assigned to station lead) │    │
│  │     - Send notification to Production Manager            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Mobile UI Adaptations:**
```jsx
// Touch-friendly checklist item
const ChecklistItem = ({ question, onAnswer }) => (
  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
    <button
      onClick={() => onAnswer('pass')}
      style={{
        flex: 1,
        padding: '20px',
        fontSize: '18px',
        backgroundColor: '#22c55e',
        borderRadius: '12px'
      }}
    >
      ✓ Pass
    </button>
    <button
      onClick={() => onAnswer('fail')}
      style={{
        flex: 1,
        padding: '20px',
        fontSize: '18px',
        backgroundColor: '#ef4444',
        borderRadius: '12px'
      }}
    >
      ✗ Fail
    </button>
  </div>
);
```

**Files to Create:**
- `src/pwa/components/QCInspection/QCChecklist.jsx`
- `src/pwa/components/QCInspection/ChecklistItem.jsx`
- `src/pwa/components/QCInspection/DefectCapture.jsx`
- `src/pwa/hooks/useQCSubmit.js`

**Caveats:**
- Need to handle partially completed inspections (save draft to IndexedDB)
- Photo storage while offline could consume significant device storage

---

### 2.4 Station Movement ("Move to Next")

**Confidence: 0.85**

#### Requirements:
- "Move to Next" – moves card
- Crew marks "done" via app/kiosk → card slides
- GM sees thumbnails, who/when

#### Existing Assets:
- `src/services/modulesService.js` - `moveModuleToStation()`
- `station_assignments` table
- `modules.current_station_id`

#### Solution:

```javascript
// Move to Next Flow
async function handleMoveToNext(moduleId, currentStationId) {
  // 1. Get next station in order
  const { data: stations } = await getStationTemplates(factoryId);
  const currentIndex = stations.findIndex(s => s.id === currentStationId);
  const nextStation = stations[currentIndex + 1];

  if (!nextStation) {
    // Module at final station - prompt for "Complete" flow
    return { action: 'complete', message: 'Module ready for staging' };
  }

  // 2. Check if next station requires inspection
  if (stations[currentIndex].requires_inspection) {
    return { action: 'qc_required', station: stations[currentIndex] };
  }

  // 3. Move module
  await moveModuleToStation(moduleId, nextStation.id, leadId, crewIds);

  // 4. Create station_assignment record
  await createStationAssignment({
    module_id: moduleId,
    station_id: nextStation.id,
    lead_id: currentUser.id,
    crew_ids: selectedCrew,
    start_time: new Date().toISOString()
  });

  // 5. Close previous assignment
  await closeStationAssignment(previousAssignmentId);

  return { action: 'moved', nextStation };
}
```

**Mobile UI:**
```
┌─────────────────────────────────────────┐
│  Module: MOD-2026-0142                  │
│  Current Station: Rough Carpentry      │
│  Time at Station: 3h 45m               │
├─────────────────────────────────────────┤
│                                         │
│  [Select Crew for Move]                 │
│  ☑ John Smith (Lead)                    │
│  ☑ Maria Garcia                         │
│  ☐ Robert Johnson                       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                  │   │
│  │    MOVE TO: Exterior Siding     │   │
│  │    ──────────────────────────   │   │
│  │                                  │   │
│  │         [ → CONFIRM ]            │   │
│  │                                  │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Files to Create:**
- `src/pwa/components/StationMove/MoveToNext.jsx`
- `src/pwa/components/StationMove/CrewSelector.jsx`
- `src/pwa/components/StationMove/ConfirmMove.jsx`
- `src/pwa/hooks/useStationMove.js`

**Caveats:**
- Need to handle race condition if two leads try to move same module
- Offline moves need conflict resolution strategy

---

### 2.5 Offline Sync & Data Persistence

**Confidence: 0.72** ⚠️ *Lower confidence - complex problem*

#### Requirements:
- Offline sync
- Offline >1h? Flag

#### Solution Architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  OFFLINE SYNC ARCHITECTURE                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                                    ┌─────────────────────┐ │
│  │  User       │                                    │  Supabase           │ │
│  │  Actions    │                                    │  (Cloud)            │ │
│  └──────┬──────┘                                    └──────────┬──────────┘ │
│         │                                                       │            │
│         ▼                                                       │            │
│  ┌──────────────────────────────────────────────────────────────┴────────┐  │
│  │                        Service Worker                                  │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │  │
│  │  │  Request        │  │  Sync Queue     │  │  Background Sync    │   │  │
│  │  │  Interceptor    │  │  (IndexedDB)    │  │  (when online)      │   │  │
│  │  └────────┬────────┘  └────────┬────────┘  └─────────┬───────────┘   │  │
│  │           │                    │                      │               │  │
│  │           ▼                    ▼                      ▼               │  │
│  │  ┌───────────────────────────────────────────────────────────────┐   │  │
│  │  │                      IndexedDB Store                           │   │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │   │  │
│  │  │  │ modules │  │stations │  │ workers │  │ pending_actions │   │   │  │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘   │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  SYNC STRATEGY:                                                              │
│  1. Read operations: IndexedDB first, fetch in background                    │
│  2. Write operations: Queue to pending_actions, sync when online             │
│  3. Conflict resolution: Server-wins with user notification                  │
│  4. Stale data indicator: Show "Last sync: X minutes ago"                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**IndexedDB Schema:**

```javascript
const DB_SCHEMA = {
  name: 'sunbelt_pwa',
  version: 1,
  stores: {
    modules: {
      keyPath: 'id',
      indexes: ['serial_number', 'current_station_id', 'factory_id']
    },
    stations: {
      keyPath: 'id',
      indexes: ['factory_id', 'order_num']
    },
    workers: {
      keyPath: 'id',
      indexes: ['factory_id', 'is_active']
    },
    qc_checklists: {
      keyPath: 'station_id'
    },
    pending_actions: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: ['action_type', 'created_at', 'sync_status']
    },
    sync_meta: {
      keyPath: 'key' // 'last_sync', 'factory_id', 'user_id'
    }
  }
};
```

**Pending Action Queue:**

```javascript
// Offline action structure
const pendingAction = {
  id: auto,
  action_type: 'qc_submit' | 'station_move' | 'clock_in' | 'clock_out',
  payload: { /* action-specific data */ },
  created_at: timestamp,
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed',
  retry_count: 0,
  error_message: null
};

// Background sync registration
navigator.serviceWorker.ready.then(registration => {
  registration.sync.register('sync-pending-actions');
});
```

**Files to Create:**
- `src/pwa/service-worker.js`
- `src/pwa/lib/indexedDB.js`
- `src/pwa/lib/syncManager.js`
- `src/pwa/hooks/useOfflineSync.js`
- `src/pwa/hooks/useOnlineStatus.js`
- `src/pwa/components/SyncIndicator.jsx`

**Caveats:**
- IndexedDB storage limits (usually 50-100MB per origin)
- Background Sync API not supported in Safari iOS
- Need to define conflict resolution for concurrent edits
- **MISSING CONTEXT:** Maximum expected offline duration? (roadmap says >1h flag)
- Photo storage while offline is a significant concern

---

### 2.6 Real-Time Updates & Notifications

**Confidence: 0.85**

#### Requirements:
- Real-time: Supabase listen on `modules`, `shifts`, `inspections`, `qc_records`
- GM sees thumbnails, who/when

#### Existing Patterns (from DEBUG_TEST_GUIDE.md):
```javascript
// From debug guide - proper Supabase subscription pattern
useEffect(() => {
  const channel = supabase
    .channel(`${table}-changes`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table,
      filter: `factory_id=eq.${factoryId}` // Important: filter by factory
    }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel); // Cleanup
  };
}, [table, callback, factoryId]);
```

**PWA-Specific Considerations:**

```javascript
// Pause subscriptions when app backgrounded
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause real-time subscriptions
    supabase.removeAllChannels();
  } else {
    // Resume subscriptions
    setupSubscriptions();
    // Refresh stale data
    refreshAllData();
  }
});
```

**Push Notifications (Optional Enhancement):**

```javascript
// Web Push API for critical alerts
// Notify lead when module needs attention
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });
    // Save subscription to Supabase for push delivery
  }
}
```

**Files to Create:**
- `src/pwa/hooks/useRealtimeModules.js`
- `src/pwa/hooks/usePushNotifications.js`
- `src/pwa/components/NotificationBanner.jsx`

**Caveats:**
- Safari PWA has limited push notification support
- Need VAPID keys and push notification backend (Supabase Edge Functions or separate service)

---

### 2.7 PWA Infrastructure

**Confidence: 0.90**

#### Requirements:
- Installable app experience
- Works offline
- Fast loading

#### Implementation:

**1. Web App Manifest:**

```json
// public/manifest.json
{
  "name": "Sunbelt Floor App",
  "short_name": "Floor App",
  "description": "Production floor QC and module tracking",
  "start_url": "/pwa",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1a1a2e",
  "theme_color": "#f97316",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["business", "productivity"],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1080x1920",
      "type": "image/png"
    }
  ]
}
```

**2. Service Worker Setup:**

```javascript
// src/pwa/service-worker.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache strategies
registerRoute(
  // Cache API responses
  ({ url }) => url.pathname.startsWith('/rest/v1/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 3600 })
    ]
  })
);

registerRoute(
  // Cache images
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100 })
    ]
  })
);

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});
```

**3. Vite PWA Plugin Configuration:**

```javascript
// vite.config.js additions
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5
            }
          }
        ]
      },
      manifest: {
        // ... manifest options
      }
    })
  ]
});
```

**Files to Create:**
- `public/manifest.json`
- `src/pwa/service-worker.js`
- `public/icons/` (multiple sizes)
- Update `vite.config.js`
- `src/pwa/registerSW.js`

**Dependencies to Add:**
```json
{
  "vite-plugin-pwa": "^0.17.0",
  "workbox-precaching": "^7.0.0",
  "workbox-routing": "^7.0.0",
  "workbox-strategies": "^7.0.0",
  "workbox-expiration": "^7.0.0",
  "workbox-background-sync": "^7.0.0"
}
```

**Caveats:**
- iOS Safari has stricter PWA limitations
- Need to handle SW updates gracefully (prompt user to refresh)

---

### 2.8 Photo Capture & GPS Tagging

**Confidence: 0.88**

#### Requirements:
- QC checklist (configurable questions, **photo/GPS**)
- GM sees **thumbnails**, who/when

#### Solution:

**Photo Capture:**

```jsx
// Camera capture component
const PhotoCapture = ({ onCapture }) => {
  const handleCapture = async (event) => {
    const file = event.target.files[0];

    // Compress image before storage
    const compressed = await compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8
    });

    // Extract EXIF GPS if available
    const gps = await extractGPSFromExif(file);

    // Store locally for offline sync
    const photoData = {
      id: generateUUID(),
      blob: compressed,
      gps: gps || await getCurrentGPS(),
      timestamp: new Date().toISOString()
    };

    onCapture(photoData);
  };

  return (
    <input
      type="file"
      accept="image/*"
      capture="environment" // Use rear camera
      onChange={handleCapture}
    />
  );
};
```

**GPS Capture:**

```javascript
// Get current location with fallback
async function getCurrentGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        console.warn('GPS error:', error);
        resolve(null); // Don't block on GPS failure
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}
```

**Photo Storage Strategy:**

```
┌────────────────────────────────────────────────────────────────┐
│  PHOTO STORAGE FLOW                                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  Capture    │───▶│  Compress   │───▶│  Store in IndexedDB │ │
│  │  Photo      │    │  (< 500KB)  │    │  (offline)          │ │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘ │
│                                                    │            │
│                     WHEN ONLINE                    │            │
│                          ▼                         │            │
│  ┌─────────────────────────────────────────────────┴──────────┐│
│  │  1. Upload to Supabase Storage (project-files bucket)      ││
│  │  2. Get public URL                                          ││
│  │  3. Update qc_records.photo_urls array                      ││
│  │  4. Delete from IndexedDB                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Files to Create:**
- `src/pwa/components/PhotoCapture.jsx`
- `src/pwa/lib/imageCompression.js`
- `src/pwa/lib/gpsCapture.js`
- `src/pwa/hooks/usePhotoUpload.js`

**Revised Storage Estimate (20-30 photos per module):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHOTO STORAGE CALCULATIONS                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Per Photo (compressed):           ~300-500KB                                │
│  Per Module (25 photos avg):       ~10MB                                     │
│  Per Shift (10 modules inspected): ~100MB                                    │
│                                                                              │
│  STORAGE STRATEGY:                                                           │
│  1. Compress to 80% quality, max 1920x1080                                   │
│  2. Upload immediately when online (WiFi + cell available)                   │
│  3. IndexedDB buffer: max 200MB (configurable)                               │
│  4. Auto-purge uploaded photos after 24 hours                                │
│  5. Warning at 80% capacity, prevent capture at 95%                          │
│                                                                              │
│  THUMBNAIL STRATEGY (for GM dashboard):                                      │
│  - Generate 150x150 thumbnail on capture                                     │
│  - Store separately for fast loading                                         │
│  - ~10KB per thumbnail                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Caveats:**
- 20-30 photos per module = ~10MB per module inspection
- With WiFi + cell available, photos upload quickly (reduces offline storage needs)
- Need storage quota management with user warnings
- GPS may not work inside factory buildings (fallback to factory location)

---

### 2.9 Inventory Receiving & Scanning (NEW)

**Confidence: 0.80**

#### Requirements (from user clarification):
- Leads/PM/QC should be able to scan incoming inventory
- Track material receipt against purchase orders
- Future: barcode scanning for inventory items

#### Solution:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INVENTORY RECEIVING FLOW                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  Select PO   │───▶│  View Line   │───▶│  Mark Item   │                   │
│  │  or Search   │    │  Items       │    │  Received    │                   │
│  │  Item        │    │  Expected    │    │  (qty/photo) │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                                                    │                         │
│                                                    ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  RECEIPT RECORD:                                                         ││
│  │  - PO line item ID                                                       ││
│  │  - Quantity received                                                     ││
│  │  - Received by (worker_id)                                               ││
│  │  - Timestamp + GPS                                                       ││
│  │  - Photo (optional - for damaged goods)                                  ││
│  │  - Notes (damage, shortage, etc.)                                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  FUTURE: Barcode scanning for inventory items                                │
│  - Scan item barcode → auto-match to PO line                                 │
│  - Scan location barcode → verify put-away                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Schema Integration:

```sql
-- Existing tables to leverage:
-- purchase_orders (id, project_id, vendor, status, ...)
-- parts_inventory (id, name, quantity, ...)

-- New table for receiving records
CREATE TABLE inventory_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID REFERENCES factories(id),
  po_id UUID REFERENCES purchase_orders(id),
  po_line_item JSONB,                    -- Snapshot of line item
  part_name VARCHAR(100),
  quantity_expected INTEGER,
  quantity_received INTEGER,
  received_by UUID REFERENCES workers(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  photo_url TEXT,
  gps_location JSONB,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'received', -- received, partial, damaged, rejected
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_receipts_factory ON inventory_receipts(factory_id);
CREATE INDEX idx_inventory_receipts_po ON inventory_receipts(po_id);
CREATE INDEX idx_inventory_receipts_date ON inventory_receipts(received_at);
```

#### PWA Components:

```jsx
// Inventory Receiving Home
const InventoryReceiving = () => {
  const [pendingPOs, setPendingPOs] = useState([]);

  return (
    <div>
      <h2>Incoming Inventory</h2>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button onClick={() => navigate('/pwa/inventory/scan')}>
          Scan Item (Future)
        </button>
        <button onClick={() => navigate('/pwa/inventory/search')}>
          Search by Name
        </button>
      </div>

      {/* Pending POs */}
      <h3>Pending Deliveries</h3>
      <ul>
        {pendingPOs.map(po => (
          <li key={po.id} onClick={() => openPO(po.id)}>
            <strong>PO #{po.po_number}</strong>
            <span>{po.vendor} - {po.line_items.length} items</span>
            <span>Expected: {formatDate(po.expected_date)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

**Files to Create:**
- `src/pwa/pages/InventoryReceiving.jsx`
- `src/pwa/components/inventory/POLineItems.jsx`
- `src/pwa/components/inventory/ReceiveItemModal.jsx`
- `src/pwa/hooks/useInventoryReceipts.js`
- `src/services/inventoryReceiptsService.js`

**Integration with Existing System:**
- Links to `purchase_orders` table (existing)
- Links to `parts_inventory` for quantity updates
- Links to `long_lead_items` for tracking (if applicable)

**Caveats:**
- Requires purchase order data to be in Supabase
- May need integration with Praxis for BOM/PO data
- Barcode scanning is future enhancement (when barcodes added to inventory)

---

## 3. VERIFY: Logic, Facts, Completeness, Bias Check

### Logic Verification:

| Flow | Verified | Notes |
|------|----------|-------|
| Auth → Worker PIN | ✓ | Custom Edge Function needed |
| Search → Load Module | ✓ | modulesService.getModuleBySerial() exists |
| QC → Checklist → Submit | ✓ | qcService.js patterns reusable |
| Move → Station Assignment | ✓ | modulesService.moveModuleToStation() exists |
| Offline → Sync | ✓ | WiFi + cell = reduced offline needs |
| Photo → Upload → URL | ✓ | Supabase Storage patterns exist |
| Inventory → Receipt | ✓ | New table + service needed |

### Facts Verification:

| Claim | Source | Status |
|-------|--------|--------|
| 12 production stations | PLANT_MANAGER_ROADMAP.md §2 | ✓ Verified |
| Leads-only access | PLANT_MANAGER_ROADMAP.md §8 | ✓ Verified |
| Workers in workers table | User clarification | ✓ Confirmed |
| No barcodes currently | User clarification | ✓ Confirmed |
| 20-30 photos per module | User clarification | ✓ Confirmed |
| Good WiFi + cell coverage | User clarification | ✓ Confirmed |
| station_templates.checklist is JSONB | Schema in roadmap | ✓ Verified |
| qc_records table exists | PGM-009 complete | ✓ Verified |
| workers table exists | PGM-004 complete | ✓ Verified |

### Completeness Check:

| Requirement | Covered | Section |
|-------------|---------|---------|
| Log in: leads/prod mgr | ✓ | 2.1 (PIN-based) |
| Manual serial lookup | ✓ | 2.2 |
| Barcode (future) | ✓ | 2.2 |
| QC checklist | ✓ | 2.3 |
| Configurable questions | ✓ | 2.3 |
| Photo capture (20-30) | ✓ | 2.8 |
| GPS tagging | ✓ | 2.8 |
| "Move to Next" | ✓ | 2.4 |
| Offline sync | ✓ | 2.5 |
| GM sees thumbnails | ✓ | 2.8 |
| GM sees who/when | ✓ | 2.3/2.4 |
| Inventory receiving | ✓ | 2.9 (NEW) |
| Offline >1h flag | ✓ | 2.5 |
| No data export | ✓ | Implicit in PWA |

### Bias Check:

- **Technology Bias:** Favoring React/Vite stack matches existing codebase ✓
- **Offline Strategy:** Simplified due to good connectivity (WiFi + cell)
- **Auth Strategy:** PIN-based chosen for factory floor usability over more complex biometric/OAuth

---

## 4. SYNTHESIZE: Combined Implementation Plan

### Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PWA IMPLEMENTATION PHASES (Revised with Clarifications)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: Foundation (Core PWA + Worker Auth) ✅ COMPLETE                   │
│  ├── ✅ PWA infrastructure (manifest, service worker, icons)                │
│  ├── ✅ Vite PWA plugin integration                                         │
│  ├── ✅ PWA-specific routing (/pwa/*)                                       │
│  ├── ✅ Worker PIN authentication (Edge Function)                           │
│  └── ✅ worker_sessions table + schema updates                              │
│  Status: COMPLETE | Completed: January 17, 2026                             │
│                                                                              │
│  PHASE 2: Module Lookup ✅ COMPLETE                                         │
│  ├── ✅ Manual serial entry with autocomplete                               │
│  ├── ✅ Module detail display                                               │
│  └── (Barcode scanner - FUTURE when barcodes added)                         │
│  Status: COMPLETE | Completed: January 17, 2026                             │
│                                                                              │
│  PHASE 3: QC Inspection Workflow ✅ COMPLETE                                │
│  ├── ✅ Checklist rendering (from station_templates)                        │
│  ├── ✅ Photo capture (camera API)                                          │
│  ├── ✅ QC record submission                                                │
│  └── ✅ Pass/Fail result with rework notice                                 │
│  Status: COMPLETE | Completed: January 17, 2026                             │
│                                                                              │
│  PHASE 4: Station Movement ✅ COMPLETE                                      │
│  ├── ✅ "Move to Next" flow with confirmation                               │
│  ├── ✅ Crew selector with worker list                                      │
│  ├── ✅ QC gate enforcement warning                                         │
│  └── ✅ Station assignment via moveModuleToStation()                        │
│  Status: COMPLETE | Completed: January 17, 2026                             │
│                                                                              │
│  PHASE 5: Inventory Receiving ✅ COMPLETE                                   │
│  ├── ✅ PO search and pending deliveries list                               │
│  ├── ✅ Line items with remaining quantity display                          │
│  ├── ✅ Receive flow (qty +/-, damage toggle, notes)                        │
│  ├── ✅ Photo capture and upload                                            │
│  └── ✅ Receipt creation via inventoryReceiptsService                       │
│  Status: COMPLETE | Completed: January 17, 2026                             │
│                                                                              │
│  PHASE 6: Offline Sync ✅ COMPLETE                                          │
│  ├── ✅ IndexedDB library (src/pwa/lib/indexedDB.js)                        │
│  ├── ✅ SyncManager (src/pwa/lib/syncManager.js)                            │
│  ├── ✅ useOfflineSync hook for queuing actions                             │
│  ├── ✅ useOnlineStatus hook with debouncing                                │
│  ├── ✅ SyncIndicator component in PWAShell                                 │
│  ├── ✅ Background sync registration                                        │
│  └── ✅ Storage quota management (200MB limit with warnings)                │
│  Status: COMPLETE | Completed: January 17, 2026                             │
│                                                                              │
│  PHASE 7: Real-Time & Polish ✅ COMPLETE                                    │
│  ├── ✅ useRealtimeSubscription generic hook                                │
│  ├── ✅ Table-specific subscription hooks                                   │
│  ├── ✅ usePWASubscriptions combined hook                                   │
│  ├── ✅ Visibility change handling (auto pause/resume)                      │
│  └── ✅ Module exports updated                                              │
│  Status: COMPLETE | Completed: January 17, 2026                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/pwa/
├── App.jsx                    # PWA-specific app shell
├── registerSW.js              # Service worker registration
├── service-worker.js          # Workbox service worker
│
├── components/
│   ├── layout/
│   │   ├── PWAShell.jsx       # App shell with offline indicator
│   │   ├── BottomNav.jsx      # Mobile navigation
│   │   └── Header.jsx
│   │
│   ├── auth/
│   │   ├── WorkerLogin.jsx       # Employee ID + PIN entry
│   │   └── PINLock.jsx           # Session lock screen
│   │
│   ├── modules/
│   │   ├── ModuleLookup.jsx      # Search with autocomplete
│   │   ├── ModuleDetail.jsx
│   │   └── BarcodeScanner.jsx    # FUTURE
│   │
│   ├── inventory/                 # NEW - Inventory Receiving
│   │   ├── InventoryHome.jsx
│   │   ├── POLineItems.jsx
│   │   └── ReceiveItemModal.jsx
│   │
│   ├── qc/
│   │   ├── QCChecklist.jsx
│   │   ├── ChecklistItem.jsx
│   │   ├── DefectCapture.jsx
│   │   └── PhotoCapture.jsx
│   │
│   ├── station/
│   │   ├── MoveToNext.jsx
│   │   ├── CrewSelector.jsx
│   │   └── StationInfo.jsx
│   │
│   └── common/
│       ├── SyncIndicator.jsx
│       ├── OfflineBanner.jsx
│       └── LoadingSpinner.jsx
│
├── contexts/
│   ├── PWAAuthContext.jsx
│   └── OfflineContext.jsx
│
├── hooks/
│   ├── useWorkerAuth.js          # Worker PIN auth
│   ├── useModuleSearch.js        # Debounced module lookup
│   ├── useQCSubmit.js
│   ├── useStationMove.js
│   ├── useInventoryReceipts.js   # NEW
│   ├── useOfflineSync.js
│   ├── useOnlineStatus.js
│   ├── usePhotoUpload.js
│   └── useRealtimeModules.js
│
├── lib/
│   ├── indexedDB.js           # IndexedDB wrapper
│   ├── syncManager.js         # Offline sync logic
│   ├── imageCompression.js    # Photo compression
│   └── gpsCapture.js          # Location services
│
├── pages/
│   ├── Home.jsx               # Dashboard / module list
│   ├── Scanner.jsx            # Scan module page
│   ├── QCInspection.jsx       # QC checklist page
│   ├── ModuleDetail.jsx       # Module info + actions
│   └── Settings.jsx           # User settings
│
└── styles/
    └── pwa.css                # Mobile-optimized styles
```

### Dependencies to Add

```json
{
  "dependencies": {
    "html5-qrcode": "^2.3.8",        // Barcode scanning fallback
    "compressorjs": "^1.2.1",        // Image compression
    "idb": "^8.0.0"                  // IndexedDB wrapper
  },
  "devDependencies": {
    "vite-plugin-pwa": "^0.17.0",
    "workbox-precaching": "^7.0.0",
    "workbox-routing": "^7.0.0",
    "workbox-strategies": "^7.0.0",
    "workbox-expiration": "^7.0.0",
    "workbox-background-sync": "^7.0.0"
  }
}
```

### Effort Estimate (Revised)

| Phase | Effort | Confidence-Adjusted |
|-------|--------|---------------------|
| Phase 1: Foundation + Worker Auth | 20 hours | 20 × 0.78 = 15.6h |
| Phase 2: Module Lookup | 8 hours | 8 × 0.92 = 7.4h |
| Phase 3: QC (20-30 photos) | 24 hours | 24 × 0.88 = 21.1h |
| Phase 4: Station Move | 12 hours | 12 × 0.85 = 10.2h |
| Phase 5: Inventory Receiving | 16 hours | 16 × 0.80 = 12.8h |
| Phase 6: Offline Sync | 16 hours | 16 × 0.82 = 13.1h |
| Phase 7: Polish | 12 hours | 12 × 0.85 = 10.2h |
| **Total** | **108 hours** | **90.4h expected** |

**Key Changes from Original Estimate:**
- Phase 1 increased (custom worker auth via Edge Function)
- Phase 2 decreased (no barcode scanning needed for MVP)
- Phase 5 added (new inventory receiving feature)
- Phase 6 simplified (good connectivity reduces offline complexity)

---

## 5. REFLECT: Gaps & Clarifications Resolved

### Resolved Gaps (User Clarifications Applied)

| Original Gap | Resolution | Impact |
|--------------|------------|--------|
| Barcode format | **No barcodes currently** - future feature | Simplified Phase 2, removed dependency |
| Worker auth | **Workers table with is_lead** - need custom PIN auth | Added Edge Function to Phase 1 |
| Offline duration | **Good WiFi + cell** - minimal offline expected | Simplified Phase 6 |
| Photo count | **20-30 per module** - significant storage | Added quota management |
| Inventory scanning | **New requirement** - leads/PM/QC scan inventory | Added Phase 5 |

### Remaining Considerations

#### Consideration 1: PIN Assignment Workflow

**Question:** How do workers get their initial PIN?
- Option A: Production Manager assigns via desktop app
- Option B: Self-registration with supervisor approval
- Option C: Pre-assigned based on employee ID

**Recommendation:** Option A (manager assigns) - simplest, most secure.

#### Consideration 2: Purchase Order Data Source

**Question:** Where does PO data come from for inventory receiving?
- Current: `purchase_orders` table exists but may not have all line items
- Praxis integration may be needed for BOM/PO data

**Recommendation:** Phase 5 can work with existing PO table; Praxis integration is enhancement.

#### Consideration 3: Barcode Future Planning

**Question:** When barcodes are added, what format?
- **Recommendation:** QR codes for modules (high reliability, easy to print)
- **Recommendation:** Code 128 for inventory items (standard in logistics)

---

## 6. FINAL ANSWER

### Clear Answer

The Mobile Floor App PWA should be implemented as a **separate route group** (`/pwa/*`) within the existing Vite/React application, sharing services and Supabase connection while having its own mobile-optimized UI components and connectivity-optimized sync architecture.

**Recommended Approach:**
1. Build as integrated PWA within existing codebase (not separate project)
2. Implement in **7 phases** over approximately **108 development hours** (~90h expected)
3. **Custom worker auth** via Supabase Edge Function (workers table + PIN)
4. **Simplified offline** strategy given good WiFi + cell coverage
5. Reuse existing services (modulesService, qcService, workersService)
6. Create new mobile-optimized UI components
7. Add inventory receiving feature for leads/PM/QC

### Confidence Level: 0.95 (Updated January 17, 2026)

**Breakdown (Post Phase 1 Completion):**
- Authentication (Worker PIN): 1.0 ✅ (Edge Function deployed)
- Module Lookup: 0.95 ✓ (schema ready)
- QC Workflow: 0.95 ✓ (services ready)
- Station Movement: 0.95 ✓ (services ready)
- Inventory Receiving: 1.0 ✅ (schema + services complete)
- Offline Sync: 0.85 ✓ (good connectivity)
- Real-time: 0.90 ✓
- PWA Infrastructure: 1.0 ✅ (foundation complete)
- Photo/GPS: 0.90 ✓

**Weighted Average:** 0.95 (all Phase 1 blockers resolved)

### Key Caveats (Updated - January 17, 2026)

1. ~~**Worker Auth Complexity:**~~ ✅ Resolved - Edge Function deployed
2. **Safari/iOS Limitations:** Background Sync API not supported; need polling fallback
3. **Photo Storage:** 20-30 photos/module × 10MB = need 200MB buffer with quota management
4. **Inventory Integration:** May need Praxis integration for full PO/BOM data
5. **PIN Management:** Need workflow for PIN assignment/reset via Production Manager
6. **Dependencies:** Run `npm install` to install vite-plugin-pwa and idb packages

---

## Appendix A: Decision Log (Updated)

| Decision | Options Considered | Choice | Rationale |
|----------|-------------------|--------|-----------|
| PWA vs Native | PWA, React Native, Flutter | PWA | Shared codebase, web tech expertise, no app store |
| Worker Auth | Supabase Auth, Custom PIN, Badge scan | **Custom PIN (Edge Function)** | Workers not in users table; PIN is factory-friendly |
| Barcode MVP | Include barcode, Manual only | **Manual only** | No barcodes currently on modules |
| Offline Storage | localStorage, IndexedDB, SQLite WASM | IndexedDB (idb wrapper) | Structured data, good size limits, async API |
| Sync Strategy | Full offline, Connectivity-aware | **Connectivity-aware** | Good WiFi + cell = reduced offline needs |
| Photo Compression | None, Light (80%), Heavy (60%) | **80% quality, 1920x1080 max** | Balance quality vs storage for 20-30 photos |
| Service Worker | Custom, Workbox | Workbox | Well-tested, precaching, strategies |

## Appendix B: Testing Checklist (Updated)

### Manual Testing

**Authentication:**
- [ ] Install PWA on iOS Safari
- [ ] Install PWA on Android Chrome
- [ ] Login with worker Employee ID + PIN
- [ ] Verify is_lead = true required for access
- [ ] Reject login for non-lead workers
- [ ] PIN lockout after 3 failed attempts

**Module Lookup:**
- [ ] Search module by serial number
- [ ] Search module by project name
- [ ] Autocomplete suggestions appear after 3 characters
- [ ] Select module from suggestions

**QC Inspection:**
- [ ] Load checklist for current station
- [ ] Complete checklist (all pass)
- [ ] Complete checklist with failures → rework task created
- [ ] Capture 20+ photos in one inspection
- [ ] Verify GPS coordinates captured
- [ ] View uploaded thumbnails on GM dashboard

**Station Movement:**
- [ ] Move module to next station
- [ ] Select crew members for move
- [ ] Verify station assignment record created

**Inventory Receiving:**
- [ ] View pending PO deliveries
- [ ] Mark line item as received
- [ ] Capture damage photo
- [ ] Partial receipt (qty received < expected)

**Offline/Sync:**
- [ ] App loads when briefly offline
- [ ] Photos queue when offline, upload when online
- [ ] Sync indicator shows last sync time
- [ ] Storage warning at 80% capacity

### Performance Testing

- [ ] Time to interactive < 3 seconds
- [ ] Lighthouse PWA score > 90
- [ ] Works after brief network interruption
- [ ] IndexedDB doesn't exceed 200MB
- [ ] 30 photos upload in < 60 seconds on WiFi

---

*Document Version: 1.2*
*Last Updated: January 17, 2026 (Phase 1 Complete)*
*Next Review: Before Phase 2 implementation*
