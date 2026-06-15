# DATABASE_DEPLOYMENT_ORDER.md
> Generated: 2026-06-15
> Total migrations: 12
> Execution environment: Supabase SQL Editor (Dashboard) or psql

---

## Execution Rules

1. Run each migration **in the numbered order below** — dependencies are strict
2. Verify each migration returns no errors before proceeding
3. **STOP before migration 010** — see the mandatory prerequisite
4. Migrations 004 and 008 are optional seed data — skip for production unless demo environment is desired

---

## MIGRATION 001 — Core Tables
**File:** `supabase/migrations/20260615000001_create_tables.sql`

| Field | Value |
|---|---|
| **Purpose** | Creates all 11 core application tables |
| **Creates** | `project`, `daily_log`, `project_member`, `contractor_row`, `equipment_row`, `issue`, `photo`, `issue_comment`, `blocker`, `decision`, `report` |
| **Dependencies** | None — must run first |
| **Expected outcome** | 11 tables created; 14 indexes created |
| **Rollback** | `DROP TABLE IF EXISTS report, decision, blocker, issue_comment, photo, issue, equipment_row, contractor_row, project_member, daily_log, project CASCADE;` |
| **Re-run safe?** | ❌ No — table CREATE will fail if tables exist |

---

## MIGRATION 002 — Views
**File:** `supabase/migrations/20260615000002_create_views.sql`

| Field | Value |
|---|---|
| **Purpose** | Creates 4 aggregate views used by dashboards |
| **Creates** | `v_project_health`, `v_missing_daily_logs`, `v_open_blockers`, `v_pending_decisions` |
| **Dependencies** | Migration 001 (all tables must exist) |
| **Expected outcome** | 4 views created; executive dashboard queries will work |
| **Rollback** | `DROP VIEW IF EXISTS v_project_health, v_missing_daily_logs, v_open_blockers, v_pending_decisions;` |
| **Re-run safe?** | ✅ Yes — `CREATE OR REPLACE VIEW` |

---

## MIGRATION 003 — Triggers
**File:** `supabase/migrations/20260615000003_create_triggers.sql`

| Field | Value |
|---|---|
| **Purpose** | Creates 7 triggers for data integrity |
| **Creates** | `set_updated_at` (5 tables), `assign_log_number`, `set_resolved_at`, `prevent_log_edit_if_report_sent`, `prevent_log_delete_if_report_sent` |
| **Dependencies** | Migration 001 (tables must exist) |
| **Expected outcome** | All INSERT/UPDATE operations on project, daily_log, issue, blocker, decision, report will maintain timestamps and sequential log numbers |
| **Rollback** | Drop each trigger manually; functions can remain |
| **Re-run safe?** | ✅ Yes — `CREATE OR REPLACE FUNCTION`; triggers may duplicate (benign) |
| **Critical note** | `assign_log_number` trigger fires BEFORE INSERT on daily_log — must run before any daily log data is inserted |

---

## MIGRATION 004 — Development Seed Data
**File:** `supabase/migrations/20260615000004_seed_data.sql`

| Field | Value |
|---|---|
| **Purpose** | Inserts Hebrew construction demo data |
| **Creates** | 3 projects, 5 members (placeholder UUIDs), 24 daily logs, 16 issues, 10 comments, 16 photos, 11 blockers, 10 decisions, 19 reports, contractor + equipment rows |
| **Dependencies** | Migrations 001, 002, 003 |
| **Expected outcome** | All dashboards show populated data immediately |
| **Rollback** | Truncate all tables (destructive) or delete by known UUIDs |
| **Re-run safe?** | ❌ No — will duplicate data |
| **⚠️ Production note** | **SKIP for production.** Apply only for demo or development environments. |

---

## MIGRATION 005 — Site Table
**File:** `supabase/migrations/20260615000005_add_site_table.sql`

