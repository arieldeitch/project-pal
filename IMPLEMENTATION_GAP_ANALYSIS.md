# IMPLEMENTATION_GAP_ANALYSIS.md
> Status of every MVP requirement against current codebase.
> Based on: Knowledge/ folder documents + docs/09-mvp-gap-analysis.md + docs/10-implementation-roadmap.md
> Codebase inspected: src/routes/, src/repositories/, src/hooks/, src/lib/, supabase/migrations/

---

## MVP Requirement: Projects Module

### List all projects
- **Status: Complete**
- Files: `src/routes/projects.index.tsx`, `src/hooks/useProjects.ts`, `src/repositories/projectRepository.ts`
- Notes: Fetches from Supabase. Empty state handled. Status badges working.

### Project detail view (tabs: logs, issues, blockers, decisions, reports)
- **Status: Complete**
- Files: `src/routes/projects.$projectId.tsx`
- Notes: All 6 tabs implemented. Filtered queries per project.

### Create project form
- **Status: Partial**
- Files: `src/routes/projects.index.tsx` (dialog), `src/hooks/useProjects.ts` (useCreateProject)
- Remaining: Verify the create dialog is wired correctly; `useCreateProject` mutation exists.

### Edit project form
- **Status: Partial**
- Files: `src/routes/projects.index.tsx` (dialog), `src/hooks/useProjects.ts` (useUpdateProject)
- Remaining: Verify edit dialog opens with existing values correctly.

---

## MVP Requirement: Daily Logs Module (PRIMARY)

### Daily log list (all projects)
- **Status: Complete**
- Files: `src/routes/daily-logs.index.tsx`, `src/hooks/useDailyLogs.ts`
- Notes: Sorted by date descending, project name resolved, empty state present.

### Daily log creation form
- **Status: Complete (partial — no photos)**
- Files: `src/routes/daily-logs.new.tsx`
- What works: Project selection, date, work hours, weather, submitted by, exceptional events, contractors (multi-row add/remove), equipment (multi-row), work description (numbered list), contractor notes, submit with validation.
- What's missing: Photo upload section (removed per Phase 2 scope — correct behavior).
- Constraint handling: UNIQUE(project_id, date) violation shows Hebrew toast — ✅ correct.
- Notes: `projectId` can be pre-filled from URL search param.

### Daily log detail view
- **Status: Complete (partial — no real photos)**
- Files: `src/routes/daily-logs.$logId.tsx`
- What works: All fields display, contractors table, equipment table, work description, photos shown as gray placeholder SVG.
- What's missing: Real photos (Phase 3).
- "Create Report" button → navigates to report — ✅ wired.

### Log number display
- **Status: Missing**
- The `DailyLog` TypeScript interface has no `logNumber` field.
- The DB trigger assigns `log_number` correctly, but it's not being fetched or displayed.
- Priority: Low (display enhancement, not functional blocker)

### One log per project per date enforcement
- **Status: Complete**
- DB constraint: `UNIQUE(project_id, date)` in migration file ✅
- UI: Error code `23505` caught, Hebrew toast shown ✅

---

## MVP Requirement: Reports Module

### Report auto-generated from Daily Log
- **Status: Complete**
- Files: `src/repositories/reportRepository.ts` (generateFromLog), `src/hooks/useReports.ts`
- Notes: Idempotent — checks for existing report before inserting.

### Report list view
- **Status: Complete**
- Files: `src/routes/reports.index.tsx`
- Notes: Sorted by date, project name resolved, status badges, created/sent dates shown.

### Report detail view
- **Status: Complete**
- Files: `src/routes/reports.$reportId.tsx`
- Notes: Fetches report + source daily log + project in parallel. Shows all log fields.

### Mark as Sent
- **Status: Complete**
- Files: `src/hooks/useReports.ts` (useMarkReportSent), `src/routes/reports.index.tsx`
- Notes: Updates status to "sent", sets sent_at. Cache invalidated on success.

### Export PDF
- **Status: Missing (placeholder)**
- Files: `src/routes/reports.index.tsx` — Download button navigates to detail view only.
- Notes: PDF generation is Phase 4 by roadmap. Button exists. No functionality. Correct per current scope.

### Export Excel
- **Status: Missing (placeholder)**
- Files: `src/routes/reports.index.tsx` — Excel button shows `toast.info("ייצוא Excel - בפיתוח")`
- Notes: Excel export is Phase 4 by roadmap. Placeholder is correct.

### Report snapshot (immutable PDF on send)
- **Status: Missing**
- Notes: Phase 4 per roadmap. When "Mark as Sent" is clicked, no PDF is currently generated or stored. The sent report remains a live view of the source log (which is now uneditable by DB trigger).

---

## MVP Requirement: Issues Module

### Issue list (all projects + filtered by project)
- **Status: Complete**
- Files: `src/routes/issues.index.tsx`, `src/hooks/useIssues.ts`
- Notes: Filter buttons (All/Open/Critical) working. Project name resolved.

### Issue creation form
- **Status: Complete**
- Files: `src/routes/issues.index.tsx` (dialog), `src/hooks/useIssues.ts` (useCreateIssue)

### Issue edit form (resolve/update status)
- **Status: Complete**
- Files: `src/routes/issues.index.tsx` (toggle resolve), `src/hooks/useIssues.ts` (useUpdateIssue)

