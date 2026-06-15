# DATABASE_RISK_REPORT.md
> Generated: 2026-06-15
> Auditor: Deployment Review — based on full source read of all 12 migration files
> Status: Pre-deployment — no migrations have been applied yet
> Scope: Risk identification only. No migrations executed by this report.

---

## Risk Level Key

| Level | Meaning |
|---|---|
| LOW | Safe to run. Additive only. Failure is a clean error, not silent data loss. |
| MEDIUM | Conditional risk. Safe only if prerequisites are met or environment is correct. |
| HIGH | Will cause irreversible data loss or total access lockout if run incorrectly. |

---

## Migration 001 — Core Tables
**File:** `supabase/migrations/20260615000001_create_tables.sql`
**Risk Level: LOW**

| Property | Detail |
|---|---|
| Purpose | Creates 11 tables: `project`, `daily_log`, `project_member`, `contractor_row`, `equipment_row`, `issue`, `photo`, `issue_comment`, `blocker`, `decision`, `report` |
| Dependencies | None — must run first |
| DROP statements | None |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | None |
| Role dependencies | None |
| Admin dependencies | None |
| Data-loss risk | None |
| Re-run safe? | **NO** — `CREATE TABLE` fails if tables already exist (clean error, no silent damage) |
| Rollback | `DROP TABLE IF EXISTS report, decision, blocker, issue_comment, photo, issue, equipment_row, contractor_row, project_member, daily_log, project CASCADE;` |

**Notes:** `daily_log` has a hard constraint `CHECK (date <= CURRENT_DATE)` — no future-dated logs. `photo` has a constraint requiring exactly one of `(daily_log_id, issue_id)` to be non-null. `project_member.user_id` has no FK to `auth.users` at this stage — added in 009.

---

## Migration 002 — Views
**File:** `supabase/migrations/20260615000002_create_views.sql`
**Risk Level: LOW**

| Property | Detail |
|---|---|
| Purpose | Creates 4 dashboard views: `v_project_health`, `v_missing_daily_logs`, `v_open_blockers`, `v_pending_decisions` |
| Dependencies | Migration 001 |
| DROP statements | None |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | None |
| Role dependencies | None |
| Admin dependencies | None |
| Data-loss risk | None |
| Re-run safe? | **YES** — `CREATE OR REPLACE VIEW` |
| Rollback | `DROP VIEW IF EXISTS v_project_health, v_missing_daily_logs, v_open_blockers, v_pending_decisions;` |

**Notes:** `v_missing_daily_logs` uses `HAVING MAX(dl.date) < CURRENT_DATE OR MAX(dl.date) IS NULL` — correctly excludes projects that have a log today. `v_project_health` is a 6-table LEFT JOIN; performance acceptable at MVP scale.

---

## Migration 003 — Triggers
**File:** `supabase/migrations/20260615000003_create_triggers.sql`
**Risk Level: LOW**

| Property | Detail |
|---|---|
| Purpose | Creates 7 triggers across 5 tables |
| Dependencies | Migration 001 |
| DROP statements | None |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | None |
| Role dependencies | None |
| Admin dependencies | None |
| Data-loss risk | None |
| Re-run safe? | **PARTIAL** — `CREATE OR REPLACE FUNCTION` is safe; `CREATE TRIGGER` (without `OR REPLACE`) will error if trigger already exists |
| Rollback | Drop each trigger and function individually |

**Triggers created:**
- `trg_project_updated_at` / `trg_daily_log_updated_at` / `trg_issue_updated_at` / `trg_blocker_updated_at` / `trg_decision_updated_at` — all BEFORE UPDATE, maintain `updated_at`
- `trg_assign_log_number` — BEFORE INSERT on `daily_log`; assigns sequential `log_number` per project using MAX+1
- `trg_issue_resolved_at` / `trg_blocker_resolved_at` — BEFORE UPDATE; captures first transition to resolved/closed
- `trg_prevent_log_edit_if_report_sent` — BEFORE UPDATE on `daily_log`; raises Hebrew exception if report is `sent`
- `trg_prevent_log_delete_if_report_sent` — BEFORE DELETE on `daily_log`; same guard

**Notes:** The `assign_log_number` trigger uses `COALESCE(MAX(log_number), 0) + 1`. A unique constraint `UNIQUE (project_id, log_number)` backstops rare concurrent inserts. Immutability triggers fire Hebrew error messages — these will surface directly in the UI via PostgREST error propagation.

---

