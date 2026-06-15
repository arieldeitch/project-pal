# Real Data Integration Validation — Mehayesod Platform

> Phase: Execution Phase 2 — Real Data Integration
> Status: Ready for manual verification

---

## Pre-flight Checklist

Before testing the app, ensure:

1. **`.env.local` is populated** with real values:
   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

2. **All Phase 1 migrations applied** to the Supabase project:
   - `20260615000001_create_tables.sql`
   - `20260615000002_create_views.sql`
   - `20260615000003_create_triggers.sql`
   - `20260615000004_seed_data.sql`

3. **Dev server running**: `npm run dev`

---

## Validation Scenarios

### 1. Dashboard (/)

- [ ] All 6 stat cards display numbers (not 0 while loading)
- [ ] "Active projects" count matches DB: `SELECT COUNT(*) FROM project WHERE status = 'active'`
- [ ] "Recent logs" table shows logs sorted by date descending
- [ ] "Missing logs today" table shows active projects without a log for today
- [ ] "Critical items" table shows critical issues and blockers

### 2. Projects List (/projects/)

- [ ] 3 projects appear (from seed data)
- [ ] "Last log" column shows correct date for each project
- [ ] Open issue/blocker counts are accurate

### 3. Project Detail (/projects/:id)

- [ ] Project name, address, client, manager display correctly
- [ ] "Missing log today" warning appears if no log exists for today
- [ ] All 6 tabs load data (overview, logs, issues, blockers, decisions, reports)
- [ ] Overview tab shows the latest log's work description

### 4. Daily Logs List (/daily-logs/)

- [ ] 24 logs appear (from seed data), sorted date descending
- [ ] "Today" badge appears on any log submitted today
- [ ] Contractor count column shows correct numbers

### 5. Daily Log Detail (/daily-logs/:id)

- [ ] All log fields render (date, hours, weather, submitter)
- [ ] Contractors table shows all rows for that log
- [ ] Equipment table shows all rows for that log
- [ ] Work description list renders
- [ ] "Create Report" button works → navigates to new report

### 6. Create Daily Log (/daily-logs/new)

- [ ] Project dropdown is populated from DB
- [ ] Submitting with a valid payload creates a new log in Supabase
- [ ] After creation, user is redirected to the new log's detail page
- [ ] **Duplicate date + project** shows Hebrew error: "כבר קיים יומן לתאריך זה בפרויקט זה"
- [ ] Missing project or submitter shows validation toast

### 7. Issues (/issues/)

- [ ] Issues load from DB (16 from seed)
- [ ] Filter buttons (All / Open / Critical) work correctly
- [ ] "Resolve" button updates status in DB (verify in Supabase Table Editor)
- [ ] "New Issue" dialog creates issue in DB
- [ ] "Edit Issue" dialog updates issue in DB

### 8. Blockers (/blockers/)

- [ ] All 11 blockers appear
- [ ] Create/Edit dialog saves to DB

### 9. Decisions (/decisions/)

- [ ] All 10 decisions appear
- [ ] Create/Edit dialog saves to DB

### 10. Reports List (/reports/)

- [ ] 19 reports appear from seed data
- [ ] "Mark Sent" button updates status in DB (only appears for non-sent reports)
- [ ] Sent reports show `sent_at` date

### 11. Report Detail (/reports/:id)

- [ ] Report header shows correct project / date / type
- [ ] Associated daily log data (contractors, equipment, work description) renders
- [ ] "Mark Sent" button works and refreshes the page state

### 12. Executive Dashboard (/executive)

- [ ] All 8 stat cards show correct numbers
- [ ] Pie chart (issues by status) renders with real data
- [ ] Bar chart (blockers by priority) renders with real data
- [ ] Bar chart (logs by project) renders with real data
- [ ] All 4 detail tables populate correctly

---

## DB-Side Spot Checks

Run these in Supabase SQL Editor after testing:

```sql
-- Verify a newly created daily log exists
SELECT id, project_id, date, log_number FROM daily_log ORDER BY created_at DESC LIMIT 1;

-- Verify log_number was auto-assigned (trigger)
SELECT project_id, log_number, date FROM daily_log ORDER BY project_id, log_number;

-- Verify a resolved issue has resolved_at set
SELECT id, status, resolved_at FROM issue WHERE status = 'resolved' ORDER BY updated_at DESC LIMIT 5;

-- Verify a generated report has correct fields
SELECT id, project_id, daily_log_id, type, status FROM report ORDER BY created_at DESC LIMIT 5;

-- Verify mark-sent updated both status and sent_at
SELECT id, status, sent_at FROM report WHERE status = 'sent' ORDER BY sent_at DESC LIMIT 5;
```

---

## Known Limitations (Phase 2 Scope)

| Limitation | Reason |
|---|---|
| Photos show gray placeholders for seed data | Storage not implemented (Phase 2 scope) |
| Photo upload removed from create form | No file upload (Phase 2 scope) |
| "Edit" button on log detail does nothing | Edit-after-create not in scope |
| PDF / Excel export shows toast placeholder | Not in Phase 2 scope |
| No authentication guard | Auth is Phase 3 |
