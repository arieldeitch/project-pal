# Architecture Changes — Mehayesod Platform

> Version 1.0 | 2026-06-15
> Triggered by: docs/ARCHITECTURE_REVIEW.md

This document is the authoritative change log for all architectural corrections and additions applied after the formal review. Every change is traceable to a specific review finding.

---

## RC-01 — Photo Architecture: Typed Nullable FKs (Option A Selected)

**Review finding:** The polymorphic photo pattern (`entity_type` + `entity_id`) is incompatible with Supabase PostgREST's FK-driven auto-join system. The report assembly query in doc 05 would fail at runtime with a relationship resolution error.

### Decision: Option A — Typed Nullable Foreign Keys

**Rejected: Option B (keep polymorphic, two-query retrieval)**

| Criterion | Option A (Typed FKs) | Option B (Polymorphic + 2 queries) |
|---|---|---|
| PostgREST join support | ✅ Native | ❌ None |
| DB-level referential integrity | ✅ Full cascade | ❌ None (orphan risk) |
| ON DELETE CASCADE | ✅ Automatic | ❌ Manual cleanup required |
| RLS authorization path | ✅ Simple (join via FK) | ❌ Complex (no join path) |
| Adding a new parent entity type | Requires new column + migration | No schema change |
| Current parent types | 2 (daily_log, issue) | 2 |
| Data integrity enforcement | DB-level CHECK constraint | Application layer only |

**Rationale for Option A:**

Supabase PostgREST is the query engine for the entire API layer. Its fundamental model is FK-driven relationship traversal. The polymorphic pattern requires abandoning this mechanism entirely, losing auto-joins for all photo queries — not just the one identified in the review.

With only two parent entity types in scope for production MVP (`daily_log` and `issue`), the "one column per parent" pattern is entirely manageable. Adding a third type (`decision`, `blocker`) in Phase 2 is a non-breaking `ALTER TABLE ADD COLUMN` migration.

The CHECK constraint (`exactly_one_parent_not_null`) enforces data integrity at the database level with zero application-layer code.

### Changes Applied

**`photo` table — before:**
```sql
entity_type  TEXT NOT NULL CHECK (entity_type IN ('daily_log','issue','decision')),
entity_id    UUID NOT NULL,
```

**`photo` table — after:**
```sql
daily_log_id  UUID REFERENCES public.daily_log(id) ON DELETE CASCADE,
issue_id      UUID REFERENCES public.issue(id) ON DELETE CASCADE,

CONSTRAINT photo_exactly_one_parent CHECK (
    (daily_log_id IS NOT NULL)::int +
    (issue_id IS NOT NULL)::int = 1
)
```

**`comment` table — secondary correction (same pattern):**

The `comment` table also used a polymorphic pattern (`entity_type IN ('issue','blocker','decision')`). For Phase 1, comments only attach to issues. Applying the same typed-FK correction:

```sql
-- Before
entity_type  TEXT NOT NULL CHECK (entity_type IN ('issue','blocker','decision')),
entity_id    UUID NOT NULL,

-- After
issue_id  UUID NOT NULL REFERENCES public.issue(id) ON DELETE CASCADE,
```

The `entity_type` and `entity_id` columns are removed. The table is renamed `issue_comment` for clarity. When comments on blockers or decisions are needed in Phase 2, a new `blocker_comment` table or a new column is added — the schema cost is the same either way and clarity is preserved.

**`docs/05` photo query — before (broken):**
```typescript
photos:photo!entity_id (storage_key, caption, work_item, area)
```

**`docs/05` photo query — after (working):**
```typescript
photos:photo!daily_log_id (storage_key, caption, work_item, area)
```

The `!daily_log_id` hint tells PostgREST to use the `daily_log_id` FK when joining `photo` to `daily_log`. This works because a real FK now exists.

**Files updated:** `docs/01-domain-model.md`, `docs/02-erd.md`, `docs/03-postgres-schema.md`, `docs/05-report-generation-engine.md`

---