## Migration 004 — Seed Data (DEVELOPMENT ONLY)
**File:** `supabase/migrations/20260615000004_seed_data.sql`
**Risk Level: MEDIUM**

| Property | Detail |
|---|---|
| Purpose | Inserts Hebrew construction demo data: 3 projects, 24 daily logs, 16 issues, 11 blockers, 10 decisions, 19 reports, contractor + equipment rows, 5 project_members (placeholder UUIDs), 16 photos |
| Dependencies | Migrations 001, 002, 003 |
| DROP statements | None |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | None |
| Role dependencies | None — no FK to auth.users at this stage |
| Admin dependencies | None |
| Data-loss risk | None directly, but **this migration is destructively affected by 009** |
| Re-run safe? | **NO** — runs in a `DO $$` block with fresh `gen_random_uuid()` calls; re-running creates duplicate data |
| Rollback | Truncate all tables (destructive) |

**⚠️ CRITICAL WARNING — interaction with migration 009:**
Migration 004 inserts 5 `project_member` rows with placeholder UUIDs (`00000000-...-0001`, `0002`, `0003`, `0010`). Migration 009 **explicitly deletes** all rows with those UUIDs via a `DELETE FROM project_member` statement. After migration 009 runs, all seed project memberships will be gone. Real `project_member` rows must be re-inserted with real `auth.users` UUIDs.

**⚠️ PRODUCTION WARNING:** Do NOT run this migration on production. Demo data cannot be cleanly removed without truncating all tables.

---

## Migration 005 — Site Table
**File:** `supabase/migrations/20260615000005_add_site_table.sql`
**Risk Level: LOW**

| Property | Detail |
|---|---|
| Purpose | Creates `site` table; adds nullable `site_id` column to `project` |
| Dependencies | Migration 001 (`project` table), Migration 003 (`set_updated_at` function) |
| DROP statements | None |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | None |
| Role dependencies | None |
| Admin dependencies | None |
| Data-loss risk | None — `site_id` on `project` is nullable; existing project rows unaffected |
| Re-run safe? | **NO** — `CREATE TABLE site` fails if table exists; `ADD COLUMN IF NOT EXISTS` is safe |
| Rollback | `ALTER TABLE project DROP COLUMN site_id; DROP TABLE site;` |

**Notes:** `project.site_id` FK is `ON DELETE SET NULL` — deleting a site does not cascade to projects.

---

## Migration 006 — Task Tables
**File:** `supabase/migrations/20260615000006_add_task_tables.sql`
**Risk Level: LOW**

| Property | Detail |
|---|---|
| Purpose | Creates `task` and `task_update` tables; creates `auto_update_task_progress` trigger |
| Dependencies | Migration 001 (`project` table), Migration 003 (`set_updated_at` function) |
| DROP statements | None |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | None |
| Role dependencies | None |
| Admin dependencies | None |
| Data-loss risk | None |
| Re-run safe? | **NO** — `CREATE TABLE` will fail if tables exist |
| Rollback | `DROP TABLE task_update, task CASCADE;` |

**Notes:** `auto_update_task_progress` is AFTER INSERT on `task_update`. It auto-updates `task.progress` and `task.status` (`in_progress` if progress > 0, `completed` if progress = 100). `task_update` is intentionally immutable — no UPDATE policy is granted.

---

## Migration 007 — Permissive RLS
**File:** `supabase/migrations/20260615000007_add_rls_auth.sql`
**Risk Level: MEDIUM**

| Property | Detail |
|---|---|
| Purpose | Enables RLS on 13 tables; sets permissive `USING (true)` policies allowing all authenticated users full access |
| Dependencies | Migrations 001, 005, 006 |
| DROP statements | **YES** — drops ALL existing policies on ALL public tables via a `DO $$` loop |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | **DESTRUCTIVE** — `DROP POLICY IF EXISTS` on every policy in `pg_policies WHERE schemaname = 'public'` |
| Role dependencies | None |
| Admin dependencies | None |
| Data-loss risk | No data loss, but **if run after migration 010, it destroys strict RLS** |
| Re-run safe? | **DANGEROUS** — re-running after 010 wipes all strict policies and replaces with permissive ones, exposing all data to all authenticated users |
| Rollback | Re-run migration 010 to restore strict policies |

**⚠️ CRITICAL WARNING:** This migration's policy-drop loop is unconditional. If migration 007 is ever re-run after migration 010 has been applied, all role-scoped security is silently destroyed and replaced with `USING (true)` (any authenticated user reads all data). Do not re-run 007 after 010 is in production.

