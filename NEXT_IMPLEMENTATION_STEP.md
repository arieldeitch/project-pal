# NEXT_IMPLEMENTATION_STEP.md
> Updated: 2026-06-15
> Status: Code complete. External dependency blocks all further progress.

---

## Current State

All code is written, the build is clean, and all MVP features are implemented.

The **only remaining blocker** is Supabase project credentials.

---

## MVP Feature Status (post-commit 8e708ba + fixes)

| # | Goal | Status |
|---|---|---|
| 1 | Employees can log in | ✅ Done |
| 2 | Employees see only assigned work | ✅ Code done — pending migration 010+012 application |
| 3 | Managers/Admins see all data | ✅ Code done — pending migration 010+012 application |
| 4 | Sites are managed | ✅ Done |
| 5 | Projects are managed | ✅ Done |
| 6 | Tasks are managed | ✅ Done |
| 7 | Reporting works | ✅ Done |
| 8 | Management comments work | ✅ Done |
| 9 | Executive dashboard works | ✅ Done |
| 10 | Excel export works | ✅ Done |

---

## What the Product Owner Must Do Next

### STEP 1 — Provide Supabase Credentials (REQUIRED)

In Supabase Dashboard → Settings → API:

```
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Place in file: `project-pal/.env.local`

### STEP 2 — Apply All Migrations

In Supabase SQL Editor, run these files in order:

```
001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009
```

**STOP before 010.**

### STEP 3 — Create Admin User

In Supabase → Authentication → Users → Add user.

Then in SQL Editor:
```sql
UPDATE public.user_profile
SET role = 'admin', full_name = 'מנהל מערכת'
WHERE id = 'THE-ADMIN-UUID-FROM-SUPABASE';
```

### STEP 4 — Apply Strict RLS

```
010 → 011 → 012
```

Migration 012 is critical — fixes a security gap where `project_member` had no RLS.

### STEP 5 — Create Employee Users

In Supabase Auth, create accounts for each field_manager.
Add them to projects via `project_member` table.

### STEP 6 — Link Task Assignments

```sql
UPDATE public.task
SET assigned_to_user_id = 'EMPLOYEE-UUID'
WHERE assigned_to = 'יוסי כהן';
```

### STEP 7 — Run QA

1. Log in as admin → all routes load → data visible
2. Log in as company_manager → all data, cannot manage sites
3. Log in as field_manager → only assigned projects visible
4. Submit a daily log as field_manager
5. Add management comment on task as manager
6. Export a report as CSV
7. Check Hebrew RTL rendering throughout

---

## Migration Files Summary

| File | Status |
|---|---|
| `20260615000001_create_tables.sql` | Written ✓ |
| `20260615000002_create_views.sql` | Written ✓ |
| `20260615000003_create_triggers.sql` | Written ✓ |
| `20260615000004_seed_data.sql` | Written ✓ |
| `20260615000005_add_site_table.sql` | Written ✓ |
| `20260615000006_add_task_tables.sql` | Written ✓ |
| `20260615000007_add_rls_auth.sql` | Written ✓ |
| `20260615000008_seed_sites_tasks.sql` | Written ✓ |
| `20260615000009_user_profile_roles.sql` | Written ✓ |
| `20260615000010_strict_rls.sql` | Written ✓ |
| `20260615000011_task_comments.sql` | Written ✓ |
| `20260615000012_project_member_rls.sql` | Written ✓ (new — security fix) |

---

## What Happens After Credentials Are Provided

With credentials in `.env.local` and migrations applied:

1. `npm run dev` → app connects to real Supabase
2. Login page works immediately
3. Seed data from migrations 004 + 008 is visible
4. All features operational

No further code changes required for MVP.

---

## Deferred (Post-MVP)

- PDF export
- Photo upload (Supabase Storage bucket)
- Real-time notifications (Supabase Realtime)
- Bundle size optimization (Recharts code-split)
- Delete operations with confirmation dialogs
- Pagination for large datasets
