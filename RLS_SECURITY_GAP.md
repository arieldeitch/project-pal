# RLS_SECURITY_GAP.md
> Generated: 2026-06-15
> Authority: User override (authorized permissive RLS as temporary MVP state)
> Global CLAUDE.md: Approval Brief required for RLS changes — included in Section 5.

---

## SECTION 1: CURRENT RLS BEHAVIOR (Migration 007)

All 13 tables have RLS enabled with a single permissive policy each:

```sql
CREATE POLICY "auth_all_<table>" ON public.<table>
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**Effect:** Any user with a valid Supabase auth session (any role) can:
- SELECT all rows from all tables
- INSERT into any table
- UPDATE any row
- DELETE any row

**Tables affected:** site, task, task_update, project, daily_log, issue, blocker, decision, report, contractor_row, equipment_row, photo, issue_comment

**Not yet addressed:** Unauthenticated users are blocked at the application layer (AuthGate in __root.tsx), but there is no RLS defense for unauthenticated Supabase API calls with the anon key.

---

## SECTION 2: REQUIRED MVP BEHAVIOR

### Employee (field_manager)
| Table | Required Access |
|---|---|
| site | READ only — see sites they work on |
| project | READ only — see projects they are assigned to |
| task | READ own assigned tasks + all tasks in their project |
| task_update | READ all for assigned tasks; INSERT own updates |
| daily_log | READ + INSERT + UPDATE (own, same day, not sent) |
| contractor_row | READ + INSERT + UPDATE (own logs only) |
| equipment_row | READ + INSERT + UPDATE (own logs only) |
| issue | READ all in their projects; INSERT new; UPDATE status only |
| issue_comment | READ all; INSERT own |
| photo | READ all in project; INSERT own |
| blocker | READ only |
| decision | READ only |
| report | READ only |

### Manager (company_manager)
| Table | Required Access |
|---|---|
| All tables | Full READ |
| task | READ + UPDATE status |
| issue | READ + INSERT + UPDATE + resolve |
| blocker | READ + INSERT + UPDATE + resolve |
| decision | READ + INSERT + UPDATE |
| report | READ + UPDATE status (mark sent) |
| daily_log | READ only (cannot create — field manager responsibility) |
| issue_comment | READ + INSERT (management feedback) |

### Admin
| Table | Required Access |
|---|---|
| All tables | Full CRUD |
| site | READ + INSERT + UPDATE |
| project | READ + INSERT + UPDATE |
| project_member | Full CRUD (add/remove members) |
| user_profile | Full CRUD (manage users and roles) |

---

## SECTION 3: MISSING SCHEMA REQUIREMENTS

### 3.1 user_profile table (MISSING — CRITICAL)
Currently there is no table linking `auth.users.id` to application roles.

**Required:**
```sql
CREATE TABLE public.user_profile (
    id          UUID  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT  NOT NULL DEFAULT '',
    role        TEXT  NOT NULL DEFAULT 'field_manager'
                      CHECK (role IN ('field_manager','company_manager','admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Why:** The `project_member.role` field exists but `project_member.user_id` has no FK to `auth.users`. There's no way to look up "what is the current user's system role?"

### 3.2 project_member FK constraint (MISSING — CRITICAL)
Migration 001 intentionally deferred the FK to auth.users:
```sql
-- PHASE 3: ADD CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
```
This migration must be applied.

### 3.3 task.assigned_to_user_id (MISSING — HIGH)
Current: `assigned_to TEXT NOT NULL DEFAULT ''`
Required: `assigned_to_user_id UUID REFERENCES auth.users(id)` (with TEXT fallback for display)

Without this, employees cannot filter tasks assigned to them.

---

## SECTION 4: MISSING ROLE HELPER FUNCTIONS

For RLS policies to work, Supabase needs SQL functions that check the current user's role:

```sql
-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profile
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Check if current user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profile
        WHERE id = auth.uid() AND role IN ('company_manager','admin')
    );
$$;

-- Check if current user is a member of a given project
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_member
        WHERE project_id = p_project_id AND user_id = auth.uid()
    );
$$;
```

---

## SECTION 5: APPROVAL BRIEF

**Per global CLAUDE.md: Approval Brief required for RLS changes.**

### 1. Proposed Change
Migrate from permissive RLS (`USING (true)`) to role-based RLS:
- Create `user_profile` table with FK to `auth.users`
- Add FK constraint to `project_member.user_id`
- Add `assigned_to_user_id UUID` column to `task`
- Create helper functions (`is_admin`, `is_manager_or_admin`, `is_project_member`)
- Replace all 13 permissive policies with role-scoped policies
- Create `20260615000009_user_profile_roles.sql`
- Create `20260615000010_strict_rls.sql`

### 2. Why It Is Needed
Current state: any authenticated user can see/modify every row. This violates the MVP requirement "Employees see only assigned work." The permissive state was a Phase 3 stepping stone — it was always intended to be replaced.

### 3. Files/Tables/Policies Affected
- New table: `public.user_profile`
- Altered table: `public.project_member` (add FK constraint)
- Altered table: `public.task` (add `assigned_to_user_id` column)
- New functions: `is_admin()`, `is_manager_or_admin()`, `is_project_member()`
- Replaced policies: all 13 tables (~3 policies each = ~39 new policies)
- Migrations: 20260615000009 + 20260615000010

### 4. Security Risk
- **If done correctly:** Low. Standard Supabase pattern.
- **If FK to auth.users breaks:** Employees locked out. Rollback: drop the FK constraint.
- **If helper functions have bugs:** Policies too restrictive or too permissive. Test carefully.
- **NEVER expose service_role key to frontend** — this change does not affect that.

### 5. MVP-Minimal or Overengineering?
**MVP-minimal.** The MVP success criteria explicitly require role-based access. This is the minimum viable implementation using Supabase's standard SECURITY DEFINER function pattern.

### 6. Rollback Plan
```sql
-- Restore permissive RLS (migration 007)
-- 1. Drop all strict policies
-- 2. Re-create USING(true) policies from migration 007
-- Takes < 5 minutes
```

### 7. Exact Commands / Code
See NEXT_IMPLEMENTATION_STEP.md for step-by-step migration commands.

---

## SECTION 6: RECOMMENDED FINAL RLS IMPLEMENTATION

### Phase A: Permissive (CURRENT — migration 007)
Status: Deployed. Any authenticated user = full access.

### Phase B: Role Functions Only (NEXT STEP)
Add `user_profile` + helper functions. Still permissive policies, but now roles are queryable.

### Phase C: Strict RLS (migration 010)
Replace permissive with role-based policies.

### Phase D: Project-Scoped (Phase 5 / hardening)
Employees see ONLY their assigned projects. Requires `project_member` to be fully populated.

---

## SECTION 7: CRITICAL IMPLEMENTATION ORDER

Do NOT implement strict RLS until:
1. ✅ `user_profile` table exists
2. ✅ At least one admin user has been created in Supabase dashboard
3. ✅ That admin user has a row in `user_profile` with `role = 'admin'`
4. ✅ All project_member rows have real `auth.users.id` values (not placeholder UUIDs)

If strict RLS is applied before step 2–4, ALL authenticated users will be locked out of all data.
