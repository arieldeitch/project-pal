-- ============================================================
-- MIGRATION 006: TASK TABLES
-- Adds Task and TaskUpdate entities under Project.
-- MVP hierarchy: Site → Project → Task → TaskUpdate
-- Employees update task progress via TaskUpdates.
-- Depends on: migration 001 (project table), migration 003 (set_updated_at)
-- ============================================================


-- ============================================================
-- TABLE: task
-- Work item within a project. Assigned to an employee.
-- Progress tracked as 0-100 integer.
-- ============================================================
CREATE TABLE public.task (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID        NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    title        TEXT        NOT NULL,
    description  TEXT        NOT NULL DEFAULT '',
    status       TEXT        NOT NULL DEFAULT 'not_started'
                             CHECK (status IN ('not_started','in_progress','completed','blocked')),
    priority     TEXT        NOT NULL DEFAULT 'medium'
                             CHECK (priority IN ('low','medium','high','critical')),
    assigned_to  TEXT        NOT NULL DEFAULT '',
    due_date     DATE,
    progress     INTEGER     NOT NULL DEFAULT 0
                             CHECK (progress >= 0 AND progress <= 100),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_project_id  ON public.task(project_id);
CREATE INDEX idx_task_assigned_to ON public.task(assigned_to);
CREATE INDEX idx_task_status      ON public.task(status);

CREATE TRIGGER trg_task_updated_at
    BEFORE UPDATE ON public.task
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TABLE: task_update
-- Progress report submitted by an employee against a task.
-- Immutable after insert (employees cannot edit past reports).
-- ============================================================
CREATE TABLE public.task_update (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID        NOT NULL REFERENCES public.task(id) ON DELETE CASCADE,
    submitted_by    TEXT        NOT NULL,
    content         TEXT        NOT NULL,
    progress_after  INTEGER     NOT NULL
                                CHECK (progress_after >= 0 AND progress_after <= 100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_update_task_id ON public.task_update(task_id);
CREATE INDEX idx_task_update_created ON public.task_update(created_at DESC);


-- ============================================================
-- FUNCTION: auto_update_task_progress
-- When a task_update is inserted, update task.progress to
-- the latest progress_after value and set status to 'in_progress'
-- (or 'completed' if progress = 100).
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_update_task_progress()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.task
    SET
        progress   = NEW.progress_after,
        status     = CASE
                         WHEN NEW.progress_after = 100 THEN 'completed'
                         WHEN NEW.progress_after > 0   THEN 'in_progress'
                         ELSE status
                     END,
        updated_at = now()
    WHERE id = NEW.task_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_update_task_progress
    AFTER INSERT ON public.task_update
    FOR EACH ROW EXECUTE FUNCTION public.auto_update_task_progress();
