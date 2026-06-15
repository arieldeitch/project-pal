# NEXT_IMPLEMENTATION_STEP.md
> Generated: 2026-06-15
> Ordered by: MVP success criteria priority
> Status: Active execution plan

---

## Priority Order (from MVP success criteria)

| # | Goal | Blocker? | Status |
|---|---|---|---|
| 1 | Employees can log in | No (auth done) | ✅ Done |
| 2 | Employees see only assigned work | YES — needs roles + RLS | 🔴 Next |
| 3 | Managers/Admins see all data | YES — needs roles + RLS | 🔴 Next |
| 4 | Sites are managed | No | ✅ Done |
| 5 | Projects are managed | Partial — no create/edit UI | 🟡 In queue |
| 6 | Tasks are managed | Done | ✅ Done |
| 7 | Reporting works | Done (no PDF) | ✅ Done |
| 8 | Management comments work | NO — not implemented | 🟡 In queue |
| 9 | Executive dashboard works | Done | ✅ Done |
| 10 | Excel export works | NO — placeholder | 🟡 In queue |

---

## STEP 1 — Fix BUG-001: projectRepository siteId (IMMEDIATE)

**File:** `src/repositories/projectRepository.ts`
**Effort:** 5 minutes
**Risk:** None

Add `site_id: input.siteId ?? null` to create() and update() in projectRepository.

---

## STEP 2 — Add Create/Edit Project dialogs (HIGH)

**File:** `src/routes/projects.index.tsx`
**Effort:** 1–2 hours
**Risk:** Low

Add a create dialog and edit dialog to the projects list page, matching the pattern from issues.index.tsx or blockers.index.tsx.

---

## STEP 3 — Migration 009: user_profile + roles (CRITICAL)

**File:** `supabase/migrations/20260615000009_user_profile_roles.sql`
**Effort:** 1 hour
**Risk:** Medium (touches auth.users)

Create:
- `user_profile` table with `id UUID REFERENCES auth.users(id)`
- `role` column: `field_manager | company_manager | admin`
- `full_name` TEXT
- `is_admin()` helper function (SECURITY DEFINER)
- `is_manager_or_admin()` helper function (SECURITY DEFINER)
- `is_project_member(project_id UUID)` helper function (SECURITY DEFINER)
- Trigger: auto-create user_profile row on auth.users INSERT
- Add FK constraint to `project_member.user_id`
- Add `assigned_to_user_id UUID` to `task` table (nullable, populate later)

**IMPORTANT:** After running this migration, create at least one admin user in Supabase Auth dashboard, then insert their user_profile with `role = 'admin'` BEFORE running Step 4.

---

## STEP 4 — Migration 010: Strict Role-Based RLS (CRITICAL)

**File:** `supabase/migrations/20260615000010_strict_rls.sql`
**Effort:** 2 hours
**Risk:** High (can lock users out if not done carefully)

**PREREQUISITE:** Step 3 must be complete AND at least one admin row must exist in user_profile.

Replace all 13 permissive `USING (true)` policies with:
- admin: full access to all tables
- company_manager: read all + write issues/blockers/decisions/reports/comments
- field_manager: read own project data + write daily_logs/task_updates/issue_comments
- All policies use `auth.uid()` via the helper functions

---

## STEP 5 — Management Comments on Tasks (MEDIUM)

**Files to create:** `supabase/migrations/20260615000011_task_comments.sql`
**Files to update:** `src/routes/tasks.$taskId.tsx`, `src/repositories/taskRepository.ts`, `src/hooks/useTasks.ts`
**Effort:** 2 hours

Create `task_comment` table:
```sql
CREATE TABLE public.task_comment (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id      UUID NOT NULL REFERENCES public.task(id) ON DELETE CASCADE,
    author_id    UUID REFERENCES auth.users(id),
    author_name  TEXT NOT NULL,
    body         TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Add UI in `tasks.$taskId.tsx` showing comments in a separate section below task_updates. Managers/admins can add comments. Field managers can read.

---

## STEP 6 — Issue Comments UI (MEDIUM)

**File:** `src/routes/issues.index.tsx` or new `src/routes/issues.$issueId.tsx`
**Effort:** 1–2 hours

The `issue_comment` table exists and is fetched by issueRepository. Build the UI:
- Show comment thread in issue detail
- Add comment form for managers/employees
- Hebrew labels

---

## STEP 7 — Pre-fill submittedBy from auth session (MEDIUM)

**Files:** `src/routes/daily-logs.new.tsx`, `src/hooks/useAuth.ts`
**Effort:** 30 minutes

Use `session.user.email` or (once user_profile exists) `user_profile.full_name` to pre-fill the `submittedBy` field in daily log creation. Field remains editable.

---

## STEP 8 — Create/Edit Project dialogs (see STEP 2)

---

## STEP 9 — Excel Export (LOW)

**Files:** `src/routes/reports.index.tsx`
**Effort:** 2–3 hours
**Package:** `xlsx` (already common in this stack, no new dep if available; else `exceljs`)

Implement:
1. Aggregate daily logs for selected project+date range
2. Generate `.xlsx` with columns: Date, Project, Workers, Equipment, Work Description, Weather
3. Trigger download via Blob URL
4. Remove "בפיתוח" placeholder from Excel button

---

## STEP 10 — Final QA Pass

1. All routes render correctly with real Supabase data
2. Employee login → sees only assigned projects and tasks
3. Manager login → sees all data
4. Admin login → can manage users and sites
5. Daily log → report flow works end-to-end
6. Task → task_update → progress reflects correctly
7. Executive dashboard KPIs are correct
8. Hebrew RTL renders correctly throughout

---

## Current Active Step: STEP 1 (fix BUG-001) → then STEP 2 (project create/edit) → then STEP 3 (roles migration)
