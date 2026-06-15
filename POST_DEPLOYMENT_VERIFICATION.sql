-- ============================================================
-- POST_DEPLOYMENT_VERIFICATION.sql
-- Run in Supabase SQL Editor AFTER all migrations are complete.
-- Each block states what it checks and what the expected result is.
-- A result that does not match expected indicates a failed migration.
-- ============================================================


-- ============================================================
-- SECTION 1: TABLE EXISTENCE
-- Expected: 15 tables in public schema
-- ============================================================

SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected tables (15):
--   blocker, contractor_row, daily_log, decision, equipment_row,
--   issue, issue_comment, photo, project, project_member, report,
--   site, task, task_comment, task_update, user_profile

-- Quick count check:
SELECT COUNT(*) AS table_count
FROM pg_tables
WHERE schemaname = 'public';
-- Expected: 15


-- ============================================================
-- SECTION 2: RLS ENABLED
-- Expected: rowsecurity = true for all 15 tables
-- ============================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- All rows must show: rowsecurity = true
-- If any show false → that table's migration did not complete

-- Tables enabled by each migration:
--   007: project, daily_log, site, task, task_update, issue, blocker,
--        decision, report, contractor_row, equipment_row, photo, issue_comment
--   009: user_profile
--   011: task_comment
--   012: project_member


-- ============================================================
-- SECTION 3: POLICY COUNT
-- Expected: at least 38 policies across all tables
-- ============================================================

SELECT COUNT(*) AS total_policies
FROM pg_policies
WHERE schemaname = 'public';
-- Expected: >= 38

-- Per-table policy breakdown:
SELECT tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Expected minimum per table:
--   blocker:         4  (select, write_manager, update_manager, delete_admin)
--   contractor_row:  4  (select, write, update, delete)
--   daily_log:       4  (select, insert, update, delete_admin)
--   decision:        4  (select, write_manager, update_manager, delete_admin)
--   equipment_row:   4  (select, write, update, delete)
--   issue:           4  (select, insert, update, delete_admin)
--   issue_comment:   3  (select, insert, delete_admin)
--   photo:           3  (select, insert, delete_admin)
--   project:         4  (select, insert_admin, update_manager, delete_admin)
--   project_member:  4  (pm_select, pm_insert_manager, pm_update_admin, pm_delete_admin)
--   report:          4  (select, insert_manager, update_manager, delete_admin)
--   site:            4  (select_auth, write_admin, update_admin, delete_admin)
--   task:            4  (select, insert_manager, update_manager, delete_admin)
--   task_comment:    4  (tc_select, tc_insert_manager, tc_update_author, tc_delete_admin)
--   task_update:     3  (select, insert, admin_delete)
--   user_profile:    4  (up_select_own, up_update_own, up_admin_insert, up_admin_delete)


-- ============================================================
-- SECTION 4: FUNCTION EXISTENCE
-- Expected: 9 functions in public schema
-- ============================================================

SELECT proname, prosecdef AS security_definer
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'is_admin',
    'is_manager_or_admin',
    'is_project_member',
    'current_user_role',
    'handle_new_user',
    'auto_update_task_progress',
    'assign_log_number',
    'set_updated_at',
    'set_resolved_at',
    'prevent_log_edit_if_report_sent',
    'prevent_log_delete_if_report_sent'
  )
ORDER BY proname;

-- Expected: 11 rows
-- Security DEFINER must be TRUE for:
--   is_admin, is_manager_or_admin, is_project_member,
--   current_user_role, handle_new_user


-- ============================================================
-- SECTION 5: TRIGGER EXISTENCE
-- Expected: 15+ triggers across all tables
-- ============================================================

SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected triggers:
--   auth.users:      trg_on_auth_user_created (AFTER INSERT)
--   blocker:         trg_blocker_updated_at, trg_blocker_resolved_at
--   daily_log:       trg_daily_log_updated_at, trg_assign_log_number,
--                    trg_prevent_log_edit_if_report_sent, trg_prevent_log_delete_if_report_sent
--   decision:        trg_decision_updated_at
--   issue:           trg_issue_updated_at, trg_issue_resolved_at
--   project:         trg_project_updated_at
--   site:            trg_site_updated_at
--   task:            trg_task_updated_at
--   task_comment:    trg_task_comment_updated_at
--   task_update:     trg_auto_update_task_progress
--   user_profile:    trg_user_profile_updated_at


-- ============================================================
-- SECTION 6: VIEW EXISTENCE
-- Expected: 4 views
-- ============================================================

SELECT table_name AS view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected:
--   v_missing_daily_logs
--   v_open_blockers
--   v_pending_decisions
--   v_project_health


-- ============================================================
-- SECTION 7: FOREIGN KEY CONSTRAINTS
-- Expected: all critical FK relationships exist
-- ============================================================

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Critical FKs to verify:
--   daily_log.project_id       → project.id         ON DELETE RESTRICT
--   contractor_row.daily_log_id → daily_log.id       ON DELETE CASCADE
--   equipment_row.daily_log_id  → daily_log.id       ON DELETE CASCADE
--   issue.project_id            → project.id         ON DELETE RESTRICT
--   issue.discovered_in_log_id  → daily_log.id       ON DELETE SET NULL
--   issue_comment.issue_id      → issue.id           ON DELETE CASCADE
--   photo.daily_log_id          → daily_log.id       ON DELETE CASCADE (nullable)
--   photo.issue_id              → issue.id           ON DELETE CASCADE (nullable)
--   blocker.project_id          → project.id         ON DELETE RESTRICT
--   decision.project_id         → project.id         ON DELETE RESTRICT
--   report.project_id           → project.id         ON DELETE RESTRICT
--   report.daily_log_id         → daily_log.id       ON DELETE CASCADE (nullable)
--   project.site_id             → site.id            ON DELETE SET NULL (nullable)
--   project_member.project_id   → project.id         ON DELETE CASCADE
--   project_member.user_id      → auth.users.id      ON DELETE CASCADE   ← added by 009
--   task.project_id             → project.id         ON DELETE CASCADE
--   task.assigned_to_user_id    → auth.users.id      ON DELETE SET NULL  ← added by 009
--   task_update.task_id         → task.id            ON DELETE CASCADE
--   task_comment.task_id        → task.id            ON DELETE CASCADE
--   task_comment.author_id      → auth.users.id      ON DELETE SET NULL
--   user_profile.id             → auth.users.id      ON DELETE CASCADE


-- ============================================================
-- SECTION 8: ADMIN USER EXISTS
-- Expected: at least 1 admin in user_profile
-- ============================================================

SELECT id, full_name, role, created_at
FROM public.user_profile
WHERE role = 'admin';
-- Expected: 1 or more rows
-- If 0 rows → DO NOT proceed to use the application; access will be broken


-- ============================================================
-- SECTION 9: USER PROFILE TABLE STRUCTURE
-- Expected: correct columns and types
-- ============================================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profile'
ORDER BY ordinal_position;

-- Expected columns:
--   id          uuid        NOT NULL   (PK, FK to auth.users)
--   full_name   text        NOT NULL   DEFAULT ''
--   role        text        NOT NULL   DEFAULT 'field_manager'
--   created_at  timestamptz NOT NULL   DEFAULT now()
--   updated_at  timestamptz NOT NULL   DEFAULT now()


-- ============================================================
-- SECTION 10: TASK TABLE STRUCTURE (migration 009 additions)
-- Expected: assigned_to_user_id column exists on task
-- ============================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'task'
  AND column_name IN ('id', 'assigned_to', 'assigned_to_user_id', 'progress', 'status')
ORDER BY ordinal_position;

-- Expected: assigned_to_user_id present, nullable, type = uuid


