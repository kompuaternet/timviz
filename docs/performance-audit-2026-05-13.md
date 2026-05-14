# Timviz Performance Audit (2026-05-13)

## Scope
- Platform: `timviz.com`
- Stack: Next.js 15.3.8, React 19, Supabase, Railway
- Goal: speed up without breaking booking, calendar, clients, services, auth, admin

## Stage 0 Result (Safe setup)
- Branch created: `performance/optimize-timviz`
- Existing local changes were preserved (no destructive reset).

## Stage 1 Findings (Audit)

### 1) Frontend bundle/load hotspots
- Shared first-load JS is ~`101 kB` (acceptable baseline).
- Heaviest business pages:
  - `/pro/calendar`: page chunk `35.4 kB`, first load `164 kB`
  - `/pro/settings`: first load `154 kB`
  - `/pro/staff/schedule`: first load `150 kB`
  - `/pro/services`: first load `148 kB`
  - `/pro/clients`: first load `144 kB`
- Public marketing pages are mostly SSG/ISR already (good).

### 2) Network request behavior (code-path audit)
- Calendar screen prefetches many day snapshots in background (up to 14 day requests in default path).
- Calendar client picker requested `/api/pro/clients` every time drawer reopened.
- Calendar GET endpoint returns snapshot + notifications; notifications are also fetched separately on interactions.

### 3) Supabase query hotspots
- High-risk heavy query path:
  - `lib/pro-calendar.ts -> getCalendarDaySnapshot()`
  - For owner/team view it previously loaded **all business appointments across all dates** via `getAppointmentsForBusiness()`, then filtered in memory.
- Multiple `select("*")` still present, especially in `lib/pro-data.ts` and `lib/telegram-bot.ts`.
- Directory snapshot loader pulls wide datasets from several tables every refresh window (cached, but still expensive).

### 4) Caching/status
- There is an existing in-memory snapshot cache in calendar UI (good).
- There is an existing server-side directory cache (`DIRECTORY_SNAPSHOT_TTL_MS`, default 15s), which may still be too aggressive for heavy traffic.

### 5) Biggest performance bottlenecks (Top 5)
1. Team-owner calendar path loading all business appointments for each snapshot request.
2. Excessive calendar day prefetch fanout.
3. Repeated clients API fetch when opening client-search drawer.
4. Wide `select("*")` in heavy shared data loaders.
5. Potential over-refresh of shared directory snapshots under load.

## Stage 2 (Safety checklist)
- Manual smoke checklist prepared in `docs/smoke-checklist-performance.md`.

## Stage 3/7/8 (First safe optimizations applied in this branch)

### A) Calendar server query reduction
Changed `lib/pro-calendar.ts`:
- Added `readBusinessAppointmentsForDate(businessId, appointmentDate)`.
- Added `readRecentBusinessAppointments(businessId, limit)`.
- `getCalendarDaySnapshot()` now:
  - uses day-scoped business appointments for member columns
  - uses small recent query for activity
  - avoids loading full business appointment history for each calendar snapshot

Expected impact:
- Significant DB read reduction on `/api/pro/calendar` for owners/teams.
- Lower response time and memory pressure.

### B) Calendar prefetch fanout reduction
Changed `app/pro/calendar/CalendarDayView.tsx`:
- Reduced background prefetch date set (day/week directional and neutral paths).

Expected impact:
- Fewer parallel API hits after each date/view switch.
- Faster perceived responsiveness on weaker connections/devices.

### C) Clients drawer request deduplication
Changed `app/pro/calendar/CalendarDayView.tsx`:
- Added local cache for `/api/pro/clients` in calendar client-search drawer.
- Drawer now reuses cached results instead of re-fetching on every open.

Expected impact:
- Fewer repeated requests.
- Faster client picker reopen.

## Pending next optimization stages
1. Replace critical `select("*")` in `lib/pro-data.ts` with exact field lists.
2. Add DB index migration script for hottest WHERE/ORDER patterns.
3. Improve client search endpoint pattern (debounce + limits already partly in UI, verify end-to-end).
4. Add lightweight performance timing logs in dev for dashboard/calendar API.
5. Tune directory cache TTL + invalidation strategy.

## Build status after current changes
- `npm run build`: ✅ passes

