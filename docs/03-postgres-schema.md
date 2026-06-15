# PostgreSQL Schema Design — Mehayesod Platform

> Version 1.1 | 2026-06-15
> Changes from v1.0: RC-01 (photo typed FKs), RC-02 (report cascade), RC-03 (aggregate uniqueness), RC-04 (project_member), RA-01 (resolved_at), RA-02 (discovered_in_log_id), RA-03 (CHECK constraints), RA-04 (index cleanup), RA-05 (log_number)

---

## Design Principles

1. **UUIDs for all primary keys** — using `gen_random_uuid()` (Postgres 13+, Supabase built-in).
2. **Text over enums** — easier to migrate, easier to add values; constrained with `CHECK`.
3. **`timestamptz` for all timestamps** — always store timezone-aware timestamps in UTC.
4. **`jsonb` only for variable-length ordered arrays** — `work_description` is a list whose length varies and has no relational queries needed.
5. **Child tables for relational data** — `contractor_row` and `equipment_row` are proper tables, not JSON blobs, because they will be queried and aggregated.
6. **Typed nullable FKs for photos** — replaced polymorphic pattern; enables PostgREST joins, FK cascade, and RLS authorization paths.
7. **`updated_at` triggers** — every mutable table has an `updated_at` column kept current by a trigger.

---

## Schema: `public`

All tables live in the `public` schema.

---

## Tables

### `project`

```sql
CREATE TABLE public.project (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    address       TEXT NOT NULL,
    client        TEXT NOT NULL,
    manager       TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'planning'
                  CHECK (status IN ('planning','active','on_hold','completed')),
    start_date    DATE NOT NULL,
    target_date   DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_project_dates CHECK (target_date >= start_date)
);

CREATE INDEX idx_project_status ON public.project(status);
```

**Notes:**
- `manager` is a legacy display field. True team membership is in `project_member`.
- `CONSTRAINT chk_project_dates` added per RA-03 — zero cost to enforce now.

---

### `daily_log`

```sql
CREATE TABLE public.daily_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    date                DATE NOT NULL CHECK (date <= CURRENT_DATE),
    log_number          INTEGER,
    work_hours          TEXT NOT NULL DEFAULT '07:00-16:00',
    weather             TEXT NOT NULL DEFAULT '',
    submitted_by        TEXT NOT NULL,
    exceptional_events  TEXT NOT NULL DEFAULT 'אין',
    contractor_notes    TEXT NOT NULL DEFAULT 'אין',
    work_description    JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_daily_log_project_date   UNIQUE (project_id, date),
    CONSTRAINT uq_daily_log_project_number UNIQUE (project_id, log_number)
);

CREATE INDEX idx_daily_log_project_date ON public.daily_log(project_id, date DESC);
```

**Notes:**
- `log_number` is assigned by the `assign_log_number` trigger (see Triggers section). It is NOT nullable by business intent but is nullable in the column definition so the trigger can assign it before the NOT NULL check fires.
- `UNIQUE (project_id, log_number)` is the integrity backstop against any trigger race condition.
- Removed `idx_daily_log_project_id` (RA-04: redundant — leftmost prefix of composite index covers it).
- Removed `idx_daily_log_date_desc` (RA-04: no identified cross-project date-only query in MVP).

---

### `project_member`

```sql
CREATE TABLE public.project_member (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL,
    -- PHASE 3 MIGRATION: ADD CONSTRAINT fk_pm_user
    --   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    role        TEXT NOT NULL DEFAULT 'field_manager'
                CHECK (role IN ('field_manager','company_manager','admin','viewer')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_member_user    ON public.project_member(user_id);
CREATE INDEX idx_project_member_project ON public.project_member(project_id);
```

**Notes:**
- `user_id` is UUID but carries no FK constraint until auth is enabled in Phase 3.
- `ON DELETE CASCADE` on `project_id` — when a project is deleted, all member records are removed.
- `viewer` role supports future client portal access (read-only).
- RLS policies in Phase 3 will query this table to scope field manager access, instead of reading from JWT `app_metadata.project_ids`.

