# Tomorrow Morning Action Plan
> Mehayesod Platform — Next Session
> Last updated: 2026-06-15

**Goal:** Connect to a real Supabase project, validate all 12 screens, produce a bug list.

---

## Step 1 — Create Supabase Project (5 min)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to Israel (e.g., `eu-central-1` Frankfurt)
3. Set a strong database password and save it
4. Wait for project to provision (~2 min)

---

## Step 2 — Fill in `.env.local` (2 min)

1. In Supabase: go to **Settings → API**
2. Copy **Project URL** (looks like `https://abcdef123.supabase.co`)
3. Copy **anon / public** key (the long JWT)
4. Open `.env.local` in project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

5. Save the file

---

## Step 3 — Run Migrations (10 min)

Apply the 4 migration files in order. Two options:

### Option A — Supabase SQL Editor (manual, no CLI needed)
1. In Supabase: go to **SQL Editor**
2. Open each file and paste + run in order:
   - `supabase/migrations/20260615000001_create_tables.sql`
   - `supabase/migrations/20260615000002_create_views.sql`
   - `supabase/migrations/20260615000003_create_triggers.sql`
   - `supabase/migrations/20260615000004_seed_data.sql`
3. Each should run without error

### Option B — Supabase CLI
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

---

## Step 4 — Validate Seed Data (5 min)

In Supabase **Table Editor**, verify:

| Table | Expected rows |
|---|---|
| project | 3 |
| daily_log | 24 |
| contractor_row | ~72 (avg 3 per log) |
| equipment_row | ~48 (avg 2 per log) |
| issue | 16 |
| issue_comment | ~25 |
| blocker | 11 |
| decision | 10 |
| report | 19 |
| photo | ~20 |

If counts don't match, re-run the seed migration.

---

## Step 5 — Run App Locally (2 min)

```bash
npm install        # if not already done
npm run dev        # → http://localhost:3000
```

Open browser to `http://localhost:3000`. You should see the dashboard.

If you see "0" everywhere — check the browser console for Supabase errors (likely wrong env vars or missing migrations).

---

## Step 6 — Test All Screens (30–45 min)

Work through each screen systematically. Open browser DevTools Network tab to watch Supabase requests.

### Dashboard (/)
- [ ] Stat cards show real numbers (not 0)
- [ ] "Active projects" = 3 (or however many are active in seed)
- [ ] "Recent logs" table is populated
- [ ] "Missing logs today" table is populated (should be 3 projects if no log for today yet)

### Projects (/projects/)
- [ ] 3 projects listed
- [ ] Correct last log date per project
- [ ] Correct open issue + blocker counts

### Project Detail (/projects/:id)
- [ ] Click each project; all 6 tabs load
- [ ] "Overview" tab shows latest log work description
- [ ] Issues/blockers/decisions/reports tabs show filtered data

### Daily Logs List (/daily-logs/)
- [ ] 24 logs listed, sorted by date descending
- [ ] Contractor count is correct

### Daily Log Detail (/daily-logs/:id)
- [ ] Click any log; all fields display
- [ ] Contractors table, equipment table, work description all show
- [ ] Photos show gray placeholder (expected — storage not implemented)
- [ ] "Create Report" button works

### Create Daily Log (/daily-logs/new)
- [ ] Project dropdown populated with 3 projects
- [ ] Fill out form and submit → log created in DB
- [ ] Redirected to new log detail page
- [ ] **Duplicate test:** submit same project + date again → Hebrew toast: "כבר קיים יומן לתאריך זה בפרויקט זה"

### Issues (/issues/)
- [ ] 16 issues listed
- [ ] Filter buttons work (All / Open / Critical)
- [ ] "Resolve" toggles status in DB (check Supabase Table Editor)
- [ ] "New Issue" dialog creates issue
- [ ] "Edit Issue" dialog updates issue

### Blockers (/blockers/)
- [ ] 11 blockers listed
- [ ] Create / Edit dialog saves to DB

### Decisions (/decisions/)
- [ ] 10 decisions listed
- [ ] Create / Edit dialog saves to DB

### Reports (/reports/)
- [ ] 19 reports listed
- [ ] "Mark Sent" updates status in DB

### Report Detail (/reports/:id)
- [ ] Click any report; full report renders (project info + log data)
- [ ] "Mark Sent" button works

### Executive Dashboard (/executive)
- [ ] 8 stat cards show real numbers
- [ ] Pie chart, bar charts render with real data

---

## Step 7 — Produce Bug List (15 min)

After testing, create `docs/BUG_LIST.md` with format:

```markdown
| Screen | Bug description | Severity | Notes |
|---|---|---|---|
| Dashboard | ... | High/Med/Low | |
```

List everything — even minor UX issues. Don't fix while testing.

---

## Step 8 — Only Then Proceed

After the bug list is written:
1. Fix any **High** severity bugs first
2. Then proceed to **Phase 3 — Storage** (photo upload)

Do NOT start Storage before validating the current state. Unknown bugs in data layer will compound.

---

## If Something Goes Wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| All stat cards show 0 | Wrong/missing env vars | Check `.env.local`; restart `npm run dev` |
| Network error in DevTools | Wrong Supabase URL | Verify `VITE_SUPABASE_URL` |
| 401 Unauthorized | Wrong anon key | Verify `VITE_SUPABASE_ANON_KEY` |
| Empty tables but no errors | Migrations not applied | Re-run migration files in order |
| UNIQUE violation on seed | Seed ran twice | `DELETE FROM report; DELETE FROM daily_log; ...` then re-seed |
| PostgREST 400 on photo query | FK disambiguation failed | Check `photo!daily_log_id` syntax in `dailyLogRepository.ts` |
