# PostgreSQL Schema Design — Mehayesod Platform

> Version 1.0 | 2026-06-14

---

## Design Principles

1. **UUIDs for all primary keys** — using `gen_random_uuid()` (Postgres 13+, Supabase built-in).
2. **Text over enums** — easier to migrate, easier to add values; constrained with `CHECK`.
3. **`timestamptz` for all timestamps** — always store timezone-aware timestamps in UTC.
4. **`jsonb` only for variable-length ordered arrays** — `work_description` is a list whose length varies and has no relational queries needed.
5. **Child tables for relational data** — `contractor_row` and `equipment_row` are proper tables, not JSON blobs, because they will be queried and aggregated (e.g., total workers per project per week).
6. **Polymorphic photo/comment** — simpler extension path than multiple FK columns.
7. **`updated_at` triggers** — every mutable table has an `updated_at` column kept current by a trigger.

---

## 1. Schema: `public`

All tables live in the `public` schema. In Phase 3, sensitive views may move to a restricted schema.

---

## 2. Tables

### 2.1 `project`

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
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_status ON public.project(status);
```

**Notes:**
- `manager` will become a FK to `auth.users` in Phase 3.
- `target_date >= start_date` constraint added in Phase 2 after seed data is validated.

---

### 2.2 `daily_log`

```sql
CREATE TABLE public.daily_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    date                DATE NOT NULL CHECK (date <= CURRENT_DATE),
    work_hours          TEXT NOT NULL DEFAULT '07:00-16:00',
    weather             TEXT NOT NULL DEFAULT '',
    submitted_by        TEXT NOT NULL,
    exceptional_events  TEXT NOT NULL DEFAULT 'אין',
    contractor_notes    TEXT NOT NULL DEFAULT 'אין',
    work_description    JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_daily_log_project_date UNIQUE (project_id, date)
);

