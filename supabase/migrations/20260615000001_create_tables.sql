-- ============================================================
-- MIGRATION 001: CORE TABLES
-- Mehayesod Construction Project Execution Platform
-- Schema version: v1.1 (post architecture review)
-- Migration order: project → daily_log → project_member →
--   contractor_row → equipment_row → issue → photo →
--   issue_comment → blocker → decision → report
-- ============================================================

-- ============================================================
-- TABLE: project
-- Top-level container for all entities
-- ============================================================
CREATE TABLE public.project (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    address     TEXT        NOT NULL,
    client      TEXT        NOT NULL,
    manager     TEXT        NOT NULL,
    status      TEXT        NOT NULL DEFAULT 'planning'
                            CHECK (status IN ('planning','active','on_hold','completed')),
    start_date  DATE        NOT NULL,
    target_date DATE        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_project_dates CHECK (target_date >= start_date)
);

CREATE INDEX idx_project_status ON public.project(status);


-- ============================================================
-- TABLE: daily_log
-- The system's most critical entity. One per (project, date).
-- log_number is assigned by trigger (see migration 003).
-- ============================================================
CREATE TABLE public.daily_log (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID        NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    date                DATE        NOT NULL CHECK (date <= CURRENT_DATE),
    log_number          INTEGER,
    work_hours          TEXT        NOT NULL DEFAULT '07:00-16:00',
    weather             TEXT        NOT NULL DEFAULT '',
    submitted_by        TEXT        NOT NULL,
    exceptional_events  TEXT        NOT NULL DEFAULT 'אין',
    contractor_notes    TEXT        NOT NULL DEFAULT 'אין',
    work_description    JSONB       NOT NULL DEFAULT '[]'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_daily_log_project_date   UNIQUE (project_id, date),
    CONSTRAINT uq_daily_log_project_number UNIQUE (project_id, log_number)
);

CREATE INDEX idx_daily_log_project_date ON public.daily_log(project_id, date DESC);