---

### `contractor_row`

```sql
CREATE TABLE public.contractor_row (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id  UUID NOT NULL REFERENCES public.daily_log(id) ON DELETE CASCADE,
    contractor    TEXT NOT NULL,
    trade         TEXT NOT NULL DEFAULT '',
    workers       INTEGER NOT NULL DEFAULT 1 CHECK (workers >= 1),
    notes         TEXT NOT NULL DEFAULT '',
    sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_contractor_row_log ON public.contractor_row(daily_log_id, sort_order);
```

**Notes:**
- `workers >= 1` per RA-03: a contractor row with zero workers is a data entry error.
- `sort_order` preserves the display order from the paper diary.

---

### `equipment_row`

```sql
CREATE TABLE public.equipment_row (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id  UUID NOT NULL REFERENCES public.daily_log(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    notes         TEXT NOT NULL DEFAULT '',
    sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_equipment_row_log ON public.equipment_row(daily_log_id, sort_order);
```

---

### `issue`

```sql
CREATE TABLE public.issue (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    discovered_in_log_id    UUID REFERENCES public.daily_log(id) ON DELETE SET NULL,
    title                   TEXT NOT NULL,
    location                TEXT NOT NULL DEFAULT '',
    description             TEXT NOT NULL DEFAULT '',
    responsible_contractor  TEXT NOT NULL DEFAULT '',
    assigned_to             TEXT NOT NULL DEFAULT '',
    due_date                DATE,
    severity                TEXT NOT NULL DEFAULT 'medium'
                            CHECK (severity IN ('low','medium','high','critical')),
    status                  TEXT NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','in_progress','resolved','reopened','closed')),
    resolved_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_project_status ON public.issue(project_id, status);
CREATE INDEX idx_issue_severity ON public.issue(severity) WHERE status NOT IN ('closed','resolved');
CREATE INDEX idx_issue_due_date ON public.issue(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_issue_discovered_log ON public.issue(discovered_in_log_id)
    WHERE discovered_in_log_id IS NOT NULL;
```

**Notes:**
- `discovered_in_log_id` (RA-02): optional FK to the daily log in which the defect was first observed. `ON DELETE SET NULL` — the issue persists if the log is deleted.
- `resolved_at` (RA-01): set by the `set_resolved_at` trigger when status transitions to `'resolved'` or `'closed'`. Not cleared on `'reopened'` — preserves first resolution time for analytics.
- `assigned_to` and `responsible_contractor` become FKs in Phase 3.

---

### `photo`

```sql
CREATE TABLE public.photo (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id  UUID REFERENCES public.daily_log(id) ON DELETE CASCADE,
    issue_id      UUID REFERENCES public.issue(id) ON DELETE CASCADE,
    storage_key   TEXT NOT NULL,
    caption       TEXT NOT NULL DEFAULT '',
    work_item     TEXT NOT NULL DEFAULT '',
    area          TEXT NOT NULL DEFAULT '',
    uploaded_by   TEXT NOT NULL DEFAULT '',
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT photo_exactly_one_parent CHECK (
        (daily_log_id IS NOT NULL)::int +
        (issue_id IS NOT NULL)::int = 1
    )
);

CREATE INDEX idx_photo_daily_log ON public.photo(daily_log_id) WHERE daily_log_id IS NOT NULL;
CREATE INDEX idx_photo_issue     ON public.photo(issue_id)     WHERE issue_id IS NOT NULL;
CREATE UNIQUE INDEX idx_photo_storage_key ON public.photo(storage_key);
```

