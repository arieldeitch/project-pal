# BUG_LIST.md
> Generated: 2026-06-15
> Source: Static code review + migration analysis
> Severity: CRITICAL > HIGH > MEDIUM > LOW

---

## BUG-001 — CRITICAL: projectRepository missing siteId in create/update

**File:** `src/repositories/projectRepository.ts`
**Severity:** CRITICAL
**Impact:** Sites cannot be associated with projects through the UI. Assigning a project to a site silently drops the siteId.

**Root cause:** The `create()` and `update()` methods were not updated when `siteId` was added to the `Project` type.

**Current code (create):**
```typescript
.insert({
  name: input.name, address: input.address, client: input.client,
  manager: input.manager, status: input.status,
  start_date: input.startDate, target_date: input.targetDate,
  // ❌ MISSING: site_id: input.siteId ?? null
})
```

**Fix:** Add `site_id: input.siteId ?? null` to both `create()` and `update()` patch.
**Status:** OPEN — fix in progress

---

## BUG-002 — HIGH: No Create/Edit Project UI

**File:** `src/routes/projects.index.tsx`
**Severity:** HIGH
**Impact:** Users cannot create or edit projects from the UI. The `useCreateProject` and `useUpdateProject` hooks exist but are not wired to any dialog.

**Fix:** Add create + edit dialogs to projects.index.tsx.
**Status:** OPEN

---

## BUG-003 — HIGH: task.assigned_to is TEXT, not linked to auth.users

**File:** `supabase/migrations/20260615000006_add_task_tables.sql`, `src/repositories/taskRepository.ts`
**Severity:** HIGH
**Impact:** Employee task filtering ("show me only my tasks") is impossible. Text field cannot be used for RLS.

**Fix:** Add `assigned_to_user_id UUID REFERENCES auth.users(id)` column to `task` table. Keep TEXT field for display name until full profile system is in place.
**Status:** OPEN — blocked on user_profile implementation

---

## BUG-004 — HIGH: project_member.user_id has no FK to auth.users

**File:** `supabase/migrations/20260615000001_create_tables.sql`
**Severity:** HIGH
**Impact:** Project membership cannot be enforced. Seed data uses placeholder UUIDs that don't exist in auth.users.

**Fix:** Apply FK constraint via migration 009. Requires real auth.users rows to exist first.
**Status:** OPEN — blocked on Supabase project credentials

---

## BUG-005 — MEDIUM: No user_profile table — roles cannot be checked

**Severity:** MEDIUM
**Impact:** Role-based RLS cannot be implemented. All authenticated users are treated equally.

**Fix:** Create `user_profile` table with FK to `auth.users(id)` and role column.
**Status:** OPEN

---

## BUG-006 — MEDIUM: Issue comments have no UI

**File:** `src/routes/issues.index.tsx`, `src/routes/projects.$projectId.tsx`
**Severity:** MEDIUM
**Impact:** Issue comments exist in the database (`issue_comment` table with 10 seed rows) and are fetched in `issueRepository.ts`, but there is no UI to read or write them.

**Fix:** Add comment section to issue detail view (or expand issue dialog).
**Status:** OPEN

---

## BUG-007 — MEDIUM: Management comments on tasks not implemented

**Severity:** MEDIUM
**Impact:** Managers cannot add feedback/comments on task updates. The `task_update` table is employee-only. No `task_comment` table exists for management review.

**Fix:** Add `task_comment` table for manager/admin comments on tasks, plus UI in tasks.$taskId.tsx.
**Status:** OPEN

---

## BUG-008 — MEDIUM: submittedBy in daily logs is free text, not linked to auth user

**Files:** `src/routes/daily-logs.new.tsx`, `src/repositories/dailyLogRepository.ts`
**Severity:** MEDIUM
**Impact:** No way to auto-populate submittedBy from auth session. Employee can submit as any name.

**Fix:** Pre-fill `submittedBy` from `session.user.email` or `user_profile.full_name` in the daily log creation form.
**Status:** OPEN — depends on user_profile

---

## BUG-009 — LOW: v_missing_daily_logs view will become stale after seed dates pass

**File:** `supabase/migrations/20260615000002_create_views.sql`
**Severity:** LOW
**Impact:** Once today's date passes the latest seed log date (2026-06-15), all active projects will show as "missing logs today" indefinitely until real logs are created.

**Fix:** Not a code bug — expected behavior. Resolved by creating real daily logs.
**Status:** INFORMATIONAL

---

## BUG-010 — LOW: CRLF lint warnings in Windows environment

**Severity:** LOW
**Impact:** `npm run lint` exits with code 1 due to prettier CRLF warnings. Not real errors.

**Fix:** `npm run format` normalizes line endings.
**Status:** NON-BLOCKING

---

## BUG-011 — LOW: Excel export is a placeholder

**File:** `src/routes/reports.index.tsx`
**Severity:** LOW (per MVP priority order — Excel is item #9)
**Impact:** Excel button shows toast "ייצוא Excel - בפיתוח" with no functionality.

**Fix:** Implement ExcelJS export.
**Status:** OPEN — in implementation queue

---

## BUG-012 — LOW: Large bundle chunks

**Severity:** LOW
**Impact:** index.js ~780KB, executive.js ~410KB (gzip: 231KB, 111KB). Performance concern for mobile field workers on slow connections.

**Fix:** Code-split Recharts with dynamic import. Not MVP-blocking.
**Status:** DEFERRED to Phase 5 hardening

---

## Summary

| Priority | Count | Bugs |
|---|---|---|
| CRITICAL | 1 | BUG-001 |
| HIGH | 3 | BUG-002, BUG-003, BUG-004 |
| MEDIUM | 4 | BUG-005, BUG-006, BUG-007, BUG-008 |
| LOW | 4 | BUG-009, BUG-010, BUG-011, BUG-012 |
| **TOTAL** | **12** | |