**Note:** `project_member` table is NOT included in migration 007's RLS setup — this was the security gap corrected by migration 012.

---

## Migration 008 — Seed Sites and Tasks (DEVELOPMENT ONLY)
**File:** `supabase/migrations/20260615000008_seed_sites_tasks.sql`
**Risk Level: MEDIUM**

| Property | Detail |
|---|---|
| Purpose | Inserts 3 sites; links projects to sites; inserts 6 tasks |
| Dependencies | Migrations 001, 005, 006 — **AND migration 004 must have run** (fetches project rows by `ORDER BY created_at`) |
| DROP statements | None |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | None |
| Role dependencies | None |
| Admin dependencies | None |
| Data-loss risk | None directly |
| Re-run safe? | **NO** — inserts sites with fresh UUIDs; re-running creates duplicate sites and assigns wrong `site_id` to projects |
| Rollback | Delete the 3 site rows and reset `project.site_id = NULL` |

**⚠️ PRODUCTION WARNING:** Do NOT run this migration on production.

**⚠️ Fragile project lookup:** The migration fetches existing projects using `ORDER BY created_at LIMIT 1 OFFSET N`. If migration 004 was not run, or if other projects exist in a different order, the site-to-project assignments will be wrong or silently assign to incorrect projects.

---

## Migration 009 — User Profiles and Role System
**File:** `supabase/migrations/20260615000009_user_profile_roles.sql`
**Risk Level: HIGH**

| Property | Detail |
|---|---|
| Purpose | Creates `user_profile` table; creates `handle_new_user` trigger on `auth.users`; creates 3 SECURITY DEFINER role-helper functions; adds FK on `project_member.user_id`; adds `task.assigned_to_user_id` column |
| Dependencies | Migration 001 (`project_member`, `task` tables), Migration 003 (`set_updated_at`) |
| DROP statements | None |
| DELETE statements | **YES — DESTRUCTIVE** — deletes 4 placeholder UUID rows from `project_member` |
| TRUNCATE statements | None |
| Policy operations | Creates 1 permissive policy on `user_profile` |
| Role dependencies | Reads/writes `auth.users` (via trigger on `auth.users`) |
| Admin dependencies | None directly — but this migration must run before admin user creation triggers auto-profile |
| Data-loss risk | **YES** — deletes seed `project_member` rows with placeholder UUIDs. If real project_member rows exist with non-auth UUIDs, the FK addition in step 2 will FAIL. |
| Re-run safe? | **NO** — `CREATE TABLE`, `ADD CONSTRAINT`, `CREATE TRIGGER` will all fail if already present |
| Rollback | Complex: drop FK, drop `user_profile`, drop 3 functions, drop trigger on `auth.users` |

**DELETE statement (exact):**
```sql
DELETE FROM public.project_member
WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000010'
);
```

**⚠️ FK FAILURE RISK:** If any existing `project_member` rows have a `user_id` that does not exist in `auth.users`, the `ADD CONSTRAINT fk_project_member_user` will fail with a foreign key violation. This blocks the entire migration. Resolution: delete or update the offending rows before running 009.

**⚠️ After this migration:** Every subsequent Supabase Auth user creation will auto-insert a `user_profile` row with `role = 'field_manager'`. The admin user must be created AFTER this migration and their role manually updated to `'admin'` BEFORE migration 010.

**SECURITY DEFINER functions created:**
- `is_admin()` — bypasses RLS when evaluating `user_profile`
- `is_manager_or_admin()` — same
- `is_project_member(p_project_id UUID)` — correctly bypasses `project_member` RLS (needed because 012 adds RLS to that table; SECURITY DEFINER prevents circular RLS lock)

---

## Migration 010 — Strict Role-Based RLS
**File:** `supabase/migrations/20260615000010_strict_rls.sql`
**Risk Level: HIGH**

| Property | Detail |
|---|---|
| Purpose | Replaces ALL permissive policies with strict role-scoped policies across 14 tables |
| Dependencies | Migration 009 (functions `is_admin`, `is_manager_or_admin`, `is_project_member` must exist); admin `user_profile` row must exist with `role = 'admin'` |
| DROP statements | **YES** — drops ALL policies on ALL public tables (same unconditional loop as 007) |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | **DESTRUCTIVE THEN RECONSTRUCTIVE** — drops all policies, then creates ~30 strict policies |
| Role dependencies | Calls `is_admin()`, `is_manager_or_admin()`, `is_project_member()` — 009 must be complete |
| Admin dependencies | **CRITICAL** — if no `user_profile` row with `role = 'admin'` exists, `is_admin()` returns FALSE for every session, all write/delete operations fail for all users |
| Data-loss risk | No direct data loss, but **total access lockout** if admin user_profile row is missing |
| Re-run safe? | **YES** — drops all policies before recreating, so re-run safely restores intended state |
| Rollback | Re-run migration 007 to restore permissive policies (only if admin lockout occurs and data access is needed) |

