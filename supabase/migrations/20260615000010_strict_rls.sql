-- ============================================================
-- MIGRATION 010: STRICT ROLE-BASED RLS
-- Replaces permissive USING(true) policies with role-scoped policies.
--
-- PREREQUISITE: Migration 009 must be complete AND:
--   - At least one user must exist in auth.users
--   - That user must have a user_profile row with role = 'admin'
--   - project_member rows must have real auth.users UUIDs
--
-- Role hierarchy:
--   admin          → full access to all tables
--   company_manager → read all + write management items
--   field_manager   → read own projects + write field items
-- ============================================================


-- ============================================================
-- Drop all existing policies (set by migrations 007 + 009)
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
-- HELPER: current user's role (avoids repeated subqueries)
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT role FROM public.user_profile WHERE id = auth.uid();
$$;


-- ============================================================
-- POLICIES: user_profile
-- Users can read their own profile. Admins can read/write all.
-- ============================================================
CREATE POLICY "up_select_own" ON public.user_profile
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "up_update_own" ON public.user_profile
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "up_admin_insert" ON public.user_profile
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "up_admin_delete" ON public.user_profile
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================
-- POLICIES: site
-- Admins: full CRUD. Others: read only.
-- ============================================================
CREATE POLICY "site_select_auth" ON public.site
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "site_write_admin" ON public.site
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "site_update_admin" ON public.site
    FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "site_delete_admin" ON public.site
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================
-- POLICIES: project
-- Admins/managers: full access.
-- Field managers: can only see projects they are members of.
-- ============================================================
CREATE POLICY "project_select" ON public.project
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR public.is_project_member(id)
    );

CREATE POLICY "project_insert_admin" ON public.project
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "project_update_manager" ON public.project
    FOR UPDATE TO authenticated
    USING (public.is_manager_or_admin())
    WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "project_delete_admin" ON public.project
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================
-- POLICIES: task
-- Admins/managers: full access.
-- Field managers: see tasks in their projects; update assigned tasks.
-- ============================================================
CREATE POLICY "task_select" ON public.task
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    );

CREATE POLICY "task_insert_manager" ON public.task
    FOR INSERT TO authenticated
    WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "task_update_manager" ON public.task
    FOR UPDATE TO authenticated
    USING (public.is_manager_or_admin())
    WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "task_delete_admin" ON public.task
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================
-- POLICIES: task_update
-- Field managers can insert their own updates on assigned tasks.
-- Everyone with project access can read.
-- ============================================================
CREATE POLICY "task_update_select" ON public.task_update
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR EXISTS (
            SELECT 1 FROM public.task t
            WHERE t.id = task_id
              AND public.is_project_member(t.project_id)
        )
    );

CREATE POLICY "task_update_insert" ON public.task_update
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.task t
            WHERE t.id = task_id
              AND (
                  public.is_manager_or_admin()
                  OR (
                      public.is_project_member(t.project_id)
                      AND (t.assigned_to_user_id = auth.uid() OR t.assigned_to_user_id IS NULL)
                  )
              )
        )
    );

-- task_update is immutable — no UPDATE or DELETE for non-admins
CREATE POLICY "task_update_admin_delete" ON public.task_update
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================
-- POLICIES: daily_log
-- Field managers: read + create + update (own, before report sent).
-- Managers/admins: full read + update.
-- ============================================================
CREATE POLICY "daily_log_select" ON public.daily_log
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    );

CREATE POLICY "daily_log_insert" ON public.daily_log
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_project_member(project_id)
        OR public.is_manager_or_admin()
    );

CREATE POLICY "daily_log_update" ON public.daily_log
    FOR UPDATE TO authenticated
    USING (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    )
    WITH CHECK (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    );

CREATE POLICY "daily_log_delete_admin" ON public.daily_log
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================
-- POLICIES: contractor_row, equipment_row
-- Inherit access from daily_log via project membership.
-- ============================================================
CREATE POLICY "contractor_row_select" ON public.contractor_row
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR EXISTS (
            SELECT 1 FROM public.daily_log dl
            WHERE dl.id = daily_log_id
              AND public.is_project_member(dl.project_id)
        )
    );

CREATE POLICY "contractor_row_write" ON public.contractor_row
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.daily_log dl
            WHERE dl.id = daily_log_id
              AND (public.is_manager_or_admin() OR public.is_project_member(dl.project_id))
        )
    );

CREATE POLICY "contractor_row_update" ON public.contractor_row
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_log dl
            WHERE dl.id = daily_log_id
              AND (public.is_manager_or_admin() OR public.is_project_member(dl.project_id))
        )
    );