CREATE INDEX idx_daily_log_project_id ON public.daily_log(project_id);
CREATE INDEX idx_daily_log_date_desc ON public.daily_log(date DESC);
CREATE INDEX idx_daily_log_project_date ON public.daily_log(project_id, date DESC);
```

**Notes:**
- `work_description` is `jsonb` (array of text strings). Example: `["קשירת ברזל קומה 2", "חפירת יסודות"]`
- `date <= CURRENT_DATE` prevents future log creation.
- `ON DELETE RESTRICT` on project_id prevents accidental project deletion if logs exist.
- `submitted_by` will become a UUID FK to `auth.users` in Phase 3.

---

### 2.3 `contractor_row`

```sql
CREATE TABLE public.contractor_row (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id  UUID NOT NULL REFERENCES public.daily_log(id) ON DELETE CASCADE,
    contractor    TEXT NOT NULL,
    trade         TEXT NOT NULL DEFAULT '',
    workers       INTEGER NOT NULL DEFAULT 1 CHECK (workers >= 0),
    notes         TEXT NOT NULL DEFAULT '',
    sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_contractor_row_log ON public.contractor_row(daily_log_id, sort_order);
```

**Notes:**
- `ON DELETE CASCADE` — deleting a daily log removes all its contractor rows.
- `sort_order` preserves the display order from the paper diary.

---

### 2.4 `equipment_row`

```sql
CREATE TABLE public.equipment_row (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id  UUID NOT NULL REFERENCES public.daily_log(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    notes         TEXT NOT NULL DEFAULT '',
    sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_equipment_row_log ON public.equipment_row(daily_log_id, sort_order);
```

---

### 2.5 `photo`

```sql
CREATE TABLE public.photo (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type  TEXT NOT NULL
                 CHECK (entity_type IN ('daily_log','issue','decision')),
    entity_id    UUID NOT NULL,
    storage_key  TEXT NOT NULL,
    caption      TEXT NOT NULL DEFAULT '',
    work_item    TEXT NOT NULL DEFAULT '',
    area         TEXT NOT NULL DEFAULT '',
    uploaded_by  TEXT NOT NULL DEFAULT '',
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photo_entity ON public.photo(entity_type, entity_id);
CREATE UNIQUE INDEX idx_photo_storage_key ON public.photo(storage_key);
```

**Notes:**
- No FK on `entity_id` — polymorphic pattern cannot use standard FK constraints.
- Application layer is responsible for ensuring `entity_id` references a real row.
- `storage_key` is unique — prevents duplicate upload records.
- `uploaded_by` will become FK to `auth.users` in Phase 3.

---

### 2.6 `report`

```sql
CREATE TABLE public.report (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    daily_log_id  UUID REFERENCES public.daily_log(id) ON DELETE SET NULL,
    type          TEXT NOT NULL DEFAULT 'daily'
                  CHECK (type IN ('daily','weekly','monthly')),
    date          DATE NOT NULL,
    status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','ready','sent')),
    sent_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_report_daily_log UNIQUE (daily_log_id)
);

CREATE INDEX idx_report_project_date ON public.report(project_id, date DESC);
CREATE INDEX idx_report_status ON public.report(status);
```

**Notes:**
- `daily_log_id` is nullable to support `weekly` and `monthly` aggregate reports.
- `UNIQUE (daily_log_id)` ensures one report per daily log. The constraint allows multiple NULLs (for aggregate reports).
- `ON DELETE SET NULL` on `daily_log_id` — if a log is deleted, the report record remains but loses its source reference (soft orphan, flagged in application logic).
- Report **content** is never stored here — it is assembled at render time from the referenced `daily_log`.

---

### 2.7 `issue`

```sql
CREATE TABLE public.issue (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
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
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_project_status ON public.issue(project_id, status);
CREATE INDEX idx_issue_severity ON public.issue(severity) WHERE status NOT IN ('closed','resolved');
CREATE INDEX idx_issue_due_date ON public.issue(due_date) WHERE due_date IS NOT NULL;
```

**Notes:**
- Partial index on severity excludes closed/resolved issues — keeps the executive dashboard query fast.
- `assigned_to` and `responsible_contractor` become FKs in Phase 3.

---

### 2.8 `comment`

```sql
CREATE TABLE public.comment (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type  TEXT NOT NULL
                 CHECK (entity_type IN ('issue','blocker','decision')),
    entity_id    UUID NOT NULL,
    author       TEXT NOT NULL,
    body         TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comment_entity ON public.comment(entity_type, entity_id, created_at);
```

---

### 2.9 `blocker`

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
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocker_project_status ON public.blocker(project_id, status);
CREATE INDEX idx_blocker_critical ON public.blocker(priority, status)
    WHERE priority = 'critical' AND status != 'resolved';
```

---

### 2.10 `decision`

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

## 3. `updated_at` Trigger

Apply to all tables that have `updated_at`:

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply to each mutable table:
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

## 4. Useful Database Views

### 4.1 Active Projects Missing Today's Log

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

### 4.2 Open Critical Items Per Project

```sql
CREATE VIEW public.v_project_health AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status NOT IN ('closed','resolved')) AS open_issues,
    COUNT(DISTINCT i.id) FILTER (WHERE i.severity = 'critical' AND i.status NOT IN ('closed','resolved')) AS critical_issues,
    COUNT(DISTINCT b.id) FILTER (WHERE b.status != 'resolved') AS open_blockers,
    COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'pending') AS pending_decisions,
    MAX(dl.date) AS last_log_date
FROM public.project p
LEFT JOIN public.issue    i  ON i.project_id  = p.id
LEFT JOIN public.blocker  b  ON b.project_id  = p.id
LEFT JOIN public.decision d  ON d.project_id  = p.id
LEFT JOIN public.daily_log dl ON dl.project_id = p.id
GROUP BY p.id, p.name;
```

---

## 5. Full Table List

| Table | Rows (seed) | Primary Access Pattern |
|---|---|---|
| project | 3 | All active; by ID |
| daily_log | 10 | By project + date range; latest per project |
| contractor_row | ~20 | By daily_log_id ordered by sort_order |
| equipment_row | ~30 | By daily_log_id ordered by sort_order |
| photo | ~20 | By entity_type + entity_id |
| report | 8 | By project + date desc; by daily_log_id |
| issue | 12 | By project + status + severity |
| comment | ~5 | By entity_type + entity_id |
| blocker | 6 | By project + status + priority |
| decision | 6 | By project + status |

---

## 6. Migration Strategy

Migrations will be managed via Supabase's migration system (`supabase/migrations/`). Each migration file is:
- Named with a timestamp prefix: `20260615000001_create_project.sql`
- Idempotent where possible (use `CREATE TABLE IF NOT EXISTS`)
- Applied in strict order
- Never modified after merging to main

See `docs/10-implementation-roadmap.md` for the migration sequence.