**⚠️ LOCKOUT RISK — THE MOST DANGEROUS MIGRATION:**
If you run migration 010 without a `user_profile` row with `role = 'admin'`:
- `is_admin()` returns `FALSE` for all sessions
- All INSERT, UPDATE, DELETE policies require `is_admin()` or `is_manager_or_admin()`
- Both functions return `FALSE` for every user
- All authenticated users become effectively read-only on most tables
- The admin cannot promote themselves because `user_profile` UPDATE also requires `is_admin()`
- **Recovery requires service_role access (Supabase SQL Editor) to insert/update user_profile directly**

**Verify before running 010:**
```sql
SELECT COUNT(*) FROM public.user_profile WHERE role = 'admin';
-- Must return 1 or more
```

**Note:** `project_member` table is NOT included in migration 010's policy scope. Migration 012 addresses this separately.

---

## Migration 011 — Task Comments
**File:** `supabase/migrations/20260615000011_task_comments.sql`
**Risk Level: LOW**

| Property | Detail |
|---|---|
| Purpose | Creates `task_comment` table for management annotations on tasks |
| Dependencies | Migration 006 (`task` table), Migration 009 (`is_manager_or_admin`, `is_admin` functions, `set_updated_at`) |
| DROP statements | None |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | Creates 4 RLS policies |
| Role dependencies | Uses `is_manager_or_admin()`, `is_admin()`, `is_project_member()` |
| Admin dependencies | None at run time — functions must exist (009 provides them) |
| Data-loss risk | None |
| Re-run safe? | **NO** — `CREATE TABLE` fails if table exists |
| Rollback | `DROP TABLE task_comment CASCADE;` |

**Notes:** `task_comment.author_id` FK to `auth.users` is `ON DELETE SET NULL` — deleting a user preserves their comments with a null author. Only managers and admins can insert comments (`tc_insert_manager`). Field managers can read but not write.

---

## Migration 012 — Project Member RLS
**File:** `supabase/migrations/20260615000012_project_member_rls.sql`
**Risk Level: LOW**

| Property | Detail |
|---|---|
| Purpose | Enables RLS on `project_member` table; creates 4 scoped policies |
| Dependencies | Migration 009 (`is_admin`, `is_manager_or_admin` functions) |
| DROP statements | None |
| DELETE statements | None |
| TRUNCATE statements | None |
| Policy operations | Creates 4 new policies (does not drop existing) |
| Role dependencies | Uses `is_manager_or_admin()`, `is_admin()` |
| Admin dependencies | None at run time |
| Data-loss risk | None |
| Re-run safe? | **PARTIAL** — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on an already-RLS-enabled table is a no-op; `CREATE POLICY` will error if policies already exist |
| Rollback | `DROP POLICY pm_select, pm_insert_manager, pm_update_admin, pm_delete_admin ON public.project_member; ALTER TABLE public.project_member DISABLE ROW LEVEL SECURITY;` |

**Security note:** `is_project_member()` is SECURITY DEFINER. It reads `project_member` directly (bypassing RLS) when evaluating other tables' policies. This is intentional and correct — without it, checking project membership from within an RLS policy would itself be blocked by `project_member`'s own RLS, creating a circular lockout.

---

## Destructive Operations Summary

| Migration | Operation | Target | Scope |
|---|---|---|---|
| 007 | `DROP POLICY IF EXISTS` (loop) | ALL policies in `public` schema | Everything in `pg_policies WHERE schemaname = 'public'` |
| 009 | `DELETE FROM` | `project_member` | 4 placeholder UUID rows only |
| 010 | `DROP POLICY IF EXISTS` (loop) | ALL policies in `public` schema | Everything in `pg_policies WHERE schemaname = 'public'` |

---

## Policy Replacement Operations

Both migration 007 and migration 010 use an identical `DO $$` loop that drops **every policy on every table in the public schema** before recreating. This means:

- Running 007 after 010 wipes all strict role-based security (critical risk)
- Running 010 after 009 without an admin `user_profile` row causes access lockout (critical risk)
- The loop is unconditional — it does not check which migration last ran