| Field | Value |
|---|---|
| **Purpose** | Adds `site` table and `project.site_id` FK column |
| **Creates** | `site` table, `idx_site_status` index, `trg_site_updated_at` trigger, `site_id` column on project |
| **Dependencies** | Migration 001 (project table), Migration 003 (`set_updated_at` function) |
| **Expected outcome** | `/sites` routes become functional; projects can be linked to sites |
| **Rollback** | `ALTER TABLE project DROP COLUMN site_id; DROP TABLE site;` |
| **Re-run safe?** | ❌ No — table CREATE will fail |

---

## MIGRATION 006 — Task Tables
**File:** `supabase/migrations/20260615000006_add_task_tables.sql`

| Field | Value |
|---|---|
| **Purpose** | Adds `task` and `task_update` tables with auto-progress trigger |
| **Creates** | `task` table, `task_update` table, 5 indexes, `auto_update_task_progress()` function + trigger |
| **Dependencies** | Migration 001 (project table), Migration 003 (`set_updated_at` function) |
| **Expected outcome** | `/tasks` routes become functional; submitting a task_update automatically updates task.progress and task.status |
| **Rollback** | `DROP TABLE task_update, task CASCADE;` |
| **Re-run safe?** | ❌ No |

---

## MIGRATION 007 — Permissive RLS
**File:** `supabase/migrations/20260615000007_add_rls_auth.sql`

| Field | Value |
|---|---|
| **Purpose** | Enables RLS on 13 tables; sets permissive `USING(true)` policies |
| **Creates** | `ENABLE ROW LEVEL SECURITY` on 13 tables; 13 permissive policies |
| **Dependencies** | Migrations 001, 005, 006 |
| **Expected outcome** | Authenticated users can read/write all data; unauthenticated requests return 0 rows (PostgREST blocks them) |
| **Rollback** | Remove policies; disable RLS on each table |
| **Re-run safe?** | ✅ Yes — drops existing policies before recreating |
| **Note** | This is an intermediate state. Migration 010 replaces these policies with strict ones. |

---

## MIGRATION 008 — Site + Task Seed Data
**File:** `supabase/migrations/20260615000008_seed_sites_tasks.sql`

| Field | Value |
|---|---|
| **Purpose** | Inserts 3 sites, links them to projects, inserts 6 tasks |
| **Dependencies** | Migrations 001, 005, 006 — and migration 004 must have run (needs project rows) |
| **Expected outcome** | `/sites` shows 3 sites; `/tasks` shows 6 tasks; each project has a site_id |
| **Rollback** | Delete the 3 site rows (cascades to project.site_id = NULL); delete 6 task rows |
| **Re-run safe?** | ❌ No — will create duplicate sites |
| **⚠️ Production note** | **SKIP for production.** Apply only for demo/development. |

---

## MIGRATION 009 — User Profiles + Role System
**File:** `supabase/migrations/20260615000009_user_profile_roles.sql`

| Field | Value |
|---|---|
| **Purpose** | Creates `user_profile` table, role helper functions, and auth.users FK on project_member |
| **Creates** | `user_profile` table, `handle_new_user()` trigger on auth.users, `is_admin()`, `is_manager_or_admin()`, `is_project_member()` SECURITY DEFINER functions, `assigned_to_user_id` column on task |
| **Dependencies** | Migration 001 (project_member table), Migration 003 (`set_updated_at`) |
| **Expected outcome** | Every new Supabase Auth user automatically gets a user_profile row with `role = 'field_manager'`; role helper functions are available for migration 010 |
| **Rollback** | Complex — involves dropping FK from project_member, dropping user_profile, dropping 3 functions |
| **Re-run safe?** | ❌ No — table and FK CREATE will fail |
| **⚠️ Important** | **After running this migration, immediately create your admin user.** See CRITICAL STOP below. |
| **Side effect** | Deletes placeholder project_member rows with UUIDs `00000000-...-0001` through `0003` and `0010` |

---

## ⚠️ CRITICAL STOP — DO THIS BEFORE MIGRATION 010

**Failure to complete these steps before migration 010 will lock all users out of all data.**

### Step A — Create admin user in Supabase Auth

Supabase Dashboard → Authentication → Users → Add user

