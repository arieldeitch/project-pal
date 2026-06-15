# BUG_LIST.md
> Updated: 2026-06-15
> Source: Static code review + migration analysis
> Severity: CRITICAL > HIGH > MEDIUM > LOW

---

## BUG-001 — ✅ RESOLVED: projectRepository missing siteId in create/update

**File:** `src/repositories/projectRepository.ts`
**Severity:** CRITICAL → **RESOLVED**
**Fix applied:** Added `site_id: input.siteId ?? null` to `create()` and `if (input.siteId !== undefined) patch.site_id = input.siteId ?? null` to `update()`.

---

## BUG-002 — ✅ RESOLVED: No Create/Edit Project UI

**File:** `src/routes/projects.index.tsx`
**Severity:** HIGH → **RESOLVED**
**Fix applied:** Full create dialog and edit dialog (pencil button per row) with site dropdown. Uses `useCreateProject`, `useUpdateProject`, `useSites`.

---

## BUG-003 — ✅ ADDRESSED: task.assigned_to is TEXT, not linked to auth.users

**File:** `supabase/migrations/20260615000009_user_profile_roles.sql`
**Severity:** HIGH → **ADDRESSED**
**Fix applied:** Migration 009 adds `assigned_to_user_id UUID REFERENCES auth.users(id)`. TEXT field `assigned_to` preserved for display. UUID field used for RLS enforcement.
**Remaining:** Real auth.users UUIDs must be populated after creating users in Supabase dashboard. See `SUPABASE_DEPLOYMENT_CHECKLIST.md` Part 4.

---

## BUG-004 — ✅ ADDRESSED: project_member.user_id has no FK to auth.users

**File:** `supabase/migrations/20260615000009_user_profile_roles.sql`
**Severity:** HIGH → **ADDRESSED**
**Fix applied:** Migration 009 deletes placeholder UUIDs from seed data and adds `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.
**Remaining:** Requires applying migration 009 with real Supabase credentials.

---

## BUG-005 — ✅ RESOLVED: No user_profile table

**Severity:** MEDIUM → **RESOLVED**
**Fix applied:** Migration 009 creates `user_profile` table with role CHECK, auto-create trigger on auth.users INSERT, and SECURITY DEFINER helper functions (`is_admin`, `is_manager_or_admin`, `is_project_member`).

---

## BUG-006 — ✅ RESOLVED: Issue comments have no UI

**File:** `src/routes/issues.index.tsx`
**Severity:** MEDIUM → **RESOLVED**
**Fix applied:** `IssueComments` component added: expandable per-card thread, shows existing comments, inline add-comment form with Send button. Uses `useAddIssueComment` + `useSession`.

---

## BUG-007 — ✅ RESOLVED: Management comments on tasks not implemented

**Severity:** MEDIUM → **RESOLVED**
**Fix applied:** Migration 011 creates `task_comment` table. `taskRepository.addComment()` and `useAddTaskComment()` added. Task detail page (`tasks.$taskId.tsx`) shows amber-styled management comments section with form.

---

## BUG-008 — ✅ RESOLVED: submittedBy in daily logs and task updates is free text

**Files:** `src/routes/daily-logs.new.tsx`, `src/routes/tasks.$taskId.tsx`
**Severity:** MEDIUM → **RESOLVED**
**Fix applied:** Both forms now pre-fill `submittedBy` from `session?.user?.email ?? ""`. Field remains editable.

---

## BUG-009 — INFORMATIONAL: v_missing_daily_logs view becomes stale after seed dates

**Severity:** LOW (informational)
**Status:** Expected behavior — resolved by creating real daily logs.

---

## BUG-010 — NON-BLOCKING: CRLF lint warnings on Windows

**Severity:** LOW
**Status:** Run `npm run format` to normalize. Non-blocking.

---

## BUG-011 — ✅ RESOLVED: Excel export was a placeholder

**File:** `src/routes/reports.index.tsx`
**Severity:** LOW → **RESOLVED**
**Fix applied:** `src/lib/csv-export.ts` — zero-dependency CSV with UTF-8 BOM for Hebrew Excel compatibility. Bulk export and per-report export both implemented. `xlsx` package (5 HIGH vulnerabilities) was installed then immediately uninstalled; replaced with native solution.

---

## BUG-012 — DEFERRED: Large bundle chunks

**Severity:** LOW
**Status:** Deferred to Phase 5 hardening. index.js ~780KB (gzip ~231KB). Code-split Recharts.

---

## BUG-013 — ✅ RESOLVED: project_member table had no RLS

**File:** `supabase/migrations/20260615000012_project_member_rls.sql`
**Severity:** HIGH (security gap) → **RESOLVED**
**Root cause:** Migrations 007 and 010 both missed `project_member` when enabling RLS. Any authenticated user could read, insert, update, or delete project memberships.
**Fix applied:** Migration 012 enables RLS on `project_member` and creates four policies: `pm_select` (own rows or manager+), `pm_insert_manager`, `pm_update_admin`, `pm_delete_admin`.

---

## Summary

| Priority | Count | Bugs |
|---|---|---|
| ✅ RESOLVED | 8 | BUG-001, BUG-002, BUG-005, BUG-006, BUG-007, BUG-008, BUG-011, BUG-013 |
| ✅ ADDRESSED (pending infra) | 2 | BUG-003, BUG-004 |
| INFORMATIONAL | 1 | BUG-009 |
| NON-BLOCKING | 1 | BUG-010 |
| DEFERRED | 1 | BUG-012 |
| **OPEN BLOCKERS** | **0** | All code-fixable issues resolved |
