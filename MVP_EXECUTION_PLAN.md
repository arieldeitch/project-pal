# MVP_EXECUTION_PLAN.md
> Derived from: docs/10-implementation-roadmap.md, docs/09-mvp-gap-analysis.md,
>   Knowledge/MEHAYESOD PROJECT EXECUTION PLATFORM.MD
> Ordered by roadmap priority. Based solely on knowledge base documentation.
> NOTE: This plan reflects the KNOWLEDGE BASE hierarchy (Project → Daily Logs, Issues, Blockers, Decisions, Reports).
> Any departures from this plan must be documented and approved.

---

## ⚠️ PREREQUISITE: RESOLVE CONFLICTS FIRST

Before executing this plan, the following conflicts from ASSUMPTION_CONFLICT_REPORT.md must be resolved:

| Conflict | Resolution Required |
|---|---|
| CONFLICT-01: "Site → Project → Task" vs. knowledge base hierarchy | Confirm with product owner whether Site and Task entities exist |
| CONFLICT-02: Auth as MVP Priority #1 vs. knowledge base Phase 3 | Confirm whether MVP definition has changed |
| CONFLICT-07: "Task Management" not in knowledge base | Confirm whether Tasks are a new entity or a wrong term |
| CONFLICT-08: "Site Management" not in knowledge base | Confirm whether Sites are a new entity or Sites = Projects |

**If the product owner confirms the knowledge base is correct as-is, proceed with this plan.**
**If the product owner has updated the data model, update the knowledge base first, then re-plan.**

---

## Step 1: Connect to Real Supabase Project
**Priority: IMMEDIATE BLOCKER**
**Effort: 2–4 hours**
**Dependencies: None**
**Risk: Low**

### Why First
The app currently shows empty states everywhere. Nothing can be validated without real data. All subsequent testing requires a live connection.

### Tasks
1. Create Supabase project at supabase.com (region: Frankfurt eu-central-1)
2. Open Supabase → Settings → API
3. Copy Project URL → paste into `.env.local` as `VITE_SUPABASE_URL`
4. Copy anon/public key → paste into `.env.local` as `VITE_SUPABASE_ANON_KEY`
5. Apply migrations in order via Supabase SQL Editor:
   - `supabase/migrations/20260615000001_create_tables.sql`
   - `supabase/migrations/20260615000002_create_views.sql`
   - `supabase/migrations/20260615000003_create_triggers.sql`
   - `supabase/migrations/20260615000004_seed_data.sql`
6. Verify seed data: 3 projects, 24 logs, 16 issues, 11 blockers, 10 decisions, 19 reports in Table Editor
7. Run `npm run dev` → open http://localhost:3000
8. Verify dashboard shows real numbers (not empty states)

### Acceptance Criteria
- Dashboard shows: 3 active projects, 24 logs, correct counts
- All 12 routes load without errors
- No Supabase connection errors in browser console

---

## Step 2: Full Manual Validation Pass (Bug Discovery)
**Priority: HIGH — must precede any feature work**
**Effort: 2–4 hours**
**Dependencies: Step 1**
**Risk: Low**

### Why Second
No new features should be built on an unvalidated foundation. Find all existing bugs first.

### Test Script
Follow `docs/TOMORROW_ACTION_PLAN.md` (12 scenarios):

1. **Dashboard** — Stat cards match DB counts. Missing projects table populates. Critical items table populates.
2. **Projects list** — 3 projects show. Last log date correct. Issue/blocker counts correct.
3. **Project detail** — All 6 tabs load. Each tab shows filtered data.
4. **Daily logs list** — 24 logs, sorted by date desc. Contractor count shows.
5. **Daily log detail** — All fields display. Photos show gray placeholder (expected).
6. **Create daily log** — Form submits. Redirect to new log detail. Duplicate date = Hebrew toast.
7. **Issues** — 16 issues load. Filter buttons work. Resolve toggle works. New/Edit dialog works.
8. **Blockers** — 11 blockers load. Create/edit dialog works.
9. **Decisions** — 10 decisions load. Create/edit dialog works.
10. **Reports list** — 19 reports load. Mark Sent works.
11. **Report detail** — Full report renders. Associated log data shows.
12. **Executive dashboard** — All 8 KPI cards correct. Charts render.

### Output
Create `docs/BUG_LIST.md` with every issue found.

---

## Step 3: Fix High-Severity Bugs from Bug List
**Priority: HIGH**
**Effort: 1–3 days (depends on bugs found)**
**Dependencies: Step 2**
**Risk: Medium**

### Guidance
- Fix only what's broken. Do not refactor.
- Do not add features while fixing bugs.
- After fixing, re-run the affected test scenarios from Step 2.

---

## Step 4: Add Daily Log Number to Display
**Priority: MEDIUM**
**Effort: 0.5 days**
**Dependencies: Step 1**
**Risk: Low**

### Why
Log numbers appear in construction contracts and legal documents ("per Daily Log #47"). This is documented as a required field. The DB trigger assigns it correctly; the frontend just doesn't display it.

### Tasks
1. Add `logNumber?: number` to `DailyLog` interface in `src/lib/mock-data.ts`
2. Add `log_number: row.log_number as number` to `dbToDailyLog()` in `src/repositories/dailyLogRepository.ts`
3. Display `LOG-{year}-{logNumber}` format in:
   - `src/routes/daily-logs.$logId.tsx` (log detail header)
   - `src/routes/daily-logs.index.tsx` (log list)

---

## Step 5: Storage — Real Photo Uploads
**Priority: HIGH (Phase 2)**
**Effort: 3 days**
**Dependencies: Steps 1–3**
**Risk: Medium**

### Why Fifth
Photos are documented as a core Daily Log feature. "Field managers submit logs from construction sites on mobile." Photos need to work before the system is used in the field.