## RC-02 — Report Integrity: ON DELETE CASCADE with Sent Guard

**Review finding:** `report.daily_log_id ON DELETE SET NULL` creates permanently empty orphan reports. If a daily log with a draft or ready report is deleted, the report survives with `daily_log_id = NULL` and can never be rendered.

### Decision: ON DELETE CASCADE + Sent-Report Delete Guard Trigger

**Rejected: ON DELETE RESTRICT**

ON DELETE RESTRICT would block ALL log deletion if any report exists. This creates friction: a field manager who made an error on the same day's log would need to explicitly delete the draft report first, then delete the log. In practice managers will find this confusing.

**Selected: ON DELETE CASCADE with a guard trigger preventing deletion of logs with `sent` reports.**

Behavior:
- Log with no report → can be deleted (nothing cascades)
- Log with `draft` or `ready` report → log + report both deleted (CASCADE)
- Log with `sent` report → deletion blocked by trigger (legal document protection)

This is the least-friction approach that still enforces the critical legal invariant.

### Changes Applied

**`report` table FK — before:**
```sql
daily_log_id  UUID REFERENCES public.daily_log(id) ON DELETE SET NULL,
```

**`report` table FK — after:**
```sql
daily_log_id  UUID REFERENCES public.daily_log(id) ON DELETE CASCADE,
```

**New trigger added:**
```sql
CREATE OR REPLACE FUNCTION public.prevent_log_delete_if_report_sent()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.report
        WHERE daily_log_id = OLD.id AND status = 'sent'
    ) THEN
        RAISE EXCEPTION
            'Cannot delete daily log % — its report has been sent to the client', OLD.id;
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER prevent_log_delete_if_report_sent
    BEFORE DELETE ON public.daily_log
    FOR EACH ROW EXECUTE FUNCTION public.prevent_log_delete_if_report_sent();
```

**Files updated:** `docs/03-postgres-schema.md`

---

## RC-03 — Report Uniqueness: Aggregate Report Deduplication Index

**Review finding:** No constraint prevents generating duplicate weekly or monthly reports for the same project and period. A manager who clicks "Generate Weekly Report" twice creates two identical records.

### Changes Applied

**New partial unique index:**
```sql
CREATE UNIQUE INDEX uq_report_aggregate
ON public.report (project_id, type, date)
WHERE type IN ('weekly', 'monthly');
```

This index does not interfere with daily reports, which are already deduplicated by `UNIQUE (daily_log_id)`.

**Note on `idx_report_status`:** This index was also improved from a global `INDEX(status)` to `INDEX(project_id, status)`, since reports are always queried within a project context. The original single-column index was low-value.

**Files updated:** `docs/03-postgres-schema.md`

---

## RC-04 — Future Authentication Readiness: `project_member` Table

**Review finding:** Storing `project_ids` in the JWT `app_metadata` causes stale access — assignments don't update until the JWT expires. More fundamentally, there is no junction table for the many-to-many relationship between projects and team members.

### Decision: Add `project_member` table now, FK to `auth.users` added in Phase 3

The table is created now without the `auth.users` FK (since auth is not yet implemented). A comment in the migration documents that `ALTER TABLE project_member ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)` is applied in the Phase 3 migration.

This is not premature implementation — it is a schema placeholder that makes the auth migration non-destructive. Without this table, the Phase 3 auth migration must add a table AND rewrite all RLS policies simultaneously.

```sql
CREATE TABLE public.project_member (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL,
    -- NOTE: user_id gains FK → auth.users(id) ON DELETE CASCADE in Phase 3 migration
    role        TEXT NOT NULL DEFAULT 'field_manager'
                CHECK (role IN ('field_manager','company_manager','admin','viewer')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_member_user ON public.project_member(user_id);
CREATE INDEX idx_project_member_project ON public.project_member(project_id);
```

### Impact on RLS Design (doc 04)

The RLS policy templates in `docs/04-supabase-architecture.md` are updated to query `project_member` instead of JWT `app_metadata.project_ids`. This eliminates the JWT staleness problem:

```sql
-- Updated: reads from project_member table (live), not JWT claims (stale)
CREATE POLICY "field_manager_read_own_projects_logs"
ON public.daily_log FOR SELECT TO authenticated
USING (
    project_id IN (
        SELECT pm.project_id FROM public.project_member pm
        WHERE pm.user_id = auth.uid()
    )
);
```

The JWT `app_metadata.role` claim is still used for the role check (field_manager vs company_manager), but project scoping is always derived from the live `project_member` table.

### Impact on Domain Model (doc 01)

`project_member` is added as entity 2.11. The `project.manager` text field is clarified as a legacy display field; true team membership is modeled in `project_member`.

**Files updated:** `docs/01-domain-model.md`, `docs/02-erd.md`, `docs/03-postgres-schema.md`, `docs/04-supabase-architecture.md`

---

## RA-01 — `resolved_at` Timestamps on Issues and Blockers

**Review finding:** `updated_at` fires on any update, making it impossible to determine when an issue or blocker was resolved from the schema alone.

### Changes Applied

Added `resolved_at TIMESTAMPTZ NULL` to `issue` and `blocker` tables.

Set automatically by trigger when `status` changes to `'resolved'` or `'closed'`. Not cleared on `'reopened'` — the timestamp captures first resolution. For issues that are reopened and re-resolved, only the first resolution time is preserved (sufficient for MVP analytics; a full audit log is Phase 5).

```sql
CREATE OR REPLACE FUNCTION public.set_resolved_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status IN ('resolved','closed')
       AND (OLD.status IS NULL OR OLD.status NOT IN ('resolved','closed')) THEN
        NEW.resolved_at = now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_resolved_at BEFORE UPDATE ON public.issue
    FOR EACH ROW EXECUTE FUNCTION public.set_resolved_at();

CREATE TRIGGER set_resolved_at BEFORE UPDATE ON public.blocker
    FOR EACH ROW EXECUTE FUNCTION public.set_resolved_at();
```

**Files updated:** `docs/01-domain-model.md`, `docs/02-erd.md`, `docs/03-postgres-schema.md`

---

## RA-02 — `discovered_in_log_id` on Issues

**Review finding:** Issues have no link to the daily log in which the defect was first observed. The daily report cannot list "issues discovered today."

### Changes Applied

Added `discovered_in_log_id UUID REFERENCES public.daily_log(id) ON DELETE SET NULL` to the `issue` table.

`ON DELETE SET NULL` is correct: if the source daily log is later deleted, the issue persists (it is an independent record) but loses its discovery reference.

This field is optional (nullable). The UI presents it as "Discovered during log (optional)" in the issue creation form, pre-filled when an issue is created from within the daily log detail view.

**Files updated:** `docs/01-domain-model.md`, `docs/02-erd.md`, `docs/03-postgres-schema.md`

---

## RA-03 — Additional Business Integrity CHECK Constraints

**Review finding:** Several constraints were deferred to "Phase 2" but cost nothing to add now.

### Changes Applied

**`project` table:**
```sql
-- Added date order constraint
CONSTRAINT chk_project_dates CHECK (target_date >= start_date)
```

**`daily_log` table:**
The existing `CHECK (date <= CURRENT_DATE)` is kept. A minimum workers check is intentionally omitted — a log with zero workers (equipment-only day, site inspection) is valid.

**`contractor_row` table:**
```sql
-- Tightened: workers must be positive when a row exists
CHECK (workers >= 1)
```
Rationale: If a contractor row exists, at least one worker must be present. A row with zero workers is a data entry error.

**Files updated:** `docs/03-postgres-schema.md`

---

## RA-04 — Redundant Index Removal

**Review finding:** `idx_daily_log_project_id` is made redundant by the composite `idx_daily_log_project_date`. `idx_daily_log_date_desc` has no identified MVP use case.

### Changes Applied