-- ============================================================
-- SECTION 11: SITE → PROJECT → TASK HIERARCHY
-- Validates the full MVP data hierarchy can be navigated
-- ============================================================

-- Sites exist and columns are correct
SELECT COUNT(*) AS site_count FROM public.site;

-- Projects with site linkage
SELECT
    p.name AS project_name,
    s.name AS site_name,
    p.status AS project_status
FROM public.project p
LEFT JOIN public.site s ON s.id = p.site_id
ORDER BY p.created_at DESC
LIMIT 10;

-- Tasks linked to projects
SELECT
    t.title AS task_title,
    t.status,
    t.progress,
    p.name AS project_name
FROM public.task t
JOIN public.project p ON p.id = t.project_id
ORDER BY t.created_at DESC
LIMIT 10;


-- ============================================================
-- SECTION 12: TRIGGER FUNCTIONAL TEST — assign_log_number
-- Insert a test daily log and verify log_number is auto-assigned
-- !! Only run this if a real project exists !!
-- Replace 'PASTE-PROJECT-UUID' with an actual project UUID.
-- ============================================================

-- Step 1: find a project to use
-- SELECT id, name FROM public.project LIMIT 5;

-- Step 2: insert a test log (only if you want to verify trigger)
-- INSERT INTO public.daily_log (project_id, date, submitted_by)
-- VALUES ('PASTE-PROJECT-UUID', CURRENT_DATE, 'verification-test')
-- RETURNING id, log_number, date;
-- Expected: log_number is a positive integer (not NULL)

-- Step 3: if you ran step 2, delete the test row
-- DELETE FROM public.daily_log WHERE submitted_by = 'verification-test';


-- ============================================================
-- SECTION 13: ROLE FUNCTION SMOKE TEST
-- Run as the admin user session (from a real login) to verify
-- SECURITY DEFINER functions return expected values.
-- These must be run via the application or a user-scoped SQL session,
-- NOT via the SQL Editor (which runs as service_role, not auth.uid()).
-- ============================================================

-- This query returns the calling user's UID — must be non-null if logged in:
-- SELECT auth.uid();

-- This returns the calling user's role from user_profile:
-- SELECT public.current_user_role();
-- Expected for admin: 'admin'

-- This returns TRUE for admin:
-- SELECT public.is_admin();
-- Expected: true

-- This returns TRUE for admin (who is also manager_or_admin):
-- SELECT public.is_manager_or_admin();
-- Expected: true


-- ============================================================
-- SECTION 14: UNIQUE CONSTRAINT VERIFICATION
-- Validates critical uniqueness rules are enforced
-- ============================================================

-- Verify unique indexes exist
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'uq_%'
    OR indexname LIKE '%unique%'
    OR indexdef LIKE '%UNIQUE%'
  )
ORDER BY tablename, indexname;

-- Expected unique constraints:
--   daily_log: uq_daily_log_project_date (project_id, date)
--   daily_log: uq_daily_log_project_number (project_id, log_number)
--   project_member: uq_project_member (project_id, user_id)
--   report: uq_report_daily_log (daily_log_id)
--   report: uq_report_aggregate (project_id, type, date) WHERE type IN ('weekly','monthly')
--   photo: idx_photo_storage_key (storage_key) UNIQUE


-- ============================================================
-- SECTION 15: FINAL SUMMARY CHECK
-- Run last. Quick pass/fail across all categories.
-- ============================================================

SELECT
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public')                        AS tables_count,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) AS rls_enabled_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')                      AS policy_count,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public')       AS view_count,
    (SELECT COUNT(*) FROM public.user_profile WHERE role = 'admin')                     AS admin_count,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public')  AS trigger_count;

-- Expected values:
--   tables_count:      15
--   rls_enabled_count: 15  (all tables have RLS)
--   policy_count:      >= 38
--   view_count:        4
--   admin_count:       >= 1  (CRITICAL — must not be 0)
--   trigger_count:     >= 15