---

## Role and Admin Dependencies Summary

| Migration | Requires roles/functions | Requires admin account |
|---|---|---|
| 001–008 | None | No |
| 009 | None (creates them) | No — creates the foundation for admin |
| 010 | `is_admin()`, `is_manager_or_admin()`, `is_project_member()` | **YES — admin user_profile row must exist** |
| 011 | Same 3 functions | No |
| 012 | `is_admin()`, `is_manager_or_admin()` | No |

---

## Identified Risk Summary

| # | Risk | Severity | Triggered by | Mitigation |
|---|---|---|---|---|
| R1 | Running 010 without admin user_profile → total access lockout | CRITICAL | Running 010 before admin creation | Create admin user + set role='admin', verify count before 010 |
| R2 | Running 007 after 010 → destroys strict RLS | CRITICAL | Re-running 007 in production | Never re-run 007 after 010 is applied |
| R3 | 009 DELETE removes seed project_member rows | HIGH | Running 009 after seed data | Expected behavior — re-add real rows after 009 |
| R4 | FK violation if project_member has non-auth UUIDs | HIGH | Running 009 with bad data | Verify/clean project_member before 009 |
| R5 | Migration 008 picks wrong projects if 004 not run | MEDIUM | Running 008 without 004 | Only run 008 in demo environments after 004 |
| R6 | Seed data on production creates unreachable demo records | MEDIUM | Running 004 or 008 on production | Skip 004 and 008 for production |
| R7 | Re-running 001/005/006/009/011 after first run | LOW | Operator error | These fail cleanly with error; no silent damage |

---

## Phase 4 — Deployment Order Confirmation

**No dependency conflicts found.** The following order is verified correct:

```
PHASE A — Run before admin creation:
  001  Core tables
  002  Views
  003  Triggers
  005  Site table
  006  Task tables
  007  Permissive RLS
  009  User profiles + role functions

  ── STOP ──
  Create admin user in Supabase Auth dashboard
  Set user_profile.role = 'admin' in SQL Editor
  Verify: SELECT COUNT(*) FROM public.user_profile WHERE role = 'admin'; → must be 1

PHASE B — Run after admin creation:
  010  Strict role-based RLS     ← LOCKOUT RISK if admin missing
  011  Task comments
  012  Project member RLS
```

**Dependency note:** Migration 011 depends on functions from 009 and the task table from 006 — both are in Phase A, so 011 in Phase B is safe. Migration 012 depends on `is_admin()` and `is_manager_or_admin()` from 009 — also in Phase A.

---

## Phase 5 — Runtime Environment Verification

**Supabase URL the application expects:**
`https://nxvovzcadxcntogwxsoh.supabase.co` (from `.env.local`)

**Supported environment variables (as of commit d4fe763):**

| Variable | File | Behavior |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts:3` | Required. Must contain `.supabase.co`. |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts:4` | Primary key. Used if present. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `src/lib/supabase.ts:5` | Fallback key. Used if ANON_KEY absent. |

**DEV_BYPASS logic (as of d4fe763):**
```ts
const _anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "";
const DEV_BYPASS =
  !import.meta.env.VITE_SUPABASE_URL?.includes(".supabase.co") ||
  _anonKey.length < 20 ||
  _anonKey === "your-anon-key-here";
```

**Commit d4fe763 correctness:** CONFIRMED. The `??` chaining correctly prefers `VITE_SUPABASE_ANON_KEY` and falls back to `VITE_SUPABASE_PUBLISHABLE_KEY`. If neither is set, `_anonKey` is `""` (length 0 < 20), so DEV_BYPASS = true and the yellow bypass banner appears. This is the correct behavior.

**Remaining deployment risks:**

| Risk | Description | Resolution |
|---|---|---|
| Lovable deployment env vars | `.env.local` is git-ignored and not available to Lovable's build system | Add both vars to Lovable project settings (Dashboard → Project Settings → Environment Variables) |
| Email autoconfirm OFF | Admin user cannot log in until email is confirmed | Enable "Auto Confirm Users" temporarily in Supabase Auth Settings before creating admin |
| Seed project_member rows gone after 009 | If demo data was used, all project memberships were deleted by 009's DELETE statement | Re-insert project_member rows with real auth.users UUIDs after migrations complete |
| task.assigned_to_user_id NULL for all seed tasks | Seed tasks use display-name TEXT for `assigned_to`, not UUIDs | Populate `assigned_to_user_id` with real UUIDs after user creation |
