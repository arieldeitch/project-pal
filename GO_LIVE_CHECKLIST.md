# GO_LIVE_CHECKLIST.md
> Generated: 2026-06-15
> Format: Each item must be checked ✅ before go-live

---

## SECTION 1 — Environment

- [ ] **1.1** `.env.local` exists in project root with real values (not placeholder)
- [ ] **1.2** `VITE_SUPABASE_URL` set to `https://[ref].supabase.co` format
- [ ] **1.3** `VITE_SUPABASE_ANON_KEY` set (starts with `eyJ...` or `sb_publishable_`)
- [ ] **1.4** `.env.local` is NOT committed to git (verify with `git status`)
- [ ] **1.5** `npm run build` completes with `✓ built` and no errors
- [ ] **1.6** No service_role key is present anywhere in `src/` (audit: `grep -r "service_role" src/`)

---

## SECTION 2 — Database

- [ ] **2.1** Migration 001 applied — all 11 core tables created
- [ ] **2.2** Migration 002 applied — 4 views created
- [ ] **2.3** Migration 003 applied — 7 triggers created
- [ ] **2.4** Migration 005 applied — `site` table and `project.site_id` column created
- [ ] **2.5** Migration 006 applied — `task`, `task_update` tables created; auto-progress trigger created
- [ ] **2.6** Migration 007 applied — RLS enabled on 13 tables with permissive policies
- [ ] **2.7** Migration 009 applied — `user_profile` table created; role helper functions created
- [ ] **2.8** ⚠️ Admin user created and role set BEFORE migration 010 (see Section 3)
- [ ] **2.9** Migration 010 applied — strict role-based RLS on all tables
- [ ] **2.10** Migration 011 applied — `task_comment` table created
- [ ] **2.11** Migration 012 applied — RLS enabled on `project_member`
- [ ] **2.12** Verification query passes:
  ```sql
  SELECT COUNT(*) FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
  -- Expected: 15
  ```
- [ ] **2.13** Verification query passes:
  ```sql
  SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
  -- Expected: 35+
  ```

**Note on seed data (migrations 004, 008):**
- [ ] **2.14** Decision made: apply seed data for demo environment? ☐ Yes / ☐ No (production skip)

---

## SECTION 3 — Authentication

- [ ] **3.1** Supabase Auth is enabled on the project (Dashboard → Authentication → Settings)
- [ ] **3.2** Email/password sign-in is enabled (Auth Providers → Email → Enabled)
- [ ] **3.3** Admin user created in Supabase Auth dashboard
- [ ] **3.4** Admin user_profile row set with `role = 'admin'`
- [ ] **3.5** Login page tested — admin can log in and reach dashboard
- [ ] **3.6** Logout tested — session cleared, redirects to `/login`
- [ ] **3.7** Refresh tested — session persists after browser refresh
- [ ] **3.8** Invalid credentials tested — shows Hebrew error message "אימייל או סיסמה שגויים"

---

## SECTION 4 — Permissions

- [ ] **4.1** Migration 010 applied (strict RLS active)
- [ ] **4.2** Migration 012 applied (project_member RLS active)
- [ ] **4.3** At least one company_manager user created and role set
- [ ] **4.4** At least one field_manager user created
- [ ] **4.5** field_manager assigned to at least one project via project_member table
- [ ] **4.6** Permission test: field_manager logs in and sees ONLY their assigned project
- [ ] **4.7** Permission test: company_manager logs in and sees ALL projects
- [ ] **4.8** Permission test: field_manager cannot create a task (RLS rejects)
- [ ] **4.9** Permission test: field_manager cannot create a blocker (RLS rejects)
- [ ] **4.10** Permission test: field_manager can create a daily_log for their project

---

## SECTION 5 — Seed / Initial Data

**For production (no seed migrations):**
- [ ] **5.1** At least one real site created via `/sites` UI (admin)
- [ ] **5.2** At least one real project created and linked to the site
- [ ] **5.3** Projects assigned to company_managers and field_managers via `project_member`
- [ ] **5.4** Tasks created for field_managers with `assigned_to_user_id` set

**For demo environment (seed migrations applied):**
- [ ] **5.1** Seed project_member rows re-added with real auth.user UUIDs (seed data used placeholder UUIDs which were deleted by migration 009)
- [ ] **5.2** `task.assigned_to_user_id` populated with real UUIDs for seed tasks

---

## SECTION 6 — Admin User

- [ ] **6.1** Admin user email documented (store securely)
- [ ] **6.2** Admin password is strong (12+ chars, mixed case, symbol)
- [ ] **6.3** Admin user_profile row verified:
  ```sql
  SELECT id, full_name, role FROM public.user_profile WHERE role = 'admin';
  ```
- [ ] **6.4** Admin can access all routes without error
- [ ] **6.5** Admin can create sites, projects, and tasks
- [ ] **6.6** Admin can create/manage user_profile roles via SQL (no UI for role management — admin SQL access required)

---

## SECTION 7 — Backup Strategy

| Item | Recommendation |
|---|---|
| **Database backup** | Supabase provides automated daily backups on Pro plan. Verify backups are enabled. |
| **Point-in-time recovery** | Available on Supabase Pro. Recommended for production. |
| **Before each migration** | Export current schema with `pg_dump` or use Supabase "Database → Backups" before running migrations |
| **Migration files** | Already version-controlled in git. Do not modify applied migrations — add new ones instead. |
| **Environment variables** | Store `.env.local` values in a password manager (1Password, Bitwarden). Never in git. |

- [ ] **7.1** Supabase project is on a paid plan with backups enabled (or manual backup taken)
- [ ] **7.2** Supabase project URL and anon key stored securely outside git
- [ ] **7.3** Admin credentials stored in password manager

---

## SECTION 8 — Verification Steps

Run these immediately after go-live:

- [ ] **8.1** All 18 routes render without 500 errors
- [ ] **8.2** `/` dashboard loads with project data
- [ ] **8.3** `/executive` dashboard loads with charts
- [ ] **8.4** `/sites` shows sites list
- [ ] **8.5** `/projects` shows project table
- [ ] **8.6** `/tasks` shows task list
- [ ] **8.7** `/daily-logs/new` form submits and creates a log
- [ ] **8.8** `/issues` shows issue cards with comment counts
- [ ] **8.9** `/reports` shows reports table; CSV export downloads a valid file
- [ ] **8.10** `/tasks/$taskId` shows progress bar; task update submits and updates progress
- [ ] **8.11** Run full MVP_ACCEPTANCE_TEST_PLAN.md (41 tests)

---

## GO/NO-GO DECISION

| Gate | Status |
|---|---|
| Build clean | ☐ Go / ☐ No-Go |
| All migrations applied | ☐ Go / ☐ No-Go |
| Admin user created and verified | ☐ Go / ☐ No-Go |
| Strict RLS active (migration 010) | ☐ Go / ☐ No-Go |
| Permission tests pass | ☐ Go / ☐ No-Go |
| All 41 acceptance tests pass | ☐ Go / ☐ No-Go |

**All gates must be Go before the system is used with real project data.**