**Notes (RC-01):**
- Polymorphic `entity_type / entity_id` replaced with typed nullable FKs.
- `CONSTRAINT photo_exactly_one_parent` enforces that every photo belongs to exactly one parent entity.
- `ON DELETE CASCADE` on both FKs — when a daily log or issue is deleted, its photos are also deleted and the storage objects become eligible for cleanup.
- PostgREST can now auto-join photos using the FK relationships.
- `uploaded_by` becomes FK to `auth.users` in Phase 3.
- Partial indexes on each FK column keep the non-null queries fast while ignoring null rows.
- To add support for `decision` photos in Phase 2: `ALTER TABLE photo ADD COLUMN decision_id UUID REFERENCES public.decision(id) ON DELETE CASCADE;` and update the CHECK constraint.

---

### `issue_comment`

```sql
CREATE TABLE public.issue_comment (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id  UUID NOT NULL REFERENCES public.issue(id) ON DELETE CASCADE,
    author    TEXT NOT NULL,
    body      TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_comment ON public.issue_comment(issue_id, created_at);
```

**Notes (RC-01 secondary):**
- Renamed from `comment` and converted from polymorphic to typed FK.
- `ON DELETE CASCADE` — deleting an issue removes its comments.
- When comments on blockers or decisions are needed in Phase 2, a `blocker_comment` table is added (same pattern, no migration of existing data).
- `author` becomes FK to `auth.users` in Phase 3.

---

### `blocker`

```sql
CREATE TABLE public.blocker (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    title        TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    impact       TEXT NOT NULL DEFAULT '',
    responsible  TEXT NOT NULL DEFAULT '',
    due_date     DATE,
    priority     TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low','medium','high','critical')),
    status       TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','in_progress','resolved')),
    resolved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocker_project_status ON public.blocker(project_id, status);
CREATE INDEX idx_blocker_critical ON public.blocker(priority, status)
    WHERE priority = 'critical' AND status != 'resolved';
```

**Notes:**
- `resolved_at` (RA-01): set by the `set_resolved_at` trigger when status transitions to `'resolved'`.

---

### `decision`

```sql
CREATE TABLE public.decision (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    requested_by  TEXT NOT NULL DEFAULT '',
    owner         TEXT NOT NULL DEFAULT '',
    due_date      DATE,
    status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','deferred')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_decision_project_status ON public.decision(project_id, status);
CREATE INDEX idx_decision_pending ON public.decision(due_date)
    WHERE status = 'pending';
```

---

### `report`

```sql
CREATE TABLE public.report (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    daily_log_id    UUID REFERENCES public.daily_log(id) ON DELETE CASCADE,
    type            TEXT NOT NULL DEFAULT 'daily'
                    CHECK (type IN ('daily','weekly','monthly')),
    date            DATE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','ready','sent')),
    sent_at         TIMESTAMPTZ,
    pdf_storage_key TEXT,
    pdf_generated_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_report_daily_log UNIQUE (daily_log_id)
);

CREATE INDEX idx_report_project_date   ON public.report(project_id, date DESC);
CREATE INDEX idx_report_project_status ON public.report(project_id, status);

-- RC-03: Prevent duplicate weekly/monthly reports per project per period
CREATE UNIQUE INDEX uq_report_aggregate
ON public.report (project_id, type, date)
WHERE type IN ('weekly', 'monthly');
```

**Notes (RC-02):**
- `ON DELETE CASCADE` on `daily_log_id`: deleting a daily log cascades to draft/ready reports. Sent reports are protected by the `prevent_log_delete_if_report_sent` trigger — the CASCADE never fires for sent reports.
- `UNIQUE (daily_log_id)` allows multiple NULLs (weekly/monthly reports with no single source log).
- `pdf_storage_key` and `pdf_generated_at`: columns for immutable PDF snapshot (Phase 4). Included now to avoid a migration on a populated table.

---

## Triggers

### `set_updated_at` — Auto-update timestamp

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.project
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.daily_log
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.issue
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.blocker
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.decision
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

---

### `assign_log_number` — Sequential log numbering per project (RA-05)

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

