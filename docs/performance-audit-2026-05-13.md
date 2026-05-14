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

## Stage 4 (Shared data payload reduction)

Changed `lib/pro-data.ts`:
- Replaced directory snapshot `select("*")` calls with exact field lists for businesses, professionals, memberships, services, join requests, and staff invitations.
- Reused the exact field lists for owner join-request resolution fallbacks.

Changed `lib/global-service-catalog.ts`:
- Replaced catalog `select("*")` with the exact columns used by the root catalog mapper.

Changed `lib/telegram-bot.ts`:
- Replaced Telegram connection `select("*")` calls with the exact connection fields used by `mapConnectionRow()`.

Changed `lib/pro-calendar.ts`:
- Added a narrow appointment reader for client-directory aggregation.
- `/api/pro/clients` no longer needs the full appointment payload when deriving clients from calendar history.

Expected impact:
- Smaller Supabase response payloads for shared directory/catalog refreshes and Telegram connection lookups.
- Less memory churn in server-side mappers.
- Smaller payloads on client-list refreshes, especially for professionals with long appointment history.
- Keeps the full-table `select("*")` only in `scripts/db-backup.mjs`, where complete backups require it.

## Stage 5 (Notification path + DB index tuning)

Changed `app/api/pro/calendar/route.ts`, `lib/bookings.ts`, and `lib/pro-calendar.ts`:
- Calendar notifications now load only pending online bookings plus the latest archived notifications instead of every booking for the business.
- Notification appointment matching now fetches business appointments only for the relevant booking dates instead of full business appointment history.

Changed `supabase/schema.sql`:
- Added indexes for booking notification queries, membership lookups, staff invitation updates, calendar usage/client-directory queries, recent business calendar activity, and Telegram user lookups.

Changed API routes:
- Added lightweight API timing logs for key web/mobile GET endpoints. Logs are enabled in development or with `TIMVIZ_API_TIMING=1`.

Expected impact:
- Lower DB read volume on `/api/pro/calendar`, especially for businesses with long booking/appointment history.
- Faster owner/team membership and Telegram lookups under load.
- Easier local/Railway diagnosis when API latency regresses.

## Pending next optimization stages
1. Improve client search endpoint pattern (server-side query + result limits for very large client lists).
2. Tune directory cache TTL + invalidation strategy.
3. Split heavier `/pro/calendar` client components if bundle size becomes the next bottleneck.

## Build status after current changes
- `npm run build`: ✅ passes