Create: `admin@yourcompany.co.il` (or your chosen admin email)

### Step B — Set admin role in SQL Editor

```sql
-- Get the admin UUID:
SELECT id, email FROM auth.users ORDER BY created_at LIMIT 5;

-- Set admin role (replace UUID):
INSERT INTO public.user_profile (id, full_name, role)
VALUES ('ADMIN-UUID-HERE', 'מנהל מערכת', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'מנהל מערכת';
```

### Step C — Verify before proceeding

```sql
SELECT id, full_name, role FROM public.user_profile WHERE role = 'admin';
-- Must return exactly 1 row
```

---

## MIGRATION 010 — Strict Role-Based RLS
**File:** `supabase/migrations/20260615000010_strict_rls.sql`

| Field | Value |
|---|---|
| **Purpose** | Replaces all permissive policies with role-scoped policies |
| **Creates** | `current_user_role()` helper; ~30 policies across 14 tables |
| **Drops** | All existing policies (from migrations 007 + 009) before recreating |
| **Dependencies** | Migration 009 (role helper functions must exist); admin user_profile row must exist |
| **Expected outcome** | field_manager users see only their assigned projects; company_manager sees all; admin has full CRUD |
| **Rollback** | Re-run migration 007 (re-creates permissive policies) — but note 007's drop loop will clear 010's policies first |
| **Re-run safe?** | ✅ Yes — drops existing policies before recreating |
| **⚠️ Critical** | Admin user must exist in `user_profile` before running this migration |

---

## MIGRATION 011 — Task Comments
**File:** `supabase/migrations/20260615000011_task_comments.sql`

| Field | Value |
|---|---|
| **Purpose** | Creates `task_comment` table for management annotations on tasks |
| **Creates** | `task_comment` table, 2 indexes, updated_at trigger, 4 RLS policies |
| **Dependencies** | Migration 006 (task table), Migration 009 (role helper functions) |
| **Expected outcome** | Management comments section on task detail page becomes functional |
| **Rollback** | `DROP TABLE task_comment CASCADE;` |
| **Re-run safe?** | ❌ No — table CREATE will fail |

---

## MIGRATION 012 — Project Member RLS
**File:** `supabase/migrations/20260615000012_project_member_rls.sql`

| Field | Value |
|---|---|
| **Purpose** | Enables RLS on `project_member` table — was missing from migrations 007 and 010 |
| **Creates** | `ENABLE ROW LEVEL SECURITY` on project_member; 4 policies |
| **Dependencies** | Migration 009 (`is_admin`, `is_manager_or_admin` functions must exist) |
| **Expected outcome** | field_managers can only see their own project_member rows; managers see all; admin has full CRUD |
| **Rollback** | Drop the 4 policies; `ALTER TABLE project_member DISABLE ROW LEVEL SECURITY;` |
| **Re-run safe?** | ✅ Yes — enabling RLS on already-enabled table is a no-op; policies can be recreated if dropped first |
| **Note** | `is_project_member()` is SECURITY DEFINER — it correctly bypasses project_member RLS when evaluating other table policies |

---

## Execution Order Summary

```
Mandatory — Infrastructure:
  001 → 002 → 003 → 005 → 006 → 007 → 009

  [STOP: Create admin user + set role = 'admin']

  010 → 011 → 012

Optional — Demo/Dev Seed Data:
  004 (after 003)
  008 (after 006, after 004)
```

---

## Post-Deployment Verification

```sql
-- Confirm all tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: rowsecurity = true for all 15 tables

-- Count policies
SELECT tablename, COUNT(*) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- Expected: every table has at least 1 policy

-- Confirm role functions exist
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('is_admin', 'is_manager_or_admin', 'is_project_member',
                  'current_user_role', 'handle_new_user',
                  'auto_update_task_progress', 'assign_log_number',
                  'set_updated_at', 'set_resolved_at');
-- Expected: 9 rows

-- Confirm admin exists
SELECT COUNT(*) FROM public.user_profile WHERE role = 'admin';
-- Expected: >= 1
```