**Removed:**
- `idx_daily_log_project_id` — redundant (leftmost prefix of composite index covers this)
- `idx_daily_log_date_desc` — no identified cross-project date-only query in MVP

**Improved:**
- `idx_report_status` → replaced with `idx_report_project_status ON report(project_id, status)` — reports are always queried within a project context; the global status-only index was rarely the optimal access path

**Retained (no change):** All other indexes as designed.

**Files updated:** `docs/03-postgres-schema.md`

---

## RA-05 — Daily Log Numbering: `log_number`

**Review finding:** The paper diary uses sequential log numbers cited in contracts and legal documents. UUIDs are not human-readable and cannot be cited ("per Daily Log #47...").

### Design Decision: Integer Sequence Per Project, Formatted Display at API Layer

**Do not store the formatted string** (`LOG-2026-000001`) in the database. Store only `log_number INTEGER`, which is an auto-incrementing counter scoped per project.

The display format is computed at the API/render layer:
```
'LOG-' || to_char(dl.date, 'YYYY') || '-' || lpad(dl.log_number::text, 6, '0')
```

Example: log_number = 47, date = 2026-06-15 → `LOG-2026-000047`

The year in the formatted ID comes from the log's date (not the project start year), so a log submitted in 2027 on a project that started in 2026 shows `LOG-2027-000XXX`.

### Generation Strategy

Log numbers are assigned by a `BEFORE INSERT` trigger (not application code). Using the trigger ensures:
- The number is assigned atomically with the insert
- No application bug can skip a number or assign a duplicate

```sql
CREATE OR REPLACE FUNCTION public.assign_log_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    SELECT COALESCE(MAX(log_number), 0) + 1
    INTO NEW.log_number
    FROM public.daily_log
    WHERE project_id = NEW.project_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER assign_log_number BEFORE INSERT ON public.daily_log
    FOR EACH ROW EXECUTE FUNCTION public.assign_log_number();
```

A `UNIQUE (project_id, log_number)` constraint serves as the integrity backstop against any race condition. For MVP with one field manager per project submitting once per day, a race condition is not a realistic risk.

**Note:** `log_number` is NOT included in the `UNIQUE (project_id, date)` constraint. The uniqueness of one log per (project, date) is the business invariant; `log_number` is a derived display identifier.

**Files updated:** `docs/01-domain-model.md`, `docs/02-erd.md`, `docs/03-postgres-schema.md`

---

## Change Impact Summary

| Document | Sections Changed | Nature |
|---|---|---|
| `01-domain-model.md` | §2.2, §2.5, §2.7, §2.8, §2.11 (new), §3, §4 | Added entities and attributes |
| `02-erd.md` | All entity blocks, all relationship lines, indexes table | Structural update |
| `03-postgres-schema.md` | photo, report, issue, blocker, daily_log, comment tables; triggers; indexes | Schema corrections |
| `04-supabase-architecture.md` | §5.1 design principles, §5.2 policy templates | RLS strategy update |
| `05-report-generation-engine.md` | §3 data assembly query | Photo join fix |
| `MASTER_SUMMARY.md` | Architecture decisions §3, §11 (new) | Decision record update |

## Migration Order Impact

The corrected migration order (accounting for FK dependencies):

```
1. project
2. daily_log             (FK → project)
3. project_member        (FK → project; no auth.users FK yet)
4. contractor_row        (FK → daily_log)
5. equipment_row         (FK → daily_log)
6. issue                 (FK → project, daily_log [discovered_in_log_id])
7. photo                 (FK → daily_log, issue)
8. issue_comment         (FK → issue)
9. blocker               (FK → project)
10. decision             (FK → project)
11. report               (FK → project, daily_log)
12. triggers             (updated_at, assign_log_number, set_resolved_at, prevent_log_delete_if_report_sent, prevent_log_edit_if_report_sent)
13. views                (v_projects_missing_log_today, v_project_health)
14. seed data
```

`issue` must now come before `photo` because `photo.issue_id` references `issue`. This is a change from the original migration order in `docs/10-implementation-roadmap.md`.
