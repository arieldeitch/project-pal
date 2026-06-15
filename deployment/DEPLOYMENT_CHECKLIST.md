# Deployment Checklist — Mehayesod Platform

---

## Pre-Deployment Checks

- [ ] Supabase project is created and accessible
- [ ] Supabase project URL confirmed (ends in `.supabase.co`)
- [ ] Supabase anon key confirmed (`sb_publishable_` or `eyJ` format)
- [ ] Supabase SQL Editor is accessible (Dashboard → SQL Editor)
- [ ] Email confirmation is disabled OR you are prepared to confirm the admin email manually
- [ ] No existing tables in the `public` schema (fresh project)
- [ ] `auth.users` table is empty (no prior users)
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env.local`
- [ ] Local dev build passes: `npm run build`

---

## Migration Execution Checklist — Phase A

Run each file in the Supabase SQL Editor in this exact order.
Paste the full file contents. Do not skip files. Do not reorder.

- [ ] **001.sql** — Core tables (project, daily_log, project_member, contractor_row, equipment_row, issue, photo, issue_comment, blocker, decision, report)
  - Expected: 11 tables created, 0 errors
- [ ] **002.sql** — Views (v_project_health, v_missing_daily_logs, v_open_blockers, v_pending_decisions)
  - Expected: 4 views created, 0 errors
- [ ] **003.sql** — Triggers and functions (set_updated_at, assign_log_number, set_resolved_at, prevent_log_edit/delete)
  - Expected: 5 functions, 7 triggers created, 0 errors
- [ ] **005.sql** — Site table + project.site_id FK
  - Expected: 1 table, 1 column added, 0 errors
- [ ] **006.sql** — Task and task_update tables + auto_update_task_progress trigger
  - Expected: 2 tables, 1 function, 2 triggers created, 0 errors
- [ ] **007.sql** — Permissive RLS (authenticated users can do everything)
  - Expected: RLS enabled on 13 tables, 13 policies created, 0 errors
  - WARNING: This migration drops ALL existing policies before recreating. Do not re-run after 010.
- [ ] **009.sql** — user_profile table, handle_new_user trigger, role helper functions, project_member FK
  - Expected: 1 table, 1 trigger on auth.users, 3 SECURITY DEFINER functions, FK constraint added, 0 errors
  - NOTE: placeholder seed rows (00000000-...) are deleted from project_member during this migration

---

## Admin Creation Checklist

Complete this section BEFORE running Phase B. Running 010.sql without an admin causes total lockout.

- [ ] Go to Supabase Dashboard → Authentication → Users
- [ ] Click "Invite user" or "Add user"
- [ ] Enter admin email address
- [ ] Set a secure password
- [ ] Click "Create user"
- [ ] Copy the new user's UUID from the users list
- [ ] Go to SQL Editor and run:

```sql
-- Replace <USER_UUID> with the actual UUID from the users list
INSERT INTO public.user_profile (id, full_name, role)
VALUES ('<USER_UUID>', 'Admin User', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

- [ ] Verify the insert succeeded:

```sql
SELECT id, full_name, role FROM public.user_profile WHERE role = 'admin';
```

- [ ] Confirm: at least 1 row returned with role = 'admin'
- [ ] If email confirmation is required: confirm the email before proceeding
- [ ] Test login in the application with the admin credentials

---

## Migration Execution Checklist — Phase B

Only run Phase B after admin creation is verified.

- [ ] **010.sql** — Strict role-based RLS (replaces all permissive policies)
  - Expected: all permissive policies dropped, ~30 strict policies created, 0 errors
  - WARNING: This migration drops ALL existing policies. If no admin exists, all users will be locked out.
  - VERIFY AFTER: log in as admin and confirm you can read data
- [ ] **011.sql** — task_comment table + 4 RLS policies
  - Expected: 1 table, 1 trigger, 4 policies created, 0 errors
- [ ] **012.sql** — RLS for project_member table (security gap fix)
  - Expected: RLS enabled, 4 policies created on project_member, 0 errors

---

## Optional Seed Data (Development Only — Do NOT Run on Production)

- [ ] **004.sql** — Full development seed data (3 projects, 24 logs, 16 issues, 11 blockers, 10 decisions, 19 reports)
  - WARNING: Uses placeholder UUIDs. Must run BEFORE 009.sql or placeholders will fail the FK check.
  - PRODUCTION: Skip entirely.
- [ ] **008.sql** — Site and task seed data (3 sites, 6 tasks, links projects to sites)
  - Depends on: 004.sql projects existing and 005.sql/006.sql tables existing.
  - PRODUCTION: Skip entirely.

---

## Post-Deployment Verification Checklist

Run `POST_DEPLOYMENT_VERIFICATION.sql` in the SQL Editor and confirm all checks pass.

### Tables
- [ ] All 15 tables exist in the public schema
- [ ] RLS is enabled on all 15 tables
- [ ] Total policy count ≥ 38

### Functions
- [ ] `set_updated_at` exists
- [ ] `assign_log_number` exists
- [ ] `set_resolved_at` exists
- [ ] `prevent_log_edit_if_report_sent` exists
- [ ] `prevent_log_delete_if_report_sent` exists
- [ ] `handle_new_user` exists
- [ ] `is_admin` exists
- [ ] `is_manager_or_admin` exists
- [ ] `is_project_member` exists
- [ ] `auto_update_task_progress` exists
- [ ] `current_user_role` exists

### Triggers
- [ ] `trg_project_updated_at` on project
- [ ] `trg_daily_log_updated_at` on daily_log
- [ ] `trg_assign_log_number` on daily_log
- [ ] `trg_prevent_log_edit_if_report_sent` on daily_log
- [ ] `trg_prevent_log_delete_if_report_sent` on daily_log
- [ ] `trg_issue_updated_at` on issue
- [ ] `trg_issue_resolved_at` on issue
- [ ] `trg_blocker_updated_at` on blocker
- [ ] `trg_blocker_resolved_at` on blocker
- [ ] `trg_decision_updated_at` on decision
- [ ] `trg_site_updated_at` on site
- [ ] `trg_task_updated_at` on task
- [ ] `trg_auto_update_task_progress` on task_update
- [ ] `trg_task_comment_updated_at` on task_comment
- [ ] `trg_user_profile_updated_at` on user_profile
- [ ] `trg_on_auth_user_created` on auth.users

### Views
- [ ] `v_project_health` exists
- [ ] `v_missing_daily_logs` exists
- [ ] `v_open_blockers` exists
- [ ] `v_pending_decisions` exists

### Admin
- [ ] At least 1 user_profile row with role = 'admin'
- [ ] Admin user can log in to the application
- [ ] Admin user can see all projects

### Application Smoke Test
- [ ] Login page loads at `/login`
- [ ] Admin credentials log in successfully
- [ ] Dashboard loads with no errors
- [ ] Sites list loads
- [ ] Projects list loads
- [ ] Tasks list loads
- [ ] No console errors on page load
- [ ] DEV_BYPASS is NOT active (auth gate is enforced)
