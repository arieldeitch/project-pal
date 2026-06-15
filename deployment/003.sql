-- ============================================================
-- MIGRATION 003: TRIGGERS
-- Mehayesod Construction Project Execution Platform
-- Depends on: migration 001 (all tables must exist)
-- Trigger summary:
--   1. set_updated_at        — auto-maintain updated_at on 5 tables
--   2. assign_log_number     — per-project sequential log numbering
--   3. set_resolved_at       — capture first resolution timestamp
--   4. prevent_log_edit...   — immutability after report sent
--   5. prevent_log_delete... — immutability after report sent
-- ============================================================


-- ============================================================
-- FUNCTION: set_updated_at
-- Sets updated_at = now() on any row update.
-- Applied to: project, daily_log, issue, blocker, decision.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_project_updated_at
    BEFORE UPDATE ON public.project
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_daily_log_updated_at
    BEFORE UPDATE ON public.daily_log
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_issue_updated_at
    BEFORE UPDATE ON public.issue
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_blocker_updated_at
    BEFORE UPDATE ON public.blocker
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_decision_updated_at
    BEFORE UPDATE ON public.decision
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- FUNCTION: assign_log_number
-- Assigns the next sequential log_number within the project
-- on each INSERT. Uses MAX + 1 per project.
-- Concurrency note (REM-06): UNIQUE (project_id, log_number)
-- constraint backstops the rare concurrent-insert collision.
-- ============================================================
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

CREATE TRIGGER trg_assign_log_number
    BEFORE INSERT ON public.daily_log
    FOR EACH ROW EXECUTE FUNCTION public.assign_log_number();


-- ============================================================
-- FUNCTION: set_resolved_at
-- Sets resolved_at on the first transition to a terminal state.
-- Preserved on re-open: records the first resolution for analytics.
-- Applied to: issue (resolved, closed), blocker (resolved).
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_resolved_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status IN ('resolved', 'closed')
       AND OLD.status NOT IN ('resolved', 'closed')
    THEN
        NEW.resolved_at = now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_issue_resolved_at
    BEFORE UPDATE ON public.issue
    FOR EACH ROW EXECUTE FUNCTION public.set_resolved_at();

CREATE TRIGGER trg_blocker_resolved_at
    BEFORE UPDATE ON public.blocker
    FOR EACH ROW EXECUTE FUNCTION public.set_resolved_at();


-- ============================================================
-- FUNCTION: prevent_log_edit_if_report_sent
-- Blocks UPDATE on a daily_log once its report is 'sent'.
-- Implements the log immutability rule (RC-02, Business Rule 8).
-- Error message in Hebrew for field-visible errors.
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_log_edit_if_report_sent()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.report
        WHERE daily_log_id = OLD.id
          AND status = 'sent'
    ) THEN
        RAISE EXCEPTION 'לא ניתן לשנות יומן עבודה שדוח נשלח בגינו'
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_log_edit_if_report_sent
    BEFORE UPDATE ON public.daily_log
    FOR EACH ROW EXECUTE FUNCTION public.prevent_log_edit_if_report_sent();


-- ============================================================
-- FUNCTION: prevent_log_delete_if_report_sent
-- Blocks DELETE on a daily_log once its report is 'sent'.
-- Draft/ready reports are cascade-deleted with the log (RC-02).
-- Sent reports cannot be cascade-deleted — this trigger prevents it.
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_log_delete_if_report_sent()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.report
        WHERE daily_log_id = OLD.id
          AND status = 'sent'
    ) THEN
        RAISE EXCEPTION 'לא ניתן למחוק יומן עבודה שדוח נשלח בגינו'
            USING ERRCODE = 'P0001';
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_log_delete_if_report_sent
    BEFORE DELETE ON public.daily_log
    FOR EACH ROW EXECUTE FUNCTION public.prevent_log_delete_if_report_sent();