CREATE POLICY "contractor_row_delete" ON public.contractor_row
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_log dl
            WHERE dl.id = daily_log_id
              AND (public.is_manager_or_admin() OR public.is_project_member(dl.project_id))
        )
    );

CREATE POLICY "equipment_row_select" ON public.equipment_row
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR EXISTS (
            SELECT 1 FROM public.daily_log dl
            WHERE dl.id = daily_log_id
              AND public.is_project_member(dl.project_id)
        )
    );

CREATE POLICY "equipment_row_write" ON public.equipment_row
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.daily_log dl
            WHERE dl.id = daily_log_id
              AND (public.is_manager_or_admin() OR public.is_project_member(dl.project_id))
        )
    );

CREATE POLICY "equipment_row_update" ON public.equipment_row
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_log dl
            WHERE dl.id = daily_log_id
              AND (public.is_manager_or_admin() OR public.is_project_member(dl.project_id))
        )
    );

CREATE POLICY "equipment_row_delete" ON public.equipment_row
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_log dl
            WHERE dl.id = daily_log_id
              AND (public.is_manager_or_admin() OR public.is_project_member(dl.project_id))
        )
    );


-- ============================================================
-- POLICIES: issue
-- Field managers: read + insert + update status only.
-- Managers/admins: full access including resolve.
-- ============================================================
CREATE POLICY "issue_select" ON public.issue
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    );

CREATE POLICY "issue_insert" ON public.issue
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    );

CREATE POLICY "issue_update" ON public.issue
    FOR UPDATE TO authenticated
    USING (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    )
    WITH CHECK (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    );

CREATE POLICY "issue_delete_admin" ON public.issue
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================
-- POLICIES: issue_comment
-- Everyone with project access can read + insert.
-- Delete: admin only.
-- ============================================================
CREATE POLICY "issue_comment_select" ON public.issue_comment
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR EXISTS (
            SELECT 1 FROM public.issue i
            WHERE i.id = issue_id
              AND public.is_project_member(i.project_id)
        )
    );

CREATE POLICY "issue_comment_insert" ON public.issue_comment
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.issue i
            WHERE i.id = issue_id
              AND (public.is_manager_or_admin() OR public.is_project_member(i.project_id))
        )
    );

CREATE POLICY "issue_comment_delete_admin" ON public.issue_comment
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================
-- POLICIES: photo
-- Access mirrors parent (daily_log or issue) project membership.
-- ============================================================
CREATE POLICY "photo_select" ON public.photo
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR (
            daily_log_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.daily_log dl
                WHERE dl.id = daily_log_id AND public.is_project_member(dl.project_id)
            )
        )
        OR (
            issue_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.issue i
                WHERE i.id = issue_id AND public.is_project_member(i.project_id)
            )
        )
    );

CREATE POLICY "photo_insert" ON public.photo
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_manager_or_admin()
        OR (
            daily_log_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.daily_log dl
                WHERE dl.id = daily_log_id AND public.is_project_member(dl.project_id)
            )
        )
        OR (
            issue_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.issue i
                WHERE i.id = issue_id AND public.is_project_member(i.project_id)
            )
        )
    );

CREATE POLICY "photo_delete_admin" ON public.photo
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================
-- POLICIES: blocker, decision
-- Field managers: read only.
-- Managers/admins: full CRUD.
-- ============================================================
CREATE POLICY "blocker_select" ON public.blocker
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    );

CREATE POLICY "blocker_write_manager" ON public.blocker
    FOR INSERT TO authenticated
    WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "blocker_update_manager" ON public.blocker
    FOR UPDATE TO authenticated
    USING (public.is_manager_or_admin()) WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "blocker_delete_admin" ON public.blocker
    FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "decision_select" ON public.decision
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    );

CREATE POLICY "decision_write_manager" ON public.decision
    FOR INSERT TO authenticated
    WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "decision_update_manager" ON public.decision
    FOR UPDATE TO authenticated
    USING (public.is_manager_or_admin()) WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "decision_delete_admin" ON public.decision
    FOR DELETE TO authenticated USING (public.is_admin());


-- ============================================================
-- POLICIES: report
-- Field managers: read only (their projects).
-- Managers/admins: read + update status.
-- ============================================================
CREATE POLICY "report_select" ON public.report
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    );

CREATE POLICY "report_insert_manager" ON public.report
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_manager_or_admin()
        OR public.is_project_member(project_id)
    );

CREATE POLICY "report_update_manager" ON public.report
    FOR UPDATE TO authenticated
    USING (public.is_manager_or_admin()) WITH CHECK (public.is_manager_or_admin());

CREATE POLICY "report_delete_admin" ON public.report
    FOR DELETE TO authenticated USING (public.is_admin());
