# SUPABASE_DEPLOYMENT_CHECKLIST.md
> Generated: 2026-06-15
> Purpose: Exact step-by-step guide to deploy all 12 migrations and connect the app.
> Status: Ready for execution — requires Supabase project credentials.

---

## Prerequisites

- A Supabase project created at https://app.supabase.com
- Access to the project Settings > API page
- Access to the SQL Editor

---

## PART 1 — Environment Variables

### Step 1.1 — Locate credentials

In your Supabase project: **Settings → API**

Copy:
- `VITE_SUPABASE_URL` = the **Project URL** (format: `https://abcdefghijk.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` = the **anon public** key

### Step 1.2 — Create `.env.local`

In the project root (`project-pal/`), create `.env.local`:

```
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Never commit `.env.local` to git. It is already in `.gitignore`.**

---

## PART 2 — Apply Migrations

### Order is mandatory. Run each file in sequence in the Supabase SQL Editor.

| # | File | What it does | Safe to re-run? |
|---|---|---|---|
| 001 | `20260615000001_create_tables.sql` | All core tables (project, daily_log, issue, etc.) | ❌ No — tables already exist will error |
| 002 | `20260615000002_create_views.sql` | 4 aggregate views (v_project_health, etc.) | ✅ Yes — CREATE OR REPLACE |
| 003 | `20260615000003_create_triggers.sql` | 7 triggers (updated_at, log_number, resolved_at, immutability) | ✅ Yes — CREATE OR REPLACE |
| 004 | `20260615000004_seed_data.sql` | Hebrew dev seed data (3 projects, 24 logs, 16 issues…) | ❌ No — will duplicate data |
| 005 | `20260615000005_add_site_table.sql` | `site` table + `project.site_id` FK | ❌ No — table already exists will error |
| 006 | `20260615000006_add_task_tables.sql` | `task`, `task_update` tables + auto-progress trigger | ❌ No |
| 007 | `20260615000007_add_rls_auth.sql` | Enable RLS + permissive USING(true) policies on 13 tables | ✅ Yes — drops existing then recreates |
| 008 | `20260615000008_seed_sites_tasks.sql` | 3 sites, link to projects, 6 tasks | ❌ No — will duplicate data |
| 009 | `20260615000009_user_profile_roles.sql` | `user_profile` table, role helper functions, FK to auth.users | ❌ No |
| **010** | **`20260615000010_strict_rls.sql`** | **Strict role-based RLS — STOP before this step** | ✅ Yes |
| 011 | `20260615000011_task_comments.sql` | `task_comment` table + RLS | ❌ No |
| 012 | `20260615000012_project_member_rls.sql` | RLS on `project_member` table | ✅ Yes |

---

## PART 3 — ⚠️ CRITICAL: Before Running Migration 010

Migration 010 replaces all permissive `USING(true)` policies with role-based policies.
**If you run it before creating an admin user, ALL users will be locked out.**

### Step 3.1 — Create the first user in Supabase Auth

In Supabase Dashboard: **Authentication → Users → Invite user** (or Add user)

Create:
```
Email: admin@mehayesod.co.il
Password: (strong password)
```

Copy the UUID of this user from the users table.

### Step 3.2 — Set admin role (run in SQL Editor)

```sql
-- Replace the UUID below with the actual admin user UUID from Step 3.1
UPDATE public.user_profile
SET role = 'admin', full_name = 'מנהל מערכת'
WHERE id = '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS UUID
```

If the trigger hasn't fired yet (sometimes delayed), insert manually:
```sql
INSERT INTO public.user_profile (id, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'מנהל מערכת', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'מנהל מערכת';
```

### Step 3.3 — Verify admin exists

```sql
SELECT id, full_name, role FROM public.user_profile WHERE role = 'admin';
-- Must return at least one row before running migration 010
```

### Step 3.4 — Run migration 010

Now apply `20260615000010_strict_rls.sql` in the SQL Editor.

### Step 3.5 — Test admin login

Log into the app as the admin user. Verify all pages load data.

---

## PART 4 — Create Additional Users

### Step 4.1 — Company Manager

In Supabase Dashboard: **Authentication → Users → Add user**

```sql
-- After creating user, set role:
UPDATE public.user_profile
SET role = 'company_manager', full_name = 'שם המנהל'
WHERE id = 'UUID-OF-NEW-USER';
```

### Step 4.2 — Field Managers (Employees)

```sql
-- After creating each user (role defaults to 'field_manager' via trigger):
UPDATE public.user_profile
SET full_name = 'שם העובד'
WHERE id = 'UUID-OF-EMPLOYEE';
```

### Step 4.3 — Add employees to projects

```sql
-- Link employee to a project
INSERT INTO public.project_member (project_id, user_id, role)
VALUES (
    (SELECT id FROM public.project WHERE name = 'הצלפים 24 - רעננה'),
    'UUID-OF-EMPLOYEE',
    'field_manager'
);
```

### Step 4.4 — Assign tasks to employees

```sql
-- Set task.assigned_to_user_id for RLS enforcement
UPDATE public.task
SET assigned_to_user_id = 'UUID-OF-EMPLOYEE'
WHERE assigned_to = 'יוסי כהן'; -- match seed data text name
```

---

## PART 5 — Verification Queries

Run these after full deployment to confirm health:

```sql
-- 1. All tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- rowsecurity = true for all tables

-- 2. Count policies per table
SELECT tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3. Verify role helpers exist
SELECT proname FROM pg_proc
WHERE proname IN ('is_admin','is_manager_or_admin','is_project_member','current_user_role','handle_new_user')
AND pronamespace = 'public'::regnamespace;
-- Should return 5 rows

-- 4. Verify seed data
SELECT COUNT(*) FROM public.project;      -- expect 3
SELECT COUNT(*) FROM public.site;         -- expect 3
SELECT COUNT(*) FROM public.task;         -- expect 6
SELECT COUNT(*) FROM public.daily_log;    -- expect 24

-- 5. Verify user profile exists for admin
SELECT id, role FROM public.user_profile WHERE role = 'admin';
-- Must return at least 1 row
```

---

## PART 6 — Verify App

1. Open the app (dev: `npm run dev`)
2. Log in as admin → all routes load → sites/projects/tasks show seed data
3. Log in as company_manager → all data visible, cannot access site management
4. Log in as field_manager → only assigned projects visible

---

## Known Constraints

| Constraint | Impact |
|---|---|
| `daily_log.date <= CURRENT_DATE` | Cannot create future-dated logs. By design. |
| `uq_daily_log_project_date` | One log per project per day. Duplicate will return HTTP 409. |
| Seed project_member rows deleted in migration 009 | Placeholder UUIDs removed — re-add with real auth UUIDs |
| Migration 004 creates logs up to 2026-06-15 | Seed logs already exist for Jun 1-15. New logs start Jun 16+. |
