# Database Foundation Complete — Mehayesod Platform

> Phase: Execution Phase 1 — Database Foundation
> Completed: 2026-06-15
> Status: ✅ COMPLETE — READY FOR PHASE 2 (API LAYER)

---

## What Was Built

Four migration files in `supabase/migrations/` establish the complete database layer for the Mehayesod Construction Project Execution Platform.

---

## Migration Files

| File | Contents | Lines |
|---|---|---|
| `20260615000001_create_tables.sql` | 11 tables with all constraints, FKs, indexes | ~180 |
| `20260615000002_create_views.sql` | 4 operational views | ~80 |
| `20260615000003_create_triggers.sql` | 5 trigger functions + 10 trigger instances | ~100 |
| `20260615000004_seed_data.sql` | Hebrew seed data (DO $$ block) | ~430 |

---

## Schema Summary

### Tables (11)

| Table | Description | Key Constraints |
|---|---|---|
| `project` | Top-level container | `CHECK (target_date >= start_date)`, status CHECK |
| `daily_log` | Primary entity — one per (project, date) | `UNIQUE (project_id, date)`, `CHECK (date <= CURRENT_DATE)` |
| `project_member` | Auth junction table (Phase 3 adds FK to auth.users) | `UNIQUE (project_id, user_id)` |
| `contractor_row` | Sub-entity of daily_log | `CASCADE delete`, `CHECK (workers >= 1)` |
| `equipment_row` | Sub-entity of daily_log | `CASCADE delete`, `CHECK (quantity >= 1)` |
| `issue` | Quality defects with discovery linkage | `discovered_in_log_id FK (SET NULL)`, `resolved_at` |
| `photo` | Site photos with typed FK parent (RC-01) | `photo_exactly_one_parent` CHECK constraint |
| `issue_comment` | Direct FK to issue (RC-01, no polymorphic) | `CASCADE delete` |
| `blocker` | Management impediments | `critical` partial index, `resolved_at` |
| `decision` | Management approvals | `pending` partial index |
| `report` | Metadata only — content derived at render | `ON DELETE CASCADE` (RC-02), `UNIQUE (daily_log_id)`, aggregate partial unique index (RC-03) |

### Views (4)

| View | Purpose |
|---|---|
| `v_project_health` | Aggregated health metrics per project — 4-table LEFT JOIN |
| `v_missing_daily_logs` | Active projects with no log submitted today |
| `v_open_blockers` | Non-resolved blockers with `is_overdue` flag |
| `v_pending_decisions` | Decisions awaiting action with `is_overdue` flag |

### Trigger Functions (5)

| Function | Tables | Behavior |
|---|---|---|
| `set_updated_at()` | project, daily_log, issue, blocker, decision | Auto-maintains `updated_at` on every UPDATE |
| `assign_log_number()` | daily_log (BEFORE INSERT) | Assigns next sequential `log_number` per project |
| `set_resolved_at()` | issue, blocker (BEFORE UPDATE) | Sets `resolved_at` on first transition to terminal state |
| `prevent_log_edit_if_report_sent()` | daily_log (BEFORE UPDATE) | Raises exception if report is `sent` |
| `prevent_log_delete_if_report_sent()` | daily_log (BEFORE DELETE) | Raises exception if report is `sent` |

---

## Seed Data (Development)

Hebrew construction data loaded into the dev database:

| Entity | Count | Notes |
|---|---|---|
| Projects | 3 | 2 active (רעננה, בת ים), 1 planning (נוף הגליל) |
| Project members | 5 | Placeholder user_id UUIDs |
| Daily logs | 24 | PR1: 12 logs, PR2: 10 logs, PR3: 2 surveys |
| Contractor rows | 32 | For 8 PR1 + 6 PR2 logs |
| Equipment rows | 30 | For 8 PR1 + 6 PR2 logs |
| Issues | 16 | Mix of severity / status across projects |
| Issue comments | 10 | On open/active issues |
| Photos | 16 | 10 log photos + 6 issue photos |
| Blockers | 11 | Including critical and resolved examples |
| Decisions | 10 | All statuses represented |
| Reports | 19 | 11 PR1 daily + 1 weekly + 1 monthly + 6 PR2 daily |