### Tasks
1. **Approval Brief required** (per global CLAUDE.md rules — storage configuration)
2. Create Supabase Storage bucket: `site-photos` (private)
3. Add upload flow to daily log creation form (`daily-logs.new.tsx`)
4. Add upload flow to issue creation/edit dialog
5. Client-side compression: WebP, max 1280px
6. Store photo records in `photo` table after upload
7. Display real storage URLs in log detail and issue detail views
8. Handle signed URL expiry (55-minute cache via React Query)

---

## Step 6: Authentication — Supabase Email + Password
**Priority: HIGH (Phase 3)**
**Effort: 5 days**
**Dependencies: Steps 1–5**
**Risk: High**

### Why Sixth
Authentication is explicitly Phase 3 per the roadmap. Cannot be skipped for production deployment. But it must come AFTER storage (photos) because auth changes RLS, which must work correctly with storage policies.

**APPROVAL BRIEF REQUIRED per global CLAUDE.md before starting this step.**

The brief must cover:
- Login page implementation
- Supabase Auth configuration
- Session management
- Protected route wrapper
- User roles (field_manager, company_manager, admin)
- Permissive RLS policies (Phase 3 level — any authenticated user = full access)
- `project_member` table FK to `auth.users`

### Tasks (from roadmap Phase 3)
1. Login page (`/login`) — Hebrew RTL, email + password form
2. Supabase Auth client integration
3. Session management and auto-refresh
4. `useAuth()` hook in root context
5. Protected route wrapper (redirect to /login if no session)
6. Three roles via `app_metadata`: `field_manager`, `company_manager`, `admin`
7. Permissive RLS policies (authenticated users can read/write all)
8. Logout button in sidebar
9. `submittedBy` field resolves from auth user display name

---

## Step 7: PDF Generation (Report Output)
**Priority: HIGH (Phase 4)**
**Effort: 4 days**
**Dependencies: Steps 1–6**
**Risk: High (Hebrew RTL in PDF is complex)**

### Why Seventh
The core deliverable of the entire system is the PDF report sent to clients. Without this, the system cannot replace the current manual process.

### Tasks (from roadmap Phase 4c)
1. Supabase Edge Function: `generate-pdf-report`
2. Report HTML template (Hebrew RTL, A4, company branding)
3. Hebrew font embedding (Noto Sans Hebrew)
4. PDF stored in `reports/` bucket
5. `pdf_storage_key` column added to report table (migration required — approval brief)
6. "Export PDF" button connected to Edge Function
7. Snapshot on "Mark as Sent" (generates + stores PDF immutably)

---

## Step 8: Excel Export
**Priority: MEDIUM (Phase 4)**
**Effort: 2 days**
**Dependencies: Steps 1–3**
**Risk: Low**

### Tasks
1. `ExcelJS` package (or `xlsx` — no new deps unless necessary)
2. Weekly export: aggregate daily logs for a project per week
3. "Export Excel" button connected, downloads `.xlsx`

---

## Step 9: Production Hardening
**Priority: HIGH (Phase 5)**
**Effort: 5–6 days**
**Dependencies: Steps 1–8**
**Risk: Medium**

### Key Tasks (from roadmap Phase 5)
1. Strict RLS policies (project-scoped per role via `project_member` table)
2. Error boundaries around all major UI sections
3. Loading skeleton screens
4. Pagination on all lists
5. Issue comments UI (add comment, display thread)
6. Mobile optimization pass (iOS Safari + Android Chrome)
7. Lighthouse audit (target: > 80 mobile)
8. Production Supabase project (`mehayesod-prod`)
9. Security checklist (no service_role key in frontend build)
10. Runbook (add user, run migration, rollback)

---

## Step 10: Final QA
**Priority: HIGH**
**Effort: 2 days**
**Dependencies: Steps 1–9**
**Risk: Low**

### Tasks
1. End-to-end test: field manager submits complete daily log → report auto-created → manager reviews → PDF exported → report marked sent → log becomes uneditable
2. Cross-browser test (Chrome, Safari, Firefox)
3. Mobile test (iOS Safari, Android Chrome)
4. Hebrew RTL rendering verified throughout
5. All error states tested (no connection, bad input, duplicate data)
6. CEO can complete success criteria in < 30 seconds on Executive Dashboard

---

## Effort Summary Table

| Step | Task | Effort | Phase |
|---|---|---|---|
| 1 | Connect Supabase | 2–4 hours | Now |
| 2 | Validation pass | 2–4 hours | Now |
| 3 | Fix bugs | 1–3 days | Now |
| 4 | Log number display | 0.5 days | Now |
| 5 | Storage + photos | 3 days | Phase 2 |
| 6 | Authentication | 5 days | Phase 3 |
| 7 | PDF generation | 4 days | Phase 4 |
| 8 | Excel export | 2 days | Phase 4 |
| 9 | Production hardening | 5–6 days | Phase 5 |
| 10 | Final QA | 2 days | Phase 5 |
| **Total** | | **~25 days** | |

---

## What Is NOT in This Plan (Per Knowledge Base)

The following are explicitly excluded from this execution plan because they are not in the knowledge base documentation:

- ❌ Site entity (above Project)
- ❌ Task entity (below Project)
- ❌ Employee role with restricted project scoping (Phase 5 level, not MVP)
- ❌ Management comments on reports
- ❌ AI summaries
- ❌ Kanban boards
- ❌ Gantt charts
- ❌ Workflow engine
- ❌ Push notifications
- ❌ Internal chat
- ❌ Client portal
- ❌ Mobile app (native iOS/Android)
- ❌ Integrations with ERP/accounting

If any of these are requested, update the knowledge base first, get approval, then plan.
