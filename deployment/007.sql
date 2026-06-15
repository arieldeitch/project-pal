-- ============================================================
-- MIGRATION 007: PERMISSIVE RLS FOR AUTHENTICATED USERS
-- Phase 3 level: any authenticated user can read/write all data.
-- Strict project-scoped RLS is deferred to Phase 5 hardening.
-- REQUIRES: Auth to be enabled on the Supabase project.
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE public.site        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_update ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables (may already be set — IF NOT EXISTS not available for RLS)
-- These are safe to re-run; enabling RLS on an already-RLS-enabled table is a no-op.
ALTER TABLE public.project      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocker      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_row ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_row  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comment  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- DROP old policies (if any) before recreating
-- ============================================================
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;


-- ============================================================
-- PERMISSIVE POLICIES: authenticated users can do everything
-- ============================================================

-- site
CREATE POLICY "auth_all_site" ON public.site
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task
CREATE POLICY "auth_all_task" ON public.task
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task_update
CREATE POLICY "auth_all_task_update" ON public.task_update
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- project
CREATE POLICY "auth_all_project" ON public.project
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- daily_log
CREATE POLICY "auth_all_daily_log" ON public.daily_log
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- issue
CREATE POLICY "auth_all_issue" ON public.issue
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- blocker
CREATE POLICY "auth_all_blocker" ON public.blocker
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- decision
CREATE POLICY "auth_all_decision" ON public.decision
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- report
CREATE POLICY "auth_all_report" ON public.report
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- contractor_row
CREATE POLICY "auth_all_contractor_row" ON public.contractor_row
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- equipment_row
CREATE POLICY "auth_all_equipment_row" ON public.equipment_row
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- photo
CREATE POLICY "auth_all_photo" ON public.photo
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- issue_comment
CREATE POLICY "auth_all_issue_comment" ON public.issue_comment
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