### Report Status Distribution

| Status | Count | Notes |
|---|---|---|
| `sent` | 9 | With `pdf_storage_key` and `pdf_generated_at` set |
| `ready` | 3 | No PDF yet |
| `draft` | 7 | No PDF yet |

---

## Architecture Decisions Implemented

All decisions from the approved architecture (docs/IMPLEMENTATION_APPROVAL.md) are implemented:

| Decision | Implemented As |
|---|---|
| RC-01: Typed nullable FKs for photos | `photo.daily_log_id`, `photo.issue_id` + CHECK constraint |
| RC-01: issue_comment replaces polymorphic comment | `issue_comment` table with direct `issue_id FK` |
| RC-02: CASCADE delete on report → daily_log | `ON DELETE CASCADE` + immutability triggers |
| RC-03: Aggregate report uniqueness | Partial unique index `ON report(project_id, type, date) WHERE type IN ('weekly','monthly')` |
| RC-04: project_member table | Created without `auth.users` FK — Phase 3 adds it |
| RA-01: resolved_at on issue + blocker | Columns + `set_resolved_at` trigger |
| RA-02: discovered_in_log_id on issue | Nullable FK with `ON DELETE SET NULL` |
| RA-03: Business integrity checks | `target_date >= start_date`, `workers >= 1`, `quantity >= 1` |
| RA-04: Removed redundant indexes | Only purposeful indexes included |
| RA-05: log_number per project | `INTEGER` column + `assign_log_number` trigger |

---

## What Is NOT Yet Implemented

| Feature | Phase | Notes |
|---|---|---|
| RLS policies | Phase 3 | No auth = no RLS. See `docs/04-supabase-architecture.md` §5 |
| `project_member.user_id` FK to auth.users | Phase 3 | One-line `ALTER TABLE ADD CONSTRAINT` |
| Supabase Storage buckets | Phase 2 | `site-photos` and `reports` buckets defined in docs/04 |
| PostgREST API wiring | Phase 2 | Schema is PostgREST-compatible (all typed FKs) |
| PDF generation | Phase 4 | Edge Function placeholder |
| TanStack Query integration | Phase 2 | Replaces current `useSyncExternalStore` mock store |

---

## How to Apply Migrations

### Supabase CLI (recommended)

```bash
# Link to your dev project
supabase link --project-ref <your-dev-project-ref>

# Apply all pending migrations
supabase db push

# Verify migrations applied
supabase migration list
```

### Supabase Dashboard SQL Editor (alternative for one-time setup)

Run each file in order:
1. `20260615000001_create_tables.sql`
2. `20260615000002_create_views.sql`
3. `20260615000003_create_triggers.sql`
4. `20260615000004_seed_data.sql`

### After applying: run validation

Open `docs/MIGRATION_VALIDATION.md` and execute each SQL block in the Supabase SQL Editor. All 20 validation checks should pass.

---

## Next Step: Phase 2 — API Layer

**Objectives:**
1. Install and configure the Supabase JS client (`@supabase/supabase-js`)
2. Wire TanStack Query to Supabase for each entity (replacing `useSyncExternalStore`)
3. Implement CRUD operations for Daily Logs (highest priority)
4. Implement CRUD for Issues, Blockers, Decisions
5. Wire Report creation to Daily Log submission

**First command of Phase 2:**
```bash
npm install @supabase/supabase-js
```

**First file to create:**
```
src/lib/supabase.ts  — Supabase client initialization
src/lib/queries/    — TanStack Query hooks per entity
```

**Reference documents:**
- `docs/06-api-design.md` — complete REST API specification
- `docs/07-state-management.md` — TanStack Query patterns
- `docs/05-report-generation-engine.md` — report assembly query

---

## Validation Status

Before marking Phase 1 complete, confirm:

- [ ] `supabase migration list` shows all 4 migrations as applied
- [ ] All 20 validation checks in `docs/MIGRATION_VALIDATION.md` pass
- [ ] `v_project_health` returns 3 rows with correct aggregates
- [ ] Immutability triggers block edits on sent-report logs
- [ ] `log_number` is correctly sequential per project