**Display format** (computed at API/render layer, not stored):
```sql
'LOG-' || to_char(dl.date, 'YYYY') || '-' || lpad(dl.log_number::text, 6, '0')
-- Example: log_number=47, date=2026-06-15 → 'LOG-2026-000047'
```

---

### `set_resolved_at` — Capture first resolution timestamp (RA-01)

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

---

### `prevent_log_edit_if_report_sent` — Immutability after report sent

```sql
CREATE OR REPLACE FUNCTION public.prevent_log_edit_if_report_sent()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.report
        WHERE daily_log_id = OLD.id AND status = 'sent'
    ) THEN
        RAISE EXCEPTION
            'Cannot modify daily log % — its report has been sent to the client', OLD.id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_log_edit_if_report_sent
    BEFORE UPDATE ON public.daily_log
    FOR EACH ROW EXECUTE FUNCTION public.prevent_log_edit_if_report_sent();
```

---

### `prevent_log_delete_if_report_sent` — Delete guard (RC-02)

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

---

## Database Views

### `v_projects_missing_log_today`

```sql
CREATE VIEW public.v_projects_missing_log_today AS
SELECT p.id, p.name, p.manager
FROM public.project p
WHERE p.status = 'active'
  AND NOT EXISTS (
      SELECT 1 FROM public.daily_log dl
      WHERE dl.project_id = p.id
        AND dl.date = CURRENT_DATE
  );
```

### `v_project_health`

```sql
CREATE VIEW public.v_project_health AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status NOT IN ('closed','resolved')) AS open_issues,
    COUNT(DISTINCT i.id) FILTER (WHERE i.severity = 'critical'
                                   AND i.status NOT IN ('closed','resolved')) AS critical_issues,
    COUNT(DISTINCT b.id) FILTER (WHERE b.status != 'resolved') AS open_blockers,
    COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'pending') AS pending_decisions,
    MAX(dl.date) AS last_log_date
FROM public.project p
LEFT JOIN public.issue     i  ON i.project_id  = p.id
LEFT JOIN public.blocker   b  ON b.project_id  = p.id
LEFT JOIN public.decision  d  ON d.project_id  = p.id
LEFT JOIN public.daily_log dl ON dl.project_id = p.id
GROUP BY p.id, p.name;
```

---

## Complete Table List

| Table | Rows (seed) | Primary Access Pattern |
|---|---|---|
| project | 3 | All active; by ID |
| daily_log | 10 | By project + date range; by project_id DESC date |
| project_member | ~6 | By user_id; by project_id |
| contractor_row | ~20 | By daily_log_id ordered by sort_order |
| equipment_row | ~30 | By daily_log_id ordered by sort_order |
| issue | 12 | By project_id + status + severity |
| photo | ~20 | By daily_log_id; by issue_id |
| issue_comment | ~5 | By issue_id ordered by created_at |
| blocker | 6 | By project_id + status + priority |
| decision | 6 | By project_id + status |
| report | 8 | By project_id + date DESC; by daily_log_id |

---

## Migration File Order

```
supabase/migrations/
├── 20260615000001_create_project.sql
├── 20260615000002_create_daily_log.sql
├── 20260615000003_create_project_member.sql
├── 20260615000004_create_contractor_row.sql
├── 20260615000005_create_equipment_row.sql
├── 20260615000006_create_issue.sql          ← must come before photo (FK dependency)
├── 20260615000007_create_photo.sql          ← depends on daily_log + issue
├── 20260615000008_create_issue_comment.sql
├── 20260615000009_create_blocker.sql
├── 20260615000010_create_decision.sql
├── 20260615000011_create_report.sql
├── 20260615000012_create_triggers.sql
├── 20260615000013_create_views.sql
└── 20260615000014_seed_dev_data.sql
```

**Key change from v1.0:** `issue` must now migrate before `photo` because `photo.issue_id` references `issue.id`.