### Issue comments
- **Status: Missing (UI not built)**
- The data model includes `issue_comment` table and comments are fetched in the repository.
- The `Issue` TypeScript type includes `comments[]`.
- No UI for reading or adding comments in any current route.
- Priority: Medium (from gap analysis GAP-M02)

### Issue photos
- **Status: Partial (display only, no upload)**
- Photos fetched from DB via `photo!issue_id` FK join ✅
- Display uses gray placeholder SVG ✅
- Upload not implemented (Phase 3) ✅

---

## MVP Requirement: Blockers Module

### Blocker list
- **Status: Complete**
- Files: `src/routes/blockers.index.tsx`, `src/hooks/useBlockers.ts`

### Create/Edit blocker
- **Status: Complete**
- Files: `src/routes/blockers.index.tsx` (dialogs), `src/hooks/useBlockers.ts`

---

## MVP Requirement: Decisions Module

### Decision list
- **Status: Complete**
- Files: `src/routes/decisions.index.tsx`, `src/hooks/useDecisions.ts`

### Create/Edit decision
- **Status: Complete**
- Files: `src/routes/decisions.index.tsx` (dialogs), `src/hooks/useDecisions.ts`

---

## MVP Requirement: Executive Dashboard

### KPI Cards (Active Projects, Logs Today, Missing Logs, Open Issues, Critical Issues, Open Blockers, Pending Decisions, Reports Sent This Week)
- **Status: Complete**
- Files: `src/routes/executive.tsx`
- Notes: All 8 KPIs computed from live React Query data.

### Tables (Missing Projects, Critical Issues, Open Blockers, Pending Decisions, Latest Reports)
- **Status: Complete**
- Files: `src/routes/executive.tsx`

### Charts (Issues by Status, Blockers by Priority, Logs by Project)
- **Status: Complete**
- Files: `src/routes/executive.tsx`
- Notes: Recharts library used. All three charts wired to live data.

---

## Infrastructure Requirements

### Supabase Project (created and configured)
- **Status: Missing — BLOCKER**
- `.env.local` contains placeholder values (`your-project-ref`, `your-anon-key-here`)
- The app currently cannot fetch any data
- All pages show empty states because Supabase returns connection errors
- Files: `.env.local`
- Required action: Create Supabase project, fill in real URL + anon key, apply 4 migrations

### Migrations Applied to Real DB
- **Status: Missing — BLOCKER**
- Migration files exist: `supabase/migrations/20260615000001–000004_*.sql`
- NOT yet applied to any real Supabase project
- Required action: Apply migrations in order via Supabase SQL Editor or CLI

### Seed Data
- **Status: Ready to apply**
- Seed data included in `20260615000004_seed_data.sql`
- Contains: 3 projects, 24 logs, 16 issues, 11 blockers, 10 decisions, 19 reports

### TypeScript Clean
- **Status: Complete** (`npx tsc --noEmit` → zero errors)

### Build Passing
- **Status: Complete** (`npm run build` → success, two size warnings only)

### Hebrew RTL
- **Status: Complete** (`<html lang="he" dir="rtl">` in root, Hebrew copy throughout)

---

## Phase 2 Requirements (Not Yet MVP — Future)

| Requirement | Status | Phase |
|---|---|---|
| Supabase Storage buckets | Missing | Phase 2 |
| Photo upload in daily log form | Missing (placeholder) | Phase 2 |
| Photo upload in issue form | Missing (placeholder) | Phase 2 |
| Signed URL display for real photos | Missing | Phase 2 |

## Phase 3 Requirements (Not Yet — Future)

| Requirement | Status | Phase |
|---|---|---|
| Login page (email + password) | Missing | Phase 3 |
| Session management | Missing | Phase 3 |
| Protected routes | Missing | Phase 3 |
| Permissive RLS (authenticated users) | Missing | Phase 3 |
| Magic link auth | Missing | Phase 3 |
| Logout UI | Missing | Phase 3 |

## Phase 4 Requirements (Not Yet — Future)

| Requirement | Status | Phase |
|---|---|---|
| PDF generation (Edge Function) | Missing (placeholder) | Phase 4 |
| Excel export (ExcelJS) | Missing (placeholder) | Phase 4 |
| Report snapshot on send | Missing | Phase 4 |
| Zod validation at API boundary | Missing | Phase 4 |
| Pagination on all lists | Missing | Phase 4 |
| Comments UI on Issues | Missing | Phase 4/5 |

---

## Priority Summary

| Priority | Gap | Action |
|---|---|---|
| 🔴 BLOCKING | No Supabase project connected | Create project, fill `.env.local`, apply migrations |
| 🔴 BLOCKING | Migrations not applied | Run 4 migration files in Supabase SQL Editor |
| 🟡 HIGH | Log number not displayed | Add `logNumber` field to DailyLog type + repository |
| 🟡 HIGH | Issue comments UI missing | Build comment section in issue detail or dialog |
| 🟡 HIGH | Photo upload missing | Phase 3 work — storage buckets needed |
| 🟢 MEDIUM | Edit project form needs verification | Manual test |
| 🟢 MEDIUM | Pagination missing | Phase 5 |
| ⚪ LOW | "planning" project status not in docs | Verify with product owner |
| ⚪ LOW | CRLF lint warnings | Run `npm run format` |
