-- ============================================================
-- MIGRATION 011: TASK COMMENTS
-- Management feedback on tasks, separate from employee task_updates.
-- task_update = employee progress report (immutable after submit)
-- task_comment = manager/admin annotation (editable by author)
-- ============================================================

CREATE TABLE public.task_comment (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id      UUID        NOT NULL REFERENCES public.task(id) ON DELETE CASCADE,
    author_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name  TEXT        NOT NULL,
    body         TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_comment_task ON public.task_comment(task_id, created_at DESC);

CREATE TRIGGER trg_task_comment_updated_at
    BEFORE UPDATE ON public.task_comment
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.task_comment ENABLE ROW LEVEL SECURITY;

-- Select: any user with access to the parent task's project
CREATE POLICY "tc_select" ON public.task_comment
    FOR SELECT TO authenticated
    USING (
        public.is_manager_or_admin()
        OR EXISTS (
            SELECT 1 FROM public.task t
            WHERE t.id = task_id AND public.is_project_member(t.project_id)
        )
    );

-- Insert: managers and admins only
CREATE POLICY "tc_insert_manager" ON public.task_comment
    FOR INSERT TO authenticated
    WITH CHECK (public.is_manager_or_admin());

-- Update: author or admin
CREATE POLICY "tc_update_author" ON public.task_comment
    FOR UPDATE TO authenticated
    USING (author_id = auth.uid() OR public.is_admin())
    WITH CHECK (author_id = auth.uid() OR public.is_admin());

-- Delete: admin only
CREATE POLICY "tc_delete_admin" ON public.task_comment
    FOR DELETE TO authenticated
    USING (public.is_admin());