-- ============================================================
-- TABLE: project_member
-- Junction table between projects and users.
-- user_id FK to auth.users added in Phase 3 migration.
-- ============================================================
CREATE TABLE public.project_member (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID        NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    -- PHASE 3: ADD CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    user_id     UUID        NOT NULL,
    role        TEXT        NOT NULL DEFAULT 'field_manager'
                            CHECK (role IN ('field_manager','company_manager','admin','viewer')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_member_user    ON public.project_member(user_id);
CREATE INDEX idx_project_member_project ON public.project_member(project_id);


-- ============================================================
-- TABLE: contractor_row
-- One row per contractor company on site per day.
-- ============================================================
CREATE TABLE public.contractor_row (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id UUID    NOT NULL REFERENCES public.daily_log(id) ON DELETE CASCADE,
    contractor   TEXT    NOT NULL,
    trade        TEXT    NOT NULL DEFAULT '',
    workers      INTEGER NOT NULL DEFAULT 1 CHECK (workers >= 1),
    notes        TEXT    NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_contractor_row_log ON public.contractor_row(daily_log_id, sort_order);


-- ============================================================
-- TABLE: equipment_row
-- One row per equipment type used per day.
-- ============================================================
CREATE TABLE public.equipment_row (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id UUID    NOT NULL REFERENCES public.daily_log(id) ON DELETE CASCADE,
    name         TEXT    NOT NULL,
    quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    notes        TEXT    NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_equipment_row_log ON public.equipment_row(daily_log_id, sort_order);


-- ============================================================
-- TABLE: issue
-- Field-observed quality defects and punch-list items.
-- Must be created BEFORE photo (typed FK dependency).
-- ============================================================
CREATE TABLE public.issue (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id            UUID        NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    discovered_in_log_id  UUID        REFERENCES public.daily_log(id) ON DELETE SET NULL,
    title                 TEXT        NOT NULL,
    location              TEXT        NOT NULL DEFAULT '',
    description           TEXT        NOT NULL DEFAULT '',
    responsible_contractor TEXT       NOT NULL DEFAULT '',
    assigned_to           TEXT        NOT NULL DEFAULT '',
    due_date              DATE,
    severity              TEXT        NOT NULL DEFAULT 'medium'
                                      CHECK (severity IN ('low','medium','high','critical')),
    status                TEXT        NOT NULL DEFAULT 'open'
                                      CHECK (status IN ('open','in_progress','resolved','reopened','closed')),
    resolved_at           TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_project_status   ON public.issue(project_id, status);
CREATE INDEX idx_issue_severity         ON public.issue(severity) WHERE status NOT IN ('closed','resolved');
CREATE INDEX idx_issue_due_date         ON public.issue(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_issue_discovered_log   ON public.issue(discovered_in_log_id) WHERE discovered_in_log_id IS NOT NULL;


-- ============================================================
-- TABLE: photo
-- RC-01: Typed nullable FK columns replace polymorphic pattern.
-- Exactly one of (daily_log_id, issue_id) must be non-null.
-- ============================================================
CREATE TABLE public.photo (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id UUID        REFERENCES public.daily_log(id) ON DELETE CASCADE,
    issue_id     UUID        REFERENCES public.issue(id) ON DELETE CASCADE,
    storage_key  TEXT        NOT NULL,
    caption      TEXT        NOT NULL DEFAULT '',
    work_item    TEXT        NOT NULL DEFAULT '',
    area         TEXT        NOT NULL DEFAULT '',
    uploaded_by  TEXT        NOT NULL DEFAULT '',
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT photo_exactly_one_parent CHECK (
        (daily_log_id IS NOT NULL)::int + (issue_id IS NOT NULL)::int = 1
    )
);

CREATE INDEX idx_photo_daily_log    ON public.photo(daily_log_id) WHERE daily_log_id IS NOT NULL;
CREATE INDEX idx_photo_issue        ON public.photo(issue_id) WHERE issue_id IS NOT NULL;
CREATE UNIQUE INDEX idx_photo_storage_key ON public.photo(storage_key);


-- ============================================================
-- TABLE: issue_comment
-- RC-01: Direct FK to issue (replaces polymorphic comment table).
-- ============================================================
CREATE TABLE public.issue_comment (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id   UUID        NOT NULL REFERENCES public.issue(id) ON DELETE CASCADE,
    author     TEXT        NOT NULL,
    body       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_comment ON public.issue_comment(issue_id, created_at);


-- ============================================================
-- TABLE: blocker
-- Management-level impediments that prevent project progress.
-- ============================================================
CREATE TABLE public.blocker (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID        NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    title       TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    impact      TEXT        NOT NULL DEFAULT '',
    responsible TEXT        NOT NULL DEFAULT '',
    due_date    DATE,
    priority    TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('low','medium','high','critical')),
    status      TEXT        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','in_progress','resolved')),
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocker_project_status ON public.blocker(project_id, status);
CREATE INDEX idx_blocker_critical       ON public.blocker(priority, status)
    WHERE priority = 'critical' AND status != 'resolved';


-- ============================================================
-- TABLE: decision
-- Management approvals required to unblock work.
-- ============================================================
CREATE TABLE public.decision (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID        NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    title        TEXT        NOT NULL,
    description  TEXT        NOT NULL DEFAULT '',
    requested_by TEXT        NOT NULL DEFAULT '',
    owner        TEXT        NOT NULL DEFAULT '',
    due_date     DATE,
    status       TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected','deferred')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_decision_project_status ON public.decision(project_id, status);
CREATE INDEX idx_decision_pending        ON public.decision(due_date) WHERE status = 'pending';


-- ============================================================
-- TABLE: report
-- Metadata only. Content assembled at render time from daily_log.
-- RC-02: ON DELETE CASCADE (not SET NULL) + trigger blocks sent-log deletion.
-- RC-03: Partial unique index covers weekly/monthly deduplication.
-- ============================================================
CREATE TABLE public.report (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id        UUID        NOT NULL REFERENCES public.project(id) ON DELETE RESTRICT,
    daily_log_id      UUID        REFERENCES public.daily_log(id) ON DELETE CASCADE,
    type              TEXT        NOT NULL DEFAULT 'daily'
                                  CHECK (type IN ('daily','weekly','monthly')),
    date              DATE        NOT NULL,
    status            TEXT        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft','ready','sent')),
    sent_at           TIMESTAMPTZ,
    pdf_storage_key   TEXT,
    pdf_generated_at  TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_report_daily_log UNIQUE (daily_log_id)
);

CREATE INDEX idx_report_project_date   ON public.report(project_id, date DESC);
CREATE INDEX idx_report_project_status ON public.report(project_id, status);

-- RC-03: Deduplication for aggregate (non-daily) reports
CREATE UNIQUE INDEX uq_report_aggregate
    ON public.report(project_id, type, date)
    WHERE type IN ('weekly','monthly');
