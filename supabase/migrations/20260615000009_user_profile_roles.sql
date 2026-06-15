-- ============================================================
-- MIGRATION 009: USER PROFILES + ROLE SYSTEM
-- Creates the user_profile table linking auth.users to app roles.
-- Adds role helper functions used by RLS policies (migration 010).
-- Adds assigned_to_user_id column to task table.
-- Adds FK constraint to project_member.user_id.
--
-- CRITICAL: After running this migration you MUST:
--   1. Create at least one user in Supabase Auth dashboard.
--   2. Insert that user into user_profile with role = 'admin'.
--   3. Only then run migration 010 (strict RLS).
--
-- If you run migration 010 before doing steps 1-3, all
-- authenticated users will be locked out of all data.
-- ============================================================


-- ============================================================
-- TABLE: user_profile
-- One row per auth user. Created automatically via trigger.
-- ============================================================
CREATE TABLE public.user_profile (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT        NOT NULL DEFAULT '',
    role        TEXT        NOT NULL DEFAULT 'field_manager'
                            CHECK (role IN ('field_manager','company_manager','admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profile_role ON public.user_profile(role);

CREATE TRIGGER trg_user_profile_updated_at
    BEFORE UPDATE ON public.user_profile
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- TRIGGER: auto-create user_profile on new auth user
-- Default role is 'field_manager' — admin upgrades manually.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.user_profile (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'field_manager')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- FUNCTION: is_admin
-- Returns TRUE if the current auth user has role = 'admin'.
-- SECURITY DEFINER: runs as the function owner, bypasses RLS.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profile
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;


-- ============================================================
-- FUNCTION: is_manager_or_admin
-- Returns TRUE if the current user is company_manager or admin.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profile
        WHERE id = auth.uid() AND role IN ('company_manager','admin')
    );
$$;


-- ============================================================
-- FUNCTION: is_project_member
-- Returns TRUE if the current user is a member of the given project.
-- Used for field_manager project-scoped access.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_member
        WHERE project_id = p_project_id
          AND user_id = auth.uid()
    );
$$;


-- ============================================================
-- ADD FK: project_member.user_id → auth.users(id)
-- NOTE: This will FAIL if existing project_member rows have
-- user_id values that do not exist in auth.users.
-- The seed data uses placeholder UUIDs (00000000-...) which
-- must be deleted or updated before running this migration.
-- ============================================================

-- Remove placeholder seed rows before adding FK
DELETE FROM public.project_member
WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000010'
);

ALTER TABLE public.project_member
    ADD CONSTRAINT fk_project_member_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- ============================================================
-- ADD COLUMN: task.assigned_to_user_id
-- Nullable UUID FK to auth.users for RLS assignment checks.
-- Keep existing TEXT assigned_to for display (display name).
-- ============================================================
ALTER TABLE public.task
    ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_task_assigned_user ON public.task(assigned_to_user_id)
    WHERE assigned_to_user_id IS NOT NULL;


-- ============================================================
-- Enable RLS on user_profile
-- ============================================================
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Permissive policy for now — migration 010 will refine this
CREATE POLICY "auth_all_user_profile" ON public.user_profile
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
