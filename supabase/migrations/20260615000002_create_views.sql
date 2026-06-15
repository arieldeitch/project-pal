-- ============================================================
-- MIGRATION 002: VIEWS
-- Mehayesod Construction Project Execution Platform
-- Depends on: migration 001 (all tables must exist)
-- ============================================================

-- ============================================================
-- VIEW: v_project_health
-- Aggregated health metrics per project for the dashboard.
-- 4-table LEFT JOIN with COUNT DISTINCT FILTER aggregates.
-- Note (REM-07): At MVP scale this is fast. At 20+ projects
-- with years of data, consider converting to materialized view.
-- ============================================================
CREATE OR REPLACE VIEW public.v_project_health AS
SELECT
    p.id                AS project_id,
    p.name,
    p.status,
    p.manager,
    p.start_date,
    p.target_date,

    -- Daily log stats
    COUNT(DISTINCT dl.id)                                                   AS total_logs,
    MAX(dl.date)                                                            AS last_log_date,
    CURRENT_DATE - MAX(dl.date)                                             AS days_since_last_log,

    -- Issue stats
    COUNT(DISTINCT i.id) FILTER (WHERE i.status NOT IN ('resolved','closed'))           AS open_issues,
    COUNT(DISTINCT i.id) FILTER (WHERE i.severity = 'critical'
                                   AND i.status NOT IN ('resolved','closed'))            AS critical_issues,

    -- Blocker stats
    COUNT(DISTINCT b.id) FILTER (WHERE b.status != 'resolved')             AS open_blockers,
    COUNT(DISTINCT b.id) FILTER (WHERE b.priority = 'critical'
                                   AND b.status != 'resolved')              AS critical_blockers,

    -- Decision stats
    COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'pending')               AS pending_decisions,

    -- Report stats
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'sent')                  AS sent_reports,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'draft')                 AS draft_reports

FROM public.project p
LEFT JOIN public.daily_log dl ON dl.project_id = p.id
LEFT JOIN public.issue     i  ON i.project_id  = p.id
LEFT JOIN public.blocker   b  ON b.project_id  = p.id
LEFT JOIN public.decision  d  ON d.project_id  = p.id
LEFT JOIN public.report    r  ON r.project_id  = p.id
GROUP BY p.id, p.name, p.status, p.manager, p.start_date, p.target_date;


-- ============================================================
-- VIEW: v_missing_daily_logs
-- Active projects that have no log submitted for today.
-- Used by the executive dashboard KPI card.
-- ============================================================
CREATE OR REPLACE VIEW public.v_missing_daily_logs AS
SELECT
    p.id            AS project_id,
    p.name          AS project_name,
    p.manager,
    MAX(dl.date)    AS last_log_date,
    CURRENT_DATE - MAX(dl.date) AS days_since_last_log
FROM public.project p
LEFT JOIN public.daily_log dl ON dl.project_id = p.id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.manager
HAVING MAX(dl.date) < CURRENT_DATE
    OR MAX(dl.date) IS NULL;


-- ============================================================
-- VIEW: v_open_blockers
-- All non-resolved blockers with project name and overdue flag.
-- Used by the executive dashboard blockers panel.
-- ============================================================
CREATE OR REPLACE VIEW public.v_open_blockers AS
SELECT
    b.id,
    b.project_id,
    p.name          AS project_name,
    b.title,
    b.description,
    b.impact,
    b.responsible,
    b.due_date,
    b.priority,
    b.status,
    b.created_at,
    b.updated_at,
    CASE
        WHEN b.due_date IS NOT NULL
         AND b.due_date < CURRENT_DATE
         AND b.status != 'resolved' THEN TRUE
        ELSE FALSE
    END             AS is_overdue
FROM public.blocker b
JOIN public.project p ON p.id = b.project_id
WHERE b.status != 'resolved';


-- ============================================================
-- VIEW: v_pending_decisions
-- Decisions requiring management action (pending + deferred).
-- Used by the executive dashboard decisions panel.
-- ============================================================
CREATE OR REPLACE VIEW public.v_pending_decisions AS
SELECT
    d.id,
    d.project_id,
    p.name          AS project_name,
    d.title,
    d.description,
    d.requested_by,
    d.owner,
    d.due_date,
    d.status,
    d.created_at,
    d.updated_at,
    CASE
        WHEN d.due_date IS NOT NULL
         AND d.due_date < CURRENT_DATE
         AND d.status = 'pending' THEN TRUE
        ELSE FALSE
    END             AS is_overdue
FROM public.decision d
JOIN public.project p ON p.id = d.project_id
WHERE d.status IN ('pending', 'deferred');
