# 10 — Decision Log

Decisions made during design and development. Each includes the rationale so future developers understand why.

---

## Architecture Decisions

### D-01: TanStack Start + TanStack Router
**Decision:** Use TanStack Start as the meta-framework with file-based TanStack Router.
**Rationale:** Bootstrapped from Lovable.dev starter. TanStack Router provides type-safe routing with built-in `notFound()`. Start provides SSR-ready structure without requiring it immediately.
**Alternative considered:** Next.js App Router — rejected (team unfamiliar).

---

### D-02: TanStack Query v5 for Data Fetching
**Decision:** Use TanStack Query v5 for all server state.
**Rationale:** Already installed in the starter. React Query provides caching, background refetch, mutation state (`isPending`), and cache invalidation — replacing the need for a custom store.
**Alternative considered:** Jotai/Zustand — rejected (adds complexity; React Query handles server state better).

---

### D-03: Repository Pattern
**Decision:** All Supabase access goes through repository files in `src/repositories/`.
**Rationale:** Separates DB concern from UI concern. Components only import hooks; hooks only import repositories; repositories import supabase. Clean dependency graph.
**Alternative considered:** Direct supabase calls in components — rejected (harder to test, harder to swap data source).

---

### D-04: snake_case ↔ camelCase in Repository Layer
**Decision:** Repositories transform DB snake_case to UI camelCase. UI types never change.
**Rationale:** Keeps the TypeScript types from the mock-data era unchanged. Zero component rewrites needed when migrating from mock to real data.
**Trade-off:** Slightly more code in each repository. Worth it for zero UI disruption.

---

### D-05: Report Is a Pointer, Not a Snapshot
**Decision:** `report` record points to `daily_log` via FK; does not store a copy of log content.
**Rationale:** Simpler schema, no data duplication. Data integrity handled by immutability triggers.
**Trade-off:** Report view shows current log content; if log were editable, it could diverge. Immutability trigger prevents this.

---

### D-06: Full Sub-Entity Fetch on Daily Log Queries
**Decision:** `dailyLogRepository` fetches contractor_row, equipment_row, and photo in a single PostgREST query.
**Rationale:** With 24 logs and ~30 sub-rows, the total payload is small. Single query avoids waterfall. Simpler code.
**Trade-off:** Larger response payload than needed for the list view. Acceptable at MVP scale.

---

### D-07: Photo Upload Removed from Create Form
**Decision:** Photo upload section removed entirely from `/daily-logs/new`.
**Rationale:** Storage not implemented in Phase 2. Uploading to a placeholder produces garbage data.
**Consequence:** `photo` table entries come only from seed data for now. Real photo upload added in Phase 3.

---

### D-08: Dialog Closes Only on Success
**Decision:** `setOpen(false)` called in mutation's `onSuccess`, not immediately on form submit.
**Rationale:** If the network request fails, the dialog stays open with the form data intact. User can retry without re-entering data.
**Alternative:** Close immediately and show toast — rejected (confusing if network is slow).

---

### D-09: Broad Cache Invalidation
**Decision:** Mutations invalidate the entire entity cache key (e.g., `["dailyLogs"]`) not just the specific item.
**Rationale:** Simple, always correct. At MVP scale (< 100 records per entity) the re-fetch cost is negligible.
**Trade-off:** More refetches than strictly necessary. Acceptable tradeoff for simplicity.

---

### D-10: No RLS in Phase 2
**Decision:** Skip RLS entirely until auth is implemented in Phase 3.
**Rationale:** Implementing RLS without auth is pointless (anon key bypasses RLS anyway). Doing both together is cleaner.
**Risk:** App currently has no access control. Must not be deployed publicly until Phase 3 is complete.

---

## Database Decisions

### D-11: UNIQUE(project_id, date) on daily_log
**Decision:** Enforce one log per day per project at DB level, not just UI level.
**Rationale:** DB constraint is the authoritative source of truth. UI validation alone can be bypassed.
**UX:** Frontend catches `23505` (unique violation) and shows Hebrew toast.

---

### D-12: log_number via BEFORE INSERT Trigger
**Decision:** `log_number` is assigned by trigger, never by the client.
**Rationale:** Sequential numbering requires locking against concurrent inserts. Trigger runs in the same transaction.
**Consequence:** Client never sets `log_number`; it's always read-only from the client's perspective.

---

### D-13: JSONB for work_description
**Decision:** Store `work_description` as a JSONB `string[]` rather than a separate table.
**Rationale:** Work items have no identity (no ID, no FK references). Array of strings is the simplest representation. JSONB allows direct array operations in SQL.
**Trade-off:** Less flexible for querying individual work items. Acceptable for MVP.
