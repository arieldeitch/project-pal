-- ============================================================
-- MIGRATION 012: RLS FOR project_member TABLE
-- This table was missing from migrations 007 and 010.
-- Without this, any authenticated user can read/write all
-- project memberships — a critical security gap.
--
-- PREREQUISITE: Migration 009 must be applied (is_admin,
-- is_manager_or_admin helper functions must exist).
-- ============================================================

ALTER TABLE public.project_member ENABLE ROW LEVEL SECURITY;

-- SELECT: admins and managers see all; field managers see only their own rows
CREATE POLICY "pm_select" ON public.project_member
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR user_id = auth.uid()
    );

-- INSERT: managers and admins can add members
CREATE POLICY "pm_insert_manager" ON public.project_member
    FOR INSERT TO authenticated
    WITH CHECK (public.is_manager_or_admin());

-- UPDATE: admin only (role changes are sensitive)
CREATE POLICY "pm_update_admin" ON public.project_member
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- DELETE: admin only
CREATE POLICY "pm_delete_admin" ON public.project_member
    FOR DELETE TO authenticated
    USING (public.is_admin());
